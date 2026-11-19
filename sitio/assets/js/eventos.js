/* OCEANIC · Eventos (se administran en /admin/ › Eventos, datos en eventos-data.js).
   1. Pop-up: nav-tpl.js carga este archivo en todas las páginas. Muestra el primer pop-up activo y vigente (fechas desde/hasta,
      páginas donde aparece) con la frecuencia elegida: una vez por persona, una vez por visita o siempre.
   2. Landing: en /evento/?e=<slug> arma la invitación (portada, texto, detalles, programa, galería) con el formulario de
      inscripción, que llega a ventas y al CRM como tipo «evento». Pasada la fecha (o el cierre de inscripción) queda sin formulario. */
(function () {
  'use strict';
  var E = window.OCEANIC_EVENTOS || {};
  var pre = ((document.body && document.body.dataset.assetBase) || 'assets/img/').replace('assets/img/', '');
  var d0 = new Date(), hoy = d0.getFullYear() + '-' + ('0' + (d0.getMonth() + 1)).slice(-2) + '-' + ('0' + d0.getDate()).slice(-2);
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function img(p) { return !p ? '' : /^(https?:)?\/\//.test(p) || p.charAt(0) === '/' ? p : pre + 'assets/img/' + p; }
  function imgAbs(p) { try { return new URL(img(p), location.href).href; } catch (e) { return img(p); } }  // para url() en CSS
  function enlace(u) { return !u ? '' : /^(https?:|mailto:|tel:|#|\/)/.test(u) ? u : pre + u; }
  function fechaLarga(f) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f || '')) return '';
    var t = new Date(f + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function guardado(alm, k) { try { return alm.getItem(k); } catch (e) { return null; } }
  function guardar(alm, k) { try { alm.setItem(k, '1'); } catch (e) { /* sin almacenamiento */ } }
  var vistaPrevia = /(?:^|;\s*)oceanic_vista_on=1/.test(document.cookie || '');

  /* ---------------- pop-up ---------------- */
  var enLanding = !!document.getElementById('evento');
  var ruta = location.pathname, esInicio = pre === '' && /\/(index\.html)?$/.test(ruta);
  var esMarca = /\/marca\//.test(ruta);
  var P = (E.popups || []).filter(function (p) {
    if (!p || !p.activo || !p.titulo) return false;
    if (p.desde && hoy < p.desde) return false;
    if (p.hasta && hoy > p.hasta) return false;
    if (p.paginas === 'inicio' && !esInicio) return false;
    if (p.paginas === 'marcas' && !esMarca) return false;
    if (enLanding) return false;
    var k = 'oceanic-popup-' + p.id;
    if (p.frecuencia === 'sesion' ? guardado(sessionStorage, k) : p.frecuencia !== 'siempre' && guardado(localStorage, k)) return false;
    return true;
  })[0];
  if (P) setTimeout(function () { popup(P); }, Math.max(0, Math.min(60, +P.retraso || 3)) * 1000);

  function popup(p) {
    var k = 'oceanic-popup-' + p.id;
    guardar(p.frecuencia === 'sesion' ? sessionStorage : localStorage, k);
    var antes = document.activeElement;
    var capa = document.createElement('div');
    capa.className = 'evp';
    capa.setAttribute('role', 'dialog'); capa.setAttribute('aria-modal', 'true'); capa.setAttribute('aria-labelledby', 'evp-t');
    capa.innerHTML = '<div class="evp-card' + (p.imagen ? '' : ' evp-sin') + '">' +
      (p.imagen ? '<div class="evp-img" style="background-image:url(\'' + esc(imgAbs(p.imagen)).replace(/'/g, '%27') + '\')"></div>' : '') +
      '<div class="evp-txt"><button type="button" class="evp-x" aria-label="Cerrar">×</button>' +
      (p.antetitulo ? '<p class="evp-eyebrow">' + esc(p.antetitulo) + '</p>' : '') +
      '<h2 id="evp-t" class="evp-h">' + esc(p.titulo) + '</h2>' +
      (p.texto ? '<p class="evp-p">' + esc(p.texto) + '</p>' : '') +
      (p.enlace ? '<a class="btn evp-btn" href="' + esc(enlace(p.enlace)) + '"' + (/^https?:/.test(p.enlace) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(p.boton || 'Ver más') + '</a>' : '') +
      '</div></div>';
    function cerrar() {
      capa.classList.remove('on'); document.removeEventListener('keydown', tecla);
      setTimeout(function () { capa.remove(); }, 300);
      if (antes && antes.focus) antes.focus();
    }
    function tecla(e) { if (e.key === 'Escape') cerrar(); }
    capa.addEventListener('click', function (e) { if (e.target === capa || e.target.closest('.evp-x')) cerrar(); });
    document.addEventListener('keydown', tecla);
    document.body.appendChild(capa);
    requestAnimationFrame(function () { capa.classList.add('on'); capa.querySelector('.evp-x').focus({ preventScroll: true }); });
  }

  /* ---------------- landing ---------------- */
  var raiz = document.getElementById('evento');
  if (!raiz) return;
  var slug = new URLSearchParams(location.search).get('e') || '';
  var L = (E.landings || []).filter(function (x) { return x && x.slug === slug; })[0];
  if (!L || (!L.visible && !vistaPrevia)) {
    raiz.innerHTML = '<section class="ev-nada"><div class="wrap"><p class="eyebrow">Eventos</p><h1>Este evento no está disponible</h1>' +
      '<p>Puede que ya haya terminado o que el enlace esté incompleto.</p><a class="btn" href="' + pre + 'index.html">Ir al inicio</a></div></section>';
    return;
  }
  document.title = L.titulo + ' · Oceanic';
  var md = document.querySelector('meta[name="description"]'); if (md && L.bajada) md.setAttribute('content', L.bajada);
  var pasado = !!(L.fecha && L.fecha < hoy);
  var cerrada = pasado || !!(L.inscripcion_hasta && L.inscripcion_hasta < hoy);
  var conForm = L.inscripcion && !cerrada;
  var cuando = fechaLarga(L.fecha);
  var meta = [cuando, L.hora, L.lugar].filter(Boolean);

  var h = '<header class="evh"' + (L.imagen ? ' style="--evh-img:url(\'' + esc(imgAbs(L.imagen)).replace(/'/g, '%27') + '\')"' : '') + '>' +
    '<div class="wrap-wide evh-in">' +
    '<nav aria-label="Ruta" class="crumb"><a href="' + pre + 'index.html">Oceanic</a><span>·</span><span>Eventos</span></nav>' +
    (L.antetitulo ? '<p class="evh-eyebrow">' + esc(L.antetitulo) + '</p>' : '') +
    '<h1 class="evh-h1">' + esc(L.titulo) + '</h1>' +
    (L.bajada ? '<p class="evh-sub">' + esc(L.bajada) + '</p>' : '') +
    (meta.length ? '<ul class="evh-meta">' + meta.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' : '') +
    (conForm ? '<a class="btn" href="#inscripcion">' + esc(L.boton || 'Confirmar asistencia') + '</a>' : '') +
    (pasado ? '<p class="evh-pasado">Este evento ya se realizó. Gracias a quienes nos acompañaron.</p>' : '') +
    '</div></header>';

  var cuerpo = (L.cuerpo || []).filter(Boolean);
  var gal = (L.galeria || []).filter(Boolean);
  var galHtml = gal.length ? '<div class="wrap-wide"><div class="ev-gal">' +
    gal.map(function (g) { return '<figure><img loading="lazy" alt="" src="' + esc(img(g)) + '"></figure>'; }).join('') + '</div></div>' : '';
  var prog = (L.programa || []).filter(function (x) { return x && x.texto; });
  if (cuerpo.length || prog.length || L.lugar || gal.length) {
    h += '<section class="ev-sec"><div class="wrap-wide ev-cols"><div class="ev-txt">' +
      '<div class="sec-head"><span class="eyebrow">La invitación</span><span class="rule"></span></div>' +
      cuerpo.map(function (p, i) { return '<p' + (i ? '' : ' class="lede"') + '>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '<aside class="ev-ficha"><h2>Detalles</h2><dl>' +
      (cuando ? '<dt>Fecha</dt><dd>' + esc(cuando) + '</dd>' : '') +
      (L.hora ? '<dt>Hora</dt><dd>' + esc(L.hora) + '</dd>' : '') +
      (L.lugar ? '<dt>Lugar</dt><dd>' + esc(L.lugar) + (L.mapa ? ' · <a href="' + esc(L.mapa) + '" target="_blank" rel="noopener">Ver mapa</a>' : '') + '</dd>' : '') +
      (L.inscripcion_hasta && !pasado ? '<dt>Inscripción</dt><dd>Hasta el ' + esc(fechaLarga(L.inscripcion_hasta).toLowerCase()) + '</dd>' : '') +
      '</dl>' +
      (prog.length ? '<h2>Programa</h2><ol class="ev-prog">' + prog.map(function (x) {
        return '<li>' + (x.hora ? '<b>' + esc(x.hora) + '</b>' : '') + '<span>' + esc(x.texto) + '</span></li>'; }).join('') + '</ol>' : '') +
      '</aside></div>' + galHtml + '</section>';
  }
  if (conForm) h += '<section class="ev-sec ev-ins" id="inscripcion"><div class="wrap ev-ins-in">' +
    '<div class="sec-head"><span class="eyebrow">Inscripción</span><span class="rule"></span></div>' +
    '<h2 class="ev-h2">' + esc(L.boton || 'Confirmar asistencia') + '</h2><div id="evBox"></div></div></section>';
  raiz.innerHTML = h;
  var mob = document.querySelector('.mob');
  if (mob) { if (conForm) mob.innerHTML = '<a class="btn" href="#inscripcion">' + esc(L.boton || 'Confirmar asistencia') + '</a>'; else mob.remove(); }
  if (!conForm) return;

  var box = document.getElementById('evBox');
  var campo = function (id, etq, control, obl, ancho) {
    return '<div class="cz-f' + (ancho ? ' cz-f-ancho' : '') + '"><label for="' + id + '">' + etq + (obl ? ' <span class="cz-req" aria-hidden="true">*</span>' : '') + '</label>' + control + '</div>';
  };
  box.innerHTML = '<form class="cz" id="evForm" novalidate>' +
    '<input name="web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">' +
    '<div class="cz-grid">' +
      campo('ev-nombre', 'Nombre', '<input id="ev-nombre" autocomplete="name" required>', true) +
      campo('ev-email', 'Correo', '<input id="ev-email" type="email" autocomplete="email" inputmode="email" required>', true) +
      campo('ev-tel', 'Teléfono', '<input id="ev-tel" type="tel" autocomplete="tel" placeholder="+56 9 …">') +
      (L.acompanantes ? campo('ev-acomp', 'Acompañantes', '<select id="ev-acomp"><option>Voy solo</option><option>1 acompañante</option><option>2 acompañantes</option><option>3 acompañantes</option><option>4 o más</option></select>') : '') +
      campo('ev-msg', 'Comentario', '<input id="ev-msg" placeholder="Algo que debamos saber">', false, true) +
    '</div>' +
    '<label class="check consent"><input type="checkbox" name="acepta" id="ev-acepta" required><span>Acepto la <a href="' + pre + 'privacidad/index.html" target="_blank" rel="noopener">política de privacidad</a>. Usamos tus datos solo para gestionar tu inscripción.</span></label>' +
    '<p class="cz-err" id="evErr" role="alert" hidden></p>' +
    '<div class="cz-pie"><button type="submit" class="btn cz-enviar">' + esc(L.boton || 'Confirmar asistencia') + '</button>' +
    '<span class="cz-nota"><span class="cz-req">*</span> Obligatorio</span></div></form>' +
    '<div class="cz-ok" id="evOk" hidden role="status"></div>';
  var f = document.getElementById('evForm'), $ = function (id) { return document.getElementById(id); };
  f.addEventListener('input', function (e) { var w = e.target.closest && e.target.closest('.cz-f'); if (w && String(e.target.value).trim()) w.classList.remove('cz-mal'); });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('evErr'), malo = null;
    [].forEach.call(f.querySelectorAll('[required]'), function (el) {
      var mal = el.type === 'checkbox' ? !el.checked : !String(el.value).trim() || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
      var w = el.closest('.cz-f'); if (w) w.classList.toggle('cz-mal', mal);
      if (mal) malo = malo || el;
    });
    if (malo) { err.textContent = malo.id === 'ev-acepta' ? 'Para inscribirte, acepta la política de privacidad.' : 'Completa los campos marcados.'; err.hidden = false; malo.focus(); return; }
    err.hidden = true;
    var nombre = $('ev-nombre').value.trim(), correo = $('ev-email').value.trim(), tel = $('ev-tel').value.trim(), com = $('ev-msg').value.trim();
    var lineas = '• Evento: ' + L.titulo + (cuando ? '\n• Fecha: ' + cuando + (L.hora ? ', ' + L.hora : '') : '') + (L.lugar ? '\n• Lugar: ' + L.lugar : '') +
      ($('ev-acomp') ? '\n• Asistencia: ' + $('ev-acomp').value : '');
    var btn = f.querySelector('.cz-enviar'); btn.disabled = true; btn.textContent = 'Enviando…';
    window.OCEANIC_ENVIAR({ tipo: 'evento', nombre: nombre, email: correo, telefono: tel, acepta: true, motivo: L.titulo, mensaje: com, detalle: lineas, web: f.elements.web.value },
      { asunto: 'Inscripción: ' + L.titulo + ', ' + nombre, cuerpo: 'Hola Oceanic, confirmo mi asistencia.\n\n' + lineas + '\n\nDatos de contacto:\n• Nombre: ' + nombre + '\n• Correo: ' + correo + (tel ? '\n• Teléfono: ' + tel : '') + (com ? '\n\nComentario:\n' + com : '') })
      .then(function (r) {
        f.hidden = true; var ok = $('evOk');
        ok.innerHTML = '<span class="cz-ok-ic" aria-hidden="true">✓</span><h3>¡Gracias, ' + esc(nombre.split(' ')[0]) + '!</h3>' +
          '<p>' + esc(L.gracias || 'Recibimos tu inscripción.') + (r.via === 'servidor' ? '' : ' Se abrió tu correo con la inscripción escrita: envíala para que nos llegue.') + '</p>';
        ok.hidden = false; ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, function () { btn.disabled = false; btn.textContent = L.boton || 'Confirmar asistencia'; err.textContent = 'Revisa tu nombre y correo, y vuelve a enviar.'; err.hidden = false; });
  });
})();
