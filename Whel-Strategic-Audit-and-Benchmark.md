# Whel — Strategic Audit & Competitive Benchmark
### What to build next, and why

*Prepared June 2026. Internal state audited from source (the live codebase and roadmap); external benchmark web-researched and cited. Framed for prioritization — it ends in a recommended build order.*

---

## Executive summary

Whel occupies a niche that **no shipped product currently fills**: the intersection of (1) a women's-health / female-biology corpus, (2) transparent, provenance-preserving evidence *grading* with contradiction-surfacing, (3) off-label + FDA-regulatory-status mapping toward the 505(b)(2) pathway, and (4) governed patient-forum signal. Every individual ingredient exists somewhere in the field; the **combination does not exist elsewhere**. The well-funded neighbors (Every Cure, Recursion, Insilico, Healx, BenevolentAI, BioXcel) either develop and own proprietary drugs, grade a *different* entity for internal use, or are sex-agnostic. Femtech is overwhelmingly devices, diagnostics, and novel-molecule biotech. The open databases (Open Targets, PharmGKB, DrugBank) grade target–disease or gene–drug pairs, without a female lens or verbatim-span provenance.

Two of Whel's moves are **genuine, literature-confirmed whitespace**:
- **Female-applicability weighting** of drug evidence. No published "female-applicability score/multiplier" exists; the flagship models (TxGNN, MATRIX) are sex-agnostic; the gap is documented in peer-reviewed work but uncommercialized.
- **Grading patient-forum *efficacy* signal.** Mining forums for *adverse events* is mature (SMM4H, WEB-RADR, PatientsLikeMe–FDA). Applying an evidence-rigor grading rubric to *efficacy* anecdotes — especially in women's-health communities — has no published precedent.

One of Whel's claims is **ahead of what the field has actually demonstrated, and therefore its biggest technical risk**: verbatim **span-level** provenance with per-claim entailment. Entailment-per-claim is mature and deployable; exact-span attribution is *unsolved* even in general-domain attribution research, and biomedical RAG still fabricates citations. This is the component most likely to underperform its spec.

**The strategic through-line:** Whel's differentiation is *synthesis and transparency for an under-served population*, not raw prediction or proprietary data. The correct posture — which Whel already adopts — is to **integrate** MATRIX/Open Targets rather than out-compute them, and to make the women's-health lens plus honest provenance the moat. The next phase of work should therefore **stop treating the differentiators as claimed and start treating them as proven and operationalized.**

### On "what is the point of Whel if the Strong tier is already-approved drugs?"

The benchmark sharpens the earlier answer. The on-label Strong signals (MHT for menopause, paroxetine for hot flashes) are the **calibration set** — a repurposing engine whose top tier surfaced nonsense could not be trusted on its Emerging tier, so agreeing with established medicine is what *earns* trust in the novel leads. But the regulatory layer we just shipped makes the real value visible: several Strong signals are **strong-but-off-label** — aromatase inhibitors for endometriosis (approved for breast cancer), venlafaxine/desvenlafaxine for vasomotor symptoms (paroxetine is the lone on-label one), myo-/D-chiro-inositol for PCOS (supplements, not approved drugs). That "strong evidence + off-label" quadrant *is* the actionable 505(b)(2) landscape. Productizing it (the Actionability layer, below) is exactly how Whel converts "we agree with what's known" into "here is a ranked, sourced repurposing opportunity that no one has assembled for women." The benchmark independently confirms that **no public tool fuses graded efficacy + FDA-label/Orange-Book status + trial stage** — the closest, DrugPatentWatch, is IP-only.

---

## 1. Where Whel stands today (internal state)

**Fully live (core), all six conditions:** the substrate/evidence engine (v4.0 cutover; last snapshot ~183 active pairs, tiered 11 Strong / 66 Moderate / 65 Emerging / 41 Exploratory); the Direct-Research and Pathway (Open Targets) arms; the five-dimension rubric with frozen tier cutoffs; the female-applicability multiplier (as stored metadata); the MATRIX cross-reference (kept out of the score); the regulatory & development-status layer (DailyMed / Orange Book / ClinicalTrials.gov); the public candidates index, condition pages, and per-candidate signal-breakdown pages.

**Live but selectively seeded / flagship-only:**
- **Layer 02 (retrieval & validation)** — built as a flagship for **PMDD/PMS only**, not extended to the other five conditions and not wired into the main signal index.
- **Community arm (Reddit)** — intake is live across all six conditions, but its downstream formal validation loop runs only through the PMDD flagship. (Note: the follow-up to make community scoring deterministic — passing thread_id/author/timing into the scorer — is queued with this.)
- **Sex-PK and cyclical-phase layers** — seeded for an initial compound set / strongest-evidence PMDD cases; broader population ongoing.

