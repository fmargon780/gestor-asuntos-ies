/* Prueba de lógica (jsdom, sin navegador de verdad) de "Unir dos tipos
   de asunto en uno" (27-sep-2026, fila 207, docs/UNIR-DOS-TIPOS.md).

   Mismo patrón que pruebas/cargar-biblioteca.mjs: un disco de mentira
   en memoria (ASUNTOS ABIERTOS con _GESTOR dentro, y ARCHIVO aparte),
   cargando solo los ficheros de js/ que hacen falta para la lógica de
   `TiposUnir.unir`, sin index.html ni un navegador de verdad.

   Datos: dos tipos «A» y «A BIS», cada uno con guía, un campo propio
   distinto y uno repetido (mismo nombre, campo distinto por debajo),
   una plantilla y un recurrente de «A BIS»; dos asuntos abiertos de
   «A BIS» (uno con hitos ya avanzados) y uno archivado. «A BIS» es
   reservado; «A» no. Se une «A BIS» en «A» y se comprueba la tabla
   entera del encargo. */
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

/* ---------- disco de mentira (igual que pruebas/cargar-biblioteca.mjs) ---------- */
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
      return {
        async arrayBuffer() { return new TextEncoder().encode(self._texto).buffer; },
        size: new TextEncoder().encode(self._texto).length,
        _texto: self._texto
      };
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

for (const f of [
  'util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js',
  'carpetas.js', 'copias.js', 'nombres.js', 'campos.js', 'nucleo.js', 'borrados-fusion.js',
  'asuntos-editar.js', 'guias-enganche.js', 'hitos.js', 'hitos-sincronizar.js',
  'asunto-renombrar.js', 'plantillas.js', 'papelera.js', 'estado-hito.js',
  'tipos-nombre.js', 'tipos-unir.js'
]) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { App, Campos, Carpetas, Nombres, Hitos, GuiasDelCentro, Papelera, Borrados, TiposUnir } = win;

/* ---------- el disco: ASUNTOS ABIERTOS (con _GESTOR dentro) y ARCHIVO ---------- */
const abiertos = dirFalso('ASUNTOS ABIERTOS');
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
const archivo = dirFalso('ARCHIVO');

/* ---------- los dos tipos ---------- */
const tipoA = { tipo: 'A', categoria: 'OTROS', palabrasClave: ['general'] };
const tipoABis = { tipo: 'A BIS', categoria: 'OTROS', reservado: true, palabrasClave: ['bis', 'especial'] };

Object.assign(App.E, {
  gestor, abiertos, archivo,
  tipos: [tipoA, tipoABis],
  campos: { propios: [], porTipo: {} },
  registro: { asuntos: {} },
  listaAbiertos: [],
  listaArchivo: [],
  usuario: 'Francisco'
});
App.tipoDeAsunto = function (a) { return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || 'Sin tipo'; };

win.Gestor = {
  carpetaGestor: () => gestor,
  tipos: () => App.E.tipos,
  usuario: () => App.E.usuario,
  asuntos: () => App.E.listaAbiertos.slice(),
  alRefrescar: [],
  recargar: async () => {}
};

/* ---------- guías, campos, plantilla y recurrente de partida ---------- */
const GUIA_A = [
  { id: 'a1', titulo: 'Paso A1', cuerpo: '', opciones: [] },
  { id: 'a2', titulo: 'Paso A2', cuerpo: '', opciones: [] }
];
const GUIA_A_BIS = [
  { id: 'b1', titulo: 'Paso B1', cuerpo: '', opciones: [] },
  { id: 'b2', titulo: 'Paso B2', cuerpo: '', opciones: [] }
];
await Carpetas.guardarJson(gestor, 'guias.json', { A: GUIA_A, 'A BIS': GUIA_A_BIS });

await Carpetas.guardarJson(gestor, 'campos.json', {
  propios: [
    { id: 'campoA', nombre: 'Campo de A', clase: 'texto' },
    { id: 'campoBis', nombre: 'Campo de A BIS', clase: 'texto' },
    { id: 'comunA', nombre: 'Común', clase: 'texto' },
    { id: 'comunBis', nombre: 'Común', clase: 'texto' }
  ],
  calculados: [],
  porTipo: {
    A: [
      { origen: 'propio', id: 'campoA', obligatorio: false, enNombre: false },
      { origen: 'propio', id: 'comunA', obligatorio: false, enNombre: false }
    ],
    'A BIS': [
      { origen: 'propio', id: 'campoBis', obligatorio: false, enNombre: false },
      { origen: 'propio', id: 'comunBis', obligatorio: false, enNombre: false }
    ]
  }
});
App.E.campos = await Campos.leer(gestor);

await Carpetas.guardarJson(gestor, 'plantillas.json', {
  lista: [{ id: 'pl1', tipo: 'A BIS', asunto: 'Asunto de A BIS', cuerpo: 'Cuerpo de la plantilla' }],
  documentos: []
});

