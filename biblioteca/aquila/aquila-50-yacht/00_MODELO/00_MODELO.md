# Aquila 50 Yacht

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Aquila (Aquila USA Inc. / MarineMax, EE. UU.) | S1 |
| GAMA | Yacht (Power catamarans) | S1, S2 |
| MODEL | Aquila 50 Yacht | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Aquila 50 Yacht | S1 |
| TIPO | Catamarán a motor | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.aquilaboats.com/models/yachts/50 | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/aquila.py`.
- No se mezclan otros modelos de la gama (-).
- Imágenes: 18 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 58% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Velocidad máxima, Velocidad crucero

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 6/8 verificada · faltan: desplazamiento, capacidad_agua_dulce |
| DATOS | especificaciones | OK | 10 campos con fuente |
| DATOS | caracteristicas | MISSING | no existe |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | PARTIAL | 34 palabras fuente |
| EDITORIAL | introduccion | OK | 145 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 10 palabras fuente |
| EDITORIAL | ingenieria | PARTIAL | 10 palabras fuente |
| EDITORIAL | experiencia | PARTIAL | 10 palabras fuente |
| EDITORIAL | performance | OK | 162 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | PARTIAL | 2 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 1 en inventario (mín. 3) · descargadas 0/18 |
| MULTIMEDIA | interior | MISSING | 0 en inventario (mín. 2) · descargadas 0/18 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 0/18 |
| MULTIMEDIA | video | OK | 5 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Manga Casco**: Beam Overall → 'Beam overall' = manga publicada del catamarán.
- **Camarotes**: Cabin Configuration (standard) → 'Cabin Configuration (standard)': 3 cabin / 3 head + utility room.
- **Camarotes**: Cabin Configuration (optional) → Configuración opcional publicada en la ficha.
- **Certificación**: Texto de la página → La ficha técnica no publica este campo; el texto oficial declara la categoría CE.
- **Potencia motor máx**: Engine (standard) → Motorización estándar publicada (no hay opción más potente).
- **Baños**: Cabin Configuration (standard) → 'Cabin Configuration (standard)': 3 cabin / 3 head + utility room.
- **Baños**: Cabin Configuration (optional) → Configuración opcional publicada en la ficha.
- **Motorización**: Engine (standard) → Motorización publicada en la ficha técnica.

## Información faltante o por revisar

- **Desplazamiento en rosca** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Velocidad máxima** (REQUIRES_REVIEW): La web la declara estimada y no contractual: 'WOT @ 22knots / Cruise Speed @ 18-19 knots'.
- **Velocidad crucero** (REQUIRES_REVIEW): La web la declara estimada y no contractual: 'WOT @ 22knots / Cruise Speed @ 18-19 knots'.
- **Calado** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- Características (03): la página no tiene bloques de características con título.
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto.
