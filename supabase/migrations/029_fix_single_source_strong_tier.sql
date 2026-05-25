-- 029_fix_single_source_strong_tier.sql
-- Critical finding C1 (Independent Review, May 2026): evidence scores must
-- follow the published rubric. An audit of all 30 Strong-tier and 64
-- Moderate-tier signals found exactly two signals with an OBJECTIVE rubric
-- violation, both in the Strong tier:
--
--   * Desvenlafaxine -> Perimenopause & Menopause  (id 65fe3cdd-...)
--   * Aprepitant     -> Perimenopause & Menopause  (id c49e06cb-...)
--
-- Both rest on a SINGLE source, and that source is one computational
-- Open Targets target-disease association record. The rubric defines
-- replication_score = 2 as "multiple independent replications or RCT
-- evidence." It is not possible to have multiple independent replications
-- from a single source, so replication_score = 2 cannot stand for either
-- signal. (replication_level was likewise set to "High".)
--
-- Conservative correction: only the one dimension that is objectively
-- impossible is changed. replication_score is set to 0 (a single
-- computational record contains no replication) and replication_level to
-- "Low". All other dimension scores assigned by the scoring model are left
-- untouched -- re-scoring them would require the full source text and is
-- the job of the two-rater validation study (finding C2), not this fix.
--
-- total_evidence_score is a GENERATED column and recomputes automatically.
-- confidence_tier is a plain column and is updated explicitly below.
--
--   Desvenlafaxine: total 10 -> 8, tier Strong -> Moderate
--   Aprepitant:     total  9 -> 7, tier Strong -> Moderate
--
-- Generated: 2026-05-24

-- Desvenlafaxine -> Perimenopause & Menopause
UPDATE repurposing_signals
SET replication_score = 0,
    replication_level = 'Low',
    confidence_tier   = 'Moderate'
WHERE id = '65fe3cdd-8dd1-4ee8-bbf2-074bb4f741f1';

-- Aprepitant -> Perimenopause & Menopause
UPDATE repurposing_signals
SET replication_score = 0,
    replication_level = 'Low',
    confidence_tier   = 'Moderate'
WHERE id = 'c49e06cb-2c5e-443e-8c61-d4fdfa617248';

-- Verification: both rows should now read tier Moderate with the totals
-- shown above, and no Strong-tier signal should have a single source.
--
-- SELECT id, replication_score, total_evidence_score, confidence_tier
-- FROM repurposing_signals
-- WHERE id IN ('65fe3cdd-8dd1-4ee8-bbf2-074bb4f741f1',
--              'c49e06cb-2c5e-443e-8c61-d4fdfa617248');
--
-- SELECT s.id, count(src.id) AS n_sources
-- FROM repurposing_signals s
-- LEFT JOIN sources src ON src.signal_id = s.id
-- WHERE s.confidence_tier = 'Strong'
-- GROUP BY s.id
-- HAVING count(src.id) <= 1;   -- expect 0 rows
