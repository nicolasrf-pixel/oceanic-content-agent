/* OCEANIC · Publicación de modelos: interruptor por barco.
   Un modelo en "ocultos" no aparece en ninguna parte del sitio (gamas, menús, asistente, fichas); su ficha
   redirige a la página de la marca. Para volver a publicarlo, se borra de la lista.
   Este archivo lo administrará el CMS (botón prender/apagar por barco). Hasta entonces se edita aquí.
   Debe cargarse justo después de catalogo-data.js.

   Reglas vigentes:
   - Saffier y Solaris bloquean la descarga automática de sus fotos: solo se publican los modelos cuyo material
     está en oceanic.cl. Los demás quedan para carga manual vía CMS (decisión Oceanic 2026-11-04).
   - Cualquier modelo que el cliente no quiera publicar se agrega aquí con su motivo. */
window.OCEANIC_PUBLICACION = /*DATOS*/{
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
  var C = window.OCEANIC_CATALOGO, O = window.OCEANIC_PUBLICACION.ocultos;
  if (!C) return;
  Object.keys(C).forEach(function (marca) {
    C[marca].modelos = C[marca].modelos.filter(function (m) { return !O[marca + '/' + m.slug]; });
  });
})();
