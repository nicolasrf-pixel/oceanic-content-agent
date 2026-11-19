/* Oceanic, Portada de marca
   1. Hero en video (YouTube sin chrome, o self-hosted)
   2. Filtro de gama
   3. Contador de cifras
   4. Revelado al scroll
   5. Menú móvil
*/

(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. HERO VIDEO ----------
     Carga diferida: el poster se muestra primero y el video entra cuando puede.
     No carga en conexiones lentas, en ahorro de datos ni con movimiento reducido.
     El titular y el CTA viven en HTML: el video nunca porta información. */
  (function () {
    var hero = document.querySelector('.bhero'),
        slot = document.getElementById('videoSlot'),
        toggle = document.getElementById('vidToggle');
    if (!hero || !slot) return;

    var conn = navigator.connection || {},
        slow = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || ''),
        small = window.matchMedia('(max-width: 700px)').matches;

    if (reduce || slow || small) {
      if (toggle) toggle.hidden = true;
      return;
    }

    var id = slot.dataset.video, frame = null, playing = false;

    function mount() {
      if (frame) return;
      frame = document.createElement('iframe');
      // Reproductor limpio: sin controles, sin info, sin relacionados de otros canales
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&mute=1&loop=1&playlist=' + id +
        '&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3&start=10';
      frame.setAttribute('title', 'Video de fondo Axopar');
      frame.setAttribute('tabindex', '-1');
      frame.setAttribute('aria-hidden', 'true');
      frame.allow = 'autoplay; encrypted-media';
      slot.appendChild(frame);
      // margen para que el video arranque antes del fundido
      setTimeout(function () { hero.classList.add('playing'); playing = true; }, 900);
    }

    function unmount() {
      hero.classList.remove('playing');
      playing = false;
      setTimeout(function () { if (frame) { frame.remove(); frame = null; } }, 700);
    }

    // arranca cuando la página está lista, no antes
    if (document.readyState === 'complete') setTimeout(mount, 400);
    else window.addEventListener('load', function () { setTimeout(mount, 400); });

    // pausa cuando el hero sale de pantalla: no gastar recursos de fondo
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting && playing && frame) unmount();
          else if (e.isIntersecting && !playing && toggle && toggle.getAttribute('aria-pressed') === 'false') mount();
        });
      }, { threshold: 0.15 }).observe(hero);
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        var paused = toggle.getAttribute('aria-pressed') === 'true';
        if (paused) {
          toggle.setAttribute('aria-pressed', 'false');
          toggle.setAttribute('aria-label', 'Pausar video de fondo');
          mount();
        } else {
          toggle.setAttribute('aria-pressed', 'true');
          toggle.setAttribute('aria-label', 'Reproducir video de fondo');
          unmount();
        }
      });
    }
  })();

  /* ---------- 2. FILTRO DE GAMA ---------- */
  (function () {
    var btns = [].slice.call(document.querySelectorAll('.fam-b')),
        mods = [].slice.call(document.querySelectorAll('.mod')),
        empty = document.getElementById('empty');
    if (!btns.length) return;

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.dataset.f, shown = 0;
        btns.forEach(function (x) {
          x.classList.toggle('is-on', x === b);
          x.setAttribute('aria-selected', x === b ? 'true' : 'false');
        });
        mods.forEach(function (m) {
          var hit = (f === 'all' || m.dataset.f === f);
          m.classList.toggle('is-out', !hit);
          if (hit) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  })();

  /* ---------- 3. CONTADOR DE CIFRAS ---------- */
  (function () {
    var els = [].slice.call(document.querySelectorAll('[data-count]'));
    if (!els.length || reduce || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, end = parseInt(el.dataset.count, 10), t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 900, 1),
              e2 = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * e2);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 4. REVELADO AL SCROLL ---------- */
  (function () {
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = '.origen-txt, .origen-fig, .filo-fig, .filo-item, .gama-h2, .gama-lede, .fam, .mod, .chile-fig, .chile-txt, .fig';
    var els = [].slice.call(document.querySelectorAll(sel));
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = parseInt(e.target.dataset.i || 0, 10);
        setTimeout(function () { e.target.classList.add('on'); }, i * 70);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) {
      el.classList.add('rv');
      io.observe(el);
    });
    // escalonado dentro de cada grupo
    ['.filo-item', '.mod', '.fig'].forEach(function (s) {
      [].slice.call(document.querySelectorAll(s)).forEach(function (el, i) {
        el.dataset.i = i;
      });
    });
  })();

  /* ---------- 5. MENÚ MÓVIL ---------- */
  (function () {
    var b = (window.OCEANIC_MENU ? null : document.getElementById('burger')), d = document.getElementById('drawer');
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
        d.setAttribute('hidden', '');
        document.body.classList.remove('locked');
        b.classList.remove('on');
        b.setAttribute('aria-expanded', 'false');
      }
    });
  })();
})();
