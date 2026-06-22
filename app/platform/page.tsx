import type { Metadata } from "next";
import Link from "next/link";
import KnowledgeGraph from "@/app/components/KnowledgeGraph";
import CyclicalPK from "@/app/components/CyclicalPK";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "How Whel is built: a corrected, sex-aware knowledge substrate, a retrieval layer that ties every claim to its source and surfaces contradictions, and a signal layer that turns off-label practice into validated hypotheses.",
};

/* ── Citation links ─────────────────────────────────────────────────────── */
const A = ({
  href,
  children,
  ink,
}: {
  href: string;
  children: React.ReactNode;
  ink?: boolean;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: ink ? "var(--signal)" : "var(--moss)",
      textDecoration: "underline",
      textUnderlineOffset: 2,
    }}
  >
    {children}
  </a>
);

const HET = "https://het.io/repurpose/";
const PRIMEKG = "https://www.nature.com/articles/s41597-023-01960-3";
const MONDO = "https://mondo.monarchinitiative.org/";
const EFO = "https://www.ebi.ac.uk/efo/";
const RXNORM = "https://www.nlm.nih.gov/research/umls/rxnorm/index.html";
const CHEMBL = "https://www.ebi.ac.uk/chembl/";
const BIAS = "https://pmc.ncbi.nlm.nih.gov/articles/PMC6877896/";
const PK = "https://pmc.ncbi.nlm.nih.gov/articles/PMC7275616/";
const PKREVIEW = "https://pmc.ncbi.nlm.nih.gov/articles/PMC3644551/";
const NEJM = "https://www.nejm.org/doi/full/10.1056/NEJMp1307972";
const RAG = "https://arxiv.org/abs/2505.01146";
const SCINLI = "https://arxiv.org/abs/2203.06728";
const GRADE = "https://www.bmj.com/content/336/7650/924";
const OFFLABEL =
  "https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2022.829339/full";
const RWE = "https://pmc.ncbi.nlm.nih.gov/articles/PMC9815890/";
const CDS =
  "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software";
const CAUSALY = "https://www.causaly.com/life-science-ai/knowledge-graph";
const ORPHAN =
  "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2025.1670845/full";
const LDN_MECH = "https://pmc.ncbi.nlm.nih.gov/articles/PMC3962576/";
const LDN_TRIAL = "https://clinicaltrials.gov/study/NCT03970330";

/* ── Layer overview copy ────────────────────────────────────────────────── */
const LAYERS = [
  {
    n: "Layer 01",
    name: "The substrate",
    tags: ["Postgres-native", "Ontology-grounded", "Sex-specific PK"],
    desc: "A corrected knowledge graph built to capture sex-specific pharmacokinetics, cyclical hormonal state, and the cross-condition mechanisms general platforms miss because they were trained on male-default data. Grounded today in MONDO, EFO, RxNorm, and ChEMBL with a live mechanistic graph over Open Targets. The sex-specific pharmacokinetics and cycle-phase layers are now seeded for an initial set of compounds, each sourced and shown beside the signal; broader population is ongoing.",
  },
  {
    n: "Layer 02",
    name: "Retrieval & validation",
    tags: ["Per-claim provenance", "Marked synthesis", "Contradiction surfacing"],
    desc: "Provenance-preserving extraction tuned for biomedical literature. Every claim ties to a verbatim source span, every synthesis is marked as a synthesis, and every contradiction in the underlying literature is surfaced explicitly rather than averaged away.",
  },
  {
    n: "Layer 03",
    name: "Hypothesis from signal",
    tags: ["Off-label patterns", "Community reports", "Validated downstream"],
    desc: "Patient-community signal, including off-label prescribing patterns, community reports, and structured patient-reported data, enters as hypothesis generation and is validated downstream against mechanistic and clinical evidence, never equated with the result of a controlled trial. Formal advocacy-organization partnerships are planned.",
  },
];

