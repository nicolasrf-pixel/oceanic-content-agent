"""Arma la lista de fotos del sitio (sitio/scripts/fotos.tsv) con la versión web liviana de cada foto.

Cada fila: destino (relativo a sitio/assets/img/), URL a descargar y URL del original (referencia).
La URL a descargar sale de la biblioteca (images.json):
  - Axopar: el CDN redimensiona (`cdn_url?width=…`); los originales del DAM pesan 30-70 MB y no sirven para web.
  - Otras marcas: `cdn_url` (versión web que publica la marca) o, si no hay, el original.
  - Saffier y Solaris bloquean descargas automáticas: se usa una copia oficial en otro origen si la biblioteca la
    tiene (oceanic.cl); si no, la foto queda para carga manual.
  - Fotos sin registro en la biblioteca (usados de oceanic.cl): la URL que ya tenía la lista.
Las fotos se descargan y convierten en el build de Cloudflare con sitio/scripts/fotos.mjs.

Uso, desde la raíz del repo:  python3 tools/sitio_fotos.py
"""
import csv
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TSV = RAIZ / 'sitio' / 'scripts' / 'fotos.tsv'


def indice_biblioteca():
    por_url = {}
    for f in (RAIZ / 'biblioteca').glob('*/*/05_MULTIMEDIA/IMAGENES/images.json'):
        j = json.loads(f.read_text())
        for im in (j if isinstance(j, list) else j.get('images', [])):
            o = im.get('original') or {}
            for u in (o.get('url'), o.get('fetched_from'), im.get('cdn_url'), im.get('source_url')):
                if u:
                    por_url[u.strip()] = im
    return por_url


# Sitios que bloquean las descargas automáticas (captcha / anti-bots). No se eluden: si la biblioteca tiene una copia
# oficial en otro origen (p. ej. la misma foto publicada en oceanic.cl, decisión Oceanic 2026-10-04), se usa esa.
BLOQUEADOS = ('saffieryachts.com', 'www.solarisyachts.com')
# De esos, el que también falla en el build de Cloudflare (403 desde 2026-11): sus fotos no se construyen nunca.
# solarisyachts.com sí responde al build (las fotos que apuntan allí existen en el sitio publicado).
SIN_DESCARGA = ('saffieryachts.com',)


def url_web(im, original, destino):
    o = (im or {}).get('original') or {}
    # fetched_from puede ser una nota ("copia con el mismo nombre de archivo publicada en https://…"): se toma la URL
    alternativas = [m.group(0) for u in (o.get('fetched_from'), o.get('url'), (im or {}).get('cdn_url')) if u
                    for m in [re.search(r'https?://\S+', u)] if m]
    if original.split('/')[2] in BLOQUEADOS:
        otra = next((u for u in alternativas if u.split('/')[2] not in BLOQUEADOS), None)
        if otra:
            return otra
    cdn = (im or {}).get('cdn_url') or ''
    if 'media.ffycdn.net' in cdn:  # Axopar: el CDN entrega la foto al ancho pedido
        return cdn.split('?')[0] + ('?width=2560&quality=90' if destino.endswith('-hero.webp') else '?width=1600&quality=90')
    if 'static.wixstatic.com' in cdn:  # Wix: el cdn_url es una miniatura de 416 px; el original pesa ~2 MB
        return original
    return cdn or original


def main():
    filas = list(csv.reader(TSV.open(), delimiter='\t'))
    cab, filas = filas[0], filas[1:]
    por_url = indice_biblioteca()
    sin = 0
    salida = []
    for destino, _, original in filas:
        im = por_url.get(original.strip())
        sin += im is None
        salida.append([destino, url_web(im, original, destino).strip(), original.strip()])
    asignadas = asignar_oceanic(salida)
    with TSV.open('w', newline='') as f:
        w = csv.writer(f, delimiter='\t', lineterminator='\n')
        w.writerow(cab)
        w.writerows(salida)
    bloqueadas = sum(1 for _, u, _ in salida if u.split('/')[2] in BLOQUEADOS)
    podadas = podar_galerias(salida)
    print(f'{len(salida)} fotos; {sin} sin registro en la biblioteca (se usa su URL tal cual); '
          f'{asignadas} desde fotos-oceanic.json; {bloqueadas} siguen sin fuente '
          f'({podadas} fuera de las galerías hasta que se carguen a mano)')


def podar_galerias(salida):
    """Las galerías del sitio solo listan fotos que existen: una foto que sigue apuntando a un sitio que el build no puede
    descargar (SIN_DESCARGA) y que
    no se cargó a mano en sitio/assets/img/ nunca se construye, y si la galería la pide, los bloques de la ficha se
    llevan las fotos reales y la galería queda vacía. Esas fotos salen de catalogo-contenido.js (siguen en fotos.tsv:
    al cargarlas a mano y volver a correr sitio_catalogo.py, reaparecen)."""
    img = RAIZ / 'sitio' / 'assets' / 'img'
    sin_fuente = {d for d, u, _ in salida if u.split('/')[2] in SIN_DESCARGA and not (img / d).exists()}
    js = RAIZ / 'sitio' / 'assets' / 'js' / 'catalogo-contenido.js'
    s = js.read_text()
    i = s.rindex('window.OCEANIC_CONTENIDO=')
    con = json.loads(s[i + len('window.OCEANIC_CONTENIDO='):].rstrip().rstrip(';'))
    n = 0
    for c in con.values():
        gal = c.get('galeria') or {}
        for cat in list(gal):
            antes = len(gal[cat])
            gal[cat] = [f for f in gal[cat] if f not in sin_fuente]
            n += antes - len(gal[cat])
            if not gal[cat]:
                del gal[cat]
    js.write_text(s[:i] + 'window.OCEANIC_CONTENIDO=' + json.dumps(con, ensure_ascii=False, separators=(',', ':')) + ';\n')
    return n


def asignar_oceanic(salida):
    """Fotos que siguen apuntando a un sitio bloqueado: se reemplazan por las fotos que Oceanic cargó en oceanic.cl
    para ese mismo modelo (sitio/scripts/fotos-oceanic.json). La portada (-hero) recibe la primera."""
    fuente = json.loads((TSV.parent / 'fotos-oceanic.json').read_text())['modelos']
    usadas = {u for _, u, _ in salida}
    por_modelo = {}
    for fila in salida:
        if fila[1].split('/')[2] not in BLOQUEADOS:
            continue
        slug = re.sub(r'-(hero|g\d+)\.webp$', '', fila[0].split('/')[-1])
        por_modelo.setdefault(slug, []).append(fila)
    n = 0
    for slug, filas in por_modelo.items():
        libres = [u for u in fuente.get(slug, []) if u not in usadas]
        filas.sort(key=lambda f: (not f[0].endswith('-hero.webp'), int((re.search(r'-g(\d+)\.webp$', f[0]) or [0, 0])[1])))
        for fila, url in zip(filas, libres):
            fila[1] = url
            n += 1
        # La portada nunca queda vacía si el modelo tiene fotos: se repite la primera aunque ya esté en la galería.
        if filas[0][0].endswith('-hero.webp') and filas[0][1].split('/')[2] in BLOQUEADOS and fuente.get(slug):
            filas[0][1] = fuente[slug][0]
            n += 1
    return n


if __name__ == '__main__':
    main()
