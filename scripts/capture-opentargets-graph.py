#!/usr/bin/env python3
"""Path B capture: turn the Open Targets drug->target->disease structure we already
fetch into real graph rows (migration 052's tables).

Reads the canonical compounds (chembl_id, from Path A) and conditions (efo/mondo id)
from Supabase, queries the Open Targets Platform GraphQL API once per condition, and
EMITS a reviewable backfill migration:

    supabase/migrations/055_backfill_graph.sql

It writes NOTHING to the database directly (repo convention; mirrors
scripts/resolve-canonical-ids.py). The migration is idempotent: targets upsert on
ensembl_gene_id, edges insert-on-conflict on their unique keys, so it is safe to
re-run. Apply migration 052 (graph schema) first, then 055.

API: https://api.platform.opentargets.org/api/v4/graphql  (public, no auth, free)
No Claude/LLM cost. (Persisting structure also lets the old summarization call go.)

Usage:  python3 scripts/capture-opentargets-graph.py
Output: supabase/migrations/055_backfill_graph.sql
        scripts/audit-output/graph-capture-report.json
"""
import os
import ssl
import json
import time
import pathlib
import datetime
import urllib.request

REPO = pathlib.Path(__file__).resolve().parent.parent
DOTENV = REPO / ".env.local"
MIGRATION = REPO / "supabase" / "migrations" / "055_backfill_graph.sql"
REPORT_DIR = REPO / "scripts" / "audit-output"
REPORT = REPORT_DIR / "graph-capture-report.json"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

OT_GRAPHQL = "https://api.platform.opentargets.org/api/v4/graphql"
UA = "Whel-Path-B-Capture/0.1 (https://whel.bio; mailto:vla2117@columbia.edu)"
_CTX = ssl.create_default_context()
SLEEP = 0.3
ASSOC_PAGE_SIZE = 25

DISEASE_QUERY = """
query DiseaseData($efoId: String!) {
  disease(efoId: $efoId) {
    id
    name
    drugAndClinicalCandidates {
      rows {
        drug {
          id
          name
          mechanismsOfAction {
            rows {
              mechanismOfAction
              actionType
              targets { id approvedSymbol approvedName }
            }
          }
        }
      }
    }
    associatedTargets(page: {index: 0, size: %d}) {
      rows {
        target { id approvedSymbol approvedName }
        score
        datatypeScores { id score }
      }
    }
  }
}
""" % ASSOC_PAGE_SIZE


# ── env + supabase (read-only), mirrored from resolve-canonical-ids.py ────────
def load_dotenv(path=DOTENV):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and not os.environ.get(k):
            os.environ[k] = v


def sb_get(path):
    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not base or not key:
        raise RuntimeError("NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY not set in .env.local")
    req = urllib.request.Request(
        f"{base}/rest/v1/{path}",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Accept": "application/json", "User-Agent": UA},
    )
    last = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30, context=_CTX) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Supabase read failed: {last}")


def ot_query(efo_id):
    body = json.dumps({"query": DISEASE_QUERY, "variables": {"efoId": efo_id}}).encode()
    req = urllib.request.Request(
        OT_GRAPHQL, data=body, method="POST",
        headers={"Content-Type": "application/json", "User-Agent": UA},
    )
    last = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40, context=_CTX) as r:
                data = json.load(r)
            if data.get("errors"):
                raise RuntimeError(data["errors"][0].get("message"))
            return (data.get("data") or {}).get("disease")
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Open Targets query failed for {efo_id}: {last}")


def sqlq(v):
    return "'" + str(v).replace("'", "''") + "'"


def num(v):
    """A safe numeric literal (or 'null')."""
    return "null" if v is None else repr(float(v))


def ot_disease_id(cond):
    raw = cond.get("efo_id") or cond.get("mondo_id")
    if not raw:
        return None
    return str(raw).replace(":", "_")   # OT uses EFO_xxxx / MONDO_xxxx


