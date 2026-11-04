/* OCEANIC — Cotizador por barco (modal <dialog>).
   Cada ficha abre su propio formulario pre-llenado con el modelo.
   Al enviar: arma un correo ordenado a ventas@oceanic.cl y muestra "hemos recibido tu solicitud".
   2ª etapa (servidor): reemplazar enviarSolicitud() por un POST al backend que envía
   el correo a ventas@ y el autoresponder al solicitante. El HTML del form ya queda listo. */
(function(){
  'use strict';
  var VENTAS='ventas@oceanic.cl';
  var dlg, trigger;

  function esc(s){ return (s==null?'':String(s)).replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];}); }

  function construirDialog(){
    dlg=document.createElement('dialog');
    dlg.className='cot-dlg';
    dlg.setAttribute('aria-labelledby','cotTitle');
    document.body.appendChild(dlg);
    // cerrar al hacer click en el backdrop
    dlg.addEventListener('click',function(e){ if(e.target===dlg) cerrar(); });
    // al cerrar (incluye Esc nativo del <dialog>): quitar el lock y devolver foco al trigger
    dlg.addEventListener('close',function(){
      document.body.classList.remove('cot-lock');
      if(trigger&&trigger.focus) trigger.focus();
    });
  }

  function cerrar(){ document.body.classList.remove('cot-lock'); try{ dlg.close(); }catch(e){ dlg.removeAttribute('open'); } }

  // datos: {modelo, marca, specs:[{label,value}], href}
  window.OCEANIC_COTIZAR=function(datos){
    if(!dlg) construirDialog();
    datos=datos||{};
    trigger=datos.trigger||document.activeElement;
    var modelo=datos.modelo||'', marca=datos.marca||'';
    var titulo=modelo?('Cotizar '+modelo):'Solicitar información';
    // resumen de specs clave para contexto del vendedor
    var resumen=(datos.specs||[]).slice(0,4).map(function(s){return s.label+': '+s.value;}).join(' · ');

    dlg.innerHTML=
      '<form class="cot-form" novalidate>'+
        '<button type="button" class="cot-x" aria-label="Cerrar">×</button>'+
        '<p class="cot-kick">Solicitud de cotización</p>'+
        '<h2 id="cotTitle" class="cot-h">'+esc(titulo)+'</h2>'+
        (marca?'<p class="cot-sub">'+esc(marca)+(resumen?' · <span>'+esc(resumen)+'</span>':'')+'</p>':'')+
        '<div class="cot-row">'+
          '<label class="cot-f"><span>Nombre<i>*</i></span><input name="nombre" required autocomplete="name"></label>'+
          '<label class="cot-f"><span>Correo<i>*</i></span><input name="email" type="email" required autocomplete="email" inputmode="email"></label>'+
        '</div>'+
        '<div class="cot-row">'+
          '<label class="cot-f"><span>Teléfono</span><input name="telefono" type="tel" autocomplete="tel" inputmode="tel" placeholder="+56 9 ..."></label>'+
          '<label class="cot-f"><span>¿Cómo prefieres que te contactemos?</span>'+
            '<span class="cot-seg" role="radiogroup" aria-label="Medio de contacto">'+
              '<label><input type="radio" name="via" value="Correo" checked><span>Correo</span></label>'+
              '<label><input type="radio" name="via" value="WhatsApp"><span>WhatsApp</span></label>'+
              '<label><input type="radio" name="via" value="Llamada"><span>Llamada</span></label>'+
            '</span>'+
          '</label>'+
        '</div>'+
        '<label class="cot-f cot-full"><span>Mensaje</span><textarea name="mensaje" rows="3" placeholder="Cuéntanos cómo navegas, cuándo lo necesitas o qué configuración te interesa."></textarea></label>'+
        '<p class="cot-err" id="cotErr" role="alert" hidden></p>'+
        '<div class="cot-cta">'+
          '<button type="submit" class="btn cot-send">Enviar solicitud</button>'+
          (datos.wa?'<a class="btn btn-line cot-wa" href="'+esc(datos.wa)+'" target="_blank" rel="noopener">o por WhatsApp</a>':'')+
        '</div>'+
        '<p class="cot-legal">Te respondemos dentro de un día hábil. Tus datos solo se usan para esta cotización.</p>'+
      '</form>'+
      '<div class="cot-ok" hidden>'+
        '<span class="cot-ok-mark" aria-hidden="true">✓</span>'+
        '<h2 class="cot-h">Hemos recibido tu solicitud</h2>'+
        '<p class="cot-ok-txt">Gracias. Un especialista de Oceanic te escribe dentro de un día hábil con precio, configuración y plazos'+(modelo?(' del <b>'+esc(modelo)+'</b>'):'')+'. Te enviamos una copia a tu correo.</p>'+
        '<div class="cot-cta"><button type="button" class="btn cot-close2">Listo</button>'+
          (datos.href?'<a class="btn btn-line" href="'+esc(datos.href)+'">Ver la ficha</a>':'')+'</div>'+
      '</div>';

    var form=dlg.querySelector('.cot-form');
    var ok=dlg.querySelector('.cot-ok');
    var err=dlg.querySelector('#cotErr');

    dlg.querySelector('.cot-x').addEventListener('click',cerrar);
    var c2=dlg.querySelector('.cot-close2'); if(c2) c2.addEventListener('click',cerrar);

    form.addEventListener('submit',function(e){
      e.preventDefault();
      var f=form;
      var nombre=f.nombre.value.trim(), email=f.email.value.trim();
      if(!nombre||!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
        err.textContent='Déjanos tu nombre y un correo válido para responderte.';
        err.hidden=false;
        var malo=nombre?f.email:f.nombre;
        f.nombre.setAttribute('aria-invalid', nombre?'false':'true');
        f.email.setAttribute('aria-invalid', (email&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))?'false':'true');
        malo.focus();
        return;
      }
      err.hidden=true; f.nombre.removeAttribute('aria-invalid'); f.email.removeAttribute('aria-invalid');
      var tel=f.telefono.value.trim();
      var via=(f.querySelector('input[name=via]:checked')||{}).value||'Correo';
      var msg=f.mensaje.value.trim();
      enviarSolicitud({modelo:modelo,marca:marca,resumen:resumen,nombre:nombre,email:email,telefono:tel,via:via,mensaje:msg,href:datos.href});
      // mostrar confirmación
      form.hidden=true; ok.hidden=false;
      ok.querySelector('.cot-close2').focus();
    });

    // abrir modal (focus trap + Esc nativos de <dialog>)
    document.body.classList.add('cot-lock');
    if(typeof dlg.showModal==='function') dlg.showModal();
    else dlg.setAttribute('open','');
    var first=dlg.querySelector('input[name=nombre]'); if(first) first.focus();
  };

  /* ETAPA 1 (sin servidor): abre el cliente de correo con todo ordenado para ventas@.
     ETAPA 2 (servidor): reemplazar por fetch('/api/cotizar',{method:'POST',body:...})
     que envía el correo a ventas@ y el autoresponder "hemos recibido tu solicitud" al cliente. */
  function enviarSolicitud(d){
    var lineas=[
      'Nueva solicitud de cotización desde el sitio Oceanic.','',
      'EMBARCACIÓN',
      '• Modelo: '+(d.modelo||'(no especificado)'),
      (d.marca?'• Marca: '+d.marca:''),
      (d.resumen?'• Ficha: '+d.resumen:''),
      (d.href?'• Ver: '+d.href:''),
      '',
      'CLIENTE',
      '• Nombre: '+d.nombre,
      '• Correo: '+d.email,
      (d.telefono?'• Teléfono: '+d.telefono:''),
      '• Prefiere contacto por: '+d.via,
      '',
      'MENSAJE',
      (d.mensaje||'(sin mensaje)')
    ].filter(function(x){return x!=='';});
    var cuerpo=lineas.join('\n');
    var asunto='Cotización'+(d.modelo?' — '+d.modelo:'')+' — '+d.nombre;
    // Guardar un registro local por si el envío de correo falla (respaldo para el vendedor).
    try{
      var reg=JSON.parse(localStorage.getItem('oceanic_cotizaciones')||'[]');
      reg.push({fecha:new Date().toISOString(),asunto:asunto,cuerpo:cuerpo});
      localStorage.setItem('oceanic_cotizaciones',JSON.stringify(reg).slice(0,50000));
    }catch(e){}
    var url='mailto:'+VENTAS+'?subject='+encodeURIComponent(asunto)+'&body='+encodeURIComponent(cuerpo);
    // abrir el correo sin sacar al usuario de la página (la confirmación se muestra igual)
    var a=document.createElement('a'); a.href=url; a.style.display='none';
    document.body.appendChild(a); a.click(); setTimeout(function(){a.remove();},100);
  }

  // Delegación: cualquier elemento con [data-cotizar] abre el modal con los datos del barco.
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-cotizar]'); if(!t) return;
    e.preventDefault();
    var datos={
      trigger:t,
      modelo:t.getAttribute('data-modelo')||'',
      marca:t.getAttribute('data-marca')||'',
      href:t.getAttribute('data-href')||'',
      wa:t.getAttribute('data-wa')||'',
      specs:[]
    };
    var raw=t.getAttribute('data-specs');
    if(raw){ try{ datos.specs=JSON.parse(raw); }catch(e2){} }
    window.OCEANIC_COTIZAR(datos);
  });
})();
