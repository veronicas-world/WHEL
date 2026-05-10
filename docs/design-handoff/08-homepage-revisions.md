# Homepage revisions — round 2

**Hand back to Claude Design with the rest of the package.** This is the diff between what came back in iteration 1 and what should come back in iteration 2. Everything not listed here is approved — keep it.

---

## What's working — keep, do not change

These are the pieces of iteration 1 that are doing the heavy lifting for the "research artifact, not vibe-coded launch page" register. Carry forward unchanged:

- The **operational status bar** at the top of the page (`LIVE · INGESTION PAUSED FOR REVIEW · RELEASE 2026.04 · 281 SIGNALS ACROSS 6 CONDITIONS · 4 EVIDENCE ARMS · REVIEWED QUARTERLY`). Single biggest research-artifact signal on the page.
- The **eyebrow** above the hero: `AN INDEPENDENT RESEARCH INDEX · RELEASE 2026.04`. Versioning the index like a serial publication is exactly right.
- The **stat row** under the hero (signals indexed / conditions covered / strong-tier / last review).
- **Figure 1 — the 6×4 confidence heatmap** with `N = 281 SIGNALS · 6 × 4 MATRIX`, the "Click any cell to scope" affordance, and the dual color encoding (greens at Strong → taupe at Exploratory, plus within-column shading for count). Yes, this is two encodings on one chart and a purist would push back, but it's beautiful and it works. Keep.
- **Figure 2 — the source → arm → tier Sankey** with `5 SOURCES → 4 ARMS → 4 TIERS`. This is the methodology assertion of the entire site.
- **Numbered figures** (Figure 1, Figure 2). Extend this convention across the rest of the site too — Methodology page should pick up at Figure 3.
- **Conditions cards** with condition codes (`C-01` through `C-06`), signal counts, the four-segment tier-distribution color bar, `X strong · Y moderate` summary, and `Open →` affordance.
- **Signal cards** with arm label, drug name, score bar, direction, source, study count, tags, signal ID (`ENDO-1`, `ENDO-2`, etc.), and `Open detail` disclosure. The signal IDs are particularly important — they make signals citable. Keep.
- **The color palette** (cream background + olive/sage greens + ochre + taupe + black). Big upgrade. Read like Lancet / Aeon / Atlantic, not Tailwind.
- **Typography pairing** (display serif + mono for tags and labels + sans body). Keep the use of italics — not bold — for emphasis. Academic register.
- The whole **`Whel`** wordmark treatment. Pick it over `WHEL` all-caps; it pairs better with the editorial typography.

---

## CRITICAL CORRECTION — wordmark subtitle

The mockup has the wordmark subtitle as `WOMEN'S HEALTH EVIDENCE LIBRARY`.

**It should be `WOMEN'S HEALTH EVIDENCE LAB`.** WHEL = **L**ab, not Library.

Fix everywhere this appears in the design (header logo, footer, browser tab title, social card metadata, OG image if generated).

---

## Hero headline — replace

**Current (do not ship):**

> An evidence index for the conditions *medicine forgot* to study.

**Why it's not landing:**

The rest of the page is restrained, operational, almost severe — status bar, figure numbers, signal IDs, no exclamation points. The H1 is a rhetorical flourish that breaks register. To a senior biomedical informatics researcher (the primary audience), it reads as positioning, not science. "Forgot" is also editorializing in a way the rest of the project deliberately avoids — women were *systematically excluded* from US clinical research until the 1993 NIH Revitalization Act, and the structural underfunding is documented and ongoing. "Forgot" softens a deliberate pattern into an oversight. The right column already says it correctly: *"persistently underfunded, undertreated, and under-diagnosed."* The H1 should match that register.

It also centers the grievance instead of the artifact. Compare peer projects:

- Open Targets — *"A platform for therapeutic target identification and validation."*
- DepMap — *"Defining the genetic and pharmacologic dependencies that sustain cancer cells."*
- Phendo — *"A research app to help understand endometriosis."*

None lead with the gap. They lead with what the artifact *does*. Whel's H1 should too.

**New headline (use this one):**

> An evidence index for under-researched women's health conditions.

**Acceptable alternatives if the team prefers a different cadence:**

1. *An independent evidence index for six women's health conditions.* — names scope and provenance posture.
2. *281 signals across six women's health conditions, scored and provenanced.* — data-led; pairs with the operational status bar.
3. *An evidence index for endometriosis, PCOS, PMDD, perimenopause, adenomyosis, and vulvodynia.* — names the conditions explicitly. Long but maximally honest.

Pick one of these four. The current "medicine forgot to study" line is good copy, just in the wrong slot — see next section.

---

## Demoted founder-voice line — keep, relocate

The line "the conditions medicine forgot to study" should not disappear. It's true to the project's emotional center and it would be a loss to cut entirely. Move it to one of the following slots:

- **Inside the right-column description.** Replace the current sentence *"…has no FDA-approved therapy."* with: *"PCOS, the most common endocrine disorder of reproductive age, has no FDA-approved therapy. These are the conditions medicine has been slow to study."* (Note the softer "slow to study" instead of "forgot" — keeps the spirit, drops the editorializing.)
- **As a pull quote on the About page** in the project-origin section.
- **As the opening line of the Substack writeup**, where founder voice is on-genre.

