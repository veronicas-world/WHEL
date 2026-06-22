# Whel cutover plan — legacy → substrate

Replace the legacy evidence system on the public site with the substrate (the new,
arm-aware, spec'd model) so the site shows **only the new model's findings**. Agreed
2026-06-16; this is the execution checklist.

## Decisions locked

- **Siphon the legacy model entirely.** The `repurposing_signals` engine — the
  LLM-synthesized single signal, its old 5-dimension scores, its old tiers (9–10 / 7–8 /
  4–6 / 0–3), its summaries and mechanism guesses — comes off the site completely. Nothing
  the legacy LLM *judged* survives onto the new site.
- **The substrate is the source of truth.** Signals, scores, tiers, rationales, and
  provenance all come from `substrate_signals` + its verbatim-verified `claims`. This is
  already computed (pipeline + arm-aware scoring + frozen calibration, 228 active signals).
- **Three evidence arms** (Direct, Pathway, Community). Cross-condition is **demoted** from
  a 4th arm to a separate, clearly-labelled *derived hypotheses* lens.
- **Female-applicability multiplier is first-class** — surfaced prominently on every
  signal (currently it appears nowhere; it is Whel's biggest differentiator).
- **Verbatim provenance** — evidence shown on a card is the substrate's quote-verified
  claims, not legacy source excerpts.
- **`validation_status` honesty stamp** (clinical / unvalidated_signal / preliminary),
  derived per pair at read time via SCORING_SPEC §6 anchor-and-corroborate.
- **Side layers re-derived substrate-native** (see mapping below) — all model-free.
- **Flip with one switch**, keeping the legacy path removable for a session as rollback,
  rather than a hard delete.

## Side-layer mapping (re-derive substrate-native — no Opus pass)

| Legacy layer | What it was | Substrate-native treatment |
|---|---|---|
| **L-grade** (L0–L3) | deterministic "does this pair have an RCT / guideline?" over the legacy corpus | **Absorbed by the substrate `rigor` dimension** (model-scored study design, per arm) + `source_tier`. Retire the separate chip; surface rigor/source_tier instead. |
| **Open Targets graph-support** | shared-target drug↔condition connection (side chip) | **Absorbed by the Pathway arm** — same Open Targets source, now scored first-class. Re-derive any "via target X" detail from the substrate's `opentargets` documents (`meta_json.record`). |
| **MATRIX** (Every Cure) | external 3rd-party repurposing score, name-keyed | **Re-key** to the substrate drug set (external lookup; re-run `check-matrix-coverage.py` against the new drug list). Genuinely independent — keep beside the score. |
| **sex-PK facts** | curated, sourced sex-specific PK (own table) | **Re-key** by drug name → substrate. Complements the female multiplier with concrete data. Keep. |
| **cycle-phase** | curated, sourced cycle-phase dependence | **Re-key** by drug+condition → substrate. Keep. |

## Stages

### Stage 0 — Verify production (Veronica, 1 query)
Confirm the substrate is live before wiring:
```sql
select arm, confidence_tier, count(*) from substrate_signals where status='active' group by 1,2;
```
Expect ~228 rows across direct/pathway/community. Same sanity check on `claims` (provenance)
and `entities`. If absent, apply migrations 047 / 050 / 051 in Supabase Studio first.

### Stage 1 — New data layer (`lib/substrate-candidates.ts`)
The foundation everything renders from.
- Read `substrate_signals` (status='active') joined to `entities` for intervention/condition labels.
- **Group by pair** (intervention_id, condition_id); implement SCORING_SPEC §6:
  direct anchors the headline; other arms render beside as corroboration; thin/absent-direct
  pairs still surface, stamped `unvalidated_signal`; single weak arm → `preliminary`.
- Map condition entity label → `conditions.slug`; best-effort resolve drug label → `compounds`
  for the factual "origin" line (FDA status — drug metadata, not a model judgment).
- Pull verbatim provenance from `claim_ids → claims → documents`.
- Extend the `Candidate` type: per-arm breakdown (5 new dimension names + rationales),
  `femaleApplicability {band, multiplier, rationale}`, `validationStatus`, per-arm tiers,
  contradiction flag/count, `synthesis_summary`, `mechanism_hypothesis`.
- New dimension vocabulary: corroboration / rigor / specificity / plausibility / consistency.
- Unit-test the pure logic (anchor-and-corroborate, validation_status) against the seed.

### Stage 1.5 — Substrate-native side layers
- Drop L-grade chip; surface `rigor` + `source_tier` instead.
- Re-derive graph "via target" detail from substrate `opentargets` docs (or fold into Pathway arm).
- Re-key MATRIX, sex-PK, cycle-phase to the substrate drug set.

### Stage 2 — Signal-display UI (the "presentation")
- `CandidateCard`: anchored headline + per-arm strengths beside it; the female-applicability
  multiplier as a first-class element; the `validation_status` stamp; verbatim evidence.
- Signal detail / `access/preview`: per-arm rationales, verbatim-quoted claims, female-
  applicability rationale, contradictions.
- `conditions/[slug]` + `ResearchSignalsTabs`: 3 arms not 4; per-arm tabs and tier display.
- Tier display logic updated to the frozen substrate cutoffs (8 / 6 / 3.5).

### Stage 3 — Cross-condition demotion
- `arm-mapping.ts`: remove `cross` from `ArmKey`; 3 arms only. Cross becomes a derived lens.
- `signal-types` page + accordion: 4 cards → 3 arms + a separate "derived hypotheses" explainer.
- Condition-page ARMS arrays: drop the cross arm.

### Stage 4 — Copy / methodology reframe
- `technical-architecture`: 4 arms → 3; new dimension names; tiers 8/6/3.5; female multiplier;
  anchor-and-corroborate; `substrate_signals`/`claims` tables; Opus 4.6 → **4.8**.
- `methodology`: the substrate scoring story; validation_status; off-topic guard.
- `platform`, homepage, `manifesto`: the 3-arm substrate narrative.
- Sweep all "Claude Opus 4.6" → "Opus 4.8" and legacy tier numbers.

### Stage 5 — Verify + flip
- Read the Next 16 docs in `node_modules/next/dist/docs/` first (per AGENTS.md).
- Build, typecheck, screenshot key pages, reconcile counts against the seed (228 active).
- Flip `getCandidates` → substrate; keep legacy path removable for one session as rollback.

## Files in scope (~18, per the recon map)
Data: `lib/candidates.ts` (→ new `lib/substrate-candidates.ts`), `lib/arm-mapping.ts`,
`app/components/CandidateCard.tsx`, `app/page.tsx`, `app/conditions/page.tsx`,
`app/conditions/[slug]/page.tsx`, `app/conditions/[slug]/ResearchSignalsTabs.tsx`,
`app/search/page.tsx`, `app/access/preview/[signalId]/page.tsx`, `app/candidates/page.tsx`.
Copy: `app/signal-types/*`, `app/about/technical-architecture/page.tsx`,
`app/about/methodology/page.tsx`, `app/platform/page.tsx`, `app/manifesto/page.tsx`,
`app/about/cross-condition/page.tsx`. Nav/footer link sweep.
