/* OCEANIC, Asistente guiado. Cerrado por defecto.
   Flujo: tipo de atención → (marca → barco) → enviar por WhatsApp.
   Sin servidor: arma el mensaje y abre WhatsApp a +56 2 2953 7322. */
(function(){
  var C=window.OCEANIC_CATALOGO||{};
  var WA='56229537322';
  var base=document.body.dataset.assetBase||''; var pre=base.replace('assets/img/','');

  // orden de marcas para el selector (las que tienen página)
  var ORDEN=['axopar','beneteau','lagoon','solaris','saffier','aquila','xo','excess','vx-one','switch','oceanic-power'];
  function nombreMarca(mk){ return (C[mk]&&C[mk].nombre)||mk; }
  function modelosDe(mk){ return (C[mk]&&C[mk].modelos)||[]; }
  function marcaHref(mk){ return mk==='axopar'?pre+'marcas/axopar/index.html':pre+'marca/index.html?m='+mk; }
  function modeloHref(mk,slug){
    return pre+'marca/index.html?m='+mk+'&modelo='+slug;
  }
  function wa(msg){ return 'https://wa.me/'+WA+'?text='+encodeURIComponent(msg); }

  // ---------- UI ----------
  var btn=document.createElement('button');
  btn.className='asis-btn'; btn.setAttribute('aria-label','Hablar con Oceanic');
  btn.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3C7 3 3 6.6 3 11c0 2.2 1 4.2 2.7 5.6L5 21l4.3-1.4c.86.2 1.76.3 2.7.3 5 0 9-3.6 9-8s-4-8.9-9-8.9Z"/></svg><span>¿Conversamos?</span>';

  var panel=document.createElement('div'); panel.className='asis-panel'; panel.hidden=true;
  panel.setAttribute('role','dialog'); panel.setAttribute('aria-label','Asistente Oceanic');
  panel.innerHTML=
    '<div class="asis-head"><div class="asis-head-t"><b>Oceanic</b><span>Te orientamos en un minuto</span></div>'+
      '<button class="asis-x" aria-label="Cerrar">×</button></div>'+
    '<div class="asis-body" id="asisBody"></div>';
  document.body.appendChild(btn); document.body.appendChild(panel);

  var body=panel.querySelector('#asisBody');
  function abrir(){ panel.hidden=false; btn.classList.add('on'); paso0(); }
  function cerrar(){ panel.hidden=true; btn.classList.remove('on'); }
  btn.addEventListener('click',function(){ panel.hidden?abrir():cerrar(); });
  panel.querySelector('.asis-x').addEventListener('click',cerrar);

  function bot(html){ return '<div class="asis-msg asis-bot">'+html+'</div>'; }
  function opciones(arr){ // arr: [{label, on, href}]
    var o='<div class="asis-opts">';
    arr.forEach(function(x,i){ o+='<button class="asis-opt" data-i="'+i+'">'+x.label+'</button>'; });
    o+='</div>';
    return o;
  }
  function render(html, acciones){
    body.innerHTML=html;
    if(acciones){
      var btns=body.querySelectorAll('.asis-opt');
      btns.forEach(function(b){ b.addEventListener('click',function(){ acciones[+b.dataset.i].on(); }); });
    }
    body.scrollTop=body.scrollHeight;
  }
  function volver(fn){ return '<button class="asis-back" id="asisBack">← Volver</button>'; }
  function wireBack(fn){ var b=body.querySelector('#asisBack'); if(b) b.addEventListener('click',fn); }

  // ---------- PASO 0: tipo de atención ----------
  function paso0(){
    var ops=[
      {label:'Quiero comprar un barco nuevo', on:paso1Marca},
      {label:'Busco un barco usado', on:function(){ irUsados(); }},
      {label:'Equipamiento y repuestos', on:function(){ directo('Hola Oceanic, quiero información de equipamiento náutico.', pre+'equipamiento/index.html','Ver equipamiento'); }},
      {label:'Charter / arrendar', on:function(){ directo('Hola Oceanic, quiero cotizar un charter.', pre+'charter/index.html','Ver charter'); }},
      {label:'Postventa o servicio', on:function(){ directo('Hola Oceanic, necesito ayuda de postventa / servicio técnico.'); }}
    ];
    render(bot('¡Hola! ¿En qué te podemos ayudar?')+opciones(ops), ops);
  }

  // ---------- PASO 1: marca ----------
  function paso1Marca(){
    var ops=ORDEN.filter(function(mk){return C[mk];}).map(function(mk){
      return {label:nombreMarca(mk), on:function(){ paso2Barco(mk); }};
    });
    render(bot('¿Qué marca te interesa?')+opciones(ops)+volver(), ops);
    wireBack(paso0);
  }

  // ---------- PASO 2: barco ----------
  function paso2Barco(mk){
    var mods=modelosDe(mk);
    if(!mods.length){ // marca sin modelos: ir directo
      directo('Hola Oceanic, quiero información de '+nombreMarca(mk)+'.', marcaHref(mk), 'Ver '+nombreMarca(mk));
      return;
    }
    // agrupar por familia si hay mezcla
    function fam(t){t=(t||'').toLowerCase(); if(t.indexOf('vela')>=0)return 'Vela'; if(t.indexOf('electric')>=0||t.indexOf('eléctric')>=0)return 'Eléctrico'; return 'Motor';}
    var ops=mods.map(function(m){ return {label:m.nombre+(m.eslora?' · '+m.eslora:''), on:function(){ paso3Enviar(mk,m); }}; });
    // opción "no sé aún"
    ops.push({label:'Aún no sé / quiero orientación', on:function(){ directo('Hola Oceanic, me interesa '+nombreMarca(mk)+' y quiero orientación para elegir el modelo.', marcaHref(mk), 'Ver '+nombreMarca(mk)); }});
    render(bot('Marca: <b>'+nombreMarca(mk)+'</b>. ¿Qué modelo?')+opciones(ops)+volver(), ops);
    wireBack(paso1Marca);
  }

  // ---------- PASO 3: enviar ----------
  function paso3Enviar(mk,m){
    var msg='Hola Oceanic, me interesa el '+m.nombre+' ('+nombreMarca(mk)+')'+(m.eslora?', de '+m.eslora:'')+'. Quisiera recibir precio, configuración y plazos.';
    var href=modeloHref(mk,m.slug);
    var html=bot('Perfecto. <b>'+m.nombre+'</b> de '+nombreMarca(mk)+'.'+(m.desc?'<br><span class="asis-desc">'+m.desc+'</span>':''))+
      '<div class="asis-cta">'+
        '<a class="asis-send" href="'+wa(msg)+'" target="_blank" rel="noopener">Enviar consulta por WhatsApp</a>'+
        '<a class="asis-ver" href="'+href+'">Ver ficha del '+m.nombre+' →</a>'+
      '</div>'+volver();
    render(html);
    wireBack(function(){ paso2Barco(mk); });
  }

  // ---------- atajos ----------
  function directo(msg, href, verLabel){
    var html=bot('Te ponemos en contacto con un especialista.')+
      '<div class="asis-cta">'+
        '<a class="asis-send" href="'+wa(msg)+'" target="_blank" rel="noopener">Escribir por WhatsApp</a>'+
        (href?'<a class="asis-ver" href="'+href+'">'+(verLabel||'Ver más')+' →</a>':'')+
      '</div>'+volver();
    render(html);
    wireBack(paso0);
  }
  function irUsados(){
    var html=bot('Tenemos una selección de usados revisados.')+
      '<div class="asis-cta">'+
        '<a class="asis-ver" href="'+pre+'usados/index.html">Ver usados disponibles →</a>'+
        '<a class="asis-send" href="'+wa('Hola Oceanic, busco un barco usado. ¿Qué tienen disponible?')+'" target="_blank" rel="noopener">Consultar por WhatsApp</a>'+
      '</div>'+volver();
    render(html);
    wireBack(paso0);
  }
})();
