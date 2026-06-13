import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Whel",
  description:
    "Women's medicine is borrowed medicine. Whel is a drug-repurposing platform for female biology. This is the evidence-led account of why it has to exist, why we start with repurposing, why PMDD is the flagship, and why female biology needs a knowledge graph of its own.",
};

/* External-source link (moss). Every factual claim on this page resolves to a source. */
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--moss)", textDecoration: "underline", textDecorationColor: "rgba(46,61,43,0.4)", textUnderlineOffset: 3 }}>
    {children}
  </a>
);

/* ── Sources ─────────────────────────────────────────────────────────────────
   Authoritative, linkable references for each factual claim, inline below. */
const EXCL77  = "https://www.ncbi.nlm.nih.gov/books/NBK236532/"; // 1977 FDA exclusion policy
const NIH93   = "https://orwh.od.nih.gov/toolkit/recruitment/history"; // NIH Revitalization Act 1993
const GAO     = "https://www.gao.gov/products/gao-01-286r"; // 8 of 10 withdrawn drugs worse for women
const ZOLP    = "https://www.fda.gov/drugs/drug-safety-and-availability/questions-and-answers-risk-next-morning-impairment-after-use-insomnia-drugs-fda-requires-lower"; // zolpidem 2013
const MET     = "https://atm.amegroups.org/article/view/3899/html"; // metformin in PCOS review
const SPIRO   = "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7318446/"; // spironolactone off-label acne
const LEUP    = "https://www.ncbi.nlm.nih.gov/books/NBK551662/"; // leuprolide StatPearls
const ELAG    = "https://pmc.ncbi.nlm.nih.gov/articles/PMC6244606/"; // elagolix first global approval
const SSRI    = "https://www.pharmaceuticalonline.com/doc/fda-approves-sarafem-fluoxetine-hcl-for-preme-0001"; // Sarafem 2000
const LTZ     = "https://www.nejm.org/doi/full/10.1056/NEJMoa1313517"; // Legro NEJM 2014 letrozole
const GLP     = "https://academic.oup.com/ejendo/article/194/3/S25/8488941"; // GLP-1 in PCOS review
const PMDD    = "https://www.frontiersin.org/journals/global-womens-health/articles/10.3389/fgwh.2023.1181583/full"; // PMDD DSM-5 / prevalence
const ECON    = "https://pmc.ncbi.nlm.nih.gov/articles/PMC12766319/"; // repurposing economics review
const FIVE    = "https://www.fda.gov/media/156350/download"; // FDA 505(b)(2) overview
const MARKET  = "https://www.precedenceresearch.com/drug-repurposing-market"; // repurposing market size
const ORPHAN  = "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2025.1670845/full"; // financial orphans / off-patent barriers
const VIAGRA  = "https://pmc.ncbi.nlm.nih.gov/articles/PMC7097805/"; // sildenafil history
const HEALX   = "https://www.pharmaceutical-technology.com/features/healx-ai-drug-repurposing-rare-disease/"; // Healx patient-foundation model
const RECURSION = "https://www.utahbusiness.com/entrepreneurship/2023/07/20/how-chris-gibson-founded-recursion-pharmaceuticals/"; // Recursion founding / repurposing
const WHOENDO = "https://www.who.int/news-room/fact-sheets/detail/endometriosis"; // endometriosis diagnostic delay
const CAUSALY = "https://www.causaly.com/life-science-ai/knowledge-graph"; // general-platform data sources
const LDN_MECH = "https://pmc.ncbi.nlm.nih.gov/articles/PMC3962576/"; // low-dose naltrexone mechanism
const LDN_TRIAL = "https://clinicaltrials.gov/study/NCT03970330"; // LDN endometriosis trial (terminated)
const GABA = "https://pubmed.ncbi.nlm.nih.gov/15228033/"; // gabapentin off-label settlement
const LYRICA = "https://www.drugs.com/history/lyrica.html"; // pregabalin / Lyrica
const LYRICA_REV = "https://www.fiercepharma.com/pharma/lyrica-looking-grim-pfizer-s-blockbuster-faces-crumbling-market-share-after-generic"; // Lyrica peak revenue

