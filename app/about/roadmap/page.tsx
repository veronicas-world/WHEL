import Link from "next/link";

export const metadata = {
  title: "Roadmap | Whel",
};

/* ──────────────────────────────────────────────────────────────────────────
   Shared style tokens — matched to the Mission and Technical Architecture pages
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

const SECTION_INNER = "max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20";

/* Pathway tag colours — drawn from the existing arm / tier palette */
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

const PHASES: { tag: string; sub: string; color: string; items: string[] }[] = [
  {
    tag: "Now",
    sub: "Live today",
    color: "var(--green-deep)",
    items: [
      "Six conditions: endometriosis, PMDD, PCOS, adenomyosis, vulvodynia, menopause",
      "Five evidence pipelines running across four research arms",
      "281 signals, each scored against a published five-dimension rubric",
    ],
  },
  {
    tag: "Next",
    sub: "This work cycle",
    color: "var(--green-mid)",
    items: [
      "Run the two-rater validation study and publish the agreement score",
      "Add disproportionality statistics (PRR / ROR) to the adverse-event arm",
      "Surface Every Cure's MATRIX scores as an independent biological-plausibility layer, displayed where MATRIX has coverage",
      "Surface a cross-arm concordance flag where two or more arms support the same compound-condition pair",
      "Make every citation reproduce the count it claims; finish source de-duplication",
      "Publish an open CSV / JSON data export with a citable DOI",
    ],
  },
  {
    tag: "Later",
    sub: "Beyond the next release",
    color: "var(--muted-2)",
    items: [
      "Extend to further under-researched women's health conditions",
      "Add complementary pipelines once the existing ones are solid",
      "Deepen coverage of the conditions already in scope",
    ],
  },
];

const ORIENTATION_COPY: string[] = [
  "Whel is a research instrument: an evidence database rather than a consumer health tool or a drug-discovery algorithm. It does not tell anyone what to take, and it does not invent new compounds or predict new drug targets. What it does is build something the field currently lacks: a structured, scored, searchable evidence base for drug-repurposing signals across under-researched women's health conditions.",
  "It gathers evidence that already exists, scattered across published literature, clinical-trial registries, adverse-event databases, genetic-target platforms, and patient communities, then grades each signal against a published rubric and makes it citable. It is closer to a small evidence lab than a website. That makes Whel useful across the research community, where different readers use it differently.",
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
    body: "Traceable, scored evidence to ground reporting and advocacy, not anecdote.",
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
    body: "The six conditions converge on the same handful of systems: estrogen signaling, chronic inflammation, metabolic regulation, and pain processing. That biological overlap is what makes cross-condition reasoning valid: a signal in one condition can be informative about the others.",
  },
  {
    n: "02",
    title: "Documented neglect",
    body: "Each condition carries a measurable evidence gap: long diagnostic delays, few or no treatments that address the underlying disease rather than the symptoms, and thin research funding. Whel is most useful exactly where the published literature is thinnest.",
  },
  {
    n: "03",
    title: "A focus on women",
    body: "Whel exists to address the structural under-study of women's hormonal and reproductive health, a field that, until the NIH Revitalization Act of 1993, did not even require women in clinical research. That focus is deliberate and permanent. Every condition Whel adds will be a women's health condition.",
  },
];

