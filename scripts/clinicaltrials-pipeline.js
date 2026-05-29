#!/usr/bin/env node
'use strict';

/**
 * ClinicalTrials.gov Pipeline
 * Usage: node scripts/clinicaltrials-pipeline.js "<drug name>"
 *        node scripts/clinicaltrials-pipeline.js "<drug name>" --debug
 * Example: node scripts/clinicaltrials-pipeline.js "atorvastatin"
 *
 * --debug  Prints raw API responses and extracted AE data, then exits before Claude.
 *
 * Queries ClinicalTrials.gov for trials with posted adverse event results,
 * extracts condition-relevant AE terms, sends to Claude for analysis, outputs SQL.
 * Progress messages go to stderr; SQL goes to stdout.
 */

const { readFileSync } = require('fs');
const { randomUUID } = require('crypto');
const path = require('path');

// ── Config ─────────────────────────────────────────────────────────────────────

const CT_BASE = 'https://clinicaltrials.gov/api/v2/studies';
const CT_STUDY_URL = 'https://clinicaltrials.gov/study';
const ANTHROPIC_BASE = 'https://api.anthropic.com';
const MODEL = 'claude-opus-4-6';
const REQUEST_DELAY_MS = 500;
const MAX_TRIALS = 25; // max trials to fetch and analyze

// ── Condition-relevant AE terms (mirrors openfda-pipeline.js GYNAE_TERMS) ─────

const GYNAE_TERMS = [
  // Menstrual / cycle
  'menstrual', 'menstruation', 'dysmenorrhea', 'dysmenorrhoea', 'menorrhagia',
  'metrorrhagia', 'amenorrhea', 'amenorrhoea', 'oligomenorrhea', 'oligomenorrhoea',
  'irregular menstruation', 'uterine bleeding', 'abnormal uterine bleeding',
  'intermenstrual bleeding', 'heavy menstrual bleeding',

  // Pelvic / reproductive
  'endometriosis', 'endometrial', 'adenomyosis',
  'pelvic pain', 'pelvic', 'uterine', 'uterine pain', 'uterine spasm',
  'uterine fibroids', 'leiomyoma',
  'ovarian', 'ovarian cyst', 'ovarian pain', 'polycystic',
  'vaginal', 'vaginal pain', 'vaginal hemorrhage', 'vaginal haemorrhage',
  'vaginal discharge', 'vulval pain', 'vulvodynia', 'vulvar',
  'dyspareunia', 'sexual pain',
  'breast pain', 'mastalgia',

  // Pain
  'abdominal pain', 'abdominal', 'cramping', 'cramp',
  'pelvic floor', 'chronic pelvic pain',
  'headache', 'migraine',

  // Mood / neurological
  'depression', 'depressed mood', 'major depressive', 'anxiety', 'anxious',
  'mood', 'mood swings', 'irritability', 'irritable', 'emotional disturbance',
  'affect lability', 'crying', 'tearfulness',
  'insomnia', 'sleep disorder', 'sleep disturbance', 'hypersomnia',
  'fatigue', 'asthenia', 'cognitive', 'concentration impaired',
  'memory impairment', 'confusion',

  // Metabolic / hormonal
  'weight gain', 'weight increased', 'obesity',
  'insulin resistance', 'glucose', 'hyperglycemia', 'hyperglycaemia',
  'androgen', 'testosterone', 'hirsutism', 'hair loss', 'alopecia',
  'acne', 'hormone', 'hormonal',
  'fertility', 'infertility', 'anovulation', 'ovulation disorder',

  // Vasomotor (menopause)
  'hot flush', 'hot flash', 'hot flushes', 'hot flashes',
  'night sweat', 'night sweats', 'flushing', 'sweating', 'hyperhidrosis',

  // Inflammatory
  'inflammation', 'inflammatory', 'oedema', 'edema',
  'bloating', 'abdominal distension',

  // Sexual / urinary
  'libido', 'decreased libido', 'sexual dysfunction',
  'vaginismus', 'dyspareunia',
  'urinary incontinence', 'urinary tract', 'cystitis',
  'interstitial cystitis', 'bladder pain', 'urinary frequency',

  // Named conditions
  'premenstrual dysphoric disorder', 'pmdd', 'premenstrual syndrome',
  'polycystic ovary syndrome', 'pcos',
  'vulvodynia', 'menopause', 'perimenopause', 'menopausal',
];

