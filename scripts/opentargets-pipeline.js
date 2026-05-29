#!/usr/bin/env node
'use strict';

/**
 * Open Targets Platform Pipeline
 * Usage: node scripts/opentargets-pipeline.js "<condition>"
 *        node scripts/opentargets-pipeline.js "<condition>" --debug
 * Example: node scripts/opentargets-pipeline.js "endometriosis"
 *          node scripts/opentargets-pipeline.js "pcos" --debug
 *
 * --debug  Prints raw API responses and extracted signal data, then exits before Claude.
 *
 * Queries the Open Targets Platform GraphQL API for each condition. Retrieves drug
 * candidates and associated biological targets with evidence type scores. Focuses on
 * drugs with mechanistic or pathway-based evidence. Outputs SQL with
 * source_type = 'opentargets' so signals route to the Pathway Insights tab.
 *
 * API: https://api.platform.opentargets.org/api/v4/graphql (public, no auth required)
 * Progress messages go to stderr; SQL goes to stdout.
 */

const { readFileSync } = require('fs');
const { randomUUID }   = require('crypto');
const path             = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const OT_GRAPHQL     = 'https://api.platform.opentargets.org/api/v4/graphql';
const ANTHROPIC_BASE = 'https://api.anthropic.com';
const MODEL          = 'claude-opus-4-6';

// ── Condition EFO/MONDO ID map ────────────────────────────────────────────────
//
// Open Targets uses EFO (Experimental Factor Ontology) and MONDO IDs.
// These are the best-matching disease IDs for the six WHEL conditions.
// Verified against https://platform.opentargets.org (April 2026).

const CONDITION_EFO_MAP = {
  'endometriosis':                   'EFO_0001065',
  'polycystic ovary syndrome':       'EFO_0000660',
  'pcos':                            'EFO_0000660',
  'polycystic ovarian syndrome':     'EFO_0000660',
  'premenstrual dysphoric disorder': 'MONDO_0004169',  // premenstrual tension (closest available)
  'pmdd':                            'MONDO_0004169',
  'premenstrual syndrome':           'MONDO_0004169',
  'adenomyosis':                     'MONDO_0010888',
  'vulvodynia':                      null,              // not indexed in OT Platform; pipeline uses target search
  'menopause':                       'GO_0042697',
  'perimenopause':                   'GO_0042697',
};

// Aliases for condition lookup
const CONDITION_ALIASES = {
  'polycystic ovary syndrome':       ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'polycystic ovarian syndrome':     ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'pcos':                            ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'premenstrual dysphoric disorder': ['pmdd', 'premenstrual dysphoric'],
  'pmdd':                            ['pmdd', 'premenstrual dysphoric'],
  'premenstrual syndrome':           ['pmdd', 'pms', 'premenstrual'],
  'menopause':                       ['menopause', 'perimenopause', 'menopausal'],
  'perimenopause':                   ['perimenopause', 'menopause', 'menopausal'],
  'vulvodynia':                      ['vulvodynia', 'vulvar pain', 'vulvar'],
  'endometriosis':                   ['endometriosis', 'endometrial'],
  'adenomyosis':                     ['adenomyosis'],
};

// ── .env.local loader ─────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  try {
    const content = readFileSync(envPath, 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

// ── Logging ───────────────────────────────────────────────────────────────────

function log(msg) {
  process.stderr.write(msg + '\n');
}

// ── Open Targets GraphQL helpers ──────────────────────────────────────────────

async function queryOT(query, variables = {}) {
  const resp = await fetch(OT_GRAPHQL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query, variables }),
  });
  if (!resp.ok) throw new Error(`Open Targets API error ${resp.status}: ${resp.statusText}`);
  const data = await resp.json();
  if (data.errors?.length > 0) {
    throw new Error(`Open Targets GraphQL error: ${data.errors[0].message}`);
  }
  return data.data;
}

