/* ============================================================
   OCEANIC CHARTER, destinos y opciones del cotizador
   ============================================================
   El cotizador arma una solicitud por pasos. Estos datos
   alimentan los selectores de continente → destino.
   Editar aquí para agregar destinos. Fotos de destino: las de oceanic.cl/charter (Oceanic), en assets/img/destino-*.webp.
   ============================================================ */
window.OCEANIC_CHARTER={
 "continentes": [
  {
   "id": "mediterraneo",
   "nombre": "Mediterráneo",
   "img": "destino-mediterraneo",
   "lede": "Islas griegas, costa croata, Baleares, Cerdeña y la Riviera.",
   "destinos": [
    "Islas Griegas (Cícladas)",
    "Croacia (Dalmacia)",
    "Islas Baleares",
    "Cerdeña y Córcega",
    "Riviera francesa",
    "Costa Amalfitana"
   ]
  },
  {
   "id": "caribe",
   "nombre": "Caribe",
   "img": "destino-caribe",
   "lede": "Aguas cálidas todo el año: BVI, Granadinas, Bahamas.",
   "destinos": [
    "Islas Vírgenes (BVI)",
    "Granadinas",
    "Bahamas y Exumas",
    "San Blas (Panamá)",
    "Antigua y Barbuda"
   ]
  },
  {
   "id": "pacifico",
   "nombre": "Pacífico Sur",
   "img": "destino-pacifico",
   "lede": "Polinesia, y la costa que conocemos como nadie: Chile.",
   "destinos": [
    "Polinesia Francesa",
    "Islas del sur de Chile",
    "Patagonia chilena",
    "Golfo de Ancud"
   ]
  },
  {
   "id": "otros",
   "nombre": "Otros destinos",
   "img": "destino-otros",
   "lede": "Sudeste asiático, Seychelles o donde quieras navegar.",
   "destinos": [
    "Tailandia (Phuket)",
    "Seychelles",
    "Maldivas",
    "Otro, cuéntanos"
   ]
  }
 ],
 "embarcaciones": [
  {
   "id": "velero",
   "nombre": "Velero",
   "desc": "Crucero a vela, de 40 a 55 pies."
  },
  {
   "id": "catamaran",
   "nombre": "Catamarán",
   "desc": "Espacio y estabilidad para grupos."
  },
  {
   "id": "motor",
   "nombre": "Yate a motor",
   "desc": "Más velocidad y autonomía de costa."
  },
  {
   "id": "indiferente",
   "nombre": "Indiferente",
   "desc": "Recomiéndennos según el destino."
  }
 ],
 "tripulacion": [
  {
   "id": "con",
   "nombre": "Con tripulación",
   "desc": "Patrón profesional y, si quieres, chef y anfitrión."
  },
  {
   "id": "sin",
   "nombre": "Sin tripulación",
   "desc": "Tú al mando. Requiere licencia y experiencia."
  },
  {
   "id": "no-se",
   "nombre": "No estoy seguro",
   "desc": "Ayúdennos a decidir según el grupo y el destino."
  }
 ]
};
