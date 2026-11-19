"""Publica en el sitio los videos y premios oficiales de cada modelo.

Lee de la biblioteca:
  - 05_MULTIMEDIA/VIDEOS/videos.json  → todos los videos incrustados en la página oficial del modelo que corresponden
    a ese barco (decisión Oceanic 2026-11-05): los del modelo, los de su variante hermana del mismo casco, los de su
    gama y la animación técnica del casco que la marca pone en cada modelo, más las pruebas y opiniones de terceros
    que la página oficial incrusta (con su etiqueta). Queda fuera solo lo genérico de la marca (newsletter).
    No se descarga nada: el sitio los llama desde donde están alojados (YouTube, Vimeo o el CDN del fabricante) y solo
    cuando el visitante aprieta reproducir.
  - 07_FUENTES/extract/*.json › awards → premios que la página oficial del modelo publica, más tools/premios-extra.json
    (premios citados en el texto o publicados solo como imagen, verificados contra el extract).
y escribe sitio/assets/data/medios/<marca>/<modelo>.json + index.json, que lee sitio/assets/js/ficha-tpl.js.

Los títulos de los videos vienen en inglés (o son nombres de archivo): el sitio no publica inglés, así que cada video
lleva una etiqueta en español según lo que es (recorrido, en navegación o video oficial). Los nombres de los premios
son nombres propios y se mantienen; lo descriptivo (finalista, ganador, categoría) se traduce.

Uso, desde la raíz del repo:  python3 tools/sitio_medios.py
"""
import json
import re
from pathlib import Path
from urllib.parse import urlparse, parse_qs

RAIZ = Path(__file__).resolve().parent.parent
BIBLIOTECA = RAIZ / 'biblioteca'
SALIDA = RAIZ / 'sitio' / 'assets' / 'data' / 'medios'

# ---------------------------------------------------------------- videos


def video_de(url):
    """(tipo, id_o_src) de un video alojado, o None si no se puede incrustar."""
    u = urlparse(url)
    host = u.netloc.lower()
    if 'youtu' in host:
        vid = parse_qs(u.query).get('v', [''])[0]
        if not vid:
            m = re.search(r'/(?:embed|shorts|live|v)/([\w-]{11})', u.path) or re.search(r'^/([\w-]{11})$', u.path)
            vid = m.group(1) if m else ''
        return ('youtube', vid) if re.fullmatch(r'[\w-]{11}', vid) else None
    if 'vimeo' in host:
        m = re.search(r'/(\d{6,})', u.path)
        return ('vimeo', m.group(1)) if m else None
    if u.scheme == 'https' and u.path.lower().endswith('.mp4'):
        return ('mp4', url)
    return None


def etiqueta(v):
    t = ' '.join(str(v.get(k) or '') for k in ('title', 'notes', 'file_name')).lower()
    if re.search(r'walk ?th?r(ough|ought)|recorrido|tour', t):
        return 'Recorrido del barco', 0
    if re.search(r'loop|cabecera|header|in action|navigation|sailing mode', t):
        return 'En navegación', 2
    return 'Video oficial', 1


def hermanas(a, b):
    """Variantes del mismo casco: mismo nombre hasta la eslora (swift-trawler-37-fly / -sedan)."""
    pa, pb = a.split('-'), b.split('-')
    for i, (x, y) in enumerate(zip(pa, pb)):
        if x != y:
            return any(re.fullmatch(r'\d+', t) for t in pa[:i])
    return True


def videos(carpeta):
    f = carpeta / '05_MULTIMEDIA' / 'VIDEOS' / 'videos.json'
    if not f.exists():
        return []
    d = json.loads(f.read_text())
    lista = d.get('videos', []) if isinstance(d, dict) else d
    vistos, out = set(), []
    for v in lista:
        t = (v.get('title') or '').lower()
        if 'community_newsletter' in t:  # pieza genérica de la marca, no del barco
            continue
        x = video_de(v.get('url') or '')
        if not x or x in vistos:
            continue
        et, orden = etiqueta(v)
        alcance = v.get('scope')
        if alcance == 'NOT_MODEL_SPECIFIC':
            et, orden = 'Tecnología del casco', 4
        elif alcance == 'REQUIRES_REVIEW':
            otra = re.search(r'También en: ([\w-]+)', v.get('notes') or '')
            if not otra:
                continue
            if not hermanas(carpeta.name, otra.group(1)):
                et, orden = 'Video de la gama', 3
        elif alcance != 'THIS_MODEL':
            continue
        if v.get('third_party'):
            et = 'Opinión de propietarios' if re.search(r'owner|propietari', t) else 'Prueba independiente'
            orden = 5
        vistos.add(x)
        item = {'tipo': x[0], 'etiqueta': et, 'fuente': v.get('source_page') or ''}
        item['id' if x[0] != 'mp4' else 'src'] = x[1]
        out.append((orden, len(out), item))
    out.sort(key=lambda o: (o[0], o[1]))
    return [o[2] for o in out]

