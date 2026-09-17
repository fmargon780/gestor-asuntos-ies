/* Prueba de que vercel.json se salta las publicaciones que no hacen
   falta (17-sep-2026, fila 48, docs/NO-GASTAR-PUBLICACIONES.md): el
   cupo gratuito de Vercel son 100 publicaciones al día, y se agotó ese
   mismo día con commits que solo tocaban docs/COLA.md y compañía.

   Sin navegador: lee el JSON y el script al que llama `ignoreCommand`
   (Vercel exige ese campo en menos de 256 caracteres, así que la
   receta entera vive en scripts/vercel-ignore-build.sh), y comprueba
   que dicen lo que tienen que decir, y que el bloque headers de
   siempre sigue ahí. */
import fs from 'node:fs';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const raiz = new URL('../', import.meta.url).pathname;
const texto = fs.readFileSync(raiz + 'vercel.json', 'utf8');
const json = JSON.parse(texto);

comprobar('1. existe ignoreCommand', typeof json.ignoreCommand === 'string' && json.ignoreCommand.length > 0, true);
comprobar('1b. ignoreCommand no pasa de 256 caracteres (límite de Vercel)',
  json.ignoreCommand.length <= 256, true);

const script = fs.readFileSync(raiz + 'scripts/vercel-ignore-build.sh', 'utf8');
comprobar('1c. ignoreCommand llama a ese script', json.ignoreCommand.indexOf('vercel-ignore-build.sh') !== -1, true);
comprobar('2. el script menciona la rama main', script.indexOf('main') !== -1, true);
comprobar('3. el script usa VERCEL_GIT_PREVIOUS_SHA como referencia',
  script.indexOf('VERCEL_GIT_PREVIOUS_SHA') !== -1, true);
comprobar('4. sigue existiendo el bloque headers de siempre',
  Array.isArray(json.headers) && json.headers.length > 0, true);
comprobar('5. y su Cache-Control de siempre',
  (json.headers[0].headers || []).some((h) => h.key === 'Cache-Control' &&
    h.value === 'public, max-age=0, must-revalidate'), true);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
