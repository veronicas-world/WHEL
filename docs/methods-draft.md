# Whel: A Multi-Source Drug Repurposing Signal Database for Under-Researched Women's Hormonal Conditions

**Methods writeup, v0.1 (revised June 2026), DRAFT**

Veronica Agudelo¹, [Co-author name]²
¹ Columbia University · ² [Affiliation]

Correspondence: vla2117@columbia.edu
Project URL: https://rediscover-coral.vercel.app
Code repository: https://github.com/veronicas-world/WHEL

License: Content and aggregated data: CC-BY-4.0. Code: MIT.

---

## Abstract

Drug repurposing, the identification of new therapeutic uses for existing approved compounds, is a particularly attractive avenue in disease areas where traditional drug development has stalled. Women's hormonal and reproductive conditions, including endometriosis, adenomyosis, polycystic ovary syndrome (PCOS), premenstrual dysphoric disorder (PMDD), vulvodynia, and the menopausal transition, are chronically underrepresented in the research literature relative to their prevalence and morbidity burden. We present Whel (Women's Health Evidence Lab), an aggregator that surfaces drug repurposing hypotheses for these six conditions by ingesting structured and unstructured data from five complementary sources: PubMed, ClinicalTrials.gov, the FDA Adverse Event Reporting System (FAERS), the Open Targets Platform, and condition-specific Reddit communities. Each ingested signal is scored on five evidence dimensions (replication, source quality, specificity, biological plausibility, and direction consistency) by Claude Opus 4.6 against a published rubric, then mapped to one of four confidence tiers. The current database snapshot (May 2026) contains 271 scored signals across the six conditions drawn from 2,166 source citations. Whel is positioned as a hypothesis-generation tool, not a clinical recommendation engine, and is offered freely to researchers, clinicians, and patient advocates. This document describes the methodology, scoring framework, validation plan, limitations, and known sources of bias.

## 1. Background

### 1.1 The women's health research gap

The structural underrepresentation of women in biomedical research is well-documented. The NIH Revitalization Act of 1993 was the first federal mandate requiring women's inclusion in NIH-funded clinical research, leaving the field with roughly three decades of catching-up to do (Mazure & Jones, 2015). Conditions affecting women most severely (endometriosis, PMDD, vulvodynia, adenomyosis, the menopausal transition) have historically attracted disproportionately low research funding even after correcting for prevalence. Endometriosis affects up to 10% of women of reproductive age yet still carries an average diagnostic delay of 7–10 years (Nnoaham et al., 2011). PMDD, despite clear cyclicality and severity, is treated primarily through SSRIs prescribed in an ad-hoc fashion. Vulvodynia remains one of the most under-funded chronic pain conditions in the United States. The result is a feedback loop: poorly characterized mechanisms make conditions harder to study, which makes them less fundable, which preserves the mechanism gap.

### 1.2 Why drug repurposing

Drug repurposing, investigating whether an already-approved compound has a previously unrecognized therapeutic effect, is structurally well-suited to this gap. Compared to de novo drug development, repurposing leverages existing safety pharmacology, prior pharmacokinetic characterization, and (often) existing manufacturing infrastructure, allowing comparatively rapid and inexpensive paths to clinical investigation (Pushpakom et al., 2019). The conceptual premise of Whel is that, for under-studied conditions, the relevant signals frequently exist already, distributed across published trial secondary endpoints, adverse event reports, mechanistic pathway databases, and patient-reported community discussion, but have not been aggregated into a single condition-specific view.

### 1.3 What Whel is and is not

Whel is a **signal aggregator**. It does not generate clinical evidence; it surfaces existing evidence and hypothesizes about its relevance to women's hormonal conditions. Its outputs are structured starting points for further investigation by qualified researchers, not therapeutic recommendations. Patient-facing language across the site reinforces this framing.

## 2. Architecture

Whel consists of (i) a set of automated ingestion pipelines, (ii) a Postgres database hosted on Supabase, and (iii) a Next.js web frontend deployed on Vercel. The codebase is open-source under MIT and the aggregated signal data is released under CC-BY-4.0.

