import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Roadmap | Whel",
};

// Mirror the homepage's runtime-fetching posture so the "Now / Live today"
// signal count tracks the live database rather than freezing to a build-time
// value.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};

/* Pathway tag colours, reused from the arm / tier palette */
const PATHWAY_COLORS: Record<string, string> = {
  Estrogen: "var(--arm-community)",
  Inflammation: "var(--tier-emerging)",
  Pain: "var(--arm-direct)",
  Metabolic: "var(--green-mid)",
  Mood: "var(--arm-cross)",
};

/* ──────────────────────────────────────────────────────────────────────────
   Content
   ────────────────────────────────────────────────────────────────────────── */

function buildPhases(totalSignals: number): { tag: string; sub: string; color: string; items: string[] }[] {
  const signalsLine =
    totalSignals > 0
      ? `${totalSignals} signals, each scored against a published five-dimension rubric`
      : "Signals scored against a published five-dimension rubric";

  return [
    {
      tag: "Now",
      sub: "Live today",
      color: "var(--moss)",
      items: [
        "Six conditions in scope: endometriosis, PMDD, PCOS, adenomyosis, vulvodynia, and menopause",
        "Five evidence pipelines running across four research arms",
        signalsLine,
        "An independent biological-plausibility cross-reference from Every Cure's MATRIX model, shown beside our own grades rather than blended into them",
        "An external-validation grade on every drug and condition pair, with the highest grade reserved for signals backed by named clinical-guideline strength and certainty",
      ],
    },
    {
      tag: "Next",
      sub: "This work cycle",
      color: "var(--green-mid)",
      items: [
        "Run the two-rater validation study and publish the agreement score",
        "Add disproportionality statistics to the adverse-event arm so a real safety signal separates from reporting noise",
        "Flag where two or more arms support the same drug and condition pair",
        "Resolve every extracted drug and condition against canonical biomedical registries before it enters the database",
        "Add a knowledge-graph layer that informs scoring and shows, beside each signal, whether the graph supports it or stays silent",
        "Validate every generated citation and ground every summary sentence against its source",
        "Publish an open, citable data export",
      ],
    },
    {
      tag: "Later",
      sub: "Beyond the next release",
      color: "var(--muted)",
      items: [
        "Extend to further under-researched women's health conditions",
        "Add complementary pipelines once the existing ones are solid",
        "Deepen coverage of the conditions already in scope",
        "Extend the substrate to hold sex-specific pharmacokinetics and cyclical hormonal phase as first-class variables, so a relationship carries the body and the cycle phase it holds in rather than a single averaged value",
        "Add an independent validation layer of open knowledge graphs and models, such as DRKG, PrimeKG, and TxGNN, shown beside each signal as an outside cross-reference and kept separate from the core architecture",
        "Once the validation work above is in place, partner with formal women's health advocacy organizations, such as IAPMD, PCOS Challenge, and Endometriosis UK, to bring structured patient-reported signal beyond Reddit into the evidence base",
      ],
    },
  ];
}

const ORIENTATION_COPY: string[] = [
  "Whel is a research instrument: a structured, scored, searchable evidence base for the drug-repurposing signals that already exist across under-researched women's health conditions. We build the thing the field currently lacks, which is a single place where that evidence is gathered, graded, and made citable.",
  "The signal is scattered today across published literature, clinical-trial registries, adverse-event databases, genetic-target platforms, and patient communities. We bring it together, grade each piece against a published rubric, and attach its source so it can be checked. The result is closer to a small evidence lab than a website, and it serves the research community in several different ways.",
];

const AUDIENCES: { label: string; body: string }[] = [
  {
    label: "Researchers",
    body: "Scored, sourced repurposing hypotheses worth taking into a formal study.",
  },
  {
    label: "Clinician-researchers",
    body: "The state of the evidence for a condition: every signal and source, at a glance.",
  },
  {
    label: "Graduate students",
    body: "An open, fundable research question in a field with unclaimed ground.",
  },
  {
    label: "Journalists & advocates",
    body: "Traceable, scored evidence to ground reporting and advocacy in more than anecdote.",
  },
  {
    label: "Institutions & funders",
    body: "Where the evidence is thinnest, and where new attention would go furthest.",
  },
];

