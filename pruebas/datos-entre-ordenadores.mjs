/* Prueba de la fila 176 (docs/DATOS-ENTRE-ORDENADORES.md): los datos no
   se pisan entre ordenadores.

   Sin navegador, con el disco de mentira en memoria (el mismo patrón que
   pruebas/borrados-que-se-fusionan.mjs), cargando en un contexto vm:
   util.js, util-parecidos.js, util-pantalla.js, reintentar-escritura.js,
   carpetas.js, copias.js, cola-guardado.js, nombres.js, nucleo.js,
   borrados-fusion.js, conflictos.js, guias.js, guias-enganche.js,
   presencia.js y vistazo-registro.js: la lógica de verdad, tal cual la
   usa la aplicación.

   Comprueba, como pide el documento:

   1. Dos App.anotarLista seguidos sobre 'hilos' del mismo asunto dejan
      los dos hilos en el disco, y 'quitar' quita solo el suyo.
   2. Un asunto archivado (clave borrada + lápida) no reaparece ni con
      App.anotar (error AsuntoCerrado) ni al fusionar una copia en
      conflicto que aún lo tenía; reabrir (revivir) quita la lápida.
   3. Un asuntos.json cambiado por fuera se relee en la siguiente pasada
      del vistazo, y no se relee si hay un guardado en marcha.
   4. Guardar la guía del tipo B no borra la del tipo A escrita por
      fuera entre medias.
   5. Con presencia/ana.json y presencia/luis.json, la ficha de Luis
      sale «en consulta» para Ana. */
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
  'copias.js', 'cola-guardado.js', 'nombres.js', 'nucleo.js', 'borrados-fusion.js', 'conflictos.js',
  'guias.js', 'guias-enganche.js', 'presencia.js', 'vistazo-registro.js'
]) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, Borrados, Conflictos, GuiasDelCentro, Presencia, VistazoRegistro, Carpetas, Copias, ColaGuardado, U } = contexto;
U.preguntar = async function () { return true; };
App.verAbiertos = async function () {};

/* ---------- disco de mentira, igual que en pruebas/borrados-que-se-fusionan.mjs,
   con lastModified de verdad (fila 176, punto 3) ---------- */
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
Object.assign(App.E, { gestor: gestor, usuario: 'Ana', listaAbiertos: [], listaArchivo: [] });
contexto.window.Gestor = contexto.Gestor = {
  carpetaGestor: () => gestor,
  usuario: () => App.E.usuario,
  tipos: () => [],
  alRefrescar: [],
  recargar: async () => {},
  anotar: (n, d) => App.anotar(n, d),
  anotarLista: (n, c, o) => App.anotarLista(n, c, o)
};

/* ---------- 1. dos anotarLista seguidos sobre 'hilos' ---------- */
console.log('--- 1. anotarLista funde, no sustituye ---');
const A = '260101 SOLICITUD Uno, Ana 1150001';
await App.anotar(A, { situacion: 'abierto' });
await App.anotarLista(A, 'hilos', { anadir: [{ id: 'h1', asunto: 'uno' }] });
await App.anotarLista(A, 'hilos', { anadir: [{ id: 'h2', asunto: 'dos' }] });
comprobar('1a. los dos hilos quedan en el disco',
  (await leerJsonDeVerdad(gestor, 'asuntos.json')).asuntos[A].hilos.map((h) => h.id).sort(), ['h1', 'h2']);
await App.anotarLista(A, 'hilos', { quitar: [{ id: 'h1' }] });
comprobar('1b. quitar quita solo el suyo',
  (await leerJsonDeVerdad(gestor, 'asuntos.json')).asuntos[A].hilos.map((h) => h.id), ['h2']);

/* ---------- 2. lápidas: un asunto cerrado no resucita ---------- */
console.log('--- 2. las lápidas ---');
const CERRADO = '260102 SOLICITUD Dos, Luis 1150002';
await App.anotar(CERRADO, { situacion: 'abierto' });
/* Archivar "a mano", como hace js/ficha-archivo.js: borrar la clave y
   marcar la lápida en la MISMA operación de la cola. */
await App.guardarRegistroFresco(async (registro) => {
  delete registro.asuntos[CERRADO];
  await Borrados.marcar(gestor, 'asuntos', CERRADO, 'archivado');
});

let error = '';
try { await App.anotar(CERRADO, { notaEl: 'x' }); } catch (e) { error = e.name; }
comprobar('2a. App.anotar sobre una clave con lápida lanza AsuntoCerrado', error, 'AsuntoCerrado');
comprobar('2a. y no crea la clave vacía', !!App.E.registro.asuntos[CERRADO], false);

