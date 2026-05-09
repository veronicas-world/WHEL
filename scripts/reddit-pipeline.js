#!/usr/bin/env node
'use strict';

/**
 * Reddit Community Pipeline
 * Usage: node scripts/reddit-pipeline.js "<condition>"
 * Example: node scripts/reddit-pipeline.js "endometriosis"
 *
 * Fetches top posts from condition-specific subreddits, sends them to Claude,
 * and outputs SQL to stdout. Progress messages go to stderr.
 * Redirect to a file: node scripts/reddit-pipeline.js "endometriosis" > output.sql
 */

const { readFileSync } = require('fs');
const { randomUUID } = require('crypto');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const ANTHROPIC_BASE = 'https://api.anthropic.com';
const MODEL = 'claude-opus-4-6';
// Posts fetched per query per subreddit — keep low since we run many queries
const POSTS_PER_QUERY = 25;

// User-Agent required by Reddit API terms of service
const REDDIT_UA = 'WomensHealthEvidenceLab/1.0 (research tool; contact via github)';

// ── Subreddit map ─────────────────────────────────────────────────────────────

const CONDITION_SUBREDDITS = {
  endometriosis: ['Endo', 'endometriosis'],
  adenomyosis:   ['adenomyosis', 'endometriosis'],
  pmdd:          ['PMDD'],
  pcos:          ['PCOS'],
  menopause:     ['Menopause', 'Perimenopause'],
  perimenopause: ['Perimenopause', 'Menopause'],
  vulvodynia:    ['vulvodynia', 'PelvicFloor'],
};

// Treatment-focused queries run against every condition-specific subreddit.
// Multiple targeted queries surface more posts than one broad query.
const TREATMENT_QUERIES = [
  'what helped',
  'medication',
  'treatment',
  'anyone tried',
  'worked for me',
  'off label',
  'my doctor prescribed',
  'supplement',
];

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

// ── Reddit fetching ───────────────────────────────────────────────────────────

async function fetchSubredditPosts(subreddit, query) {
  const url =
    `https://www.reddit.com/r/${subreddit}/search.json` +
    `?q=${encodeURIComponent(query)}&sort=top&limit=${POSTS_PER_QUERY}&t=all&restrict_sr=1`;

  const resp = await fetch(url, {
    headers: { 'User-Agent': REDDIT_UA },
  });

  if (!resp.ok) {
    log(`   Warning: r/${subreddit} "${query}" returned ${resp.status}. Skipping.`);
    return [];
  }

  const data = await resp.json();
  const posts = data?.data?.children ?? [];

  return posts
    .map(p => p.data)
    .filter(p => p && (p.selftext || p.title))
    .map(p => ({
      subreddit:   `r/${p.subreddit}`,
      title:       (p.title ?? '').trim(),
      body:        (p.selftext ?? '').slice(0, 1200).trim(),
      score:       p.score ?? 0,
      url:         `https://www.reddit.com${p.permalink}`,
      numComments: p.num_comments ?? 0,
    }));
}

