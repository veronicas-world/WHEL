"""Local SQLite WORKING STORE for the substrate pipeline.

This is intermediate scratch, not the production database. The pipeline builds the
substrate here (so the stages stay idempotent and survive interruption), then
export_migration.py reads it and emits supabase/migrations/047_substrate_seed_pmdd.sql
for review and apply in Supabase Studio.

The table shapes mirror migration 046 (uuid-style text ids, an `aspect` column, an
`extracted` flag) so the export maps 1:1 onto the Postgres schema.
"""
import sqlite3
import hashlib
import uuid

from config import WORK_DB

SCHEMA = """
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, label TEXT NOT NULL,
    norm_key TEXT NOT NULL, ontology_id TEXT, UNIQUE(type, norm_key)
);
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY, content_sha256 TEXT NOT NULL UNIQUE, source TEXT NOT NULL,
    external_id TEXT, url TEXT, title TEXT, raw_text TEXT NOT NULL,
    retrieved_at TEXT NOT NULL, meta_json TEXT
);
CREATE TABLE IF NOT EXISTS source_spans (
    id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id),
    start_char INTEGER NOT NULL, end_char INTEGER NOT NULL, text TEXT NOT NULL,
    sha256 TEXT NOT NULL, ordinal INTEGER NOT NULL, extracted INTEGER NOT NULL DEFAULT 0,
    UNIQUE(document_id, ordinal)
);
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY, span_id TEXT NOT NULL REFERENCES source_spans(id),
    document_id TEXT NOT NULL REFERENCES documents(id), text TEXT NOT NULL,
    exact_quote TEXT NOT NULL, quote_start_char INTEGER, quote_end_char INTEGER,
    intervention_id TEXT REFERENCES entities(id), condition_id TEXT REFERENCES entities(id),
    outcome TEXT, aspect TEXT, direction TEXT, provenance_verified INTEGER NOT NULL DEFAULT 0,
    entailment_label TEXT, entailment_score REAL, model_name TEXT, prompt_hash TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contradictions (
    id TEXT PRIMARY KEY, claim_a_id TEXT NOT NULL REFERENCES claims(id),
    claim_b_id TEXT NOT NULL REFERENCES claims(id), intervention_id TEXT REFERENCES entities(id),
    condition_id TEXT REFERENCES entities(id), nli_label TEXT NOT NULL, nli_score REAL,
    rationale TEXT, model_name TEXT, created_at TEXT NOT NULL, UNIQUE(claim_a_id, claim_b_id)
);
CREATE INDEX IF NOT EXISTS idx_spans_doc ON source_spans(document_id);
CREATE INDEX IF NOT EXISTS idx_claims_span ON claims(span_id);
CREATE INDEX IF NOT EXISTS idx_claims_group ON claims(intervention_id, condition_id);
"""


def connect():
    conn = sqlite3.connect(WORK_DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(reset: bool = False):
    if reset and WORK_DB.exists():
        WORK_DB.unlink()
    conn = connect()
    conn.executescript(SCHEMA)
    conn.commit()
    return conn


def new_id() -> str:
    return str(uuid.uuid4())


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
