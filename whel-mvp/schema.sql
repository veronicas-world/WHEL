-- Whel MVP substrate schema
-- The new data model: Claims -> Source-Spans (many-to-many), NOT Signals -> Sources.
-- Written for SQLite (the local MVP store) but deliberately kept portable to plain
-- Postgres: TEXT ids, no engine-specific types, traversals expressed as recursive CTEs.
-- This is the "substrate" the Blueprint refers to; the moat lives here, not in the LLM.

-- ---------------------------------------------------------------------------
-- documents: raw sources stored immutably, hash-addressed. Never edited, never
-- deleted. This is the bottom of the provenance chain: every claim traces here.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id           TEXT PRIMARY KEY,         -- sha256 of raw_text (content-addressed)
    source       TEXT NOT NULL,            -- e.g. 'pubmed'
    external_id  TEXT,                     -- e.g. PMID
    url          TEXT,
    title        TEXT,
    raw_text     TEXT NOT NULL,            -- the immutable text we extracted from
    retrieved_at TEXT NOT NULL,
    meta_json    TEXT                      -- journal, year, authors, query, etc.
);

-- ---------------------------------------------------------------------------
-- source_spans: every retrievable chunk (here, a sentence) with EXACT character
-- offsets into documents.raw_text and its own hash. The unit of provenance is the
-- span. Offsets are computed by us against the stored text, never trusted from a model.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS source_spans (
    id          TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id),
    start_char  INTEGER NOT NULL,
    end_char    INTEGER NOT NULL,
    text        TEXT NOT NULL,
    sha256      TEXT NOT NULL,
    ordinal     INTEGER NOT NULL,         -- sentence order within the document
    extracted   INTEGER NOT NULL DEFAULT 0 -- 1 once claim-extraction has run on this span
);

-- ---------------------------------------------------------------------------
-- entities: biomedical concepts (interventions, conditions, outcomes). In v1 these
-- would be ontology-grounded (RxNorm/MONDO/MeSH ids). In the MVP we store a
-- normalized label + type and leave the ontology id nullable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entities (
    id           TEXT PRIMARY KEY,
    type         TEXT NOT NULL,            -- 'intervention' | 'condition' | 'outcome'
    label        TEXT NOT NULL,            -- normalized display label
    norm_key     TEXT NOT NULL,            -- lowercased key used for grouping/dedupe
    ontology_id  TEXT,                     -- RxNorm/MONDO/etc id (nullable in MVP)
    UNIQUE(type, norm_key)
);

-- ---------------------------------------------------------------------------
-- claims: atomic, decomposed assertions. Each claim is tied to EXACTLY ONE source
-- span (its provenance) via span_id, and carries the verbatim quote that span
-- supports it with. provenance_verified is true only if that quote was located
-- verbatim in the span text. entailment_label/score record whether the claim is
-- actually supported by the quote (v0 verifier; replace with PubMedBERT-NLI).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claims (
    id                  TEXT PRIMARY KEY,
    span_id             TEXT NOT NULL REFERENCES source_spans(id),
    document_id         TEXT NOT NULL REFERENCES documents(id),
    text                TEXT NOT NULL,     -- standalone atomic assertion
    exact_quote         TEXT NOT NULL,     -- verbatim substring of the span
    quote_start_char    INTEGER,           -- offset into document (computed, verified)
    quote_end_char      INTEGER,
    intervention_id     TEXT REFERENCES entities(id),
    condition_id        TEXT REFERENCES entities(id),
    outcome             TEXT,              -- short outcome phrase (e.g. 'reduces symptoms')
    aspect              TEXT,              -- 'efficacy' | 'safety' | 'other' (compare like with like)
    direction           TEXT,              -- 'positive' | 'negative' | 'null' | 'unclear'
    provenance_verified INTEGER NOT NULL DEFAULT 0,  -- 1 if quote found verbatim
    entailment_label    TEXT,              -- 'entailed' | 'neutral' | 'contradicted'
    entailment_score    REAL,
    model_name          TEXT,
    prompt_hash         TEXT,
    created_at          TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- contradictions: first-class table. We surface disagreement, we do not average it.
-- A row links two claims about the same (intervention, condition) whose directions
-- conflict, with an NLI-derived label/score and a human-readable rationale.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contradictions (
    id           TEXT PRIMARY KEY,
    claim_a_id   TEXT NOT NULL REFERENCES claims(id),
    claim_b_id   TEXT NOT NULL REFERENCES claims(id),
    intervention_id TEXT REFERENCES entities(id),
    condition_id    TEXT REFERENCES entities(id),
    nli_label    TEXT NOT NULL,            -- 'contradiction'
    nli_score    REAL,
    rationale    TEXT,
    model_name   TEXT,
    created_at   TEXT NOT NULL,
    UNIQUE(claim_a_id, claim_b_id)
);

-- ---------------------------------------------------------------------------
-- extraction_runs: provenance for the pipeline itself. Every run logs model
-- version, prompt hash, and counts so results are reproducible/auditable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS extraction_runs (
    id          TEXT PRIMARY KEY,
    stage       TEXT NOT NULL,
    model_name  TEXT,
    prompt_hash TEXT,
    input_hash  TEXT,
    started_at  TEXT,
    finished_at TEXT,
    notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_spans_doc      ON source_spans(document_id);
CREATE INDEX IF NOT EXISTS idx_claims_span    ON claims(span_id);
CREATE INDEX IF NOT EXISTS idx_claims_grp     ON claims(intervention_id, condition_id);
CREATE INDEX IF NOT EXISTS idx_contra_grp     ON contradictions(intervention_id, condition_id);
