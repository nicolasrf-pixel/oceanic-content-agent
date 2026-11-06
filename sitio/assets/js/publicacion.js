/* OCEANIC · Publicación de modelos: modelos destacados de la portada e interruptor por barco.
   "destacados": los 3 modelos que muestra la portada, en orden ("<marca>/<slug>"). Un modelo apagado no se muestra.
   Un modelo en "ocultos" no aparece en ninguna parte del sitio (gamas, menús, asistente, fichas); su ficha
   redirige a la página de la marca. Para volver a publicarlo, se borra de la lista.
   Lo administra el CMS (/admin/ › Publicación y destacados): lo publicado allí reemplaza el bloque DATOS al servirse.
   Debe cargarse justo después de catalogo-data.js.

   Reglas vigentes:
   - Saffier y Solaris bloquean la descarga automática de sus fotos: solo se publican los modelos con fotos oficiales
     disponibles (oceanic.cl o copias versionadas en el repo). Los demás quedan para carga manual vía CMS
     (decisión Oceanic 2026-11-04; Solaris RS publicados el 2026-11-06 con sus fotos oficiales).
   - Cualquier modelo que el cliente no quiera publicar se agrega aquí con su motivo. */
window.OCEANIC_PUBLICACION = /*DATOS*/{
  "destacados": [
    "axopar/axopar-37-xc-cross-cabin",
    "beneteau/oceanis-34-1",
    "lagoon/lagoon-42-millenium"
  ],
  "ocultos": {
    "saffier/saffier-sc-8m-cabin": "Sin material: no está en oceanic.cl (Saffier bloquea la descarga automática)",
    "saffier/saffier-se-28-leopard": "Sin material: no está en oceanic.cl (Saffier bloquea la descarga automática)"
  }
}/*FIN*/;

