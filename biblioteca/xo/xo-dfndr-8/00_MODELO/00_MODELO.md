# XO DFNDR 8

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | XO Boats Oy (Helsinki, Finlandia) | S1 |
| GAMA | DFNDR SERIES (Model Range) | S1, S2 |
| MODEL | XO DFNDR 8 | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | XO DFNDR 8 | S1 |
| TIPO | Motor (aluminio, casco en V profunda) | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://xoboats.com/xo-fleet/dfndr-8/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/xo.py`.
- No se mezclan otros modelos de la gama (-).
- Imágenes: 34 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 56% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 6/8 verificada · faltan: camarotes, capacidad_agua_dulce |
| DATOS | especificaciones | OK | 13 campos con fuente |
| DATOS | caracteristicas | MISSING | no existe |
| DATOS | equipamiento | PARTIAL | optional.md |
| EDITORIAL | hero | OK | 68 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 266 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | PARTIAL | 39 palabras fuente |
| EDITORIAL | ingenieria | PARTIAL | 10 palabras fuente |
| EDITORIAL | experiencia | PARTIAL | 10 palabras fuente |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 30 en inventario (mín. 3) · descargadas 34/34 |
| MULTIMEDIA | interior | PARTIAL | 1 en inventario (mín. 2) · descargadas 34/34 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 34/34 |
| MULTIMEDIA | video | MISSING | 0 videos del modelo |
| DOCUMENTOS | brochure | OK | 1 documento(s) con enlace oficial |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Eslora Total**: Overall Lenght (exc. engine) → 'Overall Lenght (exc. engine)' = eslora total publicada (sin motores fueraborda).
- **Desplazamiento en rosca**: Weight (excl. engine) → 'Weight (excl. engine)' = desplazamiento en rosca (peso sin motor), como en el 37 XC.
- **Certificación**: Classification → 'Classification' + 'Passengers' = categoría CE : personas (posición a posición).
- **Certificación**: Passengers → 'Classification' + 'Passengers' = categoría CE : personas (posición a posición).
- **Potencia motor máx**: Outboard engines → Extremo superior de la fila de motores publicada (motorización más potente ofrecida).
- **Calado**: Draft to props → 'Draft to props' = calado hasta las hélices.

## Información faltante o por revisar

- **Camarotes** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Capacidad Agua Dulce** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- Equipamiento: la web no publica lista standard; la web no publica listas de equipamiento estándar/opcional en la página del producto (el configurador es una herramienta comercial).
- Características (03): la página no tiene bloques de características con título.
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto.
