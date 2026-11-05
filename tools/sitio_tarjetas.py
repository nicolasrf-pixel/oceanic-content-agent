"""Elige la foto de la tarjeta de cada modelo (gamas de marca, "Más de la marca", destacados de la portada).

La tarjeta es horizontal (3:2) y debe mostrar el barco completo. La portada oficial no siempre sirve: hay portadas
panorámicas (3,5:1, el barco queda cortado al recortarla) y verticales (Lagoon 47). Regla: la primera foto del modelo
con proporción entre 1,35 y 1,85, buscando en este orden: Navegando, Exterior, portada, Galería, Cubierta.
Revisión visual: tools/tarjetas-revision.json fija la foto de los modelos donde la regla no acierta
({"<marca>/<slug>": "modelos/<archivo>.webp"}).

Escribe el campo "tarjeta" en sitio/assets/js/catalogo-data.js. Necesita las fotos descargadas en sitio/assets/img/
(node sitio/scripts/fotos.mjs).
Uso, desde la raíz del repo:  python3 tools/sitio_tarjetas.py [--hojas=<carpeta>]   (hojas de contacto para revisar)
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
JS = RAIZ / 'sitio' / 'assets' / 'js'
IMG = RAIZ / 'sitio' / 'assets' / 'img'
REVISION = RAIZ / 'tools' / 'tarjetas-revision.json'
ORDEN = ['Navegando', 'Exterior', '_hero', 'Galería', 'Cubierta']


def leer(nombre, glob):
    s = (JS / nombre).read_text()
    i = s.rindex(f'window.{glob}=')
    return s, i, json.loads(s[i + len(glob) + 8:].rstrip().rstrip(';'))


def proporcion(ruta):
    try:
        with Image.open(IMG / ruta) as im:
            return im.width / im.height
    except Exception:
        return None


def elegir(mo, galeria):
    for grupo in ORDEN:
        for f in ([mo.get('hero_oficial') or mo.get('hero')] if grupo == '_hero' else galeria.get(grupo, [])):
            r = f and proporcion(f)
            if r and 1.35 <= r <= 1.85:
                return f
    return mo.get('hero')


def main(hojas=None):
    s, i, cat = leer('catalogo-data.js', 'OCEANIC_CATALOGO')
    _, _, con = leer('catalogo-contenido.js', 'OCEANIC_CONTENIDO')
    rev = {k: v for k, v in (json.loads(REVISION.read_text()) if REVISION.exists() else {}).items() if not k.startswith("_") or k == "_portadas"}
    portadas = {k for k in (rev.pop('_portadas', None) or {}) if not k.startswith('_')}
    elegidas = []
    for marca, v in cat.items():
        for mo in v['modelos']:
            clave = f'{marca}/{mo["slug"]}'
            t = rev.get(clave) or elegir(mo, (con.get(clave) or {}).get('galeria', {}))
            if t:
                mo['tarjeta'] = t
                # portada de la ficha: si la oficial es vertical o la revisión la marca (interior, sin barco), va la tarjeta
                hr = mo.get('hero') and proporcion(mo['hero'])
                if clave in portadas or (hr and hr < 1.3):
                    mo.setdefault('hero_oficial', mo.get('hero'))
                    mo['hero'] = t
            else:
                mo.pop('tarjeta', None)
            elegidas.append((clave, t))
    (JS / 'catalogo-data.js').write_text(s[:i] + 'window.OCEANIC_CATALOGO=' +
                                          json.dumps(cat, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'{sum(1 for _, t in elegidas if t)} tarjetas de {len(elegidas)} modelos')
    if hojas:
        Path(hojas).mkdir(parents=True, exist_ok=True)
        W, H, C = 300, 200, 5
        for n in range(0, len(elegidas), 30):
            lote = elegidas[n:n + 30]
            hoja = Image.new('RGB', (W * C, (H + 18) * ((len(lote) + C - 1) // C)), 'white')
            d = ImageDraw.Draw(hoja)
            for k, (clave, t) in enumerate(lote):
                x, y = (k % C) * W, (k // C) * (H + 18)
                d.text((x + 3, y + 2), f'{n + k} {clave}'[:48], fill='black')
                try:
                    im = Image.open(IMG / t).convert('RGB')
                    r = im.width / im.height  # recorte 3:2 centrado, como en la tarjeta
                    if r > 1.5:
                        w = int(im.height * 1.5); im = im.crop(((im.width - w) // 2, 0, (im.width + w) // 2, im.height))
                    else:
                        h = int(im.width / 1.5); im = im.crop((0, (im.height - h) // 2, im.width, (im.height + h) // 2))
                    hoja.paste(im.resize((W - 4, H - 4)), (x + 2, y + 18))
                except Exception:
                    d.rectangle((x + 2, y + 18, x + W - 2, y + H + 14), fill='red')
            hoja.save(Path(hojas) / f'hoja-{n // 30 + 1}.png')


if __name__ == '__main__':
    main(next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--hojas=')), None))
