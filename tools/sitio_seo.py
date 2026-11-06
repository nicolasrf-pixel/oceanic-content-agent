"""Metadatos de todas las páginas del sitio, sitemap.xml y robots.txt.

- En cada página pública deja un bloque <!--SEO--> … <!--/SEO--> en el <head> con: descripción, vista previa al compartir
  (Open Graph y Twitter: título, descripción, imagen 1200×630 assets/img/compartir.jpg, URL), enlace canónico, favicon
  y color del navegador. Las fichas de barcos y los usados se completan en el Worker con el nombre y la foto de cada uno
  (worker/compartir.js), porque esas páginas se arman con datos.
- sitemap.xml con las páginas, las marcas (y sus líneas vela/motor), todas las fichas publicadas y los usados.
- robots.txt: mientras el sitio es vista previa, nadie indexa (Disallow). Al lanzar, scripts/build.sh con LANZADO=1 lo abre.

El dominio de las URL absolutas es SITIO (vista previa). Al pasar a oceanic.cl, scripts/build.sh lo reemplaza con la
variable SITIO_URL del build (ver sitio/CÓMO-SUBIR-EL-SITIO.md).

Uso, desde la raíz del repo:  python3 tools/sitio_seo.py
"""
import json
import re
from html import escape
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / 'sitio'
SITIO = 'https://oceanic.narf.workers.dev'
IMAGEN = '/assets/img/compartir.jpg?v=2'
NOMBRE = 'Oceanic'

# Descripción para las páginas que no tienen una propia (las que sí tienen, se respetan).
DESCRIPCIONES = {
    'index.html': 'Representamos y vendemos marcas náuticas de referencia mundial en Chile desde 1994: Beneteau, Lagoon, Axopar, '
                  'Aquila, Solaris, Saffier, XO, Excess y más. Asesoría experta, usados revisados y charter.',
    'marca/index.html': 'Marcas náuticas representadas oficialmente por Oceanic en Chile: gama completa, fichas técnicas y cotización.',
    '404.html': 'La página que buscas no existe o cambió de lugar.',
    'gracias/index.html': 'Recibimos tu cotización. Un especialista de Oceanic te escribirá pronto.',
    'terminos/index.html': 'Términos y condiciones de uso del sitio de Oceanic.',
    'arriendo-boyas/index.html': 'Arriendo de boyas robóticas MarkSetBot para regatas en Chile: marcas autopropulsadas con GPS que se mantienen en posición sin anclas.',
}
SIN_INDICE = {'404.html', 'gracias/index.html'}
EXCLUIR = ('admin/', 'marcas/', 'node_modules/', '.wrangler/')


def paginas():
    for p in sorted(WEB.rglob('*.html')):
        rel = p.relative_to(WEB).as_posix()
        if rel.startswith(EXCLUIR):
            continue
        yield rel, p


def url_de(rel):
    if rel == 'index.html':
        return SITIO + '/'
    if rel == '404.html':
        return SITIO + '/404.html'
    return SITIO + '/' + rel[:-len('index.html')]


def bloque(rel, html):
    titulo = re.search(r'<title>(.*?)</title>', html, re.S)
    titulo = re.sub(r'\s+', ' ', titulo.group(1)).strip() if titulo else NOMBRE
    m = re.search(r'<meta[^>]*name="description"[^>]*>', html)
    desc = None
    if m:
        c = re.search(r'content="([^"]*)"', m.group(0))
        desc = c.group(1) if c else None
    nueva_desc = desc is None
    desc = desc or DESCRIPCIONES.get(rel, 'Oceanic · Marcas náuticas de referencia mundial en Chile desde 1994.')
    url = url_de(rel)
    l = ['<!--SEO-->']
    if nueva_desc:
        l.append(f'<meta name="description" content="{desc}"/>')
    if rel in SIN_INDICE:
        l.append('<meta name="robots" content="noindex"/>')
    else:
        l.append(f'<link rel="canonical" href="{url}"/>')
    l += [
        f'<meta property="og:site_name" content="{NOMBRE}"/>',
        '<meta property="og:locale" content="es_CL"/>',
        '<meta property="og:type" content="website"/>',
        f'<meta property="og:title" content="{escape(titulo, quote=True)}"/>',
        f'<meta property="og:description" content="{desc}"/>',
        f'<meta property="og:url" content="{url}"/>',
        f'<meta property="og:image" content="{SITIO}{IMAGEN}"/>',
        '<meta property="og:image:width" content="1200"/>',
        '<meta property="og:image:height" content="630"/>',
        '<meta property="og:image:alt" content="Oceanic, est. 1994"/>',
        '<meta name="twitter:card" content="summary_large_image"/>',
        f'<meta name="twitter:title" content="{escape(titulo, quote=True)}"/>',
        f'<meta name="twitter:description" content="{desc}"/>',
        f'<meta name="twitter:image" content="{SITIO}{IMAGEN}"/>',
        '<meta name="theme-color" content="#14212B"/>',
        '<!--/SEO-->',
    ]
    return '\n'.join(l)


