-- 037_pubmed_backfills.sql
-- Follow-on to finding C1 (Independent Review, May 2026): for the five
-- Moderate-tier signals where the underlying evidence base genuinely
-- supports replication = 1 but the database only had ONE PubMed source row
-- attached, this migration ADDS the supporting citations so the score is
-- defensible against the literal published rubric. Replication scores are
-- left as-is (the score the row already had now corresponds to the actual
-- number of attached sources).
--
-- All PMIDs verified against PubMed E-utils esummary 2026-05-28.
--
-- Five signals affected:
--
--   1. Vaginal Estrogen -> Perimenopause & Menopause
--        signal_id 827e3d94-4e02-4e3e-9688-b70a68b31b71
--        existing source: PMID 30624087 (rUTI in postmenopausal women)
--        adding:
--          - PMID 27577677 (Lethaby et al. Cochrane 2016, vaginal atrophy)
--          - PMID 32852449 (NAMS 2020 GSM position statement)
--        rep was 1, total 8 -> becomes 2 / total 9 -> tier Moderate -> Strong
--
--   2. NKB Receptor Antagonists -> Perimenopause & Menopause
--        signal_id cb516b2d-eff4-491b-85bd-5680ba29a428
--        existing source: PMID 37076317 (menopause symptom management review)
--        adding:
--          - PMID 36924778 (Lederman, SKYLIGHT 1 fezolinetant phase 3 Lancet 2023)
--          - PMID 36734148 (SKYLIGHT 2 fezolinetant phase 3 JCEM 2023)
--        rep was 1, total 8 -> becomes 2 / total 9 -> tier Moderate -> Strong
--
--   3. Very-Low-Dose Combined Oral Contraceptives (estradiol-Based) -> Endometriosis
--        signal_id b91092d2-134e-44ea-ae3d-c7235491e314
--        existing source: PMID 39724866 (medical treatment update review)
--        adding:
--          - PMID 35350465 (ESHRE 2022 endometriosis guideline)
--        rep was 1, total 8 stays; tier stays Moderate
--
--   4. Estetrol (E4) -> Perimenopause & Menopause
--        signal_id 97870ea5-984f-4677-88f9-cb16b32e0d53
--        existing source: PMID 39283289 (estetrol review)
--        adding:
--          - PMID 32379217 (E4Relief part 1, vasomotor + safety, Menopause 2020)
--        rep was 1, total 7 stays; tier stays Moderate
--
--   5. Estrogen (systemic HRT) -> Perimenopause & Menopause
--        signal_id 30791664-9232-4edd-8eab-f0b0da1123dc
--        existing source: PMID 22281161 ("Sex hormones, appetite and eating
--          behaviour in women" — a tangential citation; we leave it in
--          place but add the NAMS position statement, which is the modern
--          load-bearing citation)
--        adding:
--          - PMID 35797481 (NAMS 2022 hormone therapy position statement)
--        rep was 1, total 7 stays; tier stays Moderate
--
-- Note: tier increases for Vaginal Estrogen and NK3R signals to Strong is
-- intentional. Both are evidence-base-rich repurposing-adjacent cases that
-- were underweighted by having only one citation attached.
--
-- Generated: 2026-05-29

BEGIN;

-- ── 1. Vaginal Estrogen -> Menopause ──────────────────────────────────────

INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES
  ('827e3d94-4e02-4e3e-9688-b70a68b31b71',
   'pubmed',
   '27577677',
   'Local oestrogen for vaginal atrophy in postmenopausal women',
   'Lethaby A; Ayeleke RO; Roberts H',
   'Cochrane Database of Systematic Reviews',
   '2016-08-31',
   'https://pubmed.ncbi.nlm.nih.gov/27577677/'),
  ('827e3d94-4e02-4e3e-9688-b70a68b31b71',
   'pubmed',
   '32852449',
   'The 2020 genitourinary syndrome of menopause position statement of The North American Menopause Society',
   'NAMS GSM Advisory Panel',
   'Menopause',
   '2020-09-01',
   'https://pubmed.ncbi.nlm.nih.gov/32852449/');

UPDATE repurposing_signals
SET replication_score = 2,
    replication_level = 'High',
    confidence_tier   = 'Strong'
