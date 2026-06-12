# Whel — LLM Validation & the Cross-Synthesis Game Plan

## TL;DR

We already built a real, multi-layer LLM-validation system, and most of it is live. The unfinished pieces are mostly calibration and one planned "prompt-hardening" layer, none of which block the knowledge graph. The important reframe: **the knowledge graph is the principled way to turn cross-synthesis back on safely.** The field's consensus (GraphRAG, BenchSci, "extract then synthesize," constrained decoding) is exactly to separate provenance-bound extraction from graph-constrained synthesis, so we relax the "no cross-synthesis" rule without losing grounding. So this is not a detour before the KG; it is the same build, sequenced.

---

## 1. Where we stand (what we actually built)

**Live today (the main six-condition pipeline):**

- **Citation validation (Path C, Phase 1).** `verify-citations.py` checks every reference in `lib/whel-citations.json` (PMID → NCBI, DOI → Crossref, arXiv → arXiv) on title, first author, container, year. `verify-database-sources.py` audits the live `sources` table (NCT → ClinicalTrials.gov, Open Targets IDs → OT GraphQL, FAERS/Reddit format checks). Mismatches are flagged and block publication.
- **Summary grounding (Phase 2a).** `verify-summary-grounding.py` splits each LLM finding into sentences, embeds with Sentence-BERT (`all-MiniLM-L6-v2`), and flags any sentence below 0.40 cosine similarity to the source text. The 0.40 is an uncalibrated v0.1 default.
- **Structured verification (Phase 2b).** `verify-structured-sources.py` re-runs the openFDA count queries and re-checks Open Targets target attributions against the live APIs, within tolerance.
- **Evidence grading.** The five-dimension rubric (replication, source quality, specificity, plausibility, direction) → four tiers, plus the L0–L3 external-validation grade from named guidelines (ESHRE, ISSWSH, NAMS).

**Substrate-only (PMDD/PMS, `scripts/substrate/`, not yet on the six):**

- **Verbatim provenance.** Every atomic claim must carry an `exact_quote` that is a literal substring of the source span; if it can't be located, the claim is marked unverified and never shown.
- **Entailment (NLI).** A claim is checked to be actually entailed by its own quote. This is a **v0 using Claude as the NLI judge**; the spec calls for PubMedBERT-NLI.
- **Contradiction detection.** Within a (drug, condition) group, conflicting-direction claims are surfaced as first-class contradictions rather than averaged.

**Unfinished / planned:**

- Phase 3 prompt hardening (forbid citations outside the verified list, forbid numbers not in the source, require sentence-level attribution).
- Phase 2a threshold calibration against a human-labeled set (the 0.40 is a guess).
- Swap the v0 Claude-NLI verifier for PubMedBERT-NLI (or a MiniCheck-style lightweight verifier).
- Signal-level summary grounding (apply 2a to the per-signal summary, not just per-source).
- Two-rater validation study (inter-rater agreement) and disproportionality stats (PRR/ROR).

**The Opus problems we caught (and how):**

- Synthetic `OT-{DRUGNAME}` IDs instead of canonical ChEMBL (fixed by migration 044; Phase 2b now catches recurrences).
- `sources.key_finding_excerpt` was **0% populated** — the column existed but nothing wrote to it, so Phase 2a would have silently skipped every row. The verifier caught it before any numbers shipped; the fix (`extract-key-findings.py` + migration 045) is built but the backfill still needs to run.
- The model over-refusing on Haiku (5/10 vs Opus 1/10), which is why extraction uses Opus.
- And the one you flagged: the model **synthesizing across sources during extraction**, and surfacing off-target/irrelevant signals.

---

## 2. Why this is the same project as the knowledge graph

The reason cross-synthesis went wrong before is architectural: the extraction LLM was doing synthesis *implicitly, at extraction time, with no separate validation*. The field's answer is to make synthesis a separate, constrained, validated stage. That stage is the knowledge graph. So finishing the validation discipline and building the KG are two halves of one design:

- **Extract** (provenance-bound, one source at a time) → atomic claims with verbatim quotes. Keep this exactly as it is.
- **Synthesize** (graph-constrained) → cross-condition / cross-source inferences drawn only over already-validated claims and real graph edges, each carrying its evidence path.

This is BenchSci's ASCEND model (neuro-symbolic KG with edge-level provenance and confidence inheritance) and the GraphRAG pattern (retrieve subgraphs, reason over explicit relations) rather than free-text similarity.

---

## 3. The cross-synthesis game plan

**Keep (load-bearing — never relax):**

- Every atomic claim ties to a verbatim source span. Extraction stays per-source; the model never invents claims or numbers not in the source text.
- Contradictions surface; they are never averaged away.
- Citations are validated against canonical registries before anything publishes.
- "Every synthesis is marked as a synthesis." This is the rule that lets us enable synthesis safely, so we strengthen it rather than drop it.

**Enable (intentionally, in a controlled layer):**

- Add a dedicated **synthesis stage** that produces cross-condition / cross-source inferences as a **separate, labeled object** (e.g. `claim_kind ∈ {extracted, inferred, synthesized}`), never overwriting primary claims.

