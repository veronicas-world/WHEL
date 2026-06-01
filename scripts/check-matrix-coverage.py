#!/usr/bin/env python3
"""
check-matrix-coverage.py
========================

MATRIX coverage sanity check for Whel.

PURPOSE
-------
Before committing to building the Every Cure MATRIX integration (Phase 1
of the roadmap on /about/technical-architecture), we need to know how
much of Whel's compound x condition signal space is actually covered by
the MATRIX matrix-scores dataset on Hugging Face.

This script answers four questions:

  Q1. How many of Whel's 6 conditions map cleanly to a MONDO disease ID
      that MATRIX uses?
  Q2. How many of Whel's compounds (~135) map cleanly to a DrugBank ID
      that MATRIX uses?
  Q3. For active Whel signals (compound, condition pairs), how many have
      a MATRIX score available?
  Q4. What does the score distribution look like for our matched pairs?

OUTPUTS
-------
  scripts/audit-output/matrix-coverage-report.json   raw data, every match attempt
  scripts/audit-output/matrix-coverage-summary.md    human-readable summary

DEPENDENCIES
------------
  pip3 install --user duckdb requests   (add --break-system-packages if pip rejects)

  (duckdb queries the MATRIX parquet files directly over HTTPS without
  downloading them; requests handles Supabase and Hugging Face REST calls.)

USAGE
-----
  cd ~/dev/rediscover            # or wherever the repo is
  python3 scripts/check-matrix-coverage.py

  The script reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  from .env.local, the same way the other research scripts do.

  Runtime: roughly 3-8 minutes depending on Hugging Face response speed
  and how many parquet files DuckDB has to scan. The matrix-scores file
  set is 39.5M rows across 11 parquet shards; DuckDB filters by row group
  statistics so we only stream the rows we need.

NETWORK
-------
  Hugging Face will rate-limit aggressive scripts. We use exponential
  backoff retry on 429 responses. If you see repeated 429s, wait 10
  minutes and re-run.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Any

import requests

try:
    import duckdb
except ImportError:
    print("ERROR: duckdb not installed. Run:")
    print("  pip3 install --user duckdb requests   (add --break-system-packages if pip rejects)")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "scripts" / "audit-output"
CACHE_DIR = OUT_DIR / "cache"
OUT_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

REPORT_JSON = OUT_DIR / "matrix-coverage-report.json"
SUMMARY_MD = OUT_DIR / "matrix-coverage-summary.md"

# Public-facing snapshot consumed by app/about/external-references/page.tsx
# via lib/matrix-audit-snapshot.{json,ts}. Refreshed at the end of every
# successful audit run. This is the canonical source of the numbers Whel
# displays publicly; if it disagrees with REPORT_JSON, REPORT_JSON wins
# and this file should be regenerated.
PUBLIC_SNAPSHOT_JSON = REPO_ROOT / "lib" / "matrix-audit-snapshot.json"
PUBLIC_SNAPSHOT_SCHEMA_VERSION = 1

# Per-phase caches: if these JSON files exist the script reuses them
# instead of re-fetching. Delete the cache file (or the whole cache/ dir)
# to force a fresh run of that phase.
WHEL_CACHE = CACHE_DIR / "phase1-whel.json"
MONDO_CACHE = CACHE_DIR / "phase2-mondo.json"
DRUG_LIST_CACHE = CACHE_DIR / "phase3-drug-list.json"
CROSSWALK_CACHE = CACHE_DIR / "phase3-crosswalk.json"
# Phase 4's results are cached as a list of records (tuple keys aren't
# JSON-serialisable). This protects ~36 GB of shard downloads from being
# discarded if compose_report or markdown writing throws later.
MATRIX_HITS_CACHE = CACHE_DIR / "phase4-matrix-hits.json"

# Per-cache schema versions. Bump the constant for the relevant cache
# whenever the SHAPE of its serialised payload changes (new fields, renamed
# fields, type changes). A cache file with a mismatched version is silently
# discarded and the underlying fn() is re-run. This is the guardrail that
# prevents the stale-MONDO-cache pattern from recurring (the
# .stale-2026-05-30 incident, where MONDO:0006471 = Tracheal carcinoma sat
# in cache for a day before being noticed).
CACHE_SCHEMA_VERSIONS = {
    "phase1-whel.json":        1,
    "phase2-mondo.json":       3,  # v2 added match_status; v3 adds matrix_official_filter
    "phase3-drug-list.json":   1,
    "phase3-crosswalk.json":   4,  # v3 added exclusion flags; v4 adds matched_via_brand_dict
    "phase4-matrix-hits.json": 1,
}


def _cache_envelope(payload: Any, schema_version: int, label: str) -> dict[str, Any]:
    return {
        "_cache_schema_version": schema_version,
        "_cache_label": label,
        "_cache_generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "payload": payload,
    }


def _cached(path: Path, label: str, fn, *args, **kwargs):
    """Load from `path` if it exists AND its envelope schema_version
    matches the expected version for this cache file. Otherwise run
    `fn(*args, **kwargs)`, wrap it in a schema-versioned envelope, save
    it to `path`, and return it.

    Legacy un-enveloped caches (anything written before the envelope
    format) are treated as a schema mismatch and re-computed."""
    expected_version = CACHE_SCHEMA_VERSIONS.get(path.name)
    if expected_version is None:
        raise KeyError(
            f"Cache file {path.name!r} has no entry in CACHE_SCHEMA_VERSIONS. "
            f"Register a schema version before using _cached() with this path."
        )

    if path.exists():
        try:
            raw = json.loads(path.read_text())
        except json.JSONDecodeError as e:
            print(f"     [cache invalid] {path.name}: not valid JSON ({e}); recomputing")
            raw = None

        if raw is not None:
            envelope_version = (
                raw.get("_cache_schema_version") if isinstance(raw, dict) else None
            )
            if envelope_version is None:
                # Pre-envelope legacy cache. If MIGRATE_LEGACY_CACHES=1 the
                # user is explicitly opting in to adopt the file's contents
                # as the current schema version; we wrap it in an envelope
                # so subsequent runs are clean. Otherwise we discard the
                # file and recompute (safe default).
                if os.environ.get("MIGRATE_LEGACY_CACHES") == "1":
                    print(
                        f"     [cache migrate] {path.name}: wrapping pre-envelope "
                        f"file as v{expected_version} (MIGRATE_LEGACY_CACHES=1)"
                    )
                    envelope = _cache_envelope(raw, expected_version, label)
                    envelope["_migrated_from_legacy"] = True
                    path.write_text(json.dumps(envelope, indent=2, default=str))
                    return raw
                print(
                    f"     [cache stale] {path.name}: pre-envelope format; "
                    f"recomputing (expected v{expected_version}). "
                    f"Set MIGRATE_LEGACY_CACHES=1 to adopt the existing file."
                )
            elif envelope_version != expected_version:
                print(
                    f"     [cache stale] {path.name}: schema v{envelope_version} "
                    f"!= expected v{expected_version}; recomputing"
                )
            else:
                generated = raw.get("_cache_generated_at", "?")
                migrated = " [migrated]" if raw.get("_migrated_from_legacy") else ""
                print(
                    f"     [cache hit] reusing {label} from "
                    f"{path.relative_to(REPO_ROOT)} (v{expected_version}, "
                    f"generated {generated}){migrated}"
                )
                return raw["payload"]

    result = fn(*args, **kwargs)
    envelope = _cache_envelope(result, expected_version, label)
    path.write_text(json.dumps(envelope, indent=2, default=str))
    print(
        f"     [cache save] {label} -> {path.relative_to(REPO_ROOT)} "
        f"(v{expected_version})"
    )
    return result


# ---------------------------------------------------------------------------
# Whel conditions -- loaded from the canonical ontology source of truth at
# lib/conditions-ontology.json. The TypeScript wrapper at
# lib/conditions-ontology.ts re-exports the same data for the Next.js app.
# Earlier inline copies of this list shipped wrong MONDO IDs for Adenomyosis
# (was Tracheal adenoid cystic carcinoma) and Menopause (was Tic disorder),
# which is the silent-failure mode this centralisation closes.
#
# The Phase 2 validator below still cross-checks each row's `name` against
# the search_terms, so even if the JSON drifts from the live MONDO release
# the audit will fail loudly rather than silently scoring the wrong disease.
# ---------------------------------------------------------------------------

ONTOLOGY_JSON_PATH = REPO_ROOT / "lib" / "conditions-ontology.json"
ONTOLOGY_SCHEMA_VERSION = 1


# ---------------------------------------------------------------------------
# Compound exclusion lists -- class labels and non-drug entries
#
# MATRIX is a drug-disease prediction graph. Two slices of Whel's compound
# list cannot, even in principle, be scored by MATRIX:
#
#   - UMBRELLA_LABELS: drug-class strings ("SSRIs", "GLP-1 receptor agonists")
#     whose individual members are usually already enumerated separately in
#     the Whel list. MATRIX scores compounds, not classes.
#
#   - NON_DRUG_LABELS: supplements, lifestyle changes, food. These are out
#     of scope for the MATRIX biomedical graph and should not penalise the
#     coverage denominator.
#
# Both lists are matched after the same `normalize()` pass used for compound
# crosswalking (lowercase, strip non-alnum). This means casing, punctuation,
# and parenthetical drift do not require updates to the list.
#
# Entries here are derived from the walk-through in
# scripts/audit-output/unmatched-compounds-walk.md. Borderline cases like
# DHEA (has DrugBank ID DB01708) and Ergocalciferol (Vitamin D2, DB00153)
# are intentionally NOT excluded -- they have legitimate DrugBank entries
# and might appear in MATRIX. If MATRIX has no coverage for them, that is
# a real gap, not a denominator quirk.
# ---------------------------------------------------------------------------

def _normalize_compound_name(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"[^a-z0-9]", "", s.lower())


UMBRELLA_LABEL_RAW = [
    "Aromatase Inhibitors (e.g., Letrozole, Anastrozole)",
    "Antihistamines (Zyrtec/cetirizine, Benadryl/diphenhydramine)",
    "Combined Oral Contraceptives (estrogen-Progestogen)",
    "Continuous Oral Contraceptive",
    "GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide)",
    "GLP-1 Receptor Agonists (Ozempic/semaglutide)",
    "GnRH Agonists (e.g., Leuprolide, Triptorelin)",
    "GnRH Antagonists (e.g., Elagolix, Relugolix)",
    "GnRH Antagonists (oral, E.g., Elagolix, Relugolix, Linzagolix)",
    "Levonorgestrel Intrauterine System (LNG-IUS)",
    "Levonorgestrel Intrauterine System (Mirena) / Depot Medroxyprogesterone Acetate (Depo-Provera) / Etonogestrel Implant (Implanon)",
    "NKB Receptor Antagonists (NK3R Antagonists)",
    "Selective Progesterone Receptor Modulators (SPRMs)",
    "Selective Progesterone Receptor Modulators (SPRMs, E.g., Ulipristal Acetate, Mifepristone)",
    "SGLT2 Inhibitors (e.g., Empagliflozin, Dapagliflozin)",
    "Statins (HMG-CoA Reductase Inhibitors)",
    "Topical Estrogen/testosterone Cream",
    "Very-Low-Dose Combined Oral Contraceptives (estradiol-Based)",
]

NON_DRUG_LABEL_RAW = [
    "Alcohol Cessation",
    "Calcium",
    "CBD (topical)",
    "CBD Oil (medical Grade)",
    "Chinese Herbal Medicine (CHM) Formulations",
    "Chromium (supplementation)",
    "Cinnamon Extract",
    "Collagen Supplements",
    "Creatine",
    "Inositol (Myo-Inositol / D-Chiro-Inositol)",
    "Iron/Ferritin Supplementation",
    "Magnesium (various Forms Including Glycinate)",
    "Magnesium Glycinate",
    "Magnesium Supplements",
    "Myo-Inositol",
    "Saw Palmetto",
    "Spearmint Tea",
    "Vitamin D",
    "Vitamin D (D3)",
    "Vitamin D (high-dose Supplementation)",
    "Vitamin D Supplementation",
]

UMBRELLA_LABELS_NORMALIZED = {_normalize_compound_name(s) for s in UMBRELLA_LABEL_RAW}
NON_DRUG_LABELS_NORMALIZED = {_normalize_compound_name(s) for s in NON_DRUG_LABEL_RAW}


# ---------------------------------------------------------------------------
# Brand-name -> generic-name dictionary
#
# Shared source of truth with the Next.js app
# (lib/brand-name-dictionary.{json,ts}) and surfaced on
# /about/external-references so users can audit which translations the
# crosswalk applies. The dictionary fixes the specific failure mode where
# Whel's compound `name` is a brand string ("Wellbutrin", "Veozah") or a
# "Brand (generic)" parenthetical and the underlying generic IS in MATRIX
# but the brand string is not.
#
# Loaded once at module top. Used as a fallback in build_compound_crosswalk()
# AFTER the existing name/generic_name/brand_names match attempt fails.
# Entries with a null generic (e.g. medical-device combos) are skipped --
# they exist in the JSON for documentation only.
# ---------------------------------------------------------------------------

BRAND_DICT_JSON_PATH = REPO_ROOT / "lib" / "brand-name-dictionary.json"
BRAND_DICT_SCHEMA_VERSION = 1


def _load_brand_dictionary() -> list[dict[str, Any]]:
    if not BRAND_DICT_JSON_PATH.exists():
        # Brand dictionary is optional; the audit still runs without it,
        # just at a lower compound match rate for brand-string entries.
        print(
            f"     [brand-dict] not found at "
            f"{BRAND_DICT_JSON_PATH.relative_to(REPO_ROOT)}; skipping fallback"
        )
        return []
    raw = json.loads(BRAND_DICT_JSON_PATH.read_text())
    meta = raw.get("_meta", {})
    if meta.get("schema_version") != BRAND_DICT_SCHEMA_VERSION:
        raise ValueError(
            f"brand-name-dictionary.json schema_version "
            f"{meta.get('schema_version')!r} does not match the version "
            f"this script understands ({BRAND_DICT_SCHEMA_VERSION})."
        )
    return raw.get("entries", [])


BRAND_DICTIONARY: list[dict[str, Any]] = _load_brand_dictionary()
BRAND_DICTIONARY_NORMALIZED: dict[str, dict[str, Any]] = {
    _normalize_compound_name(e["brand"]): e
    for e in BRAND_DICTIONARY
    if e.get("generic")  # skip documentation-only rows with null generic
}

# ---------------------------------------------------------------------------
# MATRIX dataset snapshot capture
#
# We cannot pin a specific revision in the auto-converted Parquet URL (HF's
# datasets-server regenerates Parquet from the latest revision of the
# source repo on a schedule). What we CAN do is record the source-repo SHA
# at run time so the audit report names exactly which snapshot it was
# computed against. If the SHA shifts between runs, the difference in
# headline numbers is attributable to a known dataset change.
#
# If the env var MATRIX_PIN_REVISION_OVERRIDE is set, the script warns when
# any live SHA differs from the pinned value (does not fail; just logs).
# ---------------------------------------------------------------------------

MATRIX_DATASETS = {
    "matrix-scores":   "everycure/matrix-scores",
    "matrix-disease":  "everycure/disease-list",
    "matrix-drug":     "everycure/drug-list",
}


def fetch_matrix_dataset_revisions() -> dict[str, dict[str, Any]]:
    """For each MATRIX dataset, query the HF Hub API for the current
    source-repo SHA and lastModified timestamp. Returns a dict
    keyed by short name. Never raises on network failure; instead
    records the error string so the report stays informative."""
    out: dict[str, dict[str, Any]] = {}
    for short_name, repo in MATRIX_DATASETS.items():
        url = f"https://huggingface.co/api/datasets/{repo}"
        try:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            meta = r.json()
            out[short_name] = {
                "repo": repo,
                "sha": meta.get("sha"),
                "last_modified": meta.get("lastModified"),
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "error": None,
            }
        except Exception as e:  # noqa: BLE001
            out[short_name] = {
                "repo": repo,
                "sha": None,
                "last_modified": None,
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "error": str(e),
            }
    return out


def check_pin_override(snapshot: dict[str, dict[str, Any]]) -> None:
    """If MATRIX_PIN_REVISION_OVERRIDE is set to a JSON object mapping
    short_name -> expected SHA, warn (do not fail) when the live SHA
    differs. Useful for reproducing a known audit run."""
    pin = os.environ.get("MATRIX_PIN_REVISION_OVERRIDE")
    if not pin:
        return
    try:
        expected = json.loads(pin)
    except Exception as e:  # noqa: BLE001
        print(f"     [pin-check] MATRIX_PIN_REVISION_OVERRIDE is not valid JSON ({e}); ignoring")
        return
    for short_name, want_sha in expected.items():
        live = snapshot.get(short_name, {}).get("sha")
        if live != want_sha:
            print(
                f"     [pin-check] {short_name}: live SHA {live!r} differs from "
                f"pinned {want_sha!r}; numbers may not be reproducible"
            )
        else:
            print(f"     [pin-check] {short_name}: live SHA matches pin")


def _load_conditions_ontology() -> list[dict[str, Any]]:
    """Load and adapt the canonical condition ontology JSON into the
    flat dict shape the rest of this script expects (whel_name,
    expected_mondo, candidate_mondo_ids, search_terms, ontology_gap_note).

    Field translation:
      whel_short_name -> whel_name
      mondo_primary -> expected_mondo
      mondo_primary + mondo_candidates[].id -> candidate_mondo_ids
      search_terms -> search_terms
      ontology_gap_note -> ontology_gap_note
    """
    if not ONTOLOGY_JSON_PATH.exists():
        raise FileNotFoundError(
            f"Canonical condition ontology not found at {ONTOLOGY_JSON_PATH}. "
            f"This file is required; see lib/conditions-ontology.ts for the "
            f"TypeScript wrapper that consumes the same JSON."
        )
    raw = json.loads(ONTOLOGY_JSON_PATH.read_text())
    meta = raw.get("_meta", {})
    if meta.get("schema_version") != ONTOLOGY_SCHEMA_VERSION:
        raise ValueError(
            f"conditions-ontology.json schema_version "
            f"{meta.get('schema_version')!r} does not match the version "
            f"this script understands ({ONTOLOGY_SCHEMA_VERSION}). Update "
            f"the loader or downgrade the JSON."
        )
    out: list[dict[str, Any]] = []
    for c in raw["conditions"]:
        primary = c["mondo_primary"]
        candidate_ids = [primary] + [m["id"] for m in c.get("mondo_candidates", [])]
        out.append({
            "whel_name": c["whel_short_name"],
            "slug": c["slug"],
            "expected_mondo": primary,
            "candidate_mondo_ids": candidate_ids,
            "search_terms": c["search_terms"],
            "ontology_gap_note": c.get("ontology_gap_note"),
        })
    return out


WHEL_CONDITIONS: list[dict[str, Any]] = _load_conditions_ontology()


# ---------------------------------------------------------------------------
# Env loading -- matches the pattern of the existing .mjs scripts
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


# ---------------------------------------------------------------------------
# HTTP helpers with exponential backoff on 429
# ---------------------------------------------------------------------------

def http_get_json(url: str, headers: dict[str, str] | None = None, max_tries: int = 5) -> Any:
    delay = 2.0
    for attempt in range(max_tries):
        r = requests.get(url, headers=headers or {}, timeout=60)
        if r.status_code == 429:
            print(f"  rate-limited, sleeping {delay:.0f}s ...")
            time.sleep(delay)
            delay *= 2
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError(f"too many 429s on {url}")


# ---------------------------------------------------------------------------
# Phase 1: Pull Whel compounds + active signals from Supabase
# ---------------------------------------------------------------------------

def pull_whel_data() -> dict[str, Any]:
    print("[1/5] Pulling Whel compounds + active signals from Supabase ...")
    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    # Compounds
    url = f"{base}/rest/v1/compounds?select=id,name,generic_name,brand_names"
    compounds = http_get_json(url, headers)
    print(f"     {len(compounds)} compounds in database")

    # Active signals (the pairs we actually care about covering)
    url = (
        f"{base}/rest/v1/repurposing_signals"
        f"?select=compound_id,condition_id,signal_type,confidence_tier"
        f"&status=eq.active"
    )
    signals = http_get_json(url, headers)
    print(f"     {len(signals)} active signals")

    # NB: pair_signals (a dict keyed on (compound_id, condition_id)
    # tuples) is rebuilt in main() after the cache load, because tuple
    # keys are not JSON-serialisable. Storing only compounds + signals
    # here keeps the cache file portable.
    return {
        "compounds": compounds,
        "signals": signals,
    }


# ---------------------------------------------------------------------------
# Phase 2: Confirm MONDO IDs from MATRIX disease-list
#
# Earlier versions paginated the rate-limited /rows endpoint of
# datasets-server.huggingface.co. That worked when uncontested but threw
# 429s under load and, worse, accepted any disease-list row whose `id`
# field matched our expected MONDO ID -- without checking whether the
# row's `name` actually agreed. That let MONDO:0006471 ("Tracheal adenoid
# cystic carcinoma") count as a valid match for Adenomyosis, etc.
#
# The current implementation queries the auto-converted Parquet shard
# directly via DuckDB. One query per condition, no paginated REST, no
# rate-limit risk. And critically: a name agreement check that downgrades
# any ID-only hit to "id_exists_name_mismatch" so the rest of the
# pipeline doesn't silently pull scores for the wrong disease.
# ---------------------------------------------------------------------------

DISEASE_LIST_PARQUET = (
    "https://huggingface.co/api/datasets/everycure/disease-list/"
    "parquet/default/train/0.parquet"
)


def _make_duckdb_connection() -> "duckdb.DuckDBPyConnection":
    """Connect to DuckDB with httpfs loaded and HF-friendly retry settings."""
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    for stmt in [
        "SET http_retries=20",
        "SET http_retry_wait_ms=2000",
        "SET http_retry_backoff=2.0",
        "SET http_timeout=120000",
        "SET http_keep_alive=true",
    ]:
        try:
            con.execute(stmt)
        except Exception as e:  # noqa: BLE001
            print(f"     (note: DuckDB rejected `{stmt}` -> {e}; continuing)")
    return con


def _name_agrees(matrix_name: str | None, search_terms: list[str]) -> bool:
    """True if any search term is a case-insensitive substring of the
    disease-list row's `name` (or vice versa)."""
    if not matrix_name:
        return False
    m = matrix_name.strip().lower()
    for term in search_terms:
        t = term.strip().lower()
        if not t:
            continue
        if t in m or m in t:
            return True
    return False


