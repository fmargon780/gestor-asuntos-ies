/* Prueba de lógica, sin navegador (fila 129, 24-sep-2026,
   docs/EL-HITO-ES-EL-ESTADO.md): el estado del asunto es su hito
   actual, y ya no hay estados escritos a mano.

   Se cargan los ficheros de verdad en un contexto de `vm`, igual que
   pruebas/estado-por-el-hito.mjs, y se llama a sus funciones puras.

   Comprueba:
   1. «Paso N de M · título», sin contar los «solo informativo»;
      «Listo para archivar» y «Sin hitos».
   2. La marca del paso («Nos toca» / «Esperamos a…») manda sobre el
      responsable; y llega de la guía a los hitos que ya existen.
   3. «Esperando a…» manda (Pendiente de terceros aunque el hito sea
      nuestro), dice a quién y desde cuándo, y se quita al llegar un
      fichero nuevo a la carpeta.
   4. La guía mínima: tres pasos, con su marca, y sus hitos.
   5. El paso único: un estado de terceros → «Esperando a» tercero con
      el estado viejo de motivo; uno normal → nada; sin hitos → los de
      la guía (o la mínima).
   6. «Estamos en este paso»: da por hechos los anteriores con nota, no
      se salta una pregunta sin responder, y quita la espera.
   7. En el ARCHIVO: «Archivado · se quedó en: …» / «· terminado».
   8. La fila cerrada del acordeón enseña la marca («Espera: Familia»). */
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

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
  DOMParser: new JSDOM('').window.DOMParser,   /* Guias.normalizar limpia el cuerpo de cada paso */
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
  'util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'guias-toca.js', 'guias.js',
  'guias-plegado.js', 'hitos.js', 'hitos-archivo.js', 'hitos-sincronizar.js', 'hitos-a-quien.js',
  'estado-hito.js', 'estado-migracion.js'
]) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
  Object.keys(contexto.window).forEach(function (k) { if (!(k in contexto)) contexto[k] = contexto.window[k]; });
}

const { Hitos, Guias, GuiasToca, GuiasPlegado, EstadoHito, EstadoMigracion } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function hito(id, datos) { return Hitos.normalizarHito(Object.assign({ id: id, titulo: 'Paso ' + id }, datos)); }
const ajustes = Hitos.normalizarAjustes(null);
function estado(hitos) { return Hitos.estadoDelAsunto(hitos, ajustes); }

/* 1 */
comprobar('1. «Paso N de M · título», sin los informativos',
  estado([hito('a', { estado: 'hecho', responsable: 'yo' }), hito('i', { soloInformativo: true }),
    hito('b', { estado: 'encurso', responsable: 'yo' }), hito('c', { responsable: 'yo' })]).texto,
  'Paso 2 de 3 · Paso b');
comprobar('1. todos terminados: listo para archivar',
  (function () { const r = estado([hito('a', { estado: 'hecho' }), hito('b', { estado: 'noaplica' })]); return [r.texto, r.lado]; })(),
  ['Listo para archivar', 'administracion']);
comprobar('1. sin hitos: Administración, sin mirar ningún estado',
  (function () { const r = estado([]); return [r.texto, r.lado]; })(), ['Sin hitos', 'administracion']);

/* 2 */
comprobar('2. «Esperamos a…» manda sobre un responsable de la casa',
  (function () { const r = estado([hito('a', { estado: 'encurso', responsable: 'yo', toca: 'espera', tocaA: 'tutor' })]); return [r.lado, r.quien]; })(),
  ['terceros', 'Familia']);
comprobar('2. «Nos toca» manda sobre un responsable de fuera',
  estado([hito('a', { estado: 'encurso', responsable: 'direccion', toca: 'nos' })]).lado, 'administracion');
comprobar('2. sin marca, el responsable, como siempre',
  estado([hito('a', { estado: 'encurso', responsable: 'direccion' })]).lado, 'terceros');
