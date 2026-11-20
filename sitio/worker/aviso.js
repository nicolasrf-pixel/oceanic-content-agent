/* OCEANIC · Aviso semanal de «Revisar marcas».
   Los lunes el Worker lanza la revisión de las webs oficiales y, cuando termina, escribe un correo SOLO si hay
   novedades (modelos nuevos, cambios de dirección o modelos que ya no existen). El correo no cambia nada:
   lleva al administrador (/admin/#revision), donde una persona marca lo que corresponde y aprueba.
   Nada se carga ni se oculta sin esa aprobación.

   Horarios (UTC; Chile es UTC-3 en verano y UTC-4 en invierno), definidos en wrangler.jsonc › triggers:
     lunes 11:00  lanza la revisión
     lunes 12:00 y 14:00  si terminó bien y hay novedades que no se habían avisado, manda el correo (la segunda hora
                          es respaldo por si GitHub se demoró; una misma novedad nunca se avisa dos veces)
   Destinatario: variable AVISO_EMAIL; si falta, el primer correo de ADMIN_EMAILS; si falta, VENTAS_EMAIL. */
import { estadoRevision, iniciarRevision } from './revision.js';
import { enviarSMTP } from '../functions/api/smtp.js';

export const CRON_LANZAR = '0 11 * * 1';
const FRESCO_MS = 6 * 3600 * 1000;   // un informe de hace más de 6 horas no es el de esta semana

// texto que viene de webs externas: una línea, sin menciones, sin etiquetas ni saltos
const limpio = (v, n = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/@/g, '＠').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Lo accionable del informe: nuevos, movidos y retirados por marca, y una huella para no repetir el aviso. */
export function novedades(informe) {
  const marcas = (informe && Array.isArray(informe.marcas)) ? informe.marcas : [];
  const sal = { nuevos: [], movidos: [], retirados: [] };
  for (const m of marcas) {
    const marca = limpio(m.marca, 40);
    for (const x of m.nuevos || []) sal.nuevos.push({ marca, nombre: limpio(x.titulo || x.url, 100), url: limpio(x.url, 300) });
    for (const x of m.movidos || []) sal.movidos.push({ marca, nombre: limpio(x.slug || x.nombre || x.url, 100), url: limpio(x.destino || x.url, 300) });
    for (const x of m.retirados || []) sal.retirados.push({ marca, nombre: limpio(x.slug || x.nombre || x.url, 100), url: limpio(x.url, 300) });
  }
  const todos = [...sal.nuevos, ...sal.movidos, ...sal.retirados];
  sal.total = todos.length;
  sal.huella = ['n', 'm', 'r'].map((t, i) => [sal.nuevos, sal.movidos, sal.retirados][i].map((x) => t + ':' + x.marca + ':' + (x.url || x.nombre)).sort().join('|')).join('#');
  return sal;
}

export function armarCorreo(nov, origen) {
  const enlace = origen.replace(/\/$/, '') + '/admin/#revision';
  const bloque = (titulo, lista) => lista.length ? { t: titulo + ' (' + lista.length + ')\n' + lista.map((x) => '  · ' + x.marca + ': ' + x.nombre).join('\n'),
    h: '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(titulo) + ' (' + lista.length + ')</h3><ul style="margin:0;padding-left:20px">' +
       lista.map((x) => '<li>' + esc(x.marca) + ': ' + esc(x.nombre) + '</li>').join('') + '</ul>' } : null;
  const partes = [bloque('Modelos nuevos en las webs oficiales', nov.nuevos), bloque('Cambiaron de dirección', nov.movidos), bloque('Ya no existen', nov.retirados)].filter(Boolean);
  const subject = 'Oceanic · Revisión de marcas: ' + nov.total + (nov.total === 1 ? ' novedad' : ' novedades') + ' para aprobar';
  const text = 'La revisión semanal de las webs oficiales encontró novedades. No se cambió nada en el sitio: entra, revisa y aprueba lo que corresponda.\n\n' +
    partes.map((p) => p.t).join('\n\n') + '\n\nRevisar y aprobar: ' + enlace + '\n';
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#14212B;max-width:560px">' +
    '<h2 style="margin:0 0 8px;font-size:21px">Hay novedades en las marcas</h2>' +
    '<p style="margin:0 0 4px">La revisión semanal de las webs oficiales encontró cambios. <b>No se cambió nada en el sitio:</b> entra, revisa y aprueba lo que corresponda.</p>' +
    partes.map((p) => p.h).join('') +
    '<p style="margin:24px 0"><a href="' + esc(enlace) + '" style="background:#CB5C3C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:4px;font-weight:bold;display:inline-block">Revisar y aprobar</a></p>' +
    '<p style="color:#566570;font-size:13px;margin:0">Aviso automático de Oceanic · cada lunes, solo si hay novedades.</p></div>';
  return { subject, text, html, enlace };
}

