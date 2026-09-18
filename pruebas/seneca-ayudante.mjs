/* Prueba de js/seneca-ayudante.js (fila 47, 17-sep-2026,
   docs/DESTINATARIOS-EN-SENECA.md, 4; fila 54, 18-sep-2026,
   docs/AYUDANTE-SENECA-FIABLE.md), la parte que se puede probar sin
   Séneca de verdad: que el texto del marcador se genera, que arranca
   con "javascript:" y que el código de dentro es JavaScript válido
   (sin llegar a ejecutarlo: leer el portapapeles y tocar el DOM de
   Séneca lo comprueba Francisco), y que trae de verdad la espera de
   la sugerencia, la comprobación del campo vacío y el reintento (fila
   54: ya no fía todo a un reloj fijo de 1400 ms).

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
comprobar('5. lanza la flecha abajo (ArrowDown)', texto.indexOf('ArrowDown') !== -1, true);
comprobar('6. y después Enter', texto.indexOf('Enter') !== -1, true);
comprobar('7. mira también dentro de los iframe', texto.indexOf('iframe') !== -1, true);
comprobar('8. el aviso de "sin campo o sin portapapeles" está tal cual',
  texto.indexOf('Haz clic dentro del campo de destinatarios y vuelve a pulsar') !== -1, true);

console.log('--- fila 54: ya no cuenta el tiempo a ciegas, comprueba de verdad ---');
comprobar('9. ya no fía todo a un reloj fijo de 1.400 ms (ese número ha desaparecido)',
  texto.indexOf('1400') === -1, true);
comprobar('10. espera hasta 5.000 ms a que aparezca la sugerencia',
  texto.indexOf('ESPERA_SUGERENCIA_MAXIMA = 5000') !== -1, true);
comprobar('11. separa la flecha abajo del Intro con 350 ms',
  texto.indexOf('ESPERA_ANTES_DE_FLECHA = 350') !== -1, true);
comprobar('12. comprueba que el campo se ha vaciado de verdad, hasta 2.500 ms',
  texto.indexOf('ESPERA_CAMPO_VACIO_MAXIMA = 2500') !== -1, true);
comprobar('13. reintenta una vez, más despacio (hasta 7.000 ms)',
  texto.indexOf('ESPERA_SUGERENCIA_MAXIMA_REINTENTO = 7000') !== -1, true);
comprobar('14. la pausa entre personas ha subido de 400 a 600 ms',
  texto.indexOf('ESPERA_ENTRE_USUARIOS = 600') !== -1, true);
comprobar('15. al terminar con fallos, dice por su nombre quién no ha entrado',
  texto.indexOf('No han entrado: ') !== -1, true);
comprobar('16. y ofrece copiar los que faltan',
  texto.indexOf('Copiar los que faltan') !== -1, true);

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
comprobar('17. insertarEnlace mete algo en el contenedor', contenedorDeMentira.hijos.length >= 2, true);

console.log('--- fila 53: insertarEnlace con un segundo contenedor para la explicación ---');
const contenedorEnlace = { innerHTML: '', hijos: [], appendChild: function (h) { this.hijos.push(h); } };
const contenedorExplica = { innerHTML: '', hijos: [], appendChild: function (h) { this.hijos.push(h); } };
SenecaAyudante.insertarEnlace(contenedorEnlace, contenedorExplica);
comprobar('18. el enlace va en el primer contenedor, y nada más',
  contenedorEnlace.hijos.length, 1);
comprobar('19. la explicación va en el segundo',
  contenedorExplica.hijos.length, 1);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
