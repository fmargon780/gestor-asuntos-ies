/* Prueba sin navegador, del bloque 5 del plan de robustez.

   Los ficheros de js/ cuelgan sus funciones de App, y los <script> de
   index.html cargan en un orden fijo: si dos ficheros definen
   App.algoIgual, el segundo se come al primero sin ningún error ni
   aviso. Pasó de verdad con App.elegirTipo el 10-sep-2026 (ver
   docs/CONTEXTO.md).

   Esta prueba lee todos los js/*.js, busca las líneas que definen una
   función colgada de App, y falla si el mismo nombre aparece en dos
   ficheros distintos. */
import fs from 'node:fs';
import path from 'node:path';

const CARPETA_JS = new URL('../js/', import.meta.url).pathname;
const ficheros = fs.readdirSync(CARPETA_JS).filter((f) => f.endsWith('.js')).sort();

const PATRON = /^App\.(\w+)\s*=\s*(async\s+)?function\b/;

const dondeSeDefine = {};   /* nombre -> [ficheros] */

for (const fichero of ficheros) {
  const texto = fs.readFileSync(path.join(CARPETA_JS, fichero), 'utf8');
  const lineas = texto.split('\n');
  for (const linea of lineas) {
    const m = linea.match(PATRON);
    if (!m) continue;
    const nombre = m[1];
    if (!dondeSeDefine[nombre]) dondeSeDefine[nombre] = [];
    if (dondeSeDefine[nombre].indexOf(fichero) === -1) dondeSeDefine[nombre].push(fichero);
  }
}

let fallos = 0;
const nombres = Object.keys(dondeSeDefine).sort();
for (const nombre of nombres) {
  const ficherosDelNombre = dondeSeDefine[nombre];
  if (ficherosDelNombre.length > 1) {
    fallos++;
    console.log('FALLA  App.' + nombre + ' se define en más de un fichero: ' + ficherosDelNombre.join(', '));
  }
}

if (!fallos) {
  console.log('bien   ningún nombre de App se repite (' + nombres.length + ' funciones revisadas, ' +
              ficheros.length + ' ficheros)');
}

console.log(fallos ? '\n' + fallos + ' NOMBRES REPETIDOS' : '\nTodos los nombres de App son únicos.');
process.exit(fallos ? 1 : 0);
