#!/usr/bin/env node
'use strict';

/**
 * Research Pipeline
 * Usage: node scripts/research-pipeline.js "<condition>"
 * Example: node scripts/research-pipeline.js "endometriosis"
 *
 * Outputs SQL to stdout; progress messages go to stderr.
 * Redirect to a file: node scripts/research-pipeline.js "endometriosis" > output.sql
 */

const { readFileSync } = require('fs');
const { randomUUID } = require('crypto');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const ANTHROPIC_BASE = 'https://api.anthropic.com';
const MODEL = 'claude-opus-4-6';
const MAX_RESULTS = 20;

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

// ── PubMed ────────────────────────────────────────────────────────────────────

async function pubmedSearch(condition) {
  const strategies = [
    `"${condition}" drug repurposing`,
    `"${condition}" off-label treatment`,
    `"${condition}" novel therapeutic`,
  ];
  // Combine with OR so we cast a wide net
  const term = strategies.map(s => `(${s})`).join(' OR ');

  const url =
    `${PUBMED_BASE}/esearch.fcgi` +
    `?db=pubmed` +
    `&term=${encodeURIComponent(term)}` +
    `&retmax=${MAX_RESULTS}` +
    `&retmode=json` +
    `&sort=relevance`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`PubMed esearch failed: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  return data.esearchresult?.idlist ?? [];
}

async function pubmedFetch(pmids) {
  if (pmids.length === 0) return [];

  const url =
    `${PUBMED_BASE}/efetch.fcgi` +
    `?db=pubmed` +
    `&id=${pmids.join(',')}` +
    `&rettype=medline` +
    `&retmode=text`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`PubMed efetch failed: ${resp.status} ${resp.statusText}`);
  const text = await resp.text();
  return parseMedline(text);
}

/**
 * Parse PubMed MEDLINE flat-file format into an array of article objects.
 * MEDLINE fields are 4-char tags followed by "- " and a value, with
 * continuation lines indented by 6 spaces.
 */
function parseMedline(text) {
  const records = [];
  const lines = text.split('\n');

  let current = null;
  let tag = null;
  let val = '';

  function saveField() {
    if (!current || !tag) return;
    const v = val.trim();
    if (!v) return;
    if (tag === 'AU') {
      // Accumulate authors as comma-separated string
      current._authors = current._authors ? `${current._authors}, ${v}` : v;
    } else if (tag === 'PMID') {
      current.PMID = v.split(' ')[0]; // strip version suffix
    } else if (tag === 'PT') {
      // PubMed routinely emits multiple PT (Publication Type) lines per
      // record. Keep them as an array so mapPubtypesToStudyType() can pick
      // the highest-priority taxonomy bucket rather than parsing concat
      // text. See lib/literature-grade-rubric.json line 82 for the L2
      // source-attribution requirement that motivates this field.
      if (!current._pubtypes) current._pubtypes = [];
      current._pubtypes.push(v);
    } else {
      current[tag] = current[tag] ? `${current[tag]} ${v}` : v;
    }
  }

  for (const line of lines) {
    const m = line.match(/^([A-Z0-9]{2,6})\s*- (.*)/);
    if (m) {
      saveField();
      tag = m[1];
      val = m[2];
      if (tag === 'PMID') {
        if (current?.PMID) records.push(current);
        current = {};
      }
      if (!current) current = {};
    } else if (/^      /.test(line) && tag) {
      // Continuation line (6-space indent)
      val += ' ' + line.trim();
    }
  }
  saveField();
  if (current?.PMID) records.push(current);

  return records
    .map(r => ({
      pmid:               r.PMID ?? '',
      title:              (r.TI ?? '').replace(/\.$/, ''),
      abstract:           r.AB ?? '',
      authors:            r._authors ?? '',
      journal:            r.TA ?? r.JT ?? '',
      date:               r.DP ?? '',
      pubtypes:           r._pubtypes ?? [],
      studyType:          mapPubtypesToStudyType(r._pubtypes ?? []),
      primaryEndpoint:    extractPrimaryEndpoint(r.AB ?? ''),
    }))
    .filter(r => r.pmid && r.abstract.length > 50); // skip records with no real abstract
}

// ── Literature-grade tagging helpers ──────────────────────────────────────────
//
// These two helpers convert PubMed publication metadata into the two L-grade
// rubric fields documented in lib/literature-grade-rubric.json:
//
//   studyType         → sources.study_type        (required for L2 grading)
//   primaryEndpoint   → sources.primary_endpoint_text (required for L2 grading)
//
// The taxonomy and precedence here MUST stay in sync with the regex
// classifier in scripts/classify-sources-study-type.py (PUBMED_PUBTYPE_PRIORITY).
// When the rubric is amended, both sides update together.

const PUBTYPE_PRIORITY = [
  ['Randomized Controlled Trial',         'RCT'],
  ['Clinical Trial, Phase IV',            'RCT'],
  ['Clinical Trial, Phase III',           'RCT'],
  ['Adaptive Clinical Trial',             'RCT'],
  ['Pragmatic Clinical Trial',            'RCT'],
  ['Equivalence Trial',                   'RCT'],
  ['Controlled Clinical Trial',           'RCT'],
  ['Meta-Analysis',                       'SR/MA'],
  ['Systematic Review',                   'SR/MA'],
  ['Practice Guideline',                  'guideline'],
  ['Guideline',                           'guideline'],
  ['Consensus Development Conference',    'guideline'],
  ['Case Reports',                        'case_report'],
  ['Observational Study',                 'observational'],
  ['Multicenter Study',                   'observational'],
  ['Clinical Trial, Phase II',            'other'],
  ['Clinical Trial, Phase I',             'other'],
  ['Clinical Trial',                      'other'],
  ['Editorial',                           'expert_opinion'],
  ['Letter',                              'expert_opinion'],
  ['Comment',                             'expert_opinion'],
  ['Review',                              'expert_opinion'],
];

function mapPubtypesToStudyType(pubtypes) {
  if (!pubtypes || pubtypes.length === 0) return null;
  const set = new Set(pubtypes);
  for (const [mesh, bucket] of PUBTYPE_PRIORITY) {
    if (set.has(mesh)) return bucket;
  }
  return null;
}

// Extracts the primary outcome text from a PubMed AB (Abstract) field.
// CONSORT-style structured abstracts put the label inline ("MAIN OUTCOME
// MEASURE(S): ...") and other journals use free-text phrasing ("the
// primary endpoint was ..."). We try the structured form first because
// it is unambiguous, then fall back to the free-text regex.
function extractPrimaryEndpoint(abstract) {
  if (!abstract) return null;

  // Structured CONSORT label: "MAIN OUTCOME MEASURE(S): Ovulation, based on ..."
  // The (?:\([sS]\))? handles PubMed's parenthesised plural marker.
  const labelRe = /\b(?:MAIN OUTCOME MEASURES?|PRIMARY OUTCOMES?(?: MEASURES?)?|PRIMARY ENDPOINTS?)(?:\([sS]\))?\s*[:.-]\s*([^.;]{8,200})/i;
  let m = abstract.match(labelRe);
  if (m && m[1]) return m[1].trim().slice(0, 200);

  // Free-text fallback: "the primary endpoint was X" / "primary outcome of
  // the meta-analysis was Y" / "primary efficacy endpoint was Z" etc.
  const freeRe = /(?:primary (?:efficacy |safety |composite )?(?:endpoint|outcome(?:s)?(?: measure(?:s)?)?|objective)|co-?primary endpoint|main outcome(?:s)?(?: measure(?:s)?)?)\s+(?:was|were|of|is|are|comprised|consisted of|defined as|included|to (?:assess|evaluate|determine|measure|compare))\s+([^.;]{8,200})/i;
  m = abstract.match(freeRe);
  if (m && m[1]) return m[1].trim().slice(0, 200);

  return null;
}

// ── Claude ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a medical research analyst specializing in drug repurposing for women's health conditions — specifically endometriosis, PMDD, PCOS, adenomyosis, vulvodynia, and menopause.

MINIMUM INCLUSION STANDARD — Hard exclusion rules. A signal must meet ALL of the following or it must not appear in your output at all (do not include it with low scores — omit it entirely):
1. At least one peer-reviewed human study in the abstracts (not mechanistic-only, not animal-only, not computational-only)
2. Clearly identified patient population (not just "patients" — must specify a condition, sex, or clinical context)
3. A specific named drug or compound as the intervention
4. A measurable outcome relevant to one of the six conditions (pelvic pain, cycle regularity, hormonal markers, mood in luteal phase, vulvar pain, vasomotor symptoms, etc.)
5. A discernible direction of effect (improvement or worsening) — "no significant change" is acceptable as a direction

If a compound has mechanistic interest but no human data in these abstracts, exclude it. You are not hypothesis-generating here — you are extracting signals from actual human evidence.

For each qualifying signal, provide: compound_name, original_indication, signal_type (clinical_trial_finding, observational_study, population_study, review_article, case_report, side_effect_signal), evidence_strength (preliminary, moderate, or strong), summary, mechanism_hypothesis. Include a "pmids" field listing the PMID(s) supporting the signal.

For each signal, include these evidence scoring fields in addition to the core fields:
- confidence_tier: "Exploratory" (total 0-3), "Emerging" (4-6), "Moderate" (7-8), or "Strong" (9-10) — derived from the five scores below
- replication_score: 0 = single source only (regardless of study quality — even one RCT is replication=0); 1 = two independent sources with the same direction; 2 = three or more independent sources with the same direction. NOTE: A review article that internally summarises multiple primary studies still counts as ONE source for this score unless multiple independent reviews are present. Aggregator-summarised evidence does not bypass this rule.
- source_quality_score: 0 = case reports, forum posts, or computational prediction; 1 = observational study, secondary endpoint, or registry data; 2 = RCT, meta-analysis, or large prospective cohort
- specificity_score: 0 = indirect or pathway-level connection only; 1 = condition-adjacent (related symptoms or mechanism); 2 = direct evidence in this specific condition
- plausibility_score: 0 = speculative or theoretical mechanism; 1 = biologically plausible with supporting data in related areas; 2 = well-characterized mechanism with direct pathway evidence
- direction_score: 0 = direction unclear or conflicting; 1 = consistent direction but limited data; 2 = clear directional effect with consistent data
- effect_direction: "improves", "worsens", "mixed", or "unclear"
- replication_level: "Low", "Medium", or "High"
- plausibility_level: "Low", "Medium", or "High"

Return as JSON array.`;

async function analyzeWithClaude(apiKey, condition, articles) {
  const formatted = articles
    .map(
      (a, i) =>
        `--- ABSTRACT ${i + 1} (PMID: ${a.pmid}) ---\n` +
        `Title: ${a.title}\n` +
        `Journal: ${a.journal}  Date: ${a.date}\n` +
        `Authors: ${a.authors}\n` +
        `Abstract: ${a.abstract}`
    )
    .join('\n\n');

  const userMessage =
    `Condition: ${condition}\n\n` +
    `Analyze the following ${articles.length} PubMed abstracts for drug repurposing signals related to ${condition}. ` +
    `Return a maximum of 8 signals — prioritize the strongest evidence. ` +
    `For each signal, include a "pmids" field — an array of the PMID strings from the abstracts that support it. ` +
    `Return ONLY a valid JSON array (no markdown, no commentary). If no signals are found, return [].\n\n` +
    formatted;

  const resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  const rawText = data.content?.[0]?.text ?? '';

  // Extract JSON array — handles both bare arrays and ```json code blocks
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(
      `Claude did not return a JSON array. Raw response:\n${rawText}`
    );
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    // Response was likely truncated — extract every complete object before the cut-off point.
    const partialMatches = [...jsonMatch[0].matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g)];
    if (partialMatches.length > 0) {
      const recovered = [];
      for (const m of partialMatches) {
        try { recovered.push(JSON.parse(m[0])); } catch { /* skip malformed */ }
      }
      if (recovered.length > 0) {
        console.warn(`[warn] Claude JSON truncated — recovered ${recovered.length} complete object(s).`);
        return recovered;
      }
    }
    throw new Error(`Failed to parse Claude JSON: ${e.message}\nRaw: ${jsonMatch[0]}`);
  }
}

