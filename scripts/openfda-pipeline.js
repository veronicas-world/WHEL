#!/usr/bin/env node
'use strict';

/**
 * OpenFDA FAERS Pipeline (FDA Adverse Event Reporting System)
 * Usage: node scripts/openfda-pipeline.js "<drug class>"
 *        node scripts/openfda-pipeline.js "<drug class>" --debug
 * Example: node scripts/openfda-pipeline.js "statins"
 *          node scripts/openfda-pipeline.js "atorvastatin" --debug
 *
 * --debug  Prints the raw API URL, response status, and first 500 chars of
 *          the response for each drug, then exits before calling Claude.
 *
 * Queries OpenFDA adverse event reports for female patients, looks for
 * gynecological/menstrual reactions, sends to Claude for analysis, outputs SQL.
 * Progress messages go to stderr; SQL goes to stdout.
 */

const { readFileSync } = require('fs');
const { randomUUID } = require('crypto');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const OPENFDA_BASE = 'https://api.fda.gov/drug/event.json';
const ANTHROPIC_BASE = 'https://api.anthropic.com';
const MODEL = 'claude-opus-4-6';
const REQUEST_DELAY_MS = 1600; // ~37 req/min, safely under free-tier 40/min
const MAX_REPORTS_PER_DRUG = 100; // reports fetched; OpenFDA max per request is 100

// ── Drug class → individual drug names ───────────────────────────────────────

const DRUG_CLASS_MAP = {
  statins: ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin', 'fluvastatin', 'pitavastatin'],
  'glp-1 agonists': ['semaglutide', 'liraglutide', 'dulaglutide', 'exenatide', 'tirzepatide', 'albiglutide'],
  'glp-1': ['semaglutide', 'liraglutide', 'dulaglutide', 'exenatide', 'tirzepatide'],
  'dopamine agonists': ['bromocriptine', 'cabergoline', 'pramipexole', 'ropinirole', 'rotigotine'],
  ssris: ['sertraline', 'fluoxetine', 'escitalopram', 'citalopram', 'paroxetine', 'fluvoxamine'],
  nsaids: ['ibuprofen', 'naproxen', 'celecoxib', 'diclofenac', 'meloxicam', 'indomethacin'],
  'beta blockers': ['metoprolol', 'propranolol', 'atenolol', 'carvedilol', 'bisoprolol', 'nadolol'],
  aromatase: ['letrozole', 'anastrozole', 'exemestane'],
  'aromatase inhibitors': ['letrozole', 'anastrozole', 'exemestane'],
  naltrexone: ['naltrexone'],
  metformin: ['metformin'],
  spironolactone: ['spironolactone'],
};

// ── Relevant reaction terms for Pass 1 (targeted query) ──────────────────────
// Covers all 6 conditions on the site: endometriosis, PMDD, PCOS, adenomyosis,
// vulvodynia, menopause. Each category maps to one or more conditions.
// These terms are used to build the OpenFDA reaction filter AND to annotate
// the Claude-formatted output with matched keyword categories.

const GYNAE_TERMS = [
  // Menstrual / cycle (endometriosis, PMDD, PCOS, adenomyosis)
  'menstruation', 'menstrual', 'dysmenorrhoea', 'dysmenorrhea', 'menorrhagia',
  'metrorrhagia', 'amenorrhoea', 'amenorrhea', 'oligomenorrhoea', 'oligomenorrhea',
  'menstrual disorder', 'irregular menstruation', 'menstrual cycle irregularity',
  'intermenstrual bleeding', 'heavy menstrual bleeding', 'uterine bleeding',
  'abnormal uterine bleeding',

  // Pelvic / reproductive organs (endometriosis, adenomyosis, vulvodynia, PCOS)
  'endometriosis', 'endometrial', 'adenomyosis',
  'pelvic pain', 'pelvic', 'uterine', 'uterine pain', 'uterine spasm',
  'uterine fibroids', 'leiomyoma',
  'ovarian', 'ovarian cyst', 'ovarian pain', 'polycystic ovaries',
  'vaginal', 'vaginal pain', 'vaginal haemorrhage', 'vaginal hemorrhage',
  'vaginal discharge', 'vulval pain', 'vulvodynia', 'vulvar',
  'dyspareunia', 'sexual pain',
  'breast', 'breast pain', 'mastalgia',

  // Pain (endometriosis, adenomyosis, vulvodynia, PMDD)
  'abdominal pain', 'abdominal', 'cramping', 'cramp',
  'pelvic floor', 'chronic pelvic pain',
  'headache', 'migraine', 'pain',

  // Mood / neurological (PMDD, menopause)
  'depression', 'depressed mood', 'major depressive', 'anxiety', 'anxious',
  'mood', 'mood swings', 'irritability', 'irritable', 'emotional disturbance',
  'affect lability', 'crying', 'tearfulness',
  'insomnia', 'sleep disorder', 'sleep disturbance', 'hypersomnia',
  'fatigue', 'asthenia', 'brain fog', 'cognitive', 'concentration impaired',
  'memory impairment', 'confusion',

  // Metabolic / hormonal (PCOS, menopause)
  'weight increased', 'weight gain', 'obesity',
  'insulin resistance', 'glucose', 'hyperglycaemia', 'hyperglycemia',
  'androgen', 'testosterone', 'hirsutism', 'hair loss', 'alopecia',
  'acne', 'seborrhoeic dermatitis', 'hormone', 'hormonal',
  'fertility', 'infertility', 'anovulation', 'ovulation disorder',

  // Vasomotor (menopause)
  'hot flush', 'hot flash', 'hot flushes', 'hot flashes',
  'night sweat', 'night sweats', 'flushing', 'sweating', 'hyperhidrosis',

  // Inflammatory (endometriosis, adenomyosis)
  'inflammation', 'inflammatory', 'swelling', 'oedema', 'edema',
  'bloating', 'abdominal distension',

  // Sexual / urinary (vulvodynia, menopause)
  'libido', 'decreased libido', 'loss of libido', 'sexual dysfunction',
  'dyspareunia', 'vaginismus',
  'urinary', 'urinary incontinence', 'urinary tract', 'cystitis',
  'interstitial cystitis', 'bladder pain', 'urinary frequency',

  // General
  'premenstrual syndrome', 'premenstrual dysphoric disorder', 'pmdd',
  'polycystic ovary syndrome', 'pcos',
];

