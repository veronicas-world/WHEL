# Local workstore and live Supabase divergence

**As of 2026-09-09**

This records the difference between the local substrate workstore and the live
Supabase project before the next refetch. They are not interchangeable stores.
The local store is the pipeline's intermediate output; Supabase is what the
site reads.

- Local store: `scripts/substrate/.work/substrate-work.db`
- Live project: Supabase project `yknwuutatjuqbitmyvhn`
- Site read path: `lib/substrate-candidates.ts`

## Shared substrate state

These counts currently match:

| Table / source | Local | Live |
|---|---:|---:|
| `documents` | 344 | 344 |
| `source_spans` | 945 | 945 |
| `contradictions` | 3 | 3 |
| AEMS documents | 54 | 54 |
| ClinicalTrials.gov documents | 30 | 30 |
| Open Targets documents | 64 | 64 |
| PubMed documents | 30 | 30 |
| Reddit documents | 146 | 146 |
| SIDER documents | 20 | 20 |

## Local-only or local-ahead state

### Post-extraction artifact/off-topic purge

The local workstore has **220 active substrate signals** and 13 non-active
rows:

- 8 `off_scope`
- 5 `off_topic`

The five `off_topic` rows are retained with reasons explaining why the
extracted claim was about a different intervention, condition, or generic
adverse event. The eight `off_scope` rows are outside the current condition
scope. This is the local post-extraction purge state.

Live Supabase instead has **226 active rows and 2 `retired` rows**. It has no
`off_scope` or `off_topic` rows. The live site therefore serves six more active
signals than the local workstore and does not contain the local purge
classification.

### Ontology promotion

The local workstore has:

- 181 entities: 170 interventions and 11 conditions
- 60 intervention ontology IDs
- all 60 IDs sourced from Open Targets as ChEMBL IDs
- 0 condition ontology IDs

Live Supabase has 191 entities: 180 interventions and 11 conditions, with
0 ontology IDs on either entity type. The local 60 Open Targets-sourced
ChEMBL IDs have not been migrated to live.

### Local signal and claim totals

| Measure | Local | Live | Difference |
|---|---:|---:|---:|
| Total `substrate_signals` rows | 233 | 228 | Local +5 |
| Active signals | 220 | 226 | Live +6 |
| Direct active rows | 121 | 129 | Live +8 |
| Pathway active rows | 87 | 87 | Equal |
| Community active rows | 12 | 10 | Local +2 |
| Claims | 447 | 465 | Live +18 |

The claim difference is concentrated in two feeds:

- PubMed: local 277 claims, live 294
- Reddit: local 16 claims, live 17
- AEMS, ClinicalTrials.gov, Open Targets, and SIDER claim counts match

## Live-only state

### Knowledge-graph tables

Live Supabase contains populated legacy graph tables that are not present in
the local substrate workstore:

- 155 targets
- 123 drug-target rows
- 132 target-condition rows

These tables are currently not consumed by the substrate candidate read path.
They therefore do not produce graph-support or graph-silent tags on the site.

### Other live supporting tables

Live Supabase also contains legacy side-layer tables that are not part of the
local substrate workstore schema:

- 6 `conditions` rows
- 136 `compounds` rows
- 8 `compound_pk` rows across 8 compounds
- 7 `compound_condition_phase` rows across 7 pairs

The PK and phase tables are read by `lib/substrate-candidates.ts`; the local
workstore does not reproduce them.

## Reconciliation plan

Reconciliation must be a reviewed, reproducible migration. The pipeline must
not write directly to production.

1. **Freeze a corpus version.** Record the refetch date, retrieval manifest,
   document hashes, and the intended active-signal set before changing either
   store.
2. **Choose the canonical substrate seed.** Diff the local and live signal
   rows by intervention, condition, arm, claim IDs, and status. Review the six
   live-only active rows and the local purge decisions rather than resolving
   the count difference by taking whichever total is larger.
3. **Reconcile claims and provenance.** Decide whether the 17 local-missing
   PubMed claims and one local-missing Reddit claim should be added to the
   canonical seed, then regenerate the reviewable SQL migration so claims,
   signal `claim_ids`, and status values agree.
4. **Apply the artifact purge deliberately.** If the local purge decisions are
   confirmed, represent them in the production substrate using the agreed
   status/rejection fields. Do not silently delete the corresponding source
   evidence.
5. **Migrate ontology IDs after review.** Add the 60 local ChEMBL IDs to live
   `entities` only through a reviewed migration, preserving
   `ontology_source = 'Open Targets'`. Build the human-review queue before
   claiming complete ontology grounding.
6. **Decide the graph boundary.** Either hydrate graph tables into a
   reproducible local snapshot or document them as a separate live legacy
   dependency. Then wire and test the graph read path before presenting graph
   support or silence to users.
7. **Reconcile side layers.** Export the live PK and phase rows into a
   reviewed, reproducible seed if the local pipeline is expected to rebuild
   the site from scratch. Otherwise keep them explicitly documented as
   live-only dependencies.
8. **Re-run all coverage audits after migration.** Refresh MATRIX, source
   validation, citation, and regulatory snapshots only after the canonical
   signal set is settled. Keep coverage displays gated by
   `SIGNALS_PUBLISHED`.

Until this process runs, the local workstore describes what the pipeline has
produced and Supabase describes what the site is serving; neither should be
called the single current corpus.
