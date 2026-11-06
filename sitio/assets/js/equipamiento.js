/* OCEANIC, Equipamiento: renderiza logos + categorías desde data */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = window.OCEANIC_EQUIPAMIENTO;
  if (!D) return;

  var AB = document.body.dataset.assetBase || '../assets/img/';
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); };
  var todas = [];
  D.categorias.forEach(function (c) { c.marcas.forEach(function (m) { todas.push(m); }); });

  // franja de logos oficiales (se desliza en bucle; cada logo lleva a su marca en la página)
  var fila = todas.filter(function (m) { return m.logo; }).map(function (m) {
    return '<a class="elogo2" href="#marca-' + esc(m.id) + '" title="' + esc(m.nombre) + '"><img src="' + AB + esc(m.logo) + '" alt="' + esc(m.nombre) + '" loading="lazy"></a>';
  }).join('');
  document.getElementById('elogos').innerHTML =
    '<div class="elogos2" aria-label="Marcas de equipamiento"><div class="elogos2-pista">' + fila + '<span aria-hidden="true" class="elogos2-copia">' + fila + '</span></div></div>';

  // categorías con tarjetas: foto, logo, descripción y desplegable con las líneas de producto oficiales
  document.getElementById('ecats').innerHTML = D.categorias.map(function (c, i) {
    var marcas = c.marcas.map(function (m) {
      var wa = 'https://wa.me/56229537322?text=' + encodeURIComponent('Hola Oceanic, quiero información sobre ' + m.nombre + ' (' + c.titulo + ').');
      var lineas = (m.lineas || []).map(function (l) {
        return '<div class="em2-linea"><h4>' + esc(l.titulo) + '</h4><ul>' + l.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
      }).join('');
      return '<article class="em2" id="marca-' + esc(m.id) + '">' +
        '<div class="em2-foto">' + (m.foto ? '<img src="' + AB + esc(m.foto) + '" alt="' + esc(m.nombre) + '" loading="lazy">' : '') +
          (m.logo ? '<img class="em2-logo" src="' + AB + esc(m.logo) + '" alt="' + esc(m.nombre) + '">' : '') + '</div>' +
        '<div class="em2-cuerpo">' +
          (m.origen ? '<span class="em2-origen">' + esc(m.origen) + '</span>' : '') +
          '<h3 class="em2-nombre">' + esc(m.nombre) + '</h3>' +
          '<p class="em2-desc">' + esc(m.desc) + '</p>' +
          (lineas ? '<details class="em2-mas"><summary>Líneas de producto</summary><div class="em2-lineas">' + lineas +
            (m.web ? '<p class="em2-fuente">Según la web oficial de ' + esc(m.nombre) + '. <a href="' + esc(m.web) + '" target="_blank" rel="noopener">Ver sitio oficial ↗</a></p>' : '') + '</div></details>' : '') +
          '<div class="em2-acts"><a class="btn em2-pedir" href="#solicitar" data-cat="' + esc(c.titulo) + '">Solicitar información</a>' +
          '<a class="em2-wa" href="' + wa + '" target="_blank" rel="noopener">WhatsApp →</a></div>' +
        '</div></article>';
    }).join('');
    return '<section class="ecat">' +
      '<div class="wrap-wide">' +
        '<div class="ecat-head">' +
          '<span class="ecat-n">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
          '<div><h2 class="ecat-h2">' + esc(c.titulo) + '</h2>' +
          '<p class="ecat-lede">' + esc(c.lede) + '</p></div>' +
        '</div>' +
        '<div class="em2-grid' + (c.marcas.length === 1 ? ' em2-grid-1' : '') + '">' + marcas + '</div>' +
      '</div></section>';
  }).join('');

  // «Solicitar información»: marca la categoría en el formulario de abajo
  document.getElementById('ecats').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cat]'); if (!b) return;
    var cat = b.getAttribute('data-cat');
    [].forEach.call(document.querySelectorAll('#solicitar input[type=checkbox]'), function (x) {
      if (x.value === cat) x.checked = true;
    });
  });

  // revelado
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = parseInt(e.target.dataset.i || 0, 10);
        setTimeout(function () { e.target.classList.add('on'); }, (i % 4) * 70);
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    var sel = '.ecat-head';
    
    [].slice.call(document.querySelectorAll(sel)).forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  }

  // menú móvil
  var bt = document.getElementById('burger'), dr = document.getElementById('drawer');
  if (bt && dr) {
    bt.addEventListener('click', function () {
      var open = dr.hasAttribute('hidden');
      if (open) { dr.removeAttribute('hidden'); document.body.classList.add('locked'); }
      else { dr.setAttribute('hidden', ''); document.body.classList.remove('locked'); }
      bt.classList.toggle('on', open); bt.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    dr.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { dr.setAttribute('hidden', ''); document.body.classList.remove('locked'); bt.classList.remove('on'); }
    });
  }
})();

