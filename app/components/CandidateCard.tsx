"use client";

import { useState } from "react";
import Link from "next/link";

export interface Claim {
  type: "extract" | "synth" | "contradict";
  text: string;
  src: string;
}

export interface Candidate {
  id: string;
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
  claims: Claim[];
  /** External-validation grade for the drug-condition pair (L0–L3), when present. */
  lGrade?: "L0" | "L1" | "L2" | "L3";
  /** Every Cure MATRIX cross-reference percentile, e.g. "Top 12%", when MATRIX covers the pair. */
  matrixPercentile?: string;
}

const L_FILL: Record<NonNullable<Candidate["lGrade"]>, string> = {
  L0: "var(--lgrade-l0)",
  L1: "var(--lgrade-l1)",
  L2: "var(--lgrade-l2)",
  L3: "var(--lgrade-l3)",
};

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
                  <span className="src">{cl.src}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="c-foot">
        <span className="id">{c.condition} · indexed signal</span>
        <button className="btn btn-ghost sm" onClick={() => setOpen(!open)}>
          {open ? "Collapse" : "Open evidence trail"}
          <span className="arr">{open ? "↑" : "↓"}</span>
        </button>
      </div>
    </article>
  );
}
