# Actionability Layer — Scope (field-grounded)

*A second axis beside the evidence score. Descriptive and graded, never advice. Two separate readouts — clinical actionability + development tractability — because they routinely point in opposite directions. Every naming, factor, and threshold choice below traces to an established framework (ClinGen, Open Targets, PharmGKB, PandaOmics, the 505(b)(2) IP literature, Every Cure/Pushpakom).*

---

## What it is (and isn't)

The evidence score answers **"how strong is the case that this drug helps this condition?"** The Actionability layer answers what the evidence score can't: **"given the case exists, how *reachable* is this — for a patient now, and for a developer pursuing formal approval?"**

It is a **structured, rule-based, provenance-linked readout** shown *beside* the evidence score and **never folded into it** — the discipline the MATRIX, sex-PK, and regulatory-status layers already follow. It is explicitly **not** clinical advice, **not** an investment/viability recommendation, **not** a claim that a candidate *should* be prescribed or developed. It maps factors; the clinician or developer judges. This keeps it inside the §3060 research-support framing.

## Grounded in the field

| Whel element | Borrowed from | What we take |
|---|---|---|
| Axis A name + tiers | **ClinGen / ACMG Clinical Actionability** | the term "actionability"; tiers **Limited / Moderate / Strong**; the "score each factor 0–3, sum, bucket" rubric |
| Axis B name + ladder | **Open Targets Tractability** | the term "tractability"; ordinal ladder **Clinical Precedence → Discovery Precedence → Predicted**; phase-weighting (approved 1.0 / Ph2–3 0.7 / Ph1 0.2) |
| Prescribability factor | **PharmGKB Levels of Evidence** | ordinal anchored to endorsement strength (guideline-backed = highest), incl. an explicit "off-label but guideline-backed" tier |
| Commercial-incentive factor | **PandaOmics "commercial tractability"** + **505(b)(2) IP literature** | the name; the exclusivity ladder (compound patent → method-of-use + 3-yr new-indication exclusivity → generic funding gap) |
| Safety/tolerability factor | **ClinGen "burden of intervention"** + repurposing de-risk premise (**Pushpakom 2019**) | acceptability / risk-to-the-individual as a scored actionability element |
| Presentation | **Open Targets + ClinGen + PandaOmics** | named tier chip + per-factor 0–3 sub-scores + expandable per-factor provenance |

This also matches Whel's *own* internal pattern — the evidence score is already five 0–2 dimensions rolled into a tier, so an actionability readout of 0–3 factors rolled into a named tier is consistent house style.

## Two axes, kept separate

### Axis A — Clinical Actionability · "reachable for a patient now"
Tiers **Limited / Moderate / Strong** (ClinGen). Each factor 0–3; sum → tier. Read alongside (not merged with) the evidence tier.

| Factor | 0–3 rule (anchored) | Source (already stored) |
|---|---|---|
| Regulatory prescribability *(PharmGKB ladder)* | 3 = on-label FDA indication · 2 = off-label, guideline-backed · 1 = off-label, evidence-only · 0 = no usable FDA label | DailyMed `label_relationship` (+ guideline check) |
| Access & affordability *(Orange Book)* | 3 = generic, multi-source · 2 = generic, limited-source · 1 = branded/patented but marketed · 0 = not marketed | Orange Book `supply` / `generic_available` |
| Safety & tolerability *(ClinGen "burden of intervention")* | 3 = long, well-tolerated track record, no notable signals · 2 = generally tolerated, manageable cautions · 1 = notable tolerability concerns · 0 = serious safety signal / contraindicated in the population | stored safety arms + sex-PK |

*Safety also underpins Axis B's de-risking baseline (repurposing's "established human safety record" premise, Pushpakom 2019) — but it is scored once, here in Axis A, and only noted qualitatively in Axis B to avoid double-counting.*

### Axis B — Development Tractability · "a real 505(b)(2) path"
Ladder **Clinical Precedence → Discovery Precedence → Predicted** (Open Targets), refined by two 0–3 factors.

| Factor | Rule (anchored) | Source (already stored) |
|---|---|---|
| Clinical de-risking *(Open Targets phase weights)* | Clinical Precedence if any Phase 2–4 trial for the pair (approved 1.0 / Ph2–3 0.7 / Ph1 0.2); Discovery if mechanistic/preclinical only; Predicted if computational only | ClinicalTrials.gov `highest_phase`, `trial_count`, `activity` |
| Indication headroom *(505(b)(2) new-indication precedent)* | 3 = off-label / unapproved (clear new-indication path) · 0 = already on-label (no headroom) | DailyMed `label_relationship` |
| Commercial tractability *(505(b)(2) IP ladder)* | 3 = active compound-patent runway · 2 = new method-of-use patent + 3-yr new-indication exclusivity achievable · 0 = generic, no new-use IP (funding gap) | Orange Book `supply`, `latest_patent_expiry` |

