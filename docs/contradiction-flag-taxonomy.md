# contradiction_flag taxonomy

## What the flag is

`contradiction_flag` is a boolean column on `substrate_signals`. It is set to
`true` when `num_contradictions > 0` — that is, when the `contradictions`
table contains at least one row involving a claim that belongs to this
signal.

**Denominator traceability:** Figures derived from `scoring-v13-snapshot.json` use a denominator of 226, which includes 8 signals since purged as extraction artifacts; current active count is 220. Do not recompute those historical figures.

The `contradictions` table is populated by `detect_contradictions.py`, which
compares **efficacy claims only** (aspect = 'efficacy', entailment =
'entailed') within each `(intervention, condition)` group, looking for pairs
with conflicting directions (positive vs negative, positive vs null,
negative vs null), and confirming each candidate with an NLI check (score
>= 0.6).

## What the table actually contains

The `contradictions` table has **3 rows**. All 3 are **intra-document** —
both claims in each pair come from the same source document. There are zero
cross-document contradictions.

One row (Row 1) is **stale**: both claims now have
`entailment_label = "neutral"` (no longer entailed). The current detection
script only compares entailed claims, so this row would not be formed by a
re-run. It remains in the table from an earlier detection run.

### Row 1 — MHT / menopause (stale: claims no longer entailed)

- **Claims:** "MHT reduces cardiovascular events" (positive) vs "MHT does not
  reduce all-cause mortality" (null)
- **Same document:** yes
- **Entailment:** both claims now `neutral` (not `entailed`)
- **Why it's not a real contradiction:** different outcomes (cardiovascular
  events vs all-cause mortality) AND different populations (general
  postmenopausal vs "early acceptance" timing qualifier). Gate 3 (same
  outcome) and Gate 4 (same population) would both reject this pair.

### Row 2 — anti-androgens + lifestyle / PCOS

- **Claims:** "anti-androgens + lifestyle superior to metformin + lifestyle
  for hirsutism" (positive) vs "anti-androgens + lifestyle not superior to
  placebo + lifestyle for hirsutism" (null)
- **Same document:** yes
- **Why it's not a real contradiction:** same outcome (hirsutism) but
  different comparators (metformin vs placebo). Gate 2 (same comparator)
  would reject this pair.

### Row 3 — metformin / PCOS

- **Claims:** "metformin improves hirsutism" (positive) vs "metformin does
  not improve free androgen index" (null)
- **Same document:** yes
- **Why it's not a real contradiction:** different outcomes (hirsutism vs
  free androgen index). Gate 3 (same outcome) would reject this pair.

## Coverage limitation

The "zero cross-document contradictions" finding is a coverage limitation,
not evidence of consensus.

- **99 of 114** (intervention, condition) groups (87%) have entailed
  efficacy claims from a **single document**. There is no second source to
  disagree with.
- **15 groups** have 2+ documents. Within those, **221 cross-document claim
  pairs** were formed. Of those, **46 had opposing directions** and were
  sent to the NLI for confirmation.
- The NLI **rejected all 46**. Zero cross-document contradictions were
  confirmed.

| Drug | Condition | Cross-doc pairs | Conflict pairs (sent to NLI) | Confirmed |
|---|---|---|---|---|
| MHT | menopause | 87 | 24 | 0 |
| metformin | PCOS | 29 | 15 | 0 |
| DIENOGEST | adenomyosis | 36 | 6 | 0 |
| inositol | PCOS | 3 | 1 | 0 |
| 11 other groups | — | 66 | 0 | 0 |
| **Total** | | **221** | **46** | **0** |

The 46 NLI rejections are **not recorded** — the current detection script
(`detect_contradictions.py` v1) does not log rejected pairs. The NLI may
have rejected them for the right reasons (different comparator, different
outcome, different population) or for the wrong reasons (the v1 prompt
does not check those gates). Without rejection rationales, the rejection
rate is not auditable.

## Known property of the v1 detector: intra-document bias

The v1 detector does not distinguish intra-document from cross-document
pairs. It compares ALL claims within each `(intervention, condition)`
group, regardless of source. This produces a candidate pool biased toward
intra-document pairs, and the NLI accepts only intra-document pairs.

| | Candidate pairs formed | Accepted by NLI | Acceptance rate |
|---|---|---|---|
| Cross-document | 46 | 0 | 0% |
| Intra-document | 77 | 2 | 2.6% |
| **Total** | **123** | **2** | **1.6%** |

Two biases, both pointing the same direction:

1. **Volume bias:** 77 of 123 candidate pairs (63%) are intra-document.
   Review articles commonly make multiple claims with different directions
   about the same drug ("helps for X, doesn't help for Y"), and these all
   become intra-document candidates.
