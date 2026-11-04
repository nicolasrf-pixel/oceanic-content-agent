/* OCEANIC, Puerto: renderiza ediciones desde puerto-data.js */
(function(){
  var P=window.OCEANIC_PUERTO, cont=document.getElementById('puertoEd');
  if(!P||!cont||!P.length) return;
  var AB='../assets/img/';

  var destacada=P[0], resto=P.slice(1);

  function notas(ed){
    return '<ul class="ped-notas">'+ed.notas.map(function(n){
      return '<li><b>'+n.titular+'</b><span>'+n.bajada+'</span></li>';
    }).join('')+'</ul>';
  }

  // destacada
  var feat='<section class="pfeat2"><div class="wrap-wide">'+
    '<div class="sec-head"><span class="eyebrow">Última edición</span><span class="rule"></span></div>'+
    '<div class="pfeat2-grid">'+
      '<div class="pfeat2-img"><img src="'+AB+destacada.portada+'.webp" alt="Puerto '+destacada.mes+'"></div>'+
      '<div class="pfeat2-body"><span class="pfeat2-mes">'+destacada.mes+'</span>'+
      '<p class="pfeat2-res">'+destacada.resumen+'</p>'+notas(destacada)+'</div>'+
    '</div></div></section>';

  // archivo
  var arch='';
  if(resto.length){
    arch='<section class="parch2"><div class="wrap-wide">'+
      '<div class="sec-head"><span class="eyebrow">El archivo</span><span class="rule"></span></div>'+
      '<h2 class="parch2-h2">Ediciones anteriores</h2>'+
      '<div class="parch2-grid">'+resto.map(function(ed){
        return '<article class="ped2"><div class="ped2-img"><img src="'+AB+ed.portada+'.webp" alt="Puerto '+ed.mes+'" loading="lazy"></div>'+
          '<div class="ped2-body"><span class="ped2-mes">'+ed.mes+'</span>'+
          '<p class="ped2-res">'+ed.resumen+'</p>'+
          '<ul class="ped2-notas">'+ed.notas.map(function(n){return '<li>'+n.titular+'</li>';}).join('')+'</ul>'+
          '</div></article>';
      }).join('')+'</div></div></section>';
  }
  cont.innerHTML=feat+arch;
})();
