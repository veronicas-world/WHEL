# Related Work

This section locates WHEL within the existing landscape of women's health research, drug repurposing methodology, and patient-generated health data. The intent is twofold: (i) to credit the prior and adjacent work that this project builds on or learns from, and (ii) to be precise about what WHEL adds that we believe is novel — and equally precise about what it does not.

## Patient-generated health data and digital phenotyping for women's hormonal conditions

The most methodologically adjacent body of work is the patient-generated health data tradition for women's hormonal conditions, particularly endometriosis. **Citizen Endo / Phendo** (Columbia University Department of Biomedical Informatics; Elhadad, Mamykina, McKillop, and colleagues) has demonstrated, over several years and multiple publications, the scientific value of structured patient self-tracking for understanding endometriosis phenotypes, symptom trajectories, and the heterogeneity of disease experience. Phendo collects prospective, structured self-report data through a dedicated mobile application, under informed-consent protocols, with explicit attention to design-for-disclosure and patient-as-collaborator framing.

WHEL's Community Forum Reports arm is conceptually adjacent but methodologically distinct in three important ways:

1. **Data source.** Phendo collects prospective, structured self-reports from consenting participants. WHEL ingests retrospective, unstructured public discussion from open Reddit communities — without participant recruitment, consent, or structured data collection.
2. **Inferential weight.** Phendo data supports population-level phenotypic analysis. WHEL Reddit data is positioned as hypothesis-generating signal only, with the strictest minimum-evidence guardrails of any of WHEL's four arms.
3. **Ethical framework.** Phendo operates under explicit IRB oversight. WHEL's Reddit ingestion uses publicly accessible posts, stores no usernames or post bodies (only post URLs as source citations), and does not constitute human-subjects research as defined by 45 CFR 46.

We see WHEL and Phendo as **complementary rather than competing**. Phendo is the gold standard for prospective, ethically-overseen patient-reported data on endometriosis. WHEL is a much-lower-resolution, much-faster-to-build aggregator across many conditions — useful for surfacing repurposing hypotheses that warrant further investigation in tools like Phendo or in formal clinical research. A future direction worth exploring is whether WHEL signals could prospectively inform the symptom and intervention vocabularies tracked in patient-reported-outcome platforms.

Adjacent prior work in the patient-generated-data space includes menstrual cycle modeling from self-tracking (Urteaga, McKillop, Elhadad, and others), apps such as Clue and Flo that have published anonymized aggregate analyses, and the broader digital health literature on chronic disease self-management.

## Drug repurposing methodology

Drug repurposing as a discipline has a substantial methodological literature. **Pushpakom et al. (2019, *Nature Reviews Drug Discovery*)** is the most-cited modern overview of the field, articulating both the economic and scientific rationale for repurposing and the methodological challenges (selection bias in candidate compounds, intellectual-property obstacles, regulatory hurdles). **Hurle et al. (2013, *Clinical Pharmacology & Therapeutics*)** introduced an influential framework for computational drug repositioning that classifies methods by signature reversal, network analysis, and structural similarity. WHEL operates within these frameworks; it does not introduce a new repurposing methodology, and does not claim to. What WHEL adds, if anything, is (a) an explicit application focus on under-studied women's hormonal conditions, and (b) the multi-arm scoring framework that triangulates formal-evidence signals against community-reported signals within a single tier-graded view.

## Drug repurposing knowledge bases

Several existing databases provide drug-target and drug-indication associations at scale:

- **DrugBank.** Comprehensive drug-target and pharmacology reference, freely available for academic use.
- **Open Targets Platform.** Integrative target-disease association database aggregating genetic association data, expression data, drug-target interactions, and pathway analyses. WHEL ingests Open Targets directly via its GraphQL API for the Pathway Insights arm.
- **ChEMBL.** Bioactive molecule database from the European Bioinformatics Institute.
- **RepoDB.** Curated drug-indication database including failed indications.
- **RepurposeDB.** Aggregated repurposing-hypothesis database.

WHEL is structurally compatible with these resources and could be extended to ingest from them as additional pipelines. The current snapshot relies on direct Open Targets ingestion plus PubMed and ClinicalTrials.gov for clinical evidence; we have not yet incorporated DrugBank or ChEMBL. We do not duplicate disproportionality analyses available in formal pharmacovigilance signal-detection databases.

## Pharmacovigilance signal detection methodology

