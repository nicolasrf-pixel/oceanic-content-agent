// Pruebas de worker/revision.js con GitHub simulado: no llaman a ninguna API real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoRevision, iniciarRevision, aprobarRevision, validarAprobacion, cuerpoPR } from '../worker/revision.js';

const ENV = { GH_TOKEN: 'token-de-prueba', GH_REPO: 'org/repo' };
const original = globalThis.fetch;

function github(rutas) {
  const llamadas = [];
  globalThis.fetch = async (url, opts = {}) => {
    const ruta = url.replace('https://api.github.com', ''), metodo = opts.method || 'GET';
    llamadas.push({ ruta, metodo, cuerpo: opts.body ? JSON.parse(opts.body) : null, auth: opts.headers.Authorization });
    for (const [clave, resp] of Object.entries(rutas)) {
      if (!`${metodo} ${ruta}`.startsWith(clave)) continue;
      if (typeof resp === 'function') return resp();
      return resp.estado === 204 ? new Response(null, { status: 204 }) : Response.json(resp.cuerpo || {}, { status: resp.estado || 200 });
    }
    return Response.json({ message: 'Not Found' }, { status: 404 });
  };
  return llamadas;
}
test.afterEach(() => { globalThis.fetch = original; });

const INFORME = { generado: '2026-11-17T10:00:00Z', marcas: [], resumen: { nuevos: 1 } };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64');

test('sin GH_TOKEN todo responde «sin configurar» y no llama a GitHub', async () => {
  const llamadas = github({});
  const e = await estadoRevision({});
  assert.equal(e.configurado, false);
  assert.equal((await iniciarRevision({})).configurado, false);
  assert.equal((await aprobarRevision({}, {}, 'a@b.cl')).configurado, false);
  assert.equal(llamadas.length, 0);
});

test('estado: devuelve la última ejecución y el informe decodificado', async () => {
  github({
    'GET /repos/org/repo/actions/workflows/revisar-marcas.yml/runs': { cuerpo: { workflow_runs: [{ id: 7, status: 'completed', conclusion: 'success', created_at: 'x', html_url: 'u' }] } },
    'GET /repos/org/repo/contents/revision/informe.json?ref=revision-informes': { cuerpo: { content: b64(INFORME) } },
  });
  const e = await estadoRevision(ENV);
  assert.equal(e.ok, true);
  assert.equal(e.ejecucion.conclusion, 'success');
  assert.deepEqual(e.informe, INFORME);
});

test('estado: sin informe todavía no es un error', async () => {
  github({ 'GET /repos/org/repo/actions/workflows/revisar-marcas.yml/runs': { cuerpo: { workflow_runs: [] } } });
  const e = await estadoRevision(ENV);
  assert.equal(e.ok, true);
  assert.equal(e.informe, null);
});

test('iniciar: lanza el flujo en main y no lanza otro si ya hay uno en curso', async () => {
  let llamadas = github({
    'GET /repos/org/repo/actions/workflows/revisar-marcas.yml/runs': { cuerpo: { workflow_runs: [{ status: 'completed' }] } },
    'POST /repos/org/repo/actions/workflows/revisar-marcas.yml/dispatches': { estado: 204 },
  });
  const r = await iniciarRevision(ENV);
  assert.equal(r.ok, true);
  const d = llamadas.find((l) => l.metodo === 'POST');
  assert.deepEqual(d.cuerpo, { ref: 'main', inputs: { extra: '{}' } });
  assert.equal(d.auth, 'Bearer token-de-prueba');

  llamadas = github({ 'GET /repos/org/repo/actions/workflows/revisar-marcas.yml/runs': { cuerpo: { workflow_runs: [{ status: 'in_progress' }] } } });
  const r2 = await iniciarRevision(ENV);
  assert.equal(r2.ok, false);
  assert.equal(r2.enCurso, true);
  assert.ok(!llamadas.some((l) => l.metodo === 'POST'));
});

test('iniciar: si GitHub rechaza, explica qué revisar', async () => {
  github({
    'GET /repos/org/repo/actions/workflows/revisar-marcas.yml/runs': { cuerpo: { workflow_runs: [] } },
    'POST /repos/org/repo/actions/workflows/revisar-marcas.yml/dispatches': { estado: 404, cuerpo: { message: 'Not Found' } },
  });
  const r = await iniciarRevision(ENV);
  assert.equal(r.ok, false);
  assert.match(r.error, /rama principal/);
});

const APROBADO = {
  cargar: [{ marca: 'beneteau', url: 'https://www.beneteau.com/new-gran-turismo-range/gran-turismo-45-open', titulo: 'Gran Turismo 45 Open | BENETEAU' }],
  actualizar: [{ marca: 'beneteau', slug: 'first-36-spirit', url: 'https://www.beneteau.com/first-2016-2026/first-36-spirit', destino: 'https://www.beneteau.com/first/first-36-spirit' }],
};

