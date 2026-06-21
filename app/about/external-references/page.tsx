import Link from "next/link";
import { Fragment } from "react";
import {
  BRAND_DICT_META,
  activeBrandCount,
  countByKind,
} from "@/lib/brand-name-dictionary";
import {
  MATRIX_AUDIT_SNAPSHOT,
  isPopulated as matrixSnapshotPopulated,
} from "@/lib/matrix-audit-snapshot";
import {
  CITATION_AUDIT_SNAPSHOT,
  citationAuditFormattedDate,
} from "@/lib/citation-audit-snapshot";
import {
  DATABASE_SOURCES_AUDIT_SNAPSHOT,
  isPopulated as databaseSourcesAuditPopulated,
  formattedDate as databaseSourcesAuditFormattedDate,
} from "@/lib/database-sources-audit-snapshot";
import {
  SUMMARY_GROUNDING_SNAPSHOT,
  isPopulated as summaryGroundingPopulated,
  formattedDate as summaryGroundingFormattedDate,
} from "@/lib/summary-grounding-audit-snapshot";
import {
  STRUCTURED_SOURCES_SNAPSHOT,
  isPopulated as structuredSourcesPopulated,
  formattedDate as structuredSourcesFormattedDate,
} from "@/lib/structured-sources-audit-snapshot";

export const metadata = {
  title: "External references | Whel",
};

/* ──────────────────────────────────────────────────────────────────────────
   Shared style tokens — matched to the Roadmap and Technical Architecture pages
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

const LINK: React.CSSProperties = {
  color: "var(--green-mid)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const SECTION_INNER = "max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20";

/* ──────────────────────────────────────────────────────────────────────────
   Content
   ────────────────────────────────────────────────────────────────────────── */

const AT_A_GLANCE: { tag: string; sub: string; color: string; items: string[] }[] = [
  {
    tag: "Independent layer",
    sub: "Cross-reference",
    color: "var(--green-deep)",
    items: [
      "Every Cure's MATRIX dataset, displayed where it has coverage",
      "Machine-learned biological-plausibility scores from a biomedical knowledge graph",
      "Shown alongside Whel's own grades rather than blended into them",
    ],
  },
  {
    tag: "Primary data",
    sub: "Live sources",
    color: "var(--green-mid)",
    items: [
      "Five primary sources, each running an active pipeline",
      "Every cited record reachable upstream to its source",
      "Public, free, and built on stable identifiers wherever possible",
    ],
  },
  {
    tag: "Out of scope",
    sub: "Intentional exclusions",
    color: "var(--muted-2)",
    items: [
      "Secondary consumer-health portals and Wikipedia summaries",
      "Closed or paywalled patient-experience platforms",
      "Generative AI outputs treated as evidence",
    ],
  },
];

const EVERYCURE_STATS: { label: string; value: string }[] = [
  { label: "Founded", value: "2022" },
  { label: "Founders", value: "Fajgenbaum, Mitchell, Sikora" },
  { label: "ARPA-H Phase 1", value: "$48.3M · Feb 2024" },
  { label: "ARPA-H Phase 2", value: "up to $76M" },
  { label: "TED Audacious Project", value: "grantee" },
  { label: "MATRIX coverage", value: "~1,800 drugs × ~22,000 diseases" },
  { label: "Pair count", value: "~39.5M" },
  { label: "Hosting", value: "Hugging Face, public" },
];

const SOURCES: {
  name: string;
  role: string;
  href: string;
  status: "Live" | "Under review" | "Planned";
  note?: string;
}[] = [
  {
    name: "PubMed",
    role: "Published literature; the spine of the Direct Research arm",
    href: "https://pubmed.ncbi.nlm.nih.gov/",
    status: "Live",
  },
  {
    name: "ClinicalTrials.gov",
    role: "Trial registry; both Direct Research and Cross-Condition arms",
    href: "https://clinicaltrials.gov/",
    status: "Live",
  },
  {
    name: "FDA openFDA / AEMS",
    role: "Adverse-event data underlying the Cross-Condition arm",
    href: "https://open.fda.gov/",
    status: "Live",
  },
  {
    name: "Open Targets",
    role: "Genetic-target and pathway evidence behind Pathway Insights",
    href: "https://www.opentargets.org/",
    status: "Live",
  },
  {
    name: "Reddit communities",
    role: "Curated condition-specific subreddits feeding Community Forum Reports",
    href: "https://www.reddit.com/",
    status: "Live",
  },
  {
    name: "Monarch Initiative · MONDO",
    role: "Disease ontology used to align condition names with the external biomedical knowledge graph",
    href: "https://mondo.monarchinitiative.org/",
    status: "Live",
    note: "Identifier resolution only",
  },
  {
    name: "Every Cure MATRIX",
    role: "Independent biological-plausibility layer; displayed where MATRIX has coverage",
    href: "https://huggingface.co/datasets/everycure/matrix-scores",
    status: "Live",
    note: "Disclosure layer; not blended into Whel grades",
  },
  {
    name: "Named society guidelines (ESHRE, ISSWSH, NAMS)",
    role: "Published clinical guidelines from named society bodies, human-curated into strength \u00d7 certainty pairs that drive the L3 external-validation grade where a named recommendation covers a compound\u2013condition pair",
    href: "https://www.eshre.eu/Guidelines-and-Legal/Guidelines",
    status: "Live",
    note: "Three bodies curated to date (ESHRE 2022, ISSWSH 2021, NAMS 2020); expansion ongoing",
  },
  {
    name: "EudraVigilance",
    role: "European adverse-event data; under review for parity with openFDA",
    href: "https://www.adrreports.eu/",
    status: "Planned",
  },
  {
    name: "DrugBank",
    role: "Drug-target and indication data; licensing model under review",
    href: "https://go.drugbank.com/",
    status: "Planned",
  },
  {
    name: "SIDER",
    role: "Drug side-effect reference; under review for retention or formal retirement",
    href: "http://sideeffects.embl.de/",
    status: "Planned",
  },
  {
    name: "DRKG (Drug Repurposing Knowledge Graph)",
    role: "Open, multi-source repurposing knowledge graph. Planned as an independent validation cross-reference shown beside a signal, not merged into Whel's own graph, because it carries the field's male-default coverage that Whel exists to correct",
    href: "https://github.com/gnn4dr/DRKG",
    status: "Planned",
    note: "Validation cross-reference; not integrated into the core architecture",
  },
  {
    name: "PrimeKG (Precision Medicine Knowledge Graph)",
    role: "Open precision-medicine graph across drugs, diseases, phenotypes, and pathways. Planned as a second independent cross-reference to widen the graph-supports-or-silent disclosure beyond one source",
    href: "https://github.com/mims-harvard/PrimeKG",
    status: "Planned",
    note: "Validation cross-reference; not integrated into the core architecture",
  },
  {
    name: "TxGNN (graph foundation model)",
    role: "Open, zero-shot drug-repurposing model. Planned as a benchmark and hypothesis cross-reference whose predictions Whel would validate rather than adopt, since the model inherits the same male-default training data",
    href: "https://www.nature.com/articles/s41591-024-03233-x",
    status: "Planned",
    note: "Validation cross-reference; not integrated into the core architecture",
  },
];

const STATUS_COLOR: Record<string, string> = {
  Live: "var(--green-mid)",
  "Under review": "var(--tier-emerging)",
  Planned: "var(--muted-2)",
};

const EXCLUSIONS: { title: string; body: string }[] = [
  {
    title: "Consumer health portals",
    body: "Wikipedia drug pages, WebMD, Healthline, and Mayo Clinic are useful background reading but are not source-of-record. Whel only cites primary literature, trial registries, regulatory databases, structured knowledge bases, and named community forums, all reachable upstream.",
  },
  {
    title: "Closed patient-experience platforms",
    body: "Commercial patient-experience platforms behind logins or paywalls are excluded. Their provenance cannot be independently verified, and their records cannot be cited in a form that survives outside the platform. Whel's community arm is restricted to publicly readable, condition-specific forums.",
  },
  {
    title: "Generative AI outputs as evidence",
    body: "Summaries produced by general-purpose AI assistants are not cited as evidence in Whel. They are not stable, not retrievable at a fixed address, and cannot be reproduced. The same applies to drug-information chatbots layered over closed knowledge bases.",
  },
  {
    title: "General social media",
    body: "Whel does not pull from X, Facebook, or general TikTok content. Community signal is restricted to focused, condition-specific subreddits with persistent moderation and stable URLs, surfaced under the Community Forum Reports arm with explicit labeling.",
  },
];

const CONTINUE: { label: string; href: string; accent: boolean }[] = [
  { label: "← About Whel", href: "/about", accent: false },
  { label: "Read the roadmap →", href: "/about/roadmap", accent: false },
  { label: "Browse the six conditions →", href: "/conditions", accent: true },
];

/* ──────────────────────────────────────────────────────────────────────────
   Small presentational helpers
   ────────────────────────────────────────────────────────────────────────── */

