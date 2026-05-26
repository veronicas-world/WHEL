"use client";

import { useState } from "react";
import ExternalLinkIcon from "../../components/ExternalLinkIcon";
import { toArmKey, ARM_LABELS, type ArmKey } from "@/lib/arm-mapping";

// ── Types ────────────────────────────────────────────────────────────────────

interface Source {
  id: string;
  source_type: string | null;
  external_id: string | null;
  title: string | null;
  authors: string | null;
  journal: string | null;
  publication_date: string | null;
  url: string | null;
  key_finding_excerpt: string | null;
}

export interface Signal {
  id: string;
  signal_type: string | null;
  evidence_strength: string | null;
  confidence_tier: string | null;
  replication_score: number | null;
  source_quality_score: number | null;
  specificity_score: number | null;
  plausibility_score: number | null;
  direction_score: number | null;
  total_evidence_score: number | null;
  effect_direction: string | null;
  replication_level: string | null;
  plausibility_level: string | null;
  summary: string | null;
  mechanism_hypothesis: string | null;
  status: string | null;
  compounds: {
    name: string;
    generic_name: string | null;
    drug_class: string | null;
    fda_status: string | null;
  } | null;
  sources: Source[];
}

// ── Constants ────────────────────────────────────────────────────────────────

type TierKey = "strong" | "moderate" | "emerging" | "exploratory";

const TIERS: { key: TierKey; label: string; fill: string; soft: string }[] = [
  { key: "strong",      label: "STRONG",      fill: "var(--tier-strong)",           soft: "var(--tier-strong-soft)"      },
  { key: "moderate",    label: "MODERATE",    fill: "var(--tier-moderate)",         soft: "var(--tier-moderate-soft)"    },
  { key: "emerging",    label: "EMERGING",    fill: "var(--tier-emerging)",         soft: "var(--tier-emerging-soft)"    },
  { key: "exploratory", label: "EXPLORATORY", fill: "var(--tier-exploratory)",      soft: "var(--tier-exploratory-soft)" },
];

const ARMS: { key: ArmKey; label: string; fill: string }[] = [
  { key: "direct",    label: ARM_LABELS.direct,    fill: "var(--arm-direct)"    },
  { key: "cross",     label: ARM_LABELS.cross,     fill: "var(--arm-cross)"     },
  { key: "pathway",   label: ARM_LABELS.pathway,   fill: "var(--arm-pathway)"   },
  { key: "community", label: ARM_LABELS.community, fill: "var(--arm-community)" },
];

const DIRECTION_LABELS: Record<string, string> = {
  improves: "Improves condition",
  worsens:  "May worsen condition",
  mixed:    "Mixed effects",
  unclear:  "Unclear",
};

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreToLevel(score: number | null, dimension: string): string {
  if (score == null) return "—";
  if (dimension === "direction") {
    return score >= 2 ? "Consistent" : score >= 1 ? "Mixed" : "Inconsistent";
  }
  return score >= 2 ? "High" : score >= 1 ? "Moderate" : "Low";
}

function getSourceLabels(sources: Source[]): string {
  const parts: string[] = [];
  const types = new Set(sources.map((s) => s.source_type));
  if (types.has("pubmed") || types.has("clinical_trial_finding") || types.has("review_article")) parts.push("PubMed");
  if (types.has("faers") || types.has("sider")) parts.push("FDA AEMS");
  if (types.has("opentargets")) parts.push("Open Targets");
  return parts.join(" · ");
}

function getStudyCount(sources: Source[]): number {
  return sources.filter((s) =>
    s.source_type === "pubmed" ||
    s.source_type === "clinical_trial_finding" ||
    s.source_type === "review_article"
  ).length;
}

function getDirectionLabel(signal: Signal): string {
  if (!signal.effect_direction || signal.effect_direction === "unclear") return "";
  return DIRECTION_LABELS[signal.effect_direction] ?? signal.effect_direction;
}

function getTierInfo(tier: string | null) {
  if (!tier) return null;
  return TIERS.find((t) => t.key === tier.toLowerCase()) ?? null;
}

