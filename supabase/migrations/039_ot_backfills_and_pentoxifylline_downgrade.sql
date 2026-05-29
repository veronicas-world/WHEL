-- 039_ot_backfills_and_pentoxifylline_downgrade.sql
-- Follow-on to finding C1 (Independent Review, May 2026): twelve Open
-- Targets single-source Moderate-tier signals where the published
-- literature genuinely supports replication = 1 but only the OT row was
-- attached. This migration ADDS the supporting PubMed citation so each
-- score is defensible against the literal published rubric. Replication
-- scores stay at 1; the second source simply makes the existing score
-- rubric-compliant.
--
-- Plus one downgrade: Pentoxifylline -> Adenomyosis (signal_id
-- cc2a613f-...). The only available pentoxifylline systematic review is
-- on endometriosis (Cochrane 34431079), not adenomyosis, and there is no
-- adenomyosis-specific primary literature. Backfilling with the
-- endometriosis Cochrane would visibly cite the wrong condition on the
-- page. Honest call is to drop replication to 0, which crosses the tier
-- band from Moderate to Emerging.
--
-- All PMIDs verified against PubMed E-utils esummary 2026-05-29.
-- Verification dump: scripts/audit-output/ot-backfill-verified.json
--
-- Twelve backfilled signals (replication stays at 1; total stays same;
-- tier stays same. The new second source attached makes the score
-- defensible under the tightened rubric):
--
--   1. Rosiglitazone -> PCOS
--        signal_id ed9a27a6-e362-4e35-9b73-85e7dc9aa653
--        adding PMID 31718828 (Li et al. Fertil Steril 2020, RCT)
--   2. Tanezumab -> Endometriosis
--        signal_id d7bb9759-2e60-4b16-88cf-8ff114563185
--        adding PMID 32240297 (Peng et al. Hum Reprod 2020, IL-1B/NGF)
--   3. Tanezumab -> Vulvodynia
--        signal_id 3d9109c5-bf21-47c2-b925-1f0ec149d24c
--        adding PMID 29570566 (Reed et al. J Low Genit Tract Dis 2018, NGF in vulvodynia)
--   4. Tanezumab -> Adenomyosis
--        signal_id a7c70583-d5ee-4bc9-a0b2-d37d4a36ae6d
--        adding PMID 25519715 (Li et al. Reprod Sci 2015, NGF in adenomyosis stromal cells)
--   5. Epelsiban -> Adenomyosis  (class-mechanism replication, see audit notes)
--        signal_id 65c553a6-0ab2-430c-8fe8-c958d40097e0
--        adding PMID 33305666 (Orazov et al. Gynecol Endocrinol 2020, OXTR pain pathophysiology)
--   6. Epelsiban -> Endometriosis  (class-mechanism replication)
--        signal_id c78709f5-4cd2-464f-bd70-f27cf1a1b17b
--        adding PMID 33305665 (Yarmolinskaya et al. Gynecol Endocrinol 2020, OXTR therapy potential)
--   7. Pavinetant -> PCOS
--        signal_id cd4a159e-369f-466d-aadd-44fa95175d30
--        adding PMID 27459523 (George/Skorupskaite et al. JCEM 2016, NK3R Phase II RCT)
--   8. Dapagliflozin -> PCOS
--        signal_id 59bd5f06-9146-47f0-af93-6fe697bbf494
--        adding PMID 41918604 (Agarwal et al. Indian J Endocrinol Metab 2026, dapagliflozin+metformin RCT)
--   9. Pioglitazone -> PCOS
--        signal_id 6e5ea392-f2f6-48b9-9c1d-3d4a370fea31
--        adding PMID 38374053 (Zhao et al. J Ovarian Res 2024, pioglitazone+metformin RCT)
--  10. Raloxifene -> PCOS
--        signal_id d12d2959-1e83-444f-85c2-1f06d992c715
--        adding PMID 21782166 (de Paula Guedes Neto et al. Fertil Steril 2011, raloxifene vs clomiphene RCT)
--  11. Drospirenone -> PMDD
--        signal_id 5c7ff64e-99da-464e-bce2-a25b51f75a5f
--        adding PMID 37365881 (Ma & Song, Cochrane Database Syst Rev 2023, drospirenone OCs for PMS)
--  12. (renumbered) Pentoxifylline -> Endometriosis
--        signal_id 54834a9c-c1b4-4cc3-bfe3-403c52b3e0a7
--        adding PMID 34431079 (Grammatis et al. Cochrane Database Syst Rev 2021, pentoxifylline for endometriosis)
--
-- One downgrade:
--   13. Pentoxifylline -> Adenomyosis  (signal_id cc2a613f-9080-4599-8f5e-5fde0ac2de42)
--        replication_score: 1 -> 0
--        total_evidence_score (GENERATED): 7 -> 6
--        confidence_tier:    Moderate -> Emerging
--
-- Generated: 2026-05-29

