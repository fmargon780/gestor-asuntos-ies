/* Prueba de lógica (jsdom, sin navegador de verdad) del botón "Cargar
   la biblioteca del centro" (20-sep-2026, fila 80 de docs/COLA.md,
   docs/CARGAR-BIBLIOTECA.md).

   Mismo patrón que pruebas/lo-pide.mjs, con un disco de mentira en
   memoria para _GESTOR (igual que pruebas/borrados-que-se-fusionan.mjs)
   y un `fetch` de mentira que sirve un fichero de biblioteca pequeño,
   inventado para la prueba (no el real de datos-biblioteca/, que se
   comprueba a mano con `node herramientas/cargar-biblioteca.mjs` y
   mirando el resultado).

   `document.getElementById` real de jsdom, con un elemento de mentira
   (un <div> de verdad, para que classList/value/appendChild funcionen)
   cuando el id no existe en la página: así cargan sin reventar
   nucleo.js y ajustes-enganche.js, que tocan controles que esta
   página, vacía a propósito, no tiene.

   Comprueba (regla del encargo: "fusiona, no pisa"):
   1. Un tipo NUEVO se da de alta.
   2. Un tipo que ya existe (con el mismo nombre de hoy) se renombra al
      nombre largo, con su nombre de hoy como nombre corto.
   3. Un modelo se crea en la biblioteca, y el mismo modelo se reutiliza
      en la guía de dos tipos (el punto entero de la fila 79).
   4. La guía se escribe.
   5. Un campo propio de lista se crea y se asigna al tipo.
   6. Volver a cargar la misma biblioteca no duplica nada: ni tipos, ni
      modelos, ni campos, ni pisa una guía ya escrita.
   7. Un tipo que ya tenía guía escrita a mano no se toca, y se avisa de
      que se ha saltado. */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- la página, con un getElementById que no revienta ---------- */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
const doc = win.document;
const elementosFalsos = new Map();
const getElementByIdDeVerdad = doc.getElementById.bind(doc);
doc.getElementById = function (id) {
  const real = getElementByIdDeVerdad(id);
  if (real) return real;
  if (!elementosFalsos.has(id)) elementosFalsos.set(id, doc.createElement('div'));
  return elementosFalsos.get(id);
};

/* ---------- disco de mentira, igual que en pruebas/requisitos-de-hito.mjs ---------- */
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

/* ---------- montar la página ---------- */
win.TextDecoder = TextDecoder;
win.Blob = Blob;
win.addEventListener = function () {};
win.App = null;   /* lo crea nucleo.js */

