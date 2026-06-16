"""Community arm ingestion — Reddit posts AND comments -> TEXT documents.

Reuses the legacy condition->subreddit map and treatment queries
(scripts/reddit-pipeline.js) but DISCARDS its LLM synthesis. Instead of summarizing,
it stores **each post and each comment as its own text document** with thread metadata
(thread_id, author, parent_id, created_utc, score, kind) in meta, so downstream scoring
can compute independence (same-thread replies discounted), stance, and manipulation caps
(SCORING_SPEC §2 community, §4). The legacy only fetched POSTS; we also fetch COMMENTS,
because that's where agreement/disagreement lives.

These are TEXT documents: they flow through the normal chunk -> extract_claims (with a
COMMUNITY-tuned prompt) -> verify -> score pipeline. So a real LLM extraction pass runs on
them (unlike the deterministic pathway arm). Surfaced as patient-reported SIGNAL, never
clinical evidence.

Free to run (public Reddit JSON, no auth). Writes only to the local working store.

    python3 scripts/substrate/fetch_community.py                       # all six conditions
    python3 scripts/substrate/fetch_community.py --conditions endometriosis --max-posts 10
"""
import re
import sys
import json
import ssl
import time
import html
import argparse
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import db
from config import CONDITIONS

_CTX = ssl.create_default_context()
_UA = "WhelSubstrate/1.0 (research tool; women's-health evidence; contact via whel.bio)"
_DELAY = 0.8  # polite, matches the legacy pipeline

# condition key -> subreddits (ported from scripts/reddit-pipeline.js CONDITION_SUBREDDITS)
_SUBREDDITS = {
    "endometriosis": ["Endo", "endometriosis"],
    "adenomyosis":   ["adenomyosis", "endometriosis"],
    "PMDD":          ["PMDD"],
    "PCOS":          ["PCOS"],
    "menopause":     ["Menopause", "Perimenopause"],
    "vulvodynia":    ["vulvodynia", "PelvicFloor"],
}

_QUERIES = [
    "what helped", "medication", "treatment", "anyone tried",
    "worked for me", "off label", "my doctor prescribed", "supplement",
]

_DELETED = {"[deleted]", "[removed]", ""}


def _get(url):
    req = urllib.request.Request(url, headers={"User-Agent": _UA})
    try:
        with urllib.request.urlopen(req, timeout=30, context=_CTX) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code in (403, 404, 429):
            return None
        raise


def _search(subreddit, query, limit=25):
    q = urllib.parse.quote(query)
    url = (f"https://www.reddit.com/r/{subreddit}/search.json"
           f"?q={q}&sort=top&limit={limit}&t=all&restrict_sr=1")
    data = _get(url)
    time.sleep(_DELAY)
    if not data:
        return []
    out = []
    for ch in (data.get("data") or {}).get("children", []):
        p = ch.get("data") or {}
        if not (p.get("title") or p.get("selftext")):
            continue
        out.append(p)
    return out


def _flatten_comments(listing, thread_id, acc, cap):
    """Recursively flatten a Reddit comment listing into flat dicts (capped)."""
    for ch in (listing or {}).get("data", {}).get("children", []):
        if len(acc) >= cap:
            return
        if ch.get("kind") != "t1":
            continue
        c = ch.get("data") or {}
        body = (c.get("body") or "").strip()
        if body not in _DELETED:
            acc.append({
                "id": c.get("id"), "body": body, "author": c.get("author"),
                "created_utc": c.get("created_utc"), "score": c.get("score"),
                "parent_id": c.get("parent_id"), "thread_id": thread_id,
            })
        replies = c.get("replies")
        if isinstance(replies, dict):
            _flatten_comments(replies, thread_id, acc, cap)


def _fetch_comments(permalink, thread_id, cap=20):
    data = _get(f"https://www.reddit.com{permalink}.json?limit=50&sort=top")
    time.sleep(_DELAY)
    if not isinstance(data, list) or len(data) < 2:
        return []
    acc = []
    _flatten_comments(data[1], thread_id, acc, cap)
    return acc


