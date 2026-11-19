#!/usr/bin/env python3
"""Revisión de marcas: compara las webs oficiales con el catálogo y entrega un informe (no cambia nada).

    python tools/revisar_marcas.py [--salida revision/informe.json] [--marcas axopar,lagoon]

Qué hace, por cada marca:
  1. Toma como «conocidas» las fichas oficiales ya registradas (biblioteca/<marca>/<modelo>/07_FUENTES/sources.json,
     fuente de tipo official_product_page).
  2. Lee las páginas de gama de la marca (las registradas como official_range_page más las de EXTRA) y junta los
     enlaces que apuntan a una ficha de modelo (misma carpeta que las fichas conocidas).
  3. NUEVOS: enlaces a fichas que el catálogo no tiene.
  4. RETIRADOS: fichas conocidas que ya no aparecen en las gamas Y cuya página responde 404/410.
     MOVIDOS: ficha conocida que ahora vive en otra dirección (se marca si el destino parece una gama anterior).
     Si no aparece en la gama pero la página sigue viva en su dirección, no se informa.
  5. Si una web no se pudo leer (bloqueo, caída), la marca queda «bloqueada» o «parcial»: no se saca ninguna
     conclusión de ella.

Solo lee páginas públicas. Si la web bloquea la lectura directa y hay FIRECRAWL_API_KEY, reintenta con Firecrawl;
si también falla, lo informa y no insiste (no se eluden captchas).
"""
from __future__ import annotations

import argparse
import html as _html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
UA = "Mozilla/5.0 (compatible; OceanicRevision/1.0; +https://oceanic.cl)"

# Páginas de gama adicionales a las registradas en cada ficha, y palabras que no son fichas de modelo.
EXTRA = {
    "aquila": {"indices": ["https://www.aquilaboats.com/models"]},
    "axopar": {"indices": ["https://www.axopar.com/boat-models/"]},
    "beneteau": {"indices": ["https://www.beneteau.com/motorboats", "https://www.beneteau.com/sailboats",
                             "https://www.beneteau.com/motor-yachts"]},
    "excess": {"indices": ["https://www.excess-catamarans.com/our-catamarans"]},
    "lagoon": {"indices": ["https://www.catamarans-lagoon.com/ranges/sailing-catamarans",
                           "https://www.catamarans-lagoon.com/ranges/power-catamarans"]},
    "oceanic-power": {"indices": ["https://oceanic.cl/oceanic-power-boats/"]},
    "saffier": {"indices": ["https://saffieryachts.com/classic-range/", "https://saffieryachts.com/elegance-range/",
                            "https://saffieryachts.com/luxury-range/"]},
    "solaris": {"indices": ["https://www.solarisyachts.com/en/yachts/"]},
    "xo": {"indices": ["https://xoboats.com/fleet/dfndr/",
                       "https://xoboats.com/fleet/dscvr/", "https://xoboats.com/fleet/explr/"]},
    # Un solo modelo en una página única: no hay lista que comparar.
    "switch": {"unica": True},
    "vx-one": {"unica": True},
}
# Direcciones que delatan una gama anterior o histórica: el modelo sigue en la web, pero ya no es de la gama vigente.
ANTERIOR = re.compile(r"(former|heritage|legacy|archive|anterior|\b20\d\d[-_]20\d\d\b)", re.I)
IGNORAR = {"configurator", "configurador", "gallery", "galeria", "brochure", "compare", "comparar", "contact",
           "contacto", "dealers", "news", "blog", "events", "specs", "compare-models", "download", "downloads"}


# ---------- direcciones ----------

def norm(url: str) -> str:
    """host sin www + ruta sin barra final, sin consulta ni ancla, en minúsculas."""
    p = urlsplit(url.strip())
    host = p.netloc.lower().removeprefix("www.")
    path = re.sub(r"/{2,}", "/", p.path).rstrip("/").lower()
    return f"{host}{path}"


def padre(n: str) -> str:
    return n.rsplit("/", 1)[0] if "/" in n else n


def ultimo(n: str) -> str:
    return n.rsplit("/", 1)[-1]


# ---------- lectura de páginas ----------

class Respuesta:
    def __init__(self, estado, url, texto="", error=""):
        self.estado, self.url, self.texto, self.error = estado, url, texto, error

    @property
    def ok(self):
        return self.estado == 200 and bool(self.texto)


def _directo(url: str, espera=25) -> Respuesta:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en,es;q=0.8"})
    try:
        with urllib.request.urlopen(req, timeout=espera) as r:
            return Respuesta(r.status, r.geturl(), r.read().decode("utf-8", "ignore"))
    except urllib.error.HTTPError as e:
        return Respuesta(e.code, url, error=f"HTTP {e.code}")
    except Exception as e:  # red, DNS, tiempo
        return Respuesta(0, url, error=str(e)[:120])


