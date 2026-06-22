# Whel substrate — evidence-arm ingestion spec (v1, DRAFT for review)

How the **pathway** and **community** arms get their evidence INTO the substrate (the
document → source_span → claim → verify → score pipeline), without abandoning the
substrate's provenance discipline. The **direct** arm (PubMed) is already built and
validated; together they are the **three evidence arms**. (Cross-condition is deliberately
**not** an evidence arm — see §4 — it becomes a separate derived-hypotheses lens later.)
Companion to `SCORING_SPEC.md` (which defines how each arm is *scored*); this defines how
each arm is *ingested*.

Nothing here runs until you choose to. This is the blueprint.

---

## 0. The one principle: reuse the fetch, not the synthesis

The legacy pipeline already fetches all of this across the six conditions, with public
APIs:

| Arm | Legacy fetcher (reusable data access) | Source |
|---|---|---|
| pathway | `scripts/opentargets-pipeline.js` + `lib/conditions-ontology.json` | Open Targets GraphQL (drug–target–disease associations) |
| pathway | `scripts/openfda-pipeline.js` (+ `GYNAE_TERMS`, female-only query) | FDA **AEMS** — the FDA Adverse Event Reporting System, **formerly FAERS** (openFDA API); adverse-event disproportionality |
| pathway | `scripts/sider-pipeline.js` | SIDER drug-label side effects |
| community | `scripts/reddit-pipeline.js` (condition→subreddit map, treatment queries) | Reddit public search (no auth) |

*(There are **three evidence arms**: direct, pathway, community. "Cross-condition" is NOT an
evidence arm — it never existed in legacy (table dropped in migration 034) and is inherently
inferential; it becomes a separate derived-hypotheses lens later. See §4.)*

But every legacy pipeline ends by having the model **synthesize a finished free-text
signal** — the cross-synthesis blending the substrate exists to replace. So we **keep the
data access** (the queries, the condition→subreddit map, the AEMS female filter, the
rate limits) and **discard the synthesis**, routing the raw fetched data through the
substrate's claim pipeline instead.

---

## 1. Two provenance modes (the key architectural addition)

The substrate gets a second way to hold provenance, so structured data fits the same
pipeline.

**TEXT sources** (PubMed, Reddit) — unchanged. `documents.raw_text` is the real source
text; each claim carries a VERBATIM quote located by character offset in that text.

**STRUCTURED sources** (Open Targets, AEMS, SIDER) — the database record *is* the
document. We **deterministically render** the record into a fixed-format sentence and
store *that* as `documents.raw_text`; the raw record (fields + database version) lives in
`documents.meta`. Claims then quote the rendered sentence exactly like any text. Two
verifications, at two times:

- **Rendering ↔ record** is guaranteed at **ingestion**: we own the template, the render
  is deterministic (same record → same sentence, fixed field order), and we render
  straight from the fetched record. No model authored it.
- **Claim ↔ quote** is the **usual** substrate check: the extracted claim must quote the
  rendered sentence verbatim, and a claim that overreaches its quote is rejected.

So the chain stays intact: claim → verbatim quote → rendered sentence
(`documents.raw_text`) → record (`documents.external_id` + `meta`, with DB version).
"Model proposes, substrate verifies" still holds — the model never gets to invent the
structured fact, only to extract atomic claims from a sentence we generated from the real
record.

**No schema change.** Structured-vs-text is **derived from the source**: a single known set
`STRUCTURED_SOURCES = {opentargets, aems, sider}` (in `config.py`) is the one source of
truth, so there's no `source_kind` column that could drift out of sync with the source.
For structured documents, `documents.meta` carries `record` (the raw fields) and
`source_version`; `raw_text` is the deterministically rendered sentence. Text sources
(pubmed, reddit) are everything not in the structured set.

---

## 2. Pathway arm — Open Targets + AEMS (+ SIDER)