def confirm_mondo_ids() -> list[dict[str, Any]]:
    """For each Whel condition, look it up in the MATRIX disease-list to
    confirm the MONDO ID is still valid AND the row's name actually
    matches our condition. Uses DuckDB over the auto-converted Parquet
    shard so we make one query per condition with no REST pagination and
    no rate-limit exposure."""
    print("[2/5] Confirming MONDO IDs against MATRIX disease-list (DuckDB on Parquet) ...")
    con = _make_duckdb_connection()

    # Detect whether the disease-list snapshot includes the
    # official_matrix_filter column. This is the boolean flag Every Cure
    # sets to indicate "this disease is in the primary MATRIX scoring
    # run". It is INTENT, not a strict gate: some Filter=False diseases
    # still appear in matrix-scores (Endometriosis is the clearest case),
    # and some Filter=True diseases produce zero predictions (PMDD).
    # Capture it per condition so the website can show both columns and
    # readers understand the distinction.
    try:
        schema_probe = con.execute(
            f"DESCRIBE SELECT * FROM read_parquet('{DISEASE_LIST_PARQUET}') LIMIT 0"
        ).fetchall()
        disease_list_columns = {row[0] for row in schema_probe}
        has_official_filter = "official_matrix_filter" in disease_list_columns
        if has_official_filter:
            print("     [schema] disease-list exposes official_matrix_filter; will capture per condition")
        else:
            print("     [schema] disease-list snapshot has no official_matrix_filter column; field will be null")
    except Exception as e:  # noqa: BLE001
        print(f"     [schema] could not probe disease-list columns ({e}); assuming no official_matrix_filter")
        has_official_filter = False

    # Probe the parquet once to make sure it is reachable; bail with a
    # helpful message rather than silently producing all-NOT_FOUND.
    try:
        schema = con.execute(
            f"DESCRIBE SELECT * FROM read_parquet('{DISEASE_LIST_PARQUET}') LIMIT 0"
        ).fetchall()
        print(f"     disease-list schema columns: {[r[0] for r in schema]}")
    except Exception as e:  # noqa: BLE001
        print(f"     ERROR: cannot reach disease-list parquet: {e}")
        print(f"     URL was: {DISEASE_LIST_PARQUET}")
        raise

    confirmed: list[dict[str, Any]] = []
    for cond in WHEL_CONDITIONS:
        expected = cond["expected_mondo"]
        candidate_ids = cond.get("candidate_mondo_ids") or [expected]
        search_terms = cond["search_terms"]
        print(f"  - {cond['whel_name']} (expected {expected}) ...", end=" ")

        # One query: find any row whose id is one of our candidate MONDO
        # IDs OR whose name/synonyms contain a search term. The synonyms
        # column type can vary (string vs. array depending on snapshot);
        # cast to VARCHAR to be safe.
        id_list = ", ".join(f"'{c}'" for c in candidate_ids)
        term_clauses = " OR ".join(
            [
                f"LOWER(name) LIKE '%' || LOWER('{t.replace(chr(39), chr(39) * 2)}') || '%'"
                for t in search_terms
            ]
            + [
                f"LOWER(CAST(synonyms AS VARCHAR)) LIKE '%' || LOWER('{t.replace(chr(39), chr(39) * 2)}') || '%'"
                for t in search_terms
            ]
        )
        select_cols = "id, name, CAST(synonyms AS VARCHAR) AS synonyms"
        if has_official_filter:
            select_cols += ", official_matrix_filter"
        sql = f"""
            SELECT {select_cols}
            FROM read_parquet('{DISEASE_LIST_PARQUET}')
            WHERE id IN ({id_list}) OR ({term_clauses})
            LIMIT 50
        """
        try:
            rows = con.execute(sql).fetchall()
        except Exception as e:  # noqa: BLE001
            print(f"QUERY FAILED ({e})")
            confirmed.append({
                "whel_name": cond["whel_name"],
                "expected_mondo": expected,
                "matrix_id": None,
                "matrix_name": None,
                "matched_via": None,
                "match_status": "query_failed",
                "error": str(e),
                "ontology_gap_note": cond.get("ontology_gap_note"),
                "matrix_official_filter": None,
            })
            continue

        # Score the candidates. Prefer an id-and-name agreement, then
        # id-only, then name-only.
        best = None
        for row in rows:
            row_id = row[0]
            row_name = row[1]
            row_off = row[3] if has_official_filter and len(row) > 3 else None
            id_hit = row_id in candidate_ids
            name_hit = _name_agrees(row_name, search_terms)
            if id_hit and name_hit:
                best = ("exact", row_id, row_name, row_off)
                break
            if id_hit and best is None:
                best = ("id_exists_name_mismatch", row_id, row_name, row_off)
            elif name_hit and (best is None or best[0] == "id_exists_name_mismatch"):
                best = ("name_match_id_differs", row_id, row_name, row_off)

        if best is None:
            confirmed.append({
                "whel_name": cond["whel_name"],
                "expected_mondo": expected,
                "matrix_id": None,
                "matrix_name": None,
                "matched_via": None,
                "match_status": "not_found",
                "candidates_examined": len(rows),
                "ontology_gap_note": cond.get("ontology_gap_note"),
                "matrix_official_filter": None,
            })
            print("NOT FOUND (definitive; full Parquet scan)")
            continue

        status, matrix_id, matrix_name, matrix_off = best
        confirmed.append({
            "whel_name": cond["whel_name"],
            "expected_mondo": expected,
            "matrix_id": matrix_id,
            "matrix_name": matrix_name,
            "matched_via": (
                "id_and_name" if status == "exact"
                else "id_only" if status == "id_exists_name_mismatch"
                else "name_only"
            ),
            "match_status": status,
            "ontology_gap_note": cond.get("ontology_gap_note"),
            "matrix_official_filter": matrix_off,
        })
        print(f"{status}: {matrix_id} ({matrix_name!r})")

    return confirmed


