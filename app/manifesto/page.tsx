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

const AI = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--signal)", textDecoration: "underline", textUnderlineOffset: 2 }}>
    {children}
  </a>
);

const NIH       = "https://orwh.od.nih.gov/toolkit/recruitment/history";
const BIAS      = "https://pmc.ncbi.nlm.nih.gov/articles/PMC6877896/";
const ADR       = "https://pubmed.ncbi.nlm.nih.gov/32503637/";
const GAO       = "https://www.gao.gov/products/gao-01-286r";
const OFFLABEL  = "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8987152/";
const PCOS      = "https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome";
const ENDO      = "https://www.who.int/news-room/fact-sheets/detail/endometriosis";
const VIAGRA    = "https://pmc.ncbi.nlm.nih.gov/articles/PMC7097805/";
const VIAGRA_REV = "https://www.statista.com/statistics/264827/pfizers-worldwide-viagra-revenue-since-2003/";
const FIVEOHFIVE = "https://www.sciencedirect.com/science/article/abs/pii/S0022354923001508";
const FUNDING   = "https://intuitionlabs.ai/articles/ai-biotech-funding-trends";
const HEALX     = "https://www.pharmaceutical-technology.com/features/healx-ai-drug-repurposing-rare-disease/";
const RECURSION = "https://www.utahbusiness.com/entrepreneurship/2023/07/20/how-chris-gibson-founded-recursion-pharmaceuticals/";
const CAUSALY   = "https://www.causaly.com/life-science-ai/knowledge-graph";
const LDN_MECH  = "https://pmc.ncbi.nlm.nih.gov/articles/PMC3962576/";
const LDN_TRIAL = "https://clinicaltrials.gov/study/NCT03970330";
const GABA      = "https://pubmed.ncbi.nlm.nih.gov/15228033/";
const LYRICA    = "https://www.drugs.com/history/lyrica.html";
const LYRICA_REV = "https://www.fiercepharma.com/pharma/lyrica-looking-grim-pfizer-s-blockbuster-faces-crumbling-market-share-after-generic";

