# 02 — Design Brief

## The single sentence

Redesign WHEL so that a senior biomedical informatics researcher, browsing the site for the first time in 90 seconds, immediately classifies it as a serious research aggregator worth engaging with — not as a student project or a generic AI-built tool.

## What's wrong with the current design

The current site is functional but reads as "AI-generated indie project" rather than "research instrument." Specific tells:

1. **Generic Tailwind aesthetic.** Default-feeling utility-class spacing, soft shadows, rounded corners, a color palette (cream + dark sage) that's calm but undifferentiated from a thousand other Tailwind sites. Nothing about the visual hierarchy says "this is a database I should cite."

2. **Soft-launch typographic system.** Playfair Display + DM Sans + monospace is a competent choice, but the sizes, weights, line heights, and density are not yet tuned for a research audience that wants information density without clutter. Currently feels like a magazine article, not a research dashboard.

3. **Signal cards are the central unit and they're not yet right.** Each signal card shows a drug name, a confidence tier badge, a score, a brief rationale, and a source link. These cards are visually pleasant but hard to scan in volume — there's no clear primary information ("what is the signal saying"), secondary information ("what's the evidence"), tertiary information ("show me the citations"). A researcher scanning 50 signals on the endometriosis page should be able to size up the evidence landscape in 30 seconds. They currently can't.

4. **No data visualization.** A scoring framework with 5 dimensions, 4 confidence tiers, 4 evidence arms, and 6 conditions is begging for thoughtful summary visualization (per-condition tier distributions, per-arm signal density, score distribution histograms, evidence-strength scatter). Currently zero charts on the site beyond simple bar counts. This is a major missed opportunity for research credibility.

5. **Citations are buried.** Sources are linked but not formatted as proper citations (no author/year/journal/DOI/PMID surfaced inline). Researchers expect to see citation furniture; they currently have to click through to verify.

6. **Methods are scattered.** The methodology page is good content but it's only available as a series of accordion sections on a single web page. A researcher wants a downloadable PDF, a citable DOI, and ideally a "methods version history."

7. **The about page reads as personal narrative.** This is a strength for one audience (patients, advocates) but for a researcher first-impression, the absence of a clear authorship/affiliation/citation block on `/about` is a tell that this isn't a "real" research project.

8. **Homepage hero doesn't position for researchers.** The current hero is one line of marketing copy. A researcher wants to see immediately: what's the methods, where's the data, where's the code, who built this, what's the citation.

9. **No clear "for researchers" entry point.** Currently a researcher has to figure out by browsing whether this tool is for them. The redesign should have an explicit dispatch — patient/advocate flow vs. researcher flow — without compromising either.

10. **Information density is uniformly low.** Lots of whitespace, large headlines, soft visual elements. For a research audience, density (well-organized) signals seriousness; sparseness signals "marketing site." The redesign should significantly increase information per screen, especially on the homepage and condition detail pages.

## What success looks like

A senior researcher landing on the homepage:

- In 5 seconds: recognizes this as a research aggregator with a defined methodology.
- In 30 seconds: understands the four evidence arms, the scoring rubric, and the scope (6 conditions).
- In 90 seconds: has located the methods document, the GitHub repo, the data export, and the cite-as block — and decides whether it's worth investigating further.

A researcher landing on a condition detail page (e.g., `/conditions/endometriosis`):

- Sees a clear summary visualization of the evidence landscape (tier distribution × evidence arm).
- Can filter signals by tier, by arm, by signal type, by score range, by source date.
- Can sort signals by relevance, score, replication count, or recency.
- Sees each signal card as a compact, scannable, citation-rich unit.
- Can export the filtered signal set as CSV or BibTeX.

A patient or advocate, on the same site:

- Still feels welcomed; the calmer, story-aware character of the project isn't lost.
- But the calmness is now on a separate "About / Story" track, distinct from the research surface.

## Design principles to follow

1. **Density without clutter.** Researchers want information per pixel. Use deliberate whitespace, not soft consumer-app whitespace.
2. **Citation-forward.** Every claim has a visible source. Author, year, journal, DOI/PMID surfaced inline whenever possible.
3. **Data visualization as content.** Charts, distributions, and small multiples earn their place by communicating evidence structure faster than text can.
4. **Typography over decoration.** Strong typographic system carries the design. Iconography minimal and meaningful (no decorative icons).
5. **Two audiences, gracefully.** The site can serve both researchers and sophisticated patients without compromising either. Use information architecture and progressive disclosure, not separate sites.
6. **Honest about state.** The site should make it easy to see what's been validated, what's planned, what's draft. Versioning and changelog visible.
7. **Methods as a first-class artifact.** Methods documentation is not a tab — it's a downloadable, citable, version-pinned PDF.
8. **No false credentials.** The site should not look more institutional than it is. "Lab" framing is acceptable but should be paired with explicit "independent research project" language.

## Scope of the redesign

**Definitely in scope:**

- Homepage — hero, stats, evidence arms, conditions grid, methodology surface
- Condition detail pages — the most important real estate; each contains signal cards, tier visualization, evidence arm tabs
- Signal card component — central visual unit; needs to be redesigned from scratch
- About / methods pages — restructure, add author block, add citation block, add download links
- Navigation + footer — currently fine but should match new system
- Search page — currently functional; needs design love

**Probably in scope:**

- A new `/cite` or `/data` page for researcher-specific entry
- A small set of summary visualizations (per-condition tier distribution, per-arm signal density)
- A new evidence-arm landing page for each arm explaining methodology

**Probably out of scope:**

- Native mobile apps
- A fully accessible color system overhaul (do this later)
- Internationalization
- New backend features

## Specific design problems to solve

These are the components/screens that most need design attention, ranked by leverage:

1. **Signal card redesign** — the atomic unit; highest leverage.
2. **Condition detail page layout + tier-distribution visualization** — researchers spend most of their time here.
3. **Homepage hero + immediate stats strip** — first impression; sets perception.
4. **Methodology surface and the dispatch to the methods PDF** — the credibility moment.
5. **Author/affiliation + citation block on About** — closes the "is this real" gap.
6. **Cross-Condition Signals tab visual treatment** — the most novel evidence arm and currently the hardest to read.
7. **Community Forum Reports tab visual treatment** — the highest-stakes evidence arm because of the rigor concerns; the design must establish trust.

## Deliverables expected

- High-fidelity mockups of the 5 core screens (homepage, condition detail, signal card variants, methodology page, about page).
- A small design system: typography spec, color tokens, spacing scale, component library outline.
- Concrete recommendations for charts/visualizations that should exist (with sketches).
- Annotated rationale for each significant deviation from the current site.
- Optional: a Figma file or equivalent.
- Optional: ready-to-implement Tailwind class snippets for the new design system tokens.
