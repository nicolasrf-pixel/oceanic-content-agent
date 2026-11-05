/* OCEANIC · Administrador del sitio (CMS propio sobre el Worker: D1 + KV, acceso con Cloudflare Access).
   Cada sección edita un documento (archivo de datos del sitio). Flujo: editar → Guardar borrador → Publicar.
   Nada se publica sin pasar la validación del servidor (esquema + patrones prohibidos). */
(function () {
  'use strict';

  /* ================= utilidades ================= */
  var app = document.getElementById('app');
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) agregar(el, arguments[i]);
    return el;
  }
  function agregar(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) return c.forEach(function (x) { agregar(el, x); });
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function vaciar(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  // campos internos del editor (empiezan con _) no se guardan
  function limpio(o) { return JSON.parse(JSON.stringify(o, function (k, v) { return k.charAt(0) === '_' ? undefined : v; })); }
  var tAviso;
  function avisar(msg, error) {
    var a = document.getElementById('aviso');
    a.textContent = msg; a.className = 'aviso' + (error ? ' err' : ''); a.hidden = false;
    clearTimeout(tAviso); tAviso = setTimeout(function () { a.hidden = true; }, error ? 7000 : 3500);
  }
  function fecha(iso) { if (!iso) return ''; var d = new Date(iso); return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); }
  function hoy() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function slugify(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function src(p, base) {  // ruta de imagen del sitio → URL para la miniatura
    if (!p) return '';
    if (typeof p === 'object') return p.local ? '/assets/img/usados/' + p.local : (p.url || '');
    if (/^(https?:)?\/\//.test(p) || p.charAt(0) === '/') return p;
    return '/assets/img/' + (base || '') + p + (/\.\w{3,4}$/.test(p) ? '' : '.webp');
  }

  function api(ruta, op) {
    op = op || {};
    var fd = op.body instanceof FormData;
    return fetch('/api/admin/' + ruta, {
      method: op.method || 'GET', credentials: 'same-origin',
      headers: Object.assign({ 'X-CMS': '1' }, op.body && !fd ? { 'Content-Type': 'application/json' } : {}),
      body: op.body ? (fd ? op.body : JSON.stringify(op.body)) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'Respuesta inválida del servidor (' + r.status + ')' }; })
        .then(function (d) {
          d.status = r.status; if (!r.ok) d.ok = false;
          if (r.status === 401 && d.sesion === false) {  // sesión vencida: volver a entrar (se avisa si hay cambios sin guardar)
            if (!Object.keys(docs).some(function (k) { return docs[k].sucio; }) || confirm('Tu sesión terminó. Tienes cambios sin guardar: copia lo importante antes de continuar. ¿Ir a entrar?')) location.href = '/admin/entrar';
          }
          return d;
        });
    }).catch(function () { return { ok: false, error: 'Sin conexión con el servidor' }; });
  }

  /* ================= documentos ================= */
  var docs = {};       // clave → { clave, contenido, version, publicado, pendiente, origen, sucio }
  function cargar(clave, forzar) {
    if (docs[clave] && !forzar) return Promise.resolve(docs[clave]);
    return api('doc?clave=' + encodeURIComponent(clave)).then(function (d) {
      if (!d.ok) throw new Error(d.error || 'No se pudo cargar ' + clave);
      d.sucio = false; docs[clave] = d; return d;
    });
  }
  function marcar(doc) { doc.sucio = true; if (doc.alCambiar) doc.alCambiar(); }
  window.addEventListener('beforeunload', function (e) {
    if (Object.keys(docs).some(function (k) { return docs[k].sucio; })) { e.preventDefault(); e.returnValue = ''; }
  });

  function mostrarProblemas(cont, d) {
    vaciar(cont);
    function lista(cls, titulo, L) {
      if (!L || !L.length) return;
      cont.appendChild(h('div', { class: cls }, h('b', { text: titulo }), h('ul', null, L.slice(0, 40).map(function (x) {
        return h('li', null, x.ruta ? h('code', { text: x.ruta }) : null, x.ruta ? ' · ' : '', x.msg);
      }), L.length > 40 ? h('li', { text: '… y ' + (L.length - 40) + ' más' }) : null)));
    }
    lista('errores', d.error || 'Errores', d.errores);
    if (!d.errores && d.error && !d.ok) cont.appendChild(h('div', { class: 'errores', text: d.error }));
    lista('avisos', 'Avisos (no impiden guardar)', d.avisos);
  }

  /* Barra de un documento: estado + guardar / publicar / descartar / historial. */
  function barra(doc, extra) {
    var est = h('span', { class: 'estado' });
    var prob = h('div');
    var bG = h('button', { class: 'btn sec', text: 'Guardar borrador', onclick: function () { guardar(); } });
    var bP = h('button', { class: 'btn boya', text: 'Publicar', onclick: publicar });
    var bD = h('button', { class: 'btn-sm', text: 'Descartar borrador', title: 'Vuelve a lo publicado (o al repo si nunca se publicó)', onclick: descartar });
    var bH = h('button', { class: 'btn-sm', text: 'Historial', onclick: function () { historial(doc); } });
    var bR = h('button', { class: 'btn-sm', text: 'Volver al repo', title: 'El sitio deja de usar lo publicado aquí y vuelve a mostrar el archivo del repo', onclick: function () {
      if (!confirm('¿Volver al contenido del repo? El sitio deja de mostrar lo publicado desde el administrador para «' + (doc.titulo || doc.clave) + '» (queda en el historial).')) return;
      api('volver-al-repo', { method: 'POST', body: { clave: doc.clave, version: doc.version } }).then(function (r) {
        if (!r.ok) return avisar(r.error, true);
        cargar(doc.clave, true).then(function () { avisar('Listo: el sitio muestra el contenido del repo'); router(); });
      });
    } });
    function pintar() {
      var t, c;
      if (doc.sucio) { t = 'Cambios sin guardar'; c = 'sucio'; }
      else if (doc.origen === 'repo') { t = 'Contenido del repo (sin cambios en el CMS)'; c = 'repo'; }
      else if (doc.pendiente) { t = 'Borrador v' + doc.version + ' sin publicar' + (doc.publicado ? ' · publicado: v' + doc.pub_version : ''); c = 'pend'; }
      else { t = 'Publicado v' + doc.pub_version + (doc.publicado_en ? ' · ' + fecha(doc.publicado_en) + (doc.publicado_por ? ' · ' + doc.publicado_por : '') : ''); c = 'pub'; }
      est.textContent = t; est.className = 'estado ' + c;
      bP.disabled = !doc.sucio && !doc.pendiente;
      bD.disabled = doc.origen === 'repo' && !doc.sucio;
      bR.hidden = doc.origen === 'repo';
    }
    doc.alCambiar = pintar; pintar();
    function guardar() {
      bG.disabled = true;
      return api('doc', { method: 'PUT', body: { clave: doc.clave, version: doc.version, contenido: limpio(doc.contenido) } }).then(function (r) {
        bG.disabled = false; mostrarProblemas(prob, r);
        if (!r.ok) { avisar(r.error || 'No se pudo guardar', true); return false; }
        doc.version = r.version; doc.sucio = false; doc.pendiente = true; doc.origen = 'cms'; pintar();
        avisar('Borrador guardado (v' + r.version + ')'); return true;
      });
    }
    function publicar() {
      (doc.sucio ? guardar() : Promise.resolve(true)).then(function (ok) {
        if (!ok) return;
        if (!confirm('¿Publicar «' + (doc.titulo || doc.clave) + '» en el sitio?')) return;
        api('publicar', { method: 'POST', body: { clave: doc.clave, version: doc.version } }).then(function (r) {
          mostrarProblemas(prob, r);
          if (!r.ok) return avisar(r.error || 'No se pudo publicar', true);
          doc.publicado = true; doc.pub_version = doc.version; doc.pendiente = false; doc.publicado_en = r.publicado_en; doc.publicado_por = yo; pintar();
          avisar('Publicado. El sitio ya muestra esta versión.');
        });
      });
    }
    function descartar() {
      if (!confirm('¿Descartar el borrador? Se pierde lo no publicado (queda en el historial).')) return;
      if (doc.origen === 'repo') { cargar(doc.clave, true).then(function () { router(); }); return; }
      api('descartar', { method: 'POST', body: { clave: doc.clave, version: doc.version } }).then(function (r) {
        if (!r.ok) return avisar(r.error, true);
        cargar(doc.clave, true).then(function () { avisar('Borrador descartado'); router(); });
      });
    }
    return h('div', null, h('div', { class: 'barra' }, est, h('span', { class: 'esp' }), extra || null, bH, bR, bD, bG, bP), prob);
  }

  function historial(doc) {
    var viejo = document.querySelector('.hist'); if (viejo) viejo.remove();
    var panel = h('aside', { class: 'hist' }, h('button', { class: 'btn-sm', style: 'float:right', text: 'Cerrar', onclick: function () { panel.remove(); } }),
      h('h2', { style: 'margin-top:0', text: 'Historial' }), h('p', { class: 'cargando', text: 'Cargando…' }));
    document.body.appendChild(panel);
    api('historial?clave=' + encodeURIComponent(doc.clave)).then(function (r) {
      panel.lastChild.remove();
      if (!r.ok) return panel.appendChild(h('p', { text: r.error }));
      if (!r.historial.length) return panel.appendChild(h('p', { text: 'Sin versiones guardadas aún.' }));
      var N = { guardar: 'Guardado', publicar: 'Publicado', descartar: 'Descartado', restaurar: 'Restaurado', 'volver-al-repo': 'Volvió al repo' };
      panel.appendChild(h('ul', null, r.historial.map(function (x) {
        return h('li', null, h('b', { text: (N[x.accion] || x.accion) + ' · v' + x.version }), h('br'),
          h('span', { class: 'chip', text: fecha(x.fecha) }), ' ', x.autor || '', ' ',
          x.accion !== 'descartar' ? h('button', { class: 'mini', text: 'Restaurar como borrador', onclick: function () {
            if (doc.sucio && !confirm('Tienes cambios sin guardar. ¿Reemplazarlos?')) return;
            api('restaurar', { method: 'POST', body: { clave: doc.clave, id: x.id, version: doc.version } }).then(function (rr) {
              if (!rr.ok) return avisar(rr.error, true);
              cargar(doc.clave, true).then(function () { panel.remove(); avisar('Versión restaurada como borrador. Revisa y publica.'); router(); });
            });
          } }) : null);
      })));
    });
  }

  /* ================= campos ================= */
  function campo(etq, control, ayuda) { return h('div', { class: 'campo' }, h('label', { text: etq }), control, ayuda ? h('small', { text: ayuda }) : null); }
  function texto(doc, obj, k, op) {
    op = op || {};
    var largo = op.largo || (typeof obj[k] === 'string' && (obj[k].length > 90 || obj[k].indexOf('\n') >= 0));
    var el = h(largo ? 'textarea' : 'input', { type: largo ? null : (op.tipo || 'text'), value: obj[k] == null ? '' : obj[k], placeholder: op.ph,
      rows: largo ? (op.filas || 4) : null,
      oninput: function () { obj[k] = op.num ? el.value : el.value; marcar(doc); if (op.alCambiar) op.alCambiar(el.value); } });
    return el;
  }
  function listaTextos(doc, arr, op) {  // lista de párrafos / puntos editable
    op = op || {};
    var cont = h('div', { class: 'lista-ed' });
    function pintar() {
      vaciar(cont);
      arr.forEach(function (v, i) {
        var el = h(op.largo ? 'textarea' : 'input', { type: op.largo ? null : 'text', value: v, rows: op.largo ? 3 : null,
          oninput: function () { arr[i] = el.value; marcar(doc); } });
        cont.appendChild(h('div', { class: 'item' }, el,
          h('button', { class: 'mini', title: 'Subir', text: '↑', onclick: function () { if (i) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); marcar(doc); pintar(); } } }),
          h('button', { class: 'mini x', title: 'Quitar', text: '✕', onclick: function () { arr.splice(i, 1); marcar(doc); pintar(); } })));
      });
      cont.appendChild(h('button', { class: 'mini', text: '+ ' + (op.agregar || 'Agregar'), onclick: function () { arr.push(''); marcar(doc); pintar(); } }));
    }
    pintar(); return cont;
  }

  /* Subida de imágenes: se optimizan en el navegador (WebP calidad 75, 1600 px; 2560 px para portadas/hero). */
  function optimizar(file, lado) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !window.createImageBitmap) return Promise.resolve({ blob: file });
    return createImageBitmap(file).then(function (bmp) {
      var k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (ok) { c.toBlob(function (b) { ok({ blob: b && b.type === 'image/webp' ? b : file, ancho: c.width, alto: c.height }); }, 'image/webp', 0.75); });
    }).catch(function () { return { blob: file }; });
  }
  function subir(file, carpeta, lado) {
    return optimizar(file, lado || 1600).then(function (o) {
      var fd = new FormData();
      var nombre = file.name.replace(/\.\w+$/, '') + (o.blob.type === 'image/webp' ? '.webp' : (file.name.match(/\.\w+$/) || [''])[0]);
      fd.append('archivo', o.blob, nombre); fd.append('carpeta', carpeta);
      if (o.ancho) { fd.append('ancho', o.ancho); fd.append('alto', o.alto); }
      return api('medios', { method: 'POST', body: fd });
    });
  }
  function botonSubir(texto_, carpeta, alListo, op) {
    op = op || {};
    var inp = h('input', { type: 'file', accept: op.accept || 'image/*', multiple: op.multiple ? true : null, onchange: function () {
      var files = [].slice.call(inp.files); inp.value = '';
      if (!files.length) return;
      avisar('Subiendo ' + files.length + ' archivo(s)…');
      files.reduce(function (p, f) {
        return p.then(function () { return subir(f, carpeta, op.lado).then(function (r) { if (!r.ok) throw new Error(r.error); alListo(r.url); }); });
      }, Promise.resolve()).then(function () { avisar('Listo'); }).catch(function (e) { avisar(e.message || 'Error al subir', true); });
    } });
    return h('label', { class: 'btn-sm subir' }, inp, texto_);
  }
  function editorFotos(doc, arr, carpeta, op) {  // lista de rutas de foto con miniatura, orden y subida
    op = op || {};
    var cont = h('div');
    function pintar() {
      vaciar(cont);
      cont.appendChild(h('div', { class: 'fotos' }, arr.map(function (f, i) {
        return h('div', { class: 'foto' }, h('img', { src: src(f, op.base), alt: '', loading: 'lazy' }),
          h('div', { class: 'acciones' },
            h('button', { class: 'mini', text: '←', title: 'Antes', onclick: function () { if (i) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); marcar(doc); pintar(); } } }),
            h('button', { class: 'mini x', text: '✕', title: 'Quitar', onclick: function () { arr.splice(i, 1); marcar(doc); pintar(); } })),
          h('div', { class: 'ruta', text: typeof f === 'object' ? (f.local || f.url) : f }));
      })));
      var puede = !op.max || arr.length < op.max;
      cont.appendChild(h('div', { class: 'filtros' },
        puede ? botonSubir('Subir fotos', carpeta, function (u) { if (!op.max || arr.length < op.max) { arr.push(u); marcar(doc); pintar(); } }, { multiple: true }) : h('small', { text: 'Máximo ' + op.max + ' fotos' }),
        puede ? h('button', { class: 'mini', text: '+ Ruta existente', onclick: function () {
          var r = prompt('Ruta de una foto que ya está en el sitio (ej. modelos/lagoon-42-g1.webp) o de la biblioteca de imágenes (/media/...)');
          if (r) { arr.push(r.trim()); marcar(doc); pintar(); }
        } }) : null));
    }
    pintar(); return cont;
  }
  function campoImagen(doc, obj, k, carpeta, op) {  // una sola imagen (portada, hero)
    op = op || {};
    var img = h('img', { alt: '', style: 'width:200px;aspect-ratio:4/3;object-fit:cover;background:var(--natural);display:block;margin-bottom:6px' });
    var v0 = obj[k] && typeof obj[k] === 'object' ? (obj[k].url || '') : (obj[k] || '');
    var inp = h('input', { type: 'text', value: v0, oninput: function () { obj[k] = inp.value.trim(); marcar(doc); img.src = src(obj[k], op.base); } });
    img.src = src(obj[k], op.base);
    return h('div', null, img, h('div', { class: 'filtros' }, inp, botonSubir('Subir', carpeta, function (u) { obj[k] = u; inp.value = u; img.src = u; marcar(doc); }, { lado: 2560 })));
  }

  /* Editor genérico de JSON (para catálogo, marcas, charter, equipamiento, fichas): recorre la estructura y
     ofrece un campo por valor. Los niveles anidados se abren a pedido para que los documentos grandes vayan fluidos. */
  var IMG_K = /^(hero|img|imagen|portada|foto|logo)$|-img$/;
  function generico(doc, valor, abierto) {
    function nodo(padre, k, etq, nivel) {
      var v = padre[k];
      if (v !== null && typeof v === 'object') {
        var resumen = Array.isArray(v) ? v.length + ' elementos' : Object.keys(v).length + ' campos';
        var vista = Array.isArray(v) ? '' : (v.titulo || v.nombre || v.t || v.titular || v.grupo || v.label || v.id || '');
        var det = h('details', { class: 'nodo' }, h('summary', null, etq, h('span', { class: 'res', text: (vista ? '«' + String(vista).slice(0, 60) + '» · ' : '') + resumen })));
        var hecho = false;
        function abrir() { if (hecho) return; hecho = true; det.appendChild(Array.isArray(v) ? arreglo(v, k) : objeto(v, nivel + 1)); }
        det.addEventListener('toggle', function () { if (det.open) abrir(); });
        if (nivel < (abierto || 0)) { det.open = true; abrir(); }
        return det;
      }
      var etiqueta = h('span', { class: 'etq', text: etq });
      if (typeof v === 'boolean') return h('div', { class: 'gen-campo' }, h('label', null, h('input', { type: 'checkbox', checked: v, onchange: function (e) { padre[k] = e.target.checked; marcar(doc); } }), ' ', etq));
      if (typeof v === 'number') return h('div', { class: 'gen-campo' }, etiqueta, h('input', { type: 'number', value: v, step: 'any', oninput: function (e) { padre[k] = e.target.value === '' ? 0 : Number(e.target.value); marcar(doc); } }));
      if (typeof k === 'string' && IMG_K.test(k)) return h('div', { class: 'gen-campo' }, etiqueta, campoImagen(doc, padre, k, 'modelos'));
      return h('div', { class: 'gen-campo' }, etiqueta, texto(doc, padre, k));
    }
    function objeto(o, nivel) {
      return h('div', null, Object.keys(o).map(function (k) { return nodo(o, k, k, nivel); }));
    }
    function arreglo(a, clavePadre) {
      var cont = h('div', { class: 'gen-arr' });
      function pintar() {
        vaciar(cont);
        if (a.length && a.every(function (x) { return typeof x === 'string'; }) && /^(fotos|galeria|imagenes|gal)/.test(clavePadre)) {
          cont.appendChild(editorFotos(doc, a, 'modelos')); return;
        }
        a.forEach(function (x, i) {
          cont.appendChild(h('div', { class: 'gen-it' }, h('div', { class: 'gen-v' }, nodo(a, i, '#' + (i + 1), 1)),
            h('div', { class: 'gen-b' },
              h('button', { class: 'mini', text: '↑', title: 'Subir', onclick: function () { if (i) { a.splice(i - 1, 0, a.splice(i, 1)[0]); marcar(doc); pintar(); } } }),
              h('button', { class: 'mini x', text: '✕', title: 'Quitar', onclick: function () { if (confirm('¿Quitar este elemento?')) { a.splice(i, 1); marcar(doc); pintar(); } } }))));
        });
        cont.appendChild(h('button', { class: 'mini', text: '+ Agregar', onclick: function () {
          a.push(a.length ? molde(a[a.length - 1]) : ''); marcar(doc); pintar();
        } }));
      }
      pintar(); return cont;
    }
    function molde(x) {  // elemento nuevo con la misma forma que el último, vacío
      if (Array.isArray(x)) return [];
      if (x && typeof x === 'object') { var o = {}; Object.keys(x).forEach(function (k) { o[k] = molde(x[k]); }); return o; }
      return typeof x === 'number' ? 0 : typeof x === 'boolean' ? false : '';
    }
    return Array.isArray(valor) ? arreglo(valor, '') : objeto(valor, 0);
  }

  /* ================= catálogo (para barcos y destacados) ================= */
  function modelos(cat) {
    var L = [];
    Object.keys(cat).forEach(function (m) { (cat[m].modelos || []).forEach(function (mo) { L.push({ marca: m, nombreMarca: cat[m].nombre, slug: mo.slug, nombre: mo.nombre, clave: m + '/' + mo.slug, mo: mo }); }); });
    return L;
  }
  function verModelo(clave) { var p = clave.split('/'); return '/marca/index.html?m=' + p[0] + '&modelo=' + p[1]; }

  /* ================= secciones ================= */
  var S = {};

  S.inicio = function () {
    return api('estado').then(function (r) {
      if (!r.ok) throw new Error(r.error);
      var pend = r.docs.filter(function (d) { return d.pendiente; });
      function nombre(clave) { return r.tipos[clave] || clave.replace(/^ficha:/, 'Ficha '); }
      function enlace(clave) {
        if (clave.indexOf('ficha:') === 0) return '#ficha/' + clave.slice(6);
        return { publicacion: '#barcos', usados: '#usados', puerto: '#puerto', catalogo: '#catalogo', contenido: '#catalogo', patrones: '#patrones' }[clave] || '#contenido/' + clave;
      }
      return h('div', null, h('h1', { text: 'Administrador del sitio' }),
        h('p', { class: 'lede', text: 'Edita, guarda como borrador y publica. Lo publicado aquí se superpone al contenido del repo; con «Vista previa de borradores» (arriba) ves los borradores en el sitio antes de publicarlos.' }),
        h('div', { class: 'tarjetas' }, [
          ['#barcos', 'Publicación y destacados', 'Prender o apagar barcos y elegir los 3 de la portada'],
          ['#traducciones', 'Revisión de traducciones', 'Revisar las fichas traducidas y marcarlas REVISADO'],
          ['#usados', 'Usados', 'Avisos, precio, fotos y «vendido»'],
          ['#puerto', 'Puerto', 'Ediciones del newsletter con bloques'],
          ['#catalogo', 'Catálogo', 'Ficha técnica y textos de cada modelo'],
          ['#medios', 'Imágenes y documentos', 'Biblioteca de archivos subidos']
        ].map(function (t) { return h('a', { class: 'tarjeta', href: t[0] }, h('b', { text: t[1] }), h('span', { text: t[2] })); })),
        h('h2', { text: pend.length ? 'Borradores sin publicar (' + pend.length + ')' : 'No hay borradores pendientes' }),
        pend.length ? h('div', { class: 'tabla-wrap' }, h('table', { class: 'tabla' }, h('tr', null, h('th', { text: 'Documento' }), h('th', { text: 'Versión' }), h('th', { text: 'Último cambio' }), h('th')),
          pend.map(function (d) { return h('tr', null, h('td', { text: nombre(d.clave) }), h('td', { text: 'v' + d.version + (d.pub_version ? ' (publicada v' + d.pub_version + ')' : ' (nunca publicado)') }),
            h('td', { text: fecha(d.actualizado) + ' · ' + (d.autor || '') }), h('td', { class: 'acc' }, h('a', { class: 'btn-sm', href: enlace(d.clave), text: 'Abrir' }))); }))) : null,
        h('h2', { text: 'Publicado desde el CMS' }),
        h('p', { class: 'lede', text: r.docs.filter(function (d) { return d.pub_version; }).map(function (d) { return nombre(d.clave) + ' (v' + d.pub_version + ')'; }).join(' · ') || 'Todavía nada: el sitio muestra el contenido del repo.' }));
    });
  };

  /* --- Publicación (interruptor por barco) y destacados de la portada --- */
  S.barcos = function () {
    return Promise.all([cargar('publicacion'), cargar('catalogo')]).then(function (x) {
      var doc = x[0], P = doc.contenido, L = modelos(x[1].contenido);
      var filtro = h('input', { type: 'search', placeholder: 'Buscar modelo…', oninput: function () { pintar(); } });
      var soloOff = h('input', { type: 'checkbox', onchange: function () { pintar(); } });
      var dest = h('div', { class: 'panel' });
      var lista = h('div');
      function pintarDest() {
        vaciar(dest).appendChild(h('h3', { style: 'margin-top:0', text: 'Destacados de la portada (' + P.destacados.length + ' de 3)' }));
        dest.appendChild(h('ol', null, P.destacados.map(function (k, i) {
          var m = L.filter(function (z) { return z.clave === k; })[0];
          return h('li', null, (m ? m.nombre : k) + ' ', P.ocultos[k] ? h('span', { class: 'chip err', text: 'apagado' }) : null, ' ',
            h('button', { class: 'mini', text: '↑', onclick: function () { if (i) { P.destacados.splice(i - 1, 0, P.destacados.splice(i, 1)[0]); marcar(doc); pintarDest(); } } }), ' ',
            h('button', { class: 'mini x', text: 'Quitar', onclick: function () { P.destacados.splice(i, 1); marcar(doc); pintarDest(); pintar(); } }));
        })));
        if (P.destacados.length !== 3) dest.appendChild(h('small', { text: 'Marca con ★ hasta completar 3. La portada necesita exactamente 3 para publicar.' }));
      }
      function pintar() {
        vaciar(lista);
        var q = filtro.value.toLowerCase(), marcaActual = null, tabla;
        L.forEach(function (m) {
          if (q && (m.nombre + ' ' + m.clave).toLowerCase().indexOf(q) < 0) return;
          var off = !!P.ocultos[m.clave];
          if (soloOff.checked && !off) return;
          if (m.marca !== marcaActual) {
            marcaActual = m.marca;
            tabla = h('table', { class: 'tabla' }, h('tr', null, h('th', { text: 'Publicado' }), h('th', { text: 'Modelo' }), h('th', { text: 'Motivo si está apagado' }), h('th', { text: 'Portada' }), h('th')));
            lista.appendChild(h('div', { class: 'marca-h' }, h('h2', { text: m.nombreMarca })));
            lista.appendChild(h('div', { class: 'tabla-wrap' }, tabla));
          }
          var esDest = P.destacados.indexOf(m.clave) >= 0;
          var sw = h('input', { type: 'checkbox', checked: !off, 'aria-label': 'Publicar ' + m.nombre, onchange: function () {
            if (sw.checked) delete P.ocultos[m.clave];
            else {
              var motivo = prompt('¿Por qué se apaga ' + m.nombre + '? (queda anotado)', 'Pedido del cliente');
              if (motivo === null) { sw.checked = true; return; }
              P.ocultos[m.clave] = motivo || 'Apagado desde el administrador';
              var i = P.destacados.indexOf(m.clave); if (i >= 0) P.destacados.splice(i, 1);
            }
            marcar(doc); pintar(); pintarDest();
          } });
          tabla.appendChild(h('tr', { class: off ? 'apagado' : '' },
            h('td', null, h('label', { class: 'interruptor' }, sw, h('span'))),
            h('td', null, h('b', { text: m.nombre }), h('br'), h('small', { class: 'chip', text: m.slug })),
            h('td', null, off ? texto(doc, P.ocultos, m.clave) : ''),
            h('td', null, h('button', { class: 'estrella' + (esDest ? ' on' : ''), title: esDest ? 'Quitar de la portada' : 'Destacar en la portada', disabled: off ? true : null, text: '★', onclick: function () {
              var i = P.destacados.indexOf(m.clave);
              if (i >= 0) P.destacados.splice(i, 1);
              else if (P.destacados.length >= 3) return avisar('Ya hay 3 destacados: quita uno primero', true);
              else P.destacados.push(m.clave);
              marcar(doc); pintar(); pintarDest();
            } })),
            h('td', { class: 'acc' }, h('a', { class: 'btn-sm', href: verModelo(m.clave), target: '_blank', rel: 'noopener', text: 'Ver ↗' }))));
        });
        if (!lista.firstChild) lista.appendChild(h('p', { class: 'cargando', text: 'Sin resultados.' }));
      }
      pintarDest(); pintar();
      var on = L.filter(function (m) { return !P.ocultos[m.clave]; }).length;
      return h('div', null, h('h1', { text: 'Publicación y destacados' }),
        h('p', { class: 'lede', text: on + ' de ' + L.length + ' modelos publicados. Un barco apagado no aparece en ninguna parte del sitio (gamas, menús, asistente) y su ficha lleva a la marca.' }),
        barra(doc), dest, h('div', { class: 'filtros' }, filtro, h('label', null, soloOff, ' Solo apagados')), lista);
    });
  };

  /* --- Revisión de traducciones (fichas) --- */
  var cacheFichas = null;
  S.traducciones = function () {
    return Promise.all([fetch('/assets/data/fichas/index.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }), api('estado')]).then(function (x) {
      var claves = x[0], enCms = {};
      (x[1].docs || []).forEach(function (d) { if (d.clave.indexOf('ficha:') === 0) enCms[d.clave.slice(6)] = d; });
      var cont = h('div', { class: 'tabla-wrap' }, h('p', { class: 'cargando', text: 'Leyendo ' + claves.length + ' fichas…' }));
      var filtro = h('select', { onchange: function () { pintar(); } }, h('option', { value: '', text: 'Todas' }), h('option', { value: 'BORRADOR', text: 'Por revisar (BORRADOR)' }), h('option', { value: 'REVISADO', text: 'Revisadas' }));
      var busca = h('input', { type: 'search', placeholder: 'Buscar…', oninput: function () { pintar(); } });
      var estados = cacheFichas || {};
      function pintar() {
        var q = busca.value.toLowerCase();
        var filas = claves.filter(function (k) { return (!filtro.value || estados[k] === filtro.value) && (!q || k.indexOf(q) >= 0); });
        var rev = claves.filter(function (k) { return estados[k] === 'REVISADO'; }).length;
        vaciar(cont).appendChild(h('p', { class: 'lede', text: rev + ' de ' + claves.length + ' fichas revisadas.' }));
        cont.appendChild(h('table', { class: 'tabla' }, h('tr', null, h('th', { text: 'Ficha' }), h('th', { text: 'Estado' }), h('th', { text: 'CMS' }), h('th')),
          filas.map(function (k) {
            var c = enCms[k];
            return h('tr', null, h('td', { text: k }),
              h('td', null, h('span', { class: 'chip ' + (estados[k] === 'REVISADO' ? 'ok' : 'warn'), text: estados[k] || '…' })),
              h('td', null, c ? h('span', { class: 'chip ' + (c.pendiente ? 'warn' : 'ok'), text: c.pendiente ? 'borrador v' + c.version : 'publicado v' + c.pub_version }) : ''),
              h('td', { class: 'acc' }, h('a', { class: 'btn-sm', href: '#ficha/' + k, text: 'Revisar' }), ' ', h('a', { class: 'btn-sm', href: verModelo(k), target: '_blank', rel: 'noopener', text: 'Ver ↗' })));
          })));
      }
      function leerEstados() {
        var cola = claves.slice(), n = 0;
        function uno() {
          var k = cola.shift(); if (!k) return Promise.resolve();
          var p = enCms[k] ? cargar('ficha:' + k).then(function (d) { return d.contenido; }) : fetch('/assets/data/fichas/' + k + '.json').then(function (r) { return r.json(); });
          return p.then(function (f) { estados[k] = f.estado || 'BORRADOR'; }).catch(function () { estados[k] = '?'; }).then(function () { if (++n % 20 === 0) pintar(); return uno(); });
        }
        return Promise.all([uno(), uno(), uno(), uno(), uno(), uno()]).then(function () { cacheFichas = estados; pintar(); });
      }
      if (cacheFichas) pintar(); else leerEstados();
      return h('div', null, h('h1', { text: 'Revisión de traducciones' }),
        h('p', { class: 'lede', text: 'Cada ficha es la página oficial del modelo traducida al español neutro (tuteo), sin opcionales ni precios. Revisa el texto contra la página oficial y márcala REVISADO.' }),
        h('div', { class: 'filtros' }, filtro, busca), cont);
    });
  };

  S.ficha = function (arg) {
    var clave = 'ficha:' + arg;
    return cargar(clave).then(function (doc) {
      var F = doc.contenido;
      var estado = h('select', { onchange: function () { F.estado = estado.value; marcar(doc); } },
        h('option', { value: 'BORRADOR', text: 'BORRADOR (por revisar)' }), h('option', { value: 'REVISADO', text: 'REVISADO' }));
      estado.value = F.estado || 'BORRADOR';
      var cuerpo = h('div', { class: 'panel' });
      cuerpo.appendChild(generico(doc, F, 1));
      return h('div', null, h('p', null, h('a', { href: '#traducciones', text: '← Traducciones' })), h('h1', { text: arg }),
        h('p', { class: 'lede' }, 'Fuente oficial: ', F.fuente ? h('a', { href: F.fuente, target: '_blank', rel: 'noopener noreferrer', text: F.fuente }) : 'sin registrar',
          ' · ', h('a', { href: verModelo(arg), target: '_blank', rel: 'noopener', text: 'Ver la ficha en el sitio ↗' })),
        barra(doc), h('div', { class: 'panel' }, campo('Estado de la revisión', estado, 'REVISADO = alguien de Oceanic leyó la traducción completa contra la página oficial.')),
        h('div', { class: 'ayuda', text: 'Reglas: solo lo que dice la página oficial, español neutro con tuteo. Sin equipamiento opcional, ediciones ni paquetes, y sin precios (se conversan en persona).' }),
        cuerpo);
    });
  };

  /* --- Catálogo (ficha técnica, textos e imágenes por modelo) --- */
  S.catalogo = function (arg) {
    return Promise.all([cargar('catalogo'), cargar('contenido')]).then(function (x) {
      var cat = x[0], con = x[1], C = cat.contenido;
      if (!arg) {
        return h('div', null, h('h1', { text: 'Catálogo de modelos' }),
          h('p', { class: 'lede', text: 'Datos técnicos, descripción, imagen principal y galería de cada modelo. La página del modelo usa la traducción oficial (Revisión de traducciones) y completa con esto lo que falte.' }),
          Object.keys(C).map(function (m) {
            return h('div', null, h('div', { class: 'marca-h' }, h('h2', { text: C[m].nombre })),
              h('div', { class: 'tarjetas' }, C[m].modelos.map(function (mo) {
                return h('a', { class: 'tarjeta', href: '#catalogo/' + m + '/' + mo.slug }, h('b', { text: mo.nombre }), h('span', { text: [mo.tipo, mo.anio].filter(Boolean).join(' · ') }));
              })));
          }));
      }
      var p = arg.split('/'), marca = C[p[0]], mo = marca && marca.modelos.filter(function (z) { return z.slug === p[1]; })[0];
      if (!mo) return h('p', { text: 'Modelo no encontrado.' });
      var cont = con.contenido[arg] || null;
      return h('div', null, h('p', null, h('a', { href: '#catalogo', text: '← Catálogo' })), h('h1', { text: mo.nombre }),
        h('p', { class: 'lede' }, h('a', { href: verModelo(arg), target: '_blank', rel: 'noopener', text: 'Ver en el sitio ↗' })),
        h('h2', { text: 'Ficha técnica y datos' }), h('div', { class: 'ayuda', text: 'Este documento contiene todo el catálogo: al publicar se publica completo. No se publican opcionales ni precios de barcos nuevos.' }),
        barra(cat), h('div', { class: 'panel' }, generico(cat, mo, 1)),
        cont ? [h('h2', { text: 'Secciones de texto (borrador del catálogo)' }), barra(con), h('div', { class: 'panel' }, generico(con, cont, 1))] : null);
    });
  };

  /* --- Usados --- */
  var TIPOS = { motor: 'A motor', vela: 'Vela', catamaran: 'Catamarán' };
  function ordenUsados(U) {
    return U.map(function (u, i) { return { u: u, i: i }; }).sort(function (a, b) {
      return ((a.u.estado === 'vendido') - (b.u.estado === 'vendido')) || String(b.u.fecha || '').localeCompare(String(a.u.fecha || ''));
    });
  }
  S.usados = function () {
    return cargar('usados').then(function (doc) {
      var U = doc.contenido;
      return h('div', null, h('h1', { text: 'Usados' }),
        h('p', { class: 'lede', text: 'El listado muestra primero los disponibles, del más nuevo al más antiguo (por fecha de publicación); los vendidos van al final.' }),
        barra(doc, h('button', { class: 'btn sec', text: '+ Nuevo aviso', onclick: function () {
          U.unshift({ id: '', nombre: '', marca: '', tipo: 'motor', anio: '', precio: 'Consultar', estado: 'disponible', fecha: hoy(), resumen: '', texto: '', fotos: [], docs: [] });
          marcar(doc); location.hash = '#usado/0';
        } })),
        h('div', { class: 'tabla-wrap' }, h('table', { class: 'tabla' }, h('tr', null, h('th'), h('th', { text: 'Aviso' }), h('th', { text: 'Precio' }), h('th', { text: 'Publicado' }), h('th', { text: 'Estado' }), h('th')),
          ordenUsados(U).map(function (x) {
            var u = x.u, f = (u.fotos || [])[0];
            return h('tr', { class: u.estado === 'vendido' ? 'apagado' : '' },
              h('td', null, f ? h('img', { src: src(f, 'usados/'), alt: '', style: 'width:72px;height:54px;object-fit:cover;display:block' }) : ''),
              h('td', null, h('b', { text: u.nombre || '(sin nombre)' }), h('br'), h('small', { text: [u.marca, TIPOS[u.tipo], u.anio].filter(Boolean).join(' · ') })),
              h('td', { text: u.precio }), h('td', { text: u.fecha || '' }),
              h('td', null, h('span', { class: 'chip ' + (u.estado === 'vendido' ? 'err' : 'ok'), text: u.estado })),
              h('td', { class: 'acc' }, h('a', { class: 'btn-sm', href: '#usado/' + x.i, text: 'Editar' })));
          }))));
    });
  };
  S.usado = function (arg) {
    return cargar('usados').then(function (doc) {
      var i = parseInt(arg, 10), u = doc.contenido[i];
      if (!u) return h('p', null, 'Aviso no encontrado. ', h('a', { href: '#usados', text: 'Volver' }));
      var vend = h('input', { type: 'checkbox', checked: u.estado === 'vendido', onchange: function () { u.estado = vend.checked ? 'vendido' : 'disponible'; marcar(doc); } });
      var tipo = h('select', { onchange: function () { u.tipo = tipo.value; marcar(doc); } }, Object.keys(TIPOS).map(function (k) { return h('option', { value: k, text: TIPOS[k] }); }));
      tipo.value = u.tipo;
      var id = texto(doc, u, 'id', { ph: 'lagoon-39' });
      var nombre = texto(doc, u, 'nombre', { alCambiar: function (v) { if (!u._idManual && (!u.id || u._idAuto)) { u.id = slugify(v); u._idAuto = true; id.value = u.id; } } });
      id.addEventListener('input', function () { u._idManual = true; });
      return h('div', null, h('p', null, h('a', { href: '#usados', text: '← Usados' })), h('h1', { text: u.nombre || 'Nuevo aviso' }),
        barra(doc, h('span', null,
          u.id ? h('a', { class: 'btn-sm', href: '/usados/barco/?id=' + encodeURIComponent(u.id), target: '_blank', rel: 'noopener', text: 'Ver ↗' }) : null, ' ',
          h('button', { class: 'btn-sm', style: 'color:var(--err)', text: 'Eliminar aviso', onclick: function () {
            if (!confirm('¿Eliminar «' + (u.nombre || 'este aviso') + '»? Si se vendió, mejor márcalo como vendido.')) return;
            doc.contenido.splice(i, 1); marcar(doc); location.hash = '#usados';
          } }))),
        h('div', { class: 'panel' },
          h('div', { class: 'fila' }, campo('Nombre', nombre), campo('Identificador (URL)', id, 'Único y estable: no cambiarlo una vez publicado.')),
          h('div', { class: 'fila' }, campo('Marca', texto(doc, u, 'marca'), 'Vacío o «·» si se desconoce'), campo('Tipo', tipo), campo('Año', texto(doc, u, 'anio'))),
          h('div', { class: 'fila' }, campo('Precio', texto(doc, u, 'precio', { ph: 'USD 315.000 · $160.000.000 · Consultar' })), campo('Fecha de publicación', texto(doc, u, 'fecha', { tipo: 'date' }), 'Ordena el listado: más nuevo primero'),
            h('div', { class: 'campo' }, h('span', { class: 'etq', text: 'Estado' }), h('label', null, vend, ' Marcar como vendido'))),
          campo('Bajada de la tarjeta', texto(doc, u, 'resumen', { largo: true, filas: 2 })),
          campo('Texto del aviso', texto(doc, u, 'texto', { largo: true, filas: 12 }), 'Una línea por dato. «Etiqueta: valor» se muestra en la ficha; las líneas cortas, como equipamiento.')),
        h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Foto de la tarjeta' }), h('small', { text: 'La que se ve en el listado de usados. Si queda vacía, se usa la primera de la galería.' }), campoImagen(doc, u, 'portada', 'usados', { base: 'usados/' })),
        h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Galería' }), h('small', { text: 'Fotos de la ficha del aviso. Se optimizan solas al subir (WebP, 1600 px).' }), editorFotos(doc, u.fotos = u.fotos || [], 'usados', { base: 'usados/' })),
        h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Documentos' }), listaTextos(doc, u.docs = u.docs || [], { agregar: 'Enlace (https://…)' }),
          h('div', { style: 'margin-top:8px' }, botonSubir('Subir PDF', 'documentos', function (url) { u.docs.push(url); marcar(doc); router(); }, { accept: 'application/pdf' }))));
    });
  };

  /* --- Puerto --- */
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  S.puerto = function () {
    return cargar('puerto').then(function (doc) {
      var P = doc.contenido;
      var orden = P.map(function (e, i) { return { e: e, i: i }; }).sort(function (a, b) { return String(b.e.fecha).localeCompare(String(a.e.fecha)); });
      return h('div', null, h('h1', { text: 'Puerto' }),
        h('p', { class: 'lede', text: 'Cada edición se arma con bloques (noticia o guía técnica). El índice ordena por fecha: la más nueva es la destacada. La dirección oceanic.cl/puerto-<mes>-<año>/ redirige sola a la edición.' }),
        barra(doc, h('button', { class: 'btn sec', text: '+ Nueva edición', onclick: function () {
          var d = new Date(), mes = MESES[d.getMonth()], a = d.getFullYear();
          P.push({ slug: 'puerto-' + mes + '-' + a, mes: mes.charAt(0).toUpperCase() + mes.slice(1) + ' ' + a, fecha: hoy(), portada: '', pdf: '', resumen: '', bloques: [] });
          marcar(doc); location.hash = '#edicion/' + (P.length - 1);
        } })),
        h('div', { class: 'tabla-wrap' }, h('table', { class: 'tabla' }, h('tr', null, h('th'), h('th', { text: 'Edición' }), h('th', { text: 'Fecha' }), h('th', { text: 'Bloques' }), h('th')),
          orden.map(function (x) {
            var e = x.e;
            return h('tr', null, h('td', null, e.portada ? h('img', { src: src(e.portada), alt: '', style: 'width:72px;height:54px;object-fit:cover;display:block' }) : ''),
              h('td', null, h('b', { text: e.mes }), h('br'), h('small', { class: 'chip', text: e.slug })), h('td', { text: e.fecha }), h('td', { text: (e.bloques || []).length }),
              h('td', { class: 'acc' }, h('a', { class: 'btn-sm', href: '#edicion/' + x.i, text: 'Editar' }), ' ', h('a', { class: 'btn-sm', href: '/puerto/edicion/?ed=' + encodeURIComponent(e.slug), target: '_blank', rel: 'noopener', text: 'Ver ↗' })));
          }))));
    });
  };
  S.edicion = function (arg) {
    return cargar('puerto').then(function (doc) {
      var i = parseInt(arg, 10), e = doc.contenido[i];
      if (!e) return h('p', null, 'Edición no encontrada. ', h('a', { href: '#puerto', text: 'Volver' }));
      e.bloques = e.bloques || [];
      var bloques = h('div');
      var redir = h('span', { class: 'redir' });
      function pintarRedir() { redir.textContent = '/' + e.slug + '   /puerto/edicion/?ed=' + e.slug + '   301'; }
      var slug = texto(doc, e, 'slug', { alCambiar: pintarRedir }); pintarRedir();
      function pintar() {
        vaciar(bloques);
        e.bloques.forEach(function (b, j) {
          function mover(d) { var k = j + d; if (k < 0 || k >= e.bloques.length) return; e.bloques.splice(k, 0, e.bloques.splice(j, 1)[0]); marcar(doc); pintar(); }
          var cab = h('div', { class: 'bloque-h' }, h('b', { text: (b.type === 'guia' ? 'Guía técnica' : 'Noticia') + ' · ' + (j + 1) }), h('span', { class: 'esp' }),
            h('button', { class: 'mini', text: '↑', onclick: function () { mover(-1); } }), h('button', { class: 'mini', text: '↓', onclick: function () { mover(1); } }),
            h('button', { class: 'mini x', text: 'Borrar', onclick: function () { if (confirm('¿Borrar este bloque?')) { e.bloques.splice(j, 1); marcar(doc); pintar(); } } }));
          var caja = h('div', { class: 'bloque' + (b.type === 'guia' ? ' guia' : '') }, cab);
          if (b.type === 'guia') {
            b.pasos = b.pasos || [];
            var pasos = h('div');
            (function pintarPasos() {
              vaciar(pasos);
              b.pasos.forEach(function (p, k) {
                p.puntos = p.puntos || [];
                pasos.appendChild(h('div', { class: 'panel' }, h('div', { class: 'fila' }, campo('N°', texto(doc, p, 'n')), campo('Título del paso', texto(doc, p, 'titulo'))),
                  h('span', { class: 'etq', text: 'Puntos' }), listaTextos(doc, p.puntos, { agregar: 'Punto' }),
                  h('button', { class: 'mini x', style: 'margin-top:6px', text: 'Quitar paso', onclick: function () { b.pasos.splice(k, 1); marcar(doc); pintarPasos(); } })));
              });
              pasos.appendChild(h('button', { class: 'mini', text: '+ Paso', onclick: function () { b.pasos.push({ n: String(b.pasos.length + 1).padStart(2, '0'), titulo: '', puntos: [] }); marcar(doc); pintarPasos(); } }));
            })();
            caja.appendChild(campo('Titular', texto(doc, b, 'titular'))); caja.appendChild(pasos);
          } else {
            b.cuerpo = b.cuerpo || [];
            caja.appendChild(h('div', { class: 'fila' }, campo('Etiqueta', texto(doc, b, 'etiqueta', { ph: 'Beneteau · Entrega en Chile' })), campo('Titular', texto(doc, b, 'titular'))));
            caja.appendChild(campo('Bajada', texto(doc, b, 'bajada', { largo: true, filas: 2 })));
            caja.appendChild(h('div', { class: 'campo' }, h('span', { class: 'etq', text: 'Cuerpo (párrafos)' }), listaTextos(doc, b.cuerpo, { largo: true, agregar: 'Párrafo' })));
            var opc = h('div');
            (function pintarOpc() {
              vaciar(opc);
              function quitar(k) { return h('button', { class: 'mini x', text: 'Quitar ' + k, onclick: function () { delete b[k]; marcar(doc); pintarOpc(); } }); }
              var add = [];
              if (b.galeria) opc.appendChild(h('div', { class: 'panel' }, h('b', { text: 'Galería (hasta 9 fotos)' }), ' ', quitar('galeria'), editorFotos(doc, b.galeria, 'puerto', { max: 9 })));
              else add.push(['galeria', 'Galería', function () { b.galeria = []; }]);
              if (b.specs) {
                var sp = h('div');
                (function pintarSpecs() {
                  vaciar(sp);
                  b.specs.forEach(function (s, k) {
                    sp.appendChild(h('div', { class: 'fila', style: 'align-items:end' }, campo('Dato', texto(doc, s, 'label', { ph: 'Eslora' })), campo('Valor', texto(doc, s, 'value', { ph: '15,5 m' })),
                      h('div', { class: 'campo' }, h('button', { class: 'mini x', text: '✕', onclick: function () { b.specs.splice(k, 1); marcar(doc); pintarSpecs(); } }))));
                  });
                  sp.appendChild(h('button', { class: 'mini', text: '+ Cifra', onclick: function () { b.specs.push({ label: '', value: '' }); marcar(doc); pintarSpecs(); } }));
                })();
                opc.appendChild(h('div', { class: 'panel' }, h('b', { text: 'Tabla de cifras' }), ' ', quitar('specs'), sp));
              } else add.push(['specs', 'Tabla de cifras', function () { b.specs = [{ label: '', value: '' }]; }]);
              if (b.evento) opc.appendChild(h('div', { class: 'panel' }, h('b', { text: 'Evento' }), ' ', quitar('evento'),
                h('div', { class: 'fila' }, campo('Fecha', texto(doc, b.evento, 'fecha', { ph: '15–18 Oct' })), campo('Lugar', texto(doc, b.evento, 'lugar'))), campo('Texto', texto(doc, b.evento, 'texto'))));
              else add.push(['evento', 'Evento', function () { b.evento = { fecha: '', lugar: '', texto: '' }; }]);
              if (b.cta) opc.appendChild(h('div', { class: 'panel' }, h('b', { text: 'Botón (CTA)' }), ' ', quitar('cta'),
                h('div', { class: 'fila' }, campo('Texto', texto(doc, b.cta, 'texto', { ph: 'Cotiza el tuyo' })), campo('Enlace', texto(doc, b.cta, 'href', { ph: '/marca/index.html?m=beneteau' }), 'Ruta del sitio o https://. No se aceptan otros esquemas.'))));
              else add.push(['cta', 'Botón (CTA)', function () { b.cta = { texto: '', href: '' }; }]);
              if (add.length) opc.appendChild(h('div', { class: 'filtros' }, h('small', { text: 'Agregar:' }), add.map(function (a) {
                return h('button', { class: 'mini', text: '+ ' + a[1], onclick: function () { a[2](); marcar(doc); pintarOpc(); } });
              })));
            })();
            caja.appendChild(opc);
          }
          bloques.appendChild(caja);
        });
        bloques.appendChild(h('div', { class: 'filtros' }, h('b', { text: 'Agregar bloque:' }),
          h('button', { class: 'btn sec', text: '+ Noticia', onclick: function () { e.bloques.push({ type: 'noticia', etiqueta: '', titular: '', bajada: '', cuerpo: [''] }); marcar(doc); pintar(); } }),
          h('button', { class: 'btn sec', text: '+ Guía técnica', onclick: function () { e.bloques.push({ type: 'guia', titular: '', pasos: [{ n: '01', titulo: '', puntos: [''] }] }); marcar(doc); pintar(); } })));
      }
      pintar();
      return h('div', null, h('p', null, h('a', { href: '#puerto', text: '← Puerto' })), h('h1', { text: 'Puerto · ' + (e.mes || 'Nueva edición') }),
        barra(doc, h('span', null, h('a', { class: 'btn-sm', href: '/puerto/edicion/?ed=' + encodeURIComponent(e.slug), target: '_blank', rel: 'noopener', text: 'Ver ↗' }), ' ',
          h('button', { class: 'btn-sm', style: 'color:var(--err)', text: 'Eliminar edición', onclick: function () {
            if (!confirm('¿Eliminar la edición ' + e.mes + '?')) return; doc.contenido.splice(i, 1); marcar(doc); location.hash = '#puerto';
          } }))),
        h('div', { class: 'panel' },
          h('div', { class: 'fila' }, campo('Mes', texto(doc, e, 'mes', { ph: 'Octubre 2026' })), campo('Fecha', texto(doc, e, 'fecha', { tipo: 'date' }), 'Ordena el índice'), campo('Slug (URL)', slug, 'puerto-<mes>-<año>')),
          h('small', null, 'Redirección automática: '), redir,
          campo('Intro corta', texto(doc, e, 'resumen', { largo: true, filas: 2 })),
          h('div', { class: 'fila' }, h('div', { class: 'campo' }, h('span', { class: 'etq', text: 'Portada' }), campoImagen(doc, e, 'portada', 'puerto')),
            campo('PDF (opcional)', h('div', null, texto(doc, e, 'pdf', { ph: 'https://…' }), h('div', { style: 'margin-top:6px' }, botonSubir('Subir PDF', 'documentos', function (u) { e.pdf = u; marcar(doc); router(); }, { accept: 'application/pdf' })))))),
        bloques);
    });
  };

  /* --- Documentos genéricos (marcas, textos de marca, charter, equipamiento) --- */
  S.contenido = function (clave) {
    return cargar(clave).then(function (doc) {
      var A = { marcas: 'Claim, intro, imagen principal y datos de cada marca.', 'marcas-contenido': 'Historia y textos institucionales de cada marca (traducción fiel de la web oficial).',
        charter: 'Destinos y opciones del cotizador de charter.', equipamiento: 'Categorías, marcas y textos de la página de equipamiento.' };
      return h('div', null, h('h1', { text: doc.titulo }), h('p', { class: 'lede', text: A[clave] || '' }), barra(doc), h('div', { class: 'panel' }, generico(doc, doc.contenido, 1)));
    });
  };

  /* --- Biblioteca de medios --- */
  S.medios = function () {
    return api('medios').then(function (r) {
      if (!r.ok) throw new Error(r.error);
      var carpeta = h('select', null, ['usados', 'puerto', 'modelos', 'marcas', 'documentos', 'otros'].map(function (c) { return h('option', { value: c, text: c }); }));
      return h('div', null, h('h1', { text: 'Imágenes y documentos' }),
        h('p', { class: 'lede', text: 'Archivos subidos desde el administrador. Las imágenes se optimizan al subir (WebP calidad 75, 1600 px). Copia la ruta para usarla en cualquier campo de imagen.' }),
        h('div', { class: 'filtros' }, 'Carpeta:', carpeta,
          h('label', { class: 'btn subir' }, h('input', { type: 'file', multiple: true, accept: 'image/*,application/pdf', onchange: function (ev) {
            var files = [].slice.call(ev.target.files); avisar('Subiendo…');
            files.reduce(function (p, f) { return p.then(function () { return subir(f, carpeta.value, 1600).then(function (x) { if (!x.ok) throw new Error(x.error); }); }); }, Promise.resolve())
              .then(function () { avisar('Listo'); router(); }).catch(function (e) { avisar(e.message, true); });
          } }), 'Subir archivos')),
        r.medios.length ? h('div', { class: 'grid-medios' }, r.medios.map(function (m) {
          return h('div', { class: 'medio' }, m.tipo === 'application/pdf' ? h('div', { class: 'pdf', text: 'PDF' }) : h('img', { src: m.url, alt: '', loading: 'lazy' }),
            h('div', null, h('b', { text: m.nombre || m.clave }), h('br'), h('small', { text: Math.round(m.bytes / 1024) + ' KB' + (m.ancho ? ' · ' + m.ancho + '×' + m.alto : '') }), h('br'),
              h('button', { class: 'mini', text: 'Copiar ruta', onclick: function () { navigator.clipboard.writeText(m.url).then(function () { avisar('Ruta copiada: ' + m.url); }); } }), ' ',
              h('button', { class: 'mini x', text: 'Borrar', onclick: function () {
                if (!confirm('¿Borrar este archivo? Si algún contenido lo usa, dejará de verse.')) return;
                api('medios?clave=' + encodeURIComponent(m.clave), { method: 'DELETE' }).then(function (x) { if (!x.ok) return avisar(x.error, true); router(); });
              } })));
        })) : h('p', { class: 'cargando', text: 'Todavía no hay archivos subidos.' }));
    });
  };

  /* --- Patrones prohibidos (Brand OS) --- */
  S.patrones = function () {
    return cargar('patrones').then(function (doc) {
      var L = doc.contenido;
      var cont = h('div');
      function pintar() {
        vaciar(cont);
        cont.appendChild(h('div', { class: 'tabla-wrap' }, h('table', { class: 'tabla' }, h('tr', null, h('th', { text: 'Patrón' }), h('th', { text: 'Expresión regular' }), h('th', { text: 'Motivo' }), h('th')),
          L.map(function (p, i) {
            if (typeof p === 'string') L[i] = p = { patron: p, regex: false, motivo: '' };
            return h('tr', null, h('td', null, texto(doc, p, 'patron')), h('td', null, h('input', { type: 'checkbox', checked: p.regex === true, onchange: function (e) { p.regex = e.target.checked; marcar(doc); } })),
              h('td', null, texto(doc, p, 'motivo')), h('td', { class: 'acc' }, h('button', { class: 'mini x', text: '✕', onclick: function () { L.splice(i, 1); marcar(doc); pintar(); } })));
          }))));
        cont.appendChild(h('button', { class: 'mini', style: 'margin-top:8px', text: '+ Patrón', onclick: function () { L.push({ patron: '', regex: false, motivo: '' }); marcar(doc); pintar(); } }));
      }
      pintar();
      var imp = h('input', { type: 'file', accept: 'application/json,.json', onchange: function () {
        var f = imp.files[0]; if (!f) return;
        f.text().then(function (t) {
          var d = JSON.parse(t), arr = Array.isArray(d) ? d : (d.patrones || d.patterns || d.prohibidos || []);
          if (!arr.length) return avisar('No encontré una lista de patrones en el archivo', true);
          arr.forEach(function (p) { L.push(typeof p === 'string' ? { patron: p, regex: false, motivo: '' } : { patron: p.patron || p.pattern || p.texto || '', regex: p.regex === true || p.tipo === 'regex', motivo: p.motivo || p.reason || p.razon || '' }); });
          marcar(doc); pintar(); avisar(arr.length + ' patrones importados. Revisa y guarda.');
        }).catch(function () { avisar('El archivo no es JSON válido', true); });
      } });
      return h('div', null, h('h1', { text: 'Patrones prohibidos' }),
        h('p', { class: 'lede', text: 'Palabras o frases que el Brand OS no permite. Todo texto que se guarda en el administrador se revisa contra esta lista: si aparece un patrón, no se puede guardar hasta corregirlo.' }),
        barra(doc, h('label', { class: 'btn-sm subir' }, imp, 'Importar patrones-prohibidos.json')), cont);
    });
  };

  /* ================= navegación ================= */
  var yo = '';
  function router() {
    var hash = (location.hash || '#inicio').slice(1), p = hash.split('/'), sec = p[0], arg = p.slice(1).join('/');
    var fn = S[sec] || S.inicio;
    [].forEach.call(document.querySelectorAll('.lateral a'), function (a) {
      var s = a.getAttribute('data-sec');
      a.classList.toggle('on', s === hash || s === sec || (sec === 'ficha' && s === 'traducciones') || (sec === 'usado' && s === 'usados') || (sec === 'edicion' && s === 'puerto'));
    });
    document.getElementById('lateral').classList.remove('abierto');
    var h0 = document.querySelector('.hist'); if (h0) h0.remove();
    vaciar(app).appendChild(h('p', { class: 'cargando', text: 'Cargando…' }));
    Promise.resolve().then(function () { return fn(arg); }).then(function (el) { vaciar(app).appendChild(el); app.focus({ preventScroll: true }); })
      .catch(function (e) { vaciar(app).appendChild(h('div', { class: 'errores', text: e.message || String(e) })); });
  }
  window.addEventListener('hashchange', router);
  document.getElementById('menuBtn').addEventListener('click', function () {
    var l = document.getElementById('lateral'); l.classList.toggle('abierto');
    this.setAttribute('aria-expanded', l.classList.contains('abierto'));
  });
  var vista = document.getElementById('vistaPrevia');
  try { vista.checked = /(?:^|;\s*)oceanic_vista_on=1/.test(document.cookie); } catch (e) { /* sin cookies */ }
  vista.addEventListener('change', function () {
    api(vista.checked ? 'vista' : 'vista/salir', { method: 'POST' }).then(function (r) {
      if (!r.ok) { vista.checked = !vista.checked; return avisar(r.error, true); }
      document.cookie = 'oceanic_vista_on=' + (vista.checked ? '1; Max-Age=3600' : '; Max-Age=0') + '; Path=/admin; SameSite=Lax';
      avisar(vista.checked ? 'Vista previa activa por 1 hora: el sitio muestra los borradores guardados (solo en este navegador).' : 'Vista previa apagada: el sitio muestra lo publicado.');
    });
  });
  api('estado').then(function (r) {
    if (r.ok) { yo = r.email; document.getElementById('yo').textContent = r.email; }
    router();
  });
})();
