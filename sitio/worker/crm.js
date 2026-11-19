/* OCEANIC · CRM dentro del administrador (/admin/#crm).
   Brevo sigue siendo la fuente de verdad: aquí no se guarda ninguna copia de los contactos. El Worker le habla a la API de
   Brevo con BREVO_API_KEY (secreto del Worker; la clave nunca llega al navegador) y entrega al administrador solo los campos
   necesarios. Lectura: listas, contactos y ficha. Escritura (solo estas tres órdenes): cambiar la etapa del lead, agregarlo a una
   lista o quitarlo de una. No envía campañas, no borra contactos y no toca nada más. Cada orden queda anotada en D1
   (tabla crm_acciones: quién, qué y cuándo). Los datos son personales (Ley 21.719): se leen en el momento y no se cachean. */

const BREVO = 'https://api.brevo.com/v3';
export const ETAPAS = ['Nuevo', 'Contactado', 'Cotizado', 'En negociación', 'Cerrado', 'Perdido'];
// campos de Brevo que se muestran (si el contacto no los tiene, no aparecen)
export const CAMPOS = ['NOMBRE', 'APELLIDOS', 'MARCA', 'MODELO', 'ORIGEN', 'CANAL', 'MOMENTUM', 'ETAPA', 'WHATSAPP', 'SMS', 'TELEFONO',
  'TIPO_FORMULARIO', 'LINEA_NEGOCIO', 'UNIVERSO'];
const EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[^\s@<>"']{2,24}$/;
const MAX_LEIDOS = 500;

const json = (o, status = 200) => ({ ...o, _status: status });
const falta = () => json({ ok: false, configurado: false, error: 'Falta el secreto BREVO_API_KEY en el Worker (el mismo que usan los formularios).' }, 503);

async function brevo(env, metodo, ruta, cuerpo) {
  const r = await fetch(BREVO + ruta, {
    method: metodo,
    headers: { 'api-key': env.BREVO_API_KEY, accept: 'application/json', ...(cuerpo ? { 'content-type': 'application/json' } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let datos = null;
  try { datos = await r.json(); } catch { /* 204 sin cuerpo */ }
  return { ok: r.ok, estado: r.status, datos };
}
function errorBrevo(r, que) {
  const msg = r.datos && r.datos.message ? String(r.datos.message).slice(0, 160) : 'HTTP ' + r.estado;
  const pista = r.estado === 401 ? ' La clave de Brevo no es válida o venció.' : r.estado === 403 ? ' La clave no tiene permiso o la IP no está autorizada en Brevo.' : r.estado === 429 ? ' Brevo pide esperar un momento.' : '';
  return json({ ok: false, error: `Brevo no permitió ${que} (${msg}).${pista}` }, 502);
}

/** Deja solo lo que el administrador necesita de un contacto de Brevo. */
export function resumirContacto(c) {
  const a = (c && c.attributes) || {};
  const atr = {};
  for (const k of CAMPOS) if (a[k] != null && String(a[k]).trim() !== '') atr[k] = String(a[k]).slice(0, 300);
  const nombre = [atr.NOMBRE, atr.APELLIDOS].filter(Boolean).join(' ');
  return {
    id: c.id, email: String(c.email || ''), nombre, atributos: atr,
    listas: Array.isArray(c.listIds) ? c.listIds.slice(0, 50) : [],
    creado: c.createdAt || null, modificado: c.modifiedAt || null, bloqueado: !!c.emailBlacklisted,
  };
}

export function validarAccion(e) {
  if (!e || typeof e !== 'object') return { error: 'Solicitud vacía' };
  const email = String(e.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) return { error: 'Correo no válido' };
  if (e.accion === 'etapa') {
    if (!ETAPAS.includes(e.valor)) return { error: 'Etapa no válida' };
    return { email, accion: 'etapa', valor: e.valor };
  }
  if (e.accion === 'lista-agregar' || e.accion === 'lista-quitar') {
    const id = Number(e.valor);
    if (!Number.isInteger(id) || id < 1 || id > 1e9) return { error: 'Lista no válida' };
    return { email, accion: e.accion, valor: id };
  }
  return { error: 'Acción no permitida' };
}

async function anotar(env, quien, a) {
  if (!env.DB) return;
  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS crm_acciones (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT NOT NULL, quien TEXT NOT NULL, contacto TEXT NOT NULL, accion TEXT NOT NULL, valor TEXT)').run();
    await env.DB.prepare('INSERT INTO crm_acciones (fecha, quien, contacto, accion, valor) VALUES (?, ?, ?, ?, ?)')
      .bind(new Date().toISOString(), String(quien || ''), a.email, a.accion, String(a.valor)).run();
  } catch { /* la anotación nunca debe impedir la orden */ }
}

/** Atiende /api/admin/crm/<ruta>. Devuelve { ...datos, _status }. */
export async function crm(env, ruta, metodo, url, cuerpo, quien) {
  if (!env.BREVO_API_KEY) return falta();

  if (ruta === 'crm/resumen' && metodo === 'GET') {
    const hace7 = new Date(Date.now() - 7 * 86400e3).toISOString();
    const [ls, tot, nue] = await Promise.all([
      brevo(env, 'GET', '/contacts/lists?limit=50&sort=desc'),
      brevo(env, 'GET', '/contacts?limit=1'),
      brevo(env, 'GET', '/contacts?limit=1&createdSince=' + encodeURIComponent(hace7)),
    ]);
    if (!ls.ok) return errorBrevo(ls, 'leer las listas');
    const listas = ((ls.datos && ls.datos.lists) || []).map((l) => ({ id: l.id, nombre: String(l.name || '').slice(0, 120), contactos: l.uniqueSubscribers || 0 }));
    return json({ ok: true, listas, total: tot.ok && tot.datos ? tot.datos.count || 0 : null, nuevos7: nue.ok && nue.datos ? nue.datos.count || 0 : null, etapas: ETAPAS });
  }

  if (ruta === 'crm/contactos' && metodo === 'GET') {
    const q = (url.searchParams.get('q') || '').trim().slice(0, 100).toLowerCase();
    const lista = Number(url.searchParams.get('lista') || 0);
    if (q && EMAIL.test(q)) {  // un correo exacto: se pide directo, sin recorrer los contactos
      const r = await brevo(env, 'GET', '/contacts/' + encodeURIComponent(q));
      if (r.estado === 404) return json({ ok: true, contactos: [], total: 0 });
      if (!r.ok) return errorBrevo(r, 'buscar el contacto');
      return json({ ok: true, contactos: [resumirContacto(r.datos)], total: 1 });
    }
    const ruta2 = `/contacts?limit=${MAX_LEIDOS}&sort=desc` + (Number.isInteger(lista) && lista > 0 ? '&listIds=' + lista : '');
    const r = await brevo(env, 'GET', ruta2);
    if (!r.ok) return errorBrevo(r, 'leer los contactos');
    let cs = ((r.datos && r.datos.contacts) || []).map(resumirContacto);
    const total = r.datos && r.datos.count != null ? r.datos.count : cs.length;
    if (q) cs = cs.filter((c) => (c.email + ' ' + c.nombre + ' ' + Object.values(c.atributos).join(' ')).toLowerCase().includes(q));
    return json({ ok: true, contactos: cs.slice(0, 200), total, mostrados: Math.min(cs.length, 200), limitado: total > MAX_LEIDOS });
  }

  if (ruta === 'crm/contacto' && metodo === 'GET') {
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    if (!EMAIL.test(email)) return json({ ok: false, error: 'Correo no válido' }, 400);
    const r = await brevo(env, 'GET', '/contacts/' + encodeURIComponent(email));
    if (r.estado === 404) return json({ ok: false, error: 'Ese contacto no existe en Brevo' }, 404);
    if (!r.ok) return errorBrevo(r, 'leer el contacto');
    return json({ ok: true, contacto: resumirContacto(r.datos) });
  }

  if (ruta === 'crm/accion' && metodo === 'POST') {
    const a = validarAccion(cuerpo);
    if (a.error) return json({ ok: false, error: a.error }, 400);
    let r;
    if (a.accion === 'etapa') r = await brevo(env, 'PUT', '/contacts/' + encodeURIComponent(a.email), { attributes: { ETAPA: a.valor } });
    else {
      const ls = await brevo(env, 'GET', '/contacts/lists?limit=50');  // solo listas que existen en la cuenta
      const ok = ls.ok && ls.datos && (ls.datos.lists || []).some((l) => l.id === a.valor);
      if (!ok) return json({ ok: false, error: 'Esa lista no existe en Brevo' }, 400);
      r = await brevo(env, 'POST', `/contacts/lists/${a.valor}/contacts/${a.accion === 'lista-agregar' ? 'add' : 'remove'}`, { emails: [a.email] });
    }
    if (!r.ok) return errorBrevo(r, 'aplicar el cambio');
    await anotar(env, quien, a);
    return json({ ok: true });
  }
  return json({ ok: false, error: 'No encontrado' }, 404);
}
