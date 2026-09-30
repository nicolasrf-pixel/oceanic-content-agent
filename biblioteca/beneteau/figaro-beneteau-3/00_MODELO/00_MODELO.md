# Figaro Beneteau 3

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | Figaro (Sailboats) | S1, S2 |
| MODEL | Figaro Beneteau 3 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Figaro Beneteau 3 | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | From 221 900 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/figaro/figaro-beneteau-3 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (-).
- Imágenes: 14 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 72% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 6/9 verificada · faltan: camarotes, capacidad_agua_dulce, superficie_velica |
| DATOS | especificaciones | OK | 12 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 74 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 89 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 10 palabras fuente |
| EDITORIAL | ingenieria | OK | 204 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | PARTIAL | 10 palabras fuente |
| EDITORIAL | performance | OK | 93 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 1 candidatas |
| MULTIMEDIA | exterior | OK | 7 en inventario (mín. 3) · descargadas 14/14 |
| MULTIMEDIA | interior | MISSING | 0 en inventario (mín. 2) · descargadas 14/14 |
| MULTIMEDIA | detail | OK | 4 en inventario (mín. 2) · descargadas 14/14 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Potencia motor auxiliar**: Max. engine power → 'Max. engine power' de un velero = potencia máxima del motor auxiliar.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motor auxiliar**: Max. engine power → Motor auxiliar = 'Max. engine power' del bloque técnico (la web no publica marca ni modelo).
- **Mayor**: Mainsail area → Superficie de la vela declarada en el texto técnico de la página.
- **Génova**: Jib area → Superficie de la vela declarada en el texto técnico de la página. La web la llama 'Jib' (foque).

## Información faltante o por revisar

- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en el bloque técnico ni en el texto de la página.
- **Superficie vélica** (NOT_FOUND): Beneteau no publica la superficie vélica en la web del producto (ni en el bloque técnico ni en el texto). Figura en la lista de equipamiento PDF, que es documento y no aporta datos.
- Equipamiento: la web no publica lista standard ni optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
