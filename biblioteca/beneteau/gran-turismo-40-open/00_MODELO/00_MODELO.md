# Gran Turismo 40 Open

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | The new Gran Turismo range (Motor Yachts) | S1, S2 |
| MODEL | Gran Turismo 40 Open | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Gran Turismo 40 Open | S1 |
| TIPO | Motor | S1 |
| PRECIO | From 410 000 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/new-gran-turismo-range/gran-turismo-40-open | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Gran Turismo 35, Gran Turismo 40 Coupe, Gran Turismo 50).
- Imágenes: 25 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 56% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Manga Casco

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 3/8 verificada · faltan: camarotes, capacidad_combustible, capacidad_agua_dulce, potencia_motor_maxima · en conflicto: manga_casco |
| DATOS | especificaciones | PARTIAL | 7 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | PARTIAL | optional.md |
| EDITORIAL | hero | PARTIAL | 54 palabras fuente · sin candidato Oceanic |
| EDITORIAL | introduccion | PARTIAL | 51 palabras fuente · sin candidato Oceanic |
| EDITORIAL | diseno | PARTIAL | 159 palabras fuente · sin candidato Oceanic |
| EDITORIAL | ingenieria | PARTIAL | 51 palabras fuente · sin candidato Oceanic |
| EDITORIAL | experiencia | PARTIAL | 152 palabras fuente · sin candidato Oceanic |
| EDITORIAL | performance | PARTIAL | 32 palabras fuente · sin candidato Oceanic |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 8 en inventario (mín. 3) · descargadas 0/25 |
| MULTIMEDIA | interior | PARTIAL | 5 en inventario (mín. 2) · descargadas 0/25 |
| MULTIMEDIA | detail | PARTIAL | 3 en inventario (mín. 2) · descargadas 0/25 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.

## Información faltante o por revisar

- **Manga Casco** (REQUIRES_REVIEW): Manga publicada (10.86 m) mayor que el 60 % de la eslora (12,30 m): posible error de la web.
- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- **Capacidad Combustible** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Potencia motor máx** (NOT_FOUND): El bloque técnico no publica 'Max. engine power'.
- **Motorización** (NOT_FOUND): La web no publica motorización para este modelo.
- Equipamiento: la web no publica lista standard; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
