/* OCEANIC · API del administrador (/api/admin/*). Solo llega aquí quien pasó Cloudflare Access (index.js).
   Cada guardado es atómico (un batch de D1 = una transacción) y con control de versión: si otra persona guardó
   antes, responde 409 y no pisa su trabajo. Publicar copia el borrador validado a "publicado" en una sola operación. */
import { DOCS, definicion, validar } from './documentos.js';

const MAX_DOC = 1_800_000;          // D1: 2 MB por fila
const MAX_MEDIO = 20 * 1024 * 1024; // KV: 25 MB por valor
const TIPOS_MEDIO = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif', 'image/gif': 'gif', 'application/pdf': 'pdf' };
const CARPETAS = ['usados', 'puerto', 'modelos', 'marcas', 'documentos', 'otros'];

export async function api(request, env, url, email) {
  const ruta = url.pathname.slice('/api/admin/'.length).replace(/\/$/, '');
  const m = request.method;
  if (m !== 'GET' && m !== 'HEAD') {
    // Anti-CSRF: el admin manda esta cabecera; un formulario de otro sitio no puede.
    if (request.headers.get('X-CMS') !== '1') return json({ ok: false, error: 'Solicitud no válida' }, 400);
    const origen = request.headers.get('Origin');
    if (origen && origen !== url.origin) return json({ ok: false, error: 'Origen no permitido' }, 403);
  }
  if (!env.DB) return json({ ok: false, error: 'Falta la base D1 (binding DB)' }, 503);
  const ahora = new Date().toISOString();

  try {
    if (ruta === 'estado' && m === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT clave, version, pub_version, actualizado, autor, publicado_en, publicado_por, publicado IS NULL AS sin_publicar FROM documentos ORDER BY actualizado DESC').all();
      return json({ ok: true, email, docs: results.map((r) => ({ ...r, pendiente: r.sin_publicar === 1 || r.version !== r.pub_version })),
        tipos: Object.fromEntries(Object.entries(DOCS).map(([k, d]) => [k, d.titulo])) });
    }

    if (ruta === 'doc' && m === 'GET') {
      const clave = url.searchParams.get('clave') || '';
      const def = definicion(clave);
      if (!def) return json({ ok: false, error: 'Documento desconocido' }, 404);
      const f = await env.DB.prepare('SELECT * FROM documentos WHERE clave = ?').bind(clave).first();
      if (f) return json({ ok: true, clave, titulo: def.titulo, contenido: JSON.parse(f.borrador), version: f.version,
        pub_version: f.pub_version, publicado: f.publicado != null, pendiente: f.publicado == null || f.version !== f.pub_version,
        actualizado: f.actualizado, autor: f.autor, publicado_en: f.publicado_en, publicado_por: f.publicado_por, origen: 'cms' });
      return json({ ok: true, clave, titulo: def.titulo, contenido: await base(env, url, def), version: 0, publicado: false,
        pendiente: false, origen: 'repo' });
    }

    if (ruta === 'doc' && m === 'PUT') {
      const { clave, version, contenido } = await request.json();
      return await guardar(env, url, clave, version, contenido, email, ahora, 'guardar');
    }

    if (ruta === 'publicar' && m === 'POST') {
      const { clave, version } = await request.json();
      const f = await env.DB.prepare('SELECT borrador, version FROM documentos WHERE clave = ?').bind(clave).first();
      if (!f) return json({ ok: false, error: 'Guarda el borrador antes de publicar' }, 400);
      if (f.version !== version) return json({ ok: false, error: 'Otra persona guardó cambios. Recarga antes de publicar.', conflicto: true }, 409);
      const v = validar(clave, JSON.parse(f.borrador), await patrones(env));
      if (v.errores.length) return json({ ok: false, error: 'El borrador no pasa la validación', ...v }, 422);
      const r = await env.DB.batch([
        env.DB.prepare('UPDATE documentos SET publicado = borrador, pub_version = version, publicado_en = ?, publicado_por = ? WHERE clave = ? AND version = ?')
          .bind(ahora, email, clave, version),
        env.DB.prepare("INSERT INTO historial (clave, version, accion, contenido, autor, fecha) SELECT clave, version, 'publicar', borrador, ?, ? FROM documentos WHERE clave = ? AND pub_version = ? AND publicado_en = ?")
          .bind(email, ahora, clave, version, ahora),
      ]);
      if (!r[0].meta.changes) return json({ ok: false, error: 'Otra persona guardó cambios. Recarga.', conflicto: true }, 409);
      return json({ ok: true, version, publicado_en: ahora, avisos: v.avisos });
    }

    if (ruta === 'descartar' && m === 'POST') {  // vuelve el borrador a lo publicado (o al repo si nunca se publicó)
      const { clave, version } = await request.json();
      const f = await env.DB.prepare('SELECT publicado, version FROM documentos WHERE clave = ?').bind(clave).first();
      if (!f) return json({ ok: true });
      if (f.version !== version) return json({ ok: false, error: 'Otra persona guardó cambios. Recarga.', conflicto: true }, 409);
      if (f.publicado == null) {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM documentos WHERE clave = ? AND version = ?').bind(clave, version),
          env.DB.prepare("INSERT INTO historial (clave, version, accion, contenido, autor, fecha) VALUES (?, ?, 'descartar', '{}', ?, ?)").bind(clave, version, email, ahora),
        ]);
        return json({ ok: true, version: 0 });
      }
      const r = await env.DB.prepare('UPDATE documentos SET borrador = publicado, version = version + 1, pub_version = version + 1, actualizado = ?, autor = ? WHERE clave = ? AND version = ?')
        .bind(ahora, email, clave, version).run();
      if (!r.meta.changes) return json({ ok: false, error: 'Otra persona guardó cambios. Recarga.', conflicto: true }, 409);
      return json({ ok: true, version: version + 1 });
    }

    if (ruta === 'volver-al-repo' && m === 'POST') {  // el sitio deja de usar lo publicado en el CMS para este documento
      const { clave, version } = await request.json();
      const f = await env.DB.prepare('SELECT borrador, publicado FROM documentos WHERE clave = ?').bind(clave).first();
      if (!f) return json({ ok: true });
      const r = await env.DB.batch([
        env.DB.prepare('DELETE FROM documentos WHERE clave = ? AND version = ?').bind(clave, version),
        env.DB.prepare("INSERT INTO historial (clave, version, accion, contenido, autor, fecha) VALUES (?, ?, 'volver-al-repo', ?, ?, ?)").bind(clave, version, f.borrador, email, ahora),
      ]);
      if (!r[0].meta.changes) return json({ ok: false, error: 'Otra persona guardó cambios. Recarga.', conflicto: true }, 409);
      return json({ ok: true, version: 0 });
    }

    if (ruta === 'historial' && m === 'GET') {
      const clave = url.searchParams.get('clave') || '';
      const { results } = await env.DB.prepare('SELECT id, version, accion, autor, fecha, length(contenido) AS bytes FROM historial WHERE clave = ? ORDER BY id DESC LIMIT 100').bind(clave).all();
      return json({ ok: true, historial: results });
    }

    if (ruta === 'restaurar' && m === 'POST') {  // trae una versión del historial como nuevo borrador
      const { clave, id, version } = await request.json();
      const h = await env.DB.prepare('SELECT contenido FROM historial WHERE id = ? AND clave = ?').bind(id, clave).first();
      if (!h || h.contenido === '{}') return json({ ok: false, error: 'Versión no encontrada' }, 404);
      return await guardar(env, url, clave, version, JSON.parse(h.contenido), email, ahora, 'restaurar');
    }

    if (ruta === 'medios' && m === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM medios ORDER BY subido DESC LIMIT 500').all();
      return json({ ok: true, medios: results.map((r) => ({ ...r, url: '/media/' + r.clave })) });
    }

    if (ruta === 'medios' && m === 'POST') {
      if (!env.MEDIA) return json({ ok: false, error: 'Falta el almacén KV (binding MEDIA)' }, 503);
      const fd = await request.formData();
      const archivo = fd.get('archivo');
      const carpeta = CARPETAS.includes(fd.get('carpeta')) ? fd.get('carpeta') : 'otros';
      if (!archivo || typeof archivo === 'string') return json({ ok: false, error: 'Falta el archivo' }, 400);
      const ext = TIPOS_MEDIO[archivo.type];
      if (!ext) return json({ ok: false, error: 'Formato no permitido (WebP, JPG, PNG, AVIF, GIF o PDF)' }, 415);
      if (archivo.size > MAX_MEDIO) return json({ ok: false, error: 'Máximo 20 MB por archivo' }, 413);
      const datos = await archivo.arrayBuffer();
      if (!firmaValida(new Uint8Array(datos.slice(0, 16)), ext)) return json({ ok: false, error: 'El archivo no coincide con su formato' }, 415);
      const nombre = String(archivo.name || 'archivo').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'archivo';
      const azar = [...crypto.getRandomValues(new Uint8Array(3))].map((b) => b.toString(16).padStart(2, '0')).join('');
      const clave = `${carpeta}/${ahora.slice(0, 10).replace(/-/g, '')}-${azar}-${nombre}.${ext}`;
      const ancho = parseInt(fd.get('ancho'), 10) || null, alto = parseInt(fd.get('alto'), 10) || null;
      await env.MEDIA.put('m:' + clave, datos, { metadata: { tipo: archivo.type } });
      await env.DB.prepare('INSERT INTO medios (clave, nombre, tipo, bytes, ancho, alto, subido, autor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(clave, String(archivo.name || '').slice(0, 200), archivo.type, datos.byteLength, ancho, alto, ahora, email).run();
      return json({ ok: true, clave, url: '/media/' + clave });
    }

    if (ruta === 'medios' && m === 'DELETE') {
      const clave = url.searchParams.get('clave') || '';
      if (!/^[a-z0-9-]+\/[\w.-]+$/i.test(clave)) return json({ ok: false, error: 'Clave inválida' }, 400);
      await env.MEDIA.delete('m:' + clave);
      await env.DB.prepare('DELETE FROM medios WHERE clave = ?').bind(clave).run();
      return json({ ok: true });
    }

    if (ruta === 'vista' && m === 'POST') {  // vista previa de borradores en el sitio, 1 hora, solo en este navegador
      if (!env.MEDIA) return json({ ok: false, error: 'Falta el almacén KV (binding MEDIA)' }, 503);
      const token = [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, '0')).join('');
      await env.MEDIA.put('vista:' + token, email, { expirationTtl: 3600 });
      return json({ ok: true }, 200, { 'Set-Cookie': `oceanic_vista=${token}; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Lax` });
    }
    if (ruta === 'vista/salir' && m === 'POST') {
      return json({ ok: true }, 200, { 'Set-Cookie': 'oceanic_vista=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax' });
    }

    if (ruta === 'validar' && m === 'POST') {  // validación sin guardar (el editor la usa mientras escribes)
      const { clave, contenido } = await request.json();
      return json({ ok: true, ...validar(clave, contenido, await patrones(env)) });
    }

    return json({ ok: false, error: 'Ruta desconocida' }, 404);
  } catch (e) {
    console.error('api', ruta, e && e.stack || e);
    return json({ ok: false, error: 'Error del servidor: ' + (e && e.message || e) }, 500);
  }
}

