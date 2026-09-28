# Gran Turismo 40 Coupe

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | The new Gran Turismo range (Motor Yachts) | S1, S2 |
| MODEL | Gran Turismo 40 Coupe | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Gran Turismo 40 Coupe | S1 |
| TIPO | Motor | S1 |
| PRECIO | From 440 000 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/gran-turismo-new/gran-turismo-40-coupe | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Gran Turismo 40 Open, Gran Turismo 35, Gran Turismo 50).
- Imágenes: 33 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 78% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Manga Casco, Motorización

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 5/8 verificada · faltan: camarotes, potencia_motor_maxima · en conflicto: manga_casco |
| DATOS | especificaciones | PARTIAL | 9 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 92 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 90 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 156 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 51 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 180 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 176 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 17 en inventario (mín. 3) · descargadas 0/33 |
| MULTIMEDIA | interior | PARTIAL | 6 en inventario (mín. 2) · descargadas 0/33 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 0/33 |
| MULTIMEDIA | video | OK | 2 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motorización**: Texto de la página → Sin 'Max. engine power' en el bloque técnico; el texto cita motores sin declarar la gama completa.

## Información faltante o por revisar

- **Manga Casco** (CONFLICT): El bloque técnico publica '3.68 m' y '11'1' (≈ 3,38 m): no coinciden. Decidir con el fabricante.
- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- **Potencia motor máx** (NOT_FOUND): El bloque técnico no publica 'Max. engine power'.
- **Motorización** (REQUIRES_REVIEW): Texto oficial sobre motores: With twin Mercury Verado 400hp or Yanmar 320hp engines (as base engine options) the Gran Turismo 40 delivers thrilling speeds managed from a perfectly designed helm station | With base twin Mercury Verado 400hp outboards or Yanmar 320hp inboard engines, the Gran Turismo 40 delivers thrilling speeds paired with a helm console of masterful ergonomics
- Equipamiento: la web no publica lista optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
