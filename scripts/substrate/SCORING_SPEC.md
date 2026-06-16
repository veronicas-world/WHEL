# Whel substrate scoring model — v1.3 spec (arm-aware)

*v1.2 adds thread-structure handling to the community arm (§2): the unit is the distinct
account, confirming replies are discounted for independence, disagreeing replies feed
consistency and surface as patient-reported contradictions (§4), and manipulation signals
cap the score.*

*v1.3 (after the first PMDD validation pass): a single systematic review caps at
corroboration 1 (§2 direct), and an `on_topic` guard suppresses signals whose claims don't
actually concern the pair, or whose intervention can't be resolved (§7).*


*Status: DRAFT for review. Nothing in this file runs a model; it is the blueprint the
migration (`050_substrate_signals.sql`) and the scoring step (`score_claims.py`)
implement. Once approved, it is the single source of truth for how a verified set of
claims becomes a scored signal.*

**What changed from v1 (and why).** v1 ran every kind of evidence through one identical
five-dimension rubric. That is methodologically wrong: a randomized trial and a patient
forum thread cannot be judged with the same ruler, and under v1 a strongly-corroborated
patient pattern would floor at zero and look like noise. The established discipline
(GRADE for trials, GRADE-CERQual for patient-reported/qualitative evidence, Cochrane
mixed-methods) is to **score each kind of evidence on criteria appropriate to it, then
integrate the streams without averaging them.** Whel already has the right structure for
this — the four **evidence arms** — so v1.1 makes scoring *arm-aware*.

This layer sits on top of the substrate. The substrate (046–047, `scripts/substrate/`)
turns sources into **atomic claims, each pinned to a verbatim quote and independently
verified**. This scoring model reads *only verified claims* and produces the number and
words a clinician sees. Because it never sees anything but verified claims, it cannot
invent evidence or blend papers the way a free-text summary can.

---

## 1. The shape of it, in one line

Each arm is scored on its **own** five dimensions (0–2 each → an arm strength of 0–10),
then discounted by the female-applicability multiplier. The pair's headline is then built
by **anchoring on the strongest evidence and reporting the other arms beside it — never
averaging across arms.**

```
per arm:   arm_strength (0–10)  ×  female_applicability_multiplier (0.50–1.00)  =  arm_score
per pair:  headline = anchor arm's score, with the other arms shown as separate
           corroborating strengths, plus a validation_status stamp (§6)
```

Two principles carry through from v1, unchanged:

- **Female applicability can only discount, never inflate** (ceiling ×1.00). Full credit
  is earned by evidence generated *in women*; everything else is honestly marked down.
- **We surface disagreement, we do not average it.** Contradictions stay first-class.

---

## 2. The three evidence arms and their dimensions

There are **three evidence arms — `direct`, `pathway`, `community`** — all verbatim-provenance
and observed. (Cross-condition is *not* an evidence arm; it is a derived-hypotheses lens
described in `ARMS_SPEC §4`, scored separately as a prediction, never on these dimensions.)

Every arm keeps a five-slot skeleton so the math and the UI stay uniform, but **what each
slot measures is tuned to the arm**. The five generalized slots are: **corroboration,
rigor, specificity, plausibility, consistency**. The table below is what each slot means
per arm. Every score still carries a 2–3 sentence rationale citing the claims behind it.

### Arm `direct` — Direct Research (clinical trials, observational studies, reviews)

| Slot | Means here | 0 | 1 | 2 |
|---|---|---|---|---|
| **corroboration** | independent corroboration | single primary study | a single systematic review / meta-analysis, **or** two independent studies | three+ independent and consistent, **or** one large well-powered RCT (low bias) |
| **rigor** | study design / risk of bias | case report / preclinical | observational / small trial | RCT, meta-analysis, or active guideline |
| **specificity** | this drug, this condition | proxy only | drug named, condition adjacent | both named directly |
| **plausibility** | mechanism | asserted | plausible | evidenced in relevant biology |
| **consistency** | do results agree in direction | conflicting | mostly one way | unanimous (n/a for a single study → scored neutral, not penalized) |

