/* OCEANIC, Nav + footer compartidos (menú por marca, elegante).
   Usa data-asset-base del body para resolver rutas; prefijo calculado por profundidad. */
(function(){
  var AB=document.body.dataset.assetBase||'assets/img/';
  var pre=AB.replace('assets/img/',''); // '../' según profundidad

  // marcas por universo, cada una a su página /marca/?m=slug
  var MARCAS={
    'Vela':[['beneteau&u=vela','Beneteau'],['solaris','Solaris'],['saffier','Saffier'],['lagoon&u=vela','Lagoon'],['excess','Excess'],['aquila&u=vela','Aquila Sail']],
    'Motor':[['axopar','Axopar'],['beneteau&u=motor','Beneteau Motor'],['xo','XO Boats'],['aquila&u=motor','Aquila'],['lagoon&u=motor','Lagoon Motor'],['oceanic-power','Oceanic Power']],
    'Vela deportiva':[['vx-one','VX One'],['switch','Switch']]
  };
  function marcaHref(slug){
    return pre+'marca/index.html?m='+slug;
  }
  var UNIV={'Vela':'vela','Motor':'motor','Vela deportiva':'deportiva'};
  function col(titulo,items){
    var uslug=UNIV[titulo];
    var head=uslug
      ? '<a class="nav-col-h nav-col-h-link" href="'+pre+'universo/index.html?u='+uslug+'" role="menuitem">'+titulo+'</a>'
      : '<span class="nav-col-h">'+titulo+'</span>';
    return '<div class="nav-col">'+head+
      items.map(function(x){return '<a href="'+marcaHref(x[0])+'" role="menuitem">'+x[1]+'</a>';}).join('')+'</div>';
  }
  var drop='<div class="nav-drop">'+
    '<a href="'+pre+'index.html#universos" class="nav-a nav-a-drop">Marcas <span class="nav-caret">▾</span></a>'+
    '<div class="nav-menu nav-menu-wide" role="menu">'+col('Vela',MARCAS.Vela)+col('Motor',MARCAS.Motor)+col('Vela deportiva',MARCAS['Vela deportiva'])+'</div></div>';

  // redes sociales oficiales (las mismas que publica oceanic.cl)
  var REDES=[
    ['Instagram','https://www.instagram.com/oceanic_chile/','<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>'],
    ['Facebook','https://www.facebook.com/oceanic.chile','<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/></svg>']
  ];
  function redesHtml(cls){return '<div class="'+cls+'">'+REDES.map(function(r){return '<a href="'+r[1]+'" target="_blank" rel="noopener" aria-label="Oceanic en '+r[0]+'" title="'+r[0]+'">'+r[2]+'</a>';}).join('')+'</div>';}
  var items=[
    ['Usados',pre+'usados/index.html'],['Equipamiento',pre+'equipamiento/index.html'],
    ['Charter',pre+'charter/index.html'],['Puerto',pre+'puerto/index.html'],['Oceanic',pre+'nosotros/index.html']
  ];
  var topbar='<div class="topbar"><div class="topbar-in">'+
    '<a class="tb-dir" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('Alonso de Córdova 2653, Vitacura, Santiago')+'" target="_blank" rel="noopener">Alonso de Córdova 2653, of. 302, Vitacura</a>'+
    '<a class="tb-tel" href="tel:+56229537321">+56 2 2953 7321</a>'+
    redesHtml('tb-redes')+'</div></div>';
  var nav=topbar+'<div class="bar"><div class="bar-in">'+
    '<a href="'+pre+'index.html" class="bar-brand" aria-label="Oceanic, ir al inicio"><img src="'+pre+'assets/img/marca/logo-blanco.svg" alt="Oceanic" width="110" height="18"></a>'+
    '<nav class="nav" aria-label="Principal">'+drop+
    items.map(function(x){return '<a href="'+x[1]+'" class="nav-a">'+x[0]+'</a>';}).join('')+
    '</nav><div class="bar-act">'+
    '<a href="https://wa.me/56229537322?text=Hola%20Oceanic%2C%20quiero%20hablar%20con%20un%20especialista." target="_blank" rel="noopener" class="btn">Habla con un especialista</a>'+
    '<button class="tema-btn" id="temaBtn" type="button" aria-label="Cambiar a modo oscuro"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path class="t-luna" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><g class="t-sol" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g></svg></button>'+
    '<button class="burger" id="burger" aria-label="Menú" aria-expanded="false"><span></span><span></span></button>'+
    '</div></div></div>';
  var n=document.getElementById('nav'); if(n) n.outerHTML=nav;

  // drawer móvil
  var dr=document.getElementById('drawer');
  if(dr){
    dr.innerHTML='<a href="'+pre+'index.html#marcas">Marcas</a>'+
      items.map(function(x){return '<a href="'+x[1]+'">'+x[0]+'</a>';}).join('')+
      '<a href="https://wa.me/56229537322?text=Hola%20Oceanic%2C%20quiero%20hablar%20con%20un%20especialista." target="_blank" rel="noopener" class="drawer-cta">Habla con un especialista</a>';
  }

  // footer
  var foot='<footer class="ft"><div class="o-olas" aria-hidden="true"><i></i><i></i></div>'+
    '<div class="ft-video" aria-hidden="true"><video muted loop playsinline preload="none" poster="'+pre+'assets/img/pie-olas.webp" data-src="'+pre+'assets/video/pie-olas.mp4"></video></div>'+
    '<div class="wrap-wide"><div class="ft-top">'+
    '<div class="ft-brand"><a class="ft-logo" href="'+pre+'index.html"><img src="'+pre+'assets/img/marca/logo-blanco-est.svg" alt="Oceanic, est. 1994" width="170" height="47"></a><p>Representamos y vendemos marcas de referencia mundial en Chile. Desde 1994.</p></div>'+
    '<div class="ft-cols">'+
    '<div><span class="eyebrow">Vela</span>'+MARCAS.Vela.map(function(x){return '<a href="'+marcaHref(x[0])+'">'+x[1]+'</a>';}).join('')+'</div>'+
    '<div><span class="eyebrow">Motor</span>'+MARCAS.Motor.map(function(x){return '<a href="'+marcaHref(x[0])+'">'+x[1]+'</a>';}).join('')+'</div>'+
    '<div><span class="eyebrow">Explorar</span><a href="'+pre+'usados/index.html">Usados</a><a href="'+pre+'equipamiento/index.html">Equipamiento</a><a href="'+pre+'arriendo-boyas/index.html">Arriendo de boyas</a><a href="'+pre+'puerto/index.html">Puerto</a></div>'+
    '<div><span class="eyebrow">Contacto</span><a href="'+pre+'contacto/index.html">Conversemos</a><a href="mailto:ventas@oceanic.cl">ventas@oceanic.cl</a>'+REDES.map(function(r){return '<a href="'+r[1]+'" target="_blank" rel="noopener">'+r[0]+'</a>';}).join('')+'</div>'+
    '</div></div><div class="ft-base"><span>&copy; 2026 Oceanic. Todos los derechos reservados.</span><span><a href="'+pre+'privacidad/index.html">Política de privacidad</a> · <a href="'+pre+'terminos/index.html">Términos y condiciones</a> · <a href="#" data-cookies>Preferencias de cookies</a> · Santiago · Chile</span></div></div></footer>';
  var f=document.getElementById('foot'); if(f) f.outerHTML=foot;
  // video del mar en el pie (Pixabay, licencia de contenido: uso libre sin atribución). Carga solo cuando el pie se acerca,
  // se pausa al salir de pantalla; en celular, con ahorro de datos o con «reducir movimiento» queda la imagen fija.
  (function(){
    var v=document.querySelector('.ft-video video'); if(!v) return;
    var cn=navigator.connection||{};
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||cn.saveData||window.matchMedia('(max-width: 700px)').matches||!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function(es){ es.forEach(function(e){
      if(e.isIntersecting){ if(!v.src){ v.src=v.getAttribute('data-src'); } var pr=v.play(); if(pr&&pr.catch) pr.catch(function(){}); }
      else if(v.src) v.pause();
    }); },{rootMargin:'300px 0px'}).observe(v.parentNode);
  })();

  // ---------- modo oscuro: automático según el sistema; el botón lo fija y se recuerda ----------
  var html=document.documentElement, mq=window.matchMedia('(prefers-color-scheme: dark)');
  function oscuro(){ var t=html.getAttribute('data-tema'); return t ? t==='oscuro' : mq.matches; }
  function pintarTema(){ var b=document.getElementById('temaBtn'); if(!b) return; var o=oscuro();
    b.classList.toggle('es-oscuro',o); b.setAttribute('aria-label',o?'Cambiar a modo claro':'Cambiar a modo oscuro'); }
  setTimeout(function(){
    var b=document.getElementById('temaBtn'); if(!b) return;
    b.addEventListener('click',function(){
      var nuevo=oscuro()?'claro':'oscuro'; html.setAttribute('data-tema',nuevo);
      try{ localStorage.setItem('oceanic-tema',nuevo); }catch(e){}
      pintarTema();
    });
    pintarTema();
  },0);
  if(mq.addEventListener) mq.addEventListener('change',pintarTema);

  // ---------- barra sólida en páginas sin portada oscura (si no, el menú blanco queda sobre fondo claro) ----------
  function barraSegunPortada(){
    var bar=document.querySelector('.bar'); if(!bar) return;
    var el=bar.nextElementSibling; while(el&&(el.offsetHeight<40||/^(SCRIPT|STYLE)$/.test(el.tagName))) el=el.nextElementSibling;
    if(el&&el.id==='marca') el=el.querySelector('header, section')||el;
    if(!el) return;
    var c=getComputedStyle(el), m=(c.backgroundColor.match(/[\d.]+/g)||[]).map(Number);
    var transparente=!m.length||m[3]===0, lum=m.length?(m[0]*.3+m[1]*.59+m[2]*.11):255;
    var conFoto=c.backgroundImage!=='none'||el.querySelector(':scope > img, :scope > picture, [class*="media"], .hero-img');
    bar.classList.toggle('bar-solida', !conFoto&&(transparente||lum>140));
  }
  setTimeout(barraSegunPortada,0); setTimeout(barraSegunPortada,900); addEventListener('load',barraSegunPortada);

  // ---------- cookies y analítica (Ley 21.719) ----------
  // Sin GA4 configurado: aviso informativo (el sitio no usa cookies de seguimiento).
  // Con GA4 (OCEANIC_GA4 abajo): banner de consentimiento. Analytics solo se carga si la persona acepta; sin respuesta
  // o con rechazo no se carga nada (Google Consent Mode v2 en «denegado» por defecto). La elección se puede cambiar
  // desde «Preferencias de cookies» en el pie.
  var GA4 = (window.OCEANIC_GA4 || 'G-XXXXXXXXXX').trim();  // ID de medición de Google Analytics 4 (lo entrega Oceanic)
  if (!/^G-[A-Z0-9]{6,}$/.test(GA4) || GA4 === 'G-XXXXXXXXXX') GA4 = '';
  var CLAVE_C = 'oceanic-consentimiento', VERSION_C = '2026-11';
  function leerC(){ try{ var v=JSON.parse(localStorage.getItem(CLAVE_C)||'null'); return v&&v.v===VERSION_C?v:null; }catch(e){ return null; } }
  function guardarC(ok){ try{ localStorage.setItem(CLAVE_C, JSON.stringify({v:VERSION_C, analitica:!!ok, fecha:new Date().toISOString().slice(0,10)})); }catch(e){} }
  function cargarGA(){
    if (!GA4 || window.__gaCargado) return; window.__gaCargado = true;
    window.dataLayer = window.dataLayer || []; window.gtag = function(){ dataLayer.push(arguments); };
    gtag('consent', 'default', { ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'granted' });
    gtag('js', new Date()); gtag('config', GA4, { anonymize_ip: true });
    var sc=document.createElement('script'); sc.async=true; sc.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA4); document.head.appendChild(sc);
  }
  function borrarGA(){  // al retirar el consentimiento: borra las cookies de Analytics de este dominio
    document.cookie.split(';').forEach(function(c){ var n=c.split('=')[0].trim(); if(/^_ga/.test(n)){
      var d=location.hostname.split('.'); for(var k=0;k<d.length;k++){ document.cookie=n+'=; Max-Age=0; path=/; domain=.'+d.slice(k).join('.'); } document.cookie=n+'=; Max-Age=0; path=/'; } });
  }
  function banner(){
    var prev=document.querySelector('.aviso-priv'); if(prev) prev.remove();
    var a=document.createElement('div'); a.className='aviso-priv'; a.setAttribute('role','region'); a.setAttribute('aria-label','Cookies y privacidad');
    if (GA4) {
      a.innerHTML='<p>Usamos cookies de analítica (Google Analytics) para saber cómo se usa el sitio y mejorarlo. Solo se activan si las aceptas. '+
        'Más detalle en la <a href="'+pre+'privacidad/index.html#almacenamiento">política de privacidad</a>.</p>'+
        '<div class="aviso-bt"><button type="button" class="btn" data-c="si">Aceptar</button><button type="button" class="btn btn-line aviso-no" data-c="no">Rechazar</button></div>';
    } else {
      a.innerHTML='<p>Este sitio no usa cookies de seguimiento ni publicidad. Solo guardamos en tu navegador tus preferencias, como el modo oscuro. '+
        'Los datos que nos envías por formularios se tratan según nuestra <a href="'+pre+'privacidad/index.html">política de privacidad</a>.</p>'+
        '<div class="aviso-bt"><button type="button" class="btn" data-c="ok">Aceptar</button><button type="button" class="btn btn-line aviso-no" data-c="rechazo">Rechazar</button></div>';
    }
    a.addEventListener('click',function(e){ var b=e.target.closest('[data-c]'); if(!b) return;
      var c=b.getAttribute('data-c');
      if (c==='ok' || c==='rechazo') { try{ localStorage.setItem('oceanic-aviso','2026-11'); }catch(e2){} guardarC(c==='ok'); }
      else { guardarC(c==='si'); if(c==='si') cargarGA(); else borrarGA(); }
      a.remove(); });
    document.body.appendChild(a);
  }
  window.OCEANIC_COOKIES = banner;  // «Preferencias de cookies» del pie
  setTimeout(function(){
    if (/privacidad\/|terminos\//.test(location.pathname)) return;
    if (GA4) { var c=leerC(); if(c){ if(c.analitica) cargarGA(); } else banner(); return; }
    var visto=false; try{ visto=localStorage.getItem('oceanic-aviso')==='2026-11'; }catch(e){}
    if(!visto) banner();
  },400);
  document.addEventListener('click',function(e){ var l=e.target.closest&&e.target.closest('[data-cookies]'); if(l){ e.preventDefault(); banner(); } });

  // burger
  setTimeout(function(){
    var bt=document.getElementById('burger'), d=document.getElementById('drawer');
    if(bt&&d){bt.addEventListener('click',function(){var o=d.hasAttribute('hidden');if(o){d.removeAttribute('hidden');document.body.classList.add('locked');}else{d.setAttribute('hidden','');document.body.classList.remove('locked');}bt.classList.toggle('on',o);});
      d.addEventListener('click',function(e){if(e.target.tagName==='A'){d.setAttribute('hidden','');document.body.classList.remove('locked');bt.classList.remove('on');}});}
  },50);
  // Eventos: pop-ups de invitación administrados en el CMS (eventos-data.js). El código del pop-up solo se descarga si hay uno activo.
  if(!document.querySelector('script[src*="eventos.js"]')){
    var sd=document.createElement('script'); sd.src=pre+'assets/js/eventos-data.js'; sd.async=true;
    sd.onload=function(){ var ps=(window.OCEANIC_EVENTOS||{}).popups||[];
      if(ps.some(function(x){return x&&x.activo;})){ var se=document.createElement('script'); se.src=pre+'assets/js/eventos.js'; se.async=true; document.body.appendChild(se); } };
    document.body.appendChild(sd);
  }
})();
