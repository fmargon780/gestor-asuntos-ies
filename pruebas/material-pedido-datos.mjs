/* Prueba de la fila 752 (docs/583-COMPRAS-DE-MATERIAL.md, parte 3): la lógica pura del cuadro «Pedir N artículos»
   (js/material-pedido-datos.js), sin navegador ni disco. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console };
contexto.window = contexto;
vm.createContext(contexto);
for (const f of ['util.js', 'material-datos.js', 'material-precios.js', 'material-pedido-datos.js']) vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
const M = contexto.Material, P = M.PedidoDatos;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const HOY = '2026-11-26';
const precios = M.normalizarPrecios({
  precios: [
    { id: '1', a: 'a1', p: 'Dobla', i: 2.15, f: '2026-11-01', o: 'Correo' }, { id: '2', a: 'a1', p: 'Esquina', i: 2.35, f: '2026-11-10', o: 'Llamada' },
    { id: '3', a: 'a1', p: 'Central', i: 1.9, f: '2025-01-10', o: 'Llamada' },
    { id: '4', a: 'a2', p: 'Dobla', i: 4.6, f: '2026-11-01', o: 'Correo' },
    { id: '5', a: 'a3', p: 'Central', i: 7, f: '2025-02-01', o: 'Llamada' }
  ],
  portes: { dobla: 150 }
});
const cat = M.normalizarCatalogo({ categorias: [{ id: 'c', nombre: 'Papel', car: ['F'], vals: {} }],
  articulos: [{ id: 'a1', cat: 'c', v: ['A4'], u: 'paquete' }, { id: 'a2', cat: 'c', v: ['A3'], u: 'paquete' }, { id: 'a3', cat: 'c', v: ['A5'], u: 'paquete' }, { id: 'a4', cat: 'c', v: ['A6'], u: 'paquete' }] });
const lineas = [{ id: 'l1', a: 'a1', c: 20, para: 'Administración' }, { id: 'l2', a: 'a2', c: 3, para: 'Jefatura' }, { id: 'l3', a: 'a3', c: 1, para: 'Dirección' }, { id: 'l4', a: 'a4', c: 2, para: 'Conserjería' }];

console.log('--- columnas y asignación ---');
const est = { filas: P.filasDeLineas(lineas), extras: [] };
P.asignarPorDefecto(precios, est.filas, HOY);
comprobar('1a. columnas: los proveedores con algún precio de esos artículos, por nombre', P.proveedoresDe(precios, est.filas, est.extras, HOY), ['Central', 'Dobla', 'Esquina']);
comprobar('1b. cada línea va al más barato reciente; sin reciente, al más barato que haya; sin precios, a nadie', est.filas.map((f) => f.asig), ['Dobla', 'Dobla', 'Central', '']);
comprobar('1c. «+ Otro proveedor» añade columna sin precios', P.proveedoresDe(precios, est.filas, ['Nueva SL'], HOY).includes('Nueva SL'), true);
comprobar('1d. una casilla sin precio da null; con precio, el renglón', [P.casilla(precios, 'a2', 'Esquina', HOY), P.casilla(precios, 'a1', 'Dobla', HOY).i], [null, 2.15]);

console.log('--- totales, portes y tope ---');
const t = P.totalesDeProveedor(precios, est.filas, 'Dobla', HOY);
comprobar('2a. lo asignado a Dobla: 20×2,15 + 3×4,60 = 56,80 sin IVA y 68,73 con IVA', t, { lineas: 2, sinIva: 56.8, conIva: 68.73 });
comprobar('2b. portes: faltan 93,20 € para 150', P.portesDe(precios, 'Dobla', 56.8), { limite: 150, gratis: false, falta: 93.2 });
comprobar('2c. portes gratis al llegar al límite', P.portesDe(precios, 'Dobla', 150).gratis, true);
comprobar('2d. sin portes apuntados, límite null', P.portesDe(precios, 'Esquina', 10).limite, null);
comprobar('2e. tope: 11800 + 1200 + 56,80 = 13056,80 (87 %, cerca)', P.topeDe({ facturado: 11800, sinFacturar: 1200 }, 56.8), { usado: 13056.8, pct: 87, estado: 'cerca' });
comprobar('2f. tope pasado', P.topeDe({ facturado: 15000, sinFacturar: 0 }, 1).estado, 'pasado');

console.log('--- cambiar de proveedor ---');
est.filas[0].asig = 'Esquina';
comprobar('3a. cambiar la casilla cambia los totales', [P.totalesDeProveedor(precios, est.filas, 'Dobla', HOY).sinIva, P.totalesDeProveedor(precios, est.filas, 'Esquina', HOY).sinIva], [13.8, 47]);

console.log('--- partir una línea ---');
est.filas[0].asig = 'Dobla';
const r = P.ponerCantidad(est, est.filas[0].id, 12);
comprobar('4a. bajar de 20 a 12 deja 12 aquí y 8 en la fila de debajo, sin asignar', [r.partida, est.filas[0].c, est.filas[1].c, est.filas[1].a, est.filas[1].asig], [{ aqui: 12, resto: 8 }, 12, 8, 'a1', '']);
comprobar('4b. subir no parte', [P.ponerCantidad(est, est.filas[0].id, 15).partida, est.filas[0].c], [null, 15]);
comprobar('4c. cantidad cero o rara no vale', [P.ponerCantidad(est, est.filas[0].id, 0).ok, P.ponerCantidad(est, 'nada', 3).ok], [false, false]);

console.log('--- los pedidos y lo que queda en «Lo que falta» ---');
est.filas[0].c = 12; est.filas[0].asig = 'Dobla';   /* la fila partida (8) queda sin asignar */
const pedidos = P.pedidosDe(cat, precios, est, HOY);
comprobar('5a. un pedido por proveedor con líneas asignadas; lo sin precio ni asignar no entra', pedidos.map((g) => [g.proveedor, g.lineas.length]), [['Central', 1], ['Dobla', 2]]);
comprobar('5b. la línea del pedido lleva nombre, unidad, cantidad, precio e importe', pedidos[1].lineas[0], { a: 'a1', n: 'Papel A4', u: 'paquete', c: 12, i: 2.15, imp: 25.8, para: 'Administración' });
const reparto = P.repartoDeFalta(est, pedidos);
comprobar('5c. se quita lo pedido entero; la 1 se queda con 8 y la sin asignar con lo suyo', [reparto.quitar.sort(), reparto.poner], [['l2', 'l3'], { l1: 8, l4: 2 }]);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
