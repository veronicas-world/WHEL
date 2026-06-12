"""Render the PMDD/PMS substrate to a single self-contained HTML page.

This is the output layer in miniature: a condition page where every claim is anchored
to its source span (verbatim quote + character offsets + PubMed link), every claim
carries an entailment verdict, and contradictions are surfaced explicitly rather than
averaged into a consensus. No framework, no build step - open the file in a browser.
"""
import html
import json
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "pipeline"))
import db  # noqa: E402
from config import RENDER_OUT  # noqa: E402

MAGENTA = "#7A1F3D"
TINT = "#F4E4EC"

DIR_STYLE = {
    "positive": ("#1b5e20", "#e6f4ea", "supports"),
    "null":     ("#7a4f01", "#fdf3e0", "no benefit"),
    "negative": ("#8a1c1c", "#fbe9e9", "harmful / worse"),
    "unclear":  ("#444",    "#eee",    "unclear"),
}
ENT_STYLE = {
    "entailed":     ("#1b5e20", "#e6f4ea"),
    "neutral":      ("#7a4f01", "#fdf3e0"),
    "contradicted": ("#8a1c1c", "#fbe9e9"),
    None:           ("#777",    "#eee"),
}


def esc(s):
    return html.escape(s or "")


def claim_card(conn, c, show_intervention=True):
    doc = conn.execute("SELECT * FROM documents WHERE id=?", (c["document_id"],)).fetchone()
    meta = json.loads(doc["meta_json"] or "{}")
    dcol, dbg, dlabel = DIR_STYLE.get(c["direction"], DIR_STYLE["unclear"])
    ecol, ebg = ENT_STYLE.get(c["entailment_label"], ENT_STYLE[None])
    ent = c["entailment_label"] or "pending"
    escore = f" {c['entailment_score']:.2f}" if c["entailment_score"] is not None else ""
    prov = ("verified" if c["provenance_verified"] else "UNVERIFIED")
    offsets = (f"chars {c['quote_start_char']}\u2013{c['quote_end_char']}"
               if c["quote_start_char"] is not None else "offset n/a")
    interv = ""
    if show_intervention:
        e = conn.execute("SELECT label FROM entities WHERE id=?", (c["intervention_id"],)).fetchone()
        interv = f'<span class="pill">{esc(e["label"]) if e else "?"}</span>'
    return f"""
    <div class="claim">
      <div class="claim-head">
        {interv}
        <span class="badge" style="color:{dcol};background:{dbg}">{c['direction']} \u00b7 {dlabel}</span>
        <span class="badge" style="color:{ecol};background:{ebg}">entailment: {ent}{escore}</span>
        <span class="badge prov">provenance: {prov}</span>
      </div>
      <div class="claim-text">{esc(c['text'])}</div>
      <div class="prov-box">
        <div class="quote">&ldquo;{esc(c['exact_quote'])}&rdquo;</div>
        <div class="src">
          <a href="{esc(doc['url'])}" target="_blank">{esc(doc['title'])}</a>
          <span class="muted"> &middot; {esc(meta.get('journal',''))} {esc(meta.get('year',''))}
          &middot; PMID {esc(doc['external_id'])} &middot; {offsets}</span>
        </div>
      </div>
    </div>"""