def aplicar(rel, p):
    html = p.read_text()
    html = re.sub(r'\n?<!--SEO-->.*?<!--/SEO-->', '', html, flags=re.S)
    # metas sueltas antiguas de Open Graph / Twitter (las reemplaza el bloque)
    html = re.sub(r'\n?<meta[^>]*(property="og:[^"]*"|name="twitter:[^"]*")[^>]*/?>', '', html)
    # favicon con ruta absoluta (la página 404 se sirve en cualquier ruta)
    html = re.sub(r'href="(?:\.\./)*assets/img/favicon-(32|180)\.png"', r'href="/assets/img/favicon-\1.png"', html)
    if 'favicon-32' not in html:
        html = html.replace('</title>', '</title>\n<link href="/assets/img/favicon-32.png" rel="icon" type="image/png"/>\n'
                            '<link href="/assets/img/favicon-180.png" rel="apple-touch-icon"/>', 1)
    html = html.replace('</head>', bloque(rel, html) + '\n</head>', 1)
    p.write_text(html)


def js_json(archivo, variable, abre):
    t = (WEB / 'assets' / 'js' / archivo).read_text()
    i = t.index(abre, t.rindex('window.' + variable + '='))
    cierra = ']' if abre == '[' else '}'
    return json.loads(t[i:t.rindex(cierra) + 1])


def sitemap():
    urls = [(url_de(rel), '1.0' if rel == 'index.html' else '0.8') for rel, _ in paginas() if rel not in SIN_INDICE]
    cat = js_json('catalogo-data.js', 'OCEANIC_CATALOGO', '{')
    info = js_json('marcas-info.js', 'OCEANIC_MARCAS', '{')
    pub = (WEB / 'assets' / 'js' / 'publicacion.js').read_text()
    ocultos = set(re.findall(r'"([a-z0-9-]+/[a-z0-9-]+)":', pub[pub.index('"ocultos"'):pub.index('/*FIN*/')]))
    for marca, d in cat.items():
        urls.append((f'{SITIO}/marca/?m={marca}', '0.8'))
        for linea in (info.get(marca, {}).get('lineas') or {}):
            urls.append((f'{SITIO}/marca/?m={marca}&u={linea}', '0.7'))
        for mo in d['modelos']:
            if f'{marca}/{mo["slug"]}' not in ocultos:
                urls.append((f'{SITIO}/marca/?m={marca}&modelo={mo["slug"]}', '0.7'))
    for u in js_json('usados-data.js', 'OCEANIC_USADOS', '['):
        if u.get('oculto'):
            continue
        urls.append((f'{SITIO}/usados/barco/?id={u["id"]}', '0.5' if u.get('estado') == 'vendido' else '0.6'))
    x = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    x += [f'  <url><loc>{escape(u)}</loc><priority>{pr}</priority></url>' for u, pr in urls]
    x.append('</urlset>')
    (WEB / 'sitemap.xml').write_text('\n'.join(x) + '\n')
    return len(urls)


def robots():
    (WEB / 'robots.txt').write_text(
        '# VISTA PREVIA: el sitio aún no se lanza, nadie indexa. Al lanzar, el build (LANZADO=1) deja:\n'
        '#   User-agent: *\n#   Allow: /\n#   Disallow: /admin/\n#   Sitemap: <dominio>/sitemap.xml\n'
        'User-agent: *\nDisallow: /\n')


def main():
    n = 0
    for rel, p in paginas():
        aplicar(rel, p)
        n += 1
    print(f'{n} páginas con metadatos · sitemap con {sitemap()} direcciones')
    robots()


if __name__ == '__main__':
    main()
