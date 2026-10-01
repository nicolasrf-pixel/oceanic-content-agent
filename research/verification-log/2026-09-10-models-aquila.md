# Log de verificación de modelos — Aquila — 2026-09-10

## Nota de procedencia de este log

Este levantamiento se hizo en una sesión nueva. Un intento anterior de
investigar Aquila fue interrumpido por un límite de tasa antes de escribir
ningún archivo (`data/models/aquila/` estaba vacío al iniciar esta pasada).
No hay trabajo previo que recuperar; los 17 registros y este log se
generaron en esta misma sesión.

## Confirmación de la limitación de red (CLAUDE.md sección 22)

Se probó `WebFetch` una vez contra `https://www.aquilaboats.com/models`
antes de empezar. Resultado: `EGRESS_BLOCKED` ("Access to
www.aquilaboats.com is blocked by the network egress proxy"). Confirmado
el bloqueo, el resto de la investigación se hizo exclusivamente con
`WebSearch` (snippets indexados), tal como documenta CLAUDE.md sección 22
para `oceanic.cl` y `aquilaboats.com`. Ningún dato de este log o de los
archivos de modelo tiene `retrieval_method: direct_fetch`.

## Queries realizadas (orden aproximado)

1. `Aquila Power Catamarans models lineup 2026 site:aquilaboats.com`
2. `Aquila boats full model range 28 32 36 44 46 47 48 50 54 70`
3. `oceanic.cl aquila-boats modelos catamaran`
4. `"Aquila" catamarans models list site:aquilaboats.com/models`
5. `Aquila 44 Yacht power catamaran specifications length beam`
6. `Aquila 46 Yacht specifications length beam draft engines Hydro Glide`
7. `Aquila 50 Yacht specifications length beam draft engines cabins fuel water`
8. `Aquila 54 power catamaran specifications length beam draft engines`
9. `Aquila 70 Luxury power catamaran specifications length beam`
10. `Aquila 32 Sport power catamaran specifications length beam engines Mercury`
11. `Aquila 36 Sport OR Molokai specifications length beam engines`
12. `Aquila 45 Sport catamaran new model 2026 specifications`
13. `Aquila 35 Sport new model 2026 Cannes specifications`
14. `Aquila 28 Molokai specifications length beam engines cuddy`
15. `Aquila 47 Molokai specifications length beam engines`
16. `Aquila 46 Coupe power catamaran specifications`
17. `Aquila 42 Yacht OR "42 Coupe" catamaran specifications`
18. `"aquilaboats.com/models/yachts" 42 44 46 50 54 current lineup`
19. `Aquila 44 Yacht discontinued replaced 2025 2026`
20. `oceanic.cl aquila-boats "44" OR "46" OR "54" OR "32" OR "70"`
21. `site:oceanic.cl aquila-boats`
22. `"oceanic.cl/aquila-boats" modelo`
23. `Oceanic Chile Aquila catamaranes representante distribuidor`
24. `"oceanic.cl/motor/aquila" catamaran modelos`
25. `oceanic.cl aquila "32 sport" OR "36 sport" OR "54" OR "70 luxury" catamaran`
26. `"oceanic.cl" aquila "54 yacht" catamaran`
27. `"oceanic.cl" aquila molokai pesca`
28. `"oceanic.cl" aquila "42 yacht" OR "44 yacht"`
29. `Aquila 36 Sport "length" OR "LOA" specifications draft cabins fuel`
30. `Aquila 48 Yacht retired discontinued specifications history`
31. `oceanic.cl aquila 54 catamaran yate`
32. `"oceanic.cl/aquila-boats/46-yacht" OR "oceanic.cl/aquila-boats/32-sport" OR "oceanic.cl/aquila-boats/70-luxury"`
33. `site:oceanic.cl "aquila-boats" -50-yacht`

## Resultado: 17 modelos

| model_id | familia | lifecycle | confianza | evidencia Oceanic |
|---|---|---|---|---|
| aquila-32-sport | Aquila Sport | CURRENT | MEDIUM | mención genérica (/motor/aquila/) |
| aquila-35-sport | Aquila Sport | NEW | LOW | no |
| aquila-36-sport | Aquila Sport | CURRENT | MEDIUM | mención genérica (/motor/aquila/) |
| aquila-45-sport | Aquila Sport | CURRENT | LOW | no |
| aquila-28-molokai | Aquila Molokai (Offshore) | CURRENT | LOW | no |
| aquila-28-molokai-cuddy | Aquila Molokai (Offshore) | CURRENT | LOW | no |
| aquila-36-molokai | Aquila Molokai (Offshore) | NEW | LOW | no |
| aquila-47-molokai | Aquila Molokai (Offshore) | CURRENT | LOW | no |
| aquila-42-coupe | Aquila Coupe | CURRENT | MEDIUM | mención genérica (/motor/aquila/) |
| aquila-46-coupe | Aquila Coupe | CURRENT | MEDIUM | mención genérica (/motor/aquila/) |
| aquila-42-yacht | Aquila Yacht | CURRENT | MEDIUM | Instagram oficial @oceanic_chile |
| aquila-44-yacht | Aquila Yacht | DISCONTINUED | LOW | no |
| aquila-46-yacht | Aquila Yacht | CURRENT | MEDIUM | **página de marca detallada (oceanic.cl/aquila-boats/)** |
| aquila-48-yacht | Aquila Yacht (histórico) | DISCONTINUED | LOW | no |
| aquila-50-yacht | Aquila Yacht | CURRENT | MEDIUM | **URL de producto dedicada (oceanic.cl/aquila-boats/50-yacht/)** |
| aquila-54-yacht | Aquila Yacht | CURRENT | LOW | no |
| aquila-70-luxury | Aquila Luxury | CURRENT | MEDIUM | mención genérica (/motor/aquila/) |

Todos con `brand_id: "aquila"`, `category: "power_catamaran"`,
`status_pipeline: "MAPPED"`, `verified_at`/`last_updated: "2026-09-10"`.

## Estructura de líneas confirmada

El fabricante segmenta su gama de catamaranes a motor en 5 líneas (no solo
"Sport" vs "Yacht" como sugería la descripción inicial en
`master-inventory.json`):

- **Sport** (day boats, sin flybridge): 32, 35 (nuevo, estreno Cannes
  8-13 sept. 2026), 36, 45.
- **Molokai / Offshore** (pesca de altura): 28, 28 Cuddy, 36, 47. El "36"
  de esta línea es un modelo **distinto** del "36 Sport" (mismo número,
  fichas y propósito distintos — no se fusionaron).
- **Coupe** (weekender, techo rígido bajo, sin flybridge): 42, 46. Línea
  añadida en 2025. El "42" y "46" de esta línea son modelos **distintos**
  de los "42 Yacht"/"46 Yacht" (mismo número, layouts distintos).
- **Yacht** (crucero con flybridge, 42-54 pies): 42, 44 (discontinuado),
  46, 50, 54. Se agregó también el **48** como registro histórico
  (discontinuado ~2014-2020, predecesor del 50 Yacht) por completitud y
  trazabilidad, aunque no estaba en la lista de "verificar" del encargo.
- **Luxury**: 70 (modelo insignia, único de esta categoría).

## Hallazgo relevante NO incluido en los archivos de modelo: línea Sail

Se detectó que el fabricante `aquilaboats.com/models/sail-catamarans`
también ofrece catamaranes **a vela**: Aquila 45 Sail, 50 Sail y 65 Sail.
Un snippet de búsqueda asociado a contenido de `oceanic.cl` mencionó
explícitamente "Aquila 50 Sail" junto con "premio International Multihull
Show" en el mismo resultado que citaba la página de marca de Oceanic, lo
que sugiere (sin confirmación por fetch directo) que Oceanic podría estar
promocionando también esta línea vela, no solo la línea motor.

**No se crearon archivos de modelo para la línea Sail** porque: (a) el
encargo definió explícitamente el alcance como "Aquila (Aquila Power
Catamarans)" con `category: "power_catamaran"` para todos los archivos;
(b) `data/brands/master-inventory.json` categoriza la marca como
`power_catamaran` y la describe como "catamaranes a motor"; y (c) cambiar
esa categorización de marca es una decisión de arquitectura que requiere
aprobación humana (CLAUDE.md sección 21). Se deja esta nota para que el
orquestador/humano decida si conviene una pasada adicional sobre la línea
Sail de Aquila, y si eso implica actualizar la `brand_description` /
`category` de la entrada de marca en `master-inventory.json` (no
modificado en esta pasada).

