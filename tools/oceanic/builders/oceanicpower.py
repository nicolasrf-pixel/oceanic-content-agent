"""Build Oceanic Power Boats packages (adapters/oceanicpower.py): RIBs (semirrígidos) sold under Oceanic's own brand.

oceanic.cl is the official site of this brand (Oceanic is the brand owner), so its model pages are S1 and the
range page is S2. This is not the Oceanic reference page excluded by rule 1 (oceanicsite.netlify.app).
The "Ficha Técnica" gives, per model: LARGO TOTAL (S/MOTOR) "m / pies", MANGA, PESO KG. (SIN MOTOR), CARGA MÁXIMA,
PASAJEROS, CAPACIDAD COMBUSTIBLE and MOTOR (MÁX- HP). Metric prevails; the imperial figure is noted.
"PESO KG. (SIN MOTOR)" → desplazamiento (as "Weight (excl. Engine)" in the 37 XC). No CE category, fresh water
or cabins are published (open RIBs): NOT_FOUND. The standard equipment list ("Esta embarcación Incluye") goes to
04_EQUIPAMIENTO/standard.md.
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
    "brand": "Oceanic Power", "brand_dir": ROOT / "biblioteca" / "oceanic-power",
    "publisher": "Oceanic (Chile) · marca propia Oceanic Power Boats", "origin": "Oceanic Power Boats · Chile",
    "builder": "oceanicpower", "adapter": "adapters/oceanicpower.py",
    "site": "oceanic.cl", "original_path": "/wp-content/uploads/ (WordPress)",
    "boat_type": lambda ext: "motor",
    "type_label": {"motor": "Semirrígido (RIB)"},
    "excluded_sources": [{"title": "Página Oceanic de referencia (oceanicsite.netlify.app)",
                          "url": "https://oceanicsite.netlify.app/", "reason": "Regla 1: solo estructura."}],
    "video_platform": "-",
    "manual_doc": {"id": "owners", "title": "Documentación de propietario Oceanic Power", "source_page": "https://oceanic.cl/oceanic-power-boats/"},
    "manual_note": "Manual del propietario: no publicado en la web.",
    "equipment_note": "la página del modelo publica la lista 'Esta embarcación Incluye' (equipamiento de serie).",
})

SPEC_MAP = [  # (label regex, field, unit, cross_reference)
    (r"largo total \(s/motor\)", "eslora_total", "m", "'Largo total (s/motor)' = eslora total publicada, sin motor."),
    (r"manga", "manga_casco", "m", None),
    (r"peso kg\.? ?\(sin motor\)", "desplazamiento", "kg",
     "'Peso (sin motor)' = desplazamiento en rosca, como 'Weight (excl. Engine)' en el 37 XC."),
    (r"capacidad combustible", "capacidad_combustible", "l", None),
    (r"pasajeros", "capacidad_pasajeros", None, None),
    (r"motor \(m[aá]x- ?hp\)", "potencia_motor_maxima", "hp", "'Motor (máx-HP)' = potencia máxima admitida."),
]


def _num(v: str):
    m = re.search(r"\d+(?:[.,]\d+)?", v)
    return float(m.group(0).replace(",", ".")) if m else None


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    labels = {f["key"]: f["label"] for f in catalog["fields"]}
    boat = ident["boat_type"]
    fields: dict[str, dict] = {}

    def rec(row, norm, unit, xref=None):
        r = B._row_record(src, row, norm, unit, xref)
        r.update(location=row.get("location"), source_value=row.get("raw"))
        return r

    carga = None
    for row in ext["specifications"]:
        lab = re.sub(r"\s+", " ", row["label"].strip().lower())
        raw = row["raw"]
        if re.fullmatch(r"carga m[aá]xima", lab):
            carga = row
            continue
        for pat, key, unit, xref in SPEC_MAP:
            if not re.fullmatch(pat, lab):
                continue
            n = _num(raw)
            notes = ""
            if unit == "m":
                imp = re.search(r"/\s*([\d.,]+)\s*pies", raw, re.I)
                if imp:
                    ft = float(imp.group(1).replace(",", "."))
                    notes = f"Valor imperial publicado: {imp.group(1)} pies (≈ {_fmt(ft * 0.3048, 2)} m)" + (
                        "; no coincide con el métrico: se publica el métrico (decisión Oceanic)." if abs(ft * 0.3048 - n) > max(0.05 * n, 0.06)
                        else ", coherente.")
            if key == "capacidad_combustible" and re.search(r"integrado", raw, re.I):
                notes = "Tanque de combustible integrado (literal: '" + raw + "')."
            if key == "capacidad_pasajeros":
                disp = str(int(n))
            elif key == "potencia_motor_maxima":
                disp = f"{int(n)} hp"
            else:
                disp = f"{_fmt(n, 0 if n == int(n) else 2)} {unit}"
            fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, n, unit, xref)], display=disp, notes=notes)
            break
    if carga and "capacidad_pasajeros" in fields:
        f = fields["capacidad_pasajeros"]
        f["notes"] = (f["notes"] + f" Carga máxima publicada: {carga['raw']}.").strip()
    if "potencia_motor_maxima" in fields:
        r = fields["potencia_motor_maxima"]["records"][0]
        fields["motorizacion"] = _field("motorizacion", labels["motorizacion"], "VERIFIED",
                                        [dict(r, cross_reference="Fueraborda no incluido: la web publica solo la potencia máxima admitida.")],
                                        display=f"Fueraborda hasta {fields['potencia_motor_maxima']['display_value']} (no incluido en la ficha)")
    base = catalog["base_table"][boat]
    crit = [f["key"] for f in catalog["fields"] if f["critical"] and ("universal" in f["types"] or boat in f["types"])]
    for key in list(dict.fromkeys(base + crit)):
        if key not in fields:
            fields[key] = _field(key, labels[key], "NOT_FOUND", display="-",
                                 notes="No publicado en la ficha técnica ni en la página del modelo.")
    order = base + [k for k in fields if k not in base]
    return {
        "model": {"brand": "Oceanic Power", "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "según ficha técnica", "engine_option": "fueraborda (no incluido)",
                  "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial de la marca (oceanic.cl, S1 página del modelo). Métrico sobre imperial.",
        "fields": [fields[k] for k in order],
    }


def write_equipment(model_dir: Path, ident: dict, ext: dict) -> list[str]:
    items = ext.get("standard_equipment") or []
    if not items:
        return []
    d = model_dir / "04_EQUIPAMIENTO"
    d.mkdir(parents=True, exist_ok=True)
    lines = [f"# Equipamiento STANDARD · {ident['model']}", "",
             "> Fuente: S1 (página del modelo, lista 'Esta embarcación Incluye', literal).", "",
             "| SOURCE CONTENT (literal) |", "| --- |"] + [f"| {i} |" for i in items]
    (d / "standard.md").write_text("\n".join(lines) + "\n")
    return ["standard.md"]


CFG["build_specs"] = build_specs
CFG["write_equipment"] = write_equipment


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
