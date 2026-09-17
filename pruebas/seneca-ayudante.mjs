/* Prueba de js/seneca-ayudante.js (fila 47, 17-sep-2026,
   docs/DESTINATARIOS-EN-SENECA.md, 4), la parte que se puede probar
   sin Séneca de verdad: que el texto del marcador se genera, que
   arranca con "javascript:" y que el código de dentro es JavaScript
   válido (sin llegar a ejecutarlo: leer el portapapeles y tocar el
   DOM de Séneca lo comprueba Francisco).

   Mismo estilo que pruebas/idea.mjs: el fichero se carga tal cual en
   un contexto de Node con `vm`. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {}, document: { createElement: function () { return {}; } } };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(raiz + 'seneca-ayudante.js', 'utf8'), contexto, { filename: 'seneca-ayudante.js' });
const { SenecaAyudante } = contexto.window;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const texto = SenecaAyudante.textoDelMarcador();

comprobar('1. el texto empieza por "javascript:"', texto.slice(0, 11), 'javascript:');
comprobar('2. no está vacío por detrás', texto.length > 100, true);

console.log('--- el código de dentro es JavaScript válido ---');
const codigo = texto.slice('javascript:'.length);
let sintaxisOk = true;
try { new Function(codigo); } catch (e) { sintaxisOk = false; console.log('   ' + e.message); }
comprobar('3. `new Function(codigo)` no revienta (sintaxis válida)', sintaxisOk, true);

console.log('--- lo que se espera de ese código, comprobado en el texto ---');
comprobar('4. lee el portapapeles', texto.indexOf('navigator.clipboard.readText') !== -1, true);
comprobar('5. espera 1.400 ms antes de la flecha abajo', texto.indexOf('1400') !== -1, true);
comprobar('6. lanza la flecha abajo (ArrowDown)', texto.indexOf('ArrowDown') !== -1, true);
comprobar('7. y después Enter', texto.indexOf('Enter') !== -1, true);
comprobar('8. mira también dentro de los iframe', texto.indexOf('iframe') !== -1, true);
comprobar('9. el aviso de "sin campo o sin portapapeles" está tal cual',
  texto.indexOf('Haz clic dentro del campo de destinatarios y vuelve a pulsar') !== -1, true);

console.log('--- insertarEnlace ---');
const contenedorDeMentira = {
  innerHTML: '',
  hijos: [],
  appendChild: function (h) { this.hijos.push(h); }
};
/* Necesita `document.createElement` de verdad para las tres piezas
   (enlace + párrafo): se sustituye por uno mínimo que basta para que
   `insertarEnlace` no reviente. */
contexto.document.createElement = function (etiqueta) {
  return { tagName: etiqueta, style: {}, appendChild: function () {}, addEventListener: function () {} };
};
SenecaAyudante.insertarEnlace(contenedorDeMentira);
comprobar('10. insertarEnlace mete algo en el contenedor', contenedorDeMentira.hijos.length >= 2, true);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
