// Per-drug FDA Orange Book supply snapshot for public display on the candidate
// cards and signal pages. Refreshed by running
// scripts/build-orangebook-status-snapshot.mjs, which downloads the FDA Orange
// Book data files and writes the trimmed, name-keyed snapshot at
// lib/orangebook-status-snapshot.json.
//
// FDA Orange Book: Approved Drug Products with Therapeutic Equivalence
// Evaluations (public domain).
//
// This is descriptive US regulatory-landscape context only — is the molecule
// available as a generic, single-source brand, only inside combination
// products, discontinued, or absent from the Orange Book entirely. It is NOT
// regulatory advice and says nothing about whether a repurposing use is
// viable. The snapshot is keyed by drug only (supply is a property of the
// molecule, independent of the target condition). Only SINGLE-INGREDIENT
// products are considered, so unexpired patents on novel branded combination
// formulations are never attributed to the base molecule.

import data from "./orangebook-status-snapshot.json";

export type OrangeBookSupply =
  | "generic"
  | "brand_patented"
  | "brand_only"
  | "discontinued"
  | "combination_only"
  | "not_listed";

export type OrangeBookProduct = {
  trade_name: string;
  applicant: string;
  appl_type: string;
  strength: string;
  status: string;
  approval_date: string;
};

export type OrangeBookRecord = {
  compound_name: string;
  fda_listed: boolean;
  supply: OrangeBookSupply;
  generic_available: boolean;
  marketed: boolean;
  latest_patent_expiry: string | null;
  marketing_status: string | null;
  products_sampled: OrangeBookProduct[];
};

export type OrangeBookSnapshot = {
  _meta: {
    built: string;
    source: string;
    attribution: string;
    builder: string;
    note: string;
    drug_count: number;
    drug_count_fda_listed: number;
  };
  per_drug: OrangeBookRecord[];
};

export const ORANGE_BOOK_SNAPSHOT = data as OrangeBookSnapshot;

// Name-keyed lookup index. Keys are the lowercased compound name (supply is a
// per-molecule fact, so no condition is involved).
const OB_INDEX: Map<string, OrangeBookRecord> = (() => {
  const m = new Map<string, OrangeBookRecord>();
  for (const r of ORANGE_BOOK_SNAPSHOT.per_drug) {
    m.set(r.compound_name.toLowerCase(), r);
  }
  return m;
})();

// Returns the Orange Book supply record for the given drug, or null when the
// script never saw the drug. Casing-insensitive. A record with
// supply "not_listed" is still returned (it is meaningful context: biologics,
// supplements, and non-US-approved drugs do not appear in the Orange Book).
export function getOrangeBookForDrug(
  compoundName: string | null | undefined,
): OrangeBookRecord | null {
  if (!compoundName) return null;
  return OB_INDEX.get(compoundName.toLowerCase()) ?? null;
}
