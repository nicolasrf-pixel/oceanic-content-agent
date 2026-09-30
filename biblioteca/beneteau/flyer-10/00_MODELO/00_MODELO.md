# Flyer 10

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | Flyer (Dayboats) | S1, S2 |
| MODEL | Flyer 10 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Flyer 10 | S1 |
| TIPO | Motor | S1 |
| PRECIO | From 193 800 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/flyer/flyer-10 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Flyer 10 Sport Top, Flyer 30, Flyer 7 SPACEdeck, Flyer 7 SUNdeck, Flyer 8 SUNdeck, Flyer 8 SPACEdeck, Flyer 9 SPACEdeck, Flyer 9 SUNdeck).
- Imágenes: 21 del modelo, 0 de otro modelo (excluidas), 1 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 89% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 7/8 verificada · faltan: camarotes |
| DATOS | especificaciones | OK | 11 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 52 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 59 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 187 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 118 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 122 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 87 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 4 en inventario (mín. 3) · descargadas 21/21 |
| MULTIMEDIA | interior | OK | 4 en inventario (mín. 2) · descargadas 21/21 |
| MULTIMEDIA | detail | OK | 2 en inventario (mín. 2) · descargadas 21/21 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motorización**: Max. engine power → Motorización = potencia máxima declarada en 'Max. engine power' + tipo de motor citado en el texto.

## Información faltante o por revisar

- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- Equipamiento: la web no publica lista optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
