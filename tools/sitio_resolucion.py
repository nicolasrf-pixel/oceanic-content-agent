"""Resolución de las fotos de los modelos, para que el sitio nunca muestre una foto agrandada (borrosa).

Escribe sitio/assets/data/resolucion.json con el ancho y alto de cada foto de assets/img/modelos/ que mide menos de
1600 px de lado mayor (las más grandes sirven en cualquier espacio y no se listan). La ficha (ficha-tpl.js) elige para
cada espacio solo fotos que alcanzan su tamaño; si no hay ninguna, el espacio queda sin foto.
Las copias web salen de los originales del fabricante sin agrandar, así que las medidas son las mismas en cada build.

Uso, desde la raíz del repo (con las fotos descargadas):  python3 tools/sitio_resolucion.py
"""
import json
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
FOTOS = RAIZ / 'sitio' / 'assets' / 'img' / 'modelos'
SALIDA = RAIZ / 'sitio' / 'assets' / 'data' / 'resolucion.json'

d = {}
for f in sorted(FOTOS.glob('*.webp')):
    try:
        w, h = Image.open(f).size
    except Exception:
        continue
    if w < 1600:  # importa el ancho: una foto vertical alta puede quedar angosta para un espacio ancho
        d[f.name] = [w, h]
SALIDA.write_text(json.dumps(d, separators=(',', ':')) + '\n')
print(f'{len(d)} fotos bajo 1600 px registradas en {SALIDA.relative_to(RAIZ)}')
