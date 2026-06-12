import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "Modern medicine was built on the male body. For many women's health conditions the drugs that help already exist, approved for something else and prescribed off label. Whel is the drug-repurposing platform built to find them.",
};

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 2 }}>
    {children}
  </a>
);

const NIH = "https://orwh.od.nih.gov/toolkit/recruitment/history";
const BIAS = "https://pmc.ncbi.nlm.nih.gov/articles/PMC6877896/";
const ADR = "https://pubmed.ncbi.nlm.nih.gov/32503637/";
const GAO = "https://www.gao.gov/products/gao-01-286r";
const OFFLABEL = "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8987152/";
const PCOS = "https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome";
const ENDO = "https://www.who.int/news-room/fact-sheets/detail/endometriosis";
const VIAGRA = "https://pmc.ncbi.nlm.nih.gov/articles/PMC7097805/";
const VIAGRA_REV = "https://www.statista.com/statistics/264827/pfizers-worldwide-viagra-revenue-since-2003/";
const FIVEOHFIVE = "https://www.sciencedirect.com/science/article/abs/pii/S0022354923001508";
const FUNDING = "https://intuitionlabs.ai/articles/ai-biotech-funding-trends";

const wrap: React.CSSProperties = { maxWidth: 760, margin: "0 auto" };
const h2: React.CSSProperties = { fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 18px" };
const p: React.CSSProperties = { fontSize: "1.075rem", lineHeight: 1.72, color: "var(--body)", margin: "0 0 20px", maxWidth: "70ch" };

export default function ManifestoPage() {
  return (
    <main>
      {/* Hero */}
      <section className="surface-ink" style={{ paddingTop: 44, paddingBottom: 60 }}>
        <div className="container">
          <div style={wrap}>
            <div className="crumbs on-ink">
              <Link href="/">Home</Link>
              <span className="sep">/</span>
              <span className="here">Manifesto</span>
            </div>
            <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>Manifesto</div>
            <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)", lineHeight: 1.08, maxWidth: "16ch" }}>
              Medicine was built on the male body.
            </h1>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="surface-bone section">
        <div className="container">
          <div style={wrap}>
            <p style={p}>
              Modern medicine was built on the male body and then prescribed to everyone else. For most of the twentieth century, women of childbearing potential were kept out of clinical trials on the rationale of protecting a possible pregnancy, and the United States did not require women in federally funded clinical research until the <A href={NIH}>NIH Revitalization Act of 1993</A>, so the evidence base underlying prescribing decisions was built for generations almost entirely on men.
            </p>
            <p style={p}>
              This bias runs far beyond clinical trials. In pharmacology research, male animals still outnumber females by roughly five to one, and only about <A href={BIAS}>15 percent of studies include both sexes</A>. As such, the basic pharmacology of many drugs was worked out in male tissue long before a woman ever received a prescription.
            </p>
            <p style={p}>
              The cost of this is measurable. When doses are set on bodies that are not theirs, women are overmedicated and experience adverse drug reactions <A href={ADR}>nearly twice as often as men</A>. The pattern is not subtle once anyone looks for it: when the Government Accountability Office examined the prescription drugs pulled from the United States market in the years around the turn of the century, it found that <A href={GAO}>eight of the ten</A> posed greater health risks to women than to men. For decades, half the population has taken medicine designed around the other half, and the harm of this has been visible in the data the entire time.
            </p>

            <h2 className="font-heading" style={{ ...h2, marginTop: 46 }}>The treatments already exist</h2>
            <p style={p}>
              In many women&rsquo;s health conditions, the drugs that help already exist. They are approved for something else, prescribed off label, and working in millions of cases that the evidence base never formally recorded. This is not an edge case, but rather, is standard care.
            </p>
            <p style={p}>
              The examples are routine. Premenstrual dysphoric disorder and menopausal symptoms are commonly managed with antidepressants prescribed <A href={OFFLABEL}>off label</A>. Insulin resistance in <A href={PCOS}>polycystic ovary syndrome</A> is managed with metformin, a diabetes drug, and GnRH antagonists first developed for prostate cancer are now standard treatment for <A href={ENDO}>endometriosis</A> pain. Women&rsquo;s medicine has run on repurposing for decades, but no one has treated that reality as something worth taking seriously.
            </p>
            <p style={p}>
              The most famous repurposed drug shows what happens when someone does. Sildenafil was developed for angina; it underperformed at the heart and produced an unexpected effect. <A href={VIAGRA}>Pfizer brought it to market in 1998 as Viagra</A>. It cured nothing, but by managing a condition men simply live with, it became one of the largest drug franchises in history.
            </p>

            <h2 className="font-heading" style={{ ...h2, marginTop: 46 }}>Built for management</h2>
            <p style={p}>
              Drug discovery is built to chase cures, not management. Its engines are tuned to find the single drug that can eliminate a disease. That model fits cancer and rare genetic disorders, and it is where the AI drug-discovery companies point their engines, since a cure for a fatal disease is the blockbuster.
            </p>
            <p style={p}>
              Women&rsquo;s health does not fit this template. Conditions such as endometriosis, PCOS, PMDD, adenomyosis, perimenopause, and vulvodynia are not neatly curable; they are lived with and managed over years. They are rarely fatal but routinely life-debilitating, and reshape careers, relationships, and decades of life without showing up on mortality tables.
            </p>
            <p style={p}>
              Management is a different question and therefore needs a different evidence base. The relevant question here is not &ldquo;Which molecule erases the disease?&rdquo; but &ldquo;Which existing drug makes this condition livable, at what dose, in which phase of the cycle, and for which person?&rdquo; The answers to these questions live in places cure-hunting engines ignore: off-label prescribing patterns, small trials that track daily function rather than remission, and patient communities where women record, month after month, what has helped them get through the week.
            </p>
            <p style={p}>
              That last source is real evidence and we treat it as such. Patient communities accumulate practical knowledge years ahead of the literature. We read that signal, structure it, and test it against mechanistic and clinical data, never mistaking it for proof on its own and never discarding it as noise.
            </p>
            <p style={p}>
              This is not a niche market. Women are half the population and these conditions are common. Endometriosis affects roughly <A href={ENDO}>one in ten women</A> of reproductive age, <A href={PCOS}>PCOS affects a comparable share</A>, and every woman who lives long enough reaches menopause. Yet managing chronic, non-fatal conditions has never had the prestige of curing cancer or rare disease, so attention and capital flow away. The result is a large, proven market that almost no one is building for, even as <A href={VIAGRA_REV}>Viagra has earned billions of dollars a year</A> at its peak by managing a condition that kills no one.
            </p>
            <p style={p}>
              A platform tuned to find cures reads all of this as noise, but we read it as the data, because an engine built to find oncology blockbusters will reliably find oncology blockbusters, while the drug that manages endometriosis for millions of women is the kind of result it is not built to see, and that result is the one we are built to find.
            </p>

            <h2 className="font-heading" style={{ ...h2, marginTop: 46 }}>Why now</h2>
            <p style={p}>Two shifts make this the time to build.</p>
            <p style={p}>
              First, drug development economics and momentum have moved toward AI and repurposing. A new drug often costs well over a billion dollars, takes more than a decade, and fails about nine times out of ten. A repurposed drug starts from an established safety record, reaches patients faster, and moves through regulatory pathways like <A href={FIVEOHFIVE}>505(b)(2)</A> with a much higher success rate. Capital now reflects this logic: AI drug discovery spans hundreds of companies and pulled in roughly <A href={FUNDING}>5.6 billion dollars in a single year</A>, close to a third of all healthcare startup funding, while Isomorphic Labs alone raised 600 million dollars and signed discovery deals with Eli Lilly and Novartis worth up to 1.7 and 1.2 billion dollars; almost all of that money is aimed at novel molecules for the diseases that fit the cure model, which leaves the repurposing of approved drugs to manage female biology sitting almost entirely outside the field&rsquo;s attention.
            </p>
            <p style={p}>
              The second force is that the same tools the discovery companies aim at novel chemistry can now be aimed at evidence instead, so that the scattered, unstructured, decades-deep record of how approved drugs behave in female bodies can finally be read at scale, and the literature, the trial registries, the adverse-event databases, and the patient communities can be read together for the first time. The signal was always there and the means to surface it has only just arrived, which is what makes this the moment that drug repurposing becomes the frontier of drug development and the moment that a platform dedicated to female biology becomes possible to build, and we intend to build it first.
            </p>

            <h2 className="font-heading" style={{ ...h2, marginTop: 46 }}>What Whel is</h2>
            <p style={p}>
              Whel is a drug-repurposing platform for female biology, which means that we find the approved drugs that already work for women&rsquo;s health conditions and prove it rigorously enough for a researcher or a clinician to act on, and we do that across three layers.
            </p>
            <p style={p}>
              <strong>The substrate.</strong> A corrected knowledge graph that captures sex-specific pharmacokinetics, cyclical hormonal state, and the cross-condition mechanisms that general platforms miss because they were trained on male-default data, grounded in the standard biomedical ontologies, including MONDO, HPO, RxNorm, and ChEMBL, and extended with female-specific concepts that no existing ontology covers adequately.
            </p>
            <p style={p}>
              <strong>Retrieval and validation.</strong> Provenance-preserving extraction tuned for biomedical literature, in which every claim ties to a verbatim source span, every synthesis is marked as a synthesis, and every contradiction in the underlying literature is shown rather than averaged away, which is both the discipline that the FDA&rsquo;s 21st Century Cures Act §3060 research-support exemption requires and the discipline a clinician needs in order to trust the output.
            </p>
            <p style={p}>
              <strong>Hypothesis from signal.</strong> Patient-community signal, including off-label prescribing patterns, advocacy-organization registries, and structured patient reports, which enters as hypothesis generation and is validated downstream against mechanistic and clinical evidence, never equated with the results of a controlled trial and never discarded, because it is the input that surfaces the hypotheses worth checking.
            </p>
            <p style={p}>
              The result is a set of repurposing candidates with full evidence trails that a researcher can act on. We start where need is greatest and signal is densest, then expand across the biology medicine left understudied. <A href={ENDO}>Endometriosis alone affects about 190 million women</A> and still sees diagnosis delayed by seven to nine years on average, while <A href={PCOS}>PCOS is the most common endocrine disorder</A> in women of reproductive age and up to 70 percent of affected women remain undiagnosed. The biology is real, the drugs are already on pharmacy shelves, and the evidence is waiting to be read; the record was written for the wrong body, and we are correcting it.
            </p>

            <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/candidates" className="btn btn-primary">See the candidates <span className="arr">&rarr;</span></Link>
              <Link href="/access" className="btn btn-ghost">Request access</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
