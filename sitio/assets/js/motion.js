/* OCEANIC, movimiento sutil global: parallax de heros + barra translúcida.
   Respeta prefers-reduced-motion. "Como olas, nunca fuegos artificiales." */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- barra translúcida al hacer scroll ----------
  var bar = document.querySelector('.bar');
  if (bar) {
    var onScroll = function () {
      if (window.scrollY > 40) bar.classList.add('bar-float');
      else bar.classList.remove('bar-float');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (reduce) return;

  // ---------- parallax suave de imágenes de hero ----------
  // Selecciona los contenedores de media de cada hero del sitio.
  var layers = [].slice.call(document.querySelectorAll(
    '.chero-l-media img, .ehero-media img, .bhero-media, .hhero-media img, ' +
    '.chome-bg, .talk-bg, .parch-bg, .pfeat-img img, .equip-bg'
  ));
  // filtra los que no existan
  layers = layers.filter(Boolean);

  var ticking = false;
  function update() {
    var vh = window.innerHeight;
    layers.forEach(function (el) {
      var host = el.closest('section, header, .pfeat-card') || el.parentElement;
      if (!host) return;
      var r = host.getBoundingClientRect();
      // solo si está en viewport (con margen)
      if (r.bottom < -200 || r.top > vh + 200) return;
      // progreso del elemento a través del viewport: -1 (abajo) .. 1 (arriba)
      var center = r.top + r.height / 2;
      var prog = (center - vh / 2) / (vh / 2); // 0 = centrado
      // desplazamiento suave, factor pequeño
      var shift = prog * 26; // px máx
      el.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0) scale(1.08)';
    });
    ticking = false;
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  if (layers.length) {
    // escala base para que el movimiento no muestre bordes
    layers.forEach(function (el) {
      el.style.willChange = 'transform';
      el.style.transform = 'translate3d(0,0,0) scale(1.08)';
    });
    update();
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req, { passive: true });
  }
})();
