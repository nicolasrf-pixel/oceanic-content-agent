"""Build a full model package from an Axopar source extract.

Applies the library rules (CLAUDE.md) automatically:
- data only from the official product page (S1); the tech spec block prevails
- base table filled by documented cross-references between page sections
- images scoped to the exact model using DAM tags and titles
- SOURCE CONTENT is literal; OCEANIC CONTENT comes from a hand-written draft
  file (drafts/<brand>/<slug>.json) and is marked PENDIENTE when missing.

Packages that were curated by hand (marked `"curated": true` in
00_MODELO/model.json) are never overwritten.
"""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path

from .. import media

ROOT = Path(__file__).resolve().parents[3]
BRAND = "Axopar"
BRAND_DIR = ROOT / "biblioteca" / "axopar"

VARIANTS = {  # slug fragment -> (variant code, display name)
    "xc-cross-cabin": ("xc", "XC Cross Cabin"),
    "sun-top": ("sunto", "Sun Top"),
    "cross-top": ("crosstop", "Cross Top"),
    "spyder": ("spyder", "Spyder"),
    "ccx": ("ccx", "CCX"),
    "t-top": ("ttop", "T-Top"),
    "cross-bow": ("crossbow", "Cross Bow"),
}
TAG_VARIANT = {"xc": "xc", "st": "sunto", "xt": "crosstop", "ct": "crosstop", "s": "spyder",
               "ccx": "ccx", "tt": "ttop", "cb": "crossbow", "crosstop": "crosstop", "ttop": "ttop"}
TITLE_VARIANT = [(r"cross[\s_-]*cabin|\bxc\b", "xc"), (r"sun[\s_-]*top|\bst\b", "sunto"),
                 (r"cross[\s_-]*top|\bct\b|\bxt\b", "crosstop"), (r"spyder", "spyder"),
                 (r"\bccx\b", "ccx"), (r"t[\s_-]*top|\btt\b", "ttop"), (r"cross[\s_-]*bow|\bcb\b", "crossbow")]


# ---------------------------------------------------------------- identity

def identity(slug: str) -> dict:
    electric = slug.startswith("ax-e-")
    size = re.search(r"(\d\d)", slug).group(1)
    if electric:
        return {"slug": slug, "size": size, "variant": "axe", "electric": True,
                "model": f"AX/E {size}", "range": "AX/E 100% Electric", "variant_name": f"AX/E {size}"}
    frag = slug.split(f"axopar-{size}-", 1)[1]
    code, name = VARIANTS[frag]
    return {"slug": slug, "size": size, "variant": code, "electric": False,
            "model": f"Axopar {size} {name}", "range": f"Axopar {size}", "variant_name": name}


def _tag_model(tag: str):
    m = re.fullmatch(r"axe(22|25)(crosstop|ttop)?", tag)
    if m:
        return m.group(1), "axe"
    m = re.fullmatch(r"ax(\d\d)(xc|st|xt|ct|s|ccx|tt|cb)", tag)
    if m:
        return m.group(1), TAG_VARIANT[m.group(2)]
    return None


def _title_model(title: str):
    t = title.lower().replace("_", " ")
    if re.search(r"ax[\s/-]?e[\s-]?(22|25)|axe(22|25)", t):
        return re.search(r"(22|25)", t).group(1), "axe"
    m = re.search(r"(?:axopar|ax)[\s-]*(\d\d)", t)
    if not m:
        return None
    for pat, code in TITLE_VARIANT:
        if re.search(pat, t[m.end():m.end() + 30]):
            return m.group(1), code
    return m.group(1), None


# ---------------------------------------------------------------- helpers

def _num(text: str):
    m = re.search(r"(\d+(?:[.,]\d+)?)", text.replace(" ", ""))
    return float(m.group(1).replace(",", ".")) if m else None


def _fmt(value: float, decimals: int = 2) -> str:
    s = f"{value:,.{decimals}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return s


def _record(src: dict, field: str, value: str, unit, norm, nunit, location, xref=None) -> dict:
    r = {"source_id": "S1", "source_name": src["title"], "url": src["url"],
         "accessed_at": src["accessed_at"], "source_field": field, "source_value": value,
         "source_unit": unit, "normalized_value": norm, "normalized_unit": nunit,
         "model_year": src["model_year"], "location": location}
    if xref:
        r["cross_reference"] = xref
    return r


def _field(key, label, status, records=(), display=None, note=None, notes=""):
    f = {"oceanic_field": key, "label": label, "status": status, "display_value": display,
         "records": list(records), "notes": notes}
    if note:
        f["display_note"] = note
    return f


def _equipment_lines(groups) -> list[tuple[str, str]]:
    out = []
    for g in groups or []:
        for line in (g.get("description") or "").replace("\r", "").split("\n"):
            line = line.strip().lstrip("-").strip()
            if line:
                out.append((g["name"], line))
    return out


def _all_text(ext: dict) -> str:
    parts = [ext["hero"].get("intro") or ""]
    for s in ext["sections"]:
        parts += [s.get("title") or "", s.get("intro") or ""]
        for it in s["items"]:
            parts += [it.get("title") or "", it.get("text") or "", it.get("caption") or ""]
            parts += it.get("modal_text") or []
    return "\n".join(p for p in parts if isinstance(p, str))


# ---------------------------------------------------------------- specs

