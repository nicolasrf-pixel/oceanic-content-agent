/* OCEANIC · Modelos destacados de la portada.
   La lista sale de publicacion.js ("destacados"), que elegirá el administrador. Foto, nombre y descripción vienen del
   catálogo (datos oficiales). Un modelo apagado o inexistente no se muestra. */
(function () {
  'use strict';
  var cont = document.getElementById('destacados');
  var C = window.OCEANIC_CATALOGO, M = window.OCEANIC_MARCAS || {}, P = window.OCEANIC_PUBLICACION || {};
  if (!cont || !C) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var html = (P.destacados || []).map(function (clave) {
    var p = clave.split('/'), marca = p[0], cat = C[marca];
    var mo = cat && cat.modelos.filter(function (x) { return x.slug === p[1]; })[0];
    if (!mo) return '';
    var nombreMarca = (M[marca] && M[marca].nombre) || cat.nombre || marca;
    return '<a class="d" href="marca/index.html?m=' + esc(marca) + '&amp;modelo=' + esc(mo.slug) + '">' +
      (mo.hero ? '<div class="d-img"><img alt="' + esc(mo.nombre) + '" loading="lazy" src="assets/img/' + esc(mo.hero) + '" onerror="this.parentNode.remove()"></div>' : '') +
      '<div class="d-txt"><span class="d-brand">' + esc(nombreMarca) + '</span><h3>' + esc(mo.nombre.replace(nombreMarca + ' ', '')) + '</h3>' +
      (mo.desc ? '<p>' + esc(mo.desc) + '</p>' : '') + '</div></a>';
  }).join('');
  if (html) cont.innerHTML = html; else cont.closest('section').remove();
})();
