#!/usr/bin/env node
// Whel Corpus MCP server (stdio).
//
// Exposes Whel's curated drug-repurposing corpus — every candidate the public
// site surfaces, with tiers, scores, dimension rationales, verbatim evidence
// claims, and regulatory/MATRIX/sex-PK side-layers — so an MCP client
// (Claude Science, Claude Code, etc.) can read over everything Whel has
// scanned and graded, and reason on top of Whel's CURATED reads rather than
// raw upstream APIs.
//
// Data source: lib/corpus-snapshot.json (built by scripts/build-corpus-snapshot.mjs).
// Everything returned is descriptive research context, human-in-the-loop, and
// explicitly NOT clinical or regulatory advice.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as corpus from "./corpus.mjs";

const server = new McpServer({ name: "whel-corpus", version: "1.0.0" });
const ok = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

server.registerTool(
  "whel_corpus_meta",
  {
    title: "Whel corpus overview",
    description:
      "Overview of the whole Whel corpus: build date, total candidate count, the six conditions covered, and the tier distribution overall and per condition. Call this first to see what is available.",
    inputSchema: {},
  },
  async () => ok(corpus.meta()),
);

server.registerTool(
  "whel_list_candidates",
  {
    title: "List / filter Whel candidates",
    description:
      "List drug-condition candidates Whel has surfaced, as compact summaries (drug, condition, tier, score, arm, on/off-label, generic availability, trial stage, MATRIX percentile). Filter by condition, tier, evidence arm, regulatory status, or drug substring. Paginated.",
    inputSchema: {
      condition: z.string().optional().describe("condition name or slug, e.g. 'PMDD', 'endometriosis', 'perimenopause-menopause'"),
      tier: z.enum(["strong", "moderate", "emerging", "exploratory"]).optional(),
      arm: z.enum(["direct", "pathway", "community"]).optional().describe("evidence arm"),
      regulatory: z.enum(["on-label", "off-label", "no-label", "generic"]).optional().describe("regulatory-status filter"),
      curationClass: z.enum(["drug", "combination", "supplement", "exclude", "all"]).optional().describe("defaults to 'drug' (clean single-agent index, what the site shows); 'all' includes combinations/supplements/excluded"),
      drug: z.string().optional().describe("drug-name substring"),
      limit: z.number().int().min(1).max(500).optional().default(50),
      offset: z.number().int().min(0).optional().default(0),
    },
  },
  async (args) => ok(corpus.list(args)),
);

server.registerTool(
  "whel_get_candidate",
  {
    title: "Get one Whel candidate (full detail)",
    description:
      "Return the full curated record for a single candidate: tier, composite score, per-arm five-dimension scores + rationales, female-applicability weighting, rationale, mechanism, verbatim evidence claims with sources, and all side-layers (regulatory status, MATRIX, sex-PK, cycle-phase). Identify it by signalId, id (e.g. WHEL-C-001), or drug + condition.",
    inputSchema: {
      signalId: z.string().optional(),
      id: z.string().optional().describe("e.g. WHEL-C-001"),
      drug: z.string().optional(),
      condition: z.string().optional(),
    },
  },
  async (args) => ok(corpus.get(args)),
);

server.registerTool(
  "whel_evidence",
  {
    title: "Get a candidate's evidence + provenance",
    description:
      "Return just the evidence trail for one candidate: rationale, mechanism, the five dimension scores with their rationales, the verbatim source claims (with source labels/links), and the regulatory reads. Use to check WHY Whel graded a pair the way it did. Identify by signalId, id, or drug + condition.",
    inputSchema: {
      signalId: z.string().optional(),
      id: z.string().optional(),
      drug: z.string().optional(),
      condition: z.string().optional(),
    },
  },
  async (args) => ok(corpus.evidence(args)),
);

server.registerTool(
  "whel_search",
  {
    title: "Search the Whel corpus",
    description:
      "Free-text search across every candidate's drug, condition, rationale, mechanism, drug class, and verbatim claims. Returns ranked candidate summaries.",
    inputSchema: {
      query: z.string().describe("search terms, e.g. 'GnRH ovulation suppression' or 'aromatase endometriosis'"),
      limit: z.number().int().min(1).max(200).optional().default(25),
    },
  },
  async ({ query, limit }) => ok(corpus.search(query, limit)),
);

server.registerTool(
  "whel_condition_summary",
  {
    title: "Per-condition summary",
    description:
      "For one condition (or all six if omitted): the tier distribution and the full candidate list (drug, tier, score, label relationship, arm). Use to see coverage for a condition at a glance.",
    inputSchema: {
      condition: z.string().optional().describe("condition name or slug; omit for all six"),
    },
  },
  async ({ condition }) => ok(corpus.conditionSummary(condition)),
);

const transport = new StdioServerTransport();
await server.connect(transport);
