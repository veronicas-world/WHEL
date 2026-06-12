import type { Metadata } from "next";
import Link from "next/link";
import CandidateCard from "@/app/components/CandidateCard";
import { getSampleCandidates, getCorpusScope } from "@/lib/candidates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Candidates",
  description: "A sample of Whel's drug-repurposing candidates — scored, tiered, and 505(b)(2)-ready. The full index is available on request.",
};

export default async function CandidatesPage() {
  const [sample, scope] = await Promise.all([getSampleCandidates(), getCorpusScope()]);

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
            v0 corpus · sample · {scope.signals} candidates in the full index
          </div>
          <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(40px,5vw,76px)", maxWidth: "18ch" }}>
            Repurposing candidates, with the trail.
          </h1>
          <p className="lede" style={{ marginTop: 26, color: "var(--on-ink-2)" }}>
            Every candidate surfaces a drug already approved for one indication with
            evidence it works for a women&apos;s health condition. Each card shows the
            mechanism, the claims, and the points where the literature disagrees. Below is the
            top candidate in each condition &mdash; a sample of the full index.
          </p>
        </div>
      </section>

      {/* Sample candidates — top per condition */}
      <section className="surface-bone section tight">
        <div className="container">
          <div style={{ marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Sample · top candidate per condition</div>
            <h2 className="h3">The strongest signal in each condition</h2>
          </div>
          <div className="col" style={{ gap: 16 }}>
            {sample.map((c, i) => (
              <CandidateCard key={c.id} c={c} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Gate band */}
      <section className="surface-moss section tight">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="eyebrow on-ink" style={{ marginBottom: 14 }}>The full index</div>
          <h2 className="framedevice" style={{ color: "var(--on-ink)", margin: "0 auto 18px", maxWidth: "20ch" }}>
            {scope.signals} candidates across {scope.conditions} conditions, with complete evidence trails.
          </h2>
          <p className="lede" style={{ color: "var(--on-ink-2)", margin: "0 auto 30px", maxWidth: "54ch" }}>
            The full candidate index, the searchable substrate, and structured data export are open by
            invitation during the research preview.
          </p>
          <div className="row" style={{ justifyContent: "center", gap: 12 }}>
            <Link href="/access" className="btn btn-on-ink">
              Request access <span className="arr">→</span>
            </Link>
            <Link href="/about/technical-architecture" className="btn btn-ghost-ink">
              How signals are scored
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
