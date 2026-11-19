/* OCEANIC · CRM propio: leads guardados en D1 (tabla leads).
   Decisión Oceanic (2026-11-19): el CRM interno NO lee los contactos antiguos de Brevo. Guarda solo los leads que llegan desde el
   lanzamiento (2026-12-01 00:00, hora de Chile) y cada lead queda en AMBOS lados: aquí (D1) y en Brevo (lista de su marca, como hasta ahora).
   Lo guarda el endpoint de formularios (formulario.js) y lo lee/ordena el administrador (worker/crm.js).
   Datos personales (Ley 21.719): solo lo que la persona escribió en el formulario, con su aceptación de la política;
   el administrador puede eliminar un lead (derecho de supresión). La suscripción sola a Puerto y las solicitudes de derechos no son leads. */

// 2026-12-01 00:00 en Chile (verano, UTC-3). Se puede adelantar o atrasar con la variable CRM_DESDE (ISO) del Worker.
export const LEADS_DESDE = '2026-12-01T03:00:00Z';
export const ETAPAS = ['Nuevo', 'Contactado', 'Cotizado', 'En negociación', 'Cerrado', 'Perdido'];
const SIN_LEAD = new Set(['puerto', 'privacidad']);

export const desde = (env) => (env && env.CRM_DESDE) || LEADS_DESDE;
export function esLead(d, env, ahora = new Date().toISOString()) {
  return !!(d && d.tipo && !SIN_LEAD.has(d.tipo) && ahora >= desde(env));
}

const TABLAS = [
  `CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, creado TEXT NOT NULL, actualizado TEXT NOT NULL, tipo TEXT NOT NULL, linea TEXT,
    nombre TEXT, email TEXT NOT NULL, telefono TEXT, via TEXT, motivo TEXT, marca TEXT, modelo TEXT, universo TEXT, ficha TEXT, origen TEXT, mensaje TEXT,
    detalle TEXT, categorias TEXT, puerto INTEGER NOT NULL DEFAULT 0, politica TEXT, etapa TEXT NOT NULL DEFAULT 'Nuevo', aviso_ok INTEGER NOT NULL DEFAULT 0,
    brevo TEXT NOT NULL DEFAULT 'pendiente')`,
  'CREATE INDEX IF NOT EXISTS idx_leads_creado ON leads (creado DESC)',
  'CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email)',
  'CREATE TABLE IF NOT EXISTS lead_notas (id INTEGER PRIMARY KEY AUTOINCREMENT, lead_id INTEGER NOT NULL, fecha TEXT NOT NULL, quien TEXT NOT NULL, texto TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS crm_acciones (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT NOT NULL, quien TEXT NOT NULL, contacto TEXT NOT NULL, accion TEXT NOT NULL, valor TEXT)',
];
const listas = new WeakMap();
export function asegurarTablas(env) {  // una vez por instancia del Worker
  if (!listas.has(env.DB)) listas.set(env.DB, env.DB.batch(TABLAS.map((s) => env.DB.prepare(s))).catch((e) => { listas.delete(env.DB); throw e; }));
  return listas.get(env.DB);
}

const t = (v, n) => (v == null ? '' : String(v)).slice(0, n);

