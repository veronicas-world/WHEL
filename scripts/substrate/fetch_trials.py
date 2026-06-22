"""Direct arm (part 2): ClinicalTrials.gov — interventional trials -> TEXT documents.

Reuses the ClinicalTrials.gov REST API v2 (cf. scripts/clinicaltrials-pipeline.js) but
queries by CONDITION (trials investigating each condition) rather than by drug, and
DISCARDS the legacy LLM synthesis. Each interventional trial becomes a text document
(title + brief summary + interventions + phase/status + any reported primary outcome),
which flows through the normal chunk -> extract_claims (literature prompt) -> verify ->
score pipeline as Direct-arm evidence. A registration with no reported outcome yields no
treatment-effect claim (honest — research interest, not efficacy); trials with results add
real findings.

Free to run (public API, no auth). Writes only to the local working store.

    python3 scripts/substrate/fetch_trials.py                       # all six conditions
    python3 scripts/substrate/fetch_trials.py --conditions endometriosis --max-trials 15
"""
import sys
import json
import ssl
import time
import argparse
import urllib.parse
import urllib.error
import urllib.request
from datetime import datetime, timezone

import db
from config import USER_AGENT, CONDITIONS

_CTX = ssl.create_default_context()
_CT_BASE = "https://clinicaltrials.gov/api/v2/studies"
_FIELDS = ",".join([
    "protocolSection.identificationModule",
    "protocolSection.conditionsModule",
    "protocolSection.descriptionModule",
    "protocolSection.armsInterventionsModule",
    "protocolSection.statusModule",
    "protocolSection.designModule",
    "resultsSection.outcomeMeasuresModule",
])


def _cond_term(cond_key):
    """The most specific search term for a condition (full name, not the acronym)."""
    syns = CONDITIONS[cond_key].get("synonyms") or [CONDITIONS[cond_key]["canonical"]]
    return syns[0]


def _fetch(cond_term, page_size):
    params = urllib.parse.urlencode({
        "query.cond": cond_term,
        "aggFilters": "studyType:int",   # interventional trials only
        "pageSize": str(page_size),
        "fields": _FIELDS,
    })
    req = urllib.request.Request(f"{_CT_BASE}?{params}",
                                headers={"Accept": "application/json", "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=45, context=_CTX) as r:
            return (json.load(r) or {}).get("studies", []) or []
    except urllib.error.HTTPError as e:
        print(f"  [warn] ClinicalTrials.gov HTTP {e.code} for {cond_term!r}")
        return []
    except urllib.error.URLError as e:
        print(f"  [warn] ClinicalTrials.gov error for {cond_term!r}: {e}")
        return []


def _trial_text(study):
    ps = study.get("protocolSection") or {}
    idm = ps.get("identificationModule") or {}
    title = (idm.get("briefTitle") or "").strip()
    summary = ((ps.get("descriptionModule") or {}).get("briefSummary") or "").strip()
    interventions = [i.get("name") for i in
                     ((ps.get("armsInterventionsModule") or {}).get("interventions") or [])
                     if i.get("name")]
    design = ps.get("designModule") or {}
    phases = ", ".join(design.get("phases") or []) or "not specified"
    status = (ps.get("statusModule") or {}).get("overallStatus") or "unknown"
    parts = [title, "", summary]
    if interventions:
        parts.append("\nInterventions studied: " + "; ".join(interventions[:6]) + ".")
    parts.append(f"Trial phase: {phases}. Status: {status}.")
    outcomes = ((study.get("resultsSection") or {}).get("outcomeMeasuresModule") or {}).get("outcomeMeasures") or []
    if outcomes:
        o = outcomes[0]
        ot, od = (o.get("title") or "").strip(), (o.get("description") or "").strip()
        if ot:
            parts.append(f"Reported primary outcome: {ot}. {od}".strip())
    text = "\n".join(p for p in parts if p).strip()
    return idm.get("nctId"), title, phases, status, text[:4000]


def fetch_condition(conn, cond_key, max_trials=15):
    seen = {r["external_id"] for r in conn.execute(
        "SELECT external_id FROM documents WHERE source='clinicaltrials'")}
    studies = _fetch(_cond_term(cond_key), max_trials)
    made = 0
    for study in studies:
        nct, title, phases, status, text = _trial_text(study)
        if not nct or nct in seen or not text.strip():
            continue
        csha = db.sha256(text)
        if conn.execute("SELECT 1 FROM documents WHERE content_sha256=?", (csha,)).fetchone():
            continue
        conn.execute(
            "INSERT INTO documents (id, content_sha256, source, external_id, url, title,"
            " raw_text, retrieved_at, meta_json) VALUES (?,?,?,?,?,?,?,?,?)",
            (db.new_id(), csha, "clinicaltrials", nct,
             f"https://clinicaltrials.gov/study/{nct}", title or text[:120], text,
             datetime.now(timezone.utc).isoformat(),
             json.dumps({"condition": cond_key, "kind": "trial", "phase": phases, "status": status})))
        seen.add(nct)
        made += 1
        print(f"  + ({cond_key}) {nct} [{phases}/{status}]: {title[:56]}")
    conn.commit()
    return made


def run(conditions=None, max_trials=15):
    conn = db.connect()
    keys = conditions or list(CONDITIONS.keys())
    total = 0
    for ck in keys:
        print(f"  [{ck}] ClinicalTrials.gov ({_cond_term(ck)})")
        total += fetch_condition(conn, ck, max_trials=max_trials)
        time.sleep(0.4)
    print(f"  direct(clinicaltrials): {total} trial document(s)")
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--conditions", type=str, default=None,
                    help="comma-separated subset (default: all six)")
    ap.add_argument("--max-trials", type=int, default=15, help="trials per condition")
    args = ap.parse_args()
    conds = [c.strip() for c in args.conditions.split(",")] if args.conditions else None
    db.init_db()
    run(conditions=conds, max_trials=args.max_trials)
    return 0


if __name__ == "__main__":
    sys.exit(main())
