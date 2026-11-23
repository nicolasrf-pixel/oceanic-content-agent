"""Textos editables del sitio (decisión Oceanic 2026-11-23: «poder editar todos los textos de todas las secciones de todas las páginas»).

Recorre las páginas HTML de sitio/ y le pone a cada texto un identificador estable (`data-t="<página>.<número>"`), sin cambiar nada de lo
que se ve. Con eso el administrador (sección «Textos del sitio») puede reemplazar cualquiera de ellos: lo publicado se guarda en el documento
`textos` (assets/js/textos-data.js) y assets/js/textos.js lo aplica al cargar la página.

Reglas:
  - Un texto es un elemento que solo tiene texto y marcas en línea (b, i, em, strong, a, span, br…), con al menos una letra o cifra propia.
    Un elemento sin texto propio (por ejemplo <li><a>Texto</a></li>) pasa la etiqueta a sus hijos en línea con texto.
  - Si un elemento etiquetado queda dentro de otro etiquetado, vale el de afuera.
  - Los identificadores no cambian al correr de nuevo: lo ya etiquetado se conserva y lo nuevo recibe el número siguiente de su página.
  - Se editan también el título y la descripción de cada página (ids <página>.titulo y <página>.desc), con aplicación en el navegador.
  - Salen de la lista: scripts, estilos, íconos SVG, campos de formulario y el administrador. Lo que arma JavaScript (menú, pie, fichas de modelos,
    tarjetas) se administra con sus propios documentos del administrador.

Uso:  python3 tools/sitio_textos.py          # etiqueta las páginas y escribe sitio/assets/data/textos-base.json
      python3 tools/sitio_textos.py --revisar # no escribe: avisa si falta etiquetar algo (para las pruebas)
"""
from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "sitio"
BASE = WEB / "assets" / "data" / "textos-base.json"

EN_LINEA = {"a", "b", "strong", "i", "em", "span", "small", "sup", "sub", "br", "mark", "u", "abbr", "code", "wbr", "img", "svg", "path", "g", "circle",
            "rect", "line", "polyline", "polygon", "use", "defs", "title", "desc", "time", "cite"}
VACIOS = {"br", "img", "input", "meta", "link", "hr", "wbr", "source", "area", "base", "col", "embed", "param", "track", "path", "circle", "rect", "line",
          "polyline", "polygon", "use"}
SALTAR = {"script", "style", "noscript", "template", "textarea", "select", "option", "svg", "head", "title"}
SIN_PAGINA = {"admin", "marcas"}   # el administrador y las páginas heredadas sin contenido propio
# Secciones que arma JavaScript con sus propios documentos del administrador (no se ofrecen aquí porque el JavaScript las rearmaría):
#   portada (hero) → «Portada»; tarjetas de marcas y categorías → «Orden, categorías y marcas»; usados y Puerto → sus secciones.
EXCLUIR = {
    "inicio": {"div#puertoHome", "div.bgrid", "div.u-txt", "div.uc-txt", "div.hhero-in"},
    "usados": {"div.repo-bar"},
}
LETRAS = re.compile(r"[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]")


def paginas() -> list[tuple[str, Path]]:
    """(clave de página, archivo) de cada HTML publicado, en orden estable."""
    out = []
    for p in sorted(WEB.rglob("*.html")):
        rel = p.relative_to(WEB)
        if rel.parts[0] in SIN_PAGINA or "node_modules" in rel.parts:
            continue
        if rel.name == "index.html":
            clave = "inicio" if len(rel.parts) == 1 else "-".join(rel.parts[:-1])
        else:
            clave = rel.stem
        out.append((clave, p))
    return out


class Nodo:
    __slots__ = ("tag", "ini", "fin_ini", "atributos", "hijos", "texto_propio", "texto_todo", "en_linea_solo", "padre", "saltar", "raw")

    def __init__(self, tag, ini, fin_ini, atributos, padre, saltar, raw):
        self.tag, self.ini, self.fin_ini, self.atributos = tag, ini, fin_ini, atributos
        self.hijos: list[Nodo] = []
        self.texto_propio = ""
        self.texto_todo = ""
        self.en_linea_solo = True
        self.padre, self.saltar, self.raw = padre, saltar, raw