def build():
    conn = db.connect()
    docs = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    spans = conn.execute("SELECT COUNT(*) FROM source_spans").fetchone()[0]
    claims_n = conn.execute("SELECT COUNT(*) FROM claims").fetchone()[0]
    verified = conn.execute("SELECT COUNT(*) FROM claims WHERE provenance_verified=1").fetchone()[0]
    contra_n = conn.execute("SELECT COUNT(*) FROM contradictions").fetchone()[0]

    # --- contradictions block ---
    contras = conn.execute("SELECT * FROM contradictions ORDER BY nli_score DESC").fetchall()
    contra_html = ""
    for ct in contras:
        a = conn.execute("SELECT * FROM claims WHERE id=?", (ct["claim_a_id"],)).fetchone()
        b = conn.execute("SELECT * FROM claims WHERE id=?", (ct["claim_b_id"],)).fetchone()
        e = conn.execute("SELECT label FROM entities WHERE id=?", (ct["intervention_id"],)).fetchone()
        cnd = conn.execute("SELECT label FROM entities WHERE id=?", (ct["condition_id"],)).fetchone()
        contra_html += f"""
      <div class="contra">
        <div class="contra-top">
          <span class="contra-tag">CONTRADICTION</span>
          <strong>{esc(e['label'] if e else '?')}</strong> &middot; {esc(cnd['label'] if cnd else '')}
          <span class="muted">disagreement score {ct['nli_score']:.2f}</span>
        </div>
        <div class="contra-pair">
          <div class="side">{claim_card(conn, a, show_intervention=False)}</div>
          <div class="vs">vs</div>
          <div class="side">{claim_card(conn, b, show_intervention=False)}</div>
        </div>
        <div class="rationale"><strong>Why surfaced:</strong> {esc(ct['rationale'])}</div>
      </div>"""

    # --- claims grouped by intervention ---
    interventions = conn.execute("""
        SELECT e.id, e.label, COUNT(*) n FROM claims c
        JOIN entities e ON c.intervention_id=e.id
        WHERE c.provenance_verified=1 AND e.type='intervention'
        GROUP BY e.id ORDER BY n DESC, e.label""").fetchall()
    groups_html = ""
    for iv in interventions:
        cl = conn.execute("""SELECT * FROM claims WHERE intervention_id=? AND provenance_verified=1
                             ORDER BY aspect, direction""", (iv["id"],)).fetchall()
        cards = "".join(claim_card(conn, c, show_intervention=False) for c in cl)
        groups_html += f"""
      <details class="group" {'open' if iv['n']>=4 else ''}>
        <summary><span class="pill">{esc(iv['label'])}</span> <span class="muted">{iv['n']} verified claims</span></summary>
        {cards}
      </details>"""

    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Whel \u2014 PMDD / PMS Evidence Substrate (MVP)</title>
