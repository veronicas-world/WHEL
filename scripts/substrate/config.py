"""Shared config for the Whel substrate pipeline (scripts/substrate/).

Mirrors the conventions of the existing repo scripts (extract-key-findings.py):
stdlib only, reads ANTHROPIC_API_KEY and the Supabase anon creds from ../../.env.local.
The pipeline writes NOTHING to the database directly; it builds a local working
store and emits supabase/migrations/047_substrate_seed_pmdd.sql for review + apply
in Supabase Studio.
"""
import os
import pathlib

REPO = pathlib.Path(__file__).resolve().parent.parent.parent     # rediscover/
SUBSTRATE_DIR = REPO / "scripts" / "substrate"
DOTENV = REPO / ".env.local"
MIGRATIONS_DIR = REPO / "supabase" / "migrations"
SEED_MIGRATION = MIGRATIONS_DIR / "047_substrate_seed_pmdd.sql"
RUN_LOG = SUBSTRATE_DIR / "audit-output" / "substrate-run.json"

# Local working store (SQLite). NOT the production DB. Kept off the mounted/FUSE
# workspace folder in sandboxed runs (SQLite locking fails there) via the env
# override; defaults to a repo-local .work/ dir for normal local runs.
WORK_DIR = pathlib.Path(os.environ.get("WHEL_SUBSTRATE_WORK", str(SUBSTRATE_DIR / ".work")))
WORK_DB = WORK_DIR / "substrate-work.db"
WORK_DIR.mkdir(parents=True, exist_ok=True)
(SUBSTRATE_DIR / "audit-output").mkdir(parents=True, exist_ok=True)

# Single LLM backbone. The model is a commodity; the substrate is the moat.
MODEL = "claude-sonnet-4-6"
ANTHROPIC_VERSION = "2023-06-01"

# Sonnet list price (USD per token) for rough live cost tracking.
PRICE_IN = 3.0 / 1_000_000
PRICE_OUT = 15.0 / 1_000_000

USER_AGENT = "Whel-Substrate-Pipeline/0.1 (https://whel.bio; mailto:vla2117@columbia.edu)"


def load_dotenv(path: pathlib.Path = DOTENV) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        # Fill in when absent OR empty (some environments pre-export empty vars).
        if k and not os.environ.get(k):
            os.environ[k] = v


def anthropic_key() -> str:
    load_dotenv()
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not set (in .env.local or environment)")
    return key
