// Aviso semanal de «Revisar marcas» (worker/aviso.js). Sin red: GitHub y el correo van simulados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { novedades, armarCorreo, destinatario, avisoSemanal, CRON_LANZAR } from '../worker/aviso.js';

const AHORA = Date.parse('2026-11-23T12:05:00Z');
const informe = (extra = {}) => ({
  generado: '2026-11-23T11:20:00Z',
  marcas: [
    { marca: 'beneteau', nuevos: [{ titulo: 'Oceanis 60 | BENETEAU', url: 'https://www.beneteau.com/oceanis/oceanis-60' }], movidos: [], retirados: [] },
    { marca: 'lagoon', nuevos: [], movidos: [{ slug: 'lagoon-40', destino: 'https://x.test/lagoon-40-v2' }], retirados: [{ slug: 'lagoon-380', url: 'https://x.test/380' }] },
    ...(extra.marcas || []),
  ],
});
const okEstado = (inf, ej = { estado: 'completed', conclusion: 'success' }) => async () => ({ ok: true, informe: inf, ejecucion: ej });

// D1 de mentira: guarda una sola fila
function dbFalsa() {
  const f = { v: null };
  return {
    prepare: (sql) => ({
      bind: (...a) => ({
        first: async () => (f.v == null ? null : { valor: f.v }),
        run: async () => { if (/INSERT/.test(sql)) f.v = a[1]; },
      }),
      run: async () => {},
    }),
    _f: f,
  };
}
const entorno = (o = {}) => ({ DB: dbFalsa(), REMITENTE_EMAIL: 'contacto@oceanic.cl', VENTAS_EMAIL: 'ventasweb@oceanic.cl', AVISO_EMAIL: 'jefe@oceanic.cl', ...o });

test('novedades cuenta nuevos, movidos y retirados y deja una huella estable', () => {
  const n = novedades(informe());
  assert.equal(n.nuevos.length, 1); assert.equal(n.movidos.length, 1); assert.equal(n.retirados.length, 1); assert.equal(n.total, 3);
  assert.equal(novedades(informe()).huella, n.huella);
  assert.equal(novedades({ generado: 'x', marcas: [] }).total, 0);
  assert.equal(novedades(null).total, 0);
});

test('el correo limpia el texto que viene de las webs y lleva el enlace al administrador', () => {
  const n = novedades({ marcas: [{ marca: 'x', nuevos: [{ titulo: '<script>alert(1)</script> @usuario Modelo', url: 'https://x.test/a' }], movidos: [], retirados: [] }] });
  const c = armarCorreo(n, 'https://oceanic.example/');
  assert.equal(/<script>/i.test(c.html), false);
  assert.equal(/@usuario/.test(c.text + c.html), false);
  assert.match(c.html, /href="https:\/\/oceanic\.example\/admin\/#revision"/);
  assert.match(c.subject, /1 novedad para aprobar/);
});

test('destinatario: AVISO_EMAIL, luego el primero de ADMIN_EMAILS, luego ventas', () => {
  assert.equal(destinatario({ AVISO_EMAIL: 'a@b.cl', ADMIN_EMAILS: 'c@d.cl', VENTAS_EMAIL: 'e@f.cl' }), 'a@b.cl');
  assert.equal(destinatario({ ADMIN_EMAILS: 'c@d.cl, g@h.cl', VENTAS_EMAIL: 'e@f.cl' }), 'c@d.cl');
  assert.equal(destinatario({ VENTAS_EMAIL: 'e@f.cl' }), 'e@f.cl');
  assert.equal(destinatario({}), '');
});

test('el lunes de las 11:00 solo lanza la revisión (no manda correo)', async () => {
  let lanzada = 0, enviados = 0;
  const r = await avisoSemanal(entorno(), CRON_LANZAR, { iniciar: async () => { lanzada++; return { ok: true }; }, enviar: async () => { enviados++; return { ok: true }; }, ahora: AHORA });
  assert.equal(r.accion, 'lanzar'); assert.equal(lanzada, 1); assert.equal(enviados, 0);
});

test('con novedades manda un correo y no lo repite la segunda vez', async () => {
  const env = entorno(); const mandados = [];
  const dep = { estado: okEstado(informe()), enviar: async (c) => { mandados.push(c); return { ok: true }; }, ahora: AHORA };
  const a = await avisoSemanal(env, '0 12 * * 1', dep);
  const b = await avisoSemanal(env, '0 14 * * 1', dep);
  assert.equal(a.enviado, true); assert.equal(b.enviado, false); assert.equal(b.motivo, 'ya-avisado');
  assert.equal(mandados.length, 1);
  assert.deepEqual(mandados[0].to, [{ email: 'jefe@oceanic.cl' }]);
});

test('una novedad distinta sí vuelve a avisar', async () => {
  const env = entorno(); let n = 0;
  const dep = (inf) => ({ estado: okEstado(inf), enviar: async () => { n++; return { ok: true }; }, ahora: AHORA });
  await avisoSemanal(env, '0 12 * * 1', dep(informe()));
  const otro = informe({ marcas: [{ marca: 'axopar', nuevos: [{ titulo: 'Axopar 45', url: 'https://x.test/45' }], movidos: [], retirados: [] }] });
  const r = await avisoSemanal(env, '0 12 * * 1', dep(otro));
  assert.equal(r.enviado, true); assert.equal(n, 2);
});

test('no manda nada: sin novedades, revisión sin terminar, fallida, informe viejo o sin destinatario', async () => {
  const mandar = async () => { throw new Error('no debía enviar'); };
  const base = (o) => ({ enviar: mandar, ahora: AHORA, ...o });
  assert.equal((await avisoSemanal(entorno(), '0 12 * * 1', base({ estado: okEstado({ generado: '2026-11-23T11:20:00Z', marcas: [{ marca: 'a', nuevos: [], movidos: [], retirados: [] }] }) }))).motivo, 'sin-novedades');
  assert.equal((await avisoSemanal(entorno(), '0 12 * * 1', base({ estado: okEstado(informe(), { estado: 'in_progress', conclusion: null }) }))).motivo, 'revision-no-terminada');
  assert.equal((await avisoSemanal(entorno(), '0 12 * * 1', base({ estado: okEstado(informe(), { estado: 'completed', conclusion: 'failure' }) }))).motivo, 'revision-no-terminada');
  assert.equal((await avisoSemanal(entorno(), '0 12 * * 1', base({ estado: okEstado({ ...informe(), generado: '2026-11-16T11:20:00Z' }) }))).motivo, 'informe-antiguo');
  assert.equal((await avisoSemanal(entorno({ AVISO_EMAIL: '', VENTAS_EMAIL: '' }), '0 12 * * 1', base({ estado: okEstado(informe()) }))).motivo, 'sin-destinatario');
  assert.equal((await avisoSemanal(entorno(), '0 12 * * 1', base({ estado: async () => ({ ok: false }) }))).motivo, 'sin-informe');
});

test('si el correo falla no se marca como avisado: se reintenta en el siguiente horario', async () => {
  const env = entorno(); let intento = 0;
  const dep = { estado: okEstado(informe()), enviar: async () => (++intento === 1 ? { ok: false } : { ok: true }), ahora: AHORA };
  assert.equal((await avisoSemanal(env, '0 12 * * 1', dep)).enviado, false);
  assert.equal((await avisoSemanal(env, '0 14 * * 1', dep)).enviado, true);
});
