/**
 * Whel Path C Phase 2a · summary-grounding audit snapshot.
 *
 * Reads the audit report produced by
 *   scripts/verify-summary-grounding.py
 * which computes per-sentence cosine similarity between the
 * LLM-generated summary text (sources.key_finding_excerpt) and the
 * canonical source text (PubMed abstract via NCBI E-utilities,
 * ClinicalTrials.gov briefSummary via API v2, or Reddit post body
 * via the public JSON endpoint) using Sentence-BERT.
 *
 * Pattern matches lib/citation-audit-snapshot.ts and
 * lib/database-sources-audit-snapshot.ts. isPopulated() lets the
 * disclosure page render either live numbers or the placeholder
 * block honestly.
 */

import data from "./summary-grounding-audit-snapshot.json";

export type SummaryGroundingStatus = "pending_first_run" | "ready";

export interface SummaryGroundingFlaggedExample {
  summary_sentence: string;
  max_cosine: number;
}

export interface SummaryGroundingResult {
  source_id: string;
  signal_id: string;
  source_type: string;
  external_id: string;
  status: string;
  n_sentences: number;
  min_score: number | null;
  mean_score: number | null;
  max_score: number | null;
  flagged_count: number;
  flagged_examples: SummaryGroundingFlaggedExample[];
  error: string | null;
  note: string;
}

export interface SummaryGroundingSnapshot {
  schema_version: string;
  generated_at: string | null;
  status: SummaryGroundingStatus;
  status_note?: string;
  model: string;
  similarity_threshold: number;
  summary: {
    total: number;
    by_status: Record<string, number>;
    by_source_type: Record<string, Record<string, number>>;
    sentence_total: number;
    sentences_flagged: number;
    sentence_flag_rate: number;
    mean_score_distribution: Record<string, number>;
  };
  results: SummaryGroundingResult[];
}

export const SUMMARY_GROUNDING_SNAPSHOT = data as SummaryGroundingSnapshot;

export function isPopulated(): boolean {
  return (
    SUMMARY_GROUNDING_SNAPSHOT.status === "ready" &&
    SUMMARY_GROUNDING_SNAPSHOT.generated_at !== null &&
    SUMMARY_GROUNDING_SNAPSHOT.summary.total > 0
  );
}

export function formattedDate(): string {
  const iso = SUMMARY_GROUNDING_SNAPSHOT.generated_at;
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
