#!/usr/bin/env python3
# ---------------------------------------------------------------------------
# curate-guidelines.py
#
# Companion curator for the L3 path on `sources`. Migrations 041+042 put
# the five L-grade fields on the table (study_type, primary_endpoint_text,
# guideline_id, guideline_strength, guideline_certainty) and backfilled
# study_type. The first three of those are now classifier-fillable; the
# three guideline_* fields are not, because they require a human to read
# the actual guideline document and pull the body-assigned recommendation
# id, strength label, and certainty label.
#
# This script is the human-in-the-loop bridge.
#
#   1. --worklist (default)  Emit a CSV of every `sources` row where
#                            study_type='guideline'. Veronica fills the
#                            three blank columns from the source PDF.
#   2. --apply  WORKLIST.csv Read back the filled CSV, validate each row,
#                            and emit the next-numbered SQL migration that
#                            sets the three guideline_* columns on the
#                            curated rows. Untouched rows are left alone.
#   3. --explain SOURCE_ID  Print the row's title + journal + pmid + the
#                            body name the worklist heuristic would suggest,
#                            so Veronica can quickly orient before opening
#                            the PDF.
#
# Design notes:
#
#   * The script never writes to Supabase directly. The output is a SQL
#     migration file (043_*, 044_*, etc.) that Veronica reviews and applies
#     through the existing migration flow, identical to how
#     classify-sources-study-type.py emits 042.
#
#   * --apply auto-detects the next migration number by globbing
#     supabase/migrations/ for the highest NNN_ prefix and incrementing.
#     The same script can be re-run on a fresh worklist batch later and
#     will produce 044_, 045_, etc. without collision.
#
#   * The worklist is scoped to study_type='guideline' rows. That is the
#     subset the L-grade rubric expects to carry a body-assigned
#     recommendation id. Other study_types can in principle host the
#     triple too (a guideline section cited inside an SR/MA, for example),
#     but curating those is out of scope until the first pass lands.
#
#   * suggested_body is best-effort. It checks title + journal for known
#     guideline-body names (ESHRE, ACOG, NICE, etc.) and writes the first
#     match into the worklist as a CSV column. Veronica can overwrite it
#     in the CSV; --apply does not read suggested_body back.
#
#   * Validation in --apply mode requires every row to either (a) have all
#     three guideline_* fields non-empty, or (b) have a non-empty
#     skip_reason. Rows with partial fills cause a hard error and abort
#     the migration emission so a half-curated batch never lands.
#
# Usage:
#   python3 scripts/curate-guidelines.py                       # worklist
#   python3 scripts/curate-guidelines.py --worklist            # explicit
#   python3 scripts/curate-guidelines.py --apply <CSV_PATH>    # emit SQL
#   python3 scripts/curate-guidelines.py --explain <SOURCE_ID> # one row
# ---------------------------------------------------------------------------

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


REPO_ROOT = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = REPO_ROOT / "supabase" / "migrations"
WORKLIST_DEFAULT = REPO_ROOT / "scripts" / "guideline-curation-worklist.csv"

# CSV columns, in the order they appear in the worklist. The first eight
# are read-only context for the curator; the last four are the fields she
# fills. --apply only reads source_id + the four fillable fields.
#
# signal_id is singular: the `sources` table has a direct signal_id FK
# (each source row belongs to exactly one signal), not a many-to-many
# join. So the worklist shows the one signal each row supports.
WORKLIST_COLUMNS = [
    "source_id",
    "signal_id",
    "source_type",
    "study_type",
    "pmid",
    "journal",
    "title",
    "suggested_body",
    "guideline_id",
    "guideline_strength",
    "guideline_certainty",
    "skip_reason",
]

