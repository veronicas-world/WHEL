"""Stage 3 - extract atomic claims with FAITHFUL per-claim provenance.

This is the critical capability. For each source span we ask Claude to decompose it
into atomic claims about a treatment's effect on PMDD/PMS. Each claim must come with
a verbatim quote copied from the sentence. We then VERIFY that quote exists verbatim
in the span text and compute the character offsets OURSELVES. A claim whose quote we
cannot locate is marked provenance_verified = 0 and never displayed as supported.

This is the anti-citation-drift discipline: the model proposes, the substrate verifies.
"""
import re
from datetime import datetime, timezone

import db
from llm import complete_json, prompt_hash, map_parallel
from config import MODEL

SYSTEM = """You are an extraction component in a biomedical evidence system for women's health.
You decompose a single sentence from a PubMed abstract into atomic, individually verifiable claims
about the effect of a TREATMENT/INTERVENTION on PMDD (premenstrual dysphoric disorder) or PMS.

Rules:
- Only extract claims about whether an intervention helps, harms, or has no effect on PMDD/PMS or its symptoms.
- Ignore background, methods, demographics, and claims unrelated to a treatment effect.
- Each claim must be a STANDALONE assertion (resolve pronouns; name the intervention and condition).
- For each claim, copy an EXACT VERBATIM quote from the sentence that supports it. Copy character-for-character;
  do not paraphrase, do not fix typos, do not add ellipses. The quote MUST be a literal substring of the sentence.
- Classify the ASPECT of the claim:
    "efficacy" = whether the intervention works on PMDD/PMS symptoms (effectiveness)
    "safety"   = adverse effects, tolerability, side effects, harms
    "other"    = anything else about the intervention
- Classify direction (interpret RELATIVE to the aspect):
    aspect=efficacy: "positive"=improves/reduces symptoms; "null"=no benefit / not better than placebo;
                     "negative"=worsens symptoms; "unclear"=mixed/insufficient.
    aspect=safety:   "positive"=well tolerated / no significant adverse effects;
                     "negative"=causes adverse effects / poorly tolerated; "unclear"=mixed.
- Give a canonical intervention name. Prefer the drug class when the sentence is about a class
  (e.g. "SSRIs"), otherwise the generic drug/supplement name (e.g. "calcium", "progesterone").
  Normalize spelling/hyphenation to ONE canonical form (e.g. always "Vitex agnus-castus").
- Give the condition as "PMDD" or "PMS" (use PMDD if the sentence says premenstrual dysphoric disorder).

Return ONLY a JSON array. Each element:
{"claim": str, "exact_quote": str, "intervention_canonical": str, "condition": str,
 "outcome": str, "aspect": "efficacy"|"safety"|"other", "direction": "positive"|"negative"|"null"|"unclear"}
If the sentence contains no treatment-effect claim, return [].
"""

PROMPT_VERSION = "extract_claims/v2-aspect"

# Stage-1 triage (rule-based, fast, $0): only spend an LLM call on spans that plausibly
# contain a treatment-effect claim. This mirrors the Blueprint's female-specificity
# filter idea: cheap keyword gate before expensive extraction. Cuts ~70% of API calls.
_SIGNAL = re.compile(
    r"\b(effica\w+|effective\w*|improv\w+|reduc\w+|relie\w+|benefi\w+|treat\w+|therap\w+|"
    r"placebo|symptom\w*|trial|randomi\w+|RCT|evidence|signific\w*|tolerat\w+|"
    r"adverse|side[- ]effect\w*|response|administ\w+|supplement\w*|dose|dosage|"
    r"SSRI\w*|inhibitor\w*|oil|vitamin|calcium|magnesium|progest\w+|primrose|"
    r"vitex|chasteberry|pyridoxine|hypericum|wort|agnus)\b",
    re.IGNORECASE,
)


