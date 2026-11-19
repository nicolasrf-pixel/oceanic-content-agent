# Actualizaciones del sitio

**Fecha de lanzamiento aprobada:** 2026-12-01 00:00 (hora de Chile), en el dominio definitivo.
**Regla (decisión Oceanic 2026-11-19):** desde esa fecha todo ajuste está permitido siempre que sea una mejora, y **cada actualización lleva
un informe** (qué se mejoró y por qué, dónde se tocó, verificación y cómo volver atrás). Una actualización sin informe no se da por terminada.

## Cómo se hace
1. Se hace el cambio y se prueba (`cd sitio && node --test tests/*.test.mjs`, `cd tools && python3 -m unittest discover -s tests`).
2. Se publica en `sitio-web` y se comprueba que el despliegue (Workers Builds) quedó en verde.
3. Se genera el borrador del informe:
   ```bash
   python3 tools/informe_actualizacion.py --titulo "Nombre de la mejora" --desde 2026-12-01
   ```
   (`--desde` acepta una fecha o el commit anterior a la mejora; `--hasta` por defecto es HEAD). Deja el archivo en `docs/informes/` y lo agrega a la tabla de abajo.
4. Se completa el bloque «Qué se mejoró y por qué» (el borrador dice COMPLETAR) y se envía al cliente.

## Qué incluye cada informe
Fecha y versión publicada · qué se mejoró y por qué · áreas tocadas · commits · verificación (pruebas y despliegue) · cómo volver atrás · pendientes o riesgos.

## Informes
| Fecha | Informe |
|---|---|
| 2026-11-19 | [Mejoras previas al lanzamiento (19 nov)](informes/2026-11-19-mejoras-previas-al-lanzamiento-19-nov.md) |