# Body-name patterns, checked in order. The first hit wins and is written
# into the worklist's suggested_body column. The set covers the bodies
# most likely to appear in the current sources corpus and the next wave
# of women's-health-adjacent guidelines.
SUGGESTED_BODY_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("ESHRE",            re.compile(r"\bESHRE\b", re.IGNORECASE)),
    ("ACOG",             re.compile(r"\bACOG\b|American College of Obstetricians", re.IGNORECASE)),
    ("NICE",             re.compile(r"\bNICE\b|National Institute for Health and Care Excellence", re.IGNORECASE)),
    ("NAMS",             re.compile(r"\bNAMS\b|North American Menopause Society", re.IGNORECASE)),
    ("Cochrane",         re.compile(r"\bCochrane\b", re.IGNORECASE)),
    ("WHO",              re.compile(r"\bWorld Health Organization\b|\bWHO\b", re.IGNORECASE)),
    ("Endocrine Society", re.compile(r"\bEndocrine Society\b", re.IGNORECASE)),
    ("ASRM",             re.compile(r"\bASRM\b|American Society for Reproductive Medicine", re.IGNORECASE)),
    ("EULAR",            re.compile(r"\bEULAR\b", re.IGNORECASE)),
    ("AACE",             re.compile(r"\bAACE\b|American Association of Clinical Endocrinologists", re.IGNORECASE)),
    ("AUA",              re.compile(r"\bAUA\b|American Urological Association", re.IGNORECASE)),
    ("FIGO",             re.compile(r"\bFIGO\b|International Federation of Gynecology", re.IGNORECASE)),
    ("IUGA",             re.compile(r"\bIUGA\b|International Urogynecological Association", re.IGNORECASE)),
    ("ISSVD",            re.compile(r"\bISSVD\b", re.IGNORECASE)),
    ("ISSWSH",           re.compile(r"\bISSWSH\b|International Society for the Study of Women.{1,5}s Sexual Health", re.IGNORECASE)),
    ("RCOG",             re.compile(r"\bRCOG\b|Royal College of Obstetricians", re.IGNORECASE)),
    ("SOGC",             re.compile(r"\bSOGC\b|Society of Obstetricians and Gynaecologists of Canada", re.IGNORECASE)),
    ("USPSTF",           re.compile(r"\bUSPSTF\b|US Preventive Services Task Force", re.IGNORECASE)),
    ("IMS",              re.compile(r"\bInternational Menopause Society\b", re.IGNORECASE)),
]


# ---------------------------------------------------------------------------
# Env loading + HTTP -- mirrors classify-sources-study-type.py conventions
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


def http_get_json_paginated(
    url: str,
    headers: dict[str, str] | None = None,
    page_size: int = 1000,
    max_tries: int = 5,
) -> list[dict[str, Any]]:
    """Range-paginated PostgREST fetch. PostgREST caps any single response
    at its configured `max-rows` (typically 1000) and silently truncates
    beyond that. We use the Range header so we can detect the 206 cap and
    keep walking. Mirrors the helper in check-matrix-coverage.py."""
    out: list[dict[str, Any]] = []
    offset = 0
    while True:
        page_headers = dict(headers or {})
        page_headers["Range-Unit"] = "items"
        page_headers["Range"] = f"{offset}-{offset + page_size - 1}"
        delay = 2.0
        last_resp: requests.Response | None = None
        for _ in range(max_tries):
            r = requests.get(url, headers=page_headers, timeout=60)
            if r.status_code == 429:
                time.sleep(delay)
                delay *= 2
                continue
            last_resp = r
            break
        if last_resp is None:
            raise RuntimeError(f"too many 429s on {url}")
        if last_resp.status_code not in (200, 206):
            last_resp.raise_for_status()
        page = last_resp.json()
        if not page:
            break
        out.extend(page)
        if len(page) < page_size:
            break
        offset += page_size
    return out


# ---------------------------------------------------------------------------
# Supabase reader
# ---------------------------------------------------------------------------

def fetch_guideline_rows() -> list[dict[str, Any]]:
    """Fetch every `sources` row where study_type='guideline', plus the
    three guideline_* columns so the worklist can mark already-curated
    rows. Probes for column existence first so the script can fail loudly
    if migration 041 has not been applied."""

    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    probe_url = (
        f"{base}/rest/v1/sources?select=id,study_type,guideline_id&limit=1"
    )
    probe = requests.get(probe_url, headers=headers, timeout=30)
    if probe.status_code == 400 and (
        "study_type" in probe.text or "guideline_id" in probe.text
    ):
        print(
            "ERROR: sources is missing study_type and/or guideline_id columns. "
            "Apply migration 041_sources_lgrade_fields.sql before running this "
            "script."
        )
        sys.exit(1)
    elif probe.status_code != 200:
        probe.raise_for_status()

    select_cols = (
        "id,signal_id,source_type,external_id,title,journal,key_finding_excerpt,"
        "study_type,guideline_id,guideline_strength,guideline_certainty"
    )
    url = (
        f"{base}/rest/v1/sources"
        f"?select={select_cols}"
        f"&study_type=eq.guideline"
        f"&order=id"
    )
    return http_get_json_paginated(url, headers)


