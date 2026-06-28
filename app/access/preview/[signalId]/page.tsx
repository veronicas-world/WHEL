import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidateBySignalId } from "@/lib/substrate-candidates";
import { toArmKey, ARM_LABELS } from "@/lib/arm-mapping";
import {
  supplyLabel, supplyGloss, relationshipLabel, relationshipGloss, formatDate,
} from "@/lib/regulatory-display";
import SideToc, { type TocItem } from "@/app/components/SideToc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public per-candidate breakdown: the full evidence trail for a signal,
// open and indexable so the scoring can be checked.
export const metadata: Metadata = {
  title: "Candidate breakdown",
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

const ARM3: Record<string, string> = {
  direct: "Direct research",
  pathway: "Pathway",
  community: "Community",
};
const MONO = "var(--font-plex-mono, ui-monospace, monospace)";

// Canonical sources for the explainers (the justifications), hyperlinked inline.
const EVERYCURE = "https://huggingface.co/datasets/everycure/matrix-scores";
const ACOG_PMDD = "https://www.acog.org/clinical/clinical-guidance/clinical-practice-guideline/articles/2023/12/management-of-premenstrual-disorders";
const ZUCKER = "https://doi.org/10.1186/s13293-020-00308-5";
const SOLDIN = "https://doi.org/10.2165/00003088-200948030-00001";
const ORANGE_BOOK = "https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files";
const DAILYMED = "https://dailymed.nlm.nih.gov/dailymed/";
const CT_GOV = "https://clinicaltrials.gov/";

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
  corroboration: "How many independent sources report the same effect. A higher score means the finding is replicated across multiple reports.",
  rigor: "The strength of the source types behind the signal, weighting registered trials and peer-reviewed work above community reports.",
  specificity: "How directly the evidence speaks to this exact drug and condition versus a related compound or a broader indication.",
  plausibility: "Whether a credible biological mechanism connects the drug to the condition, as opposed to an unexplained association.",
  consistency: "Whether the sources agree on the direction of the effect or point in conflicting directions.",
};

