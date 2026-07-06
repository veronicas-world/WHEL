/**
 * Substrate data layer — the NEW evidence engine behind the public site.
 *
 * Reads `substrate_signals` (the arm-aware scored signals, migration 050/051) joined
 * to `entities`, groups the per-arm rows by drug–condition PAIR, and derives the
 * pair headline by SCORING_SPEC §6 anchor-and-corroborate (never averaging across
 * arms). Provenance is the substrate's own verbatim-verified `claims`. This replaces
 * lib/candidates.ts (the legacy `repurposing_signals` reader) at cutover; it exposes
 * the same function surface so the swap is a one-line import change.
 *
 * Independent side-layers (MATRIX, sex-PK, cycle-phase) are re-keyed to the
 * substrate drug set here (Stage 1.5): they resolve a substrate drug/condition
 * label back to the legacy compound_id/condition_id (sex-PK, cycle-phase) or by
 * name (MATRIX), and are reported beside the score, never folded into it. The
 * L-grade and the Open Targets graph chip are intentionally dropped — the
 * substrate's own `rigor` dimension and Pathway arm supersede them.
 */
import { supabase } from "@/lib/supabase";
import type { Candidate, Claim, SubstrateArm } from "@/app/components/CandidateCard";
import { MATRIX_PAIR_SNAPSHOT, formatMatrixPercentile } from "@/lib/matrix-pair-scores-snapshot";
import { getTrialStatusForPair } from "@/lib/clinicaltrials-status-snapshot";
import { getOrangeBookForDrug } from "@/lib/orangebook-status-snapshot";
import { getIndicationForPair } from "@/lib/dailymed-indication-snapshot";
import { classifyCuration, resolveDrugClass } from "@/lib/curation";

type Row = Record<string, unknown>;
type ArmKey = "direct" | "pathway" | "community";

const ARMS: ArmKey[] = ["direct", "pathway", "community"];

const DIMS: { key: string; label: string }[] = [
  { key: "corroboration", label: "Corroboration" },
  { key: "rigor", label: "Rigor" },
  { key: "specificity", label: "Specificity" },
  { key: "plausibility", label: "Plausibility" },
  { key: "consistency", label: "Consistency" },
];

// Substrate condition labels are the canonical six; five match the `conditions`
// table by name, but "menopause" is filed under the slug "perimenopause-menopause".
const SLUG_OVERRIDE: Record<string, string> = { menopause: "perimenopause-menopause" };

// ── Independent side-layers ──────────────────────────────────────────────────
// Reported beside the score, never folded in. MATRIX is name-keyed; sex-PK and
// cycle-phase are id-keyed (legacy compound_id / condition_id), so we resolve a
// substrate drug/condition label back to its legacy id below.

export type SexPkFact = { parameter: string; sex: string; direction?: string; magnitude?: string; source?: string; sourceUrl?: string; note?: string };
export type PhaseFact = { cyclePhase: string; pattern?: string; dosingNote?: string; source?: string; sourceUrl?: string };

// MATRIX condition names differ from the substrate's canonical labels for one
// condition; alias the substrate label (lowercased) to MATRIX's condition name.
const MATRIX_COND_ALIAS: Record<string, string> = {
  menopause: "perimenopause & menopause",
};

// Case-insensitive `${compound}::${condition}` → MATRIX score, built once.
const MATRIX_INDEX: Map<string, (typeof MATRIX_PAIR_SNAPSHOT.per_pair)[number]> = (() => {
  const m = new Map<string, (typeof MATRIX_PAIR_SNAPSHOT.per_pair)[number]>();
  for (const p of MATRIX_PAIR_SNAPSHOT.per_pair) {
    m.set(`${String(p.compound_name).toLowerCase()}::${String(p.condition_name).toLowerCase()}`, p);
  }
  return m;
})();

function matrixForPair(drug: string, condition: string) {
  const condKey = MATRIX_COND_ALIAS[condition.toLowerCase()] ?? condition.toLowerCase();
  const m = MATRIX_INDEX.get(`${drug.toLowerCase()}::${condKey}`);
  if (!m) return { matrixPercentile: undefined, matrixDetail: undefined } as const;
  return {
    matrixPercentile: m.quantile_rank != null ? formatMatrixPercentile(m.quantile_rank) : undefined,
    matrixDetail: {
      transformedScore: m.transformed_score ?? undefined,
      sourceId: m.matrix_source_id ?? undefined,
      mondo: m.matrix_mondo ?? undefined,
    },
  } as const;
}

