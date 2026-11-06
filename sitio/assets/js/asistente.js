/* OCEANIC · Asistente guiado (sin servidor). Cerrado por defecto.
   Conversa con opciones: nombre → qué necesita → preguntas propias de cada caso (tipo de barco, eslora, marca y modelo;
   destino y fechas del charter; boyas para la regata; equipamiento; postventa). Al final muestra el resumen y abre
   WhatsApp con un mensaje ordenado, como una solicitud de cotización, para que quien responde tenga todo a la vista. */
(function () {
  'use strict';
  var C = window.OCEANIC_CATALOGO || {};
  var WA = '56229537322';
  var base = document.body.dataset.assetBase || ''; var pre = base.replace('assets/img/', '');
  var ORDEN = ['axopar', 'beneteau', 'lagoon', 'solaris', 'saffier', 'aquila', 'xo', 'excess', 'vx-one', 'switch', 'oceanic-power'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nombreMarca(mk) { return (C[mk] && C[mk].nombre) || mk; }
  function metros(m) { var x = parseFloat(String(m.eslora || '').replace(',', '.')); return isNaN(x) ? null : x; }
  function familia(m) { var t = (m.tipo || '').toLowerCase(); return t.indexOf('catamaran') >= 0 ? 'cata' : t.indexOf('vela') >= 0 ? 'vela' : 'motor'; }
  function modeloHref(mk, slug) { return pre + 'marca/index.html?m=' + mk + '&modelo=' + slug; }

  // Barco que se está mirando (ficha): permite cotizarlo directo
  var q = new URLSearchParams(location.search), aquiMk = q.get('m'), aquiSlug = q.get('modelo');
  var aqui = aquiMk && aquiSlug && C[aquiMk] ? (C[aquiMk].modelos || []).filter(function (x) { return x.slug === aquiSlug; })[0] : null;

  // ---------- interfaz ----------
  var btn = document.createElement('button');
  btn.className = 'asis-btn'; btn.setAttribute('aria-label', 'Hablar con Oceanic');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3C7 3 3 6.6 3 11c0 2.2 1 4.2 2.7 5.6L5 21l4.3-1.4c.86.2 1.76.3 2.7.3 5 0 9-3.6 9-8s-4-8.9-9-8.9Z"/></svg><span>¿Conversamos?</span>';
  var panel = document.createElement('div'); panel.className = 'asis-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Asistente Oceanic');
  panel.innerHTML = '<div class="asis-head"><div class="asis-head-t"><b>Oceanic</b><span>Te orientamos y dejamos lista tu consulta</span></div>' +
    '<button class="asis-x" aria-label="Cerrar">×</button></div><div class="asis-body"></div>';
  document.body.appendChild(btn); document.body.appendChild(panel);
  var body = panel.querySelector('.asis-body');

  var D = {}, pila = [], log = [];  // datos de la consulta, pasos para «Volver», conversación visible
  function abrir() { panel.hidden = false; btn.classList.add('on'); if (!pila.length) inicio(); }
  function cerrar() { panel.hidden = true; btn.classList.remove('on'); }
  btn.addEventListener('click', function () { panel.hidden ? abrir() : cerrar(); });
  panel.querySelector('.asis-x').addEventListener('click', cerrar);
  window.OCEANIC_ASISTENTE = function () { abrir(); };  // otros botones del sitio pueden abrirlo

  // Pinta la conversación hasta ahora + la pregunta actual
  function pintar(pregunta, controles) {
    body.innerHTML = log.map(function (m) { return '<div class="asis-msg asis-' + m.q + '">' + m.t + '</div>'; }).join('') +
      '<div class="asis-msg asis-bot">' + pregunta + '</div>' + controles +
      (pila.length > 1 ? '<button class="asis-back" type="button">← Volver</button>' : '');
    var b = body.querySelector('.asis-back'); if (b) b.addEventListener('click', volver);
    body.scrollTop = body.scrollHeight;
  }
  function paso(fn) { pila.push({ fn: fn, D: JSON.stringify(D), log: log.length }); fn(); }
  function volver() {
    pila.pop(); var p = pila[pila.length - 1]; if (!p) return inicio();
    D = JSON.parse(p.D); log = log.slice(0, p.log); p.fn();
  }
  function responde(t) { log.push({ q: 'yo', t: esc(t) }); }
  function dijo(t) { log.push({ q: 'bot', t: t }); }

  // Opciones como botones. ops: [[texto, fn]]
  function preguntar(pregunta, ops, clave) {
    pintar(pregunta, '<div class="asis-opts">' + ops.map(function (o, i) { return '<button class="asis-opt" type="button" data-i="' + i + '">' + esc(o[0]) + '</button>'; }).join('') + '</div>');
    [].forEach.call(body.querySelectorAll('.asis-opt'), function (b) {
      b.addEventListener('click', function () {
        var o = ops[+b.dataset.i]; dijo(pregunta); responde(o[0]); if (clave) D[clave] = o[2] != null ? o[2] : o[0]; paso(o[1]);
      });
    });
  }
  // Texto libre. opcional: muestra «Omitir»
  function escribir(pregunta, clave, ph, sig, opcional) {
    pintar(pregunta, '<form class="asis-in"><input type="text" maxlength="160" placeholder="' + esc(ph || '') + '" aria-label="' + esc(pregunta.replace(/<[^>]+>/g, '')) + '"' + (opcional ? '' : ' required') + '>' +
      '<button class="asis-ok" type="submit">Seguir</button></form>' + (opcional ? '<button class="asis-skip" type="button">Omitir</button>' : ''));
    var f = body.querySelector('.asis-in'), inp = f.querySelector('input');
    setTimeout(function () { inp.focus(); }, 30);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var v = inp.value.trim(); if (!v && !opcional) return inp.focus();
      dijo(pregunta); if (v) { responde(v); D[clave] = v; } else responde('Omitido'); paso(sig);
    });
    var s = body.querySelector('.asis-skip'); if (s) s.addEventListener('click', function () { dijo(pregunta); responde('Omitido'); paso(sig); });
  }

  // ---------- conversación ----------
  function inicio() {
    D = {}; pila = []; log = [];
    paso(function () { escribir('Hola, soy el asistente de Oceanic. ¿Cómo te llamas?', 'nombre', 'Tu nombre', menu); });
  }
  function menu() {
    var ops = [];
    if (aqui) ops.push(['Cotizar el ' + aqui.nombre, function () { D.caso = 'nuevo'; D.marca = aquiMk; D.modelo = aqui.nombre; D.slug = aqui.slug; paso(plazo); }]);
    ops.push(['Comprar un barco nuevo', tipoNuevo, 'nuevo'], ['Un barco usado', tipoUsado, 'usado'], ['Arrendar', arrendar, 'arriendo'],
      ['Equipamiento', equipo, 'equipamiento'], ['Postventa y servicio', postventa, 'postventa'], ['Otra consulta', otra, 'otra']);
    preguntar('Gracias, ' + esc((D.nombre || '').split(' ')[0]) + '. ¿Cómo te puedo ayudar?', ops, 'caso');
  }

  // Barco nuevo: tipo → eslora → marca → modelo → plazo → ciudad
  var TIPO = [['Velero', 'vela'], ['Lancha o yate a motor', 'motor'], ['Catamarán', 'cata'], ['Aún no lo sé', '']];
  var ESLORA = [['Hasta 9 m (30 pies)', [0, 9]], ['9 a 12 m (30–40 pies)', [9, 12.2]], ['12 a 15 m (40–50 pies)', [12.2, 15.3]], ['Más de 15 m (50+ pies)', [15.3, 99]], ['Aún no lo sé', null]];
  function candidatos() {
    var L = [];
    ORDEN.forEach(function (mk) { ((C[mk] || {}).modelos || []).forEach(function (m) {
      if (D.tipo && familia(m) !== D.tipo) return;
      var e = metros(m); if (D.rango && (e == null || e < D.rango[0] || e >= D.rango[1])) return;
      L.push({ mk: mk, m: m });
    }); });
    return L;
  }
  function tipoNuevo() {
    preguntar('¿Qué tipo de barco buscas?', TIPO.map(function (t) { return [t[0], function () { D.tipo = t[1]; D.tipoTxt = t[0]; paso(eslora); }]; }));
  }
  function eslora() {
    preguntar('¿De qué eslora?', ESLORA.map(function (r) { return [r[0], function () { D.rango = r[1]; D.esloraTxt = r[0]; paso(marca); }]; }));
  }
  function marca() {
    var L = candidatos(), mks = [];
    L.forEach(function (x) { if (mks.indexOf(x.mk) < 0) mks.push(x.mk); });
    var ops = mks.map(function (mk) { return [nombreMarca(mk), function () { D.marca = mk; paso(modelo); }]; });
    ops.push(['Sin preferencia, quiero que me orienten', function () { D.marca = ''; D.modelo = ''; paso(plazo); }]);
    preguntar(mks.length ? '¿Alguna marca en mente? Estas tienen modelos de ese tipo y eslora:' : 'No tenemos modelos con esa combinación en el catálogo, pero te orientamos igual.', ops);
  }
  function modelo() {
    var L = candidatos().filter(function (x) { return x.mk === D.marca; });
    var ops = L.slice(0, 12).map(function (x) { return [x.m.nombre + (x.m.eslora ? ' · ' + x.m.eslora : ''), function () { D.modelo = x.m.nombre; D.slug = x.m.slug; paso(plazo); }]; });
    ops.push(['Aún no sé el modelo', function () { D.modelo = ''; paso(plazo); }]);
    preguntar('¿Qué modelo de ' + esc(nombreMarca(D.marca)) + ' te interesa?', ops);
  }
  function plazo() {
    preguntar('¿Para cuándo te gustaría navegarlo?', [['Esta temporada', ciudad], ['En 6 a 12 meses', ciudad], ['Estoy explorando', ciudad]], 'plazo');
  }
  function ciudad() { escribir('¿Desde qué ciudad nos escribes?', 'ciudad', 'Ej. Santiago, Puerto Montt', resumen, true); }

  // Usado: tipo → presupuesto → ciudad
  function tipoUsado() {
    preguntar('¿Qué tipo de barco usado buscas?', [['Velero', presupuesto], ['Lancha o yate a motor', presupuesto], ['Catamarán', presupuesto], ['Cualquiera, quiero ver opciones', presupuesto]], 'tipoTxt');
  }
  function presupuesto() {
    preguntar('¿Qué presupuesto aproximado tienes?', [['Hasta USD 100.000', ciudad], ['USD 100.000 a 300.000', ciudad], ['USD 300.000 a 700.000', ciudad], ['Más de USD 700.000', ciudad], ['Prefiero conversarlo', ciudad]], 'presupuesto');
  }

  // Arriendo: charter o boyas de regata
  function arrendar() {
    preguntar('¿Qué quieres arrendar?', [['Un velero o catamarán (charter)', destino, 'Charter'], ['Boyas robóticas para una regata (MarkSetBot)', evento, 'Boyas MarkSetBot'], ['Otra cosa', otra, 'Otro']], 'arriendo');
  }
  function destino() {
    preguntar('¿Dónde te gustaría navegar?', [['Mediterráneo', personas], ['Caribe', personas], ['Pacífico Sur', personas], ['Chile y Patagonia', personas], ['Aún no lo decido', personas]], 'destino');
  }
  function personas() {
    preguntar('¿Cuántas personas serían?', [['2 a 4', fechas], ['5 a 8', fechas], ['9 a 12', fechas], ['Más de 12', fechas]], 'personas');
  }
  function fechas() { escribir('¿En qué fechas, aproximadamente?', 'fechas', 'Ej. segunda quincena de enero', resumen, true); }
  function evento() {
    preguntar('¿Qué tipo de regata es?', [['Regata de club', boyas], ['Campeonato nacional', boyas], ['Evento internacional', boyas], ['Entrenamiento o clínica', boyas]], 'evento');
  }
  function boyas() {
    preguntar('¿Cuántas boyas necesitas?', [['2 a 3', fechaRegata], ['4 a 6', fechaRegata], ['Más de 6', fechaRegata], ['Aún no lo sé', fechaRegata]], 'boyas');
  }
  function fechaRegata() { escribir('¿Cuándo es la regata?', 'fechas', 'Ej. 14 y 15 de marzo', lugar, true); }
  function lugar() { escribir('¿Dónde se corre?', 'lugar', 'Bahía, club o ciudad', resumen, true); }

  // Equipamiento
  function equipo() {
    preguntar('¿Qué tipo de equipamiento buscas?', [['Electrónica y navegación', detalle], ['Jarcia y cubierta', detalle], ['Velas', detalle], ['Cabos', detalle], ['Propulsión', detalle], ['Pinturas y mantención', detalle], ['Gestión de regatas', detalle]], 'categoria');
  }
  function detalle() { escribir('Cuéntanos qué necesitas o para qué barco', 'detalle', 'Ej. plotter para un velero de 40 pies', resumen, true); }

  // Postventa
  function postventa() {
    preguntar('¿Qué necesitas?', [['Mantención', barcoPropio], ['Garantía', barcoPropio], ['Repuestos', barcoPropio], ['Otra ayuda', barcoPropio]], 'servicio');
  }
  function barcoPropio() { escribir('¿Qué barco tienes? (marca, modelo y año)', 'barco', 'Ej. Beneteau Oceanis 40.1, 2023', detalle, true); }
  function otra() { escribir('Cuéntanos tu consulta', 'detalle', 'Escribe aquí', resumen); }

  // ---------- resumen y WhatsApp ----------
  function lineas() {
    var L = [], t = {
      nuevo: 'Cotización de barco nuevo', usado: 'Consulta por barco usado', arriendo: D.arriendo === 'Boyas MarkSetBot' ? 'Arriendo de boyas MarkSetBot' : 'Solicitud de charter',
      equipamiento: 'Consulta de equipamiento', postventa: 'Postventa y servicio', otra: 'Consulta general' }[D.caso] || 'Consulta';
    function add(e, v) { if (v) L.push([e, v]); }
    add('Nombre', D.nombre);
    if (D.caso === 'nuevo') {
      add('Tipo de barco', D.tipoTxt && D.tipoTxt !== 'Aún no lo sé' ? D.tipoTxt : '');
      add('Eslora', D.esloraTxt && D.esloraTxt !== 'Aún no lo sé' ? D.esloraTxt : '');
      add('Marca', D.marca ? nombreMarca(D.marca) : 'Sin preferencia');
      add('Modelo', D.modelo);
      add('Plazo', D.plazo);
    }
    if (D.caso === 'usado') { add('Tipo', D.tipoTxt); add('Presupuesto', D.presupuesto); }
    if (D.caso === 'arriendo') { add('Destino', D.destino); add('Personas', D.personas); add('Regata', D.evento); add('Boyas', D.boyas); add('Fechas', D.fechas); add('Lugar', D.lugar); }
    if (D.caso === 'equipamiento') add('Categoría', D.categoria);
    if (D.caso === 'postventa') { add('Servicio', D.servicio); add('Barco', D.barco); }
    add('Detalle', D.detalle);
    add('Ciudad', D.ciudad);
    return { titulo: t, L: L };
  }
  function resumen() {
    var r = lineas(), url = location.href.split('#')[0];
    var msg = 'Hola Oceanic, les escribo desde el sitio web.\n\n*' + r.titulo + '*\n' +
      r.L.map(function (x) { return '• ' + x[0] + ': ' + x[1]; }).join('\n') +
      (D.slug && D.marca ? '\n• Ficha: ' + new URL(modeloHref(D.marca, D.slug), location.href).href : '\n• Página: ' + url) +
      '\n\nQuedo a la espera de su respuesta. Gracias.';
    var ficha = D.slug && D.marca ? '<a class="asis-ver" href="' + modeloHref(D.marca, D.slug) + '">Ver ficha del ' + esc(D.modelo) + ' →</a>' : '';
    pintar('Listo, ' + esc((D.nombre || '').split(' ')[0]) + '. Este es el resumen que le llegará a un especialista:',
      '<div class="asis-res"><b>' + esc(r.titulo) + '</b><dl>' + r.L.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl></div>' +
      '<div class="asis-cta"><a class="asis-send" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">Enviar por WhatsApp</a>' + ficha +
      '<button class="asis-ver asis-otra" type="button">Empezar otra consulta</button></div>');
    body.querySelector('.asis-otra').addEventListener('click', inicio);
  }
})();
