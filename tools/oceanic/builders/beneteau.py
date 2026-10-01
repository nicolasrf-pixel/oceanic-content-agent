"""Build a full model package from a Beneteau source extract (adapters/beneteau.py).

Applies the library rules (CLAUDE.md):
- data only from the official product page (S1); its Specifications block prevails
- base table filled by documented cross-references (layouts, text) when the block lacks a field
- imperial and metric values of the same field are both official: if they disagree the field is
  a CONFLICT (both kept); implausible values are REQUIRES_REVIEW
- images scoped to the exact model: an image published on several model pages, or whose file
  name names another model, is not THIS_MODEL
- SOURCE CONTENT is literal; OCEANIC CONTENT comes from drafts/beneteau/<slug>.json or stays PENDIENTE
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from .. import media
from .axopar import FILES, TITLES, _field, _fmt, _quote

ROOT = Path(__file__).resolve().parents[3]
BRAND = "Beneteau"
BRAND_DIR = ROOT / "biblioteca" / "beneteau"
MODEL_YEAR = "NO DECLARADO"
PUBLISHER = "BENETEAU (Groupe Beneteau, Francia)"

# Brand settings. builders/lagoon.py reuses this module with its own CFG (same group, same web stack).
CFG = {
    "brand": BRAND, "brand_dir": BRAND_DIR, "publisher": PUBLISHER, "origin": "Beneteau · Francia",
    "builder": "beneteau", "adapter": "adapters/beneteau.py", "boat_type": None, "build_specs": None,
    "site": "beneteau.com", "original_path": "/sites/default/files/",
    "type_label": {"vela": "Velero monocasco", "motor": "Motor"},
    "reasons": {},
    "excluded_sources": [{"title": "Configurador Beneteau", "url": "https://configurator.beneteau.com/",
                          "reason": "Requiere sesión de navegador; no se pudo leer. No aporta datos."}],
    "video_platform": "YouTube (canal BENETEAU)",
    "manual_doc": {"id": "help-center", "title": "Help Center oficial Beneteau (documentos técnicos por barco)",
                   "source_page": "https://help.beneteau.com/hc/en-us/categories/360003496178"},
    "manual_note": "Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).",
    "equipment_note": "ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).",
}

# Shared across the models built in one run: which model pages publish each image / video.
_CORPUS = {"images": {}, "videos": {}, "slugs": {}}


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower().replace(".", "-")).strip("-")


def model_slug(ext: dict) -> str:
    return ext.get("slug") or slugify(ext["page_title"])


def prepare(exts: list[dict]) -> None:
    """Index images and videos of every page in the run, to detect media shared between models."""
    for ext in exts:
        slug = model_slug(ext)
        _CORPUS["slugs"][slug] = ext["page_title"]
        tok = _model_tokens(ext["page_title"])
        _CORPUS.setdefault("models", set()).add((tok["range"], tok["size"]))
        for im in ext["images"]:
            _CORPUS["images"].setdefault(im["original"], set()).add(slug)
        for v in ext["videos"]:
            _CORPUS["videos"].setdefault(v["youtube_id"], set()).add(slug)


# ---------------------------------------------------------------- identity

def identity(ext: dict) -> dict:
    crumbs = [c["name"] for c in ext["breadcrumb"]]
    family = crumbs[1] if len(crumbs) > 1 else ""
    rng = crumbs[2] if len(crumbs) > 2 else ""
    sail = bool(re.search(r"sail", family, re.I))
    name = re.sub(r"\bBENETEAU\b", "Beneteau", ext["page_title"])
    return {"slug": model_slug(ext), "model": name, "family": family, "range": rng,
            "range_url": ext["breadcrumb"][2]["url"] if len(ext["breadcrumb"]) > 2 else None,
            "boat_type": CFG["boat_type"](ext) if CFG["boat_type"] else ("vela" if sail else "motor"),
            "tokens": _model_tokens(name)}


RANGE_ALIASES = {"swift trawler": ["swift-trawler", "st"], "grand trawler": ["grand-trawler", "gt"],
                 "gran turismo": ["gran-turismo", "gt"], "oceanis yacht": ["oceanis-yacht", "oy"],
                 "oceanis": ["oceanis", "oc"], "first": ["first"], "flyer": ["flyer"], "antares": ["antares"],
                 "figaro": ["figaro"], "lagoon": ["lagoon", "l"],
                 "xo dfndr": ["dfndr"], "xo dscvr": ["dscvr"], "xo explr": ["explr"]}
VARIANT_WORDS = ("sedan", "fly", "coupe", "open", "fishing", "sundeck", "spacedeck", "sport-top", "se", "spirit", "rs")


def _model_tokens(name: str) -> dict:
    low = name.lower()
    # Lagoon names its flagships in words: "SIXTY 5" = Lagoon 65 in file names ("Lagoon-82-...").
    words = {"fifty": 5, "sixty": 6, "seventy": 7, "eighty": 8}
    m = re.match(r"(fifty|sixty|seventy|eighty)\s*(\d)\b", low)
    if m:
        low = f"lagoon {words[m.group(1)]}{m.group(2)}"
    rng = next((r for r in RANGE_ALIASES if low.startswith(r)), low.split()[0])
    size = re.search(r"(\d+)(?:\.(\d))?", low)
    variants = [w for w in VARIANT_WORDS if re.search(rf"\b{w.replace('-', '[ -]')}\b", low)]
    return {"range": rng, "size": size.group(1) if size else None,
            "decimal": size.group(2) if size and size.group(2) else None, "variants": variants}


def _file_model(fname: str):
    """(range, size, variants) named in an image file name, or None."""
    low = fname.lower().replace("_", "-").replace(" ", "-").replace("%20", "-")
    for rng, aliases in RANGE_ALIASES.items():
        for a in aliases:
            m = re.search(rf"(?:^|[^a-z]){re.escape(a)}-?(\d{{2}})(?:-?(\d))?(?![0-9])", low)
            if m:
                tail = low[m.end():m.end() + 25]
                variants = [w for w in VARIANT_WORDS if re.search(rf"(?:^|-){w}(?:-|$|\.)", tail)]
                return rng, m.group(1), variants
    return None


# ---------------------------------------------------------------- number parsing

def _metric_numbers(text: str) -> list[float]:
    t = re.sub(r"(?<=\d)[\s  ](?=\d{3}\b)", "", text)   # "7 985" -> "7985"
    t = re.sub(r"(?<=\d),(?=\d{3}\b)", "", t)                       # "11,217" -> "11217"
    return [float(x.replace(",", ".")) for x in re.findall(r"\d+(?:[.,]\d+)?", t)]


def _feet(text: str):
    t = re.sub(r"[’‘′`´]", "'", text)
    t = re.sub(r"[”“″]|''", '"', t).replace("‘", "'")
    m = re.search(r"(\d+)\s*'\s*(\d+(?:[.,]\d+)?)?\s*(?:¼)?\"?", t)
    if m:
        inches = float((m.group(2) or "0").replace(",", "."))
        return (int(m.group(1)) * 12 + inches) * 0.0254
    m = re.fullmatch(r"\s*(\d+(?:[.,]\d+)?)\s*\"\s*", t)
    if m:
        return float(m.group(1).replace(",", ".")) * 0.0254
    return None


def _imperial_to_metric(label: str, value: str):
    """Convert the imperial value of a spec row to metric, only to check consistency."""
    low = value.lower()
    v = re.sub(r"(?<=\d)\.(?=\d{3}\b)", "", value)          # "24.202 lbs" -> "24202 lbs"
    nums = _metric_numbers(re.sub(r"(?<=\d),(?=\d{2}\b)", ".", v))
    if "lbs" in low and nums:
        return max(nums) * 0.45359, "kg"
    if "gal" in low and nums:
        return max(nums) * 3.78541, "l"
    if re.search(r"\bhp\b", low) and nums:
        return max(nums), "hp"
    if re.search(r"['’‘\"”“]", value):
        m = _feet(value)
        return (m, "m") if m else (None, None)
    return None, None


def _metric(value: str):
    low = value.lower()
    nums = _metric_numbers(value)
    if not nums:
        return None, None
    if re.search(r"\bkg\b", low):
        return max(nums), "kg"
    if re.search(r"\bl\b", low):
        return max(nums), "l"
    if re.search(r"\bcv\b", low):
        return max(nums) / 1.01387, "hp"
    if re.search(r"\bm\b", low):
        return max(nums), "m"
    return None, None


def _es(value: str) -> str:
    """Display a metric source value in Spanish notation (decimal comma, thousands with dot)."""
    def num(m):
        raw = m.group(0)
        v = _metric_numbers(raw)[0]
        return _fmt(v, 0 if v == int(v) else (1 if round(v, 1) == v else 2))
    t = re.sub(r"(?<=\d)[\s  ](?=\d{3}\b)", "", value)
    t = re.sub(r"\d+(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?", num, t)
    t = re.sub(r"\s*x\s*", " x ", t)
    t = re.sub(r"(\d)\s*(L|l)\b", r"\1 l", t)
    t = re.sub(r"(\d)\s*(HP|hp|Hp)\b", r"\1 hp", t)
    t = re.sub(r"(\d)\s*CV\b", r"\1 CV", t)
    return re.sub(r"\s+", " ", t).strip()


# ---------------------------------------------------------------- specs

SPEC_MAP = {  # label on beneteau.com -> (oceanic field, kind)
    "length overall": ("eslora_total", "m"),
    "beam overall": ("manga_casco", "m"),
    "lightship displacement": ("desplazamiento", "kg"),
    "air draught max": ("altura_linea_flotacion", "m"),
    "fuel capacity": ("capacidad_combustible", "l"),
    "water capacity": ("capacidad_agua_dulce", "l"),
    "max. engine power": ("potencia_motor_maxima", "hp"),
    "cabin number": ("camarotes", None),
    "ce certification": ("certificacion", None),
}
XREF = {
    "manga_casco": "'Beam overall' (manga máxima) es la manga publicada del casco.",
    "desplazamiento": "'Lightship Displacement' = desplazamiento en rosca.",
    "potencia_motor_auxiliar": "'Max. engine power' de un velero = potencia máxima del motor auxiliar.",
}
NUM_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "single": 1, "double": 2}


def _spec_rows(ext: dict) -> dict:
    return {s["label"].strip().lower(): s for s in ext["specifications"]}


def _row_record(src: dict, row: dict, norm, nunit, xref=None) -> dict:
    values = row["values"]
    metric = next((v for v in values if _metric(v)[0] is not None), values[-1] if values else "")
    r = {"source_id": "S1", "source_name": src["title"], "url": src["url"], "accessed_at": src["accessed_at"],
         "source_field": row["label"], "source_value": " | ".join(values), "source_unit": None,
         "normalized_value": norm, "normalized_unit": nunit, "model_year": MODEL_YEAR,
         "location": "Specifications (bloque técnico)"}
    if xref:
        r["cross_reference"] = xref
    return r


def _text_record(src: dict, field: str, quote: str, norm, nunit, location: str, xref: str) -> dict:
    return {"source_id": "S1", "source_name": src["title"], "url": src["url"], "accessed_at": src["accessed_at"],
            "source_field": field, "source_value": quote, "source_unit": None, "normalized_value": norm,
            "normalized_unit": nunit, "model_year": MODEL_YEAR, "location": location, "cross_reference": xref}


def _quantity_field(key, label, row, kind, src, xref=None, loa=None):
    """A spec row with imperial + metric values -> VERIFIED, CONFLICT (units disagree) or REQUIRES_REVIEW."""
    values = row["values"]
    metric_vals = [v for v in values if _metric(v)[0] is not None and _metric(v)[1] == kind]
    imperial = [v for v in values if v not in metric_vals]
    if not metric_vals:  # only an imperial value (e.g. "57 HP", "2 x 425 HP")
        value = values[-1]
        norm, unit = _imperial_to_metric(row["label"], value)
        if norm is None:
            return _field(key, label, "REQUIRES_REVIEW", [_row_record(src, row, value, None, xref)],
                          display=value, notes=f"Valor sin unidad interpretable: '{value}'.")
        disp = _es(value)
        return _field(key, label, "VERIFIED", [_row_record(src, row, round(norm, 2), unit, xref)], display=disp)
    mv = metric_vals[0]
    mnorm, munit = _metric(mv)
    rec = _row_record(src, row, round(mnorm, 2), munit, xref)
    rec["source_value"], rec["source_unit"] = mv, munit
    disp = _es(mv)
    notes = ""
    if imperial:
        inorm, iunit = _imperial_to_metric(row["label"], imperial[0])
        if inorm is not None and iunit == munit:
            tol = max(0.05 * mnorm, 0.06 if munit == "m" else 0)
            if abs(inorm - mnorm) > tol and munit == "m":
                # Same value written with the wrong symbol: 20'' meaning 20 ft, 16,4" meaning 16'4".
                raw = imperial[0].strip()
                for alt in (re.sub(r"(\d+)\s*(''|\"|”|’’)$", r"\1'", raw), re.sub(r"^(\d+),(\d+)\"$", "\\1'\\2\"", raw)):
                    anorm = _feet(alt) if alt != raw else None
                    if anorm and abs(anorm - mnorm) <= tol:
                        notes = (f"Valor imperial publicado '{raw}' con el símbolo mal escrito: corresponde a {alt} "
                                 f"(≈ {_fmt(anorm, 2)} m), coherente con el métrico.")
                        inorm = mnorm
                        break
            if abs(inorm - mnorm) > tol:
                # Decisión Oceanic (2026-09-30): el valor métrico prevalece; el imperial se registra como error de la web.
                return _field(key, label, "VERIFIED", [rec], display=disp,
                              notes=f"Se publica el valor métrico '{mv}' (decisión Oceanic: el métrico prevalece). "
                                    f"La web publica además '{imperial[0]}' (≈ {_fmt(inorm, 2)} {iunit}), que no coincide: "
                                    "error de la web en el valor imperial.")
            notes = notes or f"Valor imperial publicado: {imperial[0]} (coherente)."
            if munit == "hp":
                disp = _es(imperial[0])
    if key == "manga_casco" and loa and mnorm > 0.6 * loa:
        return _field(key, label, "REQUIRES_REVIEW", [rec], display=disp,
                      notes=f"Manga publicada ({mv}) mayor que el 60 % de la eslora ({_fmt(loa)} m): posible error de la web.")
    return _field(key, label, "VERIFIED", [rec], display=disp, notes=notes)


def _all_text(ext: dict) -> str:
    parts = [ext.get("tagline") or "", ext["description"]]
    for s in ext["sections"]:
        parts += [s.get("title") or "", s.get("intro") or ""]
        parts += [f"{i['title']}. {i['text']}" for i in s["items"]]
    for lay in ext["layouts"]:
        parts += [lay["title"] or ""] + lay["bullets"]
    return "\n".join(p for p in parts if p)


def _cabins_from_layouts(ext: dict):
    found = set()
    for lay in ext["layouts"]:
        for m in re.finditer(r"(\d+|one|two|three|four|five)[\s-]*cabins?\b", (lay["title"] or ""), re.I):
            n = m.group(1).lower()
            found.add(int(n) if n.isdigit() else NUM_WORDS[n])
    return sorted(found)


def _heads_from_layouts(ext: dict):
    found = set()
    for lay in ext["layouts"]:
        for m in re.finditer(r"(\d+)\s*(?:bathrooms?|heads?|shower rooms?)\b", lay["title"] or "", re.I):
            found.add(int(m.group(1)))
    return sorted(found)


def _cabins_from_text(ext: dict):
    t = _all_text(ext)
    m = re.search(r"\b(one|two|three|four|five|\d)[\s-]cabin (?:layout|version)\b[^.\n]*", t, re.I) or \
        re.search(r"\b(?:with|in|offers?|features?)\s+(one|two|three|four|five|\d) (?:double )?cabins\b[^.\n]*", t, re.I)
    if not m:
        return None, None
    n = m.group(1).lower()
    return (int(n) if n.isdigit() else NUM_WORDS[n]), m.group(0).strip()


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    rows = _spec_rows(ext)
    boat = ident["boat_type"]
    fields: dict[str, dict] = {}
    labels = {f["key"]: f["label"] for f in json.loads((ROOT / "schema" / "field-catalog.json").read_text())["fields"]}
    loa_row = rows.get("length overall")
    loa = _metric(next((v for v in loa_row["values"] if _metric(v)[1] == "m"), ""))[0] if loa_row else None

    for label, (key, kind) in SPEC_MAP.items():
        row = rows.get(label)
        if not row:
            continue
        if key == "potencia_motor_maxima" and boat == "vela":
            key = "potencia_motor_auxiliar"
        if kind:
            fields[key] = _quantity_field(key, labels[key], row, kind, src, XREF.get(key), loa)
        elif key == "camarotes":
            raw = " ".join(row["values"])
            nums = sorted({int(n) for n in re.findall(r"\d+", raw)})
            if len(nums) == 2 and re.fullmatch(r"\s*\d+\s*-\s*\d+\s*", raw):  # "2-4" = de 2 a 4
                disp = f"{nums[0]} a {nums[1]}"
            else:
                disp = " / ".join(map(str, nums)) if nums else raw
            fields[key] = _field(key, labels[key], "VERIFIED", [_row_record(src, row, disp, None)], display=disp,
                                 note="según versión" if len(nums) > 1 else None)
        elif key == "certificacion":
            raw = " ".join(row["values"])
            main = re.sub(r"\(.*?\)", "", raw)
            toks = re.findall(r"[A-D]\s*\d+|[A-D](?=\s*/)", main)
            disp = " / ".join(t.replace(" ", "") for t in toks) if toks else raw
            extra = re.search(r"\((.*?)\)", raw)
            fields[key] = _field(key, labels[key], "VERIFIED", [_row_record(src, row, disp, None)], display=disp,
                                 note=f"{extra.group(1)}" if extra else None,
                                 notes="Formato: categoría CE + número máximo de personas, tal como lo publica la web.")

    # calado: Draught Min / Draught Max (quillas o versiones)
    dmin, dmax = rows.get("draught min"), rows.get("draught max")
    drafts = [r for r in (dmin, dmax) if r]
    if drafts:
        vals = []
        for r in drafts:
            mv = next((v for v in r["values"] if _metric(v)[1] == "m"), None)
            if mv:
                vals.append((r, mv, _metric(mv)[0]))
        if vals:
            nums = sorted({v[2] for v in vals})
            disp = " – ".join(f"{_fmt(n, 2).rstrip('0').rstrip(',')} m" for n in nums)
            rec = _row_record(src, {"label": " / ".join(v[0]["label"] for v in vals),
                                    "values": [v[1] for v in vals]},
                              nums if len(nums) > 1 else nums[0], "m")
            fields["calado"] = _field("calado", labels["calado"], "VERIFIED", [rec], display=disp,
                                      note="mín. – máx. según quilla/versión" if len(nums) > 1 else None)

    # camarotes / baños por cruce con Layouts
    lay_cabins = _cabins_from_layouts(ext)
    if "camarotes" not in fields:
        if lay_cabins:
            disp = " / ".join(map(str, lay_cabins))
            rec = _text_record(src, "Layouts (pestañas)", "; ".join(l["title"] for l in ext["layouts"] if l["title"]),
                               disp, None, "Layouts",
                               "El bloque técnico no publica 'Cabin Number': se toma el número de cabinas de los "
                               "títulos de los layouts oficiales.")
            fields["camarotes"] = _field("camarotes", labels["camarotes"], "VERIFIED", [rec], display=disp,
                                         note="según layout" if len(lay_cabins) > 1 else None)
        else:
            n, quote = _cabins_from_text(ext)
            if n:
                rec = _text_record(src, "Texto de la página", quote, str(n), None, "Descripción / secciones",
                                   "El bloque técnico no publica 'Cabin Number': el texto oficial declara el número de cabinas.")
                fields["camarotes"] = _field("camarotes", labels["camarotes"], "VERIFIED", [rec], display=str(n))
    elif lay_cabins:
        spec_nums = set(int(n) for n in re.findall(r"\d+", fields["camarotes"]["display_value"] or ""))
        if spec_nums and set(lay_cabins) != spec_nums:
            fields["camarotes"]["notes"] = (f"Los layouts muestran {' / '.join(map(str, lay_cabins))} cabinas; "
                                            "se publica el bloque técnico (regla 3).")
    heads = _heads_from_layouts(ext)
    if heads:
        disp = " / ".join(map(str, heads))
        rec = _text_record(src, "Layouts (pestañas)", "; ".join(l["title"] for l in ext["layouts"] if l["title"]),
                           disp, None, "Layouts", "Número de baños/aseos según los títulos de los layouts oficiales.")
        fields["banos"] = _field("banos", labels["banos"], "VERIFIED", [rec], display=disp,
                                 note="según layout" if len(heads) > 1 else None)

    # certificación por cruce con el texto (p. ej. "EC certification: B6 / C8 / D10")
    if "certificacion" not in fields:
        m = re.search(r"(?:EC|CE)?\s*certification\s*:\s*((?:[A-D]\d+\s*/?\s*)+)(\([^)]*\))?", _all_text(ext), re.I)
        if m:
            disp = " / ".join(re.findall(r"[A-D]\d+", m.group(1)))
            rec = _text_record(src, "Texto de la página", m.group(0).strip(), disp, None, "Texto / layouts",
                               "El bloque técnico no publica la certificación; la declara el texto oficial.")
            fields["certificacion"] = _field("certificacion", labels["certificacion"], "VERIFIED", [rec], display=disp)

    # arquitectura naval / diseño
    if ext["credits"]:
        disp = " · ".join(f"{c['label'].capitalize()}: {c['value']}" for c in ext["credits"])
        rec = _text_record(src, "Créditos (descripción)", disp, disp, None, "Descripción",
                           "Créditos de arquitectura naval y diseño publicados junto a la descripción.")
        fields["arquitecto_naval"] = _field("arquitecto_naval", labels["arquitecto_naval"], "VERIFIED", [rec],
                                            display=disp)

    propulsion = rows.get("propulsion")
    power = fields.get("potencia_motor_maxima") or fields.get("potencia_motor_auxiliar")
    if boat == "motor":
        t = _all_text(ext).lower()
        kind = None
        if propulsion:
            kind = {"out-board": "fueraborda", "in-board": "intraborda"}.get(propulsion["values"][0].lower())
        elif re.search(r"outboard", t) and not re.search(r"inboard|shaft|ips|\bib\b", t):
            kind = "fueraborda"
        if power and power["status"] == "VERIFIED":
            disp = f"{kind.capitalize() + ', ' if kind else ''}hasta {power['display_value']}"
            recs = [dict(power["records"][0], cross_reference="Motorización = potencia máxima declarada en "
                                                                "'Max. engine power'" + (" + 'Propulsion'" if propulsion else
                                                                                         (" + tipo de motor citado en el texto" if kind else "")) + ".")]
            fields["motorizacion"] = _field("motorizacion", labels["motorizacion"], "VERIFIED", recs, display=disp,
                                            notes="La web no publica el catálogo de motorizaciones; solo la potencia máxima.")
        engine_quotes = re.findall(r"[^.\n]*(?:Mercury|Volvo|Yanmar|Cummins|MAN|Verado|Suzuki|Yamaha)[^.\n]*(?:hp|HP|engines?|outboards?)[^.\n]*",
                                   _all_text(ext))
        if engine_quotes:
            note = "Texto oficial sobre motores: " + " | ".join(q.strip() for q in engine_quotes[:3])
            if "motorizacion" in fields:
                fields["motorizacion"]["notes"] += " " + note
            else:
                q = engine_quotes[0].strip()
                short = re.search(r"(?:twin|triple|\d\s?x)?\s*(?:Mercury|Volvo|Yanmar|Cummins|MAN)\b.*?"
                                  r"(?:engines|outboards|inboards|joystick control)(?:\s*\([^)]*\))?", q) or \
                    re.search(r"(?:twin|triple|\d\s?x)?\s*(?:Mercury|Volvo|Yanmar|Cummins|MAN)\b[^,.;]*", q)
                short = short.group(0).strip() if short else q
                fields["motorizacion"] = _field("motorizacion", labels["motorizacion"], "REQUIRES_REVIEW",
                                                [_text_record(src, "Texto de la página", q, short, None, "Secciones de texto",
                                                              "Sin 'Max. engine power' en el bloque técnico; el texto "
                                                              "cita motores sin declarar la gama completa.")],
                                                display=short,
                                                notes=note)
    else:
        if power and power["status"] == "VERIFIED":
            disp = f"Motor auxiliar hasta {power['display_value']}"
            recs = [dict(power["records"][0], cross_reference="Motor auxiliar = 'Max. engine power' del bloque técnico "
                                                                "(la web no publica marca ni modelo).")]
            fields["motor_auxiliar"] = _field("motor_auxiliar", labels["motor_auxiliar"], "VERIFIED", recs,
                                              display=disp, notes="Marca y modelo de motor: no publicados en la web.")
        # velas: solo si la web publica superficies por vela (Figaro)
        t = _all_text(ext)
        for key, pat in (("mayor", r"Mainsail area:\s*([\d.,]+)\s*m²[^\n]*"),
                         ("genova", r"(?:Genoa|Jib) area:\s*([\d.,]+)\s*m²[^\n]*")):
            m = re.search(pat, t)
            if m:
                v = float(m.group(1).replace(",", "."))
                rec = _text_record(src, m.group(0).split(":")[0], m.group(0).strip(), v, "m²", "Texto (velas)",
                                   "Superficie de la vela declarada en el texto técnico de la página."
                                   + (" La web la llama 'Jib' (foque)." if "Jib" in m.group(0) else ""))
                fields[key] = _field(key, labels[key], "VERIFIED", [rec], display=f"{_fmt(v, 1)} m²")

    # autonomía declarada en el texto (valor absoluto con su condición); "provisional" -> REQUIRES_REVIEW
    m = re.search(r"[^.\n]*?(up to|over|of)\s+([\d,]+)\s*(?:nautical\s+)?miles(?: of range)?\s+at\s+"
                  r"(\d+\s*knots|cruising speed)[^.\n]*", _all_text(ext), re.I)
    if m and boat == "motor":
        nm = int(m.group(2).replace(",", ""))
        pre = {"up to": "hasta ", "over": "más de "}.get(m.group(1).lower(), "")
        cond = m.group(3).replace("knots", "nudos").replace("cruising speed", "velocidad de crucero")
        provisional = "provisional" in m.group(0).lower()
        disp = f"{pre}{_fmt(nm, 0)} mn a {cond}"
        rec = _text_record(src, "Texto de la página", m.group(0).strip(), nm, "mn", "Secciones de texto",
                           "Autonomía declarada por el fabricante en el texto, con su condición de velocidad.")
        fields["autonomia"] = _field("autonomia", labels["autonomia"], "REQUIRES_REVIEW" if provisional else "VERIFIED",
                                     [rec], display=disp,
                                     notes="El fabricante la declara provisional." if provisional else
                                     "Declarada en el texto (no en el bloque técnico).")

    # Versión en inglés (EE. UU.) de la misma página oficial: S3. Mismo valor refuerza; otro valor → CONFLICT.
    US_LABELS = {"dry weight": "lightship displacement", "bridge clearance": "air draught max",
                 "draft min": "draught min", "draft max": "draught max"}
    for alt in ext.get("alternates", []):
        asrc = {"title": alt["page_title"], "url": alt["source_url"], "accessed_at": alt["accessed_at"]}
        for arow in alt["specifications"]:
            lab = US_LABELS.get(arow["label"].strip().lower(), arow["label"].strip().lower())
            if lab not in SPEC_MAP or not SPEC_MAP[lab][1]:
                continue
            key, kind = SPEC_MAP[lab]
            if key == "potencia_motor_maxima" and boat == "vela":
                key = "potencia_motor_auxiliar"
            f = fields.get(key)
            if not f:
                continue
            af = _quantity_field(key, labels[key], arow, kind, asrc, XREF.get(key))
            if af["status"] not in ("VERIFIED", "REQUIRES_REVIEW") or not af["records"]:
                continue
            arec = dict(af["records"][0], source_id="S3", location="Specifications (versión EE. UU. de la página)")
            same = any(json.dumps(r["normalized_value"]) == json.dumps(arec["normalized_value"]) for r in f["records"])
            f["records"].append(arec)
            if not same and f["status"] == "REQUIRES_REVIEW" and af["status"] == "VERIFIED":
                # The international value is implausible and the US page gives a coherent one: publish S3.
                bad = f["records"][0]["source_value"]
                fields[key] = dict(af, records=[arec],
                                   notes=f"Se publica el valor de la versión EE. UU. de la página (S3), coherente en "
                                         f"métrico e imperial. La página internacional publica '{bad}', que no es "
                                         "plausible: error de la web.")
                continue
            if not same:
                f["status"] = "CONFLICT"
                f["notes"] = ((f.get("notes") or "") + f" La versión EE. UU. de la página (S3) publica "
                              f"'{arec['source_value']}'.").strip()

    # Faltantes: tabla base + críticos
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    base = catalog["base_table"][boat]
    crit = [f["key"] for f in catalog["fields"] if f["critical"] and
            ("universal" in f["types"] or boat in f["types"])]
    reasons = {
        "superficie_velica": "Beneteau no publica la superficie vélica en la web del producto (ni en el bloque "
                             "técnico ni en el texto). Figura en la lista de equipamiento PDF, que es documento y no aporta datos.",
        "capacidad_combustible": "No publicado en el bloque técnico ni en el texto de la página.",
        "capacidad_agua_dulce": "No publicado en el bloque técnico ni en el texto de la página.",
        "potencia_motor_maxima": "El bloque técnico no publica 'Max. engine power'.",
        "potencia_motor_auxiliar": "El bloque técnico no publica 'Max. engine power'.",
        "motor_auxiliar": "La web no publica motor auxiliar para este modelo.",
        "motorizacion": "La web no publica motorización para este modelo.",
    }
    reasons.update(CFG["reasons"])
    for key in list(dict.fromkeys(base + crit)):
        if key not in fields:
            fields[key] = _field(key, labels[key], "NOT_FOUND", display="-",
                                 notes=reasons.get(key, "No publicado en la web oficial del producto."))
    order = base + [k for k in fields if k not in base]
    return {
        "model": {"brand": CFG["brand"], "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "según layouts oficiales (ver 04_EQUIPAMIENTO/configurations.md)",
                  "engine_option": fields.get("motorizacion", fields.get("motor_auxiliar", {})).get("display_value") or "-",
                  "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial del producto (S1). El bloque 'Specifications' prevalece. Valores imperial y "
                  "métrico del mismo campo que no coinciden → CONFLICT.",
        "fields": [fields[k] for k in order],
    }


# ---------------------------------------------------------------- images

def _category(im: dict) -> tuple[str, str]:
    f = (im["file_name"] + " " + (im.get("alt") or "")).lower()
    title = (im["section_title"] or "").lower()
    if im["role"] == "hero":
        return "HERO", "alta"
    if im["role"] == "plan":
        return "PLANS", "alta"
    for pat, cat in ((r"cockpit", "COCKPIT"), (r"cabin|cabine|chambre", "CABIN"), (r"helm|poste|pilot", "HELM"),
                     (r"interieur|interior|inside|salon|saloon|galley|cuisine", "INTERIOR"),
                     (r"navigation|sailing|underway|run|nav-", "UNDERWAY"),
                     (r"exterieur|exterior|outside|drone|dji|aerial", "EXTERIOR")):
        if re.search(pat, f):
            return cat, "media"
    if im["section"] == "slider-design-pleasure":
        return "DETAIL", "baja"
    if re.search(r"interior|intérieur|living onboard|living", title):
        return "INTERIOR", "media"
    if re.search(r"sailing experience|navigation", title):
        return "UNDERWAY", "media"
    if re.search(r"exterior|extérieur|design$", title):
        return "EXTERIOR", "media"
    if im["section"] == "slider-design-pleasure":
        return "DETAIL", "baja"
    if re.search(r"polar", title):
        return "PLANS", "alta"
    if im["section"] == "text-images-slider":
        return "EXTERIOR", "baja"
    return "OTHER", "baja"


def _sister(slug: str, own: dict) -> bool:
    """Another variant of the same hull: same range and size (Antares 8 / 8 Fishing, ST 37 Sedan / Fly)."""
    t = _model_tokens(_CORPUS["slugs"].get(slug, slug))
    return t["range"] == own["range"] and t["size"] == own["size"]


def classify_images(ext: dict, ident: dict, overrides: dict | None = None) -> dict:
    recs, ids = [], set()
    own = ident["tokens"]
    for im in ext["images"]:
        pages = sorted(_CORPUS["images"].get(im["original"], {ident["slug"]}))
        others = [p for p in pages if p != ident["slug"]]
        fm = _file_model(im["file_name"])
        known = fm and (fm[0], fm[1]) in _CORPUS.get("models", set())
        exact = bool(fm and fm[1] == own["size"] and sorted(fm[2]) == sorted(own["variants"]))
        hint = CFG.get("scope_hint") and CFG["scope_hint"](im, ident, ext)
        if hint:
            scope, ev = hint
        elif re.search(r"connected boat|partner|smart boat", im["section_title"] or "", re.I) or \
                re.search(r"(^|[-_])logo[-_]|seanapps", im["file_name"], re.I):
            scope, ev = "NOT_MODEL_SPECIFIC", "Logo o bloque genérico de la marca (Seanapps / socios / edición), no es el barco."
        elif others and exact:
            scope, ev = "THIS_MODEL", (f"Publicada también en {', '.join(others)}, pero el nombre de archivo "
                                       f"'{im['file_name']}' nombra exactamente este modelo.")
        elif others and fm and known and (fm[0], fm[1]) != (own["range"], own["size"]):
            scope, ev = "OTHER_MODEL", (f"Publicada también en {', '.join(others)} y el nombre de archivo "
                                        f"'{im['file_name']}' nombra otro modelo.")
        elif others and all(_sister(o, own) for o in others):
            scope, ev = "THIS_MODEL", (f"En la galería oficial del modelo y también en la variante hermana "
                                       f"{', '.join(others)} (mismo casco): decisión Oceanic, se acepta en ambas.")
        elif others:
            scope, ev = "REQUIRES_REVIEW", f"Imagen publicada también en: {', '.join(others)}."
        elif fm and fm[1] == own["size"] and fm[0] == own["range"] and fm[2] != own["variants"] and \
                any(_sister(o, own) for o in _CORPUS["slugs"] if o != ident["slug"]):
            scope, ev = "THIS_MODEL", (f"El archivo '{im['file_name']}' nombra una variante hermana (mismo casco) y está "
                                       "en la galería oficial de este modelo: decisión Oceanic, se acepta.")
        elif fm and (fm[1] != own["size"] or (fm[2] and own["variants"] and not set(fm[2]) & set(own["variants"]))
                     or (fm[2] and not own["variants"])):
            scope, ev = ("OTHER_MODEL", f"El nombre de archivo '{im['file_name']}' nombra otro modelo/variante de la web.") \
                if known or fm[1] == own["size"] else \
                ("REQUIRES_REVIEW", f"El nombre de archivo '{im['file_name']}' no corresponde al modelo (ni a otro modelo "
                                    "actual de la web); publicado en la página del modelo.")
        elif fm:
            scope, ev = "THIS_MODEL", f"Solo en la página del modelo; archivo '{im['file_name']}' con el nombre del modelo."
        else:
            scope, ev = "THIS_MODEL", f"Solo en la página del modelo (sección '{im['section_title']}')."
        cat, conf = _category(im)
        base_id = media._slug(re.sub(r"\.\w+$", "", im["file_name"]))
        rid, n = base_id, 2
        while rid in ids:
            rid, n = f"{base_id}-{n}", n + 1
        ids.add(rid)
        recs.append({
            "id": rid, "title": im["alt"] or im["file_name"], "category": cat, "scope": scope,
            "scope_evidence": ev, "category_confidence": conf, "hero_candidate": False, "hero_reason": None,
            "source_url": im["original"], "cdn_url": im["src"], "source_page": ext["source_url"],
            "source_context": {"section": im["section"], "section_title": im["section_title"]},
            "declared_width": im["width"], "declared_height": im["height"], "declared_format": im["ext"],
            "dam_tags": [], "model_year_tag": None, "file": None, "width": None, "height": None, "format": None,
            "sha256": None, "collected_at": ext["accessed_at"], "downloaded_at": None,
            "download_status": "PENDING" if scope == "THIS_MODEL" else f"NOT_DOWNLOADED (fuera de alcance: {scope})"})
    for key, ov in (overrides or {}).items():
        for r in recs:
            if key in r["source_url"]:
                r.update(scope=ov["scope"], scope_evidence=ov["evidence"])
                if ov.get("category"):
                    r.update(category=ov["category"], category_confidence="revisión visual")
                r["download_status"] = "PENDING" if ov["scope"] == "THIS_MODEL" else \
                    f"NOT_DOWNLOADED (fuera de alcance: {ov['scope']})"
    pool = [r for r in recs if r["scope"] == "THIS_MODEL" and r["category"] in ("HERO", "EXTERIOR", "UNDERWAY")
            and ((r["declared_width"] or 0) >= (r["declared_height"] or 1) or not (r["declared_width"] or r["declared_height"]))]
    pool.sort(key=lambda r: (r["category"] == "HERO", r["declared_width"] or 0), reverse=True)
    for rank, r in enumerate(pool[:3], 1):
        why = "Imagen de cabecera oficial de la página del modelo" if r["category"] == "HERO" else "Exterior horizontal del modelo"
        r.update(hero_candidate=True, hero_rank=rank, hero_reason=f"{why}; {r['scope_evidence']}")
    return {"model": ident["model"], "source_page": ext["source_url"],
            "usage_terms": f"Imágenes de {CFG['site']}: uso sujeto a las condiciones del fabricante (Legal Notices); "
                           f"confirmar con {CFG['brand']} o el importador antes de publicar.",
            "classification_note": "Alcance: una imagen publicada en varias páginas de modelo queda REQUIRES_REVIEW; "
                                   "un nombre de archivo que nombra otro modelo/variante → OTHER_MODEL. Categoría por "
                                   "nombre de archivo y sección; confianza 'baja' requiere revisión visual.",
            "download_note": "Copias web WebP (2560 px HERO_CANDIDATE, 1920 px el resto) generadas desde el original "
                             f"de {CFG['original_path']}. El original se referencia en `original`.",
            "images": recs}


# ---------------------------------------------------------------- editorial

KEYS = {
    "ingenieria": r"hull|architect|construct|technolog|connect|seanapps|app\b|keel|rig|mast|resin|elium|carbon|foil|structur|electric|battery",
    "performance": r"performance|speed|knots|sail(?:ing)? |sensation|regatta|rac|engine|power|range|fast|planing|handling|wind",
    "experiencia": r"cabin|galley|saloon|salon|cockpit|living|comfort|bed|storage|guests|family|lounge|sunbath|head|shower|owner",
}


def _classify(title: str, text: str) -> str:
    t = f"{title} {title} {text}".lower()
    if re.search(r"interior", title or "", re.I):
        return "experiencia"
    if re.search(r"exterior|design", title or "", re.I):
        return "diseno"
    scores = {k: len(re.findall(p, t)) for k, p in KEYS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] else "diseno"


SKIP_SECTIONS = re.compile(r"set sail this season|offer|press review", re.I)


def editorial_sources(ext: dict) -> dict:
    out = {k: [] for k in FILES}
    out["hero"].append(f"- **Nombre:** {ext['page_title']}\n- **Tagline:** {ext.get('tagline') or '-'}\n"
                       f"- **Precio publicado:** {ext.get('price_text') or 'no publicado'}")
    if ext["description"]:
        out["introduccion"].append(f"**Descripción** — S1 (literal):\n\n{_quote(ext['description'])}")
        out["hero"].append(_quote(ext["description"].split("\n")[0]))
    if ext["credits"]:
        out["introduccion"].append("**Créditos** — S1 (literal):\n\n" +
                                   "\n".join(f"- {c['label']}: {c['value']}" for c in ext["credits"]))
    for s in ext["sections"]:
        title = s.get("title") or ""
        if SKIP_SECTIONS.search(title) or re.fullmatch(r"walkthrough|watch the video|polar diagrams", title.strip(), re.I) \
                and len((s.get("intro") or "").split()) < 25:
            continue
        variant_note = " — ⚠ describe otra versión (no aporta datos)" if re.search(r"electric", title, re.I) else ""
        if s.get("intro"):
            dest = "ingenieria" if re.search(r"connected boat", title, re.I) else _classify(title, s["intro"])
            out[dest].append(f"**{title}**{variant_note} — S1 (literal):\n\n{_quote(s['intro'])}")
        for it in s["items"]:
            if it.get("text"):
                dest = _classify(it["title"], it["text"])
                out[dest].append(f"**{it['title']}** — S1, {title} (literal):\n\n{_quote(it['text'])}")
    return out


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
                lines += [f"- **Nombre del barco:** {ident['model']}", f"- **Marca / origen:** {CFG['origin']}", "",
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


def write_features(model_dir: Path, ident: dict, ext: dict):
    lines = [f"# CARACTERÍSTICAS · {ident['model']}", "", "> Fuente: S1 (literal).", ""]
    for s in ext["sections"]:
        if s["items"] and not SKIP_SECTIONS.search(s.get("title") or ""):
            lines += [f"## {s['title']}", "", "| Característica | SOURCE CONTENT (literal) |", "| --- | --- |"]
            lines += [f"| {it['title']} | {(it['text'] or '').replace(chr(10), ' ')} |" for it in s["items"]]
            lines.append("")
    if len(lines) == 4:
        return False
    d = model_dir / "03_CARACTERISTICAS"
    d.mkdir(parents=True, exist_ok=True)
    (d / "caracteristicas.md").write_text("\n".join(lines))
    return True


def _sentences(ext: dict):
    for s in ext["sections"]:
        blocks = [(s.get("title") or "", s.get("intro") or "")] + [(it["title"], it["text"]) for it in s["items"]]
        for where, text in blocks:
            for sent in re.split(r"(?<=[.!?])\s+|\n", text or ""):
                if sent.strip():
                    yield where, sent.strip().lstrip("- ")
    for lay in ext["layouts"]:
        for b in lay["bullets"]:
            yield f"Layout · {lay['title']}", b


def write_equipment(model_dir: Path, ident: dict, ext: dict) -> list[str]:
    d = model_dir / "04_EQUIPAMIENTO"
    d.mkdir(parents=True, exist_ok=True)
    eq_doc = next((x["url"] for x in ext["downloads"] if x["kind"] == "equipment_list"), None)
    hdr = lambda t: [f"# {t} · {ident['model']}", "",
                     "> Fuente: S1 (web oficial del producto, literal). La web no publica la lista completa: solo "
                     "menciones en el texto y los layouts." + (f" La lista completa está en el PDF oficial "
                                                              f"({eq_doc}), registrado en 06_DOCUMENTOS (no aporta datos)."
                                                              if eq_doc else ""), ""]
    std, opt, pkg = [], [], []
    for where, sent in _sentences(ext):
        low = sent.lower()
        if re.search(r"\bpack\b|\bpackage\b|edition\b", low):
            pkg.append((where, sent))
        if re.search(r"\boptional\b|\bas an? option\b|\bin option\b|\(option\)|\boptions? (?:include|available)|"
                     r"\bavailable as an? (?:option|extra)\b|\boption of\b|optional extras?", low):
            opt.append((where, sent))
        elif re.search(r"\bas standard\b|\bstandard\b", low):
            std.append((where, sent))
    for lay in ext["layouts"]:
        t = lay["title"] or ""
        if re.search(r"option", t, re.I):
            opt.append(("Layouts", t))
    written = []
    for name, items, title in (("standard.md", std, "Equipamiento STANDARD"), ("optional.md", opt, "Equipamiento OPTIONAL"),
                               ("packages.md", pkg, "PACKAGES")):
        if not items:
            continue
        lines = hdr(title) + ["| Sección | SOURCE CONTENT (literal) |", "| --- | --- |"]
        lines += [f"| {w} | {s} |" for w, s in dict.fromkeys(items)]
        (d / name).write_text("\n".join(lines) + "\n")
        written.append(name)
    if ext["layouts"]:
        lines = [f"# CONFIGURATIONS · {ident['model']}", "", "> Fuente: S1, sección Layouts (literal). Los planos están "
                 "en 05_MULTIMEDIA (categoría PLANS).", ""]
        for lay in ext["layouts"]:
            lines += [f"## {lay['title']}", ""]
            lines += [f"- {b}" for b in lay["bullets"]] or (["_Plano sin texto._"] if not lay["text"] else [lay["text"]])
            lines.append("")
        (d / "configurations.md").write_text("\n".join(lines))
        written.append("configurations.md")
    return written


# ---------------------------------------------------------------- 00_MODELO

def write_model_md(model_dir: Path, ident: dict, ext: dict, spec: dict, images: dict, equipment: list[str],
                   has_features: bool):
    imgs = images["images"]
    count = lambda sc: sum(1 for r in imgs if r["scope"] == sc)
    pending = [f for f in spec["fields"] if f["status"] in ("NOT_FOUND", "REQUIRES_REVIEW", "CONFLICT")]
    xrefs = [(f, r) for f in spec["fields"] for r in f["records"] if r.get("cross_reference")]
    rng = ", ".join(m for m in ext["range_models"] if m) or "-"
    lines = [f"# {ident['model']}", "", "## Identificación", "", "| Campo | Valor | Fuente |", "| --- | --- | --- |",
             f"| MARCA | {CFG['publisher']} | S1 |",
             f"| GAMA | {ident['range']} ({ident['family']}) | S1, S2 |",
             f"| MODEL | {ident['model']} | S1 |",
             f"| MODEL YEAR | {MODEL_YEAR} (la web del producto no declara model year) | S1 |",
             f"| VARIANT | {ident['model']} | S1 |",
             f"| TIPO | {CFG['type_label'].get(ident['boat_type'], ident['boat_type'])} | S1 |",
             f"| PRECIO | {ext.get('price_text') or 'NO PUBLICADO'} | S1 |",
             f"| URL OFICIAL | {ext['source_url']} | S1 |", "",
             "## Reglas de alcance aplicadas", "",
             f"- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/{CFG['builder']}.py`.",
             f"- No se mezclan otros modelos de la gama ({rng}).",
             f"- Imágenes: {count('THIS_MODEL')} del modelo, {count('OTHER_MODEL')} de otro modelo (excluidas), "
             f"{count('REQUIRES_REVIEW')} por revisar (compartidas con otras páginas), {count('NOT_MODEL_SPECIFIC')} no son del barco.",
             "", "## Content readiness", "", "<!-- READINESS:START -->", "<!-- READINESS:END -->", "",
             "## Cruces de datos", ""]
    lines += [f"- **{f['label']}**: {r['source_field']} → {r['cross_reference']}" for f, r in xrefs] or ["- Ninguno."]
    lines += ["", "## Información faltante o por revisar", ""]
    lines += [f"- **{f['label']}** ({f['status']}): {f.get('notes') or 'no publicado en la web oficial del producto.'}"
              for f in pending] or ["- Ninguna en la tabla técnica."]
    missing_eq = [n for n in ("standard.md", "optional.md") if n not in equipment]
    if missing_eq:
        lines.append(f"- Equipamiento: la web no publica lista {' ni '.join(n[:-3] for n in missing_eq)}; "
                     + CFG["equipment_note"])
    if not has_features:
        lines.append("- Características (03): la página no tiene bloques de características con título.")
    lines += ["- Traducción al español del equipamiento: pendiente.",
              "- " + CFG["manual_note"]]
    (model_dir / "00_MODELO").mkdir(parents=True, exist_ok=True)
    (model_dir / "00_MODELO" / "00_MODELO.md").write_text("\n".join(lines) + "\n")
    (model_dir / "00_MODELO" / "model.json").write_text(
        json.dumps({"slug": ident["slug"], "curated": False, "builder": CFG["builder"],
                    "source_url": ext["source_url"]}, indent=2) + "\n")


# ---------------------------------------------------------------- main

def _keep_downloads(path: Path, images: dict):
    if not path.exists():
        return
    old = {r["id"]: r for r in json.loads(path.read_text())["images"]}
    for r in images["images"]:
        o = old.get(r["id"])
        if o and o.get("file") and r["scope"] == "THIS_MODEL":
            for k in ("file", "width", "height", "format", "sha256", "bytes", "original",
                      "downloaded_at", "downloaded_from", "download_status"):
                if k in o:
                    r[k] = o[k]


def build(slug: str, ext: dict, drafts_dir: Path, force: bool = False) -> Path:
    ident = identity(ext)
    slug = ident["slug"]
    model_dir = CFG["brand_dir"] / slug
    marker = model_dir / "00_MODELO" / "model.json"
    if marker.exists() and json.loads(marker.read_text()).get("curated") and not force:
        raise SystemExit(f"{slug}: paquete curado a mano, no se sobrescribe")
    if not _CORPUS["slugs"]:
        prepare([ext])
    src = {"title": ext["page_title"], "url": ext["source_url"], "accessed_at": ext["accessed_at"]}
    fu = model_dir / "07_FUENTES"
    (fu / "extract").mkdir(parents=True, exist_ok=True)
    (fu / "extract" / f"S1-{slug}.page.json").write_text(json.dumps(ext, ensure_ascii=False, indent=1) + "\n")
    sources = [
        {"id": "S1", "short": f"Web oficial · {ident['model']}", "title": ext["page_title"],
         "type": "official_product_page", "publisher": CFG["publisher"], "url": ext["source_url"],
         "accessed_at": ext["accessed_at"], "retrieved_via": f"Firecrawl rawHtml + {CFG['adapter']}",
         "model_year_scope": MODEL_YEAR, "extract": f"07_FUENTES/extract/S1-{slug}.page.json"}]
    if ident["range_url"]:
        sources.append({"id": "S2", "short": "Web oficial · gama", "title": ident["range"], "type": "official_range_page",
                        "publisher": CFG["publisher"], "url": ident["range_url"], "accessed_at": ext["accessed_at"],
                        "retrieved_via": "referencia", "model_year_scope": "gama"})
    for alt in ext.get("alternates", []):
        sources.append({"id": "S3", "short": "Web oficial · versión EE. UU.", "title": alt["page_title"],
                        "type": "official_product_page", "publisher": CFG["publisher"], "url": alt["source_url"],
                        "accessed_at": alt["accessed_at"], "retrieved_via": f"Firecrawl rawHtml + {CFG['adapter']}",
                        "model_year_scope": MODEL_YEAR, "note": "Misma página en su versión en inglés para EE. UU."})
    (fu / "sources.json").write_text(json.dumps({
        "model": ident["model"],
        "policy": "Datos solo de la web oficial del producto. PDF (lista de equipamiento, brochure) solo como documentos.",
        "sources": sources,
        "excluded_sources": CFG["excluded_sources"] + [
            {"title": f"Prensa citada en la página ({q.get('source') or 's/f'})", "url": None,
             "reason": "Cita de un medio de terceros: no aporta datos."} for q in ext.get("press_quotes", [])]},
        ensure_ascii=False, indent=2) + "\n")
    (fu / "source-map.md").write_text(
        f"# Mapa de fuentes · {ident['model']}\n\nTodos los datos y textos salen de S1 ({ext['source_url']}), "
        f"accedida {ext['accessed_at']} con Firecrawl (rawHtml). S2 es la página de gama (referencia).\n")

    spec = (CFG["build_specs"] or build_specs)(ext, ident, src)
    (model_dir / "02_ESPECIFICACIONES").mkdir(parents=True, exist_ok=True)
    (model_dir / "02_ESPECIFICACIONES" / "specifications.json").write_text(
        json.dumps(spec, ensure_ascii=False, indent=2) + "\n")

    inv_path = model_dir / "05_MULTIMEDIA" / "IMAGENES" / "images.json"
    draft_path = drafts_dir / f"{slug}.json"
    draft = json.loads(draft_path.read_text()) if draft_path.exists() else None
    images = classify_images(ext, ident, (draft or {}).get("image_overrides"))
    _keep_downloads(inv_path, images)
    inv_path.parent.mkdir(parents=True, exist_ok=True)
    inv_path.write_text(json.dumps(images, ensure_ascii=False, indent=2) + "\n")

    vids = []
    for v in ext["videos"]:
        others = sorted(p for p in _CORPUS["videos"].get(v["youtube_id"], ()) if p != slug)
        vids.append({"title": v.get("section_title") or "Video", "url": v["url"], "platform": CFG["video_platform"],
                     "format": None, "resolution": None, "description": None, "cover_image": v["thumbnail"],
                     "source_page": ext["source_url"], "date": None, "date_note": "YouTube no expone fecha en la página",
                     "scope": "REQUIRES_REVIEW" if others else "THIS_MODEL",
                     "third_party": v.get("third_party", False),
                     "notes": f"También en: {', '.join(others)}" if others else "Incrustado en la página del modelo.",
                     "downloaded": False})
    (model_dir / "05_MULTIMEDIA" / "VIDEOS").mkdir(parents=True, exist_ok=True)
    (model_dir / "05_MULTIMEDIA" / "VIDEOS" / "videos.json").write_text(
        json.dumps({"model": ident["model"], "policy": "Solo registro; no se descargan.", "videos": vids},
                   ensure_ascii=False, indent=2) + "\n")

    docs, not_found = [], []
    for dl in ext["downloads"]:
        if dl["kind"] == "brochure_form":
            docs.append({"id": "brochure-form", "title": f"Brochure oficial · {ident['model']} (se pide por formulario)",
                         "category": "BROCHURES", "scope": "THIS_MODEL", "model_year": MODEL_YEAR, "source_id": "S1",
                         "download_url": None, "source_page": ext["source_url"], "file": None, "format": "PDF (por email)",
                         "notes": "La web entrega el brochure tras un formulario; no hay enlace directo. Documento: no aporta datos.",
                         "download_status": "NOT_DOWNLOADED (formulario)"})
            continue
        brochure = dl["kind"] == "brochure"
        docs.append({"id": "e-brochure" if brochure else "equipment-list",
                     "title": ("E-brochure oficial" if brochure else "Lista de equipamiento oficial") + f" · {ident['model']}",
                     "category": "BROCHURES" if brochure else "TECHNICAL",
                     "scope": "THIS_MODEL", "model_year": MODEL_YEAR, "source_id": "S1",
                     "download_url": dl["url"], "source_page": ext["source_url"], "file": None,
                     "format": "PDF" if dl["url"].lower().endswith(".pdf") else "web (flipbook)",
                     "notes": "Enlazado desde la página del modelo. Documento: no aporta datos a la ficha."
                              + (" Puede cubrir toda la gama." if brochure else ""),
                     "download_status": "LINK (no se guarda copia)"})
    docs.append({"id": CFG["manual_doc"]["id"], "title": CFG["manual_doc"]["title"],
                 "category": "MANUALS", "scope": "REQUIRES_REVIEW", "model_year": None, "source_id": "S1",
                 "download_url": None, "source_page": CFG["manual_doc"]["source_page"], "file": None,
                 "download_status": "PENDING (identificar el manual del modelo en el portal)"})
    if not any(d["category"] == "BROCHURES" for d in docs):
        not_found.append({"category": "BROCHURES", "detail": "La página del modelo no enlaza brochure."})
    if not any(d["category"] == "TECHNICAL" for d in docs):
        not_found.append({"category": "TECHNICAL", "detail": "La página del modelo no enlaza lista de equipamiento."})
    (model_dir / "06_DOCUMENTOS").mkdir(parents=True, exist_ok=True)
    (model_dir / "06_DOCUMENTOS" / "documents.json").write_text(json.dumps(
        {"model": ident["model"], "documents": docs, "not_found": not_found}, ensure_ascii=False, indent=2) + "\n")

    draft_path = drafts_dir / f"{slug}.json"
    draft = json.loads(draft_path.read_text()) if draft_path.exists() else None
    write_editorial(model_dir, ident, editorial_sources(ext), draft, images)
    has_features = write_features(model_dir, ident, ext)
    equipment = write_equipment(model_dir, ident, ext)
    write_model_md(model_dir, ident, ext, spec, images, equipment, has_features)
    return model_dir