async function guardar(env, url, clave, version, contenido, email, ahora, accion) {
  const def = definicion(clave);
  if (!def) return json({ ok: false, error: 'Documento desconocido' }, 404);
  if (!Number.isInteger(version) || version < 0) return json({ ok: false, error: 'Falta la versión' }, 400);
  const v = validar(clave, contenido, clave === 'patrones' ? [] : await patrones(env));
  if (v.errores.length) return json({ ok: false, error: 'Hay errores: corrígelos antes de guardar', ...v }, 422);
  const texto = JSON.stringify(contenido);
  if (texto.length > MAX_DOC) return json({ ok: false, error: 'Documento demasiado grande' }, 413);
  const nueva = version + 1;
  const escribir = version === 0
    ? env.DB.prepare('INSERT INTO documentos (clave, borrador, version, actualizado, autor) VALUES (?, ?, 1, ?, ?) ON CONFLICT(clave) DO NOTHING')
      .bind(clave, texto, ahora, email)
    : env.DB.prepare('UPDATE documentos SET borrador = ?, version = ?, actualizado = ?, autor = ? WHERE clave = ? AND version = ?')
      .bind(texto, nueva, ahora, email, clave, version);
  const r = await env.DB.batch([
    escribir,
    env.DB.prepare('INSERT INTO historial (clave, version, accion, contenido, autor, fecha) SELECT clave, version, ?, borrador, ?, ? FROM documentos WHERE clave = ? AND version = ? AND actualizado = ?')
      .bind(accion, email, ahora, clave, nueva, ahora),
  ]);
  if (!r[0].meta.changes) return json({ ok: false, error: 'Otra persona guardó cambios mientras editabas. Recarga para ver su versión.', conflicto: true }, 409);
  return json({ ok: true, version: nueva, avisos: v.avisos });
}

async function base(env, url, def) {
  if (def.soloCms) return def.base;
  const r = await env.ASSETS.fetch(new Request(new URL(def.archivo, url)));
  if (!r.ok) throw new Error('No se encontró ' + def.archivo);
  return def.leer(await r.text());
}

async function patrones(env) {
  const f = await env.DB.prepare('SELECT publicado, borrador FROM documentos WHERE clave = ?').bind('patrones').first();
  return f ? JSON.parse(f.publicado || f.borrador) : [];
}

function firmaValida(b, ext) {
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  const txt = String.fromCharCode(...b);
  return { webp: txt.startsWith('RIFF') && txt.slice(8, 12) === 'WEBP', jpg: hex.startsWith('ffd8ff'), png: hex.startsWith('89504e47'),
    gif: txt.startsWith('GIF8'), pdf: txt.startsWith('%PDF'), avif: txt.slice(4, 8) === 'ftyp' }[ext] === true;
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...extra } });
}
