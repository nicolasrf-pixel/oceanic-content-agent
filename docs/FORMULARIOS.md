# Formularios del sitio (fase 4)

Todos los formularios del sitio envían a un solo endpoint, `POST /api/formulario`
(`sitio/functions/api/formulario.js`, que atiende el Worker `oceanic` en `sitio/worker/index.js`). El navegador usa
`sitio/assets/js/formularios.js`.

| Formulario | Página | `tipo` |
|---|---|---|
| Cotización, al final de cada ficha de modelo publicada | `marca/?m=…&modelo=…` | `cotizacion` |
| Consulta, al final de cada ficha de usado | `usados/barco/?id=…` | `usado` |
| Contacto | `contacto/` | `contacto` |
| Charter | `charter/` | `charter` |
| Equipamiento | `equipamiento/` | `equipamiento` |
| Suscripción a Puerto | `puerto/` y `contacto/` | `puerto` |

## Qué pasa al enviar

1. El servidor valida los datos y descarta bots (campo trampa `web`, invisible para las personas). Solo acepta
   envíos desde el mismo dominio del sitio.
2. Envía el aviso a ventas@ con todos los datos. "Responder" le escribe directo al cliente.
3. Si eso funcionó, en paralelo: agradecimiento al cliente, **con cada solicitud** (cotización, usado, contacto,
   charter o equipamiento), con un texto propio por tipo y la copia de lo que envió; contacto en Brevo con
   origen, modelo, fecha y versión de la política, y negocio en el pipeline "Cotizaciones" (si está configurado).
4. Si el visitante marcó la casilla de Puerto (siempre viene **desmarcada**), Brevo le manda un correo de doble
   confirmación. Solo entra a la lista, con `CONSENTIMIENTO_MARKETING = true`, cuando hace clic.

**Nunca se pierde una solicitud:** si el servidor no responde, no está configurado o falla el aviso a ventas,
el navegador abre el correo del visitante con la solicitud ya escrita (como en la etapa 1) y se lo dice.
La suscripción a Puerto no tiene respaldo por correo: si falla, avisa que lo intente más tarde.

El registro del servidor solo guarda códigos de error, nunca datos personales.

## Variables en Cloudflare

Cloudflare → Workers & Pages → Worker **oceanic** → Settings → Variables and Secrets (ver `sitio/CÓMO-SUBIR-EL-SITIO.md`).

| Variable | Tipo | Quién | Valor |
|---|---|---|---|
| `BREVO_API_KEY` | **Secreto** | Nico | Clave de API de Brevo (ver abajo). Nunca por chat, correo ni repositorio. |
| `REMITENTE_EMAIL` | Texto (en `wrangler.jsonc`) | — | `contacto@oceanic.cl` (verificado en Brevo, DKIM y DMARC en verde, 2026-11-05) |
| `REMITENTE_NOMBRE` | Texto (en `wrangler.jsonc`) | — | `Oceanic` |
| `VENTAS_EMAIL` | Texto (en `wrangler.jsonc`) | — | `ventasweb@oceanic.cl` |
| `POLITICA_VERSION` | Texto (en `wrangler.jsonc`) | — | `2026-11-borrador`. Cambiarla cada vez que cambie el texto de la política. |
| `BREVO_LISTA_CONTACTOS` | Texto | Nico | Opcional. ID de una lista para todos los que escriben (no es marketing). |
| `BREVO_LISTA_PUERTO` | Texto | Nico | ID de la lista de Puerto |
| `BREVO_PLANTILLA_DOI` | Texto | Nico | ID de la plantilla de doble confirmación |
| `PUERTO_URL_CONFIRMADO` | Texto (en `wrangler.jsonc`) | — | `https://oceanic.narf.workers.dev/puerto/?confirmado=1` (muestra el aviso de suscripción confirmada). Cambiar al dominio definitivo. |
| `BREVO_PIPELINE_ID` | Texto | Nico | Opcional. ID del pipeline "Cotizaciones" |
| `BREVO_ETAPA_INICIAL` | Texto | Nico | Opcional. ID de la primera etapa del pipeline |
| `ORIGENES_PERMITIDOS` | Texto | Johnny | Opcional. Dominios separados por coma si el sitio responde en más de uno. |
| `MODO_PRUEBA` | Texto | Johnny | `1` para validar sin enviar nada (pruebas). Quitarla en producción. |

Sin `BREVO_API_KEY` ni `REMITENTE_EMAIL` el endpoint responde 503 y los formularios usan el correo de respaldo.

## Instrucciones de Brevo para Nico

Nico hace todo esto en su cuenta, sin dar acceso a nadie.

**1. Atributos de contacto** (Contactos → Configuración → Atributos de contacto → Añadir). Escribir los nombres
exactos, en mayúsculas:

| Nombre | Tipo |
|---|---|
| `ORIGEN` | Texto |
| `TIPO_FORMULARIO` | Texto |
| `LINEA_NEGOCIO` | Texto |
| `MARCA` | Texto |
| `MODELO` | Texto |
| `UNIVERSO` | Texto |
| `TELEFONO` | Texto |
| `CONSENTIMIENTO_MARKETING` | Booleano |
| `CONSENTIMIENTO_FECHA` | Fecha |
| `POLITICA_VERSION` | Texto |

