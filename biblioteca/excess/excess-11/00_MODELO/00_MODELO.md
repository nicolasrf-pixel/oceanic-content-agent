# Excess 11

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Excess Catamarans (Groupe Beneteau, Burdeos, Francia) | S1 |
| GAMA | Excess 11 (Our catamarans) | S1, S2 |
| MODEL | Excess 11 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Excess 11 | S1 |
| TIPO | Catamarán a vela | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.excess-catamarans.com/our-catamarans/excess-11 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/excess.py`.
- No se mezclan otros modelos de la gama (Excess 11, Excess 13, Excess 14).
- Imágenes: 70 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 72% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | OK | tabla base 9/9 verificada |
| DATOS | especificaciones | OK | 18 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | PARTIAL | optional.md |
| EDITORIAL | hero | OK | 120 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 108 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 92 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 347 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 157 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 57 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 26 en inventario (mín. 3) · descargadas 0/70 |
| MULTIMEDIA | interior | PARTIAL | 14 en inventario (mín. 2) · descargadas 0/70 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 0/70 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Eslora Total**: Length overall → 'Length overall' / 'Overall length [std.]' = eslora total de la versión estándar.
- **Manga Casco**: Beam → 'Beam' = manga máxima publicada del catamarán.
- **Desplazamiento en rosca**: Light displacement [EEC] → 'Light displacement' (EEC / MLC) = desplazamiento en rosca.
- **Camarotes**: Layouts (títulos de los planos) → El bloque técnico no publica número de cabinas: se toma de los títulos de los planos oficiales.
- **Capacidad Combustible**: Fuel capacity → La web publica 2 depósitos de 200 L ('2 x 200 L'): capacidad total 400 L.
- **Superficie vélica**: Upwind sail area → 'Upwind sail area' = superficie vélica de ceñida publicada (aparejo estándar).
- **Potencia motor auxiliar**: Engines → Motorización publicada '2 x 29 HP': 2 motores de 29 hp.
- **Altura sobre línea de flotación**: Mast clearance → 'Mast clearance' = altura del mástil sobre la flotación (aparejo estándar).
- **Motor auxiliar**: Engines → Motorización del bloque técnico.
- **Arquitectura naval**: Texto de la página → Créditos citados literalmente en el texto de la página.

## Información faltante o por revisar

- Ninguna en la tabla técnica.
- Equipamiento: la web no publica lista standard; la web del producto no publica lista de equipamiento (el brochure se pide por formulario).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto; identificar en el portal MyExcess.
