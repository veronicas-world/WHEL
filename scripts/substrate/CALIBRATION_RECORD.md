# Substrate scoring — calibration record

This is the written calibration gate required by `SCORING_SPEC.md` §9/§10d: the
distribution the scores actually produced, the cutoffs chosen against it, the
female-applicability findings, and the dials reviewed. It is a judgment record, not a
pass/fail script.

- **Date:** 2026-06-16
- **Scored corpus:** 228 active signals (direct 129, pathway 87, community 12), six
  conditions (PMDD, endometriosis, PCOS, menopause, vulvodynia, adenomyosis), after
  condition normalization and the community-triage fix.
- **Model:** claude-opus-4-8 (scoring); claude-sonnet-4-6 (extraction).
- **Reviewer decisions:** Veronica Agudelo (founder), recorded below.

---

## 1. The `arm_score` distribution

Scores fall on a **lattice**: `arm_score = arm_strength (integer 0–10) ×
female_multiplier`, and only two multipliers fire in practice (1.00, 0.75). This
produces discrete clusters separated by empty gaps — which makes cutoff placement
robust (a cutoff in a gap cannot split a cluster).

```
arm_score histogram (0.5-wide bins), n=228
  0.0 | #################  17
  0.5 | ####               4
  1.0 | ##                 2
  2.0 | ###########        11
  3.0 | ###################  19
  3.5 | ##################   18   <-- Emerging cut (≥3.5)
  4.0 | ######################  22
  4.5 | ########           8
  5.0 | ####################################  36
  6.0 | ###############################################  47   <-- Moderate cut (≥6.0)
  7.0 | ################################  32
  8.0 | ########           8                            <-- Strong cut (≥8.0)
  9.0 | ####               4
 (empty gaps at 1.5, 2.5, 5.5, 6.5, 7.5, 8.5, 9.5+)
  min 0.0  median 5.0  max 9.0   p25 3.8  p75 6.0  p90 7.0  p95 8.0
```

Tier counts at the frozen cutoffs: **Strong 12, Moderate 79, Emerging 84,
Exploratory 53.**

---

## 2. Tier cutoffs — FROZEN at Strong ≥ 8.0 / Moderate ≥ 6.0 / Emerging ≥ 3.5

**Decision: keep the provisional cutoffs unchanged.** They were set on reason; the real
distribution and hand-judged anchor pairs confirm them. All three land in or beside a
natural lattice gap.

Anchor pairs examined at each boundary:

- **Strong / Moderate (8.0):** Strong tier is myo-inositol & D-chiro-inositol → PCOS,
  dienogest → adenomyosis, MHT → menopause, aromatase inhibitors → endometriosis,
  letrozole → PCOS, and the FDA-backed non-hormonal VMS agents (paroxetine, citalopram,
  escitalopram, venlafaxine, desvenlafaxine) → menopause. The 7.0 cluster just below —
  curcumin, resveratrol, metformin-as-adjunct, COCP → PCOS — is correctly **Moderate,
  not Strong**. The line separates guideline-grade from good-but-not-definitive.
- **Moderate / Emerging (6.0):** 6.0 = letrozole → endometriosis, GnRHa → adenomyosis,
  dienogest → endometriosis (pathway). 5.0 = vitamin B6 → PMDD, letrozole → PCOS,
  cabergoline → endometriosis. The split reads correctly.
- **Emerging / Exploratory (3.5):** the only boundary cutting a *continuous* 3.0–4.0
  mass (least robust). Above: strength-4 ×1.0 (essential fatty acids → PMDD) and
  strength-5 ×0.75 mechanistic leads (rosiglitazone, cabergoline → endometriosis).
  Below at 3.0: strength-3 ×1.0 (amitriptyline → vulvodynia, acupuncture → PMDD) and
  strength-4 ×0.75. Judged acceptable: the 3.0 set is genuinely thin; the 3.5–3.8 set
  are real early leads worth surfacing with caveat.

Frozen — not re-tuned per run.

