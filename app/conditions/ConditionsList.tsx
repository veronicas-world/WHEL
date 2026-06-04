"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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

// ── Search result types ───────────────────────────────────────────────────────

interface ConditionResult {
  type: "condition";
  id: string;
  name: string;
  slug: string;
}

interface CompoundResult {
  type: "compound";
  id: string;
  name: string;
  generic_name: string | null;
  drug_class: string | null;
  conditions: { id: string; name: string; slug: string }[];
}

interface SignalResult {
  type: "signal";
  id: string;
  summary: string;
  condition: { id: string; name: string; slug: string };
}

type SearchResult = ConditionResult | CompoundResult | SignalResult;

async function runSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [conditionsRes, compoundsRes, signalsRes] = await Promise.all([
    supabase
      .from("conditions")
      .select("id, name, slug")
      .or(`name.ilike.%${q}%,description.ilike.%${q}%,biology_summary.ilike.%${q}%`)
      .limit(5),

    supabase
      .from("compounds")
      .select("id, name, generic_name, drug_class")
      .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%,drug_class.ilike.%${q}%,mechanism_of_action.ilike.%${q}%`)
      .limit(6),

    supabase
      .from("repurposing_signals")
      .select("id, summary, conditions(id, name, slug)")
      .or(`summary.ilike.%${q}%,mechanism_hypothesis.ilike.%${q}%`)
      .eq("status", "active")
      .limit(5),
  ]);

  const conditions: ConditionResult[] = (conditionsRes.data ?? []).map((c) => ({
    type: "condition",
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  const compoundRows = compoundsRes.data ?? [];
  const conditionsByCompound: Record<string, { id: string; name: string; slug: string }[]> = {};

  if (compoundRows.length > 0) {
    const { data: signalRows } = await supabase
      .from("repurposing_signals")
      .select("compound_id, conditions(id, name, slug)")
      .in("compound_id", compoundRows.map((c) => c.id))
      .eq("status", "active");

    for (const row of signalRows ?? []) {
      const cid = row.compound_id as string;
      const raw = row.conditions as unknown;
      const cond = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string; slug: string } | null;
      if (!cond?.id) continue;
      if (!conditionsByCompound[cid]) conditionsByCompound[cid] = [];
      if (!conditionsByCompound[cid].some((c) => c.id === cond.id)) {
        conditionsByCompound[cid].push(cond);
      }
    }
  }

  const compounds: CompoundResult[] = compoundRows.map((c) => ({
    type: "compound",
    id: c.id,
    name: c.name,
    generic_name: c.generic_name ?? null,
    drug_class: c.drug_class ?? null,
    conditions: conditionsByCompound[c.id] ?? [],
  }));

  const signalMap = new Map<string, SignalResult>();
  for (const row of signalsRes.data ?? []) {
    const raw = row.conditions as unknown;
    const cond = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string; slug: string } | null;
    if (!cond?.id) continue;
    if (!signalMap.has(row.id)) {
      signalMap.set(row.id, {
        type: "signal",
        id: row.id,
        summary: row.summary,
        condition: cond,
      });
    }
  }

  return [...conditions, ...compounds, ...Array.from(signalMap.values())];
}

// ── Visual constants ─────────────────────────────────────────────────────────

const TIER_BAR: Record<TierKey, string> = {
  strong:      "#243217",
  moderate:    "#4d5e3c",
  emerging:    "#8A7A4E",
  exploratory: "#8E867A",
};

const TIER_ORDER: TierKey[] = ["strong", "moderate", "emerging", "exploratory"];

// L-grade bar colors. Same tokens as the chip on /conditions/[slug] so the
// two surfaces read as a single visual family. Order is low → high so the
// stacked bar reads L0 (left, taupe) → L3 (right, ink), matching the
// rubric's natural ascent.
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

// ── Card component ───────────────────────────────────────────────────────────

function ConditionCard({ c }: { c: ConditionWithStats }) {
  const total = c.totalSignals;
  const lGradeTotal =
    c.lGradeCounts.L0 +
    c.lGradeCounts.L1 +
    c.lGradeCounts.L2 +
    c.lGradeCounts.L3;
  // Render high → low so L3 (rarest, strongest) appears first when present.
  // Zero buckets are dropped so the line reads as a list of what's actually
  // there, not as a 4-cell scoreboard with mostly blanks.
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
        borderRight: "1px solid var(--ink)",
        borderBottom: "1px solid var(--ink)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 220,
        textDecoration: "none",
        color: "inherit",
        transition: "background 0.15s",
      }}
      className="hover:bg-[#f7f4ed]"
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
                border: "1px solid var(--ink)",
                overflow: "hidden",
                alignSelf: "flex-end",
                maxWidth: 140,
              }}
            >
              {TIER_ORDER.map((t) => {
                const pct = (c.tierCounts[t] / total) * 100;
                if (pct === 0) return null;
                return (
                  <span
                    key={t}
                    style={{ display: "block", width: `${pct}%`, height: "100%", background: TIER_BAR[t] }}
                  />
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
            <span style={{ color: "var(--green-mid)", fontWeight: 500 }}>Open →</span>
          </div>
        )}
        {lGradeTotal > 0 && (
          <div
            style={{
              paddingTop: 10,
              borderTop: "1px dashed var(--rule)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
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
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  height: 6,
                  border: "1px solid var(--ink)",
                  overflow: "hidden",
                  maxWidth: 140,
                }}
              >
                {L_GRADE_ORDER.map((l) => {
                  const pct = (c.lGradeCounts[l] / lGradeTotal) * 100;
                  if (pct === 0) return null;
                  return (
                    <span
                      key={l}
                      style={{
                        display: "block",
                        width: `${pct}%`,
                        height: "100%",
                        background: L_GRADE_BAR[l],
                      }}
                    />
                  );
                })}
              </div>
            </div>
            {lGradeCountsLine && (
              <div
                style={{
                  ...MONO,
                  fontSize: "10.5px",
                  letterSpacing: "0.06em",
                  color: "var(--muted)",
                }}
              >
                {lGradeCountsLine}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Search result cards ──────────────────────────────────────────────────────

const CARD_BASE: React.CSSProperties = {
  background: "var(--paper)",
  border: "1px solid var(--rule-strong)",
  padding: "20px 22px",
  textDecoration: "none",
  color: "inherit",
  display: "block",
};

function ConditionSearchCard({ r }: { r: ConditionResult }) {
  return (
    <Link href={`/conditions/${r.slug}`} style={CARD_BASE} className="hover:bg-[#f7f4ed] transition-colors">
      <h2 className="font-heading" style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>
        {r.name}
      </h2>
      <span style={{ ...MONO, fontSize: "11px", letterSpacing: "0.14em", color: "var(--green-mid)", fontWeight: 500 }}>
        View signals →
      </span>
    </Link>
  );
}

function CompoundSearchCard({ r }: { r: CompoundResult }) {
  return (
    <div style={CARD_BASE}>
      <p className="font-heading" style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
        {r.name}
      </p>
      {(r.generic_name || r.drug_class) && (
        <p style={{ ...MONO, fontSize: "11px", color: "var(--muted)", marginBottom: 10 }}>
          {[r.generic_name, r.drug_class].filter(Boolean).join(" · ")}
        </p>
      )}
      {r.conditions.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {r.conditions.map((cond) => (
            <Link
              key={cond.id}
              href={`/conditions/${cond.slug}`}
              style={{ ...MONO, fontSize: "11.5px", color: "var(--green-mid)", fontWeight: 500 }}
              className="hover:opacity-70 transition-opacity"
            >
              → {cond.name}
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ ...MONO, fontSize: "11px", color: "var(--muted)" }}>No active signals yet.</p>
      )}
    </div>
  );
}

function SignalSearchCard({ r }: { r: SignalResult }) {
  return (
    <Link href={`/conditions/${r.condition.slug}`} style={CARD_BASE} className="hover:bg-[#f7f4ed] transition-colors">
      <p style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 10 }}
         className="line-clamp-3">
        {r.summary}
      </p>
      <span style={{ ...MONO, fontSize: "11px", letterSpacing: "0.1em", color: "var(--green-mid)", fontWeight: 500 }}>
        → {r.condition.name}
      </span>
    </Link>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ConditionsList({ conditions }: { conditions: ConditionWithStats[] }) {
  const [query, setQuery]               = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSearching = query.trim().length >= 2;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const hits = await runSearch(query.trim());
        setSearchResults(hits);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const conditionResults = searchResults.filter((r): r is ConditionResult => r.type === "condition");
  const compoundResults  = searchResults.filter((r): r is CompoundResult  => r.type === "compound");
  const signalResults    = searchResults.filter((r): r is SignalResult    => r.type === "signal");

  return (
    <div>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div className="relative mb-10 max-w-lg">
        <span
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--muted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="9" r="6" />
            <line x1="14.5" y1="14.5" x2="19" y2="19" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conditions, medications, or signals…"
          className="w-full pl-10 pr-4 py-3 text-sm transition focus:outline-none"
          style={{
            ...MONO,
            border: "1px solid var(--rule-strong)",
            backgroundColor: "var(--paper)",
            color: "var(--ink)",
            fontSize: "13px",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--ink)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--rule-strong)")}
        />
        {loading && (
          <span
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ ...MONO, fontSize: "11px", color: "var(--muted)" }}
          >
            …
          </span>
        )}
      </div>

      {/* ── Default view: conditions hairline grid ───────────────────────────── */}
      {!isSearching && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ borderTop: "1px solid var(--ink)", borderLeft: "1px solid var(--ink)" }}
        >
          {conditions.map((c) => (
            <ConditionCard key={c.id} c={c} />
          ))}
        </div>
      )}

      {/* ── Search: empty state ──────────────────────────────────────────────── */}
      {isSearching && searched && searchResults.length === 0 && (
        <p style={{ ...MONO, fontSize: "13px", color: "var(--muted)" }}>
          No results for &ldquo;{query}&rdquo;.
        </p>
      )}

      {/* ── Search: grouped results ──────────────────────────────────────────── */}
      {isSearching && searched && searchResults.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

          {conditionResults.length > 0 && (
            <div>
              <p
                style={{
                  ...MONO,
                  fontSize: "10.5px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 16,
                }}
              >
                Conditions
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {conditionResults.map((r) => <ConditionSearchCard key={r.id} r={r} />)}
              </div>
            </div>
          )}

          {compoundResults.length > 0 && (
            <div>
              <p
                style={{
                  ...MONO,
                  fontSize: "10.5px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 16,
                }}
              >
                Medications
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {compoundResults.map((r) => <CompoundSearchCard key={r.id} r={r} />)}
              </div>
            </div>
          )}

          {signalResults.length > 0 && (
            <div>
              <p
                style={{
                  ...MONO,
                  fontSize: "10.5px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 16,
                }}
              >
                Signals
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {signalResults.map((r) => <SignalSearchCard key={r.id} r={r} />)}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
