-- 030_fix_aems_reaction_source_labels.sql
-- Significant finding S1 (Independent Review, May 2026): AEMS per-reaction
-- citation labels misrepresent what the number means.
--
-- Each per-reaction AEMS source row has a title of the form
--   "AEMS: Insomnia (n=7)"
-- and a verification URL of the form
--   https://api.fda.gov/drug/event.json?search=<drug>+AND+patientsex:2
--        +AND+reactionmeddrapt:"<reaction>"&limit=1
--
-- The "n" in the title is NOT the openFDA population count. The pipeline
-- fetches a bounded sample of reports per drug (MAX_REPORTS_PER_DRUG, ~100
-- per pass) and counts reaction terms WITHIN that sample. The verification
-- URL, however, queries the entire openFDA database. The two numbers do not
-- agree -- e.g. "AEMS: Insomnia (n=7)" for naltrexone, but the linked query
-- returns meta.results.total = 848. A reviewer who clicks the link sees a
-- number ~100x larger than the cited "n", with no explanation.
--
-- This migration does NOT change any counts -- changing the per-reaction
-- numbers to true openFDA totals would alter the underlying evidence and is
-- a data/research decision (a pipeline re-run), not a labelling fix. Instead
-- it makes the label honest: the parenthetical now states explicitly that
-- the count is from the analysed sample, so it is no longer mistaken for an
-- absolute AEMS total. The verification URL is left intact: it remains a
-- valid openFDA evidence link for the drug+reaction pair (its meta block
-- shows the true population total).
--
-- Affects ~1,647 per-reaction AEMS source rows. The 149 "FDA AEMS Database
-- Query:" summary rows already carry true openFDA totals and are untouched.
--
-- Generated: 2026-05-24

UPDATE sources
SET title = regexp_replace(
              title,
              '\(n=(\d+)\)$',
              '(\1 reports in the analysed AEMS sample)'
            )
WHERE source_type = 'faers'
  AND title ~ '\(n=\d+\)$';

-- Verification: should return 0 rows (no per-reaction row should still
-- carry the bare "(n=N)" label after this migration).
--
-- SELECT count(*) FROM sources
-- WHERE source_type = 'faers' AND title ~ '\(n=\d+\)$';
--
-- Spot-check the new wording:
-- SELECT title FROM sources
-- WHERE source_type = 'faers'
--   AND title LIKE '%analysed AEMS sample%'
-- LIMIT 5;
