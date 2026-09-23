"""Adapter for axopar.com product pages (Next.js + Contentful + Frontify DAM).

Input: the raw HTML of a model page (Firecrawl `rawHtml` format).
Output: a source extract with every piece of official content the page holds,
kept verbatim: hero, text sections, highlight tabs, edition modals,
technical specifications, standard/optional equipment, images and videos
with their DAM metadata.

Nothing here interprets or completes data. Normalisation happens later, in
specifications.json, where every value keeps a pointer back to this extract.
"""

from __future__ import annotations

import json

from .. import rsc

BRAND = "Axopar"


def _dam_assets(node) -> list[dict]:
    return [a for a in (node or []) if isinstance(a, dict) and a.get("src")]


def _asset_record(asset: dict, context: dict) -> dict:
    return {
        "dam_id": asset.get("id"),
        "title": asset.get("title"),
        "file_name": asset.get("name"),
        "ext": asset.get("ext"),
        "width": asset.get("width"),
        "height": asset.get("height"),
        "created": asset.get("created"),
        "src": asset.get("src"),
        "original_download_url": asset.get("generic_url"),
        "tags": [t.get("value") for t in asset.get("tags") or [] if isinstance(t, dict)],
        "copyright_notice": (asset.get("copyright") or {}).get("notice") or None,
        "context": context,
    }


def _collect_media(page: dict) -> tuple[list[dict], list[dict]]:
    """Every image and video referenced by the product page, with where it appears."""
    images, videos, seen = [], [], set()

    def visit(node, ctx):
        if isinstance(node, dict):
            local = dict(ctx)
            if node.get("__typename", "").endswith("Block"):
                local = {"block_type": node["__typename"], "block_title": node.get("title")}
            for key in ("title", "name", "caption", "heading"):
                if isinstance(node.get(key), str) and node.get("__typename") in (
                    "TabEntity", "TabContentBlock", "CardEntity", "VideoEntity", "ImageEntity",
                ):
                    local.setdefault("item_title", node[key])
            for key, kind in (("imageDam", "image"), ("coverImageDam", "image"),
                              ("someImageDam", "image"), ("imagesDam", "image"),
                              ("videoDam", "video")):
                for asset in _dam_assets(node.get(key)):
                    rec = _asset_record(asset, local)
                    rec["role"] = "video_cover" if key == "coverImageDam" else kind
                    if key == "videoDam":
                        rec["caption"] = node.get("caption") or node.get("title")
                    uid = (rec["src"], rec["role"])
                    if uid in seen:
                        continue
                    seen.add(uid)
                    (videos if kind == "video" else images).append(rec)
            if node.get("videoUrl"):
                videos.append({"src": node["videoUrl"], "role": "video_link",
                               "caption": node.get("caption") or node.get("title"),
                               "context": local})
            for key, value in node.items():
                visit(value, local)
        elif isinstance(node, list):
            for value in node:
                visit(value, ctx)

    visit({"hero": page.get("hero")}, {"block_type": "HeroBlock", "block_title": "hero"})
    visit(page.get("blocks"), {})
    return images, videos


def _rich_text(value):
    """Contentful rich text -> plain paragraphs; plain strings pass through."""
    if isinstance(value, str) or value is None:
        return value
    if isinstance(value, dict) and "json" in value:
        value = value["json"]
    paras = []

    def visit(node):
        if isinstance(node, dict):
            if node.get("nodeType") == "text":
                return node.get("value", "")
            parts = [visit(c) for c in node.get("content", [])]
            text = "".join(p for p in parts if p)
            if node.get("nodeType") in ("paragraph", "heading-1", "heading-2", "heading-3",
                                        "list-item") and text.strip():
                paras.append(text.strip())
                return ""
            return text
        return ""

    visit(value)
    return "\n\n".join(paras)