// ── Condition aliases (same as openfda-pipeline.js) ───────────────────────────

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── ClinicalTrials.gov API ────────────────────────────────────────────────────

/**
 * Fetch trials for a drug that have posted results (including adverse events).
 * Returns an array of study objects from the CT API v2.
 */
async function fetchTrials(drugName, debug = false) {
  const params = new URLSearchParams({
    'query.intr': drugName,
    'aggFilters': 'results:with',
    'pageSize': String(MAX_TRIALS),
    'fields': [
      'protocolSection.identificationModule',
      'protocolSection.conditionsModule',
      'protocolSection.descriptionModule',
      'resultsSection.adverseEventsModule',
    ].join(','),
  });

  const url = `${CT_BASE}?${params}`;
  if (debug) log(`\n[DEBUG] ClinicalTrials URL:\n  ${url}`);

  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (debug) {
      const raw = await resp.text();
      log(`[DEBUG] CT status: ${resp.status} ${resp.statusText}`);
      log(`[DEBUG] CT response (first 1000 chars):\n  ${raw.slice(0, 1000)}`);
      return [];
    }
    if (!resp.ok) {
      log(`   ClinicalTrials.gov warning: ${resp.status} ${resp.statusText}`);
      return [];
    }
    const data = await resp.json();
    return data.studies ?? [];
  } catch (err) {
    log(`   ClinicalTrials.gov fetch error: ${err.message}`);
    return [];
  }
}

// ── AE extraction ─────────────────────────────────────────────────────────────

/**
 * Check if an AE term string is relevant to any of our 6 conditions.
 */
function isGynaeRelevant(term) {
  if (!term) return false;
  const lower = term.toLowerCase();
  return GYNAE_TERMS.some(t => lower.includes(t) || t.includes(lower));
}

/**
 * Extract adverse events from a study's resultsSection.
 * Returns { nctId, title, conditions, totalSubjects, relevantEvents }
 * where relevantEvents is an array of { term, count, type, groupLabel }.
 */
function extractAEs(study) {
  const id = study.protocolSection?.identificationModule;
  const nctId = id?.nctId ?? 'UNKNOWN';
  const title = id?.briefTitle ?? id?.officialTitle ?? 'Untitled study';
  const conditions = study.protocolSection?.conditionsModule?.conditions ?? [];
  const aeModule = study.resultsSection?.adverseEventsModule;

  if (!aeModule) return null;

  const relevantEvents = [];

  // Parse both serious and other (non-serious) events
  for (const [eventType, listKey] of [['serious', 'seriousEvents'], ['other', 'otherEvents']]) {
    const groups = aeModule[listKey] ?? [];
    for (const event of groups) {
      const term = event.term ?? event.organSystem ?? '';
      if (!term || !isGynaeRelevant(term)) continue;

      // Sum counts across all arms/groups
      const stats = event.stats ?? [];
      const count = stats.reduce((sum, s) => sum + (s.numAffected ?? s.numEvents ?? 0), 0);
      if (count === 0) continue;

      // Label from first group
      const groupLabel = aeModule.eventGroups?.[0]?.title ?? '';

      relevantEvents.push({ term, count, type: eventType, groupLabel });
    }
  }

  // Total participants across all groups
  const eventGroups = aeModule.eventGroups ?? [];
  const totalSubjects = eventGroups.reduce((sum, g) => sum + (g.seriousNumAffected ?? g.deathsNumAffected ?? 0), 0) ||
    aeModule.frequencyThreshold !== undefined
      ? null   // we have a threshold, not exact totals
      : null;

  // Try totalSubjectsAffected from the first group
  const subjectCount = eventGroups[0]?.totalNumSubjects ?? null;

  return { nctId, title, conditions, subjectCount, relevantEvents };
}

// ── Format for Claude ─────────────────────────────────────────────────────────

