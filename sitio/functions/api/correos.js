/* OCEANIC · Diseño de los correos de los formularios (HTML compatible con Gmail, Outlook y Apple Mail: tablas y
   estilos en línea, ancho 600 px, sin imágenes de terceros). Lo usa functions/api/formulario.js.

   Cotización de un barco nuevo (desde la ficha):
   - a ventas:   «Tienes una cotización web, Beneteau First 30» · quién cotizó, sus datos ordenados, botones para
                 responder/WhatsApp/llamar y la ficha corta del barco.
   - al cliente: «Hemos recibido tu cotización de un Beneteau First 30» · saludo, ficha corta del barco con foto,
                 lo que nos contó y el cierre de Oceanic.
   Los datos del barco salen del catálogo del sitio (no del navegador). */

const C = { noche: '#14212B', boya: '#CB5C3C', arena: '#E3E1DC', banda: '#F4F4F2', trabajo: '#52616E', linea: '#E5E2DC' };
const FUENTE = "font-family:Helvetica,Arial,sans-serif";
const OFICINA = 'Alonso de Córdova 2653, of. 302, Vitacura, Santiago';
const TELEFONO = '+56 2 2953 7322';

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** «Beneteau» + «First 30» → «Beneteau First 30»; «Lagoon» + «Lagoon 46» → «Lagoon 46». */
export function nombreBarco(marca, modelo) {
  if (!modelo) return marca || '';
  if (!marca || modelo.toLowerCase().startsWith(marca.toLowerCase())) return modelo;
  return marca + ' ' + modelo;
}

export function fechaChile(iso) {
  try {
    return new Date(iso).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'long', timeStyle: 'short' });
  } catch { return iso; }
}

/* ---------- piezas ---------- */

function marco(contenido, preencabezado) {
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light"><title>Oceanic</title></head>' +
    '<body style="margin:0;padding:0;background:' + C.banda + '">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + esc(preencabezado || '') + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.banda + '"><tr><td align="center" style="padding:28px 12px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;' + FUENTE + ';color:' + C.noche + '">' +
    contenido + '</table></td></tr></table></body></html>';
}

// Logo oficial en PNG (Gmail y Outlook no muestran SVG), al doble de tamaño para pantallas retina.
function logo(sitio, est, ancho) {
  if (!sitio) return 'OCEANIC<span style="color:' + C.boya + '">&#9679;</span>';
  return '<img src="' + esc(sitio) + '/assets/img/marca/' + (est ? 'logo-blanco-est-correo.png' : 'logo-blanco-correo.png') +
    '" width="' + ancho + '" alt="Oceanic' + (est ? ', est. 1994' : '') + '" style="display:block;width:' + ancho + 'px;height:auto;border:0;' +
    FUENTE + ';font-size:15px;font-weight:700;letter-spacing:4px;color:#ffffff">';
}

function cabecera(etiqueta, sitio) {
  return '<tr><td style="background:' + C.noche + ';padding:24px 32px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="' + FUENTE + ';font-size:15px;font-weight:700;letter-spacing:4px;color:#ffffff">' + logo(sitio, true, 160) + '</td>' +
    (etiqueta ? '<td align="right" style="' + FUENTE + ';font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#AAB4BC">' + esc(etiqueta) + '</td>' : '') +
    '</tr></table></td></tr>';
}

function etiquetaSeccion(t) {
  return '<p style="margin:0 0 12px;' + FUENTE + ';font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + C.trabajo + '">' + esc(t) + '</p>';
}

/** Tabla de datos: filas [etiqueta, valor, (html ya escapado)]. */
function tablaDatos(filas) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid ' + C.boya + '">' +
    filas.filter((f) => f[1] || f[2]).map((f) =>
      '<tr><td valign="top" style="padding:11px 12px 11px 0;border-bottom:1px solid ' + C.linea + ';' + FUENTE + ';font-size:12px;letter-spacing:1px;text-transform:uppercase;color:' + C.trabajo + ';width:38%">' + esc(f[0]) + '</td>' +
      '<td valign="top" style="padding:11px 0;border-bottom:1px solid ' + C.linea + ';' + FUENTE + ';font-size:15px;line-height:1.5;color:' + C.noche + ';white-space:pre-wrap">' + (f[2] || esc(f[1])) + '</td></tr>'
    ).join('') + '</table>';
}

