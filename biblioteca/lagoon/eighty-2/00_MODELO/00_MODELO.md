# EIGHTY 2

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Lagoon (CNB / Groupe Beneteau, Francia) | S1 |
| GAMA | Lagoon (Sailing catamarans) | S1, S2 |
| MODEL | EIGHTY 2 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | EIGHTY 2 | S1 |
| TIPO | Catamarán a vela | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.catamarans-lagoon.com/boats/eighty-2 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/lagoon.py`.
- No se mezclan otros modelos de la gama (-).
- Imágenes: 77 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 75% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Superficie vélica

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 7/9 verificada · faltan: desplazamiento · en conflicto: superficie_velica |
| DATOS | especificaciones | OK | 14 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 53 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 61 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 101 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | PARTIAL | 10 palabras fuente |
| EDITORIAL | experiencia | OK | 160 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 17 en inventario (mín. 3) · descargadas 77/77 |
| MULTIMEDIA | interior | OK | 28 en inventario (mín. 2) · descargadas 77/77 |
| MULTIMEDIA | detail | OK | 8 en inventario (mín. 2) · descargadas 77/77 |
| MULTIMEDIA | video | OK | 4 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del catamarán.
- **Camarotes**: Versions (pestañas de layouts) → El bloque técnico no publica número de cabinas: se toma de las versiones oficiales.
- **Superficie vélica**: Sails area upwind → 'Upwind sail area' = superficie vélica de ceñida publicada (mayor + génova).
- **Superficie vélica**: Upwind sail area (approx.) → 'Upwind sail area' = superficie vélica de ceñida publicada (mayor + génova).
- **Potencia motor auxiliar**: Motorisation - standard → Motorización estándar publicada (no hay opción más potente) → potencia del motor auxiliar.
- **Motor auxiliar**: Engine power → Motorización del bloque técnico ('Engine power', con marca y modelo).
- **Arquitectura naval**: Specifications (créditos) → Créditos publicados en el bloque técnico.

## Información faltante o por revisar

- **Desplazamiento en rosca** (NOT_FOUND): No publicado en el bloque técnico.
- **Superficie vélica** (CONFLICT): El bloque técnico publica este campo más de una vez con valores distintos.
- Equipamiento: la web no publica lista standard ni optional; la web del producto no publica lista de equipamiento (el brochure se pide por formulario).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto; identificar en el portal de propietarios.
