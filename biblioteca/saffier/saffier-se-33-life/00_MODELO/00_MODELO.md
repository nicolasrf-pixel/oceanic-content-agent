# Saffier SE 33 Life

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Saffier Yachts B.V. (IJmuiden, Países Bajos) | S1 |
| GAMA | Elegance (Models) | S1, S2 |
| MODEL | Saffier SE 33 Life | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Saffier SE 33 Life | S1 |
| TIPO | Velero monocasco (daysailer / crucero) | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://saffieryachts.com/models/saffier-se-33-life/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/saffier.py`.
- No se mezclan otros modelos de la gama (-).
- Imágenes: 29 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 61% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 8/9 verificada · faltan: superficie_velica |
| DATOS | especificaciones | OK | 20 campos con fuente |
| DATOS | caracteristicas | MISSING | no existe |
| DATOS | equipamiento | PARTIAL | standard.md |
| EDITORIAL | hero | OK | 95 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 162 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 10 palabras fuente |
| EDITORIAL | ingenieria | OK | 44 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 236 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 303 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 12 en inventario (mín. 3) · descargadas 0/29 |
| MULTIMEDIA | interior | PARTIAL | 15 en inventario (mín. 2) · descargadas 0/29 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 0/29 |
| MULTIMEDIA | video | OK | 2 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Eslora Total**: L.O.A. (with bowsprit) → 'L.O.A. (with bowsprit)' = eslora total (incluye el bauprés).
- **Desplazamiento en rosca**: Displacement → 'Displacement' = desplazamiento publicado.
- **Potencia motor auxiliar**: Engine power (Std.) → La mayor potencia publicada (estándar u opcional).
- **Eslora Casco**: Length (without bowsprit) → 'Length (without bowsprit)' = eslora sin bauprés.
- **Altura sobre línea de flotación**: Air draft → 'Air draft' = altura sobre la línea de flotación.
- **Calado**: Draft standard keel → 'Draft standard keel': quilla estándar.
- **Lastre**: Ballast standard keel → 'Ballast standard keel': quilla estándar.
- **Génova**: Self-tacking Jib area → 'Self-tacking Jib area': vela de proa estándar.

## Información faltante o por revisar

- **Superficie vélica** (NOT_FOUND): La web publica las superficies de mayor y foque por separado, sin total: no se suman (sin cálculos).
- Equipamiento: la web no publica lista optional; la web no publica listas de equipamiento estándar/opcional en la página del producto (el configurador es una herramienta comercial).
- Características (03): la página no tiene bloques de características con título.
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto.