function boton(texto, href, principal) {
  return '<a href="' + esc(href) + '" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;' + FUENTE + ';font-size:14px;font-weight:700;text-decoration:none;' +
    (principal ? 'background:' + C.boya + ';color:#ffffff' : 'border:1px solid ' + C.noche + ';color:' + C.noche) + '">' + esc(texto) + '</a>';
}

/** Ficha corta del barco: foto, nombre, línea y cuatro datos. */
function fichaBarco(b, grande) {
  if (!b) return '';
  const datos = b.datos.slice(0, 4);
  const celdas = datos.map((x) =>
    '<td valign="top" width="' + Math.floor(100 / datos.length) + '%" style="padding:12px 10px 12px 0;border-top:2px solid ' + C.boya + '">' +
    '<div style="' + FUENTE + ';font-size:10px;letter-spacing:1px;text-transform:uppercase;color:' + C.trabajo + '">' + esc(x[0]) + '</div>' +
    '<div style="' + FUENTE + ';font-size:' + (grande ? 17 : 15) + 'px;font-weight:700;color:' + C.noche + ';margin-top:4px;white-space:nowrap">' + esc(x[1]) + '</div></td>').join('');
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.banda + '">' +
    (b.foto ? '<tr><td><a href="' + esc(b.url) + '"><img src="' + esc(b.foto) + '" width="600" alt="' + esc(b.nombre) + '" style="display:block;width:100%;max-width:600px;height:auto;border:0"></a></td></tr>' : '') +
    '<tr><td style="padding:22px 24px 20px">' +
    '<div style="' + FUENTE + ';font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + C.boya + '">' + esc(b.marca) + (b.linea ? ' · ' + esc(b.linea) : '') + '</div>' +
    '<div style="' + FUENTE + ';font-size:' + (grande ? 26 : 21) + 'px;font-weight:700;letter-spacing:-.3px;color:' + C.noche + ';margin:6px 0 16px">' + esc(b.nombre) + '</div>' +
    (celdas ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + celdas + '</tr></table>' : '') +
    (b.url ? '<p style="margin:16px 0 0"><a href="' + esc(b.url) + '" style="' + FUENTE + ';font-size:14px;font-weight:700;color:' + C.boya + ';text-decoration:none">Ver la ficha completa &rarr;</a></p>' : '') +
    '</td></tr></table>';
}

function pie(nota, sitio) {
  return '<tr><td style="background:' + C.noche + ';padding:24px 32px">' +
    '<div style="margin:0 0 10px;' + FUENTE + ';font-size:13px;font-weight:700;letter-spacing:3px;color:#ffffff">' + logo(sitio, false, 96) + '</div>' +
    '<p style="margin:0;' + FUENTE + ';font-size:12px;line-height:1.6;color:#AAB4BC">' + esc(OFICINA) + ' · ' + esc(TELEFONO) + '</p>' +
    (nota ? '<p style="margin:12px 0 0;' + FUENTE + ';font-size:11px;line-height:1.5;color:#7F8C96">' + nota + '</p>' : '') +
    '</td></tr>';
}

function texto(t) { return t.replace(/\n{3,}/g, '\n\n').trim(); }

/* ---------- cotización: ventas ---------- */

