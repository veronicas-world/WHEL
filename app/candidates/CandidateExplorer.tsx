"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * Serializable facet metadata for one candidate, computed on the server and
 * paired with its already-rendered <CandidateCard/>. The explorer filters and
 * ranks on these fields without ever touching the card internals.
 */
export type ExplorerItem = {
  id: string;
  condition: string;
  conditionSlug: string;
  tier: "strong" | "moderate" | "emerging" | "exploratory";
  score: number;
  /** Anchor arm = the public-facing signal type. */
  signalArm: "direct" | "pathway" | "community" | null;
  validation: "clinical" | "unvalidated_signal" | "preliminary" | null;
  /** "Top 12%" when MATRIX covers the pair; null otherwise. */
  matrixPercentile: string | null;
  /** Numeric percentile (12 for "Top 12%"); lower is better. null when absent. */
  matrixRank: number | null;
  hasMatrix: boolean;
  hasSexPk: boolean;
  hasPhase: boolean;
  hasGraph: boolean;
  card: ReactNode;
};

type TierKey = ExplorerItem["tier"];
type ValKey = NonNullable<ExplorerItem["validation"]>;
type ArmKey = NonNullable<ExplorerItem["signalArm"]>;
type MarkerKey = "matrix" | "sexpk" | "phase" | "graph";

const TIER_ORDER: TierKey[] = ["strong", "moderate", "emerging", "exploratory"];
const TIER_LABELS: Record<TierKey, string> = {
  strong: "Strong",
  moderate: "Moderate",
  emerging: "Emerging",
  exploratory: "Exploratory",
};
const TIER_RANK: Record<TierKey, number> = { strong: 0, moderate: 1, emerging: 2, exploratory: 3 };

const VAL_ORDER: ValKey[] = ["clinical", "unvalidated_signal", "preliminary"];
const VAL_LABELS: Record<ValKey, string> = {
  clinical: "Clinically anchored",
  unvalidated_signal: "Unvalidated signal",
  preliminary: "Preliminary",
};

const ARM_ORDER: ArmKey[] = ["direct", "pathway", "community"];
const ARM_LABELS: Record<ArmKey, string> = {
  direct: "Direct research",
  pathway: "Pathway insights",
  community: "Community reports",
};

const MARKER_ORDER: MarkerKey[] = ["matrix", "sexpk", "phase", "graph"];
const MARKER_LABELS: Record<MarkerKey, string> = {
  matrix: "Matrix match",
  sexpk: "Sex-PK",
  phase: "Cycle phase",
  graph: "Graph link",
};

const MATRIX_THRESHOLDS = [10, 25, 50] as const;

type SortKey = "score" | "matrix" | "tier" | "condition";
const SORT_LABELS: Record<SortKey, string> = {
  score: "Strongest first",
  matrix: "Best Matrix rank",
  tier: "Confidence tier",
  condition: "Condition (A–Z)",
};

function markerActive(it: ExplorerItem, m: MarkerKey): boolean {
  switch (m) {
    case "matrix": return it.hasMatrix;
    case "sexpk": return it.hasSexPk;
    case "phase": return it.hasPhase;
    case "graph": return it.hasGraph;
  }
}

function Chip({
  label, count, active, onClick,
}: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
        fontSize: 11,
        letterSpacing: "0.03em",
        padding: "5px 11px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        border: active ? "1px solid var(--moss)" : "1px solid var(--line)",
        background: active ? "var(--moss)" : "var(--paper)",
        color: active ? "var(--paper)" : "var(--ink)",
        transition: "background 0.12s ease, border-color 0.12s ease, color 0.12s ease",
      }}
    >
      {label}
      {typeof count === "number" && (
        <span style={{ opacity: active ? 0.85 : 0.5, fontSize: 10 }}>{count}</span>
      )}
    </button>
  );
}

function FacetRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div
        style={{
          width: 96,
          flexShrink: 0,
          paddingTop: 7,
          fontFamily: "var(--font-plex-mono, monospace)",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 220 }}>
        {children}
      </div>
    </div>
  );
}