const guiaConMarca = Guias.normalizar([
  { id: 'p1', titulo: 'Pedir el papel', toca: 'espera', tocaA: 'tercero' },
  { id: 'p2', titulo: 'Resolver', toca: 'nos' }
]);
comprobar('2. la guía guarda la marca', guiaConMarca.map(function (p) { return [p.toca, p.tocaA]; }), [['espera', 'tercero'], ['nos', '']]);
const viejos = [Hitos.pasoAHito(Object.assign({}, guiaConMarca[0], { toca: '', tocaA: '' })), Hitos.pasoAHito(guiaConMarca[1])];
const sinc = Hitos.pasosQueFaltan(viejos, guiaConMarca, []);
comprobar('2. la marca llega a los hitos que ya existían', [sinc.retocados, sinc.hitos[0].toca, sinc.hitos[0].tocaA], [1, 'espera', 'tercero']);

/* 3 */
const conEspera = [hito('a', { estado: 'hecho', responsable: 'yo' }), hito('b', { estado: 'encurso', responsable: 'yo' })];
EstadoHito.ponerEsperaEn(conEspera, ajustes, 'tutor', 'Que traiga el impreso', ['uno.pdf'], '2026-09-24T09:00:00.000Z');
const r3 = estado(conEspera);
comprobar('3. «Esperando a…» manda: Pendiente de terceros', [r3.lado, r3.quien, r3.hito], ['terceros', 'Familia', 'b']);
comprobar('3. la tarjeta lo dice', EstadoHito.textoEsperando(r3.esperando), 'Esperando a Familia desde el 24-sep');
comprobar('3. llega un fichero nuevo', EstadoHito.llegados(['uno.pdf'], ['uno.pdf', 'dos.pdf', '.DS_Store']), ['dos.pdf']);
comprobar('3. si no llega nada, se queda', EstadoHito.llegados(['uno.pdf'], ['uno.pdf']), []);
EstadoHito.quitarEsperaDeLista(conEspera);
comprobar('3. al quitarse, vuelve a su montón', [estado(conEspera).lado, !!estado(conEspera).esperando], ['administracion', false]);
comprobar('3. el hito guardado sin espera no arrastra campos', Object.keys(Hitos.normalizarHito(conEspera[1])).filter(function (k) { return /^esperando/.test(k); }), []);

/* 4 */
const minima = Guias.normalizar(EstadoHito.pasosMinimos());
comprobar('4. guía mínima: tres pasos con su marca',
  minima.map(function (p) { return [p.titulo, p.toca, p.tocaA]; }),
  [['Tramitar', 'nos', ''], ['Esperar respuesta', 'espera', 'tercero'], ['Archivar', 'nos', '']]);
comprobar('4. se reconoce tal cual se creó (al renombrar un tipo, cede ante la de verdad)',
  [EstadoHito.esGuiaMinima(minima), EstadoHito.esGuiaMinima(minima.slice(0, 2)),
   EstadoHito.esGuiaMinima(minima.map(function (p, i) { return i ? p : Object.assign({}, p, { responsable: 'yo' }); }))],
  [true, false, false]);
const hitosMinima = minima.map(Hitos.pasoAHito);
hitosMinima[0].estado = 'hecho';
Hitos.recomputeEnCurso(hitosMinima);
comprobar('4. y sus hitos: «Esperar respuesta» es de terceros',
  (function () { const r = estado(hitosMinima); return [r.texto, r.lado, r.quien]; })(),
  ['Paso 2 de 3 · Esperar respuesta', 'terceros', 'Tercero']);

/* 5 */
const porAsunto = {
  'A-ESPERA': { creados: '', hitos: [hito('x1', { estado: 'encurso', responsable: 'yo' })] }
};
const estadosViejos = [{ nombre: 'EN TRÁMITE', espera: false }, { nombre: 'A LA ESPERA DEL TERCERO', espera: true }];
const cuenta = EstadoMigracion.aplicar(porAsunto, ajustes, [
  { nombre: 'A-ESPERA', tipo: 'T', ficha: { situacion: 'A LA ESPERA DEL TERCERO' }, ficheros: ['a.pdf'] },
  { nombre: 'B-TRAMITE', tipo: 'SIN GUIA', ficha: { situacion: 'EN TRÁMITE' } },
  { nombre: 'C-SINTIPO', tipo: '', ficha: { situacion: 'A LA ESPERA DEL TERCERO' } }
], estadosViejos, function (tipo) { return tipo === 'SIN GUIA' ? minima : []; });
comprobar('5. cuántos', [cuenta.creados, cuenta.enEspera], [1, 1]);
const rA = Hitos.estadoDelAsunto(porAsunto['A-ESPERA'].hitos, ajustes);
comprobar('5. estado de terceros → «Esperando a» tercero, con el estado viejo de motivo',
  [rA.lado, rA.esperando && rA.esperando.a, rA.esperando && rA.esperando.motivo], ['terceros', 'tercero', 'A LA ESPERA DEL TERCERO']);