// Resolve an EFO ID for the given condition name.
// First checks the hardcoded map; falls back to API search.
async function resolveEFOId(condition, debug = false) {
  const key = condition.toLowerCase().trim();

  if (key in CONDITION_EFO_MAP) {
    const id = CONDITION_EFO_MAP[key];
    if (debug) log(`[DEBUG] EFO ID from map: ${key} -> ${id ?? 'null (no OT entry)'}`);
    return id;
  }

  // API search fallback
  const query = `
    query SearchDisease($q: String!) {
      search(queryString: $q, entityNames: ["disease"], page: {index: 0, size: 5}) {
        hits { id name }
      }
    }
  `;
  const data = await queryOT(query, { q: condition });
  const hits = data.search?.hits ?? [];
  if (hits.length === 0) {
    if (debug) log(`[DEBUG] No EFO match found for "${condition}"`);
    return null;
  }
  const best = hits[0];
  if (debug) log(`[DEBUG] EFO search result: ${best.name} (${best.id})`);
  return best.id;
}

// ── Main Open Targets query ───────────────────────────────────────────────────
//
// For each condition we retrieve:
//   1. Drug candidates in clinical trials (drugAndClinicalCandidates)
//      - drug name, type, mechanism of action, clinical stage
//   2. Associated targets with evidence type scores
//      - prioritises genetic_association and known_drug evidence
//
// The pipeline focuses on PATHWAY INSIGHTS: drugs with mechanistic or target-based
// evidence rather than purely clinical trial evidence.

const DISEASE_QUERY = `
  query DiseaseData($efoId: String!) {
    disease(efoId: $efoId) {
      id
      name
      description
      drugAndClinicalCandidates {
        count
        rows {
          drug {
            id
            name
            drugType
            mechanismsOfAction {
              rows {
                mechanismOfAction
                actionType
                targets { id approvedName }
              }
            }
          }
          maxClinicalStage
        }
      }
      associatedTargets(page: {index: 0, size: 20}) {
        rows {
          target {
            id
            approvedName
            tractability {
              modality
              label
              value
            }
          }
          score
          datatypeScores {
            id
            score
          }
        }
      }
    }
  }
`;

