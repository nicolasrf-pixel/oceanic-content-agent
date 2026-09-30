# Requisito crítico: contenido completo por barco

> Especificación definida por Oceanic. Es la fuente de las reglas de `CLAUDE.md` y del motor en `tools/oceanic/`.

Una vez identificado el catálogo de modelos, el Content Engine debe construir para cada embarcación un paquete
completo de contenido listo para alimentar una página Oceanic.

Página de referencia: https://oceanicsite.netlify.app/marcas/axopar/axopar-37-xc/

No copiar su contenido. Usar su estructura como referencia para determinar qué información recopilar.

## 1. Tabla de características (obligatoria)

Estructura de ejemplo (los valores son SOLO un ejemplo de estructura, no corresponden a ningún barco y nunca se
reutilizan):

| CARACTERÍSTICAS | |
| --- | --- |
| Eslora Total | 14,44 M |
| Manga Casco | 5,46 m |
| Desplazamiento en rosca | 23.300 KG |
| Camarotes | 2 |
| Capacidad Combustible | 2.334 L |
| Capacidad Agua Dulce | 440 L |
| Certificación | B12 / C22 / D32 |
| Potencia motor máx | 2 x 600 hp |

Para cada modelo la tabla contiene EXCLUSIVAMENTE los datos de ese barco y de su versión/model year cuando
corresponda.

## 2. Exactitud de la tabla

Elemento CRÍTICO. Cada valor debe estar respaldado por una fuente oficial. Por campo se guarda: campo Oceanic,
nombre original del fabricante, valor original, valor normalizado, unidad original, unidad normalizada, fuente, URL,
fecha de acceso, model year si corresponde y estado de verificación.

Ejemplo: FIELD Capacidad Combustible · SOURCE FIELD Fuel capacity · SOURCE VALUE 722 L · NORMALIZED VALUE 722 L ·
SOURCE Axopar official product page · STATUS VERIFIED.

### Decisión de Oceanic: tabla base siempre completa

El dato de la tabla base siempre está en la web oficial del producto (o su versión en inglés). No siempre es literal:
hay que cruzar secciones de la página y documentar el cruce. Ver `CLAUDE.md`, regla 2.

### Decisión de Oceanic: fuente de datos

Para los datos se usa **solo lo declarado en la web oficial del fabricante**. Manuales, fichas PDF y brochures
oficiales se guardan como documentos, pero no alimentan la tabla técnica ni los textos. Si la propia web se
contradice, **prevalece lo publicado en la ficha técnica** (bloque de especificaciones técnicas); las demás menciones
se anotan pero no se publican. Ejemplo Axopar 37 XC: se publica "Fuel capacity 722 l (191 gal)" y "Outboard engines
2 x 300 – 2 x 400 hp", tal como aparecen en la ficha.

## 3. No completar por inferencia

Si un dato no está disponible: **NO ENCONTRADO**. No usar datos de otro modelo, de una variante diferente, de otro
año, de una embarcación similar ni de un distribuidor; tampoco estimaciones, conversiones que alteren el valor ni
inteligencia artificial como sustituto de una fuente. Si existen dos valores oficiales diferentes: **CONFLICT**, y se
conservan ambos.

## 4. Model year y variantes

La tabla corresponde al modelo exacto. Diferenciar MODEL, MODEL YEAR, VARIANT, CONFIGURATION y ENGINE OPTION. No
mezclar especificaciones de, por ejemplo, 37 XC / 37 XC Cross Cabin / 37 XC Revolution si la fuente las presenta como
configuraciones o generaciones diferentes. Si no está claro si dos registros corresponden al mismo modelo:
**REQUIRES REVIEW**.

## 5. Campos de la tabla

La tabla se adapta al tipo de embarcación y contiene los campos técnicos relevantes disponibles. No se muestran
campos irrelevantes con valores vacíos. Base:

- **Universales:** Eslora Total, Manga Casco, Calado, Desplazamiento, Camarotes, Baños, Capacidad de pasajeros.
- **Motor:** Capacidad Combustible, Capacidad Agua Dulce, Motorización, Potencia motor, Potencia motor máxima,
  Velocidad máxima, Velocidad crucero, Autonomía, Certificación.
- **Vela:** Superficie vélica, Tipo de aparejo, Altura de mástil, Mayor, Génova, Calado, Lastre, Motor auxiliar,
  Potencia motor auxiliar.
- **Catamaranes** (cuando corresponda): configuración de cabinas, configuración de baños, capacidad de agua,
  capacidad de combustible, generador, autonomía, flybridge, superficie vélica, motorización.

Implementado en `schema/field-catalog.json`.

## 6. Contenido editorial

La información se organiza como SOURCE CONTENT y, después, OCEANIC CONTENT. Bloques mínimos:

