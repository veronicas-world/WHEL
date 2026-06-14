/**
 * Real drug-repurposing candidates, derived from the live `repurposing_signals`
 * data (271 scored signals across 6 conditions) and mapped onto the redesign's
 * Candidate shape. This replaces the hardcoded placeholder candidates in the new
 * design with real, sourced data — same visual cards, real evidence underneath.
 *
 * The substrate (per-claim provenance, contradictions, grounded IDs) is layered on
 * top of the PMDD flagship separately; this module is the breadth layer.
 */
import { supabase } from "@/lib/supabase";
import type { Candidate, Claim } from "@/app/components/CandidateCard";
import { getLGradeForPair } from "@/lib/evidence-grading-snapshot";
import { getMatrixScoreForPair, formatMatrixPercentile } from "@/lib/matrix-pair-scores-snapshot";

type Row = Record<string, unknown>;

function one<T = Row>(v: unknown): T | null {
  if (Array.isArray(v)) return (v[0] as T) ?? null;
  return (v as T) ?? null;
}

const TIERS = ["strong", "moderate", "emerging", "exploratory"] as const;
type Tier = (typeof TIERS)[number];

function normTier(t: unknown): Tier {
  const k = String(t ?? "").toLowerCase();
  return (TIERS as readonly string[]).includes(k) ? (k as Tier) : "exploratory";
}

/** Dimension scores are on a 0–2 scale (five of them sum to the 0–10 total). */
function lvl(score: unknown): string {
  const n = Number(score);
  if (!Number.isFinite(n)) return "—";
  return n >= 2 ? "High" : n >= 1 ? "Medium" : "Low";
}

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function sourceLabel(s: Row): string {
  const type = String(s.source_type ?? "").toLowerCase();
  const pmid = s.external_id ? String(s.external_id) : "";
  const year = s.publication_date ? String(s.publication_date).slice(0, 4) : "";
  if (type === "pubmed") {
    const j = s.journal ? String(s.journal) : "PubMed";
    return [clip(j, 40), year, pmid && `PMID ${pmid}`].filter(Boolean).join(" · ");
  }
  if (type === "clinical_trial" || type === "clinical_trial_finding")
    return ["ClinicalTrials.gov", pmid].filter(Boolean).join(" · ");
  if (type === "reddit") return "Community signal · Reddit";
  return [s.journal && clip(String(s.journal), 40), year, pmid].filter(Boolean).join(" · ") || "Source on file";
}

/** A clickable link to the source: the stored url, else a constructed registry URL. */
function sourceHref(s: Row): string | undefined {
  const url = s.url ? String(s.url).trim() : "";
  if (url) return url;
  const type = String(s.source_type ?? "").toLowerCase();
  const ext = s.external_id ? String(s.external_id).trim() : "";
  if (!ext) return undefined;
  if (type === "pubmed") return `https://pubmed.ncbi.nlm.nih.gov/${ext}/`;
  if (type === "clinical_trial" || type === "clinical_trial_finding")
    return `https://clinicaltrials.gov/study/${ext}`;
  return undefined;
}

function buildClaims(sources: Row[]): Claim[] {
  const withExcerpt = sources.filter((s) => s.key_finding_excerpt);
  const chosen = (withExcerpt.length ? withExcerpt : sources).slice(0, 4);
  return chosen.map((s) => ({
    type: "extract",
    text: String(s.key_finding_excerpt || s.title || "Source on file."),
    src: sourceLabel(s),
    href: sourceHref(s),
  }));
}

function buildOrigin(comp: Row | null): string {
  const status = comp?.fda_status ? String(comp.fda_status) : "Approved";
  const ind = comp?.original_indication
    ? String(comp.original_indication)
    : comp?.drug_class
    ? String(comp.drug_class)
    : "";
  return ind ? `${status} · ${clip(ind, 64)}` : status;
}

