// Pruebas del endpoint de formularios. Correr desde sitio/:  node --test tests/formulario.test.mjs
// Usan datos de prueba y un Brevo simulado: no envían nada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, limpiar, validar, correoVentas, correoConfirmacion } from '../functions/api/formulario.js';

const SITIO = 'https://oceanic.example';
const ENV = {
  BREVO_API_KEY: 'clave-de-prueba',
  REMITENTE_EMAIL: 'no-responder@oceanic.example',
  VENTAS_EMAIL: 'ventas@oceanic.example',
  POLITICA_VERSION: '2026-11-borrador',
  BREVO_LISTA_PUERTO: '7',
  BREVO_PLANTILLA_DOI: '3',
  PUERTO_URL_CONFIRMADO: SITIO + '/puerto/?confirmado=1',
};

function pedido(cuerpo, origen = SITIO) {
  const headers = { 'content-type': 'application/json' };
  if (origen) headers.Origin = origen;
  return new Request(SITIO + '/api/formulario', { method: 'POST', headers, body: JSON.stringify(cuerpo) });
}

// Brevo simulado: registra cada llamada y responde según `fallar`.
function simularBrevo(fallar = () => false) {
  const llamadas = [];
  globalThis.fetch = async (url, opts) => {
    const ruta = url.replace('https://api.brevo.com/v3', '');
    const cuerpo = opts.body ? JSON.parse(opts.body) : null;
    llamadas.push({ ruta, metodo: opts.method, cuerpo, clave: opts.headers['api-key'] });
    if (fallar(ruta, cuerpo)) return new Response('{"message":"error"}', { status: 500 });
    if (ruta === '/crm/deals') return Response.json({ id: 'neg1' }, { status: 201 });
    if (ruta.startsWith('/contacts/') && opts.method === 'GET') return Response.json({ id: 42 });
    return Response.json({ messageId: 'x' }, { status: 201 });
  };
  return llamadas;
}

const COTIZACION = { tipo: 'cotizacion', nombre: 'Persona Prueba', email: 'Prueba@Ejemplo.cl', modelo: 'Axopar 37 XC', marca: 'Axopar', mensaje: 'Hola', acepta: true };

test('cotización: avisa a ventas, confirma al cliente y guarda el contacto', async () => {
  const llamadas = simularBrevo();
  const r = await onRequestPost({ request: pedido(COTIZACION), env: ENV });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  const correos = llamadas.filter((l) => l.ruta === '/smtp/email');
  assert.equal(correos.length, 2);
  assert.equal(correos[0].cuerpo.to[0].email, 'ventas@oceanic.example');
  assert.equal(correos[0].cuerpo.replyTo.email, 'prueba@ejemplo.cl');
  assert.equal(correos[0].cuerpo.subject, 'Tienes una cotización web, Axopar 37 XC');
  assert.match(correos[0].cuerpo.htmlContent, /Persona Prueba ha cotizado un Axopar 37 XC/);
  assert.equal(correos[1].cuerpo.to[0].email, 'prueba@ejemplo.cl');
  assert.equal(correos[1].cuerpo.subject, 'Hemos recibido tu cotización de un Axopar 37 XC');
  assert.match(correos[1].cuerpo.textContent, /^Hola Persona,/);
  assert.match(correos[1].cuerpo.textContent, /Tu mensaje: Hola/);
  assert.match(correos[1].cuerpo.textContent, /Gracias por cotizar en Oceanic/);
  const contacto = llamadas.find((l) => l.ruta === '/contacts' && l.metodo === 'POST');
  assert.equal(contacto.cuerpo.attributes.POLITICA_VERSION, '2026-11-borrador');
  assert.equal(contacto.cuerpo.attributes.MODELO, 'Axopar 37 XC');
  assert.ok(!('CONSENTIMIENTO_MARKETING' in contacto.cuerpo.attributes), 'nunca marca consentimiento desde el formulario');
  assert.ok(!llamadas.some((l) => l.ruta.includes('doubleOptin')), 'sin casilla no suscribe a Puerto');
  assert.ok(llamadas.every((l) => l.clave === 'clave-de-prueba'));
});

test('si falla el aviso a ventas responde 502 (el navegador usa el correo de respaldo)', async () => {
  simularBrevo((ruta, c) => ruta === '/smtp/email' && c.to[0].email === 'ventas@oceanic.example');
  const r = await onRequestPost({ request: pedido(COTIZACION), env: ENV });
  assert.equal(r.status, 502);
});

test('si falla algo secundario igual responde ok', async () => {
  simularBrevo((ruta) => ruta === '/contacts');
  const r = await onRequestPost({ request: pedido(COTIZACION), env: ENV });
  assert.equal(r.status, 200);
});

