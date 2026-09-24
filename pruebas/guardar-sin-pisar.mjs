/* Prueba de la fila 61 (docs/GUARDAR-SIN-PISAR.md): mandar un asunto a
   la papelera y devolverlo no pueden pisar lo que el compañero haya
   guardado en asuntos.json desde el otro ordenador mientras tanto.

   Sin navegador, con el disco de mentira en memoria de
   pruebas/logica.mjs y pruebas/archivar-fusion.mjs. Carga de verdad
   util.js, carpetas.js, copias.js, nucleo.js y papelera.js: así la
   prueba pasa por el App.guardarRegistroFresco real, no por una copia
   simplificada. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function elementoFalso() { return {}; }
const contexto = {
  console, TextDecoder, Blob, indexedDB: null,
  document: {
    getElementById: elementoFalso,
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; }
  }
};
contexto.window = contexto;   /* en el navegador window === global; aquí también */
vm.createContext(contexto);
for (const f of ['util.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'nucleo.js', 'papelera.js', 'papelera-devolver.js', 'papelera-ajustes.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, Carpetas, Papelera } = contexto;

/* ---------- disco de mentira, igual que en pruebas/logica.mjs ---------- */
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
    async removeEntry(n) { hijos.delete(n); },
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

/* ---------- se monta el disco: dos asuntos abiertos, A y B ---------- */
const abiertos = dirFalso('abiertos');
await abiertos.getDirectoryHandle('A', { create: true });
await abiertos.getDirectoryHandle('B', { create: true });
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });

const registroInicial = {
  asuntos: {
    A: { situacion: 'PENDIENTE', notas: [{ texto: 'nota original de A', cuando: '2026-09-01T08:00:00.000Z' }] },
    B: { situacion: 'PENDIENTE', notas: [{ texto: 'nota original de B', cuando: '2026-09-01T08:00:00.000Z' }] }
  }
};
const h = await gestor.getFileHandle('asuntos.json', { create: true });
await (await h.createWritable()).write(JSON.stringify(registroInicial));

App.E.abiertos = abiertos;
App.E.gestor = gestor;
App.E.usuario = 'Francisco';

/* papelera.js pide la carpeta de _GESTOR y el usuario a window.Gestor
   (js/puente.js en la aplicación de verdad); aquí basta con un envoltorio
   mínimo sobre App.E, que es lo que puente.js hace por debajo. */
contexto.Gestor = { carpetaGestor: function () { return App.E.gestor; }, usuario: function () { return App.E.usuario; } };

async function leerDisco() {
  const fh = await gestor.getFileHandle('asuntos.json');
  return JSON.parse((await fh.getFile())._texto);
}
async function escribirDisco(objeto) {
  const fh = await gestor.getFileHandle('asuntos.json');
  await (await fh.createWritable()).write(JSON.stringify(objeto));
}

/* ================================================================
   1-5. Mandar A a la papelera no pisa lo que el compañero ha escrito
   en B mientras tanto (y la ficha que se archiva en la papelera es la
   fresca, con la nota que el compañero acaba de añadir a A).
   ================================================================ */
console.log('--- mandar un asunto a la papelera sin pisar al compañero ---');

await App.cargarRegistro();   /* la copia en memoria de este ordenador, ya "vieja" */
const aParaBorrar = { nombre: 'A', ficha: App.E.registro.asuntos.A };

/* Por detrás, "el compañero" escribe en el fichero del disco: una nota
   nueva en B, y otra en A (para comprobar la trampa de la ficha vieja). */
const trasCompanero1 = await leerDisco();
trasCompanero1.asuntos.A.notas.push({ texto: 'nota del compañero en A', cuando: '2026-09-01T09:00:00.000Z' });
trasCompanero1.asuntos.B.notas.push({ texto: 'nota del compañero en B', cuando: '2026-09-01T09:00:00.000Z' });
await escribirDisco(trasCompanero1);

await Papelera.mandarAsunto(aParaBorrar);

const trasBorrar = await leerDisco();
comprobar('la nota del compañero en B sigue ahí tras borrar A',
  trasBorrar.asuntos.B.notas.map((n) => n.texto),
  ['nota original de B', 'nota del compañero en B']);
comprobar('A ya no está en asuntos.json', !!trasBorrar.asuntos.A, false);

const papelera1 = await Papelera.leer();
comprobar('hay una ficha de A en la papelera', papelera1.length, 1);
const fichaPapeleraA = papelera1[0];
comprobar('la ficha que se archiva en la papelera es la fresca, no la vieja que traía "a"',
  (fichaPapeleraA.datos.notas || []).map((n) => n.texto),
  ['nota original de A', 'nota del compañero en A']);

/* ================================================================
   6-7. Devolver A desde la papelera no pisa una segunda nota que el
   compañero añade a B justo antes de devolverlo.
   ================================================================ */
console.log('--- devolver un asunto sin pisar al compañero ---');

const trasCompanero2 = await leerDisco();
trasCompanero2.asuntos.B.notas.push({ texto: 'segunda nota del compañero en B', cuando: '2026-09-01T10:00:00.000Z' });
await escribirDisco(trasCompanero2);

const resultado = await Papelera.devolver(fichaPapeleraA);
comprobar('devolver dice que ha ido bien', resultado.ok, true);

const trasDevolver = await leerDisco();
comprobar('la segunda nota del compañero en B sigue ahí tras devolver A',
  trasDevolver.asuntos.B.notas.map((n) => n.texto),
  ['nota original de B', 'nota del compañero en B', 'segunda nota del compañero en B']);
comprobar('A vuelve con la ficha fresca (con la nota del compañero en A)',
  (trasDevolver.asuntos.A.notas || []).map((n) => n.texto),
  ['nota original de A', 'nota del compañero en A']);
comprobar('la carpeta de A vuelve a abiertos', await Carpetas.existe(abiertos, 'A'), true);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
