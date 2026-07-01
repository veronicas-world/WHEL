# Whel Corpus MCP server

Exposes **everything Whel has scanned and surfaced on the site** — all 183
drug–condition candidates across the six conditions, with tiers, composite
scores, the five dimension scores + rationales, female-applicability weighting,
verbatim evidence claims, and the regulatory / MATRIX / sex-PK side-layers — to
any MCP client (Claude Science, Claude Code, etc.).

The point: when you run a research session in Claude Science, it can read
Whel's **curated reads** (what you've already graded and verified) instead of
re-deriving everything from raw upstream APIs — so it builds *on* your work.

Everything returned is descriptive research context, human-in-the-loop, and
**not clinical or regulatory advice**.

## Setup

1. **Generate the corpus snapshot** (needs your Supabase env, same as the other
   builders):

   ```bash
   # from the repo root, with NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY in env
   node scripts/build-corpus-snapshot.mjs
   ```

   This writes `lib/corpus-snapshot.json`. Re-run it whenever the substrate
   changes to refresh what the server serves.

2. **Install deps:**

   ```bash
   cd mcp/whel-corpus && npm install
   ```

## Register it

**Claude Science / Claude app:** Customize → Connectors → **+ Add connector** →
add a local command connector:

```
node /ABSOLUTE/PATH/TO/rediscover/mcp/whel-corpus/server.mjs
```

**Claude Code:**

```bash
claude mcp add whel-corpus -- node /ABSOLUTE/PATH/TO/rediscover/mcp/whel-corpus/server.mjs
```

or add to `.mcp.json`:

```json
{
  "mcpServers": {
    "whel-corpus": { "command": "node", "args": ["/ABSOLUTE/PATH/TO/rediscover/mcp/whel-corpus/server.mjs"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `whel_corpus_meta` | Overview: build date, total count, conditions, tier distribution (overall + per condition). Call first. |
| `whel_list_candidates` | List/filter candidates as summaries. Filters: `condition`, `tier`, `arm`, `regulatory` (on-label/off-label/no-label/generic), `drug`; paginated. |
| `whel_get_candidate` | Full record for one candidate (by `signalId`, `id` like `WHEL-C-001`, or `drug`+`condition`). |
| `whel_evidence` | The evidence trail for one candidate: rationale, mechanism, dimension scores + rationales, verbatim claims + sources, regulatory reads. |
| `whel_search` | Free-text search across drug, condition, rationale, mechanism, drug class, and claims. |
| `whel_condition_summary` | Per-condition tier distribution + candidate list (one condition or all six). |

## Refreshing

The server reads a static snapshot. After the substrate changes, re-run
`node scripts/build-corpus-snapshot.mjs` and the server serves the new corpus
on next start.
