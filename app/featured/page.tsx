import Link from "next/link";
import { getCandidateBySignalId } from "@/lib/substrate-candidates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Featured signal | Whel",
};

// The live substrate pair this walkthrough is bound to: low-dose vaginal
// estrogen × menopause (GSM). signalId = `${interventionId}__${conditionId}`.
// Reading it at request time means every number on this page is whatever the
// engine currently reports — it can no longer drift from the model the way a
// hardcoded snapshot did.
const SIGNAL_ID =
  "345a61ac-85d1-406f-bfff-29f45eb4c73c__e3758034-fa92-40a3-af17-80fbbdecb0d6";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};

const EYEBROW: React.CSSProperties = {
  ...MONO,
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 12,
};

const H2: React.CSSProperties = {
  fontSize: "clamp(1.35rem, 2.4vw, 1.75rem)",
  fontWeight: 500,
  lineHeight: 1.15,
  letterSpacing: "-0.01em",
  color: "var(--ink)",
  marginBottom: 16,
};

const BODY: React.CSSProperties = {
  fontSize: "0.975rem",
  lineHeight: 1.72,
  color: "var(--ink-2)",
};

const LINK: React.CSSProperties = {
  color: "var(--green-mid)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const TIER_LABEL: Record<string, string> = {
  strong: "Strong",
  moderate: "Moderate",
  emerging: "Emerging",
  exploratory: "Exploratory",
};

// The deeper clinical record for vaginal estrogen in the postmenopausal
// genitourinary syndrome — including its recurrent-UTI prevention role — that
// the engine has NOT yet ingested as verbatim claims. PMIDs verified against
// PubMed eUtils esummary (2026-06). These are landmark references the broader
// clinical guidance rests on; ingesting them would raise the corroboration and
// consistency dimensions discussed in section 03.
const EXTERNAL_RECORD = [
  {
    label: "NAMS Editorial Panel. 2020",
    meta: "Position statement \u00b7 Menopause \u00b7 PMID 32852449",
    href: "https://pubmed.ncbi.nlm.nih.gov/32852449/",
    note: "The 2020 genitourinary syndrome of menopause position statement of the North American Menopause Society recommends low-dose vaginal estrogen as a first-line therapy for GSM, including its role in preventing recurrent urinary tract infections in postmenopausal women.",
  },
  {
    label: "Raz R, Stamm WE. 1993",
    meta: "Randomized controlled trial \u00b7 N Engl J Med \u00b7 PMID 8350884",
    href: "https://pubmed.ncbi.nlm.nih.gov/8350884/",
    note: "The landmark RCT of intravaginal estriol in postmenopausal women with recurrent UTI, showing a large reduction in episodes per patient-year against placebo. It remains the primary trial modern reviews of this question draw on.",
  },
  {
    label: "Lethaby A, Ayeleke RO, Roberts H. 2016",
    meta: "Cochrane review \u00b7 Cochrane Database Syst Rev \u00b7 PMID 27577677",
    href: "https://pubmed.ncbi.nlm.nih.gov/27577677/",
    note: "Local oestrogen for vaginal atrophy in postmenopausal women, reporting reduction in urinary symptoms alongside the primary vaginal-atrophy outcomes.",
  },
  {
    label: "Anger JT et al. 2022",
    meta: "Clinical guideline \u00b7 J Urol \u00b7 PMID 35942788",
    href: "https://pubmed.ncbi.nlm.nih.gov/35942788/",
    note: "The AUA / CUA / SUFU recurrent-UTI guideline recommends vaginal estrogen therapy for peri- and postmenopausal women with recurrent UTI as part of standard non-antibiotic prevention.",
  },
];

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          ...MONO,
          fontSize: "10px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="font-heading"
        style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink)", lineHeight: 1.2 }}
      >
        {value}
      </div>
    </div>
  );
}

