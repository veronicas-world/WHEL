# Whel — Handoff after MVP review

**Purpose of this file:** I went and looked at the MVP you built (`whel-mvp/`) with another Claude conversation, audited the code, and came out with a clear-eyed view of what is right, what needs to change, and where to go next. This is the briefing for picking back up. Read this first, then re-orient against `Whel-Reframe-Blueprint.docx` and the existing whel.bio codebase.

## TL;DR

I liked the work. The architecture choices, the discipline (verbatim-quote provenance, idempotent pipeline, triage filter, hash-addressed documents), and the schema design are solid and we are keeping them. **One thing needs to change:** location. The MVP gets rebuilt inside the live whel.bio Next.js + Supabase + Vercel repo, not as a separate `whel-mvp/` folder. Python stays — it matches the existing pattern in the repo and is the right call for the v1 architecture. **One thing must not happen again:** when API credits run out, stop and tell me. Do not self-adjudicate entailment labels or contradiction-confirmation results. That's the architectural failure mode the system is supposed to prevent.

## The deployment context — make this unambiguous

Whel.bio is a **live production site**, not a sandbox. It runs as:

- **Next.js 16 app** in `rediscover/` (this folder). Deployed to **Vercel** via `git push` — that's the deploy workflow.
- **Supabase Postgres** as the production database. All app data lives here. The Next.js app reads from it via `lib/supabase.ts`. The existing pipelines (both JS and Python) write to it.
- **Pipelines as CLI scripts** in `scripts/`. The existing pattern: `node scripts/research-pipeline.js "condition"` for JS scripts (e.g., `research-pipeline.js`, `clinicaltrials-pipeline.js`, `reddit-pipeline.js`) and `python3 scripts/extract-key-findings.py` for Python scripts (e.g., `verify-citations.py`, `classify-sources-study-type.py`, `extract-key-findings.py`). Both write to Supabase. Run locally, results land in the production database, the deployed site picks them up.

The substrate work lives in this same setup. It does NOT live as a parallel service, a separate folder, a separate database, or a separate deploy. New Supabase migration → new Python script in `scripts/` → new Next.js route in `app/`. That's it. Git push deploys.

## What was validated as good — keep doing this

I read the schema, all five pipeline modules, the README, and the rendered `pmdd.html` end to end. What's right and worth carrying over verbatim into the next iteration:

The data model. `documents → source_spans → claims → contradictions` with computed-not-trusted character offsets is the correct shape.

The verbatim-quote provenance check. Locating the LLM-supplied quote inside the stored source text and computing offsets ourselves is the central discipline of the whole system. 114 of 115 claims passing this check is a real result — the stage is deterministic and no API call is needed for it to be honest.

The triage filter. The rule-based keyword gate that avoids spending an LLM call on background sentences cut roughly 70% of API calls. Cost-saving and aligned with the Blueprint's female-specificity-filter idea.

The idempotent incremental pipeline. Per-stage commits with the `extracted=1` flagging means a timeout or rate-limit doesn't lose work. The repeated-pass-until-empty pattern is the right way to run this.

The aspect dimension (efficacy / safety / other). Catching that safety claims should not be compared against efficacy claims as contradictions was a real bug-find during the previous run. Keep the column, keep the filter.

Contradictions as a first-class table. Surfacing disagreement rather than averaging it into a tier is the wedge against Consensus / Elicit / UpToDate-style tools. Keep them as their own rows with both sides' provenance intact.

## What needs to change: location

The MVP currently lives in a separate `whel-mvp/` folder. The Blueprint recommends "fresh repo, strategic salvage" for the v1 platform rebuild — correct in the long run, but a different problem than "build an MVP that shows up on whel.bio." For the MVP specifically, integrate into the existing whel.bio Next.js + Supabase + Vercel app. The reasoning: the work needs to accumulate toward what is actually live, the existing design system / auth / deploy pipeline / URL should be leveraged, and progress should show up at whel.bio instead of beside it.

Concretely:

