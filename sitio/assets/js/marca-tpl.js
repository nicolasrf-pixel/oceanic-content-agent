/* OCEANIC, Página de marca (lee ?m=slug). Hero + gama real + CTA. */
(function(){
  // si hay ?modelo=, la ficha la pinta OCEANIC_RENDER_MODELO (IIFE final); no renderizamos la gama
  if(new URLSearchParams(location.search).get('modelo')) return;
  var C=window.OCEANIC_CATALOGO, M=window.OCEANIC_MARCAS;
  var AB=document.body.dataset.assetBase||'../assets/img/';
  var cont=document.getElementById('marca'); if(!C||!M||!cont) return;
  var slug=new URLSearchParams(location.search).get('m')||'beneteau';
  var info=M[slug], cat=C[slug];
  // Marcas con vela y motor (Beneteau, Aquila…): ?u=vela|motor muestra solo esa línea, con su nombre e imagen
  var linea=new URLSearchParams(location.search).get('u');
  if(info&&cat&&info.lineas&&info.lineas[linea]){
    info=Object.assign({},info,info.lineas[linea]);
    cat={nombre:cat.nombre,modelos:cat.modelos.filter(function(m){return familia(m.tipo)===linea;})};
  }
  if(!info||!cat){ cont.innerHTML='<section class="cat-hero"><div class="wrap-wide"><h1 class="cat-h1">Marca no encontrada</h1><p class="cat-sub"><a href="../index.html" style="color:var(--boya)">Volver al inicio</a></p></div></section>'; return; }
  document.title=info.nombre+' en Chile | Oceanic';

  var wa='https://wa.me/56229537322?text='+encodeURIComponent('Hola Oceanic, quiero información de '+info.nombre+'.');
  var mailto='mailto:ventas@oceanic.cl?subject='+encodeURIComponent('Consulta '+info.nombre)+'&body='+encodeURIComponent('Hola Oceanic, quiero información de la marca '+info.nombre+'.');

  // hero
  var heroImg=/^(https?:)?\/\/|^\//.test(info.hero)?info.hero:AB+info.hero+(/\.\w{3,4}$/.test(info.hero)?'':'.webp');
  var hero='<header class="mk-hero" style="background-image:linear-gradient(to top,rgba(20,33,43,.92),rgba(20,33,43,.35)),url('+heroImg+')">'+
    '<div class="wrap-wide">'+
    '<nav class="crumb"><a href="../index.html">Oceanic</a><span>·</span><span>'+info.universo+'</span></nav>'+
    '<p class="mk-eyebrow">Representación oficial en Chile · '+info.pais+'</p>'+
    '<h1 class="mk-h1">'+info.nombre+'</h1>'+
    '<p class="mk-claim">'+info.claim+'</p>'+
    '<p class="mk-intro">'+info.intro+'</p>'+
    '<div class="mk-cta"><a href="'+wa+'" target="_blank" rel="noopener" class="btn">Habla con un especialista</a>'+
    '<a href="#gama" class="btn btn-line">Ver la gama</a></div>'+
    '</div></header>';

  // bloque editorial de marca (texto real de la web oficial)
  var CB=(window.OCEANIC_MARCA_CONTENIDO||{})[slug], relato='';
  if(CB){
    var dest=(CB.destacados||[]).map(function(d){
      return '<div class="mk-rel-fig"><b>'+d[0]+'</b><span>'+d[1]+'</span></div>';
    }).join('');
    relato='<section class="mk-rel"><div class="wrap-wide mk-rel-grid">'+
      '<div class="mk-rel-head"><span class="eyebrow">'+(CB.kicker||'La marca')+'</span>'+
        '<h2 class="mk-rel-h2">'+CB.titulo+'</h2></div>'+
      '<div class="mk-rel-body">'+
        (CB.lede?'<p class="mk-rel-lede">'+CB.lede+'</p>':'')+
        (CB.parrafos||[]).map(function(p){return '<p>'+p+'</p>';}).join('')+
        (dest?'<div class="mk-rel-figs">'+dest+'</div>':'')+
      '</div></div></section>';
  }

  // gama, agrupada por familia (Vela / Motor / Eléctrico) cuando hay más de una
  function familia(t){
    t=(t||'').toLowerCase();
    if(t.indexOf('electric')>=0||t.indexOf('eléctric')>=0) return 'electrico';
    if(t.indexOf('vela')>=0) return 'vela';
    return 'motor';
  }
  function tarjeta(m){  // tarjeta de modelo: foto completa del barco, nombre, eslora y botón
    var href='index.html?m='+slug+'&modelo='+m.slug, f=m.tarjeta||m.hero;
    var foto=f?'<div class="mcard-img"><img src="'+(/^(https?:)?\/\/|^\//.test(f)?f:AB+f)+'" alt="'+m.nombre+'" loading="lazy" onerror="this.closest(\'.mcard-img\').remove()"></div>':'';
    return '<a class="mcard" href="'+href+'">'+foto+'<div class="mcard-body"><h3>'+m.nombre+'</h3>'+
      (m.eslora?'<span class="mcard-eslora">Eslora '+m.eslora+'</span>':'')+'<span class="mcard-cta">Ver modelo</span></div></a>';
  }
  // ordenar familias presentes
  var FAM={vela:{t:'Vela',sub:'Monocascos y catamaranes a vela.'},
           motor:{t:'Motor',sub:'Del day cruiser al yate a motor.'},
           electrico:{t:'Eléctricos',sub:'Propulsión eléctrica, cero emisiones.'}};
  var grupos={}; cat.modelos.forEach(function(m){ (grupos[familia(m.tipo)]=grupos[familia(m.tipo)]||[]).push(m); });
  // subtítulo según lo que la marca realmente tiene (Beneteau vela: solo monocascos; Lagoon: solo catamaranes)
  function sub(f,lista){
    var cata=lista.some(function(m){return /catamaran/.test(m.tipo);}), mono=lista.some(function(m){return !/catamaran/.test(m.tipo);});
    if(f==='vela') return cata&&mono?'Monocascos y catamaranes a vela.':cata?'Catamaranes a vela.':'Monocascos a vela.';
    if(f==='motor') return cata&&!mono?'Catamaranes a motor.':cata?'Lanchas, yates y catamaranes a motor.':FAM.motor.sub;
    return FAM[f].sub;
  }
  var orden=['vela','motor','electrico'].filter(function(f){return grupos[f]&&grupos[f].length;});
  var variasFamilias=orden.length>1;

  var bloques=orden.map(function(f){
    var lista=grupos[f];
    var titulo=variasFamilias
      ? '<div class="mk-fam-head"><h3 class="mk-fam-h">'+FAM[f].t+'</h3><span class="mk-fam-sub">'+sub(f,lista)+'</span><span class="mk-fam-n">'+lista.length+(lista.length===1?' modelo':' modelos')+'</span></div>'
      : '';
    return '<div class="mk-fam" id="gama-'+f+'">'+titulo+'<div class="mk-grid">'+lista.map(tarjeta).join('')+'</div></div>';
  }).join('');

  var introGama=variasFamilias
    ? cat.modelos.length+' modelos: '+orden.map(function(f){return FAM[f].t.toLowerCase();}).join(' y ')+'. Cada uno se configura y se encarga a medida: especificamos contigo, seguimos la fabricación y lo entregamos nacionalizado en Chile.'
    : cat.modelos.length+' modelos. Cada uno se configura y se encarga a medida: especificamos contigo, seguimos la fabricación y lo entregamos nacionalizado en Chile.';

  var gama='<section class="mk-gama" id="gama"><div class="wrap-wide">'+
    '<div class="sec-head"><span class="eyebrow">La gama</span><span class="rule"></span></div>'+
    '<h2 class="mk-gama-h2">Modelos '+info.nombre+'</h2>'+
    '<p class="lede mk-gama-lede">'+introGama+'</p>'+
    bloques+'</div></section>';

  // cierre
  var cierre='<section class="talk"><img class="talk-bg" src="'+AB+'talk.webp" alt="" loading="lazy" onerror="this.style.display=\'none\'">'+
    '<div class="wrap-wide"><div class="sec-head"><span class="eyebrow" style="color:var(--boya)">Conversemos</span></div>'+
    '<h2 class="talk-h">¿Te interesa<br>'+info.nombre+'?</h2>'+
    '<p class="lede talk-lede">Cuéntanos cómo navegas y te ayudamos a encontrar el modelo que corresponde. Precio, plazos y configuración.</p>'+
    '<div class="talk-cta"><a href="'+mailto+'" class="btn">Solicitar información</a>'+
    '<a href="'+wa+'" target="_blank" rel="noopener" class="btn btn-line">Escribir por WhatsApp</a></div></div></section>';

  cont.innerHTML=hero+relato+gama+cierre;

})();

/* La ficha de cada modelo (?m=marca&modelo=slug) la pinta assets/js/ficha-tpl.js */
