"""Stage 1 - fetch. Pull a SMALL set of real PMDD/PMS abstracts from PubMed
E-utilities (free, public, Tier-1-clean) and store each as an immutable,
content-addressed document in the local working store.

Scoped tight on purpose: the credit budget is small, and the architecture - not
corpus size - is what we are proving. We include treatment reviews that tend to
report conflicting trials, so the contradiction stage has something genuine to find.
"""
import json
import ssl
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from config import USER_AGENT
import db

_CTX = ssl.create_default_context()
_EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

# Curated PMIDs known to contain genuine, surfaceable efficacy disagreements.
# Including contested-topic papers on purpose is the disclosed proof-of-concept
# choice (see handoff): it demonstrates contradiction surfacing, it does not
# claim anything about the field's overall contradiction density.
SEED_PMIDS = [
    "28178022",  # Essential fatty acids / B vitamins / magnesium in PMS (mixed findings)
    "23136064",  # Vitex agnus-castus systematic review (study-vs-study disagreement)
]

# Ordered by likelihood of containing genuine, surfaceable disagreement.
QUERIES = [
    "premenstrual syndrome vitamin B6 pyridoxine systematic review",
    "Vitex agnus castus premenstrual dysphoric disorder review",
    "premenstrual syndrome essential fatty acids evening primrose",
    "premenstrual dysphoric disorder SSRI efficacy adverse effects",
    "premenstrual syndrome calcium magnesium randomized",
]


def fetch_pmids(conn, pmids):
    """Fetch specific PMIDs directly via efetch (no esearch; deterministic)."""
    seen = {r["external_id"] for r in conn.execute(
        "SELECT external_id FROM documents WHERE source='pubmed'")}
    want = [p for p in pmids if p not in seen]
    if not want:
        return 0
    try:
        articles = parse_articles(efetch(want))
    except Exception as e:
        print(f"  [warn] seed efetch failed: {e}")
        return 0
    inserted = 0
    for a in articles:
        raw_text = f"{a['title']}\n\n{a['abstract']}"
        csha = db.sha256(raw_text)
        if conn.execute("SELECT 1 FROM documents WHERE content_sha256=?", (csha,)).fetchone():
            continue
        conn.execute(
            "INSERT INTO documents (id, content_sha256, source, external_id, url, title,"
            " raw_text, retrieved_at, meta_json) VALUES (?,?,?,?,?,?,?,?,?)",
            (db.new_id(), csha, "pubmed", a["pmid"],
             f"https://pubmed.ncbi.nlm.nih.gov/{a['pmid']}/", a["title"], raw_text,
             datetime.now(timezone.utc).isoformat(),
             json.dumps({"journal": a["journal"], "year": a["year"], "query": "seed-pmid"})))
        inserted += 1
        print(f"  + (seed) PMID {a['pmid']} ({a['year']}): {a['title'][:60]}")
    conn.commit()
    time.sleep(0.5)
    return inserted


def _get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as r:
        return r.read()


def esearch(query, retmax=2):
    params = urllib.parse.urlencode({
        "db": "pubmed", "term": query, "retmax": retmax,
        "retmode": "json", "sort": "relevance",
    })
    data = json.loads(_get(f"{_EUTILS}/esearch.fcgi?{params}"))
    return data.get("esearchresult", {}).get("idlist", [])


def efetch(pmids):
    params = urllib.parse.urlencode({"db": "pubmed", "id": ",".join(pmids), "retmode": "xml"})
    return _get(f"{_EUTILS}/efetch.fcgi?{params}").decode("utf-8")


def _text(el):
    return "".join(el.itertext()).strip() if el is not None else ""


def parse_articles(xml_text):
    root = ET.fromstring(xml_text)
    out = []
    for art in root.findall(".//PubmedArticle"):
        pmid = _text(art.find(".//PMID"))
        title = _text(art.find(".//ArticleTitle"))
        parts = []
        for ab in art.findall(".//Abstract/AbstractText"):
            label, seg = ab.get("Label"), _text(ab)
            if seg:
                parts.append(f"{label}: {seg}" if label else seg)
        abstract = " ".join(parts)
        if title and abstract:
            out.append({
                "pmid": pmid, "title": title, "abstract": abstract,
                "journal": _text(art.find(".//Journal/Title")),
                "year": _text(art.find(".//JournalIssue/PubDate/Year")),
            })
    return out


def run(max_documents=5, per_query=2):
    conn = db.connect()
    # Deterministic seed papers first (known to contain genuine disagreements).
    inserted = fetch_pmids(conn, SEED_PMIDS)
    seen = {r["external_id"] for r in conn.execute(
        "SELECT external_id FROM documents WHERE source='pubmed'")}
    for q in QUERIES:
        if inserted >= max_documents:
            break
        try:
            pmids = [p for p in esearch(q, retmax=per_query) if p not in seen]
        except Exception as e:
            print(f"  [warn] esearch failed for {q!r}: {e}")
            continue
        if not pmids:
            continue
        try:
            articles = parse_articles(efetch(pmids))
        except Exception as e:
            print(f"  [warn] efetch failed for {q!r}: {e}")
            continue
        for a in articles:
            if inserted >= max_documents:
                break
            raw_text = f"{a['title']}\n\n{a['abstract']}"
            csha = db.sha256(raw_text)
            if conn.execute("SELECT 1 FROM documents WHERE content_sha256=?", (csha,)).fetchone():
                continue
            conn.execute(
                "INSERT INTO documents (id, content_sha256, source, external_id, url, title,"
                " raw_text, retrieved_at, meta_json) VALUES (?,?,?,?,?,?,?,?,?)",
                (db.new_id(), csha, "pubmed", a["pmid"],
                 f"https://pubmed.ncbi.nlm.nih.gov/{a['pmid']}/", a["title"], raw_text,
                 datetime.now(timezone.utc).isoformat(),
                 json.dumps({"journal": a["journal"], "year": a["year"], "query": q})))
            seen.add(a["pmid"])
            inserted += 1
            print(f"  + PMID {a['pmid']} ({a['year']}): {a['title'][:68]}")
        time.sleep(0.4)
    conn.commit()
    return inserted


if __name__ == "__main__":
    db.init_db()
    print(f"Fetched {run()} new documents.")