/** compound_id → documented sex-specific PK facts (migration 058). */
async function getSexPkMap(): Promise<Map<string, SexPkFact[]>> {
  const map = new Map<string, SexPkFact[]>();
  const { data, error } = await supabase
    .from("compound_pk")
    .select("compound_id, parameter, sex, direction, magnitude, source_ref, source_url, note");
  if (error || !data) return map;
  for (const row of data as Row[]) {
    const cid = row.compound_id ? String(row.compound_id) : "";
    if (!cid) continue;
    const fact: SexPkFact = {
      parameter: String(row.parameter ?? ""),
      sex: String(row.sex ?? ""),
      direction: row.direction ? String(row.direction) : undefined,
      magnitude: row.magnitude ? String(row.magnitude) : undefined,
      source: row.source_ref ? String(row.source_ref) : undefined,
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
      note: row.note ? String(row.note) : undefined,
    };
    (map.get(cid) ?? map.set(cid, []).get(cid)!).push(fact);
  }
  return map;
}

/** `${compound_id}::${condition_id}` → cycle-phase dependence (migration 060). */
async function getPhaseMap(): Promise<Map<string, PhaseFact[]>> {
  const map = new Map<string, PhaseFact[]>();
  const { data, error } = await supabase
    .from("compound_condition_phase")
    .select("compound_id, condition_id, cycle_phase, pattern, dosing_note, source_ref, source_url");
  if (error || !data) return map;
  for (const row of data as Row[]) {
    const cid = row.compound_id ? String(row.compound_id) : "";
    const condId = row.condition_id ? String(row.condition_id) : "";
    if (!cid || !condId) continue;
    const fact: PhaseFact = {
      cyclePhase: String(row.cycle_phase ?? ""),
      pattern: row.pattern ? String(row.pattern) : undefined,
      dosingNote: row.dosing_note ? String(row.dosing_note) : undefined,
      source: row.source_ref ? String(row.source_ref) : undefined,
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
    };
    (map.get(`${cid}::${condId}`) ?? map.set(`${cid}::${condId}`, []).get(`${cid}::${condId}`)!).push(fact);
  }
  return map;
}

function tierLc(t: unknown): "strong" | "moderate" | "emerging" | "exploratory" {
  const k = String(t ?? "").toLowerCase();
  return k === "strong" || k === "moderate" || k === "emerging" ? k : "exploratory";
}