def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    ts = {t["name"].strip(): t["value"].strip() for t in (ext["technical_specifications"] or [])}
    ts_list = [(t["name"].strip(), t["value"].strip()) for t in (ext["technical_specifications"] or [])]
    std = _equipment_lines(ext["standard_equipment"])
    opt = _equipment_lines(ext["optional_equipment"])
    text = _all_text(ext)
    TS = "Technical Specifications"
    F = []

    def get(*names):
        for n in names:
            if n in ts:
                return n, ts[n]
        return None, None

    # Eslora
    n, v = get("Overall Length (excl. Engine)")
    if v:
        x = _num(v)
        F.append(_field("eslora_total", "Eslora Total", "VERIFIED",
                        [_record(src, n, v, "m", x, "m", TS)], f"{_fmt(x)} m", "sin motor"))
    else:
        F.append(_field("eslora_total", "Eslora Total", "NOT_FOUND", display="-",
                        notes="La web oficial del producto no publica la eslora."))
    # Manga
    n, v = get("Beam")
    if v:
        x = _num(v)
        F.append(_field("manga_casco", "Manga Casco", "VERIFIED", [_record(src, n, v, "m", x, "m", TS)],
                        f"{_fmt(x)} m"))
    else:
        F.append(_field("manga_casco", "Manga Casco", "NOT_FOUND", display="-",
                        notes="La web oficial del producto no publica la manga."))
    # Desplazamiento en rosca (cross: Weight excl. engine)
    n, v = get("Weight (excl. Engine)")
    if v:
        x = _num(v.split(":")[-1])
        avg = "average options" in v.lower()
        F.append(_field("desplazamiento", "Desplazamiento en rosca", "VERIFIED",
                        [_record(src, n, v, "kg", x, "kg", TS,
                                 "La web publica el peso del barco sin motores: es el peso en rosca."
                                 + (" Incluye 'average options' según la fuente." if avg else ""))],
                        f"{_fmt(x, 0)} kg", "sin motor, con opciones promedio" if avg else "sin motor"))
    else:
        F.append(_field("desplazamiento", "Desplazamiento en rosca", "NOT_FOUND", display="-",
                        notes="La web oficial del producto no publica peso ni desplazamiento."))
    # Camarotes (cross: front cabin / cuddy + optional aft cabin)
    front = [l for g, l in std if re.search(r"front cabin|cuddy", l, re.I)] or \
            [g for g in {g for g, _ in std} if re.search(r"front cabin", g, re.I)]
    cuddy_text = re.search(r"[^.\n]*cuddy cabin[^.\n]*\.", text, re.I)
    aft = [l for g, l in opt if re.search(r"\baft cabin\b", l, re.I)] or \
          [f"Berths: {ts.get('Berths')}"] * bool(re.search(r"optional aft cabin", ts.get("Berths", ""), re.I))
    recs = []
    if front:
        recs.append(_record(src, "Front Cabin (Standard Features)", front[0] if isinstance(front[0], str) else "",
                            None, None, None, "Equipment · Standard Features", "Cabina de proa de serie."))
    elif cuddy_text:
        recs.append(_record(src, "Cuddy cabin", cuddy_text.group(0).strip(), None, None, None,
                            "Key Feature Highlights", "Cabina de proa (cuddy) de serie."))
    if aft:
        recs.append(_record(src, "Optional Equipment", aft[0], None, None, None,
                            "Equipment · Optional Equipment", "Cabina de popa opcional."))
    base_cab = 1 if (front or cuddy_text) else 0
    disp = f"{base_cab}" + (" (+1 opcional)" if aft else "")
    norm = {"standard": base_cab, "optional": 1 if aft else 0}
    for r in recs:
        r["normalized_value"] = norm
    if recs:
        F.append(_field("camarotes", "Camarotes", "VERIFIED", recs, disp,
                        notes="Cruce de equipamiento estándar y opcional."))
    elif std:
        groups = ", ".join(dict.fromkeys(g for g, _ in std))
        F.append(_field("camarotes", "Camarotes", "VERIFIED",
                        [_record(src, "Standard Features (grupos)", groups, None, {"standard": 0, "optional": 0}, None,
                                 "Equipment · Standard Features",
                                 "El equipamiento estándar y opcional no incluye cabina: sin camarote.")],
                        "0", "sin cabina"))
    else:
        F.append(_field("camarotes", "Camarotes", "NOT_FOUND", display="-",
                        notes="La web no publica equipamiento ni menciona cabina."))
    # Combustible
    fuel = [(nm, v) for nm, v in ts_list if nm == "Fuel capacity"]
    fuel_ok = [(nm, v) for nm, v in fuel if not re.search(r"l\s*/\s*nm", v, re.I)]
    fuel_bad = [(nm, v) for nm, v in fuel if re.search(r"l\s*/\s*nm", v, re.I)]
    if ident["electric"]:
        m = re.search(r"[^.\n]*\d+\s*kWh[^.\n]*\.", text)
        if m:
            kwh = re.search(r"(dual|twin|single|\d+\s*x)?\s*(\d+)\s*kWh", m.group(0), re.I)
            mult = 2 if kwh.group(1) and re.match(r"dual|twin", kwh.group(1), re.I) else 1
            F.append(_field("capacidad_bateria", "Capacidad batería", "VERIFIED",
                            [_record(src, "Efficient Power, Seamless Exploration", m.group(0).strip(), "kWh",
                                     mult * int(kwh.group(2)), "kWh", "Card 'Adventure Further'",
                                     "Eléctrico: la capacidad de batería reemplaza a la de combustible.")],
                            (f"2 x {kwh.group(2)} kWh" if mult == 2 else f"{kwh.group(2)} kWh")))
        else:
            F.append(_field("capacidad_bateria", "Capacidad batería", "NOT_FOUND", display="-"))
    elif fuel_ok:
        nm, v = fuel_ok[0]
        x = _num(v)
        extra = re.search(r"optional\s*([\d.,]+)\s*l", v, re.I)
        F.append(_field("capacidad_combustible", "Capacidad Combustible", "VERIFIED",
                        [_record(src, nm, v, "l", x, "l", TS)],
                        f"{_fmt(x, 0)} l" + (f" (opcional {_fmt(_num(extra.group(1)), 0)} l)" if extra else ""),
                        notes=("La web repite 'Fuel capacity' con un valor de consumo (" + fuel_bad[0][1] +
                               "): error de etiquetado de la fuente, no se publica como capacidad.") if fuel_bad else ""))
    else:
        F.append(_field("capacidad_combustible", "Capacidad Combustible", "NOT_FOUND", display="-"))
    # Agua dulce (cross: equipment lists)
    fw = [(g, l, "Standard Features") for g, l in std if re.search(r"fresh\s*-?water", l, re.I)] + \
         [(g, l, "Optional Equipment") for g, l in opt if re.search(r"fresh\s*-?water", l, re.I)]
    fw_vol = [(g, l, where) for g, l, where in fw if re.search(r"\d+\s*l\b", l, re.I)]
    if fw_vol:
        g, l, where = fw_vol[0]
        x = int(re.search(r"(\d+)\s*l\b", l, re.I).group(1))
        F.append(_field("capacidad_agua_dulce", "Capacidad Agua Dulce", "VERIFIED",
                        [_record(src, l, l, "l", x, "l", f"Equipment · {where} · {g}",
                                 "No está en la ficha técnica; se toma del equipamiento de la misma web.")],
                        f"{x} l" + (" (opcional)" if where == "Optional Equipment" else "")))
    else:
        F.append(_field("capacidad_agua_dulce", "Capacidad Agua Dulce", "NOT_FOUND", display="-",
                        notes="La web no publica un volumen de agua dulce" +
                              (f" (menciona: {fw[0][1]})." if fw else ".")))
    # Certificación (cross: Category + Passengers)
    nc, cat = get("Category")
    npas, pas = get("Passengers", "Passenger")
    if cat and pas:
        people = dict(re.findall(r"([BCD])\s*:\s*(\d+)", pas))
        cats = re.findall(r"\b([BCD])\s*[–-]", cat)
        disp = " / ".join(f"{c}{people.get(c, '')}" for c in cats) if cats else pas
        F.append(_field("certificacion", "Certificación", "VERIFIED",
                        [_record(src, f"{nc} + {npas}", f"{cat} · {pas}",
                                 "personas", {c: int(p) for c, p in people.items()}, "personas", TS,
                                 "Cruce de 'Category' y 'Passengers' en formato Oceanic (categoría + personas).")],
                        disp, "CE · personas"))
    else:
        F.append(_field("certificacion", "Certificación", "NOT_FOUND", display="-"))
    # Potencia motor máx
    n, v = get("Outboard engines")
    eng_opts = [l for g, l in opt if g.lower().startswith("engine") and re.search(r"\b\d{3}\b|\d{3}\s*hp", l, re.I)]
    if ident["electric"]:
        m = re.search(r"[^.\n]*\d+\+?\s*HP[^.\n]*", text, re.I)
        if m:
            hps = [int(h) for h in re.findall(r"(\d+)\+?\s*HP", m.group(0), re.I)]
            peak = re.search(r"peak[^.]*?(\d+)\s*HP", m.group(0), re.I)
            disp = (f"{peak.group(1)} hp peak ({hps[0]} hp nominal)" if peak
                    else f"{hps[0]}{'+' if '+' in m.group(0) else ''} hp")
            F.append(_field("potencia_motor_maxima", "Potencia motor máx", "VERIFIED",
                            [_record(src, "Banner de performance", m.group(0).strip(), "hp", max(hps), "hp",
                                     "Texto de la página", "Motor eléctrico: potencia declarada en el texto.")],
                            disp))
        else:
            F.append(_field("potencia_motor_maxima", "Potencia motor máx", "NOT_FOUND", display="-"))
        F.append(_field("motorizacion", "Motorización", "VERIFIED" if m else "NOT_FOUND",
                        [_record(src, "Powerhouse Performance", m.group(0).strip(), None, "eléctrico", None,
                                 "Banner 'Powerhouse Performance'")] if m else [],
                        ("Eléctrica, " + re.search(r"Evoy \w+", text).group(0)) if m and re.search(r"Evoy \w+", text)
                        else ("Eléctrica" if m else "-")))
    elif v:
        pairs = [(int(a), int(b)) for a, b in re.findall(r"(\d)\s*x\s*(\d{3})", v)]
        if pairs:
            best = max(pairs, key=lambda p: p[0] * p[1])
            disp = f"{best[0]} x {best[1]} hp"
            norm = f"{best[0]} x {best[1]}"
        else:
            hp = max(int(h) for h in re.findall(r"\d{3}", v))
            disp, norm = f"{hp} hp", f"1 x {hp}"
        recs = [_record(src, n, v, "hp", norm, "hp", TS, "Extremo superior de la motorización publicada.")]
        note = ""
        if eng_opts:
            def total(l):
                mult = 3 if re.search(r"triple", l, re.I) else 2 if re.search(r"twin", l, re.I) else 1
                return mult, max(int(h) for h in re.findall(r"(?<!\d)(\d{3})(?!\d)", l))
            top = max(eng_opts, key=lambda l: total(l)[0] * total(l)[1])
            mu, hp = total(top)
            if f"{mu} x {hp}" == norm:
                recs.append(_record(src, "Engine (Optional Equipment)", top, "hp", f"{mu} x {hp}", "hp",
                                    "Equipment · Optional Equipment · Engine", "Motorización más potente ofrecida."))
            else:
                note = (f"Prevalece la ficha técnica. La lista de opcionales ofrece además '{top}' "
                        f"({mu} x {hp} hp); no se publica como potencia máxima.")
        F.append(_field("potencia_motor_maxima", "Potencia motor máx", "VERIFIED", recs, disp, notes=note))
        mot = v if re.search(r"hp", v, re.I) else f"{v} hp"
        F.append(_field("motorizacion", "Motorización", "VERIFIED", [_record(src, n, v, "hp", v, "hp", TS)],
                        f"Fueraborda, {mot}"))
    else:
        F.append(_field("potencia_motor_maxima", "Potencia motor máx", "NOT_FOUND", display="-"))
    # Otros campos de la ficha técnica
    n, v = get("Draft to props")
    if v:
        x = _num(v)
        F.append(_field("calado", "Calado", "VERIFIED", [_record(src, n, v, "m", x, "m", TS)], f"{_fmt(x)} m",
                        "a hélices"))
    n, v = get("Berths")
    if v:
        F.append(_field("literas", "Literas", "VERIFIED", [_record(src, n, v, None, v, None, TS)], v))
    toilet = [l for g, l in std if re.search(r"toilet", l, re.I) and not re.search(r"optional", l, re.I)]
    toilet_opt = [l for g, l in opt if re.search(r"toilet", l, re.I)]
    if toilet:
        F.append(_field("banos", "Baños", "VERIFIED",
                        [_record(src, "Standard Features", toilet[0], None, 1, None, "Equipment · Standard Features",
                                 "WC de serie en el equipamiento estándar.")], "1"))
    elif toilet_opt:
        F.append(_field("banos", "Baños", "VERIFIED",
                        [_record(src, "Optional Equipment", toilet_opt[0], None, "opcional", None,
                                 "Equipment · Optional Equipment", "WC solo como opción.")], "WC opcional"))
    n, v = get("Construction")
    if v:
        F.append(_field("construccion", "Construcción", "VERIFIED", [_record(src, n, v, None, v, None, TS)], v))
    n, v = get("Hull design")
    if v:
        deg = re.search(r"(\d+)\s*degree", v)
        F.append(_field("diseno_casco", "Diseño de casco", "VERIFIED", [_record(src, n, v, None, v, None, TS)],
                        f"Doble step, V de {deg.group(1)}°, proa “Sharp entry”" if deg else v))
    n, v = get("Max speed range", "Max speed")
    if v:
        F.append(_field("velocidad_maxima", "Velocidad máxima", "VERIFIED", [_record(src, n, v, "nudos", v, "nudos", TS)],
                        re.sub(r"\s*(knots|kts|kn)\b", " nudos", v).replace(" - ", " – ")))
    elif ident["electric"] and (m := re.search(r"[^.\n]*(?:top speed of|exceeding)\s*(\d{2})\+?\s*knots[^.\n]*",
                                               text, re.I)):
        plus = "+" if re.search(r"exceeding|\+", m.group(0)) else ""
        F.append(_field("velocidad_maxima", "Velocidad máxima", "VERIFIED",
                        [_record(src, "texto", m.group(0).strip(), "nudos", m.group(1), "nudos", "Texto de la página")],
                        f"{m.group(1)}{plus} nudos"))
    n, v = get("Fuel consumption, cruise")
    cons = [(n, v)] if v else [(nm, val) for nm, val in fuel_bad]
    if cons:
        nm, val = cons[0]
        F.append(_field("consumo_crucero", "Consumo crucero", "VERIFIED",
                        [_record(src, nm, val, "l/nm", val, "l/mn", TS,
                                 None if v else "Publicado bajo la etiqueta 'Fuel capacity' (error de la fuente).")],
                        val.replace("l / nm", "l/mn").replace("l/nm", "l/mn").replace("L/nm", "l/mn")))
    n, v = get("Range Approximately")
    if v:
        F.append(_field("autonomia", "Autonomía", "VERIFIED", [_record(src, n, v, "mn", _num(v), "mn", TS)],
                        f"~{_fmt(_num(v), 0)} mn", "en condiciones óptimas"))
    elif not ident["electric"] and (m := next((x for x in re.finditer(
            r"[^.\n]*(?:range of|up to)\s*\+?(\d{2,3})\+?\s*nautical miles[^.\n]*|[^.\n]*\+?(\d{2,3})\+\s*nautical miles[^.\n]*",
            text, re.I) if "additional" not in x.group(0)), None)):
        nm_ = m.group(1) or m.group(2)
        F.append(_field("autonomia", "Autonomía", "VERIFIED",
                        [_record(src, "texto", m.group(0).strip(), "mn", int(nm_), "mn", "Texto de la página",
                                 "No está en la ficha técnica; la web lo declara en el texto del modelo.")],
                        f"{nm_}+ mn"))
    elif ident["electric"] and (m := re.search(r"[^.\n]*(?:more than|up to) (\d+) nautical miles[^.\n]*", text, re.I)):
        F.append(_field("autonomia", "Autonomía", "VERIFIED",
                        [_record(src, "texto", m.group(0).strip(), "mn", int(m.group(1)), "mn", "Texto de la página")],
                        f"{m.group(1)} mn", "a 5 nudos"))
    present = {f["oceanic_field"] for f in F}
    for key, label in (("calado", "Calado"), ("motorizacion", "Motorización")):
        if key not in present:
            F.append(_field(key, label, "NOT_FOUND", display="-",
                            notes="La web oficial del producto no publica este dato."))
    return {"model": {"brand": BRAND, "range": ident["range"], "model": ident["model"],
                      "variant": ident["variant_name"], "model_year": src["model_year"],
                      "configuration": "Base (según web oficial)", "engine_option": "Ver motorización",
                      "boat_type": "motor_electrico" if ident["electric"] else "motor"},
            "compiled_at": src["accessed_at"],
            "rules": "Generado por tools/oceanic/builders/axopar.py desde la web oficial del producto (S1).",
            "fields": F}


