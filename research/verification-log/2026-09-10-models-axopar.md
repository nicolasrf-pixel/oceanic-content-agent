# Log de verificación de modelos — Axopar — 2026-09-10

## Limitación de acceso registrada (confirmada de nuevo en esta pasada)

Se probó `WebFetch` una vez contra `https://www.axopar.com/models/` (URL de
prueba distinta a la definitiva `boat-models/`, usada solo para confirmar la
política de red). Falló con:

```
EGRESS_BLOCKED — Access to www.axopar.com is blocked by the network egress
proxy.
```

Consistente con la limitación ya documentada en
`research/verification-log/2026-09-10-brands-verification.md` (CLAUDE.md
sección 22). No se reintentó `WebFetch` contra ningún otro dominio; toda la
investigación de esta pasada usó exclusivamente `WebSearch` (snippets
indexados), sin lectura directa de ninguna página de axopar.com ni de
oceanic.cl. Por esta razón ningún modelo alcanza `confidence_level: HIGH`.

## Búsquedas realizadas (orden cronológico)

1. `Axopar boats model range 2026 all models list`
2. `axopar.com models 22 25 28 37 e-power`
3. `site:oceanic.cl axopar`
4. `"axopar.com/boat-models" full range 22 25 29 37 45`
5. `Axopar 37 "Sun-Top" OR "Cross Cabin" OR "T-Top" OR "Spyder" models`
6. `Axopar 29 T-Top Sun-Top Cabin specifications length beam`
7. `Axopar 25 Cabin model variants specifications`
8. `Axopar 45 Cross Top Sun Top Cabin variants specifications`
9. `"Axopar 28" Cabin discontinued replaced by 29`
10. `Axopar 38 range new models 2026 "Sun Top" "Cross Cabin" third fourth model`
11. `axopar.com boat-models axopar-45 current lineup Cross Top Sun Top XC Cross Cabin`
12. `Axopar 22 Spyder T-Top specifications length beam weight`
13. `site:oceanic.cl "Axopar 37" OR "Axopar 22" OR "Axopar 25" OR "Axopar 29" OR "Axopar 45"`
14. `Axopar 37 Sun Top XC Spyder specifications length beam draft weight fuel`
15. `"Axopar 29 CCX" center console specifications`
16. `"Axopar 45" "Spyder" OR "T-Top" legacy discontinued older range`
17. `Axopar 38 XC Cross Cabin specifications length beam weight engine`
18. `AX/E 22 AX/E 25 electric specifications battery range price`

## Hallazgos clave

### Estructura del rango vigente del fabricante (axopar.com)

El índice `axopar.com/boat-models/` (visto vía snippet, no fetch directo)
describe el rango actual como "Full Range from 22 to 45 ft", compuesto por
las familias: **Axopar 22, Axopar 25, Axopar 29, Axopar 37, Axopar 38
(nuevo, 2026), Axopar 45**, más la sub-marca 100% eléctrica **AX/E** (AX/E 22,
AX/E 25). No se detectó una familia "Axopar 28" en el índice vigente — ver
discrepancia abajo.

### Familias y modelos identificados

- **Axopar 22**: Spyder, T-Top.
- **Axopar 25**: Cross Bow, Cross Top (ambos con cabina cuddy, WC y lavamanos
  de serie).
- **Axopar 28** (legacy): "Axopar 28 Cabin" — no aparece en el índice vigente
  del fabricante; sí aparece en `oceanic.cl/usados/axopar-28/` (sección de
  usados). Tratado como `DISCONTINUED`.
- **Axopar 29**: Spyder, Sun Top, XC Cross Cabin (los tres confirmados por
  press release del fabricante como "the all-new Axopar 29 range"), más CCX
  (center console, "Axopar's first venture into the center console market",
  con versión "fishing").
- **Axopar 37**: Spyder, Sun-Top, XC Cross Cabin — comparten casco pero
  difieren en peso/equipamiento según fuentes de terceros. Mencionado
  explícitamente en oceanic.cl (marca + boletín de entrega en Viña del Mar),
  aunque sin especificar variante.
- **Axopar 38** (rango NUEVO 2026): XC Cross Cabin (debut BOOT Düsseldorf
  enero 2026, "Motoryacht of the year" en Singapur mayo 2026), Sun Top
  (lanzamiento a mercado mayo 2026), Cross Top (reportado para septiembre
  2026 por prensa de terceros — fecha coincide con hoy, no se pudo verificar
  si ya se lanzó), y un cuarto modelo **CCX** mencionado solo por una fuente
  de terceros para fines de 2026/2027 (muy baja confianza). XC Cross Cabin y
  Sun Top están confirmados explícitamente por nombre en oceanic.cl.
