"use client";

import { useState } from "react";
import type { ReactNode } from "react";

const LINK_STYLE = {
  color: "var(--green-mid)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const CARDS: {
  key: string;
  title: string;
  oneLine: string;
  paragraphs: ReactNode[];
  inclusionCriteria: string;
}[] = [
  {
    key: "direct",
    title: "Direct Research",
    oneLine: "Published studies and active clinical trials specifically investigating each condition.",
    paragraphs: [
      "Direct Research is the most literal arm: it pulls studies and trials that were explicitly designed to investigate the condition in question. If a researcher set out to study endometriosis, or registered a clinical trial for PMDD, it belongs here. This arm is intentionally sparse for most conditions in the database, and the sparseness is itself data. Endometriosis affects up to 10% of women of reproductive age, yet the direct research arm returns a relatively small number of results, most of them recent. That is not a gap in WHEL. That is a reflection of how little targeted research exists.",
      <>WHEL pulls Direct Research signals from two sources. <a href="https://pubmed.ncbi.nlm.nih.gov" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>PubMed</a> (via the NCBI Entrez API) is the primary database for published biomedical literature, maintained by the National Library of Medicine. Searches are condition specific and filtered for relevance to drug or therapeutic intervention. <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>ClinicalTrials.gov</a> (via the ClinicalTrials.gov REST API v2) is the NIH registry of publicly and privately funded clinical studies. WHEL captures active, completed, and recruiting trials, including trial phase, intervention type, and enrollment status. Each signal is analyzed by a language model for evidence strength classification: Strong, Moderate, Emerging, or Exploratory.</>,
      "A concrete example: several small randomized controlled trials have examined melatonin supplementation for endometriosis related pain. These appear in the Direct Research arm because they were specifically designed to investigate endometriosis. The evidence is preliminary — small sample sizes, limited follow-up — but the signal is there, and it is the kind of signal that should be informing the next generation of trial designs. The fact that melatonin is rarely mentioned in clinical conversations about endometriosis treatment is exactly what this arm is designed to make visible.",
      "What to look for: A small number of strong evidence signals for a given condition suggests it is genuinely understudied at the trial level. A cluster of preliminary signals may indicate an emerging research area. The evidence strength label on each card reflects study design and sample size, not just whether results were positive.",
    ],
    inclusionCriteria: "The highest-confidence category carries the highest bar. Minimum requirements: at least one peer reviewed human study with clearly identified population, drug, outcome, and effect direction. Signals are excluded if they are mechanistic only with no human data. Preferred: at least one prospective study, trial, or meta-analysis. Quality criteria prioritize replication and outcome relevance over citation count — a highly cited older paper with no replication is not equivalent to two recent independent studies with similar findings.",
  },
  {
    key: "cross",
    title: "Cross-Condition Signals",
    oneLine: "Drugs developed for other conditions where women incidentally reported benefit.",
    paragraphs: [
      "Cross-Condition Signals is the arm that drug repurposing is built on. It looks for drugs that were developed or trialed for an entirely different purpose, where female patients incidentally reported benefit — or where secondary endpoints in large trials suggest an unexpected effect on a condition we are tracking.",
      <>Data sources include the <a href="https://www.fda.gov/drugs/surveillance/questions-and-answers-fdas-adverse-event-reporting-system-faers" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>FDA Adverse Event Reporting System (FAERS)</a>, population level epidemiological studies, and secondary endpoints buried in trials designed to study something else. FDA FAERS is particularly useful because it captures not just adverse events but off label use patterns and unexpected outcomes. WHEL also draws on the <a href="https://platform.opentargets.org" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>Open Targets Platform</a> (platform.opentargets.org), developed by EMBL-EBI, the Wellcome Sanger Institute, and GlaxoSmithKline, which aggregates genetic, genomic, and clinical evidence linking drug targets to diseases across multiple evidence types.</>,
      "A concrete example: several large statin trials (statins are cholesterol lowering drugs) included significant female populations. Buried in the secondary endpoints, women on statins reported reduced dysmenorrhea — painful periods, which is a hallmark symptom of endometriosis. Is this a proven treatment? No. Is it a hypothesis worth formal investigation? Yes. That is exactly what this arm is designed to surface.",
      "Drug classes of particular interest in this arm include statins, SSRIs, dopamine agonists (cabergoline, bromocriptine), and GLP-1 receptor agonists. GLP-1s are especially active right now: the wave of Ozempic and Wegovy trials has generated an enormous amount of data about hormonal and inflammatory effects in women, and researchers are only beginning to analyze what that secondary data contains.",
      "What the raw data looks like: each cross-condition signal card shows reaction counts drawn from FDA FAERS reports — for example, \u201CPain n=11.\u201D The n= number reflects how many reports in WHEL's sampled dataset mentioned that reaction, and every count links directly to the live FDA database query so anyone can verify it. As a noise filter, an individual FAERS reaction needs at least two reports before it is surfaced at all; the broader cross-condition inclusion bar — corroboration across two independent evidence domains — still applies before a signal is classified above Exploratory.",
      "What to look for: Cross-condition signals with multiple independent sources (FDA FAERS reports plus a secondary trial endpoint, for example) are stronger candidates for follow-up than signals from a single source.",
    ],
    inclusionCriteria: "These signals are hypothesis generating by nature. Minimum requirements: the signal must appear in at least two independent evidence domains (published literature plus FDA FAERS, adverse event data plus community reports, or similar cross-domain corroboration), with the same direction of effect and a plausible shared biological mechanism. Three or more formal source mentions pointing in the same direction also qualify. Vague similarity between conditions is not sufficient — a documented shared pathway is required.",
  },
  {
    key: "pathways",
    title: "Pathway Insights",
    oneLine: "Drugs with mechanistic or genetic evidence of biological relevance to a condition, including adverse effects that reveal underlying disease biology.",
    paragraphs: [
      "Pathway Insights looks for drugs with mechanistic or target level evidence of biological relevance to a condition, including drugs whose adverse effects reveal which pathways are driving the disease. The original framing of this arm was narrower: drugs that worsen conditions. The reframe is more accurate. Understanding what makes a condition worse is often a legitimate path to understanding what might make it better, because adverse effects are data about mechanism. But this arm also includes drugs with genetic and pathway level evidence of relevance that would not show up in direct clinical trials, because the research simply has not caught up yet.",
      <>The primary source for Pathway Insights is the <a href="https://platform.opentargets.org" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>Open Targets Platform</a> (platform.opentargets.org), developed by EMBL-EBI, the Wellcome Sanger Institute, and GlaxoSmithKline. Open Targets aggregates evidence across six categories: genetic associations (GWAS and rare variant data), somatic mutations, known drug target interactions, affected pathways via Reactome, differential gene expression via Expression Atlas, and animal model data. WHEL queries the Open Targets GraphQL API for each condition using standardized EFO and MONDO disease ontology identifiers. Additional signals come from FDA drug labeling (Drugs@FDA), published case reports documenting adverse gynecological effects, and EMA assessment reports which contain sex disaggregated adverse event data that rarely surfaces in journal publications.</>,
      "Two examples. Tamoxifen is a breast cancer drug that works by blocking estrogen receptors. It is documented to cause or worsen adenomyosis in some patients. This is pharmacologically informative: if blocking estrogen receptors exacerbates adenomyosis, estrogen receptor pathways are central to adenomyosis biology — which tells us what drug classes are worth investigating as treatments. Separately, Filgrastim, a G-CSF receptor agonist approved for neutropenia, appears in the endometriosis arm because G-CSF modulates immune tolerance and has been explored in recurrent implantation failure. The immune dysregulation hypothesis in endometriosis may involve altered myeloid cell function, a connection invisible without target level pathway analysis.",
      "What to look for: Pathway Insights signals that implicate a well characterized biological pathway (estrogen receptors, inflammatory cascades, dopamine signaling, immune tolerance) are more interpretable than purely empirical associations. The Pathway Insight field on each signal card names the specific mechanism. Signals with Open Targets evidence scores above 0.5 reflect stronger genetic or clinical association between the drug target and the condition.",
    ],
    inclusionCriteria: "Pathway signals are powerful but easy to overinterpret. Minimum requirements: a specific named mechanism (mast cell activation, prostaglandin signaling, androgen receptor modulation — not generic \"inflammation\"), at least one known drug target link, and at least one disease pathway link. Pathway-only signals with no human or pharmacovigilance corroboration are classified Exploratory and displayed with explicit framing. Pathway signals paired with human observation are classified Emerging or Moderate. Pathway signals with human observation plus independent replication are classified Strong.",
  },
  {
    key: "community",
    title: "Community Forum Reports",
    oneLine: "Consistent treatment patterns reported across patient communities on Reddit.",
    paragraphs: [
      "Community Forum Reports is the arm that required the most internal debate, and it is the one that needs the clearest labeling: this is community signal, not clinical evidence. It is included because ignoring it would mean discarding a meaningful and systematically underrepresented source of information about what is actually happening to patients. Women often do not report positive side effects in clinical trials unless the trial is specifically designed to capture them. If you are enrolled in a statin trial and your periods improve, that is not a primary endpoint. It is not something the researchers are looking for, and it may not end up in the published data. But you might post about it on r/Endo. And if enough women do that over several years, it is a signal: imprecise, uncontrolled, but real.",
      "WHEL pulls Community Forum Reports from Reddit using the Reddit public JSON API. The pipeline queries six condition specific subreddits: r/Endo (endometriosis), r/PCOS, r/PMDD, r/Menopause, r/adenomyosis, and r/vulvodynia. For each condition, eight treatment focused search queries are run per subreddit to identify posts discussing specific medications or interventions. The pipeline stores individual post permalinks (validated to contain /comments/ to confirm post level rather than subreddit level URLs) and groups citations by subreddit in the display. WHEL is not pulling anecdotes uncritically — it is looking for consistent patterns across a large number of posts over time, which is different from a single person's experience.",
      "One early finding from this arm: Meloxicam, an NSAID, is mentioned consistently across multiple endometriosis communities as more effective for pelvic pain than standard ibuprofen. This is pharmacologically plausible — Meloxicam is a preferential COX-2 inhibitor with a different selectivity profile than ibuprofen, which is a non-selective COX inhibitor. The distinction matters because COX-2 is the isoform primarily responsible for the prostaglandin synthesis that drives endometriosis related pain. There are very few formal studies on Meloxicam specifically for endometriosis. That gap between community reported experience and formal research is exactly what this arm is designed to make visible.",
      "What to look for: Community signals that align with a mechanistically plausible hypothesis are stronger candidates for follow-up than purely anecdotal patterns. A signal appearing across multiple subreddits for the same condition, or across multiple conditions, is more likely to reflect a real pharmacological effect than a single community observation.",
    ],
    inclusionCriteria: "This category requires the clearest guardrails. Minimum requirements: 5 or more distinct posts with specific exposure-outcome language from unique users. Raw volume alone is insufficient — the framework still requires specificity (not \"metformin changed things\" but \"after starting metformin, my cycles shortened and acne improved\"), directionality (improvement, worsening, or no change), and unique-user diversity across threads. Obvious reposts, promotional content, and low-content comments are excluded. Replication is graded on a 0–2 scale (0 = 5–7 posts, 1 = 8–14 posts, 2 = 15 or more posts). Signals with 15 or more qualifying mentions and consistent directional language are eligible for Moderate classification, particularly when triangulated with a formal source. WHEL also tracks which forums a signal appears in, the time period of discussion, and whether the signal persists over time or reflects a temporary spike.",
  },
];

