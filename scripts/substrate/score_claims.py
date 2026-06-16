"""Stage 6 - score verified claims into ARM-AWARE signals (substrate_signals).

Implements scripts/substrate/SCORING_SPEC.md (v1.2). Reads ONLY
provenance-verified claims, groups them by (intervention, condition, aspect, arm)
— where `arm` is derived from each claim's document source — and asks the model to
score the five arm-appropriate dimensions (0-2 each) with 2-3 sentence rationales,
plus a synthesis + mechanism, plus a set of STRUCTURED FACTS (sample size, CI
present, % female, was the study in the target female population, sex-stratified,
evidence of a sex-dependent effect).

Division of labour (SCORING_SPEC §8.1 — "LLM extracts, rules decide"):
  * the MODEL proposes the five dimension scores, the rationales, and the raw facts;
  * PYTHON decides the things that must be deterministic:
      - the imprecision caps (§2),
      - the female-applicability BAND -> multiplier (§3),
      - the confidence tier (§5),
      - the contradiction flag (read from the contradictions table, §4).

Nothing here writes to the production database. It writes to the local working
store and export_signals() emits a reviewable seed migration. CreditsExhausted
stops the run and commits what exists — we never fabricate a score.

Run (from repo root), AFTER extraction/verification have populated the store:
    python3 scripts/substrate/score_claims.py
    python3 scripts/substrate/score_claims.py --selftest   # pure-logic checks, no API

The model is config.MODEL. For the one expensive production pass, set that to the
intended model (e.g. the current Opus) in config.py before running; the cheap
extraction pass can run on the cheaper model first.
"""
import re
import sys
import json
import sqlite3
import argparse
from datetime import datetime, timezone

import db
from llm import complete_json, prompt_hash, map_parallel, CreditsExhausted, usage_snapshot
from config import MODEL, MIGRATIONS_DIR

SIGNALS_SEED = MIGRATIONS_DIR / "051_substrate_signals_seed.sql"
PROMPT_VERSION = "score_claims/v1.2-arm-aware"

# ── Work-store table for scored signals. Mirrors migration 050's columns, but the
# two GENERATED columns (arm_strength, arm_score) are computed in Python and stored
# as plain columns here; the export omits them so Postgres generates them. ──
WORK_SCHEMA = """
CREATE TABLE IF NOT EXISTS substrate_signals (
    id TEXT PRIMARY KEY,
    intervention_id TEXT NOT NULL, condition_id TEXT NOT NULL,
    aspect TEXT NOT NULL DEFAULT 'efficacy', arm TEXT NOT NULL,
    corroboration_score INTEGER, rigor_score INTEGER, specificity_score INTEGER,
    plausibility_score INTEGER, consistency_score INTEGER, arm_strength REAL,
    corroboration_rationale TEXT, rigor_rationale TEXT, specificity_rationale TEXT,
    plausibility_rationale TEXT, consistency_rationale TEXT,
    female_applicability_band TEXT, female_applicability_multiplier REAL,
    female_applicability_rationale TEXT,
    arm_score REAL, confidence_tier TEXT,
    contradiction_flag INTEGER NOT NULL DEFAULT 0, num_contradictions INTEGER NOT NULL DEFAULT 0,
    precision_note TEXT, needs_fulltext INTEGER NOT NULL DEFAULT 0,
    source_tier TEXT NOT NULL DEFAULT 'abstract', synthesis_summary TEXT,
    mechanism_hypothesis TEXT, claim_ids TEXT,
    model_name TEXT, prompt_hash TEXT, status TEXT NOT NULL DEFAULT 'active',
    off_topic_reason TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    UNIQUE(intervention_id, condition_id, aspect, arm)
);
"""

# ── arm derivation from a document source (SCORING_SPEC §2). The substrate today
# holds PubMed abstracts (= direct). Other arms activate as their sources land. ──
def arm_for_source(source: str) -> str:
    s = (source or "").lower()
    if any(k in s for k in ("reddit", "forum", "community", "patient")):
        return "community"
    # 'aems' is the canonical name for the FDA Adverse Event Reporting System
    # (formerly FAERS); 'faers' kept only as a backward-compat alias for old data.
    # Pathway structured sources: Open Targets (mechanism), AEMS + SIDER (safety/lead).
    if any(k in s for k in ("opentargets", "aems", "faers", "sider", "target", "pathway", "chembl")):
        return "pathway"
    # NOTE: cross-condition is NOT an evidence arm. It is inferential (no source directly
    # says "drug treats condition Y"), so it will be a separate, clearly-labelled DERIVED
    # HYPOTHESES lens layered on top of the three evidence arms — never scored as evidence.
    # See ARMS_SPEC.md §4. The three evidence arms are: direct, pathway, community.
    return "direct"  # pubmed and unknown clinical sources

