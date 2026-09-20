/* Prueba de Membrete.medir (20-sep-2026, fila 81,
   docs/FIRMANTES-Y-MEMBRETE.md, parte 3), sin navegador: es la única
   función sin efectos del módulo (Membrete.montar necesita canvas). */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(raiz + 'membrete.js', 'utf8'), contexto, { filename: 'membrete.js' });
const { Membrete } = contexto;

let fallos = 0;
function comprobar(titulo, cond) {
  if (!cond) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

const CAJA = { x: 10.3, y: 43.2, ancho: 20.7, alto: 10.0 };
const ANCHO_IMAGEN = 2000, ALTO_IMAGEN = 800;

console.log('--- 1. Un nombre corto: una línea, tamaño máximo ---');
{
  const r = Membrete.medir('ABC', CAJA, ANCHO_IMAGEN, ALTO_IMAGEN);
  const tamanoMax = ALTO_IMAGEN * CAJA.alto / 100;
  comprobar('una sola línea', r.lineas.length === 1);
  comprobar('el texto es el mismo', r.lineas[0] === 'ABC');
  comprobar('tamaño de letra, el máximo', Math.abs(r.tamano - tamanoMax) < 1);
}

console.log('--- 2. Un nombre largo: no cabe ni al mínimo, dos líneas ---');
{
  const largo = 'Consejería de Desarrollo Educativo y Formación Profesional de la Junta de Andalucía';
  const r = Membrete.medir(largo, CAJA, ANCHO_IMAGEN, ALTO_IMAGEN);
  const tamanoMax = ALTO_IMAGEN * CAJA.alto / 100;
  const tamanoMin = tamanoMax * 0.55;
  comprobar('dos líneas', r.lineas.length === 2);
  comprobar('tamaño de letra, el mínimo', Math.abs(r.tamano - tamanoMin) < 1);
  comprobar('las dos líneas juntas traen todas las palabras',
    (r.lineas[0] + ' ' + r.lineas[1]).split(' ').length === largo.split(' ').length);
  const dif = Math.abs(r.lineas[0].length - r.lineas[1].length);
  const otroCorteCualquiera = largo.length; // cualquier corte da menos diferencia que "todo en una línea"
  comprobar('el corte deja las dos mitades razonablemente parejas', dif < otroCorteCualquiera);
}

console.log('--- 3. Un nombre intermedio: una línea, tamaño reducido ---');
{
  const intermedio = 'Junta Andalucía';
  const r = Membrete.medir(intermedio, CAJA, ANCHO_IMAGEN, ALTO_IMAGEN);
  const tamanoMax = ALTO_IMAGEN * CAJA.alto / 100;
  comprobar('sigue en una línea', r.lineas.length === 1);
  comprobar('el tamaño ha bajado del máximo', r.tamano < tamanoMax);
  comprobar('pero no ha llegado al mínimo', r.tamano > tamanoMax * 0.55);
}

console.log('--- 4. Texto vacío: no revienta ---');
{
  const r = Membrete.medir('', CAJA, ANCHO_IMAGEN, ALTO_IMAGEN);
  comprobar('una línea vacía', r.lineas.length === 1 && r.lineas[0] === '');
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