### Whel's genuine contribution
The **same "generic" fact is a positive for Axis A (affordable, reachable now) and a negative for Axis B (no exclusivity, the funding gap).** The field documents this tension (the "generic cliff" / repurposing funding gap) but **no single framework encodes both directions at once** — keeping the axes separate is what lets Whel formalize it. This is the design's original bit, and it's exactly why the two-axis decision was the right one.

## Field-standard factor deferred to Phase 2

The research flagged one more first-order factor we're intentionally holding:

**Unmet need / patient impact.** Central to Every Cure (a dedicated "patient impact score") and Pushpakom 2019. For an *under-served women's-health* tool this is deeply on-mission — arguably a first-class third readout, not an afterthought. It **needs new curated data** (prevalence, treatment-gap, guideline-coverage per condition/pair), so it's **Phase 2** by decision (June 2026). *(Safety/tolerability, the other flagged factor, is now a Phase-1 Axis-A factor — see above.)*

## Presentation (structured-first)

- **Per-candidate:** an "Actionability" panel beside the score — each axis as a **named tier chip** + its **0–3 factor breakdown** + **expandable per-factor source links** + the standing "descriptive landscape context, not clinical or investment advice" note. (Open Targets / ClinGen / PandaOmics presentation pattern.)
- **Candidates explorer:** two optional sort/filter axes, so a user can isolate "strong evidence × Strong clinical actionability" (help-patients-now) or "strong evidence × Clinical-Precedence tractability" (fundable). Full 2×2 quadrant view: optional, Phase 2.
- **Never** blended into the composite evidence score.

## Phasing

- **Phase 1 (buildable now, no blockers):** Axes A + B from existing regulatory data + an explicit **safety/tolerability** signal from stored safety arms → per-candidate panel + two explorer sort/filters.
- **Phase 2:** **unmet-need / patient-impact** readout (needs curated per-condition data); management-endpoint fit; the 2×2 quadrant view.
- **Phase 3:** patient-community / real-world-use signal into Axis A — deferred until the Reddit community arm unblocks.

## Guardrails (non-negotiable)

1. Separate axis; never folded into the evidence score.
2. Descriptive framing — "where this sits," never "we recommend."
3. Rule-based and documented (every threshold written down and cited), not ML — auditable like the rest of Whel.
4. Standing not-advice disclaimer on the panel.

## Resolved decisions (were open)

1. **Names** → **Axis A = "Clinical Actionability"** (ClinGen), **Axis B = "Development Tractability"** (Open Targets/PandaOmics). Tier labels: A = Limited/Moderate/Strong; B = Clinical Precedence/Discovery Precedence/Predicted.
2. **Thresholds** → the 0–3 rubrics above, each anchored to a cited precedent.
3. **On-label handling** → self-resolves: on-label scores *high* on Clinical Actionability (prescribable now, standard-of-care) but *zero* on Development Tractability (no indication headroom). The two axes separate exactly the case that worried us — no manual de-emphasis needed.
4. **Quadrant view** → defer the full 2×2 to Phase 2; ship the two sort/filter axes in Phase 1.

## Decisions locked (June 2026)

- **Unmet need / patient impact** → **Phase 2** (needs new curated per-condition data).
- **Safety / tolerability** → **Phase 1**, as a third Axis-A (Clinical Actionability) factor, anchored to ClinGen "burden of intervention," from stored safety-arm + sex-PK data.
- **Axis A = "Clinical Actionability"** (Limited/Moderate/Strong); **Axis B = "Development Tractability"** (Clinical Precedence/Discovery Precedence/Predicted).
- On-label handling self-resolves across the two axes; full 2×2 quadrant view deferred to Phase 2.

---

## This document is the running design record

This scope is the **canonical, evolving record** of the Actionability layer's design — every decision, threshold, and framework citation captured as we build. It is the **source of truth for the eventual public write-up**: when the layer ships we'll surface it on the site the same way we did the regulatory layer — a methodology-changelog entry, a technical-architecture section (grounded in these frameworks), an external-references note, and the panel's own on-page explanation. Keep this file updated as thresholds are finalized so the public copy can be written straight from it.

### Framework citations to reuse in the public copy
- ClinGen / ACMG Clinical Actionability (term "actionability"; Limited/Moderate/Strong tiers; 0–3-per-factor rubric; "burden of intervention")
- Open Targets Target Tractability (term "tractability"; Clinical Precedence → Discovery Precedence → Predicted ladder; phase weighting)
- PharmGKB Levels of Evidence (guideline-endorsement prescribability ladder)
- PandaOmics "commercial tractability"; Pushpakom et al., *Nat Rev Drug Discov* 2019 (repurposing de-risk + IP framing); 505(b)(2) IP / method-of-use exclusivity literature; Every Cure patient-impact criterion (for Phase-2 unmet-need)