# Per-arm meaning of the five generalized slots, injected into the prompt so the
# model scores each slot the way SCORING_SPEC §2 defines it for that arm.
ARM_RUBRIC = {
    "direct": (
        "corroboration = independent corroboration. A SINGLE source scores 0-1: a single "
        "systematic review or meta-analysis is 1 (one synthesis is NOT independent replication "
        "— do NOT count the trials pooled inside one review as independent sources); a single "
        "primary study is 0. Reserve 2 for three+ genuinely independent, consistent studies, or "
        "one large, well-powered, low-bias RCT. rigor = study design (case/preclinical=0; "
        "observational/small trial=1; "
        "RCT/meta-analysis/active guideline=2). specificity = this drug + this condition both "
        "named directly. plausibility = mechanism (asserted=0; plausible=1; evidenced=2). "
        "consistency = do results agree in direction (a single study is n/a -> score 1, not "
        "penalized)."
    ),
    # (no 'cross' rubric: cross-condition is a derived hypotheses lens, not a scored
    #  evidence arm — see arm_for_source note and ARMS_SPEC.md §4.)
    "pathway": (
        "corroboration = how many independent mechanistic lines converge. rigor = strength/"
        "recency of models (human-relevant=2; in-vitro only=0). specificity = specificity of "
        "the drug's action on the named target. plausibility = target-phenotype fit. "
        "consistency = do the mechanistic signals point the same way."
    ),
    "community": (
        "corroboration = INDEPENDENCE of accounts (single account/coordination signs=0; a few "
        "independent accounts=1; many independent accounts across threads/time=2). Same-thread "
        "replies are weak corroboration (anchored by the post); only independent accounts reach "
        "2. rigor = specificity of the report (vague=0; symptom+dose+timing clear=2). "
        "specificity = drug + outcome both clear and linked. plausibility = fits the drug's "
        "pharmacology. consistency = do reports agree (confirm vs deny) and does dose/timing "
        "cohere. NEVER score community evidence on clinical-trial criteria."
    ),
}

SYSTEM = """You are the scoring component of a biomedical evidence substrate for women's health.
You are given a set of already-verified atomic claims (each with a verbatim quote) about ONE
intervention's effect on ONE condition, for ONE aspect (efficacy or safety), all from ONE
evidence arm. Score the evidence on five 0-2 dimensions whose meaning for THIS arm is:

{rubric}

For EACH dimension give an integer score 0-2 and a 2-3 sentence rationale that cites the specific
claims/sources behind the score. Do NOT inflate: a score must be justified by the claims shown.

Also extract STRUCTURED FACTS (use null when the text does not state them — do NOT guess, do NOT
infer a confidence interval from a p-value):
  - max_sample_size: largest study N mentioned, else null
  - num_events: total events for a binary outcome if stated, else null
  - has_confidence_interval: true if any CI is reported, else false
  - study_female_percent: % female participants if stated (0-100), else null
  - study_in_target_female_population: true if participants were patients with this (female)
    condition or were women specifically; false if a mixed/male population studied for another
    indication; null if unclear
  - sex_stratified: true if results are broken out by sex
  - equivalence_shown: true only if a sex-stratified analysis explicitly found no meaningful
    difference between sexes
  - evidence_of_sex_difference: true if there is evidence the drug behaves differently or worse
    in women (PK, dosing, adverse-event signal)

Also give:
  - on_topic: false if the verified claims do NOT actually concern THIS intervention acting on
    THIS condition — e.g. the quote is about a different condition, a different drug, or the
    intervention cannot be identified from the claims. true otherwise. Be strict: a claim about
    "anxiety in older women" is NOT on-topic for a premenstrual condition.
  - on_topic_reason: one short sentence; required when on_topic is false, else null.
  - synthesis_summary: ONE plain sentence capturing the strongest verified evidence (no overreach)
  - mechanism_hypothesis: a brief mechanism if the claims support one, else null

Return ONLY this JSON object:
{"corroboration": {"score": int, "rationale": str},
 "rigor": {"score": int, "rationale": str},
 "specificity": {"score": int, "rationale": str},
 "plausibility": {"score": int, "rationale": str},
 "consistency": {"score": int, "rationale": str},
 "facts": {"max_sample_size": int|null, "num_events": int|null, "has_confidence_interval": bool,
   "study_female_percent": number|null, "study_in_target_female_population": bool|null,
   "sex_stratified": bool, "equivalence_shown": bool, "evidence_of_sex_difference": bool},
 "on_topic": bool, "on_topic_reason": str|null,
 "synthesis_summary": str, "mechanism_hypothesis": str|null}
"""


