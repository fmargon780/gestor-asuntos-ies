/* Prueba de la fila 754 (docs/583-COMPRAS-DE-MATERIAL.md, parte 5): la lógica pura de «Pedido y factura»
   (js/material-factura-datos.js), sin navegador ni disco. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console };
contexto.window = contexto;
vm.createContext(contexto);
for (const f of ['util.js', 'material-datos.js', 'material-precios.js', 'material-factura-datos.js']) vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
const M = contexto.Material, F = M.FacturaDatos;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const pedido = (extra) => Object.assign({
  proveedor: 'Dobla', fecha: '2026-11-14', lineas: [
    { a: 'a1', n: 'Papel A4', u: 'paquete', c: 10, i: 2.15, para: 'Administración' },
    { a: 'a5', n: 'Sobres DL', u: 'caja', c: 2, i: 18.5, para: '' }]
}, extra || {});
const grupo = (p) => [{ nombre: 'A26-1', pedido: p }];

console.log('--- lo recibido y lo facturado ---');
let r = F.resumenDe(grupo(pedido()), {});
comprobar('1a. sin factura, todo «falta la factura» y sin veredicto', [r.porPedido[0].lineas.map((l) => l.estado), r.veredicto, r.faltan], [['falta', 'falta'], '', 2]);
comprobar('1b. lo recibido es, de entrada, todo lo pedido', r.porPedido[0].lineas.map((l) => l.rec), [10, 2]);
let p = pedido({ rec: [9, 2], fac: [{ c: 10, i: 2.25 }, { c: 2, i: 18.5 }] });
r = F.resumenDe(grupo(p), { base: 59, iva: 12.39, tot: 71.39 });
comprobar('1c. recibido 9 de 10; facturado 10 con 9 recibidos; precio distinto', r.porPedido[0].lineas[0].textos,
  ['recibido 9 de 10', 'facturado 10, recibido 9', 'precio 2,25 € en vez de 2,15 €']);
comprobar('1d. la línea que cuadra dice «✓ cuadra»', r.porPedido[0].lineas[1].estado, 'cuadra');
comprobar('1e. con diferencias no hay «conforme»', [r.conforme, r.veredicto, r.diferencias], [false, 'diferencias', 1]);
comprobar('1f. «volver a pedir» cuenta lo no recibido', [r.pendientes, F.reposicion(grupo(p))], [1, [{ a: 'a1', c: 1, para: 'Administración' }]]);

console.log('--- la factura ---');
p = pedido({ fac: [{ c: 10, i: 2.15 }, { c: 2, i: 18.5 }] });   /* 21,50 + 37 = 58,50 */
r = F.resumenDe(grupo(p), { base: 58.5, iva: 12.29, tot: 70.79 });
comprobar('2a. las líneas suman 58,50 €', r.suma, 58.5);
comprobar('2b. todo bien: factura conforme', [r.conforme, r.comprobaciones.map((c) => c.ok)], [true, [true, true, true]]);
r = F.resumenDe(grupo(p), { base: 58, iva: 12.18, tot: 70.18 });
comprobar('2c. una base que no suma lo de las líneas no es conforme', [r.conforme, r.comprobaciones[0].texto], [false, 'Las líneas suman 58,50 € y la base imponible es 58,00 €.']);
r = F.resumenDe(grupo(p), { base: 58.5, iva: 10, tot: 68.5 });
comprobar('2d. un IVA que no es el 21 % dice cuál sería', r.comprobaciones[1].texto, 'El IVA no es el 21 % de la base (sería 12,29 €).');
r = F.resumenDe(grupo(p), { base: 58.5, iva: 12.29, tot: 71 });
comprobar('2e. base más IVA que no da el total', r.comprobaciones[2].texto, 'Base más IVA da 70,79 €, no 71,00 €.');
r = F.resumenDe(grupo(p), { base: '', iva: '', tot: '' });
comprobar('2f. sin importes de factura aún no hay comprobaciones ni «conforme»', [r.comprobaciones.length, r.conforme], [0, false]);
r = F.resumenDe(grupo(p), { base: '58,5', iva: '12,29', tot: '70,79' });
comprobar('2g. los importes con coma valen', r.conforme, true);
r = F.resumenDe(grupo(pedido({ fac: [{ c: 10, i: 2.15 }, { c: '', i: '' }] })), { base: 21.5, iva: 4.52, tot: 26.02 });
comprobar('2h. con una línea sin facturar no se comprueba la factura', [r.faltan, r.comprobaciones.length, r.veredicto], [1, 0, '']);

