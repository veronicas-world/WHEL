#!/usr/bin/env python3
"""
export-sources-for-audit.py
============================

Whel Path C Phase 1 extension to the live `sources` table.

PURPOSE
-------
The pre-verified citation manifest at lib/whel-citations.json covers the
hand-written prose references on methodology/external-references/changelog
plus the hand-written featured-page references. The much larger surface is
the live `sources` table: every PubMed PMID, ClinicalTrials.gov NCT ID,
Open Targets identifier, FAERS query URL, and Reddit post URL that the
LLM extraction pipeline attached to each active signal across all six
conditions and rendered on every drug card.

This script exports the live sources table to
    lib/sources-audit-snapshot.json
so that scripts/verify-database-sources.py can audit it against the
canonical external sources (NCBI E-utilities for PMIDs,
ClinicalTrials.gov API v2 for NCT IDs, Open Targets GraphQL for OT IDs,
format validation for FAERS and Reddit) without needing live database
access at audit time. The audit numbers are then surfaced on
/about/external-references 01d alongside the citation-manifest results.

USAGE
-----
This script must be run locally where Supabase credentials are
available. The script reads NEXT_PUBLIC_SUPABASE_URL and
NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local, the same way the other
research scripts do.

    cd ~/dev/rediscover
    python3 scripts/export-sources-for-audit.py

Writes lib/sources-audit-snapshot.json and prints a summary of what was
exported (counts by source_type, counts by signal status).

After running, commit and push the snapshot:

    git add lib/sources-audit-snapshot.json
    git commit -m "Update lib/sources-audit-snapshot.json"
    git push

Then run the audit:

    python3 scripts/verify-database-sources.py

OUTPUT SCHEMA
-------------
{
  "schema_version": "1.0",
  "exported_at": "<iso8601 UTC>",
  "summary": {
    "active_signals": <int>,
    "total_sources": <int>,
    "by_source_type": {"pubmed": <int>, "clinical_trial": <int>, ...},
    "with_external_id": <int>,
    "without_external_id": <int>
  },
  "sources": [
    {
      "id": <uuid>,
      "signal_id": <uuid>,
      "source_type": <str>,
      "external_id": <str | null>,
      "title": <str | null>,
      "authors": <str | null>,
      "journal": <str | null>,
      "publication_date": <str | null>,
      "url": <str | null>
    },
    ...
  ]
}

DEPENDENCIES
------------
Stdlib only (urllib for HTTP, no external packages). No
--break-system-packages needed. Same pattern as scripts/curate-guidelines.py.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
DOTENV_PATH = REPO / ".env.local"
SNAPSHOT_PATH = REPO / "lib" / "sources-audit-snapshot.json"


def load_dotenv(path: Path) -> None:
    """Lightweight .env.local loader so the script picks up Supabase env
    vars the same way the rest of the script suite does, without
    requiring python-dotenv as a dep."""
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def http_get_json(url: str, headers: dict[str, str]) -> Any:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def http_get_json_paginated(
    base_url: str,
    headers: dict[str, str],
    page_size: int = 1000,
) -> list[dict[str, Any]]:
    """Page through PostgREST results. PostgREST defaults to a max-rows
    cap of 1000 per request; supply Range headers to paginate explicitly
    instead of relying on the silent truncation."""
    out: list[dict[str, Any]] = []
    start = 0
    while True:
        end = start + page_size - 1
        paged_headers = dict(headers)
        paged_headers["Range-Unit"] = "items"
        paged_headers["Range"] = f"{start}-{end}"
        req = urllib.request.Request(base_url, headers=paged_headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read()
                batch = json.loads(body)
        except urllib.error.HTTPError as e:
            if e.code in (200, 206):
                batch = json.loads(e.read())
            else:
                # Surface PostgREST's error body so column-name typos and
                # similar query bugs are visible at the terminal.
                err_body = ""
                try:
                    err_body = e.read().decode("utf-8", errors="replace")
                except Exception:
                    pass
                print(
                    f"\nHTTP {e.code} from PostgREST:\n  URL: {base_url}\n  body: {err_body}",
                    file=sys.stderr,
                )
                raise
        if not isinstance(batch, list):
            break
        out.extend(batch)
        if len(batch) < page_size:
            break
        start += page_size
    return out


def fetch_active_signals(base: str, headers: dict[str, str]) -> list[dict[str, Any]]:
    """Return all active repurposing_signals rows (the ones rendered on
    /conditions/[slug] drug cards). We only audit sources attached to
    active signals; inactive/deactivated rows are out of scope because
    they're not currently rendered to users.

    Column names mirror what scripts/check-matrix-coverage.py uses
    against the live schema: compound_id, condition_id, signal_type,
    confidence_tier."""
    url = (
        f"{base}/rest/v1/repurposing_signals"
        f"?select=id,status,compound_id,condition_id,signal_type,confidence_tier"
        f"&status=eq.active"
    )
    rows = http_get_json_paginated(url, headers)
    print(f"  fetched {len(rows)} active signals")
    return rows


def fetch_sources_for_signals(
    base: str,
    headers: dict[str, str],
    signal_ids: list[str],
) -> list[dict[str, Any]]:
    """Return all sources attached to the given signal IDs. Batches the
    in.() filter at 200 signal IDs per request and paginates within
    each batch to respect PostgREST's 1000-row cap.

    Columns pulled: identifier fields (id, signal_id, source_type,
    external_id) plus bibliographic metadata (title, authors, journal,
    publication_date, url) used by Phase 1 plus the LLM-generated text
    fields (key_finding_excerpt, primary_endpoint_text) used by Phase 2
    (sentence-level summary grounding). key_finding_excerpt is the
    per-source LLM-extracted finding text; primary_endpoint_text is the
    rubric-line-82 extracted primary endpoint phrasing populated by
    scripts/classify-sources-study-type.py."""
    select = (
        "id,signal_id,source_type,external_id,title,authors,journal,"
        "publication_date,url,key_finding_excerpt,primary_endpoint_text"
    )
    BATCH = 200
    out: list[dict[str, Any]] = []
    for i in range(0, len(signal_ids), BATCH):
        batch = signal_ids[i : i + BATCH]
        in_list = ",".join(batch)
        url = (
            f"{base}/rest/v1/sources"
            f"?select={select}"
            f"&signal_id=in.({in_list})"
        )
        out.extend(http_get_json_paginated(url, headers))
    print(f"  fetched {len(out)} sources across {len(signal_ids)} active signals")
    return out


def summarize(sources: list[dict[str, Any]], active_signal_count: int) -> dict[str, Any]:
    by_type: dict[str, int] = {}
    with_external = 0
    without_external = 0
    for s in sources:
        t = s.get("source_type") or "unknown"
        by_type[t] = by_type.get(t, 0) + 1
        if (s.get("external_id") or "").strip():
            with_external += 1
        else:
            without_external += 1
    return {
        "active_signals": active_signal_count,
        "total_sources": len(sources),
        "by_source_type": dict(sorted(by_type.items(), key=lambda kv: -kv[1])),
        "with_external_id": with_external,
        "without_external_id": without_external,
    }


def main() -> int:
    load_dotenv(DOTENV_PATH)

    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not base or not key:
        print(
            "ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY "
            "must be set (in .env.local or in the environment).",
            file=sys.stderr,
        )
        return 2

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }

    print("exporting active signals + their sources from Supabase…")
    signals = fetch_active_signals(base, headers)
    signal_ids = [str(s["id"]) for s in signals]
    sources = fetch_sources_for_signals(base, headers, signal_ids)
    summary = summarize(sources, active_signal_count=len(signals))

    payload = {
        "schema_version": "1.0",
        "exported_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "summary": summary,
        "sources": sources,
    }

    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_PATH.write_text(json.dumps(payload, indent=2) + "\n")

    print()
    print("=" * 64)
    print("sources export summary")
    print("=" * 64)
    print(f"Active signals:        {summary['active_signals']}")
    print(f"Total sources:         {summary['total_sources']}")
    print(f"With external_id:      {summary['with_external_id']}")
    print(f"Without external_id:   {summary['without_external_id']}")
    print()
    print("By source_type:")
    for stype, count in summary["by_source_type"].items():
        print(f"  {stype:24s} {count}")
    print()
    print(f"wrote {SNAPSHOT_PATH.relative_to(REPO)}")
    print()
    print("Next steps:")
    print("  git add lib/sources-audit-snapshot.json")
    print("  git commit -m 'Update sources audit snapshot'")
    print("  git push")
    print("  python3 scripts/verify-database-sources.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
