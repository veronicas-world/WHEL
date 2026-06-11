import type { Metadata } from "next";
import Link from "next/link";
import CandidateCard, { type Candidate } from "@/app/components/CandidateCard";

export const metadata: Metadata = {
  title: "Candidates",
  description: "Drug repurposing candidates with full evidence trails — scored, tiered, and 505(b)(2)-ready.",
};

/* TODO(real-data): candidate list from design — wire to Supabase repurposing_signals in next pass.
   Each candidate should map to a condition's top signals, with claims pulled from the sources table. */
const ALL_CANDIDATES: Candidate[] = [
  {
    id: "WHEL-C-001", drug: "Metformin", condition: "PCOS", conditionId: "pcos",
    tier: "strong", score: 9,
    origin: "Approved · Type 2 diabetes (biguanide)",
    pathway: "505(b)(2) — same active ingredient, new indication",
    direction: "supports",
    rationale: "Decades of off-label prescribing for insulin resistance and anovulation in PCOS, now supported by multiple meta-analyses for ovulation induction and metabolic endpoints. The most established repurposing record in the corpus — surfaced here with its full trail and the points where the literature disagrees.",
    mechanism: "Reduces hepatic gluconeogenesis and improves peripheral insulin sensitivity; lowers circulating insulin, attenuating ovarian androgen production and restoring ovulatory cycles.",
    dims: { replication: "High", source: "High", specificity: "High", plausibility: "High", cyclical: "Modeled" },
    claims: [
      { type: "extract", text: "Metformin improves ovulation rates versus placebo in women with PCOS.", src: "Cochrane Review · 2020 · PMID 32048270" },
      { type: "extract", text: "Insulin-sensitizing effect reduces circulating androgens in PCOS cohorts.", src: "J Clin Endocrinol Metab · 2021 · PMID 33729478" },
      { type: "synth",   text: "Across the metabolic and reproductive literature the direction of effect is consistent, though magnitude varies with BMI strata.", src: "Synthesis of 6 source spans" },
      { type: "contradict", text: "Two trials find no live-birth advantage over lifestyle intervention alone — a contradiction surfaced, not averaged.", src: "N Engl J Med · 2007 · PMID 17287476" },
    ],
  },
  {
    id: "WHEL-C-002", drug: "GnRH antagonists", condition: "Endometriosis", conditionId: "endometriosis",
    tier: "strong", score: 9,
    origin: "Approved · originally prostate cancer (elagolix, relugolix)",
    pathway: "505(b)(2) — established active, new mechanism context",
    direction: "supports",
    rationale: "A textbook cross-condition repurposing arc: a drug class developed for prostate cancer became standard of care for endometriosis-associated pain. Whel reconstructs the full evidence trail and the add-back-therapy contradiction that gates long-term use.",
    mechanism: "Competitively blocks pituitary GnRH receptors, suppressing gonadotropin release and ovarian estrogen production — depriving estrogen-dependent lesions of their growth stimulus.",
    dims: { replication: "High", source: "High", specificity: "High", plausibility: "High", cyclical: "Modeled" },
    claims: [
      { type: "extract", text: "Oral GnRH antagonists significantly reduce endometriosis-associated pelvic pain in RCTs.", src: "Obstet Gynecol · 2018 · PMID 29528917" },
      { type: "extract", text: "Hypoestrogenic side effects require add-back therapy beyond six months.", src: "Fertil Steril · 2019 · PMID 31371049" },
      { type: "synth", text: "The benefit is robust across trials; the open question is durability under add-back, where the evidence is thinner.", src: "Synthesis of 5 source spans" },
    ],
  },
  {
    id: "WHEL-C-003", drug: "SSRIs (luteal-phase dosing)", condition: "PMDD", conditionId: "pmdd",
    tier: "strong", score: 8,
    origin: "Approved · depression / anxiety",
    pathway: "505(b)(2) — novel dosing schedule + indication",
    direction: "supports",
    rationale: "SSRIs work for PMDD through a mechanism that has nothing to do with serotonin reuptake and everything to do with rapid neurosteroid modulation — which nobody understood when the drugs were first prescribed off-label. Luteal-phase-only dosing is a repurposing hypothesis the substrate makes explicit.",
    mechanism: "Acute enhancement of allopregnanolone synthesis via 3α-HSD modulation — a non-serotonergic action that explains the rapid (sub-week) symptom relief atypical of SSRI depression response.",
    dims: { replication: "High", source: "High", specificity: "High", plausibility: "Medium", cyclical: "Modeled" },
    claims: [
      { type: "extract", text: "Luteal-phase SSRI dosing reduces PMDD symptom severity comparably to continuous dosing.", src: "Cochrane Review · 2013 · PMID 23744611" },
      { type: "synth", text: "Onset within days — inconsistent with a reuptake mechanism — points to neurosteroid modulation as the operative pathway.", src: "Synthesis of 4 source spans" },
      { type: "extract", text: "Allopregnanolone dysregulation is implicated in luteal-phase symptom emergence.", src: "Neuropsychopharmacology · 2022 · PMID 35017671" },
    ],
  },
  {
    id: "WHEL-C-004", drug: "Letrozole", condition: "PCOS", conditionId: "pcos",
    tier: "moderate", score: 7,
    origin: "Approved · breast cancer (aromatase inhibitor)",
    pathway: "505(b)(2) — repositioned for ovulation induction",
    direction: "supports",
    rationale: "An aromatase inhibitor developed for breast cancer, increasingly used for PCOS-related infertility with evidence of superiority to clomiphene. A clean example of cross-condition transfer the male-default graph has no reason to connect.",
    mechanism: "Inhibits peripheral aromatase, transiently lowering estrogen and releasing the hypothalamic-pituitary axis to increase FSH output and drive monofollicular ovulation.",
    dims: { replication: "High", source: "High", specificity: "Medium", plausibility: "High", cyclical: "Partial" },
    claims: [
      { type: "extract", text: "Letrozole produces higher live-birth rates than clomiphene in PCOS infertility.", src: "N Engl J Med · 2014 · PMID 25006718" },
      { type: "synth", text: "Superiority replicates across populations; long-term safety data in this off-label use remain limited.", src: "Synthesis of 4 source spans" },
    ],
  },
  {
    id: "WHEL-C-005", drug: "GLP-1 receptor agonists", condition: "PCOS", conditionId: "pcos",
    tier: "emerging", score: 5,
    origin: "Approved · type 2 diabetes / obesity",
    pathway: "505(b)(2) candidate — under active investigation",
    direction: "supports",
    rationale: "Mechanistic plausibility for PCOS metabolic symptoms and endometriosis inflammation, with growing trial interest and no formal repurposing approval yet. Surfaced as an emerging signal with explicit uncertainty.",
    mechanism: "Incretin-mimetic action improves insulin sensitivity and drives weight loss; emerging evidence of direct anti-inflammatory effects relevant to both PCOS and endometriotic lesion activity.",
    dims: { replication: "Medium", source: "Medium", specificity: "Medium", plausibility: "High", cyclical: "Partial" },
    claims: [
      { type: "extract", text: "GLP-1 agonists improve insulin resistance and anthropometric measures in PCOS pilots.", src: "Diabetes Obes Metab · 2023 · PMID 36748843" },
      { type: "contradict", text: "Effect on ovulation and fertility endpoints is not yet established — a gap, surfaced explicitly.", src: "Endocr Rev · 2024 · PMID 38301234" },
    ],
  },
  {
    id: "WHEL-C-006", drug: "Low-dose naltrexone", condition: "Endometriosis", conditionId: "endometriosis",
    tier: "exploratory", score: 3,
    origin: "Approved · opioid dependence (off-label micro-dosing)",
    pathway: "Hypothesis-generation — pre-validation",
    direction: "silent",
    rationale: "A passionate patient community reports benefit for endometriosis pain, with almost zero institutional research. Whel surfaces this as hypothesis generation from patient signal — clearly labelled, never equated with RCT evidence, and routed to the validation queue.",
    mechanism: "Hypothesized: transient opioid-receptor blockade upregulates endogenous endorphin tone and modulates microglial TLR4 signaling, attenuating central pain sensitization.",
    dims: { replication: "Low", source: "Low", specificity: "Medium", plausibility: "Medium", cyclical: "Unmodeled" },
    claims: [
      { type: "extract", text: "Consistent patient-reported reductions in flare frequency across three condition communities.", src: "Community signal cluster · IAPMD + r/endo · n=212 posts" },
      { type: "synth", text: "Direction of report is internally consistent; institutional evidence is effectively absent. This is a hypothesis, not a finding.", src: "Synthesis — flagged for validation" },
    ],
  },
];