# ---------------------------------------------------------------------------
# Body-name heuristic
# ---------------------------------------------------------------------------

def suggest_body(title: str | None, journal: str | None) -> str:
    text = " ".join(filter(None, [title, journal]))
    if not text:
        return ""
    for name, pattern in SUGGESTED_BODY_PATTERNS:
        if pattern.search(text):
            return name
    return ""


# ---------------------------------------------------------------------------
# Worklist emission
# ---------------------------------------------------------------------------

def emit_worklist(rows: list[dict[str, Any]], out_path: Path) -> None:
    body_counts: Counter = Counter()
    already_curated = 0
    partial_curated = 0

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=WORKLIST_COLUMNS)
        writer.writeheader()
        for r in rows:
            body = suggest_body(r.get("title"), r.get("journal"))
            if body:
                body_counts[body] += 1
            else:
                body_counts["(no match)"] += 1

            g_id = (r.get("guideline_id") or "").strip()
            g_str = (r.get("guideline_strength") or "").strip()
            g_cert = (r.get("guideline_certainty") or "").strip()
            triple_state = sum(1 for v in (g_id, g_str, g_cert) if v)
            if triple_state == 3:
                already_curated += 1
            elif triple_state > 0:
                partial_curated += 1

            writer.writerow({
                "source_id": r["id"],
                "signal_id": r.get("signal_id") or "",
                "source_type": r.get("source_type") or "",
                "study_type": r.get("study_type") or "",
                "pmid": r.get("external_id") or "",
                "journal": (r.get("journal") or "")[:200],
                "title": (r.get("title") or "")[:300],
                "suggested_body": body,
                "guideline_id": g_id,
                "guideline_strength": g_str,
                "guideline_certainty": g_cert,
                "skip_reason": "",
            })

    print(f"Wrote {len(rows)} rows to {out_path.relative_to(REPO_ROOT)}")
    print()
    print(f"  Already fully curated (all three fields set): {already_curated}")
    print(f"  Partially curated (1-2 fields set):           {partial_curated}")
    print(f"  Empty (need curation):                        {len(rows) - already_curated - partial_curated}")
    print()
    print("Suggested-body distribution:")
    for body, count in body_counts.most_common():
        print(f"  {body:<22} {count:>4}")
    print()
    print("Next step:")
    print(f"  1. Open {out_path.relative_to(REPO_ROOT)} in a spreadsheet.")
    print(f"  2. For each row, open the PDF for that source and fill:")
    print(f"       guideline_id        e.g. ESHRE-ENDO-2022-3.1")
    print(f"       guideline_strength  e.g. strong / conditional / A / B")
    print(f"       guideline_certainty e.g. high / moderate / low / very low")
    print(f"  3. If a row should not be curated, fill skip_reason instead.")
    print(f"  4. Re-run with --apply {out_path.relative_to(REPO_ROOT)} to emit SQL.")


# ---------------------------------------------------------------------------
# Apply mode (read filled CSV, emit migration)
# ---------------------------------------------------------------------------

def next_migration_number() -> int:
    """Scan supabase/migrations/ for the highest NNN_*.sql prefix and
    return prefix+1. Falls back to 43 if nothing is on disk yet."""
    highest = 0
    for entry in MIGRATIONS_DIR.glob("*.sql"):
        m = re.match(r"^(\d{3})_", entry.name)
        if m:
            n = int(m.group(1))
            if n > highest:
                highest = n
    return max(highest + 1, 43)


def sql_quote(s: str) -> str:
    """Postgres single-quote escaping. Mirrors classify-sources-study-type.py."""
    return "'" + s.replace("'", "''") + "'"


