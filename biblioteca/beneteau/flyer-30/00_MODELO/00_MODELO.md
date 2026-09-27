# Flyer 30

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | Flyer (Dayboats) | S1, S2 |
| MODEL | Flyer 30 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Flyer 30 | S1 |
| TIPO | Motor | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.beneteau.com/flyer/flyer-30 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Flyer 10 Sport Top, Flyer 7 SPACEdeck, Flyer 7 SUNdeck, Flyer 8 SUNdeck, Flyer 8 SPACEdeck, Flyer 9 SPACEdeck, Flyer 9 SUNdeck, Flyer 10).
- Imágenes: 43 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 44% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Potencia motor máx

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 4/8 verificada · faltan: desplazamiento, camarotes, certificacion · en conflicto: potencia_motor_maxima |
| DATOS | especificaciones | PARTIAL | 7 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | PARTIAL | optional.md |
| EDITORIAL | hero | PARTIAL | 58 palabras fuente · sin candidato Oceanic |
| EDITORIAL | introduccion | PARTIAL | 55 palabras fuente · sin candidato Oceanic |
| EDITORIAL | diseno | PARTIAL | 297 palabras fuente · sin candidato Oceanic |
| EDITORIAL | ingenieria | PARTIAL | 85 palabras fuente · sin candidato Oceanic |
| EDITORIAL | experiencia | PARTIAL | 90 palabras fuente · sin candidato Oceanic |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente · sin candidato Oceanic |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 15 en inventario (mín. 3) · descargadas 0/43 |
| MULTIMEDIA | interior | PARTIAL | 20 en inventario (mín. 2) · descargadas 0/43 |
| MULTIMEDIA | detail | PARTIAL | 3 en inventario (mín. 2) · descargadas 0/43 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.

## Información faltante o por revisar

- **Desplazamiento en rosca** (NOT_FOUND): No publicado en la web oficial del producto.
- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- **Certificación** (NOT_FOUND): No publicado en la web oficial del producto.
- **Potencia motor máx** (CONFLICT): El bloque técnico publica '2 x 300 CV' y '2 x 447 HP' (≈ 447,00 hp): no coinciden. Decidir con el fabricante.
- **Motorización** (NOT_FOUND): La web no publica motorización para este modelo.
- Equipamiento: la web no publica lista standard; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
