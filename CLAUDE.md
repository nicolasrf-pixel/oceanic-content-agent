# CLAUDE.md — Oceanic Content Agent

Este documento es la **constitución del proyecto**. Cualquier automatización,
investigación o generación de contenido dentro de este repositorio debe
respetar estas reglas. Si una tarea entra en conflicto con este documento,
el documento gana — y si la tarea requiere cambiarlo, ese cambio se propone
explícitamente, no se aplica en silencio.

---

## 1. Objetivo

Construir un sistema de investigación, normalización, estructuración y
generación de contenido para el catálogo náutico de **Oceanic**, que permita
pasar de forma sistemática (no artesanal) desde:

```
OCEANIC → REPRESENTADAS → MODELOS → VARIANTES → DATOS VERIFICADOS
        → CONTENIDO EDITORIAL → ASSETS → PÁGINA WEB
```

sin repetir manualmente el trabajo de investigación para cada embarcación.

El sistema es una **máquina de producción de catálogo**, no un generador de
páginas. Debe ser ordenado, verificable, trazable, escalable y mantenible.

**Orden de prioridad cuando hay tensión entre objetivos:**

```
CALIDAD DE DATOS > TRAZABILIDAD > COMPLETITUD > CONSISTENCIA > AUTOMATIZACIÓN > VELOCIDAD
```

Si hay que elegir entre terminar rápido y tener datos correctos, se eligen
siempre los datos correctos.

---

## 2. Alcance

### 2.1 Dentro de alcance
- Inventario y verificación de marcas representadas por Oceanic.
- Inventario de familias, modelos y variantes de cada marca representada.
- Investigación de especificaciones técnicas con trazabilidad de fuente.
- Definición de esquema maestro de producto (datos + contenido editorial).
- Generación de contenido editorial derivado de datos verificados.
- Metodología de identificación de assets visuales (sin descarga masiva
  todavía).
- Convención de URLs para la futura web (sin publicar URLs definitivas
  todavía).

### 2.2 Fuera de alcance (por ahora)
- Construcción del frontend / páginas HTML de producto **público**.
- Descarga masiva de imágenes u otros assets.
- Conexión o escritura en Google Drive.
- Automatización de publicación web.

**Excepción explícita:** `dashboard/` es una herramienta interna de
revisión (lee `data/catalog/*.json` en vivo, sin build, sin framework),
pedida y aprobada explícitamente para poder auditar el catálogo sin leer
JSON directamente. No es el sitio público de Oceanic ni un adelanto de
él — no usa la convención de URLs de la sección 8, no consume el schema
de producto de Fase 3. Ver `dashboard/README.md`.

Estas fases se activan solo cuando el inventario y los datos de la fase
anterior estén validados y aprobados.

### 2.3 Marcas incluidas (universo inicial)

1. Axopar
2. Beneteau Sail
3. Beneteau Power
4. Lagoon
5. Solaris
6. Aquila
7. XO Boats
8. Saffier
9. VX One
10. Skeeta
11. Switch

Esta lista es el **universo inicial conocido**, entregado como punto de
partida — no es una lista cerrada ni definitiva. Debe contrastarse
periódicamente contra fuentes oficiales (ver `data/brands/master-inventory.json`
y `data/changelog/brands-changelog.md`).

### 2.4 Marca excluida explícitamente

**Oceanic Power** (línea de embarcaciones semirrígidas / RIB propia de
Oceanic, ej. `oceanic.cl/oceanic-power-boats/`) **NO** es una representada.
Es una marca propia de Oceanic y por lo tanto queda **fuera del universo de
representadas** de este proyecto.

Esta exclusión es deliberada y se documenta aquí para que nunca se
reintroduzca "por accidente" al automatizar el descubrimiento de marcas:
cualquier proceso de descubrimiento que encuentre "Oceanic Power" en el
sitio de Oceanic debe reconocerlo y excluirlo automáticamente, dejando
constancia en el changelog, no fallar silenciosamente ni añadirlo como
representada.

### 2.5 Fuera de alcance también: marcas de equipamiento

