/* Ejecuta las pruebas de esta carpeta, varias a la vez (fila 208,
   27-sep-2026, docs/PRUEBAS-MAS-RAPIDAS.md).

   Levanta un solo servidor local con la aplicación (python3 -m
   http.server) para las pruebas que necesitan un navegador de
   verdad, compartido por todas, y lo para al terminar, tanto si todo
   ha ido bien como si no.

   Cuántas a la vez: `PRUEBAS_A_LA_VEZ`, o si no está puesta,
   `os.availableParallelism()` menos uno (deja un núcleo libre para este
   mismo proceso y el servidor), con un mínimo de 2 y un máximo de 6.

   Con palabras en la línea de comandos (`node pruebas/ejecutar.mjs
   hito mesa`), solo se lanzan los ficheros cuyo nombre contiene
   alguna de esas palabras. Sin palabras, todas.

   La salida de cada prueba se guarda entera y se imprime de un tirón
   al terminar esa prueba, para que no se mezcle con la de las demás
   que van a la vez. Al final, un resumen: cuántas pasan, cuáles
   fallan y cuánto ha tardado la tanda entera.

   Se usa con `npm test`. Falla (código de salida distinto de 0) si
   falla cualquiera de las pruebas. */
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';

const CARPETA = fileURLToPath(new URL('.', import.meta.url));
const PUERTO = 8123;
const DIRECCION = `http://localhost:${PUERTO}/index.html`;

const PALABRAS = process.argv.slice(2);

const todasLasPruebas = readdirSync(CARPETA)
  .filter((f) => f.endsWith('.mjs') && f !== 'ejecutar.mjs')
  .sort();

const pruebas = PALABRAS.length
  ? todasLasPruebas.filter((f) => PALABRAS.some((p) => f.includes(p)))
  : todasLasPruebas;

if (PALABRAS.length) {
  console.log('Solo las pruebas de: ' + PALABRAS.join(', ') + ' (' + pruebas.length + ' de ' + todasLasPruebas.length + ')\n');
}

/* Estas dos comprueban tiempos finos (como mucho una relectura, un
   aviso que no se repite) y, yendo la máquina a tope de CPU (todos los
   núcleos ocupados a la vez), alguna tanda fallaba solo por eso, aunque
   la app estuviera bien (en solitario, 3 de 3 en verde). Van aquí para
   que corran sin competir por CPU, al final, después de todas las
   demás. Si alguna prueba futura tuviera el mismo problema, su nombre
   va también aquí. */
const EN_SOLITARIO = ['documentos-sueltos.mjs', 'ha-llegado-sustituye-la-vista.mjs', 'repintar-solo-lo-que-cambia.mjs', 'hito-desde-por-clasificar.mjs',
  'ajustes-por-tipo.mjs', 'mesa-comunicar-del-paso-y-guion.mjs', 'tras-cada-accion.mjs', 'notas-asunto-no-se-borran.mjs',
  'refresco.mjs', 'hito-mesa.mjs', 'responsable-organismo.mjs', 'ha-llegado-sustituye-la-vista.mjs', 'aspirantes-numero.mjs', 'tipos-nombre.mjs', 'por-liquidar.mjs'];

function tope() {
  const n = parseInt(process.env.PRUEBAS_A_LA_VEZ, 10);
  if (n > 0) return n;
  return Math.min(6, Math.max(2, availableParallelism() - 1));
}

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

/* Guarda la salida entera (stdout + stderr, en el orden en que llega)
   en vez de heredar la consola, para poder imprimirla de un tirón al
   terminar, sin mezclarse con la de otra prueba que vaya a la vez. */
function ejecutarUna(fichero) {
  return new Promise((resolver) => {
    const trozos = [];
    const hijo = spawn(process.execPath, [CARPETA + fichero], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: Object.assign({}, process.env, { DIRECCION })
    });
    hijo.stdout.on('data', (d) => trozos.push(d));
    hijo.stderr.on('data', (d) => trozos.push(d));
    hijo.on('exit', (codigo) => resolver({ fichero: fichero, ok: codigo === 0, salida: Buffer.concat(trozos).toString('utf8') }));
  });
}

/* Un tope de procesos a la vez: cada hueco que se libera coge la
   siguiente prueba de la lista, hasta que no queda ninguna. */
async function ejecutarEnParalelo(lista, cuantosALaVez) {
  const resultados = [];
  let siguiente = 0;
  async function hueco() {
    while (siguiente < lista.length) {
      const fichero = lista[siguiente++];
      const r = await ejecutarUna(fichero);
      console.log('\n=== ' + r.fichero + ' ===');
      process.stdout.write(r.salida);
      if (!r.ok) console.log(r.fichero + ' ha fallado.');
      resultados.push(r);
    }
  }
  const huecos = [];
  for (let i = 0; i < Math.min(cuantosALaVez, lista.length); i++) huecos.push(hueco());
  await Promise.all(huecos);
  return resultados;
}

const servidor = spawn('python3', ['-m', 'http.server', String(PUERTO)], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  stdio: 'ignore'
});

const empiezan = Date.now();
let resultados = [];
try {
  if (!(await servidorListo())) {
    console.log('El servidor local no ha arrancado.');
    process.exit(1);
  }

  const cuantosALaVez = tope();
  const enParalelo = pruebas.filter((f) => !EN_SOLITARIO.includes(f));
  const solas = pruebas.filter((f) => EN_SOLITARIO.includes(f));

  console.log(enParalelo.length + ' pruebas en paralelo (' + cuantosALaVez + ' a la vez)' +
    (solas.length ? ', y ' + solas.length + ' en solitario al final' : '') + '.');

  resultados = resultados.concat(await ejecutarEnParalelo(enParalelo, cuantosALaVez));
  for (const fichero of solas) {
    const r = await ejecutarUna(fichero);
    console.log('\n=== ' + r.fichero + ' ===');
    process.stdout.write(r.salida);
    if (!r.ok) console.log(r.fichero + ' ha fallado.');
    resultados.push(r);
  }
} finally {
  servidor.kill();
}

const fallos = resultados.filter((r) => !r.ok).map((r) => r.fichero);
const segundos = ((Date.now() - empiezan) / 1000).toFixed(1);

console.log('\n' + resultados.length + ' pruebas, ' + (resultados.length - fallos.length) + ' bien, ' +
  fallos.length + ' fallos, ' + segundos + ' s.');
if (fallos.length) console.log('Fallan: ' + fallos.join(', '));
console.log(fallos.length ? '\nAlguna prueba ha fallado.' : '\nTodas las pruebas pasan.');
process.exit(fallos.length ? 1 : 0);
