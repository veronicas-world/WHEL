import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "News",
  description:
    "Updates from Whel: launches, method notes, and writing on drug repurposing for female biology.",
};

const wrap: React.CSSProperties = { maxWidth: 760, margin: "0 auto" };
const lede: React.CSSProperties = {
  fontSize: "1.075rem",
  lineHeight: 1.72,
  color: "var(--body)",
  margin: "0 0 20px",
  maxWidth: "70ch",
};

type Entry = {
  date: string;
  kind: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

const ENTRIES: Entry[] = [
  {
    date: "June 2026",
    kind: "Launch",
    title: "The thesis, in full",
    body:
      "We published the manifesto, which sets out why modern medicine was built on the male body, why the drugs that help many women's health conditions already exist, and why drug repurposing for female biology is a market that almost no one is building for.",
    href: "/manifesto",
    cta: "Read the manifesto",
  },
  {
    date: "June 2026",
    kind: "Platform",
    title: "How the platform is built",
    body:
      "We wrote up the architecture in detail: the corrected, sex-aware substrate, the retrieval layer that ties every claim to a verbatim source span and surfaces contradictions rather than averaging them, and the way patient-community signal enters as hypothesis and is validated downstream.",
    href: "/platform",
    cta: "See the platform",
  },
];

export default function NewsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="surface-ink" style={{ paddingTop: 44, paddingBottom: 60 }}>
        <div className="container">
          <div style={wrap}>
            <div className="crumbs on-ink">
              <Link href="/">Home</Link>
              <span className="sep">/</span>
              <span className="here">News</span>
            </div>
            <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>News</div>
            <h1
              className="display"
              style={{
                color: "var(--on-ink)",
                fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)",
                lineHeight: 1.08,
                maxWidth: "18ch",
              }}
            >
              What we are building, as we build it.
            </h1>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="surface-bone section">
        <div className="container">
          <div style={wrap}>
            <p style={lede}>
              We publish launches, method notes, and writing here as the work develops.
              New repurposing candidates, changes to how we grade evidence, and the
              conditions we add next will all be recorded on this page, each linked to the
              work behind it.
            </p>

            <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 0 }}>
              {ENTRIES.map((e, i) => (
                <article
                  key={e.title}
                  style={{
                    borderTop: "1px solid var(--rule, rgba(26,29,20,0.14))",
                    paddingTop: 28,
                    paddingBottom: 28,
                    ...(i === ENTRIES.length - 1
                      ? { borderBottom: "1px solid var(--rule, rgba(26,29,20,0.14))" }
                      : {}),
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-plex-mono, monospace)",
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 12,
                      display: "flex",
                      gap: 14,
                    }}
                  >
                    <span>{e.date}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{e.kind}</span>
                  </div>
                  <h2
                    className="font-heading"
                    style={{
                      fontSize: "clamp(1.35rem, 2.4vw, 1.7rem)",
                      color: "var(--ink)",
                      letterSpacing: "-0.01em",
                      margin: "0 0 12px",
                    }}
                  >
                    {e.title}
                  </h2>
                  <p style={{ ...lede, margin: "0 0 16px" }}>{e.body}</p>
                  <Link
                    href={e.href}
                    style={{
                      fontFamily: "var(--font-plex-mono, monospace)",
                      fontSize: 12,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--moss)",
                      textDecoration: "none",
                      borderBottom: "1px solid var(--moss)",
                      paddingBottom: 2,
                    }}
                  >
                    {e.cta} &rarr;
                  </Link>
                </article>
              ))}
            </div>

            <p style={{ ...lede, marginTop: 40 }}>
              For collaboration, corrections, or press, the{" "}
              <Link href="/about/contact" style={{ color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 }}>
                contact page
              </Link>{" "}
              has the best ways to reach us.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
