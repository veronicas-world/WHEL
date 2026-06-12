"""Substrate source validation (Path C, citation validation — substrate edition).

Mirrors scripts/verify-citations.py for the substrate: for every document, resolve
its PMID against NCBI E-utilities and compare the returned canonical title to the
stored title. This is the citation-validation / anti-hallucination guard the roadmap
calls for ("citation validation against NCBI E-utilities"; "make every citation
reproduce the count it claims") applied to the substrate's source layer.

Three outcomes per document, matching the legacy verifier's vocabulary:
    resolved_match     PMID resolves AND title matches within tolerance
    resolved_mismatch  PMID resolves but the stored title does not match
    unresolved         PMID returns nothing or an HTTP error

No LLM calls. Stdlib only.
"""
import time
import json
import ssl
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from difflib import SequenceMatcher
from datetime import datetime, timezone

from config import USER_AGENT

_CTX = ssl.create_default_context()
_EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
NCBI_SLEEP_S = 0.4
TITLE_SIMILARITY_THRESHOLD = 0.85


def _norm(s: str) -> str:
    return " ".join((s or "").lower().split()).rstrip(".")


def resolve_pmid_title(pmid: str):
    """Return the canonical PubMed title for a PMID, or None."""
    url = f"{_EUTILS}/efetch.fcgi?db=pubmed&id={urllib.parse.quote(pmid)}&retmode=xml"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=25, context=_CTX) as r:
            body = r.read()
    except (urllib.error.URLError, TimeoutError):
        return None
    try:
        root = ET.fromstring(body)
    except ET.ParseError:
        return None
    el = root.find(".//ArticleTitle")
    if el is None:
        return None
    return "".join(el.itertext()).strip() or None


def validate(documents):
    """documents: list of dicts with id, external_id (PMID), title.
    Returns list of result dicts."""
    results = []
    counts = {"resolved_match": 0, "resolved_mismatch": 0, "unresolved": 0}
    for d in documents:
        pmid = (d.get("external_id") or "").strip()
        stored = d.get("title") or ""
        canonical = resolve_pmid_title(pmid) if pmid else None
        time.sleep(NCBI_SLEEP_S)
        if not canonical:
            status, sim = "unresolved", 0.0
        else:
            sim = SequenceMatcher(None, _norm(stored), _norm(canonical)).ratio()
            status = "resolved_match" if sim >= TITLE_SIMILARITY_THRESHOLD else "resolved_mismatch"
        counts[status] += 1
        results.append({
            "id": d["id"], "pmid": pmid, "status": status,
            "title_similarity": round(sim, 3),
            "canonical_title": canonical,
            "checked_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        })
        print(f"  {status:18} sim={sim:.2f}  PMID {pmid}  {stored[:50]}")
    print(f"  source validation: {counts}")
    return results


if __name__ == "__main__":
    import sb
    docs = sb.get("documents?select=id,external_id,title")
    print(json.dumps(validate(docs), indent=2))
