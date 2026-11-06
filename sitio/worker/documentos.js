/* OCEANIC · Documentos que administra el CMS.
   Cada documento es un archivo de datos del sitio. En el repo están en formato uniforme
   `window.OCEANIC_<TIPO>=<JSON>;` (publicacion.js: el JSON va entre las marcas DATOS y FIN; fichas: JSON puro).
   El CMS guarda el JSON en D1 y, al publicar, el Worker sirve el mismo archivo con el contenido publicado. */

const js = (archivo, global, extra = {}) => ({ archivo, global, leer: (t) => leerGlobal(t, global), ...extra });

export const DOCS = {
  inicio:             js('/assets/js/inicio-data.js', 'OCEANIC_INICIO', { titulo: 'Portada del inicio' }),
  publicacion:        js('/assets/js/publicacion.js', 'OCEANIC_PUBLICACION', { titulo: 'Publicación de modelos', empalme: true,
                        leer: (t) => JSON.parse(t.slice(t.indexOf('/*DATOS*/') + 9, t.indexOf('/*FIN*/'))) }),
  usados:             js('/assets/js/usados-data.js', 'OCEANIC_USADOS', { titulo: 'Usados' }),
  puerto:             js('/assets/js/puerto-data.js', 'OCEANIC_PUERTO', { titulo: 'Puerto' }),
  catalogo:           js('/assets/js/catalogo-data.js', 'OCEANIC_CATALOGO', { titulo: 'Catálogo de modelos' }),
  contenido:          js('/assets/js/catalogo-contenido.js', 'OCEANIC_CONTENIDO', { titulo: 'Contenido del catálogo' }),
  marcas:             js('/assets/js/marcas-info.js', 'OCEANIC_MARCAS', { titulo: 'Marcas' }),
  'marcas-contenido': js('/assets/js/marcas-contenido.js', 'OCEANIC_MARCA_CONTENIDO', { titulo: 'Contenido de marcas' }),
  charter:            js('/assets/js/charter-data.js', 'OCEANIC_CHARTER', { titulo: 'Charter' }),
  equipamiento:       js('/assets/js/equipamiento-data.js', 'OCEANIC_EQUIPAMIENTO', { titulo: 'Equipamiento' }),
  // Solo en el CMS (no hay archivo en el sitio): patrones prohibidos del Brand OS, se validan al guardar texto.
  patrones:           { titulo: 'Patrones prohibidos', soloCms: true, base: [] },
};

const FICHA = /^ficha:([a-z0-9-]+)\/([a-z0-9-]+)$/;

export function definicion(clave) {
  if (DOCS[clave]) return DOCS[clave];
  const m = FICHA.exec(clave);
  if (m) return { titulo: 'Ficha ' + m[1] + '/' + m[2], archivo: `/assets/data/fichas/${m[1]}/${m[2]}.json`, json: true,
    leer: (t) => JSON.parse(t) };
  return null;
}

/* Ruta pública → clave del documento (solo las que el CMS puede reemplazar). */
const POR_ARCHIVO = Object.fromEntries(Object.entries(DOCS).filter(([, d]) => d.archivo).map(([k, d]) => [d.archivo, k]));
export function claveDeRuta(p) {
  if (POR_ARCHIVO[p]) return POR_ARCHIVO[p];
  const m = /^\/assets\/data\/fichas\/([a-z0-9-]+)\/([a-z0-9-]+)\.json$/.exec(p);
  return m ? `ficha:${m[1]}/${m[2]}` : null;
}

export function leerGlobal(t, global) {
  const marca = 'window.' + global + '=';
  let i = t.lastIndexOf(marca), salto = marca.length;  // la última: la cabecera puede citar el formato
  if (i < 0) { const m = new RegExp('window\\.' + global + '\\s*=\\s*').exec(t); if (!m) throw new Error('Sin ' + global); i = m.index; salto = m[0].length; }
  const fin = t.lastIndexOf(';');
  return JSON.parse(t.slice(i + salto, fin > i ? fin : undefined));
}

