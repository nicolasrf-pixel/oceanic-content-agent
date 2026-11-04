# Cómo publicar el sitio en Cloudflare

El sitio se publica conectando Cloudflare Pages al repositorio de GitHub. Se hace **una sola vez**: después,
cada cambio que se sube a la rama `sitio-web` se publica solo en unos minutos. No hay archivos que reemplazar.

> **No uses "Upload assets" (arrastrar archivos).** Así Cloudflare no ejecuta los formularios (`functions/`) ni
> descarga las fotos de los modelos.

## Paso a paso (una vez)

1. Entra a **dash.cloudflare.com** → **Workers & Pages** → **Create** → pestaña **Pages** → **Connect to Git**.
2. Autoriza GitHub si lo pide y elige el repositorio **nicolasrf-pixel/oceanic-content-agent**.
3. **Project name:** `oceanic-sitio` (la dirección será `oceanic-sitio.pages.dev`).
4. **Production branch:** `sitio-web`.
5. **Build settings:**
   - Framework preset: **None**
   - Build command: `bash scripts/build.sh`
   - Build output directory: `.`
   - **Root directory (advanced):** `sitio`
6. **Save and Deploy.** La primera publicación tarda unos 5 minutos: descarga y optimiza ~3.500 fotos oficiales.

Listo. Cada vez que se suba un avance a `sitio-web`, Cloudflare vuelve a publicar solo. El estado de cada
publicación se ve en el proyecto → **Deployments**.

## Qué se ve en esta etapa

- **Vista previa privada:** el sitio no aparece en Google (`robots.txt` y la cabecera `X-Robots-Tag` lo
  impiden). Al lanzar, quitar esas dos cosas (ver comentarios en `robots.txt` y `_headers`).
- **Formularios:** mientras Brevo no esté configurado, al enviar se abre el correo del visitante con la solicitud
  escrita (respaldo). Configuración de Brevo: `docs/FORMULARIOS.md` en la raíz del repo.
- **Fotos:** Saffier y Solaris bloquean las descargas automáticas en sus webs; sus fotos salen de las que Oceanic
  cargó en oceanic.cl (`scripts/fotos-oceanic.json`). Sin página en oceanic.cl, y por eso sin portada propia:
  Saffier SC 8m Cabin y SE 28 Leopard; Solaris 64 RS y 74 RS (con algunas fotos de galería). Todas las demás
  marcas bajan solas.
- **Contenido:** las fichas con traducción completa de la página oficial se van agregando (`docs/FICHAS.md`); las
  demás muestran el borrador del catálogo con el mismo diseño.

## Si algo falla

- **La publicación falla:** proyecto → Deployments → la publicación fallida → **View details** muestra el
  registro. Revisa que Root directory sea `sitio` y Build command `bash scripts/build.sh`.
- **Una página da 404:** las fichas de modelo están en `/marca/index.html?m=<marca>&modelo=<modelo>`.

## Uso de las imágenes

Editorial / distribuidor autorizado. Acreditar a cada astillero y no alterar logos.