export default function CandidateExplorer({ items }: { items: ExplorerItem[] }) {
  const [tiers, setTiers] = useState<Set<TierKey>>(new Set());
  const [vals, setVals] = useState<Set<ValKey>>(new Set());
  const [arms, setArms] = useState<Set<ArmKey>>(new Set());
  const [markers, setMarkers] = useState<Set<MarkerKey>>(new Set());
  const [conds, setConds] = useState<Set<string>>(new Set());
  const [matrixMax, setMatrixMax] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("score");
  const [grouped, setGrouped] = useState<boolean>(true);

  function toggle<T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  // Condition options, ordered by candidate count (descending).
  const conditionOptions = useMemo(() => {
    const counts = new Map<string, { slug: string; label: string; n: number }>();
    for (const it of items) {
      const g = counts.get(it.conditionSlug);
      if (g) g.n += 1;
      else counts.set(it.conditionSlug, { slug: it.conditionSlug, label: it.condition, n: 1 });
    }
    return [...counts.values()].sort((a, b) => b.n - a.n);
  }, [items]);

  // Live counts for each facet value, computed against everything EXCEPT that
  // facet's own selection, so the numbers reflect what selecting would yield.
  const counts = useMemo(() => {
    const passExcept = (it: ExplorerItem, skip: string) => {
      if (skip !== "tier" && tiers.size && !tiers.has(it.tier)) return false;
      if (skip !== "val" && vals.size && (!it.validation || !vals.has(it.validation))) return false;
      if (skip !== "arm" && arms.size && (!it.signalArm || !arms.has(it.signalArm))) return false;
      if (skip !== "marker" && markers.size && ![...markers].every((m) => markerActive(it, m))) return false;
      if (skip !== "cond" && conds.size && !conds.has(it.conditionSlug)) return false;
      if (skip !== "matrix" && matrixMax != null && (it.matrixRank == null || it.matrixRank > matrixMax)) return false;
      return true;
    };
    const tally = <K extends string>(skip: string, keyOf: (it: ExplorerItem) => K | K[] | null) => {
      const m = new Map<K, number>();
      for (const it of items) {
        if (!passExcept(it, skip)) continue;
        const k = keyOf(it);
        if (k == null) continue;
        for (const key of Array.isArray(k) ? k : [k]) m.set(key, (m.get(key) ?? 0) + 1);
      }
      return m;
    };
    return {
      tier: tally<TierKey>("tier", (it) => it.tier),
      val: tally<ValKey>("val", (it) => it.validation),
      arm: tally<ArmKey>("arm", (it) => it.signalArm),
      marker: tally<MarkerKey>("marker", (it) => MARKER_ORDER.filter((m) => markerActive(it, m))),
      cond: tally<string>("cond", (it) => it.conditionSlug),
      matrix: (() => {
        const m = new Map<number, number>();
        for (const it of items) {
          if (!passExcept(it, "matrix")) continue;
          if (it.matrixRank == null) continue;
          for (const t of MATRIX_THRESHOLDS) if (it.matrixRank <= t) m.set(t, (m.get(t) ?? 0) + 1);
        }
        return m;
      })(),
    };
  }, [items, tiers, vals, arms, markers, conds, matrixMax]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (tiers.size && !tiers.has(it.tier)) return false;
      if (vals.size && (!it.validation || !vals.has(it.validation))) return false;
      if (arms.size && (!it.signalArm || !arms.has(it.signalArm))) return false;
      if (markers.size && ![...markers].every((m) => markerActive(it, m))) return false;
      if (conds.size && !conds.has(it.conditionSlug)) return false;
      if (matrixMax != null && (it.matrixRank == null || it.matrixRank > matrixMax)) return false;
      return true;
    });
  }, [items, tiers, vals, arms, markers, conds, matrixMax]);

  const sorted = useMemo(() => {
    const compare = (a: ExplorerItem, b: ExplorerItem): number => {
      switch (sort) {
        case "matrix": {
          const ar = a.matrixRank, br = b.matrixRank;
          if (ar == null && br == null) return b.score - a.score;
          if (ar == null) return 1;
          if (br == null) return -1;
          return ar - br || b.score - a.score;
        }
        case "tier":
          return TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.score - a.score;
        case "condition":
          return a.condition.localeCompare(b.condition) || b.score - a.score;
        case "score":
        default:
          return b.score - a.score;
      }
    };
    return [...filtered].sort(compare);
  }, [filtered, sort]);

  // Grouped view: conditions ordered by match count, items sorted within.
  const groups = useMemo(() => {
    const map = new Map<string, { slug: string; label: string; items: ExplorerItem[] }>();
    for (const it of sorted) {
      const g = map.get(it.conditionSlug);
      if (g) g.items.push(it);
      else map.set(it.conditionSlug, { slug: it.conditionSlug, label: it.condition, items: [it] });
    }
    return [...map.values()].sort((a, b) => b.items.length - a.items.length);
  }, [sorted]);

  const activeCount =
    tiers.size + vals.size + arms.size + markers.size + conds.size + (matrixMax != null ? 1 : 0);

  function clearAll() {
    setTiers(new Set());
    setVals(new Set());
    setArms(new Set());
    setMarkers(new Set());
    setConds(new Set());
    setMatrixMax(null);
  }

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          border: "1px solid var(--line)",
          background: "var(--bone-2, var(--paper))",
          padding: "18px 20px",
          marginBottom: 22,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <FacetRow label="Tier">
          {TIER_ORDER.map((t) => (
            <Chip
              key={t}
              label={TIER_LABELS[t]}
              count={counts.tier.get(t) ?? 0}
              active={tiers.has(t)}
              onClick={() => toggle(setTiers, t)}
            />
          ))}
        </FacetRow>

        <FacetRow label="Validation">
          {VAL_ORDER.map((v) => (
            <Chip
              key={v}
              label={VAL_LABELS[v]}
              count={counts.val.get(v) ?? 0}
              active={vals.has(v)}
              onClick={() => toggle(setVals, v)}
            />
          ))}
        </FacetRow>

        <FacetRow label="Signal">
          {ARM_ORDER.map((a) => (
            <Chip
              key={a}
              label={ARM_LABELS[a]}
              count={counts.arm.get(a) ?? 0}
              active={arms.has(a)}
              onClick={() => toggle(setArms, a)}
            />
          ))}
        </FacetRow>

        <FacetRow label="Layers">
          {MARKER_ORDER.map((m) => (
            <Chip
              key={m}
              label={MARKER_LABELS[m]}
              count={counts.marker.get(m) ?? 0}
              active={markers.has(m)}
              onClick={() => toggle(setMarkers, m)}
            />
          ))}
        </FacetRow>

        <FacetRow label="Matrix %">
          {MATRIX_THRESHOLDS.map((t) => (
            <Chip
              key={t}
              label={`Top ${t}%`}
              count={counts.matrix.get(t) ?? 0}
              active={matrixMax === t}
              onClick={() => setMatrixMax((prev) => (prev === t ? null : t))}
            />
          ))}
        </FacetRow>

        <FacetRow label="Condition">
          {conditionOptions.map((c) => (
            <Chip
              key={c.slug}
              label={c.label}
              count={counts.cond.get(c.slug) ?? 0}
              active={conds.has(c.slug)}
              onClick={() => toggle(setConds, c.slug)}
            />
          ))}
        </FacetRow>

        {/* Sort + group + result count */}
        <div
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span
              style={{
                fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              Rank by
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={{
                fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: 11.5,
                padding: "5px 9px",
                border: "1px solid var(--line)",
                background: "var(--paper)",
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
          </div>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
              fontFamily: "var(--font-plex-mono, monospace)",
              fontSize: 11,
              color: "var(--ink)",
            }}
          >
            <input
              type="checkbox"
              checked={grouped}
              onChange={(e) => setGrouped(e.target.checked)}
              style={{ cursor: "pointer", accentColor: "var(--moss)" }}
            />
            Group by condition
          </label>

          <div style={{ flex: 1 }} />

          <span
            style={{
              fontFamily: "var(--font-plex-mono, monospace)",
              fontSize: 11,
              color: "var(--ink)",
            }}
          >
            {filtered.length} of {items.length} candidates
          </span>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: 11,
                color: "var(--moss)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
              }}
            >
              Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div
          style={{
            border: "1px solid var(--line)",
            background: "var(--paper)",
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          <p style={{ margin: 0, fontSize: 15 }}>No candidates match these filters.</p>
          <button
            type="button"
            onClick={clearAll}
            style={{
              marginTop: 12,
              fontFamily: "var(--font-plex-mono, monospace)",
              fontSize: 12,
              color: "var(--moss)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              cursor: "pointer",
              background: "none",
              border: "none",
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : grouped ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {groups.map((g) => (
            <section key={g.slug} id={g.slug} style={{ scrollMarginTop: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  borderBottom: "1px solid var(--line)",
                  paddingBottom: 10,
                  marginBottom: 18,
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-newsreader, Georgia, serif)",
                    fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.015em",
                    margin: 0,
                    color: "var(--ink)",
                  }}
                >
                  {g.label}
                </h3>
                <span
                  style={{
                    fontFamily: "var(--font-plex-mono, monospace)",
                    fontSize: 11,
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {g.items.length} candidate{g.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="col" style={{ gap: 16 }}>
                {g.items.map((it) => it.card)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="col" style={{ gap: 16 }}>
          {sorted.map((it) => it.card)}
        </div>
      )}
    </div>
  );
}