**Blocked or pending a first run:**
- **EudraVigilance** — pipeline implemented but not contributing signals (needs a registered EMA session account).
- **Summary grounding** and **structured-sources audit** — verifiers built, snapshots are `pending_first_run` (waiting on per-source excerpts being populated).
- The **Reddit app-key** gate (external, Reddit-side outage) blocks scaling the community arm and its efficacy-grading validation.

**Admitted limitations the site already documents:** LLM classification/prompt-sensitivity risk and observed hallucinated citations; model/prompt drift between snapshots; source biases (PubMed English/publication bias, FAERS reporting bias, Reddit selection bias); structurally-weak pathway-only inference (capped at Exploratory); a sex-disaggregation gap (some "women-relevant" signals inferred from mixed-sex populations); thinner coverage for vulvodynia and adenomyosis; point-in-time freshness.

**Two quick housekeeping items found:** EudraVigilance and SIDER are listed as "Under review" on the roadmap but "Planned" on external-references (reconcile); and the community follow-up (deterministic scoring inputs) should be recorded so it isn't rediscovered.

---

## 2. The landscape (benchmark synthesis)

**Companies.** The field splits into three groups, none overlapping Whel's exact position:
- **AI-repurposing biotechs that own drugs** — Every Cure (nonprofit; ARPA-H up to ~$124M + $60M TED; MATRIX = graph-ML over KG lineage, disease-agnostic, rare-disease center of gravity), Healx, Recursion (~$1.7B mkt cap), Insilico (HKEX-listed; PandaOmics grades *target*-disease associations), BenevolentAI (the cautionary tale — delisted 2025 after a Phase 2 failure), BioXcel (distressed). All develop molecules or grade a different entity for internal use; all sex-agnostic; none surface pharmacovigilance or patient-forum signal to end users.
- **Femtech / women's-health biotech** — Celmatix, FimmCyte, Hope Medicine, Gameto, plus big-pharma endometriosis pipelines — almost entirely novel-molecule or device/diagnostic. No femtech player does public-evidence grading for repurposing.
- **Open evidence/target databases** — Open Targets (target–disease, sex-agnostic, source-level provenance), PharmGKB (gene–drug, tiered grading — a good *design* precedent), DrugBank (annotation, commercial license), Cures Within Reach (funds trials — a potential *downstream partner*, not a competitor). These are largely Whel's inputs.

**Methods.** Whel's infrastructure is **SOTA-standard** (MONDO/EFO + ChEMBL/RxNorm + Open Targets edges are the same lineage as PrimeKG/RTX-KG2), and consuming MATRIX/KGML-xDTD as an *independent cross-reference* rather than rebuilding graph-ML is the right call — TxGNN and MATRIX dominate predictive repurposing and Whel should not try to beat them there. Whel's rubric approach (five dimensions, tiers, **contradiction-surfacing rather than averaging**) is modestly ahead of production practice, which tends to average away disagreement. Per-claim entailment is mature (PubMedBERT-NLI, MiniCheck-class checkers); **verbatim span-level provenance is the research frontier, not a solved capability** (SciFact-Open shows a 15–30 F1 precision drop moving to realistic open retrieval).

**Where Whel is genuinely differentiated (defensible):** the intersection itself; the women's-health / female-applicability lens; provenance *depth* with contradiction-surfacing; off-label/505(b)(2) integration; and a research-support business model that avoids the capital/clinical risk that sank BenevolentAI.

**Where Whel is behind or exposed (honest):** scale and resources (solo vs. $100M+ teams; ~183 signals is a curated slice); modeling horsepower is *borrowed* from MATRIX, not owned; substrate dependency on others' assets (DrugBank/DisGeNET carry commercial-license constraints that could bite if Whel commercializes); and grading *fidelity is unvalidated* — the provenance/entailment quality is the real moat and it isn't externally measured yet.

---

## 3. Recommended build order

Prioritized to **deepen the moat, prove it, and extend it** — weighting defensibility, de-risking the biggest over-claim, credibility/validation, and freedom from external blockers.

**1. Actionability layer (the 505(b)(2) axis).** *Highest product leverage; no blockers; the roadmap's named successor to the regulatory layer we just shipped.* A second axis beside the evidence score that ranks candidates by management-endpoint fit and 505(b)(2) viability, turning the descriptive regulatory data into a surfaced *opportunity*. The benchmark confirms this fusion is unoccupied whitespace, and it directly answers the "point of Whel" question by elevating the strong-but-off-label quadrant. **Design guardrail:** rank and surface, never "advise" — stay inside the research-support / not-regulatory-advice framing that already protects Whel legally and reputationally.

