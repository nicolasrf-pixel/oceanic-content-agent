"""Publica en el sitio las fichas traducidas de la biblioteca.

Lee biblioteca/<marca>/<modelo>/01_CONTENIDO/pagina-es.json (traducción fiel al español de la página oficial)
y escribe sitio/assets/data/fichas/<marca>/<modelo>.json, que lee sitio/assets/js/ficha-tpl.js.
Agrega la gama oficial del modelo desde el extract. Falla si una traducción está incompleta o parece seguir en
inglés (el sitio nunca publica textos en inglés).

Uso, desde la raíz del repo:  python3 tools/sitio_fichas.py [--check]
  --check  solo valida, no escribe.
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BIBLIOTECA = RAIZ / 'biblioteca'
SALIDA = RAIZ / 'sitio' / 'assets' / 'data' / 'fichas'

# Palabras muy frecuentes en inglés que no existen en español: si aparecen varias, el texto no está traducido.
INGLES = re.compile(r"\b(the|and|with|for|your|from|this|that|which|while|offers|boat|deck|cabin|optional)\b", re.I)
PUBLICAR = ('portada', 'intro', 'bloques', 'destacados', 'configuracion', 'equipamiento')


def textos(x, ruta=''):
    """Recorre el JSON y entrega (ruta, texto) de cada string publicable."""
    if isinstance(x, str):
        yield ruta, x
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from textos(v, f'{ruta}[{i}]')
    elif isinstance(x, dict):
        for k, v in x.items():
            yield from textos(v, f'{ruta}.{k}' if ruta else k)


def validar(p, d):
    errores = []
    if d.get('estado') not in ('BORRADOR', 'REVISADO'):
        errores.append('estado debe ser BORRADOR o REVISADO')
    if not d.get('fuente', '').startswith('http'):
        errores.append('falta la URL de la fuente oficial')
    if not any(d.get(k) for k in PUBLICAR):
        errores.append('no tiene contenido')
    for ruta, t in textos({k: d[k] for k in PUBLICAR if k in d}):
        if not t.strip():
            errores.append(f'{ruta}: texto vacío')
        elif len(INGLES.findall(t)) >= 2:
            errores.append(f'{ruta}: parece inglés: {t[:70]!r}')
    return errores


def gama(carpeta):
    for ex in sorted((carpeta / '07_FUENTES' / 'extract').glob('*.json')):
        j = json.loads(ex.read_text())
        r = j.get('range') or j.get('range_models') or []
        nombres = [x if isinstance(x, str) else (x.get('name') or x.get('title') or '') for x in r]
        if nombres:
            return [n for n in nombres if n]
    return []


def main(solo_validar=False):
    archivos = sorted(BIBLIOTECA.glob('*/*/01_CONTENIDO/pagina-es.json'))
    total_err = 0
    for p in archivos:
        carpeta = p.parent.parent
        marca, modelo = carpeta.parent.name, carpeta.name
        d = json.loads(p.read_text())
        errores = validar(p, d)
        if errores:
            total_err += len(errores)
            print(f'ERROR {marca}/{modelo}:')
            for e in errores:
                print('   ', e)
            continue
        if solo_validar:
            continue
        salida = {k: d[k] for k in PUBLICAR if d.get(k)}
        salida['estado'] = d['estado']
        salida['fuente'] = d['fuente']
        g = gama(carpeta)
        if g:
            salida['gama'] = g
        destino = SALIDA / marca / f'{modelo}.json'
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(json.dumps(salida, ensure_ascii=False, indent=1) + '\n')
    if not solo_validar and not total_err:
        # Índice de fichas traducidas: la plantilla solo pide las que existen (sin 404 para las demás).
        publicadas = sorted(f'{p.parent.parent.parent.name}/{p.parent.parent.name}' for p in archivos)
        SALIDA.mkdir(parents=True, exist_ok=True)
        (SALIDA / 'index.json').write_text(json.dumps(publicadas, ensure_ascii=False, indent=0) + '\n')
    print(f'{len(archivos)} fichas traducidas, {total_err} errores')
    return 1 if total_err else 0


if __name__ == '__main__':
    sys.exit(main('--check' in sys.argv))
