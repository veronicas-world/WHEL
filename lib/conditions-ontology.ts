// Canonical condition-to-ontology mapping for Whel.bio.
//
// Single source of truth for the six Whel conditions and the disease
// ontology identifiers we reference across the app, the audit scripts,
// and the data pipelines.
//
// JSON sidecar (lib/conditions-ontology.json) is the actual data store
// so that scripts/check-matrix-coverage.py (Python) and the Node
// pipelines under scripts/*.js can read the same canonical record
// without going through this TypeScript wrapper. Keep the two files in
// sync; the test in scripts/check-matrix-coverage.py phase 2 will fail
// loudly if a MONDO id_or_label drifts.
//
// When refreshing label_snapshot or candidate_mondo_ids, edit the JSON
// file. This module only adds types and convenience helpers.

import data from "./conditions-ontology.json";

export type MondoCandidate = {
  id: string;
  label_snapshot: string;
  relation: "parent" | "child" | "phenotype" | "related" | "subtype";
  use_note: string;
};

export type ConditionOntology = {
  slug: string;
  whel_short_name: string;
  display_name: string;
  mondo_primary: string;
  mondo_primary_label_snapshot: string;
  mondo_candidates: MondoCandidate[];
  efo_primary: string | null;
  efo_primary_label_snapshot: string | null;
  // Open Targets disease ID actually used by scripts/opentargets-pipeline.js.
  // May differ from mondo_primary (e.g. PMDD uses the MONDO parent term in
  // OT; menopause uses a GO process term as a known issue). Always paired
  // with opentargets_disease_id_note when non-trivial.
  opentargets_disease_id: string | null;
  opentargets_disease_id_note: string | null;
  opentargets_aliases: string[];
  search_terms: string[];
  ontology_gap_note: string | null;
  matrix_official_filter: boolean | null;
};

type RawData = {
  _meta: {
    schema_version: number;
    purpose: string;
    last_reviewed: string;
    reviewers: string[];
  };
  conditions: ConditionOntology[];
};

const raw = data as RawData;

export const CONDITIONS_ONTOLOGY: ConditionOntology[] = raw.conditions;
export const CONDITIONS_ONTOLOGY_META = raw._meta;

export function bySlug(slug: string): ConditionOntology | undefined {
  return CONDITIONS_ONTOLOGY.find((c) => c.slug === slug);
}

// All MONDO IDs we consider for a given condition (primary + candidates).
// Useful when querying MATRIX or any disease-keyed dataset where we want
// to count any candidate as coverage for the Whel-level condition.
export function allMondoIds(c: ConditionOntology): string[] {
  return [c.mondo_primary, ...c.mondo_candidates.map((m) => m.id)];
}
