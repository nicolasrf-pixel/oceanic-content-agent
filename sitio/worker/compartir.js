/* OCEANIC · Vista previa al compartir de las fichas de barcos y de los usados.
   Esas páginas se arman con datos en el navegador, pero WhatsApp, LinkedIn o Facebook leen solo el HTML: aquí se
   reemplazan título, descripción, imagen y URL por los del barco antes de entregar la página.
   /marca/?m=<marca>&modelo=<slug>   → nombre y foto del modelo (catálogo)
   /marca/?m=<marca>[&u=vela|motor]  → nombre de la marca y su portada
   /usados/barco/?id=<id>            → nombre, año, precio y foto del aviso
   /evento/?e=<slug>                 → título, fecha y foto de la invitación
   Si algo no se encuentra, la página sale con los metadatos generales del sitio. */

import { seoModelo, seoMarca, seoUniverso, seoUsado, seoEvento, seoEdicion, recortar, scriptLD } from './seo.js';

// Memoria de 5 minutos por archivo (lo publicado desde el administrador aparece a más tardar en ese plazo).
const memo = new Map();
export function usarCargador(fn) { cargar = fn; memo.clear(); }  // para las pruebas
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

// Marcas sin autorizar (portafolio › inicio › visible:false) y modelos apagados (publicación › ocultos): no existen para nadie,
// tampoco para los buscadores ni para la vista previa al compartir.
async function visibilidad(env, o) {
  const [pf, pub] = await Promise.all([
    datosJS(env, o, 'portafolio-data.js', 'OCEANIC_PORTAFOLIO', '{').catch(() => null),
    datosJS(env, o, 'publicacion.js', 'OCEANIC_PUBLICACION', '{').catch(() => null),
  ]);
  return {
    pf,
    marcaOculta: (slug) => !!(pf && (pf.inicio || []).some((x) => x && x.marca === slug && x.visible === false)),
    modeloOculto: (marca, slug) => !!(pub && pub.ocultos && Object.prototype.hasOwnProperty.call(pub.ocultos, marca + '/' + slug)),
  };
}
const familiaDe = (t) => { t = (t || '').toLowerCase(); return t.indexOf('electric') >= 0 || t.indexOf('eléctric') >= 0 ? 'electrico' : t.indexOf('vela') >= 0 ? 'vela' : 'motor'; };