def load_worklist(csv_path: Path) -> list[dict[str, str]]:
    if not csv_path.exists():
        print(f"ERROR: worklist not found at {csv_path}")
        sys.exit(1)
    with csv_path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing_cols = [c for c in WORKLIST_COLUMNS if c not in (reader.fieldnames or [])]
        if missing_cols:
            print(f"ERROR: worklist is missing columns: {missing_cols}")
            print(f"  Expected: {WORKLIST_COLUMNS}")
            print(f"  Found:    {reader.fieldnames}")
            sys.exit(1)
        return [dict(row) for row in reader]


def validate_and_partition(
    rows: list[dict[str, str]],
) -> tuple[list[dict[str, str]], list[tuple[int, str]]]:
    """Returns (curated_rows, errors). errors is a list of (line_number,
    message) tuples. A row counts as curated when all three guideline_*
    fields are non-empty. A row counts as skipped (silently ignored) when
    skip_reason is non-empty. Any other state is an error."""

    curated: list[dict[str, str]] = []
    errors: list[tuple[int, str]] = []

    seen_ids: set[str] = set()
    for idx, row in enumerate(rows, start=2):  # +1 for header, +1 for 1-based
        sid = (row.get("source_id") or "").strip()
        if not sid:
            errors.append((idx, "missing source_id"))
            continue
        if sid in seen_ids:
            errors.append((idx, f"duplicate source_id {sid}"))
            continue
        seen_ids.add(sid)

        g_id = (row.get("guideline_id") or "").strip()
        g_str = (row.get("guideline_strength") or "").strip()
        g_cert = (row.get("guideline_certainty") or "").strip()
        skip = (row.get("skip_reason") or "").strip()

        triple_count = sum(1 for v in (g_id, g_str, g_cert) if v)

        if skip and triple_count > 0:
            errors.append((
                idx,
                f"row {sid} has both skip_reason and partial/full curation; "
                "pick one",
            ))
            continue
        if skip:
            continue  # silently ignored
        if triple_count == 0:
            # Empty row, no skip_reason; treat as "not yet curated, skip
            # silently". This is the expected state for un-touched rows in
            # a partially-completed worklist and should NOT block a partial
            # migration emission.
            continue
        if triple_count < 3:
            errors.append((
                idx,
                f"row {sid} has {triple_count}/3 guideline_* fields filled "
                "(need all three or skip_reason)",
            ))
            continue
        curated.append({
            "source_id": sid,
            "guideline_id": g_id,
            "guideline_strength": g_str,
            "guideline_certainty": g_cert,
        })
    return curated, errors


def emit_migration(curated: list[dict[str, str]], out_path: Path) -> None:
    derived_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Distribution summary in the SQL header for reviewability.
    body_counts: Counter = Counter()
    strength_counts: Counter = Counter()
    certainty_counts: Counter = Counter()
    for row in curated:
        # The "body" portion of guideline_id is the part before the first
        # dash, by convention (e.g. "ESHRE-ENDO-2022-3.1" -> "ESHRE").
        gid = row["guideline_id"]
        body = gid.split("-", 1)[0] if "-" in gid else gid
        body_counts[body] += 1
        strength_counts[row["guideline_strength"]] += 1
        certainty_counts[row["guideline_certainty"]] += 1

    lines: list[str] = []
    lines.append(f"-- {out_path.name}")
    lines.append("-- Auto-generated by scripts/curate-guidelines.py")
    lines.append(f"-- on {derived_at}. Do not hand-edit; re-run --apply.")
    lines.append("--")
    lines.append("-- Curates guideline_id + guideline_strength + guideline_certainty")
    lines.append("-- on `sources` rows previously classified study_type='guideline'.")
    lines.append("-- Unlocks the L3 path in scripts/check-matrix-coverage.py Phase 6")
    lines.append("-- for every signal that has at least one source row covered here.")
    lines.append("--")
    lines.append(f"-- Coverage: {len(curated)} rows curated in this batch.")
    lines.append("--")
    lines.append("-- guideline body distribution (prefix-of-guideline_id):")
    for body, count in body_counts.most_common():
        lines.append(f"--   {body:<18} {count:>4}")
    lines.append("--")
    lines.append("-- guideline_strength distribution:")
    for label, count in strength_counts.most_common():
        lines.append(f"--   {label:<18} {count:>4}")
    lines.append("--")
    lines.append("-- guideline_certainty distribution:")
    for label, count in certainty_counts.most_common():
        lines.append(f"--   {label:<18} {count:>4}")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")

    for row in curated:
        lines.append(
            "UPDATE sources SET "
            f"guideline_id        = {sql_quote(row['guideline_id'])}, "
            f"guideline_strength  = {sql_quote(row['guideline_strength'])}, "
            f"guideline_certainty = {sql_quote(row['guideline_certainty'])} "
            f"WHERE id = {sql_quote(row['source_id'])};"
        )

    lines.append("")
    lines.append("COMMIT;")
    lines.append("")

    out_path.write_text("\n".join(lines))


