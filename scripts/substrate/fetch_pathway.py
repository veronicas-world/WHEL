"""Pathway arm ingestion — Open Targets + AEMS → STRUCTURED documents + deterministic claims.

Reuses the legacy fetchers' query logic (scripts/opentargets-pipeline.js,
scripts/openfda-pipeline.js) but DISCARDS their LLM synthesis. Each structured record is
rendered DETERMINISTICALLY into a fixed sentence stored as the document's raw_text; the
claim IS that sentence (verbatim quote = the whole sentence), constructed WITHOUT a model.
The raw record + retrieval date live in documents.meta. So a structured database fact
becomes a quotable, provenance-bearing claim without faking a quote. See ARMS_SPEC.md §1–§2.

  * Open Targets  -> mechanistic plausibility (aspect 'other'): drug is a clinical
                     candidate for the condition, with its mechanism/target.
  * AEMS          -> SAFETY lens (aspect 'safety'): raw count of gynae-relevant adverse
                     events reported for a candidate drug in women. NOT causation; the
                     caveat is structural (part of the rendered sentence). AEMS is the FDA
                     Adverse Event Reporting System (formerly FAERS), via the openFDA API.

AEMS depends on candidate drugs already being in the substrate (from Open Targets / the
direct arm), so run Open Targets (and/or the PubMed pipeline) first.

Free to run (public APIs). Writes only to the local working store.

    python3 scripts/substrate/fetch_pathway.py                              # all six, both sources
    python3 scripts/substrate/fetch_pathway.py --conditions endometriosis --source opentargets
    python3 scripts/substrate/fetch_pathway.py --conditions endometriosis --source aems
"""
import re
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
from config import USER_AGENT, CONDITIONS, REPO

_CTX = ssl.create_default_context()
_OT_GRAPHQL = "https://api.platform.opentargets.org/api/v4/graphql"
_OPENFDA = "https://api.fda.gov/drug/event.json"
_ONTOLOGY = REPO / "lib" / "conditions-ontology.json"
OT_RENDER_VERSION = "pathway-render/opentargets-v1"
AEMS_RENDER_VERSION = "pathway-render/aems-v1"
_AEMS_DELAY = 1.6  # ~37 req/min, under the openFDA free-tier 40/min

# Reused verbatim from scripts/opentargets-pipeline.js (DISEASE_QUERY), trimmed to the
# fields we render from.
_DISEASE_QUERY = """query DiseaseData($efoId: String!) {
  disease(efoId: $efoId) {
    id
    name
    drugAndClinicalCandidates {
      count
      rows {
        drug {
          id
          name
          drugType
          mechanismsOfAction { rows { mechanismOfAction actionType targets { id approvedName } } }
        }
        maxClinicalStage
      }
    }
  }
}"""

# Gynaecological MedDRA reaction terms (from scripts/openfda-pipeline.js GYNAE_TERMS),
# lowercased for exact matching against the openFDA count-endpoint terms.
_GYNAE_TERMS = {
    "menstruation", "menstrual", "dysmenorrhoea", "dysmenorrhea", "menorrhagia",
    "metrorrhagia", "amenorrhoea", "amenorrhea", "oligomenorrhoea", "oligomenorrhea",
    "menstrual disorder", "irregular menstruation", "menstrual cycle irregularity",
    "intermenstrual bleeding", "heavy menstrual bleeding", "uterine bleeding",
    "abnormal uterine bleeding", "endometriosis", "endometrial", "adenomyosis",
    "pelvic pain", "pelvic", "uterine", "uterine pain", "uterine spasm", "uterine fibroids",
    "leiomyoma", "ovarian", "ovarian cyst", "ovarian pain", "polycystic ovaries", "vaginal",
    "vaginal pain", "vaginal haemorrhage", "vaginal hemorrhage", "vaginal discharge",
    "vulval pain", "vulvodynia", "vulvar", "dyspareunia", "sexual pain", "breast",
    "breast pain", "mastalgia", "abdominal pain", "abdominal", "cramping", "cramp",
    "pelvic floor", "chronic pelvic pain", "headache", "migraine", "pain", "depression",
    "depressed mood", "major depressive", "anxiety", "anxious", "mood", "mood swings",
    "irritability", "irritable", "emotional disturbance", "affect lability", "crying",
    "tearfulness", "insomnia", "sleep disorder", "sleep disturbance", "hypersomnia",
    "fatigue", "asthenia", "brain fog", "cognitive", "concentration impaired",
    "memory impairment", "confusion", "weight increased", "weight gain", "obesity",
    "insulin resistance", "glucose", "hyperglycaemia", "hyperglycemia", "androgen",
    "testosterone", "hirsutism", "hair loss", "alopecia", "acne", "seborrhoeic dermatitis",
    "hormone", "hormonal", "fertility", "infertility", "anovulation", "ovulation disorder",
    "hot flush", "hot flash", "hot flushes", "hot flashes", "night sweat", "night sweats",
    "flushing", "sweating", "hyperhidrosis", "inflammation", "inflammatory", "swelling",
    "oedema", "edema", "bloating", "abdominal distension", "libido", "decreased libido",
    "loss of libido", "sexual dysfunction", "vaginismus", "urinary", "urinary incontinence",
    "urinary tract", "cystitis", "interstitial cystitis", "bladder pain", "urinary frequency",
    "premenstrual syndrome", "premenstrual dysphoric disorder", "pmdd",
    "polycystic ovary syndrome", "pcos",
}


