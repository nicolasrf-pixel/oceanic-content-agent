"""Usados de Oceanic (https://oceanic.cl/usados/) → notas de texto para el área de usados de la nueva web.

Solo para usados (decisión Oceanic 2026-10-09): la tabla y los datos son variables por aviso, así que no se normalizan
al catálogo de campos; se copia lo que publica cada aviso, tal cual, en un bloc de notas por barco. Las fotos del aviso
se guardan como copias web WebP (1600 px, calidad 75, igual que la biblioteca) y no se versionan.

Uso (desde la raíz del repo):  python3 tools/usados.py [--sin-fotos]
Salida: usados/LEEME.txt (índice con todas las tarjetas, también las vendidas o sin ficha) y usados/<slug>/ficha.txt + fotos/.
"""

from __future__ import annotations

import io
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "usados"
INDEX = "https://oceanic.cl/usados/"
UA = {"User-Agent": "Mozilla/5.0 (OceanicContentEngine)"}
CHROME_END = ("FORMULARIO DE COTIZACIÓN", "En Oceanic no solo", "WhatsApp us")
SKIP_LINES = {"Ir al contenido", "Ver más aquí"}


def fetch(url: str, binary: bool = False):
    q = urllib.parse.quote(url, safe=":/?&=%#+,;@~")
    for k in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(q, headers=UA), timeout=60) as r:
                data = r.read()
                return data if binary else data.decode("utf-8", "replace")
        except Exception as exc:  # noqa: BLE001 - retry network errors, report the last one
            err = exc
            time.sleep(2 ** k)
    raise err


def cards(html: str) -> list[dict]:
    """The index cards, in page order: lines of text + the 'Ver más aquí' link (if any)."""
    soup = BeautifulSoup(html, "html.parser")
    for t in soup(["script", "style", "noscript", "svg"]):
        t.decompose()
    text = soup.get_text("\n", strip=True).split("\n")
    start = text.index("Encuentra aquí la mejor selección de barcos usados a vela y motor con el respaldo de Oceanic.") + 1
    end = next(i for i, l in enumerate(text) if l.startswith("En Oceanic no solo"))
    links = [a.get("href") for a in soup.find_all("a") if "Ver más" in a.get_text()]
    out, cur = [], []
    for line in text[start:end]:
        if line in ("Ver más aquí", "VENDIDO"):
            out.append({"lines": cur, "status": "VENDIDO" if line == "VENDIDO" else "DISPONIBLE",
                        "link": links.pop(0) if line == "Ver más aquí" else None})
            cur = []
        else:
            cur.append(line.replace("​", "").strip())
    return out


def listing_text(html: str) -> tuple[str, list[str], list[str]]:
    """Literal text of a listing page (without site chrome and the quote form), photo URLs and document links."""
    soup = BeautifulSoup(html, "html.parser")
    title = (soup.title.get_text(strip=True) if soup.title else "").replace(" - Oceanic", "")
    docs = [a["href"] for a in soup.find_all("a", href=True) if re.search(r"\.pdf($|\?)", a["href"], re.I)]
    for t in soup(["script", "style", "noscript", "svg", "header", "footer", "nav", "form"]):
        t.decompose()
    lines = soup.get_text("\n", strip=True).split("\n")
    start = max((i for i, l in enumerate(lines[:80]) if l == "CONTACTO"), default=-1) + 1
    body = []
    for line in lines[start:]:
        if line.startswith(CHROME_END):
            break
        if line not in SKIP_LINES and line != f"{title} - Oceanic":
            body.append(line)
    photos = []
    for u in re.findall(r"https?:\\?/\\?/oceanic\.cl\\?/wp-content\\?/uploads\\?/[^\"' )]+?\.(?:jpe?g|png|webp)", html):
        u = re.sub(r"-\d+x\d+(?=\.\w+$)", "", u.replace("\\/", "/"))
        if not re.search(r"logo|isofooter|elementor/thumbs", u, re.I) and u not in photos:
            photos.append(u)
    return "\n".join(body), photos, docs


def web_copy(data: bytes) -> bytes:
    from PIL import Image
    with Image.open(io.BytesIO(data)) as im:
        im = im.convert("RGB")
        im.thumbnail((1600, 1600), Image.LANCZOS)
        out = io.BytesIO()
        im.save(out, "WEBP", quality=75, method=6)
        return out.getvalue()


def slug_of(url: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", url.rstrip("/").rsplit("/", 1)[-1].lower()).strip("-")


def main(argv: list[str]) -> int:
    today = date.today().isoformat()
    OUT.mkdir(exist_ok=True)
    index = cards(fetch(INDEX))
    lines = [f"USADOS OCEANIC · índice", f"Fuente: {INDEX} (capturado {today})",
             "Datos tal como los publica cada aviso; no se normalizan (decisión Oceanic 2026-10-09).",
             "Se publican todos los avisos (decisión Oceanic 2026-10-09). Correcciones pendientes en OBSERVACIONES.txt.", ""]
    for n, c in enumerate(index, 1):
        head = " | ".join(c["lines"])
        slug = slug_of(c["link"]) if c["link"] else None
        note = ""
        if c["link"]:
            try:
                html = fetch(c["link"])
            except Exception as exc:  # noqa: BLE001
                html, note = "", f"no se pudo abrir ({exc})"
            body, photos, docs = listing_text(html) if html else ("", [], [])
            if "No se encontró esa página" in body:
                note = "el enlace del aviso da 'Página no encontrada' en oceanic.cl"
                body, photos, docs = "", [], []
            d = OUT / slug
            d.mkdir(exist_ok=True)
            ficha = [f"AVISO DE USADO · {c['lines'][0]}", f"Fuente: {c['link']} (capturado {today})",
                     f"Tarjeta del índice: {head}", f"Estado en el índice: {c['status']}", ""]
            ficha += [f"NOTA: {note}", ""] if note else []
            ficha += ["--- TEXTO DEL AVISO (literal) ---", body or "(sin texto)", ""]
            if docs:
                ficha += ["--- DOCUMENTOS ENLAZADOS ---"] + docs + [""]
            ficha += [f"--- FOTOS ({len(photos)}) ---"] + photos
            (d / "ficha.txt").write_text("\n".join(ficha) + "\n")
            if photos and "--sin-fotos" not in argv:
                fd = d / "fotos"
                fd.mkdir(exist_ok=True)
                for i, u in enumerate(photos, 1):
                    dest = fd / f"{i:02d}.webp"
                    if not dest.exists():
                        try:
                            dest.write_bytes(web_copy(fetch(u, binary=True)))
                        except Exception as exc:  # noqa: BLE001
                            print(f"  foto {u}: {exc}")
            print(f"{slug}: {len(body.splitlines())} líneas, {len(photos)} fotos" + (f" · {note}" if note else ""))
        lines.append(f"{n:2}. [{c['status']}] {head}")
        lines.append(f"    Ficha: usados/{slug}/ficha.txt  ({c['link']})" if slug else "    Sin ficha propia en oceanic.cl")
        if note:
            lines.append(f"    NOTA: {note}")
    (OUT / "LEEME.txt").write_text("\n".join(lines) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
