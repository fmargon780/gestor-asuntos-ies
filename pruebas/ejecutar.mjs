/* Ejecuta todas las pruebas de esta carpeta, una detrás de otra.

   Levanta un servidor local con la aplicación (python3 -m http.server)
   para las pruebas que necesitan un navegador de verdad, y lo para al
   terminar, tanto si todo ha ido bien como si no.

   Se usa con `npm test`. Falla (código de salida distinto de 0) si
   falla cualquiera de las pruebas. */
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CARPETA = fileURLToPath(new URL('.', import.meta.url));
const PUERTO = 8123;
const DIRECCION = `http://localhost:${PUERTO}/index.html`;

const pruebas = readdirSync(CARPETA)
  .filter((f) => f.endsWith('.mjs') && f !== 'ejecutar.mjs')
  .sort();

function esperar(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function servidorListo() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(DIRECCION);
      if (r.ok) return true;
    } catch (e) { /* todavía no está arriba */ }
    await esperar(200);
  }
  return false;
}

function ejecutarUna(fichero) {
  return new Promise((resolver) => {
    const hijo = spawn(process.execPath, [CARPETA + fichero], {
      stdio: 'inherit',
      env: Object.assign({}, process.env, { DIRECCION })
    });
    hijo.on('exit', (codigo) => resolver(codigo === 0));
  });
}

const servidor = spawn('python3', ['-m', 'http.server', String(PUERTO)], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  stdio: 'ignore'
});

let salida = 0;
try {
  if (!(await servidorListo())) {
    console.log('El servidor local no ha arrancado.');
    process.exit(1);
  }

  for (const fichero of pruebas) {
    console.log('\n=== ' + fichero + ' ===');
    const ok = await ejecutarUna(fichero);
    if (!ok) { console.log(fichero + ' ha fallado.'); salida = 1; }
  }
} finally {
  servidor.kill();
}

console.log(salida ? '\nAlguna prueba ha fallado.' : '\nTodas las pruebas pasan.');
process.exit(salida);
