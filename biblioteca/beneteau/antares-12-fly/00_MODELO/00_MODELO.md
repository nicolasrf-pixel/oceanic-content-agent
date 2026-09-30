# Antares 12 Fly

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | Antares (Dayboats) | S1, S2 |
| MODEL | Antares 12 Fly | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Antares 12 Fly | S1 |
| TIPO | Motor | S1 |
| PRECIO | From 451 900 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/antares-outboard/antares-12 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Antares 12 Coupe, Antares 7, Antares 7 Fishing, Antares 8, Antares 8 Fishing, Antares 9, Antares 11 Coupe, Antares 11 Fly).
- Imágenes: 21 del modelo, 0 de otro modelo (excluidas), 1 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 86% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Capacidad Agua Dulce

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 7/8 verificada · en conflicto: capacidad_agua_dulce |
| DATOS | especificaciones | OK | 12 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | PARTIAL | optional.md |
| EDITORIAL | hero | OK | 69 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 63 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 99 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 51 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 311 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 84 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 12 en inventario (mín. 3) · descargadas 21/21 |
| MULTIMEDIA | interior | OK | 4 en inventario (mín. 2) · descargadas 21/21 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 21/21 |
| MULTIMEDIA | video | OK | 2 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Desplazamiento en rosca**: Dry Weight → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motorización**: Max. engine power → Motorización = potencia máxima declarada en 'Max. engine power' + 'Propulsion'.

## Información faltante o por revisar

- **Capacidad Agua Dulce** (CONFLICT): El bloque técnico publica '400 L' y '169 US Gal' (≈ 639,73 l): no coinciden. Decidir con el fabricante.
- Equipamiento: la web no publica lista standard; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
