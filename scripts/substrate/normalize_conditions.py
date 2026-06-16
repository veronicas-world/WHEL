"""One-off cleanup — fold fragmented condition labels into the canonical six.

Extraction surfaces condition labels verbatim from each source, so the same disease
fragments across many near-duplicate rows: "vasomotor symptoms", "hot flashes" and
"genitourinary syndrome of menopause" are all menopause; "PMS", "PMS/PMDD" and
"premenstrual anxiety" are PMDD; "vestibulodynia" is vulvodynia. Left alone, the
evidence for one intervention splits across several condition rows and never
corroborates itself.

This script uses config.canonical_condition() (the single source of truth, also wired
into extract_claims for go-forward) to:

  1. MERGE each in-scope variant entity into its canonical condition entity:
     re-point claims.condition_id and contradictions.condition_id, then delete the
     now-orphaned variant entity.
  2. SUPPRESS conditions outside Whel's six (e.g. breast cancer, cardiovascular
     disease, dysmenorrhea, anxiety, latent hyperprolactinaemia) by marking their
     substrate_signals status='off_scope' (kept for audit, excluded from surfacing).
     Their claims are left in place but never scored as one of the six.
  3. DELETE only the stale signals: the orphaned variant signals, plus the canonical
     signals whose claim membership actually changed because a variant merged in. It
     does NOT touch canonical signals that gained nothing — so re-scoring is minimal.

After running, re-score just the affected groups (no re-pay for the rest):

    python3 scripts/substrate/normalize_conditions.py            # apply
    python3 scripts/substrate/normalize_conditions.py --dry-run  # preview only
    python3 scripts/substrate/score_claims.py --model claude-opus-4-8 --only-unscored

Idempotent: a second run finds no variants and no new off-scope rows and is a no-op.
Operates ONLY on the local working store (config.WORK_DB); writes nothing to Postgres.
"""
import sys
import argparse
from datetime import datetime, timezone

import db
from config import canonical_condition, CONDITIONS
from score_claims import arm_for_source, WORK_SCHEMA


def _norm(s):
    import re
    return re.sub(r"\s+", " ", str(s)).strip().lower()


def _canonical_target(conn, ck):
    """Entity id of the canonical-labelled condition for key `ck` (e.g. 'menopause'),
    creating it if no document ever tagged that exact canonical spelling."""
    canon_label = CONDITIONS[ck]["canonical"]
    norm = _norm(canon_label)
    row = conn.execute("SELECT id FROM entities WHERE type='condition' AND norm_key=?",
                       (norm,)).fetchone()
    if row:
        return row["id"]
    eid = db.new_id()
    conn.execute("INSERT INTO entities (id, type, label, norm_key) VALUES (?,?,?,?)",
                 (eid, "condition", canon_label, norm))
    return eid


