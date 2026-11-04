/* OCEANIC · Ingreso al administrador con contraseña (cuando no se usa Cloudflare Access).
   - La contraseña es el secreto ADMIN_PASSWORD del Worker (Settings › Variables and Secrets › Secret). Nunca va al repo.
   - Al entrar se pide también el nombre de quien edita: queda como autor en el historial.
   - Sesión: token aleatorio en una cookie HttpOnly, Secure, SameSite=Strict; el token vive en KV 8 horas.
   - Bloqueo: 5 intentos fallidos por IP → 15 minutos sin poder intentar. */

const SESION_S = 8 * 3600;
const MAX_FALLOS = 5;
const BLOQUEO_S = 15 * 60;
const COOKIE = 'oceanic_admin';

export const claveConfigurada = (env) => !!(env.ADMIN_PASSWORD && env.MEDIA);

export async function usuarioPorSesion(request, env) {
  if (!claveConfigurada(env)) return null;
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([a-f0-9]{64})'));
  if (!m) return null;
  const quien = await env.MEDIA.get('sesion:' + m[1]);
  return quien || null;
}

/* GET muestra el formulario; POST valida. Devuelve una Response. */
export async function entrar(request, env, url) {
  if (!claveConfigurada(env)) return pagina('El ingreso con contraseña no está activado: falta el secreto ADMIN_PASSWORD en el Worker.', null, 503);
  if (request.method !== 'POST') return pagina(null);
  const origen = request.headers.get('Origin');
  if (origen && origen !== url.origin) return pagina('Solicitud no válida.', null, 403);

  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const kFallos = 'fallos:' + ip;
  const fallos = parseInt(await env.MEDIA.get(kFallos) || '0', 10);
  if (fallos >= MAX_FALLOS) return pagina('Demasiados intentos. Espera 15 minutos y vuelve a probar.', null, 429);

  const fd = await request.formData();
  const nombre = String(fd.get('nombre') || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60);
  const clave = String(fd.get('clave') || '');
  if (!nombre) return pagina('Escribe tu nombre: queda registrado en el historial de cambios.', null, 400);

  if (!(await iguales(clave, env.ADMIN_PASSWORD))) {
    await env.MEDIA.put(kFallos, String(fallos + 1), { expirationTtl: BLOQUEO_S });
    const quedan = MAX_FALLOS - fallos - 1;
    return pagina('Contraseña incorrecta.' + (quedan > 0 ? ` Te quedan ${quedan} intento(s).` : ' Espera 15 minutos.'), nombre, 401);
  }
  await env.MEDIA.delete(kFallos);
  const token = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
  await env.MEDIA.put('sesion:' + token, nombre, { expirationTtl: SESION_S });
  return new Response(null, { status: 303, headers: {
    Location: url.origin + '/admin/',
    'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${SESION_S}; HttpOnly; Secure; SameSite=Strict`,
    'Cache-Control': 'no-store' } });
}

export async function salir(request, env, url) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([a-f0-9]{64})'));
  if (m && env.MEDIA) await env.MEDIA.delete('sesion:' + m[1]);
  return new Response(null, { status: 303, headers: {
    Location: url.origin + '/admin/entrar',
    'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`, 'Cache-Control': 'no-store' } });
}

/* Comparación en tiempo constante (sobre los SHA-256 de ambos textos). */
async function iguales(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(String(a))), crypto.subtle.digest('SHA-256', enc.encode(String(b)))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let d = 0; for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0 && String(a).length > 0;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pagina(error, nombre, status = 200) {
  const html = `<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Entrar · Administrador Oceanic</title>
<style>
:root{--noche:#14212B;--boya:#CB5C3C;--err:#B42318}*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F5F2;color:var(--noche);font:16px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;padding:16px}
form{background:#fff;border:1px solid rgba(20,33,43,.14);padding:32px;width:100%;max-width:380px}
h1{font-size:24px;margin:0 0 4px;letter-spacing:-.02em}p{margin:0 0 20px;color:#243A49;font-size:14px}
label{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#243A49;margin:14px 0 4px}
input{width:100%;padding:10px 12px;border:1px solid rgba(20,33,43,.3);font:inherit;border-radius:2px}
input:focus{outline:0;border-color:var(--boya);box-shadow:0 0 0 2px rgba(203,92,60,.15)}
button{margin-top:22px;width:100%;padding:12px;background:var(--noche);color:#fff;border:0;font:inherit;font-weight:600;cursor:pointer;border-radius:2px}
.err{background:#FEF3F2;border:1px solid var(--err);color:var(--err);padding:10px 12px;font-size:14px;margin:0 0 6px}
</style></head><body>
<form method="post" action="/admin/entrar">
<h1>Oceanic</h1><p>Administrador del sitio</p>
${error ? `<div class="err" role="alert">${esc(error)}</div>` : ''}
<label for="n">Tu nombre</label><input id="n" name="nombre" required autocomplete="name" value="${esc(nombre || '')}" ${nombre ? '' : 'autofocus'}>
<label for="c">Contraseña</label><input id="c" name="clave" type="password" required autocomplete="current-password" ${nombre ? 'autofocus' : ''}>
<button type="submit">Entrar</button>
</form></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'" } });
}
