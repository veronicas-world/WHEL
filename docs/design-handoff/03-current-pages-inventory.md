# 03 — Current Pages Inventory

A page-by-page map of the live site as of May 2026. URL paths are relative to `https://rediscover-coral.vercel.app`.

## Public-facing pages

### `/` — Homepage
**Purpose:** First impression; orient new visitors; route patients vs. researchers.
**Current contents (top to bottom):**
- Hero: "Addressing the data gap in under-researched female hormonal conditions" + tagline
- Stats strip: 6 Conditions / 281 Scored signals / 5 Data sources / 2.2K Citations
- Evidence Confidence Framework: 4 tier cards (Strong, Moderate, Emerging, Exploratory) with score ranges and brief descriptions
- Conditions grid: 6 cards, one per condition, each with signal counts and a stacked-bar tier distribution
- Evidence Source Categories: 4 cards (Direct Research, Cross-Condition Signals, Pathway Insights, Community Forum Reports) listing source types

**Design status:** Functional. Hero copy is one line and doesn't establish methodological credibility. Stats strip is good. Tier framework cards are too horizontal — wastes vertical space. Conditions grid is fine but signal counts feel decorative. Evidence source cards are similar to the tier cards and there's no visual differentiation between the two systems.

### `/conditions` — Conditions index
**Purpose:** Browse all six conditions.
**Current contents:** Listing of the six conditions with names, brief descriptions, and signal counts.
**Design status:** Functional but plain. Could become a small dashboard.

### `/conditions/[slug]` — Condition detail (×6: endometriosis, adenomyosis, pcos, pmdd, vulvodynia, perimenopause-menopause)
**Purpose:** The core research view per condition.
**Current contents:**
- Header: condition name, definition, prevalence
- Three info blocks: Prevalence / Treatment Gap / Biology
- Research & Funding Context section
- "Repurposing Signals" tabbed section with four tabs: Direct Research, Cross-Condition Signals, Pathway Insights, Community Forum Reports
- Within each tab: signals grouped by tier (Strong / Moderate / Emerging / Exploratory)
- Each signal rendered as a card with drug name, tier badge, FDA status, score, mechanism note, source link

**Design status:** This is the most-used surface and has the most leverage. Currently the cards are visually pleasant but hard to scan in volume; there's no summary visualization of the evidence landscape; sources are linked but not formatted as proper citations; filter/sort affordances are minimal.

### `/signal-types` — Signal type taxonomy
**Purpose:** Explain the signal type categories (clinical_trial_finding, community_report, cross_condition_signal, etc.).
**Current contents:** Accordion-style explainer for each signal type.
**Design status:** Functional but feels detached from the rest of the IA. Probably should fold into the methodology surface.

### `/search` — Search
**Purpose:** Free-text search across signals.
**Current contents:** Search input + results list.
**Design status:** Currently lightweight. Could grow into a filtered-signals dashboard with facets (condition × tier × arm × signal type × source date).

### `/about` — Project mission / story
**Purpose:** Founder narrative; why the project exists.
**Current contents:** Five sections: How This Started / Why Women's Hormonal Health / Why Drug Repurposing / What WHEL Does / Our Goal. Personal voice; written by the project owner. Mentions co-author (mother, psychiatrist) and project provenance (post-prolactinoma surgery).

**Design status:** This is a strength of the project as currently written. Voice should be preserved. What's MISSING: a clear authorship/affiliation block, a "cite as" block, a methods download link, and a license statement.

### `/about/technical-architecture` — Methodology
**Purpose:** Methods documentation.
**Current contents:** Accordion with four sections: Data Pipelines / Inclusion Criteria and Evidence Scoring / Database and Infrastructure / Limitations. Substantive content, including the 5-dimension scoring rubric and category-specific minimum standards.

**Design status:** Content is strong. Format is wrong — accordion of website sections doesn't work for a researcher who wants to read methods linearly. This page should keep its content but also generate a downloadable PDF (`methods.pdf`) and a citation block.

### `/about/contact` — Contact
**Purpose:** Email + project background link.
**Current contents:** Email (vla2117@columbia.edu) + link to the project owner's Substack writeup.
**Design status:** Functional. Could be richer — author bios, FAQ, "for collaborators" callout.

### `/about/community-reports` — Community arm methodology
**Purpose:** Detailed explanation of the Reddit / patient-reported signal arm.
**Current contents:** Methodology section specific to this arm.
**Design status:** Important page given the rigor concerns around patient-reported data.

### `/about/cross-condition` — Cross-condition arm methodology
**Purpose:** Methodology for the cross-condition signals arm.
**Current contents:** Methodology specific to this arm.
**Design status:** Functional but should integrate with the methods PDF.

### `/about/direct-research` — Direct research arm methodology
**Purpose:** Methodology for the direct research arm.
**Design status:** Same — should integrate.

### `/about/pathways` — Pathway arm methodology
**Purpose:** Methodology for the pathway insights arm.
**Design status:** Same — should integrate.

## Site furniture

### Navigation
**Current contents:** Top nav with conditions, search, signal types, about. Mobile hamburger.
**Design status:** Functional. Will need to evolve with new IA.

### Footer
**Current contents:** Three columns — Brand / Explore (Browse Conditions, Search, Signal Types) / About (Mission, Technical Architecture, Contact) — plus a bottom strip with copyright (auto-year), database last-updated, and "for research and educational purposes only" disclaimer.
**Design status:** Functional. Should add a "Cite this resource" link, a license link, and a code repository link.

## Component inventory (the things that get reused)

- **Signal card** — appears on every condition detail page; central visual unit
- **Tier badge** — small label component for Strong / Moderate / Emerging / Exploratory
- **Evidence arm tab** — tab container for the four evidence arms
- **Stats strip** — homepage stats counter row
- **Evidence framework card** — the homepage tier cards
- **Conditions grid card** — homepage conditions card
- **Source citation link** — currently a plain link; should evolve into proper citation
- **Footer columns**

## What's not on the site but probably should be

- A `/methods` page (or `/methods.pdf` download) — citable methods document
- A `/data` page — CSV/JSON export of the signal database
- A `/cite` page or block — copy-paste citation
- A `/changelog` or `/versions` page — version history
- A `/team` or proper authorship section on `/about`
- A `/limitations` page (or expanded section on the methods page) — surface known biases prominently
- A `/related-work` page or section — situate WHEL relative to Phendo, Open Targets, DrugBank, etc.
