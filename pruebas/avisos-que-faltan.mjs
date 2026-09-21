/* Prueba de la fila 68 (docs/AVISOS-QUE-FALTAN.md): los tres avisos
   que la aplicación ya sabía pero no decía.

   Sin navegador, con el disco de mentira en memoria (el mismo patrón
   que pruebas/ficha-del-archivo.mjs y pruebas/contacto-guardado.mjs),
   cargando en un contexto vm: util.js, carpetas.js, copias.js,
   nucleo.js, archivo-indice.js, fichas-huerfanas.js, papelera.js,
   avisos-que-faltan.js y que-me-toca.js.

   `window.FichasHuerfanas.calcular`, `AvisosQueFaltan._calcularPapeleraVieja`
   y `QueMeToca._reunirDormidos` se exponen solo para estas pruebas. */
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

for (const f of ['util.js', 'carpetas.js', 'copias.js', 'nucleo.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, Carpetas } = contexto;

/* window.Gestor de mentira, lo justo para que-me-toca.js: solo hace
   falta `asuntos()` para _reunirDormidos, y `alRefrescar` para que el
   enganche del contador no reviente al cargar el fichero. */
contexto.window.Gestor = {
  asuntos: function () { return App.E.listaAbiertos; },
  alRefrescar: [],
  carpetaGestor: function () { return App.E.gestor; },
  usuario: function () { return App.E.usuario; }
};

for (const f of ['archivo-indice.js', 'fichas-huerfanas.js', 'papelera.js',
                  'avisos-que-faltan.js', 'que-me-toca.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { IndiceArchivo, FichasHuerfanas, Papelera, AvisosQueFaltan, QueMeToca } = contexto;

contexto.U.preguntar = async function () { return true; };
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
App.E.listaArchivo = [];

function refrescarListaAbiertos() {
  App.E.listaAbiertos = Object.keys(App.E.registro.asuntos).map(function (k) {
    return { nombre: k, ficha: App.E.registro.asuntos[k] };
  });
}

/* ================================================================
   1-2. Fichas sin carpeta (huérfanas): con el índice del ARCHIVO
   hecho, no hace falta recorrer el ARCHIVO; sin él, un cerrado que no
   se puede comprobar no se acusa de huérfano por error.
   ================================================================ */
console.log('--- 1-2. fichas sin carpeta, sin recorrer el ARCHIVO ---');

await Carpetas.escribirTexto(gestor, 'asuntos.json', JSON.stringify({
  asuntos: {
    ABIERTO_OK: { estado: 'abierto' },
    ABIERTO_HUERFANO: { estado: 'abierto' },
    CERRADO_EN_INDICE: { estado: 'cerrado' },
    CERRADO_SIN_INDICE: { estado: 'cerrado' }
  }
}));
await Carpetas.escribirTexto(gestor, 'indice-archivo.json', JSON.stringify({
  version: IndiceArchivo.VERSION,
  asuntos: [{ nombre: 'CERRADO_EN_INDICE', categoria: 'FAMILIAS', tercero: 'Alguien' }]
}));
await App.cargarRegistro();
App.E.listaAbiertos = [{ nombre: 'ABIERTO_OK' }];

/* App.verArchivo no existe en esta prueba a propósito: si calcular()
   intentara llamarlo, la promesa fallaría y el test lo pillaría. */
const huerfanas = await FichasHuerfanas.calcular();
comprobar('con el índice hecho: huérfano de verdad y el cerrado no indexado, nada más',
  huerfanas.sort(), ['ABIERTO_HUERFANO', 'CERRADO_SIN_INDICE'].sort());

comprobar('el que sí está en el índice no sale como huérfano',
  huerfanas.indexOf('CERRADO_EN_INDICE'), -1);

/* Sin índice y sin ARCHIVO leído: un cerrado no se puede comprobar, y
   no se le acusa de huérfano por error (aunque el abierto de verdad
   huérfano sí sale). */
await Carpetas.escribirTexto(gestor, 'asuntos.json', JSON.stringify({
  asuntos: { CERRADO_SIN_COMPROBAR: { estado: 'cerrado' }, ABIERTO_HUERFANO2: { estado: 'abierto' } }
}));
await gestor.removeEntry('indice-archivo.json');
await App.cargarRegistro();
App.E.listaAbiertos = [];
App.E.listaArchivo = [];
const huerfanasSinIndice = await FichasHuerfanas.calcular();
comprobar('sin índice ni ARCHIVO leído, el cerrado no se acusa de huérfano',
  huerfanasSinIndice, ['ABIERTO_HUERFANO2']);

comprobar('ninguna huérfana cuando todas tienen carpeta', (function () {
  App.E.listaAbiertos = [{ nombre: 'ABIERTO_HUERFANO2' }];
  return null;
})(), null);

/* ================================================================
   3-4. Los asuntos dormidos.
   ================================================================ */
console.log('--- 3-4. asuntos dormidos ---');

function haceNDias(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

await Carpetas.escribirTexto(gestor, 'asuntos.json', JSON.stringify({
  asuntos: {
    DORMIDO: { estado: 'abierto', notaEl: haceNDias(90) },
    DESPIERTO: { estado: 'abierto', notaEl: haceNDias(10) }
  }
}));
await App.cargarRegistro();
refrescarListaAbiertos();

const dormidos = QueMeToca._reunirDormidos();
comprobar('el de hace 90 días sale en Dormidos', dormidos.map(function (d) { return d.asunto.nombre; }), ['DORMIDO']);

/* Ocultarlo 30 días lo quita; que ya haya pasado ese plazo lo devuelve. */
await App.anotar('DORMIDO', { dormidoOcultoHasta: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) });
refrescarListaAbiertos();
comprobar('oculto, no sale', QueMeToca._reunirDormidos().length, 0);

await App.anotar('DORMIDO', { dormidoOcultoHasta: new Date(Date.now() - 86400000).toISOString().slice(0, 10) });
refrescarListaAbiertos();
comprobar('pasados los 30 días, vuelve a salir',
  QueMeToca._reunirDormidos().map(function (d) { return d.asunto.nombre; }), ['DORMIDO']);

/* ================================================================
   5. La papelera con algo de hace 40 días saca el aviso.
   ================================================================ */
console.log('--- 5. aviso de la papelera vieja ---');

await Carpetas.escribirTexto(gestor, 'papelera.json', JSON.stringify({
  fichas: [
    { id: 'b1', clase: 'nota-tablon', nombre: 'una nota', cuando: haceNDias(40) },
    { id: 'b2', clase: 'nota-tablon', nombre: 'otra nota', cuando: haceNDias(2) }
  ]
}));
const r = await AvisosQueFaltan._calcularPapeleraVieja();
comprobar('solo la de hace 40 días cuenta como vieja', r.n, 1);
comprobar('bytesLegibles no revienta con 0', AvisosQueFaltan._bytesLegibles(0), '0 KB');

/* ================================================================
   6. El aviso de huérfanas se puede callar 7 días (fila 86).
   ================================================================ */
console.log('--- 6. aviso de huérfanas ocultable ---');

function dentroDeNDias(n) { return new Date(Date.now() + n * 86400000).toISOString(); }

comprobar('sin nada guardado, sale',
  AvisosQueFaltan._sePintaHuerfanas(3, null), true);

comprobar('recién ocultado (7 días por delante), no sale',
  AvisosQueFaltan._sePintaHuerfanas(3, { hasta: dentroDeNDias(7), n: 3 }), false);

comprobar('a los 3 días de ocultarlo (4 por delante), no sale',
  AvisosQueFaltan._sePintaHuerfanas(3, { hasta: dentroDeNDias(4), n: 3 }), false);

comprobar('a los 8 días de ocultarlo (el plazo ya pasó), sale',
  AvisosQueFaltan._sePintaHuerfanas(3, { hasta: dentroDeNDias(-1), n: 3 }), true);

comprobar('con una ficha más que cuando se ocultó, sale aunque no hayan pasado los 7 días',
  AvisosQueFaltan._sePintaHuerfanas(4, { hasta: dentroDeNDias(7), n: 3 }), true);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
