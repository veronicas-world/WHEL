"""Stage 3 - extract atomic claims with FAITHFUL per-claim provenance (the core).

For each candidate span we ask Claude to decompose it into atomic claims about a
treatment's effect on PMDD/PMS. Each claim carries a verbatim quote; we then locate
that quote in the span text and compute the offsets OURSELVES. A claim whose quote
cannot be found verbatim is marked provenance_verified = 0 and never shown as
supported. The model proposes; the substrate verifies.
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
- Each claim must be a STANDALONE assertion (resolve pronouns so it reads on its own).
- For each claim, copy an EXACT VERBATIM quote from the sentence that supports it. Copy character-for-character;
  do not paraphrase, do not fix typos, do not add ellipses. The quote MUST be a literal substring of the sentence.
- CRITICAL - do not overreach the quote. The claim must be FULLY supported by the quote ALONE. Do NOT add
  scope, population, qualifiers, or attribution that the quote does not explicitly state: e.g. do not add
  "regardless of hormonal phase", "consistently", "in women with PMS", or attribute a combination's effect
  ("vitamin B6, calcium, and zinc") to one ingredient. If the quote names a combination, the claim is about
  the combination. If the quote does not name the condition, do not assert one. Say exactly what the quote
  supports, no more - a separate verifier will reject claims that say more than their quote.
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

PROMPT_VERSION = "extract_claims/v3-no-overreach"

# Stage-1 triage (rule-based, $0): only spend an LLM call on spans that plausibly
# contain a treatment-effect claim. Cuts ~70% of calls.
_SIGNAL = re.compile(
    r"\b(effica\w+|effective\w*|improv\w+|reduc\w+|relie\w+|benefi\w+|treat\w+|therap\w+|"
    r"placebo|symptom\w*|trial|randomi\w+|RCT|evidence|signific\w*|tolerat\w+|"
    r"adverse|side[- ]effect\w*|response|administ\w+|supplement\w*|dose|dosage|"
    r"SSRI\w*|inhibitor\w*|oil|vitamin|calcium|magnesium|progest\w+|primrose|"
    r"vitex|chasteberry|pyridoxine|hypericum|wort|agnus)\b",
    re.IGNORECASE,
)


def _is_candidate(text):
    return bool(_SIGNAL.search(text))


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


def run():
    conn = db.connect()
    ph = prompt_hash(SYSTEM, PROMPT_VERSION)
    pending = conn.execute("SELECT * FROM source_spans WHERE extracted = 0").fetchall()
    spans = [s for s in pending if _is_candidate(s["text"])]
    for s in [s for s in pending if not _is_candidate(s["text"])]:
        conn.execute("UPDATE source_spans SET extracted = 1 WHERE id = ?", (s["id"],))
    conn.commit()
    print(f"  triage: {len(spans)} candidate spans, {len(pending) - len(spans)} skipped (no signal)")

    total = verified = rejected = 0

    def _extract(span):
        return complete_json(SYSTEM, f"Sentence:\n\"\"\"{span['text']}\"\"\"")

    for span, items in map_parallel(_extract, spans, workers=4):
        if items is None:
            continue  # API failed; leave extracted=0 for a later retry
        conn.execute("UPDATE source_spans SET extracted = 1 WHERE id = ?", (span["id"],))
        if isinstance(items, list):
            for it in items:
                try:
                    claim_text = it["claim"].strip()
                    quote = it["exact_quote"]
                    interv = it["intervention_canonical"].strip()
                    cond = (it.get("condition") or "PMDD").strip() or "PMDD"
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


if __name__ == "__main__":
    run()
