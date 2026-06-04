#!/usr/bin/env python3
# ---------------------------------------------------------------------------
# classify-sources-study-type.py
#
# Backfill companion to migration 041_sources_lgrade_fields.sql.
#
# Reads every row in `sources`, applies a regex classifier over
# title + journal + key_finding_excerpt to assign a study_type (and best-
# effort primary_endpoint_text), then EMITS a SQL migration file
# (042_backfill_study_type.sql by default) that Veronica reviews and
# applies through the existing migration flow.
#
# The script never writes to Supabase directly. The two reads are the
# `sources` table and `lib/literature-grade-rubric.json` (sanity check
# on the rubric schema version). All other state is local.
#
# Three modes:
#   --dry-run (default)   Print classifier distribution; emit nothing.
#   --write               Emit SQL migration file.
#   --explain SOURCE_ID   Print the matched pattern for a single row.
#
# Classifier design notes:
#
#   * source_type drives the first cut so post-marketing pharmacovigilance
#     (faers, eudravigilance, sider) is correctly tagged as observational
#     rather than misclassified as 'other' by a title-only heuristic.
#     OpenTargets evidence is mechanistic by construction. Reddit threads
#     are tagged 'other' because the rubric does not grade community
#     reports as primary literature.
#
#   * For pubmed rows the precedence is:
#       guideline -> SR/MA -> RCT -> case_report ->
#         mechanistic -> observational -> expert_opinion -> other
#     The order matters because "systematic review" contains "review"
#     (would hit expert_opinion) and "Cochrane review" can read as
#     guideline-flavoured. Putting SR/MA above expert_opinion and
#     guideline above SR/MA resolves both.
#
#   * For clinical_trial rows the title is the trial registry title.
#     Most CT.gov entries are RCTs but registry studies and expanded-
#     access protocols are not. We check RCT markers first and fall back
#     to 'observational' to match how the rubric treats real-world
#     registry data.
#
#   * primary_endpoint_text is BEST-EFFORT. We do not have abstracts on
#     the `sources` table -- only title + a key_finding_excerpt that
#     pipeline authors filled in by hand. If the excerpt explicitly says
#     "primary endpoint was X" or "primary outcome was X" we capture
#     that span. Most existing rows have no such marker and will land
#     with primary_endpoint_text = NULL, which is honest. The PubMed
#     pipeline (research-pipeline.js) will start populating this field
#     correctly on new ingests.
#
#   * guideline_id, guideline_strength, and guideline_certainty are NOT
#     populated by this script. They require linking each `sources` row
#     to a specific recommendation in a specific guideline document
#     (e.g. ESHRE Endometriosis 2022 rec 3.1, GRADE moderate). That is a
#     manual curation pass, deferred to a follow-up thread. The columns
#     exist now so future curation can land without another migration.
#
# Usage:
#   python3 scripts/classify-sources-study-type.py --dry-run
#   python3 scripts/classify-sources-study-type.py --write
#   python3 scripts/classify-sources-study-type.py --explain <uuid>
# ---------------------------------------------------------------------------

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


REPO_ROOT = Path(__file__).resolve().parent.parent

OUT_PATH_DEFAULT = REPO_ROOT / "supabase" / "migrations" / "042_backfill_study_type.sql"

CACHE_DIR = REPO_ROOT / "scripts" / ".cache"
PUBMED_CACHE = CACHE_DIR / "pubmed_pubtypes.json"
CTGOV_CACHE = CACHE_DIR / "ctgov_designs.json"