export function renderArchivo(def, contenido, base, etiqueta) {
  if (def.json) return contenido;
  if (def.empalme) {  // publicacion.js: solo se reemplaza el bloque de datos, el código queda igual
    const a = base.indexOf('/*DATOS*/'), b = base.indexOf('/*FIN*/');
    return base.slice(0, a + 9) + JSON.stringify(JSON.parse(contenido), null, 1) + base.slice(b);
  }
  return `/* OCEANIC · ${def.titulo} · publicado desde el CMS (${etiqueta}). No editar: se administra en /admin/. */\n` +
    `window.${def.global}=${contenido};\n`;
}

/* ================= validación ================= */

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function enlaceSeguro(h) {
  h = String(h == null ? '' : h).trim();
  if (!h) return true;
  if (/[\u0000-\u001f\s]/.test(h)) return false;
  if (/^https?:\/\//i.test(h)) return true;
  if (/^\/\//.test(h)) return false;
  return !/^[a-z][a-z0-9+.-]*:/i.test(h);  // relativa, /absoluta interna, #ancla, ?consulta
}
const rutaImagen = (s) => typeof s === 'string' && s.length < 400 && enlaceSeguro(s) && !/["'<>\\]/.test(s);

/* Devuelve { errores: [...], avisos: [...] }. Los errores impiden guardar. */
export function validar(clave, d, patrones = []) {
  const E = [], A = [];
  const err = (ruta, msg) => E.push({ ruta, msg }), aviso = (ruta, msg) => A.push({ ruta, msg });
  const def = definicion(clave);
  if (!def) return { errores: [{ ruta: '', msg: 'Documento desconocido: ' + clave }], avisos: [] };
  if (d === null || typeof d !== 'object') err('', 'El contenido debe ser un objeto o una lista JSON');
  else if (clave === 'usados') usados(d, err, aviso);
  else if (clave === 'puerto') puerto(d, err, aviso);
  else if (clave === 'publicacion') publicacion(d, err);
  else if (clave === 'inicio') inicio(d, err);
  else if (clave === 'catalogo' || clave === 'contenido') ficha(d, err, aviso);
  else if (clave === 'patrones') listaPatrones(d, err);
  else if (FICHA.test(clave)) ficha(d, err, aviso);
  if (clave !== 'patrones') prohibidos(d, normalizarPatrones(patrones), err);
  return { errores: E, avisos: A };
}

function usados(L, err, aviso) {
  if (!Array.isArray(L)) return err('', 'Usados debe ser una lista de avisos');
  const ids = new Set();
  L.forEach((u, i) => {
    const r = `[${i}]`;
    if (!u || typeof u !== 'object') return err(r, 'Aviso inválido');
    if (!SLUG.test(u.id || '')) err(r + '.id', 'id: minúsculas, números y guiones (ej. lagoon-39)');
    else if (ids.has(u.id)) err(r + '.id', 'id repetido: ' + u.id); else ids.add(u.id);
    if (!str(u.nombre)) err(r + '.nombre', 'Falta el nombre');
    if (!['motor', 'vela', 'catamaran'].includes(u.tipo)) err(r + '.tipo', 'tipo: motor, vela o catamaran');
    if (!['disponible', 'vendido', 'reservado'].includes(u.estado)) err(r + '.estado', 'estado: disponible o vendido');
    if (!FECHA.test(u.fecha || '')) err(r + '.fecha', 'fecha AAAA-MM-DD (ordena el listado)');
    for (const k of ['marca', 'anio', 'precio', 'resumen', 'texto']) if (u[k] != null && typeof u[k] !== 'string') err(r + '.' + k, k + ' debe ser texto');
    if (u.oculto != null && typeof u.oculto !== 'boolean') err(r + '.oculto', 'oculto: verdadero o falso');
    if (u.portada != null && u.portada !== '' && !(rutaImagen(u.portada) || (typeof u.portada === 'object' && rutaImagen(u.portada.url || '') && rutaImagen(u.portada.local || ''))))
      err(r + '.portada', 'Foto de la tarjeta inválida');
    if (!Array.isArray(u.fotos)) err(r + '.fotos', 'fotos debe ser una lista');
    else u.fotos.forEach((f, j) => { if (!(rutaImagen(f) || (f && typeof f === 'object' && (rutaImagen(f.local || '') && rutaImagen(f.url || ''))))) err(`${r}.fotos[${j}]`, 'Ruta de foto inválida'); });
    if (!Array.isArray(u.docs)) err(r + '.docs', 'docs debe ser una lista');
    else u.docs.forEach((h, j) => { if (!str(h) || !enlaceSeguro(h)) err(`${r}.docs[${j}]`, 'Enlace inválido (http/https o ruta interna)'); });
    if (!str(u.resumen)) aviso(r + '.resumen', 'Sin bajada para la tarjeta');
  });
}

function puerto(L, err, aviso) {
  if (!Array.isArray(L)) return err('', 'Puerto debe ser una lista de ediciones');
  const slugs = new Set();
  L.forEach((e, i) => {
    const r = `[${i}]`;
    if (!e || typeof e !== 'object') return err(r, 'Edición inválida');
    if (!/^puerto-[a-z0-9-]+$/.test(e.slug || '')) err(r + '.slug', 'slug: puerto-<mes>-<año> (ej. puerto-octubre-2026)');
    else if (slugs.has(e.slug)) err(r + '.slug', 'slug repetido: ' + e.slug); else slugs.add(e.slug);
    if (!str(e.mes)) err(r + '.mes', 'Falta el mes (ej. Octubre 2026)');
    if (!FECHA.test(e.fecha || '')) err(r + '.fecha', 'fecha AAAA-MM-DD (ordena el índice)');
    if (e.portada && !rutaImagen(e.portada)) err(r + '.portada', 'Portada inválida');
    if (e.pdf && !enlaceSeguro(e.pdf)) err(r + '.pdf', 'Enlace del PDF inválido');
    if (!Array.isArray(e.bloques)) return err(r + '.bloques', 'bloques debe ser una lista');
    if (!e.bloques.length) aviso(r + '.bloques', 'Edición sin bloques');
    e.bloques.forEach((b, j) => {
      const rb = `${r}.bloques[${j}]`;
      if (!b || typeof b !== 'object') return err(rb, 'Bloque inválido');
      if (b.type === 'noticia') {
        if (!str(b.titular)) err(rb + '.titular', 'Falta el titular');
        if (b.etiqueta != null && typeof b.etiqueta !== 'string') err(rb + '.etiqueta', 'Texto');
        if (!Array.isArray(b.cuerpo) || b.cuerpo.some((p) => typeof p !== 'string')) err(rb + '.cuerpo', 'cuerpo: lista de párrafos');
        if (b.galeria != null) {
          if (!Array.isArray(b.galeria) || b.galeria.length > 9) err(rb + '.galeria', 'galería: 0 a 9 fotos');
          else b.galeria.forEach((g, k) => { if (!rutaImagen(g)) err(`${rb}.galeria[${k}]`, 'Ruta de foto inválida'); });
        }
        if (b.specs != null && (!Array.isArray(b.specs) || b.specs.some((s) => !s || !str(s.label) || typeof s.value !== 'string'))) err(rb + '.specs', 'specs: lista de {label, value}');
        if (b.cta != null && b.cta !== '' && (typeof b.cta !== 'object' || !str(b.cta.texto) || !str(b.cta.href) || !enlaceSeguro(b.cta.href))) err(rb + '.cta', 'CTA: texto y enlace seguro (sin javascript:)');
        if (b.evento != null && typeof b.evento !== 'object') err(rb + '.evento', 'evento: {fecha, lugar, texto}');
        if (!str(b.etiqueta) || !str(b.bajada) || !(b.cuerpo || []).length) aviso(rb, 'Noticia incompleta (etiqueta, bajada y cuerpo son obligatorios en el contrato)');
      } else if (b.type === 'guia') {
        if (!str(b.titular)) err(rb + '.titular', 'Falta el titular');
        if (!Array.isArray(b.pasos) || !b.pasos.length) err(rb + '.pasos', 'La guía necesita pasos');
        else b.pasos.forEach((p, k) => { if (!p || !str(p.titulo) || !Array.isArray(p.puntos)) err(`${rb}.pasos[${k}]`, 'Paso: título y puntos'); });
      } else err(rb + '.type', 'Tipo de bloque desconocido: ' + b.type);
    });
  });
}

function inicio(d, err) {
  if (Array.isArray(d)) return err('', 'La portada es un objeto');
  if (d.video && (!enlaceSeguro(d.video) || !/^(https:\/\/|\/media\/)/.test(d.video))) err('video', 'Video: enlace https:// o archivo subido (/media/…)');
  if (d.poster && !rutaImagen(d.poster)) err('poster', 'Imagen de respaldo inválida');
  for (const k of ['antetitulo', 'titular', 'bajada']) if (d[k] != null && typeof d[k] !== 'string') err(k, k + ' debe ser texto');
}

function publicacion(d, err) {
  if (!Array.isArray(d.destacados) || d.destacados.length !== 3) err('destacados', 'La portada lleva exactamente 3 destacados');
  else d.destacados.forEach((k, i) => { if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(k)) err(`destacados[${i}]`, 'Formato marca/modelo'); });
  if (!d.ocultos || typeof d.ocultos !== 'object' || Array.isArray(d.ocultos)) err('ocultos', 'ocultos: objeto { "marca/modelo": "motivo" }');
  else for (const [k, v] of Object.entries(d.ocultos)) { if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(k) || typeof v !== 'string') err('ocultos.' + k, 'Formato marca/modelo con motivo'); }
  if (Array.isArray(d.destacados) && d.ocultos) d.destacados.forEach((k) => { if (d.ocultos[k]) err('destacados', k + ' está apagado: no puede ser destacado'); });
}

function ficha(d, err, aviso) {
  if (Array.isArray(d)) return err('', 'La ficha es un objeto');
  if (d.estado && !['BORRADOR', 'REVISADO'].includes(d.estado)) err('estado', 'estado: BORRADOR o REVISADO');
  // Sin opcionales ni precios en barcos nuevos (decisión Oceanic 2026-11-04)
  recorrer(d, (s, ruta) => {
    if (/\bopcional|\boptional\b|\bpack\b/i.test(s)) aviso(ruta, 'Menciona opcionales: no se publican en barcos nuevos');
    if (/(US\$|USD|EUR|€|CLP)\s*\d|\$\s*\d{2,}/i.test(s)) err(ruta, 'Precio en barco nuevo: no se publica');
  });
}

function listaPatrones(d, err) {
  if (!Array.isArray(d)) return err('', 'Lista de patrones');
  d.forEach((p, i) => { const n = normalizarPatrones([p])[0]; if (!n) err(`[${i}]`, 'Patrón inválido (texto o expresión regular válida)'); });
}

/* patrones-prohibidos.json: acepta textos sueltos u objetos {patron|pattern|texto, regex?, motivo|reason}. */
export function normalizarPatrones(lista) {
  const L = Array.isArray(lista) ? lista : (lista && Array.isArray(lista.patrones) ? lista.patrones : []);
  return L.map((p) => {
    const o = typeof p === 'string' ? { patron: p } : (p || {});
    const t = o.patron || o.pattern || o.texto || o.regex_text || '';
    if (!t || typeof t !== 'string') return null;
    const esRe = o.regex === true || o.tipo === 'regex' || (typeof o.regex === 'string');
    const fuente = typeof o.regex === 'string' ? o.regex : t;
    try {
      const re = esRe ? new RegExp(fuente, 'iu') : new RegExp('(^|[^\\p{L}\\p{N}])' + fuente.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^\\p{L}\\p{N}])', 'iu');
      return { re, patron: t, motivo: o.motivo || o.reason || o.razon || '' };
    } catch { return null; }
  }).filter(Boolean);
}

function prohibidos(d, P, err) {
  if (!P.length) return;
  recorrer(d, (s, ruta) => {
    for (const p of P) if (p.re.test(s)) err(ruta, `Patrón prohibido «${p.patron}»${p.motivo ? ': ' + p.motivo : ''}`);
  });
}

function recorrer(v, f, ruta = '') {
  if (typeof v === 'string') f(v, ruta);
  else if (Array.isArray(v)) v.forEach((x, i) => recorrer(x, f, `${ruta}[${i}]`));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    if (k === 'fotos' || k === 'galeria' || k === 'hero' || k === 'portada' || k === 'href' || k === 'fuente' || k === 'docs' || k === 'pdf' || k === 'url' || k === 'local') continue;
    recorrer(x, f, ruta ? ruta + '.' + k : k);
  }
}
const str = (s) => typeof s === 'string' && s.trim() !== '';