# ---------------------------------------------------------------- images

def classify_images(ext: dict, ident: dict) -> dict:
    recs = media.init_inventory(ext)
    by_src = {im["src"]: im for im in ext["images"]}
    ids = set()
    for rec in recs:
        im = by_src[rec["cdn_url"]]
        tags = im["tags"]
        own = (ident["size"], ident["variant"])
        tag_models = [m for m in (_tag_model(t) for t in tags) if m]
        title_m = _title_model(im["title"] or "")
        ctx = im["context"]
        blk = (ctx.get("block_title") or "") + " " + (ctx.get("item_title") or "")
        # scope
        if own in tag_models:
            scope, ev, conf = "THIS_MODEL", f"Tag DAM del modelo ({', '.join(tags[:6])}).", "alta"
        elif tag_models:
            scope, ev, conf = "OTHER_MODEL", f"Tags DAM de otro modelo: {tag_models}.", "alta"
        elif title_m and title_m[0] != ident["size"]:
            scope, ev, conf = "OTHER_MODEL", f"Título de otro modelo: '{im['title']}'.", "alta"
        elif title_m and title_m[1] and title_m[1] != ident["variant"]:
            scope, ev, conf = "OTHER_MODEL", f"Título de otra variante: '{im['title']}'.", "media"
        elif title_m and title_m[1] == ident["variant"]:
            scope, ev, conf = "THIS_MODEL", f"Título del modelo: '{im['title']}'.", "media"
        elif re.search(r"upholstery|colou?r", blk, re.I) or \
                re.search(r"alternatives|configurations|layouts", blk, re.I) and im["ext"] == "png":
            scope, ev, conf = "THIS_MODEL", f"Render/muestra publicada en la sección '{ctx.get('block_title')}' del modelo.", "media"
        else:
            scope, ev, conf = "REQUIRES_REVIEW", f"Sin tag ni título que identifiquen el modelo ('{im['title']}').", "baja"
        # category
        low = (im["title"] or "").lower()
        if re.search(r"upholstery|colou?r", blk, re.I):
            cat = "DETAIL"
        elif re.search(r"alternatives|configurations|layouts", blk, re.I) and im["ext"] == "png":
            cat = "OTHER"
        elif "ins" in tags:
            cat = "INTERIOR"
        elif "out" in tags or "dji" in low:
            cat = "EXTERIOR"
        elif re.search(r"helm|driver|dashboard", blk, re.I):
            cat = "HELM"
        elif re.search(r"cabin|toilet|bed|overnight", blk, re.I):
            cat = "CABIN"
        elif re.search(r"aft|cockpit|sofa|wet bar|seating", blk, re.I):
            cat = "COCKPIT"
        elif re.search(r"performance|handling|seaworth", blk, re.I):
            cat = "UNDERWAY"
        else:
            cat = "OTHER"
        my = next((t for t in tags if re.fullmatch(r"my\d\d", t)), None)
        rid, n = rec["id"], 2
        while rid in ids:
            rid, n = f"{rec['id']}-{n}", n + 1
        ids.add(rid)
        rec.update(id=rid, category=cat, scope=scope, scope_evidence=ev, category_confidence=conf,
                   model_year_tag=f"MY20{my[2:]}" if my else None, copyright_notice=im.get("copyright_notice"))
        if scope != "THIS_MODEL":
            rec["download_status"] = f"NOT_DOWNLOADED (fuera de alcance: {scope})"
    # hero candidates
    pool = [r for r in recs if r["scope"] == "THIS_MODEL" and r["category"] in ("EXTERIOR", "UNDERWAY")
            and (r["declared_width"] or 0) > (r["declared_height"] or 0) and (r["declared_width"] or 0) >= 3000]
    pool.sort(key=lambda r: (r["model_year_tag"] or "", "out" in r["dam_tags"], r["declared_width"] or 0), reverse=True)
    for rank, r in enumerate(pool[:3], 1):
        r.update(hero_candidate=True, hero_rank=rank,
                 hero_reason=f"Exterior {r['model_year_tag'] or 'MY s/d'} del modelo, horizontal "
                             f"{r['declared_width']}x{r['declared_height']}; {r['scope_evidence']}")
    return {"model": ident["model"], "source_page": ext["source_url"],
            "usage_terms": "Media Library Axopar: uso libre editorial y para distribuidores autorizados en comunicación comercial; acreditar a Axopar; no alterar logos.",
            "classification_note": "Clasificación automática con tags del DAM, títulos y bloque de la página. Las de confianza 'baja' y las REQUIRES_REVIEW requieren revisión visual.",
            "download_note": "Copias web WebP (2560 px HERO_CANDIDATE, 1920 px el resto). El original se referencia en `original`.",
            "images": recs}


