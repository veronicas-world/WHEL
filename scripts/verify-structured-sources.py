#!/usr/bin/env python3
"""
verify-structured-sources.py
==============================

Whel Path C Phase 2b · structured-source verification.

PURPOSE
-------
For every source row whose source_type is structured rather than free
text, verify the LLM-extracted claim against the canonical structured
record at the publisher. This is the complement of Phase 2a
(scripts/verify-summary-grounding.py, which uses sentence-level
cosine similarity against free-text abstracts). The mechanism is
different because the source IS structured data: the LLM extracted
counts, identifiers, and association scores rather than free prose,
so the right check is field-by-field comparison rather than semantic
similarity.

Two source_type values are handled:

  faers (AEMS in user-facing prose; the database field value
    is literally 'faers'). Two patterns:

    * Reaction-level rows (external_id starts with FAERS-{DRUG}-):
      title encodes the reaction count, e.g.
      "AEMS: Hot flush (3 reports in the analysed AEMS sample)".
      url is the canonical openFDA query. The verifier re-runs
      the url, reads meta.results.total from the openFDA
      response, and compares it to the count in the title within
      a 10 percent or +/-5 count tolerance (whichever is larger;
      AEMS counts drift as new reports land at the FDA).

    * Query-level rows (external_id starts with FAERS-QUERY-):
      title encodes the all-reactions female-patient count, e.g.
      "FDA AEMS Database Query: Pravastatin — 3,742
      condition-relevant reports out of 10,007 female-patient
      reports". url is the unfiltered drug + female-sex openFDA
      query. The verifier re-runs the url and compares the total
      against the 'N out of M female-patient reports' value
      ('M' here; the 'N' subset is the LLM's condition-relevant
      classification, which is checked separately).

  opentargets. title encodes target + score, e.g.
    "Open Targets: Aprepitant — genetic_target_overlap for menopause
    (target: TACR1, OT score: 0.482)". The verifier parses the
    claimed target symbol from the title and verifies it appears in
    the linkedTargets list returned by the OT GraphQL drug(chemblId)
    query for the row's external_id. Numerical score comparison is
    deferred to a follow-on once the OT GraphQL exposes per-drug
    per-disease per-target scores in a single GraphQL hop.

THRESHOLDS
----------
AEMS counts:
  * absolute tolerance: max(5, 10 percent of claimed count). AEMS
    is a continuously-updating dataset, so exact matches are not
    expected.

Open Targets:
  * target symbol substring match (claimed target text contains the
    linkedTargets symbol, or vice versa).

OUTCOMES
--------
  field_match            counts / fields agree within tolerance.
  field_mismatch         counts / fields disagree beyond tolerance.
  unresolved             url / api returns nothing or HTTP error.
  unparseable            title format did not match expected pattern.

OUTPUT
------
  scripts/audit-output/structured-sources-report.json   full report
  lib/structured-sources-audit-snapshot.json            site sidecar

USAGE
-----
    python3 scripts/verify-structured-sources.py
    python3 scripts/verify-structured-sources.py --limit 30
    python3 scripts/verify-structured-sources.py --strict

RUNTIME
-------
Roughly 10 to 15 minutes against ~1,844 structured sources, the
dominant cost being polite-use sleeps against openFDA (240 req/min
without API key).

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
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
SNAPSHOT_PATH = REPO / "lib" / "sources-audit-snapshot.json"
REPORT_PATH = REPO / "scripts" / "audit-output" / "structured-sources-report.json"
SIDECAR_PATH = REPO / "lib" / "structured-sources-audit-snapshot.json"

OPENFDA_SLEEP_S = 0.3
OT_SLEEP_S = 0.3

HTTP_HEADERS = {
    "User-Agent": "Whel-Path-C-Phase-2b/1.0 (https://rediscover-coral.vercel.app; mailto:vla2117@columbia.edu)"
}


def http_get(url: str, timeout: int = 25) -> bytes:
    req = urllib.request.Request(url, headers=HTTP_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def http_post_json(url: str, payload: dict[str, Any], timeout: int = 25) -> Any:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={**HTTP_HEADERS, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


# ── Title parsers ───────────────────────────────────────────────────


REACTION_COUNT_RE = re.compile(
    r"\((\d[\d,]*)\s+reports?\b",
    re.IGNORECASE,
)

QUERY_COUNTS_RE = re.compile(
    r"(\d[\d,]*)\s+condition-relevant reports? out of\s+(\d[\d,]*)\s+female-patient reports?",
    re.IGNORECASE,
)

OT_TITLE_RE = re.compile(
    r"^Open Targets:\s+([^—\-]+)[—\-]+\s*([\w_]+)\s+for\s+([^\(]+)\(target:\s*([^,)]+?)(?:\s*\([^)]*\))?,?\s*(?:OT score:\s*([\d.]+))?",
    re.IGNORECASE,
)


def parse_int(s: str) -> int | None:
    try:
        return int(s.replace(",", "").strip())
    except (ValueError, AttributeError):
        return None


# ── AEMS verification ───────────────────────────────────────────────


def fetch_openfda_total(url: str) -> int | None:
    """Re-run the openFDA query stored on the source row and return
    meta.results.total. Returns None on any failure (HTTP, JSON, or
    missing meta block)."""
    try:
        body = http_get(url)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            # openFDA returns 404 when the query has zero hits, which
            # is itself useful information.
            return 0
        return None
    except urllib.error.URLError:
        return None
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return None
    meta = data.get("meta") or {}
    results_meta = meta.get("results") or {}
    total = results_meta.get("total")
    return int(total) if isinstance(total, int) else None


def within_aems_tolerance(claimed: int, actual: int) -> bool:
    """AEMS counts drift over time; accept either +/-5 or +/-10
    percent of the claimed count, whichever is larger."""
    if claimed == 0 and actual == 0:
        return True
    delta = abs(claimed - actual)
    tolerance = max(5, int(claimed * 0.10))
    return delta <= tolerance


def verify_aems(row: dict[str, Any]) -> "SourceResult":
    eid = (row.get("external_id") or "").strip()
    title = (row.get("title") or "").strip()
    url = (row.get("url") or "").strip()
    base = SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type="faers",
        external_id=eid,
        status="unresolved",
    )

    if not url.startswith("https://api.fda.gov/"):
        base.error = "url is not an openFDA api endpoint; cannot verify counts"
        base.status = "unparseable"
        return base

    # Parse claimed count from title.
    if eid.startswith("FAERS-QUERY-"):
        m = QUERY_COUNTS_RE.search(title)
        if not m:
            base.error = "title does not match 'N condition-relevant reports out of M female-patient reports' pattern"
            base.status = "unparseable"
            return base
        # We verify M (the unfiltered female-patient count). N is the
        # LLM's condition-relevant subset, which is a separate claim.
        claimed = parse_int(m.group(2))
        base.note = "verifying M (unfiltered female-patient report count)"
    else:
        m = REACTION_COUNT_RE.search(title)
        if not m:
            base.error = "title does not match '(N reports in the analysed AEMS sample)' pattern"
            base.status = "unparseable"
            return base
        claimed = parse_int(m.group(1))

    if claimed is None:
        base.error = "could not parse integer count from title"
        base.status = "unparseable"
        return base

    base.claimed_count = claimed

    time.sleep(OPENFDA_SLEEP_S)
    actual = fetch_openfda_total(url)
    if actual is None:
        base.error = "openFDA query did not return a meta.results.total"
        base.status = "unresolved"
        return base

    base.actual_count = actual
    base.status = "field_match" if within_aems_tolerance(claimed, actual) else "field_mismatch"
    return base


# ── Open Targets verification ───────────────────────────────────────


OT_LINKED_TARGETS_QUERY = """
query DrugLinkedTargets($id: String!) {
  drug(chemblId: $id) {
    id
    name
    linkedTargets {
      count
      rows { id approvedSymbol }
    }
  }
}
"""


def fetch_ot_drug_linked_targets(chembl_id: str) -> dict[str, Any] | None:
    """Return the Open Targets drug record with its linkedTargets list.
    Returns None on any failure."""
    try:
        data = http_post_json(
            "https://api.platform.opentargets.org/api/v4/graphql",
            {"query": OT_LINKED_TARGETS_QUERY, "variables": {"id": chembl_id}},
        )
    except urllib.error.URLError:
        return None
    except json.JSONDecodeError:
        return None
    return (data.get("data") or {}).get("drug") or None


def normalize_symbol(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", (s or "")).upper()


def verify_opentargets(row: dict[str, Any]) -> "SourceResult":
    eid = (row.get("external_id") or "").strip()
    title = (row.get("title") or "").strip()
    base = SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type="opentargets",
        external_id=eid,
        status="unresolved",
    )

    if not eid.startswith("CHEMBL"):
        base.error = "external_id is not a CHEMBL identifier"
        base.status = "unparseable"
        return base

    m = OT_TITLE_RE.search(title)
    if not m:
        base.error = "title does not match the expected Open Targets pattern"
        base.status = "unparseable"
        return base

    claimed_target = m.group(4).strip()
    score_str = m.group(5)
    try:
        claimed_score = float(score_str) if score_str else None
    except ValueError:
        claimed_score = None

    base.claimed_target = claimed_target
    base.claimed_score = claimed_score

    time.sleep(OT_SLEEP_S)
    drug = fetch_ot_drug_linked_targets(eid)
    if not drug:
        base.error = f"Open Targets drug({eid}) did not resolve"
        base.status = "unresolved"
        return base

    linked = (drug.get("linkedTargets") or {}).get("rows") or []
    actual_symbols = [r.get("approvedSymbol") or "" for r in linked]
    base.actual_target_count = len(linked)

    claimed_norm = normalize_symbol(claimed_target)
    matched = next(
        (s for s in actual_symbols if claimed_norm and normalize_symbol(s) == claimed_norm),
        None,
    )
    # Also accept substring matches in either direction (some targets
    # use full names like "tachykinin receptor 1" with TACR1 in
    # parentheses).
    if not matched:
        for s in actual_symbols:
            if claimed_norm and normalize_symbol(s) in claimed_norm:
                matched = s
                break
        for s in actual_symbols:
            if claimed_norm and claimed_norm in normalize_symbol(s):
                matched = s
                break

    if matched:
        base.note = f"target symbol {matched!r} found in Open Targets linkedTargets ({len(linked)} total)"
        base.status = "field_match"
    else:
        base.note = (
            f"claimed target {claimed_target!r} not found among the "
            f"{len(linked)} linkedTargets returned by Open Targets"
        )
        base.status = "field_mismatch"
    return base


# ── Result type and dispatch ────────────────────────────────────────


@dataclass
class SourceResult:
    source_id: str
    signal_id: str
    source_type: str
    external_id: str
    status: str  # field_match, field_mismatch, unresolved, unparseable
    claimed_count: int | None = None
    actual_count: int | None = None
    claimed_target: str | None = None
    claimed_score: float | None = None
    actual_target_count: int | None = None
    error: str | None = None
    note: str = ""


def verify_one(row: dict[str, Any]) -> SourceResult:
    stype = (row.get("source_type") or "").strip().lower()
    if stype == "faers":
        return verify_aems(row)
    if stype == "opentargets":
        return verify_opentargets(row)
    return SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type=stype or "unknown",
        external_id=(row.get("external_id") or "").strip(),
        status="unparseable",
        note=f"source_type {stype!r} is not a structured type Phase 2b handles",
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
    print("Whel Path C Phase 2b · structured-sources audit report")
    print("=" * 64)
    print(f"Total source rows audited:   {len(results)}")
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
    parser.add_argument("--limit", type=int, default=None,
                        help="Audit only the first N structured rows. Default: all.")
    parser.add_argument("--strict", action="store_true",
                        help="Exit non-zero on any field_mismatch / unresolved / unparseable.")
    args = parser.parse_args()

    if not SNAPSHOT_PATH.exists():
        print(f"snapshot not found at {SNAPSHOT_PATH}\n"
              "Run scripts/export-sources-for-audit.py first.",
              file=sys.stderr)
        return 2

    snapshot = json.loads(SNAPSHOT_PATH.read_text())
    all_sources = snapshot.get("sources", [])
    structured_types = {"faers", "opentargets"}
    sources = [s for s in all_sources if (s.get("source_type") or "").lower() in structured_types]
    if args.limit:
        sources = sources[: args.limit]

    print(f"auditing {len(sources)} structured source row(s)…")
    results: list[SourceResult] = []
    for i, row in enumerate(sources, start=1):
        if i % 50 == 1:
            print(f"  · {i} / {len(sources)} …", flush=True)
        results.append(verify_one(row))

    write_outputs(results)

    if args.strict:
        bad = {"field_mismatch", "unresolved", "unparseable"}
        if any(r.status in bad for r in results):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