function toCandidate(sig: Row, n: number, graph?: GraphSupportMap, sexpk?: SexPkMap, phase?: PhaseMap): Candidate {
  const comp = one(sig.compounds);
  const cond = one(sig.conditions);
  const sources = (Array.isArray(sig.sources) ? sig.sources : []) as Row[];
  const tier = normTier(sig.confidence_tier);

  // Only the four dimensions the legacy scoring actually measured. Cyclical-PK is a
  // substrate concept the legacy rubric never scored, so we do not fabricate it here.
  const dims: Record<string, string> = {
    replication: sig.replication_level ? String(sig.replication_level) : lvl(sig.replication_score),
    source: lvl(sig.source_quality_score),
    specificity: lvl(sig.specificity_score),
    plausibility: sig.plausibility_level ? String(sig.plausibility_level) : lvl(sig.plausibility_score),
  };

  const drug = comp?.name ? String(comp.name) : "Unknown compound";
  const condition = cond?.name ? String(cond.name) : "—";

  // Independent evidence markers, shown beside (never folded into) our own grade:
  // the L0–L3 external-validation grade and the Every Cure MATRIX cross-reference.
  const lGrade = getLGradeForPair(drug, condition) ?? undefined;
  const matrix = getMatrixScoreForPair(drug, condition);
  const matrixPercentile =
    matrix && matrix.quantile_rank != null ? formatMatrixPercentile(matrix.quantile_rank) : undefined;

  // Path B disclosure: does the knowledge graph independently connect this drug
  // to this condition through a shared target? Keyed on the resolved FK ids.
  const compoundId = sig.compound_id ? String(sig.compound_id) : "";
  const conditionId = sig.condition_id ? String(sig.condition_id) : "";
  const graphViaTargets =
    graph && compoundId && conditionId
      ? graph.get(`${compoundId}::${conditionId}`)
      : undefined;

  // Sex-aware layer (058): documented sex-specific PK facts for this compound.
  const sexPk = sexpk && compoundId ? sexpk.get(compoundId) : undefined;

  // Cyclical-phase layer (060): treatment-level cycle-phase dependence.
  const cyclePhase =
    phase && compoundId && conditionId
      ? phase.get(`${compoundId}::${conditionId}`)
      : undefined;

  return {
    id: `WHEL-C-${String(n).padStart(3, "0")}`,
    signalId: sig.id ? String(sig.id) : undefined,
    drug,
    condition,
    conditionId: cond?.slug ? String(cond.slug) : undefined,
    tier,
    lGrade,
    matrixPercentile,
    graphViaTargets: graphViaTargets && graphViaTargets.length ? graphViaTargets : undefined,
    sexPk: sexPk && sexPk.length ? sexPk : undefined,
    cyclePhase: cyclePhase && cyclePhase.length ? cyclePhase : undefined,
    score: Math.round(Number(sig.total_evidence_score) || 0),
    origin: buildOrigin(comp),
    pathway: tier === "exploratory"
      ? "Hypothesis-generation · pre-validation"
      : "505(b)(2) — existing active ingredient, new indication",
    direction: tier === "exploratory" ? "silent" : "supports",
    rationale: sig.summary ? String(sig.summary) : `${drug} surfaced as a repurposing signal for ${condition}.`,
    mechanism: sig.mechanism_hypothesis
      ? String(sig.mechanism_hypothesis)
      : "Mechanism not yet characterized in the substrate.",
    dims,
    claims: buildClaims(sources),
  };
}

const SELECT = `
  id, confidence_tier, total_evidence_score, summary, mechanism_hypothesis,
  replication_score, source_quality_score, specificity_score, plausibility_score,
  replication_level, plausibility_level, signal_type, effect_direction, status,
  compound_id, condition_id,
  compounds ( name, drug_class, fda_status, original_indication, sex_specific_pk ),
  conditions ( name, slug ),
  sources ( external_id, source_type, journal, publication_date, key_finding_excerpt, title, url )
`;

/**
 * Sex-aware layer (migration 058). Reads compound_pk, the documented,
 * sourced sex-specific pharmacokinetic facts, and returns a map keyed by
 * compound_id -> facts[]. If the table is empty or unreadable, returns an
 * empty map so cards simply show no sex-PK disclosure.
 */
type SexPkFact = { parameter: string; sex: string; direction?: string; magnitude?: string; source?: string; sourceUrl?: string; note?: string };
type SexPkMap = Map<string, SexPkFact[]>;

async function getSexPkMap(): Promise<SexPkMap> {
  const map: SexPkMap = new Map();
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
    const list = map.get(cid);
    if (list) list.push(fact);
    else map.set(cid, [fact]);
  }
  return map;
}

/**
 * Path B disclosure layer. Reads the `graph_support` view (migration 057),
 * which collapses drug_targets x target_conditions into one row per
 * drug-condition pair with the shared targets aggregated. Returns a map keyed
 * `${compound_id}::${condition_id}` -> via_targets[]. If the view is not yet
 * applied (or read fails), returns an empty map so cards simply show no chip.
 */
