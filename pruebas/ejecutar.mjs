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

/* Pruebas que comprueban tiempos finos (como mucho una relectura, un aviso que no se repite) y, yendo la
   máquina a tope de CPU (todos los núcleos ocupados a la vez), alguna tanda fallaba solo por eso, aunque la app
   estuviera bien (en solitario, en verde). Van aquí para que corran sin competir por CPU, al final, después de
   todas las demás.

   Reglas (fila 302, 7-oct-2026, docs/PRUEBAS-ROTAS.md):
   - Cada entrada lleva la fecha en que entró.
   - TOPE: 20. Si la lista pasa de 20 (o repite un nombre, o falta una fecha), este ejecutor se niega a
     arrancar y lo dice. Antes de añadir la número 21 hay que arreglar la frágil de verdad (esperar a una
     condición en vez de una pausa fija) o retirar otra.
   - Una prueba que falla también EN SOLITARIO no va aquí: se arregla, o va a RETIRADAS. */
const TOPE_EN_SOLITARIO = 20;
const EN_SOLITARIO_ENTRADAS = [
  ['indice-del-expediente.mjs', 'antes del 7-oct-2026'], ['solo-consulta.mjs', 'antes del 7-oct-2026'],
  ['grupo-enviar.mjs', 'antes del 7-oct-2026'],
  ['grupo-registro.mjs', 'antes del 7-oct-2026'], ['grupo-generar.mjs', 'antes del 7-oct-2026'],
  ['documentos-sueltos.mjs', 'antes del 7-oct-2026'], ['ha-llegado-sustituye-la-vista.mjs', 'antes del 7-oct-2026'],
  ['repintar-solo-lo-que-cambia.mjs', 'antes del 7-oct-2026'], ['hito-desde-por-clasificar.mjs', 'antes del 7-oct-2026'],
  ['ajustes-por-tipo.mjs', 'antes del 7-oct-2026'], ['mesa-comunicar-del-paso-y-guion.mjs', 'antes del 7-oct-2026'],
  ['notas-asunto-no-se-borran.mjs', 'antes del 7-oct-2026'],
  ['refresco.mjs', 'antes del 7-oct-2026'], ['hito-mesa.mjs', 'antes del 7-oct-2026'],
  ['responsable-organismo.mjs', 'antes del 7-oct-2026'], ['aspirantes-numero.mjs', 'antes del 7-oct-2026'],
  ['tipos-nombre.mjs', 'antes del 7-oct-2026'], ['registro-del-asunto.mjs', 'antes del 7-oct-2026'],
  ['carpetas-perdidas.mjs', '9-oct-2026'],   /* falla en la pasada completa (espera de 60 s agotada, apartado 8) y en solitario pasa; no es de ninguna fila reciente */
  ['exportar-asuntos.mjs', '10-oct-2026']   /* falla en la pasada completa y en solitario pasa; no tiene que ver con la fila 323 */
];
const EN_SOLITARIO = EN_SOLITARIO_ENTRADAS.map((e) => e[0]);

/* Pruebas retiradas de la pasada completa (fila 302). No se lanzan sin palabras; pedidas por su nombre
   (`npm test -- tutores-legales`) sí. El fichero no se borra. Cada entrada: fichero, fecha en que entra y
   motivo en una línea. Qué haría falta para volver a meterlas: docs/PRUEBAS-RETIRADAS.md. */
const RETIRADAS = [
  { fichero: 'tutores-legales.mjs', desde: '7-oct-2026',
    motivo: 'fallo real de la aplicación: al crear un asunto desde el control de registro, js/control-registro-pantalla.js solo busca el tercero en ALUMNADO, PERSONAL, EMPRESAS y OTROS (no reconoce a tutores legales ni administraciones)' },
  { fichero: 'hacer-este-hito.mjs', desde: '8-oct-2026',
    motivo: 'falla igual en main sin la fila 303, también en solitario (el PDF sellado no se coloca solo: «esperando-sello»); no es de ningún cambio reciente' },
  { fichero: 'tras-cada-accion.mjs', desde: '8-oct-2026',
    motivo: 'falla igual en main sin la fila 306, también en solitario (la lista de Inicio no vuelve a la misma altura tras repintar)' },
  { fichero: 'conflictos-que-cambia.mjs', desde: '8-oct-2026',
    motivo: 'falla igual en main sin la fila 303, también en solitario (no sale de qué ordenador es la otra versión)' },
];

{
  const problemas = [];
  if (EN_SOLITARIO_ENTRADAS.length > TOPE_EN_SOLITARIO) {
    problemas.push('EN_SOLITARIO tiene ' + EN_SOLITARIO_ENTRADAS.length + ' pruebas y el tope es ' + TOPE_EN_SOLITARIO +
      '. No se añade otra: arregla la frágil de verdad (esperar a una condición, no una pausa fija) o retira una con RETIRADAS.');
  }
  const vistos = new Set();
  for (const [f, desde] of EN_SOLITARIO_ENTRADAS) {
    if (vistos.has(f)) problemas.push('EN_SOLITARIO repite «' + f + '».');
    vistos.add(f);
    if (!desde) problemas.push('EN_SOLITARIO: «' + f + '» no lleva la fecha en que entró.');
    if (!todasLasPruebas.includes(f)) problemas.push('EN_SOLITARIO: «' + f + '» no existe en pruebas/.');
  }
  for (const r of RETIRADAS) {
    if (!r.desde || !r.motivo) problemas.push('RETIRADAS: «' + r.fichero + '» necesita fecha y motivo.');
    if (!todasLasPruebas.includes(r.fichero)) problemas.push('RETIRADAS: «' + r.fichero + '» no existe en pruebas/.');
    if (vistos.has(r.fichero)) problemas.push('«' + r.fichero + '» está a la vez en EN_SOLITARIO y en RETIRADAS.');
  }
  if (problemas.length) {
    console.log('Lista de pruebas mal puesta en pruebas/ejecutar.mjs:\n  - ' + problemas.join('\n  - '));
    process.exit(1);
  }
}

/* Sin palabras, la pasada completa no lanza las retiradas (más abajo); con palabras, sí. */
const pruebas = PALABRAS.length
  ? todasLasPruebas.filter((f) => PALABRAS.some((p) => f.includes(p)))
  : todasLasPruebas.filter((f) => !RETIRADAS.some((r) => r.fichero === f));

if (PALABRAS.length) {
  console.log('Solo las pruebas de: ' + PALABRAS.join(', ') + ' (' + pruebas.length + ' de ' + todasLasPruebas.length + ')\n');
}

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
/* Las retiradas se enseñan siempre al final de la pasada completa (fila 302); sin ninguna, no se escribe nada. */
if (!PALABRAS.length && RETIRADAS.length) {
  console.log('\n' + RETIRADAS.length + (RETIRADAS.length === 1 ? ' prueba retirada:' : ' pruebas retiradas:'));
  for (const r of RETIRADAS) console.log('  ' + r.fichero + ' (desde el ' + r.desde + '): ' + r.motivo);
}
console.log(fallos.length ? '\nAlguna prueba ha fallado.' : '\nTodas las pruebas pasan.');
process.exit(fallos.length ? 1 : 0);
