# Gran Turismo 45 Open

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | BENETEAU (Groupe Beneteau, Francia) | S1 |
| GAMA | The new Gran Turismo range (Our yachts) | S1, S2 |
| MODEL | Gran Turismo 45 Open | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Gran Turismo 45 Open | S1 |
| TIPO | Motor | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.beneteau.com/new-gran-turismo-range/gran-turismo-45-open | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/beneteau.py`.
- No se mezclan otros modelos de la gama (Gran Turismo 40 Open, Gran Turismo 35, Gran Turismo 40 Coupe, Gran Turismo 50).
- Imágenes: 17 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 1 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 64% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Motorización

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 6/8 verificada · faltan: certificacion, potencia_motor_maxima |
| DATOS | especificaciones | OK | 10 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | PARTIAL | 27 palabras fuente |
| EDITORIAL | introduccion | OK | 55 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 171 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 132 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 268 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 51 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 5 en inventario (mín. 3) · descargadas 0/17 |
| MULTIMEDIA | interior | PARTIAL | 1 en inventario (mín. 2) · descargadas 0/17 |
| MULTIMEDIA | detail | PARTIAL | 4 en inventario (mín. 2) · descargadas 0/17 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Manga Casco**: Beam overall → 'Beam overall' (manga máxima) es la manga publicada del casco.
- **Desplazamiento en rosca**: Lightship Displacement → 'Lightship Displacement' = desplazamiento en rosca.
- **Desplazamiento en rosca**: Dry Weight → 'Lightship Displacement' = desplazamiento en rosca.
- **Arquitectura naval**: Créditos (descripción) → Créditos de arquitectura naval y diseño publicados junto a la descripción.
- **Motorización**: Texto de la página → Sin 'Max. engine power' en el bloque técnico; el texto cita motores sin declarar la gama completa.

## Información faltante o por revisar

- **Certificación** (NOT_FOUND): No publicado en la web oficial del producto.
- **Potencia motor máx** (NOT_FOUND): El bloque técnico no publica 'Max. engine power'.
- **Motorización** (REQUIRES_REVIEW): Texto oficial sobre motores: Select from twin Volvo Penta inboard engines rated at 440 or 480 hp, or triple Mercury outboards delivering 350 or 425 hp | Twin Volvo Penta inboard engines | Triple Mercury outboard engines
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: identificar en el Help Center oficial (help.beneteau.com).
