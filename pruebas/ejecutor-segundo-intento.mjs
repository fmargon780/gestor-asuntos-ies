/* Prueba de la fila 333 (docs/PRUEBAS-SEGUNDO-INTENTO-A-SOLAS.md), sin navegador:
   la decisión del segundo intento a solas del ejecutor de pruebas (pruebas/apoyo/segundo-intento.mjs).
   1. Falla en paralelo y pasa a solas: cuenta como buena y sale en la línea «pasaron al segundo intento».
   2. Falla las dos veces: queda como fallo.
   3. Una de EN_SOLITARIO que falla no se repite.
   4. Sin fallos, el resumen no lleva la línea del segundo intento.
   5. Con 11 recuperadas sale el aviso de «Demasiadas pruebas…»; con 10, no. */
import { aRepetir, decidir, lineasDelResumen } from './apoyo/segundo-intento.mjs';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const r = (fichero, ok) => ({ fichero, ok, salida: '' });

/* 1 */
{
  const primeros = [r('a.mjs', true), r('b.mjs', false), r('c.mjs', true)];
  const repetir = aRepetir(primeros, []);
  comprobar('1. solo se repite la que falló', repetir, ['b.mjs']);
  const d = decidir(primeros, [r('b.mjs', true)]);
  comprobar('1. pasa a solas: ningún fallo', d.fallos, []);
  comprobar('1. y se nombra como recuperada', d.recuperadas, ['b.mjs']);
  comprobar('1. el resumen lo dice en una línea', lineasDelResumen(d.recuperadas), ['1 pasaron al segundo intento, a solas: b.mjs']);
}
/* 2 */
{
  const primeros = [r('a.mjs', false), r('b.mjs', false)];
  const d = decidir(primeros, [r('a.mjs', false), r('b.mjs', true)]);
  comprobar('2. la que falla las dos veces queda como fallo', d.fallos, ['a.mjs']);
  comprobar('2. la otra se recupera', d.recuperadas, ['b.mjs']);
}
/* 3 */
comprobar('3. una de EN_SOLITARIO que falla no se repite', aRepetir([r('s.mjs', false), r('p.mjs', false)], ['s.mjs']), ['p.mjs']);
{
  const d = decidir([r('s.mjs', false)], []);
  comprobar('3. y sigue siendo un fallo', d.fallos, ['s.mjs']);
}
/* 4 */
{
  const d = decidir([r('a.mjs', true)], []);
  comprobar('4. sin fallos, ninguna línea de segundo intento', lineasDelResumen(d.recuperadas), []);
}
/* 5 */
{
  const nombres = (n) => Array.from({ length: n }, (_, i) => 'p' + i + '.mjs');
  comprobar('5. con 10 recuperadas, sin aviso de «Demasiadas»', lineasDelResumen(nombres(10)).some((l) => /Demasiadas/.test(l)), false);
  const once = lineasDelResumen(nombres(11));
  comprobar('5. con 11, sale el aviso con la cifra y PRUEBAS_A_LA_VEZ=2', [once.length, /Demasiadas pruebas necesitan segundo intento \(11\)/.test(once[1]), /PRUEBAS_A_LA_VEZ=2/.test(once[1])], [2, true, true]);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
