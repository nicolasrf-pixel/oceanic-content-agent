# Log de verificación de modelos — Beneteau Sail (beneteau-sail) — 2026-09-10

## Limitación de acceso (heredada de sección 22 de CLAUDE.md)

Se probó `WebFetch` una vez contra `https://www.beneteau.com/en-us/range/sail`
y falló con `EGRESS_BLOCKED` (política de red del entorno). No se reintentó.
Toda la investigación de este documento se hizo exclusivamente con
`WebSearch` (snippets indexados por buscador), sin lectura directa de
ninguna página. Consecuencia: `confidence_level` máximo alcanzable en esta
pasada es `MEDIUM`; ningún modelo se marcó `HIGH`.

## Búsquedas realizadas (resumen, ~15 queries)

1. `Beneteau sailboat range 2026 Oceanis First lineup models`
2. `site:beneteau.com Oceanis models`
3. `"Oceanis" Beneteau current range 2025 2026 "30.1" OR "34.1" OR "37.1" OR "40.1" ...`
4. `Beneteau First line 2026 "First 24" OR "First 27" OR "First 36" OR "First 44" OR "First Yacht"`
5. `"former-beneteau-sailboats" First 2016-2026 Beneteau retired`
6. `Beneteau "Oceanis Yacht" 54 60 62 current range 2026`
7. `"beneteau.com/en-us/sailboats/first" current range First 24 27 36 44`
8. `Beneteau Oceanis current lineup 2026 "30.1" OR "34.1" OR "37.1" OR "40.1" still in production discontinued`
9. `Beneteau Oceanis 46.1 51.1 discontinued replaced 2025 2026`
10. `Beneteau "First 53" OR "First 60" current model 2026`
11. `Beneteau "Figaro" 3 current production 2026 one design`
12. `site:oceanic.cl beneteau vela Oceanis OR First modelo`
13. `oceanic.cl "beneteau-vela" Oceanis First`
14. `site:oceanic.cl "oceanis-34" OR "oceanis-37" OR "oceanis-40" OR "oceanis-46" OR "oceanis-51" OR "oceanis-47"` (sin resultados de oceanic.cl)
15. `site:oceanic.cl "first-27" OR "first-36" OR "first-44" OR "oceanis-yacht" OR figaro` (sin resultados de oceanic.cl)
16. `"beneteau.com" "oceanis-2015-2022" OR "oceanis-heritage" 46.1 51.1 current successor`
17. `Beneteau Oceanis 51.1 55.1 2026 still sold new boat`
18. `Beneteau First SE range "First 24 SE" "First 27 SE" "First 36 SE" launch 2026`

## Hallazgos clave

### Familias vigentes confirmadas
- **Oceanis** (cruceros): familia principal, ~40 años en 2026. Modelos
  generación ".1" (30.1, 34.1, 37.1, 40.1, 46.1, 51.1) siguen vigentes con
  evidencia de venta activa (listados año modelo 2026 en múltiples dealers).
  Nueva 8ª generación reemplaza la nomenclatura ".1" con **Oceanis 47** y
  **Oceanis 52**, debutados en el Cannes Boat Show de septiembre de 2025.
- **Oceanis Yacht** (línea de yates >50 pies, ruta propia en beneteau.com):
  54, 60, 62. Se trató como familia distinta de "Oceanis" por tener rutas
  de producto propias (`oceanis-yacht/`).
- **First** (racer/cruiser): 24, 27, 30, 36, 44, 53, 60.
- **First SE** ("Seascape Edition", tras adquisición de Seascape por
  Beneteau en 2018): línea con nombre y páginas propias en beneteau.com,
  tratada como familia distinta de "First" por regla de nomenclatura
  (CLAUDE.md sección 7). Confirmados: First 24 SE, First 36 SE.
  **No** se encontró página propia de "First 27 SE" ni "First 44 SE" — no
  se inventaron esos modelos pese a que un resumen de búsqueda los mencionó
  sin URL de respaldo.
- **Figaro Beneteau** (one-design de regata oceánica): Figaro Beneteau 3,
  producido en unidad dedicada (Beneteau Group Racing Division, Nantes).
  Vigente a nivel de fabricante, pero **sin ninguna mención en oceanic.cl**
  en esta pasada — representación por Oceanic Chile queda explícitamente
  sin confirmar.

### Señales de descontinuación / transición de generación (sin resolver)
- **Oceanis 46.1** y **51.1**: se encontraron indexadas dos rutas distintas
  en beneteau.com para el mismo modelo — una de catálogo vigente
  (`oceanis/oceanis-461`) y otra de herencia (`oceanis-2015-2022/oceanis-461`,
  solo para 46.1). Se priorizó CURRENT por evidencia de venta activa
  multi-dealer 2026, pero se documentó como discrepancia sin resolver.