export function destinatario(env) {
  const lista = [env.AVISO_EMAIL, String(env.ADMIN_EMAILS || '').split(',')[0], env.VENTAS_EMAIL].map((x) => String(x || '').trim()).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));
  return lista[0] || '';
}

async function huellaGuardada(env) {
  if (!env.DB) return null;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS avisos (clave TEXT PRIMARY KEY, valor TEXT, fecha TEXT)').run();
  const f = await env.DB.prepare('SELECT valor FROM avisos WHERE clave = ?').bind('revision').first();
  return f ? f.valor : null;
}
async function guardarHuella(env, valor, ahora) {
  if (!env.DB) return;
  await env.DB.prepare('INSERT INTO avisos (clave, valor, fecha) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, fecha = excluded.fecha')
    .bind('revision', valor, new Date(ahora).toISOString()).run();
}

/** Punto de entrada del cron. `cron` es la expresión que disparó el evento. Las dependencias se pueden reemplazar en pruebas. */
export async function avisoSemanal(env, cron, dep = {}) {
  const ahora = dep.ahora || Date.now();
  const estado = dep.estado || estadoRevision, iniciar = dep.iniciar || iniciarRevision, enviar = dep.enviar || ((c) => enviarSMTP(env, c));
  if (cron === CRON_LANZAR) {
    const r = await iniciar(env, {});
    return { accion: 'lanzar', ok: !!r.ok, enCurso: !!r.enCurso };
  }
  const e = await estado(env);
  if (!e.ok || !e.informe) return { accion: 'avisar', enviado: false, motivo: 'sin-informe' };
  const ej = e.ejecucion;
  if (!ej || ej.estado !== 'completed' || ej.conclusion !== 'success') return { accion: 'avisar', enviado: false, motivo: 'revision-no-terminada' };
  const gen = Date.parse(e.informe.generado || '');
  if (!gen || ahora - gen > FRESCO_MS) return { accion: 'avisar', enviado: false, motivo: 'informe-antiguo' };
  const nov = novedades(e.informe);
  if (!nov.total) return { accion: 'avisar', enviado: false, motivo: 'sin-novedades' };
  if ((await huellaGuardada(env).catch(() => null)) === nov.huella) return { accion: 'avisar', enviado: false, motivo: 'ya-avisado' };
  const para = destinatario(env);
  if (!para) return { accion: 'avisar', enviado: false, motivo: 'sin-destinatario' };
  const origen = env.SITIO_URL || 'https://oceanic.narf.workers.dev';
  const c = armarCorreo(nov, origen);
  const r = await enviar({ from: { email: env.REMITENTE_EMAIL, name: env.REMITENTE_NOMBRE || 'Oceanic' }, to: [{ email: para }], subject: c.subject, text: c.text, html: c.html });
  if (!r || !r.ok) return { accion: 'avisar', enviado: false, motivo: 'correo-fallo' };
  await guardarHuella(env, nov.huella, ahora).catch(() => {});
  return { accion: 'avisar', enviado: true, total: nov.total };
}
