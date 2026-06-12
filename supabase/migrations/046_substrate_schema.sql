-- ============================================================
-- 046_substrate_schema.sql
-- Whel evidence substrate — Claims → Source-Spans data model
-- ============================================================
--
-- This is the first migration of the substrate reframe: the female-biology
-- evidence layer described in Whel-Reframe-Blueprint.docx (§2, §5). It is
-- ADDITIVE. It does not touch the legacy conditions / compounds /
-- repurposing_signals / sources tables, and the existing condition pages keep
-- working unchanged. The substrate is a new, parallel set of tables that the
-- new app/conditions/[slug]/substrate route reads from.
--
-- Design notes:
--   * uuid primary keys + timestamptz + jsonb, matching the conventions in
--     001_initial_schema.sql.
--   * Content-addressing is preserved (the discipline carried over from the
--     MVP) via UNIQUE sha256 columns, not by overloading the primary key:
--     documents.content_sha256 and source_spans.sha256.
--   * The unit of provenance is the CLAIM tied to a SOURCE SPAN with character
--     offsets we compute ourselves — never trusted from a model.
--   * Contradictions are a first-class table: we surface disagreement, we do
--     not average it.
--   * No RLS is enabled, matching the existing public-read tables in this
--     project (the substrate holds public, PubMed-derived evidence). Writes are
--     applied through reviewed migrations, not from the anon key.
--
-- Generated/maintained alongside scripts/substrate/. Apply in Supabase Studio
-- (SQL Editor), then commit. Safe to re-run: every CREATE is IF NOT EXISTS.

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────
-- entities — biomedical concepts (interventions, conditions, outcomes).
-- v1 leaves ontology_id nullable; the female-specific ontology extension fills
-- it in later (Blueprint §7.5).
-- ────────────────────────────────────────────────────────────
create table if not exists entities (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,            -- 'intervention' | 'condition' | 'outcome'
  label        text not null,            -- normalized display label
  norm_key     text not null,            -- lowercased grouping/dedupe key
  ontology_id  text,                     -- RxNorm/MONDO/MeSH id (nullable in v1)
  created_at   timestamptz not null default now(),
  unique (type, norm_key)
);

-- ────────────────────────────────────────────────────────────
-- documents — raw sources, immutable and content-addressed. Never edited,
-- never deleted; the bottom of every provenance chain.
-- ────────────────────────────────────────────────────────────
create table if not exists documents (
  id              uuid primary key default gen_random_uuid(),
  content_sha256  text not null unique,   -- sha256 of raw_text (content-addressed)
  source          text not null,          -- e.g. 'pubmed'
  external_id     text,                    -- e.g. PMID
  url             text,
  title           text,
  raw_text        text not null,          -- the immutable text we extracted from
  retrieved_at    timestamptz not null default now(),
  meta            jsonb,                   -- journal, year, query, etc.
  created_at      timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- source_spans — every retrievable chunk (a sentence) with EXACT character
-- offsets into documents.raw_text and its own hash. Offsets are computed by the
-- pipeline against the stored text, never supplied by a model.
-- ────────────────────────────────────────────────────────────
create table if not exists source_spans (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references documents(id) on delete cascade,
  start_char   integer not null,
  end_char     integer not null,
  text         text not null,
  sha256       text not null,
  ordinal      integer not null,          -- sentence order within the document
  extracted    boolean not null default false,  -- claim-extraction has run on this span
  created_at   timestamptz not null default now(),
  unique (document_id, ordinal)
);

-- ────────────────────────────────────────────────────────────
-- claims — atomic, decomposed assertions. Each is tied to exactly one source
-- span and carries the verbatim quote that span supports it with.
-- provenance_verified is true only if that quote was located verbatim in the
-- span text. entailment_* record whether the claim is actually supported by the
-- quote (v0 verifier; spec calls for PubMedBERT-NLI).
-- ────────────────────────────────────────────────────────────
create table if not exists claims (
  id                   uuid primary key default gen_random_uuid(),
  span_id              uuid not null references source_spans(id) on delete cascade,
  document_id          uuid not null references documents(id) on delete cascade,
  text                 text not null,      -- standalone atomic assertion
  exact_quote          text not null,      -- verbatim substring of the span
  quote_start_char     integer,            -- offset into document (computed, verified)
  quote_end_char       integer,
  intervention_id      uuid references entities(id),
  condition_id         uuid references entities(id),
  outcome              text,               -- short outcome phrase
  aspect               text,               -- 'efficacy' | 'safety' | 'other'
  direction            text,               -- 'positive' | 'negative' | 'null' | 'unclear'
  provenance_verified  boolean not null default false,
  entailment_label     text,               -- 'entailed' | 'neutral' | 'contradicted'
  entailment_score     numeric,
  model_name           text,
  prompt_hash          text,
  created_at           timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- contradictions — first-class surfaced disagreement. Links two efficacy claims
-- about the same (intervention, condition) whose conclusions conflict, with an
-- NLI label/score and a human-readable rationale. Both sides keep their
-- provenance intact.
-- ────────────────────────────────────────────────────────────
create table if not exists contradictions (
  id              uuid primary key default gen_random_uuid(),
  claim_a_id      uuid not null references claims(id) on delete cascade,
  claim_b_id      uuid not null references claims(id) on delete cascade,
  intervention_id uuid references entities(id),
  condition_id    uuid references entities(id),
  nli_label       text not null,           -- 'contradiction'
  nli_score       numeric,
  rationale       text,
  model_name      text,
  created_at      timestamptz not null default now(),
  unique (claim_a_id, claim_b_id)
);

-- ────────────────────────────────────────────────────────────
-- extraction_runs — provenance for the pipeline itself. Every run logs model
-- version, prompt hash, and input hash so results are reproducible/auditable.
-- ────────────────────────────────────────────────────────────
create table if not exists extraction_runs (
  id           uuid primary key default gen_random_uuid(),
  stage        text not null,
  model_name   text,
  prompt_hash  text,
  input_hash   text,
  started_at   timestamptz,
  finished_at  timestamptz,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_spans_doc       on source_spans(document_id);
create index if not exists idx_claims_span      on claims(span_id);
create index if not exists idx_claims_doc       on claims(document_id);
create index if not exists idx_claims_group     on claims(intervention_id, condition_id);
create index if not exists idx_claims_condition on claims(condition_id);
create index if not exists idx_contra_group     on contradictions(intervention_id, condition_id);

-- Verification (run after apply). Expected: all six tables present, 0 rows.
--   select table_name from information_schema.tables
--    where table_schema = 'public'
--      and table_name in ('entities','documents','source_spans','claims',
--                         'contradictions','extraction_runs')
--    order by table_name;
