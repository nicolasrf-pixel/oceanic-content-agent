# Master Catalog — dashboard de revisión interna

Herramienta interna para revisar visualmente el inventario de
representadas/modelos sin leer los JSON directamente. **No es parte del
sitio público de Oceanic** (ver `CLAUDE.md`, que restringe construir el
frontend público hasta fases posteriores — esta excepción es explícita:
es una herramienta de gestión de contenido, no una página de producto).

## Qué es y qué no es

- Es una página estática (HTML + CSS + JS vanilla, sin build, sin
  dependencias, sin framework) que lee en vivo:
  - `data/catalog/master-catalog.json` — los modelos publicados por las
    representadas activas (`portfolio_status` ACTIVE/NEW) en sus sitios
    oficiales.
  - `data/catalog/oceanic-catalog.json` — el subconjunto de esos modelos
    con evidencia de representación específica por Oceanic Chile.
  - Una marca con `portfolio_status` DISCONTINUED/UNCONFIRMED (ej. Skeeta,
    ver `data/changelog/brands-changelog.md`) se conserva íntegra en
    `data/brands/master-inventory.json` pero desaparece de estos dos
    catálogos y por tanto del dashboard — no está borrada, solo fuera del
    catálogo activo.
- No duplica datos: todo lo que se ve (KPIs, tarjetas, filtros, detalle)
  se calcula en el navegador a partir de esos dos archivos. Si se
  regeneran, el dashboard refleja el cambio en el siguiente refresh —
  no hay que tocar el código.
- Pensada para crecer: la vista de detalle de cada modelo ya trae toda
  la trazabilidad (fuentes, discrepancias, notas, especificaciones) lista
  para cuando se agreguen las siguientes pestañas (Contenido,
  Especificaciones, Características, Equipamiento, Imágenes, Documentos,
  Conflictos) sin rehacer la arquitectura de datos.

## Cómo ejecutarlo localmente

Los navegadores bloquean `fetch()` sobre `file://`, así que hay que
servir la carpeta por HTTP. **Importante: el servidor debe arrancar
desde la raíz del repositorio** (no desde `dashboard/`), porque la
página pide los JSON con una ruta relativa (`../data/catalog/...`).

Cualquiera de estas opciones funciona (usa la que ya tengas instalada):

```bash
# Opción 1 — Python (normalmente ya disponible)
cd /ruta/al/repo/oceanic-content-agent
python3 -m http.server 8080

# Opción 2 — paquete "serve" de Node (ya está instalado globalmente en este entorno)
cd /ruta/al/repo/oceanic-content-agent
npx serve -l 8080 .

# Opción 3 — http-server de Node
cd /ruta/al/repo/oceanic-content-agent
npx http-server -p 8080 .
```

Luego abre:

```
http://localhost:8080/dashboard/
```

Para detener el servidor: `Ctrl+C` en la terminal donde corre.

## Qué vas a ver

- **KPIs arriba**: Marcas, Modelos fabricante, Modelos Oceanic, Current,
  Historical, Requires Review, Unconfirmed — todos calculados en vivo.
- **Tarjetas de marca** (vista inicial): total de modelos, cuántos tienen
  evidencia de representación por Oceanic, vigentes, históricos y cuántos
  requieren revisión. Click en una tarjeta filtra por esa marca.
- **Filtros**: marca, categoría, familia (se acota según marca/categoría
  elegida), estado, representación Oceanic, y un toggle "solo requiere
  revisión". Más el buscador de texto libre (modelo, familia o marca).
- **Tarjetas de modelo**: marca · categoría · familia, nombre del modelo,
  variantes si tiene, estado (con ícono + texto, no solo color), badge de
  representación Oceanic, badge de "requiere revisión" si aplica, y el
  link a la fuente oficial (abre en pestaña nueva).
- **Detalle** (click en cualquier tarjeta de modelo): identificación,
  representación y su fuente, fuente oficial del fabricante, validación
  (confianza, fechas, issues detectados automáticamente), discrepancias
  conservadas entre fuentes, variantes, **galería de imágenes y video**
  (enlaces a la página/galería/video oficial — nunca archivos descargados
  ni hotlinkeados, ver `media` en `data/schema/model.schema.json`), lista
  completa de fuentes, y las notas de investigación originales.
  Un modelo de una pasada anterior a la incorporación de este campo
  (2026-09-14) muestra "Sin investigar aún" en vez de una lista vacía —
  para distinguir "no tiene" de "no se buscó todavía".

## Qué significa "Requires Review"

Es un flag calculado, no un dato de origen. Un modelo se marca como
"requiere revisión" si **cualquiera** de estas condiciones se cumple:

- tiene una discrepancia entre fuentes sin resolver;
- su `confidence_level` es `LOW`;
- solo tiene una fuente registrada en total;
- su `lifecycle_status` es `UNCONFIRMED`.

Ver la función `review_reasons()` en `scripts/build_catalog.py` para el
criterio exacto, o `catalog_meta.description` dentro de
`data/catalog/master-catalog.json`.

## Cómo regenerar los datos si cambia el inventario

El dashboard no tiene lógica de escritura — solo lee. Para reflejar
cambios en `data/models/*.json`, desde la raíz del repositorio:

```bash
python3 scripts/build_catalog.py
```

Esto reescribe `data/catalog/master-catalog.json` y
`data/catalog/oceanic-catalog.json`. Solo hace falta recargar la página
del dashboard — no hay que tocar nada de `dashboard/`.
