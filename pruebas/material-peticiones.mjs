/* Prueba de la fila 753 (docs/583-COMPRAS-DE-MATERIAL.md, parte 4): la lógica pura de «Pedir precios por correo»
   (js/material-peticiones.js), sin navegador ni disco. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console };
contexto.window = contexto;
vm.createContext(contexto);
for (const f of ['util.js', 'material-datos.js', 'material-precios.js', 'material-peticiones.js']) vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
const M = contexto.Material;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

console.log('--- el correo ---');
const t = M.textoPeticion('IES Fuente Lucena', [{ nombre: 'Papel A4 80 g Blanco', c: 20, u: 'paquete de 500 hojas' }, { nombre: 'Grapas 24/6', c: 3, u: 'caja de 1000' }]);
comprobar('1a. el asunto lleva el nombre del centro', t.asunto, 'Petición de precios · IES Fuente Lucena');
comprobar('1b. el cuerpo: saludo, petición, lista y despedida', t.cuerpo,
  'Buenos días:\n\nLes rogamos nos indiquen precio sin IVA y plazo de entrega de:\n\n- Papel A4 80 g Blanco: 20 × paquete de 500 hojas\n- Grapas 24/6: 3 × caja de 1000\n\nUn saludo.\nAdministración');

console.log('--- los correos de un proveedor ---');
comprobar('2a. uno solo', M.correosDe('pedidos@dobla.es'), ['pedidos@dobla.es']);
comprobar('2b. varios, separados por coma, punto y coma o espacio, sin repetir', M.correosDe('a@x.es; b@x.es, A@x.es c@x.es'), ['a@x.es', 'b@x.es', 'c@x.es']);
comprobar('2c. vacío o sin arroba: no hay correo', [M.correosDe('').length, M.correosDe('sin correo').length, M.correosDe(null).length], [0, 0, 0]);

console.log('--- apuntar y leer lo pedido ---');
const d = M.normalizarPrecios(null);
comprobar('3a. sin peticiones no hay nota', M.peticionDe(d, 'a1'), null);
const r = M.anotarPeticiones(d, { proveedores: ['Dobla', 'Esquina'], articulos: ['a1', 'a2'], f: '2026-11-20' });
comprobar('3b. un apunte por proveedor y artículo', [r.ok, r.n, d.peticiones.length], [true, 4, 4]);
comprobar('3c. la petición de un artículo: fecha y a cuántos proveedores', M.peticionDe(d, 'a1'), { f: '2026-11-20', n: 2 });
M.anotarPeticiones(d, { proveedores: ['Copistería'], articulos: ['a1'], f: '2026-11-26' });
comprobar('3d. manda la última petición, con los proveedores de ESE envío', M.peticionDe(d, 'a1'), { f: '2026-11-26', n: 1 });
comprobar('3e. otro artículo conserva la suya', M.peticionDe(d, 'a2'), { f: '2026-11-20', n: 2 });
comprobar('3f. un artículo sin petición: nada', M.peticionDe(d, 'a9'), null);
const n = M.normalizarPrecios(JSON.parse(JSON.stringify(d)));
comprobar('3g. se guarda y se vuelve a leer igual', [n.peticiones.length, M.peticionDe(n, 'a1')], [5, { f: '2026-11-26', n: 1 }]);
comprobar('3h. un fichero roto no rompe la lectura', M.normalizarPrecios({ peticiones: [null, { a: 'x' }, 3] }).peticiones, []);

console.log('--- la nota en «Mejor precio» ---');
M.estado = { precios: d };
comprobar('4a. «precios pedidos el … a N proveedores»', M.notaDePeticion('a2'), 'precios pedidos el 20-nov-2026 a 2 proveedores');
comprobar('4b. a un solo proveedor, en singular', M.notaDePeticion('a1'), 'precios pedidos el 26-nov-2026 a 1 proveedor');
comprobar('4c. sin petición, nada', M.notaDePeticion('a9'), '');

console.log('--- el botón ---');
comprobar('5. «Pedir precios de lo marcado» está entre las acciones de «Lo que falta»', M.accionesDeFalta.map((a) => a.texto), ['Pedir precios de lo marcado']);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
