import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ConditionsList from "./ConditionsList";
import type { TierKey } from "@/app/components/TierHeatmap";
import { getLGradeDistributionForCondition } from "@/lib/evidence-grading-snapshot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Conditions | Whel",
};

export default async function ConditionsPage() {
  const [
    { data: conditionsRaw },
    { data: signalsRaw },
  ] = await Promise.all([
    supabase
      .from("conditions")
      .select("id, name, slug, description")
      .order("name"),
    supabase
      .from("repurposing_signals")
      .select("condition_id, confidence_tier")
      .eq("status", "active")
      .not("total_evidence_score", "is", null)
      .gt("total_evidence_score", 0),
  ]);

  const conditions = conditionsRaw ?? [];
  const signals    = signalsRaw   ?? [];

  const conditionsWithStats = conditions.map((c, i) => {
    const cSigs = signals.filter((s) => s.condition_id === c.id);
    const tierCounts: Record<TierKey, number> = {
      strong: 0, moderate: 0, emerging: 0, exploratory: 0,
    };
    for (const s of cSigs) {
      const t = (s.confidence_tier?.toLowerCase() ?? "exploratory") as TierKey;
      if (t in tierCounts) tierCounts[t]++;
      else tierCounts.exploratory++;
    }
    // Per-condition L-grade distribution from the audit snapshot. Keyed by
    // canonical condition.name (the same name passed to the chip lookup on
    // the detail page), so /conditions and /conditions/[slug] grade the
    // same pairs against the same rubric.
    const lGradeCounts = getLGradeDistributionForCondition(c.name);

    return {
      ...c,
      conditionCode: `C-${String(i + 1).padStart(2, "0")}`,
      totalSignals: cSigs.length,
      tierCounts,
      lGradeCounts,
    };
  });

  const MONO: React.CSSProperties = {
    fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
  };

  return (
    <main>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="surface-ink" style={{ paddingTop: 44, paddingBottom: 60 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Conditions</span>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>Conditions</div>
          <h1
            className="display"
            style={{ color: "var(--on-ink)", fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)", lineHeight: 1.08, maxWidth: "18ch" }}
          >
            The conditions we cover.
          </h1>
          <p className="lede" style={{ marginTop: 24, color: "var(--on-ink-2)", maxWidth: "54ch" }}>
            {conditionsWithStats.length} condition
            {conditionsWithStats.length !== 1 ? "s" : ""} with active
            drug-repurposing signals in the database, each shown with its evidence
            breakdown.
          </p>
        </div>
      </section>

      {/* ── Scope + grid ─────────────────────────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">

          {/* Why these six — pointer to the Roadmap */}
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              borderLeft: "3px solid var(--moss)",
              padding: "22px 26px",
              marginBottom: 36,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "10px 28px",
            }}
          >
            <div style={{ maxWidth: "64ch" }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Scope</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.66, color: "var(--body)" }}>
                These six conditions were selected against three criteria: shared
                biology, documented neglect, and a focus on women&apos;s hormonal and
                reproductive health. They converge on the same handful of systems,
                including estrogen signaling, chronic inflammation, metabolic
                regulation, and pain processing, and that overlap is what makes
                cross-condition reasoning valid, because a signal in one condition
                can be informative about the others. The same criteria guide which
                conditions are added next.
              </p>
            </div>
            <Link
              href="/about/roadmap"
              style={{
                ...MONO,
                fontSize: "12px",
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                color: "var(--moss)",
                whiteSpace: "nowrap",
              }}
            >
              Why these six, and what&apos;s next &rarr;
            </Link>
          </div>

          <ConditionsList conditions={conditionsWithStats} />
        </div>
      </section>

    </main>
  );
}
