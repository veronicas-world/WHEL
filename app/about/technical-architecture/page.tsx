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

// The three-layer architecture and its honest current status. The substrate model
// is the target architecture; this records what is actually built per layer so the
// public framing (manifesto, platform, home) can be checked against reality.
const LAYERS: { n: string; name: string; status: string; color: string; body: string }[] = [
  {
    n: "Layer 01",
    name: "The substrate",
    status: "Foundation live · graph live (Open Targets conditions)",
    color: "var(--green-mid)",
    body: "The corrected, sex-aware knowledge base. Its grounding is live: every condition resolves to a MONDO disease identifier and every drug to canonical ChEMBL and RxNorm identifiers, so entities are matched by identity rather than by name string. The graph itself, the drug-to-target-to-disease edges drawn from Open Targets, is now built over the conditions Open Targets covers and surfaces a graph-supports or graph-silent cross-check beside each signal in the gated view. Where Open Targets has no entry, the graph stays silent, which is shown rather than hidden. The sex-aware extension splits in two: sex-specific pharmacokinetics is now seeded for an initial set of compounds, each sourced to an FDA drug label or the curated sex-PK literature (Zucker & Prendergast 2020; Soldin & Mattison 2009) and shown beside the signal, while cyclical hormonal phase remains schema only, not yet populated.",
  },
  {
    n: "Layer 02",
    name: "Retrieval and validation",
    status: "Built as a flagship (PMDD, PMS)",
    color: "var(--tier-emerging)",
    body: "Provenance-preserving extraction: each atomic claim is tied to a verbatim source span, checked for entailment against that span, and contradictions in the literature are surfaced rather than averaged. This is built and running, but seeded for PMDD and PMS only; it is not yet extended across all six conditions or wired into the main signal index.",
  },
  {
    n: "Layer 03",
    name: "Hypothesis from signal",
    status: "Intake live · validation loop flagship",
    color: "var(--arm-community)",
    body: "Off-label and patient-community signal as hypothesis generation. The community arm is live across all six conditions, where the Reddit pipeline and off-label patterns feed the index. The formal downstream validation against mechanistic and clinical evidence runs through the same PMDD flagship as Layer 02.",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   Content — every word is preserved from the previous version of this page
   ────────────────────────────────────────────────────────────────────────── */

const PIPELINES_INTRO =
  "Whel runs five active data pipelines that populate the database on demand. A sixth pipeline (EudraVigilance) is implemented but not yet contributing signals to the current snapshot.";

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
    body: "Queries condition specific subreddits (r/Endo, r/PCOS, r/PMDD, r/Menopause, r/adenomyosis, r/vulvodynia) using eight treatment focused search queries per subreddit. Individual post permalinks are stored and validated; URLs must contain /comments/ to confirm they are post level rather than subreddit level. Posts are grouped by subreddit in citation display. The pipeline looks for consistent patterns across many posts, not individual anecdotes.",
  },
  {
    name: "EudraVigilance EVDAS (in development, not yet contributing signals)",
    short: "EudraVigilance EVDAS",
    tag: "Cross-Condition Signals",
    api: "Oracle BI API",
    status: "In development",
    body: "Queries the European Medicines Agency adverse event database (dap.ema.europa.eu) via the Oracle BI Analytics API. Substance codes are resolved via the public adrreports.eu substance table. Female patient reaction data is filtered and grouped by condition. Requires a free registered EMA account for session authentication. This pipeline is implemented but has not yet been ingested into the current database snapshot.",
  },
];

const SCORING_INTRO =
  "Whel applies a structured, multidimensional inclusion framework to every signal before it enters the database. The goal is a tiered evidence framework with minimum standards for reliability, reproducibility, and actionability, rather than a single universal cutoff. The framework was developed in consultation with published research on evidence synthesis and pharmacovigilance methodology, drawing on established practices in systematic review design and drug repurposing research.";

// Model-selection prose is rendered inline as JSX in the Figure 2 callout
// below so the WHBench citation can sit inside the paragraph as a hyperlink.

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

