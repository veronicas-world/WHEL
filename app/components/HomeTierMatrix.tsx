"use client";

import Link from "next/link";

export interface MatrixRow {
  id: string;
  name: string;
  slug: string;
  flagship?: boolean;
  strong: number;
  moderate: number;
  emerging: number;
  exploratory: number;
  total: number;
}

const TIERS: { key: keyof Omit<MatrixRow, "id" | "name" | "slug" | "flagship" | "total">; label: string }[] = [
  { key: "strong",      label: "Strong" },
  { key: "moderate",    label: "Moderate" },
  { key: "emerging",    label: "Emerging" },
  { key: "exploratory", label: "Exploratory" },
];

function shade(tier: string, v: number, max: number) {
  const base: Record<string, [number, number, number]> = {
    strong:      [0.34, 0.045, 134],
    moderate:    [0.55, 0.05,  128],
    emerging:    [0.78, 0.06,  128],
    exploratory: [0.9,  0.04,  120],
  };
  const b = base[tier];
  if (!b) return "var(--bone)";
  const intensity = max > 0 ? v / max : 0;
  const L = b[0] + (1 - intensity) * (0.96 - b[0]);
  return `oklch(${L} ${b[1] * (0.4 + intensity * 0.6)} ${b[2]})`;
}

export default function HomeTierMatrix({ rows }: { rows: MatrixRow[] }) {
  const max = Math.max(...rows.flatMap(r => TIERS.map(t => r[t.key])), 1);

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "180px repeat(4,1fr) 70px",
        gap: 1,
        background: "var(--line)",
        border: "1px solid var(--line)",
      }}>
        {/* Header */}
        <div style={{ background: "var(--bone)" }} />
        {TIERS.map(({ key, label }) => (
          <div key={key} style={{
            background: "var(--bone)", padding: "10px 12px",
            fontFamily: "var(--font-plex-mono, monospace)", fontSize: 10,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)",
          }}>
            {label}
          </div>
        ))}
        <div style={{
          background: "var(--bone)", padding: "10px 12px",
          fontFamily: "var(--font-plex-mono, monospace)", fontSize: 10,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)",
          textAlign: "right",
        }}>Σ</div>

        {/* Rows */}
        {rows.map(r => (
          <div key={r.id} style={{ display: "contents" }}>
            <Link href={`/conditions/${r.slug}`} style={{
              background: "var(--bone)", padding: "14px 12px",
              fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: 15, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              textDecoration: "none", color: "inherit",
            }}>
              {r.flagship && (
                <span style={{
                  width: 6, height: 6, background: "var(--signal)",
                  border: "1px solid var(--moss)", borderRadius: "50%",
                }} />
              )}
              {r.name}
            </Link>
            {TIERS.map(({ key }) => (
              <Link key={key} href={`/conditions/${r.slug}`} title={`${r.name} · ${key} — ${r[key]}`} style={{
                background: shade(key, r[key], max),
                padding: "14px 12px", cursor: "pointer", minHeight: 54,
                display: "flex", alignItems: "center", textDecoration: "none",
              }}>
                <span style={{
                  fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: 20,
                  color: (key === "strong" || key === "moderate") ? "var(--bone)" : "var(--body)",
                }}>
                  {r[key]}
                </span>
              </Link>
            ))}
            <div style={{
              background: "var(--bone-2)", padding: "14px 12px",
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: 18, fontWeight: 500,
            }}>
              {r.total}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 14,
        fontFamily: "var(--font-plex-mono, monospace)", fontSize: 11,
        color: "var(--muted)", letterSpacing: "0.03em",
      }}>
        <span>Color intensity scales with signal count within each tier</span>
        <span>Click a row to open the condition</span>
      </div>
    </div>
  );
}
