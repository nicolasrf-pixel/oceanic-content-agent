/* OCEANIC · Teléfono con selector de país.
   Convierte cada <input type="tel"> del sitio en un campo con país (+56 por defecto) y número nacional.
   - Chile: el número son 9 dígitos (9 8765 4321); se agrupan al escribir, se cuentan en una regla de 9 marcas
     y no se aceptan más. Se entiende lo pegado como «+56 9 8765 4321», «56987654321» o «0987654321».
   - Otros países: se cambia desde la lista (también por teclado) o escribiendo «+34 …» al comienzo.
   El input original queda oculto con el mismo id y name y guarda el número completo («+56 9 8765 4321»),
   así que el resto del código del sitio lo lee igual que antes. Un número a medias no se envía en silencio:
   el formulario avisa y vuelve al campo. */
(function () {
  'use strict';
  if (window.OCEANIC_TELEFONO) return;

  var PAISES = [
    ['CL', 'Chile', '56'], ['AR', 'Argentina', '54'], ['PE', 'Perú', '51'], ['BO', 'Bolivia', '591'],
    ['BR', 'Brasil', '55'], ['UY', 'Uruguay', '598'], ['PY', 'Paraguay', '595'], ['CO', 'Colombia', '57'],
    ['EC', 'Ecuador', '593'], ['VE', 'Venezuela', '58'], ['MX', 'México', '52'], ['US', 'EE. UU. y Canadá', '1'],
    ['ES', 'España', '34'], ['IT', 'Italia', '39'], ['FR', 'Francia', '33'], ['DE', 'Alemania', '49'],
    ['GB', 'Reino Unido', '44'], ['NL', 'Países Bajos', '31'], ['PT', 'Portugal', '351'], ['CH', 'Suiza', '41'],
    ['GR', 'Grecia', '30'], ['HR', 'Croacia', '385'], ['TR', 'Turquía', '90'], ['AU', 'Australia', '61'], ['NZ', 'Nueva Zelanda', '64']
  ].map(function (p) { return { iso: p[0], nombre: p[1], dial: p[2] }; });
  var POR_DIAL = PAISES.slice().sort(function (a, b) { return b.dial.length - a.dial.length; });
  var CHILE = PAISES[0];
  var CHILE_DIGITOS = 9, OTROS_MIN = 6, OTROS_MAX = 12;
  var n = 0;

  function pais(iso) { for (var i = 0; i < PAISES.length; i++) if (PAISES[i].iso === iso) return PAISES[i]; return CHILE; }
  function soloDigitos(s) { return String(s || '').replace(/\D+/g, ''); }

  /* 987654321 → «9 8765 4321» (Chile); el resto, en bloques de 3 */
  function agrupar(p, d) {
    if (p.iso === 'CL') return (d.slice(0, 1) + ' ' + d.slice(1, 5) + ' ' + d.slice(5)).replace(/\s+$/, '').replace(/ {2,}/g, ' ');
    return d.replace(/(\d{3})(?=\d{2})/g, '$1 ');
  }

  /* Lo que escribió o pegó la persona → { pais, digitos } */
  function interpretar(texto, actual) {
    var t = String(texto || '').trim(), p = actual, d;
    if (/^(\+|00)/.test(t)) {                              // «+34 612…» o «0034 612…»: se detecta el país
      d = soloDigitos(t.replace(/^(\+|00)/, ''));
      for (var i = 0; i < POR_DIAL.length; i++) if (d.indexOf(POR_DIAL[i].dial) === 0) { p = POR_DIAL[i]; d = d.slice(p.dial.length); break; }
    } else {
      d = soloDigitos(t);
      if (p.iso === 'CL') {
        if (d.length > CHILE_DIGITOS && d.indexOf('56') === 0) d = d.slice(2);   // 56987654321
        d = d.replace(/^0+/, '');                                                // 0987654321: un número chileno no parte con 0
      }
    }
    d = d.slice(0, p.iso === 'CL' ? CHILE_DIGITOS : OTROS_MAX);
    return { pais: p, digitos: d };
  }

  function estado(p, d) {
    if (!d) return { ok: true, vacio: true, txt: '' };
    if (p.iso === 'CL') {
      var faltan = CHILE_DIGITOS - d.length;
      return faltan === 0 ? { ok: true, txt: 'Número completo' }
        : { ok: false, txt: 'Faltan ' + faltan + (faltan === 1 ? ' dígito' : ' dígitos') };
    }
    return d.length >= OTROS_MIN ? { ok: true, txt: 'Número listo' } : { ok: false, txt: 'Parece muy corto' };
  }

  function montar(input) {
    if (input.getAttribute('data-tel-ok')) return;
    input.setAttribute('data-tel-ok', '1');
    var id = input.id || ('tel-' + (++n)), sid = id + '-nac', lid = id + '-lista', hid = id + '-aviso';
    var cont = input.parentNode, form = input.form;
    var etiqueta = (form || document).querySelector('label[for="' + id + '"]');
    var S = { pais: CHILE, digitos: '', abierto: false, toco: false };

    var raiz = document.createElement('div');
    raiz.className = 'tel';
    raiz.innerHTML =
      '<div class="tel-caja">' +
        '<button type="button" class="tel-pais" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + lid + '" aria-label="País del teléfono">' +
          '<span class="tel-iso"></span><span class="tel-dial"></span><svg class="tel-flecha" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<input class="tel-num" id="' + sid + '" type="tel" inputmode="numeric" autocomplete="tel-national" aria-describedby="' + hid + '" spellcheck="false">' +
      '</div>' +
      '<div class="tel-regla" aria-hidden="true"></div>' +
      '<p class="tel-aviso" id="' + hid + '" aria-live="polite"></p>' +
      '<ul class="tel-lista" id="' + lid + '" role="listbox" aria-label="Elige el país" hidden></ul>';

    input.type = 'hidden';
    input.removeAttribute('placeholder'); input.removeAttribute('inputmode'); input.removeAttribute('autocomplete');
    input.parentNode.insertBefore(raiz, input);
    if (etiqueta) etiqueta.setAttribute('for', sid);
    if (cont.classList) cont.classList.add('tel-on');

    var btn = raiz.querySelector('.tel-pais'), num = raiz.querySelector('.tel-num'), lista = raiz.querySelector('.tel-lista');
    var regla = raiz.querySelector('.tel-regla'), aviso = raiz.querySelector('.tel-aviso');
    var marcas = '';
    for (var k = 0; k < CHILE_DIGITOS; k++) marcas += '<i></i>';
    regla.innerHTML = marcas;
    lista.innerHTML = PAISES.map(function (p) {
      return '<li role="option" id="' + lid + '-' + p.iso + '" data-iso="' + p.iso + '" tabindex="-1"><span class="tel-iso">' + p.iso + '</span><span class="tel-nom">' + p.nombre + '</span><span class="tel-dial">+' + p.dial + '</span></li>';
    }).join('');

    function pintar() {
      var e = estado(S.pais, S.digitos), cl = S.pais.iso === 'CL';
      btn.querySelector('.tel-iso').textContent = S.pais.iso;
      btn.querySelector('.tel-dial').textContent = '+' + S.pais.dial;
      num.placeholder = cl ? '9 1234 5678' : 'Número';
      num.maxLength = cl ? 11 : 16;
      num.value = agrupar(S.pais, S.digitos);
      input.value = S.digitos ? '+' + S.pais.dial + ' ' + agrupar(S.pais, S.digitos) : '';
      raiz.classList.toggle('tel-cl', cl);
      raiz.classList.toggle('tel-lleno', cl && S.digitos.length === CHILE_DIGITOS);
      raiz.classList.toggle('tel-mal', !e.ok && S.toco);
      raiz.classList.toggle('tel-con', !!S.digitos);
      var marcasEl = regla.children;
      for (var i = 0; i < marcasEl.length; i++) marcasEl[i].className = i < S.digitos.length ? 'on' : '';
      aviso.textContent = S.digitos ? e.txt : (cl ? 'Después del +56 van 9 dígitos' : '');
      aviso.classList.toggle('tel-aviso-ok', e.ok && !e.vacio);
      lista.querySelectorAll('[aria-selected]').forEach(function (o) { o.removeAttribute('aria-selected'); });
      var sel = lista.querySelector('[data-iso="' + S.pais.iso + '"]'); if (sel) sel.setAttribute('aria-selected', 'true');
      input.setCustomValidity && input.setCustomValidity('');
    }

    function aplicar(texto) {
      var r = interpretar(texto, S.pais);
      S.pais = r.pais; S.digitos = r.digitos; pintar();
    }

    function abrir() {
      if (S.abierto) return;
      S.abierto = true; lista.hidden = false; btn.setAttribute('aria-expanded', 'true'); raiz.classList.add('tel-abierto');
      var sel = lista.querySelector('[aria-selected="true"]') || lista.firstChild;
      if (sel) { sel.focus(); sel.scrollIntoView({ block: 'nearest' }); }
    }
    function cerrar(devolverFoco) {
      if (!S.abierto) return;
      S.abierto = false; lista.hidden = true; btn.setAttribute('aria-expanded', 'false'); raiz.classList.remove('tel-abierto');
      if (devolverFoco) btn.focus();
    }
    function elegir(iso) {
      var p = pais(iso);
      if (p.iso === 'CL' && S.pais.iso !== 'CL') S.digitos = S.digitos.slice(0, CHILE_DIGITOS);
      S.pais = p; cerrar(false); pintar(); num.focus();
    }

    btn.addEventListener('click', function () { S.abierto ? cerrar(false) : abrir(); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrir(); } });
    lista.addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) elegir(li.getAttribute('data-iso')); });
    var buscar = '', tb;
    lista.addEventListener('keydown', function (e) {
      var li = document.activeElement, sig;
      if (e.key === 'ArrowDown') { sig = li && li.nextElementSibling || lista.firstChild; }
      else if (e.key === 'ArrowUp') { sig = li && li.previousElementSibling || lista.lastChild; }
      else if (e.key === 'Home') { sig = lista.firstChild; }
      else if (e.key === 'End') { sig = lista.lastChild; }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (li && li.getAttribute('data-iso')) elegir(li.getAttribute('data-iso')); return; }
      else if (e.key === 'Escape') { e.preventDefault(); cerrar(true); return; }
      else if (e.key === 'Tab') { cerrar(false); return; }
      else if (e.key.length === 1) {                      // escribir «per» salta a Perú
        buscar += e.key.toLowerCase(); clearTimeout(tb); tb = setTimeout(function () { buscar = ''; }, 700);
        for (var i = 0; i < lista.children.length; i++) if (lista.children[i].querySelector('.tel-nom').textContent.toLowerCase().indexOf(buscar) === 0) { sig = lista.children[i]; break; }
      }
      if (sig) { e.preventDefault(); sig.focus(); sig.scrollIntoView({ block: 'nearest' }); }
    });
    document.addEventListener('click', function (e) { if (S.abierto && !raiz.contains(e.target)) cerrar(false); });

    num.addEventListener('input', function () {
      var v = num.value;
      // «+» o «+5» todavía no dice qué país es: se deja escribir sin tocar el texto
      if (/^(\+|00)/.test(v) && !POR_DIAL.some(function (p) { return soloDigitos(v.replace(/^(\+|00)/, '')).indexOf(p.dial) === 0; })) return;
      var antes = soloDigitos(v.slice(0, num.selectionStart || 0)).length, esMas = /^(\+|00)/.test(v);
      aplicar(v);
      if (!esMas && document.activeElement === num) {          // el cursor sigue junto al dígito que se estaba editando
        var pos = 0, cuenta = 0, t = num.value;
        while (pos < t.length && cuenta < antes) { if (/\d/.test(t.charAt(pos))) cuenta++; pos++; }
        try { num.setSelectionRange(pos, pos); } catch (e) {}
      }
    });
    num.addEventListener('paste', function (e) {
      var t = (e.clipboardData || window.clipboardData); if (!t) return;
      e.preventDefault(); S.toco = false; aplicar(t.getData('text'));
    });
    num.addEventListener('blur', function () { if (S.digitos) { S.toco = true; pintar(); } });
    num.addEventListener('focus', function () { raiz.classList.add('tel-foco'); });
    num.addEventListener('blur', function () { raiz.classList.remove('tel-foco'); });
    btn.addEventListener('focus', function () { raiz.classList.add('tel-foco'); });
    btn.addEventListener('blur', function () { setTimeout(function () { if (!raiz.contains(document.activeElement)) raiz.classList.remove('tel-foco'); }, 0); });

    // valor que ya traía el campo (autocompletado del navegador, edición): se interpreta una vez
    if (input.value) aplicar(input.value); else pintar();
    raiz._revisar = function () { S.toco = true; pintar(); var e = estado(S.pais, S.digitos); return e.ok; };
    raiz._foco = function () { num.focus(); };
  }

  function enhancer(raiz) {
    (raiz || document).querySelectorAll('input[type="tel"]').forEach(function (i) { if (!i.closest('.tel')) montar(i); });
  }

  /* Un número a medias no se envía en silencio: se avisa y se vuelve al campo.
     Va en captura para correr antes que el resto de los envíos del sitio. */
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || !f.querySelectorAll) return;
    var cajas = f.querySelectorAll('.tel');
    for (var i = 0; i < cajas.length; i++) {
      if (cajas[i]._revisar && !cajas[i]._revisar()) {
        e.preventDefault(); e.stopImmediatePropagation(); cajas[i]._foco();
        cajas[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
    }
  }, true);

  window.OCEANIC_TELEFONO = { interpretar: interpretar, agrupar: agrupar, estado: estado, PAISES: PAISES };

  // los formularios que se arman con JavaScript (cotización de la ficha, charter, boyas, eventos) también se mejoran
  function iniciar() {
    enhancer(document);
    if (window.MutationObserver) {
      var pend = false;
      new MutationObserver(function () {
        if (pend) return; pend = true;
        (window.requestAnimationFrame || setTimeout)(function () { pend = false; enhancer(document); });
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