function lvl(score: unknown): string {
  const n = Number(score);
  if (!Number.isFinite(n)) return "—";
  return n >= 2 ? "High" : n >= 1 ? "Medium" : "Low";
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

// ── Provenance: render a substrate document into a source label + link ───────
function sourceLabel(doc: Row | null, direction?: string): string {
  if (!doc) return "Source on file";
  const type = String(doc.source ?? "").toLowerCase();
  const ext = doc.external_id ? String(doc.external_id) : "";
  if (type === "pubmed") return ["PubMed", ext && `PMID ${ext}`].filter(Boolean).join(" · ");
  if (type === "clinicaltrials") return ["ClinicalTrials.gov", ext].filter(Boolean).join(" · ");
  if (type === "reddit") return "Community report · Reddit";
  if (type === "opentargets") return "Open Targets · mechanistic";
  if (type === "aems") return "AEMS · adverse-event report";
  if (type === "sider") return "SIDER · label side-effect";
  return clip(type || "source", 32);
}

function sourceHref(doc: Row | null): string | undefined {
  if (!doc) return undefined;
  const url = doc.url ? String(doc.url).trim() : "";
  if (url) return url;
  const type = String(doc.source ?? "").toLowerCase();
  const ext = doc.external_id ? String(doc.external_id).trim() : "";
  if (!ext) return undefined;
  if (type === "pubmed") return `https://pubmed.ncbi.nlm.nih.gov/${ext}/`;
  if (type === "clinicaltrials") return `https://clinicaltrials.gov/study/${ext}`;
  return undefined;
}

// ── Anchor-and-corroborate (SCORING_SPEC §6) ─────────────────────────────────
function deriveHeadline(arms: SubstrateArm[]): {
  status: "clinical" | "unvalidated_signal" | "preliminary";
  anchor: SubstrateArm;
} {
  // 1. A non-trivial Direct arm anchors the pair → clinical.
  const direct = arms.find((a) => a.arm === "direct" && a.strength >= 3);
  if (direct) return { status: "clinical", anchor: direct };
  // strongest available arm by arm_score (Direct included if it exists but is thin)
  const strongest = [...arms].sort((a, b) => b.armScore - a.armScore)[0];
  // 2. Direct thin/absent but arms converge → surfaced, hedged.
  // 3. A single weak arm → preliminary.
  const nonTrivial = arms.length >= 2 || strongest.tier !== "exploratory";
  return { status: nonTrivial ? "unvalidated_signal" : "preliminary", anchor: strongest };
}

function toArm(sig: Row): SubstrateArm {
  const dims = DIMS.map((d) => ({
    key: d.key,
    label: d.label,
    score: Math.max(0, Math.min(2, num(sig[`${d.key}_score`]))),
    rationale: sig[`${d.key}_rationale`] ? String(sig[`${d.key}_rationale`]) : "",
  }));
  return {
    arm: String(sig.arm) as ArmKey,
    aspect: String(sig.aspect ?? "efficacy"),
    armScore: num(sig.arm_score),
    strength: num(sig.arm_strength),
    tier: tierLc(sig.confidence_tier),
    isAnchor: false,
    dimensions: dims,
    female: {
      band: sig.female_applicability_band ? String(sig.female_applicability_band) : "—",
      multiplier: num(sig.female_applicability_multiplier, 1),
      rationale: sig.female_applicability_rationale ? String(sig.female_applicability_rationale) : "",
    },
    synthesis: sig.synthesis_summary ? String(sig.synthesis_summary) : undefined,
    mechanism: sig.mechanism_hypothesis ? String(sig.mechanism_hypothesis) : undefined,
    precisionNote: sig.precision_note ? String(sig.precision_note) : undefined,
    needsFulltext: !!sig.needs_fulltext,
    contradictionFlag: !!sig.contradiction_flag,
    numContradictions: num(sig.num_contradictions),
  };
}

// ── Load + assemble ──────────────────────────────────────────────────────────
const SIGNAL_COLS =
  "id, intervention_id, condition_id, aspect, arm," +
  " corroboration_score, rigor_score, specificity_score, plausibility_score, consistency_score," +
  " corroboration_rationale, rigor_rationale, specificity_rationale, plausibility_rationale, consistency_rationale," +
  " arm_strength, arm_score, confidence_tier," +
  " female_applicability_band, female_applicability_multiplier, female_applicability_rationale," +
  " contradiction_flag, num_contradictions, precision_note, needs_fulltext," +
  " synthesis_summary, mechanism_hypothesis, claim_ids, status";

type ClaimRec = { quote: string; direction: string; src: string; href?: string; rank: number };

function claimRank(doc: Row | null): number {
  const t = String(doc?.source ?? "").toLowerCase();
  if (t === "pubmed") return 0;
  if (t === "clinicaltrials") return 1;
  if (t === "opentargets" || t === "aems" || t === "sider") return 2;
  return 3; // reddit / community
}

async function getAllCandidates(): Promise<Candidate[]> {
  const [sigRes, entRes, claimRes, condRes, compRes, sexMap, phaseMap] = await Promise.all([
    supabase.from("substrate_signals").select(SIGNAL_COLS).eq("status", "active"),
    supabase.from("entities").select("id, type, label"),
    supabase.from("claims").select("id, exact_quote, text, direction, documents(source, external_id, url, title)"),
    supabase.from("conditions").select("id, name, slug"),
    supabase.from("compounds").select("id, name, fda_status, original_indication, drug_class"),
    getSexPkMap(),
    getPhaseMap(),
  ]);

  const signals = (sigRes.data ?? []) as unknown as Row[];
  if (!signals.length) return [];

  // entity id -> label
  const label = new Map<string, string>();
  for (const e of (entRes.data ?? []) as Row[]) label.set(String(e.id), String(e.label));

  // condition display-name(lower) -> slug + legacy id (for the id-keyed layers)
  const slugByName = new Map<string, string>();
  const condIdByName = new Map<string, string>();
  for (const c of (condRes.data ?? []) as Row[]) {
    if (c.name && c.slug) slugByName.set(String(c.name).toLowerCase(), String(c.slug));
    if (c.name && c.id) condIdByName.set(String(c.name).toLowerCase(), String(c.id));
  }
  // compound name(lower) -> origin meta + legacy id (for the id-keyed layers)
  const compByName = new Map<string, Row>();
  const compIdByName = new Map<string, string>();
  for (const c of (compRes.data ?? []) as Row[]) {
    compByName.set(String(c.name).toLowerCase(), c);
    if (c.id) compIdByName.set(String(c.name).toLowerCase(), String(c.id));
  }

  // claim id -> rendered provenance record (verbatim quote)
  const claimById = new Map<string, ClaimRec>();
  for (const c of (claimRes.data ?? []) as unknown as Row[]) {
    const doc = (Array.isArray(c.documents) ? c.documents[0] : c.documents) as Row | null;
    claimById.set(String(c.id), {
      quote: String(c.exact_quote || c.text || "").trim(),
      direction: String(c.direction ?? ""),
      src: sourceLabel(doc),
      href: sourceHref(doc),
      rank: claimRank(doc),
    });
  }

  // group signals by pair
  const pairs = new Map<string, Row[]>();
  for (const s of signals) {
    if (!ARMS.includes(String(s.arm) as ArmKey)) continue; // ignore any legacy 'cross'
    const key = `${s.intervention_id}::${s.condition_id}`;
    (pairs.get(key) ?? pairs.set(key, []).get(key)!).push(s);
  }

  const out: Candidate[] = [];
  let n = 0;
  for (const [key, rows] of pairs) {
    const [iid, cid] = key.split("::");
    const drug = label.get(iid) ?? "Unknown compound";
    const condition = label.get(cid) ?? "—";
    const slug =
      SLUG_OVERRIDE[condition.toLowerCase()] ??
      slugByName.get(condition.toLowerCase()) ??
      condition.toLowerCase();

    const allArms = rows.map(toArm);
    // Safety is a separate readout (tolerability) — never blended into the "does it
    // work" headline. The headline is driven by efficacy + mechanistic ('other') arms.
    const safetyArms = allArms.filter((a) => a.aspect === "safety");
    const headlineSrc = allArms.filter((a) => a.aspect !== "safety");
    // Collapse to ONE reading per arm (the strongest efficacy/mechanistic signal),
    // so the UI shows a single Direct / Pathway / Community strength, not duplicates.
    const byArm = new Map<ArmKey, SubstrateArm>();
    for (const a of (headlineSrc.length ? headlineSrc : safetyArms)) {
      const cur = byArm.get(a.arm);
      if (!cur || a.armScore > cur.armScore) byArm.set(a.arm, a);
    }
    const arms = [...byArm.values()];
    const { status, anchor } = deriveHeadline(arms);
    for (const a of arms) a.isAnchor = a === anchor;

    // provenance: claim_ids across all arms, best sources first, top 4 (verbatim)
    const claimIds = new Set<string>();
    for (const r of rows) {
      const ids = Array.isArray(r.claim_ids) ? (r.claim_ids as unknown[]).map(String) : [];
      ids.forEach((id) => claimIds.add(id));
    }
    const claims: Claim[] = [...claimIds]
      .map((id) => claimById.get(id))
      .filter((c): c is ClaimRec => !!c && !!c.quote)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 4)
      .map((c) => ({ type: "extract", text: c.quote, src: c.src, href: c.href }));

    const comp = compByName.get(drug.toLowerCase()) ?? null;
    const origin = comp
      ? [comp.fda_status ? String(comp.fda_status) : "Approved",
         comp.original_indication ? clip(String(comp.original_indication), 60) : ""].filter(Boolean).join(" · ")
      : "Existing drug · repurposing candidate";

    const anyContradiction = arms.some((a) => a.contradictionFlag);
    const dims: Record<string, string> = {};
    for (const d of anchor.dimensions) dims[d.key] = lvl(d.score);

    // ── Independent side-layers, re-keyed to the substrate drug/condition ──
    const compoundId = compIdByName.get(drug.toLowerCase());
    const conditionId = condIdByName.get(condition.toLowerCase());
    const sexPk = compoundId ? sexMap.get(compoundId) : undefined;
    const cyclePhase = compoundId && conditionId ? phaseMap.get(`${compoundId}::${conditionId}`) : undefined;
    const { matrixPercentile, matrixDetail } = matrixForPair(drug, condition);
    const trialStatus = getTrialStatusForPair(drug, condition) ?? undefined;
    const orangeBook = getOrangeBookForDrug(drug) ?? undefined;
    const indication = getIndicationForPair(drug, condition) ?? undefined;

    // Drug-class resolution (see lib/curation.ts): relabel a class to its
    // representative molecule, or mark a multi-molecule rollup as "class".
    // All lookups above used the original `drug`; only the display label changes.
    const cls = resolveDrugClass(drug);
    const displayDrug = cls && "molecule" in cls ? cls.molecule : drug;
    const curationClass = cls
      ? ("molecule" in cls ? "drug" : "class")
      : classifyCuration(drug);

    n += 1;
    out.push({
      id: `WHEL-C-${String(n).padStart(3, "0")}`,
      signalId: `${iid}__${cid}`,
      drug: displayDrug,
      condition,
      conditionId: slug,
      curationClass,
      tier: anchor.tier,
      score: Math.round(anchor.armScore * 10) / 10,
      origin,
      pathway: anchor.tier === "exploratory"
        ? "Hypothesis-generation · pre-validation"
        : "505(b)(2) · existing active ingredient, new indication",
      direction: anyContradiction ? "contradicts" : anchor.tier === "exploratory" ? "silent" : "supports",
      rationale: anchor.synthesis || `${displayDrug} surfaced as a substrate signal for ${condition}.`,
      mechanism: anchor.mechanism || "Mechanism not yet characterized in the substrate.",
      dims,
      dimBreakdown: anchor.dimensions.map((d) => ({ key: d.key, label: d.label, score: d.score, level: lvl(d.score) })),
      signalType: anchor.arm,
      evidenceStrength: anchor.tier,
      claims,
      // ── substrate fields ──
      validationStatus: status,
      femaleApplicability: anchor.female,
      arms,
      safetyArms: safetyArms.length ? safetyArms : undefined,
      // ── independent side-layers (reported beside the score, not folded in) ──
      matrixPercentile,
      matrixDetail,
      sexPk: sexPk && sexPk.length ? sexPk : undefined,
      cyclePhase: cyclePhase && cyclePhase.length ? cyclePhase : undefined,
      trialStatus,
      orangeBook,
      indication,
    });
  }

  // Collapse duplicates created by class→molecule relabeling (e.g. an
  // "aromatase inhibitors" row relabeled to Letrozole merging with an existing
  // Letrozole row): keep the higher-scored candidate per drug + condition.
  const bestByKey = new Map<string, Candidate>();
  const deduped: Candidate[] = [];
  for (const c of out) {
    if (c.curationClass !== "drug") { deduped.push(c); continue; }
    const key = `${c.drug.toLowerCase()}::${c.conditionId}`;
    const prev = bestByKey.get(key);
    if (!prev) { bestByKey.set(key, c); deduped.push(c); }
    else if (c.score > prev.score) {
      deduped[deduped.indexOf(prev)] = c;
      bestByKey.set(key, c);
    }
  }

  // headline ranking: anchor score desc, then clinical-validated first on ties
  const vWeight = { clinical: 2, unvalidated_signal: 1, preliminary: 0 } as const;
  deduped.sort((a, b) =>
    b.score - a.score ||
    (vWeight[b.validationStatus ?? "preliminary"] - vWeight[a.validationStatus ?? "preliminary"]) ||
    a.drug.localeCompare(b.drug));
  return deduped;
}

