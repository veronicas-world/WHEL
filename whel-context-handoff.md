# Whel — Context Handoff

**Purpose of this file:** read this first, then read `Whel-Reframe-Blueprint.docx` for full detail. This page is the 30-second briefing on where things stand right now.

**Date of handoff:** June 10, 2026
**Founder:** Veronica Agudelo Ramella (philosophy background, non-technical, solo)
**Repo / workspace folder:** this folder (`rediscover`)
**Canonical strategy document:** `Whel-Reframe-Blueprint.docx` (in this same folder)

---

## What Whel is now (one sentence)

The trusted evidence substrate for women's health drug repurposing — instrumented to preserve per-claim provenance, surface contradictions, and accelerate the 505(b)(2) pathway in conditions where female biology has been systematically under-studied.

Full locked pitch language lives in **Blueprint §2**. Do not improvise variants — that section is the source of truth.

## What changed in the reframe

Whel started as a personal drug-repurposing audit across six women's health conditions (271 audited signals, 2,166 sources, working Next.js + Supabase site). It is being repositioned as a venture-scale company building the female-biology evidence substrate — the layer underneath researchers, clinicians, and advocacy organizations asking "what do we actually know about this drug in female patients?"

Why this works as a category: pan-disease repurposing platforms (Healx, BenevolentAI) treat female biology as a coverage gap, not a specialty. None of them have built the substrate. Building it is a 15–24 month head start that compounds with every condition added.

## Key decisions already made (do not relitigate)

- **Fresh repository**, not in-place refactor. Existing repo archived as `whel-legacy`; new `whel` repo with monorepo layout. Salvage: Supabase schema, pipelines, audit scripts, design system, the 271-signal seed corpus. Rebuild: data model, app layer, scoring, extraction. Detail: Blueprint §5.
- **Delaware C-Corp via Stripe Atlas**, 83(b) election within 30 days of stock issuance. Detail: Blueprint §4.
- **PMDD as flagship condition.** Endometriosis + adenomyosis next. Detail: Blueprint §10.
- **Tech stack:** Postgres + Apache AGE (not Neo4j — GPLv3 risk), PaperQA2 (30–40% reuse), MedCPT embeddings, OntoGPT grounding, MedScore atomic decomposition, PubMedBERT NLI, Anthropic Citations API, HHEM-2.1 guardrail, MedHELM + MedRAGChecker eval. Detail: Blueprint §6.
- **Position under 21st Century Cures §3060 research-support exemption** (not clinical decision support). Per-claim provenance is the architectural property that satisfies condition 4. Detail: Blueprint §4.4.
- **The moat is the substrate**, not the LLM. The compounding asset is the female-specific ontology extension, cyclical PK modeling, tuned extraction, and the corpus of audited claims.
- **Instrumented synthesis with provenance, not strict source isolation.** Field consensus (PaperQA2, Medical Graph RAG patterns) favors marked-synthesis-plus-contradiction-surfacing.
- **Informal expert review during the build**, formal advisors after the substrate exists. No formal advisor relationships yet.

## What is currently open / not yet decided

- Has the Stripe Atlas application been submitted? (As of handoff: not yet. This is the next physical action.)
- Has the first informal expert-review conversation been scheduled? (Not yet.)
- Has the new `whel` repo been scaffolded? (Not yet.)
- Has the legacy repo been renamed to `whel-legacy` and locked read-only? (Not yet.)
- USPTO trademark search for "Whel" — deferred to Month 6 per the blueprint, not yet done.

Everything in the above list is in Blueprint §12 (Immediate Action Items), Week 1 and Weeks 2–4.

## What this conversation should focus on next

In rough order of leverage:
1. Execute the Phase 0 Week 1 checklist (Blueprint §12.1). Stripe Atlas is the unblocker for everything else.
2. Scaffold the new monorepo per Blueprint §5.4 once the entity exists (or in parallel — the repo doesn't require the entity).
3. Write the company README from the locked pitch in §2.
4. Schedule the first informal expert-review conversation (target: a women's health clinician or repro endo researcher, one warm intro away).

## Critical deadlines that destroy optionality

- **83(b) election: Day 30 absolute** from stock issuance. Missing this is a six-figure mistake at fundraising. Certified mail with return receipt; Blueprint §4.2.
- **QSBS five-year clock** starts when stock is issued. Incorporate now; the clock runs while you build.

## How to use the blueprint

- Need the pitch? §2.
- Need to know what to do this week? §12.
- Need to argue with someone about the architecture? §5 + §6.
- Need a list of competitors? §9.
- Need a list of data sources? §7 + §8.
- Need to know why a decision was made? Appendix C (Decision Log).
- Need to know what could kill us? §11.

## How to ask Veronica a clarifying question

She prefers direct prose over bullet lists in conversational replies, treats this as a serious company-building exercise, has strong instincts on positioning, and is honest about what she does and doesn't know technically. She will push back on overclaims (especially around proprietary data and moat language). Lead with substance, not formatting.

---

**End of handoff. Open `Whel-Reframe-Blueprint.docx` for full detail.**
