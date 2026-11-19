/* OCEANIC · Motor de correo propio del sitio (como Forminator + SMTP en WordPress).
   El Worker entrega cada correo al servidor SMTP de la casilla de Oceanic (Google Workspace: smtp.gmail.com, puerto 465
   con TLS) autenticado como contacto@oceanic.cl. No pasa por ningún servicio de envío de terceros, y cada correo queda en
   la carpeta «Enviados» de esa casilla.

   Variables del Worker:
     SMTP_CLAVE     (secreto)  contraseña de aplicación de Google de la cuenta remitente (nunca la contraseña normal)
     SMTP_USUARIO   (opcional) cuenta con la que se autentica; por defecto REMITENTE_EMAIL
     SMTP_HOST      (opcional) por defecto smtp.gmail.com
     SMTP_PUERTO    (opcional) por defecto 465 */

const CRLF = '\r\n';

function b64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const cabeceraUtf8 = (s) => /^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + b64(s) + '?=';
const direccion = (d) => d.name ? cabeceraUtf8(d.name.replace(/["\\]/g, '')) + ' <' + d.email + '>' : d.email;
const lineas76 = (s) => s.replace(/.{1,76}/g, (m) => m + CRLF);

/** Mensaje MIME (texto + HTML, UTF-8 en base64). */
export function armarMensaje({ from, to, replyTo, subject, text, html }, dominio) {
  const limite = 'oceanic-' + crypto.randomUUID();
  const id = '<' + crypto.randomUUID() + '@' + dominio + '>';
  const cab = [
    'From: ' + direccion(from),
    'To: ' + to.map(direccion).join(', '),
    ...(replyTo ? ['Reply-To: ' + direccion(replyTo)] : []),
    'Subject: ' + cabeceraUtf8(subject),
    'Date: ' + new Date().toUTCString().replace('GMT', '+0000'),
    'Message-ID: ' + id,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + limite + '"',
  ];
  const parte = (tipo, contenido) => '--' + limite + CRLF + 'Content-Type: ' + tipo + '; charset=UTF-8' + CRLF +
    'Content-Transfer-Encoding: base64' + CRLF + CRLF + lineas76(b64(contenido));
  return cab.join(CRLF) + CRLF + CRLF + parte('text/plain', text || '') + parte('text/html', html || '') + '--' + limite + '--' + CRLF;
}

/** Envía un correo. Devuelve { ok, status, error } con el mismo formato que el resto del endpoint. */
export async function enviarSMTP(env, correo, conectar) {
  const host = env.SMTP_HOST || 'smtp.gmail.com';
  const puerto = parseInt(env.SMTP_PUERTO || '465', 10);
  const usuario = env.SMTP_USUARIO || env.REMITENTE_EMAIL;
  if (!env.SMTP_CLAVE || !usuario) return { ok: false, status: 'smtp-sin-configurar' };
  if (!conectar) ({ connect: conectar } = await import('cloudflare:sockets'));
  const socket = conectar({ hostname: host, port: puerto }, { secureTransport: 'on', allowHalfOpen: false });
  const escritor = socket.writable.getWriter(), lector = socket.readable.getReader();
  const dec = new TextDecoder(), enc = new TextEncoder();
  let bufer = '';
  async function respuesta() {  // lee una respuesta completa (varias líneas «250-…» terminan en «250 …»)
    for (;;) {
      const m = bufer.match(/(?:^|\r\n)(\d{3}) [^\r\n]*\r\n/);
      if (m) { const fin = bufer.indexOf(m[0]) + m[0].length; const r = bufer.slice(0, fin); bufer = bufer.slice(fin); return { codigo: +m[1], texto: r.trim() }; }
      const { value, done } = await lector.read();
      if (done) throw new Error('conexión cerrada');
      bufer += dec.decode(value, { stream: true });
    }
  }
  async function comando(linea, esperado) {
    if (linea !== null) await escritor.write(enc.encode(linea + CRLF));
    const r = await respuesta();
    if (!esperado.includes(r.codigo)) throw new Error('SMTP ' + r.codigo + ' ' + r.texto.slice(0, 120));
    return r;
  }
  const dominio = (correo.from.email.split('@')[1] || 'oceanic.cl');
  try {
    await comando(null, [220]);
    await comando('EHLO ' + dominio, [250]);
    await comando('AUTH LOGIN', [334]);
    await comando(b64(usuario), [334]);
    await comando(b64(env.SMTP_CLAVE), [235]);
    await comando('MAIL FROM:<' + correo.from.email + '>', [250]);
    for (const d of correo.to) await comando('RCPT TO:<' + d.email + '>', [250, 251]);
    await comando('DATA', [354]);
    const cuerpo = armarMensaje(correo, dominio).replace(/(^|\r\n)\./g, '$1..');  // «dot-stuffing»
    await comando(cuerpo + '.', [250]);
    await escritor.write(enc.encode('QUIT' + CRLF)).catch(() => {});
    return { ok: true, status: 250 };
  } catch (e) {
    // nunca se registran datos personales ni la clave: solo el código del servidor
    return { ok: false, status: 'smtp', error: String(e.message || e).replace(/[\w.+-]+@[\w.-]+/g, '[correo]').slice(0, 160) };
  } finally {
    try { await socket.close(); } catch { /* ya cerrado */ }
  }
}
