/* OCEANIC · Campos obligatorios claros en todos los formularios.
   - Nombre y correo (y cualquier otro campo `required` de texto) llevan un asterisco en su etiqueta y una nota «* Obligatorio».
   - Si falta algo o el correo no es válido, el aviso sale debajo del propio campo (en vez de la burbuja del navegador),
     con el campo marcado y el foco puesto en él.
   - Los demás campos obligatorios (fechas, listas, la casilla de privacidad) siguen con la validación del navegador. */
(function () {
  'use strict';
  if (window.OCEANIC_CAMPOS) return;
  window.OCEANIC_CAMPOS = true;

  var CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  function esNombre(el) { return /(^|-)nombre$/.test(el.id || '') || el.name === 'nombre'; }
  function esCorreo(el) { return el.type === 'email' || el.name === 'email' || /(^|-)email$/.test(el.id || ''); }
  function obligatorio(el) {
    return el && el.tagName === 'INPUT' && el.type !== 'hidden' && el.type !== 'checkbox' && el.type !== 'radio' && el.type !== 'date' &&
      (el.required || el.hasAttribute('required')) && !el.closest('[data-puerto]') && (esNombre(el) || esCorreo(el));
  }
  function etiquetaDe(el) {
    return (el.form || document).querySelector('label[for="' + el.id + '"]') || (el.parentNode && el.parentNode.querySelector('label'));
  }

  function marcar(raiz) {
    (raiz || document).querySelectorAll('form input[required]').forEach(function (el) {
      if (el.getAttribute('data-req') || !obligatorio(el)) return;
      el.setAttribute('data-req', '1');
      var l = etiquetaDe(el); if (l) l.setAttribute('data-req', '1');
    });
    (raiz || document).querySelectorAll('form').forEach(function (f) {
      if (f.querySelector('.req-nota') || !f.querySelector('[data-req]')) return;
      var btn = f.querySelector('button[type=submit]'); if (!btn) return;
      var nota = document.createElement('p'); nota.className = 'req-nota';
      nota.innerHTML = '<span aria-hidden="true">*</span> Obligatorio: tu nombre y tu correo';
      var ancla = btn.closest('.form-foot') || btn; ancla.parentNode.insertBefore(nota, ancla);
    });
  }

  function limpiar(el) {
    el.removeAttribute('aria-invalid');
    var m = el.parentNode && el.parentNode.querySelector('.campo-err[data-de="' + el.id + '"]'); if (m) m.remove();
  }
  function error(el, txt) {
    limpiar(el);
    el.setAttribute('aria-invalid', 'true');
    var m = document.createElement('p'); m.className = 'campo-err'; m.setAttribute('role', 'alert'); m.setAttribute('data-de', el.id); m.textContent = txt;
    el.parentNode.appendChild(m);
  }
  function revisar(el) {
    var v = (el.value || '').trim();
    if (!v) return esCorreo(el) ? 'Escribe tu correo.' : 'Escribe tu nombre.';
    if (esCorreo(el) && !CORREO.test(v)) return 'Revisa el correo: debe verse como nombre@dominio.cl';
    return '';
  }

  // El navegador avisa «invalid» antes del envío: se cambia su burbuja por el aviso bajo el campo
  document.addEventListener('invalid', function (e) {
    var el = e.target; if (!obligatorio(el)) return;
    e.preventDefault(); error(el, revisar(el) || (esCorreo(el) ? 'Escribe un correo válido.' : 'Escribe tu nombre.'));
  }, true);

  // Correo sin punto («a@b») pasa el control del navegador pero no sirve: se revisa antes de enviar
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || !f.querySelectorAll) return;
    var campos = f.querySelectorAll('input[data-req]'), primero = null;
    for (var i = 0; i < campos.length; i++) {
      var t = revisar(campos[i]);
      if (t) { error(campos[i], t); primero = primero || campos[i]; } else limpiar(campos[i]);
    }
    if (primero) { e.preventDefault(); e.stopImmediatePropagation(); primero.focus(); }
  }, true);

  document.addEventListener('input', function (e) {
    var el = e.target; if (el && el.getAttribute && el.getAttribute('aria-invalid') && !revisar(el)) limpiar(el);
  });
  document.addEventListener('blur', function (e) {
    var el = e.target; if (el && el.getAttribute && el.getAttribute('data-req') && el.value) { var t = revisar(el); if (t) error(el, t); else limpiar(el); }
  }, true);

  function iniciar() {
    marcar(document);
    if (window.MutationObserver) {
      var pend = false;
      new MutationObserver(function () {
        if (pend) return; pend = true;
        (window.requestAnimationFrame || setTimeout)(function () { pend = false; marcar(document); });
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