> **Revised from v1 per the research:** corroboration is about *independent validation*,
> kept distinct from rigor (study design) and consistency (agreement) so we don't score the
> same fact twice. A **single source caps at corroboration 1** — a lone systematic review or
> meta-analysis is *one synthesis*, not independent replication, so the trials pooled inside
> it are **not** counted as separate sources. The top score (2) is reserved for three+
> genuinely independent, consistent studies, or one large, well-powered, low-bias pivotal
> RCT where design and size substitute for replication. (Refinement after the first PMDD
> validation, where a single review was over-credited to corroboration 2.)

### Arm `pathway` — Pathway Insights (mechanistic, target, preclinical, side-effect)

| Slot | Means here |
|---|---|
| **corroboration** | how many independent mechanistic lines converge (target data, preclinical, side-effect) |
| **rigor** | strength/recency of the models (human-relevant vs. in-vitro only) |
| **specificity** | specificity of the drug's action on the named target |
| **plausibility** | target–phenotype fit: does hitting this target plausibly move this condition |
| **consistency** | do the mechanistic signals point the same way |

### Arm `community` — Community Forum Reports (patient-reported, online)

Scored on patient-report-appropriate criteria (the GRADE-CERQual idea), **never** on trial
design — so a real corroborated pattern reads as a *signal worth investigating*, not zero.

| Slot | Means here | 0 | 1 | 2 |
|---|---|---|---|---|
| **corroboration** | independence (weighted, see below) | single account / signs of coordination | a few independent accounts | many *independent* accounts across threads/communities/time |
| **rigor** | specificity of the report | vague ("felt bad") | symptom clear, timing/dose fuzzy | clear symptom + dose + timing |
| **specificity** | this drug, this outcome | drug or outcome vague | one clear | both clear and linked |
| **plausibility** | fits the drug's pharmacology | unexplained by mechanism | loosely consistent | directly fits known pharmacology |
| **consistency** | do reports agree (confirm vs. deny) | denials outweigh confirms | mixed | confirms dominate **and** dose/timing coheres across reports |

A community signal that scores high is labelled **"strong patient-reported signal"** — it
asserts that a credible, specific, mechanistically-plausible pattern is being independently
reported. It never asserts proven efficacy.

**Threads: the unit is the distinct account, not the post.** A Reddit thread is one
document; the original post and each reply are separate spans, each its own claim with its
own quote and *its own author*. How replies count:

- **Confirming replies count, but discounted for independence.** A reply written after
  reading the original post is anchored by it (response/anchoring bias; "me too" pile-ons),
  so it is *not* worth a fresh independent observation. Independence is tiered, highest to
  lowest: a separate post by a different account in a different community/time → a reply in
  a *different* thread → a same-thread reply. Same-thread confirmations are weighted at a
  fraction of an independent post (starting dial ≈ 0.3; **to be calibrated empirically** —
  no published number exists for medical forums). Only **independent** accounts push
  `corroboration` toward 2; a single thread of agreement, however long, cannot.
- **The same account replying in its own thread is not new corroboration.**
- **Disagreeing replies are signal, not noise — and do two jobs.** A substantive denial
  ("took it 3 weeks, no change") lowers `consistency` (we track the independence-weighted
  ratio of confirms to denials), **and**, when real and specific, registers as a
  community-level **contradiction** (§4) so the disagreement is shown, not averaged. Patient
  non-response is genuine treatment-effect heterogeneity, not error; negative reports are
  never hidden.
