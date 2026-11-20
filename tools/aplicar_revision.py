#!/usr/bin/env python3
"""Aplica solo lo aprobado en «Revisar marcas» (administrador › Revisar marcas › Aprobar).

Lee revision/aprobados/<fecha>-<id>.json (lo deja el administrador en la rama del pull request) y hace, sin intervención:
  • actualizar: corrige la dirección oficial registrada de un modelo en su paquete de biblioteca/<marca>/<modelo>/.
  • cargar: baja la ficha oficial del modelo nuevo, la extrae, arma el paquete de la biblioteca, traduce lo que falta al español
    (fiel, solo con lo que dice la web), redacta los textos cortos, y lo publica en el catálogo del sitio con sus fotos,
    foto de tarjeta, resolución y mapa del sitio.
Lo único que pide una clave es la traducción (ANTHROPIC_API_KEY, secreto de GitHub). Sin ella el paquete queda cargado en la
biblioteca, se avisa «falta traducir» y NO se publica en el sitio: nunca sale un modelo en inglés.
Cada paso que falla se informa; los demás siguen. El resumen sale en JSON (--salida) y en texto, con el campo «completo»
(true solo si todo lo aprobado quedó hecho): el flujo de GitHub lo usa para fusionar solo.

Uso, desde la raíz del repo:  python3 tools/aplicar_revision.py revision/aprobados/<archivo>.json [--salida=resumen.json]
"""
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import revisar_marcas as rm  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
ADAPTADOR = {"oceanic-power": "oceanicpower", "vx-one": "vxone"}  # el resto se llama igual que la marca
MODELO_IA = "claude-sonnet-5-5"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
HTTPS = re.compile(r"^https://[^\s\"'<>]{4,300}$")
ARCHIVOS_DIRECCION = ["07_FUENTES/sources.json", "07_FUENTES/source-map.md", "05_MULTIMEDIA/IMAGENES/images.json",
                      "01_CONTENIDO/pagina-es.json", "00_MODELO/model.json", "00_MODELO/00_MODELO.md",
                      "02_ESPECIFICACIONES/specifications.json", "02_ESPECIFICACIONES/specifications.md"]
# La captura original (07_FUENTES/extract/) no se toca: es la copia literal de donde se sacó cada dato.


# ---------- actualizar dirección ----------

def actualizar_direccion(raiz: Path, item: dict) -> str:
    marca, slug, vieja, nueva = (str(item.get(k, "")) for k in ("marca", "slug", "url", "destino"))
    if not (SLUG.match(marca) and SLUG.match(slug) and HTTPS.match(vieja) and HTTPS.match(nueva)):
        raise ValueError(f"datos no válidos para actualizar {marca}/{slug}")
    paquete = raiz / "biblioteca" / marca / slug
    if not paquete.is_dir():
        raise ValueError(f"no existe el paquete biblioteca/{marca}/{slug}")
    cambios = 0
    for rel in ARCHIVOS_DIRECCION:
        f = paquete / rel
        if f.is_file():
            t = f.read_text(encoding="utf8")
            if vieja in t:
                f.write_text(t.replace(vieja, nueva), encoding="utf8")
                cambios += 1
    return f"{marca}/{slug}: dirección oficial actualizada en {cambios} archivos"


# ---------- IA (solo traducir y redactar, con lo que dice la web) ----------

