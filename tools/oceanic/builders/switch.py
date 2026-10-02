"""Build the Switch One Design package (adapters/switch.py): a single foiling one-design dinghy, three rigs.

Published figures (Home "THE BOAT" block, repeated on Technology): sail area "6.5-7.5-8.4 sqm" (one per rig),
length 3.9 m, width 2.25 m, platform weight ~25 kg, upwind > 19 kts, downwind > 30 kts, take-off ~6 kts,
materials carbon fiber - epoxy. The rigs are configurations of the same platform, not separate models.
The text and the rig names say "8.5": the technical block (8.4 m²) prevails and the 8.5 is noted (rule 3).
No tanks, CE category, engine or cabins are published: NOT_FOUND (RED honesto).
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
    "brand": "Switch", "brand_dir": ROOT / "biblioteca" / "switch",
    "publisher": "Switch One Design (ElementSIX Evolution, Italia)", "origin": "Switch One Design · Italia",
    "builder": "switch", "adapter": "adapters/switch.py",
    "site": "switchonedesign.com", "original_path": "static.wixstatic.com (Wix)",
    "boat_type": lambda ext: "vela",
    "type_label": {"vela": "Foiler one-design (dinghy de carbono)"},
    "excluded_sources": [{"title": "Switch Class (theswitchclass.com)", "url": "https://www.theswitchclass.com/",
                          "reason": "Asociación de clase: reglas y eventos, no es la web del fabricante."},
                         {"title": "Prensa náutica (Giornale della Vela) y distribuidores (Negrinautica)", "url": None,
                          "reason": "Terceros: no aportan datos (p. ej. la prensa cita 29 kg frente a los ~25 kg oficiales)."}],
    "video_platform": "-",
    "manual_doc": {"id": "owners", "title": "Documentación de propietario Switch", "source_page": "https://www.switchonedesign.com/"},
    "manual_note": "Manual del propietario: no publicado en la web.",
    "equipment_note": "la web describe construcción y equipamiento (Technology, Switch is Smart) sin separar estándar/opcional; "
                      "la caja de transporte de aluminio se indica como extra.",
})


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    labels = {f["key"]: f["label"] for f in catalog["fields"]}
    boat = ident["boat_type"]
    fields: dict[str, dict] = {}
    rows = {r["label"].lower(): r for r in ext["specifications"]}
    tech = {r["label"].lower(): r for a in ext.get("alternates", []) for r in a["specifications"]}

    def rec(row, norm, unit, xref=None):
        r = B._row_record(src, row, norm, unit, xref)
        r["location"] = row.get("location") or r["location"]
        r["source_value"] = row.get("raw") or r["source_value"]
        return r

    def note_tech(lab):
        h = tech.get(lab)
        if not h:
            return ""
        same = re.sub(r"\s", "", h["raw"]).lower() == re.sub(r"\s", "", rows[lab]["raw"]).lower()
        return " La página Technology publica el mismo valor." if same else f" La página Technology publica '{h['raw']}'."

    def num(v):
        m = re.search(r"\d+(?:[.,]\d+)?", v)
        return float(m.group(0).replace(",", ".")) if m else None

    for lab, key, unit, xref in (("length", "eslora_total", "m", "'Length' = eslora total publicada."),
                                 ("width", "manga_casco", "m", "'Width' = anchura total publicada (con las alas)."),
                                 ("platform weight", "desplazamiento", "kg",
                                  "'Platform Weight' = peso de la plataforma publicado (sin aparejo); es el único peso de la web.")):
        r = rows.get(lab)
        if r:
            n = num(r["raw"])
            approx = "~" in r["raw"]
            fields[key] = _field(key, labels[key], "VERIFIED", [rec(r, n, unit, xref)],
                                 display=f"{_fmt(n, 0 if n == int(n) else 2)} {unit}" + (" (aprox.)" if approx else ""),
                                 notes=(("La web lo declara aproximado ('~'). " if approx else "") + note_tech(lab)).strip())
    r = rows.get("sail area")
    if r:
        areas = [float(x) for x in re.findall(r"\d+(?:\.\d+)?", r["raw"])]
        text = "\n".join(s["intro"] for s in ext["sections"])
        alt = re.search(r"switch from the 6\.5m sail to the 7\.5 or 8\.5m", text)
        fields["superficie_velica"] = _field(
            "superficie_velica", labels["superficie_velica"], "VERIFIED",
            [rec(r, " / ".join(_fmt(a, 1) for a in areas), "m²", "Una superficie por aparejo (6.5 / 7.5 / 8.5).")],
            display=" / ".join(_fmt(a, 1) for a in areas) + " m² (según aparejo)",
            notes=("El bloque técnico publica '6.5-7.5-8.4 sqm' (prevalece). " if areas[-1] == 8.4 else "")
                  + ("El texto y los nombres de aparejo dicen '8.5' ('switch from the 6.5m sail to the 7.5 or 8.5m', "
                     "'SWITCH 8.5'): mención anotada, no se publica (regla 3). " if alt else "")
                  + "Vela: One Design Quantum Membrane Sail." + note_tech("sail area"))
    r = rows.get("downwind speed")
    if r:
        up = rows.get("upwind speed")
        fields["velocidad_maxima"] = _field(
            "velocidad_maxima", labels["velocidad_maxima"], "VERIFIED", [rec(r, num(r["raw"]), "nudos")],
            display=f"> {_fmt(num(r['raw']), 0)} nudos (en popa)",
            notes=(f"Ceñida: {up['raw']}. " if up else "")
                  + (f"Despega con ~{_fmt(num(rows['takeoff wind speed']['raw']), 0)} nudos de viento. "
                     if rows.get("takeoff wind speed") else ""))
    r = rows.get("materials")
    src3 = None
    if not r and tech.get("materials"):  # only on the Technology page: record attributed to S3
        r = tech["materials"]
        alt = ext["alternates"][0]
        src3 = {"title": alt["page_title"], "url": alt["source_url"], "accessed_at": alt["accessed_at"]}
    if r:
        cr = B._row_record(src3 or src, r, r["raw"], None, "Materiales publicados en el bloque técnico.")
        cr.update(location=r.get("location"), source_value=r["raw"], source_id="S3" if src3 else "S1")
        fields["construccion"] = _field("construccion", labels["construccion"], "VERIFIED",
                                        [cr], display="Fibra de carbono - epoxi",
                                        notes=f"Literal: '{r['raw']}'. Casco de laminado carbono-epoxi con núcleo de PVC (página Technology).")

    base = catalog["base_table"][boat]
    crit = [f["key"] for f in catalog["fields"] if f["critical"] and ("universal" in f["types"] or boat in f["types"])]
    for key in list(dict.fromkeys(base + crit)):
        if key not in fields:
            fields[key] = _field(key, labels[key], "NOT_FOUND", display="-",
                                 notes="No publicado en la web oficial (Home, Technology, Formula Switch, Switch is Smart).")
    order = base + [k for k in fields if k not in base]
    return {
        "model": {"brand": "Switch", "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "una plataforma, 3 aparejos (6.5 / 7.5 / 8.5)", "engine_option": "-",
                  "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial (S1 Home, S3 Technology). El bloque técnico prevalece.",
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
