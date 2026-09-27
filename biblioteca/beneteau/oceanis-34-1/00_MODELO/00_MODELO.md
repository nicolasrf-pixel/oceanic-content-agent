# Oceanis 34.1

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | Oceanis (Sailboats) | S1, S2 |
| MODEL | Oceanis 34.1 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Oceanis 34.1 | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.beneteau.com/oceanis/oceanis-341 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Oceanis 42, Oceanis 30.1, Oceanis 37.1, Oceanis 40.1, Oceanis 47, Oceanis 52).
- Imágenes: 23 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 61% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 8/9 verificada · faltan: superficie_velica |
| DATOS | especificaciones | OK | 13 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | PARTIAL | 71 palabras fuente · sin candidato Oceanic |
| EDITORIAL | introduccion | PARTIAL | 72 palabras fuente · sin candidato Oceanic |
| EDITORIAL | diseno | PARTIAL | 131 palabras fuente · sin candidato Oceanic |
| EDITORIAL | ingenieria | PARTIAL | 51 palabras fuente · sin candidato Oceanic |
| EDITORIAL | experiencia | PARTIAL | 196 palabras fuente · sin candidato Oceanic |
| EDITORIAL | performance | PARTIAL | 65 palabras fuente · sin candidato Oceanic |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 8 en inventario (mín. 3) · descargadas 0/23 |
| MULTIMEDIA | interior | PARTIAL | 6 en inventario (mín. 2) · descargadas 0/23 |
| MULTIMEDIA | detail | PARTIAL | 3 en inventario (mín. 2) · descargadas 0/23 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Potencia motor auxiliar**: Max. engine power → 'Max. engine power' de un velero = potencia máxima del motor auxiliar.
- **Baños**: Layouts (pestañas) → Número de baños/aseos según los títulos de los layouts oficiales.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motor auxiliar**: Max. engine power → Motor auxiliar = 'Max. engine power' del bloque técnico (la web no publica marca ni modelo).

## Información faltante o por revisar

- **Superficie vélica** (NOT_FOUND): Beneteau no publica la superficie vélica en la web del producto (ni en el bloque técnico ni en el texto). Figura en la lista de equipamiento PDF, que es documento y no aporta datos.
- Equipamiento: la web no publica lista standard ni optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
