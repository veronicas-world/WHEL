-- 038_s3_ctgov_mismatches.sql
-- S3 finding (Independent Review, May 2026): twenty-one CT.gov citations
-- attached to signals where the trial's structured Conditions field does
-- not match the WHEL condition the signal is filed under. Triage rubric
-- and per-row reasoning live in scripts/audit-output/S3-triage-prestaged.md
-- (approved 2026-05-29).
--
-- This migration applies the seventeen well-defined actions. Two rows
-- (15 + 16, Continuous OC -> Endo and Continuous OC -> Adeno) call for
-- "drop_source_keep_signal" but both signals carry zero other sources,
-- so dropping the CT.gov row alone would orphan the signal. Those two
-- are explicitly deferred to migration 040 after replacement citations
-- (ESHRE 2022 endometriosis guideline; appropriate adenomyosis source)
-- are PubMed-verified, the same discipline used for OT backfills in 039.
--
-- Actions in this migration:
--   * 10 signals deactivated (status = 'inactive')
--   * 5 unique signals reassigned signal_type -> 'cross_condition_signal'
--     (covers 7 audit rows; rows 1+2 share signal 9234d940...; rows 3+4
--      share signal cbc8b563...)
--   * 1 CT.gov source dropped where the signal has independent support
--     (row 21, Milnacipran -> Menopause, OpenTargets source remains)
--   * 1 no-op row documented (row 18, Quinagolide -> Adeno; the trial
--      title explicitly enrols both endometriosis and adenomyosis, but
--      CT.gov v2 API returned only "Endometriosis" in the structured
--      conditions field. Audit false positive, no DB action needed.)
--   * 2 deferred to migration 040 (rows 15, 16; pending replacement
--     citation research).
--
-- Net coverage: 17 of 21 audit rows actioned; 2 documented no-op or
-- deferred; the remaining 2 (15, 16) tracked in C1-S3-audit-findings.md
-- under "S3 follow-up: Continuous OC replacement citations".

BEGIN;

-- ────────────────────────────────────────────────────────────
-- A. DEACTIVATE 10 SIGNALS (rows 5, 6, 7, 8, 9, 11, 12, 13, 19, 20)
-- ────────────────────────────────────────────────────────────
--   Single CT.gov citation that does not support the filed condition,
--   no other sources on the signal, no defensible cross-condition
--   mechanism. status = 'inactive' hides the signal from /, /conditions,
--   /conditions/[slug], /search, and SearchBar (all filter on
--   .eq("status","active")).

UPDATE repurposing_signals
SET status = 'inactive'
WHERE id IN (
  '3b3cf707-183b-4e11-a20a-d5a562eebb44', -- 5.  Clomiphene -> Menopause
  'b9f16839-aa84-48a7-afa1-5897dd55528d', -- 6.  Clomiphene -> PMDD
  'c8130429-5a94-4c95-935b-de85f14dd9b4', -- 7.  Clomiphene -> Vulvodynia
  '8281938a-5552-4cc3-9d41-08b996f1b88b', -- 8.  Clomiphene -> Endometriosis
  'd7542cd1-74bd-4aed-8c63-03c632813b71', -- 9.  Clomiphene -> Adenomyosis
  '3de95a50-608a-46d8-be4b-d1dd1e639c2e', -- 11. Cinnamon Extract -> PMDD
  'c0ef914f-caf3-46c1-a62c-3cbc11e51a3e', -- 12. Oxytocin -> Adenomyosis
  'ef9a704f-9986-4a0c-830b-082545beda5a', -- 13. Flutamide -> Menopause
  '05cd743e-5e82-4090-b700-b7d2b5d1c3da', -- 19. Quinagolide -> Menopause
  '3772a90a-c31f-4d5b-b424-0ad7b67811a3'  -- 20. Quinagolide -> Vulvodynia
);

-- ────────────────────────────────────────────────────────────
-- B. REASSIGN signal_type = 'cross_condition_signal' (5 unique signals;
--    covers rows 1, 2, 3, 4, 10, 14, 17)
-- ────────────────────────────────────────────────────────────
--   The CT.gov source is real and the drug-condition pair has a
--   plausible mechanism, but the original signal_type
--   'clinical_trial_finding' overstated the trial's direct relevance.
--   Reframing as cross_condition_signal makes the framing honest.

