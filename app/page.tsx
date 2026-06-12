import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toArmKey, type ArmKey } from "@/lib/arm-mapping";
import type { TierKey } from "@/app/components/TierHeatmap";
import MoleculeMesh3D, { type Marker } from "@/app/components/MoleculeMesh3D";
import SubstrateCompare from "@/app/components/SubstrateCompare";
import Pipeline from "@/app/components/Pipeline";
import CandidateCard from "@/app/components/CandidateCard";
import HomeTierMatrix, { type MatrixRow } from "@/app/components/HomeTierMatrix";
import { getFeaturedCandidates } from "@/lib/candidates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Hardcoded design data ────────────────────────────────────────────────────
// These are the canonical named examples and architecture data from the
// Claude Design redesign. They do not come from Supabase.

/* Drug→condition markers pinned to the 3D surface arm tips */
const HERO_MARKERS: Marker[] = [
  { abbr: "MET",  cond: "PCOS", id: "WHEL-C-001" },
  { abbr: "GNRH", cond: "ENDO", id: "WHEL-C-002" },
  { abbr: "SSRI", cond: "PMDD", id: "WHEL-C-003" },
  { abbr: "LTZ",  cond: "PCOS", id: "WHEL-C-004" },
  { abbr: "GLP1", cond: "PCOS", id: "WHEL-C-005" },
  { abbr: "LDN",  cond: "ENDO", id: "WHEL-C-006", contradiction: true },
];

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

/* TODO(real-data): three-layer architecture — from design */
const LAYERS = [
  {
    n: "Layer 01", name: "The substrate",
    tags: ["Postgres-native", "Ontology-grounded", "PrimeKG · CTKG seed"],
    desc: "A corrected knowledge graph that captures sex-specific pharmacokinetics, cyclical hormonal state, and the cross-condition mechanistic relationships general platforms miss because they were trained on male-default data. Grounded in MONDO, HPO, RxNorm, and ChEMBL, then enriched with female-specific ontology extensions no existing ontology adequately covers.",
  },
  {
    n: "Layer 02", name: "Retrieval & validation",
    tags: ["Per-claim provenance", "Marked synthesis", "Contradiction surfacing"],
    desc: "Provenance-preserving extraction tuned for biomedical literature. Every claim ties to a verbatim source span, every synthesis is marked as a synthesis, and every contradiction in the underlying literature is surfaced explicitly rather than averaged. This is what the §3060 research-support exemption requires and what clinicians need to trust the output.",
  },
  {
    n: "Layer 03", name: "Hypothesis from signal",
    tags: ["Off-label patterns", "Advocacy registries", "Validated downstream"],
    desc: "Patient-community signal, including off-label prescribing patterns, advocacy-organization registries, and structured reports, enters as hypothesis generation and is validated downstream against mechanistic and clinical evidence. It is never equated with the results of a controlled trial, and it is the input that surfaces the hypotheses worth checking.",
  },
];

/* TODO(real-data): expansion roadmap — from design */
const EXPANSION = [
  {
    phase: "Phase 1", when: "Months 0–18",
    title: "Drug repurposing for core women's health",
    detail: "PMDD, endometriosis, PCOS, adenomyosis, perimenopausal mood disorders, vulvodynia. Output: specific candidates with full evidence trails. Early SaaS contracts with women's health pharma and biotech teams.",
  },
  {
    phase: "Phase 2", when: "Months 18–36",
    title: "Expand to sex-divergent conditions",
    detail: "Autoimmune disease (80% female), pain conditions (1.5–4× female prevalence), neuropsychiatric conditions. The knowledge graph and sex-specific PK modeling transfer directly, the same platform serving bigger markets.",
  },
  {
    phase: "Phase 3", when: "Months 36+",
    title: "Beyond repurposing",
    detail: "Novel target identification, combination-therapy prediction, and sex-stratified clinical-trial design, all capabilities latent in the substrate built for repurposing. The operating system for female-biology drug development.",
  },
];

