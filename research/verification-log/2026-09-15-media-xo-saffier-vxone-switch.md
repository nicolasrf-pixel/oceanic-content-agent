# Log de verificación de media — XO Boats, Saffier, VX One, Switch — 2026-09-15

## Alcance de esta pasada

Se agregó el campo `media` (galería de imágenes + videos) a los 19 modelos
ya existentes: `data/models/xo-boats/` (6), `data/models/saffier/` (11),
`data/models/vx-one/` (1), `data/models/switch/` (1). No se investigaron
especificaciones nuevas ni se crearon modelos nuevos; solo se tocó `media`
y `last_updated` (fijado a `2026-09-15`) en cada archivo. `verified_at` se
dejó sin cambios (`2026-09-10` en los 19). `media_status` quedó en
`"RESEARCHED"` en los 19.

## Limitación de acceso (heredada de sección 22 de CLAUDE.md)

No se intentó `WebFetch`/`curl` directo en esta pasada; toda la
investigación se hizo exclusivamente con `WebSearch` (snippets indexados).
Por eso casi ninguna entrada nueva de `media` quedó `CONFIRMED`; la mayoría
son `level=1`/`UNCONFIRMED` (contenido de fabricante identificado por
búsqueda, sin poder confirmar titularidad/canal exacto por fetch directo).

## Metodología — imágenes

Los 19 modelos tienen `manufacturer_url` no nulo, así que los 19 recibieron
una entrada `gallery_page` apuntando a esa URL (`images` no quedó vacío en
ninguno de los 19).

- **XO Boats (6/6)**: en los 6 archivos la `manufacturer_url` coincide
  exactamente con una entrada de `sources` nivel 1, todas `UNCONFIRMED` en
  origen → se reusó `level=1`/`UNCONFIRMED` en los 6.
- **Saffier (11/11)**: coincidencia exacta con `sources` en los 11.
  8 heredaron `level=1`/`UNCONFIRMED` (sc-650-cruise, sc-8m-cabin,
  se-24-lite, se-28-leopard, se-33-life, se-38-leader, sl-46,
  se-27-leisure — este último con `previous-models/` marcado UNCONFIRMED
  en su propio archivo). 3 heredaron `level=1`/`CONFIRMED`: sc-8m-open
  (artículo oficial del cambio de nombre SE26→SC 8m Open), sc-10m-cabin y
  se-37-lounge (ambos referencian páginas oficiales `previous-models/` y
  `pre-owned/...` marcadas CONFIRMED en sus `sources` respectivos).
- **VX One (0/1 con match exacto)**: `manufacturer_url` es la home
  `vxsailing.com/` y no hay entrada exacta en `sources` (solo subpáginas:
  `/vx-one-class-rules/` y `vxone.com/specs`, ambas CONFIRMED) → se usó
  `level=1`/`UNCONFIRMED` por defecto con nota explícita.
- **Switch (0/1 con match exacto)**: `manufacturer_url` es la home
  `switchonedesign.com/` y `sources` solo tiene la subpágina `/technology`
  (CONFIRMED) → mismo criterio, `level=1`/`UNCONFIRMED` por defecto.

## Metodología — videos

- **XO Boats**: canal fallback identificado por `WebSearch`:
  `youtube.com/channel/UCyMLUPtUJlAqCxHuM-sQRdw` ("XO Boats"; existe
  también el handle `@xoboats334`, posiblemente el mismo canal, no
  resuelto con certeza) → `level=1`/`UNCONFIRMED` en los 6 modelos.
  Video específico agregado para los 2 modelos pedidos como mínimo:
  - **DFNDR 9**: "XO DFNDR 9 - World Premiere" (watch?v=4B0XRk2f3Vo).
  - **EXPLR 44** (buque insignia): "XO EXPLR 44 - A New Chapter in the
    History of XO Boats" (watch?v=x8voq9oezWA).
  - dfndr-8, dscvr-9, explr-9, explr-10: solo fallback de canal (fuera del
    mínimo pedido, no se priorizó video específico).
