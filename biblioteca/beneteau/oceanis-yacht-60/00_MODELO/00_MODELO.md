# Oceanis Yacht 60

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | Oceanis Yacht (Sailboats) | S1, S2 |
| MODEL | Oceanis Yacht 60 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Oceanis Yacht 60 | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | From 1 029 900 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/oceanis-yacht/oceanis-yacht-60 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Oceanis Yacht 54).
- Imágenes: 44 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 78% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Desplazamiento en rosca, Capacidad Agua Dulce, Altura sobre línea de flotación

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 6/9 verificada · faltan: superficie_velica · en conflicto: desplazamiento, capacidad_agua_dulce |
| DATOS | especificaciones | OK | 13 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | PARTIAL | 32 palabras fuente |
| EDITORIAL | introduccion | OK | 78 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 167 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 128 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 232 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 22 en inventario (mín. 3) · descargadas 0/44 |
| MULTIMEDIA | interior | PARTIAL | 12 en inventario (mín. 2) · descargadas 0/44 |
| MULTIMEDIA | detail | PARTIAL | 3 en inventario (mín. 2) · descargadas 0/44 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Camarotes**: Layouts (pestañas) → El bloque técnico no publica 'Cabin Number': se toma el número de cabinas de los títulos de los layouts oficiales.
- **Potencia motor auxiliar**: Max. engine power → 'Max. engine power' de un velero = potencia máxima del motor auxiliar.
- **Baños**: Layouts (pestañas) → Número de baños/aseos según los títulos de los layouts oficiales.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motor auxiliar**: Max. engine power → Motor auxiliar = 'Max. engine power' del bloque técnico (la web no publica marca ni modelo).

## Información faltante o por revisar

- **Desplazamiento en rosca** (CONFLICT): El bloque técnico publica '21700 kg' y '11,020 lbs' (≈ 4.998,56 kg): no coinciden. Decidir con el fabricante.
- **Capacidad Agua Dulce** (CONFLICT): El bloque técnico publica '860 L' y '211 US Gal' (≈ 798,72 l): no coinciden. Decidir con el fabricante.
- **Superficie vélica** (NOT_FOUND): Beneteau no publica la superficie vélica en la web del producto (ni en el bloque técnico ni en el texto). Figura en la lista de equipamiento PDF, que es documento y no aporta datos.
- **Altura sobre línea de flotación** (CONFLICT): El bloque técnico publica '24.5 m' y '75’6’’' (≈ 23,01 m): no coinciden. Decidir con el fabricante.
- Equipamiento: la web no publica lista optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
