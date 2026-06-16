"""Stage 3 - extract atomic claims with FAITHFUL per-claim provenance (the core).

For each candidate span we ask Claude to decompose it into atomic claims about a
treatment's effect on PMDD/PMS. Each claim carries a verbatim quote; we then locate
that quote in the span text and compute the offsets OURSELVES. A claim whose quote
cannot be found verbatim is marked provenance_verified = 0 and never shown as
supported. The model proposes; the substrate verifies.
"""
import re
import json
import sqlite3
from datetime import datetime, timezone

import db
from llm import complete_json, prompt_hash, map_parallel
from config import MODEL, CONDITIONS, DEFAULT_CONDITION, canonical_condition

# Condition-parameterized via .replace (NOT .format — the JSON example below uses
# literal braces). {condition_label} and {condition_canonical} are filled per the
# document's tagged condition.
SYSTEM_TEMPLATE = """You are an extraction component in a biomedical evidence system for women's health.
You decompose a single sentence from a PubMed abstract into atomic, individually verifiable claims
about the effect of a TREATMENT/INTERVENTION on {condition_label}.

Rules:
- Only extract claims about whether an intervention helps, harms, or has no effect on {condition_canonical} or its symptoms.
- Ignore background, methods, demographics, and claims unrelated to a treatment effect.
- Each claim must be a STANDALONE assertion (resolve pronouns so it reads on its own).
- For each claim, copy an EXACT VERBATIM quote from the sentence that supports it. Copy character-for-character;
  do not paraphrase, do not fix typos, do not add ellipses. The quote MUST be a literal substring of the sentence.
- CRITICAL - do not overreach the quote. The claim must be FULLY supported by the quote ALONE. Do NOT add
  scope, population, qualifiers, or attribution that the quote does not explicitly state: e.g. do not add
  "regardless of hormonal phase", "consistently", or attribute a combination's effect
  ("vitamin B6, calcium, and zinc") to one ingredient. If the quote names a combination, the claim is about
  the combination. If the quote does not name the condition, do not assert one. Say exactly what the quote
  supports, no more - a separate verifier will reject claims that say more than their quote.
- Classify the ASPECT of the claim:
    "efficacy" = whether the intervention works on the condition's symptoms (effectiveness)
    "safety"   = adverse effects, tolerability, side effects, harms
    "other"    = anything else about the intervention
- Classify direction (interpret RELATIVE to the aspect):
    aspect=efficacy: "positive"=improves/reduces symptoms; "null"=no benefit / not better than placebo;
                     "negative"=worsens symptoms; "unclear"=mixed/insufficient.
    aspect=safety:   "positive"=well tolerated / no significant adverse effects;
                     "negative"=causes adverse effects / poorly tolerated; "unclear"=mixed.
- Give a canonical intervention name. Prefer the drug class when the sentence is about a class
  (e.g. "SSRIs"), otherwise the generic drug/supplement name (e.g. "calcium", "metformin").
  Normalize spelling/hyphenation to ONE canonical form (e.g. always "Vitex agnus-castus").
- Give the condition as "{condition_canonical}" (or a more specific named subtype if the sentence states one).
  If the sentence does not name this condition, do not assert it.

Return ONLY a JSON array. Each element:
{"claim": str, "exact_quote": str, "intervention_canonical": str, "condition": str,
 "outcome": str, "aspect": "efficacy"|"safety"|"other", "direction": "positive"|"negative"|"null"|"unclear"}
If the sentence contains no treatment-effect claim, return [].
"""


# Community-tuned variant: reads a PATIENT'S post/comment, and (per the forum-mining
# research) REQUIRES a reported OUTCOME — "I take X" is not a claim; "X stopped my cramps"
# is — so we extract efficacy/benefit signal, not mere off-label use.
COMMUNITY_TEMPLATE = """You are an extraction component in a biomedical evidence system for women's health.
You read a single sentence from a PATIENT'S post or comment in an online community, about their
experience with a TREATMENT/INTERVENTION for {condition_label}. Decompose it into atomic,
individually verifiable claims about a treatment's effect.

Rules:
- Only extract a claim if the patient reports an OUTCOME of a treatment — that it HELPED, did
  NOTHING, or made things WORSE for {condition_canonical} or its symptoms. A mere mention of
  taking or trying a drug with NO reported outcome is NOT a claim — for that, return [].
  ("I take X" is not a claim; "X stopped my cramps" is.)
- Each claim must be a STANDALONE assertion (resolve pronouns so it reads on its own).
- Copy an EXACT VERBATIM quote from the sentence that supports it (character-for-character; a
  literal substring). Do not paraphrase, do not fix typos.
- Do NOT overreach the quote: say only what the quote supports — no added scope, certainty,
  population, or mechanism. A separate verifier rejects claims that say more than their quote.
- This is a PATIENT REPORT, not a clinical finding: never assert proven efficacy. The claim is
  about what THIS person reported experiencing.
- Classify the ASPECT: "efficacy" (works on symptoms), "safety" (side effects/harms), "other".
- Classify direction relative to the aspect:
    efficacy: "positive"=helped/reduced symptoms; "null"=no effect; "negative"=worsened; "unclear"=mixed.
    safety:   "positive"=well tolerated; "negative"=caused side effects; "unclear"=mixed.
- Give a canonical intervention name (generic drug/supplement, normalized to one form).
- Give the condition as "{condition_canonical}".

Return ONLY a JSON array. Each element:
{"claim": str, "exact_quote": str, "intervention_canonical": str, "condition": str,
 "outcome": str, "aspect": "efficacy"|"safety"|"other", "direction": "positive"|"negative"|"null"|"unclear"}
If the sentence contains no patient-reported treatment OUTCOME, return [].
"""