<style>
  :root {{ --magenta:{MAGENTA}; --tint:{TINT}; }}
  * {{ box-sizing:border-box; }}
  body {{ font-family:Georgia, 'Times New Roman', serif; color:#1a1a1a; margin:0;
         background:#faf8f9; line-height:1.5; }}
  .wrap {{ max-width:960px; margin:0 auto; padding:32px 22px 80px; }}
  header h1 {{ font-size:40px; color:var(--magenta); margin:0 0 4px; letter-spacing:.5px; }}
  header .sub {{ font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:2px;
               text-transform:uppercase; color:#666; }}
  .lede {{ font-size:17px; margin:18px 0 6px; }}
  .stats {{ display:flex; flex-wrap:wrap; gap:10px; margin:18px 0 8px; font-family:Arial,sans-serif; }}
  .stat {{ background:#fff; border:1px solid #e7dde2; border-radius:10px; padding:10px 14px; }}
  .stat b {{ display:block; font-size:22px; color:var(--magenta); }}
  .stat span {{ font-size:12px; color:#666; }}
  h2 {{ font-size:24px; color:var(--magenta); margin:38px 0 6px; border-bottom:2px solid var(--tint);
        padding-bottom:6px; }}
  .note {{ font-family:Arial,sans-serif; font-size:13px; color:#555; background:var(--tint);
          border-radius:8px; padding:12px 14px; margin:10px 0; }}
  .badge {{ font-family:Arial,sans-serif; font-size:11px; font-weight:bold; padding:2px 8px;
           border-radius:20px; margin-right:6px; white-space:nowrap; }}
  .badge.prov {{ color:#0b3d63; background:#e3eefc; }}
  .pill {{ font-family:Arial,sans-serif; font-size:13px; font-weight:bold; background:var(--magenta);
          color:#fff; padding:2px 10px; border-radius:20px; }}
  .claim {{ background:#fff; border:1px solid #e7dde2; border-left:4px solid var(--magenta);
           border-radius:8px; padding:12px 14px; margin:10px 0; }}
  .claim-head {{ margin-bottom:6px; }}
  .claim-text {{ font-size:16px; margin:4px 0 8px; }}
  .prov-box {{ background:#fbf9fa; border:1px dashed #d9c7cf; border-radius:6px; padding:8px 10px; }}
  .quote {{ font-style:italic; color:#333; }}
  .src {{ font-family:Arial,sans-serif; font-size:12px; margin-top:5px; }}
  .src a {{ color:var(--magenta); }}
  .muted {{ color:#888; }}
  .contra {{ background:#fff; border:1px solid #efcdd8; border-radius:12px; padding:14px 16px;
            margin:14px 0; box-shadow:0 1px 4px rgba(122,31,61,.06); }}
  .contra-top {{ font-family:Arial,sans-serif; margin-bottom:8px; }}
  .contra-tag {{ background:var(--magenta); color:#fff; font-size:11px; font-weight:bold;
                padding:2px 8px; border-radius:4px; letter-spacing:1px; margin-right:8px; }}
  .contra-pair {{ display:grid; grid-template-columns:1fr 30px 1fr; align-items:center; gap:6px; }}
  .vs {{ text-align:center; font-family:Arial,sans-serif; font-weight:bold; color:var(--magenta); }}
  .rationale {{ font-family:Arial,sans-serif; font-size:13px; margin-top:8px; color:#444; }}
  details.group {{ background:#fff; border:1px solid #e7dde2; border-radius:8px; padding:6px 14px; margin:10px 0; }}
  summary {{ cursor:pointer; padding:6px 0; font-size:15px; }}
  @media (max-width:680px) {{ .contra-pair {{ grid-template-columns:1fr; }} .vs {{ padding:4px; }} }}
</style></head>
<body><div class="wrap">
  <header>
    <h1>Whel</h1>
    <div class="sub">Women&rsquo;s Health Evidence Lab &middot; PMDD / PMS substrate &middot; MVP</div>
  </header>
  <p class="lede">A working slice of the evidence substrate: real PubMed claims about premenstrual
  (PMDD/PMS) treatments, each <strong>anchored to a verbatim source span</strong>, each checked for whether
  its own quote actually supports it, and disagreements in the literature <strong>surfaced, not averaged</strong>.</p>
  <div class="stats">
    <div class="stat"><b>{docs}</b><span>PubMed documents</span></div>
    <div class="stat"><b>{spans}</b><span>source spans</span></div>
    <div class="stat"><b>{claims_n}</b><span>atomic claims</span></div>
    <div class="stat"><b>{verified}</b><span>provenance-verified</span></div>
    <div class="stat"><b>{contra_n}</b><span>contradictions surfaced</span></div>
  </div>

  <h2>Contradictions surfaced</h2>
  <div class="note">Whel does not collapse disagreement into a consensus. Where two provenance-verified
  efficacy claims about the same treatment conflict, both are shown side by side with their sources intact.</div>
  {contra_html or '<p class="muted">No contradictions in this slice.</p>'}

  <h2>Claims by treatment</h2>
  <div class="note">Every claim links to its exact source: a verbatim quote, character offsets into the
  stored document, and the PubMed record. <b>Entailment</b> records whether the quote actually supports the
  claim &mdash; e.g. a vitamin-B6 claim sourced from a &ldquo;B6, calcium, and zinc&rdquo; quote is marked
  <i>neutral</i> (overreach), and an evening-primrose-oil claim whose quote is about other conditions is
  excluded entirely. The substrate refuses claims it cannot trace.</div>
  {groups_html}

  <p class="muted" style="margin-top:40px; font-family:Arial,sans-serif; font-size:12px;">
  Generated by the Whel MVP pipeline (PubMed &rarr; spans &rarr; atomic claims with verified provenance
  &rarr; entailment &rarr; contradiction surfacing). Extraction model: claude-sonnet-4-6. Provenance is
  verified by exact string-matching, not by trusting the model.</p>
</div></body></html>"""

    RENDER_OUT.write_text(page)
    print(f"Wrote {RENDER_OUT} ({len(page)} bytes)")
    return RENDER_OUT


if __name__ == "__main__":
    build()
