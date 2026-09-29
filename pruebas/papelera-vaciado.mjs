/* Prueba de la fila 203 (docs/PAPELERA-SE-VACIA-SOLA.md): la papelera se
   vacía sola a los 90 días, con aviso a los 7 y constancia.

   Sin navegador, con el disco de mentira en memoria (mismo patrón que
   pruebas/avisos-que-faltan.mjs). */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function elementoFalso() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {}, addEventListener() {}, querySelector() { return null; }, style: {}
  };
}
const avisos = [];
const contexto = {
  console, TextDecoder, Blob, indexedDB: null,
  document: {
    getElementById: elementoFalso,
    querySelector: () => null, querySelectorAll: () => [],
    createElement: elementoFalso, addEventListener() {}, readyState: 'complete'
  }
};
contexto.window = contexto;
contexto.addEventListener = function () {};
vm.createContext(contexto);

for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'nucleo.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, Carpetas } = contexto;
contexto.window.Gestor = {
  asuntos: () => [], alRefrescar: [],
  carpetaGestor: () => App.E.gestor, usuario: () => App.E.usuario
};
for (const f of ['papelera.js', 'papelera-devolver.js', 'papelera-ajustes.js', 'papelera-vaciado.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Papelera } = contexto;
contexto.U.preguntar = async () => true;
contexto.U.aviso = (t, c) => { avisos.push(c + ': ' + t); };

function dirFalso(nombre) {
  const hijos = new Map();
  return {
    kind: 'directory', name: nombre, _hijos: hijos,
    async getDirectoryHandle(n, o) {
      if (!hijos.has(n)) {
        if (!o || !o.create) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
        hijos.set(n, dirFalso(n));
      }
      return hijos.get(n);
    },
    async getFileHandle(n, o) {
      if (!hijos.has(n)) {
        if (!o || !o.create) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
        hijos.set(n, ficheroFalso(n, ''));
      }
      return hijos.get(n);
    },
    async removeEntry(n) {
      if (this._cogido === n) { const e = new Error('cogido'); e.name = 'NoModificationAllowedError'; throw e; }
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
               size: new TextEncoder().encode(self._texto).length, _texto: self._texto };
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
function haceNDias(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

const abiertos = dirFalso('abiertos');
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
App.E.abiertos = abiertos; App.E.archivo = dirFalso('archivo'); App.E.gestor = gestor;
App.E.usuario = 'Francisco'; App.E.tipos = [];
await Carpetas.escribirTexto(gestor, 'asuntos.json', JSON.stringify({ asuntos: {} }));
await App.cargarRegistro();

async function ponerPapelera(fichas) {
  await Carpetas.escribirTexto(gestor, 'papelera.json', JSON.stringify({ fichas }));
}
async function ids() { return (await Papelera.leer()).map(f => f.id).sort(); }

/* ---------- 1. los plazos ---------- */
console.log('--- 1. plazos ---');
comprobar('90 días de partida', Papelera.diasPapelera(), 90);
comprobar('7 de aviso de partida', Papelera.diasAviso(), 7);
await App.guardarRegistroFresco(r => { r.ajustesAvisos = r.ajustesAvisos || {}; r.ajustesAvisos.diasPapelera = 60; r.ajustesAvisos.diasAvisoPapelera = 3; });
comprobar('cambiados en Ajustes: 60 y 3', [Papelera.diasPapelera(), Papelera.diasAviso()], [60, 3]);
await App.guardarRegistroFresco(r => { delete r.ajustesAvisos.diasPapelera; delete r.ajustesAvisos.diasAvisoPapelera; });

/* ---------- 2. el aviso ---------- */
console.log('--- 2. aviso a los 7 días ---');
await ponerPapelera([
  { id: 'a85', clase: 'nota-tablon', nombre: 'de hace 85', cuando: haceNDias(85) },
  { id: 'a10', clase: 'nota-tablon', nombre: 'de hace 10', cuando: haceNDias(10) }
]);
const pronto = await Papelera.loQueSeBorraPronto();
comprobar('una de hace 85 días sale en el aviso, la de 10 no', pronto.lista.map(f => f.id), ['a85']);
comprobar('le quedan 5 días', Papelera.diasQueFaltan(pronto.lista[0]), 5);
const d = Papelera.fechaDeBorrado(pronto.lista[0]);
comprobar('la fecha de borrado es entrada + 90 días',
  Math.round((d.getTime() - new Date(pronto.lista[0].cuando).getTime()) / 86400000), 90);

/* ---------- 3. el vaciado ---------- */
console.log('--- 3. vaciado ---');
await ponerPapelera([
  { id: 'v91', clase: 'nota-tablon', nombre: 'de hace 91', cuando: haceNDias(91), datos: { id: 'n1' } },
  { id: 'v85', clase: 'nota-tablon', nombre: 'de hace 85', cuando: haceNDias(85) },
  { id: 'vdev', clase: 'nota-tablon', nombre: 'devuelta a tiempo', cuando: haceNDias(2) }
]);
let r = await Papelera.vaciarLoVencido();
comprobar('se borra la de 91 días y solo esa', [r.borradas, await ids()], [1, ['v85', 'vdev']]);
let reg = await Papelera.leerBorrados();
comprobar('queda apuntada como automática, sin contenido',
  [reg.length, reg[0].nombre, reg[0].como, reg[0].quien, reg[0].datos], [1, 'de hace 91', 'automatico', 'la aplicación', undefined]);
comprobar('el apunte lleva qué era y cuándo entró',
  [reg[0].queEra, typeof reg[0].entroEl, typeof reg[0].borradoEl], ['Nota del tablón', 'string', 'string']);

/* ---------- 4. dos ordenadores ---------- */
console.log('--- 4. dos ordenadores no se pisan ---');
await ponerPapelera([{ id: 'x1', clase: 'nota-tablon', nombre: 'x', cuando: haceNDias(100) }]);
{
  /* Entre leer la lista y borrar, «el otro ordenador» la devuelve. */
  const leerOriginal = Papelera._interno.leer;
  let veces = 0;
  Papelera._interno.leer = async function () {
    const l = await leerOriginal();
    veces++;
    if (veces === 1) await ponerPapelera([]);
    return l;
  };
  r = await Papelera.vaciarLoVencido();
  Papelera._interno.leer = leerOriginal;
}
reg = await Papelera.leerBorrados();
comprobar('si el otro ya la quitó, se salta sin fallar ni apuntar', [r.borradas, r.fallidas, reg.length], [0, 0, 1]);

/* ---------- 5. borrado que falla ---------- */
console.log('--- 5. un borrado que falla se deja para mañana ---');
const pap = await gestor.getDirectoryHandle('PAPELERA', { create: true });
await pap.getDirectoryHandle('carpeta cogida', { create: true });
pap._cogido = 'carpeta cogida';
await ponerPapelera([{ id: 'c1', clase: 'suelto', nombre: 'cogida', carpeta: 'carpeta cogida', cuando: haceNDias(120) }]);
r = await Papelera.vaciarLoVencido();
comprobar('la carpeta cogida no se borra y sigue en la papelera', [r.borradas, r.fallidas, await ids()], [0, 1, ['c1']]);
comprobar('y no queda apuntada como borrada', (await Papelera.leerBorrados()).length, 1);
pap._cogido = null;
r = await Papelera.vaciarLoVencido();
comprobar('al día siguiente, liberada, se borra', [r.borradas, await ids()], [1, []]);
const f = {};
comprobar('cuenta los días distintos que lleva fallando',
  [Papelera._apuntarFallo(f, 'a', '2026-09-27'), Papelera._apuntarFallo(f, 'a', '2026-09-27'), Papelera._apuntarFallo(f, 'a', '2026-09-28')], [1, 1, 2]);

/* ---------- 6. borrar a mano deja constancia ---------- */
console.log('--- 6. borrar a mano ---');
await ponerPapelera([{ id: 'm1', clase: 'nota-tablon', nombre: 'a mano', cuando: haceNDias(3) }]);
await Papelera._interno.borrarDelTodo((await Papelera.leer())[0]);
reg = await Papelera.leerBorrados();
const ultimo = reg[reg.length - 1];
comprobar('queda apuntada como «a mano» con quien la borró', [ultimo.nombre, ultimo.como, ultimo.quien], ['a mano', 'a mano', 'Francisco']);
comprobar('el fichero de constancia está entre los que tienen copia', contexto.Copias.FICHEROS.indexOf('papelera-borrados.json') !== -1, true);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
