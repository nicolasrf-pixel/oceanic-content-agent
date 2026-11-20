/* OCEANIC · SEO de las páginas que se arman con datos (fichas, marcas, categorías, usados, eventos, ediciones de Puerto).
   Esas páginas se pintan en el navegador, pero buscadores, redes y asistentes leen primero el HTML que entrega el servidor.
   Aquí se arma lo que el servidor agrega a ese HTML (worker/compartir.js lo inserta):
     - un bloque de texto base (título principal, resumen, ficha, enlaces) que el navegador reemplaza apenas carga la página;
     - datos estructurados JSON-LD (Product, BreadcrumbList, ItemList, Event, Article, Organization).
   Reglas: solo se usa lo que ya está publicado en el sitio; las marcas y categorías sin autorizar y los modelos apagados no existen
   aquí; los barcos nuevos nunca llevan precio (solo los usados). Funciones puras: sin red ni estado, para poder probarlas. */

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const scriptLD = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';

// Texto base solo para quien lee el HTML: fuera de la vista (técnica de accesibilidad), y el navegador lo reemplaza al cargar.
const FUERA = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap';
export const bloqueBase = (html) => '<div data-seo-base style="' + FUERA + '">' + html + '</div>';

const recortar = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
export { recortar };

export function migas(items) {  // items: [{ nombre, url }]
  return { '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.nombre, item: x.url })) };
}
export const enlaces = (lista) => '<ul>' + lista.map((x) => '<li><a href="' + esc(x.url) + '">' + esc(x.nombre) + '</a></li>').join('') + '</ul>';

/* ---------- barcos nuevos ---------- */
export function seoModelo({ o, dir, marca, mo, nombre, imagenes, otros }) {
  const specs = (mo.specs || []).filter((s) => s && s.label && s.value && !/opcional|optional/i.test(String(s.value)));
  const desc = mo.desc_larga || mo.desc || '';
  const urlMarca = o + '/marca/?m=' + marca.slug;
  const base =
    '<h1>' + esc(nombre) + '</h1><p>' + esc(desc) + '</p>' +
    (specs.length ? '<h2>Ficha técnica</h2><dl>' + specs.map((s) => '<dt>' + esc(s.label) + '</dt><dd>' + esc(s.value) + '</dd>').join('') + '</dl>' : '') +
    '<p><a href="' + esc(urlMarca) + '">Todos los modelos de ' + esc(marca.nombre) + ' en Chile</a></p>' +
    (otros.length ? '<h2>Otros modelos de ' + esc(marca.nombre) + '</h2>' + enlaces(otros) : '');
  const producto = {
    '@context': 'https://schema.org', '@type': 'Product', name: nombre, description: recortar(desc, 500), url: dir,
    brand: { '@type': 'Brand', name: marca.nombre }, category: 'Embarcaciones', image: imagenes.filter(Boolean),
    ...(specs.length ? { additionalProperty: specs.slice(0, 20).map((s) => ({ '@type': 'PropertyValue', name: s.label, value: String(s.value) })) } : {}),
  };
  const miga = { '@context': 'https://schema.org', ...migas([{ nombre: 'Oceanic', url: o + '/' }, { nombre: marca.nombre, url: urlMarca }, { nombre, url: dir }]) };
  return { base: bloqueBase(base), jsonld: [producto, miga] };
}

export function seoMarca({ o, dir, nombre, texto, modelos, linea }) {
  const base = '<h1>' + esc(nombre) + ' en Chile</h1>' + (texto ? '<p>' + esc(texto) + '</p>' : '') +
    (modelos.length ? '<h2>Modelos de ' + esc(nombre) + '</h2>' + enlaces(modelos) : '');
  const lista = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Modelos de ' + nombre + (linea ? ' · ' + linea : ''), numberOfItems: modelos.length,
    itemListElement: modelos.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: x.url, name: x.nombre })) };
  const miga = { '@context': 'https://schema.org', ...migas([{ nombre: 'Oceanic', url: o + '/' }, { nombre, url: dir }]) };
  return { base: bloqueBase(base), jsonld: [lista, miga] };
}

export function seoUniverso({ o, dir, nombre, texto, marcas }) {
  const base = '<h1>' + esc(nombre) + '</h1>' + (texto ? '<p>' + esc(texto) + '</p>' : '') + (marcas.length ? '<h2>Marcas</h2>' + enlaces(marcas) : '');
  const lista = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Marcas de ' + nombre, numberOfItems: marcas.length,
    itemListElement: marcas.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: x.url, name: x.nombre })) };
  const miga = { '@context': 'https://schema.org', ...migas([{ nombre: 'Oceanic', url: o + '/' }, { nombre, url: dir }]) };
  return { base: bloqueBase(base), jsonld: [lista, miga] };
}