WHERE id = '827e3d94-4e02-4e3e-9688-b70a68b31b71';

-- ── 2. NKB Receptor Antagonists (NK3R Antagonists) -> Menopause ───────────

INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES
  ('cb516b2d-eff4-491b-85bd-5680ba29a428',
   'pubmed',
   '36924778',
   'Fezolinetant for treatment of moderate-to-severe vasomotor symptoms associated with menopause (SKYLIGHT 1): a phase 3 randomised controlled study',
   'Lederman S; Ottery FD; Cano A et al.',
   'Lancet',
   '2023-03-13',
   'https://pubmed.ncbi.nlm.nih.gov/36924778/'),
  ('cb516b2d-eff4-491b-85bd-5680ba29a428',
   'pubmed',
   '36734148',
   'Efficacy and Safety of Fezolinetant in Moderate to Severe Vasomotor Symptoms Associated With Menopause: A Phase 3 RCT',
   'Johnson KA; Martin N; Nappi RE et al.',
   'Journal of Clinical Endocrinology and Metabolism',
   '2023-02-02',
   'https://pubmed.ncbi.nlm.nih.gov/36734148/');

UPDATE repurposing_signals
SET replication_score = 2,
    replication_level = 'High',
    confidence_tier   = 'Strong'
WHERE id = 'cb516b2d-eff4-491b-85bd-5680ba29a428';

-- ── 3. Very-Low-Dose COC -> Endometriosis ─────────────────────────────────

INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES
  ('b91092d2-134e-44ea-ae3d-c7235491e314',
   'pubmed',
   '35350465',
   'ESHRE guideline: endometriosis',
   'Becker CM; Bokor A; Heikinheimo O et al.',
   'Human Reproduction Open',
   '2022-02-26',
   'https://pubmed.ncbi.nlm.nih.gov/35350465/');

-- replication_score stays at 1 (now backed by 2 sources, matching the rubric);
-- tier stays Moderate.

-- ── 4. Estetrol (E4) -> Menopause ─────────────────────────────────────────

INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES
  ('97870ea5-984f-4677-88f9-cb16b32e0d53',
   'pubmed',
   '32379217',
   'A multicenter, randomized study to select the minimum effective dose of estetrol (E4) in postmenopausal women (E4Relief): part 1. Vasomotor symptoms and overall safety',
   'Coelingh Bennink HJT; Verhoeven C; Zimmerman Y et al.',
   'Menopause',
   '2020-05-04',
   'https://pubmed.ncbi.nlm.nih.gov/32379217/');

-- replication_score stays at 1; tier stays Moderate.

-- ── 5. Estrogen (systemic HRT) -> Menopause ───────────────────────────────

INSERT INTO sources (signal_id, source_type, external_id, title, authors, journal, publication_date, url)
VALUES
  ('30791664-9232-4edd-8eab-f0b0da1123dc',
   'pubmed',
   '35797481',
   'The 2022 hormone therapy position statement of The North American Menopause Society',
   'NAMS Hormone Therapy Advisory Panel',
   'Menopause',
   '2022-07-01',
   'https://pubmed.ncbi.nlm.nih.gov/35797481/');

-- replication_score stays at 1; tier stays Moderate.

COMMIT;

-- ── Verification ──────────────────────────────────────────────────────────
--
-- Per signal: count attached sources and confirm tier/score.
--
--   SELECT s.id, s.confidence_tier, s.total_evidence_score,
--          s.replication_score, count(src.id) AS n_sources
--   FROM repurposing_signals s
--   LEFT JOIN sources src ON src.signal_id = s.id
--   WHERE s.id IN (
--     '827e3d94-4e02-4e3e-9688-b70a68b31b71',
--     'cb516b2d-eff4-491b-85bd-5680ba29a428',
--     'b91092d2-134e-44ea-ae3d-c7235491e314',
--     '97870ea5-984f-4677-88f9-cb16b32e0d53',
--     '30791664-9232-4edd-8eab-f0b0da1123dc'
--   )
--   GROUP BY s.id
--   ORDER BY s.confidence_tier, s.total_evidence_score DESC;
--
-- Expected:
--   Vaginal Estrogen + NK3R: Strong tier, 3 sources each
--   COC + Estetrol + Systemic HRT: Moderate tier, 2 sources each