UPDATE repurposing_signals
SET signal_type = 'cross_condition_signal'
WHERE id IN (
  '9234d940-e2a3-4e86-ad6a-3292e9e7f63b', -- Raloxifene -> Endometriosis (rows 1 + 2)
  'cbc8b563-13a2-4472-aa9c-b887f453bc2d', -- Raloxifene -> Adenomyosis  (rows 3 + 4)
  'e1a65a28-613e-4c28-8da0-ea2a59216635', -- Liraglutide -> Endometriosis (row 10)
  'dc440c32-7209-4711-93b7-26d30207e2f0', -- Flutamide -> PCOS (row 14)
  'df4ef8fd-82b4-4eb1-bf31-c07c95a9ab9f'  -- Quinagolide -> PCOS (row 17)
);

-- ────────────────────────────────────────────────────────────
-- C. DROP 1 SOURCE (row 21, Milnacipran -> Menopause)
-- ────────────────────────────────────────────────────────────
--   Signal carries an OpenTargets mechanism_overlap source (SLC6A4/
--   SLC6A2) that is the load-bearing evidence. The CT.gov vestibulodynia
--   source NCT01304589 was cosmetic and condition-mismatched. Drop the
--   source row only; signal stays active with its OT source.

DELETE FROM sources
WHERE id = 'b77bdf80-b8e5-4e60-8d2f-510e89885589';

-- ────────────────────────────────────────────────────────────
-- D. NO-OP DOCUMENTED (row 18, Quinagolide -> Adenomyosis)
-- ────────────────────────────────────────────────────────────
--   NCT03749109 brief title: "Quinagolide Vaginal Ring on Lesion
--   Reduction Assessed by MRI in Women With Endometriosis/Adenomyosis"
--   — the trial enrols both conditions but CT.gov v2 API only returned
--   'Endometriosis' in the structured Conditions field. The WHEL signal
--   filing is correct; the audit flag was a CT.gov API limitation.
--   No SQL action.

COMMIT;

-- ────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (run separately after COMMIT)
-- ────────────────────────────────────────────────────────────

-- V1. Confirm 10 deactivations took effect
-- Expected: 10 rows, all with status = 'inactive'.
-- SELECT id, status
-- FROM repurposing_signals
-- WHERE id IN (
--   '3b3cf707-183b-4e11-a20a-d5a562eebb44',
--   'b9f16839-aa84-48a7-afa1-5897dd55528d',
--   'c8130429-5a94-4c95-935b-de85f14dd9b4',
--   '8281938a-5552-4cc3-9d41-08b996f1b88b',
--   'd7542cd1-74bd-4aed-8c63-03c632813b71',
--   '3de95a50-608a-46d8-be4b-d1dd1e639c2e',
--   'c0ef914f-caf3-46c1-a62c-3cbc11e51a3e',
--   'ef9a704f-9986-4a0c-830b-082545beda5a',
--   '05cd743e-5e82-4090-b700-b7d2b5d1c3da',
--   '3772a90a-c31f-4d5b-b424-0ad7b67811a3'
-- )
-- ORDER BY id;

-- V2. Confirm 5 signal_type reassignments
-- Expected: 5 rows, all with signal_type = 'cross_condition_signal'.
-- SELECT id, signal_type
-- FROM repurposing_signals
-- WHERE id IN (
--   '9234d940-e2a3-4e86-ad6a-3292e9e7f63b',
--   'cbc8b563-13a2-4472-aa9c-b887f453bc2d',
--   'e1a65a28-613e-4c28-8da0-ea2a59216635',
--   'dc440c32-7209-4711-93b7-26d30207e2f0',
--   'df4ef8fd-82b4-4eb1-bf31-c07c95a9ab9f'
-- )
-- ORDER BY id;

-- V3. Confirm Milnacipran CT.gov source dropped, OT source remains
-- Expected: 1 row, source_type = 'opentargets'.
-- SELECT id, source_type, external_id
-- FROM sources
-- WHERE signal_id = '0d1c23ef-d08d-4e7b-88b1-b8537dc53eaf'
-- ORDER BY source_type;
