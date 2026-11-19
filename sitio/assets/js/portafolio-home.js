/* OCEANIC · Inicio: carrusel de logos, grilla «El portafolio» y bloque de universos, pintados desde OCEANIC_PORTAFOLIO
   (assets/js/portafolio-data.js, que se administra en /admin/ › Orden, categorías y marcas).
   Si faltan los datos, queda el HTML que trae la página. Debe cargarse después de catalogo-data.js y marcas-info.js
   y antes de oceano.js (así las animaciones de entrada ven el contenido ya armado). */
(function () {
  'use strict';
  var P = window.OCEANIC_PORTAFOLIO, M = window.OCEANIC_MARCAS;
  if (!P || !M || !Array.isArray(P.inicio) || !P.inicio.length) return;

  var SLUG = /^[a-z0-9-]+$/;
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // rutas relativas a assets/img/ (como en el resto del sitio) o archivos subidos desde el CMS (/media/…) o enlaces https
  function img(p) {
    p = String(p || '');
    if (!p) return '';
    return /^(https?:)?\/\//.test(p) || p.charAt(0) === '/' ? p : 'assets/img/' + p + (/\.\w{3,4}$/.test(p) ? '' : '.webp');
  }
  function href(mk, linea) { return 'marca/index.html?m=' + mk + (linea ? '&u=' + linea : ''); }

  var ocultas = {};  // marcas sin autorizar: no se muestran en ninguna parte
  P.inicio.forEach(function (x) { if (x && x.visible === false) ocultas[x.marca] = true; });

  // marcas del inicio, en el orden del portafolio, solo las visibles y que existen en la información de marcas
  var lista = P.inicio.filter(function (x) { return x && x.visible !== false && SLUG.test(x.marca || '') && M[x.marca]; });

  /* ---------- carrusel de logos ---------- */
  var pista = document.querySelector('.hlogos-pista');
  if (pista && lista.length) {
    var grupo = function (oculto) {
      return '<div' + (oculto ? ' aria-hidden="true"' : '') + ' class="hlogos-grupo">' + lista.map(function (x) {
        var nombre = M[x.marca].nombre, src = img(x.logo || M[x.marca].logo);
        return '<a class="hlogo"' + (oculto ? ' tabindex="-1"' : '') + ' href="' + href(x.marca) + '">' +
          (src ? '<img alt="' + esc(nombre) + '" loading="lazy" decoding="async" src="' + esc(src) + '" data-forma="' + (x.forma === 'alto' ? 'alto' : 'ancho') + '"/>'
               : '<span class="hlogo-txt">' + esc(nombre) + '</span>') + '</a>';
      }).join('') + '</div>';
    };
    pista.innerHTML = grupo(false) + grupo(true);
  }

  /* ---------- grilla del portafolio ---------- */
  var grilla = document.querySelector('#marcas .bgrid');
  if (grilla && lista.length) {
    grilla.innerHTML = lista.map(function (x) {
      var m = M[x.marca], foto = img(x.foto || m.hero);
      return '<a class="bc" href="' + href(x.marca) + '">' +
        '<span class="bc-img">' + (foto ? '<img alt="' + esc(m.nombre) + '" loading="lazy" src="' + esc(foto) + '"/>' : '') + '</span>' +
        '<span class="bc-body"><span class="bc-top"><span class="bc-name">' + esc(m.nombre) + '</span></span>' +
        '<span class="bc-cat">' + esc(x.subtitulo || m.universo || '') + '<span class="bc-pais">' + esc(m.pais) + '</span></span></span></a>';
    }).join('\n');
  }

  /* ---------- universos ---------- */
  var cont = document.querySelector('#universos .uni');
  var us = (P.universos || []).filter(function (u) { return u && u.visible !== false && SLUG.test(u.slug || '') && u.nombre; });
  if (cont && us.length) {
    cont.innerHTML = us.map(function (u) {
      var marcas = (u.marcas || []).filter(function (x) { return x && SLUG.test(x.marca || '') && M[x.marca] && !ocultas[x.marca]; });
      var pos = function (mk) { for (var i = 0; i < P.inicio.length; i++) if (P.inicio[i] && P.inicio[i].marca === mk) return i; return 999; };
      marcas = marcas.map(function (x, i) { return { x: x, i: i, p: pos(x.marca) }; }).sort(function (a, b) { return a.p - b.p || a.i - b.i; }).map(function (o) { return o.x; });
      var link = 'universo/index.html?u=' + u.slug, foto = img(u.hero);
      return '<article class="u">' +
        '<a class="u-img" href="' + link + '">' + (foto ? '<img alt="' + esc(u.alt || u.nombre) + '" loading="lazy" src="' + esc(foto) + '"/>' : '') + '</a>' +
        '<div class="u-txt"><span class="u-kind">' + esc(u.nombre) + '</span><ul class="u-brands">' +
        marcas.map(function (x) {
          return '<li><a href="' + href(x.marca, SLUG.test(x.linea || '') ? x.linea : '') + '">' + esc(x.etiqueta || M[x.marca].nombre) + '</a></li>';
        }).join('') + '</ul>' +
        '<a class="u-cta" href="' + link + '">Ver el universo ' + esc(u.nombre) + ' <span aria-hidden="true">→</span></a></div></article>';
    }).join('');
    var t = document.querySelector('#universos .port-h2');
    var NUM = ['', 'Un universo', 'Dos universos', 'Tres universos', 'Cuatro universos', 'Cinco universos', 'Seis universos', 'Siete universos', 'Ocho universos'];
    if (t) t.textContent = NUM[us.length] || 'Universos';
  }
})();
