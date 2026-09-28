# Gran Turismo 50

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | The new Gran Turismo range (Motor Yachts) | S1, S2 |
| MODEL | Gran Turismo 50 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Gran Turismo 50 | S1 |
| TIPO | Motor | S1 |
| PRECIO | From 983 600 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/new-gran-turismo-range/gran-turismo-50 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Gran Turismo 40 Open, Gran Turismo 35, Gran Turismo 40 Coupe).
- Imágenes: 20 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 78% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Autonomía

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 4/8 verificada · faltan: camarotes, capacidad_combustible, capacidad_agua_dulce, potencia_motor_maxima |
| DATOS | especificaciones | PARTIAL | 8 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | PARTIAL | optional.md |
| EDITORIAL | hero | OK | 44 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 90 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 133 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 73 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 78 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 59 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 5 en inventario (mín. 3) · descargadas 0/20 |
| MULTIMEDIA | interior | PARTIAL | 4 en inventario (mín. 2) · descargadas 0/20 |
| MULTIMEDIA | detail | PARTIAL | 3 en inventario (mín. 2) · descargadas 0/20 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Autonomía**: Texto de la página → Autonomía declarada por el fabricante en el texto, con su condición de velocidad.

## Información faltante o por revisar

- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- **Capacidad Combustible** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Potencia motor máx** (NOT_FOUND): El bloque técnico no publica 'Max. engine power'.
- **Autonomía** (REQUIRES_REVIEW): El fabricante la declara provisional.
- **Motorización** (NOT_FOUND): La web no publica motorización para este modelo.
- Equipamiento: la web no publica lista standard; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
