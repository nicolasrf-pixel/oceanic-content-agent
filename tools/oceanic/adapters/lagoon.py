"""Adapter for catamarans-lagoon.com product pages (Nuxt front, Drupal back office at admin.catamarans-lagoon.com).

Input: the raw HTML of a model page (Firecrawl `rawHtml`). The server-rendered markup holds the texts,
the Specifications list, the gallery and the highlights; the layout ("Versions") tab names only exist in
the embedded Nuxt payload, so they are read from there.

Output: the same extract shape as adapters/beneteau.py (both brands belong to Groupe Beneteau and the
builder is shared). Nothing is interpreted here.
"""

from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

BRAND = "Lagoon"


def _unescape_js(text: str) -> str:
    return text.replace("\\u002F", "/").replace('\\"', '"')


def _norm_value(v: str) -> str:
    v = re.sub(r"(\d)(m|ft|L|l|t)\b", r"\1 \2", v.strip())
    return re.sub(r"(['\"])ft\b", r"\1", v)


def _split_values(v: str) -> list[str]:
    parts = [p.strip() for p in v.split(" / ")]
    if len(parts) == 2 and not re.search(r"\d", parts[1]):  # "2 x 57 CV / HP"
        return [v.strip()]
    return [_norm_value(p) for p in parts if p]


