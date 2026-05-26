import Link from "next/link";

export const metadata = {
  title: "Validation methodology | Whel",
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

const CARD: React.CSSProperties = {
  backgroundColor: "var(--paper)",
  border: "1px solid var(--rule)",
  padding: "20px 22px",
};

const VALIDATION_LEVELS = [
  {
    level: "L0",
    label: "No external evidence",
    desc: "No peer-reviewed study, no registered trial, and no guideline mention of the compound-condition pair could be located.",
  },
  {
    level: "L1",
    label: "Mentioned in published literature",
    desc: "At least one peer-reviewed primary study, case series, or narrative review investigates the pair, regardless of effect direction.",
  },
  {
    level: "L2",
    label: "Trial or systematic review evidence",
    desc: "At least one randomized controlled trial or systematic review of the pair exists, with a clearly reported outcome.",
  },
  {
    level: "L3",
    label: "Included in a major clinical guideline",
    desc: "The compound is named as a treatment option for the condition in a guideline from ESHRE, ASRM, NICE, Cochrane, ACOG, or an equivalent body. Strength of recommendation and certainty of evidence are recorded.",
  },
];

const EXTERNAL_SOURCES = [
  { label: "PubMed (NCBI)", href: "https://pubmed.ncbi.nlm.nih.gov/" },
  { label: "ClinicalTrials.gov", href: "https://clinicaltrials.gov/" },
  { label: "Cochrane Library", href: "https://www.cochranelibrary.com/" },
  { label: "ESHRE guidelines", href: "https://www.eshre.eu/Guidelines-and-Legal/Guidelines" },
  { label: "ASRM practice committee documents", href: "https://www.asrm.org/practice-guidance/practice-committee-documents/" },
  { label: "NICE guidance", href: "https://www.nice.org.uk/guidance" },
  { label: "ACOG practice bulletins", href: "https://www.acog.org/clinical/clinical-guidance/practice-bulletin" },
];

const SAMPLE_NUMBERS = [
  { label: "Active Strong-tier signals", value: "28" },
  { label: "Conditions represented", value: "6" },
  { label: "Distinct compounds", value: "23" },
  { label: "Unique attached sources", value: "252" },
];

export default function MethodologyPage() {
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
            <span style={{ color: "var(--ink)" }}>Validation methodology</span>
          </nav>

          <div style={{ ...EYEBROW, marginBottom: 16 }}>
            Pre-registration · v1
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
              maxWidth: "30ch",
            }}
          >
            How Whel will validate its signals.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "62ch" }}>
            This page records the validation benchmark for Whel&apos;s
            confidence tiers before it is run. The sample, the external sources
            of truth, the adjudication rules, and the falsifying outcome are
            fixed here so the result can be read as a calibration check rather
            than a retrospective rationalization. The benchmark itself will be
            executed after publication of this page and the result reported
            against the criteria below, whatever it shows.
          </p>

          {/* Snapshot strip */}
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
            {SAMPLE_NUMBERS.map(({ label, value }) => (
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
                    fontSize: "1.1rem",
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

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>

          {/* 01 — What this page is */}
          <section>
            <div style={EYEBROW}>01 · Purpose</div>
            <h2 className="font-heading" style={H2}>Why pre-register</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel scores each signal against the five-dimension rubric
                published on the{" "}
                <Link href="/about/technical-architecture" style={LINK}>
                  technical architecture page
                </Link>
                . The scoring is generated by Claude Opus 4.6 against
                source content captured at indexing time, then stored alongside
                the signal. The question this page addresses is one step
                downstream of the rubric: when Whel reports a signal as
                Strong, how often does that classification line up with the
                external clinical record.
              </p>
              <p style={BODY}>
                The credibility of any answer to that question depends on
                fixing the test before running it. The sample, the external
                comparators, the adjudication rules, and the reporting format
                are all locked here. The result will be reported against this
                page, with the version tag at the top, even if the result
                undercuts Whel&apos;s own framing.
              </p>
            </div>
          </section>

          {/* 02 — Sample */}
          <section>
            <div style={EYEBROW}>02 · Sample</div>
            <h2 className="font-heading" style={H2}>What gets evaluated</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The primary sample is every active Strong-tier
                compound-condition signal in the Whel database at the snapshot
                date below. As of the current snapshot, that is 28 signals
                spanning 6 conditions and 23 distinct compounds. The full list
                will be frozen and archived at the time of execution.
              </p>
              <p style={BODY}>
                A matched comparator sample of equivalent size will be drawn
                from the Emerging tier and from the Exploratory tier, using
                stratified random sampling on signal type so that the
                comparator mix mirrors the Strong sample. The comparators are
                included specifically so the result can be read as
                calibration: a Strong tier that validates externally at a much
                higher rate than the lower tiers is the outcome the rubric is
                designed to produce.
              </p>

              <div style={CARD}>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 10,
                  }}
                >
                  Snapshot
                </div>
                <p style={{ fontSize: "0.92rem", color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
                  Whel database snapshot of May 2026. Of the 28 Strong-tier
                  signals, none were structurally flagged on the pre-run audit
                  (no missing scores, no tier-score mismatches, no missing
                  sources or text fields, no duplicate URLs within a signal,
                  no zero scores). A separate spot-check of a stratified
                  random sample of 23 source URLs returned 200 OK on every
                  request.
                </p>
              </div>
            </div>
          </section>

          {/* 03 — External sources of truth */}
          <section>
            <div style={EYEBROW}>03 · External comparators</div>
            <h2 className="font-heading" style={H2}>Where the external evidence comes from</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Each signal in the sample is checked against the following
                external bodies of evidence. Searches use the compound name
                (generic and brand where relevant) together with the
                condition name and standard synonyms, with no date restriction
                and no language restriction.
              </p>
              <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {EXTERNAL_SOURCES.map((s) => (
                  <li key={s.label} style={{ ...BODY, listStyle: "disc" }}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" style={LINK}>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p style={BODY}>
                Sources already indexed in the Whel database for that signal
                are excluded from the external search so the comparison
                remains genuinely external. For example, if a PubMed PMID is
                already attached to the signal as evidence, that PMID does not
                count toward external validation, but other PubMed records on
                the same pair do.
              </p>
            </div>
          </section>

          {/* 04 — Hit criteria */}
          <section>
            <div style={EYEBROW}>04 · Levels of external validation</div>
            <h2 className="font-heading" style={H2}>What counts as a hit</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Each signal is assigned a single level on the scale below,
                taking the highest applicable level. The level reflects what
                exists in the external record, not whether the external
                evidence is positive or negative; a signal that surfaces in a
                guideline as a discouraged option still scores L3, and the
                direction is recorded separately.
              </p>

              <div style={CARD}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {VALIDATION_LEVELS.map((lvl) => (
                    <div
                      key={lvl.level}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 56px) 1fr",
                        gap: 14,
                        alignItems: "baseline",
                      }}
                    >
                      <div
                        style={{
                          ...MONO,
                          fontSize: "0.95rem",
                          color: "var(--green-deep)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lvl.level}
                      </div>
                      <div>
                        <div
                          className="font-heading"
                          style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}
                        >
                          {lvl.label}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "var(--ink-2)", lineHeight: 1.55 }}>
                          {lvl.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p style={BODY}>
                Effect direction in the external record is captured as a
                secondary field: supports the indexed direction, contradicts
                it, mixed, or unclear. This is reported alongside the level
                but is not used to determine the level itself.
              </p>
            </div>
          </section>

          {/* 05 — Adjudication */}
          <section>
            <div style={EYEBROW}>05 · Adjudication</div>
            <h2 className="font-heading" style={H2}>How signals are scored</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Each signal is reviewed in randomized order so that no rater
                ever scores a contiguous tier block. Tier assignment is
                masked: the rater sees the compound, the condition, and the
                signal type, but not Whel&apos;s scoring or tier. External
                level (L0-L3) and direction are recorded before the masked
                fields are revealed.
              </p>
              <p style={BODY}>
                The primary adjudicator is the project lead, who is also the
                author of the indexed rubric. This conflict is acknowledged
                and partially mitigated by the masking above. A subset of at
                least 20 percent of the sample will be independently scored by
                a second reviewer, with disagreements resolved by discussion
                and the inter-rater agreement reported as Cohen&apos;s kappa.
                Both reviewers must be blind to the tier assignment at the
                time of scoring.
              </p>
            </div>
          </section>

          {/* 06 — Analysis */}
          <section>
            <div style={EYEBROW}>06 · Analysis plan</div>
            <h2 className="font-heading" style={H2}>What gets reported</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                For each tier in the sample (Strong, Emerging, Exploratory),
                the report will give the distribution across L0-L3, the share
                that reaches at least L1 and at least L2, and the share with
                direction consistent with the indexed effect. Results are
                reported with exact confidence intervals.
              </p>
              <p style={BODY}>
                The primary calibration question is whether the Strong tier
                reaches at least L1 in a clearly higher share of cases than
                the Emerging tier, and at least L2 in a clearly higher share
                than the Exploratory tier. The result will be reported as
                supported, partially supported, or not supported against
                pre-specified thresholds, set below.
              </p>

              <div style={CARD}>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 10,
                  }}
                >
                  Pre-specified thresholds
                </div>
                <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, margin: 0 }}>
                  <li style={{ ...BODY, listStyle: "disc" }}>
                    Supported: at least 85 percent of Strong signals reach L1
                    or higher, and at least 50 percent reach L2 or higher.
                  </li>
                  <li style={{ ...BODY, listStyle: "disc" }}>
                    Partially supported: at least 70 percent reach L1 and at
                    least 30 percent reach L2.
                  </li>
                  <li style={{ ...BODY, listStyle: "disc" }}>
                    Not supported: below the partially-supported thresholds,
                    or the Strong tier does not exceed the Emerging tier on
                    either metric.
                  </li>
                </ul>
              </div>

              <p style={BODY}>
                Directional consistency is reported separately and is not
                used to adjudicate the headline result. A signal where the
                external record is clearly opposite to the indexed direction
                is flagged for review.
              </p>
            </div>
          </section>

          {/* 07 — Limitations */}
          <section>
            <div style={EYEBROW}>07 · Limitations</div>
            <h2 className="font-heading" style={H2}>What this benchmark does not show</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                A successful result here would show that Whel&apos;s Strong
                tier concentrates on compound-condition pairs that the
                external clinical record also takes seriously. It would not
                show that those pairs work in patients, only that the
                indexed evidence agrees with the external evidence on which
                pairs are worth studying. Clinical efficacy is a separate
                question that requires trials, not aggregation.
              </p>
              <p style={BODY}>
                The sample is small (n = 28 Strong, with matched comparators).
                The external sources of truth themselves are imperfect:
                guidelines lag the literature, the literature lags the
                biology, and some conditions in scope (notably PMDD and
                vulvodynia) have thinner guideline coverage than others. These
                conditions will tend toward L1 or L2 even where the indexed
                signal is well supported by trials, and that asymmetry is
                expected.
              </p>
              <p style={BODY}>
                The classifier scoring the indexed signals is the same
                language model family in both the indexing and any LLM-
                assisted external search. Where external search is used to
                surface candidate papers, the final level assignment is made
                by a human against the located papers, not by the model.
              </p>
            </div>
          </section>

          {/* 08 — Reporting */}
          <section>
            <div style={EYEBROW}>08 · Reporting</div>
            <h2 className="font-heading" style={H2}>Where the result will land</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Results will be posted as a new section on this page and
                linked from the home page and the technical architecture
                page. The version tag at the top of this page is incremented
                only if the methodology itself changes; the underlying data
                snapshot is recorded with the result. Raw scoring sheets,
                including disagreements, will be made available on request and
                archived alongside the writeup.
              </p>
              <p style={BODY}>
                Negative or partial-support results will be reported with the
                same prominence as positive ones. If the Strong tier does not
                materially separate from Emerging on the pre-specified
                thresholds, the rubric is revised before the next benchmark
                rather than the benchmark being revised before the next
                rubric.
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
                Related
              </div>
              <p style={{ fontSize: "0.95rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                The full five-dimension rubric and the indexing pipeline that
                produces these tiers are documented separately.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px" }}>
              <Link
                href="/about/technical-architecture"
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
                Read the rubric →
              </Link>
              <Link
                href="/featured"
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
                See the featured signal
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
            Methodology version 1, published May 2026. Sample numbers reflect
            the Whel database snapshot at time of publication. Updates to this
            page will be versioned and dated.
          </p>

        </div>
      </div>
    </main>
  );
}
