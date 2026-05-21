import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ConditionsList from "./ConditionsList";
import type { TierKey } from "@/app/components/TierHeatmap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Conditions — Whel",
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
    return {
      ...c,
      conditionCode: `C-${String(i + 1).padStart(2, "0")}`,
      totalSignals: cSigs.length,
      tierCounts,
    };
  });

  const MONO: React.CSSProperties = {
    fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
  };

  return (
    <main className="flex-1" style={{ backgroundColor: "var(--bg)" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

          {/* Breadcrumb */}
          <nav
            style={{
              ...MONO,
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase" as const,
              color: "var(--muted)",
              marginBottom: 20,
            }}
          >
            <Link href="/" style={{ color: "var(--muted)" }}>
              Home
            </Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <span style={{ color: "var(--ink)" }}>Conditions</span>
          </nav>

          <h1
            className="font-heading"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: 16,
            }}
          >
            Conditions index.
          </h1>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.65,
              color: "var(--ink-2)",
              maxWidth: "48ch",
            }}
          >
            {conditionsWithStats.length} condition
            {conditionsWithStats.length !== 1 ? "s" : ""} with active
            drug-repurposing signals in the database.
          </p>
        </div>
      </div>

      {/* ── Conditions grid ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <ConditionsList conditions={conditionsWithStats} />
      </div>

    </main>
  );
}
