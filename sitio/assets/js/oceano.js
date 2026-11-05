/* OCEANIC · Movimiento del sitio: entradas al hacer scroll, fotos que se descubren, portada viva y barra de avance.
   Funciona también con el contenido que se arma después de cargar (fichas, gamas, usados, Puerto).
   Sin JavaScript o con "reducir movimiento" del sistema, todo se ve quieto y completo. */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // ---------- barra de avance de lectura (todas las páginas) ----------
  var barra = document.createElement('div');
  barra.className = 'o-avance'; barra.setAttribute('aria-hidden', 'true');
  document.body.appendChild(barra);
  function avance() {
    var max = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
  }
  addEventListener('scroll', avance, { passive: true }); addEventListener('resize', avance);
  if (reduce) return;
  root.classList.add('o-anim');

  // ---------- qué entra al hacer scroll ----------
  var TEXTO = '.sec-head, section h2, .lede, .two > div > p, .story-line, .tr, .spec > *, .cards-foot, .mk-fam-head, ' +
    '.talk-h, .talk-lede, .ecat-head, .em, .steps5 li, .why p, .puerto-h2, .port-h2, .brands-h2, .stmt p, .b-hist p, .b-h2';
  var TARJETAS = '.mcard, .um, .uc, .bc, .d, .ped2, .pfeat2-grid, .u, .gal-item, .door, .chd, .dest-grid > *';
  var FOTOS = '.two img, .mk-rel img, .pfeat2-img img, .b-gal-main img';

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('o-visto');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  function preparar(scope) {
    [[TEXTO, 'o-sube'], [TARJETAS, 'o-sube'], [FOTOS, 'o-foto']].forEach(function (par) {
      [].forEach.call(scope.querySelectorAll(par[0]), function (el) {
        if (el.dataset.o || el.closest('.rv, header.hero, .hhero, .bar, .drawer, .ft, form, .form-ok, [hidden]')) return;
        el.dataset.o = '1';
        // escalonado entre hermanos (máximo 6 pasos) para que las grillas entren como una ola
        var hermanos = el.parentElement ? [].filter.call(el.parentElement.children, function (x) { return x.matches(par[0]); }) : [el];
        var i = Math.min(hermanos.indexOf(el), 5);
        if (i > 0) el.style.transitionDelay = (i * 70) + 'ms';
        el.classList.add(par[1]);
        // lo que ya está en pantalla al cargar entra de inmediato
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.92 && r.bottom > 0) requestAnimationFrame(function () { el.classList.add('o-visto'); });
        else io.observe(el);
      });
    });
    fotos(scope);
    portada(scope);
    parallax(scope);
  }

  // ---------- fotos que aparecen suave al terminar de cargar (sin saltos ni recuadros en blanco) ----------
  function fotos(scope) {
    [].forEach.call(scope.querySelectorAll('img'), function (img) {
      if (img.dataset.of || img.closest('.bar, .ft, .asis-panel')) return;
      img.dataset.of = '1';
      if (img.complete && img.naturalWidth) return;
      img.classList.add('o-img');
      function listo() { img.classList.add('o-ok'); }
      img.addEventListener('load', listo, { once: true });
      img.addEventListener('error', listo, { once: true });
    });
  }

  // ---------- portada: la foto respira y el texto entra en capas ----------
  function portada(scope) {
    [].forEach.call(scope.querySelectorAll('header.hero, .hhero, .mk-hero, .uni-hero, .phero, .ehero, .bhero, .chero-l'), function (h) {
      if (h.dataset.oh) return; h.dataset.oh = '1';
      h.classList.add('o-portada');
      var capas = h.querySelectorAll('.hero-brand, h1, .hero-purpose, .hero-sub, .hero-cta, .crumb, .mk-claim, .mk-intro, .mk-cta, p, .btn');
      [].forEach.call(capas, function (c, i) { if (i < 8) { c.classList.add('o-capa'); c.style.animationDelay = (120 + i * 110) + 'ms'; } });
    });
  }

  // ---------- parallax suave de fotos grandes ----------
  var capasP = [];
  function parallax(scope) {
    [].forEach.call(scope.querySelectorAll('header.hero .hero-img img, .story-fig img'), function (img) {
      if (img.dataset.op) return; img.dataset.op = '1'; capasP.push(img);
    });
  }
  var tick = false;
  function mover() {
    var vh = innerHeight;
    capasP.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var p = ((r.top + r.height / 2) - vh / 2) / vh;  // -1..1
      img.style.setProperty('--o-par', (p * -40).toFixed(1) + 'px');
    });
    tick = false;
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(mover); } }, { passive: true });

  // contenido que llega después (fichas, gamas, usados, Puerto)
  new MutationObserver(function (ms) {
    var hay = ms.some(function (m) { return m.addedNodes.length; });
    if (hay) { clearTimeout(preparar.t); preparar.t = setTimeout(function () { preparar(document); mover(); }, 30); }
  }).observe(document.body, { childList: true, subtree: true });
  preparar(document); mover();
})();
