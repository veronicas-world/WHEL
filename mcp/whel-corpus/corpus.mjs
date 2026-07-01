// Pure query layer over the committed Whel corpus snapshot. No MCP/network
// here so it can be unit-tested directly. server.mjs wires these into tools.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(__dirname, "..", "..", "lib", "corpus-snapshot.json");

const snap = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
const CANDIDATES = snap.candidates ?? [];
const META = snap._meta ?? {};

const DISCLAIMER =
  `Whel curated corpus (built ${META.built ?? "unknown"}). Descriptive research ` +
  `context, human-in-the-loop; NOT clinical or regulatory advice. Point-in-time — ` +
  `re-run scripts/build-corpus-snapshot.mjs to refresh.`;

// indices
const byId = new Map(CANDIDATES.map((c) => [c.id.toLowerCase(), c]));
const bySignal = new Map(CANDIDATES.map((c) => [c.signalId.toLowerCase(), c]));
const byPair = new Map(CANDIDATES.map((c) => [`${c.drug}::${c.condition}`.toLowerCase(), c]));

const norm = (s) => String(s ?? "").trim().toLowerCase();

function summarize(c) {
  return {
    id: c.id,
    signalId: c.signalId,
    drug: c.drug,
    condition: c.condition,
    tier: c.tier,
    score: c.score,
    arm: c.signalType,
    validationStatus: c.validationStatus,
    labelRelationship: c.indication?.label_relationship ?? null,
    genericAvailable: c.orangeBook?.generic_available ?? null,
    supply: c.orangeBook?.supply ?? null,
    trialCount: c.trialStatus?.trial_count ?? 0,
    highestPhase: c.trialStatus?.highest_phase_label ?? null,
    matrix: c.matrixPercentile ?? null,
    contradiction: c.direction === "contradicts",
  };
}

function resolve(sel = {}) {
  if (sel.signalId) return bySignal.get(norm(sel.signalId)) ?? null;
  if (sel.id) return byId.get(norm(sel.id)) ?? null;
  if (sel.drug && sel.condition) return byPair.get(`${norm(sel.drug)}::${norm(sel.condition)}`) ?? null;
  if (sel.drug) return CANDIDATES.find((c) => norm(c.drug) === norm(sel.drug)) ?? null;
  return null;
}

export function meta() {
  return { ...META, disclaimer: DISCLAIMER };
}

export function list(opts = {}) {
  const { condition, tier, regulatory, drug, arm, limit = 50, offset = 0 } = opts;
  let rows = CANDIDATES;
  if (condition) {
    const q = norm(condition);
    rows = rows.filter((c) => norm(c.condition) === q || norm(c.conditionId) === q || norm(c.conditionId).includes(q) || norm(c.condition).includes(q));
  }
  if (tier) rows = rows.filter((c) => norm(c.tier) === norm(tier));
  if (arm) rows = rows.filter((c) => norm(c.signalType) === norm(arm));
  if (drug) rows = rows.filter((c) => norm(c.drug).includes(norm(drug)));
  if (regulatory) {
    const r = norm(regulatory);
    rows = rows.filter((c) => {
      if (r === "on-label" || r === "on_label") return c.indication?.label_relationship === "on_label";
      if (r === "off-label" || r === "off_label") return c.indication?.label_relationship === "off_label";
      if (r === "generic") return !!c.orangeBook?.generic_available;
      if (r === "no-label" || r === "no_fda_label") return c.indication?.label_relationship === "no_fda_label";
      return true;
    });
  }
  const total = rows.length;
  const page = rows.slice(offset, offset + limit).map(summarize);
  return { total, offset, limit, count: page.length, candidates: page, disclaimer: DISCLAIMER };
}

export function get(sel = {}) {
  const c = resolve(sel);
  if (!c) return { error: "No candidate matched. Provide signalId, id, or drug+condition.", disclaimer: DISCLAIMER };
  return { candidate: c, disclaimer: DISCLAIMER };
}

export function evidence(sel = {}) {
  const c = resolve(sel);
  if (!c) return { error: "No candidate matched.", disclaimer: DISCLAIMER };
  return {
    id: c.id,
    signalId: c.signalId,
    drug: c.drug,
    condition: c.condition,
    tier: c.tier,
    score: c.score,
    rationale: c.rationale,
    mechanism: c.mechanism,
    dimensions: c.dimBreakdown,
    claims: c.claims,
    matrix: c.matrixPercentile ?? null,
    regulatory: {
      labelRelationship: c.indication?.label_relationship ?? null,
      approvedIndicationExcerpt: c.indication?.approved_indication_excerpt ?? null,
      labelUrl: c.indication?.label_url ?? null,
      supply: c.orangeBook?.supply ?? null,
      genericAvailable: c.orangeBook?.generic_available ?? null,
      trials: c.trialStatus ?? null,
    },
    sexPk: c.sexPk ?? null,
    cyclePhase: c.cyclePhase ?? null,
    disclaimer: DISCLAIMER,
  };
}

export function search(query, limit = 25) {
  const q = norm(query);
  if (!q) return { error: "Empty query.", disclaimer: DISCLAIMER };
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const c of CANDIDATES) {
    const hay = [
      c.drug, c.condition, c.rationale, c.mechanism, c.origin, c.drugClass,
      ...(c.claims ?? []).map((cl) => cl.text),
    ].join("  ").toLowerCase();
    let hits = 0;
    for (const t of terms) if (hay.includes(t)) hits += 1;
    if (hits) scored.push({ c, hits });
  }
  scored.sort((a, b) => b.hits - a.hits || b.c.score - a.c.score);
  return { total: scored.length, count: Math.min(limit, scored.length), candidates: scored.slice(0, limit).map((x) => summarize(x.c)), disclaimer: DISCLAIMER };
}

export function conditionSummary(condition) {
  const conds = condition ? [norm(condition)] : [...new Set(CANDIDATES.map((c) => c.conditionId))];
  const out = {};
  for (const cond of conds) {
    const rows = CANDIDATES.filter((c) => norm(c.conditionId) === norm(cond) || norm(c.condition) === norm(cond) || norm(c.conditionId).includes(norm(cond)));
    if (!rows.length) continue;
    const dist = { strong: 0, moderate: 0, emerging: 0, exploratory: 0 };
    for (const c of rows) dist[c.tier] += 1;
    out[rows[0].conditionId] = {
      condition: rows[0].condition,
      total: rows.length,
      tier_distribution: dist,
      candidates: rows.map((c) => ({ drug: c.drug, tier: c.tier, score: c.score, labelRelationship: c.indication?.label_relationship ?? null, arm: c.signalType })),
    };
  }
  return { conditions: out, disclaimer: DISCLAIMER };
}
