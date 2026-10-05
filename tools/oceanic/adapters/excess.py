"""Adapter for excess-catamarans.com model pages (Groupe Beneteau, Symfony site, server-rendered).

Output: the same extract shape as adapters/beneteau.py, so builders/excess.py can reuse the shared package writer.
The page holds: a cover banner (h1 + tagline), a summary, an intro block, content blocks (Riders' Edition, Hybrid),
"strong points" with pictures, a categorised gallery (originals in the lightbox <a href>), a 360° visit, owner
testimonies (third party, excluded), the technical block "THE ESSENTIALS / IN FIGURES" (label/value paragraph pairs
per group), the layouts slider, events, news and links to the other models.
Resized copies live under /media/cache/<filter>/...; the original is the same path without "cache/<filter>/".
"""

from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

BRAND = "Excess"
SITE = "https://www.excess-catamarans.com"


def original_url(url: str) -> str:
    url = url.split("?")[0].split(" ")[0]
    url = re.sub(r"/media/cache/[\w-]+/", "/media/", url)
    if "_webp/" in url or url.endswith(".webp"):
        url = re.sub(r"\.webp$", ".jpg", url)
    return url


def _txt(el) -> str:
    return re.sub(r"[ \t\xa0]+", " ", el.get_text(" ", strip=True)).strip() if el else ""


