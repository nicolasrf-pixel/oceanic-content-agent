"""specifications.json -> tabla-caracteristicas.md + specifications.md.

specifications.json is the single source of truth for technical data. Every
field carries one record per official source value, so a value on the page
can always be traced back to where it came from. This module only renders
and validates; it never fills in or chooses values.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = json.loads((ROOT / "schema" / "field-catalog.json").read_text())
FIELDS = {f["key"]: f for f in CATALOG["fields"]}
STATUSES = set(CATALOG["status_values"])
DATA_SOURCE_TYPES = set(CATALOG["data_source_types"])
BASE_TABLE = CATALOG["base_table"]
# Optional per record: "location" (section of the page) and "cross_reference" (why a
# non-literal value maps to the Oceanic field).
RECORD_KEYS = ("source_id", "source_name", "url", "accessed_at", "source_field",
               "source_value", "source_unit", "normalized_value", "normalized_unit",
               "model_year")


def applies(field: dict, boat_type: str) -> bool:
    return "universal" in field["types"] or boat_type in field["types"]


def validate(spec: dict) -> list[str]:
    """Return rule violations. An empty list means the file is consistent."""
    errors = []
    boat_type = spec["model"]["boat_type"]
    seen = set()
    for f in spec["fields"]:
        key = f["oceanic_field"]
        where = f"campo {key}"
        if key not in FIELDS:
            errors.append(f"{where}: no existe en schema/field-catalog.json")
            continue
        if key in seen:
            errors.append(f"{where}: duplicado")
        seen.add(key)
        if f["status"] not in STATUSES:
            errors.append(f"{where}: estado desconocido {f['status']}")
        records = f.get("records", [])
        if f["status"] == "NOT_FOUND":
            if f.get("display_value") not in (None, "-"):
                errors.append(f"{where}: NOT_FOUND solo admite display_value '-'")
            if records:
                errors.append(f"{where}: NOT_FOUND no puede tener registros de fuente")
            continue
        if not records:
            errors.append(f"{where}: {f['status']} sin registro de fuente")
        for r in records:
            missing = [k for k in RECORD_KEYS if k not in r]
            if missing:
                errors.append(f"{where}: registro sin {', '.join(missing)}")
        if f["status"] == "VERIFIED":
            values = {json.dumps(r["normalized_value"]) for r in records}
            if len(values) > 1:
                errors.append(f"{where}: VERIFIED con valores distintos, debe ser CONFLICT")
        if f["status"] == "CONFLICT" and len(records) < 2:
            errors.append(f"{where}: CONFLICT necesita al menos dos valores")
        if not f.get("display_value") and f["status"] == "VERIFIED":
            errors.append(f"{where}: VERIFIED sin display_value")
    for key in BASE_TABLE[boat_type]:
        if key not in seen:
            errors.append(f"campo de la tabla base {key} ausente: buscarlo en la web del producto")
    for key, field in FIELDS.items():
        if key == "capacidad_combustible" and boat_type == "motor_electrico":
            continue
        if field["critical"] and applies(field, boat_type) and key not in seen and key not in BASE_TABLE[boat_type]:
            errors.append(f"campo crítico {key} ausente: registrar como NOT_FOUND si no hay fuente")
    return errors


def _cell(f: dict) -> str:
    if f["status"] == "VERIFIED":
        return f["display_value"]
    if f["status"] == "CONFLICT":
        parts = [f"{r['source_value']} ({r['source_id']})" for r in f["records"]]
        return "CONFLICT: " + " / ".join(parts)
    if f["status"] == "REQUIRES_REVIEW":
        return f"REQUIRES REVIEW: {f.get('display_value') or ''}".strip()
    return "NO ENCONTRADO"


def render_table(spec: dict) -> str:
    m = spec["model"]
    lines = [
        f"# Características · {m['model']}",
        "",
        f"Model year: **{m['model_year']}** · Variante: **{m['variant']}** · "
        f"Configuración: **{m['configuration']}** · Motorización: **{m['engine_option']}**",
        "",
        "> Tabla generada desde `specifications.json` (`python -m oceanic render`). "
        "No editar a mano.",
        "",
    ]
    by_key = {f["oceanic_field"]: f for f in spec["fields"]}
    base_keys = BASE_TABLE[m["boat_type"]]

    def row(f):
        note = f" ({f['display_note']})" if f.get("display_note") and f["status"] == "VERIFIED" else ""
        cell = "-" if f["status"] == "NOT_FOUND" else _cell(f)
        return f"| {f['label']} | {cell}{note} | {f['status']} |"

    lines += ["## CARACTERÍSTICAS", "", "| Campo | Valor | Estado |", "| --- | --- | --- |"]
    lines += [row(by_key[k]) for k in base_keys if k in by_key]
    # A NOT_FOUND field with display_value "-" stays in the table as a dash (Oceanic decision).
    rest = [f for f in spec["fields"] if f["oceanic_field"] not in base_keys
            and (f["status"] != "NOT_FOUND" or f.get("display_value") == "-")]
    if rest:
        lines += ["", "## Otras especificaciones", "", "| Campo | Valor | Estado |", "| --- | --- | --- |"]
        lines += [row(f) for f in rest]
    missing = [f for f in spec["fields"] if f["status"] == "NOT_FOUND"]
    if missing:
        lines += ["", "## Campos no encontrados en fuentes oficiales", ""]
        lines += [f"- **{f['label']}**: NO ENCONTRADO" + (f" — {f['notes']}" if f.get("notes") else "")
                  for f in missing]
    review = [f for f in spec["fields"] if f["status"] in ("CONFLICT", "REQUIRES_REVIEW")]
    if review:
        lines += ["", "## Pendiente de decisión humana", ""]
        for f in review:
            lines.append(f"- **{f['label']}** ({f['status']}): {f.get('notes', '')}")
    return "\n".join(lines) + "\n"


def render_detail(spec: dict, sources: list[dict]) -> str:
    by_id = {s["id"]: s for s in sources}
    m = spec["model"]
    lines = [f"# Especificaciones con trazabilidad · {m['model']} (MY{m['model_year']})", "",
             "> Generado desde `specifications.json`. Cada valor conserva nombre, valor y "
             "unidad originales del fabricante.", ""]
    for f in spec["fields"]:
        lines += [f"## {f['label']} · `{f['oceanic_field']}` · {f['status']}", ""]
        if f.get("display_value"):
            lines.append(f"Valor Oceanic: **{f['display_value']}**" +
                         (f" ({f['display_note']})" if f.get("display_note") else ""))
            lines.append("")
        if f.get("records"):
            lines += ["| Fuente | Sección | Campo original | Valor original | Unidad orig. | Normalizado | Cruce | MY | Acceso |",
                      "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
            for r in f["records"]:
                src = by_id.get(r["source_id"], {})
                lines.append(
                    f"| [{r['source_id']}]({r['url']}) {src.get('short', '')} | {r.get('location', '')} | "
                    f"{r['source_field']} | {r['source_value']} | {r['source_unit'] or ''} | "
                    f"{r['normalized_value']} {r['normalized_unit'] or ''} | {r.get('cross_reference', 'literal')} | "
                    f"{r['model_year']} | {r['accessed_at']} |")
            lines.append("")
        if f.get("notes"):
            lines += [f"Nota: {f['notes']}", ""]
    extra = spec.get("other_official_specs") or []
    if extra:
        lines += ["## Otras especificaciones oficiales (fuera de la tabla)", "",
                  "| Fuente | Campo original | Valor original | MY |", "| --- | --- | --- | --- |"]
        lines += [f"| {e['source_id']} | {e['source_field']} | {e['source_value']} | {e['model_year']} |"
                  for e in extra]
        lines.append("")
    return "\n".join(lines)


def render(model_dir: Path) -> list[str]:
    spec_dir = model_dir / "02_ESPECIFICACIONES"
    spec = json.loads((spec_dir / "specifications.json").read_text())
    sources = json.loads((model_dir / "07_FUENTES" / "sources.json").read_text())["sources"]
    errors = validate(spec)
    source_types = {s["id"]: s["type"] for s in sources}
    for f in spec["fields"]:
        for r in f.get("records", []):
            if r["source_id"] not in source_types:
                errors.append(f"campo {f['oceanic_field']}: fuente {r['source_id']} no está en sources.json")
            elif source_types[r["source_id"]] not in DATA_SOURCE_TYPES:
                errors.append(f"campo {f['oceanic_field']}: {r['source_id']} ({source_types[r['source_id']]}) "
                              "no es web oficial; no puede aportar datos")
    (spec_dir / "tabla-caracteristicas.md").write_text(render_table(spec))
    (spec_dir / "specifications.md").write_text(render_detail(spec, sources))
    if (model_dir / "05_MULTIMEDIA" / "IMAGENES" / "images.json").exists():
        from . import media
        media.render_inventory(model_dir)
    return errors