# ---------------------------------------------------------------- premios


DETALLE = [  # (patrón, traducción) de la parte descriptiva; los nombres de los premios no se traducen
    (r'^nominated$|^nomin[ée]e?$', 'Nominado'),
    (r'^finalist$', 'Finalista'),
    (r'^winner$', 'Ganador'),
    (r'^highly commended$', 'Mención especial'),
    (r'^top 10$', 'Top 10'),
    (r"^voilier de l'ann[ée]e", 'Velero del año'),
    (r"^multicoque de l'ann[ée]e$", 'Multicasco del año'),
    (r'^multicoque$', 'Multicasco'),
    (r'^meilleur voilier multicoque$', 'Mejor velero multicasco'),
    (r"^prix annuel du pionnier de l'environnement$", 'Premio anual al pionero ambiental'),
    (r"^meilleur catamaran [àa] voile de l'ann[ée]e$", 'Mejor catamarán a vela del año'),
    (r'^winner of the multihull of the year award$', 'Ganador, Multicasco del año'),
    (r'^best sailing catamaran over 50 feet$', 'Mejor catamarán a vela de más de 50 pies'),
    (r'^best multihull sailing yacht$', 'Mejor velero multicasco'),
    (r'^best power catamaran of the year$', 'Mejor catamarán a motor del año'),
    (r'^best interior design-power catamaran of the year$', 'Mejor diseño interior, catamarán a motor del año'),
    (r'^best exterior design-power catamaran of the year$', 'Mejor diseño exterior, catamarán a motor del año'),
    (r'^best sailing multihull above 15m$', 'Mejor multicasco a vela de más de 15 m'),
    (r'^boat of the year in the multihull category$', 'Barco del año, categoría multicasco'),
    (r'^le monde de la croisi[èe]re$', 'Le Monde de la Croisière'),
    (r'^cruising world$', 'Cruising World'),
    (r'^voile magazine$', 'Voile Magazine'),
]
CATEGORIA = [  # categorías de los Yacht Style Awards (vienen pegadas al nombre)
    (r'power catamaran under 15m', 'Catamarán a motor de menos de 15 m'),
    (r'power catamaran 12-16m', 'Catamarán a motor de 12 a 16 m'),
    (r'sailing yacht under 20m', 'Velero de menos de 20 m'),
    (r'motoryacht 12-14m', 'Yate a motor de 12 a 14 m'),
]


def traducir_detalle(t):
    for pat, es in DETALLE:
        if re.search(pat, t.strip(), re.I):
            return es
    return None


