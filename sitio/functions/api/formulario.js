/* OCEANIC · Endpoint único de formularios (Cloudflare Pages Function).
   POST /api/formulario con JSON { tipo, nombre, email, ... }.

   Qué hace, en orden:
   1. Valida y limpia los datos (y descarta bots con el campo trampa "web").
   2. Envía el aviso a ventas@ (salvo la suscripción sola a Puerto, que solo pide la doble confirmación). Si esto falla responde 502 y el navegador abre el correo del
      visitante como respaldo: así nunca se pierde una solicitud.
   3. Mejor esfuerzo (si falla no bloquea): agradecimiento al cliente (con cada solicitud, texto según el tipo), contacto en Brevo con el
      consentimiento (fecha y versión de la política), negocio en el pipeline y, si el visitante
      marcó Puerto, correo de doble confirmación.

   Variables (Cloudflare → Pages → Settings → Variables and secrets): ver docs/FORMULARIOS.md en la raíz del repo.
   La clave de Brevo la guarda Nico como secreto: nunca va en el código, el chat ni el correo. */

const TIPOS = {
  cotizacion:   { linea: 'Embarcaciones nuevas', asunto: 'Cotización' },
  usado:        { linea: 'Usados',               asunto: 'Usado' },
  contacto:     { linea: 'Contacto',             asunto: 'Contacto web' },
  charter:      { linea: 'Charter',              asunto: 'Solicitud de charter' },
  equipamiento: { linea: 'Equipamiento',         asunto: 'Solicitud de equipamiento' },
  puerto:       { linea: 'Puerto',               asunto: 'Suscripción a Puerto' },
};

const LIMITES = { nombre: 120, email: 160, telefono: 40, via: 20, motivo: 120, marca: 120, modelo: 160,
  universo: 60, resumen: 400, href: 300, origen: 300, mensaje: 3000, detalle: 3000 };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const BREVO = 'https://api.brevo.com/v3';

export async function onRequestPost({ request, env }) {
  if (!origenPermitido(request, env)) return json({ ok: false, error: 'origen' }, 403);

  let entrada;
  try {
    const texto = await request.text();
    if (texto.length > 20000) return json({ ok: false, error: 'tamano' }, 413);
    entrada = JSON.parse(texto);
  } catch {
    return json({ ok: false, error: 'formato' }, 400);
  }

  // Campo trampa: las personas no lo ven; si viene lleno es un bot. Se responde "ok" sin hacer nada.
  if (entrada && entrada.web) return json({ ok: true });

  const d = limpiar(entrada);
  const error = validar(d);
  if (error) return json({ ok: false, error }, 422);

  d.fecha = new Date().toISOString();
  d.politica = env.POLITICA_VERSION || 'sin-version';

  // Modo prueba: valida todo pero no envía nada (para probar sin datos reales ni Brevo).
  if (env.MODO_PRUEBA === '1') return json({ ok: true, modo: 'prueba' });

  if (!env.BREVO_API_KEY || !env.REMITENTE_EMAIL) return json({ ok: false, error: 'sin-configurar' }, 503);

  const brevo = clienteBrevo(env.BREVO_API_KEY);
  const ventas = env.VENTAS_EMAIL || 'ventas@oceanic.cl';
  const remitente = { email: env.REMITENTE_EMAIL, name: env.REMITENTE_NOMBRE || 'Oceanic' };

  // Suscripción sola a Puerto: no hay solicitud que avisar a ventas, y el contacto lo crea Brevo
  // cuando la persona confirma el correo.
  if (d.tipo === 'puerto') {
    const r = await suscribirPuerto(brevo, d, env);
    return r.ok ? json({ ok: true }) : json({ ok: false, error: 'puerto' }, 502);
  }

  const aviso = correoVentas(d);
  const enviado = await brevo('POST', '/smtp/email', {
    sender: remitente,
    to: [{ email: ventas }],
    replyTo: { email: d.email, name: d.nombre || d.email },
    subject: aviso.asunto,
    textContent: aviso.texto,
    htmlContent: aviso.html,
  });
  if (!enviado.ok) return json({ ok: false, error: 'envio' }, 502);

  const conf = correoConfirmacion(d);
  const tareas = [
    guardarContacto(brevo, d, env),
    brevo('POST', '/smtp/email', {
      sender: remitente,
      to: [{ email: d.email, name: d.nombre || undefined }],
      replyTo: { email: ventas },
      subject: conf.asunto,
      textContent: conf.texto,
      htmlContent: conf.html,
    }),
  ];
  if (d.puerto) tareas.push(suscribirPuerto(brevo, d, env));
  if (d.tipo === 'cotizacion' || d.tipo === 'usado') tareas.push(crearNegocio(brevo, d, env));

  const resultados = await Promise.allSettled(tareas);
  // Solo códigos de error en el registro, nunca datos personales.
  resultados.forEach((r, i) => {
    const fallo = r.status === 'rejected' ? 'excepcion' : (!r.value.ok ? r.value.status : null);
    if (fallo) console.log('formulario: tarea secundaria ' + i + ' falló (' + fallo + ')');
  });

  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, error: 'metodo' }, 405);
}

