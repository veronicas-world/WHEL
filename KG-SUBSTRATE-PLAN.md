# Knowledge-Graph Substrate — Implementation Plan

**Goal:** turn the public "corrected, sex-aware knowledge graph" promise into a real backend, by resolving the data to canonical identifiers (Path A) and then capturing and querying the drug–target–disease structure we already fetch (Path B).

**Scope:** the existing six conditions and their active signals. No new conditions in this work.

**Sequencing:** Path A first (it is the prerequisite), then Path B. Both can ship in small, verifiable migrations.

---

## Decisions locked (approved)

1. **Build approach: Option B.** We do not finish every validation item before starting. We lock the foundational traceability checks first, then build the synthesis-validation together with the graph (Path B), because the synthesis faithfulness gate is *defined by* the synthesis stage and cannot be finished before it exists. See `LLM-VALIDATION-AND-CROSS-SYNTHESIS.md`.

2. **Traceability is a schema-enforced invariant, not a test.** Every claim the platform makes — extracted or synthesized — must trace to a specific source with specific citations. This is enforced at the database level: a synthesized claim row **cannot exist** without at least one linked source claim or graph edge (foreign keys + NOT NULL). Anything the synthesis stage cannot fully attribute is dropped and never shown unsourced. This is the non-negotiable constraint.

3. **Cross-synthesis is enabled,** but only as a separate, labeled object that runs over already-validated atomic claims and real graph edges, carries its evidence path, passes a faithfulness check, inherits the confidence of its weakest link, and can never reach "Strong" on synthesis alone.

4. **Benchmarks.** When a rigor question is genuinely open, the reference points are **Causaly** (provenance/evidence matrix, hallucination filtering, cited-by-default) and **BenchSci ASCEND** (neuro-symbolic KG with edge-level provenance and confidence inheritance). "Would this clear their bar?" is the test.

---

## Where we are today (from the audit)

The live schema is four flat tables: `conditions`, `compounds`, `repurposing_signals`, `sources`. Drug–condition links exist as foreign keys on `repurposing_signals`, but there are no target, gene, or pathway entities and no edge tables. Mechanism lives only as free text (`compounds.mechanism_of_action`, `repurposing_signals.mechanism_hypothesis`).

Canonical identifiers are almost entirely absent. `compounds` has no ChEMBL, DrugBank, or RxNorm column; ChEMBL IDs appear only inside `sources.external_id` for Open Targets rows (10 backfilled by migration 044). Conditions are name/slug only on the table, **but** `lib/conditions-ontology.json` already carries curated MONDO / EFO / Open-Targets disease IDs for all six. The MATRIX cross-reference (`lib/matrix-pair-scores-snapshot.json`) is keyed by `compound_name::condition_name` strings, which is brittle.

The substrate pipeline (migrations 046–049, `scripts/substrate/`) and its `ground_entities.py` already do RxNorm + MONDO resolution, but only on the PMDD/PMS substrate `entities` table, isolated from the main `compounds`/`conditions` tables.

**The key opening:** `scripts/opentargets-pipeline.js` already fetches `associatedTargets` (Ensembl gene IDs + `datatypeScores`: genetic / known_drug / literature / animal_model) and `mechanismsOfAction` (action type + target IDs), then summarizes them with a Claude call and stores only the summary. The graph is already coming over the wire. We are discarding it.

---

## Path A — Make the real data canonical (entity resolution)

Turns names into stable IDs so everything downstream (MATRIX joins, the graph, dedupe) becomes ID-based instead of string-based.

**A1 · Schema migration.** Add nullable canonical-ID columns:
- `compounds`: `chembl_id`, `drugbank_id`, `rxcui`, `atc_code`, `resolution_status` (`resolved` / `ambiguous` / `unresolved`).
- `conditions`: `mondo_id`, `efo_id` (materialized from `lib/conditions-ontology.json`).

**A2 · Resolution scripts** (reuse `ground_entities.py` patterns; all free APIs, no Claude calls):
- Compounds → ChEMBL via the Open Targets / ChEMBL search API, and → RxNorm via RxNav (already used in `ground_entities.py`). Attach `drug_class` / ATC / known-target metadata where the API returns it.
- Conditions → read the already-curated IDs from `conditions-ontology.json` into the table.
- Output is a generated migration (the established write path), not direct DB writes.

**A3 · Human-review gate.** Anything that does not resolve to exactly one ID is written with `resolution_status = 'ambiguous'/'unresolved'` and listed in a review CSV. Nothing is silently guessed. This closes the structured-hallucination class the methodology already flags.

