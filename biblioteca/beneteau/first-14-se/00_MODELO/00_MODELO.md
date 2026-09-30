# First 14 SE

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | First SE (Sailboats) | S1, S2 |
| MODEL | First 14 SE | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | First 14 SE | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | From 13 500€ (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/first-se/first-14-se | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (First 18 SE, First 24 SE, First 27 SE, First 36 SE).
- Imágenes: 15 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = RED** · completitud 61% (informativa; el estado lo deciden las reglas)

Falta crítico: tabla_tecnica
Conflictos sin resolver: Altura sobre línea de flotación

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | MISSING | tabla base 4/9 verificada · faltan: camarotes, capacidad_combustible, capacidad_agua_dulce, superficie_velica, potencia_motor_auxiliar |
| DATOS | especificaciones | PARTIAL | 7 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 98 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 93 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 10 palabras fuente |
| EDITORIAL | ingenieria | OK | 150 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | PARTIAL | 32 palabras fuente |
| EDITORIAL | performance | OK | 250 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 1 candidatas |
| MULTIMEDIA | exterior | OK | 8 en inventario (mín. 3) · descargadas 15/15 |
| MULTIMEDIA | interior | MISSING | 0 en inventario (mín. 2) · descargadas 15/15 |
| MULTIMEDIA | detail | OK | 4 en inventario (mín. 2) · descargadas 15/15 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.

## Información faltante o por revisar

- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- **Capacidad Combustible** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Superficie vélica** (NOT_FOUND): Beneteau no publica la superficie vélica en la web del producto (ni en el bloque técnico ni en el texto). Figura en la lista de equipamiento PDF, que es documento y no aporta datos.
- **Potencia motor auxiliar** (NOT_FOUND): El bloque técnico no publica 'Max. engine power'.
- **Altura sobre línea de flotación** (CONFLICT): El bloque técnico publica '6.1 m' y '20’’' (≈ 0,51 m): no coinciden. Decidir con el fabricante.
- **Motor auxiliar** (NOT_FOUND): La web no publica motor auxiliar para este modelo.
- Equipamiento: la web no publica lista standard ni optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