# ── shared helpers ──────────────────────────────────────────────────────────

def _entity(conn, etype, label):
    norm = re.sub(r"\s+", " ", label).strip().lower()
    row = conn.execute("SELECT id FROM entities WHERE type=? AND norm_key=?", (etype, norm)).fetchone()
    if row:
        return row["id"]
    eid = db.new_id()
    conn.execute("INSERT INTO entities (id, type, label, norm_key) VALUES (?,?,?,?)",
                 (eid, etype, label.strip(), norm))
    return eid


def _insert_structured(conn, *, source, external_id, url, statement, record, cond_key,
                       intervention, aspect, direction, outcome, render_version):
    """Insert a structured record as document + ONE span + ONE deterministic claim.
    Bypasses LLM extraction: the rendered statement IS the claim, quoted verbatim and
    pre-verified (we authored the rendering from the record). Returns True if new."""
    csha = db.sha256(statement)
    if conn.execute("SELECT 1 FROM documents WHERE content_sha256=?", (csha,)).fetchone():
        return False
    now = datetime.now(timezone.utc).isoformat()
    doc_id, span_id = db.new_id(), db.new_id()
    conn.execute(
        "INSERT INTO documents (id, content_sha256, source, external_id, url, title,"
        " raw_text, retrieved_at, meta_json) VALUES (?,?,?,?,?,?,?,?,?)",
        (doc_id, csha, source, external_id, url, statement[:120], statement, now,
         json.dumps({"condition": cond_key, "record": record, "source_version": render_version})))
    conn.execute(
        "INSERT INTO source_spans (id, document_id, start_char, end_char, text, sha256, ordinal,"
        " extracted) VALUES (?,?,?,?,?,?,?,1)",
        (span_id, doc_id, 0, len(statement), statement, db.sha256(statement), 0))
    iid = _entity(conn, "intervention", intervention)
    cid = _entity(conn, "condition", CONDITIONS[cond_key]["canonical"])
    conn.execute(
        "INSERT INTO claims (id, span_id, document_id, text, exact_quote, quote_start_char,"
        " quote_end_char, intervention_id, condition_id, outcome, aspect, direction,"
        " provenance_verified, entailment_label, entailment_score, model_name, prompt_hash, created_at)"
        " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (db.new_id(), span_id, doc_id, statement, statement, 0, len(statement),
         iid, cid, outcome, aspect, direction, 1, "entailed", 1.0, render_version, render_version, now))
    return True


# ── Open Targets (mechanistic plausibility) ─────────────────────────────────

def _ot_disease_ids():
    """slug -> Open Targets disease id, skipping conditions OT does not index."""
    data = json.loads(_ONTOLOGY.read_text())
    return {c["slug"].lower(): c["opentargets_disease_id"]
            for c in data.get("conditions", []) if c.get("opentargets_disease_id")}


