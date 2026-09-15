# Log de investigación — media (galería/video) Solaris — 2026-09-15

## Alcance de esta pasada

Se agregó el campo `media` (schema `data/schema/model.schema.json`) a los 13
modelos ya existentes en `data/models/solaris/`. No se investigaron
especificaciones nuevas ni se crearon modelos nuevos — `specifications`,
`sources`, `discrepancies` y `notes` quedaron intactos. Se actualizó
`last_updated` a `2026-09-15` en los 13 archivos; `verified_at` se dejó sin
tocar.

Limitación de red vigente (CLAUDE.md sección 22): sin acceso directo
(WebFetch/curl) a dominios externos en este entorno (EGRESS_BLOCKED). No se
reintentó WebFetch dado que la limitación ya estaba confirmada de la pasada
de investigación de modelos (2026-09-10). Toda la investigación de esta
pasada se hizo con WebSearch (snippets indexados), igual que en los casos
Excess/Axopar/Aquila/Beneteau.

## Canal de YouTube de la marca

Búsqueda: "Solaris Yachts official YouTube channel".

Canal oficial identificado: **https://www.youtube.com/@solaris_yachts**
("SOLARIS Yachts"), cuya descripción coincide con la marca representada
("Since 1974 they have been building sailing boats from 35 to 100ft" /
"redefines the performance cruiser, blending world-class racing soul with
artisanal Italian elegance"). Usado como **fallback de nivel 1 / CONFIRMED**
en los 13 modelos.

**Advertencia de desambiguación explícita** (mismo criterio que la
exclusión de Oceanic Power en CLAUDE.md sección 2.4): la búsqueda también
devuelve canales y videos de **"Solaris Power Yachts"**
(`youtube.com/channel/UCCgedK1fsdcSE6g9vuBBDGg` /
`youtube.com/@solarispoweryachts8469`), una marca de **motor** distinta y
no relacionada con la representada Solaris (vela) de este proyecto. Se dejó
constancia de esta distinción en las notas de cada entrada de video para
que no se confunda ni se reintroduzca por error en pasadas futuras.

## Metodología — imágenes

- Para cada modelo con `manufacturer_url` no nulo (11 de 13): se agregó una
  entrada `gallery_page` apuntando a esa misma URL. En los 11 casos existía
  una entrada coincidente exacta en el array `sources` del propio modelo
  ("página oficial del modelo indexada... contenido completo no leído por
  bloqueo de red"), por lo que se reutilizó su `level=1` /
  `verification_state=UNCONFIRMED` tal como indica la metodología.
- **solaris-72-classic**: además de la `gallery_page` de `manufacturer_url`
  (brokerage, level 1 UNCONFIRMED), se agregó una segunda entrada
  `gallery_page` reutilizando `oceanic_url`
  (`https://www.oceanic.cl/vela/solaris-72/`), que ya está presente en
  `sources` con `level=2 AUTHORIZED / CONFIRMED` — es el único modelo de
  esta marca con ficha de producto propia y confirmada en oceanic.cl.
- **solaris-37** (`manufacturer_url = null`, modelo discontinuado): se
  reutilizó `https://itboat.com/models/2606-solaris-37`, ya presente en
  `sources` con `level=3 / CONFIRMED` (mismas cifras de eslora/manga/calado
  citadas en `specifications`), como `single_photo_page` — la página lista
  fotografías adicionales del modelo según el snippet de búsqueda.
- **solaris-42** (`manufacturer_url = null`): se buscó una alternativa
  específica del modelo ("Solaris 42" / "Solaris One 42" fotos) y no se
  encontró ninguna página de galería confiable y verificable atribuible con
  confianza razonable a este modelo. Un resultado de Rightboat sobre un
  "Solaris 42" de 1976 en Oxnard, California, se descartó explícitamente
  por corresponder casi con certeza a un velero homónimo de otro fabricante
  histórico estadounidense, no a Solaris Yachts (Italia, diseño Javier Soto
  Acebal). `sailboatdata.com` y `mauripro.com` (ya citados en `sources`)
  son fichas de datos, no galerías confirmadas. Se dejó `images: []` con
  constancia explícita en este log, tal como pide la metodología cuando no
  hay alternativa verificable — no se inventó ninguna URL.

## Metodología — videos

Se buscó video específico para el buque insignia (111 RS) y para al menos
uno de los modelos de gama media (44/47/50), según lo pedido:

- **solaris-111-rs** → "[ENG] SOLARIS 111 - Sailing Yacht Review - The Boat
  Show" (`youtube.com/watch?v=bFFs7ArX8yo`). Canal de terceros ("The Boat
  Show"), no confirmado como oficial → `level=3, UNCONFIRMED`.
- **solaris-44** → "Elle Marine Group | Solaris 44"
  (`youtube.com/watch?v=XcYucsqb3ic`), sobre un Solaris 44 de 2020
  ("Yellow Moon") atribuido explícitamente a Javier Soto Acebal en su
  descripción — confirma que se trata del velero Solaris (esta
  representada) y no de "Solaris Power 44 Open" (modelo homónimo de motor
  de la marca no relacionada, que domina los resultados de búsqueda para
  "Solaris 44 video"). `level=3, UNCONFIRMED` (canal de terceros).
- **solaris-47** y **solaris-50**: existen videos de terceros específicos
  ("The Boat Show", Yachting World / Toby Hodges) pero, cumplido el mínimo
  de "al menos uno" de la gama media con el 44, no se agregaron en esta
  pasada — quedaron con fallback de canal, explícito en sus notas.

**Con video específico del modelo (2 de 13):** solaris-111-rs, solaris-44.

**Solo canal de marca como fallback (11 de 13), sin video específico
agregado en esta pasada:** solaris-37, solaris-40, solaris-42, solaris-47,
solaris-50, solaris-55, solaris-60, solaris-64-rs, solaris-72-classic,
solaris-74-rs, solaris-80-rs.

En los 2 casos con video específico se agregó también el canal oficial
(`@solaris_yachts`) como entrada adicional de respaldo. Todos los videos
específicos encontrados vía búsqueda quedaron marcados `level=3,
verification_state=UNCONFIRMED` (canales de terceros, sin fetch directo
para confirmar autoría/oficialidad); el canal oficial de la marca quedó en
`level=1, CONFIRMED` en los 13 archivos.

## Validación técnica

Los 13 archivos se validaron con
`python3 -c "import json; json.load(open(ruta))"` tras la edición — todos
válidos. Se verificó además que: `media.media_status == "RESEARCHED"` en
los 13; todos los `type`/`platform`/`level`/`verification_state` respetan
los enums del schema; `last_updated == "2026-09-15"` en los 13; 1 archivo
(solaris-42) quedó con `images: []` (documentado arriba, sin URL
inventada). No se modificó ningún otro campo (`specifications`, `sources`,
`discrepancies`, `notes`, etc.) — confirmado por `git diff` (solo
inserciones del bloque `media` + cambio de `last_updated` en cada archivo).