const TIER_ORDER = ["strong", "moderate", "emerging", "exploratory"] as const;

export default function CandidatesPage() {
  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: ALL_CANDIDATES.filter((c) => c.tier === tier),
  })).filter((g) => g.items.length > 0);

  const TIER_LABELS: Record<string, string> = {
    strong: "Strong · 9–10",
    moderate: "Moderate · 7–8",
    emerging: "Emerging · 4–6",
    exploratory: "Exploratory · 0–3",
  };

  return (
    <main>

      {/* Header */}
      <section className="surface-ink" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Candidates</span>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>
            {/* TODO(real-data): replace placeholder count with real Supabase candidate count */}
            v0 corpus · {ALL_CANDIDATES.length} candidates shown
          </div>
          <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(40px,5vw,76px)", maxWidth: "18ch" }}>
            Repurposing candidates, with the trail.
          </h1>
          <p className="lede" style={{ marginTop: 26, color: "var(--on-ink-2)" }}>
            Every candidate surfaces a drug already approved for one indication with
            evidence it works for a women&apos;s health condition. Each card shows the
            mechanism, the claims, and the points where the literature disagrees.
          </p>
        </div>
      </section>

      {/* Candidate groups by tier */}
      {grouped.map(({ tier, items }) => (
        <section key={tier} className="surface-bone section tight">
          <div className="container">
            <div style={{ marginBottom: 24 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>{TIER_LABELS[tier]}</div>
              <h2 className="h3">{tier.charAt(0).toUpperCase() + tier.slice(1)} evidence</h2>
            </div>
            <div className="col" style={{ gap: 16 }}>
              {items.map((c) => (
                <CandidateCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="surface-ink section">
        <div className="container-tight" style={{ textAlign: "center" }}>
          <div className="eyebrow on-ink" style={{ marginBottom: 20 }}>Access & methodology</div>
          <h2 className="framedevice" style={{ color: "var(--on-ink)", margin: "0 auto 28px" }}>
            Want the full index?
          </h2>
          <p className="lede" style={{ color: "var(--on-ink-2)", margin: "0 auto 32px" }}>
            The v0.1 index covers six conditions and 200+ signals.
            Request access for the full structured export.
          </p>
          <div className="row" style={{ justifyContent: "center", gap: 12 }}>
            <Link href="/about/contact" className="btn btn-on-ink">
              Request access <span className="arr">→</span>
            </Link>
            <Link href="/about/technical-architecture" className="btn btn-ghost-ink">
              How signals are scored
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
