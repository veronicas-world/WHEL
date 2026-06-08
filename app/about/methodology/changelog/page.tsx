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
            Revision history · current version v3.11
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

          {/* v3.11 */}
          <EntryWrapper isFirst>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.11 &middot; June 7, 2026
            </div>
            <p style={ENTRY_PARA}>
              OT-DRUGNAME backfill: the 10 active-signal Open Targets
              source rows flagged in v3.10 as storing a synthetic{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>OT-{`{DRUGNAME}`}</code>{" "}
              shorthand in{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>sources.external_id</code>{" "}
              have been backfilled to the canonical CHEMBL identifier
              for each drug. CHEMBL IDs were resolved via the Open
              Targets GraphQL{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>search(entityNames: [&quot;drug&quot;])</code>{" "}
              endpoint and independently verified through the same{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>drug(chemblId: $id)</code>{" "}
              query that the audit verifier calls. The 10 mappings:
              APREPITANT &rarr; CHEMBL1471, DESVENLAFAXINE &rarr;
              CHEMBL1118, ENZALUTAMIDE &rarr; CHEMBL1082407,
              TRIMEBUTINE &rarr; CHEMBL190044, TASIMELTEON &rarr;
              CHEMBL2103822, TRADIPITANT &rarr; CHEMBL3544984, OLAPARIB
              &rarr; CHEMBL521686, FOSNETUPITANT &rarr; CHEMBL3989917,
              MILNACIPRAN &rarr; CHEMBL259209, and TRIIODOTHYRONINE
              (liothyronine) &rarr; CHEMBL1544. For each drug, the top
              search hit is the base compound; salt and prodrug forms
              (e.g. DESVENLAFAXINE SUCCINATE, LIOTHYRONINE SODIUM)
              appeared as alternates and were rejected so the
              backfilled IDs match the convention of the 38 existing
              canonical Open Targets rows in the sources table, which
              store base CHEMBL IDs rather than salt-form variants.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              The backfill ships as Supabase migration{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                supabase/migrations/044_backfill_ot_drugname_to_chembl.sql
              </code>
              . Each of the ten UPDATE statements targets one specific
              source row by its UUID id AND its expected old{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>external_id</code>,
              so the migration is a no-op on any row that has already
              been touched and safe to re-run. The migration updates
              two columns on each row:{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>external_id</code>{" "}
              from{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>OT-{`{DRUGNAME}`}</code>{" "}
              to the canonical CHEMBL ID, and{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>url</code>{" "}
              from a{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>platform.opentargets.org/disease/{`{GO_or_EFO}`}</code>{" "}
              link to the matching{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>platform.opentargets.org/drug/CHEMBL{`{id}`}</code>{" "}
              link, matching the URL shape of the 38 existing canonical
              rows. Title and key-finding columns are unchanged.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              User-visible effect on{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>/conditions/[slug]</code>{" "}
              drug cards: the source-attribution chip rendered alongside
              each affected Open Targets signal changes from a synthetic
              label (e.g. &ldquo;OT-APREPITANT&rdquo;) to the canonical
              CHEMBL identifier (&ldquo;CHEMBL1471&rdquo;), and the
              outbound link goes to the drug page rather than the
              disease page. The disease page showed every drug for the
              condition; the drug page shows every disease for the
              drug. Both are valid Open Targets surfaces; the drug page
              is the more useful destination for a citation that is
              evidencing a specific drug-condition pair.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              Expected audit shift after the migration runs: in the
              next{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/verify-database-sources.py</code>{" "}
              report, the opentargets resolved_match count rises from
              38 to 48, the unresolved count for opentargets drops from
              10 to 0, and the headline summary on{" "}
              <Link
                href="/about/external-references#output-validation-in-progress"
                style={ENTRY_LINK}
              >
                /about/external-references &rarr; 01d
              </Link>{" "}
              shifts from &ldquo;170 resolved_match / 10 unresolved&rdquo;
              to &ldquo;180 resolved_match / 0 unresolved.&rdquo; The
              Roadmap row{" "}
              <em>Backfill canonical Open Targets identifiers on
              signals using OT-DRUGNAME shorthand</em>{" "}
              flips from Planned to Live; the v3.10 architectural-debt
              finding is closed.
            </p>
          </EntryWrapper>

          {/* v3.10 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.10 &middot; June 7, 2026
            </div>
            <p style={ENTRY_PARA}>
              First database-sources audit run. The Path C Phase 1
              tooling that shipped in v3.9 was executed on the live
              Whel{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>sources</code>{" "}
              table:{" "}
              <strong style={{ color: "var(--ink)" }}>2,166 source rows</strong>{" "}
              across all active signals, audited row by row against
              the canonical external source for each identifier type.
              The homepage stat strip renders a separate live
              Supabase count that includes sources attached to
              deactivated or hidden signals as well (currently
              showing 2,176; the 10-row delta is the deactivated-signal
              source rows that are no longer rendered on any{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>/conditions/[slug]</code>{" "}
              drug card). The audit is intentionally scoped to
              active-signal sources, because those are the citations
              currently visible to users; deactivated-signal source
              rows are out of scope until they are reactivated.
              Result: 170 fully resolved with matching metadata, 1,986
              format-only passes (FAERS dashboard URLs and Reddit
              permalinks that pass the well-formed-URL pattern but
              cannot be resolved further because neither publisher
              exposes a record-lookup API), and 10 unresolved. There
              were zero{" "}
              <em>resolved_mismatch</em>{" "}
              entries: every PubMed PMID, every ClinicalTrials.gov
              NCT ID, and every canonical Open Targets identifier that
              resolved did so with a stored title matching the
              canonical title within the 0.80 fuzzy threshold. That
              is a strong positive signal that the LLM extraction
              pipeline is producing accurate metadata for the
              identifier types where canonical metadata is checkable:
              113 of 113 PubMed rows clean, 19 of 19 ClinicalTrials.gov
              rows clean, 38 of 38 canonical Open Targets rows clean.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              The 10 unresolved entries are all Open Targets rows
              where the{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>external_id</code>{" "}
              column stores a synthetic shorthand of the form{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>OT-{`{DRUGNAME}`}</code>{" "}
              rather than a canonical Open Targets identifier (CHEMBL
              ID, ENSEMBL gene ID, or EFO / MONDO disease ID). The
              ten drug names are: APREPITANT, DESVENLAFAXINE,
              ENZALUTAMIDE, TRIMEBUTINE, TASIMELTEON, TRADIPITANT,
              OLAPARIB, FOSNETUPITANT, MILNACIPRAN, and
              TRIIODOTHYRONINE (liothyronine). The Open Targets
              GraphQL search correctly does not resolve these because
              they are not Open Targets identifiers. However, the{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>url</code>{" "}
              column on these rows points at a real{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>platform.opentargets.org</code>{" "}
              page (with a real GO / EFO disease ontology ID), and
              the descriptive title in the{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>title</code>{" "}
              column carries the actual drug-target-disease finding
              (e.g. &ldquo;Aprepitant — genetic_target_overlap for
              menopause (target: TACR1, OT score: 0.482)&rdquo;).
              So users see a valid citation that links to a real
              Open Targets page; the failure is at the
              identifier-storage layer, not the user-visible content
              layer. Same shape as the Bate finding in v3.8 (real
              underlying citation, mangled metadata).
            </p>
            <p style={ENTRY_PARA_NEXT}>
              The 10 entries are kept in the audit as{" "}
              <em>unresolved</em>{" "}
              rather than patched into{" "}
              <em>format_only_pass</em>{" "}
              so the architectural debt stays visible. A new Roadmap
              row records the fix: backfill the canonical Open
              Targets identifier (CHEMBL for the drug, plus the
              specific target ENSEMBL ID and the disease MONDO/EFO ID
              that the URL already points at) on each of the 10
              signals. The fix would reduce the unresolved count to
              zero on the next audit run without changing what is
              rendered to users. Recorded on the Roadmap under{" "}
              <em>Backfill canonical Open Targets identifiers on
              signals using OT-DRUGNAME shorthand</em>.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              Where Path C Phase 1 now stands: the manifest audit
              covers 22 hand-written prose references and the
              database-sources audit covers 2,166 live database
              rows. Both run on demand from{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/verify-citations.py</code>{" "}
              and{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>scripts/verify-database-sources.py</code>,
              both gated by{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>--strict</code>,
              and both surface their results on{" "}
              <Link
                href="/about/external-references#output-validation-in-progress"
                style={ENTRY_LINK}
              >
                /about/external-references &rarr; 01d
              </Link>
              . Phase 1 is now complete for the existing citation
              surface. Phase 2 (sentence-level summary grounding via
              Sentence-BERT) and Phase 3 (prompt hardening that
              forbids LLM citation generation outside the Phase 1
              manifest) remain Planned.
            </p>
          </EntryWrapper>

          {/* v3.9 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.9 &middot; June 7, 2026
            </div>
            <p style={ENTRY_PARA}>
              Phase 1 audit scope expanded in two directions: the
              pre-verified citation manifest now covers the
              featured-page references, and the tooling for auditing
              the live database{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                sources
              </code>{" "}
              table shipped. Together these close the gap between
              &ldquo;hand-written prose citations are audited&rdquo;
              (v3.8) and &ldquo;every citation rendered to a user can
              be audited.&rdquo; The featured-page expansion added
              eight references to the manifest: six PMIDs from{" "}
              <Link href="/featured" style={ENTRY_LINK}>/featured</Link>{" "}
              (Jung &amp; Brubaker 2019, Lethaby et al. 2016, NAMS 2020,
              Raz &amp; Stamm 1993, Perrotta et al. 2008, Anger et al.
              2022) and two PMIDs from{" "}
              <Link href="/featured/anastrozole-endometriosis" style={ENTRY_LINK}>
                /featured/anastrozole-endometriosis
              </Link>{" "}
              (the two PMC-linked systematic reviews). After the
              expansion, the verifier ran on 22 entries.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              First run flagged a real author misattribution on the
              live anastrozole-endometriosis featured page. The page
              cited &ldquo;Nawathe et al., 2011&rdquo; pointing at{" "}
              <Link
                href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3141646/"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                PMC3141646
              </Link>
              , which converts to PMID 21693038. PubMed esummary returns
              that PMID as Ferrero S, Gillott DJ, Venturini PL &amp;
              Remorgida V 2011, &ldquo;Use of aromatase inhibitors to
              treat endometriosis-related pain symptoms: a systematic
              review&rdquo; (Reproductive Biology and Endocrinology) —
              the journal and year were correct, the description on the
              featured page matched the Ferrero paper exactly, but the
              author attribution was simply wrong. The featured page
              and the manifest were both corrected to attribute Ferrero
              rather than Nawathe. The second featured-page reference
              (the 2023 systematic review of systematic reviews in
              Drug Design, Development and Therapy) was unattributed in
              the original copy; PubMed esummary returned Peitsidis P
              as first author, and the featured page was updated to
              read &ldquo;Peitsidis P et al. 2023&rdquo; with the
              canonical title. A small verifier patch landed alongside:
              corporate-authored guideline papers like NAMS 2020 GSM
              return an empty first-author surname from PubMed (NAMS
              Editorial Panel is a corporate author, not a personal
              one), and the surname-equality check now treats two
              explicitly-empty surnames as a valid match for that case.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              Tooling for the live database-sources audit shipped at the
              same time as two new artifacts. The export script at{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                scripts/export-sources-for-audit.py
              </code>{" "}
              queries the Whel database&apos;s{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                repurposing_signals
              </code>{" "}
              and{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                sources
              </code>{" "}
              tables and dumps every active-signal source row to{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                lib/sources-audit-snapshot.json
              </code>
              . The verifier at{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                scripts/verify-database-sources.py
              </code>{" "}
              audits the snapshot row by row against the canonical
              source for each identifier type: PMIDs against NCBI
              E-utilities, NCT IDs against ClinicalTrials.gov API v2,
              Open Targets identifiers against the Open Targets GraphQL
              API, and FAERS and Reddit URLs against format checks
              (URLs are well-formed, point at the correct host,
              include the expected path segments). Output lands in{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                scripts/audit-output/database-sources-audit-report.json
              </code>{" "}
              and{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                lib/database-sources-audit-snapshot.json
              </code>
              , which the disclosure on{" "}
              <Link
                href="/about/external-references#output-validation-in-progress"
                style={ENTRY_LINK}
              >
                /about/external-references 01d
              </Link>{" "}
              reads from. Until the export runs and the snapshot is
              committed, the disclosure shows the &ldquo;tooling
              shipped, awaiting first run&rdquo; block instead of live
              numbers — the honest state.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              What is not yet audited: the export step requires
              Supabase credentials, which only run locally, so the
              database-sources audit cannot complete in this
              transparency cycle until the export runs. The next
              methodology entry will record the first run&apos;s
              numbers and any findings. After that, both the manifest
              audit and the database-sources audit run on every push;
              both are gated by the same{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                --strict
              </code>{" "}
              convention.
            </p>
          </EntryWrapper>

          {/* v3.8 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.8 &middot; June 7, 2026
            </div>
            <p style={ENTRY_PARA}>
              Path C Phase 1 (citation validation) goes live as code.
              The manual audit that produced the v3.7 entry was the
              prototype; v3.8 ships the engineered version. The
              implementation has three artifacts. A structured
              pre-verified reference list at{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                lib/whel-citations.json
              </code>{" "}
              records every external citation that appears on a public
              surface, with its identifiers and the metadata claimed by
              the citing surface. A verifier script at{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                scripts/verify-citations.py
              </code>{" "}
              resolves every PMID against the NCBI E-utilities esummary
              endpoint, every DOI against the Crossref REST API
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                {" "}works/&#123;doi&#125;
              </code>{" "}
              endpoint, and every arXiv ID against the arXiv API, then
              compares returned canonical metadata (title,
              first-author surname, container title, year) against the
              claims in the manifest using fuzzy match with calibrated
              thresholds. Output is written to two sinks: the
              human-readable run log at{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                scripts/audit-output/citation-audit-report.json
              </code>{" "}
              and a site-imported sidecar at{" "}
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                lib/citation-audit-snapshot.json
              </code>{" "}
              that the external-references disclosure reads from. A
              <code style={{ fontFamily: "inherit", color: "var(--ink-2)" }}>
                {" "}--strict
              </code>{" "}
              flag exits non-zero on any unresolved or mismatched
              entry and is wired for pre-publish use in CI.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              The first official run on June 7, 2026 found that the
              audit script catches exactly the failure modes it was
              built to catch. Five real issues surfaced in the initial
              manifest, all of which had previously slipped past the
              manual review process that produced the v3.7 cleanup.
              One was a wrong title attached to a real DOI: the Bate
              &amp; Evans 2009 reference in the methods PDF cited
              &ldquo;Quantitative methods for pharmacovigilance signal
              detection&rdquo; but the canonical title for DOI{" "}
              <Link
                href="https://doi.org/10.1002/pds.1742"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                10.1002/pds.1742
              </Link>{" "}
              is &ldquo;Quantitative signal detection using spontaneous
              ADR reporting.&rdquo; The DOI resolved, the authors
              matched, the year matched, but the title was wrong. This
              is the exact failure mode (real identifier, mangled
              metadata) that Phase 1 was built to catch and that pure
              identifier resolution misses. Three further issues were
              epub-versus-journal-issue year mismatches on Ma 2023
              KGML-xDTD, Pushpakom 2019 Drug repurposing, and Ochoa 2023
              Open Targets, all of which are real and widely accepted
              citations but whose Crossref records show the epub year
              while site copy and the methods PDF use the journal-issue
              year. The verifier was relaxed to accept a 1-year
              tolerance for this real-world citation noise, with a
              comment in the script explaining why. The fifth issue
              was a Crossref-side metadata gap on the Zunzunegui Sanz
              bioRxiv DOI; the verifier was patched to fall back to
              the canonical container name when the DOI prefix
              identifies the work as a bioRxiv preprint.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              After the manifest and verifier patches landed, the
              re-run cleared all 14 entries (resolved + match for
              every citation). The live audit numbers are now
              surfaced on{" "}
              <Link
                href="/about/external-references#output-validation-in-progress"
                style={ENTRY_LINK}
              >
                /about/external-references &rarr; 01d
              </Link>{" "}
              replacing the &ldquo;what the disclosure will display
              when shipped&rdquo; placeholder, alongside the failure
              modes the first run caught. Phase 2 (sentence-level
              summary grounding via Sentence-BERT) and Phase 3 (prompt
              hardening so the LLM can only cite from the pre-verified
              manifest) remain Planned; the disclosure surface now
              explicitly distinguishes Phase 1 results from what
              Phases 2 and 3 will add. The strict-mode CI gate is in
              place but not yet wired to the deploy pipeline; that
              wiring is a separate small step recorded on the Roadmap.
            </p>
          </EntryWrapper>

          {/* v3.7 */}
          <EntryWrapper>
            <div style={ENTRY_EYEBROW}>
              Methodology v3.7 &middot; June 7, 2026
            </div>
            <p style={ENTRY_PARA}>
              Site-wide citation audit. Five citations recorded in earlier
              methodology entries and on the public site were flagged in
              external review as either misattributed or post-knowledge-cutoff
              fabrications generated by the LLM scoring layer. Three did not
              correspond to real papers as written (Gong et al. 2026
              &ldquo;Reference fabrication in biomedical large language
              models&rdquo; in Bioengineering; Li et al. 2025 on
              knowledge-guided prompting in IEEE J. Biomed. Health Inform.;
              Zong et al. 2026 &ldquo;EvidenceNet&rdquo; as a paper title
              rather than a dataset name). Two were partially fabricated
              with real underlying identifiers (KGML-xDTD was attributed to
              Fajgenbaum et al. 2024 Lancet Haematology rather than the
              actual Ma, Zhou, Liu &amp; Koslicki 2023 GigaScience paper;
              Zunzunegui Sanz et al. 2025 had a real bioRxiv DOI but the
              wrong title and author list).
            </p>
            <p style={ENTRY_PARA_NEXT}>
              Each flagged citation was verified against canonical
              external sources (NCBI E-utilities for PMIDs, Crossref REST
              API for DOIs, arXiv for arXiv identifiers) and replaced
              with one of three outcomes per the audit policy. Where a
              real underlying paper exists with mangled bibliographic
              details, the citation was updated to the canonical record:
              KGML-xDTD now cites Ma, Zhou, Liu &amp; Koslicki (GigaScience
              2023,{" "}
              <Link
                href="https://doi.org/10.1093/gigascience/giad057"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                doi:10.1093/gigascience/giad057
              </Link>
              ); Zong et al. 2026 now cites the real arXiv paper at{" "}
              <Link
                href="https://arxiv.org/abs/2603.28325"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                arXiv:2603.28325
              </Link>{" "}
              with its correct title and author list (EvidenceNet is the
              dataset name introduced in the paper, not the paper title);
              Zunzunegui Sanz et al. 2025 now cites the correct title
              from the real bioRxiv record at{" "}
              <Link
                href="https://doi.org/10.1101/2025.06.13.659527"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                doi:10.1101/2025.06.13.659527
              </Link>
              . Where the citation did not correspond to a real paper,
              it was either dropped and the surrounding claim rewritten,
              or replaced with a real substitute paper that supports the
              same claim. The fabricated &ldquo;47 to 55 percent biomedical
              LLM reference fabrication rate&rdquo; citation (Gong 2026)
              was replaced with the real Bhattacharyya et al. 2023 study
              in Cureus (PMID 37337480,{" "}
              <Link
                href="https://doi.org/10.7759/cureus.39238"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                doi:10.7759/cureus.39238
              </Link>
              ), which examined 115 references across 30 ChatGPT-generated
              medical papers and reported 47 percent fully fabricated, 46
              percent authentic but with bibliographic errors, and 7
              percent fully accurate; the supporting Gravel,
              D&apos;Amours-Gravel &amp; Osmanlliu 2023 study (Mayo Clin
              Proc Digit Health,{" "}
              <Link
                href="https://doi.org/10.1016/j.mcpdig.2023.05.004"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                doi:10.1016/j.mcpdig.2023.05.004
              </Link>
              ) was added alongside it. The Li et al. 2025 knowledge-guided
              prompting citation was dropped without substitution; the
              underlying concept is well-supported in the broader
              biomedical NLP literature without requiring a single named
              source.
            </p>
            <p style={ENTRY_PARA_NEXT}>
              Fixes were applied to every public surface where the
              flagged citations appeared: this changelog page, the
              methodology page section 04, the external-references page
              sections 01c and 01d, the roadmap REGISTER rows for the
              MATRIX cross-reference and Path A, B, and C, and both
              sources for the methods PDF
              (docs/methods-draft.md and docs/methods-print.html). The
              methods PDF binary at public/whel-methods-v0.1.pdf was
              version-bumped in the HTML source to v0.2 (June 2026,
              citation audit); the regenerated PDF binary will land in
              public/ in a follow-up step. The audit was conducted by
              manual lookup, which is the same procedure that Path C
              Phase 1 will run as code once the citation-validation
              pipeline ships; Path C Phase 3 (prompt hardening that
              forbids citation generation outside a pre-verified
              reference list) is what prevents this failure mode going
              forward.
            </p>
          </EntryWrapper>

          {/* v3.6 */}
          <EntryWrapper>
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
              what the source actually says, the risk pattern documented
              by Bhattacharyya et al. 2023 (Cureus,{" "}
              <Link
                href="https://doi.org/10.7759/cureus.39238"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                doi:10.7759/cureus.39238
              </Link>
              ) applied to Whel&apos;s task); and
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
              medical LLM reference fabrication documents high error
              rates: Bhattacharyya, Miller, Bhattacharyya &amp; Miller
              2023 (Cureus,{" "}
              <Link
                href="https://doi.org/10.7759/cureus.39238"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                doi:10.7759/cureus.39238
              </Link>
              , PMID 37337480) examined 115 references across 30
              ChatGPT-generated medical papers and found 47% fully
              fabricated, 46% authentic but with bibliographic errors,
              and only 7% authentic and accurate; Gravel, D&apos;Amours-Gravel
              &amp; Osmanlliu 2023 (Mayo Clin Proc Digit Health,{" "}
              <Link
                href="https://doi.org/10.1016/j.mcpdig.2023.05.004"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                doi:10.1016/j.mcpdig.2023.05.004
              </Link>
              ) reported a similar pattern of fabricated and inaccurate
              citations in ChatGPT-generated medical content. The
              hybrid-architecture literature on combining structured
              biomedical knowledge with LLM extraction (Zong, Lv, Xue,
              Zheng, Wan &amp; Zhang 2026,{" "}
              <Link
                href="https://arxiv.org/abs/2603.28325"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                arXiv:2603.28325
              </Link>
              , which introduces the EvidenceNet dataset; Zunzunegui Sanz,
              Otero-Carrasco &amp; Rodr&iacute;guez-Gonz&aacute;lez 2025
              on LLM-assisted drug-repurposing hypothesis validation,
              bioRxiv,{" "}
              <Link
                href="https://doi.org/10.1101/2025.06.13.659527"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                doi:10.1101/2025.06.13.659527
              </Link>
              ) shows that adding structured external knowledge on top of
              LLM extraction improves accuracy and interpretability.
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
              time, following the knowledge-augmented prompting pattern
              documented in the biomedical NLP literature: mechanistic
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
              scores from Every Cure as an external disclosure layer, where
              MATRIX builds on the KGML-xDTD graph-ML framework of Ma,
              Zhou, Liu &amp; Koslicki,{" "}
              <Link
                href="https://doi.org/10.1093/gigascience/giad057"
                target="_blank"
                rel="noopener noreferrer"
                style={ENTRY_LINK}
              >
                GigaScience 2023
              </Link>
              ) but does not develop its own ML models. The
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
