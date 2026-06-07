import Link from "next/link";

export const metadata = {
  title: "Methodology changelog | Whel",
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

// ── Entry helpers ─────────────────────────────────────────────────────────
// Each changelog entry is a small block: a uppercase date/version eyebrow
// followed by one or more paragraphs of monospaced prose. The first entry
// on the page has no top border; every subsequent entry is separated from
// the one above it by a thin dashed rule. Newest entry sits on top.

const ENTRY_EYEBROW: React.CSSProperties = {
  ...MONO,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  fontWeight: 500,
  color: "var(--ink)",
  marginBottom: 8,
};

const ENTRY_PARA: React.CSSProperties = {
  ...MONO,
  fontSize: 11,
  letterSpacing: "0.04em",
  lineHeight: 1.7,
  color: "var(--muted)",
  margin: 0,
};

const ENTRY_PARA_NEXT: React.CSSProperties = {
  ...ENTRY_PARA,
  margin: "14px 0 0 0",
};

const ENTRY_LINK: React.CSSProperties = {
  color: "var(--green-mid)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

function EntryWrapper({
  children,
  isFirst,
}: {
  children: React.ReactNode;
  isFirst?: boolean;
}) {
  return (
    <div style={isFirst ? undefined : { borderTop: "1px dashed var(--rule)", paddingTop: 22 }}>
      {children}
    </div>
  );
}

export default function MethodologyChangelogPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "var(--bg)" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
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
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <Link href="/about" style={{ color: "var(--muted)" }}>About</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <Link href="/about/methodology" style={{ color: "var(--muted)" }}>Validation methodology</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <span style={{ color: "var(--ink)" }}>Changelog</span>
          </nav>

          <div style={{ ...EYEBROW, marginBottom: 16 }}>
            Revision history · current version v3.6
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
              maxWidth: "32ch",
            }}
          >
            Methodology changelog.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "62ch" }}>
            This page records every dated revision to Whel&apos;s validation
            methodology. Entries that change the rubric, the sample, the
            external sources of truth, the adjudication rules, or the
            pre-specified thresholds are recorded here so the methodology page
            stays readable and so smaller refinements that would not warrant a
            roadmap entry remain visible. Newest revision is on top. The
            current version tag at the top of{" "}
            <Link href="/about/methodology" style={ENTRY_LINK}>
              /about/methodology
            </Link>{" "}
            tracks the most recent version recorded here.
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >

          {/* v3.6 */}
          <EntryWrapper isFirst>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.6 &middot; June 7, 2026
            </div>
            <p style={ENTRY_PARA}>
              LLM output validation strategy made explicit. The structured
              grounding layers in v3.4 (Path A and Path B, recorded in
              section 01c on{" "}
              <Link href="/about/external-references#structured-grounding-in-progress" style={ENTRY_LINK}>
                /about/external-references
              </Link>
              ) constrain what data the LLM works with. A separate failure
              surface applies to what the LLM produces as output. Three
              failure modes are documented in the literature and apply to
              Whel&apos;s specific pipeline: per-source extraction
              misclassification (an LLM that reads a PubMed abstract and
              assigns the wrong study type, wrong direction of effect, or
              hallucinates mechanism details not present in the source);
              summary drift (an LLM-written summary that extends beyond
              what the source actually says, the Gong et al. 2026 risk
              pattern in Bioengineering applied to Whel&apos;s task); and
              citation fabrication or misattribution in long-form prose
              Whel publishes (featured signal walkthroughs, the methods
              PDF, written drafts), where the LLM is asked to generate
              references rather than classify ones it was given.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              Whel&apos;s response is a three-part output validation
              pipeline, recorded as Path C on the Roadmap. Phase 1 is a
              citation validation step that resolves every PMID against
              NCBI E-utilities and every DOI against the Crossref REST
              API, returning the canonical title, authors, journal, and
              year, and comparing those against the LLM-claimed metadata.
              References that fail to resolve or whose returned metadata
              mismatch the LLM&apos;s claims are blocked from publication.
              Phase 2 is sentence-level summary grounding using a
              sentence-transformer model (Sentence-BERT or equivalent) to
              compute the cosine similarity between each sentence in an
              LLM-generated summary and the source abstract. Sentences
              that fall below a calibrated similarity threshold are
              flagged as &ldquo;not directly supported by the source&rdquo;
              and either suppressed or surfaced with that marker on the
              signal card. Phase 3 is prompt hardening for any
              LLM-generated long-form prose that ships to users. The
              hardened prompt forbids citation generation (the LLM may
              only cite from a pre-verified reference list provided to
              it), forbids numerical claims unless they appear verbatim
              in the input context, and requires the LLM to produce,
              alongside the text, a sentence-by-sentence list of
              supporting input sources that Phase 1 then checks.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              A fourth strategy in the broader literature, multi-sample
              consistency checking through re-querying the model, was
              considered and deferred. The cost (three to five times the
              Claude API spend) does not favorably trade against the
              marginal gain on Whel&apos;s constrained extraction task,
              and Phase 2 grounding addresses the same failure modes more
              cheaply. The deferred entry is recorded here so a future
              decision to revisit it has the design history available.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              Path C is distinct from Path A and Path B. A and B ground
              the LLM&apos;s inputs (canonical ontologies for entity
              resolution; a domain-restricted knowledge graph for
              scoring-time context). C validates the LLM&apos;s outputs
              (citations, summary statements, published prose). They are
              complementary layers in the same overall pipeline
              architecture and are designed to ship in parallel rather
              than sequentially. The Path C disclosure surface lives in
              section 01d on{" "}
              <Link href="/about/external-references#output-validation-in-progress" style={ENTRY_LINK}>
                /about/external-references
              </Link>
              .
            </p>
          </EntryWrapper>

          {/* v3.5 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.5 &middot; June 7, 2026
            </div>
            <p style={ENTRY_PARA}>
              MATRIX cross-reference reaches per-signal display. The Every
              Cure MATRIX coverage layer (live since v3.1) was previously
              surfaced only as an aggregate audit on the external-references
              page (compound match rate, per-condition counts, score
              distribution). Per-pair MATRIX scores are now surfaced on
              each signal card on{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                /conditions/[slug]
              </code>{" "}
              pages as a &ldquo;MATRIX &middot; Top N%&rdquo; chip alongside
              the L-grade chip and the tier chip, where the percentile is
              MATRIX&apos;s own quantile rank across its roughly 39.5
              million drug&ndash;disease predictions. Per-pair scores are
              sourced from a new public snapshot at{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                lib/matrix-pair-scores-snapshot.json
              </code>
              , extracted from the same audit report that produces the
              aggregate snapshot. 176 of 271 active compound&ndash;condition
              pairs in the current audit run have a MATRIX score and now
              show the chip; 95 pairs are &ldquo;matrix silent&rdquo;
              (compound not in MATRIX&apos;s drug list, or score below
              MATRIX&apos;s publication threshold) and correctly show no
              chip.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              The external-references coverage disclosure at{" "}
              <Link href="/about/external-references#coverage-disclosure" style={ENTRY_LINK}>
                /about/external-references &rarr; 01b
              </Link>{" "}
              was extended with a &ldquo;How to read these numbers&rdquo;
              explainer card that defines both MATRIX values in Every
              Cure&apos;s own framing (treatment-probability prediction
              from a model trained on a biomedical knowledge graph),
              explains what &ldquo;Top N%&rdquo; does and does not say,
              quotes Every Cure&apos;s &ldquo;research use only&rdquo;
              disclaimer verbatim, and explains why Whel surfaces an
              independent ML layer beside its own literature-driven grades.
              The chip tooltip uses the same treatment-probability framing
              for hover-state consistency. No change to Whel&apos;s
              rubric, sample, or tier definitions; MATRIX remains separated
              from Whel&apos;s grades rather than blended into them.
            </p>
          </EntryWrapper>

          {/* v3.4 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.4 &middot; June 7, 2026
            </div>
            <p style={ENTRY_PARA}>
              Structured grounding strategy made explicit. Whel&apos;s
              evidence extraction and scoring layer is built on Claude Opus
              4.6, a large language model.{" "}
              <Link
                href="https://arxiv.org/abs/2604.00024"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                WHBench
              </Link>
              , an independent 2026 benchmark of frontier LLMs on
              women&apos;s health clinical questions (Maurya, Saboo &amp;
              Kumar, 2026, arXiv:2604.00024), found that no model in its
              22-model lineup exceeded 75% on the 23-criterion rubric, with
              the top model fully correct in only 35.5% of scenarios. The
              failure pattern is systematic rather than random: universal
              blind spots in social determinants of health (0.7%&ndash;19.1%
              across all 22 models), wide variation in safety harm rates
              within the top tier, and persistent gaps in completeness on
              follow-up timelines and monitoring plans. Empirical work on
              biomedical LLM reference fabrication (Gong et al. 2026,
              Bioengineering) documents hallucination rates of
              47%&ndash;55% on citation tasks. The hybrid-architecture
              literature (Zong et al. 2026{" "}
              <Link
                href="https://arxiv.org/abs/2603.28325"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                EvidenceNet
              </Link>
              , arXiv:2603.28325; Li et al. 2025 on knowledge-guided
              prompting, IEEE J. Biomed. Health Inform.; Zunzunegui Sanz et
              al. 2025, bioRxiv) consistently shows that adding structured
              external knowledge on top of LLM extraction improves accuracy
              and interpretability.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              Whel&apos;s response, recorded as two roadmap items, is to add
              two structured grounding layers on top of the existing LLM
              pipeline without replacing it. These are architectural
              additions to the pipeline rather than post-hoc validation:
              they change what data lands in the database and how the LLM
              arrives at its scoring. Path A is ontology-grounded entity
              resolution: every compound and condition the LLM extracts is
              resolved against canonical biomedical registries (ChEMBL or
              DrugBank for compounds, MONDO for conditions), rewritten with
              the registry&apos;s standard identifier, and enriched with
              the structured metadata that resolution returns (drug class,
              ATC code, known targets; ontology lineage) before being
              written to the database. Entities that fail to resolve are
              flagged for human review rather than silently stored. This
              addresses the structured-output hallucination class of error
              directly and also moves the data Whel stores from free-text
              strings to canonical identifiers with structured metadata.
              Path B is knowledge-graph grounding, built using the{" "}
              <Link
                href="https://biocypher.org/"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                BioCypher
              </Link>{" "}
              framework (Lobentanzer et al., Nature Biotechnology 2023),
              restricted to Whel&apos;s six conditions and active-signal
              compounds. The knowledge graph informs the LLM at prompt
              time, following the knowledge-guided prompting pattern of Li
              et al. 2025 (IEEE J. Biomed. Health Inform.): mechanistic
              paths drawn from the subgraph relevant to a given signal are
              included as structured context during scoring, reducing the
              model&apos;s reliance on parametric memory alone. The graph
              also surfaces beside each signal as a disclosure layer
              (&ldquo;graph supports&rdquo; or &ldquo;graph silent&rdquo;)
              in the same shape as the existing MATRIX cross-reference at{" "}
              <Link href="/about/external-references" style={ENTRY_LINK}>
                /about/external-references
              </Link>
              .
            </p>
            <p style={ENTRY_PARA_NEXT}>
              Whel will not train a custom graph neural network for
              drug-condition link prediction. The platform consumes machine
              learning (Claude Opus 4.6 for extraction and scoring, MATRIX
              scores from Every Cure&apos;s KGML-xDTD as an external
              disclosure layer; see Fajgenbaum et al. 2024, The Lancet
              Haematology) but does not develop its own ML models. The
              knowledge-graph plus graph-neural-network prediction direction
              (TxGNN; Huang et al. 2024, Nature Medicine) is acknowledged as
              state-of-the-art for global drug repurposing prediction but is
              out of scope for an evidence index focused on women&apos;s
              hormonal health, where the value proposition is provenance and
              interpretability rather than throughput.
            </p>
          </EntryWrapper>

          {/* v3.3 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.3 &middot; June 7, 2026
            </div>
            <p style={ENTRY_PARA}>
              Source-coverage philosophy made explicit. The four automated
              pipelines (PubMed, ClinicalTrials.gov, FDA AEMS, Open Targets,
              Reddit) ingest representative sources per
              compound&ndash;condition pair through condition-keyed Boolean
              searches with publication-date and article-type filters,
              rather than exhaustive enumeration of every paper in the
              literature. For under-researched conditions this is a
              reasonable approximation of the available evidence base. For
              well-studied compound-condition pairs it surfaces synthesis
              papers (reviews, position statements, society guidelines) and
              may leave the original RCTs cited inside them outside the
              indexed sources. The L0&ndash;L3 grade carries the
              independent-corroboration question as a separate layer. A
              planned manual-curation extension, documented in the Roadmap
              register as &ldquo;Manual primary-source curation pass,&rdquo;
              will close the gap on high-evidence signals through the same
              human-in-the-loop worklist pattern that produced the L3
              grades. The featured-signal walkthrough on{" "}
              <Link href="/featured" style={ENTRY_LINK}>
                /featured
              </Link>{" "}
              already documents this gap in prose for the one signal it
              covers, in Section 04 &ldquo;Literature Whel did not
              ingest.&rdquo;
            </p>
          </EntryWrapper>

          {/* v3.2 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.2 &middot; June 1, 2026
            </div>
            <p style={ENTRY_PARA}>
              The external-evidence rubric (L0 / L1 / L2 / L3) is now
              codified in a schema-versioned sidecar at{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                lib/literature-grade-rubric.json
              </code>{" "}
              and surfaced on this page as a collapsible block in
              Section 04. v3.2 records the search procedure per source
              (PubMed, ClinicalTrials.gov, Cochrane, named guideline
              bodies), inclusion criteria and boundary rules at every
              level transition, source-attribution requirements per L
              assignment, and the conflict-resolution rule used when two
              reviewers disagree. No change to the sample, the
              comparators, or the pre-specified thresholds; the
              tightening makes the L assignment behind any signal
              reproducible against the printed rules, which the v3.1
              page implied but did not pin down.
            </p>
          </EntryWrapper>

          {/* v3.1 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.1 &middot; June 1, 2026
            </div>
            <p style={ENTRY_PARA}>
              Every Cure&apos;s MATRIX dataset is now surfaced as an
              independent biological-plausibility layer beside
              Whel&apos;s grades wherever MATRIX has coverage; it is not
              blended into the grades. A reproducible audit of MATRIX
              coverage over Whel&apos;s active compound&ndash;condition
              universe was run and published on this site (85.7%
              adjusted compound match rate, six of six conditions
              confirmed, full per-condition breakdown and dataset SHAs
              at{" "}
              <Link href="/about/external-references#coverage-disclosure" style={ENTRY_LINK}>
                /about/external-references &rarr; 01b &middot; Coverage disclosure
              </Link>
              ). No change to Whel&apos;s rubric, sample, or tier
              definitions.
            </p>
          </EntryWrapper>

          {/* v3 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3 &middot; May 29, 2026
            </div>
            <p style={ENTRY_PARA}>
              v3 records the close of an independent external review
              covering two findings. C1 (replication-score drift in the
              LLM rater): the rater prompts in all four pipelines were
              tightened to enforce literal source counting per the
              published rubric; 14 signals were downgraded to the tier
              the literature actually supports; 19 manually-verified
              PubMed citations were added so each remaining
              Moderate-tier signal carries the source count the strict
              rubric requires. S3 (ClinicalTrials.gov citation/condition
              mismatches across 21 audit rows): 10 signals were
              deactivated, 5 were reassigned from clinical-trial-finding
              to cross-condition framing, 1 source was dropped where the
              signal retained independent support, 2 sources were
              replaced with proper condition-specific citations (ESHRE
              2022 endometriosis guideline; 2025 network meta-analysis
              of hormone therapies for adenomyosis pain), and 1 row was
              documented as a ClinicalTrials.gov API field limitation.
              Recorded in database migrations 036 through 040. Planned
              extensions, including external cross-reference to Every
              Cure MATRIX scores and a cross-arm concordance flag, are
              documented on the Roadmap page.
            </p>
          </EntryWrapper>

          {/* v2 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v2 &middot; May 2026
            </div>
            <p style={ENTRY_PARA}>
              Named an external clinician-researcher as the primary
              rater in place of the project lead. The sample, the
              rubric, the external comparators, and the pre-specified
              thresholds are unchanged from v1. Sample numbers reflect
              the Whel database snapshot at time of publication. Updates
              to this page will be versioned and dated.
            </p>
          </EntryWrapper>

        </div>

        {/* ── Footer / back link ─────────────────────────────────────────── */}
        <div
          style={{
            borderTop: "1px solid var(--rule)",
            marginTop: 56,
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
              Related
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
              The methodology page itself records the live pre-registration;
              the roadmap records planned changes that have not yet shipped.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px" }}>
            <Link
              href="/about/methodology"
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
              ← Back to methodology
            </Link>
            <Link
              href="/about/roadmap"
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
              See the roadmap
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
