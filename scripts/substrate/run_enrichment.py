#!/usr/bin/env python3
"""Entry point for substrate enrichment (source validation + ontology grounding).

Reads the live substrate read-only and emits supabase/migrations/048_substrate_grounding.sql
for review and apply in Supabase Studio. Writes nothing to the database directly.

    python3 scripts/substrate/run_enrichment.py
"""
import enrich

if __name__ == "__main__":
    enrich.main()
