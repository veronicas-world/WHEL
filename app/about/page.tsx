import Link from "next/link";

export const metadata = {
  title: "About | Whel",
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

export default function AboutPage() {
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
            <span style={{ color: "var(--ink)" }}>About</span>
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
            About Whel.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "64ch" }}>
            Whel is a drug-repurposing platform for female biology. This page explains
            the gap in the women&apos;s health evidence base that Whel addresses, why drug
            repurposing is the right method for these conditions, how the platform works,
            and who it is built to serve.
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>

          {/* 01 — What Whel is */}
          <section>
            <div style={EYEBROW}>01 · The thesis</div>
            <h2 className="font-heading" style={H2}>What Whel is</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel finds the approved drugs that already work for women&apos;s health conditions and
                proves it rigorously enough for a researcher or a clinician to act on. The conditions
                we focus on, including endometriosis, PMDD, PCOS, adenomyosis, perimenopause, and
                vulvodynia, are rarely cured and are instead managed over years, which is a different
                medical problem with a different evidence base, and it is the problem the general
                drug-discovery platforms were never built to solve.
              </p>
              <p style={BODY}>
                A fuller account of why these conditions are overlooked, why their treatments already
                exist inside the existing drug supply, and why this is the moment to build, is in the{" "}
                <Link href="/manifesto" style={LINK}>manifesto</Link>.
              </p>
            </div>
          </section>

          {/* 02 — The gap */}
          <section>
            <div style={EYEBROW}>02 · The gap</div>
            <h2 className="font-heading" style={H2}>Why women&apos;s hormonal health</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Medical knowledge carries structural blind spots that begin with who was studied. The
                United States did not require the inclusion of women in federally funded clinical
                research until 1993{" "}
                <a href="https://orwh.od.nih.gov/toolkit/recruitment/history" target="_blank" rel="noopener noreferrer" style={LINK}>(NIH Revitalization Act of 1993)</a>,{" "}
                so the past three decades have been spent catching up from a standing start, and the
                conditions that affect women most severely have been underfunded for as long as anyone
                has measured.
              </p>
              <p style={BODY}>
                The consequences are concrete rather than abstract. Endometriosis affects up to ten
                percent of women of reproductive age while the average diagnostic delay remains seven
                to ten years{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/21718982/" target="_blank" rel="noopener noreferrer" style={LINK}>(Nnoaham et al., 2011)</a>,{" "}
                and there is still no pharmaceutical treatment that addresses the underlying condition
                instead of suppressing its symptoms. PMDD is clinically severe and cyclical yet is
                treated primarily with SSRIs prescribed imprecisely, adenomyosis and vulvodynia and
                PCOS remain underrepresented in the research literature, and menopause, a transition
                that every woman who lives long enough will reach, is widely acknowledged to be poorly
                managed.
              </p>
              <p style={BODY}>
                The cause is structural rather than a failure of intent, because poorly characterized
                mechanisms make a condition harder to study, which makes it less fundable, which leaves
                the mechanism poorly characterized, and the loop closes on itself. Whel exists to
                interrupt that loop by surfacing the evidence that already exists.
              </p>
            </div>
          </section>

          {/* 03 — The method */}
          <section>
            <div style={EYEBROW}>03 · The method</div>
            <h2 className="font-heading" style={H2}>Why drug repurposing</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Drug repurposing asks a different question from traditional drug discovery, because
                instead of designing a new molecule it examines the drugs already on the market, where
                the safety profile is at least partly established, and searches for unexpected benefits
                or patterns in existing data that point to a new use. A drug with a known safety record
                reaches clinical investigation faster and at lower cost, so the work becomes a matter of
                finding the signal rather than inventing the molecule.
              </p>
              <p style={BODY}>
                The signal is more often present than people assume. Somewhere in a published trial, an
                adverse-event database, or a patient forum from two years ago, a pattern was recorded
                that no one connected to a new indication, and that data sits scattered across PubMed,
                the trial registries, the adverse-event databases, and the patient communities, without
                a tool that pulls it together specifically for women&apos;s hormonal and reproductive
                health.
              </p>
              <p style={BODY}>
                The method rests on a simple principle about evidence, which is that the absence of
                direct evidence is not the same as the absence of evidence. Sparseness in the
                literature is itself information, signals from unexpected places are hypotheses rather
                than findings, and the two are different kinds of data that deserve to be presented
                differently.
              </p>
            </div>
          </section>

          {/* 04 — The tool */}
          <section>
            <div style={EYEBROW}>04 · The tool</div>
            <h2 className="font-heading" style={H2}>What Whel does</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel currently covers six conditions, endometriosis, PMDD, PCOS, adenomyosis,
                vulvodynia, and menopause, and organizes the evidence into research arms that each read
                a different kind of source. Direct research pulls published studies and active clinical
                trials that target each condition. Cross-condition signals identify drugs developed for
                other purposes where women have incidentally reported benefit, drawing on the FDA
                adverse-event database and the secondary endpoints buried in unrelated trials. Pathway
                insights surface drugs that worsen a condition, since understanding what makes something
                worse is often a legitimate route to understanding what drives it. Community reports read
                consistent treatment patterns across condition-specific forums, labeled clearly as
                community signal that is held to a different standard than clinical evidence.
              </p>
              <p style={BODY}>
                Each signal is graded for evidence strength, as Strong, Moderate, Emerging, or
                Exploratory, and every result links to its source, so that the platform makes visible
                the hypotheses that already exist in the data and have not yet been formally
                investigated, and leaves the clinical judgment to the clinician.
              </p>
              <p style={BODY}>
                Whel sits alongside other work in this field rather than in place of it. The most direct
                counterpart is{" "}
                <a href="https://www.everycure.org/" target="_blank" rel="noopener noreferrer" style={LINK}>Every Cure</a>, a nonprofit founded in 2022 by the physicians David Fajgenbaum and Grant Mitchell to search
                systematically for new uses of approved drugs, which publishes{" "}
                <a href="https://huggingface.co/datasets/everycure/matrix" target="_blank" rel="noopener noreferrer" style={LINK}>MATRIX</a>, a public dataset of machine-learned plausibility predictions across roughly sixty million
                drug-disease pairs, funded at scale by{" "}
                <a href="https://arpa-h.gov/news-and-events/arpa-h-launches-matrix-program" target="_blank" rel="noopener noreferrer" style={LINK}>ARPA-H</a>{" "}
                and the{" "}
                <a href="https://www.audaciousproject.org/grantees/every-cure" target="_blank" rel="noopener noreferrer" style={LINK}>TED Audacious Project</a>. Every Cure works across the whole of disease, where the prize is a cure, while Whel works
                inside female biology, where the work is management, so the two answer genuinely
                different questions.
              </p>
              <p style={BODY}>
                MATRIX scores how biologically plausible a drug-disease link appears across the whole of
                biomedicine, and Whel grades the strength of the evidence currently available for a
                specific drug-condition pair in a specific clinical literature, so where MATRIX has
                coverage Whel surfaces those scores as an independent plausibility layer beside its own.
                A fuller account of the external resources Whel draws on, and the ones it deliberately
                leaves out, is on the{" "}
                <Link href="/about/external-references" style={LINK}>external references</Link> page.
              </p>
            </div>
          </section>

          {/* 05 — Who it serves */}
          <section>
            <div style={EYEBROW}>05 · Who it serves</div>
            <h2 className="font-heading" style={H2}>The audiences and the limits</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel is a research-support tool built for clinician-researchers and for the pharma and
                biotech teams working in women&apos;s health, and during the current research preview the
                full index and the substrate are open by invitation through{" "}
                <Link href="/access" style={LINK}>request access</Link>. Nothing on the platform is
                medical advice, and every result is a research signal to be investigated rather than a
                recommendation to be followed.
              </p>
              <p style={BODY}>
                The premise underneath the work is a claim about the structure of knowledge, which is
                that a drug developed for one purpose can carry, embedded in its trial data and its
                prescribing record, a useful signal about an entirely different condition, and that such
                truths can sit in the data for years before anyone thinks to look for them. Whel is built
                to go looking, beginning with the conditions where the need is greatest and the looking
                has been done least.
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
              href="/manifesto"
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
              Read the manifesto →
            </Link>
            <Link
              href="/about/technical-architecture"
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
              How we score evidence →
            </Link>
            <Link
              href="/about/external-references"
              style={{
                ...MONO,
                fontSize: "12px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--green-mid)",
              }}
            >
              External references →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
