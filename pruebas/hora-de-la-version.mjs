/* Fila 549 (docs/549-HORA-DE-LA-VERSION.md): la hora de App.VERSION nunca va por delante de la real.
   Sin navegador: lee js/version.js y compara con el reloj de España. */
import { readFileSync } from 'node:fs';
import { horaDeEspana } from '../scripts/version-al-publicar.mjs';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const TOLERANCIA_MIN = 15;
let fallos = 0;
function comprobar(titulo, ok, detalle) {
  if (ok) console.log('bien   ' + titulo);
  else { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
}
/* «6-nov-2026 · 05:24» → 202611060524 (comparable). */
function clave(version) {
  const m = /^(\d{1,2})-([a-z]{3})-(\d{4}) · (\d{2}):(\d{2})$/.exec(version);
  if (!m || MESES.indexOf(m[2]) < 0) return null;
  const mes = String(MESES.indexOf(m[2]) + 1).padStart(2, '0');
  return Number(m[3] + mes + m[1].padStart(2, '0') + m[4] + m[5]);
}

const texto = readFileSync(new URL('../js/version.js', import.meta.url), 'utf8');
const m = /^App\.VERSION = '([^']*)';$/m.exec(texto);
comprobar('1. js/version.js tiene la línea App.VERSION', !!m);
const version = m ? m[1] : '';
const k = clave(version);
comprobar('2. la versión tiene el formato «6-nov-2026 · 05:24»', k !== null, 'sale: ' + version);

const limite = clave(horaDeEspana(new Date(Date.now() + TOLERANCIA_MIN * 60000)));
comprobar('3. la versión no está más de ' + TOLERANCIA_MIN + ' minutos por delante de la hora real de España',
  k !== null && k <= limite, 'versión: ' + version + ' · hora real de España: ' + horaDeEspana(new Date()) + ' · escríbela con: node scripts/poner-version.mjs');

/* La prueba sabe frenar una hora por delante: una hora 1 h adelantada se detecta. */
const adelantada = clave(horaDeEspana(new Date(Date.now() + 60 * 60000)));
comprobar('4. una hora puesta a mano 1 h por delante de la real se detectaría', adelantada > limite);

console.log(fallos ? '\n' + fallos + ' fallo(s)' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
