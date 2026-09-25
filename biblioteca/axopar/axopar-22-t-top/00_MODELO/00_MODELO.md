# Axopar 22 T-Top

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Axopar (Axopar Boats Oy, Finlandia) | S1 |
| GAMA | Axopar 22 (Axopar 22 T-Top, Axopar 22 Spyder) | S1 |
| MODEL | Axopar 22 T-Top | S1 |
| MODEL YEAR | 2027 (campo `modelYear` de la ficha web) | S1 |
| VARIANT | T-Top | S1 |
| TIPO | Motor (fueraborda) | S1 |
| PRECIO | NO ENCONTRADO (la web no publica precio) | S1 |
| URL OFICIAL | https://www.axopar.com/boat-models/axopar-22/axopar-22-t-top/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/axopar.py`.
- No se mezclan otras variantes de la gama (Axopar 22 Spyder).
- Imágenes: 37 del modelo, 3 de otro modelo (excluidas), 29 por revisar, 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 75% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | OK | tabla base 8/8 verificada |
| DATOS | especificaciones | OK | 15 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 108 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 142 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 313 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 241 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 438 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 65 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 6 en inventario (mín. 3) · descargadas 0/37 |
| MULTIMEDIA | interior | PARTIAL | 3 en inventario (mín. 2) · descargadas 0/37 |
| MULTIMEDIA | detail | PARTIAL | 12 en inventario (mín. 2) · descargadas 0/37 |
| MULTIMEDIA | video | OK | 3 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos (tabla base)

- **Desplazamiento en rosca**: Weight (excl. Engine) → La web publica el peso del barco sin motores: es el peso en rosca.
- **Camarotes**: Standard Features (grupos) → El equipamiento estándar y opcional no incluye cabina: sin camarote.
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
