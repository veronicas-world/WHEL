-- 060_seed_cycle_phase.sql
-- B4 (cyclical half) / M4: first population of the cyclical-phase layer, the
-- twin of the sex-PK layer (058/059).
--
-- 054 placed cycle_phase on the substrate `claims` table (per-claim efficacy
-- phase). That is the right home for an individual extracted efficacy claim,
-- but the strongest phase-dependent facts here are treatment-level (a drug's
-- efficacy for a condition is dosed by cycle phase), and the gated candidate
-- cards read the breadth `repurposing_signals` (compound + condition), not the
-- 35-row flagship claims table. So this migration adds a small, sourced
-- compound-condition phase-dependence annotation that surfaces beside the
-- relevant signals, complementing (not replacing) claims.cycle_phase.
--
-- Phase vocabulary matches 054: follicular | ovulatory | luteal | menstrual |
-- unspecified. The values here are all 'luteal' (PMDD). Grounded in ACOG 2023
-- guidance, FDA labels, and a placebo-controlled RCT; each row carries its
-- source. Validation basis for this layer is the DRSP (Daily Record of Severity
-- of Problems) and the ISPMD methodological consensus.
--
-- Idempotent and guarded on (compound_id, condition_id, cycle_phase); compounds
-- resolved by chembl_id, condition by slug.

create table if not exists compound_condition_phase (
  id              uuid primary key default gen_random_uuid(),
  compound_id     uuid not null references compounds(id)  on delete cascade,
  condition_id    uuid not null references conditions(id) on delete cascade,
  cycle_phase     text not null,
  phase_dependent boolean not null default true,
  pattern         text,            -- 'luteal_dosing' | 'cycle_suppression' | ...
  dosing_note     text,
  source_ref      text,            -- citation (guideline / FDA label / DOI / PMID)
  note            text,
  created_at      timestamptz not null default now(),
  constraint ccp_phase_chk check (cycle_phase in
    ('follicular','ovulatory','luteal','menstrual','unspecified')),
  unique (compound_id, condition_id, cycle_phase)
);

create index if not exists ccp_compound_condition_idx
  on compound_condition_phase (compound_id, condition_id);

-- ── Fluoxetine for PMDD (luteal dosing) ─────────────────────────────────────
insert into compound_condition_phase (compound_id, condition_id, cycle_phase, phase_dependent, pattern, dosing_note, source_ref, note)
select c.id, k.cond_id, 'luteal', true, 'luteal_dosing',
  'Effective taken only in the luteal phase (the ~2 weeks before menstruation); onset within days distinguishes it from classical antidepressant use.',
  'ACOG Clinical Practice Guideline on PMDD (Obstetrics & Gynecology, 2023); FDA-approved for PMDD (fluoxetine / Sarafem).',
  'SSRI dosed by cycle phase for PMDD.'
from compounds c, (select id as cond_id from conditions where slug = 'pmdd') k
where c.chembl_id = 'CHEMBL41'
  and not exists (select 1 from compound_condition_phase p
    where p.compound_id = c.id and p.condition_id = k.cond_id and p.cycle_phase = 'luteal');

-- ── Sertraline for PMDD (luteal dosing) ─────────────────────────────────────
insert into compound_condition_phase (compound_id, condition_id, cycle_phase, phase_dependent, pattern, dosing_note, source_ref, note)
select c.id, k.cond_id, 'luteal', true, 'luteal_dosing',
  'Effective taken only in the luteal phase; rapid onset distinguishes it from antidepressant use.',
  'ACOG Clinical Practice Guideline on PMDD (Obstetrics & Gynecology, 2023); FDA-approved for PMDD (sertraline / Zoloft).',
  'SSRI dosed by cycle phase for PMDD.'
from compounds c, (select id as cond_id from conditions where slug = 'pmdd') k
where c.chembl_id = 'CHEMBL809'
  and not exists (select 1 from compound_condition_phase p
    where p.compound_id = c.id and p.condition_id = k.cond_id and p.cycle_phase = 'luteal');

-- ── Paroxetine for PMDD (luteal dosing; CR formulation) ─────────────────────
insert into compound_condition_phase (compound_id, condition_id, cycle_phase, phase_dependent, pattern, dosing_note, source_ref, note)
select c.id, k.cond_id, 'luteal', true, 'luteal_dosing',
  'Intermittent luteal-phase dosing (12.5-25 mg, controlled-release) is efficacious for PMDD.',
  'ACOG Clinical Practice Guideline on PMDD (Obstetrics & Gynecology, 2023); paroxetine CR (Paxil CR) is FDA-approved for PMDD, including intermittent luteal-phase dosing.',
  'SSRI dosed by cycle phase for PMDD.'
from compounds c, (select id as cond_id from conditions where slug = 'pmdd') k
where c.chembl_id = 'CHEMBL490'
  and not exists (select 1 from compound_condition_phase p
    where p.compound_id = c.id and p.condition_id = k.cond_id and p.cycle_phase = 'luteal');

-- ── Escitalopram for PMDD (luteal dosing; off-label, RCT-supported) ─────────
insert into compound_condition_phase (compound_id, condition_id, cycle_phase, phase_dependent, pattern, dosing_note, source_ref, note)
select c.id, k.cond_id, 'luteal', true, 'luteal_dosing',
  'Luteal-phase dosing efficacious in a placebo-controlled RCT; dose-dependent (20 mg superior to 10 mg).',
  'Eriksson et al., Archives of General Psychiatry 2008 (placebo-controlled RCT of luteal-phase escitalopram in PMDD). Off-label; not FDA-approved for PMDD.',
  'SSRI dosed by cycle phase for PMDD; off-label.'
from compounds c, (select id as cond_id from conditions where slug = 'pmdd') k
where c.chembl_id = 'CHEMBL1508'
  and not exists (select 1 from compound_condition_phase p
    where p.compound_id = c.id and p.condition_id = k.cond_id and p.cycle_phase = 'luteal');

-- ── Drospirenone / ethinyl estradiol for PMDD (cycle suppression) ───────────
insert into compound_condition_phase (compound_id, condition_id, cycle_phase, phase_dependent, pattern, dosing_note, source_ref, note)
select c.id, k.cond_id, 'luteal', true, 'cycle_suppression',
  'Continuous 24/4 regimen that suppresses the cyclical (luteal-phase) symptom pathophysiology rather than being dosed within a phase.',
  'FDA YAZ (drospirenone 3 mg / ethinyl estradiol 20 mcg) label; FDA-approved for PMDD on the strength of placebo-controlled RCTs using the DRSP outcome (Yonkers et al. 2005; Pearlstein/Rapkin).',
  'Hormonal therapy targeting the luteal-phase pathophysiology of PMDD.'
from compounds c, (select id as cond_id from conditions where slug = 'pmdd') k
where c.chembl_id = 'CHEMBL1509'
  and not exists (select 1 from compound_condition_phase p
    where p.compound_id = c.id and p.condition_id = k.cond_id and p.cycle_phase = 'luteal');