class Analizador(HTMLParser):
    def __init__(self, src: str):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lineas = [0]
        for m in re.finditer("\n", src):
            self.lineas.append(m.end())
        self.raiz = Nodo("#raiz", 0, 0, {}, None, False, "")
        self.pila = [self.raiz]
        self.todos: list[Nodo] = []
        self.titulo = ""
        self.descripcion = ""
        self._en_titulo = False

    def _offset(self):
        l, c = self.getpos()
        return self.lineas[l - 1] + c

    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text()
        ini = self._offset()
        fin_ini = ini + len(raw)
        a = dict(attrs)
        if tag == "meta" and a.get("name") == "description":
            self.descripcion = a.get("content") or ""
        if tag == "title":
            self._en_titulo = True
        padre = self.pila[-1]
        saltar = padre.saltar or tag in SALTAR
        n = Nodo(tag, ini, fin_ini, a, padre, saltar, raw)
        padre.hijos.append(n)
        if tag not in EN_LINEA:
            # un hijo que no es en línea: el padre deja de ser «solo texto con marcas»
            q = padre
            while q is not None:
                q.en_linea_solo = False
                q = q.padre
        self.todos.append(n)
        if tag not in VACIOS:
            self.pila.append(n)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VACIOS and len(self.pila) > 1 and self.pila[-1].tag == tag:
            self.pila.pop()

    def handle_endtag(self, tag):
        if tag == "title":
            self._en_titulo = False
        for i in range(len(self.pila) - 1, 0, -1):
            if self.pila[i].tag == tag:
                del self.pila[i:]
                break

    def handle_data(self, data):
        if self._en_titulo:
            self.titulo += data
        n = self.pila[-1]
        n.texto_propio += data
        q = n
        while q is not None:
            q.texto_todo += data
            q = q.padre

    def handle_entityref(self, name):
        self.handle_data(f"&{name};")

    def handle_charref(self, name):
        self.handle_data(f"&#{name};")


def letras(t: str) -> int:
    return len(LETRAS.findall(re.sub(r"&[a-zA-Z#0-9]+;", " ", t)))


def etiquetables(an: Analizador) -> list[Nodo]:
    cand = []
    for n in an.todos:
        if n.saltar or n.tag in SALTAR or n.tag in VACIOS or n.tag in ("html", "body", "svg"):
            continue
        if not n.en_linea_solo or letras(n.texto_todo) < 1:
            continue
        if letras(n.texto_propio) < 1:
            continue                      # sin texto propio: la etiqueta la llevan sus hijos con texto
        cand.append(n)
    # vale el de afuera
    ids = {id(n) for n in cand}
    return [n for n in cand if not _ancestro_en(n, ids)]


def _ancestro_en(n: Nodo, ids: set[int]) -> bool:
    q = n.padre
    while q is not None:
        if id(q) in ids:
            return True
        q = q.padre
    return False


def seccion(n: Nodo) -> str:
    q = n.padre
    while q is not None and q.tag != "#raiz":
        a = q.atributos
        if q.tag in ("section", "header", "footer", "aside", "nav", "article", "main", "div", "form") and (a.get("id") or a.get("class")):
            return (q.tag + "#" + a["id"]) if a.get("id") else (q.tag + "." + a["class"].split()[0])
        q = q.padre
    return "pagina"


def interior(src: str, n: Nodo, fin: int) -> str:
    return src[n.fin_ini:fin]


