/* OCEANIC · Puerto: índice de ediciones (puerto-data.js, lo administra el CMS).
   Ordena por fecha (la más nueva es la destacada). Todo el texto se escapa antes de insertarlo. */
(function () {
  'use strict';
  var P = (window.OCEANIC_PUERTO || []).filter(function (e) { return !e.oculto; }), cont = document.getElementById('puertoEd');
  if (!cont) return;
  var AB = document.body.dataset.assetBase || '../assets/img/';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function img(p) { p = String(p || ''); if (!p) return ''; if (/^(https?:)?\/\//.test(p) || p.charAt(0) === '/') return p; return AB + p + (/\.\w{3,4}$/.test(p) ? '' : '.webp'); }
  function url(ed) { return 'edicion/?ed=' + encodeURIComponent(ed.slug); }
  function nombre(ed) { return ed.serie === '' ? ed.mes : (ed.serie && ed.serie !== 'Puerto' ? ed.serie + ' · ' : '') + ed.mes; }
  function tapa(ed) { return ed.tapa || ed.portada; }
  function titulares(ed) { return (ed.bloques || []).filter(function (b) { return b.titular; }); }

  P.sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); });
  if (!P.length) { cont.innerHTML = '<section class="parch2"><div class="wrap-wide"><p class="parch-lede">Pronto, la primera edición.</p></div></section>'; return; }
  var d = P[0], resto = P.slice(1);

  var feat = '<section class="pfeat2"><div class="wrap-wide">' +
    '<div class="sec-head"><span class="eyebrow">Última edición</span><span class="rule"></span></div>' +
    '<a class="pfeat2-grid" href="' + url(d) + '" style="text-decoration:none;color:inherit">' +
      '<div class="pfeat2-img pfeat2-tapa">' + (tapa(d) ? '<img src="' + esc(img(tapa(d))) + '" alt="Portada de ' + esc(nombre(d)) + '">' : '') + '</div>' +
      '<div class="pfeat2-body"><span class="pfeat2-mes">' + esc(nombre(d)) + '</span>' +
      '<p class="pfeat2-res">' + esc(d.resumen) + '</p>' +
      '<ul class="ped-notas">' + titulares(d).map(function (b) {
        return '<li><b>' + esc(b.titular) + '</b>' + (b.bajada ? '<span>' + esc(b.bajada) + '</span>' : '') + '</li>';
      }).join('') + '</ul><p class="pfeat-link" style="margin-top:22px">Leer la edición →</p></div>' +
    '</a></div></section>';

  var arch = resto.length ? '<section class="parch2"><div class="wrap-wide">' +
    '<div class="sec-head"><span class="eyebrow">El archivo</span><span class="rule"></span></div>' +
    '<h2 class="parch2-h2">Ediciones anteriores</h2><div class="parch2-grid">' + resto.map(function (ed) {
      return '<a class="ped2" href="' + url(ed) + '" style="text-decoration:none;color:inherit">' +
        '<div class="ped2-img' + (ed.tapa ? ' ped2-tapa' : '') + '">' + (tapa(ed) ? '<img src="' + esc(img(tapa(ed))) + '" alt="Portada de ' + esc(nombre(ed)) + '" loading="lazy">' : '') + '</div>' +
        '<div class="ped2-body"><span class="ped2-mes">' + esc(nombre(ed)) + '</span>' +
        '<p class="ped2-res">' + esc(ed.resumen) + '</p>' +
        '<span class="ped2-n">' + titulares(ed).length + ' notas · Leer →</span>' +
        '</div></a>';
    }).join('') + '</div></div></section>' : '';
  cont.innerHTML = feat + arch;
})();
