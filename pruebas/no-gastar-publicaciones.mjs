/* Prueba de vercel.json, sin navegador (17-sep-2026, fila 48,
   docs/NO-GASTAR-PUBLICACIONES.md). El día que Vercel agotó el cupo
   gratuito de 100 publicaciones diarias, se añadió un `ignoreCommand`
   para no publicar lo que no cambia la web (solo `docs/`, `pruebas/`,
   `.github/` o ficheros `.md`) ni las vistas previas de ramas que no
   son `main`. Esta prueba solo lee el fichero, como `pruebas/tipos.mjs`
   hace con otros JSON: no hace falta un navegador ni Vercel de verdad. */
import fs from 'node:fs';

const raiz = new URL('../', import.meta.url).pathname;
const texto = fs.readFileSync(raiz + 'vercel.json', 'utf8');

let fallos = 0;
function comprobar(titulo, condicion) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

let datos;
try {
  datos = JSON.parse(texto);
  comprobar('1. vercel.json sigue siendo JSON válido', true);
} catch (e) {
  comprobar('1. vercel.json sigue siendo JSON válido', false);
  console.log(fallos + ' FALLOS');
  process.exit(1);
}

const comando = typeof datos.ignoreCommand === 'string' ? datos.ignoreCommand : '';
comprobar('2. existe la clave ignoreCommand', comando.length > 0);

/* Vercel exige ignoreCommand en 256 caracteres o menos, así que la receta
   entera vive en scripts/vercel-ignore-build.sh y el JSON solo lo llama. */
const script = comando.includes('vercel-ignore-build.sh')
  ? fs.readFileSync(raiz + 'scripts/vercel-ignore-build.sh', 'utf8')
  : comando;
comprobar('3. el comando menciona la rama main', script.includes('main'));
comprobar('4. el comando usa VERCEL_GIT_PREVIOUS_SHA como referencia', script.includes('VERCEL_GIT_PREVIOUS_SHA'));
comprobar('5. el comando se salta docs, pruebas, .github y los .md',
  script.includes('docs') &&
  script.includes('pruebas') &&
  script.includes('.github') &&
  script.includes('*.md'));

comprobar('6. sigue existiendo el bloque headers de siempre', Array.isArray(datos.headers) && datos.headers.length > 0);
const cabecera = (datos.headers || []).find((h) => Array.isArray(h.headers) && h.headers.some((x) => x.key === 'Cache-Control'));
comprobar('7. el Cache-Control de siempre sigue ahí', !!cabecera &&
  cabecera.headers.find((x) => x.key === 'Cache-Control').value === 'public, max-age=0, must-revalidate');

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
