"""Líneas de producto (series) de cada marca: asigna `serie` a cada modelo del catálogo del sitio.

Las reglas están en tools/series.json (patrones sobre el slug, en el orden en que se muestran). Se usa desde
tools/sitio_catalogo.py (cada modelo nuevo entra con su serie) y se puede correr solo para toda la gama:
    python3 tools/series.py            # asigna y escribe sitio/assets/js/catalogo-data.js
    python3 tools/series.py --revisar  # solo informa (modelos sin serie) y no escribe
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
REGLAS = json.loads((Path(__file__).with_name("series.json")).read_text(encoding="utf8"))
CATALOGO = RAIZ / "sitio" / "assets" / "js" / "catalogo-data.js"


def serie_de(marca: str, slug: str) -> str | None:
    for r in REGLAS.get(marca, []):
        if re.search(r["patron"], slug):
            return r["id"]
    return None


def aplicar(cat: dict) -> list[str]:
    """Pone `serie` en cada modelo y `series` (ordenadas, solo las que tienen modelos) en cada marca con reglas.
    Devuelve los modelos de marcas con reglas que quedaron sin serie."""
    sin = []
    for marca, datos in cat.items():
        reglas = REGLAS.get(marca)
        if not reglas:
            datos.pop("series", None)
            for m in datos.get("modelos", []):
                m.pop("serie", None)
            continue
        usadas = set()
        for m in datos["modelos"]:
            s = serie_de(marca, m["slug"])
            if s:
                m["serie"] = s
                usadas.add(s)
            else:
                m.pop("serie", None)
                sin.append(f"{marca}/{m['slug']}")
        datos["series"] = [{"id": r["id"], "nombre": r["nombre"]} for r in reglas if r["id"] in usadas]
    return sin


def _leer():
    t = CATALOGO.read_text(encoding="utf8")
    i = t.index("=", t.index("window.")) + 1
    j = t.rindex(";")
    return t[:i], json.loads(t[i:j]), t[j:]


if __name__ == "__main__":
    pre, cat, suf = _leer()
    sin = aplicar(cat)
    for s in sin:
        print("SIN SERIE:", s)
    if "--revisar" not in sys.argv:
        CATALOGO.write_text(pre + json.dumps(cat, ensure_ascii=False, separators=(",", ":")) + suf, encoding="utf8")
    for marca, datos in cat.items():
        if datos.get("series"):
            print(marca, "→", ", ".join(f"{s['nombre']} ({sum(1 for m in datos['modelos'] if m.get('serie') == s['id'])})" for s in datos["series"]))
