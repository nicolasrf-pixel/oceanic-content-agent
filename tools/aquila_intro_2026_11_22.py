"""Textos iniciales de los cuatro Aquila Yacht pedidos por el cliente (2026-11-22).

Los textos en inglés son los de la web oficial de Aquila (están literales en SOURCE CONTENT de cada introduccion.md); el
cliente indicó qué párrafos usar. Aquí va la traducción fiel al español neutro (BORRADOR hasta revisión). Se aplican en:
  - drafts/aquila/<slug>.json            › introduccion (párrafos separados por una línea en blanco)
  - biblioteca/aquila/<slug>/01_CONTENIDO/introduccion.md › bloque OCEANIC CONTENT
  - sitio/assets/js/catalogo-contenido.js › secciones «Introducción» (lista de párrafos)
  - sitio/assets/js/catalogo-data.js      › desc_larga (el mismo texto en un solo párrafo, para el SEO)
Es idempotente: se puede volver a correr.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TEXTOS = {
    "aquila-42-yacht": [
        "Lo que impresiona de inmediato es su sensación de espacio: la manga de 21 pies (6,4 m) crea una plataforma que se siente "
        "mucho más espaciosa que la de embarcaciones de eslora similar. El flybridge ofrece vistas elevadas para reunirse bajo el "
        "cielo abierto, mientras que los generosos asientos de proa crean un refugio perfecto para relajarse.",
        "El luminoso salón con cocina completa fluye sin interrupciones hacia la cabina de popa y forma un espacio natural de "
        "encuentro. Estas tres áreas de entretención al aire libre son el escenario ideal para todo, desde momentos íntimos hasta "
        "reuniones más grandes.",
        "Las múltiples configuraciones interiores y un puesto de gobierno interior opcional para el mal tiempo complementan la "
        "certificación de categoría A para mar abierto, y te dan todo lo necesario para explorar nuevos horizontes con confianza.",
    ],
    "aquila-46-yacht": [
        "El Aquila 46 Yacht comparte la estética «Explorer» de nuestro llamativo 50 Yacht, diseñada para quienes buscan la "
        "innovación de un yate más grande en un formato más íntimo. La impresionante manga de 23 pies 3 pulgadas (7,1 m) crea un "
        "volumen interior que se siente notablemente espacioso, mientras que un diseño cuidadoso aprovecha cada centímetro para la "
        "privacidad y la convivencia. La certificación CE de categoría A para mar abierto significa explorar aguas abiertas con "
        "confianza y con una seria capacidad para navegar lejos de la costa.",
    ],
    "aquila-50-yacht": [
        "Con la certificación de categoría A para mar abierto, puedes navegar aguas abiertas con confianza y disfrutar de la "
        "seguridad de una embarcación diseñada con una seria capacidad para navegar lejos de la costa. Las opciones de "
        "configuración adicionales te permiten personalizar tu yate según tu estilo de crucero, mientras inicias una nueva era "
        "de sofisticación.",
    ],
    "aquila-54-yacht": [
        "Disponible en opciones de 3, 4 y 5 camarotes, además de alojamiento para el patrón y distribuciones con la cocina en la "
        "cubierta inferior («galley-down»), para ajustarse a tu estilo de crucero. El camarote principal de manga completa ofrece "
        "privacidad, y los detalles cuidados en todo el barco crean una verdadera sensación de hogar.",
        "Con sistemas de navegación inteligentes y certificación de categoría A para mar abierto, el Aquila 54 te da todo lo "
        "necesario para llegar más lejos y sentirte completamente en casa en el camino.",
        "Porque allá afuera, el asombro espera.",
    ],
}


def _leer_js(ruta: Path):
    t = ruta.read_text(encoding="utf8")
    i = t.index("=", t.index("window.")) + 1
    j = t.rindex(";")
    return t[: i], json.loads(t[i:j]), t[j:]


def _escribir_js(ruta: Path, pre: str, datos, suf: str) -> None:
    ruta.write_text(pre + json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + suf, encoding="utf8")


def aplicar() -> None:
    # drafts
    for slug, ps in TEXTOS.items():
        p = ROOT / "drafts" / "aquila" / f"{slug}.json"
        d = json.loads(p.read_text(encoding="utf8"))
        d["introduccion"] = "\n\n".join(ps)
        p.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
        # introduccion.md: se reemplaza lo que sigue a la línea «Candidato…» dentro de OCEANIC CONTENT
        md = ROOT / "biblioteca" / "aquila" / slug / "01_CONTENIDO" / "introduccion.md"
        t = md.read_text(encoding="utf8")
        i = t.index("## OCEANIC CONTENT")
        cabecera = t[i:].split("\n\n", 2)  # «## OCEANIC CONTENT», «> Candidato…», resto
        nuevo = t[:i] + cabecera[0] + "\n\n" + cabecera[1] + "\n\n" + "\n\n".join(ps) + "\n"
        md.write_text(nuevo, encoding="utf8")
    # catálogo (desc_larga) y contenido (secciones)
    ruta = ROOT / "sitio" / "assets" / "js" / "catalogo-data.js"
    pre, cat, suf = _leer_js(ruta)
    for m in cat["aquila"]["modelos"]:
        if m["slug"] in TEXTOS:
            m["desc_larga"] = " ".join(TEXTOS[m["slug"]])
    _escribir_js(ruta, pre, cat, suf)
    ruta = ROOT / "sitio" / "assets" / "js" / "catalogo-contenido.js"
    pre, con, suf = _leer_js(ruta)
    for slug, ps in TEXTOS.items():
        for s in con[f"aquila/{slug}"]["secciones"]:
            if s["t"] == "Introducción":
                s["p"] = list(ps)
    _escribir_js(ruta, pre, con, suf)


if __name__ == "__main__":
    aplicar()
    print("listo:", ", ".join(TEXTOS))
