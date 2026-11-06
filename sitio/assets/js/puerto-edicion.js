/* OCEANIC · Puerto: página de una edición (?ed=<slug>). Bloques componibles: "noticia" y "guia".
   Escapa todo el texto y solo acepta enlaces seguros (ruta relativa, absoluta interna, ancla o http/https). */
(function () {
  'use strict';
  var main = document.getElementById('edicion'); if (!main) return;
  var AB = document.body.dataset.assetBase || '../../assets/img/';
  var slug = new URLSearchParams(location.search).get('ed') || '';
  var ed = (window.OCEANIC_PUERTO || []).filter(function (e) { return e.slug === slug && !e.oculto; })[0];  // oculta: como si no existiera
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function img(p) { p = String(p || ''); if (!p) return ''; if (/^(https?:)?\/\//.test(p) || p.charAt(0) === '/') return p; return AB + p + (/\.\w{3,4}$/.test(p) ? '' : '.webp'); }
  function href(h) {
    h = String(h || '').trim();
    if (/^https?:\/\//i.test(h)) return h;
    if (/^[a-z][a-z0-9+.-]*:/i.test(h) || /^\/\//.test(h) || /[\u0000-\u001f]/.test(h)) return '';
    return h;  // relativa, /absoluta interna, #ancla, ?consulta
  }
  if (!ed) {
    document.title = 'Edición no encontrada · Puerto | Oceanic';
    main.innerHTML = '<header class="phero"><div class="wrap-wide phero-in"><nav aria-label="Ruta" class="crumb"><a href="../../index.html">Oceanic</a><span>·</span><a href="../">Puerto</a></nav>' +
      '<h1 class="phero-h1" style="font-size:clamp(40px,5vw,90px)">Edición no encontrada</h1><p class="phero-sub">Puede que el enlace esté incompleto. <a href="../" style="color:#fff">Ver todas las ediciones</a>.</p></div></header>';
    return;
  }
  var nombreEd = ed.serie === '' ? ed.mes : (ed.serie || 'Puerto') + ' · ' + ed.mes;  // Puerto, Bitácora o News (archivo)
  document.title = nombreEd + ' · El newsletter de Oceanic';

  // Foto principal del bloque: ancha sobre el texto, o al lado (foto_lado) cuando es vertical o pequeña
  function foto(b) {
    // si es la misma foto de la portada de la edición, no se repite
    return b.foto ? '<figure class="pnot-foto' + (b.foto_lado ? ' pnot-foto-lado' : '') + '"><img src="' + esc(img(b.foto)) + '" alt="" loading="lazy"></figure>' : '';
  }
  function cabeza(b) {
    return (b.logo ? '<img class="pnot-logo" src="' + esc(img(b.logo)) + '" alt="" loading="lazy">' : '') +
      (b.etiqueta ? '<span class="pnot-tag">' + esc(b.etiqueta) + '</span>' : '') +
      '<h2 class="pnot-h">' + esc(b.titular) + '</h2>' +
      (b.bajada ? '<p class="pnot-baj">' + esc(b.bajada) + '</p>' : '') +
      (b.cuerpo || []).map(function (p) { return '<p class="pnot-p">' + esc(p) + '</p>'; }).join('');
  }
  function noticia(b, i) {
    var gal = (b.galeria || []).slice(0, 9);
    return '<article class="pnot' + (b.foto_lado ? ' pnot-con-lado' : '') + '" id="tema-' + (i + 1) + '">' + foto(b) + '<div class="pnot-cuerpo">' + cabeza(b) +
      (gal.length ? '<div class="pnot-gal pnot-gal-' + Math.min(gal.length, 3) + '">' + gal.map(function (g) {
        return '<img src="' + esc(img(g)) + '" alt="" loading="lazy">'; }).join('') + '</div>' : '') +
      ((b.specs || []).length ? '<dl class="pnot-specs">' + b.specs.map(function (s) {
        return '<div><dt>' + esc(s.label) + '</dt><dd>' + esc(s.value) + '</dd></div>'; }).join('') + '</dl>' : '') +
      (b.evento && (b.evento.fecha || b.evento.lugar || b.evento.texto) ? '<div class="pnot-ev">' +
        (b.evento.fecha ? '<b>' + esc(b.evento.fecha) + '</b>' : '') + (b.evento.lugar ? '<span>' + esc(b.evento.lugar) + '</span>' : '') +
        (b.evento.texto ? '<p>' + esc(b.evento.texto) + '</p>' : '') + '</div>' : '') +
      videos(b) + fichas(b) +
      (b.cta && b.cta.texto && href(b.cta.href) ? '<a class="btn pnot-cta" href="' + esc(href(b.cta.href)) + '">' + esc(b.cta.texto) + '</a>' : '') +
    '</div></article>';
  }
  // Videos: se llaman desde YouTube (sin cookies), Vimeo o el archivo MP4 solo al apretar reproducir
  function videos(b) {
    var V = (b.videos || []).filter(function (v) { return v && (v.id || v.src); });
    if (!V.length) return '';
    var poster = b.foto || (b.galeria || [])[0] || '';
    return '<div class="pnot-vids">' + V.map(function (v) {
      return '<button type="button" class="pnot-vid" data-tipo="' + esc(v.tipo) + '" data-v="' + esc(v.id || v.src) + '" aria-label="Reproducir video">' +
        (poster ? '<img src="' + esc(img(poster)) + '" alt="" loading="lazy">' : '') + '<span class="pnot-play" aria-hidden="true"></span><span class="pnot-vid-et">Ver video</span></button>';
    }).join('') + '</div>';
  }
  // Enlaces a las fichas de los barcos que menciona la nota (sitio nuevo)
  function fichas(b) {
    var F = (b.fichas || []).filter(function (f) { return f && f.nombre && href(f.href); });
    return F.length ? '<p class="pnot-fichas"><span>Ver ficha</span>' + F.map(function (f) {
      return '<a href="' + esc(href(f.href)) + '">' + esc(f.nombre) + ' →</a>'; }).join('') + '</p>' : '';
  }
  document.addEventListener('click', function (e) {
    var bt = e.target.closest && e.target.closest('.pnot-vid'); if (!bt) return;
    var t = bt.getAttribute('data-tipo'), v = bt.getAttribute('data-v'), el;
    if (t === 'youtube' && /^[\w-]{11}$/.test(v)) { el = document.createElement('iframe'); el.src = 'https://www.youtube-nocookie.com/embed/' + v + '?autoplay=1&rel=0'; }
    else if (t === 'vimeo' && /^\d+$/.test(v)) { el = document.createElement('iframe'); el.src = 'https://player.vimeo.com/video/' + v + '?autoplay=1&dnt=1'; }
    else if (t === 'mp4' && /^https:\/\//.test(v)) { el = document.createElement('video'); el.src = v; el.controls = true; el.autoplay = true; el.playsInline = true; }
    else return;
    if (el.tagName === 'IFRAME') { el.allow = 'autoplay; fullscreen; picture-in-picture'; el.allowFullscreen = true; el.title = 'Video'; }
    el.className = 'pnot-vid-on'; bt.replaceWith(el);
  });
  // «Etiqueta: texto» → etiqueta en negrita
  function punto(x) { var m = /^([^:]{2,40}):\s+(.+)$/.exec(String(x)); return m ? '<b>' + esc(m[1]) + '</b> ' + esc(m[2]) : esc(x); }
  function guia(b, i) {
    if (!b.etiqueta) b = Object.assign({ etiqueta: 'Guía técnica' }, b);
    return '<article class="pnot pguia' + (b.foto_lado ? ' pnot-con-lado' : '') + '" id="tema-' + (i + 1) + '">' + foto(b) + '<div class="pnot-cuerpo">' + cabeza(b) +
      '<ol class="pguia-pasos">' + (b.pasos || []).map(function (p, k) {
        return '<li><span class="pguia-n">' + esc(p.n || String(k + 1).padStart(2, '0')) + '</span><div><b class="pguia-t">' + esc(p.titulo) + '</b>' +
          (p.sub ? '<span class="pguia-sub">' + esc(p.sub) + '</span>' : '') +
          ((p.puntos || []).length ? '<ul>' + p.puntos.map(function (x) { return '<li>' + punto(x) + '</li>'; }).join('') + '</ul>' : '') + '</div></li>';
      }).join('') + '</ol></div></article>';
  }
  var R = { noticia: noticia, guia: guia };

  main.innerHTML =
    '<header class="phero"><div class="wrap-wide phero-in"><nav aria-label="Ruta" class="crumb"><a href="../../index.html">Oceanic</a><span>·</span><a href="../">Puerto</a><span>·</span><span>' + esc(ed.mes) + '</span></nav>' +
    '<div class="phero-ed">' + (ed.tapa ? '<img class="phero-tapa" src="' + esc(img(ed.tapa)) + '" alt="Portada de ' + esc(nombreEd) + '">' : '') + '<div>' +
    '<h1 class="phero-h1 ped-h1">' + esc(nombreEd) + '</h1>' +
    (ed.resumen ? '<p class="phero-sub">' + esc(ed.resumen) + '</p>' : '') +
    (href(ed.pdf) ? '<p style="margin-top:22px"><a class="pfeat-link" href="' + esc(href(ed.pdf)) + '" target="_blank" rel="noopener">Descargar la edición en PDF ↗</a></p>' : '') +
    '</div></div></div></header>' +

    ((ed.bloques || []).length > 1 ? '<nav class="ped-indice wrap-wide" aria-label="En esta edición"><span>En esta edición</span>' +
      ed.bloques.map(function (b, i) { return '<a href="#tema-' + (i + 1) + '">' + esc(b.titular) + '</a>'; }).join('') + '</nav>' : '') +
    // cada nota en su propia banda, alternando blanco y gris claro, para que la edición no se lea como un solo bloque
    (ed.bloques || []).map(function (b, i) { return R[b.type] ? '<section class="pbloques pbanda' + (i % 2 ? ' pbanda-alt' : '') + '"><div class="wrap-wide">' + R[b.type](b, i) + '</div></section>' : ''; }).join('') +
    '<section class="pbloques"><div class="wrap-wide"><p class="parch-more"><a href="../">← Todas las ediciones</a></p></div></section>';
})();