await Carpetas.guardarJson(gestor, 'recurrentes.json', [
  { id: 'r1', tipo: 'A BIS', cada: 'curso', dia: 1 }
]);

/* ---------- dos asuntos abiertos de A BIS ---------- */
const nombre1 = Nombres.montar({ fecha: '2026-09-01', tipo: 'A BIS', tercero: 'Uno, Ana 1111111' });
const nombre2 = Nombres.montar({ fecha: '2026-09-02', tipo: 'A BIS', tercero: 'Dos, Berta 2222222' });
const ficha1 = { tipo: 'A BIS', categoria: 'OTROS', tercero: 'Uno, Ana 1111111', abiertoPor: 'Francisco' };
const ficha2 = { tipo: 'A BIS', categoria: 'OTROS', tercero: 'Dos, Berta 2222222', abiertoPor: 'Francisco' };

await abiertos.getDirectoryHandle(nombre1, { create: true });
await abiertos.getDirectoryHandle(nombre2, { create: true });
await Carpetas.guardarJson(gestor, 'asuntos.json', { asuntos: { [nombre1]: ficha1, [nombre2]: ficha2 } });
App.E.registro = { asuntos: { [nombre1]: ficha1, [nombre2]: ficha2 } };
App.E.asuntosEnDisco = 2;

App.E.listaAbiertos = [
  { nombre: nombre1, leido: Nombres.leer(nombre1, App.E.tipos), ficha: ficha1 },
  { nombre: nombre2, leido: Nombres.leer(nombre2, App.E.tipos), ficha: ficha2 }
];

/* El segundo, con hitos ya avanzados (uno hecho, otro en curso). */
await Carpetas.guardarJson(gestor, 'hitos.json', {
  ajustes: { responsables: [], noLectivos: [], festivos: [] },
  porAsunto: {
    [nombre1]: {
      creados: '2026-09-01T00:00:00.000Z',
      hitos: [
        { id: 'h1', origenGuia: 'b1', titulo: 'Paso B1', clase: 'paso', estado: 'pendiente' },
        { id: 'h2', origenGuia: 'b2', titulo: 'Paso B2', clase: 'paso', estado: 'pendiente' }
      ]
    },
    [nombre2]: {
      creados: '2026-09-02T00:00:00.000Z',
      hitos: [
        { id: 'h3', origenGuia: 'b1', titulo: 'Paso B1', clase: 'paso', estado: 'hecho' },
        { id: 'h4', origenGuia: 'b2', titulo: 'Paso B2', clase: 'paso', estado: 'encurso' }
      ]
    }
  }
});

/* ---------- un asunto archivado de A BIS, que no se debe tocar ---------- */
const nombreArchivado = '250101 A BIS Tres, Carlos 3333333';
await archivo.getDirectoryHandle(nombreArchivado, { create: true });

/* ================= UNIR «A BIS» EN «A» ================= */
console.log('--- unir «A BIS» en «A» ---');
const resultado = await TiposUnir.unir(tipoABis, tipoA);
comprobar('los dos asuntos pasan sin saltarse ninguno', resultado.asuntos, { pasados: 2, saltados: [] });

/* ---------- 1. tipos, alias y lápida ---------- */
console.log('--- 1. tipos, alias y lápida ---');
comprobar('«A BIS» ya no está en los tipos', App.E.tipos.some((t) => t.tipo === 'A BIS'), false);
comprobar('«A» lleva «A BIS» como alias', tipoA.alias, ['A BIS']);
comprobar('«A BIS» tiene lápida', await Borrados.estaCerrada(gestor, 'tipos', 'A BIS'), true);
const tiposDisco = await Carpetas.leerJson(gestor, 'tipos.json');
comprobar('en disco tampoco está «A BIS»', tiposDisco.some((t) => t.tipo === 'A BIS'), false);
comprobar('en disco «A» lleva el alias', (tiposDisco.find((t) => t.tipo === 'A') || {}).alias, ['A BIS']);
comprobar('las palabras clave se han sumado, sin repetir',
  (tiposDisco.find((t) => t.tipo === 'A') || {}).palabrasClave, ['general', 'bis', 'especial']);

/* ---------- 2. guía ---------- */
console.log('--- 2. guía ---');
const guiasDisco = await Carpetas.leerJson(gestor, 'guias.json');
comprobar('la guía de «A» no ha cambiado', guiasDisco.A, GUIA_A);
comprobar('«A BIS» ya no tiene guía', guiasDisco['A BIS'], undefined);
const papel = await Papelera.leer();
comprobar('la guía de «A BIS» está en la papelera',
  papel.some((x) => x.clase === 'guia' && x.nombre === 'A BIS' &&
    JSON.stringify(x.datos.pasos) === JSON.stringify(GUIA_A_BIS)), true);

/* ---------- 3. campos ---------- */
console.log('--- 3. campos ---');
const camposDisco = await Campos.leer(gestor);
comprobar('los campos de «A» son los suyos más el distinto de «A BIS», sin repetir el común',
  (camposDisco.porTipo.A || []).map((c) => Campos.nombreDeCampo(c, camposDisco)),
  ['Campo de A', 'Común', 'Campo de A BIS']);
