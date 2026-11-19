// CRM propio: leads en D1 (simulada con node:sqlite) y Brevo simulado. Sin red.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { crm, ETAPAS } from '../worker/crm.js';
import { esLead, guardarLead, LEADS_DESDE, desde } from '../functions/api/leads.js';
import { onRequestPost as formulario } from '../functions/api/formulario.js';

function d1() {
  const db = new DatabaseSync(':memory:');
  const st = (sql, p = []) => ({
    bind: (...x) => st(sql, x),
    run: async () => { const r = db.prepare(sql).run(...p); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: Number(r.changes) } }; },
    first: async () => db.prepare(sql).get(...p) || null,
    all: async () => ({ results: db.prepare(sql).all(...p).map((x) => ({ ...x })) }),
  });
  return { prepare: (s) => st(s), batch: async (a) => { for (const s of a) await s.run(); return []; }, db };
}
const U = (p) => new URL('https://x.cl/api/admin/' + p);
const DESPUES = '2026-12-01T03:00:00Z', ANTES = '2026-11-30T23:59:59Z';
const lead = (o = {}) => ({ tipo: 'cotizacion', nombre: 'Ana Soto', email: 'ana@correo.cl', telefono: '+56912345678', marca: 'Beneteau', modelo: 'Oceanis 34.1', categorias: [], puerto: false, fecha: DESPUES, politica: 'v1', ...o });

test('el lanzamiento es el 1 de diciembre 00:00 de Chile (03:00 UTC) y Puerto/privacidad nunca son leads', () => {
  assert.equal(LEADS_DESDE, '2026-12-01T03:00:00Z');
  assert.equal(esLead(lead(), {}, ANTES), false);
  assert.equal(esLead(lead(), {}, DESPUES), true);
  assert.equal(esLead(lead({ tipo: 'puerto' }), {}, DESPUES), false);
  assert.equal(esLead(lead({ tipo: 'privacidad' }), {}, DESPUES), false);
  assert.equal(desde({ CRM_DESDE: '2020-01-01T00:00:00Z' }), '2020-01-01T00:00:00Z');
});

test('antes del lanzamiento no se guarda nada; después, sí', async () => {
  const env = { DB: d1() };
  assert.equal(await guardarLead(env, lead({ fecha: ANTES }), 'Embarcaciones nuevas'), null);
  const id = await guardarLead(env, lead(), 'Embarcaciones nuevas');
  assert.ok(id > 0);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) AS n FROM leads').get().n, 1);
});

test('formulario: el lead queda en D1 y en Brevo, con el estado de cada lado', async () => {
  const env = { DB: d1(), CRM_DESDE: '2020-01-01T00:00:00Z', BREVO_API_KEY: 'k', REMITENTE_EMAIL: 'no@x.cl', VENTAS_EMAIL: 'v@x.cl', ORIGENES_PERMITIDOS: 'https://x.cl' };
  const llamadas = [];
  globalThis.fetch = async (url, init = {}) => { llamadas.push((init.method || 'GET') + ' ' + String(url).replace('https://api.brevo.com/v3', '')); return new Response('{}', { status: 200 }); };
  const req = new Request('https://x.cl/api/formulario', { method: 'POST', headers: { 'content-type': 'application/json', Origin: 'https://x.cl' },
    body: JSON.stringify({ tipo: 'contacto', nombre: 'Luis Pérez', email: 'luis@correo.cl', mensaje: 'Quiero información', acepta: true }) });
  const r = await formulario({ request: req, env, enviar: async () => ({ ok: true, status: 250 }) });
  assert.equal(r.status, 200);
  const fila = env.DB.db.prepare('SELECT * FROM leads').get();
  assert.equal(fila.email, 'luis@correo.cl'); assert.equal(fila.etapa, 'Nuevo'); assert.equal(fila.aviso_ok, 1); assert.equal(fila.brevo, 'ok');
  assert.ok(llamadas.some((l) => l.startsWith('POST /contacts')), 'Brevo sigue recibiendo el contacto');
});

test('formulario: si el correo falla, el lead igual queda guardado (marcado sin aviso)', async () => {
  const env = { DB: d1(), CRM_DESDE: '2020-01-01T00:00:00Z', REMITENTE_EMAIL: 'no@x.cl', ORIGENES_PERMITIDOS: 'https://x.cl' };
  const req = new Request('https://x.cl/api/formulario', { method: 'POST', headers: { 'content-type': 'application/json', Origin: 'https://x.cl' },
    body: JSON.stringify({ tipo: 'contacto', nombre: 'Eva', email: 'eva@correo.cl', acepta: true }) });
  const r = await formulario({ request: req, env, enviar: async () => ({ ok: false, status: 'smtp' }) });
  assert.equal(r.status, 502);
  const fila = env.DB.db.prepare('SELECT * FROM leads').get();
  assert.equal(fila.aviso_ok, 0);
});

test('formulario antes del lanzamiento: no guarda leads', async () => {
  const env = { DB: d1(), CRM_DESDE: '2999-01-01T00:00:00Z', REMITENTE_EMAIL: 'no@x.cl', ORIGENES_PERMITIDOS: 'https://x.cl' };
  const req = new Request('https://x.cl/api/formulario', { method: 'POST', headers: { 'content-type': 'application/json', Origin: 'https://x.cl' },
    body: JSON.stringify({ tipo: 'contacto', nombre: 'Eva', email: 'eva@correo.cl', acepta: true }) });
  const r = await formulario({ request: req, env, enviar: async () => ({ ok: true, status: 250 }) });
  assert.equal(r.status, 200);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'leads'").get().n, 0);
});

