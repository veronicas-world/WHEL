import type { Metadata } from "next";
import Link from "next/link";
import { getCorpusScope } from "@/lib/candidates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Candidates",
  description: "A sample of Whel's drug-repurposing candidates, scored, tiered, and 505(b)(2)-ready. The full index is available on request.",
};

export default async function CandidatesPage() {
  const scope = await getCorpusScope();

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
            traceable to its sources. The index is open to researchers and clinicians on request
            during the research preview.
          </p>
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
