/* Prueba de la fila 750 (docs/583-COMPRAS-DE-MATERIAL.md, parte 1): la lógica pura del catálogo y de lo que
   falta (js/material-datos.js), sin navegador ni disco. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console };
contexto.window = contexto;
vm.createContext(contexto);
for (const f of ['util.js', 'material-datos.js']) vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
const M = contexto.Material;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const cat = M.normalizarCatalogo(null);
const falta = M.normalizarFalta(null);

console.log('--- categorías ---');
const cartulina = M.crearCategoria(cat, { nombre: 'Cartulina', car: M.caracteristicasDe('Formato, Color, Acabado, Gramaje, formato, '), sin: false });
comprobar('1a. las características repetidas o vacías se quitan', cartulina.categoria.car, ['Formato', 'Color', 'Acabado', 'Gramaje']);
comprobar('1b. una categoría sin nombre no se crea', M.crearCategoria(cat, { nombre: ' ', car: ['A'] }).ok, false);
comprobar('1c. una categoría sin características no se crea', M.crearCategoria(cat, { nombre: 'Algo', car: [] }).ok, false);
comprobar('1d. dos categorías con el mismo nombre (otras mayúsculas) no se crean', M.crearCategoria(cat, { nombre: 'cartulina', car: ['A'] }).ok, false);
const grapas = M.crearCategoria(cat, { nombre: 'Pequeño material', car: ['Tipo', 'Medida'], sin: true }).categoria;

console.log('--- artículos ---');
const a3 = M.crearArticulo(cat, { cat: cartulina.categoria.id, v: ['A3', 'Azul', 'Satinado', '180 g'], u: 'paquete de 50' });
const a4 = M.crearArticulo(cat, { cat: cartulina.categoria.id, v: ['A4', 'Azul', 'Mate', '180 g'], u: 'paquete de 100' });
comprobar('2a. el nombre empieza por el de la categoría', M.nombreDe(cat, a3.articulo), 'Cartulina A3 Azul Satinado 180 g');
comprobar('2b. la A3 satinada y la A4 mate son dos artículos', cat.articulos.length, 2);
comprobar('2c. el valor «Azul» entra una sola vez en su lista', cartulina.categoria.vals.Color, ['Azul']);
comprobar('2d. un artículo igual (otras mayúsculas) no se guarda y lo dice', (() => { const r = M.crearArticulo(cat, { cat: cartulina.categoria.id, v: ['a4', 'azul', 'mate', '180 G'], u: 'paquete de 100' }); return [r.ok, r.error]; })(), [false, 'Ese artículo ya existe: Cartulina A4 Azul Mate 180 g']);
comprobar('2e. un valor escrito con otras mayúsculas usa el que ya había', (() => { const r = M.crearArticulo(cat, { cat: cartulina.categoria.id, v: ['A4', 'azul', 'Mate', '200 g'], u: 'Paquete de 100' }); return [r.articulo.v[1], r.articulo.u]; })(), ['Azul', 'paquete de 100']);
comprobar('2f. sin nombre de categoría delante: «Grapas 24/6»', M.nombreDe(cat, M.crearArticulo(cat, { cat: grapas.id, v: ['Grapas', '24/6'], u: 'caja de 1000' }).articulo), 'Grapas 24/6');
comprobar('2g. sin «se compra por» no se guarda', M.crearArticulo(cat, { cat: grapas.id, v: ['Clips', ''], u: '' }).ok, false);
comprobar('2h. sin ningún valor no se guarda', M.crearArticulo(cat, { cat: grapas.id, v: ['', ''], u: 'caja' }).ok, false);
comprobar('2i. el valor nuevo que ya estaba con otras mayúsculas se elige y se avisa', M.resolverValor(['Azul', 'Rojo'], ' azul '), { valor: 'Azul', yaEstaba: true });
comprobar('2j. un valor nuevo de verdad se queda tal cual', M.resolverValor(['Azul'], 'Verde'), { valor: 'Verde', yaEstaba: false });

console.log('--- cambiar las características ---');
const antes = M.nombreDe(cat, a4.articulo);
M.cambiarCaracteristicas(cat, cartulina.categoria.id, ['Gramaje', 'Formato', 'Color', 'Acabado', 'Textura'], false);
comprobar('3a. cambiar el orden conserva los datos de los artículos', a4.articulo.v, ['180 g', 'A4', 'Azul', 'Mate', '']);
comprobar('3b. y el nombre cambia solo de orden', M.nombreDe(cat, a4.articulo), 'Cartulina 180 g A4 Azul Mate');
comprobar('3c. una característica nueva empieza con su lista vacía', cartulina.categoria.vals.Textura, []);
M.cambiarCaracteristicas(cat, cartulina.categoria.id, ['Formato', 'Color', 'Acabado', 'Gramaje'], false);
comprobar('3d. quitar una característica quita su valor y lo demás se conserva', M.nombreDe(cat, a4.articulo), antes);

console.log('--- buscar ---');
comprobar('4a. todas las palabras, en cualquier orden', M.buscar(cat, 'azul a3').map((a) => M.nombreDe(cat, a)), ['Cartulina A3 Azul Satinado 180 g']);
comprobar('4b. sin tildes ni mayúsculas', M.buscar(cat, 'PEQUENO tipo grapas').length, 0);
comprobar('4c. el nombre de la categoría también cuenta aunque no vaya delante', M.buscar(cat, 'pequeño grapas').map((a) => M.nombreDe(cat, a)), ['Grapas 24/6']);
comprobar('4d. nada escrito, nada sugerido', M.buscar(cat, '  '), []);
comprobar('4e. una palabra que no está no sugiere nada', M.buscar(cat, 'tóner'), []);

console.log('--- lo que falta ---');
const ahora = { a: a4.articulo.id, c: 2, para: 'Administración', q: 'Diego', f: '2026-11-25' };
const l1 = M.apuntar(falta, ahora);
comprobar('5a. apuntar crea una línea con quién y cuándo', [l1.ok, l1.suma, falta.lineas[0].q, falta.lineas[0].f], [true, false, 'Diego', '2026-11-25']);
const l2 = M.apuntar(falta, { ...ahora, c: 3, para: 'administración' });
comprobar('5b. lo mismo para el mismo destino suma la cantidad', [l2.suma, falta.lineas.length, falta.lineas[0].c], [true, 1, 5]);
M.apuntar(falta, { ...ahora, para: 'Conserjería' });
comprobar('5c. para otro destino es otra línea', falta.lineas.length, 2);
comprobar('5d. sin cantidad no se apunta', M.apuntar(falta, { ...ahora, c: 0 }).ok, false);
comprobar('5e. sin artículo no se apunta', M.apuntar(falta, { ...ahora, a: '' }).ok, false);
comprobar('5f. cambiar la cantidad de una línea', [M.ponerCantidad(falta, falta.lineas[0].id, 7), falta.lineas[0].c, M.ponerCantidad(falta, falta.lineas[0].id, 0)], [true, 7, false]);
const id0 = falta.lineas[0].id;
M.quitar(falta, [id0]);
comprobar('5g. quitar saca la línea y deja su lápida', [falta.lineas.length, falta.quitadas], [1, [id0]]);
const vieja = M.normalizarFalta({ lineas: [{ id: id0, a: 'x', c: 1 }, { id: 'otra', a: 'y', c: 1 }], quitadas: [id0] });
comprobar('5h. lo quitado no resucita aunque llegue de una copia vieja', M.sinQuitadas(vieja).lineas.map((l) => l.id), ['otra']);
comprobar('5i. destinos de fábrica', M.destinosDe(M.normalizarFalta(null)), ['Administración', 'Dirección', 'Jefatura de estudios', 'Conserjería']);
const nd = M.anadirDestino(falta, 'Dpto. de Lengua');
comprobar('5j. un destino nuevo se añade; otra vez, con otras mayúsculas, no', [nd.ok, M.anadirDestino(falta, 'dpto. de lengua').yaEstaba, M.destinosDe(falta).length], [true, true, 5]);
comprobar('5k. un fichero roto no rompe la lectura', [M.normalizarCatalogo({ categorias: 'x', articulos: [null, { id: 'a' }] }).articulos.length, M.normalizarFalta({ lineas: [null, 3] }).lineas.length], [0, 0]);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
