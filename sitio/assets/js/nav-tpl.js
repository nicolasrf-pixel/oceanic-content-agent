/* OCEANIC, Nav + footer compartidos (menú por marca, elegante).
   Usa data-asset-base del body para resolver rutas; prefijo calculado por profundidad. */
(function(){
  var AB=document.body.dataset.assetBase||'assets/img/';
  var pre=AB.replace('assets/img/',''); // '../' según profundidad

  // Universos (categorías) y sus marcas, en el orden del portafolio que se administra en el CMS (assets/js/portafolio-data.js).
  // Si ese archivo no cargó, se usa esta lista de respaldo. Cada marca: [slug, línea (vela|motor|''), texto del enlace].
  var RESPALDO=[
    {slug:'vela',nombre:'Vela',marcas:[['beneteau','vela','Beneteau'],['solaris','','Solaris'],['saffier','','Saffier'],['lagoon','vela','Lagoon'],['excess','','Excess'],['aquila','vela','Aquila Sail']]},
    {slug:'motor',nombre:'Motor',marcas:[['axopar','','Axopar'],['beneteau','motor','Beneteau Motor'],['xo','','XO Boats'],['aquila','motor','Aquila'],['lagoon','motor','Lagoon Motor'],['oceanic-power','','Oceanic Power']]},
    {slug:'deportiva',nombre:'Vela deportiva',marcas:[['vx-one','','VX One'],['switch','','Switch']]}
  ];
  function esc(t){ return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function oculta(mk){ var P=window.OCEANIC_PORTAFOLIO; return !!(P&&Array.isArray(P.inicio)&&P.inicio.some(function(x){ return x&&x.marca===mk&&x.visible===false; })); }
  function universos(){
    var P=window.OCEANIC_PORTAFOLIO;
    if(!P||!Array.isArray(P.universos)||!P.universos.length) return RESPALDO;
    // prioridad interna: en toda categoría las marcas van en el orden en que están en el inicio (administrable en el CMS)
    var ini=Array.isArray(P.inicio)?P.inicio:[];
    function prio(mk){ for(var i=0;i<ini.length;i++){ if(ini[i]&&ini[i].marca===mk) return i; } return 999; }
    var lista=P.universos.filter(function(u){ return u&&u.visible!==false&&/^[a-z0-9-]+$/.test(u.slug||'')&&u.nombre; }).map(function(u){
      var ms=(u.marcas||[]).filter(function(m){ return m&&/^[a-z0-9-]+$/.test(m.marca||'')&&!oculta(m.marca); })
        .map(function(m,i){ return {i:i,p:prio(m.marca),v:[m.marca,/^[a-z0-9-]+$/.test(m.linea||'')?m.linea:'',m.etiqueta||m.marca]}; });
      ms.sort(function(a,b){ return a.p-b.p||a.i-b.i; });
      return {slug:u.slug,nombre:u.nombre,marcas:ms.map(function(x){ return x.v; })};
    });
    return lista.length?lista:RESPALDO;
  }
  var UNIVERSOS=universos();
  // cada marca va a su página /marca/?m=slug (con &u=línea cuando la marca tiene línea de vela y de motor)
  function marcaHref(slug,linea){
    return pre+'marca/index.html?m='+slug+(linea?'&u='+linea:'');
  }
  function enlaces(u,rol){
    return u.marcas.map(function(x){
      return '<a href="'+marcaHref(x[0],x[1])+'"'+(rol?' role="menuitem"':'')+'><span class="nav-nm">'+esc(x[2])+'</span></a>';
    }).join('');
  }
  function col(u){
    return '<div class="nav-col"><a class="nav-col-h nav-col-h-link" href="'+pre+'universo/index.html?u='+u.slug+'" role="menuitem"><span>'+esc(u.nombre)+'</span><i aria-hidden="true">Ver todo →</i></a><div class="nav-list">'+enlaces(u,true)+'</div></div>';
  }
  var drop='<div class="nav-drop">'+
    '<a href="'+pre+'index.html#universos" class="nav-a nav-a-drop">Marcas <span class="nav-caret">▾</span></a>'+
    '<div class="nav-menu nav-menu-wide" role="menu">'+UNIVERSOS.map(col).join('')+'</div></div>';

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
    '<button class="tema-btn tema-sw" id="temaBtn" type="button" role="switch" aria-checked="false" aria-label="Navegación nocturna">'+
      '<span class="tsw-eti tsw-dia" aria-hidden="true">Día</span>'+
      '<span class="tsw-pista" aria-hidden="true"><span class="tsw-canal"><span class="tsw-ic tsw-ic-sol"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg></span><span class="tsw-ic tsw-ic-luna"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg></span></span><span class="tsw-perilla"><span class="t-sol"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg></span><span class="t-luna"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg></span></span></span>'+
      '<span class="tsw-eti tsw-noche" aria-hidden="true">Noche</span></button>'+
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
  var foot='<footer class="ft"><div class="wrap-wide"><div class="ft-top">'+
    '<div class="ft-brand"><a class="ft-logo" href="'+pre+'index.html"><img src="'+pre+'assets/img/marca/logo-blanco-est.svg" alt="Oceanic, est. 1994" width="170" height="47"></a><p>Representamos y vendemos marcas de referencia mundial en Chile. Desde 1994.</p></div>'+
    '<div class="ft-cols">'+
    UNIVERSOS.map(function(u){return '<div><span class="eyebrow">'+esc(u.nombre)+'</span>'+enlaces(u,false)+'</div>';}).join('')+
    '<div><span class="eyebrow">Explorar</span><a href="'+pre+'usados/index.html">Usados</a><a href="'+pre+'equipamiento/index.html">Equipamiento</a><a href="'+pre+'arriendo-boyas/index.html">Arriendo de boyas</a><a href="'+pre+'puerto/index.html">Puerto</a></div>'+
    '<div><span class="eyebrow">Contacto</span><a href="'+pre+'contacto/index.html">Conversemos</a><a href="mailto:ventas@oceanic.cl">ventas@oceanic.cl</a>'+REDES.map(function(r){return '<a href="'+r[1]+'" target="_blank" rel="noopener">'+r[0]+'</a>';}).join('')+'</div>'+
    '</div></div><div class="ft-base"><span>&copy; 2026 Oceanic. Todos los derechos reservados.</span><span><a href="'+pre+'privacidad/index.html">Política de privacidad</a> · <a href="'+pre+'terminos/index.html">Términos y condiciones</a> · <a href="#" data-cookies>Preferencias de cookies</a> · Santiago · Chile</span></div></div></footer>';
  var f=document.getElementById('foot'); if(f) f.outerHTML=foot;

  // ---------- modo oscuro: automático según el sistema; el botón lo fija y se recuerda ----------
  var html=document.documentElement, mq=window.matchMedia('(prefers-color-scheme: dark)');
  function oscuro(){ var t=html.getAttribute('data-tema'); return t ? t==='oscuro' : mq.matches; }
  function pintarTema(){ var b=document.getElementById('temaBtn'); if(!b) return; var o=oscuro();
    b.classList.toggle('es-oscuro',o); b.setAttribute('aria-checked',o?'true':'false');
    b.setAttribute('data-modo',o?'Navegación nocturna':'Navegación de día'); b.title=o?'Navegación nocturna · cambiar a día':'Navegación de día · cambiar a nocturna'; }  // interruptor: apagado = modo claro, encendido = modo oscuro
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

  // ---------- cookies y medición (Ley 21.719) ----------
  // Google Analytics 4, Google Tag Manager y Meta Pixel se configuran en el administrador (Seguimiento → assets/js/seguimiento-data.js).
  // Sin ninguno: aviso informativo (el sitio no usa cookies de seguimiento). Con alguno: banner de consentimiento; no se carga nada
  // hasta que la persona acepta, y rechazar o no responder deja todo apagado. La elección se puede cambiar desde «Preferencias de
  // cookies» en el pie. Si cambia lo que se mide, se vuelve a preguntar.
  var SEG = { ga4: '', gtm: '', pixel: '' }, FIRMA = '';
  function configurar(c){
    c = c || {};
    var g = String(c.ga4 || '').trim(), t = String(c.gtm || '').trim(), p = String(c.meta_pixel || '').trim();
    SEG = { ga4: /^G-[A-Z0-9]{6,14}$/.test(g) ? g : '', gtm: /^GTM-[A-Z0-9]{4,12}$/.test(t) ? t : '', pixel: /^\d{10,20}$/.test(p) ? p : '' };
    FIRMA = [SEG.ga4 && 'ga', SEG.gtm && 'gtm', SEG.pixel && 'fb'].filter(Boolean).join('+');
  }
  function hayMedicion(){ return !!FIRMA; }
  var CLAVE_C = 'oceanic-consentimiento', VERSION_C = '2026-11';
  function leerC(){ try{ var v=JSON.parse(localStorage.getItem(CLAVE_C)||'null'); return v&&v.v===VERSION_C&&(v.f||'')===FIRMA?v:null; }catch(e){ return null; } }
  function guardarC(ok){ try{ localStorage.setItem(CLAVE_C, JSON.stringify({v:VERSION_C, f:FIRMA, analitica:!!ok, fecha:new Date().toISOString().slice(0,10)})); }catch(e){} }
  function script(src){ var sc=document.createElement('script'); sc.async=true; sc.src=src; document.head.appendChild(sc); }
  function cargarMedicion(){
    if (!hayMedicion() || window.__medicion) return; window.__medicion = true;
    window.dataLayer = window.dataLayer || []; window.gtag = function(){ dataLayer.push(arguments); };
    // la persona ya aceptó la medición: analítica sí; publicidad de Google (ad_*) sigue denegada
    gtag('consent', 'default', { ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'granted' });
    if (SEG.ga4) { gtag('js', new Date()); gtag('config', SEG.ga4, { anonymize_ip: true }); script('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(SEG.ga4)); }
    if (SEG.gtm) { dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' }); script('https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(SEG.gtm)); }
    if (SEG.pixel) {
      var f = window.fbq = function(){ f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
      if (!window._fbq) window._fbq = f; f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
      script('https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', SEG.pixel); fbq('track', 'PageView');
    }
    eventos();
  }
  // eventos de conversión: cotización enviada (página de gracias) y ficha de un modelo
  function eventos(){
    var ruta = location.pathname, q = new URLSearchParams(location.search);
    if (/\/gracias\//.test(ruta)) {
      if (SEG.ga4 || SEG.gtm) gtag('event', 'generate_lead');
      if (SEG.pixel) fbq('track', 'Lead');
    } else if (/\/marca\//.test(ruta) && q.get('modelo')) {
      setTimeout(function(){
        var h = document.querySelector('h1'), n = (h && h.textContent || document.title).replace(/\s+/g,' ').trim();
        if (SEG.ga4 || SEG.gtm) gtag('event', 'view_item', { items: [{ item_id: q.get('modelo'), item_name: n }] });
        if (SEG.pixel) fbq('track', 'ViewContent', { content_name: n, content_ids: [q.get('modelo')], content_type: 'product' });
      }, 1500);
    }
  }
  function borrarMedicion(){  // al retirar el consentimiento: borra las cookies de medición de este dominio
    document.cookie.split(';').forEach(function(c){ var n=c.split('=')[0].trim(); if(/^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/.test(n)){
      var d=location.hostname.split('.'); for(var k=0;k<d.length;k++){ document.cookie=n+'=; Max-Age=0; path=/; domain=.'+d.slice(k).join('.'); } document.cookie=n+'=; Max-Age=0; path=/'; } });
  }
  function banner(){
    var prev=document.querySelector('.aviso-priv'); if(prev) prev.remove();
    var a=document.createElement('div'); a.className='aviso-priv'; a.setAttribute('role','region'); a.setAttribute('aria-label','Cookies y privacidad');
    if (hayMedicion()) {
      var quienes = [(SEG.ga4 || SEG.gtm) ? 'Google Analytics' : '', SEG.pixel ? 'Meta, para Facebook e Instagram' : ''].filter(Boolean).join(' y ');
      a.innerHTML='<p>Usamos cookies de medición ('+quienes+') para saber cómo se usa el sitio, mejorarlo y medir nuestras campañas. Solo se activan si las aceptas. '+
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
      else { guardarC(c==='si'); if(c==='si') cargarMedicion(); else borrarMedicion(); }
      a.remove(); });
    document.body.appendChild(a);
  }
  window.OCEANIC_COOKIES = banner;  // «Preferencias de cookies» del pie
  function arrancarCookies(){
    setTimeout(function(){
      if (/privacidad\/|terminos\//.test(location.pathname)) return;
      if (hayMedicion()) { var c=leerC(); if(c){ if(c.analitica) cargarMedicion(); } else banner(); return; }
      var visto=false; try{ visto=localStorage.getItem('oceanic-aviso')==='2026-11'; }catch(e){}
      if(!visto) banner();
    },400);
  }
  // la configuración la publica el administrador (assets/js/seguimiento-data.js); si no carga, el sitio sigue sin medición
  (function(){
    if (window.OCEANIC_SEGUIMIENTO) { configurar(window.OCEANIC_SEGUIMIENTO); return arrancarCookies(); }
    var hecho=false; function listo(){ if(hecho) return; hecho=true; configurar(window.OCEANIC_SEGUIMIENTO); arrancarCookies(); }
    var sc=document.createElement('script'); sc.src=pre+'assets/js/seguimiento-data.js'; sc.onload=listo; sc.onerror=listo; document.head.appendChild(sc);
    setTimeout(listo,2500);
  })();
  document.addEventListener('click',function(e){ var l=e.target.closest&&e.target.closest('[data-cookies]'); if(l){ e.preventDefault(); banner(); } });

  // menú móvil: un solo control para todo el sitio (los scripts de cada página ya no agregan el suyo)
  window.OCEANIC_MENU=true;
  (function(){
    var bt=document.getElementById('burger'), d=document.getElementById('drawer'), bar=document.querySelector('.bar');
    if(!bt||!d) return;
    function abrir(si){
      if(si){ d.style.top=Math.max(0,Math.round(bar?bar.getBoundingClientRect().bottom:52))+'px'; d.removeAttribute('hidden'); }
      else d.setAttribute('hidden','');
      document.body.classList.toggle('locked',si); bt.classList.toggle('on',si); bt.setAttribute('aria-expanded',si?'true':'false');
    }
    bt.addEventListener('click',function(){ abrir(d.hasAttribute('hidden')); });
    d.addEventListener('click',function(e){ if(e.target.closest('a')) abrir(false); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!d.hasAttribute('hidden')) abrir(false); });
  })();
  // Eventos: pop-ups de invitación administrados en el CMS (eventos-data.js). El código del pop-up solo se descarga si hay uno activo.
  if(!document.querySelector('script[src*="eventos.js"]')){
    var sd=document.createElement('script'); sd.src=pre+'assets/js/eventos-data.js'; sd.async=true;
    sd.onload=function(){ var ps=(window.OCEANIC_EVENTOS||{}).popups||[];
      if(ps.some(function(x){return x&&x.activo;})){ var se=document.createElement('script'); se.src=pre+'assets/js/eventos.js'; se.async=true; document.body.appendChild(se); } };
    document.body.appendChild(sd);
  }
})();