**A4 · Wire the app reads.** Update `lib/candidates.ts` and the MATRIX/grading lookups so joins key on `chembl_id` + `mondo_id` rather than display names. This immediately hardens the MATRIX cross-reference (note: MATRIX uses CHEBI/UNII, so a small ChEMBL↔CHEBI crosswalk may be needed — flag and confirm coverage).

**A5 · Verify.** Resolution-rate report (how many of the ~135 compounds and 6 conditions resolved), the unresolved review list, `tsc --noEmit`, and a render check that condition/candidate pages still read correctly.

**Cost:** free external APIs only (ChEMBL, RxNav, EBI OLS, Open Targets). No Claude credits.

---

## Path B — Build the graph over the six (capture, then compute)

**B1 · Node + edge schema.**
- `targets` (`ensembl_gene_id`, `hgnc_symbol`, `uniprot_id`, `approved_name`).
- `drug_targets` (`compound_id`, `target_id`, `action_type`, `mechanism_text`).
- `target_conditions` (`target_id`, `condition_id`, `datatype` ∈ genetic/known_drug/literature/animal_model, `score`) — this is the structured form of Open Targets `datatypeScores`, currently dropped.
- (Optional, later) `pathways` + `target_pathways` via Reactome.

**B2 · Open Targets "store-all" rewrite.** Change `opentargets-pipeline.js` to persist the structured `associatedTargets` / `mechanismsOfAction` rows it already retrieves, instead of summarizing them. This is the core change and it has a bonus: storing structured data directly removes a Claude summarization call, so it *reduces* API spend rather than adding it.

**B3 · Graph-derived disclosure ("graph supports / graph silent").** For each drug–condition signal, compute whether the drug targets a gene that Open Targets associates with the condition (a join over `drug_targets` × `target_conditions`). A first useful cut lives entirely in Postgres — no Neo4j required — and yields, per signal, either "graph supports, via target X" or "graph silent." Surface it beside the existing MATRIX chip in the same independent-layer shape. (BioCypher / a real property graph is a later phase once the relational version proves its value.)

**B4 · The sex-aware layer (the differentiation).** This is partly curation; be honest that it does not exist yet. First cut: a `female_specific` flag on conditions (already true for the six) and a `sex_specific_pk` flag on compounds seeded from documented cases (e.g., the FDA zolpidem dosing class). Carry these into the disclosure and scoring so the graph reads female biology rather than inheriting a male-default graph wholesale. Deeper sex-stratified edge weighting is a follow-on.

**B5 · Surface in the app.** Add the "graph supports" disclosure to the gated signal view (and condition pages, behind the access wall where the drugs live). Public pages stay drug-free.

**B6 · Verify.** Edge-count and coverage report per condition, spot-check a handful of "graph supports" calls against Open Targets directly, `tsc`, render check.

---

## Milestones

- **M1 (Path A):** ID columns + resolution scripts + review gate + app rewired to ID-based joins.
- **M2 (Path B capture):** node/edge tables + Open Targets store-all rewrite, populated for the six.
- **M3 (Path B compute):** "graph supports / silent" disclosure computed and surfaced beside MATRIX.
- **M4 (sex-aware):** female-specific and sex-PK flags carried into the disclosure.
- **M5 (later):** BioCypher property graph, Reactome pathways, sex-stratified weighting.

---

## Conventions & guardrails

- **Traceability invariant (non-negotiable):** no claim, extracted or synthesized, exists or displays without a complete source path. Enforce it in the schema (FK + NOT NULL), so an unsourced claim cannot be stored, not merely flagged by a verifier.
- **Writes go through generated migration `.sql` files** applied in Supabase Studio. Never write to the DB directly.
- **`AGENTS.md`:** this is a customized Next.js. Read `node_modules/next/dist/docs/` before any app-layer change; pages are server components.
- **Credits:** Path A and B's capture step are free-API; the only place Claude is involved today (Open Targets summarization) gets *cheaper*, not more expensive. If any step would burn credits, stop and surface it.
- **Gating:** the graph and any drug-level disclosure stay behind the access wall; public condition pages remain aggregate-only.
- **Branch:** continue on `design-redesign` (or a new `kg-substrate` branch if you'd prefer to isolate it).

---

## Decisions needed before building

1. **Branch:** keep this on `design-redesign`, or spin up a `kg-substrate` branch?
2. **MATRIX re-keying:** confirm we want the ChEMBL↔CHEBI/UNII crosswalk in Path A, or leave MATRIX name-keyed for now and re-key in M2.
3. **Graph engine:** agree to ship the relational ("Postgres-graph") version first and defer BioCypher/Neo4j to M5, rather than standing up a graph DB on day one.
