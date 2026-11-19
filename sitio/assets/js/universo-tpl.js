/* OCEANIC — Landing de universo (lee ?u=vela|motor|deportiva).
   Muestra las MARCAS de ese universo (no productos). Click en marca → su página de marca. */
(function(){
  var M=window.OCEANIC_MARCAS; var cont=document.getElementById('universo');
  if(!M||!cont) return;
  var AB=document.body.dataset.assetBase||'../assets/img/';
  var pre=AB.replace('assets/img/','');

  var RESPALDO={
    vela:{
      nombre:'Vela', hero:'u-vela.webp',
      kicker:'Universo Vela',
      lede:'Del day sailer al crucero de regata. Monocascos y catamaranes a vela de astilleros de referencia mundial.',
      marcas:['beneteau','solaris','saffier','lagoon','excess','aquila']
    },
    motor:{
      nombre:'Motor', hero:'u-motor.webp',
      kicker:'Universo Motor',
      lede:'Del semirrígido al yate. Lanchas, cruceros y catamaranes a motor para navegar todo el año.',
      marcas:['axopar','beneteau','xo','aquila','lagoon','oceanic-power']
    },
    deportiva:{
      nombre:'Vela deportiva', hero:'u-sport.webp',
      kicker:'Universo Vela deportiva',
      lede:'Monotipos y foilers de alto rendimiento. Para competir, para volar, para sentir el agua.',
      marcas:['vx-one','switch']
    }
  };

  // Universos del portafolio (CMS: /admin/ › Orden, categorías y marcas); si no están, la lista de respaldo de arriba.
  var U=RESPALDO, primero='vela', PF=window.OCEANIC_PORTAFOLIO;
  if(PF&&Array.isArray(PF.universos)){
    var mapa={}, orden=[];
    PF.universos.forEach(function(x){
      if(!x||x.visible===false||!/^[a-z0-9-]+$/.test(x.slug||'')||!x.nombre) return;
      mapa[x.slug]={nombre:x.nombre,hero:x.hero||'',kicker:x.kicker||('Universo '+x.nombre),lede:x.lede||'',marcas:x.marcas||[]}; orden.push(x.slug);
    });
    if(orden.length){ U=mapa; primero=orden[0]; }
  }
  function ruta(p){ return /^(https?:)?\/\/|^\//.test(p)?p:AB+p+(/\.\w{3,4}$/.test(p)?'':'.webp'); }

  var slug=new URLSearchParams(location.search).get('u')||primero;
  var u=Object.prototype.hasOwnProperty.call(U,slug)?U[slug]:null;
  if(!u){ cont.innerHTML='<section class="uni-hero"><div class="wrap-wide"><h1 class="uni-h1">Universo no encontrado</h1><p><a href="'+pre+'index.html#universos" style="color:var(--boya)">Ver los universos</a></p></div></section>'; return; }
  document.title=u.nombre+' — Oceanic';

  // cada marca del universo: {marca, linea} (el respaldo trae solo el nombre; la línea es la del universo si la marca la tiene)
  var entradas=(u.marcas||[]).map(function(x){
    return typeof x==='string'?{marca:x,linea:((M[x]||{}).lineas||{})[slug]?slug:''}:x;
  }).filter(function(x){ return x&&/^[a-z0-9-]+$/.test(x.marca||'')&&M[x.marca]; });
  function marcaHref(e){ return pre+'marca/index.html?m='+e.marca+(e.linea?'&u='+e.linea:''); }

  // hero
  var hero='<header class="uni-hero" style="background-image:linear-gradient(to top,rgba(20,33,43,.9),rgba(20,33,43,.35)),url('+(u.hero?ruta(u.hero):'')+')">'+
    '<div class="wrap-wide">'+
      '<nav class="crumb"><a href="'+pre+'index.html">Oceanic</a><span>·</span><a href="'+pre+'index.html#universos">Universos</a><span>·</span><span>'+u.nombre+'</span></nav>'+
      '<p class="uni-kicker">'+u.kicker+'</p>'+
      '<h1 class="uni-h1">'+u.nombre+'</h1>'+
      '<p class="uni-lede">'+u.lede+'</p>'+
    '</div></header>';

  // tarjetas de marca (no productos)
  var cards=entradas.map(function(e){
    var mk=e.marca, info=Object.assign({},M[mk],(M[mk].lineas||{})[e.linea]||{});  // línea vela / motor de la marca, si se eligió
    var etiqueta=info.nombre;
    var foto=ruta(info.hero);
    return '<a class="um" href="'+marcaHref(e)+'">'+
      '<span class="um-img"><img src="'+foto+'" alt="'+etiqueta+'" loading="lazy" onerror="this.style.opacity=0"></span>'+
      '<span class="um-body">'+
        '<span class="um-top"><span class="um-name">'+etiqueta+'</span><span class="um-pais">'+info.pais+'</span></span>'+
        (info.claim?'<span class="um-claim">'+info.claim+'</span>':'')+
        '<span class="um-cta">Ver la marca →</span>'+
      '</span></a>';
  }).join('');

  var grid='<section class="uni-marcas"><div class="wrap-wide">'+
    '<div class="sec-head"><span class="eyebrow">Marcas de '+u.nombre+'</span><span class="rule"></span></div>'+
    '<div class="um-grid">'+cards+'</div>'+
    '<p class="uni-foot"><a href="'+pre+'index.html#marcas">Ver todas las marcas →</a></p>'+
    '</div></section>';

  // cierre
  var wa='https://wa.me/56229537322?text='+encodeURIComponent('Hola Oceanic, quiero orientación sobre las marcas de '+u.nombre+'.');
  var cierre='<section class="talk"><img class="talk-bg" src="'+AB+'talk.webp" alt="" loading="lazy" onerror="this.style.display=\'none\'">'+
    '<div class="wrap-wide"><div class="sec-head"><span class="eyebrow" style="color:var(--boya)">Conversemos</span></div>'+
    '<h2 class="talk-h">¿No sabes cuál<br>es la tuya?</h2>'+
    '<p class="lede talk-lede">Cuéntanos cómo navegas y te ayudamos a encontrar la marca y el modelo que corresponden.</p>'+
    '<div class="talk-cta"><a href="'+wa+'" target="_blank" rel="noopener" class="btn">Hablar con un especialista</a>'+
    '<a href="'+pre+'index.html#universos" class="btn btn-line">Ver los otros universos</a></div></div></section>';

  cont.innerHTML=hero+grid+cierre;
})();