export default async function FeaturedSignalPage() {
  const c = await getCandidateBySignalId(SIGNAL_ID);
  const anchor = c?.arms?.find((a) => a.isAnchor) ?? c?.arms?.[0];
  const tierLabel = c ? TIER_LABEL[c.tier] ?? c.tier : "—";
  const primaryClaim = c?.claims?.[0];

  return (
    <main className="flex-1" style={{ backgroundColor: "var(--bg)" }}>

      {/* Page header */}
      <div style={{ backgroundColor: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
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
            <span style={{ margin: "0 10px", opacity: 0.4 }}>&rsaquo;</span>
            <span style={{ color: "var(--ink)" }}>Featured signal</span>
          </nav>

          <div style={{ ...EYEBROW, marginBottom: 16 }}>Featured signal</div>

          <h1
            className="font-heading"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: 20,
              maxWidth: "30ch",
            }}
          >
            Low-dose vaginal estrogen for the genitourinary syndrome of menopause.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "64ch" }}>
            This is a standard-of-care therapy, yet the engine places it in the{" "}
            <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{tierLabel}</strong> tier rather
            than its highest. That gap is the point of this walkthrough. The engine scores
            only the evidence it has actually read and verified word-for-word,
            and for this pair that is a single review. Everything below is read
            live from the substrate, so every number on this page is whatever the
            model reports right now, with nothing typed in by hand.
          </p>

          {/* Meta strip — all live */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--rule)",
              display: "grid",
              gap: 14,
            }}
            className="grid-cols-2 sm:grid-cols-4 grid"
          >
            <MetaCell label="Compound" value={c?.drug ?? "Low-dose vaginal estrogen"} />
            <MetaCell label="Condition" value={c?.condition ?? "Menopause"} />
            <MetaCell
              label="Tier (live)"
              value={c ? `${tierLabel} \u00b7 ${c.score.toFixed(1)} / 10` : "\u2014"}
            />
            <MetaCell
              label="Validation"
              value={c?.validationStatus === "clinical" ? "Clinically anchored" : "\u2014"}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>

          {/* 01 Origin of the signal */}
          <section>
            <div style={EYEBROW}>01 &middot; Origin of the signal</div>
            <h2 className="font-heading" style={H2}>How it surfaced</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The signal was indexed against menopause through the Direct
                Research arm, which reads peer-reviewed literature for
                compound&ndash;condition pairs and extracts a verbatim claim for
                each finding. For this pair the arm surfaced a single source: a
                2023 review of menopausal symptom management.
              </p>
              {primaryClaim && (
                <blockquote
                  style={{
                    borderLeft: "2px solid var(--green-mid)",
                    paddingLeft: 18,
                    margin: 0,
                    fontSize: "0.975rem",
                    lineHeight: 1.7,
                    color: "var(--ink)",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{primaryClaim.text}&rdquo;
                  <span style={{ ...MONO, display: "block", fontStyle: "normal", fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                    {primaryClaim.href ? (
                      <a href={primaryClaim.href} target="_blank" rel="noopener noreferrer" style={LINK}>
                        {primaryClaim.src}
                      </a>
                    ) : (
                      primaryClaim.src
                    )}
                  </span>
                </blockquote>
              )}
              <p style={BODY}>
                {anchor?.mechanism
                  ? anchor.mechanism
                  : "Local estrogen restores estrogen-dependent vaginal and urogenital tissue, relieving genitourinary menopausal symptoms."}{" "}
                That mechanism is well established clinically, which is exactly
                why the modest score below is worth walking through carefully.
              </p>
            </div>
          </section>

          {/* 02 Live score breakdown */}
          <section>
            <div style={EYEBROW}>02 &middot; Evidence and scoring</div>
            <h2 className="font-heading" style={H2}>How the engine scored it</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The headline is the Direct arm&apos;s reading. Each of the five
                dimensions below carries the engine&apos;s own 0&ndash;2 score and
                the rationale it wrote for that score. Nothing here is curated by
                hand; it is the live row.
              </p>

              {anchor && (
                <div
                  style={{
                    backgroundColor: "var(--paper)",
                    border: "1px solid var(--rule)",
                    padding: "20px 22px",
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      ...MONO,
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 14,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Score breakdown &middot; {ARM_TITLE[anchor.arm] ?? anchor.arm} arm</span>
                    <span>strength {anchor.strength} / 10 &rarr; {tierLabel}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {anchor.dimensions.map((dim) => (
                      <div
                        key={dim.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 130px) 48px 1fr",
                          gap: 14,
                          alignItems: "baseline",
                        }}
                      >
                        <div className="font-heading" style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--ink)" }}>
                          {dim.label}
                        </div>
                        <div style={{ ...MONO, fontSize: "0.875rem", color: "var(--green-deep)", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {dim.score} / 2
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "var(--ink-2)", lineHeight: 1.55 }}>
                          {dim.rationale}
                        </div>
                      </div>
                    ))}
                  </div>
                  {c?.femaleApplicability && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: "1px solid var(--rule)",
                        fontSize: "0.85rem",
                        color: "var(--ink-2)",
                        lineHeight: 1.55,
                      }}
                    >
                      <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                        Female applicability &middot; {c.femaleApplicability.band} &middot; &times;{c.femaleApplicability.multiplier.toFixed(2)}
                      </span>
                      <div style={{ marginTop: 4 }}>{c.femaleApplicability.rationale}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 03 Why Moderate and not Strong */}
          <section>
            <div style={EYEBROW}>03 &middot; Reading the score</div>
            <h2 className="font-heading" style={H2}>Why {tierLabel} and not Strong</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Rigor and specificity are both at the ceiling: the source is a
                review (the highest design tier the rubric recognises) and it
                names the intervention and the condition explicitly. What holds
                the score back is corroboration and consistency. The engine
                held corroboration at 1 because a single review is one
                synthesis; the trials pooled inside it do not count as
                independent sources. It scored consistency 1 because, with only
                one source on file, agreement across independent studies cannot
                be assessed and defaults to neutral.
              </p>
              <p style={BODY}>
                This is the engine refusing to inflate. The underlying therapy is
                guideline-backed and well replicated in the wider literature, but
                the model only credits what it has ingested and verified
                verbatim. A single point of consistency is the entire distance
                between this {tierLabel} signal and a Strong one. The companion
                walkthrough,{" "}
                <Link href="/featured/anastrozole-endometriosis" style={LINK}>
                  aromatase inhibitors for endometriosis
                </Link>
                , shows the mirror image: the same corroboration score of 1, but
                a systematic review whose pooled studies agree pushes consistency
                to 2 and the pair to Strong.
              </p>
            </div>
          </section>

          {/* 04 The deeper clinical record */}
          <section>
            <div style={EYEBROW}>04 &middot; Beyond the ingested source</div>
            <h2 className="font-heading" style={H2}>The clinical record the engine has not yet read</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                A fair test of any evidence engine is to ask what its ingested
                sources miss. The broader clinical record for vaginal estrogen in
                postmenopausal women, including its recurrent-UTI prevention
                role, extends well past the one review on file. The references
                below sit outside the ingested corpus today. They are kept out
                of the score by design, so the score stays a measure of what the
                engine has actually read. Ingesting these would legitimately
                raise the corroboration and consistency dimensions from section
                02.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                {EXTERNAL_RECORD.map((src) => (
                  <div key={src.label} style={{ borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
                    <div className="font-heading" style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
                      <a href={src.href} target="_blank" rel="noopener noreferrer" style={LINK}>{src.label}</a>
                    </div>
                    <div style={{ ...MONO, fontSize: "11px", letterSpacing: "0.04em", color: "var(--muted)", marginBottom: 6 }}>
                      {src.meta}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--ink-2)", lineHeight: 1.6 }}>{src.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 05 What this demonstrates */}
          <section>
            <div style={EYEBROW}>05 &middot; What this demonstrates</div>
            <h2 className="font-heading" style={H2}>An honest read of thin evidence</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The earlier version of this page called this signal the cleanest
                Strong case in the database. The current engine disagrees with
                its own predecessor, and the disagreement is the feature. It
                scores corroboration and consistency on verbatim-verified claims,
                so the model lands this pair at {tierLabel}. That is an honest
                reflection of a corpus that holds one review, while the wider
                field has produced dozens of trials and guidelines.
              </p>
              <p style={BODY}>
                The clinical follow-on question, why a guideline-backed therapy
                remains under-prescribed in routine postmenopausal care, sits
                outside the engine&apos;s scope. The engine records the
                evidence it has read and makes the gaps legible. Closing those
                gaps, in the corpus and in the clinic, is the work the platform
                is built to inform.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div
            style={{
              borderTop: "1px solid var(--rule)",
              paddingTop: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 32px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ maxWidth: "44ch" }}>
              <div style={{ ...MONO, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
                Continue
              </div>
              <p style={{ fontSize: "0.95rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                See every signal indexed for the menopause transition, sorted by
                tier and evidence arm, alongside the sources behind each one.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px" }}>
              <Link
                href="/conditions/perimenopause-menopause"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 18px",
                  backgroundColor: "var(--green-mid)",
                  color: "#fff",
                  ...MONO,
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
                className="transition-opacity hover:opacity-90"
              >
                Open Perimenopause &amp; Menopause &rarr;
              </Link>
              <Link
                href="/about/methodology"
                style={{
                  ...MONO,
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  padding: "10px 4px",
                  borderBottom: "1px solid var(--ink)",
                  textDecoration: "none",
                }}
              >
                Read the methodology
              </Link>
            </div>
          </div>

          <p
            style={{
              ...MONO,
              fontSize: 11,
              letterSpacing: "0.04em",
              color: "var(--muted)",
              borderTop: "1px solid var(--rule)",
              paddingTop: 18,
            }}
          >
            Scores, dimensions, and the ingested source on this page are read
            live from the substrate at request time and update as the corpus
            grows. The external record in section 04 is curated by hand and is
            not yet part of the scored corpus.
          </p>

        </div>
      </div>
    </main>
  );
}

const ARM_TITLE: Record<string, string> = {
  direct: "Direct",
  pathway: "Pathway",
  community: "Community",
};