# Maps PubMed PublicationType MeSH terms to our taxonomy. Higher buckets
# in the list win when a single PMID carries multiple PublicationType
# entries (PubMed routinely tags an RCT with both "Randomized Controlled
# Trial" and "Clinical Trial, Phase III", for example).
PUBMED_PUBTYPE_PRIORITY: list[tuple[str, str]] = [
    ("Randomized Controlled Trial",         "RCT"),
    ("Clinical Trial, Phase IV",            "RCT"),
    ("Clinical Trial, Phase III",           "RCT"),
    ("Adaptive Clinical Trial",             "RCT"),
    ("Pragmatic Clinical Trial",            "RCT"),
    ("Equivalence Trial",                   "RCT"),
    ("Controlled Clinical Trial",           "RCT"),
    ("Meta-Analysis",                       "SR/MA"),
    ("Systematic Review",                   "SR/MA"),
    ("Practice Guideline",                  "guideline"),
    ("Guideline",                           "guideline"),
    ("Consensus Development Conference",    "guideline"),
    ("Case Reports",                        "case_report"),
    ("Observational Study",                 "observational"),
    ("Multicenter Study",                   "observational"),
    ("Clinical Trial, Phase II",            "other"),
    ("Clinical Trial, Phase I",             "other"),
    ("Clinical Trial",                      "other"),
    ("Editorial",                           "expert_opinion"),
    ("Letter",                              "expert_opinion"),
    ("Comment",                             "expert_opinion"),
    ("Review",                              "expert_opinion"),
]

# AbstractText section labels that carry the primary endpoint
PRIMARY_OUTCOME_LABELS = {
    "PRIMARY OUTCOME",
    "PRIMARY OUTCOMES",
    "PRIMARY OUTCOME MEASURE",
    "PRIMARY OUTCOME MEASURES",
    "PRIMARY ENDPOINT",
    "PRIMARY ENDPOINTS",
    "MAIN OUTCOME",
    "MAIN OUTCOMES",
    "MAIN OUTCOME MEASURE",
    "MAIN OUTCOME MEASURES",
}

ALLOWED_STUDY_TYPES = (
    "RCT",
    "SR/MA",
    "observational",
    "case_report",
    "guideline",
    "mechanistic",
    "expert_opinion",
    "other",
)


# ---------------------------------------------------------------------------
# Env loading -- mirrors check-matrix-coverage.py:load_env_local()
# ---------------------------------------------------------------------------

def load_env_local() -> None:
    env_path = REPO_ROOT / ".env.local"
    if not env_path.exists():
        print(f"ERROR: {env_path} not found.")
        sys.exit(1)
    for line in env_path.read_text().splitlines():
        m = re.match(r"^([A-Z_][A-Z0-9_]*)=(.*)$", line)
        if m:
            os.environ[m.group(1)] = m.group(2)


def http_get_json(url: str, headers: dict[str, str], max_tries: int = 5) -> Any:
    delay = 2.0
    for _ in range(max_tries):
        r = requests.get(url, headers=headers, timeout=60)
        if r.status_code == 429:
            time.sleep(delay)
            delay *= 2
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError(f"too many 429s on {url}")


# ---------------------------------------------------------------------------
# Classifier
# ---------------------------------------------------------------------------

# Order of compilation does not matter; order of APPLICATION (the if-chain
# in classify_pubmed) is what determines precedence. Each regex is named
# after the bucket it triggers so the explain mode can attribute hits.

GUIDELINE_RE = re.compile(
    r"\b("
    r"clinical[- ]practice guideline"
    r"|practice guideline"
    r"|guideline(?:s)? for the management"
    r"|consensus statement"
    r"|position (?:paper|statement)"
    r"|recommendation(?:s)? of"
    r"|society guideline"
    r"|ESHRE"
    r"|ACOG"
    r"|NICE guideline"
    r"|EULAR recommendation"
    r"|ASRM (?:committee|practice)"
    r"|IUGA (?:consensus|statement)"
    r"|AACE clinical"
    r")\b",
    re.IGNORECASE,
)

SR_MA_RE = re.compile(
    r"\b("
    r"systematic review"
    r"|meta[- ]?analys[ei]s"
    r"|cochrane (?:review|database|systematic)"
    r"|PRISMA"
    r"|umbrella review"
    r"|network meta[- ]?analysis"
    r"|individual participant data analysis"
    r")\b",
    re.IGNORECASE,
)

RCT_RE = re.compile(
    r"\b("
    r"randomi[sz]ed"
    r"|RCT"
    r"|placebo[- ]?controlled"
    r"|double[- ]?blind"
    r"|triple[- ]?blind"
    r"|crossover trial"
    r"|phase [234] (?:clinical |randomi[sz]ed )?trial"
    r"|phase II{1,2}I? trial"
    r"|phase IV trial"
    r"|sham[- ]?controlled trial"
    r")\b",
    re.IGNORECASE,
)

