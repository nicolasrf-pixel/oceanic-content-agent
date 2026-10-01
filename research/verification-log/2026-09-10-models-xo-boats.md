# Verificación de modelos — XO Boats (2026-09-10)

## Contexto y limitación de acceso a red

Se probó `WebFetch` una vez contra `https://xoboats.com/` para confirmar el
bloqueo documentado en CLAUDE.md sección 22:

```
WebFetch → https://xoboats.com/
Resultado: EGRESS_BLOCKED ("Access to xoboats.com is blocked by the network
egress proxy.")
```

Confirmado. A partir de ahí se usó exclusivamente `WebSearch` (snippets
indexados), sin reintentar `WebFetch`/`curl`. Ningún dato de este
levantamiento proviene de lectura directa de página — todo es
`retrieval_method: web_search_snippet`, lo cual limita todos los
`verification_state` a `UNCONFIRMED` salvo la mención editorial de Oceanic
sobre el EXPLR 44 (marcada `CONFIRMED` porque el snippet reproduce la
afirmación textual de la fuente nivel 2).

## Hallazgo principal: página de marca de Oceanic SÍ existe

La Fase 1 (`data/brands/master-inventory.json`, entrada `xo-boats`) dejó
`oceanic_url: null` con nota de que no se había encontrado una página de
marca dedicada. En esta pasada, la query `site:oceanic.cl "XO"` devolvió:

```
"XO – Oceanic" → https://oceanic.cl/xo-boats/
```

Esto es una **discrepancia respecto a la Fase 1** que debe registrarse en
`data/changelog/brands-changelog.md` (no se edita aquí, se reporta al
orquestador). La página existe y está indexada, pero:
- No se pudo leer su contenido completo (WebFetch bloqueado).
- Los snippets de búsqueda sobre esa URL no devolvieron un listado
  explícito y textual de qué modelos de XO están representados en Chile
  específicamente (solo confirmaciones indirectas: DFNDR 8 en la sección
  de usados de Oceanic, y EXPLR 44 mencionado en newsletters "Puerto").
- Por lo tanto `oceanic_url` se dejó en `null` en los 6 modelos (no se
  pudo atribuir una URL de ficha de producto específica dentro de esa
  página de marca), y `confidence_level` se mantuvo conservador
  (MEDIUM como máximo, ninguno HIGH).

## Queries realizadas (resumen)

1. `XO Boats DFNDR DSCVR EXPLR models range Finland aluminum` — panorama
   general de las 3 gamas.
2. `site:oceanic.cl "XO"` — encontró `oceanic.cl/xo-boats/` (hallazgo
   principal, ver arriba).
3. `"oceanic.cl/xo-boats" XO Boats modelos Chile` — confirma existencia de
   la página, sin contenido detallado adicional.
4. `XO Boats "model range" DFNDR 8 DFNDR 9 DSCVR 8 DSCVR 9 EXPLR 8 EXPLR 9
   EXPLR 10 specifications length beam` — primeras dimensiones (con
   discrepancias de redondeo pies/metros).
5. `XO Boats EXPLR 44 specifications length beam engine speed price` —
   specs del flagship, motorización contradictoria entre fuentes.
6. `itboat.com XO shipyards models list DFNDR DSCVR EXPLR` — tabla de
   specs y precios de itBoat (fuente nivel 3 más consistente/estructurada).
7. `xoboats.com fleet DFNDR 8 DFNDR 9 discontinued new 2026` — sin
   evidencia de discontinuación; ambos vigentes.
8. `"XO Boats" "model-range" fleet current lineup 2026 all models list` —
   lista agregada de 9 fichas de producto vigentes.
9. `XO Boats "DFNDR A8" limited edition` — origen de la ambigüedad
   DFNDR 8 / DFNDR A8.
10. `XO Boats "DFNDR A8" history "DFNDR 8" relationship succeeded replaced`
    — no resuelve la ambigüedad; se documenta como UNCONFIRMED.
11. `XO Boats DSCVR 8 OR "EXPLR 8" exists model` — confirma que **no**
    existen modelos "DSCVR 8" ni "EXPLR 8" en la gama actual (los ejemplos
    del encargo original eran solo hipótesis a verificar).
12. `xoboats.com xo-fleet explr-10-sport explr-10-sport-plus dscvr-9 pages`
    — confirma fichas web separadas por variante dentro de EXPLR 10.
13. `XO Boats EXPLR 10 Sport vs Sport+ vs Sport+ IB difference engine
    inboard` — explica sufijos '+' (camarote de proa) e 'IB' (inboard);
    discrepancia de eslora entre itBoat y YachtBuyer para Sport+.
