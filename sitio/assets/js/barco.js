/* OCEANIC, Ficha de barco usado. Lee ?id= o data-id de <body>. Datos reales de usados-data.js */
(function () {
  'use strict';
  var id = new URLSearchParams(location.search).get('id') || document.body.dataset.id;
  var U = (window.OCEANIC_USADOS || []).filter(function (x) { return x.id === id && !x.oculto; })[0];  // oculto: como si no existiera
  var main = document.getElementById('barco');
  var AB = (document.body.dataset.assetBase || '../../assets/img/') + 'usados/';
  if (!main) return;
  if (!U) {
    main.innerHTML = '<div class="wrap-wide" style="padding:120px 0"><p class="lede">Embarcación no encontrada.</p><p><a href="../index.html">← Volver a usados</a></p></div>';
    return;
  }

  document.title = U.nombre + ', Usados | Oceanic';
  // Todo el texto viene del CMS: se escapa una vez aquí (R conserva el original para atributos y WhatsApp).
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fotoSrc(f) {  // {url, local} del build, o ruta/URL subida desde el CMS
    if (f && typeof f === 'object') return f.local ? AB + f.local + '?v=2' : (f.url || '');  // ?v=2: ver usados.js
    f = String(f || ''); return /^(https?:)?\/\//.test(f) || f.charAt(0) === '/' ? f : AB + f.replace(/^usados\//, '');
  }
  function enlace(h) { h = String(h || '').trim(); return /^https?:\/\//i.test(h) || (/^[\/#?.\w]/.test(h) && !/^[a-z][a-z0-9+.-]*:/i.test(h) && !/^\/\//.test(h)) ? h : ''; }
  var R = U;
  U = { id: R.id, nombre: esc(R.nombre), marca: esc(R.marca), tipo: R.tipo, anio: esc(R.anio), precio: esc(R.precio),
    estado: R.estado, resumen: esc(R.resumen), texto: esc(R.texto), fotos: R.fotos, docs: (R.docs || []).map(enlace).filter(Boolean) };
  var vendido = U.estado === 'vendido';
  var TIPO = { motor: 'A motor', vela: 'Vela', catamaran: 'Catamarán' }[U.tipo] || '';
  var estadoTag = {
    disponible: '',
    reservado: '<span class="b-tag b-res">Reservado</span>',
    vendido: '<span class="b-tag b-vend">Vendido</span>'
  }[U.estado] || '';

  /* ---------- galería ---------- */
  var fotos = (U.fotos && U.fotos.length ? U.fotos : (R.portada ? [R.portada] : [])).map(fotoSrc).filter(Boolean).map(esc);
  var galeria;
  if (fotos.length) {
    galeria = '<div class="b-gal">' +
      '<div class="b-gal-main"><img src="' + fotos[0] + '" alt="' + U.nombre + '" ' +
        'onerror="this.closest(\'.b-gal\').classList.add(\'is-noimg\')"></div>' +
      (fotos.length > 1 ? '<div class="b-gal-side">' + fotos.slice(1, 3).map(function (im) {
        return '<img src="' + im + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">';
      }).join('') + '</div>' : '') +
      '<div class="b-gal-ph"><span>' + (U.marca && U.marca !== '·' ? U.marca : U.nombre) + '</span></div>' +
    '</div>';
  } else {
    galeria = '<div class="b-gal is-noimg"><div class="b-gal-ph"><span>' +
      (U.marca && U.marca !== '·' ? U.marca : U.nombre) + '</span></div></div>';
  }

  /* ---------- parseo del aviso literal ----------
     El texto viene como líneas sueltas. Separamos:
       · specs  → líneas "Etiqueta: valor" o pares "Etiqueta\nvalor"
       · lista  → líneas de equipamiento (viñetas)
       · prosa  → párrafos descriptivos  */
  var lineas = (U.texto || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);

  // descartar repeticiones de nombre / precio / año sueltos al inicio
  var RUIDO = /^(característic|caracterist|detalle$|sistema$|base$|ver más|ver mas)/i;
  var specs = [], items = [], prosa = [];

  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i];
    if (RUIDO.test(l)) continue;
    if (/^\$\s*[\d.]/.test(l) || /^€/.test(l) || /^us\$?\s*[\d.]/i.test(l) || /^usd/i.test(l)) continue; // precio suelto
    if (/^\d{4}$/.test(l)) continue; // año suelto

    // "Etiqueta: valor"
    var m = l.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ°\s/().+-]{3,40}):\s*(.+)$/);
    if (m && m[2].length < 80) { specs.push([m[1].trim(), m[2].trim()]); continue; }

    // par "Etiqueta" + "valor" en líneas consecutivas (patrón de fichas estructuradas)
    var esEtiqueta = /^[A-ZÁÉÍÓÚÑ][^:]{2,30}:?$/.test(l) && l.split(' ').length <= 4;
    var sig = lineas[i + 1];
    if (esEtiqueta && sig && !/[.]$/.test(l) && /^[\d]|^(sí|si|no|incluid|eléctric|fibra|chile|valpar|bueno|enroll)/i.test(sig) && sig.length < 40) {
      specs.push([l.replace(/:$/, ''), sig]); i++; continue;
    }

    // equipamiento corto → item de lista
    if (l.length <= 60 && !/[.]$/.test(l)) { items.push(l); continue; }

    prosa.push(l);
  }

  var precioTxt = U.precio || (vendido ? '' : 'Consultar');

  var galSec = '<div class="wrap-wide">' + galeria + '</div>';

  var prosaSec = prosa.length ? '<div class="b-hist"><h2 class="b-h2">Sobre esta unidad</h2>' +
    prosa.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>' : '';

  var fichaSec = specs.length ? '<div class="b-spec"><h2 class="b-h2">Ficha</h2><dl class="b-spec-grid">' +
    specs.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') +
    '</dl></div>' : '';

  var incSec = items.length ? '<div class="b-inc"><h2 class="b-h2">Equipamiento destacado</h2><ul class="b-inc-list">' +
    items.map(function (it) { return '<li>' + it + '</li>'; }).join('') + '</ul></div>' : '';

  var docsSec = (U.docs && U.docs.length) ? '<div class="b-docs"><h2 class="b-h2">Documentos</h2><ul class="b-docs-list">' +
    U.docs.map(function (d) {
      return '<li><a href="' + esc(d) + '" target="_blank" rel="noopener">Descargar documento adjunto ↗</a></li>';
    }).join('') + '</ul></div>' : '';

  var sinInfo = (!prosa.length && !specs.length && !items.length) ?
    '<div class="b-hist"><p class="lede">Esta unidad aún no tiene ficha publicada. Escríbenos y te enviamos fotos, estado y precio al día.</p></div>' : '';

  var comoSec =
    '<div class="b-como"><h2 class="b-h2">Cómo es la compra</h2>' +
    '<ol class="b-como-list">' +
      '<li><b>Conversamos</b><span>Nos cuentas qué buscas y coordinamos ver el barco. Está donde dice la ficha.</span></li>' +
      '<li><b>Visita y prueba</b><span>Lo revisas en persona y, si corresponde, salimos al agua.</span></li>' +
      '<li><b>Documentación</b><span>Revisamos matrícula, papeles y estado legal. Todo transparente.</span></li>' +
      '<li><b>Cierre y entrega</b><span>Acompañamos la transferencia y quedamos disponibles después.</span></li>' +
    '</ol></div>';

  var waTxt = encodeURIComponent('Hola Oceanic, me interesa el ' + R.nombre + (R.anio ? ' (' + R.anio + ')' : '') + ' que vi en usados.');
  var wa = 'https://wa.me/56229537322?text=' + waTxt;

  var meta = [U.anio, (U.marca && U.marca !== '·' ? U.marca : ''), TIPO].filter(Boolean).join(' · ');

  function cAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  // botones que bajan al formulario de la página (el mismo en todas las fichas de barco)
  function irBtn(txt, cls){ return '<a href="#consultar" class="' + (cls||'btn') + '" data-ir-form>' + txt + '</a>'; }
  var nombreFicha = R.nombre + (R.anio ? ' (' + R.anio + ')' : '');
  var HP = '<input name="web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">';
  var formulario =
    '<div class="two talk-form">' +
      '<div>' +
        '<h3 class="talk-h3">' + (vendido ? 'Cuéntanos qué buscas' : 'Consulta por el ' + U.nombre) + '</h3>' +
        '<p class="lede" style="margin-top:18px">' + (vendido
          ? 'Te avisamos cuando entre una unidad parecida.'
          : 'Te contamos su estado, coordinamos una visita y revisamos la documentación.') + '</p>' +
        '<a class="btn talk-wa" href="' + wa + '" target="_blank" rel="noopener">Consultar por WhatsApp</a>' +
        '<span class="talk-or">o déjanos tus datos y te escribimos →</span>' +
      '</div>' +
      '<div>' +
        '<form data-form="usado" data-ficha="' + cAttr(U.id || '') + '" data-modelo="' + cAttr(nombreFicha) + '" data-marca="' + cAttr('Usado' + (R.marca && R.marca !== '·' ? ' · ' + R.marca : '')) + '" data-ok="#cokUsado" novalidate>' + HP +
          '<div class="row">' +
            '<div><label for="cz-n">Nombre</label><input id="cz-n" name="nombre" required autocomplete="name"></div>' +
            '<div><label for="cz-e">Correo</label><input id="cz-e" name="email" type="email" required autocomplete="email" inputmode="email"></div>' +
          '</div>' +
          '<div class="row">' +
            '<div><label for="cz-t">Teléfono <span style="text-transform:none;letter-spacing:0">(opcional)</span></label><input id="cz-t" name="telefono" type="tel" autocomplete="tel" inputmode="tel"></div>' +
            '<div></div>' +
          '</div>' +
          '<div><label for="cz-m">Tu consulta</label>' +
            '<textarea id="cz-m" name="mensaje" placeholder="' + (vendido ? 'Qué tipo de barco buscas, eslora y presupuesto aproximado.' : 'Qué te gustaría saber del barco y cuándo podrías verlo.') + '"></textarea></div>' +
          '<label class="check"><input name="puerto" type="checkbox">' +
            '<span>Quiero recibir <b>Puerto</b>, lanzamientos, premios, eventos y técnica útil. Cuando hay algo que contar, no por calendario.</span></label>' +
          '<div class="form-foot"><button class="btn" type="submit">Enviar consulta</button>' +
            '<span class="form-note">Te respondemos dentro de un día hábil.</span></div>' +
        '</form>' +
        '<div class="form-ok" hidden id="cokUsado" role="status" tabindex="-1">' +
          '<h3 class="talk-h3">Gracias por tu consulta</h3>' +
          '<p class="lede" style="margin-top:12px">Un especialista de Oceanic te escribe dentro de un día hábil. <span data-via></span></p>' +
        '</div>' +
      '</div>' +
    '</div>';

  main.innerHTML =
    '<div class="wrap-wide b-top">' +
      '<nav class="crumb" aria-label="Ruta"><a href="../index.html">Usados</a><span>·</span><span>' + U.nombre + '</span></nav>' +
      '<div class="b-head">' +
        '<div><h1 class="b-h1">' + U.nombre + '</h1>' +
          (meta ? '<p class="b-sub">' + meta + '</p>' : '') + '</div>' +
        '<div class="b-price">' + estadoTag + '<span class="b-price-n">' + precioTxt + '</span>' +
          (vendido ? '' : irBtn('Consultar por este barco', 'btn')) + '</div>' +
      '</div>' +
    '</div>' +
    galSec +
    '<div class="wrap-wide b-body">' +
      '<div class="b-main">' + sinInfo + prosaSec + incSec + docsSec + comoSec + '</div>' +
      '<aside class="b-aside">' + fichaSec +
        '<div class="b-cta-card">' +
          '<span class="b-cta-h">' + (vendido ? '¿Buscas algo parecido?' : '¿Te interesa?') + '</span>' +
          (vendido ? '' : irBtn('Solicitar cotización', 'btn b-cta-wa')) +
          '<a href="' + wa + '" target="_blank" rel="noopener" class="btn btn-line">Consultar por WhatsApp</a>' +
        '</div>' +
      '</aside>' +
    '</div>' +
    '<section class="talk" id="consultar"><img class="talk-bg" src="' + (document.body.dataset.assetBase || '../../assets/img/') + 'talk.webp" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<div class="wrap-wide"><div class="sec-head"><span class="eyebrow" style="color:var(--boya)">Conversemos</span></div>' +
      '<h2 class="talk-h">' + (vendido ? 'Este barco<br>ya se vendió' : '¿Coordinamos<br>una visita?') + '</h2>' +
      '<p class="lede talk-lede">' + (vendido
        ? 'Recibimos unidades parecidas seguido. Cuéntanos qué buscas y te avisamos cuando entre algo.'
        : 'Vemos el barco juntos, resolvemos dudas y revisamos la documentación completa. Sin apuro.') + '</p>' +
      formulario + '</div></section>';

  [].forEach.call(main.querySelectorAll('[data-ir-form]'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('consultar').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () { var n = document.getElementById('cz-n'); if (n) n.focus({ preventScroll: true }); }, 500);
    });
  });

  // menú móvil
  var bt = (window.OCEANIC_MENU ? null : document.getElementById('burger')), dr = document.getElementById('drawer');
  if (bt && dr) {
    bt.addEventListener('click', function () {
      var open = dr.hasAttribute('hidden');
      if (open) { dr.removeAttribute('hidden'); document.body.classList.add('locked'); }
      else { dr.setAttribute('hidden', ''); document.body.classList.remove('locked'); }
      bt.classList.toggle('on', open);
    });
    dr.addEventListener('click', function (e) { if (e.target.tagName === 'A') { dr.setAttribute('hidden', ''); document.body.classList.remove('locked'); bt.classList.remove('on'); } });
  }
})();
