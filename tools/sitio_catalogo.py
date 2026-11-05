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
OPC = re.compile(r'opcional|optional|\bopci[oó]n\b|\bopt\.', re.I)


def leer(nombre, glob):
    s = (JS / nombre).read_text()
    i = s.rindex(f'window.{glob}=')
    return s[:i], json.loads(s[i + len(glob) + 8:].rstrip().rstrip(';'))


def escribir(nombre, cab, glob, datos):
    (JS / nombre).write_text(cab + f'window.{glob}=' + json.dumps(datos, ensure_ascii=False, separators=(',', ':')) + ';\n')


def sin_opcion(v):  # "2 x 340 CV / HP (estándar); opción 2 x 440 CV / HP" → "2 x 340 CV / HP (estándar)"
    return '; '.join(p for p in str(v).split(';') if not OPC.search(p)).strip()


def modelo(marca, slug):
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

    propias = [i for i in imgs if i['scope'] == 'THIS_MODEL' and i['category'] != 'PLANS']
    fotos, galeria, n = [], {}, 0
    for i in sorted(propias, key=lambda i: (i['category'] != 'HERO', not i.get('hero_candidate'))):
        url = i.get('cdn_url') or (i.get('original') or {}).get('url')
        if not url:
            continue
        if 'hero' not in entrada:
            destino = f'modelos/{slug}-hero.webp'
            entrada['hero'] = destino
        else:
            n += 1
            destino = f'modelos/{slug}-g{n}.webp'
            galeria.setdefault(CATEGORIA.get(i['category'], 'Galería'), []).append(destino)
        fotos.append((destino, url, (i.get('original') or {}).get('url') or url))
    return entrada, galeria, fotos


def main(marca, slugs):
    cab, cat = leer('catalogo-data.js', 'OCEANIC_CATALOGO')
    cabc, con = leer('catalogo-contenido.js', 'OCEANIC_CONTENIDO')
    filas = [l.rstrip('\n').split('\t') for l in TSV.read_text().splitlines()]
    for slug in slugs:
        entrada, galeria, fotos = modelo(marca, slug)
        L = cat[marca]['modelos']
        i = next((k for k, x in enumerate(L) if x['slug'] == slug), None)
        if i is None:
            L.append(entrada)
        else:
            L[i] = entrada  # se respeta el orden de la gama
        con[f'{marca}/{slug}'] = {**{k: v for k, v in con.get(f'{marca}/{slug}', {}).items() if k != 'galeria'}, 'galeria': galeria}
        filas = [f for f in filas if not f[0].startswith(f'modelos/{slug}-')] + [list(f) for f in fotos]
        print(f'{marca}/{slug}: {entrada["tipo"]}, {len(entrada["specs"])} datos, {len(fotos)} fotos')
    escribir('catalogo-data.js', cab, 'OCEANIC_CATALOGO', cat)
    escribir('catalogo-contenido.js', cabc, 'OCEANIC_CONTENIDO', con)
    TSV.write_text('\n'.join('\t'.join(f) for f in filas) + '\n')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2:])
