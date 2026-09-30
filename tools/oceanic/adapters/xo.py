"""Adapter for xoboats.com model pages (WordPress + WooCommerce, Uncode theme).

Output: the same extract shape as adapters/beneteau.py, so builders/xo.py can reuse the shared package writer.
The page holds: a header video (YouTube embed), the model h1 and overview, a WooCommerce attributes table
(the technical sheet), text blocks, galleries (originals in `data-guid` or the <a href> of the lightbox),
layout drawings, walkthrough videos and a "REVIEWS" block that links to third-party press (excluded).
Everything before the h1 (menus, the embedded YouTube end screen) and from the footer on is ignored.
"""

from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

BRAND = "XO"
SERIES = {"dfndr": "DFNDR", "dscvr": "DSCVR", "explr": "EXPLR"}
CATALOGUE = "https://online.flippingbook.com/view/167184400/"  # linked from xoboats.com/brochures/
SKIP_IMG = re.compile(r"logo|CROSSOVER|thumbnail|cropped-|winner|\.svg$", re.I)


def original_url(url: str) -> str:
    """Strip WordPress/Uncode size suffixes (-300x200, -uai-720x480, -scaled) to get the uploaded original."""
    url = url.split("?")[0]
    return re.sub(r"(?:-uai)?-\d{2,4}x\d{2,4}(?=\.\w+$)|-scaled(?=\.\w+$)", "", url)


