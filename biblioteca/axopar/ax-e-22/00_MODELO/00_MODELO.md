# AX/E 22

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Axopar (Axopar Boats Oy, Finlandia) | S1 |
| GAMA | AX/E 100% Electric (AX/E 22, AX/E 25) | S1 |
| MODEL | AX/E 22 | S1 |
| MODEL YEAR | 2027 (campo `modelYear` de la ficha web) | S1 |
| VARIANT | AX/E 22 | S1 |
| TIPO | Motor eléctrico | S1 |
| PRECIO | NO ENCONTRADO (la web no publica precio) | S1 |
| URL OFICIAL | https://www.axopar.com/boat-models/ax-e-100-electric/ax-e-22/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/axopar.py`.
- No se mezclan otras variantes de la gama (AX/E 25).
- Imágenes: 27 del modelo, 2 de otro modelo (excluidas), 3 por revisar, 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = RED** · completitud 72% (informativa; el estado lo deciden las reglas)

Falta crítico: tabla_tecnica

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | MISSING | tabla base 3/8 verificada · faltan: eslora_total, manga_casco, desplazamiento, camarotes, certificacion |
| DATOS | especificaciones | PARTIAL | 7 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 90 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 227 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 112 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 605 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 140 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 135 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 3 candidatas |
| MULTIMEDIA | exterior | OK | 5 en inventario (mín. 3) · descargadas 26/27 |
| MULTIMEDIA | interior | OK | 13 en inventario (mín. 2) · descargadas 26/27 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 26/27 |
| MULTIMEDIA | video | OK | 2 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos (tabla base)

- **Capacidad batería**: Efficient Power, Seamless Exploration → Eléctrico: la capacidad de batería reemplaza a la de combustible.
- **Capacidad Agua Dulce**: Fresh Water System 32L Including Aft Deck Shower → No está en la ficha técnica; se toma del equipamiento de la misma web.
- **Potencia motor máx**: Banner de performance → Motor eléctrico: potencia declarada en el texto.
- **Baños**: Optional Equipment → WC solo como opción.

## Información faltante o por revisar

- **Eslora Total** (NOT_FOUND): La web oficial del producto no publica la eslora.
- **Manga Casco** (NOT_FOUND): La web oficial del producto no publica la manga.
- **Desplazamiento en rosca** (NOT_FOUND): La web oficial del producto no publica peso ni desplazamiento.
- **Camarotes** (NOT_FOUND): La web no publica equipamiento ni menciona cabina.
- **Certificación** (NOT_FOUND): no publicado en la web oficial del producto.
- **Calado** (NOT_FOUND): La web oficial del producto no publica este dato.
- Traducción al español del equipamiento: pendiente.
- Brochure oficial: no encontrado en axopar.com.
- Manual del propietario: identificar en https://manuals.axopar.com/ (portal oficial).
