# Fichas de modelo del sitio

Las 148 fichas usan **un solo diseño** (la maqueta del Axopar 37 XC), en `sitio/assets/js/ficha-tpl.js`, y se
llenan con **la página oficial de cada modelo traducida al español neutro**. No es un clon de la página oficial:
cada bloque de nuestra maqueta toma el dato oficial que le corresponde, y si el oficial no tiene ese dato, el bloque
no se muestra. Nada se inventa.

URL de una ficha: `sitio/marca/index.html?m=<marca>&modelo=<slug>`.

## Bloques de la maqueta y de dónde sale cada uno

| Bloque | Dato oficial | Campo en `pagina-es.json` |
|---|---|---|
| Portada | titular y bajada del modelo | `portada.titular`, `portada.bajada` |
| Relato | introducción del modelo | `intro` |
| Bloques de texto con foto | secciones con título de la página oficial, en su orden | `bloques[]` |
| Lista de puntos con foto | pestañas / destacados oficiales | `destacados[]` |

**Opcionales: no se publican en ninguna ficha** (decisión Oceanic 2026-11-04): ni la lista de equipamiento opcional,
ni las pestañas de opciones destacadas, ni las ediciones o paquetes opcionales. Se conversan en persona; la ficha
invita a cotizar la configuración.

**Precios: ningún barco nuevo publica precio** (solo los usados). Los extracts traen campos de precio (`prices`,
`price_text`, "DESDE USD"): nunca pasan a `pagina-es.json` ni al sitio.

**Configurador:** solo Axopar, incrustado en la ficha (el visitante no sale del sitio), y solo si la versión no muestra
precios. El configurador público de axopar.com muestra el precio en euros y hoy solo existe para la gama 38, por eso
está desactivado (`CONFIGURADOR_AXOPAR` vacío en `ficha-tpl.js`) hasta que Axopar entregue una versión sin precios.

| Galería | fotos `THIS_MODEL` de la biblioteca | (automático) |
| Versiones y configuración | configuraciones, distribuciones, ediciones, colores | `configuracion[]` |
| Equipamiento | solo de serie; al lado, invitación a conversar opcionales y configuración | `equipamiento.serie[]` |
| Ficha técnica | ficha verificada de la biblioteca (`specifications.json`) | (automático) |
| Más de la marca | gama oficial del modelo (del extract) | (automático) |
| Formulario de cotización | propio de Oceanic, en todas las fichas | — |

Bloques de la maqueta original que no tienen dato oficial y por eso no se muestran: "Para quién es",
escenarios de navegación (fiordos, lagos, mar adentro) y "Cómo se adquiere".

## Cómo se traduce un modelo

1. Leer el extract oficial en `biblioteca/<marca>/<modelo>/07_FUENTES/extract/`.
2. Escribir `biblioteca/<marca>/<modelo>/01_CONTENIDO/pagina-es.json` (ejemplo completo:
   `biblioteca/axopar/axopar-37-xc-cross-cabin/01_CONTENIDO/pagina-es.json`):
   - traducción **fiel** al español neutro, con tuteo: no agrega ni quita afirmaciones;
   - nombres de productos, telas, motores y marcas sin traducir;
   - `"estado": "BORRADOR"` hasta que Nico lo revise (`"REVISADO"` después);
   - `fuente` con la URL oficial y `capturada` con la fecha del extract.
3. Publicar en el sitio: `python3 tools/sitio_fichas.py` (escribe `sitio/assets/data/fichas/<marca>/<slug>.json`).
   Falla si un texto queda vacío o parece seguir en inglés.

Mientras un modelo no tenga `pagina-es.json`, su ficha usa el borrador corto del catálogo con el mismo diseño.

## Fotos

Las fotos se descargan y optimizan al publicar (`sitio/scripts/build.sh`, lista en `sitio/scripts/fotos.tsv`). Si una foto no existe, la plantilla retira
su contenedor y el texto ocupa el ancho completo: nunca quedan huecos.

## Publicar o apagar un modelo

`sitio/assets/js/publicacion.js` tiene la lista de modelos apagados (`"<marca>/<slug>": "motivo"`). Un modelo apagado
desaparece de gamas, menús, asistente y "Más de la marca", y su ficha redirige a la página de la marca. Para
publicarlo, se borra de la lista. Será un botón prender/apagar en el CMS.

Reglas vigentes (decisión Oceanic 2026-11-04):
- Marcas que bloquean la descarga automática de fotos (Saffier, Solaris): solo se publican los modelos con material
  en oceanic.cl; el resto queda para carga manual vía CMS.
- Todas las demás marcas se publican completas, salvo los modelos que el cliente pida apagar.

## Modelos destacados de la portada

`sitio/assets/js/publicacion.js › destacados` lista los 3 modelos de la portada, en orden (`"<marca>/<slug>"`). Foto,
nombre y descripción salen del catálogo. Un modelo apagado no se muestra. Lo elegirá el administrador.
