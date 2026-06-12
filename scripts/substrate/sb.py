"""Read-only Supabase access for the substrate enrichment scripts.

Mirrors the existing repo pattern (stdlib urllib + REST + anon key, as in
extract-key-findings.py). READ ONLY. Enrichment never writes to the database;
it emits a reviewable migration instead.
"""
import os
import json
import ssl
import time
import urllib.request

from config import load_dotenv, USER_AGENT

_CTX = ssl.create_default_context()


def _creds():
    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not base or not key:
        raise RuntimeError("NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY not set")
    return base, key


def get(path: str):
    """GET /rest/v1/<path> and return parsed JSON (anon key, read-only)."""
    base, key = _creds()
    req = urllib.request.Request(
        f"{base}/rest/v1/{path}",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Accept": "application/json", "User-Agent": USER_AGENT},
    )
    last = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30, context=_CTX) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Supabase read failed after retries: {last}")
