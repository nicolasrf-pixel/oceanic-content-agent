# Solaris 111 RS

## Identificación

| Campo | Valor | Fuente |
| --- | --- | --- |
| MARCA | Solaris Yachts Srl (Aquileia, Italia) | S1 |
| GAMA | Raised Saloon (Yachts) | S1, S2 |
| MODEL | Solaris 111 RS | S1 |
| MODEL YEAR | NO DECLARADO (la web del producto no declara model year) | S1 |
| VARIANT | Solaris 111 RS | S1 |
| TIPO | Velero monocasco | S1 |
| PRECIO | NO PUBLICADO | S1 |
| URL OFICIAL | https://www.solarisyachts.com/en/yachts/111/ | S1 |

## Reglas de alcance aplicadas

- Datos solo de la web oficial del producto (S1). Paquete generado por `tools/oceanic/builders/solaris.py`.
- No se mezclan otros modelos de la gama (-).
- Imágenes: 17 del modelo, 0 de otro modelo (excluidas), 0 por revisar (compartidas con otras páginas), 0 no son del barco.

## Content readiness

<!-- READINESS:START (generado por `python -m oceanic readiness`, no editar) -->
**CONTENT_STATUS = YELLOW** · completitud 56% (informativa; el estado lo deciden las reglas)

Conflictos sin resolver: Lastre, Génova, Mayor

| Grupo | Ítem | Estado | Detalle |
| --- | --- | --- | --- |
| DATOS | tabla_tecnica | PARTIAL | tabla base 8/9 verificada · faltan: camarotes |
| DATOS | especificaciones | OK | 14 campos con fuente |
| DATOS | caracteristicas | MISSING | no existe |
| DATOS | equipamiento | MISSING | sin standard/optional |
| EDITORIAL | hero | OK | 48 palabras fuente · candidato Oceanic presente |
| EDITORIAL | introduccion | OK | 60 palabras fuente · candidato Oceanic presente |
| EDITORIAL | diseno | OK | 59 palabras fuente · candidato Oceanic presente |
| EDITORIAL | ingenieria | PARTIAL | 10 palabras fuente |
| EDITORIAL | experiencia | OK | 103 palabras fuente · candidato Oceanic presente |
| EDITORIAL | performance | PARTIAL | 10 palabras fuente |
| MULTIMEDIA | hero_image | PARTIAL | 3 candidatas · sin descargar |
| MULTIMEDIA | exterior | PARTIAL | 7 en inventario (mín. 3) · descargadas 0/17 |
| MULTIMEDIA | interior | PARTIAL | 6 en inventario (mín. 2) · descargadas 0/17 |
| MULTIMEDIA | detail | MISSING | 0 en inventario (mín. 2) · descargadas 0/17 |
| MULTIMEDIA | video | OK | 1 videos del modelo |
| DOCUMENTOS | brochure | PARTIAL | 1 identificado(s) · sin enlace directo |
| DOCUMENTOS | technical | MISSING | no encontrado en fuentes oficiales |
| DOCUMENTOS | manual | PARTIAL | 1 identificado(s) · requiere revisión |
<!-- READINESS:END -->

## Cruces de datos

- **Desplazamiento en rosca**: DISPLACEMENT → 'Displacement' = desplazamiento publicado (en rosca si dice 'light').
- **Potencia motor auxiliar**: ENGINE → La fila de motor publica la potencia estándar y las opciones: se toma la mayor.
- **Arquitectura naval**: Credits · Design → Diseñador del barco publicado en los créditos.

## Información faltante o por revisar

- **Camarotes** (NOT_FOUND): No publicado en la ficha técnica ni en el texto de la página del producto.
- **Lastre** (REQUIRES_REVIEW): La web publica 'Kg 12,3': 12,3 kg no es plausible para una eslora de 33,77 m (¿toneladas?). No se convierte.
- **Génova** (REQUIRES_REVIEW): Mayor + génova (317 m²) no cuadra con la superficie vélica publicada (645 m²); el valor es idéntico al de solaris-80-rs: probablemente copiado en la web.
- **Mayor** (REQUIRES_REVIEW): Mayor + génova (317 m²) no cuadra con la superficie vélica publicada (645 m²); el valor es idéntico al de solaris-80-rs: probablemente copiado en la web.
- Equipamiento: la web no publica lista standard ni optional; la web no publica listas de equipamiento; la ficha técnica completa se envía por correo (formulario 'Request the brochure').
- Características (03): la página no tiene bloques de características con título.
- Traducción al español del equipamiento: pendiente.
- Manual del propietario: no publicado en la web del producto.
