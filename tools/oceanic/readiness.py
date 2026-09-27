"""Content readiness for a model package.

Each item is OK, PARTIAL or MISSING, judged from the package files themselves
(not from how much text exists). CONTENT_STATUS:
  RED    - a critical item is MISSING
  YELLOW - anything else is not OK, or conflicts are unresolved
  GREEN  - everything is OK
The percentage is informative only; it never changes the status.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from . import specs

EDITORIAL = {
    "hero": "01_CONTENIDO/hero.md",
    "introduccion": "01_CONTENIDO/introduccion.md",
    "diseno": "01_CONTENIDO/diseno.md",
    "ingenieria": "01_CONTENIDO/ingenieria.md",
    "experiencia": "01_CONTENIDO/experiencia-a-bordo.md",
    "performance": "01_CONTENIDO/performance.md",
}
CRITICAL = {"tabla_tecnica", "hero", "introduccion", "hero_image", "exterior"}
MIN_SOURCE_WORDS = 40
MIN_IMAGES = {"EXTERIOR": 3, "INTERIOR": 2, "DETAIL": 2}


def _section_words(text: str, heading: str) -> int:
    m = re.search(rf"^## {heading}\s*$(.*?)(?=^## |\Z)", text, re.M | re.S)
    if not m:
        return 0
    body = re.sub(r"<!--.*?-->", "", m.group(1), flags=re.S)
    # Status notes ("> Candidato ... BORRADOR ...") are not content.
    body = "\n".join(line for line in body.splitlines()
                     if not re.match(r"\s*>\s*(Candidato|⚠)", line))
    return len(re.findall(r"\w+", body))


def _editorial(model_dir: Path, rel: str) -> tuple[str, str]:
    path = model_dir / rel
    if not path.exists():
        return "MISSING", "archivo no existe"
    text = path.read_text()
    src = _section_words(text, "SOURCE CONTENT")
    cand = _section_words(text, "OCEANIC CONTENT")
    if re.search(r"^## OCEANIC CONTENT\s*\n+PENDIENTE", text, re.M):  # placeholder, not a candidate
        cand = 0
    if src >= MIN_SOURCE_WORDS and cand > 0:
        return "OK", f"{src} palabras fuente · candidato Oceanic presente"
    if src > 0:
        return "PARTIAL", f"{src} palabras fuente" + ("" if cand else " · sin candidato Oceanic")
    return "MISSING", "sin contenido fuente"


def _load(path: Path):
    return json.loads(path.read_text()) if path.exists() else None


def evaluate(model_dir: Path) -> dict:
    items: dict[str, dict] = {}

    def put(group, key, status, detail):
        items[key] = {"group": group, "status": status, "detail": detail}

    spec = _load(model_dir / "02_ESPECIFICACIONES" / "specifications.json")
    conflicts = []
    if spec:
        boat_type = spec["model"]["boat_type"]
        base = specs.BASE_TABLE[boat_type]
        status_of = {f["oceanic_field"]: f["status"] for f in spec["fields"]}
        missing = [k for k in base if status_of.get(k, "NOT_FOUND") == "NOT_FOUND"]
        conflicts = [f["label"] for f in spec["fields"] if f["status"] in ("CONFLICT", "REQUIRES_REVIEW")]
        base_conf = [k for k in base if status_of.get(k) in ("CONFLICT", "REQUIRES_REVIEW")]
        verified = [k for k in base if status_of.get(k) == "VERIFIED"]
        detail = f"tabla base {len(verified)}/{len(base)} verificada"
        if missing:
            detail += f" · faltan: {', '.join(missing)}"
        if base_conf:
            detail += f" · en conflicto: {', '.join(base_conf)}"
        if len(missing) > len(base) / 2:
            put("DATOS", "tabla_tecnica", "MISSING", detail)
        else:
            put("DATOS", "tabla_tecnica", "OK" if not missing and not base_conf else "PARTIAL", detail)
        n = sum(1 for f in spec["fields"] if f["status"] != "NOT_FOUND")
        put("DATOS", "especificaciones", "OK" if n >= 10 else "PARTIAL", f"{n} campos con fuente")
    else:
        put("DATOS", "tabla_tecnica", "MISSING", "sin specifications.json")
        put("DATOS", "especificaciones", "MISSING", "sin specifications.json")

    car = model_dir / "03_CARACTERISTICAS" / "caracteristicas.md"
    put("DATOS", "caracteristicas", *(("OK", "presente") if car.exists() else ("MISSING", "no existe")))
    eq = [p for p in ("standard.md", "optional.md") if (model_dir / "04_EQUIPAMIENTO" / p).exists()]
    put("DATOS", "equipamiento", "OK" if len(eq) == 2 else ("PARTIAL" if eq else "MISSING"),
        ", ".join(eq) or "sin standard/optional")

    for key, rel in EDITORIAL.items():
        put("EDITORIAL", key, *_editorial(model_dir, rel))

    inv = _load(model_dir / "05_MULTIMEDIA" / "IMAGENES" / "images.json")
    imgs = [r for r in (inv or {}).get("images", []) if r["scope"] == "THIS_MODEL"]
    downloaded = [r for r in imgs if r["file"]]
    heroes = [r for r in imgs if r["hero_candidate"]]
    dl_note = f" · descargadas {len(downloaded)}/{len(imgs)}"
    if heroes:
        put("MULTIMEDIA", "hero_image", "OK" if any(r["file"] for r in heroes) else "PARTIAL",
            f"{len(heroes)} candidatas" + ("" if any(r["file"] for r in heroes) else " · sin descargar"))
    else:
        put("MULTIMEDIA", "hero_image", "MISSING", "sin HERO_CANDIDATE")
    for cat, minimum in MIN_IMAGES.items():
        group = {cat} | ({"CABIN", "COCKPIT"} if cat == "INTERIOR" else set()) | ({"UNDERWAY"} if cat == "EXTERIOR" else set())
        n = sum(1 for r in imgs if r["category"] in group)
        n_file = sum(1 for r in downloaded if r["category"] in group)
        if n == 0:
            status = "MISSING"
        elif n >= minimum and n_file >= minimum:
            status = "OK"
        else:
            status = "PARTIAL"
        put("MULTIMEDIA", cat.lower(), status, f"{n} en inventario (mín. {minimum})" + dl_note)
    vids = _load(model_dir / "05_MULTIMEDIA" / "VIDEOS" / "videos.json")
    nv = sum(1 for v in (vids or {}).get("videos", []) if v["scope"] == "THIS_MODEL")
    put("MULTIMEDIA", "video", "OK" if nv else "MISSING", f"{nv} videos del modelo")

    docs = _load(model_dir / "06_DOCUMENTOS" / "documents.json")
    for key, cat in (("brochure", "BROCHURES"), ("technical", "TECHNICAL"), ("manual", "MANUALS")):
        all_cat = [d for d in (docs or {}).get("documents", []) if d["category"] == cat]
        found = [d for d in all_cat if d["scope"] == "THIS_MODEL"]
        if not found and all_cat:
            put("DOCUMENTOS", key, "PARTIAL", f"{len(all_cat)} identificado(s) · requiere revisión")
        elif not found:
            put("DOCUMENTOS", key, "MISSING", "no encontrado en fuentes oficiales")
        elif any(d.get("file") or d.get("download_url") for d in found):
            put("DOCUMENTOS", key, "OK", f"{len(found)} documento(s) con enlace oficial")
        else:
            put("DOCUMENTOS", key, "PARTIAL", f"{len(found)} identificado(s) · sin enlace directo")

    critical_missing = [k for k in CRITICAL if items.get(k, {}).get("status") == "MISSING"]
    not_ok = [k for k, v in items.items() if v["status"] != "OK"]
    if critical_missing:
        status = "RED"
    elif not_ok or conflicts:
        status = "YELLOW"
    else:
        status = "GREEN"
    score = sum({"OK": 1, "PARTIAL": 0.5}.get(v["status"], 0) for v in items.values())
    return {
        "CONTENT_STATUS": status,
        "completeness_pct": round(100 * score / len(items)),
        "critical_missing": critical_missing,
        "unresolved_conflicts": conflicts,
        "items": items,
    }


def render_block(result: dict) -> str:
    lines = ["<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->",
             f"**CONTENT_STATUS = {result['CONTENT_STATUS']}** · completitud "
             f"{result['completeness_pct']}% (informativa; el estado lo deciden las reglas)", ""]
    if result["critical_missing"]:
        lines.append(f"Falta crítico: {', '.join(result['critical_missing'])}")
    if result["unresolved_conflicts"]:
        lines.append(f"Conflictos sin resolver: {', '.join(result['unresolved_conflicts'])}")
    lines += ["", "| Grupo | Ítem | Estado | Detalle |", "| --- | --- | --- | --- |"]
    for key, v in result["items"].items():
        lines.append(f"| {v['group']} | {key} | {v['status']} | {v['detail']} |")
    lines.append("<!-- READINESS:END -->")
    return "\n".join(lines)


def write(model_dir: Path) -> dict:
    result = evaluate(model_dir)
    (model_dir / "00_MODELO" / "readiness.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    md = model_dir / "00_MODELO" / "00_MODELO.md"
    text = md.read_text()
    block = render_block(result)
    text = re.sub(r"<!-- READINESS:START.*?<!-- READINESS:END -->", lambda _: block, text, flags=re.S)
    md.write_text(text)
    return result
