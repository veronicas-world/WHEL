// Per-pair literature-grade snapshot consumed by the public condition pages
// and the methodology page.
//
// Refreshed at the end of every scripts/check-matrix-coverage.py run (Phase 6
// of the audit). The wrapper only adds types and small lookup helpers.
//
// Lookup key is (compound_name, condition_name) using the canonical Supabase
// names. The live-signal pass ceils at L1; L2/L3 are only reachable through
// the validation-dossier pass, which carries the structured PMID + study_type
// + guideline_id fields the rubric requires.

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

// True when the snapshot has been generated at least once. Pages can use
// this to render either real numbers or a "snapshot pending" placeholder.
export function isPopulated(): boolean {
  return EVIDENCE_GRADING_SNAPSHOT._meta.derived_at !== null;
}
