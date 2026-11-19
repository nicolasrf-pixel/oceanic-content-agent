-- CRM propio: leads desde el lanzamiento (2026-12-01 00:00 Chile). El Worker crea estas tablas solas si faltan (functions/api/leads.js);
-- este archivo las deja documentadas y permite crearlas antes con `wrangler d1 migrations apply`.
CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, creado TEXT NOT NULL, actualizado TEXT NOT NULL, tipo TEXT NOT NULL, linea TEXT,
  nombre TEXT, email TEXT NOT NULL, telefono TEXT, via TEXT, motivo TEXT, marca TEXT, modelo TEXT, universo TEXT, ficha TEXT, origen TEXT, mensaje TEXT,
  detalle TEXT, categorias TEXT, puerto INTEGER NOT NULL DEFAULT 0, politica TEXT, etapa TEXT NOT NULL DEFAULT 'Nuevo', aviso_ok INTEGER NOT NULL DEFAULT 0,
  brevo TEXT NOT NULL DEFAULT 'pendiente');
CREATE INDEX IF NOT EXISTS idx_leads_creado ON leads (creado DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE TABLE IF NOT EXISTS lead_notas (id INTEGER PRIMARY KEY AUTOINCREMENT, lead_id INTEGER NOT NULL, fecha TEXT NOT NULL, quien TEXT NOT NULL, texto TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS crm_acciones (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT NOT NULL, quien TEXT NOT NULL, contacto TEXT NOT NULL, accion TEXT NOT NULL, valor TEXT);
