/* OCEANIC · Revisión de marcas desde el administrador.
   El Worker no corre Python ni lee las webs de los fabricantes: lanza el flujo «Revisar marcas» de GitHub Actions
   (.github/workflows/revisar-marcas.yml), que deja un informe en la rama revision-informes, y aquí se lee ese informe.
   Al aprobar, se abre un pull request con lo aprobado (nada se publica solo). Lo que se oculta del sitio se aplica
   desde el administrador con el mecanismo de publicación de siempre (documento «publicacion», con historial).

   Secreto del Worker:   GH_TOKEN  (token de GitHub de acceso fino, solo para este repositorio:
                         Actions: lectura y escritura · Contents: lectura y escritura · Pull requests: lectura y escritura)
   Variables opcionales: GH_REPO (por defecto nicolasrf-pixel/oceanic-content-agent), GH_BASE (rama del sitio: sitio-web),
                         GH_FLUJO_RAMA (rama donde vive el archivo del flujo: main). */

const FLUJO = 'revisar-marcas.yml';
const RAMA_INFORME = 'revision-informes';
const MAX_ITEMS = 200;

const repo = (env) => env.GH_REPO || 'nicolasrf-pixel/oceanic-content-agent';
const base = (env) => env.GH_BASE || 'sitio-web';

async function gh(env, ruta, { metodo = 'GET', cuerpo } = {}) {
  const r = await fetch('https://api.github.com' + ruta, {
    method: metodo,
    headers: {
      Authorization: 'Bearer ' + env.GH_TOKEN,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'oceanic-admin',
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let datos = null;
  try { datos = await r.json(); } catch { /* 204 sin cuerpo */ }
  return { ok: r.ok, estado: r.status, datos };
}

// Solo los NOMBRES de las variables y secretos que el Worker ve (nunca sus valores): sirve para encontrar un nombre mal escrito
// o un secreto guardado en otro lugar. Los bindings (base de datos, almacenamiento) no son texto y quedan fuera.
export function nombresVisibles(env) {
  const todos = Object.keys(env || {}).filter((k) => /^[A-Za-z0-9_ .-]{1,60}$/.test(k) && typeof env[k] === 'string').sort();
  return { todos, parecidos: todos.filter((k) => /git|token|^gh/i.test(k)) };
}
const sinConfigurar = (env) => ({ ok: false, configurado: false, error: 'Falta el secreto GH_TOKEN en el Worker (ver docs/REVISION-MARCAS.md).', variables: nombresVisibles(env) });

// Permiso que necesita cada acción (token de acceso fino de GitHub), para decir exactamente cuál falta.
const PERMISO = { 'lanzar la revisión': 'Actions: Read and write', 'leer las ejecuciones': 'Actions: Read and write',
  'leer la rama del sitio': 'Contents: Read and write', 'crear la rama de la aprobación': 'Contents: Read and write',
  'guardar la lista aprobada': 'Contents: Read and write', 'abrir el pull request': 'Pull requests: Read and write' };

function errorGitHub(r, que) {
  const detalle = r.datos && r.datos.message ? String(r.datos.message).slice(0, 160) : 'HTTP ' + r.estado;
  const sinPermiso = /not accessible|permission/i.test(detalle) || r.estado === 403;
  const pista = sinPermiso && PERMISO[que] ? ` Al token le faltan permisos: en GitHub, edita el token y pon «${PERMISO[que]}» (y confirma que el repositorio elegido sea el correcto). No hace falta cambiarlo en Cloudflare.`
    : r.estado === 401 ? ' Revisa que el token siga vigente y esté bien pegado en Cloudflare.'
    : r.estado === 404 ? ' Revisa el nombre del repositorio y que el archivo del flujo esté en la rama principal.' : '';
  return { ok: false, configurado: true, error: `GitHub no permitió ${que} (${detalle}).${pista}` };
}

const resumirEjecucion = (x) => x && ({ id: x.id, estado: x.status, conclusion: x.conclusion, creada: x.created_at, actualizada: x.updated_at, url: x.html_url });

export async function estadoRevision(env) {
  if (!env.GH_TOKEN) return { ...sinConfigurar(env), ejecucion: null, informe: null };
  const R = repo(env);
  const [corridas, informe] = await Promise.all([
    gh(env, `/repos/${R}/actions/workflows/${FLUJO}/runs?per_page=1`),
    gh(env, `/repos/${R}/contents/revision/informe.json?ref=${RAMA_INFORME}`),
  ]);
  if (!corridas.ok && corridas.estado !== 404) return errorGitHub(corridas, 'leer las ejecuciones');
  let inf = null;
  if (informe.ok && informe.datos && informe.datos.content) {
    try { inf = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(informe.datos.content.replace(/\n/g, '')), (c) => c.charCodeAt(0)))); } catch { inf = null; }
  }
  const ult = corridas.ok && corridas.datos && corridas.datos.workflow_runs ? resumirEjecucion(corridas.datos.workflow_runs[0]) : null;
  return { ok: true, configurado: true, ejecucion: ult || null, informe: inf, flujo_encontrado: corridas.ok };
}

/** Marcas nuevas sumadas desde el administrador: {marca: [https…]}. Solo direcciones https y nombres válidos. */
export function limpiarExtra(x) {
  const salida = {};
  if (!x || typeof x !== 'object' || Array.isArray(x)) return salida;
  for (const [k, v] of Object.entries(x).slice(0, 20)) {
    if (!/^[a-z0-9-]{1,40}$/.test(k) || !Array.isArray(v)) continue;
    const l = v.filter((u) => urlSegura(u)).slice(0, 5);
    if (l.length) salida[k] = l;
  }
  return salida;
}

