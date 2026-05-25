-- 031_dedupe_sources.sql
-- Significant finding S3 (Independent Review, May 2026): the sources table
-- contains duplicate citations.
--
-- An audit of all 2,228 source rows found 70 rows that are exact duplicates
-- WITHIN a single signal: the same signal_id citing the same url more than
-- once (57 distinct duplicate groups, group sizes 2-4). All 70 are Reddit
-- sources -- e.g. the thread "I think Meloxicam is a miracle drug" is
-- attached to one Meloxicam -> Endometriosis signal four times. The pubmed,
-- clinical_trial, opentargets and faers source types contain no
-- (signal_id, url) duplicates.
--
-- Note: Reddit external_id is only the condition slug (e.g. "endometriosis"),
-- not a per-post identifier, so it is NOT a useful dedup key. (signal_id, url)
-- is the correct key -- one cited thread per signal.
--
-- This migration keeps one row per (signal_id, url) and deletes the rest.
-- The surviving row is the one with the lowest id, chosen only for
-- determinism. Counts and scores are unaffected (duplicates carry no extra
-- evidence). Expected: 70 rows deleted, 2,158 remaining.
--
-- Generated: 2026-05-24

DELETE FROM sources a
USING sources b
WHERE a.signal_id = b.signal_id
  AND a.url       = b.url
  AND a.id        > b.id;

-- Verification: should return 0 rows (no signal should cite the same url
-- more than once after this migration).
--
-- SELECT signal_id, url, count(*)
-- FROM sources
-- GROUP BY signal_id, url
-- HAVING count(*) > 1;
--
-- SELECT count(*) AS remaining_sources FROM sources;   -- expect 2158
