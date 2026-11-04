/* Oceanic, Home
   1. Hero en video   2. Revelado al scroll   3. Menú móvil
*/
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. HERO VIDEO (MP4 self-hosted) ----------
     Fondo, no contenido. El titular y los CTA viven en HTML.
     No carga en 2G, ahorro de datos, móvil ni movimiento reducido. */
  (function () {
    var v = document.querySelector('.hhero-vid'),
        hero = document.querySelector('.hhero');
    if (!v || !hero) return;

    var conn = navigator.connection || {},
        slow = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || ''),
        small = window.matchMedia('(max-width: 700px)').matches;

    if (reduce || slow || small) return;   // queda el poster

    function load() {
      if (v.src) return;
      v.src = v.dataset.src;
      v.load();
      var p = v.play();
      if (p && p.catch) p.catch(function(){});
      v.addEventListener('playing', function () { hero.classList.add('playing'); }, { once: true });
    }

    if (document.readyState === 'complete') setTimeout(load, 300);
    else window.addEventListener('load', function () { setTimeout(load, 300); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { if (v.src) v.play().catch(function(){}); }
          else v.pause();
        });
      }, { threshold: 0.1 }).observe(hero);
    }
  })();

  /* ---------- 2. REVELADO AL SCROLL ---------- */
  (function () {
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = '.brands-h2, .bc, .port-h2, .port-lede, .u, .d, .why-txt, .why-fig, .steps5 li, .used-txt, .uc, .equip-txt, .equip-cats, .puerto-h2, .puerto-lede, .pz-i, .talk-h, .talk-lede';
    var els = [].slice.call(document.querySelectorAll(sel));
    ['.bc', '.u', '.d', '.steps5 li', '.uc', '.pz-i'].forEach(function (s) {
      [].slice.call(document.querySelectorAll(s)).forEach(function (el, i) { el.dataset.i = i; });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = parseInt(e.target.dataset.i || 0, 10);
        setTimeout(function () { e.target.classList.add('on'); }, i * 70);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  })();

  /* ---------- 3. MENÚ MÓVIL ---------- */
  (function () {
    var b = document.getElementById('burger'), d = document.getElementById('drawer');
    if (!b || !d) return;
    b.addEventListener('click', function () {
      var open = d.hasAttribute('hidden');
      if (open) { d.removeAttribute('hidden'); document.body.classList.add('locked'); }
      else { d.setAttribute('hidden', ''); document.body.classList.remove('locked'); }
      b.classList.toggle('on', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    d.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        d.setAttribute('hidden', ''); document.body.classList.remove('locked');
        b.classList.remove('on'); b.setAttribute('aria-expanded', 'false');
      }
    });
  })();
})();
