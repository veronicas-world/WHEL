"""Anthropic Messages API client (stdlib only) for the substrate pipeline.

Adds two things beyond the MVP client:
  1. Live usage/cost tracking (so we can watch a small credit budget).
  2. A CreditsExhausted exception that propagates and STOPS the run. When credits
     run out we commit what exists and surface the gap. We never fabricate
     verification output — that is the architectural failure mode the substrate
     exists to prevent.
"""
import json
import ssl
import time
import hashlib
import threading
import urllib.request
import urllib.error

from config import MODEL, ANTHROPIC_VERSION, USER_AGENT, PRICE_IN, PRICE_OUT, anthropic_key

_API = "https://api.anthropic.com/v1/messages"
_CTX = ssl.create_default_context()
_KEY = None

# --- usage tracking -------------------------------------------------------
_lock = threading.Lock()
_usage = {"calls": 0, "input_tokens": 0, "output_tokens": 0}


class CreditsExhausted(RuntimeError):
    """Raised when the Anthropic account is out of credits. Must stop the run."""


def usage_snapshot():
    with _lock:
        u = dict(_usage)
    u["est_cost_usd"] = round(u["input_tokens"] * PRICE_IN + u["output_tokens"] * PRICE_OUT, 4)
    return u


def _record(d):
    u = d.get("usage") or {}
    with _lock:
        _usage["calls"] += 1
        _usage["input_tokens"] += int(u.get("input_tokens", 0))
        _usage["output_tokens"] += int(u.get("output_tokens", 0))


def _key():
    global _KEY
    if _KEY is None:
        _KEY = anthropic_key()
    return _KEY


def prompt_hash(*parts: str) -> str:
    h = hashlib.sha256()
    for p in parts:
        h.update(p.encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()[:16]


def complete(system: str, user: str, max_tokens: int = 2000,
             temperature: float = 0.0, retries: int = 9, model: str = None) -> str:
    payload = {
        "model": model or MODEL, "max_tokens": max_tokens,
        "system": system, "messages": [{"role": "user", "content": user}],
    }
    # Some newer models (e.g. Opus 4.8) deprecate `temperature` and 400 if it's sent.
    # Pass temperature=None to omit it entirely.
    if temperature is not None:
        payload["temperature"] = temperature
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "content-type": "application/json", "anthropic-version": ANTHROPIC_VERSION,
        "x-api-key": _key(), "user-agent": USER_AGENT,
    }
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(_API, data=body, method="POST", headers=headers)
            with urllib.request.urlopen(req, timeout=120, context=_CTX) as r:
                d = json.load(r)
                _record(d)
                return d["content"][0]["text"]
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode()
            except Exception:
                pass
            # Hard stop: out of credits. Do not retry, do not swallow.
            if e.code == 400 and "credit balance is too low" in detail.lower():
                raise CreditsExhausted(detail[:200])
            last = e
            # 529 = Anthropic overloaded (transient); back off longer and keep trying.
            if e.code in (429, 500, 502, 503, 529):
                time.sleep(min(2 ** attempt * 2, 45))
                continue
            raise RuntimeError(f"Anthropic HTTP {e.code}: {detail[:300]}")
        except (urllib.error.URLError, TimeoutError) as e:
            last = e
            time.sleep(min(2 ** attempt * 2, 20))
    raise RuntimeError(f"Anthropic call failed after {retries} retries: {last}")


def complete_json(system: str, user: str, max_tokens: int = 3000, model: str = None,
                  temperature: float = 0.0):
    return extract_json(complete(system, user, max_tokens=max_tokens, model=model,
                                 temperature=temperature))


def map_parallel(fn, items, workers: int = 4):
    """Run fn over items concurrently, yielding (item, result) as each completes so
    callers persist incrementally. CreditsExhausted propagates (stops the run);
    any other per-task error yields None."""
    from concurrent.futures import ThreadPoolExecutor, as_completed
    items = list(items)
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(fn, item): item for item in items}
        try:
            for fut in as_completed(futures):
                item = futures[fut]
                try:
                    yield item, fut.result()
                except CreditsExhausted:
                    raise
                except Exception as e:  # noqa: BLE001
                    print(f"  [warn] task failed: {e}")
                    yield item, None
        finally:
            for f in futures:
                f.cancel()


def extract_json(txt: str):
    txt = txt.strip()
    if txt.startswith("```"):
        txt = txt.split("```", 2)[1]
        if txt.startswith("json"):
            txt = txt[4:]
        txt = txt.strip()
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