function formatForClaude(drugName, trialData) {
  if (trialData.length === 0) return '';

  const sections = trialData.map(t => {
    const eventLines = t.relevantEvents
      .sort((a, b) => b.count - a.count)
      .map(e => `  - ${e.term} (n=${e.count}, ${e.type} AE)`)
      .join('\n');

    const conditionList = t.conditions.length > 0
      ? t.conditions.join(', ')
      : 'not specified';

    const subjectInfo = t.subjectCount != null
      ? `Subjects in trial: ~${t.subjectCount}`
      : 'Subject count: not available';

    return (
      `=== TRIAL: ${t.nctId} ===\n` +
      `Title: ${t.title}\n` +
      `Indication(s) studied: ${conditionList}\n` +
      `${subjectInfo}\n` +
      `Condition-relevant adverse events:\n` +
      (eventLines || '  (none matched)') +
      `\nTrial URL: ${CT_STUDY_URL}/${t.nctId}`
    );
  });

  return (
    `Drug: ${drugName}\n` +
    `Trials with posted AE results: ${trialData.length}\n\n` +
    sections.join('\n\n')
  );
}

// ── Claude analysis ───────────────────────────────────────────────────────────

const CONDITIONS_CONTEXT = `
The six conditions covered by this research tool are:
1. Endometriosis — estrogen-dependent inflammatory condition; relevant AE categories: menstrual/cycle, pelvic/uterine pain, inflammatory, mood
2. PMDD (Premenstrual Dysphoric Disorder) — severe luteal-phase mood disorder; relevant: mood/neurological, menstrual, pain
3. PCOS (Polycystic Ovary Syndrome) — metabolic-hormonal condition; relevant: metabolic/hormonal, menstrual/cycle, ovarian, mood
4. Adenomyosis — uterine inflammatory condition; relevant: menstrual/uterine/pelvic pain, inflammatory (shares estrogen pathways with endometriosis)
5. Vulvodynia — chronic vulvovaginal pain; relevant: vulvar/vaginal pain, sexual pain, urinary, mood (chronic pain impact)
6. Menopause — hormonal transition; relevant: vasomotor, mood/neurological, metabolic, urinary/sexual

Key cross-condition overlaps:
- Endometriosis ↔ Adenomyosis: share inflammatory and estrogen-driven pathways
- PCOS ↔ all: metabolic and hormonal dysregulation creates upstream overlap
- Pain signals (pelvic, abdominal, vulvar): relevant to endometriosis, adenomyosis, AND vulvodynia
- Mood signals (depression, anxiety, irritability, insomnia): relevant to PMDD AND menopause; also secondary to chronic pain in endometriosis/vulvodynia
- Vasomotor signals (hot flush, night sweat): primarily menopause, but also relevant to surgical menopause secondary to endometriosis treatment
`.trim();

