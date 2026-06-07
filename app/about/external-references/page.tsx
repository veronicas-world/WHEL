import Link from "next/link";
import { Fragment } from "react";
import {
  BRAND_DICT_ENTRIES,
  BRAND_DICT_META,
  activeBrandCount,
  countByKind,
} from "@/lib/brand-name-dictionary";
import {
  MATRIX_AUDIT_SNAPSHOT,
  isPopulated as matrixSnapshotPopulated,
} from "@/lib/matrix-audit-snapshot";

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
            label="01b · Coverage disclosure"
            title="How much of Whel sits inside MATRIX"
            intro="Because Whel surfaces MATRIX scores as an independent layer rather than blending them into its own grades, the honest question is how much of Whel's universe MATRIX actually covers. The numbers below come from an audit script that joins Whel's active compound–condition pairs against the published MATRIX dataset. Raw, adjusted, and per-condition figures are all shown so readers can decide for themselves which denominator is fair."
          />

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
                        tail: "Without the brand-to-generic, INN-variant, salt-form, and formulation-qualifier translations published in section 05, roughly 29% of matched compounds would have been missed. The translation step is explicit and auditable.",
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
                        tail: "24 of the 84 matched compounds were recoverable only via Whel's brand-to-generic and INN-variant translations (section 05). The dictionary is published openly on this same audit page and reusable by anyone doing similar cross-referencing.",
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

      {/* ── 05 · Brand-name dictionary ───────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="05 · Crosswalk transparency"
            title="Brand and synonym dictionary"
            intro="Whel&apos;s compound list sometimes uses brand strings (&ldquo;Wellbutrin&rdquo;), alternate INN spellings (&ldquo;paracetamol&rdquo; vs &ldquo;acetaminophen&rdquo;), salt forms (&ldquo;Clomiphene Citrate&rdquo;), formulation or route qualifiers (&ldquo;Testosterone (transdermal)&rdquo;), or multi-ingredient combo strings, where the MATRIX drug-list keys on a single canonical name. The dictionary below is the only translation step the crosswalk applies; every other match is a direct name or synonym lookup against MATRIX. The `kind` column records why each entry exists. The list stays short enough to audit at a glance."
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

            <div style={{ overflowX: "auto", marginTop: 18 }}>
              <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Source string", "Kind", "Resolves to", "DrugBank ID", "Note"].map((h, i) => (
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
                          width: ["26%", "11%", "17%", "12%", "34%"][i],
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BRAND_DICT_ENTRIES.map((e) => (
                    <tr key={e.brand}>
                      <td
                        className="font-heading"
                        style={{
                          fontSize: "14px",
                          color: "var(--ink)",
                          padding: "14px 14px 14px 0",
                          borderBottom: "1px solid var(--rule)",
                          verticalAlign: "baseline",
                        }}
                      >
                        {e.brand}
                      </td>
                      <td
                        style={{
                          ...MONO,
                          fontSize: "11px",
                          color: "var(--muted)",
                          padding: "14px 14px",
                          borderBottom: "1px solid var(--rule)",
                          verticalAlign: "baseline",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {e.kind.replace(/_/g, " ")}
                      </td>
                      <td
                        style={{
                          ...MONO,
                          fontSize: "12.5px",
                          color: e.generic ? "var(--ink-2)" : "var(--muted-2)",
                          padding: "14px 14px",
                          borderBottom: "1px solid var(--rule)",
                          verticalAlign: "baseline",
                        }}
                      >
                        {e.generic ?? "—"}
                      </td>
                      <td
                        style={{
                          ...MONO,
                          fontSize: "11.5px",
                          color: e.drugbank_id ? "var(--green-mid)" : "var(--muted-2)",
                          padding: "14px 14px",
                          borderBottom: "1px solid var(--rule)",
                          verticalAlign: "baseline",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {e.drugbank_id ? (
                          <a
                            href={`https://go.drugbank.com/drugs/${e.drugbank_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={LINK}
                          >
                            {e.drugbank_id}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        style={{
                          fontSize: "12.5px",
                          lineHeight: 1.55,
                          color: "var(--ink-2)",
                          padding: "14px 14px",
                          borderBottom: "1px solid var(--rule)",
                          verticalAlign: "baseline",
                        }}
                      >
                        {e.note}
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
              Rows with a dash in the &ldquo;Resolves to&rdquo; column exist
              for documentation purposes (e.g. medical-device combos) and do
              not contribute to MATRIX matches. Source file:{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                lib/brand-name-dictionary.json
              </code>
              .
            </p>
          </details>
        </div>
      </section>

      {/* ── 06 · This page ───────────────────────────────────────────────── */}
      <section>
        <div className={SECTION_INNER}>
          <SectionHeader label="06 · This page" title="A living register" />

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
