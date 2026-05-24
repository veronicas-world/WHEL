// Figure 2 — Source → Evidence Arm → Confidence Tier provenance flow.
// Renders as an inline SVG. Tier heights are proportional to live counts.
// Arm heights are proportional to arm_count if available; otherwise equal.
// Source nodes are equal-height (source-level counts require a separate join).

export type ArmKey = "direct" | "cross" | "pathway" | "community";
export type TierKey = "strong" | "moderate" | "emerging" | "exploratory";

export type SankeyProps = {
  tierCounts: Record<TierKey, number>;
  armCounts: Partial<Record<ArmKey, number>>;
  total: number;
};

// ── Architectural constants ──────────────────────────────────────────────────

const SOURCES = [
  { id: "pubmed",         label: "PubMed" },
  { id: "clinicaltrials", label: "ClinicalTrials.gov" },
  { id: "fda",            label: "AEMS" },
  { id: "opentargets",    label: "Open Targets" },
  { id: "reddit",         label: "Reddit" },
] as const;

const ARMS = [
  { id: "direct"    as ArmKey, label: "Direct Research",         color: "#1A3A5C", bgOpacity: 0.1 },
  { id: "cross"     as ArmKey, label: "Cross-Condition Signals", color: "#6B5B3E", bgOpacity: 0.1 },
  { id: "pathway"   as ArmKey, label: "Pathway Insights",        color: "#2E3D2B", bgOpacity: 0.1 },
  { id: "community" as ArmKey, label: "Community Forum Reports", color: "#8C4A2E", bgOpacity: 0.1 },
] as const;

const TIERS = [
  { id: "strong"      as TierKey, label: "Strong",      range: "9–10", color: "#1F2A1C" },
  { id: "moderate"    as TierKey, label: "Moderate",    range: "7–8",  color: "#4D5E4D" },
  { id: "emerging"    as TierKey, label: "Emerging",    range: "4–6",  color: "#8C9577" },
  { id: "exploratory" as TierKey, label: "Exploratory", range: "0–3",  color: "#B5B19A" },
] as const;

// Source → Arm connections (methodology architecture, not data-driven)
const SRC_ARM: Record<string, ArmKey[]> = {
  pubmed:         ["direct", "cross"],
  clinicaltrials: ["direct"],
  fda:            ["pathway"],
  opentargets:    ["pathway"],
  reddit:         ["community"],
};

// ── Layout constants ──────────────────────────────────────────────────────────

const W       = 900;
const H       = 400;
const PAD_V   = 22;   // top & bottom padding
const NODE_G  = 8;    // gap between sibling nodes
const MIN_H   = 34;   // minimum node height (legibility floor)

// Column geometry: left edge of node rect, width of node rect
const COL = {
  src:  { x: 0,   w: 148 },
  arm:  { x: 310, w: 168 },
  tier: { x: 622, w: 148 },
} as const;

const AVAIL_H = H - PAD_V * 2; // 356px

// ── Layout helpers ───────────────────────────────────────────────────────────

type LayoutNode = { id: string; y: number; h: number; cy: number };

function layoutEqual(n: number): LayoutNode[] {
  const h = (AVAIL_H - (n - 1) * NODE_G) / n;
  const nodes: LayoutNode[] = [];
  let cursor = PAD_V;
  for (let i = 0; i < n; i++) {
    nodes.push({ id: "", y: cursor, h, cy: cursor + h / 2 });
    cursor += h + NODE_G;
  }
  return nodes;
}

function layoutProportional(
  counts: number[],
  total: number,
): LayoutNode[] {
  const n = counts.length;
  const pool = AVAIL_H - (n - 1) * NODE_G; // available for node bodies

  // 1. Raw proportional heights, floored to MIN_H
  const raw = counts.map((c) => Math.max(MIN_H, total > 0 ? (c / total) * pool : pool / n));
  // 2. Scale so they fill available space exactly
  const rawSum = raw.reduce((a, b) => a + b, 0);
  const scaled = raw.map((h) => (h / rawSum) * pool);

  const nodes: LayoutNode[] = [];
  let cursor = PAD_V;
  for (let i = 0; i < n; i++) {
    nodes.push({ id: "", y: cursor, h: scaled[i], cy: cursor + scaled[i] / 2 });
    cursor += scaled[i] + NODE_G;
  }
  return nodes;
}

