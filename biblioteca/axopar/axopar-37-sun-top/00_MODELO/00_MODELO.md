# Axopar 37 Sun Top

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Axopar (Axopar Boats Oy, Finlandia) | S1 |
| GAMA | Axopar 37 (Axopar 37 Sun Top, Axopar 37 Spyder, Axopar 37 XC Cross Cabin) | S1 |
| MODEL | Axopar 37 Sun Top | S1 |
| MODEL YEAR | 2027 (campo `modelYear` de la ficha web) | S1 |
| VARIANT | Sun Top | S1 |
| TIPO | Motor (fueraborda) | S1 |
| PRECIO | NO ENCONTRADO (la web no publica precio) | S1 |
| URL OFICIAL | https://www.axopar.com/boat-models/axopar-37/axopar-37-sun-top/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/axopar.py`.
- No se mezclan otras variantes de la gama (Axopar 37 Spyder, Axopar 37 XC Cross Cabin).
- Imágenes: 55 del modelo, 2 de otro modelo (excluidas), 10 por revisar, 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 86% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | OK | tabla base 8/8 verificada |
| DATOS | especificaciones | OK | 16 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 94 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 141 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 182 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 150 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 648 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 116 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 9 en inventario (mín. 3) · descargadas 55/55 |
| MULTIMEDIA | interior | OK | 18 en inventario (mín. 2) · descargadas 55/55 |
| MULTIMEDIA | detail | OK | 7 en inventario (mín. 2) · descargadas 55/55 |
| MULTIMEDIA | video | OK | 6 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos (tabla base)

- **Desplazamiento en rosca**: Weight (excl. Engine) → La web publica el peso del barco sin motores: es el peso en rosca.
- **Camarotes**: Front Cabin (Standard Features) → Cabina de proa de serie.
- **Camarotes**: Optional Equipment → Cabina de popa opcional.
- **Capacidad Agua Dulce**: Freshwater tank 100l → No está en la ficha técnica; se toma del equipamiento de la misma web.
- **Certificación**: Category + Passengers → Cruce de 'Category' y 'Passengers' en formato Oceanic (categoría + personas).
- **Potencia motor máx**: Outboard engines → Extremo superior de la motorización publicada.
- **Potencia motor máx**: Engine (Optional Equipment) → Motorización más potente ofrecida.
- **Baños**: Standard Features → WC de serie en el equipamiento estándar.

## Información faltante o por revisar

- Ninguna en la tabla técnica.
- Traducción al español del equipamiento: pendiente.
- Brochure oficial: no encontrado en axopar.com.
- Manual del propietario: identificar en https://manuals.axopar.com/ (portal oficial).