## Otro hallazgo notable: posible distribuidor Aquila adicional

Una búsqueda devolvió "Estupenda Náutica - Distribuidor Aquila Power
Catamarans" (`estupendanautica.com`) como resultado junto a las fuentes de
Oceanic Chile. No se investigó en profundidad si se trata de un
distribuidor en otro país/mercado o si compite con Oceanic en Chile — se
deja como nota para una eventual verificación de marca, no afecta los
archivos de modelo de esta pasada (que documentan al fabricante y, donde
hay evidencia, a Oceanic, sin pronunciarse sobre exclusividad territorial).

## Discrepancias documentadas (conservadas, no resueltas en silencio)

1. **Aquila 44 Yacht — ¿discontinuado o vigente?** (`aquila-44-yacht.json`,
   campo `discrepancies`): yachtbuyer.com afirma explícitamente que el
   modelo "ya no está en producción" (rango 2014-2025) y fue reemplazado
   por el 46 Yacht; sin embargo, una página de concesionario (MarineMax)
   listaba un "2026 Aquila 44 Yacht". Ambos valores se conservan con su
   fuente; no se encontró una página `/models/yachts/44` vigente en el
   sitio del fabricante entre los resultados indexados (solo 42, 46, 50,
   54), lo que es indicio adicional a favor de la discontinuación, pero no
   prueba concluyente sin fetch directo.
