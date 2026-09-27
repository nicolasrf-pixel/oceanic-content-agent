"""Adapter for beneteau.com product pages (Drupal 11, server-rendered HTML).

Input: the raw HTML of a model page (Firecrawl `rawHtml` format).
Output: a source extract with every piece of official content the page holds,
kept verbatim: hero (name, tagline, price), description and designers, text
sections with their galleries, key features, the Specifications block,
profiles, layouts (tab titles + bullet lists + plans), downloads, images and
YouTube videos.

Nothing here interprets or completes data. Mapping to Oceanic fields happens in
builders/beneteau.py, where every value keeps a pointer back to this extract.
"""

from __future__ import annotations

import re
from urllib.parse import unquote, urljoin

from bs4 import BeautifulSoup

BRAND = "Beneteau"
BASE = "https://www.beneteau.com"


def _text(el) -> str:
    """Visible text of an element, one paragraph per line, spaces normalised."""
    if el is None:
        return ""
    for t in el.find_all(["script", "style", "svg", "button"]):
        t.decompose()
    blocks = []
    paras = el.find_all(["p", "li", "h3", "h4"]) or [el]
    for p in paras:
        if p.find(["p", "li"]):  # keep only leaf paragraphs
            continue
        for br in p.find_all("br"):
            br.replace_with("\n")
        for line in p.get_text("").split("\n"):
            line = re.sub(r"\s+", " ", line).strip()
            if line:
                blocks.append(("- " if p.name == "li" else "") + line)
    return "\n".join(blocks)


def original_url(src: str) -> str:
    """Drupal image style URL -> the uploaded original (styles/<s>/public/<path>.webp -> <path>)."""
    src = urljoin(BASE, src.split("?")[0])
    m = re.match(r"(https://[^/]+/sites/default/files/)styles/[^/]+/public/(.+)$", src)
    if m:
        path = m.group(2)
        if re.search(r"\.(jpe?g|png|gif)\.webp$", path, re.I):
            path = path[: -len(".webp")]
        return m.group(1) + path
    return src


def _img_record(img, section: str, section_title: str, role: str = "image") -> dict | None:
    src = img.get("src") or ""
    if not src or "/themes/" in src or src.endswith(".svg"):
        return None
    cdn = urljoin(BASE, src)
    orig = original_url(img.get("data-bp") or src)
    name = unquote(orig.rsplit("/", 1)[-1])
    return {"src": cdn, "original": orig, "file_name": name, "alt": img.get("alt") or "",
            "width": int(img["width"]) if (img.get("width") or "").isdigit() else None,
            "height": int(img["height"]) if (img.get("height") or "").isdigit() else None,
            "ext": name.rsplit(".", 1)[-1].lower() if "." in name else None,
            "section": section, "section_title": section_title, "role": role}


def _section_kind(sec) -> str:
    for c in sec.get("class", []):
        if c.startswith("o-section-") and c not in ("o-section-wrapper",):
            return c[len("o-section-"):]
    return sec.get("id") or "block"


