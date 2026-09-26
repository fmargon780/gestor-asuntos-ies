/* Prueba de la fila 177 (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md).

   Sin navegador, con el disco de mentira en memoria (mismo patrón que
   pruebas/datos-entre-ordenadores.mjs), cargando en un contexto vm:
   util.js, util-parecidos.js, util-pantalla.js, reintentar-escritura.js,
   carpetas.js, copias.js, cola-guardado.js, nombres.js, nucleo.js,
   archivo-indice.js, copiar-ruta.js y nombres-topes.js: la lógica de
   verdad, tal cual la usa la aplicación.

   Comprueba, como pide el documento:

   1. Un indice-archivo.json antiguo (con 'asuntos' dentro, de dos
      cursos) se parte solo, la primera vez que se lee, en
      indice-archivo/2025-26.json y 2026-27.json más un resumen
      pequeño; el viejo se aparta a copias/. leerDisco() sin opciones
      da solo el curso actual; leerDisco({todos:true}), los dos.
   2. anadirEntrada de un asunto del curso actual solo reescribe el
      fichero de ESE curso: el del otro curso no se toca.
   3. Con una ruta de ARCHIVO larga (dentro de Dropbox) y un tercero
      largo, Nombres.topes() da menos hueco que los topes fijos de
      antes (150 y 120), y el nombre de asunto propuesto respeta ese
      recorte más corto. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function elementoFalso() {
  return {
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild() {}, addEventListener() {}, querySelector() { return null; },
    querySelectorAll() { return []; }, remove() {}, style: {}, dataset: {}
  };
}
const elementosPorId = new Map();
function elementoPara(id) {
  if (!elementosPorId.has(id)) elementosPorId.set(id, Object.assign(elementoFalso(), { value: '' }));
  return elementosPorId.get(id);
}
const contexto = {
  console, TextDecoder, TextEncoder, Blob, indexedDB: null, setTimeout, clearTimeout,
  document: {
    getElementById: elementoPara,
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement: elementoFalso,
    addEventListener() {},
    readyState: 'complete'
  }
};
contexto.window = contexto;
contexto.addEventListener = function () {};
vm.createContext(contexto);
for (const f of [
  'util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js',
  'copias.js', 'cola-guardado.js', 'nombres.js', 'nucleo.js', 'archivo-indice.js',
  'copiar-ruta.js', 'nombres-topes.js'
]) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, IndiceArchivo, Nombres, RutaCarpetas, Carpetas } = contexto;

/* ---------- disco de mentira, igual que en pruebas/datos-entre-ordenadores.mjs ---------- */
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
    async *entries() { for (const [k, v] of hijos) yield [k, v]; }
  };
}
function ficheroFalso(nombre, texto) {
  const f = { kind: 'file', name: nombre, _texto: texto, _modificado: Date.now() };
  f.getFile = async () => ({
    async arrayBuffer() { return new TextEncoder().encode(f._texto).buffer; },
    size: new TextEncoder().encode(f._texto).length,
    lastModified: f._modificado,
    _texto: f._texto
  });
  f.createWritable = async () => ({
    async write(cosa) {
      if (typeof cosa === 'string') f._texto = cosa;
      else if (cosa && typeof cosa.text === 'function') f._texto = await cosa.text();
      else if (cosa && cosa._texto !== undefined) f._texto = cosa._texto;
      f._modificado = Date.now();
    },
    async close() {}
  });
  return f;
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) {
    fallos++;
    console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado));
  } else {
    console.log('bien   ' + titulo);
  }
}
async function leerJsonDeVerdad(dir, nombre) {
  const h = await dir.getFileHandle(nombre);
  const f = await h.getFile();
  return JSON.parse(f._texto);
}
async function escribirDeVerdad(dir, nombre, texto) {
  const h = await dir.getFileHandle(nombre, { create: true });
  const w = await h.createWritable();
  await w.write(texto);
  await w.close();
}

const gestor = dirFalso('_GESTOR');
Object.assign(App.E, { gestor: gestor, usuario: 'Ana', tipos: [] });

/* ---------- 1. migración del índice viejo, por curso ---------- */
console.log('--- 1. el índice viejo se parte por curso ---');
const entradaVieja = {
  nombre: '250910 MATRICULA Uno, Ana 1', fecha: '250910', tipo: 'MATRICULA',
  categoria: 'ALUMNADO', tercero: 'Uno, Ana', ruta: 'ALUMNADO / Uno, Ana', documentos: [], registros: []
};
const entradaActual = {
  nombre: '260910 MATRICULA Dos, Eva 2', fecha: '260910', tipo: 'MATRICULA',
  categoria: 'ALUMNADO', tercero: 'Dos, Eva', ruta: 'ALUMNADO / Dos, Eva', documentos: [], registros: []
};
await escribirDeVerdad(gestor, 'indice-archivo.json', JSON.stringify({
  version: 3, hechoEl: '2026-09-01T00:00:00.000Z', hechoPor: 'Ana',
  recuento: { ALUMNADO: 2 }, asuntos: [entradaVieja, entradaActual]
}));

const cursoActual = IndiceArchivo.cursoActual();
comprobar('1a. hoy cae en el curso 2026-27', cursoActual, '2026-27');

