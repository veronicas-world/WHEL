# Whel — Design Implementation Brief for Claude Code

**Read this whole file before doing anything.** Veronica (the founder, non-technical) has a
redesign from Claude Design that she likes and wants implemented **in full** — the homepage
redesign, the page layouts, the visual style, the motion/animations, the graphs, and the new
copy/voice. Your job is to implement all of it on the frontend.

There is exactly **one hard rule**, and it matters more than anything else in this brief:

> ## 🚫 Do NOT touch the underlying data or the data layer.
> The redesign is **frontend only.** The database, the data, the pipeline, and the secrets are
> off-limits. Everything else (pages, components, styles, motion) is fair game.

---

## Before you start — git safety (this is how "edit later" stays possible)

The founder explicitly wants to implement the design in its entirety and **review/edit it later
and see what changed.** Version control is what makes that safe. So:

1. Check the working tree is clean and commit anything outstanding first.
2. Create and switch to a new branch, e.g. `git checkout -b design-redesign`.
3. Commit frequently, with clear messages, as you go.
4. **Do NOT `git push` and do NOT deploy.** Stay on the branch. The founder reviews the diff and
   decides when to merge/deploy herself.

This way every change is reversible and reviewable.

---

## ✅ What to implement (all of it)

- The **homepage** redesign.
- The **page layouts and visual style** from the design.
- **Motion / animations / transitions** (smooth reveals, moving graphs, etc.).
- The **graphs and data visualizations** (the look and the components).
- The **new language / copy / voice**.

Implement the design faithfully. The founder will provide the design files (an `index.html` plus
any CSS/JS) — ask her for them if they're not already in the repo. Treat that as the source of
truth for look, motion, and copy.

---

## 🚫 Hard guardrails — never do any of these

**Never modify, move, rename, or delete anything in these locations:**
- `supabase/` (all migrations, including `046_substrate_schema.sql` and `047_substrate_seed_pmdd.sql`)
- `scripts/` (the Python pipelines, including `scripts/substrate/`)
- `.env.local` and any other `.env*` file (these hold the database keys)
- `lib/supabase.ts` (the database connection — read from it, but do not change it)

**Never run any of these:**
- Any database / SQL / migration command, or any Supabase CLI command
  (no `supabase db ...`, no running of `.sql` files, nothing that writes to or resets the database).
- Any script in `scripts/` (especially `scripts/substrate/run.py` and the pipeline) — these are
  data tools, not part of the redesign.
- `git push`, any deploy command, or anything that changes the live site.

The live data lives in the cloud (Supabase) and the migrations are the record of how it was built.
Leaving all of the above untouched guarantees the data is safe no matter what the frontend does.

---

## 📊 How to handle numbers and real data (important nuance)

The design contains **hardcoded numbers that are NOT real** (placeholders Claude Design invented).
The founder is fine shipping those as placeholders for now and wiring real data in a later pass.
So:

- Implement the placeholder numbers/graphs **as the design shows them** for now, BUT wherever you
  place a hardcoded metric or chart value, leave a clear, greppable comment so it's easy to find
  later, for example:
  `{/* TODO(real-data): placeholder from design — wire to Supabase */}`
- **Do not delete the data-fetching code that already works.** Several existing pages already read
  **real** data from Supabase and must keep working:
  - `app/conditions/[slug]/page.tsx` (real repurposing signals)
  - `app/conditions/[slug]/substrate/page.tsx` (real claims + contradictions — this is the new
    evidence-substrate page; preserve its live data)
  - `app/conditions/`, `app/search/`, `app/signal-types/`, `app/featured/`
  If you restyle these pages, **keep the real data flowing into the new design** rather than
  replacing it with the design's fake numbers. If fully reconciling a page with the design is too
  big for one pass, preserve the original file (rename it `*.original.tsx` or keep it in git) so it
  can be reconnected — never silently bury a real, working number under a fake one.

In short: **real numbers stay real; invented numbers get a TODO comment.**

---

## 🧱 This repo's specifics (so you don't fight it)

- **Next.js 16, customized.** Per `AGENTS.md` at the repo root, the framework has breaking changes
  from what you may expect — **read the relevant guide in `node_modules/next/dist/docs/` before
  writing any Next.js code.** Pages are server components; dynamic route params are
  `params: Promise<{ slug: string }>` (await them).
- **Styling tokens live in `app/globals.css`** as CSS variables (`--ink`, `--paper`, `--bg`,
  `--accent`, fonts, etc.). The existing pages read from these variables, so updating tokens there
  restyles the whole site consistently. Put the design's colors/fonts/spacing here.
- **Components live in `app/components/`.** `Nav.tsx` and `Footer.tsx` are global (rendered in
  `app/layout.tsx`) — restyle them, don't duplicate them per page.
- **The Supabase read client is `lib/supabase.ts`** (anon key, read-only). Import and use it to
  read data; do not modify the file.
- If the design needs an animation library (e.g. `framer-motion`) or a charting library, install it
  as a normal project dependency (`npm install <pkg>`). That's fine.

---

## ✔️ When you're done

1. Run `npm run dev` and click through **every** page. Confirm nothing crashes and the existing
   data-backed pages still load real data.
2. Give the founder a short, plain-language summary of what changed (which pages, which files), and
   a list of every `TODO(real-data)` placeholder you left, so she knows what still needs real
   numbers wired in.
3. Leave everything on the `design-redesign` branch. Do not deploy. She'll review and decide.

The goal: the site **looks and reads** like Claude Design's redesign, the data layer is **completely
untouched**, and every change is **on a branch she can review and reverse.**
