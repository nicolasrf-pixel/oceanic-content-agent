# OCEANIC — Guía de montaje

## Fotos de modelos (catálogo)

Las fotos oficiales (3.558, de las 11 marcas y los usados) no se guardan en git: las descarga y optimiza el build
de Cloudflare (`bash scripts/build.sh`), desde la lista `scripts/fotos.tsv` (WebP 1600 px, 2560 px las portadas,
calidad 75). La lista se regenera desde la biblioteca con `python3 tools/sitio_fotos.py` (raíz del repo).
Si una foto no baja, el sitio oculta su contenedor. Saffier y Solaris bloquean las descargas automáticas: sus fotos
hay que bajarlas a mano (ver la biblioteca, `media --from-dir`).

Uso de las imágenes: editorial / distribuidor autorizado. Acreditar a cada
astillero (Axopar, Beneteau, Lagoon, Aquila, Solaris, Saffier, XO) y no alterar logos.

## Contenido

- Specs: oficiales, verificadas (status VERIFIED en el repo de origen).
- Descripciones: adaptadas al español, marcadas como borrador — conviene un pase
  editorial final a la voz de Oceanic antes de producción.

## Formularios

Todos los cotizadores/formularios envían a `/api/formulario` (Cloudflare Pages Function en
`functions/api/formulario.js`), que avisa a ventas@, confirma al cliente y guarda el contacto en
Brevo. Si el servidor no está disponible abren el correo del visitante como respaldo. WhatsApp
sigue como alternativa. Configuración: `docs/FORMULARIOS.md` en la raíz del repo.
