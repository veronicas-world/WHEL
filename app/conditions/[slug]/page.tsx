import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ResearchSignalsTabs, { type Signal } from "./ResearchSignalsTabs";
import { toArmKey, ARM_LABELS, type ArmKey } from "@/lib/arm-mapping";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await supabase
    .from("conditions")
    .select("name")
    .eq("slug", slug)
    .single();
  return { title: data?.name ? `${data.name} | Whel` : "Condition | Whel" };
}

function slugToPrefix(slug: string): string {
  const map: Record<string, string> = {
    adenomyosis: "ADENO",
    endometriosis: "ENDO",
    pcos: "PCOS",
    "perimenopause-menopause": "PERI",
    pmdd: "PMDD",
    vulvodynia: "VULV",
  };
  return map[slug] ?? slug.toUpperCase().replace(/-/g, "").slice(0, 4);
}

type TierKey = "strong" | "moderate" | "emerging" | "exploratory";

const TIERS: { key: TierKey; label: string; token: string }[] = [
  { key: "strong",      label: "Strong",      token: "var(--tier-strong)"      },
  { key: "moderate",    label: "Moderate",    token: "var(--tier-moderate)"    },
  { key: "emerging",    label: "Emerging",    token: "var(--tier-emerging)"    },
  { key: "exploratory", label: "Exploratory", token: "var(--tier-exploratory)" },
];