const RELIABILITY_INTRO =
  "For every signal across all four categories, Whel applies five cross-cutting reliability checks:";

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
    body: "Known confounders are flagged: drugs with multiple indications where symptom improvement may be indirect, forum populations reporting multiple concurrent therapies, and adverse event data that may reflect reporting bias rather than true incidence.",
  },
  {
    label: "Denominator awareness",
    body: "FDA AEMS and community data do not provide true incidence rates. They are signal generating sources, not causal datasets. All signals from these sources are labeled accordingly and require corroboration before elevation above Emerging.",
  },
];

const PRINCIPLE_BODY =
  "A rare but repeatedly observed, highly specific signal from a single credible source may carry more evidential weight than 500 vague forum mentions. Whel's scoring framework is designed to privilege specificity, reproducibility, and triangulation over raw volume.";

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
  "Whel is a signal aggregator rather than a clinical recommendation engine. Evidence strength classifications are generated by a language model against a published five-dimension rubric and should be treated as a starting point for further investigation, not a definitive assessment. Community Forum Reports reflect patient-reported patterns and are explicitly not clinical evidence. The absence of signals in the Direct Research arm for a given condition is itself data; it reflects the current state of published research rather than a gap in the tool. The full list of known limitations is documented below, grouped for navigation.";

const LIMITATION_GROUPS: { heading: string; items: { label: string; body: string }[] }[] = [
  {
    heading: "Methodology",
    items: [
      {
        label: "LLM classification risk",
        body: "Evidence strength classifications are generated by Claude Opus 4.6 against a published five-dimension rubric. While the rubric and JSON-schema validation reduce variability, three concrete classes of LLM-introduced error remain: (1) mechanistic misinterpretation, where the model may overstate the specificity of a target-pathway match, particularly for under-characterized pathways; (2) prompt sensitivity, where small changes to the system prompt have produced measurable shifts in tier assignment in our internal testing; (3) hallucinated citations, where occasional fabricated references have been observed despite the rubric requiring the model to score against the source content provided, and are mitigated by validating each cited source URL or PMID before database insertion. A planned validation pass will quantify per-tier concordance against expert human raters; until then, all signals should be treated as starting points for further verification, not assessments.",
      },
      {
        label: "LLM versioning and prompt drift",
        body: "Both the model and the system prompts evolve over the lifecycle of the project. Each pipeline run is logged with the model version (claude-opus-4-6 at current snapshot) and a hash of the active prompt; snapshots taken months apart should not be compared signal-for-signal without re-running classification with a pinned model and prompt. The repository preserves prompt history for reproducibility.",
      },
      {
        label: "External review and remediation",
        body: "An independent external reviewer audit completed May 29 2026 surfaced two material findings. The first was a replication-score drift in the LLM rater: the published rubric defines Replication = 0 for one source, 1 for two independent sources, and 2 for three or more, but the rater had been counting more loosely. The rater prompts in all four pipelines were tightened to enforce literal source counting; 14 signals were downgraded to the tier the literature actually supports; and 19 manually-verified PubMed citations were added so each remaining Moderate-tier signal carries the source count the strict rubric requires. The second was a set of 21 ClinicalTrials.gov citations filed under conditions the trials were not run on: 10 signals were deactivated, 5 were reassigned from clinical-trial-finding to cross-condition framing, 1 source was dropped where the signal retained independent support, 2 sources were replaced with proper condition-specific citations, and 1 row was documented as a ClinicalTrials.gov API field limitation. The full audit trail is recorded in database migrations 036 through 040 and in the methodology version log.",
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
        body: "Cross-Condition Signals identify drugs developed for other indications where women incidentally reported benefit for one of the six target conditions. Such signals can reflect three different underlying realities: (a) a real pharmacological effect on a shared mechanism (the desired interpretation), (b) confounding by comorbidity, where the same patient population happens to carry both the original indication and the target condition with no causal pharmacological link, or (c) reporting artifact, where patients with a target condition may be more likely to report any adverse event as condition-related. Triangulation across literature, AEMS, and pathway data is required before elevation above Emerging, but no triangulation eliminates this ambiguity entirely.",
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
        body: "The current database does not stratify signals by race, age band, geography, or comorbidity profile. The aggregate evidence pattern presented for each condition reflects the population mix of the underlying sources: predominantly mixed-race or unspecified-race trial populations from US- and EU-based studies, PubMed authors disproportionately publishing in English, and Reddit communities skewing young, English-speaking, and Western. Signals should not be assumed to generalize uniformly across subpopulations.",
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
        body: "Whel's coverage of each condition is bounded by the scope of the search queries used in each pipeline. Compounds entirely outside our query terms, for example a recently introduced biologic with no AEMS reports yet or a long-tail traditional medicine without PubMed coverage, will not appear regardless of their actual relevance. Coverage gaps are systematically larger for the rarer of the six conditions (vulvodynia, adenomyosis) than for the better-studied ones (endometriosis, PCOS).",
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
        body: "The signal database reflects a point-in-time snapshot based on when pipelines were last run. New literature and adverse event reports are not captured automatically. Last pipeline run: June 2026.",
      },
      {
        label: "Conflict of interest and funding",
        body: "Whel takes no funding from the pharmaceutical industry and no compensation for any specific drug-condition pair it surfaces, so no commercial interest can shape what the database reports. A formal funding statement will accompany any peer-reviewed publication.",
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
    <main className="flex-1 doc-shell" style={{ backgroundColor: "var(--bg)" }}>

      {/* ── Floating table of contents (large screens only) ──────────────── */}
      <aside className="doc-toc" aria-label="On this page">
        <div className="doc-toc-eyebrow">On this page</div>
        <a href="#architecture"><span className="doc-n">01</span><span className="doc-t">Where each layer stands</span></a>
        <a href="#pipeline-register"><span className="doc-n">02</span><span className="doc-t">Pipeline register</span></a>
        <a href="#how-evidence-is-scored"><span className="doc-n">03</span><span className="doc-t">Scoring framework</span></a>
        <a href="#confidence-tiers"><span className="doc-n">04</span><span className="doc-t">Tier mapping</span></a>
        <a href="#category-standards"><span className="doc-n">05</span><span className="doc-t">Category standards</span></a>
        <a href="#reliability-rules"><span className="doc-n">06</span><span className="doc-t">Reliability rules</span></a>
        <a href="#guiding-principle"><span className="doc-n">07</span><span className="doc-t">Guiding principle</span></a>
        <a href="#infrastructure"><span className="doc-n">08</span><span className="doc-t">Infrastructure</span></a>
        <a href="#limitations"><span className="doc-n">09</span><span className="doc-t">Limitations</span></a>
      </aside>

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
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "64ch" }}>
            This page documents the technical machinery behind every signal
            in the Whel database. It covers the five active data pipelines
            and the sources each one queries, the five-dimension rubric Whel
            applies to every signal, the four confidence tiers scores map
            into, the category-specific admission standards each evidence arm
            enforces, and the documented limitations of the methodology as
            currently shipped.
          </p>
        </div>
      </div>

      {/* ── The three-layer architecture (honest status) ─────────────────── */}
      <section id="architecture" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Architecture · Where each layer stands"
            title="The three-layer substrate, and what is built today"
            intro="Whel's public architecture describes three layers: a corrected, sex-aware substrate, a retrieval-and-validation layer, and a hypothesis-from-signal layer. That is the target architecture, and it is partially built. The six-condition database documented on the rest of this page runs on the scored-signals engine the layers are progressively replacing, so this section gives an honest status of each layer."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LAYERS.map((l) => (
              <div
                key={l.n}
                style={{
                  ...CARD,
                  borderTop: `3px solid ${l.color}`,
                  padding: "22px 22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ ...MONO, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)" }}>
                  {l.n}
                </div>
                <p className="font-heading" style={{ fontSize: "17px", color: "var(--ink)", margin: 0 }}>
                  {l.name}
                </p>
                <span
                  style={{
                    ...MONO,
                    alignSelf: "flex-start",
                    fontSize: "9.5px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: l.color,
                    border: `1px solid ${l.color}`,
                    padding: "3px 7px",
                  }}
                >
                  {l.status}
                </span>
                <p style={{ fontSize: "13.5px", lineHeight: 1.6, color: "var(--ink-2)", margin: 0 }}>
                  {l.body}
                </p>
              </div>
            ))}
          </div>

          <p style={{ ...MONO, fontSize: "11.5px", lineHeight: 1.6, color: "var(--muted)", marginTop: 18 }}>
            The candidate index and condition pages live today are produced by the scored-signals
            engine described below: the five data pipelines, the five-dimension rubric, and the four
            confidence tiers. The substrate graph now runs over the Open Targets conditions and
            surfaces beside each signal; the validation layer and the full sex-aware extension are
            still being built on top, condition by condition.
          </p>
        </div>
      </section>

      {/* ── Figure 1 — Pipeline register ─────────────────────────────────── */}
      <section id="pipeline-register" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
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
      <section id="how-evidence-is-scored" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Figure 2 · Scoring framework"
            title="How evidence is scored"
            intro={SCORING_INTRO}
          />

          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "74ch", marginBottom: 24 }}>
            The composite score is produced by the five-dimension rubric applied to the extracted
            evidence. The literature grade (L0 to L3) and the MATRIX cross-reference are independent
            external benchmarks: they are computed separately and reported beside the score, not used as
            inputs to it. Keeping them out of the scoring pipeline means an outside benchmark cannot raise
            or lower the rubric score, and agreement between an independent benchmark and the score
            remains informative rather than circular.
          </p>

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
              All signal analysis and scoring is performed using Claude Opus 4.6
              (claude-opus-4-6). At the time Whel&apos;s evidence engine was
              built, Opus 4.6 was Anthropic&apos;s most capable model and the
              top-ranked model on{" "}
              <a
                href="https://arxiv.org/abs/2604.00024"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--ink)",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                WHBench
              </a>
              , an independent expert-validated benchmark for women&apos;s
              health reasoning. Opus 4.6 was selected for its performance on
              complex multicriteria reasoning, where signals must be
              simultaneously assessed across source quality, replication,
              biological plausibility, and confounding risk in a single
              analytical pass. Smaller and faster models were evaluated and
              produced flatter, less discriminating scores, particularly on
              biological plausibility and confounding risk assessment.
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

          {/* Pre-registered validation callout */}
          <div
            style={{
              marginTop: 28,
              padding: "16px 18px",
              border: "1px solid var(--rule)",
              backgroundColor: "var(--paper)",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 18px",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div style={{ maxWidth: "56ch" }}>
              <div
                style={{
                  ...MONO,
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                Pre-registered validation
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
                The benchmark that tests whether this rubric separates high-
                confidence signals from lower ones is pre-registered: sample,
                external comparators, and reporting rules are all fixed before
                the run.
              </p>
            </div>
            <Link
              href="/about/methodology"
              style={{
                ...MONO,
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink)",
                borderBottom: "1px solid var(--ink)",
                paddingBottom: 2,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Read the methodology &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Figure 3 — Confidence tiers ──────────────────────────────────── */}
      <section
        id="confidence-tiers"
        style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 80 }}
      >
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
      <section id="category-standards" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <FigureHeader
            label="Figure 4 · Category standards"
            title="Category-specific minimum standards"
            intro="Each of the four research arms carries its own inclusion bar, because a published trial, an adverse-event pattern, a mechanistic link, and a community report each demand a different kind of corroboration before they count. The full per-arm criteria, with their sources and worked examples, are documented on the signal types page."
          />

          <Link
            href="/signal-types"
            style={{
              ...MONO,
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--green-mid)",
              borderBottom: "1px solid var(--green-mid)",
              paddingBottom: 2,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            The four research arms in depth →
          </Link>
        </div>
      </section>

      {/* ── Figure 5 — Cross-cutting reliability rules ───────────────────── */}
      <section id="reliability-rules" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
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
      <section id="guiding-principle" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
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
      <section id="infrastructure" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
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
      <section id="limitations" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
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

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--ink-2)",
              marginTop: 28,
              maxWidth: "68ch",
            }}
          >
            Planned work against these limitations, including external
            cross-reference to Every Cure&apos;s MATRIX scores, a cross-arm
            concordance flag, a compound-level synthesis score, and a
            dedicated audit log, is tracked on the{" "}
            <Link
              href="/about/roadmap"
              style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}
            >
              Roadmap
            </Link>
            .
          </p>

          <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem", marginTop: "2.5rem" }}>
            <BackLink href="/about" label="Back to About" />
          </div>
        </div>
      </section>

    </main>
  );
}
