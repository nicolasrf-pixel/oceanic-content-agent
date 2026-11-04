# OCEANIC — Deploy en Cloudflare Pages

## Opción A — Deploy directo (drag & drop)
1. Entra a Cloudflare Dashboard → Workers & Pages → Create → Pages → Upload assets
2. Arrastra TODO el contenido de esta carpeta (no la carpeta, su contenido)
3. Deploy. Listo: el sitio queda en `tu-proyecto.pages.dev`

## Opción B — Deploy desde Git (recomendado para desarrollo)
1. Sube esta carpeta a un repo de GitHub
2. Cloudflare Pages → Create → Connect to Git → elige el repo
3. Build settings:
   - Framework preset: **None**
   - Build command: *(vacío)*
   - Build output directory: **/** (raíz)
4. Deploy

## Fotos de modelos (IMPORTANTE)
El catálogo (125 modelos) usa fotos oficiales de los fabricantes.
NO vienen incluidas (están en los CDN de cada astillero).

Antes de deployar, o en un paso de build, descárgalas:

    bash scripts/descargar-fotos.sh

Esto baja ~872 fotos a `assets/img/modelos/`. Requiere `curl` y acceso a internet.
El sitio funciona sin ellas (las oculta), pero con fotos queda completo.

Para automatizar en Cloudflare Pages (Opción B), pon como Build command:
    bash scripts/descargar-fotos.sh

## Archivos de configuración incluidos
- `_headers` — cache y seguridad (assets con cache larga, HTML sin cache)
- `_redirects` — rutas legacy
- `404.html` — página de error con el estilo del sitio
- `robots.txt` y `sitemap.xml` — SEO (ajustar el dominio real)

## Antes de producción
1. Reemplazar `oceanic.pages.dev` por el dominio real en robots.txt y sitemap.xml
2. Correr el pase editorial de las descripciones (vienen como borrador)
3. Configurar los formularios: variables y secreto de Brevo en Cloudflare, según
   `docs/FORMULARIOS.md` (raíz del repo). Sin eso usan el correo de respaldo.
4. Validar precios "desde" con ventas (son referenciales)
5. Confirmar specs del repo con las fichas oficiales vigentes