const ARMS: { key: ArmKey; label: string; token: string }[] = [
  { key: "direct",    label: ARM_LABELS.direct,    token: "var(--arm-direct)"    },
  { key: "cross",     label: ARM_LABELS.cross,     token: "var(--arm-cross)"     },
  { key: "pathway",   label: ARM_LABELS.pathway,   token: "var(--arm-pathway)"   },
  { key: "community", label: ARM_LABELS.community, token: "var(--arm-community)" },
];

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatReviewDate(isoStrings: string[]): string {
  if (!isoStrings.length) return "—";
  const latest = isoStrings.reduce((a, b) => (a > b ? a : b));
  const d = new Date(latest);
  if (Number.isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default async function ConditionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [
    { data: allConditions },
    { data: condition, error: conditionError },
  ] = await Promise.all([
    supabase.from("conditions").select("slug").order("name"),
    supabase
      .from("conditions")
      .select("*, key_facts")
      .eq("slug", slug)
      .single(),
  ]);

  if (conditionError || !condition) notFound();

  const conditionIndex = (allConditions ?? []).findIndex((c) => c.slug === slug);
  const code = conditionIndex >= 0
    ? `C-${String(conditionIndex + 1).padStart(2, "0")}`
    : "";
  const signalPrefix = slugToPrefix(slug);

  const { data: rawSignals } = await supabase
    .from("repurposing_signals")
    .select(
      `
      id,
      signal_type,
      evidence_strength,
      confidence_tier,
      replication_score,
      source_quality_score,
      specificity_score,
      plausibility_score,
      direction_score,
      total_evidence_score,
      effect_direction,
      replication_level,
      plausibility_level,
      summary,
      mechanism_hypothesis,
      status,
      created_at,
      compounds (
        name,
        generic_name,
        drug_class,
        fda_status
      ),
      sources (
        id,
        source_type,
        external_id,
        title,
        authors,
        journal,
        publication_date,
        url,
        key_finding_excerpt
      )
      `
    )
    .eq("condition_id", condition.id)
    .order("created_at");

  const signals = (rawSignals ?? []) as unknown as Signal[];
  const total = signals.length;

  // Tier counts
  const tierCounts: Record<TierKey, number> = {
    strong: 0, moderate: 0, emerging: 0, exploratory: 0,
  };
  for (const s of signals) {
    const t = (s.confidence_tier?.toLowerCase() ?? "exploratory") as TierKey;
    if (t in tierCounts) tierCounts[t]++;
    else tierCounts.exploratory++;
  }

  // Arm counts
  const armCounts: Record<ArmKey, number> = {
    direct: 0, cross: 0, pathway: 0, community: 0,
  };
  for (const s of signals) {
    const arm = toArmKey(s.signal_type) ?? "direct";
    armCounts[arm]++;
  }

  // Figure caption inputs — derived from the data, never asserted
  const topTier = [...TIERS].sort(
    (a, b) => tierCounts[b.key] - tierCounts[a.key],
  )[0];
  const armsRanked = [...ARMS].sort(
    (a, b) => armCounts[b.key] - armCounts[a.key],
  );
  const topArm = armsRanked[0];
  const bottomArm = armsRanked[armsRanked.length - 1];

  // Last review from max created_at
  const createdAts = (rawSignals ?? [])
    .map((s: Record<string, unknown>) => s.created_at as string)
    .filter(Boolean);
  const lastReview = formatReviewDate(createdAts);

  // Pre-assign stable signal IDs by created_at position
  const signalIds: Record<string, string> = {};
  signals.forEach((s, i) => {
    signalIds[s.id] = `${signalPrefix}-${i + 1}`;
  });

  const keyFacts =
    (condition.key_facts as { label: string; value: string }[] | null) ?? [];

  const hasContext = condition.biology_summary || condition.underfunding_notes;

  return (
    <main className="flex-1" style={{ background: "var(--bg)" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-12 md:gap-16 items-start">

            {/* Left: condition hero */}
            <div>
              {/* Breadcrumb */}
              <nav
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>
                  Home
                </Link>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
                <Link href="/conditions" style={{ color: "var(--muted)", textDecoration: "none" }}>
                  Conditions
                </Link>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
                <span style={{ color: "var(--ink)" }}>{condition.name}</span>
              </nav>

              {/* Eyebrow */}
              <p
                className="eyebrow"
                style={{ marginBottom: 10 }}
              >
                CONDITION · {code}
              </p>

              {/* H1 */}
              <h1
                className="font-heading"
                style={{
                  fontSize: "clamp(2rem, 4.2vw, 3.25rem)",
                  fontWeight: 500,
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                  marginBottom: 20,
                }}
              >
                {condition.name}.
              </h1>

              {/* Description */}
              {condition.description && (
                <p
                  style={{
                    fontSize: "1rem",
                    lineHeight: 1.65,
                    color: "var(--ink-2)",
                    maxWidth: "62ch",
                    marginBottom: 28,
                  }}
                >
                  {condition.description}
                </p>
              )}

              {/* Fact pills from key_facts */}
              {keyFacts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {keyFacts.map((fact, i) => (
                    <div
                      key={i}
                      style={{
                        borderLeft: "1px solid var(--rule-strong)",
                        paddingLeft: 12,
                      }}
                    >
                      <p
                        style={{
                          ...MONO,
                          fontSize: 10,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                          marginBottom: 4,
                        }}
                      >
                        {fact.label}
                      </p>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          lineHeight: 1.5,
                          color: "var(--ink)",
                        }}
                      >
                        {fact.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: AT A GLANCE sidebar */}
            <div className="md:pt-12">
              <p
                className="eyebrow"
                style={{ marginBottom: 20 }}
              >
                AT A GLANCE
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {(
                    [
                      { label: "Total signals indexed", value: String(total) },
                      { label: "Strong-tier",       value: String(tierCounts.strong) },
                      { label: "Moderate-tier",     value: String(tierCounts.moderate) },
                      { label: "Emerging-tier",     value: String(tierCounts.emerging) },
                      { label: "Exploratory-tier",  value: String(tierCounts.exploratory) },
                      { label: "Last reviewed",     value: lastReview },
                    ] as const
                  ).map(({ label, value }, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: "1px solid var(--rule)" }}
                    >
                      <td
                        style={{
                          padding: "10px 0",
                          fontSize: "0.875rem",
                          color: "var(--ink-2)",
                          lineHeight: 1.4,
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          padding: "10px 0",
                          fontSize: "0.875rem",
                          color: "var(--ink)",
                          textAlign: "right",
                          ...MONO,
                        }}
                      >
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>

      {/* ── Figures ──────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">

            {/* Figure A: Tier distribution */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 12 }}>
                FIGURE A · TIER DISTRIBUTION
              </p>
              <h3
                className="font-heading"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 28,
                  letterSpacing: "-0.01em",
                }}
              >
                Signals per confidence tier
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TIERS.map((tier) => {
                  const count = tierCounts[tier.key];
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={tier.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          ...MONO,
                          fontSize: 10,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase" as const,
                          color: "var(--muted)",
                          width: 90,
                          flexShrink: 0,
                        }}
                      >
                        {tier.label}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 18,
                          background: "var(--rule)",
                          position: "relative" as const,
                        }}
                      >
                        {pct > 0 && (
                          <div
                            style={{
                              position: "absolute" as const,
                              left: 0, top: 0, bottom: 0,
                              width: `${pct}%`,
                              background: tier.token,
                            }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          ...MONO,
                          fontSize: 12,
                          color: "var(--ink)",
                          width: 24,
                          textAlign: "right" as const,
                          flexShrink: 0,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p
                className="font-heading"
                style={{
                  fontSize: "0.875rem",
                  fontStyle: "italic",
                  color: "var(--ink-2)",
                  marginTop: 20,
                  lineHeight: 1.6,
                }}
              >
                {total > 0 ? (
                  <>
                    The largest single group is the {topTier.label} tier (
                    {tierCounts[topTier.key]}); {tierCounts.strong} of the {total}{" "}
                    indexed signals reach Strong, the tier reserved for the most
                    robust, replicated evidence.
                  </>
                ) : (
                  <>
                    No repurposing signals have been indexed for{" "}
                    {condition.name.toLowerCase()} yet.
                  </>
                )}
              </p>
            </div>

            {/* Figure B: Arm composition */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 12 }}>
                FIGURE B · ARM COMPOSITION
              </p>
              <h3
                className="font-heading"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 28,
                  letterSpacing: "-0.01em",
                }}
              >
                Where each signal originates
              </h3>

              {/* Stacked bar */}
              <div style={{ display: "flex", height: 44, marginBottom: 16 }}>
                {ARMS.map((arm) => {
                  const count = armCounts[arm.key];
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={arm.key}
                      title={`${arm.label}: ${count}`}
                      style={{
                        width: `${pct}%`,
                        background: arm.token,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--paper)",
                        fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
                        fontSize: 13,
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginBottom: 20 }}>
                {ARMS.map((arm) => {
                  const count = armCounts[arm.key];
                  if (count === 0) return null;
                  return (
                    <span
                      key={arm.key}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "0.8125rem",
                        color: "var(--ink-2)",
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          background: arm.token,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      {arm.label} · {count}
                    </span>
                  );
                })}
              </div>

              <p
                className="font-heading"
                style={{
                  fontSize: "0.875rem",
                  fontStyle: "italic",
                  color: "var(--ink-2)",
                  lineHeight: 1.6,
                }}
              >
                {total > 0 ? (
                  <>
                    {topArm.label} contributes the most signals (
                    {armCounts[topArm.key]}); {bottomArm.label} the fewest (
                    {armCounts[bottomArm.key]}). Each evidence arm applies its own
                    inclusion threshold.
                  </>
                ) : (
                  <>Arm composition will appear once signals are indexed.</>
                )}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Biology / Research & Funding context ─────────────────────────── */}
      {hasContext && (
        <div style={{ borderBottom: "1px solid var(--rule)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-16">
              {condition.biology_summary && (
                <div>
                  <p className="eyebrow" style={{ marginBottom: 12 }}>BIOLOGY</p>
                  <h3
                    className="font-heading"
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 500,
                      color: "var(--ink)",
                      marginBottom: 12,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Biological context
                  </h3>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--ink-2)" }}>
                    {condition.biology_summary}
                  </p>
                </div>
              )}
              {condition.underfunding_notes && (
                <div>
                  <p className="eyebrow" style={{ marginBottom: 12 }}>RESEARCH &amp; FUNDING</p>
                  <h3
                    className="font-heading"
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 500,
                      color: "var(--ink)",
                      marginBottom: 12,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Research landscape
                  </h3>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--ink-2)" }}>
                    {condition.underfunding_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Signals section ───────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <p className="eyebrow" style={{ marginBottom: 12 }}>REPURPOSING SIGNALS</p>
        <h2
          className="font-heading"
          style={{
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            marginBottom: 12,
          }}
        >
          {total} signals indexed.
        </h2>
        <p
          style={{
            fontSize: "0.9375rem",
            lineHeight: 1.65,
            color: "var(--ink-2)",
            marginBottom: 40,
            maxWidth: "60ch",
          }}
        >
          Existing drugs and compounds with published evidence, cross-condition
          signals, or mechanistic overlap for{" "}
          {condition.name.toLowerCase()}.
        </p>

        <ResearchSignalsTabs
          signals={signals}
          signalIds={signalIds}
          conditionName={condition.name}
        />
      </div>

    </main>
  );
}