(function () {
  'use strict';
  // Opcionales y ediciones: no se publican en ningún barco (decisión Oceanic 2026-11-04). Los datos de la biblioteca
  // quedan completos; aquí se limpian solo para mostrarlos.
  var OPC = /opcional|optional|\bopci[oó]n(es)?\b|\bopt\.|\bopc\.|\bOPZ\b|Pilot Edition|edici[oó]n limitada|Riders.? Edition|\bAlpine\b|\bpack\b/i;
  function texto(t) {
    if (!t || !OPC.test(t)) return t;
    return t.split(/(?<=[.!?])\s+/).filter(function (f) { return !OPC.test(f); }).join(' ').trim();
  }
  function spec(v) {  // "3 (+4 opcional)" → "3"; "WC opcional" / "32 l (opcional)" → null (fila fuera)
    if (!v || !OPC.test(v)) return v;
    if (/^\s*[^()]*\(\s*opcional\s*\)\s*$/i.test(v)) return null;
    v = v.replace(/\s*\([^)]*(opcional|optional|opt\.|opc\.)[^)]*\)/gi, '')            // "(optional 150 hp)", "(opc.)"
      .split(/\s*;\s*/).filter(function (x) { return !OPC.test(x); }).join('; ')       // "…; opción 2 x 195 CV"
      .replace(/\s+(-\s*)?(OPZ|optional|opcional)\b.*$/i, '')                           // "… - OPZ 110 HP", "… optional 75 hp"
      .replace(/[,;\s]+$/, '').trim();
    return v && !OPC.test(v) ? v : null;
  }
  // Términos técnicos de las fichas oficiales en inglés (u otro idioma) → español. Los nombres propios no se tocan.
  var ES = [
    [/Naval architect\s*&\s*design\s*:/gi, 'Arquitectura naval y diseño:'],
    [/Naval architects?\s*:/gi, 'Arquitecto naval:'], [/\bArchitect\s*:/gi, 'Arquitecto naval:'],
    [/Naval designer\s*:/gi, 'Diseño naval:'],
    [/(Exterior\s*(&|and)\s*interior|Interior\s*(&|and)\s*exterior)\s*design(er)?s?\s*:/gi, 'Diseño exterior e interior:'],
    [/Interior\s*(&|and)\s*deck\s*designs?\s*:/gi, 'Diseño interior y de cubierta:'],
    [/Exterior\s*design(er)?s?\s*:/gi, 'Diseño exterior:'], [/Interior\s*design(er)?s?\s*:/gi, 'Diseño interior:'],
    [/Deck\s*design\s*:/gi, 'Diseño de cubierta:'], [/Structural\s*engineering\s*:/gi, 'Ingeniería estructural:'],
    [/Develop+e?ment\s*:/gi, 'Desarrollo:'], [/\bDesign(er)?\s*:/gi, 'Diseño:'],
    [/según layout/gi, 'según distribución'], [/\(std\.\)/gi, '(estándar)'],
    [/Vac+uum infused fibreglass/gi, 'Fibra de vidrio infusionada al vacío'], [/^Polyester$/i, 'Poliéster'],
    [/^GRP$/, 'Fibra de vidrio (GRP)'], [/Deep-V/g, 'V profunda'], [/proa “Sharp entry”/g, 'proa de entrada fina'],
    [/\bpersons\b/gi, 'personas'], [/\bin salon\b/gi, 'en el salón'], [/US gal\b/g, 'galones (EE. UU.)'],
    [/most economic cruising speed range/gi, 'crucero más económico entre'], [/at cruising speed/gi, 'a velocidad de crucero'],
    [/\btwin\s*/gi, '2 x '], [/\bquad\s*/gi, '4 x '], [/^Cruise\s*-\s*/i, ''], [/\s*@\s*/g, ' a '], [/\b(knots|kts|kn)\b/gi, 'nudos'],
    [/with saildrive and electric controls/gi, 'con saildrive y mandos eléctricos'], [/with Lithium ion Battery/gi, 'con batería de litio'],
    [/with Joystick Piloting Control/gi, 'con joystick'], [/\bdiesel engine\b/gi, 'diésel'], [/\bElectric engine\b/gi, 'motor eléctrico'],
    [/CE B Offshore \/ C Coastal/g, 'CE B (alta mar) / C (costera)'], [/\bsur le fly\b/g, 'en el flybridge'],
    [/\bin\b(?= salon)/gi, 'en']
  ];
  function es(v) { if (!v) return v; ES.forEach(function (r) { v = v.replace(r[0], r[1]); }); return v.replace(/\s{2,}/g, ' ').trim(); }
  function sinEtiqueta(label, v) {  // "Motor auxiliar" · "Motor auxiliar hasta 14 hp" → "Hasta 14 hp"
    var l = (label || '').toLowerCase();
    if (l && v && (v.toLowerCase().indexOf(l + ' ') === 0 || v.toLowerCase().indexOf(l + ':') === 0)) {
      v = v.slice(l.length).replace(/^[:\s]+/, ''); v = v.charAt(0).toUpperCase() + v.slice(1);
    }
    return v;
  }
  window.OCEANIC_SIN_OPCIONALES = { texto: texto, spec: function (v) { return es(spec(v)); }, lista: function (a) {
    return (a || []).filter(function (x) { return !OPC.test(typeof x === 'string' ? x : JSON.stringify(x)); });
  } };

  var C = window.OCEANIC_CATALOGO, O = window.OCEANIC_PUBLICACION.ocultos;
  if (!C) return;
  Object.keys(C).forEach(function (marca) {
    C[marca].modelos.forEach(function (m) {
      m.desc = texto(m.desc); m.desc_larga = texto(m.desc_larga);
      m.specs = (m.specs || []).map(function (s) {
        var v = spec(s.value); return v ? { label: s.label, value: es(sinEtiqueta(s.label, v)), note: s.note && !OPC.test(s.note) ? es(s.note) : '' } : null;
      }).filter(Boolean);
    });
  });
  Object.keys(C).forEach(function (marca) {
    C[marca].modelos = C[marca].modelos.filter(function (m) { return !O[marca + '/' + m.slug]; });
  });
})();
