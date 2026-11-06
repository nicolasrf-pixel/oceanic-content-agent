/* OCEANIC · Arriendo de boyas MarkSetBot: formulario en un solo bloque (mismo diseño del cotizador de charter) y video
   oficial, que se llama desde Vimeo solo al apretar «Ver video». */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------- video oficial (Vimeo, sin cookies hasta que se pide) ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-vimeo]');
    if (!b) return;
    var capa = document.createElement('div');
    capa.className = 'bvideo';
    capa.setAttribute('role', 'dialog');
    capa.setAttribute('aria-label', 'Video MarkSetBot');
    capa.innerHTML = '<div class="bvideo-in"><button type="button" class="bvideo-x" aria-label="Cerrar video">×</button>' +
      '<iframe src="https://player.vimeo.com/video/' + encodeURIComponent(b.getAttribute('data-vimeo')) + '?autoplay=1&dnt=1" ' +
      'allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="MarkSetBot"></iframe></div>';
    function cerrar() { capa.remove(); document.removeEventListener('keydown', tecla); b.focus(); }
    function tecla(ev) { if (ev.key === 'Escape') cerrar(); }
    capa.addEventListener('click', function (ev) { if (ev.target === capa || ev.target.closest('.bvideo-x')) cerrar(); });
    document.addEventListener('keydown', tecla);
    document.body.appendChild(capa);
    capa.querySelector('.bvideo-x').focus();
  });

  // ---------- formulario ----------
  var box = $('boyasBox');
  if (!box) return;
  var hoy = new Date().toISOString().slice(0, 10);
  var opciones = function (lista, ph) {
    return '<option value="">' + ph + '</option>' + lista.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
  };
  var EVENTOS = ['Regata de club', 'Campeonato nacional', 'Evento internacional', 'Entrenamiento o clínica', 'Otro'];
  var CANTIDAD = ['2 boyas', '3 boyas', '4 boyas', '5 boyas', '6 boyas', 'Más de 6', 'Aún no lo sé'];
  var campo = function (id, etiqueta, control, obligatorio, ancho) {
    return '<div class="cz-f' + (ancho ? ' cz-f-' + ancho : '') + '"><label for="' + id + '">' + etiqueta +
      (obligatorio ? ' <span class="cz-req" aria-hidden="true">*</span>' : '') + '</label>' + control + '</div>';
  };
  box.innerHTML =
    '<form class="cz" id="bForm" novalidate>' +
      '<input name="web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">' +
      '<fieldset class="cz-grupo"><legend><span>01</span>Tu regata</legend><div class="cz-grid">' +
        campo('b-org', 'Club u organización', '<input id="b-org" autocomplete="organization" required>', true) +
        campo('b-evento', 'Tipo de evento', '<select id="b-evento" required>' + opciones(EVENTOS, 'Elige una opción') + '</select>', true) +
        campo('b-desde', 'Desde', '<input type="date" id="b-desde" min="' + hoy + '" required>', true) +
        campo('b-hasta', 'Hasta', '<input type="date" id="b-hasta" min="' + hoy + '">') +
        campo('b-lugar', 'Lugar', '<input id="b-lugar" placeholder="Bahía, club o ciudad" required>', true, 'ancho') +
        campo('b-cant', 'Boyas', '<select id="b-cant" required>' + opciones(CANTIDAD, '¿Cuántas?') + '</select>', true) +
        campo('b-clase', 'Clase o flota', '<input id="b-clase" placeholder="J/70, Optimist, Lightning…">') +
      '</div></fieldset>' +
      '<fieldset class="cz-grupo"><legend><span>02</span>Tus datos</legend><div class="cz-grid">' +
        campo('b-nombre', 'Nombre', '<input id="b-nombre" autocomplete="name" required>', true) +
        campo('b-email', 'Correo', '<input id="b-email" type="email" autocomplete="email" inputmode="email" required>', true) +
        campo('b-tel', 'Teléfono', '<input id="b-tel" type="tel" autocomplete="tel" placeholder="+56 9 …">') +
        campo('b-msg', 'Comentario', '<input id="b-msg" placeholder="Recorrido, número de botes, horarios…">') +
      '</div></fieldset>' +
      '<label class="check consent"><input type="checkbox" name="acepta" id="b-acepta" required><span>Acepto la <a href="../privacidad/index.html" target="_blank" rel="noopener">política de privacidad</a>. Usamos tus datos solo para responder esta solicitud.</span></label>' +
      '<p class="cz-err" id="bErr" role="alert" hidden></p>' +
      '<div class="cz-pie"><button type="submit" class="btn cz-enviar">Solicitar propuesta</button>' +
        '<a class="cotz-wa-alt" href="https://wa.me/56229537322?text=' + encodeURIComponent('Hola Oceanic, quiero arrendar boyas MarkSetBot.') + '" target="_blank" rel="noopener">o escríbenos por WhatsApp →</a>' +
        '<span class="cz-nota"><span class="cz-req">*</span> Obligatorio · Sin costo ni compromiso</span></div>' +
    '</form>' +
    '<div class="cz-ok" id="bOk" hidden role="status"></div>';

  var f = $('bForm');
  ['input', 'change'].forEach(function (ev) {
    f.addEventListener(ev, function (e) { var w = e.target.closest && e.target.closest('.cz-f'); if (w && String(e.target.value).trim()) w.classList.remove('cz-mal'); });
  });
  $('b-desde').addEventListener('change', function () {
    $('b-hasta').min = this.value || hoy;
    if ($('b-hasta').value && $('b-hasta').value < this.value) $('b-hasta').value = '';
  });
  function fmt(d) { if (!d) return ''; var p = d.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d; }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('bErr'), malo = null;
    [].forEach.call(f.querySelectorAll('.cz-f'), function (x) { x.classList.remove('cz-mal'); });
    [].forEach.call(f.querySelectorAll('[required]'), function (el) {
      if (el.type === 'checkbox' ? !el.checked : !String(el.value).trim() || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value))) {
        var w = el.closest('.cz-f'); if (w) w.classList.add('cz-mal'); malo = malo || el;
      }
    });
    if (malo) {
      err.textContent = malo.id === 'b-acepta' ? 'Para enviar, acepta la política de privacidad.' : 'Completa los campos marcados para preparar tu propuesta.';
      err.hidden = false; malo.focus(); return;
    }
    err.hidden = true;
    var fechas = fmt($('b-desde').value) + ($('b-hasta').value && $('b-hasta').value !== $('b-desde').value ? ' → ' + fmt($('b-hasta').value) : '');
    var lineas = '• Organización: ' + $('b-org').value.trim() + '\n• Evento: ' + $('b-evento').value + '\n• Fechas: ' + fechas +
      '\n• Lugar: ' + $('b-lugar').value.trim() + '\n• Boyas: ' + $('b-cant').value + ($('b-clase').value.trim() ? '\n• Clase o flota: ' + $('b-clase').value.trim() : '');
    var nombre = $('b-nombre').value.trim(), correo = $('b-email').value.trim(), tel = $('b-tel').value.trim(), com = $('b-msg').value.trim();
    var btn = f.querySelector('.cz-enviar'); btn.disabled = true; btn.textContent = 'Enviando…';
    window.OCEANIC_ENVIAR({ tipo: 'boyas', nombre: nombre, email: correo, telefono: tel, acepta: true, mensaje: com, detalle: lineas, marca: 'MarkSetBot', web: f.elements.web.value },
      { asunto: 'Arriendo de boyas MarkSetBot, ' + nombre, cuerpo: 'Hola Oceanic, quiero arrendar boyas MarkSetBot.\n\n' + lineas + '\n\nDatos de contacto:\n• Nombre: ' + nombre + '\n• Correo: ' + correo + (tel ? '\n• Teléfono: ' + tel : '') + (com ? '\n\nComentario:\n' + com : '') })
      .then(function (r) {
        f.hidden = true; var ok = $('bOk');
        ok.innerHTML = '<span class="cz-ok-ic" aria-hidden="true">✓</span><h3>¡Gracias, ' + esc(nombre.split(' ')[0]) + '!</h3>' +
          '<p>Recibimos tu solicitud de arriendo de boyas para <b>' + esc($('b-org').value.trim()) + '</b>. Te escribimos con disponibilidad y una propuesta dentro de un día hábil. ' +
          (r.via === 'servidor' ? 'Te llegó una copia a tu correo.' : 'Se abrió tu correo con la solicitud escrita: envíala para que nos llegue.') + '</p>' +
          '<a class="btn" href="../index.html">Volver al home</a>';
        ok.hidden = false; ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, function () { btn.disabled = false; btn.textContent = 'Solicitar propuesta'; err.textContent = 'Revisa tu nombre y correo, y vuelve a enviar.'; err.hidden = false; });
  });
})();
