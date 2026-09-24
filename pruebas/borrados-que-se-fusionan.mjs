/* Prueba de la fila 77 (docs/DETALLES-DE-MANTENIMIENTO.md, punto 3,
   separado de la fila 72): los borrados de tipos.json, estados.json,
   tipos-documento.json y recurrentes.json se fusionan entre
   ordenadores, en vez de reaparecer solos.

   Sin navegador, con el disco de mentira en memoria (el mismo patrón
   que pruebas/copias.mjs y pruebas/guardar-sin-pisar.mjs), cargando en
   un contexto vm: util.js, carpetas.js, copias.js, nombres.js,
   nucleo.js y borrados-fusion.js (la lógica de verdad: App.guardarTipos,
   App.guardarEstados, App.guardarTiposDocumento y Borrados, tal cual
   los usa la aplicación).

   El escenario del propio documento, con dos "ordenadores" (dos
   variables de JavaScript sobre el mismo disco de mentira, ya que
   aquí no hay dos pestañas de verdad):

     1. PC1 crea BECA y MATRICULA y guarda. PC2 carga esa misma lista
        en su memoria (todavía no sabe nada del borrado que viene).
     2. PC1 borra BECA (Borrados.marcar + guardarTipos).
     3. PC2, SIN enterarse del borrado, guarda algo suyo sin relación
        (fusionarConDisco por sí sola traería BECA de vuelta). Con el
        arreglo, no reaparece: ni en lo que queda en disco, ni en la
        memoria de PC2.
     4. Dar de alta BECA a mano después del borrado sí entra (revivir
        antes del alta, como hacen ya los sitios que la dan de alta o
        la devuelven de la papelera).

   Se prueba lo mismo con estados.json (objetos, `e.nombre`) y con
   tipos-documento.json (una lista de textos sueltos, clave = el texto
   mismo). Los cuatro `Borrados.marcar/revivir/filtrarActivos` se
   comprueban también sueltos, con 'recurrentes' incluido (su alta no
   necesita revivir: el id siempre es nuevo, ver el comentario en
   js/recurrentes.js, pero el borrado sí tiene que respetarse igual que
   los otros tres).

   Esta prueba falla sin el arreglo: antes de la fila 77,
   App.fusionarConDisco solo sumaba lo que hubiera de más en el disco y
   nunca quitaba nada, así que el paso 3 devolvía BECA a la lista. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function elementoFalso() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {}, addEventListener() {}, querySelector() { return null; }, remove() {},
    style: {}
  };
}
/* Un registro por id, para que un campo de un cuadro (`$('tipo-nuevo-
   nombre')`, sección 6, apartado 9) se pueda "escribir" a mano antes
   de llamar a la función, con U.preguntar sustituido más abajo: el
   mismo elemento se devuelve siempre que se pida ese mismo id. */
const elementosPorId = new Map();
function elementoPara(id) {
  if (!elementosPorId.has(id)) elementosPorId.set(id, Object.assign(elementoFalso(), { value: '' }));
  return elementosPorId.get(id);
}
const contexto = {
  console, TextDecoder, Blob, indexedDB: null, setTimeout, clearTimeout,
  document: {
    getElementById: elementoPara,
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
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'nombres.js', 'nucleo.js', 'borrados-fusion.js', 'ajustes.js', 'tipos-nombre.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, Borrados, U } = contexto;
contexto.U.preguntar = async function () { return true; };
App.verAbiertos = async function () {};

/* ---------- disco de mentira, igual que en pruebas/copias.mjs ---------- */
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
  if (!ok) {
    fallos++;
    console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado));
  } else {
    console.log('bien   ' + titulo);
  }
}

const gestor = dirFalso('_GESTOR');
App.E = { gestor: gestor };

async function tiposDeDisco() {
  return (await App.E.gestor.getFileHandle(App.FICHERO_TIPOS)
    .then(async (fh) => JSON.parse((await fh.getFile())._texto)).catch(() => null)) || [];
}

/* ---------- 1. tipos.json: el escenario completo del documento ---------- */

/* PC1 crea BECA y MATRICULA. */
App.E.tipos = [{ tipo: 'BECA', categoria: 'ALUMNADO' }, { tipo: 'MATRICULA', categoria: 'ALUMNADO' }];
await App.guardarTipos();

