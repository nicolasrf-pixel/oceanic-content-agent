/* OCEANIC · Envío de formularios.
   OCEANIC_ENVIAR(datos, respaldo) manda la solicitud a /api/formulario (Cloudflare).
   Si el servidor no está disponible (sitio estático, sin configurar o caído) abre el correo del
   visitante con la solicitud ya escrita, como en la etapa 1: nunca se pierde una solicitud.
   Devuelve una promesa: { via: 'servidor' | 'correo' }. Se rechaza con Error(codigo) cuando el
   servidor dice que faltan datos ('email', 'nombre', 'categorias') o falla Puerto ('puerto'). */
(function () {
  'use strict';
  var ENDPOINT = '/api/formulario';
  var VENTAS = 'ventasweb@oceanic.cl';  // casilla que recibe los formularios (respaldo por correo)
  var ESPERA_MS = 15000;

  function abrirCorreo(r) {
    var url = 'mailto:' + VENTAS + '?subject=' + encodeURIComponent(r.asunto || 'Contacto web') +
      '&body=' + encodeURIComponent(r.cuerpo || '');
    var a = document.createElement('a');
    a.href = url; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); }, 100);
  }

  /* ---------- Ley 21.719: consentimiento en todos los formularios ----------
     Inserta en cada formulario la casilla obligatoria de aceptación de la política de privacidad (separada de la de
     Puerto, que es opcional). Raíz de la ruta para el enlace: la misma que usan las imágenes. */
  var PRE = ((document.body && document.body.dataset.assetBase) || 'assets/img/').replace('assets/img/', '');
  var n = 0;
  window.OCEANIC_CONSENTIMIENTO = function (contenedor, antesDe) {
    if (!contenedor || contenedor.querySelector('[name="acepta"]')) return;
    var id = 'acepta-' + (++n);
    var l = document.createElement('label');
    l.className = 'check consent';
    l.innerHTML = '<input type="checkbox" name="acepta" id="' + id + '" required>' +
      '<span>Acepto la <a href="' + PRE + 'privacidad/index.html" target="_blank" rel="noopener">política de privacidad</a>. ' +
      'Usamos tus datos solo para responder esta solicitud.</span>';
    contenedor.insertBefore(l, antesDe && antesDe.parentNode === contenedor ? antesDe : null);
  };
  window.OCEANIC_ACEPTO = function (contenedor) {
    var c = contenedor && contenedor.querySelector('[name="acepta"]');
    return !!(c && c.checked);
  };
  function prepararFormularios() {
    [].forEach.call(document.querySelectorAll('form[data-form], form[data-puerto]'), function (f) {
      var pie = f.querySelector('.form-foot, .cfoot') || f.querySelector('button[type="submit"]');
      OCEANIC_CONSENTIMIENTO(f, pie);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepararFormularios);
  else prepararFormularios();
  new MutationObserver(function () { prepararFormularios(); }).observe(document.documentElement, { childList: true, subtree: true });

  window.OCEANIC_ENVIAR = function (datos, respaldo) {
    datos = datos || {};
    datos.origen = datos.origen || location.href.split('#')[0];
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ESPERA_MS) : null;

    function alCorreo() {
      if (!respaldo) throw new Error(datos.tipo === 'puerto' ? 'puerto' : 'envio');
      abrirCorreo(respaldo);
      return { via: 'correo' };
    }

    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (t) clearTimeout(t);
      if (res.ok) return { via: 'servidor' };
      // 422: faltan datos, lo corrige el visitante. Cualquier otro error: respaldo por correo.
      if (res.status === 422) {
        return res.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.error || 'datos'); });
      }
      return alCorreo();
    }, function () {
      if (t) clearTimeout(t);
      return alCorreo();
    });
  };

  /* Formularios de página: <form data-form="contacto|cotizacion" data-ok="#idConfirmacion">
     con campos nombre, email y opcionales telefono, motivo, mensaje y la casilla puerto.
     data-modelo, data-marca y data-universo dan el contexto del barco. */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.hasAttribute || !f.hasAttribute('data-form')) return;
    e.preventDefault();
    function v(n) { var el = f.elements[n]; return el && el.value ? el.value.trim() : ''; }
    var d = {
      tipo: f.getAttribute('data-form'),
      modelo: f.getAttribute('data-modelo') || '',
      marca: f.getAttribute('data-marca') || '',
      universo: f.getAttribute('data-universo') || '',
      nombre: v('nombre'), email: v('email'), telefono: v('telefono'),
      motivo: v('motivo'), mensaje: v('mensaje'),
      puerto: !!(f.elements.puerto && f.elements.puerto.checked),
      intencion: v('intencion'),
      ficha: f.getAttribute('data-ficha') || '',
      web: v('web')
    };
    var err = f.querySelector('[data-form-err]');
    function fallo(txt) {
      if (!err) { err = document.createElement('p'); err.setAttribute('data-form-err', ''); err.setAttribute('role', 'alert'); err.className = 'form-err'; f.appendChild(err); }
      err.textContent = txt; err.hidden = false;
    }
    if (!d.nombre || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) {
      fallo('Déjanos tu nombre y un correo válido para responderte.');
      (d.nombre ? f.elements.email : f.elements.nombre).focus();
      return;
    }
    d.acepta = OCEANIC_ACEPTO(f);
    if (!d.acepta) {
      fallo('Para enviar, acepta la política de privacidad.');
      f.elements.acepta.focus();
      return;
    }
    if (err) err.hidden = true;
    var lineas = ['Hola Oceanic,', ''];
    if (d.modelo) lineas.push('Quiero cotizar el ' + d.modelo + '.', '');
    lineas.push('Datos de contacto:', '• Nombre: ' + d.nombre, '• Correo: ' + d.email);
    if (d.telefono) lineas.push('• Teléfono: ' + d.telefono);
    if (d.motivo) lineas.push('• Motivo: ' + d.motivo);
    if (d.intencion) lineas.push('• ¿Cuándo quiero navegar?: ' + d.intencion);
    if (d.mensaje) lineas.push('', 'Mensaje:', d.mensaje);
    var asunto = (d.modelo ? 'Cotización ' + d.modelo : 'Contacto web') + ', ' + d.nombre + (d.motivo ? ' (' + d.motivo + ')' : '');
    var btn = f.querySelector('button[type=submit]');
    var txtBtn = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
    window.OCEANIC_ENVIAR(d, { asunto: asunto, cuerpo: lineas.join('\n') }).then(function (r) {
      // Cotización recibida por el servidor: página de gracias (los datos van en sessionStorage, nunca en la URL)
      var gr = f.getAttribute('data-gracias');
      if (r.via === 'servidor' && gr) {
        try { var g = JSON.parse(gr); g.nombre = d.nombre; sessionStorage.setItem('oceanic-gracias', JSON.stringify(g)); } catch (e2) {}
        location.href = PRE + 'gracias/index.html';
        return;
      }
      var ok = document.querySelector(f.getAttribute('data-ok') || '');
      if (ok) {
        var via = ok.querySelector('[data-via]');
        if (via) via.textContent = r.via === 'servidor'
          ? 'Te enviamos una copia a tu correo.'
          : 'Se abrió tu correo con el mensaje escrito: envíalo para que nos llegue.';
        f.hidden = true; ok.hidden = false;
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, function () {
      if (btn) { btn.disabled = false; btn.textContent = txtBtn; }
      fallo('Revisa tu nombre y correo, y vuelve a enviar.');
    });
  });

  /* Puerto: cualquier <form data-puerto> con un campo email se suscribe con doble confirmación. */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.hasAttribute || !f.hasAttribute('data-puerto')) return;
    e.preventDefault();
    var email = (f.email && f.email.value || '').trim();
    var btn = f.querySelector('button[type=submit],button:not([type])');
    var msg = f.querySelector('[data-puerto-msg]');
    function aviso(txt, ok) {
      if (!msg) { msg = document.createElement('p'); msg.setAttribute('data-puerto-msg', ''); msg.setAttribute('role', 'status'); f.appendChild(msg); }
      msg.textContent = txt; msg.className = ok ? 'puerto-ok' : 'puerto-err';
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { aviso('Escribe un correo válido.', false); f.email.focus(); return; }
    if (!OCEANIC_ACEPTO(f)) { aviso('Para suscribirte, acepta la política de privacidad.', false); f.elements.acepta.focus(); return; }
    if (btn) btn.disabled = true;
    window.OCEANIC_ENVIAR({ tipo: 'puerto', email: email, puerto: true, acepta: true, web: f.web ? f.web.value : '' }, null)
      .then(function () {
        f.innerHTML = '<p class="' + (f.getAttribute('data-ok-class') || 'puerto-ok') + '" role="status">' +
          'Te enviamos un correo para confirmar tu suscripción. Revisa tu bandeja de entrada.</p>';
      }, function () {
        if (btn) btn.disabled = false;
        aviso('No pudimos suscribirte ahora. Inténtalo en unos minutos.', false);
      });
  });
})();