**Validate the synthesis (the field's playbook, mapped to us):**

1. **Graph-constrained generation.** A synthesized cross-condition link must trace a real path through the KG (drug → target → shared pathway → conditions). If the path doesn't exist, the synthesis is "graph silent" and is not asserted. This is constrained decoding / GraphRAG, and it reuses the "graph supports / graph silent" disclosure already on the roadmap.
2. **Per-claim attribution.** Every synthesized statement carries the exact set of source claims and edges it rests on (cite-as-you-generate). A synthesis with an unsupported link is flagged, not shown.
3. **Faithfulness check.** Decompose each synthesized statement into atomic sub-claims and verify each is entailed by its cited evidence (the RAGAS-faithfulness / FActScore / SciFact pattern). Upgrade the v0 Claude-NLI verifier toward PubMedBERT-NLI or a MiniCheck-style model here.
4. **Confidence inheritance.** A synthesized claim inherits the *weakest* link in its evidence path and can never reach "Strong" on synthesis alone. (BenchSci's edge-confidence inheritance.)
5. **Label and gate.** Synthesis is always shown as synthesis, with its evidence path, and never equated with a primary trial result — the §3060 transparency posture we already hold.
6. **Human-in-the-loop for novelty.** Novel cross-condition hypotheses are flagged for review before being elevated (Every Cure's medical-review gate). Elicit found humans missed >50% of hallucinations until shown the detailed reasoning, so the automated faithfulness layer comes first and the human reviews what it surfaces.

---

## 4. Where we stand vs the field

The documented failure rate is real: one widely cited study (Bhattacharyya 2023) found ~47% of LLM-generated medical references fully fabricated and ~46% inaccurate. That is the baseline our validation layer exists to beat.

Comparable companies:

- **BenchSci (ASCEND)** — neuro-symbolic knowledge graph with edge-level provenance and confidence inheritance; 9 of the top 10 pharmas. This is essentially our Path B target architecture, which is strong validation of the direction.
- **Causaly** — hallucination filtering, "no-answer" recognition, and an evidence/provenance matrix; cited by default. Comparable to our Phase 1/2 discipline.
- **Every Cure** — KG + ML + human-in-the-loop medical review over ~66M drug-disease pairs. We already consume their MATRIX score; their human gate is a pattern to adopt for novel synthesis.
- **Elicit** — published that humans missed most hallucinations without seeing model reasoning (argues for automated faithfulness checks).
- **OpenEvidence / OpenScholar** — iterative self-verification; OpenScholar reportedly reached expert-level citation accuracy where GPT-4o hallucinated citations most of the time (argues for a verifier loop).

Established methods worth adopting by name: RAGAS (faithfulness), FActScore (atomic-claim factuality), SciFact / MultiVerS / SciNLI (scientific claim verification), PubMedBERT-NLI, MiniCheck (cheap real-time fact-checking), GraphRAG (graph-grounded reasoning).

**Honest caveat:** the research surfaced some very recent, very specific figures (a 2026 "validation-as-a-system" pipeline claiming 95.9% → 6.5% hallucination, a MedHallu F1 of 0.985) that I have not independently verified. We should confirm those before citing them anywhere public — which is exactly the discipline this document is about.

**Net:** we are ahead of a typical early-stage team (we have citation, grounding, and structured verifiers plus provenance-bound extraction). We are behind on calibrated thresholds, a domain NLI verifier, a formal faithfulness score, Phase 3 hardening, and the two-rater study. None of those block the KG; several are *enabled* by it.

---

## 5. Recommended sequencing

**Finish first (cheap, foundational, mostly free APIs):**

1. Run the `extract-key-findings` backfill (migration 045) so Phase 2a has real data, and pull the first real grounding audit. We should not trust summaries we have not yet grounded.
2. Calibrate the 0.40 grounding threshold against a small human-labeled set (~30 pairs you label). High value, low effort.
3. Lock the extraction contract: per-source, provenance-verified atomic claims are the *only* thing allowed to enter the graph. This is the "extract" half of extract-then-synthesize and the foundation the KG sits on.

**Build with the KG (Path B):**

4. The synthesis stage as a graph-constrained, labeled, attributed layer (Section 3).
5. The faithfulness / NLI verifier on synthesis (upgrade the v0 Claude-NLI).
6. Confidence inheritance and the "never Strong on synthesis alone" rule.

**Soon, but not blocking:**

7. Phase 3 prompt hardening for any published prose.
8. Two-rater validation study and disproportionality stats (credibility, not correctness).

---

## 6. Decisions

1. Agree with the framing that cross-synthesis validation is *part of* the KG build, so we do the three foundational checks first and build synthesis-validation together with Path B (rather than fully finishing every validation item before starting the KG)?
2. For the synthesis faithfulness verifier: target PubMedBERT-NLI, a MiniCheck-style small model, or keep Claude-as-judge as v1 and swap later?
3. Do you want the human-in-the-loop review gate for novel cross-condition synthesis from day one, or only once volume warrants it?
