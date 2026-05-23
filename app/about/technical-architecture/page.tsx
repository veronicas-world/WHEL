"use client";

import Link from "next/link";
import { useState } from "react";
import BackLink from "../../components/BackLink";

/* ──────────────────────────────────────────────────────────────────────────
   Shared style tokens
   ────────────────────────────────────────────────────────────────────────── */

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};

const EYEBROW: React.CSSProperties = {
  ...MONO,
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

const CARD: React.CSSProperties = {
  background: "var(--paper)",
  border: "1px solid var(--rule)",
};

const ARM_COLORS: Record<string, string> = {
  "Direct Research": "var(--arm-direct)",
  "Cross-Condition Signals": "var(--arm-cross)",
  "Pathway Insights": "var(--arm-pathway)",
  "Community Forum Reports": "var(--arm-community)",
};

/* ──────────────────────────────────────────────────────────────────────────
   Content — every word is preserved from the previous version of this page
   ────────────────────────────────────────────────────────────────────────── */

const PIPELINES_INTRO =
  "WHEL runs five active data pipelines that populate the database on demand. A sixth pipeline (EudraVigilance) is implemented but not yet contributing signals to the current snapshot.";

const PIPELINES: {
  name: string;
  short: string;
  tag: string;
  api: string;
  status: "Active" | "In development";
  body: string;
}[] = [
  {
    name: "PubMed",
    short: "PubMed",
    tag: "Direct Research",
    api: "NCBI Entrez",
    status: "Active",
    body: "Queries the NCBI Entrez API for published studies directly investigating each condition. Searches are condition specific and filtered for relevance. Results are parsed for study type, date, and abstract, then passed to Claude Opus for signal extraction and evidence strength classification.",
  },
  {
    name: "ClinicalTrials.gov",
    short: "ClinicalTrials.gov",
    tag: "Direct Research",
    api: "REST API v2",
    status: "Active",
    body: "Queries the ClinicalTrials.gov REST API v2 for active, completed, and recruiting trials targeting each condition. Trial phase, status, and intervention type are captured and stored alongside the primary signal.",
  },
  {
    name: "FDA Adverse Event Monitoring System (AEMS) [Formerly FAERS]",
    short: "FDA AEMS",
    tag: "Cross-Condition Signals",
    api: "OpenFDA",
    status: "Active",
    body: "Queries the FDA adverse-event public API (OpenFDA, the system formerly known as FAERS) using a two-pass approach: first targeting gynecological and hormonal terms, then broadening to general reaction terms. Female patient reports are filtered and analyzed for signals suggesting off label benefit. URL encoding and pagination are handled to maximize coverage across all six conditions.",
  },
  {
    name: "Open Targets Platform",
    short: "Open Targets Platform",
    tag: "Pathway Insights",
    api: "GraphQL",
    status: "Active",
    body: "Queries the Open Targets Platform GraphQL API (platform.opentargets.org) for each condition using standardized EFO and MONDO disease ontology identifiers. Retrieves drug candidates, mechanistic associations, and biological target scores aggregated from genetic association data, known drug target interactions, Reactome pathway analysis, and differential gene expression. Results are analyzed by Claude Opus for pathway level repurposing hypotheses. No authentication required.",
  },
  {
    name: "Reddit",
    short: "Reddit",
    tag: "Community Forum Reports",
    api: "Public JSON",
    status: "Active",
    body: "Queries condition specific subreddits (r/Endo, r/PCOS, r/PMDD, r/Menopause, r/adenomyosis, r/vulvodynia) using eight treatment focused search queries per subreddit. Individual post permalinks are stored and validated — URLs must contain /comments/ to confirm they are post level, not subreddit level. Posts are grouped by subreddit in citation display. The pipeline looks for consistent patterns across many posts, not individual anecdotes.",
  },
  {
    name: "EudraVigilance EVDAS (in development — not yet contributing signals)",
    short: "EudraVigilance EVDAS",
    tag: "Cross-Condition Signals",
    api: "Oracle BI API",
    status: "In development",
    body: "Queries the European Medicines Agency adverse event database (dap.ema.europa.eu) via the Oracle BI Analytics API. Substance codes are resolved via the public adrreports.eu substance table. Female patient reaction data is filtered and grouped by condition. Requires a free registered EMA account for session authentication. This pipeline is implemented but has not yet been ingested into the current database snapshot.",
  },
];

const SCORING_INTRO =
  "WHEL applies a structured, multidimensional inclusion framework to every signal before it enters the database. The goal is not a single universal cutoff, but a tiered evidence framework with minimum standards for reliability, reproducibility, and actionability. The framework was developed in consultation with published research on evidence synthesis and pharmacovigilance methodology, drawing on established practices in systematic review design and drug repurposing research.";

const MODEL_NOTE =
  "All signal analysis and scoring is performed using Claude Opus 4.6 (claude-opus-4-6), Anthropic's most capable model. Opus 4.6 was selected specifically for its performance on complex multicriteria reasoning tasks. Independent benchmarks consistently place Opus at the top of evaluations requiring simultaneous assessment across multiple analytical dimensions — precisely what evidence scoring requires. Smaller or faster models were evaluated and found to produce flatter, less discriminating scores, particularly on biological plausibility and confounding risk assessment. For a tool where the quality of the evidence evaluation is the core product, model selection is not a minor implementation detail.";

const FRAMEWORK_INTRO =
  "Every signal is independently scored from 0 to 2 on five dimensions, for a maximum total score of 10. Scores are assigned by Claude Opus 4.6 based on the full source content, not just metadata.";

const RUBRIC: { dim: string; note: string; s0: string; s1: string; s2: string }[] = [
  {
    dim: "Replication",
    note: "Whether the finding has been independently observed across separate sources.",
    s0: "Single source only.",
    s1: "Two independent sources.",
    s2: "Three or more independent sources pointing in the same direction.",
  },
  {
    dim: "Source Quality",
    note: "The evidentiary weight of the underlying data.",
    s0: "Forum or anecdotal data only.",
    s1: "Observational, registry, or pharmacovigilance data.",
    s2: "Peer reviewed human study or clinical trial.",
  },
  {
    dim: "Specificity",
    note: "Whether the outcome is clearly defined and clinically relevant to the condition.",
    s0: "Vague outcome (\u201Cimproved,\u201D \u201Cfelt better\u201D).",
    s1: "Symptom specific outcome (pelvic pain, cycle regularity, mood lability).",
    s2: "Clearly defined condition specific clinical endpoint.",
  },
  {
    dim: "Biological Plausibility",
    note: "The strength and specificity of the mechanistic rationale.",
    s0: "Unclear or absent mechanism.",
    s1: "Broad but plausible mechanism.",
    s2: "Well characterized drug target pathway disease fit (e.g., COX-2 inhibition and prostaglandin dysregulation in endometriosis).",
  },
  {
    dim: "Consistency of Direction",
    note: "Whether the effect direction is consistent across sources.",
    s0: "Mixed or conflicting findings.",
    s1: "Mostly consistent direction.",
    s2: "Clearly consistent direction across all sources.",
  },
];

const TIERS_INTRO =
  "Total scores map to four confidence tiers displayed on every signal card:";

const TIERS: { name: string; range: string; color: string; soft: string; desc: string }[] = [
  {
    name: "Strong",
    range: "9 to 10",
    color: "var(--tier-strong)",
    soft: "var(--tier-strong-soft)",
    desc: "Highly replicated, well characterized signals with consistent direction across multiple evidence types.",
  },
  {
    name: "Moderate",
    range: "7 to 8",
    color: "var(--tier-moderate)",
    soft: "var(--tier-moderate-soft)",
    desc: "Replicated findings with solid mechanistic rationale.",
  },
  {
    name: "Emerging",
    range: "4 to 6",
    color: "var(--tier-emerging)",
    soft: "var(--tier-emerging-soft)",
    desc: "Early stage evidence with some corroboration or mechanistic support.",
  },
  {
    name: "Exploratory",
    range: "0 to 3",
    color: "var(--tier-exploratory)",
    soft: "var(--tier-exploratory-soft)",
    desc: "Single source, mechanistic, or low specificity signals included for hypothesis generation only.",
  },
];

const CATEGORY_STANDARDS: { label: string; body: string }[] = [
  {
    label: "Direct Research",
    body: "The highest-confidence category carries the highest bar. Minimum requirements: at least one peer reviewed human study with clearly identified population, drug, outcome, and effect direction. Signals are excluded if they are mechanistic only with no human data. Preferred: at least one prospective study, trial, or meta-analysis. Quality criteria prioritize replication and outcome relevance over citation count — a highly cited older paper with no replication is not equivalent to two recent independent studies with similar findings.",
  },
  {
    label: "Cross-Condition Signals",
    body: "These signals are hypothesis generating by nature. Minimum requirements: the signal must appear in at least two independent evidence domains (published literature plus FDA AEMS, adverse event data plus community reports, or similar cross-domain corroboration), with the same direction of effect and a plausible shared biological mechanism. Three or more formal source mentions pointing in the same direction also qualify. Vague similarity between conditions is not sufficient — a documented shared pathway is required.",
  },
  {
    label: "Pathway Insights",
    body: "Pathway signals are powerful but easy to overinterpret. Minimum requirements: a specific named mechanism (mast cell activation, prostaglandin signaling, androgen receptor modulation — not generic \"inflammation\"), at least one known drug target link, and at least one disease pathway link. Pathway-only signals with no human or pharmacovigilance corroboration are classified Exploratory and displayed with explicit framing. Pathway signals paired with human observation are classified Emerging or Moderate. Pathway signals with human observation plus independent replication are classified Strong.",
  },
  {
    label: "Community Forum Reports",
    body: "This category requires the clearest guardrails. Minimum requirements: 5 or more distinct posts with specific exposure-outcome language from unique users. Raw volume alone is insufficient — the framework still requires specificity (not \"metformin changed things\" but \"after starting metformin, my cycles shortened and acne improved\"), directionality (improvement, worsening, or no change), and unique-user diversity across threads. Obvious reposts, promotional content, and low-content comments are excluded. Replication is graded on a 0–2 scale (0 = 5–7 posts, 1 = 8–14 posts, 2 = 15 or more posts). Signals with 15 or more qualifying mentions and consistent directional language are eligible for Moderate classification, particularly when triangulated with a formal source. WHEL also tracks which forums a signal appears in, the time period of discussion, and whether the signal persists over time or reflects a temporary spike.",
  },
];

const RELIABILITY_INTRO =
  "For every signal across all four categories, WHEL applies five cross-cutting reliability checks:";

const RELIABILITY: { label: string; body: string }[] = [
  {
    label: "Outcome specificity",
    body: "\"Improved\" is insufficient. Qualifying outcomes include pelvic pain, heavy bleeding, cycle regularity, mood lability in luteal phase, vulvar burning, and similar condition specific clinical endpoints.",
  },
  {
    label: "Effect directionality",
    body: "Every signal must be classified as one of: improves, worsens, mixed, or unclear.",
  },
  {
    label: "Replication",
    body: "One source is interesting. Two or more independent sources start to constitute a signal.",
  },
  {
    label: "Confounding assessment",
    body: "Known confounders are flagged — drugs with multiple indications where symptom improvement may be indirect, forum populations reporting multiple concurrent therapies, and adverse event data that may reflect reporting bias rather than true incidence.",
  },
  {
    label: "Denominator awareness",
    body: "FDA AEMS and community data do not provide true incidence rates. They are signal generating sources, not causal datasets. All signals from these sources are labeled accordingly and require corroboration before elevation above Emerging.",
  },
];

const PRINCIPLE_BODY =
  "A rare but repeatedly observed, highly specific signal from a single credible source may carry more evidential weight than 500 vague forum mentions. WHEL's scoring framework is designed to privilege specificity, reproducibility, and triangulation over raw volume.";

const INFRASTRUCTURE: { label: string; body: string }[] = [
  {
    label: "Database",
    body: "Supabase (PostgreSQL) with Row Level Security. Core tables include conditions, compounds, repurposing_signals, and sources. The repurposing_signals table stores five scoring dimensions (replication, source quality, specificity, plausibility, direction), a computed total evidence score, confidence tier, effect direction, and human readable level labels. Signals are deduplicated at both the pipeline level (by post ID for Reddit, by compound and condition pair for all sources) and via database constraints.",
  },
  {
    label: "Frontend",
    body: "Next.js (TypeScript) with Tailwind CSS, hosted on Vercel. Analytics via Vercel Analytics.",
  },
  {
    label: "Source deduplication",
    body: "Sources are deduplicated by URL before storage. The frontend applies additional normalization to prevent the same compound appearing multiple times in the same evidence bucket.",
  },
];

const LIMITATIONS_INTRO =
  "WHEL is a signal aggregator, not a clinical recommendation engine. Evidence strength classifications are generated by a language model against a published five-dimension rubric and should be treated as a starting point for further investigation, not a definitive assessment. Community Forum Reports reflect patient-reported patterns and are explicitly not clinical evidence. The absence of signals in the Direct Research arm for a given condition is itself data — it reflects the current state of published research, not a gap in the tool. The full list of known limitations is documented below, grouped for navigation.";

const LIMITATION_GROUPS: { heading: string; items: { label: string; body: string }[] }[] = [
  {
    heading: "Methodology",
    items: [
      {
        label: "LLM classification risk",
        body: "Evidence strength classifications are generated by Claude Opus 4.6 against a published five-dimension rubric. While the rubric and JSON-schema validation reduce variability, three concrete classes of LLM-introduced error remain: (1) mechanistic misinterpretation — the model may overstate the specificity of a target-pathway match, particularly for under-characterized pathways; (2) prompt sensitivity — small changes to the system prompt have produced measurable shifts in tier assignment in our internal testing; (3) hallucinated citations — although the rubric requires the model to score against the source content provided, occasional fabricated references have been observed and are mitigated by validating each cited source URL or PMID before database insertion. A planned validation pass will quantify per-tier concordance against expert human raters; until then, all signals should be treated as starting points for further verification, not assessments.",
      },
      {
        label: "LLM versioning and prompt drift",
        body: "Both the model and the system prompts evolve over the lifecycle of the project. Each pipeline run is logged with the model version (claude-opus-4-6 at current snapshot) and a hash of the active prompt; snapshots taken months apart should not be compared signal-for-signal without re-running classification with a pinned model and prompt. The repository preserves prompt history for reproducibility.",
      },
    ],
  },
  {
    heading: "Source-specific bias",
    items: [
      {
        label: "Publication bias",
        body: "PubMed indexes positive results disproportionately, and English-language journals dominate. Signals sourced from published literature may be upwardly biased toward favorable findings and toward research conducted in Western academic contexts.",
      },
      {
        label: "AEMS (FAERS) reporting bias",
        body: "Spontaneous adverse event reports submitted to the FDA AEMS database (formerly FAERS) are subject to indication bias, channeling bias, the Weber effect (reports surge after media coverage), and notoriety bias. These signals are hypothesis-generating only and should not be interpreted as causal estimates of effect.",
      },
      {
        label: "Cross-condition signal interpretation",
        body: "Cross-Condition Signals identify drugs developed for other indications where women incidentally reported benefit for one of the six target conditions. Such signals can reflect three different underlying realities: (a) genuine pharmacological effect on a shared mechanism (the desired interpretation), (b) confounding by comorbidity — the same patient population happens to carry both the original indication and the target condition with no causal pharmacological link, or (c) reporting artifact — patients with a target condition may be more likely to report any adverse event as condition-related. Triangulation across literature, AEMS, and pathway data is required before elevation above Emerging, but no triangulation eliminates this ambiguity entirely.",
      },
      {
        label: "Pathway insight inference is weak",
        body: "Open Targets and similar pathway databases connect drugs to targets and targets to diseases via integrated genetic-association, expression-quantitative, and known-drug-target evidence. The inferential bridge from \"drug A modulates target T, target T is associated with condition D\" to \"drug A may help condition D\" is structurally weak. Pathway-only signals are explicitly classified Exploratory and labeled accordingly; pathway signals are intended to surface mechanistic hypotheses worth investigating, not therapeutic candidates.",
      },
      {
        label: "Reddit community selection bias",
        body: "Reddit users skew young, English-speaking, and treatment-frustrated. The Community Forum Reports arm captures what motivated communities discuss, which is not identical to what actually helps a representative population. Bot accounts, duplicate accounts, and coordinated discussion cannot be fully screened for; permalink validation and cross-subreddit confirmation partially mitigate this but do not eliminate it.",
      },
    ],
  },
  {
    heading: "Scope and generalizability",
    items: [
      {
        label: "Generalizability is not stratified",
        body: "The current database does not stratify signals by race, age band, geography, or comorbidity profile. The aggregate evidence pattern presented for each condition reflects the population mix of the underlying sources — predominantly mixed-race or unspecified-race trial populations from US- and EU-based studies, PubMed authors disproportionately publishing in English, and Reddit communities skewing young, English-speaking, and Western. Signals should not be assumed to generalize uniformly across subpopulations.",
      },
      {
        label: "Geographic and language scope",
        body: "All ingested sources except Open Targets are predominantly or exclusively English. The EudraVigilance pipeline (in development) will broaden European pharmacovigilance coverage. The Reddit communities targeted are English-language. Patient-reported community signal in non-English forums is not currently captured.",
      },
      {
        label: "Sex-disaggregated data gap",
        body: "Many PubMed and ClinicalTrials.gov studies do not report sex-disaggregated results. Some signals labeled as relevant to women are inferred from mixed-sex study populations; where this inference is made, it is noted on the source citation.",
      },
      {
        label: "Database completeness",
        body: "WHEL's coverage of each condition is bounded by the scope of the search queries used in each pipeline. Compounds entirely outside our query terms — for example, a recently introduced biologic with no AEMS reports yet, or a long-tail traditional medicine without PubMed coverage — will not appear regardless of their actual relevance. Coverage gaps are systematically larger for the rarer of the six conditions (vulvodynia, adenomyosis) than for the better-studied ones (endometriosis, PCOS).",
      },
      {
        label: "Signal age and treatment-landscape drift",
        body: "A signal extracted from a 2014 trial may no longer reflect current standard of care, drug formulation, or dosing practice. The current snapshot does not yet flag signals as superseded when newer evidence reverses the direction of effect. Users should treat older signals with appropriate caution and rely on the linked source citations to assess timeliness.",
      },
    ],
  },
  {
    heading: "Operational and disclosure",
    items: [
      {
        label: "Data freshness",
        body: "The signal database reflects a point-in-time snapshot based on when pipelines were last run. New literature and adverse event reports are not captured automatically. Last pipeline run: May 2026.",
      },
      {
        label: "Conflict of interest and funding",
        body: "WHEL is an independent research project. The authors declare no funding from the pharmaceutical industry, no compensation for any specific drug-condition pair surfaced by the database, and no commercial product associated with the project. Hosting infrastructure (Vercel and Supabase free tiers) is at the personal expense of the authors. A formal funding statement will accompany any peer-reviewed publication.",
      },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   Small presentational helpers
   ────────────────────────────────────────────────────────────────────────── */

function FigureHeader({
  label,
  title,
  intro,
}: {
  label: string;
  title: string;
  intro?: string;
}) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ borderTop: "1px solid var(--ink)", marginBottom: 26 }} />
      <div style={{ ...EYEBROW, marginBottom: 13 }}>{label}</div>
      <h2
        className="font-heading"
        style={{
          fontSize: "clamp(1.6rem, 3vw, 2.15rem)",
          fontWeight: 500,
          lineHeight: 1.1,
          letterSpacing: "-0.012em",
          color: "var(--ink)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      {intro && (
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.68,
            color: "var(--ink-2)",
            maxWidth: "68ch",
            marginTop: 16,
          }}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

const SECTION_INNER = "max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20";

/* ──────────────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────────────── */

export default function TechnicalArchitecturePage() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  function toggleGroup(heading: string) {
    setOpenGroup((prev) => (prev === heading ? null : heading));
  }

  return (
    <main className="flex-1" style={{ backgroundColor: "var(--bg)" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <nav
            style={{
              ...MONO,
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 20,
            }}
          >
            <Link href="/" style={{ color: "var(--muted)" }}>Home</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <Link href="/about" style={{ color: "var(--muted)" }}>About</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <span style={{ color: "var(--ink)" }}>Technical Architecture</span>
          </nav>
          <h1
            className="font-heading"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: 16,
            }}
          >
            Technical architecture.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "56ch" }}>
            The data pipelines, the five-dimension scoring framework, the
            infrastructure, and the documented limitations behind every signal.
          </p>

          <div style={{ marginTop: 28 }}>
            <a
              href="/whel-methods-v0.1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...MONO,
                display: "inline-flex",
                alignItems: "baseline",
                gap: 10,
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--paper)",
                backgroundColor: "var(--green-deep)",
                border: "1px solid var(--green-deep)",
                padding: "12px 20px",
                textDecoration: "none",
              }}
            >
              Read the methods (PDF)
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Figure 1 — Pipeline register ─────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Figure 1 · Pipeline register"
            title="The data pipelines"
            intro={PIPELINES_INTRO}
          />

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 620,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  {["Pipeline", "Evidence arm", "API", "Status"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        ...MONO,
                        fontSize: "10.5px",
                        fontWeight: 500,
                        letterSpacing: "0.13em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        textAlign: "left",
                        padding: i === 0 ? "0 14px 11px 0" : "0 14px 11px 14px",
                        borderBottom: "1px solid var(--rule-strong)",
                        width: ["30%", "30%", "20%", "20%"][i],
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PIPELINES.map((p) => (
                  <tr key={p.name}>
                    <td
                      className="font-heading"
                      style={{
                        fontSize: "16px",
                        color: "var(--ink)",
                        padding: "15px 14px 15px 0",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "baseline",
                      }}
                    >
                      {p.short}
                    </td>
                    <td
                      style={{
                        padding: "15px 14px",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "baseline",
                      }}
                    >
                      <span
                        style={{
                          ...MONO,
                          fontSize: "10px",
                          fontWeight: 500,
                          letterSpacing: "0.09em",
                          textTransform: "uppercase",
                          color: ARM_COLORS[p.tag],
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            display: "inline-block",
                            width: 7,
                            height: 7,
                            marginRight: 7,
                            backgroundColor: ARM_COLORS[p.tag],
                          }}
                        />
                        {p.tag}
                      </span>
                    </td>
                    <td
                      style={{
                        ...MONO,
                        fontSize: "12.5px",
                        color: "var(--muted)",
                        padding: "15px 14px",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "baseline",
                      }}
                    >
                      {p.api}
                    </td>
                    <td
                      style={{
                        ...MONO,
                        fontSize: "12.5px",
                        color: p.status === "Active" ? "var(--green-mid)" : "var(--tier-emerging)",
                        padding: "15px 14px",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "baseline",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ● {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pipeline detail cards */}
          <div className="space-y-3" style={{ marginTop: 28 }}>
            {PIPELINES.map((p) => (
              <div
                key={p.name}
                style={{
                  ...CARD,
                  borderLeft: `3px solid ${ARM_COLORS[p.tag]}`,
                  padding: "22px 24px",
                }}
              >
                <p
                  className="font-heading"
                  style={{ fontSize: "17px", color: "var(--ink)", marginBottom: 7 }}
                >
                  {p.name}
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.62, color: "var(--ink-2)" }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Figure 2 — Scoring framework ─────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Figure 2 · Scoring framework"
            title="How evidence is scored"
            intro={SCORING_INTRO}
          />

          {/* Model selection callout */}
          <div
            style={{
              ...CARD,
              backgroundColor: "var(--bg-2)",
              borderLeft: "3px solid var(--accent)",
              padding: "22px 24px",
            }}
          >
            <p
              className="font-heading"
              style={{ fontSize: "17px", color: "var(--ink)", marginBottom: 7 }}
            >
              Model Selection: Claude Opus 4.6
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.62, color: "var(--ink-2)" }}>
              {MODEL_NOTE}
            </p>
          </div>

          {/* Five-dimension rubric */}
          <p
            className="font-heading"
            style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink)", marginTop: 36, marginBottom: 6 }}
          >
            The Five-Dimension Scoring Framework
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "68ch" }}>
            {FRAMEWORK_INTRO}
          </p>

          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table
              style={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  {["Dimension", "Score 0", "Score 1", "Score 2"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        ...MONO,
                        fontSize: "10.5px",
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        textAlign: "left",
                        padding: i === 0 ? "0 14px 11px 0" : "0 14px 11px 14px",
                        borderBottom: "1px solid var(--ink)",
                        width: i === 0 ? "31%" : "23%",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RUBRIC.map((r) => (
                  <tr key={r.dim}>
                    <td
                      style={{
                        padding: "15px 14px 15px 0",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "top",
                      }}
                    >
                      <div
                        className="font-heading"
                        style={{ fontSize: "16px", color: "var(--ink)", marginBottom: 3 }}
                      >
                        {r.dim}
                      </div>
                      <div style={{ fontSize: "12px", lineHeight: 1.45, color: "var(--muted)" }}>
                        {r.note}
                      </div>
                    </td>
                    {[r.s0, r.s1, r.s2].map((cell, idx) => (
                      <td
                        key={idx}
                        style={{
                          padding: "15px 14px",
                          borderBottom: "1px solid var(--rule)",
                          backgroundColor: "var(--paper)",
                          verticalAlign: "top",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          color: "var(--ink-2)",
                        }}
                      >
                        <span
                          style={{
                            ...MONO,
                            display: "block",
                            fontSize: "10px",
                            fontWeight: 500,
                            letterSpacing: "0.06em",
                            color: "var(--muted-2)",
                            marginBottom: 4,
                          }}
                        >
                          {idx}
                        </span>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Figure 3 — Confidence tiers ──────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Figure 3 · Tier mapping"
            title="Confidence tiers"
            intro={TIERS_INTRO}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TIERS.map((t) => (
              <div
                key={t.name}
                style={{
                  ...CARD,
                  borderTop: `3px solid ${t.color}`,
                  padding: "22px 22px 24px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    ...MONO,
                    display: "inline-flex",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: 7,
                    padding: "5px 9px",
                    marginBottom: 16,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    backgroundColor: t.soft,
                    color: t.color,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ display: "inline-block", width: 8, height: 8, backgroundColor: t.color }}
                  />
                  {t.name}
                </span>
                <div
                  className="font-heading"
                  style={{ fontSize: "23px", fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 14,
                  }}
                >
                  Composite {t.range}
                </div>
                <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: "var(--ink-2)" }}>
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Figure 4 — Category-specific standards ───────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Figure 4 · Category standards"
            title="Category-specific minimum standards"
          />

          <div className="space-y-3">
            {CATEGORY_STANDARDS.map((c) => (
              <div
                key={c.label}
                style={{
                  ...CARD,
                  borderLeft: `3px solid ${ARM_COLORS[c.label]}`,
                  padding: "22px 24px",
                }}
              >
                <p
                  className="font-heading"
                  style={{ fontSize: "17px", color: "var(--ink)", marginBottom: 7 }}
                >
                  {c.label}
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--ink-2)" }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Figure 5 — Cross-cutting reliability rules ───────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Figure 5 · Reliability rules"
            title="Cross-cutting reliability rules"
            intro={RELIABILITY_INTRO}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {RELIABILITY.map((r) => (
              <div key={r.label} style={{ ...CARD, padding: "20px 22px" }}>
                <p
                  className="font-heading"
                  style={{ fontSize: "16px", color: "var(--ink)", marginBottom: 6 }}
                >
                  {r.label}
                </p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.6, color: "var(--ink-2)" }}>
                  {r.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Guiding principle ────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <div style={{ backgroundColor: "var(--green-deep)", padding: "clamp(32px, 5vw, 48px)" }}>
            <div
              style={{
                ...MONO,
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--green-soft)",
                marginBottom: 16,
              }}
            >
              One Guiding Principle
            </div>
            <p
              className="font-heading"
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: "var(--paper)",
                marginBottom: 14,
              }}
            >
              Frequency is not truth.
            </p>
            <p
              style={{
                fontSize: "14.5px",
                lineHeight: 1.62,
                color: "rgba(251,248,241,0.78)",
                maxWidth: "74ch",
              }}
            >
              {PRINCIPLE_BODY}
            </p>
          </div>
        </div>
      </section>

      {/* ── Figure 6 — Database and infrastructure ───────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Figure 6 · Infrastructure"
            title="Database and infrastructure"
          />

          <div style={{ ...CARD, borderTop: "1px solid var(--ink)" }}>
            {INFRASTRUCTURE.map((row, i) => (
              <div
                key={row.label}
                className="flex flex-col sm:flex-row"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--rule)" }}
              >
                <div
                  className="font-heading"
                  style={{
                    fontSize: "16px",
                    color: "var(--ink)",
                    padding: "20px 22px",
                    flex: "0 0 auto",
                    width: "100%",
                    maxWidth: 220,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.62,
                    color: "var(--ink-2)",
                    padding: "20px 22px",
                    borderLeft: "1px solid var(--rule)",
                    flex: 1,
                  }}
                >
                  {row.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Figure 7 — Documented limitations ────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Figure 7 · Limitations"
            title="Documented limitations"
            intro={LIMITATIONS_INTRO}
          />

          <div className="space-y-3">
            {LIMITATION_GROUPS.map((group) => {
              const isOpen = openGroup === group.heading;
              return (
                <div
                  key={group.heading}
                  style={{
                    border: "1px solid var(--rule)",
                    borderLeft: isOpen ? "3px solid var(--green-mid)" : "1px solid var(--rule)",
                    backgroundColor: "var(--paper)",
                    transition: "border-left 0.15s ease",
                  }}
                >
                  <button
                    onClick={() => toggleGroup(group.heading)}
                    className="w-full text-left flex items-center justify-between gap-6 p-5 sm:p-6"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-baseline gap-3 min-w-0">
                      <span
                        className="font-heading"
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 500,
                          color: isOpen ? "var(--green-mid)" : "var(--ink)",
                        }}
                      >
                        {group.heading}
                      </span>
                      <span
                        style={{
                          ...MONO,
                          fontSize: "11px",
                          letterSpacing: "0.06em",
                          color: "var(--muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {group.items.length} {group.items.length === 1 ? "limitation" : "limitations"}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-lg font-light"
                      style={{ color: "var(--green-mid)", lineHeight: 1 }}
                      aria-hidden="true"
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid var(--rule)" }}>
                      {group.items.map((item, i) => (
                        <div
                          key={item.label}
                          className="px-5 sm:px-6 py-5"
                          style={{ borderTop: i === 0 ? "none" : "1px solid var(--rule)" }}
                        >
                          <p
                            className="font-heading"
                            style={{ fontSize: "15.5px", color: "var(--ink)", marginBottom: 6 }}
                          >
                            {item.label}
                          </p>
                          <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: "var(--ink-2)" }}>
                            {item.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem", marginTop: "2.5rem" }}>
            <BackLink href="/about" label="Back to About" />
          </div>
        </div>
      </section>

    </main>
  );
}
