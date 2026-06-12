#!/usr/bin/env python3
"""Path A cleanup: recover the resolvable names among the 'ambiguous' compounds.

The first resolver (resolve-canonical-ids.py) correctly refused to force-match
messy names. Many of those are genuinely drug classes, combinations, or supplements
and should stay ambiguous. But a handful are single real drugs hidden behind noise
("Low Dose Naltrexone (LDN)" -> naltrexone, "CBD Oil (medical Grade)" -> cannabidiol).

This pass uses the LLM ONLY to propose a canonical generic (INN) name or to classify
the entry; it never emits an identifier. The free registries (ChEMBL, RxNorm) must
confirm the proposed name before anything is written, preserving the discipline that
a model proposes, the registry verifies. It then regenerates migration 051 from the
full merged set and rewrites the report, so the migration is applied exactly once.

Usage:  python3 scripts/resolve-ambiguous-cleanup.py
"""
import sys
import json
import time
import importlib.util
import pathlib
import datetime

REPO = pathlib.Path(__file__).resolve().parent.parent
REPORT = REPO / "scripts" / "audit-output" / "entity-resolution-report.json"
WORKLIST = REPO / "AMBIGUOUS-COMPOUNDS-WORKLIST.md"

# reuse the registry resolvers + migration writer from the first script
_spec = importlib.util.spec_from_file_location("resolver", REPO / "scripts" / "resolve-canonical-ids.py")
resolver = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(resolver)

# reuse the project's Anthropic client (sonnet, usage tracking, credit hard-stop)
sys.path.insert(0, str(REPO / "scripts" / "substrate"))
import llm  # noqa: E402

SYSTEM = (
    "You normalize messy drug-intervention names for a biomedical database. "
    "Given one name, decide what it denotes and return STRICT JSON only.\n"
    "Rules:\n"
    "- If it denotes a single specific drug substance, output its canonical generic "
    "(INN) name in canonical_name (e.g. 'Low Dose Naltrexone (LDN)' -> 'naltrexone'; "
    "'CBD Oil (medical grade)' -> 'cannabidiol'; 'Diazepam (Valium) Suppositories' -> 'diazepam'). "
    "Set kind='single_drug'.\n"
    "- If it denotes a drug CLASS (e.g. 'Statins', 'GLP-1 Receptor Agonists'), set "
    "kind='drug_class' and canonical_name=null.\n"
    "- If it is a COMBINATION of two or more active drugs, set kind='combination' and canonical_name=null.\n"
    "- If it is a dietary supplement, vitamin, mineral, herbal, or food (e.g. 'Spearmint Tea', "
    "'Magnesium Supplements'), set kind='supplement' and canonical_name=null.\n"
    "- If it is a non-drug intervention (e.g. 'Alcohol Cessation'), set kind='non_drug' and canonical_name=null.\n"
    "Never output an identifier. Never guess a specific drug when the name is genuinely a class. "
    'Return only: {"canonical_name": string|null, "kind": string, "reason": string}'
)

KIND_LABEL = {
    "drug_class": "Drug class",
    "combination": "Combination product",
    "supplement": "Supplement / vitamin / herbal",
    "non_drug": "Non-drug intervention",
    "single_drug": "Single drug (registry could not confirm)",
}


