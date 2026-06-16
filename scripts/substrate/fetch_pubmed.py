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

from config import USER_AGENT, CONDITIONS
import db

_CTX = ssl.create_default_context()
_EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


def _insert_article(conn, a, query, cond_key):
    """Insert one article as an immutable, content-addressed document, tagged with
    its condition (in meta). Returns True if newly inserted, False if a duplicate."""
    raw_text = f"{a['title']}\n\n{a['abstract']}"
    csha = db.sha256(raw_text)
    if conn.execute("SELECT 1 FROM documents WHERE content_sha256=?", (csha,)).fetchone():
        return False
    conn.execute(
        "INSERT INTO documents (id, content_sha256, source, external_id, url, title,"
        " raw_text, retrieved_at, meta_json) VALUES (?,?,?,?,?,?,?,?,?)",
        (db.new_id(), csha, "pubmed", a["pmid"],
         f"https://pubmed.ncbi.nlm.nih.gov/{a['pmid']}/", a["title"], raw_text,
         datetime.now(timezone.utc).isoformat(),
         json.dumps({"journal": a["journal"], "year": a["year"], "query": query,
                     "condition": cond_key})))
    return True


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


def fetch_condition(conn, cond_key, max_documents=5, per_query=2):
    """Fetch up to max_documents NEW abstracts for one condition: deterministic
    seed PMIDs first, then its queries. Every document is tagged with cond_key."""
    cond = CONDITIONS[cond_key]
    seen = {r["external_id"] for r in conn.execute(
        "SELECT external_id FROM documents WHERE source='pubmed'")}
    inserted = 0

    seeds = [p for p in cond.get("seed_pmids", []) if p not in seen]
    if seeds:
        try:
            for a in parse_articles(efetch(seeds)):
                if inserted >= max_documents:
                    break
                if _insert_article(conn, a, "seed-pmid", cond_key):
                    seen.add(a["pmid"])
                    inserted += 1
                    print(f"  + ({cond_key} seed) PMID {a['pmid']} ({a['year']}): {a['title'][:56]}")
            conn.commit()
            time.sleep(0.5)
        except Exception as e:
            print(f"  [warn] {cond_key} seed efetch failed: {e}")

    for q in cond["queries"]:
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
            if _insert_article(conn, a, q, cond_key):
                seen.add(a["pmid"])
                inserted += 1
                print(f"  + ({cond_key}) PMID {a['pmid']} ({a['year']}): {a['title'][:60]}")
        conn.commit()
        time.sleep(0.4)
    return inserted


def run(max_per_condition=5, per_query=2, conditions=None):
    """Fetch across all six conditions (or a subset). Each document is tagged with
    its condition so extraction can focus on it."""
    conn = db.connect()
    keys = conditions or list(CONDITIONS.keys())
    total = 0
    for ck in keys:
        print(f"  [{ck}]")
        total += fetch_condition(conn, ck, max_documents=max_per_condition, per_query=per_query)
    return total


if __name__ == "__main__":
    db.init_db()
    print(f"Fetched {run()} new documents.")