def _clean(text):
    return html.unescape(text or "").strip()


def _insert_doc(conn, *, external_id, url, title, raw_text, meta):
    if not raw_text.strip():
        return False
    csha = db.sha256(raw_text)
    if conn.execute("SELECT 1 FROM documents WHERE content_sha256=?", (csha,)).fetchone():
        return False
    conn.execute(
        "INSERT INTO documents (id, content_sha256, source, external_id, url, title,"
        " raw_text, retrieved_at, meta_json) VALUES (?,?,?,?,?,?,?,?,?)",
        (db.new_id(), csha, "reddit", external_id, url, (title or raw_text)[:120], raw_text,
         datetime.now(timezone.utc).isoformat(), json.dumps(meta)))
    return True


def fetch_condition(conn, cond_key, max_posts=15, max_comments=20):
    subs = _SUBREDDITS.get(cond_key, [])
    if not subs:
        print(f"  [{cond_key}] no subreddits mapped — skipping")
        return 0
    # gather candidate posts across this condition's subreddits + queries
    posts, seen = [], set()
    for sub in subs:
        for q in _QUERIES:
            for p in _search(sub, q):
                pid = p.get("id")
                if pid and pid not in seen and "/comments/" in (p.get("permalink") or ""):
                    seen.add(pid)
                    posts.append(p)
    posts.sort(key=lambda p: p.get("score", 0), reverse=True)
    posts = posts[:max_posts]

    made = 0
    for p in posts:
        pid = p.get("id")
        permalink = p.get("permalink")
        url = f"https://www.reddit.com{permalink}"
        title = _clean(p.get("title"))
        body = _clean(p.get("selftext"))[:4000]
        post_text = (title + "\n\n" + body).strip()
        base_meta = {"condition": cond_key, "subreddit": f"r/{p.get('subreddit')}",
                     "thread_id": pid, "kind": "post", "author": p.get("author"),
                     "created_utc": p.get("created_utc"), "score": p.get("score")}
        if _insert_doc(conn, external_id=f"t3_{pid}", url=url, title=title,
                       raw_text=post_text, meta=base_meta):
            made += 1
        # comments for this post (this is where agreement/disagreement lives)
        for c in _fetch_comments(permalink, pid, cap=max_comments):
            cbody = _clean(c["body"])[:4000]
            cmeta = {"condition": cond_key, "subreddit": f"r/{p.get('subreddit')}",
                     "thread_id": pid, "kind": "comment", "author": c.get("author"),
                     "parent_id": c.get("parent_id"), "created_utc": c.get("created_utc"),
                     "score": c.get("score")}
            cid = c.get("id")
            if _insert_doc(conn, external_id=f"t1_{cid}", url=f"{url}{cid}/", title=title,
                           raw_text=cbody, meta=cmeta):
                made += 1
        conn.commit()
    print(f"  [{cond_key}] {len(posts)} posts + their comments -> {made} documents")
    return made


def run(conditions=None, max_posts=15, max_comments=20):
    conn = db.connect()
    keys = conditions or list(CONDITIONS.keys())
    total = 0
    for ck in keys:
        total += fetch_condition(conn, ck, max_posts=max_posts, max_comments=max_comments)
    print(f"  community(reddit): {total} new document(s)")
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--conditions", type=str, default=None,
                    help="comma-separated subset (default: all six)")
    ap.add_argument("--max-posts", type=int, default=15, help="top posts per condition")
    ap.add_argument("--max-comments", type=int, default=20, help="comments per post")
    args = ap.parse_args()
    conds = [c.strip() for c in args.conditions.split(",")] if args.conditions else None
    db.init_db()
    run(conditions=conds, max_posts=args.max_posts, max_comments=args.max_comments)
    return 0


if __name__ == "__main__":
    sys.exit(main())
