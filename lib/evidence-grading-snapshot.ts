// Per-pair literature-grade snapshot consumed by the public condition pages
// and the methodology page.
//
// Refreshed at the end of every scripts/check-matrix-coverage.py run (Phase 6
// of the audit). The wrapper only adds types and small lookup helpers.
//
// Lookup key is (compound_name, condition_name) using the canonical Supabase
// names. As of migration 041 + scripts/classify-sources-study-type.py, the
// live-signal pass can reach L2 directly when a pubmed row has PMID +
// study_type ∈ {RCT, SR/MA} + non-empty primary_endpoint_text. L3 is still
// only reachable through the validation-dossier pass, since L3 requires
// curated guideline_id / strength / certainty fields the classifier cannot
// derive.

import data from "./evidence-grading-snapshot.json";
import type { LGradeLevel } from "./literature-grade-rubric";

export type EvidenceGradingPerPair = {
  compound_id: string;
  compound_name: string;
  condition_id: string;
  condition_name: string;
  max_supportable_L: LGradeLevel;
  signal_count: number;
};

export type EvidenceGradingDistribution = Record<LGradeLevel, number>;

export type EvidenceGradingValidationRow = {
  row_id: string;
  compound: string;
  condition: string;
  signal_type: string | null;
  max_supportable_L: LGradeLevel;
  pmid_count: number;
  nct_count: number;
  has_rct_marker: boolean;
  has_sr_or_ma_marker: boolean;
  guideline_entry_count: number;
  guideline_names_compound: boolean;
};

export type EvidenceGradingSnapshot = {
  _meta: {
    schema_version: number;
    purpose: string;
    rubric_path: string;
    rubric_schema_version: number;
    rubric_last_reviewed: string;
    derived_at: string;
    audit_script: string;
    live_ceiling_note: string;
  };
  live_signal_grading: {
    signals_graded: number;
    distribution: EvidenceGradingDistribution;
    live_ceiling: LGradeLevel;
    live_ceiling_reason: string;
    attribution_violations_count: number;
  };
  validation_dossier_grading: {
    rows_graded: number;
    distribution: EvidenceGradingDistribution;
    below_l1_floor: string[];
    per_row: EvidenceGradingValidationRow[];
  };
  per_pair: EvidenceGradingPerPair[];
  per_condition_pair_distribution: Record<string, EvidenceGradingDistribution>;
};

export const EVIDENCE_GRADING_SNAPSHOT = data as EvidenceGradingSnapshot;

// Ordered list of L-grade levels in low → high order. Re-exported so consumers
// don't need to recreate it. The audit script enforces this exact ordering.
export const L_GRADE_LEVELS_ORDER: readonly LGradeLevel[] = ["L0", "L1", "L2", "L3"] as const;

// Build a fast lookup map keyed by `${compound_name}::${condition_name}` so
// SignalCard does not run a linear find() on every render. The snapshot is
// imported once at module init, so this map is built once per page load.
const PAIR_INDEX: Map<string, LGradeLevel> = (() => {
  const m = new Map<string, LGradeLevel>();
  for (const p of EVIDENCE_GRADING_SNAPSHOT.per_pair) {
    m.set(`${p.compound_name}::${p.condition_name}`, p.max_supportable_L);
  }
  return m;
})();

// Per-condition L-grade distribution computed from per_pair rather than read
// from per_condition_pair_distribution directly. The two reasons:
//   1. per_pair is canonical-keyed (matches Supabase's condition.name field),
//      while per_condition_pair_distribution uses an abbreviated key set
//      ("PCOS" instead of "Polycystic Ovary Syndrome (PCOS)"). Computing from
//      per_pair keeps the lookup key identical to the chip lookup key on
//      /conditions/[slug] so a single Supabase condition.name string indexes
//      both surfaces.
//   2. If per_pair ever drifts from per_condition_pair_distribution (e.g. a
//      partial audit re-run), the consumer always sees the per_pair truth.
const CONDITION_INDEX: Map<string, EvidenceGradingDistribution> = (() => {
  const m = new Map<string, EvidenceGradingDistribution>();
  for (const p of EVIDENCE_GRADING_SNAPSHOT.per_pair) {
    let dist = m.get(p.condition_name);
    if (!dist) {
      dist = { L0: 0, L1: 0, L2: 0, L3: 0 };
      m.set(p.condition_name, dist);
    }
    dist[p.max_supportable_L] += 1;
  }
  return m;
})();

// Returns the max-supportable L grade for the given pair, or null if the
// pair is not in the snapshot (e.g. a brand-new signal added since the last
// audit run, or a compound/condition name that does not match canonical
// casing). Callers should render the chip only when this is non-null.
export function getLGradeForPair(
  compoundName: string | null | undefined,
  conditionName: string | null | undefined,
): LGradeLevel | null {
  if (!compoundName || !conditionName) return null;
  return PAIR_INDEX.get(`${compoundName}::${conditionName}`) ?? null;
}

// Returns the L-grade distribution for the given canonical condition name,
// computed across every pair (compound × this condition) in the snapshot.
// Returns an all-zero distribution if the condition is not in the snapshot.
// Callers can total the four counts to recover the per-condition pair count
// in the audit (which equals the number of active compound-condition pairs
// indexed for that condition at audit time).
export function getLGradeDistributionForCondition(
  conditionName: string | null | undefined,
): EvidenceGradingDistribution {
  if (!conditionName) return { L0: 0, L1: 0, L2: 0, L3: 0 };
  return CONDITION_INDEX.get(conditionName) ?? { L0: 0, L1: 0, L2: 0, L3: 0 };
}

// True when the snapshot has been generated at least once. Pages can use
// this to render either real numbers or a "snapshot pending" placeholder.
export function isPopulated(): boolean {
  return EVIDENCE_GRADING_SNAPSHOT._meta.derived_at !== null;
}
