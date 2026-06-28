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
    body: "The corrected, sex-aware knowledge base. Its grounding is live: every condition resolves to a MONDO or EFO disease identifier and every drug to canonical ChEMBL and RxNorm identifiers, so entities are matched by identity rather than by name string. The graph itself, the drug-to-target-to-disease edges drawn from Open Targets, is now built over the conditions Open Targets covers and surfaces a graph-supports or graph-silent cross-check beside each signal in the gated view. Where Open Targets has no entry, the graph stays silent, which is shown rather than hidden. The sex-aware extension splits in two: sex-specific pharmacokinetics is now seeded for an initial set of compounds, each sourced to an FDA drug label or the curated sex-PK literature (Zucker & Prendergast 2020; Soldin & Mattison 2009) and shown beside the signal, while cyclical hormonal phase is now seeded for the strongest-evidence PMDD cases (luteal-phase SSRI dosing; drospirenone cycle suppression) and shown beside the relevant signals, with broader population ongoing.",
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
  "Whel runs six active data pipelines that populate the substrate on demand. A seventh (EudraVigilance) is implemented but not yet contributing signals to the current snapshot. The regulatory & development-status sources (the FDA-approved label via DailyMed and the FDA Orange Book) sit outside this register: they are read offline into reviewed, committed snapshots and reported beside the score, not ingested as on-demand pipelines.";

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
    name: "FDA Adverse Event Reporting System (AEMS) [Formerly FAERS]",
    short: "FDA AEMS",
    tag: "Pathway Insights",
    api: "OpenFDA",
    status: "Active",
    body: "Queries the FDA adverse-event public API (OpenFDA, the system formerly known as FAERS) for condition-aware reaction counts. Each record is given a dual read: first a safety caveat, then, only where the pharmacology supports it, a hedged mechanistic lead within the Pathway arm, never presented as efficacy. Records carry a mandatory caveat that spontaneous reports cannot establish causation or incidence.",
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
    name: "SIDER",
    short: "SIDER",
    tag: "Pathway Insights",
    api: "Bulk TSV",
    status: "Active",
    body: "Loads the SIDER side-effect resource (sideeffects.embl.de), which pairs marketed drugs with label-documented side effects and their reported frequencies. Like AEMS, each record is rendered into a fixed verbatim sentence and read as a safety caveat first, a hedged mechanistic lead second. Carries a vintage caveat (2015 label snapshot).",
  },
  {
    name: "Reddit",
    short: "Reddit",
    tag: "Community Forum Reports",
    api: "OAuth JSON",
    status: "Active",
    body: "Queries condition specific subreddits (r/Endo, r/PCOS, r/PMDD, r/Menopause, r/adenomyosis, r/vulvodynia) for posts and comments. Individual permalinks, thread IDs, authors, and timestamps are stored so independence can be judged deterministically. The pipeline looks for consistent patterns across many independent accounts, not individual anecdotes, and never scores them on clinical-trial criteria.",
  },
  {
    name: "EudraVigilance EVDAS (in development, not yet contributing signals)",
    short: "EudraVigilance EVDAS",
    tag: "Pathway Insights",
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
  "Every signal is scored from 0 to 2 on five dimensions, summing to a 0-10 arm strength. The five dimension scores and structured facts are proposed by Claude Opus 4.8 from the full source content; the deterministic parts (the female-applicability multiplier, the imprecision caps, and the confidence tier) are then computed in code, never by the model. The full per-arm criteria are documented on the signal types and scoring page.";

// The five generalized dimensions. Each is scored 0-2, but its MEANING is tuned to
// the evidence arm (the full per-arm 0/1/2 criteria live on /signal-types). The
// descriptions below are the cross-arm gist.
const RUBRIC: { dim: string; note: string; s0: string; s1: string; s2: string }[] = [
  {
    dim: "Corroboration",
    note: "Independent corroboration, kept distinct from rigor and consistency so the same fact is never scored twice.",
    s0: "A single source (a lone review or primary study).",
    s1: "A single synthesis, or two independent sources.",
    s2: "Three or more genuinely independent, consistent sources (or one large, low-bias pivotal trial).",
  },
  {
    dim: "Rigor",
    note: "Study design / risk of bias for Direct; model strength for Pathway; report specificity for Community.",
    s0: "Case report, preclinical, in-vitro, or vague report.",
    s1: "Observational, small trial, or partial detail.",
    s2: "RCT, meta-analysis, active guideline, or human-relevant model.",
  },
  {
    dim: "Specificity",
    note: "Whether the evidence speaks to this exact drug and this exact condition or outcome.",
    s0: "Proxy only; drug or outcome vague.",
    s1: "One side named, the other adjacent.",
    s2: "Both named directly and linked.",
  },
  {
    dim: "Plausibility",
    note: "Whether a credible biological mechanism connects the drug to the condition.",
    s0: "Mechanism asserted or unexplained.",
    s1: "Plausible mechanism.",
    s2: "Evidenced in relevant biology / directly fits known pharmacology.",
  },
  {
    dim: "Consistency",
    note: "Whether the sources agree in direction; contradictions cap this and are shown, not averaged.",
    s0: "Conflicting findings.",
    s1: "Mostly one direction.",
    s2: "Unanimous (a single study is scored neutral, not penalized).",
  },
];

const TIERS_INTRO =
  "Each arm's five dimensions sum to a strength of 0-10, which is then multiplied by a female-applicability factor. The resulting arm score maps to four confidence tiers (cutoffs frozen against the real score distribution):";

const TIERS: { name: string; range: string; color: string; soft: string; desc: string }[] = [
  {
    name: "Strong",
    range: "≥ 8.0",
    color: "var(--tier-strong)",
    soft: "var(--tier-strong-soft)",
    desc: "Guideline-grade: independently replicated, low-bias evidence generated in women.",
  },
  {
    name: "Moderate",
    range: "6.0 to 7.9",
    color: "var(--tier-moderate)",
    soft: "var(--tier-moderate-soft)",
    desc: "Good evidence with solid rationale, not yet definitive.",
  },
  {
    name: "Emerging",
    range: "3.5 to 5.9",
    color: "var(--tier-emerging)",
    soft: "var(--tier-emerging-soft)",
    desc: "A real early lead worth watching: some corroboration or mechanistic support.",
  },
  {
    name: "Exploratory",
    range: "< 3.5",
    color: "var(--tier-exploratory)",
    soft: "var(--tier-exploratory-soft)",
    desc: "Thin or single-source signals, surfaced with heavy caveat for hypothesis generation.",
  },
];

const RELIABILITY_INTRO =
  "For every signal across all three evidence arms, Whel applies five cross-cutting reliability checks:";

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
    label: "Corroboration",
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
    body: "Supabase (PostgreSQL). The substrate's core tables are entities (ontology-grounded drugs and conditions), documents and source_spans (the immutable source text), claims (each atomic claim pinned to a verbatim quote with verified character offsets), contradictions, and substrate_signals. Each substrate_signals row is one evidence arm's reading of an (intervention, condition, aspect): the five dimension scores and rationales, the female-applicability band and multiplier, the generated arm strength and arm score, the confidence tier, and back-references to the claims behind it. Rows are unique per (intervention, condition, aspect, arm).",
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
        body: "The five dimension scores are generated by Claude Opus 4.8 against a published per-arm rubric (the female multiplier, imprecision caps, and tier are deterministic and computed in code). While the rubric and JSON-schema validation reduce variability, three concrete classes of LLM-introduced error remain: (1) mechanistic misinterpretation, where the model may overstate the specificity of a target-pathway match, particularly for under-characterized pathways; (2) prompt sensitivity, where small changes to the system prompt have produced measurable shifts in tier assignment in our internal testing; (3) hallucinated citations, where occasional fabricated references have been observed despite the rubric requiring the model to score against the source content provided, and are mitigated by validating each cited source URL or PMID before database insertion. A planned validation pass will quantify per-tier concordance against expert human raters; until then, all signals should be treated as starting points for further verification, not assessments.",
      },
      {
        label: "LLM versioning and prompt drift",
        body: "Both the model and the system prompts evolve over the lifecycle of the project. Each pipeline run is logged with the model version (claude-opus-4-8 at current snapshot) and a hash of the active prompt; snapshots taken months apart should not be compared signal-for-signal without re-running classification with a pinned model and prompt. The repository preserves prompt history for reproducibility.",
      },
      {
        label: "External review and remediation",
        body: "An independent external reviewer audit completed May 29 2026 surfaced two material findings. The first was a corroboration-score drift in the LLM rater: the rubric defines corroboration = 0 for one source, 1 for two independent sources, and 2 for three or more, but the rater had been counting more loosely. The rater prompts were tightened to enforce literal source counting; signals were downgraded to the tier the evidence actually supports; and manually-verified PubMed citations were added so each remaining Moderate-tier signal carries the source count the strict rubric requires. The second was a set of 21 ClinicalTrials.gov citations filed under conditions the trials were not run on: 10 signals were deactivated, 5 were reassigned from clinical-trial-finding to cross-condition framing, 1 source was dropped where the signal retained independent support, 2 sources were replaced with proper condition-specific citations, and 1 row was documented as a ClinicalTrials.gov API field limitation. The full audit trail is recorded in database migrations 036 through 040 and in the methodology version log.",
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
        body: "Cross-condition inference (now a derived-hypotheses lens layered on top of the three evidence arms, not a scored arm itself) identifies drugs developed for other indications where a shared mechanism suggests benefit for one of the six target conditions. Such inferences can reflect three different underlying realities: (a) a real pharmacological effect on a shared mechanism (the desired interpretation), (b) confounding by comorbidity, where the same patient population happens to carry both the original indication and the target condition with no causal pharmacological link, or (c) reporting artifact, where patients with a target condition may be more likely to report any adverse event as condition-related. Triangulation across literature, AEMS, and pathway data is required before elevation above Emerging, but no triangulation eliminates this ambiguity entirely.",
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
            in the Whel substrate. It covers the six active data pipelines
            and the sources each one queries, the five-dimension rubric Whel
            applies to every signal, the female-applicability multiplier and the
            four confidence tiers scores map into, the arm-specific admission
            standards each of the three evidence arms enforces, the descriptive
            regulatory &amp; development-status layer reported beside each score, and
            the documented limitations of the methodology as currently shipped.
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
            The candidate index and condition pages live today are produced by the substrate
            engine described below: the six data pipelines, the per-arm five-dimension rubric, the
            female-applicability multiplier, and the four confidence tiers. Every signal traces to
            verbatim-verified claims; the full sex-aware extension is still being built out across
            every condition.
          </p>

          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "74ch", marginTop: 18 }}>
            Around that scored substrate sit several <strong>descriptive layers</strong>, reported beside each
            signal but never folded into the score: the independent MATRIX cross-reference, the sex-specific
            pharmacokinetics and cyclical-phase reads, and a <strong>regulatory &amp; development-status</strong>{" "}
            layer. The regulatory layer grounds each candidate in the external US record, reading three
            authoritative public sources, the FDA-approved drug label via DailyMed, the FDA Orange Book, and
            ClinicalTrials.gov, into reviewed, committed snapshots so the panel is reproducible and can be
            checked against the upstream source. Each is read conservatively (label categories limited to
            NDA / ANDA / BLA; Orange Book to single-ingredient products; trials to interventional studies of the
            drug as a therapy), so it maps the landscape a 505(b)(2) route would build on without ever becoming
            a scoring input or regulatory advice. The full read is detailed in the{" "}
            <a href="#how-evidence-is-scored" style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: 2 }}>scoring framework</a>{" "}
            below, and every source is listed on the{" "}
            <Link href="/about/external-references#underlying-data" style={{ color: "var(--green-mid)", textDecoration: "underline", textUnderlineOffset: 2 }}>external references</Link>{" "}
            page.
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
            The arm score is produced by the five-dimension rubric applied to the extracted
            evidence, then discounted by the female-applicability multiplier. The MATRIX cross-reference
            is an independent external benchmark: it is computed separately and reported beside the score;
            the rubric never reads it as an input. Keeping it out of the scoring pipeline means an outside
            benchmark cannot raise or lower the rubric score, and any agreement between an independent
            benchmark and the score carries real information.
          </p>

          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "74ch", marginBottom: 24 }}>
            A <strong>regulatory &amp; development-status</strong> layer is reported beside the score on the
            same terms: it is descriptive landscape context, never a scoring input. Built offline from three
            public US sources into reviewed, committed snapshots, it records, per candidate, whether the
            target condition is an FDA-approved (on-label) use or off-label (read from the FDA-approved drug
            label via DailyMed, counting only NDA, ANDA, and BLA marketing categories so supplements and
            homeopathics are excluded); whether the molecule is a generic or a single-source brand still under
            patent (read from the FDA Orange Book using single-ingredient products only, so patents on novel
            branded combination formulations are never attributed to the base molecule); and how far the drug
            has been studied as a therapy for the condition (read from ClinicalTrials.gov, excluding
            mechanistic, drug-interaction, and Phase-4 post-marketing studies). It sketches the landscape a
            505(b)(2) filing would build on but is explicitly not a viability assessment or regulatory advice;
            it is live across all six conditions.
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
              Model Selection: Claude Opus 4.8
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.62, color: "var(--ink-2)" }}>
              The dimension scoring is performed using Claude Opus 4.8
              (claude-opus-4-8), released in May 2026; the deterministic steps
              (the female-applicability multiplier, imprecision caps, and tier
              assignment) are computed in code, not by the model. Opus 4.8 was
              selected for its performance on complex multicriteria reasoning,
              where each arm&apos;s five dimensions must be assessed against the
              source content in a single analytical pass. In our internal
              testing, smaller and faster models produced flatter, less
              discriminating scores on plausibility and consistency.
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.62, color: "var(--ink-2)", marginTop: 12 }}>
              On clinical text specifically,{" "}
              <a
                href="https://www.anthropic.com/news/claude-opus-4-8"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                Anthropic reports
              </a>{" "}
              that Opus 4.8 scores 55.8% on{" "}
              <a
                href="https://arxiv.org/abs/2604.27470"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                HealthBench Professional
              </a>
              , an external, physician-authored benchmark of real clinical
              tasks, up from 51.9% for the previous Opus release. No frontier
              model is close to the ceiling on these tasks. Opus 4.8 has not been
              evaluated on any women&apos;s-health-specific benchmark; the most
              recent such evaluation,{" "}
              <a
                href="https://arxiv.org/abs/2604.00024"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                WHBench
              </a>{" "}
              (March 2026), tested the earlier Opus 4.6 and found it the
              strongest of the models studied at 72.1%, while still flagging
              meaningful safety and completeness gaps. We read these results as
              evidence the model handles clinical text well. They are not a
              guarantee that any individual score is correct, which is why every
              score is shown beside its verbatim source and the model&apos;s
              written rationale.
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
            intro="Each of the three evidence arms carries its own scoring bar, because a published trial, a mechanistic link, and a community report each demand a different kind of corroboration before they count. The full per-arm criteria, with their sources and worked examples, are documented on the signal types and scoring page."
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
            The three evidence arms in depth →
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
