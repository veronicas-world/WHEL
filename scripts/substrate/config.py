"""Shared config for the Whel substrate pipeline (scripts/substrate/).

Mirrors the conventions of the existing repo scripts (extract-key-findings.py):
stdlib only, reads ANTHROPIC_API_KEY and the Supabase anon creds from ../../.env.local.
The pipeline writes NOTHING to the database directly; it builds a local working
store and emits supabase/migrations/047_substrate_seed_pmdd.sql for review + apply
in Supabase Studio.
"""
import os
import pathlib

REPO = pathlib.Path(__file__).resolve().parent.parent.parent     # rediscover/
SUBSTRATE_DIR = REPO / "scripts" / "substrate"
DOTENV = REPO / ".env.local"
MIGRATIONS_DIR = REPO / "supabase" / "migrations"
SEED_MIGRATION = MIGRATIONS_DIR / "047_substrate_seed_pmdd.sql"
RUN_LOG = SUBSTRATE_DIR / "audit-output" / "substrate-run.json"

# Local working store (SQLite). NOT the production DB. Kept off the mounted/FUSE
# workspace folder in sandboxed runs (SQLite locking fails there) via the env
# override; defaults to a repo-local .work/ dir for normal local runs.
WORK_DIR = pathlib.Path(os.environ.get("WHEL_SUBSTRATE_WORK", str(SUBSTRATE_DIR / ".work")))
WORK_DB = WORK_DIR / "substrate-work.db"
WORK_DIR.mkdir(parents=True, exist_ok=True)
(SUBSTRATE_DIR / "audit-output").mkdir(parents=True, exist_ok=True)

# Single LLM backbone. The model is a commodity; the substrate is the moat.
MODEL = "claude-sonnet-4-6"
ANTHROPIC_VERSION = "2023-06-01"

# Sonnet list price (USD per token) for rough live cost tracking.
PRICE_IN = 3.0 / 1_000_000
PRICE_OUT = 15.0 / 1_000_000

USER_AGENT = "Whel-Substrate-Pipeline/0.1 (https://whel.bio; mailto:vla2117@columbia.edu)"

# ── The six conditions Whel covers. The substrate is built one condition at a
# time; the fetcher tags each document with its condition key (in meta), and the
# extractor reads that tag to focus claim extraction. `synonyms` feed both the
# triage filter and the extraction prompt; `seed_pmids` are deterministic papers
# known to contain surfaceable disagreement (optional, may be empty). ──
CONDITIONS = {
    "PMDD": {
        "label": "PMDD or PMS (premenstrual dysphoric disorder / premenstrual syndrome)",
        "canonical": "PMDD",
        "synonyms": ["premenstrual dysphoric disorder", "premenstrual syndrome", "PMDD", "PMS"],
        "seed_pmids": ["28178022", "23136064"],
        "queries": [
            "premenstrual syndrome vitamin B6 pyridoxine systematic review",
            "Vitex agnus castus premenstrual dysphoric disorder review",
            "premenstrual syndrome essential fatty acids evening primrose",
            "premenstrual dysphoric disorder SSRI efficacy adverse effects",
            "premenstrual syndrome calcium magnesium randomized",
        ],
    },
    "endometriosis": {
        "label": "endometriosis",
        "canonical": "endometriosis",
        "synonyms": ["endometriosis", "endometriotic"],
        "seed_pmids": [],
        "queries": [
            "endometriosis pain dienogest randomized controlled trial",
            "endometriosis aromatase inhibitor letrozole efficacy",
            "endometriosis NSAID treatment systematic review",
            "endometriosis GnRH agonist adverse effects review",
            "endometriosis pentoxifylline systematic review",
        ],
    },
    "PCOS": {
        "label": "PCOS (polycystic ovary syndrome)",
        "canonical": "PCOS",
        "synonyms": ["polycystic ovary syndrome", "PCOS", "polycystic ovarian"],
        "seed_pmids": [],
        "queries": [
            "polycystic ovary syndrome metformin systematic review",
            "PCOS inositol myo-inositol randomized trial",
            "polycystic ovary syndrome spironolactone hirsutism efficacy",
            "PCOS letrozole ovulation induction review",
            "polycystic ovary syndrome lifestyle metformin adverse effects",
        ],
    },
    "menopause": {
        "label": "menopause (menopausal / perimenopausal symptoms)",
        "canonical": "menopause",
        "synonyms": ["menopause", "menopausal", "perimenopausal", "vasomotor symptoms", "hot flashes"],
        "seed_pmids": [],
        "queries": [
            "menopause hot flashes SSRI SNRI efficacy randomized",
            "menopausal vasomotor symptoms gabapentin trial",
            "menopause hormone therapy systematic review benefits risks",
            "menopause black cohosh systematic review",
            "menopausal symptoms oxybutynin randomized",
        ],
    },
    "vulvodynia": {
        "label": "vulvodynia (incl. provoked vestibulodynia)",
        "canonical": "vulvodynia",
        "synonyms": ["vulvodynia", "vestibulodynia", "vulvar pain"],
        "seed_pmids": [],
        "queries": [
            "vulvodynia amitriptyline treatment efficacy",
            "vulvodynia gabapentin randomized controlled trial",
            "vulvodynia topical lidocaine systematic review",
            "provoked vestibulodynia treatment review",
            "vulvodynia tricyclic antidepressant adverse effects",
        ],
    },
    "adenomyosis": {
        "label": "adenomyosis",
        "canonical": "adenomyosis",
        "synonyms": ["adenomyosis", "adenomyotic"],
        "seed_pmids": [],
        "queries": [
            "adenomyosis dienogest treatment efficacy",
            "adenomyosis levonorgestrel intrauterine system review",
            "adenomyosis GnRH agonist systematic review",
            "adenomyosis ulipristal treatment",
            "adenomyosis medical management randomized",
        ],
    },
}

DEFAULT_CONDITION = "PMDD"  # legacy documents with no condition tag fall back to this

# Sources whose records are STRUCTURED (not free text). The substrate renders each
# record into a deterministic sentence and constructs the claim from it without a
# model; everything else (pubmed, reddit) is text. Single source of truth for the
# text-vs-structured distinction — no DB column. See ARMS_SPEC.md §1.
STRUCTURED_SOURCES = {"opentargets", "aems", "sider"}


def load_dotenv(path: pathlib.Path = DOTENV) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        # Fill in when absent OR empty (some environments pre-export empty vars).
        if k and not os.environ.get(k):
            os.environ[k] = v


def anthropic_key() -> str:
    load_dotenv()
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not set (in .env.local or environment)")
    return key
