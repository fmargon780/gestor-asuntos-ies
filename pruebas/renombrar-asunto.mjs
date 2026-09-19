/* Prueba de la fila 62 (docs/RENOMBRAR-SIN-PERDER-HITOS.md): renombrar,
   unir o borrar un asunto no puede dejar sus hitos huérfanos bajo el
   nombre viejo.

   Sin navegador, con el disco de mentira en memoria de
   pruebas/logica.mjs, ampliando pruebas/guardar-sin-pisar.mjs con
   js/hitos.js, js/presencia.js, js/conflictos.js y el fichero nuevo
   js/asunto-renombrar.js. Los cuatro caminos que renombran un asunto
   (App.editarAsunto, App.renombrarAsuntosAbiertosDelTercero,
   fusionarFicha, fichas-huerfanas.enlazar) y el quinto que lo borra
   (js/papelera.js) son todos envoltorios finos sobre AsuntoRenombrar,
   con un cuadro U.preguntar por delante que necesita un DOM de verdad
   para contestar (pruebas/*.mjs en navegador lo hacen); aquí se prueba
   directamente el sitio único donde vive todo el riesgo de perder
   datos: AsuntoRenombrar.mover/fusionar/quitar/restaurar. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function elementoFalso() { return {}; }
const contexto = {
  console, TextDecoder, Blob, indexedDB: null,
  addEventListener: function () {},
  document: {
    getElementById: elementoFalso,
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return { classList: { add() {}, remove() {}, toggle() {} }, appendChild() {} }; },
    addEventListener: function () {},
    readyState: 'complete'
  }
};
contexto.window = contexto;
vm.createContext(contexto);
for (const f of ['util.js', 'carpetas.js', 'copias.js', 'nucleo.js', 'conflictos.js', 'presencia.js', 'hitos.js', 'asunto-renombrar.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, AsuntoRenombrar, Hitos } = contexto;

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

/* ---------- el disco: carpeta abiertos con _GESTOR dentro ---------- */
const abiertos = dirFalso('abiertos');
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
App.E.abiertos = abiertos;
App.E.gestor = gestor;
App.E.usuario = 'Francisco';
contexto.Gestor = { carpetaGestor: function () { return App.E.gestor; }, usuario: function () { return App.E.usuario; } };

async function escribirAsuntos(objeto) {
  const h = await gestor.getFileHandle('asuntos.json', { create: true });
  await (await h.createWritable()).write(JSON.stringify(objeto));
}
async function leerHitos() {
  const h = await gestor.getFileHandle('hitos.json', { create: true });
  const texto = (await h.getFile())._texto;
  return texto ? JSON.parse(texto) : { ajustes: {}, porAsunto: {} };
}
async function leerPresencia() {
  const h = await gestor.getFileHandle('presencia.json', { create: true });
  const texto = (await h.getFile())._texto;
  return texto ? JSON.parse(texto) : {};
}

/* Un hito "rico", con las seis cosas que el informe dice que se
   pierden hoy: fecha límite, responsable, una nota de historial, un
   documento apuntado, y un requisito marcado con su valor. */
function hitoRico(id, extra) {
  return Object.assign({
    id: id, titulo: 'Recoger la solicitud', cuerpo: '', origenGuia: id, clase: 'paso',
    estado: 'encurso', desde: '2026-09-01', responsable: 'yo',
    fecha: '2026-09-15', fechaManual: true, plazo: null, estadoAsunto: null,
    notas: [{ texto: 'Llamé el martes', quien: 'Francisco', cuando: '2026-09-01T10:00:00.000Z' }],
    documentos: ['260901 SOLICITUD.pdf'],
    requisitos: [{ id: 'r1', texto: 'DNI', clase: 'documento', obligatorio: true, hecho: true,
                   valor: '', documento: '260901 DNI.pdf', quien: 'Francisco', cuando: '2026-09-01T10:05:00.000Z' }],
    plantilla: null, opciones: [], elegida: null
  }, extra || {});
}

async function montarHitos(porAsunto) {
  await (await gestor.getFileHandle('hitos.json', { create: true })).createWritable()
    .then((w) => w.write(JSON.stringify({ ajustes: {}, porAsunto: porAsunto })));
}

/* ================================================================
   1. Renombrar un asunto (App.editarAsunto): los hitos viajan enteros.
   ================================================================ */
console.log('--- 1. renombrar un asunto: los hitos viajan enteros ---');

await escribirAsuntos({ asuntos: { 'ANTES': { situacion: 'PENDIENTE' } } });
await montarHitos({ ANTES: { creados: '2026-09-01', hitos: [hitoRico('h1')] } });
await App.cargarRegistro();

const ficha = await AsuntoRenombrar.mover('ANTES', 'DESPUES', { situacion: 'EN TRAMITE' });
comprobar('la ficha vuelve con los datos nuevos fundidos', ficha.situacion, 'EN TRAMITE');

const hitos1 = await leerHitos();
comprobar('nada queda bajo la clave vieja', !!hitos1.porAsunto.ANTES, false);
comprobar('los hitos viajan enteros a la clave nueva',
  hitos1.porAsunto.DESPUES && hitos1.porAsunto.DESPUES.hitos, [hitoRico('h1')]);

/* ================================================================
   2. Si el destino ya tenía hitos, se fusionan sin perder ninguno.
   ================================================================ */
console.log('--- 2. el destino ya tenía hitos: se fusionan ---');

