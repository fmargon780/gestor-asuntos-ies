/* Prueba sin navegador de la fila 177
   (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md): el índice del ARCHIVO partido
   por curso académico, su migración desde el formato antiguo, y el
   tope de largo del nombre contando la ruta completa de Dropbox.

   Con el disco de mentira en memoria, igual que pruebas/copias.mjs y
   pruebas/borrados-que-se-fusionan.mjs, cargando en un contexto `vm`
   los ficheros de verdad: util.js, carpetas.js, copias.js, nombres.js,
   nombres-topes.js, copiar-ruta.js, nucleo.js, archivo-indice.js (la
   lógica de leer/guardar/añadir/quitar; `archivo-indice-construir.js`
   —recorrer el disco— no hace falta para estas tres pruebas, que no
   reconstruyen nada desde cero).

   Las fechas de los asuntos de esta prueba son fijas a propósito (no
   "de hoy menos N días"): no comprueban nada relativo al calendario de
   hoy, solo que una fecha AAMMDD concreta cae siempre en el mismo
   curso académico (una cuenta que no cambia con el tiempo), así que no
   se estropean solas cuando el calendario avance.

   Los tres escenarios son los del documento:
     1. Un `indice-archivo.json` antiguo con asuntos de dos cursos se
        parte en `indice-archivo/2025-26.json` y `2026-27.json`, más un
        resumen; el viejo queda en `copias/`. `leerDisco({ todos: true
        })` devuelve los dos.
     2. `anadirEntrada` de un asunto de un curso nuevo solo escribe el
        fichero de ESE curso: el otro no se toca.
     3. `Nombres.topes()`, con la ruta de ARCHIVO señalada y un tercero
        largo, da topes menores que los fijos, y `Nombres.montarAsunto`
        los respeta recortando el texto libre. Sin la ruta señalada,
        salen los topes fijos de siempre.

   Esta prueba falla sin el arreglo: antes de la fila 177,
   `indice-archivo.json` era un solo fichero con todos los asuntos
   juntos, sin partir por curso, y `Nombres.TOPE_ASUNTO`/`TOPE_DOCUMENTO`
   eran fijos, sin mirar la ruta. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function elementoFalso() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {}, addEventListener() {}, querySelector() { return null; },
    querySelectorAll() { return []; }, remove() {}, style: {}
  };
}
const contexto = {
  console, TextDecoder, Blob, indexedDB: null, setTimeout, clearTimeout, localStorage: null,
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
for (const f of ['util.js', 'util-parecidos.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js',
                 'nombres.js', 'nombres-topes.js', 'copiar-ruta.js', 'nucleo.js', 'archivo-indice.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, U, Carpetas, Nombres, RutaCarpetas, IndiceArchivo } = contexto;

/* ---------- disco de mentira, igual que en pruebas/copias.mjs ---------- */
function dirFalso(nombre) {
  const hijos = new Map();
  const h = {
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
  return h;
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
    },
    /* Carpetas.moverFichero prueba primero `move()`, como en el
       navegador de verdad sobre Dropbox: aquí también se rechaza,
       para pasar por el mismo camino de copiar-y-borrar. */
    async move() {
      const e = new Error('no se puede mover aquí');
      e.name = 'NotAllowedError';
      throw e;
    }
  };
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, real) {
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

async function nombresDe(carpeta, fichero) {
  const d = await Carpetas.leerJson(carpeta, fichero).catch(() => null);
  return d;
}
async function listar(dir) {
  const n = [];
  for await (const [k] of dir.entries()) n.push(k);
  return n.sort();
}

/* ============================================================
   1. MIGRACIÓN DEL FORMATO ANTIGUO
   ============================================================ */
console.log('--- 1. migración del índice antiguo a un fichero por curso ---');

const gestor1 = dirFalso('_GESTOR');
App.E = { gestor: gestor1, usuario: 'Ana' };

/* Formato de antes de la fila 177: un solo indice-archivo.json con
   `asuntos` de dos cursos distintos (calculado por fecha, no por lo
   que diga el propio nombre: "25-26" en la carpeta es solo un texto
   libre, lo que manda es AAMMDD). 250915 -> curso 25-26 (sep-25 a
   ago-26). 260201 -> curso 25-26 también (feb-26 sigue en el mismo
   curso). 260910 -> curso 26-27 (sep-26 empieza el siguiente). */
const ASUNTO_A = '250915 MATRICULA 25-26 Perez Perez, Ana 1234567';
const ASUNTO_B = '260201 CERTIFICADO 25-26 Ruiz Soto, Pedro 1112';
const ASUNTO_C = '260910 CONTRATO 26-27 Otro Tercero 7654321';
const indiceViejo = {
  version: 3, hechoEl: '2026-06-01T10:00:00.000Z', hechoPor: 'Francisco',
  recuento: { ALUMNADO: 1, PERSONAL: 1 },
  asuntos: [
    { nombre: ASUNTO_A, categoria: 'ALUMNADO', tercero: 'Perez Perez, Ana 1234567' },
    { nombre: ASUNTO_B, categoria: 'ALUMNADO', tercero: 'Ruiz Soto, Pedro 1112' },
    { nombre: ASUNTO_C, categoria: 'OTROS', tercero: 'Otro Tercero 7654321' }
  ]
};
await Carpetas.escribirTexto(gestor1, IndiceArchivo.FICHERO_RESUMEN, JSON.stringify(indiceViejo));

const r1 = await IndiceArchivo.leerDisco({ todos: true });
comprobarQue('1. el índice se puede leer después de migrar', r1.ok);
comprobar('1. leerDisco({todos:true}) trae los tres asuntos, de los dos cursos',
  (r1.datos.asuntos || []).map((a) => a.nombre).sort(), [ASUNTO_A, ASUNTO_B, ASUNTO_C].sort());

const carpetaCursos1 = await gestor1.getDirectoryHandle(IndiceArchivo.CARPETA);
const fichero2526 = await nombresDe(carpetaCursos1, '25-26.json');
const fichero2627 = await nombresDe(carpetaCursos1, '26-27.json');
comprobarQue('1. 2025-26.json se ha creado (dos asuntos)', !!fichero2526);
comprobar('1. 25-26.json trae justo los dos asuntos de ese curso',
  (fichero2526.asuntos || []).map((a) => a.nombre).sort(), [ASUNTO_A, ASUNTO_B].sort());
comprobarQue('1. 2026-27.json se ha creado (un asunto)', !!fichero2627);
comprobar('1. 26-27.json trae justo el asunto de ese curso',
  (fichero2627.asuntos || []).map((a) => a.nombre), [ASUNTO_C]);

const resumenNuevo = await nombresDe(gestor1, IndiceArchivo.FICHERO_RESUMEN);
comprobarQue('1. el resumen ya no lleva "asuntos" (formato nuevo)', !Array.isArray(resumenNuevo.asuntos));
comprobar('1. el resumen lista los dos cursos', (resumenNuevo.cursos || []).slice().sort(), ['25-26', '26-27']);
comprobar('1. el resumen conserva el recuento de antes', resumenNuevo.recuento, { ALUMNADO: 1, PERSONAL: 1 });

const nombresCopias1 = await listar(await gestor1.getDirectoryHandle('copias'));
comprobarQue('1. el fichero viejo queda apartado en copias/',
  nombresCopias1.some((n) => n.indexOf('indice-archivo-antiguo-') === 0));

/* Una segunda lectura, ya migrado, no vuelve a tocar nada (no hay
   `asuntos` en el resumen: migrarSiHaceFalta se queda sin hacer nada). */
const nombresCopiasAntes = nombresCopias1.length;
await IndiceArchivo.leerDisco({ todos: true });
const nombresCopiasDespues = await listar(await gestor1.getDirectoryHandle('copias'));
comprobar('1. una segunda lectura no migra otra vez (no crece copias/)',
  nombresCopiasDespues.length, nombresCopiasAntes);

/* ============================================================
   2. anadirEntrada SOLO REESCRIBE EL FICHERO DE SU CURSO
   ============================================================ */
console.log('--- 2. anadirEntrada solo toca el fichero del curso que le toca ---');

const gestor2 = dirFalso('_GESTOR');
App.E = { gestor: gestor2, usuario: 'Ana' };

/* Índice ya en el formato nuevo, con un curso solo. */
const carpetaCursos2 = await Carpetas.crear(gestor2, IndiceArchivo.CARPETA);
const ASUNTO_VIEJO = '250915 MATRICULA 25-26 Perez Perez, Ana 1234567';
await Carpetas.escribirTexto(carpetaCursos2, '25-26.json', JSON.stringify({
  version: 3, hechoEl: '2026-06-01T10:00:00.000Z', hechoPor: 'Ana', asuntos: [{ nombre: ASUNTO_VIEJO }]
}));
await Carpetas.escribirTexto(gestor2, IndiceArchivo.FICHERO_RESUMEN, JSON.stringify({
  version: 3, hechoEl: '2026-06-01T10:00:00.000Z', hechoPor: 'Ana', cursos: ['25-26'], recuento: { ALUMNADO: 1 }
}));

const ASUNTO_NUEVO = '260910 CONTRATO 26-27 Otro Tercero 7654321';
await IndiceArchivo.anadirEntrada({ nombre: ASUNTO_NUEVO, categoria: 'OTROS', tercero: 'Otro Tercero 7654321' });

const ficheroViejoTrasAnadir = await nombresDe(carpetaCursos2, '25-26.json');
comprobar('2. el fichero del curso de antes no se ha tocado',
  (ficheroViejoTrasAnadir.asuntos || []).map((a) => a.nombre), [ASUNTO_VIEJO]);
const ficheroNuevoTrasAnadir = await nombresDe(carpetaCursos2, '26-27.json');
comprobarQue('2. se ha creado el fichero del curso nuevo', !!ficheroNuevoTrasAnadir);
comprobar('2. con solo el asunto añadido',
  (ficheroNuevoTrasAnadir.asuntos || []).map((a) => a.nombre), [ASUNTO_NUEVO]);
const resumenTrasAnadir = await nombresDe(gestor2, IndiceArchivo.FICHERO_RESUMEN);
comprobar('2. el resumen ahora lista los dos cursos', (resumenTrasAnadir.cursos || []).slice().sort(), ['25-26', '26-27']);

/* quitarEntrada, simétrico: solo toca el fichero de su curso. */
await IndiceArchivo.quitarEntrada(ASUNTO_NUEVO);
const ficheroNuevoTrasQuitar = await nombresDe(carpetaCursos2, '26-27.json');
comprobar('2. quitarEntrada deja vacío el fichero de su curso, sin tocar el otro',
  (ficheroNuevoTrasQuitar.asuntos || []).map((a) => a.nombre), []);
const ficheroViejoTrasQuitar = await nombresDe(carpetaCursos2, '25-26.json');
comprobar('2. el fichero del otro curso sigue como estaba',
  (ficheroViejoTrasQuitar.asuntos || []).map((a) => a.nombre), [ASUNTO_VIEJO]);

/* ============================================================
   3. Nombres.topes(): el tope cuenta la ruta completa
   ============================================================ */
console.log('--- 3. Nombres.topes(), con y sin la ruta de ARCHIVO señalada ---');

const gestor3 = dirFalso('_GESTOR');
App.E = { gestor: gestor3, usuario: 'Ana', archivo: dirFalso('ARCHIVO'), abiertos: dirFalso('ASUNTOS ABIERTOS') };

/* Sin rutas.json todavía: los topes fijos de siempre. */
const sinRuta = Nombres.topes('Un Tercero Cualquiera 1234567');
comprobar('3. sin rutas.json, el tope de asunto es el fijo de siempre', sinRuta.asunto, Nombres.TOPE_ASUNTO);
comprobar('3. y el de documento también', sinRuta.documento, Nombres.TOPE_DOCUMENTO);

/* Con rutas.json señalado, con una ruta de ARCHIVO moderadamente larga
   (varios niveles dentro de Dropbox, como pide el encargo) y un
   tercero largo, pero no tan largos como para que ni recortando el
   texto libre quepa (eso se prueba aparte, más abajo). */
await Carpetas.escribirTexto(gestor3, 'rutas.json', JSON.stringify({
  abiertos: 'ADMINISTRACIÓN/ASUNTOS ABIERTOS',
  archivo: 'ADMINISTRACIÓN/ARCHIVO'
}));
await RutaCarpetas.cargarComun();

const terceroLargo = 'Fernandez Villalobos, Maria Del Rosario 1234567';
const conRuta = Nombres.topes(terceroLargo);
comprobarQue('3. con la ruta señalada y un tercero largo, el tope de asunto baja del fijo',
  conRuta.asunto < Nombres.TOPE_ASUNTO);
comprobarQue('3. el tope no se queda en cero ni en negativo', conRuta.asunto > 0);

/* El nombre propuesto respeta el tope nuevo, recortando el texto libre
   (nunca la fecha, el tipo, el año académico ni el tercero). */
const propuesta = Nombres.montarAsunto({
  fecha: '2026-09-10', tipo: 'MATRICULA', curso: '26-27',
  descripcion: 'Una descripción bastante larga que en circunstancias normales cabría de sobra en el nombre',
  tercero: terceroLargo
});
comprobarQue('3. el nombre recortado respeta el tope nuevo (más corto que el tope fijo)',
  propuesta.nombre.length <= conRuta.asunto);
comprobarQue('3. y avisa de que ha recortado', propuesta.recortado);
comprobarQue('3. pero sí ha cabido: no hace falta avisar de que no cabe', !propuesta.noCabe);
comprobarQue('3. la fecha, el tipo y el tercero siguen enteros en el nombre',
  propuesta.nombre.indexOf('260910') === 0 && propuesta.nombre.indexOf('MATRICULA') !== -1 &&
  propuesta.nombre.indexOf(terceroLargo) !== -1);

/* Un tercero y una ruta tan largos que, ni quitando el texto libre por
   completo, el nombre cabe en el tope: se avisa (`noCabe`) y quien
   llama no debe crear nada (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md, punto
   2: «se avisa en rojo antes de crear... y no se crea»). */
await Carpetas.escribirTexto(gestor3, 'rutas.json', JSON.stringify({
  abiertos: 'ADMINISTRACIÓN/REGISTROS/Gestor de Asuntos/ASUNTOS ABIERTOS',
  archivo: 'ADMINISTRACIÓN/REGISTROS/Gestor de Asuntos - aplicación completa/ARCHIVO DEL CENTRO EDUCATIVO'
}));
await RutaCarpetas.cargarComun();
const terceroMuyLargo = 'Fernandez-Villalobos De La Cuesta, Maria Del Rosario 1234567';
const propuestaSinHueco = Nombres.montarAsunto({
  fecha: '2026-09-10', tipo: 'MATRICULA', curso: '26-27', tercero: terceroMuyLargo
});
comprobarQue('3. sin ningún texto libre que quitar y aun así no cabe: noCabe', propuestaSinHueco.noCabe);
comprobarQue('3. pero no se inventa nada: el tercero sigue entero',
  propuestaSinHueco.nombre.indexOf(terceroMuyLargo) !== -1);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
