"""Build the VX One package (adapters/vxone.py): one-design sportboat, a single model on vxone.com.

The web publishes very little: LOA, LWL, beam, upwind sail area (main + jib, as one figure), gennaker, draft
(lifting keel down) and crew weight, each in imperial / metric (metric prevails). The home page repeats the same
block ("THE BOAT", source S3): a different figure there would be noted. No displacement, tanks, CE category or
engine are published: they stay NOT_FOUND (the boat is an open sportboat without cabin or engine; that is not
written on the web, so it is not asserted).
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
    "brand": "VX One", "brand_dir": ROOT / "biblioteca" / "vx-one",
    "publisher": "VX One (web oficial de la clase/marca; construyen Ovington Boats y Mackay Boats)",
    "origin": "VX One · EE. UU. / Reino Unido / Nueva Zelanda",
    "builder": "vxone", "adapter": "adapters/vxone.py",
    "site": "vxone.com", "original_path": "static.wixstatic.com (Wix)",
    "boat_type": lambda ext: "vela",
    "type_label": {"vela": "Velero monocasco (sportboat one-design)"},
    "excluded_sources": [{"title": "VX One Class (vxone.org)", "url": "https://vxone.org/",
                          "reason": "Asociación de clase: calendario y reglas, no es la ficha del fabricante."},
                         {"title": "Testimonios 'What People Are Saying'", "url": None,
                          "reason": "Opiniones de propietarios: no aportan datos."},
                         {"title": "Tienda Streamline Marine", "url": "http://shop.streamlinemarine.com/",
                          "reason": "Tienda de recambios."}],
    "video_platform": "-",
    "manual_doc": {"id": "owners", "title": "Documentación de propietario VX One", "source_page": "https://www.vxone.com/home"},
    "manual_note": "Manual del propietario: no publicado en la web.",
    "equipment_note": "la web publica una lista de características (página Specifications) sin separar estándar/opcional.",
})

SPEC_MAP = [
    (r"loa", "eslora_total", "m", None),
    (r"lwl", None, None, None),
    (r"beam", "manga_casco", "m", None),
    (r"sa main ?\+ ?jib", "superficie_velica", "m²", "'SA Main + Jib' = superficie vélica de ceñida publicada como una sola cifra."),
    (r"draft, keel down", "calado", "m", "'Draft, keel down' = calado con la quilla abajo (quilla elevable)."),
]


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    labels = {f["key"]: f["label"] for f in catalog["fields"]}
    boat = ident["boat_type"]
    fields: dict[str, dict] = {}
    home = {r["label"].lower(): r for a in ext.get("alternates", []) for r in a["specifications"]}

    def rec(row, norm, unit, xref=None):
        r = B._row_record(src, row, norm, unit, xref)
        r["location"] = row.get("location") or r["location"]
        r["source_value"] = row.get("raw") or r["source_value"]
        return r

    for row in ext["specifications"]:
        lab = row["label"].strip().lower()
        for pat, key, unit, xref in SPEC_MAP:
            if not re.fullmatch(pat, lab):
                continue
            if key is None:
                break
            metric = next((v for v in row["values"] if re.search(r"\d\s*(m|m²)$", v)), None)
            if not metric:
                break
            n = float(re.search(r"[\d.]+", metric).group(0))
            notes = f"Valor imperial publicado: {row['values'][0]}."
            h = home.get(lab)
            if h and h.get("raw") != row.get("raw"):
                notes += f" La portada publica '{h.get('raw')}'."
            fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, n, unit, xref)],
                                 display=f"{_fmt(n, 2)} {unit}", notes=notes)
            break
        if lab.startswith("sa gennaker") and "superficie_velica" in fields:
            fields["superficie_velica"]["notes"] += f" Gennaker: {row.get('raw')}."
        if lab.startswith("crew weight"):
            m = re.search(r"\((\d)\s*-\s*(\d) person", row.get("raw", ""))
            if m:
                fields["capacidad_pasajeros"] = _field(
                    "capacidad_pasajeros", labels["capacidad_pasajeros"], "VERIFIED",
                    [rec(row, f"{m.group(1)}-{m.group(2)}", None,
                         "'Crew Weight tolerance ... (2-3 person)' = tripulación prevista.")],
                    display=f"{m.group(1)}–{m.group(2)} (tripulación)", notes=f"Literal: '{row.get('raw')}'.")

    base = catalog["base_table"][boat]
    crit = [f["key"] for f in catalog["fields"] if f["critical"] and ("universal" in f["types"] or boat in f["types"])]
    for key in list(dict.fromkeys(base + crit)):
        if key not in fields:
            fields[key] = _field(key, labels[key], "NOT_FOUND", display="-",
                                 notes="No publicado en la web oficial (portada ni página Specifications).")
    order = base + [k for k in fields if k not in base]
    return {
        "model": {"brand": "VX One", "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "one-design", "engine_option": "-", "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial (S1 Specifications, S3 portada). Métrico sobre imperial.",
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
