"""Whel Path C Phase 1: citation validation.

For every entry in lib/whel-citations.json, resolve the identifier
(PMID against NCBI E-utilities, DOI against Crossref REST API, or
arXiv ID against the arXiv API), compare returned canonical metadata
(title, first-author surname, container title, year) to the claimed
metadata block in the manifest, and emit a structured report.

Three outcomes per citation:

    resolved_match     identifier resolves AND every metadata field
                       matches within tolerance. Safe to publish.

    resolved_mismatch  identifier resolves but one or more metadata
                       fields do not match the canonical record.
                       Manifest may have stale claims; verify before
                       publish. Blocks Phase 3 publication.

    unresolved         identifier returns nothing or HTTP error.
                       Either typo in identifier or the work does not
                       exist. Blocks Phase 3 publication.

Report is written to scripts/audit-output/citation-audit-report.json
and a short summary is printed to stdout for the dev workflow. The
JSON report is the source of truth that the public disclosure on
/about/external-references reads from when populated.

Run:
    python3 scripts/verify-citations.py

No external dependencies; uses stdlib urllib for HTTP and difflib for
fuzzy string comparison.
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
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
MANIFEST_PATH = REPO / "lib" / "whel-citations.json"
# Two output sinks: the human-readable run log lives in
# scripts/audit-output/ alongside other script logs; the site-imported
# sidecar lives in lib/ next to citation-audit-snapshot.ts following
# the same pattern as lib/matrix-audit-snapshot.json. Both files have
# identical content; the dual write keeps the site disclosure in sync
# with each run without a copy step.
REPORT_PATH = REPO / "scripts" / "audit-output" / "citation-audit-report.json"
SNAPSHOT_PATH = REPO / "lib" / "citation-audit-snapshot.json"

# Tolerances. Conservative enough to catch real mismatches without
# tripping on punctuation, casing, or abbreviation drift.
TITLE_SIMILARITY_THRESHOLD = 0.85
CONTAINER_SIMILARITY_THRESHOLD = 0.70  # journals frequently use abbreviations

# Polite-use header for the public APIs. Crossref and NCBI both request
# a contact email so they can reach out about abusive query patterns.
HTTP_HEADERS = {
    "User-Agent": "Whel-Path-C-Phase-1/1.0 (https://rediscover-coral.vercel.app; mailto:vla2117@columbia.edu)"
}

# Rate-limit sleeps between requests so we stay well under the public
# APIs' published limits.
NCBI_SLEEP_S = 0.4    # NCBI without API key: 3 req/s max
CROSSREF_SLEEP_S = 0.3
ARXIV_SLEEP_S = 0.4


# ── Identifier resolvers ────────────────────────────────────────────


def http_get(url: str, timeout: int = 20) -> bytes:
    req = urllib.request.Request(url, headers=HTTP_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def resolve_pmid(pmid: str) -> dict[str, Any] | None:
    """Query NCBI E-utilities esummary for the PMID. Returns canonical
    metadata or None if the record does not exist."""
    url = (
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        f"?db=pubmed&id={urllib.parse.quote(pmid)}&retmode=json"
    )
    try:
        body = http_get(url)
    except urllib.error.URLError as exc:
        return {"__error__": f"NCBI esummary HTTP error: {exc}"}
    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        return {"__error__": f"NCBI esummary returned non-JSON: {exc}"}

    result = data.get("result", {})
    entry = result.get(pmid)
    if not entry or entry.get("error"):
        return None

    # PubMed esummary lists authors as a list of {name, authtype}; first
    # author is the first element with authtype="Author".
    authors = entry.get("authors") or []
    first_author = next(
        (a.get("name") for a in authors if a.get("authtype") == "Author" and a.get("name")),
        None,
    )
    first_author_surname = (first_author or "").split(" ")[0] if first_author else ""

    pubdate = (entry.get("pubdate") or entry.get("epubdate") or "").strip()
    year_match = re.search(r"\b(19|20|21)\d{2}\b", pubdate)
    year = int(year_match.group(0)) if year_match else None

    return {
        "title": (entry.get("title") or "").strip().rstrip("."),
        "first_author_surname": first_author_surname,
        "container_title": (entry.get("fulljournalname") or entry.get("source") or "").strip(),
        "year": year,
        "source": "NCBI E-utilities esummary",
    }


def resolve_doi(doi: str) -> dict[str, Any] | None:
    """Query Crossref REST API for the DOI. Returns canonical metadata
    or None if the record does not exist."""
    url = f"https://api.crossref.org/works/{urllib.parse.quote(doi, safe='')}"
    try:
        body = http_get(url)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        return {"__error__": f"Crossref HTTP error {exc.code}: {exc}"}
    except urllib.error.URLError as exc:
        return {"__error__": f"Crossref HTTP error: {exc}"}

    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        return {"__error__": f"Crossref returned non-JSON: {exc}"}

    msg = data.get("message", {})
    title_list = msg.get("title") or []
    title = title_list[0].strip().rstrip(".") if title_list else ""

    authors = msg.get("author") or []
    first_author_surname = (authors[0].get("family") if authors else "") or ""

    container_list = msg.get("container-title") or msg.get("short-container-title") or []
    container = container_list[0] if container_list else ""

    # Crossref does not reliably populate container-title for bioRxiv
    # preprints (DOI prefix 10.1101/). Falling back to "bioRxiv" so
    # the manifest's claimed container matches the canonical record.
    if not container and doi.lower().startswith("10.1101/"):
        container = "bioRxiv"

    # Crossref date can live in any of several fields; prefer
    # "published" then fall back.
    year = None
    for date_field in ("published", "published-print", "published-online", "issued", "created"):
        date_block = msg.get(date_field)
        if not date_block:
            continue
        parts = date_block.get("date-parts") or []
        if parts and parts[0] and parts[0][0]:
            year = parts[0][0]
            break

    return {
        "title": title,
        "first_author_surname": first_author_surname,
        "container_title": container,
        "year": year,
        "source": "Crossref REST API",
    }


def resolve_arxiv(arxiv_id: str) -> dict[str, Any] | None:
    """Query the arXiv API for the given arXiv ID. Returns canonical
    metadata or None if the record does not exist."""
    url = f"https://export.arxiv.org/api/query?id_list={urllib.parse.quote(arxiv_id)}"
    try:
        body = http_get(url)
    except urllib.error.URLError as exc:
        return {"__error__": f"arXiv HTTP error: {exc}"}

    try:
        root = ET.fromstring(body)
    except ET.ParseError as exc:
        return {"__error__": f"arXiv returned malformed XML: {exc}"}

    ns = {"a": "http://www.w3.org/2005/Atom"}
    entry = root.find("a:entry", ns)
    if entry is None:
        return None

    title_el = entry.find("a:title", ns)
    title = (title_el.text or "").strip().replace("\n", " ").replace("  ", " ").rstrip(".") if title_el is not None else ""

    author_els = entry.findall("a:author/a:name", ns)
    first_author_name = (author_els[0].text or "").strip() if author_els else ""
    # arXiv author names are "First Middle Last"; surname is last token.
    first_author_surname = first_author_name.split(" ")[-1] if first_author_name else ""

    published_el = entry.find("a:published", ns)
    year = None
    if published_el is not None and published_el.text:
        m = re.match(r"(\d{4})-", published_el.text)
        if m:
            year = int(m.group(1))

    return {
        "title": title,
        "first_author_surname": first_author_surname,
        "container_title": "arXiv",
        "year": year,
        "source": "arXiv API",
    }


# ── Comparison ──────────────────────────────────────────────────────


def normalize_title(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    s = re.sub(r"[\u2010-\u2015\u2212]", "-", s)  # normalize dashes
    s = re.sub(r"[^a-z0-9\s\-:]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def title_similar(claimed: str, canonical: str) -> float:
    a = normalize_title(claimed)
    b = normalize_title(canonical)
    if not a or not b:
        return 0.0
    if a in b or b in a:
        return 1.0
    return SequenceMatcher(None, a, b).ratio()


def container_similar(claimed: str, canonical: str) -> float:
    a = normalize_title(claimed)
    b = normalize_title(canonical)
    if not a or not b:
        return 0.0
    # Journal abbreviations: if the claimed string's word prefixes all
    # appear in canonical, treat as match (e.g. "Mayo Clin Proc Digit
    # Health" vs "Mayo Clinic Proceedings: Digital Health").
    a_tokens = [t[:4] for t in a.split() if t]
    b_text = b
    if a_tokens and all(t in b_text for t in a_tokens):
        return 1.0
    if a in b or b in a:
        return 1.0
    return SequenceMatcher(None, a, b).ratio()


def surnames_equal(claimed: str, canonical: str) -> bool:
    a = (claimed or "").strip().lower()
    b = (canonical or "").strip().lower()
    if not a or not b:
        return False
    # Handle multi-word surnames (e.g. "Zunzunegui Sanz") and accent
    # variations by ignoring diacritics roughly.
    def strip_accents(s: str) -> str:
        import unicodedata
        return "".join(
            c for c in unicodedata.normalize("NFD", s)
            if unicodedata.category(c) != "Mn"
        )
    a_norm = strip_accents(a)
    b_norm = strip_accents(b)
    return a_norm == b_norm or a_norm in b_norm or b_norm in a_norm


# ── Per-citation verification ───────────────────────────────────────


@dataclass
class FieldResult:
    field: str
    claimed: Any
    canonical: Any
    matches: bool
    similarity: float | None = None


@dataclass
class CitationResult:
    key: str
    identifier_type: str
    identifier_value: str
    status: str  # resolved_match, resolved_mismatch, unresolved
    canonical: dict[str, Any] | None
    fields: list[FieldResult] = field(default_factory=list)
    error: str | None = None


def verify_one(citation: dict[str, Any]) -> CitationResult:
    key = citation["key"]
    ids = citation.get("identifiers", {})
    claimed = citation.get("claimed_metadata", {})

    # Prefer DOI > PMID > arXiv when multiple identifiers are present:
    # DOI returns the richest metadata.
    if ids.get("doi"):
        identifier_type = "doi"
        identifier_value = ids["doi"]
        time.sleep(CROSSREF_SLEEP_S)
        canonical = resolve_doi(identifier_value)
    elif ids.get("pmid"):
        identifier_type = "pmid"
        identifier_value = ids["pmid"]
        time.sleep(NCBI_SLEEP_S)
        canonical = resolve_pmid(identifier_value)
    elif ids.get("arxiv_id"):
        identifier_type = "arxiv_id"
        identifier_value = ids["arxiv_id"]
        time.sleep(ARXIV_SLEEP_S)
        canonical = resolve_arxiv(identifier_value)
    else:
        return CitationResult(
            key=key,
            identifier_type="none",
            identifier_value="",
            status="unresolved",
            canonical=None,
            error="No identifier (doi, pmid, or arxiv_id) in manifest entry",
        )

    if canonical is None:
        return CitationResult(
            key=key,
            identifier_type=identifier_type,
            identifier_value=identifier_value,
            status="unresolved",
            canonical=None,
            error=f"{identifier_type.upper()} {identifier_value} did not resolve",
        )

    if "__error__" in canonical:
        return CitationResult(
            key=key,
            identifier_type=identifier_type,
            identifier_value=identifier_value,
            status="unresolved",
            canonical=None,
            error=canonical["__error__"],
        )

    fields: list[FieldResult] = []

    title_sim = title_similar(claimed.get("title", ""), canonical.get("title", ""))
    fields.append(FieldResult(
        field="title",
        claimed=claimed.get("title", ""),
        canonical=canonical.get("title", ""),
        matches=title_sim >= TITLE_SIMILARITY_THRESHOLD,
        similarity=round(title_sim, 3),
    ))

    fields.append(FieldResult(
        field="first_author_surname",
        claimed=claimed.get("first_author_surname", ""),
        canonical=canonical.get("first_author_surname", ""),
        matches=surnames_equal(
            claimed.get("first_author_surname", ""),
            canonical.get("first_author_surname", ""),
        ),
    ))

    container_sim = container_similar(
        claimed.get("container_title", ""), canonical.get("container_title", "")
    )
    fields.append(FieldResult(
        field="container_title",
        claimed=claimed.get("container_title", ""),
        canonical=canonical.get("container_title", ""),
        matches=container_sim >= CONTAINER_SIMILARITY_THRESHOLD,
        similarity=round(container_sim, 3),
    ))

    # Year tolerance: accept a 1-year delta. Crossref typically returns
    # the epub year while site citations and methods PDF use the journal
    # issue year, which frequently differs by exactly 1. A 2-year gap
    # is real evidence of a wrong identifier and must fail.
    claimed_year = claimed.get("year")
    canonical_year = canonical.get("year")
    year_matches = (
        claimed_year is not None
        and canonical_year is not None
        and abs(int(claimed_year) - int(canonical_year)) <= 1
    )
    fields.append(FieldResult(
        field="year",
        claimed=claimed_year,
        canonical=canonical_year,
        matches=year_matches,
    ))

    status = "resolved_match" if all(f.matches for f in fields) else "resolved_mismatch"
    return CitationResult(
        key=key,
        identifier_type=identifier_type,
        identifier_value=identifier_value,
        status=status,
        canonical=canonical,
        fields=fields,
    )


# ── Reporting ───────────────────────────────────────────────────────


def print_summary(results: list[CitationResult]) -> None:
    n_total = len(results)
    n_match = sum(1 for r in results if r.status == "resolved_match")
    n_mismatch = sum(1 for r in results if r.status == "resolved_mismatch")
    n_unresolved = sum(1 for r in results if r.status == "unresolved")

    print()
    print("=" * 64)
    print("Whel Path C Phase 1 · citation verification report")
    print("=" * 64)
    print(f"Total entries:         {n_total}")
    print(f"Resolved + match:      {n_match}   (safe to publish)")
    print(f"Resolved + mismatch:   {n_mismatch}   (manifest claims need review)")
    print(f"Unresolved:            {n_unresolved}   (identifier invalid or missing)")
    print()

    if n_mismatch:
        print("Mismatches in detail:")
        for r in results:
            if r.status != "resolved_mismatch":
                continue
            print(f"  {r.key} ({r.identifier_type}: {r.identifier_value})")
            for f in r.fields:
                if f.matches:
                    continue
                print(f"    {f.field}:")
                print(f"      claimed:   {f.claimed!r}")
                print(f"      canonical: {f.canonical!r}")
                if f.similarity is not None:
                    print(f"      similarity: {f.similarity}")
        print()

    if n_unresolved:
        print("Unresolved entries:")
        for r in results:
            if r.status != "unresolved":
                continue
            print(f"  {r.key} ({r.identifier_type}: {r.identifier_value}) — {r.error}")
        print()


def write_report(results: list[CitationResult]) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "summary": {
            "total": len(results),
            "resolved_match": sum(1 for r in results if r.status == "resolved_match"),
            "resolved_mismatch": sum(1 for r in results if r.status == "resolved_mismatch"),
            "unresolved": sum(1 for r in results if r.status == "unresolved"),
        },
        "results": [
            {
                "key": r.key,
                "identifier_type": r.identifier_type,
                "identifier_value": r.identifier_value,
                "status": r.status,
                "canonical": r.canonical,
                "fields": [asdict(f) for f in r.fields],
                "error": r.error,
            }
            for r in results
        ],
    }
    REPORT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    SNAPSHOT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote {REPORT_PATH.relative_to(REPO)}")
    print(f"wrote {SNAPSHOT_PATH.relative_to(REPO)}")


# ── Main ────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with non-zero status if any entry is mismatch or unresolved. "
             "Use this in CI / pre-publish hooks.",
    )
    args = parser.parse_args()

    if not MANIFEST_PATH.exists():
        print(f"manifest not found at {MANIFEST_PATH}", file=sys.stderr)
        return 2

    manifest = json.loads(MANIFEST_PATH.read_text())
    citations = manifest.get("citations", [])
    if not citations:
        print("manifest contains no citations", file=sys.stderr)
        return 2

    print(f"verifying {len(citations)} citation(s) against canonical sources…")
    results: list[CitationResult] = []
    for c in citations:
        print(f"  · {c['key']}", flush=True)
        results.append(verify_one(c))

    print_summary(results)
    write_report(results)

    if args.strict and any(r.status != "resolved_match" for r in results):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
