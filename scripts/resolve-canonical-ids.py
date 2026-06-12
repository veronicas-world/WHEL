#!/usr/bin/env python3
"""Path A: ontology-grounded entity resolution for the core tables.

Resolves every compound to a ChEMBL id (and, where possible, an RxNorm RXCUI and
ATC code) and every condition to its MONDO/EFO id, then EMITS a reviewable backfill
migration (supabase/migrations/051_backfill_canonical_ids.sql). It writes NOTHING to
the database directly, mirroring the repo convention (scripts/substrate/*).

Registries, all free, no key, no LLM:
    compounds  -> ChEMBL (EBI REST)            chembl_id, atc_code
                  RxNorm (RxNav REST)          rxcui
                  + a high-confidence shortcut: Open Targets source rows already
                    store the canonical CHEMBL id in sources.external_id, so a
                    compound that arrived via Open Targets is resolved with no API call.
    conditions -> lib/conditions-ontology.json  mondo_id, efo_id (curated; deterministic)

Anything that does not resolve cleanly is recorded with resolution_status
'ambiguous' or 'unresolved' and listed in the report for human review. We never
force a match.

Usage:  python3 scripts/resolve-canonical-ids.py
Output: supabase/migrations/051_backfill_canonical_ids.sql
        scripts/audit-output/entity-resolution-report.json
"""
import os
import re
import ssl
import json
import time
import pathlib
import datetime
import urllib.request
import urllib.parse

REPO = pathlib.Path(__file__).resolve().parent.parent
DOTENV = REPO / ".env.local"
ONTOLOGY = REPO / "lib" / "conditions-ontology.json"
MIGRATION = REPO / "supabase" / "migrations" / "051_backfill_canonical_ids.sql"
REPORT_DIR = REPO / "scripts" / "audit-output"
REPORT = REPORT_DIR / "entity-resolution-report.json"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

UA = "Whel-Path-A-Resolver/0.1 (https://whel.bio; mailto:vla2117@columbia.edu)"
_CTX = ssl.create_default_context()
SLEEP = 0.25


# ── env + supabase (read-only) ───────────────────────────────────────────────
def load_dotenv(path=DOTENV):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and not os.environ.get(k):
            os.environ[k] = v


def sb_get(path):
    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not base or not key:
        raise RuntimeError("NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY not set in .env.local")
    req = urllib.request.Request(
        f"{base}/rest/v1/{path}",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Accept": "application/json", "User-Agent": UA},
    )
    last = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30, context=_CTX) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Supabase read failed: {last}")


def _get_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=25, context=_CTX) as r:
                return json.load(r)
        except Exception:  # noqa: BLE001
            time.sleep(0.5 * (attempt + 1))
    return None


# ── normalization ────────────────────────────────────────────────────────────
def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def name_variants(name, generic):
    """Reasonable resolution candidates, most specific first."""
    out = []
    for raw in (name, generic):
        if not raw:
            continue
        raw = raw.strip()
        out.append(raw)
        # strip a trailing parenthetical and anything after a slash (combo products)
        cleaned = re.sub(r"\s*\([^)]*\)", "", raw).split("/")[0].strip()
        if cleaned and cleaned != raw:
            out.append(cleaned)
    seen, uniq = set(), []
    for v in out:
        if norm(v) not in seen and norm(v):
            seen.add(norm(v))
            uniq.append(v)
    return uniq


# ── ChEMBL ───────────────────────────────────────────────────────────────────
def chembl_resolve(name):
    """Return (chembl_id, pref_name, atc_code, match) or (None, None, None, reason).

    match: 'exact' | 'synonym' | None. Only exact/synonym matches are accepted as
    a resolution; a non-matching top hit is returned as a candidate for review."""
    q = urllib.parse.quote(name)
    # 1) exact preferred-name match
    data = _get_json(f"https://www.ebi.ac.uk/chembl/api/data/molecule.json?pref_name__iexact={q}&limit=1")
    time.sleep(SLEEP)
    mols = (data or {}).get("molecules") or []
    if mols:
        m = mols[0]
        return m.get("molecule_chembl_id"), m.get("pref_name"), _atc(m), "exact"
    # 2) ranked search, accept only an exact pref_name / synonym match
    data = _get_json(f"https://www.ebi.ac.uk/chembl/api/data/molecule/search.json?q={q}&limit=5")
    time.sleep(SLEEP)
    mols = (data or {}).get("molecules") or []
    target = norm(name)
    for m in mols:
        if norm(m.get("pref_name")) == target:
            return m.get("molecule_chembl_id"), m.get("pref_name"), _atc(m), "exact"
        syns = {norm(s.get("molecule_synonym")) for s in (m.get("molecule_synonyms") or [])}
        if target in syns:
            return m.get("molecule_chembl_id"), m.get("pref_name"), _atc(m), "synonym"
    # nothing matched cleanly; surface the top candidate (if any) for review
    if mols:
        top = mols[0]
        return None, None, None, f"candidate:{top.get('molecule_chembl_id')}:{top.get('pref_name')}"
    return None, None, None, None


def _atc(m):
    atc = m.get("atc_classifications") or []
    return atc[0] if atc else None


