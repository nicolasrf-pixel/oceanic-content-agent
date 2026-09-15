# Log de investigación — media (galería/video) Axopar — 2026-09-15

## Alcance de esta pasada

Se agregó el campo `media` (schema `data/schema/model.schema.json`) a los 21
modelos ya existentes en `data/models/axopar/`. No se investigaron
especificaciones ni se crearon modelos nuevos — esos campos quedaron
intactos. Se actualizó `last_updated` a `2026-09-15` en los 21 archivos;
`verified_at` se dejó sin tocar.

Limitación de red vigente (CLAUDE.md sección 22): sin acceso directo
(WebFetch/curl) a dominios externos en este entorno (EGRESS_BLOCKED). Toda
la investigación de esta pasada se hizo con WebSearch (snippets indexados),
igual que en la verificación de marcas y en el caso Excess.

## Canal de YouTube de la marca

Búsqueda: "Axopar Boats official YouTube channel".

Canal oficial identificado: **https://www.youtube.com/c/AxoparBoats**
(también referenciado como `youtube.com/axoparboats` en resultados de
búsqueda). Usado como **fallback de nivel 1 / CONFIRMED** en los 21 modelos,
mismo patrón que `excess-12.json`.

## Metodología — imágenes

- Para cada modelo con `manufacturer_url` no nulo: se agregó una entrada
  `gallery_page`. Cuando esa URL coincide exactamente con una entrada ya
  presente en el array `sources` del propio modelo, se reutilizó su
  `level`/`verification_state` (típicamente nivel 1, CONFIRMED). Cuando no
  hubo coincidencia exacta en `sources` (p. ej. porque la fuente registrada
  apunta a una página índice de la familia y no a la ficha específica del
  modelo), se dejó `level=1`, `verification_state=UNCONFIRMED`, con nota
  explícita de que no hubo fetch directo.
- Modelos con coincidencia exacta en `sources` (level 1, CONFIRMED):
  ax-e-22, ax-e-25, axopar-22-spyder, axopar-22-t-top, axopar-25-cross-bow,
  axopar-25-cross-top, axopar-29-sun-top, axopar-37-sun-top,
  axopar-37-xc-cross-cabin, axopar-38-xc-cross-cabin, axopar-45-cross-top,
  axopar-45-sun-top, axopar-45-xc-cross-cabin.
- Modelos sin coincidencia exacta → `level=1 UNCONFIRMED` con nota:
  axopar-29-ccx, axopar-29-spyder, axopar-29-xc-cross-cabin,
  axopar-37-spyder, axopar-38-ccx, axopar-38-cross-top, axopar-38-sun-top.
- **axopar-28-cabin**: único modelo con `manufacturer_url = null`
  (descontinuado/superado por la familia Axopar 29, sin página vigente en
  axopar.com). Se reutilizó `https://oceanic.cl/usados/axopar-28/` (ya
  presente en `sources` de ese mismo registro, nivel 2 CONFIRMED) como
  `single_photo_page` — ficha de distribuidor con fotos de una unidad del
  modelo. No se buscó ninguna URL nueva no verificada.
- **Ningún modelo quedó con `images: []`** — los 21 tienen al menos una
  entrada de imagen (siempre derivada de `manufacturer_url` o, en el caso
  del 28 Cabin, de una fuente de distribuidor ya registrada).

## Metodología — videos

Para cada familia (22, 25, 28, 29, 37, 38, 45, AX/E) se buscó al menos un
video específico de alguno de sus modelos insignia. Resultado por modelo:

**Con video específico del modelo (16 de 21):**
- ax-e-25 → reseña/test drive YachtBuyer del AX/E 25 (page, no canal propio confirmado)
- axopar-22-spyder → "Axopar 22 Spyder Center Console Full Walkthrough Boat Review Video" (YouTube)
- axopar-22-t-top → "Axopar 22 T-Top (2022) - Test Video by BoatTEST.com" (YouTube)
- axopar-25-cross-bow → "Axopar 25 Cross Bow - MY 2022 English review" (YouTube)
- axopar-25-cross-top → "Axopar 25 Cross Top (2023-) Test Video by BoatTEST.com" (YouTube)
- axopar-28-cabin → "Axopar 28 Cabin (2019-) Test Video - By BoatTEST.com" (YouTube)
- axopar-29-ccx → reseña/test drive YachtBuyer del 29 CCX (page)
- axopar-29-sun-top → "Axopar 29 Sun Top: Luxury Performance Meets Adventure..." (YouTube)
- axopar-29-xc-cross-cabin → "Axopar 29 XC Cross Cabin Boat Review & Tour" (YouTube)
- axopar-37-sun-top → "Axopar 37 Revolution Sun Top Performance Review" (YouTube)
- axopar-37-xc-cross-cabin → "Axopar 37 XC Cross Cabin | Walkthrough Tour" (YouTube)
- axopar-38-sun-top → "Axopar 38 Sun Top & XC Cross Cabin | Full Walkthrough" (YouTube, compartido con el XC Cross Cabin)
- axopar-38-xc-cross-cabin → mismo video anterior + "Axopar 38 Walkthrough Tour & Review" (YouTube, walkthrough del rango 38)
- axopar-45-sun-top → reseña/test drive YachtBuyer del 45 Sun-Top (page)
- axopar-45-xc-cross-cabin → "Axopar 45 XC Cross Cabin: Benchmark For Adventure | Full Test & Features Review" (YouTube)
- ax-e-22 → video general de la línea AX/E ("Looking Into The Future of Electric Boating"), no específico de talla 22 vs 25, marcado como tal en notas

**Solo canal de marca como fallback (5 de 21), sin video específico
encontrado en esta pasada:**
- axopar-29-spyder
- axopar-37-spyder
- axopar-38-ccx
- axopar-38-cross-top
- axopar-45-cross-top

En todos los casos con video específico se agregó también el canal oficial
como entrada adicional de respaldo (excepto donde ya cubre el mismo rol).
Todos los videos específicos encontrados vía búsqueda quedaron marcados
`level=3, verification_state=UNCONFIRMED` (sin fetch directo del canal de
origen para confirmar autoría/oficialidad), salvo el canal oficial de la
marca (`level=1, CONFIRMED`).

## Validación técnica

Los 21 archivos se validaron con
`python3 -c "import json; json.load(open(ruta))"` tras la edición — todos
válidos. Se verificó además que: `media.media_status == "RESEARCHED"` en
los 21; todos los `type`/`platform`/`level`/`verification_state` respetan
los enums del schema; ningún archivo quedó con `images` vacío;
`last_updated == "2026-09-15"` en los 21. No se modificó ningún otro campo
(`specifications`, `sources`, `discrepancies`, `notes`, etc.) — confirmado
por `git diff --stat` (solo inserciones del bloque `media` + cambio de
`last_updated`).
