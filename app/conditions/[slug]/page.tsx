import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCandidates } from "@/lib/substrate-candidates";

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

type TierKey = "strong" | "moderate" | "emerging" | "exploratory";
type ArmKey = "direct" | "pathway" | "community";

const TIERS: { key: TierKey; label: string; token: string }[] = [
  { key: "strong",      label: "Strong",      token: "var(--tier-strong)"      },
  { key: "moderate",    label: "Moderate",    token: "var(--tier-moderate)"    },
  { key: "emerging",    label: "Emerging",    token: "var(--tier-emerging)"    },
  { key: "exploratory", label: "Exploratory", token: "var(--tier-exploratory)" },
];

// Three evidence arms (cross-condition is no longer an arm — it is a derived lens).
const ARMS: { key: ArmKey; label: string; token: string }[] = [
  { key: "direct",    label: "Direct",    token: "var(--arm-direct)"    },
  { key: "pathway",   label: "Pathway",   token: "var(--arm-pathway)"   },
  { key: "community", label: "Community", token: "var(--arm-community)" },
];

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
};

export default async function ConditionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [
    { data: allConditions },
    { data: condition, error: conditionError },
    allCandidates,
  ] = await Promise.all([
    supabase.from("conditions").select("slug").order("name"),
    supabase
      .from("conditions")
      .select("*, key_facts")
      .eq("slug", slug)
      .single(),
    getCandidates(),
  ]);

  if (conditionError || !condition) notFound();

  const conditionIndex = (allConditions ?? []).findIndex((c) => c.slug === slug);
  const code = conditionIndex >= 0
    ? `C-${String(conditionIndex + 1).padStart(2, "0")}`
    : "";

  // Aggregate-only: count this condition's substrate pairs by headline tier and
  // by which evidence arms contribute, without sending any specific candidate to
  // the client (the candidates live behind the access wall).
  const condCands = allCandidates.filter((c) => c.conditionId === slug);
  const total = condCands.length;

  const tierCounts: Record<TierKey, number> = {
    strong: 0, moderate: 0, emerging: 0, exploratory: 0,
  };
  for (const c of condCands) tierCounts[c.tier]++;

  // Arm composition: how many arm-readings each evidence arm contributes across
  // this condition's pairs (a pair can carry Direct + Pathway + Community).
  const armCounts: Record<ArmKey, number> = { direct: 0, pathway: 0, community: 0 };
  for (const c of condCands) for (const a of c.arms ?? []) armCounts[a.arm]++;

  // Figure caption inputs — derived from the data, never asserted
  const topTier = [...TIERS].sort(
    (a, b) => tierCounts[b.key] - tierCounts[a.key],
  )[0];
  const armsRanked = [...ARMS].sort(
    (a, b) => armCounts[b.key] - armCounts[a.key],
  );
  const topArm = armsRanked[0];
  const bottomArm = armsRanked[armsRanked.length - 1];

  const keyFacts =
    (condition.key_facts as { label: string; value: string }[] | null) ?? [];

  const hasContext = condition.biology_summary || condition.underfunding_notes;

  return (
    <main>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="surface-ink" style={{ paddingTop: 40, paddingBottom: 56 }}>
        <div className="container">
          <div className="crumbs on-ink" style={{ marginBottom: 22 }}>
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/conditions">Conditions</Link>
            <span className="sep">/</span>
            <span className="here">{condition.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-12 md:gap-16 items-start hero-grid">

            {/* Left: condition hero */}
            <div>
              <div className="eyebrow on-ink" style={{ marginBottom: 12 }}>
                CONDITION · {code}
              </div>

              <h1
                className="display"
                style={{
                  fontSize: "clamp(2rem, 4.2vw, 3.25rem)",
                  lineHeight: 1.08,
                  color: "var(--on-ink)",
                  marginBottom: 20,
                }}
              >
                {condition.name}.
              </h1>

              {condition.description && (
                <p className="lede" style={{ color: "var(--on-ink-2)", maxWidth: "60ch", marginBottom: 28 }}>
                  {condition.description}
                </p>
              )}

              {keyFacts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {keyFacts.map((fact, i) => (
                    <div key={i} style={{ borderLeft: "1px solid rgba(244,239,230,0.22)", paddingLeft: 12 }}>
                      <p
                        style={{
                          ...MONO,
                          fontSize: 10,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--on-ink-2)",
                          marginBottom: 4,
                        }}
                      >
                        {fact.label}
                      </p>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.5, color: "var(--on-ink)" }}>
                        {fact.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: At a glance */}
            <div className="md:pt-12">
              <div className="eyebrow on-ink" style={{ marginBottom: 20 }}>At a glance</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {(
                    [
                      { label: "Total signals indexed", value: String(total) },
                      { label: "Strong-tier",       value: String(tierCounts.strong) },
                      { label: "Moderate-tier",     value: String(tierCounts.moderate) },
                      { label: "Emerging-tier",     value: String(tierCounts.emerging) },
                      { label: "Exploratory-tier",  value: String(tierCounts.exploratory) },
                    ] as const
                  ).map(({ label, value }, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(244,239,230,0.14)" }}>
                      <td style={{ padding: "10px 0", fontSize: "0.875rem", color: "var(--on-ink-2)", lineHeight: 1.4 }}>
                        {label}
                      </td>
                      <td style={{ padding: "10px 0", fontSize: "0.875rem", color: "var(--on-ink)", textAlign: "right", ...MONO }}>
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </section>

      {/* ── Signal breakdown — figures ───────────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: 26 }}>Signal breakdown</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">

            {/* Figure A: Tier distribution */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 12 }}>FIGURE A · TIER DISTRIBUTION</p>
              <h3 className="font-heading" style={{ fontSize: "1.5rem", fontWeight: 500, color: "var(--ink)", marginBottom: 28, letterSpacing: "-0.01em" }}>
                Signals per confidence tier
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TIERS.map((tier) => {
                  const count = tierCounts[tier.key];
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={tier.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", width: 90, flexShrink: 0 }}>
                        {tier.label}
                      </span>
                      <div style={{ flex: 1, height: 18, background: "var(--rule)", position: "relative" as const }}>
                        {pct > 0 && (
                          <div style={{ position: "absolute" as const, left: 0, top: 0, bottom: 0, width: `${pct}%`, background: tier.token }} />
                        )}
                      </div>
                      <span style={{ ...MONO, fontSize: 12, color: "var(--ink)", width: 24, textAlign: "right" as const, flexShrink: 0 }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="font-heading" style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--body)", marginTop: 20, lineHeight: 1.6 }}>
                {total > 0 ? (
                  <>
                    The largest single group is the {topTier.label} tier (
                    {tierCounts[topTier.key]}); {tierCounts.strong} of the {total}{" "}
                    indexed signals reach Strong, the tier reserved for the most
                    robust, replicated evidence.
                  </>
                ) : (
                  <>No repurposing signals have been indexed for {condition.name.toLowerCase()} yet.</>
                )}
              </p>
            </div>

            {/* Figure B: Arm composition */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 12 }}>FIGURE B · ARM COMPOSITION</p>
              <h3 className="font-heading" style={{ fontSize: "1.5rem", fontWeight: 500, color: "var(--ink)", marginBottom: 28, letterSpacing: "-0.01em" }}>
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
                    <span key={arm.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--body)" }}>
                      <span style={{ width: 10, height: 10, background: arm.token, display: "inline-block", flexShrink: 0 }} />
                      {arm.label} · {count}
                    </span>
                  );
                })}
              </div>

              <p className="font-heading" style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--body)", lineHeight: 1.6 }}>
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
      </section>

      {/* ── Biology / Research & Funding context ─────────────────────────── */}
      {hasContext && (
        <section className="surface-paper section">
          <div className="container">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-16">
              {condition.biology_summary && (
                <div>
                  <p className="eyebrow" style={{ marginBottom: 12 }}>BIOLOGY</p>
                  <h3 className="font-heading" style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--ink)", marginBottom: 12, letterSpacing: "-0.01em" }}>
                    Biological context
                  </h3>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--body)" }}>
                    {condition.biology_summary}
                  </p>
                </div>
              )}
              {condition.underfunding_notes && (
                <div>
                  <p className="eyebrow" style={{ marginBottom: 12 }}>RESEARCH &amp; FUNDING</p>
                  <h3 className="font-heading" style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--ink)", marginBottom: 12, letterSpacing: "-0.01em" }}>
                    Research landscape
                  </h3>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--body)" }}>
                    {condition.underfunding_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Repurposing signals — gated ──────────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
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
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--body)", marginBottom: 36, maxWidth: "62ch" }}>
            The breakdown above shows how those {total} signals grade out by
            confidence tier and where each one originates. The candidates
            themselves, the specific approved drugs with their verbatim-verified
            evidence across the direct, pathway, and community arms for{" "}
            {condition.name.toLowerCase()}, sit behind access while Whel is in
            research preview.
          </p>

          {/* Access gate */}
          <div
            style={{
              border: "1px solid var(--rule-strong)",
              borderLeft: "3px solid var(--moss)",
              background: "var(--paper)",
              padding: "28px 30px",
              maxWidth: 720,
            }}
          >
            <div style={{ ...MONO, fontSize: "10.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>
              The candidates
            </div>
            <h3 className="font-heading" style={{ fontSize: "1.35rem", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 12 }}>
              Explore the candidates.
            </h3>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--body)", maxWidth: "58ch", marginBottom: 22 }}>
              Each candidate carries its full evidence trail: scored across five
              dimensions, graded from strong to exploratory, with every source and
              date attached so it can be checked. Every candidate is open to read in full.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link
                href="/candidates"
                style={{ ...MONO, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--paper)", background: "var(--ink)", padding: "11px 18px", textDecoration: "none" }}
              >
                View all candidates &rarr;
              </Link>
              <Link
                href="/signal-types"
                style={{ ...MONO, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink)", border: "1px solid var(--rule-strong)", padding: "11px 18px", textDecoration: "none" }}
              >
                How signals are scored
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
