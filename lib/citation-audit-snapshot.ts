/**
 * Whel Path C Phase 1 · citation audit snapshot.
 *
 * Reads the latest audit report produced by
 *   scripts/verify-citations.py
 * and exposes typed accessors for the external-references page.
 *
 * The script writes scripts/audit-output/citation-audit-report.json
 * on every run; this module re-exports it at build time so the live
 * disclosure on /about/external-references stays in sync with the
 * actual verification result without a separate copy step.
 *
 * Schema is stable across versions but consumers should treat
 * unrecognized fields as forward-compatible. See methodology v3.6
 * (Path C definition) and v3.8 (Path C Phase 1 going live).
 */

import reportJson from "./citation-audit-snapshot.json";

export interface CitationAuditFieldResult {
  field: string;
  claimed: unknown;
  canonical: unknown;
  matches: boolean;
  similarity?: number | null;
}

export interface CitationAuditResult {
  key: string;
  identifier_type: string;
  identifier_value: string;
  status: "resolved_match" | "resolved_mismatch" | "unresolved";
  canonical: Record<string, unknown> | null;
  fields: CitationAuditFieldResult[];
  error: string | null;
}

export interface CitationAuditSnapshot {
  schema_version: string;
  generated_at: string;
  summary: {
    total: number;
    resolved_match: number;
    resolved_mismatch: number;
    unresolved: number;
  };
  results: CitationAuditResult[];
}

export const CITATION_AUDIT_SNAPSHOT = reportJson as CitationAuditSnapshot;

export function citationAuditResolutionRate(): number {
  const { total, resolved_match } = CITATION_AUDIT_SNAPSHOT.summary;
  if (total === 0) return 0;
  return resolved_match / total;
}

export function citationAuditFormattedDate(): string {
  const iso = CITATION_AUDIT_SNAPSHOT.generated_at;
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