async function fetchAllPosts(condition) {
  const key = condition.toLowerCase().replace(/\s+/g, '');
  const subreddits = CONDITION_SUBREDDITS[key] ?? ['TwoXChromosomes'];

  log(`   Subreddits: ${subreddits.map(s => `r/${s}`).join(', ')}`);
  log(`   Queries: ${TREATMENT_QUERIES.length} treatment-focused searches per subreddit`);

  const allPosts = [];

  for (const sub of subreddits) {
    for (const query of TREATMENT_QUERIES) {
      // Space every request to avoid rate limiting
      await new Promise(r => setTimeout(r, 800));
      const posts = await fetchSubredditPosts(sub, query);
      allPosts.push(...posts);
    }
    log(`   r/${sub}: done (${TREATMENT_QUERIES.length} queries)`);
  }

  // Deduplicate by URL, then sort by score descending
  const seen = new Set();
  const unique = allPosts.filter(p => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  log(`   Total unique posts collected: ${unique.length}`);
  return unique.sort((a, b) => b.score - a.score);
}

// ── Claude analysis ───────────────────────────────────────────────────────────

function buildSystemPrompt(condition) {
  return (
    `You are analyzing patient forum posts from women with ${condition}. ` +
    `Identify any drugs, supplements, or compounds that multiple women report as helpful, ` +
    `with emphasis on treatments that were not originally developed for this condition. ` +
    `Look for off label use, unexpected benefits, and treatments that surprised people. ` +
    `MINIMUM INCLUSION STANDARD: Only include a treatment if it is mentioned by at least 5 distinct users ` +
    `with specific exposure-outcome language (not "metformin changed things" but "after starting metformin, my cycles shortened"). ` +
    `Raw volume is insufficient — you must still see specificity (named symptom), directionality (better or worse), ` +
    `and user diversity (not the same person posting repeatedly). ` +
    `Exclude obvious reposts, promotional content, and low-content comments. ` +
    `If fewer than 5 qualifying posts exist for a treatment, do not include it. ` +
    `Return as JSON array with: compound_name, signal_type (always community_report), ` +
    `evidence_strength (always preliminary), summary, post_count, ` +
    `contributing_posts (array of objects, each with post_index as the integer POST number ` +
    `from the input and excerpt as a brief quote from that post showing what the person reported). ` +
    `Also include these evidence scoring fields: ` +
    `confidence_tier (always "Exploratory" for community signals), ` +
    `replication_score (0 = 5-7 posts, 1 = 8-14 posts, 2 = 15 or more posts), ` +
    `source_quality_score (always 0 for community forum), ` +
    `specificity_score (0 = indirect connection, 1 = condition-adjacent, 2 = direct condition-specific reports), ` +
    `plausibility_score (0 = no known mechanism, 1 = plausible mechanism, 2 = well-characterized mechanism), ` +
    `direction_score (0 = unclear, 1 = mostly consistent, 2 = highly consistent across posts), ` +
    `effect_direction ("improves", "worsens", "mixed", or "unclear"), ` +
    `replication_level ("Low" for 5-7, "Medium" for 8-14, "High" for 15 or more posts), ` +
    `plausibility_level ("Low", "Medium", or "High").`
  );
}

async function analyzeWithClaude(apiKey, condition, posts) {
  // posts are already capped by the caller
  const formatted = posts
    .map((p, i) =>
      `--- POST ${i + 1} (${p.subreddit}, score: ${p.score}) ---\n` +
      `Title: ${p.title}\n` +
      `URL: ${p.url}\n` +
      (p.body ? `Body: ${p.body}` : '')
    )
    .join('\n\n');

  const userMessage =
    `Here are ${posts.length} posts from condition-specific subreddits. ` +
    `Return ONLY a valid JSON array (no markdown, no commentary). ` +
    `If no treatments meet the 5-post threshold described in the system prompt, return [].\n\n` +
    formatted;

  const requestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: buildSystemPrompt(condition),
      messages: [{ role: 'user', content: userMessage }],
    }),
  };

  // Auto-retry on 429 rate-limit errors with linear backoff so back-to-back
  // condition runs survive the input-tokens-per-minute cap.
  const MAX_RETRIES = 3;
  let resp;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, requestInit);
    if (resp.status !== 429) break;
    if (attempt === MAX_RETRIES) break;

    const waitSeconds = 75 * (attempt + 1);
    log(`   Rate limited (429). Waiting ${waitSeconds}s before retry ${attempt + 1}/${MAX_RETRIES}...`);
    await new Promise(r => setTimeout(r, waitSeconds * 1000));
  }

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  const rawText = data.content?.[0]?.text ?? '';

  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Claude did not return a JSON array.\nRaw: ${rawText}`);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    // Truncated response: recover complete objects
    const partialMatches = [...jsonMatch[0].matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g)];
    if (partialMatches.length > 0) {
      const recovered = [];
      for (const m of partialMatches) {
        try { recovered.push(JSON.parse(m[0])); } catch { /* skip malformed */ }
      }
      if (recovered.length > 0) {
        log(`[warn] Claude JSON truncated. Recovered ${recovered.length} complete object(s).`);
        return recovered;
      }
    }
    throw new Error(`Failed to parse Claude JSON: ${e.message}\nRaw: ${jsonMatch[0]}`);
  }
}

// ── Condition ID lookup ───────────────────────────────────────────────────────

const CONDITION_ALIASES = {
  endometriosis:  ['endometriosis'],
  adenomyosis:    ['adenomyosis'],
  pmdd:           ['pmdd', 'premenstrual dysphoric'],
  pcos:           ['pcos', 'polycystic'],
  menopause:      ['menopause', 'perimenopause'],
  perimenopause:  ['perimenopause', 'menopause'],
  vulvodynia:     ['vulvodynia', 'vulvar'],
};

async function lookupConditionId(supabaseUrl, supabaseKey, condition) {
  if (!supabaseUrl || !supabaseKey) return null;
  const key = condition.toLowerCase().replace(/\s+/g, '');
  const terms = CONDITION_ALIASES[key] ?? [condition.toLowerCase()];

  for (const term of terms) {
    try {
      const url =
        `${supabaseUrl}/rest/v1/conditions?name=ilike.*${encodeURIComponent(term)}*&select=id,name&limit=1`;
      const resp = await fetch(url, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      if (!resp.ok) continue;
      const rows = await resp.json();
      if (rows?.[0]?.id) {
        log(`   Found condition: "${rows[0].name}" (${rows[0].id})`);
        return rows[0].id;
      }
    } catch (err) {
      log(`   Lookup error: ${err.message}`);
    }
  }
  return null;
}

// ── SQL helpers ───────────────────────────────────────────────────────────────

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  // Reddit content frequently contains Unicode smart quotes (U+2018, U+2019,
  // U+201C, U+201D) that survive in Postgres string literals but get
  // normalized back to ASCII by some clipboards / SQL editor inputs, which
  // breaks string-literal boundaries. Normalize to ASCII before escaping.
  const normalized = String(val)
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
  return `'${normalized.replace(/'/g, "''")}'`;
}