const CRITERIA: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Shared biology",
    body: "The six conditions converge on the same handful of systems: estrogen signaling, chronic inflammation, metabolic regulation, and pain processing. That biological overlap is what makes cross-condition reasoning valid, because a signal in one condition can be informative about the others.",
  },
  {
    n: "02",
    title: "Documented neglect",
    body: "Each condition carries a measurable evidence gap: long diagnostic delays, few treatments that address the underlying disease rather than the symptoms, and thin research funding. Whel is most useful exactly where the published literature is thinnest.",
  },
  {
    n: "03",
    title: "A focus on women",
    body: "Whel exists to address the structural under-study of women's hormonal and reproductive health, a field that, until the NIH Revitalization Act of 1993, did not even require women in clinical research. That focus is deliberate and permanent, and every condition we add will be a women's health condition.",
  },
];

const CONDITIONS: { name: string; pathways: string[]; gap: string }[] = [
  {
    name: "Endometriosis",
    pathways: ["Estrogen", "Inflammation", "Pain"],
    gap: "Affects up to 10% of women of reproductive age, with a 7 to 10 year average diagnostic delay and no disease-modifying drug.",
  },
  {
    name: "PMDD",
    pathways: ["Estrogen", "Mood", "Pain"],
    gap: "Clinically severe and cyclical, still treated mainly with imprecisely prescribed SSRIs.",
  },
  {
    name: "PCOS",
    pathways: ["Metabolic", "Estrogen", "Inflammation"],
    gap: "The most common endocrine disorder in women of reproductive age, and chronically under-represented in research.",
  },
  {
    name: "Adenomyosis",
    pathways: ["Estrogen", "Inflammation", "Pain"],
    gap: "Long under-recognized, and historically confirmable only after hysterectomy.",
  },
  {
    name: "Vulvodynia",
    pathways: ["Pain", "Inflammation"],
    gap: "A chronic pain condition, and among the least-studied of the six.",
  },
  {
    name: "Menopause",
    pathways: ["Estrogen", "Metabolic"],
    gap: "A transition every woman who lives long enough experiences, and widely acknowledged to be poorly managed.",
  },
];

const CANDIDATES: { name: string; pathways: string[]; body: string }[] = [
  {
    name: "Interstitial cystitis / bladder pain syndrome",
    pathways: ["Pain", "Inflammation"],
    body: "A chronic pelvic pain condition that frequently co-occurs with endometriosis, predominantly affects women, and carries long diagnostic delays.",
  },
  {
    name: "Uterine fibroids",
    pathways: ["Estrogen", "Inflammation"],
    body: "Extremely common and estrogen-driven, yet undertreated relative to prevalence, and sharing hormonal biology directly with adenomyosis and endometriosis.",
  },
  {
    name: "Primary ovarian insufficiency",
    pathways: ["Estrogen", "Metabolic"],
    body: "Hormonal and metabolic, extending the existing menopause arm to women who reach that transition far earlier than expected.",
  },
  {
    name: "Perinatal mood conditions",
    pathways: ["Estrogen", "Mood"],
    body: "A hormonally driven transition with severe consequences and a thin, only recently growing treatment literature.",
  },
  {
    name: "Lipedema",
    pathways: ["Metabolic", "Inflammation"],
    body: "A metabolic and inflammatory condition that affects women almost exclusively and is routinely misdiagnosed, and among the most neglected in the field.",
  },
];

type Status = "Live" | "Under review" | "Planned";

// The original sources Whel pulls from to build its conditions and signals,
// plus the data sources under review or planned for that same build layer.
const BUILD_SOURCES: { name: string; role: string; status: Status }[] = [
  { name: "PubMed", role: "Published literature", status: "Live" },
  { name: "ClinicalTrials.gov", role: "Trial registry", status: "Live" },
  { name: "FDA openFDA", role: "Adverse-event data", status: "Live" },
  { name: "Open Targets", role: "Genetic-target and pathway data", status: "Live" },
  { name: "Reddit communities", role: "Patient-reported signal", status: "Live" },
  {
    name: "Patient-advocacy organizations",
    role: "Structured patient-reported signal beyond Reddit, through planned partnerships with formal women's health advocacy groups, taken on once the validation work is in place.",
    status: "Planned",
  },
  { name: "EudraVigilance", role: "European adverse-event data", status: "Under review" },
  { name: "SIDER", role: "Drug side-effect reference", status: "Under review" },
  { name: "DrugBank", role: "Drug-target and indication data", status: "Planned" },
];

