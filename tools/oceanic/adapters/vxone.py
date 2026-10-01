"""Adapter for vxone.com (Wix site of the VX One one-design sportboat: a single model).

The model has no product page of its own: the official data is spread over the home page ("THE BOAT" block,
overview) and the Specifications page (the same figures + the feature list). `extract()` reads one page;
`merge(home, specs)` builds the model extract: S1 = Specifications page (technical sheet), the home page is
registered as a second official source and its overview text is attributed to it in the section title.
Wix image URLs are resized renditions (/v1/fill/...); the original is the URL without the /v1/ part.
Testimonials ("What People Are Saying") and the class calendar (vxone.org) are not product content.
"""

from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

BRAND = "VX One"


def original_url(url: str) -> str:
    return url.split("/v1/")[0]


def _spec_lines(text: str) -> list[dict]:
    out = []
    for line in text.split("\n"):
        m = re.match(r"\s*[-•]?\s*([A-Za-z][\w ,+.()]*?)\s*=\s*(.+)$", line.strip())
        if m:
            vals = [v.strip() for v in re.split(r"\s*/\s*", m.group(2)) if v.strip()]
            vals = [re.sub(r"(\d)\s*(m)$", r"\1 \2", re.sub(r"sq ?m$", "m²", v)) for v in vals]
            out.append({"label": m.group(1).strip(), "values": vals, "raw": m.group(2).strip()})
    return out


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    soup = BeautifulSoup(raw_html, "html.parser")
    for t in soup(["script", "style", "noscript", "svg"]):
        t.decompose()
    main = soup.find("main") or soup.body
    out = {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "vxone", "slug": "vx-one",
           "page_title": "VX One", "tagline": None, "price_text": None, "price_note": None,
           "breadcrumb": [{"name": "Home", "url": "https://www.vxone.com/home"},
                          {"name": "VX One", "url": "https://www.vxone.com/specs"},
                          {"name": "One Design", "url": None}],
           "description": "", "credits": [], "awards": [], "sections": [], "specifications": [],
           "profiles": [], "layouts": [], "downloads": [], "images": [], "videos": [], "range_models": [],
           "press_quotes": []}
    seen: set[str] = set()
    for img in main.find_all("img"):
        src = img.get("src") or ""
        if "static.wixstatic.com/media/" not in src:
            continue
        orig = original_url(src)
        if orig in seen:
            continue
        seen.add(orig)
        name = unquote(img.get("alt") or orig.rsplit("/", 1)[-1])
        out["images"].append({"src": src, "original": orig, "file_name": orig.rsplit("/", 1)[-1], "alt": name,
                              "width": None, "height": None, "ext": orig.rsplit(".", 1)[-1].lower(),
                              "section": "gallery", "section_title": "Página " + url.rsplit("/", 1)[-1],
                              "role": "image"})
    text = main.get_text("\n", strip=True)
    text = text.split("What People Are Saying")[0]
    specs = _spec_lines(text)
    loc = "THE BOAT (home)" if url.endswith("/home") else "VX ONE SPECIFICATIONS"
    out["specifications"] = [dict(s, location=loc) for s in specs]
    h1 = main.find(["h1"])
    if h1:
        out["tagline"] = h1.get_text(" ", strip=True).title()
        p = h1.find_next("p")
        out["description"] = p.get_text(" ", strip=True) if p else ""
    for h2 in main.find_all("h2"):
        t = h2.get_text(" ", strip=True)
        p = h2.find_next("p")
        body = p.get_text(" ", strip=True) if p else ""
        if t in ("EVENTS", "SUPPORT") and body:
            out["sections"].append({"kind": "block", "id": None, "title": f"{t.title()} (home)", "intro": body,
                                    "items": [], "images": []})
    feats = [li.get_text(" ", strip=True) for li in main.find_all("li") if "=" not in li.get_text()]
    if feats:
        out["sections"].append({"kind": "features", "id": None, "title": "Features (página Specifications)",
                                "intro": "", "items": [{"title": f, "text": ""} for f in feats], "images": []})
    return out


def merge(home: dict, specs: dict) -> dict:
    """Model extract: S1 = Specifications page; home overview, sections and images added with attribution."""
    ext = dict(specs)
    ext["tagline"] = home["tagline"]
    ext["description"] = home["description"]
    ext["sections"] = home["sections"] + specs["sections"]
    seen = {i["original"] for i in specs["images"]}
    ext["images"] = specs["images"] + [i for i in home["images"] if i["original"] not in seen]
    ext["alternates"] = [{"source_url": home["source_url"], "accessed_at": home["accessed_at"],
                          "specifications": home["specifications"], "page_title": "VX One · Home",
                          "short": "Web oficial · portada",
                          "note": "Portada de la web oficial: bloque 'THE BOAT' (mismas cifras) y texto de presentación."}]
    ext["downloads"] = [{"label": "Online order form (formulario)", "title_attr": None, "url": None,
                         "kind": "brochure_form"}]
    return ext
