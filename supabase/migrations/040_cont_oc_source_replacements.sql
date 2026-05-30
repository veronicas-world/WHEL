-- 040_cont_oc_source_replacements.sql
-- Closes the two S3 audit rows deferred from migration 038. Both
-- signals carried a single, condition-mismatched CT.gov source
-- (NCT00927095, a PMDD trial). Dropping that source alone would have
-- orphaned the signals, so 038 deferred them pending PubMed-verified
-- replacement citations.
--
-- This migration drops the old CT.gov sources AND inserts proper
-- condition-correct PubMed sources in the same transaction, keeping
-- the signals supported throughout.
--
-- All PMIDs verified against PubMed E-utils esummary 2026-05-29.
-- Verification dump: scripts/audit-output/cont-oc-backfill-verified.json
--
-- Replacements:
--   Row 15. Continuous OC -> Endometriosis
--     signal_id   56e48846-e387-4073-8d82-ad84320ef20a
--     drop source 3ce9a0c2-2aec-4e50-876d-1585f6aaf265 (NCT00927095, PMDD)
--     add  PMID   35350465 (Becker et al. ESHRE 2022 endometriosis
--                 guideline, Hum Reprod Open) — canonical international
--                 guideline endorsing combined hormonal contraceptives
--                 including continuous regimens as first-line medical
--                 therapy for endometriosis-associated pain.
--
--   Row 16. Continuous OC -> Adenomyosis
--     signal_id   3a8e1721-c431-46f3-87a4-2123854300c8
--     drop source 9e6c0cd8-c2ff-49dc-a2e0-32c501542530 (NCT00927095, PMDD)
--     add  PMID   40166680 (Etrusco et al. Front Endocrinol 2025) —
--                 network meta-analysis of RCTs of hormone therapies for
--                 adenomyosis-associated pelvic pain, covering combined
--                 OCPs alongside progestins and GnRH analogues.
--
-- After this migration the S3 finding from the May 2026 independent
-- review is fully closed (21 of 21 audit rows actioned: 17 in 038, 4
-- here counted as 2 source-swaps).
--
-- Generated: 2026-05-29

BEGIN;

-- ────────────────────────────────────────────────────────────
-- Row 15. Continuous OC -> Endometriosis
-- ────────────────────────────────────────────────────────────

DELETE FROM sources
WHERE id = '3ce9a0c2-2aec-4e50-876d-1585f6aaf265';

INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('56e48846-e387-4073-8d82-ad84320ef20a',
        'pubmed',
        '35350465',
        'ESHRE guideline: endometriosis',
        'Becker CM; Bokor A; Heikinheimo O; Horne A; Jansen F; Kiesel L; King K; Kvaskoff M; Nap A; Petersen K; Saridogan E; Tomassetti C; van Hanegem N; Vulliemoz N; Vermeulen N; ESHRE Endometriosis Guideline Group',
        'Human Reproduction Open',
        '2022-01-01',
        'https://pubmed.ncbi.nlm.nih.gov/35350465/');

-- ────────────────────────────────────────────────────────────
-- Row 16. Continuous OC -> Adenomyosis
-- ────────────────────────────────────────────────────────────

DELETE FROM sources
WHERE id = '9e6c0cd8-c2ff-49dc-a2e0-32c501542530';

INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('3a8e1721-c431-46f3-87a4-2123854300c8',
        'pubmed',
        '40166680',
        'Efficacy and safety of hormone therapies for treating adenomyosis-associated pelvic pain: a systematic review and network meta-analysis of randomized controlled trials',
        'Etrusco A; Agrifoglio V; D''Amato A; Chiantera V; Laganà AS; Haydamous J; Cobellis L; De Franciscis P; Vannuccini S; Krentel H; Naem A; Riemma G',
        'Frontiers in Endocrinology',
        '2025-01-01',
        'https://pubmed.ncbi.nlm.nih.gov/40166680/');

COMMIT;

-- ────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (run separately after COMMIT)
-- ────────────────────────────────────────────────────────────

-- V1. Confirm old CT.gov sources are gone
-- Expected: 0 rows.
-- SELECT id FROM sources
-- WHERE id IN (
--   '3ce9a0c2-2aec-4e50-876d-1585f6aaf265',
--   '9e6c0cd8-c2ff-49dc-a2e0-32c501542530'
-- );

-- V2. Confirm new PubMed sources attached to the right signals
-- Expected: 2 rows.
-- Row 56e48846... has source_type='pubmed', external_id='35350465'.
-- Row 3a8e1721... has source_type='pubmed', external_id='40166680'.
-- SELECT signal_id, source_type, external_id, journal
-- FROM sources
-- WHERE signal_id IN (
--   '56e48846-e387-4073-8d82-ad84320ef20a',
--   '3a8e1721-c431-46f3-87a4-2123854300c8'
-- )
-- ORDER BY signal_id;

-- V3. Confirm each of the two signals has exactly 1 source after the swap
-- Expected: 2 rows, each with source_count = 1.
-- SELECT signal_id, COUNT(*) AS source_count
-- FROM sources
-- WHERE signal_id IN (
--   '56e48846-e387-4073-8d82-ad84320ef20a',
--   '3a8e1721-c431-46f3-87a4-2123854300c8'
-- )
-- GROUP BY signal_id
-- ORDER BY signal_id;