export async function iniciarRevision(env, cuerpo) {
  if (!env.GH_TOKEN) return sinConfigurar(env);
  const R = repo(env);
  const en = await gh(env, `/repos/${R}/actions/workflows/${FLUJO}/runs?per_page=1`);
  const ult = en.ok && en.datos && en.datos.workflow_runs && en.datos.workflow_runs[0];
  if (ult && (ult.status === 'queued' || ult.status === 'in_progress')) return { ok: false, configurado: true, enCurso: true, error: 'Ya hay una revisión en curso.' };
  // sin marcas nuevas no se manda ninguna entrada: así sigue funcionando aunque main aún tenga la versión anterior del flujo
  const extra = limpiarExtra(cuerpo && cuerpo.extra);
  const r = await gh(env, `/repos/${R}/actions/workflows/${FLUJO}/dispatches`, { metodo: 'POST', cuerpo: { ref: env.GH_FLUJO_RAMA || 'main', ...(Object.keys(extra).length ? { inputs: { extra: JSON.stringify(extra) } } : {}) } });
  if (!r.ok) return errorGitHub(r, 'lanzar la revisión');
  return { ok: true, configurado: true };
}

/* ---------- aprobación ---------- */

const texto = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/@/g, '＠').trim().slice(0, n);
const urlSegura = (u) => /^https:\/\/[^\s"'<>]{4,300}$/.test(String(u || ''));

/** Limpia lo que manda el navegador: solo listas cortas de direcciones https y textos sin menciones. */
export function validarAprobacion(e) {
  const salida = { cargar: [], actualizar: [] };
  if (!e || typeof e !== 'object') return { error: 'Solicitud vacía' };
  for (const k of ['cargar', 'actualizar']) {
    const l = e[k] == null ? [] : e[k];
    if (!Array.isArray(l) || l.length > MAX_ITEMS) return { error: `«${k}» debe ser una lista de hasta ${MAX_ITEMS}` };
    for (const x of l) {
      if (!x || typeof x !== 'object' || !urlSegura(x.url)) return { error: `Dirección inválida en «${k}»` };
      const item = { marca: texto(x.marca, 40), url: x.url, titulo: texto(x.titulo, 140) };
      if (k === 'actualizar') {
        if (!urlSegura(x.destino) || !/^[a-z0-9-]{1,80}$/.test(String(x.slug || ''))) return { error: 'Dato inválido en «actualizar»' };
        item.destino = x.destino; item.slug = x.slug;
      }
      salida[k].push(item);
    }
  }
  if (!salida.cargar.length && !salida.actualizar.length) return { error: 'No hay nada aprobado para cargar o actualizar' };
  return { ok: true, ...salida };
}

export function cuerpoPR(a, email, fecha) {
  const l = [`Aprobado desde el administrador por ${texto(email, 80)} el ${fecha}.`, '',
    'Este pull request no cambia el sitio: deja la lista de lo aprobado para cargarlo con el proceso de la biblioteca (extraer, traducir, revisar fotos).', ''];
  if (a.cargar.length) {
    l.push('## Modelos nuevos para cargar', '', ...a.cargar.map((x) => `- ${x.marca}: ${x.titulo || x.url}\n  ${x.url}`), '');
  }
  if (a.actualizar.length) {
    l.push('## Fichas oficiales que cambiaron de dirección (actualizar la fuente registrada)', '',
      ...a.actualizar.map((x) => `- ${x.marca} · ${x.slug}\n  antes: ${x.url}\n  ahora: ${x.destino}`), '');
  }
  return l.join('\n');
}

export async function aprobarRevision(env, entrada, email) {
  if (!env.GH_TOKEN) return sinConfigurar(env);
  const a = validarAprobacion(entrada);
  if (a.error) return { ok: false, configurado: true, error: a.error };
  const R = repo(env), B = base(env);
  const fecha = new Date().toISOString().slice(0, 10);
  const rama = `revision-aprobada-${fecha}-${Math.random().toString(36).slice(2, 6)}`;

  const ref = await gh(env, `/repos/${R}/git/ref/heads/${B}`);
  if (!ref.ok) return errorGitHub(ref, 'leer la rama del sitio');
  const nueva = await gh(env, `/repos/${R}/git/refs`, { metodo: 'POST', cuerpo: { ref: `refs/heads/${rama}`, sha: ref.datos.object.sha } });
  if (!nueva.ok) return errorGitHub(nueva, 'crear la rama de la aprobación');

  const contenido = JSON.stringify({ aprobado_por: String(email || '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80), fecha, cargar: a.cargar, actualizar: a.actualizar }, null, 1) + '\n';
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(contenido)));
  const arch = await gh(env, `/repos/${R}/contents/revision/aprobados/${fecha}-${rama.slice(-4)}.json`,
    { metodo: 'PUT', cuerpo: { message: `Revisión de marcas: lista aprobada ${fecha}`, content: b64, branch: rama } });
  if (!arch.ok) return errorGitHub(arch, 'guardar la lista aprobada');

  const pr = await gh(env, `/repos/${R}/pulls`, { metodo: 'POST', cuerpo: {
    title: `Revisión de marcas ${fecha}: ${a.cargar.length} por cargar, ${a.actualizar.length} por actualizar`,
    head: rama, base: B, body: cuerpoPR(a, email, fecha) } });
  if (!pr.ok) return errorGitHub(pr, 'abrir el pull request');
  return { ok: true, configurado: true, pr: pr.datos.html_url, numero: pr.datos.number };
}
