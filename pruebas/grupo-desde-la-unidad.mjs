/* Prueba de lógica (jsdom) de la fila 525, docs/525-GRUPO-DESDE-LA-UNIDAD.md:
   el hueco {grupo} toma la unidad del alumno cuando el asunto no trae grupo. Nombres inventados. */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
win.App = { E: { usuario: 'Francisco', datos: {} } };
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres-tipos.js', 'nombres-montar.js', 'nombres-terceros.js', 'nombres.js', 'lo-pide.js', 'plantillas.js', 'plantillas-valores.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
/* La persona que devuelve el buscador, tal como se monte cada caso. */
let persona = null;
win.Datos = { cargar: async () => ({ lista: [persona] }), buscar: (lista) => (lista[0] ? [lista[0]] : []) };
const { Plantillas } = win;

function asunto(categoria, tercero, extraFicha) {
  return {
    ficha: Object.assign({ tercero, categoria, tipo: 'ANULACION MATRICULA' }, extraFicha || {}),
    leido: { tipo: 'ANULACION MATRICULA', categoria, resto: tercero }
  };
}

persona = { nombre: 'Ivanyi, Borka', id: '100', categoria: 'ALUMNADO', campos: {}, unidad: '1º ESO B', unidadUltima: '1º ESO B' };
comprobar('matriculado, sin grupo en el asunto: su unidad', (await Plantillas.valoresDeAsunto(asunto('ALUMNADO', 'Ivanyi, Borka 100'))).grupo, '1º ESO B');

persona = { nombre: 'Ivanyi, Borka', id: '100', categoria: 'ALUMNADO', campos: {}, unidad: '', unidadUltima: '4º ESO A' };
comprobar('ya no matriculado: su última unidad', (await Plantillas.valoresDeAsunto(asunto('ALUMNADO', 'Ivanyi, Borka 100'))).grupo, '4º ESO A');

persona = { nombre: 'Ivanyi, Borka', id: '100', categoria: 'ALUMNADO', campos: {}, unidad: '1º ESO B', unidadUltima: '1º ESO B' };
comprobar('con grupo propio en la ficha: el del asunto', (await Plantillas.valoresDeAsunto(asunto('ALUMNADO', 'Ivanyi, Borka 100', { grupo: '2ºESOC' }))).grupo, '2ºESOC');

persona = { nombre: 'Suministros SL', nif: 'B1', categoria: 'EMPRESAS', campos: {}, unidad: '1º ESO B', unidadUltima: 'X' };
comprobar('tercero que no es alumnado: vacío', (await Plantillas.valoresDeAsunto(asunto('EMPRESAS', 'Suministros SL'))).grupo, '');

persona = null;
comprobar('alumno que no se encuentra: vacío', (await Plantillas.valoresDeAsunto(asunto('ALUMNADO', 'Nadie, Nadie 999'))).grupo, '');

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
