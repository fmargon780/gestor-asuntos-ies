/* Prueba de la fila 64 (docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md): la
   ficha de un asunto archivado vive en su propia carpeta
   (`_ficha.json`), no para siempre en asuntos.json.

   Sin navegador, con el disco de mentira en memoria de
   pruebas/logica.mjs, ampliando pruebas/renombrar-asunto.mjs: carga
   util.js, carpetas.js, copias.js, nucleo.js y asuntos-archivar.js (el
   App.cerrarAsunto/App.reabrirAsunto de verdad) más js/ficha-archivo.js
   (el envoltorio de esta fila) en un contexto vm. Los dos cuadros de
   confirmación que abre asuntos-archivar.js (U.preguntar) se aceptan
   solos: aquí no hay nadie para pulsarlos, y no es eso lo que se
   prueba. js/archivo-indice.js, js/relacionados.js y
   js/hitos-archivo.js no se cargan a propósito (comprueban
   "!window.IndiceArchivo"/no aplican y no hacen falta para esto):
   FichaArchivo envuelve directamente el App.cerrarAsunto/
   App.reabrirAsunto de asuntos-archivar.js, igual que lo haría con la
   cadena entera de la aplicación de verdad. */
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
for (const f of ['util.js', 'carpetas.js', 'copias.js', 'nucleo.js', 'asuntos-archivar.js', 'ficha-archivo.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, Carpetas, FichaArchivo } = contexto;

/* Cuadros que en la aplicación de verdad pulsa Francisco: aquí se
   aceptan solos, y los avisos no van a ningún sitio. */
contexto.U.preguntar = async function () { return true; };
contexto.U.aviso = function () {};
App.verAbiertos = async function () {};

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

/* ---------- el disco: abiertos, archivo, _GESTOR ---------- */
const abiertos = dirFalso('abiertos');
const archivo = dirFalso('archivo');
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
App.E.abiertos = abiertos;
App.E.archivo = archivo;
App.E.gestor = gestor;
App.E.usuario = 'Francisco';
App.E.tipos = [];

async function escribirAsuntos(objeto) {
  const h = await gestor.getFileHandle('asuntos.json', { create: true });
  await (await h.createWritable()).write(JSON.stringify(objeto));
}
async function leerAsuntos() {
  const h = await gestor.getFileHandle('asuntos.json', { create: true });
  const texto = (await h.getFile())._texto;
  return texto ? JSON.parse(texto) : { asuntos: {} };
}

/* Una ficha "completa", con de todo un poco: notas, campos, loPide,
   relacionados. Lo que el informe dice que había que conservar. */
const fichaCompleta = {
  tipo: 'MATRICULA', categoria: 'FAMILIAS', tercero: 'Pérez García, Ana 1234',
  situacion: 'PENDIENTE', via: 'correo', viaDato: 'ana@ejemplo.es',
  notas: [{ texto: 'Llamó el padre', quien: 'Francisco', cuando: '2026-09-01T10:00:00.000Z' }],
  campos: { curso: { valor: '26-27', enNombre: true } },
  loPide: { nombre: 'García López, Juan', quien: 'tutor1' },
  relacionados: [{ categoria: 'PERSONAL', nombre: 'Ruiz Mena, Luis 678Z' }]
};

/* ================================================================
   1-2. Archivar: la clave sale de asuntos.json y aparece _ficha.json
   en la carpeta ya archivada, con la ficha entera.
   ================================================================ */
console.log('--- 1-2. archivar: la ficha baja a su carpeta ---');

const NOMBRE = '260901 MATRICULA 26-27 Pérez García, Ana 1234';
await abiertos.getDirectoryHandle(NOMBRE, { create: true });
await escribirAsuntos({ asuntos: { [NOMBRE]: fichaCompleta } });
await App.cargarRegistro();

await App.cerrarAsunto({ nombre: NOMBRE, ficha: fichaCompleta, leido: {} });

const asuntosTrasArchivar = await leerAsuntos();
comprobar('la clave ya no está en asuntos.json', !!asuntosTrasArchivar.asuntos[NOMBRE], false);

const carpetaFamilias = await archivo.getDirectoryHandle('FAMILIAS');
const carpetaTercero = await carpetaFamilias.getDirectoryHandle('Pérez García, Ana 1234');
const carpetaAsuntoArchivado = await carpetaTercero.getDirectoryHandle(NOMBRE);
const fichaGuardada = await FichaArchivo.leer(carpetaAsuntoArchivado);
comprobar('el estado se ha puesto a cerrado', fichaGuardada && fichaGuardada.estado, 'cerrado');
comprobar('las notas viajan enteras', fichaGuardada && fichaGuardada.notas, fichaCompleta.notas);
comprobar('los campos viajan enteros', fichaGuardada && fichaGuardada.campos, fichaCompleta.campos);
comprobar('lo pide viaja entero', fichaGuardada && fichaGuardada.loPide, fichaCompleta.loPide);
comprobar('los relacionados viajan enteros', fichaGuardada && fichaGuardada.relacionados, fichaCompleta.relacionados);

/* ================================================================
   3. Reabrir: la ficha vuelve entera a asuntos.json, y el fichero
   desaparece de la carpeta (que ya está de vuelta en abiertos).
   ================================================================ */
console.log('--- 3. reabrir: la ficha vuelve entera ---');

await App.cargarRegistro();
await App.reabrirAsunto({
  nombre: NOMBRE, handle: carpetaAsuntoArchivado, padre: carpetaTercero,
  ficha: {}, leido: {}
});

const asuntosTrasReabrir = await leerAsuntos();
const fichaReabierta = asuntosTrasReabrir.asuntos[NOMBRE];
comprobar('el estado se ha puesto a abierto', fichaReabierta && fichaReabierta.estado, 'abierto');
comprobar('las notas han vuelto', fichaReabierta && fichaReabierta.notas, fichaCompleta.notas);
comprobar('los campos han vuelto', fichaReabierta && fichaReabierta.campos, fichaCompleta.campos);
comprobar('lo pide ha vuelto', fichaReabierta && fichaReabierta.loPide, fichaCompleta.loPide);

const carpetaAbiertaDeNuevo = await abiertos.getDirectoryHandle(NOMBRE);
const quedaFicheroViejo = await FichaArchivo.leer(carpetaAbiertaDeNuevo);
comprobar('el _ficha.json ha desaparecido de la carpeta', quedaFicheroViejo, null);

/* ================================================================
   4. Un asunto archivado SIN _ficha.json (archivado antes de esta
   fila) se reabre sin romper nada: ficha vacía, como hoy.
   ================================================================ */
console.log('--- 4. compatibilidad: archivado antes de esta fila, sin _ficha.json ---');

const NOMBRE_VIEJO = '260801 BECA 26-27 Viejo Ejemplo, Tino 9999';
const carpetaOtroTercero = await carpetaFamilias.getDirectoryHandle('Viejo Ejemplo, Tino 9999', { create: true });
const carpetaViejaArchivada = await carpetaOtroTercero.getDirectoryHandle(NOMBRE_VIEJO, { create: true });
/* Nada en asuntos.json (se borró al archivar, como pasaba antes de
   esta fila) y ningún _ficha.json en la carpeta. */
await escribirAsuntos({ asuntos: {} });
await App.cargarRegistro();

let rompio = false;
try {
  await App.reabrirAsunto({
    nombre: NOMBRE_VIEJO, handle: carpetaViejaArchivada, padre: carpetaOtroTercero,
    ficha: { categoria: 'FAMILIAS', tercero: 'Viejo Ejemplo, Tino 9999' }, leido: {}
  });
} catch (e) { rompio = true; }
comprobar('reabrir uno sin _ficha.json no revienta', rompio, false);

const asuntosTrasReabrirViejo = await leerAsuntos();
comprobar('se reabre con ficha vacía (más el estado que pone reabrirAsunto)',
  Object.keys(asuntosTrasReabrirViejo.asuntos[NOMBRE_VIEJO] || {}).sort(),
  ['estado', 'reabiertoEl', 'reabiertoPor']);

/* ================================================================
   5. FichaArchivo.completar: una tarjeta del ARCHIVO que solo trae lo
   poco que guarda el índice se completa con la ficha entera al pedir
   verla (el mismo camino que usan js/otros-del-tercero.js y el click
   de una tarjeta del ARCHIVO en js/ficha-asunto.js).
   ================================================================ */
console.log('--- 5. completar una tarjeta del ARCHIVO con su ficha entera ---');

const NOMBRE2 = '260902 MATRICULA 26-27 Otro Ejemplo, Sara 5555';
const carpetaOtro = await carpetaFamilias.getDirectoryHandle('Otro Ejemplo, Sara 5555', { create: true });
const carpetaAsunto2 = await carpetaOtro.getDirectoryHandle(NOMBRE2, { create: true });
await FichaArchivo.escribir(carpetaAsunto2, Object.assign({}, fichaCompleta, { tercero: 'Otro Ejemplo, Sara 5555' }));

const tarjetaDelIndice = {
  nombre: NOMBRE2, categoria: 'FAMILIAS', tercero: 'Otro Ejemplo, Sara 5555', ruta: 'FAMILIAS / Otro Ejemplo, Sara 5555',
  sueltoEn: '', handle: null,
  ficha: { situacion: 'PENDIENTE', via: 'correo', viaDato: 'ana@ejemplo.es', categoria: 'FAMILIAS', tercero: 'Otro Ejemplo, Sara 5555' }
};
/* Sin IndiceArchivo cargado en esta prueba, resolverHandle no existe:
   se le da el handle ya puesto, como pasaría tras un primer completar. */
tarjetaDelIndice.handle = carpetaAsunto2;
const encontrada = await FichaArchivo.completar(tarjetaDelIndice);
comprobar('completar dice que ha encontrado la ficha', encontrada, true);
comprobar('la ficha completa reemplaza a la del índice',
  tarjetaDelIndice.ficha.notas, fichaCompleta.notas);

/* ================================================================
   6. El botón de conversión: mueve las fichas de los asuntos ya
   archivados que todavía están en asuntos.json, y deja el registro
   solo con los abiertos.
   ================================================================ */
console.log('--- 6. poner en orden las fichas del ARCHIVO ---');

const NOMBRE3 = '260701 CERT 26-27 Tercero Ejemplo, Ana 7777';
const carpetaTercero3 = await carpetaFamilias.getDirectoryHandle('Tercero Ejemplo, Ana 7777', { create: true });
await carpetaTercero3.getDirectoryHandle(NOMBRE3, { create: true });
await escribirAsuntos({
  asuntos: {
    'ABIERTO DE VERDAD': { estado: 'abierto', tipo: 'MATRICULA' },
    [NOMBRE3]: { estado: 'cerrado', categoria: 'FAMILIAS', tercero: 'Tercero Ejemplo, Ana 7777', situacion: 'RESUELTO' }
  }
});
await App.cargarRegistro();

const resultado = await FichaArchivo._convertirTodo();
comprobar('mueve la única ficha pendiente', resultado.movidos, 1);
comprobar('ninguna sin carpeta', resultado.sinCarpeta.length, 0);

const asuntosTrasConvertir = await leerAsuntos();
comprobar('el registro se queda solo con el abierto',
  Object.keys(asuntosTrasConvertir.asuntos), ['ABIERTO DE VERDAD']);

const carpetaAsunto3 = await carpetaTercero3.getDirectoryHandle(NOMBRE3);
const fichaMovida = await FichaArchivo.leer(carpetaAsunto3);
comprobar('la ficha ha llegado a su carpeta', fichaMovida && fichaMovida.situacion, 'RESUELTO');

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
