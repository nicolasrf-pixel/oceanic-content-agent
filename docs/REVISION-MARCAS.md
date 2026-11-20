# Revisión de marcas (administrador › Revisar marcas)

Botón del administrador que compara las webs oficiales de cada marca con el catálogo del sitio y propone, con
aprobación, qué cargar, qué actualizar y qué ocultar. **No cambia nada sin que alguien lo apruebe.**

## Cómo funciona

```
Administrador (botón «Revisar marcas ahora»)
   → Worker llama a GitHub y lanza el flujo .github/workflows/revisar-marcas.yml
   → GitHub Actions corre tools/revisar_marcas.py (lee las webs oficiales, compara con biblioteca/ y el catálogo)
   → el informe queda en la rama revision-informes (revision/informe.json)
   → el administrador muestra el informe: modelos nuevos, cambiaron de dirección, ya no existen
   → se marcan las casillas y se aprueba:
        · «Ocultar del sitio»  → se guarda y publica el documento «publicacion» (con historial, reversible)
        · «Cargar» / «Actualizar dirección» → pull request en GitHub con la lista aprobada (no cambia el sitio)
```

El contenido de un modelo nuevo (extracción, traducción, fotos revisadas) **no se automatiza**: se carga después
con el proceso de `docs/PROCESO.md`, a partir de la lista del pull request.

## Qué detecta

| Caso | Cómo se decide |
| --- | --- |
| **Nuevo** | Enlace en la gama oficial que apunta a una ficha de modelo (misma carpeta que las fichas conocidas) y que el catálogo no tiene. Se descartan los enlaces que redirigen a otra página y palabras como configurador o galería. |
| **Cambió de dirección** | Ficha conocida que ya no está en la gama y cuya página redirige a otra dirección del mismo sitio. Se marca «posible descatalogado» si el destino parece una gama anterior (`former`, `heritage`, `2015-2022`…). |
| **Ya no existe** | Ficha conocida que no está en la gama y cuya página responde 404 o 410. |
| **Sin verificar** | La página no respondió (bloqueo, caída): no se saca ninguna conclusión. |

Una marca cuyas páginas de gama no se pudieron leer queda «bloqueada» o «parcial» y se avisa. Switch y VX One
son un solo modelo en una página única: no hay lista que comparar.

**No cubre** (a propósito, fase 1): cambios en los datos de un modelo ya cargado (eslora, peso, fotos). Eso sigue
siendo una revisión por modelo con el proceso de la biblioteca.

## Puesta en marcha (una sola vez)

1. **Dejar el flujo en `main`.** GitHub solo deja lanzar un flujo desde el administrador si su archivo está en la
   rama principal: mezclar a `main` el archivo `.github/workflows/revisar-marcas.yml`.
2. **Crear el token de GitHub** (lo hace el dueño del repositorio, en GitHub › Settings › Developer settings ›
   Personal access tokens › Fine-grained tokens):
   - Repositorio: solo `oceanic-content-agent`.
   - Permisos: *Actions* lectura y escritura · *Contents* lectura y escritura · *Pull requests* lectura y escritura.
   - Vencimiento: el más largo que acepte la política de Oceanic (anotar la fecha para renovarlo).
3. **Guardarlo en Cloudflare** como secreto del Worker `oceanic`, con el nombre `GH_TOKEN`
   (Workers › oceanic › Settings › Variables and Secrets › Add › Type: Secret). Nunca por chat ni correo.
4. **Opcional, para Saffier:** su web bloquea la lectura directa. En GitHub › Settings › Secrets and variables ›
   Actions, crear el secreto `FIRECRAWL_API_KEY`. Sin él, Saffier aparece «bloqueada» y no se revisa.
   Solo se usa como respaldo, en las páginas que bloquean la lectura directa (hoy Saffier y, a veces, Solaris): son
   unas pocas decenas de créditos por revisión. Conviene mirar el consumo real en Firecrawl tras las primeras revisiones.
5. Variables opcionales del Worker (no son secretos): `GH_REPO` (por defecto `nicolasrf-pixel/oceanic-content-agent`),
   `GH_BASE` (rama del sitio, `sitio-web`), `GH_FLUJO_RAMA` (rama del flujo, `main`).

Mientras falte `GH_TOKEN`, la pantalla lo dice y explica estos pasos; no se rompe nada.

## Uso

1. Administrador › Herramientas › **Revisar marcas (scraping)** › «Revisar marcas ahora». Tarda unos minutos; la
   pantalla se actualiza sola.
2. Revisar el informe. Las casillas parten desmarcadas.
3. «Aprobar lo marcado»: pide confirmación con el resumen. Lo que se oculta se publica de inmediato; lo demás queda
   en un pull request.
4. Para volver a mostrar un modelo oculto: Publicación y destacados › interruptor del modelo.

