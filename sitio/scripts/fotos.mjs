// OCEANIC · Descarga y optimiza las fotos del sitio (corre en el build de Cloudflare, vía scripts/build.sh).
// Lee scripts/fotos.tsv (destino, URL web, URL original) y escribe assets/img/<destino>:
// WebP de 1600 px de lado mayor (2560 px las portadas "-hero"), calidad 75, igual que la biblioteca.
// Descarga varias a la vez, salta las que ya existen y nunca hace fallar el build: una foto que no baja
// se omite y el sitio oculta su contenedor.
// Uso:  node scripts/fotos.mjs [--sharp=<carpeta con node_modules/sharp>] [--solo=<texto en el destino>]
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const require = createRequire(path.resolve(args.sharp || '.', 'package.json'));
const sharp = require('sharp');
sharp.concurrency(1);

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const IMG = path.join(RAIZ, 'assets', 'img');
const PARALELO = 12;
const ESPERA_MS = 45000;
const MAX_BYTES = 40 * 1024 * 1024; // nunca bajar originales gigantes

const filas = (await readFile(path.join(RAIZ, 'scripts', 'fotos.tsv'), 'utf8'))
  .trim().split('\n').slice(1).map((l) => l.split('\t'))
  .filter(([destino]) => !args.solo || destino.includes(args.solo));

const stats = { ok: 0, existentes: 0, fallidas: 0 };
const fallasPorHost = {};

async function existe(f) { try { await access(f); return true; } catch { return false; } }

async function bajar(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ESPERA_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const largo = +r.headers.get('content-length') || 0;
    if (largo > MAX_BYTES) throw new Error('demasiado grande');
    if (!/^image\//.test(r.headers.get('content-type') || '')) throw new Error('no es imagen');
    return Buffer.from(await r.arrayBuffer());
  } finally { clearTimeout(t); }
}

async function procesar([destino, url]) {
  const salida = path.join(IMG, destino);
  if (await existe(salida)) { stats.existentes++; return; }
  try {
    const datos = await bajar(url);
    const lado = destino.endsWith('-hero.webp') ? 2560 : 1600;
    // Tope de peso (velocidad de carga): si la foto pasa del máximo, se recomprime con menos calidad, sin achicarla.
    const tope = lado === 2560 ? 420 * 1024 : 300 * 1024;
    let buf;
    for (const q of [75, 68, 60, 54]) {
      let img = sharp(datos, { failOn: 'none' }).rotate()
        .resize({ width: lado, height: lado, fit: 'inside', withoutEnlargement: true });
      img = /\.jpe?g$/i.test(destino) ? img.jpeg({ quality: q, mozjpeg: true }) : img.webp({ quality: q, effort: 5 });
      buf = await img.toBuffer();
      if (buf.length <= tope) break;
    }
    await mkdir(path.dirname(salida), { recursive: true });
    await writeFile(salida, buf);
    stats.ok++;
  } catch (e) {
    stats.fallidas++;
    let host; try { host = new URL(url).host; } catch { host = 'URL inválida'; }
    fallasPorHost[host] = (fallasPorHost[host] || 0) + 1;
  }
}

const inicio = Date.now();
console.log(`Fotos: ${filas.length} en la lista, ${PARALELO} descargas a la vez…`);
let i = 0;
await Promise.all(Array.from({ length: PARALELO }, async () => {
  while (i < filas.length) {
    const fila = filas[i++];
    await procesar(fila);
    const hechas = stats.ok + stats.existentes + stats.fallidas;
    if (hechas % 250 === 0) console.log(`  ${hechas}/${filas.length}`);
  }
}));
console.log(`Fotos listas en ${Math.round((Date.now() - inicio) / 1000)} s: ${stats.ok} nuevas, ` +
  `${stats.existentes} ya estaban, ${stats.fallidas} no se pudieron bajar.`);
if (stats.fallidas) console.log('  Fallidas por origen:', JSON.stringify(fallasPorHost));
