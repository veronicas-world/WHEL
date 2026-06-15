import Link from "next/link";
import LinkedInIcon from "@/app/components/LinkedInIcon";

const LINKEDIN_URL = "https://www.linkedin.com/company/whel2026/";

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
            We welcome questions, corrections, and collaboration from researchers,
            clinicians, and the people these conditions affect.
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
                We read everything.
              </p>
              <p style={BODY}>
                You can also follow the project on LinkedIn for shorter
                updates and to get in touch there.
              </p>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
                style={{
                  ...MONO,
                  display: "inline-flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  gap: 9,
                  border: "1px solid var(--rule)",
                  padding: "9px 15px",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  textDecoration: "none",
                }}
              >
                <LinkedInIcon size={15} />
                Whel on LinkedIn
              </a>
            </div>
          </section>

          {/* 02 — Who we are */}
          <section>
            <div style={EYEBROW}>02 · Who we are</div>
            <h2 className="font-heading" style={H2}>About Whel</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel is a drug-repurposing platform for female biology. We find the
                approved drugs that already work for women&apos;s health conditions and
                build the evidence trail rigorously enough for a researcher or a clinician
                to act on. The fuller account of what we are building, and why now, is on
                the <Link href="/about" style={LINK}>About page</Link> and in the{" "}
                <Link href="/manifesto" style={LINK}>manifesto</Link>.
              </p>
              <p style={BODY}>
                Accuracy matters more to us than reach. Every result on the platform links
                to its source and its date so that anyone can check it, and we treat
                corrections from people who know these conditions as some of the most
                valuable input we receive.
              </p>
            </div>
          </section>

          {/* 03 — Collaborate */}
          <section>
            <div style={EYEBROW}>03 · Collaborate</div>
            <h2 className="font-heading" style={H2}>If you work in this field</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel is meant to be useful to researchers and clinicians, and
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
              href="/platform"
              style={{
                ...MONO,
                fontSize: "12px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--green-mid)",
              }}
            >
              See the platform →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
