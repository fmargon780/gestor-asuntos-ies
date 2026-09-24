/* ============================================================
   version-al-publicar.mjs — la hora de la versión, escrita sola al
   publicar en Vercel (fila 76, 25-sep-2026, docs/VERSION-AL-PUBLICAR.md).

   vercel.json lo llama como `buildCommand`: dentro del propio proceso
   de publicación cambia la línea `App.VERSION = '...';` de
   js/version.js por la hora de España de ese momento. Solo toca la
   copia que Vercel va a servir: NUNCA hace un commit, y el fichero que
   queda en git no cambia (así no hay nada que pueda disparar una
   publicación detrás de otra).

   Pase lo que pase, no rompe la publicación: si algo falla, se queda la
   fecha escrita a mano en js/version.js y sale con 0. Sin Vercel de
   por medio (index.html abierto en local, o la copia sin internet de
   scripts/copia-local.mjs) no se ejecuta, y vale la escrita a mano.
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function horaDeEspana(fecha) {
  const partes = {};
  new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).formatToParts(fecha).forEach((p) => { partes[p.type] = p.value; });
  return partes.day + '-' + MESES[Number(partes.month) - 1] + '-' + partes.year + ' · ' + partes.hour + ':' + partes.minute;
}

export function ponerVersion(textoJs, version) {
  const re = /^App\.VERSION = '[^']*';$/m;
  if (!re.test(textoJs)) return null;
  return textoJs.replace(re, "App.VERSION = '" + version + "';");
}

function principal() {
  try {
    const ruta = new URL('../js/version.js', import.meta.url);
    const antes = readFileSync(ruta, 'utf8');
    const version = horaDeEspana(new Date());
    const despues = ponerVersion(antes, version);
    if (!despues) {
      console.log('version-al-publicar: no encuentro la línea App.VERSION; se queda la escrita a mano.');
      return;
    }
    writeFileSync(ruta, despues);
    console.log('version-al-publicar: App.VERSION = ' + version);
  } catch (e) {
    console.log('version-al-publicar: no he podido ponerla (' + (e && e.message) + '); se queda la escrita a mano.');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) principal();