function toTitleCase(name) {
  if (!name) return name;
  return name
    .split(/(\s+)/)
    .map(part => (/^\s+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
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

function generateSQL(condition, conditionId, signals, fetchedSubreddits, posts = []) {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];

  out.push('-- ================================================================');
  out.push(`-- Women\'s Health Evidence Lab: Reddit Community Pipeline Output`);
  out.push(`-- Condition : ${condition}`);
  out.push(`-- Generated : ${today}`);
  out.push(`-- Model     : ${MODEL}`);
  out.push('-- ================================================================');
  out.push('');

  if (!conditionId) {
    out.push(`-- Warning: Condition "${condition}" was not found in the database.`);
    out.push(`-- Run the query below to find the correct ID, then replace`);
    out.push(`-- every occurrence of CONDITION_ID_HERE in this file.`);
    out.push(`--`);
    out.push(`--   SELECT id, name FROM conditions WHERE name ILIKE '%${condition}%';`);
    out.push('');
    conditionId = 'CONDITION_ID_HERE';
  }

  if (signals.length === 0) {
    out.push('-- No community treatment signals met the minimum inclusion bar.');
    return out.join('\n');
  }

  const enriched = signals
    .map(sig => {
      const tier = deriveConfidenceTier(
        sig.replication_score, sig.source_quality_score, sig.specificity_score,
        sig.plausibility_score, sig.direction_score
      );
      return {
        ...sig,
        compound_name:   toTitleCase(sig.compound_name),
        confidence_tier: tier,
        compoundId:      randomUUID(),
        signalId:        randomUUID(),
        subreddits: Array.isArray(sig.subreddits) && sig.subreddits.length > 0
          ? sig.subreddits
          : fetchedSubreddits,
      };
    })
    .filter(sig => sig.confidence_tier !== null);

  // ── STEP 1: Compounds ──────────────────────────────────────────────────────
  out.push('-- STEP 1: Compounds');
  for (const s of enriched) {
    out.push(`INSERT INTO compounds (id, name, drug_class, fda_status) VALUES (`);
    out.push(`  ${esc(s.compoundId)},`);
    out.push(`  ${esc(s.compound_name)},`);
    out.push(`  NULL,`);
    out.push(`  NULL`);
    out.push(`) ON CONFLICT (lower(name)) DO NOTHING;`);
    out.push('');
  }

  // ── STEP 2: Repurposing signals ────────────────────────────────────────────
  out.push('-- STEP 2: Repurposing signals');
  for (const s of enriched) {
    out.push(`INSERT INTO repurposing_signals`);
    out.push(`  (id, condition_id, compound_id, signal_type, evidence_strength, confidence_tier,`);
    out.push(`   replication_score, source_quality_score, specificity_score, plausibility_score, direction_score,`);
    out.push(`   effect_direction, replication_level, plausibility_level, summary, mechanism_hypothesis, status)`);
    out.push(`SELECT`);
    out.push(`  ${esc(s.signalId)},`);
    out.push(`  ${esc(conditionId)},`);
    out.push(`  c.id,`);
    out.push(`  'community_report',`);
    out.push(`  'preliminary',`);
    out.push(`  ${esc(s.confidence_tier ?? 'Exploratory')},`);
    out.push(`  ${s.replication_score != null ? s.replication_score : 'NULL'},`);
    out.push(`  ${s.source_quality_score != null ? s.source_quality_score : 0},`);
    out.push(`  ${s.specificity_score != null ? s.specificity_score : 'NULL'},`);
    out.push(`  ${s.plausibility_score != null ? s.plausibility_score : 'NULL'},`);
    out.push(`  ${s.direction_score != null ? s.direction_score : 'NULL'},`);
    out.push(`  ${esc(s.effect_direction ?? 'unclear')},`);
    out.push(`  ${esc(s.replication_level ?? null)},`);
    out.push(`  ${esc(s.plausibility_level ?? null)},`);
    out.push(`  ${esc(s.summary)},`);
    out.push(`  NULL,`);
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

  // ── STEP 3: Sources (one row per contributing post, or per subreddit as fallback) ──
  out.push('-- STEP 3: Sources (Reddit community citations)');
  for (const s of enriched) {
    // Build source rows from contributing_posts when Claude returned them
    const contributingPosts = Array.isArray(s.contributing_posts) && s.contributing_posts.length > 0
      ? s.contributing_posts
      : [];

    if (contributingPosts.length === 0) {
      // Claude did not return contributing_posts for this signal — skip sources.
      // Generic subreddit-level URLs are not useful citations.
      out.push(`-- No individual post sources for ${esc(s.compound_name)} (contributing_posts was empty)`);
      out.push('');
      continue;
    }

    // One source row per contributing post using the actual post permalink.
    // Only insert if the URL contains "/comments/" (individual post, not subreddit page).
    for (const cp of contributingPosts) {
      const postIdx = typeof cp.post_index === 'number' ? cp.post_index - 1 : -1;
      const post    = postIdx >= 0 && postIdx < posts.length ? posts[postIdx] : null;
      if (!post) continue;

      // Validate: must be an individual post URL, not a subreddit homepage
      if (!post.url.includes('/comments/')) {
        log(`   [skip] Non-post URL for ${s.compound_name}: ${post.url}`);
        continue;
      }

      const subredditSlug = post.subreddit.replace(/^r\//, '');

      out.push(`INSERT INTO sources`);
      out.push(`  (id, signal_id, source_type, external_id, title, url, key_finding_excerpt)`);
      out.push(`SELECT`);
      out.push(`  gen_random_uuid(),`);
      out.push(`  rs.id,`);
      out.push(`  'reddit',`);
      out.push(`  ${esc(subredditSlug)},`);
      out.push(`  ${esc(post.title)},`);
      out.push(`  ${esc(post.url)},`);
      out.push(`  NULL`);
      out.push(`FROM repurposing_signals rs`);
      out.push(`JOIN compounds c ON rs.compound_id = c.id`);
      out.push(`WHERE c.name = ${esc(s.compound_name)}`);
      out.push(`AND rs.condition_id = ${esc(conditionId)}`);
      out.push(`ON CONFLICT DO NOTHING;`);
      out.push('');
    }
  }

  out.push('-- End of pipeline output');
  return out.join('\n');
}

// ── Logging ───────────────────────────────────────────────────────────────────

function log(msg) {
  process.stderr.write(msg + '\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const condition = process.argv[2];

  if (!condition) {
    process.stderr.write(
      'Usage:   node scripts/reddit-pipeline.js "<condition>"\n' +
      'Example: node scripts/reddit-pipeline.js "endometriosis"\n'
    );
    process.exit(1);
  }

  const env = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    process.stderr.write(
      'Error: ANTHROPIC_API_KEY is not set in .env.local\n' +
      'Add: ANTHROPIC_API_KEY=sk-ant-...\n'
    );
    process.exit(1);
  }

  log(`\nReddit Community Pipeline: "${condition}"`);

  // Step 1: Fetch posts
  log('\nStep 1: Fetching Reddit posts...');
  const key = condition.toLowerCase().replace(/\s+/g, '');
  const fetchedSubreddits = (CONDITION_SUBREDDITS[key] ?? ['TwoXChromosomes']).map(s => `r/${s}`);
  const posts = await fetchAllPosts(condition);
  log(`        Total posts collected: ${posts.length}`);

  if (posts.length === 0) {
    log('No posts found. Try a different condition name.');
    process.exit(0);
  }

  // Step 2: Claude analysis (cap to 200 posts — large enough to surface 5-mention minimum bar)
  const cappedPosts = posts.slice(0, 200);
  if (cappedPosts.length < posts.length) {
    log(`        Capped to ${cappedPosts.length} highest-scored posts for Claude.`);
  }
  log(`\nStep 2: Sending posts to Claude (${MODEL})...`);
  const signals = await analyzeWithClaude(apiKey, condition, cappedPosts);
  log(`        Identified ${signals.length} community treatment signal(s).`);

  if (signals.length > 0) {
    for (const s of signals) {
      log(`          ${s.compound_name} (${s.post_count ?? '?'} posts)`);
    }
  }

  // Step 3: Condition ID lookup
  log('\nStep 3: Looking up condition in Supabase...');
  const conditionId = await lookupConditionId(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    condition
  );
  if (!conditionId) {
    log('        Not found. Fill in CONDITION_ID_HERE manually.');
  }

  // Output SQL
  log('\nGenerating SQL...\n');
  const sql = generateSQL(condition, conditionId, signals, fetchedSubreddits, cappedPosts);
  process.stdout.write(sql + '\n');
}

main().catch(err => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
