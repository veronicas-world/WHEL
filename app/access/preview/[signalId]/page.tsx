import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidateBySignalId } from "@/lib/candidates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Gated per-signal detail page. Inherits the invite-only posture of the
// preview index: not advertised, not indexed.
export const metadata: Metadata = {
  title: "Signal detail, preview",
  robots: { index: false, follow: false },
};

const TIER_LABELS: Record<string, string> = {
  strong: "Strong",
  moderate: "Moderate",
  emerging: "Emerging",
  exploratory: "Exploratory",
};

const REL_LABELS: Record<string, string> = {
  supports: "Evidence supports",
  contradicts: "Contradiction present",
  silent: "Evidence silent",
};

// Canonical sources for the explainers (the justifications), hyperlinked inline.
const EVERYCURE = "https://huggingface.co/datasets/everycure/matrix-scores";
const OPENTARGETS = "https://platform.opentargets.org/";
const ACOG_PMDD = "https://www.acog.org/clinical/clinical-guidance/clinical-practice-guideline/articles/2023/12/management-of-premenstrual-disorders";
const ESHRE = "https://www.eshre.eu/Guidelines-and-Legal/Guidelines";
const COCHRANE = "https://www.cochranelibrary.com/";
const ZUCKER = "https://doi.org/10.1186/s13293-020-00308-5";
const SOLDIN = "https://doi.org/10.2165/00003088-200948030-00001";

const DIM_MONO: React.CSSProperties = { fontFamily: "var(--font-plex-mono, ui-monospace, monospace)" };

/** Human label for a source's study type (used to tag the provenance trail). */
function studyLabel(t?: string): string | undefined {
  if (!t) return undefined;
  const k = t.toLowerCase();
  if (k.includes("guideline")) return "Clinical guideline";
  if (k.includes("rct") || k.includes("randomi")) return "Randomized trial";
  if (k.includes("systematic") || k.includes("meta") || k === "sr_or_ma" || k.includes("sr/")) return "Systematic review / meta-analysis";
  if (k.includes("expert") || k.includes("opinion")) return "Expert opinion";
  if (k.includes("observ") || k.includes("cohort") || k.includes("case")) return "Observational study";
  return t.replace(/_/g, " ");
}

// What each rubric dimension measures (the model assigns each a 0-2 sub-score).
const DIM_WHAT: Record<string, string> = {
  replication: "How many independent sources report the same effect. A higher score means the finding is replicated rather than resting on a single report.",
  source: "The strength of the source types behind the signal, weighting registered trials and peer-reviewed work above community reports.",
  specificity: "How directly the evidence speaks to this exact drug and condition, rather than a related compound or a broader indication.",
  plausibility: "Whether a credible biological mechanism connects the drug to the condition, as opposed to an unexplained association.",
  direction: "Whether the sources agree on the direction of the effect, rather than pointing in conflicting directions.",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow" style={{ marginBottom: 12 }}>
      {children}
    </div>
  );
}

const LINK: React.CSSProperties = { color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 };

const chebiUrl = (id: string) => `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${encodeURIComponent(id)}`;
const mondoUrl = (id: string) => `https://monarchinitiative.org/${encodeURIComponent(id)}`;

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={LINK}>
      {children}
    </a>
  );
}

/** An in-site link to a fuller explanation of a reading or source. */
function LearnMore({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ display: "inline-block", marginTop: 10, fontSize: 12.5, lineHeight: 1.5, color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 }}
    >
      {children} →
    </Link>
  );
}

/** A source citation, rendered as a link when a URL is on file. */
function SourceCite({ text, url }: { text: string; url?: string }) {
  const base: React.CSSProperties = { display: "block", fontSize: 12, lineHeight: 1.5, marginTop: 4 };
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...base, ...LINK }}>
      {text} ↗
    </a>
  ) : (
    <span style={{ ...base, color: "var(--muted)" }}>{text}</span>
  );
}

