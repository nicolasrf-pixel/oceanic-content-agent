# Antares 11 Coupe

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | Antares (Dayboats) | S1, S2 |
| MODEL | Antares 11 Coupe | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Antares 11 Coupe | S1 |
| TIPO | Motor | S1 |
| PRECIO | From 219 300 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/antares-outboard/antares-11-ob | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Antares 12 Coupe, Antares 7, Antares 7 Fishing, Antares 8, Antares 8 Fishing, Antares 9, Antares 11 Fly, Antares 12 Fly).
- Imágenes: 21 del modelo, 15 de otro modelo (excluidas), 3 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 83% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | OK | tabla base 8/8 verificada |
| DATOS | especificaciones | OK | 12 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | PARTIAL | optional.md |
| EDITORIAL | hero | OK | 40 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 57 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 46 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 51 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 106 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 111 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 15 en inventario (mín. 3) · descargadas 21/21 |
| MULTIMEDIA | interior | MISSING | 0 en inventario (mín. 2) · descargadas 21/21 |
| MULTIMEDIA | detail | OK | 3 en inventario (mín. 2) · descargadas 21/21 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motorización**: Max. engine power → Motorización = potencia máxima declarada en 'Max. engine power' + tipo de motor citado en el texto.

## Información faltante o por revisar

- Ninguna en la tabla técnica.
- Equipamiento: la web no publica lista standard; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