const CSS = `
/* ── about page ─────────────────────────────────────────────────────────── */

/* essay layout: sticky TOC + column */
.ab-wrap {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 72px;
  align-items: start;
  padding-top: 88px;
}
.ab-toc { position: sticky; top: 108px; }
.ab-toc-eyebrow {
  font-family: var(--font-plex-mono, monospace);
  font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
  color: #8F8F72; margin-bottom: 18px;
}
.ab-toc a {
  display: flex; gap: 14px; align-items: baseline; padding: 9px 0;
  text-decoration: none; border-top: 1px solid rgba(26,29,20,0.08);
}
.ab-toc a:last-child { border-bottom: 1px solid rgba(26,29,20,0.08); }
.ab-toc .ab-n {
  font-family: var(--font-plex-mono, monospace);
  font-size: 10px; letter-spacing: 0.1em; color: #8F8F72; width: 22px; flex: none;
}
.ab-toc .ab-t {
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: 14.5px; line-height: 1.3; color: #6A6A4E;
}
.ab-toc a:hover .ab-t { color: var(--ink); }

/* section */
.ab-sec { padding-bottom: 88px; }
.ab-sec-head {
  display: flex; align-items: baseline; gap: 20px;
  border-top: 2px solid var(--ink); padding-top: 18px; margin-bottom: 26px;
}
.ab-sec-head .ab-sn {
  font-family: var(--font-plex-mono, monospace);
  font-size: 12px; letter-spacing: 0.18em; color: #97955E;
}
.ab-sec-head h2 {
  font-family: var(--font-newsreader, Georgia, serif);
  font-weight: 500; font-size: clamp(28px, 3vw, 42px);
  letter-spacing: -0.012em; margin: 0; line-height: 1.1;
}

/* prose */
.ab-prose { font-size: 19px; line-height: 1.66; color: var(--body); max-width: 680px; }
.ab-prose p { margin: 0 0 1.25em; }
.ab-prose p:last-child { margin-bottom: 0; }
.ab-prose a { text-decoration-thickness: 1px; }
.ab-lead { font-size: 21px; color: var(--ink); }
.ab-kicker {
  font-family: var(--font-plex-mono, monospace);
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--moss); margin: 38px 0 14px;
}

/* repurposing case ledger - the distinguishing device of this page */
.ab-ledger { border: 1px solid rgba(26,29,20,0.16); margin: 8px 0 28px; max-width: 760px; }
.ab-row {
  display: grid; grid-template-columns: 40px minmax(0,1fr) 132px;
  gap: 22px; padding: 22px 26px;
  border-bottom: 1px solid rgba(26,29,20,0.12); align-items: start;
}
.ab-row:last-child { border-bottom: none; }
.ab-row .ab-rn {
  font-family: var(--font-plex-mono, monospace);
  font-size: 12px; color: #97955E; padding-top: 5px;
}
.ab-rt {
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: 21px; font-weight: 500; line-height: 1.15; margin: 0 0 7px;
}
.ab-rt .ab-arr { color: var(--moss); font-style: normal; }
.ab-rt .ab-to { font-weight: 400; }
.ab-rd { font-size: 15.5px; line-height: 1.55; color: var(--body); margin: 0; }
.ab-rmeta { text-align: right; padding-top: 4px; }
.ab-ryear {
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: 26px; color: var(--moss); line-height: 1; letter-spacing: -0.02em;
}
.ab-rstat {
  font-family: var(--font-plex-mono, monospace);
  font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase;
  color: #6A6A4E; margin-top: 9px; line-height: 1.5;
}

/* stat strip under the exclusion section */
.ab-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(26,29,20,0.12); border: 1px solid rgba(26,29,20,0.12); margin: 6px 0 30px; max-width: 760px; }
.ab-stat { background: var(--bone); padding: 22px 20px; }
.ab-sfig {
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: 34px; font-weight: 500; color: var(--moss); line-height: 1; letter-spacing: -0.02em;
}
.ab-sflag .ab-sfig { color: #7F3D2E; }
.ab-scap {
  font-family: var(--font-plex-mono, monospace);
  font-size: 10px; line-height: 1.55; letter-spacing: 0.03em;
  color: #6A6A4E; margin-top: 12px; text-transform: uppercase;
}

/* contrast device for management-vs-cure */
.ab-split {
  display: grid; grid-template-columns: 1fr 1.3fr;
  border: 1px solid rgba(26,29,20,0.16); margin: 24px 0 8px; background: #FBF8F1; max-width: 760px;
}
.ab-split > div { padding: 26px 28px; }
.ab-cure { border-right: 1px solid rgba(26,29,20,0.16); }
.ab-sk {
  font-family: var(--font-plex-mono, monospace);
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 12px;
}
.ab-cure .ab-sk { color: #8F8F72; }
.ab-whel .ab-sk { color: var(--moss); }
.ab-sq { font-family: var(--font-newsreader, Georgia, serif); font-size: 19px; line-height: 1.4; }
.ab-cure .ab-sq { color: #6A6A4E; }

/* additive-layer band */
.ab-band { background: var(--moss); color: var(--on-ink); }
.ab-band-inner { padding: 72px 0; }
.ab-band blockquote {
  margin: 0; max-width: 30ch;
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: clamp(24px, 2.4vw, 34px); line-height: 1.34; font-weight: 400;
}
.ab-band .ab-src {
  font-family: var(--font-plex-mono, monospace);
  font-size: 11px; letter-spacing: 0.18em; color: #CBD0BE; margin-top: 24px; text-transform: uppercase;
}

/* responsive */
@media (max-width: 1100px) {
  .ab-wrap { grid-template-columns: 1fr; gap: 0; }
  .ab-toc { display: none; }
}
@media (max-width: 720px) {
  .ab-stats { grid-template-columns: repeat(2, 1fr); }
  .ab-row { grid-template-columns: 32px 1fr; }
  .ab-rmeta { grid-column: 2; text-align: left; }
  .ab-rmeta { display: flex; gap: 14px; align-items: baseline; }
  .ab-rstat { margin-top: 0; }
  .ab-split { grid-template-columns: 1fr; }
  .ab-cure { border-right: none; border-bottom: 1px solid rgba(26,29,20,0.16); }
}
`;

