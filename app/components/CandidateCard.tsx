import Link from "next/link";
import { toArmKey, ARM_LABELS } from "@/lib/arm-mapping";
import {
  supplyLabel, supplyGloss, relationshipLabel, relationshipGloss,
  regulatoryChipLabel, regulatoryChipDot,
} from "@/lib/regulatory-display";

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
  /** Underlying substrate pair id (`${interventionId}__${conditionId}`); the stable key for the per-signal detail page. */
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
  /**
   * Clinical-trial status layer (ClinicalTrials.gov v2 snapshot): where this
   * drug currently sits as a STUDIED THERAPY for this condition. Present =>
   * a "Trials" marker and a detail block. Only carries a record when the drug
   * was an experimental/active-comparator intervention in an interventional
   * trial of this condition (mechanistic / PK-DDI / Phase-4 post-marketing /
   * comparator-background studies are excluded upstream in the snapshot).
   */
  trialStatus?: {
    compound_name: string;
    condition_name: string;
    trial_count: number;
    highest_phase: string | null;
    highest_phase_label: string | null;
    activity: "active" | "completed" | "halted" | "unknown";
    top_trials: { nctId: string; title: string; phase: string | null; status: string; url: string }[];
  };
  /**
   * FDA Orange Book supply layer (per molecule): is this drug available as a
   * generic, a single-source brand (optionally still patented), only inside
   * combination products, discontinued, or absent from the Orange Book
   * (biologics, supplements, non-US-approved). Descriptive US
   * regulatory-landscape context only, not regulatory advice.
   */
  orangeBook?: {
    compound_name: string;
    fda_listed: boolean;
    supply: "generic" | "brand_patented" | "brand_only" | "discontinued" | "combination_only" | "not_listed";
    generic_available: boolean;
    marketed: boolean;
    latest_patent_expiry: string | null;
    marketing_status: string | null;
    products_sampled: { trade_name: string; applicant: string; appl_type: string; strength: string; status: string; approval_date: string }[];
  };
  /**
   * DailyMed approved-indication layer (per pair): is THIS condition an
   * FDA-approved (on-label) indication for the drug, an off-label use of a drug
   * approved for something else, or is there no FDA-approved drug label at all
   * (supplement, biologic-only, investigational, non-US). Descriptive context
   * only, not regulatory advice.
   */
  indication?: {
    compound_name: string;
    condition_name: string;
    has_fda_label: boolean;
    fda_approved_for_condition: boolean;
    label_relationship: "on_label" | "off_label" | "no_fda_label";
    approved_indication_excerpt: string | null;
    label_setid: string | null;
    label_title: string | null;
    label_url: string | null;
  };

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
  unvalidated_signal: { label: "Unvalidated signal", note: "Hypothesis / patient-reported, not clinically validated.", fill: "var(--arm-pathway)" },
  preliminary: { label: "Preliminary", note: "A single, early signal. Lowest confidence.", fill: "var(--lgrade-l0)" },
};

/** Plain-language reading of each female-applicability band (F1–F6). */
const FEMALE_BAND_TEXT: Record<string, string> = {
  F1: "Evidence generated in women",
  F2: "Sex-equivalence shown",
  F3: "Represented, not sex-analyzed",
  F4: "Applicability to women unconfirmed",
  F5: "Male-derived evidence",
  F6: "Known sex difference, flagged",
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
  const band = FEMALE_BAND_TEXT[fa.band] ?? "Applicability uncertain";
  // Drop the rationale's leading phrase when it just restates the band headline.
  let detail = (fa.rationale ?? "").trim();
  if (detail.toLowerCase().startsWith(band.toLowerCase())) {
    detail = detail.slice(band.length).replace(/^[\s.,:—–-]+/, "");
  }
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
          <b>{band}</b>
          {detail ? <span style={{ opacity: 0.78 }}> · {detail}</span> : null}
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
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 10,
        letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink)", opacity: 0.55, marginBottom: 1,
      }}>
        <span>Signal type</span>
        <span>◂ anchors the headline</span>
      </div>
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

/**
 * Compact per-dimension SCORES for the anchor arm (the five categories, 0–2 each).
 * The model's written rationale for each lives in the full breakdown, not the card.
 */
function ArmDimensions({ arm }: { arm: NonNullable<Candidate["arms"]>[number] }) {
  const meta = ARM_META[arm.arm];
  return (
    <div style={{ marginTop: 11, borderTop: "1px solid var(--rule)", paddingTop: 9 }}>
      <div style={{
        fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 10,
        letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink)", opacity: 0.55, marginBottom: 6,
      }}>
        Score by metric · {meta.label} arm
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 18, rowGap: 4 }}>
        {arm.dimensions.map((d) => (
          <div key={d.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--ink)", opacity: 0.82 }}>{d.label}</span>
            <span style={{
              fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 11, color: meta.color, flexShrink: 0,
            }}>
              {d.score}/2
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Clinical-trial status disclosure. Shows where the drug currently sits as a
 * studied therapy for this condition, with direct links to the trials on
 * ClinicalTrials.gov. Only the snapshot's qualifying (experimental/active-
 * comparator, interventional, non-mechanistic) trials reach this block.
 */
function TrialStatusDetail({ ts }: { ts: NonNullable<Candidate["trialStatus"]> }) {
  const activityLabel =
    ts.activity === "active" ? "active trial(s)"
    : ts.activity === "completed" ? "completed"
    : ts.activity === "halted" ? "halted/terminated"
    : "status unclear";
  const phaseLabel = ts.highest_phase_label ?? "no phase listed";
  return (
    <div style={{ marginTop: 11, borderTop: "1px solid var(--rule)", paddingTop: 9 }}>
      <div style={{
        fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 10,
        letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink)", opacity: 0.55, marginBottom: 6,
      }}>
        Clinical-trial status · for this condition
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink)", opacity: 0.82, margin: "0 0 7px" }}>
        Studied as a therapy for {ts.condition_name.toLowerCase()} in {ts.trial_count} interventional
        trial{ts.trial_count === 1 ? "" : "s"} · highest reached {phaseLabel} · {activityLabel}.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {ts.top_trials.map((t) => (
          <Link
            key={t.nctId}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 11,
              color: "var(--moss)", textDecoration: "none",
            }}
          >
            {t.nctId} · {t.phase ? `${t.phase.replace(/_/g, " ").replace(/PHASE/i, "Phase ")} · ` : ""}
            {t.status.replace(/_/g, " ").toLowerCase()}
          </Link>
        ))}
      </div>
      <p style={{ fontSize: 9.5, color: "var(--ink)", opacity: 0.45, margin: "7px 0 0" }}>
        Source: ClinicalTrials.gov (U.S. National Library of Medicine).
      </p>
    </div>
  );
}

