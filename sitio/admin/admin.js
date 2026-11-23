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
  var IMG_K = /^(hero|img|imagen|portada|foto|logo|tarjeta|poster)$|-img$/;
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
        return { inicio: '#portada', publicacion: '#barcos', usados: '#usados', puerto: '#puerto', catalogo: '#catalogo', contenido: '#catalogo', patrones: '#patrones' }[clave] || '#contenido/' + clave;
      }
      return h('div', null, h('h1', { text: 'Administrador del sitio' }),
        h('p', { class: 'lede', text: 'Edita, guarda como borrador y publica. Lo publicado aquí se superpone al contenido del repo; con «Vista previa de borradores» (arriba) ves los borradores en el sitio antes de publicarlos.' }),
        h('div', { class: 'kpis' },
          [['Borradores sin publicar', String(pend.length), pend.length ? 'Cambios guardados que aún no se ven en el sitio' : 'Todo lo guardado ya está publicado', pend.length ? 'alerta' : 'bien',
            'Cantidad de documentos con cambios guardados como borrador que todavía no se publican. Si es 0, el sitio muestra todo lo que editaste.'],
           ['Publicados desde el CMS', String(r.docs.filter(function (d) { return d.pub_version; }).length), 'Documentos que el sitio lee desde el administrador', '',
            'Documentos cuyo contenido publicado aquí reemplaza al archivo del repositorio. El resto del sitio sigue leyendo el repositorio.'],
           ['Documentos editables', String(r.docs.length), 'Entre textos, catálogo, fichas y configuración', '',
            'Total de documentos que se pueden editar desde este administrador.'],
           ['Último cambio', r.docs.length ? fecha(r.docs.map(function (d) { return d.actualizado || ''; }).sort().pop()) : '—', 'Fecha de la edición más reciente', 'chico',
            'Cuándo se guardó por última vez cualquier documento del administrador.']
          ].map(function (k) { return h('div', { class: 'kpi ' + k[3], 'data-tip': k[4] }, h('small', { text: k[0] }), h('b', { text: k[1] }), h('span', { text: k[2] })); })),
        h('div', { class: 'tarjetas' }, [
          ['#portada', 'Portada del sitio', 'Video principal del inicio y sus textos'],
          ['#barcos', 'Publicación y destacados', 'Prender o apagar barcos y elegir los 3 de la portada'],
          ['#nuevo-modelo', 'Nuevo modelo', 'Cargar a mano un barco nuevo, con ficha, textos y fotos'],
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
          h('p', null, h('a', { class: 'btn', href: '#nuevo-modelo', text: '+ Nuevo modelo (carga manual)' })),
          Object.keys(C).map(function (m) {
            return h('div', null, h('div', { class: 'marca-h' }, h('h2', { text: C[m].nombre })),
              h('div', { class: 'tarjetas' }, C[m].modelos.map(function (mo) {
                return h('a', { class: 'tarjeta', href: (mo.manual ? '#modelo/' : '#catalogo/') + m + '/' + mo.slug }, h('b', { text: mo.nombre }), h('span', { text: [mo.manual ? 'carga manual' : '', mo.tipo, mo.anio].filter(Boolean).join(' · ') }));
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
        h('p', { class: 'lede', text: 'El listado muestra primero los disponibles, del más nuevo al más antiguo (por fecha de publicación); los vendidos van al final. Un aviso oculto no aparece en el sitio ni se puede abrir por su dirección.' }),
        barra(doc, h('button', { class: 'btn sec', text: '+ Nuevo aviso', onclick: function () {
          U.unshift({ id: '', nombre: '', marca: '', tipo: 'motor', anio: '', precio: 'Consultar', estado: 'disponible', fecha: hoy(), resumen: '', texto: '', fotos: [], docs: [] });
          marcar(doc); location.hash = '#usado/0';
        } })),
        h('div', { class: 'tabla-wrap' }, h('table', { class: 'tabla' }, h('tr', null, h('th'), h('th', { text: 'Aviso' }), h('th', { text: 'Precio' }), h('th', { text: 'Publicado' }), h('th', { text: 'Estado' }), h('th')),
          ordenUsados(U).map(function (x) {
            var u = x.u, f = (u.fotos || [])[0];
            return h('tr', { class: u.estado === 'vendido' || u.oculto ? 'apagado' : '' },
              h('td', null, f ? h('img', { src: src(f, 'usados/'), alt: '', style: 'width:72px;height:54px;object-fit:cover;display:block' }) : ''),
              h('td', null, h('b', { text: u.nombre || '(sin nombre)' }), h('br'), h('small', { text: [u.marca, TIPOS[u.tipo], u.anio].filter(Boolean).join(' · ') })),
              h('td', { text: u.precio }), h('td', { text: u.fecha || '' }),
              h('td', null, h('span', { class: 'chip ' + (u.estado === 'vendido' ? 'err' : 'ok'), text: u.estado }), u.oculto ? [' ', h('span', { class: 'chip err', text: 'oculto' })] : null),
              h('td', { class: 'acc' }, h('a', { class: 'btn-sm', href: '#usado/' + x.i, text: 'Editar' })));
          }))));
    });
  };
  S.usado = function (arg) {
    return cargar('usados').then(function (doc) {
      var i = parseInt(arg, 10), u = doc.contenido[i];
      if (!u) return h('p', null, 'Aviso no encontrado. ', h('a', { href: '#usados', text: 'Volver' }));
      var vend = h('input', { type: 'checkbox', checked: u.estado === 'vendido', onchange: function () { u.estado = vend.checked ? 'vendido' : 'disponible'; marcar(doc); } });
      var vis = h('input', { type: 'checkbox', checked: !u.oculto, onchange: function () { if (vis.checked) delete u.oculto; else u.oculto = true; marcar(doc); } });
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
            h('div', { class: 'campo' }, h('span', { class: 'etq', text: 'Estado' }), h('label', null, vend, ' Marcar como vendido'),
              h('div', { class: 'interruptor-fila' }, h('label', { class: 'interruptor' }, vis, h('span')), ' Visible en el sitio'))),
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
          // foto principal del bloque (y logo de la marca, opcional)
          var lado = h('input', { type: 'checkbox', checked: !!b.foto_lado, onchange: function () { if (lado.checked) b.foto_lado = true; else delete b.foto_lado; marcar(doc); } });
          caja.appendChild(h('div', { class: 'panel' }, h('b', { text: 'Foto principal' }), h('small', { text: ' · arriba del texto; marca «al lado» si es vertical o chica' }),
            campoImagen(doc, b, 'foto', 'puerto'), h('label', null, lado, ' Mostrar la foto al lado del texto'),
            h('b', { style: 'display:block;margin-top:10px', text: 'Logo (opcional)' }), campoImagen(doc, b, 'logo', 'puerto')));
          if (b.type === 'guia') {
            b.pasos = b.pasos || [];
            var pasos = h('div');
            (function pintarPasos() {
              vaciar(pasos);
              b.pasos.forEach(function (p, k) {
                p.puntos = p.puntos || [];
                pasos.appendChild(h('div', { class: 'panel' }, h('div', { class: 'fila' }, campo('N°', texto(doc, p, 'n')), campo('Título del paso', texto(doc, p, 'titulo')), campo('Subtítulo', texto(doc, p, 'sub'))),
                  h('span', { class: 'etq', text: 'Puntos' }), listaTextos(doc, p.puntos, { agregar: 'Punto' }),
                  h('button', { class: 'mini x', style: 'margin-top:6px', text: 'Quitar paso', onclick: function () { b.pasos.splice(k, 1); marcar(doc); pintarPasos(); } })));
              });
              pasos.appendChild(h('button', { class: 'mini', text: '+ Paso', onclick: function () { b.pasos.push({ n: String(b.pasos.length + 1).padStart(2, '0'), titulo: '', puntos: [] }); marcar(doc); pintarPasos(); } }));
            })();
            b.cuerpo = b.cuerpo || [];
            caja.appendChild(h('div', { class: 'fila' }, campo('Etiqueta', texto(doc, b, 'etiqueta', { ph: 'Mantenimiento · Guía técnica' })), campo('Titular', texto(doc, b, 'titular'))));
            caja.appendChild(campo('Bajada', texto(doc, b, 'bajada', { largo: true, filas: 2 })));
            caja.appendChild(h('div', { class: 'campo' }, h('span', { class: 'etq', text: 'Introducción (párrafos)' }), listaTextos(doc, b.cuerpo, { largo: true, agregar: 'Párrafo' })));
            caja.appendChild(h('small', { text: 'Puntos con «Etiqueta: texto» muestran la etiqueta en negrita.' })); caja.appendChild(pasos);
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
          (function () { var v = h('input', { type: 'checkbox', checked: !e.oculto, onchange: function () { if (v.checked) delete e.oculto; else e.oculto = true; marcar(doc); } });
            return h('div', { class: 'interruptor-fila' }, h('label', { class: 'interruptor' }, v, h('span')), ' Visible en el sitio (una edición oculta no aparece en el índice ni se abre por su dirección)'); })(),
          h('div', { class: 'fila' }, h('div', { class: 'campo' }, h('span', { class: 'etq', text: 'Portada del newsletter' }), campoImagen(doc, e, 'tapa', 'puerto')),
            h('div', { class: 'campo' }, h('span', { class: 'etq', text: 'Foto grande de la edición (opcional, 1600 px o más)' }), campoImagen(doc, e, 'portada', 'puerto'))),
          h('div', { class: 'fila' },
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

  /* --- Barco nuevo con carga manual: crear y editar (ficha técnica, textos, fotos y visible/oculto) --- */
  var TIPOS_BARCO = { motor: 'Motor', vela: 'Vela', catamaran_vela: 'Catamarán a vela', catamaran_motor: 'Catamarán a motor', motor_electrico: 'Motor eléctrico' };
  var BASE_FICHA = [['eslora', 'Eslora Total'], ['manga', 'Manga Casco'], ['calado', 'Calado'], ['peso', 'Desplazamiento en rosca'],
    ['camarotes', 'Camarotes'], ['banos', 'Baños'], ['literas', 'Literas'], ['combustible', 'Capacidad Combustible'],
    ['agua', 'Capacidad Agua Dulce'], ['motor', 'Motorización'], ['velocidad', 'Velocidad máxima'], ['certificacion', 'Certificación'], ['construccion', 'Construcción']];
  function selector(opciones, valor, alCambiar) {
    var s = h('select', { onchange: function () { alCambiar(s.value); } }, Object.keys(opciones).map(function (k) { return h('option', { value: k, text: opciones[k] }); }));
    s.value = valor; return s;
  }
  S['nuevo-modelo'] = function () {
    return Promise.all([cargar('catalogo'), cargar('contenido'), cargar('publicacion'), cargar('marcas')]).then(function (x) {
      var C = x[0].contenido, marcas = {};
      Object.keys(C).forEach(function (m) { marcas[m] = C[m].nombre; });
      var datos = { marca: Object.keys(C)[0], nombre: '', tipo: 'motor' };
      var nombre = h('input', { placeholder: 'Ej. Oceanis 46.1', oninput: function () { datos.nombre = nombre.value; } });
      return h('div', null, h('p', null, h('a', { href: '#catalogo', text: '← Catálogo' })), h('h1', { text: 'Nuevo modelo' }),
        h('p', { class: 'lede', text: 'Crea un barco con carga manual. Queda oculto hasta que lo prendas y publiques: así puedes completar ficha, textos y fotos antes de mostrarlo.' }),
        h('div', { class: 'panel' },
          h('div', { class: 'fila' }, campo('Marca', selector(marcas, datos.marca, function (v) { datos.marca = v; })), campo('Nombre del modelo', nombre),
            campo('Tipo', selector(TIPOS_BARCO, datos.tipo, function (v) { datos.tipo = v; }))),
          h('button', { class: 'btn', text: 'Crear modelo', onclick: function () {
            var n = datos.nombre.trim(); if (!n) return avisar('Escribe el nombre del modelo', true);
            var slug = slugify(n), M = C[datos.marca];
            if (M.modelos.some(function (z) { return z.slug === slug; })) return avisar('Ya existe un modelo con ese nombre en ' + M.nombre, true);
            var mo = { slug: slug, nombre: n, anio: '', tipo: datos.tipo, desc: '', desc_larga: '', specs: [], hero: '', tarjeta: '', manual: true };
            BASE_FICHA.forEach(function (b) { mo[b[0]] = ''; });
            M.modelos.push(mo); marcar(x[0]);
            x[1].contenido[datos.marca + '/' + slug] = { secciones: [{ t: 'Introducción', p: [''] }], galeria: { 'Galería': [] } }; marcar(x[1]);
            x[2].contenido.ocultos[datos.marca + '/' + slug] = 'Nuevo, en preparación'; marcar(x[2]);
            avisar('Modelo creado. Completa los datos y guarda: hay tres documentos (catálogo, textos y publicación).');
            location.hash = '#modelo/' + datos.marca + '/' + slug;
          } })));
    });
  };
  S.modelo = function (arg) {
    return Promise.all([cargar('catalogo'), cargar('contenido'), cargar('publicacion')]).then(function (x) {
      var cat = x[0], con = x[1], pub = x[2], p = arg.split('/'), M = cat.contenido[p[0]];
      var mo = M && M.modelos.filter(function (z) { return z.slug === p[1]; })[0];
      if (!mo) return h('p', null, 'Modelo no encontrado. ', h('a', { href: '#catalogo', text: 'Volver' }));
      var CC = con.contenido[arg] = con.contenido[arg] || { secciones: [{ t: 'Introducción', p: [''] }], galeria: { 'Galería': [] } };
      CC.secciones = CC.secciones || []; CC.galeria = CC.galeria || {}; CC.galeria['Galería'] = CC.galeria['Galería'] || [];
      mo.specs = mo.specs || [];
      // ficha técnica: los datos base se reflejan en la tabla (specs), que es lo que muestra la página
      function sincronizar() {
        var otras = mo.specs.filter(function (s) { return !BASE_FICHA.some(function (b) { return b[1] === s.label; }); });
        mo.specs = BASE_FICHA.filter(function (b) { return String(mo[b[0]] || '').trim(); }).map(function (b) { return { label: b[1], value: String(mo[b[0]]).trim(), note: '' }; }).concat(otras);
      }
      var visible = h('input', { type: 'checkbox', checked: !pub.contenido.ocultos[arg], onchange: function () {
        if (visible.checked) delete pub.contenido.ocultos[arg]; else pub.contenido.ocultos[arg] = 'Apagado desde el administrador';
        marcar(pub); } });
      var tablaExtra = h('div');
      function pintarExtra() {
        vaciar(tablaExtra);
        mo.specs.forEach(function (s, i) {
          if (BASE_FICHA.some(function (b) { return b[1] === s.label; })) return;
          tablaExtra.appendChild(h('div', { class: 'fila' }, campo('Dato', texto(cat, s, 'label')), campo('Valor', texto(cat, s, 'value')),
            h('button', { class: 'mini x', text: '✕', title: 'Quitar', onclick: function () { mo.specs.splice(i, 1); marcar(cat); pintarExtra(); } })));
        });
        tablaExtra.appendChild(h('button', { class: 'mini', text: '+ Otro dato técnico', onclick: function () { mo.specs.push({ label: '', value: '', note: '' }); marcar(cat); pintarExtra(); } }));
      }
      pintarExtra();
      var secs = h('div');
      function pintarSecs() {
        vaciar(secs);
        CC.secciones.forEach(function (s, i) {
          s.p = s.p || [''];
          secs.appendChild(h('div', { class: 'panel' },
            h('div', { class: 'fila' }, campo('Título del bloque', texto(con, s, 't', { ph: 'Diseño, A bordo, Navegación…' }), i === 0 ? 'El bloque «Introducción» es el texto principal de la página.' : null),
              h('button', { class: 'mini x', text: 'Quitar bloque', onclick: function () { if (confirm('¿Quitar el bloque «' + (s.t || '') + '»?')) { CC.secciones.splice(i, 1); marcar(con); pintarSecs(); } } })),
            listaTextos(con, s.p, { agregar: 'Párrafo' })));
        });
        secs.appendChild(h('button', { class: 'mini', text: '+ Bloque de texto', onclick: function () { CC.secciones.push({ t: '', p: [''] }); marcar(con); pintarSecs(); } }));
      }
      pintarSecs();
      var base = BASE_FICHA.map(function (b) { return campo(b[1], texto(cat, mo, b[0], { alCambiar: function () { sincronizar(); } })); });
      return h('div', null, h('p', null, h('a', { href: '#catalogo', text: '← Catálogo' })), h('h1', { text: mo.nombre }),
        h('p', { class: 'lede' }, 'Barco de carga manual. Sin opcionales ni precios (no se publican en barcos nuevos). ',
          h('a', { href: verModelo(arg), target: '_blank', rel: 'noopener', text: 'Ver en el sitio ↗' })),
        h('h2', { text: '1 · Visible en el sitio' }), barra(pub), h('div', { class: 'panel' },
          h('div', { class: 'interruptor-fila' }, h('label', { class: 'interruptor' }, visible, h('span')), ' Mostrar este modelo en el sitio (gama de la marca, menús y ficha)')),
        h('h2', { text: '2 · Ficha técnica, fotos principales y descripción' }), barra(cat),
        h('div', { class: 'panel' },
          h('div', { class: 'fila' }, campo('Nombre', texto(cat, mo, 'nombre')), campo('Tipo', selector(TIPOS_BARCO, mo.tipo, function (v) { mo.tipo = v; marcar(cat); })), campo('Año', texto(cat, mo, 'anio'))),
          campo('Descripción corta (tarjeta)', texto(cat, mo, 'desc', { largo: true, filas: 2 })),
          campo('Descripción larga', texto(cat, mo, 'desc_larga', { largo: true, filas: 4 }), 'Se usa si no hay texto en el bloque «Introducción».')),
        h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Ficha técnica' }), h('div', { class: 'grilla-campos' }, base),
          h('h3', { text: 'Otros datos técnicos' }), tablaExtra),
        h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Foto de portada' }), h('small', { text: 'Horizontal, barco completo. Se optimiza sola al subir.' }), campoImagen(cat, mo, 'hero', 'modelos'),
          h('h3', { text: 'Foto de la tarjeta (3:2)' }), h('small', { text: 'La que se ve en la gama de la marca. Si queda vacía se usa la portada.' }), campoImagen(cat, mo, 'tarjeta', 'modelos')),
        h('h2', { text: '3 · Textos y galería' }), barra(con),
        h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Galería' }), h('small', { text: 'Fotos de la ficha (WebP, 1600 px, se optimizan al subir).' }), editorFotos(con, CC.galeria['Galería'], 'modelos')),
        secs);
    });
  };

  /* --- Portada del inicio: video principal y textos --- */
  // Portada en carrusel: diapositivas de imagen o video. Las imágenes duran «intervalo» segundos; los videos pasan
  // a la siguiente al terminar (uno tras otro).
  function panelCarrusel(doc, I) {
    if (!Array.isArray(I.diapositivas)) I.diapositivas = [];
    var lista = h('div');
    function pintar() {
      vaciar(lista);
      I.diapositivas.forEach(function (d, i) {
        var tipo = h('select', { onchange: function () { d.tipo = tipo.value; marcar(doc); pintar(); } },
          h('option', { value: 'imagen', text: 'Imagen' }), h('option', { value: 'video', text: 'Video' }));
        tipo.value = d.tipo === 'video' ? 'video' : 'imagen';
        var cuerpo;
        if (tipo.value === 'video') {
          var url = texto(doc, d, 'src', { ph: 'https://…/video.mp4 o /media/…' });
          cuerpo = h('div', null,
            campo('Dirección del video (MP4)', url, 'Sin sonido, horizontal, menos de 20 MB. Pasa a la siguiente diapositiva al terminar.'),
            h('div', { style: 'margin:6px 0 10px' }, botonSubir('Subir video MP4', 'videos', function (u) { d.src = u; url.value = u; marcar(doc); }, { accept: 'video/mp4,video/webm' })),
            h('small', { text: 'Imagen del video (se ve mientras carga y en celulares):' }), campoImagen(doc, d, 'poster', 'portada'));
        } else cuerpo = campoImagen(doc, d, 'src', 'portada');
        lista.appendChild(h('div', { class: 'panel', style: 'background:var(--natural,#f4f2ee)' },
          h('div', { class: 'filtros' }, h('b', { text: 'Diapositiva ' + (i + 1) }), tipo,
            h('button', { class: 'mini', title: 'Antes', text: '↑', onclick: function () { if (i) { I.diapositivas.splice(i - 1, 0, I.diapositivas.splice(i, 1)[0]); marcar(doc); pintar(); } } }),
            h('button', { class: 'mini x', title: 'Quitar', text: '✕', onclick: function () { I.diapositivas.splice(i, 1); marcar(doc); pintar(); } })),
          cuerpo));
      });
      lista.appendChild(h('div', { class: 'filtros' },
        h('button', { class: 'mini', text: '+ Imagen', onclick: function () { I.diapositivas.push({ tipo: 'imagen', src: '' }); marcar(doc); pintar(); } }),
        h('button', { class: 'mini', text: '+ Video', onclick: function () { I.diapositivas.push({ tipo: 'video', src: '', poster: '' }); marcar(doc); pintar(); } })));
    }
    var modo = selector({ video: 'Video único (el de arriba)', carrusel: 'Carrusel de imágenes y/o videos' }, I.modo || 'video', function (v) { I.modo = v; marcar(doc); });
    var seg = texto(doc, I, 'intervalo', { tipo: 'number', ph: '6' });
    seg.min = 3; seg.max = 30; seg.style.maxWidth = '120px';
    seg.addEventListener('input', function () { I.intervalo = seg.value === '' ? undefined : Number(seg.value); marcar(doc); });
    pintar();
    return h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Tipo de portada' }),
      campo('Modo', modo, 'En carrusel se necesitan al menos 2 diapositivas; con menos, se muestra el video único.'),
      campo('Segundos por imagen', seg, 'Entre 3 y 30 (6 si se deja vacío). Los videos duran lo que dura el video.'),
      lista);
  }

  S.portada = function () {
    return cargar('inicio').then(function (doc) {
      var I = doc.contenido;
      var vid = h('video', { muted: true, loop: true, playsinline: true, controls: true, style: 'width:100%;max-width:640px;display:block;background:#000', src: I.video || null, poster: I.poster ? src(I.poster) : null });
      var url = texto(doc, I, 'video', { ph: 'https://…/video.mp4 o /media/…', alCambiar: function (v) { vid.src = v; } });
      return h('div', null, h('h1', { text: 'Portada del inicio' }),
        h('p', { class: 'lede', text: 'El video de fondo de la portada y sus textos. En celulares, con ahorro de datos o movimiento reducido se muestra la imagen de respaldo.' }),
        barra(doc),
        h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Video principal' }), vid,
          campo('Dirección del video (MP4)', url, 'Video horizontal, sin sonido, de 10 a 30 segundos y menos de 20 MB. Puedes subirlo o pegar el enlace de la web oficial de la marca.'),
          h('div', { style: 'margin-top:8px' }, botonSubir('Subir video MP4', 'videos', function (u) { I.video = u; url.value = u; vid.src = u; marcar(doc); }, { accept: 'video/mp4,video/webm' })),
          h('h3', { text: 'Imagen de respaldo' }), h('small', { text: 'Se ve mientras carga el video y en celulares. Horizontal, 2560 px.' }), campoImagen(doc, I, 'poster', 'portada')),
        panelCarrusel(doc, I),
        h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Textos' }),
          campo('Antetítulo', texto(doc, I, 'antetitulo')),
          campo('Titular', texto(doc, I, 'titular', { largo: true, filas: 3 }), 'Cada salto de línea se respeta en la portada.'),
          campo('Bajada', texto(doc, I, 'bajada', { largo: true, filas: 3 }))));
    });
  };


  /* --- Textos del sitio: todos los textos fijos de todas las páginas (textos-data.js + textos-base.json) --- */
  var NOMBRES_PAG = { inicio: 'Inicio', nosotros: 'Nosotros', charter: 'Charter', usados: 'Usados', equipamiento: 'Equipamiento', puerto: 'Puerto',
    contacto: 'Contacto', 'arriendo-boyas': 'Arriendo de boyas', privacidad: 'Política de privacidad', terminos: 'Términos de uso',
    gracias: 'Gracias (tras cotizar)', '404': 'Página no encontrada', evento: 'Evento', marca: 'Marca', universo: 'Categoría',
    'usados-barco': 'Ficha de usado', 'puerto-edicion': 'Edición de Puerto' };
  function etiquetaSec(sec) {
    if (sec === 'SEO') return 'Título y descripción para buscadores (SEO)';
    if (sec === 'pagina') return 'Página';
    var m = /^([a-z]+)([#.])(.+)$/.exec(sec);
    return m ? (m[2] === '#' ? 'Sección «' + m[3] + '»' : 'Bloque «' + m[3] + '»') : sec;
  }
  S.textos = function (arg) {
    return Promise.all([cargar('textos'), fetch('/assets/data/textos-base.json', { credentials: 'same-origin' }).then(function (r) { return r.json(); })]).then(function (res) {
      var doc = res[0], base = res[1], T = doc.contenido;
      if (Array.isArray(T) || T == null || typeof T !== 'object') T = doc.contenido = {};
      var orden = Object.keys(NOMBRES_PAG);
      var paginas = base.paginas.filter(function (p) { return p.items.length; }).sort(function (a, b) {
        var i = orden.indexOf(a.pagina), j = orden.indexOf(b.pagina); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j);
      });
      var actual = paginas.filter(function (p) { return p.pagina === arg; })[0] || paginas[0];
      var cont = h('div');

      function editados(p) { return p.items.filter(function (i) { return Object.prototype.hasOwnProperty.call(T, i.id); }).length; }
      var tabs = h('div', { class: 'tx-tabs', role: 'tablist' });
      function pintarTabs() {
        vaciar(tabs);
        paginas.forEach(function (p) {
          var n = editados(p);
          tabs.appendChild(h('a', { class: 'tx-tab' + (p === actual ? ' on' : ''), href: '#textos/' + p.pagina, role: 'tab', 'aria-selected': p === actual ? 'true' : 'false' },
            NOMBRES_PAG[p.pagina] || p.pagina, n ? h('span', { class: 'chip ok', text: n + ' editado' + (n > 1 ? 's' : '') }) : null));
        });
      }

      var buscar = h('input', { type: 'search', placeholder: 'Buscar un texto…', 'aria-label': 'Buscar un texto en esta página', oninput: function () { pintarLista(); } });
      var contador = h('span', { class: 'tx-cuenta' });
      var lista = h('div', { class: 'tx-lista' });

      function item(it) {
        var edit = Object.prototype.hasOwnProperty.call(T, it.id);
        var valor = edit ? T[it.id] : it.html;
        var largo = it.id.indexOf('.titulo') > 0 || it.id.indexOf('.desc') > 0;
        var ta = h('textarea', { rows: Math.min(8, Math.max(1, Math.ceil(valor.length / 90))), spellcheck: 'true', 'aria-label': 'Texto ' + it.id });
        ta.value = valor;
        var marca = h('span', { class: 'tx-marca' });
        var ori = h('div', { class: 'tx-ori' });
        var cta = h('small', { class: 'tx-cta' });
        var restaurar = h('button', { class: 'btn-sm', type: 'button', text: 'Restaurar el original', onclick: function () { ta.value = it.html; cambio(); } });
        function contar() {
          var n = ta.value.length;
          if (it.id.slice(-7) === '.titulo') { cta.textContent = n + ' caracteres · ideal hasta 60'; cta.className = 'tx-cta' + (n > 60 ? ' pasa' : ''); }
          else if (it.id.slice(-5) === '.desc') { cta.textContent = n + ' caracteres · ideal hasta 160'; cta.className = 'tx-cta' + (n > 160 ? ' pasa' : ''); }
        }
        function pintar() {
          var ed = Object.prototype.hasOwnProperty.call(T, it.id);
          marca.textContent = ed ? 'Editado' : ''; marca.className = 'tx-marca' + (ed ? ' on' : '');
          vaciar(ori);
          if (ed) { ori.appendChild(h('b', { text: 'Original: ' })); ori.appendChild(document.createTextNode(it.html)); ori.appendChild(restaurar); }
          contar();
        }
        function cambio() {
          var v = ta.value;
          if (v.trim() === '' || v === it.html) delete T[it.id]; else T[it.id] = v;   // vacío = vuelve al original
          marcar(doc); pintar(); pintarTabs();
        }
        ta.addEventListener('input', cambio);
        pintar();
        return h('div', { class: 'tx-item' + (largo ? ' seo' : '') }, h('div', { class: 'tx-cab' }, h('code', { text: it.id }), marca), ta, cta, ori);
      }

      function pintarLista() {
        var q = buscar.value.trim().toLowerCase();
        vaciar(lista);
        var visibles = actual.items.filter(function (i) { return !q || i.html.toLowerCase().indexOf(q) >= 0 || (T[i.id] || '').toLowerCase().indexOf(q) >= 0 || i.id.indexOf(q) >= 0; });
        contador.textContent = visibles.length + ' de ' + actual.items.length + ' textos';
        var grupos = [], ult = null;
        visibles.forEach(function (i) { if (!ult || ult.sec !== i.sec) { ult = { sec: i.sec, items: [] }; grupos.push(ult); } ult.items.push(i); });
        grupos.sort(function (a, b) { return (a.sec === 'SEO' ? 0 : 1) - (b.sec === 'SEO' ? 0 : 1); });
        grupos.forEach(function (g) {
          lista.appendChild(h('section', { class: 'tx-grupo' }, h('h3', { text: etiquetaSec(g.sec) }), g.items.map(item)));
        });
        if (!visibles.length) lista.appendChild(h('p', { class: 'vacio', text: 'No hay textos que coincidan con la búsqueda.' }));
      }

      var url = '/' + actual.archivo.replace(/index\.html$/, '');
      pintarTabs(); pintarLista();
      cont.appendChild(h('h1', { text: 'Textos del sitio' }));
      cont.appendChild(h('p', { class: 'lede', text: 'Cambia cualquier texto fijo de cualquier página: títulos, párrafos, botones, cifras y el título y la descripción que ve Google. Escribe sobre el texto y pulsa Guardar borrador y luego Publicar. Para volver a un texto original, usa «Restaurar el original» o borra todo el contenido.' }));
      cont.appendChild(barra(doc));
      cont.appendChild(h('div', { class: 'panel tx-nota' },
        h('b', { text: 'Formato permitido: ' }), 'negrita ', h('code', { text: '<b>texto</b>' }), ', cursiva ', h('code', { text: '<i>texto</i>' }), ', salto de línea ', h('code', { text: '<br>' }),
        ' y enlaces ', h('code', { text: '<a href="/contacto/">texto</a>' }), '. Cualquier otra marca se descarta. El título y la descripción van sin formato.',
        h('br'), h('b', { text: 'Estas secciones tienen su propio lugar: ' }),
        h('a', { href: '#portada', text: 'Portada del inicio' }), ' · ', h('a', { href: '#portafolio', text: 'Orden, categorías y marcas' }), ' · ',
        h('a', { href: '#catalogo', text: 'Modelos' }), ' · ', h('a', { href: '#contenido/marcas', text: 'Marcas' }), ' · ', h('a', { href: '#usados', text: 'Usados' }), ' · ',
        h('a', { href: '#puerto', text: 'Puerto' }), ' · ', h('a', { href: '#contenido/charter', text: 'Charter' }), ' · ', h('a', { href: '#contenido/equipamiento', text: 'Equipamiento' }),
        '. Los formularios, el menú y el pie se arman con código y se cambian pidiéndolo.'));
      cont.appendChild(tabs);
      cont.appendChild(h('div', { class: 'tx-barra' }, buscar, contador, h('a', { class: 'btn-sm', href: url, target: '_blank', rel: 'noopener', text: 'Ver esta página ↗' })));
      cont.appendChild(lista);
      return cont;
    });
  };


  /* --- Respaldos: copias diarias de la base D1 y de los archivos subidos, guardadas en R2 (worker/respaldo.js) --- */
  function tamano(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  S.respaldos = function () {
    return api('respaldo').then(function (r) {
      if (!r.ok) throw new Error(r.error || 'No se pudo leer el estado de los respaldos');
      var cont = h('div');
      cont.appendChild(h('h1', { text: 'Respaldos' }));
      cont.appendChild(h('p', { class: 'lede', text: 'Cada día a las 3:00 (hora de Chile) el sitio copia a un almacenamiento privado de Cloudflare R2 toda la base del administrador (textos publicados con su historial, leads, notas y etapas del CRM) y los archivos que subiste. Se guardan los últimos 30 días y la copia del día 1 de cada mes durante un año. El código y los textos del repositorio ya están respaldados en GitHub.' }));
      if (!r.configurado) { cont.appendChild(h('div', { class: 'errores', text: 'Falta conectar el almacenamiento R2 (binding RESPALDOS). Revisa docs/RESPALDOS.md.' })); return cont; }
      var est = h('div'), tabla = h('div');
      var boton = h('button', { class: 'btn boya', text: 'Respaldar ahora', 'data-tip': 'Hace una copia completa ahora mismo, además de la diaria.', onclick: function () {
        boton.disabled = true; boton.textContent = 'Respaldando…';
        var antes = r.ultimo && r.ultimo.fecha;
        api('respaldo/ahora', { method: 'POST' }).then(function (x) {
          if (!x.ok) { boton.disabled = false; boton.textContent = 'Respaldar ahora'; return avisar(x.error, true); }
          var intentos = 0;
          (function esperar() {
            api('respaldo').then(function (n) {
              intentos++;
              var listo = n.ok && n.ultimo && n.ultimo.fecha !== antes && !(n.estado && n.estado.enCurso);
              if (listo || (n.estado && n.estado.ok === false && !n.estado.enCurso) || intentos > 40) { r = n; pintar(); boton.disabled = false; boton.textContent = 'Respaldar ahora';
                avisar(listo ? 'Respaldo listo' : (n.estado && n.estado.error) || 'El respaldo tarda más de lo normal: revisa de nuevo en un minuto', !listo); }
              else setTimeout(esperar, 3000);
            });
          })();
        });
      } });
      function pintar() {
        vaciar(est); vaciar(tabla);
        var u = r.ultimo;
        if (r.estado && r.estado.ok === false && r.estado.error) est.appendChild(h('div', { class: 'errores', text: 'El último intento falló: ' + r.estado.error }));
        if (!u) est.appendChild(h('div', { class: 'panel' }, h('b', { text: 'Todavía no hay respaldos. ' }), 'Pulsa «Respaldar ahora» o se hace solo esta madrugada.'));
        else {
          var f = u.d1 || {}, m = u.medios || {};
          est.appendChild(h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Último respaldo: ' + fecha(u.fecha) }),
            h('p', { style: 'margin:4px 0' }, 'Motivo: ' + (u.motivo || '') + ' · duró ' + (u.segundos != null ? u.segundos + ' s' : '—')),
            h('p', { style: 'margin:4px 0' }, 'Base de datos: ', h('b', { text: (f.filas || 0) + ' filas' }), ' en ' + Object.keys(f.tablas || {}).length + ' tablas · ' + tamano(f.bytes || 0)),
            h('p', { style: 'margin:4px 0' }, 'Archivos subidos: ', h('b', { text: (m.copiados || 0) + ' copiados nuevos' }), ' · ' + (m.omitidos || 0) + ' ya estaban respaldados')));
        }
        var ul = h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Copias de la base de datos' }));
        if (!r.copias || !r.copias.length) ul.appendChild(h('p', { class: 'vacio', text: 'Aún no hay copias.' }));
        (r.copias || []).forEach(function (c) {
          ul.appendChild(h('div', { class: 'fila-copia', style: 'display:flex;gap:12px;align-items:center;padding:6px 0;border-bottom:1px solid var(--linea)' },
            h('code', { text: c.clave.slice(3, 13) }), h('span', { class: 'chip', text: tamano(c.bytes) }),
            h('a', { class: 'btn-sm', href: '/api/admin/respaldo/descargar?clave=' + encodeURIComponent(c.clave), text: 'Descargar' })));
        });
        tabla.appendChild(ul);
      }
      pintar();
      cont.appendChild(h('div', { style: 'margin:0 0 14px' }, boton));
      cont.appendChild(est); cont.appendChild(tabla);
      cont.appendChild(h('div', { class: 'panel' }, h('b', { text: 'Para restaurar: ' }), 'descarga la copia del día que necesitas y pídeme restaurarla (o sigue docs/RESPALDOS.md). Las copias tienen datos personales de los leads: no las compartas ni las subas a ningún otro lugar.'));
      return cont;
    });
  };

  /* --- Eventos: pop-ups de invitación y landings de eventos (eventos-data.js) --- */
  function slugDe(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }
  function interruptor(obj, k, etq, alCambiar) {
    var c = h('input', { type: 'checkbox', checked: !!obj[k], onchange: function () { obj[k] = c.checked; alCambiar(); } });
    return h('div', { class: 'interruptor-fila' }, h('label', { class: 'interruptor' }, c, h('span')), ' ' + etq);
  }
  function campoFecha(doc, obj, k) {
    return h('input', { type: 'date', value: obj[k] || '', style: 'max-width:200px', onchange: function (e) { obj[k] = e.target.value; marcar(doc); } });
  }
  S.eventos = function () {
    return cargar('eventos').then(function (doc) {
      var E = doc.contenido;
      if (!Array.isArray(E.popups)) E.popups = [];
      if (!Array.isArray(E.landings)) E.landings = [];
      var abiertoP = -1, abiertoL = -1;
      var cajaP = h('div'), cajaL = h('div');
      function urlLanding(l) { return '/evento/?e=' + l.slug; }
      function pintarP() {
        vaciar(cajaP);
        E.popups.forEach(function (p, i) {
          var opcionesL = { '': '— Otro enlace —' };
          E.landings.forEach(function (l) { if (l.slug) opcionesL['evento/index.html?e=' + l.slug] = 'Landing: ' + (l.titulo || l.slug) + (l.visible ? '' : ' (oculta)'); });
          var enlace = texto(doc, p, 'enlace', { ph: 'evento/index.html?e=… o https://…' });
          var elegir = selector(opcionesL, opcionesL[p.enlace] ? p.enlace : '', function (v) { if (v) { p.enlace = v; enlace.value = v; marcar(doc); } });
          var seg = h('input', { type: 'number', min: 0, max: 60, value: p.retraso == null ? 4 : p.retraso, style: 'max-width:100px',
            oninput: function (e) { p.retraso = e.target.value === '' ? 4 : Number(e.target.value); marcar(doc); } });
          var det = h('details', { class: 'panel', open: i === abiertoP },
            h('summary', null, h('b', { text: (p.activo ? '● ' : '○ ') + (p.titulo || 'Pop-up sin título') }),
              h('small', { text: '  ' + (p.activo ? 'Activo' : 'Apagado') + (p.desde || p.hasta ? ' · ' + (p.desde || '…') + ' → ' + (p.hasta || '…') : '') })),
            interruptor(p, 'activo', 'Mostrar este pop-up en el sitio', function () { marcar(doc); abiertoP = i; pintarP(); }),
            campo('Antetítulo', texto(doc, p, 'antetitulo', { ph: 'Invitación' })),
            campo('Título', texto(doc, p, 'titulo')),
            campo('Texto', texto(doc, p, 'texto', { largo: true, filas: 3 })),
            campo('Imagen (opcional)', campoImagen(doc, p, 'imagen', 'eventos'), 'Horizontal o cuadrada. Sin imagen, el pop-up sale solo con texto.'),
            campo('Texto del botón', texto(doc, p, 'boton', { ph: 'Ver invitación' })),
            campo('El botón lleva a', h('div', null, elegir, h('div', { style: 'margin-top:6px' }, enlace)), 'Elige una landing de abajo o pega cualquier enlace.'),
            h('div', { class: 'filtros' },
              campo('Mostrar desde', campoFecha(doc, p, 'desde')), campo('Hasta', campoFecha(doc, p, 'hasta'))),
            h('div', { class: 'filtros' },
              campo('Dónde aparece', selector({ todas: 'Todas las páginas', inicio: 'Solo el inicio', marcas: 'Marcas y fichas de barcos' }, p.paginas || 'todas', function (v) { p.paginas = v; marcar(doc); })),
              campo('Cada cuánto', selector({ 'una-vez': 'Una vez por persona', sesion: 'Una vez por visita', siempre: 'En cada página' }, p.frecuencia || 'una-vez', function (v) { p.frecuencia = v; marcar(doc); })),
              campo('Aparece a los (segundos)', seg)),
            h('div', { class: 'filtros' },
              h('button', { class: 'mini', text: '↑ Subir', onclick: function () { if (i) { E.popups.splice(i - 1, 0, E.popups.splice(i, 1)[0]); marcar(doc); abiertoP = i - 1; pintarP(); } } }),
              h('button', { class: 'mini x', text: '✕ Eliminar pop-up', onclick: function () { if (confirm('¿Eliminar este pop-up?')) { E.popups.splice(i, 1); marcar(doc); abiertoP = -1; pintarP(); } } })));
          cajaP.appendChild(det);
        });
        cajaP.appendChild(h('button', { class: 'btn-sm', text: '+ Nuevo pop-up', onclick: function () {
          E.popups.push({ id: 'popup-' + Date.now().toString(36), activo: false, antetitulo: 'Invitación', titulo: '', texto: '', imagen: '', boton: 'Ver invitación', enlace: '', desde: '', hasta: '', paginas: 'todas', frecuencia: 'una-vez', retraso: 4 });
          marcar(doc); abiertoP = E.popups.length - 1; pintarP();
        } }));
      }
      function pintarL() {
        vaciar(cajaL);
        E.landings.forEach(function (l, i) {
          if (!Array.isArray(l.cuerpo)) l.cuerpo = [];
          if (!Array.isArray(l.programa)) l.programa = [];
          if (!Array.isArray(l.galeria)) l.galeria = [];
          var prog = h('div');
          (function pintarProg() {
            vaciar(prog);
            l.programa.forEach(function (x, j) {
              prog.appendChild(h('div', { class: 'item filtros' },
                h('input', { type: 'text', value: x.hora || '', placeholder: '18:00', style: 'max-width:90px', oninput: function (e) { x.hora = e.target.value; marcar(doc); } }),
                h('input', { type: 'text', value: x.texto || '', placeholder: 'Qué pasa', oninput: function (e) { x.texto = e.target.value; marcar(doc); } }),
                h('button', { class: 'mini x', text: '✕', onclick: function () { l.programa.splice(j, 1); marcar(doc); pintarProg(); } })));
            });
            prog.appendChild(h('button', { class: 'mini', text: '+ Hito del programa', onclick: function () { l.programa.push({ hora: '', texto: '' }); marcar(doc); pintarProg(); } }));
          })();
          var manual = !!l.titulo;
          var dir = texto(doc, l, 'slug', { ph: 'lanzamiento-axopar-28', alCambiar: function () { ver.href = urlLanding(l); ver.textContent = location.origin + urlLanding(l); } });
          var ver = h('a', { href: urlLanding(l), target: '_blank', rel: 'noopener', text: location.origin + urlLanding(l) });
          var tit = texto(doc, l, 'titulo', { alCambiar: function (v) { if (!manual && !l.visible) { l.slug = slugDe(v); dir.value = l.slug; ver.href = urlLanding(l); ver.textContent = location.origin + urlLanding(l); } } });
          dir.addEventListener('input', function () { manual = true; });
          var det = h('details', { class: 'panel', open: i === abiertoL },
            h('summary', null, h('b', { text: (l.visible ? '● ' : '○ ') + (l.titulo || 'Landing sin título') }),
              h('small', { text: '  ' + (l.visible ? 'Publicada' : 'Oculta') + (l.fecha ? ' · ' + l.fecha : '') })),
            interruptor(l, 'visible', 'Publicar esta landing (oculta solo se ve con la vista previa activada)', function () { marcar(doc); abiertoL = i; pintarL(); }),
            campo('Título del evento', tit),
            campo('Dirección de la página', dir, 'Minúsculas y guiones. Para compartir: '), h('div', { style: 'margin:-6px 0 14px' }, ver),
            campo('Antetítulo', texto(doc, l, 'antetitulo', { ph: 'Invitación' })),
            campo('Bajada', texto(doc, l, 'bajada', { largo: true, filas: 2 }), 'Una o dos frases. También es el texto de la vista previa al compartir por WhatsApp.'),
            campo('Imagen de portada', campoImagen(doc, l, 'imagen', 'eventos'), 'Horizontal, 2560 px. También es la imagen al compartir.'),
            h('div', { class: 'filtros' },
              campo('Fecha', campoFecha(doc, l, 'fecha')),
              campo('Hora', texto(doc, l, 'hora', { ph: '18:00 a 21:00 h' })),
              campo('Lugar', texto(doc, l, 'lugar', { ph: 'Marina, club o dirección' }))),
            campo('Enlace al mapa (opcional)', texto(doc, l, 'mapa', { ph: 'https://maps.google.com/…' })),
            campo('Texto de la invitación', listaTextos(doc, l.cuerpo, { largo: true, agregar: 'Párrafo' }), 'El primer párrafo se destaca.'),
            campo('Programa (opcional)', prog),
            campo('Galería (opcional)', editorFotos(doc, l.galeria, 'eventos')),
            h('h3', { text: 'Inscripción' }),
            interruptor(l, 'inscripcion', 'Con formulario de inscripción (llega a ventas y queda en el CRM, lista «Web · Eventos»)', function () { marcar(doc); }),
            interruptor(l, 'acompanantes', 'Preguntar cuántos acompañantes vienen', function () { marcar(doc); }),
            h('div', { class: 'filtros' },
              campo('Inscripción abierta hasta', campoFecha(doc, l, 'inscripcion_hasta'), 'Vacío: hasta el día del evento.'),
              campo('Texto del botón', texto(doc, l, 'boton', { ph: 'Confirmar asistencia' }))),
            campo('Mensaje después de inscribirse', texto(doc, l, 'gracias', { largo: true, filas: 2 })),
            h('small', { text: 'Pasada la fecha del evento, la landing muestra «Este evento ya se realizó» y oculta el formulario.' }),
            h('div', { class: 'filtros', style: 'margin-top:12px' },
              h('button', { class: 'mini', text: '+ Pop-up que invite a esta landing', onclick: function () {
                E.popups.push({ id: 'popup-' + (l.slug || Date.now().toString(36)), activo: false, antetitulo: l.antetitulo || 'Invitación', titulo: l.titulo || '', texto: l.bajada || '', imagen: l.imagen || '', boton: 'Ver invitación', enlace: 'evento/index.html?e=' + l.slug, desde: '', hasta: l.fecha || '', paginas: 'todas', frecuencia: 'una-vez', retraso: 4 });
                marcar(doc); abiertoP = E.popups.length - 1; pintarP(); avisar('Pop-up creado arriba (apagado): revísalo y actívalo.');
              } }),
              h('button', { class: 'mini', text: 'Duplicar', onclick: function () {
                var c = JSON.parse(JSON.stringify(l)); c.slug = (l.slug || 'evento') + '-copia'; c.visible = false; c.titulo = (l.titulo || '') + ' (copia)';
                E.landings.splice(i + 1, 0, c); marcar(doc); abiertoL = i + 1; pintarL();
              } }),
              h('button', { class: 'mini x', text: '✕ Eliminar landing', onclick: function () { if (confirm('¿Eliminar esta landing?')) { E.landings.splice(i, 1); marcar(doc); abiertoL = -1; pintarL(); pintarP(); } } })));
          cajaL.appendChild(det);
        });
        cajaL.appendChild(h('button', { class: 'btn-sm', text: '+ Nueva landing de evento', onclick: function () {
          E.landings.unshift({ slug: 'evento-' + Date.now().toString(36), visible: false, antetitulo: 'Invitación', titulo: '', bajada: '', imagen: '', fecha: '', hora: '', lugar: '', mapa: '', cuerpo: [''], programa: [], galeria: [], inscripcion: true, inscripcion_hasta: '', acompanantes: true, boton: 'Confirmar asistencia', gracias: 'Te esperamos. Te enviamos la confirmación a tu correo.' });
          marcar(doc); abiertoL = 0; pintarL(); pintarP();
        } }));
      }
      pintarP(); pintarL();
      return h('div', null, h('h1', { text: 'Eventos: pop-ups y landings' }),
        h('p', { class: 'lede', text: 'Crea la invitación a un evento: una landing con la información y el formulario de inscripción, y un pop-up que invite a verla desde el sitio. Todo queda en borrador hasta que publiques.' }),
        barra(doc),
        h('h2', { text: 'Pop-ups' }),
        h('p', { text: 'Se muestra el primer pop-up activo dentro de sus fechas. Cada persona lo ve según la frecuencia elegida y lo puede cerrar.' }),
        cajaP,
        h('h2', { text: 'Landings de eventos' }), cajaL);
    });
  };

  /* --- Orden, categorías y marcas (documento «portafolio») ---
     Orden de las marcas en el inicio y en el carrusel, categorías (universos) con sus marcas en orden, categorías nuevas
     y marcas nuevas. Lo leen el menú, el pie, el inicio, las páginas de universo y el asistente (assets/js/portafolio-data.js). */
  S.portafolio = function () {
    return Promise.all([cargar('portafolio'), cargar('marcas')]).then(function (x) {
      var doc = x[0], P = doc.contenido, MI = x[1].contenido;
      if (!Array.isArray(P.inicio)) P.inicio = [];
      if (!Array.isArray(P.universos)) P.universos = [];
      var raiz = h('div'), cajaIni = h('div'), cajaUni = h('div'), abierto = -1;

      function nombreMarca(m) { return (MI[m] && MI[m].nombre) || m; }
      function mover(arr, i, d, vuelta) {
        var j = i + d; if (j < 0 || j >= arr.length) return;
        arr.splice(j, 0, arr.splice(i, 1)[0]); marcar(doc); vuelta();
      }
      function flechas(arr, i, vuelta) {
        return [h('button', { class: 'mini', title: 'Subir', text: '↑', onclick: function () { mover(arr, i, -1, vuelta); } }),
                h('button', { class: 'mini', title: 'Bajar', text: '↓', onclick: function () { mover(arr, i, 1, vuelta); } })];
      }
      function ordenIni(mk) { for (var i = 0; i < P.inicio.length; i++) if (P.inicio[i].marca === mk) return i; return -1; }
      function opcionesMarcas(excluir) {
        var o = { '': '— Elige una marca —' };
        Object.keys(MI).forEach(function (m) { if (!excluir || excluir.indexOf(m) < 0) o[m] = nombreMarca(m); });
        return o;
      }

      /* ---------- orden en el inicio ---------- */
      function pintarIni() {
        vaciar(cajaIni);
        P.inicio.forEach(function (x, i) {
          var det = h('details', { class: 'panel', style: 'margin:6px 0' },
            h('summary', null, h('b', { text: (i + 1) + '. ' + nombreMarca(x.marca) }), h('small', { text: '  ' + (x.visible === false ? '· SIN AUTORIZAR: no se muestra en ninguna parte' : (x.subtitulo || '')) })),
            x.visible === false ? h('div', { class: 'filtros' }, h('button', { class: 'btn boya', text: 'Autorizar y mostrar ' + nombreMarca(x.marca), onclick: function () {
              if (!confirm('¿Autorizar «' + nombreMarca(x.marca) + '»? Cuando publiques este documento aparecerá en el inicio, el menú, las categorías, el asistente y su propia página. Asegúrate de que sus modelos y textos estén listos.')) return;
              x.visible = true; marcar(doc); pintarIni(); avisar('Autorizada. Publica este documento para que se vea en el sitio.');
            } }), h('small', { text: ' Mientras no la autorices, la marca no se ve en ninguna parte del sitio.' })) : null,
            h('div', { class: 'filtros' }, flechas(P.inicio, i, pintarIni),
              interruptor(x, 'visible', 'Mostrar en el inicio y en el carrusel', function () { if (x.visible == null) x.visible = true; marcar(doc); pintarIni(); }),
              h('button', { class: 'mini x', text: '✕ Quitar', onclick: function () { if (confirm('¿Quitar ' + nombreMarca(x.marca) + ' del inicio? La marca sigue existiendo en el sitio.')) { P.inicio.splice(i, 1); marcar(doc); pintarIni(); } } })),
            campo('Web oficial para «Revisar marcas»', texto(doc, x, 'web', { ph: 'https://… (página con la lista de modelos)' }), 'Si la completas, la marca entra al scraping de «Revisar marcas», aunque aún no esté autorizada. Vacío: no se revisa.'),
            campo('Texto bajo el nombre (tarjeta del inicio)', texto(doc, x, 'subtitulo', { ph: 'Ej. Vela y motor' })),
            campo('Foto de la tarjeta', campoImagen(doc, x, 'foto', 'marcas'), 'Si se deja vacía, se usa la foto de portada de la marca.'),
            campo('Logo del carrusel', campoImagen(doc, x, 'logo', 'marcas'), 'PNG o WebP con fondo transparente. Vacío: se usa el logo de la marca, o su nombre en texto.'),
            campo('Forma del logo', selector({ ancho: 'Ancho (logotipo horizontal)', alto: 'Alto (logo cuadrado o vertical)' }, x.forma || 'ancho', function (v) { x.forma = v; marcar(doc); })));
          cajaIni.appendChild(det);
        });
        var libres = Object.keys(MI).filter(function (m) { return !P.inicio.some(function (x) { return x.marca === m; }); });
        if (libres.length) {
          var el = selector(opcionesMarcas(Object.keys(MI).filter(function (m) { return libres.indexOf(m) < 0; })), '', function () {});
          cajaIni.appendChild(h('div', { class: 'filtros' }, el, h('button', { class: 'btn-sm', text: '+ Agregar al inicio', onclick: function () {
            if (!el.value) return avisar('Elige una marca', true);
            P.inicio.push({ marca: el.value, visible: true, foto: '', subtitulo: '', logo: '', forma: 'ancho' }); marcar(doc); pintarIni();
          } })));
        }
      }

      /* ---------- categorías ---------- */
      function pintarUni() {
        vaciar(cajaUni);
        P.universos.forEach(function (u, i) {
          if (!Array.isArray(u.marcas)) u.marcas = [];
          var url = '/universo/?u=' + u.slug;
          var nombre = texto(doc, u, 'nombre', { alCambiar: function (v) { if (u._nuevo) { u.slug = slugDe(v); dirEl.value = u.slug; } } });
          var dirEl = texto(doc, u, 'slug', { ph: 'vela-clasica' });
          nombre.addEventListener('change', pintarCats);
          if (!u._nuevo) dirEl.disabled = true;
          var lista = h('div');
          (function pintarMarcas() {
            vaciar(lista);
            u.marcas.forEach(function (m, j) {
              var lineas = (MI[m.marca] && MI[m.marca].lineas) || null, ops = { '': 'Toda la marca' };
              if (lineas) Object.keys(lineas).forEach(function (k) { ops[k] = (lineas[k].nombre || k) + ' (línea)'; });
              lista.appendChild(h('div', { class: 'item filtros' }, h('span', { style: 'min-width:22px;opacity:.6', text: (ordenIni(m.marca) + 1 || '–') + '°', title: 'Lugar en la prioridad interna (Orden en el inicio)' }),
                h('b', { text: nombreMarca(m.marca), style: 'min-width:120px' }),
                lineas ? selector(ops, m.linea || '', function (v) { m.linea = v; marcar(doc); }) : null,
                h('input', { type: 'text', value: m.etiqueta || '', placeholder: 'Texto del enlace', oninput: function (e) { m.etiqueta = e.target.value; marcar(doc); } }),
                h('button', { class: 'mini x', text: '✕', title: 'Quitar de esta categoría', onclick: function () { u.marcas.splice(j, 1); marcar(doc); abierto = i; pintarUni(); } })));
            });
            var el = selector(opcionesMarcas(), '', function () {});
            lista.appendChild(h('div', { class: 'filtros' }, el, h('button', { class: 'mini', text: '+ Agregar marca a esta categoría', onclick: function () {
              if (!el.value) return avisar('Elige una marca', true);
              var linea = ''; if (MI[el.value] && MI[el.value].lineas && MI[el.value].lineas[u.slug]) linea = u.slug;
              u.marcas.push({ marca: el.value, linea: linea, etiqueta: nombreMarca(el.value) }); marcar(doc); abierto = i; pintarUni();
            } })));
          })();
          cajaUni.appendChild(h('details', { class: 'panel', open: i === abierto, style: 'margin:8px 0' },
            h('summary', null, h('b', { text: (i + 1) + '. ' + (u.nombre || 'Categoría sin nombre') }), h('small', { text: '  ' + (u.visible === false ? '· SIN AUTORIZAR: no se muestra en ninguna parte' : 'visible') + ' · ' + u.marcas.length + ' marca(s)' })),
            u.visible === false ? h('div', { class: 'filtros' }, h('button', { class: 'btn boya', text: 'Autorizar y mostrar esta categoría', onclick: function () {
              if (!u.nombre || !u.hero) return avisar('Completa el nombre y la foto antes de autorizarla', true);
              if (!confirm('¿Autorizar la categoría «' + u.nombre + '»? Cuando publiques este documento aparecerá en el menú, el pie, el inicio y como página propia.')) return;
              u.visible = true; marcar(doc); abierto = i; pintarUni(); avisar('Autorizada. Publica este documento para que se vea en el sitio.');
            } }), h('small', { text: ' Sin autorizar, no aparece en el menú, el pie, el inicio ni como página.' })) : null,
            h('div', { class: 'filtros' }, flechas(P.universos, i, function () { abierto = -1; pintarUni(); }),
              interruptor(u, 'visible', 'Mostrar esta categoría en el menú, el pie y el inicio', function () { marcar(doc); abierto = i; pintarUni(); }),
              h('button', { class: 'mini x', text: '✕ Eliminar categoría', onclick: function () { if (confirm('¿Eliminar la categoría «' + (u.nombre || u.slug) + '»? Las marcas no se borran.')) { P.universos.splice(i, 1); marcar(doc); abierto = -1; pintarUni(); } } })),
            campo('Nombre', nombre, 'Es el título de la columna del menú y de la página de la categoría.'),
            campo('Dirección de la página', dirEl, u._nuevo ? 'Se arma sola con el nombre. Después de publicar ya no se puede cambiar.' : 'Página: ' + url),
            campo('Antetítulo', texto(doc, u, 'kicker', { ph: 'Universo ' + (u.nombre || '') })),
            campo('Descripción', texto(doc, u, 'lede', { largo: true, filas: 3 }), 'Una o dos frases bajo el título de la página.'),
            campo('Foto de la categoría', campoImagen(doc, u, 'hero', 'portada'), 'Horizontal, 2560 px. Se ve en el inicio y en la portada de la categoría.'),
            campo('Descripción de la foto', texto(doc, u, 'alt', { ph: 'Velero navegando' })),
            h('h4', { text: 'Marcas, en orden' }), lista));
        });
        pintarCats();
        cajaUni.appendChild(h('button', { class: 'btn-sm', text: '+ Nueva categoría', onclick: function () {
          P.universos.push({ slug: 'categoria-' + (P.universos.length + 1), nombre: '', kicker: '', lede: '', hero: '', alt: '', visible: false, marcas: [], _nuevo: true });
          marcar(doc); abierto = P.universos.length - 1; pintarUni();
        } }));
      }

      /* ---------- marca nueva ---------- */
      var F = { nombre: '', slug: '', pais: '', claim: '', intro: '', hero: '', logo: '', subtitulo: '', web: '', cats: {} };
      var cajaNueva = h('div'), msg = h('div'), cajaCats = h('div');
      function pintarCats() {  // se vuelve a armar cada vez que cambian las categorías, para que las nuevas aparezcan aquí
        vaciar(cajaCats);
        if (!P.universos.length) return cajaCats.appendChild(h('small', { text: 'Primero crea una categoría arriba.' }));
        P.universos.forEach(function (u) {
          cajaCats.appendChild(h('label', { style: 'display:block' }, h('input', { type: 'checkbox', checked: !!F.cats[u.slug], onchange: function (e) { F.cats[u.slug] = e.target.checked; } }), ' ' + (u.nombre || u.slug)));
        });
      }
      function pintarNueva() {
        vaciar(cajaNueva); pintarCats();
        var nd = { sucio: false };  // el formulario de marca nueva no ensucia el borrador del portafolio
        var slugEl = texto(nd, F, 'slug', { ph: 'ej. delta-yachts' });
        cajaNueva.appendChild(h('div', { class: 'panel' },
          h('div', { class: 'fila' },
            campo('Nombre de la marca *', h('input', { type: 'text', value: F.nombre, oninput: function (e) { F.nombre = e.target.value; F.slug = slugDe(F.nombre); slugEl.value = F.slug; } })),
            campo('Dirección *', slugEl, 'Minúsculas y guiones. No se puede cambiar después.'),
            campo('País *', h('input', { type: 'text', value: F.pais, placeholder: 'Ej. Italia', oninput: function (e) { F.pais = e.target.value; } }))),
          campo('Foto de portada *', campoImagen(nd, F, 'hero', 'marcas'), 'Horizontal, de buena calidad (2560 px). Se ve en la página de la marca y en el inicio.'),
          campo('Logo (opcional)', campoImagen(nd, F, 'logo', 'marcas'), 'PNG o WebP con fondo transparente. El sitio no admite SVG subido desde aquí.'),
          campo('Web oficial de la marca (para el scraping)', texto(nd, F, 'web', { ph: 'https://…/boats' }), 'Página con la lista de modelos. Se suma a «Revisar marcas» desde ya, para ir encontrando sus modelos antes de autorizarla.'),
          campo('Frase corta de la marca', h('input', { type: 'text', value: F.claim, oninput: function (e) { F.claim = e.target.value; } })),
          campo('Presentación', h('textarea', { rows: 3, oninput: function (e) { F.intro = e.target.value; } }, F.intro), 'Dos o tres frases tomadas de la web oficial de la marca.'),
          campo('Texto bajo el nombre en el inicio', h('input', { type: 'text', value: F.subtitulo, placeholder: 'Ej. Yates a motor', oninput: function (e) { F.subtitulo = e.target.value; } })),
          h('div', { class: 'campo' }, h('label', { text: 'Categorías donde aparece' }), cajaCats),
          h('p', null, h('small', { text: 'La marca nace SIN AUTORIZAR: no se muestra en ninguna parte del sitio (ni su página). Cuando esté lista, usa el botón «Autorizar y mostrar» en la lista de arriba y publica.' })),
          h('button', { class: 'btn boya', text: 'Crear marca', onclick: crearMarca })));
      }
      function paso(doc2, mutar, titulo) {  // guarda y publica un documento: mismo camino que el botón Publicar
        return cargar(doc2, true).then(function (d) {
          var yaEsta = mutar(d.contenido); if (yaEsta === 'existe') return true;
          return api('doc', { method: 'PUT', body: { clave: doc2, version: d.version, contenido: limpio(d.contenido) } }).then(function (r) {
            if (!r.ok) throw new Error(titulo + ': ' + (r.error || 'no se pudo guardar'));
            return api('publicar', { method: 'POST', body: { clave: doc2, version: r.version } }).then(function (q) {
              if (!q.ok) throw new Error(titulo + ': ' + (q.error || 'no se pudo publicar'));
              return cargar(doc2, true).then(function () { return true; });
            });
          });
        });
      }
      function crearMarca() {
        var slug = slugDe(F.slug || F.nombre), nombre = F.nombre.trim(), pais = F.pais.trim();
        if (!nombre || !pais) return avisar('Faltan el nombre y el país', true);
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return avisar('La dirección solo lleva minúsculas, números y guiones', true);
        if (!F.hero) return avisar('Sube la foto de portada: la página de la marca la necesita', true);
        if (MI[slug]) return avisar('Ya existe una marca con esa dirección', true);
        if ((docs.catalogo && docs.catalogo.sucio) || (docs.marcas && docs.marcas.sucio)) return avisar('Hay cambios sin guardar en el catálogo o en las marcas. Guárdalos o descártalos antes de crear una marca.', true);
        if (!confirm('¿Crear la marca «' + nombre + '»? Se guarda en el catálogo y en la información de marcas; queda oculta hasta que la actives.')) return;
        var cats = P.universos.filter(function (u) { return F.cats[u.slug]; });
        vaciar(msg); avisar('Creando la marca…');
        paso('catalogo', function (C) { if (C[slug]) return 'existe'; C[slug] = { nombre: nombre, pais: pais, modelos: [] }; }, 'Catálogo')
          .then(function () {
            return paso('marcas', function (M) {
              if (M[slug]) return 'existe';
              M[slug] = { nombre: nombre, pais: pais, universo: cats.length ? cats.map(function (u) { return u.nombre; }).join(' y ') : 'Por clasificar', hero: F.hero, claim: F.claim.trim(), intro: F.intro.trim() };
              if (F.logo) M[slug].logo = F.logo;
            }, 'Información de marcas');
          }).then(function () {
            return cargar('marcas', true).then(function (m) { MI = m.contenido; });
          }).then(function () {
            P.inicio.push({ marca: slug, visible: false, foto: F.hero, subtitulo: F.subtitulo.trim(), logo: F.logo || '', forma: 'ancho', web: (F.web || '').trim() });
            cats.forEach(function (u) { u.marcas.push({ marca: slug, linea: '', etiqueta: nombre }); });
            marcar(doc); pintarIni(); pintarUni();
            msg.appendChild(h('div', { class: 'panel' }, h('b', { text: '«' + nombre + '» creada.' }),
              h('p', null, 'Siguiente: agrégale modelos en ', h('a', { href: '#nuevo-modelo', text: 'Nuevo modelo' }), ', activa «Mostrar en el inicio» en la lista de arriba y publica este documento. La marca ya quedó en el orden del inicio y en las categorías que elegiste (aún sin publicar).')));
            F = { nombre: '', slug: '', pais: '', claim: '', intro: '', hero: '', logo: '', subtitulo: '', web: '', cats: {} }; pintarNueva();
            avisar('Marca creada (oculta). Falta publicar el orden cuando esté lista.');
          }).catch(function (e) {
            msg.appendChild(h('div', { class: 'errores', text: (e && e.message) || 'No se pudo crear la marca. Puedes reintentar: lo que ya se guardó no se duplica.' }));
            avisar((e && e.message) || 'No se pudo crear la marca', true);
          });
      }

      pintarIni(); pintarNueva(); pintarUni();
      return h('div', null, h('h1', { text: 'Orden, categorías y marcas' }),
        h('p', { class: 'lede', text: 'Decide en qué orden se ven las marcas en el inicio y en el menú, crea categorías nuevas (hoy: Vela, Motor y Vela deportiva) y agrega marcas nuevas. Todo queda en borrador hasta que publiques.' }),
        barra(doc),
        h('h2', { text: 'Orden en el inicio' }),
        h('p', null, h('small', { text: 'Es la prioridad interna de las marcas: manda el orden de la grilla «El portafolio», del carrusel de logos y también el de cada categoría, el menú y el pie (en toda categoría, la marca de más arriba va primero). Usa las flechas para mover; abre una marca para editar su tarjeta.' })), cajaIni,
        h('h2', { text: 'Categorías' }),
        h('p', null, h('small', { text: 'Cada categoría es una columna del menú, una del pie y una página propia. Las marcas de cada categoría siguen la prioridad interna de «Orden en el inicio» (el número a la izquierda es su lugar).' })), cajaUni,
        h('h2', { text: 'Marca nueva' }), cajaNueva, msg);
    });
  };

  /* --- CRM propio: leads guardados en D1 desde el lanzamiento; cada lead queda también en Brevo (worker/crm.js) --- */
  S.crm = function () {
    var raiz = h('div'), est = { etapas: [], porEtapa: {}, total: 0, nuevos7: 0, activo: true, desde: '' }, filtro = { q: '', etapa: '', tipo: '', pagina: 0 };
    var cuerpo = h('div'), tabla = h('div'), ficha = null;
    var TIPOS = { '': 'Todos los tipos', cotizacion: 'Cotización', usado: 'Usados', contacto: 'Contacto', charter: 'Charter', equipamiento: 'Equipamiento', boyas: 'Arriendo de boyas', evento: 'Eventos' };
    function chip(t, c) { return h('span', { class: 'chip ' + (c || ''), text: t }); }
    function cerrarFicha() { if (ficha) { ficha.remove(); ficha = null; } }
    function etapaChip(e) { return chip(e, e === 'Cerrado' ? 'ok' : e === 'Perdido' ? 'err' : e === 'Nuevo' ? 'warn' : ''); }
    function brevoChip(b) { return b === 'ok' ? chip('en Brevo', 'ok') : b === 'error' ? chip('Brevo falló', 'err') : b === 'sin-clave' ? chip('sin Brevo', 'warn') : chip('Brevo pendiente', 'warn'); }
    function digitos(t) { return String(t || '').replace(/\D/g, ''); }

    function abrirFicha(id) {
      cerrarFicha();
      ficha = h('aside', { class: 'hist crm-ficha' }, h('p', { class: 'cargando', text: 'Cargando…' }));
      document.body.appendChild(ficha);
      api('crm/lead?id=' + id).then(function (r) {
        if (!ficha) return;
        vaciar(ficha);
        ficha.appendChild(h('div', { class: 'filtros' }, h('button', { class: 'btn-sm', text: '✕ Cerrar', onclick: cerrarFicha })));
        if (!r.ok) return ficha.appendChild(h('div', { class: 'errores', text: r.error }));
        var l = r.lead;
        ficha.appendChild(h('h2', { style: 'margin-top:4px', text: l.nombre || l.email }));
        ficha.appendChild(h('p', null, h('a', { href: 'mailto:' + l.email, text: l.email }), ' ', etapaChip(l.etapa), ' ', brevoChip(l.brevo), ' ', l.aviso_ok ? null : chip('el aviso a ventas no salió', 'err')));
        var dato = [['Tipo', l.linea || l.tipo], ['Marca', l.marca], ['Modelo', l.modelo], ['Categoría', l.universo], ['Teléfono', l.telefono], ['Contacto preferido', l.via], ['Motivo', l.motivo],
          ['Equipamiento', (l.categorias || []).join(', ')], ['Página de origen', l.origen], ['Llegó', fecha(l.creado)], ['Política aceptada', l.politica]].filter(function (x) { return x[1]; });
        ficha.appendChild(h('table', { class: 'tabla' }, dato.map(function (x) { return h('tr', null, h('th', { text: x[0] }), h('td', { text: x[1] })); })));
        if (l.mensaje || l.detalle) ficha.appendChild(h('div', { class: 'panel', style: 'margin-top:12px;white-space:pre-wrap' }, h('b', { text: 'Lo que escribió' }), h('br'), l.mensaje || '', l.mensaje && l.detalle ? '\n\n' : '', l.detalle || ''));
        var tel = digitos(l.telefono);
        ficha.appendChild(h('div', { class: 'filtros', style: 'margin-top:14px' }, h('a', { class: 'btn-sm', href: 'mailto:' + l.email, text: 'Escribir correo' }),
          tel ? h('a', { class: 'btn-sm', href: 'https://wa.me/' + tel, target: '_blank', rel: 'noopener', text: 'WhatsApp ↗' }) : null,
          h('a', { class: 'btn-sm', href: 'https://app.brevo.com/contact/list', target: '_blank', rel: 'noopener', text: 'Abrir Brevo ↗' })));
        var ops = {}; est.etapas.forEach(function (e) { ops[e] = e; });
        var sel = selector(ops, l.etapa, function () {});
        ficha.appendChild(h('h3', { text: 'Etapa del lead' }));
        ficha.appendChild(h('div', { class: 'filtros' }, sel, h('button', { class: 'btn boya', text: 'Guardar etapa', onclick: function () {
          api('crm/accion', { method: 'POST', body: { id: l.id, accion: 'etapa', valor: sel.value } }).then(function (q) {
            if (!q.ok) return avisar(q.error, true);
            avisar('Etapa guardada' + (q.brevo === 'ok' ? ' aquí y en Brevo' : q.brevo === 'sin-clave' ? ' (Brevo no está conectado)' : ' (no se pudo avisar a Brevo)'), q.brevo === 'error');
            abrirFicha(l.id); cargarTodo();
          });
        } })));
        ficha.appendChild(h('h3', { text: 'Notas internas' }));
        (l.notas || []).forEach(function (n) { ficha.appendChild(h('div', { class: 'ayuda', style: 'white-space:pre-wrap' }, n.texto, h('br'), h('small', { text: fecha(n.fecha) + ' · ' + n.quien }))); });
        var tx = h('textarea', { rows: 2, placeholder: 'Ej. Llamar el lunes; pidió propuesta con motor 150 hp.' });
        ficha.appendChild(h('div', { class: 'campo' }, tx));
        ficha.appendChild(h('button', { class: 'btn-sm', text: '+ Agregar nota', onclick: function () {
          api('crm/accion', { method: 'POST', body: { id: l.id, accion: 'nota', valor: tx.value } }).then(function (q) { if (!q.ok) return avisar(q.error, true); avisar('Nota guardada'); abrirFicha(l.id); });
        } }));
        ficha.appendChild(h('hr'));
        ficha.appendChild(h('button', { class: 'btn peligro', text: 'Eliminar lead', onclick: function () {
          if (!confirm('¿Eliminar a ' + (l.nombre || l.email) + '? Se borra de este CRM con sus notas (derecho de supresión, Ley 21.719). En Brevo no se borra nada: si corresponde, bórralo allá también.')) return;
          api('crm/accion', { method: 'POST', body: { id: l.id, accion: 'eliminar' } }).then(function (q) { if (!q.ok) return avisar(q.error, true); avisar('Lead eliminado'); cerrarFicha(); cargarTodo(); });
        } }));
        ficha.appendChild(h('p', null, h('small', { text: 'Cada lead queda guardado aquí y también en Brevo (lista de su marca). Cambiar la etapa actualiza los dos lados.' })));
      });
    }
    function buscar() {
      vaciar(tabla).appendChild(h('p', { class: 'cargando', text: 'Cargando…' }));
      var qs = 'q=' + encodeURIComponent(filtro.q) + '&etapa=' + encodeURIComponent(filtro.etapa) + '&tipo=' + encodeURIComponent(filtro.tipo) + '&pagina=' + filtro.pagina;
      api('crm/leads?' + qs).then(function (r) {
        vaciar(tabla);
        if (!r.ok) return tabla.appendChild(h('div', { class: 'errores', text: r.error }));
        if (!r.leads.length) return tabla.appendChild(h('p', { class: 'ayuda', text: est.total ? 'No hay leads con ese filtro.' : (est.activo ? 'Todavía no ha llegado ningún lead.' : 'Todavía no hay leads: el CRM empieza a guardarlos el 1 de diciembre a las 00:00.') }));
        tabla.appendChild(h('p', null, h('small', { text: r.total + ' lead(s)' })));
        tabla.appendChild(h('div', { class: 'tabla-wrap' }, h('table', { class: 'tabla' },
          h('tr', null, ['Llegó', 'Contacto', 'Interés', 'Tipo', 'Etapa', 'Brevo', ''].map(function (t) { return h('th', { text: t }); })),
          r.leads.map(function (l) {
            return h('tr', null, h('td', null, h('small', { text: fecha(l.creado) })),
              h('td', null, h('b', { text: l.nombre || l.email }), l.nombre ? h('br') : null, l.nombre ? h('small', { text: l.email }) : null),
              h('td', { text: [l.marca, l.modelo].filter(Boolean).join(' · ') || l.universo || '' }), h('td', null, h('small', { text: l.linea || l.tipo })),
              h('td', null, etapaChip(l.etapa)), h('td', null, brevoChip(l.brevo), l.aviso_ok ? null : chip('sin aviso', 'err')),
              h('td', { class: 'acc' }, h('button', { class: 'btn-sm', text: 'Abrir', onclick: function () { abrirFicha(l.id); } })));
          }))));
        var pags = Math.ceil(r.total / 100);
        if (pags > 1) tabla.appendChild(h('div', { class: 'filtros', style: 'margin-top:10px' },
          h('button', { class: 'btn-sm', text: '← Anterior', disabled: filtro.pagina ? null : true, onclick: function () { filtro.pagina--; buscar(); } }),
          h('small', { text: 'Página ' + (filtro.pagina + 1) + ' de ' + pags }),
          h('button', { class: 'btn-sm', text: 'Siguiente →', disabled: filtro.pagina + 1 < pags ? null : true, onclick: function () { filtro.pagina++; buscar(); } })));
      });
    }
    function pintarBase() {
      vaciar(cuerpo);
      if (!est.activo) cuerpo.appendChild(h('div', { class: 'avisos', text: 'El CRM empieza a guardar leads el 1 de diciembre a las 00:00 (hora de Chile). Hasta entonces los formularios siguen funcionando igual y enviando a Brevo, pero aquí no se guarda nada.' }));
      cuerpo.appendChild(h('div', { class: 'kpis' }, [
        ['Leads', String(est.total), 'Guardados desde el lanzamiento', '', 'Total de leads guardados en este CRM. Cada uno también quedó en Brevo.'],
        ['Nuevos en 7 días', String(est.nuevos7), 'Llegaron esta semana', est.nuevos7 ? 'bien' : '', 'Leads que llegaron por los formularios en los últimos 7 días.'],
        ['Sin atender', String(est.porEtapa.Nuevo || 0), 'En etapa «Nuevo»', est.porEtapa.Nuevo ? 'alerta' : '', 'Leads que todavía nadie contactó (etapa Nuevo). Conviene responderlos primero.'],
        ['Cerrados', String(est.porEtapa.Cerrado || 0), 'Ventas concretadas', '', 'Leads en etapa Cerrado.']
      ].map(function (k) { return h('div', { class: 'kpi ' + k[3], 'data-tip': k[4] }, h('small', { text: k[0] }), h('b', { text: k[1] }), h('span', { text: k[2] })); })));
      var eops = { '': 'Todas las etapas' }; est.etapas.forEach(function (e) { eops[e] = e + ' (' + (est.porEtapa[e] || 0) + ')'; });
      var q = h('input', { type: 'search', placeholder: 'Buscar por correo, nombre, marca, modelo o teléfono…', value: filtro.q, onkeydown: function (e) { if (e.key === 'Enter') { filtro.q = q.value; filtro.pagina = 0; buscar(); } } });
      cuerpo.appendChild(h('div', { class: 'filtros' }, q, selector(eops, filtro.etapa, function (v) { filtro.etapa = v; filtro.pagina = 0; buscar(); }),
        selector(TIPOS, filtro.tipo, function (v) { filtro.tipo = v; filtro.pagina = 0; buscar(); }),
        h('button', { class: 'btn boya', text: 'Buscar', onclick: function () { filtro.q = q.value; filtro.pagina = 0; buscar(); } }),
        h('a', { class: 'btn-sm', href: 'https://app.brevo.com/contact/list', target: '_blank', rel: 'noopener', text: 'Abrir Brevo ↗' })));
      cuerpo.appendChild(tabla); buscar();
    }
    function cargarTodo() {
      api('crm/resumen').then(function (r) {
        if (!r.ok) { vaciar(cuerpo).appendChild(h('div', { class: 'errores', text: r.error })); return; }
        est = r; pintarBase();
      });
    }
    raiz.appendChild(h('h1', { text: 'CRM · Leads' }));
    raiz.appendChild(h('p', { class: 'lede', text: 'Los leads que llegan por los formularios desde el 1 de diciembre quedan guardados aquí y también en Brevo. Acá los ves, les cambias la etapa y les dejas notas; Brevo sigue recibiendo todo como hasta ahora.' }));
    raiz.appendChild(cuerpo);
    vaciar(cuerpo).appendChild(h('p', { class: 'cargando', text: 'Cargando…' }));
    cargarTodo();
    window.addEventListener('hashchange', cerrarFicha, { once: true });
    return Promise.resolve(raiz);
  };

  /* --- Revisar marcas: scraping de las webs oficiales (GitHub Actions) → informe → aprobación ---
     Nada se aplica sin marcar y confirmar. «Ocultar del sitio» usa el documento «publicacion» (con historial y
     reversible); lo nuevo y los cambios de dirección salen como pull request para cargarlos con el proceso de la biblioteca. */
  S.revision = function () {
    var raiz = h('div'), reloj = null;
    function parar() { if (reloj) { clearInterval(reloj); reloj = null; } }
    function chip(txt, clase) { return h('span', { class: 'chip ' + (clase || ''), text: txt }); }
    var ESTADO = { ok: ['al día', ''], unica: ['página única', ''], parcial: ['parcial', 'err'], bloqueada: ['bloqueada', 'err'] };

    function pintar(e) {
      vaciar(raiz);
      raiz.appendChild(h('h1', { text: 'Revisar marcas' }));
      raiz.appendChild(h('p', { class: 'lede', text: 'Compara las webs oficiales de cada marca con el catálogo del sitio y te muestra qué modelos son nuevos, cuáles cambiaron de dirección y cuáles ya no existen. Tú decides qué aplicar: no se cambia nada sin tu aprobación.' }));

      if (!e.configurado) {
        raiz.appendChild(h('div', { class: 'panel' }, h('h3', { style: 'margin-top:0', text: 'Falta conectar con GitHub' }),
          h('p', { text: e.error }),
          h('ol', null, [
            'En GitHub, crear un token de acceso fino solo para este repositorio, con permiso de lectura y escritura en Actions, Contents y Pull requests.',
            'En Cloudflare (Worker oceanic › Settings › Variables and Secrets), guardarlo como secreto con el nombre GH_TOKEN.',
            'Dejar el archivo .github/workflows/revisar-marcas.yml en la rama main del repositorio.',
            'Opcional: guardar FIRECRAWL_API_KEY como secreto del repositorio en GitHub, para las webs que bloquean la lectura directa (Saffier).'
          ].map(function (t) { return h('li', { text: t }); })),
          e.variables ? h('div', { class: 'panel', style: 'background:var(--natural,#f4f2ee)' }, h('b', { text: 'Qué ve el Worker ahora' }),
            h('p', { style: 'margin:6px 0' }, e.variables.parecidos.length
              ? ['Hay claves con un nombre parecido: ', h('b', { text: e.variables.parecidos.join(', ') }), '. El nombre tiene que ser exactamente GH_TOKEN (mayúsculas, guion bajo, sin espacios).']
              : 'No hay ninguna clave con nombre parecido a GH_TOKEN: el secreto no está guardado en el Worker, o se guardó en otro lugar (por ejemplo, en las variables de Build) o falta apretar Deploy.'),
            h('small', { text: 'Nombres que ve el Worker (nunca los valores): ' + (e.variables.todos.join(', ') || 'ninguno') })) : null,
          h('p', null, h('small', { text: 'Las claves nunca se pegan en el chat ni en correos. Detalle en docs/REVISION-MARCAS.md.' }))));
        return;
      }

      if (e.ok === false) {  // GitHub respondió con un error (token vencido, permisos, repositorio)
        raiz.appendChild(h('div', { class: 'errores', text: e.error || 'No se pudo consultar GitHub.' }));
        raiz.appendChild(h('button', { class: 'btn-sm', text: 'Reintentar', onclick: cargarEstado }));
        return;
      }
      var ej = e.ejecucion, enCurso = ej && (ej.estado === 'queued' || ej.estado === 'in_progress');
      var btn = h('button', { class: 'btn boya', text: enCurso ? 'Revisando…' : 'Revisar marcas ahora', disabled: enCurso ? true : null, onclick: function () {
        btn.disabled = true; btn.textContent = 'Lanzando…';
        cargar('portafolio', true).then(function (pf) {  // las marcas nuevas con web oficial entran a la revisión aunque aún no estén autorizadas
          var extra = {};
          ((pf && pf.contenido && pf.contenido.inicio) || []).forEach(function (x) { if (x && x.web) extra[x.marca] = [x.web]; });
          return api('revision/iniciar', { method: 'POST', body: { extra: extra } });
        }).then(function (r) {
          if (!r.ok) { avisar(r.error, true); btn.disabled = false; btn.textContent = 'Revisar marcas ahora'; return; }
          avisar('Revisión lanzada. Tarda unos minutos.'); setTimeout(cargarEstado, 4000);
        });
      } });
      var linea = ej ? 'Última revisión: ' + fecha(ej.creada) + ' · ' + (enCurso ? 'en curso' : ej.conclusion === 'success' ? 'terminada' : 'terminó con error (' + (ej.conclusion || ej.estado) + ')') : 'Todavía no se ha hecho ninguna revisión.';
      raiz.appendChild(h('div', { class: 'barra' }, btn, h('span', { class: 'esp' }),
        h('span', { class: 'estado ' + (enCurso ? 'pend' : ej && ej.conclusion === 'failure' ? 'sucio' : 'pub'), text: linea }),
        ej && ej.url ? h('a', { class: 'btn-sm', href: ej.url, target: '_blank', rel: 'noopener', text: 'Ver en GitHub' }) : null));
      if (e.flujo_encontrado === false) raiz.appendChild(h('div', { class: 'errores', text: 'GitHub no encuentra el flujo «Revisar marcas». Hay que dejar .github/workflows/revisar-marcas.yml en la rama main.' }));

      if (enCurso) { if (!reloj) reloj = setInterval(function () { if (!document.body.contains(raiz)) return parar(); cargarEstado(); }, 15000); }
      else parar();
      if (!e.informe) return;
      informe(e.informe);
    }

    function informe(inf) {
      var res = inf.resumen || {};
      raiz.appendChild(h('h2', { text: 'Resultado · ' + fecha(inf.generado) }));
      var tab = h('table', { class: 'tabla' }, h('tr', null, ['Marca', 'Estado', 'Conocidos', 'Nuevos', 'Cambiaron de dirección', 'Ya no existen'].map(function (t) { return h('th', { text: t }); })));
      inf.marcas.forEach(function (m) {
        var est = ESTADO[m.estado] || [m.estado, 'err'];
        tab.appendChild(h('tr', null, h('td', { text: m.marca }), h('td', null, chip(est[0], est[1]), m.nota ? h('div', null, h('small', { text: m.nota })) : null),
          h('td', { text: String(m.conocidos) }), h('td', { text: String(m.nuevos.length) }), h('td', { text: String(m.movidos.length) }), h('td', { text: String(m.retirados.length) })));
      });
      raiz.appendChild(tab);
      if ((res.marcas_con_problemas || []).length) raiz.appendChild(h('p', null, h('small', { text: 'De ' + res.marcas_con_problemas.join(', ') + ' no se pudo leer toda la web: no se sacan conclusiones de ahí. Saffier necesita la clave de Firecrawl en GitHub. Solaris protege su web con un captcha anti-bots: el sistema no lo elude, así que sus modelos se revisan a mano (o Solaris autoriza el acceso del servidor).' })));

      // señales externas (no oficiales): avisos de modelos que la biblioteca no tiene, para marcas cuya web bloquea la lectura
      inf.marcas.forEach(function (m) {
        (m.senales || []).forEach(function (s) {
          var hay = (s.nuevos || []).length;
          raiz.appendChild(h('div', { class: 'panel' }, h('b', { text: m.marca + ' · aviso externo' }), ' ', chip('no oficial', 'err'), ' ',
            chip(!s.ok ? 'no se pudo leer' : hay ? hay + ' posible(s) nuevo(s)' : 'sin novedades', !s.ok || hay ? 'err' : ''),
            h('div', null, h('small', { text: s.fuente + ' · ' }), h('a', { href: s.url, target: '_blank', rel: 'noopener', text: s.url })),
            !s.ok ? h('div', null, h('small', { text: s.error || '' })) : null,
            hay ? h('div', null, h('b', { text: 'No están en nuestra biblioteca: ' + s.nuevos.join(', ') }), h('br'), h('small', { text: 'Es solo un aviso. Revisa la ficha en la web oficial de la marca desde tu navegador antes de cargar nada.' })) : null));
        });
      });

      var items = [];  // { tipo, marca, ...dato, caja }
      function caja(etq, activo) { var c = h('input', { type: 'checkbox', disabled: activo === false ? true : null }); return { c: c, el: h('label', { class: 'gen-campo', style: 'display:block;margin:2px 0' }, c, ' ' + etq) }; }
      function bloque(titulo, ayuda, filas) {
        if (!filas.length) return;
        raiz.appendChild(h('h3', { text: titulo + ' (' + filas.length + ')' }));
        raiz.appendChild(h('p', null, h('small', { text: ayuda })));
        filas.forEach(function (f) { raiz.appendChild(f); });
      }
      var nuevos = [], movidos = [], retirados = [];
      inf.marcas.forEach(function (m) {
        m.nuevos.forEach(function (x) {
          var cj = caja('Cargar este modelo'); items.push({ tipo: 'cargar', marca: m.marca, url: x.url, titulo: x.titulo, c: cj.c });
          nuevos.push(h('div', { class: 'panel' }, h('b', { text: m.marca + ' · ' + (x.titulo || x.url) }), ' ', x.posible_anterior ? chip('parece de una gama anterior', 'err') : null,
            h('div', null, h('a', { href: x.url, target: '_blank', rel: 'noopener', text: x.url })), cj.el));
        });
        m.movidos.forEach(function (x) {
          var a = caja('Actualizar la dirección oficial registrada'); items.push({ tipo: 'actualizar', marca: m.marca, slug: x.slug, url: x.url, destino: x.destino, c: a.c });
          var o = x.posible_anterior ? caja('Ocultar del sitio (pasó a una gama anterior)', x.en_catalogo) : null;
          if (o) items.push({ tipo: 'ocultar', marca: m.marca, slug: x.slug, motivo: 'Pasó a una gama anterior en la web oficial', c: o.c });
          movidos.push(h('div', { class: 'panel' }, h('b', { text: m.marca + ' · ' + x.slug }), ' ', x.posible_anterior ? chip('posible descatalogado', 'err') : null,
            h('div', null, h('small', { text: 'antes: ' + x.url })), h('div', null, h('small', { text: 'ahora: ' }), h('a', { href: x.destino, target: '_blank', rel: 'noopener', text: x.destino })), a.el, o ? o.el : null));
        });
        m.retirados.forEach(function (x) {
          var cj = caja(x.en_catalogo ? 'Ocultar del sitio' : 'No está publicado en el sitio', x.en_catalogo); if (x.en_catalogo) items.push({ tipo: 'ocultar', marca: m.marca, slug: x.slug, motivo: 'Retirado de la web oficial', c: cj.c });
          retirados.push(h('div', { class: 'panel' }, h('b', { text: m.marca + ' · ' + x.slug }), ' ', chip(x.motivo, 'err'), h('div', null, h('small', { text: x.url })), cj.el));
        });
        (m.sin_verificar || []).forEach(function (x) { retirados.push(h('div', { class: 'panel' }, h('b', { text: m.marca + ' · ' + x.slug }), ' ', chip('sin verificar', 'err'), h('div', null, h('small', { text: x.motivo + ' · la web no respondió, no se saca ninguna conclusión' })))); });
      });
      bloque('Modelos nuevos en la web oficial', 'Aprobar carga el modelo solo: se baja su ficha oficial, se arma el paquete, se traduce y se publica en el sitio (tarda unos minutos). Si algo falla, queda un pull request abierto con el aviso.', nuevos);
      bloque('Cambiaron de dirección', 'Casi siempre es un cambio interno de la web del fabricante. «Actualizar la dirección» corrige solo la fuente registrada en el paquete; no cambia lo que ve el público.', movidos);
      bloque('Ya no existen en la web oficial', '«Ocultar del sitio» apaga el modelo en el sitio (gamas, menús, asistente y ficha). Se puede volver a mostrar desde Publicación y destacados; no se borra nada.', retirados);
      if (!items.length) { raiz.appendChild(h('p', { class: 'lede', text: nuevos.length + movidos.length + retirados.length ? 'No hay nada que se pueda aprobar automáticamente.' : 'Todo al día: el catálogo coincide con las webs oficiales.' })); return; }

      var salida = h('div');
      var aplicar = h('button', { class: 'btn boya', text: 'Aprobar lo marcado', onclick: function () {
        var sel = items.filter(function (i) { return i.c.checked; });
        if (!sel.length) return avisar('No marcaste nada.', true);
        var oc = sel.filter(function (i) { return i.tipo === 'ocultar'; }), ca = sel.filter(function (i) { return i.tipo === 'cargar'; }), ac = sel.filter(function (i) { return i.tipo === 'actualizar'; });
        if (!confirm('Vas a aprobar:\n\n· Ocultar del sitio ahora: ' + oc.length + '\n· Modelos nuevos por cargar: ' + ca.length + '\n· Direcciones por actualizar: ' + ac.length + '\n\nLo que se oculta se publica de inmediato (reversible). Lo demás se aplica solo en unos minutos y, si sale bien, se publica. ¿Continuar?')) return;
        aplicar.disabled = true; vaciar(salida);
        var pasos = Promise.resolve();
        if (oc.length) pasos = pasos.then(function () { return ocultar(oc, inf.generado, salida); });
        pasos.then(function (ok) {
          if (ok === false) { aplicar.disabled = false; return; }
          if (!ca.length && !ac.length) { aplicar.disabled = false; return; }
          return api('revision/aprobar', { method: 'POST', body: { cargar: ca.map(function (i) { return { marca: i.marca, url: i.url, titulo: i.titulo }; }),
            actualizar: ac.map(function (i) { return { marca: i.marca, slug: i.slug, url: i.url, destino: i.destino }; }) } }).then(function (r) {
            aplicar.disabled = false;
            if (!r.ok) { salida.appendChild(h('div', { class: 'errores', text: r.error })); return avisar(r.error, true); }
            salida.appendChild(h('p', null, 'Se está aplicando solo (se fusiona y publica si todo sale bien). Seguimiento en GitHub: ', h('a', { href: r.pr, target: '_blank', rel: 'noopener', text: r.pr })));
            avisar('Aprobado. Se está aplicando solo; en unos minutos queda publicado.');
          });
        });
      } });
      raiz.appendChild(h('div', { class: 'barra' }, h('span', { class: 'esp' }), aplicar));
      raiz.appendChild(salida);
    }

    // Oculta modelos del sitio con el mismo camino que el interruptor de «Publicación y destacados»: guarda y publica.
    function ocultar(lista, generado, salida) {
      return cargar('publicacion', true).then(function (doc) {
        var P = doc.contenido; P.ocultos = P.ocultos || {};
        var motivo = ' (revisión ' + String(generado).slice(0, 10) + ')';
        lista.forEach(function (i) { P.ocultos[i.marca + '/' + i.slug] = i.motivo + motivo; });
        // un destacado apagado no puede seguir como destacado: se avisa en vez de dejar el documento inválido
        var dest = (P.destacados || []).filter(function (k) { return P.ocultos[k]; });
        if (dest.length) { var m = 'No se puede ocultar ' + dest.join(', ') + ': es un modelo destacado de la portada. Cámbialo en Publicación y destacados y vuelve a aprobar.'; salida.appendChild(h('div', { class: 'errores', text: m })); avisar(m, true); return false; }
        return api('doc', { method: 'PUT', body: { clave: 'publicacion', version: doc.version, contenido: limpio(P) } }).then(function (r) {
          if (!r.ok) { salida.appendChild(h('div', { class: 'errores', text: r.error || 'No se pudo guardar' })); avisar(r.error || 'No se pudo guardar', true); return false; }
          return api('publicar', { method: 'POST', body: { clave: 'publicacion', version: r.version } }).then(function (p) {
            if (!p.ok) { salida.appendChild(h('div', { class: 'errores', text: p.error || 'No se pudo publicar' })); avisar(p.error || 'No se pudo publicar', true); return false; }
            salida.appendChild(h('p', { text: 'Ocultos del sitio: ' + lista.map(function (i) { return i.marca + '/' + i.slug; }).join(', ') + '. Ya no se ven en el sitio.' }));
            avisar('Modelos ocultos del sitio'); return cargar('publicacion', true).then(function () { return true; });
          });
        });
      });
    }

    function cargarEstado() {
      return api('revision').then(function (e) {
        if (!document.body.contains(raiz) && reloj) return parar();
        pintar(e);
      });
    }
    raiz.appendChild(h('p', { class: 'cargando', text: 'Consultando GitHub…' }));
    cargarEstado();
    return raiz;
  };

  function router() {
    var hash = (location.hash || '#inicio').slice(1), p = hash.split('/'), sec = p[0], arg = p.slice(1).join('/');
    var fn = S[sec] || S.inicio;
    [].forEach.call(document.querySelectorAll('.lateral a'), function (a) {
      var s = a.getAttribute('data-sec');
      a.classList.toggle('on', s === hash || s === sec || (sec === 'ficha' && s === 'traducciones') || (sec === 'usado' && s === 'usados') || ((sec === 'modelo' || sec === 'nuevo-modelo') && s === 'catalogo') || (sec === 'edicion' && s === 'puerto'));
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