export default async function Home() {
  // ── Real Supabase data ──────────────────────────────────────────────────────
  const [
    { data: conditionsRaw },
    { data: signalsRaw },
    { count: sourcesCount },
  ] = await Promise.all([
    supabase.from("conditions").select("id, name, slug, description").order("name"),
    supabase
      .from("repurposing_signals")
      .select("condition_id, confidence_tier, total_evidence_score, created_at, signal_type")
      .eq("status", "active")
      .not("total_evidence_score", "is", null)
      .gt("total_evidence_score", 0),
    supabase
      .from("sources")
      .select("repurposing_signals!inner(status)", { count: "exact", head: true })
      .eq("repurposing_signals.status", "active"),
  ]);

  const conditions = conditionsRaw ?? [];
  const signals    = signalsRaw   ?? [];
  const featured   = await getFeaturedCandidates(3);

  const totalSignals    = signals.length;
  const totalConditions = conditions.length;

  // Per-condition tier counts for the matrix
  const conditionsWithStats = conditions.map((c) => {
    const cSigs = signals.filter((s) => s.condition_id === c.id);
    const tierCounts: Record<TierKey, number> = { strong: 0, moderate: 0, emerging: 0, exploratory: 0 };
    for (const s of cSigs) {
      const t = (s.confidence_tier?.toLowerCase() ?? "exploratory") as TierKey;
      if (t in tierCounts) tierCounts[t]++;
      else tierCounts.exploratory++;
    }
    return { ...c, totalSignals: cSigs.length, tierCounts };
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

  // Arm counts for display
  const armCounts: Partial<Record<ArmKey, number>> = {};
  for (const s of signals) {
    const key = toArmKey((s as { signal_type?: string | null }).signal_type);
    if (key) armCounts[key] = (armCounts[key] ?? 0) + 1;
  }

  const citationsLabel =
    typeof sourcesCount === "number" && sourcesCount > 0
      ? sourcesCount.toLocaleString("en-US")
      : "–";

  return (
    <main>

      {/* ── HERO ── dark ink surface ─────────────────────────────────────────── */}
      <section className="surface-ink" style={{ paddingTop: 64, paddingBottom: 0, overflow: "hidden" }}>
        <div className="container">
          {/* Full-width headline */}
          <h1 className="display" style={{ color: "var(--on-ink)", maxWidth: "none", fontSize: "clamp(42px, 5.6vw, 84px)" }}>
            The drug repurposing platform for female biology.
          </h1>
          {/* Two-col: description | graph */}
          <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 48, alignItems: "start", marginTop: 28 }} className="hero-grid">
            <div style={{ paddingTop: 8 }}>
              <p className="lede" style={{ color: "var(--on-ink-2)" }}>
                Whel surfaces approved drugs that already work for women&apos;s health conditions,
                validates them against mechanistic and clinical evidence, and produces
                505(b)(2)-ready candidates that pharma women&apos;s health teams can act on.
              </p>
              <div className="row" style={{ marginTop: 32, gap: 12 }}>
                <Link href="/candidates" className="btn btn-on-ink">
                  See a worked example <span className="arr">→</span>
                </Link>
                <Link href="/manifesto" className="btn btn-ghost-ink">
                  Read the manifesto
                </Link>
              </div>
            </div>
            <div className="graph-hero" style={{ marginTop: -36 }}>
              <MoleculeMesh3D
                height={460}
                markers={HERO_MARKERS}
                arms={7}
                amp={3.1}
                exp={9}
                baseR={0.34}
                fill={0.118}
                cyf={0.34}
              />
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
              <div className="l">source citations across active signals</div>
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
      <section className="surface-bone section">
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
        </div>
      </section>

      {/* ── DRUG ARCS ── the drugs that already work ─────────────────────────── */}
      <section className="surface-sage section tight">
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
                  <span style={{ fontStyle: "italic", fontWeight: 400 }}>{a.to}</span>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>{a.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED CANDIDATES ── the product ──────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <div className="between" style={{ marginBottom: 32 }}>
            <h2 className="h2">Repurposing candidates, with the trail.</h2>
            <Link href="/candidates" className="btn btn-ghost">
              All candidates <span className="arr">→</span>
            </Link>
          </div>
          {/* TODO(real-data): first 3 candidates from design; wire to Supabase repurposing_signals in next pass */}
          <div className="col" style={{ gap: 16 }}>
            {featured.map((c, i) => (
              <CandidateCard key={c.id} c={c} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE LAYERS ── how it works ─────────────────────────────────────── */}
      <section className="surface-ink section">
        <div className="container">
          <div className="eyebrow on-ink" style={{ marginBottom: 14 }}>How it works</div>
          <h2 className="h2" style={{ color: "var(--on-ink)", marginBottom: 40, maxWidth: "18ch" }}>
            One platform, three layers.
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
                  <div className="ltags">
                    {l.tags.map((t) => <span key={t} className="pill on-ink">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIPELINE ── off-label → 505(b)(2) ───────────────────────────────── */}
      <section className="surface-ink section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="between" style={{ marginBottom: 32 }}>
            <h2 className="h2" style={{ color: "var(--on-ink)", maxWidth: "20ch" }}>
              From off-label signal to a 505(b)(2)-ready trail.
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
      <section className="surface-bone section">
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
      <section className="surface-paper section tight">
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
      <section className="surface-moss section">
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
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="surface-ink section" style={{ position: "relative", overflow: "hidden" }}>
        {/* Ambient 3D backdrop — aria-hidden, non-interactive */}
        <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none", display: "flex", alignItems: "center" }}>
          <MoleculeMesh3D
            height={560}
            markers={[]}
            arms={8}
            amp={3.1}
            exp={9}
            baseR={0.32}
            fill={0.058}
            spin={0.0014}
            interactive={false}
          />
        </div>
        <div className="container-tight" style={{ textAlign: "center", position: "relative" }}>
          <div className="eyebrow on-ink" style={{ marginBottom: 20 }}>Whel · Women&apos;s Health Evidence Lab</div>
          <h2 className="framedevice" style={{ color: "var(--on-ink)", margin: "0 auto 28px" }}>
            Finding what already works for women.
          </h2>
          <p className="lede" style={{ color: "var(--on-ink-2)", margin: "0 auto 32px" }}>
            For clinician-researchers, pharma women&apos;s health teams, and advocacy organizations.
            Request access to the v0.1 index, or read how each signal is scored.
          </p>
          <div className="row" style={{ justifyContent: "center", gap: 12 }}>
            <Link href="/access" className="btn btn-on-ink">
              Request access <span className="arr">→</span>
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