// Independent cross-references shown beside each signal rather than used to
// build it. Some are live; the open knowledge graphs and models are planned,
// and stay outside the core architecture on purpose (see the note below the
// register on the page).
const VALIDATION_LAYERS: { name: string; role: string; status: Status }[] = [
  {
    name: "Every Cure MATRIX",
    role: "An independent treatment-probability cross-reference from Every Cure's graph-ML model, shown beside our grades rather than blended into them.",
    status: "Live",
  },
  {
    name: "Clinical-guideline curation",
    role: "Strength and certainty drawn from named society guidelines, normalized into the highest external-validation grade where a named recommendation covers a pair.",
    status: "Live",
  },
  {
    name: "DRKG (Drug Repurposing Knowledge Graph)",
    role: "An open, multi-source repurposing knowledge graph. Planned as an outside cross-reference shown beside a signal, not folded into Whel's own graph, since it carries the field's male-default coverage that Whel exists to correct.",
    status: "Planned",
  },
  {
    name: "PrimeKG (Precision Medicine Knowledge Graph)",
    role: "An open precision-medicine graph spanning drugs, diseases, phenotypes, and pathways. Planned as a second independent cross-reference to widen the 'graph supports or graph silent' disclosure beyond a single source.",
    status: "Planned",
  },
  {
    name: "TxGNN (graph foundation model)",
    role: "An open, zero-shot drug-repurposing model. Planned as a benchmark and hypothesis cross-reference whose predictions Whel would validate rather than trust outright, because the model inherits the same male-default training data.",
    status: "Planned",
  },
];

const UPGRADES: { name: string; role: string; status: Status }[] = [
  {
    name: "Two-rater validation study",
    role: "A stratified sample of signals re-scored blind by two independent raters, with agreement reported as a measured score.",
    status: "Planned",
  },
  {
    name: "Disproportionality statistics",
    role: "Separating a real adverse-event signal from background reporting noise, using data we already hold.",
    status: "Planned",
  },
  {
    name: "Ontology-grounded entity resolution",
    role: "Resolving every extracted drug and condition against canonical registries before it enters the database, and flagging anything that fails to resolve for human review.",
    status: "Planned",
  },
  {
    name: "Knowledge-graph grounding",
    role: "A domain-restricted graph of typed, directional relationships between drugs, targets, pathways, and conditions, grounded in canonical ontologies, that informs scoring and surfaces a 'graph supports' or 'graph silent' layer beside each signal.",
    status: "Planned",
  },
  {
    name: "Phase-aware relationships",
    role: "Holding cyclical hormonal state as a first-class variable, so a drug and condition relationship can carry the menstrual-cycle phase in which it holds rather than being averaged into a single static edge.",
    status: "Planned",
  },
  {
    name: "Sex-stratified pharmacokinetics",
    role: "Per-compound pharmacokinetic structure held by sex, so documented differences in metabolism and clearance, such as CYP3A4 activity, inform scoring rather than being assumed uniform across bodies.",
    status: "Planned",
  },
  {
    name: "Actionability layer",
    role: "A second axis beside the evidence score that weighs management endpoints, 505(b)(2) regulatory viability, and patient-community signal, so a livable-management candidate is ranked for what it is rather than against a cure-focused default.",
    status: "Planned",
  },
  {
    name: "Citation validation and summary grounding",
    role: "Verifying every generated citation against its registry and grounding every summary sentence against its source text.",
    status: "Live",
  },
  {
    name: "Cross-arm concordance flag",
    role: "Marking where two or more arms support the same drug and condition pair.",
    status: "Planned",
  },
  {
    name: "Open data export",
    role: "A citable CSV and JSON export under an open license, deposited with a DOI.",
    status: "Planned",
  },
];

const STATUS_COLOR: Record<Status, string> = {
  Live: "var(--green-mid)",
  "Under review": "var(--tier-emerging)",
  Planned: "var(--muted)",
};

const PRIORITIES: { title: string; body: string }[] = [
  {
    title: "Disproportionality statistics",
    body: "Pharmacovigilance has a standard way of separating a real adverse-event signal from background reporting noise, the proportional reporting ratio and the reporting odds ratio. Adding that calculation to the adverse-event arm, using data we already hold, is the single most valuable near-term upgrade to the evidence.",
  },
  {
    title: "The validation study",
    body: "Our central claim is that we can grade evidence, and the methods document already designs the test: a stratified sample of signals, re-scored blind by two independent raters, with agreement reported as a measured score. Running it, and publishing the result whatever it turns out to be, converts every confidence tier from model output into a measured claim.",
  },
  {
    title: "Open data",
    body: "A CSV and JSON export under an open license, deposited with a DOI, makes Whel citable, and a tool that other researchers can cite enters the research record rather than staying a website they happen to read.",
  },
];

