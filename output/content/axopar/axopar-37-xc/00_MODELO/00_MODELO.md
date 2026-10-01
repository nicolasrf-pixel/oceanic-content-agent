# Axopar 37 XC Cross Cabin — Paquete de contenido (piloto Content Collector)

**Marca:** Axopar · **Modelo:** Axopar 37 XC Cross Cabin
**model_id en catálogo:** `axopar-37-xc-cross-cabin` (`data/models/axopar/axopar-37-xc-cross-cabin.json`)
**Generado:** 2026-09-22 · **Tipo de corrida:** Piloto de un solo modelo, no escalado a otros

> **Nota de mapeo:** el usuario pidió "AXOPAR 37 XC / AXOPAR 37 XC CROSS CABIN". El catálogo existente tiene tres modelos bajo la familia "Axopar 37": `axopar-37-xc-cross-cabin.json`, `axopar-37-spyder.json`, `axopar-37-sun-top.json`. No existe un archivo "axopar-37-xc.json" genérico — se interpretó que "37 XC" es el nombre corto de "37 XC Cross Cabin" (única variante con "XC" en el nombre) y se usó ese registro. Esta es una decisión editorial mía, no una confirmación de fuente — queda documentada aquí para que puedas corregirla si el modelo de referencia real era otro.

---

## CONTENT_STATUS: 🟡 YELLOW

**CONTENT_COMPLETENESS: ~64% (aproximado)**

Metodología del porcentaje: 10 bloques de contenido pedidos (HERO, Introducción, Diseño, Ingeniería, Experiencia a bordo, Performance, Equipamiento, Especificaciones, Configuraciones, Multimedia/Documentos), cada uno puntuado 0–1 según cobertura real obtenida, promediado. Detalle en la sección "Completitud por bloque" abajo. **Este porcentaje NO oculta lo siguiente, que es crítico y no debe perderse por leer solo el número:**

- **0 imágenes descargadas** (0 de 2 páginas de galería identificadas se pudieron descargar).
- **0 PDFs descargados** (0 de 3 manuales oficiales identificados).
- **0 datos verificados por lectura directa de página** — el 100% de este paquete viene de snippets de `WebSearch`, no de `WebFetch`/fetch directo, porque el acceso directo a `axopar.com` está bloqueado en este entorno por política de red (confirmado con 3 pruebas independientes, ver abajo).
- **3 conflictos sin resolver** entre valores encontrados (eslora, velocidad máxima, rango de HP) — ninguno se resolvió arbitrariamente, ambos valores se conservan en cada caso.
- **Configurador y brochure oficial no confirmados/encontrados** — dos de las 8 categorías de fuente pedidas quedaron vacías o sin verificar.

**Por qué YELLOW y no GREEN:** hay contenido sustantivo y con fuente para la mayoría de los bloques pedidos, pero con conflictos documentados y categorías vacías — coincide con la definición "contenido suficiente pero existen conflictos o faltantes".

**Por qué no RED, y la lectura alternativa que debes conocer:** el criterio RED es "fuentes insuficientes o acceso imposible". Se encontraron 18 fuentes oficiales y se extrajo contenido real y específico del modelo (no genérico) de varias de ellas — no son "fuentes insuficientes" en cantidad. Pero **el acceso directo sí fue imposible** (ver prueba abajo), que es literalmente parte de esa misma definición. Aplico la lectura de "cantidad y calidad de contenido obtenido" para decidir YELLOW en vez de RED, pero si tu barra para RED es "cualquier grado de acceso directo bloqueado", este resultado debería leerse como RED. No lo decido por ti — lo dejo explícito.

---

## Limitación de acceso (aplica a todo el paquete)

| Prueba | Resultado |
|---|---|
| WebFetch → `axopar.com/range/axopar-37-xc-cross-cabin/` | `EGRESS_BLOCKED` |
| curl (Bash) → `axopar.com` | `403 connect_rejected`, política de organización |
| WebFetch → `en.wikipedia.org` (control, dominio no relacionado) | `EGRESS_BLOCKED` — confirma que es una política general del entorno |

Detalle completo en `07_FUENTES/source-map.md`.

---

## Resumen del modelo

El Axopar 37 XC Cross Cabin es un "adventure cruiser" de 11.50–11.51 m (ver conflicto de eslora abajo), premiado "Boat of the Year 2021" en Japón, que combina un walkaround de consola central con una cabina totalmente cerrada y convertible (techo de lona corredera + 2 puertas correderas grandes). Motorización fuera de borda a gasolina (2x300 a 2x400 hp) o diésel opcional (2x Cox CXO 300hp). Cubierta de popa configurable con 5 opciones de equipamiento con precio oficial confirmado.