export async function metadatos(env, url) {
  const o = url.origin, q = url.searchParams, dir = url.toString();
  if (url.pathname.startsWith('/marca')) {
    const cat = await datosJS(env, o, 'catalogo-data.js', 'OCEANIC_CATALOGO', '{');
    const slugMarca = q.get('m'), m = cat && cat[slugMarca];
    if (!m) return null;
    const vis = await visibilidad(env, o);
    if (vis.marcaOculta(slugMarca)) return null;
    const visibles = m.modelos.filter((x) => !vis.modeloOculto(slugMarca, x.slug));
    const slug = q.get('modelo');
    if (slug) {
      const mo = visibles.find((x) => x.slug === slug);
      if (!mo) return null;
      const nombre = nombreBarco(m.nombre, mo.nombre);
      const datos = [mo.eslora && 'Eslora ' + mo.eslora, mo.camarotes && !/opcional/i.test(mo.camarotes) && mo.camarotes + ' camarotes']
        .filter(Boolean).join(' · ');
      const imagen = abs(o, mo.tarjeta || mo.hero, '/assets/img/');
      const otros = visibles.filter((x) => x.slug !== slug).slice(0, 12)
        .map((x) => ({ nombre: nombreBarco(m.nombre, x.nombre), url: o + '/marca/?m=' + slugMarca + '&modelo=' + x.slug }));
      return {
        titulo: nombre + ' en Chile | Oceanic',
        desc: (datos ? datos + '. ' : '') + 'Representación oficial de ' + m.nombre + ' en Chile: ficha técnica, galería y cotización con Oceanic.',
        imagen,
        ...seoModelo({ o, dir, marca: { slug: slugMarca, nombre: m.nombre }, mo, nombre, otros, imagenes: [abs(o, mo.hero, '/assets/img/'), imagen] }),
      };
    }
    const info = await datosJS(env, o, 'marcas-info.js', 'OCEANIC_MARCAS', '{');
    let mi = info && info[slugMarca];
    if (!mi) return null;
    const linea = q.get('u');
    let lista = visibles;
    if (mi.lineas && mi.lineas[linea]) { mi = { ...mi, ...mi.lineas[linea] }; lista = visibles.filter((x) => familiaDe(x.tipo) === linea); }
    const img = /\./.test(mi.hero || '') ? mi.hero : (mi.hero || '') + '.webp';
    return {
      titulo: mi.nombre + ' en Chile | Oceanic',
      desc: (mi.claim ? mi.claim + ' ' : '') + 'Representación oficial de ' + m.nombre + ' en Chile: gama completa y cotización con Oceanic.',
      imagen: abs(o, img, '/assets/img/'),
      ...seoMarca({ o, dir, nombre: mi.nombre, texto: mi.intro || mi.claim || '', linea: mi.lineas ? linea : '',
        modelos: lista.map((x) => ({ nombre: nombreBarco(m.nombre, x.nombre), url: o + '/marca/?m=' + slugMarca + '&modelo=' + x.slug + (linea && mi.nombre ? '' : '') })) }),
    };
  }
  if (url.pathname.startsWith('/universo')) {
    const vis = await visibilidad(env, o);
    const u = vis.pf && (vis.pf.universos || []).find((x) => x && x.slug === q.get('u') && x.visible !== false && x.nombre);
    if (!u) return null;
    const info = await datosJS(env, o, 'marcas-info.js', 'OCEANIC_MARCAS', '{');
    const marcas = (u.marcas || []).filter((x) => x && info && info[x.marca] && !vis.marcaOculta(x.marca))
      .map((x) => ({ nombre: x.etiqueta || info[x.marca].nombre, url: o + '/marca/?m=' + x.marca + (x.linea ? '&u=' + x.linea : '') }));
    const hero = u.hero ? abs(o, u.hero, '/assets/img/') : '';
    return {
      titulo: u.nombre + ' · Marcas náuticas en Chile | Oceanic',
      desc: recortar(u.lede || u.kicker || ('Marcas de ' + u.nombre.toLowerCase() + ' que Oceanic representa oficialmente en Chile.'), 158),
      imagen: hero,
      ...seoUniverso({ o, dir, nombre: u.nombre, texto: u.lede || '', marcas }),
    };
  }
  if (url.pathname.startsWith('/puerto/edicion')) {
    const lista = await datosJS(env, o, 'puerto-data.js', 'OCEANIC_PUERTO', '[');
    const ed = lista && lista.find((x) => x && x.slug === q.get('ed') && !x.oculto);
    if (!ed) return null;
    const imagen = abs(o, ed.tapa || ed.portada, '/assets/img/');
    return {
      titulo: 'Puerto · ' + ed.mes + ' | Newsletter de Oceanic',
      desc: recortar(ed.resumen || 'Edición de Puerto, el newsletter de Oceanic: entregas, novedades de las marcas y navegación.', 158),
      imagen,
      ...seoEdicion({ o, dir, ed, imagen }),
    };
  }
  if (url.pathname.startsWith('/usados/barco')) {
    const lista = await datosJS(env, o, 'usados-data.js', 'OCEANIC_USADOS', '[');
    const u = lista && lista.find((x) => x.id === q.get('id') && !x.oculto);
    if (!u) return null;
    const f = u.portada || (u.fotos && u.fotos[0]);
    const foto = !f ? '' : typeof f === 'object' ? (f.local ? o + '/assets/img/usados/' + f.local : f.url) : abs(o, f, '/assets/img/usados/');
    const nombre = u.nombre + (u.anio ? ' (' + u.anio + ')' : '');
    return {
      titulo: nombre + ' · Usado | Oceanic',
      desc: (u.estado === 'vendido' ? 'Vendido. ' : (u.precio ? u.precio + '. ' : '')) + (u.resumen || 'Embarcación usada revisada por Oceanic.'),
      imagen: foto,
      ...seoUsado({ o, dir, u, nombre: u.nombre, imagen: foto }),
    };
  }
  if (url.pathname.startsWith('/evento')) {
    const ev = await datosJS(env, o, 'eventos-data.js', 'OCEANIC_EVENTOS', '{');
    const l = ev && (ev.landings || []).find((x) => x.slug === q.get('e') && x.visible);
    if (!l) return null;
    const cuando = /^\d{4}-\d{2}-\d{2}$/.test(l.fecha || '') ? l.fecha.split('-').reverse().join('-') : '';
    const imagen = abs(o, l.imagen, '/assets/img/');
    return {
      titulo: l.titulo + ' | Oceanic',
      desc: [cuando, l.hora, l.lugar].filter(Boolean).join(' · ') + (l.bajada ? (cuando || l.lugar ? '. ' : '') + l.bajada : ''),
      imagen,
      ...seoEvento({ o, dir, l, imagen }),
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
    .on('head', { element: (el) => { for (const d of m.jsonld || []) el.append(scriptLD(d), { html: true }); } })
    .on('main', { element: (el) => { if (m.base) el.setInnerContent(m.base, { html: true }); } })
    .transform(res);
}