const CONDITIONS: { name: string; pathways: string[]; gap: string }[] = [
  {
    name: "Endometriosis",
    pathways: ["Estrogen", "Inflammation", "Pain"],
    gap: "Affects up to 10% of women of reproductive age; 7 to 10 year average diagnostic delay; no disease-modifying drug.",
  },
  {
    name: "PMDD",
    pathways: ["Estrogen", "Mood", "Pain"],
    gap: "Clinically severe and cyclical; still treated mainly with imprecisely prescribed SSRIs.",
  },
  {
    name: "PCOS",
    pathways: ["Metabolic", "Estrogen", "Inflammation"],
    gap: "The most common endocrine disorder in women of reproductive age; chronically under-represented in research.",
  },
  {
    name: "Adenomyosis",
    pathways: ["Estrogen", "Inflammation", "Pain"],
    gap: "Long under-recognized; historically confirmable only after hysterectomy.",
  },
  {
    name: "Vulvodynia",
    pathways: ["Pain", "Inflammation"],
    gap: "A chronic pain condition; among the least-studied of the six.",
  },
  {
    name: "Menopause",
    pathways: ["Estrogen", "Metabolic"],
    gap: "A transition every woman who lives long enough experiences; widely acknowledged to be poorly managed.",
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
    body: "Extremely common and estrogen-driven, yet undertreated relative to prevalence; shares hormonal biology directly with adenomyosis and endometriosis.",
  },
  {
    name: "Primary ovarian insufficiency",
    pathways: ["Estrogen", "Metabolic"],
    body: "Hormonal and metabolic; extends the existing menopause arm to women who reach that transition far earlier than expected.",
  },
  {
    name: "Perinatal mood conditions",
    pathways: ["Estrogen", "Mood"],
    body: "A hormonally driven transition with severe consequences and a thin, only recently growing treatment literature.",
  },
  {
    name: "Lipedema",
    pathways: ["Metabolic", "Inflammation"],
    body: "A metabolic and inflammatory condition that affects women almost exclusively and is routinely misdiagnosed; among the most neglected in the field.",
  },
];

const REGISTER: { name: string; role: string; status: "Live" | "Under review" | "Planned" }[] = [
  { name: "PubMed", role: "Published literature", status: "Live" },
  { name: "ClinicalTrials.gov", role: "Trial registry", status: "Live" },
  { name: "FDA AEMS (openFDA)", role: "Adverse-event data", status: "Live" },
  { name: "Open Targets", role: "Genetic-target & pathway data", status: "Live" },
  { name: "Reddit communities", role: "Patient-reported signal", status: "Live" },
  { name: "EudraVigilance", role: "European adverse-event data; populate or formally retire", status: "Under review" },
  { name: "SIDER", role: "Drug side-effect reference; populate or formally retire", status: "Under review" },
  { name: "Every Cure MATRIX cross-reference", role: "Independent biological-plausibility layer from Every Cure's biomedical knowledge graph; displayed where MATRIX has coverage. Audit numbers and per-condition coverage published on /about/external-references", status: "Live" },
  { name: "Disproportionality statistics (PRR / ROR)", role: "Method upgrade to the adverse-event arm", status: "Planned" },
  { name: "Two-rater validation study", role: "Reliability measurement (Cohen's kappa)", status: "Planned" },
  { name: "Cross-arm concordance flag", role: "Display flag where two or more arms (Whel + MATRIX) support the same compound-condition pair", status: "Planned" },
  { name: "Compound-level synthesis score", role: "Derived rollup across all signals for a compound-condition pair", status: "Under review" },
  { name: "Dedicated audit log", role: "Per-signal change history in plain English, with links to underlying migrations", status: "Planned" },
  { name: "Open data export", role: "CSV / JSON under CC BY 4.0, with a Zenodo DOI", status: "Planned" },
  { name: "DrugBank", role: "Drug-target & indication data", status: "Planned" },
];

const STATUS_COLOR: Record<string, string> = {
  Live: "var(--green-mid)",
  "Under review": "var(--tier-emerging)",
  Planned: "var(--muted-2)",
};

const PRIORITIES: { title: string; body: string }[] = [
  {
    title: "Disproportionality statistics",
    body: "Pharmacovigilance has a standard way of separating a real adverse-event signal from background reporting noise: the proportional reporting ratio and reporting odds ratio. Adding even a basic PRR / ROR calculation to the adverse-event arm, using data Whel already holds, is the single biggest credibility upgrade available to the project.",
  },
  {
    title: "The validation study",
    body: "Whel's central claim is that it can grade evidence. The methods document already designs the test: a stratified sample of signals, re-scored blind by two independent human raters, with agreement reported as Cohen's kappa. Running it, and publishing the result whatever it turns out to be, converts every confidence tier from model output into a measured claim.",
  },
  {
    title: "Open data",
    body: "A CSV / JSON export under a CC BY 4.0 license, deposited with a DOI, makes Whel citable. A tool other researchers can cite enters the research record; one they cannot remains only a website.",
  },
];