def _yt(id_: str, section: str | None, title: str | None) -> dict:
    return {"youtube_id": id_, "url": f"https://www.youtube.com/watch?v={id_}",
            "embed_url": f"https://www.youtube.com/embed/{id_}",
            "thumbnail": f"https://i.ytimg.com/vi/{id_}/hqdefault.jpg", "section": section,
            "section_title": title, "third_party": False}


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    soup = BeautifulSoup(raw_html, "html.parser")
    for t in soup(["script", "style", "noscript", "svg", "form"]):
        t.decompose()
    h1 = soup.find("h1")
    model = h1.get_text(" ", strip=True) if h1 else url.rstrip("/").rsplit("/", 1)[-1].upper()
    series = next((v for k, v in SERIES.items() if k in model.lower()), None)
    out = {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "xo",
           "page_title": f"XO {model}", "h1": model,
           "slug": re.sub(r"[^a-z0-9]+", "-", f"xo {model}".lower().replace("+", " plus ")).strip("-"), "tagline": None, "price_text": None, "price_note": None,
           "breadcrumb": [{"name": "Home", "url": "https://xoboats.com/"},
                          {"name": "Model Range", "url": "https://xoboats.com/model-range/"},
                          {"name": f"{series} SERIES" if series else "XO Fleet",
                           "url": f"https://xoboats.com/fleet/{series.lower()}/" if series else None}],
           "description": "", "credits": [], "awards": [], "sections": [], "specifications": [],
           "profiles": [], "layouts": [], "downloads": [], "images": [], "videos": [], "range_models": [],
           "press_quotes": []}
    seen: set[str] = set()

    def add(src, alt, section, title, role="image"):
        orig = original_url(src)
        name = unquote(orig.rsplit("/", 1)[-1])
        if orig in seen or SKIP_IMG.search(name) or "/wp-content/uploads/" not in orig:
            return
        seen.add(orig)
        if re.search(r"layout|Leikkaus", name, re.I):
            role, section = "plan", "layouts"
        elif re.search(r"web-transparent|^SIDE_", name, re.I):
            role, section = "plan", "profiles"
        out["images"].append({"src": src, "original": orig, "file_name": name, "alt": alt or "",
                              "width": None, "height": None,
                              "ext": name.rsplit(".", 1)[-1].lower() if "." in name else None,
                              "section": section, "section_title": title, "role": role})

    # Header video: the first YouTube embed of the page (before the h1).
    m = re.search(r"youtube(?:-nocookie)?\.com/embed/([\w-]{11})", raw_html)
    if m:
        out["videos"].append(_yt(m.group(1), "hero", "Video de cabecera"))

    table = soup.select_one("table.shop_attributes")
    if table:
        for tr in table.find_all("tr"):
            if tr.th and tr.td:
                out["specifications"].append({"label": tr.th.get_text(" ", strip=True),
                                              "values": [tr.td.get_text(" ", strip=True)],
                                              "location": "Tabla técnica (atributos del producto)"})

    if not h1:
        return out
    footer = soup.find(string=re.compile(r"XO Boats Oy"))
    stop = footer.find_parent() if footer else None
    section = {"kind": "block", "id": None, "title": "Overview", "intro": "", "items": [], "images": []}
    sections = [section]
    reviews = False
    first_block = True
    for el in h1.find_all_next(["h1", "h2", "h3", "h4", "p", "img", "a", "table"]):
        if stop is not None and (el is stop or stop in el.parents or el in stop.parents):
            break
        if el.find_parent("table") is not None:
            continue
        if el.name in ("h1", "h2", "h3", "h4"):
            t = el.get_text(" ", strip=True)
            if not t or t == model:
                continue
            if sections[-1]["title"] == t:
                continue
            if re.fullmatch(r"REVIEWS?", t, re.I):
                reviews = True  # third-party press: the block closes the page and is excluded
            if reviews:
                section = {"kind": "review", "id": None, "title": t, "intro": "", "items": [], "images": []}
                continue
            if first_block and not sections[0]["intro"] and el.name == "h2":
                out["tagline"] = t
                first_block = False
                continue
            section = {"kind": "block", "id": None, "title": t, "intro": "", "items": [], "images": []}
            sections.append(section)
            continue
        if el.name == "img":
            src = el.get("data-guid") or el.get("src") or ""
            if src:
                add(src, el.get("alt"), "gallery", section["title"])
            continue
        if el.name == "a":
            h = el.get("href") or ""
            y = re.search(r"(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/))([\w-]{11})", h)
            if reviews and h.startswith("http") and "xoboats" not in h:
                if not any(p["source"] == h for p in out["press_quotes"]):
                    out["press_quotes"].append({"quote": el.get_text(" ", strip=True) or section["title"], "source": h})
            if y and y.group(1) not in {v["youtube_id"] for v in out["videos"]}:
                out["videos"].append(_yt(y.group(1), section["title"], section["title"]))
                out["videos"][-1]["third_party"] = reviews
            elif "flippingbook.com" in h:
                out["downloads"].append({"label": "Online brochure", "title_attr": None, "url": h.rstrip(")"),
                                         "kind": "brochure"})
            continue
        if el.name == "p":
            t = el.get_text(" ", strip=True)
            if not t or re.fullmatch(r"Click (here )?to accept marketing cookies.*", t):
                continue
            if reviews:
                continue
            first_block = False
            section["intro"] = (section["intro"] + "\n" + t).strip()
    # The brochure iframe is removed with the scripts; its link survives in the raw HTML.
    if not out["downloads"]:
        fb = re.search(r"https://online\.flippingbook\.com/view/\d+", raw_html)
        if fb:
            out["downloads"].append({"label": "Online brochure", "title_attr": None, "url": fb.group(0) + "/",
                                     "kind": "brochure"})
    # Other YouTube embeds (walkthrough behind the cookie wall) are official page videos.
    for y in re.findall(r"youtube(?:-nocookie)?\.com/embed/([\w-]{11})", raw_html):
        if y not in {v["youtube_id"] for v in out["videos"]}:
            out["videos"].append(_yt(y, "walkthrough", "Walkthrough / video"))
    junk = re.compile(r"360°|This content is private|Tap here to start VR|^Coming soon\.?$", re.I)
    sections = [s for s in sections if not junk.search(s["title"]) and not junk.search(s["intro"])]
    if sections and sections[0]["title"] == "Overview" and not sections[0]["intro"]:
        sections.pop(0)
    if sections and sections[0]["title"] == "Overview":
        out["description"] = sections.pop(0)["intro"]
    elif sections:  # the overview opens with its own heading
        out["tagline"] = out["tagline"] or sections[0]["title"]
        out["description"] = sections.pop(0)["intro"]
    out["sections"] = [s for s in sections if s["intro"]]
    # Range catalogue (Catalogues & Brochures page, also linked from Model Range): a document, not a data source.
    out["downloads"].append({"label": "XO Catalogue 2026 (catálogo de la gama, FlippingBook)", "title_attr": None,
                             "url": CATALOGUE, "kind": "brochure"})
    award = re.search(r"[A-Z][A-Z ]*BOAT OF THE YEAR \d{4}",
                      " ".join([out["description"], out["tagline"] or ""] + [x["title"] for x in out["sections"]]))
    if award:
        out["awards"].append(award.group(0))
    return out
