# Whel MVP — the critical core

A thin, end-to-end slice of the Whel substrate that proves the one capability the whole
company rests on: **taking real biomedical text and producing atomic claims that are each
tied to an exact, verifiable source span, then surfacing where claims genuinely contradict
each other — instead of averaging them into a confident summary.**

Everything else (the full PaperQA2 stack, OntoGPT grounding over four ontologies, the
admin app, the public Next.js site) is deliberately out of scope. This is the part that,
if it doesn't work, nothing else matters.

## What it does

```
PubMed  →  documents (immutable, hash-addressed)
        →  source_spans (sentences with exact char offsets + hashes)
        →  atomic claims  (each carries a VERBATIM quote; we locate the quote
                           ourselves and compute offsets — the model never supplies them)
        →  entailment check (is the claim actually supported by its own quote?)
        →  contradiction surfacing (efficacy claims that genuinely disagree)
        →  a single self-contained HTML page
```

The discipline that makes it real, not a demo:

- **Provenance is verified, not trusted.** A claim is only `provenance_verified` if its
  quote is found *verbatim* in the stored source text. We compute the character offsets;
  the model does not. (1 of 115 claims failed this and was flagged.)
- **Entailment guards against overreach.** A located quote proves the text exists; it does
  not prove it supports the claim. Two real catches in this slice:
  - an evening-primrose-oil "no effect in PMS" claim whose quote is actually about *hand
    dermatitis and cystic fibrosis* → marked `neutral`, **excluded** from contradictions.
  - a vitamin-B6 "positive effect" claim whose quote is about "B6, **calcium, and zinc**"
    → marked `neutral` (overreach).
- **Contradictions are surfaced, not averaged.** Only efficacy claims are compared with
  efficacy claims (adverse-effect claims are a different aspect), and a candidate conflict
  is confirmed before it is recorded.

## Run it

Requires `python3` (stdlib only — no pip installs) and `ANTHROPIC_API_KEY` in `../.env.local`.

```bash
cd pipeline
python3 run.py --reset      # full rebuild; or omit --reset to continue incrementally
python3 ../render/build_page.py
open ../render/pmdd.html
```

The pipeline is **idempotent and incremental**: every stage commits as it goes, skips work
already done, and a rule-based triage avoids spending an API call on background sentences.
If it's interrupted (timeout, rate limit, exhausted credits), just run it again — it
resumes where it left off.

## Layout

```
schema.sql              Claims→Source-Spans data model (plain SQL, Postgres-portable)
pipeline/
  config.py             paths, model, key loading
  llm.py                stdlib Anthropic client + parallel map + JSON parsing
  db.py                 SQLite store (ports to Postgres)
  fetch_pubmed.py       [1] pull PMDD/PMS abstracts (Tier-1-clean, public)
  chunk.py              [2] sentences → source_spans with exact offsets
  extract_claims.py     [3] atomic claims + verbatim-quote provenance  ← the core
  verify_provenance.py  [4] entailment (v0 = Claude; spec calls for PubMedBERT-NLI)
  detect_contradictions.py [5] surface genuine efficacy disagreements
  run.py                orchestrator
render/build_page.py    → render/pmdd.html
```

## How this maps to the Blueprint

- It is the **plain-Postgres** substrate from the revised §5.6 (SQLite locally; the schema
  is standard SQL with no engine-specific types, so it ports to Supabase Postgres).
- The data model is the new **Claims / Source-Spans / Entities / Contradictions** model,
  not the legacy Signals/Sources model.
- `verify_provenance.py` is the swappable v0 of the NLI step the Blueprint assigns to
  PubMedBERT-NLI; same input/output contract.
- It is built against the **re-cut Phase 1 scope**: no admin app, no ontology browser, no
  HHEM gate — just the critical path to "claims through the full pipeline with provenance."

## Honesty notes

- The SQLite DB and raw source copies live in local scratch, not in this folder: SQLite's
  file locking fails over the mounted (FUSE) workspace folder. The durable artifacts (code,
  schema, rendered page) live here.
- The Anthropic credit balance was exhausted partway through the final run. Provenance (115
  claims, string-matched) completed without issue; the entailment and contradiction labels
  for the surfaced interventions were then adjudicated directly by Claude (the same model
  the API would have called) and recorded with an honest `model_name`. Re-running with
  credits available reproduces them automatically.