def premio(a, modelo_nombre=''):
    """{'nombre', 'detalle'} en español, o None si no se puede presentar sin inventar."""
    a = re.sub(r'\s+', ' ', a).strip()
    # Aquila publica algunos premios solo como imagen: el nombre del archivo trae el premio
    if re.search(r'\.(png|webp|jpe?g)', a, re.I):
        a = re.sub(r'\.(png|webp|jpe?g).*$', '', a, flags=re.I)
        a = re.sub(r'^\d+x\d+-', '', a)
        m = re.match(r'yachtstyleawardlogo_(\d{4})', a, re.I)
        if m:
            return {'nombre': f'Yacht Style Awards {m.group(1)}', 'detalle': ''}
        a = re.sub(r'-AQUILA.*$', '', a, flags=re.I)
    # Yacht Style Awards Winner <año> <categoría>[-MARCA modelo]
    m = re.match(r'(Yacht Style Awards) Winner (\d{4}) (.+?)(?:-BENETEAU.*)?$', a, re.I)
    if m:
        cat = next((es for pat, es in CATEGORIA if re.search(pat, m.group(3), re.I)), None)
        if not cat:
            return None
        return {'nombre': f'{m.group(1)} {m.group(2)}', 'detalle': f'Ganador · {cat}'}
    # «FIRST 30 - voilier de l'année 2026 - Voile Magazine»: se quita el nombre del modelo al inicio
    partes = [p.strip() for p in re.split(r'\s+-\s+', a) if p.strip()]
    if len(partes) > 1 and modelo_nombre and re.sub(r'\W', '', partes[0]).lower() in re.sub(r'\W', '', modelo_nombre).lower():
        partes = partes[1:]
    if len(partes) == 3 and re.search(r"voilier de l'ann", partes[0], re.I):  # Voile Magazine
        anio = re.search(r'\d{4}', partes[0])
        return {'nombre': partes[2] + (f' {anio.group(0)}' if anio else ''), 'detalle': 'Velero del año'}
    nombre, resto = partes[0], partes[1:]
    # «Barca dell'Anno - Vela e Motore 2019 - Boat of the Year in the Multihull category»
    if len(resto) == 2 and re.match(r'(.+?)\s+(\d{4})$', resto[0]):
        medio, anio = re.match(r'(.+?)\s+(\d{4})$', resto[0]).groups()
        es = traducir_detalle(resto[1])
        if es:
            return {'nombre': f'{nombre} {anio}', 'detalle': f'{medio} · {es}'}
    # «Design innovation award - Winner 2025»
    if len(resto) == 1 and re.fullmatch(r'(winner|nominated|finalist)\s+\d{4}', resto[0], re.I):
        res, anio = resto[0].split()
        return {'nombre': f'{nombre} {anio}', 'detalle': traducir_detalle(res)}
    # «Nominé - 2024 - Voile Magazine» / «First 36 - Voilier de l'année 2023»
    if re.fullmatch(r'nomin[ée]e?', nombre, re.I) and len(resto) == 2:
        return {'nombre': f'{resto[1]} {resto[0]}', 'detalle': 'Nominado'}
    if re.match(r"voilier de l'ann", nombre, re.I):
        anio = re.search(r'\d{4}', nombre)
        return {'nombre': 'Voile Magazine' + (f' {anio.group(0)}' if anio else ''), 'detalle': 'Velero del año'}
    # resultado pegado al nombre: «European Yacht of the year Nominated 2026», «Bob Award Finalist 2022»
    m = re.match(r'(.+?)\s+(Winner|Nominated|Finalist)\s+(\d{4})$', nombre, re.I)
    if m and not resto:
        return {'nombre': f'{m.group(1)} {m.group(3)}', 'detalle': traducir_detalle(m.group(2))}
    m = re.match(r'(.+?)\s+(Winner|Nominated|Finalist)$', nombre, re.I)
    if m and not resto:
        return {'nombre': m.group(1), 'detalle': traducir_detalle(m.group(2))}
    m = re.match(r'(.+?)\s+winners?(?:\s+(\d{4}))?$', nombre, re.I)
    if m:
        nombre = m.group(1) + (f' {m.group(2)}' if m.group(2) else '')
    if re.search(r'\bfirst ?36\b', nombre, re.I):  # «Cruising World's 2023 Boat of the Year Awards first 36»
        nombre = re.sub(r'\s*first ?36\s*', ' ', nombre, flags=re.I).strip()
    detalle = []
    for r in resto:
        if modelo_nombre and re.sub(r'\W', '', r).lower() in re.sub(r'\W', '', modelo_nombre).lower():
            continue
        if re.fullmatch(r'first ?36', r, re.I):
            continue
        es = traducir_detalle(r)
        if es is None:
            if re.search(r'\d{4}', r) and len(resto) == 1 and not re.search(r'[a-z]{4}', r, re.I):
                nombre += ' ' + r
                continue
            # medio que entrega el premio: es un nombre propio
            if re.fullmatch(r'[A-Z][\w\' ]+', r) and not re.search(r'\b(the|of|best|winner)\b', r, re.I):
                detalle.append(r)
                continue
            return None
        detalle.append(es)
    return {'nombre': nombre, 'detalle': ' · '.join(detalle)}


def pulir(p):
    n = p['nombre']
    if n.isupper():
        n = n.title()
    n = re.sub(r'\bOf The\b', 'of the', n)
    n = re.sub(r'\bof the year\b', 'of the Year', n, flags=re.I)
    n = re.sub(r'\b(design innovation|motorboat|motor boat|british yachting) (award|awards)\b',
               lambda m: m.group(0).title(), n, flags=re.I)
    p['nombre'] = n[0].upper() + n[1:]
    return p


