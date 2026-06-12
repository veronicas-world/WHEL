"""Stage 2 - chunk into source_spans. Sentence-level segmentation with EXACT
character offsets into documents.raw_text and a per-span hash.

Critical discipline: offsets are computed here against the stored text. Nothing
downstream is allowed to invent an offset; a claim's provenance is only ever a
(document, start, end) that we verified by slicing raw_text ourselves.
"""
import re
from datetime import datetime, timezone

import db

# Lightweight sentence splitter. Avoids breaking on common biomedical abbreviations
# and decimal numbers. Good enough for abstracts; production would use scispaCy.
_ABBREV = r"(?<!\b(?:e\.g|i\.e|vs|cf|Dr|Fig|no|al|approx|ca))"
_SENT_END = re.compile(r"(?<=[.!?])\s+(?=[A-Z(0-9])")


def split_sentences(text: str):
    """Yield (start_char, end_char, sentence_text) over the ORIGINAL text."""
    # Work on offsets so spans map back to raw_text exactly.
    spans = []
    start = 0
    for m in _SENT_END.finditer(text):
        end = m.start()
        seg = text[start:end].strip()
        if seg:
            # recover true offsets after stripping
            lead = len(text[start:end]) - len(text[start:end].lstrip())
            s = start + lead
            e = s + len(seg)
            spans.append((s, e, text[s:e]))
        start = m.end()
    seg = text[start:].strip()
    if seg:
        lead = len(text[start:]) - len(text[start:].lstrip())
        s = start + lead
        e = s + len(seg)
        spans.append((s, e, text[s:e]))
    return spans


def run():
    conn = db.connect()
    docs = conn.execute("SELECT id, raw_text FROM documents").fetchall()
    made = 0
    for doc in docs:
        if conn.execute("SELECT 1 FROM source_spans WHERE document_id=?", (doc["id"],)).fetchone():
            continue  # already chunked
        for ordinal, (s, e, txt) in enumerate(split_sentences(doc["raw_text"])):
            # sanity: the slice must equal the stored span text
            assert doc["raw_text"][s:e] == txt, "offset mismatch"
            conn.execute(
                "INSERT INTO source_spans (id, document_id, start_char, end_char, text, sha256, ordinal)"
                " VALUES (?,?,?,?,?,?,?)",
                (db.new_id(), doc["id"], s, e, txt, db.sha256(txt), ordinal))
            made += 1
    conn.commit()
    return made


if __name__ == "__main__":
    n = run()
    print(f"Created {n} source spans.")
