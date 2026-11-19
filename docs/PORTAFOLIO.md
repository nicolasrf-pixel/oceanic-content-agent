# Orden, categorías y marcas (administrador › Orden, categorías y marcas)

Un solo documento del CMS, `portafolio` (`sitio/assets/js/portafolio-data.js`, `window.OCEANIC_PORTAFOLIO`), decide:

- **Orden en el inicio:** `inicio[]`, la grilla «El portafolio» y el carrusel de logos (mismo orden). Por marca: `visible`,
  `subtitulo` (texto bajo el nombre), `foto` de la tarjeta, `logo` y `forma` del logo (`ancho` o `alto`).
- **Categorías (universos):** `universos[]`, cada una con `slug`, `nombre`, `kicker`, `lede`, `hero`, `alt`, `visible` y sus
  `marcas[]` en orden (`marca`, `linea` opcional —vela o motor, para marcas con las dos líneas— y `etiqueta`).
  Cada categoría es una columna del menú, una del pie, una tarjeta del inicio y una página (`/universo/?u=<slug>`).

Lo leen: el menú y el pie (`nav-tpl.js`), el inicio (`portafolio-home.js`), las páginas de universo (`universo-tpl.js`) y el orden
de marcas del asistente (`asistente.js`). Cada uno trae su lista de respaldo y la usa si el archivo no carga.

## Qué se puede hacer desde el administrador
1. **Mover el orden** de las marcas en el inicio (flechas) y ocultar una marca del inicio.
2. **Crear, ordenar, renombrar, ocultar y eliminar categorías**, y mover o quitar marcas dentro de cada una.
3. **Crear una marca nueva:** el formulario guarda y publica el catálogo (marca con `modelos: []`) y la información de marcas, y deja la
   marca **oculta** en el inicio. Después se le agregan modelos en «Catálogo y modelos nuevos», se activa «Mostrar en el inicio» y se
   publica el portafolio. Una marca sin modelos muestra «Estamos preparando la gama…» en vez de una gama vacía.

## Autorización: lo que no está autorizado no existe
Una marca con `visible:false` en `inicio` (así nacen las marcas nuevas) y una categoría con `visible:false` (así nacen las nuevas, p. ej.
«Rescate») **no se muestran en ninguna parte**: ni inicio, menú, pie, categorías, asistente, gamas, destacados ni su propia página
(`/marca/?m=…` responde «Marca no encontrada»; `publicacion.js` la saca del catálogo antes de que otra pieza la lea). El botón
**«Autorizar y mostrar»** (en la marca o en la categoría) la activa; después se publica el documento.

## Revisar marcas para marcas nuevas
El campo «Web oficial» de una marca (`inicio[].web`) la suma a «Revisar marcas» desde el día uno, aunque no esté autorizada: el botón envía
esas direcciones al flujo de GitHub (entrada `extra`) y el informe lista sus modelos como «nuevos» para cargarlos con el proceso de la
biblioteca. Las webs con captcha anti-bots (Solaris) no se eluden: quedan «bloqueadas» y se revisan a mano.

## Reglas (las valida el servidor, `worker/documentos.js › portafolio`)
Direcciones en minúsculas con guiones y sin repetir; hasta 60 marcas en el inicio, 12 categorías y 40 marcas por categoría; imágenes
solo rutas del sitio, subidas (`/media/…`) o https; textos con largo máximo. Sin categorías o marcas visibles, avisa y el sitio usa
su lista de respaldo.

## Límites
- Un logo subido desde el administrador es PNG o WebP (el CMS no admite SVG).
- Las páginas de una categoría nueva usan direcciones con parámetro (`/universo/?u=…`) y no están en `sitemap.xml`.
- El chat orienta por tipo de barco (vela, motor, catamarán…), no por categoría: una categoría nueva no cambia sus preguntas.
