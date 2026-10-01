# Saffier SC 6.50 Cruise

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Saffier Yachts B.V. (IJmuiden, Países Bajos) | S1 |
| GAMA | Classic (Models) | S1, S2 |
| MODEL | Saffier SC 6.50 Cruise | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Saffier SC 6.50 Cruise | S1 |
| TIPO | Velero monocasco (daysailer / crucero) | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://saffieryachts.com/models/saffier-sc-6-50-cruise/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/saffier.py`.
- No se mezclan otros modelos de la gama (-).
- Imágenes: 48 del modelo, 1 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 56% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 6/9 verificada · faltan: capacidad_combustible, capacidad_agua_dulce, superficie_velica |
| DATOS | especificaciones | OK | 16 campos con fuente |
| DATOS | caracteristicas | MISSING | no existe |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 72 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 63 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 31 palabras fuente |
| EDITORIAL | ingenieria | OK | 119 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | PARTIAL | 35 palabras fuente |
| EDITORIAL | performance | OK | 213 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 45 en inventario (mín. 3) · descargadas 0/48 |
| MULTIMEDIA | interior | PARTIAL | 2 en inventario (mín. 2) · descargadas 0/48 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 0/48 |
| MULTIMEDIA | video | OK | 2 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Eslora Total**: L.O.A. (with bowsprit) → 'L.O.A. (with bowsprit)' = eslora total (incluye el bauprés).
- **Desplazamiento en rosca**: Displacement → 'Displacement' = desplazamiento publicado.
- **Potencia motor auxiliar**: Engine power (Std.) → La mayor potencia publicada (estándar u opcional); 2.2 kW convertido a hp (1 kW = 1,341 hp).
- **Eslora Casco**: Length (without bowsprit) → 'Length (without bowsprit)' = eslora sin bauprés.
- **Altura sobre línea de flotación**: Air draft → 'Air draft' = altura sobre la línea de flotación.
- **Génova**: Self-tacking Jib area → 'Self-tacking Jib area': vela de proa estándar.

## Información faltante o por revisar

- **Capacidad Combustible** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Superficie vélica** (NOT_FOUND): La web publica las superficies de mayor y foque por separado, sin total: no se suman (sin cálculos).
- Equipamiento: la web no publica lista standard ni optional; la web no publica listas de equipamiento estándar/opcional en la página del producto (el configurador es una herramienta comercial).
- Características (03): la página no tiene bloques de características con título.
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto.