BEGIN;

-- ── Backfills (12 signals, 12 new source rows, no score changes) ──────────

-- 1. Rosiglitazone -> PCOS
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('ed9a27a6-e362-4e35-9b73-85e7dc9aa653',
        'pubmed',
        '31718828',
        'Comparing the individual effects of metformin and rosiglitazone and their combination in obese women with polycystic ovary syndrome: a randomized controlled trial',
        'Li Y; Tan J; Wang Q; Duan C; Hu Y; Huang W',
        'Fertility and Sterility',
        '2020-01-01',
        'https://pubmed.ncbi.nlm.nih.gov/31718828/');

-- 2. Tanezumab -> Endometriosis
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('d7bb9759-2e60-4b16-88cf-8ff114563185',
        'pubmed',
        '32240297',
        'Role of interleukin-1β in nerve growth factor expression, neurogenesis and deep dyspareunia in endometriosis',
        'Peng B; Alotaibi FT; Sediqi S; Bedaiwy MA; Yong PJ',
        'Human Reproduction',
        '2020-04-28',
        'https://pubmed.ncbi.nlm.nih.gov/32240297/');

-- 3. Tanezumab -> Vulvodynia
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('3d9109c5-bf21-47c2-b925-1f0ec149d24c',
        'pubmed',
        '29570566',
        'Nerve Growth Factor and Selected Cytokines in Women With and Without Vulvodynia',
        'Reed BD; Plegue MA; Sen A; Haefner HK; Siddiqui J; Remick DG',
        'Journal of Lower Genital Tract Disease',
        '2018-04-01',
        'https://pubmed.ncbi.nlm.nih.gov/29570566/');

-- 4. Tanezumab -> Adenomyosis
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('a7c70583-d5ee-4bc9-a0b2-d37d4a36ae6d',
        'pubmed',
        '25519715',
        'Human Adenomyosis Endometrium Stromal Cells Secreting More Nerve Growth Factor: Impact and Effect',
        'Li Y; Zou S; Xia X; Zhang S',
        'Reproductive Sciences',
        '2015-09-01',
        'https://pubmed.ncbi.nlm.nih.gov/25519715/');

-- 5. Epelsiban -> Adenomyosis
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('65c553a6-0ab2-430c-8fe8-c958d40097e0',
        'pubmed',
        '33305666',
        'Oxytocinergic regulation in pathogenesis of pelvic pain caused by adenomyosis',
        'Orazov M; Radzinsky V; Sharapova O; Kostin I; Chitanava Y',
        'Gynecological Endocrinology',
        '2020-11-01',
        'https://pubmed.ncbi.nlm.nih.gov/33305666/');

-- 6. Epelsiban -> Endometriosis
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('c78709f5-4cd2-464f-bd70-f27cf1a1b17b',
        'pubmed',
        '33305665',
        'The potentialities of oxytocin receptor inhibitors for endometriosis therapy',
        'Yarmolinskaya M; Khobets V; Tral T; Tkachenko N',
        'Gynecological Endocrinology',
        '2020-11-01',
        'https://pubmed.ncbi.nlm.nih.gov/33305665/');

-- 7. Pavinetant -> PCOS
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('cd4a159e-369f-466d-aadd-44fa95175d30',
        'pubmed',
        '27459523',
        'Neurokinin B Receptor Antagonism in Women With Polycystic Ovary Syndrome: A Randomized, Placebo-Controlled Trial',
        'George JT; Kakkar R; Marshall J; Scott ML; Finkelman RD; Ho TW; Veldhuis J; Skorupskaite K; Anderson RA; McIntosh S; Webber L',
        'Journal of Clinical Endocrinology and Metabolism',
        '2016-11-01',
        'https://pubmed.ncbi.nlm.nih.gov/27459523/');

-- 8. Dapagliflozin -> PCOS
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('59bd5f06-9146-47f0-af93-6fe697bbf494',
        'pubmed',
        '41918604',
        'Dapagliflozin Plus Metformin Versus Metformin Alone in Overweight and Obese Patients with Polycystic Ovary Syndrome - An Open-Label, Parallel, Randomized Controlled Trial',
        'Agarwal V; Das S; Choudhury AK; Meher D; Sahoo D; Sahu SK; Priyadarshini S; Agarwal SJ; Prusty B; Das BK; Chappalagavi AS; Gupta S',
        'Indian Journal of Endocrinology and Metabolism',
        '2026-01-01',
        'https://pubmed.ncbi.nlm.nih.gov/41918604/');

