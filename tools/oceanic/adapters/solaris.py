"""Adapter for solarisyachts.com model pages (WordPress, custom theme; English version /en/yachts/<model>/).

Output: the same extract shape as adapters/beneteau.py. The page holds: a hero (Vimeo loop + fallback frame),
a key-data strip, carousels of photos alternating with text blocks, drawings (interior plan, deck plan, profile),
the "Technical specifications" grid (label / value), the credits grid and a brochure form. The "Our Yachts"
footer slider (heroes of every model) and the menus are ignored.
"""

from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

BRAND = "Solaris"
UPLOADS = "https://www.solarisyachts.com/cms/wp-content/uploads/"


def original_url(url: str) -> str:
    url = url.split("?")[0]
    return re.sub(r"-\d{2,4}x\d{2,4}(?=\.\w+$)", "", url)


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    soup = BeautifulSoup(raw_html, "html.parser")
    for t in soup(["script", "style", "noscript", "svg", "form"]):
        t.decompose()
    hero = soup.select_one("section.wrapper-video")
    h1 = hero.find("h1") if hero else soup.find("h1")
    name = h1.get_text(" ", strip=True) if h1 else "Solaris"
    rs = bool(re.search(r"\bRS\b", name))
    out = {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "solaris",
           "page_title": name, "tagline": None, "price_text": None, "price_note": None,
           "breadcrumb": [{"name": "Home", "url": "https://www.solarisyachts.com/en/"},
                          {"name": "Yachts", "url": "https://www.solarisyachts.com/en/yachts/"},
                          {"name": "Raised Saloon" if rs else "Flush Deck", "url": None}],
           "description": "", "credits": [], "awards": [], "sections": [], "specifications": [],
           "key_data": [], "profiles": [], "layouts": [], "downloads": [], "images": [], "videos": [],
           "range_models": [], "press_quotes": []}
    seen: set[str] = set()

    def add(src, section, title, role="image", alt=""):
        if not src or not src.startswith(UPLOADS):
            return
        orig = original_url(src)
        name_ = unquote(orig.rsplit("/", 1)[-1])
        if orig in seen or re.search(r"logo|favicon|menu_|home_yachts", name_, re.I):
            return
        seen.add(orig)
        out["images"].append({"src": src, "original": orig, "file_name": name_, "alt": alt or "", "width": None,
                              "height": None, "ext": name_.rsplit(".", 1)[-1].lower(), "section": section,
                              "section_title": title, "role": role})

    if hero:
        for img in hero.find_all("img", class_="desktop"):
            add(img.get("src"), "hero", "hero", "hero")
        for src in hero.find_all("source"):
            m = re.search(r"player\.vimeo\.com/progressive_redirect/playback/(\d+)", src.get("src") or "")
            if m and "desktop" in (src.find_parent("video").get("class") or []):
                vid = m.group(1)
                out["videos"].append({"youtube_id": f"vimeo:{vid}", "url": f"https://vimeo.com/{vid}",
                                      "embed_url": f"https://player.vimeo.com/video/{vid}", "thumbnail": None,
                                      "section": "hero", "section_title": "Video de cabecera (loop)",
                                      "third_party": False})

    for t in soup.select("section.wrap-data .tech, section.wrap-data div"):
        p, v = t.find("p"), t.find("h6")
        if p and v:
            out["key_data"].append({"label": p.get_text(strip=True), "value": v.get_text(" ", strip=True)})

    # Carousels and text blocks alternate: a carousel takes the title of the text block that follows it.
    blocks = soup.select("section.wrap-carousel, section.content, section.wrap-draw")
    n_text = 0
    for i, sec in enumerate(blocks):
        cls = sec.get("class") or []
        if "content" in cls:
            text = "\n".join(p.get_text(" ", strip=True) for p in sec.find_all(["p", "li"]) if p.get_text(strip=True))
            if text:
                n_text += 1
                title = {1: "Design & hull", 2: "Interiors"}.get(n_text, f"Texto {n_text}")
                h = sec.find(["h2", "h3"])
                out["sections"].append({"kind": "block", "id": None, "title": h.get_text(" ", strip=True) if h else title,
                                        "intro": text, "items": [], "images": []})
        elif "wrap-draw" in cls:
            for img in sec.find_all("img"):
                add(img.get("src"), "layouts", "Drawings", "plan")
        else:
            nxt = next((b for b in blocks[i + 1:] if "content" in (b.get("class") or [])), None)
            title = "Exterior" if n_text == 0 else "Interior" if n_text == 1 else "Gallery"
            for img in sec.find_all("img"):
                add(img.get("src"), "gallery", title, alt=img.get("alt") or "")
    if out["sections"]:
        out["description"] = out["sections"][0]["intro"].split("\n")[0]

    for sec in soup.select("section.wrap-info"):
        h = sec.find("h2")
        head = h.get_text(" ", strip=True) if h else ""
        for t in sec.select(".tech"):
            p, v = t.find("p"), t.find("h6")
            if not (p and v):
                continue
            label, value = p.get_text(" ", strip=True), v.get_text(" ", strip=True)
            if head.lower().startswith("credit"):
                out["credits"].append({"label": label, "value": value})
            else:
                out["specifications"].append({"label": label, "values": [value],
                                              "location": "Technical specifications"})
    if out["credits"] == [] and soup.find(string=re.compile("Credits")):
        sec = soup.find(string=re.compile("^Credits$")).find_parent("section")
        items = [x.get_text(" ", strip=True) for x in sec.find_all(["p", "h6"])] if sec else []
        for a, b in zip(items[::2], items[1::2]):
            out["credits"].append({"label": a, "value": b})
    out["downloads"].append({"label": "Request the brochure", "title_attr": None, "url": None, "kind": "brochure_form"})
    return out