- **Oceanis 55.1**: sin listados nuevos (año 2026) encontrados en mercados
  de reventa — solo unidades 2021. Posible descontinuado/sucedido por
  Oceanis Yacht 54/60 y Oceanis 52, pero **no reclasificado a
  DISCONTINUED** porque la única evidencia es ausencia de listados nuevos
  (CLAUDE.md sección 21 requiere aprobación humana para ese tipo de
  reclasificación). Queda UNCONFIRMED, marcado para revisión humana.
- **Oceanis Yacht 62**: indexado bajo ruta explícita
  `oceanis-yacht-heritage/oceanis-yacht-62` en beneteau.com (a diferencia
  de 54 y 60, en `oceanis-yacht/`). Señal fuerte de posible archivo del
  modelo por el propio fabricante. UNCONFIRMED, marcado para revisión
  humana — no reclasificado unilateralmente.
- **First 24**: página vigente confirmada (`beneteau.com/first/first-24`)
  y entrega reciente confirmada explícitamente por Oceanic Chile (nivel 2).
  También se indexó una página de rango general "First (2016-2026)" bajo
  `former-beneteau-sailboats/`, que agrupa la generación 7 del First. Señal
  débil y ambigua (apunta al rango, no al modelo específico) — se mantuvo
  CURRENT dando prioridad a la fuente Nivel 2 de Oceanic Chile, documentando
  la discrepancia.
- **First 27**: señal de descontinuación más fuerte que First 24 — la ruta
  de herencia apunta directamente al modelo
  (`first-2016-2026/first-27`), no solo al rango. Sin confirmación de
  Oceanic Chile. Se dejó como UNCONFIRMED, confidence LOW.
- **First 36**: no se encontró ruta de herencia; se mantiene CURRENT. Se
  documentó la existencia de **First 36 SE** como "evolución más liviana y
  rápida" (Cruising World), tratada como modelo nuevo separado, no como
  reemplazo confirmado del First 36 clásico.

### Confirmación de representación específica por Oceanic Chile
De los 22 modelos investigados, solo estos tienen mención **explícita** en
fuentes de oceanic.cl (nivel 2) más allá de la página general de línea:
- **Oceanis 30.1** — mencionado como entrega reciente.
- **Oceanis 52** — descrito con detalle propio en boletín "Puerto agosto 2026".
- **First 24** — mencionado como entrega reciente.
- **First 30** — descrito con copy propio en `oceanic.cl/beneteau-vela/`.

Para el resto de los modelos (34.1, 37.1, 40.1, 46.1, 51.1, 55.1, 47,
familia Oceanis Yacht completa, First 27/36/36 SE/24 SE/44/53/60, Figaro),
solo se confirmó vigencia a nivel de **fabricante global** (o de mercado de
reventa/dealers internacionales) — **no** se encontró evidencia específica
de que Oceanic Chile los tenga en su catálogo actual. Esto se documenta
explícitamente en el campo `notes` de cada archivo, y `oceanic_url` se dejó
en `null` quando no había ni siquiera una página de línea general
razonablemente atribuible, en vez de asumir representación.

## Discrepancias registradas (campo `discrepancies` en los JSON)
- `oceanis-46-1.json`: ruta vigente vs. ruta de herencia en beneteau.com.
- `first-24.json`: entrega confirmada por Oceanic Chile vs. posible archivo
  de la generación 7 del First a nivel global.
- `first-27.json`: ruta vigente vs. ruta de herencia específica del modelo
  (señal más fuerte que en First 24).

## Modelos NO creados (evitando inventar)
- "First 27 SE" y "First 44 SE": mencionados de forma ambigua en un resumen
  de búsqueda sin URL de respaldo verificable en beneteau.com — no se
  crearon archivos para evitar inventar modelos (CLAUDE.md sección 6).
- Modelos "heredados" pre-.1 (Oceanis 45, First 42, First 26, etc.)
  detectados solo en Wikipedia/páginas de herencia: fuera de alcance de
  esta pasada, que se centra en el catálogo **vigente** según el encargo.
  No se crearon archivos para ellos.

## Recomendación
Antes de avanzar a investigación técnica masiva (especificaciones
completas) de estos modelos, se recomienda: (a) habilitar acceso de red a
`beneteau.com` y `oceanic.cl` para resolver por fetch directo las
discrepancias de generación/herencia detectadas (46.1, 51.1, 55.1,
Oceanis Yacht 62, First 24, First 27), y (b) confirmar con Oceanic Chile
directamente cuáles de los 22 modelos aquí mapeados forman parte de su
catálogo real vigente, dado que solo 4 de 22 tienen confirmación explícita
en fuentes nivel 2 en esta pasada.
