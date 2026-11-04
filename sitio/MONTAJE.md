# OCEANIC — Guía de montaje

## Fotos de modelos (catálogo)

El catálogo de 125 modelos usa fotos oficiales de los fabricantes. Las URLs están
referenciadas en `assets/js/catalogo-data.js` (datos del repo oceanic-content-agent).

Los archivos NO vienen incluidos (pesan y están en los CDN de cada astillero).
Para descargarlas, desde la raíz del sitio, en un servidor con acceso a internet:

    bash scripts/descargar-fotos.sh

Esto baja ~872 fotos a `assets/img/modelos/`. El catálogo y las fichas las toman
automáticamente. Hasta entonces, el sitio funciona perfecto sin fotos (las oculta).

Uso de las imágenes: editorial / distribuidor autorizado. Acreditar a cada
astillero (Axopar, Beneteau, Lagoon, Aquila, Solaris, Saffier, XO) y no alterar logos.

## Contenido

- Specs: oficiales, verificadas (status VERIFIED en el repo de origen).
- Descripciones: adaptadas al español, marcadas como borrador — conviene un pase
  editorial final a la voz de Oceanic antes de producción.

## Formularios

Todos los cotizadores/formularios envían por `mailto:ventas@oceanic.cl` (abre el
cliente de correo del usuario) con WhatsApp como alternativa. Para envío con backend
silencioso, conectar a un servicio de formularios o endpoint propio.
