import Link from "next/link";

export const metadata = {
  title: "Archived featured signal: Anastrozole / Endometriosis | Whel",
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

const SCORING_DIMENSIONS = [
  {
    label: "Replication",
    score: 2,
    note: "Multiple independent reviews and trial reports converge on the same target and direction of effect.",
  },
  {
    label: "Source quality",
    score: 2,
    note: "Peer-reviewed reviews, regulatory pharmacovigilance data, and Open Targets pathway evidence.",
  },
  {
    label: "Specificity",
    score: 2,
    note: "Anastrozole's target, CYP19A1 / aromatase, is the specific enzyme driving local estrogen biosynthesis in endometriotic lesions.",
  },
  {
    label: "Plausibility",
    score: 2,
    note: "Local aromatase overexpression in lesions is well-characterized, and the autocrine ESR1\u2192GREB1 proliferative loop is mechanistically coherent.",
  },
  {
    label: "Direction",
    score: 2,
    note: "Available evidence consistently points to symptom improvement, with no signal of worsening.",
  },
];

// Sources actually attached to this signal in the Whel database.
const INDEXED_SOURCES = [
  {
    label: "Open Targets \u2014 pathway evidence",
    meta: "CHEMBL1399 \u00b7 target CYP19A1 (aromatase) \u00b7 association score 0.67",
    href: "https://platform.opentargets.org/drug/CHEMBL1399",
    note: "Records the drug-target link and the target's genetic and pathway-level association with endometriosis.",
  },
  {
    label: "FDA Adverse Event Reporting System (FAERS / AEMS)",
    meta: "10 indexed records \u00b7 15,012 condition-relevant reports out of 31,213 female-patient reports for anastrozole",
    href: "https://www.fda.gov/drugs/questions-and-answers-fdas-adverse-event-reporting-system-faers/fda-adverse-event-reporting-system-faers-public-dashboard",
    note: "Reported symptoms in women already taking anastrozole, indexed for tolerability context: fatigue (12), pain (10), depression (8), insomnia (7), abdominal pain (6), abdominal distension (2), abdominal pain upper (2), peripheral swelling (2), oedema peripheral (2).",
  },
];

const EXTERNAL_VALIDATION = [
  {
    label: "Nawathe et al., 2011",
    meta: "Systematic review \u00b7 Reproductive Biology and Endocrinology",
    href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3141646/",
    note: "Ten publications, 251 women, four randomized trials. Reviewed aromatase inhibitors for endometriosis-associated pain and concluded the inhibitors reduce pain, including a goserelin + anastrozole arm with significant improvement over goserelin alone.",
  },
  {
    label: "Drug Design, Development and Therapy, 2023",
    meta: "Systematic review of systematic reviews",
    href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10166210/",
    note: "Reviewed the existing systematic-review evidence on aromatase inhibitors in endometriosis and found a consistent reduction in pain scores across the included reviews.",
  },
  {
    label: "ESHRE Endometriosis Guideline, 2022",
    meta: "European Society of Human Reproduction and Embryology",
    href: "https://www.eshre.eu/Guidelines-and-Legal/Guidelines/Endometriosis-guideline",
    note: "Recommends aromatase inhibitors, in combination with other hormonal treatment, for women with endometriosis-associated pain that does not respond to first-line options. Strong recommendation, low-certainty evidence.",
  },
];

export default function ArchivedAnastrozoleSignalPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "var(--bg)" }}>

      {/* Archive banner */}
      <div
        style={{
          backgroundColor: "var(--bg-3)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div
          className="max-w-4xl mx-auto px-4 sm:px-6 py-3"
          style={{
            ...MONO,
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--muted)",
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "baseline",
          }}
        >
          <span style={{ color: "var(--ink-2)" }}>Archived walkthrough</span>
          <span>
            The current featured signal is at{" "}
            <Link href="/featured" style={{ color: "var(--ink)" }}>/featured</Link>.
            This page is preserved as a historical record.
          </span>
        </div>
      </div>

      {/* Page header */}
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
            <span style={{ margin: "0 10px", opacity: 0.4 }}>&rsaquo;</span>
            <Link href="/featured" style={{ color: "var(--muted)" }}>Featured signal</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>&rsaquo;</span>
            <span style={{ color: "var(--ink)" }}>Archived: Anastrozole / Endometriosis</span>
          </nav>

          <div style={{ ...EYEBROW, marginBottom: 16 }}>
            Archived featured signal
          </div>

          <h1
            className="font-heading"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: 20,
              maxWidth: "26ch",
            }}
          >
            A breast cancer drug surfaces as a top endometriosis lead.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "58ch" }}>
            Anastrozole, an aromatase inhibitor approved for hormone
            receptor-positive breast cancer, is one of the highest-scoring
            repurposing signals for endometriosis in the Whel database. Below
            is a walkthrough of how it surfaced, the eleven sources currently
            indexed against it, and the external clinical literature it lines
            up with.
          </p>

          {/* Meta strip */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--rule)",
              display: "grid",
              gap: 14,
            }}
            className="grid-cols-2 sm:grid-cols-4 grid"
          >
            {[
              { label: "Compound", value: "Anastrozole" },
              { label: "Condition", value: "Endometriosis" },
              { label: "Evidence arm", value: "Pathway Insights" },
              { label: "Tier", value: "Strong \u00b7 10 / 10" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  className="font-heading"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "var(--ink)",
                    lineHeight: 1.2,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>

          {/* 01 Origin of the signal */}
          <section>
            <div style={EYEBROW}>01 \u00b7 Origin of the signal</div>
            <h2 className="font-heading" style={H2}>How it surfaced</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Anastrozole was indexed against endometriosis through the
                Pathway Insights arm, which cross-references each drug&apos;s
                molecular targets against the genetic and molecular targets
                associated with each condition. Anastrozole&apos;s target is
                CYP19A1, the gene encoding aromatase. In endometriotic lesions,
                CYP19A1 is locally overexpressed, sustaining an autocrine
                estrogen loop that drives lesion growth independently of the
                ovaries. Open Targets gives CYP19A1 a strong association score
                with endometriosis, and the closely linked estrogen receptor
                ESR1 has the highest overall association of any target studied
                for the condition.
              </p>
              <p style={BODY}>
                The signal was then triangulated against the FDA Adverse Event
                Reporting System, which contributed tolerability context and
                reported effects in women already taking the drug. The full
                source list is in section 04 below.
              </p>
            </div>
          </section>

          {/* 02 Evidence and scoring */}
          <section>
            <div style={EYEBROW}>02 \u00b7 Evidence and scoring</div>
            <h2 className="font-heading" style={H2}>How the signal scores</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The signal aggregates evidence from eleven indexed sources,
                weighted by the five scoring dimensions Whel applies to every
                entry. Anastrozole is rated Strong, the top tier, with the
                maximum score on each dimension. Of the roughly 280 active
                signals in the database, only a small fraction reach this
                profile.
              </p>
              <p style={BODY}>
                Mechanistically, aromatase inhibition blocks local
                CYP19A1-mediated estrogen production within endometriotic
                lesions, disrupting the ESR1&nbsp;&rarr;&nbsp;GREB1
                proliferative loop that sustains lesion growth independently of
                systemic ovarian estrogen. That is the biological hypothesis
                the signal sits on, and the scoring records how well the
                available evidence supports it.
              </p>

              <div
                style={{
                  backgroundColor: "var(--paper)",
                  border: "1px solid var(--rule)",
                  padding: "20px 22px",
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    ...MONO,
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 14,
                  }}
                >
                  Score breakdown
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {SCORING_DIMENSIONS.map((dim) => (
                    <div
                      key={dim.label}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 140px) 56px 1fr",
                        gap: 14,
                        alignItems: "baseline",
                      }}
                    >
                      <div
                        className="font-heading"
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          color: "var(--ink)",
                        }}
                      >
                        {dim.label}
                      </div>
                      <div
                        style={{
                          ...MONO,
                          fontSize: "0.875rem",
                          color: "var(--green-deep)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dim.score} / 2
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--ink-2)", lineHeight: 1.55 }}>
                        {dim.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 03 Real-world validation */}
          <section>
            <div style={EYEBROW}>03 \u00b7 External validation</div>
            <h2 className="font-heading" style={H2}>How it compares to the clinical literature</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The Pathway Insights arm surfaces signals from biology, without
                conditioning on the clinical-trial literature. That means the
                literature on aromatase inhibitors in endometriosis sits
                outside the eleven sources attached to this record, and can be
                used as an external check on whether the biology-led signal
                converges with what clinicians and researchers have already
                observed.
              </p>
              <p style={BODY}>
                The published evidence is consistent with the indexed signal.
                Aromatase inhibitors have been studied in small clinical trials
                for endometriosis-associated pain and have been used off-label
                for refractory cases. Three reference points are summarized
                below.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                {EXTERNAL_VALIDATION.map((src) => (
                  <div
                    key={src.label}
                    style={{
                      borderTop: "1px solid var(--rule)",
                      paddingTop: 14,
                    }}
                  >
                    <div
                      className="font-heading"
                      style={{
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: 4,
                      }}
                    >
                      <a href={src.href} target="_blank" rel="noopener noreferrer" style={LINK}>
                        {src.label}
                      </a>
                    </div>
                    <div
                      style={{
                        ...MONO,
                        fontSize: "11px",
                        letterSpacing: "0.04em",
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}
                    >
                      {src.meta}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                      {src.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 04 Indexed sources */}
          <section>
            <div style={EYEBROW}>04 \u00b7 Indexed sources</div>
            <h2 className="font-heading" style={H2}>The eleven sources behind the signal</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                These are the sources currently attached to the anastrozole /
                endometriosis record in the Whel database. The pathway evidence
                is one Open Targets record covering the drug-target link and
                its association with the condition. The pharmacovigilance
                evidence is ten indexed adverse-event records drawn from FAERS,
                each capturing a reported symptom and its count in women
                already taking the drug.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                {INDEXED_SOURCES.map((src) => (
                  <div
                    key={src.label}
                    style={{
                      borderTop: "1px solid var(--rule)",
                      paddingTop: 14,
                    }}
                  >
                    <div
                      className="font-heading"
                      style={{
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: 4,
                      }}
                    >
                      <a href={src.href} target="_blank" rel="noopener noreferrer" style={LINK}>
                        {src.label}
                      </a>
                    </div>
                    <div
                      style={{
                        ...MONO,
                        fontSize: "11px",
                        letterSpacing: "0.04em",
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}
                    >
                      {src.meta}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                      {src.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 05 What the tier means */}
          <section>
            <div style={EYEBROW}>05 \u00b7 Reading the tier</div>
            <h2 className="font-heading" style={H2}>What Strong means here</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                A Strong tier in Whel records that the signal is well
                replicated, sits on high-quality sources, targets a specific
                molecular mechanism, is biologically coherent, and points
                consistently in the same direction. It is a research lead, not
                a clinical recommendation. The case for further study is well
                supported by the indexed evidence and converges with the
                external literature, which is the threshold the tier is
                designed to capture.
              </p>
              <p style={BODY}>
                Whel does not adjudicate clinical decisions. It surfaces what
                the literature and underlying biology already imply, and it
                records how confident that inference is.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div
            style={{
              borderTop: "1px solid var(--rule)",
              paddingTop: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 32px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ maxWidth: "44ch" }}>
              <div
                style={{
                  ...MONO,
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                Continue
              </div>
              <p style={{ fontSize: "0.95rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                See the full set of signals indexed for endometriosis, sorted
                by tier and evidence arm, alongside their sources.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px" }}>
              <Link
                href="/conditions/endometriosis"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 18px",
                  backgroundColor: "var(--green-mid)",
                  color: "#fff",
                  ...MONO,
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
                className="transition-opacity hover:opacity-90"
              >
                Open Endometriosis &rarr;
              </Link>
              <Link
                href="/about/technical-architecture"
                style={{
                  ...MONO,
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  padding: "10px 4px",
                  borderBottom: "1px solid var(--ink)",
                  textDecoration: "none",
                }}
              >
                Read the methodology
              </Link>
            </div>
          </div>

          <p
            style={{
              ...MONO,
              fontSize: 11,
              letterSpacing: "0.04em",
              color: "var(--muted)",
              borderTop: "1px solid var(--rule)",
              paddingTop: 18,
            }}
          >
            Based on Whel database state as of May 2026. Scores and source
            counts reflect the signal as indexed at the time of writing and
            may change as new evidence is incorporated.
          </p>

        </div>
      </div>
    </main>
  );
}
