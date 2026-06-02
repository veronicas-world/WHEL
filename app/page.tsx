import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toArmKey, type ArmKey } from "@/lib/arm-mapping";
import TierHeatmap, { type TierKey, type HeatmapRow } from "@/app/components/TierHeatmap";
import SourceSankey from "@/app/components/SourceSankey";

// Force runtime data fetching on every request so the home page always
// reflects the current state of the Supabase database. Without this,
// Next.js statically prerenders the page at build time and stat numbers
// freeze to whatever the DB contained at deploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIER_COLORS: Record<TierKey, { text: string; bg: string; bar: string }> = {
  strong:      { text: "#243217", bg: "#d4d8c1", bar: "#243217" },
  moderate:    { text: "#4d5e3c", bg: "#dfe2cc", bar: "#4d5e3c" },
  emerging:    { text: "#7b8466", bg: "#e6e5d3", bar: "#7b8466" },
  exploratory: { text: "#a9aa8f", bg: "#eeebdb", bar: "#a9aa8f" },
};

const TIERS: { key: TierKey; label: string; desc: string; range: string }[] = [
  { key: "strong",      label: "Strong",      desc: "Highly replicated, well-characterized signals with consistent direction across multiple evidence types.", range: "9–10" },
  { key: "moderate",    label: "Moderate",    desc: "Replicated findings with solid mechanistic rationale.",                                                    range: "7–8"  },
  { key: "emerging",    label: "Emerging",    desc: "Early-stage evidence with some corroboration or mechanistic support.",                                     range: "4–6"  },
  { key: "exploratory", label: "Exploratory", desc: "Single-source, mechanistic, or low-specificity signals; hypothesis generation only.",                      range: "0–3"  },
];

const SIGNAL_TYPES = [
  {
    num: "01",
    title: "Direct Research",
    desc: "Published studies and active clinical trials specifically investigating each condition.",
    sources: ["PubMed", "ClinicalTrials.gov"],
    href: "/signal-types",
  },
  {
    num: "02",
    title: "Cross-Condition Signals",
    desc: "Drugs developed for other conditions where women incidentally reported benefit.",
    sources: ["AEMS", "PubMed", "Trial registries"],
    href: "/signal-types",
  },
  {
    num: "03",
    title: "Pathway Insights",
    desc: "Signals from biological pathway and target analysis, including drugs with mechanistic or genetic evidence of relevance, and adverse event patterns revealing underlying disease biology.",
    sources: ["Open Targets", "AEMS"],
    href: "/signal-types",
  },
  {
    num: "04",
    title: "Community Forum Reports",
    desc: "Consistent treatment patterns reported across condition-specific patient communities.",
    sources: ["Reddit communities"],
    href: "/signal-types",
  },
];

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};