# Sources whose documents are patient-community text (vs. clinical literature).
_COMMUNITY_SOURCES = ("reddit", "forum", "community", "patient")


def _is_community(source):
    s = (source or "").lower()
    return any(k in s for k in _COMMUNITY_SOURCES)


def _system_for(cond_key, community=False):
    c = CONDITIONS.get(cond_key, CONDITIONS[DEFAULT_CONDITION])
    tmpl = COMMUNITY_TEMPLATE if community else SYSTEM_TEMPLATE
    return (tmpl
            .replace("{condition_label}", c["label"])
            .replace("{condition_canonical}", c["canonical"]))


PROMPT_VERSION = "extract_claims/v5-community-aware"

# Stage-1 triage (rule-based, $0): only spend an LLM call on spans that plausibly
# contain a treatment-effect claim. Cuts ~70% of calls.
_SIGNAL = re.compile(
    r"\b(effica\w+|effective\w*|improv\w+|reduc\w+|relie\w+|benefi\w+|treat\w+|therap\w+|"
    r"placebo|symptom\w*|trial|randomi\w+|RCT|evidence|signific\w*|tolerat\w+|"
    r"adverse|side[- ]effect\w*|response|administ\w+|supplement\w*|dose|dosage|"
    r"inhibitor\w*|agonist\w*|antagonist\w*|hormon\w*|drug\w*|medication\w*|"
    r"manag\w+|outcome\w*|placebo[- ]controlled)\b",
    re.IGNORECASE,
)


def _is_candidate(text):
    return bool(_SIGNAL.search(text))


def _passes_triage(span):
    """Stage-1 gate. The clinical keyword regex (_is_candidate) is tuned for journal
    abstracts and rejects casual patient language ("completely changed everything",
    "life changing") that carries no clinical vocabulary. For COMMUNITY sources we
    therefore bypass it: the community extraction prompt itself is the filter (it
    REQUIRES a reported outcome and returns [] otherwise), so a no-signal title costs
    one cheap call and yields nothing rather than being silently dropped before the
    model ever sees it. Literature spans still go through the clinical regex.
    (For high-volume live community ingestion a lightweight community pre-filter could
    be added here; for the archival backfill the model-as-filter is fine.)"""
    if _is_community(span["_source"]):
        return True
    return _is_candidate(span["text"])


def _norm(s):
    return re.sub(r"\s+", " ", s).strip().lower()


def _locate(quote, span_text):
    idx = span_text.find(quote)
    if idx != -1:
        return idx, idx + len(quote)
    pattern = re.sub(r"\\\s+|\s+", r"\\s+", re.escape(quote.strip()))
    m = re.search(pattern, span_text)
    return (m.start(), m.end()) if m else None


def _entity(conn, etype, label):
    norm = _norm(label)
    row = conn.execute("SELECT id FROM entities WHERE type=? AND norm_key=?", (etype, norm)).fetchone()
    if row:
        return row["id"]
    eid = db.new_id()
    conn.execute("INSERT INTO entities (id, type, label, norm_key) VALUES (?,?,?,?)",
                 (eid, etype, label.strip(), norm))
    return eid


def _doc_condition(meta_json):
    """The condition a document was fetched for (from its meta tag); falls back to
    the default for legacy documents with no tag."""
    if meta_json:
        try:
            ck = (json.loads(meta_json) or {}).get("condition")
            if ck in CONDITIONS:
                return ck
        except (ValueError, TypeError):
            pass
    return DEFAULT_CONDITION


