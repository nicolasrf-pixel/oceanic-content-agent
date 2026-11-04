/* OCEANIC, Nav + footer compartidos (menú por marca, elegante).
   Usa data-asset-base del body para resolver rutas; prefijo calculado por profundidad. */
(function(){
  var AB=document.body.dataset.assetBase||'assets/img/';
  var pre=AB.replace('assets/img/',''); // '../' según profundidad

  // marcas por universo, cada una a su página /marca/?m=slug
  var MARCAS={
    'Vela':[['beneteau&u=vela','Beneteau'],['solaris','Solaris'],['saffier','Saffier'],['lagoon','Lagoon'],['excess','Excess'],['aquila&u=vela','Aquila Sail']],
    'Motor':[['axopar','Axopar'],['beneteau&u=motor','Beneteau Motor'],['xo','XO Boats'],['aquila&u=motor','Aquila'],['oceanic-power','Oceanic Power']],
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
    '<a href="'+pre+'index.html" class="bar-brand">OCEANIC<i></i></a>'+
    '<nav class="nav" aria-label="Principal">'+drop+
    items.map(function(x){return '<a href="'+x[1]+'" class="nav-a">'+x[0]+'</a>';}).join('')+
    '</nav><div class="bar-act">'+
    '<a href="https://wa.me/56229537322?text=Hola%20Oceanic%2C%20quiero%20hablar%20con%20un%20especialista." target="_blank" rel="noopener" class="btn">Habla con un especialista</a>'+
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
    '<div class="ft-brand"><span class="ft-logo">OCEANIC<i></i></span><p>Representamos y vendemos marcas de referencia mundial en Chile. Desde 1994.</p></div>'+
    '<div class="ft-cols">'+
    '<div><span class="eyebrow">Vela</span>'+MARCAS.Vela.map(function(x){return '<a href="'+marcaHref(x[0])+'">'+x[1]+'</a>';}).join('')+'</div>'+
    '<div><span class="eyebrow">Motor</span>'+MARCAS.Motor.map(function(x){return '<a href="'+marcaHref(x[0])+'">'+x[1]+'</a>';}).join('')+'</div>'+
    '<div><span class="eyebrow">Explorar</span><a href="'+pre+'usados/index.html">Usados</a><a href="'+pre+'equipamiento/index.html">Equipamiento</a><a href="'+pre+'puerto/index.html">Puerto</a></div>'+
    '<div><span class="eyebrow">Contacto</span><a href="'+pre+'contacto/index.html">Conversemos</a><a href="mailto:ventas@oceanic.cl">ventas@oceanic.cl</a></div>'+
    '</div></div><div class="ft-base"><span>&copy; 2026 Oceanic. Todos los derechos reservados.</span><span>Santiago · Chile</span></div></div></footer>';
  var f=document.getElementById('foot'); if(f) f.outerHTML=foot;

  // burger
  setTimeout(function(){
    var bt=document.getElementById('burger'), d=document.getElementById('drawer');
    if(bt&&d){bt.addEventListener('click',function(){var o=d.hasAttribute('hidden');if(o){d.removeAttribute('hidden');document.body.classList.add('locked');}else{d.setAttribute('hidden','');document.body.classList.remove('locked');}bt.classList.toggle('on',o);});
      d.addEventListener('click',function(e){if(e.target.tagName==='A'){d.setAttribute('hidden','');document.body.classList.remove('locked');bt.classList.remove('on');}});}
  },50);
})();
