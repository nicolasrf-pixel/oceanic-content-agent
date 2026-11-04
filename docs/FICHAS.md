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
| Galería | fotos `THIS_MODEL` de la biblioteca | (automático) |
| Versiones y configuración | configuraciones, distribuciones, ediciones, colores | `configuracion[]` |
| Equipamiento | de serie y opcional | `equipamiento.serie[]`, `equipamiento.opcional[]` |
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

Las fotos se descargan al publicar (`sitio/scripts/descargar-fotos.sh`). Si una foto no existe, la plantilla retira
su contenedor y el texto ocupa el ancho completo: nunca quedan huecos.
