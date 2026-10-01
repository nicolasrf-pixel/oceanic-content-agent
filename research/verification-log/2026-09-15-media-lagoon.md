# Log de investigación — media (galería/video) Lagoon — 2026-09-15

## Alcance de esta pasada

Se agregó el campo `media` (schema `data/schema/model.schema.json`) a los 16
modelos ya existentes en `data/models/lagoon/` (7 vela: 38, 39, 40, 42, 43,
46, 47; 9 motor: 51, 55, 60, Sixty 5, Sixty 7, Seventy 7, Seventy 8, Eighty
2, Eighty 3 — nota: 51/55/60 son vela, no motor, ver aclaración más abajo).
No se investigaron especificaciones nuevas ni se crearon modelos nuevos —
`specifications`, `sources`, `discrepancies` y `notes` quedaron intactos.
Se actualizó `last_updated` a `2026-09-15` en los 16 archivos; `verified_at`
se dejó sin tocar (queda en `2026-09-10`, fecha de la pasada original de
investigación de modelos).

Aclaración de categorías reales (`category` en cada archivo): vela = 38, 39,
40, 42, 43, 46, 47, 51, 55, 60 (10 modelos); motor/"Power catamarans" =
Sixty 5, Sixty 7, Seventy 7, Seventy 8, Eighty 2, Eighty 3 (6 modelos).

Limitación de red vigente (CLAUDE.md sección 22): sin acceso directo
(WebFetch/curl) a dominios externos en este entorno (EGRESS_BLOCKED). Se
probó una vez (`WebFetch` sobre un video de YouTube) y falló con
`EGRESS_BLOCKED`; no se reintentó. Toda la investigación de esta pasada se
hizo con WebSearch (snippets indexados), igual que en las pasadas
Excess/Axopar/Aquila/Beneteau/Solaris.

## Canal de YouTube de la marca

Búsqueda: "Lagoon Catamarans official YouTube channel".