const EYEBROW: React.CSSProperties = {
  ...MONO,
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

export default async function Home() {
  const [
    { data: conditionsRaw },
    { data: signalsRaw },
    { count: sourcesCount },
  ] = await Promise.all([
    supabase.from("conditions").select("id, name, slug, description").order("name"),
    supabase
      .from("repurposing_signals")
      .select("condition_id, confidence_tier, total_evidence_score, created_at, signal_type")
      .eq("status", "active")
      .not("total_evidence_score", "is", null)
      .gt("total_evidence_score", 0),
    supabase.from("sources").select("*", { count: "exact", head: true }),
  ]);

  const conditions = conditionsRaw ?? [];
  const signals    = signalsRaw   ?? [];

  // Per-condition stats for the heatmap and condition cards
  const conditionsWithStats = conditions.map((c) => {
    const cSigs = signals.filter((s) => s.condition_id === c.id);
    const tierCounts: Record<TierKey, number> = { strong: 0, moderate: 0, emerging: 0, exploratory: 0 };
    for (const s of cSigs) {
      const t = (s.confidence_tier?.toLowerCase() ?? "exploratory") as TierKey;
      if (t in tierCounts) tierCounts[t]++;
      else tierCounts.exploratory++;
    }
    return { ...c, totalSignals: cSigs.length, tierCounts };
  });

  const totalSignals    = signals.length;
  const totalConditions = conditions.length;
  const totalStrong     = signals.filter(
    (s) => (s.confidence_tier?.toLowerCase() ?? "") === "strong"
  ).length;

  // Aggregate tier counts for Figure 2
  const globalTierCounts: Record<TierKey, number> = { strong: 0, moderate: 0, emerging: 0, exploratory: 0 };
  for (const s of signals) {
    const t = (s.confidence_tier?.toLowerCase() ?? "exploratory") as TierKey;
    if (t in globalTierCounts) globalTierCounts[t]++;
    else globalTierCounts.exploratory++;
  }

  // Aggregate arm counts for Figure 2 (from signal_type field, if populated)
  const armCounts: Partial<Record<ArmKey, number>> = {};
  for (const s of signals) {
    const key = toArmKey((s as { signal_type?: string | null }).signal_type);
    if (key) armCounts[key] = (armCounts[key] ?? 0) + 1;
  }

  // Last review date from most-recent created_at (repurposing_signals has no updated_at column)
  const lastUpdated = signals
    .map((s) => s.created_at)
    .filter((d): d is string => !!d)
    .sort()
    .slice(-1)[0];

  const lastReviewLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "–";

  // Format sources count for the stat strip — locale-formatted (e.g. "2,228")
  const citationsLabel =
    typeof sourcesCount === "number" && sourcesCount > 0
      ? sourcesCount.toLocaleString("en-US")
      : "–";

  // Heatmap rows — same shape TierHeatmap expects
  const heatmapRows: HeatmapRow[] = conditionsWithStats.map((c) => ({
    id:    c.id,
    name:  c.name,
    slug:  c.slug,
    tiers: c.tierCounts,
    total: c.totalSignals,
  }));

  return (
    <main className="flex-1 flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "var(--paper)", borderBottom: "1px solid var(--rule)" }}
      >
        {/* Subtle paper texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
            zIndex: 0,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20" style={{ zIndex: 1 }}>

          {/* ── Two-column asymmetric layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 mb-14">

            {/* Left column: wordmark, headline, CTAs */}
            <div>
              {/* H1 */}
              <h1
                className="font-heading font-normal"
                style={{
                  color: "var(--ink)",
                  fontSize: "clamp(1.75rem, 3.8vw, 3.25rem)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  marginBottom: 36,
                  maxWidth: "20ch",
                }}
              >
                An evidence index for{" "}
                <span style={{ color: "var(--green-deep)", whiteSpace: "nowrap" }}>
                  under-studied
                </span>{" "}
                women&rsquo;s health conditions.
              </h1>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/conditions"
                  className="inline-flex items-center justify-center px-6 py-3 text-white text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--green-mid)" }}
                >
                  {totalSignals > 0 ? `Browse ${totalSignals} signals →` : "Browse conditions →"}
                </Link>
                <Link
                  href="/about/technical-architecture"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    border: "1px solid var(--green-mid)",
                    color: "var(--green-mid)",
                  }}
                >
                  How we score evidence
                </Link>
              </div>
            </div>

            {/* Right column — context and framing */}
            <div
              style={{
                paddingTop: 4,
                borderLeft: "1px solid var(--rule)",
                paddingLeft: "clamp(24px, 3vw, 40px)",
              }}
              className="hidden lg:block"
            >
              <p
                className="font-serif"
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.65,
                  color: "var(--ink-2)",
                  marginBottom: 20,
                }}
              >
                Women&rsquo;s health conditions are persistently{" "}
                <Link
                  href="/about/external-references"
                  style={{ color: "inherit", textDecoration: "underline", textDecorationThickness: "1px", textUnderlineOffset: "3px" }}
                >
                  underfunded
                </Link>
                , undertreated, and underdiagnosed relative to disease burden.
                Across the conditions Whel covers, diagnostic delays of years
                are common, FDA-approved therapies indicated for the syndrome
                itself are rare, and the published research base is thin.
                These are the conditions medicine has been slow to study.
              </p>
              <p
                style={{
                  fontSize: "0.9375rem",
                  lineHeight: 1.65,
                  color: "var(--muted)",
                }}
              >
                Whel aggregates four parallel streams of evidence and scores
                each signal across five dimensions, surfacing drug-repurposing
                hypotheses worth taking into formal study. Built for researchers,
                clinician-researchers, graduate students, journalists and
                advocates, and institutional funders.
              </p>
            </div>

          </div>

          {/* Right-column description visible on mobile (below headline) */}
          <div className="lg:hidden mb-10">
            <p
              className="font-serif"
              style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", marginBottom: 16 }}
            >
              Women&rsquo;s health conditions are persistently{" "}
              <Link
                href="/about/external-references"
                style={{ color: "inherit", textDecoration: "underline", textDecorationThickness: "1px", textUnderlineOffset: "3px" }}
              >
                underfunded
              </Link>
              , undertreated, and underdiagnosed relative to disease burden.
              Across the conditions Whel covers, diagnostic delays of years
              are common, FDA-approved therapies indicated for the syndrome
              itself are rare, and the published research base is thin.
              These are the conditions medicine has been slow to study.
            </p>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "var(--muted)" }}>
              Whel aggregates four parallel streams of evidence and scores
              each signal across five dimensions, surfacing drug-repurposing
              hypotheses worth taking into formal study. Built for researchers,
              clinician-researchers, graduate students, journalists and
              advocates, and institutional funders.
            </p>
          </div>

          {/* ── Stat strip ── */}
          <dl
            className="grid grid-cols-2 sm:grid-cols-4"
            style={{
              borderTop: "1px solid var(--ink)",
              paddingTop: 20,
              gap: 12,
            }}
          >
            {[
              {
                label: "Signals indexed",
                value: totalSignals > 0 ? String(totalSignals) : "–",
                sub:   "across 4 evidence arms",
              },
              {
                label: "Conditions covered",
                value: totalConditions > 0 ? String(totalConditions) : "–",
                sub:   "",
              },
              {
                label: "Strong-tier",
                value: totalStrong > 0 ? String(totalStrong) : "–",
                sub:
                  totalSignals > 0 && totalStrong > 0
                    ? `${((totalStrong / totalSignals) * 100).toFixed(1)}% of total`
                    : "",
              },
              {
                label: "Last review",
                value: lastReviewLabel,
                sub:   citationsLabel !== "–" ? `${citationsLabel} source citations` : "",
              },
            ].map(({ label, value, sub }) => (
              <div key={label}>
                <dt
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </dt>
                <dd
                  className="font-heading"
                  style={{
                    margin: 0,
                    fontSize: "clamp(1.6rem, 3vw, 2rem)",
                    fontWeight: 500,
                    lineHeight: 1.05,
                    letterSpacing: "-0.01em",
                    color: "var(--ink)",
                  }}
                >
                  {value}
                </dd>
                {sub ? (
                  <div
                    style={{
                      ...MONO,
                      fontSize: 10.5,
                      color: "var(--muted)",
                      letterSpacing: "0.02em",
                      marginTop: 4,
                    }}
                  >
                    {sub}
                  </div>
                ) : null}
              </div>
            ))}
          </dl>

        </div>
      </section>

      {/* ── Featured signal teaser ───────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)", backgroundColor: "var(--bg-2)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 lg:gap-14 items-start">

            {/* Left: eyebrow + meta */}
            <div>
              <div style={{ ...EYEBROW, marginBottom: 14 }}>Featured signal · 01</div>
              <div
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  color: "var(--muted)",
                  lineHeight: 1.7,
                }}
              >
                <div>Endometriosis · Anastrozole</div>
                <div>Pathway Insights · Strong (10 / 10)</div>
                <div>11 sources</div>
              </div>
            </div>

            {/* Right: headline + summary + CTA */}
            <div>
              <h2
                className="font-heading"
                style={{
                  fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)",
                  fontWeight: 500,
                  lineHeight: 1.12,
                  letterSpacing: "-0.012em",
                  color: "var(--ink)",
                  marginBottom: 16,
                  maxWidth: "30ch",
                }}
              >
                A breast cancer drug surfaces as a top endometriosis lead.
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.7,
                  color: "var(--ink-2)",
                  maxWidth: "62ch",
                  marginBottom: 18,
                }}
              >
                Anastrozole is an aromatase inhibitor approved for hormone
                receptor-positive breast cancer. Aromatase is also locally
                overexpressed in endometriotic lesions, where it sustains an
                estrogen loop that drives lesion growth. A walkthrough of how
                that connection surfaced in the database, the eleven sources it
                rests on, and the external clinical evidence it lines up with.
              </p>
              <Link
                href="/featured"
                style={{
                  ...MONO,
                  display: "inline-block",
                  fontSize: "12px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  borderBottom: "1px solid var(--ink)",
                  paddingBottom: 2,
                }}
              >
                Read the walkthrough →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Figure 1 — Confidence heatmap ────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ ...EYEBROW, marginBottom: 12 }}>Figure 1 · Confidence distribution</div>
              <h2
                className="font-heading"
                style={{
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 500,
                  lineHeight: 1.08,
                  letterSpacing: "-0.012em",
                  color: "var(--ink)",
                }}
              >
                Where the evidence sits, by condition.
              </h2>
            </div>
            {totalSignals > 0 && (
              <div
                className="font-mono"
                style={{ fontSize: 12, letterSpacing: "0.04em", color: "var(--muted)" }}
              >
                N = {totalSignals} SIGNALS · {totalConditions} × 4 MATRIX
              </div>
            )}
          </div>

          {heatmapRows.length > 0 ? (
            <TierHeatmap rows={heatmapRows} />
          ) : (
            <div
              className="font-mono"
              style={{
                border: "1px solid var(--rule)",
                background: "var(--paper)",
                padding: "32px",
                fontSize: 13,
                color: "var(--muted)",
                textAlign: "center",
              }}
            >
              Heatmap will populate once active signals are loaded.
            </div>
          )}

        </div>
      </section>

      {/* ── Figure 2 — Source → Arm → Tier provenance flow ───────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ ...EYEBROW, marginBottom: 12 }}>Figure 2 · Evidence provenance</div>
              <h2
                className="font-heading"
                style={{
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 500,
                  lineHeight: 1.08,
                  letterSpacing: "-0.012em",
                  color: "var(--ink)",
                }}
              >
                How signals flow from source to tier.
              </h2>
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 12, letterSpacing: "0.04em", color: "var(--muted)" }}
            >
              5 SOURCES → 4 ARMS → 4 TIERS
            </div>
          </div>

          <div style={{ border: "1px solid var(--rule)", background: "var(--paper)", padding: "28px 24px" }}>
            <SourceSankey
              tierCounts={globalTierCounts}
              armCounts={armCounts}
              total={totalSignals}
            />
          </div>

          <p
            className="font-mono"
            style={{
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.04em",
              marginTop: 12,
              lineHeight: 1.55,
            }}
          >
            Each curve is one provenance pathway. Tier node heights are proportional
            to signal count. Direct Research dominates the Strong tier; Pathway Insights
            and Community Forum signals concentrate in Emerging and Exploratory.
            ↑ Ribbon thickness scales with signal volume.
          </p>

        </div>
      </section>

      {/* ── Evidence framework ────────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

            {/* Left: description */}
            <div>
              <div style={{ ...EYEBROW, marginBottom: 12 }}>01 · Framework</div>
              <h2
                className="font-heading"
                style={{
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 500,
                  lineHeight: 1.08,
                  letterSpacing: "-0.012em",
                  marginBottom: 20,
                  color: "var(--ink)",
                }}
              >
                How evidence is evaluated
              </h2>
              <p style={{ color: "var(--ink-2)", fontSize: 15, lineHeight: 1.65, maxWidth: "52ch" }}>
                Every signal in Whel is scored before it enters the database. Each record
                is assessed across five dimensions: replication, source quality,
                specificity, biological plausibility, and consistency of direction. Each
                dimension is rated 0 to 2, summed to a 0 to 10 composite. Results are
                classified into a confidence tier, and sources and scores are visible
                on every card.
              </p>
              <div style={{ marginTop: 24 }}>
                <Link
                  href="/about/technical-architecture"
                  style={{
                    ...MONO,
                    fontSize: "12px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--ink)",
                    paddingBottom: 2,
                    color: "var(--ink)",
                  }}
                >
                  Read the methodology →
                </Link>
              </div>
            </div>

            {/* Right: Confidence tier widget */}
            <div style={{ border: "1px solid var(--ink)", background: "var(--paper)" }}>
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--rule)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  Confidence tiers
                </span>
                <span
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    letterSpacing: "0.08em",
                    color: "var(--muted)",
                  }}
                >
                  5 dimensions · 0–10 composite
                </span>
              </div>
              {TIERS.map((row, i) => (
                <div
                  key={row.key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 20,
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: i < 3 ? "1px solid var(--rule)" : "none",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      fontSize: "12px",
                      ...MONO,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      background: TIER_COLORS[row.key].bg,
                      color: TIER_COLORS[row.key].text,
                      fontWeight: 500,
                    }}
                  >
                    {row.label}
                  </span>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4 }}>
                    {row.desc}
                  </div>
                  <div
                    style={{
                      ...MONO,
                      fontSize: 13,
                      color: "var(--ink-2)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.range}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Conditions grid ───────────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-16 sm:pb-20">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 24,
              gap: 16,
            }}
          >
            <div>
              <div style={{ ...EYEBROW, marginBottom: 12 }}>02 · Index</div>
              <h2
                className="font-heading"
                style={{
                  fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                }}
              >
                Conditions covered.
              </h2>
            </div>
            <Link
              href="/conditions"
              className="font-mono"
              style={{
                fontSize: 12,
                color: "var(--green-mid)",
                whiteSpace: "nowrap",
                letterSpacing: "0.04em",
              }}
            >
              View all conditions →
            </Link>
          </div>

          {/* Hairline grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ borderTop: "1px solid var(--ink)", borderLeft: "1px solid var(--ink)" }}
          >
            {conditionsWithStats.map((c, i) => {
              const blurb    = c.description ?? "";
              const total    = Object.values(c.tierCounts).reduce((a, b) => a + b, 0);
              const tierOrder: TierKey[] = ["strong", "moderate", "emerging", "exploratory"];
              return (
                <Link
                  key={c.id}
                  href={`/conditions/${c.slug}`}
                  style={{
                    background: "var(--paper)",
                    padding: "28px 26px 24px",
                    borderRight: "1px solid var(--ink)",
                    borderBottom: "1px solid var(--ink)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    minHeight: 240,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.15s",
                  }}
                  className="hover:bg-[#f7f4ed]"
                >
                  <div
                    className="font-mono"
                    style={{ fontSize: "11px", letterSpacing: "0.16em", color: "var(--muted)" }}
                  >
                    C-{String(i + 1).padStart(2, "0")}
                  </div>
                  <h3
                    className="font-heading"
                    style={{
                      fontSize: 24,
                      lineHeight: 1.1,
                      fontWeight: 500,
                      margin: 0,
                      color: "var(--ink)",
                    }}
                  >
                    {c.name}
                  </h3>
                  {blurb && (
                    <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.45 }}>
                      {blurb}
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        gap: 12,
                      }}
                    >
                      <div>
                        <span
                          className="font-heading"
                          style={{ fontSize: 30, lineHeight: 1, fontWeight: 500, color: "var(--ink)" }}
                        >
                          {c.totalSignals}
                        </span>
                        <span
                          className="font-mono"
                          style={{
                            display: "block",
                            fontSize: "9.5px",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "var(--muted)",
                            marginTop: 6,
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
                          {tierOrder.map((t) => {
                            const pct = (c.tierCounts[t] / total) * 100;
                            if (pct === 0) return null;
                            return (
                              <span
                                key={t}
                                style={{
                                  display: "block",
                                  width: `${pct}%`,
                                  height: "100%",
                                  background: TIER_COLORS[t].bar,
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {total > 0 && (
                      <div
                        className="font-mono"
                        style={{
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
                        <span style={{ color: "var(--green-mid)", fontWeight: 500 }}>
                          Open →
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── Source arms ───────────────────────────────────────────────────────── */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-16 sm:pb-20">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 24,
              gap: 16,
            }}
          >
            <div>
              <div style={{ ...EYEBROW, marginBottom: 12 }}>03 · Source arms</div>
              <h2
                className="font-heading"
                style={{
                  fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                }}
              >
                How signals are categorized
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SIGNAL_TYPES.map((st) => (
              <Link
                key={st.num}
                href={st.href}
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--rule)",
                  padding: "24px 20px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  minHeight: 220,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 0.15s",
                }}
                className="hover:border-[#14180F]"
              >
                <div
                  className="font-mono"
                  style={{ fontSize: "10.5px", letterSpacing: "0.18em", color: "var(--muted)" }}
                >
                  {st.num}
                </div>
                <h3
                  className="font-heading"
                  style={{ fontSize: 20, lineHeight: 1.15, fontWeight: 500, margin: 0, color: "var(--ink)" }}
                >
                  {st.title}
                </h3>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", margin: 0, flex: 1 }}>
                  {st.desc}
                </p>
                <div
                  className="font-mono"
                  style={{
                    paddingTop: 12,
                    borderTop: "1px solid var(--rule)",
                    fontSize: "10.5px",
                    color: "var(--muted)",
                    letterSpacing: "0.05em",
                  }}
                >
                  Sources: {st.sources.join(", ")}
                </div>
                <span style={{ fontSize: "12.5px", color: "var(--green-mid)", fontWeight: 500 }}>
                  Read methodology →
                </span>
              </Link>
            ))}
          </div>

        </div>
      </section>

    </main>
  );
}