const CONTINUE: { label: string; href: string; accent: boolean }[] = [
  { label: "Read the manifesto →", href: "/manifesto", accent: false },
  { label: "Browse the conditions →", href: "/conditions", accent: true },
  { label: "Contact us →", href: "/about/contact", accent: false },
];

/* ──────────────────────────────────────────────────────────────────────────
   Presentational helpers
   ────────────────────────────────────────────────────────────────────────── */

function PathwayTag({ name }: { name: string }) {
  const color = PATHWAY_COLORS[name] ?? "var(--muted)";
  return (
    <span
      style={{
        ...MONO,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: "9.5px",
        fontWeight: 500,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color,
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-block", width: 6, height: 6, backgroundColor: color }} />
      {name}
    </span>
  );
}

function SectionHeader({ label, title, intro }: { label: string; title: string; intro?: string }) {
  return (
    <div style={{ marginBottom: 32, maxWidth: 760 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>{label}</div>
      <h2 className="h2" style={{ margin: 0, maxWidth: "20ch" }}>{title}</h2>
      {intro && (
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--body)", maxWidth: "70ch", marginTop: 18 }}>
          {intro}
        </p>
      )}
    </div>
  );
}

const StatusDot = ({ status }: { status: Status }) => (
  <span style={{ ...MONO, fontSize: 12, color: STATUS_COLOR[status], whiteSpace: "nowrap" }}>
    ● {status}
  </span>
);

function RegisterTable({ rows }: { rows: { name: string; role: string; status: Status }[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
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
                  borderBottom: "1px solid var(--ink)",
                  width: ["28%", "50%", "22%"][i],
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td
                className="font-heading"
                style={{
                  fontSize: 15,
                  color: "var(--ink)",
                  padding: "14px 14px 14px 0",
                  borderBottom: "1px solid var(--rule)",
                  verticalAlign: "baseline",
                }}
              >
                {r.name}
              </td>
              <td
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "var(--body)",
                  padding: "14px 14px",
                  borderBottom: "1px solid var(--rule)",
                  verticalAlign: "baseline",
                }}
              >
                {r.role}
              </td>
              <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--rule)", verticalAlign: "baseline" }}>
                <StatusDot status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────────────── */

export default async function RoadmapPage() {
  const { count: totalSignalsRaw } = await supabase
    .from("repurposing_signals")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .not("total_evidence_score", "is", null)
    .gt("total_evidence_score", 0);

  const totalSignals = totalSignalsRaw ?? 0;
  const PHASES = buildPhases(totalSignals);

  return (
    <main>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="surface-ink" style={{ paddingTop: 44, paddingBottom: 60 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/about">About</Link>
            <span className="sep">/</span>
            <span className="here">Roadmap</span>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>Roadmap</div>
          <h1
            className="display"
            style={{ color: "var(--on-ink)", fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)", lineHeight: 1.08, maxWidth: "20ch" }}
          >
            Where the database goes next.
          </h1>
          <p className="lede" style={{ marginTop: 24, color: "var(--on-ink-2)", maxWidth: "62ch" }}>
            What the database covers today, the technical architecture it runs on, the independent
            layers it is checked against, and the conditions and data releases planned for the
            versions to come.
          </p>
        </div>
      </section>

      {/* ── At a glance — Now / Next / Later ─────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: 22 }}>At a glance</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PHASES.map((p) => (
              <div
                key={p.tag}
                style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderTop: `3px solid ${p.color}`, padding: "22px 22px 24px" }}
              >
                <div
                  style={{
                    ...MONO,
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: p.color,
                    marginBottom: 4,
                  }}
                >
                  {p.tag}
                </div>
                <div className="font-heading" style={{ fontSize: 15, color: "var(--ink)", marginBottom: 16 }}>
                  {p.sub}
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", margin: 0, padding: 0 }}>
                  {p.items.map((it) => (
                    <li key={it} style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)", paddingLeft: 14, position: "relative" }}>
                      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 7, width: 5, height: 5, backgroundColor: p.color }} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 01 · Orientation ─────────────────────────────────────────────── */}
      <section className="surface-paper section">
        <div className="container">
          <SectionHeader label="01 · Orientation" title="What Whel is, and who it is for" />

          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: "70ch" }}>
            {ORIENTATION_COPY.map((para) => (
              <p key={para.slice(0, 24)} style={{ fontSize: 16, lineHeight: 1.72, color: "var(--body)" }}>
                {para}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" style={{ marginTop: 30 }}>
            {AUDIENCES.map((a) => (
              <div key={a.label} style={{ background: "var(--paper)", border: "1px solid var(--rule)", padding: "18px 18px 20px" }}>
                <p className="font-heading" style={{ fontSize: 15, color: "var(--ink)", marginBottom: 7, lineHeight: 1.2 }}>
                  {a.label}
                </p>
                <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--body)" }}>{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02 · Selection ───────────────────────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <SectionHeader
            label="02 · Selection"
            title="Why these six conditions"
            intro="We chose these six conditions deliberately, against three explicit criteria, and those same criteria determine how the database grows. They are a starting point in a much larger field."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CRITERIA.map((c) => (
              <div key={c.n} style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderTop: "3px solid var(--moss)", padding: "22px 22px 24px" }}>
                <div style={{ ...MONO, fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 10 }}>
                  {c.n}
                </div>
                <p className="font-heading" style={{ fontSize: 18, color: "var(--ink)", marginBottom: 8 }}>{c.title}</p>
                <p style={{ fontSize: 13.5, lineHeight: 1.62, color: "var(--body)" }}>{c.body}</p>
              </div>
            ))}
          </div>

          {/* The six conditions, mapped */}
          <p className="font-heading" style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)", marginTop: 44, marginBottom: 4 }}>
            The six conditions, mapped
          </p>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--body)", maxWidth: "62ch", marginBottom: 22 }}>
            Each condition is tagged with the biological systems it shares with the others, the
            overlap that makes cross-condition reasoning valid.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Condition", "Shared pathways", "The gap"].map((h, i) => (
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
                        borderBottom: "1px solid var(--ink)",
                        width: ["22%", "26%", "52%"][i],
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONDITIONS.map((c) => (
                  <tr key={c.name}>
                    <td className="font-heading" style={{ fontSize: 16, color: "var(--ink)", padding: "15px 14px 15px 0", borderBottom: "1px solid var(--rule)", verticalAlign: "top" }}>
                      {c.name}
                    </td>
                    <td style={{ padding: "15px 14px", borderBottom: "1px solid var(--rule)", verticalAlign: "top" }}>
                      <span style={{ display: "flex", flexWrap: "wrap", gap: "7px 12px" }}>
                        {c.pathways.map((p) => (
                          <PathwayTag key={p} name={p} />
                        ))}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)", padding: "15px 14px", borderBottom: "1px solid var(--rule)", verticalAlign: "top" }}>
                      {c.gap}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Banner — the direction ───────────────────────────────────────── */}
      <section className="surface-moss section tight">
        <div className="container">
          <div className="eyebrow on-ink" style={{ marginBottom: 16, color: "var(--signal)" }}>The direction</div>
          <h2 className="h2" style={{ color: "var(--on-ink)", maxWidth: "26ch", marginBottom: 14 }}>
            The database is built to grow beyond its first six conditions.
          </h2>
          <p className="lede" style={{ color: "var(--on-ink-2)", maxWidth: "74ch" }}>
            Because the selection rule is explicit and repeatable, the set expands as our capacity
            grows. The conditions below meet the same criteria and are under consideration for
            future versions.
          </p>
        </div>
      </section>

      {/* ── 03 · Expansion ───────────────────────────────────────────────── */}
      <section className="surface-paper section">
        <div className="container">
          <SectionHeader
            label="03 · Expansion"
            title="Where the framework goes next"
            intro="Because the selection rule is explicit, extending it is straightforward. Any women's health condition that shares biology with the existing six, carries a documented research gap, and has enough of an evidence base to surface signals is a candidate. The conditions below illustrate where the framework points, and the final list remains a research and editorial decision. The scope itself stays fixed within women's hormonal and reproductive health."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CANDIDATES.map((c) => (
              <div key={c.name} style={{ background: "var(--bone)", border: "1px dashed var(--ink)", padding: "20px 20px 22px", display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    ...MONO,
                    alignSelf: "flex-start",
                    fontSize: "9.5px",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    border: "1px solid var(--ink)",
                    padding: "3px 7px",
                    marginBottom: 14,
                  }}
                >
                  Candidate
                </span>
                <p className="font-heading" style={{ fontSize: 16, color: "var(--ink)", marginBottom: 8, lineHeight: 1.25 }}>
                  {c.name}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--body)", marginBottom: 14, flex: 1 }}>{c.body}</p>
                <span style={{ display: "flex", flexWrap: "wrap", gap: "7px 12px" }}>
                  {c.pathways.map((p) => (
                    <PathwayTag key={p} name={p} />
                  ))}
                </span>
              </div>
            ))}
          </div>

          <p style={{ ...MONO, fontSize: "11.5px", lineHeight: 1.6, color: "var(--muted)", marginTop: 18 }}>
            Illustrative only; these conditions are not yet in the database.
          </p>
        </div>
      </section>

      {/* ── 04 · Method ──────────────────────────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <SectionHeader
            label="04 · Technical architecture"
            title="The engine, and the sources it is built on"
            intro="This is Whel's technical architecture: the original sources each condition and signal is built from, and the engine work that makes the evidence behind each signal more rigorous. The most valuable near-term work is to strengthen that engine before widening the data it draws on, because a new condition is worth little if the reasoning underneath it is not as solid as it can be. The priorities come directly from our own methods document and from the project's first independent review. The independent layers Whel is checked against, rather than built from, are kept separate in the validation layer below."
          />

          <p className="font-heading" style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)", marginBottom: 18 }}>
            The sources Whel is built on
          </p>
          <RegisterTable rows={BUILD_SOURCES} />

          <p className="font-heading" style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)", marginTop: 44, marginBottom: 18 }}>
            Method upgrades in progress
          </p>
          <RegisterTable rows={UPGRADES} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
            {PRIORITIES.map((p) => (
              <div key={p.title} style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderLeft: "3px solid var(--moss)", padding: "22px 24px" }}>
                <p className="font-heading" style={{ fontSize: 17, color: "var(--ink)", marginBottom: 7 }}>{p.title}</p>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--body)" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 05 · Validation layer ────────────────────────────────────────── */}
      <section className="surface-paper section">
        <div className="container">
          <SectionHeader
            label="05 · Validation layer"
            title="What Whel is checked against"
            intro="Separate from the sources Whel is built on is the layer it is checked against: independent references shown beside each signal rather than blended into its grade. Some are live today. Others are open knowledge graphs and models that lead the biomedical drug-repurposing field, and are planned as outside cross-references. The fuller account of how each external layer is disclosed lives on the external references page."
          />

          <RegisterTable rows={VALIDATION_LAYERS} />

          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              borderLeft: "3px solid var(--moss)",
              padding: "22px 24px",
              marginTop: 28,
              maxWidth: "76ch",
            }}
          >
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--body)", margin: 0 }}>
              The planned graphs and models are kept outside Whel&rsquo;s core architecture on purpose.
              Resources like DRKG, PrimeKG, and TxGNN are built on the same general biomedical record that
              under-covers women&rsquo;s hormonal and reproductive health, so folding them into the engine
              would import the exact blind spot Whel exists to correct. They are most useful as an outside
              check: a place where the graph either agrees with a signal, stays silent, or disagrees, shown
              plainly beside Whel&rsquo;s own grade. Where these layers are silent on a women&rsquo;s health
              condition, that silence is itself a finding worth surfacing.
            </p>
            <Link
              href="/about/external-references"
              style={{
                ...MONO,
                display: "inline-block",
                marginTop: 16,
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--moss)",
              }}
            >
              How each external layer is disclosed →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 06 · A living page ───────────────────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <SectionHeader label="06 · This page" title="A living page" />

          <p style={{ fontSize: 16, lineHeight: 1.72, color: "var(--body)", maxWidth: "70ch" }}>
            This roadmap is a dated document, and it will change. We release Whel as dated snapshots
            rather than a live feed, and the priorities here are shaped by feedback from researchers,
            clinicians, and the patient communities whose reported experience the database draws on,
            about which gaps matter most. If you work in one of these fields, that feedback is welcome.
          </p>

          <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginTop: 28 }}>
            Roadmap revised June 2026
          </div>

          <div style={{ borderTop: "1px solid var(--rule)", marginTop: 20, paddingTop: 28, display: "flex", flexWrap: "wrap", gap: "12px 32px" }}>
            {CONTINUE.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                style={{
                  ...MONO,
                  fontSize: 12,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: c.accent ? "var(--moss)" : "var(--ink)",
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
