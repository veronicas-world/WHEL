import type { Metadata } from "next";
import Link from "next/link";
import CandidateCard from "@/app/components/CandidateCard";
import { getCandidates, getCorpusScope } from "@/lib/substrate-candidates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Invite-only preview: not advertised and not indexed. This is the gated product
// surface during the research preview; real auth (Supabase Auth) replaces the soft
// gate in Step 2.
export const metadata: Metadata = {
  title: "Full candidate index, preview",
  robots: { index: false, follow: false },
};

const TIER_ORDER = ["strong", "moderate", "emerging", "exploratory"] as const;
const TIER_LABELS: Record<string, string> = {
  strong: "Strong · 9–10",
  moderate: "Moderate · 7–8",
  emerging: "Emerging · 4–6",
  exploratory: "Exploratory · 0–3",
};

export default async function FullIndexPreview() {
  const [candidates, scope] = await Promise.all([getCandidates(), getCorpusScope()]);
  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: candidates.filter((c) => c.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <main>
      <section className="surface-ink" style={{ paddingTop: 40, paddingBottom: 56 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Full index (preview)</span>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 16, color: "var(--signal)" }}>
            Invite-only preview · not public
          </div>
          <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(36px,4.5vw,68px)", maxWidth: "20ch" }}>
            The full candidate index.
          </h1>
          <p className="lede" style={{ marginTop: 24, color: "var(--on-ink-2)", maxWidth: "60ch" }}>
            All {candidates.length} candidates across {scope.conditions} conditions, every one with its evidence
            trail. This is the research-preview build of the gated product; please don&rsquo;t share the link.
          </p>
        </div>
      </section>

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
    </main>
  );
}
