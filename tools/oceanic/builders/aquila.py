"""Build a full model package from an Aquila source extract (adapters/aquila.py).

Aquila is not part of Groupe Beneteau, but its pages give the same extract shape, so the package writer
is builders/beneteau.py run with Aquila's settings (CFG). Aquila's spec tables use different labels per
model ("Dry Weight", "Light Displacement", "Light Ship Displacement"...), mapped here by patterns.
Images are scoped with the HubSpot folder of each file ("hubfs/46 Yacht/..."): the model's own folder
→ THIS_MODEL, another model's folder → OTHER_MODEL.
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
    "brand": "Aquila", "brand_dir": ROOT / "biblioteca" / "aquila",
    "publisher": "Aquila (Aquila USA Inc. / MarineMax, EE. UU.)", "origin": "Aquila · EE. UU.",
    "builder": "aquila", "adapter": "adapters/aquila.py",
    "boat_type": lambda ext: "catamaran_vela" if "Sail" in ext["page_title"] else "catamaran_motor",
    "type_label": {"catamaran_vela": "Catamarán a vela", "catamaran_motor": "Catamarán a motor"},
    "excluded_sources": [{"title": "Evaluaciones de terceros y testimonios de propietarios en la página", "url": None,
                          "reason": "Contenido de terceros (BoatTEST, NautiStyles, propietarios): no aporta datos."}],
    "video_platform": "YouTube",
    "manual_doc": {"id": "owners", "title": "Documentación de propietario Aquila", "source_page": "https://www.aquilaboats.com/"},
    "manual_note": "Manual del propietario: no publicado en la web del producto.",
    "equipment_note": "la web publica la ficha 'Spec Sheet' en PDF (documento, no aporta datos).",
})

# (pattern on the lowercased label, oceanic field, kind). First match wins; order matters.
SPEC_MAP = [
    (r"length overall( w/ outboards)?", "eslora_total", "m"),
    (r"hull length", "eslora_casco", "m"),
    (r"beam( overall)?$", "manga_casco", "m"),
    (r"(max draft|draft|hull draft \((motors|outboards|inboards) down\)?|draft with outboards down)$", "calado", "m"),
    (r"height above waterline.*|bridgedeck clearance", None, None),
    (r"(light displacement|light ship displacement|dry weight)", "desplazamiento", "kg"),
    (r"(tankage · )?(fuel tank|fuel capacity|fuel \(standard tanks\)).*", "capacidad_combustible", "l"),
    (r"(tankage · )?(water tank|fresh water).*", "capacidad_agua_dulce", "l"),
    (r"(tankage · )?holding tank.*", "capacidad_aguas_negras", "l"),
    (r"max(imum)? +passengers", "capacidad_pasajeros", None),
    (r"sleeps( up to)?", "literas", None),
    (r"ce certifications?( \(preliminary\))?", "certificacion", None),
    (r"total upwind area", "superficie_velica", "m²"),
    (r"mainsail.*", "mayor", "m²"),
    (r"(furling genoa|genoa|jib).*", "genova", "m²"),
]
XREF = {
    "desplazamiento": "Peso en vacío publicado ('Light Displacement' / 'Dry Weight') = desplazamiento en rosca.",
    "manga_casco": "'Beam overall' = manga publicada del catamarán.",
    "superficie_velica": "'Total upwind area' = superficie vélica de ceñida.",
}


def _label(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def _area(v: str):
    m = re.search(r"([\d.,]+)\s*SQ ?M", v, re.I)
    return float(m.group(1).replace(",", "")) if m else None


def _hp(v: str):
    """(count, hp) from '2X Mercury Verado V8 300 HP', '2 x Volvo Penta D6 380HP'."""
    m = re.search(r"(?:(\d)\s*x\s*)?.*?(\d{2,4})\s*HP", v, re.I)
    return (int(m.group(1) or 1), int(m.group(2))) if m else None


def _nums(v: str):
    return [int(n) for n in re.findall(r"\d+", v)]


def build_specs(ext: dict, ident: dict, src: dict) -> dict:
    catalog = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
    labels = {f["key"]: f["label"] for f in catalog["fields"]}
    boat = ident["boat_type"]
    fields: dict[str, dict] = {}
    notes_extra: dict[str, list] = {}
    rows = ext["specifications"]

    def rec(row, norm, unit, xref=None):
        r = B._row_record(src, row, norm, unit, xref)
        r["location"] = row.get("location") or r["location"]
        return r

    loa = None
    for row in rows:
        lab = _label(row["label"])
        for pat, key, kind in SPEC_MAP:
            if not re.fullmatch(pat, lab):
                continue
            if key is None:
                break
            if key in fields:
                notes_extra.setdefault(key, []).append(f"{row['label']}: {' / '.join(row['values'])}")
                break
            if kind in ("m", "kg", "l"):
                vals = [re.sub(r"(?<=\d)\s*CM\b", " cm", v) for v in row["values"]]
                if kind == "m" and re.search(r"\d\s*cm\b", vals[0], re.I):
                    cm = B._metric_numbers(vals[0])[0]
                    vals[0] = f"{cm / 100:.2f} m"
                vals = [re.sub(r"\bLB\b", "lbs", v, flags=re.I) for v in vals]
                f = B._quantity_field(key, labels[key], {"label": row["label"], "values": vals}, kind, src,
                                      XREF.get(key), loa)
                for r in f["records"]:
                    r["location"] = row.get("location") or r["location"]
                if kind == "l" and re.search(r"\d\s*X\s*\d", row["values"][0], re.I):
                    m = re.search(r"=\s*([\d,.]+)\s*L", row["values"][0])
                    f["display_value"] = B._es(row["values"][0].split("=")[0].strip() + " L") + \
                        (f" ({B._es(m.group(1))} l en total)" if m else "")
                fields[key] = f
                if key == "eslora_total" and f["status"] == "VERIFIED":
                    loa = f["records"][0]["normalized_value"]
            elif kind == "m²":
                v = _area(row["values"][0])
                if v:
                    fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, v, "m²", XREF.get(key))],
                                         display=f"{_fmt(v, 0 if v == int(v) else 1)} m²")
            elif key == "certificacion":
                raw = " ".join(row["values"])
                toks = re.findall(r"([A-D])\s*[:;]\s*(\d+)", raw)
                disp = " / ".join(f"{a}{n}" for a, n in toks) or raw
                nums = [int(n) for _, n in toks]
                if nums != sorted(nums):
                    fields[key] = _field(key, labels[key], "REQUIRES_REVIEW", [rec(row, disp, None)], display=disp,
                                         notes=f"La web publica '{raw}': el número de personas no crece de A a D "
                                               "(posible error de la web).")
                else:
                    fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, disp, None)], display=disp,
                                         note="preliminar" if "prelim" in lab else None,
                                         notes="Categoría CE : personas, tal como lo publica la web.")
            elif key in ("capacidad_pasajeros", "literas"):
                n = _nums(row["values"][0])
                disp = row["values"][0] if not n else (str(n[0]) if key == "capacidad_pasajeros" else row["values"][0])
                fields[key] = _field(key, labels[key], "VERIFIED", [rec(row, disp, None)], display=disp)
            break

    # Cabins / heads: "Cabins" "3 / 4 / 5", "Cabins and heads 1 / 1", "Cabins/Heads/Showers 2 / 3 / 4",
    # "Cabin Configuration (standard) 3 cabin / 3 head + utility room".
    for row in rows:
        lab, val = _label(row["label"]), " ".join(row["values"])
        if "camarotes" not in fields and re.fullmatch(r"cabins?", lab):
            n = _nums(val)
            fields["camarotes"] = _field("camarotes", labels["camarotes"], "VERIFIED", [rec(row, val, None)],
                                         display=" / ".join(map(str, n)), note="según versión" if len(n) > 1 else None)
        elif "camarotes" not in fields and re.match(r"cabins ?(and|/) ?heads", lab):
            n = _nums(val)
            if n:
                fields["camarotes"] = _field("camarotes", labels["camarotes"], "VERIFIED",
                                             [rec(row, n[0], None, f"'{row['label']}': el primer número es cabinas.")],
                                             display=str(n[0]))
                if len(n) > 1:
                    fields["banos"] = _field("banos", labels["banos"], "VERIFIED",
                                             [rec(row, n[1], None, f"'{row['label']}': el segundo número es baños.")],
                                             display=str(n[1]))
        elif re.match(r"cabin configuration", lab):
            m = re.match(r"(\d+)\s*cabin\s*/\s*(\d+)\s*head", val, re.I)
            if m:
                opt = "optional" in lab
                for key, n in (("camarotes", m.group(1)), ("banos", m.group(2))):
                    if key in fields and opt:
                        f = fields[key]
                        f["display_value"] = f"{f['display_value']} (+{n} opcional)" if "+" not in f["display_value"] else f["display_value"]
                        f["records"].append(rec(row, f["records"][0]["normalized_value"], None,
                                                "Configuración opcional publicada en la ficha."))
                    elif key not in fields:
                        fields[key] = _field(key, labels[key], "VERIFIED",
                                             [rec(row, n, None, f"'{row['label']}': {val}.")], display=n,
                                             note="estándar")
        elif re.match(r"heads", lab) and "banos" not in fields:
            n = _nums(val)
            fields["banos"] = _field("banos", labels["banos"], "VERIFIED", [rec(row, val, None)],
                                     display=" / ".join(map(str, n)))

    # Engines: standard / optional (the most powerful engine offered is the max power).
    eng = [(row, _label(row["label"])) for row in rows
           if re.search(r"engine|propulsion · (standard|optional)|^diesel$|motorisation", _label(row["label"]))
           and _hp(" ".join(row["values"]))]
    if eng:
        std = next((r for r, l in eng if "optional" not in l), eng[0][0])
        opt = next((r for r, l in eng if "optional" in l), None)
        top = max(eng, key=lambda rl: (lambda c: c[0] * c[1])(_hp(" ".join(rl[0]["values"]))))[0]
        n, hp = _hp(" ".join(top["values"]))
        disp = f"{n} x {hp} hp" if n > 1 else f"{hp} hp"
        xref = ("Motorización opcional: el motor más potente ofrecido." if top is opt else
                "Motorización estándar publicada (no hay opción más potente).")
        pkey = "potencia_motor_auxiliar" if boat == "catamaran_vela" else "potencia_motor_maxima"
        fields[pkey] = _field(pkey, labels[pkey], "VERIFIED", [rec(top, n * hp, "hp", xref)], display=disp)
        mkey = "motor_auxiliar" if boat == "catamaran_vela" else "motorizacion"
        txt = std["values"][0] + (f"; opción: {opt['values'][0]}" if opt else "")
        fields[mkey] = _field(mkey, labels[mkey], "VERIFIED",
                              [rec(std, std["values"][0], None, "Motorización publicada en la ficha técnica.")]
                              + ([rec(opt, opt["values"][0], None, "Motorización opcional publicada en la ficha.")] if opt else []),
                              display=txt)
        if opt:  # two different engines are not a conflict: standard + option
            fields[mkey]["records"] = fields[mkey]["records"][:1]
            fields[mkey]["notes"] = f"Opción publicada: {opt['values'][0]}."
    else:
        # Engines only in the overview text (e.g. "Twin Mercury Verado V6 225HP engines (upgradable to 300HP ...)").
        m = re.search(r"[^.]*\b(?:twin|triple|\dx?)\s+(?:Mercury|Volvo|Yamaha|Suzuki|Yanmar)[^.]*\d{3}\s*HP[^.]*", ext["description"], re.I)
        if m:
            q = m.group(0).strip()
            pkey = "potencia_motor_auxiliar" if boat == "catamaran_vela" else "potencia_motor_maxima"
            hps = [int(h) for h in re.findall(r"(\d{3})\s*HP", q, re.I)]
            n = 2 if re.search(r"twin|2x", q, re.I) else 3 if re.search(r"triple|3x", q, re.I) else 1
            fields[pkey] = _field(pkey, labels[pkey], "VERIFIED",
                                  [B._text_record(src, "Overview (texto)", q, n * max(hps), "hp", "Overview",
                                                  "La ficha técnica no publica motores; el texto oficial declara la "
                                                  "motorización y su opción más potente.")],
                                  display=f"{n} x {max(hps)} hp" if n > 1 else f"{max(hps)} hp")
            mkey = "motor_auxiliar" if boat == "catamaran_vela" else "motorizacion"
            fields[mkey] = _field(mkey, labels[mkey], "VERIFIED",
                                  [B._text_record(src, "Overview (texto)", q, q, None, "Overview",
                                                  "Motorización declarada en el texto oficial.")], display=q)

    # Performance declared as estimated → REQUIRES_REVIEW.
    for row in rows:
        if re.search(r"performance", _label(row["label"])):
            v = " ".join(row["values"])
            m = re.search(r"WOT\s*@\s*([\d.-]+)\s*knots", v, re.I)
            if m:
                fields["velocidad_maxima"] = _field("velocidad_maxima", labels["velocidad_maxima"], "REQUIRES_REVIEW",
                                                    [rec(row, m.group(1), "nudos")], display=f"{m.group(1)} nudos",
                                                    notes=f"La web la declara estimada y no contractual: '{v}'.")
            m = re.search(r"cruise speed\s*@\s*([\d.-]+)\s*knots", v, re.I)
            if m:
                fields["velocidad_crucero"] = _field("velocidad_crucero", labels["velocidad_crucero"], "REQUIRES_REVIEW",
                                                     [rec(row, m.group(1), "nudos")], display=f"{m.group(1)} nudos",
                                                     notes=f"La web la declara estimada y no contractual: '{v}'.")

    for key, extra in notes_extra.items():
        if key in fields:
            fields[key]["notes"] = ((fields[key].get("notes") or "") + " Otras variantes publicadas: "
                                    + "; ".join(extra) + ".").strip()

    base = catalog["base_table"][boat]
    crit = [f["key"] for f in catalog["fields"] if f["critical"] and ("universal" in f["types"] or boat in f["types"])]
    for key in list(dict.fromkeys(base + crit)):
        if key not in fields:
            fields[key] = _field(key, labels[key], "NOT_FOUND", display="-",
                                 notes="No publicado en la ficha técnica ni en el texto de la página del producto.")
    order = base + [k for k in fields if k not in base]
    return {
        "model": {"brand": "Aquila", "model": ident["model"], "model_year": MODEL_YEAR, "variant": ident["model"],
                  "configuration": "según ficha técnica", "engine_option": (fields.get("motorizacion") or
                                                                          fields.get("motor_auxiliar") or {}).get("display_value") or "-",
                  "boat_type": boat, "range": ident["range"]},
        "policy": "Solo web oficial del producto (S1). La ficha técnica prevalece; métrico sobre imperial.",
        "fields": [fields[k] for k in order],
    }


def scope_hint(im: dict, ident: dict, ext: dict):
    """HubSpot folder of the file: the model's own folder or another model's."""
    folder, own = im.get("dam_folder"), ext.get("dam_folder")
    if not folder or not own or not re.match(r"\d{2} ", folder):
        return None
    if folder == own:
        return "THIS_MODEL", f"Archivo en la carpeta del modelo en el CMS de Aquila ('{folder}')."
    return "OTHER_MODEL", f"Archivo en la carpeta de otro modelo ('{folder}'); el modelo es '{own}'."


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
