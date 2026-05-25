import Link from "next/link";

export const metadata = {
  title: "Contact | Whel",
};

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};

const EYEBROW: React.CSSProperties = {
  ...MONO,
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 12,
};

const H2: React.CSSProperties = {
  fontSize: "clamp(1.35rem, 2.4vw, 1.75rem)",
  fontWeight: 500,
  lineHeight: 1.15,
  letterSpacing: "-0.01em",
  color: "var(--ink)",
  marginBottom: 16,
};

const BODY: React.CSSProperties = {
  fontSize: "0.975rem",
  lineHeight: 1.72,
  color: "var(--ink-2)",
};

const LINK: React.CSSProperties = {
  color: "var(--green-mid)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

export default function ContactPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "var(--bg)" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <nav
            style={{
              ...MONO,
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 20,
            }}
          >
            <Link href="/" style={{ color: "var(--muted)" }}>Home</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <Link href="/about" style={{ color: "var(--muted)" }}>About</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <span style={{ color: "var(--ink)" }}>Contact</span>
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
            Get in touch.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "52ch" }}>
            Whel is a small project and an open one. Questions, corrections, and
            collaboration are all welcome.
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>

          {/* 01 — Reach us */}
          <section>
            <div style={EYEBROW}>01 · Reach us</div>
            <h2 className="font-heading" style={H2}>Email &amp; updates</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                For questions, research collaborations, corrections, or feedback, the
                best way to reach us is by email at{" "}
                <a href="mailto:vla2117@columbia.edu" style={LINK}>vla2117@columbia.edu</a>.
                We read everything, though replies can take a little time.
              </p>
              <p style={BODY}>
                A detailed account of how Whel was conceived and built is available in the{" "}
                <a
                  href="https://veronicaagudelo.substack.com/p/my-first-project-womens-health-evidence"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={LINK}
                >
                  project write-up on Substack
                </a>
                , which is also where occasional updates about new conditions and
                pipeline changes are posted.
              </p>
            </div>
          </section>

          {/* 02 — Who we are */}
          <section>
            <div style={EYEBROW}>02 · Who we are</div>
            <h2 className="font-heading" style={H2}>The people behind Whel</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel was built by two people. Veronica Agudelo is a philosophy student
                who came to this work through a personal experience with a hormonal
                condition, a brain surgery, and a long stretch of late-night PubMed
                reading. The project&apos;s clinical grounding comes from her mother, a
                practicing psychiatrist who has spent much of her career thinking about
                women&apos;s hormonal conditions and who brought what she calls a
                &ldquo;two-arm data strategy&rdquo; to how the evidence here is organized.
              </p>
              <p style={BODY}>
                Neither of us is selling anything. Whel is free, open, and not a
                monetization project. The fuller story is on the{" "}
                <Link href="/about" style={LINK}>About page</Link>.
              </p>
            </div>
          </section>

          {/* 03 — Collaborate */}
          <section>
            <div style={EYEBROW}>03 · Collaborate</div>
            <h2 className="font-heading" style={H2}>If you work in this field</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel is meant to be useful to researchers, clinicians, and patients, and
                it improves fastest with input from people who know these conditions
                well. If you spot an error, a missing study, or a signal that has been
                miscategorized, please tell us; accuracy matters more to this project
                than completeness.
              </p>
              <p style={BODY}>
                We are also actively interested in hearing which gaps matter most: which
                conditions to add next, which pipelines to strengthen, and where the
                evidence framing could be clearer. If you are a researcher or clinician
                open to a conversation, an email is welcome.
              </p>
            </div>
          </section>

          {/* 04 — Citation */}
          <section>
            <div style={EYEBROW}>04 · Citation</div>
            <h2 className="font-heading" style={H2}>How to cite Whel</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel is an index of signals, not a primary source. For any clinical
                claim, follow the link through to the underlying study, trial registry,
                or database and cite that source directly. If you want to reference Whel
                itself, for example to point to a specific signal or to the way the
                evidence is aggregated, a suggested format is:
              </p>
              <div
                style={{
                  backgroundColor: "var(--paper)",
                  border: "1px solid var(--rule)",
                  padding: "18px 20px",
                }}
              >
                <p style={{ ...MONO, fontSize: "0.82rem", lineHeight: 1.7, color: "var(--ink-2)" }}>
                  Women&apos;s Health Evidence Lab (Whel). (2026). [Condition], [Signal
                  type]. Retrieved [date] from [page URL].
                </p>
              </div>
              <p style={BODY}>
                Because the index is updated as new evidence appears, please include the
                date accessed. When citing a specific signal, name the condition and the
                signal so the reference can be located even after the page changes.
              </p>
            </div>
          </section>

          {/* Continue */}
          <div
            style={{
              borderTop: "1px solid var(--rule)",
              paddingTop: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 32px",
            }}
          >
            <Link
              href="/about"
              style={{
                ...MONO,
                fontSize: "12px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink)",
                borderBottom: "1px solid var(--ink)",
                paddingBottom: 2,
              }}
            >
              ← About Whel
            </Link>
            <Link
              href="/conditions"
              style={{
                ...MONO,
                fontSize: "12px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--green-mid)",
              }}
            >
              Browse conditions →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
