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

    // Portada editable desde el administrador (inicio-data.js): video, imagen de respaldo y textos
    var I = window.OCEANIC_INICIO || {};
    var q0 = function (s) { return hero.querySelector(s) || hero; };
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    if (I.video) v.dataset.src = I.video;
    if (I.poster) {
      // ruta como en el resto de los datos: relativa a assets/img/ (o /media/… del CMS, o URL completa)
      var ruta = /^(https?:)?\/\/|^\//.test(I.poster) ? I.poster : 'assets/img/' + I.poster;
      v.poster = ruta;
      var abs = new URL(ruta, location.href).href;  // absoluta: una url() en variable CSS se resolvería desde la hoja de estilos
      if (!/home-hero\.webp$/.test(abs)) q0('.hhero-media').style.setProperty('--hh-img', 'url("' + abs.replace(/"/g, '%22') + '")');
    }
    var q = function (s) { return hero.querySelector(s); };
    function rutaImg(p) { return /^(https?:)?\/\/|^\//.test(p) ? p : 'assets/img/' + p; }
    function carrusel(DS) {
      var media = hero.querySelector('.hhero-media'), espera = Math.max(3, +I.intervalo || 6) * 1000, k = 0, timer;
      var sinVideo = reduce || slow || small;
      v.remove();
      var capas = DS.map(function (d, i) {
        var el;
        if (d.tipo === 'video' && !sinVideo) {
          el = document.createElement('video'); el.muted = true; el.loop = false; el.playsInline = true; el.preload = 'none';
          el.setAttribute('muted', ''); el.setAttribute('playsinline', ''); el.dataset.src = d.src;
          if (d.poster) el.poster = rutaImg(d.poster);
        } else {
          el = document.createElement('div');
          var fondo = d.tipo === 'video' ? d.poster : d.src;  // en celular o con ahorro de datos, el video muestra su imagen
          if (fondo) el.style.backgroundImage = 'url("' + new URL(rutaImg(fondo), location.href).href.replace(/"/g, '%22') + '")';
        }
        el.className = 'hhero-slide' + (i ? '' : ' on'); media.appendChild(el); return el;
      });
      var puntos = document.createElement('div'); puntos.className = 'hhero-dots';
      puntos.innerHTML = DS.map(function (d, i) { return '<button type="button" aria-label="Diapositiva ' + (i + 1) + '"' + (i ? '' : ' class="on"') + '></button>'; }).join('');
      hero.appendChild(puntos);
      // Las imágenes duran «intervalo» segundos; un video pasa a la siguiente diapositiva al terminar (uno tras otro).
      function activar(i) {
        clearTimeout(timer);
        capas[k].classList.remove('on'); if (capas[k].tagName === 'VIDEO') capas[k].pause();
        puntos.children[k].classList.remove('on');
        k = (i + capas.length) % capas.length; var c = capas[k];
        c.classList.add('on'); puntos.children[k].classList.add('on');
        if (c.tagName === 'VIDEO') {
          if (!c.src) c.src = c.dataset.src;
          try { c.currentTime = 0; } catch (e) { /* aún sin datos */ }
          var pr = c.play(); if (pr && pr.catch) pr.catch(function () { if (capas[k] === c) seguir(); });
        } else seguir();
      }
      function seguir() { clearTimeout(timer); if (!reduce) timer = setTimeout(function () { activar(k + 1); }, espera); }
      capas.forEach(function (c) {
        if (c.tagName !== 'VIDEO') return;
        c.addEventListener('ended', function () { if (capas[k] === c) activar(k + 1); });
        c.addEventListener('error', function () { if (capas[k] === c) seguir(); });
      });
      [].forEach.call(puntos.children, function (b, i) { b.addEventListener('click', function () { activar(i); }); });
      k = 0; capas[0].classList.remove('on'); puntos.children[0].classList.remove('on'); activar(0);
      hero.classList.add('playing');
    }
    if (I.antetitulo && q('.hhero-eyebrow')) q('.hhero-eyebrow').textContent = I.antetitulo;
    if (I.titular && q('.hhero-h1')) q('.hhero-h1').innerHTML = esc(I.titular).replace(/\n/g, '<br/>');
    if (I.bajada && q('.hhero-sub')) q('.hhero-sub').textContent = I.bajada;

    var conn = navigator.connection || {},
        slow = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || ''),
        small = window.matchMedia('(max-width: 700px)').matches;

    // Carrusel (modo «carrusel» en el administrador): diapositivas de imagen o video que se van fundiendo
    var DS = (I.modo === 'carrusel' ? (I.diapositivas || []) : []).filter(function (d) { return d && d.src; });
    if (DS.length > 1) { carrusel(DS); return; }

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