test('validación: rechaza direcciones que no son https, listas enormes y solicitudes vacías', () => {
  assert.equal(validarAprobacion(APROBADO).ok, true);
  assert.ok(validarAprobacion({ cargar: [{ url: 'javascript:alert(1)' }] }).error);
  assert.ok(validarAprobacion({ cargar: [{ url: 'http://x.cl/a' }] }).error);
  assert.ok(validarAprobacion({ cargar: Array(201).fill({ url: 'https://x.cl/a' }) }).error);
  assert.ok(validarAprobacion({ cargar: [], actualizar: [] }).error);
  assert.ok(validarAprobacion(null).error);
  assert.ok(validarAprobacion({ actualizar: [{ url: 'https://x.cl/a', destino: 'https://x.cl/b', slug: '../etc' }] }).error);
});

test('el cuerpo del pull request no menciona a nadie con @', () => {
  const a = validarAprobacion({ cargar: [{ marca: 'x', url: 'https://x.cl/a', titulo: 'hola @alguien' }] });
  const t = cuerpoPR(a, 'nico@oceanic.cl', '2026-11-17');
  assert.ok(!/@alguien/.test(t));
  assert.match(t, /Modelos nuevos para cargar/);
});

test('aprobar: crea rama desde sitio-web, guarda la lista y abre el pull request', async () => {
  const llamadas = github({
    'GET /repos/org/repo/git/ref/heads/sitio-web': { cuerpo: { object: { sha: 'abc123' } } },
    'POST /repos/org/repo/git/refs': { estado: 201 },
    'PUT /repos/org/repo/contents/revision/aprobados/': { estado: 201 },
    'POST /repos/org/repo/pulls': { estado: 201, cuerpo: { html_url: 'https://github.com/org/repo/pull/9', number: 9 } },
  });
  const r = await aprobarRevision(ENV, APROBADO, 'nico@oceanic.cl');
  assert.equal(r.ok, true);
  assert.equal(r.pr, 'https://github.com/org/repo/pull/9');
  const ref = llamadas.find((l) => l.ruta.endsWith('/git/refs'));
  assert.equal(ref.cuerpo.sha, 'abc123');
  assert.match(ref.cuerpo.ref, /^refs\/heads\/revision-aprobada-\d{4}-\d{2}-\d{2}-/);
  const pr = llamadas.find((l) => l.ruta.endsWith('/pulls'));
  assert.equal(pr.cuerpo.base, 'sitio-web');
  assert.match(pr.cuerpo.title, /1 por cargar, 1 por actualizar/);
  const archivo = JSON.parse(Buffer.from(llamadas.find((l) => l.metodo === 'PUT').cuerpo.content, 'base64').toString());
  assert.equal(archivo.aprobado_por, 'nico@oceanic.cl');
  assert.equal(archivo.cargar.length, 1);
});

test('aprobar: si falla la rama no sigue y no abre pull request', async () => {
  const llamadas = github({ 'GET /repos/org/repo/git/ref/heads/sitio-web': { estado: 403, cuerpo: { message: 'Resource not accessible' } } });
  const r = await aprobarRevision(ENV, APROBADO, 'a@b.cl');
  assert.equal(r.ok, false);
  assert.match(r.error, /permisos/);
  assert.ok(!llamadas.some((l) => l.metodo === 'POST'));
});

test('sin GH_TOKEN, el estado muestra los nombres de las claves del Worker pero nunca sus valores', async () => {
  const env = { ADMIN_PASSWORD: 'super-secreta', GITHUB_TOKEN: 'ghp_valor_que_no_debe_salir', GH_TOKEN_: 'x', DB: {}, MEDIA: {} };
  const e = await estadoRevision(env);
  assert.equal(e.configurado, false);
  assert.deepEqual(e.variables.todos, ['ADMIN_PASSWORD', 'GH_TOKEN_', 'GITHUB_TOKEN']);
  assert.deepEqual(e.variables.parecidos, ['GH_TOKEN_', 'GITHUB_TOKEN']);
  const texto = JSON.stringify(e);
  assert.ok(!texto.includes('super-secreta') && !texto.includes('ghp_valor'), 'nunca devuelve valores');
});

test('si el token no tiene permiso para lanzar el flujo, el mensaje dice cuál permiso falta', async () => {
  github({
    'GET /repos/org/repo/actions/workflows/revisar-marcas.yml/runs': { cuerpo: { workflow_runs: [] } },
    'POST /repos/org/repo/actions/workflows/revisar-marcas.yml/dispatches': { estado: 403, cuerpo: { message: 'Resource not accessible by personal access token' } },
  });
  const r = await iniciarRevision(ENV);
  assert.equal(r.ok, false);
  assert.match(r.error, /Actions: Read and write/);
  assert.match(r.error, /No hace falta cambiarlo en Cloudflare/);
});

test('limpiarExtra: solo marcas válidas con direcciones https', async () => {
  const { limpiarExtra } = await import('../worker/revision.js');
  assert.deepEqual(limpiarExtra({ 'delta-yachts': ['https://delta.example/boats', 'http://x', 'javascript:1'], 'MALA': ['https://a.b/cc'], rescate: 'x' }), { 'delta-yachts': ['https://delta.example/boats'] });
  assert.deepEqual(limpiarExtra(null), {});
  assert.deepEqual(limpiarExtra([1]), {});
});
