# Architecture Decisions — From the Competitive Review

**Purpose.** Turn the competitive-architecture review of the leading repurposing platforms (Causaly, BenevolentAI, Healx) into concrete backend decisions, and sequence them against the two docs that already govern this work: `KG-SUBSTRATE-PLAN.md` (Path A/B, milestones M1–M5) and `LLM-VALIDATION-AND-CROSS-SYNTHESIS.md` (the traceability invariant and the synthesis-validation gate). This is an engineering companion to those two docs, not a replacement. Nothing here is public-facing; the public roadmap already carries the defensible, planned subset (typed/directional graph, phase-aware relationships, sex-stratified PK, an actionability layer).

**What it is and is not.** Some claims in the source review are documented (what the incumbents ingest; Causaly's published machine-reading approach and its arrow-directionality benchmark). Others are inferences (e.g. "consensus-oriented synthesis smooths contradictions"; the BEN-2293 "pathway-redundancy" failure). Treat the inferences as design prompts, not facts. The architectural *shapes* are reliable; the specific numbers (500M facts, 100k docs/day) are marketing figures and we do not try to match them — narrow-and-deep beats broad here.

**One-line thesis.** Every incumbent's graph is broad, static, literature-only, and tuned for ownable candidates. Our edge is narrow, temporal, community-aware, and tuned for management. Four of the five decisions below exist to make *temporal* and *community-aware* real **in the schema**, because those are the two properties that cannot be bolted on after the graph is populated.

---

## Decision 1 — Edges are typed, directional, AND phase-qualified

**What.** Path B (`B1`) already gives us typed, directional edges: `drug_targets(action_type, mechanism_text)` and `target_conditions(datatype, score)`. That is the structured form of Causaly's "arrow directionality" — the thing that separates a graph that can reason from one that can only retrieve. The addition this review forces: carry an optional **cycle-phase qualifier** on efficacy/PK-bearing edges from the first migration (a nullable `phase` enum: follicular / ovulatory / luteal / menstrual / unspecified, plus a `phase_dependent` boolean), even though the data to fill it is sparse today.

**Why now.** The phase column is free to add inside the same `B1` migration that creates the edge tables. Adding it later means a second migration plus a backfill plus re-deriving every "graph supports" computation that read the un-phased edges.

**Why it can't be retrofitted.** This is the single un-patchable differentiator. Causaly, BenevolentAI, and Healx all model relationships as time-invariant. You cannot retrofit time into a populated static graph without re-modeling every edge — a relationship that flips strength or direction by cycle phase is a different edge, not an annotation on an existing one. The cost of deferring is the whole moat. (This is the schema-level version of the public `CyclicalPK` claim.)

**Sequence vs validation.** Rides on the existing traceability invariant unchanged: a phase-tagged edge still cannot exist without a complete source path (FK + NOT NULL). It does not block M1–M3; the column ships empty in `B1` and is populated as curation lands (M4). The "graph supports / silent" compute (`B3`) simply learns to read the phase qualifier when present and ignore it when null.

---

## Decision 2 — Contradictions are a stored, first-class object

**What.** `scripts/substrate/detect_contradictions.py` already detects contradictions, but only inside the isolated PMDD/PMS substrate pipeline, as a transient computation. Promote it to a stored, queryable object in the main schema: a `contradictions` table linking `claim_a`, `claim_b`, the populations each was observed in, and a `resolution_status`. A contradiction becomes a durable, citable output, not a number that got averaged away.

**Why now.** It is the natural partner of the cross-synthesis confidence rule already locked in `LLM-VALIDATION-AND-CROSS-SYNTHESIS.md` (a synthesis inherits the confidence of its weakest link and can never reach "Strong" on synthesis alone). A stored contradiction is what lets a conflict deterministically *cap* a tier rather than being lost in a blended score.

**Why it can't be retrofitted (cheaply).** If contradictions live only at synthesis time and are discarded, you can never show "the evidence conflicts" as a thing a reader can open and check, and you can't make a contradiction a hard input to tiering. This is exactly the axis on which the review claims (as an inference) that Causaly smooths to consensus — so whether or not that inference is true of them, *storing* contradictions is what makes our "surface disagreement" claim real and testable rather than rhetorical.

**Sequence vs validation.** This *is* part of the validation layer; it operationalizes the plan's "show disagreement rather than average it." It builds together with the synthesis-validation gate (the plan's Option B: build synthesis-validation *with* the graph, not before it). Bonus: a stored contradiction is a concrete object two independent raters can adjudicate, so it strengthens the planned two-rater agreement study rather than complicating it.

---

## Decision 3 — Sex-stratified PK is a table, not a boolean

**What.** Path B (`B4`) currently proposes a `sex_specific_pk` **boolean** flag on compounds, seeded from documented cases (the FDA zolpidem class). Go one step further in the same milestone: a `compound_pk` table — `(compound_id, parameter, sex, direction, magnitude, phase?, source_id)` — so "women clear zolpidem ~50% slower" is a row with a citation, not a flag. Phase-optional, so it composes with Decision 1.

**Why now.** M4 is where the sex-aware layer lands regardless. Designing the table now means M4 ships the structure; shipping a boolean now means a later migration once scoring needs more than true/false. It also grounds the public "sex-specific pharmacokinetics" claim in real, cited data instead of a flag.

**Why it can't be retrofitted (cheaply).** Once the scoring step consumes a boolean input, moving to a parameterized table means re-plumbing the scoring inputs and re-running. Cheaper to define the table now and leave it sparsely populated (the same posture as Decision 1).

