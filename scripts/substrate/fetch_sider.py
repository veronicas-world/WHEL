"""Pathway arm (part 3): SIDER — labeled drug side effects -> STRUCTURED documents.

SIDER (Side Effect Resource) gives drug->side-effect associations extracted from drug
package inserts, WITH frequency / placebo-controlled data that AEMS (spontaneous reports)
lacks. We ingest it like the other structured pathway sources: each condition-relevant
labeled side effect for a candidate drug is rendered DETERMINISTICALLY into a
provenance-bearing claim, aspect='safety', with the same DUAL read (safety + mechanistic
lead) as AEMS — plus a VINTAGE caveat, because SIDER 4.1 is a 2015 snapshot and newer drugs
are unrepresented. SIDER and AEMS are complementary: SIDER = label-derived controlled-trial
frequencies; AEMS = real-world post-marketing reports.

Reuses the legacy file layout (scripts/sider-pipeline.js) but discards its LLM synthesis.
Bulk TSV download (cached), not a live API. Free. Writes only to the local working store.

    python3 scripts/substrate/fetch_sider.py --conditions endometriosis
"""
import sys
import gzip
import ssl
import json
import argparse
import urllib.request
from datetime import datetime, timezone

import db
from config import USER_AGENT, CONDITIONS, WORK_DIR
from fetch_pathway import _insert_structured, _CONDITION_EVENTS, _drugs_for_condition

_CTX = ssl.create_default_context()
_BASE = "http://sideeffects.embl.de/media/download"  # /media/files is now 404
_DRUG_PAGE = "http://sideeffects.embl.de/drugs"
_CACHE = WORK_DIR / "sider"
SIDER_RENDER_VERSION = "pathway-render/sider-v1"

_FILES = {"drug_names": "drug_names.tsv", "freq": "meddra_freq.tsv.gz"}


def _ensure_files():
    _CACHE.mkdir(parents=True, exist_ok=True)
    for key, name in _FILES.items():
        dest = _CACHE / name
        if dest.exists() and dest.stat().st_size > 0:
            continue
        print(f"  downloading SIDER {name} (one-time) ...")
        req = urllib.request.Request(f"{_BASE}/{name}", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=180, context=_CTX) as r, open(dest, "wb") as f:
            f.write(r.read())
    return {k: _CACHE / v for k, v in _FILES.items()}


def _drug_name_to_stitch(path):
    """Map lowercased generic drug name -> set of STITCH flat ids."""
    out = {}
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            cols = line.rstrip("\n").split("\t")
            if len(cols) >= 2:
                out.setdefault(cols[1].strip().lower(), set()).add(cols[0].strip())
    return out


def _freq_text(desc, lo, hi, placebo):
    """Human-readable frequency. SIDER bounds are a union across labels, so a near
    full-range (e.g. 1%–100%) is uninformative — fall back to the text description then."""
    try:
        lo_f, hi_f = float(lo or 0), float(hi or 0)
    except ValueError:
        lo_f = hi_f = 0.0
    out = ""
    if hi_f > 0 and not (lo_f <= 0.02 and hi_f >= 0.90):   # skip uninformative full-range
        if abs(hi_f - lo_f) < 1e-6:
            out = f"{hi_f * 100:.1f}% of participants"
        else:
            out = f"{lo_f * 100:.0f}\u2013{hi_f * 100:.0f}% of participants"
    elif desc and str(desc).strip().lower() not in ("", "postmarketing"):
        out = str(desc).strip()
    if out and placebo and str(placebo).strip().lower() == "placebo":
        out += " (placebo-controlled)"
    return out


