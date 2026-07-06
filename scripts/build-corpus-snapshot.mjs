// Corpus export builder — dumps the FULL curated Whel corpus (everything the
// public site surfaces) into a single committed snapshot at
// lib/corpus-snapshot.json.
//
// This is a faithful, offline port of getCandidates() in
// lib/substrate-candidates.ts: it reads substrate_signals joined to entities,
// claims/documents, conditions, compounds, the sex-PK and cycle-phase tables,
// and folds in the committed side-layer snapshots (MATRIX, DailyMed, Orange
// Book, ClinicalTrials.gov) exactly the way the runtime does. The output is a
// name-stable, versioned corpus that the whel-corpus MCP server serves to
// Claude Science, so a research session reasons over Whel's CURATED reads
// (tiers, scores, verbatim claims, regulatory status) rather than raw APIs.
//
// Run locally with Supabase creds in the environment (same as the other
// snapshot builders):  node scripts/build-corpus-snapshot.mjs
//
// This is descriptive research context. Nothing here is clinical or regulatory
// advice, and it is a point-in-time export — re-run to refresh.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "..", "lib");
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(LIB, f), "utf8"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in env.");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Committed side-layer snapshots (read directly) ───────────────────────────
const MATRIX = readJson("matrix-pair-scores-snapshot.json");
const DAILYMED = readJson("dailymed-indication-snapshot.json");
const ORANGEBOOK = readJson("orangebook-status-snapshot.json");
const TRIALS = readJson("clinicaltrials-status-snapshot.json");

const COND_ALIAS = { menopause: "perimenopause & menopause" };

const matrixIdx = new Map(
  (MATRIX.per_pair || []).map((p) => [`${String(p.compound_name).toLowerCase()}::${String(p.condition_name).toLowerCase()}`, p]),
);
const dailymedIdx = new Map(
  (DAILYMED.per_pair || []).map((r) => [`${r.compound_name}::${r.condition_name}`.toLowerCase(), r]),
);
const trialsIdx = new Map(
  (TRIALS.per_pair || []).map((r) => [`${r.compound_name}::${r.condition_name}`.toLowerCase(), r]),
);
const orangebookIdx = new Map(
  (ORANGEBOOK.per_drug || []).map((r) => [String(r.compound_name).toLowerCase(), r]),
);

const formatMatrixPercentile = (qr) => `Top ${Math.max(1, Math.round(qr * 100))}%`;

function matrixForPair(drug, condition) {
  const condKey = COND_ALIAS[condition.toLowerCase()] ?? condition.toLowerCase();
  const m = matrixIdx.get(`${drug.toLowerCase()}::${condKey}`);
  if (!m) return { matrixPercentile: undefined, matrixDetail: undefined };
  return {
    matrixPercentile: m.quantile_rank != null ? formatMatrixPercentile(m.quantile_rank) : undefined,
    matrixDetail: {
      transformedScore: m.transformed_score ?? undefined,
      sourceId: m.matrix_source_id ?? undefined,
      mondo: m.matrix_mondo ?? undefined,
    },
  };
}
function getIndicationForPair(drug, condition) {
  const cond = COND_ALIAS[condition.toLowerCase()] ?? condition;
  return dailymedIdx.get(`${drug}::${cond}`.toLowerCase()) ?? undefined;
}
function getTrialStatusForPair(drug, condition) {
  const cond = COND_ALIAS[condition.toLowerCase()] ?? condition;
  const rec = trialsIdx.get(`${drug}::${cond}`.toLowerCase());
  if (!rec || rec.trial_count < 1) return undefined;
  return rec;
}
function getOrangeBookForDrug(drug) {
  return orangebookIdx.get(drug.toLowerCase()) ?? undefined;
}