/* PC2 carga la misma lista en su memoria (todavía no sabe del borrado que viene). */
let listaPC2 = JSON.parse(JSON.stringify(App.E.tipos));

/* PC1 borra BECA. */
App.E.tipos = App.E.tipos.filter((t) => t.tipo !== 'BECA');
await Borrados.marcar(gestor, 'tipos', 'BECA');
await App.guardarTipos();
comprobar('tipos: PC1 borra BECA y se queda solo MATRICULA en disco',
  (await tiposDeDisco()).map((t) => t.tipo).sort(), ['MATRICULA']);

/* PC2, sin enterarse, guarda algo suyo (aquí, sin ni siquiera tocar
   nada: basta con que su lista, todavía con BECA, pase por
   guardarTipos, que es justo lo que hace cualquier acción suya —
   activar un interruptor, cambiar un plazo). */
App.E.tipos = listaPC2;
await App.guardarTipos();
comprobar('tipos: el guardado de PC2 (con BECA todavía en su memoria) no la resucita en disco',
  (await tiposDeDisco()).map((t) => t.tipo).sort(), ['MATRICULA']);
comprobar('tipos: tampoco se queda en la memoria de PC2 tras guardar',
  App.E.tipos.map((t) => t.tipo).sort(), ['MATRICULA']);

/* Dar de alta BECA a mano, después del borrado: gana al borrado
   viejo (el mismo revivir + push que hacen js/ajustes.js,
   js/ficha-asunto.js y la papelera). */
await Borrados.revivir(gestor, 'tipos', 'BECA');
App.E.tipos.push({ tipo: 'BECA', categoria: 'ALUMNADO' });
await App.guardarTipos();
comprobar('tipos: dar de alta BECA a mano después del borrado sí entra',
  (await tiposDeDisco()).map((t) => t.tipo).sort(), ['BECA', 'MATRICULA']);

const conteoTiposTrasRevivir = await Borrados.contar(gestor);
comprobar('tipos: tras revivir, ya no queda BECA marcada como borrada',
  conteoTiposTrasRevivir.tipos.total, 0);

/* ---------- 2. estados.json: desde la fila 132 ya no hay estados escritos a
   mano (el estado del asunto es su hito actual), así que no hay nada que fusionar. ---------- */

/* ---------- 3. tipos-documento.json: una lista de textos sueltos ---------- */

App.E.tiposDocumento = ['DNI', 'CERTIFICADO'];
await App.guardarTiposDocumento();
let tiposDocPC2 = App.E.tiposDocumento.slice();

App.E.tiposDocumento = App.E.tiposDocumento.filter((x) => x !== 'DNI');
await Borrados.marcar(gestor, 'tiposDocumento', 'DNI');
await App.guardarTiposDocumento();

App.E.tiposDocumento = tiposDocPC2;
await App.guardarTiposDocumento();
comprobar('tipos de documento: el borrado de DNI no reaparece con la memoria vieja de otro ordenador',
  App.E.tiposDocumento.slice().sort(), ['CERTIFICADO']);

await Borrados.revivir(gestor, 'tiposDocumento', 'DNI');
App.E.tiposDocumento.push('DNI');
await App.guardarTiposDocumento();
comprobar('tipos de documento: dar de alta DNI a mano después de borrarlo sí entra',
  App.E.tiposDocumento.slice().sort(), ['CERTIFICADO', 'DNI']);

/* ---------- 4. Borrados suelto, con 'recurrentes' (id siempre nuevo: no hace falta revivir) ---------- */

await Borrados.marcar(gestor, 'recurrentes', 'r1');
let activos = await Borrados.filtrarActivos(gestor, 'recurrentes',
  [{ id: 'r1' }, { id: 'r2' }], (r) => r.id);
comprobar('recurrentes: filtrarActivos quita el id marcado como borrado', activos.map((r) => r.id), ['r2']);

const conteoRecurrentes = await Borrados.contar(gestor);
comprobar('recurrentes: Borrados.contar ve el borrado de r1', conteoRecurrentes.recurrentes.total, 1);

/* ---------- 5. Los borrados de menos de 90 días no se pueden purgar ---------- */

