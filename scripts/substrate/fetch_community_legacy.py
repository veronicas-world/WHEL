"""Community arm — ARCHIVAL backfill from the legacy Reddit data already in Supabase.

Reddit's app-creation form is broken on Reddit's side, so we can't fetch fresh posts and
comments. But the legacy database holds ~190 real Reddit POSTS captured before the block —
each with a real permalink and a real, patient-authored TITLE. A post title is verbatim
patient text with a verifiable URL, so it can enter the substrate honestly.

What we DO use: the verbatim post title (raw_text) + its real URL (provenance).
What we deliberately DON'T use: the legacy LLM-synthesized signal summaries ("Multiple
users report ...") — that cross-synthesis is exactly what the substrate replaces, and the
body excerpts were never populated.

Each post is tagged legacy=true, title_only=true so it is clearly archival: title-only
means no body or comments, so independence / stance analysis is limited and post titles
self-select toward dramatic outcomes. To be replaced/augmented with full posts + comments
once Reddit access returns.

    python3 scripts/substrate/fetch_community_legacy.py
"""
import re
import sys
import json
from datetime import datetime, timezone

import db
import sb
from config import CONDITIONS

# subreddit (lowercased) -> our condition key (reverse of fetch_community._SUBREDDITS)
_SUB_TO_COND = {
    "endo": "endometriosis", "endometriosis": "endometriosis", "adenomyosis": "adenomyosis",
    "pmdd": "PMDD", "pcos": "PCOS", "menopause": "menopause", "perimenopause": "menopause",
    "vulvodynia": "vulvodynia", "pelvicfloor": "vulvodynia",
}
_URL_RE = re.compile(r"reddit\.com/r/([^/]+)/comments/([^/]+)/", re.I)


def run():
    conn = db.connect()
    rows = sb.get("sources?source_type=eq.reddit&select=url,title") or []
    made = skipped = 0
    for r in rows:
        url = r.get("url") or ""
        title = (r.get("title") or "").strip()
        m = _URL_RE.search(url)
        if not m or not title:
            skipped += 1
            continue
        sub, post_id = m.group(1).lower(), m.group(2)
        ck = _SUB_TO_COND.get(sub)
        if ck not in CONDITIONS:
            skipped += 1
            continue
        csha = db.sha256(title)
        if conn.execute("SELECT 1 FROM documents WHERE content_sha256=?", (csha,)).fetchone():
            continue
        conn.execute(
            "INSERT INTO documents (id, content_sha256, source, external_id, url, title,"
            " raw_text, retrieved_at, meta_json) VALUES (?,?,?,?,?,?,?,?,?)",
            (db.new_id(), csha, "reddit", f"t3_{post_id}", url, title[:120], title,
             datetime.now(timezone.utc).isoformat(),
             json.dumps({"condition": ck, "kind": "post", "thread_id": post_id,
                         "subreddit": f"r/{sub}", "legacy": True, "title_only": True})))
        made += 1
    conn.commit()
    print(f"  community(reddit-legacy): {made} archival post-title document(s)"
          f" ({skipped} skipped: no subreddit match / empty title)")
    return made


if __name__ == "__main__":
    db.init_db()
    run()
    sys.exit(0)