// ── Condition alias map ───────────────────────────────────────────────────────
// Maps common search terms to the DB names / keywords we should try when
// looking up a condition in Supabase. Add entries here as needed.
// Each key is lowercased; values are arrays of search terms tried in order.

const CONDITION_ALIASES = {
  'polycystic ovary syndrome':            ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'polycystic ovarian syndrome':          ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'pcos':                                 ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'premenstrual dysphoric disorder':      ['pmdd', 'premenstrual dysphoric'],
  'pmdd':                                 ['pmdd', 'premenstrual dysphoric'],
  'premenstrual syndrome':                ['pmdd', 'pms', 'premenstrual'],
  'menopause':                            ['menopause', 'perimenopause', 'menopausal'],
  'perimenopause':                        ['perimenopause', 'menopause', 'menopausal'],
  'vulvodynia':                           ['vulvodynia', 'vulvar pain', 'vulvar'],
  'endometriosis':                        ['endometriosis', 'endometrial'],
  'adenomyosis':                          ['adenomyosis'],
  'uterine fibroids':                     ['fibroid', 'leiomyoma', 'uterine fibroid'],
  'interstitial cystitis':               ['interstitial cystitis', 'bladder pain'],
  'fibromyalgia':                         ['fibromyalgia'],
};

// ── Supabase lookup ───────────────────────────────────────────────────────────

