"""Decoder for Next.js React Server Components (RSC) payloads.

Many manufacturer sites (Axopar among them) are built with Next.js and ship
the full page data - including tab contents that are hidden until clicked,
such as optional equipment - inside `self.__next_f.push([...])` script tags.
Reading that payload is more complete and more faithful than reading the
rendered markdown.
"""

from __future__ import annotations

import json
import re

_PUSH_RE = re.compile(r"self\.__next_f\.push\((\[.*?\])\)</script>", re.S)


def payload_from_html(raw_html: str) -> str:
    """Concatenate every RSC string chunk embedded in a raw HTML page."""
    out = []
    for chunk in _PUSH_RE.findall(raw_html):
        try:
            arr = json.loads(chunk)
        except json.JSONDecodeError:
            continue
        if len(arr) > 1 and isinstance(arr[1], str):
            out.append(arr[1])
    return "".join(out)


def text_rows(payload: str) -> dict[str, str]:
    """Return the long-text rows (`<id>:T<hexlen>,<text>`), keyed by `$<id>`.

    RSC moves long strings out of the JSON tree and references them as `"$33"`.
    Text rows carry no trailing newline, so the stream is read row by row using
    the declared length, which is in UTF-8 bytes.
    """
    data = payload.encode("utf-8")
    rows, pos = {}, 0
    row_re = re.compile(rb"([0-9a-f]+):(T([0-9a-f]+),)?")
    while pos < len(data):
        m = row_re.match(data, pos)
        if not m:
            nxt = data.find(b"\n", pos)
            pos = len(data) if nxt < 0 else nxt + 1
            continue
        if m.group(2):
            size = int(m.group(3), 16)
            rows["$" + m.group(1).decode()] = data[m.end():m.end() + size].decode("utf-8", "ignore")
            pos = m.end() + size
        else:
            nxt = data.find(b"\n", m.end())
            pos = len(data) if nxt < 0 else nxt + 1
    return rows


def resolve_refs(obj, rows: dict[str, str]):
    """Replace `"$<id>"` string references with the text rows they point to."""
    if isinstance(obj, dict):
        return {k: resolve_refs(v, rows) for k, v in obj.items()}
    if isinstance(obj, list):
        return [resolve_refs(v, rows) for v in obj]
    if isinstance(obj, str) and obj in rows:
        return rows[obj]
    return obj


def find_key(payload: str, key: str) -> list:
    """Decode every JSON value that follows `"key":` anywhere in the payload."""
    dec = json.JSONDecoder()
    values = []
    for m in re.finditer(r'"%s":' % re.escape(key), payload):
        try:
            value, _ = dec.raw_decode(payload, m.end())
        except json.JSONDecodeError:
            continue
        values.append(value)
    return values


def walk(obj, fn, path=()):
    """Depth-first walk calling fn(node, path) on every dict."""
    if isinstance(obj, dict):
        fn(obj, path)
        for k, v in obj.items():
            walk(v, fn, path + (k,))
    elif isinstance(obj, list):
        for v in obj:
            walk(v, fn, path)
