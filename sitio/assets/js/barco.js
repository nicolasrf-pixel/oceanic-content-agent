/* OCEANIC, Ficha de barco usado. Lee ?id= o data-id de <body>. Datos reales de usados-data.js */
(function () {
  'use strict';
  var id = new URLSearchParams(location.search).get('id') || document.body.dataset.id;
  var U = (window.OCEANIC_USADOS || []).filter(function (x) { return x.id === id; })[0];
  var main = document.getElementById('barco');
  var AB = (document.body.dataset.assetBase || '../../assets/img/') + 'usados/';
  if (!main) return;
  if (!U) {
    main.innerHTML = '<div class="wrap-wide" style="padding:120px 0"><p class="lede">Embarcación no encontrada.</p><p><a href="../index.html">← Volver a usados</a></p></div>';
    return;
  }

  document.title = U.nombre + ', Usados | Oceanic';
  var vendido = U.estado === 'vendido';
  var TIPO = { motor: 'A motor', vela: 'Vela', catamaran: 'Catamarán' }[U.tipo] || '';
  var estadoTag = {
    disponible: '',
    reservado: '<span class="b-tag b-res">Reservado</span>',
    vendido: '<span class="b-tag b-vend">Vendido</span>'
  }[U.estado] || '';

  /* ---------- galería ---------- */
  var fotos = (U.fotos || []).map(function (f) { return f.local; });
  var galeria;
  if (fotos.length) {
    galeria = '<div class="b-gal">' +
      '<div class="b-gal-main"><img src="' + AB + fotos[0] + '" alt="' + U.nombre + '" ' +
        'onerror="this.closest(\'.b-gal\').classList.add(\'is-noimg\')"></div>' +
      (fotos.length > 1 ? '<div class="b-gal-side">' + fotos.slice(1, 3).map(function (im) {
        return '<img src="' + AB + im + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">';
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

  var precioTxt = U.precio || 'Consultar';

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
      return '<li><a href="' + d + '" target="_blank" rel="noopener">Descargar documento adjunto ↗</a></li>';
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

  var waTxt = encodeURIComponent('Hola Oceanic, me interesa el ' + U.nombre + (U.anio ? ' (' + U.anio + ')' : '') + ' que vi en usados.');
  var wa = 'https://wa.me/56229537322?text=' + waTxt;
  var mailBody = encodeURIComponent('Hola Oceanic,\n\nQuiero más información del usado:\n• ' + U.nombre + (U.anio ? ' · ' + U.anio : '') + (U.precio ? '\n• Precio publicado: ' + U.precio : '') + '\n\nMi consulta:\n');
  var mail = 'mailto:ventas@oceanic.cl?subject=' + encodeURIComponent('Usado, ' + U.nombre) + '&body=' + mailBody;

  var meta = [U.anio, (U.marca && U.marca !== '·' ? U.marca : ''), TIPO].filter(Boolean).join(' · ');

  // botón cotizador (abre el modal por-barco, mismo que los modelos nuevos)
  function cAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var cotSpecs = cAttr(JSON.stringify([
    U.anio ? {label:'Año', value:U.anio} : null,
    (U.marca && U.marca !== '·') ? {label:'Marca', value:U.marca} : null,
    precioTxt ? {label:'Precio', value:precioTxt} : null
  ].filter(Boolean)));
  function cotBtn(txt, cls){
    return '<button type="button" class="' + (cls||'btn') + '" data-cotizar data-tipo="usado"' +
      ' data-modelo="' + cAttr(U.nombre + (U.anio ? ' (' + U.anio + ')' : '')) + '"' +
      ' data-marca="' + cAttr('Usado' + (U.marca && U.marca !== '·' ? ' · ' + U.marca : '')) + '"' +
      ' data-wa="' + cAttr(wa) + '"' +
      ' data-specs="' + cotSpecs + '">' + txt + '</button>';
  }

  main.innerHTML =
    '<div class="wrap-wide b-top">' +
      '<nav class="crumb" aria-label="Ruta"><a href="../index.html">Usados</a><span>·</span><span>' + U.nombre + '</span></nav>' +
      '<div class="b-head">' +
        '<div><h1 class="b-h1">' + U.nombre + '</h1>' +
          (meta ? '<p class="b-sub">' + meta + '</p>' : '') + '</div>' +
        '<div class="b-price">' + estadoTag + '<span class="b-price-n">' + precioTxt + '</span>' +
          (vendido ? '' : cotBtn('Consultar por este barco', 'btn')) + '</div>' +
      '</div>' +
    '</div>' +
    galSec +
    '<div class="wrap-wide b-body">' +
      '<div class="b-main">' + sinInfo + prosaSec + incSec + docsSec + comoSec + '</div>' +
      '<aside class="b-aside">' + fichaSec +
        '<div class="b-cta-card">' +
          '<span class="b-cta-h">' + (vendido ? '¿Buscas algo parecido?' : '¿Te interesa?') + '</span>' +
          (vendido ? '' : cotBtn('Solicitar cotización', 'btn b-cta-wa')) +
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
      '<div class="talk-cta"><a href="' + wa + '" target="_blank" rel="noopener" class="btn">Consultar por WhatsApp</a>' +
        '<a href="' + mail + '" class="btn btn-line">Escribir por correo</a></div></div></section>';

  // menú móvil
  var bt = document.getElementById('burger'), dr = document.getElementById('drawer');
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
