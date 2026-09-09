import { supabase } from "@/lib/supabase";
import { getCandidates } from "@/lib/substrate-candidates";
import { MATRIX_AUDIT_SNAPSHOT } from "@/lib/matrix-audit-snapshot";
import { CITATION_AUDIT_SNAPSHOT } from "@/lib/citation-audit-snapshot";
import { DATABASE_SOURCES_AUDIT_SNAPSHOT } from "@/lib/database-sources-audit-snapshot";
import { INDICATION_SNAPSHOT } from "@/lib/dailymed-indication-snapshot";
import { ORANGE_BOOK_SNAPSHOT } from "@/lib/orangebook-status-snapshot";
import { TRIAL_STATUS_SNAPSHOT } from "@/lib/clinicaltrials-status-snapshot";

export type SourceCoverage = {
  documents: number;
  claims: number;
};

export type CoverageDisclosure = {
  pairCount: number;
  conditionCount: number;
  entities: {
    interventions: number;
    conditions: number;
    interventionOntologyIds: number;
    conditionOntologyIds: number;
  };
  matrix: {
    scoredPairs: number;
    activePairs: number;
    eligibleMatchedCompounds: number;
    eligibleCompounds: number;
    rescuedCompounds: number;
  };
  sexPkPairs: number;
  phasePairs: number;
  guidelineSignals: number | null;
  contradictionRows: number | null;
  graph: {
    targets: number;
    drugTargets: number;
    targetConditions: number;
  };
  sourceCoverage: Record<string, SourceCoverage>;
  regulatory: {
    dailymedPairs: number;
    dailymedOnLabel: number;
    orangeBookDrugs: number;
    orangeBookListed: number;
    trialPairs: number;
    trialPairsWithTrials: number;
  };
  citationAudit: {
    manifestTotal: number;
    manifestMatched: number;
    sourceTotal: number;
    sourceRegistryMatches: number;
    sourceFormatOnly: number;
  };
};

function sourceName(value: unknown): string {
  return value ? String(value) : "unknown";
}

export async function getCoverageDisclosure(): Promise<CoverageDisclosure> {
  const [candidates, documentsResult, claimsResult, guidelinesResult, entitiesResult, contradictionsResult, graphResult] = await Promise.all([
    getCandidates(),
    supabase.from("documents").select("source"),
    supabase.from("claims").select("documents(source)"),
    supabase
      .from("sources")
      .select("signal_id, guideline_id, guideline_strength, guideline_certainty")
      .eq("study_type", "guideline"),
    supabase.from("entities").select("type, ontology_id"),
    supabase.from("contradictions").select("id", { count: "exact", head: true }),
    Promise.all([
      supabase.from("targets").select("id", { count: "exact", head: true }),
      supabase.from("drug_targets").select("id", { count: "exact", head: true }),
      supabase.from("target_conditions").select("id", { count: "exact", head: true }),
    ]),
  ]);

  const sourceCoverage = new Map<string, SourceCoverage>();
  for (const row of (documentsResult.data ?? []) as Array<{ source?: unknown }>) {
    const source = sourceName(row.source);
    const current = sourceCoverage.get(source) ?? { documents: 0, claims: 0 };
    current.documents += 1;
    sourceCoverage.set(source, current);
  }
  for (const row of (claimsResult.data ?? []) as Array<{ documents?: { source?: unknown } | Array<{ source?: unknown }> }>) {
    const document = Array.isArray(row.documents) ? row.documents[0] : row.documents;
    const source = sourceName(document?.source);
    const current = sourceCoverage.get(source) ?? { documents: 0, claims: 0 };
    current.claims += 1;
    sourceCoverage.set(source, current);
  }

  const guidelineSignals = guidelinesResult.error
    ? null
    : new Set(
        (guidelinesResult.data ?? [])
          .filter((row) => row.guideline_id && row.guideline_strength && row.guideline_certainty)
          .map((row) => row.signal_id)
          .filter(Boolean),
      ).size;
  const entities = (entitiesResult.data ?? []) as Array<{ type?: unknown; ontology_id?: unknown }>;

  return {
    pairCount: candidates.length,
    conditionCount: new Set(candidates.map((candidate) => candidate.conditionId ?? candidate.condition)).size,
    entities: {
      interventions: entities.filter((row) => row.type === "intervention").length,
      conditions: entities.filter((row) => row.type === "condition").length,
      interventionOntologyIds: entities.filter(
        (row) => row.type === "intervention" && row.ontology_id,
      ).length,
      conditionOntologyIds: entities.filter(
        (row) => row.type === "condition" && row.ontology_id,
      ).length,
    },
    matrix: {
      scoredPairs: Number(MATRIX_AUDIT_SNAPSHOT.headline.pairs_with_matrix_score ?? 0),
      activePairs: Number(MATRIX_AUDIT_SNAPSHOT.headline.active_pairs ?? 0),
      eligibleMatchedCompounds: Number(MATRIX_AUDIT_SNAPSHOT.headline.compounds_eligible_matched ?? 0),
      eligibleCompounds: Number(MATRIX_AUDIT_SNAPSHOT.headline.compounds_eligible_total ?? 0),
      rescuedCompounds: Number(MATRIX_AUDIT_SNAPSHOT.headline.compounds_rescued_by_brand_dict ?? 0),
    },
    sexPkPairs: candidates.filter((candidate) => candidate.sexPk?.length).length,
    phasePairs: candidates.filter((candidate) => candidate.cyclePhase?.length).length,
    guidelineSignals,
    contradictionRows: contradictionsResult.error ? null : contradictionsResult.count ?? 0,
    graph: {
      targets: Number(graphResult[0].count ?? 0),
      drugTargets: Number(graphResult[1].count ?? 0),
      targetConditions: Number(graphResult[2].count ?? 0),
    },
    sourceCoverage: Object.fromEntries(sourceCoverage),
    regulatory: {
      dailymedPairs: INDICATION_SNAPSHOT._meta.pair_count,
      dailymedOnLabel: INDICATION_SNAPSHOT._meta.pair_count_on_label,
      orangeBookDrugs: ORANGE_BOOK_SNAPSHOT._meta.drug_count,
      orangeBookListed: ORANGE_BOOK_SNAPSHOT._meta.drug_count_fda_listed,
      trialPairs: TRIAL_STATUS_SNAPSHOT._meta.pair_count,
      trialPairsWithTrials: TRIAL_STATUS_SNAPSHOT._meta.pair_count_with_trials,
    },
    citationAudit: {
      manifestTotal: CITATION_AUDIT_SNAPSHOT.summary.total,
      manifestMatched: CITATION_AUDIT_SNAPSHOT.summary.resolved_match,
      sourceTotal: DATABASE_SOURCES_AUDIT_SNAPSHOT.summary.total,
      sourceRegistryMatches: DATABASE_SOURCES_AUDIT_SNAPSHOT.summary.by_status.resolved_match ?? 0,
      sourceFormatOnly: DATABASE_SOURCES_AUDIT_SNAPSHOT.summary.by_status.format_only_pass ?? 0,
    },
  };
}

export function sourceCoverageFor(
  coverage: CoverageDisclosure | null,
  source: string,
): SourceCoverage | null {
  return coverage?.sourceCoverage[source] ?? null;
}
