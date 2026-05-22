# 05 — Brand and Content Rules

## What's locked

These elements are core to the project's identity and should not be changed without explicit owner approval.

- **Project name:** "Women's Health Evidence Lab" (formal) and "WHEL" (acronym).
- **Founder narrative:** The post-prolactinoma origin story and the mother-as-co-author framing on `/about` are core character. Voice can be edited; the substance should not be removed.
- **Six conditions:** endometriosis, adenomyosis, PCOS, PMDD, vulvodynia, perimenopause/menopause.
- **Five evidence dimensions:** replication, source quality, specificity, biological plausibility, consistency of direction.
- **Four confidence tiers:** Strong (9–10), Moderate (7–8), Emerging (4–6), Exploratory (0–3).
- **Four evidence arms:** Direct Research, Cross-Condition Signals, Pathway Insights, Community Forum Reports.
- **Disclaimer:** "For research and educational purposes only" must remain visible somewhere persistent.
- **Color palette anchors:** cream/off-white background and a deeper green accent are part of the project's visual identity. The exact hex values are flexible; the family is not.

## What's flexible

- **Wordmark / logo.** Currently the site has none. A wordmark (e.g., a typographic treatment of "WHEL" or "rediscover") would be welcome. The URL is `rediscover-coral.vercel.app` — "rediscover" is a strong product wordmark and could be paired with "WHEL" as the formal name. Worth exploring.
- **Typography.** Currently Playfair Display (serif headers) + DM Sans (body) + monospace (labels). Changes are welcome if the new system reads more like research-grade publication and less like a magazine. Suggested register: serif for headings is fine; the body face should optimize for reading dense prose at small sizes.
- **Color depth.** The current sage green (#2E3B2E in footer, #4D5E4D as accent) and cream (#F5F3EF) work but feel undifferentiated. A more refined palette with semantic accents (e.g., distinct colors for each evidence arm, distinct intensity for tier strength) would help.
- **Layout grid.** Currently centered single-column with max-width ~1024px. A 12-column grid with multi-column zones for dashboards and dense data is welcome.
- **Iconography.** Currently almost none, which is correct for a research tool. Stay minimal. Any iconography added should be functional, monochrome, and meaningful.
- **Photography or illustration.** Currently none, which is correct. Stay text-and-data forward.

## Voice and language register

WHEL has two voice registers that should be preserved as distinct:

### Researcher voice (methodology, signal cards, technical pages)

- Declarative and precise.
- First-person plural ("we") for methodological choices.
- Explicit about uncertainty and limitations.
- Standard academic tone — neither chesty nor falsely humble.
- Citation-rich.
- Avoids marketing language ("revolutionary," "best-in-class," "AI-powered").

Example (good): *"WHEL applies a structured five-dimension scoring framework. Scoring is performed by Claude Opus 4.6 against the full source content. We acknowledge that this introduces dependencies (model versioning, prompt sensitivity, hallucination risk) discussed in §6."*

Example (avoid): *"Our cutting-edge AI-powered platform leverages advanced language models to revolutionize how we identify drug repurposing signals."*

### Founder voice (about pages, project narrative)

- Warm, personal, declarative.
- First-person singular when speaking from the founder's experience.
- Honest about constraints and motivations.
- Comfortable with real human detail.
- Should NOT bleed into methodology pages.

Example (good, currently on `/about`): *"WHEL began with a personal experience. A few years ago, I was diagnosed with a prolactinoma..."*

Example (avoid): *"At WHEL, we're passionate about empowering women through transformative health insights."*

## Specific copy that should change

### Homepage hero

Current hero: *"Addressing the data gap in under-researched female hormonal conditions"*

This is fine but doesn't establish that this is a research tool. Suggested replacement (researcher-voice, denser):

> **WHEL · Women's Health Evidence Lab**
>
> A drug repurposing signal database for under-researched women's hormonal conditions. Six conditions. Five sources. Multi-arm evidence scoring against a published five-dimension rubric. Independent research project; v0.1 (May 2026).
>
> [Browse conditions] [Read methods (PDF)] [View on GitHub]

The three CTAs above the fold do triple duty: patient onramp, researcher onramp, builder onramp.

### Stats strip

Current: 6 Conditions / 281 Scored signals / 5 Data sources / 2.2K Citations

This is good. Consider adding: "Last refreshed: May 2026" with a tooltip explaining cadence.

### Tier descriptions

Current descriptions are fine. Two suggested refinements:

- **Strong (9–10):** Replace "Highly replicated, well-characterized signals" with "Independently replicated across multiple evidence types, with consistent direction and well-characterized mechanism. Supported by peer-reviewed clinical evidence."
- **Exploratory (0–3):** Replace "Single-source, mechanistic, or low-specificity signals" with "Single-source, mechanistic-only, or low-specificity signals. Hypothesis-generating; not interpretable as evidence of effect."

### Evidence arm descriptions

The current short arm descriptions on the homepage do not convey methodological rigor. The redesign should expand each into a 1–2 sentence description that includes (a) source, (b) inclusion bar, (c) interpretation framing.

Example for Cross-Condition Signals:

> **Cross-Condition Signals** — FDA FAERS reports plus literature triangulation. Inclusion requires corroboration across two independent evidence domains and a documented shared biological mechanism. Hypothesis-generating; not causal.

## Disclaimer language

The current footer says *"For research and educational purposes only."* This is correct but minimal. Add to the homepage and condition pages a small persistent disclaimer:

> WHEL is a hypothesis-generation tool, not a clinical recommendation engine. Nothing on this site is medical advice. Discuss any treatment decisions with a qualified clinician.

## Specific terms to use, not use, and standardize

| Use | Don't use |
|---|---|
| signal | "lead," "candidate," "hit" (too pharma-startup) |
| evidence arm | "category," "section" |
| confidence tier | "rating," "grade" |
| signal database | "platform" (too SaaS-y) |
| methods document | "white paper" |
| under-researched / under-studied | "neglected" (loaded term) |
| women's hormonal conditions | "women's health issues" |
| repurposing / repositioning | "secondary use" |
| drug | "compound" only when generic / "drug" otherwise |
| Strong / Moderate / Emerging / Exploratory | use exactly these labels and casing |

## Citation block (to be added to /about)

Add a citation block on the `/about` page. Recommended form:

> **Cite this resource as:**
> Agudelo V & [co-author], 2026. *WHEL: Women's Health Evidence Lab — A Multi-Source Drug Repurposing Signal Database for Under-Researched Women's Hormonal Conditions, v0.1 (May 2026).* https://rediscover-coral.vercel.app · DOI: [pending Zenodo deposit]

A "Copy citation" button next to it would be welcome.
