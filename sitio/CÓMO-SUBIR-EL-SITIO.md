# Cómo publicar el sitio en Cloudflare (Worker)

El sitio es un **Worker** de Cloudflare llamado `oceanic` (ya existe en la cuenta). Cloudflare lo publica solo con
cada cambio que se sube a la rama `sitio-web`. El Worker sirve los archivos del sitio y además atiende:

- los **formularios** (`/api/formulario` → Brevo),
- el **administrador** (`/admin/`), protegido con Cloudflare Access,
- lo que se publica desde el administrador (base de datos **D1 `oceanic-cms`**) y las imágenes subidas
  (almacén **KV `oceanic-imagenes`**). Ambos ya están creados en la cuenta y conectados en `wrangler.jsonc`.

Con la base de datos vacía el sitio se ve exactamente como el repo. Lo que se publica en el administrador se
superpone al archivo del repo correspondiente.

## 1. Conectar el repositorio (una vez)

1. **dash.cloudflare.com** → **Workers & Pages** → Worker **oceanic** → **Settings** → **Build** → **Connect**.
2. Repositorio **nicolasrf-pixel/oceanic-content-agent**, rama **`sitio-web`**.
3. Configuración del build:
   - **Root directory:** `sitio`
   - **Build command:** `bash scripts/build.sh`
   - **Deploy command:** `npx wrangler deploy`
4. Guardar. La primera publicación tarda unos 5 minutos (descarga y optimiza ~3.500 fotos oficiales).
   El estado se ve en **Deployments**.

> No uses "Upload assets" (arrastrar archivos): así no corren los formularios, el administrador ni las fotos.

## 2. Abrir el administrador con Cloudflare Access (una vez)

El administrador está **cerrado por defecto**: hasta que se configure Access, `/admin/` responde "cerrado".

1. **Zero Trust** → **Access controls** → **Applications** → **Add an application** → **Self-hosted**.
2. Nombre: `Oceanic administrador`. **Destinations** (agrega las dos):
   - `oceanic.<tu-subdominio>.workers.dev` con ruta `admin`
   - `oceanic.<tu-subdominio>.workers.dev` con ruta `api/admin`
   (cuando el sitio tenga dominio propio, agrega también `oceanic.cl/admin` y `oceanic.cl/api/admin`).
3. **Policy:** Allow → **Emails** → los correos de quienes administran el sitio. Método de ingreso: código de un
   solo uso por correo (One-time PIN) está bien.
4. Guarda y copia el **Application Audience (AUD) Tag** (en la aplicación → Additional settings).
5. Copia tu **team domain**: Zero Trust → Settings → *Team name and domain* (ej. `oceanic.cloudflareaccess.com`).
6. Worker **oceanic** → **Settings** → **Variables and Secrets** → agrega dos variables de texto:
   - `ACCESS_TEAM_DOMAIN` = `oceanic.cloudflareaccess.com` (el tuyo, sin https)
   - `ACCESS_AUD` = el AUD Tag del paso 4
   - (opcional) `ADMIN_EMAILS` = lista de correos separada por comas, como segunda barrera.
7. Entra a `https://oceanic.<tu-subdominio>.workers.dev/admin/`: Access pide el correo, envía un código y entras.

El Worker verifica la firma de Access en cada solicitud del administrador (no basta con la cookie). Las variables
quedan guardadas aunque se vuelva a desplegar (`keep_vars`).

## 3. Formularios (Brevo)

Se configura después, en el mismo panel de **Variables and Secrets** del Worker: `BREVO_API_KEY` como **Secret**
(lo pega Nico directamente en Cloudflare; nunca va al repo ni al chat) y las variables de `docs/FORMULARIOS.md`.
Mientras no esté configurado, el formulario abre el correo del visitante con la solicitud escrita (respaldo).

## Qué hace el administrador

| Sección | Qué se edita | Archivo del sitio que reemplaza |
|---|---|---|
| Publicación y destacados | Prender/apagar cada barco (con motivo) y los 3 destacados de la portada | `assets/js/publicacion.js` |
| Revisión de traducciones | Texto de cada ficha (página oficial traducida) y su estado BORRADOR / REVISADO | `assets/data/fichas/<marca>/<modelo>.json` |
| Catálogo | Ficha técnica, descripción, imagen principal y galería de cada modelo | `catalogo-data.js`, `catalogo-contenido.js` |
| Usados | Avisos: precio, fecha, «vendido», texto, fotos y documentos | `usados-data.js` |
| Puerto | Ediciones con bloques (noticia / guía técnica), portada y PDF | `puerto-data.js` |
| Marcas, textos de marca, charter, equipamiento | Editor de todos los campos | `marcas-info.js`, `marcas-contenido.js`, `charter-data.js`, `equipamiento-data.js` |
| Imágenes y documentos | Biblioteca de archivos subidos (se sirven en `/media/...`) | — |
| Patrones prohibidos | Lista del Brand OS (se puede importar `patrones-prohibidos.json`) | — |

Flujo: **editar → Guardar borrador → Publicar**. Cada guardado es atómico y queda en el **historial** (se puede
restaurar cualquier versión). Si dos personas editan lo mismo, la segunda recibe un aviso en vez de pisar el
trabajo de la primera. **Vista previa de borradores** (arriba a la derecha) muestra los borradores en el sitio,
solo en tu navegador y por una hora. **Volver al repo** deja de usar lo publicado en el administrador para ese
documento.

Antes de guardar, el servidor valida: esquema de cada tipo, enlaces seguros (nada de `javascript:`), sin precios
en barcos nuevos, aviso si una ficha menciona opcionales, y los **patrones prohibidos**. Si algo no pasa, no se guarda
y se indica dónde está el problema.

**Puerto:** `oceanic.cl/puerto-<mes>-<año>/` redirige sola a la edición si existe (no hace falta tocar `_redirects`).

## Qué se ve en esta etapa

- **Vista previa privada:** el sitio no aparece en Google (`robots.txt` y la cabecera `X-Robots-Tag`). Al lanzar,
  quitar esas dos cosas (ver comentarios en `robots.txt` y `_headers`).
- **Fotos:** Saffier y Solaris bloquean las descargas automáticas; sus fotos salen de las que Oceanic cargó en
  oceanic.cl (`scripts/fotos-oceanic.json`). Los modelos sin material están apagados y se pueden prender desde el
  administrador cuando se suban sus fotos.

## Si algo falla

- **La publicación falla:** Worker → **Deployments** → la publicación fallida → registro. Revisa Root directory
  `sitio`, Build command `bash scripts/build.sh` y Deploy command `npx wrangler deploy`.
- **El administrador dice "cerrado":** faltan `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` (paso 2.6).
- **"Acceso denegado":** el correo no está en la política de Access (o en `ADMIN_EMAILS`), o el AUD no coincide.
- **Errores del Worker:** Worker → **Observability** → Logs.

## Para desarrolladores

```bash
cd sitio
node --test tests/*.test.mjs                    # pruebas (formularios + CMS)
npx wrangler d1 migrations apply oceanic-cms --local
npx wrangler dev                                 # con .dev.vars: ADMIN_LOCAL="tu@correo" (solo localhost)
```

Esquema de la base: `worker/migraciones/` (ya aplicado en la cuenta). Código: `worker/index.js` (rutas),
`worker/api.js` (administrador), `worker/documentos.js` (tipos y validación), `worker/acceso.js` (Access).

## Uso de las imágenes

Editorial / distribuidor autorizado. Acreditar a cada astillero y no alterar logos.