comprobar('«A BIS» se ha quedado sin campos propios', camposDisco.porTipo['A BIS'], undefined);

/* ---------- 4. plantilla y recurrente ---------- */
console.log('--- 4. plantilla y recurrente ---');
const plantillasDisco = await Carpetas.leerJson(gestor, 'plantillas.json');
comprobar('la plantilla dice «A»', plantillasDisco.lista[0].tipo, 'A');
const recurrentesDisco = await Carpetas.leerJson(gestor, 'recurrentes.json');
comprobar('el recurrente dice «A»', recurrentesDisco[0].tipo, 'A');

/* ---------- 5. las dos carpetas abiertas ---------- */
console.log('--- 5. las carpetas abiertas, ya con «A», con los mismos hitos ---');
const nombre1Nuevo = Nombres.montar({ fecha: '2026-09-01', tipo: 'A', tercero: 'Uno, Ana 1111111' });
const nombre2Nuevo = Nombres.montar({ fecha: '2026-09-02', tipo: 'A', tercero: 'Dos, Berta 2222222' });
comprobar('la carpeta 1 ya se llama con «A»', await Carpetas.existe(abiertos, nombre1Nuevo), true);
comprobar('la carpeta 1 vieja ya no existe', await Carpetas.existe(abiertos, nombre1), false);
comprobar('la carpeta 2 ya se llama con «A»', await Carpetas.existe(abiertos, nombre2Nuevo), true);

const hitosDisco = await Hitos.leer();
comprobar('el asunto 1 conserva sus dos hitos, pendientes, sin pasos de la guía de «A»',
  hitosDisco.porAsunto[nombre1Nuevo].hitos.map((h) => ({ origenGuia: h.origenGuia, estado: h.estado })),
  [{ origenGuia: 'b1', estado: 'pendiente' }, { origenGuia: 'b2', estado: 'pendiente' }]);
comprobar('el asunto 2 conserva sus hitos ya avanzados (hecho / en curso)',
  hitosDisco.porAsunto[nombre2Nuevo].hitos.map((h) => ({ origenGuia: h.origenGuia, estado: h.estado })),
  [{ origenGuia: 'b1', estado: 'hecho' }, { origenGuia: 'b2', estado: 'encurso' }]);

comprobar('la ficha del asunto 1 ya es de tipo «A», marcado tipoUnidoDe',
  { tipo: App.E.registro.asuntos[nombre1Nuevo].tipo, tipoUnidoDe: App.E.registro.asuntos[nombre1Nuevo].tipoUnidoDe },
  { tipo: 'A', tipoUnidoDe: 'A BIS' });

/* ---------- 7. reservado uno a uno ---------- */
console.log('--- 7. «A BIS» era reservado y «A» no: los dos pasan reservados uno a uno ---');
comprobar('el asunto 1 queda reservado', App.E.registro.asuntos[nombre1Nuevo].reservado, true);
comprobar('el asunto 2 queda reservado', App.E.registro.asuntos[nombre2Nuevo].reservado, true);
comprobar('el tipo «A» sigue sin ser reservado (la marca es del asunto, no del tipo)', !!tipoA.reservado, false);

/* ---------- 6. el archivo no se toca ---------- */
console.log('--- 6. el ARCHIVO no se toca ---');
comprobar('la carpeta archivada sigue llamándose igual', await Carpetas.existe(archivo, nombreArchivado), true);

/* ---------- los hitos nuevos de la guía de «A» no llegan a los recién unidos ---------- */
console.log('--- la guía nueva de «A» no llega a los asuntos recién unidos ---');
/* Simula lo que hace App.verAbiertos tras el repintado: los dos asuntos
   ya con su nombre y su tipo nuevos. */
App.E.listaAbiertos = [
  { nombre: nombre1Nuevo, leido: Nombres.leer(nombre1Nuevo, App.E.tipos), ficha: App.E.registro.asuntos[nombre1Nuevo] },
  { nombre: nombre2Nuevo, leido: Nombres.leer(nombre2Nuevo, App.E.tipos), ficha: App.E.registro.asuntos[nombre2Nuevo] }
];
const antesDeGuiaNueva = (await Hitos.leer()).porAsunto[nombre1Nuevo].hitos.length;
const llegados = await Hitos.llevarGuiaAAbiertos('A', GUIA_A.concat([{ id: 'a3', titulo: 'Paso A3 nuevo', cuerpo: '', opciones: [] }]));
comprobar('no llega a ningún asunto (los dos llevan tipoUnidoDe)', llegados, 0);
const despuesDeGuiaNueva = (await Hitos.leer()).porAsunto[nombre1Nuevo].hitos.length;
comprobar('el asunto 1 sigue con el mismo número de hitos', despuesDeGuiaNueva, antesDeGuiaNueva);

/* ---------- final ---------- */
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