export default function AboutPage() {
  return (
    <>
      <style>{CSS}</style>
      <main style={{ background: "var(--bone)" }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="surface-ink" style={{ paddingTop: 44, paddingBottom: 64 }}>
          <div className="container">
            <div style={{ maxWidth: 780 }}>
              <div className="crumbs on-ink">
                <Link href="/">Home</Link>
                <span className="sep">/</span>
                <span className="here">About</span>
              </div>
              <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>About Whel</div>
              <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)", lineHeight: 1.07, maxWidth: "18ch" }}>
                Women&rsquo;s medicine is borrowed medicine.
              </h1>
              <p className="lede" style={{ color: "var(--on-ink-2)", marginTop: 24, maxWidth: "60ch" }}>
                Because drugs were almost never designed for women&rsquo;s conditions, the treatments that
                actually work are mostly borrowed from somewhere else, approved for one thing and
                prescribed off-label for another. This page is the evidence-led account of why Whel
                exists, why we start with repurposing, why PMDD is the flagship, and why female biology
                needs a knowledge graph of its own.
              </p>
            </div>
          </div>
        </section>

        {/* ── Essay ─────────────────────────────────────────────────────────── */}
        <div className="container ab-wrap">

          <aside className="ab-toc" aria-label="Sections">
            <div className="ab-toc-eyebrow">Contents</div>
            <a href="#exclusion"><span className="ab-n">01</span><span className="ab-t">The exclusion</span></a>
            <a href="#repurposing"><span className="ab-n">02</span><span className="ab-t">Why we start with repurposing</span></a>
            <a href="#flagship"><span className="ab-n">03</span><span className="ab-t">Why PMDD is the flagship</span></a>
            <a href="#management"><span className="ab-n">04</span><span className="ab-t">Built for management</span></a>
            <a href="#graph"><span className="ab-n">05</span><span className="ab-t">A graph of its own</span></a>
            <a href="#competitors"><span className="ab-n">06</span><span className="ab-t">What general platforms miss</span></a>
          </aside>

          <div>

            {/* 01 - The exclusion */}
            <section className="ab-sec" id="exclusion">
              <div className="ab-sec-head">
                <span className="ab-sn">01</span>
                <h2>The exclusion</h2>
              </div>
              <div className="ab-prose">
                <p className="ab-lead">
                  The reason women&rsquo;s medicine runs on borrowed drugs is that, for most of the modern
                  era of drug development, women were written out of the part where drugs get designed.
                </p>
                <p>
                  In 1977 the U.S. Food and Drug Administration issued guidance recommending that{" "}
                  <A href={EXCL77}>women of childbearing potential be excluded</A> from early-phase drug
                  trials, a precaution born of the thalidomide era that hardened into a default.
                  For roughly the next two decades, the basic safety and dosing of new drugs was
                  established largely in men, and the conclusions were then prescribed to everyone. The
                  United States did not require the inclusion of women in federally funded clinical
                  research until the{" "}
                  <A href={NIH93}>NIH Revitalization Act of 1993</A>. The same year, the FDA reversed its
                  1977 stance, which means the modern era of actually studying drugs in women is barely
                  three decades old.
                </p>
                <p>
                  This was never only a fairness problem; it was a data problem with measurable
                  consequences. When the Government Accountability Office reviewed the prescription drugs
                  withdrawn from the U.S. market between 1997 and 2000, it found that{" "}
                  <A href={GAO}>eight of the ten posed greater health risks to women</A> than to men. The
                  mechanism is mundane and well documented: women often metabolize drugs differently. In
                  2013 the FDA cut the recommended dose of the sleep drug zolpidem in half for women
                  after data showed they{" "}
                  <A href={ZOLP}>clear it from the body more slowly</A>, leaving morning blood levels high
                  enough to impair driving, two decades after the drug first reached the market.
                </p>
                <div className="ab-stats">
                  <div className="ab-stat">
                    <div className="ab-sfig">1977</div>
                    <div className="ab-scap">FDA guidance excludes women of childbearing potential from early trials</div>
                  </div>
                  <div className="ab-stat">
                    <div className="ab-sfig">1993</div>
                    <div className="ab-scap">First U.S. law requiring women in federally funded research</div>
                  </div>
                  <div className="ab-stat ab-sflag">
                    <div className="ab-sfig">8 / 10</div>
                    <div className="ab-scap">Drugs withdrawn 1997&ndash;2000 carried greater risk for women</div>
                  </div>
                  <div className="ab-stat ab-sflag">
                    <div className="ab-sfig">2013</div>
                    <div className="ab-scap">FDA halves zolpidem dose for women, on a drug sold since the 1990s</div>
                  </div>
                </div>
                <p>
                  Carry that forward and the picture for women&rsquo;s hormonal and reproductive conditions
                  is worse still, because those conditions were not merely under-dosed; they were
                  under-developed. Few drugs were ever designed from the ground up for endometriosis,
                  PCOS, PMDD, adenomyosis, or perimenopause. So the question for women&rsquo;s health is
                  rarely &ldquo;which new molecule cures this?&rdquo; It is &ldquo;which drug that already
                  exists, designed for something else, happens to help, and can we prove it?&rdquo;
                </p>
              </div>
            </section>

            {/* 02 - Why we start with repurposing */}
            <section className="ab-sec" id="repurposing">
              <div className="ab-sec-head">
                <span className="ab-sn">02</span>
                <h2>Why we start with repurposing</h2>
              </div>
              <div className="ab-prose">
                <p className="ab-lead">
                  Women&rsquo;s health is already the largest unstructured drug-repurposing experiment in
                  medicine. Almost everything that works for these conditions was borrowed.
                </p>
                <p>
                  The drugs on the homepage are not Whel&rsquo;s discoveries; they are the public,
                  decades-deep record of what borrowing looks like in practice. Each began life for
                  another organ, another disease, sometimes another sex, and arrived at women&rsquo;s
                  health late, off-label, or by accident. Read as a set, they tell a single story:
                  women&rsquo;s medicine has run on repurposing for decades, and we are the first to treat
                  that as something worth building on.
                </p>
              </div>

              <div className="ab-ledger">
                <div className="ab-row">
                  <div className="ab-rn">01</div>
                  <div>
                    <p className="ab-rt">Metformin <span className="ab-arr">&rarr;</span> <span className="ab-to">PCOS</span></p>
                    <p className="ab-rd">
                      A type-2 diabetes drug in clinical use since the late 1950s. Because PCOS is driven
                      by insulin resistance, metformin lowers insulin and androgen levels and can restore
                      ovulation, yet it is still{" "}
                      <A href={MET}>used off-label, with no PCOS license</A>.
                    </p>
                  </div>
                  <div className="ab-rmeta">
                    <div className="ab-ryear">1957</div>
                    <div className="ab-rstat">Diabetes &middot; off-label</div>
                  </div>
                </div>

                <div className="ab-row">
                  <div className="ab-rn">02</div>
                  <div>
                    <p className="ab-rt">Spironolactone <span className="ab-arr">&rarr;</span> <span className="ab-to">Hormonal acne</span></p>
                    <p className="ab-rd">
                      Approved around 1960 for heart failure and high blood pressure. Its incidental
                      anti-androgen effect made it a dermatology staple for hormonal acne and hirsutism{" "}
                      <A href={SPIRO}>since the 1980s, still with no FDA approval for skin</A>.
                    </p>
                  </div>
                  <div className="ab-rmeta">
                    <div className="ab-ryear">1960</div>
                    <div className="ab-rstat">Cardiac &middot; off-label</div>
                  </div>
                </div>

                <div className="ab-row">
                  <div className="ab-rn">03</div>
                  <div>
                    <p className="ab-rt">GnRH analogues <span className="ab-arr">&rarr;</span> <span className="ab-to">Endometriosis</span></p>
                    <p className="ab-rd">
                      Leuprolide was developed as a{" "}
                      <A href={LEUP}>prostate-cancer therapy</A> and became a mainstay of endometriosis
                      care by shutting down estrogen. Tellingly, elagolix in 2018 was the{" "}
                      <A href={ELAG}>first oral drug developed for endometriosis in over a decade</A>,
                      proof of how starved the field has been of dedicated development.
                    </p>
                  </div>
                  <div className="ab-rmeta">
                    <div className="ab-ryear">1985</div>
                    <div className="ab-rstat">Oncology &middot; repurposed</div>
                  </div>
                </div>

                <div className="ab-row">
                  <div className="ab-rn">04</div>
                  <div>
                    <p className="ab-rt">SSRIs <span className="ab-arr">&rarr;</span> <span className="ab-to">PMDD</span></p>
                    <p className="ab-rd">
                      Fluoxetine was an antidepressant first. In 2000 the identical molecule was{" "}
                      <A href={SSRI}>re-approved as Sarafem for PMDD</A> (same drug, new indication, new
                      pill), and in PMDD it appears to work through rapid neurosteroid modulation, not the
                      slow serotonin reuptake mechanism it was designed around.
                    </p>
                  </div>
                  <div className="ab-rmeta">
                    <div className="ab-ryear">2000</div>
                    <div className="ab-rstat">Psychiatry &middot; repurposed</div>
                  </div>
                </div>

                <div className="ab-row">
                  <div className="ab-rn">05</div>
                  <div>
                    <p className="ab-rt">Letrozole <span className="ab-arr">&rarr;</span> <span className="ab-to">PCOS infertility</span></p>
                    <p className="ab-rd">
                      A breast-cancer aromatase inhibitor. A{" "}
                      <A href={LTZ}>landmark 2014 NEJM trial</A> showed it produced more live births than
                      clomiphene, the old standard, for women with PCOS, and it is now first-line for
                      ovulation induction, still off-label.
                    </p>
                  </div>
                  <div className="ab-rmeta">
                    <div className="ab-ryear">2014</div>
                    <div className="ab-rstat">Oncology &middot; off-label</div>
                  </div>
                </div>

                <div className="ab-row">
                  <div className="ab-rn">06</div>
                  <div>
                    <p className="ab-rt">GLP-1 agonists <span className="ab-arr">&rarr;</span> <span className="ab-to">PCOS</span></p>
                    <p className="ab-rd">
                      Diabetes and obesity drugs now under active study for PCOS, where{" "}
                      <A href={GLP}>reviews report improved insulin resistance and weight</A>. The newest
                      case in the same pattern: a drug built for one metabolic problem being pulled toward
                      a women&rsquo;s condition it was never designed for.
                    </p>
                  </div>
                  <div className="ab-rmeta">
                    <div className="ab-ryear">2020s</div>
                    <div className="ab-rstat">Metabolic &middot; emerging</div>
                  </div>
                </div>
              </div>

              <div className="ab-prose">
                <div className="ab-kicker">Why repurposing is the next frontier</div>
                <p>
                  Starting here also tracks where drug development itself is heading. Developing a
                  brand-new drug typically costs well over a billion dollars, takes ten to seventeen
                  years, and fails roughly nine times out of ten. A repurposed drug starts from an
                  established human safety record, so it{" "}
                  <A href={ECON}>reaches patients faster, at a fraction of the cost, and is approved at
                  far higher rates</A>. Regulators built a lane for exactly this: the FDA&rsquo;s{" "}
                  <A href={FIVE}>505(b)(2) pathway</A> lets a sponsor lean on existing safety data for an
                  approved ingredient and begin clinical work for a new indication much closer to the
                  finish line.
                </p>
                <p>
                  The market reflects the same logic. Drug repurposing was worth roughly{" "}
                  <A href={MARKET}>36 billion dollars in 2025 and is forecast to keep climbing through the
                  next decade</A>. Almost all of that effort, though, points back at the conditions the
                  wider industry already prioritizes. The borrowing that built women&rsquo;s health
                  happened in the open, over decades, in off-label prescribing, in trial registries, in
                  adverse-event databases, and in the communities where patients log what helps. The
                  signal is sitting there. What has been missing is a system that reads it for female
                  biology and proves it rigorously enough to act on. That is where we start.
                </p>
              </div>
            </section>

            {/* 03 - Why PMDD is the flagship */}
            <section className="ab-sec" id="flagship">
              <div className="ab-sec-head">
                <span className="ab-sn">03</span>
                <h2>Why PMDD is the flagship</h2>
              </div>
              <div className="ab-prose">
                <p className="ab-lead">
                  We chose premenstrual dysphoric disorder as the first condition to build in depth
                  because it is where the method is hardest to fake and easiest to prove.
                </p>
                <p>
                  PMDD is severe, common, and recent. It affects an estimated{" "}
                  <A href={PMDD}>1.8 to 5.8 percent of menstruating women</A>{" "}and was only added as a
                  formal diagnosis to the DSM-5 in 2013, after decades in the manual&rsquo;s appendix.
                  That lateness is the point: a condition recognized this recently has a thin, scattered
                  evidence base, which is exactly the terrain where a system that reads evidence carefully
                  earns its keep.
                </p>
                <p>
                  It is also the cleanest possible test of the substrate, because PMDD is cyclical by
                  definition. Symptoms track the luteal phase and lift with menstruation, which means the
                  right question is never just &ldquo;does this drug help?&rdquo; but &ldquo;does it help
                  at the right point in the cycle, at the right dose, for the right person?&rdquo; A
                  platform that cannot represent cyclical hormonal state cannot reason about PMDD at all.
                  Building it here forces the substrate to handle the thing male-default graphs ignore.
                </p>
                <p>
                  And the signal is dense. PMDD has large, articulate patient communities that record, in
                  fine detail and in real time, what they take and when it works, the off-label reality
                  the formal literature has not yet caught up to. If the method works anywhere, it works
                  here first, and what we learn building PMDD transfers to the conditions next in line.
                </p>
              </div>
            </section>

            {/* 04 - Built for management */}
            <section className="ab-sec" id="management">
              <div className="ab-sec-head">
                <span className="ab-sn">04</span>
                <h2>Built for management</h2>
              </div>
              <div className="ab-prose">
                <p className="ab-lead">
                  Whel and the other AI-native drug-repurposing companies run on similar machinery. What
                  sets us apart is the medical model that machinery is built to serve.
                </p>
                <p>
                  Most drug discovery is built to chase cures. Its engines are tuned to find the single
                  molecule that can eliminate a disease, because for cancer and rare genetic disorders a
                  cure for a fatal condition is the blockbuster. That model is sound for what it targets,
                  and it is where the AI drug-discovery companies point their engines. It simply does not
                  fit most of women&rsquo;s health.
                </p>
                <p>
                  Endometriosis, PCOS, PMDD, adenomyosis, perimenopause, and vulvodynia are rarely cured.
                  They are lived with and managed over years. They are rarely fatal but routinely
                  life-debilitating, reshaping careers, relationships, and decades of daily function
                  without ever showing up on a mortality table. Managing a chronic, non-fatal condition
                  is a different kind of problem, and it needs a different evidence base.
                </p>
                <div className="ab-split">
                  <div className="ab-cure">
                    <div className="ab-sk">Cure model</div>
                    <div className="ab-sq">&ldquo;Which molecule erases the disease?&rdquo;</div>
                  </div>
                  <div className="ab-whel">
                    <div className="ab-sk">Whel&rsquo;s model</div>
                    <div className="ab-sq">&ldquo;Which existing drug makes this condition livable, at what dose, in which phase of the cycle, for which person?&rdquo;</div>
                  </div>
                </div>
                <p>
                  There is a structural reason a blockbuster engine looks past these drugs, and it is
                  financial before it is clinical. Pharma recoups its enormous development bills through
                  patent-protected exclusivity, so the candidates worth a company&rsquo;s attention are
                  the ones it can own. Most of the drugs that already manage women&rsquo;s conditions are
                  cheap, off-patent generics. The repurposing literature has a name for them:{" "}
                  <A href={ORPHAN}>financial orphans</A>, clinically valuable and commercially
                  unattractive, left unstudied because no one can profit from confirming what they do.
                  Public money funds early research but rarely the confirmatory trials, which is part of
                  why the odds of a repurposed generic reaching a new approved use sit{" "}
                  <A href={ORPHAN}>below 30 percent</A> even when the science holds up.
                </p>
                <p>
                  Sildenafil shows the same rule from the other side. It was developed for angina,
                  underperformed at the heart, and was{" "}
                  <A href={VIAGRA}>brought to market in 1998 as Viagra</A>. It cures nothing, yet by
                  making a non-fatal condition livable it became one of the largest drug franchises in
                  history, and it got developed precisely because it was a new, ownable molecule. The
                  drugs that could do the same for endometriosis or PMDD are mostly generics no one can
                  own, so a blockbuster-tuned engine has no reason to surface them.
                </p>
                <p>
                  History makes the point from the losing side too. Gabapentin was approved for epilepsy
                  in 1993, and within a few years most of its prescriptions were off-label, for nerve
                  pain, fibromyalgia, and mood, uses found in practice rather than in trials. Its maker
                  chose to <A href={GABA}>promote those uses illegally</A> rather than formally develop
                  them, and paid a 430 million dollar settlement in 2004. The clinical value had been
                  real all along. What the model needed was an ownable version, and once Pfizer had one
                  it acted: pregabalin, sold as <A href={LYRICA}>Lyrica</A> and approved for the same
                  pain and fibromyalgia indications gabapentin was already treating, a drug that went on
                  to earn <A href={LYRICA_REV}>around five billion dollars a year</A> at its peak. The
                  drugs that manage women&rsquo;s conditions are mostly generics with no such successor
                  waiting.
                </p>
                <p>
                  That is the consequence of the model difference. A platform scoring drug-disease pairs
                  by their potential to cure, and by their potential to be owned, will rank a drug that
                  manages endometriosis for millions of women as a near-miss. We rank it as the result.
                  The same logic is why we read patient-community reports as evidence: managed conditions
                  are the ones where people record, month after month, what helps them get through the
                  week, and these communities accumulate practical knowledge years ahead of the
                  literature. We structure that record and test it against mechanistic and clinical
                  evidence, never mistaking it for proof and never discarding it as noise.
                </p>
                <p>
                  Reading community signal this way is how the leading repurposing companies were built.{" "}
                  <A href={HEALX}>Healx</A> grounded its rare-disease discovery in formal patient-foundation
                  partnerships, and <A href={RECURSION}>Recursion</A> grew out of a rare-disease
                  repurposing effort shaped by the community it served. Both leaned on organized
                  foundations with registries and boards. Women&rsquo;s communities are far larger and
                  almost entirely informal, living on forums and in advocacy groups, and they hold
                  something institutional databases never recorded: the place where women confirm a
                  symptom is real years before a diagnosis arrives, in a field where{" "}
                  <A href={WHOENDO}>endometriosis alone takes years to identify</A>. That signal has never
                  been read at scale. Reading it, and crediting the people who recorded it, is where our
                  work begins.
                </p>
              </div>
            </section>

            {/* 05 - A graph of its own */}
            <section className="ab-sec" id="graph">
              <div className="ab-sec-head">
                <span className="ab-sn">05</span>
                <h2>A graph of its own</h2>
              </div>
              <div className="ab-prose">
                <p className="ab-lead">
                  All of this is why female biology deserves a knowledge graph entirely separate from the
                  male-default graphs the rest of the field reasons over.
                </p>
                <p>
                  Every AI drug-discovery platform reasons over a knowledge graph, a structured map of how
                  drugs, targets, pathways, and diseases connect. Those graphs were assembled from the
                  same literature that under-studied women, so they inherit its priors: doses set in male
                  tissue, mechanisms worked out without cyclical hormonal state, conditions that are
                  thinly represented because they were thinly funded. Adding a &ldquo;women&rsquo;s
                  health filter&rdquo; on top of that substrate does not fix the substrate. The errors are
                  underneath the filter.
                </p>
                <p>
                  So we are building the corrected version from the ground up, grounded in the same
                  standard biomedical ontologies the field trusts (MONDO, HPO, RxNorm, ChEMBL) and then
                  extended with the female-specific concepts no existing ontology captures adequately:
                  sex-divergent pharmacokinetics, cyclical hormonal state, and the cross-condition
                  mechanisms that only become visible once you stop treating the male body as the default.
                </p>
                <p>
                  This is meant as an additive layer to pharma, not a competitor to it. The rest of the
                  field is mapping the biology it was built to see; we are correcting and completing the
                  half of it that was left out. A fuller account of the architecture, how each signal is
                  graded, and the external resources we build on is on the{" "}
                  <Link href="/about/technical-architecture" style={{ color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 3 }}>technical architecture</Link>{" "}and{" "}
                  <Link href="/about/external-references" style={{ color: "var(--moss)", textDecoration: "underline", textUnderlineOffset: 3 }}>external references</Link>{" "}pages.
                </p>
              </div>
            </section>

            {/* 06 - What general platforms miss */}
            <section className="ab-sec" id="competitors">
              <div className="ab-sec-head">
                <span className="ab-sn">06</span>
                <h2>What general platforms miss</h2>
              </div>
              <div className="ab-prose">
                <p className="ab-lead">
                  A fair question from anyone who knows the field: could a general-purpose biomedical
                  platform just query endometriosis in the graph it already has? On three counts, it
                  would be looking in the wrong places.
                </p>
                <p>
                  <strong>The sources.</strong>{" "}The large biomedical AI platforms read the institutional
                  record. Causaly, for one, ingests{" "}
                  <A href={CAUSALY}>PubMed, MEDLINE, the trial registries, and patent filings</A>, which
                  is the right diet for most of biology. It is the wrong diet for conditions medicine
                  left to off-label practice, because there the earliest and densest signal lives in
                  patient communities no general platform reads.
                </p>
                <p>
                  <strong>The variables.</strong>{" "}A general knowledge graph holds a drug and a disease
                  as a fixed relationship. Female pharmacology moves: drug metabolism and immune
                  signaling shift across the menstrual cycle, and a condition like PMDD is defined by
                  that timing. A platform that asks whether a drug affects a pathway, without asking how
                  that changes across the cycle, passes over the candidates where the timing is the
                  whole insight.
                </p>
                <p>
                  <strong>The candidates.</strong>{" "}General platforms serve pharma R&amp;D teams whose
                  budgets run on oncology, neuroscience, and immunology, and whose candidates have to be
                  ownable. A cheap generic that manages a women&rsquo;s condition is a{" "}
                  <A href={ORPHAN}>financial orphan</A>, clinically valuable and commercially
                  uninteresting. Whel is built for a different audience, women&rsquo;s health
                  researchers, emerging biotech teams, advocacy organizations, and public funders, and
                  our ranking follows their priorities.
                </p>
                <p>
                  Low-dose naltrexone for endometriosis sits at the intersection of all three. At low
                  doses naltrexone appears to <A href={LDN_MECH}>quiet the glial inflammation</A> behind
                  chronic pain, by a mechanism unrelated to the addiction treatment it was approved for,
                  and women have documented its effects in endometriosis communities for years, often
                  noting how the response tracks their cycle. The institutional evidence is thin and
                  unresolved: the one randomized endometriosis trial was{" "}
                  <A href={LDN_TRIAL}>terminated with nine patients enrolled</A>, and it is a generic no
                  company can profit from confirming. A general platform ranks it near the bottom, or
                  never reads the signal at all. We surface it, with its contradictions and uncertainty
                  shown rather than smoothed away, because the signal and the mechanism are both real and
                  no one else is reading them together.
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* ── Additive-layer band ───────────────────────────────────────────── */}
        <section className="ab-band">
          <div className="container ab-band-inner">
            <blockquote>
              The record was written for the wrong body. We are reading it back, correcting it, and
              completing it.
            </blockquote>
            <div className="ab-src">Whel &middot; an additive layer to pharma</div>
          </div>
        </section>

        {/* ── Continue ──────────────────────────────────────────────────────── */}
        <section className="surface-bone" style={{ paddingTop: 56, paddingBottom: 72 }}>
          <div className="container">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href="/manifesto" className="btn btn-primary">Read the manifesto <span className="arr">&rarr;</span></Link>
              <Link href="/about/technical-architecture" className="btn btn-ghost">How we score evidence</Link>
              <Link href="/access" className="btn btn-ghost">Request access</Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