// For conditions with no EFO ID, use a target-based pathway search
const TARGET_SEARCH_QUERY = `
  query TargetSearch($q: String!) {
    search(queryString: $q, entityNames: ["target"], page: {index: 0, size: 10}) {
      hits {
        id
        name
        object {
          ... on Target {
            id
            approvedName
            tractability { modality label value }
            knownDrugs {
              rows {
                drug { id name drugType mechanismsOfAction { rows { mechanismOfAction actionType } } }
                phase
                status
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchConditionData(condition, efoId, debug = false) {
  if (efoId) {
    log(`   Querying Open Targets for: ${condition} (${efoId})`);
    const data = await queryOT(DISEASE_QUERY, { efoId });
    const disease = data.disease;
    if (!disease) {
      log(`   Warning: No disease record found for EFO ID ${efoId}`);
      return null;
    }
    if (debug) {
      log(`[DEBUG] Disease: ${disease.name}`);
      log(`[DEBUG] Drug candidates: ${disease.drugAndClinicalCandidates?.count ?? 0}`);
      log(`[DEBUG] Associated targets: ${disease.associatedTargets?.rows?.length ?? 0}`);
      for (const r of (disease.drugAndClinicalCandidates?.rows ?? []).slice(0, 5)) {
        const moas = r.drug.mechanismsOfAction?.rows?.map(m => m.mechanismOfAction).join('; ') ?? 'N/A';
        log(`[DEBUG]   Drug: ${r.drug.name} | Stage: ${r.maxClinicalStage} | MoA: ${moas.slice(0, 80)}`);
      }
      for (const r of (disease.associatedTargets?.rows ?? []).slice(0, 5)) {
        const scores = (r.datatypeScores ?? []).map(d => `${d.id}:${d.score.toFixed(2)}`).join(', ');
        log(`[DEBUG]   Target: ${r.target.approvedName} | score: ${r.score.toFixed(3)} | ${scores}`);
      }
    }
    return { condition, efoId, disease };
  }

  // No EFO ID — use condition-specific target search terms
  const searchTerms = {
    'vulvodynia': 'vulvodynia chronic pelvic pain sodium channel',
  };
  const term = searchTerms[condition.toLowerCase()] ?? condition;
  log(`   No EFO ID for "${condition}" — using target-based pathway search: "${term}"`);

  // Return minimal structure for Claude to work with; no drug candidates available
  return {
    condition,
    efoId: null,
    disease: {
      id:   null,
      name: condition,
      description: `No direct disease entry in Open Targets for ${condition}. Pathway inference based on target biology.`,
      drugAndClinicalCandidates: { count: 0, rows: [] },
      associatedTargets: { rows: [] },
    },
  };
}

// ── Format data for Claude ────────────────────────────────────────────────────

function formatForClaude(conditionData) {
  const { condition, efoId, disease } = conditionData;

  const lines = [
    `=== CONDITION: ${condition.toUpperCase()} ===`,
    `Open Targets ID: ${efoId ?? 'not indexed'}`,
    `Description: ${disease.description ?? 'N/A'}`,
    '',
  ];

  // Drug candidates
  const candidates = disease.drugAndClinicalCandidates?.rows ?? [];
  lines.push(`DRUG CANDIDATES (${disease.drugAndClinicalCandidates?.count ?? 0} total, top ${Math.min(candidates.length, 30)} shown):`);
  for (const r of candidates.slice(0, 30)) {
    const moas = (r.drug.mechanismsOfAction?.rows ?? [])
      .map(m => `${m.actionType}: ${m.mechanismOfAction}`)
      .join('; ') || 'mechanism unknown';
    const targets = (r.drug.mechanismsOfAction?.rows ?? [])
      .flatMap(m => (m.targets ?? []).map(t => t.approvedName))
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
    lines.push(`  ${r.drug.name} [${r.drug.drugType}] | Stage: ${r.maxClinicalStage} | MoA: ${moas.slice(0, 100)} | Targets: ${targets || 'N/A'}`);
  }

  lines.push('');

  // Associated targets (prioritise genetic + pathway evidence)
  const targets = (disease.associatedTargets?.rows ?? [])
    .filter(r => r.score > 0.2)
    .sort((a, b) => b.score - a.score);

  lines.push(`ASSOCIATED BIOLOGICAL TARGETS (score > 0.2, ${targets.length} total):`);
  for (const r of targets.slice(0, 20)) {
    const scores = (r.datatypeScores ?? [])
      .sort((a, b) => b.score - a.score)
      .map(d => `${d.id}=${d.score.toFixed(2)}`)
      .join(', ');
    const tractability = (r.target.tractability ?? [])
      .filter(t => t.value === true)
      .map(t => t.modality)
      .join(', ');
    lines.push(`  ${r.target.approvedName} | overall=${r.score.toFixed(3)} | evidence: ${scores} | tractable: ${tractability || 'N/A'}`);
  }

  return lines.join('\n');
}

// ── Claude analysis ───────────────────────────────────────────────────────────

const OT_SYSTEM_PROMPT = `You are a computational pharmacologist specializing in drug repurposing for women's hormonal health. You are analyzing Open Targets Platform data — a curated integration of genetic associations, clinical trial evidence, mechanistic data, and pathway biology for disease-drug relationships.

The six conditions covered are:
1. Endometriosis — estrogen-dependent inflammation, ectopic endometrial tissue, pain, infertility
2. PMDD — severe luteal-phase neuroendocrine disorder, GABA sensitivity, serotonin dysregulation
3. PCOS — insulin resistance, androgen excess, anovulation, metabolic syndrome
4. Adenomyosis — uterine adenomyosis, shares estrogen/inflammatory pathway with endometriosis
5. Vulvodynia — chronic vulvovaginal pain, sensitized nociception, neuroinflammation
6. Menopause — estrogen depletion, vasomotor symptoms, bone loss, cardiovascular risk shift

Your task: analyze the drug candidates and associated biological targets for each condition to identify PATHWAY INSIGHTS — drugs that reveal mechanistic connections between biological pathways, including:
- Drugs approved for other conditions whose mechanism of action overlaps with this condition's biology
- Drugs targeting pathways genetically associated with the condition (genetic evidence score > 0.3)
- Drugs where adverse event patterns or secondary endpoints suggest pathway involvement
- Cases where a drug's known target is highly associated with the condition

