# Conditions detail — Claude Design mockups (round 2)

Visual reference for the conditions detail page rebuild. Pair these with the
implementation brief at `../09-conditions-detail-revisions.md`.

The Endometriosis condition is used as the worked example throughout. Every
other condition page follows the same layout with its own data.

## Files in this folder

- `01-conditions-index.png` — the conditions **index** page. Already built and
  shipped; included only as a visual-consistency reference for the detail page.
- `02-condition-detail-page.png` — the individual **condition detail page**:
  hero, three fact pills, the "At a Glance" sidebar table, Figure A (tier
  distribution) and Figure B (arm composition). Primary target for
  `app/conditions/[slug]/page.tsx`.
- `03-signal-card-expanded.png` — an **expanded signal card**: arm eyebrow,
  tier chip, score row, summary, hypothesized mechanism, scoring dimensions
  table, citations, and the `SIGNAL · ENDO-1` footer. Target for the card in
  `app/conditions/[slug]/ResearchSignalsTabs.tsx`.
- `04-signal-cards-collapsed.png` — **signal cards in collapsed / mixed
  states**, showing the tier and arm variations and the `Open detail` control.