### 2.1 Conditions covered

The current snapshot covers six conditions:

- **Endometriosis**: chronic inflammatory disease where tissue similar to the uterine lining grows outside the uterus.
- **Adenomyosis**: endometrial tissue invasion of the myometrium, producing painful and heavy menstruation.
- **Polycystic Ovary Syndrome (PCOS)**: heterogeneous endocrine disorder with hyperandrogenism, anovulation, and metabolic features.
- **Premenstrual Dysphoric Disorder (PMDD)**: severe luteal-phase mood and physical symptoms causing functional impairment.
- **Vulvodynia**: chronic vulvar pain without identifiable cause; often neuropathic.
- **Perimenopause and Menopause**: the hormonal transition surrounding the cessation of menses, with vasomotor, mood, sleep, and metabolic symptoms.

Conditions were selected based on (a) population prevalence, (b) magnitude of the evidence gap relative to prevalence, and (c) feasibility of constructing condition-specific search queries that did not over-collapse with adjacent conditions. Vulvodynia was included specifically to ensure the framework was tested against a condition with very sparse formal evidence.

### 2.2 Data pipelines

Five active automated pipelines populate the database. A sixth pipeline (EudraVigilance) is implemented but not yet contributing signals to the current database snapshot.

**PubMed pipeline.** Queries the NCBI E-utilities API using condition-specific Boolean search terms. Results are filtered by article type, publication date, and relevance, then passed in batches to Claude Opus 4.6 with a system prompt instructing structured signal extraction (compound, signal type, evidence direction, summary, mechanism hypothesis, PMID list). Output JSON is validated and converted to parameterized SQL with `ON CONFLICT DO UPDATE`.

**ClinicalTrials.gov pipeline.** Queries the ClinicalTrials.gov v2 REST API for trials targeting each condition. Trial phase, status, intervention type, and posted adverse event tables are captured and stored. The same Claude classification step generates the structured signal record.

**FDA FAERS pipeline.** Queries the FDA Adverse Event Reporting System (FAERS) via the OpenFDA REST API. We use a two-pass strategy: (i) a targeted query restricted to female patients reporting gynecological or condition-relevant reactions while taking the candidate drug, and (ii) a baseline query of general female-patient reports for the same drug. Reactions reported in ≥2 FAERS reports are surfaced as a noise filter; reactions appearing only once are excluded. Reaction-frequency summaries are submitted to Claude for cross-condition signal classification. Each generated signal links to the live OpenFDA query URL, enabling direct verification of the underlying source.

*Provenance note.* In March 2026 the FDA consolidated FAERS and related systems into the unified FDA Adverse Event Monitoring System (AEMS), and user-facing labels in this product accordingly read "AEMS." The data is still retrieved through the openFDA `drug/event` API endpoint, which continues to serve the legacy FAERS dataset; internal database keys (the `faers` value of `source_type` and the `FAERS-` external-ID prefix) are deliberately retained as stable, non-user-visible identifiers.

**Open Targets Platform pipeline.** Queries the Open Targets Platform GraphQL API (platform.opentargets.org) for each condition using EFO/MONDO ontology identifiers. Retrieves drug candidate associations, mechanism-of-action data, target-disease association scores aggregated from genetic association data, known drug-target interactions, Reactome pathway analyses, and differential gene expression. Output is analyzed by Claude for pathway-level repurposing hypotheses. Signals from this pipeline alone (without human or pharmacovigilance corroboration) are classified as Exploratory.

**Reddit pipeline.** Queries condition-specific subreddits (r/Endo, r/endometriosis, r/PCOS, r/PMDD, r/Menopause, r/Perimenopause, r/adenomyosis, r/vulvodynia) using Reddit's public JSON search API without authentication. Eight treatment-focused search queries per subreddit (including phrases such as "what helped," "off label," "anyone tried," "worked for me") collect up to 25 top posts per query, deduplicated by post ID. Posts are analyzed by Claude to identify treatments mentioned independently by ≥2 unique users, with emphasis on off-label or unexpected use cases. Individual post URLs are stored as source records. Permalinks are validated for `/comments/` substring to ensure post-level (not subreddit-level) granularity. The pipeline targets *consistent patterns across many posts*, not individual anecdotes.

