"""Build a full model package from a Saffier Yachts source extract (adapters/saffier.py).

Saffier (Netherlands, daysailers and cruisers) publishes a complete, consistent specifications block per model,
in metric. Particularities:
- "L.O.A. (with bowsprit)" → Eslora Total; "Length (without bowsprit)" → Eslora Casco (the length the web
  shows on its model cards).
- Several keels: the standard keel gives Calado and Lastre; the other keels are noted.
- The web publishes mainsail and jib areas but no total sail area: Superficie vélica stays "-" (no sums).
- "Air draft" → Altura sobre línea de flotación.
- Engines: standard (sometimes two choices, diesel or electric) and optional; power in HP or kW (kW is
  converted to hp for the max, the literal is kept).
- Cabins / heads come from "Accomodations"; when missing, from literal quotes of the page text (TEXT_XREF).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from . import beneteau as B
from .axopar import _field, _fmt

ROOT = B.ROOT
MODEL_YEAR = B.MODEL_YEAR
KW_TO_HP = 1.34102

CFG = dict(B.CFG)
CFG.update({
    "brand": "Saffier", "brand_dir": ROOT / "biblioteca" / "saffier",
    "publisher": "Saffier Yachts B.V. (IJmuiden, Países Bajos)", "origin": "Saffier Yachts · Países Bajos",
    "builder": "saffier", "adapter": "adapters/saffier.py",
    "site": "saffieryachts.com", "original_path": "/wp-content/uploads/ (WordPress)",
    "boat_type": lambda ext: "vela",
    "type_label": {"vela": "Velero monocasco (daysailer / crucero)"},
    "excluded_sources": [{"title": "Reseñas de revistas enlazadas en la página (TYD, YACHT...)", "url": None,
                          "reason": "Contenido de terceros: no aporta datos."},
                         {"title": "Configurador Saffier", "url": "https://saffieryachts.com/configure/",
                          "reason": "Herramienta comercial; no es la ficha del producto."}],
    "video_platform": "YouTube",
    "manual_doc": {"id": "owners", "title": "Documentación de propietario Saffier", "source_page": "https://saffieryachts.com/"},
    "manual_note": "Manual del propietario: no publicado en la web del producto.",
    "equipment_note": "la web no publica listas de equipamiento estándar/opcional en la página del producto "
                      "(el configurador es una herramienta comercial).",
})

TEXT_XREF = {
    "saffier-se-28-leopard": {
        "banos": ("1", 1, "plus a practical toilet", "El texto describe un aseo bajo cubierta."),
    },
}

SIMPLE = [  # (label regex, field, kind)
    (r"l\.o\.a\. \(with bowsprit\)", "eslora_total", "m",
     "'L.O.A. (with bowsprit)' = eslora total (incluye el bauprés)."),
    (r"length \(without bowsprit\)", "eslora_casco", "m", "'Length (without bowsprit)' = eslora sin bauprés."),
    (r"beam", "manga_casco", "m", None),
    (r"displacement", "desplazamiento", "kg", "'Displacement' = desplazamiento publicado."),
    (r"fuel tank", "capacidad_combustible", "l", None),
    (r"fresh water tank", "capacidad_agua_dulce", "l", None),
    (r"black water tank", "capacidad_aguas_negras", "l", None),
    (r"mainsail area", "mayor", "m²", None),
    (r"air draft", "altura_linea_flotacion", "m", "'Air draft' = altura sobre la línea de flotación."),
]


def _n(v: str):
    m = re.search(r"\d+(?:[.,]\d+)?", v)
    return float(m.group(0).replace(",", ".")) if m else None


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    labels = {f["key"]: f["label"] for f in catalog["fields"]}
    boat = ident["boat_type"]
    fields: dict[str, dict] = {}
    rows = ext["specifications"]
    by = {}
    for r in rows:
        by.setdefault(r["label"].strip().lower(), []).append(r)

    def rec(row, norm, unit, xref=None):
        r = B._row_record(src, row, norm, unit, xref)
        r["location"] = row.get("location") or r["location"]
        return r

    for pat, key, unit, xref in SIMPLE:
        row = next((r for lab, rs in by.items() if re.fullmatch(pat, lab) for r in rs), None)
        if row and _n(row["values"][0]) is not None:
            n = _n(row["values"][0])
            fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, n, unit, xref)],
                                 display=f"{_fmt(n, 0 if n == int(n) else 2)} {unit}")

    for prefix, key, unit in (("draft", "calado", "m"), ("ballast", "lastre", "kg")):
        keels = [r for lab, rs in by.items() if lab.startswith(prefix) for r in rs]
        if keels:
            std = next((r for r in keels if "standard" in r["label"].lower()), keels[0])
            n = _n(std["values"][0])
            others = [f"{r['label']}: {r['values'][0]}" for r in keels if r is not std]
            fields[key] = _field(key, labels[key], "VERIFIED",
                                 [rec(std, n, unit, f"'{std['label']}': quilla estándar." if len(keels) > 1 else None)],
                                 display=f"{_fmt(n, 0 if n == int(n) else 2)} {unit}",
                                 note="quilla estándar" if len(keels) > 1 else None,
                                 notes=("Otras quillas publicadas: " + "; ".join(others) + ".") if others else "")

    jib = by.get("self-tacking jib area", []) or by.get("110% jib area", [])
    if jib:
        n = _n(jib[0]["values"][0])
        alt = by.get("110% jib area") if jib is by.get("self-tacking jib area") else None
        fields["genova"] = _field("genova", labels["genova"], "VERIFIED",
                                  [rec(jib[0], n, "m²", f"'{jib[0]['label']}': vela de proa estándar.")],
                                  display=f"{_fmt(n, 0)} m²" + (" (foque autovirante)" if "self" in jib[0]["label"].lower() else ""),
                                  notes=f"La web publica también '110% Jib area': {alt[0]['values'][0]}." if alt else "")
    fields["superficie_velica"] = _field(
        "superficie_velica", labels["superficie_velica"], "NOT_FOUND", display="-",
        notes="La web publica las superficies de mayor y foque por separado, sin total: no se suman (sin cálculos).")

    ce = by.get("ce-category")
    if ce:
        v = ce[0]["values"][0]
        cats = re.findall(r"\b([A-D])\b", v)
        fields["certificacion"] = _field("certificacion", labels["certificacion"], "VERIFIED", [rec(ce[0], v, None)],
                                         display=" / ".join(cats) or v,
                                         notes=(f"La web publica '{v}' (dos categorías, sin indicar a qué versión "
                                                "corresponde cada una) y no publica número de personas.")
                                         if len(cats) > 1 else "La web no publica número de personas.")
    for lab, key in (("design", "arquitecto_naval"), ("hull material", "construccion")):
        if by.get(lab):
            r = by[lab][0]
            fields[key] = _field(key, labels[key], "VERIFIED", [rec(r, r["values"][0], None)],
                                 display=r["values"][0].replace(" | ", " / "))

    # Engines: "Engine (Std.)" / "Engine (Opt.)" names and "Engine power (Std./Opt.)" rows (HP or kW).
    powers = []
    for lab, rs in by.items():
        if lab.startswith("engine power"):
            for r in rs:
                v = r["values"][0]
                n = _n(v)
                if n is not None:
                    powers.append((n * KW_TO_HP if re.search(r"kw", v, re.I) else n, r))
    names = [r["values"][0].replace(" | ", " o ") + (" (opcional)" if "opt" in r["label"].lower() else "")
             for lab, rs in by.items() if re.fullmatch(r"engine \((std|opt)\.\)", lab) for r in rs]
    pw_lit = [r["values"][0] + (" (opc.)" if "opt" in r["label"].lower() else "") for _, r in powers]
    if names or powers:
        first = next((r for lab, rs in by.items() if lab.startswith("engine") for r in rs))
        fields["motor_auxiliar"] = _field("motor_auxiliar", labels["motor_auxiliar"], "VERIFIED",
                                          [rec(first, "; ".join(names), None)],
                                          display="; ".join(names) + (f" — {' / '.join(pw_lit)}" if pw_lit else ""))
    if powers:
        top, r = max(powers, key=lambda p: p[0])
        kw = re.search(r"kw", r["values"][0], re.I)
        fields["potencia_motor_auxiliar"] = _field(
            "potencia_motor_auxiliar", labels["potencia_motor_auxiliar"], "VERIFIED",
            [rec(r, round(top, 1), "hp", "La mayor potencia publicada (estándar u opcional)"
                 + (f"; {r['values'][0]} convertido a hp (1 kW = 1,341 hp)." if kw else "."))],
            display=(f"{r['values'][0].replace('kW', 'kW')} (≈ {_fmt(top, 1)} hp)" if kw else f"{_fmt(top, 0)} hp"))

    for lab, key in (("cabin(s)", "camarotes"), ("berth(s)", "literas"), ("toilet(s)", "banos")):
        if by.get(lab):
            r = by[lab][0]
            v = r["values"][0]
            disp = re.sub(r"\s*\|\s*", " / ", v).replace("(opt.)", "(opcional)")
            fields[key] = _field(key, labels[key], "VERIFIED", [rec(r, _n(v), None)], display=disp)

    text = "\n".join([ext["description"]] + [x["intro"] for x in ext["sections"]])
    for key, (disp, norm, quote, why) in TEXT_XREF.get(ident["slug"], {}).items():
        if key in fields:
            continue
        if quote not in text:
            raise SystemExit(f"{ident['slug']}: la cita para '{key}' ya no está en la página: {quote!r}")
        fields[key] = _field(key, labels[key], "VERIFIED",
                             [B._text_record(src, "Texto de la página", quote, norm, None, "Texto de la página",
                                             f"La ficha técnica no publica este campo; {why}")], display=disp)

    base = catalog["base_table"][boat]
    crit = [f["key"] for f in catalog["fields"] if f["critical"] and ("universal" in f["types"] or boat in f["types"])]
    for key in list(dict.fromkeys(base + crit)):
        if key not in fields:
            fields[key] = _field(key, labels[key], "NOT_FOUND", display="-",
                                 notes="No publicado en la ficha técnica ni en el texto de la página del producto.")
    order = base + [k for k in fields if k not in base]
    return {
        "model": {"brand": "Saffier", "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "según ficha técnica",
                  "engine_option": (fields.get("motor_auxiliar") or {}).get("display_value") or "-",
                  "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial del producto (S1). La ficha técnica prevalece.",
        "fields": [fields[k] for k in order],
    }


def scope_hint(im: dict, ident: dict, ext: dict):
    """File names name the model ('Saffier-SE-33-Life-...', 'SE33Life'): another model → OTHER_MODEL."""
    f = re.sub(r"[-_ ]", "", im["file_name"].lower())
    m = re.search(r"(sc|se|sl)(\d[\d.]*m?)", f)
    own = re.sub(r"[-_ ]", "", ident["slug"].replace("saffier-", ""))
    own_m = re.match(r"(sc|se|sl)(\d[\d]*m?)", own)
    if m and own_m and (m.group(1), m.group(2).replace(".", "")[:2]) != (own_m.group(1), own_m.group(2)[:2]):
        return "OTHER_MODEL", f"El nombre de archivo '{im['file_name']}' nombra otro modelo Saffier ({m.group(1).upper()} {m.group(2)})."
    return None


CFG["build_specs"] = build_specs
CFG["scope_hint"] = scope_hint


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