2. **Números de modelo repetidos entre líneas**: "36" existe como Aquila
   36 Sport y Aquila 36 Molokai (modelos distintos); "42" existe como
   Aquila 42 Yacht y Aquila 42 Coupe; "46" existe como Aquila 46 Yacht y
   Aquila 46 Coupe. Documentado explícitamente en el campo `notes` de cada
   archivo afectado para evitar que una fase futura los fusione por error.
3. **Aquila 46 Yacht como sucesor del 44**: multihulls-world.com lo
   enmarca explícitamente como reemplazo ("¿el reemplazo del icónico
   44?"). Coherente con la discrepancia #1, documentado en el campo
   `notes` del `aquila-46-yacht.json` y `aquila-44-yacht.json`.

## Fuentes únicas usadas (aprox. 30)

Fabricante: `aquilaboats.com` (páginas de modelo y de línea), catálogos
PDF oficiales alojados en `nauticexpo.com` y en el sitio de un distribuidor
europeo (`fc-yacht.it`). Oceanic: `oceanic.cl/aquila-boats/`,
`oceanic.cl/aquila-boats/50-yacht/`, `www.oceanic.cl/motor/aquila/`, y una
publicación de Instagram de `@oceanic_chile`. Terceros: boattest.com,
yachtbuyer.com, multihulls-world.com, yachtingmagazine.com,
powerandmotoryacht.com, southernboating.com, itboat.com,
saltwatersportsman.com, boote-magazin.de, barcheamotore.com,
powerboat.news, boatingmag.com. Ninguna con `retrieval_method:
direct_fetch`.

## Campos pendientes para la siguiente fase

- Confirmar por fetch directo la ficha técnica completa del fabricante
  para cada modelo (dimensiones, capacidades, pasajeros — varios quedaron
  `UNKNOWN`, especialmente en la línea Molokai).
- Confirmar cuáles modelos, más allá del 46 Yacht y el 50 Yacht (evidencia
  fuerte) y el 42 Yacht (evidencia vía Instagram), tienen efectivamente
  página de producto propia en `oceanic.cl` — el resto solo tiene
  evidencia de mención genérica en `oceanic.cl/motor/aquila/` o ninguna
  evidencia local.
- Resolver si Oceanic representa la línea Sail de Aquila (45/50/65 Sail) —
  ver sección "Hallazgo relevante" arriba; requiere decisión humana antes
  de tocar `category`/`brand_description` en `master-inventory.json`.
- Confirmar fecha exacta de discontinuación del Aquila 44 Yacht y resolver
  la discrepancia con el listado de concesionario 2026.
- `banos`, `pasajeros` y velocidades quedaron `UNKNOWN` en la mayoría de
  los modelos de las líneas Sport, Molokai y Coupe/Yacht más recientes.
