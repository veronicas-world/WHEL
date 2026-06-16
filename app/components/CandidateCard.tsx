import Link from "next/link";
import { toArmKey, ARM_LABELS } from "@/lib/arm-mapping";

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
  /** Per-target detail behind the graph-supports disclosure, for citing each connection to Open Targets. */
  graphDetail?: { symbol: string; ensembl: string; approvedName?: string; actionType?: string; datatypes: string[]; overallScore?: number }[];
  /** Open Targets disease id (EFO/MONDO, underscore form) for linking the graph evidence to its source. */
  conditionOtId?: string;
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

  // ── Substrate fields (the new arm-aware engine; optional so legacy consumers
  //    are unaffected until the cutover wires them in) ───────────────────────
  /**
   * Honesty stamp derived per pair at read time (SCORING_SPEC §6):
   *  - "clinical"           = a non-trivial Direct arm anchors the pair
   *  - "unvalidated_signal" = no/thin Direct, but other arms converge (surfaced, hedged)
   *  - "preliminary"        = a single weak arm
   */
  validationStatus?: "clinical" | "unvalidated_signal" | "preliminary";
  /** Anchor arm's female-applicability discount — Whel's first-class differentiator. */
  femaleApplicability?: { band: string; multiplier: number; rationale: string };
  /** Per-arm efficacy/mechanistic readings of this pair (Direct / Pathway / Community), never blended. */
  arms?: SubstrateArm[];
  /** Separate safety/tolerability readings (aspect='safety'), never blended into the headline. */
  safetyArms?: SubstrateArm[];
}

/** One evidence arm's scored reading of a pair, from substrate_signals. */
export interface SubstrateArm {
  arm: "direct" | "pathway" | "community";
  /** 'efficacy' | 'safety' | 'other' (mechanistic) — efficacy/other drive the headline; safety is separate. */
  aspect: string;
  /** arm_score = strength × female multiplier, 0–10. */
  armScore: number;
  /** Pre-multiplier sum of the five dimensions, 0–10. */
  strength: number;
  tier: "strong" | "moderate" | "emerging" | "exploratory";
  /** True for the arm that anchors the pair headline. */
  isAnchor: boolean;
  /** The five arm-aware dimensions with their 0–2 scores and rationales. */
  dimensions: { key: string; label: string; score: number; rationale: string }[];
  female: { band: string; multiplier: number; rationale: string };
  synthesis?: string;
  mechanism?: string;
  precisionNote?: string;
  needsFulltext: boolean;
  contradictionFlag: boolean;
  numContradictions: number;
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
  const labels = { strong: "Strong tier", moderate: "Moderate tier", emerging: "Emerging tier", exploratory: "Exploratory tier" };
  return (
    <span className={`tier-badge ${tier}`}>
      <span className="tdot" />
      {labels[tier]}
    </span>
  );
}

function RelBadge({ rel }: { rel: Candidate["direction"] }) {
  const labels = { supports: "Evidence supports", contradicts: "Contradiction present", silent: "Evidence silent" };
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

// ── Substrate UI pieces ──────────────────────────────────────────────────────

const ARM_META: Record<"direct" | "pathway" | "community", { label: string; color: string }> = {
  direct: { label: "Direct", color: "var(--arm-direct)" },
  pathway: { label: "Pathway", color: "var(--arm-pathway)" },
  community: { label: "Community", color: "var(--arm-community)" },
};

const VALIDATION_META: Record<NonNullable<Candidate["validationStatus"]>, { label: string; note: string; fill: string }> = {
  clinical: { label: "Clinically anchored", note: "Direct clinical evidence anchors this signal.", fill: "var(--arm-direct)" },
  unvalidated_signal: { label: "Unvalidated signal", note: "Hypothesis / patient-reported — not clinically validated.", fill: "var(--arm-pathway)" },
  preliminary: { label: "Preliminary", note: "A single, early signal. Lowest confidence.", fill: "var(--lgrade-l0)" },
};

/** Plain-language reading of each female-applicability band (F1–F6). */
const FEMALE_BAND_TEXT: Record<string, string> = {
  F1: "Evidence generated in women",
  F2: "Sex-equivalence shown",
  F3: "Represented, not sex-analyzed",
  F4: "Applicability to women unconfirmed",
  F5: "Male-derived evidence",
  F6: "Known sex difference — flagged",
};

function ValidationStamp({ status }: { status: NonNullable<Candidate["validationStatus"]> }) {
  const m = VALIDATION_META[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 10.5,
      letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--paper)",
      background: m.fill, padding: "3px 9px", whiteSpace: "nowrap",
    }}>
      {m.label}
    </span>
  );
}

/**
 * The female-applicability lens — Whel's signature element, front and center.
 * A full-width strip stating, in plain language, how much the evidence was
 * generated in women and the discount that follows from it.
 */