`NOMBRE` ya existe en la cuenta de Oceanic y guarda el nombre (no se usa FIRSTNAME). Si falta algún campo, el sitio guarda igual el contacto con nombre y correo.

**2. Lista de Puerto** (Contactos → Listas → Crear una lista): llamarla "Puerto". Anotar su ID (número).

**3. Plantilla de doble confirmación** (Campañas → Plantillas → Nueva plantilla): elegir la plantilla
"Double opt-in", con el botón que lleva `{{ doubleoptin }}`. Texto sugerido: "Confirma tu suscripción a Puerto, el
newsletter de Oceanic. Si no la pediste, ignora este correo." Activarla y anotar su ID.

**4. Pipeline "Cotizaciones"** (opcional, CRM → Negocios → Configuración): crear el pipeline con sus etapas
(sugerencia: Nueva, Contactado, Propuesta enviada, Ganada, Perdida). Anotar el ID del pipeline y el de la etapa
"Nueva".

**5. Remitente** (Configuración → Remitentes, dominios e IP dedicadas): verificar que el dominio `oceanic.cl` sigue
autenticado (DKIM y DMARC en verde) y crear el remitente `contacto@oceanic.cl` con nombre "Oceanic" (hecho el 2026-11-05).

**6. Clave de API** (Configuración → SMTP y API → Claves API → Generar una nueva clave): nombre
"sitio-oceanic". Nico la copia y la pega **él mismo** en Cloudflare como secreto `BREVO_API_KEY`
(Settings → Variables and secrets → Add → Type: Secret). No se guarda en ningún otro lugar. Si se filtra, se borra
en Brevo y se genera otra.

**7. Pasar los IDs a Johnny**: los de la lista, la plantilla y el pipeline no son secretos.

## Cómo probar sin datos reales

- Pruebas automáticas, desde `sitio/`: `node --test tests/formulario.test.mjs` (Brevo simulado, no envía nada).
- En local con Cloudflare: `npx wrangler pages dev sitio --binding MODO_PRUEBA=1`.
- Prueba completa con Brevo: usar un correo propio de prueba (no de clientes), enviar cada formulario y revisar
  que llegue el aviso a ventas@, la confirmación, que aparezca el contacto con sus atributos y que la suscripción a
  Puerto solo entre a la lista tras confirmar. Borrar después el contacto de prueba en Brevo.

## Pendiente antes de publicar (puerta legal)

- La política de privacidad todavía no existe (fase 5). Hasta entonces `POLITICA_VERSION` no apunta a un texto real.
- Contratos de encargo firmados y validación del abogado antes de recibir datos reales.


## Consentimiento (Ley 21.719, desde 2026-11-05)

Toda solicitud debe traer `acepta: true` (casilla «Acepto la política de privacidad», obligatoria y separada de la
casilla opcional de Puerto). Sin ella el endpoint responde 422 `acepta`. `formularios.js` inserta la casilla en todo
`form[data-form]` y `form[data-puerto]`; charter y equipamiento la tienen en su propio formulario. Nuevo tipo
`privacidad` (solicitudes de acceso, rectificación, supresión, oposición, portabilidad, bloqueo) desde `/privacidad/`.
Cada solicitud guarda la versión de la política (`POLITICA_VERSION`) y la fecha.


## Correos de cotización y página de gracias (decisión Oceanic 2026-11-05)

- **Casillas:** salen de `contacto@oceanic.cl` (REMITENTE_EMAIL, verificado en Brevo) y llegan a `ventasweb@oceanic.cl` (VENTAS_EMAIL). Quedan en `sitio/wrangler.jsonc › vars` (no son secretos). El respaldo por correo del navegador también apunta a ventasweb@.
- **Cotización desde una ficha:** el formulario manda `ficha` (`marca/slug`) e `intencion`. El servidor toma los datos del barco del catálogo del propio sitio (`assets/js/catalogo-data.js`), no de lo que mande el navegador. Plantillas en `sitio/functions/api/correos.js`:
  - A ventas: «Tienes una cotización web, Beneteau First 30». «[Nombre] ha cotizado un Beneteau First 30», botones Responder / WhatsApp / Llamar, datos del cotizante ordenados (nombre, correo, teléfono, cuándo quiere navegar, mensaje, Puerto) y ficha corta del barco (foto, eslora, manga, camarotes, desplazamiento, enlace). Responder el correo le escribe directo al cliente.
  - Al cliente: «Hemos recibido tu cotización de un Beneteau First 30». Saludo, ficha corta del barco con foto, «Lo que nos contaste», cierre («Nos pondremos en contacto contigo lo antes posible. Gracias por cotizar en Oceanic. Saludos, Equipo Oceanic») y pie con dirección, teléfono y nota de privacidad.
  - HTML de tablas con estilos en línea (Gmail, Outlook, Apple Mail), 600 px, sin opcionales. Las fotos son WebP: Outlook de escritorio no las muestra (queda el texto alternativo); el resto sí.
- **Página de gracias:** `sitio/gracias/` se abre cuando el servidor recibe la cotización (si falla y se usa el respaldo por correo, se queda el aviso en la ficha). Muestra «¡Gracias, [Nombre]!», el barco y los pasos siguientes, con los botones «Volver al home» y «Seguir viendo [marca]». Los datos pasan por `sessionStorage`, nunca por la URL. No se indexa.
