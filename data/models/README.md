# data/models/

Intencionalmente vacío.

El inventario de modelos (Fase 2) no se inicia hasta que el Master
Represented Brands Inventory (`data/brands/master-inventory.json`) sea
revisado y aprobado, y hasta resolver las discrepancias abiertas en
`data/changelog/brands-changelog.md` (especialmente Skeeta, XO Boats y
Switch). Ver `CLAUDE.md` secciones 3, 19 y 21.

Cuando se apruebe el inicio de la Fase 2, los modelos se organizarán como
`data/models/<brand_id>/<model_id>.json`, validados contra
`data/schema/model.schema.json`.
