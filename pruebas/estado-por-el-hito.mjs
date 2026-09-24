/* Prueba de lógica, sin navegador (fila 104, 23-sep-2026,
   docs/ESTADO-POR-EL-HITO.md): el asunto se coloca solo en "Pendiente
   de Administración" o "Pendiente de terceros" según su hito abierto.

   Se cargan los ficheros de verdad en un contexto de `vm`, igual que
   pruebas/el-hito-mesa-de-trabajo.mjs, y se llama a las funciones puras
   Hitos.aQuienLeToca, Hitos.ladoDelAsunto y Hitos.esDeAdministracion.

   Comprueba:
   1. Un hito de Administración (`yo`) → administracion.
   2. Un hito de terceros (`direccion`, sin marca) → terceros, con su
      nombre visible; un papel fijo (`tercero`) → terceros, "Tercero".
   3. Una pregunta sin responder → administracion.
   4. Un hito "solo informativo" se salta: manda el siguiente.
   5. Todos hechos → administracion (toca archivarlo).
   6. Sin hitos → null; y un hito sin responsable → administracion.
   7. Dos en curso a la vez, uno de cada lado → gana Administración.
   8. La marca de un responsable manda (Dirección marcada → administracion).
   9. Sin hitos → administracion (desde la fila 129 el estado manual
      ya no se lee).
  10. Los ajustes guardados sin la marca: `yo`/`companero` salen de
      Administración; los demás, no.
  11. HitosBiblioteca.naceSoloInformativo con los ajustes: lee la misma
      marca; con un id suelto sigue como antes. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function nodoFalso() {
  return {
    style: {}, dataset: {}, children: [], appendChild: function () {}, setAttribute: function () {},
    classList: { add: function () {}, remove: function () {}, toggle: function () {} },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; }
  };
}
const contexto = {
  console, TextDecoder, Blob, window: {}, indexedDB: null, setTimeout, clearTimeout,
  document: {
    readyState: 'complete',
    addEventListener: function () {},
    getElementById: function () { return nodoFalso(); },
    createElement: function () { return nodoFalso(); },
    querySelector: function () { return null; }
  }
};
vm.createContext(contexto);
contexto.App = contexto.window.App = { E: { usuario: 'Francisco', datos: {} } };
for (const f of [
  'util.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'guias.js',
  'hitos.js', 'hitos-archivo.js', 'hitos-a-quien.js', 'hitos-biblioteca.js'
]) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
Object.keys(contexto.window).forEach(function (k) { if (!(k in contexto)) contexto[k] = contexto.window[k]; });

const Hitos = contexto.window.Hitos || contexto.Hitos;
const HitosBiblioteca = contexto.window.HitosBiblioteca || contexto.HitosBiblioteca;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function hito(id, datos) { return Hitos.normalizarHito(Object.assign({ id: id, titulo: id }, datos)); }
const ajustes = Hitos.normalizarAjustes(null);
function lado(hitos, aj) { const r = Hitos.aQuienLeToca(hitos, aj || ajustes); return [r.lado, r.quien, r.hito]; }

/* 1 */
comprobar('1. hito de Administración',
  lado([hito('a', { estado: 'hecho', responsable: 'direccion' }), hito('b', { estado: 'encurso', responsable: 'yo' })]),
  ['administracion', '', 'b']);

/* 2 */
comprobar('2. hito de terceros, con su nombre',
  lado([hito('a', { estado: 'encurso', responsable: 'direccion' }), hito('b', { responsable: 'yo' })]),
  ['terceros', 'Dirección', 'a']);
comprobar('2. papel fijo: el tercero',
  lado([hito('a', { estado: 'encurso', responsable: 'tercero' })]),
  ['terceros', 'Tercero', 'a']);

/* 3 */
comprobar('3. pregunta sin responder',
  lado([hito('p', { clase: 'decision', estado: 'encurso', responsable: 'direccion',
    opciones: [{ id: 'o1', texto: 'Sí', hitos: [] }] })]),
  ['administracion', '', 'p']);

/* 4 */
comprobar('4. solo informativo, saltado',
  lado([hito('i', { estado: 'encurso', responsable: 'yo', soloInformativo: true }),
        hito('t', { responsable: 'jefatura' })]),
  ['terceros', 'Jefatura', 't']);

/* 5 */
comprobar('5. todos hechos',
  lado([hito('a', { estado: 'hecho', responsable: 'direccion' }), hito('b', { estado: 'noaplica', responsable: 'tercero' })]),
  ['administracion', '', null]);

/* 6 */
comprobar('6. sin hitos', lado([]), [null, '', null]);
comprobar('6. hito sin responsable', lado([hito('a', { estado: 'encurso' })]), ['administracion', '', 'a']);

/* 7 */
comprobar('7. dos en curso, gana Administración',
  lado([hito('a', { estado: 'encurso', responsable: 'direccion' }), hito('b', { estado: 'encurso', responsable: 'companero' })]),
  ['administracion', '', 'b']);

/* 8 */
const conDireccion = Hitos.normalizarAjustes({ responsables: [
  { id: 'yo', nombre: 'Yo', administracion: true },
  { id: 'direccion', nombre: 'Dirección', administracion: true }
] });
comprobar('8. Dirección marcada como Administración',
  lado([hito('a', { estado: 'encurso', responsable: 'direccion' })], conDireccion),
  ['administracion', '', 'a']);

/* 9 (desde la fila 129, docs/EL-HITO-ES-EL-ESTADO.md: el estado escrito
   a mano ya no se lee; sin hitos, Administración) */
comprobar('9. sin hitos: Administración, sin mirar el estado manual',
  Hitos.ladoDelAsunto([], ajustes).lado, 'administracion');
comprobar('9. con hitos, manda el hito',
  Hitos.ladoDelAsunto([hito('a', { estado: 'encurso', responsable: 'yo' })], ajustes).lado,
  'administracion');

/* 10 */
const viejos = Hitos.normalizarAjustes({ responsables: [
  { id: 'yo', nombre: 'Yo' }, { id: 'companero', nombre: 'Mi compañero' }, { id: 'secretaria', nombre: 'Secretaría' }
] });
comprobar('10. marca de partida de los guardados sin ella',
  viejos.responsables.map(function (r) { return r.administracion; }), [true, true, false]);
comprobar('10. un papel nunca es Administración', Hitos.esDeAdministracion('tutor', viejos), false);

/* 11 */
comprobar('11. naceSoloInformativo con los ajustes: Dirección',
  HitosBiblioteca.naceSoloInformativo('direccion', ajustes), true);
comprobar('11. naceSoloInformativo con los ajustes: yo',
  HitosBiblioteca.naceSoloInformativo('yo', ajustes), false);
comprobar('11. naceSoloInformativo con un id suelto, como antes',
  HitosBiblioteca.naceSoloInformativo('jefatura', 'administracion'), true);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
