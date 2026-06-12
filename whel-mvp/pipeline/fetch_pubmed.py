"""Stage 1 - fetch. Pull real PMDD abstracts from PubMed E-utilities (free, public,
Tier-1-clean license) and store each as an immutable, hash-addressed document.

We deliberately query several contested PMDD treatments so the downstream pipeline
has a real chance of surfacing genuine contradictions in the literature.
"""
import json
import ssl
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from config import RAW_DIR
import db

_CTX = ssl.create_default_context()
_EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

# Contested / nuanced PMDD/PMS treatment queries -> likelier to contain disagreement.
# We deliberately pull BOTH sides of long-running efficacy debates (e.g. progesterone,
# evening primrose oil, vitamin B6) by querying for benefit AND for "no evidence" reviews,
# so the contradiction detector has genuine opposing efficacy claims to surface.
QUERIES = [
    "premenstrual dysphoric disorder SSRI treatment",
    "premenstrual dysphoric disorder calcium",
    "premenstrual syndrome evening primrose oil efficacy",
    "premenstrual syndrome evening primrose oil systematic review",
    "premenstrual syndrome progesterone effective",
    "premenstrual syndrome progesterone no evidence Cochrane",
    "premenstrual syndrome vitamin B6 pyridoxine effective",
    "premenstrual syndrome vitamin B6 systematic review evidence",
    "premenstrual dysphoric disorder chasteberry vitex agnus castus",
    "premenstrual syndrome St John's wort randomized",
]


def _get(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "whel-mvp/0.1 (research)"})
    with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as r:
        return r.read()


def esearch(query: str, retmax: int = 3) -> list:
    params = urllib.parse.urlencode({
        "db": "pubmed", "term": query, "retmax": retmax,
        "retmode": "json", "sort": "relevance",
    })
    data = json.loads(_get(f"{_EUTILS}/esearch.fcgi?{params}"))
    return data.get("esearchresult", {}).get("idlist", [])


def efetch(pmids: list) -> str:
    params = urllib.parse.urlencode({
        "db": "pubmed", "id": ",".join(pmids), "retmode": "xml",
    })
    return _get(f"{_EUTILS}/efetch.fcgi?{params}").decode("utf-8")


def _text(el):
    return "".join(el.itertext()).strip() if el is not None else ""


def parse_articles(xml_text: str) -> list:
    root = ET.fromstring(xml_text)
    out = []
    for art in root.findall(".//PubmedArticle"):
        pmid = _text(art.find(".//PMID"))
        title = _text(art.find(".//ArticleTitle"))
        # Abstracts can have multiple labelled sections; join in order.
        parts = []
        for ab in art.findall(".//Abstract/AbstractText"):
            label = ab.get("Label")
            seg = _text(ab)
            if not seg:
                continue
            parts.append(f"{label}: {seg}" if label else seg)
        abstract = " ".join(parts)
        journal = _text(art.find(".//Journal/Title"))
        year = _text(art.find(".//JournalIssue/PubDate/Year"))
        if title and abstract:
            out.append({
                "pmid": pmid, "title": title, "abstract": abstract,
                "journal": journal, "year": year,
            })
    return out


def run(per_query: int = 2):
    """Fetch abstracts and upsert documents. Returns number of new documents."""
    conn = db.connect()
    seen_pmids = {row["external_id"] for row in conn.execute(
        "SELECT external_id FROM documents WHERE source='pubmed'")}
    inserted = 0
    for q in QUERIES:
        try:
            pmids = esearch(q, retmax=per_query)
        except Exception as e:
            print(f"  [warn] esearch failed for {q!r}: {e}")
            continue
        pmids = [p for p in pmids if p not in seen_pmids]
        if not pmids:
            continue
        try:
            articles = parse_articles(efetch(pmids))
        except Exception as e:
            print(f"  [warn] efetch failed for {q!r}: {e}")
            continue
        for a in articles:
            # The text we will extract from = title + abstract. Store immutably.
            raw_text = f"{a['title']}\n\n{a['abstract']}"
            doc_id = db.sha256(raw_text)
            if conn.execute("SELECT 1 FROM documents WHERE id=?", (doc_id,)).fetchone():
                continue
            url = f"https://pubmed.ncbi.nlm.nih.gov/{a['pmid']}/"
            meta = {"journal": a["journal"], "year": a["year"], "query": q}
            conn.execute(
                "INSERT INTO documents (id, source, external_id, url, title, raw_text, retrieved_at, meta_json)"
                " VALUES (?,?,?,?,?,?,?,?)",
                (doc_id, "pubmed", a["pmid"], url, a["title"], raw_text,
                 datetime.now(timezone.utc).isoformat(), json.dumps(meta)))
            # Immutable raw copy on disk, hash-addressed.
            (RAW_DIR / f"{doc_id}.txt").write_text(raw_text)
            seen_pmids.add(a["pmid"])
            inserted += 1
            print(f"  + PMID {a['pmid']} ({a['year']}): {a['title'][:70]}")
        time.sleep(0.4)  # be polite to NCBI
    conn.commit()
    return inserted


if __name__ == "__main__":
    db.init_db()
    n = run()
    print(f"Fetched {n} new documents.")
