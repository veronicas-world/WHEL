# 06 — Inspirations and Anti-Patterns

## Strong references — what to study

These are sites that get research-tool design right, in different registers. Pull the principles, not the exact aesthetics.

### Open Targets Platform — `https://platform.opentargets.org`
**What it does well:** Information density without clutter. Strong typographic hierarchy. Clear evidence-strength visualizations (the "evidence summary" widgets are particularly good — color-coded heat strips showing aggregated evidence scores by source type). Citation-forward. Looks like a research instrument from the first second.
**What WHEL should borrow:** the per-target evidence summary visual treatment (a row of mini-cards or a heat strip showing evidence presence/strength across each source); the discipline of explicit source labeling on every claim.

### Phendo / Citizen Endo — `https://citizenendo.org`
**What it does well:** Patient-centered without being patronizing. Clean, calm, research-affiliated visual language. Honest about being a research project. Direct about authorship and institution.
**What WHEL should borrow:** the patient-respectful tone, the explicit "research project" framing, and the calm color discipline. The two projects are methodologically adjacent and should feel like they could plausibly cite each other.

### DepMap Portal (Broad Institute) — `https://depmap.org`
**What it does well:** Dense data dashboards that still feel approachable. Strong typographic system optimized for tabular data. Per-disease and per-target landing pages with consistent visual treatment. Visible methods and citation furniture.
**What WHEL should borrow:** the per-condition page treatment (a research-grade dashboard for each condition rather than a marketing-style card grid).

### Our World in Data — `https://ourworldindata.org`
**What it does well:** Charts as content. Long-form research presentation that respects both the casual reader and the rigorous one. Clear methods linkage. Strong typographic system.
**What WHEL should borrow:** the chart-as-paragraph convention (use small inline visualizations to communicate evidence structure rather than purely text); the methodology-always-one-click-away discipline.

### The Lancet's research browse — `https://www.thelancet.com`
**What it does well:** The aesthetic of serious medical publishing. Disciplined typography, two-column layouts for dense reading, citation furniture everywhere.
**What WHEL should borrow:** the typographic seriousness; the way meta-information (volume, issue, doi, dates) is consistently and unobtrusively displayed.

### Cochrane Library — `https://www.cochranelibrary.com`
**What it does well:** Plain Language Summaries paired with full systematic reviews. Multi-tier abstraction is a core design principle. Clear evidence-grading visual treatment.
**What WHEL should borrow:** the dual-register design — patient-readable summary co-located with researcher-readable detail.

### NHGRI/Genome.gov — `https://www.genome.gov`
**What it does well:** Government-research aesthetic done well. Trustworthy, dense, and legible.
**What WHEL should borrow:** the disciplined use of color (navy/dark blue family used consistently for hierarchy, never for decoration).

### NEJM Evidence — `https://evidence.nejm.org`
**What it does well:** A relatively new sub-publication that has put real thought into evidence display for a clinical audience. Clean, citation-rich, visualization-aware.
**What WHEL should borrow:** the calm, dense, citation-first treatment of evidence claims.

### A field reference: The Visual Display of Quantitative Information (Tufte)
Not a website — but the principles (data-ink ratio, small multiples, appropriate complexity) apply directly. The chart treatments WHEL needs should follow Tufte rather than Tableau-default.

## Anti-patterns — what to avoid

These are tells that visually classify a site as "AI/vibe-coded" or "consumer SaaS" rather than "research instrument."

### Generic Tailwind defaults
- Soft drop shadows on every card
- Universal `rounded-2xl` corners
- Gradient buttons
- Pastel hover states
- "Inspirational" iconography from Heroicons / Lucide used decoratively
- The same `max-w-7xl mx-auto px-4` container everywhere with no spatial variation

### Marketing/SaaS feel
- A hero with a giant headline + tagline + two CTA buttons + an animated element
- "Trusted by" logo strips
- Testimonial cards
- "Powerful features" three-up grid with icons
- Pricing pages, even if free
- Email capture for "stay updated"
- Animated number counters in stats strips

### Patient-product condescension
- Pastel pinks/purples (hyper-feminized)
- Floral/abstract decoration
- "Empowering women" language
- Cartoonish illustrations
- Patronizing patient-facing language
- Hidden methodology behind a "for researchers" wall

### AI-assistant aesthetic
- "Chat with our AI" widgets
- Sparkle icons next to features
- Generative-art header images
- Soft purples with blue-to-pink gradients
- Phrases like "powered by AI" prominently displayed

### Personal-blog aesthetic
- Centered single-column body type with no spatial structure
- Author photo dominates above the fold
- Substack-style "share / subscribe / archive" UI
- Non-research footer with social links

### Information-sparse signal-of-trying
- Big, decorative illustrations with no information value
- Three-word section headers that explain nothing
- Excessive whitespace where information should be
- "Read more" buttons hiding everything below the fold

## A note on the current WHEL aesthetic

The cream + sage palette and serif headers are not bad. They're recognizable and have a calm character. The redesign should evolve the current aesthetic, not throw it out. Specifically:

- **Keep:** the cream background family, the green accent family, the typographic ambition (serif headers + sans body), the calm restraint.
- **Tighten:** typographic system (sizes, weights, line heights need a researcher-grade pass), spacing scale (denser, more deliberate), color palette (semantic accents for arms and tiers).
- **Add:** charts and visualizations, citation furniture, a wordmark, methods PDF download, author/affiliation block, density discipline.
- **Remove:** anything that reads as "indie blog" rather than "research instrument" — this is mostly about precision rather than wholesale replacement.

The end goal is an aesthetic that could plausibly live next to Open Targets or Phendo on a researcher's bookmark bar without feeling out of place.
