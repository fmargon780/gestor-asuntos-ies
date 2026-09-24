/* Prueba de la fila 76 (25-sep-2026, docs/VERSION-AL-PUBLICAR.md), sin
   navegador: la hora de la versión se escribe sola al publicar en
   Vercel (scripts/version-al-publicar.mjs, `buildCommand` de
   vercel.json), sin ningún commit.

   1. La hora es la de España, en invierno y en verano, y cambia de día
      y de año a medianoche de España (no de UTC).
   2. Solo cambia la línea App.VERSION; sin ella, no rompe nada.
   3. vercel.json lo llama como buildCommand y el ignoreCommand sigue igual.
   4. Ejecutado sobre una copia, escribe la hora en la copia y el
      js/version.js del repositorio no cambia. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { horaDeEspana, ponerVersion } from '../scripts/version-al-publicar.mjs';

const raiz = new URL('../', import.meta.url).pathname;
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* 1 */
comprobar('1. invierno: UTC+1', horaDeEspana(new Date('2026-01-15T12:05:00Z')), '15-ene-2026 · 13:05');
comprobar('1. verano: UTC+2', horaDeEspana(new Date('2026-07-15T12:05:00Z')), '15-jul-2026 · 14:05');
comprobar('1. nochevieja a las 23:30 UTC ya es año nuevo en España', horaDeEspana(new Date('2026-12-31T23:30:00Z')), '01-ene-2027 · 00:30');
comprobar('1. medianoche sale como 00, nunca 24', horaDeEspana(new Date('2026-09-24T22:00:00Z')), '25-sep-2026 · 00:00');

/* 2 */
const js = fs.readFileSync(raiz + 'js/version.js', 'utf8');
const puesto = ponerVersion(js, '01-ene-2027 · 00:30');
comprobar('2. cambia solo la línea de la versión', [puesto.split('\n').length === js.split('\n').length,
  /App\.VERSION = '01-ene-2027 · 00:30';/.test(puesto),
  puesto.replace(/App\.VERSION = '[^']*';/, '') === js.replace(/App\.VERSION = '[^']*';/, '')], [true, true, true]);
comprobar('2. sin la línea, no toca nada', ponerVersion('// nada', 'x'), null);
comprobar('2. el js/version.js del repositorio lleva una fecha escrita, nunca vacía',
  /^App\.VERSION = '\d{2}-[a-z]{3}-\d{4} · \d{2}:\d{2}';$/m.test(js), true);

/* 3 */
const vercel = JSON.parse(fs.readFileSync(raiz + 'vercel.json', 'utf8'));
comprobar('3. buildCommand', vercel.buildCommand, 'node scripts/version-al-publicar.mjs');
comprobar('3. el ignoreCommand, igual que antes', vercel.ignoreCommand, 'bash scripts/vercel-ignore-build.sh');
comprobar('3. scripts/ se publica (si no, Vercel no encuentra el script)',
  fs.readFileSync(raiz + '.vercelignore', 'utf8').split('\n').some(l => l.trim() === 'scripts/'), false);

/* 4 */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'version-'));
fs.mkdirSync(path.join(tmp, 'js')); fs.mkdirSync(path.join(tmp, 'scripts'));
fs.copyFileSync(raiz + 'js/version.js', path.join(tmp, 'js/version.js'));
fs.copyFileSync(raiz + 'scripts/version-al-publicar.mjs', path.join(tmp, 'scripts/version-al-publicar.mjs'));
const salida = execFileSync(process.execPath, ['scripts/version-al-publicar.mjs'], { cwd: tmp, encoding: 'utf8' });
const enLaCopia = fs.readFileSync(path.join(tmp, 'js/version.js'), 'utf8').match(/App\.VERSION = '([^']*)';/)[1];
const ahora = horaDeEspana(new Date());
comprobar('4. en la copia, la hora de ahora (hora de España)', [enLaCopia.slice(0, 11), salida.indexOf('App.VERSION = ') !== -1], [ahora.slice(0, 11), true]);
comprobar('4. el del repositorio no cambia', fs.readFileSync(raiz + 'js/version.js', 'utf8'), js);
fs.rmSync(tmp, { recursive: true, force: true });

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
