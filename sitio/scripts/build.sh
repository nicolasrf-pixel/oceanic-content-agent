#!/usr/bin/env bash
# OCEANIC · Build de Cloudflare Pages (Build command: bash scripts/build.sh, Root directory: sitio).
# Instala la herramienta de imágenes FUERA del sitio (para que no se publique) y descarga las fotos.
set -euo pipefail
cd "$(dirname "$0")/.."

HERRAMIENTAS="${TMPDIR:-/tmp}/oceanic-build"
mkdir -p "$HERRAMIENTAS"
npm install --prefix "$HERRAMIENTAS" --no-audit --no-fund --loglevel=error sharp@0.33.5

node scripts/fotos.mjs --sharp="$HERRAMIENTAS" "$@"

# ---------- Dominio y lanzamiento (variables de build en Cloudflare: Settings › Build › Variables) ----------
# SITIO_URL=https://oceanic.cl  → las URL absolutas (vista previa al compartir, canónicas, sitemap) pasan a ese dominio.
# LANZADO=1                     → Google puede indexar: robots.txt abierto y sin la cabecera noindex.
VISTA="https://oceanic.narf.workers.dev"
if [ -n "${SITIO_URL:-}" ] && [ "${SITIO_URL%/}" != "$VISTA" ]; then
  DESTINO="${SITIO_URL%/}"
  grep -rl --include='*.html' --include='sitemap.xml' "$VISTA" . --exclude-dir=node_modules --exclude-dir=.wrangler \
    | xargs -r sed -i "s#${VISTA}#${DESTINO}#g"
  echo "Dominio del sitio: ${DESTINO}"
fi
if [ "${LANZADO:-}" = "1" ]; then
  printf 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /gracias/\nSitemap: %s/sitemap.xml\n' "${SITIO_URL:-$VISTA}" > robots.txt
  sed -i '/VISTA PREVIA: quitar esta línea/d; /X-Robots-Tag: noindex, nofollow/d' _headers
  echo "Sitio lanzado: indexación abierta"
fi
