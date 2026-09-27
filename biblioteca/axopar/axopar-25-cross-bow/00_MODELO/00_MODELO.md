# Axopar 25 Cross Bow

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Axopar (Axopar Boats Oy, Finlandia) | S1 |
| GAMA | Axopar 25 (Axopar 25 Cross Bow, Axopar 25 Cross Top) | S1 |
| MODEL | Axopar 25 Cross Bow | S1 |
| MODEL YEAR | 2027 (campo `modelYear` de la ficha web) | S1 |
| VARIANT | Cross Bow | S1 |
| TIPO | Motor (fueraborda) | S1 |
| PRECIO | NO ENCONTRADO (la web no publica precio) | S1 |
| URL OFICIAL | https://www.axopar.com/boat-models/axopar-25/axopar-25-cross-bow/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/axopar.py`.
- No se mezclan otras variantes de la gama (Axopar 25 Cross Top).
- Imágenes: 46 del modelo, 4 de otro modelo (excluidas), 4 por revisar, 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 86% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | OK | tabla base 8/8 verificada |
| DATOS | especificaciones | OK | 16 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 44 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 101 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 314 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 91 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 161 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 69 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 7 en inventario (mín. 3) · descargadas 45/46 |
| MULTIMEDIA | interior | OK | 3 en inventario (mín. 2) · descargadas 45/46 |
| MULTIMEDIA | detail | OK | 12 en inventario (mín. 2) · descargadas 45/46 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos (tabla base)

- **Desplazamiento en rosca**: Weight (excl. Engine) → La web publica el peso del barco sin motores: es el peso en rosca.
- **Camarotes**: Front Cabin (Standard Features) → Cabina de proa de serie.
- **Capacidad Agua Dulce**: Fresh Water System 32L Including Aft Deck Shower → No está en la ficha técnica; se toma del equipamiento de la misma web.
- **Certificación**: Category + Passengers → Cruce de 'Category' y 'Passengers' en formato Oceanic (categoría + personas).
- **Potencia motor máx**: Outboard engines → Extremo superior de la motorización publicada.
- **Potencia motor máx**: Engine (Optional Equipment) → Motorización más potente ofrecida.
- **Baños**: Optional Equipment → WC solo como opción.

## Información faltante o por revisar

- Ninguna en la tabla técnica.
- Traducción al español del equipamiento: pendiente.
- Brochure oficial: no encontrado en axopar.com.
- Manual del propietario: identificar en https://manuals.axopar.com/ (portal oficial).
