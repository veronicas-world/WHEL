// MATRIX coverage snapshot for public display on /about/external-references.
//
// Refreshed at the end of every scripts/check-matrix-coverage.py run, which
// writes the post-run values back into the JSON sidecar. The TS wrapper
// only adds types and a small `isPopulated()` helper used by the page to
// fall back to a placeholder block when the snapshot has not been generated
// since this file was created.

import data from "./matrix-audit-snapshot.json";

export type MatrixDatasetEntry = {
  repo: string;
  sha: string | null;
  last_modified: string | null;
};

export type MatrixHeadline = {
  compounds_total: number | null;
  compounds_matched_raw: number | null;
  compound_match_rate_raw: number | null;
  compounds_eligible_total: number | null;
  compounds_eligible_matched: number | null;
  compound_match_rate_adjusted: number | null;
  compounds_excluded_class_label: number | null;
  compounds_excluded_non_drug: number | null;
  compounds_rescued_by_brand_dict: number | null;
  conditions_total: number | null;
  conditions_confirmed_in_mondo: number | null;
  active_pairs: number | null;
  eligible_pairs_adjusted: number | null;
  pairs_with_matrix_score: number | null;
  coverage_rate_over_eligible_adjusted: number | null;
  coverage_rate_over_all_active: number | null;
};

export type MatrixPerCondition = {
  condition: string;
  mondo: string;
  matrix_official_filter: boolean | null;
  predictions_in_audit: number;
  note: string | null;
};

export type MatrixScoreDistribution = {
  n: number | null;
  min: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  max: number | null;
  mean: number | null;
};

export type MatrixAuditSnapshot = {
  _meta: {
    schema_version: number;
    purpose: string;
    snapshot_label: string;
    audit_date: string | null;
    audit_script: string;
    audit_output_report: string;
  };
  dataset_snapshot: Record<string, MatrixDatasetEntry>;
  headline: MatrixHeadline;
  per_condition: MatrixPerCondition[];
  score_distribution: MatrixScoreDistribution;
};

export const MATRIX_AUDIT_SNAPSHOT = data as MatrixAuditSnapshot;

// True when the audit has been run at least once since this file was
// created. The page uses this to render either the real numbers or a
// "snapshot pending" placeholder.
export function isPopulated(): boolean {
  return MATRIX_AUDIT_SNAPSHOT._meta.audit_date !== null;
}
