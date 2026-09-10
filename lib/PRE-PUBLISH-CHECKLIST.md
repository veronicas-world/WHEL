# Pre-Publish Checklist — resolve before flipping SIGNALS_PUBLISHED to true

This file lives next to `lib/site-config.ts` so it sits where whoever flips
the flag will see it. Every item below must be resolved before the site can
go live. The flag is currently **not safe to flip**.

**Denominator traceability:** Figures derived from `scoring-v13-snapshot.json` use a denominator of 226, which includes 8 signals since purged as extraction artifacts; current active count is 220. Do not recompute those historical figures.

---

## 1. TIER_CUTOFFS must be re-derived on the post-rescore lattice

**File:** `lib/substrate-helpers.mjs` — `TIER_CUTOFFS`

**Problem:** The current cutoffs (7.5 / 3.5) were set on the v1.3 lattice
(0–10, five dimensions). SCORING_SPEC §5 says "3.5 / 7.5 are not frozen" and
"will both move" when the scale drops to 0–8. On the v1.4 lattice (0–8,
four dimensions, integers 0–8), a cutoff at 7.5 means Strong requires a
score of 8 — all four dimensions at maximum with no consistency penalty.

Remapping the v1.3 snapshot onto the 0–8 scale puts **0 signals at score 8**
(with penalty) or **1 signal** (without penalty). The old 12 Strong signals
all remap to 6–7. Strong is empty or nearly empty under 7.5.

**3.5 is also wrong.** The remapped mode is 4 (54 signals), near-mode 5 (52).
Rule (b) says no cutoff on or adjacent to a modal value. 3.5 sits directly
adjacent to the mode. Both cutoffs were derived on the old lattice and both
need re-deriving.

**Structural findings from the remap** (run `python3 scripts/remap-snapshot-to-v14.py`):

- **The consistency penalty is inert.** It fires on 4 of 226 signals (1.8%).
  The other 222 get penalty 0. As a discriminator between tiers, it does
  nothing. The v1.4 rule needs direction-agreement data the snapshot doesn't
  carry (see `scripts/remap-snapshot-to-v14.py` docstring, WHAT IT DOES NOT DO).

- **Half the corpus is capped at 6.** 116 signals (51%) are single-source
  (corroboration = 0), so their arithmetic maximum on the 0–8 scale is 6
  (three dimensions at 2, corroboration at 0). Any Strong cutoff above 6
  excludes half the corpus by construction.

- **The top of the scale is structurally unreachable.** 4 signals score 7,
  0–1 score 8. The cliff at 6 (37 signals → 4 → 0) means no cutoff produces
  a Strong tier that is both non-trivial in size and sits in a sparse region.
  63% of signals are packed into scores 4–6. This is not a cutoff problem;
  it is a rubric question: whether four 0–2 dimensions can produce enough
  spread at the top to distinguish "strong" from "emerging."

- **The "pessimistic" scenario is NOT a lower bound.** Assigning -1 to all
  174 signals at old consistency = 1 would double-penalize single-source
  rows whose rationale reads "n/a" — penalizing them through corroboration
  (already 0) and consistency (−1) both. The v1.4 rule specifically exempts
  single-source signals from the penalty. Do not cite the pessimistic
  scenario as a bound.

**Action:** Run the rescore, derive new cutoffs on the post-rescore lattice
following SCORING_SPEC §5b rules (a) and (b), freeze them, and update
`TIER_CUTOFFS` here. This is the single most important blocker.

**Rescore order:** See [`docs/rescore-runbook.md`](../docs/rescore-runbook.md).
The rescore MUST run in this order: (1) re-extract claims, (2) re-run
entailment, (3) rebuild contradictions (DELETE + regenerate, not append),
(4) score signals. Stage 3 is critical: without it, `score_claims.py`
reads contradiction rows computed against a claim set that no longer
exists. The driver script `scripts/substrate/rescore.py` enforces this
order and includes an integrity check (`--check-integrity`).