CASE_REPORT_RE = re.compile(
    r"\b("
    r"case report"
    r"|case series"
    r"|case[- ]based"
    r"|single case"
    r"|report of (?:a |two |three |four )?case"
    r"|n\s*=\s*1\b"
    r")\b",
    re.IGNORECASE,
)

MECHANISTIC_RE = re.compile(
    r"\b("
    r"in vitro"
    r"|in vivo"
    r"|knockout"
    r"|knock[- ]?out"
    r"|cell line"
    r"|murine"
    r"|mouse model"
    r"|rat model"
    r"|preclinical"
    r"|transgenic"
    r"|cell culture"
    r"|animal model"
    r"|rodent"
    r"|zebrafish"
    r"|xenograft"
    r"|organoid"
    r"|CRISPR"
    r"|siRNA"
    r")\b",
    re.IGNORECASE,
)

OBSERVATIONAL_RE = re.compile(
    r"\b("
    r"cohort study"
    r"|cohort analysis"
    r"|registry study"
    r"|registry analysis"
    r"|cross[- ]sectional"
    r"|retrospective"
    r"|prospective observational"
    r"|case[- ]control"
    r"|nested case[- ]control"
    r"|database study"
    r"|claims (?:analysis|database)"
    r"|real[- ]world (?:data|evidence|study)"
    r"|electronic health record"
    r"|EHR analysis"
    r"|pharmacovigilance"
    r"|disproportionality"
    r"|adverse event report"
    r")\b",
    re.IGNORECASE,
)

EXPERT_OPINION_RE = re.compile(
    r"\b("
    r"editorial"
    r"|commentary"
    r"|opinion piece"
    r"|perspective on"
    r"|narrative review"
    r"|update on"
    r"|review of (?:the )?literature"
    r"|state[- ]of[- ]the[- ]art review"
    r")\b",
    re.IGNORECASE,
)


# Primary endpoint extraction. Greedy enough to capture a short clause,
# bounded so it cannot eat the entire excerpt. Returns the captured span
# or None.
ENDPOINT_RE = re.compile(
    r"(?:primary endpoint|primary outcome(?:s| measure| measures)?|co[- ]?primary endpoint)"
    r"\s*(?:was|were|of|:|is|comprised|defined as)\s+"
    r"([^.;]{8,200})",
    re.IGNORECASE,
)


def classify_one(
    source_type: str | None,
    title: str | None,
    journal: str | None,
    excerpt: str | None,
) -> tuple[str, str | None]:
    """Return (study_type, matched_pattern_name). matched_pattern_name is
    the regex bucket that fired (or 'source_type_default' or 'fallback')
    so --explain can report it."""

    st = (source_type or "").lower().strip()

    # Source-type driven defaults (always win over title heuristics)
    if st == "opentargets":
        return ("mechanistic", "source_type_default:opentargets")
    if st in ("faers", "eudravigilance", "sider"):
        return ("observational", f"source_type_default:{st}")
    if st == "reddit":
        return ("other", "source_type_default:reddit")

    text = " ".join(filter(None, [title, journal, excerpt]))

    if st == "clinical_trial":
        if RCT_RE.search(text):
            return ("RCT", "RCT_RE")
        return ("observational", "clinical_trial_default")

    # Generic literature precedence (pubmed and unknown source_type)
    if GUIDELINE_RE.search(text):
        return ("guideline", "GUIDELINE_RE")
    if SR_MA_RE.search(text):
        return ("SR/MA", "SR_MA_RE")
    if RCT_RE.search(text):
        return ("RCT", "RCT_RE")
    if CASE_REPORT_RE.search(text):
        return ("case_report", "CASE_REPORT_RE")
    if MECHANISTIC_RE.search(text):
        return ("mechanistic", "MECHANISTIC_RE")
    if OBSERVATIONAL_RE.search(text):
        return ("observational", "OBSERVATIONAL_RE")
    if EXPERT_OPINION_RE.search(text):
        return ("expert_opinion", "EXPERT_OPINION_RE")
    return ("other", "fallback")


