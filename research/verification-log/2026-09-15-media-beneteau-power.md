# Log de investigación — media (galería/video) Beneteau Power — 2026-09-15

## Alcance de esta pasada

Se agregó el campo `media` (schema `data/schema/model.schema.json`) a los 32
modelos ya existentes en `data/models/beneteau-power/`. No se investigaron
especificaciones ni se crearon modelos nuevos — esos campos quedaron
intactos (`specifications`, `discrepancies`, `sources`, `notes` sin cambios;
confirmado con `git diff --stat`, que muestra solo inserciones + el cambio
de `last_updated`). Se actualizó `last_updated` a `2026-09-15` en los 32
archivos; `verified_at` se dejó sin tocar.

Limitación de red vigente (CLAUDE.md sección 22): sin acceso directo
(WebFetch/curl) a dominios externos en este entorno (EGRESS_BLOCKED,
confirmado nuevamente con un intento a `www.beneteau.com`). Toda la
investigación de esta pasada se hizo con WebSearch (snippets indexados),
igual que en la verificación de marcas y en los casos Excess/Axopar.

## Canal de YouTube de la marca

Búsqueda: "Beneteau official YouTube channel".

Canal oficial identificado: **https://www.youtube.com/user/BeneteauYachtChannel**
("Beneteau Yacht Channel"). Los snippets de búsqueda lo describen como el
canal principal de la marca ("Beneteau has been designing and building
boats since 1884..."), sin poder confirmarlo por fetch directo. Usado como
**fallback de nivel 1 / CONFIRMED** en los 32 modelos, mismo patrón que
`excess-12.json`.

(Nota: existen también `BENETEAU America` y `Groupe Beneteau Channel`, pero
se eligió el canal genérico de marca "Beneteau Yacht Channel" por cubrir
vela y motor sin sesgo regional.)

## Metodología — imágenes

- Los 32 modelos tienen `manufacturer_url` no nulo → los 32 recibieron una
  entrada `gallery_page` con esa URL. **Ningún modelo quedó con
  `images: []`.**
- Cuando `manufacturer_url` coincide exactamente con una entrada ya
  presente en `sources` del propio modelo, se reutilizó su
  `level`/`verification_state` (25 de 32 modelos, incluyendo antares-7,
  antares-7-fishing y antares-8-fishing, cuya URL genérica de familia sí
  coincide exactamente con una entrada ya registrada en `sources` de esos
  mismos registros, nivel 1 UNCONFIRMED).
- Cuando no hubo coincidencia exacta en `sources`, se dejó `level=1`,
  `verification_state=UNCONFIRMED`, con nota explícita (7 de 32):
  flyer-10, flyer-10-sport-top, flyer-7-spacedeck, flyer-7-sundeck,
  flyer-8-sundeck, gran-turismo-36 y swift-trawler-43-sedan.
- **URLs genéricas de familia/línea** (compartidas por varios modelos, no
  específicas del modelo exacto), marcadas con nota adicional en
  `media.images[].notes`:
  - `beneteau.com/motorboats/antares-outboard` → antares-7,
    antares-7-fishing, antares-8-fishing.
  - `beneteau.com/motorboats/flyer` → flyer-10, flyer-10-sport-top,
    flyer-7-spacedeck, flyer-7-sundeck, flyer-8-sundeck.
  - `beneteau.com/motor-yachts/swift-trawler` → swift-trawler-37-sedan.
- **Caso especial swift-trawler-43-sedan**: su `manufacturer_url` registrado
  es en realidad la página del **Swift Trawler 43 Fly**
  (`beneteau.com/swift-trawler/swift-trawler-43-fly`), no una ficha propia
  del Sedan. Se usó igualmente como punto de partida de galería, pero se
  documentó explícitamente en la nota de esa entrada que no es específica
  del modelo Sedan (posible dato ya heredado del registro original, fuera
  del alcance de esta pasada de media corregirlo).

## Metodología — videos

Se buscó al menos un video específico por línea insignia según instrucción
(Antares, Flyer, Gran Turismo, Swift Trawler, y explícitamente el Grand
Trawler 63). Resultado — **5 de 32 modelos con video específico** además
del canal de marca:

- **antares-9** → "Beneteau Antares 9 - Full Walkthrough Tour - 2022/23
  Model" (YouTube, canal/uploader no confirmado como oficial).
- **flyer-9-spacedeck** → "BENETEAU Flyer 9 SPACEdeck Walkthrough"
  (YouTube).
- **gran-turismo-50** → "GRAN TURISMO 50 - Beneteau - Guided Tour (in
  English)" (YouTube).
- **swift-trawler-48** → "Beneteau Swift Trawler 48 | Full Walkthrough |
  The Marine Channel" (YouTube, medio especializado de terceros).
- **grand-trawler-63** → "BENETEAU GRAND TRAWLER 63" (YouTube).

Todos estos videos específicos quedaron `level=3, verification_state=
UNCONFIRMED` (sin fetch directo del canal de origen para confirmar
autoría/oficialidad ni asociación real con Beneteau).

**Los 27 modelos restantes** quedaron solo con el canal de marca como
fallback (`level=1, CONFIRMED`), explícito en `notes` de esa entrada de
video ("Fallback de canal de marca: no se identificó video específico de
este modelo en el canal oficial en esta pasada").

## Validación técnica

- Los 32 archivos se validaron con
  `python3 -c "import json; json.load(open(ruta))"` tras la edición — todos
  válidos.
- Se validaron además contra `data/schema/model.schema.json` (incluyendo
  `$ref` a `source.schema.json`) con `jsonschema` (Draft 2020-12) —
  32/32 OK, 0 errores.
- `media.media_status == "RESEARCHED"` en los 32.
- Ningún archivo quedó con `images` vacío.
- `last_updated == "2026-09-15"` en los 32; `verified_at` sin cambios
  (confirmado con `git diff` por archivo, sin líneas `verified_at`
  modificadas).
- `git diff --stat` sobre `data/models/beneteau-power/`: 32 archivos
  modificados, cada uno con exactamente 1 línea eliminada (el antiguo
  `last_updated`) y el resto inserciones (bloque `media` + nuevo
  `last_updated`) — confirma que no se tocó ningún otro campo.