await escribirAsuntos({ asuntos: { DESPUES: { situacion: 'EN TRAMITE' }, C: { situacion: 'PENDIENTE' } } });
await montarHitos({
  DESPUES: { creados: '2026-09-01', hitos: [hitoRico('h1')] },
  C: { creados: '2026-09-05', hitos: [hitoRico('h2', { titulo: 'Otro paso' })] }
});
await App.cargarRegistro();

await AsuntoRenombrar.mover('C', 'DESPUES', {});
const hitos2 = await leerHitos();
comprobar('los dos hitos conviven bajo la clave que se queda',
  (hitos2.porAsunto.DESPUES.hitos || []).map((h) => h.id).sort(), ['h1', 'h2']);
comprobar('nada queda bajo la clave que desaparece', !!hitos2.porAsunto.C, false);

/* ================================================================
   3. Unir dos asuntos (fusionarFicha + AsuntoRenombrar.fusionar): los
   hitos de los dos sobreviven bajo el que se queda.
   ================================================================ */
console.log('--- 3. unir dos asuntos: los hitos de los dos sobreviven ---');

await escribirAsuntos({ asuntos: { QUEDA: { situacion: 'PENDIENTE' }, SEVA: { situacion: 'PENDIENTE' } } });
await montarHitos({
  QUEDA: { creados: '2026-09-01', hitos: [hitoRico('hQ')] },
  SEVA: { creados: '2026-09-02', hitos: [hitoRico('hV', { titulo: 'Paso del que se va' })] }
});
await App.cargarRegistro();

await AsuntoRenombrar.fusionar('QUEDA', 'SEVA');
const hitos3 = await leerHitos();
comprobar('los hitos de "se va" entran en "queda"',
  (hitos3.porAsunto.QUEDA.hitos || []).map((h) => h.id).sort(), ['hQ', 'hV']);
comprobar('nada queda bajo "se va"', !!hitos3.porAsunto.SEVA, false);

/* ================================================================
   4. Enlazar una ficha huérfana (AsuntoRenombrar.mover con datosExtra
   vacío): los hitos, si los había con el nombre de la ficha huérfana,
   viajan con ella.
   ================================================================ */
console.log('--- 4. enlazar una ficha huérfana: los hitos viajan ---');

await escribirAsuntos({ asuntos: { 'NOMBRE VIEJO': { situacion: 'PENDIENTE' } } });
await montarHitos({ 'NOMBRE VIEJO': { creados: '2026-09-01', hitos: [hitoRico('hE')] } });
await App.cargarRegistro();

await AsuntoRenombrar.mover('NOMBRE VIEJO', 'CARPETA NUEVA', {});
const hitos4 = await leerHitos();
comprobar('los hitos viajan con la ficha enlazada',
  (hitos4.porAsunto['CARPETA NUEVA'] || {}).hitos, [hitoRico('hE')]);

/* ================================================================
   5. Borrar y devolver desde la papelera: los hitos hacen el viaje de
   ida y vuelta sin perder nada.
   ================================================================ */
console.log('--- 5. borrar y devolver: los hitos vuelven ---');

await escribirAsuntos({ asuntos: { BORRAR: { situacion: 'PENDIENTE' } } });
await montarHitos({ BORRAR: { creados: '2026-09-01', hitos: [hitoRico('hB')] } });
await App.cargarRegistro();

const hitosGuardados = await AsuntoRenombrar.quitar('BORRAR');
const hitos5a = await leerHitos();
comprobar('al quitar, no queda nada bajo la clave borrada', !!hitos5a.porAsunto.BORRAR, false);
comprobar('quitar devuelve los hitos para que la papelera los guarde',
  hitosGuardados && hitosGuardados.hitos, [hitoRico('hB')]);

await AsuntoRenombrar.restaurar('BORRAR', hitosGuardados);
const hitos5b = await leerHitos();
comprobar('al devolver, los hitos vuelven enteros',
  hitos5b.porAsunto.BORRAR && hitos5b.porAsunto.BORRAR.hitos, [hitoRico('hB')]);

/* ================================================================
   6. La señal de presencia también viaja con el renombrado.
   ================================================================ */
console.log('--- 6. la señal de presencia viaja con el renombrado ---');

await (await gestor.getFileHandle('presencia.json', { create: true })).createWritable()
  .then((w) => w.write(JSON.stringify({ 'CON PRESENCIA': { usuario: 'Ana', ultima: new Date().toISOString() } })));
await escribirAsuntos({ asuntos: { 'CON PRESENCIA': { situacion: 'PENDIENTE' } } });
await App.cargarRegistro();
await AsuntoRenombrar.mover('CON PRESENCIA', 'CON PRESENCIA NUEVA', {});
const presencia6 = await leerPresencia();
comprobar('la señal de presencia viaja a la clave nueva',
  presencia6['CON PRESENCIA NUEVA'] && presencia6['CON PRESENCIA NUEVA'].usuario, 'Ana');
comprobar('nada queda bajo la clave vieja', !!presencia6['CON PRESENCIA'], false);

/* ================================================================
   7. Hitos huérfanos: una entrada de una clave que no es ni un
   asunto abierto ni archivado se detecta y se puede contar.
   ================================================================ */
console.log('--- 7. hitos huérfanos, de un renombrado antiguo ---');

App.E.listaAbiertos = [{ nombre: 'VIVO' }];
App.E.listaArchivo = [];
await montarHitos({
  VIVO: { creados: '2026-09-01', hitos: [hitoRico('hV2')] },
  'HUERFANO DE VERDAD': { creados: '2026-08-01', hitos: [hitoRico('hH')] }
});
const huerfanos = await AsuntoRenombrar._huerfanos();
comprobar('encuentra la entrada huérfana y no la viva', huerfanos, ['HUERFANO DE VERDAD']);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
