# Aquila 42 Yacht

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Aquila (Aquila USA Inc. / MarineMax, EE. UU.) | S1 |
| GAMA | Yacht (Power catamarans) | S1, S2 |
| MODEL | Aquila 42 Yacht | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Aquila 42 Yacht | S1 |
| TIPO | Catamarán a motor | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.aquilaboats.com/models/yachts/42 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/aquila.py`.
- No se mezclan otros modelos de la gama (-).
- Imágenes: 18 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 67% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Certificación

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 4/8 verificada · faltan: capacidad_combustible, capacidad_agua_dulce, potencia_motor_maxima · en conflicto: certificacion |
| DATOS | especificaciones | PARTIAL | 8 campos con fuente |
| DATOS | caracteristicas | MISSING | no existe |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 46 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 148 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 10 palabras fuente |
| EDITORIAL | ingenieria | PARTIAL | 10 palabras fuente |
| EDITORIAL | experiencia | PARTIAL | 10 palabras fuente |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 7 en inventario (mín. 3) · descargadas 18/18 |
| MULTIMEDIA | interior | OK | 5 en inventario (mín. 2) · descargadas 18/18 |
| MULTIMEDIA | detail | OK | 2 en inventario (mín. 2) · descargadas 18/18 |
| MULTIMEDIA | video | OK | 3 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam Overall → 'Beam overall' = manga publicada del catamarán.
- **Desplazamiento en rosca**: Light Displacement → Peso en vacío publicado ('Light Displacement' / 'Dry Weight') = desplazamiento en rosca.
- **Camarotes**: Cabins/Heads/Showers → 'Cabins/Heads/Showers': el primer número es cabinas.
- **Baños**: Cabins/Heads/Showers → 'Cabins/Heads/Showers': el segundo número es baños.

## Información faltante o por revisar

- **Capacidad Combustible** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Certificación** (REQUIRES_REVIEW): La web publica 'A: 8, B:12, C:16, D:2': el número de personas no crece de A a D (posible error de la web).
- **Potencia motor máx** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Calado** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Motorización** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- Equipamiento: la web no publica lista standard ni optional; la web publica la ficha 'Spec Sheet' en PDF (documento, no aporta datos).
- Características (03): la página no tiene bloques de características con título.
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto.