# ── RxNorm ───────────────────────────────────────────────────────────────────
def rxnorm_resolve(name):
    data = _get_json(f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={urllib.parse.quote(name)}&search=2")
    time.sleep(SLEEP)
    ids = ((data or {}).get("idGroup", {}) or {}).get("rxnormId")
    return ids[0] if ids else None


# ── SQL helpers ──────────────────────────────────────────────────────────────
def sqlq(v):
    return "'" + str(v).replace("'", "''") + "'"


def main():
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print("Path A resolver — reading core tables (read-only)…")

    compounds = sb_get("compounds?select=id,name,generic_name")
    signals = sb_get("repurposing_signals?select=id,compound_id")
    ot_sources = sb_get("sources?select=signal_id,external_id&source_type=eq.opentargets")
    print(f"  compounds={len(compounds)}  signals={len(signals)}  ot_sources={len(ot_sources)}")

    # high-confidence shortcut: compound -> CHEMBL id already stored on its OT rows
    sig_to_compound = {s["id"]: s["compound_id"] for s in signals}
    ot_chembl = {}  # compound_id -> set(chembl)
    for s in ot_sources:
        cid = sig_to_compound.get(s.get("signal_id"))
        ext = (s.get("external_id") or "").strip()
        if cid and ext.upper().startswith("CHEMBL"):
            ot_chembl.setdefault(cid, set()).add(ext)

    rows, counts = [], {"resolved": 0, "ambiguous": 0, "unresolved": 0}
    for c in compounds:
        cid, name, generic = c["id"], c.get("name"), c.get("generic_name")
        chembl = rxcui = atc = candidate = chembl_src = None

        # 1) Open Targets shortcut (unique CHEMBL only)
        ot = ot_chembl.get(cid)
        if ot and len(ot) == 1:
            chembl = next(iter(ot))
            chembl_src = "opentargets"

        variants = name_variants(name, generic)
        # 2) ChEMBL API for chembl/atc if not already known
        for v in variants:
            if chembl and atc:
                break
            ch, _pref, a, match = chembl_resolve(v)
            if ch and not chembl:
                chembl, chembl_src = ch, chembl_src or "chembl_api"
            if a and not atc:
                atc = a
            if not ch and match and match.startswith("candidate:") and not candidate:
                candidate = match
            if ch:
                break
        # 3) RxNorm
        for v in variants:
            rxcui = rxnorm_resolve(v)
            if rxcui:
                break

        if chembl or rxcui:
            status = "resolved"
        elif candidate:
            status = "ambiguous"
        else:
            status = "unresolved"
        counts[status] += 1

        rows.append({
            "id": cid, "name": name, "generic_name": generic,
            "chembl_id": chembl, "chembl_source": chembl_src,
            "rxcui": rxcui, "atc_code": atc,
            "status": status, "candidate": candidate,
        })
        print(f"  {status:10} {(name or '')[:34]:<34} chembl={chembl or '-':<12} rxcui={rxcui or '-'}")

    # conditions from the curated ontology map (deterministic)
    onto = json.loads(ONTOLOGY.read_text())
    cond_rows = []
    for c in onto["conditions"]:
        cond_rows.append({
            "slug": c["slug"],
            "mondo_id": c.get("mondo_primary"),
            "efo_id": c.get("efo_primary"),
        })

    _write_migration(rows, cond_rows)
    REPORT.write_text(json.dumps({
        "_meta": {
            "generated_at": started, "script": "scripts/resolve-canonical-ids.py",
            "compound_counts": counts, "compounds_total": len(rows),
            "conditions_total": len(cond_rows),
        },
        "compounds": rows, "conditions": cond_rows,
    }, indent=2))

    print(f"\nCompounds: {counts}")
    print(f"Conditions resolved from ontology map: {len(cond_rows)}")
    print(f"Wrote {MIGRATION.relative_to(REPO)} and {REPORT.relative_to(REPO)}")
    print("Review the report, then apply migrations 050 and 051 in Supabase Studio.")


def _write_migration(rows, cond_rows):
    out = [
        "-- 051_backfill_canonical_ids.sql",
        "--",
        "-- GENERATED by scripts/resolve-canonical-ids.py. Backfills the canonical-id",
        "-- columns added in migration 050. Each UPDATE is idempotent (guarded so it only",
        "-- fills NULLs) and safe to re-run. Resolution sources: Open Targets (CHEMBL on",
        "-- existing source rows), ChEMBL REST, RxNorm (RxNav), and the curated condition",
        "-- map in lib/conditions-ontology.json. Apply 050 first, then this file.",
        "",
        "-- ── compounds ───────────────────────────────────────────────────────────────",
    ]
    for r in rows:
        sets = []
        if r["chembl_id"]:
            sets.append(f"chembl_id = {sqlq(r['chembl_id'])}")
        if r["rxcui"]:
            sets.append(f"rxcui = {sqlq(r['rxcui'])}")
        if r["atc_code"]:
            sets.append(f"atc_code = {sqlq(r['atc_code'])}")
        sets.append(f"resolution_status = {sqlq(r['status'])}")
        out.append(
            f"update compounds set {', '.join(sets)} "
            f"where id = {sqlq(r['id'])} and resolution_status is null;"
        )
    out += ["", "-- ── conditions ──────────────────────────────────────────────────────────────"]
    for c in cond_rows:
        if not c["mondo_id"]:
            continue
        sets = [f"mondo_id = {sqlq(c['mondo_id'])}"]
        if c["efo_id"]:
            sets.append(f"efo_id = {sqlq(c['efo_id'])}")
        out.append(
            f"update conditions set {', '.join(sets)} "
            f"where slug = {sqlq(c['slug'])} and mondo_id is null;"
        )
    out.append("")
    MIGRATION.write_text("\n".join(out))


if __name__ == "__main__":
    main()