- **HERO:** nombre del barco, modelo, headline potencial, descripción corta, imagen hero, imágenes alternativas.
- **INTRODUCCIÓN:** descripción del modelo, concepto, posicionamiento, características diferenciales, contexto de uso.
- **DISEÑO:** diseño exterior, diseño interior, arquitectura, distribución, ergonomía, materiales relevantes.
- **INGENIERÍA:** casco, construcción, tecnología, sistemas, soluciones técnicas, características estructurales.
- **EXPERIENCIA A BORDO** (cuando corresponda): cockpit, salón, cabinas, camarotes, baños, cocina, helm, flybridge,
  espacios exteriores, almacenamiento, circulación.
- **PERFORMANCE** (con información oficial): velocidad máxima, velocidad crucero, autonomía, consumo, motorización,
  potencia, capacidad de combustible, comportamiento, prestaciones.
- **EQUIPAMIENTO:** separar siempre STANDARD, OPTIONAL, PACKAGES y CONFIGURATIONS, sin mezclar categorías.

## 7. Textos

No solo datos técnicos: también los textos oficiales suficientes para construir la página completa (descripción
oficial, introducción, características, beneficios declarados, tecnología, diseño, ingeniería, experiencia a bordo,
performance, configuraciones, equipamiento). Conservar primero el contenido fuente y después generar una versión
candidata adaptada al tono editorial de Oceanic.

## 8. Imágenes (obligatorias)

Inventario suficiente para construir la página, no solo la URL de una galería general. Descargar los originales
cuando sea técnicamente posible y esté permitido, en:

```
05_MULTIMEDIA/IMAGENES/  HERO/ EXTERIOR/ INTERIOR/ COCKPIT/ CABIN/ HELM/ DETAIL/ UNDERWAY/ OTHER/
```

**Decisión de Oceanic (peso):** se guarda una copia web WebP por imagen y el original solo se referencia (URL,
hash, dimensiones); los documentos se guardan como enlace. Solo se crean las categorías con contenido. Cada imagen conserva: archivo, URL original, página de origen, categoría,
dimensiones, formato, hash y fecha de recopilación. Evitar duplicados. No descargar imágenes de otros modelos.

## 9. Imagen hero

Identificar una o más candidatas (**HERO_CANDIDATE**) con imagen, URL, razón de selección y fuente. La selección
final puede quedar para revisión humana.

## 10. Videos

Registrar videos oficiales del modelo: URL, plataforma, título, descripción, página de origen y fecha cuando exista.
No descargar videos grandes salvo que se defina explícitamente.

## 11. Documentos

Buscar brochure, product card, technical specification, manual, price list, configurador, catálogo y otros documentos
técnicos. Guardar los originales cuando sea posible.

## 12. Estructura del paquete

```
MARCA/MODELO/
├── 00_MODELO/00_MODELO.md
├── 01_CONTENIDO/ hero.md introduccion.md diseno.md ingenieria.md experiencia-a-bordo.md performance.md
├── 02_ESPECIFICACIONES/ tabla-caracteristicas.md specifications.json specifications.md
├── 03_CARACTERISTICAS/ caracteristicas.md
├── 04_EQUIPAMIENTO/ standard.md optional.md packages.md
├── 05_MULTIMEDIA/ IMAGENES/ VIDEOS/
├── 06_DOCUMENTOS/ BROCHURES/ TECHNICAL/ MANUALS/ OTHER/
└── 07_FUENTES/ sources.json source-map.md
```

No crear archivos vacíos solo para cumplir la estructura.

## 13. Content readiness

Evaluar: DATOS (tabla técnica, especificaciones, características, equipamiento) · EDITORIAL (hero, introducción,
diseño, ingeniería, experiencia, performance) · MULTIMEDIA (hero image, exterior, interior, detail, video) ·
DOCUMENTOS (brochure, technical, manual). La ausencia de cualquiera debe quedar explícita.

## 14. Regla absoluta

Un modelo NO está listo solo porque se encontró su página oficial. Está listo cuando hay suficiente material
verificable para construir una página Oceanic completa. Material insuficiente: `CONTENT_STATUS = YELLOW`. Falta
información crítica: `CONTENT_STATUS = RED`. No subir artificialmente el porcentaje por texto irrelevante.

## 15. Objetivo final

Al abrir MARCA / MODELO debe estar prácticamente todo lo necesario para construir la página: textos, tabla técnica
correcta, especificaciones, características, equipamiento, imágenes, videos, documentos, fuentes, conflictos e
información faltante. Primero se construye la biblioteca; la página Oceanic se construye después.

### Decisión de Oceanic: métrico, superficie vélica e imágenes de variantes hermanas (2026-09-30)

- Cuando la ficha técnica publica el mismo campo en métrico e imperial y no coinciden, se publica el valor métrico y el
  imperial se anota como error de la web. Si el imperial solo tiene mal el símbolo (`20''` por 20 ft), es el mismo valor.
  Si el valor internacional no es plausible y la versión en inglés (EE. UU.) de la misma página da uno coherente, se
  publica ese (fuente S3).
- La superficie vélica no se toma de la lista de equipamiento PDF: si la web no la publica, queda `-`.
- Una imagen de la galería oficial del modelo que también publica una variante hermana del mismo casco (misma gama y
  eslora) se acepta en ambas variantes.
