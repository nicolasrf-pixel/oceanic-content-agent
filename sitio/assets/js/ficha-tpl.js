/* OCEANIC · Ficha de modelo (marca/index.html?m=<marca>&modelo=<slug>).
   Diseño: la maqueta del Axopar 37 XC, igual para los 148 modelos.
   Contenido: la página oficial de cada modelo traducida al español (assets/data/fichas/<marca>/<slug>.json,
   generado desde biblioteca/<marca>/<modelo>/01_CONTENIDO/pagina-es.json con tools/sitio_fichas.py).
   Mientras un modelo no tenga traducción completa se usa el borrador del catálogo.
   Regla: un bloque de la maqueta sin datos oficiales no se muestra. */
(function () {
  'use strict';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function parr(arr, cls) { return (arr || []).map(function (p) { return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(p) + '</p>'; }).join(''); }
  function famLabel(t) {
    t = (t || '').toLowerCase();
    if (t.indexOf('electric') >= 0 || t.indexOf('eléctric') >= 0) return 'Eléctrico';
    if (t.indexOf('catamaran') >= 0) return t.indexOf('vela') >= 0 ? 'Catamarán a vela' : 'Catamarán a motor';
    if (t.indexOf('vela') >= 0) return 'Vela';
    return 'Motor';
  }
  // Título largo en dos líneas para los h2 de la maqueta (corta en el espacio más cercano al medio).
  function h2(t) {
    t = esc(t); if (t.length < 22) return t;
    var mid = Math.floor(t.length / 2), a = t.lastIndexOf(' ', mid), b = t.indexOf(' ', mid);
    var i = (a < 0) ? b : (b < 0 ? a : (mid - a <= b - mid ? a : b));
    return i > 0 ? t.slice(0, i) + '<br>' + t.slice(i + 1) : t;
  }

  // Fotos del modelo: se reparten entre los bloques sin repetirse. Si una no existe, su contenedor se oculta.
  function Fotos(AB, mo, galCat) {
    var orden = ['Exterior', 'Navegando', 'Interior', 'Timonera', 'Cubierta', 'Camarotes', 'Detalle', 'Galería'];
    var lista = [];
    orden.forEach(function (c) { (galCat[c] || []).forEach(function (f) { if (lista.indexOf(f) < 0) lista.push(f); }); });
    Object.keys(galCat).forEach(function (c) { (galCat[c] || []).forEach(function (f) { if (lista.indexOf(f) < 0) lista.push(f); }); });
    var i = 0;
    return {
      hero: mo.hero ? AB + mo.hero : null,
      sig: function () { return i < lista.length ? AB + lista[i++] : null; },
      resto: function (n) { var r = lista.slice(i, i + n).map(function (f) { return AB + f; }); i += r.length; return r; }
    };
  }
  function img(src, alt, cls) {
    return src ? '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" data-ocultar>' : '';
  }

  // Borrador del catálogo con la misma forma que pagina-es.json (para modelos aún sin traducción completa).
  function desdeCatalogo(mo, CC) {
    var secs = (CC.secciones || []).filter(function (s) { return s.t !== 'Introducción'; });
    var intro = (CC.secciones || []).filter(function (s) { return s.t === 'Introducción'; })[0];
    return {
      borrador_catalogo: true,
      intro: intro ? intro.p : (mo.desc_larga ? [mo.desc_larga] : (mo.desc ? [mo.desc] : [])),
      bloques: secs.map(function (s) { return { titulo: s.t, texto: s.p }; }),
      equipamiento: (CC.equipamiento && CC.equipamiento.length)
        ? { serie: CC.equipamiento.map(function (c) { return { grupo: c.cat, items: c.items }; }) } : null
    };
  }

  function render(marca, mslug, P) {
    var C = window.OCEANIC_CATALOGO, M = window.OCEANIC_MARCAS;
    var AB = document.body.dataset.assetBase || '../assets/img/';
    var cont = document.getElementById('marca');
    var cat = C[marca], info = M[marca];
    var mo = cat.modelos.filter(function (x) { return x.slug === mslug; })[0];
    var CC = (window.OCEANIC_CONTENIDO || {})[marca + '/' + mslug] || {};
    var F = Fotos(AB, mo, CC.galeria || {});
    var wa = 'https://wa.me/56229537322?text=' + encodeURIComponent('Hola Oceanic, quiero cotizar el ' + mo.nombre + ' (' + info.nombre + ').');
    var gama = 'index.html?m=' + marca;
    var html = [], nav = [];
    var fondo = false; // alterna fondo claro / arena entre bloques, como la maqueta
    function seccion(id, contenido, clase) {
      fondo = !fondo;
      return '<section' + (id ? ' id="' + id + '"' : '') + (clase ? ' class="' + clase + '"' : '') +
        (fondo || clase ? '' : ' style="background:#E3E1DC"') + '><div class="wrap">' + contenido + '</div></section>';
    }
    function cabeza(t) { return '<div class="sec-head"><span class="eyebrow">' + esc(t) + '</span><span class="rule"></span></div>'; }

    document.title = mo.nombre + ' · ' + info.nombre + ' | Oceanic';

    // 1 · Portada
    var portada = P.portada || {};
    html.push('<header class="hero">' +
      (F.hero ? '<picture class="hero-img">' + img(F.hero, mo.nombre) + '</picture><p class="hero-photo-note">Fotografía · ' + esc(info.nombre) + '</p>' : '') +
      '<div class="wrap hero-in">' +
        '<p class="hero-brand"><a href="' + gama + '">' + esc(info.nombre) + '</a>' + (info.pais ? ' · ' + esc(info.pais) : '') + '</p>' +
        '<h1>' + esc(mo.nombre) + '</h1>' +
        (portada.titular ? '<p class="hero-purpose">' + esc(portada.titular) + '</p>' : '') +
        (portada.bajada ? '<p class="hero-sub">' + esc(portada.bajada) + '</p>' : '') +
        '<div class="hero-cta"><a class="btn" href="#cotizar" data-ir-form>Cotizar este modelo</a>' +
        '<a class="btn btn-line" href="' + wa + '" target="_blank" rel="noopener">Cotizar por WhatsApp</a></div>' +
      '</div><a aria-label="Continuar" class="hero-scroll" href="#historia"><span></span></a></header>');

    // 2 · Relato: introducción oficial
    if (P.intro && P.intro.length) {
      var foto = F.sig();
      html.push('<section class="story" id="historia"><div class="wrap">' +
        '<p class="story-line story-em' + (P.intro[0].length > 90 ? ' story-larga' : '') + '">' + esc(P.intro[0]) + '</p>' +
        (P.intro.length > 1 ? '<div class="lede narrow" style="margin:28px auto 0;text-align:left;max-width:62ch">' + parr(P.intro.slice(1)) + '</div>' : '') +
        '</div>' + (foto ? '<figure class="story-fig">' + img(foto, mo.nombre) + '</figure>' : '') + '</section>');
    }

    // 3 · Bloques oficiales (maqueta "A bordo": título, texto y foto)
    var cuerpo = [];
    (P.bloques || []).forEach(function (b, i) {
      if (!b.texto || !b.texto.length) return;
      var f = F.sig();
      cuerpo.push(seccion(i === 0 ? 'abordo' : '',
        cabeza(b.titulo) + '<div class="two"><div><h2>' + h2(b.titulo) + '</h2>' +
        '<p class="lede" style="margin-top:22px">' + esc(b.texto[0]) + '</p>' + parr(b.texto.slice(1)) + '</div>' +
        '<div>' + img(f, mo.nombre + ' · ' + b.titulo) + '</div></div>'));
    });
    if (cuerpo.length) nav.push(['abordo', 'El barco']);

    // 4 · Destacados oficiales (maqueta "Diseño e ingeniería": lista de puntos con foto)
    (P.destacados || []).forEach(function (g, i) {
      if (!g.items || !g.items.length) return;
      var f = F.sig();
      cuerpo.push(seccion(i === 0 ? 'destacados' : '',
        cabeza(g.grupo) + '<div class="two"><div><h2>' + h2(g.grupo) + '</h2>' +
        (g.intro ? '<p class="lede" style="margin-top:22px">' + esc(g.intro) + '</p>' : '') + img(f, mo.nombre + ' · ' + g.grupo) + '</div>' +
        '<div><dl style="margin:0">' + g.items.map(function (it) {
          return '<div class="tr"><dt>' + esc(it.titulo) + '</dt><dd>' + esc(it.texto || '') + '</dd></div>';
        }).join('') + '</dl></div></div>'));
      if (i === 0) nav.push(['destacados', 'Destacados']);
    });

    // 5 · Galería (maqueta: grilla de 3)
    var galeria = F.resto(6);
    if (galeria.length) {
      cuerpo.push(seccion('galeria', cabeza('Galería') + '<div class="gal">' +
        galeria.map(function (g) { return '<div class="gal-item">' + img(g, mo.nombre) + '</div>'; }).join('') + '</div>'));
    }

    // 6 · Configuración oficial (maqueta "Versiones y configuración": tarjetas)
    var cfg = (P.configuracion || []).filter(function (g) { return g.items && g.items.length; });
    if (cfg.length) {
      cuerpo.push(seccion('configuracion', cabeza('Versiones y configuración') +
        cfg.map(function (g, i) {
          return '<h2 style="max-width:18ch;' + (i ? 'margin-top:clamp(48px,6vw,80px)' : '') + '">' + esc(g.grupo) + '</h2>' +
            (g.intro ? '<p class="lede narrow" style="margin:22px 0 34px">' + esc(g.intro) + '</p>' : '<div style="height:28px"></div>') +
            '<div class="cfg">' + g.items.map(function (it) {
              return '<div><h3>' + esc(it.titulo) + '</h3>' + (it.texto ? '<p>' + esc(it.texto) + '</p>' : '') + '</div>';
            }).join('') + '</div>';
        }).join('') +
        '<div class="bridge">Cada decisión cambia el barco, el plazo y el precio. <a href="#cotizar" data-ir-form>Cotiza tu configuración →</a></div>'));
      nav.push(['configuracion', 'Configuración']);
    }

    // 7 · Equipamiento oficial (de serie y opcional, en grupos desplegables)
    var eq = P.equipamiento || {};
    function grupos(lista) {
      return (lista || []).filter(function (g) { return g.items && g.items.length; }).map(function (g) {
        return '<details class="eq-g"><summary><b>' + esc(g.grupo) + '</b><span>' + g.items.length + '</span></summary><ul>' +
          g.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>';
      }).join('');
    }
    // Solo equipamiento de serie: los opcionales no se publican, se conversan con un especialista (decisión 2026-11-04)
    var serie = grupos(eq.serie);
    if (serie) {
      cuerpo.push(seccion('equipamiento', cabeza('Equipamiento') + '<div class="two">' +
        '<div><h3 class="eq-h">De serie</h3>' + serie + '</div>' +
        '<div><h3 class="eq-h">Opcionales y configuración</h3>' +
        '<p class="lede" style="margin-top:0">Cada ' + esc(mo.nombre) + ' se arma a la medida de cómo navegas: motorización, ' +
        'equipamiento opcional y terminaciones. Lo revisamos contigo, con precio y plazos.</p>' +
        '<p style="margin-top:22px"><a class="btn" href="#cotizar" data-ir-form>Conversemos tu configuración</a></p></div>' +
        '</div><p class="spec-fuente">Equipamiento de serie según la ficha oficial de ' + esc(info.nombre) + '.</p>'));
      nav.push(['equipamiento', 'Equipamiento']);
    }

    // 8 · Ficha técnica (datos verificados de la biblioteca)
    if (mo.specs && mo.specs.length) {
      var mid = Math.ceil(mo.specs.length / 2);
      var cols = function (a) { return a.map(function (s) { return '<div class="sp"><span>' + esc(s.label) + '</span><span>' + esc(s.value) + (s.note ? ' <i>' + esc(s.note) + '</i>' : '') + '</span></div>'; }).join(''); };
      cuerpo.push(seccion('ficha', cabeza('Ficha técnica') +
        '<div class="spec"><div>' + cols(mo.specs.slice(0, mid)) + '</div><div>' + cols(mo.specs.slice(mid)) + '</div></div>' +
        '<p class="spec-fuente">Especificaciones según la ficha oficial de ' + esc(info.nombre) + (mo.anio ? ' (modelo ' + esc(mo.anio) + ')' : '') +
        '. Los valores finales pueden variar según configuración y motorización.</p>'));
      nav.push(['ficha', 'Ficha técnica']);
    }

    // 9 · Más de la marca (gama oficial del modelo; si no hay, los de su mismo tipo)
    var otros = cat.modelos.filter(function (x) { return x.slug !== mslug; });
    if (P.gama && P.gama.length) otros = otros.filter(function (x) { return P.gama.indexOf(x.nombre) >= 0; });
    else otros = otros.filter(function (x) { return x.tipo === mo.tipo; });
    otros = otros.slice(0, 3);
    if (otros.length) {
      cuerpo.push(seccion('', cabeza('Más ' + info.nombre) + '<div class="cards">' + otros.map(function (x) {
        return '<a class="card" href="index.html?m=' + marca + '&modelo=' + x.slug + '"><div class="ph ph-soft">' + img(x.hero ? AB + x.hero : null, x.nombre) + '</div>' +
          '<span class="eyebrow">' + esc(famLabel(x.tipo)) + (x.eslora ? ' · ' + esc(x.eslora) : '') + '</span><h3>' + esc(x.nombre) + '</h3>' +
          (x.desc ? '<p>' + esc(x.desc) + '</p>' : '') + '</a>';
      }).join('') + '</div><p class="cards-foot"><a href="' + gama + '">Ver toda la gama ' + esc(info.nombre) + ' →</a></p>'));
    }

    // Barra de secciones (maqueta: subbar)
    var subbar = '<div class="subbar" id="subbar"><div class="subbar-in"><a class="sub-crumb" href="' + gama + '">' + esc(info.nombre) + '</a>' +
      '<span class="sub-model">' + esc(mo.nombre.replace(info.nombre + ' ', '')) + '</span><div class="sub-links">' +
      nav.map(function (n) { return '<a href="#' + n[0] + '">' + n[1] + '</a>'; }).join('') + '<a href="#cotizar">Cotizar</a></div></div></div>';

    // 10 · Formulario de cotización (el mismo en todas las fichas)
    var HP = '<input name="web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">';
    var cierre = '<section class="talk" id="cotizar">' + img(AB + 'talk.webp', '', 'talk-bg') +
      '<div class="wrap"><div class="sec-head"><span class="eyebrow" style="color:var(--boya)">Conversemos</span></div>' +
      '<h2 class="talk-h">¿Te interesa<br>este modelo?</h2>' +
      '<div class="two talk-form"><div>' +
        '<h3 class="talk-h3">Cotiza el ' + esc(mo.nombre) + '</h3>' +
        '<p class="lede" style="margin-top:18px">Te preparamos una propuesta con precio, configuración y plazos según cómo navegas. Sin presión y sin secuencias automáticas.</p>' +
        '<a class="btn talk-wa" href="' + wa + '" target="_blank" rel="noopener">Cotizar por WhatsApp</a>' +
        '<span class="talk-or">o déjanos tus datos y te escribimos →</span></div><div>' +
        '<form data-form="cotizacion" data-modelo="' + esc(mo.nombre) + '" data-marca="' + esc(info.nombre) + '" data-universo="' + esc(famLabel(mo.tipo)) + '" data-ok="#cokModelo" novalidate>' + HP +
          '<div class="row"><div><label for="cz-n">Nombre</label><input id="cz-n" name="nombre" required autocomplete="name"></div>' +
          '<div><label for="cz-e">Correo</label><input id="cz-e" name="email" type="email" required autocomplete="email" inputmode="email"></div></div>' +
          '<div class="row"><div><label for="cz-t">Teléfono <span style="text-transform:none;letter-spacing:0">(opcional)</span></label><input id="cz-t" name="telefono" type="tel" autocomplete="tel" inputmode="tel"></div><div></div></div>' +
          '<div><label for="cz-m">Cómo navegas o cómo te gustaría navegar</label><textarea id="cz-m" name="mensaje" placeholder="Dónde navegas, con quién, qué configuración te interesa y cuándo lo necesitas."></textarea></div>' +
          '<label class="check"><input name="puerto" type="checkbox"><span>Quiero recibir <b>Puerto</b>, lanzamientos, premios, eventos y técnica útil. Cuando hay algo que contar, no por calendario.</span></label>' +
          '<div class="form-foot"><button class="btn" type="submit">Enviar solicitud</button><span class="form-note">Te respondemos dentro de un día hábil.</span></div>' +
        '</form>' +
        '<div class="form-ok" hidden id="cokModelo" role="status" tabindex="-1"><h3 class="talk-h3">Gracias por tu solicitud</h3>' +
          '<p class="lede" style="margin-top:12px">Un especialista de Oceanic te escribe dentro de un día hábil con precio, configuración y plazos del ' + esc(mo.nombre) + '. <span data-via></span></p></div>' +
      '</div></div></div></section>';

    cont.innerHTML = html.join('') + subbar + cuerpo.join('') + cierre;
    window.scrollTo(0, 0);

    // fotos que no existen: se oculta su contenedor para no dejar huecos
    [].forEach.call(cont.querySelectorAll('img[data-ocultar]'), function (im) {
      function fuera() {
        var c = im.closest('.gal-item, .story-fig, .hero-img, .ph');
        var dos = im.parentNode && im.parentNode.parentNode && im.parentNode.parentNode.classList &&
          im.parentNode.parentNode.classList.contains('two') && im.parentNode.children.length === 1 ? im.parentNode : null;
        if (dos) { dos.parentNode.classList.add('sin-foto'); dos.remove(); }   // bloque sin foto: texto a ancho completo
        else if (c && !c.classList.contains('ph')) c.remove(); else im.remove();
        var g = cont.querySelector('#galeria .gal'); if (g && !g.children.length) g.closest('section').remove();
        if (!cont.querySelector('.hero-img')) { var n = cont.querySelector('.hero-photo-note'); if (n) n.remove(); }
      }
      if (im.complete && im.naturalWidth === 0) fuera(); else im.addEventListener('error', fuera);
    });
    // botones "Cotizar" bajan al formulario
    [].forEach.call(cont.querySelectorAll('[data-ir-form]'), function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('cotizar').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(function () { var n = document.getElementById('cz-n'); if (n) n.focus({ preventScroll: true }); }, 500);
      });
    });
  }

  window.OCEANIC_RENDER_MODELO = function (marca, mslug) {
    var C = window.OCEANIC_CATALOGO, cat = C && C[marca];
    var mo = cat && cat.modelos.filter(function (x) { return x.slug === mslug; })[0];
    // modelo apagado (publicacion.js) o inexistente: a la página de la marca
    if (!mo) { location.replace(cat ? 'index.html?m=' + marca : '../index.html'); return; }
    var CC = (window.OCEANIC_CONTENIDO || {})[marca + '/' + mslug] || {};
    var base = (document.body.dataset.assetBase || '../assets/img/').replace(/img\/$/, '') + 'data/fichas/';
    function json(u) { return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
    // index.json lista las fichas con traducción completa; las demás usan el borrador del catálogo
    json(base + 'index.json')
      .then(function (lista) { if (lista.indexOf(marca + '/' + mslug) < 0) throw 0; return json(base + marca + '/' + mslug + '.json'); })
      .then(function (P) { render(marca, mslug, P); }, function () { render(marca, mslug, desdeCatalogo(mo, CC)); });
  };

  var q = new URLSearchParams(location.search);
  if (q.get('modelo')) window.OCEANIC_RENDER_MODELO(q.get('m') || 'beneteau', q.get('modelo'));
})();
