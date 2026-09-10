# data/models/

Fase 2 en curso, aprobada por el usuario/propietario del proyecto el
2026-09-10 (ver `data/changelog/brands-changelog.md` y
`research/verification-log/`).

Estructura: `data/models/<brand_id>/<model_id>.json`, un archivo por
modelo, validado contra `data/schema/model.schema.json`. Las variantes
(motorización, layout, aparejo, etc.) van anidadas dentro del campo
`variants` de su modelo, no como archivos propios, salvo que el
fabricante las trate explícitamente como producto independiente
(CLAUDE.md sección 7/16).

Todos los registros de esta pasada tienen `status_pipeline: "MAPPED"`
(no `"VALIDATED"`): promoverlos a `VALIDATED` a escala requiere
aprobación humana explícita (CLAUDE.md sección 21), que todavía no se ha
pedido para el inventario de modelos.

Ver el log por marca correspondiente en
`research/verification-log/2026-09-10-models-<brand_id>.md` para el
detalle de queries, hallazgos y discrepancias de cada marca.
