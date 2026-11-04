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

## 2. Abrir el administrador con Cloudflare Access (una vez, 2 minutos)

El administrador está **cerrado por defecto**: hasta que Access esté activo, `/admin/` responde "cerrado".

1. **dash.cloudflare.com** → **Workers & Pages** → clic en **oceanic**.
2. Arriba, pestaña **Access** (junto a Overview, Deployments, Settings…).
3. Botón **Protect this Worker behind Access**. Si Cloudflare pide activar **Zero Trust** primero, acepta el plan
   **Free** (hasta 50 usuarios, sin costo) y elige un nombre de equipo, p. ej. `oceanic`; luego vuelve a este paso.
4. Elige **All traffic**. En **Authentication policy**, permite por **correo** (Emails) y escribe tu correo y el de
   quien vaya a administrar. **Apply Access**.
5. Abre `https://oceanic.<tu-subdominio>.workers.dev/admin/`: Cloudflare pide el correo, envía un código de 6
   dígitos y entras.

No hay que copiar nada: Cloudflare le entrega al Worker el correo ya verificado. Mientras el sitio sea de prueba,
esto protege **todo** el sitio (solo entran los correos de la política), lo que sirve de vista previa privada.

**Al lanzar con dominio propio** (oceanic.cl) el sitio debe ser público y solo el administrador privado: se crea una
aplicación de Access para las rutas `oceanic.cl/admin` y `oceanic.cl/api/admin` (Zero Trust → Access controls →
Applications → Self-hosted) y se agregan al Worker las variables `ACCESS_TEAM_DOMAIN` (ej. `oceanic.cloudflareaccess.com`)
y `ACCESS_AUD` (el *Application Audience Tag* de esa aplicación). Opcional en ambos casos: `ADMIN_EMAILS` = correos
autorizados separados por coma, como segunda barrera.

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
- **El administrador dice "cerrado":** Access no está activado en el Worker (paso 2).
- **"Acceso denegado":** el correo no está en la política de Access (o en `ADMIN_EMAILS`).
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
