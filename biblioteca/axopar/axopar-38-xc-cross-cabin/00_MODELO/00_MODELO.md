# Axopar 38 XC Cross Cabin

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Axopar (Axopar Boats Oy, Finlandia) | S1 |
| GAMA | Axopar 38 (Axopar 38 XC Cross Cabin, Axopar 38 Cross Top, Axopar 38 Sun Top) | S1 |
| MODEL | Axopar 38 XC Cross Cabin | S1 |
| MODEL YEAR | 2027 (campo `modelYear` de la ficha web) | S1 |
| VARIANT | XC Cross Cabin | S1 |
| TIPO | Motor (fueraborda) | S1 |
| PRECIO | NO ENCONTRADO (la web no publica precio) | S1 |
| URL OFICIAL | https://www.axopar.com/boat-models/axopar-38/axopar-38-xc-cross-cabin/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/axopar.py`.
- No se mezclan otras variantes de la gama (Axopar 38 Cross Top, Axopar 38 Sun Top).
- Imágenes: 71 del modelo, 1 de otro modelo (excluidas), 1 por revisar, 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 72% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 7/8 verificada · faltan: capacidad_agua_dulce |
| DATOS | especificaciones | OK | 16 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 97 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 165 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 309 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 149 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 927 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 416 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 17 en inventario (mín. 3) · descargadas 0/71 |
| MULTIMEDIA | interior | PARTIAL | 15 en inventario (mín. 2) · descargadas 0/71 |
| MULTIMEDIA | detail | PARTIAL | 14 en inventario (mín. 2) · descargadas 0/71 |
| MULTIMEDIA | video | OK | 14 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos (tabla base)

- **Desplazamiento en rosca**: Weight (excl. Engine) → La web publica el peso del barco sin motores: es el peso en rosca.
- **Camarotes**: Front Cabin (Standard Features) → Cabina de proa de serie.
- **Camarotes**: Optional Equipment → Cabina de popa opcional.
- **Certificación**: Category + Passengers → Cruce de 'Category' y 'Passengers' en formato Oceanic (categoría + personas).
- **Potencia motor máx**: Outboard engines → Extremo superior de la motorización publicada.
- **Baños**: Standard Features → WC de serie en el equipamiento estándar.
- **Consumo crucero**: Fuel capacity → Publicado bajo la etiqueta 'Fuel capacity' (error de la fuente).

## Información faltante o por revisar

- **Capacidad Agua Dulce** (NOT_FOUND): La web no publica un volumen de agua dulce.
- Traducción al español del equipamiento: pendiente.
- Brochure oficial: no encontrado en axopar.com.
- Manual del propietario: identificar en https://manuals.axopar.com/ (portal oficial).
