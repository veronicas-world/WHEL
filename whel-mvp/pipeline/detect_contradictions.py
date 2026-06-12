"""Stage 5 - contradiction surfacing. The wedge: we expose disagreement, we do not
average it. Within each (intervention, condition) group we look for claim pairs whose
directions conflict (e.g. one says an intervention reduces PMDD symptoms, another says
it shows no benefit), then confirm the conflict with an NLI check and record it as a
first-class contradiction with both sides' provenance intact.
"""
from itertools import combinations
from datetime import datetime, timezone

from llm import complete_json, prompt_hash, map_parallel
from config import MODEL
import db

SYSTEM = """You judge whether two biomedical claims about the SAME intervention and condition
genuinely CONTRADICT each other (assert opposing conclusions about the treatment's effect),
versus merely differing in detail, population, or emphasis.

Return ONLY JSON: {"contradiction": true|false, "score": 0.0-1.0, "rationale": str}
Set contradiction=true only if a reader could not hold both as the bottom-line effect at once."""

PROMPT_VERSION = "detect_contradictions/v1"

# Direction pairs that are candidate conflicts worth checking with NLI.
# Stored as SORTED tuples because _pair_key sorts before lookup.
_CONFLICT = {
    tuple(sorted(("positive", "negative"))),
    tuple(sorted(("positive", "null"))),
    tuple(sorted(("negative", "null"))),
}


def _pair_key(a, b):
    return tuple(sorted((a, b)))


def run():
    conn = db.connect()
    ph = prompt_hash(SYSTEM, PROMPT_VERSION)
    # Group verified EFFICACY claims by (intervention, condition). We only compare
    # like with like: an adverse-effect (safety) claim is not a contradiction of an
    # efficacy claim, so safety/other aspects are excluded from contradiction candidates.
    groups = {}
    rows = conn.execute(
        "SELECT id, text, intervention_id, condition_id, direction, exact_quote "
        "FROM claims WHERE provenance_verified = 1 AND aspect = 'efficacy'").fetchall()
    for r in rows:
        groups.setdefault((r["intervention_id"], r["condition_id"]), []).append(r)

    # Build candidate pairs (same intervention+condition, conflicting directions).
    candidates = []
    for (iid, cid), claims in groups.items():
        for a, b in combinations(claims, 2):
            if _pair_key(a["direction"], b["direction"]) not in _CONFLICT:
                continue
            if conn.execute(
                "SELECT 1 FROM contradictions WHERE (claim_a_id=? AND claim_b_id=?) "
                "OR (claim_a_id=? AND claim_b_id=?)",
                (a["id"], b["id"], b["id"], a["id"])).fetchone():
                continue
            candidates.append((iid, cid, a, b))

    def _check(cand):
        _, _, a, b = cand
        user = (f'CLAIM A:\n"""{a["text"]}"""\n(quote: "{a["exact_quote"]}")\n\n'
                f'CLAIM B:\n"""{b["text"]}"""\n(quote: "{b["exact_quote"]}")')
        return complete_json(SYSTEM, user, max_tokens=400)

    found = 0
    for (iid, cid, a, b), r in map_parallel(_check, candidates, workers=4):
        if not r:
            continue
        if r.get("contradiction") is True and float(r.get("score", 0)) >= 0.6:
            conn.execute(
                "INSERT OR IGNORE INTO contradictions (id, claim_a_id, claim_b_id,"
                " intervention_id, condition_id, nli_label, nli_score, rationale,"
                " model_name, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (db.new_id(), a["id"], b["id"], iid, cid, "contradiction",
                 float(r.get("score", 0)), r.get("rationale", ""), MODEL,
                 datetime.now(timezone.utc).isoformat()))
            found += 1
            conn.commit()
            print(f"  ! contradiction surfaced (score {r.get('score')})")
    conn.commit()
    print(f"  surfaced {found} contradictions ({len(candidates)} candidate pairs checked)")
    return found


if __name__ == "__main__":
    run()
