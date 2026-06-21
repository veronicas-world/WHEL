"use client";

import { useState } from "react";
import type { ReactNode } from "react";

const LINK = {
  color: "var(--moss)",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
} as const;

function A({ h, children }: { h: string; children: ReactNode }) {
  return (
    <a href={h} target="_blank" rel="noopener noreferrer" style={LINK}>
      {children}
    </a>
  );
}

const ARM_COLOR: Record<string, string> = {
  direct: "var(--arm-direct)",
  pathway: "var(--arm-pathway)",
  community: "var(--arm-community)",
};

type Dim = { slot: string; means: string; l0: string; l1: string; l2: string };

type Card = {
  key: string;
  title: string;
  oneLine: string;
  sources: ReactNode;
  dims: Dim[];
  notes: ReactNode;
};

const CARDS: Card[] = [
  {
    key: "direct",
    title: "Direct Research",
    oneLine:
      "Published studies and registered clinical trials that set out to investigate the condition itself.",
    sources: (
      <>
        Direct Research is the most literal arm: studies and trials explicitly designed to
        investigate the condition in question. It is intentionally sparse for most of these
        conditions, and the sparseness is itself data — it reflects how little targeted
        research exists. Sources are{" "}
        <A h="https://pubmed.ncbi.nlm.nih.gov">PubMed</A> (via the NCBI Entrez API) and{" "}
        <A h="https://clinicaltrials.gov">ClinicalTrials.gov</A> (REST API v2, interventional
        studies). Every claim is pinned to a verbatim quote from the source and the offsets are
        verified independently of the model.
      </>
    ),
    dims: [
      { slot: "Corroboration", means: "independent corroboration", l0: "a single primary study", l1: "a single systematic review / meta-analysis, or two independent studies", l2: "three+ independent and consistent studies, or one large, well-powered, low-bias RCT" },
      { slot: "Rigor", means: "study design / risk of bias", l0: "case report / preclinical", l1: "observational or small trial", l2: "RCT, meta-analysis, or active guideline" },
      { slot: "Specificity", means: "this drug, this condition", l0: "proxy only", l1: "drug named, condition adjacent", l2: "both named directly" },
      { slot: "Plausibility", means: "mechanism", l0: "asserted", l1: "plausible", l2: "evidenced in relevant biology" },
      { slot: "Consistency", means: "do results agree in direction", l0: "conflicting", l1: "mostly one way", l2: "unanimous (a single study is scored neutral, not penalized)" },
    ],
    notes: (
      <>
        <strong>A single source caps corroboration at 1.</strong> A lone systematic review or
        meta-analysis is <em>one synthesis</em>, not independent replication, so the trials
        pooled inside it are not counted as separate sources — corroboration 2 is reserved for
        three+ genuinely independent studies or one large, low-bias pivotal trial. This follows
        the modern evidence view that a single large, well-conducted RCT can outweigh a
        meta-analysis of small, biased trials (<A h="https://www.cebm.ox.ac.uk/resources/levels-of-evidence/ocebm-levels-of-evidence">Oxford CEBM Levels of Evidence</A>), with risk of bias judged per the{" "}
        <A h="https://training.cochrane.org/handbook">Cochrane Handbook</A>.{" "}
        <strong>Imprecision is handled by hard rules, not model judgment:</strong> a very small
        sample (N&nbsp;&lt;&nbsp;30, or &lt;&nbsp;300 events) caps corroboration and rigor at 1;
        an effect with a p-value but no sample size and no confidence interval is flagged
        <em> precision-unknown</em> and routed for full-text review rather than credited.
      </>
    ),
  },
  {
    key: "pathway",
    title: "Pathway Insights",
    oneLine:
      "Mechanistic, target-level, and safety evidence of biological relevance — including adverse effects that reveal disease biology.",
    sources: (
      <>
        Pathway Insights looks for drugs with mechanistic or target-level evidence of relevance
        to a condition, including drugs whose adverse effects reveal which pathways drive the
        disease (understanding what worsens a condition is data about mechanism). Structured
        sources are rendered into fixed, verbatim sentences without a model:{" "}
        <A h="https://platform.opentargets.org">Open Targets</A> (genetic, drug-target, and
        pathway associations, via the GraphQL API keyed on EFO/MONDO ontology IDs), the FDA
        Adverse Event Reporting System —{" "}
        <A h="https://fis.fda.gov/sense/app/95239e26-e0be-42d9-a960-9a5f7f1c25ee/overview">AEMS</A>{" "}
        (formerly FAERS), and{" "}
        <A h="http://sideeffects.embl.de/">SIDER</A> (label side-effect frequencies).
      </>
    ),
    dims: [
      { slot: "Corroboration", means: "how many independent mechanistic lines converge", l0: "one mechanistic line", l1: "two converging lines", l2: "several independent lines (target + preclinical + safety)" },
      { slot: "Rigor", means: "strength / recency of the models", l0: "in-vitro only", l1: "mixed models", l2: "human-relevant models" },
      { slot: "Specificity", means: "the drug's action on the named target", l0: "broad / off-target", l1: "partially specific", l2: "specific action on the named target" },
      { slot: "Plausibility", means: "target–phenotype fit", l0: "weak link", l1: "plausible", l2: "hitting this target plausibly moves this condition" },
      { slot: "Consistency", means: "do the mechanistic signals point the same way", l0: "conflicting", l1: "mixed", l2: "converge" },
    ],
    notes: (
      <>
        <strong>Adverse-event data gets a dual read.</strong> An AEMS or SIDER signal is first a
        safety caveat, and second — only when the pharmacology supports it — a hedged
        mechanistic lead within this arm, never dressed up as efficacy. AEMS records are
        counts-based and carry a mandatory caveat that spontaneous reports cannot establish
        causation or incidence. Because structured sources have no study population, every
        pathway signal defaults to the <em>female-applicability-unconfirmed</em> band (see
        below) — mechanistic evidence is not clinical-in-women evidence, so the Pathway arm
        tops out at Moderate on its own.
      </>
    ),
  },
  {
    key: "community",
    title: "Community Forum Reports",
    oneLine:
      "Consistent, independently-reported treatment patterns from patient communities — signal, never clinical proof.",
    sources: (
      <>
        This is the arm that needs the clearest labelling: <strong>community signal, not
        clinical evidence.</strong> It exists because ignoring it would discard a meaningful,
        systematically underrepresented record of what patients actually experience — women
        rarely report a beneficial side effect in a trial that was not designed to capture it,
        but they post about it. Sources are condition-specific subreddits (
        <A h="https://www.reddit.com/r/Endo/">r/Endo</A>,{" "}
        <A h="https://www.reddit.com/r/PCOS/">r/PCOS</A>,{" "}
        <A h="https://www.reddit.com/r/PMDD/">r/PMDD</A>,{" "}
        <A h="https://www.reddit.com/r/Menopause/">r/Menopause</A>,{" "}
        <A h="https://www.reddit.com/r/adenomyosis/">r/adenomyosis</A>,{" "}
        <A h="https://www.reddit.com/r/vulvodynia/">r/vulvodynia</A>), each post pinned to its
        permalink. It is scored on patient-report-appropriate criteria — the{" "}
        <A h="https://doi.org/10.1371/journal.pmed.1001895">GRADE-CERQual</A> idea — and{" "}
        <strong>never</strong> on trial design, an approach grounded in the social-media
        pharmacovigilance literature (<A h="https://web-radr.eu/">WEB-RADR</A>).
      </>
    ),
    dims: [
      { slot: "Corroboration", means: "independence of accounts (weighted)", l0: "single account / signs of coordination", l1: "a few independent accounts", l2: "many independent accounts across threads, communities, and time" },
      { slot: "Rigor", means: "specificity of the report", l0: 'vague ("felt bad")', l1: "symptom clear, timing/dose fuzzy", l2: "clear symptom + dose + timing" },
      { slot: "Specificity", means: "this drug, this outcome", l0: "drug or outcome vague", l1: "one clear", l2: "both clear and linked" },
      { slot: "Plausibility", means: "fits the drug's pharmacology", l0: "unexplained by mechanism", l1: "loosely consistent", l2: "directly fits known pharmacology" },
      { slot: "Consistency", means: "do reports agree (confirm vs. deny)", l0: "denials outweigh confirms", l1: "mixed", l2: "confirms dominate and dose/timing coheres" },
    ],
    notes: (
      <>
        <strong>Independence is computed deterministically, not by the model.</strong> The unit
        is the distinct account, not the post: a reply written after reading the original is
        anchored by it and discounted, so a single long thread of agreement cannot reach the top
        score. Distinct independent accounts across distinct threads set corroboration (single →
        0; 2–4 → 1; 5+ across ≥2 threads → 2). Manipulation signals — near-duplicate phrasing,
        sub-hour posting bursts — cap the score further, and high upvotes never inflate it.
        Substantive denials are kept as community-level contradictions, never averaged away. A
        high-scoring community signal is labelled a <em>&ldquo;strong patient-reported
        signal&rdquo;</em> — it asserts a credible, specific, independently-reported pattern,
        never proven efficacy.
      </>
    ),
  },
];

