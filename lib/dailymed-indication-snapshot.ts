// Per-pair DailyMed approved-indication snapshot for public display on the
// candidate cards and signal pages. Refreshed by running
// scripts/build-dailymed-indication-snapshot.mjs, which reads the FDA drug
// label (via DailyMed) for each (drug, condition) pair and writes the trimmed,
// name-keyed snapshot at lib/dailymed-indication-snapshot.json.
//
// Drug label data courtesy of the U.S. National Library of Medicine, DailyMed
// (public domain).
//
// For each pair this answers one question: is the target condition an
// FDA-APPROVED indication for the drug (an on-label use), or is the repurposing
// use off-label / investigational? A label only counts when it carries an
// FDA-approved marketing category (NDA/ANDA/BLA) — DailyMed also indexes
// dietary supplements, homeopathics, medical foods, and OTC-monograph products,
// which are not FDA-approved drugs and are treated as "no FDA label". This is
// descriptive context only, NOT regulatory advice. "Approved" means
// FDA-approved (US); non-US approvals are out of scope.

import data from "./dailymed-indication-snapshot.json";

export type LabelRelationship = "on_label" | "off_label" | "no_fda_label";

export type IndicationRecord = {
  compound_name: string;
  condition_name: string;
  has_fda_label: boolean;
  fda_approved_for_condition: boolean;
  label_relationship: LabelRelationship;
  approved_indication_excerpt: string | null;
  label_setid: string | null;
  label_title: string | null;
  label_url: string | null;
};

export type IndicationSnapshot = {
  _meta: {
    built: string;
    source: string;
    attribution: string;
    builder: string;
    note: string;
    pair_count: number;
    pair_count_on_label: number;
  };
  per_pair: IndicationRecord[];
};

export const INDICATION_SNAPSHOT = data as IndicationSnapshot;

// Name-keyed lookup index. Keys are `${compound_name}::${condition_name}`,
// lowercased so the runtime lookup is casing-insensitive (the substrate's
// stored compound/condition names do not always match the snapshot's casing).
const INDICATION_INDEX: Map<string, IndicationRecord> = (() => {
  const m = new Map<string, IndicationRecord>();
  for (const r of INDICATION_SNAPSHOT.per_pair) {
    m.set(`${r.compound_name}::${r.condition_name}`.toLowerCase(), r);
  }
  return m;
})();

// Condition-name aliases so the substrate's condition labels line up with the
// names the snapshot was built under. Mirrors the alias used by the other
// side-layers in lib/substrate-candidates.ts.
const COND_ALIAS: Record<string, string> = {
  menopause: "perimenopause & menopause",
};

// Returns the approved-indication record for the given pair, or null when the
// script never saw the pair. Casing-insensitive. Records of every
// label_relationship (including no_fda_label) are returned — the relationship
// itself is the meaningful context.
export function getIndicationForPair(
  compoundName: string | null | undefined,
  conditionName: string | null | undefined,
): IndicationRecord | null {
  if (!compoundName || !conditionName) return null;
  const cond = COND_ALIAS[conditionName.toLowerCase()] ?? conditionName;
  return INDICATION_INDEX.get(`${compoundName}::${cond}`.toLowerCase()) ?? null;
}
