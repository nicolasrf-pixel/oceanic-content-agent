# Log de verificación de modelos — Saffier, VX One, Skeeta, Switch — 2026-09-10

## Nota de procedencia de este log

El subagente que investigó estas cuatro marcas escribió los 14 archivos
de modelo (11 Saffier + 1 VX One + 1 Skeeta + 1 Switch, ya validados
contra `model.schema.json`), pero fue interrumpido por un límite de tasa
de la sesión antes de escribir este log. El orquestador lo reconstruyó a
partir del contenido ya dejado en los propios archivos.

## Saffier — 11 modelos, 3 familias

- **SC** (clásica): SC 10m Cabin (`DISCONTINUED`), SC 6.50 Cruise, SC 8m
  Cabin, SC 8m Open — las dos últimas tratadas como **modelos separados**
  entre sí (no variantes) porque el fabricante las nombra y cataloga por
  separado.
- **SE** (Elegance): SE 24 Lite, SE 27 Leisure (`UNCONFIRMED` — evidencia
  contradictoria de si fue reemplazado por SE 28), SE 28 Leopard (`NEW`,
  estrenado en el boot Düsseldorf enero 2026), SE 33 Life, SE 37 Lounge
  (`DISCONTINUED`, confidence LOW — solo indicio de página "pre-owned"
  del fabricante, sin declaración explícita de fin de producción).
- **SL**: SL 46 (`NEW`) — versiones MED/NORTH tratadas como **variantes**
  del mismo modelo (comparten familia y casco), no como modelos
  separados, a falta de evidencia de fichas técnicas y nombres
  comerciales completamente independientes.

Discrepancia notable: `saffier-sc-8m-open` tiene una fuente de terceros
que lo llama "Saffier SE 26" — conservada como discrepancia de
`model_name`, no resuelta arbitrariamente.

No se encontró evidencia directa (solo indicio nivel 2 genérico de marca)
de qué modelos específicos de Saffier tiene listados Oceanic Chile por
nombre — pendiente de fetch directo.

## VX One — 1 modelo (confirmado monoproducto)

Confirmado como clase "closed class" (one-design estricta): construida
exclusivamente por fabricantes licenciados (Ovington Boats, Mackay Boats),
sin ediciones de fábrica distintas más allá de las velas (que sí varían
por fabricante de velas dentro de la regla de clase) y accesorios de
personalización. No se crearon variantes ni modelos adicionales.

## Skeeta — 1 modelo (confirmado monoproducto para Oceanic)

Se investigó también "Nikki", un dinghy foiling más pequeño (~2.9-3 m,
velas 5.5/6.5 m²) del mismo fabricante (Skeeta Watersports). **No se creó
archivo de modelo para Nikki** porque no hay evidencia de que Oceanic
Chile lo represente — la única URL de `oceanic.cl` hallada sigue siendo
la de usados de Skeeta estándar. Se documenta la decisión de no crearlo,
no se omite en silencio.

Discrepancia conservada: la eslora del Skeeta aparece como 3.66 m en el
sitio del fabricante (Nivel 1) vs. 4.7 m en otra fuente — ambos valores
conservados con su fuente, no promediados.

Recordatorio de contexto: el `portfolio_status` de Skeeta como marca ya
fue fijado en `ACTIVE` por decisión humana explícita del 2026-09-10 (ver
`data/brands/master-inventory.json`, campo `human_decisions`), no por
esta investigación de modelos.

## Switch (Switch One Design) — 1 modelo, `NEW`

Confirmado: los "tres aparejos intercambiables" (6.5 / 7.5 / 8.5 m²)
mencionados en `brand_description` de `master-inventory.json` son
**variantes** de una única plataforma/modelo, no modelos separados — el
fabricante reutiliza el mismo casco, foils, botavara y secciones altas
del mástil entre los tres aparejos, cambiando solo la base inferior del
mástil. Tratamiento correcto según CLAUDE.md sección 7/16.

Discrepancia conservada en `peso_kg_plataforma` entre fuentes.

## Fuentes únicas usadas: 22 (Saffier) + 6 (VX One) + 6 (Skeeta) + 6 (Switch) = 40 aprox.

Incluyen los sitios oficiales de fabricante (saffieryachts.com,
skeetawatersports.com, switchonedesign.com — vía snippet, no fetch
directo), `oceanic.cl`, y fuentes de terceros (itboat.com, boats.com).
Ninguna con `retrieval_method: direct_fetch` — bloqueo de red documentado
en CLAUDE.md sección 22.

## Campos pendientes para la siguiente fase

- Confirmar qué modelos exactos de Saffier vende Oceanic Chile (fetch
  directo de `oceanic.cl/saffier-yachts/`).
- Resolver el estado real de SE 27 Leisure (¿reemplazado por SE 28?).
- Confirmar eslora real del Skeeta (3.66 m vs 4.7 m).
- La mayoría de especificaciones de detalle (camarotes, tripulación,
  autonomía cuando aplica) siguen `UNKNOWN` salvo lo ya confirmado.
