/* ============================================================
   OCEANIC, EQUIPAMIENTO POR CATEGORÍA
   ============================================================
   Las marcas de equipamiento que Oceanic representa, agrupadas
   por para qué sirven (no por marca). Modelo de prescripción:
   Oceanic asesora qué necesitas, no es tienda con carrito.

   Para editar: agregar/mover una marca dentro de su categoría.
   ============================================================ */

window.OCEANIC_EQUIPAMIENTO = {

  logos: ['Vanclaes','Simrad','Lowrance','Seldén','Lewmar','Vakaros',
          'North Sails','B&G','Nautix','Profurl','Flexofold','Lancelin'],

  categorias: [
    {
      id: 'electronica',
      titulo: 'Navegación y electrónica',
      lede: 'Cartografía, sonda, piloto e instrumentos de regata. Lo que te dice dónde estás y cómo va el barco.',
      marcas: [
        { nombre:'Simrad', desc:'Electrónica de navegación con más de 60 años de historia. Cartografía, radar y piloto automático para crucero y pesca.' },
        { nombre:'B&G', desc:'La electrónica que prefieren los mejores regatistas. Instrumentos pensados para sacarle el máximo a la vela.' },
        { nombre:'Lowrance', desc:'Seis décadas liderando la pesca y la navegación. Sondas y cartografía para el pescador profesional.' },
        { nombre:'Vakaros', desc:'El primer instrumento que mide con precisión de centímetros. Atlas 2 y Atlas Edge para potenciar la regata.' }
      ]
    },
    {
      id: 'jarcia',
      titulo: 'Jarcia y cubierta',
      lede: 'Lo que sostiene el aparejo y hace funcionar la cubierta: mástiles, hardware, enrolladores y cabos.',
      marcas: [
        { nombre:'Seldén', desc:'El mayor fabricante de mástiles y aparejos del mundo. La verdadera experiencia de navegación como motor de diseño.' },
        { nombre:'Lewmar', desc:'Hardware líder para vela y motor: molinetes de ancla, hélices de proa, escotillas, tornos y dirección.' },
        { nombre:'Profurl', desc:'Especialista en enrolladores de vela. Más de 30 años de tecnología para navegar con seguridad y facilidad.' },
        { nombre:'Lancelin', desc:'Empresa francesa con más de 100 años fabricando cabos de alta calidad para el mundo náutico.' }
      ]
    },
    {
      id: 'velas',
      titulo: 'Velas',
      lede: 'El motor silencioso del barco.',
      marcas: [
        { nombre:'North Sails', desc:'Fundada en 1958 con la vela de un Star. Referente mundial en velas, apreciada por todos los vientos del mar. "El mar es mi tierra".' }
      ]
    },
    {
      id: 'propulsion',
      titulo: 'Propulsión',
      lede: 'Hélices que convierten el motor en avance real.',
      marcas: [
        { nombre:'Flexofold', desc:'Hélices plegables de fabricación europea. Construcción robusta y rendimiento; las eligen la mayoría de los astilleros para velero.' }
      ]
    },
    {
      id: 'pintura',
      titulo: 'Pintura y protección',
      lede: 'Pinturas y antifouling para proteger el casco temporada tras temporada.',
      marcas: [
        { nombre:'Nautix', desc:'Más de 20 años como referencia en pinturas marinas. La eligen propietarios, pintores y empresas de chárter. Soluciones para todo tipo y talla de barco.' }
      ]
    },
    {
      id: 'transporte',
      titulo: 'Remolques y transporte',
      lede: 'Remolques de acero inoxidable para mover el barco en tierra con seguridad.',
      marcas: [
        { nombre:'Vanclaes', desc:'Remolques de acero inoxidable. Facilidad y comodidad sin precedentes, tanto en la rampa como en carretera. Diseños únicos y muy funcionales.' }
      ]
    }
  ]

};
