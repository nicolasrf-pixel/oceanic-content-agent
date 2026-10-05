"""Build a full model package from an Excess Catamarans source extract (adapters/excess.py).

Excess belongs to Groupe Beneteau (like Lagoon): the package writer is builders/beneteau.py run with Excess's
settings (CFG). The technical block "THE ESSENTIALS / IN FIGURES" publishes metric | imperial pairs per group
(Sails, Dimensions, Equipment, Hybrid version). Particularities:
- "Length overall" / "Overall length [std.]" → Eslora Total; "Max. length [incl. options]" is noted.
- "Light displacement [EEC]" / "[Mlc]" → Desplazamiento en rosca.
- Tanks published as "2 x 200 L" (two tanks): the total is the published configuration (2 × 200 = 400 L), noted.
- "Upwind sail area" (standard rig) → Superficie vélica; the Pulse Line rig and the Code 0 are noted.
- "Mast clearance [std./Pulse Line]" → Altura sobre flotación (standard rig).
- Cabins: "Cabin 3 to 4" in the block (Excess 13) or the layout titles ("3 CABIN", "4 cabins").
- Hybrid version (Excess 11): engines/generator noted on the engine fields.
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
    "brand": "Excess", "brand_dir": ROOT / "biblioteca" / "excess",
    "site": "excess-catamarans.com", "original_path": "/media/ (originales; copias en /media/cache/<filtro>/)",
    "publisher": "Excess Catamarans (Groupe Beneteau, Burdeos, Francia)", "origin": "Excess Catamarans · Francia",
    "builder": "excess", "adapter": "adapters/excess.py",
    "boat_type": lambda ext: "catamaran_vela",
    "type_label": {"catamaran_vela": "Catamarán a vela"},
    "excluded_sources": [
        {"title": "Testimonios de propietarios (bloque 'Testimonies of passionate owners')", "url": None,
         "reason": "Opiniones de terceros: no aportan datos."},
        {"title": "Configurador Excess", "url": "https://www.excess-catamarans.com/configurator",
         "reason": "Herramienta interactiva con condiciones de uso no contractuales; no se leyó."},
        {"title": "Visita virtual 360° (krpano)", "url": None, "reason": "Contenido interactivo; no aporta datos."},
    ],
    "video_platform": "YouTube (canal EXCESS Catamarans)",
    "manual_doc": {"id": "myexcess", "title": "MyExcess (portal de propietarios)",
                   "source_page": "https://myexcess.excess-catamarans.com/"},
    "manual_note": "Manual del propietario: no publicado en la web del producto; identificar en el portal MyExcess.",
    "equipment_note": "la web del producto no publica lista de equipamiento (el brochure se pide por formulario).",
})

# Literal quotes of the page text for fields the technical block does not publish (the build fails if a quote goes).
TEXT_XREF = {
    "excess-13": {
        "arquitecto_naval": ("Cabinet Lombard (Marc Lombard YDG) · Diseño interior: Jean-Marc Piaton",
                             "With the architectural expertise of Marc Lombard YDG",
                             "el texto atribuye la arquitectura a Marc Lombard YDG (Eric Levet, Cabinet Lombard) y el "
                             "diseño interior a Jean-Marc Piaton."),
    },
    "excess-14": {
        "arquitecto_naval": ("VPLP design", "Thanks to our collaboration with VPLP design",
                             "el texto cita la colaboración con VPLP design para las líneas del barco."),
        "banos": ("4 (versión 4 camarotes)", "4 cabins, 4 bathrooms and 4 separate showers",
                  "la versión de 4 camarotes declara 4 baños; la de 3 camarotes no publica el número."),
    },
}

# label (lowercase, without "*") -> (field, kind)
SPEC_MAP = [
    (r"length overall|overall length( \[std\.\])?", "eslora_total", "m"),
    (r"hull length", "eslora_casco", "m"),
    (r"beam", "manga_casco", "m"),
    (r"draft", "calado", "m"),
    (r"mast clearance.*", "altura_linea_flotacion", "m"),
    (r"light displacement.*", "desplazamiento", "kg"),
    (r"(fresh|standard) water capacity( \[std\.\])?", "capacidad_agua_dulce", "l"),
    (r"black water capacity", "capacidad_aguas_negras", "l"),
    (r"fuel capacity", "capacidad_combustible", "l"),
    (r"(square[ -]?top ?main ?sail).*", "mayor", "m²"),
    (r"overlapping genoa", "genova", "m²"),
    (r"upwind sail area", "superficie_velica", "m²"),
]
XREF = {
    "eslora_total": "'Length overall' / 'Overall length [std.]' = eslora total de la versión estándar.",
    "manga_casco": "'Beam' = manga máxima publicada del catamarán.",
    "desplazamiento": "'Light displacement' (EEC / MLC) = desplazamiento en rosca.",
    "altura_linea_flotacion": "'Mast clearance' = altura del mástil sobre la flotación (aparejo estándar).",
    "superficie_velica": "'Upwind sail area' = superficie vélica de ceñida publicada (aparejo estándar).",
}


def _label(label: str) -> str:
    return re.sub(r"\s+", " ", label.replace("*", "")).strip().lower()


def _area(value: str):
    m = re.search(r"([\d.,]+)\s*m²", value)
    return float(m.group(1).replace(",", ".")) if m else None


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    labels = {f["key"]: f["label"] for f in catalog["fields"]}
    boat = ident["boat_type"]
    rows = ext["specifications"]
    by = {_label(r["label"]): r for r in rows}
    loa = None
    fields: dict[str, dict] = {}

    def rec(row, norm, unit, xref=None):
        r = B._row_record(src, row, norm, unit, xref)
        r["source_value"] = row.get("raw") or r["source_value"]
        r["location"] = row["location"]
        return r

    for lab, row in by.items():
        for pat, key, kind in SPEC_MAP:
            if not re.fullmatch(pat, lab) or key in fields:
                continue
            v0 = row["values"][0]
            if kind == "m²":
                n = _area(v0)
                fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, n, "m²", XREF.get(key))],
                                     display=f"{_fmt(n, 0 if n == int(n) else 1)} m²")
            elif kind == "l" and re.match(r"\s*\d+\s*x\s*\d", v0):
                k, each = (int(x) for x in re.findall(r"\d+", v0)[:2])
                fields[key] = _field(key, labels[key], "VERIFIED",
                                     [rec(row, k * each, "l", f"La web publica {k} depósitos de {each} L ('{v0}'): "
                                                              f"capacidad total {k * each} L.")],
                                     display=f"{k * each} L ({k} x {each} L)")
            else:
                f = B._quantity_field(key, labels[key], {"label": row["label"], "values": row["values"]}, kind, src,
                                      XREF.get(key), loa)
                for r in f["records"]:
                    r["location"] = row["location"]
                fields[key] = f
                if key == "eslora_total" and f["records"]:
                    loa = f["records"][0]["normalized_value"]
            break

    def note(key, text):
        if key in fields:
            fields[key]["notes"] = ((fields[key].get("notes") or "") + " " + text).strip()

    for lab, row in by.items():
        if lab.startswith("max. length"):
            note("eslora_total", f"La web publica además '{row['label']}': {row['raw']}.")
        if lab.startswith("pulse line"):
            note("superficie_velica", f"Aparejo Pulse Line (opcional): {row['raw']}.")
        if lab.startswith("code 0"):
            note("superficie_velica", f"Code 0 (opción): {row['raw']}.")
        if lab.startswith("optional water"):
            note("capacidad_agua_dulce", f"'{row['label']}': {row['raw']} (opcional).")
        if lab.startswith("mast clearance") and "/" in row["raw"]:
            note("altura_linea_flotacion", f"Publicado '{row['raw']}' (estándar / Pulse Line): se toma el estándar.")
        if lab.startswith("light displacement") and "*" in row["label"]:
            note("desplazamiento", "La etiqueta de la web lleva asterisco (nota al pie no publicada en la página).")

    eng = next((r for lab, r in by.items() if re.fullmatch(r"engines?( \[std\.\])?", lab)), None)
    if eng:
        v = eng["values"][0]
        m = re.search(r"(\d+)\s*x\s*(\d+)\s*hp", v, re.I)
        hybrid = [r for r in rows if r.get("group", "").lower().startswith("hybrid")]
        hyb = "; ".join(f"{r['label']}: {r['raw']}" for r in hybrid)
        if m:
            n, hp = int(m.group(1)), int(m.group(2))
            fields["potencia_motor_auxiliar"] = _field(
                "potencia_motor_auxiliar", labels["potencia_motor_auxiliar"], "VERIFIED",
                [rec(eng, n * hp, "hp", f"Motorización publicada '{v}': {n} motores de {hp} hp.")],
                display=f"{n} x {hp} hp", notes=(f"Versión híbrida: {hyb}." if hyb else ""))
        fields["motor_auxiliar"] = _field("motor_auxiliar", labels["motor_auxiliar"], "VERIFIED",
                                          [rec(eng, eng["raw"], None, "Motorización del bloque técnico.")],
                                          display=eng["raw"].replace(" | ", " / ") + (" (estándar)" if "std" in eng["label"] else ""),
                                          notes=(f"Versión híbrida publicada: {hyb}." if hyb else ""))

    ce = next((r for lab, r in by.items() if lab.startswith("ec certification")), None)
    if ce:
        toks = re.findall(r"([A-D])\s*:?\s*(\d+)", ce["raw"])
        disp = " / ".join(f"{a}{n}" for a, n in toks) or ce["raw"]
        fields["certificacion"] = _field("certificacion", labels["certificacion"], "VERIFIED",
                                         [rec(ce, disp, None)], display=disp,
                                         notes="Categoría CE : personas, tal como lo publica la web.")
    if by.get("berths"):
        r = by["berths"]
        nums = re.findall(r"\d+", r["raw"])
        disp = f"{nums[0]} a {nums[1]}" if len(nums) == 2 else r["raw"]
        fields["literas"] = _field("literas", labels["literas"], "VERIFIED", [rec(r, disp, None)], display=disp,
                                   note="según versión")

    cab = by.get("cabin") or by.get("cabins")
    lay = B._cabins_from_layouts(ext)
    if cab:
        nums = re.findall(r"\d+", cab["raw"])
        disp = " / ".join(nums) if len(nums) > 1 else cab["raw"]
        fields["camarotes"] = _field("camarotes", labels["camarotes"], "VERIFIED", [rec(cab, disp, None)],
                                     display=disp, note="según versión" if len(nums) > 1 else None,
                                     notes=f"Layouts publicados: {', '.join(l['title'] for l in ext['layouts'])}.")
    elif lay:
        disp = " / ".join(map(str, lay))
        fields["camarotes"] = _field("camarotes", labels["camarotes"], "VERIFIED",
                                     [B._text_record(src, "Layouts (títulos de los planos)",
                                                     "; ".join(l["title"] for l in ext["layouts"]), disp, None,
                                                     "Layouts", "El bloque técnico no publica número de cabinas: se "
                                                                "toma de los títulos de los planos oficiales.")],
                                     display=disp, note="según versión" if len(lay) > 1 else None)

    text = " ".join([ext["description"]] + [s["intro"] for s in ext["sections"]]
                    + [i["text"] for s in ext["sections"] for i in s["items"]])
    m = re.search(r"designed by (VPLP design)[^.]*\.\s*The exterior design is by (Patrick le Quément)\.\s*And (Nauta Design)",
                  text, re.I)
    if m:
        q = m.group(0)
        disp = f"Arquitectura naval: {m.group(1)} · Diseño exterior: {m.group(2)} · Diseño interior: {m.group(3)}"
        fields["arquitecto_naval"] = _field("arquitecto_naval", labels["arquitecto_naval"], "VERIFIED",
                                            [B._text_record(src, "Texto de la página", q, disp, None,
                                                            "remarkable design (puntos fuertes)",
                                                            "Créditos citados literalmente en el texto de la página.")],
                                            display=disp)

    for key, (disp, quote, why) in TEXT_XREF.get(ident["slug"], {}).items():
        if key in fields:
            continue
        if quote not in text:
            raise SystemExit(f"{ident['slug']}: la cita para '{key}' ya no está en la página: {quote!r}")
        fields[key] = _field(key, labels[key], "VERIFIED",
                             [B._text_record(src, "Texto de la página", quote, disp, None, "Texto de la página",
                                             f"El bloque técnico no publica este campo; {why}")], display=disp)

    base = catalog["base_table"][boat]
    crit = [f["key"] for f in catalog["fields"] if f["critical"] and ("universal" in f["types"] or boat in f["types"])]
    for key in list(dict.fromkeys(base + crit)):
        if key not in fields:
            fields[key] = _field(key, labels[key], "NOT_FOUND", display="-",
                                 notes="No publicado en el bloque técnico ni en el texto de la página del producto.")
    order = base + [k for k in fields if k not in base]
    return {
        "model": {"brand": "Excess", "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "según layouts oficiales (ver 04_EQUIPAMIENTO/configurations.md)",
                  "engine_option": (fields.get("motor_auxiliar") or {}).get("display_value") or "-",
                  "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial del producto (S1). El bloque 'THE ESSENTIALS IN FIGURES' prevalece; si métrico e "
                  "imperial no coinciden se publica el métrico.",
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
