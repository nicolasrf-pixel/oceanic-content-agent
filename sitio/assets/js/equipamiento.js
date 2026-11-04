/* OCEANIC, Equipamiento: renderiza logos + categorías desde data */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = window.OCEANIC_EQUIPAMIENTO;
  if (!D) return;

  // tira de logos (wordmarks tipográficos)
  document.getElementById('elogos').innerHTML =
    '<div class="wrap-wide"><div class="elogos-row">' +
    D.logos.map(function (n) { return '<span class="elogo">' + n + '</span>'; }).join('') +
    '</div></div>';

  // categorías, compacto, cada ítem con WhatsApp + cotizador por correo
  document.getElementById('ecats').innerHTML = D.categorias.map(function (c, i) {
    var marcas = c.marcas.map(function (m) {
      var wa = 'https://wa.me/56229537322?text=' +
        encodeURIComponent('Hola Oceanic, quiero información sobre ' + m.nombre + ' (' + c.titulo + ').');
      var mailto = 'mailto:ventas@oceanic.cl?subject=' +
        encodeURIComponent('Consulta equipamiento, ' + m.nombre) +
        '&body=' + encodeURIComponent('Hola Oceanic, quiero cotizar / recibir información sobre ' + m.nombre + ' (' + c.titulo + ').\n\nMi embarcación: \nLo que necesito: ');
      return '<div class="em">' +
        '<div class="em-txt"><h3 class="em-name">' + m.nombre + '</h3>' +
        '<p class="em-desc">' + m.desc + '</p></div>' +
        '<div class="em-acts">' +
          '<a class="em-wa" href="' + wa + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<a class="em-mail" href="' + mailto + '">Cotizar por correo</a>' +
        '</div></div>';
    }).join('');
    return '<section class="ecat">' +
      '<div class="wrap-wide">' +
        '<div class="ecat-head">' +
          '<span class="ecat-n">0' + (i + 1) + '</span>' +
          '<div><h2 class="ecat-h2">' + c.titulo + '</h2>' +
          '<p class="ecat-lede">' + c.lede + '</p></div>' +
        '</div>' +
        '<div class="em-grid">' + marcas + '</div>' +
      '</div></section>';
  }).join('');

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
    var sel = '.ecat-head, .em, .elogo';
    [].slice.call(document.querySelectorAll('.em')).forEach(function (el, i) { el.dataset.i = i; });
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

/* ---- Formulario de solicitud con selector múltiple → correo a ventas ---- */
(function () {
  'use strict';
  var send = document.getElementById('efSend');
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
    var tel = val('ef-tel'), barco = val('ef-barco'), msg = val('ef-msg');
    var cuerpo = 'Hola Oceanic, quiero información de equipamiento.\n\n' +
      'Me interesa:\n• ' + cats.join('\n• ') +
      '\n\nDatos de contacto:\n• Nombre: ' + nombre +
      '\n• Correo: ' + correo +
      (tel ? '\n• Teléfono: ' + tel : '') +
      (barco ? '\n• Embarcación: ' + barco : '') +
      (msg ? '\n\nComentario:\n' + msg : '');
    var mailto = 'mailto:ventas@oceanic.cl?subject=' +
      encodeURIComponent('Solicitud de equipamiento, ' + nombre) +
      '&body=' + encodeURIComponent(cuerpo);
    window.location.href = mailto;
  });
})();
