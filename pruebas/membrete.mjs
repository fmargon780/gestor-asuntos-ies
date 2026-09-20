/* Prueba de lógica (sin navegador) de Membrete.medir (20-sep-2026,
   fila 81, docs/FIRMANTES-Y-MEMBRETE.md).

   Solo se prueba `medir`: es una función sin efectos (nada de DOM ni
   de canvas), a propósito para poder probarla suelta. `montar` (la
   parte con canvas de verdad) no tiene prueba propia todavía: el
   documento lo avisa.

   Casos:
   1. Un nombre corto: una sola línea, al tamaño máximo de la caja.
   2. Un nombre intermedio: una sola línea, pero con el tamaño ya
      reducido (menor que el máximo).
   3. Un nombre largo: no cabe ni al tamaño mínimo, así que se parte en
      dos líneas, lo más parejas posible.
   4. Un nombre largo sin ningún espacio: no hay dónde partir, se deja
      como una sola línea (aunque no quepa del todo). */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarCierto(titulo, condicion) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

const contexto = { window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(RAIZ + 'membrete.js', 'utf8'), contexto);
const { Membrete } = contexto;

const CAJA = { x: 10.3, y: 43.2, ancho: 20.7, alto: 10.0 };
const ANCHO_IMAGEN = 2000;
const ALTO_IMAGEN = 500;

/* ================= 1 · nombre corto: una línea, tamaño máximo ================= */
console.log('--- 1. nombre corto ---');
const corto = Membrete.medir('Junta', CAJA, ANCHO_IMAGEN, ALTO_IMAGEN);
comprobar('una sola línea', corto.lineas.length, 1);
comprobar('al tamaño máximo de la caja', corto.tamano, (CAJA.alto / 100) * ALTO_IMAGEN);

/* ================= 2 · nombre intermedio: una línea, tamaño reducido ================= */
console.log('--- 2. nombre intermedio ---');
const intermedio = Membrete.medir('Consejería de Educación', CAJA, ANCHO_IMAGEN, ALTO_IMAGEN);
comprobar('sigue en una sola línea', intermedio.lineas.length, 1);
comprobarCierto('con el tamaño ya reducido', intermedio.tamano < (CAJA.alto / 100) * ALTO_IMAGEN);
comprobarCierto('nunca por debajo del 55% del máximo', intermedio.tamano >= (CAJA.alto / 100) * ALTO_IMAGEN * 0.55 - 0.001);

/* ================= 3 · nombre largo: dos líneas, parejas ================= */
console.log('--- 3. nombre largo ---');
const largo = Membrete.medir('Consejería de Desarrollo Educativo y Formación Profesional', CAJA, ANCHO_IMAGEN, ALTO_IMAGEN);
comprobar('se parte en dos líneas', largo.lineas.length, 2);
comprobarCierto('las dos líneas juntas tienen todo el texto',
  (largo.lineas[0] + ' ' + largo.lineas[1]) === 'Consejería de Desarrollo Educativo y Formación Profesional');
comprobarCierto('las dos líneas son parecidas de largo',
  Math.abs(largo.lineas[0].length - largo.lineas[1].length) <= 12);

/* ================= 4 · nombre largo sin espacios: no hay dónde partir ================= */
console.log('--- 4. nombre largo sin espacios ---');
const sinEspacios = Membrete.medir('ConsejeriaDeEducacionYDeporteDeAndalucia', CAJA, ANCHO_IMAGEN, ALTO_IMAGEN);
comprobar('se queda en una sola línea, no hay dónde partir', sinEspacios.lineas.length, 1);

console.log(fallos ? '\n' + fallos + ' fallo(s) en membrete.mjs' : '\nTodo bien en membrete.mjs');
if (fallos) process.exit(1);
