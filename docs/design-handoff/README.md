# WHEL Design Handoff Package

This folder contains everything a design tool or designer needs to redesign WHEL (Women's Health Evidence Lab) into a more research-grade tool. The goal is to evolve the current site away from a "AI-generated/vibe-coded" feel toward a serious, citable academic research aggregator that holds up next to peer projects like the Open Targets Platform, Phendo / Citizen Endo, and the Nature/BMJ family of research-publishing aesthetics.

## Files in this folder, in reading order

| File | Read this when |
|---|---|
| `README.md` | First. You're here. |
| `01-project-brief.md` | You need to understand what WHEL is, what it does, and who it's for. |
| `02-design-brief.md` | You need to understand what's wrong with the current design and what the redesign needs to achieve. |
| `03-current-pages-inventory.md` | You need a page-by-page map of what exists today. |
| `04-audience-personas.md` | You need to understand who the redesign is for. The primary audience is researchers, not patients. |
| `05-brand-and-content.md` | You need to know what's locked, what's flexible, and what the language register should be. |
| `06-inspirations-and-anti-patterns.md` | You need reference points — both "do this" and "avoid this." |
| `07-the-prompt.md` | The ready-to-paste prompt for handing off to a design tool. |
| `screenshots/` | Page screenshots of the current site (captured separately by the project owner). |

## Quick context

- **Live site:** https://rediscover-coral.vercel.app
- **Code repository:** https://github.com/veronicas-world/WHEL
- **Tech stack:** Next.js (TypeScript, app router) + Tailwind CSS, hosted on Vercel; PostgreSQL via Supabase.
- **Project owner:** Veronica Agudelo (Columbia University) and a co-author (psychiatrist).
- **Stage:** Working v0.1 with 281 scored signals across 6 conditions. Functional but not yet research-grade in presentation.
- **Audience:** Researchers (primary), clinicians (secondary), sophisticated patients/advocates (tertiary).

## What this handoff does NOT lock in

The redesign is allowed to:

- Restructure the navigation
- Replace the homepage hero entirely
- Propose a new logo or wordmark
- Adjust the color palette (within the constraints in `05-brand-and-content.md`)
- Recommend new components for signal cards, tier visualization, source citation
- Add new pages (e.g., a dedicated `/methods` PDF download page, a `/cite` page, a `/data` export page)
- Suggest changes to copy that improve clarity for a research audience

The redesign should NOT:

- Change the underlying data model (signals × sources × conditions × five scoring dimensions × four confidence tiers)
- Change the four evidence arms (Direct Research, Cross-Condition Signals, Pathway Insights, Community Forum Reports)
- Replace the existing scoring rubric or tier mapping
- Eliminate the project's voice — the founder narrative on `/about` is core to the project's character and should be preserved (though it can move within the IA)

## How to use this with a design tool

Two paths:

1. **Single-shot prompt:** Paste `07-the-prompt.md` into your design tool. It's self-contained.
2. **Multi-turn collaboration:** Share the whole folder. The tool can then ask clarifying questions and reference specific files. This is the recommended approach for substantial redesign work.

For either path: include screenshots from the `screenshots/` folder and link the live site. A design tool that can browse will get more from the live site than from any static description.
