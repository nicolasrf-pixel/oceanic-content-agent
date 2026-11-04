// Pruebas del CMS (Worker): validación, patrones prohibidos, formato de archivos y verificación de Access.
// Correr desde sitio/:  node --test tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validar, normalizarPatrones, enlaceSeguro, leerGlobal, DOCS, claveDeRuta, renderArchivo, definicion } from '../worker/documentos.js';
import { verificar } from '../worker/acceso.js';

const archivo = (p) => readFileSync(new URL('..' + p, import.meta.url), 'utf8');

test('todos los archivos de datos del repo se leen como JSON estricto y pasan la validación', () => {
  for (const [clave, def] of Object.entries(DOCS)) {
    if (def.soloCms) continue;
    const d = def.leer(archivo(def.archivo));
    const v = validar(clave, d);
    assert.deepEqual(v.errores, [], clave + ': ' + JSON.stringify(v.errores.slice(0, 3)));
  }
});

test('las 135 fichas pasan la validación (sin precios)', () => {
  const idx = JSON.parse(archivo('/assets/data/fichas/index.json'));
  for (const k of idx) {
    const v = validar('ficha:' + k, JSON.parse(archivo(`/assets/data/fichas/${k}.json`)));
    assert.deepEqual(v.errores, [], k);
  }
});

test('rutas que el CMS puede reemplazar', () => {
  assert.equal(claveDeRuta('/assets/js/usados-data.js'), 'usados');
  assert.equal(claveDeRuta('/assets/data/fichas/axopar/axopar-37-xc-cross-cabin.json'), 'ficha:axopar/axopar-37-xc-cross-cabin');
  assert.equal(claveDeRuta('/assets/js/oceanic.js'), null);
  assert.equal(claveDeRuta('/assets/data/fichas/../x.json'), null);
  assert.equal(definicion('ficha:../x'), null);
});

test('render publicado: formato uniforme y empalme de publicacion.js', () => {
  const t = renderArchivo(DOCS.usados, '[{"id":"a"}]', null, 'v1');
  assert.deepEqual(leerGlobal(t, 'OCEANIC_USADOS'), [{ id: 'a' }]);
  const base = archivo('/assets/js/publicacion.js');
  const out = renderArchivo(DOCS.publicacion, '{"destacados":["a/b","c/d","e/f"],"ocultos":{}}', base, 'v1');
  assert.deepEqual(DOCS.publicacion.leer(out).destacados, ['a/b', 'c/d', 'e/f']);
  assert.ok(out.includes('OCEANIC_SIN_OPCIONALES'));
});

test('enlaces seguros', () => {
  for (const ok of ['', '../marca/index.html?m=beneteau', '/puerto/', '#cotizar', 'https://oceanic.cl/x.pdf']) assert.ok(enlaceSeguro(ok), ok);
  for (const no of ['javascript:alert(1)', ' JavaScript:x', 'data:text/html,x', '//evil.com', 'vbscript:x', 'java\nscript:x']) assert.ok(!enlaceSeguro(no), no);
});

test('usados y puerto: errores del contrato', () => {
  const u = validar('usados', [{ id: 'A B', nombre: '', tipo: 'bote', estado: 'x', fecha: '9-10', fotos: ['javascript:x'], docs: ['javascript:x'] }]);
  assert.ok(u.errores.length >= 7);
  const p = validar('puerto', [{ slug: 'oct', mes: '', fecha: '', bloques: [{ type: 'noticia', titular: 't', cuerpo: [], galeria: Array(10).fill('a.webp'), cta: { texto: 'x', href: 'javascript:x' } }, { type: 'otro' }] }]);
  for (const r of ['[0].slug', '[0].mes', '[0].fecha', '[0].bloques[0].galeria', '[0].bloques[0].cta', '[0].bloques[1].type']) assert.ok(p.errores.some((e) => e.ruta === r), r);
});

test('publicación: 3 destacados y ninguno apagado', () => {
  assert.equal(validar('publicacion', { destacados: ['a/b'], ocultos: {} }).errores.length, 1);
  assert.equal(validar('publicacion', { destacados: ['a/b', 'c/d', 'e/f'], ocultos: { 'a/b': 'x' } }).errores.length, 1);
});

