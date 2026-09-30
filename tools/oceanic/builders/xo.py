"""Build a full model package from an XO Boats source extract (adapters/xo.py).

XO Boats (Finland) publishes each model as a WooCommerce product: one attributes table (the technical sheet)
plus text blocks. The package writer is builders/beneteau.py run with XO's settings (CFG), as for Lagoon and
Aquila. Particularities of xoboats.com:
- "Overall Lenght (exc. engine)" → Eslora Total; "Weight (excl. engine)" → Desplazamiento en rosca.
- "Classification" + "Passengers" → Certificación (positional: "B/C" + "8/6" → B8 / C6).
- Some values come without unit ("Fuel capacity 450", "Inboard engine 370"): the unit the rest of the range
  publishes for that row (l, hp) is applied and the missing unit is written in the notes.
- Cabins and heads are not in the table: they are cross-referenced with literal quotes of the page text
  (TEXT_XREF), and the build fails if a quote is no longer on the page.
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
    "brand": "XO", "brand_dir": ROOT / "biblioteca" / "xo",
    "publisher": "XO Boats Oy (Helsinki, Finlandia)", "origin": "XO Boats · Finlandia",
    "builder": "xo", "adapter": "adapters/xo.py",
    "site": "xoboats.com", "original_path": "/wp-content/uploads/ (WordPress)",
    "boat_type": lambda ext: "motor",
    "type_label": {"motor": "Motor (aluminio, casco en V profunda)"},
    "excluded_sources": [{"title": "Reseñas de prensa enlazadas en la página (MBY, Venelehti)", "url": None,
                          "reason": "Contenido de terceros: no aporta datos."},
                         {"title": "Configurador XO", "url": "https://xoboats.com/configurator/",
                          "reason": "Herramienta comercial; no es la ficha del producto."}],
    "video_platform": "YouTube",
    "manual_doc": {"id": "owners", "title": "Documentación de propietario XO", "source_page": "https://xoboats.com/"},
    "manual_note": "Manual del propietario: no publicado en la web del producto.",
    "equipment_note": "la web no publica listas de equipamiento estándar/opcional en la página del producto "
                      "(el configurador es una herramienta comercial).",
})

# Literal quotes of the page text that cross-reference cabins and heads (rule 2).
TEXT_XREF = {
    "xo-dfndr-9": {
        "camarotes": ("1", 1, "Inside the boat you’ll find a cozy cabin", "El texto describe una cabina."),
        "banos": ("1", 1, "private head and berths for two", "El texto menciona un baño privado ('private head')."),
    },
    "xo-explr-9": {
        "camarotes": ("1", 1, "the exceptionally spacious cabin", "El texto describe una cabina."),
        "banos": ("1", 1, "roomy and well-equipped toilet", "El texto describe un aseo."),
    },
    "xo-explr-10-sport-plus": {
        "camarotes": ("1", 1, "The front cabin accommodates two people", "El texto describe la cabina de proa."),
        "banos": ("Opcional", None, "with the optional toilet and galley module", "El aseo es opcional (módulo)."),
    },
    "xo-explr-10-s-plus-ib": {
        "camarotes": ("1", 1, "The front cabin accommodates two people",
                      "El texto describe la cabina de proa (en lugar de la bañera abierta de proa)."),
    },
    "xo-explr-44": {
        "camarotes": ("2", 2, "Up front you’ll enjoy everything you’d expect from an owner cabin",
                      "Cabina del armador a proa + cabina de popa ('The aft. cabin ...')."),
        "banos": ("1 (+1 opcional)", 1, "a large double with its own head",
                  "La cabina del armador tiene baño ('head'); la de popa puede llevar baño propio como opción."),
    },
}
SPEC_MAP = [
    (r"overall lenght( \(exc\. engine\))?", "eslora_total", "m"),
    (r"beam", "manga_casco", "m"),
    (r"draft to props", "calado", "m"),
    (r"weight \(excl\. engine\)", "desplazamiento", "kg"),
    (r"fuel capacity", "capacidad_combustible", "l"),
]
XREF = {
    "eslora_total": "'Overall Lenght (exc. engine)' = eslora total publicada (sin motores fueraborda).",
    "desplazamiento": "'Weight (excl. engine)' = desplazamiento en rosca (peso sin motor), como en el 37 XC.",
    "calado": "'Draft to props' = calado hasta las hélices.",
}


def _label(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def _norm_units(v: str) -> list[str]:
    """'43.65ft / 13.4m' → ["43' 7.8\"", "13.4 m"]; '8,8m' → ['8,8 m']; 'Approx. 8268 kg / 18 266 lbs'."""
    out = []
    for p in [x.strip() for x in re.split(r"\s+/\s+", v)]:
        p = re.sub(r"^approx\.\s*", "", p, flags=re.I)
        m = re.fullmatch(r"(\d+(?:\.\d+)?)\s*ft", p)
        if m:
            ft = float(m.group(1))
            p = f"{int(ft)}' {(ft - int(ft)) * 12:.1f}\""
        out.append(re.sub(r"(\d)\s*(m|kg|l)$", r"\1 \2", p))
    return out


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    labels = {f["key"]: f["label"] for f in catalog["fields"]}
    boat = ident["boat_type"]
    fields: dict[str, dict] = {}
    rows = {_label(r["label"]): r for r in ext["specifications"]}

    def rec(row, norm, unit, xref=None):
        r = B._row_record(src, row, norm, unit, xref)
        r["location"] = row.get("location") or r["location"]
        return r

    loa = None
    for lab, row in rows.items():
        for pat, key, kind in SPEC_MAP:
            if not re.fullmatch(pat, lab):
                continue
            raw = row["values"][0]
            vals = _norm_units(raw)
            if kind == "l" and re.fullmatch(r"\d+", raw.strip()):
                f = _field(key, labels[key], "VERIFIED", [rec(row, int(raw), "l")], display=f"{B._es(raw)} l",
                           notes=f"La web publica '{raw}' sin unidad; el resto de la gama XO publica esta fila en "
                                 "litros (un valor en galones no sería físicamente posible para la eslora).")
            elif kind == "l" and re.match(r"\d\s*[x×]\s*\d+\s*l", raw, re.I):
                n, v = map(int, re.findall(r"\d+", raw)[:2])
                f = _field(key, labels[key], "VERIFIED",
                           [rec(row, n * v, "l", "Dos depósitos publicados como 'N×V l'; total = N × V.")],
                           display=f"{n} x {v} l ({n * v} l en total)")
            else:
                f = B._quantity_field(key, labels[key], {"label": row["label"], "values": vals}, kind, src,
                                      XREF.get(key), loa)
                for r in f["records"]:
                    r["location"] = row.get("location") or r["location"]
                    r["source_value"] = raw
                if raw.lower().startswith("approx"):
                    f["display_value"] += " (aprox.)"
                    f["notes"] = ("La web lo declara aproximado ('Approx.'). " + (f.get("notes") or "")).strip()
            fields[key] = f
            if key == "eslora_total" and f["status"] == "VERIFIED":
                loa = f["records"][0]["normalized_value"]
            break

    # Certification: "Classification" + "Passengers" (positional), as the 37 XC's "Category" + "Passengers".
    cls, pax = rows.get("classification"), rows.get("passengers")
    if pax:
        v = pax["values"][0]
        fields["capacidad_pasajeros"] = _field("capacidad_pasajeros", labels["capacidad_pasajeros"], "VERIFIED",
                                               [rec(pax, v, None)], display=v.replace("/", " / ").replace("-", "–"))
    if cls:
        cats = [c.strip().upper() for c in cls["values"][0].split("/")]
        nums = [n.strip() for n in pax["values"][0].split("/")] if pax else []
        xref = "'Classification' + 'Passengers' = categoría CE : personas (posición a posición)."
        records = [rec(cls, None, None, xref)] + ([rec(pax, None, None, xref)] if pax else [])
        if len(nums) == len(cats) and all(re.fullmatch(r"\d+", n) for n in nums):
            disp = " / ".join(f"{c}{n}" for c, n in zip(cats, nums))
            for r in records:  # both rows give one combined value
                r["normalized_value"] = disp
            if [int(n) for n in nums] != sorted(int(n) for n in nums):
                fields["certificacion"] = _field(
                    "certificacion", labels["certificacion"], "REQUIRES_REVIEW", records, display=disp,
                    notes=f"La web publica 'Classification {cls['values'][0]}' y 'Passengers {pax['values'][0]}': "
                          "el número de personas no crece de B a C (posible error de la web o de orden).")
            else:
                fields["certificacion"] = _field("certificacion", labels["certificacion"], "VERIFIED", records,
                                                 display=disp)
        else:
            disp = f"{' / '.join(cats)} ({pax['values'][0] if pax else 's/d'} personas)"
            for r in records:
                r["normalized_value"] = disp
            fields["certificacion"] = _field(
                "certificacion", labels["certificacion"], "REQUIRES_REVIEW", records, display=disp,
                notes="La web publica la categoría y un rango de personas que no se puede asignar a una categoría.")

    # Engines: the upper end of the published range / the most powerful option.
    eng = next((r for lab, r in rows.items() if re.fullmatch(r"(outboard|inboard) engines?", lab)), None)
    if eng:
        v = eng["values"][0]
        combos = [(int(a), int(b)) for a, b in re.findall(r"(\d)\s*[x×]\s*(\d{3})", v)]
        singles = [int(x) for x in re.findall(r"(?<![x×\d])\s*(\d{3,4})\s*hp", v, re.I)]
        maxm = re.search(r"max\s*(\d{3,4})\s*hp", v, re.I)
        totals = [a * b for a, b in combos] + singles + ([int(maxm.group(1))] if maxm else [])
        if not totals and re.fullmatch(r"\d{3}", v.strip()):
            totals = [int(v)]
        top = max(totals) if totals else None
        combo = next((f"{a} x {b} hp" for a, b in combos if a * b == top), None)
        unitless = not re.search(r"hp", v, re.I)
        note = (f"La web publica '{v}' sin unidad; potencia en hp como en el resto de la ficha de la gama XO. "
                if unitless else "")
        inboard = eng["label"].lower().startswith("inboard")
        if top:
            xref = "Extremo superior de la fila de motores publicada (motorización más potente ofrecida)."
            fields["potencia_motor_maxima"] = _field(
                "potencia_motor_maxima", labels["potencia_motor_maxima"], "VERIFIED", [rec(eng, top, "hp", xref)],
                display=f"{_fmt(top, 0)} hp" + (f" ({combo})" if combo and not combo.startswith("1 ") else ""),
                notes=note.strip())
        fields["motorizacion"] = _field("motorizacion", labels["motorizacion"], "VERIFIED", [rec(eng, v, None)],
                                        display=f"{v}{' hp' if unitless else ''} ({'intraborda' if inboard else 'fueraborda'})",
                                        notes=note.strip())

    for lab, key in (("max speed range", "velocidad_maxima"), ("construction", "construccion")):
        row = rows.get(lab)
        if row:
            v = row["values"][0]
            disp = re.sub(r"\s*kts?\b", " nudos", re.sub(r"^up to\s*", "hasta ", v, flags=re.I)).strip() \
                if key == "velocidad_maxima" else v.upper().replace("ALU", "Aluminio").replace("GRP", "GRP (fibra)")
            fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, v, "nudos" if key == "velocidad_maxima" else None)],
                                 display=disp)
    hull, dead = rows.get("hull"), rows.get("deadrise")
    if hull:
        deg = re.sub(r"\s*deg(rees)?", "°", dead["values"][0]) if dead else None
        disp = hull["values"][0] + (f", astilla muerta {deg}" if deg else "")
        fields["diseno_casco"] = _field("diseno_casco", labels["diseno_casco"], "VERIFIED",
                                        [rec(hull, disp, None)] + ([rec(dead, disp, None)] if dead else []),
                                        display=disp)
    berths = rows.get("berths")
    if berths:
        v = berths["values"][0]
        if re.search(r"\d", v):
            fields["literas"] = _field("literas", labels["literas"], "VERIFIED", [rec(berths, v, None)], display=v)
        else:
            fields["literas"] = _field("literas", labels["literas"], "VERIFIED", [rec(berths, v, None)], display="-",
                                       notes=f"La web publica '{v}' (sin literas).")
    cons = rows.get("fuel consuption, cruise")
    if cons:
        fields["consumo_crucero"] = _field("consumo_crucero", labels["consumo_crucero"], "NOT_FOUND", display="-",
                                           notes=f"La ficha publica '{cons['values'][0]}' (no disponible).")

    # Cabins / heads from literal quotes of the page text.
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
        "model": {"brand": "XO", "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "según ficha técnica",
                  "engine_option": (fields.get("motorizacion") or {}).get("display_value") or "-",
                  "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial del producto (S1). La ficha técnica prevalece; métrico sobre imperial.",
        "fields": [fields[k] for k in order],
    }


def _file_series(fname: str):
    m = re.search(r"(dfndr|dscvr|explr)[\s_-]?(\d{1,2})(?!\d)", fname.lower())
    return (f"xo {m.group(1)}", m.group(2)) if m else None


def scope_hint(im: dict, ident: dict, ext: dict):
    """A file name naming another current XO model (series + size) → OTHER_MODEL."""
    fm = _file_series(im["file_name"])
    own = ident["tokens"]
    if fm and fm in B._CORPUS.get("models", set()) and fm != (own["range"], own["size"]):
        return "OTHER_MODEL", f"El nombre de archivo '{im['file_name']}' nombra otro modelo de la web ({fm[0].upper()} {fm[1]})."
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