- **Saffier**: canal fallback `youtube.com/@saffieryachts` (también
  indexado como `youtube.com/user/saffieryachts`) → `level=1`/`UNCONFIRMED`
  en los 11 modelos. Video específico agregado para los 2 modelos mínimos
  pedidos más 3 adicionales encontrados con buena señal:
  - **SE 33 Life**: "Chapter 4: The new Saffier Se 33 Life is alive"
    (watch?v=6ZLbA8jyRis).
  - **SL 46** (buque insignia): "NEW Saffier SL46 MED | Official
    walkthrough video | Saffier Yachts" (watch?v=-xARH-IQX5A) — el propio
    título se autodenomina oficial.
  - Adicionales: SE 28 Leopard (watch?v=q4s6z9Y6XWo), SC 8m Cabin
    (playlist `PLQ36Yf4iqw73HlFGwsE3IUMaTbZQWT5un`), SE 37 Lounge
    (watch?v=9z0nEMTt2EU).
  - sc-650-cruise, sc-8m-open, se-24-lite, se-38-leader, sc-10m-cabin,
    se-27-leisure: solo fallback de canal.
- **VX One**: no existe canal único de "clase" identificado; se usó como
  fuente principal un video del fabricante licenciado **Ovington Boats**
  ("Carbon keelboat 2025 VX one by OVINGTON", watch?v=90fpKAboJgc),
  marcado `level=2` (Ovington es "Licensed Manufacturer" según la fuente
  `vxsailing.com/vx-one-class-rules/` ya registrada en el archivo) y
  `UNCONFIRMED`. Se agregó además un video de prensa náutica (Yachting
  World, watch?v=uEIYubg4l2U) como `level=3`/`UNCONFIRMED`.
- **Switch**: no se encontró un canal oficial de YouTube de Switch One
  Design en esta pasada (sí Instagram/Facebook `@switchonedesign`); se
  documenta esa ausencia explícitamente en vez de inventar un canal. Se
  agregó un video de terceros ("SWITCH One Design | BOAT TOUR",
  watch?v=8dH7rn7m0pE) como `level=3`/`UNCONFIRMED`.

## Validación

Los 19 archivos se validaron con
`python3 -c "import json; json.load(open(ruta))"` — los 19 pasaron sin
error, y además se verificó por script que los 19 tienen
`media.media_status == "RESEARCHED"` y `last_updated == "2026-09-15"`. Se
revisó `git diff --stat` sobre las 4 carpetas: los 19 diffs solo agregan
líneas (bloque `media` + cambio de `last_updated`), sin tocar
`specifications`, `sources`, `discrepancies`, `variants` ni `notes`.

## Búsquedas realizadas (resumen)

1. `XO Boats official YouTube channel`
2. `XO DFNDR 9 video review youtube`
3. `XO EXPLR 44 video youtube`
4. `Saffier Yachts official YouTube channel`
5. `Saffier SE 33 Life video youtube`
6. `Saffier SL 46 video youtube`
7. `VX One sailboat class video youtube Ovington Mackay Boats`
8. `Switch One Design foiler official YouTube channel`
9. `"youtube.com/@xoboats" OR "@XOBoats"`
10. `site:youtube.com saffieryachts channel`
11. `Mackay Boats VX One youtube video build`
12. `Ovington Boats VX One youtube video`
13. `XO Boats DFNDR 9 official youtube.com/channel/UCyMLUPtUJlAqCxHuM-sQRdw`
14. `"XO DFNDR 9 - World Premiere" youtube channel "XO Boats"`
15. `"XO EXPLR 44" world premiere OR launch official youtube "XO Boats" channel`
16. `"switchonedesign" youtube channel official videos`
17. `Switch One Design youtube.com/@SwitchOneDesign OR @switchsailing`

## Pendientes / notas para revisión humana

- Ningún canal de YouTube (XO Boats, Saffier Yachts) se pudo confirmar
  como oficial por fetch directo; todos quedaron `UNCONFIRMED`.
  Recomendable revalidar con acceso de red antes de uso editorial.
- VX One: se trató a Ovington Boats como fuente Nivel 2 (fabricante
  licenciado de la clase, no el diseñador original ni el sitio de la
  asociación de clase); revisar criterio si se define más adelante una
  jerarquía distinta para clases one-design con múltiples constructores.
- Switch One Design: no se encontró canal oficial de YouTube; si existe,
  requiere fetch directo o confirmación humana.
- No se investigaron ni modificaron specs, `sources`, `discrepancies` ni
  `notes` de ningún modelo en esta pasada.
