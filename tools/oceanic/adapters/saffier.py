"""Adapter for saffieryachts.com model pages (WordPress, theme "saffier-2025").

Output: the same extract shape as adapters/beneteau.py. Sections of a model page, by id:
- #intro: model label, title and overview text;
- #gallery: two carousels (Exterior / Interior tabs);
- #specifications: groups of label / value items (Dimensions, Sails, Engine, Tanks, Accomodations, Galley);
- the numbered feature blocks ("01/ A perfect sailing experience") and the feature list (h4 + text + image);
- #videos: YouTube items with their creator (third-party channels are flagged);
- #reviews: magazine tests (PDF on the site, third-party content: excluded);
- the brochure is a form (/brochure/?boatmodel=...); the configurator is a tool.
The model menu, the range teaser ("Our range") and the dealer block are ignored.
"""

from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

BRAND = "Saffier"
UPLOADS = "https://saffieryachts.com/wp-content/uploads/"


def original_url(url: str) -> str:
    url = url.split("?")[0]
    return re.sub(r"-\d{2,4}x\d{2,4}(?=\.\w+$)", "", url)


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    soup = BeautifulSoup(raw_html, "html.parser")
    for t in soup(["script", "style", "noscript", "svg"]):
        t.decompose()
    intro = soup.select_one("#intro")
    name = re.sub(r"\s*\|\s*Saffier Yachts\s*$", "", soup.title.get_text(" ", strip=True))
    rng = "Luxury" if re.search(r"\bSL\b", name) else "Classic" if re.search(r"\bSC\b", name) else "Elegance"
    out = {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "saffier",
           "page_title": name, "tagline": None, "price_text": None, "price_note": None,
           "breadcrumb": [{"name": "Home", "url": "https://saffieryachts.com/"},
                          {"name": "Models", "url": "https://saffieryachts.com/"},
                          {"name": rng, "url": f"https://saffieryachts.com/{rng.lower()}-range/"}],
           "description": "", "credits": [], "awards": [], "sections": [], "specifications": [],
           "profiles": [], "layouts": [], "downloads": [], "images": [], "videos": [], "range_models": [],
           "press_quotes": []}
    seen: set[str] = set()

    def add(src, section, title, role="image", alt=""):
        if not src or not src.startswith(UPLOADS):
            return
        orig = original_url(src)
        fname = unquote(orig.rsplit("/", 1)[-1])
        if orig in seen or re.search(r"\.svg$|logo|Een-titel|360-view|testata", fname, re.I):
            return
        seen.add(orig)
        out["images"].append({"src": src, "original": orig, "file_name": fname, "alt": alt or "", "width": None,
                              "height": None, "ext": fname.rsplit(".", 1)[-1].lower(), "section": section,
                              "section_title": title, "role": role})

    if intro:
        h2 = intro.find("h2")
        out["tagline"] = h2.get_text(" ", strip=True) if h2 else None
        out["description"] = "\n".join(p.get_text(" ", strip=True) for p in intro.select(".content-holder p"))
    # Hero: the first full-width image of the page ("Fallback Image").
    hero = soup.find("img", alt="Fallback Image")
    if hero:
        add(hero.get("src"), "hero", "hero", "hero")

    for tab, title in (("#tabExterior", "Exterior"), ("#tabInterior", "Interior")):
        for img in soup.select(f"{tab} img"):
            add(img.get("src") or img.get("data-src"), "gallery", title, alt=img.get("alt") or "")

    spec = soup.select_one("#specifications")
    for g in (spec.select(".specs-group") if spec else []):
        group = g.select_one(".group-title").get_text(" ", strip=True)
        for it in g.select(".spec-item"):
            lab, val = it.select_one(".item-label"), it.select_one(".item-value")
            if lab and val:
                v = re.sub(r"(\d)\s*m\s*2\b", r"\1 m²", val.get_text(" ", strip=True))
                out["specifications"].append({"label": lab.get_text(" ", strip=True), "values": [v],
                                              "location": f"Specifications · {group}"})
                if lab.get_text(strip=True).lower() == "design":
                    out["credits"].append({"label": "Design", "value": v})

    # Feature blocks and feature list: every h4 with its text (and image) in the main content.
    for sec in soup.select("section"):
        sid = sec.get("id") or ""
        if sid in ("intro", "specifications", "videos", "reviews") or sec.find_parent("section", id="gallery") \
                or sec.select_one("#specifications") or "dealer" in " ".join(sec.get("class") or []):
            continue
        for h4 in sec.find_all("h4", recursive=True):
            title = h4.get_text(" ", strip=True)
            if re.search(r"dealer network|Let.s connect", title, re.I):
                continue
            texts, node = [], h4
            for node in h4.find_all_next(["p", "h4", "h2", "img"]):
                if node.name in ("h4", "h2"):
                    break
                if node.name == "p":
                    t = node.get_text(" ", strip=True)
                    if t and not re.fullmatch(r"\d{2}/", t):
                        texts.append(t)
                elif node.name == "img":
                    add(node.get("src"), "features", title, alt=node.get("alt") or "")
            if texts and title not in [s["title"] for s in out["sections"]]:
                out["sections"].append({"kind": "block", "id": None, "title": title, "intro": "\n".join(texts),
                                        "items": [], "images": []})
        more = sec.find("h2", string=re.compile("More information"))
        if more:
            t = "\n".join(p.get_text(" ", strip=True) for p in more.find_all_next("p", limit=6)
                          if p.find_parent("section") is sec)
            if t:
                out["sections"].append({"kind": "block", "id": None, "title": "More information", "intro": t,
                                        "items": [], "images": []})
    award = re.search(r"(European Yacht of the Year|Yacht of the Year[^.]*)", " ".join(s["intro"] for s in out["sections"]))
    if award:
        out["awards"].append(award.group(1).strip())

    for it in soup.select("#videos .item-video"):
        m = re.search(r"(?:watch\?v=|youtu\.be/|embed/)([\w-]{11})", it.get("data-attr") or "")
        if not m:
            continue
        creator = it.select_one(".video-creator")
        who = creator.get_text(" ", strip=True) if creator else ""
        title = it.select_one(".video-body")
        out["videos"].append({"youtube_id": m.group(1), "url": f"https://www.youtube.com/watch?v={m.group(1)}",
                              "embed_url": f"https://www.youtube.com/embed/{m.group(1)}",
                              "thumbnail": f"https://i.ytimg.com/vi/{m.group(1)}/hqdefault.jpg", "section": "videos",
                              "section_title": title.get_text(" ", strip=True)[:120] if title else "Video",
                              "third_party": bool(who) and "saffier" not in who.lower()})
    for a in soup.select("#reviews a[href$='.pdf']"):
        quote = a.find_previous("p")
        out["press_quotes"].append({"quote": quote.get_text(" ", strip=True) if quote else "", "source": a["href"]})

    brochure = soup.find("a", href=re.compile(r"/brochure/\?boatmodel="))
    out["downloads"].append({"label": "Request brochure", "title_attr": None,
                             "url": brochure["href"] if brochure else None, "kind": "brochure_form"})
    return out