# ── Deterministic rules (no model judgment) ─────────────────────────────────

def female_band(facts: dict):
    """Map extracted facts -> (band, multiplier, rationale). SCORING_SPEC §3.
    Pure function; the model supplies facts, Python picks the band."""
    fp = facts.get("study_female_percent")
    fp = float(fp) if isinstance(fp, (int, float)) else None
    in_target = facts.get("study_in_target_female_population")
    if facts.get("evidence_of_sex_difference"):
        return "F6", 0.50, "Evidence of a sex-dependent effect in women (⚠): scored as a known disadvantage."
    if in_target is True or (fp is not None and fp >= 80):
        return "F1", 1.00, f"Evidence generated in women (female population{'' if fp is None else f', ~{int(fp)}% female'})."
    if fp is not None and fp >= 50 and facts.get("sex_stratified") and facts.get("equivalence_shown"):
        return "F2", 1.00, f"~{int(fp)}% female and a sex-stratified analysis showed no meaningful difference — equivalence shown."
    if fp is not None and fp >= 50:
        return "F3", 0.90, f"~{int(fp)}% female but results were not broken out by sex — represented, unconfirmed."
    if fp is not None and fp >= 30:
        return "F4", 0.75, f"~{int(fp)}% female (underrepresented), no sex analysis — applicability to women not yet established."
    if fp is not None and fp < 30:
        return "F5", 0.60, f"~{int(fp)}% female (male-derived) — applicability to women not yet established."
    return "F4", 0.75, "Female representation not stated — applicability to women uncertain (flagged for full text)."


def apply_imprecision(scores: dict, facts: dict, arm: str):
    """Cap dimensions for small/absent samples. SCORING_SPEC §2. Only meaningful
    for quantitative arms; community is scored on its own criteria."""
    if arm == "community":
        return scores, None, False
    notes, needs_ft = [], False
    n = facts.get("max_sample_size")
    ev = facts.get("num_events")
    has_ci = bool(facts.get("has_confidence_interval"))
    if isinstance(n, (int, float)) and n < 30:
        scores["corroboration"] = min(scores["corroboration"], 1)
        scores["rigor"] = min(scores["rigor"], 1)
        notes.append(f"small sample (N≈{int(n)}); corroboration/rigor capped at 1")
    if isinstance(ev, (int, float)) and ev < 300:
        scores["corroboration"] = min(scores["corroboration"], 1)
        notes.append(f"few events (≈{int(ev)})")
    if n is None and not has_ci:
        needs_ft = True
        notes.append("no sample size or CI in source — precision unknown, flagged for full text")
    return scores, ("; ".join(notes) or None), needs_ft


def tier_for(score: float) -> str:
    """SCORING_SPEC §5 (provisional cutoffs; recalibrated once per §9)."""
    if score >= 8.0:
        return "Strong"
    if score >= 6.0:
        return "Moderate"
    if score >= 3.5:
        return "Emerging"
    return "Exploratory"


# ── Community independence + manipulation caps (RULE-BASED, SCORING_SPEC §2 community) ──
# The model can't see thread_id/author/timing, so corroboration (independence) for the
# community arm is computed deterministically from the claims' document metadata, not by
# the model. (Account age/karma would need extra per-author API calls — a future add.)

def _meta(claim):
    try:
        return json.loads(claim["doc_meta"]) if claim["doc_meta"] else {}
    except (ValueError, TypeError):
        return {}

def _tokens(text):
    return set(re.findall(r"[a-z0-9]+", (text or "").lower()))

def _near_duplicate(claims):
    """True if two claims from DIFFERENT authors share near-identical wording (possible
    coordination / astroturf)."""
    items = [(_meta(c).get("author"), _tokens(c["text"])) for c in claims]
    for i in range(len(items)):
        ai, ti = items[i]
        if not ai or not ti:
            continue
        for j in range(i + 1, len(items)):
            aj, tj = items[j]
            if aj and tj and ai != aj:
                union = len(ti | tj)
                if union and len(ti & tj) / union >= 0.8:
                    return True
    return False

def _timing_burst(claims):
    """True if 3+ timestamped claims all land within one hour (a posting burst)."""
    ts = sorted(m for m in (_meta(c).get("created_utc") for c in claims)
                if isinstance(m, (int, float)))
    return len(ts) >= 3 and 0 < (ts[-1] - ts[0]) < 3600

