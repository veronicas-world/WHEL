-- ================================================================
-- 012 — FAERS → AEMS naming update
-- ================================================================
-- In March 2026 the FDA renamed FAERS (FDA Adverse Event Reporting
-- System) to AEMS (FDA Adverse Event Monitoring System), consolidating
-- FAERS, VAERS, and the animal-drug AERS into one platform.
--
-- This migration updates user-visible naming in existing rows so the
-- site and signal cards reflect the current name. It is idempotent:
-- re-running it has no further effect.
--
-- NOT changed (intentionally): the internal source_type value 'faers'
-- and the external_id prefixes ('FAERS-QUERY-...', 'FAERS-...'). These
-- are internal keys that the ingestion pipeline's dedup logic and the
-- frontend tab routing depend on; they never appear in the UI.
-- ================================================================

-- 1. Source citation rows produced by the OpenFDA pipeline.
--    title   examples: 'FAERS: Pain (n=11)', 'FDA FAERS Database Query: ...'
--    journal holds the human-readable source name shown on signal cards.
UPDATE sources
SET
  title   = replace(title, 'FAERS', 'AEMS'),
  journal = 'FDA Adverse Event Monitoring System (AEMS)'
WHERE source_type = 'faers'
  AND (title LIKE '%FAERS%' OR journal = 'FDA Adverse Event Reporting System (FAERS)');

-- 2. LLM-written signal summaries that quote the source by name
--    (format: '... in the FDA FAERS database ...').
UPDATE repurposing_signals
SET summary = replace(summary, 'FAERS', 'AEMS')
WHERE summary LIKE '%FAERS%';

-- 3. Verification (read-only): both counts should be 0 after running.
SELECT COUNT(*) AS sources_still_faers
FROM sources
WHERE source_type = 'faers' AND title LIKE '%FAERS%';

SELECT COUNT(*) AS summaries_still_faers
FROM repurposing_signals
WHERE summary LIKE '%FAERS%';