function SectionHeader({
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

/* ──────────────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────────────── */

export default function ExternalReferencesPage() {
  return (
    <main className="flex-1 doc-shell" style={{ backgroundColor: "var(--bg)" }}>

      {/* ── Floating table of contents (large screens only) ──────────────── */}
      <aside className="doc-toc" aria-label="On this page">
        <div className="doc-toc-eyebrow">On this page</div>
        <a href="#at-a-glance"><span className="doc-n">00</span><span className="doc-t">At a glance</span></a>
        <a href="#underlying-data"><span className="doc-n">01</span><span className="doc-t">Underlying data</span></a>
        <a href="#structured-grounding-in-progress"><span className="doc-n">02</span><span className="doc-t">Structured grounding</span></a>
        <a href="#output-validation-in-progress"><span className="doc-n">03</span><span className="doc-t">Output validation</span></a>
        <a href="#cross-references"><span className="doc-n">04</span><span className="doc-t">Cross-references</span></a>
        <a href="#coverage-disclosure"><span className="doc-n">05</span><span className="doc-t">Coverage disclosure</span></a>
        <a href="#female-biology"><span className="doc-n">06</span><span className="doc-t">Female-biology layer</span></a>
        <a href="#under-review"><span className="doc-n">07</span><span className="doc-t">Under review</span></a>
        <a href="#out-of-scope"><span className="doc-n">08</span><span className="doc-t">Out of scope</span></a>
        <a href="#crosswalk"><span className="doc-n">09</span><span className="doc-t">Crosswalk transparency</span></a>
        <a href="#this-page"><span className="doc-n">10</span><span className="doc-t">This page</span></a>
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
            <span style={{ color: "var(--ink)" }}>External references</span>
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
            External references.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "66ch" }}>
            Whel is built on top of public databases that other research groups
            also use, and it sits within a broader ecosystem of drug-repurposing
            work being done by other teams. This page lays out those
            relationships explicitly. The intent is to be honest about what Whel
            is doing that no one else does, what it is using from other
            projects, what it is comparing itself against, and what kinds of
            work are intentionally out of scope.
          </p>
        </div>
      </div>

      {/* ── At a glance ──────────────────────────────────────────────────── */}
      <section id="at-a-glance" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div style={{ ...EYEBROW, marginBottom: 20 }}>At a glance</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {AT_A_GLANCE.map((p) => (
              <div
                key={p.tag}
                style={{ ...CARD, borderTop: `3px solid ${p.color}`, padding: "22px 22px 24px" }}
              >
                <div
                  style={{
                    ...MONO,
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: p.color,
                    marginBottom: 4,
                  }}
                >
                  {p.tag}
                </div>
                <div
                  className="font-heading"
                  style={{ fontSize: "15px", color: "var(--ink)", marginBottom: 16 }}
                >
                  {p.sub}
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", margin: 0, padding: 0 }}>
                  {p.items.map((it) => (
                    <li
                      key={it}
                      style={{
                        fontSize: "13px",
                        lineHeight: 1.55,
                        color: "var(--ink-2)",
                        paddingLeft: 14,
                        position: "relative",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 7,
                          width: 5,
                          height: 5,
                          backgroundColor: p.color,
                        }}
                      />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02 · Underlying data sources ─────────────────────────────────── */}
      <section id="underlying-data" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="01 · Underlying data"
            title="The primary sources Whel runs on"
            intro="Every signal in the database traces back to one of a small set of primary sources. The table below lists each source, its role in the pipelines, and the current integration status. Each name links straight to the source."
          />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Source", "Role", "Status"].map((h, i) => (
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
                        width: ["28%", "52%", "20%"][i],
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s) => (
                  <tr key={s.name}>
                    <td
                      style={{
                        padding: "14px 14px 14px 0",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "baseline",
                      }}
                    >
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-heading"
                        style={{
                          fontSize: "15px",
                          color: "var(--ink)",
                          textDecoration: "none",
                          borderBottom: "1px solid var(--rule-strong)",
                          paddingBottom: 1,
                        }}
                      >
                        {s.name}
                      </a>
                      {s.note && (
                        <div
                          style={{
                            ...MONO,
                            fontSize: "10.5px",
                            color: "var(--muted)",
                            letterSpacing: "0.04em",
                            marginTop: 4,
                          }}
                        >
                          {s.note}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        lineHeight: 1.55,
                        color: "var(--ink-2)",
                        padding: "14px 14px",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "baseline",
                      }}
                    >
                      {s.role}
                    </td>
                    <td
                      style={{
                        ...MONO,
                        fontSize: "12px",
                        color: STATUS_COLOR[s.status],
                        padding: "14px 14px",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "baseline",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ● {s.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p
            style={{
              ...MONO,
              fontSize: "11.5px",
              lineHeight: 1.6,
              color: "var(--muted)",
              marginTop: 18,
            }}
          >
            Every cited record in Whel is reachable upstream to one of the live sources listed above.
          </p>
        </div>
      </section>

      {/* ── 01c · Structured grounding ───────────────────────────────────── */}
      {/* Two collapsible blocks for Path A (ontology-grounded entity
          resolution) and Path B (knowledge-graph grounding) recorded in
          methodology v3.4. Both are architectural additions to the LLM
          pipeline, not pure post-hoc validation: Path A canonicalizes and
          enriches every extracted compound and condition against ChEMBL and
          MONDO/EFO (now applied across the corpus), Path B adds a persistent
          relational graph over Open Targets that surfaces a graph-supports /
          graph-silent disclosure beside each signal (live in the gated view),
          with the BioCypher property graph and prompt-time scoring still
          planned. The block structure parallels the MATRIX disclosure block
          above so the page reads as a single 'here are the grounding layers'
          surface. Patterned on the section 05 brand-name dictionary's
          <details> collapsible. */}
      <section
        id="structured-grounding-in-progress"
        style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}
      >
        <div className={SECTION_INNER}>
          <SectionHeader
            label="02 · Structured grounding"
            title="Two structured grounding layers on top of LLM extraction"
            intro="Whel's evidence extraction and scoring layer runs on a large language model. Documented LLM failure modes (universal social-determinants blind spots reported by WHBench in 2026; high reference-fabrication rates reported by Bhattacharyya et al. 2023 in Cureus, 47 percent of ChatGPT-generated medical references fully fabricated and 46 percent authentic but with bibliographic errors) motivate grounding the pipeline in structured external knowledge rather than relying on LLM output alone. Two such layers are recorded in the methodology version log at v3.4: ontology-grounded entity resolution (Path A) and knowledge-graph grounding (Path B). Both are now in place in their first form. Path A canonicalizes extracted entities to standard identifiers and enriches them with structured metadata, and is applied across the corpus with ambiguous cases held for human review. Path B builds a domain-restricted graph over Open Targets and surfaces a 'graph supports' or 'graph silent' layer beside each signal, in the same shape as the MATRIX coverage block above. Two extensions stay planned and are called out below: feeding the graph into LLM scoring at prompt time, and a deeper property-graph version alongside an independent open-knowledge-graph validation track. These are architectural additions, not post-hoc checks. Both blocks are collapsed by default; expand for the full account."
          />

          {/* Path A: Entity validation */}
          <details className="disclose-block" style={{ marginTop: 4, marginBottom: 18 }}>
            <summary
              style={{
                ...MONO,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 18px",
                border: "1px solid var(--rule)",
                background: "var(--surface)",
                color: "var(--ink-2)",
              }}
              aria-label="Open Path A: Ontology-grounded entity resolution"
            >
              <span style={{ display: "block", minWidth: 0 }}>
                <span
                  className="font-heading"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "var(--ink)",
                    letterSpacing: 0,
                    textTransform: "none",
                    marginBottom: 6,
                  }}
                >
                  Path A: Ontology-grounded entity resolution
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--green-mid)",
                    lineHeight: 1.5,
                    marginBottom: 4,
                  }}
                >
                  Live &middot; Canonical IDs resolved; audit numbers to follow
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--muted-2)",
                    lineHeight: 1.5,
                  }}
                >
                  ChEMBL &middot; MONDO &middot; EFO
                </span>
              </span>
              <span
                className="disclose-chev"
                aria-hidden="true"
                style={{
                  ...MONO,
                  fontSize: "14px",
                  color: "var(--muted)",
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                &darr;
              </span>
            </summary>

            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  What the layer does
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  This layer serves three functions, not one. First, it
                  canonicalizes: every compound and condition the LLM
                  extracts is resolved against a canonical biomedical
                  registry and rewritten with that registry&apos;s standard
                  identifier before being written to Whel&apos;s database.
                  Compounds resolve against ChEMBL or DrugBank; conditions
                  resolve against MONDO (the same ontology Whel already uses
                  for the MATRIX cross-reference above). Second, it enriches:
                  the resolution call returns structured metadata (generic
                  name, drug class, ATC code, known targets for a compound;
                  ontology lineage for a condition) that travels with the
                  signal into the database, changing the shape of the data
                  Whel stores. Third, it gates: entities that fail to
                  resolve are flagged for human review rather than silently
                  stored, which catches the structured-output hallucination
                  class of error documented in the LLM literature.
                </p>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  What the audit disclosure will show once surfaced
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    maxWidth: "72ch",
                  }}
                >
                  {[
                    {
                      head: "Per-pipeline entity resolution rate.",
                      tail: "Percentage of LLM-extracted entities that resolved against the canonical ontology, broken down by pipeline (PubMed, ClinicalTrials.gov, FDA AEMS, Open Targets, Reddit). A pipeline with a noticeably lower resolution rate is a pipeline whose extraction prompt is producing more hallucinated entities.",
                    },
                    {
                      head: "Per-condition resolution rate.",
                      tail: "So resolution quality differences across the six conditions are visible rather than averaged away. A condition whose extracted compounds resolve at a lower rate is a condition where extraction is less trustworthy.",
                    },
                    {
                      head: "Count of entities currently flagged for human review.",
                      tail: "With the pipeline and condition each was extracted from, and the reason resolution failed (no matching identifier, ambiguous match across multiple registered compounds, deprecated identifier).",
                    },
                    {
                      head: "Sample of unresolved entities from the most recent run.",
                      tail: "So the failure mode is concrete rather than abstract. A reader can see the actual text the LLM produced and judge for themselves whether the rejection is a true positive or whether the canonical ontology is incomplete.",
                    },
                    {
                      head: "Enrichment summary.",
                      tail: "Average number of structured metadata fields attached to each resolved entity (drug class, ATC code, known targets for compounds; ontology lineage for conditions), so the data-shape change is visible rather than implicit.",
                    },
                  ].map((item) => (
                    <li
                      key={item.head}
                      style={{
                        position: "relative",
                        paddingLeft: 22,
                        marginBottom: 10,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "var(--ink-2)",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          color: "var(--green-mid)",
                          fontWeight: 600,
                        }}
                      >
                        &rsaquo;
                      </span>
                      <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                        {item.head}
                      </strong>{" "}
                      {item.tail}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Literature anchor
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  Bhattacharyya et al. 2023 (Cureus,{" "}
                  <a
                    href="https://doi.org/10.7759/cureus.39238"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    doi:10.7759/cureus.39238
                  </a>
                  ) examined 115 references across 30 ChatGPT-generated
                  medical papers and found 47 percent fully fabricated, 46
                  percent authentic but with bibliographic errors, and
                  only 7 percent authentic and accurate. WHBench (Maurya,
                  Saboo &amp; Kumar 2026,{" "}
                  <a
                    href="https://arxiv.org/abs/2604.00024"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    arXiv:2604.00024
                  </a>
                  ) documents a 35.5 percent fully-correct rate for the top
                  frontier LLM on women&apos;s health clinical questions, with
                  systematic gaps in safety, completeness, and the
                  social-determinants criterion. Resolution and enrichment
                  against canonical ontologies addresses the structured-output
                  failure mode that both papers describe and also moves the
                  data Whel stores from free-text strings to canonical
                  identifiers with structured metadata.
                </p>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Where this lives in the project
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  Recorded in the methodology revision history at v3.4 (see{" "}
                  the methodology changelog
                  ). Listed on the Roadmap under the technical-architecture
                  track as &ldquo;Ontology-grounded entity resolution (Path
                  A).&rdquo; The resolution, enrichment, and human-review gate
                  are now applied across the corpus, so the canonical
                  identifiers and structured metadata travel with every signal.
                  The per-pipeline and per-condition audit numbers above are the
                  remaining piece: they populate this block once the
                  resolution-rate disclosure is surfaced.
                </p>
              </div>
            </div>
          </details>

          {/* Path B: knowledge-graph grounding (relational over Open Targets; BioCypher version planned) */}
          <details className="disclose-block">
            <summary
              style={{
                ...MONO,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 18px",
                border: "1px solid var(--rule)",
                background: "var(--surface)",
                color: "var(--ink-2)",
              }}
              aria-label="Open Path B: Knowledge-graph grounding (graph supports / graph silent)"
            >
              <span style={{ display: "block", minWidth: 0 }}>
                <span
                  className="font-heading"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "var(--ink)",
                    letterSpacing: 0,
                    textTransform: "none",
                    marginBottom: 6,
                  }}
                >
                  Path B: Knowledge-graph grounding (graph supports / graph silent)
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--green-mid)",
                    lineHeight: 1.5,
                    marginBottom: 4,
                  }}
                >
                  Live &middot; Graph supports / silent shipped over Open Targets
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--muted-2)",
                    lineHeight: 1.5,
                  }}
                >
                  Open Targets &middot; gated view &middot; BioCypher version planned
                </span>
              </span>
              <span
                className="disclose-chev"
                aria-hidden="true"
                style={{
                  ...MONO,
                  fontSize: "14px",
                  color: "var(--muted)",
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                &darr;
              </span>
            </summary>

            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  What the layer does
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  This layer is both a grounding mechanism and a disclosure
                  layer, and it arrives in stages. The stage live today is
                  relational: a domain-restricted graph of drug, target, and
                  condition relationships built over Open Targets, restricted to
                  Whel&apos;s six conditions and the compounds attached to active
                  signals. From it, each signal carries a &lsquo;graph
                  supports&rsquo; or &lsquo;graph silent&rsquo; tag beside its
                  grade, in the same shape as the MATRIX score row above.
                  &lsquo;Graph supports, via target X&rsquo; means the drug acts
                  on a target that Open Targets associates with the condition;
                  &lsquo;graph silent&rsquo; means no such shared target is
                  present, which can reflect either a real biological gap or a
                  limit of the source data. Two of the six conditions show this
                  plainly: vulvodynia and PMDD return{" "}
                  <a
                    href="https://platform.opentargets.org/search?q=vulvodynia"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    no disease entry in Open Targets at all
                  </a>
                  , so every signal under them is graph silent by construction,
                  an absence the page shows rather than hides. The planned stage
                  deepens this: a
                  property-graph version built with the BioCypher framework
                  (Lobentanzer et al., Nature Biotechnology 2023), grounded in
                  canonical ontologies, and a feed of the relevant subgraph into
                  the LLM at prompt time so the model relies less on parametric
                  memory alone. Open repurposing graphs and models such as DRKG,
                  PrimeKG, and TxGNN sit in a separate validation track, checked
                  against rather than merged in, because they carry the
                  field&apos;s male-default coverage that Whel exists to correct.
                </p>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  What the disclosure covers
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--muted-2)", maxWidth: "72ch", margin: "0 0 12px" }}>
                  The signal-level &lsquo;graph supports / graph silent&rsquo; tag
                  is live in the gated view today. The aggregate audit views
                  below (graph size, per-condition coverage, tier
                  cross-tabulation) are computed from the same data and are being
                  surfaced as reporting.
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    maxWidth: "72ch",
                  }}
                >
                  {[
                    {
                      head: "Knowledge graph size and shape.",
                      tail: "Number of nodes by type (drug, condition, gene, pathway, adverse event) and edges by relationship type (targets, treats, interacts, associated-with, etc.). Reported as a snapshot table with the data-source SHAs each edge type was drawn from, identical in shape to the MATRIX dataset snapshot above.",
                    },
                    {
                      head: "Per-condition graph coverage.",
                      tail: "For each of the six conditions, the count of Whel compounds that have at least one graph-supported mechanistic path to that condition, and the count that have none. A condition with low graph coverage is a condition where the Whel grades stand alone without a graph cross-reference, and that fact is made visible.",
                    },
                    {
                      head: "Signal-level graph support.",
                      tail: "Each individual signal carries a 'graph supports' or 'graph silent' tag. 'Graph supports' means at least one mechanistic path exists in the KG that connects the compound to the condition through known targets, pathways, or co-occurring annotations. 'Graph silent' is not the same as 'graph contradicts'; it means the open KGs do not contain a relevant edge, which can reflect either a real biological gap or a known limitation of the source data.",
                    },
                    {
                      head: "Cross-tabulation against Whel tiers.",
                      tail: "How Whel's four confidence tiers (Strong, Moderate, Emerging, Exploratory) cross with graph support. A graph-supported Strong-tier signal is the strongest combined evidence the platform can present. A graph-silent Strong-tier signal is a signal where the literature replicates but the open knowledge graphs have not yet caught up; that pattern is also informative.",
                    },
                  ].map((item) => (
                    <li
                      key={item.head}
                      style={{
                        position: "relative",
                        paddingLeft: 22,
                        marginBottom: 10,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "var(--ink-2)",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          color: "var(--green-mid)",
                          fontWeight: 600,
                        }}
                      >
                        &rsaquo;
                      </span>
                      <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                        {item.head}
                      </strong>{" "}
                      {item.tail}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Literature anchor
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  BioCypher is the peer-reviewed, EU-funded biomedical
                  knowledge graph framework introduced in Lobentanzer et al.,
                  Nature Biotechnology 2023, and{" "}
                  <a
                    href="https://biocypher.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    actively maintained
                  </a>
                  . The architectural pattern of layering structured
                  knowledge graphs on top of LLM extraction, rather than
                  replacing the LLM with classical ML, is the direction
                  argued by Zong, Lv, Xue, Zheng, Wan &amp; Zhang 2026
                  (&ldquo;Building evidence-based knowledge bases from
                  full-text literature for disease-specific biomedical
                  reasoning,&rdquo;{" "}
                  <a
                    href="https://arxiv.org/abs/2603.28325"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    arXiv:2603.28325
                  </a>
                  , which introduces the EvidenceNet dataset). Every
                  Cure&apos;s MATRIX builds on the KGML-xDTD framework (Ma,
                  Zhou, Liu &amp; Koslicki,{" "}
                  <a
                    href="https://doi.org/10.1093/gigascience/giad057"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    GigaScience 2023
                  </a>
                  ) and demonstrates that knowledge graph plus machine
                  learning systems
                  outperform LLM-only approaches for the separate problem of
                  global drug repurposing prediction, which Whel does not
                  attempt.
                </p>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Where this lives in the project
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  Recorded in the methodology revision history at v3.4 (see{" "}
                  the methodology changelog
                  ). Listed on the Roadmap under the technical-architecture
                  track as &ldquo;Knowledge-graph grounding,&rdquo; now live for
                  the relational Open Targets version with the per-signal tag in
                  the gated view. The BioCypher property graph and the
                  prompt-time scoring feed remain planned, and the open
                  knowledge graphs and models are tracked separately under the
                  Roadmap&apos;s validation layer. Whel will not train a custom
                  graph neural network; the platform consumes machine learning
                  (Claude Opus 4.8 for extraction and scoring, MATRIX scores as
                  the existing cross-reference) but does not develop its own ML
                  models.
                </p>
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* ── 01d · Output validation in progress ──────────────────────────── */}
      {/* Path C: the three-phase output validation pipeline recorded in
          methodology v3.6. Distinct from sections 01c Path A and Path B,
          which ground the LLM's inputs; Path C validates the LLM's
          outputs (citations, summary statements, published prose). One
          collapsible block, three phases described inside, all marked
          Pending. Patterned on the section 05 brand-name dictionary's
          <details> collapsible and on the existing Path A/B blocks
          above. */}
      <section
        id="output-validation-in-progress"
        style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}
      >
        <div className={SECTION_INNER}>
          <SectionHeader
            label="03 · Output validation in progress"
            title="A three-part pipeline for LLM output validation"
            intro="Whel's structured grounding layers (Path A and Path B, documented in section 01c above) constrain what data the LLM works with. A separate set of failure modes apply to what the LLM produces as output: per-source extraction misclassification, summary drift beyond the source, and fabricated or mis-attributed citations in long-form prose. Path C is a three-part pipeline that validates the LLM's outputs against external authoritative sources before publication. Recorded in methodology v3.6. Phase 1, citation validation, is live; phases 2 and 3 are planned. This section sets out what each phase does, or will do, and what its disclosure looks like. The block is collapsed by default; expand for the full plan."
          />

          {/* Path C: Citation validation, summary grounding, prompt hardening */}
          <details className="disclose-block">
            <summary
              style={{
                ...MONO,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 18px",
                border: "1px solid var(--rule)",
                background: "var(--surface)",
                color: "var(--ink-2)",
              }}
              aria-label="Open Path C: Citation validation and summary grounding"
            >
              <span style={{ display: "block", minWidth: 0 }}>
                <span
                  className="font-heading"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "var(--ink)",
                    letterSpacing: 0,
                    textTransform: "none",
                    marginBottom: 6,
                  }}
                >
                  Path C: Citation validation and summary grounding
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--tier-emerging)",
                    lineHeight: 1.5,
                    marginBottom: 4,
                  }}
                >
                  Phase 1 live &middot; Phases 2 and 3 pending
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--muted-2)",
                    lineHeight: 1.5,
                  }}
                >
                  NCBI E-utilities &middot; Crossref REST API &middot; Sentence-BERT
                </span>
              </span>
              <span
                className="disclose-chev"
                aria-hidden="true"
                style={{
                  ...MONO,
                  fontSize: "14px",
                  color: "var(--muted)",
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                &darr;
              </span>
            </summary>

            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Phase 1: citation validation
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  Every PMID in Whel&apos;s database, and every reference in
                  any prose Whel publishes (featured signal walkthroughs,
                  the methods PDF, written drafts), is resolved against{" "}
                  <a
                    href="https://www.ncbi.nlm.nih.gov/books/NBK25501/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    NCBI E-utilities
                  </a>
                  ; DOIs are resolved against the{" "}
                  <a
                    href="https://www.crossref.org/documentation/retrieve-metadata/rest-api/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    Crossref REST API
                  </a>
                  . Each lookup returns canonical title, authors, journal,
                  and year, which are compared against the LLM-claimed
                  metadata. References that fail to resolve or whose
                  returned metadata mismatch the LLM&apos;s claims are
                  flagged for human review and blocked from publication.
                  This addresses the citation fabrication and
                  citation-misattribution failure modes directly.
                </p>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Phase 2: sentence-level summary grounding
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  For every signal row in the database, a
                  sentence-transformer model (the Sentence-BERT family of
                  models published on Hugging Face) computes the cosine
                  similarity between each sentence in the LLM-generated
                  summary and the source abstract. Sentences that fall
                  below a calibrated similarity threshold are flagged as
                  &ldquo;not directly supported by the source&rdquo; and
                  either suppressed or surfaced with that marker on the
                  signal card. The threshold is tuned against a held-out
                  human-validation set rather than picked by intuition.
                  This addresses the summary-drift failure mode
                  documented in the medical LLM literature (Bhattacharyya
                  et al. 2023 in Cureus,{" "}
                  <a
                    href="https://doi.org/10.7759/cureus.39238"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    doi:10.7759/cureus.39238
                  </a>
                  ) applied to Whel&apos;s specific extraction task.
                </p>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Phase 3: prompt hardening for published prose
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  Any LLM-generated long-form prose that ships to users
                  (featured walkthroughs, methods PDF text, future Substack
                  drafts written through Whel&apos;s tooling) is generated
                  under a hardened prompt that forbids citation generation
                  outside a pre-verified reference list provided to the
                  model, forbids numerical claims (prevalence rates, effect
                  sizes) unless they appear verbatim in the input context,
                  and requires the model to produce, alongside the text, a
                  sentence-by-sentence list of which input sources support
                  each sentence. The list is then checked by Phase 1 before
                  the prose is published.
                </p>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Phase 1 audit · live as of {citationAuditFormattedDate()}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "var(--ink-2)",
                    maxWidth: "72ch",
                    margin: "0 0 12px 0",
                  }}
                >
                  Path C Phase 1 ships as <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/verify-citations.py</code>{" "}
                  and reads the pre-verified reference list at{" "}
                  <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>lib/whel-citations.json</code>. The
                  script resolves every PMID against NCBI E-utilities,
                  every DOI against the Crossref REST API, and every
                  arXiv ID against the arXiv API, then compares returned
                  canonical metadata (title, first-author surname, container
                  title, year) against the claims in the manifest using
                  fuzzy match with calibrated thresholds. Output is
                  written to{" "}
                  <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/audit-output/citation-audit-report.json</code>{" "}
                  and mirrored to{" "}
                  <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>lib/citation-audit-snapshot.json</code>, which this
                  page reads from. <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>--strict</code> mode exits non-zero
                  on any unresolved or mismatched entry and is wired for
                  pre-publish use.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 16,
                    margin: "0 0 16px 0",
                    padding: "16px 18px",
                    border: "1px solid var(--rule)",
                    background: "var(--surface)",
                  }}
                >
                  {[
                    {
                      label: "Total citations",
                      value: CITATION_AUDIT_SNAPSHOT.summary.total.toString(),
                    },
                    {
                      label: "Resolved + match",
                      value: CITATION_AUDIT_SNAPSHOT.summary.resolved_match.toString(),
                    },
                    {
                      label: "Resolved + mismatch",
                      value: CITATION_AUDIT_SNAPSHOT.summary.resolved_mismatch.toString(),
                    },
                    {
                      label: "Unresolved",
                      value: CITATION_AUDIT_SNAPSHOT.summary.unresolved.toString(),
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div
                        style={{
                          ...MONO,
                          fontSize: 10,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                          marginBottom: 4,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        className="font-heading"
                        style={{
                          fontSize: "1.4rem",
                          fontWeight: 500,
                          color: "var(--ink)",
                          lineHeight: 1.1,
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <p
                  style={{
                    ...MONO,
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    lineHeight: 1.6,
                    color: "var(--muted)",
                    margin: "0 0 18px 0",
                  }}
                >
                  The expanded manifest on June 7, 2026 (v3.9) added the
                  eight hand-written featured-page references. The verifier
                  caught a real author misattribution among them: a paper
                  attributed to one author group resolved, at the cited PMC
                  link, to a paper by an entirely different group. The
                  featured page and the manifest were both corrected before
                  the disclosure published. The full run log is at{" "}
                  <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/audit-output/citation-audit-report.json</code>.
                </p>

                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Database-sources audit ·{" "}
                  {databaseSourcesAuditPopulated()
                    ? `live as of ${databaseSourcesAuditFormattedDate()}`
                    : "tooling shipped, awaiting first run"}
                </div>
                {databaseSourcesAuditPopulated() ? (
                  <>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: "var(--ink-2)",
                        maxWidth: "72ch",
                        margin: "0 0 12px 0",
                      }}
                    >
                      The much larger surface is the live{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>sources</code>{" "}
                      table: every PMID from PubMed, every NCT ID from
                      ClinicalTrials.gov, every Open Targets identifier,
                      and every AEMS / Reddit URL that the LLM
                      extraction pipeline attached to an active signal
                      and rendered on a drug card.
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: 16,
                        margin: "0 0 16px 0",
                        padding: "16px 18px",
                        border: "1px solid var(--rule)",
                        background: "var(--surface)",
                      }}
                    >
                      {[
                        {
                          label: "Total rows audited",
                          value: DATABASE_SOURCES_AUDIT_SNAPSHOT.summary.total.toString(),
                        },
                        ...Object.entries(
                          DATABASE_SOURCES_AUDIT_SNAPSHOT.summary.by_status,
                        ).map(([status, n]) => ({
                          label: status.replace(/_/g, " "),
                          value: n.toString(),
                        })),
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div
                            style={{
                              ...MONO,
                              fontSize: 10,
                              letterSpacing: "0.2em",
                              textTransform: "uppercase",
                              color: "var(--muted)",
                              marginBottom: 4,
                            }}
                          >
                            {label}
                          </div>
                          <div
                            className="font-heading"
                            style={{
                              fontSize: "1.4rem",
                              fontWeight: 500,
                              color: "var(--ink)",
                              lineHeight: 1.1,
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p
                      style={{
                        ...MONO,
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        lineHeight: 1.6,
                        color: "var(--muted)",
                        margin: "0 0 16px 0",
                      }}
                    >
                      Zero{" "}
                      <em>resolved_mismatch</em>{" "}
                      entries on the first run: 113 of 113 PubMed PMIDs
                      clean against NCBI E-utilities, 19 of 19
                      ClinicalTrials.gov NCT IDs clean against the
                      ClinicalTrials.gov API v2, and 38 of 38 canonical
                      Open Targets identifiers clean against the Open
                      Targets GraphQL search. The 10 unresolved are all
                      Open Targets rows storing a synthetic{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>OT-{`{DRUGNAME}`}</code>{" "}
                      shorthand in the{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>external_id</code>{" "}
                      column instead of a canonical CHEMBL identifier;
                      the URL on those rows still points at a real{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>platform.opentargets.org</code>{" "}
                      page, so what users see on the drug card is a
                      valid citation. The failure is at the
                      identifier-storage layer rather than the
                      user-visible content layer. Backfill recorded on
                      the{" "}
                      <Link href="/about/roadmap" style={LINK}>roadmap</Link>{" "}
                      under{" "}
                      <em>Backfill canonical Open Targets identifiers
                      on signals using OT-DRUGNAME shorthand</em>;
                      methodology v3.10 has the full finding write-up.
                      Run log at{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/audit-output/database-sources-audit-report.json</code>.
                    </p>
                  </>
                ) : (
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: "var(--ink-2)",
                      maxWidth: "72ch",
                      margin: "0 0 18px 0",
                    }}
                  >
                    The manifest covered above is the hand-written prose
                    surface (methodology, external-references, changelog,
                    methods PDF, featured pages) plus a small set of
                    foundational journal references. The much larger
                    surface is the live{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>sources</code>{" "}
                    table on the Whel database: every PMID from PubMed,
                    every NCT ID from ClinicalTrials.gov, every Open
                    Targets identifier, and every AEMS / Reddit URL the
                    LLM extraction pipeline attached to an active signal
                    and rendered on a drug card. The tooling to audit
                    those rows shipped on June 7, 2026 as{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/export-sources-for-audit.py</code>{" "}
                    (Supabase export) and{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/verify-database-sources.py</code>{" "}
                    (PMID against NCBI E-utilities, NCT against
                    ClinicalTrials.gov API v2, Open Targets ID against
                    Open Targets GraphQL, AEMS and Reddit URL format
                    checks). The first run requires running the export
                    locally (the script reads{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                    from{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>.env.local</code>),
                    committing the resulting{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>lib/sources-audit-snapshot.json</code>,
                    and running the verifier. This block will switch
                    to a live numbers grid the moment the verifier
                    populates{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>lib/database-sources-audit-snapshot.json</code>.
                    Tracked on the{" "}
                    <Link href="/about/roadmap" style={LINK}>roadmap</Link>{" "}
                    under Path C Phase 1 (database sources).
                  </p>
                )}

                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Phase 2a (summary grounding) ·{" "}
                  {summaryGroundingPopulated()
                    ? `live as of ${summaryGroundingFormattedDate()}`
                    : "tooling shipped, awaiting first run"}
                </div>
                {summaryGroundingPopulated() ? (
                  <>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: "var(--ink-2)",
                        maxWidth: "72ch",
                        margin: "0 0 12px 0",
                      }}
                    >
                      Sentence-level grounding for free-text sources
                      (PubMed, ClinicalTrials.gov, Reddit). Each
                      LLM-generated finding sentence on{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>sources.key_finding_excerpt</code>{" "}
                      is embedded via{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>{SUMMARY_GROUNDING_SNAPSHOT.model}</code>{" "}
                      and compared against canonical-source sentences
                      using max cosine similarity. Sentences scoring
                      below{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>{SUMMARY_GROUNDING_SNAPSHOT.similarity_threshold}</code>{" "}
                      are flagged as not directly supported by the
                      source.
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: 14,
                        margin: "0 0 16px 0",
                        padding: "14px 16px",
                        border: "1px solid var(--rule)",
                        background: "var(--surface)",
                      }}
                    >
                      {[
                        { label: "Sources audited", value: SUMMARY_GROUNDING_SNAPSHOT.summary.total.toString() },
                        { label: "Summary sentences", value: SUMMARY_GROUNDING_SNAPSHOT.summary.sentence_total.toString() },
                        { label: "Sentences flagged", value: SUMMARY_GROUNDING_SNAPSHOT.summary.sentences_flagged.toString() },
                        { label: "Flag rate", value: `${(SUMMARY_GROUNDING_SNAPSHOT.summary.sentence_flag_rate * 100).toFixed(1)}%` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
                            {label}
                          </div>
                          <div className="font-heading" style={{ fontSize: "1.3rem", fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: "var(--ink-2)",
                      maxWidth: "72ch",
                      margin: "0 0 18px 0",
                    }}
                  >
                    Sentence-level grounding for free-text sources
                    (PubMed, ClinicalTrials.gov, Reddit). Each
                    LLM-generated finding sentence on{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>sources.key_finding_excerpt</code>{" "}
                    will be embedded via Sentence-BERT
                    (all-MiniLM-L6-v2) and compared against canonical
                    source sentences using max cosine similarity.
                    Sentences scoring below 0.40 will be flagged as
                    not directly supported by the source. Tooling
                    shipped as{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/verify-summary-grounding.py</code>;
                    runs after the export script is re-run to
                    populate the{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>key_finding_excerpt</code>{" "}
                    field on the sources snapshot and after{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>pip install sentence-transformers</code>{" "}
                    on the host. This block switches to live numbers
                    the moment{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>lib/summary-grounding-audit-snapshot.json</code>{" "}
                    is populated.
                  </p>
                )}

                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Phase 2b (structured-source verification) ·{" "}
                  {structuredSourcesPopulated()
                    ? `live as of ${structuredSourcesFormattedDate()}`
                    : "tooling shipped, awaiting first run"}
                </div>
                {structuredSourcesPopulated() ? (
                  <>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: "var(--ink-2)",
                        maxWidth: "72ch",
                        margin: "0 0 12px 0",
                      }}
                    >
                      Field-by-field verification for structured
                      sources. AEMS reaction counts are re-queried
                      against the openFDA{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>drug/event</code>{" "}
                      endpoint and compared to the count in the LLM-
                      extracted title within a ±5 or ±10 percent
                      tolerance (whichever is larger; AEMS data
                      updates continuously). Open Targets attributions
                      are verified by re-fetching the drug record
                      through the OT GraphQL{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>drug(chemblId)</code>{" "}
                      query and confirming the claimed target appears
                      in the{" "}
                      <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>linkedTargets</code>{" "}
                      list.
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: 14,
                        margin: "0 0 18px 0",
                        padding: "14px 16px",
                        border: "1px solid var(--rule)",
                        background: "var(--surface)",
                      }}
                    >
                      {[
                        { label: "Total rows audited", value: STRUCTURED_SOURCES_SNAPSHOT.summary.total.toString() },
                        ...Object.entries(STRUCTURED_SOURCES_SNAPSHOT.summary.by_status).map(([status, n]) => ({
                          label: status.replace(/_/g, " "),
                          value: n.toString(),
                        })),
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
                            {label}
                          </div>
                          <div className="font-heading" style={{ fontSize: "1.3rem", fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: "var(--ink-2)",
                      maxWidth: "72ch",
                      margin: "0 0 18px 0",
                    }}
                  >
                    Field-by-field verification for structured sources
                    (AEMS reaction counts; Open Targets target
                    attributions). AEMS counts will be re-queried
                    against the openFDA{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>drug/event</code>{" "}
                    endpoint and compared to the count in the LLM-
                    extracted title. Open Targets target claims will
                    be verified through the OT GraphQL{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>drug(chemblId)</code>{" "}
                    query against the{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>linkedTargets</code>{" "}
                    list. Tooling shipped as{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/verify-structured-sources.py</code>;
                    this block switches to live numbers the moment{" "}
                    <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>lib/structured-sources-audit-snapshot.json</code>{" "}
                    is populated.
                  </p>
                )}

                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  What Phase 3 will add later
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    maxWidth: "72ch",
                  }}
                >
                  {[
                    {
                      head: "Count of references blocked at publish time.",
                      tail: "Once Phase 3 prompt hardening lands, this disclosure surfaces how many references the LLM proposed that failed the Phase 1 manifest check and were therefore stripped before publish, instead of the audit reporting on the pre-verified manifest only.",
                    },
                  ].map((item) => (
                    <li
                      key={item.head}
                      style={{
                        position: "relative",
                        paddingLeft: 22,
                        marginBottom: 10,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "var(--ink-2)",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          color: "var(--green-mid)",
                          fontWeight: 600,
                        }}
                      >
                        &rsaquo;
                      </span>
                      <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                        {item.head}
                      </strong>{" "}
                      {item.tail}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Literature anchor
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  Bhattacharyya et al. 2023 (Cureus,{" "}
                  <a
                    href="https://doi.org/10.7759/cureus.39238"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    doi:10.7759/cureus.39238
                  </a>
                  ) examined 115 references across 30 ChatGPT-generated
                  medical papers and found 47 percent fully fabricated, 46
                  percent authentic but with bibliographic errors, and
                  only 7 percent authentic and accurate; Gravel,
                  D&apos;Amours-Gravel &amp; Osmanlliu 2023 (Mayo Clin Proc
                  Digit Health,{" "}
                  <a
                    href="https://doi.org/10.1016/j.mcpdig.2023.05.004"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    doi:10.1016/j.mcpdig.2023.05.004
                  </a>
                  ) reported the same pattern across a separate medical
                  question set. WHBench (Maurya, Saboo &amp; Kumar 2026,{" "}
                  <a
                    href="https://arxiv.org/abs/2604.00024"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={LINK}
                  >
                    arXiv:2604.00024
                  </a>
                  ) documents the broader pattern of frontier LLMs
                  producing confident structured output with systematic
                  failure modes. Path C&apos;s three phases each target a
                  specific failure surface within Whel&apos;s pipeline
                  rather than attempting to address the LLM gap in
                  aggregate.
                </p>
              </div>

              <div>
                <div
                  style={{
                    ...MONO,
                    fontSize: "10.5px",
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--green-deep)",
                    marginBottom: 8,
                  }}
                >
                  Where this lives in the project
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "72ch", margin: 0 }}>
                  Recorded in the methodology revision history at v3.6
                  (definition), v3.7 (manual audit prototype), v3.8 (Phase
                  1 live for the hand-written manifest), v3.9 (Phase 1
                  tooling for the database-sources audit), v3.10 (Phase
                  1 first database-sources run), and v3.11 (OT-DRUGNAME
                  backfill closing the v3.10 architectural-debt finding).
                  Full revision history at{" "}
                  the methodology changelog
                  . Phase 1 is now a Live register row on the Roadmap as
                  &ldquo;Citation validation and summary grounding (Path
                  C);&rdquo; Phase 2 (sentence-level summary grounding
                  via Sentence-BERT) and Phase 3 (prompt hardening that
                  forbids citation generation outside the Phase 1
                  manifest) remain Planned. The structured fields above
                  carry real audit numbers for Phase 1 and will populate
                  the remaining fields when Phase 2 and Phase 3 ship.
                  Path C is distinct from Path A (ontology-grounded
                  entity resolution) and Path B (knowledge-graph
                  grounding), which are documented in
                  section 01c above. Path A and Path B ground the
                  LLM&apos;s inputs; Path C validates the LLM&apos;s
                  outputs.
                </p>
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* ── 01 · Independent cross-references ────────────────────────────── */}
      <section id="cross-references" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="04 · Independent cross-references"
            title="Every Cure and the MATRIX dataset"
            intro="Whel's most direct counterpart in drug repurposing is Every Cure, a nonprofit dedicated to systematic re-evaluation of approved drugs across all of disease. Its core dataset, MATRIX, is the largest public source of machine-learned biological-plausibility scores in the field, and Whel surfaces those scores as an independent layer beside its own grades wherever they have coverage."
          />

          {/* Featured Every Cure card — two columns: prose left, stats right */}
          <div
            style={{
              ...CARD,
              borderLeft: "3px solid var(--green-deep)",
              padding: "clamp(24px, 3vw, 36px)",
              gap: "clamp(24px, 3vw, 40px)",
            }}
            className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr]"
          >
            {/* Left: prose + read-more */}
            <div>
              <div
                style={{
                  ...MONO,
                  fontSize: "10.5px",
                  fontWeight: 500,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--green-deep)",
                  marginBottom: 12,
                }}
              >
                Featured · Every Cure
              </div>
              <p
                className="font-heading"
                style={{
                  fontSize: "clamp(1.2rem, 2vw, 1.5rem)",
                  fontWeight: 500,
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  marginBottom: 14,
                }}
              >
                Predicted treatment probabilities for around 39.5 million drug-disease pairs.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: "var(--ink-2)" }}>
                  <a href="https://www.everycure.org/" target="_blank" rel="noopener noreferrer" style={LINK}>Every Cure</a>{" "}
                  is a nonprofit founded in 2022 by physicians David Fajgenbaum and Grant Mitchell, with Tracey Sikora, to identify new uses for already-approved drugs. Its core work is funded by an ARPA-H program also called MATRIX, which awarded Every Cure{" "}
                  <a href="https://arpa-h.gov/news-and-events/arpa-h-awards-ai-driven-project-repurpose-approved-medications" target="_blank" rel="noopener noreferrer" style={LINK}>$48.3M in Phase 1</a>{" "}
                  and up to{" "}
                  <a href="https://everycure.org/phase2/" target="_blank" rel="noopener noreferrer" style={LINK}>$76M in Phase 2</a>, by a{" "}
                  <a href="https://www.audaciousproject.org/grantees/every-cure" target="_blank" rel="noopener noreferrer" style={LINK}>TED Audacious Project</a>{" "}
                  grant, and through a research collaboration with{" "}
                  <a href="https://everycure.org/every-cure-expands-collaboration-with-google-cloud-to-transform-ai-driven-drug-repurposing/" target="_blank" rel="noopener noreferrer" style={LINK}>Google Cloud</a>.
                </p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: "var(--ink-2)" }}>
                  The{" "}
                  <a href="https://huggingface.co/datasets/everycure/matrix-scores" target="_blank" rel="noopener noreferrer" style={LINK}>matrix-scores dataset</a>{" "}
                  is a public release of those predictions on Hugging Face. It covers roughly 1,800 drugs paired against roughly 22,000 diseases, with a machine-learned treatment-probability score for each pair derived from a biomedical knowledge graph.
                </p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: "var(--ink-2)" }}>
                  MATRIX and Whel are not doing the same thing. MATRIX provides a model-based estimate of how plausible a drug-disease link looks given the structure of biomedical knowledge. Whel reads the current clinical literature, trial registries, adverse-event reports, target databases, and named community forums for a specific set of under-researched women&apos;s health conditions, and grades the evidence it finds. Where MATRIX has coverage of a Whel pair, the MATRIX score will appear alongside the Whel grade so a reader can see both.
                </p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: "var(--ink-2)" }}>
                  One thing worth noting about the difference: MATRIX collapses many evidence streams into a single plausibility score. Whel does not. Each Whel signal stays labeled with the source arm it came from, and where two or more arms independently support the same compound-condition pair, that overlap is surfaced as a cross-arm concordance flag. The flag is currently a planned display element rather than a tier change. The{" "}
                  <Link href="/about/roadmap" style={LINK}>roadmap</Link>{" "}
                  has the current status.
                </p>
              </div>
              <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: "10px 22px" }}>
                <a
                  href="https://www.everycure.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...MONO,
                    fontSize: "12px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--ink)",
                    borderBottom: "1px solid var(--ink)",
                    paddingBottom: 2,
                  }}
                >
                  Every Cure →
                </a>
                <a
                  href="https://huggingface.co/datasets/everycure/matrix-scores"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...MONO,
                    fontSize: "12px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--green-mid)",
                  }}
                >
                  matrix-scores on Hugging Face →
                </a>
              </div>
            </div>

            {/* Right: stats panel */}
            <div
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--rule)",
                padding: "20px 20px 22px",
                alignSelf: "start",
              }}
            >
              <div
                style={{
                  ...MONO,
                  fontSize: "10.5px",
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 14,
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                At a glance
              </div>
              <dl style={{ margin: 0 }}>
                {EVERYCURE_STATS.map((s, i) => (
                  <div
                    key={s.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 12,
                      alignItems: "baseline",
                      padding: "9px 0",
                      borderBottom: i < EVERYCURE_STATS.length - 1 ? "1px dashed var(--rule)" : "none",
                    }}
                  >
                    <dt
                      style={{
                        ...MONO,
                        fontSize: "10.5px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                      }}
                    >
                      {s.label}
                    </dt>
                    <dd
                      style={{
                        margin: 0,
                        fontSize: "12.5px",
                        color: "var(--ink)",
                        fontWeight: 500,
                        textAlign: "right",
                      }}
                    >
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── Banner — what Whel does that MATRIX doesn't ──────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
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
              What Whel does that MATRIX does not
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
              Whel reads the actual clinical evidence base for specific compound-condition pairs in
              women&apos;s hormonal and reproductive health.
            </p>
            <p style={{ fontSize: "14.5px", lineHeight: 1.62, color: "rgba(251,248,241,0.78)", maxWidth: "74ch" }}>
              MATRIX is a model that predicts treatment probability from a knowledge graph. It does not
              read the clinical literature for any specific condition, and it is not condition-specific.
              Whel does the opposite: a narrow set of women&apos;s health conditions, each one read closely
              across published research, trials, adverse-event data, target evidence, and named patient
              communities, with every signal scored individually. The two outputs are different enough
              that Whel shows MATRIX scores beside its own grades wherever MATRIX has coverage, instead
              of folding them together.
            </p>
            <p
              style={{
                ...MONO,
                fontSize: "11.5px",
                letterSpacing: "0.06em",
                color: "rgba(251,248,241,0.62)",
                marginTop: 18,
                maxWidth: "74ch",
              }}
            >
              Coverage audited {MATRIX_AUDIT_SNAPSHOT._meta.audit_date ?? "—"}.{" "}
              <a
                href="#coverage-disclosure"
                style={{
                  color: "var(--green-soft)",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Headline numbers and per-condition breakdown below ↓
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── 01b · Coverage disclosure ────────────────────────────────────── */}
      <section id="coverage-disclosure" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="05 · Coverage disclosure"
            title="How much of Whel sits inside MATRIX"
            intro="Because Whel surfaces MATRIX scores as an independent layer rather than blending them into its own grades, the honest question is how much of Whel's universe MATRIX actually covers. The numbers below come from an audit script that joins Whel's active compound–condition pairs against the published MATRIX dataset. Raw, adjusted, and per-condition figures are all shown so readers can decide for themselves which denominator is fair. Per-pair scores from the same audit are also surfaced on each condition page beside the L-grade chip, so a reader can see MATRIX's biological-plausibility score for any individual compound–condition pair where MATRIX has coverage, not just the aggregate."
          />

          {/* Plain-English explainer for what MATRIX's two numbers mean,
              grounded in Every Cure's own dataset-card definitions. Sits
              between the SectionHeader and the audit headline tiles so any
              reader landing here (including via the MATRIX chip click on a
              signal card) finds the scale described before they encounter
              the numeric tiles below. Includes the Every Cure 'research use
              only' disclaimer verbatim so any reader sees it before any
              numbers. */}
          <div
            style={{
              ...CARD,
              padding: "clamp(20px, 2.5vw, 28px)",
              borderLeft: "3px solid var(--green-mid)",
              marginBottom: 32,
            }}
          >
            <div style={{ ...EYEBROW, color: "var(--green-mid)", marginBottom: 12 }}>
              How to read these numbers
            </div>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.7,
                color: "var(--ink-2)",
                maxWidth: "72ch",
                margin: 0,
              }}
            >
              MATRIX returns two values per scored drug&ndash;disease pair,
              and Whel surfaces both. Per Every Cure&apos;s own dataset
              documentation on{" "}
              <a
                href="https://huggingface.co/datasets/everycure/matrix-scores"
                target="_blank"
                rel="noopener noreferrer"
                style={LINK}
              >
                Hugging Face
              </a>
              , both values are model predictions of treatment probability,
              not clinical claims.
            </p>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.7,
                color: "var(--ink-2)",
                maxWidth: "72ch",
                margin: "14px 0 0 0",
              }}
            >
              The{" "}
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                transformed score
              </strong>{" "}
              is MATRIX&apos;s prediction of treatment probability. Every
              Cure trained their model on a biomedical knowledge graph (drug
              targets, disease pathways, gene associations, and the set of
              already-validated drug&ndash;disease treatments) and the model
              learned to recognize the structural features that distinguish
              pairs that are real treatments from pairs that are not. The
              transformed score combines that raw treatment-probability with
              the pair&apos;s rank inside the drug&apos;s other predictions
              and inside the disease&apos;s other predictions, so it surfaces
              pairs that look like treatments both globally and in context.
              In the audit run summarized below it ranges roughly 3.0 to
              4.5, with higher meaning MATRIX gives the pair a higher
              treatment-probability.
            </p>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.7,
                color: "var(--ink-2)",
                maxWidth: "72ch",
                margin: "14px 0 0 0",
              }}
            >
              The{" "}
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                quantile rank
              </strong>
              , shown on each signal card as &ldquo;Top N%&rdquo;, is
              MATRIX&apos;s own percentile across all of its predictions
              (roughly 39.5 million drug&ndash;disease pairs). A pair shown
              as &ldquo;Top 8%&rdquo; means MATRIX assigned this
              drug&ndash;disease pair a higher treatment-probability than
              ninety-two percent of every drug&ndash;disease pair its model
              has scored across the biomedical knowledge graph.
            </p>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.7,
                color: "var(--ink-2)",
                maxWidth: "72ch",
                margin: "14px 0 0 0",
              }}
            >
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                What &ldquo;Top N%&rdquo; does and does not say.
              </strong>{" "}
              A high MATRIX score is a graph-based plausibility signal:
              MATRIX&apos;s model thinks the structural features of this
              drug&ndash;disease pair look like the structural features of
              pairs that turned out to be real treatments. It is not a
              clinical recommendation. It is not a confirmation that the
              drug treats the disease. It is not a statement that the pair
              is being investigated or that the pair is rare. Every Cure
              makes the limit explicit in their own dataset card, and we
              quote them verbatim: &ldquo;These scores are the output of a
              computational research pipeline and do not constitute medical
              advice, clinical recommendations, or endorsement of any drug
              for any use. All findings require independent scientific and
              clinical validation before any clinical application.&rdquo;
            </p>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.7,
                color: "var(--ink-2)",
                maxWidth: "72ch",
                margin: "14px 0 0 0",
              }}
            >
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                Why Whel surfaces this anyway.
              </strong>{" "}
              MATRIX is independent of Whel&apos;s literature pipeline.
              MATRIX reads no papers; it predicts treatment plausibility
              from the structure of a biomedical knowledge graph. Whel reads
              published literature, trial registries, adverse-event data,
              target databases, and patient communities, and scores each
              signal against a five-dimension rubric. When the two layers
              agree on a pair (Whel finds literature support for the use,
              AND MATRIX assigns the pair a high treatment-probability),
              that is two methodologically different approaches arriving at
              the same hypothesis. The fact that most of Whel&apos;s matched
              pairs land in MATRIX&apos;s top eight percent or so is the
              kind of structural agreement an independent disclosure layer
              is supposed to provide.
            </p>
            <p
              style={{
                ...MONO,
                fontSize: 11.5,
                lineHeight: 1.6,
                color: "var(--muted)",
                maxWidth: "72ch",
                margin: "16px 0 0 0",
              }}
            >
              Raw transformed scores are kept in the chip tooltip and in the
              full audit numbers below for readers who want the underlying
              value.
            </p>
          </div>

          {(() => {
            const snap = MATRIX_AUDIT_SNAPSHOT;
            const pct = (v: number | null) =>
              v == null ? "—" : `${(v * 100).toFixed(1)}%`;
            const num = (v: number | null) =>
              v == null ? "—" : v.toLocaleString();
            const trueFalse = (v: boolean | null) =>
              v === null ? <em style={{ color: "var(--muted)" }}>n/a</em> : v ? "True" : "False";

            if (!matrixSnapshotPopulated()) {
              return (
                <div
                  style={{
                    ...CARD,
                    padding: "clamp(20px, 2.5vw, 28px)",
                    borderLeft: "3px solid var(--muted)",
                  }}
                >
                  <div
                    style={{
                      ...MONO,
                      fontSize: "10.5px",
                      fontWeight: 500,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 10,
                    }}
                  >
                    Audit pending
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-2)", margin: 0 }}>
                    The MATRIX coverage audit has not been run since this disclosure block was
                    wired in. Published numbers will appear here once{" "}
                    <code style={{ ...MONO, fontSize: "0.92em" }}>
                      scripts/check-matrix-coverage.py
                    </code>{" "}
                    next completes a clean run and writes its snapshot back to{" "}
                    <code style={{ ...MONO, fontSize: "0.92em" }}>
                      lib/matrix-audit-snapshot.json
                    </code>
                    .
                  </p>
                </div>
              );
            }

            const tiles: { label: string; value: string; sub?: string }[] = [
              {
                label: "Compound match rate (adjusted)",
                value: pct(snap.headline.compound_match_rate_adjusted),
                sub: `${num(snap.headline.compounds_eligible_matched)} of ${num(
                  snap.headline.compounds_eligible_total,
                )} eligible compounds`,
              },
              {
                label: "Pairs with a MATRIX score",
                value: num(snap.headline.pairs_with_matrix_score),
                sub: `${pct(
                  snap.headline.coverage_rate_over_eligible_adjusted,
                )} of ${num(snap.headline.eligible_pairs_adjusted)} eligible pairs`,
              },
              {
                label: "Active Whel pairs (raw)",
                value: num(snap.headline.active_pairs),
                sub: "Before excluding class labels and non-drug items",
              },
              {
                label: "Rescued by brand-name dictionary",
                value: num(snap.headline.compounds_rescued_by_brand_dict),
                sub: "Compounds matched only via the Whel brand→generic crosswalk",
              },
            ];

            return (
              <>
                {/* Headline tiles */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                  style={{ gap: 14, marginBottom: 32 }}
                >
                  {tiles.map((t) => (
                    <div
                      key={t.label}
                      style={{
                        ...CARD,
                        padding: "18px 18px 20px",
                        borderLeft: "3px solid var(--green-mid)",
                      }}
                    >
                      <div
                        style={{
                          ...MONO,
                          fontSize: "10.5px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                          marginBottom: 10,
                          lineHeight: 1.35,
                        }}
                      >
                        {t.label}
                      </div>
                      <div
                        className="font-heading"
                        style={{
                          fontSize: "clamp(1.5rem, 2.4vw, 1.85rem)",
                          fontWeight: 500,
                          lineHeight: 1.05,
                          letterSpacing: "-0.01em",
                          color: "var(--ink)",
                        }}
                      >
                        {t.value}
                      </div>
                      {t.sub && (
                        <div
                          style={{
                            fontSize: 12.5,
                            lineHeight: 1.5,
                            color: "var(--ink-2)",
                            marginTop: 8,
                          }}
                        >
                          {t.sub}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Per-condition coverage table */}
                <div style={{ marginBottom: 30 }}>
                  <div
                    style={{
                      ...EYEBROW,
                      marginBottom: 12,
                    }}
                  >
                    Per condition
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {[
                            ["Condition", "34%"],
                            ["MONDO", "22%"],
                            ["Official MATRIX filter¹", "24%"],
                            ["Predictions in audit", "20%"],
                          ].map(([h, w], i) => (
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
                                width: w,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {snap.per_condition.map((row) => {
                          const hasNote = Boolean(row.note);
                          // When a note follows, the data row's bottom border
                          // is suppressed so the row + note read as one block.
                          const dataBorder = hasNote
                            ? "1px solid transparent"
                            : "1px solid var(--rule)";
                          return (
                            <Fragment key={row.condition}>
                              <tr>
                                <td
                                  style={{
                                    padding: "13px 14px 13px 0",
                                    borderBottom: dataBorder,
                                    verticalAlign: "baseline",
                                    fontSize: 14.5,
                                    color: "var(--ink)",
                                  }}
                                >
                                  {row.condition}
                                </td>
                                <td
                                  style={{
                                    padding: "13px 14px",
                                    borderBottom: dataBorder,
                                    verticalAlign: "baseline",
                                    ...MONO,
                                    fontSize: 12.5,
                                    color: "var(--ink-2)",
                                  }}
                                >
                                  {row.mondo}
                                </td>
                                <td
                                  style={{
                                    padding: "13px 14px",
                                    borderBottom: dataBorder,
                                    verticalAlign: "baseline",
                                    fontSize: 14,
                                    color: "var(--ink-2)",
                                  }}
                                >
                                  {trueFalse(row.matrix_official_filter)}
                                </td>
                                <td
                                  style={{
                                    padding: "13px 14px",
                                    borderBottom: dataBorder,
                                    verticalAlign: "baseline",
                                    ...MONO,
                                    fontSize: 13,
                                    color: "var(--ink)",
                                  }}
                                >
                                  {num(row.predictions_in_audit)}
                                </td>
                              </tr>
                              {hasNote && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    style={{
                                      padding: "0 14px 16px 14px",
                                      borderBottom: "1px solid var(--rule)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        borderLeft: "2px solid var(--rule-strong)",
                                        paddingLeft: 14,
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        color: "var(--ink-2)",
                                        maxWidth: "72ch",
                                      }}
                                    >
                                      <span
                                        style={{
                                          ...MONO,
                                          fontSize: "9.5px",
                                          letterSpacing: "0.14em",
                                          textTransform: "uppercase",
                                          color: "var(--muted)",
                                          marginRight: 8,
                                        }}
                                      >
                                        Note
                                      </span>
                                      {row.note}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p
                    style={{
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "var(--muted)",
                      marginTop: 12,
                      maxWidth: "72ch",
                    }}
                  >
                    ¹ Whether the condition sits inside MATRIX&apos;s own official disease filter.
                    This flag is intent, not a gate: predictions can still be present for
                    conditions outside the official filter, and absent for conditions inside it.
                  </p>
                </div>

                {/* What we take from this */}
                <div
                  style={{
                    ...CARD,
                    padding: "clamp(20px, 2.5vw, 28px)",
                    borderLeft: "3px solid var(--green-deep)",
                    marginBottom: 32,
                  }}
                >
                  <div
                    style={{
                      ...EYEBROW,
                      color: "var(--green-deep)",
                      marginBottom: 12,
                    }}
                  >
                    Reading the numbers
                  </div>
                  <h3
                    className="font-heading"
                    style={{
                      fontSize: "clamp(1.25rem, 2.2vw, 1.55rem)",
                      fontWeight: 500,
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                      color: "var(--ink)",
                      margin: "0 0 14px 0",
                    }}
                  >
                    What we take from this
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.68,
                      color: "var(--ink-2)",
                      maxWidth: "72ch",
                      margin: "0 0 16px 0",
                    }}
                  >
                    Whel covers a small set of women&apos;s health conditions; MATRIX is a
                    general-purpose drug-repurposing graph trained across the whole disease
                    space. An 85.7% adjusted compound match rate is high for that kind of
                    cross-reference, and when both sides of a Whel pair exist in MATRIX,
                    MATRIX has a published score for that pair 83.0% of the time.
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.68,
                      color: "var(--ink-2)",
                      maxWidth: "72ch",
                      margin: "0 0 14px 0",
                    }}
                  >
                    The asymmetries in the per-condition table are the most informative result.
                    MATRIX&apos;s official disease filter and what its model actually produces
                    don&apos;t line up cleanly, in both directions. That mismatch is the
                    central reason the two layers stay separated rather than blended:
                  </p>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: "0 0 16px 0",
                      maxWidth: "72ch",
                    }}
                  >
                    {[
                      {
                        head: "PMDD: 0 predictions despite being inside MATRIX's filter.",
                        tail: "MATRIX scopes PMDD as in-scope but its model produced no scores for it. A blended grade would silently penalise every PMDD compound for a MATRIX gap that has nothing to do with the evidence.",
                      },
                      {
                        head: "Endometriosis: 38 predictions despite being outside MATRIX's filter.",
                        tail: "MATRIX returns useful scores here even though Endometriosis isn't in its official disease list. Surfacing those scores is exactly what the disclosure layer is for.",
                      },
                      {
                        head: "24 compounds matched only via the brand and synonym dictionary.",
                        tail: "Without the brand-to-generic, INN-variant, salt-form, and formulation-qualifier translations the crosswalk applies (section 05), roughly 29% of matched compounds would have been missed. The translation step is explicit and auditable.",
                      },
                      {
                        head: "17 class labels and 21 non-drug entries excluded from the denominator.",
                        tail: "Umbrella categories like 'GLP-1 RAs' and supplements like 'Magnesium' can't be looked up in MATRIX the way individual drugs can. Excluding them is what the word 'adjusted' is doing in the 85.7% headline.",
                      },
                    ].map((item) => (
                      <li
                        key={item.head}
                        style={{
                          position: "relative",
                          paddingLeft: 22,
                          marginBottom: 12,
                          fontSize: 14.5,
                          lineHeight: 1.6,
                          color: "var(--ink-2)",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            color: "var(--green-mid)",
                            fontWeight: 600,
                          }}
                        >
                          ›
                        </span>
                        <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                          {item.head}
                        </strong>{" "}
                        {item.tail}
                      </li>
                    ))}
                  </ul>
                  <p
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.65,
                      color: "var(--ink-2)",
                      maxWidth: "72ch",
                      margin: 0,
                    }}
                  >
                    Net: MATRIX gives Whel a strong, audited cross-reference for most of its
                    universe, with two informative gaps and a documented set of exclusions.
                    That&apos;s the right shape for an independent layer.
                  </p>
                </div>

                {/* What this says about Whel */}
                <div
                  style={{
                    ...CARD,
                    padding: "clamp(20px, 2.5vw, 28px)",
                    borderLeft: "3px solid var(--green-mid)",
                    marginBottom: 32,
                  }}
                >
                  <div
                    style={{
                      ...EYEBROW,
                      color: "var(--green-mid)",
                      marginBottom: 12,
                    }}
                  >
                    The other direction
                  </div>
                  <h3
                    className="font-heading"
                    style={{
                      fontSize: "clamp(1.25rem, 2.2vw, 1.55rem)",
                      fontWeight: 500,
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                      color: "var(--ink)",
                      margin: "0 0 14px 0",
                    }}
                  >
                    What this says about Whel
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.68,
                      color: "var(--ink-2)",
                      maxWidth: "72ch",
                      margin: "0 0 16px 0",
                    }}
                  >
                    The audit isn&apos;t only a measurement of MATRIX. It&apos;s also a clean
                    test of whether Whel&apos;s conditions and compounds speak the standard
                    biomedical language the rest of the field uses, and where Whel covers
                    clinical ground a general-purpose drug-repurposing model doesn&apos;t.
                    Four specific things the comparison reinforces:
                  </p>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: "0 0 16px 0",
                      maxWidth: "72ch",
                    }}
                  >
                    {[
                      {
                        head: "All six conditions confirmed as exact MONDO matches.",
                        tail: "Whel's disease definitions resolve to standard ontology entries the broader literature already indexes: PCOS, PMDD, Adenomyosis, Endometriosis, Vulvodynia, Perimenopause & Menopause. No in-house labels, no silent drift.",
                      },
                      {
                        head: "Whel's compound vocabulary maps cleanly into standard CURIE space.",
                        tail: "85.7% of eligible compounds resolve into the CHEBI / UNII / DrugBank identifier system MATRIX uses. For a niche women's-health subset that is a high crosswalk rate, and it indicates Whel's drug layer is not running on a parallel vocabulary from the rest of pharmacology.",
                      },
                      {
                        head: "Whel covers conditions where MATRIX is silent.",
                        tail: "PMDD sits inside MATRIX's official disease filter, yet MATRIX's model produced no predictions for it. Whel has graded, source-anchored signals for PMDD that cover ground a general-purpose model did not.",
                      },
                      {
                        head: "The brand and synonym dictionary is Whel's contribution back.",
                        tail: "24 of the 84 matched compounds were recoverable only via Whel's brand-to-generic and INN-variant translations (section 05). The crosswalk is versioned and auditable, and its size and composition are reported on this page; the individual entries are shared on request, since they name compounds in the gated index.",
                      },
                    ].map((item) => (
                      <li
                        key={item.head}
                        style={{
                          position: "relative",
                          paddingLeft: 22,
                          marginBottom: 12,
                          fontSize: 14.5,
                          lineHeight: 1.6,
                          color: "var(--ink-2)",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            color: "var(--green-mid)",
                            fontWeight: 600,
                          }}
                        >
                          ›
                        </span>
                        <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                          {item.head}
                        </strong>{" "}
                        {item.tail}
                      </li>
                    ))}
                  </ul>
                  <p
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.65,
                      color: "var(--ink-2)",
                      maxWidth: "72ch",
                      margin: 0,
                    }}
                  >
                    Scope of the claim: the audit measures structural alignment between
                    Whel and MATRIX, not the validity of Whel&apos;s grades. MATRIX scores
                    are model probabilities and Whel grades are literature tiers; the two
                    are not interchangeable as ground truth. The numbers above establish
                    that Whel&apos;s identifiers resolve into the standard biomedical
                    ontologies MATRIX uses, and that Whel&apos;s coverage includes
                    condition–compound pairs MATRIX leaves unscored.
                  </p>
                </div>

                {/* Score distribution */}
                {snap.score_distribution.n != null && (
                  <div style={{ marginBottom: 30 }}>
                    <div style={{ ...EYEBROW, marginBottom: 12 }}>Score distribution</div>
                    <div
                      style={{
                        ...CARD,
                        padding: "16px 18px",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                        gap: "14px 18px",
                      }}
                    >
                      {[
                        ["n", num(snap.score_distribution.n)],
                        ["min", snap.score_distribution.min?.toFixed(3) ?? "—"],
                        ["p25", snap.score_distribution.p25?.toFixed(3) ?? "—"],
                        ["median", snap.score_distribution.median?.toFixed(3) ?? "—"],
                        ["p75", snap.score_distribution.p75?.toFixed(3) ?? "—"],
                        ["max", snap.score_distribution.max?.toFixed(3) ?? "—"],
                        ["mean", snap.score_distribution.mean?.toFixed(3) ?? "—"],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div
                            style={{
                              ...MONO,
                              fontSize: "10px",
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                              color: "var(--muted)",
                              marginBottom: 4,
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              ...MONO,
                              fontSize: 15,
                              color: "var(--ink)",
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dataset snapshot */}
                <div>
                  <div style={{ ...EYEBROW, marginBottom: 12 }}>Dataset snapshot</div>
                  <div
                    style={{
                      ...CARD,
                      padding: "16px 18px",
                    }}
                  >
                    {Object.entries(snap.dataset_snapshot).map(([key, entry], i, arr) => (
                      <div
                        key={key}
                        className="stack-640"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(140px, 1fr) minmax(0, 2fr) minmax(0, 1.2fr)",
                          gap: 16,
                          padding: "10px 0",
                          borderBottom:
                            i < arr.length - 1 ? "1px solid var(--rule)" : "none",
                          alignItems: "baseline",
                        }}
                      >
                        <div style={{ ...MONO, fontSize: 12.5, color: "var(--ink)" }}>
                          {key}
                        </div>
                        <a
                          href={`https://huggingface.co/datasets/${entry.repo}/commit/${entry.sha ?? ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...MONO, ...LINK, fontSize: 12.5, wordBreak: "break-all" }}
                        >
                          {entry.sha ? entry.sha.slice(0, 12) : "—"}
                        </a>
                        <div style={{ ...MONO, fontSize: 12, color: "var(--ink-2)" }}>
                          {entry.last_modified
                            ? entry.last_modified.replace("T", " ").replace(/\.\d+/, "").replace("Z", " UTC")
                            : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "var(--muted)",
                      marginTop: 14,
                      maxWidth: "72ch",
                    }}
                  >
                    Audit run: {snap._meta.audit_date ?? "—"} · Snapshot label:{" "}
                    <code style={{ ...MONO, fontSize: "0.92em" }}>{snap._meta.snapshot_label}</code>.
                    Raw report and reproducible script live at{" "}
                    <code style={{ ...MONO, fontSize: "0.92em" }}>
                      {snap._meta.audit_script}
                    </code>
                    .
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ── 01e · Sex-aware layer ────────────────────────────────────────── */}
      <section id="female-biology" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="06 · Female-biology layer"
            title="Sex-specific pharmacokinetics and cycle phase, grounded and cross-checked"
            intro="The differentiating layer of the substrate holds two female-biology facts as first-class, sourced rows rather than averaging them away: how a drug behaves differently in women (sex-specific pharmacokinetics), and how a treatment's effect depends on the menstrual-cycle phase. Both are seeded today for an initial set of compounds and surface beside the relevant signals in the gated view, never folded into the grade."
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: "74ch" }}>
            <div>
              <div style={{ ...MONO, fontSize: "10.5px", fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--green-deep)", marginBottom: 8 }}>
                What grounds it
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
                Every row carries a primary source. Per-drug facts come from the FDA drug label, the
                regulatory record, including the{" "}
                <a href="https://www.accessdata.fda.gov/drugsatfda_docs/label/2012/202611s000lbl.pdf" target="_blank" rel="noopener noreferrer" style={LINK}>mirabegron (Myrbetriq) label</a>{" "}
                and the{" "}
                <a href="https://www.accessdata.fda.gov/drugsatfda_docs/label/2004/21427lbl.pdf" target="_blank" rel="noopener noreferrer" style={LINK}>duloxetine (Cymbalta) label</a>.
                The curated literature provides the backbone and the cross-check:{" "}
                <a href="https://doi.org/10.1186/s13293-020-00308-5" target="_blank" rel="noopener noreferrer" style={LINK}>Zucker and Prendergast, Biology of Sex Differences 2020</a>,
                a dataset of 86 approved drugs in which 76 showed higher exposure or slower elimination
                in women, and the review by{" "}
                <a href="https://doi.org/10.2165/00003088-200948030-00001" target="_blank" rel="noopener noreferrer" style={LINK}>Soldin and Mattison, Clinical Pharmacokinetics 2009</a>.
                The sertraline entry additionally rests on Ronfeld et al., Clinical Pharmacokinetics 1997.
              </p>
            </div>

            <div>
              <div style={{ ...MONO, fontSize: "10.5px", fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--green-deep)", marginBottom: 8 }}>
                What the cross-check found
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
                The layer is seeded for an initial set of eight compounds. Two of the three rows first
                drawn from FDA labels, sertraline and mirabegron, are independently corroborated as
                women-higher in the Zucker and Prendergast dataset; the third, duloxetine, rests on its
                FDA label and is not in that dataset, with no contradiction. Citalopram appears in the
                dataset but is left out on purpose, because other pharmacokinetic studies disagree on its
                direction and magnitude. The remaining seeded compounds, fluoxetine, paroxetine,
                gabapentin, diazepam, and bupropion, are each listed as women-higher in that same curated
                source.
              </p>
            </div>

            <div>
              <div style={{ ...MONO, fontSize: "10.5px", fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--green-deep)", marginBottom: 8 }}>
                How it is shown
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
                Each sex-PK fact is held as a structured row with its parameter, direction, magnitude, and
                source, and surfaces as a sex-PK marker beside the candidate with the underlying facts in
                the evidence trail. It is shown beside the signal, never folded into its grade, the same
                posture as the MATRIX and knowledge-graph layers above.
              </p>
            </div>

            <div>
              <div style={{ ...MONO, fontSize: "10.5px", fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--green-deep)", marginBottom: 8 }}>
                Cycle-phase dependence
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
                The twin layer records where a treatment&rsquo;s effect depends on the menstrual-cycle phase,
                which matters most for PMDD, a condition defined by cyclical timing. It is seeded with the
                strongest-evidence cases: luteal-phase (intermittent) dosing of SSRIs for PMDD, fluoxetine,
                sertraline, and paroxetine CR (
                <a href="https://www.acog.org/clinical/clinical-guidance/clinical-practice-guideline/articles/2023/12/management-of-premenstrual-disorders" target="_blank" rel="noopener noreferrer" style={LINK}>ACOG Clinical Practice Guideline on PMDD, 2023</a>;
                each FDA-approved for PMDD), escitalopram, supported by a placebo-controlled RCT (
                <a href="https://pubmed.ncbi.nlm.nih.gov/18344730/" target="_blank" rel="noopener noreferrer" style={LINK}>Eriksson et al., 2008</a>), and
                drospirenone/ethinyl estradiol, whose continuous 24/4 regimen suppresses the luteal-phase
                symptom pathophysiology (
                <a href="https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/021676s020lbl.pdf" target="_blank" rel="noopener noreferrer" style={LINK}>FDA YAZ label</a>).
                The phase vocabulary follows the standard ovarian model (follicular, ovulatory, luteal,
                menstrual). The validation basis for this layer, for when validation work begins, is the
                Daily Record of Severity of Problems (DRSP), the FDA-recognized phase-tagged outcome
                instrument for PMDD, and the ISPMD methodological consensus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 03 · Planned integrations ────────────────────────────────────── */}
      <section id="under-review" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="07 · Under review"
            title="Where the external layer expands"
            intro="A second tier of resources sits under active review. Two kinds appear here. Some are data sources under review for inclusion in the pipelines, filling a gap the current arms either cannot reach (European adverse-event data, structured drug-target indications) or only reach indirectly. Others are independent validation layers shown beside a signal rather than built into it: the open biomedical knowledge graphs and models that lead the drug-repurposing field. Those validation layers are marked as not integrated into the core architecture, because they carry the field's male-default coverage that Whel exists to correct. Inclusion of any source is conditional on stable licensing, citable provenance, and the ability to round-trip every record from Whel back to its origin. The roadmap sets out the same split as a technical-architecture track and a validation-layer track."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SOURCES.filter((s) => s.status !== "Live").map((c) => (
              <div
                key={c.name}
                style={{
                  background: "var(--bg-2)",
                  border: "1px dashed var(--rule-strong)",
                  padding: "20px 20px 22px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    ...MONO,
                    alignSelf: "flex-start",
                    fontSize: "9.5px",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: STATUS_COLOR[c.status],
                    border: `1px solid ${STATUS_COLOR[c.status]}`,
                    padding: "3px 7px",
                    marginBottom: 14,
                  }}
                >
                  {c.status}
                </span>
                <p
                  className="font-heading"
                  style={{ fontSize: "16px", color: "var(--ink)", marginBottom: 8, lineHeight: 1.25 }}
                >
                  {c.name}
                </p>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink-2)", marginBottom: c.note ? 10 : 14, flex: 1 }}>
                  {c.role}
                </p>
                {c.note && (
                  <p
                    style={{
                      ...MONO,
                      fontSize: "10.5px",
                      lineHeight: 1.5,
                      letterSpacing: "0.04em",
                      color: "var(--muted-2)",
                      marginBottom: 14,
                    }}
                  >
                    {c.note}
                  </p>
                )}
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...MONO,
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--green-mid)",
                  }}
                >
                  Visit source →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 04 · Intentional exclusions ──────────────────────────────────── */}
      <section id="out-of-scope" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="08 · Out of scope"
            title="What Whel does not draw from"
            intro="Whel only cites records that are reachable upstream to a primary source. That single requirement rules out several categories of material an evidence aggregator could otherwise pull from. The list below explains which categories and why."
          />

          <div className="space-y-3">
            {EXCLUSIONS.map((p) => (
              <div
                key={p.title}
                style={{ ...CARD, borderLeft: "3px solid var(--muted-2)", padding: "22px 24px" }}
              >
                <p
                  className="font-heading"
                  style={{ fontSize: "17px", color: "var(--ink)", marginBottom: 7 }}
                >
                  {p.title}
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--ink-2)" }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 05 · Brand-name dictionary ───────────────────────────────────── */}
      <section id="crosswalk" style={{ borderBottom: "1px solid var(--rule)", scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="09 · Crosswalk transparency"
            title="Brand and synonym dictionary"
            intro="Whel&apos;s compound list sometimes uses brand strings, alternate INN spellings, salt forms, formulation or route qualifiers, or multi-ingredient combination strings, where the MATRIX drug-list keys on a single canonical name. A small brand-to-generic crosswalk is the only translation step the match applies; every other match is a direct name or synonym lookup against MATRIX. The crosswalk is versioned and reviewed, and the counts below record its size and composition by entry kind."
          />

          <details className="disclose-block" style={{ marginTop: 4 }}>
            <summary
              style={{
                ...MONO,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 18px",
                border: "1px solid var(--rule)",
                background: "var(--surface)",
                color: "var(--ink-2)",
              }}
              aria-label={`Open the brand and synonym dictionary, ${activeBrandCount()} active mappings`}
            >
              <span style={{ display: "block", minWidth: 0 }}>
                <span
                  className="font-heading"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "var(--ink)",
                    letterSpacing: 0,
                    textTransform: "none",
                    marginBottom: 6,
                  }}
                >
                  Open the dictionary
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    lineHeight: 1.5,
                    marginBottom: 4,
                  }}
                >
                  {activeBrandCount()} active mapping
                  {activeBrandCount() === 1 ? "" : "s"} · schema v
                  {BRAND_DICT_META.schema_version} · last reviewed{" "}
                  {BRAND_DICT_META.last_reviewed}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--muted-2)",
                    lineHeight: 1.5,
                  }}
                >
                  {(() => {
                    const k = countByKind();
                    const parts = [
                      ["brand", k.brand],
                      ["inn variant", k.inn_variant],
                      ["abbreviation", k.abbreviation],
                      ["salt form", k.salt_form],
                      ["formulation variant", k.formulation_variant],
                      ["combo", k.combo],
                    ] as const;
                    return parts
                      .filter(([, n]) => n > 0)
                      .map(([label, n]) => `${n} ${label}${n === 1 ? "" : "s"}`)
                      .join(" · ");
                  })()}
                </span>
              </span>
              <span
                className="disclose-chev"
                aria-hidden="true"
                style={{
                  ...MONO,
                  fontSize: "14px",
                  color: "var(--muted)",
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                ↓
              </span>
            </summary>

            <div style={{ marginTop: 18 }}>
              <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "70ch" }}>
                The crosswalk maps brand strings, INN spelling variants, salt forms, route and
                formulation qualifiers, and combination strings onto canonical compound names.
                Because those names are the candidates in the gated index, the individual entries
                are shared with researchers and partners on request rather than published here. The
                counts above record the crosswalk&apos;s size and composition.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* ── 06 · This page ───────────────────────────────────────────────── */}
      <section id="this-page" style={{ scrollMarginTop: 24 }}>
        <div className={SECTION_INNER}>
          <SectionHeader label="10 · This page" title="A living register" />

          <p style={{ fontSize: 15, lineHeight: 1.72, color: "var(--ink-2)", maxWidth: "68ch" }}>
            The external reference register is dated and will change. New resources are added when they meet
            the same standards as the existing ones: open or appropriately licensed, citable at a stable
            address, and capable of being round-tripped from Whel back to the source. Suggestions are
            welcome on the{" "}
            <Link href="/about/contact" style={LINK}>contact page</Link>.
          </p>

          <div
            style={{
              ...MONO,
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginTop: 28,
            }}
          >
            Register revised June 2026
          </div>

          <div
            style={{
              borderTop: "1px solid var(--rule)",
              marginTop: 20,
              paddingTop: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 32px",
            }}
          >
            {CONTINUE.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                style={{
                  ...MONO,
                  fontSize: "12px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: c.accent ? "var(--green-mid)" : "var(--ink)",
                  borderBottom: c.accent ? "none" : "1px solid var(--ink)",
                  paddingBottom: 2,
                }}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
