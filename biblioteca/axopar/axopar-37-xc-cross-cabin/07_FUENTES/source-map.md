# Mapa de fuentes · Axopar 37 XC Cross Cabin

Fuentes detalladas en `sources.json`. Todas se accedieron el 2026-09-23 con Firecrawl. **Regla: los datos salen solo de la web oficial (S1, S3).**

| ID | Fuente | Tipo | MY |
| --- | --- | --- | --- |
| S1 | [Ficha oficial 37 XC Cross Cabin](https://www.axopar.com/boat-models/axopar-37/axopar-37-xc-cross-cabin/) | Web del fabricante | 2027 |
| S2 | [Owner's Manual MY2025-2027](https://manuals.axopar.com/content/p8len/1.24.1.0/en/index.html) | Documento (no aporta datos) | 2025-2027 |
| S3 | [Gama Axopar 37](https://www.axopar.com/boat-models/axopar-37/) | Web del fabricante (gama) | gama |
| S4 | [Owner Manuals](https://www.axopar.com/axopar-community/owner-manuals/) | Web del fabricante | — |
| S5 | [Media Library](https://www.axopar.com/media/media-library/) | Condiciones de uso | — |

## Qué fuente alimenta cada archivo

| Archivo | Fuentes | Cómo se obtuvo |
| --- | --- | --- |
| `00_MODELO/00_MODELO.md` | S1, S3, S4 | Manual + `readiness` generado |
| `01_CONTENIDO/hero.md` | S1 (hero, meta description) | Texto literal del extract S1 |
| `01_CONTENIDO/introduccion.md` | S1, S3 | Texto literal; S3 es de gama y así se indica |
| `01_CONTENIDO/diseno.md` | S1 | Pestañas, galería, layouts, equipamiento estándar |
| `01_CONTENIDO/ingenieria.md` | S1 | Ficha técnica, equipamiento General, Hull of Fame |
| `01_CONTENIDO/experiencia-a-bordo.md` | S1 | Pestañas y equipamiento |
| `01_CONTENIDO/performance.md` | S1, S3 | Ficha técnica, Performance Gains |
| `02_ESPECIFICACIONES/specifications.json` | S1 | Registro por valor con campo y valor originales |
| `03_CARACTERISTICAS/caracteristicas.md` | S1 | Key Feature / Option Highlights |
| `04_EQUIPAMIENTO/standard.md` | S1 | Pestaña Standard Features (oculta en el HTML visible; leída de los datos Next.js) |
| `04_EQUIPAMIENTO/optional.md` | S1 | Pestaña Optional Equipment (idem) |
| `04_EQUIPAMIENTO/packages.md` | S1 | Modales Upgrade Options |
| `04_EQUIPAMIENTO/configurations.md` | S1 | Layouts, motores, versión EU/US |
| `05_MULTIMEDIA/IMAGENES/images.json` | S1, S5 | Metadatos del DAM (Frontify) embebidos en S1 |
| `05_MULTIMEDIA/VIDEOS/videos.json` | S1 | Videos del DAM embebidos en S1 |
| `06_DOCUMENTOS/documents.json` | S2, S4 | Portal de manuales |

## Extractos guardados

- `extract/S1-axopar-37-xc-cross-cabin.page.json`: extract completo de S1 (`python -m oceanic extract axopar …`).

## Fuentes descartadas

Ver `sources.json` › `excluded_sources`: distribuidores, portales, reseñas y la página Oceanic de referencia. Ninguna alimenta datos.

## Fuentes pendientes

- https://www.axopar.com/the-iconic-edition (detalle de la Iconic Edition).
- https://www.axopar.com/discover-axopar/hull-of-fame/ (ingeniería de casco, de marca).
- https://www.axopar.com/discover-axopar/in-depth-videos/ y el canal de YouTube oficial (videos).
- DAM oficial https://axopar.frontify.com/media?q=axopar (más imágenes del 37 XC MY2026–2027).
