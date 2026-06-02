// Brand-name to generic-name dictionary for the MATRIX compound crosswalk.
//
// Single source of truth shared between scripts/check-matrix-coverage.py
// (Python; reads the JSON directly) and the Next.js app (this file). Surfaced
// on /about/external-references so users can audit which brand strings the
// crosswalk recognises.
//
// When adding entries: edit the JSON file, NOT this module. This wrapper only
// provides types and helpers.

import data from "./brand-name-dictionary.json";

// Categories the audit uses to distinguish why an entry exists:
//   brand                proprietary trade name (Wellbutrin, Botox)
//   inn_variant          alternate INN/USAN spelling (paracetamol vs acetaminophen)
//   abbreviation         acronym for the generic (E4 -> estetrol)
//   salt_form            generic + dispensed salt suffix (Clomiphene Citrate)
//   formulation_variant  generic + route/form qualifier (Testosterone (transdermal))
//   combo                multi-ingredient product mapped to its primary component
export type BrandDictKind =
  | "brand"
  | "inn_variant"
  | "abbreviation"
  | "salt_form"
  | "formulation_variant"
  | "combo";

export type BrandDictEntry = {
  brand: string;
  kind: BrandDictKind;
  generic: string | null;
  drugbank_id: string | null;
  first_seen_as: string;
  note: string;
};

type RawData = {
  _meta: {
    schema_version: number;
    purpose: string;
    last_reviewed: string;
    reviewers: string[];
    scope_note: string;
  };
  entries: BrandDictEntry[];
};

const raw = data as RawData;

export const BRAND_DICT_META = raw._meta;
export const BRAND_DICT_ENTRIES: BrandDictEntry[] = raw.entries;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Look up a brand string and return the generic name (or null if the brand
// is in the dictionary but has no matched generic, e.g. medical-device combos).
export function lookupBrand(input: string): BrandDictEntry | undefined {
  const n = normalize(input);
  return BRAND_DICT_ENTRIES.find((e) => normalize(e.brand) === n);
}

// Count of entries that resolve to a real DrugBank ID (excludes the
// documentation-only rows like UBIGEL Donna).
export function activeBrandCount(): number {
  return BRAND_DICT_ENTRIES.filter((e) => e.drugbank_id !== null).length;
}

// Tally entries by kind, for transparency surfaces. Documentation-only rows
// (generic === null) are excluded from the totals so the counts reflect actual
// rescues available to the crosswalk.
export function countByKind(): Record<BrandDictKind, number> {
  const init: Record<BrandDictKind, number> = {
    brand: 0,
    inn_variant: 0,
    abbreviation: 0,
    salt_form: 0,
    formulation_variant: 0,
    combo: 0,
  };
  for (const e of BRAND_DICT_ENTRIES) {
    if (e.drugbank_id === null) continue;
    init[e.kind] += 1;
  }
  return init;
}
