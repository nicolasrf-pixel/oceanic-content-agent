/* OCEANIC, Página de marca (lee ?m=slug). Hero + gama real + CTA. */
(function(){
  // si hay ?modelo=, la ficha la pinta OCEANIC_RENDER_MODELO (IIFE final); no renderizamos la gama
  if(new URLSearchParams(location.search).get('modelo')) return;
  var C=window.OCEANIC_CATALOGO, M=window.OCEANIC_MARCAS;
  var AB=document.body.dataset.assetBase||'../assets/img/';
  var cont=document.getElementById('marca'); if(!C||!M||!cont) return;
  var slug=new URLSearchParams(location.search).get('m')||'beneteau';
  var info=M[slug], cat=C[slug];
  if(!info||!cat){ cont.innerHTML='<section class="cat-hero"><div class="wrap-wide"><h1 class="cat-h1">Marca no encontrada</h1><p class="cat-sub"><a href="../index.html" style="color:var(--boya)">Volver al inicio</a></p></div></section>'; return; }
  document.title=info.nombre+' en Chile | Oceanic';

  var wa='https://wa.me/56229537322?text='+encodeURIComponent('Hola Oceanic, quiero información de '+info.nombre+'.');
  var mailto='mailto:ventas@oceanic.cl?subject='+encodeURIComponent('Consulta '+info.nombre)+'&body='+encodeURIComponent('Hola Oceanic, quiero información de la marca '+info.nombre+'.');

  // hero
  var heroImg=AB+info.hero+'.webp';
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
  function tarjeta(m){
    var href='index.html?m='+slug+'&modelo='+m.slug;
    var meta=[]; if(m.eslora)meta.push(m.eslora); if(m.motor)meta.push(m.motor.replace(/Fueraborda,?\s*/i,'').slice(0,22));
    var foto=m.hero?'<div class="mkc-img"><img src="'+AB+m.hero+'" alt="'+m.nombre+'" loading="lazy" onerror="this.closest(\'.mkc-img\').remove()"></div>':'';
    return '<a class="mkc'+(m.hero?' mkc-foto':'')+'" href="'+href+'">'+foto+
      '<div class="mkc-body">'+(m.anio?'<div class="mkc-top"><span class="mkc-anio">'+m.anio+'</span></div>':'')+
      '<h3>'+m.nombre+'</h3>'+(meta.length?'<span class="mkc-meta">'+meta.join(' · ')+'</span>':'')+
      (m.desc?'<p>'+m.desc+'</p>':'')+'<span class="mkc-cta">Ver modelo →</span></div></a>';
  }
  // ordenar familias presentes
  var FAM={vela:{t:'Vela',sub:'Monocascos y catamaranes a vela.'},
           motor:{t:'Motor',sub:'Del day cruiser al yate a motor.'},
           electrico:{t:'Eléctricos',sub:'Propulsión eléctrica, cero emisiones.'}};
  var grupos={}; cat.modelos.forEach(function(m){ (grupos[familia(m.tipo)]=grupos[familia(m.tipo)]||[]).push(m); });
  var orden=['vela','motor','electrico'].filter(function(f){return grupos[f]&&grupos[f].length;});
  var variasFamilias=orden.length>1;

  var bloques=orden.map(function(f){
    var lista=grupos[f];
    var titulo=variasFamilias
      ? '<div class="mk-fam-head"><h3 class="mk-fam-h">'+FAM[f].t+'</h3><span class="mk-fam-sub">'+FAM[f].sub+'</span><span class="mk-fam-n">'+lista.length+(lista.length===1?' modelo':' modelos')+'</span></div>'
      : '';
    return '<div class="mk-fam" id="gama-'+f+'">'+titulo+'<div class="mk-grid">'+lista.map(tarjeta).join('')+'</div></div>';
  }).join('');

  var introGama=variasFamilias
    ? 'Vela y motor, cada modelo se configura y se encarga a medida: especificamos contigo, seguimos la fabricación y lo entregamos nacionalizado en Chile.'
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

/* ---- Ficha de modelo rica (invocada con ?m=marca&modelo=slug) ---- */
window.OCEANIC_RENDER_MODELO=function(marca,mslug){
  var C=window.OCEANIC_CATALOGO, M=window.OCEANIC_MARCAS;
  var AB=document.body.dataset.assetBase||'../assets/img/';
  var cont=document.getElementById('marca');
  var cat=C[marca], info=M[marca];
  var mo=cat&&cat.modelos.filter(function(x){return x.slug===mslug;})[0];
  if(!mo){ return; }
  document.title=mo.nombre+', '+info.nombre+' | Oceanic';

  var wa='https://wa.me/56229537322?text='+encodeURIComponent('Hola Oceanic, quiero cotizar el '+mo.nombre+' ('+info.nombre+').');
  var hrefModelo=(marca==='axopar'&&mslug==='axopar-37-xc-cross-cabin')?'../marcas/axopar/axopar-37-xc/index.html':('index.html?m='+marca+'&modelo='+mslug);
  // botón de cotización de este barco (abre el modal del cotizador)
  function attr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function cotBtn(txt,cls){
    var specs=attr(JSON.stringify((mo.specs||[]).slice(0,4).map(function(s){return {label:s.label,value:s.value};})));
    return '<button type="button" class="'+(cls||'btn')+'" data-cotizar'+
      ' data-modelo="'+attr(mo.nombre)+'"'+
      ' data-marca="'+attr(info.nombre)+'"'+
      ' data-href="'+attr(hrefModelo)+'"'+
      ' data-wa="'+attr(wa)+'"'+
      ' data-specs="'+specs+'">'+txt+'</button>';
  }

  var heroImg=mo.hero?(AB+mo.hero):(AB+info.hero+'.webp');
  function famLabel(t){t=(t||'').toLowerCase();
    if(t.indexOf('electric')>=0||t.indexOf('eléctric')>=0)return 'Eléctrico';
    if(t.indexOf('catamaran')>=0)return t.indexOf('vela')>=0?'Catamarán a vela':'Catamarán a motor';
    if(t.indexOf('vela')>=0)return 'Vela'; return 'Motor';}
  var meta=[]; if(mo.eslora)meta.push(mo.eslora); if(mo.tipo)meta.push(famLabel(mo.tipo)); if(mo.anio)meta.push(mo.anio);

  var hero='<header class="md2-hero" style="background-image:linear-gradient(to top,rgba(20,33,43,.93),rgba(20,33,43,.3)),url('+heroImg+')">'+
    '<div class="wrap-wide"><nav class="crumb"><a href="../index.html">Oceanic</a><span>·</span><a href="index.html?m='+marca+'">'+info.nombre+'</a><span>·</span><span>'+mo.nombre+'</span></nav>'+
    '<span class="md2-marca">'+info.nombre+'</span><h1 class="md2-h1">'+mo.nombre+'</h1>'+
    (meta.length?'<span class="md2-meta">'+meta.join('  ·  ')+'</span>':'')+
    '<div class="md2-cta">'+cotBtn('Solicitar cotización','btn')+
    '<a href="'+wa+'" target="_blank" rel="noopener" class="btn btn-line">Cotizar por WhatsApp</a></div></div></header>';

  var intro=(mo.desc_larga||mo.desc)?'<section class="md2-intro"><div class="wrap"><p class="lede">'+(mo.desc_larga||mo.desc)+'</p></div></section>':'';

  // ---- contenido completo del repo (secciones + equipamiento + galería por categoría) ----
  var CC=(window.OCEANIC_CONTENIDO||{})[marca+'/'+mslug]||{};
  var galCat=CC.galeria||{};            // {categoria:[local,...]}
  var usadas={};                        // fotos ya usadas en secciones
  function tomarFoto(cats){
    for(var i=0;i<cats.length;i++){
      var arr=galCat[cats[i]];
      if(arr){ for(var j=0;j<arr.length;j++){ if(!usadas[arr[j]]){ usadas[arr[j]]=1; return arr[j]; } } }
    }
    return null;
  }
  // mapa sección -> categorías de imagen preferidas
  var IMGPREF={
    'Diseño':['Exterior','Detalle','Navegando'],
    'Ingeniería':['Timonera','Detalle','Navegando'],
    'A bordo':['Interior','Camarotes','Cubierta'],
    'Rendimiento':['Navegando','Exterior']
  };

  var secciones='';
  if(CC.secciones && CC.secciones.length){
    secciones=CC.secciones.filter(function(s){return s.t!=='Introducción';}).map(function(s,idx){
      var foto=tomarFoto(IMGPREF[s.t]||['Exterior','Interior','Detalle']);
      var txt='<div class="md2-sec-txt"><span class="eyebrow">'+s.t+'</span>'+
        s.p.map(function(p){return '<p>'+p+'</p>';}).join('')+'</div>';
      var img=foto?'<div class="md2-sec-img"><img src="'+AB+foto+'" alt="'+mo.nombre+' · '+s.t+'" loading="lazy" onerror="this.closest(\'.md2-sec\').classList.add(\'md2-sec-noimg\')"></div>':'';
      return '<div class="md2-sec'+(idx%2?' md2-sec-alt':'')+(foto?'':' md2-sec-noimg')+'">'+txt+img+'</div>';
    }).join('');
    if(secciones) secciones='<section class="md2-secs"><div class="wrap-wide">'+secciones+'</div></section>';
  }

  // galería completa por categoría (todas las fotos, no solo las de catalogo-data)
  var gal='';
  var todasFotos=[];
  var ORDEN_CAT=['Exterior','Navegando','Cubierta','Timonera','Interior','Camarotes','Detalle','Galería'];
  ORDEN_CAT.forEach(function(c){ if(galCat[c]) galCat[c].forEach(function(f){ if(todasFotos.indexOf(f)<0) todasFotos.push(f); }); });
  // fallback a la galería básica si no hay contenido extendido
  if(!todasFotos.length && mo.galeria) todasFotos=mo.galeria.slice();
  if(todasFotos.length){
    gal='<section class="md2-gal"><div class="wrap-wide"><div class="sec-head"><span class="eyebrow">Galería</span><span class="rule"></span></div><div class="md2-gal-grid">'+
      todasFotos.slice(0,12).map(function(g,i){return '<div class="md2-gal-item'+(i===0?' md2-gal-lg':'')+'"><img src="'+AB+g+'" alt="'+mo.nombre+'" loading="lazy" onerror="this.closest(\'.md2-gal-item\').style.display=\'none\'"></div>';}).join('')+
      '</div></div></section>';
  }

  // equipamiento de serie (solo marcas con lista en español)
  var equip='';
  if(CC.equipamiento && CC.equipamiento.length){
    var bloques=CC.equipamiento.map(function(c){
      return '<div class="md2-eq-cat"><h3>'+c.cat+'</h3><ul>'+
        c.items.map(function(it){return '<li>'+it+'</li>';}).join('')+'</ul></div>';
    }).join('');
    equip='<section class="md2-eq"><div class="wrap-wide"><div class="sec-head"><span class="eyebrow">Equipamiento de serie</span><span class="rule"></span></div>'+
      '<div class="md2-eq-grid">'+bloques+'</div>'+
      '<p class="md2-fuente">Equipamiento estándar según la ficha oficial de '+info.nombre+'. El equipamiento opcional se cotiza aparte.</p></div></section>';
  }

  var ficha='';
  if(mo.specs&&mo.specs.length){
    var mid=Math.ceil(mo.specs.length/2);
    function cols(a){return a.map(function(s){return '<div class="sp"><span>'+s.label+'</span><span>'+s.value+(s.note?' <i>'+s.note+'</i>':'')+'</span></div>';}).join('');}
    ficha='<section class="md2-spec"><div class="wrap-wide"><div class="sec-head"><span class="eyebrow">Ficha técnica</span><span class="rule"></span></div>'+
      '<div class="md2-spec-grid"><div>'+cols(mo.specs.slice(0,mid))+'</div><div>'+cols(mo.specs.slice(mid))+'</div></div>'+
      '<p class="md2-fuente">Especificaciones según la ficha oficial de '+info.nombre+'. Los valores finales pueden variar según configuración y motorización.</p></div></section>';
  }

  var cierre='<section class="talk"><img class="talk-bg" src="'+AB+'talk.webp" alt="" loading="lazy" onerror="this.style.display=\'none\'">'+
    '<div class="wrap-wide"><div class="sec-head"><span class="eyebrow" style="color:var(--boya)">Conversemos</span></div>'+
    '<h2 class="talk-h">¿Te interesa<br>este modelo?</h2>'+
    '<p class="lede talk-lede">Te preparamos una propuesta con precio, configuración y plazos. Por correo o directo por WhatsApp.</p>'+
    '<div class="talk-cta">'+cotBtn('Solicitar cotización','btn')+
    '<a href="'+wa+'" target="_blank" rel="noopener" class="btn btn-line">Cotizar por WhatsApp</a>'+
    '<a href="index.html?m='+marca+'" class="btn btn-line">Ver toda la gama '+info.nombre+'</a></div></div></section>';

  cont.innerHTML=hero+intro+secciones+gal+equip+ficha+cierre;
  window.scrollTo(0,0);

  // resiliencia de imágenes: si una galería/sección se queda sin fotos (no descargadas),
  // ocultar el contenedor para no dejar huecos vacíos.
  function ocultarSiVacio(){
    var g=cont.querySelector('.md2-gal');
    if(g){ var vis=[].filter.call(g.querySelectorAll('.md2-gal-item'),function(i){return i.style.display!=='none';});
      if(!vis.length) g.style.display='none'; }
  }
  [].forEach.call(cont.querySelectorAll('.md2-gal-item img, .md2-sec-img img'),function(im){
    im.addEventListener('error',ocultarSiVacio);
    if(im.complete && im.naturalWidth===0){ var it=im.closest('.md2-gal-item'); if(it) it.style.display='none'; var se=im.closest('.md2-sec'); if(se) se.classList.add('md2-sec-noimg'); }
  });
  setTimeout(ocultarSiVacio,1200);
};

/* al cargar: si hay ?modelo=, muestra la ficha en vez de la gama */
(function(){
  var mslug=new URLSearchParams(location.search).get('modelo');
  var marca=new URLSearchParams(location.search).get('m')||'beneteau';
  if(mslug && window.OCEANIC_RENDER_MODELO){ window.OCEANIC_RENDER_MODELO(marca,mslug); }
})();
