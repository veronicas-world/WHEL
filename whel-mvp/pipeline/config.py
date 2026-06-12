"""Shared configuration for the Whel MVP pipeline.

Keeps zero hard dependencies beyond the Python standard library so the MVP runs
anywhere with `python3` and a network connection. The Anthropic key is read from
the existing ../.env.local (NEXT_PUBLIC_SUPABASE_* and ANTHROPIC_API_KEY live there).
"""
import os
import re
import pathlib

# --- paths ---------------------------------------------------------------
MVP_DIR = pathlib.Path(__file__).resolve().parent.parent          # whel-mvp/
REPO_DIR = MVP_DIR.parent                                         # rediscover/
SCHEMA_PATH = MVP_DIR / "schema.sql"
RENDER_OUT = MVP_DIR / "render" / "pmdd.html"

# Runtime data (SQLite db + raw source copies) lives in LOCAL scratch, not in the
# mounted workspace folder: SQLite's file locking fails over FUSE-mounted folders
# ("disk I/O error"). The DB is an intermediate artifact; the durable deliverables
# (code, schema, rendered HTML) live in the workspace folder. Override with WHEL_DATA_DIR.
DATA_DIR = pathlib.Path(os.environ.get("WHEL_DATA_DIR", "/sessions/zealous-confident-carson/.whel-mvp-data"))
RAW_DIR = DATA_DIR / "raw"
DB_PATH = DATA_DIR / "whel.db"

DATA_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)

# --- model ---------------------------------------------------------------
# Single LLM backbone. The Blueprint's thesis is that the model is a commodity and
# the substrate is the moat; the MVP treats Claude as a swappable extraction engine.
MODEL = "claude-sonnet-4-6"
ANTHROPIC_VERSION = "2023-06-01"


def load_anthropic_key() -> str:
    """Read ANTHROPIC_API_KEY from env or ../.env.local."""
    key = os.environ.get("ANTHROPIC_API_KEY")
    if key:
        return key.strip()
    env_file = REPO_DIR / ".env.local"
    if env_file.exists():
        m = re.search(r"ANTHROPIC_API_KEY=(.+)", env_file.read_text())
        if m:
            return m.group(1).strip()
    raise RuntimeError("ANTHROPIC_API_KEY not found in env or ../.env.local")
