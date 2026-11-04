/* OCEANIC · Acceso al administrador con Cloudflare Access. Cerrado por defecto.
   Forma 1 (la simple): Access activado en el Worker (botón "Enable Cloudflare Access"). Cloudflare entrega la
   identidad verificada en ctx.access; no hay nada que copiar. Forma 2: aplicación de Access por ruta, con
   ACCESS_TEAM_DOMAIN + ACCESS_AUD, y aquí se verifica el JWT.
   Cloudflare Access pide el correo (código de un solo uso) antes de dejar pasar a /admin/* y /api/admin/*, y agrega
   la cabecera Cf-Access-Jwt-Assertion. Aquí se verifica esa firma (RS256 con las llaves públicas del equipo), la
   audiencia (AUD de la aplicación), el emisor y la fecha. Opcional: ADMIN_EMAILS = lista blanca extra.
   Desarrollo local: ADMIN_LOCAL=<correo> solo funciona en localhost / 127.0.0.1. */

let llaves = null, llavesHasta = 0;

export async function usuarioAdmin(request, env, ctx) {
  const host = new URL(request.url).hostname;
  if (env.ADMIN_LOCAL && (host === 'localhost' || host === '127.0.0.1')) return env.ADMIN_LOCAL;
  if (ctx && ctx.access && typeof ctx.access.getIdentity === 'function') {  // lo pone la plataforma, no se puede falsificar
    let id = null;
    try { id = await ctx.access.getIdentity(); } catch (e) { id = null; }
    if (id && id.email) return enLista(String(id.email).toLowerCase(), env);
  }
  const equipo = (env.ACCESS_TEAM_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!equipo || !env.ACCESS_AUD) return null;
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) return null;
  const datos = await verificar(jwt, equipo, env.ACCESS_AUD);
  if (!datos || !datos.email) return null;
  return enLista(String(datos.email).toLowerCase(), env);
}

function enLista(email, env) {  // ADMIN_EMAILS (opcional): segunda barrera además de la política de Access
  const lista = (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return lista.length && !lista.includes(email) ? null : email;
}

export async function verificar(jwt, equipo, aud, ahora = Date.now() / 1000, obtener = fetch) {
  const partes = jwt.split('.');
  if (partes.length !== 3) return null;
  let cab, datos;
  try { cab = JSON.parse(b64texto(partes[0])); datos = JSON.parse(b64texto(partes[1])); } catch { return null; }
  if (cab.alg !== 'RS256' || !cab.kid) return null;
  const auds = Array.isArray(datos.aud) ? datos.aud : [datos.aud];
  if (!auds.includes(aud)) return null;
  if (datos.iss !== 'https://' + equipo) return null;
  if (typeof datos.exp !== 'number' || datos.exp < ahora) return null;
  if (typeof datos.nbf === 'number' && datos.nbf > ahora + 60) return null;

  const jwk = (await certificados(equipo, obtener, ahora)).find((k) => k.kid === cab.kid);
  if (!jwk) return null;
  const llave = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', llave, b64bytes(partes[2]),
    new TextEncoder().encode(partes[0] + '.' + partes[1]));
  return ok ? datos : null;
}

async function certificados(equipo, obtener, ahora) {
  if (llaves && ahora < llavesHasta) return llaves;
  const r = await obtener(`https://${equipo}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('No se pudieron leer las llaves de Access: ' + r.status);
  llaves = ((await r.json()).keys || []);
  llavesHasta = ahora + 3600;
  return llaves;
}

function b64bytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - s.length % 4) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function b64texto(s) { return new TextDecoder().decode(b64bytes(s)); }
