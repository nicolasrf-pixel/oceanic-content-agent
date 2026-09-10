# Changelog de representadas

Registro de diferencias detectadas entre el universo inicial de marcas
(`data/brands/initial-universe.md`) y lo verificado contra fuentes
oficiales/autorizadas. Regla: nunca se modifica la lista inicial en
silencio (CLAUDE.md sección 20). Cada entrada documenta marca, situación
detectada, fuente, fecha y acción recomendada.

---

## 2026-09-10 — Skeeta: estado ambiguo, posible discrepancia

- **Marca:** Skeeta
- **Situación detectada:** En el universo inicial, Skeeta aparece como
  representada al mismo nivel que Axopar, Saffier, Solaris, etc. Sin
  embargo, en esta pasada de investigación, la única URL encontrada en
  `oceanic.cl` para Skeeta es `https://oceanic.cl/usados/skeeta/`
  (sección de **usados / brokerage**), a diferencia de las demás marcas
  del universo inicial, que tienen una página de marca activa dedicada
  (ej. `/saffier-yachts/`, `/solaris-yachts/`, `/vela/vxone/`). No se
  encontró evidencia de una página de catálogo de Skeeta como línea nueva
  vigente.
- **Fuente:** búsqueda web (`site:oceanic.cl Skeeta`), snippet de
  `oceanic.cl/usados/skeeta/`. Nivel 2 (autorizada), método
  `web_search_snippet` — no hubo fetch directo de la página.
- **Fecha:** 2026-09-10
- **Acción recomendada:** No eliminar a Skeeta del universo de
  representadas. Antes de investigación masiva de modelos (Fase 2) para
  esta marca, se recomienda: (a) fetch directo de `oceanic.cl` para
  confirmar si existe página de marca activa no indexada por la búsqueda,
  o (b) verificación humana directa con Oceanic sobre si Skeeta sigue
  siendo una representada activa de embarcaciones nuevas, o si hoy solo
  aparece en el inventario de usados/brokerage (lo que sugeriría
  `portfolio_status = DISCONTINUED` en vez de `ACTIVE`). Mientras tanto,
  el inventario la mantiene en `portfolio_status: UNCONFIRMED`,
  `confidence_level: LOW`, `discrepancy_flag: true`.

---

## 2026-09-10 — Skeeta: discrepancia resuelta por decisión humana

- **Marca:** Skeeta
- **Situación:** La entrada anterior de este changelog (más abajo, "Skeeta:
  estado ambiguo") marcaba `portfolio_status: UNCONFIRMED` y
  `confidence_level: LOW` porque la única URL de `oceanic.cl` encontrada
  vía búsqueda apuntaba a la sección de usados/brokerage.
- **Fuente de la resolución:** decisión explícita del usuario/propietario
  del proyecto, 2026-09-10: "Skeeta sigue vigente como línea nueva y debe
  mantenerse dentro del portfolio activo de representadas. No debe
  clasificarse como solo-usados."
- **Fecha:** 2026-09-10
- **Acción aplicada:** `master-inventory.json` actualizado —
  `portfolio_status: ACTIVE`, `discrepancy_flag: false`, con la decisión
  registrada en el campo `human_decisions` del propio registro de marca
  (trazable, no un cambio silencioso). `confidence_level` se mantiene
  `MEDIUM`: la decisión resuelve el estado de representación, pero no
  sustituye la verificación por fuente primaria/oficial vía fetch directo,
  que sigue pendiente (ver limitación de red, sección siguiente y
  CLAUDE.md sección 22).

---

## 2026-09-10 — XO Boats y Switch: sin página de marca dedicada confirmada

- **Marca:** XO Boats, Switch (Switch One Design)
- **Situación detectada:** Ambas marcas se confirmaron como activas por
  menciones recurrentes en los boletines "Puerto" de Oceanic (varios
  meses de 2026), pero no se localizó, en esta pasada, una URL de página
  de marca dedicada tipo `/xo-boats/` o `/switch/` en `oceanic.cl` (a
  diferencia de Axopar, Aquila, Solaris, Saffier, etc.). Esto **no** se
  interpreta como señal de que hayan dejado de ser representadas — la
  evidencia de representación activa es consistente — sino como un vacío
  de cobertura de esta pasada de búsqueda (posible limitación de
  indexación, o páginas con slugs distintos a los buscados).
- **Fuente:** boletines `oceanic.cl/puerto-junio-2026/` y
  `oceanic.cl/puerto-julio-2026/`. Nivel 2, método `web_search_snippet`.
- **Fecha:** 2026-09-10
- **Acción recomendada:** Confirmar URL exacta de página de marca para
  ambas mediante fetch directo del menú de navegación de `oceanic.cl`
  antes de avanzar a Fase 2 para estas dos marcas. No requiere acción
  sobre el universo de representadas (ambas se mantienen).

---

## 2026-09-10 — Sin marcas nuevas ni reemplazos detectados

No se encontró evidencia de: (a) marcas del universo inicial que hayan
sido reemplazadas por otra, ni (b) representadas adicionales de
embarcaciones fuera de las 11 del universo inicial. Se detectaron marcas
de **equipamiento** (Lowrance, Seldén, Lewmar, North Sails, Nautix, VELO)
distribuidas por Oceanic, que se excluyen del alcance del proyecto por no
ser constructores de embarcaciones (CLAUDE.md sección 2.5) — esto no se
trata como discrepancia sino como exclusión de alcance documentada.

Esta conclusión está limitada por el mismo motivo de acceso a red descrito
en CLAUDE.md sección 22: se basa en búsqueda indexada, no en una lectura
completa y sistemática del menú/navegación del sitio. Se recomienda
repetir esta verificación con fetch directo antes de considerarla
definitiva.
