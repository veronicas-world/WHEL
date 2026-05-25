-- 033_normalise_fda_status.sql
-- Minor finding M1 (Independent Review, May 2026): the compounds.fda_status
-- field records regulatory status in six different ways:
--
--   "FDA Approved"                          66
--   NULL                                    32
--   "Approved"                              31
--   "Dietary Supplement"                     4
--   "FDA-Approved (2018) — Endometriosis"    2
--   "Approved (EU/Japan) — Endometriosis"    1
--
-- The last two are ad-hoc annotated strings. This migration folds them into
-- the existing controlled values, leaving a small, consistent vocabulary:
--
--   "FDA Approved"  |  "Approved"  |  "Dietary Supplement"  |  NULL
--
--   * "FDA-Approved (2018) — Endometriosis"  -> "FDA Approved"
--     (Elagolix / Relugolix-class GnRH antagonists; the year/indication
--      annotation is dropped -- it belongs in a notes field, not the status)
--   * "Approved (EU/Japan) — Endometriosis"  -> "Approved"
--     (Dienogest; "Approved" denotes regulatory approval without asserting
--      FDA status, which is correct here -- dienogest is not FDA-approved)
--
-- The 32 NULL rows are left untouched: status cannot be inferred without
-- per-compound research.
--
-- KNOWN LIMITATION (not fixed here): the "Approved" bucket still contains a
-- few investigational compounds that are not in fact approved anywhere
-- (e.g. Bentamapimod, Epelsiban, Eltanolone). Correcting those is a
-- data-accuracy task requiring per-compound regulatory verification, not a
-- label-normalisation fix.
--
-- Generated: 2026-05-24

UPDATE compounds
SET fda_status = 'FDA Approved'
WHERE fda_status LIKE 'FDA-Approved (2018)%';

UPDATE compounds
SET fda_status = 'Approved'
WHERE fda_status LIKE 'Approved (EU/Japan)%';

-- Verification: should return only the four controlled values (plus NULL).
--
-- SELECT fda_status, count(*)
-- FROM compounds
-- GROUP BY fda_status
-- ORDER BY count(*) DESC;
