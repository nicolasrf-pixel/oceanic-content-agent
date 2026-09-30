# Gran Turismo 35

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | The new Gran Turismo range (Motor Yachts) | S1, S2 |
| MODEL | Gran Turismo 35 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Gran Turismo 35 | S1 |
| TIPO | Motor | S1 |
| PRECIO | From 281 800 € (VAT excluded) | S1 |
| URL OFICIAL | https://www.beneteau.com/gran-turismo-new/gran-turismo-35 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Gran Turismo 40 Open, Gran Turismo 40 Coupe, Gran Turismo 50).
- Imágenes: 26 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 83% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Manga Casco, Motorización

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 5/8 verificada · faltan: camarotes, potencia_motor_maxima · en conflicto: manga_casco |
| DATOS | especificaciones | PARTIAL | 9 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 73 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 72 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 107 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 140 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 213 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 59 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 10 en inventario (mín. 3) · descargadas 26/26 |
| MULTIMEDIA | interior | OK | 7 en inventario (mín. 2) · descargadas 26/26 |
| MULTIMEDIA | detail | PARTIAL | 1 en inventario (mín. 2) · descargadas 26/26 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
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

- **Manga Casco** (CONFLICT): El bloque técnico publica '3.24 m' y '15’3’’' (≈ 4,65 m): no coinciden. Decidir con el fabricante.
- **Camarotes** (NOT_FOUND): No publicado en la web oficial del producto.
- **Potencia motor máx** (NOT_FOUND): El bloque técnico no publica 'Max. engine power'.
- **Motorización** (REQUIRES_REVIEW): Texto oficial sobre motores: Powered by twin Mercury Verado outboards, the base Gran Turismo 35 reaches over 41 knots, delivering thrilling speed and diamond-cut handling
- Equipamiento: la web no publica lista standard ni optional; ver la lista de equipamiento PDF en 06_DOCUMENTOS (documento, no aporta datos).
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