def _text_sections(page: dict) -> list[dict]:
    sections = []
    for block in page.get("blocks") or []:
        typ = block.get("__typename")
        entry = {"block_type": typ, "title": block.get("title"),
                 "intro": _rich_text(block.get("intro")), "items": []}
        if block.get("list"):
            entry["list"] = block["list"]
        if typ == "TabsBlock":
            for tab in (block.get("tabsCollection") or {}).get("items", []):
                content = tab.get("content") or {}
                entry["items"].append({
                    "name": tab.get("name"),
                    "title": content.get("title"),
                    "text": _rich_text(content.get("intro")),
                    "list": content.get("list"),
                })
        for coll in ("cardsCollection",):
            for card in (block.get(coll) or {}).get("items", []):
                item = {"title": card.get("title"),
                        "text": _rich_text(card.get("description"))}
                modal = card.get("modalContent")
                if modal:
                    texts = []

                    def grab(node, path):
                        if node.get("nodeType") == "document":
                            txt = _rich_text(node)
                        elif isinstance(node.get("title"), str) and node.get("__typename", "").endswith("Block"):
                            txt = node["title"]
                        else:
                            txt = next((node[k] for k in ("heading", "intro", "text", "description")
                                        if isinstance(node.get(k), str)), None)
                        if txt and txt not in texts:
                            texts.append(txt)
                    rsc.walk(modal, grab)
                    item["modal_text"] = texts
                entry["items"].append(item)
        for coll in ("imagesSliderCollection", "imagesGridCollection"):
            for img in (block.get(coll) or {}).get("items", []):
                cap = img.get("caption") or img.get("description")
                if cap:
                    entry["items"].append({"caption": _rich_text(cap)})
        if typ == "VideoGalleryBlock":
            for vid in (block.get("videosCollection") or {}).get("items", []):
                entry["items"].append({"video_title": vid.get("title"),
                                       "caption": vid.get("caption")})
        if entry["title"] or entry["intro"] or entry["items"]:
            sections.append(entry)
    return sections


def _first(values):
    for v in values:
        if v not in (None, "", [], {}):
            return v
    return None


def extract(raw_html: str, url: str, accessed_at: str) -> dict:
    payload = rsc.payload_from_html(raw_html)
    rows = rsc.text_rows(payload)
    candidates = [v for v in rsc.find_key(payload, "data")
                  if isinstance(v, dict) and "blocks" in v and "hero" in v]
    if not candidates:
        raise ValueError("No product page data found in payload")
    page = rsc.resolve_refs(candidates[0], rows)
    page_json = json.dumps(page)

    def page_key(key):
        return _first(rsc.resolve_refs(rsc.find_key(page_json, key), rows))

    def payload_key(key):
        return _first(rsc.resolve_refs(rsc.find_key(payload, key), rows))

    hero = page.get("hero") or {}
    images, videos = _collect_media(page)
    return {
        "brand": BRAND,
        "source_url": url,
        "accessed_at": accessed_at,
        "extractor": "tools/oceanic/adapters/axopar.py",
        "page_title": page.get("title"),
        "configurator_id": page.get("configuratorId"),
        "model_year": payload_key("modelYear"),
        "product_group": payload_key("isVariantOf"),
        "country_of_origin": payload_key("countryOfOrigin"),
        "prices": {k: payload_key(k) for k in
                   ("startingPriceEur", "startingPriceUsd", "withEngineEur", "withEngineUsd")},
        "hero": {"title": hero.get("title"), "heading": hero.get("heading"),
                 "subheading": hero.get("subheading"), "intro": _rich_text(hero.get("intro"))},
        "sections": _text_sections(page),
        "technical_specifications": page_key("technicalSpecifications") or payload_key("technicalSpecifications"),
        "standard_equipment": page_key("standardEquipment") or payload_key("standardEquipment"),
        "optional_equipment": page_key("optionalEquipment") or payload_key("optionalEquipment"),
        "range": [p.get("title") for p in page.get("productsInRange") or []],
        "images": images,
        "videos": videos,
    }
