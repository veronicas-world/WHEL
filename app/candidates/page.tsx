import type { Metadata } from "next";
import Link from "next/link";
import CandidateCard from "@/app/components/CandidateCard";
import ConditionAccordion, { type ConditionPanel } from "./ConditionAccordion";
import { getCandidates, getCorpusScope } from "@/lib/substrate-candidates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Candidates",
  description: "Whel's full drug-repurposing candidate index, scored across five dimensions, tiered by confidence, and traceable to every source.",
};

const TIER_ORDER = ["strong", "moderate", "emerging", "exploratory"] as const;
type Tier = (typeof TIER_ORDER)[number];

const TIER_LABELS: Record<Tier, string> = {
  strong: "Strong",
  moderate: "Moderate",
  emerging: "Emerging",
  exploratory: "Exploratory",
};
const TIER_CUTS: Record<Tier, string> = {
  strong: "≥8.0",
  moderate: "6.0–7.9",
  emerging: "3.5–5.9",
  exploratory: "<3.5",
};

function slugFor(c: { conditionId?: string; condition: string }): string {
  return c.conditionId ?? c.condition.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function CandidatesPage() {
  const [scope, candidates] = await Promise.all([getCorpusScope(), getCandidates()]);

  // Group by condition. getCandidates() is sorted strongest-first, so each
  // condition's bucket preserves that order.
  const order: string[] = [];
  const byCondition = new Map<
    string,
    { slug: string; label: string; items: typeof candidates; counts: Record<Tier, number> }
  >();

  for (const c of candidates) {
    const slug = slugFor(c);
    let g = byCondition.get(slug);
    if (!g) {
      g = { slug, label: c.condition, items: [], counts: { strong: 0, moderate: 0, emerging: 0, exploratory: 0 } };
      byCondition.set(slug, g);
      order.push(slug);
    }
    g.items.push(c);
    g.counts[c.tier] += 1;
  }

  // Order conditions by total count, descending.
  const conditions = order
    .map((slug) => byCondition.get(slug)!)
    .sort((a, b) => b.items.length - a.items.length);

  const totalByTier: Record<Tier, number> = { strong: 0, moderate: 0, emerging: 0, exploratory: 0 };
  for (const cond of conditions) {
    for (const t of TIER_ORDER) totalByTier[t] += cond.counts[t];
  }

  const panels: ConditionPanel[] = conditions.map((cond) => ({
    slug: cond.slug,
    label: cond.label,
    count: cond.items.length,
    tierSummary: TIER_ORDER.filter((t) => cond.counts[t])
      .map((t) => `${cond.counts[t]} ${TIER_LABELS[t].toLowerCase()}`)
      .join(" · "),
    cards: cond.items.map((c) => <CandidateCard key={c.id} c={c} />),
  }));

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
            traceable to its sources. The full index is open below, grouped by condition and
            ordered strongest-first. Open any card for its complete evidence trail.
          </p>
        </div>
      </section>

      {/* Condition × tier summary */}
      <section className="surface-paper section tight">
        <div className="container" style={{ maxWidth: 940 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>The board at a glance</div>
          <h2 className="h3" style={{ marginBottom: 16 }}>
            Candidates by condition and confidence tier
          </h2>
          <div style={{ overflowX: "auto", border: "1px solid var(--line)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: 640 }}>
              <thead>
                <tr style={{ background: "var(--bone-2)", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontFamily: "var(--font-plex-mono, monospace)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                    Condition
                  </th>
                  {TIER_ORDER.map((t) => (
                    <th key={t} style={{ textAlign: "right", padding: "10px 14px", fontFamily: "var(--font-plex-mono, monospace)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {TIER_LABELS[t]}
                      <span style={{ display: "block", fontSize: 9, opacity: 0.7, letterSpacing: 0, textTransform: "none" }}>{TIER_CUTS[t]}</span>
                    </th>
                  ))}
                  <th style={{ textAlign: "right", padding: "10px 14px", fontFamily: "var(--font-plex-mono, monospace)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {conditions.map((cond) => (
                  <tr key={cond.slug} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "11px 14px", fontWeight: 600 }}>
                      <a href={`#${cond.slug}`} style={{ color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                        {cond.label}
                      </a>
                    </td>
                    {TIER_ORDER.map((t) => (
                      <td key={t} style={{ padding: "11px 14px", textAlign: "right", fontFamily: "var(--font-plex-mono, monospace)", color: cond.counts[t] ? "var(--ink)" : "var(--muted)" }}>
                        {cond.counts[t] || "·"}
                      </td>
                    ))}
                    <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "var(--font-plex-mono, monospace)", fontWeight: 700, color: "var(--ink)" }}>
                      {cond.items.length}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: "var(--bone-2)" }}>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: "var(--ink)" }}>All conditions</td>
                  {TIER_ORDER.map((t) => (
                    <td key={t} style={{ padding: "11px 14px", textAlign: "right", fontFamily: "var(--font-plex-mono, monospace)", fontWeight: 700, color: "var(--ink)" }}>
                      {totalByTier[t]}
                    </td>
                  ))}
                  <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "var(--font-plex-mono, monospace)", fontWeight: 700, color: "var(--ink)" }}>
                    {candidates.length}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Full index, grouped by condition (each condition opens on click) */}
      <section className="surface-bone section tight">
        <div className="container">
          <div style={{ marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>The full index</div>
            <h2 className="h3">Open a condition to read its candidates</h2>
          </div>
          <ConditionAccordion items={panels} />
        </div>
      </section>

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