// The public candidate INDEX is the clean single-agent drug set. Combination
// regimens and supplements/herbals are segregated (below) rather than graded as
// first-class candidates; non-drug/procedure/junk entries are dropped. This is a
// display-time filter over the substrate (see lib/curation.ts) — the substrate
// itself is unchanged.
export async function getCandidates(): Promise<Candidate[]> {
  return (await getAllCandidates()).filter((c) => (c.curationClass ?? "drug") === "drug");
}

/** Combination regimens (multi-agent), segregated from the single-agent index. */
export async function getCombinationCandidates(): Promise<Candidate[]> {
  return (await getAllCandidates()).filter((c) => c.curationClass === "combination");
}

/** Supplements / herbals, shown as an adjunct list rather than graded candidates. */
export async function getAdjunctCandidates(): Promise<Candidate[]> {
  return (await getAllCandidates()).filter((c) => c.curationClass === "supplement");
}

export async function getFeaturedCandidates(n = 3): Promise<Candidate[]> {
  return (await getCandidates()).slice(0, n);
}

export async function getCandidateBySignalId(signalId: string): Promise<Candidate | null> {
  // Search ALL classes so a direct link to a combination/adjunct pair still resolves.
  const all = await getAllCandidates();
  return all.find((c) => c.signalId === signalId) ?? null;
}

