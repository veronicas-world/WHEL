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

function buildClaims(sources: Row[]): Claim[] {
  const withExcerpt = sources.filter((s) => s.key_finding_excerpt);
  const chosen = (withExcerpt.length ? withExcerpt : sources).slice(0, 4);
  return chosen.map((s) => ({
    type: "extract",
    text: String(s.key_finding_excerpt || s.title || "Source on file."),
    src: sourceLabel(s),
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

function toCandidate(sig: Row, n: number): Candidate {
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

  return {
    id: `WHEL-C-${String(n).padStart(3, "0")}`,
    drug,
    condition,
    conditionId: cond?.slug ? String(cond.slug) : undefined,
    tier,
    lGrade,
    matrixPercentile,
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
  compounds ( name, drug_class, fda_status, original_indication ),
  conditions ( name, slug ),
  sources ( external_id, source_type, journal, publication_date, key_finding_excerpt, title )
`;

/** All real candidates, highest evidence score first, with stable WHEL-C ids. */
export async function getCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("repurposing_signals")
    .select(SELECT)
    .eq("status", "active")
    .gt("total_evidence_score", 0)
    // Secondary sort by id makes ordering (and the WHEL-C numbering + which
    // candidates are "featured") deterministic across queries, since many
    // signals tie on total_evidence_score.
    .order("total_evidence_score", { ascending: false })
    .order("id", { ascending: true });
  if (error || !data) return [];
  return (data as Row[]).map((sig, i) => toCandidate(sig, i + 1));
}

/** Top N candidates for the homepage / platform feature strip. */
export async function getFeaturedCandidates(n = 3): Promise<Candidate[]> {
  return (await getCandidates()).slice(0, n);
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

/** Real corpus counts for dynamic scope copy ("N signals across M conditions"). */
export async function getCorpusScope(): Promise<{ signals: number; conditions: number }> {
  const [{ count: signals }, { data: conds }] = await Promise.all([
    supabase.from("repurposing_signals").select("id", { count: "exact", head: true })
      .eq("status", "active").gt("total_evidence_score", 0),
    supabase.from("conditions").select("slug"),
  ]);
  return { signals: signals ?? 0, conditions: (conds ?? []).length };
}
