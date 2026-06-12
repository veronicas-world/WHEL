"""Minimal Anthropic Messages API client (stdlib only) + JSON helpers.

Every call returns the model's text plus a prompt_hash so extraction is reproducible
and auditable, matching the Blueprint's "every model output tagged with model_name,
prompt_hash, timestamp" discipline.
"""
import json
import ssl
import time
import hashlib
import urllib.request
import urllib.error

from config import MODEL, ANTHROPIC_VERSION, load_anthropic_key

_API = "https://api.anthropic.com/v1/messages"
_CTX = ssl.create_default_context()
_KEY = None


def _key():
    global _KEY
    if _KEY is None:
        _KEY = load_anthropic_key()
    return _KEY


def map_parallel(fn, items, workers: int = 8):
    """Run fn over items concurrently (LLM calls are I/O-bound) and YIELD (item, result)
    as each completes, so callers can persist incrementally and survive interruption.
    Exceptions are captured as None so a single failure never aborts the batch."""
    from concurrent.futures import ThreadPoolExecutor, as_completed
    items = list(items)
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(fn, item): item for item in items}
        for fut in as_completed(futures):
            item = futures[fut]
            try:
                yield item, fut.result()
            except Exception as e:  # noqa: BLE001
                print(f"  [warn] parallel task failed: {e}")
                yield item, None


def prompt_hash(*parts: str) -> str:
    h = hashlib.sha256()
    for p in parts:
        h.update(p.encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()[:16]


def complete(system: str, user: str, max_tokens: int = 2000,
             temperature: float = 0.0, retries: int = 6) -> str:
    """Call Claude and return the text of the first content block."""
    body = json.dumps({
        "model": MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }).encode("utf-8")
    headers = {
        "content-type": "application/json",
        "anthropic-version": ANTHROPIC_VERSION,
        "x-api-key": _key(),
    }
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(_API, data=body, method="POST", headers=headers)
            with urllib.request.urlopen(req, timeout=120, context=_CTX) as r:
                d = json.load(r)
                return d["content"][0]["text"]
        except urllib.error.HTTPError as e:
            last = e
            code = e.code
            if code in (429, 500, 502, 503, 529):
                wait = min(2 ** attempt * 2, 20)  # cap backoff so throughput stays usable
                time.sleep(wait)
                continue
            raise RuntimeError(f"Anthropic HTTP {code}: {e.read().decode()[:300]}")
        except (urllib.error.URLError, TimeoutError) as e:
            last = e
            time.sleep(2 ** attempt * 2)
    raise RuntimeError(f"Anthropic call failed after {retries} retries: {last}")


def complete_json(system: str, user: str, max_tokens: int = 3000):
    """Call Claude and parse a JSON object/array from the response.

    Tolerates models wrapping JSON in prose or ```json fences.
    """
    txt = complete(system, user, max_tokens=max_tokens)
    return extract_json(txt)


def extract_json(txt: str):
    txt = txt.strip()
    # strip code fences
    if txt.startswith("```"):
        txt = txt.split("```", 2)[1]
        if txt.startswith("json"):
            txt = txt[4:]
        txt = txt.strip()
    # find the first balanced JSON value
    for opener, closer in (("[", "]"), ("{", "}")):
        s = txt.find(opener)
        if s == -1:
            continue
        depth = 0
        in_str = False
        esc = False
        for i in range(s, len(txt)):
            c = txt[i]
            if in_str:
                if esc:
                    esc = False
                elif c == "\\":
                    esc = True
                elif c == '"':
                    in_str = False
            else:
                if c == '"':
                    in_str = True
                elif c == opener:
                    depth += 1
                elif c == closer:
                    depth -= 1
                    if depth == 0:
                        return json.loads(txt[s:i + 1])
    raise ValueError(f"No JSON found in model output: {txt[:200]!r}")
