# Arquitectura propuesta — Fase 0/1

Ver `CLAUDE.md` para las reglas; este documento es el mapa de carpetas y
su propósito, y cómo escala hacia las fases futuras.

```
oceanic-content-agent/
├── CLAUDE.md                          # constitución del proyecto
├── README.md
├── docs/
│   └── architecture.md                # este archivo
├── data/
│   ├── schema/
│   │   ├── source.schema.json         # trazabilidad reutilizable
│   │   ├── brand.schema.json          # esquema de representada
│   │   └── model.schema.json          # esquema de modelo (Fase 2, aún vacío de datos)
│   ├── brands/
│   │   ├── initial-universe.md        # lista original, histórica, inmutable
│   │   └── master-inventory.json      # inventario verificado (este PR)
│   ├── models/                        # vacío hasta Fase 2 aprobada
│   └── changelog/
│       └── brands-changelog.md        # discrepancias vs. universo inicial
├── research/
│   └── verification-log/
│       └── 2026-09-10-brands-verification.md   # qué se buscó, qué se encontró, limitaciones
├── content/                           # NO existe todavía — Fase 3+ (contenido editorial)
└── assets/                            # NO existe todavía — metodología primero, sin descarga masiva
```

## Principios de la estructura

1. **`data/` es la fuente de verdad**, siempre estructurada (JSON validado
   contra `data/schema/`), nunca solo texto libre. El texto libre
   (research, changelog, notas) vive en `research/` y `data/changelog/`,
   separado de los datos.
2. **Lo histórico nunca se sobreescribe.** `initial-universe.md` no se
   edita; las diferencias respecto a él se acumulan en
   `brands-changelog.md`. Lo mismo aplicará a modelos discontinuados en
   Fase 2 (inventario histórico separado del vigente).
3. **Un schema por entidad, reutilizando `source.schema.json`** para que
   la trazabilidad (dato → fuente → URL → fecha → nivel → estado) sea
   idéntica en marcas, modelos y, más adelante, especificaciones y
   contenido editorial.
4. **`content/` y `assets/` no existen todavía.** Se crean recién cuando
   se aprueben las fases correspondientes (Fase 3 en adelante), para no
   generar estructura sin datos que la respalden.
5. **Escalabilidad:** agregar una marca nueva es agregar una entrada en
   `master-inventory.json` (+ opcionalmente una entrada en el changelog si
   difiere del universo inicial); agregar un modelo nuevo (Fase 2) será
   agregar un archivo/entrada en `data/models/<brand_id>/` validado contra
   `model.schema.json`. Ningún paso requiere reescribir código ni
   estructura para escalar de 1 a 100 marcas o de 10 a cientos de modelos.

## Flujo de datos (conceptual)

```
descubrimiento (WebSearch/WebFetch)
        │
        ▼
research/verification-log/*.md      (bitácora de qué se investigó)
        │
        ▼
data/brands/master-inventory.json   (dato estructurado, validado)
        │
        ├─→ data/changelog/brands-changelog.md   (si hay discrepancia vs. universo inicial)
        │
        ▼
 [aprobación humana] ──────────────► data/models/  (Fase 2, no iniciada)
                                            │
                                            ▼
                                    contenido editorial (Fase 3+, no iniciada)
                                            │
                                            ▼
                                    assets / página web (Fase 4+, no iniciada)
```

## Por qué JSON y no una base de datos todavía

Con 11 marcas y, eventualmente, algunos cientos de modelos, JSON versionado
en git es suficiente y máximamente trazable (cada cambio es un commit con
diff legible). Si el volumen crece mucho más allá de eso, o se necesita
consulta concurrente/API, se puede migrar sin cambiar el modelo conceptual
(los `schema/*.json` ya son el contrato).
