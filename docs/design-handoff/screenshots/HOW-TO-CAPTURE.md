# How to capture screenshots for the design handoff

The design tool will get more from a few good screenshots than from any written description. Here's exactly what to capture and how.

## What to capture

Capture each of these as a full-page screenshot (not just the visible viewport). On a Mac, the easiest way is **Cmd+Shift+5** → **Capture Entire Page** in Chrome, or use the Chrome extension "GoFullPage."

| Filename | URL | Notes |
|---|---|---|
| `01-homepage-desktop.png` | `/` | Full page, desktop width (~1440px). |
| `02-homepage-mobile.png` | `/` | Full page, mobile width (~390px iPhone). |
| `03-conditions-index.png` | `/conditions` | Desktop. |
| `04-condition-endometriosis-desktop.png` | `/conditions/endometriosis` | Desktop. This is the most important condition page since it has the most signals. |
| `05-condition-endometriosis-mobile.png` | `/conditions/endometriosis` | Mobile. |
| `06-condition-pmdd-desktop.png` | `/conditions/pmdd` | Desktop. PMDD has fewer signals than endo — useful for showing how the page handles a sparser case. |
| `07-condition-vulvodynia-desktop.png` | `/conditions/vulvodynia` | Desktop. Vulvodynia has the sparsest evidence; useful for showing how the page handles the empty/sparse state. |
| `08-signal-types.png` | `/signal-types` | Desktop. |
| `09-search.png` | `/search` | Desktop. Run a sample query first (e.g., "metformin") so the screenshot includes results. |
| `10-about.png` | `/about` | Desktop. |
| `11-technical-architecture-collapsed.png` | `/about/technical-architecture` | Desktop, all accordion sections collapsed. |
| `12-technical-architecture-expanded.png` | `/about/technical-architecture` | Desktop, with the "Inclusion Criteria and Evidence Scoring" section expanded so the rubric shows. |
| `13-contact.png` | `/about/contact` | Desktop. |
| `14-footer-detail.png` | (any page, scroll to footer) | Just the footer, full width. |

## Tight close-ups (also useful)

If you can spare a few more, these specific component close-ups are gold for a designer:

| Filename | What it captures |
|---|---|
| `15-signal-card-strong.png` | A close-up of a single Strong-tier signal card (e.g., GnRH Antagonists on the endo page). |
| `16-signal-card-emerging.png` | A close-up of an Emerging or Exploratory signal card. |
| `17-signal-card-community-reddit.png` | A close-up of a Reddit-sourced Community Forum Reports card. |
| `18-tier-badges.png` | All four tier badges side-by-side (zoom into the area showing Strong, Moderate, Emerging, Exploratory). |
| `19-evidence-arms-tabs.png` | The evidence-arm tabs on a condition page (the tab bar with Direct Research / Cross-Condition / Pathway / Community). |
| `20-stats-strip.png` | The homepage stats row (6 / 281 / 5 / 2.2K). |

## File naming and placement

- Place all screenshots in `docs/design-handoff/screenshots/`.
- Keep the numerical prefix so files sort in the right order.
- PNG preferred over JPG (text stays crisp).
- Don't downscale — original capture resolution is fine.

## What NOT to capture

- Don't bother with admin/auth flows; there aren't any.
- Don't capture the loading state.
- Don't capture animations mid-frame.

## Tip: Lighthouse as a bonus

If you want to hand the design tool a perceived-quality baseline, run Chrome DevTools' Lighthouse on the homepage and on `/conditions/endometriosis` and save the JSON or PDF reports here too. Designers love seeing the performance and accessibility starting point.
