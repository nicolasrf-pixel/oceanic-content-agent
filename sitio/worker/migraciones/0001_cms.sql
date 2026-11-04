-- OCEANIC CMS · esquema D1 (base "oceanic-cms"). Idempotente: se puede volver a aplicar.
-- Un documento = un archivo de datos del sitio (usados, puerto, publicacion, ficha:<marca>/<slug>, ...).
-- borrador → publicar copia el borrador a "publicado" en una sola operación (atómica) y queda en el historial.
CREATE TABLE IF NOT EXISTS documentos (
  clave         TEXT PRIMARY KEY,
  borrador      TEXT NOT NULL,
  publicado     TEXT,
  version       INTEGER NOT NULL DEFAULT 1,   -- sube con cada guardado (control de concurrencia)
  pub_version   INTEGER,                      -- versión del borrador que está publicada
  actualizado   TEXT NOT NULL,
  autor         TEXT,
  publicado_en  TEXT,
  publicado_por TEXT
);
CREATE TABLE IF NOT EXISTS historial (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  clave     TEXT NOT NULL,
  version   INTEGER NOT NULL,
  accion    TEXT NOT NULL,                    -- guardar | publicar | descartar | restaurar
  contenido TEXT NOT NULL,
  autor     TEXT,
  fecha     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS historial_clave ON historial (clave, id DESC);
CREATE TABLE IF NOT EXISTS medios (
  clave   TEXT PRIMARY KEY,                   -- ruta en KV, se sirve en /media/<clave>
  nombre  TEXT,
  tipo    TEXT,
  bytes   INTEGER,
  ancho   INTEGER,
  alto    INTEGER,
  subido  TEXT NOT NULL,
  autor   TEXT
);
