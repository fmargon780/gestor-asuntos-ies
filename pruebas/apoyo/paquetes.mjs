/* Comprueba que están instalados los paquetes que necesitan las pruebas
   (fila 633, 13-nov-2026, docs/633-PRUEBAS-CON-SUS-PAQUETES.md).

   Solo usa módulos propios de Node: no puede importar nada de
   `node_modules`, que es justo lo que comprueba. `npm test` lo ejecuta antes
   de `pruebas/ejecutar.mjs`. Si falta algún paquete de `devDependencies`
   (o su versión no es la de `package-lock.json`) lo instala con `npm ci`;
   si no puede, para con un solo mensaje y salida con error. Si no falta
   nada, no escribe nada. */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function leerJson(ruta) {
  try { return JSON.parse(readFileSync(ruta, 'utf8')); } catch { return null; }
}

/* Devuelve los nombres de los paquetes de `devDependencies` que faltan en
   `raiz/node_modules` o cuya versión no es la de `package-lock.json`. */
export function paquetesQueFaltan(raiz) {
  const paquete = leerJson(join(raiz, 'package.json'));
  const bloqueo = leerJson(join(raiz, 'package-lock.json'));
  const pedidos = Object.keys((paquete && paquete.devDependencies) || {});
  const enBloqueo = (bloqueo && bloqueo.packages) || {};
  const faltan = [];
  for (const nombre of pedidos) {
    const instalado = leerJson(join(raiz, 'node_modules', nombre, 'package.json'));
    const esperado = enBloqueo['node_modules/' + nombre];
    if (!instalado || (esperado && esperado.version && instalado.version !== esperado.version)) faltan.push(nombre);
  }
  return faltan;
}

/* Hace el trabajo: instala lo que falte. Devuelve el código de salida. */
export function asegurarPaquetes(raiz, { escribir = (t) => console.log(t), error = (t) => console.error(t) } = {}) {
  const faltan = paquetesQueFaltan(raiz);
  if (!faltan.length) return 0;
  escribir('Faltan paquetes para las pruebas: ' + faltan.join(', ') + '. Los instalo con npm ci…');
  const r = spawnSync('npm', ['ci'], {
    cwd: raiz, stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8',
    env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' },
    shell: process.platform === 'win32'
  });
  const siguen = r.status === 0 ? paquetesQueFaltan(raiz) : faltan;
  if (!siguen.length) return 0;
  error('No he podido instalar los paquetes que faltan para las pruebas (' + siguen.join(', ') +
    '), así que no lanzo ninguna prueba. Instálalos a mano con `npm ci` desde la raíz del proyecto' +
    ' (hace falta conexión a internet) y vuelve a lanzar `npm test`.');
  return 1;
}

const esPrincipal = process.argv[1] && existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (esPrincipal) {
  const raiz = fileURLToPath(new URL('../../', import.meta.url));
  process.exit(asegurarPaquetes(raiz));
}