**2. Make the female-applicability multiplier principled and auditable.** *The single clearest differentiator in both benchmarks — currently a stored ×factor, which is also its weakest point.* Ground the weight in concrete, citable inputs: female trial-representation fraction, sex-stratified PK/PD flags (Janusmed-style), and AwareDX-style sex-specific safety signal, so the multiplier is a transparent composite rather than a heuristic. This converts Whel's most-scrutinized, most-defensible feature from "claimed" to "grounded."

**3. Harden and *measure* the provenance/entailment layer.** *De-risks the biggest over-claim.* Adopt a MiniCheck-class grounding checker plus PubMedBERT-NLI for entailment; reframe "verbatim span" as retrieval-of-supporting-sentence gated by entailment rather than guaranteed exact-span attribution; and **measure it explicitly** against SciFact / LLM-AggreFact, reporting the numbers (and expecting an open-domain precision penalty). This is largely the roadmap's **Summary-grounding** item, which is already built and waiting on excerpts — so it is close. Reporting a real fidelity number turns a liability into a credential.

**4. Two-rater validation study (publish inter-rater agreement).** *Credibility.* The honest critique is that grading fidelity is unproven and the Strong-tier sample is small. A published agreement study is the cheapest, highest-trust answer, and it's already Planned.

**5. Populate what's already built.** Two Planned items are *coded but empty*: per-claim synthesis/contradiction markers (built into the signal view, needs corpus population) and the cross-arm concordance flag. Populating them is low-effort, high-visibility, and contradiction density is exactly the under-practiced signal the benchmark says to make first-class.

**6. Queued behind the Reddit unblock — forum-efficacy grading, done rigorously.** When the app-key gate clears: (a) wire thread metadata into `score_claims.py` for deterministic independence-discounting, and (b) borrow AwareDX-style learned per-user credibility weighting and **validate perceived-efficacy against known RCT outcomes** (the modafinil forum-vs-RCT divergence is the built-in test case). This turns whitespace into *evidenced* whitespace — but it can't be tested until Reddit is live, so it stays queued.

**7. Data-source expansion, opportunistically and with caveats.** SIDER for the AE arm is the right first call but is stale (misses GLP-1s, JAK inhibitors) and carries a circular-reasoning trap (side-effect = indication); note the fresher successors (OnSIDES 2025, SIDEKICK 2026, the EMBL-EBI SIDER successor) for a later swap. DrugBank/DisGeNET add coverage but carry commercial-license constraints worth resolving *before* any commercial use. Disproportionality statistics on the AE arm and the DOI'd open-data export are solid, lower-urgency credibility adds.

**Deliberately *not* prioritized:** competing with TxGNN/MATRIX on graph-ML prediction. Keep cross-referencing; do not rebuild.

---

## 4. Quick housekeeping (cheap, do anytime)

- Reconcile the EudraVigilance/SIDER status mismatch (roadmap "Under review" vs external-references "Planned").
- Record the community-scorer follow-up (thread_id/author/timing into `score_claims.py`) as a tracked item so it drops in cleanly when Reddit unblocks.

---

## Sources & caveats

Key external sources (full set gathered during research): Every Cure / MATRIX (everycure.org; github.com/everycure-org/matrix; ARPA-H award pages); TxGNN (*Nature Medicine* 2024; Zitnik Lab); KGML-xDTD (*GigaScience* 2023); PrimeKG (*Scientific Data* 2023); Hetionet/Rephetio (*eLife* 2017); Open Targets (platform docs; release 24.12); PharmGKB (ClinPGx); SciFact & SciFact-Open, MultiVerS, MiniCheck, PubMedBERT-NLI (ACL/arXiv); SMM4H, WEB-RADR (*Drug Safety* 2019), PatientsLikeMe–FDA; AwareDX (*Cell Patterns* 2020); sex-aware repurposing review (*Biology of Sex Differences* 2022); DrugPatentWatch; repoDB (*Scientific Data* 2017).

**Caveats.** The two whitespace verdicts (female-applicability weighting; forum-efficacy grading) are *negative findings* — strong but not absolute; a very recent or stealth effort can't be fully excluded. Several competitor financials are secondary-sourced. Whether Every Cure's MATRIX runs KGML-xDTD in production is *shared lineage*, not confirmed equivalence. Cross-model metric comparisons (AUPRC vs F1 vs AUROC) are not directly comparable and should never be presented as a head-to-head table.
