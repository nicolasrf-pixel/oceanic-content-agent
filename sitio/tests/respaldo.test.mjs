// Respaldos en R2 (worker/respaldo.js) con D1, KV y R2 de mentira en memoria.
import test from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { exportarD1, copiarMedios, aBorrar, hacerRespaldo, estadoRespaldo, haceFalta } from '../worker/respaldo.js';

function d1(tablas) {
  return { prepare: (sql) => ({ all: async () => {
    if (/sqlite_master/.test(sql)) return { results: Object.keys(tablas).map((name) => ({ name })) };
    const m = /FROM "(\w+)" LIMIT (\d+) OFFSET (\d+)/.exec(sql);
    return { results: tablas[m[1]].slice(+m[3], +m[3] + +m[2]) };
  } }) };
}
function r2() {
  const o = new Map();
  return {
    _o: o,
    async put(k, v, op) { o.set(k, { k, v, size: typeof v === 'string' ? v.length : v.byteLength, op }); },
    async head(k) { const x = o.get(k); return x ? { size: x.size } : null; },
    async get(k) { const x = o.get(k); return x ? { text: async () => (typeof x.v === 'string' ? x.v : Buffer.from(x.v).toString()), body: x.v } : null; },
    async delete(ks) { for (const k of [].concat(ks)) o.delete(k); },
    async list({ prefix = '' } = {}) { const objects = [...o.values()].filter((x) => x.k.startsWith(prefix)).map((x) => ({ key: x.k, size: x.size, uploaded: new Date() })); return { objects, truncated: false }; },
  };
}
function kv(archivos) {
  return {
    async list() { return { keys: Object.keys(archivos).map((name) => ({ name })), list_complete: true }; },
    async getWithMetadata(k) { return { value: archivos[k].buffer.slice(archivos[k].byteOffset, archivos[k].byteOffset + archivos[k].byteLength), metadata: { tipo: 'image/webp' } }; },
  };
}
const filas = (n, base = 'x') => Array.from({ length: n }, (_, i) => ({ id: i, v: base + i }));

test('exporta todas las tablas de D1, también las de más de 500 filas', async () => {
  const r = await exportarD1(d1({ documentos: filas(3), leads: filas(1203, 'l') }));
  assert.equal(r.tablas.documentos.length, 3);
  assert.equal(r.tablas.leads.length, 1203);
  assert.equal(r.filas, 1206);
});

test('copia los archivos de KV a R2 y no repite los que ya están', async () => {
  const R = r2(); const K = kv({ 'a.webp': new Uint8Array([1, 2, 3]), 'b.mp4': new Uint8Array(10) });
  const a = await copiarMedios(K, R);
  assert.deepEqual([a.copiados, a.omitidos, a.bytes], [2, 0, 13]);
  assert.ok(R._o.has('kv/a.webp') && R._o.has('kv/b.mp4'));
  const b = await copiarMedios(K, R);
  assert.deepEqual([b.copiados, b.omitidos], [0, 2]);
});

test('limpieza: se conserva 30 días y la copia del día 1 de cada mes durante 12 meses', () => {
  const ahora = Date.parse('2026-11-23T06:00:00Z');
  const nombres = ['d1/2026-11-22.json.gz', 'd1/2026-10-25.json.gz', 'd1/2026-10-20.json.gz', 'd1/2026-10-01.json.gz', 'd1/2026-03-01.json.gz', 'd1/2025-12-01.json.gz', 'd1/2025-10-01.json.gz', 'ultimo.json', 'kv/a.webp'];
  assert.deepEqual(aBorrar(nombres, ahora).sort(), ['d1/2025-10-01.json.gz', 'd1/2026-10-20.json.gz']);
});

test('respaldo completo: archivo comprimido con los datos, resumen y estado', async () => {
  const R = r2();
  const env = { RESPALDOS: R, DB: d1({ documentos: filas(2), leads: filas(5) }), MEDIA: kv({ 'x.webp': new Uint8Array(4) }) };
  const r = await hacerRespaldo(env, 'prueba', Date.parse('2026-11-23T06:00:00Z'));
  assert.equal(r.ok, true);
  assert.equal(r.d1.archivo, 'd1/2026-11-23.json.gz');
  assert.equal(r.d1.filas, 7);
  assert.equal(r.medios.copiados, 1);
  const bajado = JSON.parse(gunzipSync(Buffer.from(R._o.get('d1/2026-11-23.json.gz').v)).toString());
  assert.equal(bajado.tablas.leads.length, 5);
  const e = await estadoRespaldo(env);
  assert.equal(e.configurado, true);
  assert.equal(e.ultimo.d1.filas, 7);
  assert.equal(e.estado.enCurso, false);
  assert.equal(e.copias.length, 1);
});

test('sin R2 configurado avisa con claridad y no rompe', async () => {
  const r = await hacerRespaldo({ DB: d1({}) }, 'x');
  assert.equal(r.ok, false);
  assert.match(r.error, /RESPALDOS/);
  assert.equal((await estadoRespaldo({})).configurado, false);
});

test('haceFalta: sin respaldo o con más de 24 horas sí; reciente o en curso no', async () => {
  const R = r2(); const env = { RESPALDOS: R, DB: d1({ documentos: [] }) };
  const t0 = Date.parse('2026-11-23T06:00:00Z');
  assert.equal(await haceFalta(env, t0), true);
  await hacerRespaldo(env, 'x', t0);
  assert.equal(await haceFalta(env, t0 + 3600000), false);
  assert.equal(await haceFalta(env, t0 + 25 * 3600000), true);
  assert.equal(await haceFalta({}, t0), false);
});

test('si falla D1 el estado queda como error y no como «en curso»', async () => {
  const R = r2();
  const malo = { prepare: () => ({ all: async () => { throw new Error('D1 caída'); } }) };
  const r = await hacerRespaldo({ RESPALDOS: R, DB: malo }, 'x');
  assert.equal(r.ok, false);
  const est = JSON.parse(R._o.get('estado.json').v);
  assert.equal(est.enCurso, false); assert.match(est.error, /D1 caída/);
});
