import Link from "next/link";

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
    status: "Under review",
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
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
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

      {/* ── 01 · Independent cross-references ────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="01 · Independent cross-references"
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
          </div>
        </div>
      </section>

      {/* ── 02 · Underlying data sources ─────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="02 · Underlying data"
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

      {/* ── 03 · Planned integrations ────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="03 · Under review"
            title="Where the external layer expands"
            intro="A second tier of resources is under active review for inclusion. Each fills a gap that the current pipelines either cannot reach (European adverse-event data, structured drug-target indications) or only reaches indirectly (cross-validation against an independent biological-plausibility model). Inclusion is conditional on stable licensing, citable provenance, and the ability to round-trip every record from Whel back to its source."
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
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink-2)", marginBottom: 14, flex: 1 }}>
                  {c.role}
                </p>
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
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="04 · Out of scope"
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

      {/* ── 05 · This page ───────────────────────────────────────────────── */}
      <section>
        <div className={SECTION_INNER}>
          <SectionHeader label="05 · This page" title="A living register" />

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
            Register revised May 2026
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