comprobar('5. estado normal y sin hitos → los de la guía mínima, sin espera',
  (function () { const r = Hitos.estadoDelAsunto(porAsunto['B-TRAMITE'].hitos, ajustes); return [r.texto, r.lado, !!r.esperando]; })(),
  ['Paso 1 de 3 · Tramitar', 'administracion', false]);
comprobar('5. sin tipo: se queda sin hitos', !!porAsunto['C-SINTIPO'], false);
const otraVez = EstadoMigracion.aplicar(porAsunto, ajustes, [
  { nombre: 'A-ESPERA', tipo: 'T', ficha: { situacion: 'A LA ESPERA DEL TERCERO' } }
], estadosViejos, function () { return []; });
comprobar('5. no pone dos esperas', [otraVez.creados, otraVez.enEspera], [0, 0]);

/* 6 */
const paraSituar = [
  hito('a', { estado: 'encurso' }),
  hito('q', { clase: 'decision', elegida: 'o1', opciones: [{ id: 'o1', texto: 'Sí', hitos: [hito('q1', {})] }] }),
  hito('b', {}),
  hito('c', {})
];
EstadoHito.ponerEsperaEn(paraSituar, ajustes, 'tercero', '', [], '2026-09-24T09:00:00.000Z');
comprobar('6. hay algo que dar por hecho antes de «c»', EstadoHito.puedeSituar(paraSituar, 'c'), true);
comprobar('6. antes del primero, no', EstadoHito.puedeSituar(paraSituar, 'a'), false);
const n6 = Hitos.situarLista(paraSituar, 'c', 'Dado por hecho al situar el asunto (24-sep-2026, Francisco)', 'Francisco');
comprobar('6. da por hechos los anteriores (no la pregunta)', [n6, paraSituar[0].estado, Hitos.buscar(paraSituar, 'q1').estado, paraSituar[2].estado, paraSituar[1].elegida], [3, 'hecho', 'hecho', 'hecho', 'o1']);
comprobar('6. con su nota', paraSituar[0].notas[0].texto, 'Dado por hecho al situar el asunto (24-sep-2026, Francisco)');
comprobar('6. y queda en el paso elegido, sin espera',
  (function () { const r = estado(paraSituar); return [r.hito, paraSituar[3].estado, !!r.esperando]; })(), ['c', 'encurso', false]);
const conPregunta = [
  hito('a', {}),
  hito('q', { clase: 'decision', opciones: [{ id: 'o1', texto: 'Sí', hitos: [hito('q1', {})] }] }),
  hito('c', {})
];
comprobar('6. no se salta una pregunta sin responder', [Hitos.situarLista(conPregunta, 'c', 'x', 'y'), conPregunta[0].estado], [-1, 'pendiente']);

/* 7 */
comprobar('7. archivado: se quedó en', EstadoHito.textoArchivado({ seQuedoEn: 'Esperar la firma' }), 'Archivado · se quedó en: Esperar la firma');
comprobar('7. archivado: terminado', EstadoHito.textoArchivado({ terminado: true }), 'Archivado · terminado');
comprobar('7. archivado de antes, con su estado viejo como dato histórico (fila 132)', EstadoHito.textoArchivado({ situacion: 'RESUELTO' }), 'Archivado · RESUELTO');
comprobar('7. archivado sin nada', EstadoHito.textoArchivado({}), 'Archivado');

/* 8 */
comprobar('8. la fila cerrada del acordeón: «Espera: Familia»',
  GuiasPlegado.marcas({ titulo: 'x', toca: 'espera', tocaA: 'tutor' }, []), ['Espera: Familia']);
comprobar('8. y «Nos toca»', GuiasToca.marca({ toca: 'nos' }, []), 'Nos toca');

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