# ---------------------------------------------------------------------------
# Explain mode
# ---------------------------------------------------------------------------

def explain_one(source_id: str) -> None:
    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    select_cols = (
        "id,signal_id,source_type,external_id,title,journal,key_finding_excerpt,"
        "study_type,guideline_id,guideline_strength,guideline_certainty"
    )
    url = (
        f"{base}/rest/v1/sources"
        f"?select={select_cols}"
        f"&id=eq.{source_id}"
        f"&limit=1"
    )
    rows = http_get_json(url, headers)
    if not rows:
        print(f"No row with id={source_id}")
        sys.exit(1)
    r = rows[0]
    body = suggest_body(r.get("title"), r.get("journal"))

    print(f"id                  {r['id']}")
    print(f"signal_id           {r.get('signal_id')}")
    print(f"source_type         {r.get('source_type')}")
    print(f"external_id (pmid)  {r.get('external_id')}")
    print(f"study_type          {r.get('study_type')}")
    print(f"title               {(r.get('title') or '')[:200]}")
    print(f"journal             {r.get('journal')}")
    print(f"excerpt             {(r.get('key_finding_excerpt') or '')[:200]}")
    print("--")
    print(f"suggested_body      {body or '(no regex match)'}")
    print("--")
    print(f"guideline_id        {r.get('guideline_id') or '(unset)'}")
    print(f"guideline_strength  {r.get('guideline_strength') or '(unset)'}")
    print(f"guideline_certainty {r.get('guideline_certainty') or '(unset)'}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--worklist",
        action="store_true",
        help=(
            "Emit a CSV worklist of every guideline-typed source row "
            f"to {WORKLIST_DEFAULT.relative_to(REPO_ROOT)} (default)."
        ),
    )
    group.add_argument(
        "--apply",
        metavar="WORKLIST_CSV",
        type=Path,
        help="Read a filled worklist CSV and emit the next-numbered SQL migration.",
    )
    group.add_argument(
        "--explain",
        metavar="SOURCE_ID",
        help="Print context for a single source_id (title, body suggestion, signals).",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=WORKLIST_DEFAULT,
        help=f"Override worklist CSV output path (default: {WORKLIST_DEFAULT.relative_to(REPO_ROOT)}).",
    )
    args = parser.parse_args()

    load_env_local()

    if args.explain:
        explain_one(args.explain)
        return

    if args.apply:
        rows = load_worklist(args.apply)
        curated, errors = validate_and_partition(rows)
        if errors:
            print("ERROR: worklist has validation problems; no migration written.")
            for line_no, msg in errors:
                print(f"  line {line_no}: {msg}")
            sys.exit(1)
        if not curated:
            print("No curated rows found in worklist. Nothing to emit.")
            print("  (Rows must have all three guideline_* fields filled.)")
            return
        n = next_migration_number()
        out_path = MIGRATIONS_DIR / f"{n:03d}_backfill_guideline_curation.sql"
        emit_migration(curated, out_path)
        print(f"Wrote {len(curated)} curated rows to {out_path.relative_to(REPO_ROOT)}.")
        print("Review the SQL and apply through your usual migration flow.")
        return

    # Default: --worklist (whether passed explicitly or implicitly).
    rows = fetch_guideline_rows()
    print(f"Fetched {len(rows)} guideline-typed source rows from Supabase.")
    if not rows:
        print()
        print("Nothing to do. study_type='guideline' returned zero rows. Has")
        print("migration 042_backfill_study_type.sql been applied?")
        return
    emit_worklist(rows, args.out)


if __name__ == "__main__":
    main()
