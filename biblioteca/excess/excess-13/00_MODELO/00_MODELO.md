# Excess 13

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Excess Catamarans (Groupe Beneteau, Burdeos, Francia) | S1 |
| GAMA | Excess 13 (Our catamarans) | S1, S2 |
| MODEL | Excess 13 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Excess 13 | S1 |
| TIPO | Catamarán a vela | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.excess-catamarans.com/our-catamarans/excess-13 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/excess.py`.
- No se mezclan otros modelos de la gama (Excess 11, Excess 13, Excess 14).
- Imágenes: 55 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 3 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 83% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | OK | tabla base 9/9 verificada |
| DATOS | especificaciones | OK | 17 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 74 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 63 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 173 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 233 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 127 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 437 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 21 en inventario (mín. 3) · descargadas 53/55 |
| MULTIMEDIA | interior | OK | 23 en inventario (mín. 2) · descargadas 53/55 |
| MULTIMEDIA | detail | OK | 4 en inventario (mín. 2) · descargadas 53/55 |
| MULTIMEDIA | video | OK | 2 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Eslora Total**: Overall length [std.] → 'Length overall' / 'Overall length [std.]' = eslora total de la versión estándar.
- **Manga Casco**: Beam → 'Beam' = manga máxima publicada del catamarán.
- **Desplazamiento en rosca**: Light displacement [Mlc]* → 'Light displacement' (EEC / MLC) = desplazamiento en rosca.
- **Capacidad Combustible**: Fuel capacity → La web publica 2 depósitos de 200 L ('2 x 200 L'): capacidad total 400 L.
- **Superficie vélica**: Upwind sail area → 'Upwind sail area' = superficie vélica de ceñida publicada (aparejo estándar).
- **Potencia motor auxiliar**: Engine → Motorización publicada '2 x 40 Hp': 2 motores de 40 hp.
- **Altura sobre línea de flotación**: Mast clearance [std./Pulse Line] → 'Mast clearance' = altura del mástil sobre la flotación (aparejo estándar).
- **Motor auxiliar**: Engine → Motorización del bloque técnico.
- **Arquitectura naval**: Texto de la página → El bloque técnico no publica este campo; el texto atribuye la arquitectura a Marc Lombard YDG (Eric Levet, Cabinet Lombard) y el diseño interior a Jean-Marc Piaton.

## Información faltante o por revisar

- Ninguna en la tabla técnica.
- Equipamiento: la web no publica lista standard ni optional; la web del producto no publica lista de equipamiento (el brochure se pide por formulario).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto; identificar en el portal MyExcess.
