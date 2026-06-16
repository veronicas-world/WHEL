-- ============================================================
-- 050_substrate_signals.sql
-- Whel evidence substrate — scoring layer (claims → scored signals)
-- ============================================================
--
-- The substrate (046/047) turns sources into atomic, verbatim-verified CLAIMS.
-- This migration adds the layer that reads ONLY those verified claims and
-- produces the scored signal a clinician sees. It is implemented from
-- scripts/substrate/SCORING_SPEC.md (v1.1, arm-aware) — read that first; this
-- schema is its storage side.
--
-- ADDITIVE and parallel, like 046: it does not touch the legacy
-- repurposing_signals / sources tables. The site keeps serving legacy until the
-- substrate route is switched on behind a flag.
--
-- Scoring is ARM-AWARE. Each row is one evidence ARM's reading of a
-- (intervention, condition, aspect) — 'direct' | 'cross' | 'pathway' |
-- 'community'. Each arm is scored on the SAME five generalized slots
-- (corroboration, rigor, specificity, plausibility, consistency) but each slot
-- MEANS something tuned to that arm (SCORING_SPEC §2). The five sum to an arm
-- strength 0-10, then a female-applicability multiplier (ceiling 1.00, so it can
-- only discount) gives the arm score:
--
--     arm_score = (sum of five slots, 0-10) × female_applicability_multiplier
--
-- The PAIR-level headline (anchor-and-corroborate) and validation_status
-- (clinical | unvalidated_signal | preliminary) are derived at READ time in
-- lib/candidates.ts from the per-arm rows here — we never average across arms.
-- See SCORING_SPEC §6.
--
-- Conventions match 046: uuid pk + timestamptz, references entities(id), no RLS
-- (public PubMed-derived evidence; writes via reviewed migrations only).
-- Safe to re-run: every CREATE is IF NOT EXISTS.

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────
-- substrate_signals — one scored row per (intervention, condition, aspect, arm).
-- aspect separates efficacy from safety so they are never blended; arm separates
-- evidence classes so a forum report is never scored on trial criteria.
-- ────────────────────────────────────────────────────────────
create table if not exists substrate_signals (
  id                uuid primary key default gen_random_uuid(),
  intervention_id   uuid not null references entities(id),
  condition_id      uuid not null references entities(id),
  aspect            text not null default 'efficacy',  -- 'efficacy' | 'safety' | 'other'
  arm               text not null                       -- evidence class (SCORING_SPEC §2)
    check (arm in ('direct','cross','pathway','community')),

  -- ── Five generalized dimension slots, 0–2 each (meaning is per-arm, §2) ──
  corroboration_score smallint check (corroboration_score between 0 and 2),
  rigor_score         smallint check (rigor_score         between 0 and 2),
  specificity_score   smallint check (specificity_score   between 0 and 2),
  plausibility_score  smallint check (plausibility_score  between 0 and 2),
  consistency_score   smallint check (consistency_score   between 0 and 2),

  -- Pre-multiplier arm strength, 0–10, generated from the five slots.
  arm_strength numeric generated always as (
    coalesce(corroboration_score,0) + coalesce(rigor_score,0) +
    coalesce(specificity_score,0)   + coalesce(plausibility_score,0) +
    coalesce(consistency_score,0)
  ) stored,

  -- Per-dimension rationale: 2–3 sentences citing the claims behind each score.
  corroboration_rationale text,
  rigor_rationale         text,
  specificity_rationale   text,
  plausibility_rationale  text,
  consistency_rationale   text,

  -- ── Female applicability: bounded multiplier, per arm (SCORING_SPEC §3) ──
  female_applicability_band        text
    check (female_applicability_band in ('F1','F2','F3','F4','F5','F6')),
  female_applicability_multiplier  numeric default 1.00
    check (female_applicability_multiplier between 0.50 and 1.00),
  female_applicability_rationale   text,

  -- ── Arm score & tier (SCORING_SPEC §1, §5) ──
  -- arm_score = arm_strength × multiplier, clamped to [0,10].
  arm_score numeric generated always as (
    round(
      least(
        10.0,
        (coalesce(corroboration_score,0) + coalesce(rigor_score,0) +
         coalesce(specificity_score,0)   + coalesce(plausibility_score,0) +
         coalesce(consistency_score,0))
        * coalesce(female_applicability_multiplier, 1.00)
      ), 1)
  ) stored,
  confidence_tier text
    check (confidence_tier in ('Exploratory','Emerging','Moderate','Strong')),

  -- ── Contradictions: strict but prominent (SCORING_SPEC §4) ──
  contradiction_flag boolean not null default false,
  num_contradictions integer not null default 0,

  -- ── Imprecision handling (SCORING_SPEC §2) ──
  precision_note text,                            -- what numbers were / were not available
  needs_fulltext boolean not null default false,  -- tier-2 full-text trigger

  -- ── Synthesis & provenance ──
  source_tier         text not null default 'abstract'  -- 'abstract' | 'fulltext'
    check (source_tier in ('abstract','fulltext')),
  synthesis_summary   text,
  mechanism_hypothesis text,
  claim_ids           uuid[],                     -- back-references to the verified claims

  -- ── Audit (matches the substrate's reproducibility discipline) ──
  model_name   text,
  prompt_hash  text,
  status       text not null default 'active',    -- 'active' | 'off_topic' | 'draft' | 'retired'
  off_topic_reason text,                            -- why suppressed (claims not about this pair / intervention unresolved)

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (intervention_id, condition_id, aspect, arm)
);

create index if not exists idx_subsig_pair       on substrate_signals(intervention_id, condition_id);
create index if not exists idx_subsig_condition   on substrate_signals(condition_id);
create index if not exists idx_subsig_arm         on substrate_signals(arm);
create index if not exists idx_subsig_tier        on substrate_signals(confidence_tier);
create index if not exists idx_subsig_score       on substrate_signals(arm_score desc);
create index if not exists idx_subsig_status      on substrate_signals(status);

-- Keep updated_at honest on edits.
create or replace function set_substrate_signals_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_subsig_updated_at on substrate_signals;
create trigger trg_subsig_updated_at
  before update on substrate_signals
  for each row execute function set_substrate_signals_updated_at();

-- Verification (run after apply). Expected: table present, 0 rows, and the two
-- generated columns (arm_strength, arm_score) computed.
--   select column_name, is_generated
--     from information_schema.columns
--    where table_name = 'substrate_signals'
--      and column_name in ('arm_strength','arm_score');
