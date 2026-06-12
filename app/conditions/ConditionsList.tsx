import Link from "next/link";
import type { LGradeLevel } from "@/lib/literature-grade-rubric";

type TierKey = "strong" | "moderate" | "emerging" | "exploratory";

export type ConditionWithStats = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  conditionCode: string;
  totalSignals: number;
  tierCounts: Record<TierKey, number>;
  lGradeCounts: Record<LGradeLevel, number>;
};

// ── Visual constants ─────────────────────────────────────────────────────────

const TIER_BAR: Record<TierKey, string> = {
  strong: "var(--tier-strong)",
  moderate: "var(--tier-moderate)",
  emerging: "var(--tier-emerging)",
  exploratory: "var(--tier-exploratory)",
};

const TIER_ORDER: TierKey[] = ["strong", "moderate", "emerging", "exploratory"];

// L-grade bar colors. Same tokens as the chip on /conditions/[slug] so the
// two surfaces read as a single visual family. Order is low → high so the
// stacked bar reads L0 (left) → L3 (right), matching the rubric's ascent.
const L_GRADE_BAR: Record<LGradeLevel, string> = {
  L0: "var(--lgrade-l0)",
  L1: "var(--lgrade-l1)",
  L2: "var(--lgrade-l2)",
  L3: "var(--lgrade-l3)",
};

const L_GRADE_ORDER: LGradeLevel[] = ["L0", "L1", "L2", "L3"];

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
};

// ── Card ─────────────────────────────────────────────────────────────────────

function ConditionCard({ c }: { c: ConditionWithStats }) {
  const total = c.totalSignals;
  const lGradeTotal =
    c.lGradeCounts.L0 + c.lGradeCounts.L1 + c.lGradeCounts.L2 + c.lGradeCounts.L3;
  // Render high → low so L3 (rarest, strongest) appears first when present.
  const lGradeCountsLine = ([...L_GRADE_ORDER].reverse() as LGradeLevel[])
    .map((l) => ({ level: l, count: c.lGradeCounts[l] }))
    .filter((x) => x.count > 0)
    .map((x) => `${x.count} ${x.level}`)
    .join(" · ");

  return (
    <Link
      href={`/conditions/${c.slug}`}
      style={{
        background: "var(--paper)",
        padding: "28px 26px 24px",
        borderRight: "1px solid var(--rule-strong)",
        borderBottom: "1px solid var(--rule-strong)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 220,
        textDecoration: "none",
        color: "inherit",
        transition: "background 0.15s",
      }}
      className="hover:bg-[#efeae0]"
    >
      <div style={{ ...MONO, fontSize: "11px", letterSpacing: "0.16em", color: "var(--muted)" }}>
        {c.conditionCode}
      </div>
      <h2
        className="font-heading"
        style={{ fontSize: 22, lineHeight: 1.1, fontWeight: 500, margin: 0, color: "var(--ink)" }}
      >
        {c.name}
      </h2>
      {c.description && (
        <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.45 }}>
          {c.description}
        </div>
      )}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: "1px dashed var(--rule)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
          <div>
            <span className="font-heading" style={{ fontSize: 28, lineHeight: 1, fontWeight: 500, color: "var(--ink)" }}>
              {total}
            </span>
            <span
              style={{
                ...MONO,
                display: "block",
                fontSize: "9.5px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginTop: 5,
                fontWeight: 500,
              }}
            >
              signals
            </span>
          </div>
          {total > 0 && (
            <div
              style={{
                flex: 1,
                display: "flex",
                height: 6,
                border: "1px solid var(--rule-strong)",
                overflow: "hidden",
                alignSelf: "flex-end",
                maxWidth: 140,
              }}
            >
              {TIER_ORDER.map((t) => {
                const pct = (c.tierCounts[t] / total) * 100;
                if (pct === 0) return null;
                return (
                  <span key={t} style={{ display: "block", width: `${pct}%`, height: "100%", background: TIER_BAR[t] }} />
                );
              })}
            </div>
          )}
        </div>
        {total > 0 && (
          <div
            style={{
              ...MONO,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "10.5px",
              letterSpacing: "0.06em",
              color: "var(--muted)",
            }}
          >
            <span>
              {c.tierCounts.strong} strong · {c.tierCounts.moderate} moderate
            </span>
            <span style={{ color: "var(--moss)", fontWeight: 500 }}>Open →</span>
          </div>
        )}
        {lGradeTotal > 0 && (
          <div style={{ paddingTop: 10, borderTop: "1px dashed var(--rule)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  ...MONO,
                  fontSize: "9.5px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  fontWeight: 500,
                }}
              >
                Literature
              </span>
              <div style={{ flex: 1, display: "flex", height: 6, border: "1px solid var(--rule-strong)", overflow: "hidden", maxWidth: 140 }}>
                {L_GRADE_ORDER.map((l) => {
                  const pct = (c.lGradeCounts[l] / lGradeTotal) * 100;
                  if (pct === 0) return null;
                  return (
                    <span key={l} style={{ display: "block", width: `${pct}%`, height: "100%", background: L_GRADE_BAR[l] }} />
                  );
                })}
              </div>
            </div>
            {lGradeCountsLine && (
              <div style={{ ...MONO, fontSize: "10.5px", letterSpacing: "0.06em", color: "var(--muted)" }}>
                {lGradeCountsLine}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Grid ─────────────────────────────────────────────────────────────────────

export default function ConditionsList({ conditions }: { conditions: ConditionWithStats[] }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      style={{ borderTop: "1px solid var(--rule-strong)", borderLeft: "1px solid var(--rule-strong)" }}
    >
      {conditions.map((c) => (
        <ConditionCard key={c.id} c={c} />
      ))}
    </div>
  );
}