EXTRA = json.loads((RAIZ / 'tools' / 'premios-extra.json').read_text())
_LP = RAIZ / 'tools' / 'premios-logos.json'
LOGOS_PREMIOS = json.loads(_LP.read_text()) if _LP.exists() else {}
CERTAMEN = {k: v for k, v in json.loads((RAIZ / 'tools' / 'premios-logos-certamen.json').read_text()).items() if not k.startswith('_')}


def premios(carpeta, modelo_nombre):
    out, vistos = [], set()
    textos_ex = ''
    for ex in sorted((carpeta / '07_FUENTES' / 'extract').glob('*.json')):
        textos_ex += ex.read_text()
    extra = []
    for e in EXTRA.get(f'{carpeta.parent.name}/{carpeta.name}', []):
        prueba = e.get('cita') or e.get('imagen') or ''
        if not prueba or prueba not in textos_ex.replace('\\/', '/'):
            print(f'  aviso: premio extra sin respaldo en la página oficial, no se publica: {carpeta.name}: {e["nombre"]}')
            continue
        extra.append(e)
    reemplazados = {e['reemplaza'].lower() for e in extra if e.get('reemplaza')}
    # logos oficiales (tools/sitio_premios_logos.py): esos premios van primero, con su logo
    L = LOGOS_PREMIOS.get(f'{carpeta.parent.name}/{carpeta.name}')
    crudos_fuera = set()
    if L:
        for e in L['premios']:
            item = {'nombre': e['nombre'], 'detalle': e.get('detalle', '')}
            if e.get('logo'):
                item['logo'] = e['logo']
            clave = (item['nombre'].lower(), item['detalle'])
            if clave not in vistos:
                vistos.add(clave)
                out.append(item)
        crudos_fuera = {re.sub(r'\s+', ' ', r).strip().lower() for r in L.get('reemplaza', [])}
    for ex in ([] if L and L.get('reemplaza_todo') else sorted((carpeta / '07_FUENTES' / 'extract').glob('*.json'))):
        try:
            j = json.loads(ex.read_text())
        except ValueError:
            continue
        for a in j.get('awards') or []:
            if not isinstance(a, str):
                continue
            if re.sub(r'\s+', ' ', a).strip().lower() in crudos_fuera:
                continue
            p = premio(a, modelo_nombre)
            if not p:
                print(f'  aviso: premio sin traducción, no se publica: {carpeta.parent.name}/{carpeta.name}: {a!r}')
                continue
            p = pulir(p)
            if p['nombre'].lower() in reemplazados:
                continue
            clave = (p['nombre'].lower(), p['detalle'])
            if clave not in vistos:
                vistos.add(clave)
                out.append(p)
    for e in extra:
        out.append({'nombre': e['nombre'], 'detalle': e.get('detalle', '')})
    # premio sin logo en la página del fabricante: logo oficial del certamen (tools/premios-logos-certamen.json)
    for p in out:
        c = CERTAMEN.get(p['nombre'])
        if not p.get('logo') and c:
            p['logo'] = c['logo']
    return out


def nombre_modelo(carpeta):
    m = carpeta / '00_MODELO' / 'model.json'
    if m.exists():
        d = json.loads(m.read_text())
        return d.get('model') or d.get('name') or d.get('model_name') or carpeta.name
    return carpeta.name.replace('-', ' ')


def main():
    publicados = []
    SALIDA.mkdir(parents=True, exist_ok=True)
    for carpeta in sorted(p for p in BIBLIOTECA.glob('*/*') if p.is_dir()):
        marca, modelo = carpeta.parent.name, carpeta.name
        d = {'videos': videos(carpeta), 'premios': premios(carpeta, nombre_modelo(carpeta))}
        destino = SALIDA / marca / f'{modelo}.json'
        if d['videos'] or d['premios']:
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n')
            publicados.append(f'{marca}/{modelo}')
        elif destino.exists():
            destino.unlink()
    (SALIDA / 'index.json').write_text(json.dumps(publicados, ensure_ascii=False, indent=0) + '\n')
    nv = sum(len(json.loads((SALIDA / f'{p}.json').read_text())['videos']) for p in publicados)
    npr = sum(len(json.loads((SALIDA / f'{p}.json').read_text())['premios']) for p in publicados)
    print(f'{len(publicados)} modelos con medios · {nv} videos · {npr} premios')


if __name__ == '__main__':
    main()
