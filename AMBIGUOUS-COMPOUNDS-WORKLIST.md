# Ambiguous compounds — human worklist

Generated 2026-06-12 from the Path A resolver after the automated cleanup pass. These are the names that should NOT be auto-resolved to a single ChEMBL id. Each one needs a human decision. The resolver never guessed; that is why they are here.

**Status: decisions made and folded into `supabase/migrations/053_resolve_ambiguous_decisions.sql` (2026-06-13).** Apply 053 after 050/051. Each row now carries `resolution_status = 'decided'` and a `resolution_decision`. The resolver should skip rows where `resolution_decision is not null` so they do not reappear on a future worklist.

## How to use this list

For each row, pick one of:

1. **Map to a single drug** — if it really is one drug we mislabeled, put its ChEMBL id in the `decision` column (e.g. `CHEMBL25`).
2. **Keep as a class** — for drug classes, the right move in Path B is usually a separate `class` node that links to its members, not a single ChEMBL id. Mark `decision = keep-as-class`.
3. **Keep as combination** — combination products link to each component drug in Path B. Mark `decision = keep-as-combination`.
4. **Supplement / non-drug** — these stay as named interventions without a ChEMBL id (ChEMBL does not cover foods/supplements/behaviors). Mark `decision = keep-as-supplement` or `keep-as-non-drug`.

## Combination product (4)

| compound | decision |
| --- | --- |
| Combined Oral Contraceptives (estrogen-Progestogen) | keep-as-class |
| Spermidine-Hyaluronate Complex (UBIGEL Donna) | keep-as-non-drug |
| Topical Estrogen/testosterone Cream | keep-as-combination |
| Very-Low-Dose Combined Oral Contraceptives (estradiol-Based) | keep-as-class |

## Drug class (14)

| compound | decision |
| --- | --- |
| Antihistamines (Zyrtec/cetirizine, Benadryl/diphenhydramine) | keep-as-class · members cetirizine=CHEMBL1000, diphenhydramine=CHEMBL657 |
| Aromatase Inhibitors (e.g., Letrozole, Anastrozole) | keep-as-class |
| Continuous Oral Contraceptive | keep-as-class |
| GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide) | keep-as-class · likely duplicate (collapse in Path B) |
| GLP-1 Receptor Agonists (Ozempic/semaglutide, Mounjaro/tirzepatide, Wegovy, Victoza/liraglutide) | keep-as-class · likely duplicate (collapse in Path B) |
| GnRH Agonists (e.g., Leuprolide, Triptorelin) | keep-as-class |
| GnRH Antagonists (e.g., Elagolix, Relugolix) | keep-as-class · likely duplicate (collapse in Path B) |
| GnRH Antagonists (oral, E.g., Elagolix, Relugolix, Linzagolix) | keep-as-class · likely duplicate (collapse in Path B) |
| NKB Receptor Antagonists (NK3R Antagonists) | keep-as-class |
| Selective Progesterone Receptor Modulators (SPRMs) | keep-as-class · likely duplicate (collapse in Path B) |
| Selective Progesterone Receptor Modulators (SPRMs, E.g., Ulipristal Acetate, Mifepristone) | keep-as-class · likely duplicate (collapse in Path B) |
| SGLT2 Inhibitors (e.g., Empagliflozin, Dapagliflozin) | keep-as-class |
| Statins (HMG-CoA Reductase Inhibitors) | keep-as-class |
| Vaginal Estrogen | keep-as-class |

## Supplement / vitamin / herbal (6)

| compound | decision |
| --- | --- |
| Chinese Herbal Medicine (CHM) Formulations | keep-as-supplement |
| Cinnamon Extract | keep-as-supplement |
| Collagen Supplements | keep-as-supplement |
| Magnesium Supplements | keep-as-supplement |
| Spearmint Tea | keep-as-supplement |
| Vitamin D Supplementation | keep-as-supplement |

## Non-drug intervention (1)

| compound | decision |
| --- | --- |
| Alcohol Cessation | keep-as-non-drug |
