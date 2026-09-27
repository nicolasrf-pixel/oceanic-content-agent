# First 36 SE

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | First SE (Sailboats) | S1, S2 |
| MODEL | First 36 SE | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | First 36 SE | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.beneteau.com/first-se/first-36-se | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (First 14 SE, First 18 SE, First 24 SE, First 27 SE).
- Imágenes: 22 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 58% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 7/9 verificada · faltan: certificacion, superficie_velica |
| DATOS | especificaciones | OK | 11 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | PARTIAL | standard.md |
| EDITORIAL | hero | PARTIAL | 49 palabras fuente · sin candidato Oceanic |
| EDITORIAL | introduccion | PARTIAL | 132 palabras fuente · sin candidato Oceanic |
| EDITORIAL | diseno | PARTIAL | 10 palabras fuente · sin candidato Oceanic |
| EDITORIAL | ingenieria | PARTIAL | 51 palabras fuente · sin candidato Oceanic |
| EDITORIAL | experiencia | PARTIAL | 89 palabras fuente · sin candidato Oceanic |
| EDITORIAL | performance | PARTIAL | 355 palabras fuente · sin candidato Oceanic |
| MULTIMEDIA | hero_image | PARTIAL | 1 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 8 en inventario (mín. 3) · descargadas 0/22 |
| MULTIMEDIA | interior | PARTIAL | 7 en inventario (mín. 2) · descargadas 0/22 |
| MULTIMEDIA | detail | PARTIAL | 4 en inventario (mín. 2) · descargadas 0/22 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Camarotes**: Texto de la página → El bloque técnico no publica 'Cabin Number': el texto oficial declara el número de cabinas.
- **Potencia motor auxiliar**: Max. engine power → 'Max. engine power' de un velero = potencia máxima del motor auxiliar.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motor auxiliar**: Max. engine power → Motor auxiliar = 'Max. engine power' del bloque técnico (la web no publica marca ni modelo).

## Información faltante o por revisar

- **Certificación** (NOT_FOUND): No publicado en la web oficial del producto.
- **Superficie vélica** (NOT_FOUND): Beneteau no publica la superficie vélica en la web del producto (ni en el bloque técnico ni en el texto). Figura en la lista de equipamiento PDF, que es documento y no aporta datos.
- Equipamiento: la web no publica lista optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