function getArmInfo(signal_type: string | null) {
  const arm = toArmKey(signal_type) ?? "direct";
  return ARMS.find((a) => a.key === arm) ?? ARMS[0];
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TierFilterChip({
  tier,
  active,
  count,
  onClick,
}: {
  tier: TierKey;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const info = TIERS.find((t) => t.key === tier)!;
  return (
    <button
      onClick={onClick}
      style={{
        ...MONO,
        fontSize: 10,
        letterSpacing: "0.1em",
        padding: "5px 10px",
        background: active ? info.fill : info.soft,
        color: active ? "var(--paper)" : info.fill,
        border: `1px solid ${info.fill}`,
        cursor: "pointer",
        whiteSpace: "nowrap" as const,
        transition: "background 0.1s, color 0.1s",
      }}
    >
      {info.label}
      <span
        style={{
          marginLeft: 5,
          opacity: 0.7,
          fontSize: 9,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) return null;
  const pct = Math.min(100, (score / 10) * 100);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          display: "inline-block",
          width: 80,
          height: 4,
          background: "var(--rule-strong)",
          position: "relative" as const,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute" as const,
            left: 0, top: 0, bottom: 0,
            width: `${pct}%`,
            background: "var(--ink)",
          }}
        />
      </span>
      <span style={{ ...MONO, fontSize: 12, color: "var(--ink)" }}>
        {score}/10
      </span>
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...MONO,
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--muted)",
        marginBottom: 6,
      }}
    >
      {children}
    </p>
  );
}

// ── CollapsibleSources ───────────────────────────────────────────────────────

