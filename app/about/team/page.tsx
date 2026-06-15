import Link from "next/link";

export const metadata = {
  title: "Team | Whel",
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

const ROLE: React.CSSProperties = {
  ...MONO,
  fontSize: "12px",
  letterSpacing: "0.06em",
  color: "var(--green-mid)",
  marginTop: 4,
};

const H2: React.CSSProperties = {
  fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
  fontWeight: 500,
  lineHeight: 1.12,
  letterSpacing: "-0.015em",
  color: "var(--ink)",
  marginBottom: 4,
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

export default function TeamPage() {
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
            <span style={{ color: "var(--ink)" }}>Team</span>
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
            The team.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "60ch" }}>
            Whel is the work of a founder and a medical advisor: one bringing the computational tools
            and an investor&rsquo;s read on why these drugs go undeveloped, the other the clinical
            judgment that holds the evidence to a real standard.
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>

          {/* 01 — Founder */}
          <section>
            <div style={EYEBROW}>01 · Founder</div>
            <h2 className="font-heading" style={H2}>Veronica Agudelo</h2>
            <div style={ROLE}>Founder</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
              <p style={BODY}>
                Veronica is building Whel from Columbia University, where she is a member of the Class
                of 2028. Her background is in finance and venture capital, with experience at New
                Enterprise Associates, Dorm Room Fund, and J.P. Morgan.
              </p>
              <p style={BODY}>
                That lens is where Whel began. Spending time around how capital gets allocated made a
                pattern hard to miss: the drugs that already help many women&rsquo;s conditions are
                mostly inexpensive generics that no company can profit from formally developing, so the
                system that funds drug development passes them over. Whel is built to find those drugs
                and prove what they do.
              </p>
              <p style={BODY}>
                The question itself was personal. It grew out of her own experience with a hormonal
                condition that eventually led to brain surgery, and years of conversations with her
                mother about how poorly women&rsquo;s hormonal health is served.
              </p>
            </div>
          </section>

          {/* 02 — Medical advisor */}
          <section>
            <div style={EYEBROW}>02 · Medical advisor</div>
            <h2 className="font-heading" style={H2}>Dr. Leah Ramella, DO</h2>
            <div style={ROLE}>Medical Advisor</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
              <p style={BODY}>
                Whel&rsquo;s medical methodology, its evidence standards and the criteria behind which
                conditions and drugs it covers, is shaped by its medical advisor, Dr. Leah Ramella.
              </p>
              <p style={BODY}>
                She is an incoming psychiatry resident (PGY-1) at Harvard South Shore Hospital, with
                roughly a decade of clinical research funded by the National Institute of Mental Health,
                PCORI, and HRSA across Boston University, Tufts Medical Center, and Rutgers. She holds a
                DO from the New England College of Osteopathic Medicine and a BA from Harvard.
              </p>
              <p style={BODY}>
                Her clinical and research background anchors the conditions Whel covers, the ones where
                institutional evidence has most often failed the patients living with them.
              </p>
            </div>
          </section>

          {/* 03 — More */}
          <section>
            <div style={EYEBROW}>03 · More</div>
            <h2 className="font-heading" style={H2}>The fuller story</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
              <p style={BODY}>
                For the argument behind Whel in full, read the{" "}
                <Link href="/manifesto" style={LINK}>manifesto</Link>. To reach us with questions,
                corrections, or collaboration, see{" "}
                <Link href="/about/contact" style={LINK}>contact</Link>.
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
