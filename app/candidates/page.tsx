import type { Metadata } from "next";
import Link from "next/link";
import CandidateCard from "@/app/components/CandidateCard";
import { getCandidates, getCorpusScope } from "@/lib/substrate-candidates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Candidates",
  description: "Whel's full drug-repurposing candidate index, scored across five dimensions, tiered by confidence, and traceable to every source.",
};

const TIER_ORDER = ["strong", "moderate", "emerging", "exploratory"] as const;
const TIER_LABELS: Record<string, string> = {
  strong: "Strong · ≥8.0",
  moderate: "Moderate · 6.0–7.9",
  emerging: "Emerging · 3.5–5.9",
  exploratory: "Exploratory · <3.5",
};

export default async function CandidatesPage() {
  const [scope, candidates] = await Promise.all([getCorpusScope(), getCandidates()]);
  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: candidates.filter((c) => c.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <main>

      {/* Header */}
      <section className="surface-ink" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Candidates</span>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>
            v0 corpus · {scope.signals} candidates across {scope.conditions} conditions
          </div>
          <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(40px,5vw,76px)", maxWidth: "18ch" }}>
            Repurposing candidates, with the trail.
          </h1>
          <p className="lede" style={{ marginTop: 26, color: "var(--on-ink-2)" }}>
            Every candidate surfaces a drug already approved for one indication with evidence it
            works for a women&apos;s health condition, scored across five dimensions, tiered, and
            traceable to its sources. The full index is open below, grouped by confidence tier.
            Open any card for its complete evidence trail.
          </p>
        </div>
      </section>

      {/* Full index, grouped by confidence tier */}
      {grouped.map(({ tier, items }) => (
        <section key={tier} className="surface-bone section tight">
          <div className="container">
            <div style={{ marginBottom: 24 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>{TIER_LABELS[tier]}</div>
              <h2 className="h3">{tier.charAt(0).toUpperCase() + tier.slice(1)} evidence · {items.length}</h2>
            </div>
            <div className="col" style={{ gap: 16 }}>
              {items.map((c) => (
                <CandidateCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Continue */}
      <section className="surface-bone" style={{ paddingBottom: 72, paddingTop: 8 }}>
        <div className="container">
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/signal-types" className="btn btn-primary">
              How signals are scored <span className="arr">&rarr;</span>
            </Link>
            <Link href="/about/technical-architecture" className="btn btn-ghost">Technical architecture</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
