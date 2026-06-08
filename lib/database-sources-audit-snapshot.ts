/**
 * Whel Path C Phase 1 · database-sources audit snapshot.
 *
 * Reads the latest audit report produced by
 *   scripts/verify-database-sources.py
 * which itself reads from the export produced by
 *   scripts/export-sources-for-audit.py
 *
 * The export step must run locally because it needs Supabase
 * credentials. Tooling shipped on 2026-06-07; the snapshot file
 * starts as a `status: "pending_first_run"` placeholder and gets
 * overwritten on first successful verifier run. The
 * `isPopulated()` helper lets the disclosure page fall back to a
 * "tooling shipped, awaiting first run" block until then.
 *
 * Same pattern as lib/matrix-audit-snapshot.ts and
 * lib/citation-audit-snapshot.ts.
 */

import data from "./database-sources-audit-snapshot.json";

export type DatabaseSourcesAuditStatus =
  | "pending_first_run"
  | "ready";

export interface DatabaseSourcesAuditSummary {
  total: number;
  by_status: Record<string, number>;
  by_source_type: Record<string, Record<string, number>>;
}

export interface DatabaseSourcesAuditResult {
  source_id: string;
  signal_id: string;
  source_type: string;
  external_id: string;
  stored_title: string;
  status: string;
  canonical_title: string;
  title_similarity_score: number | null;
  error: string | null;
  note: string;
}

export interface DatabaseSourcesAuditSnapshot {
  schema_version: string;
  generated_at: string | null;
  status: DatabaseSourcesAuditStatus;
  status_note?: string;
  summary: DatabaseSourcesAuditSummary;
  results: DatabaseSourcesAuditResult[];
}

export const DATABASE_SOURCES_AUDIT_SNAPSHOT =
  data as DatabaseSourcesAuditSnapshot;

export function isPopulated(): boolean {
  return (
    DATABASE_SOURCES_AUDIT_SNAPSHOT.status === "ready" &&
    DATABASE_SOURCES_AUDIT_SNAPSHOT.generated_at !== null &&
    DATABASE_SOURCES_AUDIT_SNAPSHOT.summary.total > 0
  );
}

export function formattedDate(): string {
  const iso = DATABASE_SOURCES_AUDIT_SNAPSHOT.generated_at;
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