const chebiUrl = (id: string) => `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${encodeURIComponent(id)}`;
const mondoUrl = (id: string) => `https://monarchinitiative.org/${encodeURIComponent(id)}`;

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

  // The evidence arm (one of three pipelines) this signal was surfaced through.
  // The arm is a signal-level property; every source on the signal belongs to it.
  const armKey = c.signalType ? toArmKey(c.signalType) : null;
  const armLabel = armKey ? ARM_LABELS[armKey] : null;

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

  const sexCovered = !!(c.sexPk && c.sexPk.length > 0);
  const phaseCovered = !!(c.cyclePhase && c.cyclePhase.length > 0);

  // Regulatory & development-status layers (descriptive landscape context).
  const ind = c.indication;
  const ob = c.orangeBook;
  const ts = c.trialStatus && c.trialStatus.trial_count > 0 ? c.trialStatus : null;
  const regCovered = !!(ind || ob || ts);
  const trialActivityLabel = ts
    ? ts.activity === "active" ? "active trial(s)"
      : ts.activity === "completed" ? "completed"
      : ts.activity === "halted" ? "halted or terminated"
      : "status unclear"
    : "";
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

  // On-page table of contents — only the sections that actually render for this
  // candidate (several are conditional on coverage). Mirrors the section order.
  const hasMatrix = !!(c.matrixPercentile || matrixMapped);
  const tocItems: TocItem[] = [
    { id: "verdict", label: "Verdict & score" },
    { id: "mechanism", label: "Hypothesized mechanism" },
    { id: "scoring", label: "How the score was reached" },
    ...(hasMatrix ? [{ id: "independent", label: "Independent reading" }] : []),
    ...(regCovered ? [{ id: "regulatory", label: "Regulatory & status" }] : []),
    ...(sexCovered ? [{ id: "sex-pk", label: "Sex-specific PK" }] : []),
    ...(phaseCovered ? [{ id: "cycle-phase", label: "Cycle-phase dependence" }] : []),
    ...(notCovered.length > 0 ? [{ id: "not-covered", label: "Layers not covered" }] : []),
    { id: "sources", label: "Source evidence" },
  ];

  return (
    <main className="sigdetail">

      {/* ── Floating table of contents (wide screens only) ───────────────── */}
      <SideToc items={tocItems} heroId="verdict" />

      {/* ── 1 · Verdict + scorecard ──────────────────────────────────────── */}
      <section id="verdict" className="surface-ink" style={{ paddingTop: 34, paddingBottom: 80 }}>
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
                {armLabel && (
                  <span>
                    <b>Evidence arm</b> ·{" "}
                    <Link href="/signal-types" style={{ color: "var(--signal)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                      {armLabel}
                    </Link>
                  </span>
                )}
                <span><b style={{ color: relColor }}>{REL_LABELS[c.direction]}</b></span>
              </div>
              <div className="frame-note">
                <span className="fl">How to read this</span>
                The summary above and the proposed mechanism are generated by the model from the sources it
                ingested, and are written as the model&rsquo;s reasoning rather than established fact. Any
                figure quoted from MATRIX is a model-derived association score, not a clinical measurement.
                How far the published record backs this pair is carried by the score&rsquo;s own rigor
                dimension and traced to verbatim sources at the foot of the page.
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
      <section id="mechanism" className="surface-paper section tight" style={{ scrollMarginTop: 24 }}>
        <div className="container">
          <p className="kicker">Hypothesized mechanism</p>
          <p className="prose-lg measure">{c.mechanism}</p>
          <p className="note" style={{ marginTop: 16 }}>
            This is the model&rsquo;s proposed mechanism from the sources on file, not a demonstrated causal
            pathway. How well the published record supports it is reflected in the rigor and plausibility
            dimensions of the score, and traced to the verbatim sources at the foot of the page.
          </p>
        </div>
      </section>

      {/* ── 3 · How the score was reached ────────────────────────────────── */}
      <section id="scoring" className="surface-bone section tight" style={{ scrollMarginTop: 24 }}>
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

          {c.arms && c.arms.length ? (
            <div className="armbreak">
              {c.arms.map((arm) => (
                <div key={arm.arm} style={{ marginBottom: 30 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
                    borderBottom: "1px solid var(--rule)", paddingBottom: 9, marginBottom: 12,
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
                      {ARM3[arm.arm] ?? arm.arm} arm{arm.isAnchor ? " · anchors the headline" : ""}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: "var(--ink)", flexShrink: 0 }}>
                      {arm.armScore.toFixed(1)} / 10 · {TIER_LABELS[arm.tier]}
                    </span>
                  </div>
                  <p className="note" style={{ marginBottom: 14 }}>
                    <strong>Scored for women.</strong> {arm.female.rationale}
                    {arm.female.band ? ` (band ${arm.female.band}, ×${arm.female.multiplier.toFixed(2)})` : ""}.
                  </p>
                  <div className="rubric">
                    {arm.dimensions.map((d) => (
                      <div className="r" key={d.key}>
                        <div>
                          <p className="rk">{d.label}</p>
                          <p className="rd">{d.rationale || "No rationale recorded for this dimension."}</p>
                        </div>
                        <span className="rv"><Pips n={d.score} />{d.score} / 2</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}

          <More href="/about/technical-architecture#how-evidence-is-scored">
            How the scoring rubric works, in general
          </More>
        </div>
      </section>

      {/* ── 4 · Independent readings ─────────────────────────────────────── */}
      {hasMatrix ? (
        <section id="independent" className="surface-paper section tight" style={{ scrollMarginTop: 24 }}>
          <div className="container">
            <p className="kicker">Independent reading, reported beside the score</p>
            <p className="prose-lg measure" style={{ marginBottom: 8 }}>
              One outside model cross-reference is reported alongside the composite score. It is recorded
              separately and is not combined into the score.
            </p>

            {/* MATRIX */}
            <div className="reading">
              <h3>MATRIX cross-reference {c.matrixPercentile ? <span className="grade">{c.matrixPercentile}</span> : null}</h3>
              <p className="prose">
                <Ext href={EVERYCURE}>Every Cure&rsquo;s</Ext> machine-learned treatment-probability model,
                drawn from a biomedical knowledge graph across roughly 1,800 drugs and 22,000 diseases. It
                provides a model-based estimate of how plausible a drug-disease link is given the structure of
                biomedical knowledge, reported alongside the substrate&rsquo;s own evidence.
              </p>
              <p className="prose"><strong>For this pair.</strong> {matrixForThisPair}</p>
              {matrixEntities}
              <More href="/about/external-references#coverage-disclosure">
                More on the MATRIX cross-reference and its provenance
              </More>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 4b · Regulatory & development status ─────────────────────────── */}
      {regCovered ? (
        <section id="regulatory" className="surface-bone section tight" style={{ scrollMarginTop: 24 }}>
          <div className="container">
            <p className="kicker">Regulatory &amp; development status</p>
            <p className="prose-lg measure" style={{ marginBottom: 8 }}>
              Where this candidate sits in the US regulatory landscape: whether the drug is already
              FDA-approved for {c.condition.toLowerCase()} (on-label) or approved for something else
              (off-label), whether the molecule is available as a generic or a single-source brand still
              under patent, and how far it has been studied as a therapy for this condition. Each fact is
              drawn from a public US source and reported beside the score; none of it is folded into the
              score.
            </p>
            <p className="note" style={{ marginBottom: 22 }}>
              This is descriptive context, not regulatory advice. It maps the landscape a{" "}
              <Link href="/platform#evidence-markers" className="ulink">505(b)(2)</Link> route would build
              on (an already-approved active ingredient proposed for a new indication), but it is
              not a 505(b)(2) viability assessment, and says nothing about whether any particular development
              path is advisable. &ldquo;Approved&rdquo; means FDA-approved (US); approvals elsewhere are out of scope.
            </p>

            {/* Approved-indication relationship (DailyMed) */}
            {ind ? (
              <div className="reading">
                <h3>
                  Approval relationship{" "}
                  <span className="grade">{relationshipLabel(ind.label_relationship)}</span>
                </h3>
                <p className="prose">
                  Read from the drug&rsquo;s FDA label via <Ext href={DAILYMED}>DailyMed</Ext>, the US
                  National Library of Medicine&rsquo;s label repository. A label is only counted when it
                  carries an FDA-approved marketing category (an NDA, ANDA, or biologic BLA); dietary
                  supplements, homeopathics, and OTC-monograph products are not FDA-approved drugs and are
                  excluded.
                </p>
                <p className="prose"><strong>For this pair.</strong> {relationshipGloss(ind)}</p>
                {ind.approved_indication_excerpt ? (
                  <p className="note" style={{ marginTop: 12, fontStyle: "italic" }}>
                    From the label&rsquo;s Indications &amp; Usage section: &ldquo;{ind.approved_indication_excerpt}&rdquo;
                    {ind.label_title ? `, ${ind.label_title}` : ""}
                    {ind.label_url ? <> · <Ext href={ind.label_url}>view label ↗</Ext></> : null}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Generic & patent supply (Orange Book) */}
            {ob ? (
              <div className="reading">
                <h3>
                  Generic &amp; patent supply <span className="grade">{supplyLabel(ob.supply)}</span>
                </h3>
                <p className="prose">
                  Read from the <Ext href={ORANGE_BOOK}>FDA Orange Book</Ext> (Approved Drug Products with
                  Therapeutic Equivalence Evaluations), using single-ingredient products only so that patents
                  on novel branded combination formulations are never attributed to the base molecule.
                </p>
                <p className="prose"><strong>For this molecule.</strong> {supplyGloss(ob)}</p>
                {ob.latest_patent_expiry && !ob.generic_available ? (
                  <p className="note" style={{ marginTop: 10 }}>
                    Latest listed Orange Book patent expiry: {formatDate(ob.latest_patent_expiry)}. Patent
                    listings can change and do not by themselves determine when a generic may launch.
                  </p>
                ) : null}
                {ob.products_sampled && ob.products_sampled.length ? (
                  <div className="reclist" style={{ marginTop: 14 }}>
                    {ob.products_sampled.slice(0, 5).map((p, i) => (
                      <div className="rec" key={i}>
                        <span className="rl">{p.trade_name}</span>
                        {` · ${p.appl_type} · ${p.strength}`}
                        {p.status ? ` · ${p.status.toLowerCase()}` : ""}
                        {p.approval_date ? ` · approved ${p.approval_date}` : ""}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Clinical-trial stage (ClinicalTrials.gov) */}
            {ts ? (
              <div className="reading">
                <h3>
                  Clinical-trial stage, for this condition{" "}
                  <span className="grade">{ts.highest_phase_label ?? "studied"}</span>
                </h3>
                <p className="prose">
                  Read from <Ext href={CT_GOV}>ClinicalTrials.gov</Ext> (US National Library of Medicine).
                  A trial only counts when the drug appears as an experimental or active-comparator
                  intervention in an interventional study of this condition; mechanistic, drug-interaction,
                  post-marketing (Phase 4), and comparator-background uses are excluded, so this reflects the
                  drug being tested <em>as a therapy</em> for {c.condition.toLowerCase()}.
                </p>
                <p className="prose">
                  <strong>For this pair.</strong> Studied in {ts.trial_count} qualifying interventional
                  trial{ts.trial_count === 1 ? "" : "s"} · highest stage reached{" "}
                  {ts.highest_phase_label ?? "no phase listed"} · {trialActivityLabel}.
                </p>
                <div className="reclist" style={{ marginTop: 14 }}>
                  {ts.top_trials.map((t) => (
                    <div className="rec" key={t.nctId}>
                      <a className="ulink" href={t.url} target="_blank" rel="noopener noreferrer">{t.nctId} ↗</a>
                      {t.phase ? ` · ${t.phase.replace(/_/g, " ").replace(/PHASE/i, "Phase ")}` : ""}
                      {` · ${t.status.replace(/_/g, " ").toLowerCase()}`}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <More href="/about/external-references#underlying-data">
              The regulatory and trial sources this status is drawn from
            </More>
          </div>
        </section>
      ) : null}

      {/* ── 5a · Sex-specific PK (covered) ───────────────────────────────── */}
      {sexCovered ? (
        <section id="sex-pk" className="surface-bone section tight" style={{ scrollMarginTop: 24 }}>
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
        <section id="cycle-phase" className="surface-paper section tight" style={{ scrollMarginTop: 24 }}>
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
        <section id="not-covered" className="surface-sage section tight" style={{ scrollMarginTop: 24 }}>
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
      <section id="sources" className="surface-paper section tight" style={{ scrollMarginTop: 24 }}>
        <div className="container">
          <p className="kicker">Source evidence · what the pipeline ingested</p>
          <p className="prose-lg measure">
            These are the sources the pipeline ingested to detect and score this signal, the published
            literature the model actually read, each tagged by study type. Where the model combined findings
            the claim is marked as a synthesis (S), and where the literature disagrees the contradiction is
            shown (!).
          </p>
          {armLabel && (
            <p className="note" style={{ marginTop: 12 }}>
              Every source below belongs to this signal&rsquo;s evidence arm,{" "}
              <Link href="/signal-types" className="ulink">{armLabel}</Link>. Whel reads each
              drug-condition pair through four such arms, each held to its own inclusion bar; a signal
              is surfaced through one of them.
            </p>
          )}

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
            These are the verbatim sources the pipeline surfaced and read; they may not be the full published
            record for a pair, and the score reflects the strength and agreement of the evidence rather than
            its volume. The strength of these source types is what the rigor dimension of the score reads off.
            MATRIX, sex-specific pharmacokinetics, and cycle phase are separate layers the pipeline does not
            ingest, external cross-references reported beside the score, and they link to their own sources in
            their sections above.
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
