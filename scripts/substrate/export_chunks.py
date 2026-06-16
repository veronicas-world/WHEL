"""Emit editor-sized seed chunks DIRECTLY from the work store (no SQL re-parsing).

The earlier approach split the already-rendered 047/051 .sql text and a tricky
raw_text literal confused the quote tracker, dropping a documents row. This builds
each INSERT straight from a DB row — one row == one statement, unambiguously — then
groups statements (in strict FK-dependency order) into BEGIN/COMMIT chunks under a
size cap. Reuses the exact column lists from export_migration / score_claims so the
shapes match migrations 046 and 050.

Usage:
    python3 scripts/substrate/export_chunks.py <out-dir> <target_kb>
"""
import sys
import json
import pathlib

import db
from export_migration import q
from score_claims import _EXPORT_COLS, _BOOL_COLS, _q, WORK_SCHEMA


def base_statements(conn):
    """Ordered INSERTs for the substrate base, FK-safe: entities → documents →
    source_spans → claims → contradictions."""
    S = []

    for r in conn.execute("SELECT id, type, label, norm_key, ontology_id FROM entities"):
        S.append((
            "entities",
            f"INSERT INTO entities (id, type, label, norm_key, ontology_id) VALUES "
            f"({q(r['id'])}, {q(r['type'])}, {q(r['label'])}, {q(r['norm_key'])}, {q(r['ontology_id'])}) "
            "ON CONFLICT (id) DO NOTHING;"))

    for d in conn.execute(
        "SELECT id, content_sha256, source, external_id, url, title, raw_text, retrieved_at, meta_json"
        " FROM documents"):
        meta = f"{q(d['meta_json'])}::jsonb" if d["meta_json"] else "NULL"
        S.append((
            "documents",
            "INSERT INTO documents (id, content_sha256, source, external_id, url, title, raw_text,"
            " retrieved_at, meta) VALUES ("
            f"{q(d['id'])}, {q(d['content_sha256'])}, {q(d['source'])}, {q(d['external_id'])}, "
            f"{q(d['url'])}, {q(d['title'])}, {q(d['raw_text'])}, {q(d['retrieved_at'])}, {meta}) "
            "ON CONFLICT (id) DO NOTHING;"))

    for s in conn.execute(
        "SELECT id, document_id, start_char, end_char, text, sha256, ordinal, extracted FROM source_spans"):
        S.append((
            "source_spans",
            "INSERT INTO source_spans (id, document_id, start_char, end_char, text, sha256, ordinal,"
            " extracted) VALUES ("
            f"{q(s['id'])}, {q(s['document_id'])}, {q(s['start_char'])}, {q(s['end_char'])}, "
            f"{q(s['text'])}, {q(s['sha256'])}, {q(s['ordinal'])}, {q(bool(s['extracted']))}) "
            "ON CONFLICT (id) DO NOTHING;"))

    for c in conn.execute(
        "SELECT id, span_id, document_id, text, exact_quote, quote_start_char, quote_end_char,"
        " intervention_id, condition_id, outcome, aspect, direction, provenance_verified,"
        " entailment_label, entailment_score, model_name, prompt_hash, created_at FROM claims"):
        S.append((
            "claims",
            "INSERT INTO claims (id, span_id, document_id, text, exact_quote, quote_start_char,"
            " quote_end_char, intervention_id, condition_id, outcome, aspect, direction,"
            " provenance_verified, entailment_label, entailment_score, model_name, prompt_hash,"
            " created_at) VALUES ("
            f"{q(c['id'])}, {q(c['span_id'])}, {q(c['document_id'])}, {q(c['text'])}, "
            f"{q(c['exact_quote'])}, {q(c['quote_start_char'])}, {q(c['quote_end_char'])}, "
            f"{q(c['intervention_id'])}, {q(c['condition_id'])}, {q(c['outcome'])}, {q(c['aspect'])}, "
            f"{q(c['direction'])}, {q(bool(c['provenance_verified']))}, {q(c['entailment_label'])}, "
            f"{q(c['entailment_score'])}, {q(c['model_name'])}, {q(c['prompt_hash'])}, {q(c['created_at'])}) "
            "ON CONFLICT (id) DO NOTHING;"))

    for c in conn.execute(
        "SELECT id, claim_a_id, claim_b_id, intervention_id, condition_id, nli_label, nli_score,"
        " rationale, model_name, created_at FROM contradictions"):
        cols = ["id", "claim_a_id", "claim_b_id", "intervention_id", "condition_id",
                "nli_label", "nli_score", "rationale", "model_name", "created_at"]
        vals = ", ".join(q(c[k]) for k in cols)
        S.append(("contradictions",
                  f"INSERT INTO contradictions ({', '.join(cols)}) VALUES ({vals}) ON CONFLICT (id) DO NOTHING;"))

    return S


def signal_statements(conn):
    """INSERTs for substrate_signals (active only), matching score_claims export."""
    conn.executescript(WORK_SCHEMA)
    S = []
    collist = ", ".join(_EXPORT_COLS)
    for r in conn.execute(f"SELECT {collist} FROM substrate_signals WHERE status='active'"):
        vals = []
        for c in _EXPORT_COLS:
            v = r[c]
            if c == "claim_ids":
                ids = json.loads(v) if v else []
                vals.append("'{" + ",".join(ids) + "}'" if ids else "NULL")
            elif c in _BOOL_COLS:
                vals.append(_q(bool(v)))
            else:
                vals.append(_q(v))
        S.append(f"INSERT INTO substrate_signals ({collist}) VALUES ({', '.join(vals)}) "
                 "ON CONFLICT (intervention_id, condition_id, aspect, arm) DO NOTHING;")
    return S


def write_chunks(stmts, stem, out, target):
    chunks, cur, size = [], [], 0
    for s in stmts:
        if cur and size + len(s) > target:
            chunks.append(cur); cur, size = [], 0
        cur.append(s); size += len(s) + 1
    if cur:
        chunks.append(cur)
    total = len(chunks)
    for k, c in enumerate(chunks, 1):
        body = "\n".join(c)
        (out / f"{stem}__part{k:02d}_of_{total:02d}.sql").write_text(
            f"-- {stem} — apply part {k} of {total} (run in order)\nBEGIN;\n{body}\nCOMMIT;\n")
    print(f"  {stem}: {len(stmts)} statements -> {total} chunk(s)")
    return total


def main():
    out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    target = int(sys.argv[2]) * 1024
    # clear any prior chunks so nothing stale lingers
    for f in out.glob("0*.sql"):
        f.unlink()
    for f in out.glob("047_*.sql"):
        f.unlink()
    for f in out.glob("051_*.sql"):
        f.unlink()
    conn = db.connect()
    base = base_statements(conn)
    from collections import Counter
    print("  base statement counts:", dict(Counter(t for t, _ in base)))
    write_chunks([s for _, s in base], "047_substrate_seed_pmdd", out, target)
    write_chunks(signal_statements(conn), "051_substrate_signals_seed", out, target)


if __name__ == "__main__":
    main()