2. **Acceptance bias:** The NLI accepted 2 of 77 intra-document pairs
   (2.6%) and 0 of 46 cross-document pairs (0%). All accepted contradictions
   are within-source — the pairs that cannot constitute source
   disagreement.

The v1 detector preferentially surfaces within-source tensions. The v2
prompt (not yet run) records `same_document` as a field and adds 4 gates
that would reject all 3 existing rows, but the v1 detector's bias is a
known property of the current data.

## Fixes applied

### Fix 1 — Scope to signal's own claims (committed `0c3d241`)

The original `_num_contradictions` counted ALL contradiction rows for the
`(intervention_id, condition_id)` pair. A safety signal inherited a
contradiction between two efficacy claims it didn't contain.

**Fix:** `_num_contradictions` now only counts contradictions where at least
one of the two claims belongs to this signal's claim set.

**Effect:** 3 of 7 flagged signals survive (the other 4 didn't contain any
of the 6 claims in the 3 contradiction rows).

### Fix 2 — Exclude same-document contradictions (committed)

All 3 contradiction rows are intra-document. A within-source tension is not
a between-source consistency signal.

**Fix:** `_num_contradictions` now joins with the `claims` table and excludes
rows where `ca.document_id = cb.document_id` (both non-NULL and equal).

**Effect:** All 3 surviving rows are intra-document, so the consistency
penalty fires on **0 signals** after both fixes. The `contradiction_flag`
is effectively dead in the current corpus.

### Fix 3 — Revised detection prompt (not yet run)

`detect_contradictions.py` v2 adds:
- **4 gates** (intervention, comparator, outcome, population) — a pair must
  pass all 4 before direction is checked
- **`same_document` field** — recorded as a field, not a rejection
- **JSONL rejection log** — every evaluated pair is logged with the gate
  that rejected it and a one-line rationale, so the rejection rate is
  auditable

The v2 prompt would have **rejected all 3 existing rows** (each fails at
least one gate). It has not been run against the corpus yet.

## How the flag is used

### Scoring (arm_strength)

`score_claims.py` reads `num_contradictions` and, if > 0, caps the
consistency penalty at -1 (§5d of SCORING_SPEC.md). Since
`arm_strength = max(0, sum(dims.values()))`, this reduces arm_strength by
at least 1.

After Fix 1 + Fix 2, `num_contradictions` is 0 for every signal. The
consistency penalty never fires. The flag is inert.

### Display (gated)

`CandidateCard.tsx` renders a "⚠ Contradiction" badge when
`contradictionFlag` is true. `conditions/[slug]/substrate/page.tsx` renders
a "Contradictions surfaced" count and list from the `contradictions`
table. All on gated pages (SIGNALS_PUBLISHED = false).

### Ranking/sort

`contradiction_flag` does NOT feed ranking or sort order. The sort uses
`negLast` which is based on `documentedNegative`, not
`anyContradiction`.

## Where the flag gets set

**Writer:** `scripts/substrate/score_claims.py`
- `_num_contradictions(conn, iv, cd, claim_ids)` counts rows in
  `contradictions` involving this signal's claims, excluding same-document
  pairs
- `1 if nco > 0 else 0` writes `contradiction_flag`
- `nco` writes `num_contradictions`

**Detection:** `scripts/substrate/detect_contradictions.py`
- v1 (current, committed): compares efficacy claims with conflicting
  directions, NLI confirms (score >= 0.6), no rejection logging
- v2 (revised, not yet run): 4 gates + same_document field + JSONL
  rejection log

## Summary

| Finding | Value |
|---|---|
| Contradiction rows in table | 3 |
| Intra-document rows | 3 (100%) |
| Stale rows (claims no longer entailed) | 1 (Row 1) |
| Cross-document contradictions | 0 |
| Signals flagged (original) | 7 |
| Signals flagged (Fix 1: scope to own claims) | 3 |
| Signals flagged (Fix 1 + Fix 2: exclude same-doc) | 0 |
| Groups with single-document coverage | 99/114 (87%) |
| Cross-document conflict pairs sent to NLI | 46 |
| Cross-document contradictions confirmed | 0 |
| Intra-document conflict pairs sent to NLI | 77 |
| Intra-document contradictions confirmed | 2 |
| v1 detector acceptance rate (intra-doc) | 2.6% |
| v1 detector acceptance rate (cross-doc) | 0% |
| NLI rejection rationales recorded | 0 (v1 has no rejection log) |

The consistency penalty is inert: it fires on 0 signals after both fixes.
The "zero contradictions" finding is a coverage limitation (87% single-source),
not evidence of consensus. The v1 detector preferentially surfaces
intra-document pairs (63% of candidates, 100% of acceptances). The 46
cross-document NLI rejections are not auditable without the v2 rejection log.
