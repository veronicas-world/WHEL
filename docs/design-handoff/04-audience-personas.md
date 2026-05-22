# 04 — Audience Personas

The redesign serves three audiences in priority order. Trade-offs should resolve in favor of audience #1 unless explicitly noted.

## Primary: Senior biomedical informatics researcher

**Archetypal example:** Dr. Noémie Elhadad, Chair of Biomedical Informatics, Columbia DBMI; co-founder of Phendo / Citizen Endo.

**What she wants from WHEL in the first 2 minutes:**

1. To classify it: is this a serious research instrument or a student project?
2. To locate the methodology: is the scoring rubric explicit and defensible?
3. To find the data and code: can I download the signal table and the pipeline scripts?
4. To assess novelty: does this exist already, and if so, what's different here?
5. To find authorship: who built this and what's their position?

**What she'll scrutinize hardest:**

- The LLM-as-classifier choice and any validation data backing it
- The patient-reported data arm — selection bias, IRB framing, ethical handling
- The cross-condition signal interpretation (comorbidity vs. pharmacology confound)
- The relationship to Phendo and other adjacent prior work

**What turns her off in 30 seconds:**

- "Lab" branding without institutional backing or clear independent-research framing
- Methods scattered across web pages instead of available as a downloadable PDF
- Unsourced claims, missing citations, or a stats strip that looks marketing-y
- Soft consumer-product visual language (rounded cards, gradients, decorative icons)
- A site that doesn't look like it would survive an academic citation

**Design implications:**

- Citation furniture is non-optional. Author/year/journal/DOI/PMID surfaced everywhere.
- Methods PDF download has to be one click from the homepage.
- The `/about` page needs an author block with affiliations and a citable "cite as" form.
- Visual density (well-organized) is preferable to whitespace (un-targeted).
- Charts and visualizations earn credibility; decorative elements lose it.

## Secondary: Practicing clinician

**Archetypal example:** A women's-health-focused OB/GYN, reproductive endocrinologist, or psychiatrist looking up evidence for an off-label use a patient asked about.

**What she wants from WHEL in the first 2 minutes:**

1. To find the specific drug-condition pair she's interested in
2. To assess the evidence strength quickly
3. To click through to the underlying citations
4. To understand what's clinical evidence vs. patient-reported signal

**What she'll scrutinize:**

- FDA approval status and label indications
- Distinctions between RCT evidence and observational/FAERS data
- Whether community-reported signal is being conflated with clinical evidence

**What turns her off:**

- Anything that conflates Reddit signal with clinical evidence
- Missing FDA approval status or off-label disclosure
- Long methodology essays in the way of getting to the data
- Unclear evidence-strength language

**Design implications:**

- Search should be excellent. Drug name → condition → evidence card should be 2 clicks.
- FDA status should be visible on every signal card.
- The four evidence arms should be visually distinct enough that you can never confuse a Reddit-sourced signal with a peer-reviewed RCT signal.
- Quick links on every signal card to the underlying source.

## Tertiary: Sophisticated patient or patient advocate

**Archetypal example:** A patient with PMDD who has been on three SSRIs and wants to investigate whether anti-inflammatory or hormonal interventions have published evidence; or a patient advocacy organization compiling resources.

**What she wants from WHEL in the first 2 minutes:**

1. To find her condition
2. To see what existing drugs have any signal of benefit
3. To understand "evidence strength" in plain language
4. To know what to do with this information (talk to a clinician — clearly framed)

**What she'll scrutinize:**

- Whether the tool feels trustworthy or over-promising
- Whether the language is patronizing or respectful
- Whether the evidence framework is explained clearly without dumbing down

**What turns her off:**

- Anything that reads as medical advice
- Patronizing patient-facing language
- Hidden disclaimers or buried sourcing
- Marketing-product feel (suggests commercial agenda)

**Design implications:**

- The evidence framework should be explainable without jargon, but not dumbed down.
- "This is not medical advice" framing should be visible but not alarmist.
- Patient-facing language should respect her intelligence.
- The voice of the about page (warm, precise, honest) is appropriate for this audience and should be preserved as a navigation track.

## Trade-offs

When persona #1 (researcher) and persona #3 (patient) want different things, default to #1 — but route to #3 with progressive disclosure. For example: the homepage should immediately establish researcher credibility, but a "patient guide" path should be available as a secondary navigation track. The condition pages should default to research-grade presentation, but with patient-friendly explanations available behind clear toggles.

Persona #2 (clinician) almost never has goals that conflict with #1 or #3, so designing well for #1 + #3 will serve #2 by default — provided the search experience is fast and the FDA status is always visible.
