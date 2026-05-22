"use client";

import Link from "next/link";
import { useState } from "react";
import BackLink from "../../components/BackLink";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};

const SECTIONS = [
  {
    key: "pipelines",
    title: "Data Pipelines",
    summary: "Five active automated pipelines across PubMed, ClinicalTrials.gov, FDA FAERS, Open Targets Platform, and Reddit. EudraVigilance integration is in development.",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
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
            name: "FDA FAERS (FDA Adverse Event Reporting System)",
            tag: "Cross-Condition Signals",
            body: "Queries the FDA FAERS public API (OpenFDA) using a two-pass approach: first targeting gynecological and hormonal terms, then broadening to general reaction terms. Female patient reports are filtered and analyzed for signals suggesting off label benefit. URL encoding and pagination are handled to maximize coverage across all six conditions.",
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
          <div key={name} className="p-5" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--rule)" }}>
            <div className="flex items-baseline gap-3 mb-2">
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{name}</p>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
                style={{ backgroundColor: "var(--bg-3)", color: "var(--green-mid)" }}
              >
                {tag}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>{body}</p>
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
      <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        <p>
          WHEL applies a structured, multidimensional inclusion framework to every signal before it enters the database. The goal is not a single universal cutoff, but a tiered evidence framework with minimum standards for reliability, reproducibility, and actionability. The framework was developed in consultation with published research on evidence synthesis and pharmacovigilance methodology, drawing on established practices in systematic review design and drug repurposing research.
        </p>

        <div className="p-5" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--rule)" }}>
          <p className="font-semibold mb-2" style={{ color: "var(--ink)" }}>Model Selection: Claude Opus 4.6</p>
          <p>
            All signal analysis and scoring is performed using Claude Opus 4.6 (claude-opus-4-6), Anthropic's most capable model. Opus 4.6 was selected specifically for its performance on complex multicriteria reasoning tasks. Independent benchmarks consistently place Opus at the top of evaluations requiring simultaneous assessment across multiple analytical dimensions — precisely what evidence scoring requires. Smaller or faster models were evaluated and found to produce flatter, less discriminating scores, particularly on biological plausibility and confounding risk assessment. For a tool where the quality of the evidence evaluation is the core product, model selection is not a minor implementation detail.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-3" style={{ color: "var(--ink)" }}>The Five-Dimension Scoring Framework</p>
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
              <div key={label} className="p-5" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--rule)" }}>
                <p className="font-semibold mb-1" style={{ color: "var(--ink)" }}>{label}</p>
                <p className="text-[11px] mb-2" style={{ color: "var(--muted)" }}>{note}</p>
                <ul className="space-y-0.5">
                  {rows.map((r) => (
                    <li key={r} style={{ color: "var(--ink-2)" }}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold mb-3" style={{ color: "var(--ink)" }}>Confidence Tiers</p>
          <p className="mb-3">Total scores map to four confidence tiers displayed on every signal card:</p>
          <div className="space-y-2">
            {[
              { tier: "Exploratory", range: "0 to 3", desc: "Single source, mechanistic, or low specificity signals included for hypothesis generation only." },
              { tier: "Emerging",    range: "4 to 6", desc: "Early stage evidence with some corroboration or mechanistic support." },
              { tier: "Moderate",    range: "7 to 8", desc: "Replicated findings with solid mechanistic rationale." },
              { tier: "Strong",      range: "9 to 10", desc: "Highly replicated, well characterized signals with consistent direction across multiple evidence types." },
            ].map(({ tier, range, desc }) => (
              <div key={tier} className="flex gap-4 p-4 items-start" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--rule)" }}>
                <div className="shrink-0 text-[10px] font-bold px-2 py-1 tracking-wider uppercase" style={{ backgroundColor: "var(--bg-3)", color: "var(--green-mid)", border: "1px solid var(--rule-strong)", whiteSpace: "nowrap" }}>{tier}</div>
                <div>
                  <span className="font-semibold text-[11px]" style={{ color: "var(--muted)" }}>{range} — </span>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold mb-3" style={{ color: "var(--ink)" }}>Category-Specific Minimum Standards</p>
          <div className="space-y-3">
            {[
              {
                label: "Direct Research",
                body: "The highest-confidence category carries the highest bar. Minimum requirements: at least one peer reviewed human study with clearly identified population, drug, outcome, and effect direction. Signals are excluded if they are mechanistic only with no human data. Preferred: at least one prospective study, trial, or meta-analysis. Quality criteria prioritize replication and outcome relevance over citation count — a highly cited older paper with no replication is not equivalent to two recent independent studies with similar findings.",
              },
              {
                label: "Cross-Condition Signals",
                body: "These signals are hypothesis generating by nature. Minimum requirements: the signal must appear in at least two independent evidence domains (published literature plus FDA FAERS, adverse event data plus community reports, or similar cross-domain corroboration), with the same direction of effect and a plausible shared biological mechanism. Three or more formal source mentions pointing in the same direction also qualify. Vague similarity between conditions is not sufficient — a documented shared pathway is required.",
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
              <div key={label} className="p-5" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--rule)" }}>
                <p className="font-semibold mb-1.5" style={{ color: "var(--ink)" }}>{label}</p>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold mb-3" style={{ color: "var(--ink)" }}>Cross-Cutting Reliability Rules</p>
          <p className="mb-3">For every signal across all four categories, WHEL applies five cross-cutting reliability checks:</p>
          <div className="space-y-3">
            {[
              { label: "Outcome specificity", body: "\"Improved\" is insufficient. Qualifying outcomes include pelvic pain, heavy bleeding, cycle regularity, mood lability in luteal phase, vulvar burning, and similar condition specific clinical endpoints." },
              { label: "Effect directionality", body: "Every signal must be classified as one of: improves, worsens, mixed, or unclear." },
              { label: "Replication", body: "One source is interesting. Two or more independent sources start to constitute a signal." },
              { label: "Confounding assessment", body: "Known confounders are flagged — drugs with multiple indications where symptom improvement may be indirect, forum populations reporting multiple concurrent therapies, and adverse event data that may reflect reporting bias rather than true incidence." },
              { label: "Denominator awareness", body: "FDA FAERS and community data do not provide true incidence rates. They are signal generating sources, not causal datasets. All signals from these sources are labeled accordingly and require corroboration before elevation above Emerging." },
            ].map(({ label, body }) => (
              <div key={label} className="p-5" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--rule)" }}>
                <p className="font-semibold mb-1.5" style={{ color: "var(--ink)" }}>{label}</p>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--rule)" }}>
          <p className="font-semibold mb-1.5" style={{ color: "var(--ink)" }}>One Guiding Principle</p>
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
          <div key={label} className="p-5" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--rule)" }}>
            <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--ink)" }}>{label}</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>{body}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "limitations",
    title: "Limitations",
    summary: "Fourteen documented limitations across methodology, source-specific bias, scope and generalizability, and operational disclosure. WHEL is a signal aggregator, not a clinical recommendation engine.",
    content: (
      <div className="space-y-7 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        <p>
          WHEL is a signal aggregator, not a clinical recommendation engine. Evidence strength classifications are generated by a language model against a published five-dimension rubric and should be treated as a starting point for further investigation, not a definitive assessment. Community Forum Reports reflect patient-reported patterns and are explicitly not clinical evidence. The absence of signals in the Direct Research arm for a given condition is itself data — it reflects the current state of published research, not a gap in the tool. The full list of known limitations is documented below, grouped for navigation.
        </p>

        {[
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
                label: "FAERS reporting bias",
                body: "Spontaneous adverse event reports submitted to the FDA FAERS database are subject to indication bias, channeling bias, the Weber effect (reports surge after media coverage), and notoriety bias. FAERS signals are hypothesis-generating only and should not be interpreted as causal estimates of effect.",
              },
              {
                label: "Cross-condition signal interpretation",
                body: "Cross-Condition Signals identify drugs developed for other indications where women incidentally reported benefit for one of the six target conditions. Such signals can reflect three different underlying realities: (a) genuine pharmacological effect on a shared mechanism (the desired interpretation), (b) confounding by comorbidity — the same patient population happens to carry both the original indication and the target condition with no causal pharmacological link, or (c) reporting artifact — patients with a target condition may be more likely to report any adverse event as condition-related. Triangulation across literature, FAERS, and pathway data is required before elevation above Emerging, but no triangulation eliminates this ambiguity entirely.",
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
                body: "WHEL's coverage of each condition is bounded by the scope of the search queries used in each pipeline. Compounds entirely outside our query terms — for example, a recently introduced biologic with no FAERS reports yet, or a long-tail traditional medicine without PubMed coverage — will not appear regardless of their actual relevance. Coverage gaps are systematically larger for the rarer of the six conditions (vulvodynia, adenomyosis) than for the better-studied ones (endometriosis, PCOS).",
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
        ].map(({ heading, items }) => (
          <div key={heading}>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--green-mid)" }}
            >
              {heading}
            </p>
            <div className="space-y-3">
              {items.map(({ label, body }) => (
                <div key={label} className="p-5" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--rule)" }}>
                  <p className="font-semibold mb-1.5" style={{ color: "var(--ink)" }}>{label}</p>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
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
    <main className="flex-1" style={{ backgroundColor: "var(--bg)" }}>
      <div style={{ backgroundColor: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
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
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="space-y-3">
          {SECTIONS.map((section) => {
            const isOpen = openKey === section.key;
            return (
              <div
                key={section.key}
                style={{
                  border: "1px solid var(--rule)",
                  borderLeft: isOpen ? "3px solid var(--green-mid)" : "1px solid var(--rule)",
                  backgroundColor: "var(--paper)",
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
                      className="font-heading mb-1.5"
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        color: isOpen ? "var(--green-mid)" : "var(--ink)",
                      }}
                    >
                      {section.title}
                    </h2>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        color: "var(--ink-2)",
                      }}
                    >
                      {section.summary}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-lg font-light mt-0.5"
                    style={{ color: "var(--green-mid)", lineHeight: 1 }}
                    aria-hidden="true"
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div
                    className="px-6 sm:px-8 pb-8"
                    style={{ borderTop: "1px solid var(--rule)" }}
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

        <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem", marginTop: "2rem" }}>
          <BackLink href="/about" label="Back to About" />
        </div>
      </div>
    </main>
  );
}
