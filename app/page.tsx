import Link from "next/link";
import { supabase } from "@/lib/supabase";
import KnowledgeGraph3D from "@/app/components/KnowledgeGraph3D";
import HeroTitle from "@/app/components/HeroTitle";
import SubstrateCompare from "@/app/components/SubstrateCompare";
import Pipeline from "@/app/components/Pipeline";
import HomeTierMatrix, { type MatrixRow } from "@/app/components/HomeTierMatrix";
import CandidateCard from "@/app/components/CandidateCard";
import { getShowcasePair, getSubstrateHomeData } from "@/lib/substrate-candidates";
import ScrollEffects from "@/app/components/ScrollEffects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Hardcoded design data ────────────────────────────────────────────────────
// These are the canonical named examples and architecture data from the
// Claude Design redesign. They do not come from Supabase.

/* TODO(real-data): placeholder stats from design — headline facts */
const FACTS = [
  { n: "88%",    l: "of preclinical biomedical research uses male-only animal models" },
  { n: "1993",   l: "women excluded from most US Phase I & II trials through this year" },
  { n: "<10%",   l: "of PK studies report cyclical hormonal state" },
  { n: "1.5–1.7×", l: "the rate of adverse drug reactions women experience vs men" },
];

/* TODO(real-data): named drug-repurposing arcs — from design, verified examples */
const ARCS = [
  { drug: "Metformin",         to: "PCOS",              note: "insulin resistance, anovulation" },
  { drug: "Spironolactone",    to: "Hormonal acne",     note: "anti-androgen, off-label staple" },
  { drug: "GnRH antagonists",  to: "Endometriosis",     note: "from prostate cancer to standard of care" },
  { drug: "SSRIs",             to: "PMDD",              note: "neurosteroid modulation, not reuptake" },
  { drug: "Letrozole",         to: "PCOS infertility",  note: "from breast cancer; superior to clomiphene" },
  { drug: "GLP-1 agonists",    to: "PCOS · Endometriosis", note: "metabolic + inflammatory, under study" },
];

/* Mono caption naming the concrete sources / references behind a layer. */
const SOURCE_LINE: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
  fontSize: 11.5,
  lineHeight: 1.5,
  letterSpacing: "0.02em",
  color: "var(--on-ink-mut)",
  margin: "14px 0 2px",
};

/* TODO(real-data): three-layer architecture — from design */
const LAYERS = [
  {
    n: "Layer 01", name: "The substrate",
    tags: ["Postgres-native", "Ontology-grounded", "Sex-PK + cycle-phase"],
    sources: "Open Targets, FDA drug labels, the curated sex-PK literature",
    desc: "A corrected knowledge graph built to hold sex-specific pharmacokinetics, cyclical hormonal state, and the cross-condition mechanistic relationships general platforms miss because they were trained on male-default data. Grounded today in MONDO, EFO, RxNorm, and ChEMBL, with sex-specific pharmacokinetics and cyclical-phase layers already seeded and shown beside the relevant signals, and the fuller female-specific structure no existing ontology covers still being built in.",
  },
  {
    n: "Layer 02", name: "Retrieval & validation",
    tags: ["Per-claim provenance", "Marked synthesis", "Contradiction surfacing"],
    sources: "PubMed, ClinicalTrials.gov, FDA openFDA",
    desc: "Provenance-preserving extraction tuned for biomedical literature. Every claim ties to a verbatim source span, every synthesis is marked as a synthesis, and every contradiction in the underlying literature is surfaced explicitly rather than averaged. This is what the §3060 research-support exemption requires and what clinicians need to trust the output.",
  },
  {
    n: "Layer 03", name: "Hypothesis from signal",
    tags: ["Off-label patterns", "Community reports", "Validated downstream"],
    sources: "Patient-community reports (Reddit)",
    desc: "Patient-community signal, including off-label prescribing patterns, community reports, and structured patient-reported data, enters as hypothesis generation and is validated downstream against mechanistic and clinical evidence. It is never equated with the results of a controlled trial, and it is the input that surfaces the hypotheses worth checking. Formal advocacy-organization partnerships are planned, taken on once the validation work is in place.",
  },
];

