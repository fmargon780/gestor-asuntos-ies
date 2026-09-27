/* Prueba sin navegador (fila 190, docs/VOCABULARIO-EN-PANTALLA.md, apartado «Prueba»).

   El vocabulario de docs/VOCABULARIO.md fija una sola palabra para cada cosa. Esta prueba
   busca, en index.html y en todo js/*.js, las cadenas visibles prohibidas más claras (las que
   antes se veían en pantalla y ya no deberían volver), y falla si aparece alguna fuera de un
   comentario: eso significaría que algún cambio nuevo ha vuelto a colar una palabra vieja.

   No comprueba el vocabulario entero (para eso están las pruebas de cada pantalla): solo las
   cadenas más fáciles de reconocer, como red de seguridad. */
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = new URL('../', import.meta.url).pathname;

const PROHIBIDAS = [
  'Paso actual',
  'Qué hay que hacer',
  'Meter en un asunto',
  'Receta:',
  'Formularios oficiales',
  'Poner nombre',
  'Editar el asunto',
  'Me toca',
  'Esperamos a otros'
];

/* El código no usa comentarios de línea (`//`): basta con quitar los de bloque. */
function sinComentariosJs(texto) {
  return texto.replace(/\/\*[\s\S]*?\*\//g, '');
}

function sinComentariosHtml(texto) {
  return texto.replace(/<!--[\s\S]*?-->/g, '');
}

let fallos = 0;

/* Con lookbehind: que no sea el final de un identificador más largo, como
   "normalizarReceta:" (la clave de un objeto, nada que ver con el texto
   «Receta:» de pantalla). */
function apareceComoTexto(texto, frase) {
  const escapada = frase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(?<![A-Za-zÀ-ÿ])' + escapada).test(texto);
}

function comprobar(fichero, texto) {
  for (const frase of PROHIBIDAS) {
    if (apareceComoTexto(texto, frase)) {
      fallos++;
      console.log('FALLA  "' + frase + '" sigue en ' + fichero + ', fuera de un comentario');
    }
  }
}

const indexHtml = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
comprobar('index.html', sinComentariosHtml(indexHtml));

const carpetaJs = path.join(RAIZ, 'js');
const ficherosJs = fs.readdirSync(carpetaJs).filter((f) => f.endsWith('.js')).sort();
for (const fichero of ficherosJs) {
  const texto = fs.readFileSync(path.join(carpetaJs, fichero), 'utf8');
  comprobar('js/' + fichero, sinComentariosJs(texto));
}

if (!fallos) {
  console.log('bien   ninguna de las ' + PROHIBIDAS.length +
    ' cadenas prohibidas aparece fuera de un comentario (' + (ficherosJs.length + 1) + ' ficheros revisados)');
}

console.log(fallos ? '\n' + fallos + ' CADENAS PROHIBIDAS TODAVÍA EN PANTALLA' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