**EudraVigilance pipeline (in development).** Implemented but not yet contributing signals. Queries the European Medicines Agency adverse event database (dap.ema.europa.eu) via the Oracle BI Analytics API, with substance codes resolved through the public adrreports.eu substance table. Female patient reaction data is filtered and grouped by condition. Requires a free registered EMA account for session authentication.

### 2.3 Database schema

The signal database is implemented in PostgreSQL on Supabase with Row Level Security. Four core tables: `conditions`, `compounds`, `repurposing_signals`, and `sources`. Repurposing signals link compounds to conditions via foreign keys. The `repurposing_signals` table stores the five scoring dimensions (replication, source quality, specificity, plausibility, direction), a computed total evidence score, the confidence tier, the effect direction, and human-readable level labels. A unique constraint on `(compound_id, condition_id)` prevents duplicate signals and enables idempotent upserts on pipeline reruns.

`sources` link to signals and carry source-type metadata (`pubmed`, `faers`, `clinical_trial`, `reddit`, `opentargets`), which determines the evidence-arm display tab on each condition page. Sources are deduplicated by URL before storage.

### 2.4 Frontend signal routing

Tab assignment on each condition page is determined at render time by the `source_type` of the signal's associated sources:
- `pubmed`, `clinical_trial` → Direct Research tab
- `faers`, `opentargets` (when FAERS-corroborated) → Cross-Condition Signals tab
- `pathway_signal`, `caution_signal` (signal_type) → Pathway Insights tab
- `reddit` → Community Forum Reports tab

## 3. Scoring framework

### 3.1 Why an LLM as the scoring layer

Whel uses Claude Opus 4.6 (claude-opus-4-6) as the scoring and classification layer for every signal across all five active pipelines. The decision to use a large language model for evidence scoring is the single most consequential methodological choice in the project, and we want to be explicit about it.

