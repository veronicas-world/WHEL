-- 059_expand_compound_pk_zucker.sql
-- Expands the sex-aware layer (058) using the curated sex-PK literature as the
-- backbone, so each new row is independently grounded rather than assembled ad
-- hoc. Source: Zucker & Prendergast, "Sex differences in pharmacokinetics
-- predict adverse drug reactions in women," Biology of Sex Differences 2020
-- (doi:10.1186/s13293-020-00308-5), a curated dataset of 86 FDA-approved drugs
-- in which 76 showed higher exposure or slower elimination in women.
--
-- Only drugs that are (a) already in the corpus and (b) listed in that dataset
-- as women-higher are added here. Citalopram is intentionally excluded: it
-- appears in the dataset, but other pharmacokinetic studies disagree on the
-- direction and magnitude, so it stays below our bar.
--
-- These remain sex-based differences, so cycle_phase is left null. Idempotent
-- and guarded on (compound_id, parameter, sex); compounds resolved by chembl_id.

-- shared source string
-- (kept inline per row so each compound_pk row is self-describing)

-- ── Fluoxetine (SSRI; PMDD and mood) ────────────────────────────────────────
insert into compound_pk (compound_id, parameter, sex, direction, magnitude, source_ref, note)
select c.id, 'clearance', 'female', 'slower',
  'Longer elimination time in women at the same dose',
  'Zucker & Prendergast, Biology of Sex Differences 2020 (doi:10.1186/s13293-020-00308-5), curated sex-PK dataset of 86 approved drugs',
  'SSRI used across PMDD and mood; women reach higher steady-state exposure than men.'
from compounds c
where c.chembl_id = 'CHEMBL41'
  and not exists (select 1 from compound_pk p
    where p.compound_id = c.id and p.parameter = 'clearance' and p.sex = 'female');

-- ── Paroxetine (SSRI; PMDD; non-hormonal option for menopausal hot flashes) ──
insert into compound_pk (compound_id, parameter, sex, direction, magnitude, source_ref, note)
select c.id, 'clearance', 'female', 'slower',
  'Longer elimination time in women at the same dose',
  'Zucker & Prendergast, Biology of Sex Differences 2020 (doi:10.1186/s13293-020-00308-5), curated sex-PK dataset of 86 approved drugs',
  'SSRI; paroxetine (Brisdelle) is the non-hormonal option for menopausal vasomotor symptoms. Women reach higher exposure.'
from compounds c
where c.chembl_id = 'CHEMBL490'
  and not exists (select 1 from compound_pk p
    where p.compound_id = c.id and p.parameter = 'clearance' and p.sex = 'female');

-- ── Gabapentin (off-label for vulvodynia and pelvic pain) ───────────────────
insert into compound_pk (compound_id, parameter, sex, direction, magnitude, source_ref, note)
select c.id, 'cmax', 'female', 'higher',
  'Higher peak concentration (Cmax) in women',
  'Zucker & Prendergast, Biology of Sex Differences 2020 (doi:10.1186/s13293-020-00308-5), curated sex-PK dataset of 86 approved drugs',
  'Used off-label for vulvodynia and pelvic pain; women reach higher peak concentrations at the same dose.'
from compounds c
where c.chembl_id = 'CHEMBL940'
  and not exists (select 1 from compound_pk p
    where p.compound_id = c.id and p.parameter = 'cmax' and p.sex = 'female');

-- ── Diazepam (vaginal diazepam for pelvic-floor / vulvodynia spasm) ──────────
insert into compound_pk (compound_id, parameter, sex, direction, magnitude, source_ref, note)
select c.id, 'half_life', 'female', 'higher',
  'Longer elimination half-life in women',
  'Zucker & Prendergast, Biology of Sex Differences 2020 (doi:10.1186/s13293-020-00308-5), curated sex-PK dataset of 86 approved drugs',
  'Vaginal diazepam is used for pelvic-floor and vulvodynia-related muscle spasm; longer half-life in women.'
from compounds c
where c.chembl_id = 'CHEMBL12'
  and not exists (select 1 from compound_pk p
    where p.compound_id = c.id and p.parameter = 'half_life' and p.sex = 'female');

-- ── Bupropion (mood; sometimes weight, sexual function) ─────────────────────
insert into compound_pk (compound_id, parameter, sex, direction, magnitude, source_ref, note)
select c.id, 'exposure (AUC, Cmax)', 'female', 'higher',
  'Higher AUC and Cmax and longer half-life in women',
  'Zucker & Prendergast, Biology of Sex Differences 2020 (doi:10.1186/s13293-020-00308-5), curated sex-PK dataset of 86 approved drugs',
  'Women reach higher systemic exposure than men at the same dose.'
from compounds c
where c.chembl_id = 'CHEMBL1698'
  and not exists (select 1 from compound_pk p
    where p.compound_id = c.id and p.parameter = 'exposure (AUC, Cmax)' and p.sex = 'female');

-- ── Carry the flag onto the compounds these rows describe ────────────────────
update compounds set sex_specific_pk = true
where chembl_id in ('CHEMBL41', 'CHEMBL490', 'CHEMBL940', 'CHEMBL12', 'CHEMBL1698');
