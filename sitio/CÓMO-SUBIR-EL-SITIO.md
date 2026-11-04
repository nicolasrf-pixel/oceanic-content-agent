# CÓMO DEJAR EL SITIO OPERATIVO CON FOTOS

El sitio ya tiene fotos reales en: home, todas las marcas, Axopar completo,
usados, Puerto, y el modelo insignia de cada marca en el catálogo.

Las fotos de LOS 125 modelos del catálogo se bajan solas al publicar.
Elige una opción:


## OPCIÓN 1 — NETLIFY (la más simple, baja las fotos sola)

1. Ve a **netlify.com** → crea cuenta gratis (con tu correo o GitHub)
2. **Add new site** → **Deploy manually** (o "Import from Git" si subes el repo)
3. Si es manual: arrastra la carpeta del sitio. Netlify detecta el archivo
   `netlify.toml` y **corre solo el script que baja las fotos**.
4. Queda online en `tu-sitio.netlify.app`

Netlify tiene internet abierto en su build, así que baja las 872 fotos
automáticamente. No tocas nada en tu computador.


## OPCIÓN 2 — CLOUDFLARE PAGES (desde Git, baja las fotos sola)

1. Sube la carpeta a un repositorio de GitHub (gratis)
2. **dash.cloudflare.com** → Workers & Pages → Create → Pages → Connect to Git
3. En Build settings:
   - Build command:  `bash scripts/descargar-fotos.sh`
   - Build output directory:  `/`
4. Deploy. Cloudflare baja las fotos en el build y publica.


## OPCIÓN 3 — CLOUDFLARE drag & drop (rápido, SIN las fotos del catálogo)

1. dash.cloudflare.com → Workers & Pages → Create → Pages → Upload assets
2. Arrastra el contenido de la carpeta → Deploy

Esta opción NO corre el script, así que el catálogo masivo queda sin las
fotos de cada modelo (sí con las de los insignia). Sirve para una demo rápida.


## RESUMEN

- ¿Quieres TODO con fotos, sin tocar tu computador?  → Netlify (Opción 1)
- ¿Ya usas GitHub y Cloudflare?                        → Cloudflare Git (Opción 2)
- ¿Solo una demo rápida ahora?                         → Cloudflare drag&drop (Opción 3)

Cualquiera queda online en minutos. El link se lo mandas al cliente.


## Sobre las fotos (importante y honesto)

Yo (Claude) no puedo bajar las fotos desde mi entorno — está bloqueado el
acceso a los sitios de los fabricantes. Pero Netlify y Cloudflare SÍ pueden,
en su paso de build. Por eso la solución correcta es publicar ahí, no bajarlas
a mano. El repositorio de contenido ya dejó todas las URLs listas; el script
(scripts/descargar-fotos.sh) hace el resto.

Uso de las imágenes: editorial / distribuidor autorizado. Acreditar a cada
astillero (Axopar, Beneteau, Lagoon, Aquila, Solaris, Saffier, XO) y no
alterar logos.
