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

  var items=[
    ['Usados',pre+'usados/index.html'],['Equipamiento',pre+'equipamiento/index.html'],
    ['Charter',pre+'charter/index.html'],['Puerto',pre+'puerto/index.html'],['Oceanic',pre+'nosotros/index.html']
  ];
  var nav='<div class="bar"><div class="bar-in">'+
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
  var foot='<footer class="ft"><div class="wrap-wide"><div class="ft-top">'+
    '<div class="ft-brand"><a class="ft-logo" href="'+pre+'index.html"><img src="'+pre+'assets/img/marca/logo-blanco-est.svg" alt="Oceanic, est. 1994" width="170" height="47"></a><p>Representamos y vendemos marcas de referencia mundial en Chile. Desde 1994.</p></div>'+
    '<div class="ft-cols">'+
    '<div><span class="eyebrow">Vela</span>'+MARCAS.Vela.map(function(x){return '<a href="'+marcaHref(x[0])+'">'+x[1]+'</a>';}).join('')+'</div>'+
    '<div><span class="eyebrow">Motor</span>'+MARCAS.Motor.map(function(x){return '<a href="'+marcaHref(x[0])+'">'+x[1]+'</a>';}).join('')+'</div>'+
    '<div><span class="eyebrow">Explorar</span><a href="'+pre+'usados/index.html">Usados</a><a href="'+pre+'equipamiento/index.html">Equipamiento</a><a href="'+pre+'puerto/index.html">Puerto</a></div>'+
    '<div><span class="eyebrow">Contacto</span><a href="'+pre+'contacto/index.html">Conversemos</a><a href="mailto:ventas@oceanic.cl">ventas@oceanic.cl</a></div>'+
    '</div></div><div class="ft-base"><span>&copy; 2026 Oceanic. Todos los derechos reservados.</span><span><a href="'+pre+'privacidad/index.html">Política de privacidad</a> · Santiago · Chile</span></div></div></footer>';
  var f=document.getElementById('foot'); if(f) f.outerHTML=foot;

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

  // ---------- aviso de privacidad (Ley 21.719): informativo, el sitio no usa cookies de seguimiento ----------
  setTimeout(function(){
    var visto=false; try{ visto=localStorage.getItem('oceanic-aviso')==='2026-11'; }catch(e){}
    if(visto||/privacidad\//.test(location.pathname)) return;
    var a=document.createElement('div'); a.className='aviso-priv'; a.setAttribute('role','region'); a.setAttribute('aria-label','Aviso de privacidad');
    a.innerHTML='<p>Este sitio no usa cookies de seguimiento ni publicidad. Solo guardamos en tu navegador tus preferencias, como el modo oscuro. '+
      'Los datos que nos envías por formularios se tratan según nuestra <a href="'+pre+'privacidad/index.html">política de privacidad</a>.</p>'+
      '<button type="button" class="btn">Entendido</button>';
    a.querySelector('button').addEventListener('click',function(){ try{ localStorage.setItem('oceanic-aviso','2026-11'); }catch(e){} a.remove(); });
    document.body.appendChild(a);
  },400);

  // burger
  setTimeout(function(){
    var bt=document.getElementById('burger'), d=document.getElementById('drawer');
    if(bt&&d){bt.addEventListener('click',function(){var o=d.hasAttribute('hidden');if(o){d.removeAttribute('hidden');document.body.classList.add('locked');}else{d.setAttribute('hidden','');document.body.classList.remove('locked');}bt.classList.toggle('on',o);});
      d.addEventListener('click',function(e){if(e.target.tagName==='A'){d.setAttribute('hidden','');document.body.classList.remove('locked');bt.classList.remove('on');}});}
  },50);
})();