export default function SignalTypesAccordion() {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  function toggle(key: string) {
    setActiveKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="space-y-3">
      {CARDS.map((card) => {
        const isActive = activeKey === card.key;
        return (
          <div
            key={card.key}
            style={{
              border: "1px solid var(--rule)",
              borderLeft: isActive ? "3px solid var(--green-mid)" : "1px solid var(--rule)",
              backgroundColor: "var(--paper)",
              transition: "border-left 0.15s ease",
            }}
          >
            <button
              onClick={() => toggle(card.key)}
              className="w-full text-left flex items-start justify-between gap-6 p-6 sm:p-8"
              aria-expanded={isActive}
            >
              <div className="flex-1 min-w-0">
                <h2
                  className="font-heading mb-1.5"
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    color: isActive ? "var(--green-mid)" : "var(--ink)",
                  }}
                >
                  {card.title}
                </h2>
                <p
                  style={{
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    color: "var(--ink-2)",
                  }}
                >
                  {card.oneLine}
                </p>
              </div>
              <span
                className="shrink-0 text-lg font-light mt-0.5"
                style={{ color: "var(--green-mid)", lineHeight: 1 }}
                aria-hidden="true"
              >
                {isActive ? "−" : "+"}
              </span>
            </button>

            {isActive && (
              <div
                className="px-6 sm:px-8 pb-8 space-y-4"
                style={{ borderTop: "1px solid var(--rule)" }}
              >
                <div
                  className="pt-6 space-y-4"
                  style={{ fontSize: "0.975rem", lineHeight: 1.72, color: "var(--ink-2)" }}
                >
                  {card.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {/* Inclusion criteria */}
                <div
                  className="mt-6 p-5"
                  style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--rule)" }}
                >
                  <p
                    className="font-mono mb-2"
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "var(--green-mid)",
                    }}
                  >
                    Inclusion criteria
                  </p>
                  <p style={{ fontSize: "0.925rem", lineHeight: 1.7, color: "var(--ink-2)" }}>
                    {card.inclusionCriteria}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