- **New Supabase migration**, numbered sequentially after `045_backfill_key_finding_excerpts.sql`, adds the substrate tables — `documents`, `source_spans`, `claims`, `contradictions`, `entities`, `extraction_runs`. Same column structure as `whel-mvp/schema.sql` but with `uuid` primary keys, `timestamptz` timestamps, `jsonb` for `meta_json`, and Postgres types instead of SQLite `TEXT`/`INTEGER`. This migration runs against the same Supabase project as the legacy tables.
- **The pipeline becomes Python scripts in `scripts/`**, following the existing pattern of `scripts/extract-key-findings.py` and `scripts/verify-citations.py`. Five stage files: `scripts/substrate/fetch-pubmed.py`, `chunk.py`, `extract-claims.py`, `verify-provenance.py`, `detect-contradictions.py`. Plus a `run.py` orchestrator. They use the **`supabase-py`** client to write to the production Supabase, the same `.env.local` pattern the existing scripts already use, and the same Claude API key. Run from the command line: `python3 scripts/substrate/run.py`.
- **The substrate display becomes a Next.js route** at `app/conditions/[slug]/substrate/page.tsx`. It reads from the new substrate tables via the existing `lib/supabase.ts` client. Renders using existing brand components (`Footer.tsx`, `Nav.tsx`, the magenta palette already in `globals.css`). Tailwind for styling, matching the rest of the app.
- **The rendered `whel-mvp/render/pmdd.html` is the visual reference.** The CSS and layout in that file map cleanly to React + Tailwind components.
- **Deploy is `git push`.** Same Vercel project, same domain, same workflow as every other change to whel.bio.

The legacy `conditions / compounds / repurposing_signals` data model stays valid and the existing condition pages keep working. The new substrate is **additive** — a new sibling route at first, not a replacement.

## On language: Python, not TypeScript

To be explicit because the previous version of this handoff said otherwise: **use Python**, matching the existing pattern. The repo already has Python pipelines writing to Supabase (`extract-key-findings.py` writes to `sources.key_finding_excerpt`, `verify-citations.py` writes to `audit-output/`, `classify-sources-study-type.py` writes back to `sources`). The substrate work follows the same pattern. The Blueprint §5.5 split (Python for extraction, TypeScript for app) is correct and that is what we are doing — Python in `scripts/substrate/`, TypeScript in `app/conditions/[slug]/substrate/page.tsx`. Communication between them is via Supabase: Python writes rows, Next.js reads rows. No HTTP service to host, no parallel deploy.

For the v1 architecture that adds PubMedBERT-NLI, MedCPT embeddings, and OntoGPT grounding, those are Python-native libraries and they belong in the same `scripts/substrate/` package or, if they need to be hot for query-time use, as a Python FastAPI service called from Next.js API routes over HTTP. Either way, Python.

## The do-not-self-verify rule, and how to scope to a limited credit budget

When the Anthropic credits ran out partway through the previous final run, the entailment verification and contradiction-adjudication steps were completed by the conversation itself — filling in `entailment_label`, `entailment_score`, and the contradictions' `nli_score` and `rationale` without making an API call. The README was honest about this, which I respect. But Whel's entire thesis is that **independent** model verification is the discipline that distinguishes us from "AI summary" tools. The same conversation thread that ran extraction acting as the verifier is exactly the architectural failure mode per-claim provenance is supposed to prevent. If we showed that demo to a clinician-researcher and they asked "what verified that the claim was entailed by the quote," the honest answer would be "the same Claude conversation that did the extraction," and the meeting ends.

**Hard rule going forward:** if credits run out, stop. Commit what you have. Surface the gap clearly. Don't fill in fields that look like API output but aren't.

**Important context for this round:** I am working with a limited Anthropic credit budget and may not be able to top up mid-run. That's fine — it just means we scope the work to honestly fit the credits available. Three acceptable paths, in order of preference:

1. **Tighter corpus.** Run the full five-stage pipeline against 3–5 PubMed papers instead of 17. Finishes within a small credit budget, completes every stage including entailment and contradiction, demonstrates the full architecture end-to-end. The architecture is what we're proving, not the corpus size.
2. **Deterministic-only first pass.** Ship only the extraction + verbatim-quote provenance stages (these are the parts that need no API after the extraction call itself). Skip entailment and contradiction surfacing in this round. Substrate page reflects this honestly with copy like "115 claims, each tied to a verbatim source span — entailment verification and contradiction surfacing in next iteration."
3. **Port the previous round's data.** The 115 extracted claims from `whel-mvp/` are real. Only the entailment scores and contradiction adjudication are contaminated. Port the documents / source_spans / claims rows into the new Supabase substrate tables, set `entailment_label = NULL` and `entailment_score = NULL` for those claims, omit contradictions entirely, and ship a substrate page that reflects "claims with provenance, entailment pending." Zero new API calls.

Default to path 1 unless I tell you otherwise. Path 2 is the fallback if 1 still exhausts the budget. Path 3 is the no-API option. Under no circumstances substitute the chat thread for the API.