type GraphSupportMap = Map<string, string[]>;

async function getGraphSupportMap(): Promise<GraphSupportMap> {
  const map: GraphSupportMap = new Map();
  const { data, error } = await supabase
    .from("graph_support")
    .select("compound_id, condition_id, via_targets");
  if (error || !data) return map;
  for (const row of data as Row[]) {
    const cid = row.compound_id ? String(row.compound_id) : "";
    const condId = row.condition_id ? String(row.condition_id) : "";
    if (!cid || !condId) continue;
    const targets = Array.isArray(row.via_targets)
      ? (row.via_targets as unknown[]).map(String).filter(Boolean)
      : [];
    map.set(`${cid}::${condId}`, targets);
  }
  return map;
}

/**
 * Cyclical-phase layer (migration 060). Reads compound_condition_phase, the
 * sourced treatment-level cycle-phase dependence, keyed
 * `${compound_id}::${condition_id}` -> facts[]. Empty map => no phase marker.
 */
type PhaseFact = { cyclePhase: string; pattern?: string; dosingNote?: string; source?: string; sourceUrl?: string };
type PhaseMap = Map<string, PhaseFact[]>;

async function getPhaseMap(): Promise<PhaseMap> {
  const map: PhaseMap = new Map();
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
    const key = `${cid}::${condId}`;
    const list = map.get(key);
    if (list) list.push(fact);
    else map.set(key, [fact]);
  }
  return map;
}

/** All real candidates, highest evidence score first, with stable WHEL-C ids. */
export async function getCandidates(): Promise<Candidate[]> {
  const [{ data, error }, graph, sexpk, phase] = await Promise.all([
    supabase
      .from("repurposing_signals")
      .select(SELECT)
      .eq("status", "active")
      .gt("total_evidence_score", 0)
      // Secondary sort by id makes ordering (and the WHEL-C numbering + which
      // candidates are "featured") deterministic across queries, since many
      // signals tie on total_evidence_score.
      .order("total_evidence_score", { ascending: false })
      .order("id", { ascending: true }),
    getGraphSupportMap(),
    getSexPkMap(),
    getPhaseMap(),
  ]);
  if (error || !data) return [];
  return (data as Row[]).map((sig, i) => toCandidate(sig, i + 1, graph, sexpk, phase));
}

/** Top N candidates for the homepage / platform feature strip. */
export async function getFeaturedCandidates(n = 3): Promise<Candidate[]> {
  return (await getCandidates()).slice(0, n);
}

/**
 * A single candidate by its underlying signal id, for the per-signal detail
 * page. Runs the full list so the WHEL-C numbering and every marker map stay
 * consistent with the index, then finds the match.
 */
export async function getCandidateBySignalId(signalId: string): Promise<Candidate | null> {
  const all = await getCandidates();
  return all.find((c) => c.signalId === signalId) ?? null;
}

/**
 * Public proof sample: the single highest-scored candidate per condition (~6).
 * The full index lives behind Request Access; this is the curated showcase that
 * demonstrates the rigor without giving away the whole library.
 */
export async function getSampleCandidates(): Promise<Candidate[]> {
  const all = await getCandidates(); // already sorted by score desc
  const seen = new Set<string>();
  const sample: Candidate[] = [];
  for (const c of all) {
    const key = c.conditionId ?? c.condition;
    if (seen.has(key)) continue;
    seen.add(key);
    sample.push(c);
  }
  return sample;
}

/** The single strongest candidate from the PMDD flagship (falls back to the top overall). */
export async function getFlagshipCandidate(): Promise<Candidate | null> {
  const all = await getCandidates();
  return all.find((c) => c.conditionId === "pmdd") ?? all[0] ?? null;
}

/** Real corpus counts for dynamic scope copy ("N signals across M conditions"). */
export async function getCorpusScope(): Promise<{ signals: number; conditions: number }> {
  const [{ count: signals }, { data: conds }] = await Promise.all([
    supabase.from("repurposing_signals").select("id", { count: "exact", head: true })
      .eq("status", "active").gt("total_evidence_score", 0),
    supabase.from("conditions").select("slug"),
  ]);
  return { signals: signals ?? 0, conditions: (conds ?? []).length };
}