def main():
    report = json.loads(REPORT.read_text())
    rows = report["compounds"]
    ambiguous = [r for r in rows if r["status"] == "ambiguous"]
    print(f"Cleanup over {len(ambiguous)} ambiguous compounds (LLM proposes, registry confirms)…\n")

    recovered = 0
    for r in ambiguous:
        try:
            out = llm.complete_json(SYSTEM, f"Name: {r['name']}", max_tokens=300)
        except llm.CreditsExhausted:
            print("\n[STOP] Anthropic credits exhausted. Committing progress so far.")
            break
        except Exception as e:  # noqa: BLE001
            print(f"  [warn] {r['name'][:40]}: {e}")
            r["kind"] = "unknown"
            time.sleep(0.4)
            continue

        kind = (out or {}).get("kind")
        canon = (out or {}).get("canonical_name")
        r["kind"] = kind
        r["proposed_canonical"] = canon

        if kind == "single_drug" and canon:
            ch, _pref, atc, _m = resolver.chembl_resolve(canon)
            rx = resolver.rxnorm_resolve(canon)
            if ch or rx:
                r["chembl_id"] = ch or r.get("chembl_id")
                r["rxcui"] = rx or r.get("rxcui")
                r["atc_code"] = atc or r.get("atc_code")
                r["status"] = "resolved"
                r["chembl_source"] = "normalized+registry"
                r["normalized_from"] = canon
                recovered += 1
                print(f"  recovered  {r['name'][:34]:<34} -> {canon} ({ch or rx})")
            else:
                print(f"  still amb  {r['name'][:34]:<34} -> proposed {canon}, registry unconfirmed")
        else:
            print(f"  classified {r['name'][:34]:<34} -> {kind}")
        time.sleep(0.5)  # pace well under the 50 req/min Sonnet cap

    # recompute counts and regenerate outputs
    counts = {"resolved": 0, "ambiguous": 0, "unresolved": 0}
    for r in rows:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    report["_meta"]["compound_counts"] = counts
    report["_meta"]["cleanup_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    report["_meta"]["cleanup_usage"] = llm.usage_snapshot()

    resolver._write_migration(rows, report["conditions"])
    REPORT.write_text(json.dumps(report, indent=2))
    _write_worklist([r for r in rows if r["status"] == "ambiguous"])

    print(f"\nRecovered {recovered} compounds. New counts: {counts}")
    print(f"LLM usage: {llm.usage_snapshot()}")
    print(f"Regenerated migration 051 and {WORKLIST.name}")


def _write_worklist(ambiguous):
    by_kind = {}
    for r in ambiguous:
        by_kind.setdefault(r.get("kind") or "unknown", []).append(r)

    lines = [
        "# Ambiguous compounds — human worklist",
        "",
        f"Generated {datetime.datetime.now(datetime.timezone.utc).date()} from the Path A resolver "
        "after the automated cleanup pass. These are the names that should NOT be auto-resolved to a "
        "single ChEMBL id. Each one needs a human decision. The resolver never guessed; that is why "
        "they are here.",
        "",
        "## How to use this list",
        "",
        "For each row, pick one of:",
        "",
        "1. **Map to a single drug** — if it really is one drug we mislabeled, put its ChEMBL id in the "
        "`decision` column (e.g. `CHEMBL25`). I can then add it to migration 051.",
        "2. **Keep as a class** — for drug classes, the right move in Path B is usually a separate "
        "`class` node that links to its members, not a single ChEMBL id. Mark `decision = keep-as-class`.",
        "3. **Keep as combination** — combination products link to each component drug in Path B. Mark "
        "`decision = keep-as-combination`.",
        "4. **Supplement / non-drug** — these stay as named interventions without a ChEMBL id (ChEMBL "
        "does not cover foods/supplements/behaviors). Mark `decision = keep-as-supplement` or "
        "`keep-as-non-drug`.",
        "",
        "Nothing here blocks applying migrations 050 and 051; these rows simply carry "
        "`resolution_status = 'ambiguous'` until you decide. Hand the file back and I will fold the "
        "decisions in.",
        "",
    ]
    order = ["single_drug", "combination", "drug_class", "supplement", "non_drug", "unknown"]
    for kind in order:
        items = by_kind.get(kind)
        if not items:
            continue
        lines.append(f"## {KIND_LABEL.get(kind, kind)} ({len(items)})")
        lines.append("")
        lines.append("| compound | model's read | decision (fill in) |")
        lines.append("| --- | --- | --- |")
        for r in sorted(items, key=lambda x: x["name"].lower()):
            note = r.get("proposed_canonical") or ""
            if kind == "single_drug" and note:
                note = f"proposed `{note}`, registry could not confirm"
            lines.append(f"| {r['name']} | {note} | |")
        lines.append("")
    WORKLIST.write_text("\n".join(lines))


if __name__ == "__main__":
    main()