---

## 3. Female-applicability bands — only F1 and F4 fire; the axis is effectively two-level

**Finding.** The bands were designed F1–F6, but the corpus exercises only two:

| band | multiplier | meaning | signals |
|------|-----------|---------|--------:|
| F1 | ×1.00 | efficacy evidence generated in women | 174 |
| F4 | ×0.75 | female representation not stated (default) | 54 |
| F2, F3, F5, F6 | — | — | 0 |

This is the data, not a defect:

- Abstracts about endometriosis / PCOS / menopause / etc. are nearly all in women → F1.
- Structured mechanistic sources (Open Targets) carry no "% female" field, so every
  pathway signal defaults to F4.
- The aggressive male-derived / sex-danger discounts (F5 ×0.60, F6 ×0.50) **never
  fire**, because the corpus is therapeutics for female-specific conditions — the
  "drug behaves dangerously in male-derived data" axis is largely inapplicable here.

So in practice the multiplier has collapsed to a clean two-level applicability axis:
**"efficacy shown in women" (×1.0) vs "mechanistic / unstated" (×0.75).** The ×0.75
default is therefore the single most consequential dial in the current system — it is
why the pathway arm tops out at Moderate and why 54 signals sit a full tier lower.

**Decision 1 — keep ×0.75 as the "sex data absent" default.** A 25% haircut for absence
of sex-specific evidence is the intended modest skepticism; left unchanged.

**Decision 2 — pathway/mechanistic signals on the six (all-female) conditions keep the
×0.75 default,** even for obviously-in-women drugs (estradiol, raloxifene, bazedoxifene
→ menopause) that arrive via the pathway arm. Rationale: mechanistic evidence is not
clinical-in-women evidence; the same pairs still appear at full credit in the *direct*
arm where clinical data exists, so the multi-arm view stays coherent. Not credited to
F1 by condition alone.

**The F5/F6 machinery is retained, not removed.** It will start to matter once
cross-condition repurposing introduces male-derived drugs into the corpus; at that
point the external validation below becomes live.

---

## 4. External validation (§10b) — deferred, with rationale

§10b calls for checking low-applicability bands against Janusmed's sex-difference lists
and sex-stratified FAERS/AEMS. **Deferred**, because the bands that those references
discriminate (F5/F6, male-derived danger) are unpopulated in the current
female-therapeutics corpus — there is nothing yet to validate the *separation* of. The
operative axis here is F1-vs-F4 (was the efficacy evidence generated in women), which
is read directly from each study and needs no external reference.

This becomes a live, required check at the point cross-condition / repurposing brings
male-derived drugs in. Recorded as the open item, not silently dropped.

---

## 5. Other dials reviewed (§10c)

- **Community independence discount.** Spot-checked on the real community arm: single
  isolated legacy threads correctly score corroboration 0; pairs/triples across distinct
  threads (progesterone, bupropion → PMDD; metformin → PCOS) correctly reach 1. Behaving
  as designed; the ≈0.3 same-thread weight is not yet exercised (legacy data is
  title-only, one post per thread) and stays provisional until live multi-comment
  threads arrive.
- **Imprecision thresholds (N<30 / <300 events).** Firing correctly on the direct arm
  (e.g. "no sample size or CI in source — flagged for full text", needs_fulltext=1);
  correctly skipped for the community arm.
- **Community rubric / astroturf caps.** `_near_duplicate` and `_timing_burst` caps are
  unit-tested (score_claims --selftest) but not yet exercised on real coordinated
  content; spot-check again when live Reddit lands.

---

## 6. Summary

The calibration **confirmed** the provisional dials rather than changing them. Tier
cutoffs frozen at 8.0 / 6.0 / 3.5. Female-applicability multiplier kept (×1.0 / ×0.75),
with the explicit finding that the corpus reduces it to a two-level axis and that the
F5/F6 + external-validation work activates only when male-derived drugs enter via
cross-condition repurposing. No code changes resulted; this record is the gate artifact.