Un modelo destacado de la portada no se puede ocultar desde aquí: primero hay que cambiarlo en Publicación y
destacados (el servidor lo rechazaría).

## Seguridad

- El token vive solo como secreto del Worker y solo toca este repositorio. Quien entra al administrador no lo ve.
- Las acciones de aprobar exigen la sesión del administrador y la cabecera anti-CSRF, como el resto del CMS.
- El pull request solo agrega un archivo en `revision/aprobados/`; no toca el sitio. Los textos que vienen de las
  webs se limpian y no mencionan usuarios de GitHub.
- El detector solo lee páginas públicas, con pausas entre peticiones, y no elude captchas.

## Archivos

`tools/revisar_marcas.py` (detector) · `tools/tests/test_revisar.py` · `.github/workflows/revisar-marcas.yml` ·
`sitio/worker/revision.js` (GitHub desde el Worker) · `sitio/tests/revision.test.mjs` · `sitio/admin/admin.js › S.revision`.


## Avisos externos (marcas con web protegida por captcha)
Solaris protege su web con un captcha anti-bots (SiteGround) que **no se elude**. En su lugar el informe trae un «aviso externo» (no oficial,
`SENALES` en `tools/revisar_marcas.py`): lee `solariscatalogues.com` (catálogos que publica el propio fabricante) y la lista de Berthon
International (distribuidor) y avisa si aparece un modelo que la biblioteca no tiene. No se saca ningún dato: el modelo se carga después
desde la web oficial, mirada a mano en el navegador (regla 1 de CLAUDE.md).


## Aprobar es automático (decisión Oceanic 2026-11-20)
Al apretar «Aprobar» el administrador deja la lista en una rama `revision-aprobada-*` y abre un pull request. Ahí corre solo el flujo
`.github/workflows/aplicar-revision.yml`, que ejecuta `tools/aplicar_revision.py`:
- **Actualizar dirección:** corrige la fuente oficial registrada en el paquete (la captura original no se toca).
- **Cargar modelo nuevo:** baja la ficha oficial (y la versión EE. UU. en Beneteau), extrae, arma el paquete de la biblioteca, traduce las frases
  nuevas al español y redacta los textos cortos (IA, solo con lo que dice la web, borrador), y lo publica: catálogo, fotos, tarjeta, ficha y mapa del sitio.
- Corre las pruebas; si todo salió bien (`completo`) **fusiona el pull request solo** y Cloudflare publica. Si algo falla o falta algo, el pull request
  queda abierto con un comentario que dice qué pasó.
- **Secreto `ANTHROPIC_API_KEY` (GitHub › Settings › Secrets › Actions):** lo usa solo la traducción y los textos cortos. Sin él, el modelo queda cargado en
  la biblioteca y el aviso dice «falta traducir»; no se publica nada en inglés. Las direcciones se corrigen igual.
- Webs con captcha (Solaris) no se leen: el paso se informa y esa marca se carga a mano.
- Lo que no se carga solo: marcas sin adaptador, modelos de gamas anteriores que conviene revisar a la vista (se oculta o se ignora desde el informe).

## Aviso semanal por correo (decisión Oceanic 2026-11-20)

Nadie tiene que acordarse de revisar: **cada lunes** el Worker lanza solo la revisión (11:00 UTC) y, cuando termina
(12:00 UTC; respaldo a las 14:00 UTC), manda **un correo solo si hay novedades** (modelos nuevos, cambios de dirección
o modelos que ya no existen). El correo no cambia nada: lleva a `/admin/#revision`, donde se marca lo que corresponde y
se aprueba con OK. Una misma novedad no se vuelve a avisar. Si no hay novedades, no llega nada.

- Código: `sitio/worker/aviso.js` (cron en `sitio/wrangler.jsonc › triggers`, manejador `scheduled` en `worker/index.js`),
  pruebas en `sitio/tests/aviso.test.mjs`. La huella de lo ya avisado vive en la tabla `avisos` de D1 (se crea sola).
- Destinatario: variable `AVISO_EMAIL` del Worker (no es secreto). Si falta, el primer correo de `ADMIN_EMAILS`; si
  falta, `VENTAS_EMAIL`. Usa el mismo SMTP que los formularios (`SMTP_CLAVE`).
- Para probar sin esperar al lunes: Cloudflare › Worker › Settings › Triggers › Cron Triggers, o `wrangler triggers`.

**Después del OK se montan igual que todos los demás modelos** (decisión Oceanic 2026-11-20): se avisa a Claude con
«monta lo aprobado» y se carga con el proceso de la biblioteca (`docs/PROCESO.md`: extraer, construir, traducir fiel,
fotos revisadas, catálogo, ficha del sitio, pruebas) y se publica. No se necesita cuenta de Anthropic para Oceanic.