def run():
    conn = db.connect()
    ph = prompt_hash(SYSTEM_TEMPLATE, PROMPT_VERSION)
    # Pull pending spans WITH their document's condition tag so extraction can
    # focus on the right condition. meta_json is plain data (no DB call in threads).
    pending = conn.execute(
        "SELECT s.*, d.meta_json AS _meta, d.source AS _source FROM source_spans s"
        " JOIN documents d ON s.document_id = d.id WHERE s.extracted = 0").fetchall()
    spans = [s for s in pending if _passes_triage(s)]
    for s in [s for s in pending if not _passes_triage(s)]:
        conn.execute("UPDATE source_spans SET extracted = 1 WHERE id = ?", (s["id"],))
    conn.commit()
    print(f"  triage: {len(spans)} candidate spans, {len(pending) - len(spans)} skipped (no signal)")

    total = verified = rejected = 0
    # one prompt per (condition, mode): literature vs. community-tuned (patient report)
    _systems = {(ck, comm): _system_for(ck, comm)
                for ck in CONDITIONS for comm in (False, True)}

    def _extract(span):
        ck = _doc_condition(span["_meta"])
        comm = _is_community(span["_source"])
        return complete_json(_systems[(ck, comm)], f"Sentence:\n\"\"\"{span['text']}\"\"\"")

    for span, items in map_parallel(_extract, spans, workers=4):
        if items is None:
            continue  # API failed; leave extracted=0 for a later retry
        conn.execute("UPDATE source_spans SET extracted = 1 WHERE id = ?", (span["id"],))
        default_cond = CONDITIONS[_doc_condition(span["_meta"])]["canonical"]
        if isinstance(items, list):
            for it in items:
                try:
                    claim_text = it["claim"].strip()
                    quote = it["exact_quote"]
                    interv = it["intervention_canonical"].strip()
                    cond = (it.get("condition") or default_cond).strip() or default_cond
                    # Fold free-text condition labels ("vasomotor symptoms",
                    # "vestibulodynia", "PMS") into one of the six canonical keys so
                    # the evidence doesn't fragment across near-duplicate rows. An
                    # unrecognized label is left as-is (it may be a legit subtype or
                    # genuinely off-scope; the scorer/normalizer decides downstream).
                    _canon = canonical_condition(cond)
                    if _canon:
                        cond = CONDITIONS[_canon]["canonical"]
                    outcome = (it.get("outcome") or "").strip()
                    aspect = (it.get("aspect") or "other").strip()
                    direction = (it.get("direction") or "unclear").strip()
                except (KeyError, AttributeError, TypeError):
                    continue
                loc = _locate(quote, span["text"])
                if loc:
                    ds, de = span["start_char"] + loc[0], span["start_char"] + loc[1]
                    verified += 1
                else:
                    ds = de = None
                    rejected += 1
                    print(f"  [reject] quote not found verbatim -> {quote[:60]!r}")
                iid = _entity(conn, "intervention", interv)
                cid = _entity(conn, "condition", cond)
                conn.execute(
                    "INSERT INTO claims (id, span_id, document_id, text, exact_quote, quote_start_char,"
                    " quote_end_char, intervention_id, condition_id, outcome, aspect, direction,"
                    " provenance_verified, model_name, prompt_hash, created_at)"
                    " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    (db.new_id(), span["id"], span["document_id"], claim_text, quote, ds, de,
                     iid, cid, outcome, aspect, direction, 1 if loc else 0, MODEL, ph,
                     datetime.now(timezone.utc).isoformat()))
                total += 1
        conn.commit()
    print(f"  extracted {total} claims ({verified} provenance-verified, {rejected} rejected)")
    return total


def recheck_community():
    """Reset community spans that produced NO claim back to extracted=0, so a
    community-aware re-run sends them through the patient extractor. This recovers the
    titles the old clinical triage silently dropped. Spans that already yielded a claim
    are left untouched (re-extracting them would duplicate claims). Returns the count
    reset. Cheap: only the empty community spans get a (one) extraction call on re-run."""
    conn = db.connect()
    rows = conn.execute(
        "SELECT s.id AS sid, d.source AS source FROM source_spans s"
        " JOIN documents d ON s.document_id = d.id WHERE s.extracted = 1").fetchall()
    n = 0
    for r in rows:
        if not _is_community(r["source"]):
            continue
        if conn.execute("SELECT 1 FROM claims WHERE span_id = ? LIMIT 1", (r["sid"],)).fetchone():
            continue  # already produced a claim — don't re-extract (would duplicate)
        conn.execute("UPDATE source_spans SET extracted = 0 WHERE id = ?", (r["sid"],))
        n += 1
    # Re-extraction will add corroborating claims to existing community groups, so their
    # current signals are stale — and --only-unscored would skip them. Clear the (small)
    # community arm so every community group re-scores fresh with the fuller claim set.
    # Guard: the signals table may not exist in a brand-new store.
    cleared = 0
    try:
        cleared = conn.execute("DELETE FROM substrate_signals WHERE arm = 'community'").rowcount
    except sqlite3.OperationalError:
        pass
    conn.commit()
    print(f"  recheck-community: reset {n} community span(s) with no claims -> will re-extract"
          + (f"; cleared {cleared} stale community signal(s) for re-score" if cleared else ""))
    return n


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--recheck-community", action="store_true",
                    help="reset community spans that yielded no claim (recover titles the old "
                         "clinical triage dropped), then re-extract them community-aware")
    args = ap.parse_args()
    if args.recheck_community:
        recheck_community()
    run()
