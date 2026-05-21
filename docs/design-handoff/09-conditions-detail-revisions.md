# Conditions — detail page revisions

**Hand off to Claude Code with the round-2 mockups (Screenshots 2026-05-09 at 7.49–7.53 PM).** This is the working spec for rewriting the *individual* condition page (`/conditions/[slug]`) and its inner signal list, so they match the editorial register already in place on the homepage (`app/page.tsx`) and the conditions index (`app/conditions/page.tsx`).

The conditions **index** has already been rebuilt to the new system and ships as-is. Do not touch that file. This brief is exclusively about the detail page and the signal list inside it.

---

## Files to rewrite

1. `app/conditions/[slug]/page.tsx` — server component, hero + sidebar + figures + signals shell.
2. `app/conditions/[slug]/ResearchSignalsTabs.tsx` — client component, signal cards + filters.

Both files currently use hard-coded hex colors from the legacy palette (`#F5F3EF`, `#E0DDD8`, `#4D5E4D`, `#5C6B5D`, `#7A8B7A`, etc.). The whole point of this pass is to swap those for the design tokens defined in `app/globals.css` so the detail page reads like one document with the rest of the site.

Do **not** rebuild the data layer. The Supabase queries in `page.tsx` (conditions + repurposing_signals + nested compounds/sources) are correct, with one addition described below.

---

## New data field — `conditions.key_facts`

Migration `028_add_key_facts.sql` (already landed in `supabase/migrations/`) adds a `jsonb` column on `conditions`:

```ts
key_facts: { label: string; value: string }[]
```

Expect exactly **3 entries per condition**, in display order. Example payload (Endometriosis):

```json
[
  { "label": "PREVALENCE",       "value": "10 to 15% of reproductive-age women" },
  { "label": "DIAGNOSTIC DELAY", "value": "7 to 10 years on average" },
  { "label": "APPROVED THERAPY", "value": "No cure; hormonal suppression only" }
]
```

Render the `label` in mono uppercase + small + muted; render the `value` in serif (or sans, see mockup) at body size. These are the three fact pills under the hero H1.

Update the Supabase select in `page.tsx` to include `key_facts`:

```ts
supabase
  .from("conditions")
  .select("*, key_facts")
  .eq("slug", slug)
  .single();
```

(`select("*")` will already pick it up, but be explicit so the types stay honest.)

---

## Design tokens — use these, not hex literals

Everything in both files must reference tokens from `globals.css`. The current files violate this; the rewrite must fix it.

| Use                              | Token                       |
| -------------------------------- | --------------------------- |
| page background                  | `var(--bg)`                 |
| card / paper surface             | `var(--paper)`              |
| primary ink                      | `var(--ink)`                |
| body copy                        | `var(--ink-2)`              |
| metadata / labels                | `var(--muted)`              |
| very-low-emphasis text           | `var(--muted-2)`            |
| hairline rule                    | `var(--rule)`               |
| medium-weight rule               | `var(--rule-strong)`        |
| accent / link / CTA              | `var(--accent)` (navy)      |
| Strong tier fill / chip          | `var(--tier-strong)` on `var(--tier-strong-soft)` |
| Moderate tier fill / chip        | `var(--tier-moderate)` on `var(--tier-moderate-soft)` |
| Emerging tier fill / chip        | `var(--tier-emerging)` on `var(--tier-emerging-soft)` |
| Exploratory tier fill / chip     | `var(--tier-exploratory)` on `var(--tier-exploratory-soft)` |
| Direct Research arm              | `var(--arm-direct)`         |
| Cross-Condition arm              | `var(--arm-cross)`          |
| Pathway Insights arm             | `var(--arm-pathway)`        |
| Community Forum Reports arm      | `var(--arm-community)`      |

Fonts (already wired through `app/layout.tsx`): `var(--font-source-serif)` for headings, `var(--font-plex-sans)` for body, `var(--font-plex-mono)` for labels/eyebrows/scores. Use the `.font-heading`, `.font-mono`, `.eyebrow`, `.kicker`, and `.section-label` utility classes where they fit.

Sharp corners. The global rule in `globals.css` forces `border-radius: 0` on everything. Do not try to override it.

---

## Section-by-section spec

Match the mockups (Screenshots 2026-05-09 at 7.49–7.53 PM, both `[slug]` views — single-condition hero + figures + signal list). The numbered subsections below correspond to the visible blocks in those screenshots.

### 1. Hero block

A `--paper` panel above a hairline. Inside:

- **Breadcrumb** (mono, 11px, letter-spacing 0.16em, uppercase, `var(--muted)`): `Home › Conditions › {condition.name}`. Match the conditions index style exactly.
- **Eyebrow** (mono, 11px, uppercase, `var(--muted)`): the condition code (`C-01` through `C-06`). Derive from alphabetical index of conditions, same as the conditions index. If easier, pass it in from the index page or recompute here.
- **H1** (Source Serif 4, `clamp(2rem, 4.2vw, 3.25rem)`, weight 500, line-height 1.08, letter-spacing -0.02em, `var(--ink)`): `{condition.name}`. End with a period to match the homepage and index voice (`Conditions index.`).
- **Description** (sans, 1rem, line-height 1.65, `var(--ink-2)`, max-width ~62ch): `{condition.description}`.
- **Last-updated kicker** (mono, 12px, `var(--muted)`): `LAST REVIEWED MAY 2026` or wire to a real timestamp if one is available on the signals.

Below the H1 / description, a row of **three fact pills** from `key_facts`:

- 3-column grid on `sm:` and up; stack on mobile.
- Each pill: small mono uppercase label on top (`label`, `var(--muted)`, 10–11px, letter-spacing 0.16em), value below in serif or sans body weight, `var(--ink)`. Hairline left border (`1px solid var(--rule-strong)`) at 1px wide and the text indented from it — same rule treatment used elsewhere on the site.
- No pill backgrounds, no rounded chips. The site reads as paper, not as a dashboard.

### 2. "At a glance" sidebar table

Right column (or full-width below hero on mobile) — a compact two-column table summarizing the condition for a researcher who's just landed:

| Row                 | Source                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| `SIGNALS`           | `signals.length`                                                        |
| `STRONG · MODERATE` | tier counts derived from `signals`                                      |
| `LEAD ARM`          | most-populated `signal_type → arm` (use `lib/arm-mapping.ts`)            |
| `LAST REVIEW`       | latest `created_at` from `signals`, formatted `MMM YYYY`                 |
| `STATUS`            | `active`                                                                |

Mono labels left, ink values right, hairline rows between. This is the on-page equivalent of the homepage stat strip — short, factual, no flourish.

### 3. Figure A — Tier distribution

Numbered figure (`Figure A. Confidence tier distribution.`). A single horizontal stacked bar of the 4 tiers for this condition only, with counts and percentages labelled inline. Reuse the tier color tokens above. Caption below in serif italic with one interpretive sentence — match the homepage Figure 1/2 caption tone.

### 4. Figure B — Arm composition

Numbered figure (`Figure B. Evidence-arm composition.`). Same horizontal stacked-bar treatment, this time of the 4 arms (Direct Research, Cross-Condition Signals, Pathway Insights, Community Forum Reports). Use `lib/arm-mapping.ts` to bucket `signal_type → arm`. Same caption treatment.

### 5. Biology / Research & Funding context

The current page has two `<p>` blocks for `biology_summary` and `underfunding_notes`. Keep both, but restyle as two side-by-side paper panels with mono eyebrows (`BIOLOGY` / `RESEARCH & FUNDING`) and serif H3 sub-headings. No card backgrounds — paper surface with hairline rules between sections is the visual idiom across the site.

### 6. Signals section header

A simple block above the signal list:

- Eyebrow (mono): `REPURPOSING SIGNALS`.
- H2 (serif): `{signals.length} signals indexed.`
- One-sentence description in body sans, `var(--ink-2)`.

### 7. Filter / tab row (controls the signal list)

A single horizontal row across the top of the signal list:

- **Tier filter chips** (4): Strong / Moderate / Emerging / Exploratory, plus an `All` default. Use tier soft tokens for background, tier strong token for text. Active state: solid fill with white text. Inactive: soft fill with strong text.
- **Arm tabs** (4): Direct Research / Cross-Condition Signals / Pathway Insights / Community Forum Reports, plus `All`. Use arm color tokens for the underline of the active tab.

Both filters compose (AND). Counts must update live. No URL state required for v1 but please use `searchParams`-driven defaults if it's trivial — the homepage's tier links to `/conditions?tier=strong` should resolve to a sensible state here too.

### 8. Signal card (the unit that matters)

Each card is a paper panel with hairline above and below, no background fill, no rounded corners. Structure top-to-bottom (match the mockup precisely):