Reuse `opentargets-pipeline.js`'s GraphQL query and `conditions-ontology.json`; reuse
`openfda-pipeline.js`'s AEMS query pattern, female-only filter, and gynae reaction terms.
For each fetched record, render a deterministic statement and store it as a structured
document tagged with its condition and `arm='pathway'` evidence (the scorer derives the
arm from source; see `score_claims.arm_for_source`).

**Open Targets render template (fixed; `aspect='other'`, mechanistic plausibility):**
> "Per Open Targets (retrieved {snapshot}), {drug} (a {drugType}) is a clinical candidate
> for {condition} (maximum clinical stage {stage}); its mechanism of action is {moa} on
> target {target}."

**AEMS render template (fixed; `aspect='safety'`; caveat MANDATORY and never stripped):**
> "In FDA AEMS (the FDA Adverse Event Reporting System, formerly FAERS; retrieved
> {snapshot}), {n} report(s) of {event} were recorded for {drug} among female patients (of
> {total} female reports for {drug} in the analysed sample). This is a raw adverse-event
> report count, not a disproportionality statistic or evidence of causation, and is subject
> to reporting bias and confounding."

Two decisions made during the build:
- **Counts, not ROR.** The legacy AEMS fetcher pulls raw report counts, not
  disproportionality statistics (ROR/PRR). We render the honest count and explicitly say it
  is *not* a disproportionality statistic — we do not fabricate a statistic we didn't
  compute. (A future increment could add proper disproportionality math.)
- **Condition-aware events.** AEMS is queried only for the candidate drugs already in the
  substrate (from Open Targets / direct), and only **condition-relevant** adverse events are
  kept (`_CONDITION_EVENTS`): endometriosis surfaces pelvic/menstrual events, menopause hot
  flushes, PMDD mood symptoms — not generic high-count AEs like "headache." A drug with no
  condition-relevant signal contributes nothing, which is the honest outcome.

**Dual read (safety + mechanistic lead), held together.** An adverse effect is read two
ways: a safety consideration, and — because it is accidental in-human proof the drug
perturbs a system relevant to the condition — a *mechanistic lead* for repurposing (the
"reverse-translation" paradigm; Campillos 2008, SIDER; cf. Whel's own original Pathway
Insights framing and the Tamoxifen→adenomyosis→estrogen-pathway example). Both readings are
structural in the rendered sentence so neither can be stripped, and the lead clause is
hedged ("not evidence of benefit") because over-reading adverse events as mechanism is the
documented trap (confounding by indication, reporting bias — a large fraction of
sex-associated AE signals are artifacts). The claim carries `reading: [safety,
mechanistic_lead]` in meta. It stays in the **pathway** arm (NOT a separate stream) — a
separate stream would invite double-counting and tempt splitting the harm from the lead,
which must be held together. This matches how Open Targets, BenevolentAI, Healx and MASE
all fold adverse-event data into mechanistic evidence rather than siloing it.

The AEMS caveat sentence is part of the document text, so the deterministic claim inherits
the framing and can never assert causation. Female-applicability for AEMS is inherently F1
(we query female reports). Structured claims are constructed **deterministically** (the
render IS the claim, quoted verbatim, pre-verified) — no model call — so the pathway fetch
is free; only the downstream scoring spends credits.

Then: chunk → extract (a pathway-tuned extraction prompt: extract the
association/signal as an atomic claim, no overreach) → verify → score under the pathway
rubric already in `SCORING_SPEC §2`.

---

## 3. Community arm — Reddit

Reuse `reddit-pipeline.js`'s condition→subreddit map, treatment-focused queries, polite
rate limiting, and User-Agent. But instead of synthesizing a signal, store **each post and
each comment as its own TEXT document**, tagged with `condition`, `thread_id`, `author`,
`parent_id`, `created_utc`, and `score` in `meta` — so the scorer can compute independence
and stance (`SCORING_SPEC §2 community`, §4).

