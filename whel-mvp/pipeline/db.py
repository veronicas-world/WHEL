"""SQLite store for the MVP substrate. Plain SQL, recursive-CTE friendly, and
deliberately portable to Postgres (no SQLite-specific types in the schema).
"""
import sqlite3
import hashlib
import uuid

from config import DB_PATH, SCHEMA_PATH


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(reset: bool = False):
    if reset and DB_PATH.exists():
        DB_PATH.unlink()
    conn = connect()
    conn.executescript(SCHEMA_PATH.read_text())
    conn.commit()
    return conn


def new_id() -> str:
    return uuid.uuid4().hex


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