Disproportionality methods for spontaneous adverse event reporting databases — including the Proportional Reporting Ratio (PRR), Reporting Odds Ratio (ROR), and Information Component (IC) — are well-established (Bate & Evans, 2009, *Pharmacoepidemiology and Drug Safety*). These methods quantify whether a particular drug-reaction pair appears in the database at rates higher than expected given the marginal frequency of the drug and reaction.

WHEL's FDA FAERS pipeline does not currently implement disproportionality methods. The current pipeline relies on raw report-frequency summaries plus LLM-mediated cross-condition reasoning. This is a deliberate but provisional choice: disproportionality methods provide quantitative comparisons but do not directly answer the question WHEL is asking, which is whether reports cluster in a way suggestive of off-label benefit for one of six target conditions in female patients. Triangulating WHEL's FAERS signals against PRR/ROR/IC scores is on the development roadmap and is the most likely first methodological refinement in v0.2.

## Women's health research underrepresentation

The structural underrepresentation of women in biomedical research has been documented in reviews including **Mazure & Jones (2015, *BMC Women's Health*)** ("Twenty years and still counting"), the National Academies' *Exploring the Biological Contributions to Human Health: Does Sex Matter?*, and more recent work on sex-disaggregated reporting in trial registries. The Society for Women's Health Research and similar advocacy organizations have continued to track funding, enrollment, and reporting parity.

This literature is the motivating backdrop for WHEL but is not the substantive methodological foundation. We cite it because the case for a women's-health-specific repurposing tool stands on the empirical observation that the women's-health research base is, in fact, structurally thinner than the general repurposing literature assumes.

## Adjacent tools and what is novel

There are now several drug-repurposing-adjacent tools that surface hypothesis candidates: open-source examples include CMap-based signature reversal tools, BenevolentAI's published repurposing analyses, and academic projects that query specific knowledge graphs for repurposing scores. None, to our knowledge, is condition-set-focused on women's hormonal health, and none combines formal pharmacovigilance, mechanistic pathway data, and patient-reported community signal under a single tiered-evidence scoring framework.

What we believe is novel about WHEL:

- **Condition focus.** A repurposing aggregator built specifically and only for under-studied women's hormonal conditions, with condition-specific search vocabularies tuned for the population.
- **Multi-arm triangulation under one rubric.** Formal evidence (PubMed, ClinicalTrials.gov), regulatory pharmacovigilance (FDA FAERS), mechanistic pathway data (Open Targets), and patient-reported community signal (Reddit) scored against a single five-dimension rubric and tier-mapped consistently.
- **Explicit "sparseness as information" framing.** The four-tier display deliberately includes Exploratory and Emerging signals on equal footing with Strong ones, rather than filtering them away; the tool is designed to surface where the evidence base is thin, not to hide that thinness.

What we explicitly do not claim:

- We do not claim novelty in repurposing methodology.
- We do not claim that LLM-based scoring is superior to expert human review (the planned validation study will test this).
- We do not claim that WHEL signals constitute clinical evidence; the framing throughout the tool is hypothesis-generation, not therapeutic recommendation.

## A note on positioning

WHEL is an independent project built by a Columbia student and her psychiatrist mother. It is not a Columbia-University-sponsored or NIH-funded project (as of v0.1). We mention this because researchers reading the methods may reasonably ask, and because positioning honestly improves the chances that the tool is engaged with as a legitimate community contribution rather than a credentialed product. We welcome collaboration, criticism, and replication.

## Working references for this section

- Bate A, Evans SJW. Quantitative methods for pharmacovigilance signal detection. *Pharmacoepidemiology and Drug Safety.* 2009;18(6):427-436.
- Hurle MR, Yang L, Xie Q, Rajpal DK, Sanseau P, Agarwal P. Computational drug repositioning: from data to therapeutics. *Clin Pharmacol Ther.* 2013;93(4):335-341.
- Mazure CM, Jones DP. Twenty years and still counting: including women as participants and studying sex and gender in biomedical research. *BMC Women's Health.* 2015;15:94.
- McKillop M, Mamykina L, Elhadad N. Designing in the dark: eliciting self-tracking dimensions for understanding enigmatic disease. *Proc CHI.* 2018.
- Ochoa D, Hercules A, Carmona M, et al. The next-generation Open Targets Platform: reimagined, redesigned, rebuilt. *Nucleic Acids Res.* 2023;51(D1):D1353-D1359.
- Pushpakom S, Iorio F, Eyers PA, et al. Drug repurposing: progress, challenges and recommendations. *Nat Rev Drug Discov.* 2019;18(1):41-58.
- Citizen Endo / Phendo project: https://citizenendo.org

---

*Document version: v0.1 (May 2026). For drafting only — not yet published on the website.*