function RubricTable({ dims, color }: { dims: Dim[]; color: string }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 18 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", minWidth: 640 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${color}` }}>
            {["Dimension", "What it measures here", "0", "1", "2"].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  fontFamily: "var(--font-plex-mono, monospace)",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  width: i >= 2 ? "20%" : i === 0 ? "13%" : "27%",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dims.map((d) => (
            <tr key={d.slot} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
              <td style={{ padding: "10px", fontWeight: 600, color, whiteSpace: "nowrap" }}>{d.slot}</td>
              <td style={{ padding: "10px", color: "var(--body)" }}>{d.means}</td>
              <td style={{ padding: "10px", color: "var(--body)" }}>{d.l0}</td>
              <td style={{ padding: "10px", color: "var(--body)" }}>{d.l1}</td>
              <td style={{ padding: "10px", color: "var(--body)" }}>{d.l2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SignalTypesAccordion() {
  const [activeKey, setActiveKey] = useState<string | null>("direct");

  function toggle(key: string) {
    setActiveKey((prev) => (prev === key ? null : key));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {CARDS.map((card, idx) => {
        const isActive = activeKey === card.key;
        const color = ARM_COLOR[card.key];
        return (
          <div
            key={card.key}
            style={{
              border: "1px solid var(--line)",
              borderLeft: isActive ? `3px solid ${color}` : "1px solid var(--line)",
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
                <p
                  style={{
                    fontFamily: "var(--font-plex-mono, monospace)",
                    fontSize: "10.5px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: isActive ? color : "var(--muted)",
                    marginBottom: 8,
                  }}
                >
                  Evidence arm {String(idx + 1).padStart(2, "0")} / {String(CARDS.length).padStart(2, "0")}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-newsreader, Georgia, serif)",
                    fontSize: "clamp(1.3rem, 2vw, 1.6rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.1,
                    margin: "0 0 8px",
                    color: isActive ? color : "var(--ink)",
                  }}
                >
                  {card.title}
                </h3>
                <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--body)" }}>{card.oneLine}</p>
              </div>
              <span
                className="shrink-0 mt-1"
                style={{ color, lineHeight: 1, fontSize: "1.4rem", fontWeight: 300 }}
                aria-hidden="true"
              >
                {isActive ? "−" : "+"}
              </span>
            </button>

            {isActive && (
              <div className="px-6 sm:px-8 pb-8" style={{ borderTop: "1px solid var(--line)" }}>
                <p style={{ paddingTop: 24, margin: 0, fontSize: "1rem", lineHeight: 1.72, color: "var(--body)" }}>
                  {card.sources}
                </p>

                {/* Full scoring criteria for this arm */}
                <div style={{ marginTop: 26 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-plex-mono, monospace)",
                      fontSize: "10.5px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color,
                      margin: "0 0 4px",
                    }}
                  >
                    Scoring criteria · five dimensions, 0–2 each
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "var(--muted)", margin: 0 }}>
                    The same five slots are scored for every arm, but each slot is interpreted on
                    this arm&rsquo;s terms. The five sum to an arm strength of 0–10, then a
                    female-applicability multiplier is applied.
                  </p>
                  <RubricTable dims={card.dims} color={color} />
                </div>

                {/* Arm-specific notes */}
                <div style={{ marginTop: 24, padding: "20px 22px", backgroundColor: "var(--bone-2)", border: "1px solid var(--line)" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-plex-mono, monospace)",
                      fontSize: "10.5px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color,
                      margin: "0 0 10px",
                    }}
                  >
                    How this arm is held in check
                  </p>
                  <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--body)", margin: 0 }}>{card.notes}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