def run(dry_run=False):
    conn = db.connect()
    conn.executescript(WORK_SCHEMA)  # ensure substrate_signals exists
    conn.commit()

    conds = conn.execute("SELECT id, label FROM entities WHERE type='condition'").fetchall()

    # Classify every condition entity.
    canon_ids = {}          # ck -> canonical entity id (resolved lazily)
    variants = []           # (variant_row, ck)
    offscope = []           # rows outside the six
    for r in conds:
        ck = canonical_condition(r["label"])
        if ck is None:
            offscope.append(r)
            continue
        tgt = canon_ids.get(ck)
        if tgt is None:
            tgt = canon_ids[ck] = _canonical_target(conn, ck)
        if r["id"] != tgt:
            variants.append((r, ck))

    # Which canonical (intervention, condition, aspect, arm) groups actually GAIN claims
    # from a merge — computed from variant claims BEFORE we re-point them.
    changed_groups = set()
    for r, ck in variants:
        rows = conn.execute(
            "SELECT cl.intervention_id iv, cl.aspect, d.source"
            " FROM claims cl JOIN documents d ON cl.document_id = d.id"
            " WHERE cl.condition_id=? AND cl.provenance_verified=1", (r["id"],)).fetchall()
        for x in rows:
            changed_groups.add((canon_ids[ck], x["iv"], x["aspect"] or "efficacy",
                                arm_for_source(x["source"])))

    var_ids = [r["id"] for r, _ in variants]
    off_ids = [r["id"] for r in offscope]

    # ── Report ──
    print(f"  condition entities: {len(conds)}  ->  canonical {len(canon_ids)}, "
          f"variants {len(variants)}, off-scope {len(offscope)}")
    for r, ck in variants:
        n = conn.execute("SELECT COUNT(*) FROM claims WHERE condition_id=?", (r["id"],)).fetchone()[0]
        print(f"    merge  {r['label']!r:48s} -> {ck:14s} ({n} claim(s))")
    for r in offscope:
        n = conn.execute("SELECT COUNT(*) FROM claims WHERE condition_id=?", (r["id"],)).fetchone()[0]
        print(f"    off-scope  {r['label']!r:44s} ({n} claim(s)) -> suppress signals")

    if dry_run:
        # Count the stale signals we WOULD delete, without changing anything.
        del_var = _count_signals(conn, var_ids)
        del_chg = sum(_count_group(conn, g) for g in changed_groups)
        off_sig = _count_signals(conn, off_ids)
        print(f"\n  [dry-run] would delete {del_var} orphaned variant signal(s) + "
              f"{del_chg} changed canonical signal(s) for re-score;")
        print(f"  [dry-run] would mark {off_sig} signal(s) off_scope.")
        print(f"  [dry-run] groups to re-score afterwards: {len(changed_groups)}. No changes written.")
        return 0

    now = datetime.now(timezone.utc).isoformat()

    # ── 1. Merge variants: re-point claims + contradictions, drop the orphan entity ──
    repointed_claims = repointed_contra = 0
    for r, ck in variants:
        tgt = canon_ids[ck]
        cur = conn.execute("UPDATE claims SET condition_id=? WHERE condition_id=?", (tgt, r["id"]))
        repointed_claims += cur.rowcount
        cur = conn.execute("UPDATE contradictions SET condition_id=? WHERE condition_id=?", (tgt, r["id"]))
        repointed_contra += cur.rowcount

    # ── 2. Delete the stale signals (orphaned variant + changed canonical) ──
    deleted_sig = 0
    if var_ids:
        q = ",".join("?" * len(var_ids))
        deleted_sig += conn.execute(
            f"DELETE FROM substrate_signals WHERE condition_id IN ({q})", var_ids).rowcount
    for cd, iv, asp, arm in changed_groups:
        deleted_sig += conn.execute(
            "DELETE FROM substrate_signals WHERE condition_id=? AND intervention_id=?"
            " AND aspect=? AND arm=?", (cd, iv, asp, arm)).rowcount

    # Now drop the orphaned variant entities (no claim/contradiction references remain).
    dropped = 0
    for r, _ in variants:
        dropped += conn.execute("DELETE FROM entities WHERE id=?", (r["id"],)).rowcount

    # ── 3. Suppress off-scope condition signals (keep for audit, exclude from surfacing) ──
    off_marked = 0
    if off_ids:
        q = ",".join("?" * len(off_ids))
        off_marked = conn.execute(
            f"UPDATE substrate_signals SET status='off_scope', updated_at=?"
            f" WHERE condition_id IN ({q}) AND status!='off_scope'", [now, *off_ids]).rowcount

    conn.commit()

    print(f"\n  merged: re-pointed {repointed_claims} claim(s), {repointed_contra} contradiction(s); "
          f"dropped {dropped} variant entity(ies)")
    print(f"  deleted {deleted_sig} stale signal(s) (will re-score {len(changed_groups)} group(s))")
    print(f"  marked {off_marked} signal(s) off_scope")
    active = conn.execute("SELECT COUNT(*) FROM substrate_signals WHERE status='active'").fetchone()[0]
    print(f"  active signals now: {active}")
    print("\n  Next — re-score only the affected groups (no re-pay for the rest):")
    print("    python3 scripts/substrate/score_claims.py --model claude-opus-4-8 --only-unscored")
    return 0


def _count_signals(conn, ids):
    if not ids:
        return 0
    q = ",".join("?" * len(ids))
    return conn.execute(
        f"SELECT COUNT(*) FROM substrate_signals WHERE condition_id IN ({q})", ids).fetchone()[0]


def _count_group(conn, g):
    cd, iv, asp, arm = g
    return conn.execute(
        "SELECT COUNT(*) FROM substrate_signals WHERE condition_id=? AND intervention_id=?"
        " AND aspect=? AND arm=?", (cd, iv, asp, arm)).fetchone()[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="preview the merges, write nothing")
    args = ap.parse_args()
    print("== Whel substrate — condition normalization ==")
    return run(dry_run=args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
