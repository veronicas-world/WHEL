"""End-to-end MVP pipeline:
  PubMed -> documents -> source_spans -> atomic claims (verified provenance)
  -> entailment verification -> contradiction surfacing -> rendered PMDD page.

Run:  python3 run.py            (incremental; reuses existing data)
      python3 run.py --reset    (wipe the substrate and rebuild from scratch)
"""
import sys
import db
import fetch_pubmed
import chunk
import extract_claims
import verify_provenance
import detect_contradictions


def main():
    reset = "--reset" in sys.argv
    print("== Whel MVP pipeline ==")
    db.init_db(reset=reset)

    print("\n[1/5] Fetch PMDD abstracts from PubMed ...")
    fetch_pubmed.run(per_query=2)

    print("\n[2/5] Chunk documents into source spans ...")
    n = chunk.run()
    print(f"  {n} new spans")

    print("\n[3/5] Extract atomic claims with verified provenance ...")
    extract_claims.run()

    print("\n[4/5] Verify entailment (claim supported by its quote) ...")
    verify_provenance.run()

    print("\n[5/5] Surface contradictions ...")
    detect_contradictions.run()

    # summary
    conn = db.connect()
    docs = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    spans = conn.execute("SELECT COUNT(*) FROM source_spans").fetchone()[0]
    claims = conn.execute("SELECT COUNT(*) FROM claims").fetchone()[0]
    vclaims = conn.execute("SELECT COUNT(*) FROM claims WHERE provenance_verified=1").fetchone()[0]
    contra = conn.execute("SELECT COUNT(*) FROM contradictions").fetchone()[0]
    print("\n== Substrate summary ==")
    print(f"  documents:              {docs}")
    print(f"  source spans:           {spans}")
    print(f"  claims:                 {claims}")
    print(f"  provenance-verified:    {vclaims}")
    print(f"  contradictions surfaced:{contra}")
    print("\nNext: python3 ../render/build_page.py")


if __name__ == "__main__":
    main()
