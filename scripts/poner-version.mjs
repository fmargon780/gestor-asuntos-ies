/* ============================================================
   poner-version.mjs — escribe en js/version.js la hora REAL de España
   (fila 549, 6-nov-2026, docs/549-HORA-DE-LA-VERSION.md).

   Cada fila lo ejecuta en vez de escribir la hora a mano:

       node scripts/poner-version.mjs

   Cambia la línea `App.VERSION = '...';` por el reloj de España de ese
   momento, con el formato de siempre (6-nov-2026 · 05:24). Reutiliza el
   cálculo de scripts/version-al-publicar.mjs.
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { horaDeEspana, ponerVersion } from './version-al-publicar.mjs';

function principal() {
  const ruta = new URL('../js/version.js', import.meta.url);
  const version = horaDeEspana(new Date()).replace(/^0/, '');  /* «6-nov», sin cero delante */
  const despues = ponerVersion(readFileSync(ruta, 'utf8'), version);
  if (!despues) {
    console.error('poner-version: no encuentro la línea App.VERSION en js/version.js.');
    process.exit(1);
  }
  writeFileSync(ruta, despues);
  console.log('poner-version: App.VERSION = ' + version);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) principal();