def _img(el, section: str, title: str, role: str = "image") -> dict | None:
    src = el.get("src") or el.get("data-src") or ""
    if not src.startswith("https://admin.catamarans-lagoon.com/") or src.endswith(".svg"):
        return None
    name = unquote(src.rsplit("/", 1)[-1])
    return {"src": src, "original": src.split("?")[0], "file_name": name, "alt": el.get("alt") or "",
            "width": int(el["width"]) if str(el.get("width") or "").isdigit() else None,
            "height": int(el["height"]) if str(el.get("height") or "").isdigit() else None,
            "ext": name.rsplit(".", 1)[-1].lower() if "." in name else None,
            "section": section, "section_title": title, "role": role}


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    cut = raw_html.find("window.__NUXT__")
    payload = _unescape_js(raw_html[cut:]) if cut > 0 else ""
    soup = BeautifulSoup(raw_html[:cut] if cut > 0 else raw_html, "html.parser")
    for t in soup(["script", "style", "svg", "noscript"]):
        t.decompose()
    main = soup.find("main") or soup.body
    out = {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "lagoon",
           "page_title": None, "tagline": None, "price_text": None, "price_note": None, "breadcrumb": [],
           "description": "", "credits": [], "awards": [], "sections": [], "specifications": [],
           "profiles": [], "layouts": [], "downloads": [], "images": [], "videos": [], "range_models": [],
           "headline_stats": [], "press_quotes": []}
    seen: set[str] = set()

    def add(rec):
        if rec and rec["original"] not in seen:
            seen.add(rec["original"])
            out["images"].append(rec)

    h1 = main.find("h1")
    out["page_title"] = h1.get_text(" ", strip=True) if h1 else None
    tag = h1.find_next("h2") if h1 else None
    out["tagline"] = tag.get_text(" ", strip=True) if tag else None
    out["breadcrumb"] = [{"name": "Home", "url": "https://www.catamarans-lagoon.com/"},
                         {"name": "Sailing catamarans", "url": "https://www.catamarans-lagoon.com/ranges/sailing-catamarans"},
                         {"name": "Lagoon", "url": "https://www.catamarans-lagoon.com/ranges/sailing-catamarans"}]

    # Walk the page in order: headings decide the section of what follows.
    section, title = "hero", "hero"
    press = False
    for el in main.find_all(["h2", "h3", "p", "img", "li", "a"]):
        if el.name == "h2":
            t = el.get_text(" ", strip=True)
            low = t.lower()
            press = "press" in low
            if low == "versions":
                section, title = "layouts", "Versions"
            elif low == "specifications":
                section, title = "specifications", "Specifications"
            elif "virtual tour" in low:
                section, title = "virtual-tour", t
            elif el is not tag:
                section, title = "block", t
            continue
        if el.name == "h3":
            t = el.get_text(" ", strip=True)
            if press:
                if out["press_quotes"]:
                    out["press_quotes"][-1]["source"] = t
                continue
            section, title = "highlight", t
            out["sections"].append({"kind": "highlight", "id": None, "title": t, "intro": "", "items": [], "images": []})
            continue
        if el.name == "img":
            if section == "specifications":
                add(_img(el, "profiles", "Profile", "plan"))
            elif section == "layouts":
                pass  # attached to layouts below (names from the payload)
            elif re.search(r"award|warranty|logo", (el.get("alt") or "") + (el.get("src") or ""), re.I):
                continue
            else:
                src = el.get("src") or ""
                if section == "highlight" or (el.get("alt") and el.get("width") == "1440"):
                    # the highlight image precedes its <h3>; its alt text carries the highlight title
                    add(_img(el, "highlight", el.get("alt") or title))
                elif "cover" in src.rsplit("/", 1)[-1].lower() and not any(i["role"] == "hero" for i in out["images"]) \
                        and "video" not in src.lower():
                    add(_img(el, "hero", "hero", "hero"))
                elif re.search(r"intro-|parallax|video-cover|/\d+\.jpg$", src):
                    add(_img(el, "block", "Introduction" if "intro-" in src else "Portada de video / parallax"))
                else:  # the "Pictures & videos" slider
                    add(_img(el, "gallery", "Pictures & videos"))
            continue
        if el.name == "a":
            h = el.get("href") or ""
            m = re.search(r"youtube\.com/watch\?v=([\w-]+)", h)
            if m and m.group(1) not in {v["youtube_id"] for v in out["videos"]}:
                out["videos"].append({"youtube_id": m.group(1), "url": f"https://www.youtube.com/watch?v={m.group(1)}",
                                      "embed_url": f"https://www.youtube.com/embed/{m.group(1)}",
                                      "thumbnail": f"https://i.ytimg.com/vi/{m.group(1)}/hqdefault.jpg",
                                      "section": "videos", "section_title": el.get_text(" ", strip=True) or None})
            continue
        if el.name == "li" and section == "specifications":
            spans = el.find_all("span")
            if len(spans) >= 2:
                label = spans[0].get_text(" ", strip=True)
                out["specifications"].append({"label": label, "values": _split_values(spans[1].get_text(" ", strip=True))})
            continue
        if el.name == "p":
            t = el.get_text(" ", strip=True)
            if not t or re.fullmatch(r"(Receive your brochure|Awards|\* with all the options|Discover Seanapps)", t):
                continue
            if press:
                out["press_quotes"].append({"quote": t.strip('"“” '), "source": None})
            elif section == "highlight":
                sec = out["sections"][-1]
                sec["intro"] = (sec["intro"] + "\n" + t).strip()
            elif section == "hero":
                if re.fullmatch(r"(Length Overall|Upwind sail area|Number of berths)", t):
                    out["headline_stats"].append({"label": t})
                elif re.search(r"Yacht of the Year|Boat of the Year|Award", t):
                    out["awards"].append(t)
                elif len(t) > 60 and not out["description"]:
                    out["description"] = t

    hl = [x for x in out["sections"] if x["kind"] == "highlight"]
    if hl:  # one block of titled highlights, like the key-feature sliders on beneteau.com
        out["sections"] = [x for x in out["sections"] if x["kind"] != "highlight"] + [
            {"kind": "highlights", "id": None, "title": "Highlights", "intro": "",
             "items": [{"title": x["title"], "text": x["intro"]} for x in hl], "images": []}]

    lead = main.select_one(".lead-1")
    if lead:
        out["description"] = lead.get_text(" ", strip=True)

    # Layout tab names live in the Nuxt payload: {name:"3 cabins",parent:x,image:{...url:"..."}}
    for m in re.finditer(r'name:"([^"]+)",parent:[\w$]+,image:\{type:\w+,id:"[^"]+",meta:\{[^}]*?url:"([^"]+)"', payload):
        name, img_url = m.group(1).strip(), m.group(2)
        out["layouts"].append({"title": name, "bullets": [], "text": "", "image": img_url})
        fname = unquote(img_url.rsplit("/", 1)[-1])
        add({"src": img_url, "original": img_url, "file_name": fname, "alt": name, "width": None, "height": None,
             "ext": fname.rsplit(".", 1)[-1].lower(), "section": "layouts", "section_title": name, "role": "plan"})

    for s in out["specifications"]:
        if re.fullmatch(r"(naval )?architect|exterior design|interior design", s["label"].strip(), re.I):
            out["credits"].append({"label": s["label"].strip(), "value": " ".join(s["values"])})
    brochure = main.find(string=re.compile(r"Receive your brochure"))
    if brochure:
        out["downloads"].append({"label": "Receive your brochure", "title_attr": None, "url": None, "kind": "brochure_form"})
    return out
