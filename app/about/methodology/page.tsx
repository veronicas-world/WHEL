import Link from "next/link";
import {
  L_GRADE_META,
  L_GRADE_LEVELS,
  L_GRADE_SEARCH_PROCEDURE,
  L_GRADE_ADJUDICATION,
  totalRubricClauses,
  type LGradeLevel,
} from "@/lib/literature-grade-rubric";
import { EVIDENCE_GRADING_SNAPSHOT } from "@/lib/evidence-grading-snapshot";

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

function RubricSourceBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string | undefined]>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        className="font-heading"
        style={{
          fontSize: "0.95rem",
          fontWeight: 500,
          color: "var(--ink)",
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows
          .filter((r): r is [string, string] => typeof r[1] === "string" && r[1].length > 0)
          .map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 180px) 1fr",
                gap: 12,
                alignItems: "baseline",
              }}
            >
              <div
                style={{
                  ...MONO,
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: "0.88rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                {value}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function RubricRuleList({
  heading,
  items,
}: {
  heading: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
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
        {heading}
      </div>
      <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, margin: 0 }}>
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              fontSize: "0.9rem",
              color: "var(--ink-2)",
              lineHeight: 1.6,
              listStyle: "disc",
            }}
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RubricNamedParagraph({ heading, text }: { heading: string; text: string }) {
  return (
    <div>
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
        {heading}
      </div>
      <p style={{ fontSize: "0.92rem", color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}

// ── Live L-grade scan block ──────────────────────────────────────────────
// Renders the distribution table for the audit-script Phase 6 pass plus the
// validation-dossier distribution and the explicit L1-ceiling declaration.
// All numbers are read from lib/evidence-grading-snapshot.json so the block
// stays in sync with each audit run; no values are hard-coded here.

const L_GRADE_BAR_TOKEN: Record<LGradeLevel, string> = {
  L0: "var(--lgrade-l0)",
  L1: "var(--lgrade-l1)",
  L2: "var(--lgrade-l2)",
  L3: "var(--lgrade-l3)",
};

const L_LEVELS_ORDER: LGradeLevel[] = ["L0", "L1", "L2", "L3"];

function LGradeDistributionRow({
  level,
  count,
  total,
}: {
  level: LGradeLevel;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          ...MONO,
          fontSize: 10,
          letterSpacing: "0.1em",
          color: "var(--muted)",
          width: 28,
          flexShrink: 0,
        }}
      >
        {level}
      </span>
      <div
        style={{
          flex: 1,
          height: 14,
          background: "var(--rule)",
          position: "relative",
        }}
      >
        {pct > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pct}%`,
              background: L_GRADE_BAR_TOKEN[level],
            }}
          />
        )}
      </div>
      <span
        style={{
          ...MONO,
          fontSize: 12,
          color: "var(--ink)",
          width: 32,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function LiveLGradeScanBlock() {
  const snap = EVIDENCE_GRADING_SNAPSHOT;
  const live = snap.live_signal_grading;
  const dossier = snap.validation_dossier_grading;
  return (
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
        Pre-run scan · audit Phase 6
      </div>
      <h3
        className="font-heading"
        style={{
          fontSize: "1.05rem",
          fontWeight: 500,
          color: "var(--ink)",
          marginBottom: 8,
          letterSpacing: "-0.01em",
        }}
      >
        Where the indexed signals already sit on the rubric
      </h3>
      <p style={{ fontSize: "0.92rem", color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 18px" }}>
        Before the validation sample is scored externally, the audit script
        derives a max-supportable L grade for every active pair from the
        sources already attached to the signal record. The pre-run
        distribution is reported here unchanged. The script ceils live data
        at L1: the live <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>sources</code>{" "}
        table tags rows with a source_type (pubmed, clinical_trial, faers,
        reddit, opentargets) but does not carry the study_type,
        primary-endpoint, or guideline_id fields the rubric requires for L2
        or L3 source attribution. L2 and L3 are reachable only through the
        validation-dossier pass below, which has the structured evidence
        shape the rubric requires.
      </p>

      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "1fr",
        }}
        className="md:grid-cols-2"
      >
        <div>
          <div
            style={{
              ...MONO,
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 10,
            }}
          >
            Live signal pass · n = {live.signals_graded}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {L_LEVELS_ORDER.map((lvl) => (
              <LGradeDistributionRow
                key={lvl}
                level={lvl}
                count={live.distribution[lvl]}
                total={live.signals_graded}
              />
            ))}
          </div>
          <p
            style={{
              ...MONO,
              fontSize: "10.5px",
              letterSpacing: "0.04em",
              color: "var(--muted)",
              marginTop: 12,
              lineHeight: 1.55,
            }}
          >
            Live ceiling: {live.live_ceiling} · attribution violations:{" "}
            {live.attribution_violations_count}
          </p>
        </div>

        <div>
          <div
            style={{
              ...MONO,
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 10,
            }}
          >
            Validation dossier pass · n = {dossier.rows_graded}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {L_LEVELS_ORDER.map((lvl) => (
              <LGradeDistributionRow
                key={lvl}
                level={lvl}
                count={dossier.distribution[lvl]}
                total={dossier.rows_graded}
              />
            ))}
          </div>
          <p
            style={{
              ...MONO,
              fontSize: "10.5px",
              letterSpacing: "0.04em",
              color: "var(--muted)",
              marginTop: 12,
              lineHeight: 1.55,
            }}
          >
            Dossier rows carry structured PMID, NCT, and guideline fields,
            so the rubric&apos;s L2 and L3 source-attribution requirements can
            be checked.
          </p>
        </div>
      </div>

      <p
        style={{
          ...MONO,
          fontSize: "10.5px",
          letterSpacing: "0.04em",
          color: "var(--muted)",
          marginTop: 18,
          lineHeight: 1.55,
        }}
      >
        Derived {snap._meta.derived_at} · snapshot v{snap._meta.schema_version} ·
        rubric v{snap._meta.rubric_schema_version} · source:{" "}
        <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
          lib/evidence-grading-snapshot.json
        </code>
      </p>
    </div>
  );
}

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
            Pre-registration · v2
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
                  request. A subsequent independent external review,
                  completed May 29 2026, systematically re-applied the
                  rubric to every Moderate-and-above signal and re-checked
                  the condition-attribution of every ClinicalTrials.gov
                  citation; the findings and resolutions are recorded in
                  the methodology version log at the foot of this page.
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
                This page is the home for one of Whel&apos;s corroboration
                layers. Whel maintains and references four layers in total.
                Two are shipped today, two are recorded as planned in
                methodology v3.4. The L0&ndash;L3 grade documented in the
                rest of this section is the first shipped layer; it asks
                whether a Whel signal is independently supported by a
                published clinical guideline. The second shipped layer is the
                Every Cure MATRIX cross-reference, an independent
                treatment-probability prediction from a graph-ML model
                trained on an open biomedical knowledge graph (Fajgenbaum et
                al., Lancet Haematology 2024). Per-pair MATRIX scores are
                surfaced beside Whel&apos;s grades on individual condition
                pages as a &ldquo;MATRIX &middot; Top N%&rdquo; chip on each
                signal card, where the percentile is MATRIX&apos;s own
                quantile rank across its full set of predictions. MATRIX is
                not blended into Whel&apos;s grades; it sits beside them as
                an independent layer. Full audit numbers, per-condition
                coverage, dataset SHAs, and the score distribution for MATRIX
                are published at{" "}
                <Link
                  href="/about/external-references#coverage-disclosure"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  /about/external-references &rarr; 01b &middot; Coverage disclosure
                </Link>
                . The two planned corroboration layers are ontology-grounded
                entity resolution (Path A) and knowledge-graph grounding via
                the BioCypher framework (Path B), both detailed at{" "}
                <Link
                  href="/about/external-references#structured-grounding-in-progress"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  /about/external-references &rarr; 01c &middot; Structured grounding in progress
                </Link>
                . The rest of this section covers L0&ndash;L3.
              </p>
              <p style={BODY}>
                Each signal is assigned a single level on the scale below,
                taking the highest applicable level. The level reflects what
                exists in the external record, not whether the external
                evidence is positive or negative; a signal that surfaces in a
                guideline as a discouraged option still scores L3, and the
                direction is recorded separately.
              </p>

              <div id="l-grade-ladder" style={{ ...CARD, scrollMarginTop: 80 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {L_GRADE_LEVELS.map((lvl) => (
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
                          {lvl.summary}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p style={BODY}>
                L3 source attribution requires three fields populated on the
                source row: <code>guideline_id</code>,{" "}
                <code>guideline_strength</code>, and{" "}
                <code>guideline_certainty</code>. These values come from a
                separate human curation pass, not from the LLM scoring
                pipeline. Strength and certainty are recorded using the
                originating guideline body&apos;s own framework where available
                (GRADE for ESHRE, NAMS Levels I/II/III, ISSWSH modified
                Delphi), then normalized into a strength and certainty pair so
                grades from different bodies can be compared. Coverage is
                intentionally narrow at this stage. Whel currently surfaces
                guideline-backed L3 evidence from three society bodies (ESHRE
                2022, ISSWSH 2021, NAMS 2020) across 12 validation-dossier
                conditions, with expansion following the same curation
                workflow.
              </p>

              <p id="guideline-strength-certainty" style={{ ...BODY, scrollMarginTop: 80 }}>
                The strength and certainty values themselves draw from small
                vocabularies. The <code>guideline_strength</code> field
                records whether the body endorses the indication:{" "}
                <code>recommended</code> for an explicit endorsement and{" "}
                <code>weak</code> for a conditional endorsement (often phrased
                in the source guideline as &ldquo;consider&rdquo; or
                &ldquo;may be considered&rdquo;). A future curated row could
                also carry <code>discouraged</code> for an indication a body
                explicitly recommends against, though none of the three
                curated to date use that value. The{" "}
                <code>guideline_certainty</code> field records the quality of
                the evidence behind that strength on a four-step ladder
                adapted from GRADE: <code>high</code>, <code>moderate</code>,{" "}
                <code>low</code>, and <code>very low</code>. The two read
                together. A row recorded as <code>recommended</code> paired
                with <code>moderate</code> records that the body explicitly
                endorses the use and judges the supporting evidence to be of
                mid-grade quality. A row recorded as <code>weak</code> paired
                with <code>low</code> records a conditional endorsement made
                against limited evidence. These values surface on each
                condition page as a small dashed pill beside the L-grade chip
                on the signal card, with the full triple of strength,
                certainty, and source <code>guideline_id</code> shown in the
                chip&apos;s tooltip on hover.
              </p>

              {/* Pre-run L-grade scan: the audit-script Phase 6 pass that
                  derives a max-supportable L for every active pair from the
                  attached source records, with a live ceiling honestly
                  declared. Reads from lib/evidence-grading-snapshot.json,
                  refreshed at the end of each check-matrix-coverage.py run. */}
              <LiveLGradeScanBlock />

              <p style={BODY}>
                Effect direction in the external record is captured as a
                secondary field: supports the indexed direction, contradicts
                it, mixed, or unclear. This is reported alongside the level
                but is not used to determine the level itself.
              </p>

              <p style={BODY}>
                The full rubric below records the exact search procedure that
                produces an L assignment, the inclusion criterion at each
                level, the boundary rule at each transition, and the source-
                attribution requirement that lets any reader trace an L grade
                back to a specific PMID, NCT ID, or guideline section. It is
                schema-versioned so a revision is dated and visible.
              </p>

              <details className="disclose-block" style={{ marginTop: 4 }}>
                <summary
                  style={{
                    ...MONO,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "16px 18px",
                    border: "1px solid var(--rule)",
                    background: "var(--paper)",
                    color: "var(--ink-2)",
                  }}
                  aria-label={`Open the full literature-grade rubric, ${totalRubricClauses()} clauses across the four levels`}
                >
                  <span style={{ display: "block", minWidth: 0 }}>
                    <span
                      className="font-heading"
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "var(--ink)",
                        letterSpacing: 0,
                        textTransform: "none",
                        marginBottom: 6,
                      }}
                    >
                      Open the full rubric
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        letterSpacing: "0.13em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        lineHeight: 1.5,
                        marginBottom: 4,
                      }}
                    >
                      Rubric schema v{L_GRADE_META.schema_version} · last
                      reviewed {L_GRADE_META.last_reviewed} ·{" "}
                      {totalRubricClauses()} clauses across the four levels
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        letterSpacing: "0.13em",
                        textTransform: "uppercase",
                        color: "var(--muted-2)",
                        lineHeight: 1.5,
                      }}
                    >
                      Search procedure · inclusion criteria · boundary rules ·
                      source attribution · conflict resolution
                    </span>
                  </span>
                  <span
                    className="disclose-chev"
                    aria-hidden="true"
                    style={{
                      ...MONO,
                      fontSize: "14px",
                      color: "var(--muted)",
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    ↓
                  </span>
                </summary>

                <div
                  style={{
                    marginTop: 22,
                    display: "flex",
                    flexDirection: "column",
                    gap: 32,
                  }}
                >
                  {/* Search procedure */}
                  <div>
                    <div style={EYEBROW}>Search procedure</div>
                    <h3
                      className="font-heading"
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: 12,
                      }}
                    >
                      How the search is run
                    </h3>
                    <p style={BODY}>
                      Searches are run per-pair against each named source.
                      Compound terms are unioned from{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                        lib/brand-name-dictionary.json
                      </code>
                      , so the synonym set is reproducible against a specific
                      brand-dictionary schema version. Condition terms are the
                      canonical MeSH heading plus the named lay and clinical
                      synonyms held in the Whel condition table. The full
                      search transcript (query string, run date, dictionary
                      schema version, condition-synonym set) is stored on the
                      signal record.
                    </p>

                    <div
                      style={{
                        ...CARD,
                        marginTop: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 18,
                      }}
                    >
                      <RubricSourceBlock
                        title="PubMed (NCBI)"
                        rows={[
                          ["Query template", L_GRADE_SEARCH_PROCEDURE.PubMed.query_template],
                          ["Compound synonyms", L_GRADE_SEARCH_PROCEDURE.PubMed.compound_synonym_source],
                          ["Condition synonyms", L_GRADE_SEARCH_PROCEDURE.PubMed.condition_synonym_source],
                          ["Filters", L_GRADE_SEARCH_PROCEDURE.PubMed.filters],
                          ["Exclusions", L_GRADE_SEARCH_PROCEDURE.PubMed.exclusions],
                        ]}
                      />
                      <RubricSourceBlock
                        title="ClinicalTrials.gov"
                        rows={[
                          ["Query", L_GRADE_SEARCH_PROCEDURE["ClinicalTrials.gov"].query],
                          ["Filters", L_GRADE_SEARCH_PROCEDURE["ClinicalTrials.gov"].filters],
                          ["Notes", L_GRADE_SEARCH_PROCEDURE["ClinicalTrials.gov"].notes],
                        ]}
                      />
                      <RubricSourceBlock
                        title="Cochrane Library"
                        rows={[
                          ["Query", L_GRADE_SEARCH_PROCEDURE["Cochrane Library"].query],
                        ]}
                      />
                      <RubricSourceBlock
                        title="Named guideline bodies"
                        rows={[
                          [
                            "Bodies",
                            (L_GRADE_SEARCH_PROCEDURE["Named guideline bodies"].bodies ?? []).join(", "),
                          ],
                          [
                            "Condition-specific additions",
                            L_GRADE_SEARCH_PROCEDURE["Named guideline bodies"].condition_specific_bodies,
                          ],
                          [
                            "Procedure",
                            L_GRADE_SEARCH_PROCEDURE["Named guideline bodies"].procedure,
                          ],
                        ]}
                      />
                      <RubricSourceBlock
                        title="Deduplication"
                        rows={[["Rule", L_GRADE_SEARCH_PROCEDURE.deduplication]]}
                      />
                    </div>
                  </div>

                  {/* Per-level full rules */}
                  <div>
                    <div style={EYEBROW}>Level definitions in full</div>
                    <h3
                      className="font-heading"
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: 12,
                      }}
                    >
                      What each L level requires
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                      {L_GRADE_LEVELS.map((lvl) => (
                        <div
                          key={lvl.level}
                          style={{
                            ...CARD,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: 14,
                            }}
                          >
                            <span
                              style={{
                                ...MONO,
                                fontSize: "0.95rem",
                                color: "var(--green-deep)",
                                fontWeight: 500,
                              }}
                            >
                              {lvl.level}
                            </span>
                            <span
                              className="font-heading"
                              style={{
                                fontSize: "1rem",
                                fontWeight: 500,
                                color: "var(--ink)",
                              }}
                            >
                              {lvl.label}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "0.92rem",
                              color: "var(--ink-2)",
                              lineHeight: 1.6,
                              margin: 0,
                            }}
                          >
                            {lvl.summary}
                          </p>

                          <RubricRuleList
                            heading="Inclusion criteria"
                            items={lvl.inclusion_criteria}
                          />
                          <RubricRuleList
                            heading="Boundary rules"
                            items={lvl.boundary_rules}
                          />

                          <div>
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
                              Source attribution
                            </div>
                            <p
                              style={{
                                fontSize: "0.9rem",
                                color: "var(--ink-2)",
                                lineHeight: 1.6,
                                margin: 0,
                              }}
                            >
                              {lvl.source_attribution}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adjudication */}
                  <div>
                    <div style={EYEBROW}>Adjudication</div>
                    <h3
                      className="font-heading"
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: 12,
                      }}
                    >
                      How disagreements and edge cases are resolved
                    </h3>
                    <div
                      style={{
                        ...CARD,
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <RubricNamedParagraph
                        heading="Direction handling"
                        text={L_GRADE_ADJUDICATION.direction_handling}
                      />
                      <RubricNamedParagraph
                        heading="Conflict resolution"
                        text={L_GRADE_ADJUDICATION.conflict_resolution}
                      />
                      <RubricNamedParagraph
                        heading="Recency and re-execution"
                        text={L_GRADE_ADJUDICATION.recency_and_re_execution}
                      />
                    </div>
                  </div>

                  <p
                    style={{
                      ...MONO,
                      fontSize: "11.5px",
                      lineHeight: 1.6,
                      color: "var(--muted)",
                    }}
                  >
                    Source file:{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                      lib/literature-grade-rubric.json
                    </code>
                    . Reviewers: {L_GRADE_META.reviewers.join("; ")}. Review
                    cadence: {L_GRADE_META.review_cadence}
                  </p>
                </div>
              </details>
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
                The primary adjudicator is an external clinician-researcher
                with a decade of NIMH- and PCORI-funded research experience in
                women&apos;s health, drawn from outside the project team. The
                project lead is not the primary rater. A subset of at least 20
                percent of the sample will be independently scored by a second
                reviewer, with disagreements resolved by discussion and the
                inter-rater agreement reported as Cohen&apos;s kappa. Both
                reviewers must be blind to the tier assignment at the time of
                scoring.
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

          {/* Methodology version log, collapsed by default. Each entry is
              its own block with a small uppercase header so the changelog
              reads as a scannable list rather than a single wall of monospace
              prose. The newest entry sits on top; each subsequent entry is
              separated by a thin dashed rule. The whole log is wrapped in a
              <details> so dense changelog content stays out of the way for
              a reader scanning the page, but is one click away when needed. */}
          <details className="disclose-block" style={{ marginTop: 24 }}>
            <summary
              style={{
                ...MONO,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 18px",
                border: "1px solid var(--rule)",
                background: "var(--surface)",
                color: "var(--ink-2)",
              }}
              aria-label="Open the methodology update log"
            >
              <span style={{ display: "block", minWidth: 0 }}>
                <span
                  className="font-heading"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "var(--ink)",
                    letterSpacing: 0,
                    textTransform: "none",
                    marginBottom: 6,
                  }}
                >
                  Methodology update log
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    lineHeight: 1.5,
                  }}
                >
                  7 dated entries &middot; current version v3.6 &middot; June 2026
                </span>
              </span>
              <span
                className="disclose-chev"
                aria-hidden="true"
                style={{
                  ...MONO,
                  fontSize: "14px",
                  color: "var(--muted)",
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                &darr;
              </span>
            </summary>

          <div
            style={{
              borderTop: "1px solid var(--rule)",
              paddingTop: 24,
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {/* v3.6 */}
            <div>
              <div
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Methodology v3.6 &middot; June 7, 2026
              </div>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                LLM output validation strategy made explicit. The structured
                grounding layers in v3.4 (Path A and Path B, recorded in
                section 01c on{" "}
                <Link
                  href="/about/external-references#structured-grounding-in-progress"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  /about/external-references
                </Link>
                ) constrain what data the LLM works with. A separate failure
                surface applies to what the LLM produces as output. Three
                failure modes are documented in the literature and apply to
                Whel&apos;s specific pipeline: per-source extraction
                misclassification (an LLM that reads a PubMed abstract and
                assigns the wrong study type, wrong direction of effect, or
                hallucinates mechanism details not present in the source);
                summary drift (an LLM-written summary that extends beyond
                what the source actually says, the Gong et al. 2026 risk
                pattern in Bioengineering applied to Whel&apos;s task); and
                citation fabrication or misattribution in long-form prose
                Whel publishes (featured signal walkthroughs, the methods
                PDF, written drafts), where the LLM is asked to generate
                references rather than classify ones it was given.
              </p>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: "14px 0 0 0",
                }}
              >
                Whel&apos;s response is a three-part output validation
                pipeline, recorded as Path C on the Roadmap. Phase 1 is a
                citation validation step that resolves every PMID against
                NCBI E-utilities and every DOI against the Crossref REST
                API, returning the canonical title, authors, journal, and
                year, and comparing those against the LLM-claimed metadata.
                References that fail to resolve or whose returned metadata
                mismatch the LLM&apos;s claims are blocked from publication.
                Phase 2 is sentence-level summary grounding using a
                sentence-transformer model (Sentence-BERT or equivalent) to
                compute the cosine similarity between each sentence in an
                LLM-generated summary and the source abstract. Sentences
                that fall below a calibrated similarity threshold are
                flagged as &ldquo;not directly supported by the source&rdquo;
                and either suppressed or surfaced with that marker on the
                signal card. Phase 3 is prompt hardening for any
                LLM-generated long-form prose that ships to users. The
                hardened prompt forbids citation generation (the LLM may
                only cite from a pre-verified reference list provided to
                it), forbids numerical claims unless they appear verbatim
                in the input context, and requires the LLM to produce,
                alongside the text, a sentence-by-sentence list of
                supporting input sources that Phase 1 then checks.
              </p>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: "14px 0 0 0",
                }}
              >
                A fourth strategy in the broader literature, multi-sample
                consistency checking through re-querying the model, was
                considered and deferred. The cost (three to five times the
                Claude API spend) does not favorably trade against the
                marginal gain on Whel&apos;s constrained extraction task,
                and Phase 2 grounding addresses the same failure modes more
                cheaply. The deferred entry is recorded here so a future
                decision to revisit it has the design history available.
              </p>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: "14px 0 0 0",
                }}
              >
                Path C is distinct from Path A and Path B. A and B ground
                the LLM&apos;s inputs (canonical ontologies for entity
                resolution; a domain-restricted knowledge graph for
                scoring-time context). C validates the LLM&apos;s outputs
                (citations, summary statements, published prose). They are
                complementary layers in the same overall pipeline
                architecture and are designed to ship in parallel rather
                than sequentially. The Path C disclosure surface lives in
                section 01d on{" "}
                <Link
                  href="/about/external-references#output-validation-in-progress"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  /about/external-references
                </Link>
                .
              </p>
            </div>

            {/* v3.5 */}
            <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 22 }}>
              <div
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Methodology v3.5 &middot; June 7, 2026
              </div>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                MATRIX cross-reference reaches per-signal display. The Every
                Cure MATRIX coverage layer (live since v3.1) was previously
                surfaced only as an aggregate audit on the external-references
                page (compound match rate, per-condition counts, score
                distribution). Per-pair MATRIX scores are now surfaced on
                each signal card on{" "}
                <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                  /conditions/[slug]
                </code>{" "}
                pages as a &ldquo;MATRIX &middot; Top N%&rdquo; chip alongside
                the L-grade chip and the tier chip, where the percentile is
                MATRIX&apos;s own quantile rank across its roughly 39.5
                million drug&ndash;disease predictions. Per-pair scores are
                sourced from a new public snapshot at{" "}
                <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                  lib/matrix-pair-scores-snapshot.json
                </code>
                , extracted from the same audit report that produces the
                aggregate snapshot. 176 of 271 active compound&ndash;condition
                pairs in the current audit run have a MATRIX score and now
                show the chip; 95 pairs are &ldquo;matrix silent&rdquo;
                (compound not in MATRIX&apos;s drug list, or score below
                MATRIX&apos;s publication threshold) and correctly show no
                chip.
              </p>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: "14px 0 0 0",
                }}
              >
                The external-references coverage disclosure at{" "}
                <Link
                  href="/about/external-references#coverage-disclosure"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  /about/external-references &rarr; 01b
                </Link>{" "}
                was extended with a &ldquo;How to read these numbers&rdquo;
                explainer card that defines both MATRIX values in Every
                Cure&apos;s own framing (treatment-probability prediction
                from a model trained on a biomedical knowledge graph),
                explains what &ldquo;Top N%&rdquo; does and does not say,
                quotes Every Cure&apos;s &ldquo;research use only&rdquo;
                disclaimer verbatim, and explains why Whel surfaces an
                independent ML layer beside its own literature-driven grades.
                The chip tooltip uses the same treatment-probability framing
                for hover-state consistency. No change to Whel&apos;s
                rubric, sample, or tier definitions; MATRIX remains separated
                from Whel&apos;s grades rather than blended into them.
              </p>
            </div>

            {/* v3.4 */}
            <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 22 }}>
              <div
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Methodology v3.4 &middot; June 7, 2026
              </div>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                Structured grounding strategy made explicit. Whel&apos;s
                evidence extraction and scoring layer is built on Claude Opus
                4.6, a large language model.{" "}
                <Link
                  href="https://arxiv.org/abs/2604.00024"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  WHBench
                </Link>
                , an independent 2026 benchmark of frontier LLMs on
                women&apos;s health clinical questions (Maurya, Saboo &amp;
                Kumar, 2026, arXiv:2604.00024), found that no model in its
                22-model lineup exceeded 75% on the 23-criterion rubric, with
                the top model fully correct in only 35.5% of scenarios. The
                failure pattern is systematic rather than random: universal
                blind spots in social determinants of health (0.7%&ndash;19.1%
                across all 22 models), wide variation in safety harm rates
                within the top tier, and persistent gaps in completeness on
                follow-up timelines and monitoring plans. Empirical work on
                biomedical LLM reference fabrication (Gong et al. 2026,
                Bioengineering) documents hallucination rates of
                47%&ndash;55% on citation tasks. The hybrid-architecture
                literature (Zong et al. 2026{" "}
                <Link
                  href="https://arxiv.org/abs/2603.28325"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  EvidenceNet
                </Link>
                , arXiv:2603.28325; Li et al. 2025 on knowledge-guided
                prompting, IEEE J. Biomed. Health Inform.; Zunzunegui Sanz et
                al. 2025, bioRxiv) consistently shows that adding structured
                external knowledge on top of LLM extraction improves accuracy
                and interpretability.
              </p>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: "14px 0 0 0",
                }}
              >
                Whel&apos;s response, recorded as two roadmap items, is to add
                two structured grounding layers on top of the existing LLM
                pipeline without replacing it. These are architectural
                additions to the pipeline rather than post-hoc validation:
                they change what data lands in the database and how the LLM
                arrives at its scoring. Path A is ontology-grounded entity
                resolution: every compound and condition the LLM extracts is
                resolved against canonical biomedical registries (ChEMBL or
                DrugBank for compounds, MONDO for conditions), rewritten with
                the registry&apos;s standard identifier, and enriched with
                the structured metadata that resolution returns (drug class,
                ATC code, known targets; ontology lineage) before being
                written to the database. Entities that fail to resolve are
                flagged for human review rather than silently stored. This
                addresses the structured-output hallucination class of error
                directly and also moves the data Whel stores from free-text
                strings to canonical identifiers with structured metadata.
                Path B is knowledge-graph grounding, built using the{" "}
                <Link
                  href="https://biocypher.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  BioCypher
                </Link>{" "}
                framework (Lobentanzer et al., Nature Biotechnology 2023),
                restricted to Whel&apos;s six conditions and active-signal
                compounds. The knowledge graph informs the LLM at prompt
                time, following the knowledge-guided prompting pattern of Li
                et al. 2025 (IEEE J. Biomed. Health Inform.): mechanistic
                paths drawn from the subgraph relevant to a given signal are
                included as structured context during scoring, reducing the
                model&apos;s reliance on parametric memory alone. The graph
                also surfaces beside each signal as a disclosure layer
                (&ldquo;graph supports&rdquo; or &ldquo;graph silent&rdquo;)
                in the same shape as the existing MATRIX cross-reference at{" "}
                <Link
                  href="/about/external-references"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  /about/external-references
                </Link>
                .
              </p>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: "14px 0 0 0",
                }}
              >
                Whel will not train a custom graph neural network for
                drug-condition link prediction. The platform consumes machine
                learning (Claude Opus 4.6 for extraction and scoring, MATRIX
                scores from Every Cure&apos;s KGML-xDTD as an external
                disclosure layer; see Fajgenbaum et al. 2024, The Lancet
                Haematology) but does not develop its own ML models. The
                knowledge-graph plus graph-neural-network prediction direction
                (TxGNN; Huang et al. 2024, Nature Medicine) is acknowledged as
                state-of-the-art for global drug repurposing prediction but is
                out of scope for an evidence index focused on women&apos;s
                hormonal health, where the value proposition is provenance and
                interpretability rather than throughput.
              </p>
            </div>

            {/* v3.3 */}
            <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 22 }}>
              <div
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Methodology v3.3 &middot; June 7, 2026
              </div>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                Source-coverage philosophy made explicit. The four automated
                pipelines (PubMed, ClinicalTrials.gov, FDA AEMS, Open Targets,
                Reddit) ingest representative sources per
                compound&ndash;condition pair through condition-keyed Boolean
                searches with publication-date and article-type filters,
                rather than exhaustive enumeration of every paper in the
                literature. For under-researched conditions this is a
                reasonable approximation of the available evidence base. For
                well-studied compound-condition pairs it surfaces synthesis
                papers (reviews, position statements, society guidelines) and
                may leave the original RCTs cited inside them outside the
                indexed sources. The L0&ndash;L3 grade carries the
                independent-corroboration question as a separate layer. A
                planned manual-curation extension, documented in the Roadmap
                register as &ldquo;Manual primary-source curation pass,&rdquo;
                will close the gap on high-evidence signals through the same
                human-in-the-loop worklist pattern that produced the L3
                grades. The featured-signal walkthrough on{" "}
                <Link
                  href="/featured"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  /featured
                </Link>{" "}
                already documents this gap in prose for the one signal it
                covers, in Section 04 &ldquo;Literature Whel did not
                ingest.&rdquo;
              </p>
            </div>

            {/* v3.2 */}
            <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 22 }}>
              <div
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Methodology v3.2 &middot; June 1, 2026
              </div>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                The external-evidence rubric (L0 / L1 / L2 / L3) is now
                codified in a schema-versioned sidecar at{" "}
                <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                  lib/literature-grade-rubric.json
                </code>{" "}
                and surfaced on this page as a collapsible block in
                Section 04. v3.2 records the search procedure per source
                (PubMed, ClinicalTrials.gov, Cochrane, named guideline
                bodies), inclusion criteria and boundary rules at every
                level transition, source-attribution requirements per L
                assignment, and the conflict-resolution rule used when two
                reviewers disagree. No change to the sample, the
                comparators, or the pre-specified thresholds; the
                tightening makes the L assignment behind any signal
                reproducible against the printed rules, which the v3.1
                page implied but did not pin down.
              </p>
            </div>

            {/* v3.1 */}
            <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 22 }}>
              <div
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Methodology v3.1 &middot; June 1, 2026
              </div>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                Every Cure&apos;s MATRIX dataset is now surfaced as an
                independent biological-plausibility layer beside
                Whel&apos;s grades wherever MATRIX has coverage; it is not
                blended into the grades. A reproducible audit of MATRIX
                coverage over Whel&apos;s active compound&ndash;condition
                universe was run and published on this site (85.7%
                adjusted compound match rate, six of six conditions
                confirmed, full per-condition breakdown and dataset SHAs
                at{" "}
                <Link
                  href="/about/external-references#coverage-disclosure"
                  style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  /about/external-references &rarr; 01b &middot; Coverage disclosure
                </Link>
                ). No change to Whel&apos;s rubric, sample, or tier
                definitions.
              </p>
            </div>

            {/* v3 */}
            <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 22 }}>
              <div
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Methodology v3 &middot; May 29, 2026
              </div>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                v3 records the close of an independent external review
                covering two findings. C1 (replication-score drift in the
                LLM rater): the rater prompts in all four pipelines were
                tightened to enforce literal source counting per the
                published rubric; 14 signals were downgraded to the tier
                the literature actually supports; 19 manually-verified
                PubMed citations were added so each remaining
                Moderate-tier signal carries the source count the strict
                rubric requires. S3 (ClinicalTrials.gov citation/condition
                mismatches across 21 audit rows): 10 signals were
                deactivated, 5 were reassigned from clinical-trial-finding
                to cross-condition framing, 1 source was dropped where the
                signal retained independent support, 2 sources were
                replaced with proper condition-specific citations (ESHRE
                2022 endometriosis guideline; 2025 network meta-analysis
                of hormone therapies for adenomyosis pain), and 1 row was
                documented as a ClinicalTrials.gov API field limitation.
                Recorded in database migrations 036 through 040. Planned
                extensions, including external cross-reference to Every
                Cure MATRIX scores and a cross-arm concordance flag, are
                documented on the Roadmap page.
              </p>
            </div>

            {/* v2 */}
            <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 22 }}>
              <div
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Methodology v2 &middot; May 2026
              </div>
              <p
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                Named an external clinician-researcher as the primary
                rater in place of the project lead. The sample, the
                rubric, the external comparators, and the pre-specified
                thresholds are unchanged from v1. Sample numbers reflect
                the Whel database snapshot at time of publication. Updates
                to this page will be versioned and dated.
              </p>
            </div>
          </div>
          </details>

        </div>
      </div>
    </main>
  );
}
