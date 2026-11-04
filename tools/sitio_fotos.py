"""Arma la lista de fotos del sitio (sitio/scripts/fotos.tsv) con la versión web liviana de cada foto.

Cada fila: destino (relativo a sitio/assets/img/), URL a descargar y URL del original (referencia).
La URL a descargar sale de la biblioteca (images.json):
  - Axopar: el CDN redimensiona (`cdn_url?width=…`); los originales del DAM pesan 30-70 MB y no sirven para web.
  - Otras marcas: `cdn_url` (versión web que publica la marca) o, si no hay, el original.
  - Fotos sin registro en la biblioteca (usados de oceanic.cl): la URL que ya tenía la lista.
Las fotos se descargan y convierten en el build de Cloudflare con sitio/scripts/fotos.mjs.

Uso, desde la raíz del repo:  python3 tools/sitio_fotos.py
"""
import csv
import json
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


def url_web(im, original, destino):
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
        salida.append([destino, url_web(im, original, destino), original])
    with TSV.open('w', newline='') as f:
        w = csv.writer(f, delimiter='\t', lineterminator='\n')
        w.writerow(cab)
        w.writerows(salida)
    print(f'{len(salida)} fotos; {sin} sin registro en la biblioteca (se usa su URL tal cual)')


if __name__ == '__main__':
    main()
