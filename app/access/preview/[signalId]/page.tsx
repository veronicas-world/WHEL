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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow" style={{ marginBottom: 12 }}>
      {children}
    </div>
  );
}

const LINK: React.CSSProperties = { color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 };

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

  // Consolidated citation list: the data-flag sources (sex-PK, cycle-phase) and
  // the evidence sources (provenance claims), deduped, with links where on file.
  const citations: { text: string; url?: string }[] = [];
  const seenCite = new Set<string>();
  const addCite = (text?: string, url?: string) => {
    const key = (text ?? "").trim();
    if (!key || seenCite.has(key)) return;
    seenCite.add(key);
    citations.push({ text: key, url });
  };
  (c.sexPk ?? []).forEach((f) => addCite(f.source, f.sourceUrl));
  (c.cyclePhase ?? []).forEach((f) => addCite(f.source, f.sourceUrl));
  (c.claims ?? []).forEach((cl) => addCite(cl.src, cl.href));

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
          <SectionLabel>How the score was reached</SectionLabel>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", maxWidth: "72ch", marginBottom: 18 }}>
            The composite score is our own reading, kept separate from the independent cross-references
            below. Each signal is graded on the dimensions the rubric measures, replication, source
            quality, specificity, and biological plausibility, which combine into a score out of ten and
            place the candidate in one of four tiers. This pair scored {c.score} of 10, a{" "}
            {c.tier} reading.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ maxWidth: "72ch" }}>
            {Object.entries(c.dims).map(([k, v]) => (
              <div key={k} style={{ background: "var(--paper)", border: "1px solid var(--rule)", padding: "16px 16px 18px" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>{k}</div>
                <div className="font-heading" style={{ fontSize: 17, color: "var(--ink)" }}>{v}</div>
              </div>
            ))}
          </div>
          <LearnMore href="/about/technical-architecture#how-evidence-is-scored">
            How the score is decided, in depth
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
            forThisPair={
              c.lGrade
                ? `This pair is graded ${c.lGrade}. The grade rises only as far as the attached sources support, which can be checked in the provenance trail below.`
                : "This pair is not graded yet; no external record is on file for it."
            }
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
            forThisPair={
              c.matrixPercentile
                ? `MATRIX places this pair at ${c.matrixPercentile}.`
                : "MATRIX has no score for this pair."
            }
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
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Sources & citations ──────────────────────────────────────────── */}
      <section className="surface-bone section tight">
        <div className="container" style={{ maxWidth: "76ch" }}>
          <SectionLabel>Sources and citations</SectionLabel>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--body)", marginBottom: 16 }}>
            Every source this signal draws on, both the literature behind the flag and the references
            behind each justification above. Where a link is on file, it goes straight to the primary
            source.
          </p>
          {citations.length > 0 ? (
            <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {citations.map((s, i) => (
                <li key={i} style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--body)" }}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={LINK}>{s.text} ↗</a>
                  ) : (
                    s.text
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ fontSize: 13.5, color: "var(--muted)" }}>No itemized sources on file for this signal yet.</p>
          )}

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

function ReadingBlock({ heading, whatItIs, forThisPair, learnMore }: { heading: string; whatItIs: React.ReactNode; forThisPair: string; learnMore?: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 18, marginTop: 18 }}>
      <div className="font-heading" style={{ fontSize: 17, color: "var(--ink)", marginBottom: 8 }}>{heading}</div>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--body)", margin: "0 0 8px" }}>{whatItIs}</p>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-2)", margin: 0 }}>
        <strong style={{ color: "var(--ink)" }}>For this pair.</strong> {forThisPair}
      </p>
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