# ---------------------------------------------------------------- markdown

KEYS = {
    "ingenieria": r"hull|engineer|construct|technolog|connect|display|monitor|battery|charg|system|app\b",
    "performance": r"performance|speed|fuel|economy|handling|seaworth|range|power|torque|efficien",
    "experiencia": r"cabin|toilet|sofa|seating|storage|deck|cockpit|helm|driver|comfort|social|sunbed|overnight|galley|wet bar|table",
}


def _classify_block(title: str, text: str) -> str:
    t = f"{title} {text}".lower()
    scores = {k: len(re.findall(p, t)) for k, p in KEYS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] else "diseno"


def _quote(text: str) -> str:
    return "\n".join("> " + l if l.strip() else ">" for l in text.strip().split("\n"))


def editorial_sources(ext: dict) -> dict:
    out = {k: [] for k in ("hero", "introduccion", "diseno", "ingenieria", "experiencia", "performance")}
    h = ext["hero"]
    out["hero"].append(f"- **Title:** {h.get('title')}\n- **Heading:** {h.get('heading')}\n"
                       f"- **Subheading:** {h.get('subheading')}\n\n{_quote(h.get('intro') or '')}")
    out["introduccion"].append(f"**Hero intro** — S1 (literal):\n\n{_quote(h.get('intro') or '')}")
    first_banner = True
    for s in ext["sections"]:
        if s["block_type"] in ("BannerBlock", "HighlightBannerBlock", "MediaBannerBlock") and s.get("intro"):
            dest = "introduccion" if first_banner else _classify_block(s["title"] or "", s["intro"])
            first_banner = False
            out[dest].append(f"**{s['title']}** — S1 (literal):\n\n{_quote(s['intro'])}")
        elif s["block_type"] == "TabsBlock":
            for it in s["items"]:
                if it.get("text"):
                    dest = _classify_block(it.get("title") or "", it["text"])
                    out[dest].append(f"**{it.get('title')}** — S1, {s['title']} (literal):\n\n{_quote(it['text'])}")
        elif s["block_type"] == "ImageGalleryBlock":
            for it in s["items"]:
                if it.get("caption"):
                    out["diseno"].append(f"**Galería** — S1 (literal):\n\n{_quote(it['caption'])}")
        elif s["block_type"] == "CardListBlock" and s.get("intro"):
            out[_classify_block(s["title"] or "", s["intro"])].append(
                f"**{s['title']}** — S1 (literal):\n\n{_quote(s['intro'])}")
            for it in s["items"]:
                if it.get("text") and len(it["text"]) > 60:
                    out[_classify_block(it.get("title") or "", it["text"])].append(
                        f"**{it.get('title')}** — S1 (literal):\n\n{_quote(it['text'])}")
        elif s["block_type"] == "CardListBlock":
            for it in s["items"]:
                if it.get("text") and len(it["text"]) > 60:
                    out[_classify_block(it.get("title") or "", it["text"])].append(
                        f"**{(it.get('title') or '').strip()}** — S1 (literal):\n\n{_quote(it['text'])}")
    return out