export function cotizacionVentas(d, b) {
  const barco = b ? b.nombre : nombreBarco(d.marca, d.modelo) || 'un barco';
  const quien = d.nombre || d.email;
  const asunto = 'Tienes una cotización web, ' + barco;
  const fono = (d.telefono || '').replace(/[^\d+]/g, '');
  const wa = fono.replace(/\D/g, '');
  const respuesta = 'mailto:' + d.email + '?subject=' + encodeURIComponent('Tu cotización del ' + barco + ' · Oceanic');
  const filas = [
    ['Nombre', d.nombre],
    ['Correo', d.email, '<a href="mailto:' + esc(d.email) + '" style="color:' + C.noche + '">' + esc(d.email) + '</a>'],
    ['Teléfono', d.telefono, fono ? '<a href="tel:' + esc(fono) + '" style="color:' + C.noche + '">' + esc(d.telefono) + '</a>' : ''],
    ['¿Cuándo quiere navegar?', d.intencion],
    ['Mensaje', d.mensaje],
    ['Newsletter Puerto', d.puerto ? 'Sí, pidió recibirlo (pendiente de confirmar su correo)' : 'No'],
  ];
  const html = marco(
    cabecera('Cotización web', d.sitio) +
    '<tr><td style="padding:30px 32px 6px">' +
    '<h1 style="margin:0 0 6px;' + FUENTE + ';font-size:24px;line-height:1.3;font-weight:700;color:' + C.noche + '">' + esc(quien) + ' ha cotizado un ' + esc(barco) + '</h1>' +
    '<p style="margin:0 0 20px;' + FUENTE + ';font-size:14px;color:' + C.trabajo + '">Recibida el ' + esc(fechaChile(d.fecha)) + '</p>' +
    boton('Responder por correo', respuesta, true) +
    (wa.length >= 8 ? boton('WhatsApp', 'https://wa.me/' + wa) : '') +
    (fono ? boton('Llamar', 'tel:' + fono) : '') +
    '</td></tr>' +
    '<tr><td style="padding:18px 32px 8px">' + etiquetaSeccion('Datos del cotizante') + tablaDatos(filas) + '</td></tr>' +
    (b ? '<tr><td style="padding:22px 32px 8px">' + etiquetaSeccion('Barco cotizado') + fichaBarco(b) + '</td></tr>' : '') +
    '<tr><td style="padding:18px 32px 28px;' + FUENTE + ';font-size:12px;line-height:1.6;color:' + C.trabajo + '">' +
    'Página: <a href="' + esc(d.href || d.origen) + '" style="color:' + C.trabajo + '">' + esc(d.href || d.origen) + '</a><br>' +
    'Aceptó la política de privacidad (versión ' + esc(d.politica) + '). Responde este correo para escribirle directo a ' + esc(quien) + '.</td></tr>' +
    pie('', d.sitio),
    quien + (d.intencion ? ' · ' + d.intencion : '') + ' · ' + d.email);
  const txt = texto([
    quien + ' ha cotizado un ' + barco + ':', '',
    ...filas.filter((f) => f[1]).map((f) => f[0] + ': ' + f[1]), '',
    b ? 'Barco: ' + b.nombre + (b.datos.length ? ' (' + b.datos.map((x) => x[0] + ' ' + x[1]).join(' · ') + ')' : '') : '',
    b && b.url ? 'Ficha: ' + b.url : '',
    'Página: ' + (d.href || d.origen),
    'Recibida: ' + fechaChile(d.fecha) + ' · Política: ' + d.politica,
  ].join('\n'));
  return { asunto: asunto.slice(0, 200), texto: txt, html };
}

/* ---------- cotización: cliente ---------- */

