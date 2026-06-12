"""Stage 2 - chunk into source_spans. Sentence segmentation with EXACT character
offsets into documents.raw_text and a per-span hash. Offsets are computed here
against the stored text; nothing downstream is allowed to invent an offset.
"""
import re
import db

_SENT_END = re.compile(r"(?<=[.!?])\s+(?=[A-Z(0-9])")


def split_sentences(text):
    spans, start = [], 0
    for m in _SENT_END.finditer(text):
        seg = text[start:m.start()].strip()
        if seg:
            lead = len(text[start:m.start()]) - len(text[start:m.start()].lstrip())
            s = start + lead
            spans.append((s, s + len(seg), text[s:s + len(seg)]))
        start = m.end()
    seg = text[start:].strip()
    if seg:
        lead = len(text[start:]) - len(text[start:].lstrip())
        s = start + lead
        spans.append((s, s + len(seg), text[s:s + len(seg)]))
    return spans


def run():
    conn = db.connect()
    made = 0
    for doc in conn.execute("SELECT id, raw_text FROM documents").fetchall():
        if conn.execute("SELECT 1 FROM source_spans WHERE document_id=?", (doc["id"],)).fetchone():
            continue
        for ordinal, (s, e, txt) in enumerate(split_sentences(doc["raw_text"])):
            assert doc["raw_text"][s:e] == txt, "offset mismatch"
            conn.execute(
                "INSERT INTO source_spans (id, document_id, start_char, end_char, text, sha256, ordinal)"
                " VALUES (?,?,?,?,?,?,?)",
                (db.new_id(), doc["id"], s, e, txt, db.sha256(txt), ordinal))
            made += 1
    conn.commit()
    return made


if __name__ == "__main__":
    print(f"Created {run()} source spans.")
