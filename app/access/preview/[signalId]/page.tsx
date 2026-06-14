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

const chebiUrl = (id: string) => `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${encodeURIComponent(id)}`;
const mondoUrl = (id: string) => `https://monarchinitiative.org/${encodeURIComponent(id)}`;
const otTargetUrl = (ensembl: string) => `https://platform.opentargets.org/target/${ensembl}`;
const otEvidenceUrl = (ensembl: string, disease: string) => `https://platform.opentargets.org/evidence/${ensembl}/${disease}`;
const otDiseaseUrl = (disease: string) => `https://platform.opentargets.org/disease/${disease}`;

/** Inline external link, underlined. */
function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="ulink" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** In-site "more" link to a fuller explanation. */
function More({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="more">
      {children} →
    </Link>
  );
}

/** A source citation under a record, rendered as a link when a URL is on file. */
function SourceCite({ text, url }: { text: string; url?: string }) {
  return url ? (
    <a className="ulink src" href={url} target="_blank" rel="noopener noreferrer">
      {text} ↗
    </a>
  ) : (
    <span className="src">{text}</span>
  );
}

/** Filled score pips (0-2 scale): one dot per point scored. */
function Pips({ n }: { n: number }) {
  const count = Math.max(0, Math.min(2, Math.round(n)));
  return (
    <span className="pips">
      {Array.from({ length: count }).map((_, i) => (
        <i key={i} />
      ))}
    </span>
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
    <ul className="src-list">
      {gradeRecords.map((cl, i) => {
        const label = studyLabel(cl.studyType);
        return (
          <li key={i}>
            <span className="chev" aria-hidden>›</span>
            <span>
              {cl.href ? (
                <a className="ulink" href={cl.href} target="_blank" rel="noopener noreferrer">{clipTitle(cl.text)}</a>
              ) : (
                <span style={{ color: "var(--ink)" }}>{clipTitle(cl.text)}</span>
              )}
              {cl.href ? <> <span className="ext">↗</span></> : null}
              <br />
              <span className={"tag" + (label === "Clinical guideline" ? " guideline" : "")}>
                {label}{cl.guidelineStrength ? ` · ${cl.guidelineStrength}${cl.guidelineCertainty ? `, ${cl.guidelineCertainty}` : ""}` : ""}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  ) : null;

  // Fuller MATRIX read for this pair: the raw treat-score and the entities scored.
  const md = c.matrixDetail;
  const matrixMapped = !!(md && (md.sourceId || md.mondo));
  let matrixForThisPair: React.ReactNode;
  if (c.matrixPercentile) {
    matrixForThisPair = `MATRIX places this pair at ${c.matrixPercentile}${
      md?.transformedScore != null
        ? `, with a treat-score of ${md.transformedScore.toFixed(2)} (higher is better; across the pairs we cover, scores span about 3.1 to 4.5)`
        : ""
    }.`;
  } else if (matrixMapped) {
    matrixForThisPair =
      "MATRIX maps this drug and disease in its graph but returned no treat-score for the pair, which can mean the predicted link fell below the model's publication threshold.";
  } else {
    matrixForThisPair = "MATRIX does not cover this pair.";
  }
  const matrixEntities =
    matrixMapped && md ? (
      <p className="note" style={{ marginTop: 12 }}>
        Scored over MATRIX&rsquo;s own entities, confirming the same drug and disease:{" "}
        {md.sourceId ? (
          <a className="ulink" href={chebiUrl(md.sourceId)} target="_blank" rel="noopener noreferrer">{md.sourceId}</a>
        ) : "drug"}{" "}(drug)
        {md.mondo ? (
          <>
            {" "}and{" "}
            <a className="ulink" href={mondoUrl(md.mondo)} target="_blank" rel="noopener noreferrer">{md.mondo}</a>{" "}(disease)
          </>
        ) : null}
        . Validate against the source:{" "}
        <a className="ulink" href={EVERYCURE} target="_blank" rel="noopener noreferrer">Every Cure&rsquo;s MATRIX dataset ↗</a>.
      </p>
    ) : null;

  // Knowledge-graph detail: cite each target connection back to Open Targets.
  const gd = c.graphDetail;
  const hasGraph = !!(c.graphViaTargets && c.graphViaTargets.length);
  let graphForThisPair: React.ReactNode;
  if (hasGraph && gd && gd.length) {
    const n = gd.length;
    graphForThisPair = `The drug acts on ${n} target${n === 1 ? "" : "s"} that Open Targets independently associates with the condition. Each connection, and its source on Open Targets:`;
  } else if (hasGraph) {
    graphForThisPair = `The graph connects this pair through ${c.graphViaTargets!.join(", ")}.`;
  } else {
    graphForThisPair = "No shared target is present, so the graph does not connect this pair.";
  }
  const graphTargets =
    hasGraph && gd && gd.length ? (
      <>
        <ul className="src-list">
          {gd.map((t, i) => (
            <li key={i}>
              <span className="chev" aria-hidden>›</span>
              <span>
                <a className="ulink" href={otTargetUrl(t.ensembl)} target="_blank" rel="noopener noreferrer">{t.symbol}</a>
                {t.approvedName ? <span style={{ color: "var(--muted)" }}> ({t.approvedName})</span> : null}
                {t.actionType ? `, drug acts as ${t.actionType.toLowerCase()}` : ""}
                {t.datatypes.length
                  ? `; associated via ${t.datatypes.join(", ")}${t.overallScore != null ? ` (Open Targets score ${t.overallScore.toFixed(2)})` : ""}`
                  : ""}
                {c.conditionOtId ? (
                  <>
                    {" "}
                    <a className="ulink" href={otEvidenceUrl(t.ensembl, c.conditionOtId)} target="_blank" rel="noopener noreferrer">evidence ↗</a>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        {c.conditionOtId ? (
          <p className="note" style={{ marginTop: 12 }}>
            Browse the condition&rsquo;s full target associations on{" "}
            <a className="ulink" href={otDiseaseUrl(c.conditionOtId)} target="_blank" rel="noopener noreferrer">Open Targets ↗</a>.
          </p>
        ) : null}
      </>
    ) : null;

  const sexCovered = !!(c.sexPk && c.sexPk.length > 0);
  const phaseCovered = !!(c.cyclePhase && c.cyclePhase.length > 0);
  const relColor =
    c.direction === "supports" ? "var(--signal)" : c.direction === "contradicts" ? "var(--brick)" : "var(--on-ink)";

  const notCovered: { title: string; body: string; href: string; more: string }[] = [];
  if (!sexCovered) {
    notCovered.push({
      title: "Sex-specific pharmacokinetics",
      body: "Not covered for this pair. This layer holds documented sex-specific pharmacokinetics for a limited set of drugs, and this compound is not among them yet. A blank here means the drug is not covered by the layer, not that no sex difference exists.",
      href: "/about/external-references#female-biology",
      more: "More on the sex-specific pharmacokinetics layer and its sources",
    });
  }
  if (!phaseCovered) {
    notCovered.push({
      title: "Cycle-phase dependence",
      body: "Not covered for this pair. The cycle-phase layer is seeded for the strongest-evidence cases so far (PMDD), and this pair is not among them yet. A blank here means the pair is not covered by the layer, not that the effect was found to be phase-independent.",
      href: "/about/external-references#female-biology",
      more: "More on the cycle-phase layer and its sources",
    });
  }

  return (
    <main className="sigdetail">
      {/* ── 1 · Verdict + scorecard ──────────────────────────────────────── */}
      <section className="surface-ink" style={{ paddingTop: 34, paddingBottom: 80 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/access/preview">Full index (preview)</Link>
            <span className="sep">/</span>
            <span className="here">{c.id}</span>
          </div>

          <div className="verdict-grid" style={{ marginTop: 18 }}>
            <div>
              <div className="id-line">{c.id} · {TIER_LABELS[c.tier]} evidence · {c.score}/10</div>
              <h1 className="signal-title">
                {c.drug}
                <span className="soft"> for </span>
                {c.condition}
              </h1>
              <p className="signal-summary">{c.rationale}</p>
              <div className="signal-meta">
                <span><b>Origin</b> · {c.origin}</span>
                <span><b>Pathway</b> · {c.pathway}</span>
                <span><b style={{ color: relColor }}>{REL_LABELS[c.direction]}</b></span>
              </div>
              <div className="frame-note">
                <span className="fl">How to read this</span>
                The summary above and the proposed mechanism are generated by the model from the sources it
                ingested, and are written as the model&rsquo;s reasoning rather than established fact. Any
                figures quoted from Open Targets or MATRIX are graph- or model-derived association scores, not
                clinical measurements. The literature grade in the independent readings below is the external
                check on how far the published record actually backs this pair.
              </div>
            </div>

            <aside className="scorecard">
              <div className="sc-head">
                <div>
                  <div className="sc-label">Our composite score</div>
                  <div className="sc-score" style={{ marginTop: 10 }}>{c.score}<small> / 10</small></div>
                </div>
                <div className="sc-tier"><span className="tdot" />{TIER_LABELS[c.tier]} tier</div>
              </div>
              {(c.dimBreakdown ?? []).map((d) => (
                <div className="sc-dim" key={d.key}>
                  <span className="sc-name">{d.label}</span>
                  <span className="sc-val"><Pips n={d.score} />{d.score} / 2 · {d.level}</span>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </section>

      {/* ── 2 · Hypothesized mechanism ───────────────────────────────────── */}
      <section className="surface-paper section tight">
        <div className="container">
          <p className="kicker">Hypothesized mechanism</p>
          <p className="prose-lg measure">{c.mechanism}</p>
          <p className="note" style={{ marginTop: 16 }}>
            This is the model&rsquo;s proposed mechanism from the sources on file, not a demonstrated causal
            pathway. Where the published record confirms it is tracked separately by the literature grade in
            the independent readings below.
          </p>
        </div>
      </section>

      {/* ── 3 · How the score was reached ────────────────────────────────── */}
      <section className="surface-bone section tight">
        <div className="container">
          <p className="kicker">How the score was reached, for this pair</p>
          <p className="prose-lg measure" style={{ marginBottom: 18 }}>
            The composite score is the sum of five dimensions, each scored 0 to 2 by the model from the
            evidence on file. Below is the sub-score this specific pair received on each, with what that
            dimension measures. It scored {c.score} of 10 overall, a {c.tier} reading
            {c.signalType ? `, from a ${c.signalType.replace(/_/g, " ")}` : ""}
            {c.evidenceStrength ? ` rated ${c.evidenceStrength} in strength` : ""}.
          </p>
          <p className="note">
            The model&rsquo;s overall reasoning for this pair is the summary at the top of the page, and
            the mechanism it proposed is in the section above.
          </p>

          <div className="rubric">
            {(c.dimBreakdown ?? []).map((d) => (
              <div className="r" key={d.key}>
                <div>
                  <p className="rk">{d.label}</p>
                  <p className="rd">{DIM_WHAT[d.key]}</p>
                </div>
                <span className="rv"><Pips n={d.score} />{d.score} / 2 · {d.level}</span>
              </div>
            ))}
          </div>

          <More href="/about/technical-architecture#how-evidence-is-scored">
            How the scoring rubric works, in general
          </More>
        </div>
      </section>

      {/* ── 4 · Independent readings ─────────────────────────────────────── */}
      <section className="surface-paper section tight">
        <div className="container">
          <p className="kicker">Independent readings, reported beside the score</p>
          <p className="prose-lg measure" style={{ marginBottom: 8 }}>
            Three outside checks are reported alongside the composite score. Each is recorded separately
            and is not combined into the score.
          </p>

          {/* Literature grade */}
          <div className="reading">
            <h3>Literature grade <span className="grade">{c.lGrade ?? "Not graded"}</span></h3>
            <p className="prose">
              How far the published record independently backs this pair, on a four-step scale that always
              traces to a source. L0 means no external record yet; L1, the pair appears in peer-reviewed
              literature; L2, a randomized trial or systematic review reports a result; L3, the pair is
              named in an active clinical guideline from a body such as <Ext href={ESHRE}>ESHRE</Ext>,{" "}
              <Ext href={ACOG_PMDD}>ACOG</Ext>, or <Ext href={COCHRANE}>Cochrane</Ext>. The grade is
              applied after scoring as an independent benchmark and is not an input to the composite score.
            </p>
            <p className="prose"><strong>For this pair.</strong> {litLead}</p>
            {litRecords}
            <More href="/about/technical-architecture#how-evidence-is-scored">
              Why the literature grade sits outside the score
            </More>
          </div>

          {/* MATRIX */}
          <div className="reading">
            <h3>MATRIX cross-reference {c.matrixPercentile ? <span className="grade">{c.matrixPercentile}</span> : null}</h3>
            <p className="prose">
              <Ext href={EVERYCURE}>Every Cure&rsquo;s</Ext> machine-learned treatment-probability model,
              drawn from a biomedical knowledge graph across roughly 1,800 drugs and 22,000 diseases. It
              provides a model-based estimate of how plausible a drug-disease link is given the structure of
              biomedical knowledge, reported alongside the direct evidence.
            </p>
            <p className="prose"><strong>For this pair.</strong> {matrixForThisPair}</p>
            {matrixEntities}
            <More href="/about/external-references#coverage-disclosure">
              More on the MATRIX cross-reference and its provenance
            </More>
          </div>

          {/* Knowledge graph */}
          <div className="reading">
            <h3>Knowledge graph <span className="grade">{hasGraph ? "supports" : "silent"}</span></h3>
            <p className="prose">
              A check, computed over <Ext href={OPENTARGETS}>Open Targets</Ext>, of whether the drug acts on
              a target that the graph independently associates with the condition. Absence of a connection
              means the graph has no relevant edge, not evidence against the pair; for these conditions it
              often reflects limited source coverage.
            </p>
            <p className="prose"><strong>For this pair.</strong> {graphForThisPair}</p>
            {graphTargets}
            <More href="/about/external-references#structured-grounding-in-progress">
              More on the knowledge-graph grounding
            </More>
          </div>
        </div>
      </section>

      {/* ── 5a · Sex-specific PK (covered) ───────────────────────────────── */}
      {sexCovered ? (
        <section className="surface-bone section tight">
          <div className="container">
            <p className="kicker">Sex-specific pharmacokinetics</p>
            <p className="prose-lg measure" style={{ marginBottom: 18 }}>
              Documented differences in how this drug is handled in women, drawn from a primary source, an
              FDA label or the curated sex-PK literature (<Ext href={ZUCKER}>Zucker and Prendergast 2020</Ext>;{" "}
              <Ext href={SOLDIN}>Soldin and Mattison 2009</Ext>). It is reported beside the signal and is not
              part of the composite score; it informs how a result should be interpreted.
            </p>
            <div className="reclist">
              {c.sexPk!.map((f, i) => (
                <div className="rec" key={i}>
                  <span className="rl">{f.parameter}</span>
                  {f.direction ? `, ${f.direction} in ${f.sex === "female" ? "women" : "men"}` : ` (${f.sex})`}
                  {f.magnitude ? `: ${f.magnitude}` : ""}
                  {f.source && <SourceCite text={f.source} url={f.sourceUrl} />}
                </div>
              ))}
            </div>
            <More href="/about/external-references#female-biology">
              More on the sex-specific pharmacokinetics layer and its sources
            </More>
          </div>
        </section>
      ) : null}

      {/* ── 5b · Cycle-phase dependence (covered) ────────────────────────── */}
      {phaseCovered ? (
        <section className="surface-paper section tight">
          <div className="container">
            <p className="kicker">Cycle-phase dependence</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              <p className="prose">
                <strong>Why it matters.</strong> Some treatments work differently depending on where someone
                is in the menstrual cycle, and for a cyclical condition like PMDD the timing can be the whole
                point. A drug that helps in the luteal phase, the roughly two weeks before menstruation, can
                look weaker than it is when its effect is averaged across the entire cycle.
              </p>
              <p className="prose">
                <strong>What tracking the phase adds.</strong> Holding the phase as structured data lets a
                luteal-phase result be read in its phase rather than averaged across the cycle, and records
                the dosing pattern, taking the drug only in the luteal phase, that a phase-blind record does
                not capture.
              </p>
              <p className="prose">
                <strong>What the literature says.</strong> For PMDD this is well established: intermittent
                luteal-phase SSRI dosing is an accepted first-line regimen (<Ext href={ACOG_PMDD}>ACOG 2023</Ext>),
                and it works within days, which is itself a clue that the drug acts through a faster route here
                than in depression. The standard outcome instrument for measuring it is the Daily Record of
                Severity of Problems (DRSP).
              </p>
            </div>
            <div className="reclist">
              {c.cyclePhase!.map((f, i) => (
                <div className="rec cross" key={i}>
                  <span className="rl">{f.cyclePhase} phase</span>
                  {f.dosingNote ? `: ${f.dosingNote}` : ""}
                  {f.source && <SourceCite text={f.source} url={f.sourceUrl} />}
                </div>
              ))}
            </div>
            <More href="/about/external-references#female-biology">
              More on the cycle-phase layer and its sources
            </More>
          </div>
        </section>
      ) : null}

      {/* ── 5c · Layers not covered ──────────────────────────────────────── */}
      {notCovered.length > 0 ? (
        <section className="surface-sage section tight">
          <div className="container">
            <p className="kicker">Layers not covered for this pair</p>
            <div className={"notcovered" + (notCovered.length === 1 ? " one" : "")}>
              {notCovered.map((n) => (
                <div className="nc" key={n.title}>
                  <div className="nh"><span>{n.title}</span><span className="stat">None on file</span></div>
                  <p>{n.body}</p>
                  <More href={n.href}>{n.more}</More>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 6 · Source evidence ──────────────────────────────────────────── */}
      <section className="surface-paper section tight">
        <div className="container">
          <p className="kicker">Source evidence · what the pipeline ingested</p>
          <p className="prose-lg measure">
            These are the sources the pipeline ingested to detect and score this signal, the published
            literature the model actually read, each tagged by study type. Where the model combined findings
            the claim is marked as a synthesis (S), and where the literature disagrees the contradiction is
            shown (!).
          </p>

          <ul className="ingest">
            {c.claims.map((cl, i) => {
              const label = studyLabel(cl.studyType);
              return (
                <li key={i}>
                  <span className={"num" + (cl.type === "contradict" ? " contradict" : "")}>
                    {cl.type === "synth" ? "S" : cl.type === "contradict" ? "!" : String(i + 1)}
                  </span>
                  <span>
                    <span className="title">{cl.text}</span>{" "}
                    <span className="ext">
                      {cl.href ? (
                        <a className="ulink" href={cl.href} target="_blank" rel="noopener noreferrer">{cl.src}</a>
                      ) : (
                        cl.src
                      )}
                      {cl.href ? " ↗" : ""}
                    </span>
                    {label ? (
                      <>
                        {" "}
                        <span className={"tag" + (cl.studyType && cl.studyType.toLowerCase().includes("guideline") ? " guideline" : "")}>
                          {label}{cl.guidelineStrength ? ` · ${cl.guidelineStrength}${cl.guidelineCertainty ? `, ${cl.guidelineCertainty}` : ""}` : ""}
                        </span>
                      </>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="note" style={{ marginTop: 30 }}>
            The literature grade above is read off these same ingested sources; the guideline or trial that
            earns it is one of the records listed here. MATRIX, sex-specific pharmacokinetics, and cycle phase
            are separate layers the pipeline does not ingest, external cross-references applied after scoring,
            and they link to their own sources in their sections above.
          </p>
          <More href="/about/external-references">
            The primary sources and pipelines this evidence is drawn from
          </More>

          <div className="backbar">
            <Link href="/access/preview" className="btn btn-ghost sm">
              <span className="arr">←</span> Back to the full index
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
