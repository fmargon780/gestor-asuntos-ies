/* Prueba del motor de campos calculados (fila 56, 18-sep-2026,
   docs/CAMPOS-CATALOGO-Y-CALCULADOS.md), sin navegador: solo el motor
   (js/campos-calculo.js), no la interfaz. Mismo estilo que
   pruebas/logica.mjs: los ficheros se cargan tal cual en un solo
   contexto de Node con `vm`.

   Nota: el encargo lo llamaba `pruebas/campos-calculo.test.js`, pero
   `pruebas/ejecutar.mjs` solo recoge ficheros `*.mjs` (nunca
   `*.test.js`); con ese nombre la prueba no se habría ejecutado
   nunca con `npm test`. Se guarda aquí, con la extensión que sí
   recoge la cola de pruebas. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {} };
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres.js', 'campos.js', 'campos-calculo.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { U, Nombres, Campos, Calculo } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function persona(campos, extra) {
  return Object.assign({ campos: campos || {} }, extra || {});
}
function receta(operacion, parametros, columna) {
  return { origen: { clase: 'columna', columna: columna || 'X' }, operacion: operacion, parametros: parametros || {} };
}
function evalX(operacion, valor, parametros, config) {
  return Calculo.evaluar(receta(operacion, parametros), persona({ X: valor }), config || {});
}

/* ============================================================
   1. quitarFinal con soloSiEsLetra, igual que Campos.calcularCurso
   ============================================================ */
console.log('--- 1. quitarFinal con soloSiEsLetra ---');
[['1ºA', '1º'], ['1ºBachA', '1ºBach'], ['2ºFPB B', '2ºFPB']].forEach(([entrada, esperado]) => {
  const real = evalX('quitarFinal', entrada, { n: 1, soloSiEsLetra: true });
  comprobar('quitarFinal(' + JSON.stringify(entrada) + ')', real, esperado);
  comprobar('  igual que Campos.calcularCurso', real, Campos.calcularCurso(entrada));
});
comprobar('quitarFinal("1º"): no quita el "º", que no es letra', evalX('quitarFinal', '1º', { n: 1, soloSiEsLetra: true }), '1º');
comprobar('quitarFinal sin soloSiEsLetra, n=2', evalX('quitarFinal', 'ABCDE', { n: 2 }), 'ABC');

/* ============================================================
   2. quitarInicio
   ============================================================ */
console.log('--- 2. quitarInicio ---');
comprobar('quitarInicio n=2', evalX('quitarInicio', 'Unidad-1ºA', { n: 2 }), 'idad-1ºA');
comprobar('quitarInicio n=1 por defecto', evalX('quitarInicio', 'ABC', { n: 1 }), 'BC');

/* ============================================================
   3. partir, en sus cuatro combinaciones
   ============================================================ */
console.log('--- 3. partir, cuatro combinaciones ---');
const TXT = 'Ana Belén Cruz';
comprobar('partir antes/primera (espacio)', evalX('partir', TXT, { signo: ' ', lado: 'antes', ocurrencia: 'primera' }), 'Ana');
comprobar('partir despues/primera', evalX('partir', TXT, { signo: ' ', lado: 'despues', ocurrencia: 'primera' }), 'Belén Cruz');
comprobar('partir antes/ultima', evalX('partir', TXT, { signo: ' ', lado: 'antes', ocurrencia: 'ultima' }), 'Ana Belén');
comprobar('partir despues/ultima', evalX('partir', TXT, { signo: ' ', lado: 'despues', ocurrencia: 'ultima' }), 'Cruz');
comprobar('partir sin encontrar el signo: se queda igual', evalX('partir', 'SinSignos', { signo: '@', lado: 'antes', ocurrencia: 'primera' }), 'SinSignos');

/* ============================================================
   4. equivalencias, con y sin ignorarMayusculas, y los dos siNoEsta
   ============================================================ */
console.log('--- 4. equivalencias ---');
const PARES = [{ de: 'ALU', a: 'Alumnado' }, { de: 'PAS', a: 'Personal de administración' }];
comprobar('equivalencias, coincide tal cual', evalX('equivalencias', 'ALU', { pares: PARES }), 'Alumnado');
comprobar('equivalencias, sin ignorarMayusculas no coincide en minúscula', evalX('equivalencias', 'alu', { pares: PARES }), 'alu');
comprobar('equivalencias, con ignorarMayusculas sí coincide', evalX('equivalencias', 'alu', { pares: PARES, ignorarMayusculas: true }), 'Alumnado');
comprobar('equivalencias, sin estar en la tabla y siNoEsta=dejar', evalX('equivalencias', 'OTRO', { pares: PARES, siNoEsta: 'dejar' }), 'OTRO');
comprobar('equivalencias, sin estar en la tabla y siNoEsta=vaciar', evalX('equivalencias', 'OTRO', { pares: PARES, siNoEsta: 'vaciar' }), '');

