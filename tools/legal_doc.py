"""Genera el documento Word para revisión legal con la Política de privacidad y los Términos de uso del sitio.

Toma los textos de sitio/privacidad/index.html y sitio/terminos/index.html (así el documento nunca se desfasa del sitio),
resalta en amarillo todo lo que está entre [corchetes] (datos que debe completar Oceanic) y antepone una nota para quien
revisa: estado de la ley, datos pendientes y puntos que se piden revisar.

Uso:  python3 tools/legal_doc.py [salida.docx]
Por defecto: docs/legal/Oceanic-privacidad-y-terminos-para-revision.docx
"""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_COLOR_INDEX
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Cm

ROOT = Path(__file__).resolve().parent.parent
SALIDA = ROOT / "docs" / "legal" / "Oceanic-privacidad-y-terminos-para-revision.docx"
AZUL = RGBColor(0x14, 0x21, 0x2B)
NARANJA = RGBColor(0xA9, 0x45, 0x26)
GRIS = RGBColor(0x56, 0x65, 0x70)
FECHA = "20 de noviembre de 2026"


class Extractor(HTMLParser):
    """Bloques de contenido de una página legal: ('h1'|'h2'|'p'|'li'|'dt'|'dd'|'tabla', datos). Texto = lista de (texto, negrita)."""

    SALTAR_TAGS = {"form", "nav", "script", "style", "select", "textarea", "label", "button"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.bloques: list[tuple[str, object]] = []
        self.pila: list[tuple[str, bool]] = []   # (tag, salta)
        self.runs: list[tuple[str, bool]] | None = None
        self.tag_actual = ""
        self.negrita = 0
        self.tabla: list[list[list[tuple[str, bool]]]] | None = None
        self.fila: list | None = None
        self.celda: list[tuple[str, bool]] | None = None
        self.en_contenido = False

    def saltando(self) -> bool:
        return any(s for _, s in self.pila)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        clases = (a.get("class") or "").split()
        salta = tag in self.SALTAR_TAGS or "priv-borrador" in clases or "form-ok" in clases or "priv-indice" in clases or a.get("hidden") is not None \
            or a.get("aria-hidden") == "true"
        if tag in ("br", "input", "img", "meta", "link", "hr", "option"):
            return
        self.pila.append((tag, salta))
        if self.saltando():
            return
        if tag == "h1":
            self.en_contenido = True
        if not self.en_contenido:
            return
        if tag in ("b", "strong"):
            self.negrita += 1
        if tag == "table":
            self.tabla = []
        elif tag == "tr" and self.tabla is not None:
            self.fila = []
        elif tag in ("td", "th") and self.fila is not None:
            self.celda = []
            self.tag_actual = tag
        elif tag in ("h1", "h2", "p", "li", "dt", "dd") and self.celda is None:
            self.runs = []
            self.tag_actual = tag

    def handle_endtag(self, tag):
        if tag in ("br", "input", "img", "meta", "link", "hr", "option"):
            return
        salto_antes = self.saltando()
        # desapila hasta el tag
        while self.pila:
            t, _ = self.pila.pop()
            if t == tag:
                break
        if salto_antes or not self.en_contenido:
            return
        if tag in ("b", "strong") and self.negrita:
            self.negrita -= 1
        if tag in ("td", "th") and self.celda is not None and self.fila is not None:
            self.fila.append(self.celda)
            self.celda = None
        elif tag == "tr" and self.fila is not None and self.tabla is not None:
            self.tabla.append(self.fila)
            self.fila = None
        elif tag == "table" and self.tabla is not None:
            self.bloques.append(("tabla", self.tabla))
            self.tabla = None
        elif tag in ("h1", "h2", "p", "li", "dt", "dd") and self.runs is not None and self.celda is None:
            texto = "".join(t for t, _ in self.runs).strip()
            if texto:
                self.bloques.append((tag, self.runs))
            self.runs = None

    def handle_data(self, data):
        if self.saltando() or not self.en_contenido:
            return
        d = re.sub(r"\s+", " ", data)
        if not d.strip() and not d:
            return
        destino = self.celda if self.celda is not None else self.runs
        if destino is not None and d:
            destino.append((d, bool(self.negrita)))


def extraer(ruta: Path) -> list[tuple[str, object]]:
    p = Extractor()
    p.feed(ruta.read_text(encoding="utf8"))
    # limpia espacios al borde de cada bloque
    for _, v in p.bloques:
        if isinstance(v, list) and v and isinstance(v[0], tuple):
            v[0] = (v[0][0].lstrip(), v[0][1])
            v[-1] = (v[-1][0].rstrip(), v[-1][1])
    return p.bloques


# ---------- escritura del Word ----------

def fuente(par, size=11, negrita=False, color=None, cursiva=False):
    for r in par.runs:
        r.font.size = Pt(size)
        r.font.name = "Calibri"
        if negrita:
            r.font.bold = True
        if color:
            r.font.color.rgb = color
        if cursiva:
            r.font.italic = True


def runs_en(par, runs, size=11, color=None):
    """Agrega los runs; lo que va entre [corchetes] se resalta en amarillo."""
    for texto, negrita in runs:
        for trozo in re.split(r"(\[[^\]]+\])", texto):
            if not trozo:
                continue
            r = par.add_run(trozo)
            r.font.size = Pt(size)
            r.font.name = "Calibri"
            r.font.bold = negrita
            if color:
                r.font.color.rgb = color
            if re.fullmatch(r"\[[^\]]+\]", trozo):
                r.font.highlight_color = WD_COLOR_INDEX.YELLOW


def fondo(celda, hex_color):
    tcPr = celda._tc.get_or_add_tcPr()
    sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear")
    sh.set(qn("w:color"), "auto")
    sh.set(qn("w:fill"), hex_color)
    tcPr.append(sh)


def titulo(doc, texto, nivel):
    p = doc.add_heading(texto, level=nivel)
    for r in p.runs:
        r.font.name = "Calibri"
        r.font.color.rgb = AZUL if nivel < 3 else NARANJA
    return p


def parrafo(doc, texto, size=11, negrita=False, color=None, cursiva=False, espacio=6):
    p = doc.add_paragraph()
    r = p.add_run(texto)
    r.font.size = Pt(size)
    r.font.name = "Calibri"
    r.font.bold = negrita
    r.font.italic = cursiva
    if color:
        r.font.color.rgb = color
    p.paragraph_format.space_after = Pt(espacio)
    return p


def volcar(doc, bloques, nivel_base):
    """Pasa los bloques extraídos al documento. h1 se omite (lo pone la portada de la parte)."""
    pendiente_dt = None
    for tipo, v in bloques:
        if tipo == "h1":
            continue
        if tipo == "h2":
            titulo(doc, "".join(t for t, _ in v), nivel_base + 1)
        elif tipo == "p":
            texto = "".join(t for t, _ in v)
            p = doc.add_paragraph()
            runs_en(p, v)
            p.paragraph_format.space_after = Pt(6)
            if texto.startswith("Versión "):
                fuente(p, 10, color=GRIS)
        elif tipo == "li":
            p = doc.add_paragraph(style="List Bullet")
            runs_en(p, v)
        elif tipo == "dt":
            pendiente_dt = v
        elif tipo == "dd":
            p = doc.add_paragraph(style="List Bullet")
            if pendiente_dt:
                runs_en(p, [(("".join(t for t, _ in pendiente_dt)) + ": ", True)])
            runs_en(p, v)
            pendiente_dt = None
        elif tipo == "tabla":
            filas = v
            if not filas:
                continue
            cols = max(len(f) for f in filas)
            t = doc.add_table(rows=len(filas), cols=cols)
            t.style = "Table Grid"
            t.alignment = WD_TABLE_ALIGNMENT.CENTER
            for i, f in enumerate(filas):
                for j, celda in enumerate(f):
                    c = t.cell(i, j)
                    c.text = ""
                    runs_en(c.paragraphs[0], [(tx, ng or i == 0) for tx, ng in celda], size=10)
                    if i == 0:
                        fondo(c, "E9E6DF")
            doc.add_paragraph()


NOTA_LEY = (
    "Estado de la ley. La Ley N° 21.719 regula la protección y el tratamiento de los datos personales y crea la Agencia de "
    "Protección de Datos Personales. Estaba prevista para el 1 de diciembre de 2026. El 17 de noviembre de 2026 el Congreso despachó "
    "el proyecto que posterga su entrada en vigencia hasta el 15 de octubre de 2027 (según informó La Tercera); a la fecha de este "
    "documento falta su publicación en el Diario Oficial. Mientras tanto rige la Ley N° 19.628. Los textos de este documento "
    "están redactados anticipando la Ley 21.719, de modo que el sitio quede preparado. Se solicita confirmar si ese enfoque es "
    "el adecuado para publicar el 1 de diciembre de 2026 o si conviene ajustar la redacción mientras rija la Ley 19.628."
)

PENDIENTES = [
    ("Razón social", "Pendiente de Oceanic", "Política §1; Términos §1"),
    ("RUT", "Pendiente de Oceanic", "Política §1; Términos §1"),
    ("Domicilio legal", "Pendiente (¿coincide con Alonso de Córdova 2653, of. 302, Vitacura?)", "Política §1; Términos §1"),
    ("Correo de privacidad", "Pendiente (sugerido: privacidad@oceanic.cl)", "Política §1 y §8"),
    ("Correo de contacto de los Términos", "Pendiente de confirmar (sugerido: contacto@oceanic.cl)", "Términos §12"),
    ("Plazo de conservación de cotizaciones y consultas", "Pendiente (sugerido: 24 meses desde el último contacto)", "Política §6"),
    ("Delegado de protección de datos", "Pendiente: indicar nombre y contacto, o «no se designa»", "Política §1"),
    ("Fecha de vigencia", "Se fija al publicar (1 de diciembre de 2026)", "Encabezado de ambas páginas"),
]

REVISAR = [
    "Si es correcto redactar hoy conforme a la Ley 21.719 mientras rija la Ley 19.628, y cómo conviene mencionar la ley en el encabezado.",
    "Bases de licitud de la sección 3 (consentimiento y ejecución de medidas precontractuales) y la mención de comunicaciones comerciales.",
    "Sección 4: la lista de proveedores que reciben datos (correo, base de contactos, alojamiento) y si debe indicarse a cada astillero o marca.",
    "Sección 5: transferencias internacionales (Unión Europea y Estados Unidos) y las garantías que debe documentar Oceanic con cada proveedor.",
    "Sección 6: plazos de conservación, incluida la frase sobre clientes (obligaciones legales y tributarias) y el newsletter Puerto.",
    "Secciones 7 y 8: derechos, plazo de respuesta (30 días corridos, prorrogable una vez) y la vía de reclamo ante la Agencia.",
    "Sección 9: el aviso de cookies y almacenamiento (hoy el sitio no usa cookies de seguimiento ni publicidad; el texto prevé Google Analytics solo si la persona acepta, por si se activa más adelante).",
    "Sección 11: menores de edad.",
    "Términos §4, §5 y §6: cotizaciones, embarcaciones usadas y charter (alcance de las frases «no constituye oferta», disponibilidad y condiciones).",
    "Términos §9 y §12: limitación de responsabilidad y ley aplicable.",
]


def construir(salida: Path = SALIDA) -> Path:
    doc = Document()
    sec = doc.sections[0]
    sec.left_margin = sec.right_margin = Cm(2.4)
    sec.top_margin = sec.bottom_margin = Cm(2.2)
    st = doc.styles["Normal"]
    st.font.name = "Calibri"
    st.font.size = Pt(11)

    # portada
    parrafo(doc, "OCEANIC", 12, True, NARANJA, espacio=2)
    t = doc.add_heading("Política de privacidad y Términos de uso", 0)
    for r in t.runs:
        r.font.name = "Calibri"
        r.font.color.rgb = AZUL
    parrafo(doc, "Documento para revisión legal · Nuevo sitio web oficial · Versión 2026-11 (borrador)", 12, color=GRIS, espacio=2)
    parrafo(doc, f"Preparado el {FECHA} por Marketing de Oceanic · Publicación prevista: 1 de diciembre de 2026, 00:00 (hora de Chile)", 10, color=GRIS, espacio=14)

    titulo(doc, "Nota para quien revisa", 1)
    parrafo(doc, "Este documento reúne los dos textos legales del nuevo sitio web de Oceanic, tal como están publicados hoy en el sitio de prueba "
                 "(https://oceanic.narf.workers.dev/privacidad/ y https://oceanic.narf.workers.dev/terminos/). Todo lo que aparece "
                 "resaltado en amarillo y entre [corchetes] son datos que debe completar Oceanic. Se solicita revisar el contenido, "
                 "sugerir cambios y confirmar si puede publicarse.")
    parrafo(doc, NOTA_LEY)

    titulo(doc, "Datos pendientes de Oceanic", 2)
    tabla = doc.add_table(rows=1 + len(PENDIENTES), cols=3)
    tabla.style = "Table Grid"
    for j, h in enumerate(("Dato", "Estado", "Dónde aparece")):
        c = tabla.cell(0, j)
        c.text = ""
        r = c.paragraphs[0].add_run(h)
        r.font.bold = True
        r.font.size = Pt(10)
        fondo(c, "E9E6DF")
    for i, (a, b, c3) in enumerate(PENDIENTES, start=1):
        for j, tx in enumerate((a, b, c3)):
            c = tabla.cell(i, j)
            c.text = ""
            r = c.paragraphs[0].add_run(tx)
            r.font.size = Pt(10)
            if j == 0:
                r.font.bold = True
    doc.add_paragraph()

    titulo(doc, "Puntos que se solicita revisar", 2)
    for x in REVISAR:
        p = doc.add_paragraph(style="List Number")
        r = p.add_run(x)
        r.font.size = Pt(11)

    doc.add_page_break()
    titulo(doc, "Parte 1 · Política de privacidad", 1)
    volcar(doc, extraer(ROOT / "sitio" / "privacidad" / "index.html"), 1)
    doc.add_page_break()
    titulo(doc, "Parte 2 · Términos de uso", 1)
    volcar(doc, extraer(ROOT / "sitio" / "terminos" / "index.html"), 1)

    salida.parent.mkdir(parents=True, exist_ok=True)
    doc.save(salida)
    return salida


if __name__ == "__main__":
    destino = Path(sys.argv[1]) if len(sys.argv) > 1 else SALIDA
    print(construir(destino))
