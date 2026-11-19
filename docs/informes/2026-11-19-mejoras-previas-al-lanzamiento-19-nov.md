# Informe de actualización · Mejoras previas al lanzamiento (19 nov)

- **Fecha:** 2026-11-19
- **Regla:** informe obligatorio desde el lanzamiento (2026-12-01 00:00 (hora de Chile)).
- **Versión publicada:** `—` (desde `—`)
- **Alcance:** sin cambios

## Qué se mejoró y por qué

- **Administrador:** rediseño con barra lateral azul noche, íconos, métricas en el inicio, botones y acentos de la marca y ayudas al pasar el mouse en cada elemento; nueva sección **CRM · Leads** propia: guarda los leads que llegan por los formularios desde el 1 de diciembre 00:00 (también quedan en Brevo), con etapas, notas y eliminación (Ley 21.719).
- **Portafolio:** el orden de las marcas (prioridad interna: Beneteau, Lagoon, Axopar…) y las categorías se manejan desde el administrador; una marca o categoría sin autorizar no aparece en ninguna parte del sitio.
- **Menú de marcas:** panel más ancho y moderno, con la prioridad interna en todas las categorías. Logo de la barra principal más grande.
- **Revisar marcas:** las marcas nuevas se suman al scraping con su web oficial y Solaris tiene un aviso externo de modelos nuevos (sin eludir su captcha).
- **Inicio:** bloque «¿Dónde estás en tu decisión?» con las 4 tarjetas alineadas y más diseño.
- **Puerto:** se trajo del sitio viejo la edición de **noviembre 2026** (4 notas con sus fotos y enlaces a las fichas).
- **Héroes de las fichas:** 17 fichas (15 Aquila, Lagoon 47 y XO DSCVR 9 T-Top) quedaban con la portada en blanco porque su mejor foto oficial no llegaba a 1500 px; ahora el héroe acepta desde 1400 px (el banner oficial de Aquila mide 1440) y XO DSCVR 9 T-Top usa una foto oficial de 1920 px. La foto del héroe además se pide de inmediato (antes era diferida y tardaba en aparecer).
- **Por qué:** dejar el sitio y su administrador listos para operar solos desde el lanzamiento (1 dic 00:00), con menos pasos manuales y sin entrar a Brevo para ver leads.

## Dónde se tocó

- (sin archivos)

## Cambios (commits)


## Verificación

- [x] Pruebas del sitio (91 pasan) (`cd sitio && node --test tests/*.test.mjs`)
- [x] Pruebas de herramientas (47 pasan) (`cd tools && python3 -m unittest discover -s tests`)
- [ ] Despliegue en verde (Workers Builds) y revisión en vivo

## Cómo volver atrás

`git revert —` (o desde el administrador: Historial → Restaurar como borrador, para contenido).

## Pendientes o riesgos

- (ninguno / completar)
