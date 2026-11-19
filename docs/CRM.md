# CRM en el administrador (`/admin/#crm`)

Los leads viven en **Brevo** (fuente de verdad). El administrador los muestra y permite ordenarlos sin entrar a Brevo. No guarda ninguna copia de
los contactos (Ley 21.719): cada consulta se lee de Brevo en el momento.

- **Código:** `sitio/worker/crm.js` (API `/api/admin/crm/*`) y `S.crm` en `sitio/admin/admin.js`. Pruebas: `sitio/tests/crm.test.mjs` (Brevo simulado).
- **Clave:** secreto `BREVO_API_KEY` del Worker (la misma de los formularios). Nunca llega al navegador. Si falta, la pantalla lo dice.
- **Lectura:** resumen (total de contactos, nuevos de 7 días, listas), contactos de las 500 altas más recientes con búsqueda por texto y filtro por
  lista, búsqueda directa por correo exacto (cualquier antigüedad) y ficha del contacto.
- **Escritura (solo tres órdenes, validadas):** cambiar la **etapa** del lead (atributo `ETAPA`: Nuevo, Contactado, Cotizado, En negociación,
  Cerrado, Perdido), **agregar** a una lista y **quitar** de una lista (solo listas que existen). No envía campañas ni borra contactos.
- **Trazabilidad:** cada orden queda en D1, tabla `crm_acciones` (fecha, quién, contacto, acción, valor).
- **Datos que muestra:** `NOMBRE`, `APELLIDOS`, `MARCA`, `MODELO`, `ORIGEN`, `CANAL`, `MOMENTUM`, `ETAPA`, `WHATSAPP`, `SMS`, `TELEFONO`, `TIPO_FORMULARIO`,
  `LINEA_NEGOCIO`, `UNIVERSO` (los que el contacto tenga). Otros atributos no salen del Worker.
- **Límite conocido:** Brevo no busca por texto libre; se leen los 500 contactos más recientes y se filtra ahí. Para uno antiguo, buscar por su correo exacto.
- **Brevo no se ve afectado:** automatizaciones, campañas y listas siguen igual; el botón «Abrir Brevo» lleva a su panel.
