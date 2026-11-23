/* OCEANIC · Respaldos en Cloudflare R2 (bucket privado `oceanic-respaldos`, binding RESPALDOS).
   Copia, sin tocar nada del sitio:
     - la base D1 completa (documentos del administrador con su historial, medios, leads, notas y acciones del CRM, avisos) en un solo archivo
       comprimido por día: d1/AAAA-MM-DD.json.gz;
     - los archivos subidos desde el administrador (KV `oceanic-imagenes`, binding MEDIA) a kv/<clave>: solo se copia lo que falta o cambió de tamaño;
     - ultimo.json con el resumen del último respaldo (lo muestra el administrador, sección Respaldos).
   Se corre solo cada día (cron 06:00 UTC, 03:00 en Chile), o con el botón «Respaldar ahora»; y también al abrir el administrador si el último
   respaldo tiene más de 24 horas. Orden de las copias de la base: se guardan 30 días seguidos y la del día 1 de cada mes durante 12 meses.
   Los respaldos incluyen datos personales (leads): el bucket es privado y solo se baja desde el administrador. Cómo restaurar: docs/RESPALDOS.md. */

const PAGINA = 500;
export const CRON_RESPALDO = '0 6 * * *';
const DIA_MS = 86400000;

const hoyISO = (ahora) => new Date(ahora).toISOString().slice(0, 10);

async function gzip(texto) {
  const flujo = new Blob([texto]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Response(flujo).arrayBuffer();
}

/** Todas las tablas de D1 (nombre → filas). Las páginas de 500 filas evitan respuestas enormes. */
export async function exportarD1(DB) {
  const { results: tablas } = await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all();
  const salida = {};
  let filas = 0;
  for (const { name } of tablas) {
    if (!/^[A-Za-z0-9_]+$/.test(name)) continue;
    const todas = [];
    for (let off = 0; ; off += PAGINA) {
      const { results } = await DB.prepare(`SELECT * FROM "${name}" LIMIT ${PAGINA} OFFSET ${off}`).all();
      todas.push(...results);
      if (results.length < PAGINA) break;
    }
    salida[name] = todas;
    filas += todas.length;
  }
  return { tablas: salida, filas };
}

/** Copia a R2 los archivos de KV que faltan o cambiaron de tamaño. */
export async function copiarMedios(MEDIA, R2) {
  let copiados = 0, omitidos = 0, bytes = 0, cursor;
  do {
    const lote = await MEDIA.list({ cursor, limit: 500 });
    for (const k of lote.keys) {
      const { value, metadata } = await MEDIA.getWithMetadata(k.name, 'arrayBuffer');
      if (!value) continue;
      const previo = await R2.head('kv/' + k.name);
      if (previo && previo.size === value.byteLength) { omitidos++; continue; }
      await R2.put('kv/' + k.name, value, { customMetadata: { tipo: String((metadata && (metadata.tipo || metadata.type)) || ''), clave: k.name } });
      copiados++; bytes += value.byteLength;
    }
    cursor = lote.list_complete ? undefined : lote.cursor;
  } while (cursor);
  return { copiados, omitidos, bytes };
}

/** Qué copias de la base se conservan: las de los últimos 30 días y la del día 1 de cada mes de los últimos 12 meses. */
export function aBorrar(nombres, ahora) {
  const limite30 = ahora - 30 * DIA_MS, limite12m = ahora - 366 * DIA_MS;
  return nombres.filter((n) => {
    const m = /^d1\/(\d{4}-\d{2}-\d{2})\.json\.gz$/.exec(n);
    if (!m) return false;
    const t = Date.parse(m[1] + 'T00:00:00Z');
    if (t >= limite30) return false;
    return !(m[1].endsWith('-01') && t >= limite12m);
  });
}

export async function hacerRespaldo(env, motivo = 'manual', ahora = Date.now()) {
  if (!env.RESPALDOS) return { ok: false, error: 'Falta el almacenamiento R2 (binding RESPALDOS). Ver docs/RESPALDOS.md.' };
  if (!env.DB) return { ok: false, error: 'Falta la base D1 (binding DB)' };
  const inicio = Date.now();
  const R2 = env.RESPALDOS;
  const resumen = { ok: true, motivo, fecha: new Date(ahora).toISOString() };
  try {
    await R2.put('estado.json', JSON.stringify({ ok: true, enCurso: true, desde: resumen.fecha, motivo }));
    const d1 = await exportarD1(env.DB);
    const cuerpo = await gzip(JSON.stringify({ generado: resumen.fecha, motivo, tablas: d1.tablas }));
    const clave = `d1/${hoyISO(ahora)}.json.gz`;
    await R2.put(clave, cuerpo, { httpMetadata: { contentType: 'application/gzip' }, customMetadata: { motivo, filas: String(d1.filas) } });
    resumen.d1 = { archivo: clave, bytes: cuerpo.byteLength, tablas: Object.fromEntries(Object.entries(d1.tablas).map(([k, v]) => [k, v.length])), filas: d1.filas };
    resumen.medios = env.MEDIA ? await copiarMedios(env.MEDIA, R2) : { copiados: 0, omitidos: 0, bytes: 0, nota: 'sin KV' };
    // limpieza de copias antiguas de la base
    const viejas = [];
    for (let cursor; ;) {
      const lote = await R2.list({ prefix: 'd1/', cursor });
      viejas.push(...aBorrar(lote.objects.map((o) => o.key), ahora));
      if (!lote.truncated) break;
      cursor = lote.cursor;
    }
    if (viejas.length) await R2.delete(viejas);
    resumen.borradas = viejas.length;
    resumen.segundos = Math.round((Date.now() - inicio) / 100) / 10;
    await R2.put('ultimo.json', JSON.stringify(resumen), { httpMetadata: { contentType: 'application/json' } });
    await R2.put('estado.json', JSON.stringify({ ok: true, enCurso: false }));
    return resumen;
  } catch (e) {
    const fallo = { ok: false, fecha: resumen.fecha, motivo, error: String((e && e.message) || e).slice(0, 300) };
    try { await R2.put('estado.json', JSON.stringify({ ok: false, enCurso: false, error: fallo.error, fecha: fallo.fecha })); } catch { /* sin R2 */ }
    return fallo;
  }
}

/** Estado para el administrador: último respaldo, si hay uno en curso y las copias de la base disponibles. */
export async function estadoRespaldo(env) {
  if (!env.RESPALDOS) return { ok: true, configurado: false };
  const leer = async (k) => { const o = await env.RESPALDOS.get(k); return o ? JSON.parse(await o.text()) : null; };
  const [ultimo, estado] = await Promise.all([leer('ultimo.json').catch(() => null), leer('estado.json').catch(() => null)]);
  const lote = await env.RESPALDOS.list({ prefix: 'd1/', limit: 400 });
  const copias = lote.objects.map((o) => ({ clave: o.key, bytes: o.size, fecha: o.uploaded })).sort((a, b) => (a.clave < b.clave ? 1 : -1));
  return { ok: true, configurado: true, ultimo, estado, copias };
}

/** ¿Hace falta un respaldo? (sin respaldo o con más de 24 horas) — se usa al abrir el administrador. */
export async function haceFalta(env, ahora = Date.now()) {
  if (!env.RESPALDOS) return false;
  const e = await estadoRespaldo(env);
  if (e.estado && e.estado.enCurso && e.estado.desde && ahora - Date.parse(e.estado.desde) < 15 * 60000) return false;
  return !e.ultimo || ahora - Date.parse(e.ultimo.fecha) > DIA_MS;
}
