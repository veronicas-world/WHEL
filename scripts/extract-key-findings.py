#!/usr/bin/env python3
"""
extract-key-findings.py
========================

Source-level LLM extraction pipeline for Whel. Populates
sources.key_finding_excerpt — the per-source field that Path C
Phase 2a (scripts/verify-summary-grounding.py) grounds against the
canonical source text.

PURPOSE
-------
The Phase 2a smoke test on 2026-06-08 surfaced that
sources.key_finding_excerpt is 0% populated across all 2,166 active-
signal source rows. The column exists per migration 041 but no script
ever wrote to it. This script fills the gap: for every free-text
source (source_type in {'pubmed', 'clinical_trial', 'reddit'}), it
fetches the canonical source text from the publisher (NCBI E-utilities
efetch for PubMed abstracts; ClinicalTrials.gov API v2 briefSummary +
detailedDescription for trial records; Reddit's public JSON endpoint
for post body + top 5 comments), then calls Claude Opus 4.6 to extract
a 2-4 sentence key finding focused on the drug-condition relationship
for that signal.

The extraction prompt is tight on purpose: each output is constrained
to claims directly supported by the canonical text, must be specific
(numbers, study size, direction of effect when present), and must
return the exact string "NO_RELEVANT_FINDING" when the source does
not actually discuss the drug-condition pair. This refusal path is
how the pipeline handles sources that were attached to a signal but
don't actually mention the drug-condition pair (off-topic citations,
which the audit then surfaces as flag-worthy).

OUTPUTS
-------
  scripts/audit-output/key-finding-extractions.json
      Full run log: per-source result with prompt input, raw model
      output, status, latency, and reason if skipped.

  supabase/migrations/045_backfill_key_finding_excerpts.sql
      One UPDATE statement per successfully-extracted source, guarded
      by 'AND key_finding_excerpt IS NULL' so the migration is
      idempotent and safe to re-run. Run this in Supabase Studio
      after reviewing the JSON log.

USAGE
-----
Local-only (needs Claude API access). Set ANTHROPIC_API_KEY in your
environment or .env.local:

    python3 scripts/extract-key-findings.py
    python3 scripts/extract-key-findings.py --limit 20    # smoke test
    python3 scripts/extract-key-findings.py --model claude-haiku-4-5
        # cheaper extraction (Haiku) if cost matters more than quality

Requires lib/sources-audit-snapshot.json from the most recent
export-sources-for-audit.py run.

RUNTIME AND COST
----------------
~30-40 minutes against ~322 free-text sources. Dominated by Reddit's
2-second polite-use sleep on 190 posts. Claude API calls themselves
are ~3-5 seconds each on Opus, ~1-2 seconds on Haiku.

Cost at default Opus 4.6: roughly 322 calls × ~3 KB input × ~150 tokens
output = ~$20-30 total. At Haiku 4.5: ~$2-3.

DEPENDENCIES
------------
Stdlib only (urllib for HTTP, json/re for parsing).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
DOTENV_PATH = REPO / ".env.local"
SNAPSHOT_PATH = REPO / "lib" / "sources-audit-snapshot.json"
RUN_LOG_PATH = REPO / "scripts" / "audit-output" / "key-finding-extractions.json"
MIGRATION_PATH = REPO / "supabase" / "migrations" / "045_backfill_key_finding_excerpts.sql"

DEFAULT_MODEL = "claude-opus-4-6"

NCBI_SLEEP_S = 0.4
CTGOV_SLEEP_S = 0.3
REDDIT_SLEEP_S = 2.0
ANTHROPIC_SLEEP_S = 0.2

HTTP_HEADERS = {
    "User-Agent": "Whel-Key-Finding-Extraction/1.0 (https://rediscover-coral.vercel.app; mailto:vla2117@columbia.edu)"
}


# ── Env loading and HTTP helpers ────────────────────────────────────


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def http_get(url: str, timeout: int = 25) -> bytes:
    req = urllib.request.Request(url, headers=HTTP_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


# ── Compound + condition name lookup ────────────────────────────────


def fetch_lookup(base: str, headers: dict[str, str]) -> tuple[dict[str, str], dict[str, str], dict[str, tuple[str, str]]]:
    """Fetch compound name lookups, condition name lookups, and a
    signal_id → (compound_name, condition_name) map by joining all
    three tables. Done once at startup so the per-source loop has
    drug + condition context without re-querying."""
    req = urllib.request.Request(
        f"{base}/rest/v1/compounds?select=id,name,generic_name",
        headers=headers,
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        compounds = json.loads(resp.read())
    compound_lookup = {
        c["id"]: c.get("name") or c.get("generic_name") or "?"
        for c in compounds
    }

    req = urllib.request.Request(
        f"{base}/rest/v1/conditions?select=id,name",
        headers=headers,
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        conditions = json.loads(resp.read())
    condition_lookup = {c["id"]: c.get("name") or "?" for c in conditions}

    # repurposing_signals: fetch active signals and build the per-signal
    # (compound_name, condition_name) lookup.
    signals: list[dict[str, Any]] = []
    start = 0
    while True:
        page_size = 1000
        req = urllib.request.Request(
            f"{base}/rest/v1/repurposing_signals?select=id,compound_id,condition_id&status=eq.active",
            headers={**headers, "Range-Unit": "items", "Range": f"{start}-{start + page_size - 1}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                batch = json.loads(resp.read())
        except urllib.error.HTTPError as e:
            if e.code in (200, 206):
                batch = json.loads(e.read())
            else:
                raise
        if not isinstance(batch, list) or not batch:
            break
        signals.extend(batch)
        if len(batch) < page_size:
            break
        start += page_size

    signal_to_pair: dict[str, tuple[str, str]] = {}
    for s in signals:
        cid = s.get("compound_id")
        condid = s.get("condition_id")
        cname = compound_lookup.get(cid, "?")
        condname = condition_lookup.get(condid, "?")
        signal_to_pair[str(s["id"])] = (cname, condname)

    return compound_lookup, condition_lookup, signal_to_pair


# ── Canonical-source fetchers ───────────────────────────────────────


def fetch_pubmed_abstract(pmid: str) -> str | None:
    url = (
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        f"?db=pubmed&id={urllib.parse.quote(pmid)}&retmode=xml"
    )
    try:
        body = http_get(url)
    except urllib.error.URLError:
        return None
    try:
        root = ET.fromstring(body)
    except ET.ParseError:
        return None
    parts: list[str] = []
    for at in root.iter("AbstractText"):
        text = ("".join(at.itertext()) or "").strip()
        label = at.attrib.get("Label")
        if label:
            parts.append(f"{label}: {text}")
        else:
            parts.append(text)
    return " ".join(p for p in parts if p).strip() or None


def fetch_ctgov_description(nct_id: str) -> str | None:
    url = f"https://clinicaltrials.gov/api/v2/studies/{urllib.parse.quote(nct_id)}?format=json"
    try:
        body = http_get(url)
    except urllib.error.URLError:
        return None
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return None
    desc = (data.get("protocolSection") or {}).get("descriptionModule") or {}
    brief = (desc.get("briefSummary") or "").strip()
    detailed = (desc.get("detailedDescription") or "").strip()
    return (brief + " " + detailed).strip() or None


REDDIT_URL_RE = re.compile(
    r"^https?://(?:www\.|old\.|np\.)?reddit\.com/r/([^/]+)/comments/([a-z0-9]+)/?",
    re.IGNORECASE,
)


def fetch_reddit_post(url: str) -> str | None:
    m = REDDIT_URL_RE.match(url)
    if not m:
        return None
    subreddit, post_id = m.group(1), m.group(2)
    json_url = f"https://www.reddit.com/r/{subreddit}/comments/{post_id}.json?raw_json=1"
    try:
        body = http_get(json_url)
    except urllib.error.URLError:
        return None
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, list) or len(data) < 2:
        return None
    parts: list[str] = []
    try:
        post = data[0]["data"]["children"][0]["data"]
        title = (post.get("title") or "").strip()
        body_text = (post.get("selftext") or "").strip()
        if title:
            parts.append(title)
        if body_text and body_text not in ("[deleted]", "[removed]"):
            parts.append(body_text)
    except (KeyError, IndexError, TypeError):
        return None
    try:
        for c in data[1]["data"]["children"][:5]:
            if c.get("kind") != "t1":
                continue
            ctext = (c.get("data") or {}).get("body") or ""
            if ctext and ctext not in ("[deleted]", "[removed]"):
                parts.append(ctext.strip())
    except (KeyError, IndexError, TypeError):
        pass
    return " ".join(parts).strip() or None


# ── Anthropic Messages API call ─────────────────────────────────────


EXTRACTION_SYSTEM_PROMPT = """You are an evidence extraction layer for the Whel drug-repurposing platform. Your job is to extract a tight 2-4 sentence summary of the key finding in a research source, focused on a specific drug-condition pair.