const CSS = `
/* ── manifesto page ─────────────────────────────────────────────────────── */

/* hero */
.mf-hero {
  background: var(--ink);
  color: var(--on-ink);
  position: relative;
  overflow: hidden;
}
.mf-hero-motif {
  position: absolute;
  right: -120px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.5;
  pointer-events: none;
}
.mf-hero-inner {
  position: relative;
  padding: 86px 0 110px;
}
.mf-crumbs {
  font-family: var(--font-plex-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #8C9180;
  margin-bottom: 56px;
}
.mf-crumbs a { color: #8C9180; text-decoration: none; }
.mf-crumbs .mf-here { color: #CBD0BE; }
.mf-eyebrow {
  font-family: var(--font-plex-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--signal);
  margin-bottom: 16px;
}
.mf-hero h1 {
  font-family: var(--font-newsreader, Georgia, serif);
  font-weight: 400;
  font-size: clamp(54px, 6.4vw, 104px);
  line-height: 1.04;
  letter-spacing: -0.018em;
  margin: 24px 0 0;
  max-width: 12ch;
  color: var(--on-ink);
}
.mf-hero h1 em { font-style: italic; color: var(--signal); }
.mf-hero-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-top: 84px;
  border-top: 1px solid rgba(244,239,230,0.08);
  padding-top: 26px;
  font-family: var(--font-plex-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.18em;
  color: #8C9180;
}
.mf-hero-foot .mf-read { color: #CBD0BE; }

/* layout */
.mf-essay-wrap {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 72px;
  align-items: start;
  padding-top: 96px;
}

/* table of contents */
.mf-toc { position: sticky; top: 108px; }
.mf-toc-eyebrow {
  font-family: var(--font-plex-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #8F8F72;
  margin-bottom: 18px;
}
.mf-toc a {
  display: flex;
  gap: 14px;
  align-items: baseline;
  padding: 9px 0;
  text-decoration: none;
  border-top: 1px solid rgba(26,29,20,0.07);
}
.mf-toc a:last-child { border-bottom: 1px solid rgba(26,29,20,0.07); }
.mf-toc .mf-n {
  font-family: var(--font-plex-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #8F8F72;
  width: 22px;
  flex: none;
}
.mf-toc .mf-t {
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: 14.5px;
  line-height: 1.3;
  color: #6A6A4E;
}
.mf-toc a:hover .mf-t { color: var(--ink); }

/* section */
.mf-sec {
  display: grid;
  grid-template-columns: minmax(0, 680px) 224px;
  row-gap: 20px;
  column-gap: 72px;
  padding-bottom: 96px;
}
.mf-sec-head {
  grid-column: 1 / -1;
  display: flex;
  align-items: baseline;
  gap: 20px;
  border-top: 2px solid var(--ink);
  padding-top: 18px;
  margin-bottom: 20px;
}
.mf-sec-head .mf-n {
  font-family: var(--font-plex-mono, monospace);
  font-size: 12px;
  letter-spacing: 0.18em;
  color: #97955E;
}
.mf-sec-head h2 {
  font-family: var(--font-newsreader, Georgia, serif);
  font-weight: 500;
  font-size: clamp(30px, 3vw, 44px);
  letter-spacing: -0.012em;
  margin: 0;
  line-height: 1.1;
}

/* prose */
.mf-prose { font-size: 20px; line-height: 1.66; color: var(--body); }
.mf-prose p { margin: 0 0 1.25em; }
.mf-prose p:last-child { margin-bottom: 0; }
.mf-prose p a { color: var(--moss); text-decoration-color: rgba(46,61,43,0.4); text-underline-offset: 3px; }
.mf-prose p a:hover { text-decoration-color: var(--moss); }
.mf-dropcap::first-letter {
  font-size: 4.6em;
  float: left;
  line-height: 0.82;
  padding: 6px 14px 0 0;
  color: var(--moss);
  font-weight: 500;
}

/* marginalia */
.mf-marg { display: flex; flex-direction: column; gap: 22px; }
.mf-stat { border-top: 1px solid rgba(26,29,20,0.14); padding-top: 14px; }
.mf-fig {
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: 46px;
  font-weight: 500;
  line-height: 1;
  color: var(--moss);
  letter-spacing: -0.02em;
}
.mf-fig sup { font-size: 0.45em; }
.mf-cap {
  font-family: var(--font-plex-mono, monospace);
  font-size: 10.5px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: #6A6A4E;
  margin-top: 10px;
  text-transform: uppercase;
}
.mf-flag .mf-fig { color: #7F3D2E; }

/* pull-quote band */
.mf-band { background: var(--moss); color: var(--on-ink); }
.mf-band-inner {
  padding: 88px 0;
  display: grid;
  grid-template-columns: 200px minmax(0,1fr);
  gap: 72px;
}
.mf-mark {
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: 120px;
  line-height: 0.6;
  color: var(--signal);
  opacity: 0.85;
}
.mf-band blockquote {
  margin: 0;
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: clamp(26px, 2.6vw, 38px);
  line-height: 1.32;
  letter-spacing: -0.01em;
  max-width: 26ch;
  font-weight: 400;
}
.mf-src {
  font-family: var(--font-plex-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.18em;
  color: #CBD0BE;
  margin-top: 28px;
  text-transform: uppercase;
}

/* question contrast device */
.mf-qsplit {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  border: 1px solid rgba(26,29,20,0.14);
  margin: 10px 0 34px;
  background: #FBF8F1;
}
.mf-qsplit > div { padding: 30px 32px; }
.mf-not { border-right: 1px solid rgba(26,29,20,0.14); }
.mf-qk {
  font-family: var(--font-plex-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.mf-not .mf-qk { color: #8F8F72; }
.mf-but .mf-qk { color: var(--moss); }
.mf-qq {
  font-family: var(--font-newsreader, Georgia, serif);
  font-size: 22px;
  line-height: 1.4;
}
.mf-not .mf-qq { color: #6A6A4E; text-decoration: line-through; text-decoration-color: rgba(26,29,20,0.25); text-decoration-thickness: 1px; }
.mf-but { border-top: 2px solid var(--moss); margin-top: -1px; }

/* shifts */
.mf-shift { border-left: 2px solid #97955E; padding: 4px 0 4px 30px; margin: 0 0 36px; }
.mf-shift:last-child { margin-bottom: 0; }
.mf-sk {
  font-family: var(--font-plex-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.22em;
  color: #97955E;
  margin-bottom: 14px;
  text-transform: uppercase;
}

/* layer cards (bone surface) */
.mf-layers { display: flex; flex-direction: column; margin: 40px 0 44px; border: 1px solid rgba(26,29,20,0.14); }
.mf-layer { display: grid; grid-template-columns: 120px minmax(0,1fr); gap: 28px; padding: 30px 32px; border-bottom: 1px solid rgba(26,29,20,0.14); }
.mf-layer:last-child { border-bottom: none; }
.mf-ln { font-family: var(--font-plex-mono, monospace); font-size: 11px; letter-spacing: 0.18em; color: var(--muted); padding-top: 6px; text-transform: uppercase; }
.mf-ln b { display: block; font-weight: 400; color: var(--moss); font-size: 22px; font-family: var(--font-newsreader, Georgia, serif); letter-spacing: 0; margin-top: 8px; }
.mf-layer h3 { font-family: var(--font-newsreader, Georgia, serif); font-size: 23px; font-weight: 600; margin: 0 0 10px; color: var(--ink); }
.mf-layer p { margin: 0; font-size: 18px; line-height: 1.62; color: var(--body); }

/* buttons on ink surface */
.mf-btn-ink {
  font-family: var(--font-plex-mono, monospace);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border: 1px solid;
  cursor: pointer;
  color: var(--ink);
  background: var(--bone);
  border-color: var(--bone);
  transition: opacity 140ms;
}
.mf-btn-ink:hover { opacity: 0.88; }
.mf-btn-ghost-ink {
  font-family: var(--font-plex-mono, monospace);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border: 1px solid rgba(244,239,230,0.15);
  cursor: pointer;
  color: var(--on-ink);
  background: transparent;
  transition: border-color 140ms;
}
.mf-btn-ghost-ink:hover { border-color: #CBD0BE; }
.mf-cta-row { display: flex; gap: 14px; margin-top: 44px; flex-wrap: wrap; }

/* scroll reveal — no-op; class kept on elements for future use */

/* responsive */
@media (max-width: 1100px) {
  .mf-essay-wrap { grid-template-columns: 1fr; gap: 0; }
  .mf-toc { display: none; }
  .mf-sec { grid-template-columns: 1fr; gap: 0; }
  .mf-marg { flex-direction: row; flex-wrap: wrap; gap: 32px; margin-top: 40px; }
  .mf-stat { min-width: 150px; }
  .mf-band-inner { grid-template-columns: 1fr; gap: 28px; }
  .mf-hero-motif { opacity: 0.22; }
}
@media (max-width: 720px) {
  .mf-qsplit { grid-template-columns: 1fr; }
  .mf-not { border-right: none; border-bottom: 1px solid rgba(26,29,20,0.14); }
  .mf-layer { grid-template-columns: 1fr; gap: 12px; }
  .mf-hero-inner { padding: 56px 0 72px; }
}
`;