def _post_graphql(query, variables):
    body = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    req = urllib.request.Request(
        _OT_GRAPHQL, data=body, method="POST",
        headers={"content-type": "application/json", "User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60, context=_CTX) as r:
        return json.load(r)


def _render_ot(drug_name, drug_type, stage, moa, target_name, cond_label, snapshot):
    """Deterministic, fixed-order rendering of one Open Targets drug-candidate record."""
    parts = [f"Per Open Targets (retrieved {snapshot}), {drug_name}"]
    if drug_type:
        parts.append(f" (a {drug_type})")
    parts.append(f" is a clinical candidate for {cond_label}")
    if stage is not None:
        parts.append(f" (maximum clinical stage {stage})")
    if moa and target_name:
        parts.append(f"; its mechanism of action is {moa} on target {target_name}")
    elif moa:
        parts.append(f"; its mechanism of action is {moa}")
    parts.append(".")
    return "".join(parts)


def fetch_opentargets(conn, cond_key, ot_id, max_drugs=15):
    snapshot = datetime.now(timezone.utc).date().isoformat()
    cond_label = CONDITIONS[cond_key]["canonical"]
    try:
        resp = _post_graphql(_DISEASE_QUERY, {"efoId": ot_id})
    except Exception as e:  # noqa: BLE001
        print(f"  [warn] OT query failed for {cond_key} ({ot_id}): {e}")
        return 0
    disease = (resp.get("data") or {}).get("disease")
    if not disease:
        print(f"  [warn] OT returned no disease for {cond_key} ({ot_id}) — {resp.get('errors')}")
        return 0
    rows = ((disease.get("drugAndClinicalCandidates") or {}).get("rows")) or []
    made = 0
    for row in rows[:max_drugs]:
        drug = row.get("drug") or {}
        name = (drug.get("name") or "").strip()
        if not name:
            continue
        chembl = drug.get("id")
        drug_type = drug.get("drugType")
        if not drug_type or str(drug_type).lower() == "unknown":
            drug_type = None  # don't render "(a Unknown)"
        moa = target_name = None
        moa_rows = ((drug.get("mechanismsOfAction") or {}).get("rows")) or []
        if moa_rows:
            moa = moa_rows[0].get("mechanismOfAction")
            tgts = moa_rows[0].get("targets") or []
            if tgts:
                target_name = tgts[0].get("approvedName")
        statement = _render_ot(name, drug_type, row.get("maxClinicalStage"),
                               moa, target_name, cond_label, snapshot)
        record = {"chembl_id": chembl, "drug_type": drug.get("drugType"),
                  "max_clinical_stage": row.get("maxClinicalStage"),
                  "mechanism_of_action": moa, "target": target_name,
                  "ot_disease_id": ot_id, "retrieved": snapshot}
        url = (f"https://platform.opentargets.org/drug/{chembl}" if chembl
               else f"https://platform.opentargets.org/disease/{ot_id}")
        if _insert_structured(conn, source="opentargets", external_id=chembl, url=url,
                              statement=statement, record=record, cond_key=cond_key,
                              intervention=name, aspect="other", direction="positive",
                              outcome="mechanistic association", render_version=OT_RENDER_VERSION):
            made += 1
            print(f"  + (opentargets/{cond_key}) {name} — stage {row.get('maxClinicalStage')}")
    conn.commit()
    return made


def run_opentargets(conn, keys, max_drugs=15):
    ids = _ot_disease_ids()
    total = 0
    for ck in keys:
        ot_id = ids.get(ck.lower())
        if not ot_id:
            print(f"  [{ck}] not indexed in Open Targets — skipping (cross/community may cover it)")
            continue
        print(f"  [{ck}] Open Targets {ot_id}")
        total += fetch_opentargets(conn, ck, ot_id, max_drugs=max_drugs)
        time.sleep(0.5)
    print(f"  pathway(opentargets): {total} structured claim(s)")
    return total


# ── AEMS (FDA Adverse Event Reporting System, formerly FAERS) — safety lens ──

def _openfda_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=45, context=_CTX) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 404:  # openFDA returns 404 when no records match
            return None
        raise


def _aems_search(name_lower):
    # openFDA: bare + = AND, bare : = field sep; only the value needs encoding.
    return (f'patient.drug.openfda.generic_name:%22{urllib.parse.quote(name_lower)}%22'
            f'+AND+patient.patientsex:2')


def _aems_for_drug(drug_name):
    """(total_female_reports, [(event, count), ...gynae only, highest first]).
    Two openFDA calls: a total, and a per-reaction count. Raw counts only — no ROR/PRR."""
    q = _aems_search(drug_name.lower())
    total = 0
    try:
        meta = _openfda_get(f"{_OPENFDA}?search={q}&limit=1")
        if meta:
            total = int(((meta.get("meta") or {}).get("results") or {}).get("total", 0))
        time.sleep(_AEMS_DELAY)
        counts = _openfda_get(f"{_OPENFDA}?search={q}&count=patient.reaction.reactionmeddrapt.exact")
        time.sleep(_AEMS_DELAY)
    except urllib.error.URLError as e:
        print(f"  [warn] AEMS query failed for {drug_name}: {e}")
        return 0, []
    if not counts:
        return total, []
    gynae = [(row.get("term", "").strip(), int(row.get("count", 0)))
             for row in counts.get("results", [])
             if row.get("term", "").strip().lower() in _GYNAE_TERMS]
    gynae.sort(key=lambda x: -x[1])
    return total, gynae


# Condition-relevant adverse-event terms (lowercased), so the safety lens surfaces
# events that matter for THIS condition rather than generic high-count AEs like
# "headache". A drug with no condition-relevant gynae signal simply contributes nothing
# here — which is the honest outcome, not a generic filler event.
_CONDITION_EVENTS = {
    "endometriosis": {"pelvic pain", "chronic pelvic pain", "dysmenorrhoea", "dysmenorrhea",
        "menorrhagia", "dyspareunia", "uterine", "uterine pain", "ovarian", "ovarian cyst",
        "abdominal pain", "heavy menstrual bleeding", "endometriosis", "menstrual disorder",
        "bloating", "abdominal distension", "irregular menstruation"},
    "adenomyosis": {"pelvic pain", "chronic pelvic pain", "dysmenorrhoea", "dysmenorrhea",
        "menorrhagia", "heavy menstrual bleeding", "uterine", "uterine pain", "uterine spasm",
        "abnormal uterine bleeding", "menstrual disorder", "abdominal pain"},
    "PCOS": {"hirsutism", "acne", "alopecia", "hair loss", "weight increased", "weight gain",
        "menstrual disorder", "oligomenorrhoea", "oligomenorrhea", "amenorrhoea", "amenorrhea",
        "ovarian cyst", "polycystic ovaries", "infertility", "insulin resistance", "anovulation",
        "irregular menstruation", "ovulation disorder"},
    "menopause": {"hot flush", "hot flushes", "hot flash", "hot flashes", "night sweat",
        "night sweats", "sweating", "flushing", "hyperhidrosis", "vaginal", "vaginal discharge",
        "insomnia", "mood swings", "libido", "decreased libido", "sexual dysfunction"},
    "PMDD": {"depression", "depressed mood", "anxiety", "irritability", "mood swings",
        "affect lability", "emotional disturbance", "insomnia", "fatigue", "bloating",
        "breast pain", "mastalgia", "crying", "tearfulness", "premenstrual syndrome"},
    "vulvodynia": {"vulval pain", "vulvodynia", "vulvar", "dyspareunia", "vaginal pain",
        "sexual dysfunction", "vaginismus", "bladder pain", "interstitial cystitis", "cystitis"},
}


def _render_aems(drug, event, n, total, cond_label, snapshot):
    # Dual read (ARMS_SPEC §2): the same datum is a safety consideration AND a mechanistic
    # lead. Both clauses are structural so neither can be stripped, and the lead clause is
    # hedged ("not evidence of benefit") because over-reading adverse events as mechanism is
    # the documented trap (confounding by indication, reporting bias).
    denom = f" (of {total} female reports for {drug} in the analysed sample)" if total else ""
    return (f"In FDA AEMS (the FDA Adverse Event Reporting System, formerly FAERS; retrieved "
            f"{snapshot}), {n} report(s) of {event} were recorded for {drug} among female "
            f"patients{denom}. This is a raw adverse-event report count, not a disproportionality "
            f"statistic or evidence of causation, and is subject to reporting bias and confounding. "
            f"Read two ways: as a safety consideration, and \u2014 because it suggests {drug} acts on a "
            f"system relevant to {cond_label} \u2014 as a mechanistic lead for further investigation, "
            f"not evidence of benefit.")


def _drugs_for_condition(conn, cond_key):
    """Candidate drugs already in the substrate for this condition (from OT / direct)."""
    cond = CONDITIONS[cond_key]["canonical"].lower()
    rows = conn.execute(
        "SELECT DISTINCT e.label FROM claims c"
        " JOIN entities e ON c.intervention_id = e.id"
        " JOIN entities d ON c.condition_id = d.id"
        " WHERE d.norm_key = ? AND e.type = 'intervention'", (cond,)).fetchall()
    return [r["label"] for r in rows]


def fetch_aems(conn, cond_key, max_drugs=10, max_events_per_drug=3):
    snapshot = datetime.now(timezone.utc).date().isoformat()
    drugs = _drugs_for_condition(conn, cond_key)[:max_drugs]
    if not drugs:
        print(f"  [{cond_key}] no candidate drugs in substrate yet — run Open Targets / direct first")
        return 0
    relevant = _CONDITION_EVENTS.get(cond_key, set())
    made = 0
    for drug in drugs:
        total, gynae = _aems_for_drug(drug)
        # keep only events relevant to THIS condition; skip the drug here if none match
        events = [(e, n) for (e, n) in gynae if e.lower() in relevant] if relevant else gynae
        cond_label = CONDITIONS[cond_key]["canonical"]
        for event, n in events[:max_events_per_drug]:
            statement = _render_aems(drug, event, n, total, cond_label, snapshot)
            record = {"drug": drug, "event": event, "report_count": n,
                      "total_female_reports": total, "retrieved": snapshot,
                      "reading": ["safety", "mechanistic_lead"], "reverse_translation": True}
            url = f"{_OPENFDA}?search={_aems_search(drug.lower())}&count=patient.reaction.reactionmeddrapt.exact"
            if _insert_structured(conn, source="aems", external_id=f"aems:{drug}:{event}".lower(),
                                  url=url, statement=statement, record=record, cond_key=cond_key,
                                  intervention=drug, aspect="safety", direction="negative",
                                  outcome=event, render_version=AEMS_RENDER_VERSION):
                made += 1
                print(f"  + (aems/{cond_key}) {drug} — {event} ({n})")
    conn.commit()
    return made


def run_aems(conn, keys, max_drugs=10):
    total = 0
    for ck in keys:
        print(f"  [{ck}] AEMS (openFDA, female reports)")
        total += fetch_aems(conn, ck, max_drugs=max_drugs)
    print(f"  pathway(aems): {total} structured claim(s)")
    return total


# ── orchestration ───────────────────────────────────────────────────────────

def run(conditions=None, max_drugs=15, sources=("opentargets", "aems")):
    conn = db.connect()
    keys = conditions or list(CONDITIONS.keys())
    total = 0
    if "opentargets" in sources:
        total += run_opentargets(conn, keys, max_drugs)
    if "aems" in sources:
        total += run_aems(conn, keys, max_drugs=min(max_drugs, 10))
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--conditions", type=str, default=None,
                    help="comma-separated subset (default: all six)")
    ap.add_argument("--source", choices=["opentargets", "aems", "all"], default="all")
    ap.add_argument("--max-drugs", type=int, default=15, help="max candidates per condition")
    args = ap.parse_args()
    conds = [c.strip() for c in args.conditions.split(",")] if args.conditions else None
    sources = ("opentargets", "aems") if args.source == "all" else (args.source,)
    db.init_db()
    run(conditions=conds, max_drugs=args.max_drugs, sources=sources)
    return 0


if __name__ == "__main__":
    sys.exit(main())