Rules you must follow:
- Use only claims directly supported by the canonical source text provided.
- Focus on the relationship between the named drug and the named condition.
- Be specific: include numerical findings (effect sizes, sample sizes, p-values, percentages), study design (RCT, observational, case report, etc.), and direction of effect when those are present in the source.
- Past-tense reporting voice ("the trial found", "the authors reported", "users in the thread described").
- Do not introduce any claim, statistic, or detail that is not explicitly in the source text.
- If the canonical source does not actually discuss this drug-condition pair, output exactly: NO_RELEVANT_FINDING

Output only the 2-4 sentence summary itself. Do not preface it with any framing like "Summary:" or "Here is the extracted finding:". Do not add quote marks around the output."""


EXTRACTION_USER_TEMPLATE = """Drug: {drug}
Condition: {condition}
Source type: {source_type}
External identifier: {external_id}

Canonical source text:
\"\"\"
{canonical_text}
\"\"\"

Extract the 2-4 sentence key finding for {drug} in {condition}."""


def call_claude_extraction(
    api_key: str,
    model: str,
    drug: str,
    condition: str,
    source_type: str,
    external_id: str,
    canonical_text: str,
) -> tuple[str | None, str | None]:
    """Returns (extracted_text, error). On success, error is None; on
    failure, extracted_text is None and error describes the failure."""
    user_message = EXTRACTION_USER_TEMPLATE.format(
        drug=drug,
        condition=condition,
        source_type=source_type,
        external_id=external_id,
        # Cap canonical text length to keep input tokens predictable; 8K
        # chars is plenty for a PubMed abstract or a typical Reddit
        # thread without being wasteful.
        canonical_text=canonical_text[:8000],
    )
    body = json.dumps({
        "model": model,
        "max_tokens": 400,
        "system": EXTRACTION_SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_message}],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "user-agent": HTTP_HEADERS["User-Agent"],
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err_body = ""
        try:
            err_body = e.read().decode("utf-8", errors="replace")
        except Exception:
            pass
        return None, f"Anthropic HTTP {e.code}: {err_body[:300]}"
    except urllib.error.URLError as e:
        return None, f"Anthropic HTTP error: {e}"

    content = data.get("content") or []
    text_block = next((c.get("text") for c in content if c.get("type") == "text"), None)
    if not text_block:
        return None, "Anthropic returned no text content"
    return text_block.strip(), None


# ── Migration writing ───────────────────────────────────────────────


def sql_escape(s: str) -> str:
    """Postgres single-quote escape: ' -> ''. We do not need to escape
    anything else; the strings are stored as text with E-escape semantics
    off by default."""
    return s.replace("'", "''")


def write_migration(extractions: list["Extraction"]) -> None:
    successful = [e for e in extractions if e.status == "extracted" and e.extracted_text]
    MIGRATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    lines.append("-- 045_backfill_key_finding_excerpts.sql")
    lines.append("-- Backfill sources.key_finding_excerpt for every free-text source")
    lines.append("-- (source_type in {'pubmed', 'clinical_trial', 'reddit'}) where")
    lines.append("-- the LLM extraction pipeline produced a usable summary. Generated")
    lines.append("-- by scripts/extract-key-findings.py; companion run log lives at")
    lines.append("-- scripts/audit-output/key-finding-extractions.json.")
    lines.append("--")
    lines.append("-- The column existed per migration 041 but was 0% populated until")
    lines.append("-- the Phase 2a smoke test on 2026-06-08 surfaced the gap. See")
    lines.append("-- methodology v3.13 for the architectural story.")
    lines.append("--")
    lines.append("-- Each UPDATE is defensive: the WHERE clause includes")
    lines.append("-- 'AND key_finding_excerpt IS NULL', so the migration is a no-op")
    lines.append("-- on any row that has been touched since extraction ran. Safe to")
    lines.append("-- re-run.")
    lines.append("--")
    lines.append(f"-- Total extractions in this migration: {len(successful)}")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")
    for e in successful:
        lines.append(f"-- {e.source_type}/{e.external_id} ({e.drug} / {e.condition})")
        lines.append("UPDATE sources")
        lines.append(f"   SET key_finding_excerpt = '{sql_escape(e.extracted_text)}'")
        lines.append(f" WHERE id = '{e.source_id}'")
        lines.append( "   AND key_finding_excerpt IS NULL;")
        lines.append("")
    lines.append("COMMIT;")
    lines.append("")
    lines.append("-- Verification query (run after COMMIT). Expected: high percentage of")
    lines.append("-- free-text sources now have a key_finding_excerpt.")
    lines.append("--")
    lines.append("--   SELECT source_type, COUNT(*) AS total,")
    lines.append("--          COUNT(key_finding_excerpt) AS with_excerpt")
    lines.append("--     FROM sources")
    lines.append("--    WHERE source_type IN ('pubmed', 'clinical_trial', 'reddit')")
    lines.append("--    GROUP BY source_type;")
    lines.append("")
    MIGRATION_PATH.write_text("\n".join(lines))


# ── Per-source extraction ───────────────────────────────────────────


@dataclass
class Extraction:
    source_id: str
    signal_id: str
    source_type: str
    external_id: str
    drug: str
    condition: str
    status: str  # extracted, no_relevant_finding, fetch_failed, api_failed, skipped
    extracted_text: str = ""
    error: str | None = None
    latency_seconds: float | None = None


def extract_one(
    row: dict[str, Any],
    signal_to_pair: dict[str, tuple[str, str]],
    api_key: str,
    model: str,
) -> Extraction:
    sid = str(row.get("id") or "")
    signal_id = str(row.get("signal_id") or "")
    stype = (row.get("source_type") or "").strip().lower()
    eid = (row.get("external_id") or "").strip()
    drug, condition = signal_to_pair.get(signal_id, ("?", "?"))
    base = Extraction(
        source_id=sid,
        signal_id=signal_id,
        source_type=stype,
        external_id=eid,
        drug=drug,
        condition=condition,
        status="skipped",
    )

    # Fetch canonical text.
    if stype == "pubmed":
        time.sleep(NCBI_SLEEP_S)
        canonical = fetch_pubmed_abstract(eid)
    elif stype in ("clinical_trial", "clinical_trial_finding"):
        time.sleep(CTGOV_SLEEP_S)
        canonical = fetch_ctgov_description(eid)
    elif stype == "reddit":
        time.sleep(REDDIT_SLEEP_S)
        canonical = fetch_reddit_post(row.get("url") or "")
    else:
        base.error = f"source_type {stype!r} is not a free-text source"
        return base

    if not canonical:
        base.status = "fetch_failed"
        base.error = "canonical source text could not be fetched"
        return base

    if drug == "?" or condition == "?":
        base.error = "missing drug or condition lookup for this signal"
        base.status = "skipped"
        return base

    # Call Claude.
    t0 = time.time()
    text, err = call_claude_extraction(
        api_key=api_key,
        model=model,
        drug=drug,
        condition=condition,
        source_type=stype,
        external_id=eid,
        canonical_text=canonical,
    )
    base.latency_seconds = round(time.time() - t0, 2)
    time.sleep(ANTHROPIC_SLEEP_S)
    if err:
        base.status = "api_failed"
        base.error = err
        return base

    text = (text or "").strip()
    if text == "NO_RELEVANT_FINDING":
        base.status = "no_relevant_finding"
        return base
    if not text:
        base.status = "api_failed"
        base.error = "Anthropic returned empty extraction"
        return base

    base.status = "extracted"
    base.extracted_text = text
    return base


# ── Main ────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=None,
                        help="Process only the first N free-text rows. Default: all.")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Anthropic model id. Default: {DEFAULT_MODEL}")
    args = parser.parse_args()

    load_dotenv(DOTENV_PATH)
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY must be set (in .env.local or the environment).",
              file=sys.stderr)
        return 2

    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not base or not key:
        print("ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
              file=sys.stderr)
        return 2

    if not SNAPSHOT_PATH.exists():
        print(f"ERROR: snapshot not found at {SNAPSHOT_PATH}\n"
              "Run scripts/export-sources-for-audit.py first.",
              file=sys.stderr)
        return 2

    snapshot = json.loads(SNAPSHOT_PATH.read_text())
    all_sources = snapshot.get("sources", [])
    free_text_types = {"pubmed", "clinical_trial", "clinical_trial_finding", "reddit"}
    sources = [s for s in all_sources if (s.get("source_type") or "").lower() in free_text_types]
    if args.limit:
        sources = sources[: args.limit]

    print(f"loading drug + condition name lookup from Supabase…")
    sb_headers = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}
    _, _, signal_to_pair = fetch_lookup(base, sb_headers)
    print(f"  {len(signal_to_pair)} active signals mapped to drug + condition names")

    print(f"extracting key findings for {len(sources)} free-text source row(s) using {args.model}…")
    extractions: list[Extraction] = []
    for i, row in enumerate(sources, start=1):
        if i % 10 == 1:
            print(f"  · {i} / {len(sources)} …", flush=True)
        extractions.append(extract_one(row, signal_to_pair, api_key, args.model))

    # Write run log.
    RUN_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    counts: dict[str, int] = {}
    by_type: dict[str, dict[str, int]] = {}
    for e in extractions:
        counts[e.status] = counts.get(e.status, 0) + 1
        by_type.setdefault(e.source_type, {})
        by_type[e.source_type][e.status] = by_type[e.source_type].get(e.status, 0) + 1
    log_payload = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": args.model,
        "summary": {
            "total": len(extractions),
            "by_status": counts,
            "by_source_type": {k: dict(sorted(v.items())) for k, v in by_type.items()},
        },
        "results": [asdict(e) for e in extractions],
    }
    RUN_LOG_PATH.write_text(json.dumps(log_payload, indent=2) + "\n")

    # Write migration.
    write_migration(extractions)

    print()
    print("=" * 64)
    print("Whel · key-finding extraction summary")
    print("=" * 64)
    print(f"Model: {args.model}")
    print(f"Total rows processed: {len(extractions)}")
    print()
    for status, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {status:24s} {n}")
    print()
    print("By source_type:")
    for stype, by_status in by_type.items():
        per = ", ".join(f"{s}={n}" for s, n in sorted(by_status.items()))
        print(f"  {stype:16s} {per}")
    print()
    print(f"wrote {RUN_LOG_PATH.relative_to(REPO)}")
    print(f"wrote {MIGRATION_PATH.relative_to(REPO)}")
    print()
    print("Next steps:")
    print(f"  1. Review {MIGRATION_PATH.relative_to(REPO)} (spot-check a few UPDATE statements)")
    print(f"  2. Open Supabase Studio → SQL Editor → paste and run the migration")
    print( "  3. Verify with the SELECT query at the bottom of the migration file")
    print( "  4. git add supabase/migrations/045_backfill_key_finding_excerpts.sql")
    print( "     git commit -m 'Backfill sources.key_finding_excerpt via LLM extraction (migration 045)'")
    print( "     git push")
    print( "  5. python3 scripts/export-sources-for-audit.py")
    print( "     git add lib/sources-audit-snapshot.json")
    print( "     git commit -m 'Refresh sources snapshot after migration 045'")
    print( "     git push")
    print( "  6. python3 scripts/verify-summary-grounding.py    # the real Phase 2a run")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
