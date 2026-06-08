/**
 * Whel Path C Phase 2b · structured-sources audit snapshot.
 *
 * Reads the audit report produced by
 *   scripts/verify-structured-sources.py
 * which verifies LLM-extracted claims against the canonical
 * structured record at the publisher:
 *   - AEMS reaction counts against openFDA's drug/event endpoint
 *   - Open Targets target attributions against the OT GraphQL
 *     drug record's linkedTargets list
 *
 * Pattern matches lib/citation-audit-snapshot.ts,
 * lib/database-sources-audit-snapshot.ts, and
 * lib/summary-grounding-audit-snapshot.ts.
 */

import data from "./structured-sources-audit-snapshot.json";

export type StructuredSourcesStatus = "pending_first_run" | "ready";

export interface StructuredSourceResult {
  source_id: string;
  signal_id: string;
  source_type: string;
  external_id: string;
  status: string;
  claimed_count: number | null;
  actual_count: number | null;
  claimed_target: string | null;
  claimed_score: number | null;
  actual_target_count: number | null;
  error: string | null;
  note: string;
}

export interface StructuredSourcesSnapshot {
  schema_version: string;
  generated_at: string | null;
  status: StructuredSourcesStatus;
  status_note?: string;
  summary: {
    total: number;
    by_status: Record<string, number>;
    by_source_type: Record<string, Record<string, number>>;
  };
  results: StructuredSourceResult[];
}

export const STRUCTURED_SOURCES_SNAPSHOT =
  data as StructuredSourcesSnapshot;

export function isPopulated(): boolean {
  return (
    STRUCTURED_SOURCES_SNAPSHOT.status === "ready" &&
    STRUCTURED_SOURCES_SNAPSHOT.generated_at !== null &&
    STRUCTURED_SOURCES_SNAPSHOT.summary.total > 0
  );
}

export function formattedDate(): string {
  const iso = STRUCTURED_SOURCES_SNAPSHOT.generated_at;
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
