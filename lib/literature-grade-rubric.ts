// Literature-grade (L0 / L1 / L2 / L3) rubric used during the validation
// benchmark to grade external evidence behind every compound-condition signal.
//
// Single source of truth shared between the methodology page (this file's
// consumer) and any future audit script that re-grades the active sample.
// Surfaced on /about/methodology so the L assignment behind any signal is
// reproducible by an outside reader.
//
// When updating: edit the JSON file, NOT this module. This wrapper only
// provides types and helpers. Any change to the JSON's _meta.schema_version
// must be reflected in the methodology version tag on the page.

import data from "./literature-grade-rubric.json";

export type LGradeLevel = "L0" | "L1" | "L2" | "L3";

export type LGradeLevelEntry = {
  level: LGradeLevel;
  label: string;
  summary: string;
  inclusion_criteria: string[];
  boundary_rules: string[];
  source_attribution: string;
};

export type LGradeSearchSource = {
  query_template?: string;
  query?: string;
  compound_synonym_source?: string;
  condition_synonym_source?: string;
  filters?: string;
  exclusions?: string;
  notes?: string;
  bodies?: string[];
  condition_specific_bodies?: string;
  procedure?: string;
};

type RawData = {
  _meta: {
    schema_version: number;
    purpose: string;
    scope_note: string;
    last_reviewed: string;
    reviewers: string[];
    review_cadence: string;
  };
  search_procedure: {
    PubMed: LGradeSearchSource;
    "ClinicalTrials.gov": LGradeSearchSource;
    "Cochrane Library": LGradeSearchSource;
    "Named guideline bodies": LGradeSearchSource;
    deduplication: string;
  };
  levels: LGradeLevelEntry[];
  adjudication: {
    direction_handling: string;
    conflict_resolution: string;
    recency_and_re_execution: string;
  };
};

const raw = data as unknown as RawData;

export const L_GRADE_META = raw._meta;
export const L_GRADE_SEARCH_PROCEDURE = raw.search_procedure;
export const L_GRADE_LEVELS: LGradeLevelEntry[] = raw.levels;
export const L_GRADE_ADJUDICATION = raw.adjudication;

// Look up a single level entry. Useful for surfaces that render a specific L.
export function getLevel(level: LGradeLevel): LGradeLevelEntry | undefined {
  return L_GRADE_LEVELS.find((l) => l.level === level);
}

// Sum of boundary rules + inclusion criteria across all four levels. Used in
// the rubric summary header to show how dense the rubric is without
// expanding it.
export function totalRubricClauses(): number {
  return L_GRADE_LEVELS.reduce(
    (acc, l) => acc + l.inclusion_criteria.length + l.boundary_rules.length,
    0,
  );
}
