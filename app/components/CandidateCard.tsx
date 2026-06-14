"use client";

import { useState } from "react";
import Link from "next/link";

export interface Claim {
  type: "extract" | "synth" | "contradict";
  text: string;
  src: string;
  /** Direct link to the source (PubMed, ClinicalTrials.gov, Reddit, etc.), when available. */
  href?: string;
  /** Source study type (guideline, rct, systematic_review, expert_opinion, etc.), for the grade tag. */
  studyType?: string;
  /** For curated guideline sources: the recommendation strength and certainty that drive an L3 grade. */
  guidelineStrength?: string;
  guidelineCertainty?: string;
}

export interface Candidate {
  id: string;
  /** Underlying repurposing_signals id; the stable key for the per-signal detail page. */
  signalId?: string;
  drug: string;
  condition: string;
  conditionId?: string;
  tier: "strong" | "moderate" | "emerging" | "exploratory";
  score: number;
  origin: string;
  pathway: string;
  direction: "supports" | "contradicts" | "silent";
  rationale: string;
  mechanism: string;
  dims: Record<string, string>;
  /** The five rubric dimensions with their actual 0-2 sub-scores, for the score breakdown. */
  dimBreakdown?: { key: string; label: string; score: number; level: string }[];
  /** The signal's type (e.g. clinical_trial_finding) and qualitative evidence strength. */
  signalType?: string;
  evidenceStrength?: string;
  claims: Claim[];
  /** External-validation grade for the drug-condition pair (L0–L3), when present. */
  lGrade?: "L0" | "L1" | "L2" | "L3";
  /** Every Cure MATRIX cross-reference percentile, e.g. "Top 12%", when MATRIX covers the pair. */
  matrixPercentile?: string;
  /** Fuller MATRIX detail: the raw treat-score and the drug/disease entities MATRIX scored. */
  matrixDetail?: { transformedScore?: number; sourceId?: string; mondo?: string };
  /**
   * Knowledge-graph (Path B) disclosure: the shared target(s) through which the
   * graph independently connects this drug to this condition. Present and
   * non-empty => "graph supports, via <target>"; absent => "graph silent".
   */
  graphViaTargets?: string[];
  /**
   * Sex-aware layer (migration 058): documented sex-specific pharmacokinetic
   * facts for this compound, each carrying its source. Present => a "Sex-PK"
   * marker and a detail block in the evidence trail.
   */
  sexPk?: { parameter: string; sex: string; direction?: string; magnitude?: string; source?: string; sourceUrl?: string; note?: string }[];
  /**
   * Cyclical-phase layer (migration 060): documented treatment-level cycle-phase
   * dependence for this drug-condition pair, each carrying its source. Present =>
   * a "Phase" marker and a detail block in the evidence trail.
   */
  cyclePhase?: { cyclePhase: string; pattern?: string; dosingNote?: string; source?: string; sourceUrl?: string }[];
}

const L_FILL: Record<NonNullable<Candidate["lGrade"]>, string> = {
  L0: "var(--lgrade-l0)",
  L1: "var(--lgrade-l1)",
  L2: "var(--lgrade-l2)",
  L3: "var(--lgrade-l3)",
};

/** "via ESR1", "via AR + PGR", "via ESR1 + 2 more" — keeps the chip compact. */
function formatViaTargets(targets: string[]): string {
  if (targets.length === 1) return `via ${targets[0]}`;
  if (targets.length === 2) return `via ${targets[0]} + ${targets[1]}`;
  return `via ${targets[0]} + ${targets.length - 1} more`;
}

/** A source citation that becomes a link when a URL is on file. */
function SourceLine({ text, url }: { text: string; url?: string }) {
  const style: React.CSSProperties = { display: "block", fontSize: 11.5, marginTop: 3 };
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...style, color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 }}>
        {text} ↗
      </a>
    );
  }
  return <span style={{ ...style, color: "var(--muted)" }}>{text}</span>;
}

function MarkerChip({ dot, label }: { dot: string; label: string }) {
  return (
    <Link
      href="/platform#evidence-markers"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
        fontSize: 10.5,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "var(--ink)",
        textDecoration: "none",
        border: "1px solid var(--rule, rgba(26,29,20,0.18))",
        padding: "3px 8px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, background: dot, display: "inline-block", flexShrink: 0 }} />
      {label}
    </Link>
  );
}

function TierBadge({ tier }: { tier: Candidate["tier"] }) {
  const labels = { strong: "Strong", moderate: "Moderate", emerging: "Emerging", exploratory: "Exploratory" };
  return (
    <span className={`tier-badge ${tier}`}>
      <span className="tdot" />
      {labels[tier]}
    </span>
  );
}

function RelBadge({ rel }: { rel: Candidate["direction"] }) {
  const labels = { supports: "Supports", contradicts: "Contradiction", silent: "Evidence silent" };
  return <span className={`rel-badge ${rel}`}>{labels[rel]}</span>;
}

function Readout({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <span className="readout">
      <span>Composite</span>
      <span className="track"><span className="fill" style={{ width: (score / max * 100) + "%" }} /></span>
      <span className="n">{score}/{max}</span>
    </span>
  );
}

