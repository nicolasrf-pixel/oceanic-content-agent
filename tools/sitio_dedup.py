"""Fotos repetidas dentro de la galería de un modelo (pedido del socio de motor, 2026-11-25).

La web oficial a veces publica la misma foto dos veces (otro recorte o tamaño). Aquí se detectan por contenido
(puntos de interés ORB + homografía RANSAC: sobreviven a recortes y cambios de escala, no confunden dos tomas
distintas de la misma sesión) y se deja la de mayor resolución.

  python3 tools/sitio_dedup.py            # revisa todos los modelos y escribe tools/fotos-repetidas.json
  python3 tools/sitio_dedup.py --aplicar  # además saca esas fotos de las galerías (sitio/assets/js/catalogo-contenido.js)

`sitio_catalogo.py` lee tools/fotos-repetidas.json y no vuelve a poner esas fotos al regenerar una galería.
Requiere opencv-python-headless (solo para correr esta herramienta; no es parte del sitio).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "sitio" / "assets" / "img"
CONTENIDO = ROOT / "sitio" / "assets" / "js" / "catalogo-contenido.js"
SALIDA = Path(__file__).resolve().parent / "fotos-repetidas.json"
INLIERS_MIN = 25
# Recortes tipo banner (1600×552) de renders que la galería ya trae completos: se quitan a mano tras revisarlos a la vista.
MANUAL = {
    # EXPLR 10: el Sport IB y el S+ IB comparten casco y la web oficial les publica las mismas fotos; cada uno muestra las suyas
    # (portada del Sport IB = la g5 del S+ IB, ya copiada a modelos/xo-explr-10-sport-ib-hero.webp).
    "xo/xo-explr-10-sport-ib": ["modelos/xo-explr-10-sport-ib-g3.webp", "modelos/xo-explr-10-sport-ib-g4.webp"],
    "xo/xo-explr-10-s-plus-ib": ["modelos/xo-explr-10-s-plus-ib-g5.webp"],
    "beneteau/gran-turismo-45-open": ["modelos/gran-turismo-45-open-g7.webp", "modelos/gran-turismo-45-open-g8.webp", "modelos/gran-turismo-45-open-g9.webp"],
}          # coincidencias geométricas para decir «es la misma foto»
LADO = 640


def _leer_js(ruta: Path):
    t = ruta.read_text(encoding="utf8")
    i = t.index("=") + 1
    j = t.rindex(";")
    return t[:i], json.loads(t[i:j]), t[j:]


def _gris(ruta: Path):
    im = Image.open(ruta).convert("L")
    w, h = im.size
    esc = LADO / max(w, h)
    return np.asarray(im.resize((max(1, int(w * esc)), max(1, int(h * esc))), Image.LANCZOS)), (w, h)


def _mismo_contenido(cv2, ga, gb, M) -> bool:
    """Alinea b sobre a y compara píxeles en la zona común: dos tomas con el mismo fondo pero otro primer plano no pasan."""
    h, w = ga.shape
    alin = cv2.warpAffine(gb, M, (w, h), flags=cv2.INTER_AREA | cv2.WARP_INVERSE_MAP)
    valido = cv2.warpAffine(np.full(gb.shape, 255, np.uint8), M, (w, h), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP) > 200
    if valido.sum() < 0.25 * min(h * w, gb.size / float(M[0, 0] ** 2 + M[1, 0] ** 2)):
        return False
    x, y = ga[valido].astype(float), alin[valido].astype(float)
    if x.std() < 1 or y.std() < 1:
        return False
    return float(np.corrcoef(x, y)[0, 1]) >= 0.93


def _dhash(g):
    from PIL import Image as _I
    a = np.asarray(_I.fromarray(g).resize((9, 8), _I.LANCZOS), dtype=int)
    return (a[:, 1:] > a[:, :-1]).flatten()


def repetidas(cv2, fotos: list[str], cache: dict) -> list[tuple[str, str]]:
    """Pares (se_queda, se_va)."""
    orb = cv2.ORB_create(nfeatures=900)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING)
    desc = {}
    for f in fotos:
        if f in cache:
            desc[f] = cache[f]
            continue
        p = IMG / f
        if not p.exists():
            continue
        g, (w, h) = _gris(p)
        kp, ds = orb.detectAndCompute(g, None)
        cache[f] = desc[f] = (np.float32([k.pt for k in kp]) if kp else None, ds, w * h, g)
    nombres = [f for f in fotos if f in desc and desc[f][1] is not None and len(desc[f][1]) >= 40]
    salida, quitadas = [], set()
    for i, a in enumerate(nombres):
        for b in nombres[i + 1:]:
            if a in quitadas or b in quitadas:
                continue
            pa, da, ta, ga = desc[a]
            pb, db, tb, gb = desc[b]
            ha, hb = _dhash(ga), _dhash(gb)
            asp_a, asp_b = ga.shape[1] / ga.shape[0], gb.shape[1] / gb.shape[0]
            if int((ha != hb).sum()) <= 6 and abs(asp_a / asp_b - 1) < 0.1:   # misma toma, mismo encuadre
                queda, va = (a, b) if ta >= tb else (b, a)
                salida.append((queda, va))
                quitadas.add(va)
                continue
            m = [x for x, y in (z for z in bf.knnMatch(da, db, k=2) if len(z) == 2) if x.distance < 0.75 * y.distance]
            if len(m) < INLIERS_MIN:
                continue
            # Misma foto = recorte/escala (semejanza de 4 grados de libertad); otra toma de la misma sesión no calza
            M, mask = cv2.estimateAffinePartial2D(pa[[x.queryIdx for x in m]], pb[[x.trainIdx for x in m]],
                                                  method=cv2.RANSAC, ransacReprojThreshold=2.5)
            if M is not None and int(mask.sum()) >= INLIERS_MIN and int(mask.sum()) >= 0.6 * len(m):
                escala = float(np.hypot(M[0, 0], M[1, 0]))
                if 0.25 <= escala <= 4 and _mismo_contenido(cv2, ga, gb, M):
                    queda, va = (a, b) if ta >= tb else (b, a)
                    salida.append((queda, va))
                    quitadas.add(va)
    return salida


def main(argv: list[str]) -> int:
    import cv2
    _, con, _ = _leer_js(CONTENIDO)
    cache: dict = {}
    res: dict[str, list[str]] = {}
    solo = [a for a in argv if not a.startswith('--')]
    for clave, c in con.items():
        if solo and clave not in solo:
            continue
        fotos = [f for l in (c.get("galeria") or {}).values() for f in l]
        if len(fotos) < 2:
            continue
        pares = repetidas(cv2, fotos, cache)
        quitar = {va for _, va in pares} | {f for f in MANUAL.get(clave, []) if f in fotos}
        if quitar:
            res[clave] = sorted(quitar)
            print(f"{clave}: {len(res[clave])} repetidas -> {', '.join(Path(v).stem.split('-')[-1] for v in res[clave])}")
    SALIDA.write_text(json.dumps(res, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf8")
    print(f"{len(res)} modelos con fotos repetidas ({sum(len(v) for v in res.values())} fotos) -> {SALIDA.name}")
    if "--aplicar" in argv:
        pre, con, suf = _leer_js(CONTENIDO)
        for clave, quitar in res.items():
            g = con[clave]["galeria"]
            for cat in list(g):
                g[cat] = [f for f in g[cat] if f not in quitar]
                if not g[cat]:
                    del g[cat]
        CONTENIDO.write_text(pre + json.dumps(con, separators=(",", ":"), ensure_ascii=False) + suf, encoding="utf8")
        print("galerías actualizadas")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