/* ---------- datos ---------- */

export function limpiar(e) {
  e = e && typeof e === 'object' ? e : {};
  const d = { tipo: TIPOS[e.tipo] ? e.tipo : '' };
  for (const k of Object.keys(LIMITES)) {
    const v = typeof e[k] === 'string' ? e[k] : '';
    // quitar caracteres de control (salvo saltos de línea en textos largos) y recortar
    const largo = k === 'mensaje' || k === 'detalle';
    d[k] = v.replace(largo ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '')
      .trim().slice(0, LIMITES[k]);
  }
  d.email = d.email.toLowerCase();
  d.puerto = e.puerto === true;
  d.categorias = Array.isArray(e.categorias)
    ? e.categorias.filter((c) => typeof c === 'string').map((c) => c.trim().slice(0, 80)).filter(Boolean).slice(0, 20)
    : [];
  return d;
}

export function validar(d) {
  if (!d.tipo) return 'tipo';
  if (!EMAIL_RE.test(d.email)) return 'email';
  if (d.tipo !== 'puerto' && !d.nombre) return 'nombre';
  if (d.tipo === 'equipamiento' && !d.categorias.length) return 'categorias';
  return null;
}

function origenPermitido(request, env) {
  const origen = request.headers.get('Origin');
  if (!origen) return false;
  const permitidos = (env.ORIGENES_PERMITIDOS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (permitidos.length) return permitidos.includes(origen);
  return origen === new URL(request.url).origin;
}

/* ---------- correos ---------- */

export function correoVentas(d) {
  const t = TIPOS[d.tipo];
  const bloques = [
    ['Solicitud', [
      ['Tipo', t.linea],
      ['Modelo', d.modelo],
      ['Marca', d.marca],
      ['Universo', d.universo],
      ['Ficha', d.resumen],
      ['Motivo', d.motivo],
      ['Intereses', d.categorias.join(', ')],
      ['Página', d.href || d.origen],
    ]],
    ['Cliente', [
      ['Nombre', d.nombre],
      ['Correo', d.email],
      ['Teléfono', d.telefono],
      ['Prefiere contacto por', d.via],
      ['Quiere recibir Puerto', d.puerto ? 'Sí (pendiente de doble confirmación)' : 'No'],
    ]],
  ];
  const textos = [['Detalle', d.detalle], ['Mensaje', d.mensaje]].filter((x) => x[1]);

  const texto = ['Nueva solicitud desde el sitio Oceanic.', '']
    .concat(...bloques.map(([h, filas]) => [h.toUpperCase()]
      .concat(filas.filter((f) => f[1]).map((f) => '• ' + f[0] + ': ' + f[1]), [''])))
    .concat(...textos.map(([h, v]) => [h.toUpperCase(), v, '']))
    .concat(['Recibida: ' + d.fecha + ' · Política: ' + d.politica])
    .join('\n');

  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#14212B">' +
    '<p>Nueva solicitud desde el sitio Oceanic.</p>' +
    bloques.map(([h, filas]) => '<h3 style="margin:18px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase">' +
      esc(h) + '</h3><table cellpadding="4" style="border-collapse:collapse">' +
      filas.filter((f) => f[1]).map((f) => '<tr><td style="color:#52616E;padding-right:14px">' + esc(f[0]) +
        '</td><td>' + esc(f[1]) + '</td></tr>').join('') + '</table>').join('') +
    textos.map(([h, v]) => '<h3 style="margin:18px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase">' +
      esc(h) + '</h3><p style="white-space:pre-wrap;margin:0">' + esc(v) + '</p>').join('') +
    '<p style="margin-top:22px;color:#52616E;font-size:12px">Recibida: ' + esc(d.fecha) + ' · Política: ' +
    esc(d.politica) + '. Responde a este correo para escribirle directo al cliente.</p></div>';

  const quien = d.nombre || d.email;
  const asunto = t.asunto + (d.modelo ? ', ' + d.modelo : '') + ', ' + quien;
  return { asunto: asunto.slice(0, 200), texto, html };
}

// Agradecimiento al cliente: sale con CADA solicitud (cotización, usado, contacto, charter o
// equipamiento), con un texto propio por tipo y la copia de lo que envió.
const AGRADECIMIENTO = {
  cotizacion: (d) => ({
    asunto: 'Gracias por tu solicitud de cotización' + (d.modelo ? ' del ' + d.modelo : ''),
    cuerpo: 'Gracias por cotizar' + (d.modelo ? ' el ' + d.modelo : '') + ' con Oceanic. Un especialista te escribe ' +
      'dentro de un día hábil con precio, configuración y plazos de entrega.',
  }),
  usado: (d) => ({
    asunto: 'Gracias por tu consulta' + (d.modelo ? ' por el ' + d.modelo : ''),
    cuerpo: 'Gracias por tu interés' + (d.modelo ? ' en el ' + d.modelo : ' en este usado') + '. Un especialista te escribe ' +
      'dentro de un día hábil para contarte su estado y coordinar una visita.',
  }),
  contacto: () => ({
    asunto: 'Gracias por escribirnos',
    cuerpo: 'Gracias por escribir a Oceanic. Te respondemos dentro de un día hábil con información concreta.',
  }),
  charter: () => ({
    asunto: 'Gracias por tu solicitud de charter',
    cuerpo: 'Gracias por tu solicitud de charter. Te enviamos una propuesta a medida dentro de un día hábil, ' +
      'según el destino, las fechas y la embarcación que elegiste.',
  }),
  equipamiento: () => ({
    asunto: 'Gracias por tu solicitud de equipamiento',
    cuerpo: 'Gracias por tu solicitud de información de equipamiento. Un especialista te escribe dentro de un día ' +
      'hábil con alternativas y precios.',
  }),
};

export function correoConfirmacion(d) {
  const t = AGRADECIMIENTO[d.tipo](d);
  const saludo = d.nombre ? 'Hola ' + d.nombre.split(' ')[0] + ',' : 'Hola,';
  const copia = [
    ['Modelo', d.modelo],
    ['Motivo', d.motivo],
    ['Intereses', d.categorias.join(', ')],
    ['Detalle', d.detalle],
    ['Tu mensaje', d.mensaje],
  ].filter((f) => f[1]);
  const cierre = ['Si quieres agregar algo, responde este correo.', 'Equipo Oceanic'];

  const texto = [saludo, t.cuerpo]
    .concat(copia.length ? ['Esto es lo que nos enviaste:\n' + copia.map((f) => f[0] + ': ' + f[1]).join('\n')] : [])
    .concat(cierre).join('\n\n');
  const p = (x) => '<p style="margin:0 0 14px">' + esc(x) + '</p>';
  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#14212B;max-width:560px">' +
    p(saludo) + p(t.cuerpo) +
    (copia.length ? '<p style="margin:22px 0 6px;font-size:13px;color:#52616E">Esto es lo que nos enviaste:</p>' +
      '<table cellpadding="4" style="border-collapse:collapse;margin-bottom:18px">' +
      copia.map((f) => '<tr><td style="color:#52616E;padding-right:14px;vertical-align:top">' + esc(f[0]) +
        '</td><td style="white-space:pre-wrap">' + esc(f[1]) + '</td></tr>').join('') + '</table>' : '') +
    cierre.map(p).join('') + '</div>';
  return { asunto: t.asunto.slice(0, 200), texto, html };
}

/* ---------- Brevo ---------- */

function clienteBrevo(clave) {
  return async (metodo, ruta, cuerpo) => {
    const r = await fetch(BREVO + ruta, {
      method: metodo,
      headers: { 'api-key': clave, 'content-type': 'application/json', accept: 'application/json' },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    let datos = null;
    try { datos = await r.json(); } catch { /* 204 sin cuerpo */ }
    return { ok: r.ok, status: r.status, datos };
  };
}

export function atributos(d) {
  const a = {
    ORIGEN: d.origen || d.href || '',
    TIPO_FORMULARIO: d.tipo,
    LINEA_NEGOCIO: TIPOS[d.tipo].linea,
    MARCA: d.marca,
    MODELO: d.modelo,
    UNIVERSO: d.universo,
    CONSENTIMIENTO_FECHA: d.fecha.slice(0, 10),
    POLITICA_VERSION: d.politica,
  };
  if (d.nombre) a.FIRSTNAME = d.nombre;
  if (d.telefono) a.TELEFONO = d.telefono;
  // CONSENTIMIENTO_MARKETING no va aquí: solo se guarda vía la doble confirmación de Puerto.
  for (const k of Object.keys(a)) if (a[k] === '') delete a[k];
  return a;
}

function guardarContacto(brevo, d, env) {
  const cuerpo = { email: d.email, attributes: atributos(d), updateEnabled: true };
  const lista = num(env.BREVO_LISTA_CONTACTOS);
  if (lista) cuerpo.listIds = [lista];
  return brevo('POST', '/contacts', cuerpo);
}

function suscribirPuerto(brevo, d, env) {
  const lista = num(env.BREVO_LISTA_PUERTO), plantilla = num(env.BREVO_PLANTILLA_DOI);
  if (!lista || !plantilla || !env.PUERTO_URL_CONFIRMADO) return Promise.resolve({ ok: false, status: 'puerto-sin-configurar' });
  // Brevo envía el correo de confirmación y solo suma a la lista (y guarda estos atributos) cuando
  // la persona hace clic. La prueba del consentimiento es estar en la lista de Puerto.
  return brevo('POST', '/contacts/doubleOptinConfirmation', {
    email: d.email,
    includeListIds: [lista],
    templateId: plantilla,
    redirectionUrl: env.PUERTO_URL_CONFIRMADO,
    attributes: { CONSENTIMIENTO_MARKETING: true, CONSENTIMIENTO_FECHA: d.fecha.slice(0, 10), POLITICA_VERSION: d.politica },
  });
}

async function crearNegocio(brevo, d, env) {
  if (!env.BREVO_PIPELINE_ID || !env.BREVO_ETAPA_INICIAL) return { ok: false, status: 'negocio-sin-configurar' };
  const r = await brevo('POST', '/crm/deals', {
    name: (TIPOS[d.tipo].asunto + (d.modelo ? ', ' + d.modelo : '') + ', ' + (d.nombre || d.email)).slice(0, 200),
    attributes: { pipeline: env.BREVO_PIPELINE_ID, deal_stage: env.BREVO_ETAPA_INICIAL },
  });
  if (!r.ok || !r.datos || !r.datos.id) return r;
  const c = await brevo('GET', '/contacts/' + encodeURIComponent(d.email));
  if (!c.ok || !c.datos || !c.datos.id) return c;
  return brevo('PATCH', '/crm/deals/link-unlink/' + r.datos.id, { linkContactIds: [c.datos.id] });
}

/* ---------- utilidades ---------- */

function num(v) { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : 0; }

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function json(cuerpo, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
