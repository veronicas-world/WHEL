# Prompt-validation run — read the scorer's output before any big spend

This is the gate before scaling. It scores a small sample of the **existing PMDD**
substrate on **the same model you'll ship the final score with (Opus 4.8)**, so the
validation is faithful — prompt behavior shifts between models, so testing on a cheaper
one would validate the wrong thing. We look at real dimension scores, rationales, and
female-applicability bands and decide if the prompt is good *before* generalizing to six
conditions or running the full pass. It is entirely **local** (the SQLite working store);
nothing is applied to Supabase and nothing touches the live site.

The PMDD set is small (~30–40 groups), and `--limit` keeps the first peek to a handful of
groups, so even on Opus this is a modest spend.

## Before you run

1. **Use your exact Opus 4.8 model id.** You pass it at runtime with `--model` (below), so
   you don't have to edit any source. Use the precise string your API accepts — if it 400s
   with "model not found," the string is off; check the model name in your Anthropic
   console. (If you'd rather set it once globally, change `MODEL` in
   `scripts/substrate/config.py` instead and drop the `--model` flag.)
2. **Load the existing claims into the local store.** The scorer reads a local SQLite
   scratch store, which is empty on a fresh checkout. Pull the already-verified claims down
   from your database (read-only, no model spend, no PubMed re-fetch):
   ```
   python3 scripts/substrate/hydrate_workstore.py
   ```
   This populates the store from Supabase (currently ~35 verified PMDD claims → 11 scoring
   groups, all in the `direct` arm). If it instead reports 0 verified claims, the substrate
   isn't applied to Supabase, and you'd build it locally with `python3
   scripts/substrate/run.py`.

## Run it (from the repo root)

Score a small sample first (swap in your exact Opus 4.8 id):
```
python3 scripts/substrate/score_claims.py --limit 8 --model claude-opus-4-8
```

Then read what it produced (no model call, just prints the store):
```
python3 scripts/substrate/score_claims.py --review
```

If the sample looks good, score the rest of PMDD and re-review:
```
python3 scripts/substrate/score_claims.py --model claude-opus-4-8
python3 scripts/substrate/score_claims.py --review
```

If credits run out mid-run it stops, keeps what scored, and resumes cleanly on re-run.

## What to look for (the actual point of this)

Read a handful of `--review` entries and ask:

- **Are the rationales real?** Each of the five dimension rationales should reference the
  specific claims/evidence, not say something generic. Generic or empty rationales mean the
  prompt needs work.
- **Do the female-applicability bands make sense?** PMDD is a female-specific condition
  studied in women, so most signals should land **F1 ×1.00** (full credit). If something
  lands F4/F5, check the `female-applicability:` line — is it because the abstract genuinely
  didn't state the population (fair), or did the model misread it (prompt issue)?
- **Do the scores match their rationales?** A dimension scored 2 should read like a 2. Watch
  for a confident score sitting under a hedging rationale.
- **Does the discount math feel right?** `strength X/10 × multiplier` → score. The tier
  should follow from the score.
- **Do the flags fire correctly?** `needs full text` where an abstract gave no sample
  size/CI; `⚠ contradiction(s)` where the substrate surfaced disagreement.
- **Eyeball the distribution.** The `--review` footer prints the tier and band spreads.
  This is the first preview of the §9 calibration — if everything piles into one tier, the
  cutoffs (or the prompt) need adjusting.

## After

- **Looks good →** we generalize extraction to all six conditions, then do the real pass on
  the model you choose. Because scoring is idempotent, none of this validation work is
  wasted or re-paid.
- **Needs tuning →** we adjust the prompt in `score_claims.py` and re-run this (cheap,
  because re-scoring PMDD is cheap). Better to find it here than after a big spend.

Nothing here flips the site. Applying migrations 050/051 in Supabase is a separate, later
step for the cutover.
