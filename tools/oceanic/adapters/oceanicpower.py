"""Adapter for oceanic.cl/oceanic-power-boats/<modelo>/ (WordPress + Elementor): Oceanic Power Boats, the RIB
(semirrígido) line sold under Oceanic's own brand. For these boats oceanic.cl IS the official brand site.

Each model page holds: the model title (h2), the price ("DESDE USD ..."), the standard equipment list ("Esta
embarcación Incluye:"), the "Ficha Técnica" table (CARACTERISTICAS / value rows) and the product photo(s).
The range page (/oceanic-power-boats/) holds the brand text ("Oceanic Power es una embarcación de casco
semirrígido...") and a card per model with length and beam (same figures).
"""

from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

BRAND = "Oceanic Power"
RANGE_URL = "https://oceanic.cl/oceanic-power-boats/"


def original_url(url: str) -> str:
    url = url.split("?")[0]
    return re.sub(r"-\d{2,4}x\d{2,4}(?=\.\w+$)", "", url)


def range_text(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")
    p = soup.find(string=re.compile("Oceanic Power es una embarcación"))
    return p.find_parent(["p", "div"]).get_text(" ", strip=True) if p else ""


def extract(raw_html: str, url: str, accessed_at: str, brand_text: str = "") -> dict:
    soup = BeautifulSoup(raw_html, "html.parser")
    for t in soup(["script", "style", "noscript", "svg", "form"]):
        t.decompose()
    main = soup.find("main") or soup.find(attrs={"data-elementor-type": "wp-page"}) or soup.body
    h2s = [h.get_text(" ", strip=True) for h in main.find_all("h2")]
    name = next((h for h in h2s if re.match(r"RIB", h, re.I)), None) or soup.title.get_text().split(" - ")[0]
    name = re.sub(r"\s+", " ", name).strip()
    price = next((h for h in h2s if re.search(r"USD", h)), None)
    line = "RIB LUX" if "LUX" in name.upper() else "RIB ALUM"
    out = {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "oceanicpower",
           "slug": "oceanic-power-" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
           "page_title": f"Oceanic Power {name}", "tagline": "Ready to adventure", "price_text": price,
           "price_note": "Precio 'desde' publicado en la página del modelo (USD).",
           "breadcrumb": [{"name": "Oceanic", "url": "https://oceanic.cl/"},
                          {"name": "Oceanic Power Boats", "url": RANGE_URL}, {"name": line, "url": RANGE_URL}],
           "description": brand_text, "credits": [], "awards": [], "sections": [], "specifications": [],
           "profiles": [], "layouts": [], "downloads": [], "images": [], "videos": [], "range_models": [],
           "press_quotes": [], "standard_equipment": []}
    head = main.find(string=re.compile(r"Esta embarcación Incluye", re.I))
    if head:
        ul = head.find_parent().find_next("ul")
        out["standard_equipment"] = [li.get_text(" ", strip=True) for li in ul.find_all("li")] if ul else []
        out["sections"].append({"kind": "features", "id": None, "title": "Esta embarcación incluye", "intro": "",
                                "items": [{"title": i, "text": ""} for i in out["standard_equipment"]], "images": []})
    for tr in main.find_all("tr"):
        cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
        if len(cells) == 2 and not cells[0].upper().startswith("CARACTER"):
            out["specifications"].append({"label": cells[0], "values": [cells[1]], "raw": cells[1],
                                          "location": "Ficha Técnica"})
    seen = set()
    for img in main.find_all("img"):
        src = img.get("src") or img.get("data-src") or ""
        if "/wp-content/uploads/" not in src or re.search(r"power_1|logo|isofooter|whatsapp", src, re.I):
            continue
        orig = original_url(src)
        if orig in seen:
            continue
        seen.add(orig)
        fname = unquote(orig.rsplit("/", 1)[-1])
        out["images"].append({"src": src, "original": orig, "file_name": fname, "alt": img.get("alt") or "",
                              "width": None, "height": None, "ext": fname.rsplit(".", 1)[-1].lower(),
                              "section": "gallery", "section_title": "Página del modelo", "role": "image"})
    out["downloads"].append({"label": "Cotiza aquí tu Semi rígido (formulario)", "title_attr": None, "url": None,
                             "kind": "brochure_form"})
    return out
