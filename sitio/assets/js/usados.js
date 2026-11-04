/* OCEANIC, Repositorio de usados (datos reales de usados-data.js) */
(function(){
  var U=window.OCEANIC_USADOS; if(!U) return;
  var grid=document.getElementById('grid'), cont=document.getElementById('count');
  var empty=document.getElementById('empty');
  var AB=(document.body.dataset.assetBase||'../assets/img/')+'usados/';
  var filtro='';

  function foto(u){
    var f=(u.fotos&&u.fotos.length)?u.fotos[0].local:null;
    if(f) return '<img src="'+AB+f+'" alt="'+u.nombre+'" loading="lazy" onerror="this.closest(\'.uc-img\').classList.add(\'is-noimg\')">';
    return '';
  }
  function card(u){
    var vend=u.estado==='vendido';
    var tiene=u.fotos&&u.fotos.length;
    return '<a class="uc'+(vend?' e-vendido':'')+'" href="barco/index.html?id='+u.id+'">'+
      '<div class="uc-img'+(tiene?'':' is-noimg')+'">'+(vend?'<span class="uc-estado uc-vendido">Vendido</span>':'')+
      foto(u)+
      '<div class="uc-noimg"><span>'+(u.marca&&u.marca!=='·'?u.marca:u.nombre)+'</span></div></div>'+
      '<div class="uc-body"><div class="uc-top"><span class="uc-name">'+u.nombre+'</span>'+
      (u.anio?'<span class="uc-anio">'+u.anio+'</span>':'')+'</div>'+
      (u.marca&&u.marca!=='·'?'<span class="uc-meta">'+u.marca+'</span>':'')+
      '<span class="uc-resumen">'+u.resumen+'</span>'+
      '<span class="uc-precio">'+u.precio+'</span></div></a>';
  }

  function render(){
    var lista=U.filter(function(u){ return !filtro||u.tipo===filtro; });
    lista.sort(function(a,b){ return (a.estado==='vendido')-(b.estado==='vendido'); });
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
