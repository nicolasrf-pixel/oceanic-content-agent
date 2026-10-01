"""Build a full model package from a Solaris Yachts source extract (adapters/solaris.py).

Solaris (Italy, sailing yachts only: solarisyachts.com) publishes one "Technical specifications" grid per
model, written by hand: units before or after the number ("M 12.36", "13,35 m"), thousands with a dot or a comma
("Kg 9.850", "9,400 kg") and typos ("M 22.OO"). Parsing rules here:
- kg: a dot or comma followed by exactly three digits is a thousands separator; otherwise comma = decimal.
- A value that cannot be the field for the boat's size (displacement of 46 kg on a 24 m yacht) → REQUIRES_REVIEW.
- A sail-plan value identical to another model's of a different size (111 RS repeating the 80 RS rig) →
  REQUIRES_REVIEW: probably copied on the web.
- Engine rows list standard and optional power ("Hp 30 - 50 - 60", "Yanmar 110 hp (optional 150 hp)"): the
  highest is the max auxiliary power.
- Cabins / heads are not in the grid: cross-referenced with literal quotes of the page text (TEXT_XREF), and the
  build fails if a quote is no longer on the page.
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
    "brand": "Solaris", "brand_dir": ROOT / "biblioteca" / "solaris",
    "publisher": "Solaris Yachts Srl (Aquileia, Italia)", "origin": "Solaris Yachts · Italia",
    "builder": "solaris", "adapter": "adapters/solaris.py",
    "site": "solarisyachts.com", "original_path": "/cms/wp-content/uploads/ (WordPress)",
    "boat_type": lambda ext: "vela",
    "type_label": {"vela": "Velero monocasco"},
    "excluded_sources": [{"title": "Solaris Power (solarispower.com)", "url": "https://www.solarispower.com/",
                          "reason": "Gama a motor de la marca: fuera del alcance de Oceanic (decisión 2026-10-01)."},
                         {"title": "Brokerage / Solaris Certified", "url": "https://www.solarisyachts.com/en/yachts/",
                          "reason": "Barcos de ocasión: no es la ficha del modelo nuevo."}],
    "video_platform": "Vimeo",
    "manual_doc": {"id": "owners", "title": "Documentación de propietario Solaris", "source_page": "https://www.solarisyachts.com/en/"},
    "manual_note": "Manual del propietario: no publicado en la web del producto.",
    "equipment_note": "la web no publica listas de equipamiento; la ficha técnica completa se envía por correo "
                      "(formulario 'Request the brochure').",
})

# Literal quotes of the page text that cross-reference cabins and heads (rule 2).
TEXT_XREF = {
    "solaris-40": {
        "camarotes": ("3", 3, "3 cabins and 2 bathrooms", "El texto describe la distribución interior."),
        "banos": ("2", 2, "3 cabins and 2 bathrooms", "El texto describe la distribución interior."),
    },
    "solaris-44": {
        "camarotes": ("3", 3, "the accommodation comprises three cabins and two bathrooms", "El texto describe la distribución."),
        "banos": ("2", 2, "the accommodation comprises three cabins and two bathrooms", "El texto describe la distribución."),
    },
    "solaris-55": {
        "camarotes": ("3 (+1 tripulación opcional)", 3, "The two aft cabins have their own bathroom with a separate shower",
                      "Suite del armador a proa ('spacious forward owners suite') + dos camarotes de popa; el pañol de "
                      "velas puede convertirse en camarote de tripulación ('can be converted into a crew cabin')."),
    },
    "solaris-60": {
        "camarotes": ("3 + 1 tripulación", 3, "for the first time two aft cabins with single or double beds",
                      "Camarote del armador a proa + dos camarotes de popa + camarote de tripulación a proa "
                      "('crew cabin too, situated in the bow')."),
    },
    "solaris-64-rs": {
        "camarotes": ("3 (+1 tripulación opcional)", 3, "the two guest cabins have nothing to envy to the owner’s cabin forward",
                      "Camarote del armador + dos de invitados; el pañol de proa puede ser camarote de tripulación "
                      "opcional ('optional ensuite crew cabin')."),
    },
    "solaris-74-rs": {
        "camarotes": ("3 / 4 + tripulación", 3, "for 3 or 4 double cabins plus the crew cabin with separate bathroom",
                      "Tres distribuciones: 3 o 4 camarotes dobles más el de tripulación."),
    },
    "solaris-80-rs": {
        "camarotes": ("4 + patrón y tripulación", 4, "the boat will be laid out with 4 double cabins",
                      "4 camarotes dobles con baño, más camarotes de patrón y tripulación."),
        "banos": ("4 + patrón y tripulación", 4, "each with its own en-suite bathroom and shower",
                  "Cada camarote doble con baño en suite; patrón y tripulación con baño propio."),
    },
}

SPEC_MAP = [  # (pattern on the lowercased label, field, kind)
    (r"loa", "eslora_total", "m"),
    (r"lwl", None, "m"),
    (r"beam", "manga_casco", "m"),
    (r"draft", "calado", "m"),
    (r"displacement", "desplazamiento", "kg"),
    (r"ballast", "lastre", "kg"),
    (r"sail ?area|sailplan", "superficie_velica", "m2"),
    (r"mainsail", "mayor", "m2"),
    (r"genoa.*", "genova", "m2"),
    (r"(water tank|water)", "capacidad_agua_dulce", "l"),
    (r"(fuel tank|fuel)", "capacidad_combustible", "l"),
    (r"ce (certification|rina)", "certificacion", None),
    (r"engine", "motor_auxiliar", None),
]


def _num(value: str, kind: str):
    """First number of a hand-written value, in the unit of the field."""
    v = re.sub(r"(?<=[\d.,])O|O(?=\d)", "0", value)          # "22.OO" -> "22.00"
    v = re.sub(r"\bm2\b|\bmq\b", " ", v, flags=re.I)              # unit "M2 100" must not read as 2
    m = re.search(r"\d+(?:[.,]\d+)?", v)
    if not m:
        return None
    tok = m.group(0)
    if kind == "kg" and re.fullmatch(r"\d{1,3}[.,]\d{3}", tok):
        return float(tok.replace(".", "").replace(",", ""))
    return float(tok.replace(",", "."))


def _unit(kind: str) -> str:
    return {"m": "m", "kg": "kg", "l": "l", "m2": "m²"}[kind]


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    labels = {f["key"]: f["label"] for f in catalog["fields"]}
    boat = ident["boat_type"]
    fields: dict[str, dict] = {}

    def rec(row, norm, unit, xref=None):
        r = B._row_record(src, row, norm, unit, xref)
        r["location"] = row.get("location") or r["location"]
        return r

    loa = None
    for row in ext["specifications"]:
        lab, raw = row["label"].strip().lower(), row["values"][0]
        for pat, key, kind in SPEC_MAP:
            if not re.fullmatch(pat, lab):
                continue
            if key is None or key in fields:
                break
            notes = []
            if re.search(r"(?<=[\d.,])O|O(?=\d)", raw):
                notes.append(f"La web publica '{raw}' (letra O en lugar de cero).")
            if kind:
                n = _num(raw, kind)
                if n is None:
                    break
                status = "VERIFIED"
                disp = f"{_fmt(n, 0 if n == int(n) else 2)} {_unit(kind)}"
                if kind == "kg" and loa and n < 100 * loa:
                    status = "REQUIRES_REVIEW"
                    notes.append(f"La web publica '{raw}': {_fmt(n, 1)} kg no es plausible para una eslora de "
                                 f"{_fmt(loa, 2)} m (¿toneladas?). No se convierte.")
                if re.search(r"\bopt|optional|opz", raw, re.I):
                    notes.append(f"Valor literal con opciones: '{raw}'.")
                    disp += " (std.)" if key == "calado" else ""
                if re.search(r"light", raw, re.I):
                    notes.append("La web lo declara 'light' (en rosca).")
                if key == "superficie_velica" and re.search(r"opt", raw, re.I):
                    disp += " (opcional)"
                if key in ("mayor", "genova"):
                    rows = _SPECS.get(ident["slug"], {})
                    total = next((_num(v, "m2") for k, v in rows.items() if re.fullmatch(r"sail ?area|sailplan", k)), None)
                    parts = [_num(v, "m2") for k, v in rows.items() if re.fullmatch(r"mainsail|genoa.*", k)]
                    twins = [s for s, r in _SPECS.items() if s != ident["slug"] and r.get(lab) == raw]
                    if total and len(parts) == 2 and abs(sum(parts) - total) > 0.25 * total:
                        status = "REQUIRES_REVIEW"
                        notes.append(f"Mayor + génova ({_fmt(sum(parts), 0)} m²) no cuadra con la superficie vélica "
                                     f"publicada ({_fmt(total, 0)} m²)"
                                     + (f"; el valor es idéntico al de {', '.join(twins)}: probablemente copiado en la web."
                                        if twins else "."))
                xref = {"desplazamiento": "'Displacement' = desplazamiento publicado (en rosca si dice 'light')."}.get(key)
                fields[key] = _field(key, labels[key], status, [rec(row, n, _unit(kind), xref)], display=disp,
                                     notes=" ".join(notes))
                if key == "eslora_total":
                    loa = n
            elif key == "certificacion":
                cat = re.search(r"(?:category\s*|rina\s*|^)([A-D])\b", raw.strip(), re.I)
                if cat:
                    disp = cat.group(1).upper() + (" (RINA)" if re.search("rina", raw + lab, re.I) else "")
                    fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, cat.group(1).upper(), None)],
                                         display=disp, notes=f"Literal: '{raw}'. La web no publica número de personas.")
                else:
                    fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, raw.upper(), None)],
                                         display=raw.upper(),
                                         notes=f"La web publica '{raw}' (sociedad de clasificación) sin categoría CE.")
            elif key == "motor_auxiliar":
                hp = [int(x) for x in re.findall(r"(\d{2,3})\s*(?:hp|HP)|(?:hp|Hp|HP)\s*(?:V\.P\.\s*)?(\d{2,3})", raw)
                      for x in x if x]
                hp += [int(x) for x in re.findall(r"\b(\d{2,3})\b", re.sub(r"D2|S/SR", "", raw))
                       if re.search(r"hp", raw, re.I)]
                fields["motor_auxiliar"] = _field("motor_auxiliar", labels["motor_auxiliar"], "VERIFIED",
                                                  [rec(row, raw, None)], display=raw)
                if hp:
                    top = max(hp)
                    fields["potencia_motor_auxiliar"] = _field(
                        "potencia_motor_auxiliar", labels["potencia_motor_auxiliar"], "VERIFIED",
                        [rec(row, top, "hp", "La fila de motor publica la potencia estándar y las opciones: se toma "
                                             "la mayor.")], display=f"{top} hp")
            break

    # Key-data strip at the top of the page: same data, noted only if it differs (rule 3).
    for kd in ext.get("key_data", []):
        lab = kd["label"].strip().lower()
        row = next((r for r in ext["specifications"] if r["label"].strip().lower() == lab), None)
        if row and row["values"][0] != kd["value"]:
            key = next((k for p, k, _ in SPEC_MAP if re.fullmatch(p, lab)), None)
            if key in fields:
                fields[key]["notes"] = (fields[key]["notes"] + f" Cabecera de la página: '{kd['value']}'.").strip()

    design = next((c for c in ext["credits"] if c["label"].lower() == "design"), None)
    if design:
        fields["arquitecto_naval"] = _field("arquitecto_naval", labels["arquitecto_naval"], "VERIFIED",
                                            [B._text_record(src, "Credits · Design", design["value"], design["value"],
                                                            None, "Credits", "Diseñador del barco publicado en los créditos.")],
                                            display=design["value"])

    text = "\n".join([ext["description"]] + [x["intro"] for x in ext["sections"]])
    for key, (disp, norm, quote, why) in TEXT_XREF.get(ident["slug"], {}).items():
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
        "model": {"brand": "Solaris", "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "según ficha técnica",
                  "engine_option": (fields.get("motor_auxiliar") or {}).get("display_value") or "-",
                  "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial del producto (S1). La ficha técnica prevalece.",
        "fields": [fields[k] for k in order],
    }


_SPECS: dict[str, dict] = {}


def _size(slug: str) -> str:
    m = re.search(r"\d+", slug)
    return m.group(0) if m else slug


def scope_hint(im: dict, ident: dict, ext: dict):
    """File names often carry the model ('40-PIANTA', 'S80RS_3', 'solaris40-segeln'): another model → OTHER_MODEL."""
    m = re.match(r"(?:solaris[-_ ]?|s)?(\d{2,3})(?:[-_ ]?(rs|st))?(?=[-_ .]|$)", im["file_name"].lower())
    if not m:
        return None
    size, var = m.group(1), m.group(2)
    own = ident["tokens"]
    own_var = "rs" if "rs" in ident["slug"].split("-") else "st" if "st" in ident["slug"].split("-") else None
    if size != own["size"] or (var and var != own_var):
        known = any(_size(s) == size for s in _SPECS)
        if known:
            return "OTHER_MODEL", f"El nombre de archivo '{im['file_name']}' nombra otro modelo Solaris ({size}{(' ' + var.upper()) if var else ''})."
    return None


CFG["build_specs"] = build_specs
CFG["scope_hint"] = scope_hint


def _sister(slug: str, own: dict) -> bool:
    """Same size is not enough: a Raised Saloon (RS) and a Flush Deck model of the same length are different yachts."""
    t = B._model_tokens(B._CORPUS["slugs"].get(slug, slug))
    return _ORIG_SISTER(slug, own) and ("rs" in t["variants"]) == ("rs" in own["variants"])


_ORIG_SISTER = B._sister


def _with_cfg(fn, *a, **k):
    old, old_sister = B.CFG, B._sister
    B.CFG, B._sister = CFG, _sister
    try:
        return fn(*a, **k)
    finally:
        B.CFG, B._sister = old, old_sister


def prepare(exts: list[dict]) -> None:
    B._CORPUS.update({"images": {}, "videos": {}, "slugs": {}, "models": set()})
    B.prepare(exts)
    _SPECS.clear()
    for e in exts:
        _SPECS[B.model_slug(e)] = {r["label"].strip().lower(): r["values"][0] for r in e["specifications"]}


def build(slug: str, ext: dict, drafts_dir: Path, force: bool = False) -> Path:
    return _with_cfg(B.build, slug, ext, drafts_dir, force)