1. **Top row** — left: mono eyebrow `DIRECT RESEARCH` (or the active arm label). Right: tier chip (`STRONG` / `MODERATE` / `EMERGING` / `EXPLORATORY`) using tier tokens.
2. **H3** (serif, 1.5–1.75rem, weight 500): the compound's display name. Prefer `compounds.name`; show `compounds.generic_name` in parentheses, mono, `var(--muted)`, only if it differs from `name`.
3. **Score row** (mono): five small pip-bars (replication, source quality, specificity, plausibility, direction), each labelled with its dimension below the pips. Use existing `ScorePips` styling but swap the inactive color to `var(--rule-strong)` and the active color to the tier's strong token.
4. **`SUMMARY`** field — mono label, then `summary` in serif italic.
5. **`HYPOTHESIZED MECHANISM`** field — mono label, then `mechanism_hypothesis` in serif italic.
6. **Scoring dimensions table** — a tight 5-row table: dimension name (mono), level (sans, `replication_level` / `plausibility_level` / etc.), score out of 2 (mono). Hairline rows.
7. **Citations** — collapsed by default, opens to the existing `CollapsibleSources` component. Restyle to use the new tokens; structure is fine.
8. **Footer row** (mono, 11px, `var(--muted)`): left — the signal ID (`{conditionCode}-{ordinal}`, e.g. `ENDO-1`, `PCOS-12`); right — `Collapse ▾` (or `Expand ▸` if collapsed).

Cards are full-width inside the content column. No grid. Density target: a researcher can scan ten cards in one screen on a 15" laptop.

### 9. Empty state

When tier + arm filters yield zero results: a single line of body copy, mono kicker `NO SIGNALS · TRY ANOTHER FILTER`, and a `Clear filters` link in `var(--accent)`. No empty-state illustration.

---

## Component reuse

Where the homepage already has a component that does this work, import it rather than rebuilding.

- `app/components/MetaStrip.tsx` — consider extending so it can render either the global status bar (`281 SIGNALS ACROSS 6 CONDITIONS`) or a condition-scoped variant (`{signals.length} SIGNALS · CONDITION {conditionCode} · LAST REVIEW {date}`). If the cleanest path is a new `<ConditionMetaStrip />` that uses the same visual treatment, that is also fine — the visual must match.
- `app/components/TierHeatmap.tsx` — not used here, but read it for the tier-color conventions so Figure A and the tier chips agree with the homepage.
- `lib/arm-mapping.ts` — the canonical `signal_type → arm` mapping. Use it; do not reinvent.
- `app/components/ExternalLinkIcon.tsx` — keep using for outbound source links.

---

## What ships

The detail page should look like a chapter of the same publication as the homepage. Same paper surface, same hairlines, same mono labels, same serif headlines ending in periods, same numbered figures. A researcher arriving from the homepage stat strip or the conditions index should feel zero stylistic friction.

Treat the existing legacy palette (`#F5F3EF`, `#4D5E4D`, `#5C6B5D`, `#7A8B7A`, `#EDEAE4`, `#999`, `#444`) as removable. None of those literals should remain in either file after this pass. If grep finds any, the pass is not done.

---

## Acceptance checks (run before handing back)

1. `./node_modules/.bin/tsc --noEmit` exits 0.
2. `rg "#F5F3EF|#4D5E4D|#5C6B5D|#7A8B7A|#EDEAE4|#E0DDD8|#1a1a1a" app/conditions/\[slug\]/` returns no matches.
3. Every condition page (`/conditions/endometriosis`, `/conditions/pcos`, `/conditions/pmdd`, `/conditions/perimenopause-menopause`, `/conditions/adenomyosis`, `/conditions/vulvodynia`) renders without runtime errors at `next dev`.
4. The three fact pills render the values from `conditions.key_facts` (not hardcoded). Verify by changing one value in Supabase and refreshing — the page reflects it.
5. Tier filter + arm tab compose correctly: selecting `Strong` + `Direct Research` shows only signals that match both.
6. The signal IDs in the card footer (`ENDO-1`, `PCOS-12`, etc.) are stable across reloads — i.e. derived from a stable ordering of the signals (by `created_at` ascending is fine), not from array index after filtering.
7. No `localStorage`, `sessionStorage`, or other browser storage APIs.

---

## Summary of round-2 deltas (paste into commit message)

1. Add `conditions.key_facts` jsonb column + seed 3 facts per condition (migration 028, already landed).
2. Rewrite `app/conditions/[slug]/page.tsx` to the new design system: hero + fact pills + at-a-glance sidebar + Figure A (tier) + Figure B (arm) + biology/funding panels + signals shell.
3. Rewrite `app/conditions/[slug]/ResearchSignalsTabs.tsx` to the new signal-card layout with tier chips, score pips, scoring table, collapsible citations, signal IDs, and tier + arm filters.
4. Replace every legacy hex literal in both files with tokens from `globals.css`.
5. Reuse `MetaStrip`, `lib/arm-mapping.ts`, and `ExternalLinkIcon` rather than rebuilding.