Oceanic también distribuye marcas de equipamiento náutico (electrónica,
velas, jarcia, pinturas, cabos) como Lowrance, Seldén, Lewmar, North Sails,
Nautix o VELO. Estas **no son constructores de embarcaciones** y por lo
tanto no forman parte del universo de "representadas" en el sentido de este
proyecto (que es un catálogo de **modelos de embarcaciones**). Se
mencionan aquí para que no se confundan con representadas durante el
descubrimiento automático, y para dejar constancia de que la exclusión es
deliberada, no un olvido.

---

## 3. Metodología

1. **No se empieza por contenido.** Se empieza por dato verificado.
2. **No se empieza por páginas.** Se empieza por inventario.
3. Cada fase depende de que la anterior esté validada:
   `Representadas → Modelos → Investigación técnica → Contenido → Assets → Página`
4. Ninguna fase se salta ni se colapsa para ahorrar tiempo.
5. Las fases críticas (representadas→modelos, modelos→investigación masiva)
   requieren presentar un resumen verificable y, cuando corresponda,
   aprobación humana antes de continuar (ver sección 19).

---

## 4. Jerarquía de fuentes

**NIVEL 1 — Fuente primaria** (máxima confianza)
Fabricante: sitio oficial, ficha técnica oficial, catálogo oficial, manual
oficial, documentación técnica oficial.

**NIVEL 2 — Fuente autorizada**
Distribuidor oficial (Oceanic), representante oficial, documentación
entregada por el fabricante a su red de distribución.

**NIVEL 3 — Fuente secundaria**
Publicaciones náuticas, medios especializados, bases de datos de terceros
(YachtWorld, NauticExpo, etc.), otros sitios confiables.

**Reglas de uso:**
- El sitio de referencia `https://oceanicsite.netlify.app/` define
  **arquitectura, jerarquía de información y experiencia**, NO se usa como
  fuente primaria de datos técnicos.
- Las fuentes secundarias sirven para **detectar o complementar**
  información, nunca para **sustituir** una fuente primaria disponible.
- Toda fuente usada se registra con: URL, fecha de consulta, nivel (1/2/3).

---

## 5. Reglas de investigación

- Investigar navegación completa, categorías, páginas de producto,
  configuradores, catálogos, fichas técnicas, documentación oficial y
  páginas regionales relevantes — no limitarse a la página principal.
- Toda afirmación de "esta marca es representada por Oceanic" debe poder
  respaldarse con al menos una fuente (idealmente Nivel 1 o 2).
- Toda diferencia respecto al universo inicial (sección 2.3) se documenta,
  nunca se aplica en silencio (ver sección 20, changelog).

---

## 6. Reglas de validación (NO INVENTAR)

Regla crítica, sin excepciones. **Nunca se inventan**: especificaciones,
dimensiones, velocidades, capacidades, motorizaciones, precios, número de
pasajeros, camarotes, baños, autonomía, pesos, equipamiento, materiales,
prestaciones, disponibilidad ni modelos.

- Dato no disponible → `UNKNOWN`
- Dato disponible pero no suficientemente confirmado → `UNCONFIRMED`
- Dos fuentes contradictorias → se conservan **ambas**, con sus fuentes, y
  se documenta la discrepancia. Nunca se "resuelve" arbitrariamente
  eligiendo una sin evidencia adicional.

Ningún modelo se marca `READY` sin pasar el checklist de calidad
(sección 18).

---

## 7. Reglas de nomenclatura

- **Marca**: nombre comercial tal como lo usa el fabricante (ej. `Axopar`).
  Cuando el fabricante separa líneas (ej. Beneteau vela / motor), se tratan
  como entradas de marca distintas: `Beneteau Sail`, `Beneteau Power`.
- **Familia**: línea/serie dentro de una marca (ej. `Axopar 37`).
- **Modelo**: producto específico dentro de una familia (ej. `Axopar 37 XC`).
- **Variante/configuración**: una configuración de motor, layout o
  equipamiento dentro de un modelo. Una variante **no** se convierte en
  modelo independiente salvo que el propio fabricante la trate
  explícitamente como un modelo distinto (con nombre y ficha propia).
- Identificadores internos (`brand_id`, `model_id`) se normalizan en
  minúsculas, sin acentos, con guiones (`kebab-case`), ver `data/schema/`.

---

## 8. Reglas de URLs

Convención conceptual para la futura web (no se generan URLs definitivas
todavía, ver sección 21 del encargo original):

