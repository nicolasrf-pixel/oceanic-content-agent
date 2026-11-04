/* OCEANIC — Cotizador por barco (modal <dialog>).
   Cada ficha abre su propio formulario pre-llenado con el modelo.
   Al enviar: POST a /api/formulario (aviso a ventas@ y confirmación al cliente) vía
   OCEANIC_ENVIAR (assets/js/formularios.js). Si el servidor no está, abre el correo del visitante. */
(function(){
  'use strict';
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
    var tipo=datos.tipo||(/^usado/i.test(marca)?'usado':'cotizacion');
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
        '<input name="web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">'+
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
        '<p class="cot-ok-txt">Gracias. Un especialista de Oceanic te escribe dentro de un día hábil con precio, configuración y plazos'+(modelo?(' del <b>'+esc(modelo)+'</b>'):'')+'.<span class="cot-ok-via"></span></p>'+
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
      var d={tipo:tipo,modelo:modelo,marca:marca,resumen:resumen,nombre:nombre,email:email,telefono:tel,via:via,mensaje:msg,href:datos.href,web:f.web.value};
      var btn=f.querySelector('.cot-send');
      btn.disabled=true; btn.textContent='Enviando…';
      window.OCEANIC_ENVIAR(d, respaldo(d)).then(function(r){
        ok.querySelector('.cot-ok-via').textContent = r.via==='servidor'
          ? ' Te enviamos una copia a tu correo.'
          : ' Se abrió tu correo con la solicitud escrita: envíala para que nos llegue.';
        form.hidden=true; ok.hidden=false;
        ok.querySelector('.cot-close2').focus();
      }, function(){
        btn.disabled=false; btn.textContent='Enviar solicitud';
        err.textContent='Revisa tu nombre y correo, y vuelve a enviar.';
        err.hidden=false;
      });
    });

    // abrir modal (focus trap + Esc nativos de <dialog>)
    document.body.classList.add('cot-lock');
    if(typeof dlg.showModal==='function') dlg.showModal();
    else dlg.setAttribute('open','');
    var first=dlg.querySelector('input[name=nombre]'); if(first) first.focus();
  };

  // Respaldo por correo si el servidor no está disponible.
  function respaldo(d){
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
    return { asunto:'Cotización'+(d.modelo?' — '+d.modelo:'')+' — '+d.nombre, cuerpo:lineas.join('\n') };
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
      tipo:t.getAttribute('data-tipo')||'',
      specs:[]
    };
    var raw=t.getAttribute('data-specs');
    if(raw){ try{ datos.specs=JSON.parse(raw); }catch(e2){} }
    window.OCEANIC_COTIZAR(datos);
  });
})();