def community_independence(claims):
    """(corroboration_score 0-2, rationale). Distinct independent accounts across distinct
    threads drive the score; single-thread agreement and manipulation signals cap it."""
    authors = {a for a in (_meta(c).get("author") for c in claims)
               if a and a not in ("[deleted]", "AutoModerator")}
    threads = {t for t in (_meta(c).get("thread_id") for c in claims) if t}
    a, t = len(authors), len(threads)
    if a <= 1:
        score = 0
    elif a <= 4:
        score = 1
    else:
        score = 2 if t >= 2 else 1   # 5+ accounts but one thread = anchored, cap at 1
    notes = [f"{a} distinct account(s) across {t} thread(s)"]
    if _near_duplicate(claims):
        score = min(score, 1)
        notes.append("near-duplicate wording across accounts (possible coordination) — capped")
    if _timing_burst(claims):
        score = min(score, 1)
        notes.append("posts clustered within an hour (burst) — capped")
    return score, "Independence (patient accounts): " + "; ".join(notes) + "."


# ── Scoring driver ──────────────────────────────────────────────────────────

def _group_claims(conn):
    """Verified claims joined to their document source, grouped by
    (intervention_id, condition_id, aspect, arm)."""
    rows = conn.execute(
        "SELECT c.id, c.text, c.exact_quote, c.aspect, c.direction, c.intervention_id,"
        " c.condition_id, d.source AS doc_source, d.title AS doc_title, d.external_id,"
        " d.meta_json AS doc_meta"
        " FROM claims c JOIN documents d ON c.document_id = d.id"
        " WHERE c.provenance_verified = 1"
    ).fetchall()
    groups = {}
    for r in rows:
        key = (r["intervention_id"], r["condition_id"], r["aspect"] or "efficacy",
               arm_for_source(r["doc_source"]))
        groups.setdefault(key, []).append(r)
    return groups


def _label(conn, eid):
    row = conn.execute("SELECT label FROM entities WHERE id = ?", (eid,)).fetchone()
    return row["label"] if row else eid


def _user_prompt(conn, key, claims):
    iv, cd, aspect, arm = key
    lines = [f"Intervention: {_label(conn, iv)}", f"Condition: {_label(conn, cd)}",
             f"Aspect: {aspect}", f"Evidence arm: {arm}", "", "Verified claims:"]
    for i, c in enumerate(claims, 1):
        src = c["doc_title"] or c["external_id"] or "source"
        lines.append(f'{i}. [{c["direction"]}] {c["text"]}')
        lines.append(f'   quote: "{c["exact_quote"]}"  (source: {src})')
    return "\n".join(lines)


def _num_contradictions(conn, iv, cd):
    return conn.execute(
        "SELECT COUNT(*) FROM contradictions WHERE intervention_id=? AND condition_id=?",
        (iv, cd)).fetchone()[0]


def _store_ready(conn):
    """None if the substrate base tables aren't built in this work store; else the
    count of provenance-verified claims available to score."""
    try:
        return conn.execute("SELECT COUNT(*) FROM claims WHERE provenance_verified=1").fetchone()[0]
    except sqlite3.OperationalError:
        return None


def _ensure_signal_columns(conn):
    """Self-heal a pre-existing substrate_signals table: CREATE TABLE IF NOT EXISTS
    won't add columns introduced after the table was first made, so add any missing
    ones here. Keeps the local work store forward-compatible across schema bumps."""
    cols = {r[1] for r in conn.execute("PRAGMA table_info(substrate_signals)")}
    if not cols:
        return
    for name, decl in (("off_topic_reason", "TEXT"),):
        if name not in cols:
            conn.execute(f"ALTER TABLE substrate_signals ADD COLUMN {name} {decl}")
    conn.commit()


