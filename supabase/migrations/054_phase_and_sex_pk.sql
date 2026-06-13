-- 054_phase_and_sex_pk.sql
--
-- Folds engineering-note Decisions 1 and 3 into the schema. These are the two
-- additions that cannot be cheaply retrofitted once the tables are populated, so
-- they are designed in now even though the data to fill them is sparse.
--
--   D1 (phase-aware efficacy): a cycle-phase qualifier on the substrate `claims`
--      table, so an efficacy claim records the menstrual-cycle phase in which it
--      holds instead of being averaged into a phase-less assertion. The Path B
--      mechanistic edges (052) are gene-disease associations and are time-
--      invariant, so phase belongs here on the efficacy layer, not on those edges.
--
--   D3 (sex-stratified PK): a `compound_pk` table plus a `sex_specific_pk` flag on
--      compounds, so documented PK differences (e.g. CYP3A4 activity / the FDA
--      zolpidem dosing case) are structured rows that carry a citation, rather
--      than free text.
--
-- D2 (contradictions) is already a first-class table (migration 046,
-- `contradictions`), linking two efficacy claims; no change is needed here. A
-- later migration can extend it to reference graph edges if we want graph-level
-- contradictions too.
-- D4 (benchmark: Causaly arrow-directionality + BenchSci ASCEND) is a process
-- reference, not schema.
--
-- Phase vocabulary (shared by claims and compound_pk):
--   follicular | ovulatory | luteal | menstrual | unspecified
--
-- Idempotent and guarded; safe to re-run. Apply after 046 and 050.

-- ── D1: cycle-phase qualifier on efficacy claims ─────────────────────────────
alter table claims add column if not exists cycle_phase     text;    -- nullable; phase the claim holds in
alter table claims add column if not exists phase_dependent boolean not null default false;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'claims_cycle_phase_chk') then
    alter table claims add constraint claims_cycle_phase_chk
      check (cycle_phase is null or cycle_phase in
        ('follicular','ovulatory','luteal','menstrual','unspecified'));
  end if;
end $$;

-- ── D3: sex-stratified pharmacokinetics ──────────────────────────────────────
alter table compounds add column if not exists sex_specific_pk boolean not null default false;

create table if not exists compound_pk (
  id          uuid primary key default gen_random_uuid(),
  compound_id uuid not null references compounds(id) on delete cascade,
  parameter   text not null,        -- 'clearance' | 'cmax' | 'half_life' | 'cyp3a4_activity' | ...
  sex         text not null,        -- 'female' | 'male'
  direction   text,                 -- 'higher' | 'lower' | 'slower' | 'faster' (vs the other sex)
  magnitude   text,                 -- free text, e.g. '~50% higher plasma levels'
  cycle_phase text,                 -- optional; same vocabulary as claims.cycle_phase
  source_ref  text,                 -- citation (PMID / DOI / URL / FDA guidance id) — traceability
  note        text,
  created_at  timestamptz not null default now(),
  constraint compound_pk_sex_chk   check (sex in ('female','male')),
  constraint compound_pk_phase_chk check (cycle_phase is null or cycle_phase in
    ('follicular','ovulatory','luteal','menstrual','unspecified'))
);

create index if not exists compound_pk_compound_idx on compound_pk (compound_id);
