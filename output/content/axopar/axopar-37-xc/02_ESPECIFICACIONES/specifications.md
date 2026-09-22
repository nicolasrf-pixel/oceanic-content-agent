# Especificaciones — Axopar 37 XC Cross Cabin

Ver `specifications.json` para el registro estructurado completo con trazabilidad por dato. Este archivo es la versión legible.

**Ningún dato aquí proviene de lectura directa de página** (WebFetch bloqueado en este entorno, ver `07_FUENTES/source-map.md`). Todo es snippet de `WebSearch`, clasificado por confiabilidad del dominio de origen.

## Dimensiones y peso

| Campo | Valor original | Normalizado | Fuente | Confianza |
|---|---|---|---|---|
| Eslora total (excl. motor) | 37ft 9in | **11.50 m** | [pricelist AXO9003774](https://www.axopar.com/pricelist/AXO9003774) | axopar.com ⚠️ **CONFLICT-001** vs. 11.51 m ya en catálogo |
| Manga | 11ft | **3.35 m** | axopar.com | Confirma valor ya en catálogo |
| Calado a hélices | 2ft 9in | **0.85 m** | búsqueda site:axopar.com | axopar.com — dato nuevo |
| Peso (excl. motor) | 8,311 lbs | **3,770 kg** | axopar.com + pricelist (doble corroboración) | axopar.com — dato nuevo |

## Capacidades

| Campo | Valor | Fuente | Confianza |
|---|---|---|---|
| Combustible | 730 L (193 gal) | búsqueda site:axopar.com | axopar.com — dato nuevo |
| Agua dulce | 100 L | búsqueda mixta | ⚠️ Atribución de dominio no verificada — tratar como candidato |
| Pasajeros | B:10 / C:12 (según categoría de navegación) | búsqueda site:axopar.com | axopar.com — dato nuevo |
| Camarotes/literas | 2 personas de serie (cabina proa); +2 con Aft Cabin opcional | búsqueda site:axopar.com | Refina dato existente ("1 — UNCONFIRMED") |
| Baños | 1 baño eléctrico de agua dulce, layout configurable | búsqueda mixta | ⚠️ Atribución de dominio no verificada |

## Performance y motorización

| Campo | Valor | Fuente | Confianza |
|---|---|---|---|
| Velocidad máxima | 38 – 48 nudos | búsqueda site:axopar.com | axopar.com ⚠️ **CONFLICT-002** vs. cifra de 56 nudos con motorización V10 400 |
| Motorización gasolina (fuera de borda) | 2 x 300 – 2 x 400 hp | búsqueda site:axopar.com — **coincide exacto** con dato ya en catálogo | Doble corroboración ⚠️ **CONFLICT-003** vs. cifra de 2x225-2x350hp en búsqueda menos confiable |
| Motorización diésel opcional | 2 x Cox CXO 300 hp (fuera de borda diésel) | 2 notas de prensa oficiales independientes | axopar.com — dato nuevo, alta confianza relativa (2 fuentes) |
| Consumo en crucero | 2.3 L/nm a 28 nudos (2x300hp Mercury) | búsqueda mixta | ⚠️ Atribución de dominio no verificada |
| Autonomía de crucero | 250 nm a 30 nudos (2x300hp Mercury V8) | búsqueda mixta | ⚠️ Atribución de dominio no verificada |
| Clasificación de navegación | B – Offshore / C – Coastal | búsqueda site:axopar.com | axopar.com — dato nuevo |

## Construcción

| Campo | Valor | Fuente | Confianza |
|---|---|---|---|
| Diseño de casco | Doble escalón (stepped), V 20°, proa de entrada afilada | búsqueda site:axopar.com | axopar.com — dato nuevo |
| Material | PRFV, laminado a mano, primera capa Vinylester (anti-ósmosis) | búsqueda mixta | ⚠️ Atribución de dominio no verificada |

## Conflictos sin resolver (ver detalle completo en specifications.json)

1. **CONFLICT-001** — Eslora: 11.51 m (catálogo, Fase 2) vs. 11.50 m (este piloto). Diferencia de 1 cm, probable redondeo de conversión, no resuelto.
2. **CONFLICT-002** — Velocidad máxima: 38-48 nudos (rango general) vs. hasta 56 nudos (motorización V10 400 tope), no resuelto — pueden no ser contradictorios pero no se asume.
3. **CONFLICT-003** — Rango de HP: 2x300-2x400hp (doble corroboración) vs. 2x225-2x350hp (fuente menos confiable), no resuelto.

## Campos que siguen sin dato (UNKNOWN)

Ninguna fuente de esta pasada aportó: velocidad de crucero exacta en nudos (solo la de consumo específico a 28-30kn con motor concreto), consumo de combustible general (solo el dato puntual arriba).
