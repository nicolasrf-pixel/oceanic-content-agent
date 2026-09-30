"""Adapter for aquilaboats.com model pages (HubSpot CMS, HubDB modules).

Output: the same extract shape as adapters/beneteau.py, so builders/aquila.py can reuse the shared
package writer. The page holds: overview text, a Specifications table (#specification), sometimes a
second list in two-column modules (Tankage, Propulsion, ...), a gallery whose images live in
`data-image-url` attributes (with descriptive aria-labels), YouTube videos and the spec-sheet PDF.
The FAQ tab is not in the server HTML. Owner testimonials and third-party reviews are flagged.
"""

from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

BRAND = "Aquila"
NAMES = {"yachts": "Yacht", "coupes": "Coupe", "luxury": "Luxury", "sport-power-catamaran": "Sport",
         "sail-catamarans": "Sail"}


def model_name(url: str) -> str:
    cat, last = url.rstrip("/").split("/")[-2:]
    size = re.match(r"\d+", last).group(0)
    if cat == "offshore":
        return f"Aquila {size} Molokai" + (" Cuddy" if "cuddy" in last else "")
    return f"Aquila {size} {NAMES.get(cat, cat.title())}"


def _values(v: str) -> list[str]:
    v = re.sub(r"\s+", " ", v).strip()
    parts = [p.strip() for p in re.split(r"\s+/\s+", v)]
    if len(parts) == 2 and re.search(r"\d", parts[0]) and re.search(r"\d", parts[1]) and \
            re.search(r"\b(M|CM|KG|L|SQ M)\b|\dM\b|\dL\b", parts[0], re.I):
        parts = [re.sub(r"(\d)(M|L|KG|CM)\b", r"\1 \2", p, flags=re.I) for p in parts]
        return [re.sub(r"\b(M|KG|CM)\b", lambda m: m.group(1).lower(), p) for p in parts]
    return [v]


