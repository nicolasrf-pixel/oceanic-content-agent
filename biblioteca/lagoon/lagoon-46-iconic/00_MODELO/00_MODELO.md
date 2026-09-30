# Lagoon 46 Iconic

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Lagoon (CNB / Groupe Beneteau, Francia) | S1 |
| GAMA | Lagoon (Sailing catamarans) | S1, S2 |
| MODEL | Lagoon 46 Iconic | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Lagoon 46 Iconic | S1 |
| TIPO | Catamarán a vela | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.catamarans-lagoon.com/boats/lagoon-46-iconic | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/lagoon.py`.
- No se mezclan otros modelos de la gama (-).
- Imágenes: 27 del modelo, 0 de otro modelo (excluidas), 4 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = RED** · completitud 50% (informativa; el estado lo deciden las reglas)

Falta crítico: hero_image, exterior
Conflictos sin resolver: Capacidad Agua Dulce

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 8/9 verificada · en conflicto: capacidad_agua_dulce |
| DATOS | especificaciones | OK | 17 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 51 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 48 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 10 palabras fuente |
| EDITORIAL | ingenieria | OK | 84 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | PARTIAL | 10 palabras fuente |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente |
| MULTIMEDIA | hero_image | MISSING | sin HERO_CANDIDATE |
| MULTIMEDIA | exterior | MISSING | 0 en inventario (mín. 3) · descargadas 0/27 |
| MULTIMEDIA | interior | MISSING | 0 en inventario (mín. 2) · descargadas 0/27 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 0/27 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del catamarán.
- **Desplazamiento en rosca**: Light displacement (EEC) → 'Light displacement (EEC)' = desplazamiento en rosca.
- **Camarotes**: Versions (pestañas de layouts) → El bloque técnico no publica número de cabinas: se toma de las versiones oficiales.
- **Superficie vélica**: Sails area upwind → 'Upwind sail area' = superficie vélica de ceñida publicada (mayor + génova).
- **Potencia motor auxiliar**: Motorisation - standard → Motorización estándar publicada (no hay opción más potente) → potencia del motor auxiliar.
- **Motor auxiliar**: Motorisation - standard → Motorización del bloque técnico (estándar).
- **Arquitectura naval**: Specifications (créditos) → Créditos publicados en el bloque técnico.

## Información faltante o por revisar

- **Capacidad Agua Dulce** (CONFLICT): El bloque técnico publica '300 L' y '159 US GAL' (≈ 601,88 l): no coinciden. Decidir con el fabricante.
- Equipamiento: la web no publica lista standard ni optional; la web del producto no publica lista de equipamiento (el brochure se pide por formulario).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto; identificar en el portal de propietarios.