def llamar_ia(sistema: str, usuario: str, clave: str, max_tokens: int = 8000) -> str:
    cuerpo = json.dumps({"model": MODELO_IA, "max_tokens": max_tokens, "system": sistema,
                         "messages": [{"role": "user", "content": usuario}]}).encode()
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=cuerpo, method="POST",
                                 headers={"x-api-key": clave, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        d = json.load(r)
    return "".join(b.get("text", "") for b in d.get("content", []) if b.get("type") == "text")


def _json_de(texto: str):
    m = re.search(r"(\[.*\]|\{.*\})", texto, re.S)
    return json.loads(m.group(1)) if m else None


REGLAS = ("Traduce al español neutro con tuteo (usa «tu», «elige»). Sé fiel: no agregues ni quites afirmaciones, no inventes datos, "
          "no suavices ni exageres. Conserva nombres propios, marcas, modelos y cifras. Un barco es «embarcación» o «barco». "
          "«Outboard» = fueraborda, «inboard» = intraborda.")


def traducir_lote(frases: list, clave: str, ia=llamar_ia) -> list:
    out = ia(REGLAS + " Recibes una lista JSON de textos en inglés. Devuelve SOLO una lista JSON con las traducciones, en el mismo orden "
             "y con el mismo número de elementos, conservando los saltos de línea.", json.dumps(frases, ensure_ascii=False), clave)
    r = _json_de(out)
    if not isinstance(r, list) or len(r) != len(frases) or not all(isinstance(x, str) and x.strip() for x in r):
        raise ValueError("la traducción no volvió completa")
    return r


def redactar_borrador(ext: dict, clave: str, ia=llamar_ia) -> dict:
    fuente = {"nombre": ext.get("page_title"), "lema": ext.get("tagline"), "descripcion": ext.get("description"),
              "secciones": [{"titulo": s.get("title"), "texto": s.get("intro"), "puntos": [{"t": i.get("title"), "x": i.get("text")} for i in (s.get("items") or [])]}
                            for s in ext.get("sections", [])],
              "ficha": [{"campo": s.get("label"), "valores": s.get("values")} for s in ext.get("specifications", [])],
              "creditos": ext.get("credits")}
    out = ia(REGLAS + " Redacta los textos cortos de la ficha de un barco SOLO con lo que dice la fuente: sin precios, sin equipamiento "
             "opcional (lo que la fuente llame opcional, «option» o «optional» no se menciona), sin comparaciones ni elogios propios. "
             "Devuelve SOLO un objeto JSON con estas claves: hero {headlines: [lema en español], descripcion: una frase con la eslora y lo "
             "principal}, introduccion (2 frases), diseno (3 a 4 frases), ingenieria (2 a 3 frases), experiencia (2 a 3 frases), "
             "performance (1 a 2 frases).", json.dumps(fuente, ensure_ascii=False)[:14000], clave, 3000)
    d = _json_de(out)
    claves = {"hero", "introduccion", "diseno", "ingenieria", "experiencia", "performance"}
    if not isinstance(d, dict) or not claves <= set(d) or not isinstance(d["hero"], dict) or not d["hero"].get("descripcion"):
        raise ValueError("los textos cortos no volvieron completos")
    return d


# ---------- cargar un modelo nuevo ----------

class Contexto:
    """Todo lo que toca el mundo exterior, para poder probar el proceso sin red ni procesos."""
    def __init__(self, raiz=ROOT, ejecutar=None, traer=None, ia=None, clave=""):
        self.raiz = Path(raiz)
        self.ejecutar = ejecutar or (lambda cmd, cwd=None, env=None: subprocess.run(cmd, cwd=cwd or self.raiz, env=env, capture_output=True, text=True))
        self.traer = traer or rm.traer
        self.ia = ia or llamar_ia
        self.clave = clave


def _py(ctx, *args, cwd=None):
    r = ctx.ejecutar([sys.executable, *args], cwd=cwd or ctx.raiz)
    if r.returncode != 0:
        raise RuntimeError(f"{' '.join(str(a) for a in args[:3])} falló: {(r.stderr or r.stdout or '').strip()[-300:]}")
    return r.stdout


def _tarjeta_y_resolucion(raiz: Path, marca: str, slug: str) -> str:
    """Foto de la tarjeta (3:2, barco completo) y medida de las fotos nuevas, solo para este modelo."""
    from PIL import Image
    fotos = raiz / "sitio" / "assets" / "img" / "modelos"
    dims = {f.name: Image.open(f).size for f in sorted(fotos.glob(slug + "-*.webp"))}
    if not dims:
        raise RuntimeError("no se bajaron las fotos del modelo")
    r = raiz / "sitio" / "assets" / "data" / "resolucion.json"
    R = json.loads(r.read_text())
    R.update({k: [w, h] for k, (w, h) in dims.items() if w < 1600})
    r.write_text(json.dumps(R, separators=(",", ":")))
    js = raiz / "sitio" / "assets" / "js"
    t = (js / "catalogo-contenido.js").read_text(); i = t.index("=") + 1
    gal = json.loads(t[i:t.rindex(";")]).get(f"{marca}/{slug}", {}).get("galeria", {})
    orden = gal.get("Navegando", []) + gal.get("Exterior", []) + [f"modelos/{slug}-hero.webp"] + gal.get("Galería", []) + gal.get("Cubierta", [])
    tarj = next((f for f in orden if Path(f).name in dims and 1.35 <= dims[Path(f).name][0] / dims[Path(f).name][1] <= 1.85), None)
    if tarj:
        c = js / "catalogo-data.js"; t2 = c.read_text(); j = t2.index("=") + 1
        C = json.loads(t2[j:t2.rindex(";")])
        for m in C[marca]["modelos"]:
            if m["slug"] == slug:
                m["tarjeta"] = tarj
        c.write_text(t2[:j] + json.dumps(C, ensure_ascii=False, separators=(",", ":")) + t2[t2.rindex(";"):])
    return tarj or "sin foto de tarjeta con buena proporción"


def cargar_modelo(ctx: Contexto, item: dict) -> dict:
    """Devuelve {'hecho': [...], 'pendiente': [...]}; lanza error si el paso es imposible."""
    marca, url = str(item.get("marca", "")), str(item.get("url", ""))
    if not (SLUG.match(marca) and HTTPS.match(url)):
        raise ValueError("datos no válidos para cargar")
    conocidas = {rm.norm(m["url"]) for ms in rm.conocidos(ctx.raiz).values() for m in ms}
    if rm.norm(url) in conocidas:
        return {"hecho": [f"{marca}: {url} ya estaba cargado"], "pendiente": []}
    adaptador = ADAPTADOR.get(marca, marca)
    if not (ctx.raiz / "tools" / "oceanic" / "adapters" / f"{adaptador}.py").exists():
        raise ValueError(f"la marca «{marca}» no tiene adaptador de extracción")
    trabajo = ctx.raiz / "revision" / "trabajo"
    trabajo.mkdir(parents=True, exist_ok=True)
    stem = rm.ultimo(rm.norm(url))
    hoy = __import__("datetime").date.today().isoformat()

    def bajar(u, destino):
        r = ctx.traer(u)
        if not r.ok or not r.texto:
            raise RuntimeError(f"no se pudo leer {u} ({r.estado or r.error}); si la web tiene captcha, se carga a mano")
        (trabajo / destino).write_text(r.texto, encoding="utf8")

    bajar(url, f"{stem}.html")
    ext_path = trabajo / f"{stem}.json"
    _py(ctx, "-m", "oceanic", "extract", adaptador, str(trabajo / f"{stem}.html"), url, str(ext_path), f"--accessed={hoy}", cwd=ctx.raiz / "tools")
    if marca == "beneteau":  # misma página en inglés para EE. UU. (fuente S3): refuerza o contradice los valores
        try:
            us = url.replace("beneteau.com/", "beneteau.com/en-us/", 1)
            bajar(us, f"{stem}-us.html")
            _py(ctx, "-m", "oceanic", "extract", adaptador, str(trabajo / f"{stem}-us.html"), us, str(trabajo / f"{stem}-us.json"), f"--accessed={hoy}", cwd=ctx.raiz / "tools")
            a, s = json.loads(ext_path.read_text()), json.loads((trabajo / f"{stem}-us.json").read_text())
            a["alternates"] = [{"page_title": s["page_title"], "source_url": s["source_url"], "accessed_at": s["accessed_at"], "specifications": s["specifications"]}]
            ext_path.write_text(json.dumps(a, ensure_ascii=False, indent=1))
        except Exception:
            pass  # la versión de EE. UU. es un refuerzo, no un requisito
    _py(ctx, "-m", "oceanic", "build", adaptador, str(ext_path), cwd=ctx.raiz / "tools")
    ext = json.loads(ext_path.read_text())
    # el paquete se llama como lo decidió el constructor: se busca el recién creado por su dirección oficial
    nuevos = [p for p in (ctx.raiz / "biblioteca" / marca).glob("*") if (p / "07_FUENTES" / "sources.json").exists()
              and url in (p / "07_FUENTES" / "sources.json").read_text()]
    if not nuevos:
        raise RuntimeError("el paquete no quedó en la biblioteca")
    slug = nuevos[0].name
    hecho = [f"{marca}/{slug}: paquete cargado en la biblioteca"]

    # traducción y textos cortos: necesitan la IA; sin clave, queda para después y no se publica
    pendiente = []
    pend = json.loads(_py(ctx, "tools/traduccion.py", "pendientes", marca, "--max=400") or "{}")
    if pend.get("lote"):
        if not ctx.clave:
            return {"hecho": hecho, "pendiente": [f"{marca}/{slug}: faltan {len(pend['lote'])} frases por traducir (falta la clave ANTHROPIC_API_KEY de GitHub); no se publica en el sitio"]}
        todas = list(pend["lote"])
        traducidas = []
        for k in range(0, len(todas), 30):
            traducidas += traducir_lote(todas[k:k + 30], ctx.clave, ctx.ia)
        tmp = trabajo / "traducciones.json"
        tmp.write_text(json.dumps(traducidas, ensure_ascii=False))
        _py(ctx, "tools/traduccion.py", "agregar", marca, str(tmp))
        hecho.append(f"{len(traducidas)} frases traducidas")
    _py(ctx, "tools/traduccion.py", "armar", marca)
    borrador = ctx.raiz / "drafts" / marca / f"{slug}.json"
    if not borrador.exists():
        if not ctx.clave:
            return {"hecho": hecho, "pendiente": [f"{marca}/{slug}: faltan los textos cortos (falta la clave ANTHROPIC_API_KEY); no se publica en el sitio"]}
        borrador.parent.mkdir(parents=True, exist_ok=True)
        borrador.write_text(json.dumps(redactar_borrador(ext, ctx.clave, ctx.ia), ensure_ascii=False, indent=1) + "\n", encoding="utf8")
        _py(ctx, "-m", "oceanic", "build", adaptador, str(ext_path), cwd=ctx.raiz / "tools")  # vuelve a armar con los textos
        hecho.append("textos cortos redactados (borrador)")

    # publicar en el sitio
    _py(ctx, "tools/sitio_catalogo.py", marca, slug)
    sharp = os.environ.get("SHARP_DIR", "/tmp/oceanic-build")
    r = ctx.ejecutar(["node", "scripts/fotos.mjs", f"--sharp={sharp}", f"--solo={slug}"], cwd=ctx.raiz / "sitio")
    if r.returncode != 0:
        raise RuntimeError("no se pudieron bajar las fotos: " + (r.stderr or r.stdout or "")[-200:])
    hecho.append("fotos: " + _tarjeta_y_resolucion(ctx.raiz, marca, slug))
    _py(ctx, "tools/sitio_fichas.py")
    evento = ctx.raiz / "sitio" / "evento" / "index.html"
    antes = evento.read_text(encoding="utf8") if evento.exists() else None
    _py(ctx, "tools/sitio_seo.py")
    if antes is not None:
        evento.write_text(antes, encoding="utf8")  # sitio_seo le quita el «noindex» a la página de eventos: se conserva
    hecho.append(f"{marca}/{slug}: publicado en el sitio (ficha traducida, catálogo, fotos y mapa)")
    return {"hecho": hecho, "pendiente": pendiente}


# ---------- orquesta ----------

def aplicar(archivo: Path, ctx: Contexto) -> dict:
    d = json.loads(Path(archivo).read_text(encoding="utf8"))
    res = {"hecho": [], "pendiente": [], "errores": []}
    for it in d.get("actualizar", []):
        try:
            res["hecho"].append(actualizar_direccion(ctx.raiz, it))
        except Exception as e:  # un paso que falla no frena a los demás
            res["errores"].append(f"actualizar {it.get('slug')}: {e}")
    for it in d.get("cargar", []):
        try:
            r = cargar_modelo(ctx, it)
            res["hecho"] += r["hecho"]; res["pendiente"] += r["pendiente"]
        except Exception as e:
            res["errores"].append(f"cargar {it.get('titulo') or it.get('url')}: {e}")
    res["completo"] = not res["pendiente"] and not res["errores"] and bool(res["hecho"])
    return res


def main(argv=None) -> int:
    args = list(argv if argv is not None else sys.argv[1:])
    salida = next((a.split("=", 1)[1] for a in args if a.startswith("--salida=")), "")
    archivos = [a for a in args if not a.startswith("--")]
    if len(archivos) != 1:
        print(__doc__)
        return 2
    res = aplicar(Path(archivos[0]), Contexto(clave=os.environ.get("ANTHROPIC_API_KEY", "")))
    if salida:
        Path(salida).write_text(json.dumps(res, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    for k, t in (("hecho", "HECHO"), ("pendiente", "PENDIENTE"), ("errores", "ERROR")):
        for x in res[k]:
            print(f"{t}: {x}")
    print("COMPLETO" if res["completo"] else "INCOMPLETO")
    return 0


if __name__ == "__main__":
    sys.exit(main())
