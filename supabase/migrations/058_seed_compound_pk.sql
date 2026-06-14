-- 058_seed_compound_pk.sql
-- B4 / M4: first seeding of the sex-aware layer (the differentiation).
--
-- 054 created the structure (compound_pk + compounds.sex_specific_pk). This
-- migration fills it with a small, deliberately conservative set of documented,
-- citable sex-PK cases among compounds that are already in the corpus, so a
-- "sex-specific PK" disclosure can surface beside their signals in the gated
-- view. Each row carries its source (source_ref), holding to the same
-- traceability rule as every other claim in the substrate.
--
-- Scope note (honest): these are sex-based PK differences, so cycle_phase is
-- left null. Cyclical-phase population (claims.cycle_phase) is a separate
-- follow-on. Cases excluded on purpose where the evidence is mixed (e.g.
-- citalopram, where sex differences in exposure are inconsistent across studies).
--
-- Idempotent: rows are inserted only when an equivalent (compound, parameter,
-- sex) row does not already exist; the flag update is naturally idempotent.
-- Compounds are resolved by chembl_id (stable) rather than by display name.

-- ── Mirabegron (overactive bladder) ─────────────────────────────────────────
insert into compound_pk (compound_id, parameter, sex, direction, magnitude, source_ref, note)
select c.id, 'exposure (Cmax, AUC)', 'female', 'higher',
  '~40-50% higher Cmax and AUC than males; ~20-30% higher after body-weight correction',
  'FDA Myrbetriq (mirabegron) label, Section 12.3 Pharmacokinetics (accessdata.fda.gov/drugsatfda_docs/label/2012/202611s000lbl.pdf)',
  'Higher systemic exposure in women; the label attributes most of the difference to body weight and does not consider it generally clinically significant.'
from compounds c
where c.chembl_id = 'CHEMBL2095212'
  and not exists (select 1 from compound_pk p
    where p.compound_id = c.id and p.parameter = 'exposure (Cmax, AUC)' and p.sex = 'female');

-- ── Duloxetine (SNRI; depression, neuropathic pain) ─────────────────────────
insert into compound_pk (compound_id, parameter, sex, direction, magnitude, source_ref, note)
select c.id, 'clearance', 'female', 'lower',
  '~50% lower apparent clearance, corresponding to roughly twice the systemic exposure vs males',
  'FDA Cymbalta (duloxetine) label, Clinical Pharmacology (accessdata.fda.gov/drugsatfda_docs/label/2004/21427lbl.pdf)',
  'Women reach substantially higher duloxetine exposure at the same dose; the label notes no dose adjustment is recommended on the basis of sex.'
from compounds c
where c.chembl_id = 'CHEMBL1175'
  and not exists (select 1 from compound_pk p
    where p.compound_id = c.id and p.parameter = 'clearance' and p.sex = 'female');

-- ── Sertraline (SSRI; first-line in the PMDD flagship) ──────────────────────
insert into compound_pk (compound_id, parameter, sex, direction, magnitude, source_ref, note)
select c.id, 'exposure', 'female', 'higher',
  '~35-45% higher plasma concentrations at the same dose; longer terminal half-life in young women (~32-37 h vs ~22 h in young men)',
  'Ronfeld et al., Clin Pharmacokinet 1997 (sertraline PK in young and elderly men and women); corroborated by TDM analysis, BMC Psychiatry 2025',
  'Directly relevant to the PMDD flagship, where sertraline is a first-line option: women reach higher steady-state concentrations at the same dose.'
from compounds c
where c.chembl_id = 'CHEMBL809'
  and not exists (select 1 from compound_pk p
    where p.compound_id = c.id and p.parameter = 'exposure' and p.sex = 'female');

-- ── Carry the flag onto the compounds these rows describe ────────────────────
update compounds set sex_specific_pk = true
where chembl_id in ('CHEMBL2095212', 'CHEMBL1175', 'CHEMBL809');