The signals being scored are heterogeneous: a peer-reviewed RCT abstract, a registry trial protocol, an adverse event reaction-frequency summary, a pathway-database mechanism-of-action description, and a Reddit thread are each fundamentally different data structures. A consistent scoring framework requires a layer capable of reading text, applying domain-grounded judgment, and emitting a structured score. Smaller and faster models were evaluated during development and were found to produce flatter, less discriminating scores, particularly on the biological plausibility and consistency-of-direction dimensions. We selected Claude Opus 4.6 specifically for its performance on multi-criteria reasoning tasks. At the time of platform construction, Opus 4.6 was the top-ranked model on WHBench (Maurya, Saboo & Kumar, 2026, [arXiv:2604.00024](https://arxiv.org/abs/2604.00024)), an independent expert-validated benchmark of frontier LLMs on women's health questions that evaluated 22 models against a 23-criterion rubric covering clinical accuracy, completeness, safety, equity, and guideline adherence. We acknowledge that this choice introduces dependencies (model versioning, prompt sensitivity, hallucination risk) that are discussed in §6.

### 3.2 The five-dimension rubric

Every signal is independently scored on five dimensions, each on a 0–2 scale, for a maximum total score of 10. Scoring is performed by Claude Opus 4.6 against the full source content (not metadata).

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| **Replication** | Single source only | Two independent sources | Three or more independent sources, same direction |
| **Source quality** | Forum or anecdotal | Observational, registry, or pharmacovigilance | Peer-reviewed human study or trial |
| **Specificity** | Vague outcome ("improved," "felt better") | Symptom-specific outcome (pelvic pain, cycle regularity, mood lability) | Clearly defined condition-specific clinical endpoint |
| **Biological plausibility** | Unclear or absent mechanism | Broad but plausible mechanism | Well-characterized drug-target-pathway-disease fit |
| **Consistency of direction** | Mixed or conflicting | Mostly consistent | Clearly consistent across all sources |

### 3.3 Confidence tier mapping

Total scores map to four displayed confidence tiers:

| Tier | Score range | Description |
|---|---|---|
| **Exploratory** | 0–3 | Single-source, mechanistic, or low-specificity signals; hypothesis generation only |
| **Emerging** | 4–6 | Early-stage evidence with some corroboration or mechanistic support |
| **Moderate** | 7–8 | Replicated findings with solid mechanistic rationale |
| **Strong** | 9–10 | Highly replicated, well-characterized signals with consistent direction across multiple evidence types |

### 3.4 Category-specific minimum standards

In addition to the numerical rubric, each evidence arm carries a minimum admission standard.

- **Direct Research.** Highest bar: at least one peer-reviewed human study with clearly identified population, drug, outcome, and effect direction. Mechanistic-only signals with no human data are excluded. Quality criteria privilege replication and outcome relevance over citation count.
- **Cross-Condition Signals.** Hypothesis-generating by nature. Signals must appear in at least two independent evidence domains (literature plus FAERS, FAERS plus community, etc.) with the same direction and a plausible shared biological mechanism. Three or more formal source mentions with consistent direction also qualify. Vague phenotypic similarity is insufficient: a documented shared pathway is required.
- **Pathway Insights.** Easy to overinterpret. Minimum requirements: a specific named mechanism (mast cell activation, prostaglandin signaling, androgen receptor modulation, not generic "inflammation"), at least one known drug-target link, and at least one disease-pathway link. Pathway-only signals without human or pharmacovigilance corroboration are classified Exploratory and labeled accordingly.
- **Community Forum Reports.** The strictest framing-level guardrails. Minimum requirements: ≥5 distinct posts with specific exposure-outcome language from unique users; the framework requires specificity, directionality, and unique-user diversity. Reposts, promotional content, and low-content comments are excluded. Replication is graded 0–2 based on post volume (0 = 5–7, 1 = 8–14, 2 = 15+). Signals with 15+ qualifying mentions and consistent direction are eligible for Moderate classification only when triangulated with a formal source. Whel also tracks the time period of discussion and whether a signal persists or reflects a temporary spike.

### 3.5 Cross-cutting reliability checks

For every signal, regardless of arm, the system applies five additional reliability checks before database admission:

1. **Outcome specificity.** "Improved" is insufficient. Qualifying outcomes are condition-specific clinical endpoints.
2. **Effect directionality.** Each signal is classified as one of: improves, worsens, mixed, or unclear.
3. **Replication.** One source is interesting; two or more independent sources begin to constitute a signal.
4. **Confounding assessment.** Known confounders are flagged: drugs with multiple indications, forum populations on multiple concurrent therapies, FAERS data potentially reflecting reporting bias.
5. **Denominator awareness.** FAERS and community data do not provide true incidence rates. They are signal-generating sources and require corroboration before elevation above Emerging.

### 3.6 Guiding principle

**Frequency is not truth.** A rare but specific, repeatedly observed signal from a credible source may carry greater evidential weight than a high-volume but vague pattern. The scoring framework privileges specificity, reproducibility, and triangulation over raw volume.

### 3.7 External evidence levels (L0–L3)

In parallel with the five-dimension confidence-tier rubric (§3.2–3.3), every compound–condition pair carries an external-validation grade on a four-step ladder: **L0** (no external evidence identified), **L1** (signal appears in a single independent source: study, trial, adverse-event report, or guideline), **L2** (signal replicated across independent evidence types, or appears as a primary endpoint in a trial), and **L3** (signal appears in a published clinical guideline with explicit recommendation or guidance). The L-grade is independent of the confidence tier: tier reflects Whel's internal scoring; L-grade reflects what exists in the external record. A signal that surfaces in a guideline as a discouraged option still scores L3, and the direction is recorded separately.

L3 source attribution requires three fields on the source row: `guideline_id`, `guideline_strength`, and `guideline_certainty`. These values come from a separate human curation pass, not the LLM scoring pipeline. Strength and certainty are recorded using the originating guideline body's own framework where available (GRADE for ESHRE; NAMS Levels I/II/III; ISSWSH modified Delphi), then normalized into a strength × certainty pair so grades from different bodies are comparable. Coverage is intentionally narrow at this stage: Whel currently surfaces guideline-backed L3 evidence from three society bodies (ESHRE 2022 on endometriosis, ISSWSH 2021 on hypoactive sexual desire disorder, and NAMS 2020 on the genitourinary syndrome of menopause) across 12 validation-dossier conditions. The curation script and the migrations it emits are open in the repository, and the worklist is regenerated whenever new guideline-classified sources are ingested.

## 4. Validation plan

We acknowledge that the LLM-as-classifier methodology requires empirical validation, and that the current snapshot does not yet include such a study. A planned validation pass (planned for completion before submission of the project for academic review) will:

1. **Sample.** Stratified random sample of ~75 signals balanced across the four confidence tiers and the four evidence arms.
2. **Independent rating.** Two human raters, one with clinical psychiatry/women's-health background, one with pharmacology background, will re-score each sampled signal against the published five-dimension rubric, blind to the LLM-assigned scores.
3. **Concordance metrics.** We will report Cohen's κ for tier concordance (LLM vs. human, human vs. human), percent agreement at the tier level, and absolute deviation in summed score (LLM vs. mean human).
4. **Failure analysis.** Signals where LLM and human raters disagree by ≥2 tiers will be reviewed qualitatively to identify systematic LLM error modes (e.g., over-weighting of mechanism plausibility relative to replication).
5. **Reporting.** Full validation results, including raw rating data, will be released alongside a methods update. If concordance falls below acceptable thresholds (κ < 0.6 at the tier level), the scoring rubric and prompt structure will be revised before the next database snapshot.

## 5. Related work

Whel builds on, and is positioned relative to, several existing strands of work. A more detailed Related Work section is available at [link to /about/related-work].

- **Patient-generated health data for endometriosis.** Phendo and Citizen Endo (Columbia University DBMI; McKillop, Mamykina, Elhadad, and colleagues) demonstrate the feasibility and scientific value of structured patient self-tracking for understanding endometriosis phenotypes and trajectories. Whel's Community Forum Reports arm is conceptually adjacent but methodologically distinct: Phendo collects structured prospective self-reports under ethical oversight; Whel ingests retrospective unstructured public discussion as hypothesis-generating signal. We see the two as complementary, not competing.
- **Drug repurposing knowledge bases.** DrugBank, Open Targets Platform, RepoDB, and RepurposeDB provide drug-target and drug-indication associations at scale. Whel ingests Open Targets directly (§2.2) and is structurally compatible with the others.
- **Drug repurposing methodology.** Pushpakom et al. (2019) and Hurle et al. (2013) provide the foundational frameworks within which Whel operates.
- **Pharmacovigilance signal detection.** Disproportionality methods (PRR, ROR, IC) developed for FAERS are well-established (Bate & Evans, 2009). Whel does not replicate these methods; the FDA FAERS pipeline relies on raw report-frequency summaries plus LLM-mediated cross-condition reasoning. Triangulation against disproportionality scores is on the development roadmap.
- **Women's health research gap quantification.** Mazure & Jones (2015) and the Society for Women's Health Research have documented the structural underrepresentation that motivates this project.

## 6. Limitations

A standalone Limitations section is published and continuously updated at [link to /about/technical-architecture#limitations]. The version below summarizes that section as of v0.1.

- **LLM classification risk.** All evidence scoring is performed by Claude Opus 4.6. Hallucination and prompt-sensitivity risks are real and unavoidable at the current state of the art. We mitigate via structured rubrics, JSON-schema-validated outputs, and the planned validation pass (§4); we do not eliminate.
- **LLM versioning and prompt drift.** Model versions and system prompts evolve. We pin model versions per pipeline run and snapshot prompts in the code repository, but reproducibility across model upgrades is not guaranteed.
- **Publication bias.** PubMed disproportionately indexes positive results and English-language journals.
- **FAERS reporting bias.** Spontaneous reports are subject to the Weber effect, channeling bias, indication confounding, and notoriety bias. FAERS signals are hypothesis-generating only; they are not causal estimates.
- **Reddit community selection bias.** Reddit users skew young, English-speaking, and treatment-frustrated. The Community Forum Reports arm captures *what motivated communities discuss*, which is not identical to *what actually helps a representative population*.
- **Cross-condition signal interpretation.** A drug surfacing for a different indication in a woman with a target condition may reflect comorbidity rather than pharmacological action.
- **Open Targets / pathway inference weakness.** Genetic-target overlap and pathway-level association are weak inferential bridges to clinical effect. Pathway-only signals are explicitly classified Exploratory.
- **Sex-disaggregated data gap.** Many PubMed and ClinicalTrials.gov entries do not report sex-disaggregated outcomes. Some signals labeled relevant to women are inferred from mixed-sex populations.
- **Generalizability stratification.** The current database does not stratify by race, age band, or geography. Signals reflect aggregate patterns that may not generalize to specific subpopulations.
- **Geographic and language scope.** The current database is English-only. EudraVigilance integration (§2.2) will partially expand European coverage but not language coverage.
- **Scope limitation.** Six conditions, not all women's health.
- **Temporal staleness.** Pipelines run on demand, not continuously. Last refresh: June 2026.
- **Conflict of interest disclosure.** Whel receives no funding from the pharmaceutical industry. The authors declare no commercial conflicts.

## 7. Data and code availability

- **Code:** github.com/veronicas-world/WHEL, released under MIT license. The repository includes pipeline scripts, Claude prompt templates, the database schema, and the Next.js frontend.
- **Data:** A CSV/JSON export of the current signal database is available at [link]. Data is released under CC-BY-4.0.
- **Live snapshots:** Major snapshots are deposited to Zenodo with a citable DOI [pending].
- **Reproducibility:** Pipeline scripts log model version, prompt hash, query timestamp, and source-record IDs for every signal generated.

## 8. Ethics

Whel ingests publicly accessible data only. The Reddit pipeline retrieves public forum posts via Reddit's public JSON API; no usernames or post bodies are stored verbatim in the signal database (only post URLs as source records). No personally identifying information is collected or republished. The project does not constitute human-subjects research as defined by 45 CFR 46 and is not under IRB oversight, but we explicitly endorse the ethical principles of transparency, minimum-necessary data use, and respect for the originating communities.

## 9. Acknowledgements

[To be filled.]

## 10. References

A formatted references section will be assembled before formal release. Working list:

- Bate A, Evans SJW. Quantitative methods for pharmacovigilance signal detection. *Pharmacoepidemiol Drug Saf.* 2009;18(6):427-436.
- Hurle MR, Yang L, Xie Q, Rajpal DK, Sanseau P, Agarwal P. Computational drug repositioning: from data to therapeutics. *Clin Pharmacol Ther.* 2013;93(4):335-341.
- Maurya S, Saboo P, Kumar G. WHBench: Evaluating Frontier LLMs with Expert-in-the-Loop Validation on Women's Health Topics. *arXiv preprint.* 2026; [arXiv:2604.00024](https://arxiv.org/abs/2604.00024).
- Mazure CM, Jones DP. Twenty years and still counting: including women as participants and studying sex and gender in biomedical research. *BMC Womens Health.* 2015;15:94.
- McKillop M, Mamykina L, Elhadad N, et al. Designing in the dark: eliciting self-tracking dimensions for understanding enigmatic disease. *Proc CHI.* 2018.
- Nnoaham KE, Hummelshoj L, Webster P, et al. Impact of endometriosis on quality of life and work productivity: a multicenter study across ten countries. *Fertil Steril.* 2011;96(2):366-373.
- Ochoa D, Hercules A, Carmona M, et al. The next-generation Open Targets Platform: reimagined, redesigned, rebuilt. *Nucleic Acids Res.* 2023;51(D1):D1353-D1359.
- Pushpakom S, Iorio F, Eyers PA, et al. Drug repurposing: progress, challenges and recommendations. *Nat Rev Drug Discov.* 2019;18(1):41-58.
- NIH Revitalization Act of 1993, S. 1, 103rd Congress (1993).

---

*Document version: v0.1 (revised June 2026). For working draft only. Comments welcome via vla2117@columbia.edu.*
