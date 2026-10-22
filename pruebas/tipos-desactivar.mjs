/* Prueba de la fila 422 (docs/DESACTIVAR-UN-TIPO.md): desactivar y activar un tipo de asunto.

   Sin navegador, con el disco de mentira en memoria (mismo montaje que pruebas/recurrentes.mjs).
   Datos inventados. Comprueba: el tipo desactivado no se ofrece (`App.tiposParaElegir`), la pregunta
   de «Desactivar» (cuántos asuntos abiertos y cuántos se repiten), que se guarda en tipos.json, que su
   recurrencia no crea nada mientras esté apagado, que al activarlo no crea ninguno ese día y sí en la
   siguiente fecha, y que el «Parado» de cada asunto que se repite se conserva. */
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

/* localStorage de mentira: lo bastante para getItem/setItem, que es
   todo lo que usan avisos.js y recurrentes.js. */
function almacenFalso() {
  const datos = new Map();
  return {
    getItem(k) { return datos.has(k) ? datos.get(k) : null; },
    setItem(k, v) { datos.set(k, String(v)); },
    removeItem(k) { datos.delete(k); }
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
contexto.localStorage = almacenFalso();
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'nucleo.js', 'borrados-fusion.js', 'nombres.js', 'numeros.js', 'plazos.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, Carpetas } = contexto;

contexto.Gestor = {
  carpetaGestor: function () { return App.E.gestor; },
  carpetaAbiertos: function () { return App.E.abiertos; },
  usuario: function () { return App.E.usuario; },
  anotar: function (nombre, datos) { return App.anotar(nombre, datos); },
  recargar: async function () {},
  alRefrescar: []
};
vm.runInContext(fs.readFileSync(raiz + 'recurrentes.js', 'utf8'), contexto, { filename: 'recurrentes.js' });
vm.runInContext(fs.readFileSync(raiz + 'tipos-desactivar.js', 'utf8'), contexto, { filename: 'tipos-desactivar.js' });
const { Recurrentes, TiposDesactivar } = contexto;

contexto.U.aviso = function () {};

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

/* ---------- el disco: abiertos y _GESTOR ---------- */
const abiertos = dirFalso('abiertos');
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
App.E.abiertos = abiertos;
App.E.archivo = dirFalso('archivo');
App.E.gestor = gestor;
App.E.usuario = 'Francisco';
App.E.tipos = [];


const hoyDate = new Date();
const dia = hoyDate.getDate() > 28 ? 28 : hoyDate.getDate();
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const hoy = iso(hoyDate);

App.E.tipos = [
  { tipo: 'SANCION ALUMNADO', categoria: 'ALUMNADO' },
  { tipo: 'BAJA MEDICA', categoria: 'PERSONAL' },
  { tipo: 'FACTURA', categoria: 'EMPRESAS' }
];
await Carpetas.escribirTexto(gestor, 'tipos.json', JSON.stringify(App.E.tipos));
App.E.listaAbiertos = [
  { nombre: 'a1', ficha: { tipo: 'FACTURA' } }, { nombre: 'a2', leido: { tipo: 'FACTURA' } },
  { nombre: 'a3', ficha: { tipo: 'FACTURA' } }, { nombre: 'a4', ficha: { tipo: 'BAJA MEDICA' } }
];
/* Dos asuntos que se repiten de FACTURA (uno ya «Parado»), vencidos hace tiempo; uno de BAJA MEDICA. */
await Carpetas.escribirTexto(gestor, 'recurrentes.json', JSON.stringify([
  { id: 'r1', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Proveedor Uno, SL', periodo: 'mensual', dia: dia, ultima: '2020-01-10', parado: false },
  { id: 'r2', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Proveedor Dos, SL', periodo: 'mensual', dia: dia, ultima: '2020-01-10', parado: true },
  { id: 'r3', tipo: 'BAJA MEDICA', categoria: 'PERSONAL', tercero: 'Persona Tres', periodo: 'mensual', dia: dia, ultima: '2020-01-10', parado: false }
]));
await Recurrentes._cargar();

console.log('--- 1. los tipos para elegir ---');
comprobar('sin desactivar, salen los tres', App.tiposParaElegir().map((t) => t.tipo), ['SANCION ALUMNADO', 'BAJA MEDICA', 'FACTURA']);
comprobar('antes de desactivar, FACTURA toca y BAJA MEDICA toca', Recurrentes._pendientes().map((r) => r.id), ['r1', 'r3']);

console.log('--- 2. desactivar pregunta antes ---');
const preguntas = [];
let respuesta = false;
contexto.U.preguntar = async function (titulo, cuerpo, aceptar) { preguntas.push({ titulo, cuerpo, aceptar }); return respuesta; };
const factura = App.E.tipos[2];
comprobar('«Cancelar»: no cambia nada', [await TiposDesactivar.desactivar(factura), !!factura.desactivado], [false, false]);
comprobar('la pregunta dice 3 asuntos abiertos, que siguen igual, y 1 que se repite que se para',
  [preguntas.length, /Hay 3 asuntos abiertos de <strong>FACTURA<\/strong>\. Seguirán igual/.test(preguntas[0].cuerpo),
   /Se pararán sus 1 asunto que se repite/.test(preguntas[0].cuerpo), preguntas[0].aceptar],
  [1, true, true, 'Desactivar']);
const sinAbiertos = App.E.tipos[0];
await TiposDesactivar.desactivar(sinAbiertos);
comprobar('sin asuntos abiertos, también lo dice', /No hay ningún asunto abierto de/.test(preguntas[1].cuerpo), true);
respuesta = true;
comprobar('«Desactivar»: se desactiva', [await TiposDesactivar.desactivar(factura), factura.desactivado], [true, true]);
const enDisco = JSON.parse(await Carpetas.leerTexto(gestor, 'tipos.json'));
comprobar('queda guardado en tipos.json; el resto de tipos no lleva el dato',
  enDisco.map((t) => t.tipo + ':' + (t.desactivado ? 'apagado' : 'activo')).sort(),
  ['BAJA MEDICA:activo', 'FACTURA:apagado', 'SANCION ALUMNADO:activo']);
comprobar('ya no se ofrece para elegir', App.tiposParaElegir().map((t) => t.tipo).sort(), ['BAJA MEDICA', 'SANCION ALUMNADO']);

console.log('--- 3. su recurrencia se para ---');
comprobar('FACTURA no toca aunque esté vencido; BAJA MEDICA sigue tocando', Recurrentes._pendientes().map((r) => r.id), ['r3']);
await Recurrentes._crearLosQueTocan();
comprobar('no se crea ninguna carpeta de FACTURA', (await Carpetas.subcarpetas(abiertos)).filter((c) => /FACTURA/.test(c.nombre)).length, 0);

console.log('--- 4. activar: espera a la siguiente fecha ---');
comprobar('«Activar» no pregunta', [await TiposDesactivar.activar(factura), preguntas.length, factura.desactivado], [true, 3, undefined]);
comprobar('tras activar, FACTURA no toca ese día', Recurrentes._pendientes().map((r) => r.id).includes('r1'), false);
const r1 = JSON.parse(await Carpetas.leerTexto(gestor, 'recurrentes.json')).filter((r) => r.id === 'r1')[0];
comprobar('apunta el día en que se activó', r1.noAntesDe, hoy);
const siguiente = Recurrentes._proxima(r1);
comprobar('la siguiente fecha es posterior a hoy y cae en el día del mes pedido', [iso(siguiente) > hoy, siguiente.getDate()], [true, dia]);
comprobar('y es dentro de un mes como mucho', iso(siguiente) <= iso(new Date(hoyDate.getFullYear(), hoyDate.getMonth() + 2, 1)), true);
const r1Antiguo = Object.assign({}, r1, { noAntesDe: iso(new Date(hoyDate.getFullYear(), hoyDate.getMonth(), hoyDate.getDate() - 70)) });
comprobar('si se activó hace mucho, vuelve a tocar con normalidad (no queda parado para siempre)',
  Recurrentes._proxima(r1Antiguo) <= hoyDate, true);

console.log('--- 5. el «Parado» de cada uno se conserva ---');
const r2 = JSON.parse(await Carpetas.leerTexto(gestor, 'recurrentes.json')).filter((r) => r.id === 'r2')[0];
comprobar('el que estaba Parado sigue Parado, y el otro Activo', [r2.parado, r1.parado], [true, false]);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
