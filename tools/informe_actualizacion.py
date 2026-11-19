#!/usr/bin/env python3
"""Informe de actualización del sitio (regla Oceanic: desde el 2026-12-01 00:00, hora de Chile, cada actualización lleva informe).

Arma el borrador del informe con lo que hay en git entre dos puntos (commits, archivos tocados, cómo volver atrás) y lo guarda
en docs/informes/AAAA-MM-DD-<titulo>.md, además de agregarlo al índice docs/ACTUALIZACIONES.md. El texto «Qué se mejoró y por qué»
lo completa una persona (o Claude) antes de enviarlo: el informe no sale sin esa explicación.

  python3 tools/informe_actualizacion.py --titulo "Menú de marcas" --desde 2026-12-01 [--hasta HEAD] [--fecha 2026-12-03]
"""
import argparse
import re
import subprocess
import sys
import unicodedata
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANZAMIENTO = "2026-12-01 00:00 (hora de Chile)"


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def slug(t: str) -> str:
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:60] or "actualizacion"


def commits(desde: str, hasta: str) -> list[tuple[str, str, str]]:
    rango = [f"--since={desde}", hasta] if re.fullmatch(r"\d{4}-\d{2}-\d{2}", desde) else [f"{desde}..{hasta}"]
    out = git("log", "--no-merges", "--date=short", "--pretty=%h|%ad|%s", *rango)
    filas = []
    for l in out.splitlines():
        h, f, s = l.split("|", 2)
        filas.append((h, f, s[:200]))
    return filas


def areas(archivos: list[str]) -> dict[str, int]:
    nombres = {"sitio/admin": "Administrador", "sitio/worker": "Servidor (Worker)", "sitio/assets": "Sitio público", "sitio/functions": "Formularios y correo",
               "tools": "Herramientas", "docs": "Documentación", "biblioteca": "Biblioteca de contenido"}
    cuenta: dict[str, int] = {}
    for a in archivos:
        k = next((v for p, v in nombres.items() if a.startswith(p)), "Otros")
        cuenta[k] = cuenta.get(k, 0) + 1
    return dict(sorted(cuenta.items(), key=lambda x: -x[1]))


def informe(titulo: str, desde: str, hasta: str, fecha: str) -> str:
    cs = commits(desde, hasta)
    primero, ultimo = (cs[-1][0], cs[0][0]) if cs else ("—", "—")
    archivos = [a for a in git("diff", "--name-only", f"{primero}~1", ultimo).splitlines()] if cs else []
    stat = git("diff", "--shortstat", f"{primero}~1", ultimo).strip() if cs else "sin cambios"
    ar = areas(archivos)
    lineas = [f"# Informe de actualización · {titulo}", "",
              f"- **Fecha:** {fecha}", f"- **Regla:** informe obligatorio desde el lanzamiento ({LANZAMIENTO}).",
              f"- **Versión publicada:** `{ultimo}` (desde `{primero}`)", f"- **Alcance:** {stat}", "",
              "## Qué se mejoró y por qué", "", "> COMPLETAR: en 3–6 líneas, qué cambió para las personas que usan el sitio o el administrador y qué problema resuelve.", "",
              "## Dónde se tocó", ""]
    lineas += [f"- {k}: {n} archivo(s)" for k, n in ar.items()] or ["- (sin archivos)"]
    lineas += ["", "## Cambios (commits)", ""] + [f"- `{h}` {f} · {s}" for h, f, s in cs]
    lineas += ["", "## Verificación", "", "- [ ] Pruebas del sitio (`cd sitio && node --test tests/*.test.mjs`)", "- [ ] Pruebas de herramientas (`cd tools && python3 -m unittest discover -s tests`)",
               "- [ ] Despliegue en verde (Workers Builds) y revisión en vivo", "", "## Cómo volver atrás", "",
               f"`git revert {ultimo}` (o desde el administrador: Historial → Restaurar como borrador, para contenido).", "",
               "## Pendientes o riesgos", "", "- (ninguno / completar)", ""]
    return "\n".join(lineas)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--titulo", required=True)
    ap.add_argument("--desde", required=True, help="fecha AAAA-MM-DD o commit/etiqueta")
    ap.add_argument("--hasta", default="HEAD")
    ap.add_argument("--fecha", default=date.today().isoformat())
    ap.add_argument("--salida", default="")
    a = ap.parse_args(argv)
    texto = informe(a.titulo, a.desde, a.hasta, a.fecha)
    destino = Path(a.salida) if a.salida else ROOT / "docs" / "informes" / f"{a.fecha}-{slug(a.titulo)}.md"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(texto, encoding="utf8")
    idx = ROOT / "docs" / "ACTUALIZACIONES.md"
    if idx.exists() and not a.salida:
        fila = f"| {a.fecha} | [{a.titulo}](informes/{destino.name}) |\n"
        t = idx.read_text(encoding="utf8")
        if fila not in t:
            idx.write_text(t.rstrip("\n") + "\n" + fila, encoding="utf8")
    print(destino)
    return 0


if __name__ == "__main__":
    sys.exit(main())
