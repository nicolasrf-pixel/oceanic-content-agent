# Oceanic Content Engine

Biblioteca de contenido oficial de las marcas náuticas que representa Oceanic. Cada barco termina como un
paquete completo en `biblioteca/<marca>/<modelo>/`, listo para construir **después** su página Oceanic.
Especificación completa: `docs/ESPECIFICACION.md`. Proceso paso a paso: `docs/PROCESO.md`.
Paquete de referencia ya construido: `biblioteca/axopar/axopar-37-xc-cross-cabin/`.

## Reglas absolutas

1. **Datos solo de la web oficial del fabricante.** Las especificaciones y las afirmaciones factuales salen únicamente
   de lo declarado en el sitio web oficial (fuentes de tipo `official_product_page` u `official_range_page`; el
   validador rechaza cualquier otra). Manuales, fichas PDF y brochures oficiales se registran en `06_DOCUMENTOS` pero
   no aportan datos. Distribuidores, portales, reseñas y la página Oceanic de referencia
   (https://oceanicsite.netlify.app/marcas/axopar/axopar-37-xc/) van en `sources.json › excluded_sources`. De la
   página Oceanic solo se usa la estructura.
2. **La tabla base siempre se llena desde la web del producto** (`schema/field-catalog.json › base_table`; para
   motor: Eslora Total, Manga Casco, Desplazamiento en rosca, Camarotes, Capacidad Combustible, Capacidad Agua Dulce,
   Certificación, Potencia motor máx). El dato siempre está en la web oficial del producto (o en su versión en
   inglés), pero no siempre literal: hay que **cruzar secciones** (ficha técnica, equipamiento estándar y opcional,
   pestañas, layouts). Cada cruce se documenta en el registro con `location` (sección) y `cross_reference` (por qué
   equivale). Ejemplos del 37 XC: "Weight (excl. Engine)" → Desplazamiento en rosca; cabina de proa de serie + cabina
   de popa opcional → Camarotes "1 (+1 opcional)"; "Category" + "Passengers" → Certificación "B10 / C12";
   extremo superior de "Outboard engines" y motor más potente ofrecido → Potencia motor máx.
   **Sin inventar:** prohibido usar datos de otro modelo, variante, model year o embarcación similar, datos de
   distribuidor, estimaciones, cálculos (p. ej. autonomía a partir del consumo) o IA como sustituto de la web. Fuera de
   la tabla base, si un dato de verdad no está: `NOT_FOUND`; con `display_value: "-"` la tabla muestra un guion.
3. **La ficha técnica de la web prevalece.** Si un campo aparece en el bloque de especificaciones técnicas de la web,
   ese es el valor publicado; las menciones del mismo dato en otras secciones de la página (equipamiento, textos) se
   anotan en `notes` y no se publican. Un campo que no está en la ficha técnica se busca en otras secciones de la
   web oficial del producto (cruce, ver regla 2).
   **Métrico e imperial del mismo campo que no coinciden** → se publica el métrico y el imperial se anota como error
   de la web (decisión Oceanic 2026-09-30). **Dos valores oficiales distintos** fuera de esos casos → `CONFLICT`,
   conservando ambos. Si dos registros podrían no referirse a lo
   mismo (otra medida, otra variante, otro año) → `REQUIRES_REVIEW`.
4. **Modelo exacto.** Diferenciar MODEL / MODEL YEAR / VARIANT / CONFIGURATION / ENGINE OPTION. No mezclar variantes
   (p. ej. 37 XC vs 37 Sun Top) ni generaciones. El model year de los datos es el que declara la web.
5. **Imágenes solo del modelo.** Cada imagen lleva `scope`: `THIS_MODEL`, `OTHER_MODEL`, `NOT_MODEL_SPECIFIC` o
   `REQUIRES_REVIEW`. Solo se descargan las `THIS_MODEL`. Las páginas oficiales a veces mezclan imágenes de otras
   variantes (el 37 XC trae fotos del 37 Sun Top): revisar tags y títulos. Excepción (decisión Oceanic 2026-09-30):
   una imagen de la galería oficial del modelo que también publica una variante hermana del mismo casco (misma gama y
   eslora, p. ej. Antares 8 / 8 Fishing) se acepta en ambas.
6. **Primero SOURCE CONTENT (literal), después OCEANIC CONTENT (candidato en español).** El candidato solo afirma
   lo que dice la fuente, queda marcado como BORRADOR y no copia textos de la página Oceanic de referencia.
7. **Equipamiento separado:** STANDARD, OPTIONAL, PACKAGES y CONFIGURATIONS, cada uno en su archivo.
8. **No crear archivos vacíos** para cumplir la estructura. Si algo no existe, se registra como faltante.
9. **Readiness honesto.** `CONTENT_STATUS` lo calculan las reglas de `tools/oceanic/readiness.py`, no el volumen
   de texto. Un modelo no está listo solo porque existe su página oficial.

## Estructura de un paquete

```
biblioteca/<marca>/<modelo>/
├── 00_MODELO/00_MODELO.md          identificación, alcance, conflictos, faltantes, bloque READINESS (generado)
├── 00_MODELO/readiness.json        (generado)
├── 01_CONTENIDO/                   hero, introduccion, diseno, ingenieria, experiencia-a-bordo, performance
│                                   (cada uno con "## SOURCE CONTENT" y "## OCEANIC CONTENT")
├── 02_ESPECIFICACIONES/specifications.json   ← fuente de verdad técnica (editar esto)
│   ├── tabla-caracteristicas.md    (generado)
│   └── specifications.md           (generado, con trazabilidad por valor)
├── 03_CARACTERISTICAS/caracteristicas.md
├── 04_EQUIPAMIENTO/standard.md, optional.md, packages.md, configurations.md
├── 05_MULTIMEDIA/IMAGENES/images.json (+ carpetas por categoría al descargar), VIDEOS/videos.json, multimedia.md (generado)
├── 06_DOCUMENTOS/documents.json (+ BROCHURES/ TECHNICAL/ MANUALS/ OTHER/ al descargar)
└── 07_FUENTES/sources.json, source-map.md, extract/
```

Slugs en minúsculas con guiones (`axopar-37-xc-cross-cabin`).

## specifications.json

Campos Oceanic en `schema/field-catalog.json` (por tipo: universal, motor, vela, catamarán). Mostrar solo los
relevantes; los críticos que falten van como `NOT_FOUND`. Cada valor es un registro con: `source_id`, `source_name`,
`url`, `accessed_at`, `source_field` (nombre original), `source_value` (literal), `source_unit`, `normalized_value`,
`normalized_unit`, `model_year` y opcionalmente `location`. `VERIFIED` exige que todos los registros coincidan.

## Comandos

```
cd tools && pip install -r requirements.txt
python -m oceanic extract <adaptador> <raw.html> <url> <out.json> [--accessed=AAAA-MM-DD]  # p. ej. axopar
python -m oceanic render <modelo>      # tablas + multimedia.md + validación de reglas
python -m oceanic media <modelo>       # descarga imágenes THIS_MODEL y documentos, con hash y dimensiones
python -m oceanic readiness <modelo>   # CONTENT_STATUS
python -m oceanic check                # render + readiness de toda la biblioteca (falla si hay errores de reglas)
python -m oceanic build <marca> <extract.json>...  # axopar | beneteau | lagoon | aquila | xo | solaris | saffier: paquetes completos (no toca los curated)
python -m oceanic media <modelo> --cdn               # copias web desde el CDN (rápido, sin bajar originales)
python -m oceanic zip <dir>...                       # ZIP en dist/ para subir a Drive
python -m unittest discover -s tests   # pruebas
```

**Dónde vive cada cosa:** GitHub guarda motor, textos, datos e inventarios (`images.json` con URL del original).
Las copias web de imágenes NO se versionan (`.gitignore`): van en el ZIP que el usuario sube a mano a Drive
(`python -m oceanic zip`). Se pueden regenerar en cualquier momento con `media --cdn`.

**Generación masiva (Axopar):** `tools/oceanic/builders/axopar.py` aplica todas las reglas de este archivo. Los textos
OCEANIC CONTENT salen de `drafts/axopar/<slug>.json` (redactados a mano, solo con lo que dice la web); sin draft,
el bloque queda "PENDIENTE". Paquetes con `00_MODELO/model.json › curated: true` no se regeneran.

**Generación masiva (Beneteau):** web Drupal server-rendered; `adapters/beneteau.py` lee el HTML y `builders/beneteau.py`
arma el paquete (slug = nombre del modelo, p. ej. `oceanis-30-1`). Particularidades: la web no declara model year
(`NO DECLARADO`) ni superficie vélica (queda `-`: no se toma del PDF, decisión Oceanic); el bloque técnico da cada valor
en imperial y métrico: si no coinciden se publica el métrico (si el imperial solo tiene mal el símbolo, p. ej. `20''` por
20 ft, es el mismo valor); la versión EE. UU. de la página es la fuente S3 (se usa si el valor internacional no es
plausible, p. ej. manga del GT 40 Open); camarotes/baños se cruzan con los títulos de Layouts; una imagen publicada en varias páginas de modelo
queda `REQUIRES_REVIEW` salvo entre variantes hermanas; revisiones visuales en `drafts/<marca>/<slug>.json ›
image_overrides`. Equipamiento: la lista completa es un PDF (documento); standard/optional solo con menciones
literales de la página.

**Generación masiva (Lagoon):** web Nuxt con back office Drupal (`admin.catamarans-lagoon.com`); `adapters/lagoon.py`
produce el mismo extract que Beneteau y `builders/lagoon.py` reutiliza el builder de Beneteau con su propia `CFG`
(mismo grupo). Tipo `catamaran_vela`. La ficha técnica es completa (superficie vélica de ceñida, motorización estándar,
depósitos, CE, literas); camarotes y baños salen de las pestañas "Versions" (en el payload Nuxt). Si un campo aparece
dos veces en la ficha con valores distintos → `CONFLICT`. La galería no trae categorías: se clasifican a la vista (hojas de contacto) y quedan en
`drafts/lagoon/<slug>.json › image_overrides`. Los buques insignia se nombran en palabras (SIXTY 5 = 65, EIGHTY 2 = 82).
El brochure se pide por formulario (sin enlace directo). Las citas de prensa van a `excluded_sources`.

**Generación masiva (Aquila):** web HubSpot; `adapters/aquila.py` (mismo extract que Beneteau) y `builders/aquila.py`
(reutiliza el builder de Beneteau con su `CFG`). Tipos `catamaran_motor` / `catamaran_vela` (gama Sail). Las etiquetas de
la ficha cambian por modelo ("Dry Weight", "Light Displacement"...) y se mapean por patrones; algunos modelos publican una
segunda lista (Tankage, Propulsion). El alcance de las imágenes sale de la carpeta del CMS (`hubfs/46 Yacht/...`).
Rendimientos "estimated / non-contractual" → `REQUIRES_REVIEW`. Videos de terceros (BoatTEST, propietarios) se marcan.

**Generación masiva (XO Boats):** WordPress + WooCommerce; `adapters/xo.py` lee la tabla de atributos (ficha técnica) y
los bloques de texto; `builders/xo.py` reutiliza el builder de Beneteau. Tipo `motor`. "Overall Lenght (exc. engine)" →
Eslora Total; "Weight (excl. engine)" → Desplazamiento; "Classification" + "Passengers" → Certificación (posición a
posición; si las personas no crecen de B a C → `REQUIRES_REVIEW`). Valores sin unidad (combustible, motor intraborda):
se aplica la unidad que publica el resto de la gama y se anota. Camarotes/baños no están en la tabla: se cruzan con citas
literales del texto (`TEXT_XREF`; el build falla si la cita desaparece). Slugs con "+" → "plus". El catálogo 2026 de la
gama (FlippingBook) se registra como documento. Las reseñas de prensa enlazadas van a `excluded_sources`.

**Generación masiva (Solaris):** solo la gama a vela de solarisyachts.com (Solaris Power queda fuera, decisión Oceanic
2026-10-01). `adapters/solaris.py` lee carruseles, textos, planos, la rejilla "Technical specifications" y los créditos;
`builders/solaris.py` reutiliza el builder de Beneteau. La ficha está escrita a mano: unidades delante o detrás, miles con
punto o coma ("Kg 9.850", "9,400 kg"), erratas ("M 22.OO"). Un valor imposible para la eslora (46 kg en un 80 RS) →
`REQUIRES_REVIEW`; mayor + génova que no cuadra con la superficie vélica → `REQUIRES_REVIEW` (111 RS repite el aparejo del
80 RS). Potencia auxiliar = la mayor de la fila de motor. Camarotes/baños por citas literales (`TEXT_XREF`). Un RS y un
Flush Deck de la misma eslora (74 / 74 RS) no son variantes hermanas.

**Generación masiva (Saffier):** saffieryachts.com (WordPress); ficha completa por grupos (Dimensions, Sails, Engine, Tanks,
Accomodations). "L.O.A. (with bowsprit)" → Eslora Total y "Length (without bowsprit)" → Eslora Casco; calado y lastre de la
quilla estándar (las otras quillas en notas); "Air draft" → Altura sobre flotación. La web no publica superficie vélica
total (mayor y foque por separado): queda `-`, no se suman. Potencia en HP o kW (kW → hp solo para el máximo). Videos de
canales de terceros se marcan; reseñas de revistas (PDF) a `excluded_sources`. SL 46 MED | NORTH son dos cubiertas del
mismo modelo (un paquete).

`check` debe terminar sin errores antes de hacer commit.

## Captura con Firecrawl

- Usar el MCP de Firecrawl: `firecrawl_search` para encontrar URLs oficiales y `firecrawl_scrape` con `rawHtml` para
  las fichas. Muchas webs (Next.js) esconden pestañas como el equipamiento opcional, que solo aparecen en los datos
  embebidos: por eso se usa rawHtml con un adaptador y no el markdown.
- Los PDF oficiales solo se identifican y registran como documentos (no aportan datos).
- Las descargas de binarios (imágenes, PDF) las hace `python -m oceanic media` y necesitan acceso de red a los CDN
  del fabricante (Axopar: `media.ffycdn.net`, `axopar.frontify.com`, `brand.axopar.com`, `manuals.axopar.com`;
  Beneteau: `www.beneteau.com`, originales en `/sites/default/files/`; Lagoon: `admin.catamarans-lagoon.com`; Aquila: `www.aquilaboats.com`; XO: `xoboats.com`, originales en `/wp-content/uploads/`; Solaris: `www.solarisyachts.com`; Saffier: `saffieryachts.com`).
- **Peso:** no se guardan originales. Por imagen se guarda una copia web WebP (2560 px lado mayor si es
  HERO_CANDIDATE, 1920 px el resto) y el original queda referenciado en `images.json › original` (URL, sha256,
  dimensiones, peso). Los documentos se guardan como enlace (`keep_file: true` solo si hace falta la copia).
  Objetivo: ~10–15 MB por modelo.
