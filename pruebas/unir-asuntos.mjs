/* Prueba de la fila 69 (docs/PRUEBAS-QUE-FALTAN.md, 2.2): unir dos
   asuntos duplicados, 615 líneas de js/unir-asuntos.js que hasta esta
   fila no probaba nadie.

   Sin navegador, con el disco de mentira en memoria (el mismo patrón
   que pruebas/renombrar-asunto.mjs), cargando en un contexto vm:
   util.js, carpetas.js, copias.js, nucleo.js, conflictos.js,
   presencia.js, hitos.js, asunto-renombrar.js y unir-asuntos.js (la
   `unirAsuntos` de verdad, expuesta como `window.UnirAsuntos` solo
   para esta prueba). El cuadro "¿Cuál se queda?" (`U.preguntar` +
   `document.querySelector('input[name="unir-cual"]:checked')`) se
   finge aceptado y con el primero marcado, que es como queda
   `elegirQuienSeQueda` con el radio de índice 0.

   Fila 75 (docs/HUECOS-ENCONTRADOS-FILA-69.md, 1): un documento con
   el mismo nombre en las dos carpetas ya no para la unión entera —
   entra con " (2)", " (3)"..., igual que ya hace Carpetas.fusionarEn
   al archivar sobre un destino que ya existe. La sección 3 de esta
   prueba comprueba ese comportamiento nuevo. */
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
    querySelector: function (sel) {
      if (sel === 'input[name="unir-cual"]:checked') return { value: '0' };
      return null;
    },
    querySelectorAll: function () { return []; },
    createElement: elementoFalso,
    addEventListener: function () {},
    readyState: 'complete'
  }
};
contexto.window = contexto;
contexto.addEventListener = function () {};
vm.createContext(contexto);
for (const f of ['util.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'nucleo.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App } = contexto;
/* Hitos y Presencia leen su carpeta a través de window.Gestor
   (js/puente.js), que aquí no se carga entero. */
contexto.Gestor = {
  carpetaGestor: function () { return App.E.gestor; },
  usuario: function () { return App.E.usuario; },
  alRefrescar: []
};
for (const f of ['conflictos.js', 'presencia.js', 'hitos.js', 'asunto-renombrar.js', 'unir-asuntos.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Carpetas, Hitos, UnirAsuntos } = contexto;

contexto.U.preguntar = async function () { return true; };
const avisos = [];
contexto.U.aviso = function (texto, clase) { avisos.push({ texto: texto, clase: clase }); };

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
function comprobarVerdad(titulo, real) { comprobar(titulo, !!real, true); }

/* ---------- el disco: abiertos y _GESTOR ---------- */
const abiertos = dirFalso('abiertos');
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
App.E.abiertos = abiertos;
App.E.archivo = dirFalso('archivo');
App.E.gestor = gestor;
App.E.usuario = 'Francisco';
App.E.tipos = [];

async function escribirAsuntos(objeto) {
  await Carpetas.escribirTexto(gestor, 'asuntos.json', JSON.stringify(objeto));
}
async function leerAsuntos() {
  const texto = await Carpetas.leerTexto(gestor, 'asuntos.json');
  return texto ? JSON.parse(texto) : { asuntos: {} };
}

/* ================================================================
   1-2-4-5-6. Unir dos asuntos con notas, pasos hechos, hitos y
   documentos: la carpeta que se queda se lleva todo, la que se va
   desaparece del registro y de disco.
   ================================================================ */
console.log('--- 1-2-4-5-6. unir dos asuntos con de todo ---');

const NOMBRE_A = '260901 MATRICULA 26-27 Pérez García, Ana 1234';
const NOMBRE_B = '260801 MATRICULA 26-27 Pérez García, Ana 9999';

const carpetaA = await abiertos.getDirectoryHandle(NOMBRE_A, { create: true });
await Carpetas.escribirTexto(carpetaA, '260901 REGISTRO MATRICULA.pdf', 'documento A');
const carpetaB = await abiertos.getDirectoryHandle(NOMBRE_B, { create: true });
await Carpetas.escribirTexto(carpetaB, '260801 OTRO DOCUMENTO.pdf', 'documento B');

await escribirAsuntos({
  asuntos: {
    [NOMBRE_A]: {
      estado: 'abierto', tipo: 'MATRICULA',
      notas: [{ texto: 'Nota de A', quien: 'Francisco', cuando: '2026-09-01T10:00:00.000Z' }],
      pasosHechos: ['paso1'], pasosElegidos: {}
    },
    [NOMBRE_B]: {
      estado: 'abierto', tipo: 'MATRICULA',
      notas: [{ texto: 'Nota de B', quien: 'Francisco', cuando: '2026-08-15T09:00:00.000Z' }],
      pasosHechos: [], pasosElegidos: { rama1: 'si' }
    }
  }
});
await App.cargarRegistro();

await Hitos.cambiar(function (d) {
  d.porAsunto[NOMBRE_A] = { hitos: [{ id: 'h1', titulo: 'Hito de A', estado: 'pendiente' }] };
  d.porAsunto[NOMBRE_B] = { hitos: [{ id: 'h2', titulo: 'Hito de B', estado: 'pendiente' }] };
  return d;
});

const grupo = [
  { nombre: NOMBRE_A, handle: carpetaA },
  { nombre: NOMBRE_B, handle: carpetaB }
];
await UnirAsuntos.unirAsuntos(grupo);

const trasUnir = await leerAsuntos();
comprobar('la ficha que se va desaparece del registro', !!trasUnir.asuntos[NOMBRE_B], false);
comprobarVerdad('la que se queda sigue', trasUnir.asuntos[NOMBRE_A]);

const fichaFinal = trasUnir.asuntos[NOMBRE_A];
comprobar('las notas de las dos, ordenadas por fecha (B es más vieja)',
  fichaFinal.notas.slice(0, 2).map(function (n) { return n.texto; }),
  ['Nota de B', 'Nota de A']);
comprobarVerdad('se añade la nota de "Unido con la carpeta…"',
  fichaFinal.notas.some(function (n) { return /Unido con la carpeta/.test(n.texto); }));
comprobar('los pasos hechos de la que se queda mandan (ya tenía)', fichaFinal.pasosHechos, ['paso1']);
comprobar('los pasos elegidos: los de la que se queda estaban vacíos, manda la que se va',
  fichaFinal.pasosElegidos, { rama1: 'si' });

const ficherosFinales = (await Carpetas.ficheros(carpetaA)).map(function (f) { return f.nombre; }).sort();
comprobar('la carpeta que se queda tiene los documentos de las dos',
  ficherosFinales, ['260801 OTRO DOCUMENTO.pdf', '260901 REGISTRO MATRICULA.pdf'].sort());

let carpetaBSigueAhi = true;
try { await abiertos.getDirectoryHandle(NOMBRE_B); } catch (e) { carpetaBSigueAhi = false; }
comprobar('la carpeta que se va desaparece de disco', carpetaBSigueAhi, false);

const hitosTrasUnir = await Hitos.leer();
comprobar('los hitos de las dos se juntan en la que se queda',
  (hitosTrasUnir.porAsunto[NOMBRE_A].hitos || []).map(function (h) { return h.id; }).sort(),
  ['h1', 'h2']);
comprobar('la entrada de hitos de la que se va desaparece', !!hitosTrasUnir.porAsunto[NOMBRE_B], false);

/* ================================================================
   3. Un documento con el mismo nombre en las dos (fila 75): ya NO se
   para la unión entera. El de la carpeta que se va entra con " (2)"
   (o el primer número libre), y se avisa de cuántos se han renombrado
   así. Nada se pierde: los dos documentos quedan en la carpeta que se
   queda, cada uno con su nombre.
   ================================================================ */
console.log('--- 3. nombres que chocan: se renombra con "(2)", no se para nada ---');

const NOMBRE_C = '260902 MATRICULA 26-27 Otro Ejemplo, Sara 5555';
const NOMBRE_D = '260902 MATRICULA 26-27 Otro Ejemplo, Sara 6666';
const carpetaC = await abiertos.getDirectoryHandle(NOMBRE_C, { create: true });
await Carpetas.escribirTexto(carpetaC, 'mismo-nombre.pdf', 'de C');
const carpetaD = await abiertos.getDirectoryHandle(NOMBRE_D, { create: true });
await Carpetas.escribirTexto(carpetaD, 'mismo-nombre.pdf', 'de D');

await escribirAsuntos({
  asuntos: {
    [NOMBRE_C]: { estado: 'abierto', tipo: 'MATRICULA', notas: [] },
    [NOMBRE_D]: { estado: 'abierto', tipo: 'MATRICULA', notas: [] }
  }
});
await App.cargarRegistro();

await UnirAsuntos.unirAsuntos([
  { nombre: NOMBRE_C, handle: carpetaC },
  { nombre: NOMBRE_D, handle: carpetaD }
]);

const trasChoque = await leerAsuntos();
comprobar('con nombres que chocan, la unión sigue adelante: solo queda la que se queda',
  [!!trasChoque.asuntos[NOMBRE_C], !!trasChoque.asuntos[NOMBRE_D]], [true, false]);
const ficherosC = (await Carpetas.ficheros(carpetaC)).map(function (f) { return f.nombre; }).sort();
comprobar('los dos documentos quedan en la carpeta que se queda, el segundo con "(2)"',
  ficherosC, ['mismo-nombre (2).pdf', 'mismo-nombre.pdf'].sort());
const textoOriginal = (await (await carpetaC.getFileHandle('mismo-nombre.pdf')).getFile())._texto;
const textoRenombrado = (await (await carpetaC.getFileHandle('mismo-nombre (2).pdf')).getFile())._texto;
comprobar('el que ya estaba (de C) se queda con su nombre de siempre', textoOriginal, 'de C');
comprobar('el que venía chocando (de D) es el que se lleva el sufijo', textoRenombrado, 'de D');
let carpetaDSigueAhi = true;
try { await abiertos.getDirectoryHandle(NOMBRE_D); } catch (e) { carpetaDSigueAhi = false; }
comprobar('la otra carpeta sí desaparece: la unión ha terminado', carpetaDSigueAhi, false);
comprobarVerdad('se avisa de que un documento se ha tenido que renombrar',
  avisos.some(function (a) { return a.clase === 'bueno' && /1 documento/.test(a.texto) && /"\(N\)"/.test(a.texto); }));

/* ================================================================
   7. Si la copia de un documento falla a medias, no se borra nada
   del origen: ni el fichero (lo garantiza Carpetas.moverFichero), ni
   la ficha, ni la carpeta del asunto que se iba a ir.
   ================================================================ */
console.log('--- 7. si la copia falla, no se borra nada del origen ---');

function ficheroRotoFalso(nombre) {
  return {
    kind: 'file', name: nombre,
    async getFile() { throw new Error('el fichero ha desaparecido a medio leer'); }
  };
}

const NOMBRE_E = '260903 MATRICULA 26-27 Cuarto Ejemplo, Iris 7777';
const NOMBRE_F = '260903 MATRICULA 26-27 Cuarto Ejemplo, Iris 8888';
const carpetaE = await abiertos.getDirectoryHandle(NOMBRE_E, { create: true });
const carpetaF = await abiertos.getDirectoryHandle(NOMBRE_F, { create: true });
carpetaF._hijos.set('roto.pdf', ficheroRotoFalso('roto.pdf'));

await escribirAsuntos({
  asuntos: {
    [NOMBRE_E]: { estado: 'abierto', tipo: 'MATRICULA', notas: [] },
    [NOMBRE_F]: { estado: 'abierto', tipo: 'MATRICULA', notas: [] }
  }
});
await App.cargarRegistro();

await UnirAsuntos.unirAsuntos([
  { nombre: NOMBRE_E, handle: carpetaE },
  { nombre: NOMBRE_F, handle: carpetaF }
]);

comprobarVerdad('se ha avisado de que no se ha podido unir',
  avisos.some(function (a) { return a.clase === 'malo' && /No he podido unirlos/.test(a.texto); }));
const trasFallo = await leerAsuntos();
comprobarVerdad('la ficha de la que se iba a ir sigue existiendo', trasFallo.asuntos[NOMBRE_F]);
let carpetaFSigueAhi = true;
try { await abiertos.getDirectoryHandle(NOMBRE_F); } catch (e) { carpetaFSigueAhi = false; }
comprobarVerdad('su carpeta tampoco se ha borrado', carpetaFSigueAhi);
comprobarVerdad('el fichero roto sigue en su sitio (no se ha borrado el origen)',
  carpetaF._hijos.has('roto.pdf'));

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