const CT_SYSTEM_PROMPT =
  `You are a medical research analyst. Analyze these clinical trial adverse event reports for signals that this drug may have incidental benefits or effects on women's health conditions: endometriosis, PMDD, PCOS, adenomyosis, vulvodynia, or menopause.

${CONDITIONS_CONTEXT}

Your task: for each relevant finding, generate ONE signal entry per condition it implicates. Do not collapse multiple conditions into one entry.

For each signal, provide:
- drug_name: the generic drug name (lowercase)
- signal_type: "clinical_trial_finding"
- evidence_strength: "preliminary", "moderate", or "strong"
- summary: 2–3 sentences. Reference the specific trial(s) and AE terms found. Note what the adverse event pattern may reveal about the drug's interaction with biological pathways relevant to the condition.
- mechanism_hypothesis: 1–2 sentences on the biological mechanism specific to this condition
- relevant_conditions: array of exact condition names — use only: ["endometriosis", "premenstrual dysphoric disorder", "polycystic ovary syndrome", "adenomyosis", "vulvodynia", "menopause"]
- trial_ids: array of NCT IDs that support this signal (e.g. ["NCT12345678"])
- ae_terms: object mapping relevant AE terms found across the supporting trials to their total counts. Example: {"vaginal hemorrhage": 12, "depression": 8, "pelvic pain": 4}

MINIMUM INCLUSION STANDARD — Hard exclusion rules. A signal must meet ALL of the following or it must not appear in your output at all (do not include it with low scores — omit it entirely):
1. At least one peer-reviewed human clinical trial with a clearly identified patient population, drug, and measurable outcome
2. A specific named outcome relevant to one of the six conditions (not vague AE terms like "pain" — must be specific: pelvic pain, dysmenorrhea, cycle changes, mood lability in luteal phase, vulvar symptoms, vasomotor symptoms)
3. A discernible direction of effect
4. A plausible mechanistic explanation that names a specific pathway, not generic "inflammation"

Only skip a signal if there is genuinely no AE pattern that could plausibly connect to any of the six conditions.

For each signal, include these evidence scoring fields:
- confidence_tier: "Exploratory" (total 0-3), "Emerging" (4-6), "Moderate" (7-8), or "Strong" (9-10)
- replication_score: 0 = single source only (regardless of source quality — even one RCT is replication=0); 1 = two independent sources with the same direction; 2 = three or more independent sources with the same direction. A clinical trial in one condition cited as evidence for a DIFFERENT condition does not bypass this rule.
- signal_type guidance: Use clinical_trial_finding ONLY when the trial directly enrolled patients with the target condition. If the trial was conducted in a DIFFERENT condition but the signal extrapolates to the target condition via a shared mechanism, use cross_condition_signal instead. Do not file mechanism-based extrapolation under clinical_trial_finding.
- source_quality_score: 0 = case reports or computational; 1 = observational, secondary endpoint, or registry data; 2 = RCT, meta-analysis, or large prospective cohort (clinical trial AE data = 1)
- specificity_score: 0 = indirect or pathway-level only; 1 = condition-adjacent; 2 = direct evidence in this condition
- plausibility_score: 0 = speculative mechanism; 1 = biologically plausible with supporting data; 2 = well-characterized mechanism with direct pathway evidence
- direction_score: 0 = unclear or conflicting; 1 = consistent direction but limited data; 2 = clear directional effect with consistent data
- effect_direction: "improves", "worsens", "mixed", or "unclear"
- replication_level: "Low", "Medium", or "High"
- plausibility_level: "Low", "Medium", or "High"

Return ONLY a valid JSON array. If nothing is noteworthy, return [].`;

async function analyzeWithClaude(apiKey, drugName, content) {
  const userMessage =
    `Drug: ${drugName}\n\n` +
    `The following is a summary of clinical trial adverse event data extracted from ClinicalTrials.gov ` +
    `for trials where ${drugName} was the intervention and AE results are posted.\n\n` +
    `INSTRUCTIONS:\n` +
    `1. For each drug with relevant findings, generate ONE signal entry PER CONDITION it implicates.\n` +
    `   Apply the cross-condition overlaps from your system prompt.\n` +
    `2. The ae_terms field must include ALL AE terms from the data relevant to that specific condition — not just a subset.\n` +
    `3. Return ONLY a valid JSON array (no markdown, no commentary). If no signals are found, return [].\n\n` +
    content;

  const resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: CT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  const rawText = data.content?.[0]?.text ?? '';

  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Claude did not return a JSON array. Raw response:\n${rawText}`);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Failed to parse Claude JSON: ${e.message}\nRaw: ${jsonMatch[0]}`);
  }
}

// ── Supabase condition lookup ──────────────────────────────────────────────────