SKIP_KINDS = ("sticky-head", "latest-news", "render-text_on_image", "other-boats", "virtual-visit", "header",
              "press-review")


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    soup = BeautifulSoup(raw_html, "html.parser")
    for t in soup.find_all(["script", "style", "noscript"]):
        t.decompose()
    out = {"brand": BRAND, "source_url": url, "accessed_at": accessed_at, "adapter": "beneteau",
           "page_title": None, "tagline": None, "price_text": None, "price_note": None, "breadcrumb": [],
           "description": "", "credits": [], "awards": [], "sections": [], "specifications": [],
           "profiles": [], "layouts": [], "downloads": [], "images": [], "videos": [], "range_models": []}

    seen_img: set[str] = set()

    def add_img(img, section, title, role="image"):
        rec = _img_record(img, section, title, role)
        if rec and rec["original"] not in seen_img:
            seen_img.add(rec["original"])
            out["images"].append(rec)

    hero = soup.select_one(".o-section-hero")
    if hero:
        out["page_title"] = (hero.find("h1").get_text(strip=True) if hero.find("h1") else None)
        out["breadcrumb"] = [{"name": li.select_one("[itemprop=name]").get_text(strip=True),
                              "url": (li.select_one("a[href]") or {}).get("href")}
                             for li in hero.select("[itemprop=itemListElement]") if li.select_one("[itemprop=name]")]
        h1 = hero.find("h1")
        tag = h1.find_next_sibling("div") if h1 else None
        out["tagline"] = tag.get_text(" ", strip=True) if tag else None
        price = hero.find("p", string=re.compile(r"\d"))
        if price:
            out["price_text"] = re.sub(r"\s+", " ", price.get_text()).strip()
        note = hero.select_one("[role=tooltip] p")
        out["price_note"] = note.get_text(" ", strip=True) if note else None
        for img in hero.find_all("img"):
            add_img(img, "hero", "hero", "hero")

    desc = soup.select_one(".o-section-product-description")
    if desc:
        awards = desc.find("h2", string=re.compile("Award", re.I))
        if awards:
            out["awards"] = [d.get("title") or (d.find("img") or {}).get("alt")
                             for d in awards.find_parent().select("[title]")] or \
                            [i.get("alt") for i in awards.find_parent().find_all("img")]
            awards.find_parent().decompose()
        # Credits ("Naval Architect: X", "Exterior & Interior Designer: Y"): labels are <strong> runs,
        # sometimes several in one paragraph, sometimes with the value on the next line.
        for strong in desc.find_all("strong"):
            if strong.get_text(strip=True).endswith(":") or (strong.next_sibling and
                                                              str(strong.next_sibling).lstrip().startswith(":")):
                strong.insert_before("\n")
        credits = []
        lines, keep = _text(desc).split("\n"), []
        i = 0
        while i < len(lines):
            m = re.match(r"^([^:]{3,60}?)\s*:\s*(.*)$", lines[i])
            if m and re.search(r"architect|design|engineer|develop", m.group(1), re.I):
                value = m.group(2) or (lines[i + 1] if i + 1 < len(lines) else "")
                credits.append({"label": m.group(1).strip(), "value": value.strip().rstrip(".")})
                i += 1 if m.group(2) else 2
                continue
            keep.append(lines[i])
            i += 1
        out["credits"] = credits
        out["description"] = "\n".join(keep).strip()

    for sec in soup.select(".o-section-wrapper"):
        kind = _section_kind(sec)
        if kind in ("hero", "product-description") or kind.startswith(SKIP_KINDS):
            if kind == "other-boats":
                out["range_models"] = [h.get_text(strip=True) for h in sec.select("h3, .o-title")
                                       if h.get_text(strip=True) and not re.match(r"(Length|Beam|Explore)", h.get_text(strip=True))]
            continue
        h2 = sec.find("h2")
        title = h2.get_text(" ", strip=True) if h2 else None
        if kind == "block" and not title:  # footer navigation
            continue
        if kind == "attributes":
            for item in sec.select(".o-attributes-item"):
                label = item.select_one(".o-title")
                vals = [p.get_text(" ", strip=True) for p in item.select(".o-desc")]
                if label:
                    out["specifications"].append({"label": label.get_text(" ", strip=True),
                                                  "values": [v for v in vals if v]})
            continue
        if kind == "slider-profil":
            for img in sec.find_all("img"):
                add_img(img, "profiles", title or "Profiles", "plan")
            continue
        if kind == "slider-boat-layout":
            for slide in sec.select(".swiper-slide"):
                h3 = slide.find("h3")
                img = slide.find("img")
                lay = {"title": h3.get_text(" ", strip=True) if h3 else None,
                       "bullets": [li.get_text(" ", strip=True) for li in slide.find_all("li")],
                       "text": _text(slide.select_one(".o-desc")) if slide.select_one(".o-desc") else "",
                       "image": None}
                if img:
                    rec = _img_record(img, "layouts", lay["title"] or "Layouts", "plan")
                    if rec:
                        lay["image"] = rec["original"]
                        add_img(img, "layouts", lay["title"] or "Layouts", "plan")
                out["layouts"].append(lay)
            continue
        if kind == "partners" or (title or "").lower() == "partners":
            continue
        # generic text section (design sliders, interior design, key features, videos, seanapps...)
        entry = {"kind": kind, "id": sec.get("id"), "title": title, "intro": "", "items": [], "images": []}
        head = sec.select_one(".o-module-head")
        if head:
            entry["intro"] = _text(BeautifulSoup(str(head), "html.parser"))
            if title and entry["intro"].startswith(title):
                entry["intro"] = entry["intro"][len(title):].strip()
        for h3 in sec.find_all("h3"):
            box = h3.find_parent("div")
            body = box.find(["div", "p"], recursive=False) if box else None
            txt = _text(BeautifulSoup(str(box), "html.parser")) if box else ""
            item_title = h3.get_text(" ", strip=True)
            if txt.startswith(item_title):
                txt = txt[len(item_title):].strip()
            entry["items"].append({"title": item_title, "text": txt})
        if not head and not entry["items"]:
            entry["intro"] = _text(BeautifulSoup(str(sec), "html.parser"))
            if title and entry["intro"].startswith(title):
                entry["intro"] = entry["intro"][len(title):].strip()
        for img in sec.find_all("img"):
            rec = _img_record(img, kind, title or kind)
            if rec:
                entry["images"].append(rec["original"])
                add_img(img, kind, title or kind)
        for v in sec.select("[data-src*='youtube.com/embed/']"):
            vid = re.search(r"embed/([\w-]+)", v["data-src"]).group(1)
            if vid not in {x["youtube_id"] for x in out["videos"]}:
                label = sec.find(["h2", "h3"])
                out["videos"].append({"youtube_id": vid, "url": f"https://www.youtube.com/watch?v={vid}",
                                      "embed_url": v["data-src"].split("?")[0],
                                      "thumbnail": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                                      "section": kind, "section_title": label.get_text(" ", strip=True) if label else None})
        if entry["intro"] or entry["items"] or entry["images"]:
            out["sections"].append(entry)

    for a in soup.select("a[data-trk-tech-download], a[data-trk-brochure-download]"):
        href = a.get("href")
        if href and href not in {d["url"] for d in out["downloads"]}:
            out["downloads"].append({"label": a.get_text(" ", strip=True), "title_attr": a.get("title"),
                                     "url": href,
                                     "kind": "brochure" if a.has_attr("data-trk-brochure-download") else "equipment_list"})
    return out