export default function CandidateCard({
  c,
  defaultOpen = false,
}: {
  c: Candidate;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="candidate">
      <div className="c-top">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span className="eyebrow">{c.id}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {c.lGrade && <MarkerChip dot={L_FILL[c.lGrade]} label={`Lit · ${c.lGrade}`} />}
            {c.matrixPercentile && <MarkerChip dot="var(--green-deep)" label={`Matrix · ${c.matrixPercentile}`} />}
            {c.graphViaTargets && c.graphViaTargets.length > 0 && (
              <MarkerChip dot="var(--moss)" label={`Graph · ${formatViaTargets(c.graphViaTargets)}`} />
            )}
            {c.sexPk && c.sexPk.length > 0 && (
              <MarkerChip dot="var(--brick)" label="Sex-PK" />
            )}
            {c.cyclePhase && c.cyclePhase.length > 0 && (
              <MarkerChip dot="var(--arm-cross)" label={`Phase · ${c.cyclePhase[0].cyclePhase}`} />
            )}
            <RelBadge rel={c.direction} />
            <TierBadge tier={c.tier} />
          </div>
        </div>
        <div className="c-route">
          <span className="c-drug">{c.drug}</span>
          <span className="c-arrow">→</span>
          <span className="c-cond">{c.condition}</span>
        </div>
        <span className="c-origin">Origin · {c.origin}</span>
        <p className="c-rationale">{c.rationale}</p>
        <div className="c-meta">
          <Readout score={c.score} />
          <span className="m"><b>Pathway</b> · {c.pathway}</span>
          <span className="m"><b>Claims</b> · {c.claims.length}</span>
        </div>
      </div>

      {open && (
        <>
          <div style={{ padding: "0 var(--card-pad) var(--card-pad)" }}>
            <div className="eyebrow" style={{ margin: "6px 0 8px" }}>Hypothesized mechanism</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--body)", maxWidth: "72ch", margin: 0 }}>
              {c.mechanism}
            </p>
          </div>
          <div className="dims">
            {Object.entries(c.dims).map(([k, v]) => (
              <div key={k} className="d">
                <div className="k">{k}</div>
                <div className="v">{v}</div>
              </div>
            ))}
          </div>
          {c.sexPk && c.sexPk.length > 0 && (
            <div style={{ padding: "0 var(--card-pad) var(--card-pad)" }}>
              <div className="eyebrow" style={{ margin: "6px 0 8px" }}>
                Sex-specific pharmacokinetics
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--muted)", maxWidth: "72ch", margin: "0 0 10px" }}>
                Documented sex differences in how this drug behaves in the body, held as
                first-class data rather than averaged away. Shown beside the signal, not folded
                into its grade.
              </p>
              {c.sexPk.map((f, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: "2px solid var(--brick)",
                    padding: "8px 0 8px 12px",
                    marginBottom: 8,
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: "var(--body)",
                  }}
                >
                  <span style={{ color: "var(--ink)", fontWeight: 500, textTransform: "capitalize" }}>
                    {f.parameter}
                  </span>
                  {f.direction ? `, ${f.direction} in ${f.sex === "female" ? "women" : "men"}` : ` (${f.sex})`}
                  {f.magnitude ? `: ${f.magnitude}` : ""}
                  {f.source && <SourceLine text={f.source} url={f.sourceUrl} />}
                </div>
              ))}
            </div>
          )}
          {c.cyclePhase && c.cyclePhase.length > 0 && (
            <div style={{ padding: "0 var(--card-pad) var(--card-pad)" }}>
              <div className="eyebrow" style={{ margin: "6px 0 8px" }}>
                Cycle-phase dependence
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--muted)", maxWidth: "72ch", margin: "0 0 10px" }}>
                Documented dependence of this treatment on the menstrual-cycle phase, held as
                first-class data rather than averaged into a phase-less number. Shown beside the
                signal, not folded into its grade.
              </p>
              {c.cyclePhase.map((f, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: "2px solid var(--arm-cross)",
                    padding: "8px 0 8px 12px",
                    marginBottom: 8,
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: "var(--body)",
                  }}
                >
                  <span style={{ color: "var(--ink)", fontWeight: 500, textTransform: "capitalize" }}>
                    {f.cyclePhase} phase
                  </span>
                  {f.dosingNote ? `: ${f.dosingNote}` : ""}
                  {f.source && <SourceLine text={f.source} url={f.sourceUrl} />}
                </div>
              ))}
            </div>
          )}
          <div className="provenance">
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              Per-claim provenance · synthesis marked · contradictions surfaced
            </div>
            {c.claims.map((cl, i) => (
              <div
                key={i}
                className={`prov-claim ${cl.type === "synth" ? "synth" : ""} ${cl.type === "contradict" ? "contradict" : ""}`}
              >
                <span className="tok">
                  {cl.type === "synth" ? "S" : cl.type === "contradict" ? "!" : String(i + 1)}
                </span>
                <span>
                  {cl.type === "synth" && <span className="synth-flag">Synthesis</span>}
                  {cl.type === "contradict" && (
                    <span className="synth-flag" style={{ color: "var(--brick)", borderColor: "var(--brick)" }}>
                      Contradiction
                    </span>
                  )}
                  {" "}{cl.text}
                  {cl.href ? (
                    <a
                      className="src"
                      href={cl.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline", textUnderlineOffset: 2 }}
                    >
                      {cl.src} ↗
                    </a>
                  ) : (
                    <span className="src">{cl.src}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="c-foot">
        <span className="id">{c.condition} · indexed signal</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {c.signalId && (
            <Link href={`/access/preview/${c.signalId}`} className="btn btn-ghost sm">
              Full breakdown <span className="arr">→</span>
            </Link>
          )}
          <button className="btn btn-ghost sm" onClick={() => setOpen(!open)}>
            {open ? "Collapse" : "Open evidence trail"}
            <span className="arr">{open ? "↑" : "↓"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