**Source:** SCORING_SPEC.md lines 272, 276–278, 322–324.
**Diagnostic:** `scripts/remap-snapshot-to-v14.py`

---

## 2. Components with local 4-tier types that shadow the shared helper — RESOLVED

All 15 components have been fixed. Server components import `TierKey` from
`@/lib/substrate-helpers`; the client component `CandidateExplorer` imports
the type and keeps a commented local runtime mirror (client can't bundle the
`.mjs`). Every kept-local display constant carries a sync comment. The
`HomeConditionStat` interface in `lib/substrate-candidates.ts` and the
`tierLc` return type in `lib/substrate-helpers.ts` were also corrected to
3-tier. `tsc --noEmit` passes.

### 2a. `app/candidates/CandidateExplorer.tsx` — DONE
- Imports `type TierKey` from shared helper; local `tierKey()` kept with
  WHY-comment (client component); `TIER_ORDER`/`TIER_LABELS`/`TIER_RANK`
  3-tier with sync comment; "unsponsored" marker matches "emerging"; prose
  updated to "strong or emerging".

### 2b. `app/components/SourceSankey.tsx` — DONE
- `import type { TierKey }` + re-export; moderate `TIERS` row removed; legend
  auto-shows 3 tiers.

### 2c. `app/components/TierHeatmap.tsx` — DONE
- `import type { TierKey }` + re-export; moderate removed from `TIERS` and
  `cellBg` ramps; grid `repeat(3, 1fr)`.

### 2d. `app/conditions/ConditionsList.tsx` — DONE
- Imports `TierKey` from shared helper; `TIER_BAR`/`TIER_ORDER` 3-tier;
  summary now `{strong} strong · {emerging} emerging`.

---

## 3. Components with local tier labels/counts — RESOLVED

All 11 components fixed. "moderate" removed from `TIER_ORDER`, `TIER_LABELS`,
count objects, label maps, Zod enum, and prose.

### 3a. `app/candidates/page.tsx` — DONE
### 3b. `app/access/preview/page.tsx` — DONE
### 3c. `app/access/preview/[signalId]/page.tsx` — DONE
### 3d. `app/components/CandidateCard.tsx` — DONE
### 3e. `app/components/HomeTierMatrix.tsx` — DONE
### 3f. `app/conditions/page.tsx` — DONE
### 3g. `app/page.tsx` (home) — DONE
### 3h. `app/featured/page.tsx` — DONE
### 3i. `app/featured/anastrozole-endometriosis/page.tsx` — DONE
### 3j. `app/api/mcp/route.ts` — DONE
### 3k. `app/candidates/ConditionAccordion.tsx` — DONE

---

## 4. Summary

| Category | Count | Status |
|---|---|---|
| TIER_CUTOFFS re-derivation | 1 | **Open** — blocked on rescore |
| Local 4-tier types (shadow helper) | 4 | **Resolved** |
| Local tier labels/counts (no local type) | 11 | **Resolved** |
| Data layer (HomeConditionStat, tierLc return type) | 2 | **Resolved** |
| **Total components fixed** | **17** | |

### Follow-ups outside the 15-component scope (noted, not blocking)

- `app/globals.css`: `--tier-moderate`, `--tier-moderate-soft`,
  `.tier-badge.moderate` still defined (now unused).
- `lib/corpus-query.ts`: `dist` count object still seeds `moderate: 0`;
  feeds MCP `whel_corpus_meta` tier distribution. Reads from
  `lib/corpus-snapshot.json` which still holds v1.3 "moderate" tier values.
  Gated and machine-facing — can wait until rescore.
- Historical audit prose in `app/about/technical-architecture/page.tsx` and
  `app/about/methodology/changelog/page.tsx` references v1.3 "Moderate"
  tier counts — intentional historical record, left as-is.

**The flag is not safe to flip until TIER_CUTOFFS is re-derived and the
rescore has produced new cutoffs. The 15 component fixes are done.**
