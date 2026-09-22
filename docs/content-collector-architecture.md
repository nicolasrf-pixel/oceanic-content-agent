# Content Collector — arquitectura de integración con el dashboard (preparado, no implementado)

Este documento describe cómo se conectaría el sistema de paquetes de contenido
(`output/content/<brand>/<model>/`) con el dashboard existente, **sin implementarlo
todavía** — por instrucción explícita durante el piloto (2026-09-22): "no rediseñes
todavía el dashboard completo".

## Qué existe hoy

- `output/content/<brand_id>/<model_slug>/` — un paquete de contenido por modelo
  (ver estructura completa en `output/content/axopar/axopar-37-xc/00_MODELO/00_MODELO.md`
  como ejemplo piloto).
- `output/content/index.json` — índice ligero: por cada paquete, su `brand_id`,
  `model_id_catalog` (para cruzar con `data/models/<brand>/<model_id>.json`),
  ruta al paquete, `content_status` (GREEN/YELLOW/RED), `content_completeness_pct`,
  y conteos rápidos (conflictos, imágenes/documentos descargados).

Este índice **no está en `data/catalog/`** deliberadamente — el dashboard hoy solo
lee `master-catalog.json` y `oceanic-catalog.json`, que el Content Collector no debe
modificar (regla explícita del piloto).

## Cómo se conectaría (propuesta, no implementada)

```
dashboard/app.js
  │
  ├── fetch("../data/catalog/master-catalog.json")   ← ya existe
  ├── fetch("../data/catalog/oceanic-catalog.json")   ← ya existe
  └── fetch("../output/content/index.json")           ← NUEVO, opcional/best-effort
        │
        └── por cada modelo renderizado, cruzar por model_id_catalog:
              si existe entrada en index.json → mostrar badge
              "Content Package: 🟢/🟡/🔴 (XX%)" en la tarjeta y en el detalle,
              con link a 00_MODELO/00_MODELO.md (o a una vista futura que lo renderice)
```

Puntos de diseño a decidir cuando se implemente:
1. **El fetch de `index.json` debe ser best-effort** (try/catch, no bloquear el
   render si el archivo no existe todavía para la mayoría de los modelos —
   como en este piloto, donde solo 1 de 145 modelos tiene paquete).
2. **El badge no debe competir visualmente** con el badge de media ya existente
   (`.badge--media`) — probablemente un badge nuevo `.badge--content` con los
   3 colores de estado.
3. **La vista de detalle** podría añadir una sección "Content Package" que
   muestre completeness%, conflictos, y enlaces a las carpetas relevantes —
   pero eso implica servir archivos `.md`/`.json` adicionales, no solo los dos
   JSON de catálogo actuales.
4. **No se decidió** si el dashboard debe leer los archivos completos del
   paquete (specifications.json, sources.json) o solo el resumen de
   `index.json` — leer todo sería más pesado y probablemente no necesario
   hasta que haya más de un modelo con paquete.

## Por qué no se implementó ya

- Solo existe 1 paquete de 145 modelos — implementar la UI ahora sería diseñar
  para un caso de un solo dato.
- El usuario pidió explícitamente no rediseñar el dashboard en este piloto.
- Cuando se escale el Content Collector a más modelos, este documento debe
  revisarse (probablemente cambiará: nombres de campo, estructura de índice)
  antes de construir la UI real.