console.log('--- varios pedidos en una factura ---');
const otro = pedido({ fecha: '2026-11-20', lineas: [{ a: 'a2', n: 'Papel A3', u: 'paquete', c: 3, i: 4.6, para: '' }], fac: [{ c: 3, i: 4.6 }] });
r = F.resumenDe([{ nombre: 'A26-1', pedido: p }, { nombre: 'A26-2', pedido: otro }], { base: 72.3, iva: 15.18, tot: 87.48 });
comprobar('3a. la suma junta las líneas de los dos pedidos (58,50 + 13,80)', [r.suma, r.conforme, r.porPedido.length], [72.3, true, 2]);

console.log('--- a qué pedidos se puede juntar ---');
const t = (nombre, pr, extra) => ({ nombre, pedido: pedido(Object.assign({ proveedor: pr }, extra || {})) });
const todos = [t('A26-1', 'Dobla'), t('A26-2', 'dobla'), t('A26-3', 'Esquina'), t('A26-4', 'Dobla', { junto: ['A26-5'] }), t('A26-5', 'Dobla')];
comprobar('4a. solo del mismo proveedor (otras mayúsculas), sin los que ya van en otra factura ni los que juntan a otros',
  F.juntables(todos, todos[0]).map((x) => x.nombre), ['A26-2']);
comprobar('4b. uno con factura propia con base no se junta', F.juntables([t('A26-1', 'Dobla'), t('A26-2', 'Dobla', { factura: { base: 10 } })], t('A26-1', 'Dobla')).length, 0);

console.log('--- los precios facturados y el registro de lo facturado ---');
comprobar('5a. un precio por línea facturada, con la fecha de la factura y «Factura <nº>»',
  F.preciosFacturados(grupo(p), { f: '2026-11-25', num: 'F-123' }), [
    { a: 'a1', p: 'Dobla', i: 2.15, f: '2026-11-25', o: 'Factura F-123' }, { a: 'a5', p: 'Dobla', i: 18.5, f: '2026-11-25', o: 'Factura F-123' }]);
comprobar('5b. una línea sin precio facturado no pasa', F.preciosFacturados(grupo(pedido({ fac: [{ c: 10, i: 2.2 }] })), { f: '2026-11-25', num: 'X' }).length, 1);
const d = M.normalizarPrecios(null);
F.ponerFactura(d, 'A26-1', 'Dobla', '2026-11-25', 58.5);
F.ponerFactura(d, 'A26-2', 'Dobla', '2026-11-25', '10,5');
comprobar('5c. cada asunto con base queda apuntado', d.facturas.map((x) => [x.id, x.base]), [['A26-1', 58.5], ['A26-2', 10.5]]);
F.ponerFactura(d, 'A26-1', 'Dobla', '2026-11-25', 60);
comprobar('5d. apuntarlo otra vez lo sustituye', d.facturas.filter((x) => x.id === 'A26-1').map((x) => x.base), [60]);
F.ponerFactura(d, 'A26-1', 'Dobla', '2026-11-25', '');
comprobar('5e. sin base se quita', d.facturas.map((x) => x.id), ['A26-2']);
comprobar('5f. un fichero con facturas rotas se lee sin romper', M.normalizarPrecios({ facturas: [null, { id: 'x' }, { id: 'a', p: 'P', f: '2026-01-01', base: 5 }] }).facturas, [{ id: 'a', p: 'P', f: '2026-01-01', base: 5 }]);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
