"""Build a full model package from a Lagoon source extract (adapters/lagoon.py).

Lagoon belongs to Groupe Beneteau and its site shares the Drupal back office, so the package writer
is builders/beneteau.py run with Lagoon's settings (CFG). Only the specifications differ: Lagoon
publishes a complete list (sail areas, standard engine, tanks, CE approval, berths) that maps to the
catamaran_vela base table.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from . import beneteau as B
from .axopar import _field, _fmt

ROOT = B.ROOT
MODEL_YEAR = B.MODEL_YEAR

CFG = dict(B.CFG)
CFG.update({
    "brand": "Lagoon", "brand_dir": ROOT / "biblioteca" / "lagoon",
    "publisher": "Lagoon (CNB / Groupe Beneteau, Francia)", "origin": "Lagoon · Francia",
    "builder": "lagoon", "adapter": "adapters/lagoon.py",
    "boat_type": lambda ext: "catamaran_vela",
    "type_label": {"catamaran_vela": "Catamarán a vela"},
    "excluded_sources": [{"title": "Configurador Lagoon", "url": "https://configurator.catamarans-lagoon.com/",
                          "reason": "Herramienta interactiva; no se leyó. No aporta datos."}],
    "video_platform": "YouTube (canal Lagoon Catamarans)",
    "manual_doc": {"id": "lagoon-club", "title": "Lagoon Club (portal de propietarios)",
                   "source_page": "https://club.catamarans-lagoon.com/en"},
    "manual_note": "Manual del propietario: no publicado en la web del producto; identificar en el portal de propietarios.",
    "equipment_note": "la web del producto no publica lista de equipamiento (el brochure se pide por formulario).",
})

# label on catamarans-lagoon.com (lowercase, without "*" or trailing notes) -> (field, kind)
SPEC_MAP = [
    (r"length overall", "eslora_total", "m"),
    (r"hull length", "eslora_casco", "m"),
    (r"waterline length", None, None),
    (r"beam overall", "manga_casco", "m"),
    (r"water draft|draft", "calado", "m"),
    (r"air draft", "altura_linea_flotacion", "m"),
    (r"light displacement.*", "desplazamiento", "kg"),
    (r"(water tank capacity|fresh water capacity)$", "capacidad_agua_dulce", "l"),
    (r"fuel (tank )?capacity", "capacidad_combustible", "l"),
    (r"gray water capacity", None, None),
    (r"no\. of berths", "literas", None),
    (r"ce (approval|certification)", "certificacion", None),
    (r"(upwind sail area|sails area upwind).*", "superficie_velica", "m²"),
    (r"(high roach mainsail|square[ -]top mainsail|full-batten mainsail.*|furling mainsail).*", "mayor", "m²"),
    (r"(furling genoa|genoa.*|self-tacking jib)", "genova", "m²"),
]
XREF = {
    "manga_casco": "'Beam overall' (manga máxima) es la manga publicada del catamarán.",
    "desplazamiento": "'Light displacement (EEC)' = desplazamiento en rosca.",
    "superficie_velica": "'Upwind sail area' = superficie vélica de ceñida publicada (mayor + génova).",
    "potencia_motor_auxiliar": "Potencia de la motorización publicada en el bloque técnico.",
}


def _label(label: str) -> str:
    return re.sub(r"\s+", " ", label.replace("*", "")).strip().lower()


def _row(label, values):
    return {"label": label, "values": values}


def _area(value: str):
    m = re.search(r"([\d.,]+)\s*m²", value)
    return float(m.group(1).replace(",", ".")) if m else None


def _power(value: str):
    m = re.search(r"(?:(\d+)\s*x\s*)?(\d+)\s*(?:CV|HP)", value, re.I)
    return (int(m.group(1) or 1), int(m.group(2))) if m else None


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    labels = {f["key"]: f["label"] for f in catalog["fields"]}
    boat = ident["boat_type"]
    grouped: dict[str, list] = {}
    loa = None
    for s in ext["specifications"]:
        lab = _label(s["label"])
        for pat, key, kind in SPEC_MAP:
            if re.fullmatch(pat, lab):
                if key:
                    grouped.setdefault(key, []).append((s, kind))
                break
        if lab == "length overall" and loa is None:
            loa = B._metric(s["values"][0].replace(",", "."))[0]
    fields: dict[str, dict] = {}

    for key, rows in grouped.items():
        built = []
        for s, kind in rows:
            vals = [v.replace(" t", " t") for v in s["values"]]
            if kind == "kg":  # "13,9 t" -> kg
                metric = vals[0]
                m = re.match(r"([\d.,]+)\s*t\b", metric)
                if m:
                    kg = float(m.group(1).replace(",", ".")) * 1000
                    vals = [f"{kg:.0f} kg (publicado: {metric})"] + vals[1:]
            if kind in ("m", "kg", "l"):
                f = B._quantity_field(key, labels[key], _row(s["label"], vals), kind, src, XREF.get(key), loa)
                for r in f["records"]:
                    r["source_value"] = r["source_value"].replace(f"{vals[0]}", s["values"][0]) if kind == "kg" else r["source_value"]
                if kind == "kg" and f["status"] == "VERIFIED":
                    f["display_value"] = f"{_fmt(f['records'][0]['normalized_value'], 0)} kg"
                    f["display_note"] = f"publicado como {s['values'][0]}"
                built.append(f)
            elif kind == "m²":
                v = _area(s["values"][0])
                rec = B._row_record(src, s, v, "m²", XREF.get(key))
                opt = re.search(r"opt", s["label"], re.I)
                built.append(_field(key, labels[key], "VERIFIED", [rec], display=f"{_fmt(v, 0 if v == int(v) else 1)} m²",
                                    note="opcional" if opt else None))
            elif key == "certificacion":
                raw = " ".join(s["values"])
                toks = re.findall(r"([A-D])\s*:?\s*(\d+)", raw)
                disp = " / ".join(f"{a}{n}" for a, n in toks) or raw
                built.append(_field(key, labels[key], "VERIFIED", [B._row_record(src, s, disp, None)], display=disp,
                                    notes="Categoría CE : personas, tal como lo publica la web."))
            elif key == "literas":
                nums = re.findall(r"\d+", " ".join(s["values"]))
                disp = f"{nums[0]} a {nums[1]}" if len(nums) == 2 else " ".join(s["values"])
                built.append(_field(key, labels[key], "VERIFIED", [B._row_record(src, s, disp, None)], display=disp,
                                    note="según versión"))
        if len(built) == 1:
            fields[key] = built[0]
            continue
        # Same field published twice in the block (e.g. two "Beam overall", or mainsail variants).
        if key in ("mayor", "genova"):
            std = [b for b in built if not b.get("display_note")] or built
            fields[key] = dict(std[0])
            others = [f"{b['records'][0]['source_field']}: {b['display_value']}" for b in built if b is not std[0]]
            fields[key]["notes"] = "Otras velas publicadas: " + "; ".join(others)
            continue
        recs = [r for b in built for r in b["records"]]
        norms = {json.dumps(r["normalized_value"]) for r in recs}
        if len(norms) == 1 and all(b["status"] == "VERIFIED" for b in built):
            fields[key] = dict(built[0], records=recs, notes="Publicado dos veces en el bloque técnico, mismo valor.")
        else:
            fields[key] = _field(key, labels[key], "CONFLICT", recs,
                                 notes="El bloque técnico publica este campo más de una vez con valores distintos.")

    # Motorización: estándar y, si existe, opción (el motor más potente ofrecido es la potencia máx.)
    rows = {_label(s["label"]): s for s in ext["specifications"]}
    std = rows.get("motorisation - standard") or rows.get("engine power")
    opt = rows.get("motorisation - option")
    if std:
        chosen, why = (opt, "Motorización opcional: el motor más potente ofrecido") if opt and _power(opt["values"][0]) else \
                      (std, "Motorización estándar publicada (no hay opción más potente)")
        n, hp = _power(chosen["values"][0]) or (None, None)
        disp = (f"{n} x {hp} hp" if n and n > 1 else f"{hp} hp") if hp else chosen["values"][0]
        rec = B._row_record(src, chosen, n * hp if hp else chosen["values"][0], "hp" if hp else None,
                            f"{why} → potencia del motor auxiliar.")
        fields["potencia_motor_auxiliar"] = _field("potencia_motor_auxiliar", labels["potencia_motor_auxiliar"],
                                                   "VERIFIED", [rec], display=disp,
                                                   notes=f"Estándar: {std['values'][0]}" + (f"; opción: {opt['values'][0]}" if opt else ""))
        named = rows.get("engine power") if rows.get("engine power") and re.search(r"[A-Za-z]{3,}.*\d", rows["engine power"]["values"][0]) \
            and rows.get("engine power") is not std else None
        src_row = named or std
        fields["motor_auxiliar"] = _field("motor_auxiliar", labels["motor_auxiliar"], "VERIFIED",
                                          [dict(B._row_record(src, src_row, src_row["values"][0], None),
                                                cross_reference="Motorización del bloque técnico"
                                                                + (" ('Engine power', con marca y modelo)." if named else " (estándar)."))],
                                          display=(named["values"][0] if named else f"{std['values'][0]} (estándar)")
                                          + (f"; opción {opt['values'][0]}" if opt else ""))

    lay_cabins = B._cabins_from_layouts(ext)
    if lay_cabins:
        disp = " / ".join(map(str, lay_cabins))
        rec = B._text_record(src, "Versions (pestañas de layouts)", "; ".join(l["title"] for l in ext["layouts"]),
                             disp, None, "Versions",
                             "El bloque técnico no publica número de cabinas: se toma de las versiones oficiales.")
        fields["camarotes"] = _field("camarotes", labels["camarotes"], "VERIFIED", [rec], display=disp,
                                     note="según versión" if len(lay_cabins) > 1 else None)
    heads = sorted({int(m) for l in ext["layouts"] for m in re.findall(r"(\d+)\s*heads?", l["title"] or "", re.I)})
    if heads:
        fields["banos"] = _field("banos", labels["banos"], "VERIFIED",
                                 [B._text_record(src, "Versions (pestañas de layouts)",
                                                 "; ".join(l["title"] for l in ext["layouts"]), " / ".join(map(str, heads)),
                                                 None, "Versions", "Número de baños según las versiones oficiales.")],
                                 display=" / ".join(map(str, heads)))
    if ext["credits"]:
        disp = " · ".join(f"{c['label']}: {c['value']}" for c in ext["credits"])
        fields["arquitecto_naval"] = _field("arquitecto_naval", labels["arquitecto_naval"], "VERIFIED",
                                            [B._text_record(src, "Specifications (créditos)", disp, disp, None,
                                                            "Specifications", "Créditos publicados en el bloque técnico.")],
                                            display=disp)

    base = catalog["base_table"][boat]
    crit = [f["key"] for f in catalog["fields"] if f["critical"] and ("universal" in f["types"] or boat in f["types"])]
    reasons = {"camarotes": "La web no publica número de cabinas (ni en el bloque técnico ni en las versiones).",
               "calado": "No publicado en el bloque técnico.",
               "desplazamiento": "No publicado en el bloque técnico."}
    for key in list(dict.fromkeys(base + crit)):
        if key not in fields:
            fields[key] = _field(key, labels[key], "NOT_FOUND", display="-",
                                 notes=reasons.get(key, "No publicado en la web oficial del producto."))
    order = base + [k for k in fields if k not in base]
    return {
        "model": {"brand": "Lagoon", "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "según versiones oficiales (ver 04_EQUIPAMIENTO/configurations.md)",
                  "engine_option": fields.get("motor_auxiliar", {}).get("display_value") or "-",
                  "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial del producto (S1). El bloque 'Specifications' prevalece. Valores métrico e "
                  "imperial del mismo campo que no coinciden → CONFLICT.",
        "fields": [fields[k] for k in order],
    }


CFG["build_specs"] = build_specs


def _with_cfg(fn, *a, **k):
    old = B.CFG
    B.CFG = CFG
    try:
        return fn(*a, **k)
    finally:
        B.CFG = old


def prepare(exts: list[dict]) -> None:
    B._CORPUS.update({"images": {}, "videos": {}, "slugs": {}, "models": set()})
    B.prepare(exts)


def build(slug: str, ext: dict, drafts_dir: Path, force: bool = False) -> Path:
    return _with_cfg(B.build, slug, ext, drafts_dir, force)
