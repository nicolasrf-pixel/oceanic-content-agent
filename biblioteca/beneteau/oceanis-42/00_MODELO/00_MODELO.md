# Oceanis 42

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | Oceanis (Sailboats) | S1, S2 |
| MODEL | Oceanis 42 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Oceanis 42 | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | From 248 500 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/oceanis/oceanis-42 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Oceanis 30.1, Oceanis 34.1, Oceanis 37.1, Oceanis 40.1, Oceanis 47, Oceanis 52).
- Imágenes: 20 del modelo, 1 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 83% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 8/9 verificada · faltan: superficie_velica |
| DATOS | especificaciones | OK | 13 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 56 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 72 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 168 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 51 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 270 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 136 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 4 en inventario (mín. 3) · descargadas 20/20 |
| MULTIMEDIA | interior | OK | 5 en inventario (mín. 2) · descargadas 20/20 |
| MULTIMEDIA | detail | OK | 3 en inventario (mín. 2) · descargadas 20/20 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
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
- Equipamiento: la web no publica lista optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