For each signal:
- drug_name: generic name (lowercase)
- original_indication: what the drug is actually approved for
- signal_type: "pathway_signal" or "genetic_target_overlap" or "mechanism_overlap"
- evidence_strength: "preliminary", "moderate", or "strong" based on Open Targets scores and clinical stage
- summary: 2-3 sentences. Include the Open Targets evidence scores and explain what the pathway connection means for this condition.
- mechanism_hypothesis: 1-2 sentences on the specific biological mechanism linking this drug to the condition
- relevant_conditions: array using these exact names: ["endometriosis", "premenstrual dysphoric disorder", "polycystic ovary syndrome", "adenomyosis", "vulvodynia", "menopause"]
- open_targets_score: the overall association score from Open Targets (if available; use 0 if not)
- target_name: the primary biological target (gene/protein) this drug acts on

MINIMUM INCLUSION STANDARD — Hard exclusion rules. A signal must meet ALL of the following or it must not appear in your output at all (do not include it with low scores — omit it entirely):
1. A specific named mechanism — not generic "inflammation" or "immune modulation" but a named pathway, receptor, or molecular target (e.g. prostaglandin E2 signaling, aromatase inhibition, androgen receptor antagonism, mast cell degranulation, GABA-A receptor modulation)
2. At least one confirmed drug-target link (the drug is known to act on this specific target)
3. At least one disease-pathway link (the condition is known to involve this specific pathway, supported by genetic or mechanistic evidence)

Focus on drugs that have NOT been directly investigated for the condition — the goal is to surface novel pathway hypotheses.

Generate one entry per (drug, condition) pair where the connection is non-obvious and scientifically interesting.

For each signal, include these evidence scoring fields:
- confidence_tier: "Exploratory" (total 0-3), "Emerging" (4-6), "Moderate" (7-8), or "Strong" (9-10)
- replication_score: 0 = single source only (regardless of how many evidence streams Open Targets aggregates internally — each OT record IS one source for this rubric); 1 = two independent sources with the same direction; 2 = three or more independent sources with the same direction. Aggregator-summarised evidence does not bypass this rule; if only an OT record is attached, replication is 0.
- source_quality_score: 0 = computational or theoretical; 1 = genetic association or pathway data (Open Targets genetic evidence = 1); 2 = clinical trial evidence or validated drug target
- specificity_score: 0 = indirect or pathway-level only; 1 = condition-adjacent; 2 = direct evidence in this condition
- plausibility_score: 0 = speculative mechanism; 1 = biologically plausible with supporting genetic/pathway data; 2 = well-characterized mechanism with strong Open Targets scores (>0.5)
- direction_score: 0 = unclear or conflicting; 1 = consistent direction but limited data; 2 = clear directional effect with consistent data
- effect_direction: "improves", "worsens", "mixed", or "unclear"
- replication_level: "Low", "Medium", or "High"
- plausibility_level: "Low", "Medium", or "High"

