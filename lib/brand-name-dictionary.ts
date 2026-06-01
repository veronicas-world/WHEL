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

export type BrandDictEntry = {
  brand: string;
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
