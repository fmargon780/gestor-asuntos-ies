/* Prueba (sin navegador) de js/personas-familias.js (24-sep-2026, fila 125,
   docs/BUSCAR-PERSONAS-Y-FAMILIAS.md): matriculados antes que antiguos,
   buscar por la madre (nombre, apellido, DNI, teléfono) y hermanos. */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../js/', import.meta.url));
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const contexto = { console, window: {}, document: { addEventListener() {}, getElementById() { return null; } } };
vm.createContext(contexto);
contexto.App = contexto.window.App = { E: {} };
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'datos.js', 'datos-alumnado.js', 'datos-personal.js', 'datos-resumen.js', 'datos-listas.js', 'datos-tutores.js', 'personas-familias.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { U, Datos, PersonasFamilias } = vm.runInContext('({ U: U, Datos: Datos, PersonasFamilias: PersonasFamilias })', contexto);

/* El RegAlum de mentira, ya leído (como lo deja Datos.cargar): seis alumnos. */
function madre(nombre, ap1, ap2, dni, tel) {
  const c = { 'Nombre Primer tutor': nombre, 'Primer apellido Primer tutor': ap1, 'Segundo apellido Primer tutor': ap2,
              'Sexo Primer tutor': 'M', 'Teléfono Primer tutor': tel };
  if (dni) c['DNI/Pasaporte Primer tutor'] = dni;
  return c;
}
function alumno(nombre, id, matriculado, unidad, campos) {
  return { nombre, id, categoria: 'ALUMNADO', matriculado, unidad, curso: unidad ? '1º ESO' : '', campos,
           busca: U.normalizar(nombre + ' ' + id) };
}
const MADRE = madre('María Eugenia', 'Farfán', 'Ruiz', '12.345.678-Z', '600 11 22 33');
const lista = [
  alumno('Farfán Gil, Ana', '1001', true, '1º ESO A', MADRE),
  alumno('Farfán Gil, Luis', '1002', true, '3º ESO B', MADRE),
  alumno('Farfán Gil, Pedro', '1003', false, '', MADRE),                                        /* ya no está */
  alumno('López Mena, Sara', '1004', true, '2º ESO A', madre('Rosa', 'Mena', 'Sol', '', '611000000')),
  alumno('López Mena, Tomás', '1005', true, '4º ESO C', madre('Rosa', 'Mena', 'Sol', '', '622000000')),
  alumno('Farfán Otero, Juan', '1006', false, '', madre('Carmen', 'Otero', 'Paz', '99999999R', '633000000'))
];
lista.sort((a, b) => (U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1));
const fuente = { lista };

/* 1. Matriculados antes que antiguos. */
const r = PersonasFamilias.resultados(fuente, 'farfan');
comprobar('1. arriba solo los matriculados', r.actuales.map((p) => p.id), ['1001', '1002']);
comprobar('1. los antiguos, aparte', [r.antiguos.map((p) => p.id), r.antiguosTotal], [['1003', '1006'], 2]);
const sinTexto = PersonasFamilias.resultados(fuente, '');
comprobar('1. sin escribir nada, igual', sinTexto.actuales.every((p) => p.matriculado), true);

/* 2. Buscar la madre. */
const ind = PersonasFamilias.indiceDe(fuente);
function hijos(texto) {
  return PersonasFamilias.buscarFamilias(ind, texto).map((f) => f.hijos.map((h) => h.id));
}
comprobar('2. por nombre: una tarjeta con los dos matriculados', hijos('maria eugenia'), [['1001', '1002']]);
comprobar('2. por apellido, sin tilde y en otro orden', hijos('ruiz farfan'), [['1001', '1002']]);
comprobar('2. por DNI, sin puntos ni guion', hijos('12345678z'), [['1001', '1002']]);
comprobar('2. por DNI, con puntos', hijos('12.345.678'), [['1001', '1002']]);
comprobar('2. por teléfono, junto', hijos('600112233'), [['1001', '1002']]);
comprobar('2. por teléfono, con espacios', hijos('600 11 22 33'), [['1001', '1002']]);
comprobar('2. la madre de un antiguo no sale', hijos('carmen otero'), []);
comprobar('2. un tutor sin DNI se une por su nombre', hijos('rosa mena'), [['1004', '1005']]);
comprobar('2. con menos de 3 letras no busca', hijos('ma'), []);
const tarjeta = PersonasFamilias.buscarFamilias(ind, 'farfan ruiz')[0];
comprobar('2. la tarjeta dice quién es', [tarjeta.nombre, tarjeta.etiquetas, tarjeta.documento],
  ['María Eugenia Farfán Ruiz', ['Tutora 1'], '12.345.678-Z']);

/* 3. Hermanos. */
const ana = lista.find((p) => p.id === '1001');
const sara = lista.find((p) => p.id === '1004');
const juan = lista.find((p) => p.id === '1006');
comprobar('3. hermanos de Ana: Luis, no ella ni el antiguo', PersonasFamilias.hermanosDe(ind, ana).map((p) => p.id), ['1002']);
comprobar('3. hermanos por el nombre de la madre sin DNI', PersonasFamilias.hermanosDe(ind, sara).map((p) => p.id), ['1005']);
comprobar('3. un antiguo no tiene hermanos en el centro', PersonasFamilias.hermanosDe(ind, juan), []);

/* 4. El índice se calcula una vez. */
comprobar('4. el índice se guarda en la lista cargada', PersonasFamilias.indiceDe(fuente) === ind, true);

console.log(fallos ? '\n' + fallos + ' fallo(s) en personas-familias.mjs' : '\nTodo bien en personas-familias.mjs');
if (fallos) process.exit(1);
