/* Prueba sin navegador, de la fila 48 (docs/NO-GASTAR-PUBLICACIONES.md):
   vercel.json tiene que saltarse la publicación cuando la rama no es
   `main` o cuando el cambio solo toca docs/pruebas/.github/*.md, y
   seguir teniendo el bloque `headers` de siempre (Cache-Control). */
import fs from 'node:fs';

const RUTA = new URL('../vercel.json', import.meta.url).pathname;
const contenido = fs.readFileSync(RUTA, 'utf8');
const json = JSON.parse(contenido);

let fallos = 0;
function comprobarQue(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

comprobarQue('vercel.json es JSON válido', !!json);
comprobarQue('tiene ignoreCommand', typeof json.ignoreCommand === 'string' && json.ignoreCommand.length > 0);
comprobarQue('ignoreCommand menciona main', json.ignoreCommand.indexOf('main') !== -1);
comprobarQue('ignoreCommand usa VERCEL_GIT_PREVIOUS_SHA',
  json.ignoreCommand.indexOf('VERCEL_GIT_PREVIOUS_SHA') !== -1);
comprobarQue('ignoreCommand excluye docs, pruebas, .github y los .md',
  json.ignoreCommand.indexOf('docs') !== -1 &&
  json.ignoreCommand.indexOf('pruebas') !== -1 &&
  json.ignoreCommand.indexOf('.github') !== -1 &&
  json.ignoreCommand.indexOf('*.md') !== -1);
comprobarQue('sigue el bloque headers de siempre',
  Array.isArray(json.headers) && json.headers.length > 0 &&
  json.headers[0].headers.some((h) => h.key === 'Cache-Control'));

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
