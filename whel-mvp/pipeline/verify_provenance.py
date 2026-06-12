"""Stage 4 - entailment verification. A located quote proves the text EXISTS in the
source; it does not prove the quote SUPPORTS the claim. This stage checks that the
claim is actually entailed by its own cited quote, catching claims that say more than
the source supports (the subtle half of citation drift).

v0 uses Claude as the NLI judge. The Blueprint specifies PubMedBERT-NLI for this role;
this is the swappable placeholder, clearly labelled, with the same input/output contract.
"""
from llm import complete_json, prompt_hash, map_parallel
import db

SYSTEM = """You are a natural-language-inference (NLI) verifier for biomedical claims.
Given a PREMISE (a verbatim quote from a paper) and a HYPOTHESIS (a claim), decide whether the
premise supports the hypothesis. Judge ONLY against the premise text, not your own knowledge.

Labels:
- "entailed": the premise clearly supports the hypothesis.
- "neutral": the premise neither clearly supports nor contradicts it (the claim overreaches).
- "contradicted": the premise asserts the opposite.

Return ONLY JSON: {"label": "entailed"|"neutral"|"contradicted", "score": 0.0-1.0, "reason": str}
score = your confidence in the label."""

PROMPT_VERSION = "verify_provenance/v0-claude-nli"


def run():
    conn = db.connect()
    ph = prompt_hash(SYSTEM, PROMPT_VERSION)
    rows = conn.execute(
        "SELECT id, text, exact_quote FROM claims "
        "WHERE provenance_verified = 1 AND entailment_label IS NULL").fetchall()
    done = 0

    def _nli(c):
        user = f'PREMISE:\n"""{c["exact_quote"]}"""\n\nHYPOTHESIS:\n"""{c["text"]}"""'
        return complete_json(SYSTEM, user, max_tokens=400)

    for c, r in map_parallel(_nli, rows, workers=4):
        if not r:
            continue
        try:
            label = r["label"].strip()
            score = float(r.get("score", 0))
        except (KeyError, AttributeError, TypeError):
            continue
        conn.execute("UPDATE claims SET entailment_label=?, entailment_score=? WHERE id=?",
                     (label, score, c["id"]))
        done += 1
        if done % 10 == 0:
            conn.commit()
    conn.commit()
    # report
    counts = dict(conn.execute(
        "SELECT entailment_label, COUNT(*) FROM claims WHERE entailment_label IS NOT NULL "
        "GROUP BY entailment_label").fetchall())
    print(f"  verified entailment for {done} claims; labels: {counts}")
    return done


if __name__ == "__main__":
    run()
