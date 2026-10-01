"""Adapter for switchonedesign.com (Wix site of the Switch One Design foiler: a single model, built by ElementSIX
Evolution, Italy).

The model's official content is spread over four pages: Home (overview, "THE BOAT" block: sail area, measurements,
speed, controls), Technology (the same block + hull / wings / spars / foil construction), Formula Switch (one platform,
three rigs, three categories) and Switch is Smart (ready to race, travel logistics). `extract()` reads one page;
`merge(pages)` builds the model extract: S1 = Home (technical block), Technology repeats the block (S3, compared
value by value) and every page's text becomes a section attributed to its page in the title.
Wix images: the original is the URL without the /v1/... rendition; small icons (≤ 200 px wide) are skipped.
"""

from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

BRAND = "Switch"
BASE = "https://www.switchonedesign.com/"
LABELS = ("Length", "Width", "Platform Weight", "Upwind Speed", "Downwind Speed", "TakeOFF Wind speed",
          "TakeOFF Wind Speed")


def original_url(url: str) -> str:
    return url.split("/v1/")[0]


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    soup = BeautifulSoup(raw_html, "html.parser")
    for t in soup(["script", "style", "noscript", "svg"]):
        t.decompose()
    main = soup.find("main") or soup.body
    page = url.rstrip("/").rsplit("/", 1)[-1] if url.rstrip("/") != BASE.rstrip("/") else "home"
    lines = [l.strip() for l in main.get_text("\n", strip=True).split("\n") if l.strip()]
    specs = []
    for i, l in enumerate(lines):
        m = re.match(r"^(%s)\s*:\s*(.+)$" % "|".join(map(re.escape, LABELS)), l)
        if m:
            specs.append({"label": m.group(1), "values": [m.group(2).strip()], "raw": m.group(2).strip()})
        elif l in ("SAIL AREA", "MATERIALS", "TRAMPS") and i + 1 < len(lines):
            specs.append({"label": l.title(), "values": [lines[i + 1]], "raw": lines[i + 1]})
    loc = {"home": "THE BOAT (Home)", "technology": "TECHNOLOGY (bloque técnico)"}.get(page, page)
    images, seen = [], set()
    for img in main.find_all("img"):
        src = img.get("src") or ""
        w = re.search(r"/fill/w_(\d+)", src)
        if "static.wixstatic.com/media/" not in src or (w and int(w.group(1)) <= 200):
            continue
        orig = original_url(src)
        alt = unquote(img.get("alt") or "")
        if orig in seen or re.search(r"logo", alt, re.I):
            continue
        seen.add(orig)
        images.append({"src": src, "original": orig, "file_name": orig.rsplit("/", 1)[-1], "alt": alt, "width": None,
                       "height": None, "ext": orig.rsplit(".", 1)[-1].lower(), "section": "gallery",
                       "section_title": f"Página {page}", "role": "image"})
    text = "\n".join(l for l in lines if l not in ("Discover more", "Dis"))
    return {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "switch", "slug": "switch-one-design",
            "page_title": "Switch One Design", "page": page, "tagline": None, "price_text": None, "price_note": None,
            "breadcrumb": [{"name": "Home", "url": BASE}, {"name": "Switch One Design", "url": BASE},
                           {"name": "One Design", "url": None}],
            "description": "", "credits": [], "awards": [], "sections": [],
            "specifications": [dict(s, location=loc) for s in specs], "profiles": [], "layouts": [],
            "downloads": [], "images": images, "videos": [], "range_models": [], "press_quotes": [], "text": text}


def merge(pages: dict) -> dict:
    """pages = {"home": ext, "technology": ext, "formula-switch": ext, "switch-is-smart": ext}."""
    home = pages["home"]
    ext = dict(home)
    ext["tagline"] = "Join the foiling revolution"
    t = home["text"]
    ext["description"] = re.search(r"Any sailor will have.*?class\.", t, re.S).group(0).replace("\n", " ")
    titles = {"home": "Home", "technology": "Technology", "formula-switch": "Formula Switch",
              "switch-is-smart": "Switch is Smart"}
    ext["sections"] = [{"kind": "block", "id": None, "title": f"Página {titles[k]}", "intro": p["text"], "items": [],
                        "images": []} for k, p in pages.items()]
    seen, imgs = set(), []
    for p in pages.values():
        for i in p["images"]:
            if i["original"] not in seen:
                seen.add(i["original"])
                imgs.append(i)
    ext["images"] = imgs
    tech = pages.get("technology")
    ext["alternates"] = ([{"source_url": tech["source_url"], "accessed_at": tech["accessed_at"],
                           "specifications": tech["specifications"], "page_title": "Switch One Design · Technology",
                           "short": "Web oficial · Technology",
                           "note": "Página Technology: repite el bloque técnico (sail area, measurements, speed)."}]
                         if tech else [])
    ext["extra_sources"] = [{"url": p["source_url"], "title": f"Switch One Design · {titles[k]}"}
                            for k, p in pages.items() if k not in ("home", "technology")]
    return ext