- `documents.raw_text` = the post/comment body (real text, real verbatim quotes).
- chunk → extract with a **community-tuned** prompt (first-person patient report of a
  drug's effect on the condition; verbatim quote; no overreach) → verify.
- Scoring applies the community rubric: same-thread replies discounted for independence,
  disagreeing replies feed consistency and surface as patient-reported contradictions,
  manipulation signals (timing bursts, new accounts, near-duplicate phrasing) cap the
  score. Stance is a model signal, not a verdict; high-disagreement pairs flag for review.

---

## 4. Cross-condition — a DERIVED HYPOTHESES LENS, not an evidence arm (decided; built later)

**Decision (founder, after two research passes):** cross-condition is **not** one of Whel's
evidence arms. There are **three evidence arms — Direct, Pathway, Community — all
verbatim-provenance, all observed.** Cross-condition is inherently *inferential*: no source
ever says "drug X treats condition Y"; it is a leap ("X helps condition A; A shares a
mechanism with Y; therefore maybe Y"). That leap can't carry a verbatim quote, and dressing
inference as evidence is the documented failure mode (e.g. hydroxychloroquine for COVID;
mechanism-transfer hypotheses clear Phase II <~10% of the time). No credible repurposing
platform treats indication-transfer as an evidence type — Open Targets exposes it as
*indirect* (ontology-propagated) predictions behind a `direct=false` filter, DrugRepoBank
keeps a separate "Prediction" module, Every Cure validates predictions against clinical
evidence before they count.

So cross-condition value (which is real — statins→dysmenorrhoea is a legitimate lead) is
captured **later**, as a clearly-labelled **derived-hypotheses lens layered on top of** the
three evidence arms, never a visual peer to them. When built, it must: show its full
inference chain (source condition + the shared mechanism, both with their own provenance +
why the transfer might fail), be labelled "hypothesis / prediction — not evidence," carry a
hedged confidence (not an evidence grade), and live in a visually distinct layer. It is NOT
scored on the five evidence dimensions; it is a prediction surface. Out of scope for the
current build; revisited after the three evidence arms are standing and calibrated.

---

## 5. Build order & division of labour

1. **Structured-source set** in `config.py` (`STRUCTURED_SOURCES`), no schema column. *Done.*
2. **Pathway arm** — Open Targets + AEMS fetch-and-render → structured documents. *Done
   (you run the fetch (free) + extraction/scoring (model spend)).*
3. **Community arm** — Reddit fetch → text documents + community extraction. *Claude
   builds; you run.*
4. Then the **full six-condition, THREE-arm run**, the §9 calibration, and the frontend
   wiring.
5. **(Later, optional)** the cross-condition derived-hypotheses lens (§4) — a separate
   prediction surface, not an evidence arm, built after the three arms are calibrated.

Pathway is first: the ingestion pattern is cleanest, the APIs are clean and already
wired, and mechanistic evidence is what powers the "thin clinical, strong mechanism"
signals that justify the surface-unvalidated rule — the core of Whel's premise.

---

## 6. Honest caveats

- **Structured rendering must stay deterministic.** Fixed templates, fixed field order; if
  the same record could render two ways, provenance blurs. We template once and never let
  the model rewrite the rendering.
- **AEMS is not causation.** The caveat is structural (in the text), not a UI footnote.
- **Open Targets aggregates heterogeneous sources.** The render names the datasources and
  the build version so a reader can trace it; we verify the rendering, not Open Targets'
  upstream quality.
- **Reddit is ToS-sensitive and noisy.** Public-search only, polite rate limits, store
  provenance per post; the manipulation caps and independence discount exist precisely
  because this arm is the most game-able.
- **Community/pathway female-applicability differs by arm** — women's-health forums and
  AEMS female-report queries are inherently F1; Open Targets associations are
  sex-agnostic unless the mechanism is female-specific.
