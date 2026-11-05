/* OCEANIC · Vista previa al compartir de las fichas de barcos y de los usados.
   Esas páginas se arman con datos en el navegador, pero WhatsApp, LinkedIn o Facebook leen solo el HTML: aquí se
   reemplazan título, descripción, imagen y URL por los del barco antes de entregar la página.
   /marca/?m=<marca>&modelo=<slug>   → nombre y foto del modelo (catálogo)
   /marca/?m=<marca>[&u=vela|motor]  → nombre de la marca y su portada
   /usados/barco/?id=<id>            → nombre, año, precio y foto del aviso
   Si algo no se encuentra, la página sale con los metadatos generales del sitio. */

// Memoria de 5 minutos por archivo (lo publicado desde el administrador aparece a más tardar en ese plazo).
const memo = new Map();
let cargar = null;  // lo entrega index.js: lee el archivo con lo publicado en el CMS superpuesto
async function datosJS(env, origen, archivo, variable, abre) {
  const m = memo.get(archivo);
  if (m && Date.now() - m.t < 300000) return m.d;
  const req = new Request(origen + '/assets/js/' + archivo);
  const r = cargar ? await cargar(req) : await env.ASSETS.fetch(req);
  if (!r.ok) return null;
  const t = await r.text();
  const i = t.indexOf(abre, t.lastIndexOf('window.' + variable + '='));
  const cierra = abre === '[' ? ']' : '}';
  const d = JSON.parse(t.slice(i, t.lastIndexOf(cierra) + 1));
  memo.set(archivo, { d, t: Date.now() });
  return d;
}

const abs = (origen, p, base) => !p ? '' : /^https?:\/\//.test(p) ? p
  : origen + (p.startsWith('/') ? p : base + p.replace(/^(\.\.\/)*assets\/img\//, '').replace(/^usados\//, ''));

function nombreBarco(marca, modelo) {
  return modelo.toLowerCase().startsWith(marca.toLowerCase()) ? modelo : marca + ' ' + modelo;
}

async function metadatos(env, url) {
  const o = url.origin, q = url.searchParams;
  if (url.pathname.startsWith('/marca')) {
    const cat = await datosJS(env, o, 'catalogo-data.js', 'OCEANIC_CATALOGO', '{');
    const m = cat && cat[q.get('m')];
    if (!m) return null;
    const slug = q.get('modelo');
    if (slug) {
      const mo = m.modelos.find((x) => x.slug === slug);
      if (!mo) return null;
      const nombre = nombreBarco(m.nombre, mo.nombre);
      const datos = [mo.eslora && 'Eslora ' + mo.eslora, mo.camarotes && !/opcional/i.test(mo.camarotes) && mo.camarotes + ' camarotes']
        .filter(Boolean).join(' · ');
      return {
        titulo: nombre + ' en Chile | Oceanic',
        desc: (datos ? datos + '. ' : '') + 'Representación oficial de ' + m.nombre + ' en Chile: ficha técnica, galería y cotización con Oceanic.',
        imagen: abs(o, mo.tarjeta || mo.hero, '/assets/img/'),
      };
    }
    const info = await datosJS(env, o, 'marcas-info.js', 'OCEANIC_MARCAS', '{');
    let mi = info && info[q.get('m')];
    if (!mi) return null;
    if (mi.lineas && mi.lineas[q.get('u')]) mi = { ...mi, ...mi.lineas[q.get('u')] };
    const img = /\./.test(mi.hero || '') ? mi.hero : (mi.hero || '') + '.webp';
    return {
      titulo: mi.nombre + ' en Chile | Oceanic',
      desc: (mi.claim ? mi.claim + ' ' : '') + 'Representación oficial de ' + m.nombre + ' en Chile: gama completa y cotización con Oceanic.',
      imagen: abs(o, img, '/assets/img/'),
    };
  }
  if (url.pathname.startsWith('/usados/barco')) {
    const lista = await datosJS(env, o, 'usados-data.js', 'OCEANIC_USADOS', '[');
    const u = lista && lista.find((x) => x.id === q.get('id'));
    if (!u) return null;
    const f = u.portada || (u.fotos && u.fotos[0]);
    const foto = !f ? '' : typeof f === 'object' ? (f.local ? o + '/assets/img/usados/' + f.local : f.url) : abs(o, f, '/assets/img/usados/');
    return {
      titulo: u.nombre + (u.anio ? ' (' + u.anio + ')' : '') + ' · Usado | Oceanic',
      desc: (u.estado === 'vendido' ? 'Vendido. ' : (u.precio ? u.precio + '. ' : '')) + (u.resumen || 'Embarcación usada revisada por Oceanic.'),
      imagen: foto,
    };
  }
  return null;
}

class Atributo {
  constructor(attr, valor) { this.attr = attr; this.valor = valor; }
  element(el) { if (this.valor) el.setAttribute(this.attr, this.valor); }
}
class Texto {
  constructor(valor) { this.valor = valor; }
  element(el) { if (this.valor) el.setInnerContent(this.valor); }
}

export async function paginaCompartible(request, env, cargador) {
  cargar = cargador || null;
  const res = await env.ASSETS.fetch(request);
  const tipo = res.headers.get('content-type') || '';
  if (!res.ok || !tipo.includes('text/html')) return res;
  const url = new URL(request.url);
  let m = null;
  try { m = await metadatos(env, url); } catch (e) { console.log('compartir: sin metadatos', e && e.message); }
  if (!m) return res;
  const dir = url.toString();
  return new HTMLRewriter()
    .on('title', new Texto(m.titulo))
    .on('meta[name="description"]', new Atributo('content', m.desc))
    .on('meta[property="og:title"]', new Atributo('content', m.titulo))
    .on('meta[name="twitter:title"]', new Atributo('content', m.titulo))
    .on('meta[property="og:description"]', new Atributo('content', m.desc))
    .on('meta[name="twitter:description"]', new Atributo('content', m.desc))
    .on('meta[property="og:image"]', new Atributo('content', m.imagen))
    .on('meta[name="twitter:image"]', new Atributo('content', m.imagen))
    .on('meta[property="og:image:alt"]', new Atributo('content', m.titulo))
    .on('meta[property="og:image:width"]', { element: (el) => { if (m.imagen) el.remove(); } })
    .on('meta[property="og:image:height"]', { element: (el) => { if (m.imagen) el.remove(); } })
    .on('meta[property="og:url"]', new Atributo('content', dir))
    .on('link[rel="canonical"]', new Atributo('href', dir))
    .transform(res);
}