```
/marcas/{marca}/{modelo}/
```

Normalización:
- minúsculas;
- espacios → guiones;
- sin tildes ni caracteres especiales;
- números se mantienen (`axopar-37-xc`);
- variantes NO generan una URL propia salvo que el fabricante las trate
  como modelo independiente (ver sección 7).

La convención completa de slugs (incluyendo casos límite: nombres con
símbolos, series numeradas, ediciones limitadas) se termina de definir
antes de la Fase de publicación web, no antes.

---

## 9. Estructura de datos

Ver esquemas formales en `data/schema/*.schema.json`. Resumen conceptual:

- **Brand** (representada): identidad de marca + estado dentro del
  portfolio de Oceanic. Ver sección 10.
- **Model** (Fase 2, aún no poblado): marca, familia, modelo, variante,
  categoría, estado, año/model year, URLs, fuente primaria, fechas,
  notas, nivel de confianza. Ver sección 11.
- **Source**: unidad reutilizable de trazabilidad (dato → fuente → URL →
  fecha → nivel → estado de validación), embebida donde se necesite.
- **Product master schema** (Fase 3, aún no construido en detalle):
  Identidad, Editorial, Especificaciones, Configuración, Contenido visual,
  Conversión — con separación estricta entre **datos** (objetivos,
  verificables) y **contenido editorial** (texto derivado de esos datos).
  Nunca se mezclan ambas capas en el mismo campo.

---

## 10. Datos mínimos por representada (Brand)

- nombre oficial
- nombre comercial
- categoría (ej. motor / vela / catamarán motor / catamarán vela / dinghy)
- URL oficial en el sitio de Oceanic
- URL oficial del fabricante
- país de origen
- tipo de embarcaciones
- descripción de la marca
- estado dentro del portfolio Oceanic (`ACTIVE`, `NEW`, `DISCONTINUED`,
  `UNCONFIRMED`)
- fuente(s), con nivel y URL
- fecha de verificación

## 11. Datos mínimos por modelo (Fase 2 — futuro)

marca, familia, modelo, variante, categoría, estado, año/model year, URL
oficial del fabricante, URL de Oceanic (si existe), fuente primaria, fecha
de verificación, última actualización, notas, nivel de confianza.

Estados de modelo: `CURRENT`, `NEW`, `DISCONTINUED`, `ANNOUNCED`,
`UNCONFIRMED`. Un modelo **nunca se elimina** del histórico solo porque
dejó de aparecer en el sitio actual; se conserva separado del inventario
vigente.

---

## 12. Reglas editoriales

- El contenido editorial (introducción, descripción comercial, propuesta
  de valor, experiencia de navegación) se **deriva** de datos verificados;
  no puede afirmar algo que el dato no respalda.
- El contenido editorial vive en una capa separada de los datos técnicos
  (ver sección 9 y sección 15 del encargo original). Nunca en el mismo
  campo ni archivo que los datos objetivos.
- Ningún texto editorial puede presentar como confirmado algo marcado
  `UNKNOWN` o `UNCONFIRMED` en la capa de datos.

---

## 13. Tratamiento de información faltante

- Campo sin dato disponible → valor literal `"UNKNOWN"`.
- Campo con indicio pero sin confirmación suficiente → valor literal
  `"UNCONFIRMED"`, con nota de qué se encontró y dónde.
- Nunca se deja un campo vacío sin explicación cuando es un campo
  obligatorio del esquema: se usa `UNKNOWN`/`UNCONFIRMED` explícitamente.

---

## 14. Tratamiento de contradicciones

Cuando dos fuentes entregan datos distintos para el mismo campo:
1. Se conservan ambos valores, cada uno con su fuente.
2. Se prioriza la fuente de mayor nivel (Nivel 1 > 2 > 3) **solo como
   señal**, no como borrado automático del otro valor.
3. Se registra la contradicción explícitamente (campo `discrepancies` en
   el esquema, o entrada en el changelog si afecta a nivel de marca).
4. No se "oculta" ni se promedia. No se elige en silencio.

---

## 15. Tratamiento de modelos discontinuados

- Un modelo que ya no se vende activamente pasa a estado `DISCONTINUED`,
  no se borra.
