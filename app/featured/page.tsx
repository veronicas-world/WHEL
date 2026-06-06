import Link from "next/link";

export const metadata = {
  title: "Featured signal | Whel",
};

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

// Five-dimension breakdown for the Vaginal Estrogen / Perimenopause & Menopause
// signal. Numbers verified against the live repurposing_signals row at the
// time of writing (June 2026): rep=2, qual=1, spec=2, plaus=2, dir=2, total
// 9 / 10. See the score-honesty note in section 02 for context on the
// quality=1 entry.
const SCORING_DIMENSIONS = [
  {
    label: "Replication",
    score: 2,
    note: "Three independent sources converge on the same target population (postmenopausal women) and the same direction of effect (reduction in recurrent UTI episodes).",
  },
  {
    label: "Source quality",
    score: 1,
    note: "The indexed sources are a topical review, a Cochrane review, and a society position statement. The original randomized trials sit one citation step removed, inside those reviews, rather than as separately indexed records.",
  },
  {
    label: "Specificity",
    score: 2,
    note: "The outcome is a clinically defined endpoint (recurrent UTI, conventionally three or more culture-positive episodes per year), not a vague improvement.",
  },
  {
    label: "Plausibility",
    score: 2,
    note: "Estrogen withdrawal at menopause raises vaginal pH and depletes lactobacilli, removing the microbiological barrier that limits ascending uropathogen colonization. Topical estrogen restores both.",
  },
  {
    label: "Direction",
    score: 2,
    note: "Every indexed source reports improvement, with no signal of worsening.",
  },
];

// Sources currently attached to this signal in the Whel database. PMIDs
// verified against PubMed eUtils esummary on 2026-06-06.
const INDEXED_SOURCES = [
  {
    label: "Jung C, Brubaker L. 2019",
    meta: "Review article \u00b7 Climacteric \u00b7 PMID 30624087",
    href: "https://pubmed.ncbi.nlm.nih.gov/30624087/",
    note: "The etiology and management of recurrent urinary tract infections in postmenopausal women. Synthesizes the mechanism of post-menopausal UTI susceptibility (loss of lactobacilli, vaginal pH rise, uropathogen colonization) and reviews non-antibiotic prevention strategies including vaginal estrogen, cranberry products, and methenamine.",
  },
  {
    label: "Lethaby A, Ayeleke RO, Roberts H. 2016",
    meta: "Cochrane review \u00b7 Cochrane Database Syst Rev \u00b7 PMID 27577677",
    href: "https://pubmed.ncbi.nlm.nih.gov/27577677/",
    note: "Local oestrogen for vaginal atrophy in postmenopausal women. Reports reduction in urinary symptoms (frequency, urgency, UTI recurrence) alongside the primary vaginal-atrophy outcomes. The urinary symptom finding is a secondary endpoint, which is the form most of the rUTI evidence takes inside GSM-framed reviews.",
  },
  {
    label: "NAMS Editorial Panel. 2020",
    meta: "Position statement \u00b7 Menopause \u00b7 PMID 32852449 \u00b7 Guideline ID: NAMS-2020-GSM-VaginalEstrogen \u00b7 Strength: recommended \u00b7 Certainty: moderate",
    href: "https://pubmed.ncbi.nlm.nih.gov/32852449/",
    note: "The 2020 genitourinary syndrome of menopause position statement of the North American Menopause Society. Formally recommends low-dose vaginal estrogen as a first-line therapy for women with GSM, with specific guidance on its role in preventing recurrent UTIs in the postmenopausal population. This is the source row that carries the curated guideline strength and certainty values that drive the L3 external grade.",
  },
];