TITLES = {"hero": "HERO", "introduccion": "INTRODUCCIÓN", "diseno": "DISEÑO", "ingenieria": "INGENIERÍA",
          "experiencia": "EXPERIENCIA A BORDO", "performance": "PERFORMANCE"}
FILES = {"hero": "hero.md", "introduccion": "introduccion.md", "diseno": "diseno.md",
         "ingenieria": "ingenieria.md", "experiencia": "experiencia-a-bordo.md", "performance": "performance.md"}


def write_editorial(model_dir: Path, ident: dict, sources: dict, draft: dict | None, images: dict):
    d = model_dir / "01_CONTENIDO"
    d.mkdir(parents=True, exist_ok=True)
    heroes = sorted((r for r in images["images"] if r["hero_candidate"]), key=lambda r: r["hero_rank"])
    for key, fname in FILES.items():
        parts = sources[key]
        lines = [f"# {TITLES[key]} · {ident['model']}", "", "## SOURCE CONTENT", ""]
        lines += ["\n\n".join(parts) if parts else "_Sin contenido de la web oficial para este bloque._", ""]
        lines += ["## OCEANIC CONTENT", ""]
        text = (draft or {}).get(key)
        if text:
            lines += ["> Candidato. Estado: **BORRADOR, requiere revisión editorial**.", ""]
            if key == "hero" and isinstance(text, dict):
                lines += [f"- **Nombre del barco:** {ident['model']}", f"- **Marca / origen:** Axopar · Finlandia", "",
                          "**Headlines candidatos**", ""]
                lines += [f"{i}. {h}" for i, h in enumerate(text.get("headlines", []), 1)]
                lines += ["", "**Descripción corta candidata**", "", _quote(text.get("descripcion", "")), ""]
            else:
                lines += [_quote(text), ""]
        else:
            lines += ["PENDIENTE: candidato en español por redactar.", ""]
        if key == "hero":
            lines += ["**Imagen hero** (selección final: revisión humana)", "",
                      "| Rank | id | Motivo |", "| --- | --- | --- |"]
            lines += [f"| {r['hero_rank']} | `{r['id']}` | {r['hero_reason']} |" for r in heroes]
            lines.append("")
        (d / fname).write_text("\n".join(lines))


