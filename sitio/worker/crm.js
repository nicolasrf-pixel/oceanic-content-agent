/* OCEANIC · CRM propio dentro del administrador (/admin/#crm).
   Los leads se guardan en D1 (functions/api/leads.js) desde el lanzamiento (2026-12-01 00:00, hora de Chile) y, además, siguen
   llegando a Brevo como hasta ahora: cada lead queda en AMBOS lados. Este CRM NO lee los contactos antiguos de Brevo.
   Órdenes que acepta: cambiar la etapa del lead (y avisarle a Brevo, mejor esfuerzo, atributo ETAPA), agregar una nota y eliminar
   un lead (derecho de supresión, Ley 21.719). Cada orden queda anotada en crm_acciones (quién, qué y cuándo). */
import { ETAPAS, resumen, listar, leer, cambiarEtapa, agregarNota, eliminar } from '../functions/api/leads.js';

export { ETAPAS };
const BREVO = 'https://api.brevo.com/v3';
const EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[^\s@<>"']{2,24}$/;
const json = (o, status = 200) => ({ ...o, _status: status });
const idDe = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 1e12 ? n : 0; };

/** Cambia ETAPA en el contacto de Brevo (si existe). Nunca falla la orden: devuelve el estado para mostrarlo. */
export async function avisarABrevo(env, email, etapa) {
  if (!env.BREVO_API_KEY) return 'sin-clave';
  if (!EMAIL.test(email || '')) return 'sin-contacto';
  try {
    const r = await fetch(BREVO + '/contacts/' + encodeURIComponent(email), {
      method: 'PUT', headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ attributes: { ETAPA: etapa } }),
    });
    return r.ok ? 'ok' : r.status === 404 ? 'sin-contacto' : 'error';
  } catch { return 'error'; }
}

/** Atiende /api/admin/crm/<ruta>. Devuelve { ...datos, _status }. */
export async function crm(env, ruta, metodo, url, cuerpo, quien) {
  if (!env.DB) return json({ ok: false, error: 'Falta la base D1 (binding DB)' }, 503);
  try {
    if (ruta === 'crm/resumen' && metodo === 'GET') return json({ ok: true, ...(await resumen(env)), etapas: ETAPAS });

    if (ruta === 'crm/leads' && metodo === 'GET') {
      const p = url.searchParams;
      return json({ ok: true, ...(await listar(env, { q: p.get('q') || '', etapa: p.get('etapa') || '', tipo: p.get('tipo') || '', marca: p.get('marca') || '', pagina: p.get('pagina') || 0 })) });
    }

    if (ruta === 'crm/lead' && metodo === 'GET') {
      const id = idDe(url.searchParams.get('id'));
      const l = id && (await leer(env, id));
      return l ? json({ ok: true, lead: l }) : json({ ok: false, error: 'Ese lead no existe' }, 404);
    }

    if (ruta === 'crm/accion' && metodo === 'POST') {
      const e = cuerpo && typeof cuerpo === 'object' ? cuerpo : {};
      const id = idDe(e.id);
      if (!id) return json({ ok: false, error: 'Lead no válido' }, 400);
      if (e.accion === 'etapa') {
        const r = await cambiarEtapa(env, id, e.valor, quien);
        if (r.error) return json({ ok: false, error: r.error }, 400);
        const l = await leer(env, id);
        return json({ ok: true, brevo: await avisarABrevo(env, l && l.email, e.valor) });
      }
      if (e.accion === 'nota') {
        const r = await agregarNota(env, id, e.valor, quien);
        return r.error ? json({ ok: false, error: r.error }, 400) : json({ ok: true });
      }
      if (e.accion === 'eliminar') {
        const r = await eliminar(env, id, quien);
        return r.error ? json({ ok: false, error: r.error }, 404) : json({ ok: true });
      }
      return json({ ok: false, error: 'Acción no permitida' }, 400);
    }
    return json({ ok: false, error: 'No encontrado' }, 404);
  } catch (err) {
    console.log('crm: error (' + String(err && err.message).slice(0, 100) + ')');
    return json({ ok: false, error: 'No se pudo leer el CRM. Intenta de nuevo.' }, 500);
  }
}
