/* Prueba de la fila 751 (docs/583-COMPRAS-DE-MATERIAL.md, parte 2): la lógica pura de los precios de cada proveedor y
   de las cifras de «Proveedores» (js/material-precios.js), sin navegador ni disco. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console };
contexto.window = contexto;
vm.createContext(contexto);
for (const f of ['util.js', 'material-datos.js', 'material-precios.js']) vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
const M = contexto.Material;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const HOY = '2026-11-26';
const d = M.normalizarPrecios(null);
const alta = (o) => M.anadirPrecio(d, Object.assign({ a: 'x', p: 'Dobla', i: 2.15, f: '2026-11-20', o: 'Llamada' }, o));

console.log('--- alta de precios ---');
comprobar('1a. un precio se apunta', [alta({}).ok, d.precios.length], [true, 1]);
comprobar('1b. sin proveedor, sin precio, sin fecha o sin origen no se apunta', [alta({ p: '' }).ok, alta({ i: 0 }).ok, alta({ f: '' }).ok, alta({ o: '' }).ok], [false, false, false, false]);
comprobar('1c. «Presupuesto» exige el documento', [alta({ o: 'Presupuesto' }).ok, alta({ o: 'Presupuesto', d: { asunto: 'A26-1', doc: 'p.pdf' } }).ok], [false, true]);
const antes = d.precios.length;
const mismo = alta({ i: 2.2, p: 'dobla' });
comprobar('1d. mismo artículo, proveedor (otras mayúsculas) y día: sustituye', [mismo.sustituye, d.precios.length, d.precios.filter((p) => p.f === '2026-11-20' && p.o === 'Llamada')[0].i], [true, antes, 2.2]);
comprobar('1e. el precio se redondea a céntimos', alta({ p: 'Esquina', i: 3.456 }).precio.i, 3.46);

console.log('--- el mejor precio y los renglones ---');
const e = M.normalizarPrecios(null);
const nuevo = (o) => M.anadirPrecio(e, Object.assign({ a: 'a1', o: 'Correo' }, o));
nuevo({ p: 'Dobla', i: 2.15, f: '2026-11-01' });
nuevo({ p: 'Dobla', i: 2.4, f: '2026-11-20' });          /* el último de Dobla manda */
nuevo({ p: 'Esquina', i: 2.3, f: '2026-10-01' });
nuevo({ p: 'Copistería', i: 1.9, f: '2026-02-01' });     /* de hace más de seis meses */
const r = M.renglonesDe(e, 'a1', HOY);
comprobar('2a. un renglón por proveedor, de barato a caro, con su último precio', r.map((x) => [x.proveedor, x.i]), [['Copistería', 1.9], ['Esquina', 2.3], ['Dobla', 2.4]]);
comprobar('2b. el de hace más de seis meses no es reciente y no puede ser el mejor', r.map((x) => [x.reciente, x.mejor]), [[false, false], [true, true], [true, false]]);
comprobar('2c. el mejor precio es el más barato de los recientes', M.mejorPrecioDe(e, 'a1', HOY).texto, '2,30 € · Esquina (1-oct-2026)');
comprobar('2d. sin precio reciente', [M.mejorPrecioDe(e, 'a1', '2027-06-01').texto, M.mejorPrecioDe(e, 'otro', HOY).texto], ['Sin precio reciente', 'Sin precio reciente']);
comprobar('2e. el límite de seis meses', [M.limiteReciente('2026-11-26'), M.limiteReciente('2026-08-31')], ['2026-05-26', '2026-03-03']);
comprobar('2f. un fichero roto no rompe la lectura', M.normalizarPrecios({ precios: [null, { id: 'x' }, { id: 'p', a: 'a', p: 'P', i: -1 }], portes: 'x', cifras: 3 }), { peticiones: [], precios: [], portes: {}, cifras: {} });

console.log('--- portes y tope ---');
comprobar('3a. portes gratis desde 150 (con coma)', [M.ponerPortes(e, 'Dobla', '150,50').importe, e.portes.dobla], [150.5, 150.5]);
comprobar('3b. vacío quita lo apuntado', [M.ponerPortes(e, 'Dobla', '').vacio, e.portes.dobla], [true, undefined]);
comprobar('3c. un importe que no vale se rechaza', M.ponerPortes(e, 'Dobla', 'mucho').ok, false);
const f = (fact, sin) => M.filaDeProveedor(M.normalizarPrecios({ cifras: { x: { facturado: fact, sinFacturar: sin } } }), 'X', 'x@x.es');
comprobar('3d. por debajo del 80 %: bien', [f(11900, 0).estado, f(11900, 0).pct], ['bien', 79]);
comprobar('3e. desde el 80 %: cerca del tope', [f(11800, 200).estado, f(11800, 200).pct], ['cerca', 80]);
comprobar('3f. justo en 15.000: aún cerca; al pasarlo: pasado', [f(15000, 0).estado, f(15000, 0.01).estado], ['cerca', 'pasado']);
comprobar('3g. sin cifras, todo a cero', [M.filaDeProveedor(M.normalizarPrecios(null), 'Y', '').usado, M.filaDeProveedor(M.normalizarPrecios(null), 'Y', '').estado], [0, 'bien']);
comprobar('3h. importes con puntos de millar y coma', [M.euros(15000), M.euros(2.15), M.euros(1234567.8)], ['15.000,00 €', '2,15 €', '1.234.567,80 €']);

console.log('--- la lista de proveedores ---');
const empresas = [{ nombre: 'Dobla, S.L.', correo: 'p@dobla.es' }, { nombre: 'Esquina', correo: '' }];
comprobar('4a. uno por proveedor con precio, con su correo de «Personas y empresas»', M.proveedoresDe(e, empresas, []).map((x) => [x.nombre, x.correo]), [['Copistería', ''], ['Dobla', ''], ['Esquina', '']]);
comprobar('4b. con otro nombre exacto, sale el de la empresa', M.proveedoresDe(M.normalizarPrecios({ precios: [{ id: 'p', a: 'a', p: 'dobla, s.l.', i: 1 }] }), empresas, ['Esquina']).map((x) => [x.nombre, x.correo]), [['Dobla, S.L.', 'p@dobla.es'], ['Esquina', '']]);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
