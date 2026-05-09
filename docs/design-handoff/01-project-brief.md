# 01 — Project Brief

## What WHEL is

WHEL (Women's Health Evidence Lab) is a drug repurposing signal database for under-researched women's hormonal and reproductive conditions. It ingests data from five independent sources, applies a structured five-dimension evidence scoring rubric, and presents tier-classified signals organized into four evidence arms.

The premise: in disease areas where traditional drug development has been slow or absent, the relevant signals frequently exist already — distributed across published trial secondary endpoints, FDA adverse event reports, mechanistic pathway databases, and patient-reported community discussion — but have never been aggregated into a single condition-specific view.

## What problem it solves

The structural underrepresentation of women in biomedical research is well-documented (NIH Revitalization Act of 1993 was the first federal mandate for women's inclusion). Conditions like endometriosis, PMDD, vulvodynia, adenomyosis, PCOS, and the menopausal transition are chronically underfunded relative to their prevalence and severity. Researchers and patients both struggle to find aggregated, condition-specific evidence on drug repurposing candidates.

WHEL is a hypothesis-generating tool, not a clinical recommendation engine.

## What's in the database (current snapshot, May 2026)

- **6 conditions:** endometriosis, adenomyosis, PCOS, PMDD, vulvodynia, perimenopause/menopause
- **281 scored signals** with non-null total_evidence_score
- **5 active data sources:** PubMed, ClinicalTrials.gov, FDA AEMS (formerly FAERS), Open Targets Platform, Reddit
- **2,228 source citations** total
- **4 evidence arms:**
  - **Direct Research** (PubMed + ClinicalTrials.gov)
  - **Cross-Condition Signals** (FDA AEMS + literature triangulation)
  - **Pathway Insights** (Open Targets + FDA labels)
  - **Community Forum Reports** (Reddit communities)
- **4 confidence tiers** mapped from a 0–10 score:
  - Strong (9–10), Moderate (7–8), Emerging (4–6), Exploratory (0–3)

## Who built it and what's the positioning

- **Author 1:** Veronica Agudelo, Columbia University student, philosophy background.
- **Author 2:** Co-author / project mother, psychiatrist with women's hormonal health background.
- **Funding:** None. No pharmaceutical industry funding. Hosted on free tiers of Vercel + Supabase.
- **Institutional affiliation:** Independent project. Author 1 has Columbia adjacency via student status but the project is not Columbia-sponsored.

This positioning matters for design: WHEL should feel like a serious independent research project, not like a Columbia-sponsored institutional tool (which it isn't) and not like a startup product (which it also isn't).

## Strategic context for the redesign

The immediate motivation for this redesign is to bring WHEL up to a presentation standard appropriate for outreach to senior biomedical informatics researchers — specifically, the project owner is preparing to share WHEL with researchers like **Dr. Noémie Elhadad** (Chair of Biomedical Informatics, Columbia DBMI; co-founder of Phendo / Citizen Endo). Elhadad's research is in patient-generated health data and women's hormonal conditions — methodologically adjacent to WHEL.

This means the bar is high. The site needs to land as a legitimate methodological contribution worth a senior researcher's attention, not as a personal project that happens to be online. The redesign is the primary lever for closing that perception gap.

## Tech and product constraints

- Next.js (TypeScript, app router) — frontend stack is fixed for now.
- Tailwind CSS — utility-first; the design system should extend Tailwind cleanly, not require a parallel CSS architecture.
- Supabase Postgres for the data layer — the data model is fixed.
- Vercel for hosting — keep static-site-generation friendly where possible.
- Mobile responsive is required; mobile-first is preferred but not mandatory.

## Companion documents available

- A draft methods writeup (preprint-style PDF source) at `docs/methods-draft.md`
- Proposed limitations expansion at `docs/limitations-additions.md`
- Related work draft at `docs/related-work-draft.md`

These are the content layer that the redesigned site needs to surface elegantly.