-- 9. Pioglitazone -> PCOS
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('6e5ea392-f2f6-48b9-9c1d-3d4a370fea31',
        'pubmed',
        '38374053',
        'Metformin versus metformin plus pioglitazone on gonadal and metabolic profiles in normal-weight women with polycystic ovary syndrome: a single-center, open-labeled prospective randomized controlled trial',
        'Zhao H; Zhang J; Xing C; Cheng X; He B',
        'Journal of Ovarian Research',
        '2024-02-19',
        'https://pubmed.ncbi.nlm.nih.gov/38374053/');

-- 10. Raloxifene -> PCOS
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('d12d2959-1e83-444f-85c2-1f06d992c715',
        'pubmed',
        '21782166',
        'Prospective, randomized comparison between raloxifene and clomiphene citrate for ovulation induction in polycystic ovary syndrome',
        'de Paula Guedes Neto E; Savaris RF; von Eye Corleta H; de Moraes GS; do Amaral Cristovam R; Lessey BA',
        'Fertility and Sterility',
        '2011-09-01',
        'https://pubmed.ncbi.nlm.nih.gov/21782166/');

-- 11. Drospirenone -> PMDD
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('5c7ff64e-99da-464e-bce2-a25b51f75a5f',
        'pubmed',
        '37365881',
        'Oral contraceptives containing drospirenone for premenstrual syndrome',
        'Ma S; Song SJ',
        'Cochrane Database of Systematic Reviews',
        '2023-06-23',
        'https://pubmed.ncbi.nlm.nih.gov/37365881/');

-- 12. Pentoxifylline -> Endometriosis  (direct fit)
INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES ('54834a9c-c1b4-4cc3-bfe3-403c52b3e0a7',
        'pubmed',
        '34431079',
        'Pentoxifylline for the treatment of endometriosis-associated pain and infertility',
        'Grammatis AL; Georgiou EX; Becker CM',
        'Cochrane Database of Systematic Reviews',
        '2021-08-25',
        'https://pubmed.ncbi.nlm.nih.gov/34431079/');

-- ── One downgrade ─────────────────────────────────────────────────────────

-- 13. Pentoxifylline -> Adenomyosis  (Moderate -> Emerging)
--     No adenomyosis-specific pentoxifylline literature exists; honest call.
UPDATE repurposing_signals
SET replication_score = 0,
    replication_level = 'Low',
    confidence_tier   = 'Emerging'
WHERE id = 'cc2a613f-9080-4599-8f5e-5fde0ac2de42';

COMMIT;

-- ── Verification ──────────────────────────────────────────────────────────
--
-- Backfill verification (12 signals): each should now show 2 attached
-- source rows, with replication_score still at 1 (now rubric-compliant).
--
--   SELECT s.id, s.confidence_tier, s.total_evidence_score,
--          s.replication_score, count(src.id) AS n_sources
--   FROM repurposing_signals s
--   LEFT JOIN sources src ON src.signal_id = s.id
--   WHERE s.id IN (
--     'ed9a27a6-e362-4e35-9b73-85e7dc9aa653',
--     'd7bb9759-2e60-4b16-88cf-8ff114563185',
--     '3d9109c5-bf21-47c2-b925-1f0ec149d24c',
--     'a7c70583-d5ee-4bc9-a0b2-d37d4a36ae6d',
--     '65c553a6-0ab2-430c-8fe8-c958d40097e0',
--     'c78709f5-4cd2-464f-bd70-f27cf1a1b17b',
--     'cd4a159e-369f-466d-aadd-44fa95175d30',
--     '59bd5f06-9146-47f0-af93-6fe697bbf494',
--     '6e5ea392-f2f6-48b9-9c1d-3d4a370fea31',
--     'd12d2959-1e83-444f-85c2-1f06d992c715',
--     '5c7ff64e-99da-464e-bce2-a25b51f75a5f',
--     '54834a9c-c1b4-4cc3-bfe3-403c52b3e0a7'
--   )
--   GROUP BY s.id
--   ORDER BY s.confidence_tier, s.total_evidence_score DESC;
--
-- Expected: all 12 rows show replication_score=1 and n_sources=2.
--
-- Downgrade verification:
--
--   SELECT id, replication_score, total_evidence_score, confidence_tier
--   FROM repurposing_signals
--   WHERE id = 'cc2a613f-9080-4599-8f5e-5fde0ac2de42';
--
-- Expected: replication_score=0, total_evidence_score=6, confidence_tier='Emerging'.