- **Axopar 45**: XC Cross Cabin, Sun Top, Cross Top (rango vigente según
  press release oficial "the new Axopar 45 range").
- **AX/E** (sub-marca eléctrica, motor Evoy): AX/E 22, AX/E 25.

### Discrepancias detectadas

1. **Axopar 45 "Spyder"/"T-Top"**: una única fuente de agregador
   (`itboat.com`, Nivel 3, snippet aislado) listó estas dos configuraciones
   como parte del rango 45. Las fuentes directas del fabricante
   (`axopar.com/pressroom/the-new-axopar-45-range`,
   `axopar.com/boat-models/axopar-45/`) describen el rango 45 vigente como
   compuesto únicamente por XC Cross Cabin, Sun Top y Cross Top. No se creó
   un archivo de modelo propio para "45 Spyder"/"45 T-Top" por evidencia
   insuficiente (una sola fuente Nivel 3, contradicha por fuente Nivel 1);
   se documentó la discrepancia en las notas de los tres modelos 45 en vez
   de descartarla en silencio o de inventar un modelo. Pendiente de
   resolución en Fase 2 (CLAUDE.md sección 14).
2. **Axopar 37 "XC Revolution"**: un agregador (`boattest.com`) nombra una
   versión anterior como "37 XC Revolution". Posible nomenclatura histórica
   del mismo modelo 37 XC Cross Cabin, no confirmada como nombre vigente.
   Registrada como nota en `axopar-37-xc-cross-cabin.json`, no como
   discrepancia formal (una sola fuente Nivel 3 débil).
3. **Ambigüedad de variante vendida por Oceanic**: oceanic.cl confirma
   representación de las familias "Axopar 22", "Axopar 37" y "Axopar 38"
   (esta última con nombre de variante explícito: Cross Cabin, Sun Top),
   pero las menciones de 22 y 37 son genéricas (no dicen cuál configuración
   específica). Esto se documentó explícitamente en cada archivo de modelo
   afectado en vez de asumir cuál variante concreta importa Oceanic.

### Modelos sin ninguna evidencia de venta específica por Oceanic

Axopar 25 (ambos modelos), Axopar 29 (los cuatro modelos), Axopar 45 (los
tres modelos) y AX/E (ambos modelos), más Axopar 38 Cross Top y Axopar 38
CCX: existen y están confirmados en el catálogo global del fabricante, pero
no se encontró en esta pasada ninguna mención específica de que Oceanic
Chile los importe, exhiba o venda. Se documentó explícitamente en cada
archivo (`notes`) y se usó `confidence_level: LOW` en vez de asumir
representación completa del catálogo global solo porque la marca "Axopar"
está representada.

### Modelo descontinuado

**Axopar 28 Cabin**: no aparece en el índice vigente del fabricante; en
oceanic.cl solo aparece bajo `/usados/` (sección de usados/segunda mano),
nunca en catálogo de modelos nuevos. Doble señal (ausencia en catálogo
global vigente + presencia solo como usado en el distribuidor) usada para
clasificarlo `DISCONTINUED`, no solo "ya no aparece en el sitio" (evitando
así el caso que CLAUDE.md sección 21 exige aprobación humana para
reclasificar con esa única evidencia — aquí hay evidencia adicional
independiente del fabricante).

## Limitaciones que quedan pendientes para Fase 2

- Ninguna especificación alcanza `verification_state: CONFIRMED` de Nivel 1
  con `retrieval_method: direct_fetch` — todo quedó en `web_search_snippet`.
  Se recomienda habilitar acceso de red a `axopar.com` y `oceanic.cl`, o
  recibir capturas/exports manuales, antes de promover estos registros a
  `VALIDATED`/`RESEARCHED` (CLAUDE.md sección 21).
- No se investigaron a fondo: motorización/potencia exacta de casi toda la
  familia 29 (excepto CCX y Sun Top parcialmente), camarotes/baños en casi
  ningún modelo, velocidad crucero en casi ningún modelo, capacidad de agua
  dulce en ningún modelo, model year exacto de la mayoría de los modelos
  "evergreen" (22, 25, 29, 37, 45).
- No se confirmó si Axopar 38 Cross Top ya se lanzó (fecha reportada de
  terceros: septiembre 2026, coincide con la fecha de esta investigación).
- Pendiente contrastar el listado completo contra una lectura directa de
  `oceanic.cl/axopar-boats/` quando haya acceso de red, para saber con
  certeza qué modelos concretos exhibe/vende Oceanic (más allá de 37 y 38).