test('casilla Puerto marcada: pide doble confirmación con la lista y la plantilla', async () => {
  const llamadas = simularBrevo();
  await onRequestPost({ request: pedido({ ...COTIZACION, puerto: true }), env: ENV });
  const doi = llamadas.find((l) => l.ruta === '/contacts/doubleOptinConfirmation');
  assert.deepEqual(doi.cuerpo.includeListIds, [7]);
  assert.equal(doi.cuerpo.templateId, 3);
  assert.equal(doi.cuerpo.redirectionUrl, ENV.PUERTO_URL_CONFIRMADO);
  assert.equal(doi.cuerpo.attributes.CONSENTIMIENTO_MARKETING, true, 'solo aplica al confirmar');
});

test('suscripción sola a Puerto: no avisa a ventas ni crea el contacto antes de confirmar', async () => {
  const llamadas = simularBrevo();
  const r = await onRequestPost({ request: pedido({ tipo: 'puerto', email: 'a@b.cl', puerto: true, acepta: true }), env: ENV });
  assert.equal(r.status, 200);
  assert.deepEqual(llamadas.map((l) => l.ruta), ['/contacts/doubleOptinConfirmation']);
});

test('Puerto sin configurar en Brevo responde error en vez de fingir', async () => {
  simularBrevo();
  const env = { ...ENV, BREVO_PLANTILLA_DOI: '' };
  const r = await onRequestPost({ request: pedido({ tipo: 'puerto', email: 'a@b.cl', puerto: true, acepta: true }), env });
  assert.equal(r.status, 502);
});

test('negocio en el pipeline solo si está configurado, y queda ligado al contacto', async () => {
  let llamadas = simularBrevo();
  await onRequestPost({ request: pedido(COTIZACION), env: ENV });
  assert.ok(!llamadas.some((l) => l.ruta === '/crm/deals'));
  llamadas = simularBrevo();
  await onRequestPost({ request: pedido(COTIZACION), env: { ...ENV, BREVO_PIPELINE_ID: 'p1', BREVO_ETAPA_INICIAL: 'e1' } });
  const neg = llamadas.find((l) => l.ruta === '/crm/deals');
  assert.deepEqual(neg.cuerpo.attributes, { pipeline: 'p1', deal_stage: 'e1' });
  const link = llamadas.find((l) => l.ruta === '/crm/deals/link-unlink/neg1');
  assert.deepEqual(link.cuerpo, { linkContactIds: [42] });
});

test('sin clave de Brevo responde 503 y no llama a nadie', async () => {
  const llamadas = simularBrevo();
  const r = await onRequestPost({ request: pedido(COTIZACION), env: { POLITICA_VERSION: 'v' } });
  assert.equal(r.status, 503);
  assert.equal(llamadas.length, 0);
});

test('modo prueba valida pero no envía', async () => {
  const llamadas = simularBrevo();
  const r = await onRequestPost({ request: pedido(COTIZACION), env: { MODO_PRUEBA: '1' } });
  assert.deepEqual(await r.json(), { ok: true, modo: 'prueba' });
  assert.equal(llamadas.length, 0);
});

test('rechaza otro origen, datos inválidos y bots', async () => {
  const llamadas = simularBrevo();
  assert.equal((await onRequestPost({ request: pedido(COTIZACION, 'https://otro.example'), env: ENV })).status, 403);
  assert.equal((await onRequestPost({ request: pedido(COTIZACION, null), env: ENV })).status, 403);
  assert.equal((await onRequestPost({ request: pedido({ ...COTIZACION, email: 'malo' }), env: ENV })).status, 422);
  assert.equal((await onRequestPost({ request: pedido({ ...COTIZACION, tipo: 'otro' }), env: ENV })).status, 422);
  const bot = await onRequestPost({ request: pedido({ ...COTIZACION, web: 'http://spam' }), env: ENV });
  assert.equal(bot.status, 200);
  assert.equal(llamadas.length, 0);
});

test('limpia y recorta los campos', () => {
  const d = limpiar({ tipo: 'contacto', nombre: '  Ana\u0000 ', email: ' A@B.CL ', mensaje: 'x'.repeat(5000), puerto: 'true' });
  assert.equal(d.nombre, 'Ana');
  assert.equal(d.email, 'a@b.cl');
  assert.equal(d.mensaje.length, 3000);
  assert.equal(d.puerto, false, 'solo true booleano cuenta como casilla marcada');
  assert.equal(validar(limpiar({ tipo: 'equipamiento', nombre: 'A', email: 'a@b.cl', acepta: true })), 'categorias');
});

test('el correo a ventas escapa el HTML', () => {
  const d = { ...limpiar({ ...COTIZACION, nombre: '<script>x</script>' }), fecha: '2026-11-04T00:00:00Z', politica: 'v' };
  const c = correoVentas(d);
  assert.ok(!c.html.includes('<script>'));
  assert.ok(c.html.includes('&lt;script&gt;'));
});

