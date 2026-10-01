# Mapa de fuentes oficiales — Axopar 37 XC Cross Cabin

Piloto Content Collector · Generado 2026-09-22 · Ver `sources.json` para el registro estructurado completo.

## Limitación de acceso (léase primero)

Antes de iniciar el descubrimiento se probó acceso directo:

| Prueba | Herramienta | URL/host | Resultado |
|---|---|---|---|
| 1 | WebFetch | `https://www.axopar.com/range/axopar-37-xc-cross-cabin/` | `EGRESS_BLOCKED` |
| 2 | curl (Bash) | `https://www.axopar.com/` | `403 connect_rejected` (política de organización) |
| 3 (control) | WebFetch | `https://en.wikipedia.org/wiki/Axopar` | `EGRESS_BLOCKED` |

La prueba de control confirma que el bloqueo es una política general del entorno para este piloto, no algo específico de axopar.com. **Todo lo que sigue viene de snippets de `WebSearch`, no de lectura directa de página**, aunque cada fuente está clasificada por dominio oficial vs. tercero.

## Fuentes oficiales encontradas, por tipo

### product-page (3)
| # | URL | Prioridad | Contenido extraído |
|---|---|---|---|
| src-001 | [axopar.com/range/axopar-37-xc-cross-cabin/](https://www.axopar.com/range/axopar-37-xc-cross-cabin/) | 1 | Sí — descripción, helm/pilothouse, aft deck |
| src-002 | [axopar.com/boat-models/axopar-37/axopar-37-xc-cross-cabin/](https://www.axopar.com/boat-models/axopar-37/axopar-37-xc-cross-cabin/) | 2 | No (alias de src-001, no confirmado si es la misma página) |
| src-003 | [axopar.com/boat-models/axopar-37/](https://www.axopar.com/boat-models/axopar-37/) | 3 | No (página de familia, no del modelo) |

### specifications (1)
| # | URL | Prioridad | Contenido extraído |
|---|---|---|---|
| src-004 | [axopar.com/pricelist/AXO9003774](https://www.axopar.com/pricelist/AXO9003774) | 1 | Sí — eslora, peso, precio, opciones con precio |

### configurator (1)
| # | URL | Relación | Estado |
|---|---|---|---|
| src-005 | [axopar.com/product-configurator/20-ax37st](https://axopar.com/product-configurator/20-ax37st) | **NO CONFIRMADA** — el id `ax37st` sugiere posiblemente "37 ST", no necesariamente "XC Cross Cabin" | No se encontró la URL exacta del configurador para este modelo; no se inventó una por analogía con otros modelos |

### brochure (0)
Ninguna encontrada alojada en dominio oficial (`axopar.com` / `axopar.fi`). Se encontraron brochures en dominios de distribuidores (Simpson Marine, Jeff Brown Yachts) que probablemente reflejan contenido oficial, pero se excluyeron deliberadamente por no ser dominio del fabricante — ver política de exclusión abajo.

### manual (4)
| # | URL | Idioma / Año modelo |
|---|---|---|
| src-006 | [manuals.axopar.com](https://manuals.axopar.com/) | Portal índice |
| src-007 | [manuals.axopar.com/.../1.15.1.0/en/index.html](https://manuals.axopar.com/content/p8len/1.15.1.0/en/index.html) | Inglés, MY2025 (más reciente) |
| src-008 | [manuals.axopar.com/.../MY2020-2023.pdf](https://manuals.axopar.com/content/p8len/1.12.1.0/en/Axopar%2037%20XC%20Cross%20Cabin%20-%20Model%20Year%202020-2023%20-%20Owner's%20Manual.pdf) | Inglés, MY2020-2023 (PDF) |
| src-009 | [manuals.axopar.com/.../es-es/...pdf](https://manuals.axopar.com/content/p8les-es/1.3.1.1/es-es/Axopar%2037%20XC%20Cross%20Cabin%20-%20Modelo%202020-2022%20-%20Manual%20del%20propietario.pdf) | Español, Modelo 2020-2022 (PDF) |

### gallery (1)
| # | URL | Nota |
|---|---|---|
| src-010 | [axopar.com/media-library/](https://www.axopar.com/media-library/) | Biblioteca oficial filtrable por modelo. Una cifra de "662 imágenes" apareció en un resumen de búsqueda pero **no se declara como confirmada** — no se pudo verificar leyendo la página. |

### videos (3)
| # | URL | Nota |
|---|---|---|
| src-011 / src-011b | axopar.com/in-depth-videos (dos variantes de URL) | Hub oficial de videos, relación específica con 37 XC no confirmada |
| src-012 | [youtube.com/c/AxoparBoats](https://www.youtube.com/c/AxoparBoats) | Canal oficial (ya en el inventario) |

### other (4)
| # | URL | Qué es |
|---|---|---|
| src-013 | [axopar.com/.../japans-boat-of-the-year-2021](https://www.axopar.com/media/newsroom/news/axopar-37-xc-cross-cabin-japans-boat-of-the-year-2021-040422/) | Nota de prensa: premio "Boat of the Year" Japón 2021 |
| src-014 | [axopar.com/news-and-events/.../cox-cxo-300hp-diesel-engines](https://www.axopar.com/news-and-events/news/axopar-37-xc-cross-cabin-with-cox-cxo-300hp-diesel-engines) | Nota de prensa: opción motor diésel Cox CXO 300hp |
| src-015 | axopar.com/media/newsroom/.../cox-cxo-300hp-diesel-engines-150921 | Duplicado de src-014 (otra ruta de URL) |
| src-016 | [axopar.com/the-iconic-edition/](https://www.axopar.com/the-iconic-edition/) | Edición especial "Axopar 37" — relación con XC Cross Cabin específicamente **no confirmada** |

**Total fuentes oficiales registradas: 18** (16 URLs únicas + 2 variantes de URL duplicadas documentadas como tales).
**Con contenido efectivamente extraído vía snippet: 4** (src-001, src-004, src-013, src-014).

## Fuentes de terceros encontradas y descartadas (política, no error)

Por instrucción explícita: *"No navegar libremente por sitios de terceros. No utilizar Wikipedia, blogs, marketplaces, distribuidores o foros como fuentes primarias."* Aparecieron en casi todas las búsquedas, dominando a veces los resultados:

`itboat.com`, `yachtbuyer.com`, `ecys.com`, `jeffbrownyachts.com`, `manitowoc-marina.com`, `axopardenia.com`, `axoparmenorca.com`, `theboatwarehouse.com`, `simpsonmarine.com`, `boatworld.ee`, `baotic-yachting.com`, `en.yachtingaddress.com`, `powerandmotoryacht.com`, `boattest.com`, `boattrader.com`, `seaindependent.com`, `motorandkeel.com`, `surdykeyamaha.com`, `dimillosyachtsales.com`, `nauticalventures.com`, `rockstaryachts.com`, `onemarine.co.uk`, `axoparlondongroup.com`.

También varios videos de YouTube con reseñas/walkthroughs, atribuidos en los snippets a distribuidores (ej. "East Coast Yacht Sales", un "CPYB") y no al canal oficial — se excluyeron de la lista de fuentes de video.

**Importante sobre estas exclusiones:** varias de estas páginas de terceros (especialmente `jeffbrownyachts.com`, que aloja un PDF titulado "AXOPAR 37 XC CROSS CABIN TECHNICAL SPECIFICATIONS") probablemente reflejan contenido oficial del fabricante casi textual — pero como no se puede verificar que son una copia fiel sin acceso directo, y la instrucción del usuario es explícita, **no se usó ningún dato numérico de estas fuentes en el paquete de contenido**, aunque coincidan con lo encontrado en fuentes oficiales.