// ── Condition alias map (mirrors research-pipeline.js) ───────────────────────

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
  'uterine fibroids':                ['fibroid', 'leiomyoma', 'uterine fibroid'],
  'interstitial cystitis':           ['interstitial cystitis', 'bladder pain'],
  'fibromyalgia':                    ['fibromyalgia'],
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

// ── Rate-limit helper ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── OpenFDA query ─────────────────────────────────────────────────────────────

/**
/**
 * Shared fetch helper. Builds the base drug+sex search string, runs a count
 * call, then fetches up to `limit` reports. Returns { reports, total }.
 *
 * search is appended after the base drug+sex filter with +AND+.
 * Pass extraFilter = '' to get the general (unfiltered) query.
 */
async function _fetchFAERS(drugName, extraFilter, limit, label, debug) {
  const nameLower = drugName.toLowerCase();
  const base = `patient.drug.openfda.generic_name:"${nameLower}"+AND+patient.patientsex:2`;
  const search = extraFilter ? `${base}+AND+(${extraFilter})` : base;

  // OpenFDA uses bare + as AND connector and bare : as field separator.
  // Only the quoted values need encoding (" → %22). Full encodeURIComponent
  // would encode + as %2B and break the query.
  const encodedSearch = search.replace(/"/g, '%22');

  // Count call (limit=1) to report data volume
  const countUrl = `${OPENFDA_BASE}?search=${encodedSearch}&limit=1`;

  if (debug) log(`\n[DEBUG] ${label} count URL:\n  ${countUrl}`);

  let total = 0;
  try {
    const countResp = await fetch(countUrl);
    if (debug) {
      const raw = await countResp.text();
      log(`[DEBUG] ${label} count status: ${countResp.status} ${countResp.statusText}`);
      log(`[DEBUG] ${label} count response (first 500 chars):\n  ${raw.slice(0, 500)}`);
      try { total = JSON.parse(raw).meta?.results?.total ?? 0; } catch { /* ignore */ }
    } else if (countResp.ok) {
      total = (await countResp.json()).meta?.results?.total ?? 0;
    }
  } catch (err) {
    if (debug) log(`[DEBUG] ${label} count fetch error: ${err.message}`);
  }

  if (!debug && total === 0) return { reports: [], total: 0 };

  const url = `${OPENFDA_BASE}?search=${encodedSearch}&limit=${limit}`;
  if (debug) log(`\n[DEBUG] ${label} reports URL:\n  ${url}`);

  try {
    const resp = await fetch(url);
    if (debug) {
      const raw = await resp.text();
      log(`[DEBUG] ${label} reports status: ${resp.status} ${resp.statusText}`);
      log(`[DEBUG] ${label} reports response (first 500 chars):\n  ${raw.slice(0, 500)}`);
      return { reports: [], total };
    }
    if (resp.status === 404) return { reports: [], total: 0 };
    if (!resp.ok) {
      log(`   OpenFDA warning [${label}]: ${drugName} returned ${resp.status} ${resp.statusText}`);
      return { reports: [], total };
    }
    return { reports: (await resp.json()).results ?? [], total };
  } catch (err) {
    log(`   OpenFDA fetch error [${label}] for ${drugName}: ${err.message}`);
    return { reports: [], total };
  }
}

/**
 * Pass 1 — targeted: female patients + the drug + any gynae/hormonal reaction term.
 * Ensures rare but important gynaecological signals are not buried in 100k+ general reports.
 */
async function queryOpenFDAGynae(drugName, debug = false) {
  // Build OR chain from GYNAE_TERMS. OpenFDA MedDRA field uses the exact PT spelling.
  const reactionFilter = GYNAE_TERMS
    .map(t => `patient.reaction.reactionmeddrapt:"${t}"`)
    .join('+OR+');
  return _fetchFAERS(drugName, reactionFilter, MAX_REPORTS_PER_DRUG, 'Pass-1 gynae', debug);
}

/**
 * Pass 2 — general: all female-patient reports for the drug, no reaction filter.
 * Provides the overall reaction frequency baseline so Claude can judge prevalence.
 */
async function queryOpenFDAGeneral(drugName, debug = false) {
  return _fetchFAERS(drugName, '', MAX_REPORTS_PER_DRUG, 'Pass-2 general', debug);
}

/**
 * Run both passes for every drug in the class.
 * Returns { byDrug, totalReports } where byDrug maps drugName →
 *   { gynaeReports, generalReports, gynaeTotal, generalTotal }.
 */
async function fetchAllReports(drugs, debug = false) {
  const byDrug = new Map();

  for (const drug of drugs) {
    log(`   Querying OpenFDA for: ${drug}...`);

    // Pass 1 — targeted gynae reports
    const { reports: gynaeReports, total: gynaeTotal } =
      await queryOpenFDAGynae(drug, debug);
    await sleep(REQUEST_DELAY_MS);

    // Pass 2 — general female reports (deduplicated against pass 1)
    const { reports: allGeneral, total: generalTotal } =
      await queryOpenFDAGeneral(drug, debug);
    await sleep(REQUEST_DELAY_MS);

    log(`   → ${generalTotal.toLocaleString()} total female-patient reports in FDA FAERS`);
    log(`   → Pass 1 (gynae-targeted): ${gynaeReports.length} report(s) [${gynaeTotal.toLocaleString()} match in FDA FAERS]`);
    log(`   → Pass 2 (general sample): ${allGeneral.length} report(s)`);

    // Deduplicate general reports against gynae reports so we don't double-count
    const gynaeIds = new Set(gynaeReports.map(r => r.safetyreportid));
    const generalReports = allGeneral.filter(r => !gynaeIds.has(r.safetyreportid));

    byDrug.set(drug, { gynaeReports, generalReports, gynaeTotal, generalTotal });
  }

  const totalReports = [...byDrug.values()]
    .reduce((acc, { gynaeReports, generalReports }) => acc + gynaeReports.length + generalReports.length, 0);
  return { byDrug, totalReports };
}

// ── Format FAERS reports for Claude ───────────────────────────────────────────

/**
 * Count reaction term frequencies across a set of reports.
 */
function countReactions(reports) {
  const counts = {};
  for (const r of reports) {
    for (const rx of r.patient?.reaction ?? []) {
      const term = rx.reactionmeddrapt?.toLowerCase() ?? 'unknown';
      counts[term] = (counts[term] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Collect reported indications for the drug from a set of reports.
 */
function collectIndications(reports, drug) {
  const indications = new Set();
  for (const r of reports) {
    for (const d of r.patient?.drug ?? []) {
      const name = d.medicinalproduct?.toLowerCase() ?? '';
      if (name.includes(drug.toLowerCase())) {
        const ind = d.drugindication;
        if (ind && ind !== 'PRODUCT USED FOR UNKNOWN INDICATION') {
          indications.add(ind.toLowerCase());
        }
      }
    }
  }
  return indications;
}

// Reaction category buckets — used to group the Pass 1 output for Claude so
// it can more easily map reactions to specific conditions.
const REACTION_CATEGORIES = {
  'Menstrual/cycle':       ['menstrual', 'menstruation', 'dysmenorrh', 'amenorrh', 'menorrhagia',
                             'metrorrhagia', 'oligomenorrh', 'intermenstrual', 'uterine bleeding', 'abnormal uterine'],
  'Pelvic/uterine/ovarian': ['pelvic', 'uterine', 'ovarian', 'endometri', 'adenomyosis', 'leiomyoma', 'fibroid'],
  'Vaginal/vulvar':        ['vaginal', 'vulval', 'vulvodynia', 'vulvar', 'dyspareunia', 'vaginismus', 'sexual pain'],
  'Breast':                ['breast', 'mastalgia'],
  'Pain':                  ['pain', 'cramp', 'headache', 'migraine', 'abdominal'],
  'Mood/neurological':     ['depress', 'anxiety', 'anxious', 'mood', 'irritab', 'affect lability',
                             'crying', 'tearful', 'insomnia', 'sleep', 'fatigue', 'asthenia',
                             'brain fog', 'cognitive', 'concentration', 'memory', 'confusion'],
  'Metabolic/hormonal':    ['weight', 'insulin', 'glucose', 'glycaemi', 'glycemi', 'androgen',
                             'testosterone', 'hirsutism', 'hair loss', 'alopecia', 'acne',
                             'hormone', 'hormonal', 'fertility', 'infertil', 'anovulat', 'ovulation'],
  'Vasomotor':             ['hot flush', 'hot flash', 'flushing', 'night sweat', 'sweat', 'hyperhidrosis'],
  'Inflammatory':          ['inflammat', 'swelling', 'oedema', 'edema', 'bloating', 'distension'],
  'Sexual/urinary':        ['libido', 'sexual dysfunction', 'urinary', 'cystitis', 'bladder'],
};

/**
 * Group a reaction-count map into labelled categories for structured Claude input.
 * Returns an array of "Category: term (n=N), term (n=N)" strings, skipping empty categories.
 */
function groupReactionsByCategory(reactionCounts) {
  const assigned = new Set();
  const lines = [];

  for (const [category, keywords] of Object.entries(REACTION_CATEGORIES)) {
    const matching = Object.entries(reactionCounts)
      .filter(([term]) => keywords.some(kw => term.includes(kw)))
      .sort((a, b) => b[1] - a[1]);

    if (matching.length === 0) continue;
    matching.forEach(([term]) => assigned.add(term));
    lines.push(`  ${category}: ${matching.map(([t, n]) => `${t} (n=${n})`).join(', ')}`);
  }

  // Catch anything not matched by a category keyword
  const uncategorised = Object.entries(reactionCounts)
    .filter(([term]) => !assigned.has(term))
    .sort((a, b) => b[1] - a[1]);
  if (uncategorised.length > 0) {
    lines.push(`  Other: ${uncategorised.map(([t, n]) => `${t} (n=${n})`).join(', ')}`);
  }

  return lines;
}

/**
 * Summarise both pass-1 (condition-targeted) and pass-2 (general) FAERS reports
 * into a structured text block for Claude, with reactions grouped by category.
 */
function formatForClaude(drugClass, byDrug) {
  const sections = [];

  for (const [drug, { gynaeReports, generalReports, gynaeTotal, generalTotal }] of byDrug) {
    const gynaeReactionCounts   = countReactions(gynaeReports);
    const generalReactionCounts = countReactions(generalReports);
    const indications = collectIndications([...gynaeReports, ...generalReports], drug);

    // Pass 1: reactions grouped by condition-relevant category
    const gynaeCategoryLines = groupReactionsByCategory(gynaeReactionCounts);

    // Pass 2: top 30 overall reactions as flat baseline
    const generalReactionList = Object.entries(generalReactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([term, n]) => `${term} (n=${n})`)
      .join(', ');

    const indicationList = [...indications].slice(0, 8).join(', ') || 'not reported';

    sections.push(
      `=== DRUG: ${drug.toUpperCase()} ===\n` +
      `gynae_total (use in summary): ${gynaeTotal.toLocaleString()}\n` +
      `general_total (use in summary): ${generalTotal.toLocaleString()}\n` +
      `Reported indications: ${indicationList}\n` +
      `\n` +
      `-- Pass 1: Condition-targeted reports (${gynaeReports.length} sampled of ${gynaeTotal.toLocaleString()} matching in FDA FAERS) --\n` +
      `Reactions by category:\n` +
      (gynaeCategoryLines.length > 0 ? gynaeCategoryLines.join('\n') : '  none recorded') +
      `\n\n` +
      `-- Pass 2: General female-patient sample (${generalReports.length} reports, deduplicated) --\n` +
      `Top reactions overall: ${generalReactionList || 'none recorded'}`
    );
  }

  return sections.join('\n\n');
}

// ── Claude analysis ───────────────────────────────────────────────────────────

// The 6 conditions on the site and their overlapping pathway categories.
// Included verbatim in the system prompt so Claude can cross-reference them.
const CONDITIONS_CONTEXT = `
The six conditions covered by this research tool are:
1. Endometriosis — estrogen-dependent inflammatory condition; relevant reaction categories: menstrual/cycle, pelvic/uterine pain, inflammatory, mood
2. PMDD (Premenstrual Dysphoric Disorder) — severe luteal-phase mood disorder; relevant: mood/neurological, menstrual, pain
3. PCOS (Polycystic Ovary Syndrome) — metabolic-hormonal condition; relevant: metabolic/hormonal, menstrual/cycle, ovarian, mood
4. Adenomyosis — uterine inflammatory condition; relevant: menstrual/uterine/pelvic pain, inflammatory (shares estrogen pathways with endometriosis)
5. Vulvodynia — chronic vulvovaginal pain; relevant: vulvar/vaginal pain, sexual pain, urinary, mood (chronic pain impact)
6. Menopause — hormonal transition; relevant: vasomotor, mood/neurological, metabolic, urinary/sexual, bone

Key cross-condition overlaps:
- Endometriosis ↔ Adenomyosis: share inflammatory and estrogen-driven pathways — a signal relevant to one is likely relevant to the other
- PCOS ↔ all: metabolic and hormonal dysregulation creates upstream overlap with all conditions
- Pain signals (pelvic, abdominal, vulvar): relevant to endometriosis, adenomyosis, AND vulvodynia
- Mood signals (depression, anxiety, irritability, insomnia): relevant to PMDD AND menopause; also secondary to chronic pain in endometriosis/vulvodynia
- Vasomotor signals (hot flush, night sweat): primarily menopause, but also relevant to surgical menopause secondary to endometriosis treatment
`.trim();

const FAERS_SYSTEM_PROMPT = `You are a pharmacovigilance analyst specializing in women's health and drug repurposing. You are reviewing FDA Adverse Event Monitoring System (AEMS) data for a drug class.

${CONDITIONS_CONTEXT}

Your task: for each drug, identify whether the adverse event data reveals mechanistically interesting signals relevant to ANY of the 6 conditions above. A single drug finding often implicates multiple conditions — generate a SEPARATE signal entry for each relevant condition. Do not collapse multiple conditions into one signal.

For each signal, provide:
- drug_name: the generic drug name (lowercase)
- signal_type: one of "side_effect_signal", "pathway_signal", "cross_condition_signal"
- evidence_strength: "preliminary", "moderate", or "strong"
- summary: 2–3 sentences. MUST include the exact AEMS volume numbers from the input header (gynae_total and general_total). Follow this format: "Out of [gynae_total] condition-relevant adverse event reports for [drug] in the FDA AEMS database (from [general_total] total female-patient reports), [key finding]. [Scientific interpretation of what this means for the specific condition]. Full-scale analysis of all reports may reveal additional patterns."
- mechanism_hypothesis: 1–2 sentences on the biological mechanism specific to this condition
- relevant_conditions: array containing the specific condition(s) this signal directly applies to, using these exact names: ["endometriosis", "premenstrual dysphoric disorder", "polycystic ovary syndrome", "adenomyosis", "vulvodynia", "menopause"]
- reaction_counts: object mapping EVERY relevant reaction term found in the AEMS data to its report count, covering all applicable categories (menstrual, pain, mood, metabolic, vasomotor, inflammatory, sexual/urinary). Include ALL relevant terms — do not limit to a small subset. Sort descending by count in your response. Example: {"vaginal haemorrhage": 12, "pelvic pain": 8, "depression": 6, "dysmenorrhoea": 4, "hot flush": 3}

MINIMUM INCLUSION STANDARD — Hard exclusion rules. A signal must meet ALL of the following or it must not appear in your output at all (do not include it with low scores — omit it entirely):
1. The signal must be corroborated across at least TWO independent evidence domains (e.g. gynae-targeted AEMS reports PLUS general AEMS pattern, or AEMS data PLUS a known pharmacological mechanism). A count in a single reaction category alone is insufficient.
2. OR: three or more independent formal source mentions all pointing in the same direction.
3. A plausible shared biological mechanism must be identifiable and named — not generic "inflammation" but a specific pathway (e.g. prostaglandin signaling, androgen receptor modulation, HPA axis dysregulation).
4. The direction of effect must be discernible (improves, worsens, or clearly mixed — not just "present").

If a drug has reactions relevant to multiple conditions, return one array entry per condition. Only skip a drug if the data contains no reaction pattern that could plausibly connect to any of the six conditions or their underlying biology.

For each signal, include these evidence scoring fields:
- confidence_tier: "Exploratory" (total 0-3), "Emerging" (4-6), "Moderate" (7-8), or "Strong" (9-10)
- replication_score: 0 = single source or theoretical; 1 = two independent sources or one moderate study; 2 = multiple independent replications or RCT evidence
- source_quality_score: 0 = case reports or computational; 1 = observational, secondary endpoint, or registry data (AEMS = 1); 2 = RCT, meta-analysis, or large prospective cohort
- specificity_score: 0 = indirect or pathway-level only; 1 = condition-adjacent; 2 = direct evidence in this condition
- plausibility_score: 0 = speculative mechanism; 1 = biologically plausible with supporting data; 2 = well-characterized mechanism with direct pathway evidence
- direction_score: 0 = unclear or conflicting; 1 = consistent direction but limited data; 2 = clear directional effect with consistent data
- effect_direction: "improves", "worsens", "mixed", or "unclear"
- replication_level: "Low", "Medium", or "High"
- plausibility_level: "Low", "Medium", or "High"

Return ONLY a valid JSON array. If nothing is noteworthy, return [].`;

async function analyzeWithClaude(apiKey, drugClass, content) {
  const userMessage =
    `Drug class: ${drugClass}\n\n` +
    `The following is a two-pass summary of FDA Adverse Event Monitoring System (AEMS) data ` +
    `for female patients taking drugs in the "${drugClass}" class.\n\n` +
    `DATA FORMAT:\n` +
    `Each drug section header shows: (a) gynae_total = number of reports matching condition-relevant ` +
    `reaction terms in all of FDA AEMS, and (b) general_total = total female-patient reports for this drug. ` +
    `USE THESE EXACT NUMBERS verbatim in the summary field of each signal.\n\n` +
    `Pass 1 (condition-targeted): Reports filtered for reaction terms relevant to any of the 6 conditions ` +
    `(menstrual, pain, mood, metabolic, vasomotor, inflammatory, sexual/urinary). ` +
    `Reaction counts shown reflect the sampled 100 reports, not all of FDA AEMS.\n\n` +
    `Pass 2 (general sample): Unfiltered female-patient sample. Use as baseline context.\n\n` +
    `INSTRUCTIONS:\n` +
    `1. For each drug with relevant findings, generate ONE signal entry PER CONDITION it implicates. ` +
    `   Apply the cross-condition overlaps from your system prompt — pain signals → endometriosis + adenomyosis + vulvodynia, ` +
    `   mood signals → PMDD + menopause, metabolic signals → PCOS, etc.\n` +
    `2. The reaction_counts field must include ALL reaction terms from the data that are relevant to ` +
    `   the specific condition in that signal entry — not just a subset.\n` +
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
      max_tokens: 16000,
      system: FAERS_SYSTEM_PROMPT,
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
    // Response may be truncated — extract every complete top-level object
    const recovered = [];
    let depth = 0, start = -1;
    const text = jsonMatch[0];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') { if (depth === 0) start = i; depth++; }
      else if (text[i] === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          try { recovered.push(JSON.parse(text.slice(start, i + 1))); } catch { /* skip malformed */ }
          start = -1;
        }
      }
    }
    if (recovered.length > 0) {
      process.stderr.write(`[warn] Claude JSON truncated — recovered ${recovered.length} complete object(s).\n`);
      return recovered;
    }
    throw new Error(`Failed to parse Claude JSON: ${e.message}\nRaw: ${jsonMatch[0].slice(0, 500)}`);
  }
}

// ── Supabase condition lookup (same logic as research-pipeline.js) ─────────

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

    const initials = queryWords.map(w => w[0]);
    match = rows.find(r => {
      const name = r.name.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (name.length < 2 || name.length > 6) return false;
      let pos = 0;
      for (const ch of name) {
        const found = initials.indexOf(ch, pos);
        if (found === -1) return false;
        pos = found + 1;
      }
      return true;
    });
    if (match) return match.id;

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

/**
 * Title-case a drug/compound name.
 * Capitalises the first letter of each word; leaves subsequent letters as-is
 * so acronyms like "GLP-1" survive if Claude returns them correctly.
 */
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

async function generateSQL(drugClass, signals, byDrug, supabaseUrl, supabaseKey) {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];

  out.push('-- ================================================================');
  out.push(`-- Rediscover Women — OpenFDA FAERS Pipeline Output`);
  out.push(`-- Drug class : ${drugClass}`);
  out.push(`-- Generated  : ${today}`);
  out.push(`-- Model      : ${MODEL}`);
  out.push(`-- Source     : FDA Adverse Event Reporting System (FAERS)`);
  out.push('-- ================================================================');
  out.push('');

  if (signals.length === 0) {
    out.push('-- No noteworthy signals were identified from the FDA FAERS data.');
    return out.join('\n');
  }

  // Resolve condition IDs for all unique relevant_conditions across all signals
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

  // Expand signals: one row per (drug × condition); normalise name; recompute tier; filter failures
  const enriched = [];
  for (const sig of signals) {
    const tier = deriveConfidenceTier(
      sig.replication_score, sig.source_quality_score, sig.specificity_score,
      sig.plausibility_score, sig.direction_score
    );
    if (tier === null) continue; // failed inclusion bar

    const drug_name = toTitleCase(sig.drug_name);
    const conditions = sig.relevant_conditions ?? [];
    if (conditions.length === 0) {
      enriched.push({
        ...sig, drug_name, confidence_tier: tier,
        conditionId: 'CONDITION_ID_HERE',
        conditionName: null,
        compoundId: randomUUID(),
        signalId: randomUUID(),
        reportCount: (byDrug.get(sig.drug_name)?.gynaeTotal ?? 0),
      });
    } else {
      for (const cname of conditions) {
        enriched.push({
          ...sig, drug_name, confidence_tier: tier,
          conditionId: conditionIdMap[cname] ?? 'CONDITION_ID_HERE',
          conditionName: cname,
          compoundId: randomUUID(),
          signalId: randomUUID(),
          reportCount: (byDrug.get(sig.drug_name)?.gynaeTotal ?? 0),
        });
      }
    }
  }

  // Deduplicate compounds (one INSERT per drug_name)
  const seenCompounds = new Set();

  // ── STEP 1: Compounds ──────────────────────────────────────────────────────
  out.push('-- ── STEP 1: Compounds (safe to run multiple times) ──────────────');
  for (const s of enriched) {
    if (seenCompounds.has(s.drug_name)) continue;
    seenCompounds.add(s.drug_name);
    out.push(`INSERT INTO compounds (id, name, drug_class, fda_status) VALUES (`);
    out.push(`  ${esc(s.compoundId)},`);
    out.push(`  ${esc(s.drug_name)},`);
    out.push(`  ${esc(drugClass)},`);
    out.push(`  'FDA Approved'`);
    out.push(`) ON CONFLICT (name) DO NOTHING;`);
    out.push('');
  }

  // ── STEP 2: Signals ────────────────────────────────────────────────────────
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

  // ── STEP 3: FAERS source rows ──────────────────────────────────────────────
  // Each signal gets:
  //   a) One "database query" summary row showing the total report volumes
  //   b) One row per reaction type with its count
  out.push('-- ── STEP 3: FAERS source citations ──────────────────────────────');
  const faersUrl = 'https://www.fda.gov/drugs/questions-and-answers-fdas-adverse-event-reporting-system-faers/fda-adverse-event-reporting-system-faers-public-dashboard';
  const seenSignals = new Set();

  for (const s of enriched) {
    if (seenSignals.has(s.signalId)) continue;
    seenSignals.add(s.signalId);

    // Resolve totals — byDrug keys are lowercase; drug_name is now title-cased
    const drugEntry = byDrug.get(s.drug_name.toLowerCase());
    const gynaeTotal   = drugEntry?.gynaeTotal   ?? s.reportCount;
    const generalTotal = drugEntry?.generalTotal ?? 0;

    // Delete any existing FAERS sources for this compound+condition so re-runs
    // don't accumulate duplicate source rows. PubMed sources are untouched.
    out.push(`DELETE FROM sources`);
    out.push(`WHERE source_type = 'faers'`);
    out.push(`  AND signal_id = (`);
    out.push(`    SELECT rs.id FROM repurposing_signals rs`);
    out.push(`    JOIN compounds c ON c.id = rs.compound_id`);
    out.push(`    WHERE c.name = ${esc(s.drug_name)}`);
    out.push(`      AND rs.condition_id = ${esc(s.conditionId)}`);
    out.push(`    LIMIT 1`);
    out.push(`  );`);
    out.push('');

    // ── (a) Database query summary row ──────────────────────────────────────
    const summarySourceId = randomUUID();
    const summaryTitle =
      `FDA AEMS Database Query: ${s.drug_name} — ` +
      `${gynaeTotal.toLocaleString()} condition-relevant reports out of ` +
      `${generalTotal.toLocaleString()} female-patient reports`;

    // Verifiable summary query URL: all female patients for this drug.
    // limit=100 (rather than the openFDA default of 1) lets a reader who
    // clicks the citation see up to 100 actual report records, not just a
    // single example. The true openFDA-side total is still surfaced in the
    // response's meta.results.total field. (Review finding S1, May 2026.)
    const summaryQuery = `patient.drug.openfda.generic_name:"${s.drug_name.toLowerCase()}"+AND+patient.patientsex:2`;
    const summaryUrl = `https://api.fda.gov/drug/event.json?search=${summaryQuery.replace(/"/g, '%22')}&limit=100`;

    // Subquery to resolve the actual signal ID from DB (handles the case where
    // ON CONFLICT preserved the original UUID rather than the new generated one)
    const signalIdSubquery =
      `(SELECT rs.id FROM repurposing_signals rs ` +
      `JOIN compounds c ON c.id = rs.compound_id ` +
      `WHERE c.name = ${esc(s.drug_name)} AND rs.condition_id = ${esc(s.conditionId)} LIMIT 1)`;

    out.push(`INSERT INTO sources`);
    out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
    out.push(`VALUES (`);
    out.push(`  ${esc(summarySourceId)}, ${signalIdSubquery}, 'faers',`);
    out.push(`  ${esc(`FAERS-QUERY-${s.drug_name.toUpperCase()}`)},`);
    out.push(`  ${esc(summaryTitle)},`);
    out.push(`  NULL, 'FDA Adverse Event Monitoring System (AEMS)', ${esc(today)}, ${esc(summaryUrl)}`);
    out.push(`);`);
    out.push('');

    // ── (b) Per-reaction rows (n≥2 only — single reports are noise) ──────────
    const reactionCounts = s.reaction_counts ?? {};
    const reactionEntries = Object.entries(reactionCounts)
      .filter(([, count]) => count >= 2)          // drop single-report noise
      .sort((a, b) => b[1] - a[1]);               // descending by count

    if (reactionEntries.length === 0) {
      // Fallback if Claude returned no reaction_counts or all were n=1
      const sourceId = randomUUID();
      const title = `AEMS: ${s.drug_name} — condition-relevant reactions in female patients (${gynaeTotal.toLocaleString()} matching reports in FDA AEMS)`;
      out.push(`INSERT INTO sources`);
      out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
      out.push(`VALUES (`);
      out.push(`  ${esc(sourceId)}, ${signalIdSubquery}, 'faers',`);
      out.push(`  ${esc(`FAERS-${s.drug_name.toUpperCase()}`)},`);
      out.push(`  ${esc(title)},`);
      out.push(`  NULL, 'FDA Adverse Event Monitoring System (AEMS)', ${esc(today)}, ${esc(faersUrl)}`);
      out.push(`);`);
      out.push('');
    } else {
      for (const [reaction, count] of reactionEntries) {
        const sourceId = randomUUID();
        const reactionDisplay = reaction.charAt(0).toUpperCase() + reaction.slice(1);
        // `count` is the number of reports mentioning this reaction WITHIN the
        // bounded sample fetched above (MAX_REPORTS_PER_DRUG per pass), not an
        // openFDA population total. The title states this explicitly so the
        // number is not mistaken for the count returned by verifyUrl, which
        // queries the entire openFDA database. (Review finding S1, May 2026.)
        const title = `AEMS: ${reactionDisplay} (${count} reports in the analysed AEMS sample)`;
        const externalId = `FAERS-${s.drug_name.toUpperCase()}-${reaction.replace(/\s+/g, '_').toUpperCase()}`;

        // Build a verifiable OpenFDA URL for this specific drug + reaction
        // combination. limit=100 (rather than the openFDA default of 1) so a
        // reader following the citation sees up to 100 real example reports;
        // meta.results.total in the response still shows the population total
        // for the drug + reaction pair. (Review finding S1, May 2026.)
        const reactionQuery = `patient.drug.openfda.generic_name:"${s.drug_name.toLowerCase()}"+AND+patient.patientsex:2+AND+patient.reaction.reactionmeddrapt:"${reaction}"`;
        const verifyUrl = `https://api.fda.gov/drug/event.json?search=${reactionQuery.replace(/"/g, '%22')}&limit=100`;

        out.push(`INSERT INTO sources`);
        out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
        out.push(`VALUES (`);
        out.push(`  ${esc(sourceId)}, ${signalIdSubquery}, 'faers',`);
        out.push(`  ${esc(externalId)},`);
        out.push(`  ${esc(title)},`);
        out.push(`  NULL, 'FDA Adverse Event Monitoring System (AEMS)', ${esc(today)}, ${esc(verifyUrl)}`);
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
  const drugClass = args.find(a => !a.startsWith('--'));
  const debug = args.includes('--debug');

  if (!drugClass) {
    process.stderr.write(
      'Usage:   node scripts/openfda-pipeline.js "<drug class>" [--debug]\n' +
      'Example: node scripts/openfda-pipeline.js "statins"\n' +
      '         node scripts/openfda-pipeline.js "atorvastatin" --debug\n' +
      '\nAvailable drug classes:\n' +
      Object.keys(DRUG_CLASS_MAP).map(k => `  ${k}`).join('\n') + '\n' +
      '\nYou can also pass a single drug name not in the class map.\n'
    );
    process.exit(1);
  }

  const env = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!debug && (!apiKey || apiKey === 'your_anthropic_api_key_here')) {
    process.stderr.write(
      'Error: ANTHROPIC_API_KEY is not set in .env.local\n'
    );
    process.exit(1);
  }

  // Resolve drugs to query
  const drugs = DRUG_CLASS_MAP[drugClass.toLowerCase()] ?? [drugClass];
  log(`\nDrug class: "${drugClass}"`);
  log(`Drugs to query: ${drugs.join(', ')}`);
  if (debug) log(`[DEBUG] Mode enabled — will print raw API URLs and responses, then exit.`);

  // ── Step 1: Fetch FAERS reports
  log(`\nStep 1 — Querying OpenFDA FAERS for female patients...`);
  const { byDrug, totalReports } = await fetchAllReports(drugs, debug);

  if (debug) {
    log('\n[DEBUG] Done. Re-run without --debug to proceed to Claude analysis.');
    process.exit(0);
  }

  if (totalReports === 0) {
    log('\nNo FAERS reports found. Run with --debug to inspect the raw API response.');
    process.exit(0);
  }

  log(`\n         Total unique reports fetched: ${totalReports} across ${byDrug.size} drug(s)`);

  // ── Step 2: Format for Claude
  log(`\nStep 2 — Formatting report summaries...`);
  const content = formatForClaude(drugClass, byDrug);

  // ── Step 3: Claude analysis
  log(`\nStep 3 — Sending to Claude (${MODEL}) for pharmacovigilance analysis...`);
  const signals = await analyzeWithClaude(apiKey, drugClass, content);
  log(`         Identified ${signals.length} signal(s).`);

  if (signals.length > 0) {
    log('         Signals:');
    for (const s of signals) {
      const conditions = (s.relevant_conditions ?? []).join(', ') || 'unspecified';
      log(`           • ${s.drug_name} — ${s.signal_type} (${s.evidence_strength}) → ${conditions}`);
    }
  }

  // ── Step 4 + 5: Resolve conditions + generate SQL
  log('\nGenerating SQL...\n');
  const sql = await generateSQL(drugClass, signals, byDrug, supabaseUrl, supabaseKey);
  process.stdout.write(sql + '\n');
  log('\nDone. Review the SQL above before pasting into Supabase.');
}

main().catch(err => {
  process.stderr.write(`\nFatal error: ${err.message}\n`);
  process.exit(1);
});