/** One representative (strongest) candidate per condition. */
export async function getSampleCandidates(): Promise<Candidate[]> {
  const all = await getCandidates();
  const seen = new Set<string>();
  const sample: Candidate[] = [];
  for (const c of all) {
    const k = c.conditionId ?? c.condition;
    if (seen.has(k)) continue;
    seen.add(k);
    sample.push(c);
  }
  return sample;
}

export async function getShowcaseCandidates(): Promise<Candidate[]> {
  return getSampleCandidates();
}

export async function getFlagshipCandidate(): Promise<Candidate | null> {
  const all = await getCandidates();
  return all.find((c) => c.conditionId === "pmdd") ?? all[0] ?? null;
}

/**
 * Homepage hero pair: the strongest signal plus a deliberately contrasting one
 * (different condition, and ideally a different validation status) so the homepage
 * shows the score's RANGE and the honesty stamps, not two perfect scores.
 */
export async function getShowcasePair(): Promise<Candidate[]> {
  const all = await getCandidates(); // sorted strongest-first
  const lead = all[0];
  if (!lead) return [];
  const diff = (c: Candidate) => (c.conditionId ?? c.condition) !== (lead.conditionId ?? lead.condition);
  const contrast =
    all.find((c) => diff(c) && c.validationStatus === "unvalidated_signal") ??
    all.find((c) => diff(c) && c.tier !== lead.tier) ??
    all.find(diff);
  return contrast ? [lead, contrast] : [lead];
}