# ---------------------------------------------------------------------------
# Phase 3: Pull MATRIX drug-list, build compound name -> DrugBank ID map
# ---------------------------------------------------------------------------

def pull_drug_list() -> list[dict[str, Any]]:
    """Download the full MATRIX drug-list (1822 rows) via HF /rows."""
    print("[3/5] Downloading MATRIX drug-list (1822 rows, ~19 pages) ...")
    all_rows: list[dict[str, Any]] = []
    for offset in range(0, 2000, 100):
        url = (
            "https://datasets-server.huggingface.co/rows"
            f"?dataset=everycure%2Fdrug-list&config=default&split=train"
            f"&offset={offset}&length=100"
        )
        data = http_get_json(url)
        rows = data.get("rows", [])
        if not rows:
            break
        for r in rows:
            all_rows.append(r.get("row", {}))
        print(f"     fetched {len(all_rows)} so far")
        time.sleep(0.3)
    print(f"     total: {len(all_rows)} drug records")
    return all_rows


def build_compound_crosswalk(
    whel_compounds: list[dict[str, Any]],
    drug_list: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Match each Whel compound to a drug-list row by name / generic_name / brand_names
    against drug-list name + synonyms. Returns a list aligned with whel_compounds."""

    def normalize(s: str | None) -> str:
        if not s:
            return ""
        return re.sub(r"[^a-z0-9]", "", s.lower())

    # Build lookup index over drug-list
    drug_index: dict[str, dict[str, Any]] = {}
    for d in drug_list:
        for key in [d.get("name", "")] + list(d.get("synonyms") or []):
            n = normalize(key)
            if n:
                # don't overwrite -- first hit wins; drug-list `name` is canonical
                drug_index.setdefault(n, d)

    crosswalk: list[dict[str, Any]] = []
    for c in whel_compounds:
        candidates = [c.get("name"), c.get("generic_name")] + list(c.get("brand_names") or [])
        # Pre-classify: is this a drug-class umbrella string, or a non-drug
        # (supplement / lifestyle) entry? Both should still flow through the
        # name match attempt (so a "Vitamin D" entry that happens to match a
        # DrugBank row remains traceable), but they get flagged for the
        # denominator-adjustment in compose_report() so they don't penalise
        # MATRIX coverage as if they were missing drug matches.
        name_norm = normalize(c.get("name"))
        generic_norm = normalize(c.get("generic_name"))
        is_class_label = (
            name_norm in UMBRELLA_LABELS_NORMALIZED
            or generic_norm in UMBRELLA_LABELS_NORMALIZED
        )
        is_non_drug = (
            name_norm in NON_DRUG_LABELS_NORMALIZED
            or generic_norm in NON_DRUG_LABELS_NORMALIZED
        )
        matched = None
        matched_via = None
        matched_via_brand_dict = False
        for cand in candidates:
            n = normalize(cand)
            if n and n in drug_index:
                matched = drug_index[n]
                matched_via = cand
                break
        # Brand-dictionary fallback. Triggered when the literal name and the
        # database-provided synonyms didn't find a drug-list row, but the
        # name contains (or equals) a brand string we know about. The
        # dictionary maps brand -> generic; we then re-attempt the drug_index
        # lookup with the generic and any explicit DrugBank ID.
        if matched is None and BRAND_DICTIONARY_NORMALIZED:
            for cand in candidates:
                if not cand:
                    continue
                cand_norm = normalize(cand)
                # Direct hit: the entire candidate string IS a known brand.
                hit = BRAND_DICTIONARY_NORMALIZED.get(cand_norm)
                if not hit:
                    # Substring hit: the brand appears inside a longer string
                    # like "Wellbutrin (bupropion)". Match the brand only if
                    # the normalized brand is a non-empty substring of the
                    # normalized candidate. Skips brand strings shorter than
                    # 5 characters to avoid spurious "valium" matches inside
                    # unrelated drug names.
                    for brand_norm, entry in BRAND_DICTIONARY_NORMALIZED.items():
                        if len(brand_norm) >= 5 and brand_norm in cand_norm:
                            hit = entry
                            break
                if hit is None:
                    continue
                generic_norm = normalize(hit.get("generic"))
                if generic_norm and generic_norm in drug_index:
                    matched = drug_index[generic_norm]
                    matched_via = f"brand_dict:{hit['brand']}->{hit['generic']}"
                    matched_via_brand_dict = True
                    break
        if matched:
            # The MATRIX matrix-scores `source` column uses the canonical
            # CURIE Every Cure chose per drug, exposed in drug-list as
            # `translator_id`. The mix is roughly 72% CHEBI, 20% UNII, and
            # smaller shares of UMLS / DRUGBANK / PUBCHEM / RXCUI. Joining
            # on DRUGBANK:<drugbank_id> only hit 1.4% of drug-list rows;
            # joining on translator_id hits ~96%. drugbank_id is retained
            # below for traceability and as a fallback when translator_id
            # is missing.
            translator_id = matched.get("translator_id") or None
            db_id = matched.get("drugbank_id") or ""
            fallback_drugbank = f"DRUGBANK:{db_id}" if db_id else None
            matrix_source_id = translator_id or fallback_drugbank
            crosswalk.append({
                "whel_id": c["id"],
                "whel_name": c["name"],
                "matched_via": matched_via,
                "matched_via_brand_dict": matched_via_brand_dict,
                "matrix_ec_id": matched.get("id"),
                "drugbank_id": db_id or None,
                "translator_id": translator_id,
                "matrix_source_id": matrix_source_id,
                "matrix_source_namespace": (
                    matrix_source_id.split(":", 1)[0] if matrix_source_id else None
                ),
                "match_status": (
                    "matched" if matrix_source_id
                    else "matched_no_curie"
                ),
                "is_class_label": is_class_label,
                "is_non_drug": is_non_drug,
            })
        else:
            crosswalk.append({
                "whel_id": c["id"],
                "whel_name": c["name"],
                "matched_via": None,
                "matched_via_brand_dict": False,
                "matrix_ec_id": None,
                "drugbank_id": None,
                "matrix_source_id": None,
                "match_status": "not_found",
                "is_class_label": is_class_label,
                "is_non_drug": is_non_drug,
            })
    matched_count = sum(1 for r in crosswalk if r["match_status"] == "matched")
    brand_dict_matches = sum(
        1 for r in crosswalk if r.get("matched_via_brand_dict")
    )
    class_count = sum(1 for r in crosswalk if r.get("is_class_label"))
    non_drug_count = sum(1 for r in crosswalk if r.get("is_non_drug"))
    eligible_total = sum(
        1 for r in crosswalk
        if not r.get("is_class_label") and not r.get("is_non_drug")
    )
    eligible_matched = sum(
        1 for r in crosswalk
        if r["match_status"] == "matched"
        and not r.get("is_class_label")
        and not r.get("is_non_drug")
    )
    print(
        f"     matched {matched_count} / {len(whel_compounds)} compounds "
        f"to MATRIX source CURIEs (mix of CHEBI, UNII, DRUGBANK, etc.)"
    )
    if brand_dict_matches:
        print(
            f"     brand-dictionary fallback rescued "
            f"{brand_dict_matches} match(es) the direct name lookup missed"
        )
    print(
        f"     exclusion flags: {class_count} class labels, "
        f"{non_drug_count} non-drug entries"
    )
    if eligible_total:
        print(
            f"     adjusted compound match rate: "
            f"{eligible_matched}/{eligible_total} = "
            f"{(eligible_matched / eligible_total) * 100:.1f}% "
            f"(after excluding class labels + non-drug entries)"
        )
    # Per-namespace breakdown to make Phase 4 coverage shape interpretable
    ns_counts: dict[str, int] = {}
    for r in crosswalk:
        ns = r.get("matrix_source_namespace")
        if ns:
            ns_counts[ns] = ns_counts.get(ns, 0) + 1
    if ns_counts:
        print(
            "     namespace mix: "
            + ", ".join(f"{ns}={n}" for ns, n in sorted(ns_counts.items(), key=lambda x: -x[1]))
        )
    return crosswalk


# ---------------------------------------------------------------------------
# Phase 4: Query matrix-scores via DuckDB for each Whel (compound, condition) pair
#
# The original implementation pointed DuckDB at the 11 Parquet shards over
# HTTPS. That works but each shard is roughly 3.6 GB and the MATRIX
# matrix-scores file is sorted by score, not by (source, target). Filter
# pushdown via row-group statistics therefore does not eliminate work; DuckDB
# has to stream the entire shard. Over HTTPS, with no progress output, a
# full scan looks identical to a hang.
#
# The current implementation downloads each shard to local cache one at a
# time, queries it from disk, and either keeps or deletes the file based
# on KEEP_PARQUET_SHARDS. Local disk IO is ~100x faster than HTTPS streaming
# and the requests.get(stream=True) loop emits real progress so a slow
# network looks slow rather than hung.
#
# Peak disk usage with KEEP_PARQUET_SHARDS=False is ~3.6 GB. Set the env
# var KEEP_PARQUET_SHARDS=1 to keep the cache and skip redundant downloads
# on subsequent runs (uses ~40 GB).
# ---------------------------------------------------------------------------

PARQUET_CACHE_DIR = CACHE_DIR / "matrix-scores-parquet"
MATRIX_SHARD_COUNT = 11
SHARD_DOWNLOAD_TIMEOUT_S = 60 * 60  # 60 minutes per shard hard ceiling


def _matrix_shard_url(i: int) -> str:
    return (
        "https://huggingface.co/api/datasets/everycure/matrix-scores/"
        f"parquet/default/train/{i}.parquet"
    )


def _download_shard(idx: int, dest: Path) -> None:
    """Download one parquet shard to `dest` with resumable progress logging.
    Raises on permanent failure after retries."""
    url = _matrix_shard_url(idx)
    tmp = dest.with_suffix(dest.suffix + ".part")
    t0 = time.time()
    last_log = t0
    for attempt in range(1, 7):
        try:
            # Resume from where we stopped if a .part exists.
            existing = tmp.stat().st_size if tmp.exists() else 0
            headers = {"Range": f"bytes={existing}-"} if existing else {}
            with requests.get(url, headers=headers, stream=True, timeout=120) as r:
                if r.status_code == 416:  # already complete past current end
                    tmp.rename(dest)
                    return
                r.raise_for_status()
                total = int(r.headers.get("Content-Length", 0)) + existing
                with tmp.open("ab") as fh:
                    downloaded = existing
                    for chunk in r.iter_content(chunk_size=1024 * 1024):
                        if not chunk:
                            continue
                        fh.write(chunk)
                        downloaded += len(chunk)
                        now = time.time()
                        if now - last_log >= 5.0:
                            mb = downloaded / (1024 * 1024)
                            tot_mb = total / (1024 * 1024) if total else 0
                            rate = downloaded / max(now - t0, 1) / (1024 * 1024)
                            if tot_mb:
                                pct = downloaded / total * 100
                                print(
                                    f"     [shard {idx + 1}/{MATRIX_SHARD_COUNT}] "
                                    f"downloaded {mb:.0f} / {tot_mb:.0f} MB "
                                    f"({pct:.0f}%) at {rate:.1f} MB/s"
                                )
                            else:
                                print(
                                    f"     [shard {idx + 1}/{MATRIX_SHARD_COUNT}] "
                                    f"downloaded {mb:.0f} MB at {rate:.1f} MB/s"
                                )
                            last_log = now
                        if now - t0 > SHARD_DOWNLOAD_TIMEOUT_S:
                            raise TimeoutError(
                                f"shard {idx} download exceeded "
                                f"{SHARD_DOWNLOAD_TIMEOUT_S}s wall clock"
                            )
            tmp.rename(dest)
            return
        except (requests.RequestException, TimeoutError) as e:
            wait = min(60, 2 ** attempt * 5)
            print(
                f"     [shard {idx + 1}/{MATRIX_SHARD_COUNT}] download "
                f"attempt {attempt} failed: {e}. Retrying in {wait}s ..."
            )
            time.sleep(wait)
    raise RuntimeError(f"shard {idx} failed after 6 download attempts")


def query_matrix_scores(
    mondo_ids: list[str],
    drugbank_curies: list[str],
) -> dict[tuple[str, str], dict[str, Any]]:
    """Query the 11 MATRIX parquet shards (downloaded locally) for any
    (source, target) pair where source is one of our matched DrugBank
    CURIEs and target is one of our confirmed MONDO IDs."""
    print("[4/5] Querying MATRIX matrix-scores via DuckDB (local Parquet) ...")
    if not mondo_ids or not drugbank_curies:
        print("     nothing to query (empty mondo_ids or drugbank_curies)")
        return {}

    keep_shards = os.environ.get("KEEP_PARQUET_SHARDS", "0") == "1"
    PARQUET_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    con = _make_duckdb_connection()
    # Surface DuckDB's own progress bar so long queries no longer look hung.
    try:
        con.execute("PRAGMA enable_progress_bar")
        con.execute("PRAGMA progress_bar_time = 1000")  # ms
    except Exception as e:  # noqa: BLE001
        print(f"     (note: progress bar pragma unavailable -> {e}; continuing)")

    mondo_in = ", ".join(f"'{m}'" for m in mondo_ids)
    drug_in = ", ".join(f"'{d}'" for d in drugbank_curies)

    cols: list[str] = []
    all_rows: list[tuple[Any, ...]] = []
    t_pipeline = time.time()

    for idx in range(MATRIX_SHARD_COUNT):
        shard_path = PARQUET_CACHE_DIR / f"matrix-scores-{idx:02d}.parquet"
        if shard_path.exists():
            print(
                f"     [shard {idx + 1}/{MATRIX_SHARD_COUNT}] cached at "
                f"{shard_path.relative_to(REPO_ROOT)} "
                f"({shard_path.stat().st_size / (1024 * 1024):.0f} MB)"
            )
        else:
            print(
                f"     [shard {idx + 1}/{MATRIX_SHARD_COUNT}] downloading ..."
            )
            try:
                _download_shard(idx, shard_path)
            except Exception as e:  # noqa: BLE001
                print(
                    f"     [shard {idx + 1}/{MATRIX_SHARD_COUNT}] FAILED to "
                    f"download ({e}); skipping with partial results"
                )
                continue

        sql = f"""
            SELECT
                source,
                target,
                untransformed_treat_score,
                transformed_treat_score,
                quantile_rank,
                rank_drug,
                quantile_drug,
                rank_disease,
                quantile_disease
            FROM read_parquet('{shard_path.as_posix()}')
            WHERE target IN ({mondo_in})
              AND source IN ({drug_in})
        """
        t_query = time.time()
        try:
            rows = con.execute(sql).fetchall()
        except Exception as e:  # noqa: BLE001
            print(
                f"     [shard {idx + 1}/{MATRIX_SHARD_COUNT}] query failed: "
                f"{e.__class__.__name__}: {str(e).splitlines()[0]}"
            )
            if not keep_shards:
                shard_path.unlink(missing_ok=True)
            continue

        if not cols:
            cols = [d[0] for d in con.description]
        print(
            f"     [shard {idx + 1}/{MATRIX_SHARD_COUNT}] returned "
            f"{len(rows)} rows in {time.time() - t_query:.1f}s"
        )
        all_rows.extend(rows)

        if not keep_shards:
            shard_path.unlink(missing_ok=True)

    print(
        f"     total: {len(all_rows)} matched pairs across all shards in "
        f"{time.time() - t_pipeline:.1f}s"
    )

    out: dict[tuple[str, str], dict[str, Any]] = {}
    for row in all_rows:
        rec = dict(zip(cols, row))
        out[(rec["source"], rec["target"])] = rec
    return out


# ---------------------------------------------------------------------------
# Phase 5: Compose report
# ---------------------------------------------------------------------------

def compose_report(
    whel: dict[str, Any],
    mondo_confirmed: list[dict[str, Any]],
    compound_crosswalk: list[dict[str, Any]],
    matrix_hits: dict[tuple[str, str], dict[str, Any]],
) -> dict[str, Any]:
    print("[5/5] Composing coverage report ...")

    compounds = whel["compounds"]
    pair_signals = whel["pair_signals"]

    mondo_by_whel_name = {m["whel_name"]: m for m in mondo_confirmed}
    compound_by_whel_id = {c["whel_id"]: c for c in compound_crosswalk}

    # We need the Whel condition_id -> Whel condition_name link to evaluate
    # signal pairs. Pull conditions from Supabase. Already have signals.
    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    conditions = http_get_json(
        f"{base}/rest/v1/conditions?select=id,name",
        headers,
    )
    cond_name_by_id = {c["id"]: c["name"] for c in conditions}

    # Walk every active (compound, condition) pair and check coverage
    pair_records: list[dict[str, Any]] = []
    for (compound_id, condition_id), sigs in pair_signals.items():
        cmp_xw = compound_by_whel_id.get(compound_id, {})
        compound_name = next((c["name"] for c in compounds if c["id"] == compound_id), "?")
        condition_name = cond_name_by_id.get(condition_id, "?")
        mondo_entry = mondo_by_whel_name.get(condition_name)
        matrix_mondo = mondo_entry["matrix_id"] if mondo_entry else None
        matrix_source = cmp_xw.get("matrix_source_id")
        hit = (
            matrix_hits.get((matrix_source, matrix_mondo))
            if matrix_source and matrix_mondo
            else None
        )
        pair_records.append({
            "compound_id": compound_id,
            "compound_name": compound_name,
            "condition_id": condition_id,
            "condition_name": condition_name,
            "whel_signal_count": len(sigs),
            "whel_signal_types": sorted({s["signal_type"] for s in sigs}),
            "whel_tiers": sorted({s["confidence_tier"] for s in sigs if s.get("confidence_tier")}),
            "matrix_source_id": matrix_source,
            "matrix_mondo": matrix_mondo,
            "compound_match_status": cmp_xw.get("match_status", "not_found"),
            "condition_match_status": mondo_entry["match_status"] if mondo_entry else "not_found",
            "matrix_hit": hit is not None,
            "matrix_transformed_score": hit["transformed_treat_score"] if hit else None,
            "matrix_untransformed_score": hit["untransformed_treat_score"] if hit else None,
            "matrix_quantile_rank": hit["quantile_rank"] if hit else None,
        })

    # Aggregate stats
    total_compounds = len(compounds)
    compounds_matched = sum(
        1 for r in compound_crosswalk if r["match_status"] == "matched"
    )
    # Adjusted denominator: exclude class-label umbrellas and non-drug
    # entries (supplements, lifestyle) before computing the headline match
    # rate. MATRIX is a drug-disease graph and cannot score either category,
    # so they should not penalise coverage. See UMBRELLA_LABEL_RAW /
    # NON_DRUG_LABEL_RAW for the explicit lists.
    compounds_class_label = sum(
        1 for r in compound_crosswalk if r.get("is_class_label")
    )
    compounds_non_drug = sum(
        1 for r in compound_crosswalk if r.get("is_non_drug")
    )
    compounds_eligible_total = sum(
        1 for r in compound_crosswalk
        if not r.get("is_class_label") and not r.get("is_non_drug")
    )
    compounds_eligible_matched = sum(
        1 for r in compound_crosswalk
        if r["match_status"] == "matched"
        and not r.get("is_class_label")
        and not r.get("is_non_drug")
    )
    total_conditions = len(WHEL_CONDITIONS)
    conditions_matched = sum(1 for m in mondo_confirmed if m["match_status"] == "exact")
    conditions_id_name_mismatch = sum(
        1 for m in mondo_confirmed if m["match_status"] == "id_exists_name_mismatch"
    )
    conditions_name_only = sum(
        1 for m in mondo_confirmed if m["match_status"] == "name_match_id_differs"
    )
    conditions_not_found = sum(
        1 for m in mondo_confirmed if m["match_status"] == "not_found"
    )
    # Pair-level eligibility flags use the same compound exclusions: a
    # (compound, condition) pair where the compound is a class label or
    # non-drug entry is NOT counted toward the eligible-for-MATRIX-lookup
    # denominator. This is the pair-level twin of the compound-rate fix.
    excluded_compound_ids = {
        r["whel_id"] for r in compound_crosswalk
        if r.get("is_class_label") or r.get("is_non_drug")
    }
    total_pairs = len(pair_records)
    pairs_with_coverage = sum(1 for p in pair_records if p["matrix_hit"])
    pairs_eligible_raw = sum(
        1
        for p in pair_records
        if p["compound_match_status"] == "matched" and p["condition_match_status"] == "exact"
    )
    pairs_eligible_adjusted = sum(
        1
        for p in pair_records
        if p["compound_match_status"] == "matched"
        and p["condition_match_status"] == "exact"
        and p["compound_id"] not in excluded_compound_ids
    )
    # Keep the original variable name for downstream code; the raw count
    # remains what `eligible_pairs_for_matrix_lookup` has always meant
    # (matched compound x exact condition). The adjusted count is reported
    # alongside it.
    pairs_eligible = pairs_eligible_raw

    # Score distribution among hits. NULL scores happen in matrix-scores
    # when MATRIX recorded a row but the transformed score is missing
    # (e.g. rank-only entries). Filter them out before stats so we don't
    # try to compare None to float.
    hit_scores = [
        p["matrix_transformed_score"]
        for p in pair_records
        if p["matrix_hit"] and p["matrix_transformed_score"] is not None
    ]
    if hit_scores:
        hit_scores.sort()
        n = len(hit_scores)
        score_stats = {
            "n": n,
            "min": hit_scores[0],
            "p25": hit_scores[n // 4],
            "median": hit_scores[n // 2],
            "p75": hit_scores[(3 * n) // 4],
            "max": hit_scores[-1],
            "mean": sum(hit_scores) / n,
        }
    else:
        score_stats = {"n": 0}

    return {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "summary": {
            "whel_compounds_total": total_compounds,
            "whel_compounds_matched_to_drugbank": compounds_matched,
            "whel_compounds_match_rate": (
                round(compounds_matched / total_compounds, 3) if total_compounds else 0
            ),
            # Adjusted compound denominator (class labels and non-drug entries
            # removed). The raw rate above is preserved for continuity with
            # earlier runs; the adjusted rate is the honest number for
            # reporting MATRIX coverage of Whel's drug surface.
            "whel_compounds_class_label_excluded": compounds_class_label,
            "whel_compounds_non_drug_excluded": compounds_non_drug,
            "whel_compounds_eligible_total": compounds_eligible_total,
            "whel_compounds_eligible_matched": compounds_eligible_matched,
            "whel_compounds_match_rate_adjusted": (
                round(compounds_eligible_matched / compounds_eligible_total, 3)
                if compounds_eligible_total else 0
            ),
            "whel_compounds_matched_via_brand_dict": sum(
                1 for r in compound_crosswalk if r.get("matched_via_brand_dict")
            ),
            "whel_conditions_total": total_conditions,
            "whel_conditions_confirmed_in_mondo": conditions_matched,
            "whel_conditions_id_exists_name_mismatch": conditions_id_name_mismatch,
            "whel_conditions_name_match_id_differs": conditions_name_only,
            "whel_conditions_not_found": conditions_not_found,
            "active_pair_count": total_pairs,
            "eligible_pairs_for_matrix_lookup": pairs_eligible,
            "eligible_pairs_for_matrix_lookup_adjusted": pairs_eligible_adjusted,
            "pairs_with_matrix_score": pairs_with_coverage,
            "coverage_rate_over_eligible": (
                round(pairs_with_coverage / pairs_eligible, 3) if pairs_eligible else 0
            ),
            "coverage_rate_over_eligible_adjusted": (
                round(pairs_with_coverage / pairs_eligible_adjusted, 3)
                if pairs_eligible_adjusted else 0
            ),
            "coverage_rate_over_all_active": (
                round(pairs_with_coverage / total_pairs, 3) if total_pairs else 0
            ),
            "matrix_score_distribution_among_hits": score_stats,
        },
        "mondo_confirmed": mondo_confirmed,
        "compound_crosswalk": compound_crosswalk,
        "pair_records": pair_records,
    }


def write_markdown_summary(report: dict[str, Any]) -> None:
    s = report["summary"]
    lines = []
    lines.append("# MATRIX coverage sanity check\n")
    lines.append(f"Generated: {report['generated_at']}\n\n")

    # Dataset revision snapshot — names exactly which version of the source
    # MATRIX repos this audit was computed against. The auto-converted
    # Parquet URL cannot be revision-pinned, but the source SHA gives us a
    # reproducibility anchor.
    snapshot = report.get("dataset_snapshot", {})
    if snapshot:
        lines.append("## Dataset snapshot\n\n")
        lines.append("| Dataset | Repo | SHA | Last modified |\n")
        lines.append("|---|---|---|---|\n")
        for short_name, info in snapshot.items():
            sha_display = (info.get("sha") or "")[:12] or "n/a"
            lm = info.get("last_modified") or "n/a"
            lines.append(
                f"| {short_name} | `{info['repo']}` | `{sha_display}` | {lm} |\n"
            )
            if info.get("error"):
                lines.append(f"|  | _error_ |  | {info['error']} |\n")
        lines.append("\n")
        lines.append(
            "_The MATRIX auto-converted Parquet URL cannot be pinned to a "
            "specific dataset revision; HF's datasets-server regenerates "
            "Parquet from the latest revision on a schedule. The SHA above "
            "is the source-repo SHA at audit run time. If this differs from "
            "a previous run, headline-number drift is attributable to a "
            "known upstream change._\n\n"
        )

    lines.append("## Headline numbers\n\n")
    lines.append(
        f"- **Compounds matched to MATRIX DrugBank IDs (raw):** "
        f"{s['whel_compounds_matched_to_drugbank']} / {s['whel_compounds_total']} "
        f"({s['whel_compounds_match_rate'] * 100:.1f}%)\n"
    )
    if s.get("whel_compounds_eligible_total"):
        excl = (
            s.get("whel_compounds_class_label_excluded", 0)
            + s.get("whel_compounds_non_drug_excluded", 0)
        )
        lines.append(
            f"- **Compounds matched (adjusted, drug-only denominator):** "
            f"{s['whel_compounds_eligible_matched']} / "
            f"{s['whel_compounds_eligible_total']} "
            f"({s['whel_compounds_match_rate_adjusted'] * 100:.1f}%) "
            f"\u2014 excludes {s.get('whel_compounds_class_label_excluded', 0)} "
            f"class-label umbrellas and "
            f"{s.get('whel_compounds_non_drug_excluded', 0)} non-drug entries "
            f"({excl} total).\u00b2\n"
        )
    if s.get("whel_compounds_matched_via_brand_dict"):
        lines.append(
            f"- **Compounds rescued by brand-dictionary fallback:** "
            f"{s['whel_compounds_matched_via_brand_dict']} \u2014 brand strings "
            f"(e.g. \"Wellbutrin\", \"Veozah\") whose underlying generic IS in "
            f"MATRIX but whose Whel `name` field did not match the drug-list "
            f"index directly. The dictionary is surfaced on "
            f"[/about/external-references](../../app/about/external-references) "
            f"so the translations are auditable.\n"
        )
    lines.append(
        f"- **Conditions confirmed in MATRIX disease-list (id + name agree):** "
        f"{s['whel_conditions_confirmed_in_mondo']} / {s['whel_conditions_total']}\n"
    )
    if s.get("whel_conditions_id_exists_name_mismatch"):
        lines.append(
            f"- **Conditions where Whel's MONDO ID exists but points to a "
            f"different disease:** {s['whel_conditions_id_exists_name_mismatch']} "
            f"(EXCLUDED from Phase 4 score lookup)\n"
        )
    if s.get("whel_conditions_name_match_id_differs"):
        lines.append(
            f"- **Conditions with a name match under a different MONDO ID:** "
            f"{s['whel_conditions_name_match_id_differs']} (review and re-map)\n"
        )
    if s.get("whel_conditions_not_found"):
        lines.append(
            f"- **Conditions not present in MATRIX disease-list at all:** "
            f"{s['whel_conditions_not_found']}\n"
        )
    lines.append(
        f"- **Active Whel (compound, condition) pairs:** {s['active_pair_count']}\n"
    )
    lines.append(
        f"- **Pairs eligible for MATRIX lookup** (both sides matched, raw): "
        f"{s['eligible_pairs_for_matrix_lookup']}\n"
    )
    if s.get("eligible_pairs_for_matrix_lookup_adjusted") is not None:
        lines.append(
            f"- **Pairs eligible for MATRIX lookup (adjusted, drug-only):** "
            f"{s['eligible_pairs_for_matrix_lookup_adjusted']} "
            f"\u2014 same exclusion rule as the adjusted compound match rate.\n"
        )
    lines.append(
        f"- **Pairs that actually have a MATRIX score:** "
        f"{s['pairs_with_matrix_score']} "
        f"({s['coverage_rate_over_eligible'] * 100:.1f}% of raw eligible, "
        f"{s.get('coverage_rate_over_eligible_adjusted', 0) * 100:.1f}% of adjusted eligible, "
        f"{s['coverage_rate_over_all_active'] * 100:.1f}% of all active)\n\n"
    )
    if s.get("whel_compounds_eligible_total"):
        lines.append(
            "\u00b2 The adjusted denominator excludes drug-class umbrella strings "
            "(e.g. \"GLP-1 Receptor Agonists\") and non-drug entries "
            "(supplements, lifestyle changes). MATRIX is a drug-disease "
            "prediction graph and cannot score either category, so counting "
            "them as misses understates real coverage. The raw count is kept "
            "for continuity with earlier runs. See "
            "`scripts/audit-output/unmatched-compounds-walk.md` for the "
            "explicit lists.\n\n"
        )

    sd = s["matrix_score_distribution_among_hits"]
    if sd["n"]:
        lines.append("## Score distribution (transformed_treat_score) among hits\n\n")
        lines.append(f"- n: {sd['n']}\n")
        lines.append(f"- min: {sd['min']:.3f}\n")
        lines.append(f"- p25: {sd['p25']:.3f}\n")
        lines.append(f"- median: {sd['median']:.3f}\n")
        lines.append(f"- p75: {sd['p75']:.3f}\n")
        lines.append(f"- max: {sd['max']:.3f}\n")
        lines.append(f"- mean: {sd['mean']:.3f}\n\n")

    lines.append("## Condition mapping\n\n")
    lines.append(
        "| Whel condition | Expected MONDO | Status | What MATRIX says "
        "| Official MATRIX filter\u00b9 |\n"
    )
    lines.append("|---|---|---|---|---|\n")
    any_filter_seen = False
    for m in report["mondo_confirmed"]:
        matrix_view = (
            f"`{m['matrix_id']}` = {m['matrix_name']!r}"
            if m.get("matrix_id")
            else "(not present)"
        )
        filter_val = m.get("matrix_official_filter")
        if filter_val is True:
            filter_cell = "True"
            any_filter_seen = True
        elif filter_val is False:
            filter_cell = "False"
            any_filter_seen = True
        else:
            filter_cell = "_n/a_"
        lines.append(
            f"| {m['whel_name']} | `{m['expected_mondo']}` | "
            f"{m['match_status']} | {matrix_view} | {filter_cell} |\n"
        )
        if m.get("ontology_gap_note"):
            lines.append(
                f"|  | _ontology gap_ |  | {m['ontology_gap_note']} |  |\n"
            )
    if any_filter_seen:
        lines.append(
            "\n\u00b9 `official_matrix_filter` is MATRIX's stated intent flag for a "
            "disease, not a strict gate on which (drug, disease) rows receive scores. "
            "Endometriosis carries `False` here yet has predictions in this audit; "
            "PMDD carries `True` yet returns zero direct predictions. Treat the flag "
            "as context, not as an explanation of coverage.\n"
        )
    else:
        lines.append(
            "\n\u00b9 `official_matrix_filter` column was not present in the MATRIX "
            "disease-list schema at audit time; cells are marked _n/a_.\n"
        )

    # Compounds not matched (most actionable list)
    unmatched = [
        c for c in report["compound_crosswalk"] if c["match_status"] == "not_found"
    ]
    if unmatched:
        lines.append(f"\n## Compounds NOT matched to MATRIX ({len(unmatched)})\n\n")
        for c in sorted(unmatched, key=lambda x: x["whel_name"].lower()):
            lines.append(f"- {c['whel_name']}\n")

    # Pairs with NO coverage despite eligibility
    no_hit_eligible = [
        p
        for p in report["pair_records"]
        if not p["matrix_hit"]
        and p["compound_match_status"] == "matched"
        and p["condition_match_status"] == "exact"
    ]
    if no_hit_eligible:
        lines.append(
            f"\n## Eligible pairs without MATRIX coverage ({len(no_hit_eligible)})\n\n"
        )
        for p in sorted(
            no_hit_eligible, key=lambda x: (x["condition_name"], x["compound_name"])
        ):
            lines.append(
                f"- {p['compound_name']} -> {p['condition_name']} "
                f"({p['matrix_source_id']} x {p['matrix_mondo']})\n"
            )

    SUMMARY_MD.write_text("".join(lines))


# ---------------------------------------------------------------------------
# Public-facing snapshot emit
#
# Transforms the internal audit report into the lean shape consumed by the
# website at lib/matrix-audit-snapshot.json. Only the numbers we actually
# publish are included; everything intermediate stays in REPORT_JSON for
# internal review.
# ---------------------------------------------------------------------------

def emit_public_snapshot(report: dict[str, Any]) -> None:
    s = report["summary"]
    dataset_snapshot = report.get("dataset_snapshot", {})
    pair_records = report.get("pair_records", [])
    mondo_confirmed = report.get("mondo_confirmed", [])

    # Per-condition predictions count: matrix_hit=True rows in pair_records
    # bucketed by condition_name. This is the count of (Whel compound, this
    # condition) pairs that actually got a MATRIX score back -- the honest
    # number to publish per condition.
    predictions_by_condition: dict[str, int] = {}
    for p in pair_records:
        if p.get("matrix_hit"):
            cond = p.get("condition_name") or "?"
            predictions_by_condition[cond] = predictions_by_condition.get(cond, 0) + 1

    per_condition: list[dict[str, Any]] = []
    for m in mondo_confirmed:
        per_condition.append({
            "condition": m["whel_name"],
            "mondo": m["expected_mondo"],
            "matrix_official_filter": m.get("matrix_official_filter"),
            "predictions_in_audit": predictions_by_condition.get(m["whel_name"], 0),
            "note": m.get("ontology_gap_note"),
        })

    snapshot = {
        "_meta": {
            "schema_version": PUBLIC_SNAPSHOT_SCHEMA_VERSION,
            "purpose": (
                "Published MATRIX coverage snapshot for "
                "/about/external-references. Refreshed at the end of every "
                "scripts/check-matrix-coverage.py run."
            ),
            "snapshot_label": "audit run",
            "audit_date": time.strftime("%Y-%m-%d", time.gmtime()),
            "audit_script": "scripts/check-matrix-coverage.py",
            "audit_output_report": "scripts/audit-output/matrix-coverage-report.json",
        },
        "dataset_snapshot": {
            short_name: {
                "repo": info.get("repo"),
                "sha": info.get("sha"),
                "last_modified": info.get("last_modified"),
            }
            for short_name, info in dataset_snapshot.items()
        },
        "headline": {
            "compounds_total": s.get("whel_compounds_total"),
            "compounds_matched_raw": s.get("whel_compounds_matched_to_drugbank"),
            "compound_match_rate_raw": s.get("whel_compounds_match_rate"),
            "compounds_eligible_total": s.get("whel_compounds_eligible_total"),
            "compounds_eligible_matched": s.get("whel_compounds_eligible_matched"),
            "compound_match_rate_adjusted": s.get("whel_compounds_match_rate_adjusted"),
            "compounds_excluded_class_label": s.get("whel_compounds_class_label_excluded"),
            "compounds_excluded_non_drug": s.get("whel_compounds_non_drug_excluded"),
            "compounds_rescued_by_brand_dict": s.get("whel_compounds_matched_via_brand_dict"),
            "conditions_total": s.get("whel_conditions_total"),
            "conditions_confirmed_in_mondo": s.get("whel_conditions_confirmed_in_mondo"),
            "active_pairs": s.get("active_pair_count"),
            "eligible_pairs_adjusted": s.get("eligible_pairs_for_matrix_lookup_adjusted"),
            "pairs_with_matrix_score": s.get("pairs_with_matrix_score"),
            "coverage_rate_over_eligible_adjusted": s.get("coverage_rate_over_eligible_adjusted"),
            "coverage_rate_over_all_active": s.get("coverage_rate_over_all_active"),
        },
        "per_condition": per_condition,
        "score_distribution": s.get("matrix_score_distribution_among_hits", {}),
    }
    PUBLIC_SNAPSHOT_JSON.write_text(json.dumps(snapshot, indent=2, default=str))
    print(
        f"  Snapshot:     {PUBLIC_SNAPSHOT_JSON.relative_to(REPO_ROOT)} "
        f"(consumed by /about/external-references)"
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    load_env_local()

    print("[0/5] Capturing MATRIX dataset revisions from Hugging Face ...")
    dataset_snapshot = fetch_matrix_dataset_revisions()
    for short_name, info in dataset_snapshot.items():
        if info["error"]:
            print(f"  - {short_name:16s} {info['repo']:32s} ERROR: {info['error']}")
        else:
            sha_short = (info["sha"] or "")[:8]
            print(
                f"  - {short_name:16s} {info['repo']:32s} sha={sha_short} "
                f"lastModified={info['last_modified']}"
            )
    check_pin_override(dataset_snapshot)
    print()

    whel = _cached(WHEL_CACHE, "Whel data (phase 1)", pull_whel_data)
    # Rebuild the tuple-keyed pair_signals lookup that compose_report needs;
    # we don't cache it because JSON cannot encode tuple keys.
    pair_signals: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for s in whel["signals"]:
        pair_signals.setdefault((s["compound_id"], s["condition_id"]), []).append(s)
    whel["pair_signals"] = pair_signals

    mondo_confirmed = _cached(
        MONDO_CACHE, "MONDO confirmations (phase 2)", confirm_mondo_ids
    )
    drug_list = _cached(
        DRUG_LIST_CACHE, "MATRIX drug-list (phase 3a)", pull_drug_list
    )
    compound_crosswalk = _cached(
        CROSSWALK_CACHE,
        "Compound crosswalk (phase 3b)",
        build_compound_crosswalk,
        whel["compounds"],
        drug_list,
    )

    # CRITICAL: only feed Phase 4 the MONDO IDs whose row name actually
    # agreed with our condition. An ID that exists in the disease-list
    # but maps to a different disease (the MONDO:0006471 -> Tracheal
    # adenoid cystic carcinoma trap) would otherwise leak Phase 4 scores
    # under the wrong condition label.
    mondo_ids = [
        m["matrix_id"]
        for m in mondo_confirmed
        if m["matrix_id"] and m.get("match_status") == "exact"
    ]
    skipped_for_name_mismatch = [
        m for m in mondo_confirmed if m.get("match_status") == "id_exists_name_mismatch"
    ]
    if skipped_for_name_mismatch:
        print(
            f"\n  WARNING: skipping {len(skipped_for_name_mismatch)} condition(s) "
            f"from Phase 4 because their MONDO ID resolves to a different "
            f"disease in the MATRIX disease-list:"
        )
        for m in skipped_for_name_mismatch:
            print(
                f"    - {m['whel_name']:30s} expected {m['expected_mondo']:18s} "
                f"-> MATRIX says {m['matrix_id']} = {m['matrix_name']!r}"
            )
        print()
    drugbank_curies = [
        c["matrix_source_id"]
        for c in compound_crosswalk
        if c["matrix_source_id"]
    ]

    # Phase 4 caches its result as a list of records so a downstream
    # crash (in compose_report or the markdown writer) doesn't force a
    # ~36 GB re-download. Delete phase4-matrix-hits.json to force a
    # fresh shard scan.
    def _run_phase4_to_list() -> list[dict[str, Any]]:
        hits = query_matrix_scores(mondo_ids, drugbank_curies)
        return [
            {"source": src, "target": tgt, **rec}
            for (src, tgt), rec in hits.items()
        ]

    hits_list = _cached(
        MATRIX_HITS_CACHE, "MATRIX hits (phase 4)", _run_phase4_to_list
    )
    matrix_hits: dict[tuple[str, str], dict[str, Any]] = {
        (r["source"], r["target"]): {
            k: v for k, v in r.items() if k not in ("source", "target")
        }
        for r in hits_list
    }

    report = compose_report(whel, mondo_confirmed, compound_crosswalk, matrix_hits)
    report["dataset_snapshot"] = dataset_snapshot
    report["ontology_meta"] = {
        "ontology_json_path": str(ONTOLOGY_JSON_PATH.relative_to(REPO_ROOT)),
        "schema_version": ONTOLOGY_SCHEMA_VERSION,
    }

    REPORT_JSON.write_text(json.dumps(report, indent=2, default=str))
    write_markdown_summary(report)
    emit_public_snapshot(report)

    print()
    print("=" * 60)
    print("DONE.")
    print(f"  Raw report:   {REPORT_JSON.relative_to(REPO_ROOT)}")
    print(f"  Summary:      {SUMMARY_MD.relative_to(REPO_ROOT)}")
    print(f"  Public snap:  {PUBLIC_SNAPSHOT_JSON.relative_to(REPO_ROOT)}")
    print("=" * 60)
    s = report["summary"]
    print()
    print(
        f"  Compounds matched (raw): "
        f"{s['whel_compounds_matched_to_drugbank']}/{s['whel_compounds_total']} "
        f"({s['whel_compounds_match_rate'] * 100:.1f}%)"
    )
    if s.get("whel_compounds_eligible_total"):
        print(
            f"  Compounds matched (adjusted): "
            f"{s['whel_compounds_eligible_matched']}/"
            f"{s['whel_compounds_eligible_total']} "
            f"({s['whel_compounds_match_rate_adjusted'] * 100:.1f}%) "
            f"-- after excluding "
            f"{s.get('whel_compounds_class_label_excluded', 0)} class labels + "
            f"{s.get('whel_compounds_non_drug_excluded', 0)} non-drug entries"
        )
    print(
        f"  Conditions matched: "
        f"{s['whel_conditions_confirmed_in_mondo']}/{s['whel_conditions_total']}"
    )
    print(
        f"  Pairs with MATRIX score: "
        f"{s['pairs_with_matrix_score']}/{s['active_pair_count']} "
        f"({s['coverage_rate_over_all_active'] * 100:.1f}%)"
    )


if __name__ == "__main__":
    main()
