-- 036_strict_replication_downgrades.sql
-- Follow-on to finding C1 (Independent Review, May 2026): the published
-- rubric in docs/methods-draft.md defines replication_score = 0 as "Single
-- source only," but the LLM scoring prompts had drifted to also award
-- replication = 1 for "one moderate study." That drift has been fixed in the
-- pipeline prompts (research-, openfda-, clinicaltrials-, opentargets-) so
-- future signals score correctly. This migration cleans up the in-DB
-- signals that were scored under the loose prompt and rest on a single
-- source.
--
-- Two groups of corrections:
--
-- A) Three "hardest-to-defend" cases identified by the C1 audit
--    (audit-moderate-single-source.mjs, 2026-05-28):
--      * Botulinum Toxin A -> Vulvodynia (single 2009 PubMed RCT)
--      * Venlafaxine        -> PMDD       (single 2003 open-label trial)
--      * Continuous OC      -> PMDD       (single ClinicalTrials.gov record)
--    These are single-primary-study signals where no aggregator-or-review
--    argument can defend replication = 1.
--
-- B) Ten Open Targets single-source Moderate signals where backfill with a
--    real PubMed source is either inappropriate (mechanistic-only evidence
--    base, e.g., Bentamapimod preclinical work) or where the cross-walk to
--    the WHEL condition is mechanically weak (e.g., NK1 antagonists for
--    menopause when the menopause-relevant target is NK3). Per the
--    tightened OT prompt, each OT record now counts as ONE source for the
--    replication dimension, so replication = 1 is no longer defensible
--    without additional citations.
--
-- For every row: replication_score is set to 0 and replication_level to
-- "Low." total_evidence_score is a GENERATED column and recomputes
-- automatically. confidence_tier is updated explicitly where the new total
-- crosses a tier boundary.
--
-- Tier outcomes:
--   Group A:
--     * Botox -> Vulvodynia      total 8 -> 7, tier Moderate -> Moderate
--     * Venlafaxine -> PMDD      total 7 -> 6, tier Moderate -> Emerging
--     * Continuous OC -> PMDD    total 7 -> 6, tier Moderate -> Emerging
--   Group B (OT downgrades):
--     * Bentamapimod -> Endo     total 8 -> 7, tier Moderate -> Moderate
--     * Bentamapimod -> Adeno    total 8 -> 7, tier Moderate -> Moderate
--     * Eltanolone -> PMDD       total 8 -> 7, tier Moderate -> Moderate
--     * Fosnetupitant -> Menop.  total 8 -> 7, tier Moderate -> Moderate
--     * Prinaberel -> Endo       total 8 -> 7, tier Moderate -> Moderate
--     * Prinaberel -> Adeno      total 8 -> 7, tier Moderate -> Moderate
--     * Tradipitant -> Menopause total 8 -> 7, tier Moderate -> Moderate
--     * Rosiglitazone -> Endo    total 7 -> 6, tier Moderate -> Emerging
--     * Rosiglitazone -> Adeno   total 7 -> 6, tier Moderate -> Emerging
--     * Ulipristal -> PMDD       total 7 -> 6, tier Moderate -> Emerging
--
-- Net tier shifts: 5 Moderate -> Emerging, 8 Moderate -> Moderate (score drop only).
--
-- Generated: 2026-05-29

BEGIN;

-- ── Group A: three hard violations ────────────────────────────────────────

-- Botulinum Toxin A -> Vulvodynia (stays Moderate)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low'
WHERE id = '04564189-1c16-46a1-9b0f-57397dd554d5';

-- Venlafaxine -> PMDD (Moderate -> Emerging)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low', confidence_tier = 'Emerging'
WHERE id = '436e3ce0-d7f8-4bee-80ac-0bd0d5ea9c6a';

-- Continuous Oral Contraceptive -> PMDD (Moderate -> Emerging)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low', confidence_tier = 'Emerging'
WHERE id = '161212ce-6d3c-4812-adbc-8784b41d2d14';

-- ── Group B: ten OT-source downgrades ─────────────────────────────────────

-- Bentamapimod -> Endometriosis (stays Moderate)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low'
WHERE id = '24412411-3fca-4baa-ba5f-20a0c34dd2b3';

-- Bentamapimod -> Adenomyosis (stays Moderate)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low'
WHERE id = '43a8eacd-0b24-4fa6-b904-3b55c9a27373';

-- Eltanolone -> PMDD (stays Moderate)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low'
WHERE id = '25550424-4965-4ea0-a70f-2afa7fd47e68';

-- Fosnetupitant -> Perimenopause & Menopause (stays Moderate)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low'
WHERE id = 'd2b2b13c-680a-4431-b882-831294433f81';

-- Prinaberel -> Endometriosis (stays Moderate)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low'
WHERE id = '2dd3ad47-70e7-4099-953e-83103f44a0fe';

-- Prinaberel -> Adenomyosis (stays Moderate)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low'
WHERE id = 'c6485b97-a6bc-4cc7-9d92-80bd1a4a6298';

-- Tradipitant -> Perimenopause & Menopause (stays Moderate)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low'
WHERE id = '05959dc6-da8c-4ade-8e9c-bd28b2993c9f';

-- Rosiglitazone -> Endometriosis (Moderate -> Emerging)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low', confidence_tier = 'Emerging'
WHERE id = 'f459b460-584d-4c17-9313-eea08d04926e';

-- Rosiglitazone -> Adenomyosis (Moderate -> Emerging)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low', confidence_tier = 'Emerging'
WHERE id = '220cb48f-3467-4f66-b6f4-45dd1e6e37d1';

-- Ulipristal Acetate -> PMDD (Moderate -> Emerging)
UPDATE repurposing_signals
SET replication_score = 0, replication_level = 'Low', confidence_tier = 'Emerging'
WHERE id = 'af990218-f5e4-4d69-9c51-24d07bf6ce9c';

COMMIT;

-- ── Verification ──────────────────────────────────────────────────────────
--
-- All thirteen rows should now read replication_score = 0.
--
--   SELECT id, replication_score, total_evidence_score, confidence_tier
--   FROM repurposing_signals
--   WHERE id IN (
--     '04564189-1c16-46a1-9b0f-57397dd554d5',
--     '436e3ce0-d7f8-4bee-80ac-0bd0d5ea9c6a',
--     '161212ce-6d3c-4812-adbc-8784b41d2d14',
--     '24412411-3fca-4baa-ba5f-20a0c34dd2b3',
--     '43a8eacd-0b24-4fa6-b904-3b55c9a27373',
--     '25550424-4965-4ea0-a70f-2afa7fd47e68',
--     'd2b2b13c-680a-4431-b882-831294433f81',
--     '2dd3ad47-70e7-4099-953e-83103f44a0fe',
--     'c6485b97-a6bc-4cc7-9d92-80bd1a4a6298',
--     '05959dc6-da8c-4ade-8e9c-bd28b2993c9f',
--     'f459b460-584d-4c17-9313-eea08d04926e',
--     '220cb48f-3467-4f66-b6f4-45dd1e6e37d1',
--     'af990218-f5e4-4d69-9c51-24d07bf6ce9c'
--   )
--   ORDER BY confidence_tier, total_evidence_score DESC;