const soloActual = await IndiceArchivo.leerDisco();
comprobar('1b. leerDisco() sin opciones: solo el asunto del curso actual',
  soloActual.ok && soloActual.datos.asuntos.map((a) => a.nombre), [entradaActual.nombre]);

const todos = await IndiceArchivo.leerDisco({ todos: true });
comprobar('1c. leerDisco({todos:true}): los dos asuntos, de los dos cursos',
  todos.ok && todos.datos.asuntos.map((a) => a.nombre).sort(), [entradaActual.nombre, entradaVieja.nombre].sort());

const carpetaCursos = await gestor.getDirectoryHandle('indice-archivo');
const cursoViejo = await leerJsonDeVerdad(carpetaCursos, '2025-26.json');
const cursoNuevo = await leerJsonDeVerdad(carpetaCursos, '2026-27.json');
comprobar('1d. 2025-26.json lleva solo el asunto de ese curso', cursoViejo.asuntos.map((a) => a.nombre), [entradaVieja.nombre]);
comprobar('1e. 2026-27.json lleva solo el asunto de ese curso', cursoNuevo.asuntos.map((a) => a.nombre), [entradaActual.nombre]);

const resumen = await leerJsonDeVerdad(gestor, 'indice-archivo.json');
comprobar('1f. el resumen ya no lleva "asuntos", solo la lista de cursos',
  [Array.isArray(resumen.asuntos), resumen.cursos.slice().sort()], [false, ['2025-26', '2026-27']]);

const copias = await gestor.getDirectoryHandle('copias');
let hayCopiaDelViejo = false;
for await (const [n] of copias.entries()) { if (/^indice-archivo-antiguo-\d{6}\.json$/.test(n)) hayCopiaDelViejo = true; }
comprobar('1g. el índice viejo se aparta a copias/', hayCopiaDelViejo, true);

/* ---------- 2. anadirEntrada solo toca el fichero de SU curso ---------- */
console.log('--- 2. anadirEntrada solo reescribe el curso que toca ---');
const modificadoViejoAntes = (await carpetaCursos.getFileHandle('2025-26.json'))._modificado;
await new Promise((r) => setTimeout(r, 5));   /* que el reloj avance de verdad */

const entradaNueva = {
  nombre: '260915 SOLICITUD Tres, Luis 3', fecha: '260915', tipo: 'SOLICITUD',
  categoria: 'ALUMNADO', tercero: 'Tres, Luis', ruta: 'ALUMNADO / Tres, Luis', documentos: [], registros: []
};
await IndiceArchivo.anadirEntrada(entradaNueva);

const modificadoViejoDespues = (await carpetaCursos.getFileHandle('2025-26.json'))._modificado;
comprobar('2a. el fichero del curso 2025-26 no se ha vuelto a escribir', modificadoViejoDespues, modificadoViejoAntes);

const cursoNuevoTrasAnadir = await leerJsonDeVerdad(carpetaCursos, '2026-27.json');
comprobar('2b. el fichero del curso 2026-27 lleva ya los dos asuntos',
  cursoNuevoTrasAnadir.asuntos.map((a) => a.nombre).sort(), [entradaActual.nombre, entradaNueva.nombre].sort());

/* ---------- 3. el tope de ruta, con una ruta de ARCHIVO larga ---------- */
console.log('--- 3. Nombres.topes() cuenta la ruta entera ---');
const rutaArchivoLarga = 'ADMINISTRACIÓN / GESTIÓN DE ASUNTOS / ARCHIVO';
await escribirDeVerdad(gestor, 'rutas.json', JSON.stringify({ abiertos: 'ASUNTOS ABIERTOS', archivo: rutaArchivoLarga }));
await RutaCarpetas.cargarComun();
comprobar('3a. RutaCarpetas ya tiene la ruta del ARCHIVO cargada', RutaCarpetas.comunActual().archivo, rutaArchivoLarga);

const terceroLargo = 'Apellidolarguísimo Otroapellido, Nombre 1234567';
const t = Nombres.topes({ tercero: terceroLargo });
comprobar('3b. con una ruta y un tercero largos, el tope de asunto es menor que el fijo de antes (150)', t.asunto < 150, true);
comprobar('3c. y el de documento, menor que el fijo de antes (120)', t.documento < 120, true);

const descripcionLarga = 'Texto libre muy largo '.repeat(14).trim();
const propuesto = Nombres.montarAsunto({
  fecha: '2026-09-24', tipo: 'MATRICULA', curso: '26-27', grupo: '1ESO-A',
  campos: [], descripcion: descripcionLarga, tercero: terceroLargo
});
comprobar('3d. el nombre propuesto respeta el tope (más corto que el fijo de antes)',
  [propuesto.nombre.length <= t.asunto, propuesto.recortado], [true, true]);
comprobar('3e. y conserva fecha, tipo, año y grupo, sin tocar',
  propuesto.nombre.indexOf('260924 MATRICULA 26-27 1ESO-A') === 0, true);

console.log('');
if (fallos) {
  console.log(fallos + ' prueba(s) fallada(s) en archivo-por-curso-y-rutas.mjs.');
  process.exit(1);
} else {
  console.log('Todo bien');
}
