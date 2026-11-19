"""Logos oficiales de los premios de cada modelo (decisión Oceanic 2026-11-05: el premio se muestra con su logo).

Lee la página oficial de cada modelo que publica premios y toma el logo que esa misma página muestra:
  - Beneteau: bloque "Awards" (cada logo con el nombre del premio en su título). Es la lista vigente de la página:
    reemplaza la de la captura (trae premios nuevos y quita los que la marca sacó).
  - Aquila: imágenes del premio (el nombre va en el archivo). También reemplazan la lista capturada.
  - Lagoon, XO y Axopar (AX/E 22): emparejados a la vista en tools/premios-logos-manual.json (Lagoon publica los logos
    en una tabla aparte de la lista; XO, la insignia dentro de una foto; Axopar, tres logos en una sola imagen).
El logo se guarda como copia web liviana en sitio/assets/img/premios/ (no se enlaza al sitio del fabricante: el
visitante no se conecta a terceros al abrir la ficha) y queda la URL original. Escribe tools/premios-logos.json,
que usa tools/sitio_medios.py. Saffier no publica logos de sus premios: quedan como texto.

Uso, desde la raíz del repo:  python3 tools/sitio_premios_logos.py
"""
import datetime
import hashlib
import io
import json
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, quote, unquote

from bs4 import BeautifulSoup
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / 'tools'))
from sitio_medios import premio, pulir, nombre_modelo  # noqa: E402

BIBLIOTECA = RAIZ / 'biblioteca'
LOGOS = RAIZ / 'sitio' / 'assets' / 'img' / 'premios'
SALIDA = RAIZ / 'tools' / 'premios-logos.json'
MANUAL = json.loads((RAIZ / 'tools' / 'premios-logos-manual.json').read_text())
UA = 'Mozilla/5.0 (compatible; OceanicSite/1.0)'


def bajar(url):
    url = quote(url, safe=':/?&=%#+,;@')
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40) as r:
        return r.read()


def guardar_logo(url, recorte=None):
    im = Image.open(io.BytesIO(bajar(url)))
    im = im.convert('RGBA')
    if recorte:
        im = im.crop(tuple(recorte))
    im.thumbnail((480, 300), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=88, method=6)
    datos = buf.getvalue()
    nombre = hashlib.sha1(datos).hexdigest()[:14] + '.webp'
    LOGOS.mkdir(parents=True, exist_ok=True)
    (LOGOS / nombre).write_bytes(datos)
    return 'premios/' + nombre


def norm(t):
    return re.sub(r'\s+', ' ', t or '').strip().lower()


def pagina_oficial(carpeta):
    for ex in sorted((carpeta / '07_FUENTES' / 'extract').glob('S1*.json')):
        d = json.loads(ex.read_text())
        return d.get('source_url') or d.get('url'), d
    return None, {}


def automaticos(url, html, modelo):
    """(raw, nombre, detalle, logo_url) de los logos que la página enlaza solos a su premio."""
    s = BeautifulSoup(html, 'html.parser')
    out = []
    if 'beneteau.com' in url:
        h = s.find('h2', string=re.compile('Award', re.I))
        if h:
            for d in h.find_parent().select('[title]'):
                i = d.find('img')
                if i and d.get('title'):
                    out.append((d['title'], urljoin(url, i.get('src') or i.get('data-src'))))
    elif 'aquilaboats.com' in url:
        for i in s.find_all('img'):
            src = (i.get('src') or '').split('style=')[0]
            if re.search(r'award', src, re.I):
                raw = unquote(src.split('?')[0].rsplit('/', 1)[-1])
                out.append((raw, src))
    res = []
    for raw, logo in out:
        p = premio(raw, modelo)
        if p:
            p = pulir(p)
            res.append({'premio': raw, 'nombre': p['nombre'], 'detalle': p['detalle'], 'logo_url': logo})
        else:
            print(f'  aviso: logo sin nombre traducible, no se publica: {url}: {raw!r}')
    return res


def main():
    hoy = datetime.date.today().isoformat()
    resultado = {}
    modelos = set(MANUAL) - {'_doc'}
    for carpeta in sorted(p for p in BIBLIOTECA.glob('*/*') if p.is_dir()):
        clave = f'{carpeta.parent.name}/{carpeta.name}'
        url, ex = pagina_oficial(carpeta)
        if url and (ex.get('awards') or clave in modelos):
            modelos.add(clave)
    for clave in sorted(modelos):
        carpeta = BIBLIOTECA / clave
        url, _ = pagina_oficial(carpeta)
        modelo = nombre_modelo(carpeta)
        try:
            html = bajar(url).decode('utf-8', 'ignore')
        except Exception as e:  # p. ej. Saffier responde 403 a lectores automáticos: sus premios quedan como texto
            print(f'  {clave}: no se pudo leer la página oficial ({e}); se mantiene lo capturado')
            continue
        entradas = automaticos(url, html, modelo)
        manual = MANUAL.get(clave, [])
        # ajustes manuales sobre los automáticos (mismo premio): nombre o detalle leídos en el logo
        for m in [m for m in manual if 'logo' not in m and not m.get('omitir')]:
            for e in entradas:
                if norm(e['premio']) == norm(m['premio']):
                    e.update({k: m[k] for k in ('nombre', 'detalle')})
        for m in [m for m in manual if 'logo' in m]:
            if unquote(m['logo']).split('?')[0].rsplit('/', 1)[-1] not in unquote(html):
                print(f'  aviso: {clave}: el logo ya no está en la página oficial, no se publica: {m["nombre"]}')
                continue
            entradas.append({'premio': m.get('premio'), 'nombre': m['nombre'], 'detalle': m.get('detalle', ''),
                             'logo_url': m['logo'], 'recorte': m.get('recorte')})
        premios = []
        for e in entradas:
            try:
                e['logo'] = guardar_logo(e['logo_url'], e.pop('recorte', None))
            except Exception as err:
                print(f'  aviso: {clave}: no se pudo bajar el logo de {e["nombre"]}: {err}')
                e.pop('recorte', None)
            premios.append(e)
        if not premios and not manual:
            continue
        resultado[clave] = {
            'pagina': url, 'consultada': hoy,
            # Beneteau y Aquila: la lista de logos de la página es la lista vigente de premios
            'reemplaza_todo': any(d in url for d in ('beneteau.com', 'aquilaboats.com')),
            'reemplaza': sorted({e['premio'] for e in premios if e.get('premio')} |
                                {m['premio'] for m in manual if m.get('omitir')}),
            'premios': premios,
        }
        print(f'{clave}: {len(premios)} logos')
    SALIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=1) + '\n')
    usados = {e['logo'].split('/')[-1] for v in resultado.values() for e in v['premios'] if e.get('logo')}
    for f in LOGOS.glob('*.webp'):
        if f.name not in usados:
            f.unlink()
    print(f'{len(resultado)} modelos · {len(usados)} logos')


if __name__ == '__main__':
    main()
