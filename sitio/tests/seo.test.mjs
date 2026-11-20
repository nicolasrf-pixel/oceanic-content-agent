// SEO de las páginas con datos (worker/compartir.js + worker/seo.js). Usa los archivos reales del sitio; sin red.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { metadatos, usarCargador } from '../worker/compartir.js';
import { precioUsado, scriptLD, seoEvento } from '../worker/seo.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
let reemplazos = {};  // archivo → texto, para simular marcas sin autorizar, modelos apagados, etc.
const leer = (a) => reemplazos[a] ?? readFileSync(RAIZ + 'assets/js/' + a, 'utf8');
const preparar = (r = {}) => { reemplazos = r; usarCargador(async (req) => new Response(leer(new URL(req.url).pathname.split('/').pop()), { status: 200 })); };
const ORIGEN = 'https://oceanic.example';
const meta = (ruta) => metadatos({}, new URL(ORIGEN + ruta));
const jsonObj = (nombre) => { const t = leer(nombre); return JSON.parse(t.slice(t.indexOf('=', t.lastIndexOf('window.')) + 1, t.lastIndexOf(';'))); };

test('modelo: título principal, texto, ficha técnica y datos estructurados sin precio', async () => {
  preparar();
  const m = await meta('/marca/?m=beneteau&modelo=oceanis-34-1');
  assert.match(m.base, /<h1>Beneteau Oceanis 34\.1<\/h1>/);
  assert.match(m.base, /Ficha técnica/);
  assert.match(m.base, /href="https:\/\/oceanic\.example\/marca\/\?m=beneteau&amp;modelo=/);  // enlaces internos a otros modelos
  const tipos = m.jsonld.map((x) => x['@type']);
  assert.deepEqual(tipos, ['Product', 'BreadcrumbList']);
  assert.equal(m.jsonld[0].brand.name, 'Beneteau');
  assert.equal(JSON.stringify(m.jsonld).includes('"offers"'), false);          // ningún barco nuevo publica precio
  assert.equal(/opcional|optional/i.test(m.base), false);
});

test('marca: lista sus modelos con enlaces y respeta la línea vela/motor', async () => {
  preparar();
  const todos = await meta('/marca/?m=beneteau');
  const vela = await meta('/marca/?m=beneteau&u=vela');
  const motor = await meta('/marca/?m=beneteau&u=motor');
  const n = (m) => (m.base.match(/<li>/g) || []).length;
  assert.ok(n(vela) > 0 && n(motor) > 0 && n(todos) >= n(vela) + n(motor) - 1);
  assert.equal(todos.jsonld[0]['@type'], 'ItemList');
});

test('lo que no está autorizado no existe: ni título, ni texto, ni datos estructurados', async () => {
  const pf = jsonObj('portafolio-data.js');
  pf.inicio.find((x) => x.marca === 'axopar').visible = false;
  preparar({ 'portafolio-data.js': 'window.OCEANIC_PORTAFOLIO=' + JSON.stringify(pf) + ';' });
  assert.equal(await meta('/marca/?m=axopar'), null);
  assert.equal(await meta('/marca/?m=axopar&modelo=axopar-37-xc-cross-cabin'), null);
  const u = await meta('/universo/?u=motor');
  assert.equal(u.base.includes('Axopar'), false);
  assert.equal(JSON.stringify(u.jsonld).includes('Axopar'), false);
});

test('modelo apagado en publicación no se entrega', async () => {
  preparar({ 'publicacion.js': 'window.OCEANIC_PUBLICACION={"destacados":[],"ocultos":{"beneteau/oceanis-34-1":"prueba"}}/*FIN*/;' });
  assert.equal(await meta('/marca/?m=beneteau&modelo=oceanis-34-1'), null);
  const marca = await meta('/marca/?m=beneteau');
  assert.equal(marca.base.includes('Oceanis 34.1'), false);
});

test('categoría: título propio, canónica con su parámetro y categoría oculta no existe', async () => {
  preparar();
  const v = await meta('/universo/?u=vela'), mo = await meta('/universo/?u=motor');
  assert.notEqual(v.titulo, mo.titulo);
  assert.match(v.titulo, /^Vela · Marcas náuticas en Chile/);
  assert.equal(await meta('/universo/?u=no-existe'), null);
  const pf = jsonObj('portafolio-data.js'); pf.universos.find((x) => x.slug === 'vela').visible = false;
  preparar({ 'portafolio-data.js': 'window.OCEANIC_PORTAFOLIO=' + JSON.stringify(pf) + ';' });
  assert.equal(await meta('/universo/?u=vela'), null);
});

test('usados: precio solo si se entiende, y vendido se marca agotado', () => {
  assert.deepEqual(precioUsado('$160.000.000'), { price: 160000000, currency: 'CLP' });
  assert.deepEqual(precioUsado('195.000 USD'), { price: 195000, currency: 'USD' });
  assert.deepEqual(precioUsado('€315.000'), { price: 315000, currency: 'EUR' });
  assert.equal(precioUsado('Consultar'), null);
  assert.equal(precioUsado('12'), null);
});

test('usados reales: datos estructurados con oferta y migas', async () => {
  preparar();
  const lista = jsonObj('usados-data.js').filter((x) => !x.oculto);
  const u = lista.find((x) => precioUsado(x.precio));
  const m = await meta('/usados/barco/?id=' + u.id);
  assert.equal(m.jsonld[0]['@type'], 'Product');
  assert.ok(m.jsonld[0].offers.price > 0);
  assert.equal(m.jsonld[1]['@type'], 'BreadcrumbList');
});

test('edición de Puerto: título, resumen y datos de artículo; la oculta no sale', async () => {
  preparar();
  const ed = jsonObj('puerto-data.js').find((x) => !x.oculto);
  const m = await meta('/puerto/edicion/?ed=' + ed.slug);
  assert.match(m.titulo, /^Puerto · /);
  assert.equal(m.jsonld[0]['@type'], 'Article');
  assert.equal(m.jsonld[0].datePublished, ed.fecha);
  const lista = jsonObj('puerto-data.js'); lista[0].oculto = true;
  preparar({ 'puerto-data.js': 'window.OCEANIC_PUERTO=' + JSON.stringify(lista) + ';' });
  assert.equal(await meta('/puerto/edicion/?ed=' + lista[0].slug), null);
});

test('el JSON-LD no se puede romper con texto malicioso', () => {
  const s = scriptLD({ name: '</script><script>alert(1)</script>' });
  assert.equal(s.includes('</script><script>'), false);
  assert.equal((s.match(/<\/script>/g) || []).length, 1);
});

test('evento sin fecha no inventa un evento', () => {
  assert.deepEqual(seoEvento({ o: ORIGEN, dir: ORIGEN + '/evento/?e=x', l: { titulo: 'Invitación' }, imagen: '' }).jsonld, []);
});
