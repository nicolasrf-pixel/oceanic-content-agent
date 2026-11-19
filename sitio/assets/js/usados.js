/* OCEANIC, Repositorio de usados (datos reales de usados-data.js) */
(function(){
  var U=window.OCEANIC_USADOS; if(!U) return;
  U=U.filter(function(u){ return !u.oculto; });  // ocultos desde el administrador: no se listan
  var grid=document.getElementById('grid'), cont=document.getElementById('count');
  var empty=document.getElementById('empty');
  var AB=(document.body.dataset.assetBase||'../assets/img/')+'usados/';
  var filtro='';
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function src(f){  // {url, local} del build, o ruta/URL subida desde el CMS
    if(f&&typeof f==='object') return f.local?AB+f.local+'?v=2':(f.url||'');  // ?v=2: no reusar 404 guardados de la versión anterior
    f=String(f||''); return /^(https?:)?\/\//.test(f)||f.charAt(0)==='/'?f:AB+f.replace(/^usados\//,'');
  }

  function foto(u){
    // foto de la tarjeta: la misma que publica oceanic.cl (portada); si no hay, la primera de la galería
    var f=u.portada?src(u.portada):(u.fotos&&u.fotos.length)?src(u.fotos[0]):null;
    if(f) return '<img src="'+esc(f)+'" alt="'+esc(u.nombre)+'" loading="lazy" onerror="this.closest(\'.uc-img\').classList.add(\'is-noimg\')">';
    return '';
  }
  function card(u){
    var vend=u.estado==='vendido';
    var tiene=u.portada||(u.fotos&&u.fotos.length);
    return '<a class="uc'+(vend?' e-vendido':'')+'" href="barco/index.html?id='+encodeURIComponent(u.id)+'">'+
      '<div class="uc-img'+(tiene?'':' is-noimg')+'">'+(vend?'<span class="uc-estado uc-vendido">Vendido</span>':'')+
      foto(u)+
      '<div class="uc-noimg"><span>'+esc(u.marca&&u.marca!=='·'?u.marca:u.nombre)+'</span></div></div>'+
      '<div class="uc-body"><div class="uc-top"><span class="uc-name">'+esc(u.nombre)+'</span>'+
      (u.anio?'<span class="uc-anio">'+esc(u.anio)+'</span>':'')+'</div>'+
      (u.marca&&u.marca!=='·'?'<span class="uc-meta">'+esc(u.marca)+'</span>':'')+
      '<span class="uc-resumen">'+esc(u.resumen)+'</span>'+
      (u.precio?'<span class="uc-precio">'+esc(u.precio)+'</span>':'')+'</div></a>';
  }

  function render(){
    var lista=U.filter(function(u){ return !filtro||u.tipo===filtro; });
    // vendidos al final; dentro de cada grupo, el más nuevo primero (fecha de publicación)
    lista.sort(function(a,b){ return ((a.estado==='vendido')-(b.estado==='vendido')) || String(b.fecha||'').localeCompare(String(a.fecha||'')); });
    grid.innerHTML=lista.map(card).join('');
    if(cont) cont.textContent=lista.length;
    if(empty) empty.hidden=lista.length>0;
  }

  var fil=document.getElementById('filters');
  if(fil){
    fil.addEventListener('click',function(e){
      var b=e.target.closest('.fbtn'); if(!b) return;
      filtro=b.dataset.val||'';
      [].slice.call(fil.querySelectorAll('.fbtn')).forEach(function(x){x.classList.toggle('is-on',x===b);});
      render();
    });
  }
  var rst=document.getElementById('reset');
  if(rst) rst.addEventListener('click',function(){filtro='';[].slice.call(fil.querySelectorAll('.fbtn')).forEach(function(x,i){x.classList.toggle('is-on',i===0);});render();});
  render();
})();