/* TODO(real-data): expansion roadmap — from design */
const EXPANSION = [
  {
    phase: "Phase 1", when: "Months 0–18",
    title: "Drug repurposing for core women's health",
    detail: "PMDD, endometriosis, PCOS, adenomyosis, perimenopausal mood disorders, vulvodynia. Output: specific candidates with full evidence trails for the researchers and women's health teams working on these conditions.",
  },
  {
    phase: "Phase 2", when: "Months 18–36",
    title: "Expand to sex-divergent conditions",
    detail: "Autoimmune disease (80% female), pain conditions (1.5–4× female prevalence), neuropsychiatric conditions. The knowledge graph and sex-specific PK modeling transfer directly, the same platform extended to larger patient populations.",
  },
  {
    phase: "Phase 3", when: "Months 36+",
    title: "Beyond repurposing",
    detail: "Novel target identification, combination-therapy prediction, and sex-stratified clinical-trial design, all capabilities latent in the substrate built for repurposing. The operating system for female-biology drug development.",
  },
];

export default async function Home() {
  // ── Real data — now from the substrate (the new arm-aware engine) ────────────
  const [{ data: conditionsRaw }, home, showcase] = await Promise.all([
    supabase.from("conditions").select("id, name, slug, description").order("name"),
    getSubstrateHomeData(),
    getShowcasePair(),
  ]);

  const conditions = conditionsRaw ?? [];

  // Pair count (one drug–condition signal per pair, headline-anchored).
  const totalSignals    = home.totalPairs;
  const totalConditions = conditions.length;

  // Per-condition headline-tier counts for the matrix, from the substrate.
  const EMPTY = { strong: 0, moderate: 0, emerging: 0, exploratory: 0, total: 0 };
  const conditionsWithStats = conditions.map((c) => {
    const st = home.byCondition.get(c.slug) ?? EMPTY;
    return { ...c, totalSignals: st.total, tierCounts: st };
  });

  const matrixRows: MatrixRow[] = conditionsWithStats.map((c) => ({
    id:          c.id,
    name:        c.name,
    slug:        c.slug,
    flagship:    c.slug === "pmdd",
    strong:      c.tierCounts.strong,
    moderate:    c.tierCounts.moderate,
    emerging:    c.tierCounts.emerging,
    exploratory: c.tierCounts.exploratory,
    total:       c.totalSignals,
  }));

  // Provenance volume: distinct verbatim claims behind the active signals.
  const citationsLabel = home.claims > 0 ? home.claims.toLocaleString("en-US") : "–";

  // Showcase contrast card: when its independent readings disagree — a strong
  // MATRIX cross-reference present while Whel's own ingested-evidence tier is
  // lower — surface that disagreement explicitly as a teaching "key" under the
  // two cards.
  const TIER_WORD: Record<string, string> = {
    strong: "Strong", moderate: "Moderate", emerging: "Emerging", exploratory: "Exploratory",
  };
  const contrastCard = showcase[1];
  const disagreement =
    contrastCard && contrastCard.matrixPercentile &&
    (contrastCard.tier === "emerging" || contrastCard.tier === "exploratory")
      ? contrastCard
      : null;

  return (
    <main>
      <ScrollEffects />

      {/* ── HERO ── dark ink surface ─────────────────────────────────────────── */}
      <section className="surface-ink scroll-section" style={{ paddingTop: 64, paddingBottom: 0, overflow: "hidden" }}>
        <div className="container">
          {/* Full-width headline */}
          <HeroTitle
            className="display"
            style={{ color: "var(--on-ink)", maxWidth: "none", fontSize: "clamp(42px, 5.6vw, 84px)" }}
          />
          {/* Two-col: description | graph */}
          <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 48, alignItems: "start", marginTop: 28 }} className="hero-grid">
            <div style={{ paddingTop: 8 }}>
              <p className="lede" style={{ color: "var(--on-ink-2)" }}>
                Whel is building a drug-repurposing platform for female biology: one that surfaces
                approved drugs already working for women&apos;s health conditions, validates them
                against mechanistic and clinical evidence, and maps each to the 505(b)(2) regulatory pathway.
              </p>
              <div className="row" style={{ marginTop: 32, gap: 12 }}>
                <Link href="/manifesto" className="btn btn-on-ink">
                  Read the manifesto <span className="arr">→</span>
                </Link>
                <Link href="/candidates" className="btn btn-ghost-ink">
                  See the candidates <span className="arr">→</span>
                </Link>
              </div>
            </div>
            <div className="graph-hero" style={{ marginTop: -36 }}>
              <KnowledgeGraph3D height={460} dense showLabels={false} scaleFactor={0.21} />
            </div>
          </div>
        </div>

        {/* Stat band */}
        <div className="container" style={{ marginTop: 56, paddingBottom: 60 }}>
          <div className="divider on-ink" style={{ marginBottom: 0 }} />
          <div className="statgrid">
            <div className="s">
              <div className="v">{totalSignals > 0 ? totalSignals : "—"}</div>
              <div className="l">signals indexed · {totalConditions} conditions covered</div>
            </div>
            <div className="s">
              <div className="v">{citationsLabel}</div>
              <div className="l">verbatim claims, each pinned to a source quote</div>
            </div>
            {FACTS.slice(0, 2).map((f) => (
              <div className="s" key={f.n}>
                <div className="v">{f.n}</div>
                <div className="l">{f.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THESIS ── corrected substrate ───────────────────────────────────── */}
      <section className="surface-bone section scroll-section">
        <div className="container">
          <div className="between" style={{ marginBottom: 40 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>The thesis</div>
              <h2 className="h2" style={{ maxWidth: "16ch" }}>
                Drug development was built on male biology.
              </h2>
            </div>
            <p className="lede" style={{ color: "var(--body)" }}>
              Every AI drug-discovery platform reasons over a knowledge graph built from
              male-default research, and rather than adding a women&apos;s-health filter to
              someone else&apos;s substrate, we are building the corrected version from the
              ground up, grounded in female biology.
            </p>
          </div>
          <SubstrateCompare />
          <div style={{ marginTop: 28 }}>
            <Link
              href="/about#exclusion"
              style={{
                fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--moss)", textDecoration: "none",
                borderBottom: "1px solid var(--moss)", paddingBottom: 3,
              }}
            >
              How female biology was written out of drug development <span className="arr">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── DRUG ARCS ── the drugs that already work ─────────────────────────── */}
      <section className="surface-sage section tight scroll-section">
        <div className="container">
          <h2 className="h2" style={{ marginBottom: 28, maxWidth: "none" }}>
            The drugs that work for women&apos;s health were never developed for it.
          </h2>
          {/* TODO(real-data): named arc examples from design */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1,
            background: "var(--line)", border: "1px solid var(--line)",
          }} className="arc-grid">
            {ARCS.map((a, i) => (
              <div key={i} style={{
                background: "var(--bone)", padding: "22px 24px",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <span style={{ fontFamily: "var(--font-plex-mono, monospace)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: 22, fontWeight: 500, lineHeight: 1.1 }}>
                  {a.drug}{" "}
                  <span style={{ color: "var(--moss)" }}>→</span>{" "}
                  <span style={{ fontWeight: 400 }}>{a.to}</span>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>{a.note}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <Link
              href="/about#repurposing"
              style={{
                fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--moss)", textDecoration: "none",
                borderBottom: "1px solid var(--moss)", paddingBottom: 3,
              }}
            >
              Why a historical precedent led us to start with drug repurposing <span className="arr">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROOF ── strongest candidates, before the architecture ───────────── */}
      {showcase.length > 0 && (
        <section className="surface-bone section scroll-section">
          <div className="container">
            <div className="between" style={{ marginBottom: 28 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 14 }}>The output</div>
                <h2 className="h2" style={{ maxWidth: "24ch" }}>What the platform has surfaced.</h2>
              </div>
              <Link href="/candidates" className="btn btn-ghost">
                See all candidates <span className="arr">→</span>
              </Link>
            </div>
            <p className="lede" style={{ marginBottom: 32, maxWidth: "64ch" }}>
              Two candidates, chosen to show the range the score captures: one of the strongest signals
              on the platform, and one rated lower, where the evidence is thinner or the independent
              readings disagree. The score separates them. Open either for the full evidence trail; the
              full index has the rest.
            </p>
            <div className="col" style={{ gap: 16 }}>
              {showcase.map((c) => (
                <CandidateCard key={c.id} c={c} />
              ))}
            </div>
            {disagreement && (
              <p style={{ marginTop: 22, maxWidth: "74ch", fontSize: 14.5, lineHeight: 1.62, color: "var(--body)" }}>
                <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Where the readings disagree.</strong>{" "}
                The second pair is a deliberate example. For {disagreement.drug} in {disagreement.condition},
                Every Cure&rsquo;s MATRIX model places the pair at {disagreement.matrixPercentile}, while Whel&rsquo;s
                own engine rates the ingested evidence {TIER_WORD[disagreement.tier] ?? disagreement.tier}, because the
                literature on file is thinner than the model-based ranking implies. Whel reports both side by side
                and leaves them unaveraged; keeping the layers independent is what lets a disagreement
                like this stay visible on the page.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── THREE LAYERS ── how it works ─────────────────────────────────────── */}
      <section className="surface-ink section scroll-section">
        <div className="container">
          <div className="eyebrow on-ink" style={{ marginBottom: 14 }}>How it works</div>
          <h2 className="h2" style={{ color: "var(--on-ink)", marginBottom: 40, maxWidth: "18ch" }}>
            Built in three layers.
          </h2>
          {/* TODO(real-data): layer descriptions from design */}
          <div className="layers">
            {LAYERS.map((l) => (
              <div className="layer" key={l.n}>
                <div>
                  <div className="lnum">{l.n}</div>
                  <div className="lname">{l.name}</div>
                </div>
                <div>
                  <p className="ldesc">{l.desc}</p>
                  <div style={SOURCE_LINE}>
                    <span style={{ color: "var(--signal)" }}>Sources</span> · {l.sources}
                  </div>
                  <div className="ltags">
                    {l.tags.map((t) => <span key={t} className="pill on-ink">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* The three layers above build a signal. This validation layer is a
              separate, independent check shown beside the finished signal, kept
              out of the score — it is not a fourth build layer. */}
          <div className="layer" style={{ marginTop: 24, border: "1px solid var(--ink-line-2)" }}>
            <div>
              <div className="lnum" style={{ color: "var(--signal)" }}>Beside every signal</div>
              <div className="lname">Independent validation</div>
            </div>
            <div>
              <p className="ldesc">
                Once a signal is built by the three layers above, it is checked against outside
                references that are kept separate from its score: an external validation ladder
                (E0&ndash;E3) that traces to guideline bodies such as ESHRE, ACOG, and Cochrane, and
                Every Cure&rsquo;s MATRIX treatment-probability model. This is the validation layer.
                It is shown beside each result, kept out of the score, and is not one of the three
                build layers.
              </p>
              <div style={SOURCE_LINE}>
                <span style={{ color: "var(--signal)" }}>References</span> · Every Cure MATRIX, ESHRE / ACOG / Cochrane guidance
              </div>
              <div className="ltags">
                <span className="pill on-ink">External validation ladder · E0–E3</span>
                <span className="pill on-ink">MATRIX cross-reference</span>
                <span className="pill on-ink">DRKG · PrimeKG · TxGNN planned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PIPELINE ── off-label → 505(b)(2) ───────────────────────────────── */}
      <section className="surface-ink section scroll-section" style={{ paddingTop: 64, paddingBottom: 56 }}>
        <div className="container">
          <div className="between" style={{ marginBottom: 32 }}>
            <h2 className="h2" style={{ color: "var(--on-ink)", maxWidth: "20ch" }}>
              From off-label signal to a 505(b)(2)-eligible candidate.
            </h2>
            <p className="lede" style={{ color: "var(--on-ink-2)", maxWidth: "34ch" }}>
              Off-label use is the largest uncontrolled clinical trial in women&apos;s health.
              We read the results.
            </p>
          </div>
          <Pipeline />
        </div>
      </section>

      {/* ── CONDITIONS ── where we start ─────────────────────────────────────── */}
      <section className="surface-bone section scroll-section">
        <div className="container">
          <div className="between" style={{ marginBottom: 32 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>v0 corpus · {totalConditions} conditions</div>
              <h2 className="h2">Where we start.</h2>
            </div>
            <Link href="/conditions" className="btn btn-ghost">
              All conditions <span className="arr">→</span>
            </Link>
          </div>
          {/* Real data: conditions from Supabase */}
          <div className="cond-grid">
            {conditionsWithStats.map((c, i) => (
              <Link
                key={c.id}
                href={`/conditions/${c.slug}`}
                style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
              >
                <article className={`cond-card ${c.slug === "pmdd" ? "flagship" : ""}`} style={{ height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="num">C-{String(i + 1).padStart(2, "0")}</span>
                    {c.slug === "pmdd"
                      ? <span className="flag">Flagship</span>
                      : <span className="num">{c.totalSignals} signals</span>
                    }
                  </div>
                  <div className="nm">{c.name}</div>
                  {c.description && <div className="ds">{c.description}</div>}
                  <div className="ft">
                    <span><b>{c.totalSignals}</b> signals</span>
                    <span>Open →</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIER MATRIX ── confidence distribution ───────────────────────────── */}
      <section className="surface-paper section tight scroll-section">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: 14 }}>Fig. 1 · Confidence distribution</div>
          <h2 className="h2" style={{ marginBottom: 8 }}>Where the evidence sits.</h2>
          <p className="lede" style={{ marginBottom: 32 }}>
            Evidence sits in tiers, and we never flatten strong and exploratory signals into the same visual weight.
          </p>
          {/* Real data: tier counts from Supabase */}
          {matrixRows.length > 0
            ? <HomeTierMatrix rows={matrixRows} />
            : (
              <div style={{
                border: "1px solid var(--line)", background: "var(--bone)",
                padding: 32, fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: 13, color: "var(--muted)", textAlign: "center",
              }}>
                Matrix will populate once active signals are loaded.
              </div>
            )
          }
        </div>
      </section>

      {/* ── EXPANSION ── the roadmap ─────────────────────────────────────────── */}
      <section className="surface-moss section scroll-section">
        <div className="container">
          <div className="eyebrow on-ink" style={{ marginBottom: 14 }}>The expansion path</div>
          <h2 className="h2" style={{ color: "var(--on-ink)", marginBottom: 40, maxWidth: "22ch" }}>
            Repurposing is where we prove the platform.
          </h2>
          {/* TODO(real-data): expansion roadmap from design */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1,
            background: "var(--ink-line-2)", border: "1px solid var(--ink-line-2)",
          }} className="exp-grid">
            {EXPANSION.map((e, i) => (
              <div key={i} style={{
                background: "var(--moss)", padding: "28px 26px",
                display: "flex", flexDirection: "column", gap: 12, minHeight: 230,
              }}>
                <span style={{ fontFamily: "var(--font-plex-mono, monospace)", fontSize: 11, color: "var(--signal)", letterSpacing: "0.1em" }}>
                  {e.phase}
                </span>
                <div style={{ fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: 21, color: "var(--on-ink)", lineHeight: 1.15 }}>
                  {e.title}
                </div>
                <div style={{ fontSize: 14, color: "var(--on-ink-2)", lineHeight: 1.55 }}>{e.detail}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <Link
              href="/about/roadmap"
              style={{
                fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--signal)", textDecoration: "none",
                borderBottom: "1px solid var(--signal)", paddingBottom: 3,
              }}
            >
              See the full roadmap <span className="arr">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="surface-ink section scroll-section" style={{ position: "relative", overflow: "hidden", paddingTop: 64, paddingBottom: 64 }}>
        {/* Ambient 3D backdrop — aria-hidden, non-interactive, fills the block */}
        <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none", display: "flex", alignItems: "center" }}>
          <KnowledgeGraph3D height={520} autoSpin={0.0014} interactive={false} fillWidth scaleFactor={0.26} />
        </div>
        <div className="container-tight" style={{ textAlign: "center", position: "relative" }}>
          <div className="eyebrow on-ink" style={{ marginBottom: 20 }}>Whel · Women&apos;s Health Evidence Lab</div>
          <h2 className="framedevice" style={{ color: "var(--on-ink)", margin: "0 auto 28px" }}>
            Finding what already works for women.
          </h2>
          <p className="lede" style={{ color: "var(--on-ink-2)", margin: "0 auto 32px" }}>
            For clinician-researchers, pharma women&apos;s health teams, and advocacy organizations.
            Explore the full candidate index, or read how each signal is scored.
          </p>
          <div className="row" style={{ justifyContent: "center", gap: 12 }}>
            <Link href="/candidates" className="btn btn-on-ink">
              View candidates <span className="arr">→</span>
            </Link>
            <Link href="/about/technical-architecture" className="btn btn-ghost-ink">
              How we score evidence
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
