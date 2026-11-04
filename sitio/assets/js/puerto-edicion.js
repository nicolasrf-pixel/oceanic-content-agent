/* OCEANIC · Puerto: página de una edición (?ed=<slug>). Bloques componibles: "noticia" y "guia".
   Escapa todo el texto y solo acepta enlaces seguros (ruta relativa, absoluta interna, ancla o http/https). */
(function () {
  'use strict';
  var main = document.getElementById('edicion'); if (!main) return;
  var AB = document.body.dataset.assetBase || '../../assets/img/';
  var slug = new URLSearchParams(location.search).get('ed') || '';
  var ed = (window.OCEANIC_PUERTO || []).filter(function (e) { return e.slug === slug; })[0];
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
  document.title = 'Puerto ' + ed.mes + ' · El newsletter de Oceanic';

  function noticia(b) {
    var gal = (b.galeria || []).slice(0, 9);
    return '<article class="pnot">' +
      (b.etiqueta ? '<span class="pnot-tag">' + esc(b.etiqueta) + '</span>' : '') +
      '<h2 class="pnot-h">' + esc(b.titular) + '</h2>' +
      (b.bajada ? '<p class="pnot-baj">' + esc(b.bajada) + '</p>' : '') +
      (b.cuerpo || []).map(function (p) { return '<p class="pnot-p">' + esc(p) + '</p>'; }).join('') +
      (gal.length ? '<div class="pnot-gal pnot-gal-' + Math.min(gal.length, 3) + '">' + gal.map(function (g) {
        return '<img src="' + esc(img(g)) + '" alt="" loading="lazy">'; }).join('') + '</div>' : '') +
      ((b.specs || []).length ? '<dl class="pnot-specs">' + b.specs.map(function (s) {
        return '<div><dt>' + esc(s.label) + '</dt><dd>' + esc(s.value) + '</dd></div>'; }).join('') + '</dl>' : '') +
      (b.evento && (b.evento.fecha || b.evento.lugar || b.evento.texto) ? '<div class="pnot-ev">' +
        (b.evento.fecha ? '<b>' + esc(b.evento.fecha) + '</b>' : '') + (b.evento.lugar ? '<span>' + esc(b.evento.lugar) + '</span>' : '') +
        (b.evento.texto ? '<p>' + esc(b.evento.texto) + '</p>' : '') + '</div>' : '') +
      (b.cta && b.cta.texto && href(b.cta.href) ? '<a class="btn pnot-cta" href="' + esc(href(b.cta.href)) + '">' + esc(b.cta.texto) + '</a>' : '') +
    '</article>';
  }
  function guia(b) {
    return '<article class="pnot pguia"><span class="pnot-tag">Guía técnica</span><h2 class="pnot-h">' + esc(b.titular) + '</h2>' +
      '<ol class="pguia-pasos">' + (b.pasos || []).map(function (p, i) {
        return '<li><span class="pguia-n">' + esc(p.n || String(i + 1).padStart(2, '0')) + '</span><div><b>' + esc(p.titulo) + '</b>' +
          ((p.puntos || []).length ? '<ul>' + p.puntos.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div></li>';
      }).join('') + '</ol></article>';
  }
  var R = { noticia: noticia, guia: guia };

  main.innerHTML =
    '<header class="phero"><div class="wrap-wide phero-in"><nav aria-label="Ruta" class="crumb"><a href="../../index.html">Oceanic</a><span>·</span><a href="../">Puerto</a><span>·</span><span>' + esc(ed.mes) + '</span></nav>' +
    '<h1 class="phero-h1" style="font-size:clamp(44px,6vw,110px)">Puerto · ' + esc(ed.mes) + '</h1>' +
    (ed.resumen ? '<p class="phero-sub">' + esc(ed.resumen) + '</p>' : '') +
    (href(ed.pdf) ? '<p style="margin-top:22px"><a class="pfeat-link" href="' + esc(href(ed.pdf)) + '" target="_blank" rel="noopener">Descargar la edición en PDF ↗</a></p>' : '') +
    '</div></header>' +
    (ed.portada ? '<div class="ped-portada wrap-wide"><img src="' + esc(img(ed.portada)) + '" alt="Puerto ' + esc(ed.mes) + '"></div>' : '') +
    '<section class="pbloques"><div class="wrap-wide">' + (ed.bloques || []).map(function (b) { return R[b.type] ? R[b.type](b) : ''; }).join('') +
    '<p class="parch-more"><a href="../">← Todas las ediciones</a></p></div></section>';
})();
