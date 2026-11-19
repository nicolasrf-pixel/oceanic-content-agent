/* OCEANIC · Administrador: ayudas al pasar el mouse (tooltips).
   Un solo globo para toda la pantalla. Explica cada botón, campo, métrica, estado y columna:
   - lo que lleva data-tip se muestra tal cual;
   - los title nativos se convierten (para no duplicar globos);
   - lo demás se explica por su texto, su etiqueta o su función (diccionario de abajo).
   No cambia ninguna función del administrador: solo lee el DOM. En pantallas táctiles no se activa. */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(hover:none)').matches) return;

  // ---- diccionario: texto exacto del botón → explicación ----
  var EXACTO = {
    'Guardar borrador': 'Guarda tus cambios como borrador. Todavía no se ven en el sitio público.',
    'Publicar': 'Publica este documento: los cambios pasan a verse en el sitio público de inmediato.',
    'Descartar borrador': 'Borra tus cambios sin publicar y vuelve a lo último publicado (o al repositorio si nunca se publicó).',
    'Historial': 'Muestra las versiones anteriores de este documento. Puedes restaurar una como borrador.',
    'Volver al repo': 'El sitio deja de usar lo publicado aquí y vuelve a mostrar el archivo original del repositorio.',
    'Restaurar como borrador': 'Recupera esta versión como borrador. No cambia el sitio hasta que publiques.',
    'Salir': 'Cierra tu sesión en el administrador.',
    'Abrir': 'Abre este documento para editarlo.',
    'Editar': 'Abre este elemento para editarlo.',
    'Duplicar': 'Crea una copia de este elemento para partir desde él.',
    'Borrar': 'Borra este elemento. Pide confirmación antes de hacerlo.',
    'Quitar': 'Saca este elemento de la lista. No borra el archivo original.',
    'Quitar paso': 'Saca este paso de la lista.',
    'Quitar bloque': 'Saca este bloque de la edición.',
    '✕': 'Quita este elemento de la lista.',
    '✕ Quitar': 'Quita este elemento de la lista.',
    '↑': 'Sube este elemento un lugar.',
    '↓': 'Baja este elemento un lugar.',
    '↑ Subir': 'Sube este elemento un lugar.',
    '★': 'Destaca este modelo en la portada del sitio (máximo 3). Vuelve a apretar para quitarlo.',
    'Volver': 'Vuelve a la pantalla anterior.',
    'Reintentar': 'Vuelve a intentar la consulta que falló.',
    'Revisar marcas ahora': 'Lanza la revisión de las webs oficiales en GitHub. Tarda unos minutos y deja un informe para aprobar.',
    'Ver en GitHub': 'Abre en GitHub el detalle de esta ejecución.',
    'Crear marca': 'Crea la marca en el catálogo y la información de marcas. Nace sin autorizar: no se ve en el sitio hasta que la autorices.',
    '+ Nueva categoría': 'Agrega una categoría (por ejemplo Rescate). Nace sin autorizar: no aparece en el sitio hasta que la autorices.',
    '+ Agregar al inicio': 'Agrega una marca existente a la grilla y al carrusel del inicio.',
    '+ Agregar marca a esta categoría': 'Suma la marca elegida a esta categoría.',
    'Autorizar y mostrar esta categoría': 'Activa la categoría: tras publicar, aparece en el menú, el pie, el inicio y como página propia.',
    'Nuevo modelo': 'Carga a mano un barco nuevo con ficha, textos y fotos.',
    '← Catálogo': 'Vuelve a la lista del catálogo.',
    '← Usados': 'Vuelve a la lista de usados.',
    '← Puerto': 'Vuelve a la lista de ediciones de Puerto.',
    '← Traducciones': 'Vuelve a la revisión de traducciones.',
    'Eliminar aviso': 'Elimina este aviso de usados. Pide confirmación.',
    'Eliminar edición': 'Elimina esta edición de Puerto. Pide confirmación.',
    'REVISADO': 'Marca esta traducción como revisada por una persona.',
    'Revisar': 'Abre esta ficha para revisar su traducción.',
    'Guardar etapa': 'Guarda la etapa del lead directo en Brevo (campo ETAPA del contacto).',
    '+ Agregar a la lista': 'Agrega este contacto a la lista de Brevo elegida.',
    'Buscar': 'Busca en los contactos más recientes de Brevo. Para un contacto antiguo, escribe su correo exacto.',
    'Abrir Brevo ↗': 'Abre Brevo en una pestaña nueva, para automatizaciones y campañas.',
    'Abrir en Brevo ↗': 'Abre este contacto directamente en Brevo.',
    'WhatsApp ↗': 'Abre una conversación de WhatsApp con este contacto.',
    'Escribir correo': 'Abre tu programa de correo con este contacto como destinatario.',
    '✕ Cerrar': 'Cierra la ficha del contacto.'
  };
  // ---- patrones (por orden): texto del botón → explicación ----
  var PATRON = [
    [/^\+ /, 'Agrega un elemento nuevo a esta lista.'],
    [/^Autorizar y mostrar/, 'Activa esta marca: tras publicar, aparece en el inicio, el menú, las categorías, el asistente y su página.'],
    [/^✕ Eliminar/, 'Elimina este elemento. Pide confirmación.'],
    [/^Ver .*↗$/, 'Abre en una pestaña nueva cómo se ve esto en el sitio público.'],
    [/^← /, 'Vuelve a la pantalla anterior.'],
    [/^Subir|^Elegir|^Cambiar (foto|imagen)/i, 'Sube un archivo desde tu computador. Las imágenes se optimizan solas al subirlas.'],
    [/^Publicar/, 'Publica este elemento en el sitio.'],
    [/^Guardar/, 'Guarda lo que escribiste como borrador.']
  ];
  // ---- columnas de tablas ----
  var COLUMNA = {
    'publicado': 'Si está prendido, el barco se ve en el sitio. Apagado, no aparece en ninguna parte.',
    'modelo': 'Nombre del barco y su dirección interna (slug).',
    'motivo si está apagado': 'Nota interna: por qué se apagó este barco. Queda registrada.',
    'portada': 'Estrella para destacar el barco en la portada (máximo 3).',
    'documento': 'Parte del sitio que se edita desde el administrador.',
    'versión': 'Número de versión del borrador y, entre paréntesis, de la última publicada.',
    'último cambio': 'Cuándo y quién guardó el cambio más reciente.',
    'marca': 'Marca náutica a la que pertenece.',
    'estado': 'Situación actual del elemento.',
    'conocidos': 'Modelos que la biblioteca ya tiene de esta marca.',
    'nuevos': 'Modelos que están en la web oficial y todavía no están en el sitio.',
    'cambiaron de dirección': 'Modelos cuya página oficial cambió de dirección web.',
    'ya no existen': 'Modelos que desaparecieron de la web oficial.',
    'patrón': 'Palabra o expresión que no se permite publicar.',
    'expresión regular': 'Marca si el patrón se lee como expresión regular (búsqueda avanzada).',
    'fecha': 'Fecha del elemento.',
    'precio': 'Precio publicado del aviso.'
  };
  var ESTADO = {
    sucio: 'Hay cambios que aún no guardas. Apreta «Guardar borrador» para no perderlos.',
    pend: 'Hay un borrador guardado que todavía no se publica. El sitio sigue mostrando la versión anterior.',
    pub: 'Lo que ves aquí es lo que muestra el sitio público.',
    repo: 'Este documento aún no se ha editado en el administrador: el sitio usa el archivo original del repositorio.'
  };

  var el = document.createElement('div');
  el.className = 'tip'; el.setAttribute('role', 'tooltip'); el.id = 'tip';
  document.body.appendChild(el);
  var timer = null, actual = null;

  function norm(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  function etiquetaDe(c) {
    if (c.id) { var l = document.querySelector('label[for="' + c.id + '"]'); if (l) return norm(l.textContent); }
    var campo = c.closest('.campo,.gen-campo');
    if (campo) { var e = campo.querySelector(':scope>label,:scope>.etq'); if (e) return norm(e.textContent); }
    return norm(c.getAttribute('aria-label') || c.getAttribute('placeholder') || '');
  }
  function pistaDe(c) {
    var campo = c.closest('.campo,.gen-campo');
    var s = campo && campo.querySelector(':scope>small'); return s ? norm(s.textContent) : '';
  }
  function textoDe(t) {
    var d = t.getAttribute('data-tip'); if (d) return d;
    var ti = t.getAttribute('title'); if (ti) return ti;
    var tag = t.tagName, cls = t.classList;
    if (cls.contains('estado')) { for (var k in ESTADO) if (cls.contains(k)) return ESTADO[k]; }
    if (cls.contains('chip')) {
      if (cls.contains('err')) return 'Atención: algo que revisar o que está apagado.';
      if (cls.contains('ok')) return 'Todo en orden.';
      if (cls.contains('warn')) return 'Aviso: conviene revisarlo.';
      return 'Dirección interna (slug) del elemento.';
    }
    if (tag === 'TH') return COLUMNA[norm(t.textContent).toLowerCase()] || '';
    if (cls.contains('interruptor') || (tag === 'INPUT' && t.parentNode && t.parentNode.classList.contains('interruptor'))) {
      var sw = tag === 'INPUT' ? t : t.querySelector('input'); var n = sw && norm(sw.getAttribute('aria-label'));
      return (n ? n + ': ' : '') + 'Interruptor. Prendido = se muestra en el sitio; apagado = se oculta.';
    }
    if (cls.contains('tarjeta')) { var sp = t.querySelector('span'); return sp ? norm(sp.textContent) : ''; }
    if (cls.contains('foto')) return 'Foto subida. Puedes subirla o bajarla de lugar, o quitarla.';
    if (cls.contains('medio')) return 'Archivo de la biblioteca. La ruta de abajo es la que se usa en el sitio.';
    if (tag === 'SUMMARY') return 'Despliega o contrae esta sección.';
    if (tag === 'INPUT' && t.type === 'checkbox') { var l1 = etiquetaDe(t) || norm(t.parentNode && t.parentNode.textContent); return l1 ? 'Casilla: ' + l1 : 'Casilla para activar o desactivar esta opción.'; }
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
      var e = etiquetaDe(t), p = pistaDe(t);
      if (e || p) return (e ? 'Campo «' + e + '». ' : '') + p;
      return '';
    }
    if (tag === 'BUTTON' || tag === 'A') {
      var tx = norm(t.textContent);
      if (!tx) return norm(t.getAttribute('aria-label') || '');
      if (EXACTO[tx]) return EXACTO[tx];
      for (var i = 0; i < PATRON.length; i++) if (PATRON[i][0].test(tx)) return PATRON[i][1];
      return t.getAttribute('aria-label') ? norm(t.getAttribute('aria-label')) : 'Acción: ' + tx + '.';
    }
    return '';
  }
  var SELECTOR = '[data-tip],[title],button,a[href],input,select,textarea,th,.chip,.estado,.interruptor,summary,.tarjeta,.foto,.medio';

  function mostrar(t) {
    var tx = textoDe(t); if (!tx) return;
    var tit = t.getAttribute('title'); if (tit) { t.setAttribute('data-tip', tit); t.removeAttribute('title'); }
    el.textContent = tx; el.classList.remove('on'); el.style.left = '0px'; el.style.top = '0px';
    var r = t.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, m = 10;
    var pos = t.getAttribute('data-tip-pos') || 'abajo', x, y;
    if (pos === 'right') { x = r.right + m; y = r.top + r.height / 2 - h / 2; }
    else { x = r.left + r.width / 2 - w / 2; y = r.bottom + m; if (y + h > innerHeight - 6) y = r.top - h - m; }
    x = Math.max(8, Math.min(x, innerWidth - w - 8)); y = Math.max(8, Math.min(y, innerHeight - h - 8));
    el.style.left = x + 'px'; el.style.top = y + 'px';
    requestAnimationFrame(function () { el.classList.add('on'); });
    actual = t;
  }
  function ocultar() { clearTimeout(timer); timer = null; el.classList.remove('on'); actual = null; }

  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest && e.target.closest(SELECTOR);
    if (!t) return ocultar();
    if (t === actual) return;
    ocultar();
    var ti = t.getAttribute('title'); if (ti) { t.setAttribute('data-tip', ti); t.removeAttribute('title'); }
    timer = setTimeout(function () { mostrar(t); }, 320);
  });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) ocultar(); });
  document.addEventListener('focusin', function (e) {
    var t = e.target.closest && e.target.closest(SELECTOR); if (t) { ocultar(); timer = setTimeout(function () { mostrar(t); }, 200); }
  });
  document.addEventListener('focusout', ocultar);
  document.addEventListener('mousedown', ocultar);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ocultar(); });
  window.addEventListener('scroll', ocultar, true);

  // los title nativos que aparezcan después se convierten, para que no se dupliquen con este globo
  var mo = new MutationObserver(function () {
    [].forEach.call(document.querySelectorAll('[title]'), function (n) { n.setAttribute('data-tip', n.getAttribute('title')); n.removeAttribute('title'); });
  });
  mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['title'] });

  // migas de pan de la barra superior: «Administrador · <título de la pantalla>»
  var crumb = document.getElementById('crumb'), app = document.getElementById('app');
  function migas() {
    if (!crumb || !app) return;
    var h = app.querySelector('h1'), t = h ? norm(h.textContent) : '';
    crumb.innerHTML = ''; var a = document.createElement('span'); a.textContent = 'Administrador'; crumb.appendChild(a);
    if (t) { var i = document.createElement('i'); i.textContent = '/'; var b = document.createElement('b'); b.textContent = t; crumb.appendChild(i); crumb.appendChild(b); }
  }
  if (app) new MutationObserver(migas).observe(app, { childList: true });
  migas();
})();