def write_equipment(model_dir: Path, ident: dict, ext: dict):
    d = model_dir / "04_EQUIPAMIENTO"
    d.mkdir(parents=True, exist_ok=True)
    CONFIG_GROUPS = re.compile(r"module selection|layout|engine|region|eu/us|propeller|pre-rig", re.I)
    PACKAGE_GROUPS = re.compile(r"package|edition|brabus|styling", re.I)
    hdr = lambda t: [f"# {t} · {ident['model']} (MY{ext['model_year']})", "",
                     "> Fuente: S1 (web oficial del producto, literal). Traducción al español: pendiente.", ""]
    std = hdr("Equipamiento STANDARD")
    for g in ext["standard_equipment"] or []:
        std += [f"## {g['name']}", ""] + [f"- {l}" for _, l in _equipment_lines([g])] + [""]
    if not ext["standard_equipment"]:
        std += ["_La web del producto no publica equipamiento estándar en su pestaña._", ""]
    (d / "standard.md").write_text("\n".join(std))
    opt, conf, pkg = hdr("Equipamiento OPTIONAL"), hdr("CONFIGURATIONS"), hdr("PACKAGES")
    for g in ext["optional_equipment"] or []:
        body = [f"## {g['name']}", ""] + [f"- {l}" for _, l in _equipment_lines([g])] + [""]
        if CONFIG_GROUPS.search(g["name"]):
            conf += body
            opt += [f"## `{g['name']}` → ver `configurations.md`", ""]
        elif PACKAGE_GROUPS.search(g["name"]):
            pkg += body
            opt += [f"## `{g['name']}` → ver `packages.md`", ""]
        else:
            opt += body
    for s in ext["sections"]:
        if s["block_type"] == "ModalLiftBlock" or re.search(r"upgrade|edition", s.get("title") or "", re.I):
            for it in s["items"]:
                texts = it.get("modal_text") or ([it["text"]] if it.get("text") else [])
                if texts:
                    pkg += [f"## {it.get('title')}", "", _quote("\n\n".join(texts)), ""]
        if s["block_type"] == "CardListBlock" and re.search(r"aft deck|configuration|layout|upholster|colou?r",
                                                            s.get("title") or "", re.I):
            conf += [f"## {s['title']}", ""]
            if s.get("intro"):
                conf += [_quote(s["intro"]), ""]
            conf += [f"- **{it.get('title')}**" + (f": {it['text']}" if it.get("text") else "")
                     for it in s["items"]] + [""]
    (d / "optional.md").write_text("\n".join(opt))
    (d / "configurations.md").write_text("\n".join(conf))
    if len(pkg) > 4:
        (d / "packages.md").write_text("\n".join(pkg))