function CollapsibleSources({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;

  const seenUrls = new Set<string>();
  const deduped = sources.filter((s) => {
    if (!s.url) return true;
    if (seenUrls.has(s.url)) return false;
    seenUrls.add(s.url);
    return true;
  });

  const pubmed  = deduped.filter((s) => s.source_type === "pubmed");
  const faers   = deduped.filter((s) => s.source_type === "faers");
  const reddit  = deduped.filter((s) => s.source_type === "reddit");
  const ot      = deduped.filter((s) => s.source_type === "opentargets");
  const other   = deduped.filter(
    (s) => !["pubmed", "faers", "reddit", "opentargets"].includes(s.source_type ?? "")
  );

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
      <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 12 }}>
        CITATIONS · {deduped.length}
      </p>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.8125rem",
          color: "var(--accent)",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          ...MONO,
          letterSpacing: "0.04em",
        }}
      >
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {open ? "Hide" : "View"} citations ({deduped.length})
      </button>

      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* PubMed */}
          {pubmed.length > 0 && (
            <div>
              {(faers.length > 0 || ot.length > 0) && (
                <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 8 }}>
                  PUBLISHED RESEARCH
                </p>
              )}
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {pubmed.map((s) => (
                  <li key={s.id} style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--ink-2)" }}>
                    {s.url ? (
                      <a
                        href={s.url} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--accent)", fontWeight: 500 }}
                      >
                        <strong>{s.title ?? s.external_id ?? s.url}</strong>
                      </a>
                    ) : (
                      <strong style={{ color: "var(--ink)" }}>{s.title ?? s.external_id ?? "Source"}</strong>
                    )}
                    {s.authors && <span style={{ color: "var(--muted)" }}> · {s.authors}</span>}
                    {s.journal && <em style={{ color: "var(--muted)" }}>, {s.journal}</em>}
                    {s.publication_date && (
                      <span style={{ color: "var(--muted)" }}> · {s.publication_date.slice(0, 4)}</span>
                    )}
                    {s.external_id && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${s.external_id}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--muted)", marginLeft: 4, ...MONO, fontSize: 11 }}
                      >
                        · PMID {s.external_id}
                      </a>
                    )}
                    {s.key_finding_excerpt && (
                      <p style={{ marginTop: 4, fontStyle: "italic", color: "var(--muted-2)" }}>
                        &ldquo;{s.key_finding_excerpt}&rdquo;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAERS */}
          {faers.length > 0 && (
            <div>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 8 }}>
                FDA ADVERSE EVENT MONITORING SYSTEM
              </p>
              {(() => {
                const query = faers.find((s) => (s.external_id ?? "").startsWith("FAERS-QUERY-"));
                const rows  = faers.filter((s) => !(s.external_id ?? "").startsWith("FAERS-QUERY-"));
                return (
                  <>
                    {query && (
                      <div
                        style={{
                          padding: "8px 12px",
                          marginBottom: 8,
                          fontSize: "0.8125rem",
                          background: "var(--bg-2)",
                          border: "1px solid var(--rule)",
                          color: "var(--ink-2)",
                          lineHeight: 1.5,
                        }}
                      >
                        {(query.title ?? "").replace(/^FDA \w+ Database Query:\s*/i, "")}
                        {query.url && (
                          <a
                            href={query.url} target="_blank" rel="noopener noreferrer"
                            style={{ marginLeft: 8, color: "var(--muted)", ...MONO, fontSize: 10 }}
                          >
                            FDA AEMS <ExternalLinkIcon />
                          </a>
                        )}
                      </div>
                    )}
                    {rows.length > 0 && (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                        {rows.map((s) => (
                          <li
                            key={s.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 12px",
                              background: "var(--bg-2)",
                              border: "1px solid var(--rule)",
                              fontSize: "0.8125rem",
                              color: "var(--ink-2)",
                            }}
                          >
                            <span>{(s.title ?? "").replace(/^[A-Z]{2,}:\s*/, "")}</span>
                            {s.url && (
                              <a
                                href={s.url} target="_blank" rel="noopener noreferrer"
                                style={{ marginLeft: 12, color: "var(--muted)", ...MONO, fontSize: 10, flexShrink: 0 }}
                              >
                                verify <ExternalLinkIcon />
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p style={{ marginTop: 6, ...MONO, fontSize: 10, color: "var(--muted-2)" }}>
                      Reactions with 2+ reports shown.
                    </p>
                  </>
                );
              })()}
            </div>
          )}

          {/* Reddit */}
          {reddit.length > 0 && (
            <div>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 8 }}>
                COMMUNITY POSTS
              </p>
              {(() => {
                const grouped: Record<string, Source[]> = {};
                for (const s of reddit) {
                  const sub = s.external_id ?? "unknown";
                  if (!grouped[sub]) grouped[sub] = [];
                  grouped[sub].push(s);
                }
                return Object.entries(grouped).map(([sub, posts]) => (
                  <div key={sub} style={{ marginBottom: 10 }}>
                    <p style={{ ...MONO, fontSize: 10, color: "var(--muted)", marginBottom: 6 }}>r/{sub}</p>
                    <ul style={{ listStyle: "none", padding: "0 0 0 12px", margin: 0, borderLeft: "2px solid var(--rule)" }}>
                      {posts.map((s) => (
                        <li key={s.id} style={{ fontSize: "0.8125rem", marginBottom: 4, lineHeight: 1.5 }}>
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                              {s.title ?? s.url}
                            </a>
                          ) : (
                            <span style={{ color: "var(--ink-2)" }}>{s.title ?? "Reddit post"}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Open Targets */}
          {ot.length > 0 && (
            <div>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 8 }}>
                OPEN TARGETS PLATFORM
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {ot.map((s) => (
                  <li key={s.id} style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--ink-2)" }}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 500 }}>
                        {s.title ?? s.external_id ?? s.url} <ExternalLinkIcon />
                      </a>
                    ) : (
                      <strong style={{ color: "var(--ink)" }}>{s.title ?? s.external_id ?? "Open Targets"}</strong>
                    )}
                    {s.key_finding_excerpt && (
                      <p style={{ marginTop: 4, fontStyle: "italic", color: "var(--muted-2)" }}>
                        &ldquo;{s.key_finding_excerpt}&rdquo;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Other */}
          {other.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {other.map((s) => (
                <li key={s.id} style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--ink-2)" }}>
                  <strong style={{ color: "var(--ink)" }}>{s.title ?? s.external_id ?? "Source"}</strong>
                  {s.journal && <em style={{ color: "var(--muted)" }}>, {s.journal}</em>}
                </li>
              ))}
            </ul>
          )}

        </div>
      )}
    </div>
  );
}

// ── SignalCard ────────────────────────────────────────────────────────────────

function SignalCard({
  signal,
  signalId,
}: {
  signal: Signal;
  signalId: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const tierInfo  = getTierInfo(signal.confidence_tier);
  const armInfo   = getArmInfo(signal.signal_type);
  const direction = getDirectionLabel(signal);
  const sourceLabel = getSourceLabels(signal.sources);
  const studyCount  = getStudyCount(signal.sources);

  const hasScore = signal.total_evidence_score != null && signal.total_evidence_score > 0;
  const hasDetails =
    signal.mechanism_hypothesis ||
    (signal.replication_score != null) ||
    signal.sources.length > 0;

  // Scoring dimensions
  const dims = [
    {
      label: "REPLICATION",
      level: signal.replication_level ?? scoreToLevel(signal.replication_score, "replication"),
      score: signal.replication_score,
    },
    {
      label: "SOURCEQUALITY",
      level: scoreToLevel(signal.source_quality_score, "source_quality"),
      score: signal.source_quality_score,
    },
    {
      label: "SPECIFICITY",
      level: scoreToLevel(signal.specificity_score, "specificity"),
      score: signal.specificity_score,
    },
    {
      label: "PLAUSIBILITY",
      level: signal.plausibility_level ?? scoreToLevel(signal.plausibility_score, "plausibility"),
      score: signal.plausibility_score,
    },
    {
      label: "DIRECTION",
      level: scoreToLevel(signal.direction_score, "direction"),
      score: signal.direction_score,
    },
  ];

  const compoundName = signal.compounds?.name ?? "Unknown compound";
  const genericName  = signal.compounds?.generic_name;
  const showGeneric  = genericName && genericName !== compoundName;

  return (
    <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 24, paddingBottom: 24 }}>

      {/* Top row: arm eyebrow + tier chip */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
        <span
          style={{
            ...MONO,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: armInfo.fill,
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          {armInfo.label}
        </span>

        {tierInfo && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 8px",
              background: tierInfo.fill,
              color: "var(--paper)",
              ...MONO,
              fontSize: 10,
              letterSpacing: "0.1em",
              flexShrink: 0,
            }}
          >
            <span style={{ width: 7, height: 7, background: "var(--paper)", display: "inline-block" }} />
            {signal.confidence_tier?.toUpperCase()}
          </span>
        )}
      </div>

      {/* H3: compound name */}
      <h3
        className="font-heading"
        style={{
          fontSize: "1.375rem",
          fontWeight: 500,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          color: "var(--ink)",
          marginBottom: 16,
        }}
      >
        {compoundName}
        {showGeneric && (
          <span style={{ ...MONO, fontSize: "0.8em", color: "var(--muted)", fontWeight: 400, marginLeft: 6 }}>
            ({genericName})
          </span>
        )}
      </h3>

      {/* Score row */}
      {hasScore && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px 16px",
            marginBottom: 20,
            fontSize: "0.8125rem",
            color: "var(--ink-2)",
            ...MONO,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--muted)", fontSize: 11 }}>Score</span>
            <ScoreBar score={signal.total_evidence_score} />
          </span>

          {direction && (
            <span>
              <span style={{ color: "var(--muted)", fontSize: 11 }}>Direction</span>
              <span style={{ color: "var(--muted)", margin: "0 4px" }}>·</span>
              <span style={{ color: "var(--ink-2)", fontStyle: "italic", fontFamily: "inherit" }}>{direction}</span>
            </span>
          )}

          {sourceLabel && (
            <span>
              <span style={{ color: "var(--muted)", fontSize: 11 }}>Source</span>
              <span style={{ color: "var(--muted)", margin: "0 4px" }}>·</span>
              {sourceLabel}
            </span>
          )}

          {studyCount > 0 && (
            <span>
              <span style={{ color: "var(--muted)", fontSize: 11 }}>Studies</span>
              <span style={{ color: "var(--muted)", margin: "0 4px" }}>·</span>
              {studyCount}
            </span>
          )}

          {signal.compounds?.fda_status && (
            <span
              style={{
                padding: "2px 7px",
                border: "1px solid var(--rule-strong)",
                color: "var(--ink-2)",
                fontSize: 10,
              }}
            >
              {signal.compounds.fda_status}
            </span>
          )}

          {signal.compounds?.drug_class && (
            <span
              style={{
                padding: "2px 7px",
                border: "1px solid var(--rule-strong)",
                color: "var(--ink-2)",
                fontSize: 10,
              }}
            >
              {signal.compounds.drug_class}
            </span>
          )}
        </div>
      )}

      {/* Summary */}
      {signal.summary && (
        <div style={{ marginBottom: expanded ? 20 : 0 }}>
          <FieldLabel>Summary</FieldLabel>
          <p
            className="font-heading"
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.7,
              color: "var(--ink-2)",
              fontStyle: "italic",
            }}
          >
            {signal.summary}
          </p>
        </div>
      )}

      {/* Expanded sections */}
      {expanded && (
        <>
          {signal.mechanism_hypothesis && (
            <div style={{ marginTop: 20 }}>
              <FieldLabel>Hypothesized Mechanism</FieldLabel>
              <p
                className="font-heading"
                style={{
                  fontSize: "0.9375rem",
                  lineHeight: 1.7,
                  color: "var(--ink-2)",
                  fontStyle: "italic",
                }}
              >
                {signal.mechanism_hypothesis}
              </p>
            </div>
          )}

          {/* Scoring dimensions */}
          {dims.some((d) => d.score != null) && (
            <div style={{ marginTop: 20 }}>
              <FieldLabel>Scoring Dimensions</FieldLabel>
              <div
                className="grid grid-cols-2 sm:grid-cols-5"
                style={{
                  gap: 0,
                  borderTop: "1px solid var(--rule)",
                  marginTop: 4,
                }}
              >
                {dims.map((dim) => (
                  <div
                    key={dim.label}
                    style={{
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingRight: 8,
                    }}
                  >
                    <p
                      style={{
                        ...MONO,
                        fontSize: 9.5,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        marginBottom: 4,
                      }}
                    >
                      {dim.label}
                    </p>
                    <p
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        lineHeight: 1.2,
                      }}
                    >
                      {dim.level}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citations */}
          <CollapsibleSources sources={signal.sources} />
        </>
      )}

      {/* Footer */}
      {hasDetails && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20,
            paddingTop: 12,
            borderTop: "1px solid var(--rule)",
          }}
        >
          <span style={{ ...MONO, fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>
            SIGNAL · {signalId}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              ...MONO,
              fontSize: 11,
              color: "var(--ink-2)",
              background: "none",
              border: "1px solid var(--rule-strong)",
              padding: "4px 10px",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {expanded ? "Collapse" : "Open detail"}
            <span style={{ fontSize: 9 }}>{expanded ? "▴" : "▾"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ResearchSignalsTabs({
  signals,
  signalIds,
}: {
  signals: Signal[];
  signalIds: Record<string, string>;
}) {
  const [activeTier, setActiveTier] = useState<TierKey | null>(null);
  const [activeArm,  setActiveArm]  = useState<ArmKey | null>(null);

  // Tier counts always reflect full set
  const tierTotals = TIERS.reduce(
    (acc, t) => ({
      ...acc,
      [t.key]: signals.filter(
        (s) => (s.confidence_tier?.toLowerCase() ?? "exploratory") === t.key
      ).length,
    }),
    {} as Record<TierKey, number>
  );

  // Arm counts reflect active tier filter
  const tierFiltered = activeTier
    ? signals.filter((s) => (s.confidence_tier?.toLowerCase() ?? "exploratory") === activeTier)
    : signals;

  const armCounts = ARMS.reduce(
    (acc, a) => ({
      ...acc,
      [a.key]: tierFiltered.filter((s) => (toArmKey(s.signal_type) ?? "direct") === a.key).length,
    }),
    {} as Record<ArmKey, number>
  );

  // Final filtered list (tier AND arm)
  const visible = tierFiltered.filter(
    (s) => !activeArm || (toArmKey(s.signal_type) ?? "direct") === activeArm
  );

  function clearFilters() {
    setActiveTier(null);
    setActiveArm(null);
  }

  return (
    <div>
      {/* Tier filter chips — right-aligned */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {TIERS.map((t) => (
          <TierFilterChip
            key={t.key}
            tier={t.key}
            active={activeTier === t.key}
            count={tierTotals[t.key]}
            onClick={() => setActiveTier(activeTier === t.key ? null : t.key)}
          />
        ))}
      </div>

      {/* Arm tabs — underline style */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--rule)",
          marginBottom: 0,
          overflowX: "auto",
        }}
        className="no-scrollbar"
      >
        {/* All tab */}
        <button
          onClick={() => setActiveArm(null)}
          style={{
            ...MONO,
            fontSize: 12,
            letterSpacing: "0.04em",
            padding: "10px 16px 10px 0",
            marginRight: 24,
            background: "none",
            border: "none",
            borderBottom: activeArm === null ? "2px solid var(--ink)" : "2px solid transparent",
            color: activeArm === null ? "var(--ink)" : "var(--muted)",
            cursor: "pointer",
            whiteSpace: "nowrap" as const,
            marginBottom: -1,
          }}
        >
          All{" "}
          <span style={{ opacity: 0.6 }}>{tierFiltered.length}</span>
        </button>

        {ARMS.map((arm) => {
          const count = armCounts[arm.key];
          const isActive = activeArm === arm.key;
          return (
            <button
              key={arm.key}
              onClick={() => setActiveArm(isActive ? null : arm.key)}
              style={{
                ...MONO,
                fontSize: 12,
                letterSpacing: "0.04em",
                padding: "10px 16px 10px 0",
                marginRight: 24,
                background: "none",
                border: "none",
                borderBottom: isActive ? `2px solid ${arm.fill}` : "2px solid transparent",
                color: isActive ? "var(--ink)" : "var(--muted)",
                cursor: "pointer",
                whiteSpace: "nowrap" as const,
                marginBottom: -1,
              }}
            >
              {arm.label}{" "}
              <span style={{ opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Signal list */}
      {visible.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center" as const }}>
          <p
            style={{
              ...MONO,
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--muted)",
              marginBottom: 12,
            }}
          >
            NO SIGNALS · TRY ANOTHER FILTER
          </p>
          <button
            onClick={clearFilters}
            style={{
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div>
          {visible.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              signalId={signalIds[signal.id] ?? signal.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
