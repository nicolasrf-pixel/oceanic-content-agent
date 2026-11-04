"""Traducción de las páginas oficiales al español con glosario por marca.

Cada frase distinta de las páginas oficiales de una marca se traduce UNA vez (fiel, español neutro, tuteo, sin
agregar ni quitar afirmaciones) en traducciones/<marca>.json {"inglés": "español"}. Con ese glosario se arma el
01_CONTENIDO/pagina-es.json de cada modelo, con la estructura que usa la ficha del sitio (docs/FICHAS.md).

Uso, desde la raíz del repo:
  python3 tools/traduccion.py pendientes <marca> [--max=N]   # frases sin traducir (JSON en la salida)
  python3 tools/traduccion.py armar <marca>                  # escribe pagina-es.json de los modelos completos
  python3 tools/traduccion.py sembrar <marca> <modelo>       # carga al glosario un pagina-es.json hecho a mano

Formatos de extract soportados: Axopar (hero / sections por bloque / standard_equipment / optional_equipment).
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BIBLIOTECA = RAIZ / 'biblioteca'
GLOSARIOS = RAIZ / 'traducciones'


def parrafos(t):
    return [p.strip() for p in re.split(r'\n\s*\n', (t or '').replace('\r', '')) if p.strip()]


def lineas(t):
    return [re.sub(r'^\s*[-•]\s*', '', l).strip() for l in (t or '').replace('\r', '').split('\n') if l.strip(' -•\t')]


def sin_frase_cortada(ps):
    """Si el último párrafo termina a mitad de frase (captura truncada), se descarta esa frase incompleta."""
    if ps and not re.search(r'[.!?…:)"”]$', ps[-1]):
        corte = max(ps[-1].rfind('. '), ps[-1].rfind('! '), ps[-1].rfind('? '))
        ps = ps[:-1] + ([ps[-1][:corte + 1]] if corte > 0 else [])
    return ps


def texto_modal(it):
    """modal_text = [título, textos alternativos de imágenes…, cuerpo]: se toma el cuerpo (frases con puntuación)."""
    partes = [p for p in (it.get('modal_text') or [])[1:] if isinstance(p, str) and len(p) > 60 and re.search(r'[.!?]', p)]
    return sin_frase_cortada(parrafos('\n\n'.join(partes)))


def plantilla_axopar(j):
    """Estructura de pagina-es.json con los textos en inglés (hojas = frases a traducir)."""
    h = j.get('hero') or {}
    titulo = (j.get('page_title') or h.get('title') or '').strip()
    heading = (h.get('heading') or '').strip()
    titular = re.split(r'\s+[–-]\s+', heading, maxsplit=1)[1] if re.search(r'\s[–-]\s', heading) else ''
    if heading and heading != titulo and not titular:
        titular = heading
    P = {'portada': {}, 'intro': parrafos(h.get('intro')), 'bloques': [], 'destacados': [], 'configuracion': [],
         'equipamiento': {'serie': []}}
    if titular:
        P['portada']['titular'] = titular
    if (h.get('subheading') or '').strip():
        P['portada']['bajada'] = h['subheading'].strip()
    for s in j.get('sections') or []:
        t, tit = s['block_type'], (s.get('title') or '').strip()
        items = s.get('items') or []
        if t in ('BannerBlock', 'AnimationBlock') and s.get('intro') and not tit.lower().startswith('configure'):
            P['bloques'].append({'titulo': tit, 'texto': parrafos(s['intro'])})
        elif t == 'TabsBlock' and items and 'option' in tit.lower():
            continue  # opcionales: no se publican (decisión Oceanic 2026-11-04, se conversan en persona)
        elif t == 'ModalLiftBlock':
            continue  # ediciones y paquetes opcionales (Upgrade Options): tampoco se publican
        elif t == 'TabsBlock' and items:
            P['destacados'].append({'grupo': tit, 'items': [
                {k: v for k, v in (('titulo', (it.get('title') or it.get('name') or '').strip()),
                                   ('texto', ' '.join(parrafos(it.get('text'))))) if v} for it in items]})
        elif t == 'CardListBlock' and items:
            g = {'grupo': tit}
            if s.get('intro'):
                g['intro'] = ' '.join(parrafos(s['intro']))
            g['items'] = []
            for it in items:
                cuerpo = parrafos(re.sub(r'^\s*-\s*', '', it.get('text') or '')) or texto_modal(it)
                x = {'titulo': (it.get('title') or '').strip()}
                if cuerpo:
                    x['texto'] = cuerpo
                g['items'].append(x)
            P['configuracion'].append(g)
    # Solo equipamiento de serie: el opcional no se publica (decisión Oceanic 2026-11-04)
    for clave, dest in (('standard_equipment', 'serie'),):
        for g in j.get(clave) or []:
            its = lineas(g.get('description'))
            if its:
                P['equipamiento'][dest].append({'grupo': g['name'].strip(), 'items': its})
    return {k: v for k, v in P.items() if v and (k != 'equipamiento' or v['serie'])}


def hojas(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, list):
        for v in x:
            yield from hojas(v)
    elif isinstance(x, dict):
        for v in x.values():
            yield from hojas(v)


def traducir(x, glos, faltan):
    if isinstance(x, str):
        if x not in glos:
            faltan.add(x)
        return glos.get(x, x)
    if isinstance(x, list):
        return [traducir(v, glos, faltan) for v in x]
    return {k: traducir(v, glos, faltan) for k, v in x.items()}


def modelos(marca):
    for ex in sorted(BIBLIOTECA.glob(f'{marca}/*/07_FUENTES/extract/S1-*.json')):
        yield ex.parent.parent.parent, ex


def glosario(marca):
    f = GLOSARIOS / f'{marca}.json'
    return json.loads(f.read_text()) if f.exists() else {}


def guardar_glosario(marca, g):
    GLOSARIOS.mkdir(exist_ok=True)
    (GLOSARIOS / f'{marca}.json').write_text(json.dumps(dict(sorted(g.items())), ensure_ascii=False, indent=1) + '\n')


def cmd_pendientes(marca, maximo):
    glos, vistos = glosario(marca), []
    for _, ex in modelos(marca):
        for h in hojas(plantilla_axopar(json.loads(ex.read_text()))):
            if h not in glos and h not in vistos:
                vistos.append(h)
    print(json.dumps({'pendientes': len(vistos), 'lote': vistos[:maximo]}, ensure_ascii=False, indent=1))


def cmd_armar(marca):
    glos = glosario(marca)
    listos, incompletos = 0, []
    for carpeta, ex in modelos(marca):
        j = json.loads(ex.read_text())
        faltan = set()
        P = traducir(plantilla_axopar(j), glos, faltan)
        if faltan:
            incompletos.append(f'{carpeta.name} ({len(faltan)})')
            continue
        destino = carpeta / '01_CONTENIDO' / 'pagina-es.json'
        previo = json.loads(destino.read_text()) if destino.exists() else {}
        salida = {'estado': previo.get('estado', 'BORRADOR'),
                  'criterio': 'Traducción fiel al español neutro (tuteo) de la página oficial, con el glosario '
                              f'traducciones/{marca}.json. No agrega ni quita afirmaciones; si la captura corta una '
                              'frase, se omite la frase incompleta. Nombres de productos, telas, motores y marcas sin traducir.',
                  'fuente': j.get('source_url'), 'capturada': j.get('accessed_at'),
                  'extract': str(ex.relative_to(carpeta))}
        salida.update(P)
        destino.write_text(json.dumps(salida, ensure_ascii=False, indent=1) + '\n')
        listos += 1
    print(f'{listos} fichas armadas; incompletas: {", ".join(incompletos) or "ninguna"}')


def cmd_sembrar(marca, modelo):
    """Alinea un pagina-es.json hecho a mano con la plantilla en inglés y carga los pares al glosario."""
    carpeta = BIBLIOTECA / marca / modelo
    ex = next((carpeta / '07_FUENTES' / 'extract').glob('S1-*.json'))
    en = plantilla_axopar(json.loads(ex.read_text()))
    es = json.loads((carpeta / '01_CONTENIDO' / 'pagina-es.json').read_text())
    glos, n = glosario(marca), 0

    def par(a, b):
        nonlocal n
        if isinstance(a, str) and isinstance(b, str):
            if a not in glos:
                glos[a] = b
                n += 1
        elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
            for x, y in zip(a, b):
                par(x, y)
        elif isinstance(a, dict) and isinstance(b, dict):
            for k in a:
                if k in b:
                    par(a[k], b[k])
    par(en, es)
    guardar_glosario(marca, glos)
    print(f'{n} frases cargadas al glosario de {marca}')


if __name__ == '__main__':
    a = sys.argv[1:]
    opts = dict(x[2:].split('=', 1) for x in a if x.startswith('--'))
    a = [x for x in a if not x.startswith('--')]
    if a[:1] == ['pendientes']:
        cmd_pendientes(a[1], int(opts.get('max', 200)))
    elif a[:1] == ['armar']:
        cmd_armar(a[1])
    elif a[:1] == ['sembrar']:
        cmd_sembrar(a[1], a[2])
    else:
        print(__doc__)
