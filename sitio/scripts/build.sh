#!/usr/bin/env bash
# OCEANIC · Build de Cloudflare Pages (Build command: bash scripts/build.sh, Root directory: sitio).
# Instala la herramienta de imágenes FUERA del sitio (para que no se publique) y descarga las fotos.
set -euo pipefail
cd "$(dirname "$0")/.."

HERRAMIENTAS="${TMPDIR:-/tmp}/oceanic-build"
mkdir -p "$HERRAMIENTAS"
npm install --prefix "$HERRAMIENTAS" --no-audit --no-fund --loglevel=error sharp@0.33.5

node scripts/fotos.mjs --sharp="$HERRAMIENTAS" "$@"
