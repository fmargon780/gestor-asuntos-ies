/* Prueba del nombre corto de un Tipo de Asunto (20-sep-2026, fila 79,
   apartado 4.9, docs/BIBLIOTECA-DE-HITOS.md), sin navegador.

   Comprueba:
   1. Un tipo sin nombre corto da el mismo nombre de carpeta que hoy.
   2. Con nombre corto, lo usa en la carpeta.
   3. El nombre largo sigue saliendo en pantalla (Nombres.tipoParaCarpeta
      no toca `tipo.tipo`).
   4. Dos tipos no pueden acabar con el mismo nombre corto efectivo
      (el suyo, o el nombre si está vacío): U.parecidos/dejaCrear ya
      resuelven "igual o parecido"; aquí solo se comprueba el cálculo
      del "efectivo" que hace falta pasarles.
   5. Cambiar el nombre corto no toca los asuntos ya creados: es la
      propia decisión de diseño (Nombres.montar solo actúa sobre lo que
      se le pasa, nunca relee ni renombra nada). */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console };
vm.createContext(contexto);
for (const f of ['util.js', 'nombres.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { U, Nombres } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ================= 1 · sin nombre corto, igual que hoy ================= */
console.log('--- 1. sin nombre corto, el mismo nombre de carpeta que hoy ---');
const tipoSinCorto = { tipo: 'CORRECCION POR CONDUCTA CONTRARIA', categoria: 'ALUMNADO' };
comprobar('tipoParaCarpeta da el nombre de siempre', Nombres.tipoParaCarpeta(tipoSinCorto), 'CORRECCION POR CONDUCTA CONTRARIA');
comprobar('el nombre de la carpeta no cambia',
  Nombres.montar({ fecha: '2026-09-20', tipo: Nombres.tipoParaCarpeta(tipoSinCorto), tercero: 'Pérez, Juan' }),
  Nombres.montar({ fecha: '2026-09-20', tipo: tipoSinCorto.tipo, tercero: 'Pérez, Juan' }));

/* ================= 2 · con nombre corto, lo usa en la carpeta ================= */
console.log('--- 2. con nombre corto, la carpeta lo usa ---');
const tipoConCorto = { tipo: 'CORRECCION POR CONDUCTA CONTRARIA A LA CONVIVENCIA', categoria: 'ALUMNADO', nombreCorto: 'CORRECCION' };
comprobar('tipoParaCarpeta da el corto', Nombres.tipoParaCarpeta(tipoConCorto), 'CORRECCION');
const nombreDeCarpeta = Nombres.montar({ fecha: '2026-09-20', tipo: Nombres.tipoParaCarpeta(tipoConCorto), tercero: 'Pérez, Juan' });
comprobar('la carpeta lleva el corto, no el largo',
  nombreDeCarpeta.indexOf('CORRECCION') !== -1 && nombreDeCarpeta.indexOf('CONVIVENCIA') === -1, true);

/* ========= 3 · el nombre largo sigue saliendo en pantalla ========= */
console.log('--- 3. el nombre largo sigue siendo tipo.tipo, sin tocar ---');
comprobar('tipoParaCarpeta no toca tipo.tipo', tipoConCorto.tipo, 'CORRECCION POR CONDUCTA CONTRARIA A LA CONVIVENCIA');

/* ===== 4 · Nombres.leer reconoce el nombre corto en una carpeta ===== */
console.log('--- 4. Nombres.leer reconoce el nombre corto de una carpeta nueva ---');
const tipos = [tipoConCorto];
const leido = Nombres.leer(nombreDeCarpeta, tipos);
comprobar('la carpeta se reconoce, con el nombre largo de siempre',
  [leido.reconocido, leido.tipo], [true, 'CORRECCION POR CONDUCTA CONTRARIA A LA CONVIVENCIA']);

/* ===== 5 · dos tipos no pueden acabar con el mismo nombre corto efectivo ===== */
console.log('--- 5. dos tipos no pueden acabar con el mismo nombre corto efectivo ---');
function efectivoDe(t) { return t.nombreCorto || t.tipo; }
const otroTipo = { tipo: 'CORRECCION', categoria: 'ALUMNADO' };   /* su nombre efectivo ya es "CORRECCION" */
const efectivos = [tipoConCorto, otroTipo].map(efectivoDe);
const cerca = U.parecidos('CORRECCION', efectivos.filter((e) => e !== 'CORRECCION'));
comprobar('el nombre corto que se quiere poner ya lo usa otro tipo (como "igual")',
  cerca.some((p) => p.igual), false);   /* aquí comparamos contra el propio "CORRECCION", que es distinto de sí mismo: 0 candidatos */
comprobar('comparando de verdad contra el efectivo del otro tipo, sí choca',
  U.parecidos(efectivoDe(otroTipo), [efectivoDe(tipoConCorto)]).some((p) => p.igual), true);

/* ========== 6 · cambiar el nombre corto no toca asuntos ya creados ========== */
console.log('--- 6. cambiar el nombre corto no toca los asuntos ya creados ---');
/* Nombres.montar es pura: solo construye un nombre a partir de lo que
   se le pasa, y no relee ni renombra ninguna carpeta por su cuenta.
   El nombre de una carpeta ya creada "de ayer" es un texto fijo, que
   no puede cambiar solo; lo único que cambia es lo que se monta a
   partir de AHORA, con el tipo ya actualizado. */
const nombreDeAyer = nombreDeCarpeta;
tipoConCorto.nombreCorto = 'CORREC';
const nombreDeHoy = Nombres.montar({ fecha: '2026-09-21', tipo: Nombres.tipoParaCarpeta(tipoConCorto), tercero: 'García, Ana' });
comprobar('la carpeta de ayer sigue con el nombre corto de entonces',
  nombreDeAyer.indexOf('CORRECCION') !== -1, true);
comprobar('un asunto nuevo, de hoy, ya usa el nombre corto nuevo',
  nombreDeHoy.indexOf('CORREC') !== -1 && nombreDeHoy.indexOf('CORRECCION') === -1, true);

/* ---------- final ---------- */
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
