/* OCEANIC · Publicación de modelos: modelos destacados de la portada e interruptor por barco.
   "destacados": los 3 modelos que muestra la portada, en orden ("<marca>/<slug>"). Un modelo apagado no se muestra.
   Un modelo en "ocultos" no aparece en ninguna parte del sitio (gamas, menús, asistente, fichas); su ficha
   redirige a la página de la marca. Para volver a publicarlo, se borra de la lista.
   Este archivo lo administrará el CMS (botón prender/apagar por barco). Hasta entonces se edita aquí.
   Debe cargarse justo después de catalogo-data.js.

   Reglas vigentes:
   - Saffier y Solaris bloquean la descarga automática de sus fotos: solo se publican los modelos cuyo material
     está en oceanic.cl. Los demás quedan para carga manual vía CMS (decisión Oceanic 2026-11-04).
   - Cualquier modelo que el cliente no quiera publicar se agrega aquí con su motivo. */
window.OCEANIC_PUBLICACION = /*DATOS*/{
  "destacados": [
    "axopar/axopar-37-xc-cross-cabin",
    "beneteau/oceanis-34-1",
    "lagoon/lagoon-42-millenium"
  ],
  "ocultos": {
    "saffier/saffier-sc-8m-cabin": "Sin material: no está en oceanic.cl (Saffier bloquea la descarga automática)",
    "saffier/saffier-se-28-leopard": "Sin material: no está en oceanic.cl (Saffier bloquea la descarga automática)",
    "solaris/solaris-64-rs": "Sin material: no está en oceanic.cl (Solaris bloquea la descarga automática)",
    "solaris/solaris-74-rs": "Sin material: no está en oceanic.cl (Solaris bloquea la descarga automática)",
    "solaris/solaris-80-rs": "Sin material: no está en oceanic.cl (Solaris bloquea la descarga automática)",
    "solaris/solaris-111-rs": "Sin material: no está en oceanic.cl (Solaris bloquea la descarga automática)"
  }
}/*FIN*/;

(function () {
  'use strict';
  // Opcionales y ediciones: no se publican en ningún barco (decisión Oceanic 2026-11-04). Los datos de la biblioteca
  // quedan completos; aquí se limpian solo para mostrarlos.
  var OPC = /opcional|optional|Pilot Edition|edici[oó]n limitada|Riders.? Edition|\bAlpine\b|\bpack\b/i;
  function texto(t) {
    if (!t || !OPC.test(t)) return t;
    return t.split(/(?<=[.!?])\s+/).filter(function (f) { return !OPC.test(f); }).join(' ').trim();
  }
  function spec(v) {  // "3 (+4 opcional)" → "3"; "WC opcional" / "32 l (opcional)" → null (fila fuera)
    if (!v || !OPC.test(v)) return v;
    if (/^\s*[^()]*\(\s*opcional\s*\)\s*$/i.test(v)) return null;
    v = v.replace(/\s*\([^)]*opcional[^)]*\)/gi, '').trim();
    return v && !OPC.test(v) ? v : null;
  }
  window.OCEANIC_SIN_OPCIONALES = { texto: texto, spec: spec, lista: function (a) {
    return (a || []).filter(function (x) { return !OPC.test(typeof x === 'string' ? x : JSON.stringify(x)); });
  } };

  var C = window.OCEANIC_CATALOGO, O = window.OCEANIC_PUBLICACION.ocultos;
  if (!C) return;
  Object.keys(C).forEach(function (marca) {
    C[marca].modelos.forEach(function (m) {
      m.desc = texto(m.desc); m.desc_larga = texto(m.desc_larga);
      m.specs = (m.specs || []).map(function (s) {
        var v = spec(s.value); return v ? { label: s.label, value: v, note: s.note && !OPC.test(s.note) ? s.note : '' } : null;
      }).filter(Boolean);
    });
  });
  Object.keys(C).forEach(function (marca) {
    C[marca].modelos = C[marca].modelos.filter(function (m) { return !O[marca + '/' + m.slug]; });
  });
})();