test('cada tipo de solicitud recibe su agradecimiento (no solo las cotizaciones)', async () => {
  const casos = [
    [{ tipo: 'usado', modelo: 'XO DFNDR 8 (2024)' }, /consulta por el XO DFNDR 8/],
    [{ tipo: 'contacto', motivo: 'Otro' }, /Gracias por escribirnos/],
    [{ tipo: 'charter', detalle: '• Destino: Cícladas' }, /solicitud de charter/],
    [{ tipo: 'equipamiento', categorias: ['Velas'] }, /solicitud de equipamiento/],
    [{ tipo: 'privacidad', motivo: 'Supresión' }, /solicitud de supresión de datos personales/],
  ];
  for (const [extra, asunto] of casos) {
    const llamadas = simularBrevo();
    const r = await onRequestPost({ request: pedido({ nombre: 'Persona Prueba', email: 'a@b.cl', acepta: true, ...extra }), env: ENV });
    assert.equal(r.status, 200, extra.tipo);
    const alCliente = llamadas.filter((l) => l.ruta === '/smtp/email' && l.cuerpo.to[0].email === 'a@b.cl');
    assert.equal(alCliente.length, 1, extra.tipo + ': un agradecimiento');
    assert.match(alCliente[0].cuerpo.subject, asunto);
  }
});

test('el agradecimiento incluye la copia de lo enviado, escapada', () => {
  const d = { ...limpiar({ tipo: 'equipamiento', nombre: 'Ana', email: 'a@b.cl', categorias: ['Velas', 'Propulsión'], mensaje: '<b>hola</b>' }) };
  const c = correoConfirmacion(d);
  assert.match(c.texto, /Intereses: Velas, Propulsión/);
  assert.ok(c.html.includes('&lt;b&gt;hola&lt;/b&gt;'));
});

test('Ley 21.719: sin aceptar la política no se procesa la solicitud', async () => {
  assert.equal(validar(limpiar({ tipo: 'contacto', nombre: 'A', email: 'a@b.cl' })), 'acepta');
  assert.equal(validar(limpiar({ tipo: 'contacto', nombre: 'A', email: 'a@b.cl', acepta: 'true' })), 'acepta');
  assert.equal(validar(limpiar({ tipo: 'contacto', nombre: 'A', email: 'a@b.cl', acepta: true })), null);
  assert.equal(validar(limpiar({ tipo: 'privacidad', nombre: 'A', email: 'a@b.cl', motivo: 'Supresión', acepta: true })), null);
});

test('cotización desde la ficha: los datos del barco salen del catálogo del sitio, no del navegador', async () => {
  const llamadas = simularBrevo();
  const catalogo = '/* catálogo */\nwindow.OCEANIC_CATALOGO={"beneteau":{"nombre":"Beneteau","pais":"Francia","modelos":[' +
    '{"slug":"first-30","nombre":"First 30","tipo":"vela","eslora":"9,35 m","manga":"2,99 m","camarotes":"2 (+1 opcional)","peso":"3.040 kg","tarjeta":"modelos/first-30-g2.webp"}]}};';
  const env = { ...ENV, ASSETS: { fetch: async (req) => new URL(req.url).pathname === '/assets/js/catalogo-data.js' ? new Response(catalogo) : new Response('', { status: 404 }) } };
  const r = await onRequestPost({ request: pedido({ ...COTIZACION, marca: 'Otra', modelo: 'Falso', ficha: 'beneteau/first-30', intencion: 'Esta temporada', telefono: '+56 9 1234 5678' }), env });
  assert.equal(r.status, 200);
  const [ventas, cliente] = llamadas.filter((l) => l.ruta === '/smtp/email').map((l) => l.cuerpo);
  assert.equal(ventas.subject, 'Tienes una cotización web, Beneteau First 30');
  assert.match(ventas.htmlContent, /Persona Prueba ha cotizado un Beneteau First 30/);
  assert.match(ventas.htmlContent, /Esta temporada/);
  assert.match(ventas.htmlContent, /https:\/\/wa\.me\/56912345678/);
  assert.match(ventas.htmlContent, /https:\/\/oceanic\.example\/assets\/img\/modelos\/first-30-g2\.webp/);
  assert.equal(cliente.subject, 'Hemos recibido tu cotización de un Beneteau First 30');
  assert.match(cliente.htmlContent, /9,35 m/);
  assert.ok(!/opcional/i.test(cliente.htmlContent), 'la ficha corta no muestra opcionales');
  assert.ok(!/Falso/.test(ventas.htmlContent + cliente.htmlContent), 'ignora el modelo que manda el navegador');
});