for (const f of ['util.js', 'carpetas.js', 'copias.js', 'nombres.js', 'guias.js', 'guias-requisitos.js',
                  'guias-comunicacion.js', 'campos.js', 'nucleo.js', 'borrados-fusion.js',
                  'hitos-biblioteca.js', 'guias-enganche.js', 'cargar-biblioteca.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { App, Campos, HitosBiblioteca, CargarBiblioteca } = win;

const gestor = dirFalso('_GESTOR');
App.E = {
  gestor: gestor,
  tipos: [{ tipo: 'SANCION', categoria: 'ALUMNADO' }],   /* el tipo "que ya existe" del escenario 2 */
  usuario: 'Francisco'
};
win.Gestor = {
  carpetaGestor: () => gestor,
  tipos: () => App.E.tipos,
  alRefrescar: [],
  recargar: async () => {}
};

/* ---------- el fetch de mentira: una biblioteca pequeña, inventada ---------- */
const BIBLIOTECA_DE_PRUEBA = {
  version: 1,
  tipos: [
    { nombreCorto: 'CORRECCION', nombreLargo: 'Corrección por conducta contraria', categoria: 'ALUMNADO', nuevo: true },
    { nombreCorto: 'SANCION', nombreLargo: 'Medida disciplinaria', categoria: 'ALUMNADO', nuevo: false },
    { nombreCorto: 'EXPULSION', nombreLargo: 'Expulsión ya con guía escrita', categoria: 'ALUMNADO', nuevo: true }
  ],
  camposPorTipo: {
    'Corrección por conducta contraria': [{ nombre: 'Gravedad', clase: 'lista', valores: ['leve', 'grave'] }]
  },
  modelos: [
    { id: 'b1', nombre: 'Audiencia al alumno', titulo: 'Audiencia al alumno', explicacion: 'Antes de imponer nada.',
      responsable: 'Jefatura de Estudios', requisitos: [], comunicacion: null, soloInformativo: true, normativa: [] },
    { id: 'b2', nombre: 'Grabar en Séneca', titulo: 'Grabar en Séneca', explicacion: '',
      responsable: 'Administración', requisitos: [], comunicacion: null, soloInformativo: false, normativa: [] }
  ],
  guiasPorTipo: {
    'Corrección por conducta contraria': ['b1', 'b2'],
    'Medida disciplinaria': ['b1', 'b2'],
    'Expulsión ya con guía escrita': ['b1']
  }
};
win.fetch = async function (url) {
  comprobar('fetch pide el fichero esperado', url, 'datos-biblioteca/biblioteca-centro.json');
  return { ok: true, json: async () => BIBLIOTECA_DE_PRUEBA };
};

/* EXPULSION ya tiene guía escrita A MANO, antes de cargar la biblioteca. */
await (await gestor.getFileHandle('guias.json', { create: true })).createWritable()
  .then((w) => w.write(JSON.stringify({
    'Expulsión ya con guía escrita': [{ id: 'yaEscrito', titulo: 'Paso ya escrito a mano', cuerpo: '', opciones: [] }]
  })));

/* ================= cargar la biblioteca, la primera vez ================= */
console.log('--- cargar la biblioteca, la primera vez ---');
const resumen1 = await CargarBiblioteca.cargar();

comprobar('1. CORRECCION se da de alta', App.E.tipos.some((t) => t.tipo === 'Corrección por conducta contraria'), true);
comprobar('resumen: un tipo nuevo (CORRECCION; EXPULSION se verá en el punto 7)', resumen1.tiposCreados, 2);

comprobar('2. SANCION se renombra, con "SANCION" como nombre corto',
  App.E.tipos.filter((t) => t.tipo === 'Medida disciplinaria').map((t) => t.nombreCorto), ['SANCION']);
comprobar('2. ya no queda ningún tipo llamado "SANCION" a secas',
  App.E.tipos.some((t) => t.tipo === 'SANCION'), false);
comprobar('resumen: un tipo renombrado', resumen1.tiposRenombrados, 1);

const biblioteca1 = await HitosBiblioteca.leer();
comprobar('3. los dos modelos se han creado', biblioteca1.modelos.map((m) => m.id).sort(), ['b1', 'b2']);
comprobar('resumen: dos modelos nuevos', resumen1.modelosCreados, 2);

const guiasEnDisco1 = await win.Carpetas.leerJson(gestor, 'guias.json');
comprobar('4. la guía de CORRECCION se ha escrito, con dos pasos',
  (guiasEnDisco1['Corrección por conducta contraria'] || []).map((p) => p.titulo),
  ['Audiencia al alumno', 'Grabar en Séneca']);
comprobar('4. la guía de SANCION (renombrado) también, con LOS MISMOS modelos (fila 79)',
  (guiasEnDisco1['Medida disciplinaria'] || []).map((p) => p.origenBiblioteca && p.origenBiblioteca.id),
  ['b1', 'b2']);
comprobar('resumen: dos guías escritas (CORRECCION y SANCION; EXPULSION se salta)', resumen1.guiasCreadas, 2);

comprobar('5. el campo "Gravedad" se crea, de lista, con sus valores',
  App.E.campos.propios.filter((p) => p.nombre === 'Gravedad').map((p) => ({ clase: p.clase, valores: p.valores })),
  [{ clase: 'lista', valores: ['leve', 'grave'] }]);
const idGravedad = App.E.campos.propios.filter((p) => p.nombre === 'Gravedad')[0].id;
comprobar('5. el campo queda asignado al tipo CORRECCION',
  (App.E.campos.porTipo['Corrección por conducta contraria'] || []).some((c) => c.id === idGravedad), true);

/* ================= 7. EXPULSION ya tenía guía: no se toca ================= */
console.log('--- 7. un tipo con guía ya escrita a mano no se toca ---');
comprobar('la guía de EXPULSION sigue siendo la escrita a mano, no la de la biblioteca',
  (guiasEnDisco1['Expulsión ya con guía escrita'] || []).map((p) => p.titulo), ['Paso ya escrito a mano']);
comprobar('resumen: EXPULSION sale como saltada', resumen1.guiasSaltadas, ['Expulsión ya con guía escrita']);

/* ================= 6. cargarla otra vez: no duplica nada ================= */
console.log('--- 6. cargar la misma biblioteca otra vez no duplica nada ---');
const totalTiposAntes = App.E.tipos.length;
const resumen2 = await CargarBiblioteca.cargar();

comprobar('no se crea ningún tipo de más', App.E.tipos.length, totalTiposAntes);
comprobar('resumen: nada nuevo que crear ni renombrar', [resumen2.tiposCreados, resumen2.tiposRenombrados], [0, 0]);
comprobar('resumen: ningún modelo nuevo (ya estaban)', resumen2.modelosCreados, 0);
comprobar('resumen: ninguna guía nueva (las tres, saltadas)', resumen2.guiasCreadas, 0);
comprobar('resumen: las tres guías salen como saltadas la segunda vez', resumen2.guiasSaltadas.length, 3);
comprobar('el campo "Gravedad" no se duplica',
  App.E.campos.propios.filter((p) => p.nombre === 'Gravedad').length, 1);

const biblioteca2 = await HitosBiblioteca.leer();
comprobar('la biblioteca sigue con solo los dos modelos, sin duplicar', biblioteca2.modelos.length, 2);

/* ---------- final ---------- */
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