const CONTINUE: { label: string; href: string; accent: boolean }[] = [
  { label: "Read the mission →", href: "/about", accent: false },
  { label: "Browse the six conditions →", href: "/conditions", accent: true },
  { label: "Contact the project →", href: "/about/contact", accent: false },
];

/* ──────────────────────────────────────────────────────────────────────────
   Small presentational helpers
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
      <span
        aria-hidden="true"
        style={{ display: "inline-block", width: 6, height: 6, backgroundColor: color }}
      />
      {name}
    </span>
  );
}

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

export default function RoadmapPage() {
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
            <span style={{ color: "var(--ink)" }}>Roadmap</span>
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
            Roadmap.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "58ch" }}>
            Current coverage of the database, and the conditions, methods, and
            data releases planned for future versions.
          </p>
        </div>
      </div>

      {/* ── At a glance — Now / Next / Later ─────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div style={{ ...EYEBROW, marginBottom: 20 }}>At a glance</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PHASES.map((p) => (
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

      {/* ── 01 · Orientation ─────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <SectionHeader label="01 · Orientation" title="What Whel is, and who it is for" />

          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: "68ch" }}>
            {ORIENTATION_COPY.map((para) => (
              <p key={para.slice(0, 24)} style={{ fontSize: 15, lineHeight: 1.72, color: "var(--ink-2)" }}>
                {para}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" style={{ marginTop: 28 }}>
            {AUDIENCES.map((a) => (
              <div key={a.label} style={{ ...CARD, padding: "18px 18px 20px" }}>
                <p
                  className="font-heading"
                  style={{ fontSize: "15px", color: "var(--ink)", marginBottom: 7, lineHeight: 1.2 }}
                >
                  {a.label}
                </p>
                <p style={{ fontSize: "12.5px", lineHeight: 1.55, color: "var(--ink-2)" }}>
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02 · Selection ───────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="02 · Selection"
            title="Why these six conditions"
            intro="The six conditions Whel covers were not chosen at random, and they are not the whole picture. They were selected against three explicit criteria, and those same criteria determine how the project grows."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CRITERIA.map((c) => (
              <div
                key={c.n}
                style={{ ...CARD, borderTop: "3px solid var(--green-mid)", padding: "22px 22px 24px" }}
              >
                <div
                  style={{
                    ...MONO,
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                    marginBottom: 10,
                  }}
                >
                  {c.n}
                </div>
                <p
                  className="font-heading"
                  style={{ fontSize: "18px", color: "var(--ink)", marginBottom: 8 }}
                >
                  {c.title}
                </p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.62, color: "var(--ink-2)" }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>

          {/* The six conditions, mapped */}
          <p
            className="font-heading"
            style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink)", marginTop: 40, marginBottom: 4 }}
          >
            The six conditions, mapped
          </p>
          <p style={{ fontSize: "13.5px", lineHeight: 1.6, color: "var(--ink-2)", maxWidth: "62ch", marginBottom: 20 }}>
            Each condition is tagged with the biological systems it shares with the others, the overlap that makes
            cross-condition reasoning valid.
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
                        borderBottom: "1px solid var(--rule-strong)",
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
                    <td
                      className="font-heading"
                      style={{
                        fontSize: "16px",
                        color: "var(--ink)",
                        padding: "15px 14px 15px 0",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "top",
                      }}
                    >
                      {c.name}
                    </td>
                    <td
                      style={{
                        padding: "15px 14px",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "top",
                      }}
                    >
                      <span style={{ display: "flex", flexWrap: "wrap", gap: "7px 12px" }}>
                        {c.pathways.map((p) => (
                          <PathwayTag key={p} name={p} />
                        ))}
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        lineHeight: 1.55,
                        color: "var(--ink-2)",
                        padding: "15px 14px",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "top",
                      }}
                    >
                      {c.gap}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Banner — the bridge ──────────────────────────────────────────── */}
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
              The direction
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
              The database is designed to grow beyond its current six conditions.
            </p>
            <p style={{ fontSize: "14.5px", lineHeight: 1.62, color: "rgba(251,248,241,0.78)", maxWidth: "74ch" }}>
              The selection criteria are explicit and repeatable, so the condition set can expand as the
              project&apos;s capacity grows. The section below outlines the conditions that meet those criteria
              and are under consideration for future versions.
            </p>
          </div>
        </div>
      </section>

      {/* ── 03 · Expansion ───────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="03 · Expansion"
            title="Where the framework goes next"
            intro="Because the selection rule is explicit, extending it is straightforward. Any women's health condition that shares biology with the existing six, carries a documented research gap, and has enough of an evidence base to surface signals is a candidate. The conditions below illustrate where the framework points. They are not yet covered, and the final list remains a research and editorial decision. The scope itself will not change: Whel stays within women's hormonal and reproductive health."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CANDIDATES.map((c) => (
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
                    color: "var(--muted)",
                    border: "1px solid var(--rule-strong)",
                    padding: "3px 7px",
                    marginBottom: 14,
                  }}
                >
                  Candidate
                </span>
                <p
                  className="font-heading"
                  style={{ fontSize: "16px", color: "var(--ink)", marginBottom: 8, lineHeight: 1.25 }}
                >
                  {c.name}
                </p>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink-2)", marginBottom: 14, flex: 1 }}>
                  {c.body}
                </p>
                <span style={{ display: "flex", flexWrap: "wrap", gap: "7px 12px" }}>
                  {c.pathways.map((p) => (
                    <PathwayTag key={p} name={p} />
                  ))}
                </span>
              </div>
            ))}
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
            Illustrative only; these conditions are not yet in the database.
          </p>
        </div>
      </section>

      {/* ── 04 · Method ──────────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className={SECTION_INNER}>
          <SectionHeader
            label="04 · Method"
            title="Strengthening the evidence engine"
            intro="The most valuable near-term work is to make the existing engine more rigorous before adding new data sources. The priorities below come directly from Whel's own methods document and from the project's first independent review. New conditions are worth little if the evidence behind each signal is not as solid as it can be."
          />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Source / method", "Role", "Status"].map((h, i) => (
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
                        width: ["32%", "44%", "24%"][i],
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGISTER.map((r) => (
                  <tr key={r.name}>
                    <td
                      className="font-heading"
                      style={{
                        fontSize: "15px",
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
                        fontSize: "13px",
                        lineHeight: 1.5,
                        color: "var(--ink-2)",
                        padding: "14px 14px",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "baseline",
                      }}
                    >
                      {r.role}
                    </td>
                    <td
                      style={{
                        ...MONO,
                        fontSize: "12px",
                        color: STATUS_COLOR[r.status],
                        padding: "14px 14px",
                        borderBottom: "1px solid var(--rule)",
                        verticalAlign: "baseline",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ● {r.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3" style={{ marginTop: 28 }}>
            {PRIORITIES.map((p) => (
              <div key={p.title} style={{ ...CARD, borderLeft: "3px solid var(--green-mid)", padding: "22px 24px" }}>
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

      {/* ── 05 · A living page ───────────────────────────────────────────── */}
      <section>
        <div className={SECTION_INNER}>
          <SectionHeader label="05 · This page" title="A living page" />

          <p style={{ fontSize: 15, lineHeight: 1.72, color: "var(--ink-2)", maxWidth: "68ch" }}>
            This roadmap is a dated document, and it will change. Whel is released as dated snapshots rather than a
            live feed, and its priorities are shaped by feedback from researchers, clinicians, and the patient
            communities whose reported experience the database draws on, about which gaps matter most. If you work
            in one of these fields, that feedback is welcome.
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
            Roadmap revised May 2026
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
