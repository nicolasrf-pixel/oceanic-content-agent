# First 60

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | First (Sailboats) | S1, S2 |
| MODEL | First 60 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | First 60 | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.beneteau.com/first/first-60 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (First 14, First 24, First 36, First 30, First 44, First 53).
- Imágenes: 26 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 75% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 7/9 verificada · faltan: manga_casco, superficie_velica |
| DATOS | especificaciones | OK | 12 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 45 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 111 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 94 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | PARTIAL | 10 palabras fuente |
| EDITORIAL | experiencia | OK | 180 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 191 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 6 en inventario (mín. 3) · descargadas 26/26 |
| MULTIMEDIA | interior | OK | 12 en inventario (mín. 2) · descargadas 26/26 |
| MULTIMEDIA | detail | OK | 4 en inventario (mín. 2) · descargadas 26/26 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Camarotes**: Layouts (pestañas) → El bloque técnico no publica 'Cabin Number': se toma el número de cabinas de los títulos de los layouts oficiales.
- **Potencia motor auxiliar**: Max. engine power → 'Max. engine power' de un velero = potencia máxima del motor auxiliar.
- **Baños**: Layouts (pestañas) → Número de baños/aseos según los títulos de los layouts oficiales.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motor auxiliar**: Max. engine power → Motor auxiliar = 'Max. engine power' del bloque técnico (la web no publica marca ni modelo).

## Información faltante o por revisar

- **Manga Casco** (NOT_FOUND): No publicado en la web oficial del producto.
- **Superficie vélica** (NOT_FOUND): Beneteau no publica la superficie vélica en la web del producto (ni en el bloque técnico ni en el texto). Figura en la lista de equipamiento PDF, que es documento y no aporta datos.
- Equipamiento: la web no publica lista standard ni optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
