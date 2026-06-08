-- 044_backfill_ot_drugname_to_chembl.sql
-- Follow-on to Path C Phase 1 first database-sources audit run
-- (methodology v3.10, lib/database-sources-audit-snapshot.json).
--
-- The June 7, 2026 audit found 10 active-signal source rows where
-- sources.source_type = 'opentargets' but sources.external_id stored a
-- synthetic shorthand of the form 'OT-{DRUGNAME}' (e.g. 'OT-APREPITANT')
-- rather than the canonical Open Targets identifier (a CHEMBL drug ID).
-- The Open Targets GraphQL search correctly did not resolve these
-- shorthand strings, so the audit reported them as "unresolved" while
-- the rows continued to render valid citations to users (the url column
-- on each row already pointed at a real platform.opentargets.org page).
--
-- This migration replaces the shorthand in BOTH the external_id and the
-- url columns with the canonical CHEMBL identifier and the matching
-- platform.opentargets.org/drug/{CHEMBL} URL, matching the shape of the
-- 38 existing canonical Open Targets rows in the sources table.
--
-- After the migration:
--   * The audit verifier (scripts/verify-database-sources.py) resolves
--     every Open Targets row through its drug(chemblId: $id) GraphQL
--     query, dropping the unresolved count for opentargets rows to 0.
--   * Drug cards on /conditions/[slug] render the canonical CHEMBL ID
--     instead of 'OT-{DRUGNAME}' in the external_id chip and link to
--     the drug page on platform.opentargets.org instead of a disease
--     page. Same information density; more useful citation (the CHEMBL
--     ID is a stable canonical lookup, the drug-page URL surfaces every
--     disease the drug is associated with rather than just one).
--
-- CHEMBL IDs were resolved on 2026-06-07 via the Open Targets GraphQL
-- search endpoint (entityNames=['drug']) and independently verified
-- through the same drug(chemblId: $id) query the audit verifier uses.
-- Verification trace lives in the v3.11 changelog entry.
--
-- Each UPDATE is defensive: the WHERE clause includes both the row's
-- UUID id AND the expected old external_id, so the statement is a no-op
-- if the row has already been touched. Safe to re-run.

BEGIN;

-- 1. Aprepitant -> CHEMBL1471
UPDATE sources
   SET external_id = 'CHEMBL1471',
       url         = 'https://platform.opentargets.org/drug/CHEMBL1471'
 WHERE id          = 'd1e12bce-5cb4-42e0-b494-c396a6ea3f06'
   AND external_id = 'OT-APREPITANT';

-- 2. Desvenlafaxine -> CHEMBL1118
UPDATE sources
   SET external_id = 'CHEMBL1118',
       url         = 'https://platform.opentargets.org/drug/CHEMBL1118'
 WHERE id          = '4e043e33-0fe4-4b37-aff1-4c1b94c25d61'
   AND external_id = 'OT-DESVENLAFAXINE';

-- 3. Enzalutamide -> CHEMBL1082407
UPDATE sources
   SET external_id = 'CHEMBL1082407',
       url         = 'https://platform.opentargets.org/drug/CHEMBL1082407'
 WHERE id          = '06875d7f-0aa6-4761-8c60-8cc02f997f68'
   AND external_id = 'OT-ENZALUTAMIDE';

-- 4. Trimebutine -> CHEMBL190044
UPDATE sources
   SET external_id = 'CHEMBL190044',
       url         = 'https://platform.opentargets.org/drug/CHEMBL190044'
 WHERE id          = '06a9db4d-481c-401c-8836-9beebf843f20'
   AND external_id = 'OT-TRIMEBUTINE';

-- 5. Tasimelteon -> CHEMBL2103822
UPDATE sources
   SET external_id = 'CHEMBL2103822',
       url         = 'https://platform.opentargets.org/drug/CHEMBL2103822'
 WHERE id          = 'a625f838-7322-45f6-b308-2f4822d2ffd5'
   AND external_id = 'OT-TASIMELTEON';

-- 6. Tradipitant -> CHEMBL3544984
UPDATE sources
   SET external_id = 'CHEMBL3544984',
       url         = 'https://platform.opentargets.org/drug/CHEMBL3544984'
 WHERE id          = 'b7046b9c-e05e-445e-af6e-9484bf65a16b'
   AND external_id = 'OT-TRADIPITANT';

-- 7. Olaparib -> CHEMBL521686
UPDATE sources
   SET external_id = 'CHEMBL521686',
       url         = 'https://platform.opentargets.org/drug/CHEMBL521686'
 WHERE id          = 'c95b8378-77ff-4c4c-b929-0efcdd16b331'
   AND external_id = 'OT-OLAPARIB';

-- 8. Fosnetupitant -> CHEMBL3989917
UPDATE sources
   SET external_id = 'CHEMBL3989917',
       url         = 'https://platform.opentargets.org/drug/CHEMBL3989917'
 WHERE id          = 'd369fe0c-e81f-40ab-8fd6-1ebbd38fa593'
   AND external_id = 'OT-FOSNETUPITANT';

-- 9. Milnacipran -> CHEMBL259209
UPDATE sources
   SET external_id = 'CHEMBL259209',
       url         = 'https://platform.opentargets.org/drug/CHEMBL259209'
 WHERE id          = '3a8aeef9-f4a5-48df-bf6f-cf841ac621f4'
   AND external_id = 'OT-MILNACIPRAN';

-- 10. Liothyronine (triiodothyronine) -> CHEMBL1544
UPDATE sources
   SET external_id = 'CHEMBL1544',
       url         = 'https://platform.opentargets.org/drug/CHEMBL1544'
 WHERE id          = '9d2d4b47-2e48-42e8-9f25-594c239c6c93'
   AND external_id = 'OT-TRIIODOTHYRONINE-(LIOTHYRONINE)';

COMMIT;

-- Verification query (run after the COMMIT to confirm zero OT-DRUGNAME
-- rows remain in the sources table). Expected result: 0 rows.
--
--   SELECT id, source_type, external_id
--     FROM sources
--    WHERE source_type = 'opentargets'
--      AND external_id LIKE 'OT-%';
--
-- After this migration, re-run scripts/export-sources-for-audit.py and
-- scripts/verify-database-sources.py. The unresolved count on the
-- opentargets source_type should drop to 0; the resolved_match count
-- should climb from 38 to 48.