/** Guarda el lead y devuelve su id (o null si no corresponde o falla: nunca debe impedir el envío del formulario). */
export async function guardarLead(env, d, linea) {
  if (!env.DB || !esLead(d, env, d.fecha)) return null;
  try {
    await asegurarTablas(env);
    const ahora = d.fecha || new Date().toISOString();
    const r = await env.DB.prepare(
      `INSERT INTO leads (creado, actualizado, tipo, linea, nombre, email, telefono, via, motivo, marca, modelo, universo, ficha, origen, mensaje, detalle, categorias, puerto, politica)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(ahora, ahora, d.tipo, t(linea, 60), t(d.nombre, 120), t(d.email, 160), t(d.telefono, 40), t(d.via, 20), t(d.motivo, 120), t(d.marca, 120), t(d.modelo, 160),
        t(d.universo, 60), t(d.ficha, 120), t(d.origen || d.href, 300), t(d.mensaje, 3000), t(d.detalle, 3000), JSON.stringify(d.categorias || []), d.puerto ? 1 : 0, t(d.politica, 60)).run();
    return r && r.meta ? r.meta.last_row_id : null;
  } catch (e) {
    console.log('lead: no se pudo guardar (' + String(e && e.message).slice(0, 80) + ')');
    return null;
  }
}
export async function marcarLead(env, id, campos) {
  if (!env.DB || !id) return;
  try {
    const ks = Object.keys(campos).filter((k) => k === 'aviso_ok' || k === 'brevo');
    if (!ks.length) return;
    await env.DB.prepare(`UPDATE leads SET ${ks.map((k) => k + ' = ?').join(', ')} WHERE id = ?`).bind(...ks.map((k) => campos[k]), id).run();
  } catch { /* mejor esfuerzo */ }
}

/* ---------- lectura y órdenes del administrador ---------- */
const COLS = 'id, creado, actualizado, tipo, linea, nombre, email, telefono, via, marca, modelo, universo, origen, etapa, aviso_ok, brevo';
export async function resumen(env) {
  await asegurarTablas(env);
  const hace7 = new Date(Date.now() - 7 * 86400e3).toISOString();
  const [tot, nue, et, ti] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS n FROM leads').first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM leads WHERE creado >= ?').bind(hace7).first(),
    env.DB.prepare('SELECT etapa, COUNT(*) AS n FROM leads GROUP BY etapa').all(),
    env.DB.prepare('SELECT tipo, linea, COUNT(*) AS n FROM leads GROUP BY tipo, linea ORDER BY n DESC').all(),
  ]);
  const porEtapa = Object.fromEntries(ETAPAS.map((e) => [e, 0]));
  for (const r of et.results || []) porEtapa[r.etapa] = r.n;
  return { total: tot ? tot.n : 0, nuevos7: nue ? nue.n : 0, porEtapa, porTipo: (ti.results || []).map((r) => ({ tipo: r.tipo, linea: r.linea, n: r.n })), desde: desde(env), activo: new Date().toISOString() >= desde(env) };
}
export async function listar(env, { q = '', etapa = '', tipo = '', marca = '', limite = 100, pagina = 0 } = {}) {
  await asegurarTablas(env);
  const w = [], p = [];
  if (etapa && ETAPAS.includes(etapa)) { w.push('etapa = ?'); p.push(etapa); }
  if (tipo && /^[a-z]{3,20}$/.test(tipo)) { w.push('tipo = ?'); p.push(tipo); }
  if (marca) { w.push('marca = ?'); p.push(t(marca, 120)); }
  const txt = t(q, 100).trim().toLowerCase();
  if (txt) { w.push("(lower(email) LIKE ? OR lower(nombre) LIKE ? OR lower(marca) LIKE ? OR lower(modelo) LIKE ? OR telefono LIKE ?)"); const l = '%' + txt.replace(/[%_]/g, '') + '%'; p.push(l, l, l, l, l); }
  const donde = w.length ? ' WHERE ' + w.join(' AND ') : '';
  const lim = Math.min(Math.max(parseInt(limite, 10) || 100, 1), 200), off = Math.max(parseInt(pagina, 10) || 0, 0) * lim;
  const [filas, total] = await Promise.all([
    env.DB.prepare(`SELECT ${COLS} FROM leads${donde} ORDER BY creado DESC LIMIT ? OFFSET ?`).bind(...p, lim, off).all(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM leads${donde}`).bind(...p).first(),
  ]);
  return { leads: filas.results || [], total: total ? total.n : 0 };
}
export async function leer(env, id) {
  await asegurarTablas(env);
  const l = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
  if (!l) return null;
  const notas = await env.DB.prepare('SELECT id, fecha, quien, texto FROM lead_notas WHERE lead_id = ? ORDER BY id DESC').bind(id).all();
  let categorias = []; try { categorias = JSON.parse(l.categorias || '[]'); } catch { /* vacío */ }
  return { ...l, categorias, notas: notas.results || [] };
}
export async function cambiarEtapa(env, id, etapa, quien) {
  if (!ETAPAS.includes(etapa)) return { error: 'Etapa no válida' };
  await asegurarTablas(env);
  const r = await env.DB.prepare('UPDATE leads SET etapa = ?, actualizado = ? WHERE id = ?').bind(etapa, new Date().toISOString(), id).run();
  if (!r.meta || !r.meta.changes) return { error: 'Ese lead no existe' };
  await anotar(env, quien, id, 'etapa', etapa);
  return { ok: true };
}
export async function agregarNota(env, id, texto, quien) {
  const tx = t(texto, 1000).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim();
  if (!tx) return { error: 'La nota está vacía' };
  await asegurarTablas(env);
  if (!(await env.DB.prepare('SELECT id FROM leads WHERE id = ?').bind(id).first())) return { error: 'Ese lead no existe' };
  await env.DB.prepare('INSERT INTO lead_notas (lead_id, fecha, quien, texto) VALUES (?, ?, ?, ?)').bind(id, new Date().toISOString(), t(quien, 160), tx).run();
  await anotar(env, quien, id, 'nota', '');
  return { ok: true };
}
export async function eliminar(env, id, quien) {  // derecho de supresión (Ley 21.719): borra el lead y sus notas; queda anotado quién y cuándo (sin datos personales)
  await asegurarTablas(env);
  const l = await env.DB.prepare('SELECT id FROM leads WHERE id = ?').bind(id).first();
  if (!l) return { error: 'Ese lead no existe' };
  await env.DB.batch([env.DB.prepare('DELETE FROM lead_notas WHERE lead_id = ?').bind(id), env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id)]);
  await anotar(env, quien, id, 'eliminar', '');
  return { ok: true };
}
async function anotar(env, quien, id, accion, valor) {
  try { await env.DB.prepare('INSERT INTO crm_acciones (fecha, quien, contacto, accion, valor) VALUES (?, ?, ?, ?, ?)').bind(new Date().toISOString(), t(quien, 160), 'lead:' + id, accion, t(valor, 120)).run(); } catch { /* no bloquea */ }
}
