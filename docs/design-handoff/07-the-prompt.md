# 07 — THE PROMPT (ready-to-paste)

This is the prompt to give a design tool. It is self-contained — you can paste it without sharing the rest of this folder, although sharing the folder enables better follow-up. Add screenshots from the `screenshots/` folder where indicated.

---

## Prompt for design tool

I'm building a drug repurposing signal database for under-researched women's hormonal conditions called **WHEL — Women's Health Evidence Lab**. It's currently live at https://rediscover-coral.vercel.app and I need help redesigning it from "AI-built indie project" to "research instrument worthy of a senior biomedical informatics researcher's attention." Code is at https://github.com/veronicas-world/WHEL.

### What WHEL is, in one paragraph

WHEL ingests data from five sources (PubMed, ClinicalTrials.gov, FDA AEMS, Open Targets Platform, Reddit communities) and uses Claude Opus 4.6 to score every signal against a published five-dimension rubric (replication, source quality, specificity, biological plausibility, direction consistency). Signals map to four confidence tiers: Strong (9–10), Moderate (7–8), Emerging (4–6), Exploratory (0–3). The current snapshot has 281 scored signals across six conditions: endometriosis, adenomyosis, PCOS, PMDD, vulvodynia, and perimenopause/menopause. Signals are organized into four evidence arms: Direct Research, Cross-Condition Signals, Pathway Insights, and Community Forum Reports. WHEL is an independent research project, not Columbia-sponsored, and is being prepared for outreach to senior biomedical informatics researchers (e.g., Dr. Noémie Elhadad of Columbia DBMI, who runs Phendo / Citizen Endo — a methodologically adjacent project).

### The job

Redesign WHEL so that, in the first 90 seconds of a senior researcher's first visit, they classify it as a serious research aggregator worth engaging with — not as a student project, not as a generic AI-built tool, not as a wellness-product site. The bar is specifically: it should feel like a tool that could plausibly sit next to **Open Targets Platform**, **Phendo / Citizen Endo**, or **DepMap Portal** on a researcher's bookmark bar.

### What's wrong with the current design

1. The visual language reads as "default Tailwind + AI-generated copy." Soft cards, generic spacing, rounded corners, an undifferentiated cream/sage palette. Calm but uncertain. Doesn't establish methodological seriousness.
2. The signal cards (the central visual unit, used everywhere) are pleasant to look at but hard to scan in volume. There's no clear primary/secondary/tertiary hierarchy. Citations are buried.
3. There are zero data visualizations on a site whose entire premise is structured evidence. A scoring framework with five dimensions, four tiers, four arms, and six conditions is begging for thoughtful summary visualization.
4. Methodology is good content but lives in accordion sections, not as a downloadable PDF. There's no citation block, no DOI, no author/affiliation furniture.
5. Information density is uniformly low. Researchers want information per pixel; the current design has a lot of whitespace and not much scannable structure.
6. The site doesn't differentiate the four evidence arms strongly enough visually. A Reddit-sourced Community Forum Report and a peer-reviewed Direct Research signal currently look more alike than they should.

### Constraints and what's locked