// Regulatory & development status: where this candidate sits in the US
// regulatory landscape — approved-indication relationship (DailyMed) and
// generic / patent supply (FDA Orange Book). Descriptive context, not advice.
function RegulatoryStatusDetail({ c }: { c: Candidate }) {
  const ind = c.indication;
  const ob = c.orangeBook;
  if (!ind && !ob) return null;
  return (
    <div style={{ marginTop: 11, borderTop: "1px solid var(--rule)", paddingTop: 9 }}>
      <div style={{
        fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 10,
        letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink)", opacity: 0.55, marginBottom: 6,
      }}>
        Regulatory &amp; development status
      </div>

      {ind && (
        <p style={{ fontSize: 12.5, color: "var(--ink)", opacity: 0.82, margin: "0 0 6px" }}>
          <b>{relationshipLabel(ind.label_relationship)}.</b> {relationshipGloss(ind)}
          {ind.approved_indication_excerpt && (
            <span style={{ display: "block", marginTop: 4, opacity: 0.7, fontStyle: "italic" }}>
              Label: &ldquo;{ind.approved_indication_excerpt}&rdquo;
            </span>
          )}
        </p>
      )}

      {ob && (
        <p style={{ fontSize: 12.5, color: "var(--ink)", opacity: 0.82, margin: "0 0 6px" }}>
          <b>{supplyLabel(ob.supply)}.</b> {supplyGloss(ob)}
        </p>
      )}

      <p style={{ fontSize: 11.5, color: "var(--ink)", opacity: 0.7, margin: "2px 0 0" }}>
        This is where the candidate sits in the regulatory landscape: descriptive context, not a
        505(b)(2) viability assessment or regulatory advice.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 7 }}>
        {ind?.label_url && (
          <Link
            href={ind.label_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-plex-mono, ui-monospace, monospace)", fontSize: 11, color: "var(--moss)", textDecoration: "none" }}
          >
            FDA label (DailyMed) →
          </Link>
        )}
      </div>
      <p style={{ fontSize: 9.5, color: "var(--ink)", opacity: 0.45, margin: "7px 0 0" }}>
        Sources: FDA Orange Book; DailyMed (U.S. National Library of Medicine).
      </p>
    </div>
  );
}

export default function CandidateCard({ c }: { c: Candidate }) {
  // Substrate cards carry per-arm data + the female lens; legacy cards fall back.
  const isSubstrate = !!c.arms && c.arms.length > 0;
  const anchorArm = c.arms?.find((a) => a.isAnchor) ?? c.arms?.[0];
  const armKey = c.signalType ? toArmKey(c.signalType) : null;
  const armLabel = armKey ? ARM_LABELS[armKey] : null;
  return (
    <article className="candidate">
      <div className="c-top">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span className="eyebrow">{c.id}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {c.matrixPercentile && <MarkerChip dot="var(--green-deep)" label={`Matrix · ${c.matrixPercentile}`} />}
            {c.sexPk && c.sexPk.length > 0 && <MarkerChip dot="var(--brick)" label="Sex-PK" />}
            {c.cyclePhase && c.cyclePhase.length > 0 && (
              <MarkerChip dot="var(--arm-cross)" label={`Phase · ${c.cyclePhase[0].cyclePhase}`} />
            )}
            {c.trialStatus && c.trialStatus.trial_count > 0 && (
              <MarkerChip
                dot={
                  c.trialStatus.activity === "active" ? "var(--green-deep)"
                  : c.trialStatus.activity === "halted" ? "var(--brick)"
                  : "var(--moss)"
                }
                label={`Trials · ${c.trialStatus.highest_phase_label ?? "studied"}`}
              />
            )}
            {regulatoryChipLabel(c) && (
              <MarkerChip dot={regulatoryChipDot(c)} label={regulatoryChipLabel(c)!} />
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
            {anchorArm && <ArmDimensions arm={anchorArm} />}
          </>
        ) : (
          <div className="c-meta">
            <Readout score={c.score} />
            {armLabel && <span className="m"><b>Arm</b> · {armLabel}</span>}
            <span className="m"><b>Pathway</b> · {c.pathway}</span>
            <span className="m"><b>Sources</b> · {c.claims.length}</span>
          </div>
        )}

        {c.trialStatus && c.trialStatus.trial_count > 0 && <TrialStatusDetail ts={c.trialStatus} />}
        {(c.indication || c.orangeBook) && <RegulatoryStatusDetail c={c} />}
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