Canal oficial identificado: **https://www.youtube.com/@LagoonCatamarans1984**
("Lagoon Catamarans", mismo canal bajo `youtube.com/channel/UCWVdVCBpjeIGtaJGgjyiT6g`),
consistente en múltiples búsquedas y con playlists dedicadas ("Lagoon Power
Catamarans - SIXTY and EIGHTY Series"). Usado como **fallback de nivel 1 /
CONFIRMED** en los 16 modelos.

## Metodología — imágenes

- Para cada modelo con `manufacturer_url` no nulo y coincidencia exacta en
  `sources` (12 de 16: 38, 40, 42, 43, 46, 51, 55, 60, Eighty 2, Seventy 7,
  Seventy 8, Sixty 5, Sixty 7): se agregó una entrada `gallery_page` con esa
  misma URL, reutilizando `level=1` / `verification_state=UNCONFIRMED` de la
  fuente coincidente en `sources` de cada archivo (tal como indica la
  metodología). `manufacturer_url` no se modificó en ningún archivo.
- **lagoon-39** (`manufacturer_url = null`, `lifecycle_status = DISCONTINUED`):
  no se encontró página vigente del modelo en catamarans-lagoon.com (búsqueda
  `site:catamarans-lagoon.com lagoon-39` sin resultados del dominio,
  consistente con el estado discontinuado). Se usó como alternativa la
  página del distribuidor oficial alemán
  `https://www.lagoon-catamaran.de/en/lagoon-models/lagoon-39-catamaran.html`
  (mismo dominio ya tratado como fuente `level=1` en `lagoon-eighty-3.json`),
  con `level=1 / UNCONFIRMED`.
- **lagoon-47** y **lagoon-eighty-3**: `manufacturer_url` registrado en el
  archivo es la portada genérica `https://www.catamarans-lagoon.com/` (no
  una página de modelo). Se agregó igualmente como `gallery_page` (siguiendo
  la instrucción de usarla tal cual), `level=1/UNCONFIRMED` sin fuente
  coincidente exacta en `sources`, con nota aclarando que es genérica. Se
  encontraron además páginas de modelo específicas vía búsqueda
  (`catamarans-lagoon.com/boats/lagoon-47` y `.../boats/eighty-3`) y se
  agregaron como segunda entrada `gallery_page`, `level=1/UNCONFIRMED`, sin
  modificar el campo `manufacturer_url` del archivo original.

**Ningún modelo quedó con `images: []`** — los 16 tienen al menos una
entrada de imagen.

## Metodología — videos

Modelos insignia pedidos explícitamente: línea vela 38/42/43/46/51/55/60
(los 7) y línea motor Sixty 5/7, Seventy 7/8, Eighty 2/3 (al menos uno de
cada par, priorizando Seventy 8).

- **Vela (7/7 con video específico):** 38 ("Lagoon 38, the family
  catamaran"), 42 ("Lagoon 42 - Worlds Best Selling Catamaran (Official
  Video)"), 43 ("Lagoon 43 | OFFICIAL VIDEO"), 46 ("Lagoon 46, the catamaran
  that everyone likes"), 51 ("LAGOON 51 | OFFICIAL VIDEO"), 55 ("LAGOON 55 |
  OFFICIAL VIDEO"), 60 ("Lagoon 60, the scenery of your dreams").
- **Motor:** Sixty 7 ("Lagoon SIXTY 7: The recipe for a dream anchorage!"),
  Seventy 7 ("Lagoon SEVENTY 7 - Bespoke, elegant and luxurious (Official
  Video)"), **Seventy 8 priorizado** ("Lagoon SEVENTY 8 - Unparalleled
  Luxury (Official Video)" — único modelo de la línea motor con evidencia de
  representación por Oceanic, ver `lagoon-seventy-8.json`), Eighty 2
  ("Lagoon EIGHTY 2 Full Walkthrough | 82ft Luxury Catamaran"), Eighty 3
  priorizado dentro de su par por ser el flagship más nuevo ("Lagoon EIGHTY
  3 – The Ultimate Luxury Catamaran | 3D Virtual Tour"; además se agregó la
  nota oficial del fabricante en catamarans-lagoon.com sobre el bautizo del
  modelo, `level=1/UNCONFIRMED`, como segunda entrada de video tipo
  `manufacturer_page`). **Sixty 5 quedó solo con fallback** (el par
  Sixty 5/7 ya queda cubierto por Sixty 7).
- **Fuera de la lista de insignia, solo fallback de canal:** 39
  (discontinuado, sin video oficial claro), 40 (no listado como insignia en
  el encargo), 47 (modelo recién anunciado/debut Cannes sept-2026; los
  videos encontrados son de distribuidores/terceros — Joe Fox/TMG Yachts,
  Signature Catamarans — no del canal oficial, por lo que no se agregaron
  como "específicos").

**Con video específico del modelo (12 de 16):** 38, 42, 43, 46, 51, 55, 60,
Sixty 7, Seventy 7, Seventy 8, Eighty 2, Eighty 3.

**Solo canal de marca como fallback (4 de 16):** 39, 40, 47, Sixty 5.

Todos los videos específicos encontrados vía búsqueda (incluidos los
titulados "OFFICIAL VIDEO"/"Official Video") quedaron marcados
`level=3, verification_state=UNCONFIRMED`: el título sugiere fuertemente
contenido oficial de Lagoon, pero el canal que aloja cada video no pudo
confirmarse de forma independiente sin fetch directo (`EGRESS_BLOCKED`). La
única excepción es la nota oficial de `catamarans-lagoon.com` sobre el
Eighty 3 (`level=1/UNCONFIRMED`, por estar en el dominio propio del
fabricante). El canal oficial de la marca quedó en `level=1, CONFIRMED` en
los 16 archivos, como en las pasadas anteriores de otras marcas.

## Validación técnica

Los 16 archivos se validaron con
`python3 -c "import json; json.load(open(ruta))"` tras la edición — todos
válidos. Se validó además cada bloque `media` contra
`data/schema/model.schema.json#/properties/media` con `jsonschema` — los 16
pasan. Se verificó que: `media.media_status == "RESEARCHED"` en los 16;
todos los `type`/`platform`/`level`/`verification_state` respetan los enums
del schema; `last_updated == "2026-09-15"` en los 16; `verified_at` sin
modificar en ninguno. Se confirmó por `git diff` que solo se modificaron
`media` y `last_updated` en cada uno de los 16 archivos — ningún otro campo
(`specifications`, `sources`, `discrepancies`, `notes`, `manufacturer_url`,
etc.) fue tocado. No se tocó `master-inventory.json`, el changelog,
`scripts/`, `dashboard/` ni ninguna otra marca.