// ── Small helpers (mirrors lib/substrate-candidates.ts) ──────────────────────
const ARMS = ["direct", "pathway", "community"];
const DIMS = [
  { key: "corroboration", label: "Corroboration" },
  { key: "rigor", label: "Rigor" },
  { key: "specificity", label: "Specificity" },
  { key: "plausibility", label: "Plausibility" },
  { key: "consistency", label: "Consistency" },
];
const SLUG_OVERRIDE = { menopause: "perimenopause-menopause" };

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const tierLc = (t) => {
  const k = String(t ?? "").toLowerCase();
  return k === "strong" || k === "moderate" || k === "emerging" ? k : "exploratory";
};
const lvl = (score) => {
  const n = Number(score);
  if (!Number.isFinite(n)) return "—";
  return n >= 2 ? "High" : n >= 1 ? "Medium" : "Low";
};
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function sourceLabel(doc) {
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
function sourceHref(doc) {
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
const claimRank = (doc) => {
  const t = String(doc?.source ?? "").toLowerCase();
  if (t === "pubmed") return 0;
  if (t === "clinicaltrials") return 1;
  if (t === "opentargets" || t === "aems" || t === "sider") return 2;
  return 3;
};

// Curation classification — KEEP IN SYNC with lib/curation.ts. The corpus
// snapshot TAGS every candidate but keeps them ALL (so an MCP client sees the
// full picture, flagged); the public site filters on this tag instead.
const CUR_EXCLUDE_RE = /acupuncture|reflexolog|cognitive[- ]behav|\bcbt\b|hypnother|physioth|physical therapy|biofeedback|\btens\b|dilators?|laser therap|vestibulectomy|laparoscop|surgical|cold knife|excision|electromyograph|\bdiet\b|natural compound|non-?pharmacolog/i;
const CUR_EXCLUDE_EXACT = new Set(["unspecified treatment","unspecified treatment groups","unspecified","interventions","multiple interventions","various treatments","various","treatments","drug therapy","hormonal treatment","nonhormonal treatment","daily use"]);
const CUR_COMBO_RE = /combined with|combination|with or without| plus |\bplus\b|\+| and |\bcocp?\b|combined oral contracept/i;
const CUR_SUPPL_RE = /vitamin|vitex|chasteberry|nux vomica|\blysine\b|fatty acid|evening primrose|\bomega\b|st\.? ?john|isoflavone|red clover|\bclover\b|curcumin|resveratrol|quercetin|folic acid|ergocalciferol|ubidecarenone|coenzyme|\bcoq|creatine|pterostilbene/i;
function classifyCuration(drug) {
  const d = String(drug ?? ""); const s = d.trim().toLowerCase();
  if (CUR_EXCLUDE_EXACT.has(s) || CUR_EXCLUDE_RE.test(d)) return "exclude";
  if (CUR_COMBO_RE.test(d)) return "combination";
  if (CUR_SUPPL_RE.test(d)) return "supplement";
  return "drug";
}
const CLASS_TO_MOLECULE = { "aromatase inhibitors": "Letrozole", "anti-androgens": "Spironolactone" };
const CLASS_ROLLUP = new Set(["ssris","snris","ssri/snris","snri/ssris","gnrh agonist","gnrh agonists","gnrha"]);
function resolveDrugClass(drug) {
  const s = String(drug ?? "").trim().toLowerCase();
  if (s in CLASS_TO_MOLECULE) return { molecule: CLASS_TO_MOLECULE[s] };
  if (CLASS_ROLLUP.has(s)) return { rollup: true };
  return null;
}

function toArm(sig) {
  const dims = DIMS.map((d) => ({
    key: d.key,
    label: d.label,
    score: Math.max(0, Math.min(2, num(sig[`${d.key}_score`]))),
    rationale: sig[`${d.key}_rationale`] ? String(sig[`${d.key}_rationale`]) : "",
  }));
  return {
    arm: String(sig.arm),
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
function deriveHeadline(arms) {
  const direct = arms.find((a) => a.arm === "direct" && a.strength >= 3);
  if (direct) return { status: "clinical", anchor: direct };
  const strongest = [...arms].sort((a, b) => b.armScore - a.armScore)[0];
  const nonTrivial = arms.length >= 2 || strongest.tier !== "exploratory";
  return { status: nonTrivial ? "unvalidated_signal" : "preliminary", anchor: strongest };
}

const SIGNAL_COLS =
  "id, intervention_id, condition_id, aspect, arm," +
  " corroboration_score, rigor_score, specificity_score, plausibility_score, consistency_score," +
  " corroboration_rationale, rigor_rationale, specificity_rationale, plausibility_rationale, consistency_rationale," +
  " arm_strength, arm_score, confidence_tier," +
  " female_applicability_band, female_applicability_multiplier, female_applicability_rationale," +
  " contradiction_flag, num_contradictions, precision_note, needs_fulltext," +
  " synthesis_summary, mechanism_hypothesis, claim_ids, status";

async function getSexPkMap() {
  const map = new Map();
  const { data } = await supabase
    .from("compound_pk")
    .select("compound_id, parameter, sex, direction, magnitude, source_ref, source_url, note");
  for (const row of data ?? []) {
    const cid = row.compound_id ? String(row.compound_id) : "";
    if (!cid) continue;
    const fact = {
      parameter: String(row.parameter ?? ""),
      sex: String(row.sex ?? ""),
      direction: row.direction ? String(row.direction) : undefined,
      magnitude: row.magnitude ? String(row.magnitude) : undefined,
      source: row.source_ref ? String(row.source_ref) : undefined,
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
      note: row.note ? String(row.note) : undefined,
    };
    (map.get(cid) ?? map.set(cid, []).get(cid)).push(fact);
  }
  return map;
}
async function getPhaseMap() {
  const map = new Map();
  const { data } = await supabase
    .from("compound_condition_phase")
    .select("compound_id, condition_id, cycle_phase, pattern, dosing_note, source_ref, source_url");
  for (const row of data ?? []) {
    const cid = row.compound_id ? String(row.compound_id) : "";
    const condId = row.condition_id ? String(row.condition_id) : "";
    if (!cid || !condId) continue;
    const fact = {
      cyclePhase: String(row.cycle_phase ?? ""),
      pattern: row.pattern ? String(row.pattern) : undefined,
      dosingNote: row.dosing_note ? String(row.dosing_note) : undefined,
      source: row.source_ref ? String(row.source_ref) : undefined,
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
    };
    const key = `${cid}::${condId}`;
    (map.get(key) ?? map.set(key, []).get(key)).push(fact);
  }
  return map;
}

async function build() {
  const [sigRes, entRes, claimRes, condRes, compRes, sexMap, phaseMap] = await Promise.all([
    supabase.from("substrate_signals").select(SIGNAL_COLS).eq("status", "active"),
    supabase.from("entities").select("id, type, label"),
    supabase.from("claims").select("id, exact_quote, text, direction, documents(source, external_id, url, title)"),
    supabase.from("conditions").select("id, name, slug"),
    supabase.from("compounds").select("id, name, fda_status, original_indication, drug_class"),
    getSexPkMap(),
    getPhaseMap(),
  ]);

  const signals = sigRes.data ?? [];
  if (!signals.length) { console.error("No active signals returned."); process.exit(1); }

  const label = new Map();
  for (const e of entRes.data ?? []) label.set(String(e.id), String(e.label));

  const slugByName = new Map();
  const condIdByName = new Map();
  for (const c of condRes.data ?? []) {
    if (c.name && c.slug) slugByName.set(String(c.name).toLowerCase(), String(c.slug));
    if (c.name && c.id) condIdByName.set(String(c.name).toLowerCase(), String(c.id));
  }
  const compByName = new Map();
  const compIdByName = new Map();
  for (const c of compRes.data ?? []) {
    compByName.set(String(c.name).toLowerCase(), c);
    if (c.id) compIdByName.set(String(c.name).toLowerCase(), String(c.id));
  }

  const claimById = new Map();
  for (const c of claimRes.data ?? []) {
    const doc = Array.isArray(c.documents) ? c.documents[0] : c.documents;
    claimById.set(String(c.id), {
      quote: String(c.exact_quote || c.text || "").trim(),
      direction: String(c.direction ?? ""),
      src: sourceLabel(doc),
      href: sourceHref(doc),
      rank: claimRank(doc),
    });
  }

  const pairs = new Map();
  for (const s of signals) {
    if (!ARMS.includes(String(s.arm))) continue;
    const key = `${s.intervention_id}::${s.condition_id}`;
    (pairs.get(key) ?? pairs.set(key, []).get(key)).push(s);
  }

  const out = [];
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
    const safetyArms = allArms.filter((a) => a.aspect === "safety");
    const headlineSrc = allArms.filter((a) => a.aspect !== "safety");
    const byArm = new Map();
    for (const a of headlineSrc.length ? headlineSrc : safetyArms) {
      const cur = byArm.get(a.arm);
      if (!cur || a.armScore > cur.armScore) byArm.set(a.arm, a);
    }
    const arms = [...byArm.values()];
    const { status, anchor } = deriveHeadline(arms);
    for (const a of arms) a.isAnchor = a === anchor;

    const claimIds = new Set();
    for (const r of rows) {
      const ids = Array.isArray(r.claim_ids) ? r.claim_ids.map(String) : [];
      ids.forEach((id) => claimIds.add(id));
    }
    const claims = [...claimIds]
      .map((id) => claimById.get(id))
      .filter((c) => c && c.quote)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 4)
      .map((c) => ({ type: "extract", text: c.quote, src: c.src, href: c.href }));

    const comp = compByName.get(drug.toLowerCase()) ?? null;
    const origin = comp
      ? [comp.fda_status ? String(comp.fda_status) : "Approved",
         comp.original_indication ? clip(String(comp.original_indication), 60) : ""].filter(Boolean).join(" · ")
      : "Existing drug · repurposing candidate";

    const anyContradiction = arms.some((a) => a.contradictionFlag);
    const dims = {};
    for (const d of anchor.dimensions) dims[d.key] = lvl(d.score);

    const compoundId = compIdByName.get(drug.toLowerCase());
    const conditionId = condIdByName.get(condition.toLowerCase());
    const sexPk = compoundId ? sexMap.get(compoundId) : undefined;
    const cyclePhase = compoundId && conditionId ? phaseMap.get(`${compoundId}::${conditionId}`) : undefined;
    const { matrixPercentile, matrixDetail } = matrixForPair(drug, condition);
    const trialStatus = getTrialStatusForPair(drug, condition);
    const orangeBook = getOrangeBookForDrug(drug);
    const indication = getIndicationForPair(drug, condition);

    const cls = resolveDrugClass(drug);
    const displayDrug = cls && cls.molecule ? cls.molecule : drug;
    const curationClass = cls ? (cls.molecule ? "drug" : "class") : classifyCuration(drug);

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
      drugClass: comp && comp.drug_class ? String(comp.drug_class) : undefined,
      pathway: anchor.tier === "exploratory"
        ? "Hypothesis-generation · pre-validation"
        : "505(b)(2) · existing active ingredient, new indication",
      direction: anyContradiction ? "contradicts" : anchor.tier === "exploratory" ? "silent" : "supports",
      rationale: anchor.synthesis || `${displayDrug} surfaced as a substrate signal for ${condition}.`,
      mechanism: anchor.mechanism || "Mechanism not yet characterized in the substrate.",
      dims,
      dimBreakdown: anchor.dimensions.map((d) => ({ key: d.key, label: d.label, score: d.score, level: lvl(d.score), rationale: d.rationale })),
      signalType: anchor.arm,
      evidenceStrength: anchor.tier,
      claims,
      validationStatus: status,
      femaleApplicability: anchor.female,
      arms,
      safetyArms: safetyArms.length ? safetyArms : undefined,
      matrixPercentile,
      matrixDetail,
      sexPk: sexPk && sexPk.length ? sexPk : undefined,
      cyclePhase: cyclePhase && cyclePhase.length ? cyclePhase : undefined,
      trialStatus,
      orangeBook,
      indication,
    });
  }

  // collapse class→molecule duplicates (keep higher score per drug+condition)
  const bestByKey = new Map();
  const final = [];
  for (const c of out) {
    if (c.curationClass !== "drug") { final.push(c); continue; }
    const key = `${c.drug.toLowerCase()}::${c.conditionId}`;
    const prev = bestByKey.get(key);
    if (!prev) { bestByKey.set(key, c); final.push(c); }
    else if (c.score > prev.score) { final[final.indexOf(prev)] = c; bestByKey.set(key, c); }
  }

  const vWeight = { clinical: 2, unvalidated_signal: 1, preliminary: 0 };
  final.sort((a, b) =>
    b.score - a.score ||
    (vWeight[b.validationStatus ?? "preliminary"] - vWeight[a.validationStatus ?? "preliminary"]) ||
    a.drug.localeCompare(b.drug));
  // renumber WHEL-C ids in sorted (display) order to match the site
  final.forEach((c, i) => { c.id = `WHEL-C-${String(i + 1).padStart(3, "0")}`; });

  // tier + condition distributions for the meta block
  const byCondition = {};
  const tierTotals = { strong: 0, moderate: 0, emerging: 0, exploratory: 0 };
  const curationTotals = { drug: 0, combination: 0, supplement: 0, exclude: 0, class: 0 };
  for (const c of final) {
    tierTotals[c.tier] += 1;
    curationTotals[c.curationClass] += 1;
    const s = (byCondition[c.conditionId] ??= { strong: 0, moderate: 0, emerging: 0, exploratory: 0, total: 0 });
    s[c.tier] += 1; s.total += 1;
  }

  const snapshot = {
    _meta: {
      built: new Date().toISOString(),
      source: "Whel substrate (substrate_signals + entities + claims + compounds) with committed side-layers (MATRIX, DailyMed, Orange Book, ClinicalTrials.gov)",
      builder: "scripts/build-corpus-snapshot.mjs",
      note: "Full curated corpus as surfaced on the public site. Descriptive research context, human-in-the-loop; not clinical or regulatory advice. Point-in-time — re-run to refresh.",
      candidate_count: final.length,
      conditions: Object.keys(byCondition).sort(),
      tier_distribution: tierTotals,
      curation_distribution: curationTotals,
      curation_note: "curationClass: 'drug' = clean single-agent candidate (the public index); 'combination' = multi-agent regimen; 'supplement' = supplement/herbal (adjunct); 'exclude' = non-drug/procedure/junk. All are kept here so a client sees the full picture; the site shows only 'drug'.",
      by_condition: byCondition,
    },
    candidates: final,
  };

  const outPath = path.join(LIB, "corpus-snapshot.json");
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote ${final.length} candidates across ${Object.keys(byCondition).length} conditions to lib/corpus-snapshot.json`);
  console.log("Tier distribution:", tierTotals);
}

build().catch((e) => { console.error(e); process.exit(1); });
