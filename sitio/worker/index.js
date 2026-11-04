/* OCEANIC · Worker del sitio (Cloudflare Workers + static assets).
   Atiende solo lo que no es estático; todo lo demás lo sirve Cloudflare directo desde los archivos del repo.

   - POST /api/formulario          formularios del sitio → Brevo (functions/api/formulario.js)
   - /admin/*, /api/admin/*        administrador (CMS) — protegido con Cloudflare Access (ver worker/acceso.js)
   - archivos de datos del sitio   si el CMS publicó una versión, se sirve desde D1; si no, el archivo del repo
   - /media/<clave>                imágenes y documentos subidos desde el CMS (KV)
   - /puerto-<mes>-<año>           301 a la página de la edición de Puerto (si existe)

   El repo es la base: con D1 vacío el sitio se ve igual que el repo. Lo que se publica desde el CMS se superpone. */
import { onRequestPost as formulario } from '../functions/api/formulario.js';
import { usuarioAdmin } from './acceso.js';
import { claveConfigurada, entrar, salir } from './clave.js';
import { DOCS, definicion, renderArchivo, claveDeRuta } from './documentos.js';
import { api } from './api.js';

const SEGURIDAD = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    try {
      if (p === '/api/formulario') {
        if (request.method !== 'POST') return texto('Método no permitido', 405, { Allow: 'POST' });
        return await formulario({ request, env });
      }
      if (p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/admin/')) return await admin(request, env, url, ctx);
      if (p.startsWith('/media/')) return await media(request, env, decodeURIComponent(p.slice(7)));
      if (/^\/puerto-[a-z0-9-]+\/?$/.test(p)) return await redireccionPuerto(request, env, url);
      const clave = claveDeRuta(p);
      if (clave && (request.method === 'GET' || request.method === 'HEAD')) return await datos(request, env, clave);
      return env.ASSETS.fetch(request);
    } catch (e) {
      console.error('worker', p, e && e.stack || e);
      return texto('Error interno', 500);
    }
  },
};

/* ---------- administrador ---------- */
async function admin(request, env, url, ctx) {
  if (url.pathname === '/admin/entrar') return entrar(request, env, url);
  if (url.pathname === '/admin/salir') return request.method === 'POST' ? salir(request, env, url) : texto('Método no permitido', 405);
  const email = await usuarioAdmin(request, env, ctx);
  if (!email) {
    const api_ = url.pathname.startsWith('/api/');
    if (claveConfigurada(env)) {  // ingreso con contraseña
      if (api_) return json({ ok: false, error: 'Tu sesión terminó. Vuelve a entrar.', sesion: false }, 401);
      return Response.redirect(url.origin + '/admin/entrar', 302);
    }
    const sinConfig = !(ctx && ctx.access) && (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD);
    const msg = sinConfig
      ? 'El administrador está cerrado: falta el secreto ADMIN_PASSWORD (o activar Cloudflare Access). Ver CÓMO-SUBIR-EL-SITIO.md.'
      : 'Acceso denegado. Entra con tu correo autorizado en Cloudflare Access.';
    if (api_) return json({ ok: false, error: msg }, 403);
    return texto(msg, 403);
  }
  if (url.pathname.startsWith('/api/admin/')) {
    const r = await api(request, env, url, email);
    r.headers.set('Cache-Control', 'no-store');
    return r;
  }
  if (url.pathname === '/admin') return Response.redirect(url.origin + '/admin/', 301);
  const r = await env.ASSETS.fetch(request);
  const h = new Headers(r.headers);
  h.set('Cache-Control', 'no-store');
  h.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(r.body, { status: r.status, headers: h });
}

/* ---------- archivos de datos (repo o publicado en D1) ---------- */
async function datos(request, env, clave) {
  const def = definicion(clave);
  if (!def || !env.DB) return env.ASSETS.fetch(request);
  const vista = await enVistaPrevia(request, env);
  const fila = await env.DB.prepare(
    'SELECT borrador, publicado, version, pub_version FROM documentos WHERE clave = ?').bind(clave).first();
  const contenido = fila && (vista ? fila.borrador : fila.publicado);
  if (contenido == null) return env.ASSETS.fetch(request);

  const etag = `"cms-${vista ? 'b' + fila.version : 'p' + fila.pub_version}"`;
  const h = { ...SEGURIDAD, 'Content-Type': def.json ? 'application/json; charset=utf-8' : 'text/javascript; charset=utf-8',
    'Cache-Control': vista ? 'private, no-store' : 'public, max-age=0, must-revalidate', ETag: etag };
  if (env.NOINDEX !== '0') h['X-Robots-Tag'] = 'noindex, nofollow';
  if (!vista && request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: h });
  let base = null;
  if (def.empalme) base = await (await env.ASSETS.fetch(new Request(new URL(def.archivo, request.url)))).text();
  const cuerpo = renderArchivo(def, contenido, base, vista ? 'borrador' : 'publicado v' + fila.pub_version);
  return new Response(request.method === 'HEAD' ? null : cuerpo, { headers: h });
}

/* Vista previa de borradores: cookie con un token de un solo uso por sesión, creado desde el admin (KV, 1 hora). */
async function enVistaPrevia(request, env) {
  const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)oceanic_vista=([a-f0-9]{32,64})/);
  if (!m || !env.MEDIA) return false;
  return (await env.MEDIA.get('vista:' + m[1])) !== null;
}

/* ---------- medios subidos desde el CMS ---------- */
async function media(request, env, clave) {
  if (!env.MEDIA || !/^[a-z0-9-]+\/[\w.-]+$/i.test(clave)) return texto('No encontrado', 404);
  const { value, metadata } = await env.MEDIA.getWithMetadata('m:' + clave, { type: 'stream' });
  if (!value) return texto('No encontrado', 404);
  const tipo = (metadata && metadata.tipo) || 'application/octet-stream';
  return new Response(value, { headers: { ...SEGURIDAD, 'Content-Type': tipo,
    // la clave lleva fecha y sufijo aleatorio: el archivo nunca cambia bajo la misma URL
    'Cache-Control': 'public, max-age=31536000, immutable',
    ...(tipo === 'application/pdf' ? {} : { 'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'" }) } });
}

/* ---------- /puerto-<mes>-<año>/ → página de la edición ---------- */
async function redireccionPuerto(request, env, url) {
  const slug = url.pathname.replace(/^\/|\/$/g, '');
  let ediciones = null;
  if (env.DB) {
    const f = await env.DB.prepare('SELECT publicado FROM documentos WHERE clave = ?').bind('puerto').first();
    if (f && f.publicado) ediciones = JSON.parse(f.publicado);
  }
  if (!ediciones) {
    const t = await (await env.ASSETS.fetch(new Request(new URL(DOCS.puerto.archivo, url)))).text();
    ediciones = DOCS.puerto.leer(t);
  }
  if (Array.isArray(ediciones) && ediciones.some((e) => e && e.slug === slug)) {
    return Response.redirect(url.origin + '/puerto/edicion/?ed=' + encodeURIComponent(slug), 301);
  }
  return env.ASSETS.fetch(request);
}

export function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { ...SEGURIDAD, 'Content-Type': 'application/json; charset=utf-8', ...extra } });
}
function texto(t, status = 200, extra = {}) {
  return new Response(t, { status, headers: { ...SEGURIDAD, 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex', ...extra } });
}