Do not put it in the H1.

---

## Author and citation block — add

A senior researcher will look for "who made this" within the first 60 seconds. The current homepage does not surface this anywhere visible. Add a small block — does not need to be hero-prominent — somewhere between Figure 2 and the conditions index, or in the footer above the legal/links row.

Block contents:

> **Authors.** Veronica Agudelo Ramella¹, [co-author name pending]².
> ¹Independent researcher. ²[Affiliation pending].
> Correspondence: vagudeloramella@gmail.com · ORCID: [pending]
>
> **How to cite.** Agudelo Ramella V, [co-author], 2026. *Whel: Women's Health Evidence Lab — A Multi-Source Drug Repurposing Signal Database for Under-Researched Women's Hormonal Conditions, v0.1 (Release 2026.04).* https://rediscover-coral.vercel.app · DOI: [pending Zenodo deposit].

Style: same restrained register as the rest of the page. Mono labels (`AUTHORS`, `HOW TO CITE`), small body text, hairline border above and below. Think NEJM Evidence article footer, not personal-website "About me."

This block is the line between "research project" and "press release." Without it the design looks like a startup landing page; with it the design looks like an artifact that wants to be cited.

---

## Numbers in the mockup — wire to live data

All numerics displayed in iteration 1 are mockup values. Treat them as placeholders. The implementation needs to bind them to the live database. The shapes are right; the values need to come from the actual counts at build time.

Specifically the values that need wiring:

- Status bar: `RELEASE 2026.04`, `281 SIGNALS ACROSS 6 CONDITIONS`, `4 EVIDENCE ARMS`.
- Eyebrow: `RELEASE 2026.04`.
- Hero CTA: `Browse 281 signals →` — bind to live signal count.
- Stat row: `281` signals indexed, `6 + 4 in pipeline` conditions, `17` strong-tier, `Apr 2026` last review.
- Figure 1 caption: `N = 281 SIGNALS · 6 × 4 MATRIX`.
- Figure 1 cells: every count and percentage (e.g. Endometriosis Emerging `31 / 46%`).
- Figure 2: every node count (PubMed 142, ClinicalTrials.gov 38, FDA AEMS 47, Open Targets 31, Reddit 23; Direct Research 136, Cross-Condition Signals 65, Pathway Insights 57, Community Forum Reports 23; Strong 17, Moderate 56, Emerging 108, Exploratory 100).
- Conditions cards: every signal count and `X strong · Y moderate` summary.

Math sanity-checks pass on the mockup (sources sum to 281, arms sum to 281, tiers sum to 281), but no claim is made that those are the current DB values. Implementation will replace.

---

## Status bar truthiness — verify before launch

The status bar reads `INGESTION PAUSED FOR REVIEW`. Only show this if it's currently true. Otherwise toggle to `INGESTION ACTIVE` or similar. The status bar should reflect actual operational state, not a default mockup value — that's what makes it credible.

Suggested states:

- `LIVE · INGESTION ACTIVE` — pipelines running on schedule.
- `LIVE · INGESTION PAUSED FOR REVIEW` — pipelines temporarily halted while results are reviewed.
- `LIVE · NEXT REVIEW [DATE]` — between scheduled reviews, for the long stretches of stability.

This wants a small Supabase column or a config file that the home page reads at build / request time.

---

## "+4 in pipeline" — name them or remove

Under the `CONDITIONS COVERED` stat, the current copy says `6 + 4 in pipeline`. A researcher will read that as a concrete claim. Either:

- Name the four planned conditions in a tooltip or in the technical-architecture page, OR
- Remove the `+ 4 in pipeline` modifier until it's substantive.

Do not ship the vague form.

---

## Smaller notes

- **Figure 1 footer cue** (`↑ Color scales with signal count within each tier`) is great. Keep, and consider adding a parallel cue under Figure 2 explaining the ribbon thickness encoding.
- **Figure 2 caption** ("Each ribbon is one provenance pathway. Direct Research dominates Strong-tier; Pathway and Community signals concentrate in Emerging and Exploratory…") is excellent — exactly the right interpretive tone. Carry that voice into all figure captions across the site.
- **`Open Endometriosis index →`** as the CTA in the "Recently surfaced signals" section is clever — drives further exploration. Apply the same pattern elsewhere where there's a natural funnel.
- **Search bar** in the header (`Search signals, drugs, m… ⌘K`) — the truncation is fine, but if there's room, lengthen the placeholder slightly for clarity (`Search signals, drugs, mechanisms…`).

---

## Summary of round-2 deltas

A short list to paste into a commit message or design ticket:

1. Wordmark subtitle: `LIBRARY` → `LAB` (everywhere it appears).
2. Hero H1: replace with *"An evidence index for under-researched women's health conditions."*
3. "Medicine forgot to study" line: relocate to right-column description (with softening) or About page.
4. Add an authors + how-to-cite block between Figure 2 and the conditions index, or in the footer.
5. Treat all displayed numbers as placeholders; bind to live DB values at implementation.
6. Status bar copy must reflect actual ingestion state, not a default.
7. Resolve `+ 4 in pipeline` — name them or drop the phrase.

Everything else from iteration 1 ships as-is.