async function lookupConditionId(supabaseUrl, supabaseKey, condition) {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const url = `${supabaseUrl}/rest/v1/conditions?select=id,name,description&limit=200`;
    const resp = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const q = condition.toLowerCase().trim();
    const aliasTerms = CONDITION_ALIASES[q] ?? [];
    const searchTerms = [q, ...aliasTerms.filter(t => t !== q)];

    function rowMatches(r, terms) {
      const name = (r.name ?? '').toLowerCase();
      const desc = (r.description ?? '').toLowerCase();
      return terms.some(term => {
        const t = term.toLowerCase();
        return name.includes(t) || desc.includes(t) || t.includes(name);
      });
    }

    let match = rows.find(r => rowMatches(r, searchTerms));
    if (match) return match.id;

    const STOP = new Set(['and', 'or', 'the', 'of', 'in', 'for', 'a', 'an', 'with', 'to', 'by']);
    const queryWords = [...new Set(
      searchTerms.join(' ').split(/[\s\-\/\(\)]+/).filter(w => w.length >= 4 && !STOP.has(w))
    )];

    const scored = rows
      .map(r => {
        const haystack = `${r.name} ${r.description ?? ''}`.toLowerCase();
        const haystackTokens = haystack.split(/[\s\-\/\(\)]+/);
        const score = queryWords.reduce((acc, qw) => {
          if (haystackTokens.some(nw => nw === qw))                          return acc + 2;
          if (haystackTokens.some(nw => nw.includes(qw) || qw.includes(nw))) return acc + 1;
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
    .map(part => {
      if (/^[\s-]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
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

async function generateSQL(drugName, signals, trialDataByNct, supabaseUrl, supabaseKey) {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];

  out.push('-- ================================================================');
  out.push('-- Rediscover Women — ClinicalTrials.gov Pipeline Output');
  out.push(`-- Drug       : ${drugName}`);
  out.push(`-- Generated  : ${today}`);
  out.push(`-- Model      : ${MODEL}`);
  out.push('-- Source     : ClinicalTrials.gov');
  out.push('-- ================================================================');
  out.push('');

  if (signals.length === 0) {
    out.push('-- No noteworthy signals were identified from clinical trial AE data.');
    return out.join('\n');
  }

  // Resolve condition IDs
  const conditionNames = [...new Set(signals.flatMap(s => s.relevant_conditions ?? []))];
  const conditionIdMap = {};

  if (conditionNames.length > 0) {
    log(`\nStep 4 — Resolving ${conditionNames.length} condition ID(s)...`);
    for (const cname of conditionNames) {
      const id = await lookupConditionId(supabaseUrl, supabaseKey, cname);
      conditionIdMap[cname] = id ?? 'CONDITION_ID_HERE';
      log(`   ${cname} → ${conditionIdMap[cname]}`);
    }
  }

  // Expand signals: one row per (drug × condition); recompute tier; filter failures
  const enriched = [];
  for (const sig of signals) {
    const tier = deriveConfidenceTier(
      sig.replication_score, sig.source_quality_score, sig.specificity_score,
      sig.plausibility_score, sig.direction_score
    );
    if (tier === null) continue;

    const drug_name = toTitleCase(sig.drug_name ?? drugName);
    const conditions = sig.relevant_conditions ?? [];
    if (conditions.length === 0) {
      enriched.push({
        ...sig, drug_name, confidence_tier: tier,
        conditionId: 'CONDITION_ID_HERE',
        conditionName: null,
        compoundId: randomUUID(),
        signalId: randomUUID(),
      });
    } else {
      for (const cname of conditions) {
        enriched.push({
          ...sig, drug_name, confidence_tier: tier,
          conditionId: conditionIdMap[cname] ?? 'CONDITION_ID_HERE',
          conditionName: cname,
          compoundId: randomUUID(),
          signalId: randomUUID(),
        });
      }
    }
  }

  const seenCompounds = new Set();

  // ── STEP 1: Compounds ─────────────────────────────────────────────────────
  out.push('-- ── STEP 1: Compounds (safe to run multiple times) ──────────────');
  for (const s of enriched) {
    if (seenCompounds.has(s.drug_name)) continue;
    seenCompounds.add(s.drug_name);
    out.push(`INSERT INTO compounds (id, name, drug_class, fda_status) VALUES (`);
    out.push(`  ${esc(s.compoundId)},`);
    out.push(`  ${esc(s.drug_name)},`);
    out.push(`  NULL,`);
    out.push(`  'FDA Approved'`);
    out.push(`) ON CONFLICT (name) DO NOTHING;`);
    out.push('');
  }

  // ── STEP 2: Signals ───────────────────────────────────────────────────────
  out.push('-- ── STEP 2: Repurposing signals ─────────────────────────────────');
  for (const s of enriched) {
    if (s.conditionId === 'CONDITION_ID_HERE') {
      out.push(`--   Could not resolve condition "${s.conditionName}" — replace CONDITION_ID_HERE manually.`);
      out.push(`--    SELECT id, name FROM conditions WHERE name ILIKE '%${s.conditionName ?? ''}%';`);
    }
    out.push(`INSERT INTO repurposing_signals`);
    out.push(`  (id, condition_id, compound_id, signal_type, evidence_strength, confidence_tier,`);
    out.push(`   replication_score, source_quality_score, specificity_score, plausibility_score, direction_score,`);
    out.push(`   effect_direction, replication_level, plausibility_level, summary, mechanism_hypothesis, status)`);
    out.push(`SELECT`);
    out.push(`  ${esc(s.signalId)},`);
    out.push(`  ${esc(s.conditionId)},`);
    out.push(`  c.id,`);
    out.push(`  'clinical_trial_finding',`);
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
    out.push(`  summary              = EXCLUDED.summary,`);
    out.push(`  evidence_strength    = EXCLUDED.evidence_strength,`);
    out.push(`  confidence_tier      = EXCLUDED.confidence_tier,`);
    out.push(`  replication_score    = EXCLUDED.replication_score,`);
    out.push(`  source_quality_score = EXCLUDED.source_quality_score,`);
    out.push(`  specificity_score    = EXCLUDED.specificity_score,`);
    out.push(`  plausibility_score   = EXCLUDED.plausibility_score,`);
    out.push(`  direction_score      = EXCLUDED.direction_score,`);
    out.push(`  effect_direction     = EXCLUDED.effect_direction,`);
    out.push(`  replication_level    = EXCLUDED.replication_level,`);
    out.push(`  plausibility_level   = EXCLUDED.plausibility_level`);
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

  // ── STEP 3: Clinical trial source rows ───────────────────────────────────
  out.push('-- ── STEP 3: Clinical trial source citations ─────────────────────');
  const seenSignals = new Set();

  for (const s of enriched) {
    if (seenSignals.has(s.signalId)) continue;
    seenSignals.add(s.signalId);

    // Subquery to resolve actual signal UUID from DB (handles ON CONFLICT preserving original UUID)
    const signalIdSubquery =
      `(SELECT rs.id FROM repurposing_signals rs ` +
      `JOIN compounds c ON c.id = rs.compound_id ` +
      `WHERE c.name = ${esc(s.drug_name)} AND rs.condition_id = ${esc(s.conditionId)} LIMIT 1)`;

    // Delete existing clinical_trial sources for this compound+condition (idempotent re-runs)
    out.push(`DELETE FROM sources`);
    out.push(`WHERE source_type = 'clinical_trial'`);
    out.push(`  AND signal_id = (`);
    out.push(`    SELECT rs.id FROM repurposing_signals rs`);
    out.push(`    JOIN compounds c ON c.id = rs.compound_id`);
    out.push(`    WHERE c.name = ${esc(s.drug_name)}`);
    out.push(`      AND rs.condition_id = ${esc(s.conditionId)}`);
    out.push(`    LIMIT 1`);
    out.push(`  );`);
    out.push('');

    // One source row per supporting trial
    const trialIds = s.trial_ids ?? [];
    if (trialIds.length === 0) {
      // Fallback: generic source row if Claude didn't return trial_ids
      const sourceId = randomUUID();
      const title = `ClinicalTrials.gov: ${s.drug_name} — clinical trial AE analysis`;
      const fallbackUrl = `https://clinicaltrials.gov/search?intr=${encodeURIComponent(s.drug_name.toLowerCase())}&aggFilters=results:with`;
      out.push(`INSERT INTO sources`);
      out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
      out.push(`VALUES (`);
      out.push(`  ${esc(sourceId)}, ${signalIdSubquery}, 'clinical_trial',`);
      out.push(`  ${esc(`CT-${s.drug_name.toUpperCase()}`)},`);
      out.push(`  ${esc(title)},`);
      out.push(`  NULL, 'ClinicalTrials.gov', ${esc(today)}, ${esc(fallbackUrl)}`);
      out.push(`);`);
      out.push('');
    } else {
      for (const nctId of trialIds) {
        const trial = trialDataByNct.get(nctId);
        const sourceId = randomUUID();
        const trialTitle = trial
          ? `${nctId}: ${trial.title}`
          : `ClinicalTrials.gov trial ${nctId}`;
        const trialUrl = `${CT_STUDY_URL}/${nctId}`;
        out.push(`INSERT INTO sources`);
        out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
        out.push(`VALUES (`);
        out.push(`  ${esc(sourceId)}, ${signalIdSubquery}, 'clinical_trial',`);
        out.push(`  ${esc(nctId)},`);
        out.push(`  ${esc(trialTitle)},`);
        out.push(`  NULL, 'ClinicalTrials.gov', ${esc(today)}, ${esc(trialUrl)}`);
        out.push(`);`);
        out.push('');
      }
    }
  }

  out.push('-- ── End of pipeline output ──────────────────────────────────────');
  return out.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const drugName = args.find(a => !a.startsWith('--'));
  const debug = args.includes('--debug');

  if (!drugName) {
    process.stderr.write(
      'Usage:   node scripts/clinicaltrials-pipeline.js "<drug name>" [--debug]\n' +
      'Example: node scripts/clinicaltrials-pipeline.js "atorvastatin"\n' +
      '         node scripts/clinicaltrials-pipeline.js "metformin" --debug\n'
    );
    process.exit(1);
  }

  const env = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!debug && (!apiKey || apiKey === 'your_anthropic_api_key_here')) {
    process.stderr.write('Error: ANTHROPIC_API_KEY is not set in .env.local\n');
    process.exit(1);
  }

  log(`\nDrug: "${drugName}"`);

  // ── Step 1: Fetch trials
  log(`\nStep 1 — Querying ClinicalTrials.gov for trials with posted results...`);
  const studies = await fetchTrials(drugName, debug);

  if (debug) {
    log('\n[DEBUG] Done. Re-run without --debug to proceed to Claude analysis.');
    process.exit(0);
  }

  log(`   Found ${studies.length} trial(s) with posted results.`);

  if (studies.length === 0) {
    log('\nNo trials with posted AE results found. Run with --debug to inspect the raw API response.');
    process.exit(0);
  }

  await sleep(REQUEST_DELAY_MS);

  // ── Step 2: Extract condition-relevant AEs
  log(`\nStep 2 — Extracting condition-relevant adverse events...`);
  const trialDataByNct = new Map();
  const trialsWithAEs = [];

  for (const study of studies) {
    const extracted = extractAEs(study);
    if (!extracted) continue;
    trialDataByNct.set(extracted.nctId, extracted);
    if (extracted.relevantEvents.length > 0) {
      trialsWithAEs.push(extracted);
      log(`   ${extracted.nctId}: ${extracted.relevantEvents.length} relevant AE term(s) — ${extracted.title.slice(0, 60)}${extracted.title.length > 60 ? '…' : ''}`);
    }
  }

  log(`   → ${trialsWithAEs.length} trial(s) had condition-relevant adverse events.`);

  if (trialsWithAEs.length === 0) {
    log('\nNo condition-relevant adverse events found in any trial. The drug may lack AE data matching our condition keywords.');
    process.exit(0);
  }

  // ── Step 3: Format and send to Claude
  log(`\nStep 3 — Formatting AE data for Claude analysis...`);
  const content = formatForClaude(drugName, trialsWithAEs);

  log(`\nStep 4 — Sending to Claude (${MODEL}) for analysis...`);
  const signals = await analyzeWithClaude(apiKey, drugName, content);
  log(`         Identified ${signals.length} signal(s).`);

  if (signals.length > 0) {
    log('         Signals:');
    for (const s of signals) {
      const conditions = (s.relevant_conditions ?? []).join(', ') || 'unspecified';
      const trials = (s.trial_ids ?? []).join(', ') || 'unspecified';
      log(`           • ${s.drug_name} — ${s.signal_type} (${s.evidence_strength}) → ${conditions} [${trials}]`);
    }
  }

  // ── Step 5: Resolve conditions + generate SQL
  log('\nGenerating SQL...\n');
  const sql = await generateSQL(drugName, signals, trialDataByNct, supabaseUrl, supabaseKey);
  process.stdout.write(sql + '\n');
  log('\nDone. Review the SQL above before pasting into Supabase.');
}

main().catch(err => {
  process.stderr.write(`Fatal error: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