test('patrones prohibidos: texto con límites de palabra y regex', () => {
  const P = [{ patron: 'líder', motivo: 'superlativo' }, { patron: '\\bbarat[oa]s?\\b', regex: true }, 'sin igual'];
  assert.equal(normalizarPatrones(P).length, 3);
  assert.equal(validar('charter', { a: 'El líder del mercado' }, P).errores.length, 1);
  assert.equal(validar('charter', { a: 'Liderazgo' }, P).errores.length, 0);
  assert.equal(validar('charter', { a: ['Muy BARATO'] }, P).errores.length, 1);
  assert.equal(validar('charter', { a: 'un barco sin igual.' }, P).errores.length, 1);
  assert.equal(normalizarPatrones([{ patron: '(', regex: true }]).length, 0);
});

test('Access: firma RS256, audiencia, emisor y vencimiento', async () => {
  const par = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await crypto.subtle.exportKey('jwk', par.publicKey)), kid: 'k1' };
  const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const equipo = 'oceanic.cloudflareaccess.com', ahora = 1_800_000_000;
  async function firmar(datos, kid = 'k1') {
    const t = b64({ alg: 'RS256', kid }) + '.' + b64(datos);
    return t + '.' + Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', par.privateKey, new TextEncoder().encode(t))).toString('base64url');
  }
  const obtener = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
  const base = { aud: ['AUD1'], iss: 'https://' + equipo, exp: ahora + 60, email: 'nico@oceanic.cl' };
  assert.equal((await verificar(await firmar(base), equipo, 'AUD1', ahora, obtener)).email, 'nico@oceanic.cl');
  assert.equal(await verificar(await firmar({ ...base, aud: ['OTRA'] }), equipo, 'AUD1', ahora, obtener), null);
  assert.equal(await verificar(await firmar({ ...base, exp: ahora - 1 }), equipo, 'AUD1', ahora, obtener), null);
  assert.equal(await verificar(await firmar({ ...base, iss: 'https://otro.cloudflareaccess.com' }), equipo, 'AUD1', ahora, obtener), null);
  const t = await firmar(base);
  const [a, , c] = t.split('.');
  assert.equal(await verificar(a + '.' + b64({ ...base, email: 'intruso@x.com' }) + '.' + c, equipo, 'AUD1', ahora, obtener), null);
});

test('Access activado en el Worker: identidad desde ctx.access, con lista blanca opcional', async () => {
  const { usuarioAdmin } = await import('../worker/acceso.js');
  const req = new Request('https://oceanic.ejemplo.workers.dev/admin/');
  const ctx = (email) => ({ access: { aud: 'x', getIdentity: async () => (email ? { email } : null) } });
  assert.equal(await usuarioAdmin(req, {}, ctx('Nico@Oceanic.cl')), 'nico@oceanic.cl');
  assert.equal(await usuarioAdmin(req, {}, ctx(null)), null);
  assert.equal(await usuarioAdmin(req, {}, {}), null);
  assert.equal(await usuarioAdmin(req, { ADMIN_EMAILS: 'otra@oceanic.cl' }, ctx('nico@oceanic.cl')), null);
  assert.equal(await usuarioAdmin(req, { ADMIN_LOCAL: 'dev@x' }, {}), null);  // ADMIN_LOCAL solo en localhost
});

test('contraseña: sin secreto o sin cookie válida no hay sesión', async () => {
  const { usuarioPorSesion, claveConfigurada } = await import('../worker/clave.js');
  const kv = new Map([['sesion:' + 'a'.repeat(64), 'Nico']]);
  const MEDIA = { get: async (k) => kv.get(k) ?? null };
  const req = (c) => new Request('https://x.workers.dev/admin/', { headers: c ? { Cookie: c } : {} });
  assert.equal(claveConfigurada({ MEDIA }), false);
  assert.equal(await usuarioPorSesion(req('oceanic_admin=' + 'a'.repeat(64)), { MEDIA }), null);       // sin ADMIN_PASSWORD
  const env = { MEDIA, ADMIN_PASSWORD: 'x' };
  assert.equal(await usuarioPorSesion(req('oceanic_admin=' + 'a'.repeat(64)), env), 'Nico');
  assert.equal(await usuarioPorSesion(req('oceanic_admin=' + 'b'.repeat(64)), env), null);
  assert.equal(await usuarioPorSesion(req('oceanic_admin=corto'), env), null);
  assert.equal(await usuarioPorSesion(req(null), env), null);
});
