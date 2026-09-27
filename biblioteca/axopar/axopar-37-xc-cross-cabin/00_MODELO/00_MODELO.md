# Axopar 37 XC Cross Cabin

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Axopar (Axopar Boats Oy, Finlandia) | S1 |
| GAMA | Axopar 37 (XC Cross Cabin, Sun Top, Spyder) | S1, S3 |
| MODEL | Axopar 37 XC Cross Cabin | S1 |
| MODEL YEAR | 2027 (campo `modelYear` de la ficha web) | S1 |
| GENERACIÓN | Gama 37 actual, desde MY2020. La Mark 1 (MY2016–MY2019) es otra generación. | S4 |
| VARIANT | XC Cross Cabin (cabina cerrada). No confundir con 37 Sun Top ni 37 Spyder. | S1 |
| CONFIGURATION | Base: popa abierta (Open Aft). Layouts de popa y de cabina opcionales en `04_EQUIPAMIENTO/configurations.md`. | S1 |
| ENGINE OPTION | Fueraborda 2 x 300 – 2 x 400 hp (Mercury Verado V8 300, V10 350, V10 400). | S1 |
| EDICIONES / PAQUETES | Iconic Edition, BRABUS Performance Line, Mediterrana Edition (de toda la gama 37). | S1 |
| TIPO | Motor (walkaround con cabina, fueraborda) | — |
| PRECIO | NO ENCONTRADO (la web publica 0 en todos los campos de precio) | S1 |
| URL OFICIAL | https://www.axopar.com/boat-models/axopar-37/axopar-37-xc-cross-cabin/ | S1 |

## Reglas de alcance aplicadas a este paquete

- **Datos solo de la web oficial** (S1, S3). El Owner's Manual (S2) está identificado como documento pero no aporta datos.
- Model year de los datos: **MY2027**, el que declara la ficha web.
- No se usan datos del 37 Sun Top, del 37 Spyder, del nuevo 38 XC ni de la Mark 1.
- **"37 XC Revolution"**: nombre usado por terceros para el lanzamiento MY2020. Ninguna fuente oficial revisada lo usa. **REQUIRES REVIEW**, no se usa como variante.
- La propia página oficial del 37 XC incluye 3 imágenes del **37 Sun Top** (tags `ax37st` o título "Sun-Top"). Quedaron excluidas (`OTHER_MODEL`).

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 92% (informativa; el estado lo deciden las reglas)


| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | OK | tabla base 8/8 verificada |
| DATOS | especificaciones | OK | 17 campos con fuente |
| DATOS | caracteristicas | OK | presente |
| DATOS | equipamiento | OK | standard.md, optional.md |
| EDITORIAL | hero | OK | 168 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 300 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 523 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | OK | 330 palabras fuente · candidato Oceanic presente |
| EDITORIAL | experiencia | OK | 453 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | OK | 237 palabras fuente · candidato Oceanic presente |
| MULTIMEDIA | hero_image | OK | 5 candidatas |
| MULTIMEDIA | exterior | OK | 11 en inventario (mín. 3) · descargadas 50/51 |
| MULTIMEDIA | interior | OK | 8 en inventario (mín. 2) · descargadas 50/51 |
| MULTIMEDIA | detail | OK | 6 en inventario (mín. 2) · descargadas 50/51 |
| MULTIMEDIA | video | OK | 12 videos del modelo |
| DOCUMENTOS | brochure | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | technical | PARTIAL | 1 identificado(s) · requiere revisión |
| DOCUMENTOS | manual | OK | 1 documento(s) con enlace oficial |
<!-- READINESS:END -->

## Información faltante

- Tabla base completa desde la web del producto. Cruces: desplazamiento en rosca = 'Weight (excl. Engine)'; camarotes = cabina de proa de serie + cabina de popa opcional; certificación = 'Category' + 'Passengers'; potencia máx = extremo superior de 'Outboard engines'.
- Autonomía absoluta: NO ENCONTRADO (la web solo da +75 mn frente al predecesor).
- Velocidad crucero: se publica '-' (la web solo la menciona en un texto promocional, sin motorización).
- Combustible: se publica 722 l (ficha técnica). La mención de 730 l en el equipamiento estándar no se publica.
- Brochure oficial: NO ENCONTRADO en axopar.com (solo en sitios de distribuidores, que están excluidos).
- Contenido de los paquetes Lighting, Mooring, Wet Bar y Aft Cabin: solo se publica el nombre.
- Imágenes: 50 copias web en WebP (11 MB en total), generadas desde los originales en resolución completa; 1 duplicado omitido por hash. Los originales quedan referenciados en `images.json › original`. Manual: enlace oficial en `06_DOCUMENTOS/documents.json`. Inventario en `05_MULTIMEDIA/multimedia.md`.
- 7 imágenes en REQUIRES REVIEW (modelo no confirmado) y 16 con categoría de confianza baja: requieren revisión visual.

## Observación sobre la página Oceanic de referencia

La ficha técnica publicada hoy en https://oceanicsite.netlify.app/marcas/axopar/axopar-37-xc/ **no coincide** con la web oficial de Axopar. Se revisó solo como estructura, pero conviene corregirla:

| Campo en la página Oceanic | Valor publicado | Web oficial Axopar (S1) |
| --- | --- | --- |
| Manga | 3,30 m | 3,35 m |
| Calado | 0,90 m | 0,85 m (a hélices) |
| Peso en seco | 4.800 kg | 3.770 kg (desplazamiento en rosca, sin motor) |
| Combustible | 730 l | 722 l |
| Agua dulce | 210 l | 100 l |
| Literas | 2 + 2 | 2 (2+2 con cabina de popa opcional) · camarotes 1 (+1 opcional) |
| Potencia máx. | 2 x 350 hp | 2 x 400 hp |
| Velocidad máx. | ~44 nudos | 38–56 nudos según motor |
| Diseño | Aivan / Axopar Design | NO ENCONTRADO |
| Motorización (texto) | 2 × 250, 2 × 300 o 2 × 350 hp | 2 x 300, 2 x 350 o 2 x 400 hp |