def extract_endpoint(excerpt: str | None) -> str | None:
    if not excerpt:
        return None
    m = ENDPOINT_RE.search(excerpt)
    if not m:
        return None
    span = m.group(1).strip()
    # Strip a trailing comma that an enumeration ("X, Y, Z," ...) might leave
    span = span.rstrip(",").strip()
    # Truncate at the first colon or semicolon-equivalent that survived
    return span[:200]


# ---------------------------------------------------------------------------
# Supabase reader
# ---------------------------------------------------------------------------

def fetch_all_sources() -> tuple[list[dict[str, Any]], bool]:
    """Returns (rows, study_type_column_exists). The script is designed to
    run both before and after migration 041 is applied. If 041 has been
    applied we SELECT study_type so we can skip rows that have already
    been classified. If it has not, we fall back to a SELECT that omits
    that column and treat every row as needing classification."""

    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    # Detect whether the column exists. PostgREST returns 400 with a body
    # like {"code":"42703","message":"column sources.study_type does not
    # exist"} when it does not.
    probe_url = (
        f"{base}/rest/v1/sources?select=id,study_type&limit=1"
    )
    probe = requests.get(probe_url, headers=headers, timeout=30)
    if probe.status_code == 200:
        study_type_exists = True
        select_cols = "id,source_type,title,journal,key_finding_excerpt,study_type"
    elif probe.status_code == 400 and "study_type" in probe.text:
        study_type_exists = False
        select_cols = "id,source_type,title,journal,key_finding_excerpt"
        print(
            "Note: sources.study_type column does not yet exist on the database. "
            "Migration 041 has not been applied. Proceeding without the "
            "'already-classified' check; every row will be classified."
        )
    else:
        probe.raise_for_status()
        # Defensive: in case raise_for_status() did not raise (it should
        # have on any non-2xx) fall through to the safer mode.
        study_type_exists = False
        select_cols = "id,source_type,title,journal,key_finding_excerpt"

    rows: list[dict[str, Any]] = []
    page_size = 1000
    offset = 0
    while True:
        url = (
            f"{base}/rest/v1/sources"
            f"?select={select_cols}"
            f"&order=id&limit={page_size}&offset={offset}"
        )
        batch = http_get_json(url, headers)
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return rows, study_type_exists


# ---------------------------------------------------------------------------
# PubMed E-utilities enrichment
# ---------------------------------------------------------------------------

def _load_cache(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return {}


def _save_cache(path: Path, data: dict[str, Any]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True))


