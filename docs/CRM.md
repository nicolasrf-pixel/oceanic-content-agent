# CRM propio en el administrador (`/admin/#crm`)

**Decisión Oceanic (2026-11-19):** el CRM interno **no** trae los contactos antiguos de Brevo. Guarda solo los leads que llegan por los formularios
**desde el lanzamiento, 2026-12-01 00:00 (hora de Chile = 03:00 UTC)**, y cada lead queda en **ambos lados**: en este CRM (D1) y en Brevo (lista «Web · <Marca>»,
como hasta ahora). Antes de esa fecha los formularios funcionan igual y mandan a Brevo, pero no guardan nada aquí.

- **Dónde se guarda:** `functions/api/formulario.js` llama a `guardarLead` (`functions/api/leads.js`) antes de enviar el aviso a ventas, así un fallo del correo
  no pierde la solicitud (queda marcada «sin aviso»). Tablas en D1 `oceanic-cms`: `leads`, `lead_notas`, `crm_acciones` (se crean solas; `worker/migraciones/0002_leads.sql` las documenta).
- **Qué es un lead:** cualquier formulario con datos de contacto (cotización, usados, contacto, charter, equipamiento, boyas, eventos). La suscripción sola a Puerto
  y las solicitudes de derechos (privacidad) **no** son leads.
- **Cada lead guarda:** fecha, tipo, nombre, correo, teléfono, marca, modelo, categoría, página de origen, mensaje, versión de la política aceptada, **etapa**,
  si el aviso a ventas salió y el estado en Brevo (`ok`, `error`, `sin-clave`).
- **En el administrador:** métricas (leads, nuevos 7 días, sin atender, cerrados), búsqueda y filtros por etapa y tipo, ficha con correo/WhatsApp, **etapa**
  (Nuevo, Contactado, Cotizado, En negociación, Cerrado, Perdido), notas internas y «Eliminar lead».
- **Etapa en ambos lados:** al guardar la etapa también se actualiza el atributo `ETAPA` del contacto en Brevo (mejor esfuerzo; la pantalla dice si Brevo respondió).
- **Eliminar (Ley 21.719, derecho de supresión):** borra el lead y sus notas de este CRM. En Brevo no se borra nada: si corresponde, se borra allá también.
  Queda anotado quién y cuándo, sin datos personales.
- **Adelantar o atrasar el inicio:** variable `CRM_DESDE` del Worker (ISO, p. ej. `2026-12-01T03:00:00Z`) para probar antes del lanzamiento.
- **Código:** `worker/crm.js` (API `/api/admin/crm/*`), `S.crm` en `admin/admin.js`. Pruebas: `tests/crm.test.mjs` (D1 simulada con `node:sqlite`).
- **No hay lectura de Brevo:** ni historial, ni listas, ni contactos antiguos. Brevo sigue con sus automatizaciones y campañas.
