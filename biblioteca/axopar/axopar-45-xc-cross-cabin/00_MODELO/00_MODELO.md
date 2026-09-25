# Axopar 45 XC Cross Cabin

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Axopar (Axopar Boats Oy, Finlandia) | S1 |
| GAMA | Axopar 45 (Axopar 45 XC Cross Cabin, Axopar 45 Cross Top, Axopar 45 Sun Top) | S1 |
| MODEL | Axopar 45 XC Cross Cabin | S1 |
| MODEL YEAR | 2027 (campo `modelYear` de la ficha web) | S1 |
| VARIANT | XC Cross Cabin | S1 |
| TIPO | Motor (fueraborda) | S1 |
| PRECIO | NO ENCONTRADO (la web no publica precio) | S1 |
| URL OFICIAL | https://www.axopar.com/boat-models/axopar-45/axopar-45-xc-cross-cabin/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/axopar.py`.
- No se mezclan otras variantes de la gama (Axopar 45 Cross Top, Axopar 45 Sun Top).
- Imágenes: 43 del modelo, 6 de otro modelo (excluidas), 13 por revisar, 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 81% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 7/8 verificada · faltan: capacidad_agua_dulce |
| DATOS | especificaciones | OK | 15 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 92 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 171 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 314 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 106 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 651 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 5 en inventario (mín. 3) · descargadas 42/43 |
| MULTIMEDIA | interior | OK | 18 en inventario (mín. 2) · descargadas 42/43 |
| MULTIMEDIA | detail | OK | 12 en inventario (mín. 2) · descargadas 42/43 |
| MULTIMEDIA | video | OK | 5 videos del modelo |
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

## Información faltante o por revisar

- **Capacidad Agua Dulce** (NOT_FOUND): La web no publica un volumen de agua dulce (menciona: Freshwater system.).
- Traducción al español del equipamiento: pendiente.
- Brochure oficial: no encontrado en axopar.com.
- Manual del propietario: identificar en https://manuals.axopar.com/ (portal oficial).
