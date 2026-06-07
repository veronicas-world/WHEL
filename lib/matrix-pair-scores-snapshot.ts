// Per-pair MATRIX score snapshot for public display on
// /conditions/[slug] signal cards. Refreshed by running
// scripts/check-matrix-coverage.py and then extracting the per-pair
// records into the trimmed public snapshot at
// lib/matrix-pair-scores-snapshot.json.
//
// The full audit at scripts/audit-output/matrix-coverage-report.json is
// the source of truth; this file is the trimmed, name-keyed view used by
// the chip render in app/conditions/[slug]/ResearchSignalsTabs.tsx.
//
// Only pairs where MATRIX returned a score are included. Pairs that are
// 'matrix silent' (compound not in MATRIX's drug list, or score below
// MATRIX's publication threshold) are not in the snapshot and the lookup
// helper returns null for them, which the chip render treats as 'no chip'.

import data from "./matrix-pair-scores-snapshot.json";

export type MatrixPairScore = {
  compound_name: string;
  condition_name: string;
  matrix_source_id: string | null;
  matrix_mondo: string | null;
  // MATRIX's transformed treat-score; in our audit range it is
  // approximately 3.1 to 4.5. Higher is better.
  transformed_score: number | null;
  // MATRIX's quantile rank within all 39.5M MATRIX pairs. Lower is
  // better: 0.0 = top of MATRIX's rankings, 1.0 = bottom. Multiply by
  // 100 for a 'top N percent' percentile when rendering.
  quantile_rank: number | null;
};

export type MatrixPairSnapshot = {
  _meta: {
    audit_date: string | null;
    source_report: string;
    audit_script: string;
    pair_count_in_audit: number;
    pair_count_with_score: number;
  };
  per_pair: MatrixPairScore[];
};

export const MATRIX_PAIR_SNAPSHOT = data as MatrixPairSnapshot;

// Name-keyed lookup index. Keys are `${compound_name}::${condition_name}`,
// matching the same casing as the audit script's records.
const PAIR_INDEX: Map<string, MatrixPairScore> = (() => {
  const m = new Map<string, MatrixPairScore>();
  for (const p of MATRIX_PAIR_SNAPSHOT.per_pair) {
    m.set(`${p.compound_name}::${p.condition_name}`, p);
  }
  return m;
})();

// Returns the per-pair MATRIX score record for the given pair, or null if
// the pair was not scored by MATRIX (the 'matrix silent' case). Casing on
// compound and condition names must match what Whel stores in the
// repurposing_signals row.
export function getMatrixScoreForPair(
  compoundName: string | null | undefined,
  conditionName: string | null | undefined,
): MatrixPairScore | null {
  if (!compoundName || !conditionName) return null;
  return PAIR_INDEX.get(`${compoundName}::${conditionName}`) ?? null;
}

// Formats a quantile rank for display: a quantile_rank of 0.079 becomes
// 'Top 8%', 0.51 becomes 'Top 51%'. Floors at 'Top 1%' to avoid the
// confusing 'Top 0%' edge case when a pair sits at the very top of
// MATRIX's rankings.
export function formatMatrixPercentile(qr: number): string {
  const pct = Math.max(1, Math.round(qr * 100));
  return `Top ${pct}%`;
}