def _scan_freq(path, target_stitch):
    """One streaming pass over meddra_freq.tsv.gz; keep PT rows for target STITCH ids.
    stitch -> list of {term, freq_text}. cols: 0 stitch_flat, 3 placebo, 4 desc, 5 lo,
    6 hi, 7 meddra_type, 9 term_name (per scripts/sider-pipeline.js)."""
    by_stitch = {}
    with gzip.open(path, "rt", encoding="utf-8", errors="replace") as f:
        for line in f:
            cols = line.rstrip("\n").split("\t")
            if len(cols) < 10:
                continue
            stitch = cols[0].strip()
            if stitch not in target_stitch or cols[7].strip() != "PT":
                continue
            term = cols[9].strip()
            if not term:
                continue
            by_stitch.setdefault(stitch, []).append(
                {"term": term, "freq": _freq_text(cols[4], cols[5], cols[6], cols[3])})
    return by_stitch


def _render_sider(drug, term, freq, cond_label):
    freq_clause = f", reported in {freq}" if freq else ""
    return (f"Per SIDER (the Side Effect Resource, from pre-2015 drug labels), {drug} lists "
            f"{term} as a labeled side effect{freq_clause}. SIDER 4.1 is a 2015 snapshot, so "
            f"newer drugs may be unrepresented; this is a label-derived association, not "
            f"causation in any individual. Read two ways: as a safety consideration, and \u2014 "
            f"because it suggests {drug} acts on a system relevant to {cond_label} \u2014 as a "
            f"mechanistic lead for further investigation, not evidence of benefit.")


def run(conditions=None, max_drugs=10, max_events_per_drug=3):
    conn = db.connect()
    keys = conditions or list(CONDITIONS.keys())
    files = _ensure_files()
    name2stitch = _drug_name_to_stitch(files["drug_names"])

    # candidate drugs (already in the substrate) per condition, and the union STITCH set
    per_cond = {}
    target = set()
    for ck in keys:
        drugs = _drugs_for_condition(conn, ck)[:max_drugs]
        per_cond[ck] = drugs
        for d in drugs:
            for st in name2stitch.get(d.strip().lower(), ()):
                target.add(st)
    if not target:
        print("  no candidate drugs matched SIDER (run Open Targets / direct first, or names differ)")
        return 0

    print(f"  scanning SIDER frequency file for {len(target)} matched STITCH id(s) ...")
    by_stitch = _scan_freq(files["freq"], target)

    total = 0
    for ck in keys:
        relevant = _CONDITION_EVENTS.get(ck, set())
        cond_label = CONDITIONS[ck]["canonical"]
        for drug in per_cond[ck]:
            stitches = name2stitch.get(drug.strip().lower(), set())
            seen_terms = set()
            picked = 0
            for st in stitches:
                for se in by_stitch.get(st, []):
                    term = se["term"]
                    if relevant and term.lower() not in relevant:
                        continue
                    if term.lower() in seen_terms or picked >= max_events_per_drug:
                        continue
                    seen_terms.add(term.lower())
                    statement = _render_sider(drug, term, se["freq"], cond_label)
                    record = {"drug": drug, "side_effect": term, "frequency": se["freq"],
                              "stitch_id": st, "source_version": "SIDER 4.1 (2015)",
                              "reading": ["safety", "mechanistic_lead"], "reverse_translation": True}
                    if _insert_structured(conn, source="sider", external_id=f"sider:{st}:{term}".lower(),
                                          url=f"{_DRUG_PAGE}/{st.lstrip('CID').lstrip('0') or st}",
                                          statement=statement, record=record, cond_key=ck,
                                          intervention=drug, aspect="safety", direction="negative",
                                          outcome=term, render_version=SIDER_RENDER_VERSION):
                        total += 1
                        picked += 1
                        print(f"  + (sider/{ck}) {drug} \u2014 {term}")
        conn.commit()
    print(f"  pathway(sider): {total} structured claim(s)")
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--conditions", type=str, default=None, help="comma-separated subset")
    ap.add_argument("--max-drugs", type=int, default=10, help="candidate drugs per condition")
    args = ap.parse_args()
    conds = [c.strip() for c in args.conditions.split(",")] if args.conditions else None
    db.init_db()
    run(conditions=conds, max_drugs=args.max_drugs)
    return 0


if __name__ == "__main__":
    sys.exit(main())
