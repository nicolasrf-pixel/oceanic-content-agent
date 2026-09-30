# First 24 SE

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | First SE (Sailboats) | S1, S2 |
| MODEL | First 24 SE | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | First 24 SE | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | From 62 000€ (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/first-se/first-24-se | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (First 14 SE, First 18 SE, First 27 SE, First 36 SE).
- Imágenes: 17 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = RED** · completitud 75% (informativa; el estado lo deciden las reglas)

Falta crítico: tabla_tecnica

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | MISSING | tabla base 3/9 verificada · faltan: desplazamiento, camarotes, capacidad_combustible, capacidad_agua_dulce, superficie_velica, potencia_motor_auxiliar |
| DATOS | especificaciones | PARTIAL | 5 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 84 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 83 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 10 palabras fuente |
| EDITORIAL | ingenieria | OK | 225 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 166 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 161 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 1 candidatas |
| MULTIMEDIA | exterior | OK | 5 en inventario (mín. 3) · descargadas 17/17 |
| MULTIMEDIA | interior | OK | 3 en inventario (mín. 2) · descargadas 17/17 |
| MULTIMEDIA | detail | OK | 5 en inventario (mín. 2) · descargadas 17/17 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.

## Información faltante o por revisar

- **Desplazamiento en rosca** (NOT_FOUND): No publicado en la web oficial del producto.
- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- **Capacidad Combustible** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Superficie vélica** (NOT_FOUND): Beneteau no publica la superficie vélica en la web del producto (ni en el bloque técnico ni en el texto). Figura en la lista de equipamiento PDF, que es documento y no aporta datos.
- **Potencia motor auxiliar** (NOT_FOUND): El bloque técnico no publica 'Max. engine power'.
- **Motor auxiliar** (NOT_FOUND): La web no publica motor auxiliar para este modelo.
- Equipamiento: la web no publica lista standard ni optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
