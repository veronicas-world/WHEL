import Link from "next/link";
import { getCandidates, getSubstrateHomeData } from "@/lib/substrate-candidates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Validation methodology | Whel",
  description:
    "The pre-registered benchmark for Whel's confidence tiers: how a Strong-tier drug–condition pair is checked against the independent external clinical record, fixed before the test is run.",
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

// External-corroboration ladder. This is an *external* benchmark, computed
// after the fact against the published record — it is deliberately separate
// from the internal five-dimension rubric that produces a pair's tier, so
// agreement between the two stays informative rather than circular.
const EXT_LEVELS = [
  {
    level: "E0",
    label: "No independent external support",
    summary:
      "Nothing in the external record beyond the sources Whel already indexed for the pair.",
  },
  {
    level: "E1",
    label: "Independent primary evidence",
    summary:
      "At least one published trial or study not already attached to the signal reports the drug–condition pair.",
  },
  {
    level: "E2",
    label: "Replicated or synthesized",
    summary:
      "A systematic review or meta-analysis, or two or more independent trials, cover the pair.",
  },
  {
    level: "E3",
    label: "Guideline-recognized",
    summary:
      "A named clinical-society guideline names the pair in either direction. A discouraged option still counts, and the direction is recorded separately.",
  },
];

function compoundKey(signalId: string | undefined, drug: string): string {
  if (signalId && signalId.includes("__")) return signalId.split("__")[0];
  return drug.toLowerCase();
}