/* ============================================================
   5. juntar, con un origen vacío
   ============================================================ */
console.log('--- 5. juntar ---');
function evalJuntar(v1, v2, separador) {
  const p = persona({ X: v1, Y: v2 });
  const r = { origen: { clase: 'columna', columna: 'X' }, operacion: 'juntar',
    parametros: { origen2: { clase: 'columna', columna: 'Y' }, separador: separador } };
  return Calculo.evaluar(r, p, {});
}
comprobar('juntar, los dos con valor', evalJuntar('Unidad', 'Turno', '-'), 'Unidad-Turno');
comprobar('juntar, el segundo vacío: sin separador colgando', evalJuntar('Unidad', '', '-'), 'Unidad');
comprobar('juntar, el primero vacío: sin separador colgando', evalJuntar('', 'Turno', '-'), 'Turno');

/* ============================================================
   6. deFecha, en sus tres modos, con las dos formas de escribir la fecha
   ============================================================ */
console.log('--- 6. deFecha ---');
comprobar('deFecha edad, dd/mm/aaaa', evalX('deFecha', '15/03/2010', { que: 'edad' }), String(U.edadDesde('15/03/2010')));
comprobar('deFecha edad, aaaa-mm-dd', evalX('deFecha', '2010-03-15', { que: 'edad' }), String(U.edadDesde('2010-03-15')));
comprobar('deFecha anio, dd/mm/aaaa', evalX('deFecha', '15/03/2010', { que: 'anio' }), '2010');
comprobar('deFecha anio, aaaa-mm-dd', evalX('deFecha', '2010-03-15', { que: 'anio' }), '2010');
comprobar('deFecha anioAcademico, dd/mm/aaaa, en septiembre', evalX('deFecha', '10/09/2026', { que: 'anioAcademico' }), U.cursoDeFecha('2026-09-10'));
comprobar('deFecha anioAcademico, aaaa-mm-dd, antes de septiembre', evalX('deFecha', '2026-03-10', { que: 'anioAcademico' }), U.cursoDeFecha('2026-03-10'));
comprobar('deFecha anioAcademico coincide con U.cursoDeFecha en el cambio de curso',
  evalX('deFecha', '31/08/2026', { que: 'anioAcademico' }), U.cursoDeFecha('2026-08-31'));

/* ============================================================
   7. un encadenado de dos saltos, y un ciclo
   ============================================================ */
console.log('--- 7. encadenado y ciclo ---');
const configEncadenado = {
  calculados: [
    { id: 'c1', nombre: 'Base', origen: { clase: 'columna', columna: 'X' }, operacion: 'quitarInicio', parametros: { n: 1 } },
    { id: 'c2', nombre: 'Doble', origen: { clase: 'calculado', id: 'c1' }, operacion: 'quitarInicio', parametros: { n: 1 } }
  ]
};
const recetaC2 = configEncadenado.calculados[1];
comprobar('encadenado de dos saltos: c2 depende de c1, que depende de la columna',
  Calculo.evaluar(recetaC2, persona({ X: 'ABCDE' }), configEncadenado), 'CDE');

const configCiclo = {
  calculados: [
    { id: 'a', nombre: 'A', origen: { clase: 'calculado', id: 'b' }, operacion: 'quitarInicio', parametros: { n: 1 } },
    { id: 'b', nombre: 'B', origen: { clase: 'calculado', id: 'a' }, operacion: 'quitarInicio', parametros: { n: 1 } }
  ]
};
comprobar('un ciclo (a depende de b, b depende de a) da vacío sin colgarse',
  Calculo.evaluar(configCiclo.calculados[0], persona({}), configCiclo), '');
comprobar('Calculo.validar detecta el ciclo', Calculo.validar(configCiclo.calculados[0], configCiclo).length > 0, true);

/* ============================================================
   8. valor de partida vacío en las seis operaciones
   ============================================================ */