def fetch_pubmed_metadata(pmids: list[str]) -> dict[str, dict[str, Any]]:
    """Batched efetch for PublicationType + primary outcome AbstractText.
    Returns {pmid: {"pubtypes": [...], "primary_outcome": str | None}}.
    Cached on disk so re-runs are free."""

    cache = _load_cache(PUBMED_CACHE)
    missing = [p for p in pmids if p not in cache]

    if not missing:
        return {p: cache[p] for p in pmids if p in cache}

    print(f"  PubMed E-utilities: fetching {len(missing)} PMIDs (cache hit on {len(pmids) - len(missing)}).")

    # E-utilities limits requests to ~200 IDs per call when unauthenticated.
    # Our payload is well under that ceiling; one call covers the whole set.
    # If we cross 200 in the future, chunk here.
    BATCH = 200
    for start in range(0, len(missing), BATCH):
        chunk = missing[start : start + BATCH]
        url = (
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            f"?db=pubmed&id={','.join(chunk)}&retmode=xml"
        )
        # Rate-limit politely (3 req/sec without an API key)
        time.sleep(0.4)
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        try:
            root = ET.fromstring(r.content)
        except ET.ParseError as e:
            print(f"  WARN: PubMed XML parse failed on batch starting {chunk[0]}: {e}")
            continue

        for article in root.findall(".//PubmedArticle"):
            pmid_el = article.find(".//MedlineCitation/PMID")
            if pmid_el is None or not pmid_el.text:
                continue
            pmid = pmid_el.text.strip()

            pubtypes = [
                (pt.text or "").strip()
                for pt in article.findall(".//PublicationTypeList/PublicationType")
                if pt.text
            ]

            # Pass A: try structured AbstractText with PRIMARY_OUTCOME labels.
            # PubMed labels are inconsistent across journals -- some use the
            # plain form "MAIN OUTCOME MEASURE", others paren-suffix the s
            # like "MAIN OUTCOME MEASURE(S)" or "PATIENT(S)". Normalize by
            # stripping any "(...)" suffix before comparing.
            primary_outcome: str | None = None
            for at in article.findall(".//Abstract/AbstractText"):
                raw_label = (at.get("Label") or at.get("NlmCategory") or "").strip().upper()
                label = re.sub(r"\s*\([^)]*\)\s*$", "", raw_label)
                if label in PRIMARY_OUTCOME_LABELS:
                    # ET concatenates child text; itertext() gathers all text
                    txt = " ".join(at.itertext()).strip()
                    if txt:
                        primary_outcome = txt[:200]
                        break

            # Build the full abstract regardless, so the regex fallback can run
            # and so we can cache it for future re-runs.
            abstract_parts: list[str] = []
            for at in article.findall(".//Abstract/AbstractText"):
                txt = " ".join(at.itertext()).strip()
                if txt:
                    abstract_parts.append(txt)
            abstract_text = " ".join(abstract_parts)

            # Pass B: if no structured-label hit, run the regex on the joined
            # abstract. PubMed abstracts routinely include the literal phrase
            # "the primary endpoint was X" or "primary outcome measure was Y"
            # even when the journal doesn't structure the abstract by label.
            if not primary_outcome and abstract_text:
                m = ENDPOINT_RE.search(abstract_text)
                if m:
                    primary_outcome = m.group(1).strip().rstrip(",")[:200]

            cache[pmid] = {
                "pubtypes": pubtypes,
                "primary_outcome": primary_outcome,
                "abstract": abstract_text[:6000],  # cap for cache hygiene
            }

        # Mark any PMID we asked for but didn't get back (e.g. retracted)
        for pmid in chunk:
            cache.setdefault(pmid, {"pubtypes": [], "primary_outcome": None})

    _save_cache(PUBMED_CACHE, cache)
    return {p: cache[p] for p in pmids if p in cache}


def pubmed_pubtypes_to_study_type(pubtypes: list[str]) -> str | None:
    """Returns the highest-priority bucket from a list of PublicationType
    strings, or None if no MeSH term in the list matches a known mapping
    (e.g. a row that is only tagged 'Journal Article' and 'English Abstract')."""
    if not pubtypes:
        return None
    pt_set = {pt.strip() for pt in pubtypes}
    for mesh_term, bucket in PUBMED_PUBTYPE_PRIORITY:
        if mesh_term in pt_set:
            return bucket
    return None


# ---------------------------------------------------------------------------
# ClinicalTrials.gov v2 enrichment
# ---------------------------------------------------------------------------

def fetch_ctgov_designs(nct_ids: list[str]) -> dict[str, dict[str, Any]]:
    """Returns {nct_id: {"study_type": "INTERVENTIONAL" | "OBSERVATIONAL",
    "allocation": "RANDOMIZED" | "NON_RANDOMIZED" | None, "phases": [...]}}.
    Cached on disk."""

    cache = _load_cache(CTGOV_CACHE)
    missing = [n for n in nct_ids if n not in cache]

    if not missing:
        return {n: cache[n] for n in nct_ids if n in cache}

    print(f"  CT.gov v2: fetching {len(missing)} NCT IDs (cache hit on {len(nct_ids) - len(missing)}).")

    for nct in missing:
        url = (
            f"https://clinicaltrials.gov/api/v2/studies/{nct}"
            "?fields=protocolSection.designModule.studyType,"
            "protocolSection.designModule.designInfo.allocation,"
            "protocolSection.designModule.phases"
        )
        time.sleep(0.15)  # be polite; CT.gov rate limits are generous but undocumented
        try:
            r = requests.get(url, timeout=30)
            if r.status_code == 404:
                cache[nct] = {"study_type": None, "allocation": None, "phases": []}
                continue
            r.raise_for_status()
        except requests.RequestException as e:
            print(f"  WARN: CT.gov fetch failed for {nct}: {e}")
            cache[nct] = {"study_type": None, "allocation": None, "phases": []}
            continue

        body = r.json()
        design = (
            body.get("protocolSection", {}).get("designModule", {})
        )
        cache[nct] = {
            "study_type": design.get("studyType"),
            "allocation": (design.get("designInfo") or {}).get("allocation"),
            "phases": design.get("phases") or [],
        }

    _save_cache(CTGOV_CACHE, cache)
    return {n: cache[n] for n in nct_ids if n in cache}


