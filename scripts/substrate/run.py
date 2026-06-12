#!/usr/bin/env python3
"""Whel substrate pipeline — orchestrator.

  PubMed -> documents -> source_spans -> atomic claims (verified provenance)
  -> entailment verification -> contradiction surfacing
  -> supabase/migrations/047_substrate_seed_pmdd.sql (review + apply in Studio)

Run from the repo root:
    python3 scripts/substrate/run.py            # incremental
    python3 scripts/substrate/run.py --reset    # rebuild the local working store
    python3 scripts/substrate/run.py --max-docs 4

HARD RULE: if Anthropic credits run out mid-run, we STOP, commit what exists,
export it, and surface the gap. We never fabricate entailment or contradiction
output. Independent model verification is the whole thesis; faking it is the one
failure mode this system exists to prevent.
"""
import sys
import argparse

import db
import fetch_pubmed
import chunk
import extract_claims
import verify_provenance
import detect_contradictions
import export_migration
from llm import usage_snapshot, CreditsExhausted


def _print_usage(stage):
    u = usage_snapshot()
    print(f"  [usage after {stage}] {u['calls']} calls, "
          f"{u['input_tokens']}+{u['output_tokens']} tok, ~${u['est_cost_usd']:.4f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--reset", action="store_true")
    ap.add_argument("--max-docs", type=int, default=5)
    args = ap.parse_args()

    print("== Whel substrate pipeline ==")
    db.init_db(reset=args.reset)

    print("\n[1/5] Fetch PMDD/PMS abstracts from PubMed ...")
    fetch_pubmed.run(max_documents=args.max_docs)
    print("\n[2/5] Chunk into source spans ...")
    print(f"  {chunk.run()} new spans")

    stopped = None
    try:
        print("\n[3/5] Extract atomic claims with verified provenance ...")
        extract_claims.run()
        _print_usage("extraction")

        print("\n[4/5] Verify entailment (claim supported by its quote) ...")
        verify_provenance.run()
        _print_usage("entailment")

        print("\n[5/5] Surface contradictions ...")
        detect_contradictions.run()
        _print_usage("contradictions")
    except CreditsExhausted as e:
        stopped = str(e)

    print("\n[export] Writing seed migration + run log ...")
    export_migration.run(usage=usage_snapshot())

    conn = db.connect()
    s = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
         for t in ["documents", "source_spans", "claims", "contradictions"]}
    v = conn.execute("SELECT COUNT(*) FROM claims WHERE provenance_verified=1").fetchone()[0]
    el = conn.execute("SELECT COUNT(*) FROM claims WHERE entailment_label IS NOT NULL").fetchone()[0]
    print("\n== Substrate summary ==")
    print(f"  documents:               {s['documents']}")
    print(f"  source spans:            {s['source_spans']}")
    print(f"  claims:                  {s['claims']}  (provenance-verified: {v})")
    print(f"  entailment labeled:      {el}")
    print(f"  contradictions surfaced: {s['contradictions']}")

    if stopped:
        print("\n" + "!" * 64)
        print("CREDITS EXHAUSTED — pipeline stopped early. NOTHING was self-adjudicated.")
        print(f"  Anthropic: {stopped}")
        print("  What completed is committed and exported. Stages that did not run have")
        print("  NULL entailment_label / no contradictions — honestly reflecting the gap.")
        print("  Top up credits and re-run `python3 scripts/substrate/run.py` to finish;")
        print("  the pipeline is idempotent and resumes where it left off.")
        print("!" * 64)
        return 3
    print("\nNext: apply migrations 046 then 047 in Supabase Studio, then view the substrate route.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