def _is_candidate_span(text: str) -> bool:
    return bool(_SIGNAL.search(text))


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def _locate(quote: str, span_text: str):
    """Return (local_start, local_end) of quote in span_text, or None.
    Try exact match first, then a whitespace-normalized match."""
    idx = span_text.find(quote)
    if idx != -1:
        return idx, idx + len(quote)
    # whitespace-tolerant: collapse runs of whitespace and map back
    pattern = re.escape(quote.strip())
    pattern = re.sub(r"\\\s+|\s+", r"\\s+", pattern)
    m = re.search(pattern, span_text)
    if m:
        return m.start(), m.end()
    return None


def _get_or_make_entity(conn, etype: str, label: str) -> str:
    norm = _norm(label)
    row = conn.execute("SELECT id FROM entities WHERE type=? AND norm_key=?", (etype, norm)).fetchone()
    if row:
        return row["id"]
    eid = db.new_id()
    conn.execute("INSERT INTO entities (id, type, label, norm_key) VALUES (?,?,?,?)",
                 (eid, etype, label.strip(), norm))
    return eid


def run():
    conn = db.connect()
    ph = prompt_hash(SYSTEM, PROMPT_VERSION)
    all_pending = conn.execute(
        "SELECT * FROM source_spans WHERE extracted = 0").fetchall()
    # Stage-1 triage: candidates get an LLM call; non-candidates are marked done for free.
    spans = [s for s in all_pending if _is_candidate_span(s["text"])]
    skipped = [s for s in all_pending if not _is_candidate_span(s["text"])]
    for s in skipped:
        conn.execute("UPDATE source_spans SET extracted = 1 WHERE id = ?", (s["id"],))
    conn.commit()
    print(f"  triage: {len(spans)} candidate spans, {len(skipped)} skipped (no signal)")

    total_claims = 0
    verified = 0
    rejected = 0

    def _extract(span):
        return complete_json(SYSTEM, f"Sentence:\n\"\"\"{span['text']}\"\"\"")

    for span, items in map_parallel(_extract, spans, workers=4):
        if items is None:
            continue  # API failed; leave extracted=0 so a later run retries it
        conn.execute("UPDATE source_spans SET extracted = 1 WHERE id = ?", (span["id"],))
        if not isinstance(items, list):
            conn.commit()
            continue
        for it in items:
            try:
                claim_text = it["claim"].strip()
                quote = it["exact_quote"]
                intervention = it["intervention_canonical"].strip()
                condition = it.get("condition", "PMDD").strip() or "PMDD"
                outcome = (it.get("outcome") or "").strip()
                aspect = (it.get("aspect") or "other").strip()
                direction = (it.get("direction") or "unclear").strip()
            except (KeyError, AttributeError, TypeError):
                continue
            loc = _locate(quote, span["text"])
            prov_ok = loc is not None
            if prov_ok:
                local_s, local_e = loc
                doc_start = span["start_char"] + local_s
                doc_end = span["start_char"] + local_e
                verified += 1
            else:
                doc_start = doc_end = None
                rejected += 1
                print(f"  [reject] quote not found verbatim -> {quote[:60]!r}")
            iid = _get_or_make_entity(conn, "intervention", intervention)
            cid = _get_or_make_entity(conn, "condition", condition)
            conn.execute(
                "INSERT INTO claims (id, span_id, document_id, text, exact_quote, quote_start_char,"
                " quote_end_char, intervention_id, condition_id, outcome, aspect, direction,"
                " provenance_verified, model_name, prompt_hash, created_at)"
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (db.new_id(), span["id"], span["document_id"], claim_text, quote,
                 doc_start, doc_end, iid, cid, outcome, aspect, direction,
                 1 if prov_ok else 0, MODEL, ph, datetime.now(timezone.utc).isoformat()))
            total_claims += 1
        conn.commit()
    print(f"  extracted {total_claims} claims ({verified} provenance-verified, {rejected} rejected)")
    return total_claims


if __name__ == "__main__":
    run()
