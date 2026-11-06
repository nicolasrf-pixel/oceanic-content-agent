"""Agrega (o actualiza) un modelo de la biblioteca en el catálogo del sitio.

Escribe, desde biblioteca/<marca>/<slug>/:
  - sitio/assets/js/catalogo-data.js      entrada del modelo (tipo, textos cortos, ficha técnica verificada, hero)
  - sitio/assets/js/catalogo-contenido.js galería por categoría (solo fotos THIS_MODEL; los planos no)
  - sitio/scripts/fotos.tsv               fotos a descargar y optimizar en el build
Los textos cortos salen de drafts/<marca>/<slug>.json (hero.descripcion e introduccion, OCEANIC CONTENT en borrador).
Sin opcionales ni precios (decisión Oceanic 2026-11-04): se quitan de lo que se publica, la biblioteca queda completa.

Uso, desde la raíz del repo:  python3 tools/sitio_catalogo.py <marca> <slug> [<slug>...]
Después: python3 tools/sitio_fichas.py (ficha traducida) y revisar el sitio.
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
JS = RAIZ / 'sitio' / 'assets' / 'js'
TSV = RAIZ / 'sitio' / 'scripts' / 'fotos.tsv'

CATEGORIA = {'EXTERIOR': 'Exterior', 'INTERIOR': 'Interior', 'COCKPIT': 'Cubierta', 'CABIN': 'Camarotes',
             'HELM': 'Timonera', 'DETAIL': 'Detalle', 'UNDERWAY': 'Navegando', 'OTHER': 'Galería'}
CAMPOS = {'eslora': 'Eslora Total', 'manga': 'Manga Casco', 'calado': 'Calado', 'peso': 'Desplazamiento en rosca',
          'combustible': 'Capacidad Combustible', 'agua': 'Capacidad Agua Dulce', 'motor': 'Motorización',
          'velocidad': 'Velocidad máxima', 'literas': 'Literas', 'camarotes': 'Camarotes', 'banos': 'Baños',
          'certificacion': 'Certificación', 'construccion': 'Construcción'}
OPCIONAL_IMG = re.compile(r'upholstery|colou?rs?\b|layouts? & configurations', re.I)
OPC = re.compile(r'opcional|optional|\bopci[oó]n\b|\bopt\.', re.I)


def leer(nombre, glob):
    s = (JS / nombre).read_text()
    i = s.rindex(f'window.{glob}=')
    return s[:i], json.loads(s[i + len(glob) + 8:].rstrip().rstrip(';'))


def escribir(nombre, cab, glob, datos):
    (JS / nombre).write_text(cab + f'window.{glob}=' + json.dumps(datos, ensure_ascii=False, separators=(',', ':')) + ';\n')


def sin_opcion(v):  # "2 x 340 CV / HP (estándar); opción 2 x 440 CV / HP" → "2 x 340 CV / HP (estándar)"
    return '; '.join(p for p in str(v).split(';') if not OPC.search(p)).strip()


def modelo(marca, slug, previas=None):
    base = RAIZ / 'biblioteca' / marca / slug
    spec = json.loads((base / '02_ESPECIFICACIONES' / 'specifications.json').read_text())
    draft = json.loads((RAIZ / 'drafts' / marca / f'{slug}.json').read_text())
    imgs = json.loads((base / '05_MULTIMEDIA' / 'IMAGENES' / 'images.json').read_text())
    imgs = imgs['images'] if isinstance(imgs, dict) else imgs
    m = spec['model']
    specs = []
    for f in spec['fields']:
        if f['status'] != 'VERIFIED' or not f.get('display_value'):
            continue
        v = sin_opcion(f['display_value'])
        if not v:
            continue
        specs.append({'label': f['label'], 'value': v, 'note': f.get('display_note') or ''})
    por = {s['label']: s['value'] for s in specs}
    entrada = {'slug': slug, 'nombre': m['model'],  # como lo publica la web (Lagoon: EIGHTY 2, SIXTY 7)
               'anio': '' if 'NO DECLARADO' in str(m.get('model_year')) else str(m.get('model_year') or ''),
               'tipo': m['boat_type'], 'desc': draft['hero']['descripcion'], 'desc_larga': draft['introduccion']}
    entrada.update({k: por.get(lab, '') for k, lab in CAMPOS.items()})
    entrada['specs'] = specs

    # Sin planos ni muestras de opcionales (tapicerías, colores, configuraciones de cubierta): no son fotos del barco
    # y los opcionales no se publican (decisión Oceanic 2026-11-04).
    propias = [i for i in imgs if i['scope'] == 'THIS_MODEL' and i['category'] != 'PLANS'
               and not OPCIONAL_IMG.search(i.get('scope_evidence') or '')]
    # numeración estable: una foto que ya estaba publicada conserva su archivo (las tarjetas elegidas a mano y
    # resolucion.json apuntan a esos nombres); las nuevas toman los números siguientes
    previas = previas or {}
    usados = {f[0] for f in previas.values()}
    n_max = max([int(m.group(1)) for d in usados for m in [re.search(r'-g(\d+)\.webp$', d)] if m] or [0])
    fotos, galeria, n = [], {}, 0
    vistas = set()  # la misma foto publicada dos veces (cabecera y galería, o en dos tamaños) entra una sola vez
    def clave_foto(u):
        u = re.sub(r'/styles/[^/]+/public/', '/', (u or '').split('?')[0])
        u = re.sub(r'/media/cache/[^/]+/', '/media/', u)
        return re.sub(r'-\d+x\d+(?=\.\w+$)', '', re.sub(r'\.(jpe?g|png)\.webp$', r'.\1', u)).lower()
    for i in sorted(propias, key=lambda i: (i['category'] != 'HERO', not i.get('hero_candidate'))):
        url = i.get('cdn_url') or (i.get('original') or {}).get('url')
        if not url:
            continue
        k = clave_foto((i.get('original') or {}).get('url') or url)
        if k in vistas:
            continue
        vistas.add(k)
        if 'hero' not in entrada:
            destino = f'modelos/{slug}-hero.webp'
            entrada['hero'] = destino
            h = previas.get(url.split('?')[0]) or previas.get(((i.get('original') or {}).get('url') or '').split('?')[0])
            if h:
                url = h[1]
        else:
            fila = previas.get(url.split('?')[0]) or previas.get(((i.get('original') or {}).get('url') or '').split('?')[0])
            destino = fila[0] if fila else None
            if fila and not destino.endswith('-hero.webp'):
                url = fila[1]  # misma foto: se mantiene la URL web con la que ya se publicaba
            if not destino or destino.endswith('-hero.webp'):
                if previas:
                    n_max += 1
                    destino = f'modelos/{slug}-g{n_max}.webp'
                else:
                    n += 1
                    destino = f'modelos/{slug}-g{n}.webp'
            galeria.setdefault(CATEGORIA.get(i['category'], 'Galería'), []).append(destino)
        fotos.append((destino, url, (i.get('original') or {}).get('url') or url))
    return entrada, galeria, fotos


def propia(destino, slug):
    """Foto de este modelo y no de otro cuyo slug empieza igual (first-14 / first-14-se)."""
    return re.fullmatch(rf'modelos/{re.escape(slug)}-(hero|g\d+)\.webp', destino) is not None


def main(marca, slugs):
    cab, cat = leer('catalogo-data.js', 'OCEANIC_CATALOGO')
    cabc, con = leer('catalogo-contenido.js', 'OCEANIC_CONTENIDO')
    filas = [l.rstrip('\n').split('\t') for l in TSV.read_text().splitlines()]
    for slug in slugs:
        previas = {}
        for f in filas:
            if len(f) > 2 and propia(f[0], slug):
                previas.setdefault(f[1].split('?')[0], f)
                previas.setdefault(f[2].split('?')[0], f)
        entrada, galeria, fotos = modelo(marca, slug, previas)
        L = cat[marca]['modelos']
        i = next((k for k, x in enumerate(L) if x['slug'] == slug), None)
        if i is None:
            L.append(entrada)
        else:
            L[i] = entrada  # se respeta el orden de la gama
        con[f'{marca}/{slug}'] = {**{k: v for k, v in con.get(f'{marca}/{slug}', {}).items() if k != 'galeria'}, 'galeria': galeria}
        filas = [f for f in filas if not propia(f[0], slug)] + [list(f) for f in fotos]
        print(f'{marca}/{slug}: {entrada["tipo"]}, {len(entrada["specs"])} datos, {len(fotos)} fotos')
    escribir('catalogo-data.js', cab, 'OCEANIC_CATALOGO', cat)
    escribir('catalogo-contenido.js', cabc, 'OCEANIC_CONTENIDO', con)
    TSV.write_text('\n'.join('\t'.join(f) for f in filas) + '\n')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2:])
