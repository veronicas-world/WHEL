# Ambiguous compounds — human worklist

Generated 2026-06-12 from the Path A resolver after the automated cleanup pass. These are the names that should NOT be auto-resolved to a single ChEMBL id. Each one needs a human decision. The resolver never guessed; that is why they are here.

## How to use this list

For each row, pick one of:

1. **Map to a single drug** — if it really is one drug we mislabeled, put its ChEMBL id in the `decision` column (e.g. `CHEMBL25`). I can then add it to migration 051.
2. **Keep as a class** — for drug classes, the right move in Path B is usually a separate `class` node that links to its members, not a single ChEMBL id. Mark `decision = keep-as-class`.
3. **Keep as combination** — combination products link to each component drug in Path B. Mark `decision = keep-as-combination`.
4. **Supplement / non-drug** — these stay as named interventions without a ChEMBL id (ChEMBL does not cover foods/supplements/behaviors). Mark `decision = keep-as-supplement` or `keep-as-non-drug`.

Nothing here blocks applying migrations 050 and 051; these rows simply carry `resolution_status = 'ambiguous'` until you decide. Hand the file back and I will fold the decisions in.

## Combination product (4)

| compound | model's read | decision (fill in) |
| --- | --- | --- |
| Combined Oral Contraceptives (estrogen-Progestogen) |  | |
| Spermidine-Hyaluronate Complex (UBIGEL Donna) |  | |
| Topical Estrogen/testosterone Cream |  | |
| Very-Low-Dose Combined Oral Contraceptives (estradiol-Based) |  | |

## Drug class (14)

| compound | model's read | decision (fill in) |
| --- | --- | --- |
| Antihistamines (Zyrtec/cetirizine, Benadryl/diphenhydramine) |  | |
| Aromatase Inhibitors (e.g., Letrozole, Anastrozole) |  | |
| Continuous Oral Contraceptive |  | |
| GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide) |  | |
| GLP-1 Receptor Agonists (Ozempic/semaglutide, Mounjaro/tirzepatide, Wegovy, Victoza/liraglutide) |  | |
| GnRH Agonists (e.g., Leuprolide, Triptorelin) |  | |
| GnRH Antagonists (e.g., Elagolix, Relugolix) |  | |
| GnRH Antagonists (oral, E.g., Elagolix, Relugolix, Linzagolix) |  | |
| NKB Receptor Antagonists (NK3R Antagonists) |  | |
| Selective Progesterone Receptor Modulators (SPRMs) |  | |
| Selective Progesterone Receptor Modulators (SPRMs, E.g., Ulipristal Acetate, Mifepristone) |  | |
| SGLT2 Inhibitors (e.g., Empagliflozin, Dapagliflozin) |  | |
| Statins (HMG-CoA Reductase Inhibitors) |  | |
| Vaginal Estrogen |  | |

## Supplement / vitamin / herbal (6)

| compound | model's read | decision (fill in) |
| --- | --- | --- |
| Chinese Herbal Medicine (CHM) Formulations |  | |
| Cinnamon Extract |  | |
| Collagen Supplements |  | |
| Magnesium Supplements |  | |
| Spearmint Tea |  | |
| Vitamin D Supplementation |  | |

## Non-drug intervention (1)

| compound | model's read | decision (fill in) |
| --- | --- | --- |
| Alcohol Cessation |  | |