- **Tech stack is fixed:** Next.js (TypeScript, app router), Tailwind CSS, deployed on Vercel. Designs should be implementable in this stack.
- **Project name and acronym:** "Women's Health Evidence Lab" / "WHEL." Possible to introduce "rediscover" as a complementary product wordmark (the URL is `rediscover-coral.vercel.app`).
- **Six conditions, four arms, four tiers, five scoring dimensions:** the data model is fixed.
- **The founder narrative on `/about` is core character** and should be preserved (voice can be edited; substance shouldn't be removed).
- **The cream/off-white background and green accent family are recognizable** and should be evolved, not replaced. Specific hex values are flexible.
- **The disclaimer "for research and educational purposes only" must remain visible.**

### What's open

- Layout, grid system, spacing scale, typographic system (within the serif-headers / sans-body family), color palette (within the cream + green family), iconography (currently almost none — please keep minimal), wordmark / logo (currently none), navigation IA, condition-page layout, signal card design from scratch, data visualizations to add.

### Deliverables I'd love

1. **High-fidelity mockups of five core screens:**
   - Homepage
   - A condition detail page (use endometriosis as the example — it has the most signals)
   - At least three signal-card variants (one per evidence arm: Direct Research, Cross-Condition Signals, Community Forum Reports)
   - The methodology page (with a clear methods-PDF-download CTA)
   - The about page (with author/affiliation block and citation block)
2. **A small design system spec:** typography scale, color tokens (with semantic names for tiers and arms), spacing scale, component library outline.
3. **Concrete recommendations for charts and visualizations** (with simple sketches): what should appear on the homepage, on each condition page, on the methodology page. Prioritize charts that communicate evidence structure faster than text can.
4. **Annotated rationale** for each significant deviation from the current design.
5. **Optional but welcome:** Tailwind class snippets that implement the new design tokens, so I (or my engineering collaborator) can apply them directly.

### Audience priority

Primary: senior biomedical informatics researcher.
Secondary: practicing clinician.
Tertiary: sophisticated patient or patient advocate.

When a design choice trades off audience #1 against #3, default to #1 — but route to #3 with progressive disclosure (e.g., a clear "patient guide" path off the homepage). The goal is not to choose researchers over patients, but to lead with research credibility because that's currently the gap.

### Aesthetic anchors

**Yes, these:**
- Open Targets Platform (research-grade information density)
- Phendo / Citizen Endo (calm, patient-respectful, research-affiliated)
- DepMap Portal — Broad Institute (per-disease research dashboards)
- Our World in Data (charts as content; methods always one click away)
- The Lancet / NEJM Evidence (typographic seriousness; meta-information done right)
- Cochrane Library (multi-tier abstraction: patient-readable summary + researcher-readable detail)

**No, not these:**
- Soft pastel wellness products
- AI-assistant chat-widget aesthetics
- "Empowering women" marketing language
- SaaS feature-grid pages with decorative icons
- Personal blog or Substack aesthetics
- Anything that reads as "indie project" rather than "research instrument"

### Voice and copy register

Two voices that should remain distinct:

- **Researcher voice** for methodology, signal cards, technical pages: declarative, precise, citation-rich, first-person plural ("we"), explicit about uncertainty, no marketing language.
- **Founder voice** for about pages and project narrative: warm, personal, declarative, first-person singular when appropriate, comfortable with real human detail.

The founder voice should NOT bleed into methodology pages. The researcher voice should NOT flatten the about page.

### How I'd like us to work

1. Look at the live site (https://rediscover-coral.vercel.app) and the screenshots I'll attach.
2. Ask me clarifying questions where you have them — I'd rather you ask than guess.
3. Propose the design system first (typography, color, spacing, component primitives), get my sign-off, then do the screen mockups.
4. For each significant deviation from the current site, give me a one-paragraph rationale so I can either approve or push back.
5. Ship in iterations rather than one huge handoff.

### Reference material

I'll share these alongside this prompt:
- The current site URL: https://rediscover-coral.vercel.app
- Screenshots of the current state of the homepage, a condition detail page, a methodology page, and the about page
- A draft methods document (`methods-draft.md`)
- A draft expanded limitations section (`limitations-additions.md`)
- A draft related-work section (`related-work-draft.md`)
- The full design handoff folder (this prompt is item 7 of 7)

### One last note

This is a real project being prepared for real research outreach. I'm not looking for visual novelty for its own sake. I'm looking for a redesign that makes the rigor of the underlying methodology visible to a researcher in the first impression. Calm, dense, citation-first, chart-aware, typographically disciplined. The design that fades into the background and lets the evidence speak.

---

*End of prompt. Paste everything above into the design tool. Add screenshots. Let it ask questions.*
