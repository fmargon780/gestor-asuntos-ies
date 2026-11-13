/* Fila 633 (docs/633-PRUEBAS-CON-SUS-PAQUETES.md): la comprobación de paquetes
   de `npm test` dice «nada falta» con todo en su sitio y nombra el paquete
   cuando falta su carpeta o cuando la versión no casa. Sin `npm ci` ni red. */
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { paquetesQueFaltan } from './apoyo/paquetes.mjs';

function montar(instalados) {
  const raiz = mkdtempSync(join(tmpdir(), 'paquetes-'));
  writeFileSync(join(raiz, 'package.json'), JSON.stringify({ devDependencies: { uno: '^1.0.0', dos: '2.0.0' } }));
  writeFileSync(join(raiz, 'package-lock.json'), JSON.stringify({ packages: {
    '': {}, 'node_modules/uno': { version: '1.2.3' }, 'node_modules/dos': { version: '2.0.0' } } }));
  for (const [n, v] of Object.entries(instalados)) {
    mkdirSync(join(raiz, 'node_modules', n), { recursive: true });
    writeFileSync(join(raiz, 'node_modules', n, 'package.json'), JSON.stringify({ name: n, version: v }));
  }
  return raiz;
}

const carpetas = [];
try {
  let r = montar({ uno: '1.2.3', dos: '2.0.0' }); carpetas.push(r);
  assert.deepEqual(paquetesQueFaltan(r), [], 'con todo instalado no falta nada');

  r = montar({ uno: '1.2.3' }); carpetas.push(r);
  assert.deepEqual(paquetesQueFaltan(r), ['dos'], 'nombra el paquete que no tiene carpeta');

  r = montar({ uno: '1.2.3', dos: '2.0.1' }); carpetas.push(r);
  assert.deepEqual(paquetesQueFaltan(r), ['dos'], 'nombra el paquete cuya versión no casa');

  r = mkdtempSync(join(tmpdir(), 'paquetes-')); carpetas.push(r);
  writeFileSync(join(r, 'package.json'), JSON.stringify({ devDependencies: { uno: '1.0.0' } }));
  assert.deepEqual(paquetesQueFaltan(r), ['uno'], 'sin node_modules faltan todos');
  console.log('OK paquetes-antes-de-probar');
} finally {
  for (const c of carpetas) rmSync(c, { recursive: true, force: true });
}