export default function ManifestoPage() {
  return (
    <>
      <style>{CSS}</style>
      <main style={{ background: "var(--bone)" }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="surface-ink" style={{ paddingTop: 44, paddingBottom: 60 }}>
          <div className="container">
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
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

        {/* ── Essay: TOC + Sections 00 – 02 ────────────────────────────────── */}
        <div className="container mf-essay-wrap">

          <aside className="mf-toc" aria-label="Sections">
            <div className="mf-toc-eyebrow">Contents</div>
            <a href="#s0"><span className="mf-n">00</span><span className="mf-t">Medicine was built on the male body</span></a>
            <a href="#s1"><span className="mf-n">01</span><span className="mf-t">The treatments already exist</span></a>
            <a href="#s2"><span className="mf-n">02</span><span className="mf-t">Built for management</span></a>
            <a href="#s3"><span className="mf-n">03</span><span className="mf-t">Why now</span></a>
            <a href="#s4"><span className="mf-n">04</span><span className="mf-t">What Whel is</span></a>
          </aside>

          <div>

            {/* 00 — intro */}
            <section className="mf-sec" id="s0">
              <div className="mf-prose mf-rise">
                <p className="mf-dropcap">
                  Modern medicine was built on the male body and then prescribed to everyone else. For most of the twentieth century, women of childbearing potential were kept out of clinical trials on the rationale of protecting a possible pregnancy, and the United States did not require women in federally funded clinical research until the <A href={NIH}>NIH Revitalization Act of 1993</A>, so the evidence base underlying prescribing decisions was built for generations almost entirely on men.
                </p>
                <p>
                  This bias runs far beyond clinical trials. In pharmacology research, male animals still outnumber females by roughly five to one, and only about <A href={BIAS}>15 percent of studies include both sexes</A>. As such, the basic pharmacology of many drugs was worked out in male tissue long before a woman ever received a prescription.
                </p>
                <p>
                  The cost of this is measurable. When doses are set on bodies that are not theirs, women are overmedicated and experience adverse drug reactions <A href={ADR}>nearly twice as often as men</A>. The pattern is not subtle once anyone looks for it: when the Government Accountability Office examined the prescription drugs pulled from the United States market in the years around the turn of the century, it found that <A href={GAO}>eight of the ten</A> posed greater health risks to women than to men. For decades, half the population has taken medicine designed around the other half, and the harm of this has been visible in the data the entire time.
                </p>
                <p>
                  That record is also the only record there is. Every database a tool like this could draw on inherits the same gap, because all of them were built from the same under-studied literature. What separates one tool from another is whether it shows you where the evidence runs out or fills that silence with a confident guess. We built Whel to show it.
                </p>
              </div>
              <div className="mf-marg mf-rise">
                <div className="mf-stat">
                  <div className="mf-fig">1993</div>
                  <div className="mf-cap">U.S. did not require women in federally funded clinical research until the NIH Revitalization Act</div>
                </div>
                <div className="mf-stat">
                  <div className="mf-fig">5 : 1</div>
                  <div className="mf-cap">Male animals still outnumber females in pharmacology research</div>
                </div>
                <div className="mf-stat mf-flag">
                  <div className="mf-fig">2×</div>
                  <div className="mf-cap">Women experience adverse drug reactions nearly twice as often as men</div>
                </div>
                <div className="mf-stat mf-flag">
                  <div className="mf-fig">8 / 10</div>
                  <div className="mf-cap">Drugs pulled from the U.S. market posed greater health risks to women than to men</div>
                </div>
              </div>
            </section>

            {/* 01 — the treatments already exist */}
            <section className="mf-sec" id="s1">
              <div className="mf-sec-head mf-rise">
                <span className="mf-n">01</span>
                <h2>The treatments already exist</h2>
              </div>
              <div className="mf-prose mf-rise">
                <p>
                  In many women&rsquo;s health conditions, the drugs that help already exist. They are approved for something else, prescribed off label, and working in millions of cases that the evidence base never formally recorded. This is not an edge case, but rather, is standard care.
                </p>
                <p>
                  The examples are routine. Premenstrual dysphoric disorder and menopausal symptoms are commonly managed with antidepressants prescribed <A href={OFFLABEL}>off label</A>. Insulin resistance in <A href={PCOS}>polycystic ovary syndrome</A> is managed with metformin, a diabetes drug, and GnRH antagonists first developed for prostate cancer are now standard treatment for <A href={ENDO}>endometriosis</A>{" "}pain. Women&rsquo;s medicine has run on repurposing for decades, but no one has treated that reality as something worth taking seriously.
                </p>
                <p>
                  The most famous repurposed drug shows what happens when someone does. Sildenafil was developed for angina; it underperformed at the heart and produced an unexpected effect. <A href={VIAGRA}>Pfizer brought it to market in 1998 as Viagra</A>. It cured nothing, but by managing a condition men simply live with, it became one of the largest drug franchises in history.
                </p>
              </div>
              <div className="mf-marg mf-rise">
                <div className="mf-stat">
                  <div className="mf-fig">1998</div>
                  <div className="mf-cap">Sildenafil, developed for angina, brought to market as Viagra — one of the largest drug franchises in history</div>
                </div>
              </div>
            </section>

            {/* 02 — built for management */}
            <section className="mf-sec" id="s2">
              <div className="mf-sec-head mf-rise">
                <span className="mf-n">02</span>
                <h2>Built for management</h2>
              </div>
              <div className="mf-prose mf-rise">
                <p>
                  Drug discovery is built to chase cures, not management. Its engines are tuned to find the single drug that can eliminate a disease. That model fits cancer and rare genetic disorders, and it is where the AI drug-discovery companies point their engines, since a cure for a fatal disease is the blockbuster.
                </p>
                <p>
                  Women&rsquo;s health does not fit this template. Conditions such as endometriosis, PCOS, PMDD, adenomyosis, perimenopause, and vulvodynia are not neatly curable; they are lived with and managed over years. They are rarely fatal but routinely life-debilitating, and reshape careers, relationships, and decades of life without showing up on mortality tables.
                </p>
                <p>
                  Management is a different question and therefore needs a different evidence base. The relevant question here is not &ldquo;Which molecule erases the disease?&rdquo; but &ldquo;Which existing drug makes this condition livable, at what dose, in which phase of the cycle, and for which person?&rdquo;
                </p>
                <div className="mf-qsplit">
                  <div className="mf-not">
                    <div className="mf-qk">Not</div>
                    <div className="mf-qq">&ldquo;Which molecule erases the disease?&rdquo;</div>
                  </div>
                  <div className="mf-but">
                    <div className="mf-qk">But</div>
                    <div className="mf-qq">&ldquo;Which existing drug makes this condition livable, at what dose, in which phase of the cycle, and for which person?&rdquo;</div>
                  </div>
                </div>
                <p>
                  The answers to these questions live in places cure-hunting engines ignore: off-label prescribing patterns, small trials that track daily function rather than remission, and patient communities where women record, month after month, what has helped them get through the week.
                </p>
                <p>
                  That last source is real evidence and we treat it as such. Patient communities accumulate practical knowledge years ahead of the literature, and in women&rsquo;s health they carry something more: they are where women confirm a symptom is real long before the medical system does, in a field where <A href={ENDO}>endometriosis still takes years to diagnose</A>. The off-label drugs that already help these conditions were largely found this way, in clinical practice and patient report, before formal research arrived.
                </p>
                <p>
                  Reading that signal is how this category was built in the first place. <A href={HEALX}>Healx</A> grounded its rare-disease discovery in formal patient-foundation partnerships, and <A href={RECURSION}>Recursion</A>{" "}grew out of a rare-disease repurposing effort shaped by the community it served. Both leaned on organized foundations with registries and boards. Women&rsquo;s communities are far larger and almost entirely informal, scattered across forums, advocacy groups, and waiting-room conversation, which is why the signal has never been read at scale. We read it, structure it, and test it against mechanistic and clinical data, crediting the community it came from, never mistaking it for proof on its own and never discarding it as noise.
                </p>
                <p>
                  This is not a niche market. Women are half the population and these conditions are common. Endometriosis affects roughly <A href={ENDO}>one in ten women</A> of reproductive age, <A href={PCOS}>PCOS affects a comparable share</A>, and every woman who lives long enough reaches menopause. Yet managing chronic, non-fatal conditions has never had the prestige of curing cancer or rare disease, so attention and capital flow away. The result is a large, proven market that almost no one is building for, even as <A href={VIAGRA_REV}>Viagra has earned billions of dollars a year</A> at its peak by managing a condition that kills no one.
                </p>
                <p>
                  A platform tuned to find cures reads all of this as noise, but we read it as the data, because an engine built to find oncology blockbusters will reliably find oncology blockbusters, while the drug that manages endometriosis for millions of women is the kind of result it is not built to see, and that result is the one we are built to find.
                </p>
                <p>
                  History shows the pattern plainly. Gabapentin was approved for epilepsy in 1993, and within a few years most of its prescriptions were off label, for nerve pain, fibromyalgia, migraine, and mood, because clinicians and patients had found uses the drug was never developed for. Its maker did not run the trials to formalize those uses; it promoted them illegally instead, and paid a <A href={GABA}>430 million dollar settlement</A> in 2004. The management value had been real the entire time. What the blockbuster model could not find in gabapentin was something to own, and so it looked past the drug until an ownable version existed: Pfizer developed a patented successor, pregabalin, and won approval to sell it as <A href={LYRICA}>Lyrica</A> for the same pain and fibromyalgia indications gabapentin was already treating off label, a franchise that went on to earn <A href={LYRICA_REV}>around five billion dollars a year</A> at its peak.
                </p>
              </div>
              <div className="mf-marg mf-rise">
                <div className="mf-stat">
                  <div className="mf-fig">1 in 10</div>
                  <div className="mf-cap">Endometriosis affects roughly one in ten women of reproductive age</div>
                </div>
                <div className="mf-stat">
                  <div className="mf-fig">½</div>
                  <div className="mf-cap">Women are half the population and these conditions are common</div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* ── Pull-quote band ───────────────────────────────────────────────── */}
        <section className="mf-band">
          <div className="container mf-band-inner">
            <div className="mf-mark">&ldquo;</div>
            <div>
              <blockquote className="mf-rise">
                For decades, half the population has taken medicine designed around the other half, and the harm of this has been visible in the data the entire time.
              </blockquote>
              <div className="mf-src">From the manifesto · §00</div>
            </div>
          </div>
        </section>

        {/* ── Section 03: Why Now ───────────────────────────────────────────── */}
        <div className="container mf-essay-wrap" style={{ paddingTop: 0 }}>
          <aside />
          <div>
            <section className="mf-sec" id="s3" style={{ paddingTop: 96 }}>
              <div className="mf-sec-head mf-rise">
                <span className="mf-n">03</span>
                <h2>Why now</h2>
              </div>
              <div className="mf-prose mf-rise">
                <p style={{ fontSize: 26, lineHeight: 1.45, color: "var(--ink)" }}>
                  Two shifts make this the time to build.
                </p>
                <div className="mf-shift">
                  <div className="mf-sk">Shift 01</div>
                  <p>
                    First, drug development economics and momentum have moved toward AI and repurposing. A new drug often costs well over a billion dollars, takes more than a decade, and fails about nine times out of ten. A repurposed drug starts from an established safety record, reaches patients faster, and moves through regulatory pathways like <A href={FIVEOHFIVE}>505(b)(2)</A> with a much higher success rate. Capital now reflects this logic: AI drug discovery spans hundreds of companies and pulled in roughly <A href={FUNDING}>5.6 billion dollars in a single year</A>, close to a third of all healthcare startup funding, while Isomorphic Labs alone raised 600 million dollars and signed discovery deals with Eli Lilly and Novartis worth up to 1.7 and 1.2 billion dollars; almost all of that money is aimed at novel molecules for the diseases that fit the cure model, which leaves the repurposing of approved drugs to manage female biology sitting almost entirely outside the field&rsquo;s attention.
                  </p>
                </div>
                <div className="mf-shift">
                  <div className="mf-sk">Shift 02</div>
                  <p>
                    The second force is that the same tools the discovery companies aim at novel chemistry can now be aimed at evidence instead, so that the scattered, unstructured, decades-deep record of how approved drugs behave in female bodies can finally be read at scale, and the literature, the trial registries, the adverse-event databases, and the patient communities can be read together for the first time. The signal was always there and the means to surface it has only just arrived, which is what makes this the moment that drug repurposing becomes the frontier of drug development and the moment that a platform dedicated to female biology becomes possible to build, and we intend to build it first.
                  </p>
                </div>
              </div>
              <div className="mf-marg mf-rise">
                <div className="mf-stat">
                  <div className="mf-fig">$5.6<sup>B</sup></div>
                  <div className="mf-cap">Pulled into AI drug discovery in a single year — close to a third of all healthcare startup funding</div>
                </div>
                <div className="mf-stat mf-flag">
                  <div className="mf-fig">9 / 10</div>
                  <div className="mf-cap">A new drug often costs well over a billion dollars, takes more than a decade, and fails about nine times out of ten</div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ── Section 04: What Whel Is ─────────────────────────────────────── */}
        <section id="s4">
          <div className="container mf-essay-wrap" style={{ paddingTop: 0 }}>
            <aside />
            <div>
              <section className="mf-sec" style={{ paddingTop: 96 }}>
                <div className="mf-sec-head mf-rise">
                  <span className="mf-n">04</span>
                  <h2>What Whel is</h2>
                </div>
                <div className="mf-prose mf-rise" style={{ gridColumn: "1 / -1", maxWidth: 760 }}>
                  <p>
                    Whel is a drug-repurposing platform for female biology, which means that we find the approved drugs that already work for women&rsquo;s health conditions and prove it rigorously enough for a researcher or a clinician to act on, and we do that across three layers.
                  </p>
                  <div className="mf-layers">
                    <div className="mf-layer">
                      <div className="mf-ln">Layer<b>01</b></div>
                      <div>
                        <h3>The substrate.</h3>
                        <p>A corrected knowledge graph built to capture sex-specific pharmacokinetics, cyclical hormonal state, and the cross-condition mechanisms that general platforms miss because they were trained on male-default data, grounded in the standard biomedical ontologies, including MONDO, HPO, RxNorm, and ChEMBL, and extended with female-specific concepts that no existing ontology covers adequately.</p>
                      </div>
                    </div>
                    <div className="mf-layer">
                      <div className="mf-ln">Layer<b>02</b></div>
                      <div>
                        <h3>Retrieval and validation.</h3>
                        <p>Provenance-preserving extraction tuned for biomedical literature, in which every claim ties to a verbatim source span, every synthesis is marked as a synthesis, and every contradiction in the underlying literature is shown rather than averaged away, which is both the discipline that the FDA&rsquo;s 21st Century Cures Act §3060 research-support exemption requires and the discipline a clinician needs in order to trust the output.</p>
                      </div>
                    </div>
                    <div className="mf-layer">
                      <div className="mf-ln">Layer<b>03</b></div>
                      <div>
                        <h3>Hypothesis from signal.</h3>
                        <p>Patient-community signal, including off-label prescribing patterns, advocacy-organization registries, and structured patient reports, which enters as hypothesis generation and is validated downstream against mechanistic and clinical evidence, never equated with the results of a controlled trial and never discarded, because it is the input that surfaces the hypotheses worth checking.</p>
                      </div>
                    </div>
                  </div>
                  <p>
                    The result is a set of repurposing candidates with full evidence trails that a researcher can act on. We start where need is greatest and signal is densest, then expand across the biology medicine left understudied. <A href={ENDO}>Endometriosis alone affects about 190 million women</A> and still sees diagnosis delayed by seven to nine years on average, while <A href={PCOS}>PCOS is the most common endocrine disorder</A> in women of reproductive age and up to 70 percent of affected women remain undiagnosed. The biology is real, the drugs are already on pharmacy shelves, and the evidence is waiting to be read; the record was written for the wrong body, and we are correcting it.
                  </p>
                  <p>
                    This is also why a general-purpose platform, pointed at the same conditions, would not return what we do. The large biomedical AI platforms, <A href={CAUSALY}>Causaly</A> among them, read the institutional record: the published literature, the trial registries, the patent filings. They do not read the patient communities where the earliest signal for these conditions lives, they hold a drug and a disease as a fixed relationship rather than one that moves across the hormonal cycle, and they rank candidates for the pharma teams they serve, whose value lies in molecules they can own. For most of biology that is the right design. For the conditions medicine left to off-label practice, it points away from exactly the drugs that help.
                  </p>
                  <p>
                    Low-dose naltrexone for endometriosis is the case in miniature. At low doses naltrexone appears to <A href={LDN_MECH}>calm the glial inflammation</A> that drives chronic pain, through a mechanism separate from the addiction treatment it was approved for, and women have logged its effects in endometriosis and pain communities for years, often noting how the response tracks the menstrual cycle. The institutional evidence is thin and unresolved: the one randomized endometriosis trial was <A href={LDN_TRIAL}>terminated with nine patients enrolled</A>, and it is a cheap generic no company can profit from confirming. A platform built on institutional sources and ownable candidates ranks it near the bottom, if it surfaces it at all. We surface it, with its contradictions and its uncertainty attached, because the signal and the mechanism are both real and the missing piece has only ever been someone reading them together.
                  </p>
                  <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href="/candidates" className="btn btn-primary">See the candidates <span className="arr">&rarr;</span></Link>
                    <Link href="/access" className="btn btn-ghost">Request access</Link>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