- Se conserva en un inventario histórico separado del inventario vigente
  (`CURRENT`/`NEW`/`ANNOUNCED`), de forma que ambos sean consultables sin
  mezclarse.

## 16. Tratamiento de variantes

- Las variantes (motorización, layout, paquete de equipamiento) se anidan
  bajo su modelo, nunca se promueven a modelo independiente salvo
  tratamiento explícito del fabricante como producto propio (sección 7).
- Cuando exista duda razonable sobre si algo es modelo o variante, se deja
  como `UNCONFIRMED` a nivel de clasificación y se documenta el criterio
  usado, en vez de decidir arbitrariamente.

---

## 17. Workflow (estados de progreso)

```
DISCOVERED → MAPPED → VALIDATED → RESEARCHED → CONTENT_READY
           → ASSETS_READY → PAGE_READY → PUBLISHED
```

Cada marca y cada modelo avanza por estos estados de forma explícita
(campo `status_pipeline` o equivalente en el registro correspondiente).
Ningún registro salta un estado.

---

## 18. Criterios de calidad (checklist antes de `READY`)

Antes de marcar un modelo (o una marca) como validado/listo, se verifica:
- identidad correcta (marca/familia/modelo bien atribuidos);
- URL(s) correctas y accesibles;
- especificaciones completas o explícitamente marcadas `UNKNOWN`/`UNCONFIRMED`;
- fuentes registradas con nivel y fecha;
- contradicciones resueltas o documentadas (nunca ignoradas);
- campos obligatorios del esquema completos (aunque sea con `UNKNOWN`);
- contenido editorial (cuando exista) separado de los datos;
- assets visuales identificados (cuando exista esa fase);
- separación clara entre información confirmada y no confirmada.

---

## 19. Restricciones

- No se avanza automáticamente de **Representadas → Modelos** ni de
  **Modelos → investigación masiva** sin presentar antes un resumen
  verificable de lo encontrado.
- No se descargan imágenes ni assets de forma masiva sin definir antes la
  metodología.
- No se conecta ni se escribe en Google Drive sin instrucción explícita
  posterior.
- No se construye frontend ni páginas HTML en esta fase.
- No se generan URLs definitivas de producto antes de cerrar la
  convención completa.
- No se inventa dato alguno (sección 6).

---

## 20. Changelog de representadas

Cualquier diferencia detectada entre el universo inicial (sección 2.3) y lo
verificado en fuentes oficiales se registra en
`data/changelog/brands-changelog.md` con: marca, situación detectada,
fuente, fecha, acción recomendada. **Nunca se modifica la lista inicial
en silencio.** La lista inicial se conserva como referencia histórica; el
inventario validado (`data/brands/master-inventory.json`) es un estado
separado y versionado.

---

## 21. Tareas que requieren aprobación humana

- Agregar o quitar una marca del universo de representadas.
- Promover el inventario de modelos de `MAPPED` a `VALIDATED` a escala
  (antes de investigación técnica masiva).
- Reclasificar un modelo como discontinuado si la única evidencia es
  "ya no aparece en el sitio".
- Resolver una contradicción entre fuentes de igual nivel cuando afecta a
  un dato mostrado públicamente.
- Cualquier decisión que cambie la arquitectura de datos o de carpetas ya
  aprobada.
- Conexión con Google Drive u otro destino de exportación.
- Inicio de la fase de construcción de frontend/página web.

---

## 22. Limitación de acceso a red conocida (2026-09-10)

En el entorno de ejecución usado para esta primera fase, el acceso directo
(`WebFetch`/`curl`) a `oceanicsite.netlify.app` y a `oceanic.cl` estuvo
bloqueado por la política de red del entorno (egress proxy, "organization
policy"). La verificación de representadas en esta primera pasada se hizo
con **búsqueda web (snippets indexados)**, no con lectura directa de la
navegación del sitio. Esto es una limitación real, no una fuente de verdad
completa: se documenta explícitamente en
`research/verification-log/2026-09-10-brands-verification.md` y los
niveles de confianza del inventario reflejan esta limitación. Antes de
avanzar a investigación masiva de modelos (Fase 2), se recomienda:
(a) habilitar acceso de red a los dominios oficiales necesarios, o
(b) que un humano provea capturas/exports de las páginas relevantes.
