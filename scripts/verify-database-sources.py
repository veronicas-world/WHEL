#!/usr/bin/env python3
"""
verify-database-sources.py
===========================

Whel Path C Phase 1 audit for the live `sources` table.

PURPOSE
-------
Audits every source record exported by scripts/export-sources-for-audit.py
against the canonical external source for its identifier type:

  pubmed          PMID resolves against NCBI E-utilities esummary;
                  canonical title compared against stored `title` field
                  with calibrated fuzzy threshold.
  clinical_trial  NCT ID resolves against ClinicalTrials.gov API v2;
                  canonical brief title compared against stored title.
  opentargets     CHEMBL / target / disease ID resolves against the
                  Open Targets GraphQL API search.
  faers           URL is well-formed and points at the FDA AEMS
                  dashboard or a faers-related FDA path; format-only.
  reddit          URL is well-formed and matches the Reddit comment-link
                  pattern (must contain /r/ and /comments/).
  other           Skipped with note; type-unknown rows accumulate in a
                  separate bucket so the disclosure is honest about
                  what was audited and what was not.

Outcomes per source row:

  resolved_match       identifier resolves AND stored metadata matches
                       canonical within tolerance. Safe.
  resolved_mismatch    identifier resolves but stored title differs
                       beyond the fuzzy threshold. Likely LLM
                       misattribution; flag for review.
  unresolved           identifier returns nothing / HTTP error / does
                       not exist. Blocks publication.
  format_only_pass     format-only check passed (FAERS, Reddit). Less
                       strong than full resolution but as much as the
                       source publisher exposes.
  format_fail          format-only check failed.
  skipped              source type not audited in this round (e.g.
                       "other"); recorded in summary.

OUTPUT
------
  scripts/audit-output/database-sources-audit-report.json   full report
  lib/database-sources-audit-snapshot.json                  site sidecar

USAGE
-----
Run scripts/export-sources-for-audit.py first (locally; needs Supabase).
Commit the resulting lib/sources-audit-snapshot.json. Then run this
script:

    python3 scripts/verify-database-sources.py

By default audits all source rows; use --limit N to test on a smaller
batch. Use --strict to exit non-zero on any unresolved or mismatched
entry (for CI use, same convention as scripts/verify-citations.py).

DEPENDENCIES
------------
Stdlib only.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
SNAPSHOT_PATH = REPO / "lib" / "sources-audit-snapshot.json"
REPORT_PATH = REPO / "scripts" / "audit-output" / "database-sources-audit-report.json"
SIDECAR_PATH = REPO / "lib" / "database-sources-audit-snapshot.json"

# Conservative thresholds; same justification as scripts/verify-citations.py.
TITLE_SIMILARITY_THRESHOLD = 0.80
NCBI_SLEEP_S = 0.4
CTGOV_SLEEP_S = 0.3
OT_SLEEP_S = 0.3

HTTP_HEADERS = {
    "User-Agent": "Whel-Path-C-Phase-1-DB-Audit/1.0 (https://rediscover-coral.vercel.app; mailto:vla2117@columbia.edu)"
}


def http_get(url: str, timeout: int = 25) -> bytes:
    req = urllib.request.Request(url, headers=HTTP_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def normalize_text(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    s = re.sub(r"[\u2010-\u2015\u2212]", "-", s)
    s = re.sub(r"[^a-z0-9\s\-:]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def title_similarity(claimed: str, canonical: str) -> float:
    a = normalize_text(claimed)
    b = normalize_text(canonical)
    if not a or not b:
        return 0.0
    if a in b or b in a:
        return 1.0
    return SequenceMatcher(None, a, b).ratio()


# ── Resolvers ───────────────────────────────────────────────────────


def resolve_pmid(pmid: str) -> dict[str, Any] | None:
    url = (
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        f"?db=pubmed&id={urllib.parse.quote(pmid)}&retmode=json"
    )
    try:
        body = http_get(url)
    except urllib.error.URLError as exc:
        return {"__error__": f"NCBI HTTP error: {exc}"}
    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        return {"__error__": f"NCBI returned non-JSON: {exc}"}
    entry = (data.get("result") or {}).get(pmid)
    if not entry or entry.get("error"):
        return None
    return {
        "title": (entry.get("title") or "").strip().rstrip("."),
        "source": "NCBI E-utilities esummary",
    }


def resolve_nct(nct_id: str) -> dict[str, Any] | None:
    """ClinicalTrials.gov API v2 study lookup. The official API returns
    a JSON document with a protocolSection containing identificationModule
    with briefTitle and officialTitle."""
    if not re.match(r"^NCT\d{8}$", nct_id):
        return {"__error__": f"NCT ID does not match NCT\\d{{8}} pattern: {nct_id!r}"}
    url = f"https://clinicaltrials.gov/api/v2/studies/{urllib.parse.quote(nct_id)}?format=json"
    try:
        body = http_get(url)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        return {"__error__": f"ClinicalTrials.gov HTTP error {exc.code}: {exc}"}
    except urllib.error.URLError as exc:
        return {"__error__": f"ClinicalTrials.gov HTTP error: {exc}"}
    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        return {"__error__": f"ClinicalTrials.gov returned non-JSON: {exc}"}
    ident = ((data.get("protocolSection") or {}).get("identificationModule") or {})
    brief = (ident.get("briefTitle") or "").strip()
    official = (ident.get("officialTitle") or "").strip()
    title = brief or official
    return {
        "title": title.rstrip("."),
        "source": "ClinicalTrials.gov API v2",
    }


def resolve_open_targets(ot_id: str) -> dict[str, Any] | None:
    """Open Targets GraphQL search. The platform exposes a search endpoint
    that returns matching drug / target / disease entities by ID. CHEMBL
    IDs map to drug pages."""
    query = """
    query ResolveID($id: String!) {
      drug(chemblId: $id) { id name __typename }
      target(ensemblId: $id) { id approvedSymbol __typename }
      disease(efoId: $id) { id name __typename }
    }
    """
    payload = json.dumps({"query": query, "variables": {"id": ot_id}}).encode("utf-8")
    req = urllib.request.Request(
        "https://api.platform.opentargets.org/api/v4/graphql",
        data=payload,
        headers={**HTTP_HEADERS, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        return {"__error__": f"Open Targets HTTP error {exc.code}"}
    except urllib.error.URLError as exc:
        return {"__error__": f"Open Targets HTTP error: {exc}"}
    except json.JSONDecodeError as exc:
        return {"__error__": f"Open Targets returned non-JSON: {exc}"}
    body = data.get("data") or {}
    for kind in ("drug", "target", "disease"):
        block = body.get(kind)
        if block and block.get("id"):
            name = block.get("name") or block.get("approvedSymbol") or ""
            return {"title": name, "kind": kind, "source": "Open Targets GraphQL"}
    return None


def check_faers_url(url: str) -> tuple[bool, str]:
    """FAERS doesn't expose a stable record-lookup API; we validate that
    the URL points at the official AEMS dashboard or an fda.gov path
    associated with adverse-event reporting."""
    if not url:
        return False, "empty URL"
    if not url.startswith(("https://", "http://")):
        return False, "missing scheme"
    if "fda.gov" not in url:
        return False, "not an fda.gov URL"
    if not any(token in url.lower() for token in ("aems", "faers", "adverse", "openfda")):
        return False, "fda.gov URL does not look like an AEMS / FAERS dashboard or openFDA path"
    return True, "well-formed fda.gov AEMS / FAERS / openFDA URL"


def check_reddit_url(url: str) -> tuple[bool, str]:
    """Reddit permalinks include /r/{subreddit}/comments/{post_id}/ in
    the path. We don't hit the Reddit API (which requires OAuth); a
    format check is the strongest portable validation."""
    if not url:
        return False, "empty URL"
    if not url.startswith(("https://", "http://")):
        return False, "missing scheme"
    if "reddit.com" not in url.lower():
        return False, "not a reddit.com URL"
    if "/comments/" not in url:
        return False, "missing /comments/ path segment (permalink pattern)"
    if "/r/" not in url:
        return False, "missing /r/{subreddit}/ path segment"
    return True, "well-formed reddit permalink"


# ── Per-source verification ─────────────────────────────────────────


@dataclass
class SourceResult:
    source_id: str
    signal_id: str
    source_type: str
    external_id: str
    stored_title: str
    status: str
    canonical_title: str = ""
    title_similarity_score: float | None = None
    error: str | None = None
    note: str = ""


def verify_pubmed(row: dict[str, Any]) -> SourceResult:
    pmid = (row.get("external_id") or "").strip()
    stored_title = (row.get("title") or "").strip()
    base = SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type="pubmed",
        external_id=pmid,
        stored_title=stored_title,
        status="unresolved",
    )
    if not pmid or not pmid.isdigit():
        base.error = f"external_id missing or not a numeric PMID: {pmid!r}"
        return base
    time.sleep(NCBI_SLEEP_S)
    canonical = resolve_pmid(pmid)
    if canonical is None:
        base.error = f"PMID {pmid} did not resolve at NCBI"
        return base
    if "__error__" in canonical:
        base.error = canonical["__error__"]
        return base
    base.canonical_title = canonical["title"]
    sim = title_similarity(stored_title, canonical["title"])
    base.title_similarity_score = round(sim, 3)
    if not stored_title:
        base.status = "resolved_match"
        base.note = "stored title was empty; identifier resolves at NCBI"
    elif sim >= TITLE_SIMILARITY_THRESHOLD:
        base.status = "resolved_match"
    else:
        base.status = "resolved_mismatch"
    return base


def verify_clinical_trial(row: dict[str, Any]) -> SourceResult:
    nct = (row.get("external_id") or "").strip().upper()
    stored_title = (row.get("title") or "").strip()
    base = SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type="clinical_trial",
        external_id=nct,
        stored_title=stored_title,
        status="unresolved",
    )
    if not nct.startswith("NCT"):
        base.error = f"external_id is not an NCT ID: {nct!r}"
        return base
    time.sleep(CTGOV_SLEEP_S)
    canonical = resolve_nct(nct)
    if canonical is None:
        base.error = f"NCT ID {nct} did not resolve at ClinicalTrials.gov"
        return base
    if "__error__" in canonical:
        base.error = canonical["__error__"]
        return base
    base.canonical_title = canonical["title"]
    sim = title_similarity(stored_title, canonical["title"])
    base.title_similarity_score = round(sim, 3)
    if not stored_title:
        base.status = "resolved_match"
        base.note = "stored title was empty; identifier resolves at ClinicalTrials.gov"
    elif sim >= TITLE_SIMILARITY_THRESHOLD:
        base.status = "resolved_match"
    else:
        base.status = "resolved_mismatch"
    return base


def verify_opentargets(row: dict[str, Any]) -> SourceResult:
    ot_id = (row.get("external_id") or "").strip()
    stored_title = (row.get("title") or "").strip()
    base = SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type="opentargets",
        external_id=ot_id,
        stored_title=stored_title,
        status="unresolved",
    )
    if not ot_id:
        base.error = "external_id missing"
        return base
    time.sleep(OT_SLEEP_S)
    canonical = resolve_open_targets(ot_id)
    if canonical is None:
        base.error = f"Open Targets ID {ot_id} did not resolve"
        return base
    if "__error__" in canonical:
        base.error = canonical["__error__"]
        return base
    base.canonical_title = canonical["title"]
    base.status = "resolved_match"
    base.note = f"Open Targets returned a {canonical.get('kind', '?')} record"
    return base


def verify_faers(row: dict[str, Any]) -> SourceResult:
    base = SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type="faers",
        external_id=(row.get("external_id") or "").strip(),
        stored_title=(row.get("title") or "").strip(),
        status="format_fail",
    )
    ok, note = check_faers_url(row.get("url") or "")
    base.note = note
    base.status = "format_only_pass" if ok else "format_fail"
    return base


def verify_reddit(row: dict[str, Any]) -> SourceResult:
    base = SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type="reddit",
        external_id=(row.get("external_id") or "").strip(),
        stored_title=(row.get("title") or "").strip(),
        status="format_fail",
    )
    ok, note = check_reddit_url(row.get("url") or "")
    base.note = note
    base.status = "format_only_pass" if ok else "format_fail"
    return base


def verify_one(row: dict[str, Any]) -> SourceResult:
    stype = (row.get("source_type") or "").strip().lower()
    if stype == "pubmed":
        return verify_pubmed(row)
    if stype in ("clinical_trial", "clinical_trial_finding"):
        return verify_clinical_trial(row)
    if stype == "opentargets":
        return verify_opentargets(row)
    if stype == "faers":
        return verify_faers(row)
    if stype == "reddit":
        return verify_reddit(row)
    return SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type=stype or "unknown",
        external_id=(row.get("external_id") or "").strip(),
        stored_title=(row.get("title") or "").strip(),
        status="skipped",
        note=f"source_type {stype!r} is not audited in this round",
    )


# ── Reporting ───────────────────────────────────────────────────────


def write_outputs(results: list[SourceResult]) -> None:
    counts: dict[str, int] = {}
    by_type: dict[str, dict[str, int]] = {}
    for r in results:
        counts[r.status] = counts.get(r.status, 0) + 1
        by_type.setdefault(r.source_type, {})
        by_type[r.source_type][r.status] = by_type[r.source_type].get(r.status, 0) + 1

    payload = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        # "ready" so lib/database-sources-audit-snapshot.ts's
        # isPopulated() flips true and the disclosure page renders
        # live numbers instead of the placeholder block.
        "status": "ready",
        "summary": {
            "total": len(results),
            "by_status": counts,
            "by_source_type": {k: dict(sorted(v.items())) for k, v in by_type.items()},
        },
        "results": [asdict(r) for r in results],
    }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    SIDECAR_PATH.write_text(json.dumps(payload, indent=2) + "\n")

    print()
    print("=" * 64)
    print("Whel Path C Phase 1 · database-sources audit report")
    print("=" * 64)
    print(f"Total source rows audited:    {len(results)}")
    print()
    for status, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {status:24s} {n}")
    print()
    print("By source_type:")
    for stype, by_status in by_type.items():
        per = ", ".join(f"{s}={n}" for s, n in sorted(by_status.items()))
        print(f"  {stype:16s} {per}")
    print()
    print(f"wrote {REPORT_PATH.relative_to(REPO)}")
    print(f"wrote {SIDECAR_PATH.relative_to(REPO)}")


# ── Main ────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Audit only the first N rows (for testing). Default: all.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero on any unresolved / mismatched / format_fail entry.",
    )
    args = parser.parse_args()

    if not SNAPSHOT_PATH.exists():
        print(
            f"snapshot not found at {SNAPSHOT_PATH}\n"
            "Run scripts/export-sources-for-audit.py first (locally, "
            "with Supabase env vars).",
            file=sys.stderr,
        )
        return 2

    snapshot = json.loads(SNAPSHOT_PATH.read_text())
    sources = snapshot.get("sources", [])
    if args.limit:
        sources = sources[: args.limit]

    print(f"auditing {len(sources)} source row(s) from {SNAPSHOT_PATH.relative_to(REPO)}…")
    results: list[SourceResult] = []
    for i, row in enumerate(sources, start=1):
        if i % 25 == 1:
            print(f"  · {i} / {len(sources)} …", flush=True)
        results.append(verify_one(row))

    write_outputs(results)

    if args.strict:
        bad = {"resolved_mismatch", "unresolved", "format_fail"}
        if any(r.status in bad for r in results):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
