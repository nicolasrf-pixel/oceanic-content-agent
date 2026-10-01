# Log de investigación de modelos — Solaris (Solaris Yachts) — 2026-09-10

## Limitación de acceso a red (confirmación puntual)

Se probó `WebFetch` una vez contra `https://www.solarisyachts.com/` al inicio de
esta tarea: falló con `EGRESS_BLOCKED` ("Access to www.solarisyachts.com is
blocked by the network egress proxy"), consistente con la limitación ya
documentada en `CLAUDE.md` sección 22 y en
`research/verification-log/2026-09-10-brands-verification.md`. No se
reintentó `WebFetch`; toda la investigación de modelos se hizo con
`WebSearch` (snippets indexados). Por esta razón **ninguna fuente de esta
pasada es `direct_fetch`**, y ningún modelo puede alcanzar `confidence_level
HIGH` (máximo alcanzable: `MEDIUM`).

## Queries realizadas (resumen, ~20 búsquedas)

1. `Solaris Yachts model range 2026 site:solarisyachts.com`
2. `Solaris Yachts current models 40 44 47 50 55 58 64 72`
3. `site:oceanic.cl solaris-yachts modelos`
4. `"Solaris Power" yacht motor range models`
5. `"Solaris 44" Pilot yacht specifications`
6. `Solaris Yachts "Pilot" OR "Pilot Classic" reinvention 2026`
7. `"Solaris Power" "Solaris Yachts" different company same shipyard Cantiere del Pardo`
8. `oceanic.cl solaris 72 "Pilot Classic" reinventa`
9. `site:oceanic.cl "Solaris Power"`
10. `Solaris 47 55 60 64 80 111 specifications LOA beam draft displacement cabins`
11. `"Solaris 44" new 2025 reinterpretation LOA beam draft specifications Cannes`
12. `"Solaris 50" LOA 15.50 beam 4.78 specifications cabins draft displacement`
13. `Solaris 72 oceanic.cl "21,60" OR "21.60" OR "70 pies" pilot classic Javier Soto Acebal`
14. `"Solaris 47" 2026 current production discontinued sailboatdata`
15. `"Solaris 42" sailboat model history sailboatdata`
16. `"Solaris 72 Classic" vs "72 Pilot Classic" different models production years`
17. `Solaris 55 60 64 RS cabins bathrooms water tank fuel tank capacity specifications`
18. `"new Solaris 44" 2026 cabins layout interior three cabins owner`
19. `sailboatdata Solaris 37 LOA beam draft displacement year`
20. `sailboatdata "Solaris 42" OR "Solaris One 42" LOA beam draft displacement`
21. `Solaris 60 sailboatdata displacement cabins draft options`
22. `site:solarisyachts.com/en/yachts`
23. `"Solaris Custom" yachts line 72 80 111 custom division`
24. `Solaris Yachts "72C" OR "72 C" custom model specifications`
25. `Solaris Yachts "40 ST" vs "Solaris 40" difference model`
26. `Solaris 37 discontinued production years sailboatdata`
27. `Solaris Yachts "74 RS" launch new model 2025 2026`

## Hallazgos clave

### Gama vigente detectada en solarisyachts.com/en/yachts/ (2026)
Solaris 40, 44, 47, 50, 55, 60, 64 (RS), 72c, 74-rs, 80, 111 aparecen como
rutas indexadas bajo `/en/yachts/`. Solaris exhibió específicamente 50, 55,
60 y 64 RS en el Cannes Yachting Festival 2026. El 74 RS es la incorporación
más reciente (presentado en Cannes 2025).

### Solaris Power — verificado como fuera de alcance
`solarispower.com` (motor yachts, gama 40-70 pies, línea Open/Coupé/
Flybridge/Long Range/Grand Coupé) parece ser la división de yates a motor
del mismo astillero/marca Solaris (fuentes secundarias contradictorias sobre
si comparte instalación en Aquileia o es "Cantiere Serigi"). **No se
encontró ninguna mención de "Solaris Power" en oceanic.cl** (búsqueda
`site:oceanic.cl "Solaris Power"` solo devolvió la página general de
"Solaris Yachts", no resultados de Solaris Power). Además, el `category` de
la marca en `master-inventory.json` es `"sail"`, y la página de Oceanic es
`oceanic.cl/solaris-yachts/` (no `solaris-power`). **Conclusión: no se creó
ningún archivo de modelo para Solaris Power** — está fuera del universo de
esta tarea (motor, no vela; sin evidencia de representación por Oceanic
Chile). Se deja constancia aquí en vez de omitirlo en silencio.

### "Pilot" / "Pilot Classic" — aclarado, no es una línea separada
La instrucción de la tarea mencionaba una línea "Pilot"/"Pilot Classic"
detectada en investigación previa. Se confirmó que esta frase describe el
**estilo de diseño** del **Solaris 72 Classic** ("Solaris reinventa una
versión moderna del Pilot Classic"), inspirado en los veleros clásicos tipo
pilot-cutter — **no** es el nombre de una línea de producto independiente
"Solaris Pilot". No se creó ningún modelo "Pilot" separado. Se documentó
esto explícitamente dentro de `data/models/solaris/solaris-72-classic.json`
(campo `discrepancies`) para que no se reintroduzca por error, de forma
análoga al tratamiento de "Oceanic Power" en `CLAUDE.md` sección 2.4.

### Ambigüedad "Solaris 72"
Se detectaron al menos tres productos distintos asociados al número 72:
`Solaris 72 Classic` (diseño Javier Soto Acebal, 2013, hoy bajo
`/en/brokerage/` en el sitio oficial — posible indicio de discontinuación de
construcción nueva), `Solaris 72 DH` (diseño Doug Peterson, maxi con
caseta, distinto) y una página `solarisyachts.com/en/yachts/72c` (programa
"custom" 72C, posiblemente vigente). La página de Oceanic Chile
(`oceanic.cl/vela/solaris-72/`) describe contenido que coincide con el
`72 Classic`. Se modeló únicamente `solaris-72-classic` (el que coincide con
la página de Oceanic), con `lifecycle_status: UNCONFIRMED` por la
contradicción entre la página activa de Oceanic y la ruta `/brokerage/` del
fabricante. `72 DH` y `72c` quedan **pendientes**, no modelados, por falta
de datos suficientes — no se inventó contenido para ellos.

### Generaciones duplicadas bajo el mismo nombre de modelo
Se detectaron discrepancias de "dos generaciones bajo el mismo nombre" para
`Solaris 44` (generación 2013-2016 vs. relanzamiento/reinterpretación
2025-2026, LOA 13.46 m vs 13.35 m) y variación de ficha por año para
`Solaris 50` (ficha 2021: LOA 15.40 m / beam 4.55 m vs. ficha 2023 "Smash":
LOA 15.50 m / beam 4.78 m). Ambas quedan documentadas en el campo
`discrepancies` de sus respectivos JSON, sin resolver arbitrariamente cuál
cifra es la "correcta".

### Representación específica por Oceanic Chile
Solo se confirmó una página de **producto individual** en oceanic.cl:
`oceanic.cl/vela/solaris-72/` (→ `solaris-72-classic.json`). También se
encontró un PDF de ficha técnica del **Solaris 47** alojado en el propio
dominio `oceanic.cl` desde 2017 (`SOLARIS_47_EN_SS_0817.pdf`), evidencia de
representación histórica pero no de vigencia actual en 2026. Para el resto
de los modelos (40, 44, 50, 55, 60, 64 RS, 74 RS, 80 RS, 111 RS, y los
históricos 37/42), **no se confirmó** una página de producto propia en
oceanic.cl — solo la página general de marca `oceanic.cl/solaris-yachts/`.
Por lo tanto `oceanic_url` queda `null`/no confirmado en esos 10 archivos, y
se recomienda tratar la lista de modelos efectivamente comercializados por
Oceanic Chile como **no cerrada** hasta obtener acceso directo al sitio o
capturas manuales, tal como ya advertía `CLAUDE.md` sección 22.

### Modelos discontinuados/históricos incluidos
`Solaris 37` (discontinuado, fechas de producción con discrepancia menor
2010 vs 2013 entre fuentes secundarias) y `Solaris 42` / "Solaris One 42"
(activo aparentemente en el circuito de regata Solaris Cup pero sin
evidencia de producción vigente ni de discontinuación explícita →
`UNCONFIRMED`). Ninguno de los dos aparece mencionado en oceanic.cl.

## Resultado

13 archivos de modelo creados en `data/models/solaris/`, todos validados
contra `data/schema/model.schema.json` (incluyendo resolución de
`$ref` a `source.schema.json`) con `python3 -c "import json; json.load(...)"`
y adicionalmente con la librería `jsonschema` (0 errores en los 13
archivos). `status_pipeline: "MAPPED"` en todos. Ninguno se promovió a
`VALIDATED` — eso requiere aprobación humana según `CLAUDE.md` sección 21.
