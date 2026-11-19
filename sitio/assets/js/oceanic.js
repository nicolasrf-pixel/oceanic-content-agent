/* Oceanic, página de modelo
   1. Línea de tiempo del proceso de adquisición
   2. Menú móvil
*/

(function(){
  var D=[
    ["Conversación inicial","1–2 semanas","Cómo navegas, dónde y con quién. De ahí sale si este es el barco o si hay otro en el portafolio que corresponde mejor."],
    ["Especificación","2–4 semanas","Definimos la configuración completa con el astillero: motorización, layout, electrónica y equipamiento. Al cerrarla, cerramos precio final."],
    ["Reserva y pedido","Mismo mes","Se toma posición en la línea de producción de Axopar. Desde aquí el barco tiene fecha."],
    ["Fabricación","4–8 meses","Construcción en Finlandia. Te mantenemos al tanto del avance y de cualquier cambio de plazo del astillero."],
    ["Transporte","6–10 semanas","Embarque y travesía hasta Chile, con seguimiento y seguro de tránsito."],
    ["Nacionalización","3–5 semanas","Internación, impuestos y matrícula. Lo gestionamos nosotros: no tienes que hacer trámites."],
    ["Entrega","2–3 semanas","Armado, pruebas de mar y entrega con capacitación a bordo. Desde ahí seguimos disponibles."]
  ];
  var dots=[].slice.call(document.querySelectorAll('.tl-dot')),
      panel=document.getElementById('tlPanel'),
      fill=document.getElementById('tlFill');
  if(!dots.length) return;
  function go(n){
    dots.forEach(function(d,k){
      d.classList.toggle('is-on',k===n);
      d.classList.toggle('is-past',k<n);
      d.setAttribute('aria-selected',k===n?'true':'false');
    });
    fill.style.width=(n/(D.length-1)*100)+'%';
    var d=D[n];
    panel.innerHTML='<div class="tl-meta"><span class="tl-step">Etapa 0'+(n+1)+' de 07</span><span class="tl-when">'+d[1]+'</span></div><h3>'+d[0]+'</h3><p>'+d[2]+'</p>';
    panel.classList.remove('tl-anim');void panel.offsetWidth;panel.classList.add('tl-anim');
  }
  dots.forEach(function(d,k){
    d.addEventListener('click',function(){go(k)});
    d.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'&&k<dots.length-1){dots[k+1].focus();go(k+1)}
      if(e.key==='ArrowLeft'&&k>0){dots[k-1].focus();go(k-1)}
    });
  });
})();

(function(){
  var b=(window.OCEANIC_MENU ? null : document.getElementById('burger')),d=document.getElementById('drawer');
  if(!b||!d) return;
  b.addEventListener('click',function(){
    var open=d.hasAttribute('hidden');
    if(open){d.removeAttribute('hidden');document.body.classList.add('locked')}
    else{d.setAttribute('hidden','');document.body.classList.remove('locked')}
    b.classList.toggle('on',open); b.setAttribute('aria-expanded',open?'true':'false');
  });
  d.addEventListener('click',function(e){
    if(e.target.tagName==='A'){d.setAttribute('hidden','');document.body.classList.remove('locked');b.classList.remove('on');b.setAttribute('aria-expanded','false')}
  });
})();


/* 3. Selector de intención, personaliza el copy previo al formulario */
(function(){
  var COPY={
    escapadas:'Salir el viernes en la tarde y volver el domingo. Para eso importan la autonomía, la calefacción y que el barco esté listo sin preparación previa.',
    familia:'Con familia a bordo, lo que decide es la cabina cerrada, la estabilidad del casco y cuánta gente cabe cómoda. Conversemos sobre el layout que corresponde.',
    pesca:'Para pesca pesan el calado, la electrónica y el espacio de trabajo en popa. Hay configuraciones del 37 XC pensadas exactamente para eso.',
    deportiva:'Si buscas rendimiento, la motorización cambia el barco completo. Vale la pena revisar las tres opciones antes de decidir.',
    travesia:'Para travesías largas lo que manda es autonomía, confort a bordo y equipamiento de fondeo. Es la configuración más específica de todas.'
  };
  var DEF='Cualquiera sea tu caso, la configuración cambia. Cuéntanos y te respondemos con lo que corresponde.';
  var btns=[].slice.call(document.querySelectorAll('.int')),
      echo=document.getElementById('echo'),
      field=document.getElementById('intencion');
  if(!btns.length||!echo) return;
  btns.forEach(function(b){
    b.addEventListener('click',function(){
      var was=b.classList.contains('on');
      btns.forEach(function(x){x.classList.remove('on');x.setAttribute('aria-checked','false')});
      if(was){echo.textContent=DEF; if(field) field.value=''; return;}
      b.classList.add('on'); b.setAttribute('aria-checked','true');
      echo.textContent=COPY[b.dataset.k]||DEF;
      if(field) field.value=b.dataset.k;
    });
  });
})();