def run(limit=None, model=None):
    model = model or MODEL
    conn = db.connect()
    conn.executescript(WORK_SCHEMA)
    conn.commit()
    _ensure_signal_columns(conn)
    ready = _store_ready(conn)
    if ready is None:
        print("  no substrate in this working store yet — build it first:")
        print("    python3 scripts/substrate/run.py")
        return 0
    if ready == 0:
        print("  the working store has no provenance-verified claims yet — run run.py to extract/verify.")
        return 0
    print(f"  model: {model}")
    ph = prompt_hash(SYSTEM, PROMPT_VERSION, model)
    groups = list(_group_claims(conn).items())
    if limit:
        groups = groups[:limit]
        print(f"  scoring a sample of {len(groups)} group(s) (--limit)")
    else:
        print(f"  {len(groups)} (intervention, condition, aspect, arm) groups to score")

    # Build every prompt in THIS thread: prompt construction reads the DB for entity
    # labels, and the SQLite connection can't be used from worker threads. The parallel
    # workers then do nothing but the (thread-safe) API call.
    jobs = []
    for key, claims in groups:
        arm = key[3]
        system = SYSTEM.replace("{rubric}", ARM_RUBRIC.get(arm, ARM_RUBRIC["direct"]))
        jobs.append((key, claims, system, _user_prompt(conn, key, claims)))

    def _score(job):
        _key, _claims, system, user = job
        # temperature omitted (=None): Opus 4.8 deprecates it.
        return complete_json(system, user, max_tokens=1500, model=model, temperature=None)

    scored = 0
    suppressed = 0
    for (key, claims, _sys, _usr), res in map_parallel(_score, jobs, workers=4):
        if res is None:
            continue
        iv, cd, aspect, arm = key
        try:
            dims = {d: int(res[d]["score"]) for d in
                    ("corroboration", "rigor", "specificity", "plausibility", "consistency")}
            rats = {d: (res[d].get("rationale") or "").strip() for d in dims}
            facts = res.get("facts") or {}
        except (KeyError, TypeError, ValueError) as e:
            print(f"  [warn] malformed score for {key}: {e}")
            continue
        for d in dims:
            dims[d] = max(0, min(2, dims[d]))

        # community independence is RULE-BASED from thread metadata, not the model (§2).
        if arm == "community":
            ci_score, ci_rationale = community_independence(claims)
            dims["corroboration"] = ci_score
            rats["corroboration"] = ci_rationale

        # contradictions (§4): flag from the table; cap consistency at 1 if present
        nco = _num_contradictions(conn, iv, cd)
        if nco > 0:
            dims["consistency"] = min(dims["consistency"], 1)

        # imprecision caps (§2)
        dims, precision_note, needs_ft = apply_imprecision(dims, facts, arm)

        # female applicability (§3) — rule-derived band, then multiplier
        band, mult, fa_rationale = female_band(facts)
        if band == "F4" and facts.get("study_female_percent") is None:
            needs_ft = True

        strength = sum(dims.values())               # 0-10
        score = round(min(10.0, strength * mult), 1)
        tier = tier_for(score)

        # off-topic guard: suppress signals whose claims don't actually concern this
        # (intervention, condition) pair, or whose intervention couldn't be resolved.
        # Stored with status='off_topic' (kept for audit, excluded from active surfacing).
        iv_label = _label(conn, iv)
        on_topic = res.get("on_topic", True) is not False
        ot_reason = (res.get("on_topic_reason") or "").strip() or None
        if on_topic and (not iv_label or "unknown" in str(iv_label).lower()):
            on_topic = False
            ot_reason = ot_reason or f"intervention could not be resolved ('{iv_label}')"
        status = "active" if on_topic else "off_topic"
        off_topic_reason = None if on_topic else ot_reason

        conn.execute(
            "INSERT INTO substrate_signals (id, intervention_id, condition_id, aspect, arm,"
            " corroboration_score, rigor_score, specificity_score, plausibility_score,"
            " consistency_score, arm_strength, corroboration_rationale, rigor_rationale,"
            " specificity_rationale, plausibility_rationale, consistency_rationale,"
            " female_applicability_band, female_applicability_multiplier, female_applicability_rationale,"
            " arm_score, confidence_tier, contradiction_flag, num_contradictions, precision_note,"
            " needs_fulltext, source_tier, synthesis_summary, mechanism_hypothesis, claim_ids,"
            " model_name, prompt_hash, status, off_topic_reason, created_at, updated_at)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
            " ON CONFLICT (intervention_id, condition_id, aspect, arm) DO UPDATE SET"
            " corroboration_score=excluded.corroboration_score, rigor_score=excluded.rigor_score,"
            " specificity_score=excluded.specificity_score, plausibility_score=excluded.plausibility_score,"
            " consistency_score=excluded.consistency_score, arm_strength=excluded.arm_strength,"
            " corroboration_rationale=excluded.corroboration_rationale, rigor_rationale=excluded.rigor_rationale,"
            " specificity_rationale=excluded.specificity_rationale, plausibility_rationale=excluded.plausibility_rationale,"
            " consistency_rationale=excluded.consistency_rationale, female_applicability_band=excluded.female_applicability_band,"
            " female_applicability_multiplier=excluded.female_applicability_multiplier,"
            " female_applicability_rationale=excluded.female_applicability_rationale, arm_score=excluded.arm_score,"
            " confidence_tier=excluded.confidence_tier, contradiction_flag=excluded.contradiction_flag,"
            " num_contradictions=excluded.num_contradictions, precision_note=excluded.precision_note,"
            " needs_fulltext=excluded.needs_fulltext, synthesis_summary=excluded.synthesis_summary,"
            " mechanism_hypothesis=excluded.mechanism_hypothesis, claim_ids=excluded.claim_ids,"
            " model_name=excluded.model_name, prompt_hash=excluded.prompt_hash,"
            " status=excluded.status, off_topic_reason=excluded.off_topic_reason, updated_at=excluded.updated_at",
            (db.new_id(), iv, cd, aspect, arm,
             dims["corroboration"], dims["rigor"], dims["specificity"], dims["plausibility"],
             dims["consistency"], float(strength), rats["corroboration"], rats["rigor"],
             rats["specificity"], rats["plausibility"], rats["consistency"],
             band, mult, fa_rationale, score, tier, 1 if nco > 0 else 0, nco, precision_note,
             1 if needs_ft else 0, "abstract", (res.get("synthesis_summary") or "").strip() or None,
             (res.get("mechanism_hypothesis") or None), json.dumps([c["id"] for c in claims]),
             model, ph, status, off_topic_reason,
             datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat()))
        conn.commit()
        if on_topic:
            scored += 1
        else:
            suppressed += 1

    msg = f"  scored {scored} signal(s)"
    if suppressed:
        msg += f"; suppressed {suppressed} off-topic"
    print(msg)
    return scored


