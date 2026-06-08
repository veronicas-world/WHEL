#!/usr/bin/env python3
"""
verify-summary-grounding.py
=============================

Whel Path C Phase 2a · sentence-level summary grounding.

PURPOSE
-------
For every free-text source row (source_type in {'pubmed',
'clinical_trial', 'reddit'}), splits the LLM-generated finding text
(sources.key_finding_excerpt) into sentences, fetches the canonical
source text (PubMed abstract, ClinicalTrials.gov briefSummary, or
Reddit post body + top comments), embeds both sides with
Sentence-BERT, and computes per-sentence cosine similarity. Sentences
that fall below a calibrated threshold are flagged as 'not directly
supported by the source.'

Phase 2a is the right mechanism for free-text source types. Phase 2b
(scripts/verify-structured-sources.py) handles structured source
types (FDA AEMS reaction counts and Open Targets drug-target-disease
records) via field-by-field verification rather than semantic
similarity.

THRESHOLD AND CALIBRATION
-------------------------
Phase 2a v0.1 uses a calibrated-by-default threshold of 0.40 cosine
similarity. This is a pragmatic baseline that flags sentences with
weak semantic overlap to the canonical source. Threshold tuning
against a human-labeled validation set is recorded on the Roadmap
under "Path C Phase 2 threshold calibration."

MODEL
-----
all-MiniLM-L6-v2 from sentence-transformers. ~80 MB model file,
fast inference on CPU, good general-purpose baseline. Domain-specific
biomedical models (PubMedBERT-NLI, SapBERT) would likely improve
recall on clinical phrasing; tracked as a Roadmap follow-on.

DEPENDENCIES
------------
    pip install sentence-transformers
    (pulls torch + transformers + numpy; ~1 GB total)

Add --break-system-packages on macOS / Linux if pip refuses.

USAGE
-----
Run scripts/export-sources-for-audit.py first to refresh
lib/sources-audit-snapshot.json with the LLM-generated text
fields (key_finding_excerpt, primary_endpoint_text), commit the
snapshot, then:

    python3 scripts/verify-summary-grounding.py
    python3 scripts/verify-summary-grounding.py --limit 30      # smoke test
    python3 scripts/verify-summary-grounding.py --strict        # CI gate

OUTPUT
------
    scripts/audit-output/summary-grounding-report.json   full report
    lib/summary-grounding-audit-snapshot.json            site sidecar

The site sidecar follows the existing
lib/citation-audit-snapshot.json / lib/matrix-audit-snapshot.json
pattern. The disclosure on /about/external-references 01d reads from
the sidecar and renders the score distribution + flagged-sentence
samples.

RUNTIME
-------
Roughly 10 to 15 minutes total against ~322 free-text sources, the
dominant cost being Reddit's polite-use rate limit (Reddit JSON
endpoint accepts ~1 request per 2 seconds).
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
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
SNAPSHOT_PATH = REPO / "lib" / "sources-audit-snapshot.json"
REPORT_PATH = REPO / "scripts" / "audit-output" / "summary-grounding-report.json"
SIDECAR_PATH = REPO / "lib" / "summary-grounding-audit-snapshot.json"

# Default threshold. Sentences with max cosine similarity to the
# canonical source below this are flagged as "not directly supported
# by the source." Documented in the v3.12 methodology entry.
SIMILARITY_THRESHOLD = 0.40

# Rate-limit sleeps per source publisher. Polite-use values.
NCBI_SLEEP_S = 0.4
CTGOV_SLEEP_S = 0.3
REDDIT_SLEEP_S = 2.0

HTTP_HEADERS = {
    "User-Agent": "Whel-Path-C-Phase-2a/1.0 (https://rediscover-coral.vercel.app; mailto:vla2117@columbia.edu)"
}


def http_get(url: str, extra_headers: dict[str, str] | None = None, timeout: int = 25) -> bytes:
    headers = dict(HTTP_HEADERS)
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


# ── Canonical-source fetchers ───────────────────────────────────────


def fetch_pubmed_abstract(pmid: str) -> str | None:
    """NCBI E-utilities efetch returns the full abstract for a PMID
    as XML. Returns the concatenated abstract text or None on
    failure / missing abstract."""
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
    abstract = " ".join(p for p in parts if p).strip()
    return abstract or None


def fetch_ctgov_description(nct_id: str) -> str | None:
    """ClinicalTrials.gov API v2 returns briefSummary and
    detailedDescription. We concatenate both as the canonical
    'abstract-equivalent' source text."""
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
    combined = (brief + " " + detailed).strip()
    return combined or None


REDDIT_URL_RE = re.compile(
    r"^https?://(?:www\.|old\.|np\.)?reddit\.com/r/([^/]+)/comments/([a-z0-9]+)/?",
    re.IGNORECASE,
)


def fetch_reddit_post(url: str) -> str | None:
    """Reddit's public JSON endpoint at .json returns the post body
    and top comments. Returns concatenated text or None if the post
    is gone / deleted / private."""
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
    # data[0] is the post listing; data[1] is the comment tree.
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
    # Pull the top 5 comments as additional context.
    try:
        comments = data[1]["data"]["children"]
        kept = 0
        for c in comments:
            if c.get("kind") != "t1":
                continue
            cdata = c.get("data") or {}
            body_text = (cdata.get("body") or "").strip()
            if body_text and body_text not in ("[deleted]", "[removed]"):
                parts.append(body_text)
                kept += 1
                if kept >= 5:
                    break
    except (KeyError, IndexError, TypeError):
        pass
    combined = " ".join(parts).strip()
    return combined or None


# ── Sentence splitting and embedding ────────────────────────────────


SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\(])")


def split_sentences(text: str) -> list[str]:
    """Lightweight sentence splitter. Splits on '. ', '! ', '? '
    followed by an uppercase letter or opening parenthesis. Good
    enough for clinical and informal-forum prose without requiring
    an nltk download."""
    if not text:
        return []
    text = re.sub(r"\s+", " ", text).strip()
    parts = SENTENCE_SPLIT_RE.split(text)
    return [p.strip() for p in parts if p.strip()]


# ── Per-source verification ─────────────────────────────────────────


@dataclass
class SourceResult:
    source_id: str
    signal_id: str
    source_type: str
    external_id: str
    status: str  # grounded, partially_grounded, ungrounded, unresolved, skipped
    n_sentences: int = 0
    min_score: float | None = None
    mean_score: float | None = None
    max_score: float | None = None
    flagged_count: int = 0
    flagged_examples: list[dict[str, Any]] = field(default_factory=list)
    error: str | None = None
    note: str = ""


def verify_one(
    row: dict[str, Any],
    model: Any,
) -> SourceResult:
    """Compute summary grounding for a single source row. Branches
    on source_type to dispatch to the right canonical fetcher."""
    import numpy as np  # lazy import keeps the top of the file portable
    stype = (row.get("source_type") or "").strip().lower()
    base = SourceResult(
        source_id=str(row.get("id") or ""),
        signal_id=str(row.get("signal_id") or ""),
        source_type=stype,
        external_id=(row.get("external_id") or "").strip(),
        status="skipped",
    )

    excerpt = (row.get("key_finding_excerpt") or "").strip()
    if not excerpt:
        base.error = "source row has empty key_finding_excerpt; nothing to ground"
        base.status = "skipped"
        return base

    # Dispatch to the right fetcher.
    if stype == "pubmed":
        time.sleep(NCBI_SLEEP_S)
        canonical = fetch_pubmed_abstract(base.external_id)
        publisher = "NCBI E-utilities efetch"
    elif stype in ("clinical_trial", "clinical_trial_finding"):
        time.sleep(CTGOV_SLEEP_S)
        canonical = fetch_ctgov_description(base.external_id)
        publisher = "ClinicalTrials.gov API v2"
    elif stype == "reddit":
        time.sleep(REDDIT_SLEEP_S)
        canonical = fetch_reddit_post(row.get("url") or "")
        publisher = "Reddit public JSON endpoint"
    else:
        base.error = f"source_type {stype!r} is not free-text; Phase 2b handles structured sources"
        base.status = "skipped"
        return base

    if not canonical:
        base.error = f"canonical source text could not be fetched from {publisher}"
        base.status = "unresolved"
        return base

    summary_sentences = split_sentences(excerpt)
    canonical_sentences = split_sentences(canonical)
    if not summary_sentences:
        base.error = "no sentences extracted from key_finding_excerpt"
        base.status = "skipped"
        return base
    if not canonical_sentences:
        base.error = "no sentences extracted from canonical source text"
        base.status = "unresolved"
        return base

    # Embed both sides and compute per-summary-sentence max cosine
    # similarity against any canonical sentence.
    summary_embeds = model.encode(summary_sentences, convert_to_numpy=True, normalize_embeddings=True)
    canonical_embeds = model.encode(canonical_sentences, convert_to_numpy=True, normalize_embeddings=True)
    similarities = summary_embeds @ canonical_embeds.T  # cosine since normalized
    max_per_summary = similarities.max(axis=1)

    base.n_sentences = len(summary_sentences)
    base.min_score = float(max_per_summary.min())
    base.mean_score = float(max_per_summary.mean())
    base.max_score = float(max_per_summary.max())

    flagged_examples: list[dict[str, Any]] = []
    flagged_count = 0
    for sentence, score in zip(summary_sentences, max_per_summary):
        score_val = float(score)
        if score_val < SIMILARITY_THRESHOLD:
            flagged_count += 1
            if len(flagged_examples) < 3:
                # Capture a small sample for the public disclosure; full
                # list lives in the JSON report.
                flagged_examples.append({
                    "summary_sentence": sentence,
                    "max_cosine": round(score_val, 3),
                })

    base.flagged_count = flagged_count

    if flagged_count == 0:
        base.status = "grounded"
    elif flagged_count < base.n_sentences:
        base.status = "partially_grounded"
        base.flagged_examples = flagged_examples
    else:
        base.status = "ungrounded"
        base.flagged_examples = flagged_examples
    return base


# ── Reporting ───────────────────────────────────────────────────────


def write_outputs(results: list[SourceResult]) -> None:
    counts: dict[str, int] = {}
    by_type: dict[str, dict[str, int]] = {}
    score_buckets: dict[str, int] = {
        "0.0-0.2": 0, "0.2-0.4": 0, "0.4-0.6": 0, "0.6-0.8": 0, "0.8-1.0": 0,
    }
    sentence_total = 0
    flagged_total = 0
    for r in results:
        counts[r.status] = counts.get(r.status, 0) + 1
        by_type.setdefault(r.source_type, {})
        by_type[r.source_type][r.status] = by_type[r.source_type].get(r.status, 0) + 1
        if r.mean_score is not None:
            s = r.mean_score
            if s < 0.2:
                score_buckets["0.0-0.2"] += 1
            elif s < 0.4:
                score_buckets["0.2-0.4"] += 1
            elif s < 0.6:
                score_buckets["0.4-0.6"] += 1
            elif s < 0.8:
                score_buckets["0.6-0.8"] += 1
            else:
                score_buckets["0.8-1.0"] += 1
        sentence_total += r.n_sentences
        flagged_total += r.flagged_count

    payload = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "status": "ready",
        "model": "all-MiniLM-L6-v2",
        "similarity_threshold": SIMILARITY_THRESHOLD,
        "summary": {
            "total": len(results),
            "by_status": counts,
            "by_source_type": {k: dict(sorted(v.items())) for k, v in by_type.items()},
            "sentence_total": sentence_total,
            "sentences_flagged": flagged_total,
            "sentence_flag_rate": round(flagged_total / sentence_total, 4) if sentence_total else 0,
            "mean_score_distribution": score_buckets,
        },
        "results": [asdict(r) for r in results],
    }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    SIDECAR_PATH.write_text(json.dumps(payload, indent=2) + "\n")

    print()
    print("=" * 64)
    print("Whel Path C Phase 2a · summary-grounding audit report")
    print("=" * 64)
    print(f"Model:                       all-MiniLM-L6-v2")
    print(f"Similarity threshold:        {SIMILARITY_THRESHOLD}")
    print(f"Total source rows audited:   {len(results)}")
    print(f"Total summary sentences:     {sentence_total}")
    flag_pct = f" ({flagged_total / sentence_total * 100:.1f}%)" if sentence_total else ""
    print(f"Sentences flagged:           {flagged_total}{flag_pct}")
    print()
    for status, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {status:24s} {n}")
    print()
    print("Mean-score distribution (rows):")
    for bucket, n in score_buckets.items():
        print(f"  {bucket:10s} {n}")
    print()
    print(f"wrote {REPORT_PATH.relative_to(REPO)}")
    print(f"wrote {SIDECAR_PATH.relative_to(REPO)}")


# ── Main ────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=None,
                        help="Audit only the first N free-text rows. Default: all.")
    parser.add_argument("--strict", action="store_true",
                        help="Exit non-zero if any row is unresolved or has flagged sentences.")
    args = parser.parse_args()

    if not SNAPSHOT_PATH.exists():
        print(f"snapshot not found at {SNAPSHOT_PATH}\n"
              "Run scripts/export-sources-for-audit.py first.",
              file=sys.stderr)
        return 2

    snapshot = json.loads(SNAPSHOT_PATH.read_text())
    all_sources = snapshot.get("sources", [])
    free_text_types = {"pubmed", "clinical_trial", "clinical_trial_finding", "reddit"}
    sources = [s for s in all_sources if (s.get("source_type") or "").lower() in free_text_types]
    if args.limit:
        sources = sources[: args.limit]

    print(f"loading sentence-transformers (all-MiniLM-L6-v2)…")
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("\nERROR: sentence-transformers is not installed.\n"
              "Install with: pip install sentence-transformers\n"
              "(add --break-system-packages on macOS/Linux if pip refuses)",
              file=sys.stderr)
        return 2
    model = SentenceTransformer("all-MiniLM-L6-v2")

    print(f"auditing {len(sources)} free-text source row(s)…")
    results: list[SourceResult] = []
    for i, row in enumerate(sources, start=1):
        if i % 25 == 1:
            print(f"  · {i} / {len(sources)} …", flush=True)
        results.append(verify_one(row, model))

    write_outputs(results)

    if args.strict:
        bad = {"unresolved", "ungrounded", "partially_grounded"}
        if any(r.status in bad for r in results):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
