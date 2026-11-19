// Todos los scripts del sitio y del administrador deben compilar: un error de sintaxis deja una página en blanco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const archivos = [...fs.readdirSync('assets/js').map((f) => 'assets/js/' + f), 'admin/admin.js'].filter((f) => f.endsWith('.js'));
for (const f of archivos) {
  test('sintaxis: ' + f, () => {
    assert.doesNotThrow(() => new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }));
  });
}