def _firecrawl(url: str, clave: str) -> Respuesta:
    cuerpo = json.dumps({"url": url, "formats": ["rawHtml"], "timeout": 45000}).encode()
    req = urllib.request.Request("https://api.firecrawl.dev/v1/scrape", data=cuerpo, method="POST",
                                 headers={"Authorization": f"Bearer {clave}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=70) as r:
            d = json.load(r)
        meta = (d.get("data") or {}).get("metadata") or {}
        return Respuesta(int(meta.get("statusCode") or 200), meta.get("sourceURL") or url, (d.get("data") or {}).get("rawHtml") or "")
    except Exception as e:
        return Respuesta(0, url, error=f"firecrawl: {str(e)[:100]}")


def traer(url: str) -> Respuesta:
    r = _directo(url)
    if r.estado == 0:  # corte de conexión: un segundo intento antes de darla por caída
        time.sleep(2)
        r = _directo(url)
    clave = os.environ.get("FIRECRAWL_API_KEY", "")
    if not r.ok and r.estado in (0, 401, 403, 429, 503) and clave:
        r2 = _firecrawl(url, clave)
        if r2.ok:
            return r2
    return r


# ---------- extracción de enlaces ----------

HREF = re.compile(r"""href\s*=\s*["']([^"'#][^"']*)["']""", re.I)
ABS = re.compile(r"""https?://[^\s"'<>\\)]+""")
REL_JSON = re.compile(r'''"(/[a-z0-9][^"\s<>\\]{3,})"''', re.I)


def enlaces(texto: str, base: str) -> set[str]:
    t = _html.unescape(texto).replace("\\/", "/")
    salida = set()
    for m in HREF.finditer(t):
        salida.add(urljoin(base, m.group(1)))
    for m in ABS.finditer(t):
        salida.add(m.group(0).rstrip(".,;"))
    for m in REL_JSON.finditer(t):  # rutas dentro de datos embebidos (Next.js, Nuxt)
        salida.add(urljoin(base, m.group(1)))
    return salida


def titulo(texto: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", texto, re.I | re.S)
    return re.sub(r"\s+", " ", _html.unescape(m.group(1))).strip()[:140] if m else ""


# ---------- conocidos ----------

def conocidos(raiz: Path = ROOT) -> dict[str, list[dict]]:
    """{marca: [{slug, url, indices[]}]} desde biblioteca/*/*/07_FUENTES/sources.json."""
    por_marca: dict[str, list[dict]] = {}
    for f in sorted((raiz / "biblioteca").glob("*/*/07_FUENTES/sources.json")):
        marca, slug = f.parts[-4], f.parts[-3]
        try:
            fuentes = json.loads(f.read_text(encoding="utf8")).get("sources", [])
        except ValueError:
            continue
        s1 = next((s["url"] for s in fuentes if s.get("type") == "official_product_page"), None)
        if not s1:
            continue
        gamas = [s["url"] for s in fuentes if s.get("type") == "official_range_page"]
        por_marca.setdefault(marca, []).append({"slug": slug, "url": s1, "indices": gamas})
    return por_marca


def catalogo_slugs(raiz: Path = ROOT) -> dict[str, set[str]]:
    t = (raiz / "sitio/assets/js/catalogo-data.js").read_text(encoding="utf8")
    d = json.loads(t[t.index("window.OCEANIC_CATALOGO=") + len("window.OCEANIC_CATALOGO="):t.rindex(";")])
    return {m: {x["slug"] for x in v["modelos"]} for m, v in d.items()}


# ---------- revisión ----------

def revisar_marca(marca: str, modelos: list[dict], leer=traer, pausa=0.4, indices_extra: dict | None = None) -> dict:
    indices_extra = indices_extra or {}
    cfg = EXTRA.get(marca, {})
    res = {"marca": marca, "conocidos": len(modelos), "indices": [], "nuevos": [], "movidos": [], "retirados": [], "sin_verificar": []}
    cfg = {**cfg, "indices": list(cfg.get("indices", [])) + list(indices_extra.get(marca, []))} if indices_extra.get(marca) else cfg
    if cfg.get("unica"):
        res["estado"] = "unica"
        res["nota"] = "Un solo modelo en una página única: no hay lista de modelos que comparar."
        return res

    conocidas = {norm(m["url"]): m for m in modelos}
    carpetas = {padre(n) for n in conocidas}
    hosts = {n.split("/", 1)[0] for n in conocidas}
    if not conocidas:  # marca nueva, sin modelos cargados: las fichas cuelgan de la misma carpeta que su página de gama
        for u in indices_extra.get(marca, []):
            n = norm(u)
            hosts.add(n.split("/", 1)[0])
            carpetas.add(n)
            carpetas.add(padre(n))
    indices = list(dict.fromkeys(cfg.get("indices", []) + [u for m in modelos for u in m["indices"]]))

    vistos: dict[str, str] = {}  # dirección normalizada → dirección tal como aparece en la gama
    caidos = 0
    for u in indices:
        r = leer(u)
        time.sleep(pausa)
        res["indices"].append({"url": u, "ok": r.ok, "estado": r.estado, **({"error": r.error} if r.error else {})})
        if not r.ok:
            caidos += 1
            continue
        for e in enlaces(r.texto, r.url or u):
            n = norm(e)
            if n.split("/", 1)[0] in hosts and padre(n) in carpetas and ultimo(n) not in IGNORAR and "." not in ultimo(n):
                vistos.setdefault(n, e)
    if not indices or caidos == len(indices):
        res["estado"] = "bloqueada"
        res["nota"] = "No se pudo leer ninguna página de gama: no se saca ninguna conclusión."
        return res
    res["estado"] = "parcial" if caidos else "ok"
    if caidos:
        res["nota"] = f"{caidos} de {len(indices)} páginas de gama no se pudieron leer: la lista puede estar incompleta."

    # retirados / movidos: conocidos que no están en la gama; se mira su propia página
    movidos_a: set[str] = set()
    for n, m in conocidas.items():
        if n in vistos:
            continue
        r = leer(m["url"])
        time.sleep(pausa)
        item = {"slug": m["slug"], "url": m["url"]}
        if r.estado in (404, 410):
            res["retirados"].append({**item, "motivo": f"La página oficial responde {r.estado}"})
        elif r.ok and norm(r.url) != n and norm(r.url).split("/", 1)[0] == n.split("/", 1)[0]:
            destino = norm(r.url)
            movidos_a.add(destino)
            res["movidos"].append({**item, "destino": r.url, "motivo": "La página oficial ahora está en otra dirección",
                                   "posible_anterior": bool(ANTERIOR.search(destino)) and not ANTERIOR.search(n)})
        elif not r.ok:
            res["sin_verificar"].append({**item, "motivo": r.error or f"HTTP {r.estado}"})
        # si la página sigue viva en la misma dirección, el modelo existe: no se informa

    # nuevos: aparecen en la gama, el catálogo no los tiene y no son un modelo conocido que solo cambió de dirección
    ultimos_movidos = {ultimo(norm(x["url"])) for x in res["movidos"]}
    for n in sorted(vistos.keys() - conocidas.keys() - movidos_a):
        if ultimo(n) in ultimos_movidos:
            continue
        url = vistos[n]
        r = leer(url)
        time.sleep(pausa)
        if not r.ok or norm(r.url) != n:  # no existe, o redirige a otra página (un enlace de navegación, no una ficha)
            continue
        res["nuevos"].append({"url": r.url or url, "titulo": titulo(r.texto), "carpeta": padre(n).split("/", 1)[-1],
                              "posible_anterior": bool(ANTERIOR.search(n))})
    return res


def revisar(raiz: Path = ROOT, marcas: list[str] | None = None, leer=traer, pausa=0.4, extra: dict | None = None) -> dict:
    """extra: {marca: [páginas de gama]} de marcas nuevas sumadas desde el administrador (aún sin modelos cargados)."""
    extra = extra or {}
    todo = dict(conocidos(raiz))
    for m in extra:
        todo.setdefault(m, [])
    cat = catalogo_slugs(raiz)
    informe = {"generado": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "marcas": []}
    for marca, modelos in todo.items():
        if marcas and marca not in marcas:
            continue
        r = revisar_marca(marca, modelos, leer, pausa, extra)
        en_cat = cat.get(marca, set())
        for x in r["retirados"] + r["movidos"]:
            x["en_catalogo"] = x["slug"] in en_cat  # solo se puede ocultar lo que está en el sitio
        informe["marcas"].append(r)
    informe["resumen"] = {
        "nuevos": sum(len(m["nuevos"]) for m in informe["marcas"]),
        "movidos": sum(len(m["movidos"]) for m in informe["marcas"]),
        "retirados": sum(len(m["retirados"]) for m in informe["marcas"]),
        "marcas_ok": sum(1 for m in informe["marcas"] if m["estado"] in ("ok", "unica")),
        "marcas_con_problemas": [m["marca"] for m in informe["marcas"] if m["estado"] in ("bloqueada", "parcial")],
    }
    return informe


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--salida", default=str(ROOT / "revision" / "informe.json"))
    ap.add_argument("--marcas", default="", help="lista separada por comas; vacío = todas")
    ap.add_argument("--extra", default="", help='JSON {"marca": ["https://…"]}: marcas nuevas con su página de gama')
    a = ap.parse_args(argv)
    extra = {}
    if a.extra.strip():
        for k, v in json.loads(a.extra).items():
            if re.fullmatch(r"[a-z0-9-]{1,40}", k) and isinstance(v, list):
                extra[k] = [u for u in v if isinstance(u, str) and u.startswith("https://")][:5]
    inf = revisar(marcas=[m for m in a.marcas.split(",") if m] or None, extra=extra)
    out = Path(a.salida)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(inf, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    for m in inf["marcas"]:
        print(f"{m['marca']:14} {m['estado']:9} conocidos {m['conocidos']:3}  nuevos {len(m['nuevos'])}  movidos {len(m['movidos'])}  retirados {len(m['retirados'])}"
              + (f"  sin verificar {len(m['sin_verificar'])}" if m["sin_verificar"] else ""))
    print("resumen:", json.dumps(inf["resumen"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