def write_features(model_dir: Path, ident: dict, ext: dict):
    lines = [f"# CARACTERÍSTICAS · {ident['model']}", "", "> Fuente: S1 (literal).", ""]
    for s in ext["sections"]:
        if s["block_type"] == "TabsBlock" and s["items"]:
            kind = " (OPTIONAL)" if re.search(r"option", s["title"] or "", re.I) else ""
            lines += [f"## {s['title']}{kind}", "", "| Característica | SOURCE CONTENT (literal) |", "| --- | --- |"]
            lines += [f"| {it.get('title')} | {(it.get('text') or '').replace(chr(10), ' ')} |" for it in s["items"]]
            lines.append("")
    d = model_dir / "03_CARACTERISTICAS"
    d.mkdir(parents=True, exist_ok=True)
    (d / "caracteristicas.md").write_text("\n".join(lines))


def write_model_md(model_dir: Path, ident: dict, ext: dict, spec: dict, images: dict):
    imgs = images["images"]
    count = lambda sc: sum(1 for r in imgs if r["scope"] == sc)
    pending = [f for f in spec["fields"] if f["status"] in ("NOT_FOUND", "REQUIRES_REVIEW")]
    xrefs = [f for f in spec["fields"] if any(r.get("cross_reference") for r in f["records"])]
    lines = [f"# {ident['model']}", "", "## Identificación", "", "| Campo | Valor | Fuente |", "| --- | --- | --- |",
             f"| MARCA | Axopar (Axopar Boats Oy, Finlandia) | S1 |",
             f"| GAMA | {ident['range']} ({', '.join(ext['range'])}) | S1 |",
             f"| MODEL | {ident['model']} | S1 |",
             f"| MODEL YEAR | {ext['model_year']} (campo `modelYear` de la ficha web) | S1 |",
             f"| VARIANT | {ident['variant_name']} | S1 |",
             f"| TIPO | {'Motor eléctrico' if ident['electric'] else 'Motor (fueraborda)'} | S1 |",
             f"| PRECIO | NO ENCONTRADO (la web no publica precio) | S1 |",
             f"| URL OFICIAL | {ext['source_url']} | S1 |", "",
             "## Reglas de alcance aplicadas", "",
             "- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/axopar.py`.",
             f"- No se mezclan otras variantes de la gama ({', '.join(r for r in ext['range'] if r != ext['page_title'])}).",
             f"- Imágenes: {count('THIS_MODEL')} del modelo, {count('OTHER_MODEL')} de otro modelo (excluidas), "
             f"{count('REQUIRES_REVIEW')} por revisar, {count('NOT_MODEL_SPECIFIC')} no son del barco.", "",
             "## Content readiness", "", "<!-- READINESS:START -->", "<!-- READINESS:END -->", "",
             "## Cruces de datos (tabla base)", ""]
    for f in xrefs:
        for r in f["records"]:
            if r.get("cross_reference"):
                lines.append(f"- **{f['label']}**: {r['source_field']} → {r['cross_reference']}")
    lines += ["", "## Información faltante o por revisar", ""]
    lines += [f"- **{f['label']}** ({f['status']}): {f.get('notes') or 'no publicado en la web oficial del producto.'}"
              for f in pending] or ["- Ninguna en la tabla técnica."]
    lines += ["- Traducción al español del equipamiento: pendiente.",
              "- Brochure oficial: no encontrado en axopar.com.",
              "- Manual del propietario: identificar en https://manuals.axopar.com/ (portal oficial)."]
    (model_dir / "00_MODELO").mkdir(parents=True, exist_ok=True)
    (model_dir / "00_MODELO" / "00_MODELO.md").write_text("\n".join(lines) + "\n")
    (model_dir / "00_MODELO" / "model.json").write_text(
        json.dumps({"slug": ident["slug"], "curated": False, "builder": "axopar"}, indent=2) + "\n")


# ---------------------------------------------------------------- main

