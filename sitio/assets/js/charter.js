/* OCEANIC CHARTER, cotizador por pasos + destinos */
(function () {
  'use strict';
  var D = window.OCEANIC_CHARTER;
  if (!D) return;

  // ---------- estado ----------
  var state = { continente:null, destino:null, desde:'', hasta:'', personas:4, embarcacion:null, tripulacion:null };
  var STEPS = ['continente','destino','fechas','personas','embarcacion','tripulacion','resumen'];
  var cur = 0;

  var stepsEl = document.getElementById('cotzSteps');
  var progEl  = document.getElementById('cotzProg');

  function progress() {
    progEl.innerHTML = STEPS.slice(0, 6).map(function (s, i) {
      return '<span class="cotz-dot' + (i <= cur ? ' on' : '') + '"></span>';
    }).join('');
  }

  function contById(id){ return D.continentes.filter(function(c){return c.id===id;})[0]; }

  // ---------- render de cada paso ----------
  function render() {
    progress();
    var s = STEPS[cur], h = '';
    var back = cur > 0 ? '<button class="cotz-back" data-act="back">← Atrás</button>' : '';

    if (s === 'continente') {
      h = head('¿Hacia dónde?', 'Elige la región del mundo donde sueñas navegar.') +
        '<div class="cotz-cards">' + D.continentes.map(function (c) {
          return card(c.id, 'continente', c.nombre, c.lede, 'ch-img-' + c.img);
        }).join('') + '</div>';
    }
    else if (s === 'destino') {
      var c = contById(state.continente);
      h = head('¿Qué destino?', 'Dentro de ' + c.nombre + '. Si no sabes aún, elige el que más te tiente.') +
        '<div class="cotz-pills">' + c.destinos.map(function (d) {
          return '<button class="cotz-pill' + (state.destino === d ? ' on' : '') + '" data-act="destino" data-v="' + d + '">' + d + '</button>';
        }).join('') + '</div>' + nav(back, !!state.destino);
    }
    else if (s === 'fechas') {
      h = head('¿Cuándo?', 'Aproximado está bien. Lo ajustamos después.') +
        '<div class="cotz-dates">' +
          '<label>Desde<input type="date" id="f-desde" value="' + state.desde + '"></label>' +
          '<label>Hasta<input type="date" id="f-hasta" value="' + state.hasta + '"></label>' +
        '</div>' +
        '<p class="cotz-hint">¿Fechas flexibles? Déjalas en blanco y lo vemos juntos.</p>' +
        nav(back, true);
    }
    else if (s === 'personas') {
      h = head('¿Cuántos van?', 'Incluye a todos los que navegarán, adultos y niños.') +
        '<div class="cotz-count">' +
          '<button class="cotz-cbtn" data-act="menos">–</button>' +
          '<span class="cotz-cnum" id="cnum">' + state.personas + '</span>' +
          '<button class="cotz-cbtn" data-act="mas">+</button>' +
        '</div>' +
        '<p class="cotz-hint">Desde 2 hasta grupos grandes. El número define el tamaño del barco.</p>' +
        nav(back, true);
    }
    else if (s === 'embarcacion') {
      h = head('¿Qué tipo de barco?', 'Si no tienes preferencia, lo recomendamos según destino y grupo.') +
        '<div class="cotz-cards cotz-cards-sm">' + D.embarcaciones.map(function (e) {
          return cardSimple(e.id, 'embarcacion', e.nombre, e.desc);
        }).join('') + '</div>';
    }
    else if (s === 'tripulacion') {
      h = head('¿Con o sin tripulación?', 'Con patrón profesional, o tú al mando si tienes experiencia.') +
        '<div class="cotz-cards cotz-cards-sm">' + D.tripulacion.map(function (t) {
          return cardSimple(t.id, 'tripulacion', t.nombre, t.desc);
        }).join('') + '</div>';
    }
    else if (s === 'resumen') {
      h = renderResumen();
    }
    stepsEl.innerHTML = h;
    stepsEl.classList.remove('fade'); void stepsEl.offsetWidth; stepsEl.classList.add('fade');
    wire();
  }

  function head(t, p){ return '<div class="cotz-hd"><h3>' + t + '</h3><p>' + p + '</p></div>'; }
  function nav(back, canNext){
    return '<div class="cotz-nav">' + back +
      '<button class="btn cotz-next" data-act="next"' + (canNext ? '' : ' disabled') + '>Continuar</button></div>';
  }
  function card(id, act, t, d, imgClass){
    return '<button class="cotz-card ' + imgClass + '" data-act="' + act + '" data-v="' + id + '">' +
      '<span class="cotz-card-in"><span class="cotz-card-t">' + t + '</span>' +
      '<span class="cotz-card-d">' + d + '</span></span></button>';
  }
  function cardSimple(id, act, t, d){
    var on = state[act] === id ? ' on' : '';
    return '<button class="cotz-card cotz-card-simple' + on + '" data-act="' + act + '" data-v="' + id + '">' +
      '<span class="cotz-card-t">' + t + '</span><span class="cotz-card-d">' + d + '</span></button>';
  }

  function renderResumen(){
    var c = contById(state.continente);
    var emb = D.embarcaciones.filter(function(e){return e.id===state.embarcacion;})[0];
    var tri = D.tripulacion.filter(function(t){return t.id===state.tripulacion;})[0];
    var fechas = (state.desde || state.hasta) ? fmt(state.desde) + ' → ' + fmt(state.hasta) : 'Flexibles';
    var rows = [
      ['Destino', state.destino + ' · ' + c.nombre],
      ['Fechas', fechas],
      ['Personas', state.personas],
      ['Embarcación', emb ? emb.nombre : '·'],
      ['Tripulación', tri ? tri.nombre : '·']
    ];
    // cuerpo compartido de la solicitud
    var lineas =
      '• Destino: ' + state.destino + ' (' + c.nombre + ')\n' +
      '• Fechas: ' + fechas + '\n' +
      '• Personas: ' + state.personas + '\n' +
      '• Embarcación: ' + (emb ? emb.nombre : 'A definir') + '\n' +
      '• Tripulación: ' + (tri ? tri.nombre : 'A definir');
    var waMsg = encodeURIComponent('Hola Oceanic, quiero cotizar un charter.\n\n' + lineas);
    var wa = 'https://wa.me/56229537322?text=' + waMsg;

    return '<div class="cotz-res">' +
      '<div class="cotz-res-hd"><span class="cotz-check">✓</span><h3>Tu travesía, en resumen</h3>' +
      '<p>Déjanos tus datos y te enviamos la propuesta a medida por correo. Si prefieres, también puedes escribirnos directo por WhatsApp.</p></div>' +
      '<dl class="cotz-res-list">' + rows.map(function(r){
        return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
      }).join('') + '</dl>' +
      '<div class="cotz-res-form">' +
        '<div class="cotz-res-row">' +
          '<label>Nombre<input id="r-nombre" required></label>' +
          '<label>Correo<input id="r-email" type="email" required></label>' +
        '</div>' +
        '<div class="cotz-res-row">' +
          '<label>Teléfono (opcional)<input id="r-tel"></label>' +
          '<label>Comentario (opcional)<input id="r-msg"></label>' +
        '</div>' +
        '<div class="cotz-res-cta">' +
          '<a class="btn" id="cotz-send-mail" href="#" data-act="mail" data-lineas="' + encodeURIComponent(lineas) + '">Enviar solicitud por correo</a>' +
          '<a class="cotz-wa-alt" href="' + wa + '" target="_blank" rel="noopener">o por WhatsApp →</a>' +
        '</div>' +
        '<div class="cotz-nav" style="margin-top:18px"><button class="cotz-back" data-act="back">← Ajustar</button></div>' +
      '</div></div>';
  }

  function fmt(d){ if(!d) return '·'; var p=d.split('-'); return p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : d; }

  // ---------- eventos ----------
  function wire() {
    [].slice.call(stepsEl.querySelectorAll('[data-act]')).forEach(function (el) {
      el.addEventListener('click', function (e) {
        var act = el.dataset.act, v = el.dataset.v;
        if (act === 'continente') { state.continente = v; state.destino = null; next(); }
        else if (act === 'destino') { state.destino = v; markPill(el); enableNext(); }
        else if (act === 'embarcacion') { state.embarcacion = v; next(); }
        else if (act === 'tripulacion') { state.tripulacion = v; next(); }
        else if (act === 'mas') { state.personas++; document.getElementById('cnum').textContent = state.personas; }
        else if (act === 'menos') { if (state.personas > 1) state.personas--; document.getElementById('cnum').textContent = state.personas; }
        else if (act === 'next') { saveFechas(); next(); }
        else if (act === 'back') { prev(); }
        else if (act === 'mail') {
          e.preventDefault();
          var nombre = (document.getElementById('r-nombre')||{}).value || '';
          var correo = (document.getElementById('r-email')||{}).value || '';
          var tel = (document.getElementById('r-tel')||{}).value || '';
          var com = (document.getElementById('r-msg')||{}).value || '';
          if (!nombre.trim() || !correo.trim()) {
            alert('Déjanos tu nombre y correo para enviarte la propuesta.');
            return;
          }
          var lineas = decodeURIComponent(el.dataset.lineas || '');
          var cuerpo = 'Hola Oceanic, quiero cotizar un charter.\n\n' + lineas +
            '\n\nDatos de contacto:\n• Nombre: ' + nombre +
            '\n• Correo: ' + correo +
            (tel ? '\n• Teléfono: ' + tel : '') +
            (com ? '\n\nComentario:\n' + com : '');
          var mailto = 'mailto:ventas@oceanic.cl?subject=' +
            encodeURIComponent('Solicitud de charter, ' + nombre) +
            '&body=' + encodeURIComponent(cuerpo);
          window.location.href = mailto;
        }
      });
    });
    var fd = document.getElementById('f-desde'), fh = document.getElementById('f-hasta');
    if (fd) fd.addEventListener('change', function(){ state.desde = fd.value; });
    if (fh) fh.addEventListener('change', function(){ state.hasta = fh.value; });
  }
  function markPill(el){ [].slice.call(stepsEl.querySelectorAll('.cotz-pill')).forEach(function(p){p.classList.remove('on');}); el.classList.add('on'); }
  function enableNext(){ var n=stepsEl.querySelector('.cotz-next'); if(n) n.removeAttribute('disabled'); }
  function saveFechas(){ var fd=document.getElementById('f-desde'), fh=document.getElementById('f-hasta'); if(fd)state.desde=fd.value; if(fh)state.hasta=fh.value; }

  function next(){ if (cur < STEPS.length - 1) { cur++; render(); scrollTop(); } }
  function prev(){ if (cur > 0) { cur--; render(); scrollTop(); } }
  function scrollTop(){ var b=document.getElementById('cotzBox'); if(b && b.getBoundingClientRect().top<0) b.scrollIntoView({behavior:'smooth',block:'start'}); }

  render();

  // ---------- destinos (grilla informativa) ----------
  var grid = document.getElementById('cdestGrid');
  if (grid) grid.innerHTML = D.continentes.map(function (c) {
    return '<article class="cd"><div class="cd-img"><img src="' + AB() + c.img + '.webp" alt="' + c.nombre + '" loading="lazy"></div>' +
      '<div class="cd-body"><h3>' + c.nombre + '</h3><p>' + c.lede + '</p>' +
      '<span class="cd-list">' + c.destinos.slice(0,3).join(' · ') + '</span></div></article>';
  }).join('');
  function AB(){ return document.body.dataset.assetBase || '../assets/img/'; }

  // inyectar imágenes de fondo a las cards de continente (paso 1)
  var style = document.createElement('style');
  style.textContent = D.continentes.map(function(c){
    return '.ch-img-' + c.img + '{background-image:linear-gradient(to top,rgba(20,33,43,.85),rgba(20,33,43,.35)),url(../assets/img/' + c.img + '.webp)}';
  }).join('');
  document.head.appendChild(style);

  // menú móvil
  var bt = document.getElementById('burger'), dr = document.getElementById('drawer');
  if (bt && dr) {
    bt.addEventListener('click', function () {
      var open = dr.hasAttribute('hidden');
      if (open) { dr.removeAttribute('hidden'); document.body.classList.add('locked'); }
      else { dr.setAttribute('hidden', ''); document.body.classList.remove('locked'); }
      bt.classList.toggle('on', open); bt.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    dr.addEventListener('click', function (e) { if (e.target.tagName === 'A') { dr.setAttribute('hidden',''); document.body.classList.remove('locked'); bt.classList.remove('on'); } });
  }
})();
