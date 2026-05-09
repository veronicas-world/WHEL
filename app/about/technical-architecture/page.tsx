"use client";

import Link from "next/link";
import { useState } from "react";
import BackLink from "../../components/BackLink";

const SECTIONS = [
  {
    key: "pipelines",
    title: "Data Pipelines",
    summary: "Five active automated pipelines across PubMed, ClinicalTrials.gov, FDA AEMS, Open Targets Platform, and Reddit. EudraVigilance integration is in development.",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
          WHEL runs five active data pipelines that populate the database on demand. A sixth pipeline (EudraVigilance) is implemented but not yet contributing signals to the current snapshot.
        </p>
        {[
          {
            name: "PubMed",
            tag: "Direct Research",
            body: "Queries the NCBI Entrez API for published studies directly investigating each condition. Searches are condition specific and filtered for relevance. Results are parsed for study type, date, and abstract, then passed to Claude Opus for signal extraction and evidence strength classification.",
          },
          {
            name: "ClinicalTrials.gov",
            tag: "Direct Research",
            body: "Queries the ClinicalTrials.gov REST API v2 for active, completed, and recruiting trials targeting each condition. Trial phase, status, and intervention type are captured and stored alongside the primary signal.",
          },
          {
            name: "FDA AEMS (Adverse Event Monitoring System), formerly FAERS, renamed March 11, 2026",
            tag: "Cross-Condition Signals",
            body: "Queries the FDA AEMS public API (OpenFDA) using a two-pass approach: first targeting gynecological and hormonal terms, then broadening to general reaction terms. Female patient reports are filtered and analyzed for signals suggesting off label benefit. URL encoding and pagination are handled to maximize coverage across all six conditions.",
          },
          {
            name: "Open Targets Platform",
            tag: "Pathway Insights",
            body: "Queries the Open Targets Platform GraphQL API (platform.opentargets.org) for each condition using standardized EFO and MONDO disease ontology identifiers. Retrieves drug candidates, mechanistic associations, and biological target scores aggregated from genetic association data, known drug target interactions, Reactome pathway analysis, and differential gene expression. Results are analyzed by Claude Opus for pathway level repurposing hypotheses. No authentication required.",
          },
          {
            name: "EudraVigilance EVDAS (in development — not yet contributing signals)",
            tag: "Cross-Condition Signals",
            body: "Queries the European Medicines Agency adverse event database (dap.ema.europa.eu) via the Oracle BI Analytics API. Substance codes are resolved via the public adrreports.eu substance table. Female patient reaction data is filtered and grouped by condition. Requires a free registered EMA account for session authentication. This pipeline is implemented but has not yet been ingested into the current database snapshot.",
          },
          {
            name: "Reddit",
            tag: "Community Forum Reports",
            body: "Queries condition specific subreddits (r/Endo, r/PCOS, r/PMDD, r/Menopause, r/adenomyosis, r/vulvodynia) using eight treatment focused search queries per subreddit. Individual post permalinks are stored and validated — URLs must contain /comments/ to confirm they are post level, not subreddit level. Posts are grouped by subreddit in citation display. The pipeline looks for consistent patterns across many posts, not individual anecdotes.",
          },
        ].map(({ name, tag, body }) => (
          <div key={name} className="bg-white p-5" style={{ border: "1px solid #E0DDD8" }}>
            <div className="flex items-baseline gap-3 mb-2">
              <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{name}</p>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
                style={{ backgroundColor: "#EEF1EE", color: "#5C6B5D" }}
              >
                {tag}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>{body}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "inclusion",
    title: "Inclusion Criteria and Evidence Scoring",
    summary: "A five-dimension scoring framework and category-specific minimum standards applied to every signal before database entry.",
    content: (
      <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#111" }}>
        <p>
          WHEL applies a structured, multidimensional inclusion framework to every signal before it enters the database. The goal is not a single universal cutoff, but a tiered evidence framework with minimum standards for reliability, reproducibility, and actionability. The framework was developed in consultation with published research on evidence synthesis and pharmacovigilance methodology, drawing on established practices in systematic review design and drug repurposing research.
        </p>

        <div className="bg-white p-5" style={{ border: "1px solid #E0DDD8" }}>
          <p className="font-semibold mb-2" style={{ color: "#1a1a1a" }}>Model Selection: Claude Opus 4.6</p>
          <p>
            All signal analysis and scoring is performed using Claude Opus 4.6 (claude-opus-4-6), Anthropic's most capable model. Opus 4.6 was selected specifically for its performance on complex multicriteria reasoning tasks. Independent benchmarks consistently place Opus at the top of evaluations requiring simultaneous assessment across multiple analytical dimensions — precisely what evidence scoring requires. Smaller or faster models were evaluated and found to produce flatter, less discriminating scores, particularly on biological plausibility and confounding risk assessment. For a tool where the quality of the evidence evaluation is the core product, model selection is not a minor implementation detail.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-3" style={{ color: "#1a1a1a" }}>The Five-Dimension Scoring Framework</p>
          <p className="mb-4">
            Every signal is independently scored from 0 to 2 on five dimensions, for a maximum total score of 10. Scores are assigned by Claude Opus 4.6 based on the full source content, not just metadata.
          </p>
          <div className="space-y-3">
            {[
              {
                label: "Replication (0 to 2)",
                rows: [
                  "0 = single source only",
                  "1 = two independent sources",
                  "2 = three or more independent sources pointing in the same direction",
                ],
                note: "Whether the finding has been independently observed across separate sources.",
              },
              {
                label: "Source Quality (0 to 2)",
                rows: [
                  "0 = forum or anecdotal data only",
                  "1 = observational, registry, or pharmacovigilance data",
                  "2 = peer reviewed human study or clinical trial",
                ],
                note: "The evidentiary weight of the underlying data.",
              },
              {
                label: "Specificity (0 to 2)",
                rows: [
                  "0 = vague outcome (\"improved,\" \"felt better\")",
                  "1 = symptom specific outcome (pelvic pain, cycle regularity, mood lability)",
                  "2 = clearly defined condition specific clinical endpoint",
                ],
                note: "Whether the outcome is clearly defined and clinically relevant to the condition.",
              },
              {
                label: "Biological Plausibility (0 to 2)",
                rows: [
                  "0 = unclear or absent mechanism",
                  "1 = broad but plausible mechanism",
                  "2 = well characterized drug target pathway disease fit (e.g., COX-2 inhibition and prostaglandin dysregulation in endometriosis)",
                ],
                note: "The strength and specificity of the mechanistic rationale.",
              },
              {
                label: "Consistency of Direction (0 to 2)",
                rows: [
                  "0 = mixed or conflicting findings",
                  "1 = mostly consistent direction",
                  "2 = clearly consistent direction across all sources",
                ],
                note: "Whether the effect direction is consistent across sources.",
              },
            ].map(({ label, rows, note }) => (
              <div key={label} className="bg-white p-5" style={{ border: "1px solid #E0DDD8" }}>
                <p className="font-semibold mb-1" style={{ color: "#1a1a1a" }}>{label}</p>
                <p className="text-[11px] mb-2" style={{ color: "#777" }}>{note}</p>
                <ul className="space-y-0.5">
                  {rows.map((r) => (
                    <li key={r} style={{ color: "#333" }}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold mb-3" style={{ color: "#1a1a1a" }}>Confidence Tiers</p>
          <p className="mb-3">Total scores map to four confidence tiers displayed on every signal card:</p>
          <div className="space-y-2">
            {[
              { tier: "Exploratory", range: "0 to 3", desc: "Single source, mechanistic, or low specificity signals included for hypothesis generation only." },
              { tier: "Emerging",    range: "4 to 6", desc: "Early stage evidence with some corroboration or mechanistic support." },
              { tier: "Moderate",    range: "7 to 8", desc: "Replicated findings with solid mechanistic rationale." },
              { tier: "Strong",      range: "9 to 10", desc: "Highly replicated, well characterized signals with consistent direction across multiple evidence types." },
            ].map(({ tier, range, desc }) => (
              <div key={tier} className="flex gap-4 bg-white p-4 items-start" style={{ border: "1px solid #E0DDD8" }}>
                <div className="shrink-0 text-[10px] font-bold px-2 py-1 tracking-wider uppercase" style={{ backgroundColor: "#EEF1EE", color: "#5C6B5D", border: "1px solid #7A8B7A", whiteSpace: "nowrap" }}>{tier}</div>
                <div>
                  <span className="font-semibold text-[11px]" style={{ color: "#777" }}>{range} — </span>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold mb-3" style={{ color: "#1a1a1a" }}>Category-Specific Minimum Standards</p>
          <div className="space-y-3">
            {[
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
            ].map(({ label, body }) => (
              <div key={label} className="bg-white p-5" style={{ border: "1px solid #E0DDD8" }}>
                <p className="font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>{label}</p>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold mb-3" style={{ color: "#1a1a1a" }}>Cross-Cutting Reliability Rules</p>
          <p className="mb-3">For every signal across all four categories, WHEL applies five cross-cutting reliability checks:</p>
          <div className="space-y-3">
            {[
              { label: "Outcome specificity", body: "\"Improved\" is insufficient. Qualifying outcomes include pelvic pain, heavy bleeding, cycle regularity, mood lability in luteal phase, vulvar burning, and similar condition specific clinical endpoints." },
              { label: "Effect directionality", body: "Every signal must be classified as one of: improves, worsens, mixed, or unclear." },
              { label: "Replication", body: "One source is interesting. Two or more independent sources start to constitute a signal." },
              { label: "Confounding assessment", body: "Known confounders are flagged — drugs with multiple indications where symptom improvement may be indirect, forum populations reporting multiple concurrent therapies, and adverse event data that may reflect reporting bias rather than true incidence." },
              { label: "Denominator awareness", body: "FDA AEMS and community data do not provide true incidence rates. They are signal generating sources, not causal datasets. All signals from these sources are labeled accordingly and require corroboration before elevation above Emerging." },
            ].map(({ label, body }) => (
              <div key={label} className="bg-white p-5" style={{ border: "1px solid #E0DDD8" }}>
                <p className="font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>{label}</p>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5" style={{ border: "1px solid #E0DDD8" }}>
          <p className="font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>One Guiding Principle</p>
          <p>
            Frequency is not truth. A rare but repeatedly observed, highly specific signal from a single credible source may carry more evidential weight than 500 vague forum mentions. WHEL's scoring framework is designed to privilege specificity, reproducibility, and triangulation over raw volume.
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "database",
    title: "Database and Infrastructure",
    summary: "PostgreSQL on Supabase with Row Level Security; Next.js on Vercel.",
    content: (
      <div className="space-y-4">
        {[
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
        ].map(({ label, body }) => (
          <div key={label} className="bg-white p-5" style={{ border: "1px solid #E0DDD8" }}>
            <p className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>{label}</p>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>{body}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "limitations",
    title: "Limitations",
    summary: "WHEL is a signal aggregator, not a clinical recommendation engine.",
    content: (
      <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#111" }}>
        <p>
          WHEL is a signal aggregator, not a clinical recommendation engine. Evidence strength classifications are generated by a language model and should be treated as a starting point for further investigation, not a definitive assessment. Community Forum Reports reflect patient reported patterns and are explicitly not clinical evidence. The absence of signals in the Direct Research arm for a given condition is itself data — it reflects the current state of published research, not a gap in the tool.
        </p>
        <div className="space-y-3">
          {[
            {
              label: "Publication bias",
              body: "PubMed indexes positive results disproportionately. Signals sourced from published literature may be upwardly biased toward favorable findings.",
            },
            {
              label: "AEMS confounding",
              body: "Spontaneous adverse event reports are subject to indication bias, channeling bias, and notoriety effects. FDA AEMS signals are hypothesis-generating only and should not be interpreted as causal.",
            },
            {
              label: "LLM classification risk",
              body: "Evidence strength classifications are generated by Claude and may contain mechanistic errors or misinterpretations. All signals should be independently verified by a qualified researcher.",
            },
            {
              label: "Sex-disaggregated data gap",
              body: "Many PubMed and ClinicalTrials.gov studies do not report sex-disaggregated results. Some signals labeled as relevant to women are inferred from mixed-sex study populations.",
            },
            {
              label: "Data freshness",
              body: "The signal database reflects a point-in-time snapshot based on when pipelines were last run. New literature and adverse event reports are not captured automatically. Last pipeline run: May 2026.",
            },
            {
              label: "Reddit data quality",
              body: "Cannot fully screen for bots, duplicate accounts, or coordinated discussion. Permalink validation and cross-subreddit confirmation partially mitigate this but do not eliminate it.",
            },
          ].map(({ label, body }) => (
            <div key={label} className="bg-white p-5" style={{ border: "1px solid #E0DDD8" }}>
              <p className="font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>{label}</p>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function TechnicalArchitecturePage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="text-xs mb-4" style={{ color: "#111" }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/about" className="hover:underline">About</Link>
            <span className="mx-2">›</span>
            <span style={{ color: "#4D5E4D" }}>Technical Architecture</span>
          </nav>
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "#1a1a1a" }}
          >
            Technical Architecture
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="space-y-3">
          {SECTIONS.map((section) => {
            const isOpen = openKey === section.key;
            return (
              <div
                key={section.key}
                style={{
                  border: "1px solid #E0DDD8",
                  borderLeft: isOpen ? "3px solid #4D5E4D" : "1px solid #E0DDD8",
                  backgroundColor: "#fff",
                  transition: "border-left 0.15s ease",
                }}
              >
                <button
                  onClick={() => toggle(section.key)}
                  className="w-full text-left flex items-start justify-between gap-6 p-6 sm:p-8"
                  aria-expanded={isOpen}
                >
                  <div className="flex-1 min-w-0">
                    <h2
                      className="font-heading text-xl font-bold mb-1.5"
                      style={{ color: isOpen ? "#4D5E4D" : "#1a1a1a" }}
                    >
                      {section.title}
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
                      {section.summary}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-lg font-light mt-0.5"
                    style={{ color: "#4D5E4D", lineHeight: 1 }}
                    aria-hidden="true"
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div
                    className="px-6 sm:px-8 pb-8"
                    style={{ borderTop: "1px solid #E0DDD8" }}
                  >
                    <div className="pt-6">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid #E0DDD8", paddingTop: "2rem", marginTop: "2rem" }}>
          <BackLink href="/about" label="Back to About" />
        </div>
      </div>
    </main>
  );
}
