import Link from "next/link";

export const metadata = {
  title: "Team | Whel",
};

// Page-local layout CSS, shipped inline with the markup so it can never fall
// out of sync with a separately-cached stylesheet.
const TM_CSS = `
.tm-person + .tm-person { margin-top: 60px; }
.tm-rule { border-top: 1px solid var(--ink); }
.tm-grid { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 56px; align-items: start; padding-top: 30px; }
.tm-num { font-family: var(--font-newsreader, Georgia, serif); font-weight: 400; font-size: 70px; line-height: 0.9; letter-spacing: -0.02em; color: var(--green-deep); }
.tm-eyebrow { font-family: var(--font-plex-mono, ui-monospace, monospace); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted-2); margin-top: 20px; }
.tm-name { font-family: var(--font-newsreader, Georgia, serif); font-weight: 500; font-size: clamp(24px, 2.6vw, 30px); line-height: 1.1; letter-spacing: -0.015em; color: var(--ink); margin: 6px 0 0; }
.tm-bio p { font-family: var(--font-newsreader, Georgia, serif); font-size: 17px; line-height: 1.72; color: var(--body); max-width: 64ch; margin: 0 0 1.15em; }
.tm-bio p:last-child { margin-bottom: 0; }
.tm-bio a { color: var(--green-mid); text-decoration: underline; text-underline-offset: 2px; }
@media (max-width: 820px) {
  .tm-grid { grid-template-columns: 1fr; gap: 16px; }
  .tm-num { font-size: 54px; }
  .tm-eyebrow { margin-top: 8px; }
}
`;

/** The three-ring Whel mark, used as a faint background watermark. */
function RingMark({ style, opacity = 0.05 }: { style?: React.CSSProperties; opacity?: number }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={style}>
      <g fill="none" stroke="var(--on-ink)" strokeWidth={1} strokeLinecap="round" style={{ opacity }}>
        <circle cx="50" cy="33" r="21" />
        <circle cx="64.7" cy="58.5" r="21" />
        <circle cx="35.3" cy="58.5" r="21" />
      </g>
    </svg>
  );
}

export default function TeamPage() {
  return (
    <main className="flex-1">
      <style dangerouslySetInnerHTML={{ __html: TM_CSS }} />

      {/* ── Header (dark, glyph watermark) ──────────────────────────────────── */}
      <section
        className="surface-ink"
        style={{ position: "relative", overflow: "hidden", paddingTop: 34, paddingBottom: 84, borderBottom: "1px solid var(--ink-line-2)" }}
      >
        <RingMark style={{ position: "absolute", width: 540, height: 540, top: -120, right: 60, pointerEvents: "none" }} />
        <div className="container" style={{ position: "relative" }}>
          <div className="crumbs on-ink">
            <Link href="/" style={{ color: "var(--on-ink-mut)" }}>Home</Link>
            <span className="sep">/</span>
            <Link href="/about" style={{ color: "var(--on-ink-mut)" }}>About</Link>
            <span className="sep">/</span>
            <span className="here">Team</span>
          </div>
          <div className="eyebrow on-ink" style={{ color: "var(--signal)", marginBottom: 16 }}>About · Team</div>
          <h1
            className="display"
            style={{ color: "var(--on-ink)", fontSize: "clamp(2.6rem, 5.5vw, 4.2rem)", lineHeight: 1.0, letterSpacing: "-0.02em" }}
          >
            The team.
          </h1>
        </div>
      </section>

      {/* ── Founder + advisor (light, editorial numbering) ──────────────────── */}
      <section className="surface-bone" style={{ paddingTop: 64, paddingBottom: 72 }}>
        <div className="container">

          {/* 01 — Founder */}
          <div className="tm-person">
            <div className="tm-rule" />
            <div className="tm-grid">
              <div>
                <div className="tm-num">01</div>
                <div className="tm-eyebrow">Founder</div>
                <h2 className="tm-name">Veronica Agudelo</h2>
              </div>
              <div className="tm-bio">
                <p>
                  Veronica is building Whel out of Columbia University, where she is a member of the
                  Class of 2028. Her starting point was not working in healthcare, but over half a
                  decade of experience managing a personal hormonal condition that eventually required
                  brain surgery, and years of seeing how little signal there is for women trying to
                  navigate their options. Currently, she works across venture capital and finance at New
                  Enterprise Associates (NEA), Dorm Room Fund, and J.P. Morgan, which has given her a
                  front-row seat to how the movement of capital decides which ideas get funded and which
                  do not.
                </p>
                <p>
                  That lens is where Whel began, because spending time learning how capital gets
                  allocated made a pattern hard to miss: drugs that already help many women&rsquo;s
                  conditions are often inexpensive generics that no company can profit from formally
                  developing, so the system that funds drug development passes them over.
                </p>
                <p>Whel is built to find those drugs and prove what they do.</p>
              </div>
            </div>
          </div>

          {/* 02 — Medical advisor */}
          <div className="tm-person">
            <div className="tm-rule" />
            <div className="tm-grid">
              <div>
                <div className="tm-num">02</div>
                <div className="tm-eyebrow">Medical advisor</div>
                <h2 className="tm-name">Dr. Leah Ramella, DO</h2>
              </div>
              <div className="tm-bio">
                <p>
                  Whel&rsquo;s medical methodology, its evidence standards and the criteria behind which
                  conditions and drugs it covers, is shaped by its medical advisor, Dr. Leah Ramella.
                </p>
                <p>
                  She is an incoming psychiatry resident (PGY-1) at Harvard South Shore Hospital, with
                  roughly a decade of clinical research funded by the National Institute of Mental
                  Health, PCORI, and HRSA across Boston University, Tufts Medical Center, and Rutgers.
                  She holds a DO from the New England College of Osteopathic Medicine and a BA from
                  Harvard University.
                </p>
                <p>
                  Her clinical and research background anchors the conditions Whel covers, focusing Whel
                  on areas where institutional evidence has historically failed patients.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Closing band (dark, glyph watermark) ────────────────────────────── */}
      <section className="surface-ink" style={{ position: "relative", overflow: "hidden", paddingTop: 60, paddingBottom: 60 }}>
        <RingMark style={{ position: "absolute", width: 460, height: 460, bottom: -170, left: -70, pointerEvents: "none" }} />
        <div className="container" style={{ position: "relative" }}>
          <div className="eyebrow on-ink" style={{ color: "var(--signal)", marginBottom: 14 }}>More</div>
          <p
            style={{
              fontFamily: "var(--font-newsreader, Georgia, serif)",
              fontSize: "clamp(18px, 2vw, 22px)",
              lineHeight: 1.5,
              color: "var(--on-ink-2)",
              maxWidth: "52ch",
              margin: 0,
            }}
          >
            For the argument behind Whel in full, read the{" "}
            <Link href="/manifesto" style={{ color: "var(--signal)", textDecoration: "underline", textUnderlineOffset: 3 }}>manifesto</Link>.
            To reach us with questions, corrections, or collaboration, see{" "}
            <Link href="/about/contact" style={{ color: "var(--signal)", textDecoration: "underline", textUnderlineOffset: 3 }}>contact</Link>.
          </p>
        </div>
      </section>

    </main>
  );
}