await Borrados.purgarViejas(gestor, 'recurrentes');
const conteoTrasPurgarReciente = await Borrados.contar(gestor);
comprobar('recurrentes: un borrado reciente no se quita con purgarViejas',
  conteoTrasPurgarReciente.recurrentes.total, 1);

/* Un borrado de hace 100 días sí se quita. */
await Borrados.marcar(gestor, 'recurrentes', 'r-viejo');
const datosBrutos = JSON.parse((await (await gestor.getFileHandle(Borrados.FICHERO)).getFile())._texto);
const hace100Dias = new Date(Date.now() - 100 * 86400000).toISOString();
datosBrutos.recurrentes = datosBrutos.recurrentes.map((x) =>
  x.clave === 'r-viejo' ? { clave: x.clave, borradoEl: hace100Dias } : x);
const fh = await gestor.getFileHandle(Borrados.FICHERO, { create: true });
const w = await fh.createWritable();
await w.write(JSON.stringify(datosBrutos));
await w.close();

const conteoAntesDePurgar = await Borrados.contar(gestor);
comprobar('recurrentes: un borrado de hace 100 días cuenta como "viejo"',
  conteoAntesDePurgar.recurrentes.viejas, 1);

await Borrados.purgarViejas(gestor, 'recurrentes');
const conteoTrasPurgarViejo = await Borrados.contar(gestor);
comprobar('recurrentes: purgarViejas quita el de hace 100 días y deja el reciente (r1)',
  conteoTrasPurgarViejo.recurrentes, { total: 1, viejas: 0 });

/* ---------- 6. Fila 79, apartado 9: un tipo renombrado no resucita como fantasma ----------

   Encontrado el 20-sep-2026: App.renombrarTipo cambiaba el nombre y
   guardaba, pero no marcaba el nombre viejo como borrado, así que
   fusionarConDisco lo devolvía a la vida como tipo aparte en cuanto el
   otro ordenador guardara cualquier otra cosa con su copia vieja en
   memoria. Mismo escenario que el punto 1, pero con un renombrado en
   vez de un borrado. */

/* El disco ya trae BECA y MATRICULA de las secciones de arriba: se
   añade ANULACION a esa misma lista, como haría un alta cualquiera. */
App.E.tipos.push({ tipo: 'ANULACION', categoria: 'ALUMNADO' });
await App.guardarTipos();
let tiposPC2Renombrado = JSON.parse(JSON.stringify(App.E.tipos));

App.E.listaAbiertos = [];   /* sin asuntos abiertos con este tipo: no hay carpetas que tocar */
const tipoAnulacion = App.E.tipos.filter((t) => t.tipo === 'ANULACION')[0];
elementoPara('tipo-nuevo-nombre').value = 'ANULACION MATRICULA';
await App.renombrarTipo(tipoAnulacion);
comprobar('renombrar: el tipo pasa a llamarse ANULACION MATRICULA, con el nombre viejo de alias',
  App.E.tipos.map((t) => ({ tipo: t.tipo, alias: t.alias || undefined })).sort((a, b) => a.tipo < b.tipo ? -1 : 1),
  [{ tipo: 'ANULACION MATRICULA', alias: ['ANULACION'] }, { tipo: 'BECA', alias: undefined },
    { tipo: 'MATRICULA', alias: undefined }]);

/* PC2, sin enterarse del renombrado, guarda algo suyo con su copia
   vieja (todavía "ANULACION", sin alias) en memoria. */
App.E.tipos = tiposPC2Renombrado;
await App.guardarTipos();
comprobar('renombrar: "ANULACION" no resucita como tipo fantasma tras el guardado de PC2',
  App.E.tipos.map((t) => t.tipo).sort(), ['ANULACION MATRICULA', 'BECA', 'MATRICULA']);

const conteoTiposTrasRenombrar = await Borrados.contar(gestor);
comprobar('renombrar: el nombre viejo queda marcado como borrado',
  conteoTiposTrasRenombrar.tipos.total, 1);

console.log('');
if (fallos) {
  console.log(fallos + ' prueba(s) fallada(s) en borrados-que-se-fusionan.mjs.');
  process.exit(1);
} else {
  console.log('Todo bien');
}