/** Real corpus counts for dynamic scope copy ("N signals across M conditions"). */
export async function getCorpusScope(): Promise<{ signals: number; conditions: number }> {
  const all = await getCandidates();
  const conds = new Set(all.map((c) => c.conditionId ?? c.condition));
  return { signals: all.length, conditions: conds.size };
}

export interface HomeConditionStat {
  strong: number; moderate: number; emerging: number; exploratory: number; total: number;
}

/**
 * Homepage statistics, all from the substrate: the pair count, per-condition
 * confidence-tier distribution (by each pair's headline tier), and the provenance
 * volume (distinct verbatim claims and source documents behind the active signals).
 */
export async function getSubstrateHomeData(): Promise<{
  totalPairs: number;
  byCondition: Map<string, HomeConditionStat>;
  claims: number;
  documents: number;
}> {
  const all = await getCandidates();
  const byCondition = new Map<string, HomeConditionStat>();
  for (const c of all) {
    const slug = c.conditionId ?? c.condition.toLowerCase();
    let s = byCondition.get(slug);
    if (!s) { s = { strong: 0, moderate: 0, emerging: 0, exploratory: 0, total: 0 }; byCondition.set(slug, s); }
    s[c.tier] += 1;
    s.total += 1;
  }
  // Provenance volume: distinct verbatim claims and source documents that actually
  // back the active signals (claim_ids on the signals → claims → documents).
  const [sigRes, claimRes] = await Promise.all([
    supabase.from("substrate_signals").select("claim_ids").eq("status", "active"),
    supabase.from("claims").select("id, document_id"),
  ]);
  const referenced = new Set<string>();
  for (const s of (sigRes.data ?? []) as unknown as Row[]) {
    const ids = Array.isArray(s.claim_ids) ? (s.claim_ids as unknown[]).map(String) : [];
    ids.forEach((id) => referenced.add(id));
  }
  const docs = new Set<string>();
  let claims = 0;
  for (const cl of (claimRes.data ?? []) as Row[]) {
    if (referenced.has(String(cl.id))) {
      claims += 1;
      if (cl.document_id) docs.add(String(cl.document_id));
    }
  }
  return { totalPairs: all.length, byCondition, claims, documents: docs.size };
}