def build(slug: str, ext: dict, drafts_dir: Path, force: bool = False) -> Path:
    model_dir = BRAND_DIR / slug
    marker = model_dir / "00_MODELO" / "model.json"
    if marker.exists() and json.loads(marker.read_text()).get("curated") and not force:
        raise SystemExit(f"{slug}: paquete curado a mano, no se sobrescribe")
    ident = identity(slug)
    src = {"title": ext["page_title"], "url": ext["source_url"], "accessed_at": ext["accessed_at"],
           "model_year": ext["model_year"]}
    (model_dir / "07_FUENTES" / "extract").mkdir(parents=True, exist_ok=True)
    (model_dir / "07_FUENTES" / "extract" / f"S1-{slug}.page.json").write_text(
        json.dumps(ext, ensure_ascii=False, indent=1) + "\n")
    range_url = ext["source_url"].rstrip("/").rsplit("/", 1)[0] + "/"
    (model_dir / "07_FUENTES" / "sources.json").write_text(json.dumps({
        "model": ident["model"],
        "policy": "Datos solo de la web oficial del producto. Manuales/PDF solo como documentos.",
        "sources": [
            {"id": "S1", "short": f"Web oficial · {ident['model']}", "title": ext["page_title"],
             "type": "official_product_page", "publisher": "Axopar Boats Oy", "url": ext["source_url"],
             "accessed_at": ext["accessed_at"], "retrieved_via": "Firecrawl rawHtml + adapters/axopar.py",
             "model_year_scope": ext["model_year"], "extract": f"07_FUENTES/extract/S1-{slug}.page.json"},
            {"id": "S2", "short": "Web oficial · gama", "title": ident["range"], "type": "official_range_page",
             "publisher": "Axopar Boats Oy", "url": range_url, "accessed_at": ext["accessed_at"],
             "retrieved_via": "referencia", "model_year_scope": "gama"},
            {"id": "S5", "short": "Media Library", "title": "Media Library", "type": "official_media_terms",
             "publisher": "Axopar Boats Oy", "url": "https://www.axopar.com/media/media-library/",
             "accessed_at": ext["accessed_at"], "retrieved_via": "referencia", "model_year_scope": "n/a"}],
        "excluded_sources": []}, ensure_ascii=False, indent=2) + "\n")
    (model_dir / "07_FUENTES" / "source-map.md").write_text(
        f"# Mapa de fuentes · {ident['model']}\n\nTodos los datos y textos salen de S1 ({ext['source_url']}), "
        f"accedida {ext['accessed_at']} con Firecrawl. S2 es la página de gama (referencia) y S5 las condiciones "
        "de uso de imágenes.\n")
    spec = build_specs(ext, ident, src)
    (model_dir / "02_ESPECIFICACIONES").mkdir(parents=True, exist_ok=True)
    (model_dir / "02_ESPECIFICACIONES" / "specifications.json").write_text(
        json.dumps(spec, ensure_ascii=False, indent=2) + "\n")
    inv_path = model_dir / "05_MULTIMEDIA" / "IMAGENES" / "images.json"
    images = classify_images(ext, ident)
    if inv_path.exists():  # keep download state of an earlier build
        old = {r["id"]: r for r in json.loads(inv_path.read_text())["images"]}
        for r in images["images"]:
            o = old.get(r["id"])
            if o and o.get("file") and r["scope"] == "THIS_MODEL":
                for k in ("file", "width", "height", "format", "sha256", "bytes", "original",
                          "downloaded_at", "downloaded_from", "download_status"):
                    if k in o:
                        r[k] = o[k]
    inv_path.parent.mkdir(parents=True, exist_ok=True)
    inv_path.write_text(json.dumps(images, ensure_ascii=False, indent=2) + "\n")
    covers = {(im["context"].get("item_title") or "").lower(): im["src"]
              for im in ext["images"] if im["role"] == "video_cover"}
    vids = [{"title": v.get("caption") or v.get("title"), "url": v["src"],
             "platform": "Axopar CDN (media.ffycdn.net / Frontify DAM)", "format": v.get("ext"),
             "resolution": f"{v.get('width')}x{v.get('height')}" if v.get("width") else None,
             "description": None, "cover_image": covers.get((v.get("caption") or "").lower()),
             "source_page": ext["source_url"], "date": (v.get("created") or "")[:10] or None,
             "date_note": "fecha de alta en el DAM",
             "scope": "NOT_MODEL_SPECIFIC" if re.search(r"hull of fame", v["context"].get("block_title") or "", re.I)
             else "THIS_MODEL", "downloaded": False} for v in ext["videos"]]
    (model_dir / "05_MULTIMEDIA" / "VIDEOS").mkdir(parents=True, exist_ok=True)
    (model_dir / "05_MULTIMEDIA" / "VIDEOS" / "videos.json").write_text(
        json.dumps({"model": ident["model"], "policy": "Solo registro; no se descargan.", "videos": vids},
                   ensure_ascii=False, indent=2) + "\n")
    (model_dir / "06_DOCUMENTOS").mkdir(parents=True, exist_ok=True)
    (model_dir / "06_DOCUMENTOS" / "documents.json").write_text(json.dumps({
        "model": ident["model"],
        "documents": [
            {"id": "owner-manuals-portal", "title": "Portal oficial de manuales Axopar", "category": "MANUALS",
             "scope": "REQUIRES_REVIEW", "model_year": None, "source_id": "S1", "download_url": None,
             "source_page": "https://manuals.axopar.com/", "file": None,
             "download_status": "PENDING (identificar el manual del modelo y su MY en el portal)"},
            {"id": "configurator", "title": f"Configurador oficial Axopar ({ident['model']})", "category": "OTHER",
             "scope": "THIS_MODEL", "model_year": ext["model_year"], "source_id": "S1", "download_url": None,
             "source_page": "https://www.axopar.com/configurator/", "configurator_id": ext.get("configurator_id"),
             "file": None, "download_status": "N/A (herramienta web)"}],
        "not_found": [{"category": "BROCHURES", "detail": "No hay brochure del modelo en axopar.com."},
                      {"category": "PRICE_LIST", "detail": "La web no publica precio."}]},
        ensure_ascii=False, indent=2) + "\n")
    draft_path = drafts_dir / f"{slug}.json"
    draft = json.loads(draft_path.read_text()) if draft_path.exists() else None
    write_editorial(model_dir, ident, editorial_sources(ext), draft, images)
    write_features(model_dir, ident, ext)
    write_equipment(model_dir, ident, ext)
    write_model_md(model_dir, ident, ext, spec, images)
    return model_dir
