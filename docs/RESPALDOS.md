# Respaldos (decisión Oceanic 2026-11-23)

Qué se respalda y dónde:

| Qué | Dónde está el respaldo |
| --- | --- |
| Código, textos del repositorio, catálogo, biblioteca, traducciones | **GitHub** (rama `sitio-web` y `main`). Es el respaldo principal; el repositorio pasa a privado el 1 de diciembre. |
| Base D1 `oceanic-cms`: textos y contenido publicados desde el administrador (con su historial), medios, leads, notas y acciones del CRM, avisos | **R2 `oceanic-respaldos`**, `d1/AAAA-MM-DD.json.gz` (un archivo por día) |
| Archivos subidos desde el administrador (KV `oceanic-imagenes`) | **R2 `oceanic-respaldos`**, `kv/<clave>` (solo se copia lo que falta) |
| Contactos y listas | **Brevo** (el CRM propio guarda además cada lead en D1 desde el 2026-12-01) |
| Fotos de las fichas | Se vuelven a bajar de las webs oficiales al publicar; las de Solaris y Saffier están en el repositorio |

Además, D1 trae **Time Travel**: volver a cualquier minuto de los últimos 7 días (plan gratis) o 30 días (plan pago) sin hacer nada.

## Cuándo se respalda
- **Cada día a las 06:00 UTC** (03:00 en Chile): cron del Worker (`wrangler.jsonc › triggers`).
- **Al abrir el administrador**, si el último respaldo tiene más de 24 horas.
- **A mano**: administrador › Respaldos › «Respaldar ahora».

Se conservan las copias de la base de los últimos 30 días y la del día 1 de cada mes durante 12 meses. El bucket es **privado**: las copias traen datos personales (leads), así que solo se bajan desde el administrador (Respaldos › Descargar) y no se comparten.

## Cómo restaurar
1. Descargar la copia del día (`oceanic-AAAA-MM-DD.json.gz`) desde el administrador.
2. Generar el SQL: `python3 tools/respaldo_a_sql.py oceanic-AAAA-MM-DD.json.gz > restaurar.sql` (borra y vuelve a cargar cada tabla).
3. Revisar el archivo y aplicarlo: `cd sitio && npx wrangler d1 execute oceanic-cms --remote --file=../restaurar.sql`.
   Si solo falla algo reciente, es más simple usar Time Travel: `npx wrangler d1 time-travel restore oceanic-cms --timestamp=<unix>`.
4. Los archivos subidos (`kv/<clave>`) se vuelven a subir al KV con `npx wrangler kv key put --binding=MEDIA <clave> --path=<archivo> --remote`.

## Puesta en marcha (ya hecha)
Bucket `oceanic-respaldos` creado en Cloudflare R2; binding `RESPALDOS` en `sitio/wrangler.jsonc`. Código: `sitio/worker/respaldo.js`; pruebas: `sitio/tests/respaldo.test.mjs`.