## Qué tenemos (por bloque)

| Bloque | Archivo(s) | Cobertura |
|---|---|---|
| HERO | `01_CONTENIDO/descripcion.md` | Descripción corta con 2 citas oficiales casi idénticas; sin imagen hero real (solo referencia) |
| Introducción | `01_CONTENIDO/concepto.md`, `posicionamiento.md`, `caracteristicas.md` | Concepto y posicionamiento con fuente; premio 2021 confirmado; sin "escenarios de uso" explícitos |
| Diseño | `01_CONTENIDO/diseno.md` | Interior/helm muy detallado; exterior/arquitectura/ergonomía solo parcial |
| Ingeniería | `01_CONTENIDO/ingenieria.md` | Casco y motorización con fuente; construcción con confianza mixta; "tecnología" general no encontrada |
| Experiencia a bordo | `01_CONTENIDO/experiencia-a-bordo.md` | Cockpit, cabina, camarotes, almacenamiento cubiertos; baños con confianza baja |
| Performance | `01_CONTENIDO/performance.md`, `02_ESPECIFICACIONES/` | Velocidad máx. y motorización con fuente (con conflictos); velocidad de crucero general UNKNOWN |
| Equipamiento | `04_EQUIPAMIENTO/` | Opcional muy completo (5 ítems con precio oficial); estándar parcial; **paquetes: nada encontrado** |
| Especificaciones | `02_ESPECIFICACIONES/specifications.json` + `.md` | 17 campos registrados, 3 conflictos, varios campos nuevos vs. catálogo existente |
| Configuraciones | Repartido en especificaciones + equipamiento | Motor diésel opcional, opciones de aft deck, layout de baño configurable |
| Multimedia | `05_MULTIMEDIA/` | Metadata de galería e videos registrada; **0 imágenes y 0 videos descargados** |
| Documentos | `06_DOCUMENTOS/` | 3 manuales oficiales + 1 ficha técnica-web identificados; **0 descargados**; 0 brochures encontrados en dominio oficial |
| Fuentes | `07_FUENTES/` | 18 fuentes oficiales mapeadas, 5 encontradas con contenido extraído, ~23 dominios de terceros vistos y excluidos deliberadamente |

## Conflictos activos (ver detalle en specifications.json)

1. **CONFLICT-001** — Eslora: 11.51 m (catálogo previo) vs. 11.50 m (este piloto). Probable diferencia de redondeo, no resuelto.
2. **CONFLICT-002** — Velocidad máxima: 38-48 nudos (rango general, mejor fuente) vs. hasta 56 nudos (motorización tope, fuente menos confiable). No resuelto.
3. **CONFLICT-003** — Rango de HP: 2x300-2x400hp (doblemente corroborado) vs. 2x225-2x350hp (fuente menos confiable). No resuelto.

## Qué falta (no inventado, declarado explícitamente)

- Velocidad de crucero general (nudos) — `UNKNOWN`.
- Consumo/autonomía con motor diésel Cox — `UNKNOWN`.
- Paquetes de equipamiento con nombre propio — no encontrados, posiblemente no existen.
- URL exacta del configurador para este modelo — no confirmada.
- Brochure PDF en dominio oficial — no encontrado.
- Imágenes y PDFs reales — 0 descargados (bloqueo de red, no ausencia de fuente).
- Escenarios de uso explícitos (para qué tipo de navegación/cliente se posiciona) — no encontrado como declaración oficial directa.

## Decisiones editoriales mías, no de fuente (para tu revisión)

1. Interpreté "Axopar 37 XC" como el modelo `axopar-37-xc-cross-cabin` (ver nota de mapeo arriba) — no hay otro candidato con "XC" en el nombre dentro de la familia 37, pero no es una confirmación de fuente.
2. Clasifiqué contenido de `axopar.com/pricelist/AXO9003774` como fuente `specifications` (no `product-page`) porque su función es ficha de precio+specs, aunque también podría leerse como una variante de product-page.
3. Excluí `jeffbrownyachts.com` y otros dominios de distribuidor incluso donde su contenido parecía casi idéntico al oficial, por instrucción explícita — esto significa que datos que probablemente son correctos (ej. la tabla de specs de esa PDF) no están en este paquete.
