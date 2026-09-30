# First 36

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | First (Sailboats) | S1, S2 |
| MODEL | First 36 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | First 36 | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | From 248 450€ (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/first/first-36 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (First 14, First 24, First 30, First 44, First 53, First 60).
- Imágenes: 24 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = RED** · completitud 83% (informativa; el estado lo deciden las reglas)

Falta crítico: tabla_tecnica

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | MISSING | tabla base 4/9 verificada · faltan: capacidad_combustible, capacidad_agua_dulce, certificacion, superficie_velica, potencia_motor_auxiliar |
| DATOS | especificaciones | PARTIAL | 6 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | PARTIAL | standard.md |
| EDITORIAL | hero | PARTIAL | 26 palabras fuente |
| EDITORIAL | introduccion | OK | 140 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 44 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 142 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 143 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 230 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 5 en inventario (mín. 3) · descargadas 24/24 |
| MULTIMEDIA | interior | OK | 9 en inventario (mín. 2) · descargadas 24/24 |
| MULTIMEDIA | detail | OK | 5 en inventario (mín. 2) · descargadas 24/24 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.

## Información faltante o por revisar

- **Capacidad Combustible** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Certificación** (NOT_FOUND): No publicado en la web oficial del producto.
- **Superficie vélica** (NOT_FOUND): Beneteau no publica la superficie vélica en la web del producto (ni en el bloque técnico ni en el texto). Figura en la lista de equipamiento PDF, que es documento y no aporta datos.
- **Potencia motor auxiliar** (NOT_FOUND): El bloque técnico no publica 'Max. engine power'.
- **Motor auxiliar** (NOT_FOUND): La web no publica motor auxiliar para este modelo.
- Equipamiento: la web no publica lista optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