/* ---- Formulario de solicitud con selector múltiple → /api/formulario (o correo de respaldo) ---- */
(function () {
  'use strict';
  var send = document.getElementById('efSend');
  if (window.OCEANIC_CONSENTIMIENTO && send) OCEANIC_CONSENTIMIENTO(send.parentNode, send);  // Ley 21.719
  if (!send) return;

  function val(id){ var el=document.getElementById(id); return el ? el.value.trim() : ''; }

  function marcadas(){
    return [].slice.call(document.querySelectorAll('#eformCats input:checked'))
             .map(function(c){ return c.value; });
  }

  // actualizar el enlace de WhatsApp con las categorías marcadas en vivo
  var wa = document.getElementById('efWa');
  function syncWa(){
    var cats = marcadas();
    var txt = 'Hola Oceanic, quiero información de equipamiento.';
    if (cats.length) txt += '\n\nMe interesa:\n• ' + cats.join('\n• ');
    wa.href = 'https://wa.me/56229537322?text=' + encodeURIComponent(txt);
  }
  document.getElementById('eformCats').addEventListener('change', syncWa);
  syncWa();

  send.addEventListener('click', function () {
    var cats = marcadas();
    var nombre = val('ef-nombre'), correo = val('ef-email');
    if (!cats.length) { alert('Marca al menos una categoría que te interese.'); return; }
    if (!nombre || !correo) { alert('Déjanos tu nombre y correo para enviarte la información.'); return; }
    if (!OCEANIC_ACEPTO(send.parentNode)) { alert('Para enviar, acepta la política de privacidad.'); return; }
    var tel = val('ef-tel'), barco = val('ef-barco'), msg = val('ef-msg');
    var cuerpo = 'Hola Oceanic, quiero información de equipamiento.\n\n' +
      'Me interesa:\n• ' + cats.join('\n• ') +
      '\n\nDatos de contacto:\n• Nombre: ' + nombre +
      '\n• Correo: ' + correo +
      (tel ? '\n• Teléfono: ' + tel : '') +
      (barco ? '\n• Embarcación: ' + barco : '') +
      (msg ? '\n\nComentario:\n' + msg : '');
    var estado = document.getElementById('efEstado');
    send.disabled = true; send.textContent = 'Enviando…';
    window.OCEANIC_ENVIAR({
      tipo: 'equipamiento', nombre: nombre, email: correo, telefono: tel, acepta: true,
      categorias: cats, detalle: barco ? 'Embarcación: ' + barco : '', mensaje: msg,
      web: val('ef-web')
    }, { asunto: 'Solicitud de equipamiento, ' + nombre, cuerpo: cuerpo }).then(function (r) {
      send.hidden = true;
      estado.innerHTML = '<b>Hemos recibido tu solicitud.</b> Te escribimos dentro de un día hábil. ' +
        (r.via === 'servidor' ? 'Te enviamos una copia a tu correo.' : 'Se abrió tu correo con la solicitud escrita: envíala para que nos llegue.');
      estado.hidden = false;
    }, function () {
      send.disabled = false; send.textContent = 'Enviar solicitud';
      estado.textContent = 'Revisa tu nombre, tu correo y que hayas marcado una categoría.'; estado.hidden = false;
    });
  });
})();
