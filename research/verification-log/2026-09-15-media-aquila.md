# Log de verificación de media — Aquila (aquila) — 2026-09-15

## Alcance de esta pasada

Se agregó el campo `media` (galería de imágenes + videos) a los 17 modelos
ya existentes de `data/models/aquila/`. No se investigaron
especificaciones nuevas ni se crearon modelos nuevos; solo se tocó `media`
y `last_updated` (fijado a `2026-09-15`) en cada archivo. `verified_at` se
dejó sin cambios. `media_status` quedó en `"RESEARCHED"` en los 17.

## Limitación de acceso (heredada de sección 22 de CLAUDE.md)

No se intentó `WebFetch`/`curl` directo en esta pasada (limitación ya
documentada y confirmada en pasadas previas de este mismo entorno). Toda
la investigación se hizo exclusivamente con `WebSearch` (snippets
indexados), sin lectura directa de ninguna página. Por eso ninguna entrada
nueva de `media` se marcó `level=1` + `verification_state=CONFIRMED`
salvo el canal oficial de YouTube (justificación abajo).

## Metodología aplicada — imágenes

- Los **17 modelos** tienen `manufacturer_url` no nulo (ninguno es null en
  esta marca), por lo que los 17 recibieron una entrada `gallery_page`
  apuntando a esa URL. `images` no quedó vacío en ningún modelo.
- **13 modelos**: la `manufacturer_url` coincide exactamente con una
  entrada de `sources` de nivel 1 (`aquilaboats.com`), por lo que se
  reutilizó `level=1` / `verification_state=UNCONFIRMED` (los `sources`
  de esta marca no tienen ninguna entrada `aquilaboats.com` marcada
  `CONFIRMED`, a diferencia de Excess). Modelos: 28-molokai-cuddy,
  28-molokai, 32-sport, 35-sport, 36-sport, 42-coupe, 42-yacht, 45-sport,
  46-coupe, 46-yacht, 47-molokai, 50-yacht, 54-yacht, 70-luxury.
- **2 modelos** (`aquila-36-molokai`, comparte `.../models/offshore`):
  `manufacturer_url` es una página **genérica** de línea (no ficha
  específica del modelo), coincide con `sources` nivel 1, se reusó
  `level=1`/`UNCONFIRMED` con nota explícita de que es genérica.
- **2 modelos** (`aquila-44-yacht`, `aquila-48-yacht`): comparten la
  misma URL genérica `aquilaboats.com/models/yachts` (según aviso del
  encargo), y esa URL **no** aparece en `sources` de ninguno de los dos
  (sus `sources` solo tienen yachtbuyer.com/nauticexpo.com, nivel 3). Se
  usó por defecto `level=1`/`UNCONFIRMED` con nota explícita de ambas
  circunstancias (genérica + sin fuente coincidente exacta).
- **1 modelo** (`aquila-35-sport`): `manufacturer_url` es una página de
  noticia/anuncio de lanzamiento (Cannes Yachting Festival 2026), no una
  ficha de producto dedicada; se referenció igual como mejor fuente
  disponible, con nota aclaratoria.

## Metodología aplicada — videos

- Canal oficial de YouTube identificado por `WebSearch` de forma
  consistente en 3 búsquedas independientes: **Aquila Boats**
  (`https://www.youtube.com/channel/UC3Q63RytuJYI032le906OHw`). Se
  registró como `level=1`/`CONFIRMED` (bio del canal coincide con la
  descripción oficial de la marca; sin fetch directo del canal en sí).
  Usado como fallback en los 17 modelos.
- **5 modelos insignia** (al menos uno por línea Sport/Molokai/Coupe/Yacht,
  priorizando 46 Yacht y 50 Yacht por ser los de evidencia de
  representación Oceanic) recibieron además un video específico vía
  `WebSearch`, marcado `level=3`/`UNCONFIRMED` (medios de prueba
  especializados, no canal oficial confirmado):
  - **Yacht**: `aquila-46-yacht` → BoatTEST "Aquila 46 Power Catamaran
    Review — The Smarter, Bigger 47-Foot Yacht" (watch?v=dnGMCDt1jcg).
  - **Yacht**: `aquila-50-yacht` → "Aquila 50 Yacht Power Catamaran |
    Full In-Depth Walkthrough" (watch?v=uwu1wdCJVWc).
  - **Sport**: `aquila-36-sport` → "Aquila 36 Sport Power Catamaran
    (2021) - Test Video" (watch?v=xPwNTNHy9L4).
  - **Molokai**: `aquila-47-molokai` → BoatTEST "Aquila 47 Molokai Power
    Catamaran (2024-) The Features" (watch?v=uz0KuUEQkD4).
  - **Coupe**: `aquila-46-coupe` → BoatTEST "Aquila 46 Coupe Performance
    & Test" (watch?v=oxR8Ukc0o5k).
- Los **12 modelos restantes** solo tienen la entrada del canal oficial
  como fallback, con nota explícita de que no se identificó/priorizó
  video específico del modelo en esta pasada.

## Validación

Los 17 archivos se validaron individualmente con
`python3 -c "import json; json.load(open(ruta))"` — los 17 pasaron sin
error. Se revisó `git status`/`git diff` para confirmar que en esta marca
solo se modificaron `media` y `last_updated` (se verificó línea por línea
en `aquila-44-yacht.json` como muestra); `verified_at`, `specifications`,
`sources`, `discrepancies` y `notes` quedaron intactos en los 17.

## Nota operativa (incidente de scratch, sin impacto en el resultado)

Durante la ejecución, un script intermedio escrito en el directorio de
scratchpad de esta sesión fue sobrescrito en disco por contenido de otra
tarea concurrente (aparentemente una sesión hermana trabajando en la
marca Axopar sobre el mismo checkout de repo) antes de poder ejecutarse.
Se detectó por el output de `bash` no coincidiendo con el script
esperado, se verificó con `git status` que ningún archivo de
`data/models/aquila/` había sido tocado por ese incidente, y se re-hizo
la edición completa mediante un heredoc de Python ejecutado directamente
(sin pasar por archivo de scratch), sin reutilizar el script
comprometido. No se modificó ni revirtió nada fuera de
`data/models/aquila/`.

## Búsquedas realizadas (resumen)

1. `Aquila Power Catamarans official YouTube channel`
2. `"aquilaboats.com" youtube channel official link`
3. `Aquila 46 Yacht video review youtube`
4. `Aquila 50 Yacht video walkthrough youtube`
5. `Aquila 36 Sport video walkthrough youtube`
6. `Aquila 46 Coupe video review youtube`
7. `Aquila 47 Molokai video review youtube`

## Pendientes / notas para revisión humana

- Ninguna entrada de `images` alcanzó `level=1` + `CONFIRMED` (a
  diferencia de Excess-11): los `sources` existentes de Aquila para
  `aquilaboats.com` ya estaban en `UNCONFIRMED`, así que se heredó ese
  estado consistentemente.
- `aquila-44-yacht` y `aquila-48-yacht` comparten la misma URL genérica de
  galería (`aquilaboats.com/models/yachts`); antes de usar en contenido
  público conviene buscar las fichas específicas `/models/yachts/44` y
  `/models/yachts/48` con acceso de red habilitado.
- Los videos "insignia" (5 modelos) son de medios de prueba especializados
  (BoatTEST y similares), no confirmados como canal oficial de la marca;
  recomendable revalidar con fetch directo antes de uso editorial.
- No se investigaron ni modificaron specs, `sources`, `discrepancies` ni
  `notes` de ningún modelo en esta pasada.