def etiquetar(clave: str, ruta: Path, escribir: bool) -> tuple[list[dict], bool]:
    src = ruta.read_text(encoding="utf8")
    an = Analizador(src)
    an.feed(src)
    an.close()
    # fin de cada elemento: se busca el cierre emparejando con la pila (recorrido simple por etiquetas)
    fines = _cierres(src)
    elegidos = [n for n in etiquetables(an) if seccion(n) not in EXCLUIR.get(clave, set())]
    usados = [int(m.group(1)) for m in re.finditer(rf'data-t="{re.escape(clave)}\.(\d+)"', src)]
    siguiente = (max(usados) if usados else 0) + 1
    items, inserciones = [], []
    for n in sorted(elegidos, key=lambda x: x.ini):
        previo = re.search(rf'data-t="({re.escape(clave)}\.\d+)"', n.raw)
        if previo:
            tid = previo.group(1)
        else:
            tid = f"{clave}.{siguiente:03d}"
            siguiente += 1
            # se inserta antes del cierre «>» (o «/>») de la etiqueta de apertura
            pos = n.ini + len(n.raw) - (2 if n.raw.endswith("/>") else 1)
            inserciones.append((pos, f' data-t="{tid}"'))
        fin = fines.get(n.ini)
        if fin is None:
            continue
        items.append({"id": tid, "sec": seccion(n), "tag": n.tag, "html": re.sub(r"\s+", " ", interior(src, n, fin)).strip()})
    nuevo = src
    for pos, txt in sorted(inserciones, reverse=True):
        nuevo = nuevo[:pos] + txt + nuevo[pos:]
    # título y descripción de la página
    items.insert(0, {"id": f"{clave}.titulo", "sec": "SEO", "tag": "title", "html": re.sub(r"\s+", " ", an.titulo).strip()})
    if an.descripcion:
        items.insert(1, {"id": f"{clave}.desc", "sec": "SEO", "tag": "meta", "html": an.descripcion})
    cambio = nuevo != src
    if cambio and escribir:
        nuevo = _scripts(nuevo, ruta)
        ruta.write_text(nuevo, encoding="utf8")
    elif escribir:
        n2 = _scripts(src, ruta)
        if n2 != src:
            ruta.write_text(n2, encoding="utf8")
            cambio = True
    return items, cambio


def _cierres(src: str) -> dict[int, int]:
    """inicio de cada etiqueta de apertura → posición donde empieza su cierre (para tomar el interior)."""
    out, pila = {}, []
    for m in re.finditer(r"<(/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\"[^\"]*\"|'[^']*'|[^'\">])*)>", src):
        cierra, tag, resto = m.group(1), m.group(2).lower(), m.group(3)
        if tag in VACIOS or resto.rstrip().endswith("/"):
            continue
        if not cierra:
            pila.append((tag, m.start()))
        else:
            for i in range(len(pila) - 1, -1, -1):
                if pila[i][0] == tag:
                    out[pila[i][1]] = m.start()
                    del pila[i:]
                    break
    return out


def _scripts(html: str, ruta: Path) -> str:
    """Agrega, antes del primer <script src=…> del final de la página, los dos archivos que aplican los textos publicados."""
    if "textos.js" in html:
        return html
    prof = len(ruta.relative_to(WEB).parts) - 1
    pre = "../" * prof
    tags = f'<script src="{pre}assets/js/textos-data.js"></script>\n<script src="{pre}assets/js/textos.js"></script>\n'
    m = re.search(r"<script[^>]+src=", html[html.rfind("</main>") if "</main>" in html else 0:])
    if m:
        base = html.rfind("</main>") if "</main>" in html else 0
        i = base + m.start()
        return html[:i] + tags + html[i:]
    j = html.rfind("</body>")
    return html[:j] + tags + html[j:] if j >= 0 else html + tags


def reiniciar() -> None:
    """Quita todas las etiquetas data-t y los scripts de textos de las páginas (para volver a numerar desde 1; no usar con textos publicados)."""
    for _, ruta in paginas():
        t = ruta.read_text(encoding="utf8")
        n = re.sub(r' data-t="[^"]*"', "", t)
        n = re.sub(r'<script src="[./]*assets/js/textos-data\.js"></script>\n<script src="[./]*assets/js/textos\.js"></script>\n', "", n)
        if n != t:
            ruta.write_text(n, encoding="utf8")


def main(revisar: bool = False) -> int:
    base = {"paginas": []}
    pendientes = 0
    for clave, ruta in paginas():
        items, cambio = etiquetar(clave, ruta, escribir=not revisar)
        if cambio and revisar:
            pendientes += 1
        base["paginas"].append({"pagina": clave, "archivo": str(ruta.relative_to(WEB)), "items": items})
        print(f"{clave:20} {len(items):4} textos{'  (etiquetas nuevas)' if cambio else ''}")
    if revisar:
        return 1 if pendientes else 0
    BASE.parent.mkdir(parents=True, exist_ok=True)
    BASE.write_text(json.dumps(base, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    print("total:", sum(len(p["items"]) for p in base["paginas"]), "textos en", len(base["paginas"]), "páginas")
    return 0


if __name__ == "__main__":
    if "--reiniciar" in sys.argv:
        reiniciar()
    sys.exit(main("--revisar" in sys.argv))