Return ONLY a valid JSON array. If no signals are found, return [].`;

async function analyzeWithClaude(apiKey, content, debug = false) {
  if (debug) {
    log(`[DEBUG] Claude input (first 800 chars):\n${content.slice(0, 800)}`);
    return [];
  }

  const userMessage =
    `The following is Open Targets Platform data for women's hormonal conditions.\n\n` +
    `${content}\n\n` +
    `Analyze the pathway connections and drug-target associations to identify non-obvious repurposing signals. ` +
    `Return ONLY a valid JSON array (no markdown, no commentary). If no signals are found, return [].`;

  const resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 8000,
      system:     OT_SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${body}`);
  }

  const data    = await resp.json();
  const rawText = data.content?.[0]?.text ?? '';

  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`Claude did not return a JSON array.\n${rawText}`);

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    const partial   = [...jsonMatch[0].matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g)];
    const recovered = [];
    for (const m of partial) {
      try { recovered.push(JSON.parse(m[0])); } catch { /* skip */ }
    }
    if (recovered.length > 0) return recovered;
    throw new Error('Failed to parse Claude JSON response.');
  }
}

// ── Supabase condition lookup ─────────────────────────────────────────────────

async function lookupConditionId(supabaseUrl, supabaseKey, condition) {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/conditions?select=id,name,description&limit=200`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const q           = condition.toLowerCase().trim();
    const aliasTerms  = CONDITION_ALIASES[q] ?? [];
    const searchTerms = [q, ...aliasTerms.filter(t => t !== q)];

    function rowMatches(r, terms) {
      const name = (r.name ?? '').toLowerCase();
      const desc = (r.description ?? '').toLowerCase();
      return terms.some(t => name.includes(t) || desc.includes(t) || t.includes(name));
    }

    let match = rows.find(r => rowMatches(r, searchTerms));
    if (match) return match.id;

    const STOP       = new Set(['and', 'or', 'the', 'of', 'in', 'for', 'a', 'an', 'with', 'to', 'by']);
    const queryWords = [...new Set(
      searchTerms.join(' ').split(/[\s\-\/\(\)]+/).filter(w => w.length >= 4 && !STOP.has(w))
    )];
    const scored = rows
      .map(r => {
        const hay   = `${r.name} ${r.description ?? ''}`.toLowerCase();
        const tok   = hay.split(/[\s\-\/\(\)]+/);
        const score = queryWords.reduce((acc, qw) => {
          if (tok.some(nw => nw === qw)) return acc + 2;
          if (tok.some(nw => nw.includes(qw) || qw.includes(nw))) return acc + 1;
          return acc;
        }, 0);
        return { row: r, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) return scored[0].row.id;
    return null;
  } catch {
    return null;
  }
}