14. `oceanic.cl "xo-boats" DFNDR OR DSCVR OR EXPLR modelo` — sin listado
    explícito adicional.
15. `oceanic.cl usados XO DFNDR 8 2024` — confirma unidad DFNDR 8 2024 en
    `oceanic.cl/usados/`.
16. `XO DSCVR 9 engine outboard max speed passengers specifications` —
    specs DSCVR 9 (combustible 305L, deadrise 22°, CE-C).
17. `XO EXPLR 9 engine outboard max speed passengers cabin specifications`
    — specs EXPLR 9 (cabina, camarote, WC).

## Hallazgos clave por modelo

- **DFNDR 8**: vigente, lanzado en Boot Düsseldorf 2023. Discrepancia de
  eslora/manga entre itBoat (7.8m/2.3m) y un snippet agregado atribuido a
  xoboats.com (8.03m/2.37m). Ambigüedad no resuelta con "DFNDR A8"
  (¿nombre alternativo de la serie o modelo/edición distinta?). Única
  evidencia directa de Oceanic Chile: listado en `oceanic.cl/usados/`
  (unidad usada 2024), no ficha de producto nuevo.
- **DFNDR 9**: vigente, "award winning", 2x Mercury 225 V6, +45 nudos
  reportado (no confirmado por fabricante). Sin evidencia específica de
  Oceanic Chile más allá de la marca en general.
- **DSCVR 9**: vigente, con variantes **Open** y **T-Top** (mismo casco,
  fichas web separadas por el fabricante). 8.57m x 2.57m, 305L
  combustible, CE-C, +40 nudos reportado. Sin evidencia específica de
  Oceanic Chile.
- **EXPLR 9**: vigente, "cabin boat" con camarote/WC/refrigerador,
  8 pasajeros máx, 305L combustible. Sin evidencia específica de Oceanic
  Chile.
- **EXPLR 10**: vigente, modelado como un único modelo con 4 variantes
  (Sport / Sport IB / Sport+ / Sport+ IB — '+' = camarote de proa,
  'IB' = motor inboard). Discrepancias de eslora entre itBoat y YachtBuyer
  para Sport+ (8.9m vs 9.4m) y Sport+ IB (solo un valor, 8.66m). Sin
  evidencia específica de Oceanic Chile.
- **EXPLR 44**: lanzamiento reciente (~2025), buque insignia ("first
  aluminum adventure yacht"), 44ft/13.4m, 6 personas/2 camarotes.
  Motorización reportada de forma inconsistente entre 3 fuentes (3x450hp,
  2x600hp, 3x400hp V10) — discrepancia registrada sin resolver. **Único
  modelo, junto con DFNDR 8, con mención directa de Oceanic Chile**
  (newsletter "Puerto" julio 2026, nivel 2/AUTHORIZED, CONFIRMED), aunque
  la mención es editorial sobre el "mercado americano", no una ficha de
  venta en Chile.
- **Descartados por falta de evidencia**: "DSCVR 8" y "EXPLR 8" — se
  buscaron explícitamente (queries #11) y no se encontró ningún indicio de
  que existan en la gama actual de XO Boats. No se crearon archivos para
  ellos (regla de no inventar modelos).

## Conclusión sobre representación por Oceanic Chile

No se pudo confirmar con certeza alta qué modelos específicos de XO Boats
están efectivamente representados/vendidos como nuevos por Oceanic Chile.
Evidencia disponible:
- La marca XO Boats en general está confirmada como representada
  (`master-inventory.json`, ya con `confidence_level: MEDIUM`).
- Existe página de marca `oceanic.cl/xo-boats/` (nuevo hallazgo — no
  confirmado en Fase 1).
- DFNDR 8 aparece en `oceanic.cl/usados/` (usado, 2024).
- EXPLR 44 aparece mencionado en newsletters "Puerto" de Oceanic
  (mercado americano, no necesariamente Chile).
- Ningún otro modelo (DFNDR 9, DSCVR 9, EXPLR 9, EXPLR 10) tiene mención
  específica encontrada en fuentes de Oceanic.

Por esto, todos los 6 modelos se dejaron en `confidence_level: MEDIUM`
como máximo (ninguno HIGH), y `oceanic_url: null` en todos (no se pudo
atribuir una ficha de producto específica dentro de la página de marca).
Se recomienda, antes de avanzar a investigación masiva o a marcar estos
modelos `VALIDATED`, (a) fetch directo a `oceanic.cl/xo-boats/` una vez
habilitado el acceso de red, o (b) que un humano provea captura/export de
esa página.
