import type { Metadata } from "next";
import Link from "next/link";
import KnowledgeGraph from "@/app/components/KnowledgeGraph";
import CyclicalPK from "@/app/components/CyclicalPK";
import CandidateCard from "@/app/components/CandidateCard";
import { getFeaturedCandidates } from "@/lib/candidates";

export const metadata: Metadata = {
  title: "Platform",
  description: "The corrected knowledge graph for female biology, capturing sex-specific pharmacokinetics, cyclical hormonal state, and the cross-condition mechanistic relationships general platforms miss.",
};

/* Layer descriptions — narrative copy from the design / Blueprint */
const LAYERS = [
  {
    n: "Layer 01", name: "The substrate",
    tags: ["Postgres-native", "Ontology-grounded", "PrimeKG · CTKG seed"],
    desc: "A corrected knowledge graph that captures sex-specific pharmacokinetics, cyclical hormonal state, and the cross-condition mechanistic relationships general platforms miss because they were trained on male-default data. Grounded in MONDO, HPO, RxNorm, and ChEMBL, then enriched with female-specific ontology extensions no existing ontology adequately covers.",
  },
  {
    n: "Layer 02", name: "Retrieval & validation",
    tags: ["Per-claim provenance", "Marked synthesis", "Contradiction surfacing"],
    desc: "Provenance-preserving extraction tuned for biomedical literature. Every claim ties to a verbatim source span, every synthesis is marked as a synthesis, and every contradiction in the underlying literature is surfaced explicitly rather than averaged.",
  },
  {
    n: "Layer 03", name: "Hypothesis from signal",
    tags: ["Off-label patterns", "Advocacy registries", "Validated downstream"],
    desc: "Patient-community signal, including off-label prescribing patterns, advocacy-organization registries, and structured reports, enters as hypothesis generation and is validated downstream against mechanistic and clinical evidence, and it is never equated with the results of a controlled trial.",
  },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlatformPage() {
  const [candidate] = await getFeaturedCandidates(1);
  return (
    <main>

      {/* Hero */}
      <section className="surface-ink" style={{ paddingTop: 40, paddingBottom: 72 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Platform</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "center" }} className="hero-grid">
            <div>
              <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>The platform</div>
              <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(40px,5vw,72px)" }}>
                The corrected knowledge graph for{" "}
                <em style={{ fontStyle: "italic", color: "var(--signal)" }}>female biology.</em>
              </h1>
              <p className="lede" style={{ marginTop: 26, color: "var(--on-ink-2)" }}>
                A substrate that captures sex-specific pharmacokinetics, cyclical hormonal state,
                and the cross-condition mechanisms general platforms miss because they were
                trained on male-default data.
              </p>
            </div>
            <div><KnowledgeGraph height={420} /></div>
          </div>
        </div>
      </section>

      {/* Layers */}
      <section className="surface-ink section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="layers">
            {LAYERS.map((l) => (
              <div className="layer" key={l.n}>
                <div>
                  <div className="lnum">{l.n}</div>
                  <div className="lname">{l.name}</div>
                </div>
                <div>
                  <p className="ldesc">{l.desc}</p>
                  <div className="ltags">
                    {l.tags.map((t) => <span key={t} className="pill on-ink">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cyclical PK */}
      <section className="surface-ink section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="between" style={{ marginBottom: 32 }}>
            <div>
              <div className="eyebrow on-ink" style={{ marginBottom: 14 }}>Layer 01 · in practice</div>
              <h2 className="h2" style={{ color: "var(--on-ink)", maxWidth: "16ch" }}>
                Cyclical biology, modeled as it moves.
              </h2>
            </div>
            <p className="lede" style={{ color: "var(--on-ink-2)", maxWidth: "36ch" }}>
              Drug response shifts across the menstrual cycle, so we model hormonal state as
              structured pharmacokinetic data, which means a luteal-phase signal is read in its
              phase instead of being averaged into a flat number.
            </p>
          </div>
          <CyclicalPK height={300} />
        </div>
      </section>

      {/* Per-claim provenance */}
      <section className="surface-bone section">
        <div className="container">
          <div className="between" style={{ marginBottom: 32 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Layer 02 · in practice</div>
              <h2 className="h2" style={{ maxWidth: "18ch" }}>
                Per-claim provenance, with contradictions surfaced.
              </h2>
            </div>
            <p className="lede" style={{ color: "var(--body)", maxWidth: "34ch" }}>
              Every claim ties to a verbatim source span, every synthesis is marked as a
              synthesis, and disagreement in the literature is shown rather than averaged away,
              which is what the §3060 exemption requires and what makes the output trustworthy.
            </p>
          </div>
          {/* TODO(real-data): example candidate — wire to real Supabase signal */}
          {candidate && <CandidateCard c={candidate} defaultOpen={true} />}
        </div>
      </section>

      {/* §3060 posture */}
      <section className="surface-sage section tight">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="two-col">
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Regulatory posture</div>
              <h2 className="h2" style={{ marginBottom: 18 }}>A research-support tool, by design.</h2>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--body)", maxWidth: "54ch" }}>
                Whel sits under the 21st Century Cures Act §3060 research-support exemption
                and stays there. Because every claim is tied to a source a clinician can
                independently review, the platform meets the exemption&apos;s bar by architecture
                rather than by accident.
              </p>
            </div>
            <div>
              <div className="disclaimer" style={{ height: "100%" }}>
                WHAT WE NEVER DO<br /><br />
                · Display &ldquo;treat patient X with drug Y&rdquo; without surfaceable provenance.<br />
                · Auto-generate treatment plans without clinician review of each citation.<br />
                · Make claims about specific identified patients.<br />
                · Ship a patient mode that returns recommendations without a clinician in the loop.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="surface-ink section">
        <div className="container-tight" style={{ textAlign: "center" }}>
          <div className="eyebrow on-ink" style={{ marginBottom: 20 }}>Whel · Women&apos;s Health Evidence Lab</div>
          <h2 className="framedevice" style={{ color: "var(--on-ink)", margin: "0 auto 28px" }}>
            Finding what already works for women.
          </h2>
          <div className="row" style={{ justifyContent: "center", gap: 12 }}>
            <Link href="/candidates" className="btn btn-on-ink">
              See the candidates <span className="arr">→</span>
            </Link>
            <Link href="/about/technical-architecture" className="btn btn-ghost-ink">
              How we score evidence
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
