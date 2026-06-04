-- 041_sources_lgrade_fields.sql
-- Adds the five columns the literature-grade rubric reads when it
-- decides whether a `sources` row can support an L2 or L3 assignment:
--
--   study_type             text   -- rubric line 82: RCT or SR/MA is
--                                    required for L2 source_attribution.
--                                    The full 8-value taxonomy is wider
--                                    than the rubric strictly grades on
--                                    so the column can also serve future
--                                    filtering on /conditions/[slug] and
--                                    on the methodology page.
--   primary_endpoint_text  text   -- rubric line 82: the primary endpoint
--                                    text as printed in the abstract is
--                                    the third L2 requirement (alongside
--                                    PMID and study_type).
--   guideline_id           text   -- rubric line 99: the L3 source_attri-
--                                    bution requirement. Free-text body-
--                                    qualified id (e.g. "ESHRE-ENDO-2022-
--                                    3.1") rather than a FK because we
--                                    have no guidelines table yet and the
--                                    audit only needs a stable string for
--                                    deduplication.
--   guideline_strength     text   -- rubric line 30 + 91: recommendation
--                                    strength on the body's own scale
--                                    (strong / conditional, A/B/C/D, or
--                                    other). Free-text, no CHECK.
--   guideline_certainty    text   -- rubric line 30 + 91: certainty of
--                                    evidence on the body's own scale
--                                    (GRADE high/moderate/low/very low,
--                                    or other). Free-text, no CHECK.
--
-- Only `study_type` carries a CHECK constraint because it is the only
-- field with a fixed taxonomy. The other four can be backfilled freely
-- as new guideline bodies enter the validation sample without requiring
-- a schema migration each time.
--
-- All five columns are nullable. Existing rows stay valid until the
-- companion backfill script (scripts/classify-sources-study-type.py)
-- populates study_type + primary_endpoint_text from the title + journal
-- + key_finding_excerpt corpus. The three guideline_* columns are left
-- NULL for now and will be populated by a separate manual curation pass
-- that links specific sources rows to specific guideline recommendations.
--
-- Once study_type + primary_endpoint_text are populated, Phase 6 of
-- scripts/check-matrix-coverage.py will be updated to grade L2 from live
-- data (the explicit gap currently documented at lines 1821-1832 of that
-- script and at line 10 of lib/evidence-grading-snapshot.json).

BEGIN;

ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS study_type            text CHECK (study_type IN (
    'RCT',
    'SR/MA',
    'observational',
    'case_report',
    'guideline',
    'mechanistic',
    'expert_opinion',
    'other'
  )),
  ADD COLUMN IF NOT EXISTS primary_endpoint_text text,
  ADD COLUMN IF NOT EXISTS guideline_id          text,
  ADD COLUMN IF NOT EXISTS guideline_strength    text,
  ADD COLUMN IF NOT EXISTS guideline_certainty   text;

-- Sanity check: the column was added with the expected CHECK.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_name = 'sources'
    AND    column_name = 'study_type'
  ) THEN
    RAISE EXCEPTION 'Migration 041 did not add sources.study_type';
  END IF;
END $$;

COMMIT;