def _img(url: str, alt: str, section: str, title: str, role: str = "image") -> dict:
    url = url.split("?")[0]
    path = unquote(url.split("/hubfs/", 1)[-1]) if "/hubfs/" in url else unquote(url.rsplit("/", 1)[-1])
    name = path.rsplit("/", 1)[-1]
    return {"src": url, "original": url, "file_name": name, "alt": alt or "", "width": None, "height": None,
            "ext": name.rsplit(".", 1)[-1].lower() if "." in name else None, "section": section,
            "section_title": title, "role": role, "dam_folder": path.rsplit("/", 1)[0] if "/" in path else None}


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    soup = BeautifulSoup(raw_html, "html.parser")
    for t in soup(["script", "style", "noscript", "form", "select"]):
        t.decompose()
    name = model_name(url)
    cat = url.rstrip("/").split("/")[-2]
    out = {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "aquila",
           "page_title": name, "h1": None, "tagline": None, "price_text": None, "price_note": None,
           "breadcrumb": [{"name": "Home", "url": "https://www.aquilaboats.com/"},
                          {"name": "Sail catamarans" if cat == "sail-catamarans" else "Power catamarans", "url": None},
                          {"name": {"offshore": "Molokai (offshore)"}.get(cat, NAMES.get(cat, cat)), "url": None}],
           "description": "", "credits": [], "awards": [], "sections": [], "specifications": [],
           "profiles": [], "layouts": [], "downloads": [], "images": [], "videos": [], "range_models": [],
           "press_quotes": [], "dam_folder": None}
    seen: set[str] = set()

    def add(rec):
        if rec["original"] not in seen and not re.search(r"\.svg$|icon|logo|play-icon|arrow|Footer", rec["original"], re.I):
            seen.add(rec["original"])
            out["images"].append(rec)

    h1 = soup.find("h1")
    out["h1"] = h1.get_text(" ", strip=True) if h1 else None

    # Overview: the paragraphs after the h1, up to the "Request Information" form.
    paras = []
    for el in (h1.find_all_next(["p", "h2", "h3"]) if h1 else []):
        t = el.get_text(" ", strip=True)
        if el.name in ("h2", "h3"):
            break
        if t and not re.match(r"(ATTENDING|Schedule your|RESERVE NOW)", t, re.I):
            paras.append(t)
    out["description"] = "\n".join(p for p in paras if len(p) > 30)
    tag = [p for p in paras if len(p) <= 60 and p.lower().startswith("because")]
    out["tagline"] = tag[0] if tag else None

    for award in soup.find_all("img", src=re.compile(r"Award", re.I)):
        out["awards"].append(unquote(award["src"].rsplit("/", 1)[-1]).rsplit(".", 1)[0])

    # Specifications table.
    spec = soup.select_one("#specification")
    if spec:
        for tr in spec.find_all("tr"):
            tds = tr.find_all("td")
            if len(tds) == 2:
                out["specifications"].append({"label": tds[0].get_text(" ", strip=True),
                                              "values": _values(tds[1].get_text(" ", strip=True)),
                                              "location": "Specifications (tabla)"})
        for img in spec.find_all("img"):
            add(_img(img["src"], img.get("alt"), "profiles", "Profile", "plan"))
    # Second spec list (Tankage, Propulsion...) and texts in two-column modules.
    for mod in soup.select(".cc_hubdb_details__two_column_right"):
        h = mod.find(["h2", "h3"])
        title = h.get_text(" ", strip=True) if h else None
        lis = [li.get_text(" ", strip=True) for li in mod.find_all("li")]
        if title and lis and re.search(r"tankage|propulsion|engine|specification|dimension|capacit", title, re.I):
            for li in lis:
                m = re.match(r"^(.*?)\s*[-–:]?\s*((?:\d|[1-9]X\b).*)$", li)
                label, value = (m.group(1).strip(" -–:"), m.group(2)) if m and m.group(1) else (li, li)
                out["specifications"].append({"label": f"{title} · {label}" if label != li else title,
                                              "values": _values(value), "raw": li,
                                              "location": f"{title} (lista)"})
        elif title:
            text = "\n".join(p.get_text(" ", strip=True) for p in mod.find_all("p") if p.get_text(strip=True))
            if text or lis:
                out["sections"].append({"kind": "two-column", "id": None, "title": title, "intro": text,
                                        "items": [{"title": li, "text": ""} for li in lis], "images": []})
        left = mod.find_previous_sibling(class_=re.compile("two_column_left"))
        for img in (left.find_all("img") if left else []):
            add(_img(img["src"], img.get("alt"), "layouts" if re.search(r"layout|deck", img["src"], re.I) else "block",
                     title or "", "plan" if re.search(r"layout", img["src"], re.I) else "image"))

    # Gallery (background images) with aria-labels.
    for el in soup.select("[data-image-url]"):
        add(_img(el["data-image-url"], el.get("aria-label") or el.get("title"), "gallery", "Gallery"))
    # Hero banner and other content images.
    for m in re.finditer(r"url\((?:&quot;|\")?(https://www\.aquilaboats\.com/hubfs/[^\"&)]+?\.(?:webp|jpe?g|png))", raw_html):
        u = m.group(1)
        if re.search(r"1440x|hero|banner|header", u, re.I):
            add(_img(u, "", "hero", "hero", "hero"))

    # Sections: h2 blocks with paragraphs (skip owners' testimonials and third-party reviews).
    for h2 in soup.find_all("h2"):
        title = h2.get_text(" ", strip=True)
        if re.search(r"owner|third-party|virtual|request|external evaluation|in action|walkthrough", title, re.I):
            continue
        texts = []
        for sib in h2.find_all_next(["p", "h2"]):
            if sib.name == "h2":
                break
            t = sib.get_text(" ", strip=True)
            if t and len(t) > 40 and t not in out["description"]:
                texts.append(t)
        if texts:
            out["sections"].append({"kind": "block", "id": None, "title": title, "intro": "\n".join(dict.fromkeys(texts)),
                                    "items": [], "images": []})

    # Videos: YouTube embeds; flag third-party and owner testimonials.
    current = None
    for el in soup.find_all(["h2", "a"]):
        if el.name == "h2":
            current = el.get_text(" ", strip=True)
            continue
        m = re.search(r"youtube\.com/embed/([\w-]+)", el.get("href") or "")
        if m and m.group(1) not in {v["youtube_id"] for v in out["videos"]}:
            label = el.get_text(" ", strip=True) or None
            out["videos"].append({"youtube_id": m.group(1), "url": f"https://www.youtube.com/watch?v={m.group(1)}",
                                  "embed_url": f"https://www.youtube.com/embed/{m.group(1)}",
                                  "thumbnail": f"https://i.ytimg.com/vi/{m.group(1)}/hqdefault.jpg",
                                  "section": current, "section_title": label,
                                  "third_party": bool(re.search(r"third-party|owner", current or "", re.I))})
    for v in out["videos"]:
        if not v["section_title"]:
            v["section_title"] = v["section"]

    pdf = re.search(r"https://www\.aquilaboats\.com/hubfs/[^\"']+SpecSheet[^\"']*\.pdf", raw_html)
    if pdf:
        out["downloads"].append({"label": "Download specs and layouts", "title_attr": None, "url": pdf.group(0),
                                 "kind": "equipment_list"})
        out["dam_folder"] = unquote(pdf.group(0).split("/hubfs/", 1)[1]).rsplit("/", 1)[0]
    out["downloads"].append({"label": "Download brochure", "title_attr": None, "url": None, "kind": "brochure_form"})
    return out
