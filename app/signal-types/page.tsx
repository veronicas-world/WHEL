import type { Metadata } from "next";
import Link from "next/link";
import SignalTypesAccordion from "./SignalTypesAccordion";

export const metadata: Metadata = {
  title: "Signal types | Whel",
  description:
    "Whel reads each drug-condition pair through four research arms, each pulling a different kind of source and held to its own inclusion bar: direct research, cross-condition signals, pathway insights, and community forum reports.",
};

const INLINE_LINK: React.CSSProperties = {
  color: "var(--moss)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

export default function SignalTypesPage() {
  return (
    <main style={{ background: "var(--bone)" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="surface-ink" style={{ paddingTop: 44, paddingBottom: 60 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/about">About</Link>
            <span className="sep">/</span>
            <span className="here">Signal types</span>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>How the evidence is read</div>
          <h1
            className="display"
            style={{ color: "var(--on-ink)", fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)", lineHeight: 1.07, maxWidth: "20ch" }}
          >
            Four ways of reading the evidence.
          </h1>
          <p className="lede" style={{ color: "var(--on-ink-2)", marginTop: 24, maxWidth: "62ch" }}>
            Whel reads each drug-condition pair through four research arms, each pulling a different
            kind of source and held to its own inclusion bar. Together they supply the
            hypothesis-from-signal layer of the platform, and once a signal is validated it populates
            the substrate.
          </p>
          <div className="row" style={{ marginTop: 30, gap: 12 }}>
            <Link href="/about/technical-architecture" className="btn btn-on-ink">
              How evidence is scored <span className="arr">&rarr;</span>
            </Link>
            <Link href="/about/external-references" className="btn btn-ghost-ink">
              External references
            </Link>
          </div>
        </div>
      </section>

      {/* ── Framing + arms ────────────────────────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <div style={{ maxWidth: 760, marginBottom: 44 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>The four arms</div>
            <h2 className="h2" style={{ marginBottom: 18, maxWidth: "22ch" }}>
              One pair, four readings.
            </h2>
            <p className="lede" style={{ color: "var(--body)" }}>
              No single source is enough on its own. A published trial, an adverse-event pattern, a
              mechanistic link, and a community report each carry a different kind of information and a
              different kind of error. Whel reads all four, grades each against its own bar, and shows
              where they agree and where they conflict. The arms below are the inputs; the{" "}
              <Link href="/about/technical-architecture" style={INLINE_LINK}>scoring rubric and confidence tiers</Link>{" "}
              that weigh them are documented separately.
            </p>
          </div>

          <div style={{ maxWidth: 880 }}>
            <SignalTypesAccordion />
          </div>
        </div>
      </section>

      {/* ── Continue ──────────────────────────────────────────────────────── */}
      <section className="surface-bone" style={{ paddingBottom: 72 }}>
        <div className="container">
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/about/technical-architecture" className="btn btn-primary">
              Technical architecture <span className="arr">&rarr;</span>
            </Link>
            <Link href="/about/external-references" className="btn btn-ghost">External references</Link>
            <Link href="/access" className="btn btn-ghost">Request access</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