/* ---------- usados (aquí sí hay precio publicado) ---------- */
export function precioUsado(txt) {
  const t = String(txt || '');
  const n = parseInt(t.replace(/[^\d]/g, ''), 10);
  if (!n || n < 100) return null;
  const moneda = /usd|us\$|dólar|dolar/i.test(t) ? 'USD' : /€|eur/i.test(t) ? 'EUR' : /\$|clp|peso/i.test(t) ? 'CLP' : '';
  return moneda ? { price: n, currency: moneda } : null;
}
export function seoUsado({ o, dir, u, nombre, imagen }) {
  const p = precioUsado(u.precio);
  const vendido = u.estado === 'vendido';
  const base = '<h1>' + esc(nombre) + '</h1>' + (u.resumen ? '<p>' + esc(u.resumen) + '</p>' : '') +
    '<ul>' + [u.anio && 'Año: ' + u.anio, u.precio && !vendido && 'Precio: ' + u.precio, vendido && 'Vendido'].filter(Boolean).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<p><a href="' + esc(o + '/usados/') + '">Todos los usados de Oceanic</a></p>';
  const producto = { '@context': 'https://schema.org', '@type': 'Product', name: nombre, description: recortar(u.resumen || 'Embarcación usada revisada por Oceanic.', 500), url: dir,
    itemCondition: 'https://schema.org/UsedCondition', category: 'Embarcaciones usadas', ...(u.marca ? { brand: { '@type': 'Brand', name: u.marca } } : {}),
    ...(imagen ? { image: [imagen] } : {}),
    ...(p ? { offers: { '@type': 'Offer', price: p.price, priceCurrency: p.currency, url: dir, itemCondition: 'https://schema.org/UsedCondition',
      availability: vendido ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Oceanic' } } } : {}) };
  const miga = { '@context': 'https://schema.org', ...migas([{ nombre: 'Oceanic', url: o + '/' }, { nombre: 'Usados', url: o + '/usados/' }, { nombre, url: dir }]) };
  return { base: bloqueBase(base), jsonld: [producto, miga] };
}

/* ---------- eventos y newsletter ---------- */
export function seoEvento({ o, dir, l, imagen }) {
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(l.fecha || '') ? l.fecha : '';
  const base = '<h1>' + esc(l.titulo) + '</h1>' + (l.bajada ? '<p>' + esc(l.bajada) + '</p>' : '') +
    '<ul>' + [fecha && 'Fecha: ' + fecha.split('-').reverse().join('-'), l.hora && 'Hora: ' + l.hora, l.lugar && 'Lugar: ' + l.lugar].filter(Boolean).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  const evento = fecha ? { '@context': 'https://schema.org', '@type': 'Event', name: l.titulo, description: recortar(l.bajada || l.titulo, 300), url: dir,
    startDate: fecha + (/^\d{2}:\d{2}$/.test(l.hora || '') ? 'T' + l.hora : ''), eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(l.lugar ? { location: { '@type': 'Place', name: l.lugar, address: l.lugar } } : {}), ...(imagen ? { image: [imagen] } : {}),
    organizer: { '@type': 'Organization', name: 'Oceanic', url: o + '/' } } : null;
  return { base: bloqueBase(base), jsonld: evento ? [evento] : [] };
}

export function seoEdicion({ o, dir, ed, imagen }) {
  const titulares = (ed.bloques || []).map((b) => b.titular || b.titulo).filter(Boolean);
  const base = '<h1>Puerto · ' + esc(ed.mes) + '</h1>' + (ed.resumen ? '<p>' + esc(ed.resumen) + '</p>' : '') +
    (titulares.length ? '<h2>En esta edición</h2><ul>' + titulares.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') +
    '<p><a href="' + esc(o + '/puerto/') + '">Todas las ediciones de Puerto</a></p>';
  const articulo = { '@context': 'https://schema.org', '@type': 'Article', headline: 'Puerto · ' + ed.mes, description: recortar(ed.resumen || '', 300), url: dir,
    datePublished: ed.fecha, mainEntityOfPage: dir, ...(imagen ? { image: [imagen] } : {}), inLanguage: 'es-CL',
    author: { '@type': 'Organization', name: 'Oceanic' }, publisher: { '@type': 'Organization', name: 'Oceanic', url: o + '/', logo: { '@type': 'ImageObject', url: o + '/assets/img/marca/iso.svg' } } };
  const miga = { '@context': 'https://schema.org', ...migas([{ nombre: 'Oceanic', url: o + '/' }, { nombre: 'Puerto', url: o + '/puerto/' }, { nombre: ed.mes, url: dir }]) };
  return { base: bloqueBase(base), jsonld: [articulo, miga] };
}
