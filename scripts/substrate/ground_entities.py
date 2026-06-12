"""Ontology-grounded entity resolution (substrate edition).

Implements the roadmap's "ontology-grounded entity resolution" item: resolve every
extracted intervention and condition against a canonical biomedical registry and
record the identifier. Grounding is the correctness guard that stops a model-invented
or mis-spelled name from masquerading as a real biomedical entity, and it canonicalizes
variants ("Vitex agnus castus" / "Vitex agnus-castus") to one identity.

Registries (all free, no key, no LLM):
    interventions -> RxNorm (RxNav REST)         ontology_id = "RxNorm:<rxcui>"
    conditions    -> MONDO via EBI OLS4 search   ontology_id = "MONDO:<id>"

Entities that do not resolve are reported as ungrounded (status "unresolved") rather
than force-matched. An unresolved entity is a useful data-quality flag (e.g. a junk
"unknown intervention" row, or a drug class like "SSRIs" that has no single RxCUI).
"""
import time
import json
import ssl
import urllib.request
import urllib.parse

from config import USER_AGENT

_CTX = ssl.create_default_context()
SLEEP_S = 0.25

# Common supplement/vitamin display names -> RxNorm-friendly ingredient names.
_SYNONYM = {
    "vitamin b6": "pyridoxine",
    "vitamin b12": "cyanocobalamin",
    "folate": "folic acid",
    "vitamin c": "ascorbic acid",
    "vitamin d": "cholecalciferol",
    "vitamin e": "alpha-tocopherol",
}


def _get(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=25, context=_CTX) as r:
                return json.load(r)
        except Exception:  # noqa: BLE001
            time.sleep(0.5 * (attempt + 1))
    return None


def ground_intervention(label: str):
    """Return (ontology_id, canonical_label) or (None, None) via RxNorm exact match."""
    candidates = [label, label.lower(), _SYNONYM.get(label.lower(), "")]
    for name in [c for c in candidates if c]:
        data = _get(f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={urllib.parse.quote(name)}&search=2")
        time.sleep(SLEEP_S)
        rxcui = ((data or {}).get("idGroup", {}) or {}).get("rxnormId")
        if rxcui:
            cui = rxcui[0]
            props = _get(f"https://rxnav.nlm.nih.gov/REST/rxcui/{cui}/property.json?propName=RxNorm%20Name")
            time.sleep(SLEEP_S)
            canon = (((props or {}).get("propConceptGroup", {}) or {}).get("propConcept", [{}])[0] or {}).get("propValue")
            return f"RxNorm:{cui}", canon or name
    return None, None


def ground_condition(label: str):
    """Return (ontology_id, canonical_label) or (None, None) via MONDO (EBI OLS4).

    Searches the shorthand and its expansion, then scans results for a MONDO term
    whose label OR exact synonyms contain the query (MONDO labels PMS as
    'premenstrual tension' with 'PMS'/'premenstrual syndrome' as synonyms, so a naive
    top-1 phrase match misses it)."""
    expansion = {"PMDD": "premenstrual dysphoric disorder",
                 "PMS": "premenstrual syndrome"}.get(label, label)
    wanted = {label.lower(), expansion.lower()}
    # Candidate queries: the expansion, the shorthand, and a broad first-word query
    # (OLS phrase search sometimes returns nothing for the full phrase even when the
    # term exists under a different primary label, e.g. PMS -> "premenstrual tension").
    queries = [expansion, label, expansion.split()[0]]
    seen = set()
    for q in [x for x in queries if not (x.lower() in seen or seen.add(x.lower()))]:
        data = _get(f"https://www.ebi.ac.uk/ols4/api/search?q={urllib.parse.quote(q)}&ontology=mondo&rows=10")
        time.sleep(SLEEP_S)
        docs = ((data or {}).get("response", {}) or {}).get("docs", [])
        for doc in docs:
            if not doc.get("obo_id"):
                continue
            hay = {(doc.get("label") or "").lower()}
            hay |= {s.lower() for s in (doc.get("exact_synonyms") or [])}
            if wanted & hay:
                return doc["obo_id"], doc.get("label")
    return None, None


def ground(entities):
    """entities: list with id, type, label. Returns list of result dicts."""
    results = []
    counts = {"resolved": 0, "unresolved": 0}
    for e in entities:
        if e["type"] == "condition":
            oid, canon = ground_condition(e["label"])
            source = "MONDO"
        elif e["type"] == "intervention":
            oid, canon = ground_intervention(e["label"])
            source = "RxNorm"
        else:
            oid, canon, source = None, None, None
        status = "resolved" if oid else "unresolved"
        counts[status] += 1
        results.append({
            "id": e["id"], "type": e["type"], "label": e["label"],
            "ontology_id": oid, "ontology_source": source if oid else None,
            "canonical_label": canon, "status": status,
        })
        print(f"  {status:11} {e['type']:<12} {e['label']:<32} -> {oid or '(none)'}  {canon or ''}")
    print(f"  entity grounding: {counts}")
    return results


if __name__ == "__main__":
    import sb
    ents = sb.get("entities?select=id,type,label&order=type")
    print(json.dumps(ground(ents), indent=2))
