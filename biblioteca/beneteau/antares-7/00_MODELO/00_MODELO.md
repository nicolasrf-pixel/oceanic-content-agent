# Antares 7

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | Antares (Dayboats) | S1, S2 |
| MODEL | Antares 7 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Antares 7 | S1 |
| TIPO | Motor | S1 |
| PRECIO | From 45 000 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/antares-outboard/antares-7 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Antares 12 Coupe, Antares 7 Fishing, Antares 8, Antares 8 Fishing, Antares 9, Antares 11 Coupe, Antares 11 Fly, Antares 12 Fly).
- Imágenes: 34 del modelo, 0 de otro modelo (excluidas), 2 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 64% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 7/8 verificada · faltan: camarotes |
| DATOS | especificaciones | OK | 11 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | PARTIAL | optional.md |
| EDITORIAL | hero | PARTIAL | 84 palabras fuente · sin candidato Oceanic |
| EDITORIAL | introduccion | PARTIAL | 94 palabras fuente · sin candidato Oceanic |
| EDITORIAL | diseno | PARTIAL | 97 palabras fuente · sin candidato Oceanic |
| EDITORIAL | ingenieria | PARTIAL | 51 palabras fuente · sin candidato Oceanic |
| EDITORIAL | experiencia | PARTIAL | 197 palabras fuente · sin candidato Oceanic |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente · sin candidato Oceanic |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 17 en inventario (mín. 3) · descargadas 0/34 |
| MULTIMEDIA | interior | PARTIAL | 7 en inventario (mín. 2) · descargadas 0/34 |
| MULTIMEDIA | detail | PARTIAL | 3 en inventario (mín. 2) · descargadas 0/34 |
| MULTIMEDIA | video | OK | 2 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motorización**: Max. engine power → Motorización = potencia máxima declarada en 'Max. engine power'.

## Información faltante o por revisar

- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- Equipamiento: la web no publica lista standard; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
