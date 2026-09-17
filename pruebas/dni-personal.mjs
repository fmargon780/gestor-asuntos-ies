/* Prueba de la fila 29 (docs/DNI-DEL-PERSONAL.md): el DNI del personal,
   arriba en la ficha y en la línea de debajo del nombre. Sin navegador,
   con un contexto de mentira: solo hace falta `Datos.destacadosPersona`
   (js/datos.js) y `App.piePersona`/`App.pieDe` (js/asuntos-nuevo.js),
   nunca DOM de verdad, así que `$` es un simulacro que no toca ningún
   documento. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = {
  console, TextDecoder, Blob, window: {}, indexedDB: null,
  App: {}, $: function () { return {}; }
};
vm.createContext(contexto);
for (const f of ['util.js', 'carpetas.js', 'nombres.js', 'datos.js', 'asuntos-nuevo.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Datos, App } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- 1. de Séneca, con DNI/Pasaporte ---------- */
const deSeneca = {
  nombre: 'Aguado Ranea, Marcos Antonio', documento: '33357591R', puesto: 'Música P.E.S.',
  categoria: 'PERSONAL', enElCentro: true, deSeneca: true, cursos: ['26-27'],
  campos: { 'Empleado/a': 'Aguado Ranea, Marcos Antonio', 'DNI/Pasaporte': '33357591R', 'Puesto': 'Música P.E.S.' }
};
const fichaSeneca = Datos.destacadosPersona(deSeneca);
comprobar('de Séneca: la primera fila de la ficha es el DNI', fichaSeneca.destacados[0], { titulo: 'DNI', valor: '33357591R' });
comprobar('de Séneca: el DNI no se repite abajo, en "resto"',
  fichaSeneca.resto.some((f) => String(f.valor).trim() === '33357591R'), false);
comprobar('de Séneca: en la línea de debajo del nombre sale "DNI 33357591R" al final',
  App.pieDe(deSeneca).indexOf('DNI 33357591R') !== -1 &&
  App.pieDe(deSeneca).indexOf('DNI 33357591R') === App.pieDe(deSeneca).length - 'DNI 33357591R'.length, true);

/* ---------- 2. dado de alta a mano, con Documento ---------- */
const aMano = {
  nombre: 'Marmolejo González, Francisco', documento: '11112222X', puesto: 'Auxiliar administrativo',
  categoria: 'PERSONAL', enElCentro: true, deSeneca: false, cursos: ['26-27'],
  campos: { 'Nombre': 'Marmolejo González, Francisco', 'Documento': '11112222X', 'Puesto': 'Auxiliar administrativo' }
};
const fichaAMano = Datos.destacadosPersona(aMano);
comprobar('a mano: la primera fila de la ficha es el DNI', fichaAMano.destacados[0], { titulo: 'DNI', valor: '11112222X' });
comprobar('a mano: el DNI no se repite abajo, en "resto"',
  fichaAMano.resto.some((f) => String(f.valor).trim() === '11112222X'), false);
comprobar('a mano: en la línea de debajo del nombre también sale el DNI',
  App.pieDe(aMano).indexOf('DNI 11112222X') !== -1, true);

/* ---------- 3. sin documento: ni fila, ni aviso ---------- */
const sinDocumento = {
  nombre: 'Ordóñez Gil, Rafael', documento: '', puesto: 'Ordenanza',
  categoria: 'PERSONAL', enElCentro: true, deSeneca: true, cursos: ['26-27'],
  campos: { 'Empleado/a': 'Ordóñez Gil, Rafael', 'Puesto': 'Ordenanza' }
};
const fichaSinDocumento = Datos.destacadosPersona(sinDocumento);
comprobar('sin documento: no hay fila DNI',
  fichaSinDocumento.destacados.some((f) => f.titulo === 'DNI'), false);
comprobar('sin documento: la ficha sigue empezando por el puesto',
  fichaSinDocumento.destacados[0].titulo, 'Puesto');
comprobar('sin documento: no se avisa de nada en la línea de debajo del nombre',
  App.pieDe(sinDocumento).indexOf('DNI') === -1, true);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