def main():
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print("Path B capture — reading core tables (read-only)…")
    conditions = sb_get("conditions?select=id,slug,name,efo_id,mondo_id")
    compounds = sb_get("compounds?select=id,chembl_id")
    chembl_to_compound = {c["chembl_id"]: c["id"] for c in compounds if c.get("chembl_id")}
    print(f"  conditions={len(conditions)}  compounds_with_chembl={len(chembl_to_compound)}")

    targets = {}            # ensembl -> {hgnc, name}
    target_conditions = {}  # (ensembl, condition_id, datatype) -> {score, overall}
    drug_targets = {}       # (compound_id, ensembl, action_type) -> mechanism_text
    per_condition = {}

    for cond in conditions:
        oid = ot_disease_id(cond)
        if not oid:
            print(f"  skip {cond['slug']}: no efo/mondo id")
            continue
        disease = ot_query(oid)
        time.sleep(SLEEP)
        if not disease:
            print(f"  skip {cond['slug']} ({oid}): no OT disease")
            continue
        cid = cond["id"]
        n_t = n_tc = n_dt = 0

        # target -> condition associations (with per-evidence-type scores)
        for row in (disease.get("associatedTargets") or {}).get("rows", []):
            t = row.get("target") or {}
            ens = t.get("id")
            if not ens:
                continue
            if ens not in targets:
                targets[ens] = {"hgnc": t.get("approvedSymbol"), "name": t.get("approvedName")}
                n_t += 1
            overall = row.get("score")
            for ds in row.get("datatypeScores", []):
                key = (ens, cid, ds.get("id"))
                if key not in target_conditions:
                    target_conditions[key] = {"score": ds.get("score"), "overall": overall}
                    n_tc += 1

        # drug -> target mechanisms, only for drugs that map to our resolved compounds
        for row in (disease.get("drugAndClinicalCandidates") or {}).get("rows", []):
            drug = row.get("drug") or {}
            comp_id = chembl_to_compound.get(drug.get("id"))
            if not comp_id:
                continue
            for moa in (drug.get("mechanismsOfAction") or {}).get("rows", []):
                action = moa.get("actionType") or "UNKNOWN"
                mtext = moa.get("mechanismOfAction")
                for mt in (moa.get("targets") or []):
                    ens = mt.get("id")
                    if not ens:
                        continue
                    if ens not in targets:
                        targets[ens] = {"hgnc": mt.get("approvedSymbol"), "name": mt.get("approvedName")}
                    key = (comp_id, ens, action)
                    if key not in drug_targets:
                        drug_targets[key] = mtext
                        n_dt += 1

        per_condition[cond["slug"]] = {"targets": n_t, "target_conditions": n_tc, "drug_targets": n_dt}
        print(f"  {cond['slug']:<14} targets={n_t:<3} assoc={n_tc:<4} drug_targets={n_dt}")

    _write_migration(targets, target_conditions, drug_targets)
    REPORT.write_text(json.dumps({
        "_meta": {
            "generated_at": started, "script": "scripts/capture-opentargets-graph.py",
            "targets": len(targets), "target_conditions": len(target_conditions),
            "drug_targets": len(drug_targets), "per_condition": per_condition,
        },
    }, indent=2))
    print(f"\nNodes: targets={len(targets)}  "
          f"Edges: target_conditions={len(target_conditions)}  drug_targets={len(drug_targets)}")
    print(f"Wrote {MIGRATION.relative_to(REPO)} and {REPORT.relative_to(REPO)}")
    print("Apply migration 052 (schema) first, then 055 (this backfill) in Supabase Studio.")


def _write_migration(targets, target_conditions, drug_targets):
    out = [
        "-- 055_backfill_graph.sql",
        "--",
        "-- GENERATED by scripts/capture-opentargets-graph.py. Backfills the Path B graph",
        "-- tables from migration 052 with the Open Targets drug->target->disease structure.",
        "-- Idempotent: targets upsert on ensembl_gene_id; edges insert-on-conflict on their",
        "-- unique keys; safe to re-run. Apply 052 first, then this file.",
        "",
        "-- ── nodes: targets ──────────────────────────────────────────────────────────",
    ]
    if targets:
        out.append("insert into targets (ensembl_gene_id, hgnc_symbol, approved_name) values")
        vals = []
        for ens, meta in sorted(targets.items()):
            hg = sqlq(meta["hgnc"]) if meta.get("hgnc") else "null"
            nm = sqlq(meta["name"]) if meta.get("name") else "null"
            vals.append(f"  ({sqlq(ens)}, {hg}, {nm})")
        out.append(",\n".join(vals))
        out.append("on conflict (ensembl_gene_id) do nothing;")

    out += ["", "-- ── edges: target -> condition (associations) ───────────────────────────────"]
    for (ens, cid, dt), sc in target_conditions.items():
        out.append(
            "insert into target_conditions (target_id, condition_id, datatype, score, overall_score, source) "
            f"select t.id, {sqlq(cid)}::uuid, {sqlq(dt)}, {num(sc['score'])}, {num(sc['overall'])}, 'opentargets' "
            f"from targets t where t.ensembl_gene_id = {sqlq(ens)} "
            "on conflict (target_id, condition_id, datatype) do nothing;"
        )

    out += ["", "-- ── edges: drug -> target (mechanism of action) ─────────────────────────────"]
    for (comp_id, ens, action), mtext in drug_targets.items():
        mt = sqlq(mtext) if mtext else "null"
        out.append(
            "insert into drug_targets (compound_id, target_id, action_type, mechanism_text, source) "
            f"select {sqlq(comp_id)}::uuid, t.id, {sqlq(action)}, {mt}, 'opentargets' "
            f"from targets t where t.ensembl_gene_id = {sqlq(ens)} "
            "on conflict (compound_id, target_id, action_type) do nothing;"
        )

    out.append("")
    MIGRATION.write_text("\n".join(out))


if __name__ == "__main__":
    main()
