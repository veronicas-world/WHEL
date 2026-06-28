// Per-pair ClinicalTrials.gov status snapshot for public display on the
// candidate cards. Refreshed by running
// scripts/build-clinicaltrials-status-snapshot.mjs, which queries the
// ClinicalTrials.gov v2 REST API per (drug, condition) pair and writes the
// trimmed, name-keyed snapshot at lib/clinicaltrials-status-snapshot.json.
//
// Trial data courtesy of the U.S. National Library of Medicine,
// ClinicalTrials.gov (public domain).
//
// The snapshot is intentionally conservative. A pair only carries a trial
// record when the drug appears as an experimental (or active-comparator)
// intervention in an INTERVENTIONAL study whose conditions match the target
// condition, with mechanistic / PK-DDI / Phase-4 post-marketing studies and
// comparator-background uses excluded. This keeps a "Trials" marker honest:
// it means the drug has been studied AS A THERAPY for this condition, not
// merely co-administered or probed mechanistically. Pairs the script saw but
// found no qualifying trial for are stored with trial_count 0 and a null
// highest_phase; the lookup helper treats those as "no marker".

import data from "./clinicaltrials-status-snapshot.json";

export type TrialActivity = "active" | "completed" | "halted" | "unknown";

export type TrialRef = {
  nctId: string;
  title: string;
  phase: string | null;
  status: string;
  url: string;
};

export type TrialStatusRecord = {
  compound_name: string;
  condition_name: string;
  trial_count: number;
  highest_phase: string | null;
  highest_phase_label: string | null;
  activity: TrialActivity;
  top_trials: TrialRef[];
};

export type TrialStatusSnapshot = {
  _meta: {
    built: string;
    source: string;
    attribution: string;
    builder: string;
    note: string;
    pair_count: number;
    pair_count_with_trials: number;
  };
  per_pair: TrialStatusRecord[];
};

export const TRIAL_STATUS_SNAPSHOT = data as TrialStatusSnapshot;

// Name-keyed lookup index. Keys are `${compound_name}::${condition_name}`,
// lowercased so the runtime lookup is casing-insensitive (the substrate's
// stored compound/condition names do not always match the snapshot's casing).
const TRIAL_INDEX: Map<string, TrialStatusRecord> = (() => {
  const m = new Map<string, TrialStatusRecord>();
  for (const r of TRIAL_STATUS_SNAPSHOT.per_pair) {
    m.set(`${r.compound_name}::${r.condition_name}`.toLowerCase(), r);
  }
  return m;
})();

// Condition-name aliases so the substrate's condition labels line up with the
// names the snapshot was built under. Mirrors MATRIX_COND_ALIAS in
// lib/substrate-candidates.ts so both side-layers key identically.
const COND_ALIAS: Record<string, string> = {
  menopause: "perimenopause & menopause",
};

// Returns the trial-status record for the given pair, or null when there is
// no qualifying trial (the script either never saw the pair, or saw it and
// found trial_count 0). Casing-insensitive.
export function getTrialStatusForPair(
  compoundName: string | null | undefined,
  conditionName: string | null | undefined,
): TrialStatusRecord | null {
  if (!compoundName || !conditionName) return null;
  const cond = COND_ALIAS[conditionName.toLowerCase()] ?? conditionName;
  const rec = TRIAL_INDEX.get(`${compoundName}::${cond}`.toLowerCase());
  if (!rec || rec.trial_count < 1) return null;
  return rec;
}