export function cotizacionCliente(d, b) {
  const barco = b ? b.nombre : nombreBarco(d.marca, d.modelo) || 'un barco';
  const nombre = (d.nombre || '').split(' ')[0];
  const asunto = 'Hemos recibido tu cotización de un ' + barco;
  const contaste = [
    ['¿Cuándo quieres navegar?', d.intencion],
    ['Teléfono', d.telefono],
    ['Tu mensaje', d.mensaje],
    ['Newsletter Puerto', d.puerto ? 'Sí. Te enviamos un correo aparte para confirmarlo.' : ''],
  ];
  const p = (t, extra) => '<p style="margin:0 0 14px;' + FUENTE + ';font-size:16px;line-height:1.65;color:' + C.noche + (extra || '') + '">' + t + '</p>';
  const html = marco(
    cabecera('', d.sitio) +
    '<tr><td style="padding:34px 32px 10px">' +
    p('Hola ' + esc(nombre || '') + ',', ';font-size:20px;font-weight:700') +
    p('Hemos recibido tu cotización del <b>' + esc(barco) + '</b>. Un especialista de Oceanic la está revisando para ' +
      'enviarte precio, configuración y plazos de entrega en Chile.') +
    '</td></tr>' +
    (b ? '<tr><td style="padding:12px 32px 8px">' + etiquetaSeccion('Tu barco') + fichaBarco(b, true) + '</td></tr>' : '') +
    (contaste.some((f) => f[1]) ? '<tr><td style="padding:22px 32px 8px">' + etiquetaSeccion('Lo que nos contaste') + tablaDatos(contaste) + '</td></tr>' : '') +
    '<tr><td style="padding:22px 32px 30px">' +
    p('Nos pondremos en contacto contigo lo antes posible.') +
    p('Gracias por cotizar en Oceanic.') +
    p('Saludos,<br><b>Equipo Oceanic</b>', ';margin-bottom:0') +
    '<p style="margin:18px 0 0;' + FUENTE + ';font-size:13px;line-height:1.6;color:' + C.trabajo + '">¿Quieres agregar algo? Responde este correo y le llega directo a nuestro equipo de ventas.</p>' +
    '</td></tr>' +
    pie('Recibes este correo porque solicitaste una cotización en el sitio de Oceanic. Tus datos se usan solo para responder ' +
      'esta solicitud, según nuestra política de privacidad.', d.sitio),
    'Un especialista de Oceanic te escribirá pronto con precio, configuración y plazos.');
  const txt = texto([
    'Hola ' + (nombre || '') + ',', '',
    'Hemos recibido tu cotización del ' + barco + '. Un especialista de Oceanic la está revisando para enviarte precio, configuración y plazos de entrega en Chile.', '',
    b ? 'Tu barco: ' + b.nombre + (b.datos.length ? ' (' + b.datos.map((x) => x[0] + ' ' + x[1]).join(' · ') + ')' : '') : '',
    b && b.url ? 'Ficha: ' + b.url : '', '',
    contaste.some((f) => f[1]) ? 'Lo que nos contaste:\n' + contaste.filter((f) => f[1]).map((f) => f[0] + ': ' + f[1]).join('\n') : '', '',
    'Nos pondremos en contacto contigo lo antes posible.',
    'Gracias por cotizar en Oceanic.', '',
    'Saludos,', 'Equipo Oceanic', '',
    OFICINA + ' · ' + TELEFONO,
  ].join('\n'));
  return { asunto: asunto.slice(0, 200), texto: txt, html };
}

/* ---------- datos del barco desde el catálogo del sitio ---------- */

const OPC = /opcional|optional|\bopt\.|\bopci[oó]n/i;
function sinOpcionales(v) {
  if (!v) return '';
  v = String(v).replace(/\s*\([^)]*(opcional|optional|opt\.)[^)]*\)/gi, '').trim();
  return OPC.test(v) ? '' : v;
}
function linea(tipo) {
  const t = (tipo || '').toLowerCase();
  if (t.includes('electric') || t.includes('eléctric')) return 'Eléctrico';
  if (t.includes('catamaran')) return t.includes('vela') ? 'Catamarán a vela' : 'Catamarán a motor';
  return t.includes('vela') ? 'Vela' : 'Motor';
}

/** Busca «marca/slug» en assets/js/catalogo-data.js (servido por el propio sitio). null si no está. */
export async function barcoDelCatalogo(env, origen, ficha) {
  const m = /^([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(ficha || '');
  if (!m || !env.ASSETS) return null;
  try {
    const r = await env.ASSETS.fetch(new Request(origen + '/assets/js/catalogo-data.js'));
    if (!r.ok) return null;
    const t = await r.text();
    const cat = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
    const marca = cat[m[1]], mo = marca && marca.modelos.find((x) => x.slug === m[2]);
    if (!mo) return null;
    const foto = mo.tarjeta || mo.hero;
    const abs = (p) => !p ? '' : /^https?:\/\//.test(p) ? p : origen + (p.startsWith('/') ? p : '/assets/img/' + p.replace(/^(\.\.\/)*assets\/img\//, ''));
    const datos = [['Eslora', mo.eslora], ['Manga', mo.manga], ['Camarotes', mo.camarotes], ['Desplazamiento', mo.peso]]
      .map((x) => [x[0], sinOpcionales(x[1])]).filter((x) => x[1]);
    return {
      marca: marca.nombre, modelo: mo.nombre, nombre: nombreBarco(marca.nombre, mo.nombre), linea: linea(mo.tipo),
      datos, foto: abs(foto), url: origen + '/marca/index.html?m=' + m[1] + '&modelo=' + m[2],
    };
  } catch { return null; }
}
