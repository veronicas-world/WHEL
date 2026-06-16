"""Hydrate the LOCAL working store from the EXISTING Supabase substrate.

The scorer (score_claims.py) reads the local SQLite working store — gitignored
scratch that is empty on a fresh checkout. The verified claims already live in
Supabase (migrations 046/047). This pulls them down (entities, documents,
source_spans, claims, contradictions) so you can score them WITHOUT re-fetching
PubMed or re-running extraction — no model spend. Read-only on Supabase (anon key,
the same public key the site uses); writes only to the local store. Idempotent
(INSERT OR IGNORE on id).

    python3 scripts/substrate/hydrate_workstore.py

If it reports 0 verified claims, the substrate isn't applied to Supabase yet —
build it locally instead: python3 scripts/substrate/run.py
"""
import json

import db
import sb


def _fetch_all(table, cols, order="id"):
    """Page through a PostgREST table, returning all rows."""
    rows, offset, page = [], 0, 1000
    sel = ",".join(cols)
    while True:
        batch = sb.get(f"{table}?select={sel}&order={order}&limit={page}&offset={offset}")
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < page:
            break
        offset += page
    return rows


def _b(v):
    return 1 if v else 0


def run():
    conn = db.init_db(reset=False)  # create tables if missing; keep any existing rows

    ents = _fetch_all("entities", ["id", "type", "label", "norm_key", "ontology_id"])
    for e in ents:
        conn.execute(
            "INSERT OR IGNORE INTO entities (id,type,label,norm_key,ontology_id) VALUES (?,?,?,?,?)",
            (e["id"], e["type"], e["label"], e["norm_key"], e.get("ontology_id")))

    docs = _fetch_all("documents", ["id", "content_sha256", "source", "external_id", "url",
                                    "title", "raw_text", "retrieved_at", "meta"])
    for d in docs:
        meta = d.get("meta")
        conn.execute(
            "INSERT OR IGNORE INTO documents (id,content_sha256,source,external_id,url,title,"
            "raw_text,retrieved_at,meta_json) VALUES (?,?,?,?,?,?,?,?,?)",
            (d["id"], d["content_sha256"], d["source"], d.get("external_id"), d.get("url"),
             d.get("title"), d["raw_text"], d["retrieved_at"],
             json.dumps(meta) if meta is not None else None))

    spans = _fetch_all("source_spans", ["id", "document_id", "start_char", "end_char", "text",
                                        "sha256", "ordinal", "extracted"])
    for s in spans:
        conn.execute(
            "INSERT OR IGNORE INTO source_spans (id,document_id,start_char,end_char,text,sha256,"
            "ordinal,extracted) VALUES (?,?,?,?,?,?,?,?)",
            (s["id"], s["document_id"], s["start_char"], s["end_char"], s["text"], s["sha256"],
             s["ordinal"], _b(s.get("extracted"))))

    claims = _fetch_all("claims", ["id", "span_id", "document_id", "text", "exact_quote",
                                   "quote_start_char", "quote_end_char", "intervention_id",
                                   "condition_id", "outcome", "aspect", "direction",
                                   "provenance_verified", "entailment_label", "entailment_score",
                                   "model_name", "prompt_hash", "created_at"])
    for c in claims:
        conn.execute(
            "INSERT OR IGNORE INTO claims (id,span_id,document_id,text,exact_quote,quote_start_char,"
            "quote_end_char,intervention_id,condition_id,outcome,aspect,direction,provenance_verified,"
            "entailment_label,entailment_score,model_name,prompt_hash,created_at)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (c["id"], c["span_id"], c["document_id"], c["text"], c["exact_quote"],
             c.get("quote_start_char"), c.get("quote_end_char"), c.get("intervention_id"),
             c.get("condition_id"), c.get("outcome"), c.get("aspect"), c.get("direction"),
             _b(c.get("provenance_verified")), c.get("entailment_label"), c.get("entailment_score"),
             c.get("model_name"), c.get("prompt_hash"), c["created_at"]))

    contras = _fetch_all("contradictions", ["id", "claim_a_id", "claim_b_id", "intervention_id",
                                            "condition_id", "nli_label", "nli_score", "rationale",
                                            "model_name", "created_at"])
    for x in contras:
        conn.execute(
            "INSERT OR IGNORE INTO contradictions (id,claim_a_id,claim_b_id,intervention_id,"
            "condition_id,nli_label,nli_score,rationale,model_name,created_at)"
            " VALUES (?,?,?,?,?,?,?,?,?,?)",
            (x["id"], x["claim_a_id"], x["claim_b_id"], x.get("intervention_id"),
             x.get("condition_id"), x["nli_label"], x.get("nli_score"), x.get("rationale"),
             x.get("model_name"), x["created_at"]))

    conn.commit()
    counts = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
              for t in ["entities", "documents", "source_spans", "claims", "contradictions"]}
    v = conn.execute("SELECT COUNT(*) FROM claims WHERE provenance_verified=1").fetchone()[0]
    print("  hydrated local working store from Supabase:")
    for t, n in counts.items():
        print(f"    {t:14s} {n}")
    print(f"    (provenance-verified claims: {v})")
    if v == 0:
        print("\n  No verified claims found in Supabase — the substrate may not be applied there.")
        print("  Build it locally instead: python3 scripts/substrate/run.py")
    else:
        print("\n  Ready to score:  python3 scripts/substrate/score_claims.py --limit 8 --model <your-opus-4.8-id>")
    return counts


if __name__ == "__main__":
    run()