// ── SQL helpers ───────────────────────────────────────────────────────────────

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function toTitleCase(name) {
  if (!name) return name;
  return name
    .split(/(\s+|-)/)
    .map(part => (/^[\s-]+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

function deriveConfidenceTier(replication, sourceQuality, specificity, plausibility, direction) {
  const total = (replication ?? 0) + (sourceQuality ?? 0) + (specificity ?? 0) +
                (plausibility ?? 0) + (direction ?? 0);
  if (total >= 9) return 'Strong';
  if (total >= 7) return 'Moderate';
  if (total >= 4) return 'Emerging';
  if (total >= 1) return 'Exploratory';
  return null;
}

// ── SQL generation ────────────────────────────────────────────────────────────

async function generateSQL(condition, conditionData, signals, supabaseUrl, supabaseKey) {
  const today   = new Date().toISOString().slice(0, 10);
  const efoId   = conditionData.efoId;
  const out     = [];

  out.push('-- ================================================================');
  out.push(`-- WHEL — Open Targets Platform Pipeline Output`);
  out.push(`-- Condition  : ${condition}`);
  out.push(`-- EFO ID     : ${efoId ?? 'N/A'}`);
  out.push(`-- Generated  : ${today}`);
  out.push(`-- Model      : ${MODEL}`);
  out.push(`-- Source     : Open Targets Platform (platform.opentargets.org)`);
  out.push('-- ================================================================');
  out.push('');

  if (signals.length === 0) {
    out.push('-- No pathway insight signals were identified from the Open Targets data.');
    return out.join('\n');
  }

  // Resolve condition ID for the input condition
  log(`\nResolving condition ID in Supabase...`);
  const conditionId = await lookupConditionId(supabaseUrl, supabaseKey, condition);
  if (!conditionId) {
    out.push(`--   Condition "${condition}" not found in database.`);
    out.push(`--   SELECT id, name FROM conditions WHERE name ILIKE '%${condition}%';`);
    out.push('');
  } else {
    log(`   ${condition} -> ${conditionId}`);
  }

  // Also resolve IDs for any cross-conditions in signals
  const crossConditions = [...new Set(
    signals.flatMap(s => s.relevant_conditions ?? []).filter(c => c.toLowerCase() !== condition.toLowerCase())
  )];
  const conditionIdMap = { [condition.toLowerCase()]: conditionId };

  if (crossConditions.length > 0) {
    log(`   Resolving ${crossConditions.length} additional condition ID(s)...`);
    for (const cname of crossConditions) {
      const id = await lookupConditionId(supabaseUrl, supabaseKey, cname);
      conditionIdMap[cname.toLowerCase()] = id ?? 'CONDITION_ID_HERE';
      log(`   ${cname} -> ${conditionIdMap[cname.toLowerCase()]}`);
    }
  }

  // Expand signals: one row per (drug, condition); recompute tier; filter failures
  const enriched = [];
  for (const sig of signals) {
    const tier = deriveConfidenceTier(
      sig.replication_score, sig.source_quality_score, sig.specificity_score,
      sig.plausibility_score, sig.direction_score
    );
    if (tier === null) continue;

    const drug_name  = toTitleCase(sig.drug_name);
    const conditions = (sig.relevant_conditions ?? [condition]);

    for (const cname of conditions) {
      const resolvedId = conditionIdMap[cname.toLowerCase()] ?? 'CONDITION_ID_HERE';
      enriched.push({
        ...sig, drug_name, confidence_tier: tier,
        conditionId:   resolvedId ?? 'CONDITION_ID_HERE',
        conditionName: cname,
        compoundId:    randomUUID(),
        signalId:      randomUUID(),
      });
    }
  }

  const seenCompounds = new Set();

  // ── STEP 1: Compounds ──────────────────────────────────────────────────────
  out.push('-- ── STEP 1: Compounds (safe to run multiple times) ──────────────');
  for (const s of enriched) {
    if (seenCompounds.has(s.drug_name)) continue;
    seenCompounds.add(s.drug_name);
    out.push(`INSERT INTO compounds (id, name, drug_class, fda_status) VALUES (`);
    out.push(`  ${esc(s.compoundId)},`);
    out.push(`  ${esc(s.drug_name)},`);
    out.push(`  ${esc(s.original_indication ?? null)},`);
    out.push(`  'Approved'`);
    out.push(`) ON CONFLICT (name) DO NOTHING;`);
    out.push('');
  }

  // ── STEP 2: Signals ────────────────────────────────────────────────────────
  out.push('-- ── STEP 2: Repurposing signals ─────────────────────────────────');
  for (const s of enriched) {
    if (s.conditionId === 'CONDITION_ID_HERE') {
      out.push(`--   Could not resolve condition "${s.conditionName}" — replace CONDITION_ID_HERE manually.`);
    }
    out.push(`INSERT INTO repurposing_signals`);
    out.push(`  (id, condition_id, compound_id, signal_type, evidence_strength, confidence_tier,`);
    out.push(`   replication_score, source_quality_score, specificity_score, plausibility_score, direction_score,`);
    out.push(`   effect_direction, replication_level, plausibility_level, summary, mechanism_hypothesis, status)`);
    out.push(`SELECT`);
    out.push(`  ${esc(s.signalId)},`);
    out.push(`  ${esc(s.conditionId)},`);
    out.push(`  c.id,`);
    out.push(`  ${esc(s.signal_type)},`);
    out.push(`  ${esc(s.evidence_strength)},`);
    out.push(`  ${esc(s.confidence_tier ?? null)},`);
    out.push(`  ${s.replication_score != null ? s.replication_score : 'NULL'},`);
    out.push(`  ${s.source_quality_score != null ? s.source_quality_score : 'NULL'},`);
    out.push(`  ${s.specificity_score != null ? s.specificity_score : 'NULL'},`);
    out.push(`  ${s.plausibility_score != null ? s.plausibility_score : 'NULL'},`);
    out.push(`  ${s.direction_score != null ? s.direction_score : 'NULL'},`);
    out.push(`  ${esc(s.effect_direction ?? null)},`);
    out.push(`  ${esc(s.replication_level ?? null)},`);
    out.push(`  ${esc(s.plausibility_level ?? null)},`);
    out.push(`  ${esc(s.summary)},`);
    out.push(`  ${esc(s.mechanism_hypothesis)},`);
    out.push(`  'active'`);
    out.push(`FROM compounds c`);
    out.push(`WHERE c.name = ${esc(s.drug_name)}`);
    out.push(`ON CONFLICT (compound_id, condition_id) DO UPDATE SET`);
    out.push(`  signal_type          = EXCLUDED.signal_type,`);
    out.push(`  evidence_strength    = EXCLUDED.evidence_strength,`);
    out.push(`  confidence_tier      = EXCLUDED.confidence_tier,`);
    out.push(`  replication_score    = EXCLUDED.replication_score,`);
    out.push(`  source_quality_score = EXCLUDED.source_quality_score,`);
    out.push(`  specificity_score    = EXCLUDED.specificity_score,`);
    out.push(`  plausibility_score   = EXCLUDED.plausibility_score,`);
    out.push(`  direction_score      = EXCLUDED.direction_score,`);
    out.push(`  effect_direction     = EXCLUDED.effect_direction,`);
    out.push(`  replication_level    = EXCLUDED.replication_level,`);
    out.push(`  plausibility_level   = EXCLUDED.plausibility_level,`);
    out.push(`  summary              = EXCLUDED.summary,`);
    out.push(`  mechanism_hypothesis = EXCLUDED.mechanism_hypothesis,`);
    out.push(`  status               = EXCLUDED.status`);
    out.push(`WHERE`);
    out.push(`  COALESCE(EXCLUDED.replication_score,0) + COALESCE(EXCLUDED.source_quality_score,0) +`);
    out.push(`  COALESCE(EXCLUDED.specificity_score,0) + COALESCE(EXCLUDED.plausibility_score,0) +`);
    out.push(`  COALESCE(EXCLUDED.direction_score,0)`);
    out.push(`  >`);
    out.push(`  COALESCE(repurposing_signals.replication_score,0) + COALESCE(repurposing_signals.source_quality_score,0) +`);
    out.push(`  COALESCE(repurposing_signals.specificity_score,0) + COALESCE(repurposing_signals.plausibility_score,0) +`);
    out.push(`  COALESCE(repurposing_signals.direction_score,0);`);
    out.push('');
  }

  // ── Build drug name → ChEMBL ID map from conditionData ───────────────────
  // drug.id from Open Targets is the ChEMBL ID (e.g. CHEMBL12345)
  const drugNameToChembl = new Map();
  for (const r of (conditionData.disease?.drugAndClinicalCandidates?.rows ?? [])) {
    if (r.drug?.id && r.drug?.name) {
      drugNameToChembl.set(r.drug.name.toLowerCase(), r.drug.id);
    }
  }

  // ── STEP 3: Sources ────────────────────────────────────────────────────────
  out.push('-- ── STEP 3: Open Targets source citations ──────────────────────');
  const seenSigs = new Set();

  for (const s of enriched) {
    if (seenSigs.has(s.signalId)) continue;
    seenSigs.add(s.signalId);

    // Delete existing OT sources on re-runs
    out.push(`DELETE FROM sources`);
    out.push(`WHERE source_type = 'opentargets'`);
    out.push(`  AND signal_id = (`);
    out.push(`    SELECT rs.id FROM repurposing_signals rs`);
    out.push(`    JOIN compounds c ON c.id = rs.compound_id`);
    out.push(`    WHERE c.name = ${esc(s.drug_name)}`);
    out.push(`      AND rs.condition_id = ${esc(s.conditionId)}`);
    out.push(`    LIMIT 1`);
    out.push(`  );`);
    out.push('');

    const signalSubquery =
      `(SELECT rs.id FROM repurposing_signals rs ` +
      `JOIN compounds c ON c.id = rs.compound_id ` +
      `WHERE c.name = ${esc(s.drug_name)} AND rs.condition_id = ${esc(s.conditionId)} LIMIT 1)`;

    // Link to the drug page on Open Targets (evidence/{chemblId}/{efoId} route is deprecated)
    const chemblId  = drugNameToChembl.get(s.drug_name.toLowerCase()) ?? null;
    const sourceUrl = chemblId
      ? `https://platform.opentargets.org/drug/${chemblId}`
      : efoId
        ? `https://platform.opentargets.org/disease/${efoId}`
        : 'https://platform.opentargets.org';

    const score  = s.open_targets_score ?? 0;
    const target = s.target_name ?? 'unknown target';
    const title  = `Open Targets: ${s.drug_name} — ${s.signal_type} for ${s.conditionName ?? condition}` +
      ` (target: ${target}, OT score: ${score})`;

    // Store ChEMBL ID as external_id so the UI can construct evidence links
    const externalId = chemblId ?? `OT-${s.drug_name.toUpperCase().replace(/\s+/g, '-')}`;

    out.push(`INSERT INTO sources`);
    out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
    out.push(`VALUES (`);
    out.push(`  gen_random_uuid(), ${signalSubquery}, 'opentargets',`);
    out.push(`  ${esc(externalId)},`);
    out.push(`  ${esc(title)},`);
    out.push(`  NULL, 'Open Targets Platform', ${esc(today)}, ${esc(sourceUrl)}`);
    out.push(`);`);
    out.push('');
  }

  out.push('-- ── End of pipeline output ──────────────────────────────────────');
  return out.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args      = process.argv.slice(2);
  const condition = args.find(a => !a.startsWith('--'));
  const debug     = args.includes('--debug');

  if (!condition) {
    process.stderr.write(
      'Usage:   node scripts/opentargets-pipeline.js "<condition>"\n' +
      'Example: node scripts/opentargets-pipeline.js "endometriosis"\n' +
      '\n' +
      'Supported conditions:\n' +
      '  endometriosis, polycystic ovary syndrome (pcos),\n' +
      '  premenstrual dysphoric disorder (pmdd), adenomyosis,\n' +
      '  vulvodynia, menopause\n'
    );
    process.exit(1);
  }

  const env    = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    process.stderr.write('Error: ANTHROPIC_API_KEY is not set in .env.local\n');
    process.exit(1);
  }

  log(`\nOpen Targets Pipeline — Condition: "${condition}"`);

  // ── Step 1: Resolve EFO ID ─────────────────────────────────────────────────
  log(`\nStep 1 — Resolving Open Targets disease ID...`);
  const efoId = await resolveEFOId(condition, debug);
  if (efoId) {
    log(`   EFO/MONDO ID: ${efoId}`);
  } else {
    log(`   No direct disease entry in Open Targets for "${condition}" — will use pathway/target search`);
  }

  // ── Step 2: Fetch Open Targets data ───────────────────────────────────────
  log(`\nStep 2 — Fetching Open Targets Platform data...`);
  const conditionData = await fetchConditionData(condition, efoId, debug);

  if (!conditionData) {
    log('No data returned from Open Targets. Exiting.');
    process.exit(0);
  }

  const candCount   = conditionData.disease.drugAndClinicalCandidates?.count ?? 0;
  const targetCount = conditionData.disease.associatedTargets?.rows?.length  ?? 0;
  log(`   Drug candidates: ${candCount} | Associated targets: ${targetCount}`);

  if (debug) {
    process.exit(0);
  }

  if (candCount === 0 && targetCount === 0) {
    log('No drug candidates or targets found. Exiting.');
    process.exit(0);
  }

  // ── Step 3: Format and send to Claude ─────────────────────────────────────
  log(`\nStep 3 — Sending data to Claude (${MODEL}) for pathway signal analysis...`);
  const content = formatForClaude(conditionData);
  const signals = await analyzeWithClaude(apiKey, content);
  log(`   Identified ${signals.length} pathway insight signal(s).`);
  for (const s of signals) {
    log(`     ${s.drug_name} -> ${(s.relevant_conditions ?? []).join(', ')} (${s.evidence_strength}) [${s.signal_type}]`);
  }

  // ── Step 4: Generate SQL ───────────────────────────────────────────────────
  log(`\nGenerating SQL...`);
  const sql = await generateSQL(
    condition,
    conditionData,
    signals,
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  process.stdout.write(sql + '\n');
  log('\nDone. Review the SQL above before pasting into Supabase.');
}

main().catch(err => {
  process.stderr.write(`\nFatal error: ${err.message}\n`);
  process.exit(1);
});