async function conLeads() {
  const env = { DB: d1() };
  await guardarLead(env, lead(), 'Embarcaciones nuevas');
  await guardarLead(env, lead({ nombre: 'Luis', email: 'luis@correo.cl', marca: 'Axopar', modelo: 'Axopar 37 XC', tipo: 'contacto', fecha: '2026-12-02T10:00:00Z' }), 'Contacto');
  return env;
}

test('API: resumen, listado con filtros y ficha con notas', async () => {
  const env = await conLeads();
  let r = await crm(env, 'crm/resumen', 'GET', U('crm/resumen'), null, 'a@b.cl');
  assert.equal(r.total, 2); assert.equal(r.porEtapa.Nuevo, 2); assert.equal(r.etapas.length, ETAPAS.length);
  r = await crm(env, 'crm/leads', 'GET', U('crm/leads?q=axopar'), null, 'a@b.cl');
  assert.equal(r.leads.length, 1); assert.equal(r.leads[0].email, 'luis@correo.cl');
  r = await crm(env, 'crm/leads', 'GET', U('crm/leads?tipo=cotizacion'), null, 'a@b.cl');
  assert.equal(r.leads[0].nombre, 'Ana Soto');
  r = await crm(env, 'crm/leads', 'GET', U("crm/leads?q=' OR 1=1 --"), null, 'a@b.cl');  // no es inyección: es solo un texto sin resultados
  assert.equal(r.leads.length, 0);
  await crm(env, 'crm/accion', 'POST', U('crm/accion'), { id: 1, accion: 'nota', valor: 'Llamar el lunes' }, 'a@b.cl');
  r = await crm(env, 'crm/lead', 'GET', U('crm/lead?id=1'), null, 'a@b.cl');
  assert.equal(r.lead.notas[0].texto, 'Llamar el lunes'); assert.equal(r.lead.notas[0].quien, 'a@b.cl');
});

test('API: cambiar etapa actualiza D1 y avisa a Brevo (ETAPA); etapa inventada se rechaza', async () => {
  const env = { ...(await conLeads()), BREVO_API_KEY: 'k' };
  const llamadas = [];
  globalThis.fetch = async (url, init = {}) => { llamadas.push({ m: init.method, url: String(url), cuerpo: init.body && JSON.parse(init.body) }); return new Response(null, { status: 204 }); };
  let r = await crm(env, 'crm/accion', 'POST', U('crm/accion'), { id: 1, accion: 'etapa', valor: 'Cotizado' }, 'a@b.cl');
  assert.equal(r.ok, true); assert.equal(r.brevo, 'ok');
  assert.equal(env.DB.db.prepare('SELECT etapa FROM leads WHERE id = 1').get().etapa, 'Cotizado');
  assert.deepEqual(llamadas[0].cuerpo, { attributes: { ETAPA: 'Cotizado' } }); assert.match(llamadas[0].url, /contacts\/ana%40correo\.cl$/);
  r = await crm(env, 'crm/accion', 'POST', U('crm/accion'), { id: 1, accion: 'etapa', valor: 'Inventada' }, 'a@b.cl');
  assert.equal(r.ok, false); assert.equal(r._status, 400);
  // sin clave de Brevo: la orden vale igual y lo dice
  r = await crm({ DB: env.DB }, 'crm/accion', 'POST', U('crm/accion'), { id: 2, accion: 'etapa', valor: 'Cerrado' }, 'a@b.cl');
  assert.equal(r.ok, true); assert.equal(r.brevo, 'sin-clave');
});

test('API: eliminar borra el lead y sus notas (derecho de supresión) y lo anota sin datos personales', async () => {
  const env = await conLeads();
  await crm(env, 'crm/accion', 'POST', U('crm/accion'), { id: 1, accion: 'nota', valor: 'x' }, 'a@b.cl');
  const r = await crm(env, 'crm/accion', 'POST', U('crm/accion'), { id: 1, accion: 'eliminar' }, 'a@b.cl');
  assert.equal(r.ok, true);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) AS n FROM leads WHERE id = 1').get().n, 0);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) AS n FROM lead_notas WHERE lead_id = 1').get().n, 0);
  const reg = env.DB.db.prepare("SELECT * FROM crm_acciones WHERE accion = 'eliminar'").get();
  assert.equal(reg.contacto, 'lead:1'); assert.equal(JSON.stringify(reg).includes('ana@correo.cl'), false);
});

test('API: sin base D1 responde 503, y las acciones raras se rechazan', async () => {
  let r = await crm({}, 'crm/resumen', 'GET', U('crm/resumen'), null, 'a@b.cl');
  assert.equal(r._status, 503);
  const env = await conLeads();
  r = await crm(env, 'crm/accion', 'POST', U('crm/accion'), { id: 1, accion: 'borrar-todo' }, 'a@b.cl');
  assert.equal(r.ok, false);
  r = await crm(env, 'crm/accion', 'POST', U('crm/accion'), { id: '1; DROP TABLE leads', accion: 'eliminar' }, 'a@b.cl');
  assert.equal(r.ok, false);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) AS n FROM leads').get().n, 2);
});