/* Una copia en conflicto de asuntos.json que todavía tenía el asunto
   cerrado (llegó tarde, o el otro ordenador no se había enterado). */
const nombreConflicto = "asuntos (Ana's conflicted copy 2026-09-11).json";
await escribirDeVerdad(gestor, nombreConflicto, JSON.stringify({ asuntos: { [CERRADO]: { situacion: 'abierto' } } }));
await Conflictos.revisar();
comprobar('2b. la fusión de una copia en conflicto no resucita la clave con lápida',
  !!(await leerJsonDeVerdad(gestor, 'asuntos.json')).asuntos[CERRADO], false);

/* Reabrir: revivir la lápida ANTES de anotar, como hace js/ficha-archivo.js. */
await Borrados.revivir(gestor, 'asuntos', CERRADO);
await App.anotar(CERRADO, { situacion: 'abierto' });
comprobar('2c. reabrir (revivir + anotar) funciona de nuevo',
  (await leerJsonDeVerdad(gestor, 'asuntos.json')).asuntos[CERRADO].situacion, 'abierto');

/* ---------- 3. el vistazo relee asuntos.json si ha cambiado por fuera ---------- */
console.log('--- 3. el vistazo relee lo que cambia el otro ordenador ---');
const OTRO = '260103 SOLICITUD Tres, Eva 1150003';
await App.anotar(OTRO, { situacion: 'abierto' });
await VistazoRegistro.comprobarYReleer();   /* primera pasada: apunta la fecha de partida */

let liberar;
const bloqueo = new Promise((r) => { liberar = r; });
const guardando = ColaGuardado.poner(App.FICHERO_ASUNTOS, () => bloqueo);

await new Promise((r) => setTimeout(r, 5));   /* que el reloj avance de verdad */
const externo = await leerJsonDeVerdad(gestor, App.FICHERO_ASUNTOS);
externo.asuntos[OTRO].situacion = 'CAMBIADO POR FUERA';
await escribirDeVerdad(gestor, App.FICHERO_ASUNTOS, JSON.stringify(externo));

await VistazoRegistro.comprobarYReleer();
comprobar('3a. con un guardado en marcha, el vistazo no relee',
  App.E.registro.asuntos[OTRO].situacion, 'abierto');

liberar();
await guardando;

await VistazoRegistro.comprobarYReleer();
comprobar('3b. sin guardado en marcha, la siguiente pasada relee el cambio de fuera',
  App.E.registro.asuntos[OTRO].situacion, 'CAMBIADO POR FUERA');

/* ---------- 4. guardar la guía de un tipo no borra la de otro ---------- */
console.log('--- 4. las guías se guardan tipo a tipo ---');
await Copias.guardar(gestor, 'guias.json', { A: [{ id: 'pa', titulo: 'Paso A' }] });
await GuiasDelCentro._guardarTipo('B', [{ id: 'pb', titulo: 'Paso B' }]);
comprobar('4. guardar la guía de B conserva la de A escrita por fuera',
  Object.keys(await leerJsonDeVerdad(gestor, 'guias.json')).sort(), ['A', 'B']);

/* ---------- 5. presencia por usuario ---------- */
console.log('--- 5. presencia.json, uno por usuario ---');
const carpetaPresencia = await gestor.getDirectoryHandle('presencia', { create: true });
async function escribirPresenciaDe(nombreUsuario, asuntos) {
  await escribirDeVerdad(carpetaPresencia, U.hueso(nombreUsuario) + '.json',
    JSON.stringify({ usuario: nombreUsuario, asuntos: asuntos }));
}
await escribirPresenciaDe('Ana', {});
await escribirPresenciaDe('Luis', { [OTRO]: { ultima: new Date().toISOString() } });

App.E.usuario = 'Ana';
await Presencia.refrescarCache();
comprobar('5. la ficha de Luis sale "en consulta" para Ana', Presencia.ocupantePor(OTRO), 'Luis');

App.E.usuario = 'Luis';
await Presencia.refrescarCache();
comprobar('5. para Luis, su propia señal no cuenta como "ocupado"', Presencia.ocupantePor(OTRO), '');

console.log('');
if (fallos) {
  console.log(fallos + ' prueba(s) fallada(s) en datos-entre-ordenadores.mjs.');
  process.exit(1);
} else {
  console.log('Todo bien');
}
