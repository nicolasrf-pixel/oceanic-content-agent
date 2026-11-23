/* OCEANIC · Aplica los textos editados desde el administrador (Textos del sitio).
   Cada texto del HTML lleva data-t="<página>.<número>"; si window.OCEANIC_TEXTOS (assets/js/textos-data.js, lo publica el CMS) trae un
   texto para ese id, reemplaza el original. Los ids <página>.titulo y <página>.desc cambian el título y la descripción de la página.
   El texto admite solo marcas simples (negrita, cursiva, salto de línea y enlaces seguros): todo lo demás se descarta. */
(function () {
  'use strict';
  var T = window.OCEANIC_TEXTOS;
  if (!T || typeof T !== 'object') return;
  var PERMITIDAS = { B: 1, STRONG: 1, I: 1, EM: 1, BR: 1, A: 1, SMALL: 1, SUP: 1, SUB: 1, U: 1, MARK: 1 };

  function seguro(h) {
    h = String(h || '').trim();
    if (/[\u0000-\u001f\s]/.test(h)) return false;
    if (/^https?:\/\//i.test(h) || /^(mailto:|tel:)/i.test(h)) return true;
    if (/^\/\//.test(h)) return false;
    return !/^[a-z][a-z0-9+.-]*:/i.test(h);
  }

  // Copia el HTML recibido dejando solo las marcas permitidas y, en los enlaces, un href seguro.
  function limpiar(html) {
    var origen = document.createElement('template');
    origen.innerHTML = String(html);
    var destino = document.createDocumentFragment();
    (function copiar(desde, hasta) {
      Array.prototype.forEach.call(desde.childNodes, function (n) {
        if (n.nodeType === 3) { hasta.appendChild(document.createTextNode(n.nodeValue)); return; }
        if (n.nodeType !== 1) return;
        if (!PERMITIDAS[n.tagName]) { copiar(n, hasta); return; }   // etiqueta no permitida: se conserva solo su texto
        var c = document.createElement(n.tagName.toLowerCase());
        if (n.tagName === 'A') {
          var href = n.getAttribute('href');
          if (href && seguro(href)) {
            c.setAttribute('href', href);
            if (/^https?:\/\//i.test(href)) { c.setAttribute('target', '_blank'); c.setAttribute('rel', 'noopener'); }
          }
        }
        copiar(n, c);
        hasta.appendChild(c);
      });
    })(origen.content, destino);
    return destino;
  }

  function aplicar() {
    var els = document.querySelectorAll('[data-t]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], v = T[el.getAttribute('data-t')];
      if (typeof v !== 'string') continue;
      while (el.firstChild) el.removeChild(el.firstChild);
      el.appendChild(limpiar(v));
    }
    // título y descripción de la página (la clave es la de la página: los textos de esta página empiezan igual)
    var pagina = '';
    for (var j = 0; j < els.length && !pagina; j++) { var m = /^(.+)\.\d+$/.exec(els[j].getAttribute('data-t') || ''); if (m) pagina = m[1]; }
    if (!pagina) return;
    var tit = T[pagina + '.titulo'], desc = T[pagina + '.desc'];
    function txt(v) { var d = document.createElement('div'); d.appendChild(limpiar(v)); return d.textContent; }
    if (typeof tit === 'string' && tit) {
      document.title = txt(tit);
      ['og:title', 'twitter:title'].forEach(function (k) {
        var m1 = document.querySelector('meta[property="' + k + '"],meta[name="' + k + '"]'); if (m1) m1.setAttribute('content', txt(tit));
      });
    }
    if (typeof desc === 'string' && desc) {
      ['description', 'og:description', 'twitter:description'].forEach(function (k) {
        var m2 = document.querySelector('meta[name="' + k + '"],meta[property="' + k + '"]'); if (m2) m2.setAttribute('content', txt(desc));
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar); else aplicar();
})();
