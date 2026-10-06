# Excess 14

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Excess Catamarans (Groupe Beneteau, Burdeos, Francia) | S1 |
| GAMA | Excess 14 (Our catamarans) | S1, S2 |
| MODEL | Excess 14 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Excess 14 | S1 |
| TIPO | Catamarán a vela | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.excess-catamarans.com/our-catamarans/excess-14 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/excess.py`.
- No se mezclan otros modelos de la gama (Excess 11, Excess 13, Excess 14).
- Imágenes: 65 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 83% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | OK | tabla base 9/9 verificada |
| DATOS | especificaciones | OK | 19 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 64 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 50 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 10 palabras fuente |
| EDITORIAL | ingenieria | OK | 520 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 198 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 32 en inventario (mín. 3) · descargadas 61/65 |
| MULTIMEDIA | interior | OK | 19 en inventario (mín. 2) · descargadas 61/65 |
| MULTIMEDIA | detail | OK | 3 en inventario (mín. 2) · descargadas 61/65 |
| MULTIMEDIA | video | OK | 2 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Eslora Total**: Overall length [std.] → 'Length overall' / 'Overall length [std.]' = eslora total de la versión estándar.
- **Manga Casco**: Beam → 'Beam' = manga máxima publicada del catamarán.
- **Desplazamiento en rosca**: Light displacement [Mlc] → 'Light displacement' (EEC / MLC) = desplazamiento en rosca.
- **Camarotes**: Layouts (títulos de los planos) → El bloque técnico no publica número de cabinas: se toma de los títulos de los planos oficiales.
- **Capacidad Combustible**: Fuel capacity → La web publica 2 depósitos de 200 L ('2 x 200 L'): capacidad total 400 L.
- **Superficie vélica**: Upwind sail area → 'Upwind sail area' = superficie vélica de ceñida publicada (aparejo estándar).
- **Potencia motor auxiliar**: Engines [std.] → Motorización publicada '2 x 45 HP': 2 motores de 45 hp.
- **Altura sobre línea de flotación**: Mast clearance (std/pulse) → 'Mast clearance' = altura del mástil sobre la flotación (aparejo estándar).
- **Tanque de aguas negras**: Black water capacity → La web publica 2 depósitos de 80 L ('2 x 80 L'): capacidad total 160 L.
- **Motor auxiliar**: Engines [std.] → Motorización del bloque técnico.
- **Arquitectura naval**: Texto de la página → El bloque técnico no publica este campo; el texto cita la colaboración con VPLP design para las líneas del barco.
- **Baños**: Texto de la página → El bloque técnico no publica este campo; la versión de 4 camarotes declara 4 baños; la de 3 camarotes no publica el número.

## Información faltante o por revisar

- Ninguna en la tabla técnica.
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto; identificar en el portal MyExcess.
