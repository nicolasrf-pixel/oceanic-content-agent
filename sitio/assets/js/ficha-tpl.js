/* OCEANIC · Ficha de modelo (marca/index.html?m=<marca>&modelo=<slug>).
   Diseño: la maqueta del Axopar 37 XC, igual para los 148 modelos.
   Contenido: la página oficial de cada modelo traducida al español (assets/data/fichas/<marca>/<slug>.json,
   generado desde biblioteca/<marca>/<modelo>/01_CONTENIDO/pagina-es.json con tools/sitio_fichas.py).
   Mientras un modelo no tenga traducción completa se usa el borrador del catálogo.
   Regla: un bloque de la maqueta sin datos oficiales no se muestra. */
(function () {
  'use strict';
  function IMG(b, p) { return /^(https?:)?\/\/|^\//.test(p) ? p : b + p; }  // /media/... del CMS o URL completa: tal cual

  // Configurador oficial de Axopar incrustado en la ficha: SOLO Axopar y SOLO si la versión no muestra precios
  // (regla Oceanic: los barcos nuevos no publican precio). El configurador público de axopar.com muestra el precio
  // en euros y hoy solo existe para la gama 38, así que la lista está vacía hasta que Axopar entregue una versión
  // sin precios (p. ej. de distribuidor). Formato: 'slug': 'https://…'.
  var CONFIGURADOR_AXOPAR = {};
  // Marcas cuyas fotos oficiales son recortes del barco sobre fondo blanco (estudio): se muestran completas, sin
  // agrandar ni recortar, sobre un fondo claro.
  var ESTUDIO = ['oceanic-power'];

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
  // Cada espacio pide un ancho mínimo (nunca se muestra una foto agrandada): si ninguna alcanza, queda sin foto.
  // RES = assets/data/resolucion.json (medidas de las fotos de menos de 1600 px; las demás sirven en todo).
  function Fotos(AB, mo, galCat, RES, sinMinimo) {
    var orden = ['Exterior', 'Navegando', 'Interior', 'Timonera', 'Cubierta', 'Camarotes', 'Detalle', 'Galería'];
    var lista = [];
    orden.forEach(function (c) { (galCat[c] || []).forEach(function (f) { if (lista.indexOf(f) < 0) lista.push(f); }); });
    Object.keys(galCat).forEach(function (c) { (galCat[c] || []).forEach(function (f) { if (lista.indexOf(f) < 0) lista.push(f); }); });
    RES = RES || {};
    function medida(f) { var r = RES[String(f || '').split('/').pop()]; return r || [9999, 9999]; }
    function alcanza(f, min) { return sinMinimo || medida(f)[0] >= min; }
    var usadas = {};
    var hero = mo.hero;
    if (hero && !alcanza(hero, 1500)) {  // portada chica: la primera foto horizontal grande de la galería, o ninguna
      hero = lista.filter(function (f) { var m = medida(f); return m[0] >= 1500 && m[0] > m[1]; })[0] || null;
      if (hero) usadas[hero] = 1;
    }
    if (mo.hero) usadas[mo.hero] = 1;
    function tomar(min) {
      for (var k = 0; k < lista.length; k++) { var f = lista[k]; if (!usadas[f] && alcanza(f, min)) { usadas[f] = 1; return IMG(AB, f); } }
      return null;
    }
    return {
      hero: hero ? IMG(AB, hero) : null,
      sig: function (min) { return tomar(min || 1000); },
      resto: function (n, min) { var r = [], f; while (r.length < n && (f = tomar(min || 700))) r.push(f); return r; }
    };
  }
  function img(src, alt, cls) {
    return src ? '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" data-ocultar>' : '';
  }

  // Borrador del catálogo con la misma forma que pagina-es.json (para modelos aún sin traducción completa).
  function desdeCatalogo(mo, CC) {
    var L = window.OCEANIC_SIN_OPCIONALES || { texto: function (t) { return t; }, lista: function (a) { return a; } };
    CC = {  // el borrador del catálogo también sin opcionales
      secciones: (CC.secciones || []).map(function (s) {
        return { t: s.t, p: (s.p || []).map(L.texto).filter(function (x) { return x; }) };
      }).filter(function (s) { return s.p.length; }),
      equipamiento: (CC.equipamiento || []).map(function (c) { return { cat: c.cat, items: L.lista(c.items) }; })
        .filter(function (c) { return c.items.length; }),
      galeria: CC.galeria
    };
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
    var F = Fotos(AB, mo, CC.galeria || {}, P.resolucion, ESTUDIO.indexOf(marca) >= 0);
    var wa = 'https://wa.me/56229537322?text=' + encodeURIComponent('Hola Oceanic, quiero cotizar el ' + mo.nombre + ' (' + info.nombre + ').');
    // marcas con línea vela y motor: volver a la línea del modelo
    var lineaMo = /electric|eléctric/i.test(mo.tipo) ? 'electrico' : /vela/i.test(mo.tipo) ? 'vela' : 'motor';
    var gama = 'index.html?m=' + marca + (info.lineas && info.lineas[lineaMo] ? '&u=' + lineaMo : '');
    if (info.lineas && info.lineas[lineaMo]) info = Object.assign({}, info, info.lineas[lineaMo]);
    var html = [], nav = [];
    // el fondo alterno (blanco / gris muy claro) lo pone oceano.js en todo el sitio
    function seccion(id, contenido, clase) {
      return '<section' + (id ? ' id="' + id + '"' : '') + (clase ? ' class="' + clase + '"' : '') +
        '><div class="wrap">' + contenido + '</div></section>';
    }
    function cabeza(t) { return '<div class="sec-head"><span class="eyebrow">' + esc(t) + '</span><span class="rule"></span></div>'; }

    document.title = mo.nombre + ' · ' + info.nombre + ' | Oceanic';

    // 1 · Portada
    var portada = P.portada || {};
    var estudio = ESTUDIO.indexOf(marca) >= 0;
    if (estudio) document.body.classList.add('ficha-estudio');
    html.push('<header class="hero' + (estudio ? ' hero-estudio' : '') + '">' +
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
      var foto = estudio ? null : F.sig(1400);
      html.push('<section class="story" id="historia"><div class="wrap"><div class="story-intro">' +
        '<span class="story-marca" aria-hidden="true"></span>' +
        '<p class="story-line story-em' + (P.intro[0].length > 90 ? ' story-larga' : '') + '">' + esc(P.intro[0]) + '</p>' +
        (P.intro.length > 1 ? '<div class="story-mas">' + parr(P.intro.slice(1)) + '</div>' : '') +
        '</div></div>' + (foto ? '<figure class="story-fig">' + img(foto, mo.nombre) + '</figure>' : '') + '</section>');
    }

    // 2b · Premios que publica la página oficial del modelo (tools/sitio_medios.py)
    var MD = P.medios || {};
    if (MD.premios && MD.premios.length) {
      var conLogo = MD.premios.filter(function (x) { return x.logo; }), sinLogo = MD.premios.filter(function (x) { return !x.logo; });
      var nombreP = function (x) { return x.nombre + (x.detalle ? ' · ' + x.detalle : ''); };
      html.push('<section class="premios-sec" id="premios"><div class="wrap">' + cabeza('Reconocimientos') +
        (conLogo.length ? '<ul class="premios-logos">' + conLogo.map(function (x) {
          return '<li title="' + esc(nombreP(x)) + '"><img src="' + esc(AB + x.logo) + '" alt="' + esc(nombreP(x)) + '" loading="lazy"></li>';
        }).join('') + '</ul>' : '') +
        (sinLogo.length ? '<p class="premios-texto">' + (conLogo.length ? 'Además: ' : '') +
          sinLogo.map(function (x) { return '<span>' + esc(nombreP(x)) + '</span>'; }).join('') + '</p>' : '') +
        '<p class="spec-fuente">Premios publicados en la página oficial de ' + esc(info.nombre) + '.</p></div></section>');
    }

    // 3 · Bloques oficiales (maqueta "A bordo": título, texto y foto). Texto y foto alternan de lado bloque a bloque.
    var cuerpo = [], lado = 0;
    // sin foto: el texto ocupa el bloque (sin columna vacía) y no cuenta para alternar lados
    function dos(f) { return '<div class="two' + (f ? (lado++ % 2 ? ' two-inv' : '') : ' sin-foto') + '">'; }
    (P.bloques || []).forEach(function (b, i) {
      if (!b.texto || !b.texto.length) return;
      var f = F.sig();
      cuerpo.push(seccion(i === 0 ? 'abordo' : '',
        cabeza(b.titulo) + dos(f) + '<div><h2>' + h2(b.titulo) + '</h2>' +
        '<p class="lede" style="margin-top:22px">' + esc(b.texto[0]) + '</p>' + parr(b.texto.slice(1)) + '</div>' +
        (f ? '<div>' + img(f, mo.nombre + ' · ' + b.titulo) + '</div>' : '') + '</div>'));
    });
    if (cuerpo.length) nav.push(['abordo', 'El barco']);

    // 4 · Destacados oficiales (maqueta "Diseño e ingeniería": lista de puntos con foto)
    (P.destacados || []).forEach(function (g, i) {
      if (!g.items || !g.items.length) return;
      var f = F.sig();
      cuerpo.push(seccion(i === 0 ? 'destacados' : '',
        cabeza(g.grupo) + dos(f) + '<div><h2>' + h2(g.grupo) + '</h2>' +
        (g.intro ? '<p class="lede" style="margin-top:22px">' + esc(g.intro) + '</p>' : '') + img(f, mo.nombre + ' · ' + g.grupo) + '</div>' +
        '<div><dl style="margin:0">' + g.items.map(function (it) {
          return '<div class="tr"><dt>' + esc(it.titulo) + '</dt><dd>' + esc(it.texto || '') + '</dd></div>';
        }).join('') + '</dl></div></div>'));
      if (i === 0) nav.push(['destacados', 'Destacados']);
    });

    // 5 · Galería (maqueta: grilla de 3). Antes se reservan las fotos de portada de los videos.
    var vids = (MD.videos || []).map(function (v, k, t) { return { v: v, foto: F.sig(t.length === 1 ? 1000 : 700) || F.hero }; });
    var galeria = F.resto(6, 700);
    if (galeria.length) {
      cuerpo.push(seccion('galeria', cabeza('Galería') + '<div class="gal">' +
        galeria.map(function (g) { return '<div class="gal-item">' + img(g, mo.nombre) + '</div>'; }).join('') + '</div>'));
    }

    // 5b · Videos oficiales: se llaman desde donde están alojados (YouTube, Vimeo o el CDN del fabricante) y solo al
    // apretar reproducir; antes no se conecta nada externo (sin cookies de terceros hasta que el visitante lo pide).
    if (vids.length) {
      cuerpo.push(seccion('videos', cabeza('Videos') + '<div class="vids' + (vids.length === 1 ? ' vids-1' : '') + '">' +
        vids.map(function (x) {
          var v = x.v;
          return '<button type="button" class="vid" data-tipo="' + esc(v.tipo) + '" data-v="' + esc(v.id || v.src) + '" aria-label="Reproducir video: ' + esc(v.etiqueta) + '">' +
            (x.foto ? img(x.foto, mo.nombre) : '') + '<span class="vid-play" aria-hidden="true"></span>' +
            '<span class="vid-et">' + esc(v.etiqueta) + '</span></button>';
        }).join('') + '</div>' +
        (vids.length > 6 ? '<p class="vids-mas"><button type="button" class="btn btn-line btn-line-dark" data-vids-mas>Ver más videos (' + (vids.length - 6) + ')</button></p>' : '') +
        '<p class="spec-fuente">Videos publicados en la página oficial de ' + esc(info.nombre) + '. Se reproducen desde su plataforma de origen.</p>'));
      nav.push(['videos', 'Videos']);
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
    // Solo equipamiento de serie: los opcionales no se publican, se conversan con un especialista (decisión 2026-11-04).
    // Axopar trae su configurador oficial: solo en esa marca, incrustado en la ficha (el visitante no sale del sitio).
    var serie = grupos(eq.serie);
    var conf = marca === 'axopar' ? (CONFIGURADOR_AXOPAR[mslug] || null) : null;
    if (serie || conf) {
      cuerpo.push(seccion('equipamiento', cabeza(serie ? 'Equipamiento' : 'Configuración') + '<div class="two">' +
        (serie ? '<div><h3 class="eq-h">De serie</h3>' + serie + '</div>' : '') +
        '<div><h3 class="eq-h">Opcionales y configuración</h3>' +
        (conf
          ? '<p class="lede" style="margin-top:0">Arma tu ' + esc(mo.nombre) + ' en el configurador oficial de Axopar, aquí mismo, y luego ' +
            'revisamos contigo la configuración, con precio y plazos para Chile.</p>' +
            '<p style="margin-top:22px;display:flex;flex-wrap:wrap;gap:12px"><button type="button" class="btn" data-configurador>Configura tu Axopar</button>' +
            '<a class="btn btn-line btn-line-dark" href="#cotizar" data-ir-form>Conversemos tu configuración</a></p>'
          : '<p class="lede" style="margin-top:0">Cada ' + esc(mo.nombre) + ' se arma a la medida de cómo navegas: motorización, ' +
            'equipamiento opcional y terminaciones. Lo revisamos contigo, con precio y plazos.</p>' +
            '<p style="margin-top:22px"><a class="btn" href="#cotizar" data-ir-form>Conversemos tu configuración</a></p>') +
        '</div></div>' + (serie ? '<p class="spec-fuente">Equipamiento de serie según la ficha oficial de ' + esc(info.nombre) + '.</p>' : '')));
      nav.push(['equipamiento', serie ? 'Equipamiento' : 'Configuración']);
    }
    // Configurador Axopar incrustado: se carga solo cuando el visitante lo abre (pesa y usa cookies de Axopar)
    if (conf) {
      cuerpo.push('<section id="configurador" class="conf" hidden><div class="conf-marco" data-src="' + conf + '"></div>' +
        '<div class="wrap conf-pie"><p>¿Lista tu configuración? Cuéntanos qué elegiste y te enviamos precio y plazos para Chile.</p>' +
        '<a class="btn" href="#cotizar" data-ir-form>Cotizar mi configuración</a></div></section>');
    }

    // 8 · Ficha técnica (datos verificados de la biblioteca)
    if (mo.specs && mo.specs.length) {
      var fila = function (x) {
        return '<div class="sp2"><span class="sp2-l">' + esc(x.label) + '</span><span class="sp2-v">' + esc(x.value) +
          (x.note ? '<i>' + esc(x.note) + '</i>' : '') + '</span></div>';
      };
      var larga = function (x) { return x.value.length > 34; };
      var cortas = mo.specs.filter(function (x) { return !larga(x); }), largas = mo.specs.filter(larga);
      var mid = Math.ceil(cortas.length / 2);
      cuerpo.push(seccion('ficha', cabeza('Ficha técnica') +
        '<div class="spec2"><div class="spec2-cols"><div>' + cortas.slice(0, mid).map(fila).join('') + '</div><div>' +
        cortas.slice(mid).map(fila).join('') + '</div></div>' +
        (largas.length ? '<div class="spec2-largas">' + largas.map(fila).join('') + '</div>' : '') +
        '<p class="spec-fuente">Especificaciones según la ficha oficial de ' + esc(info.nombre) + (mo.anio ? ' (modelo ' + esc(mo.anio) + ')' : '') +
        '. Los valores finales pueden variar según configuración y motorización.</p></div>'));
      nav.push(['ficha', 'Ficha técnica']);
    }

    // 9 · Más de la marca (gama oficial del modelo; si no hay, los de su mismo tipo)
    var otros = cat.modelos.filter(function (x) { return x.slug !== mslug; });
    if (P.gama && P.gama.length) otros = otros.filter(function (x) { return P.gama.indexOf(x.nombre) >= 0; });
    else otros = otros.filter(function (x) { return x.tipo === mo.tipo; });
    otros = otros.slice(0, 3);
    if (otros.length) {
      cuerpo.push(seccion('', cabeza('Más ' + info.nombre) + '<div class="cards">' + otros.map(function (x) {
        var fx = x.tarjeta || x.hero;
        return '<a class="mcard" href="index.html?m=' + marca + '&modelo=' + x.slug + '">' + (fx ? '<div class="mcard-img">' + img(IMG(AB, fx), x.nombre) + '</div>' : '') +
          '<div class="mcard-body"><span class="mcard-marca">' + esc(famLabel(x.tipo)) + '</span><h3>' + esc(x.nombre) + '</h3>' +
          (x.eslora ? '<span class="mcard-eslora">Eslora ' + esc(x.eslora) + '</span>' : '') + '<span class="mcard-cta">Ver modelo</span></div></a>';
      }).join('') + '</div><p class="cards-foot"><a href="' + gama + '">Ver toda la gama ' + esc(info.nombre) + ' →</a></p>'));
    }

    // Barra de secciones (maqueta: subbar)
    var subbar = '<div class="subbar" id="subbar"><div class="subbar-in"><a class="sub-crumb" href="' + gama + '">' + esc(info.nombre) + '</a>' +
      '<span class="sub-model">' + esc(mo.nombre.replace(info.nombre + ' ', '')) + '</span><div class="sub-links">' +
      nav.map(function (n) { return '<a href="#' + n[0] + '">' + n[1] + '</a>'; }).join('') + '<a href="#cotizar">Cotizar</a></div></div></div>';

    // 10 · Formulario de cotización (el mismo en todas las fichas)
    var HP = '<input name="web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">';
    var fCot = mo.tarjeta || mo.hero;
    var datosCot = [['Marca', info.nombre], ['Eslora', mo.eslora], ['Camarotes', mo.camarotes], ['Tipo', famLabel(mo.tipo)]]
      .map(function (d) { var L = window.OCEANIC_SIN_OPCIONALES; return [d[0], L ? L.spec(d[1]) : d[1]]; })  // sin opcionales (decisión Oceanic)
      .filter(function (d) { return d[1]; });
    var cierre = '<section class="cot" id="cotizar"><div class="wrap cot-in">' +
      '<aside class="cot-barco">' +
        (fCot ? '<div class="cot-foto">' + img(IMG(AB, fCot), mo.nombre) + '</div>' : '') +
        '<span class="eyebrow cot-eti">Cotización personalizada</span>' +
        '<h2 class="cot-h">Cotiza el ' + esc(mo.nombre) + '</h2>' +
        '<dl class="cot-datos">' + datosCot.map(function (d) { return '<div><dt>' + d[0] + '</dt><dd>' + esc(d[1]) + '</dd></div>'; }).join('') + '</dl>' +
        '<ul class="cot-recibes">' +
          '<li>Precio y plazos de entrega en Chile</li><li>Configuración a la medida de cómo navegas</li><li>Respuesta de un especialista en un día hábil</li>' +
        '</ul>' +
        '<a class="cot-wa" href="' + wa + '" target="_blank" rel="noopener">Prefiero conversar por WhatsApp →</a>' +
      '</aside>' +
      '<div class="cot-panel">' +
        '<form class="cot-form" data-form="cotizacion" data-modelo="' + esc(mo.nombre) + '" data-marca="' + esc(info.nombre) + '" data-universo="' + esc(famLabel(mo.tipo)) + '"' +
          ' data-ficha="' + esc(marca + '/' + mslug) + '" data-gracias="' + esc(JSON.stringify({
            barco: mo.nombre.toLowerCase().indexOf(info.nombre.toLowerCase()) === 0 ? mo.nombre : info.nombre + ' ' + mo.nombre,
            marca: info.nombre, foto: fCot ? new URL(IMG(AB, fCot), location.href).href : '', url: location.href.split('#')[0],
            gama: new URL(gama, location.href).href, dato: [mo.eslora ? 'Eslora ' + mo.eslora : '', famLabel(mo.tipo)].filter(Boolean).join(' · ')
          })) + '" data-ok="#cokModelo" novalidate>' + HP +
          '<fieldset class="cot-cuando"><legend>¿Cuándo te gustaría navegar?</legend>' +
            ['Esta temporada', 'En 6 a 12 meses', 'Estoy explorando'].map(function (t, k) {
              return '<label class="cot-chip"><input type="radio" name="intencion" value="' + t + '"' + (k === 0 ? ' checked' : '') + '><span>' + t + '</span></label>';
            }).join('') +
          '</fieldset>' +
          '<div class="cot-fila">' +
            '<div class="cot-campo"><input id="cz-n" name="nombre" required autocomplete="name" placeholder=" "><label for="cz-n">Nombre</label></div>' +
            '<div class="cot-campo"><input id="cz-e" name="email" type="email" required autocomplete="email" inputmode="email" placeholder=" "><label for="cz-e">Correo</label></div>' +
          '</div>' +
          '<div class="cot-campo"><input id="cz-t" name="telefono" type="tel" autocomplete="tel" inputmode="tel" placeholder=" "><label for="cz-t">Teléfono, si prefieres que te llamemos</label></div>' +
          '<div class="cot-campo"><textarea id="cz-m" name="mensaje" rows="3" placeholder=" "></textarea><label for="cz-m">Dónde navegas, con quién y qué configuración te interesa</label></div>' +
          '<label class="check"><input name="puerto" type="checkbox"><span>Quiero recibir <b>Puerto</b>: lanzamientos, premios y técnica útil, solo cuando hay algo que contar.</span></label>' +
          '<div class="form-foot"><button class="btn cot-enviar" type="submit">Solicitar cotización</button></div>' +
        '</form>' +
        '<div class="form-ok cot-ok" hidden id="cokModelo" role="status" tabindex="-1"><span class="cot-ok-ic" aria-hidden="true">✓</span><h3>Recibimos tu solicitud</h3>' +
          '<p>Un especialista de Oceanic te escribe dentro de un día hábil con precio, configuración y plazos del ' + esc(mo.nombre) + '. <span data-via></span></p></div>' +
      '</div></div></section>';

    cont.innerHTML = html.join('') + subbar + cuerpo.join('') + cierre;
    document.body.classList.add('es-ficha');
    window.scrollTo(0, 0);

    // Portada: la foto es la cabecera oficial del modelo. En escritorio la portada toma la proporción de la foto
    // (entre 16:9 y 3:1) para mostrarla entera, sin recortes forzados.
    var heroImg = cont.querySelector('.hero-img img'), heroEl = cont.querySelector('.hero');
    function proporcion() {
      if (!heroImg || !heroImg.naturalWidth || innerWidth <= 820) { if (heroEl) heroEl.style.aspectRatio = ''; return; }
      var r = heroImg.naturalWidth / heroImg.naturalHeight;
      heroEl.style.aspectRatio = String(Math.max(16 / 9, Math.min(3, r)));
    }
    if (heroImg) { if (heroImg.complete) proporcion(); else heroImg.addEventListener('load', proporcion); addEventListener('resize', proporcion); }

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
    // botón "Configura tu Axopar": muestra y carga el configurador dentro de la ficha
    var bConf = cont.querySelector('[data-configurador]');
    if (bConf) bConf.addEventListener('click', function () {
      var sec = document.getElementById('configurador'), marco = sec.querySelector('.conf-marco');
      if (!marco.firstChild) {
        var f = document.createElement('iframe');
        f.src = marco.getAttribute('data-src'); f.title = 'Configurador oficial Axopar · ' + mo.nombre;
        f.setAttribute('allow', 'fullscreen'); f.setAttribute('loading', 'eager');
        marco.appendChild(f);
      }
      sec.hidden = false; bConf.textContent = 'Ver el configurador';
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    // videos y premios oficiales (data/medios/, tools/sitio_medios.py), en paralelo con la ficha
    var mbase = base.replace(/fichas\/$/, 'medios/');
    var medios = json(mbase + 'index.json')
      .then(function (l) { return l.indexOf(marca + '/' + mslug) < 0 ? {} : json(mbase + marca + '/' + mslug + '.json'); })
      .catch(function () { return {}; });
    var resolucion = json(base.replace(/fichas\/$/, 'resolucion.json')).catch(function () { return {}; });
    function pintar(P) { Promise.all([medios, resolucion]).then(function (r) { P.medios = r[0]; P.resolucion = r[1]; render(marca, mslug, P); }); }
    // index.json lista las fichas con traducción completa; las demás usan el borrador del catálogo
    json(base + 'index.json')
      .then(function (lista) { if (lista.indexOf(marca + '/' + mslug) < 0) throw 0; return json(base + marca + '/' + mslug + '.json'); })
      .then(function (P) {
        // si la página oficial traducida no trae bloques o equipamiento, se completan con el borrador del catálogo
        var B = desdeCatalogo(mo, CC);
        if (!P.bloques || !P.bloques.length) P.bloques = B.bloques;
        if (!P.equipamiento && B.equipamiento) P.equipamiento = B.equipamiento;
        if (!P.intro || !P.intro.length) P.intro = B.intro;
        pintar(P);
      }, function () { pintar(desdeCatalogo(mo, CC)); });
  };

  // Reproducir un video: recién aquí se llama a la plataforma donde está alojado
  document.addEventListener('click', function (e) {
    var mas = e.target.closest && e.target.closest('[data-vids-mas]');
    if (mas) { var g = document.querySelector('.vids'); if (g) g.classList.add('vids-todos'); mas.parentNode.remove(); return; }
    var b = e.target.closest && e.target.closest('button.vid');
    if (!b) return;
    var t = b.getAttribute('data-tipo'), v = b.getAttribute('data-v'), el;
    if (t === 'mp4') {
      el = document.createElement('video');
      el.src = v; el.controls = true; el.autoplay = true; el.playsInline = true;
    } else {
      el = document.createElement('iframe');
      el.src = t === 'youtube'
        ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v) + '?autoplay=1&rel=0&modestbranding=1'
        : 'https://player.vimeo.com/video/' + encodeURIComponent(v) + '?autoplay=1&dnt=1';
      el.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      el.allowFullscreen = true;
      el.title = b.getAttribute('aria-label') || 'Video';
    }
    el.className = 'vid-player';
    var marco = document.createElement('div');
    marco.className = 'vid vid-on';
    marco.appendChild(el);
    b.replaceWith(marco);
  });

  var q = new URLSearchParams(location.search);
  if (q.get('modelo')) window.OCEANIC_RENDER_MODELO(q.get('m') || 'beneteau', q.get('modelo'));
})();