export default async function MethodologyPage() {
  const [cands, home] = await Promise.all([getCandidates(), getSubstrateHomeData()]);

  const total = cands.length;
  const conditions = new Set(cands.map((c) => c.conditionId ?? c.condition.toLowerCase())).size;
  const strong = cands.filter((c) => c.tier === "strong");
  const emerging = cands.filter((c) => c.tier === "emerging");
  const exploratory = cands.filter((c) => c.tier === "exploratory");
  const distinctCompounds = new Set(cands.map((c) => compoundKey(c.signalId, c.drug))).size;
  const strongCompounds = new Set(strong.map((c) => compoundKey(c.signalId, c.drug))).size;
  const clinical = cands.filter((c) => c.validationStatus === "clinical").length;

  const SAMPLE_NUMBERS = [
    { label: "Active pairs (corpus)", value: String(total) },
    { label: "Strong-tier pairs", value: String(strong.length) },
    { label: "Conditions represented", value: String(conditions) },
    { label: "Distinct compounds", value: String(distinctCompounds) },
  ];

  return (
    <main className="flex-1 doc-shell" style={{ backgroundColor: "var(--bg)" }}>

      {/* ── Floating table of contents (large screens only) ──────────────── */}
      <aside className="doc-toc doc-toc--w4" aria-label="On this page">
        <div className="doc-toc-eyebrow">On this page</div>
        <a href="#purpose"><span className="doc-n">01</span><span className="doc-t">Purpose</span></a>
        <a href="#sample"><span className="doc-n">02</span><span className="doc-t">Sample</span></a>
        <a href="#external-comparators"><span className="doc-n">03</span><span className="doc-t">External comparators</span></a>
        <a href="#levels"><span className="doc-n">04</span><span className="doc-t">External corroboration</span></a>
        <a href="#adjudication"><span className="doc-n">05</span><span className="doc-t">Adjudication</span></a>
        <a href="#analysis-plan"><span className="doc-n">06</span><span className="doc-t">Analysis plan</span></a>
        <a href="#limitations"><span className="doc-n">07</span><span className="doc-t">Limitations</span></a>
        <a href="#reporting"><span className="doc-n">08</span><span className="doc-t">Reporting</span></a>
      </aside>

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
            Pre-registration · substrate model
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
            How Whel will validate its tiers.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "62ch" }}>
            This page records the validation benchmark for Whel&apos;s confidence tiers before it is
            run. The sample, the external sources of truth, the adjudication rules, and the falsifying
            outcome are fixed here so the result can be read as a calibration check rather than a
            retrospective rationalization. The benchmark itself will be executed after publication of
            this page and the result reported against the criteria below, whatever it shows.
          </p>

          {/* Snapshot strip — bound to the live substrate so it can never drift */}
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
          <p
            style={{
              ...MONO,
              fontSize: "10.5px",
              letterSpacing: "0.04em",
              color: "var(--muted)",
              marginTop: 14,
              lineHeight: 1.55,
            }}
          >
            Live from the substrate · {home.claims} verbatim claims across {home.documents} source
            documents back the active signals.
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>

          {/* 01 — Purpose */}
          <section id="purpose" style={{ scrollMarginTop: 80 }}>
            <div style={EYEBROW}>01 · Purpose</div>
            <h2 className="font-heading" style={H2}>Why pre-register</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Whel reads each drug–condition pair through three evidence arms and scores each arm on
                five dimensions, then discounts the arm score by a female-applicability multiplier and
                sorts it into a tier. The full model is documented on the{" "}
                <Link href="/signal-types" style={LINK}>signal types &amp; scoring page</Link>{" "}
                and the{" "}
                <Link href="/about/technical-architecture" style={LINK}>technical architecture page</Link>
                . The question this page addresses is one step downstream of that model: when Whel
                reports a pair as Strong, how often does the independent external clinical record line
                up with it.
              </p>
              <p style={BODY}>
                The credibility of any answer to that question depends on fixing the test before
                running it. The sample, the external comparators, the adjudication rules, and the
                reporting format are all locked here. The result will be reported against this page,
                with the version tag at the top, even if it undercuts Whel&apos;s own framing.
              </p>
            </div>
          </section>

          {/* 02 — Sample */}
          <section id="sample" style={{ scrollMarginTop: 80 }}>
            <div style={EYEBROW}>02 · Sample</div>
            <h2 className="font-heading" style={H2}>What gets evaluated</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The primary sample is every active Strong-tier drug–condition pair in the substrate at
                the snapshot date. As of the live corpus above, that is {strong.length} Strong-tier
                pairs spanning {conditions} conditions and {strongCompounds} distinct compounds. The
                full list is read directly from the substrate at request time, so the count on this
                page can never silently drift from what the engine actually holds.
              </p>
              <p style={BODY}>
                A matched comparator sample is drawn from the Emerging tier ({emerging.length} pairs)
                and the Exploratory tier ({exploratory.length} pairs), using stratified random sampling
                on the anchoring arm so the comparator mix mirrors the Strong sample. The comparators
                are included specifically so the result can be read as calibration: a Strong tier that
                corroborates externally at a much higher rate than the lower tiers is the outcome the
                model is designed to produce.
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
                  Structural pre-checks
                </div>
                <p style={{ fontSize: "0.92rem", color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
                  Of the active corpus, {clinical} pairs carry a clinical validation status, meaning a
                  Direct evidence arm is strong enough to anchor the pair. Every Strong-tier pair passes the
                  engine&apos;s structural audit: no missing dimension scores, no tier–score-band
                  mismatches, no signal whose anchoring arm lacks a verbatim claim, and no duplicate
                  source URLs within a pair. The frozen list of the {strong.length} Strong-tier pairs is
                  archived at the time of execution so the benchmark is reproducible against a fixed
                  snapshot.
                </p>
              </div>
            </div>
          </section>

          {/* 03 — External comparators */}
          <section id="external-comparators" style={{ scrollMarginTop: 80 }}>
            <div style={EYEBROW}>03 · External comparators</div>
            <h2 className="font-heading" style={H2}>Where the external evidence comes from</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Each pair in the sample is checked against the following external bodies of evidence.
                Searches use the compound name (generic and brand where relevant) together with the
                condition name and standard synonyms, with no date restriction and no language
                restriction.
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
                Sources already indexed in the substrate for that pair are excluded from the external
                search so the comparison remains genuinely external. If a PubMed PMID is already
                attached to the signal as evidence, that PMID does not count toward external
                corroboration, but other PubMed records on the same pair do.
              </p>
            </div>
          </section>

          {/* 04 — External corroboration */}
          <section id="levels" style={{ scrollMarginTop: 80 }}>
            <div style={EYEBROW}>04 · External corroboration</div>
            <h2 className="font-heading" style={H2}>What counts as a hit</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                This benchmark is deliberately external. The five-dimension rubric that produces a
                pair&apos;s tier, including its internal <em>corroboration</em> dimension, is scored
                only against the evidence Whel has actually ingested. The ladder below measures
                something separate: whether the <em>independent</em> external record, setting aside what
                Whel already holds, takes the same pair seriously. Because the two are kept apart, any
                agreement between them actually carries weight.
              </p>
              <p style={BODY}>
                Each pair is assigned a single level on the scale below, taking the highest applicable
                level. The level reflects only what exists in the external record. Whether that evidence
                is positive or negative does not change the level: a pair that surfaces in a guideline as
                a discouraged option still scores E3, and the direction is recorded separately.
              </p>

              <div style={{ ...CARD }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {EXT_LEVELS.map((lvl) => (
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
                E3 (guideline recognition) is established by a human curation pass that sits outside the
                scoring pipeline. A named society body such as ESHRE, ISSWSH, NAMS, NICE, ACOG, or ASRM
                names the pair, and the endorsement strength and evidence certainty are recorded using
                that body&apos;s own framework (GRADE for ESHRE, NAMS Levels I/II/III, the ISSWSH modified
                Delphi), then normalized so grades from different bodies can be compared. Coverage is
                intentionally narrow at this stage and expands following the same workflow.
              </p>

              <p style={BODY}>
                Separately, and never blended into either the tier or the external level, Whel surfaces
                the Every Cure <strong>MATRIX</strong> cross-reference. MATRIX is an independent
                treatment-probability prediction from a graph-ML model trained on an open biomedical
                knowledge graph, built on the KGML-xDTD framework (Ma, Zhou, Liu &amp; Koslicki,{" "}
                <a href="https://doi.org/10.1093/gigascience/giad057" target="_blank" rel="noopener noreferrer" style={LINK}>
                  GigaScience 2023
                </a>
                ). Per-pair MATRIX scores appear beside a pair&apos;s arm scores as a disclosure layer.
                Full audit numbers, per-condition coverage, and the score distribution are published at{" "}
                <Link href="/about/external-references#coverage-disclosure" style={LINK}>
                  external references → 05 · Coverage disclosure
                </Link>
                .
              </p>

              <p style={BODY}>
                Effect direction in the external record is captured as a secondary field: supports the
                indexed direction, contradicts it, mixed, or unclear. This is reported alongside the
                level but is not used to determine the level itself.
              </p>
            </div>
          </section>

          {/* 05 — Adjudication */}
          <section id="adjudication" style={{ scrollMarginTop: 80 }}>
            <div style={EYEBROW}>05 · Adjudication</div>
            <h2 className="font-heading" style={H2}>How pairs are scored</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Each pair is reviewed in randomized order so that no rater ever scores a contiguous
                tier block. Tier assignment is masked: the rater sees the compound, the condition, and
                the anchoring arm, but not Whel&apos;s scoring or tier. The external level (E0–E3) and
                direction are recorded before the masked fields are revealed.
              </p>
              <p style={BODY}>
                The primary adjudicator is an external clinician-researcher with a decade of NIMH- and
                PCORI-funded research experience in women&apos;s health, drawn from outside the project
                team. The project lead is not the primary rater. A subset of at least 20 percent of the
                sample will be independently scored by a second reviewer, with disagreements resolved by
                discussion and inter-rater agreement reported as Cohen&apos;s kappa. Both reviewers must
                be blind to the tier assignment at the time of scoring.
              </p>
            </div>
          </section>

          {/* 06 — Analysis plan */}
          <section id="analysis-plan" style={{ scrollMarginTop: 80 }}>
            <div style={EYEBROW}>06 · Analysis plan</div>
            <h2 className="font-heading" style={H2}>What gets reported</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                For each tier in the sample (Strong, Emerging, Exploratory), the report will give the
                distribution across E0–E3, the share that reaches at least E1 and at least E2, and the
                share with direction consistent with the indexed effect. Results are reported with exact
                confidence intervals.
              </p>
              <p style={BODY}>
                The primary calibration question is whether the Strong tier reaches at least E1 in a
                clearly higher share of cases than the Emerging tier, and at least E2 in a clearly higher
                share than the Exploratory tier. The result will be reported as supported, partially
                supported, or not supported against the pre-specified thresholds below.
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
                    Supported: at least 85 percent of Strong pairs reach E1 or higher, and at least 50
                    percent reach E2 or higher.
                  </li>
                  <li style={{ ...BODY, listStyle: "disc" }}>
                    Partially supported: at least 70 percent reach E1 and at least 30 percent reach E2.
                  </li>
                  <li style={{ ...BODY, listStyle: "disc" }}>
                    Not supported: below the partially-supported thresholds, or the Strong tier does not
                    exceed the Emerging tier on either metric.
                  </li>
                </ul>
              </div>

              <p style={BODY}>
                Directional consistency is reported separately and is not used to adjudicate the headline
                result. A pair where the external record is clearly opposite to the indexed direction is
                flagged for review.
              </p>
            </div>
          </section>

          {/* 07 — Limitations */}
          <section id="limitations" style={{ scrollMarginTop: 80 }}>
            <div style={EYEBROW}>07 · Limitations</div>
            <h2 className="font-heading" style={H2}>What this benchmark does not show</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                A successful result here would show that Whel&apos;s Strong tier concentrates on
                drug–condition pairs that the external clinical record also takes seriously. It would not
                show that those pairs work in patients. It would show only that the indexed evidence and
                the external evidence agree on which pairs are worth studying. Clinical efficacy is a
                separate question, and answering it requires trials.
              </p>
              <p style={BODY}>
                The sample is small ({strong.length} Strong, with matched comparators). The external
                sources of truth are themselves imperfect: guidelines lag the literature, the literature
                lags the biology, and some conditions in scope (notably PMDD and vulvodynia) have thinner
                guideline coverage than others. These conditions will tend toward E1 or E2 even where the
                indexed signal is well supported by trials, and that asymmetry is expected.
              </p>
              <p style={BODY}>
                The classifier scoring the indexed signals is the same language-model family that may
                assist external search. Where external search is used to surface candidate papers, a
                human reviewer makes the final level assignment by reading those papers; the model does
                not.
              </p>
            </div>
          </section>

          {/* 08 — Reporting */}
          <section id="reporting" style={{ scrollMarginTop: 80 }}>
            <div style={EYEBROW}>08 · Reporting</div>
            <h2 className="font-heading" style={H2}>Where the result will land</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Results will be posted as a new section on this page and linked from the home page and
                the technical architecture page. The version tag at the top is incremented only if the
                methodology itself changes; the underlying data snapshot is recorded with the result. Raw
                scoring sheets, including disagreements, will be made available on request and archived
                alongside the writeup.
              </p>
              <p style={BODY}>
                Negative or partial-support results will be reported with the same prominence as positive
                ones. If the Strong tier does not materially separate from Emerging on the pre-specified
                thresholds, the model is revised and re-tested before the benchmark is run again.
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
                The three evidence arms, the five-dimension rubric, and the indexing pipeline that
                produces these tiers are documented separately.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px" }}>
              <Link
                href="/signal-types"
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
                How signals are scored →
              </Link>
            </div>
          </div>

          {/* Latest revision — links out to the full methodology changelog */}
          <div
            style={{
              marginTop: 24,
              border: "1px solid var(--rule)",
              background: "var(--surface)",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <span className="font-heading" style={{ fontSize: "14px", color: "var(--ink)", letterSpacing: 0 }}>
                Latest revision
              </span>
              <span
                style={{
                  ...MONO,
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                Substrate model · June 2026
              </span>
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
              The pre-registered benchmark was re-grounded on the three-arm substrate model. The earlier
              external-validation ladder, which doubled as an in-pipeline literature grade, was retired;
              the in-pipeline corroboration signal now lives inside the five-dimension rubric, and this
              page keeps a clean external ladder (E0–E3) that is computed only after the fact. The sample
              numbers above are read live from the substrate so they cannot drift from the engine.
            </p>

            <div
              style={{
                borderTop: "1px dashed var(--rule)",
                paddingTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link href="/about/methodology/changelog" style={{ ...LINK, ...MONO, fontSize: "11px", letterSpacing: "0.13em", textTransform: "uppercase" }}>
                Full revision history →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
