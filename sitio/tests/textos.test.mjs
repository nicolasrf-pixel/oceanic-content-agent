// Textos del sitio: validación del documento `textos` y aplicación en el navegador (assets/js/textos.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { validar, DOCS, claveDeRuta } from '../worker/documentos.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const msg = (d) => validar('textos', d).errores.map((e) => e.msg).join(' | ');

test('el documento «textos» existe, se sirve desde su archivo y el del repo es válido', () => {
  assert.equal(claveDeRuta('/assets/js/textos-data.js'), 'textos');
  const d = DOCS.textos.leer(readFileSync(RAIZ + 'assets/js/textos-data.js', 'utf8'));
  assert.deepEqual(validar('textos', d).errores, []);
});

test('acepta textos con marcas simples y enlaces seguros', () => {
  const d = { 'inicio.014': 'Hola <b>mundo</b><br>con <a href="/contacto/">enlace</a> y <a href="https://oceanic.cl">más</a>', 'nosotros.003': 'Más de 30 años', 'inicio.titulo': 'Oceanic · marcas náuticas', 'inicio.desc': 'Descripción simple' };
  assert.equal(msg(d), '');
});

test('rechaza etiquetas no permitidas, scripts, eventos y enlaces peligrosos', () => {
  assert.match(msg({ 'inicio.001': '<script>alert(1)</script>' }), /No se permite <script>/);
  assert.match(msg({ 'inicio.001': '<img src=x onerror=alert(1)>' }), /No se permite <img>/);
  assert.match(msg({ 'inicio.001': '<b onclick="x()">hola</b>' }), /no admite atributos/);
  assert.match(msg({ 'inicio.001': '<a href="javascript:alert(1)">x</a>' }), /Enlace inválido/);
  assert.match(msg({ 'inicio.001': '<a href="//malo.example">x</a>' }), /Enlace inválido/);
  assert.match(msg({ 'inicio.001': '<a>sin enlace</a>' }), /Enlace inválido/);
  assert.match(msg({ 'inicio.001': 'a < b' }), /símbolo </);
});

test('identificadores y tipos inválidos, y título sin formato', () => {
  assert.match(msg({ 'inicio': 'x' }), /Identificador inválido/);
  assert.match(msg({ 'Inicio.001': 'x' }), /Identificador inválido/);
  assert.match(msg({ 'inicio.001': 5 }), /debe ser un texto/);
  assert.match(msg({ 'inicio.titulo': 'Con <b>formato</b>' }), /sin formato/);
  assert.match(msg([]), /un objeto/);
});

test('avisa (sin impedir) si el texto parece un precio fuera de usados', () => {
  const r = validar('textos', { 'inicio.020': 'Desde USD 120.000', 'usados.003': 'Desde USD 120.000' });
  assert.equal(r.errores.length, 0);
  assert.equal(r.avisos.length, 1);
  assert.equal(r.avisos[0].ruta, 'inicio.020');
});

// ----- cada página: etiquetas únicas, scripts de textos y nada que el servidor no pueda cambiar -----
function paginas(dir = RAIZ, acc = []) {
  for (const n of readdirSync(dir)) {
    if (['node_modules', 'admin', 'marcas', 'worker', 'tests', 'scripts', 'functions', 'assets'].includes(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) paginas(p, acc); else if (n.endsWith('.html')) acc.push(p);
  }
  return acc;
}

test('las páginas llevan ids data-t únicos y cargan textos-data.js y textos.js (antes de los demás scripts)', () => {
  const base = JSON.parse(readFileSync(RAIZ + 'assets/data/textos-base.json', 'utf8'));
  const esperados = new Set(base.paginas.flatMap((p) => p.items.filter((i) => !/\.(titulo|desc)$/.test(i.id)).map((i) => i.id)));
  const vistos = new Set();
  for (const f of paginas()) {
    const t = readFileSync(f, 'utf8');
    const ids = [...t.matchAll(/data-t="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'ids repetidos en ' + f);
    ids.forEach((i) => vistos.add(i));
    if (ids.length) {
      assert.match(t, /assets\/js\/textos-data\.js/, 'falta textos-data.js en ' + f);
      assert.ok(t.indexOf('textos-data.js') < t.indexOf('textos.js'), 'textos-data.js debe ir antes en ' + f);
    }
  }
  for (const id of esperados) assert.ok(vistos.has(id), 'el id ' + id + ' de la lista no está en ninguna página');
});

// ----- aplicación en el navegador: revisión del código (la prueba con navegador real está en tools/ y se corre a mano) -----
test('textos.js: solo deja pasar marcas simples y enlaces seguros, y nunca inyecta HTML crudo en la página', () => {
  const codigo = readFileSync(RAIZ + 'assets/js/textos.js', 'utf8');
  assert.match(codigo, /PERMITIDAS = \{ B: 1, STRONG: 1, I: 1, EM: 1, BR: 1, A: 1/);
  assert.match(codigo, /seguro\(href\)/);
  assert.match(codigo, /noopener/);
  // el único innerHTML es sobre un <template> (inerte); el contenido final se arma nodo por nodo con createElement/createTextNode
  const usos = [...codigo.matchAll(/(\w+)\.innerHTML\s*=/g)].map((m) => m[1]);
  assert.deepEqual(usos, ['origen']);
  assert.match(codigo, /document\.createElement\('template'\)/);
});
