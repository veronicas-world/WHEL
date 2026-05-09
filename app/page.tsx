import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TierKey = "strong" | "moderate" | "emerging" | "exploratory";

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
    href: "/about/direct-research",
  },
  {
    num: "02",
    title: "Cross-Condition Signals",
    desc: "Drugs developed for other conditions where women incidentally reported benefit.",
    sources: ["PubMed", "Trial registries"],
    href: "/about/cross-condition",
  },
  {
    num: "03",
    title: "Pathway Insights",
    desc: "Signals from biological pathway and target analysis, including drugs with mechanistic or genetic evidence of relevance, and adverse event patterns revealing underlying disease biology.",
    sources: ["Open Targets", "FDA labels", "EMA reports"],
    href: "/about/pathways",
  },
  {
    num: "04",
    title: "Community Reports",
    desc: "Consistent treatment patterns reported across condition-specific patient communities.",
    sources: ["Patient forums"],
    href: "/about/community-reports",
  },
];

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const EYEBROW: React.CSSProperties = {
  ...MONO,
  fontSize: "11px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "#777",
};

export default async function Home() {
  const [{ data: conditionsRaw }, { data: signalsRaw }, { count: sourcesCount }] = await Promise.all([
    supabase.from("conditions").select("id, name, slug, description").order("name"),
    supabase
      .from("repurposing_signals")
      .select("condition_id, confidence_tier, total_evidence_score")
      .eq("status", "active")
      .not("total_evidence_score", "is", null)
      .gt("total_evidence_score", 0),
    supabase.from("sources").select("*", { count: "exact", head: true }),
  ]);

  const conditions = conditionsRaw ?? [];
  const signals = signalsRaw ?? [];

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

  const totalSignals = signals.length;
  const totalConditions = conditions.length;

  // Format citation count: raw number under 1000, "X.XK" format above.
  const citationsLabel =
    typeof sourcesCount === "number" && sourcesCount > 0
      ? sourcesCount >= 1000
        ? `${(sourcesCount / 1000).toFixed(1)}K`
        : String(sourcesCount)
      : "2.2K";

  return (
    <main className="flex-1 flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
            zIndex: 0,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28" style={{ zIndex: 1 }}>

          {/* Eyebrow meta */}
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              marginBottom: 32,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                ...MONO,
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#4D5E4D",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  background: "#4D5E4D",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              Research instrument
            </span>
            <span
              style={{
                ...MONO,
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#999",
              }}
            >
              Updated May 2026
            </span>
          </div>

          <h1
            className="font-heading font-normal leading-tight"
            style={{ color: "#1a1a1a", fontSize: "clamp(2.75rem, 6.5vw, 5.75rem)", marginBottom: 32 }}
          >
            Addressing the data gap in under-researched female hormonal conditions
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed max-w-2xl"
            style={{ color: "#333", marginBottom: 36 }}
          >
            WHEL is a drug repurposing research tool that aggregates and analyzes data from published
            clinical literature, trial registries, regulatory adverse event databases, and patient
            community forums to identify therapeutic candidates for under-researched female hormonal
            conditions. Signals are organized by source type and evidence strength, and every result
            links to its primary source.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/conditions"
              className="inline-flex items-center justify-center px-6 py-3 text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#4D5E4D" }}
            >
              Browse conditions →
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: "transparent", border: "1px solid #4D5E4D", color: "#4D5E4D" }}
            >
              Search database
            </Link>
          </div>

          {/* Stats strip */}
          <dl
            style={{
              borderTop: "1px solid #1a1a1a",
              marginTop: 52,
              paddingTop: 20,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {[
              { label: "Conditions",     value: totalConditions > 0 ? String(totalConditions) : "6"   },
              { label: "Signals indexed", value: totalSignals > 0    ? String(totalSignals)    : "281" },
              { label: "Data sources",   value: "5"   },
              { label: "Citations",      value: citationsLabel },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#888",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </dt>
                <dd
                  className="font-heading"
                  style={{ margin: 0, fontSize: "30px", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.01em" }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Evidence framework ────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid #E0DDD8" }}>
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
                }}
              >
                How evidence is evaluated
              </h2>
              <p style={{ color: "#444", fontSize: 15, lineHeight: 1.65, maxWidth: "52ch" }}>
                Every signal in WHEL is scored before it enters the database. Each record is assessed
                across five dimensions: replication, source quality, specificity, biological
                plausibility, and consistency of direction. Results are classified into a confidence
                tier, and sources and scores are visible on every card.
              </p>
              <div style={{ marginTop: 24 }}>
                <Link
                  href="/about/technical-architecture"
                  style={{
                    ...MONO,
                    fontSize: "12px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #1a1a1a",
                    paddingBottom: 2,
                    color: "#1a1a1a",
                  }}
                >
                  Read the methodology →
                </Link>
              </div>
            </div>

            {/* Right: TierFramework widget */}
            <div style={{ border: "1px solid #1a1a1a", background: "#fff" }}>
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid #E0DDD8",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ ...MONO, fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#777" }}>
                  Confidence tiers
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
                    borderBottom: i < 3 ? "1px solid #E0DDD8" : "none",
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
                  <div>
                    <div style={{ fontSize: 12.5, color: "#777", lineHeight: 1.4 }}>{row.desc}</div>
                  </div>
                  <div style={{ ...MONO, fontSize: 13, color: "#555", whiteSpace: "nowrap" }}>{row.range}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Conditions grid ───────────────────────────────────────────────── */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-4">

          {/* Section head */}
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
              <div style={{ ...EYEBROW, marginBottom: 12 }}>02 · Conditions</div>
              <h2
                className="font-heading"
                style={{
                  fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                }}
              >
                Conditions with active drug repurposing signals in the database
              </h2>
            </div>
            <Link
              href="/conditions"
              style={{ fontSize: 14, color: "#4D5E4D", whiteSpace: "nowrap" }}
            >
              View all →
            </Link>
          </div>

          {/* Hairline grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ borderTop: "1px solid #1a1a1a", borderLeft: "1px solid #1a1a1a" }}
          >
            {conditionsWithStats.map((c, i) => {
              const blurb = c.description ?? "";
              const total = Object.values(c.tierCounts).reduce((a, b) => a + b, 0);
              const tierOrder: TierKey[] = ["strong", "moderate", "emerging", "exploratory"];
              return (
                <Link
                  key={c.id}
                  href={`/conditions/${c.slug}`}
                  style={{
                    background: "#fff",
                    padding: "28px 26px 24px",
                    borderRight: "1px solid #1a1a1a",
                    borderBottom: "1px solid #1a1a1a",
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
                  <div style={{ ...MONO, fontSize: "11px", letterSpacing: "0.16em", color: "#999" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3
                    className="font-heading"
                    style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 500, margin: 0 }}
                  >
                    {c.name}
                  </h3>
                  {blurb && (
                    <div style={{ fontSize: "12.5px", color: "#777", lineHeight: 1.45 }}>{blurb}</div>
                  )}
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 16,
                      borderTop: "1px dashed #E0DDD8",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      gap: 12,
                    }}
                  >
                    <div>
                      <span className="font-heading" style={{ fontSize: 30, lineHeight: 1, fontWeight: 500 }}>
                        {c.totalSignals}
                      </span>
                      <span
                        style={{
                          display: "block",
                          ...MONO,
                          fontSize: "9.5px",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "#999",
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
                          border: "1px solid #1a1a1a",
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
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Source arms ───────────────────────────────────────────────────── */}
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
                  background: "#fff",
                  border: "1px solid #E0DDD8",
                  padding: "24px 20px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  minHeight: 220,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 0.15s",
                }}
                className="hover:border-[#1a1a1a]"
              >
                <div style={{ ...MONO, fontSize: "10.5px", letterSpacing: "0.18em", color: "#999" }}>{st.num}</div>
                <h3
                  className="font-heading"
                  style={{ fontSize: 20, lineHeight: 1.15, fontWeight: 500, margin: 0 }}
                >
                  {st.title}
                </h3>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: "#555", margin: 0, flex: 1 }}>{st.desc}</p>
                <div
                  style={{
                    paddingTop: 12,
                    borderTop: "1px solid #E0DDD8",
                    ...MONO,
                    fontSize: "10.5px",
                    color: "#999",
                    letterSpacing: "0.05em",
                  }}
                >
                  Sources: {st.sources.join(", ")}
                </div>
                <span style={{ fontSize: "12.5px", color: "#4D5E4D", fontWeight: 500 }}>
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
