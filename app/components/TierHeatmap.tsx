// Figure 1 — condition × tier heatmap.
// Server component. Pure presentation; data is computed by the caller.

import Link from "next/link";

export type TierKey = "strong" | "moderate" | "emerging" | "exploratory";

export type HeatmapRow = {
  id: string;
  name: string;
  slug: string;
  tiers: Record<TierKey, number>;
  total: number;
};

const TIERS: { key: TierKey; label: string }[] = [
  { key: "strong", label: "Strong" },
  { key: "moderate", label: "Moderate" },
  { key: "emerging", label: "Emerging" },
  { key: "exploratory", label: "Exploratory" },
];

// OKLCH-based green/sand ramp keyed by tier.
function cellBg(tier: TierKey, intensity: number): string {
  const i = Math.min(1, Math.max(0, intensity));
  const ramps: Record<TierKey, { L0: number; LRange: number; C: number; H: number }> = {
    strong:      { L0: 0.96, LRange: 0.50, C: 0.05,  H: 130 },
    moderate:    { L0: 0.96, LRange: 0.45, C: 0.045, H: 125 },
    emerging:    { L0: 0.96, LRange: 0.40, C: 0.06,  H: 95  },
    exploratory: { L0: 0.96, LRange: 0.30, C: 0.02,  H: 85  },
  };
  const r = ramps[tier];
  const L = r.L0 - i * r.LRange;
  return `oklch(${L.toFixed(3)} ${r.C} ${r.H})`;
}

// Choose ink color for legibility at high intensity.
function cellInk(intensity: number): string {
  return intensity > 0.6 ? "#F5F2E8" : "var(--ink)";
}

export default function TierHeatmap({ rows }: { rows: HeatmapRow[] }) {
  if (!rows.length) return null;

  let max = 0;
  for (const r of rows) {
    for (const t of TIERS) {
      const v = r.tiers[t.key] ?? 0;
      if (v > max) max = v;
    }
  }
  if (max === 0) max = 1;

  return (
    <div>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(160px, 220px) repeat(4, 1fr) 80px",
            border: "1px solid var(--ink)",
            background: "var(--paper)",
            minWidth: 640,
          }}
        >
        {/* Header row */}
        <div style={headerCellStyle} />
        {TIERS.map((t) => (
          <div key={t.key} style={headerCellStyle}>
            {t.label}
          </div>
        ))}
        <div style={{ ...headerCellStyle, justifyContent: "flex-end" }}>Total</div>

        {/* Data rows */}
        {rows.map((row, idx) => {
          const isLast = idx === rows.length - 1;
          return (
            <ConditionRow key={row.id} row={row} isLast={isLast} max={max} />
          );
        })}
        </div>
      </div>

      <div
        className="font-mono"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
          fontSize: 11,
          letterSpacing: "0.04em",
          color: "var(--muted)",
        }}
      >
        <span>Color intensity scales with signal count within each tier</span>
        <span>Click a row to open that condition</span>
      </div>
    </div>
  );
}

function ConditionRow({
  row,
  isLast,
  max,
}: {
  row: HeatmapRow;
  isLast: boolean;
  max: number;
}) {
  const border = isLast ? "none" : "1px solid var(--rule)";
  return (
    <>
      <Link
        href={`/conditions/${row.slug}`}
        style={{
          ...rowLabelStyle,
          borderBottom: border,
        }}
      >
        {row.name}
      </Link>
      {TIERS.map((t) => {
        const v = row.tiers[t.key] ?? 0;
        const intensity = v / max;
        const pct = row.total > 0 ? Math.round((v / row.total) * 100) : 0;
        return (
          <Link
            key={t.key}
            href={`/conditions/${row.slug}`}
            style={{
              padding: "16px 14px",
              borderRight: "1px solid var(--rule)",
              borderBottom: border,
              background: cellBg(t.key, intensity),
              color: cellInk(intensity),
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 56,
            }}
            title={`${row.name} · ${t.label}: ${v} signals`}
          >
            <span
              className="font-heading"
              style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.01em" }}
            >
              {v}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 10.5, letterSpacing: "0.04em", opacity: 0.75 }}
            >
              {pct}%
            </span>
          </Link>
        );
      })}
      <div
        style={{
          padding: "16px 18px",
          background: "var(--bg-2)",
          borderBottom: border,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <span
          className="font-heading"
          style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.01em" }}
        >
          {row.total}
        </span>
      </div>
    </>
  );
}

const headerCellStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
  fontSize: 10.5,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--muted)",
  borderBottom: "1px solid var(--ink)",
  borderRight: "1px solid var(--rule)",
  display: "flex",
  alignItems: "center",
};

const rowLabelStyle: React.CSSProperties = {
  padding: "16px 14px",
  fontFamily: "var(--font-source-serif, Georgia, serif)",
  fontSize: 16,
  fontWeight: 500,
  color: "var(--ink)",
  textDecoration: "none",
  borderRight: "1px solid var(--ink)",
  display: "flex",
  alignItems: "center",
};