// Landmark clinical references for vaginal estrogen + recurrent UTI in the
// postmenopausal population that Whel's automated pipelines did NOT ingest
// during the current snapshot run. PMIDs verified against PubMed eUtils
// esummary on 2026-06-06. These three would each qualify the signal for L3
// attribution independently; the agreement across them is what gives the
// external grade its weight beyond a single body's voice.
const EXTERNAL_VALIDATION = [
  {
    label: "Raz R, Stamm WE. 1993",
    meta: "Randomized controlled trial \u00b7 N Engl J Med \u00b7 PMID 8350884",
    href: "https://pubmed.ncbi.nlm.nih.gov/8350884/",
    note: "A controlled trial of intravaginal estriol in postmenopausal women with recurrent urinary tract infections. The landmark RCT establishing topical vaginal estriol as effective UTI prophylaxis in this population, with a large reduction in UTI episodes per patient-year against placebo. It remains the primary citation any modern review of this question draws on.",
  },
  {
    label: "Perrotta C, Aznar M, Mejia R, Albert X, Ng CW. 2008",
    meta: "Systematic review \u00b7 Cochrane Database Syst Rev \u00b7 PMID 18425910",
    href: "https://pubmed.ncbi.nlm.nih.gov/18425910/",
    note: "Oestrogens for preventing recurrent urinary tract infection in postmenopausal women. Synthesized the available randomized evidence and concluded that vaginal oestrogens (specifically estriol and estradiol creams) reduce UTI recurrence, with the effect concentrated in the vaginal route rather than the oral route.",
  },
  {
    label: "Anger JT et al. 2022",
    meta: "Clinical guideline \u00b7 J Urol \u00b7 PMID 35942788",
    href: "https://pubmed.ncbi.nlm.nih.gov/35942788/",
    note: "Updates to Recurrent Uncomplicated Urinary Tract Infections in Women: AUA/CUA/SUFU Guideline. The American Urological Association joint guideline with the Canadian Urological Association and the Society of Urodynamics, Female Pelvic Medicine and Urogenital Reconstruction recommends vaginal estrogen therapy for peri- and postmenopausal women with recurrent UTI as part of the standard non-antibiotic prevention strategy. This is a second qualifying L3 source under Whel's current rubric.",
  },
];