// Smooth bezier path from (x1,y1) → (x2,y2) with horizontal control points
function bezier(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SourceSankey({ tierCounts, armCounts, total }: SankeyProps) {
  const hasArmData = ARMS.some((a) => (armCounts[a.id] ?? 0) > 0);

  // Source nodes — always equal height
  const srcLayout = layoutEqual(SOURCES.length);
  const srcNodes  = SOURCES.map((s, i) => ({ ...srcLayout[i],  ...s }));

  // Arm nodes — proportional if we have data, else equal
  const armLayout = hasArmData
    ? layoutProportional(ARMS.map((a) => armCounts[a.id] ?? 0), total)
    : layoutEqual(ARMS.length);
  const armNodes  = ARMS.map((a, i)    => ({ ...armLayout[i],  ...a }));

  // Tier nodes — always proportional to live tier counts
  const tierLayout = layoutProportional(
    TIERS.map((t) => tierCounts[t.id] ?? 0),
    total,
  );
  const tierNodes = TIERS.map((t, i)   => ({ ...tierLayout[i], ...t }));

  const armById  = Object.fromEntries(armNodes.map((n) => [n.id, n]));
  const tierById = Object.fromEntries(tierNodes.map((n) => [n.id, n]));

  // Right edge x values for bezier curve endpoints
  const srcRight  = COL.src.x + COL.src.w;
  const armLeft   = COL.arm.x;
  const armRight  = COL.arm.x + COL.arm.w;
  const tierLeft  = COL.tier.x;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block", overflow: "visible" }}
      aria-label="Figure 2: evidence provenance flow from sources through arms to confidence tiers"
    >
      {/* Column header labels */}
      {(
        [
          { label: "Sources", cx: COL.src.x + COL.src.w / 2 },
          { label: "Evidence Arms", cx: COL.arm.x + COL.arm.w / 2 },
          { label: "Tiers", cx: COL.tier.x + COL.tier.w / 2 },
        ] as const
      ).map(({ label, cx }) => (
        <text
          key={label}
          x={cx}
          y={11}
          textAnchor="middle"
          fontSize={9}
          letterSpacing={1.8}
          fill="var(--muted)"
          fontFamily="var(--font-plex-mono, ui-monospace, monospace)"
        >
          {label.toUpperCase()}
        </text>
      ))}

      {/* ── Source → Arm connection curves ── */}
      {srcNodes.map((src) =>
        (SRC_ARM[src.id] ?? []).map((armId) => {
          const arm = armById[armId];
          if (!arm) return null;
          return (
            <path
              key={`${src.id}→${armId}`}
              d={bezier(srcRight, src.cy, armLeft, arm.cy)}
              fill="none"
              stroke={arm.color}
              strokeWidth={1.5}
              strokeOpacity={0.22}
            />
          );
        })
      )}

      {/* ── Arm → Tier connection curves ── */}
      {armNodes.map((arm) =>
        tierNodes.map((tier) => (
          <path
            key={`${arm.id}→${tier.id}`}
            d={bezier(armRight, arm.cy, tierLeft, tier.cy)}
            fill="none"
            stroke={tier.color}
            strokeWidth={1.5}
            strokeOpacity={0.18}
          />
        ))
      )}

      {/* ── Source nodes ── */}
      {srcNodes.map((n) => {
        const showLabel = n.h >= 22;
        return (
          <g key={n.id}>
            <rect
              x={COL.src.x}
              y={n.y}
              width={COL.src.w}
              height={n.h}
              fill="var(--bg-2)"
              stroke="var(--rule)"
              strokeWidth={0.75}
            />
            {showLabel && (
              <text
                x={COL.src.x + 10}
                y={n.cy}
                dominantBaseline="middle"
                fontSize={Math.min(11, Math.max(9, n.h * 0.22))}
                fontFamily="var(--font-plex-mono, ui-monospace, monospace)"
                fill="var(--ink)"
              >
                {n.label}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Arm nodes ── */}
      {armNodes.map((n) => {
        const count = armCounts[n.id as ArmKey] ?? 0;
        const twoLine = n.h >= 52;
        return (
          <g key={n.id}>
            <rect
              x={COL.arm.x}
              y={n.y}
              width={COL.arm.w}
              height={n.h}
              fill={n.color}
              fillOpacity={0.09}
              stroke={n.color}
              strokeWidth={0.75}
              strokeOpacity={0.5}
            />
            <text
              x={COL.arm.x + 10}
              y={twoLine ? n.cy - 8 : n.cy}
              dominantBaseline="middle"
              fontSize={Math.min(11.5, Math.max(9, n.h * 0.2))}
              fontFamily="var(--font-source-serif, Georgia, serif)"
              fill="var(--ink)"
            >
              {n.label}
            </text>
            {count > 0 && (
              <text
                x={twoLine ? COL.arm.x + 10 : COL.arm.x + COL.arm.w - 10}
                y={twoLine ? n.cy + 10 : n.cy}
                textAnchor={twoLine ? "start" : "end"}
                dominantBaseline="middle"
                fontSize={10}
                fontFamily="var(--font-plex-mono, ui-monospace, monospace)"
                fill={n.color}
                fillOpacity={0.75}
              >
                {count}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Tier nodes ── */}
      {tierNodes.map((n) => {
        const count = tierCounts[n.id as TierKey] ?? 0;
        const twoLine = n.h >= 52;
        return (
          <g key={n.id}>
            <rect
              x={COL.tier.x}
              y={n.y}
              width={COL.tier.w}
              height={n.h}
              fill={n.color}
              fillOpacity={0.1}
              stroke={n.color}
              strokeWidth={0.75}
              strokeOpacity={0.5}
            />
            <text
              x={COL.tier.x + 10}
              y={twoLine ? n.cy - 8 : n.cy}
              dominantBaseline="middle"
              fontSize={Math.min(12, Math.max(9, n.h * 0.22))}
              fontFamily="var(--font-source-serif, Georgia, serif)"
              fill="var(--ink)"
            >
              {n.label}
            </text>
            {count > 0 && (
              <text
                x={twoLine ? COL.tier.x + 10 : COL.tier.x + COL.tier.w - 10}
                y={twoLine ? n.cy + 10 : n.cy}
                textAnchor={twoLine ? "start" : "end"}
                dominantBaseline="middle"
                fontSize={10}
                fontFamily="var(--font-plex-mono, ui-monospace, monospace)"
                fill={n.color}
                fillOpacity={0.8}
              >
                {count}
              </text>
            )}
          </g>
        );
      })}

      {/* "5 SOURCES → 4 ARMS → 4 TIERS" legend under the diagram */}
      <text
        x={W / 2}
        y={H - 4}
        textAnchor="middle"
        fontSize={9}
        letterSpacing={1.5}
        fontFamily="var(--font-plex-mono, ui-monospace, monospace)"
        fill="var(--muted)"
      >
        {`${SOURCES.length} SOURCES  →  ${ARMS.length} ARMS  →  ${TIERS.length} TIERS`}
      </text>
    </svg>
  );
}