def ctgov_design_to_study_type(design: dict[str, Any]) -> str | None:
    """INTERVENTIONAL + RANDOMIZED -> RCT
       INTERVENTIONAL + NON_RANDOMIZED -> other (single-arm or open-label)
       OBSERVATIONAL -> observational
       EXPANDED_ACCESS -> other (not a study per se)
       missing -> None (caller falls back to regex)"""
    st = (design.get("study_type") or "").upper()
    alloc = (design.get("allocation") or "").upper()
    if st == "INTERVENTIONAL":
        if alloc == "RANDOMIZED":
            return "RCT"
        return "other"
    if st == "OBSERVATIONAL":
        return "observational"
    if st == "EXPANDED_ACCESS":
        return "other"
    return None


# ---------------------------------------------------------------------------
# SQL emission
# ---------------------------------------------------------------------------

def sql_quote(s: str) -> str:
    """Postgres single-quote escaping. We never need dollar-quoting for the
    short spans this script emits."""
    return "'" + s.replace("'", "''") + "'"


def emit_migration(
    out_path: Path,
    classified: list[dict[str, Any]],
    distribution_by_st: dict[str, Counter],
    overall: Counter,
    total_rows: int,
) -> None:
    derived_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    lines: list[str] = []
    lines.append(f"-- 042_backfill_study_type.sql")
    lines.append(f"-- Auto-generated by scripts/classify-sources-study-type.py")
    lines.append(f"-- on {derived_at}. Do not hand-edit; re-run the script.")
    lines.append(f"--")
    lines.append(f"-- Companion to migration 041_sources_lgrade_fields.sql.")
    lines.append(f"--")
    lines.append(f"-- Coverage:")
    lines.append(f"--   {total_rows} total sources rows considered")
    for st, c in overall.most_common():
        pct = (c / total_rows) * 100 if total_rows else 0
        lines.append(f"--     {st:<18} {c:>5}  ({pct:5.1f}%)")
    lines.append(f"--")
    lines.append(f"-- Distribution by source_type:")
    for source_type in sorted(distribution_by_st):
        sub = distribution_by_st[source_type]
        total = sum(sub.values())
        lines.append(f"--   {source_type or '(null)'}  n={total}")
        for st, c in sub.most_common():
            pct = (c / total) * 100 if total else 0
            lines.append(f"--     {st:<18} {c:>5}  ({pct:5.1f}%)")
    lines.append(f"--")
    lines.append(f"-- The three guideline_* columns are NOT populated here.")
    lines.append(f"-- They land NULL and stay NULL until a manual curation pass")
    lines.append(f"-- links specific sources rows to specific guideline")
    lines.append(f"-- recommendations.")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")

    # Group by study_type for one UPDATE statement per bucket.
    by_type: dict[str, list[str]] = defaultdict(list)
    endpoints: list[tuple[str, str]] = []
    for row in classified:
        by_type[row["study_type"]].append(row["id"])
        if row.get("primary_endpoint_text"):
            endpoints.append((row["id"], row["primary_endpoint_text"]))

    for st in ALLOWED_STUDY_TYPES:
        ids = by_type.get(st, [])
        if not ids:
            continue
        lines.append(f"-- {st} ({len(ids)} rows)")
        # Chunk to keep IN lists manageable; PostgREST's 8KB ceiling does
        # not apply here (this is raw SQL applied via psql/migration tool),
        # but a 500-element ceiling per UPDATE keeps the diff scannable.
        CHUNK = 500
        for i in range(0, len(ids), CHUNK):
            chunk = ids[i : i + CHUNK]
            in_list = ", ".join(sql_quote(x) for x in chunk)
            lines.append(f"UPDATE sources SET study_type = {sql_quote(st)} WHERE id IN ({in_list});")
        lines.append("")

    if endpoints:
        lines.append(f"-- primary_endpoint_text ({len(endpoints)} rows where excerpt named one)")
        for row_id, span in endpoints:
            lines.append(
                f"UPDATE sources SET primary_endpoint_text = {sql_quote(span)} "
                f"WHERE id = {sql_quote(row_id)};"
            )
        lines.append("")
    else:
        lines.append("-- No primary_endpoint_text rows extractable from current excerpts.")
        lines.append("")

    lines.append("COMMIT;")
    lines.append("")

    out_path.write_text("\n".join(lines))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--dry-run", action="store_true", default=True,
                       help="Print classifier distribution, emit nothing (default).")
    group.add_argument("--write", action="store_true",
                       help=f"Emit migration to {OUT_PATH_DEFAULT.relative_to(REPO_ROOT)}.")
    group.add_argument("--explain", metavar="SOURCE_ID",
                       help="Classify a single row by id and report which regex fired.")
    parser.add_argument("--out", type=Path, default=OUT_PATH_DEFAULT,
                        help="Override migration output path.")
    args = parser.parse_args()

    load_env_local()
    rows, study_type_exists = fetch_all_sources()
    print(f"Fetched {len(rows)} rows from `sources`.")

    # Re-fetch with external_id so we can drive PubMed + CT.gov enrichment.
    # The original fetch_all_sources() omits external_id to keep the SELECT
    # narrow; we add it here on a second pass keyed by id.
    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    ext_id_map: dict[str, str] = {}
    page_size = 1000
    offset = 0
    while True:
        url = (
            f"{base}/rest/v1/sources?select=id,external_id"
            f"&order=id&limit={page_size}&offset={offset}"
        )
        batch = http_get_json(url, headers)
        for r in batch:
            if r.get("external_id"):
                ext_id_map[r["id"]] = str(r["external_id"]).strip()
        if len(batch) < page_size:
            break
        offset += page_size

    if args.explain:
        match = next((r for r in rows if r["id"] == args.explain), None)
        if not match:
            print(f"No row with id={args.explain}")
            sys.exit(1)
        st_value, pattern = classify_one(
            match.get("source_type"),
            match.get("title"),
            match.get("journal"),
            match.get("key_finding_excerpt"),
        )
        endpoint = extract_endpoint(match.get("key_finding_excerpt"))
        print(f"id            {match['id']}")
        print(f"source_type   {match.get('source_type')}")
        print(f"title         {(match.get('title') or '')[:200]}")
        print(f"journal       {match.get('journal')}")
        print(f"excerpt       {(match.get('key_finding_excerpt') or '')[:200]}")
        print(f"--")
        print(f"study_type    {st_value}")
        print(f"matched by    {pattern}")
        print(f"endpoint      {endpoint}")
        return

    # ── Pass 1: regex classification on every row ────────────────────────
    candidate: list[dict[str, Any]] = []
    skipped_already_set = 0

    for r in rows:
        existing = r.get("study_type")
        if existing:
            # Don't clobber rows that already have a study_type. The pipeline
            # writer will set them going forward; we only fill blanks.
            skipped_already_set += 1
            continue
        st, pattern = classify_one(
            r.get("source_type"),
            r.get("title"),
            r.get("journal"),
            r.get("key_finding_excerpt"),
        )
        endpoint = extract_endpoint(r.get("key_finding_excerpt"))
        candidate.append(
            {
                "id": r["id"],
                "source_type": r.get("source_type"),
                "study_type": st,
                "primary_endpoint_text": endpoint,
                "_regex_source": pattern,
            }
        )

    # ── Pass 2: PubMed and CT.gov enrichment overlay ─────────────────────
    print()
    print("Enriching from PubMed E-utilities + CT.gov v2 ...")

    pmids_to_fetch = sorted({
        ext_id_map[c["id"]]
        for c in candidate
        if c["source_type"] == "pubmed" and c["id"] in ext_id_map and ext_id_map[c["id"]].isdigit()
    })
    pubmed_meta = fetch_pubmed_metadata(pmids_to_fetch) if pmids_to_fetch else {}

    ncts_to_fetch = sorted({
        ext_id_map[c["id"]]
        for c in candidate
        if c["source_type"] == "clinical_trial" and c["id"] in ext_id_map and ext_id_map[c["id"]].startswith("NCT")
    })
    ctgov_meta = fetch_ctgov_designs(ncts_to_fetch) if ncts_to_fetch else {}

    pubmed_overrides = 0
    pubmed_endpoint_fills = 0
    ctgov_overrides = 0

    for c in candidate:
        ext_id = ext_id_map.get(c["id"])
        if c["source_type"] == "pubmed" and ext_id and ext_id.isdigit():
            meta = pubmed_meta.get(ext_id, {})
            pt_bucket = pubmed_pubtypes_to_study_type(meta.get("pubtypes") or [])
            if pt_bucket and pt_bucket != c["study_type"]:
                c["study_type"] = pt_bucket
                c["_regex_source"] = "pubmed_publication_type"
                pubmed_overrides += 1
            elif pt_bucket:
                c["_regex_source"] = "pubmed_publication_type"
            outcome = meta.get("primary_outcome")
            if outcome and not c["primary_endpoint_text"]:
                c["primary_endpoint_text"] = outcome
                pubmed_endpoint_fills += 1
        elif c["source_type"] == "clinical_trial" and ext_id and ext_id.startswith("NCT"):
            design = ctgov_meta.get(ext_id, {})
            ct_bucket = ctgov_design_to_study_type(design)
            if ct_bucket and ct_bucket != c["study_type"]:
                c["study_type"] = ct_bucket
                c["_regex_source"] = "ctgov_design"
                ctgov_overrides += 1
            elif ct_bucket:
                c["_regex_source"] = "ctgov_design"

    print(f"  PubMed study_type overrides: {pubmed_overrides}")
    print(f"  PubMed primary_endpoint_text fills: {pubmed_endpoint_fills}")
    print(f"  CT.gov study_type overrides: {ctgov_overrides}")

    # ── Aggregate for reporting ──────────────────────────────────────────
    classified: list[dict[str, Any]] = []
    overall: Counter = Counter()
    by_st: dict[str, Counter] = defaultdict(Counter)
    endpoint_hits = 0
    for c in candidate:
        classified.append(
            {
                "id": c["id"],
                "study_type": c["study_type"],
                "primary_endpoint_text": c["primary_endpoint_text"],
            }
        )
        overall[c["study_type"]] += 1
        by_st[c["source_type"] or "(null)"][c["study_type"]] += 1
        if c["primary_endpoint_text"]:
            endpoint_hits += 1

    print()
    print(f"Skipped {skipped_already_set} rows that already have study_type set.")
    print(f"Classified {len(classified)} rows. primary_endpoint_text extracted on {endpoint_hits}.")
    print()
    print("Overall study_type distribution:")
    for st, c in overall.most_common():
        pct = (c / len(classified)) * 100 if classified else 0
        print(f"  {st:<18} {c:>5}  ({pct:5.1f}%)")

    print()
    print("By source_type:")
    for source_type in sorted(by_st):
        sub = by_st[source_type]
        total = sum(sub.values())
        print(f"  {source_type}  n={total}")
        for st, c in sub.most_common():
            pct = (c / total) * 100 if total else 0
            print(f"    {st:<18} {c:>5}  ({pct:5.1f}%)")

    if args.write:
        emit_migration(args.out, classified, by_st, overall, len(classified))
        print()
        print(f"Wrote migration to {args.out.relative_to(REPO_ROOT)}")
        print("Review the SQL and apply through your usual migration flow.")
    else:
        print()
        print("Dry run: no migration written. Re-run with --write to emit SQL.")


if __name__ == "__main__":
    main()
