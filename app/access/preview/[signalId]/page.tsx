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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow" style={{ marginBottom: 12 }}>
      {children}
    </div>
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
        </div>
      </section>

      {/* ── Independent readings ─────────────────────────────────────────── */}
      <section className="surface-paper section tight">
        <div className="container" style={{ maxWidth: "74ch" }}>
          <SectionLabel>Independent readings, shown beside our grade</SectionLabel>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", marginBottom: 22 }}>
            Three outside checks sit next to our own score. We keep them separate rather than blending
            them into one number, so you can see where confidence comes from.
          </p>

          <ReadingBlock
            heading={`Literature grade${c.lGrade ? ` · ${c.lGrade}` : ""}`}
            whatItIs="How far the published record independently backs this pair, on a four-step scale that always traces to a source. L0 means no external record yet; L1, the pair appears in peer-reviewed literature; L2, a randomized trial or systematic review reports a result; L3, the pair is named in an active clinical guideline from a body such as ESHRE, ACOG, or Cochrane."
            forThisPair={
              c.lGrade
                ? `This pair is graded ${c.lGrade}. The grade rises only as far as the attached sources support, which you can check in the provenance trail below.`
                : "This pair is not graded yet; no external record is on file for it."
            }
          />

          <ReadingBlock
            heading={`MATRIX cross-reference${c.matrixPercentile ? ` · ${c.matrixPercentile}` : ""}`}
            whatItIs="Every Cure's machine-learned treatment-probability model, drawn from a biomedical knowledge graph across roughly 1,800 drugs and 22,000 diseases. It estimates how plausible a drug-disease link looks given the structure of biomedical knowledge, a model's prior rather than the evidence on the ground."
            forThisPair={
              c.matrixPercentile
                ? `MATRIX places this pair at ${c.matrixPercentile}. We show that beside our grade rather than folding it in.`
                : "MATRIX has no score for this pair, so there is nothing to show here."
            }
          />

          <ReadingBlock
            heading={`Knowledge graph · ${c.graphViaTargets && c.graphViaTargets.length ? "supports" : "silent"}`}
            whatItIs="A check, computed over Open Targets, of whether the drug acts on a target that the graph independently associates with the condition. A silence is not a contradiction; it means the graph has no relevant edge, which for these conditions is often a real gap rather than a verdict."
            forThisPair={
              c.graphViaTargets && c.graphViaTargets.length
                ? `The graph supports this link, through ${c.graphViaTargets.join(", ")}.`
                : "The graph is silent on this pair: no shared target is present. We surface the silence rather than hide it."
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
              How this drug behaves differently in women, the part general databases average away. Each
              fact is tied to its source. It is shown beside the signal, not folded into the grade,
              because it changes how a result should be read rather than how strong the evidence is.
            </p>
            {c.sexPk.map((f, i) => (
              <div key={i} style={{ borderLeft: "2px solid var(--brick)", padding: "10px 0 10px 14px", marginBottom: 12, fontSize: 14.5, lineHeight: 1.65, color: "var(--body)" }}>
                <span style={{ color: "var(--ink)", fontWeight: 500, textTransform: "capitalize" }}>{f.parameter}</span>
                {f.direction ? `, ${f.direction} in ${f.sex === "female" ? "women" : "men"}` : ` (${f.sex})`}
                {f.magnitude ? `: ${f.magnitude}` : ""}
                {f.source && <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{f.source}</span>}
              </div>
            ))}
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
                <strong style={{ color: "var(--ink)" }}>What holding the phase buys.</strong>{" "}Keeping the
                phase as structured data lets the platform read a luteal-phase result in its phase rather
                than flattening it, and it surfaces a real dosing strategy, taking the drug only when it is
                needed, that a phase-blind database would miss.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>What the literature says.</strong>{" "}For PMDD this
                is well established: intermittent luteal-phase SSRI dosing is an accepted first-line regimen
                (ACOG 2023), and it works within days, which is itself a clue that the drug acts through a
                faster route here than in depression. The standard outcome instrument for measuring it is
                the Daily Record of Severity of Problems (DRSP).
              </p>
            </div>
            {c.cyclePhase.map((f, i) => (
              <div key={i} style={{ borderLeft: "2px solid var(--arm-cross)", padding: "10px 0 10px 14px", marginBottom: 12, fontSize: 14.5, lineHeight: 1.65, color: "var(--body)" }}>
                <span style={{ color: "var(--ink)", fontWeight: 500, textTransform: "capitalize" }}>{f.cyclePhase} phase</span>
                {f.dosingNote ? `: ${f.dosingNote}` : ""}
                {f.source && <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{f.source}</span>}
              </div>
            ))}
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

          <div style={{ borderTop: "1px solid var(--rule)", marginTop: 32, paddingTop: 24 }}>
            <Link href="/access/preview" className="btn btn-ghost sm">
              <span className="arr">←</span> Back to the full index
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ReadingBlock({ heading, whatItIs, forThisPair }: { heading: string; whatItIs: string; forThisPair: string }) {
  return (
    <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 18, marginTop: 18 }}>
      <div className="font-heading" style={{ fontSize: 17, color: "var(--ink)", marginBottom: 8 }}>{heading}</div>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--body)", margin: "0 0 8px" }}>{whatItIs}</p>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-2)", margin: 0 }}>
        <strong style={{ color: "var(--ink)" }}>For this pair.</strong> {forThisPair}
      </p>
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
