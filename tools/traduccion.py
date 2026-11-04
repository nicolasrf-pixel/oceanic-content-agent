"""Traducción de las páginas oficiales al español con glosario por marca.

Cada frase distinta de las páginas oficiales de una marca se traduce UNA vez (fiel, español neutro, tuteo, sin
agregar ni quitar afirmaciones) en traducciones/<marca>.json {"inglés": "español"}. Con ese glosario se arma el
01_CONTENIDO/pagina-es.json de cada modelo, con la estructura que usa la ficha del sitio (docs/FICHAS.md).

Uso, desde la raíz del repo:
  python3 tools/traduccion.py pendientes <marca> [--max=N]   # frases sin traducir (JSON en la salida)
  python3 tools/traduccion.py agregar <marca> <archivo>     # traducciones del último lote (lista JSON, mismo orden)
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


# Contenido que no se publica (decisiones Oceanic 2026-11-04): opcionales, ediciones, configuraciones y colores
# (se conversan en persona) y llamados a la red de distribuidores de la marca (en el sitio, el contacto es Oceanic).
NO_PUBLICAR = re.compile(r'option|upgrade|edition|configur|layout|alternativ|upholster|colou?r|more to explore|dealer|'
                         r'brochure|newsletter|manual|try before|sea trial', re.I)


def es_opcional(texto):
    return bool(re.search(r'\boptional\b|\bupgrade', texto or '', re.I))


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
        if NO_PUBLICAR.search(tit):
            continue
        if t in ('BannerBlock', 'AnimationBlock') and s.get('intro') and not tit.lower().startswith('configure'):
            P['bloques'].append({'titulo': tit, 'texto': parrafos(s['intro'])})
        elif t == 'TabsBlock' and items and 'option' in tit.lower():
            continue  # opcionales: no se publican (decisión Oceanic 2026-11-04, se conversan en persona)
        elif t == 'ModalLiftBlock':
            continue  # ediciones y paquetes opcionales (Upgrade Options): tampoco se publican
        elif t == 'TabsBlock' and items:
            its = [{k: v for k, v in (('titulo', (it.get('title') or it.get('name') or '').strip()),
                                      ('texto', ' '.join(parrafos(it.get('text'))))) if v} for it in items]
            # pestañas sobre opcionales (p. ej. "Optional toilet") no se publican
            its = [x for x in its if not es_opcional(x.get('titulo')) and not NO_PUBLICAR.search(x.get('titulo', ''))]
            if its:
                P['destacados'].append({'grupo': tit, 'items': its})
        # CardListBlock (configuraciones, distribuciones, colores) y ModalLiftBlock (ediciones): no se publican
    # Solo equipamiento de serie: el opcional no se publica (decisión Oceanic 2026-11-04)
    for clave, dest in (('standard_equipment', 'serie'),):
        for g in j.get(clave) or []:
            its = lineas(g.get('description'))
            if its:
                P['equipamiento'][dest].append({'grupo': g['name'].strip(), 'items': its})
    return limpiar({k: v for k, v in P.items() if v and (k != 'equipamiento' or v['serie'])})


BASURA = {'', 'test', 'lorem ipsum'}  # textos vacíos o de prueba olvidados en la web oficial


def limpiar(x):
    """Quita textos vacíos o de prueba (p. ej. un bloque "Test" en la web) para que no se traduzcan ni publiquen."""
    vacio = lambda v: v in (None, [], {}) or (isinstance(v, str) and v.strip().lower() in BASURA)
    if isinstance(x, dict):
        x = {k: limpiar(v) for k, v in x.items() if not vacio(v)}
        return {k: v for k, v in x.items() if not vacio(v)}
    if isinstance(x, list):
        x = [limpiar(v) for v in x if not vacio(v)]
        return [v for v in x if not vacio(v) and v != {}]
    return x


OPCIONAL = re.compile(r'\boptional\b|\boptions?\b|\bupgrade|en option|\bopcional', re.I)


def sin_opcionales(ps):
    """Párrafos que mencionan opcionales: no se publican (decisión Oceanic 2026-11-04)."""
    return [p for p in ps if not OPCIONAL.search(p)]


def titulo_limpio(t):
    """Quita marcas técnicas de la captura: "Events (home)", "Features (página Specifications)", "Página Home"."""
    t = re.sub(r'\s*\((home|página [^)]*)\)\s*$', '', (t or '').strip(), flags=re.I)
    return re.sub(r'^Página\s+', '', t).strip()


def plantilla_comun(j):
    """Extract compartido (Beneteau, Lagoon, Aquila, XO, Solaris, Saffier, Excess, VX One, Oceanic Power)."""
    P = {'portada': {}, 'intro': sin_opcionales(parrafos(j.get('description'))), 'bloques': [], 'destacados': [],
         'equipamiento': {'serie': []}}
    if (j.get('tagline') or '').strip():
        P['portada']['titular'] = j['tagline'].strip()
    desc = re.sub(r'\s+', ' ', j.get('description') or '')[:80]
    for s in j.get('sections') or []:
        kind, tit = (s.get('kind') or ''), titulo_limpio(s.get('title'))
        if 'video' in kind or 'polar' in kind or NO_PUBLICAR.search(tit):
            continue
        items = [it for it in (s.get('items') or []) if isinstance(it, dict)]
        if kind == 'features' and items:
            # listas de características / "Esta embarcación incluye": equipamiento de serie
            its = [it['title'].strip() for it in items if (it.get('title') or '').strip() and not OPCIONAL.search(it['title'])]
            if its:
                P['equipamiento']['serie'].append({'grupo': tit, 'items': its})
        elif items:
            its = [{k: v for k, v in (('titulo', (it.get('title') or '').strip()),
                                      ('texto', ' '.join(parrafos(it.get('text'))))) if v} for it in items]
            its = [x for x in its if not OPCIONAL.search(x.get('titulo', '') + ' ' + x.get('texto', ''))
                   and not NO_PUBLICAR.search(x.get('titulo', ''))]
            if its:
                P['destacados'].append({'grupo': tit, 'items': its})
        elif s.get('intro'):
            texto = sin_opcionales(parrafos(s['intro']))
            if texto and re.sub(r'\s+', ' ', texto[0])[:80] != desc:  # no repetir la descripción
                P['bloques'].append({'titulo': tit, 'texto': texto})
    return limpiar({k: v for k, v in P.items() if v and (k != 'equipamiento' or v['serie'])})


def plantilla(j):
    return plantilla_axopar(j) if 'hero' in j else plantilla_comun(j)


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


def ocultos():
    """Modelos apagados en el sitio (sitio/assets/js/publicacion.js): no se traducen."""
    js = (RAIZ / 'sitio' / 'assets' / 'js' / 'publicacion.js').read_text()
    datos = json.loads(js.split('/*DATOS*/', 1)[1].split('/*FIN*/', 1)[0])
    return set(datos.get('ocultos', {}))


def modelos(marca):
    apagados = ocultos()
    for ex in sorted(BIBLIOTECA.glob(f'{marca}/*/07_FUENTES/extract/S1-*.json')):
        carpeta = ex.parent.parent.parent
        if f'{marca}/{carpeta.name}' not in apagados:
            yield carpeta, ex


def glosario(marca):
    f = GLOSARIOS / f'{marca}.json'
    return json.loads(f.read_text()) if f.exists() else {}


def guardar_glosario(marca, g):
    GLOSARIOS.mkdir(exist_ok=True)
    (GLOSARIOS / f'{marca}.json').write_text(json.dumps(dict(sorted(g.items())), ensure_ascii=False, indent=1) + '\n')


def cmd_pendientes(marca, maximo):
    glos, vistos = glosario(marca), []
    for carpeta, ex in modelos(marca):
        man = carpeta / '01_CONTENIDO' / 'pagina-es.json'
        if man.exists() and json.loads(man.read_text()).get('manual'):
            continue
        for h in hojas(plantilla(json.loads(ex.read_text()))):
            if h not in glos and h not in vistos:
                vistos.append(h)
    lote = vistos[:maximo]
    GLOSARIOS.mkdir(exist_ok=True)
    (GLOSARIOS / f'.lote-{marca}.json').write_text(json.dumps(lote, ensure_ascii=False, indent=0) + '\n')
    print(json.dumps({'pendientes': len(vistos), 'lote': lote}, ensure_ascii=False, indent=1))


def cmd_agregar(marca, archivo, omitidas=()):
    """Agrega al glosario las traducciones de un archivo JSON: lista en el mismo orden que el último lote."""
    lote = json.loads((GLOSARIOS / f'.lote-{marca}.json').read_text())
    es = json.loads(Path(archivo).read_text())
    if len(es) != len(lote):
        sys.exit(f'El archivo tiene {len(es)} traducciones y el lote {len(lote)} frases')
    omitidas = set(omitidas)
    # control de alineación: una frase corta (título) no puede quedar emparejada con un párrafo, ni al revés
    # --omitidas=12,40: posiciones donde se omitió a propósito una mención a opcionales (traducción más corta)
    sospechosas = [i for i, (a, b) in enumerate(zip(lote, es)) if i not in omitidas and
                   (len(b) > 3 * len(a) + 40 or len(a) > 3 * len(b) + 40)]
    if sospechosas:
        sys.exit(f'Posible desalineación en las posiciones {sospechosas[:10]}: revisa el orden del archivo')
    glos = glosario(marca)
    for i, (a, b) in enumerate(zip(lote, es)):
        # "" en una posición declarada en --omitidas = la frase entera no se publica (p. ej. un párrafo sobre opcionales)
        if not b.strip() and i not in omitidas:
            sys.exit(f'Traducción vacía para: {a[:80]}')
        glos[a] = b.strip()
    guardar_glosario(marca, glos)
    print(f'{len(es)} frases agregadas al glosario de {marca} ({len(glos)} en total)')


def cmd_armar(marca):
    glos = glosario(marca)
    listos, incompletos, vacios = 0, [], []
    for carpeta, ex in modelos(marca):
        j = json.loads(ex.read_text())
        manual = carpeta / '01_CONTENIDO' / 'pagina-es.json'
        if manual.exists() and json.loads(manual.read_text()).get('manual'):
            listos += 1  # ficha traducida a mano (p. ej. Switch): no se sobrescribe
            continue
        faltan = set()
        P = limpiar(traducir(plantilla(j), glos, faltan))  # limpiar: quita las frases omitidas ("")
        if faltan:
            incompletos.append(f'{carpeta.name} ({len(faltan)})')
            continue
        destino = carpeta / '01_CONTENIDO' / 'pagina-es.json'
        if not any(P.get(k) for k in ('intro', 'bloques', 'destacados', 'equipamiento')):
            # todo lo publicable se omitió (p. ej. solo había la descripción de un video): sin ficha traducida
            if destino.exists():
                destino.unlink()
            vacios.append(carpeta.name)
            continue
        previo = json.loads(destino.read_text()) if destino.exists() else {}
        salida = {'estado': previo.get('estado', 'BORRADOR'),
                  'criterio': 'Traducción fiel al español neutro (tuteo) de la página oficial, con el glosario '
                              f'traducciones/{marca}.json. No agrega afirmaciones. Se omiten los opcionales, ediciones, '
                              'configuraciones, precios y llamados a distribuidores (decisiones Oceanic 2026-11-04), y las '
                              'frases cortadas por la captura. Nombres de productos, telas, motores y marcas sin traducir.',
                  'fuente': j.get('source_url'), 'capturada': j.get('accessed_at'),
                  'extract': str(ex.relative_to(carpeta))}
        salida.update(P)
        destino.write_text(json.dumps(salida, ensure_ascii=False, indent=1) + '\n')
        listos += 1
    print(f'{listos} fichas armadas; incompletas: {", ".join(incompletos) or "ninguna"}'
          + (f'; sin contenido publicable: {", ".join(vacios)}' if vacios else ''))


def cmd_sembrar(marca, modelo):
    """Alinea un pagina-es.json hecho a mano con la plantilla en inglés y carga los pares al glosario."""
    carpeta = BIBLIOTECA / marca / modelo
    ex = next((carpeta / '07_FUENTES' / 'extract').glob('S1-*.json'))
    en = plantilla(json.loads(ex.read_text()))
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
    elif a[:1] == ['agregar']:
        cmd_agregar(a[1], a[2], {int(x) for x in opts.get('omitidas', '').split(',') if x})
    elif a[:1] == ['armar']:
        cmd_armar(a[1])
    elif a[:1] == ['sembrar']:
        cmd_sembrar(a[1], a[2])
    else:
        print(__doc__)