function FemaleLens({ fa }: { fa: NonNullable<Candidate["femaleApplicability"]> }) {
  const full = fa.multiplier >= 1.0;
  const accent = full ? "var(--arm-direct)" : "var(--brick)";
  return (
    <div style={{
      display: "flex", alignItems: "stretch", gap: 12, margin: "12px 0",
      border: "1px solid var(--rule)", borderLeft: `4px solid ${accent}`,
      background: "rgba(127,61,46,0.04)", padding: "10px 14px",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 10.5,
          letterSpacing: "0.08em", textTransform: "uppercase", color: accent, fontWeight: 600,
        }}>
          Scored for women
        </div>
        <div style={{ fontSize: 14, color: "var(--ink)", marginTop: 3, lineHeight: 1.35 }}>
          <b>{FEMALE_BAND_TEXT[fa.band] ?? "Applicability uncertain"}</b>
          {fa.rationale ? <span style={{ opacity: 0.78 }}> — {fa.rationale}</span> : null}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", flexShrink: 0 }}>
        <div style={{
          fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 20,
          fontWeight: 700, color: accent, lineHeight: 1,
        }}>
          ×{fa.multiplier.toFixed(2)}
        </div>
        <div style={{ fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink)", opacity: 0.55, marginTop: 3 }}>
          {fa.band} multiplier
        </div>
      </div>
    </div>
  );
}

/** Per-arm strength bars (Direct / Pathway / Community), the anchor marked. */
function ArmStrengths({ arms }: { arms: NonNullable<Candidate["arms"]> }) {
  const order = ["direct", "pathway", "community"] as const;
  const sorted = [...arms].sort((a, b) => order.indexOf(a.arm) - order.indexOf(b.arm));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "10px 0 2px" }}>
      {sorted.map((a) => {
        const meta = ARM_META[a.arm];
        return (
          <div key={a.arm} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 74, flexShrink: 0, fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
              fontSize: 11, color: meta.color, fontWeight: a.isAnchor ? 700 : 500,
            }}>
              {meta.label}{a.isAnchor ? " ◂" : ""}
            </span>
            <span style={{ flex: 1, height: 6, background: "rgba(20,24,15,0.08)", position: "relative" }}>
              <span style={{ position: "absolute", inset: 0, width: `${(a.armScore / 10) * 100}%`, background: meta.color }} />
            </span>
            <span style={{
              width: 64, flexShrink: 0, textAlign: "right",
              fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 10.5, color: "var(--ink)", opacity: 0.7,
            }}>
              {a.armScore.toFixed(1)} · {a.tier[0].toUpperCase()}{a.tier.slice(1, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function CandidateCard({ c }: { c: Candidate }) {
  // Substrate cards carry per-arm data + the female lens; legacy cards fall back.
  const isSubstrate = !!c.arms && c.arms.length > 0;
  const armKey = c.signalType ? toArmKey(c.signalType) : null;
  const armLabel = armKey ? ARM_LABELS[armKey] : null;
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
            {c.sexPk && c.sexPk.length > 0 && <MarkerChip dot="var(--brick)" label="Sex-PK" />}
            {c.cyclePhase && c.cyclePhase.length > 0 && (
              <MarkerChip dot="var(--arm-cross)" label={`Phase · ${c.cyclePhase[0].cyclePhase}`} />
            )}
            {isSubstrate && c.validationStatus
              ? <ValidationStamp status={c.validationStatus} />
              : <RelBadge rel={c.direction} />}
            <TierBadge tier={c.tier} />
          </div>
        </div>
        <div className="c-route">
          <span className="c-drug">{c.drug}</span>
          <span className="c-arrow">→</span>
          <span className="c-cond">{c.condition}</span>
        </div>
        <span className="c-origin">Origin · {c.origin}</span>

        {isSubstrate && c.femaleApplicability && <FemaleLens fa={c.femaleApplicability} />}

        <p className="c-rationale">{c.rationale}</p>

        {isSubstrate && c.arms ? (
          <>
            <ArmStrengths arms={c.arms} />
            <div className="c-meta">
              <Readout score={c.score} />
              <span className="m"><b>Evidence</b> · {c.claims.length} verbatim claim{c.claims.length === 1 ? "" : "s"}</span>
              {c.arms.some((a) => a.contradictionFlag) && (
                <span className="m" style={{ color: "var(--brick)" }}><b>⚠ Contradiction</b></span>
              )}
            </div>
          </>
        ) : (
          <div className="c-meta">
            <Readout score={c.score} />
            {armLabel && <span className="m"><b>Arm</b> · {armLabel}</span>}
            <span className="m"><b>Pathway</b> · {c.pathway}</span>
            <span className="m"><b>Sources</b> · {c.claims.length}</span>
          </div>
        )}
      </div>

      {c.signalId && (
        <div className="c-foot" style={{ justifyContent: "flex-end" }}>
          <Link href={`/access/preview/${c.signalId}`} className="btn btn-ghost sm">
            Full breakdown <span className="arr">→</span>
          </Link>
        </div>
      )}
    </article>
  );
}
