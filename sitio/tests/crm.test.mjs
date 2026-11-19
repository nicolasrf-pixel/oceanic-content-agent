// CRM del administrador: Brevo simulado (sin red). Comprueba lo que sale al navegador y lo que se permite escribir.
import test from 'node:test';
import assert from 'node:assert/strict';
import { crm, validarAccion, resumirContacto, ETAPAS } from '../worker/crm.js';

const U = (p) => new URL('https://x.cl/api/admin/' + p);
function simular(respuestas) {
  const llamadas = [];
  globalThis.fetch = async (url, init = {}) => {
    const clave = (init.method || 'GET') + ' ' + String(url).replace('https://api.brevo.com/v3', '');
    llamadas.push({ clave, cuerpo: init.body ? JSON.parse(init.body) : null, key: init.headers && init.headers['api-key'] });
    const hit = Object.entries(respuestas).find(([k]) => clave.startsWith(k));
    const [status, datos] = hit ? hit[1] : [404, { message: 'no' }];
    return new Response(datos == null ? null : JSON.stringify(datos), { status });
  };
  return llamadas;
}
const ENV = { BREVO_API_KEY: 'k-secreta' };
const CONTACTO = { id: 7, email: 'ana@correo.cl', emailBlacklisted: false, createdAt: '2026-11-18T10:00:00Z', modifiedAt: '2026-11-19T10:00:00Z', listIds: [4, 8],
  attributes: { NOMBRE: 'Ana', APELLIDOS: 'Soto', MARCA: 'Beneteau', MODELO: 'Oceanis 34.1', ETAPA: 'Nuevo', SECRETO_INTERNO: 'no debe salir', EXT_ID: 'x' } };

test('sin BREVO_API_KEY responde configurado:false y no llama a Brevo', async () => {
  const l = simular({});
  const r = await crm({}, 'crm/resumen', 'GET', U('crm/resumen'), null, 'a@b.cl');
  assert.equal(r.ok, false); assert.equal(r.configurado, false); assert.equal(l.length, 0);
});

test('resumirContacto: solo los campos permitidos', () => {
  const c = resumirContacto(CONTACTO);
  assert.equal(c.nombre, 'Ana Soto');
  assert.deepEqual(Object.keys(c.atributos).sort(), ['APELLIDOS', 'ETAPA', 'MARCA', 'MODELO', 'NOMBRE']);
  assert.equal(JSON.stringify(c).includes('SECRETO_INTERNO'), false);
});

test('resumen: listas, total y nuevos de 7 días; la clave viaja solo hacia Brevo', async () => {
  const l = simular({ 'GET /contacts/lists': [200, { lists: [{ id: 4, name: 'Web · Beneteau', uniqueSubscribers: 12 }] }], 'GET /contacts?limit=1&createdSince': [200, { count: 3 }], 'GET /contacts?limit=1': [200, { count: 99 }] });
  const r = await crm(ENV, 'crm/resumen', 'GET', U('crm/resumen'), null, 'a@b.cl');
  assert.equal(r.ok, true); assert.equal(r.total, 99); assert.equal(r.nuevos7, 3);
  assert.deepEqual(r.listas, [{ id: 4, nombre: 'Web · Beneteau', contactos: 12 }]);
  assert.ok(l.every((x) => x.key === 'k-secreta')); assert.equal(JSON.stringify(r).includes('k-secreta'), false);
});

test('contactos: filtra por texto y por lista; un correo exacto se pide directo', async () => {
  const l = simular({ 'GET /contacts?limit=500': [200, { count: 2, contacts: [CONTACTO, { ...CONTACTO, id: 8, email: 'luis@correo.cl', attributes: { NOMBRE: 'Luis', MARCA: 'Axopar' } }] }], 'GET /contacts/ana%40correo.cl': [200, CONTACTO] });
  let r = await crm(ENV, 'crm/contactos', 'GET', U('crm/contactos?q=axopar&lista=4'), null, 'a@b.cl');
  assert.equal(r.contactos.length, 1); assert.equal(r.contactos[0].email, 'luis@correo.cl'); assert.ok(l[0].clave.includes('listIds=4'));
  r = await crm(ENV, 'crm/contactos', 'GET', U('crm/contactos?q=ana@correo.cl'), null, 'a@b.cl');
  assert.equal(r.contactos[0].nombre, 'Ana Soto');
});

test('validarAccion: solo etapas conocidas, listas enteras y correos válidos', () => {
  assert.ok(validarAccion({ email: 'a@b.cl', accion: 'etapa', valor: 'Cotizado' }).ok === undefined && !validarAccion({ email: 'a@b.cl', accion: 'etapa', valor: 'Cotizado' }).error);
  for (const mal of [null, { email: 'no', accion: 'etapa', valor: 'Nuevo' }, { email: 'a@b.cl', accion: 'etapa', valor: 'Inventada' },
    { email: 'a@b.cl', accion: 'lista-agregar', valor: '4; DROP' }, { email: 'a@b.cl', accion: 'borrar', valor: 1 }, { email: 'a@b.cl', accion: 'lista-quitar', valor: 0 }])
    assert.ok(validarAccion(mal).error, JSON.stringify(mal));
  assert.equal(validarAccion({ email: ' ANA@Correo.cl ', accion: 'lista-agregar', valor: '4' }).valor, 4);
  assert.ok(ETAPAS.includes('Cerrado'));
});

test('accion etapa: PUT solo con ETAPA; accion de lista solo si la lista existe', async () => {
  let l = simular({ 'PUT /contacts/ana%40correo.cl': [204, null] });
  let r = await crm(ENV, 'crm/accion', 'POST', U('crm/accion'), { email: 'ana@correo.cl', accion: 'etapa', valor: 'Cotizado' }, 'a@b.cl');
  assert.equal(r.ok, true); assert.deepEqual(l[0].cuerpo, { attributes: { ETAPA: 'Cotizado' } });
  l = simular({ 'GET /contacts/lists': [200, { lists: [{ id: 4, name: 'x' }] }], 'POST /contacts/lists/4/contacts/add': [201, {}] });
  r = await crm(ENV, 'crm/accion', 'POST', U('crm/accion'), { email: 'ana@correo.cl', accion: 'lista-agregar', valor: 4 }, 'a@b.cl');
  assert.equal(r.ok, true); assert.deepEqual(l[1].cuerpo, { emails: ['ana@correo.cl'] });
  l = simular({ 'GET /contacts/lists': [200, { lists: [{ id: 4, name: 'x' }] }] });
  r = await crm(ENV, 'crm/accion', 'POST', U('crm/accion'), { email: 'ana@correo.cl', accion: 'lista-agregar', valor: 99 }, 'a@b.cl');
  assert.equal(r.ok, false); assert.equal(l.length, 1);  // no escribió nada
});

test('error de Brevo: mensaje claro con pista, sin filtrar la respuesta cruda', async () => {
  simular({ 'GET /contacts/lists': [401, { message: 'Key not found' }], 'GET /contacts?limit=1': [200, { count: 0 }] });
  const r = await crm(ENV, 'crm/resumen', 'GET', U('crm/resumen'), null, 'a@b.cl');
  assert.equal(r.ok, false); assert.match(r.error, /no es válida o venció/); assert.equal(r._status, 502);
});