console.log('--- 8. valor de partida vacío, en las seis operaciones ---');
comprobar('quitarFinal de vacío', evalX('quitarFinal', '', { n: 1 }), '');
comprobar('quitarInicio de vacío', evalX('quitarInicio', '', { n: 1 }), '');
comprobar('partir de vacío', evalX('partir', '', { signo: ' ', lado: 'antes', ocurrencia: 'primera' }), '');
comprobar('equivalencias de vacío', evalX('equivalencias', '', { pares: PARES }), '');
comprobar('juntar con los dos vacíos', evalJuntar('', '', '-'), '');
comprobar('deFecha de vacío', evalX('deFecha', '', { que: 'edad' }), '');

/* ============================================================
   9. Calculo.validar, un repaso rápido de las reglas de guardado
   ============================================================ */
console.log('--- 9. Calculo.validar ---');
comprobar('sin nombre, no se puede guardar',
  Calculo.validar({ id: 'x', nombre: '', categorias: ['ALUMNADO'], origen: { clase: 'grupo' }, operacion: 'quitarFinal', parametros: { n: 1 } }, {}).length > 0, true);
comprobar('sin categoría, no se puede guardar',
  Calculo.validar({ id: 'x', nombre: 'Prueba', categorias: [], origen: { clase: 'grupo' }, operacion: 'quitarFinal', parametros: { n: 1 } }, {}).length > 0, true);
comprobar('n fuera de rango (0), no se puede guardar',
  Calculo.validar({ id: 'x', nombre: 'Prueba', categorias: ['ALUMNADO'], origen: { clase: 'grupo' }, operacion: 'quitarFinal', parametros: { n: 0 } }, {}).length > 0, true);
comprobar('n fuera de rango (21), no se puede guardar',
  Calculo.validar({ id: 'x', nombre: 'Prueba', categorias: ['ALUMNADO'], origen: { clase: 'grupo' }, operacion: 'quitarFinal', parametros: { n: 21 } }, {}).length > 0, true);
comprobar('signo de más de un carácter, no se puede guardar',
  Calculo.validar({ id: 'x', nombre: 'Prueba', categorias: ['ALUMNADO'], origen: { clase: 'grupo' }, operacion: 'partir', parametros: { signo: 'ab', lado: 'antes', ocurrencia: 'primera' } }, {}).length > 0, true);
comprobar('equivalencias sin ningún par, no se puede guardar',
  Calculo.validar({ id: 'x', nombre: 'Prueba', categorias: ['ALUMNADO'], origen: { clase: 'grupo' }, operacion: 'equivalencias', parametros: { pares: [] } }, {}).length > 0, true);
comprobar('juntar con origen2 igual al origen, no se puede guardar',
  Calculo.validar({ id: 'x', nombre: 'Prueba', categorias: ['ALUMNADO'], origen: { clase: 'columna', columna: 'Unidad' }, operacion: 'juntar',
    parametros: { origen2: { clase: 'columna', columna: 'Unidad' }, separador: '-' } }, {}).length > 0, true);
comprobar('con todo correcto, no hay motivos',
  Calculo.validar({ id: 'x', nombre: 'Prueba única', categorias: ['ALUMNADO'], origen: { clase: 'grupo' }, operacion: 'quitarFinal', parametros: { n: 1, soloSiEsLetra: true } }, {}).length, 0);
comprobar('nombre repetido con otro calculado, no se puede guardar',
  Calculo.validar({ id: 'x', nombre: 'Curso', categorias: ['ALUMNADO'], origen: { clase: 'grupo' }, operacion: 'quitarFinal', parametros: { n: 1 } },
    { calculados: [{ id: 'curso', nombre: 'Curso' }] }).length > 0, true);

/* ============================================================
   10. describir no revienta con las seis operaciones
   ============================================================ */
console.log('--- 10. Calculo.describir ---');
['quitarFinal', 'quitarInicio', 'partir', 'equivalencias', 'deFecha'].forEach((op) => {
  const texto = Calculo.describir(receta(op, { n: 1, signo: ' ', lado: 'antes', ocurrencia: 'primera', pares: PARES, que: 'edad' }, 'Unidad'), {});
  comprobar('describir(' + op + ') no está vacío', typeof texto === 'string' && texto.length > 0, true);
});
comprobar('describir(juntar) no está vacío',
  Calculo.describir({ origen: { clase: 'columna', columna: 'Unidad' }, operacion: 'juntar',
    parametros: { origen2: { clase: 'columna', columna: 'Turno' }, separador: '-' } }, {}).length > 0, true);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