export default function FeaturedSignalPage() {
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

          <div style={{ ...EYEBROW, marginBottom: 16 }}>
            Featured signal &middot; 01
          </div>

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
            Vaginal estrogen prevents recurrent UTIs after menopause.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "62ch" }}>
            Of the 271 active signals in the Whel database, three are currently
            graded L3 in live data, meaning the signal is independently
            recommended in a published clinical guideline. Of those three,
            vaginal estrogen for the postmenopausal population is the only one
            that also reaches Whel&apos;s Strong internal tier. It is the
            cleanest demonstration of what the platform can find: a
            well-replicated, mechanistically clear, guideline-backed
            repurposing signal that is still under-prescribed in clinical
            practice.
          </p>

          {/* Meta strip */}
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
            {[
              { label: "Compound", value: "Vaginal Estrogen" },
              { label: "Condition", value: "Perimenopause & Menopause" },
              { label: "Tier (internal)", value: "Strong \u00b7 9 / 10" },
              { label: "L-grade (external)", value: "L3 \u00b7 NAMS 2020" },
            ].map(({ label, value }) => (
              <div key={label}>
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
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "var(--ink)",
                    lineHeight: 1.2,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
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
                The Vaginal Estrogen signal was indexed against the
                Perimenopause &amp; Menopause condition through the Direct
                Research arm, which queries PubMed for compound&ndash;condition
                pairs with published peer-reviewed evidence. The pipeline
                returns records where the compound is the named intervention
                and the condition (or one of its clinical components) is the
                named outcome.
              </p>
              <p style={BODY}>
                Three sources were attached in successive ingestion runs. A
                Climacteric review of recurrent UTI etiology and management in
                postmenopausal women provided the initial seed and named
                vaginal estrogen as a first-line non-antibiotic prevention
                strategy. A subsequent backfill (recorded in migration 037)
                added a Cochrane review of local oestrogens for vaginal
                atrophy, which reports urinary symptom improvement as a
                secondary outcome of the GSM-focused trials. The third source
                was the 2020 NAMS position statement on the genitourinary
                syndrome of menopause, which formally recommends vaginal
                estrogen for postmenopausal women with recurrent UTIs. That
                NAMS row is the one curated with a guideline ID, strength, and
                certainty, and is what drives the L3 external grade explained
                in section 03.
              </p>
              <p style={BODY}>
                The signal converged because all three sources independently
                report the same outcome direction in the same target
                population, and because the underlying biology (estrogen
                withdrawal raising vaginal pH and removing the lactobacillus
                barrier to uropathogen ascent) is consistent across them.
              </p>
            </div>
          </section>

          {/* 02 Evidence and scoring */}
          <section>
            <div style={EYEBROW}>02 &middot; Evidence and scoring</div>
            <h2 className="font-heading" style={H2}>How the signal scores</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The signal sits at Strong tier with a total evidence score of 9
                out of 10. Strong is the top tier in Whel&apos;s four-tier
                confidence framework. The five-dimension breakdown is shown
                below. The single point not awarded is on source quality,
                which is worth a brief explanation rather than a footnote.
              </p>
              <p style={BODY}>
                Whel&apos;s rubric awards a source-quality score of 2 when the
                attached sources are primary peer-reviewed studies or trials.
                The three sources currently indexed against this signal are a
                topical review, a Cochrane systematic review, and a society
                position statement. The original randomized trials, including
                the landmark NEJM 1993 trial of intravaginal estriol cited in
                section 04 below, sit one citation step removed inside these
                reviews rather than as separately indexed records. The quality
                score of 1 records that fact honestly. A future curation pass
                could attach those original RCTs as additional sources, which
                would raise both the quality and replication scores.
              </p>

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
                  }}
                >
                  Score breakdown
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {SCORING_DIMENSIONS.map((dim) => (
                    <div
                      key={dim.label}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 140px) 56px 1fr",
                        gap: 14,
                        alignItems: "baseline",
                      }}
                    >
                      <div
                        className="font-heading"
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          color: "var(--ink)",
                        }}
                      >
                        {dim.label}
                      </div>
                      <div
                        style={{
                          ...MONO,
                          fontSize: "0.875rem",
                          color: "var(--green-deep)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dim.score} / 2
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--ink-2)", lineHeight: 1.55 }}>
                        {dim.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 03 The external L-grade */}
          <section>
            <div style={EYEBROW}>03 &middot; External grade</div>
            <h2 className="font-heading" style={H2}>Why this signal earns L3</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Every compound&ndash;condition pair in Whel carries two grades
                in parallel. The internal tier (Strong, Moderate, Emerging,
                Exploratory) reflects how Whel&apos;s own five-dimension
                framework rates the literature it ingested. The external
                L-grade (L0, L1, L2, L3) reflects whether that signal is
                independently supported in the broader clinical record beyond
                Whel&apos;s ingestion. Both grades sit on a per-pair basis.
                They do not blend.
              </p>
              <p style={BODY}>
                The Vaginal Estrogen signal earns L3 because the 2020 NAMS
                position statement on the genitourinary syndrome of menopause
                formally recommends it as a first-line therapy and explicitly
                names recurrent UTI as one of the conditions for which the
                recommendation applies. Under NAMS&apos;s own grading framework,
                this recommendation carries a strength of &ldquo;recommended&rdquo;
                and a certainty of &ldquo;moderate&rdquo;. Whel records both
                values as a normalized (strength, certainty) pair so signals
                from different bodies are comparable: ESHRE uses the GRADE
                framework, NAMS uses its own three-level evidence framework,
                and ISSWSH uses a modified Delphi consensus. The pair for this
                signal is (recommended, moderate).
              </p>
              <p style={BODY}>
                L3 is the rarest grade in the database. Of 271 active signals,
                three carry L3 in live data, with a further twelve at L3 in
                the validation dossier. That scarcity is by design rather than
                oversight. L3 requires a body-assigned recommendation
                explicitly tied to the indication, and most repurposing
                signals are pre-guideline by definition.
              </p>
              <p style={BODY}>
                What makes this signal unusual is the combination. Many
                signals reach Strong internal tier without external guideline
                backing: the literature replicates, the mechanism is clear,
                but no society has yet issued a recommendation. Other signals
                carry L3 backing without high internal tier scores: a
                guideline acknowledges the use, but Whel&apos;s pipelines have
                only surfaced one or two corroborating sources. Vaginal
                estrogen for recurrent UTI is the corner case where both axes
                are at the top simultaneously.
              </p>
            </div>
          </section>

          {/* 04 External validation */}
          <section>
            <div style={EYEBROW}>04 &middot; External validation</div>
            <h2 className="font-heading" style={H2}>Literature Whel did not ingest</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                A useful test of any aggregator is to ask what its indexed
                sources miss. Whel&apos;s automated pipelines ran a specific
                set of PubMed queries at a specific moment, and they surfaced
                three sources for this signal. The broader clinical literature
                on vaginal estrogen for postmenopausal recurrent UTI extends
                well beyond those three. The three reference points below sit
                outside the indexed sources and serve as an independent check
                on whether the signal converges with the established clinical
                record.
              </p>
              <p style={BODY}>
                Two of the three references would each qualify the signal for
                L3 attribution under Whel&apos;s current rubric: the AUA / CUA
                / SUFU recurrent-UTI guideline is itself a society
                recommendation, and the NAMS position statement already
                indexed is the second. The Raz &amp; Stamm 1993 NEJM trial
                does not carry an L3 contribution on its own (it is a primary
                trial rather than a guideline), but it is the underlying
                evidence on which the guidelines explicitly rest.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                {EXTERNAL_VALIDATION.map((src) => (
                  <div
                    key={src.label}
                    style={{
                      borderTop: "1px solid var(--rule)",
                      paddingTop: 14,
                    }}
                  >
                    <div
                      className="font-heading"
                      style={{
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: 4,
                      }}
                    >
                      <a href={src.href} target="_blank" rel="noopener noreferrer" style={LINK}>
                        {src.label}
                      </a>
                    </div>
                    <div
                      style={{
                        ...MONO,
                        fontSize: "11px",
                        letterSpacing: "0.04em",
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}
                    >
                      {src.meta}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                      {src.note}
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ ...BODY, fontSize: "0.9rem", color: "var(--muted)", marginTop: 8 }}>
                These three references were not part of Whel&apos;s automated
                ingestion for the current snapshot. They were located by hand
                via PubMed search to test the convergence of the indexed
                signal with the broader literature. A future curation pass
                would attach the Raz &amp; Stamm RCT and the AUA / CUA / SUFU
                guideline as additional indexed sources, which would raise the
                source-quality and replication scores discussed in section 02.
              </p>
            </div>
          </section>

          {/* 05 Indexed sources */}
          <section>
            <div style={EYEBROW}>05 &middot; Indexed sources</div>
            <h2 className="font-heading" style={H2}>The three sources behind the signal</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                These are the three sources currently attached to the Vaginal
                Estrogen / Perimenopause &amp; Menopause record in the Whel
                database. The first is a single-author review, the second is a
                Cochrane systematic review with vaginal atrophy as the primary
                outcome and urinary symptoms as a secondary, and the third is
                the NAMS position statement whose guideline ID and grading
                values drive the L3 external attribution.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                {INDEXED_SOURCES.map((src) => (
                  <div
                    key={src.label}
                    style={{
                      borderTop: "1px solid var(--rule)",
                      paddingTop: 14,
                    }}
                  >
                    <div
                      className="font-heading"
                      style={{
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: 4,
                      }}
                    >
                      <a href={src.href} target="_blank" rel="noopener noreferrer" style={LINK}>
                        {src.label}
                      </a>
                    </div>
                    <div
                      style={{
                        ...MONO,
                        fontSize: "11px",
                        letterSpacing: "0.04em",
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}
                    >
                      {src.meta}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                      {src.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 06 Reading the grades together */}
          <section>
            <div style={EYEBROW}>06 &middot; Reading the grades</div>
            <h2 className="font-heading" style={H2}>What Strong and L3 mean together</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                A Strong tier paired with L3 backing is the cleanest case Whel
                can demonstrate, and it is rare for a reason. The two axes are
                independent, so signals fall on diagonals more often than on
                the corner. The previous featured signal, anastrozole for
                endometriosis, sits at the high-tier-low-L corner: the biology
                and trial literature are strong (Strong tier), but at the
                time of this writing the guideline backing is partial (L2 in
                practice for most readings of the published recommendations).
                The Continuous Oral Contraceptive for endometriosis signal
                sits at the opposite corner: ESHRE 2022 formally recommends
                it (L3), but the strength is &ldquo;weak&rdquo; and the
                certainty is &ldquo;low&rdquo;, and Whel rates the internal
                evidence Emerging.
              </p>
              <p style={BODY}>
                Vaginal estrogen for recurrent UTI is the example to point at
                when introducing the methodology to outside reviewers. Both
                axes are at the top, both axes are scored independently, and
                the underlying evidence is genuinely well replicated across
                the indexed sources and the external literature shown in
                section 04. It is also the cleanest illustration of what the
                whole project is for: surfacing well-evidenced repurposing
                use cases that remain under-prescribed in current practice.
              </p>
              <p style={BODY}>
                The clinical follow-on question, namely why a Strong + L3
                signal remains under-prescribed in routine postmenopausal
                care, sits outside Whel&apos;s scope. Whel records the
                evidence and makes it traceable. What clinicians, payers,
                educators, and women&apos;s health institutions do with that
                evidence is a separate conversation, and it is the
                conversation the platform is built to inform.
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
              <div
                style={{
                  ...MONO,
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                Continue
              </div>
              <p style={{ fontSize: "0.95rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                See the full set of signals indexed for the perimenopause and
                menopause transition, sorted by tier and evidence arm,
                alongside their sources and L-grades.
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
            Based on Whel database state as of June 2026. Scores, source
            counts, and curation values reflect the signal as indexed at the
            time of writing and may change as new evidence is incorporated
            and as future curation rounds attach the primary trials cited in
            section 04. The previous featured walkthrough, on anastrozole and
            endometriosis, is preserved at{" "}
            <Link href="/featured/anastrozole-endometriosis" style={LINK}>
              /featured/anastrozole-endometriosis
            </Link>.
          </p>

        </div>
      </div>
    </main>
  );
}
