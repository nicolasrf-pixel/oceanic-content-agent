/* OCEANIC CHARTER, cotizador por pasos + destinos */
(function () {
  'use strict';
  var D = window.OCEANIC_CHARTER;
  if (!D) return;

  function AB(){ return document.body.dataset.assetBase || '../assets/img/'; }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
  function contById(id){ return D.continentes.filter(function(c){ return c.id === id; })[0]; }

  // ---------- cotizador en un solo bloque: desplegables y campos obligatorios ----------
  var box = document.getElementById('cotzBox');
  var hoy = new Date().toISOString().slice(0, 10);
  var opciones = function (lista, ph) { return '<option value="">' + ph + '</option>' + lista.map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.nombre) + '</option>'; }).join(''); };
  var personas = ''; for (var k = 1; k <= 20; k++) personas += '<option value="' + k + '"' + (k === 4 ? ' selected' : '') + '>' + k + (k === 1 ? ' persona' : ' personas') + '</option>';
  personas += '<option value="Más de 20">Más de 20</option>';
  var campo = function (id, etiqueta, control, obligatorio, ancho) {
    return '<div class="cz-f' + (ancho ? ' cz-f-' + ancho : '') + '"><label for="' + id + '">' + etiqueta + (obligatorio ? ' <span class="cz-req" aria-hidden="true">*</span>' : '') + '</label>' + control + '</div>';
  };
  box.innerHTML =
    '<form class="cz" id="czForm" novalidate>' +
      '<input name="web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">' +
      '<fieldset class="cz-grupo"><legend><span>01</span>Tu travesía</legend><div class="cz-grid">' +
        campo('cz-region', 'Región', '<select id="cz-region" required>' + opciones(D.continentes, 'Elige una región') + '</select>', true) +
        campo('cz-destino', 'Destino', '<select id="cz-destino" required disabled><option value="">Primero elige la región</option></select>', true) +
        campo('cz-desde', 'Desde', '<input type="date" id="cz-desde" min="' + hoy + '" required>', true) +
        campo('cz-hasta', 'Hasta', '<input type="date" id="cz-hasta" min="' + hoy + '" required>', true) +
        campo('cz-personas', 'Personas', '<select id="cz-personas" required>' + personas + '</select>', true) +
        campo('cz-barco', 'Tipo de embarcación', '<select id="cz-barco">' + opciones(D.embarcaciones, 'Sin preferencia') + '</select>') +
        campo('cz-trip', 'Tripulación', '<select id="cz-trip">' + opciones(D.tripulacion, 'Aún no lo sé') + '</select>', false, 'ancho') +
        '<label class="cz-flex"><input type="checkbox" id="cz-flex"> Mis fechas son flexibles</label>' +
      '</div></fieldset>' +
      '<fieldset class="cz-grupo"><legend><span>02</span>Tus datos</legend><div class="cz-grid">' +
        campo('cz-nombre', 'Nombre', '<input id="cz-nombre" autocomplete="name" required>', true) +
        campo('cz-email', 'Correo', '<input id="cz-email" type="email" autocomplete="email" inputmode="email" required>', true) +
        campo('cz-tel', 'Teléfono', '<input id="cz-tel" type="tel" autocomplete="tel" placeholder="+56 9 …">') +
        campo('cz-msg', 'Comentario', '<input id="cz-msg" placeholder="Celebración, experiencia navegando, ideas…">') +
      '</div></fieldset>' +
      '<label class="check consent"><input type="checkbox" name="acepta" id="r-acepta" required><span>Acepto la <a href="../privacidad/index.html" target="_blank" rel="noopener">política de privacidad</a>. Usamos tus datos solo para responder esta solicitud.</span></label>' +
      '<p class="cz-err" id="czErr" role="alert" hidden></p>' +
      '<div class="cz-pie"><button type="submit" class="btn cz-enviar">Solicitar propuesta</button>' +
        '<a class="cotz-wa-alt" id="czWa" href="https://wa.me/56229537322?text=' + encodeURIComponent('Hola Oceanic, quiero cotizar un charter.') + '" target="_blank" rel="noopener">o escríbenos por WhatsApp →</a>' +
        '<span class="cz-nota"><span class="cz-req">*</span> Obligatorio · Sin costo ni compromiso</span></div>' +
    '</form>' +
    '<div class="cz-ok" id="czOk" hidden role="status"></div>';

  var f = document.getElementById('czForm'), $ = function (id) { return document.getElementById(id); };
  function llenarDestinos(regionId, elegido) {
    var c = contById(regionId), sel = $('cz-destino');
    sel.innerHTML = c ? '<option value="">Elige un destino</option>' + c.destinos.map(function (d) { return '<option' + (d === elegido ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('')
      : '<option value="">Primero elige la región</option>';
    sel.disabled = !c;
  }
  $('cz-region').addEventListener('change', function () { llenarDestinos(this.value); });
  ['input', 'change'].forEach(function (ev) { f.addEventListener(ev, function (e) { var w = e.target.closest && e.target.closest('.cz-f'); if (w && String(e.target.value).trim()) w.classList.remove('cz-mal'); }); });
  $('cz-desde').addEventListener('change', function () { $('cz-hasta').min = this.value || hoy; if ($('cz-hasta').value && $('cz-hasta').value < this.value) $('cz-hasta').value = ''; });
  $('cz-flex').addEventListener('change', function () { ['cz-desde', 'cz-hasta'].forEach(function (id) { $(id).required = !$('cz-flex').checked; }); });
  window.OCEANIC_CHARTER_REGION = function (id) { $('cz-region').value = id; llenarDestinos(id); $('cz-destino').focus({ preventScroll: true }); };

  function fmt(d){ if(!d) return ''; var p=d.split('-'); return p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : d; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('czErr'), malo = null;
    [].forEach.call(f.querySelectorAll('.cz-f'), function (x) { x.classList.remove('cz-mal'); });
    [].forEach.call(f.querySelectorAll('[required]'), function (el) {
      if (el.type === 'checkbox' ? !el.checked : !String(el.value).trim() || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value))) {
        var w = el.closest('.cz-f'); if (w) w.classList.add('cz-mal'); malo = malo || el;
      }
    });
    if (malo) {
      err.textContent = malo.id === 'r-acepta' ? 'Para enviar, acepta la política de privacidad.' : 'Completa los campos marcados para preparar tu propuesta.';
      err.hidden = false; malo.focus(); return;
    }
    err.hidden = true;
    var c = contById($('cz-region').value), emb = D.embarcaciones.filter(function (x) { return x.id === $('cz-barco').value; })[0];
    var tri = D.tripulacion.filter(function (x) { return x.id === $('cz-trip').value; })[0];
    var fechas = $('cz-desde').value ? fmt($('cz-desde').value) + ' → ' + (fmt($('cz-hasta').value) || 'a definir') : 'Flexibles';
    if ($('cz-flex').checked && $('cz-desde').value) fechas += ' (flexibles)';
    var lineas = '• Destino: ' + $('cz-destino').value + ' (' + c.nombre + ')\n• Fechas: ' + fechas + '\n• Personas: ' + $('cz-personas').value +
      '\n• Embarcación: ' + (emb ? emb.nombre : 'Sin preferencia') + '\n• Tripulación: ' + (tri ? tri.nombre : 'A definir');
    var nombre = $('cz-nombre').value.trim(), correo = $('cz-email').value.trim(), tel = $('cz-tel').value.trim(), com = $('cz-msg').value.trim();
    var btn = f.querySelector('.cz-enviar'); btn.disabled = true; btn.textContent = 'Enviando…';
    window.OCEANIC_ENVIAR({ tipo: 'charter', nombre: nombre, email: correo, telefono: tel, acepta: true, mensaje: com, detalle: lineas, web: f.elements.web.value },
      { asunto: 'Solicitud de charter, ' + nombre, cuerpo: 'Hola Oceanic, quiero cotizar un charter.\n\n' + lineas + '\n\nDatos de contacto:\n• Nombre: ' + nombre + '\n• Correo: ' + correo + (tel ? '\n• Teléfono: ' + tel : '') + (com ? '\n\nComentario:\n' + com : '') })
      .then(function (r) {
        f.hidden = true; var ok = $('czOk');
        ok.innerHTML = '<span class="cz-ok-ic" aria-hidden="true">✓</span><h3>¡Gracias, ' + esc(nombre.split(' ')[0]) + '!</h3>' +
          '<p>Recibimos tu solicitud para navegar en <b>' + esc($('cz-destino').value) + '</b>. Te enviamos una propuesta a medida por correo dentro de un día hábil. ' +
          (r.via === 'servidor' ? 'Te llegó una copia a tu correo.' : 'Se abrió tu correo con la solicitud escrita: envíala para que nos llegue.') + '</p>' +
          '<a class="btn" href="../index.html">Volver al home</a>';
        ok.hidden = false; ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, function () { btn.disabled = false; btn.textContent = 'Solicitar propuesta'; err.textContent = 'Revisa tu nombre y correo, y vuelve a enviar.'; err.hidden = false; });
  });

  // ---------- destinos (grilla informativa) ----------
  var grid = document.getElementById('cdestGrid');
  if (grid) grid.innerHTML = D.continentes.map(function (c) {
    var lista = c.destinos.filter(function (d) { return !/^otro/i.test(d); });
    return '<article class="cd2"><div class="cd2-img"><img src="' + AB() + c.img + '.webp" alt="' + c.nombre + '" loading="lazy"></div>' +
      '<div class="cd2-body"><span class="cd2-n">' + lista.length + ' destinos</span><h3>' + c.nombre + '</h3><p>' + c.lede + '</p>' +
      '<ul class="cd2-list">' + lista.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul>' +
      '<button type="button" class="cd2-cta" data-region="' + c.id + '">Cotizar en ' + c.nombre + ' <span aria-hidden="true">→</span></button></div></article>';
  }).join('');
  // «Cotizar en …»: elige la región en el cotizador y lo muestra en el paso del destino
  if (grid) grid.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-region]');
    if (!b) return;
    window.OCEANIC_CHARTER_REGION(b.getAttribute('data-region'));
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  

  // menú móvil
  var bt = document.getElementById('burger'), dr = document.getElementById('drawer');
  if (bt && dr) {
    bt.addEventListener('click', function () {
      var open = dr.hasAttribute('hidden');
      if (open) { dr.removeAttribute('hidden'); document.body.classList.add('locked'); }
      else { dr.setAttribute('hidden', ''); document.body.classList.remove('locked'); }
      bt.classList.toggle('on', open); bt.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    dr.addEventListener('click', function (e) { if (e.target.tagName === 'A') { dr.setAttribute('hidden',''); document.body.classList.remove('locked'); bt.classList.remove('on'); } });
  }
})();