export default async function SignalDetail({
  params,
}: {
  params: Promise<{ signalId: string }>;
}) {
  const { signalId } = await params;
  const c = await getCandidateBySignalId(signalId);
  if (!c) notFound();

  // The grade-relevant records actually attached to this signal (guidelines,
  // trials, reviews), tagged by type. These are what earn the literature grade,
  // pulled from stored source tags, no model rerun needed.
  const clipTitle = (s: string) => (s.length > 110 ? s.slice(0, 109).trimEnd() + "…" : s);
  const GRADE_TYPES = ["Clinical guideline", "Randomized trial", "Systematic review / meta-analysis"];
  const gradeRecords = c.claims.filter((cl) => GRADE_TYPES.includes(studyLabel(cl.studyType) ?? ""));

  let litLead: string;
  if (!c.lGrade) {
    litLead = "This pair is not graded yet; no external record is on file for it.";
  } else if (gradeRecords.length > 0) {
    const why =
      c.lGrade === "L3" ? "a clinical guideline names this drug"
      : c.lGrade === "L2" ? "a randomized trial or systematic review reports a result"
      : "the published record backs it";
    litLead = `Graded ${c.lGrade} because ${why}. The records that earn the grade:`;
  } else {
    litLead = `This pair is graded ${c.lGrade}. The grade rises only as far as the attached sources support, which are in the provenance trail below.`;
  }

  const litRecords = gradeRecords.length > 0 ? (
    <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
      {gradeRecords.map((cl, i) => (
        <li key={i} style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--body)", paddingLeft: 16, position: "relative" }}>
          <span aria-hidden style={{ position: "absolute", left: 0, color: "var(--green-mid)", fontWeight: 600 }}>&rsaquo;</span>
          {cl.href ? (
            <a href={cl.href} target="_blank" rel="noopener noreferrer" style={LINK}>{clipTitle(cl.text)} ↗</a>
          ) : (
            <span style={{ color: "var(--ink)" }}>{clipTitle(cl.text)}</span>
          )}
          <span
            style={{
              ...DIM_MONO, display: "inline-block", marginLeft: 8, fontSize: 10.5, letterSpacing: "0.04em",
              textTransform: "uppercase", whiteSpace: "nowrap", border: "1px solid var(--rule-strong)", padding: "1px 6px",
              color: studyLabel(cl.studyType) === "Clinical guideline" ? "var(--green-deep)" : "var(--muted)",
            }}
          >
            {studyLabel(cl.studyType)}{cl.guidelineStrength ? ` · ${cl.guidelineStrength}${cl.guidelineCertainty ? `, ${cl.guidelineCertainty}` : ""}` : ""}
          </span>
        </li>
      ))}
    </ul>
  ) : null;

  // Fuller MATRIX read for this pair: the raw treat-score and the entities scored.
  const md = c.matrixDetail;
  const matrixForThisPair: React.ReactNode = c.matrixPercentile
    ? `MATRIX places this pair at ${c.matrixPercentile}${
        md?.transformedScore != null
          ? `, with a treat-score of ${md.transformedScore.toFixed(2)} (higher is better; across the pairs we cover, scores span about 3.1 to 4.5)`
          : ""
      }.`
    : "MATRIX has no score for this pair.";
  const matrixEntities =
    c.matrixPercentile && md && (md.sourceId || md.mondo) ? (
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--muted)", margin: "10px 0 0" }}>
        Scored over MATRIX&rsquo;s own entities, confirming the same drug and disease:{" "}
        {md.sourceId ? (
          <a href={chebiUrl(md.sourceId)} target="_blank" rel="noopener noreferrer" style={LINK}>{md.sourceId}</a>
        ) : "drug"}{" "}(drug)
        {md.mondo ? (
          <>
            {" "}and{" "}
            <a href={mondoUrl(md.mondo)} target="_blank" rel="noopener noreferrer" style={LINK}>{md.mondo}</a>{" "}(disease)
          </>
        ) : null}
        .
      </p>
    ) : null;

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="surface-ink" style={{ paddingTop: 40, paddingBottom: 52 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/access/preview">Full index (preview)</Link>
            <span className="sep">/</span>
            <span className="here">{c.id}</span>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 16, color: "var(--signal)" }}>
            {c.id} · {TIER_LABELS[c.tier]} evidence · {c.score}/10
          </div>
          <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(32px,4vw,56px)", lineHeight: 1.08, maxWidth: "20ch" }}>
            {c.drug}
            <span style={{ color: "var(--on-ink-2)" }}> for </span>
            {c.condition}
          </h1>
          <p className="lede" style={{ marginTop: 22, color: "var(--on-ink-2)", maxWidth: "64ch" }}>
            {c.rationale}
          </p>
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: "8px 18px", fontSize: 13, color: "var(--on-ink-2)" }}>
            <span><strong style={{ color: "var(--on-ink)" }}>Origin</strong> · {c.origin}</span>
            <span><strong style={{ color: "var(--on-ink)" }}>Pathway</strong> · {c.pathway}</span>
            <span><strong style={{ color: "var(--on-ink)" }}>{REL_LABELS[c.direction]}</strong></span>
          </div>
        </div>
      </section>

      {/* ── At a glance: the readings ────────────────────────────────────── */}
      <section className="surface-bone section tight">
        <div className="container">
          <SectionLabel>The readings, side by side</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Reading label="Our composite score" value={`${c.score} / 10`} sub={`${TIER_LABELS[c.tier]} tier`} />
            <Reading label="Literature grade" value={c.lGrade ?? "Not graded"} sub={c.lGrade ? "External validation, L0 to L3" : "No external record yet"} />
            <Reading label="MATRIX cross-reference" value={c.matrixPercentile ?? "Not covered"} sub="Every Cure treatment-probability model" />
            <Reading
              label="Knowledge graph"
              value={c.graphViaTargets && c.graphViaTargets.length ? "Supports" : "Silent"}
              sub={c.graphViaTargets && c.graphViaTargets.length ? `via ${c.graphViaTargets.join(", ")}` : "No shared target in Open Targets"}
            />
            <Reading
              label="Sex-specific PK"
              value={c.sexPk && c.sexPk.length ? "Documented" : "None on file"}
              sub={c.sexPk && c.sexPk.length ? "How the drug behaves differently in women" : "No sex-PK record for this drug"}
            />
            <Reading
              label="Cycle-phase dependence"
              value={c.cyclePhase && c.cyclePhase.length ? `${c.cyclePhase[0].cyclePhase} phase` : "None on file"}
              sub={c.cyclePhase && c.cyclePhase.length ? "Effect depends on menstrual-cycle phase" : "No phase-dependence on file"}
            />
          </div>
        </div>
      </section>

      {/* ── Hypothesized mechanism ───────────────────────────────────────── */}
      <section className="surface-paper section tight">
        <div className="container" style={{ maxWidth: "72ch" }}>
          <SectionLabel>Hypothesized mechanism</SectionLabel>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--body)" }}>{c.mechanism}</p>
        </div>
      </section>

      {/* ── Evidence dimensions ──────────────────────────────────────────── */}
      <section className="surface-bone section tight">
        <div className="container">
          <SectionLabel>How the score was reached, for this pair</SectionLabel>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", maxWidth: "74ch", marginBottom: 8 }}>
            The composite score is the sum of five dimensions, each scored 0 to 2 by the model from the
            evidence on file. Below is the sub-score this specific pair received on each, with what that
            dimension measures. It scored {c.score} of 10 overall, a {c.tier} reading
            {c.signalType ? `, from a ${c.signalType.replace(/_/g, " ")}` : ""}
            {c.evidenceStrength ? ` rated ${c.evidenceStrength} in strength` : ""}.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--muted)", maxWidth: "74ch", marginBottom: 20 }}>
            The model&rsquo;s overall reasoning for this pair is the summary at the top of the page, and
            the mechanism it proposed is in the section above.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: "74ch" }}>
            {(c.dimBreakdown ?? []).map((d) => (
              <div key={d.key} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "4px 16px", alignItems: "baseline", borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
                <div className="font-heading" style={{ fontSize: 16, color: "var(--ink)" }}>{d.label}</div>
                <div style={{ ...DIM_MONO, fontSize: 13, color: "var(--ink)", textAlign: "right" }}>
                  {d.score} / 2 · {d.level}
                </div>
                <div style={{ gridColumn: "1 / -1", fontSize: 13.5, lineHeight: 1.6, color: "var(--body)" }}>
                  {DIM_WHAT[d.key]}
                </div>
              </div>
            ))}
          </div>

          <LearnMore href="/about/technical-architecture#how-evidence-is-scored">
            How the scoring rubric works, in general
          </LearnMore>
        </div>
      </section>

      {/* ── Independent readings ─────────────────────────────────────────── */}
      <section className="surface-paper section tight">
        <div className="container" style={{ maxWidth: "74ch" }}>
          <SectionLabel>Independent readings, reported beside the score</SectionLabel>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", marginBottom: 22 }}>
            Three outside checks are reported alongside the composite score. Each is recorded separately
            and is not combined into the score.
          </p>

          <ReadingBlock
            heading={`Literature grade${c.lGrade ? ` · ${c.lGrade}` : ""}`}
            whatItIs={
              <>
                How far the published record independently backs this pair, on a four-step scale that
                always traces to a source. L0 means no external record yet; L1, the pair appears in
                peer-reviewed literature; L2, a randomized trial or systematic review reports a result;
                L3, the pair is named in an active clinical guideline from a body such as{" "}
                <Ext href={ESHRE}>ESHRE</Ext>, <Ext href={ACOG_PMDD}>ACOG</Ext>, or{" "}
                <Ext href={COCHRANE}>Cochrane</Ext>. The grade is applied after scoring as an independent
                benchmark and is not an input to the composite score.
              </>
            }
            forThisPair={litLead}
            extra={litRecords}
            learnMore={
              <LearnMore href="/about/technical-architecture#how-evidence-is-scored">
                Why the literature grade sits outside the score
              </LearnMore>
            }
          />

          <ReadingBlock
            heading={`MATRIX cross-reference${c.matrixPercentile ? ` · ${c.matrixPercentile}` : ""}`}
            whatItIs={
              <>
                <Ext href={EVERYCURE}>Every Cure&rsquo;s</Ext> machine-learned treatment-probability
                model, drawn from a biomedical knowledge graph across roughly 1,800 drugs and 22,000
                diseases. It provides a model-based estimate of how plausible a drug-disease link is given
                the structure of biomedical knowledge, reported alongside the direct evidence.
              </>
            }
            forThisPair={matrixForThisPair}
            extra={matrixEntities}
            learnMore={
              <LearnMore href="/about/external-references#coverage-disclosure">
                More on the MATRIX cross-reference and its provenance
              </LearnMore>
            }
          />

          <ReadingBlock
            heading={`Knowledge graph · ${c.graphViaTargets && c.graphViaTargets.length ? "supports" : "silent"}`}
            whatItIs={
              <>
                A check, computed over <Ext href={OPENTARGETS}>Open Targets</Ext>, of whether the drug
                acts on a target that the graph independently associates with the condition. Absence of a
                connection means the graph has no relevant edge, not evidence against the pair; for these
                conditions it often reflects limited source coverage.
              </>
            }
            forThisPair={
              c.graphViaTargets && c.graphViaTargets.length
                ? `The graph connects this pair through ${c.graphViaTargets.join(", ")}.`
                : "No shared target is present, so the graph does not connect this pair."
            }
            learnMore={
              <LearnMore href="/about/external-references#structured-grounding-in-progress">
                More on the knowledge-graph grounding
              </LearnMore>
            }
          />
        </div>
      </section>

      {/* ── Sex-specific PK ──────────────────────────────────────────────── */}
      {c.sexPk && c.sexPk.length > 0 && (
        <section className="surface-paper section tight">
          <div className="container" style={{ maxWidth: "72ch" }}>
            <SectionLabel>Sex-specific pharmacokinetics</SectionLabel>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", marginBottom: 18 }}>
              Documented differences in how this drug is handled in women, drawn from a primary source,
              an FDA label or the curated sex-PK literature (
              <Ext href={ZUCKER}>Zucker and Prendergast 2020</Ext>;{" "}
              <Ext href={SOLDIN}>Soldin and Mattison 2009</Ext>). It is reported beside the signal and is
              not part of the composite score; it informs how a result should be interpreted.
            </p>
            {c.sexPk.map((f, i) => (
              <div key={i} style={{ borderLeft: "2px solid var(--brick)", padding: "10px 0 10px 14px", marginBottom: 12, fontSize: 14.5, lineHeight: 1.65, color: "var(--body)" }}>
                <span style={{ color: "var(--ink)", fontWeight: 500, textTransform: "capitalize" }}>{f.parameter}</span>
                {f.direction ? `, ${f.direction} in ${f.sex === "female" ? "women" : "men"}` : ` (${f.sex})`}
                {f.magnitude ? `: ${f.magnitude}` : ""}
                {f.source && <SourceCite text={f.source} url={f.sourceUrl} />}
              </div>
            ))}
            <LearnMore href="/about/external-references#female-biology">
              More on the sex-specific pharmacokinetics layer and its sources
            </LearnMore>
          </div>
        </section>
      )}

      {/* ── Cycle-phase dependence ───────────────────────────────────────── */}
      {c.cyclePhase && c.cyclePhase.length > 0 && (
        <section className="surface-bone section tight">
          <div className="container" style={{ maxWidth: "72ch" }}>
            <SectionLabel>Cycle-phase dependence</SectionLabel>
            <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>Why it matters.</strong>{" "}Some treatments work
                differently depending on where someone is in the menstrual cycle, and for a cyclical
                condition like PMDD the timing can be the whole point. A drug that helps in the luteal
                phase, the roughly two weeks before menstruation, can look weaker than it is when its
                effect is averaged across the entire cycle.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>What tracking the phase adds.</strong>{" "}Holding the
                phase as structured data lets a luteal-phase result be read in its phase rather than
                averaged across the cycle, and records the dosing pattern, taking the drug only in the
                luteal phase, that a phase-blind record does not capture.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>What the literature says.</strong>{" "}For PMDD this
                is well established: intermittent luteal-phase SSRI dosing is an accepted first-line regimen
                (<Ext href={ACOG_PMDD}>ACOG 2023</Ext>), and it works within days, which is itself a clue
                that the drug acts through a faster route here than in depression. The standard outcome
                instrument for measuring it is the Daily Record of Severity of Problems (DRSP).
              </p>
            </div>
            {c.cyclePhase.map((f, i) => (
              <div key={i} style={{ borderLeft: "2px solid var(--arm-cross)", padding: "10px 0 10px 14px", marginBottom: 12, fontSize: 14.5, lineHeight: 1.65, color: "var(--body)" }}>
                <span style={{ color: "var(--ink)", fontWeight: 500, textTransform: "capitalize" }}>{f.cyclePhase} phase</span>
                {f.dosingNote ? `: ${f.dosingNote}` : ""}
                {f.source && <SourceCite text={f.source} url={f.sourceUrl} />}
              </div>
            ))}
            <LearnMore href="/about/external-references#female-biology">
              More on the cycle-phase layer and its sources
            </LearnMore>
          </div>
        </section>
      )}

      {/* ── Provenance trail ─────────────────────────────────────────────── */}
      <section className="surface-paper section tight">
        <div className="container" style={{ maxWidth: "76ch" }}>
          <SectionLabel>Per-claim provenance · synthesis marked · contradictions surfaced</SectionLabel>
          <div className="col" style={{ gap: 12 }}>
            {c.claims.map((cl, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14.5, lineHeight: 1.6, color: "var(--body)" }}>
                <span
                  className="font-heading"
                  style={{
                    flexShrink: 0, width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: cl.type === "contradict" ? "var(--brick)" : "var(--ink)",
                    border: `1px solid ${cl.type === "contradict" ? "var(--brick)" : "var(--rule-strong)"}`,
                  }}
                >
                  {cl.type === "synth" ? "S" : cl.type === "contradict" ? "!" : String(i + 1)}
                </span>
                <span>
                  {cl.text}{" "}
                  {cl.href ? (
                    <a href={cl.href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 }}>
                      {cl.src} ↗
                    </a>
                  ) : (
                    <span style={{ color: "var(--muted)" }}>{cl.src}</span>
                  )}
                  {studyLabel(cl.studyType) && (
                    <span
                      style={{
                        ...DIM_MONO,
                        display: "inline-block",
                        marginLeft: 8,
                        fontSize: 10.5,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: cl.studyType && cl.studyType.toLowerCase().includes("guideline") ? "var(--green-deep)" : "var(--muted)",
                        border: "1px solid var(--rule-strong)",
                        padding: "1px 6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {studyLabel(cl.studyType)}
                      {cl.guidelineStrength ? ` · ${cl.guidelineStrength}${cl.guidelineCertainty ? `, ${cl.guidelineCertainty}` : ""}` : ""}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted)", maxWidth: "72ch", marginTop: 18 }}>
            These are the sources behind the signal itself. The references behind the markers above
            (literature grade, MATRIX, sex-PK, cycle phase) are linked in their own sections.
          </p>
          <LearnMore href="/about/external-references">
            What these external sources are, and why they carry weight
          </LearnMore>

          <div style={{ borderTop: "1px solid var(--rule)", marginTop: 28, paddingTop: 24 }}>
            <Link href="/access/preview" className="btn btn-ghost sm">
              <span className="arr">←</span> Back to the full index
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ReadingBlock({ heading, whatItIs, forThisPair, extra, learnMore }: { heading: string; whatItIs: React.ReactNode; forThisPair: React.ReactNode; extra?: React.ReactNode; learnMore?: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 18, marginTop: 18 }}>
      <div className="font-heading" style={{ fontSize: 17, color: "var(--ink)", marginBottom: 8 }}>{heading}</div>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--body)", margin: "0 0 8px" }}>{whatItIs}</p>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-2)", margin: 0 }}>
        <strong style={{ color: "var(--ink)" }}>For this pair.</strong> {forThisPair}
      </p>
      {extra}
      {learnMore}
    </div>
  );
}

function Reading({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
      <div className="font-heading" style={{ fontSize: 20, color: "var(--ink)", lineHeight: 1.15 }}>{value}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--body)" }}>{sub}</div>
    </div>
  );
}