- **Manipulation caps independence.** Timing bursts, brand-new / low-karma accounts,
  near-duplicate phrasing, and lopsided voting cap the `corroboration` score (astroturfing
  a women's-health forum is a real risk). High upvotes are **not** a credibility signal —
  they track readability, not truth — and never inflate a score.
- **Model proposes, human spot-checks.** Stance ("is this reply agreeing or disagreeing?")
  is classified by the model as a *signal only*; automated stance detection is unreliable
  and biased on its own. The highest-disagreement pairs are flagged for a human glance
  before they surface.

> **Implemented (`score_claims.community_independence`):** for the community arm,
> `corroboration` is computed **deterministically in Python from thread metadata**, NOT by
> the model (which can't see author/thread/timing). Distinct independent accounts across
> distinct threads set the score (single account → 0; 2–4 → 1; 5+ across ≥2 threads → 2;
> 5+ in one thread is anchored → capped at 1); near-duplicate wording across accounts and
> sub-hour posting bursts cap it further. Account age/karma (which need extra per-author API
> calls) are a documented future add. The model still scores the other four community
> dimensions from the text.

### Imprecision (folded in, mainly affects `direct`)

LLMs are unreliable at judging statistical precision and abstracts often omit the numbers.
So imprecision is handled by **hard rules on extracted numbers, not model judgment**, and
it caps dimensions rather than adding one:

- Very small sample (rule of thumb: N < 30 per arm, or < 300 total events for a binary
  outcome) → `corroboration` and `rigor` cannot exceed 1 for that source; reason written
  into the rationale.
- Effect + p-value but **no N and no CI** → precision is *unknown*, not *good*; the scorer
  must not infer a CI; `needs_fulltext = true` and the rationale says so.
- `precision_note` records what was and wasn't available, so the judgment is auditable.

---

## 3. Female applicability — the bounded multiplier (per arm)

Applied to each arm's strength, judged on whether *that arm's* evidence is in/about women.
(For women's-health community forums the population is inherently female → usually F1; for
a male-derived clinical trial → F5. So the same drug–condition pair can carry a different
multiplier in different arms, which is correct.)

| Band | What the evidence shows | Multiplier |
|---|---|---|
| **F1 — Female-generated** | female-specific condition, or studied in women / ≥80% female | **1.00** |
| **F2 — Represented & equivalent** | ≥50% female **and** sex-stratified analysis found no meaningful difference | **1.00** |
| **F3 — Represented, not analyzed** | ≥50% female but results not broken out by sex | **0.90** |
| **F4 — Underrepresented / extrapolated** | < 50% female, or mixed with no sex analysis; uncertain | **0.75** |
| **F5 — Male-derived / female-excluded** | < 30% female, male-only, or women excluded, applied to a female context | **0.60** |
| **F6 — Evidence of a sex-dependent disadvantage** | verified evidence the drug behaves differently/worse in women | **0.50** + ⚠ flag |

Two guardrails, unchanged from v1: **it discounts, it never excludes** (floor ×0.50, so a
male-derived drug still surfaces, marked and labelled, never buried); and **absence ≠
inferiority** (F4/F5 mean "not yet shown in women," only F6 means a known disadvantage —
and the UI must say it that way). The existing sex-PK / cycle-phase layer becomes the
detailed view *behind* this band.

---

## 4. Contradictions — strict but prominent

(Decision already made.) The substrate's `contradictions` table flags only **genuine
head-to-head disagreement** on the same drug–condition pair. When present for a pair:
`contradiction_flag = true`, `num_contradictions = N`, a `!` marker on the card, and a full
**"Where the evidence disagrees"** section on the detail page with both verbatim quotes
intact. A flagged pair cannot score `consistency = 2` in the affected arm. Contradictions
do not by themselves trigger the female-applicability multiplier.

Disagreement is surfaced at **two levels**, and the UI labels which: a *clinical*
contradiction (two studies disagree) reads differently from a *patient-reported* one
(patients in the `community` arm disagree — e.g. the original poster reports benefit but
substantive replies report none). Both keep both sides intact; neither is averaged. A
patient-reported contradiction is presented as heterogeneity of experience
("patients report varied outcomes"), never as a refutation of clinical evidence.

---

## 5. Tiers (recalibrated on the arm score, 0–10)

| Tier | Arm score |
|---|---|
| **Strong** | ≥ 8.0 |
| **Moderate** | 6.0 – 7.9 |
| **Emerging** | 3.5 – 5.9 |
| **Exploratory** | < 3.5 |

A starting point; recalibrated **once** against the real distribution and hand-judged
anchor pairs after the first scoring pass, before cutover (§7).

---

## 6. Integration — anchor-and-corroborate, with Whel's surface-unvalidated rule

A drug–condition pair may have signals in several arms. We **never average across arms.**
Instead, per pair (computed in `lib/candidates.ts` from the per-arm rows):

1. **If the `direct` arm is present and non-trivial**, it **anchors** the headline. The
   other arms render beside it as separate corroborating strengths (the way MATRIX and
   Open Targets already do — reported, not blended). `validation_status = clinical`.

2. **If `direct` is thin or absent but other arms converge** (the common case for the
   under-studied female conditions Whel exists to serve), the pair **still surfaces**,
   headlined by the strongest available arm, and **stamped `validation_status =
   unvalidated_signal`** with plain-language framing: *"Hypothesis / patient-reported
   signal — not clinically validated."* This is Whel's deliberate departure from the
   textbook anchor-only rule, and it is core premise: thin direct research is the gap we
   fill, so mechanistic and community convergence is a *valid starting point*, never
   dressed up as proven.

3. **If only one weak arm is present**, it surfaces low in the ranking,
   `validation_status = preliminary`.

`validation_status` is the honesty stamp the UI keys off of. It is derived at read time
from which arms exist for the pair and their scores; the per-arm rows in
`substrate_signals` are the storage unit.

> Note on growing the `direct` base: the abstract-wide fetch across all six conditions
> (the cheap breadth pass) is what thickens the clinical arm over time. The
> surface-unvalidated rule keeps the platform from going dark on thin-evidence pairs in
> the meantime; it is not a permanent substitute for clinical evidence.

---

## 7. What a scored signal carries (feeds the frontend)

Per (intervention, condition, aspect, **arm**):

- `arm` (`direct` | `pathway` | `community` — the three evidence arms)
- Five dimension scores (0–2) **+ five rationale strings** (slots interpreted per §2)
- `arm_strength` (0–10, the pre-multiplier sum)
- `female_applicability_band` (F1–F6), `female_applicability_multiplier` (0.50–1.00),
  `female_applicability_rationale`
- `arm_score` (0–10, strength × multiplier) and `confidence_tier`
- `contradiction_flag`, `num_contradictions`
- `precision_note`, `needs_fulltext`
- `source_tier` ('abstract' | 'fulltext')
- `synthesis_summary`, `mechanism_hypothesis`
- Audit: `model_name`, `prompt_hash`, `claim_ids[]`

Derived per pair at read time: the anchor arm, the corroborating arms, and
`validation_status` (`clinical` | `unvalidated_signal` | `preliminary`). The MATRIX
percentile, Open Targets graph, literature grade, and sex-PK / cycle-phase layers stay
**separate and unblended**, reported beside the score as they are today.

**Off-topic guard.** The scorer also judges `on_topic`: whether the verified claims actually
concern *this* intervention acting on *this* condition. A claim that turns out to be about a
different condition or drug, or whose intervention can't be resolved, is stored with
`status = 'off_topic'` and an `off_topic_reason`, and is **excluded from active surfacing**
(kept for audit, never shown as a signal). A deterministic backstop also suppresses any pair
whose intervention label is unresolved. This catches extraction leakage — e.g. an
"anxiety in older women" claim mistakenly attached to a premenstrual pair — without letting
it masquerade as weak evidence. (Added after the first PMDD validation surfaced three such
mis-attached claims, all of which the scorer itself had flagged in its rationales.)

---

## 8. Reliability guardrails (from the research)

1. **LLM extracts, rules decide.** The model extracts facts it is good at (% female, N,
   study design, direction, report counts — 80–90% accurate). Deterministic rules turn
   those into the precision caps and the female-applicability band wherever a rule can.
2. **Missing data is flagged, not guessed.** Anything the abstract can't answer sets
   `needs_fulltext` rather than getting a confident default.
3. **Validate before cutover (a recorded gate — see §9).** Nothing flips the feature
   flag until the calibration and validation in §9 has run and been reviewed.
4. **Label honestly in the UI.** `unvalidated_signal` reads as "not clinically validated";
   F4/F5 read as "applicability to women not yet established"; only F6 reads as a known
   disadvantage. The score adjusts *confidence*; it never reverses a safety conclusion.

---

## 9. Calibration & validation (a planned gate, runs after the first scoring pass, before cutover)

The numeric thresholds in this spec are **deliberately provisional**. They are set on
reason, not yet on data, and several can only be settled once real scores exist. This
section is the recorded commitment to settle them; the feature flag does not flip until it
has run and been reviewed (§8.3).

### 10a. Tier cutoffs — recalibrate once against the real distribution

The §5 cutoffs (Strong ≥ 8.0, Moderate 6.0–7.9, Emerging 3.5–5.9, Exploratory < 3.5) are a
starting point only. The female-applicability multiplier pushes many pairs downward (a
male-derived 9 lands at 5.4 at ×0.60), so the legacy 0–10 intuition will not carry over.
**Step:** after the first scoring pass, plot where `arm_score` actually clusters, place the
four cutoffs against that distribution plus ~10 hand-judged anchor pairs, then freeze them.
Done once; not re-tuned per run.

### 10b. Female-applicability bands — validate the *separation*, not just the definitions

The bands F1–F6 are well-defined in principle, but whether the multiplier *values*
(×0.60 male-derived, ×0.75 underrepresented, ×0.90 represented-but-unanalyzed) produce
meaningful separation in practice is an empirical question. Two reference checks:

- **Janusmed.** Do our low-applicability bands flag the drugs Region Stockholm's Janusmed
  already classifies as having clinically relevant sex differences (its "C!" / "C" lists)?
  Misses mean the bands are too lenient.
- **Sex-stratified FAERS.** Do low-applicability pairs line up with adverse-event signals
  that are elevated in women in sex-stratified FAERS analysis? Convergence is evidence the
  discount is tracking something real.

If the separation comes out muddy, we **adjust the multiplier values, not the band
definitions** (the bands are the concept; the numbers are the dial).

### 10c. The other dials flagged in-spec

- **Community independence discount** (§2): the ≈0.3 weight on same-thread confirmations is
  a starting dial with no published medical-forum benchmark — calibrate on real threads.
- **Imprecision thresholds** (§2): the N < 30 / < 300-events rules are generic GRADE
  heuristics; sanity-check they behave on our conditions.
- **Community rubric**: spot-check against known astroturf vs. genuine signal before trust.

### 10d. What "reviewed" means

A short written calibration record (the distribution, the chosen cutoffs, the Janusmed and
FAERS check results, any multiplier adjustments) is produced and looked at by a human
before cutover. It is not a pass/fail script; it is a judgment gate with the evidence laid
out.

---

## 10. Sources

- GRADE-CERQual — appraising qualitative / patient-reported evidence on its own criteria
  (Lewin et al., PLOS Medicine, 2015).
- Cochrane Handbook ch. 8 — mixed methods: assess each evidence type appropriately,
  integrate rather than average.
- Social-media pharmacovigilance / patient-reported evidence (WEB-RADR; JAMIA reviews).
- A single large RCT may outweigh a meta-analysis of small trials (21st-century evidence).
- Oxford CEBM Levels of Evidence — study design over count.
- GRADE inconsistency / imprecision / indirectness guidance (guidelines 6, 7).
- FDA 2025 sex-differences guidance; SAGER guidelines; zolpidem precedent; Janusmed.
