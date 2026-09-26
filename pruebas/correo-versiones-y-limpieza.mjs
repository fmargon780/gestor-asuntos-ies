/* Prueba de la fila 178 (docs/CORREO-VERSIONES-Y-LIMPIEZA.md).

   Sin navegador, con el disco de mentira en memoria (mismo patrón que
   pruebas/datos-entre-ordenadores.mjs), cargando en un contexto vm:
   util.js, carpetas.js, cola-guardado.js y copias.js para los puntos 3
   y 5; correo-enviar.js, aparte, para el punto 2.

   Comprueba, como pide el documento:

   1. Copias.guardar sobre un fichero con _esquema mayor que el de la
      app lanza EsquemaMasNuevo y no escribe; sobre uno sin _esquema
      (o con uno igual o menor) escribe y lo añade.
   2. Una copia del día que no se puede releer como JSON (ni
      reintentando) hace que Copias.guardar no toque el original.
   3. Una respuesta del script con `version` más vieja que
      `CorreoEnviar.SCRIPT_ESPERADO` deja el aviso ámbar; con la misma
      versión, no hay aviso. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

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

/* ---------- 1 y 2: Copias.guardar, con el disco de mentira ---------- */
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
    getElementById: elementoPara, querySelector() { return null; }, querySelectorAll() { return []; },
    createElement: elementoFalso, addEventListener() {}, readyState: 'complete'
  }
};
contexto.window = contexto;
contexto.addEventListener = function () {};
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'carpetas.js', 'cola-guardado.js', 'copias.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Carpetas, Copias, U } = contexto;
const avisos = [];
U.aviso = function (texto, clase) { avisos.push({ texto, clase }); };

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
    size: new TextEncoder().encode(f._texto).length, lastModified: f._modificado, _texto: f._texto
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
/* Un fichero que nunca se deja escribir de verdad (simula un disco que
   se estropea a media escritura): escribir en él no cambia su
   contenido, que se queda siempre ilegible como JSON. */
function ficheroSiempreRoto(nombre) {
  const f = ficheroFalso(nombre, '{esto no es json');
  f.createWritable = async () => ({ async write() { /* no llega a escribir de verdad */ }, async close() {} });
  return f;
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

console.log('--- 1. _esquema: se lanza EsquemaMasNuevo si el disco trae uno mayor ---');
{
  const gestor = dirFalso('_GESTOR');
  await Copias.guardar(gestor, 'grupos.json', { grupos: [{ id: 'g1' }] });
  comprobar('1a. sin _esquema de partida, se escribe con el de la app',
    await leerJsonDeVerdad(gestor, 'grupos.json'), { grupos: [{ id: 'g1' }], _esquema: Copias.ESQUEMA });

  await Copias.guardar(gestor, 'grupos.json', { grupos: [{ id: 'g1' }, { id: 'g2' }] });
  comprobar('1b. un segundo guardado (mismo _esquema o menor) escribe normal',
    await leerJsonDeVerdad(gestor, 'grupos.json'), { grupos: [{ id: 'g1' }, { id: 'g2' }], _esquema: Copias.ESQUEMA });

  /* El otro ordenador tiene una versión más nueva de la app, que ya
     migró el formato: su _esquema es mayor que el de esta sesión. */
  const disco = await leerJsonDeVerdad(gestor, 'grupos.json');
  disco._esquema = Copias.ESQUEMA + 1;
  await escribirDeVerdad(gestor, 'grupos.json', JSON.stringify(disco));

  let error = '';
  try { await Copias.guardar(gestor, 'grupos.json', { grupos: [{ id: 'g1' }, { id: 'g3' }] }); }
  catch (e) { error = e.name; }
  comprobar('1c. con un _esquema mayor en disco, Copias.guardar lanza EsquemaMasNuevo', error, 'EsquemaMasNuevo');
  comprobar('1d. y no ha escrito nada encima: el disco se queda como estaba',
    await leerJsonDeVerdad(gestor, 'grupos.json'), disco);
  comprobar('1e. avisa en rojo de que hay una versión más nueva en el otro ordenador',
    avisos.some((a) => a.clase === 'malo' && a.texto.indexOf('versión más nueva') !== -1), true);
}

console.log('--- 2. una copia que no se puede releer no toca el original ---');
{
  const gestor = dirFalso('_GESTOR');
  await escribirDeVerdad(gestor, 'campos.json', JSON.stringify({ campos: { uno: 1 } }));

  const carpetaCopias = await gestor.getDirectoryHandle('copias', { create: true });
  const getFileHandleDeVerdad = carpetaCopias.getFileHandle.bind(carpetaCopias);
  carpetaCopias.getFileHandle = async function (n, o) {
    if (o && o.create && !carpetaCopias._hijos.has(n)) {
      const roto = ficheroSiempreRoto(n);
      carpetaCopias._hijos.set(n, roto);
      return roto;
    }
    return getFileHandleDeVerdad(n, o);
  };

  let error = '';
  avisos.length = 0;
  try { await Copias.guardar(gestor, 'campos.json', { campos: { uno: 1, dos: 2 } }); }
  catch (e) { error = e.name; }
  comprobar('2a. la copia que no se puede releer lanza CopiaNoVerificada', error, 'CopiaNoVerificada');
  comprobar('2b. el original no se ha tocado: sigue con el contenido de antes',
    await leerJsonDeVerdad(gestor, 'campos.json'), { campos: { uno: 1 } });
  comprobar('2c. avisa de que la copia de seguridad no se ha escrito bien',
    avisos.some((a) => a.clase === 'malo' && a.texto.indexOf('copia de seguridad no se ha escrito bien') !== -1), true);
}

/* ---------- 3. CorreoEnviar compara la versión del script ---------- */
console.log('--- 3. el aviso ámbar del script viejo ---');
{
  const ctx2 = {
    console,
    window: {}, localStorage: { getItem() { return null; }, setItem() {} },
    document: {
      getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}
    }
  };
  ctx2.window = ctx2;
  vm.createContext(ctx2);
  vm.runInContext(fs.readFileSync(raiz + 'correo-enviar.js', 'utf8'), ctx2, { filename: 'correo-enviar.js' });
  const CorreoEnviar = ctx2.CorreoEnviar;

  comprobar('3a. sin ninguna respuesta todavía, sin aviso', CorreoEnviar.avisoScriptViejo(), null);

  const filaEsperada = parseInt(/fila\s+(\d+)/.exec(CorreoEnviar.SCRIPT_ESPERADO)[1], 10);
  CorreoEnviar._comprobarVersionScript({ version: '01-ene-2026 · fila ' + (filaEsperada - 1) });
  comprobar('3b. con una versión más vieja, hay aviso y dice cuál hace falta',
    typeof CorreoEnviar.avisoScriptViejo() === 'string' &&
    CorreoEnviar.avisoScriptViejo().indexOf(CorreoEnviar.SCRIPT_ESPERADO) !== -1, true);

  CorreoEnviar._comprobarVersionScript({ version: CorreoEnviar.SCRIPT_ESPERADO });
  comprobar('3c. con la misma versión, ya no hay aviso', CorreoEnviar.avisoScriptViejo(), null);

  CorreoEnviar._comprobarVersionScript({ version: '01-ene-2099 · fila ' + (filaEsperada + 1) });
  comprobar('3d. con una versión más nueva, tampoco hay aviso', CorreoEnviar.avisoScriptViejo(), null);
}

console.log('');
if (fallos) {
  console.log(fallos + ' prueba(s) fallada(s) en correo-versiones-y-limpieza.mjs.');
  process.exit(1);
} else {
  console.log('Todo bien');
}
