-- 053_resolve_ambiguous_decisions.sql
--
-- Folds the human decisions from AMBIGUOUS-COMPOUNDS-WORKLIST.md into the
-- compounds table. The 25 names the Path A resolver flagged 'ambiguous'
-- (migration 051) carried no single ChEMBL id by design: they are drug
-- classes, combination products, supplements, or non-drug interventions.
-- This records the human decision (resolution_decision) so Path B knows what
-- to build — a `class` node linking members, a combination linking
-- components, or a named non-drug intervention with no ChEMBL id — and marks
-- the rows 'decided' so they drop off the review worklist.
--
-- Idempotent and guarded: matches on compounds.name, only fills where
-- resolution_decision is still null, safe to re-run. Apply after 050 and 051.
-- (052 is not required for this migration.)
--
-- NOTE for the resolver: scripts/resolve-canonical-ids.py should skip any
-- compound where resolution_decision is not null so these do not reappear on a
-- future worklist regeneration. (One-line filter; not changed here.)

alter table compounds add column if not exists resolution_decision text;
alter table compounds add column if not exists resolution_notes    text;

-- ── Drug classes → Path B builds a `class` node that links its members ───────
update compounds set resolution_decision = 'keep-as-class', resolution_status = 'decided'
where resolution_decision is null and name in (
  'Combined Oral Contraceptives (estrogen-Progestogen)',
  'Very-Low-Dose Combined Oral Contraceptives (estradiol-Based)',
  'Aromatase Inhibitors (e.g., Letrozole, Anastrozole)',
  'Continuous Oral Contraceptive',
  'GnRH Agonists (e.g., Leuprolide, Triptorelin)',
  'NKB Receptor Antagonists (NK3R Antagonists)',
  'SGLT2 Inhibitors (e.g., Empagliflozin, Dapagliflozin)',
  'Statins (HMG-CoA Reductase Inhibitors)',
  'Vaginal Estrogen'
);

-- Antihistamines: class, with the two member ChEMBL ids recorded for the Path B
-- class node. (Member ids supplied by human review; verify against ChEMBL when
-- the class members are created.)
update compounds set resolution_decision = 'keep-as-class', resolution_status = 'decided',
  resolution_notes = 'class members: cetirizine = CHEMBL1000; diphenhydramine = CHEMBL657 (verify at member-node creation)'
where resolution_decision is null
  and name = 'Antihistamines (Zyrtec/cetirizine, Benadryl/diphenhydramine)';

-- Classes flagged in review as likely duplicate names. Kept as class for now;
-- collapse each pair into a single Path B class node at class-node build time.
update compounds set resolution_decision = 'keep-as-class', resolution_status = 'decided',
  resolution_notes = 'possible duplicate class name; collapse with the other GLP-1 receptor agonist row when building the Path B class node'
where resolution_decision is null and name in (
  'GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide)',
  'GLP-1 Receptor Agonists (Ozempic/semaglutide, Mounjaro/tirzepatide, Wegovy, Victoza/liraglutide)'
);

update compounds set resolution_decision = 'keep-as-class', resolution_status = 'decided',
  resolution_notes = 'possible duplicate class name; collapse with the other GnRH antagonist row when building the Path B class node'
where resolution_decision is null and name in (
  'GnRH Antagonists (e.g., Elagolix, Relugolix)',
  'GnRH Antagonists (oral, E.g., Elagolix, Relugolix, Linzagolix)'
);

update compounds set resolution_decision = 'keep-as-class', resolution_status = 'decided',
  resolution_notes = 'possible duplicate class name; collapse with the other SPRM row when building the Path B class node'
where resolution_decision is null and name in (
  'Selective Progesterone Receptor Modulators (SPRMs)',
  'Selective Progesterone Receptor Modulators (SPRMs, E.g., Ulipristal Acetate, Mifepristone)'
);

-- ── Combination product → Path B links each component drug ───────────────────
update compounds set resolution_decision = 'keep-as-combination', resolution_status = 'decided'
where resolution_decision is null and name = 'Topical Estrogen/testosterone Cream';

-- ── Supplements / vitamins / herbal → named intervention, no ChEMBL id ───────
update compounds set resolution_decision = 'keep-as-supplement', resolution_status = 'decided'
where resolution_decision is null and name in (
  'Chinese Herbal Medicine (CHM) Formulations',
  'Cinnamon Extract',
  'Collagen Supplements',
  'Magnesium Supplements',
  'Spearmint Tea',
  'Vitamin D Supplementation'
);

-- ── Non-drug interventions → named intervention, no ChEMBL id ────────────────
update compounds set resolution_decision = 'keep-as-non-drug', resolution_status = 'decided'
where resolution_decision is null and name in (
  'Spermidine-Hyaluronate Complex (UBIGEL Donna)',
  'Alcohol Cessation'
);