def _num_thousands(v: str) -> str:
    """'9,000 kg' -> '9000 kg' (comma as thousands separator before kg/lbs/L); '6,59 m' stays a decimal.
    Also '11.33m' -> '11.33 m', '71 m ²' -> '71 m²', '2 x 200L' -> '2 x 200 L' (spacing only, same value)."""
    v = re.sub(r"(\d),(\d{3})(?=\s*(?:kg|lbs|l\b|L\b|US|sq))", r"\1\2", v)
    v = re.sub(r"m\s+²", "m²", v)
    return re.sub(r"(\d)(m²|m|L|kg)(?!\w)", r"\1 \2", v)


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    soup = BeautifulSoup(raw_html, "html.parser")
    for t in soup(["script", "style", "noscript", "svg"]):
        t.decompose()
    main = soup.find("main")
    h1 = main.find("h1")
    model = _txt(h1.find(class_="title")) or _txt(h1)
    slug = re.sub(r"[^a-z0-9]+", "-", model.lower()).strip("-")
    banner = main.find("section", class_="banner")
    tag = h1.find(class_="subtitle")
    out = {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "excess",
           "page_title": model, "slug": slug, "tagline": _txt(tag).capitalize() if tag else None,
           "price_text": None, "price_note": None,
           "breadcrumb": [{"name": "Home", "url": SITE + "/"},
                          {"name": "Our catamarans", "url": SITE + "/our-catamarans"},
                          {"name": model, "url": url}],
           "description": "", "credits": [], "awards": [], "sections": [], "specifications": [],
           "profiles": [], "layouts": [], "downloads": [], "images": [], "videos": [], "range_models": [],
           "press_quotes": []}
    seen: set[str] = set()

    def add(src, alt, section, title, role="image"):
        if not src or "/media/" not in src:
            return
        orig = original_url(src if src.startswith("http") else SITE + src)
        if orig in seen:
            return
        seen.add(orig)
        name = unquote(orig.rsplit("/", 1)[-1])
        out["images"].append({"src": src, "original": orig, "file_name": name, "alt": alt or "",
                              "width": None, "height": None, "ext": name.rsplit(".", 1)[-1].lower(),
                              "section": section, "section_title": title, "role": role})

    def pic(el):
        img = el.find("img") if el else None
        if not img:
            return None, ""
        src = (img.get("data-srcset") or img.get("src") or "").split(",")[-1].strip().split(" ")[0]
        return src, img.get("alt") or ""

    if banner:
        for p in banner.find_all("picture"):
            src, alt = pic(p)
            add(src, alt, "hero", "hero", "hero")

    summ = main.find("section", class_="summary")
    if summ:
        body = summ.find(class_="text") or summ
        paras = [_txt(p) for p in body.find_all("p")] or [_txt(body)]
        out["description"] = "\n".join(t for t in paras
                                       if t and not re.fullmatch(r"(Receive the brochure|Request a sea trial)", t))

    intro = main.find("section", class_="intro")
    if intro:
        head = _txt(intro.find(class_="title2")) or _txt(intro.find("h2"))
        body = intro.find("div", class_="intro")
        text = "\n".join(t.strip() for t in body.get_text("\n").split("\n") if t.strip()) if body else ""
        out["sections"].append({"kind": "block", "id": "description", "title": head or "Intro",
                                "intro": re.sub(r"[ \t\xa0]+", " ", text), "items": [], "images": []})

    blocks = main.find("section", class_="content-blocks")
    if blocks:
        cur = None
        for el in blocks.find_all(["h2", "h3", "p", "img"]):
            if el.name in ("h2", "h3"):
                t = _txt(el)
                if t:
                    cur = {"kind": "block", "id": None, "title": t, "intro": "", "items": [], "images": []}
                    out["sections"].append(cur)
            elif el.name == "p" and cur is not None:
                t = _txt(el)
                if t and not t.startswith("In order to view this video"):
                    cur["intro"] = (cur["intro"] + "\n" + t).strip()
            elif el.name == "img":
                src = (el.get("data-srcset") or el.get("src") or "").split(",")[-1].strip().split(" ")[0]
                add(src, el.get("alt"), "content", cur["title"] if cur else "content")

    sp = main.find("section", class_="strong-points")
    if sp:
        items = []
        for li in sp.find_all("li", class_="strong-point-item"):
            title = _txt(li.find(class_="h2"))
            items.append({"title": title, "text": "\n".join(_txt(p) for p in li.find_all("p") if _txt(p))})
            src, alt = pic(li.find(class_="picture"))
            add(src, alt or title, "strong-points", title)
        out["sections"].append({"kind": "highlights", "id": None, "title": "Strong points", "intro": "",
                                "items": items, "images": []})
    out["sections"] = [s for s in out["sections"] if s["intro"] or s["items"]]

    gal = main.find("section", id="pictures")
    if gal:
        cats = {f"category-{b['data-category']}": _txt(b) for b in gal.find_all("button", attrs={"data-category": True})}
        for a in gal.find_all("a", class_="big-picture"):
            label = cats.get(a.get("data-category"), "Gallery")
            add(a.get("href"), a.get("data-title", "").strip(), "gallery", label)

    lay = main.find("section", id="layout")
    if lay:
        for li in lay.find_all("li", class_="plan-item"):
            if "slick-cloned" in (li.get("class") or []):
                continue
            a = li.find("a", class_="big-picture")
            if not a:
                continue
            title = (a.get("data-title") or "").strip()
            out["layouts"].append({"title": title, "bullets": [], "text": "", "image": original_url(a["href"])})
            add(a["href"], title, "layouts", title, "plan")

    feats = main.find("section", id="features")
    if feats:
        for item in feats.find_all(class_="feature-item"):
            group = _txt(item.find("h3"))
            label = None
            for p in item.find(class_="content").find_all("p"):
                t = _txt(p)
                if not t:
                    continue
                if p.find(class_="text-primary"):
                    label = t if label is None else f"{label} {t}"
                    continue
                if label is None:
                    continue
                # "19.05 m | 62'6'' / 20.15 m | 66'1''" (std / Pulse Line): the first value is the standard one.
                first = re.split(r"\s+/\s+(?=\d+[.,]?\d*\s*m\b)", t)[0]
                vals = [_num_thousands(v.strip()) for v in re.split(r"\s*\|\s*", first) if v.strip()]
                row = {"label": label, "values": vals, "raw": t, "group": group,
                       "location": f"THE ESSENTIALS IN FIGURES › {group}"}
                if not any(r["label"] == label and r["raw"] == t for r in out["specifications"]):
                    out["specifications"].append(row)
                label = None

    for b in main.find_all(attrs={"data-video-url": True}):
        m = re.search(r"(?:youtu\.be/|v=|embed/)([\w-]{11})", b["data-video-url"])
        if m and m.group(1) not in {v["youtube_id"] for v in out["videos"]}:
            y = m.group(1)
            out["videos"].append({"youtube_id": y, "url": f"https://www.youtube.com/watch?v={y}",
                                  "embed_url": f"https://www.youtube.com/embed/{y}",
                                  "thumbnail": f"https://i.ytimg.com/vi/{y}/hqdefault.jpg",
                                  "section": "video", "section_title": "Video de la página", "third_party": False})
    if re.search(r"/brochure\?boat=\d+", raw_html):
        out["downloads"].append({"label": "Receive the brochure", "title_attr": None, "url": None, "kind": "brochure_form"})
    boats = main.find("section", class_="boats")
    if boats:
        out["range_models"] = sorted({_txt(h) for h in boats.find_all(["h3", "h4", "div"], class_=re.compile("title"))
                                      if re.fullmatch(r"Excess \d+", _txt(h))})
    return out