# ── Export to a reviewable seed migration (051) ─────────────────────────────

def _q(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


# columns inserted into Postgres — EXCLUDES the generated columns (arm_strength,
# arm_score) which Postgres computes itself.
_EXPORT_COLS = [
    "id", "intervention_id", "condition_id", "aspect", "arm",
    "corroboration_score", "rigor_score", "specificity_score", "plausibility_score",
    "consistency_score", "corroboration_rationale", "rigor_rationale", "specificity_rationale",
    "plausibility_rationale", "consistency_rationale", "female_applicability_band",
    "female_applicability_multiplier", "female_applicability_rationale", "confidence_tier",
    "contradiction_flag", "num_contradictions", "precision_note", "needs_fulltext",
    "source_tier", "synthesis_summary", "mechanism_hypothesis", "claim_ids",
    "model_name", "prompt_hash", "status", "off_topic_reason", "created_at", "updated_at",
]
_BOOL_COLS = {"contradiction_flag", "needs_fulltext"}


def export_signals():
    conn = db.connect()
    conn.executescript(WORK_SCHEMA)
    _ensure_signal_columns(conn)
    rows = conn.execute(
        f"SELECT {', '.join(_EXPORT_COLS)} FROM substrate_signals WHERE status='active'"
    ).fetchall()
    if not rows:
        print("  no scored signals to export — skipping seed migration.")
        return 0
    L = ["-- ============================================================",
         "-- 051_substrate_signals_seed.sql",
         "-- Scored substrate signals — generated by scripts/substrate/score_claims.py",
         "-- Apply AFTER migration 050 (substrate_signals schema), in Supabase Studio.",
         "-- Idempotent: ON CONFLICT (intervention_id, condition_id, aspect, arm) DO NOTHING.",
         "-- arm_strength and arm_score are GENERATED by Postgres and are not inserted.",
         f"-- Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
         "", "BEGIN;", "", f"-- substrate_signals: {len(rows)} row(s)"]
    collist = ", ".join(_EXPORT_COLS)
    for r in rows:
        vals = []
        for c in _EXPORT_COLS:
            v = r[c]
            if c == "claim_ids":
                ids = json.loads(v) if v else []
                vals.append("'{" + ",".join(ids) + "}'" if ids else "NULL")
            elif c in _BOOL_COLS:
                vals.append(_q(bool(v)))
            else:
                vals.append(_q(v))
        L.append(f"INSERT INTO substrate_signals ({collist}) VALUES ({', '.join(vals)}) "
                 "ON CONFLICT (intervention_id, condition_id, aspect, arm) DO NOTHING;")
    L += ["", "COMMIT;", "",
          "-- Verify: select arm, confidence_tier, count(*) from substrate_signals group by 1,2;",
          ""]
    SIGNALS_SEED.write_text("\n".join(L))
    print(f"  wrote {SIGNALS_SEED} ({len(rows)} signal(s))")
    return len(rows)


# ── Human review: pretty-print scored signals from the work store ───────────

def review():
    conn = db.connect()
    conn.executescript(WORK_SCHEMA)
    _ensure_signal_columns(conn)
    rows = conn.execute(
        "SELECT * FROM substrate_signals WHERE status='active'"
        " ORDER BY arm, arm_score DESC").fetchall()
    if not rows:
        print("  no scored signals in the working store yet — run scoring first.")
        return 0
    print(f"\n== {len(rows)} scored signal(s) ==\n")
    for r in rows:
        iv, cd = _label(conn, r["intervention_id"]), _label(conn, r["condition_id"])
        flags = []
        if r["contradiction_flag"]:
            flags.append(f"⚠ {r['num_contradictions']} contradiction(s)")
        if r["needs_fulltext"]:
            flags.append("needs full text")
        flag_s = ("   [" + ", ".join(flags) + "]") if flags else ""
        print(f"[{r['arm']}] {iv} → {cd} ({r['aspect']})")
        print(f"    score {r['arm_score']}  {r['confidence_tier']}   "
              f"strength {int(r['arm_strength'])}/10 × {r['female_applicability_multiplier']} "
              f"({r['female_applicability_band']}){flag_s}")
        for d in ("corroboration", "rigor", "specificity", "plausibility", "consistency"):
            print(f"    {d:13s} {r[d + '_score']}  — {r[d + '_rationale'] or ''}")
        print(f"    female-applicability: {r['female_applicability_rationale']}")
        if r["precision_note"]:
            print(f"    precision: {r['precision_note']}")
        if r["synthesis_summary"]:
            print(f"    synthesis: {r['synthesis_summary']}")
        print()
    # quick distribution to eyeball calibration (SCORING_SPEC §9a)
    dist = conn.execute(
        "SELECT confidence_tier, COUNT(*) n FROM substrate_signals WHERE status='active'"
        " GROUP BY confidence_tier").fetchall()
    print("  tier distribution:", {d["confidence_tier"]: d["n"] for d in dist})
    bands = conn.execute(
        "SELECT female_applicability_band, COUNT(*) n FROM substrate_signals WHERE status='active'"
        " GROUP BY female_applicability_band").fetchall()
    print("  female-applicability bands:", {b["female_applicability_band"]: b["n"] for b in bands})
    off = conn.execute(
        "SELECT intervention_id, condition_id, off_topic_reason FROM substrate_signals"
        " WHERE status='off_topic'").fetchall()
    if off:
        print(f"\n  off-topic, suppressed (not surfaced): {len(off)}")
        for r in off:
            print(f"    - {_label(conn, r['intervention_id'])} → {_label(conn, r['condition_id'])}: "
                  f"{r['off_topic_reason'] or 'claims not about this pair'}")
    return 0


# ── Self-test: exercises the deterministic logic only (no API, no DB) ────────

def _selftest():
    ok = True

    def check(name, got, want):
        nonlocal ok
        status = "ok " if got == want else "FAIL"
        if got != want:
            ok = False
        print(f"  [{status}] {name}: {got!r}")

    # female bands
    check("F1 in-target", female_band({"study_in_target_female_population": True})[0], "F1")
    check("F1 80pct", female_band({"study_female_percent": 90})[0], "F1")
    check("F2 equivalence", female_band({"study_female_percent": 55, "sex_stratified": True,
          "equivalence_shown": True})[0], "F2")
    check("F3 represented", female_band({"study_female_percent": 60})[0], "F3")
    check("F4 underrep", female_band({"study_female_percent": 35})[0], "F4")
    check("F5 male-derived", female_band({"study_female_percent": 10})[0], "F5")
    check("F6 sex-diff", female_band({"evidence_of_sex_difference": True})[0], "F6")
    check("F4 unknown", female_band({})[0], "F4")
    check("F5 multiplier", female_band({"study_female_percent": 10})[1], 0.60)

    # imprecision caps
    capped, note, ft = apply_imprecision({"corroboration": 2, "rigor": 2, "specificity": 2,
        "plausibility": 2, "consistency": 2}, {"max_sample_size": 12, "has_confidence_interval": True}, "direct")
    check("small-N caps corroboration", capped["corroboration"], 1)
    check("small-N caps rigor", capped["rigor"], 1)
    _, _, ft2 = apply_imprecision({"corroboration": 2, "rigor": 2, "specificity": 2,
        "plausibility": 2, "consistency": 2}, {"max_sample_size": None, "has_confidence_interval": False}, "direct")
    check("no N/CI -> needs_fulltext", ft2, True)
    comm, _, ftc = apply_imprecision({"corroboration": 2, "rigor": 2, "specificity": 2,
        "plausibility": 2, "consistency": 2}, {"max_sample_size": None, "has_confidence_interval": False}, "community")
    check("community skips imprecision", (comm["rigor"], ftc), (2, False))

    # tiers
    check("tier strong", tier_for(8.0), "Strong")
    check("tier moderate", tier_for(6.0), "Moderate")
    check("tier emerging", tier_for(3.5), "Emerging")
    check("tier exploratory", tier_for(3.4), "Exploratory")

    # headline arithmetic: strong male-derived discounts below strong
    strength = 9
    check("9 x 0.60 = 5.4 -> Emerging", tier_for(round(min(10.0, strength * 0.60), 1)), "Emerging")

    # arm routing
    check("arm pubmed->direct", arm_for_source("pubmed"), "direct")
    check("arm reddit->community", arm_for_source("reddit"), "community")
    check("arm aems->pathway", arm_for_source("aems"), "pathway")
    check("arm faers(alias)->pathway", arm_for_source("faers"), "pathway")

    # community independence (rule-based from thread metadata)
    def _c(author, thread, text, ts=None):
        return {"doc_meta": json.dumps({"author": author, "thread_id": thread, "created_utc": ts}),
                "text": text}
    check("comm single account -> 0",
          community_independence([_c("u1", "t1", "zoloft helped my pmdd")])[0], 0)
    check("comm 3 accounts/3 threads -> 1",
          community_independence([_c("u1", "t1", "zoloft calmed rage"),
                                  _c("u2", "t2", "vitamin b6 eased bloating"),
                                  _c("u3", "t3", "magnesium helped cramps")])[0], 1)
    varied = [_c("u1", "t1", "zoloft calmed my rage"), _c("u2", "t2", "vitamin b6 eased bloating"),
              _c("u3", "t3", "magnesium helped cramps"), _c("u4", "t4", "spironolactone cleared acne"),
              _c("u5", "t5", "drospirenone smoothed mood swings"), _c("u6", "t6", "fluoxetine reduced irritability")]
    check("comm 6 accounts/6 threads -> 2", community_independence(varied)[0], 2)
    onethread = [_c(f"u{i}", "t1", f"distinct phrase alpha{i} beta{i} gamma{i}") for i in range(6)]
    check("comm 6 accounts/1 thread -> 1 (anchored)", community_independence(onethread)[0], 1)
    dup = [_c(f"u{i}", f"t{i}", "exact same coordinated sentence here") for i in range(6)]
    check("comm near-duplicate caps 2->1", community_independence(dup)[0], 1)

    print("  SELFTEST", "PASS" if ok else "FAILED")
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true", help="run pure-logic checks, no API/DB")
    ap.add_argument("--review", action="store_true", help="pretty-print scored signals (no API)")
    ap.add_argument("--export-only", action="store_true", help="re-emit the seed migration from the store")
    ap.add_argument("--limit", type=int, default=None, help="score only the first N groups (cheap validation peek)")
    ap.add_argument("--model", type=str, default=None,
                    help="model id to score with (defaults to config.MODEL). Use your Opus 4.8 string here.")
    args = ap.parse_args()

    if args.selftest:
        return _selftest()
    if args.review:
        return review()
    if args.export_only:
        export_signals()
        return 0

    print("== Whel substrate scoring (arm-aware) ==")
    stopped = None
    scored = 0
    try:
        scored = run(limit=args.limit, model=args.model)
    except CreditsExhausted as e:
        stopped = str(e)
    export_signals()
    u = usage_snapshot()
    print(f"  [usage] {u['calls']} calls, {u['input_tokens']}+{u['output_tokens']} tok, ~${u['est_cost_usd']:.4f}")
    if stopped:
        print("\n" + "!" * 60)
        print("CREDITS EXHAUSTED — scoring stopped early. What scored is committed and")
        print("exported; un-scored groups simply have no row yet. Top up and re-run;")
        print("scoring is idempotent (ON CONFLICT upsert) and resumes cleanly.")
        print("!" * 60)
        return 3
    if not scored:
        print("\nNo signals were scored — see the warnings above. Nothing to apply in Supabase.")
        print("Fix the cause and re-run; review what's in the store with --review.")
        return 1
    print(f"\nScored {scored} signal(s). Review them:  python3 scripts/substrate/score_claims.py --review")
    print("When you're happy, apply migration 050 then 051 in Supabase Studio (that's the later cutover step).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