async function lookupConditionId(supabaseUrl, supabaseKey, condition) {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    // Fetch all conditions with both name and description — small dataset
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

    // Build the full list of search terms to try for this condition:
    // always include the raw input, then append any alias expansions.
    const aliasTerms = CONDITION_ALIASES[q] ?? [];
    const searchTerms = [q, ...aliasTerms.filter(t => t !== q)];

    log(`   Search terms: ${searchTerms.map(t => `"${t}"`).join(', ')}`);

    // Helper: check whether a row matches any of the search terms against
    // both its name and description fields.
    function rowMatches(r, terms) {
      const name = (r.name ?? '').toLowerCase();
      const desc = (r.description ?? '').toLowerCase();
      return terms.some(term => {
        const t = term.toLowerCase();
        return name.includes(t) || desc.includes(t) || t.includes(name);
      });
    }

    // Strategy 1 — any search term appears in name or description (or vice-versa)
    let match = rows.find(r => rowMatches(r, searchTerms));
    if (match) {
      log(`   Matched "${match.name}" via search terms (${match.id})`);
      return match.id;
    }

    // Strategy 2 — significant word overlap across name + description
    const STOP = new Set(['and', 'or', 'the', 'of', 'in', 'for', 'a', 'an', 'with', 'to', 'by']);
    // Collect all unique meaningful words from every search term
    const queryWords = [...new Set(
      searchTerms
        .join(' ')
        .split(/[\s\-\/\(\)]+/)
        .filter(w => w.length >= 4 && !STOP.has(w))
    )];

    const scored = rows
      .map(r => {
        const haystack = `${r.name} ${r.description ?? ''}`.toLowerCase();
        const haystackTokens = haystack.split(/[\s\-\/\(\)]+/);
        const score = queryWords.reduce((acc, qw) => {
          if (haystackTokens.some(nw => nw === qw))                        return acc + 2;
          if (haystackTokens.some(nw => nw.includes(qw) || qw.includes(nw))) return acc + 1;
          return acc;
        }, 0);
        return { row: r, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      match = scored[0].row;
      log(`   Matched "${match.name}" via word overlap (score: ${scored[0].score}, id: ${match.id})`);
      return match.id;
    }

    // Strategy 3 — acronym: check if any short DB name is an acronym whose
    // letters appear (in order) as initials of the query words.
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
    if (match) {
      log(`   Matched "${match.name}" via acronym (${match.id})`);
      return match.id;
    }

    // No match — list everything so the user can identify the right row
    log(`   No match found for "${condition}".`);
    log(`   Conditions in your database:`);
    for (const r of rows) log(`     • ${r.name}  →  ${r.id}`);
    log(`   Tip: re-run with the exact DB name above, or replace CONDITION_ID_HERE manually.`);
    return null;

  } catch (err) {
    log(`   Lookup error: ${err.message}`);
    return null;
  }
}

// ── Date parsing ─────────────────────────────────────────────────────────────

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Convert a PubMed DP (date of publication) string to YYYY-MM-DD.
 * Examples:
 *   "2020 Feb"        → "2020-02-01"
 *   "2020 Feb 15"     → "2020-02-15"
 *   "2020"            → "2020-01-01"
 *   "2020 Feb-Mar"    → "2020-02-01"  (range: take first month)
 *   unparseable       → null
 */
function parsePubmedDate(dp) {
  if (!dp) return null;
  const s = dp.trim();

  // Extract year
  const yearMatch = s.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return null;
  const year = yearMatch[1] + s.slice(yearMatch.index + 2, yearMatch.index + 4);

  // Extract month abbreviation (first 3 chars, case-insensitive)
  const monthMatch = s.match(/\b([A-Za-z]{3})/);
  const month = monthMatch ? MONTH_MAP[monthMatch[1].toLowerCase()] : null;
  if (!month) return `${year}-01-01`;

  // Extract day
  const dayMatch = s.match(/\b([0-3]?\d)\b(?!\d)/g);
  // dayMatch may contain the year digits too, so filter to 1–31
  const day = dayMatch
    ? dayMatch.map(Number).find(n => n >= 1 && n <= 31 && String(n) !== year)
    : null;
  const dd = day ? String(day).padStart(2, '0') : '01';

  return `${year}-${month}-${dd}`;
}

// ── SQL generation ────────────────────────────────────────────────────────────

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Title-case a drug/compound name.
 * Capitalises the first letter of each word; leaves subsequent letters as-is
 * so acronyms like "GLP-1" or "mTOR" survive if Claude returns them correctly.
 * Handles hyphenated words (e.g. "anti-inflammatory" → "Anti-Inflammatory").
 */
function toTitleCase(name) {
  if (!name) return name;
  return name
    .split(/(\s+|-)/)
    .map((part) => {
      if (/^[\s-]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

/**
 * Recompute confidence_tier from raw scores, overriding whatever Claude returned.
 * Returns null (and the signal should be filtered out) if total is 0.
 */
function deriveConfidenceTier(replication, sourceQuality, specificity, plausibility, direction) {
  const total = (replication ?? 0) + (sourceQuality ?? 0) + (specificity ?? 0) +
                (plausibility ?? 0) + (direction ?? 0);
  if (total >= 9) return 'Strong';
  if (total >= 7) return 'Moderate';
  if (total >= 4) return 'Emerging';
  if (total >= 1) return 'Exploratory';
  return null; // total = 0 means failed inclusion bar
}

function generateSQL(condition, conditionId, signals, articlesByPmid) {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];

  out.push('-- ================================================================');
  out.push(`-- Rediscover Women — Research Pipeline Output`);
  out.push(`-- Condition : ${condition}`);
  out.push(`-- Generated : ${today}`);
  out.push(`-- Model     : ${MODEL}`);
  out.push('-- ================================================================');
  out.push('');

  if (!conditionId) {
    out.push(`--   Condition "${condition}" was not found in your database.`);
    out.push(`--    Run the query below to find the correct ID, then replace`);
    out.push(`--    every occurrence of 'CONDITION_ID_HERE' in this file.`);
    out.push(`--`);
    out.push(`--    SELECT id, name FROM conditions WHERE name ILIKE '%${condition}%';`);
    out.push('');
    conditionId = 'CONDITION_ID_HERE';
  }

  if (signals.length === 0) {
    out.push('-- No repurposing signals were identified from the analyzed abstracts.');
    return out.join('\n');
  }

  // Pre-assign deterministic UUIDs; normalise compound name; recompute tier; filter failures
  const enriched = signals
    .map(sig => {
      const tier = deriveConfidenceTier(
        sig.replication_score, sig.source_quality_score, sig.specificity_score,
        sig.plausibility_score, sig.direction_score
      );
      return {
        ...sig,
        compound_name:  toTitleCase(sig.compound_name),
        confidence_tier: tier,
        compoundId: randomUUID(),
        signalId:   randomUUID(),
        pmids:      Array.isArray(sig.pmids) ? sig.pmids : [],
        sourceIds:  (Array.isArray(sig.pmids) ? sig.pmids : []).map(() => randomUUID()),
      };
    })
    .filter(sig => sig.confidence_tier !== null); // drop 0-score failures

  // ── STEP 1: Compounds ──────────────────────────────────────────────────────
  out.push('-- ── STEP 1: Compounds (safe to run multiple times) ──────────────');
  for (const s of enriched) {
    out.push(`INSERT INTO compounds (id, name, drug_class, fda_status) VALUES (`);
    out.push(`  ${esc(s.compoundId)},`);
    out.push(`  ${esc(s.compound_name)},`);
    out.push(`  ${esc(s.original_indication ?? null)},`);
    out.push(`  'FDA Approved'`);
    out.push(`) ON CONFLICT (lower(name)) DO NOTHING;`);
    out.push('');
  }

  // ── STEP 2: Signals ────────────────────────────────────────────────────────
  out.push('-- ── STEP 2: Repurposing signals ─────────────────────────────────');
  for (const s of enriched) {
    // Use SELECT to resolve the compound_id by name — handles pre-existing rows
    out.push(`INSERT INTO repurposing_signals`);
    out.push(`  (id, condition_id, compound_id, signal_type, evidence_strength, confidence_tier,`);
    out.push(`   replication_score, source_quality_score, specificity_score, plausibility_score, direction_score,`);
    out.push(`   effect_direction, replication_level, plausibility_level, summary, mechanism_hypothesis, status)`);
    out.push(`SELECT`);
    out.push(`  ${esc(s.signalId)},`);
    out.push(`  ${esc(conditionId)},`);
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
    out.push(`WHERE c.name = ${esc(s.compound_name)}`);
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

  // ── STEP 3: Sources ────────────────────────────────────────────────────────
  out.push('-- ── STEP 3: Sources (PubMed citations) ─────────────────────────');
  for (const s of enriched) {
    if (s.pmids.length === 0) continue;
    for (let i = 0; i < s.pmids.length; i++) {
      const pmid     = String(s.pmids[i]);
      const sourceId = s.sourceIds[i];
      const art      = articlesByPmid[pmid];

      if (!art) {
        // PMID from Claude not in our fetch set — output placeholder
        out.push(`-- Note: PMID ${pmid} was not in the fetched batch; review manually.`);
        continue;
      }

      // Truncate author string to avoid DB limits
      const authors = art.authors.length > 300
        ? art.authors.slice(0, 297) + '...'
        : art.authors;

      out.push(`INSERT INTO sources`);
      out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url, study_type, primary_endpoint_text)`);
      out.push(`SELECT`);
      out.push(`  gen_random_uuid(),`);
      out.push(`  rs.id,`);
      out.push(`  'pubmed',`);
      out.push(`  ${esc(pmid)},`);
      out.push(`  ${esc(art.title)},`);
      out.push(`  ${esc(authors)},`);
      out.push(`  ${esc(art.journal)},`);
      out.push(`  ${esc(parsePubmedDate(art.date))},`);
      out.push(`  ${esc(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`)},`);
      out.push(`  ${esc(art.studyType)},`);
      out.push(`  ${esc(art.primaryEndpoint)}`);
      out.push(`FROM repurposing_signals rs`);
      out.push(`JOIN compounds c ON rs.compound_id = c.id`);
      out.push(`WHERE c.name = ${esc(s.compound_name)}`);
      out.push(`AND rs.condition_id = ${esc(conditionId)}`);
      out.push(`ON CONFLICT DO NOTHING;`);
      out.push('');
    }
  }

  out.push('-- ── End of pipeline output ──────────────────────────────────────');
  return out.join('\n');
}

// ── Logging (stderr so stdout stays clean SQL) ────────────────────────────────

function log(msg) {
  process.stderr.write(msg + '\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const condition = process.argv[2];

  if (!condition) {
    process.stderr.write(
      'Usage:   node scripts/research-pipeline.js "<condition>"\n' +
      'Example: node scripts/research-pipeline.js "endometriosis"\n'
    );
    process.exit(1);
  }

  // Load environment
  const env = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    process.stderr.write(
      'Error: ANTHROPIC_API_KEY is not set in .env.local\n' +
      'Add: ANTHROPIC_API_KEY=sk-ant-...\n'
    );
    process.exit(1);
  }

  // ── Step 1: PubMed search
  log(`\nStep 1 — Searching PubMed for: "${condition}"`);
  const pmids = await pubmedSearch(condition);

  if (pmids.length === 0) {
    log('No PubMed results found. Try a different condition name.');
    process.exit(0);
  }
  log(`         Found ${pmids.length} article IDs. Fetching abstracts...`);

  const articles = await pubmedFetch(pmids);
  log(`         Parsed ${articles.length} abstracts with content.`);

  if (articles.length === 0) {
    log('Could not extract usable abstracts. Exiting.');
    process.exit(0);
  }

  // ── Step 2: Claude analysis
  log(`\nStep 2 — Sending ${articles.length} abstracts to Claude (${MODEL})...`);
  const signals = await analyzeWithClaude(apiKey, condition, articles);
  log(`         Identified ${signals.length} repurposing signal(s).`);

  if (signals.length > 0) {
    log('         Signals found:');
    for (const s of signals) {
      log(`           • ${s.compound_name} — ${s.signal_type} (${s.evidence_strength})`);
    }
  }

  // ── Step 3: Condition lookup
  log(`\nStep 3 — Looking up condition in Supabase...`);
  const conditionId = await lookupConditionId(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    condition
  );
  if (!conditionId) {
    log(`         Not found — you will need to fill in the condition ID manually.`);
  }

  // Build PMID → article lookup map
  const articlesByPmid = {};
  for (const a of articles) articlesByPmid[a.pmid] = a;

  // ── Output SQL to stdout
  log('\nGenerating SQL...\n');
  const sql = generateSQL(condition, conditionId, signals, articlesByPmid);
  process.stdout.write(sql + '\n');
  log('\nDone. Review the SQL above before pasting into Supabase.');
}

main().catch(err => {
  process.stderr.write(`\nFatal error: ${err.message}\n`);
  process.exit(1);
});