/* ── Reading-column styles ──────────────────────────────────────────────── */
const wrap: React.CSSProperties = { maxWidth: 768, margin: "0 auto" };
const pBone: React.CSSProperties = {
  fontSize: "1.05rem",
  lineHeight: 1.72,
  color: "var(--body)",
  margin: "0 0 20px",
  maxWidth: "72ch",
};
const pInk: React.CSSProperties = { ...pBone, color: "var(--on-ink-2)" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlatformPage() {
  return (
    <main>
      {/* Hero */}
      <section className="surface-ink" style={{ paddingTop: 40, paddingBottom: 72 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Platform</span>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "center" }}
            className="hero-grid"
          >
            <div>
              <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>The platform</div>
              <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(40px,5vw,72px)" }}>
                The corrected knowledge graph for{" "}
                <span style={{ color: "var(--signal)" }}>female biology.</span>
              </h1>
              <p className="lede" style={{ marginTop: 26, color: "var(--on-ink-2)" }}>
                Whel is built in three layers: a substrate that holds female biology as
                first-class structure, a retrieval layer that ties every claim to its source
                and surfaces disagreement, and a signal layer that turns off-label practice
                into hypotheses worth testing.
              </p>
            </div>
            <div>
              <KnowledgeGraph height={420} />
            </div>
          </div>
        </div>
      </section>

      {/* Layers overview */}
      <section className="surface-ink section" style={{ paddingTop: 0 }}>
        <div className="container">
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
                    {l.tags.map((t) => (
                      <span key={t} className="pill on-ink">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Independent validation layer — sits beside each signal, separate
              from the three build layers and from the score itself. */}
          <div className="layer" style={{ marginTop: 24, border: "1px solid var(--ink-line-2)" }}>
            <div>
              <div className="lnum" style={{ color: "var(--signal)" }}>Beside every signal</div>
              <div className="lname">Independent validation</div>
            </div>
            <div>
              <p className="ldesc">
                The three layers above build a signal and score it. Each finished signal then carries an
                independent reading layer, shown beside the score rather than folded into it: Every
                Cure&rsquo;s MATRIX treatment-probability cross-reference, and, where the substrate covers
                the drug or pair, its documented sex-specific pharmacokinetics and cycle-phase dependence.
                These are kept separate from Layer 02&rsquo;s internal validation and are not one of the
                three build layers. The full set of readings is detailed below.
              </p>
              <div className="ltags">
                <span className="pill on-ink">MATRIX cross-reference</span>
                <span className="pill on-ink">Sex-specific PK</span>
                <span className="pill on-ink">Cycle-phase reading</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Layer 01 — The substrate ─────────────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <div style={wrap}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Layer 01 · The substrate</div>
            <h2 className="h2" style={{ marginBottom: 24, maxWidth: "20ch" }}>
              A map built for the body the data left out.
            </h2>
            <p style={pBone}>
              A drug-repurposing engine is only as good as the map it reasons over. That map is
              a biomedical knowledge graph: a network in which the nodes are entities such as
              diseases, drugs, genes, pathways, and phenotypes, and the edges are the
              relationships between them, such as a compound binding a target or a gene
              participating in a pathway. Graphs of this kind already exist and work.{" "}
              <A href={HET}>Hetionet</A> integrates dozens of public resources into roughly
              47,000 nodes and 2.25 million relationships, and newer graphs such as{" "}
              <A href={PRIMEKG}>PrimeKG</A> extend the same idea across millions more.
            </p>
            <p style={pBone}>
              What those graphs share is that the meaning of every node is fixed to a standard
              vocabulary, a discipline called ontology grounding. We ground entities in the
              standard biomedical ontologies: <A href={MONDO}>MONDO</A>{" "}and{" "}<A href={EFO}>EFO</A>{" "}
              for diseases, and{" "}<A href={RXNORM}>RxNorm</A>{" "}and{" "}<A href={CHEMBL}>ChEMBL</A>{" "}for
              drugs and compound bioactivity. Grounding is what lets the
              platform know that &ldquo;paracetamol&rdquo; and &ldquo;acetaminophen&rdquo;
              are the same drug and that a study of one disease subtype belongs under its parent.
              Without it, the same fact written two ways counts as two facts, or as none.
            </p>
            <p style={pBone}>
              A general-purpose graph is not enough, because the data underneath it was built
              largely on the male body. In pharmacology research male animals still outnumber
              female ones by roughly five to one, and only about{" "}
              <A href={BIAS}>15 percent of studies include both sexes</A>, so the basic
              pharmacology of many drugs was characterized in male tissue. A substrate that
              inherits that record uncritically inherits its blind spots. Ours is built to
              correct for them, which means it carries sex-specific pharmacokinetics and
              cyclical hormonal state as first-class structure rather than as an afterthought.
            </p>
            <p style={pBone}>
              The differences are real and measurable. In one analysis of 86 approved drugs,{" "}
              <A href={PK}>76 reached higher concentrations or cleared more slowly in women</A>,
              who also experience adverse drug reactions nearly twice as often as men. CYP3A4,
              the enzyme that processes a large share of prescription drugs, is{" "}
              <A href={PKREVIEW}>more active in women</A>. The clearest case is zolpidem: women
              metabolize it so much more slowly that blood levels run about 50 percent higher,
              and in 2013 the <A href={NEJM}>FDA halved the recommended dose for women</A>, a
              rare instance of a unisex dose being openly corrected. A model that treats a drug
              as one number across all bodies cannot represent any of this.
            </p>
          </div>
        </div>
      </section>

      {/* Layer 01 in practice — Cyclical PK */}
      <section className="surface-ink section" style={{ paddingTop: 64 }}>
        <div className="container">
          <div className="between" style={{ marginBottom: 32 }}>
            <div>
              <div className="eyebrow on-ink" style={{ marginBottom: 14 }}>Layer 01 · in practice</div>
              <h2 className="h2" style={{ color: "var(--on-ink)", maxWidth: "16ch" }}>
                Cyclical biology, modeled as it moves.
              </h2>
            </div>
            <p className="lede" style={{ color: "var(--on-ink-2)", maxWidth: "36ch" }}>
              Drug response shifts across the menstrual cycle, so the substrate holds hormonal state
              as structured data, so a luteal-phase signal is read in its phase instead of averaged
              into a flat number. This layer is seeded for the strongest-evidence PMDD cases and
              shown beside the relevant signals; broader population is ongoing.
            </p>
          </div>
          <CyclicalPK height={340} />
        </div>
      </section>

      {/* ── Layer 02 — Retrieval & validation ────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <div style={wrap}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Layer 02 · Retrieval &amp; validation</div>
            <h2 className="h2" style={{ marginBottom: 24, maxWidth: "22ch" }}>
              Every claim carries the sentence it came from.
            </h2>
            <p style={pBone}>
              A repurposing hypothesis is only useful if its evidence can be checked, so the
              second layer is built so that every assertion carries its source. We retrieve over
              the biomedical literature and extract claims with provenance, which means each
              claim is tied to the verbatim span of text that supports it. The point is
              auditability: a statement that a drug reduced a symptom is shown together with the
              exact sentence, study, year, and design it came from, so a reader can see at a
              glance whether it rests on a small observational report or a large randomized
              trial. This is the discipline that makes <A href={RAG}>retrieval-grounded systems</A>{" "}
              trustworthy rather than merely fluent.
            </p>
            <p style={pBone}>
              When the platform combines several sources into one statement, that synthesis is
              marked as a synthesis rather than presented as if it were a single finding. The
              line between what a study said and what the system inferred stays visible at all
              times.
            </p>
            <p style={pBone}>
              The literature disagrees with itself constantly, and the easy thing to do is
              average the disagreement away into one confident-looking score. We do the
              opposite. Using <A href={SCINLI}>natural-language inference</A>, the system detects
              when one study&apos;s finding contradicts another&apos;s and surfaces the
              disagreement with both sources and their populations attached, because the fact
              that the evidence conflicts is itself information a researcher needs. A result that
              holds in healthy adults but not in renal impairment is not noise to be smoothed
              over; it is the finding.
            </p>
            <p style={pBone}>
              Evidence is graded rather than collapsed into a single weight. The discipline is
              the one clinical guidelines already use under frameworks such as{" "}
              <A href={GRADE}>GRADE</A>: strong and weak evidence are kept distinct, with the
              basis for each grade visible, so a case report and a randomized trial never carry
              the same authority simply because they point the same way.
            </p>
          </div>
        </div>
      </section>

      {/* ── Layer 03 — Hypothesis from signal ────────────────────────────── */}
      <section className="surface-ink section">
        <div className="container">
          <div style={wrap}>
            <div className="eyebrow on-ink" style={{ marginBottom: 14 }}>Layer 03 · Hypothesis from signal</div>
            <h2 className="h2" style={{ color: "var(--on-ink)", marginBottom: 24, maxWidth: "22ch" }}>
              Off-label practice is an experiment worth recovering.
            </h2>
            <p style={pInk}>
              The conditions Whel works on are managed off label as a matter of routine, which
              means the real-world record of what helps is large and largely unread.{" "}
              <A href={OFFLABEL} ink>
                Off-label prescribing is standard practice across women&apos;s health
              </A>
              , and that practice is a signal: when clinicians and patients converge on a drug
              approved for something else, they are running an informal experiment whose result
              is worth recovering.
            </p>
            <p style={pInk}>
              We treat that signal the way the field treats{" "}
              <A href={RWE} ink>real-world evidence</A> generally, as hypothesis-generating
              rather than confirmatory. Off-label patterns, community reports,
              and structured patient reports can tell you where to look; they cannot, on their
              own, tell you that a drug works, because observational signal carries confounding,
              selection effects, and placebo response that only a controlled comparison can
              separate out.
            </p>
            <p style={pInk}>
              So every signal is validated downstream against mechanistic and clinical evidence.
              The platform asks whether the drug&apos;s known mechanism plausibly explains the
              effect, then whether clinical data supports it, and because the signal usually
              originates with women, the validation is run in women or reported sex-stratified
              rather than assumed to transfer from a male-dominant sample. A community
              observation that survives this becomes a hypothesis worth a researcher&apos;s time;
              one that does not is set aside with its reasons recorded.
            </p>
          </div>
        </div>
      </section>

      {/* What a general platform misses */}
      <section className="surface-moss section">
        <div className="container">
          <div style={wrap}>
            <div className="eyebrow on-ink" style={{ marginBottom: 14, color: "var(--signal)" }}>The differentiation</div>
            <h2 className="h2" style={{ color: "var(--on-ink)", marginBottom: 24, maxWidth: "22ch" }}>
              What a general platform misses.
            </h2>
            <p style={pInk}>
              A fair question: could a general-purpose biomedical platform simply query these
              conditions in the graph it already has? On three counts it would look in the wrong
              places. <strong style={{ color: "var(--on-ink)" }}>The sources:</strong> platforms like{" "}
              <A href={CAUSALY} ink>Causaly read PubMed, the trial registries, and patent filings</A>,
              not the patient communities where the earliest signal for off-label-managed conditions
              lives. <strong style={{ color: "var(--on-ink)" }}>The variables:</strong> a general graph
              holds a drug and disease as a fixed link, while female pharmacology moves across the
              hormonal cycle, so a candidate whose insight is its timing reads as noise.{" "}
              <strong style={{ color: "var(--on-ink)" }}>The candidates:</strong>{" "}a platform serving
              oncology and immunology budgets ranks for ownable molecules, and the cheap generics that
              manage women&rsquo;s conditions are <A href={ORPHAN} ink>financial orphans</A> it has no
              reason to surface.
            </p>
            <p style={pInk}>
              Low-dose naltrexone for endometriosis sits at the intersection of all three. At low doses
              it appears to <A href={LDN_MECH} ink>quiet the glial inflammation</A> behind chronic pain,
              by a route unrelated to the addiction treatment it was approved for, and women have tracked
              its effects in endometriosis communities for years. The institutional record is thin: the
              one randomized endometriosis trial was{" "}
              <A href={LDN_TRIAL} ink>terminated with nine patients enrolled</A>, and it is a generic no
              sponsor will fund to confirmation. A general platform ranks it near the bottom, or never
              reads the signal. We surface it, contradictions and uncertainty attached, because the
              signal and the mechanism are both real.
            </p>
          </div>
        </div>
      </section>

      {/* Reading the evidence markers */}
      <section id="evidence-markers" className="surface-bone section">
        <div className="container">
          <div style={wrap}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Reading the evidence markers</div>
            <h2 className="h2" style={{ marginBottom: 24, maxWidth: "24ch" }}>
              Several independent readings on every candidate, shown side by side.
            </h2>
            <p style={pBone}>
              Each candidate carries several independent readings, recorded separately rather than
              combined into a single number, so the basis for each reading stays visible.{" "}
              <strong>The confidence tier</strong> is our own score: each evidence arm is graded on
              five dimensions (corroboration, rigor, specificity, plausibility, and consistency)
              which sum to a strength out of ten, then discounted by a female-applicability
              multiplier reflecting how far the evidence was generated in women, placing the
              candidate in one of four tiers from exploratory to strong.
            </p>
            <p style={pBone}>
              How far the published record independently backs a pair is no longer a separate grade: it
              is carried inside the score itself, by the <strong>rigor</strong> dimension, which weights
              registered trials and peer-reviewed work above weaker sources, and traces to the verbatim
              quotes on the signal. Whether the biology connects the drug to the condition is likewise
              carried by the <strong>Pathway</strong> evidence arm rather than shown as a separate graph
              chip. What remains beside the score are the readings below, which inform how a result should
              be interpreted rather than how strong it is.
            </p>
            <p style={pBone}>
              <strong>The MATRIX marker</strong>{" "}appears where Every Cure&rsquo;s MATRIX model has a
              score for the same pair. MATRIX is a machine-learned treatment-probability estimate
              drawn from a biomedical knowledge graph across roughly 1,800 drugs and 22,000 diseases,
              and it predicts how plausible a drug and disease link looks given the structure of
              biomedical knowledge. We read the actual evidence for a narrow set of women&rsquo;s health
              conditions, so the two are doing different things, and we show the MATRIX percentile beside
              our own score rather than folding them together, so a reader can weigh a model&rsquo;s prior
              against the evidence on the ground.
            </p>
            <p style={pBone}>
              <strong>The sex-PK marker</strong>{" "}appears where the substrate holds documented
              sex-specific pharmacokinetics for the drug, the way its exposure or clearance differs in
              women. Each fact carries its source, an FDA label or the curated sex-PK literature, and is
              shown beside the signal rather than folded into the grade, because it informs how a result
              should be read rather than how strong the evidence is.
            </p>
            <p style={pBone}>
              <strong>The phase marker</strong>{" "}appears where a treatment&rsquo;s effect depends on the
              menstrual-cycle phase, which matters most for a cyclical condition like PMDD. It records the
              phase the relationship holds in, for example luteal-phase dosing of an SSRI, with its source,
              and like the others it is shown beside the signal rather than folded into the grade.
            </p>
            <p style={pBone}>
              The open data sources and tools we build on, the independent MATRIX
              cross-reference, and the checks we run against model error are documented
              on{" "}
              <Link href="/about/external-references" style={{ color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 }}>
                external references
              </Link>
              , and the full scoring method, the five-dimension rubric, and the documented
              limitations are on{" "}
              <Link href="/about/technical-architecture" style={{ color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 }}>
                technical architecture
              </Link>
              .
            </p>
            <div style={{ marginTop: 28 }}>
              <Link href="/candidates" className="btn btn-primary">
                See the candidates <span className="arr">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* §3060 posture */}
      <section className="surface-sage section tight">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="two-col">
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Regulatory posture</div>
              <h2 className="h2" style={{ marginBottom: 18 }}>A research-support tool, by design.</h2>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--body)", maxWidth: "54ch" }}>
                Whel sits under the 21st Century Cures Act §3060 research-support exemption and
                stays there. Because every claim is tied to a source a clinician can{" "}
                <A href={CDS}>independently review</A>, the platform meets the exemption&apos;s
                transparency bar by architecture rather than by accident, which is the same
                property that makes the output worth trusting in the first place.
              </p>
            </div>
            <div>
              <div className="disclaimer" style={{ height: "100%" }}>
                WHAT WE NEVER DO<br /><br />
                · Display &ldquo;treat patient X with drug Y&rdquo; without surfaceable provenance.<br />
                · Auto-generate treatment plans without clinician review of each citation.<br />
                · Make claims about specific identified patients.<br />
                · Ship a patient mode that returns recommendations without a clinician in the loop.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What it is, and is not */}
      <section className="surface-bone section">
        <div className="container">
          <div style={wrap}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>The honest version</div>
            <h2 className="h2" style={{ marginBottom: 24, maxWidth: "22ch" }}>
              What the platform is, and what it is not.
            </h2>
            <p style={pBone}>
              Whel generates evidenced repurposing hypotheses. It does not diagnose, it does not
              replace a clinical trial, and it does not return a recommendation that a clinician
              cannot trace back to its basis. The methods underneath it are real but imperfect:
              claim extraction misses nuance, contradiction detection is sensitive to how things
              are phrased, and provenance is best-effort rather than absolute.
            </p>
            <p style={pBone}>
              That is exactly why the platform leaves every claim checkable instead of presenting
              it as settled. We are integrating mature pieces, including knowledge graphs,
              ontology grounding, retrieval, and evidence scoring, and pointing them at the part
              of biology medicine left understudied. The work that earns a clinician&apos;s trust
              is not a cleaner score; it is a visible source.
            </p>
            <p style={pBone}>
              The three layers are also at different stages, and we are explicit about that. The
              retrieval-and-validation layer runs today as a flagship on PMDD and PMS rather than
              across every condition; the substrate&rsquo;s grounding is live while its graph is
              still being built; and the six-condition index you can browse now is produced by the
              scored-signals engine these layers are progressively replacing. Where each layer
              actually stands is set out on{" "}
              <Link href="/about/technical-architecture" style={{ color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 }}>
                technical architecture
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="surface-ink section">
        <div className="container-tight" style={{ textAlign: "center" }}>
          <div className="eyebrow on-ink" style={{ marginBottom: 20 }}>Whel · Women&apos;s Health Evidence Lab</div>
          <h2 className="framedevice" style={{ color: "var(--on-ink)", margin: "0 auto 28px" }}>
            Finding what already works for women.
          </h2>
          <div className="row" style={{ justifyContent: "center", gap: 12 }}>
            <Link href="/candidates" className="btn btn-on-ink">
              See the candidates <span className="arr">→</span>
            </Link>
            <Link href="/manifesto" className="btn btn-ghost-ink">
              Read the manifesto
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
