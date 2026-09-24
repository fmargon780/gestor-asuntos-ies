/* Prueba de la fila 140 (25-sep-2026, docs/TIEMPO-DE-TRAMITACION.md),
   sin navegador: el tiempo de tramitación en «Cuentas»
   (js/cuentas-tiempos.js, sobre la cuenta de js/cuentas.js).

   1. Dos archivados de un tipo con 10 y 20 días: media 15, máximo 20;
      un tipo sin fechas de apertura y cierre: «—».
   2. Un abierto de hace 40 días sale el primero de «Los que más tiempo
      llevan abiertos» y cuenta en «Abiertos hace más de 30 días».
   3. El filtro de curso también vale aquí.
   4. Un reservado sale tapado en esa tabla. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, App: { PANTALLAS: [], E: { tipos: [{ tipo: 'MATRICULA', categoria: 'ALUMNADO', reservado: false }, { tipo: 'EXPEDIENTE', categoria: 'ALUMNADO', reservado: true }] } } };
contexto.window = contexto;
contexto.document = { getElementById() { return null; }, addEventListener() {}, readyState: 'complete' };
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres.js', 'cuentas.js', 'reservados.js', 'cuentas-tiempos.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Cuentas, CuentasTiempos } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* 1 */
const entradas = [
  { abierta: false, fecha: '260901', categoria: 'ALUMNADO', tipo: 'MATRICULA', abiertoEl: '2026-09-01T10:00:00Z', cerradoEl: '2026-09-11T10:00:00Z' },
  { abierta: false, fecha: '260902', categoria: 'ALUMNADO', tipo: 'MATRICULA', abiertoEl: '2026-09-02T10:00:00Z', cerradoEl: '2026-09-22T10:00:00Z' },
  { abierta: true, fecha: '260903', categoria: 'ALUMNADO', tipo: 'MATRICULA', abiertoEl: '2026-09-03T10:00:00Z', cerradoEl: '' },
  { abierta: false, fecha: '260904', categoria: 'EMPRESAS', tipo: 'COMPRA', abiertoEl: '', cerradoEl: '' }
];
const filas = CuentasTiempos.anadirTiempos(Cuentas._porTipo(entradas, ''), entradas, '');
comprobar('1. media 15 y máximo 20 en MATRICULA; «—» en COMPRA (sin fechas)',
  filas.map(f => [f.tipo, CuentasTiempos.celda(f.media), CuentasTiempos.celda(f.maximo)]),
  [['MATRICULA', '15', '20'], ['COMPRA', '—', '—']]);

/* 2 */
const hoy = '2026-10-20';
const asuntos = [
  { nombre: '260910 MATRICULA 26-27 Pérez, Ana 1234', leido: { fecha: '260910', tipo: 'MATRICULA' }, ficha: { abiertoEl: '2026-09-10T08:00:00Z' } },
  { nombre: '261015 MATRICULA 26-27 Gómez, Luis 5678', leido: { fecha: '261015', tipo: 'MATRICULA' }, ficha: {} },
  { nombre: '250601 MATRICULA 24-25 Ruiz, Eva 9999', leido: { fecha: '250601', tipo: 'MATRICULA' }, ficha: {} }
];
const r = CuentasTiempos.abiertosAntiguos(asuntos.slice(0, 2), '', hoy);
comprobar('2. el de hace 40 días, el primero; el de hace 5, después', r.lista.map(x => [x.a.nombre.slice(0, 6), x.dias]), [['260910', 40], ['261015', 5]]);
comprobar('2. «Abiertos hace más de 30 días: 1»', r.masDe30, 1);
comprobar('2. el número de arriba lo dice', /Abiertos hace más de 30 días: <strong>1<\/strong>/.test(CuentasTiempos.numeroArribaHTML(r)), true);
const tabla = CuentasTiempos.tablaAntiguosHTML(r);
comprobar('2. la tabla, con tipo, días y una fila por asunto',
  [/Los que más tiempo llevan abiertos/.test(tabla), (tabla.match(/class="cuentas-antiguo"/g) || []).length, /<td>40<\/td>/.test(tabla)], [true, 2, true]);

/* 3 */
const r3 = CuentasTiempos.abiertosAntiguos(asuntos, '26-27', hoy);
comprobar('3. con el curso 26-27 elegido, el de 2025 no entra', r3.lista.map(x => x.a.nombre.slice(0, 6)), ['260910', '261015']);
comprobar('3. sin curso, entra y es el más antiguo', CuentasTiempos.abiertosAntiguos(asuntos, '', hoy).lista[0].a.nombre.slice(0, 6), '250601');

/* 4 */
const reservado = { nombre: '260801 EXPEDIENTE 26-27 Secreto, Nadie 0000', leido: { fecha: '260801', tipo: 'EXPEDIENTE', resto: '26-27 Secreto, Nadie 0000' }, ficha: {} };
const t4 = CuentasTiempos.tablaAntiguosHTML(CuentasTiempos.abiertosAntiguos([reservado], '', hoy));
comprobar('4. un reservado, con candado y sin el nombre del tercero', [t4.indexOf('🔒') !== -1, t4.indexOf('Secreto') === -1], [true, true]);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
