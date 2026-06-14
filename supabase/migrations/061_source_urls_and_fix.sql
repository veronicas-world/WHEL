-- 061_source_urls_and_fix.sql
-- Makes every female-biology citation clickable, and corrects one citation
-- error caught during verification.
--
-- 1. Adds source_url to compound_pk (058/059) and compound_condition_phase
--    (060), and backfills each row with the verified primary-source URL, so the
--    per-signal detail page can hyperlink the actual source of each flag.
-- 2. Fixes the escitalopram row: the luteal-phase PMDD RCT is Eriksson et al.,
--    Journal of Clinical Psychopharmacology 2008 (PMID 18344730), not Archives
--    of General Psychiatry. The earlier source_ref named the wrong journal.
--
-- Idempotent: add-column guards plus value-setting updates; safe to re-run.

alter table compound_pk             add column if not exists source_url text;
alter table compound_condition_phase add column if not exists source_url text;

-- ── compound_pk source URLs (by chembl_id) ──────────────────────────────────
update compound_pk p set source_url = v.url
from (values
  ('CHEMBL2095212', 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2012/202611s000lbl.pdf'), -- mirabegron, FDA label
  ('CHEMBL1175',    'https://www.accessdata.fda.gov/drugsatfda_docs/label/2004/21427lbl.pdf'),       -- duloxetine, FDA label
  ('CHEMBL809',     'https://doi.org/10.2165/00003088-199700321-00004'),                              -- sertraline, Ronfeld 1997
  ('CHEMBL41',      'https://doi.org/10.1186/s13293-020-00308-5'),                                    -- fluoxetine, Zucker & Prendergast 2020
  ('CHEMBL490',     'https://doi.org/10.1186/s13293-020-00308-5'),                                    -- paroxetine
  ('CHEMBL940',     'https://doi.org/10.1186/s13293-020-00308-5'),                                    -- gabapentin
  ('CHEMBL12',      'https://doi.org/10.1186/s13293-020-00308-5'),                                    -- diazepam
  ('CHEMBL1698',    'https://doi.org/10.1186/s13293-020-00308-5')                                     -- bupropion
) as v(chembl, url)
join compounds c on c.chembl_id = v.chembl
where p.compound_id = c.id;

-- ── compound_condition_phase source URLs (by chembl_id) ─────────────────────
update compound_condition_phase p set source_url = v.url
from (values
  ('CHEMBL41',   'https://www.acog.org/clinical/clinical-guidance/clinical-practice-guideline/articles/2023/12/management-of-premenstrual-disorders'), -- fluoxetine, ACOG 2023
  ('CHEMBL809',  'https://www.acog.org/clinical/clinical-guidance/clinical-practice-guideline/articles/2023/12/management-of-premenstrual-disorders'), -- sertraline, ACOG 2023
  ('CHEMBL490',  'https://www.acog.org/clinical/clinical-guidance/clinical-practice-guideline/articles/2023/12/management-of-premenstrual-disorders'), -- paroxetine, ACOG 2023
  ('CHEMBL1508', 'https://pubmed.ncbi.nlm.nih.gov/18344730/'),                                          -- escitalopram, Eriksson 2008
  ('CHEMBL1509', 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/021676s020lbl.pdf')         -- drospirenone/EE, FDA YAZ label
) as v(chembl, url)
join compounds c on c.chembl_id = v.chembl
where p.compound_id = c.id;

-- ── Fix the escitalopram citation (journal correction) ──────────────────────
update compound_condition_phase p
set source_ref = 'Eriksson et al., Journal of Clinical Psychopharmacology 2008 (PMID 18344730; placebo-controlled RCT of luteal-phase escitalopram in PMDD). Off-label; not FDA-approved for PMDD.'
from compounds c
where c.id = p.compound_id and c.chembl_id = 'CHEMBL1508';