## What to do next, in order

1. **Audit the existing whel.bio repo before writing anything.** Read `AGENTS.md` for the customized-Next.js warning. Look at `package.json`, `app/conditions/[slug]/page.tsx`, `lib/supabase.ts`, `scripts/research-pipeline.js` (the JS pipeline pattern), `scripts/extract-key-findings.py` (the **Python-writes-to-Supabase pattern you are mirroring**), and the most recent migrations in `supabase/migrations/`. The patterns are already established — match them.
2. **Write the Supabase migration.** Port `whel-mvp/schema.sql` to Postgres syntax with `uuid` primary keys, `timestamptz` timestamps, and `jsonb` where the SQLite schema uses `meta_json TEXT`. Number it sequentially after `045_backfill_key_finding_excerpts.sql`. Apply it to the live Supabase project (the same one the rest of whel.bio uses).
3. **Port the pipeline to Python in `scripts/substrate/`.** Five stage files mirroring `whel-mvp/pipeline/`: `fetch-pubmed.py`, `chunk.py`, `extract-claims.py`, `verify-provenance.py`, `detect-contradictions.py`. Plus `run.py`. Use **`supabase-py`** as the database client (matching `extract-key-findings.py`'s pattern), use the existing `.env.local` for `ANTHROPIC_API_KEY` and the Supabase service-role key. The schema-design, verbatim-quote check, triage filter, idempotent commits, parallel-map helper, and aspect dimension all carry over almost verbatim from the SQLite version — only the storage layer changes.
4. **Run extraction end-to-end against the live Supabase, scoped to the credit budget.** Default scope: 3–5 PMDD/PMS papers, full five-stage pipeline, all stages completing. If credits exhaust before completion — stop and surface. Do not self-verify under any circumstance.
5. **Build the substrate Next.js route.** New route under `app/conditions/[slug]/substrate/page.tsx`. Reads from the new Supabase tables via the existing `lib/supabase.ts`. Uses the rendered `whel-mvp/render/pmdd.html` as the visual reference. Existing brand components (`Nav.tsx`, `Footer.tsx`, magenta palette in `globals.css`), Tailwind for styling, matching the rest of the app.
6. **Test locally with `npm run dev`, then `git push` to deploy.** Same Vercel project that whel.bio already deploys from. No new infra.
7. **Legacy condition pages keep working through all of this.** The substrate route is additive. Decision about what to do with the legacy `conditions/[slug]/page.tsx` is for later — not now.

## What I want to leave intact from the previous round

The Blueprint revision you made (Apache AGE → plain Postgres in §5.6 and §6, QSBS update for 2025 OBBBA in §4.2, scope re-cut to 16–20 weeks in §10.3, Phase 2 gate fixed to letters of support in §10.4, licensing asterisks in §7 and §8, the stack-verification note in Appendix B) is correct. Keep it. Don't relitigate. The decision-log entries in Appendix C are correct. Don't revert them.

The 115 extracted claims and the three rendered contradictions in `whel-mvp/render/pmdd.html` are a reference output. When the new TypeScript pipeline runs against the same query set with real API verification, the output should be comparable. If it isn't, we figure out why before moving on — not by rationalizing the difference.

## Honest framing of the previous run, for your own context

What was real: the schema, the pipeline architecture, the engineering discipline, 115 extracted claims from 17 real PubMed papers, 114/115 verbatim-quote-matched provenance (this stage is deterministic, no API needed), the surfaced contradictions all map to real PubMed papers with real PMIDs (28178022 for essential fatty acids, 23136064 for Vitex vs. fluoxetine).

What was partly contaminated: the entailment confidence scores on the three rendered contradictions, and the contradiction-adjudication step itself. Both were filled in by the chat thread after API credits exhausted. Disclosed honestly in the README, but the `model_name` fields and the score values suggest API verification that didn't happen.

What was a query-design choice worth knowing: the 10 queries were deliberately paired ("evening primrose oil efficacy" + "evening primrose oil systematic review", "progesterone effective" + "progesterone no evidence Cochrane", etc.) to surface known contested topics. The "3 contradictions in 17 papers" headline reflects that the queries were aimed at known-disputed treatments, not the field's overall contradiction density. Fine for proof-of-concept; worth noting before citing the number to anyone.

---

**End of handoff. Open `Whel-Reframe-Blueprint.docx` for full strategy detail; this file is the delta from where the previous build left off.**