**Sequence vs validation.** Every PK row carries a `source_id` — the traceability invariant again. Does not block M1–M3; it is the substance of M4. Seed it from the cases already cited publicly (zolpidem / CYP3A4) so the first rows are defensible on day one.

---

## Decision 4 — Community signal is its own subsystem

**What.** The Community Forum Reports arm exists (Reddit JSON API, six subreddits, the 0–2 replication scale, the 5-distinct-posts / exposure-outcome / unique-user inclusion bar). Treat it as a **distinct subsystem** with its own extraction path — exposure→outcome event extraction and temporal ordering from informal text, unique-user de-duplication, and credibility/replication scoring — separate from the formal-literature extractor (`scripts/substrate/extract_claims.py`), which assumes structured prose with citations.

**Why now.** It is already a live arm; drawing the subsystem boundary now prevents bolting informal-text handling onto the literature extractor, where it would degrade both.

**Why it can't be retrofitted.** Informal, longitudinal, anonymous patient text is a genuinely different NLP problem from parsing a paper: no citation anchor, self-reported timing, credibility that has to be earned per-source. This is the part the review correctly identifies as infrastructure the incumbents have no incentive to build — i.e. the moat — but it is only a moat if it is a real subsystem with its own validation, not a branch inside the literature path.

**Sequence vs validation.** Community signal stays hypothesis-only by construction: it can never reach "Strong" alone (matches both the public "never equated with a controlled trial" line and the confidence-inheritance rule). It enters cross-synthesis as a labeled, weakest-link input. It sequences **after** the formal-evidence validation is solid — the public roadmap already places the deeper version (advocacy-organization partnerships beyond Reddit) in the "Later" bucket. Do not let community work jump the validation queue.

---

## Decision 5 — Scoring has two axes: evidence and actionability

**What.** Keep the existing five-dimension evidence rubric as **Axis 1 (evidence strength)**. Add **Axis 2 (actionability)**: management-endpoint fit (daily function vs remission), 505(b)(2) regulatory viability, financial-orphan / generic status, and patient-community signal-years. Rank on both, shown side by side — never blended — exactly as the MATRIX cross-reference is already shown beside our grade rather than folded into it.

**Why now.** It turns the public management-vs-cure thesis into an engine feature instead of a slogan, and the "keep independent layers separate" discipline is already how the codebase treats MATRIX, so the pattern exists.

**Why it can't be retrofitted (cheaply).** If actionability is baked into the evidence score, you lose the ability to express "strong evidence, low actionability" (or the reverse), and you can no longer explain *why* something ranks where it does. Two axes from the start, or you re-derive every score later.

**Sequence vs validation.** This one actually *protects* the validation work. Axis 1 (evidence) is what the two-rater agreement study measures, so keeping it pure means the benchmark stays clean. Axis 2 (actionability) is a largely deterministic computation (generic status, 505(b)(2) eligibility, signal-years) that does not need the same inter-rater validation. Splitting the axes keeps the thing-being-validated unchanged.

---

## How these land on the existing milestones

- **M1 (Path A — entity resolution):** unaffected. Canonical IDs are the prerequisite for all of the above; no change to its scope.
- **M2 (Path B capture):** Decision 1's typed/directional edges are already the M2 schema; **add the nullable phase qualifier here.** Stand up the `contradictions` table (Decision 2) and the `compound_pk` table (Decision 3) as empty schema in the same migration window.
- **M3 (Path B compute — "graph supports / silent"):** teach the compute to read the phase qualifier when present; surface contradictions beside the existing MATRIX-style independent layer.
- **M4 (sex-aware):** populate `compound_pk` from documented cases; carry phase + sex-PK into the disclosure and into Axis-2 scoring.
- **M5 (later):** community-signal subsystem hardening (Decision 4) and the property-graph / Reactome / sex-stratified-weighting work already parked here. Axis-2 actionability (Decision 5) can begin as soon as 505(b)(2)/generic status is queryable, independent of M5.

Net: only Decision 1's **phase column** and the two empty tables (Decisions 2–3) need to land early, in M2, because they are schema. Everything else is population and compute that sequences naturally behind the validation gates.

---

## What we deliberately do not chase

- **Their scale and surface area.** 500M facts, 100k docs/day, the agentic product suite — those serve a broad horizontal pharma-search market we are not in. Matching breadth dilutes the only edge we have.
- **The behavioral inferences as if they were specs.** "Consensus-smoothing" and the BEN-2293 cause are hypotheses. We build contradiction-surfacing because it is right and testable, not to win an argument against a strawman.
- **A graph DB on day one.** Per the plan, the relational ("Postgres-graph") version ships first; BioCypher/Neo4j is M5 once the relational version proves its value.

---

## Decisions needed before building

1. **Phase enum scope.** Confirm the four-phase enum (follicular / ovulatory / luteal / menstrual) plus `unspecified`, vs a coarser luteal/non-luteal split for the first cut. (Coarser is cheaper to curate; finer is harder to retrofit — lean finer for the same reason as Decision 1.)
2. **Contradictions table placement.** Confirm it lives in the main schema (not the isolated substrate schema), so it can reference both literature claims and graph edges.
3. **Axis-2 inputs v1.** Confirm the minimum viable actionability inputs for a first cut (proposed: generic/financial-orphan status + 505(b)(2) eligibility), deferring community-signal-years until the subsystem in Decision 4 is real.
4. **Benchmark target.** Keep Causaly's arrow-directionality accuracy and BenchSci ASCEND's edge-level provenance/confidence-inheritance as the "would this clear their bar?" reference, consistent with `KG-SUBSTRATE-PLAN.md`.
