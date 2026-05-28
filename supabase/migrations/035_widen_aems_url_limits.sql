-- 035_widen_aems_url_limits.sql
-- Significant finding S1 (Independent Review, May 2026), follow-on to 030.
--
-- Migration 030 made the per-reaction AEMS labels honest about what their
-- count represents ("X reports in the analysed AEMS sample" rather than the
-- bare "(n=X)"), but it deliberately left the verification URLs untouched.
-- Each AEMS source row still carries an openFDA URL ending in `&limit=1`,
-- which means a reader who clicks the citation sees exactly one JSON record
-- instead of a useful set of examples.
--
-- This migration widens `&limit=1` to `&limit=100` across stored AEMS URLs.
-- The change is informational, not semantic:
--   * meta.results.total in the response continues to surface the true
--     openFDA-side population total -- the number that matters for
--     verifying the citation -- unchanged by the limit.
--   * The user-visible payload now contains up to 100 actual report
--     records, so a reader following the citation has examples to skim,
--     not a single sample of one.
--   * 100 stays comfortably under openFDA's hard cap of 1,000, so no
--     query is at risk of truncation behaviour the reviewer wouldn't see.
--
-- Affects both the ~149 "FDA AEMS Database Query:" summary rows and the
-- ~1,647 per-reaction AEMS source rows. Non-AEMS source URLs (PubMed,
-- ClinicalTrials.gov, Reddit, Open Targets) are unaffected.
--
-- Paired pipeline change: scripts/openfda-pipeline.js now generates new
-- rows with limit=100 directly, so this migration only touches the
-- historical rows already in the database.
--
-- Generated: 2026-05-28

-- regexp_replace with an end-of-string anchor is used (rather than a plain
-- REPLACE) so that a hypothetical future URL ending in `&limit=10` or
-- `&limit=1000` is not silently mangled by the substring match.

UPDATE sources
SET url = regexp_replace(url, '&limit=1$', '&limit=100')
WHERE source_type = 'faers'
  AND url ~ '&limit=1$';

-- Verification: should return 0 rows.
--
-- SELECT count(*) FROM sources
-- WHERE source_type = 'faers' AND url ~ '&limit=1$';
--
-- Spot-check the new URLs:
-- SELECT title, url FROM sources
-- WHERE source_type = 'faers' AND url LIKE '%&limit=100'
-- LIMIT 5;
