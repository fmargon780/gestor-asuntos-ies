/* Prueba de la fila 69 (docs/PRUEBAS-QUE-FALTAN.md, 2.3): los
   asuntos recurrentes, 487 líneas de js/recurrentes.js que hasta esta
   fila no probaba nadie.

   Sin navegador, con el disco de mentira en memoria, cargando en un
   contexto vm: util.js, carpetas.js, copias.js, nucleo.js, nombres.js,
   plazos.js y recurrentes.js (la lógica de verdad, con
   `_cargar`/`_pendientes`/`_crearLosQueTocan` expuestos en
   `window.Recurrentes` solo para esta prueba).

   NOTA sobre el encargo: pide comprobar también "Ocultar por hoy",
   pero `js/recurrentes.js` no tiene ese botón — solo "Crear" y "Ver
   la lista en Ajustes" (`pintarPanel`, líneas 199-240). Es un hueco
   entre lo que pide el papel y lo que hay, no algo que se pueda
   arreglar en una línea evidente: se deja fuera de esta prueba y
   queda anotado en `docs/HUECOS-ENCONTRADOS-FILA-69.md`. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function elementoFalso() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {}, addEventListener() {}, querySelector() { return null; },
    style: {}
  };
}
const contexto = {
  console, TextDecoder, Blob, indexedDB: null,
  document: {
    getElementById: elementoFalso,
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: elementoFalso,
    addEventListener: function () {},
    readyState: 'complete'
  }
};
contexto.window = contexto;
contexto.addEventListener = function () {};
vm.createContext(contexto);
for (const f of ['util.js', 'carpetas.js', 'copias.js', 'nucleo.js', 'nombres.js', 'plazos.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, Carpetas } = contexto;

contexto.Gestor = {
  carpetaGestor: function () { return App.E.gestor; },
  carpetaAbiertos: function () { return App.E.abiertos; },
  usuario: function () { return App.E.usuario; },
  anotar: function (nombre, datos) { return App.anotar(nombre, datos); },
  recargar: async function () {},
  alRefrescar: []
};
vm.runInContext(fs.readFileSync(raiz + 'recurrentes.js', 'utf8'), contexto, { filename: 'recurrentes.js' });
const { Recurrentes } = contexto;

contexto.U.aviso = function () {};

/* ---------- disco de mentira ---------- */
function dirFalso(nombre) {
  const hijos = new Map();
  return {
    kind: 'directory', name: nombre, _hijos: hijos,
    async getDirectoryHandle(n, o) {
      if (!hijos.has(n)) {
        if (!o || !o.create) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
        hijos.set(n, dirFalso(n));
      }
      const x = hijos.get(n);
      if (x.kind !== 'directory') throw new Error('no es carpeta');
      return x;
    },
    async getFileHandle(n, o) {
      if (!hijos.has(n)) {
        if (!o || !o.create) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
        hijos.set(n, ficheroFalso(n, ''));
      }
      return hijos.get(n);
    },
    async removeEntry(n) {
      if (!hijos.has(n)) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
      hijos.delete(n);
    },
    async *entries() { for (const par of hijos) yield par; }
  };
}
function ficheroFalso(nombre, texto) {
  return {
    kind: 'file', name: nombre, _texto: texto,
    async getFile() {
      const self = this;
      return { async arrayBuffer() { return new TextEncoder().encode(self._texto).buffer; },
               size: new TextEncoder().encode(self._texto).length,
               _texto: self._texto };
    },
    async createWritable() {
      const self = this;
      return {
        async write(cosa) {
          if (typeof cosa === 'string') self._texto = cosa;
          else if (cosa && typeof cosa.text === 'function') self._texto = await cosa.text();
          else if (cosa && cosa._texto !== undefined) self._texto = cosa._texto;
        },
        async close() {}
      };
    }
  };
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- el disco: abiertos y _GESTOR ---------- */
const abiertos = dirFalso('abiertos');
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
App.E.abiertos = abiertos;
App.E.archivo = dirFalso('archivo');
App.E.gestor = gestor;
App.E.usuario = 'Francisco';
App.E.tipos = [];

function hace(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* ================================================================
   1. Avisa cuando toca: un mensual creado hace 40 días ya tocaría
   otra vez; uno de hace 5 días, no.
   ================================================================ */
console.log('--- 1. avisa cuando toca ---');

await Carpetas.escribirTexto(gestor, 'recurrentes.json', JSON.stringify([
  { id: 'r1', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Proveedor Uno, SL', periodo: 'mensual', dia: 1, ultima: hace(40), parado: false },
  { id: 'r2', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Proveedor Dos, SL', periodo: 'mensual', dia: 1, ultima: hace(5), parado: false }
]));
await Recurrentes._cargar();
const toca1 = Recurrentes._pendientes();
comprobar('el de hace 40 días toca, el de hace 5 no',
  toca1.map(function (r) { return r.id; }), ['r1']);

/* ================================================================
   2. Crear desde el aviso monta la carpeta y la ficha bien.
   ================================================================ */
console.log('--- 2. crear desde el aviso ---');

await Recurrentes._crearLosQueTocan();

const carpetasAbiertos = (await Carpetas.subcarpetas(abiertos)).map(function (c) { return c.nombre; });
const nueva = carpetasAbiertos.filter(function (n) { return /FACTURA/.test(n) && /Proveedor Uno/.test(n); })[0];
comprobar('se ha creado una sola carpeta para el que tocaba', carpetasAbiertos.filter(function (n) { return /FACTURA/.test(n); }).length, 1);

const asuntosTexto = await Carpetas.leerTexto(gestor, 'asuntos.json');
const asuntos = JSON.parse(asuntosTexto).asuntos;
const ficha = nueva ? asuntos[nueva] : null;
comprobar('la ficha se crea abierta, con el recurrente apuntado',
  ficha && { estado: ficha.estado, tercero: ficha.tercero, recurrente: ficha.recurrente },
  { estado: 'abierto', tercero: 'Proveedor Uno, SL', recurrente: 'r1' });

/* ================================================================
   3. No avisa dos veces del mismo: tras crearlo, su próxima fecha
   queda en el futuro y deja de estar entre los pendientes.
   ================================================================ */
console.log('--- 3. no avisa dos veces del mismo ---');

const toca2 = Recurrentes._pendientes();
comprobar('el que se acaba de crear ya no está entre los pendientes',
  toca2.map(function (r) { return r.id; }), []);

const recurrentesTrasCrear = JSON.parse(await Carpetas.leerTexto(gestor, 'recurrentes.json'));
const r1TrasCrear = recurrentesTrasCrear.filter(function (r) { return r.id === 'r1'; })[0];
comprobar('el recurrente guarda la fecha de hoy como última vez', r1TrasCrear.ultima, hace(0));

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
