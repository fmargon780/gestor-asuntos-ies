/* Prueba de la fila 32 (docs/ARCHIVAR-CARPETA-YA-EXISTE.md): que una
   copia fallida no deje el destino a medias, y que `Carpetas.fusionarEn`
   junte dos carpetas sin perder nada. Con un disco de mentira en
   memoria, sin navegador, como pruebas/logica.mjs. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, TextDecoder, Blob, window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(raiz + 'carpetas.js', 'utf8'), contexto, { filename: 'carpetas.js' });
const { Carpetas } = contexto;

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
      const x = hijos.get(n);
      if (x.kind !== 'file') throw new Error('no es fichero');
      return x;
    },
    async removeEntry(n) {
      if (!hijos.has(n)) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
      hijos.delete(n);
    },
    async *entries() { for (const pareja of hijos) yield pareja; }
  };
}
function ficheroFalso(nombre, texto, romperLectura) {
  return {
    kind: 'file', name: nombre, _texto: texto, _romperLectura: !!romperLectura,
    async getFile() {
      if (this._romperLectura) throw new Error('disco ocupado (de mentira, para la prueba)');
      const self = this;
      return {
        async arrayBuffer() { return new TextEncoder().encode(self._texto).buffer; },
        size: new TextEncoder().encode(self._texto).length,
        _texto: self._texto, name: nombre
      };
    },
    async createWritable() {
      const self = this;
      return {
        async write(cosa) {
          if (typeof cosa === 'string') self._texto = cosa;
          else if (cosa && cosa._texto !== undefined) self._texto = cosa._texto;
        },
        async close() {}
      };
    }
  };
}

async function crearFichero(dir, nombre, texto, romperLectura) {
  const h = ficheroFalso(nombre, texto, romperLectura);
  dir._hijos.set(nombre, h);
  return h;
}
async function nombresDentro(dir) {
  const l = [];
  for await (const [n] of dir.entries()) l.push(n);
  return l.sort();
}
async function textoDe(dir, nombre) {
  const f = await (await dir.getFileHandle(nombre)).getFile();
  return f._texto;
}
async function existeFichero(dir, nombre) {
  return dir._hijos.has(nombre) && dir._hijos.get(nombre).kind === 'file';
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- 1. destino libre: se archiva como siempre ---------- */
{
  const abiertos = dirFalso('abiertos');
  const archivo = dirFalso('archivo');
  const carpeta = await abiertos.getDirectoryHandle('Un asunto', { create: true });
  await crearFichero(carpeta, 'papel.txt', 'hola');

  const n = await Carpetas.trasladar(abiertos, 'Un asunto', archivo, 'Un asunto');
  comprobar('1. destino libre: cuenta un fichero', n, 1);
  comprobar('1. el origen ha desaparecido', await nombresDentro(abiertos), []);
  comprobar('1. el destino tiene la carpeta', await nombresDentro(archivo), ['Un asunto']);
}

/* ---------- preparación común para fusionarEn ---------- */
async function unaFusion() {
  const abiertos = dirFalso('abiertos');
  const origen = await abiertos.getDirectoryHandle('Asunto', { create: true });
  await crearFichero(origen, 'nuevo.txt', 'es nuevo, solo está en origen');
  await crearFichero(origen, 'igual.txt', 'igual en los dos');
  await crearFichero(origen, 'distinto.txt', 'contenido de origen, más largo que el otro');
  const subOrigen = await origen.getDirectoryHandle('sub', { create: true });
  await crearFichero(subOrigen, 'dentro.txt', 'dentro de la subcarpeta');

  const archivo = dirFalso('archivo');
  const destino = await archivo.getDirectoryHandle('Asunto', { create: true });
  await crearFichero(destino, 'igual.txt', 'igual en los dos');
  await crearFichero(destino, 'distinto.txt', 'otro contenido');

  return { abiertos, archivo, destino };
}

/* ---------- 2 a 5, con una sola fusión: mismo nombre y mismo tamaño,
   mismo nombre y distinto tamaño, fichero solo en origen, y subcarpetas ---------- */
{
  const { abiertos, archivo, destino } = await unaFusion();
  const r = await Carpetas.fusionarEn(abiertos, 'Asunto', archivo, 'Asunto');

  comprobar('2/3/4/5. el origen ha desaparecido', await nombresDentro(abiertos), []);
  comprobar('4. "igual.txt" no se duplica (mismo tamaño)', await nombresDentro(destino),
    ['distinto (2).txt', 'distinto.txt', 'igual.txt', 'nuevo.txt', 'sub'].sort());
  comprobar('3. "igual.txt" se queda con el texto que ya tenía el destino',
    await textoDe(destino, 'igual.txt'), 'igual en los dos');
  comprobar('4. "distinto.txt" del destino no se toca',
    await textoDe(destino, 'distinto.txt'), 'otro contenido');
  comprobar('4. el de origen se guarda con "(2)" antes de la extensión',
    await textoDe(destino, 'distinto (2).txt'), 'contenido de origen, más largo que el otro');
  comprobar('2b. el fichero que solo estaba en origen se copia',
    await textoDe(destino, 'nuevo.txt'), 'es nuevo, solo está en origen');
  comprobar('5. la subcarpeta se ha fusionado también',
    await textoDe(await destino.getDirectoryHandle('sub'), 'dentro.txt'), 'dentro de la subcarpeta');
  comprobar('resultado: cuenta bien lo copiado, lo que ya estaba y los sufijos',
    { copiados: r.copiados, yaEstaban: r.yaEstaban, conSufijo: r.conSufijo },
    { copiados: 2, yaEstaban: 1, conSufijo: ['distinto (2).txt'] });
}

/* ---------- 6. la copia falla a mitad: no se pierde nada, y el destino
   no se queda a medias ---------- */
{
  const abiertos = dirFalso('abiertos');
  const archivo = dirFalso('archivo');
  const origen = await abiertos.getDirectoryHandle('Otro asunto', { create: true });
  await crearFichero(origen, 'uno.txt', 'primero');
  await crearFichero(origen, 'dos.txt', 'segundo, este no se puede leer', true);

  let error = null;
  try { await Carpetas.trasladar(abiertos, 'Otro asunto', archivo, 'Otro asunto'); }
  catch (e) { error = e; }

  comprobar('6. trasladar lanza el error de la lectura rota', !!error, true);
  comprobar('6. el origen sigue entero, con sus dos ficheros',
    await nombresDentro(origen), ['dos.txt', 'uno.txt']);
  comprobar('6. el destino no se ha quedado a medias: no existe',
    await Carpetas.existe(archivo, 'Otro asunto'), false);
}

/* ---------- 7. la comprobación final falla: no se borra nada del origen ---------- */
{
  const abiertos = dirFalso('abiertos');
  const origen = await abiertos.getDirectoryHandle('Tercer asunto', { create: true });
  await crearFichero(origen, 'papel.txt', 'un papel');

  const archivo = dirFalso('archivo');
  const destino = await archivo.getDirectoryHandle('Tercer asunto', { create: true });

  /* Se simula que la escritura en destino se corta a mitad, como si
     Dropbox hubiera perdido bytes al sincronizar: llega un fichero,
     pero con menos peso del que tenía el de origen. */
  const escrituraOriginal = destino.getFileHandle.bind(destino);
  destino.getFileHandle = async function (n, o) {
    const h = await escrituraOriginal(n, o);
    if (n === 'papel.txt' && o && o.create) {
      const creaOriginal = h.createWritable.bind(h);
      h.createWritable = async function () {
        const w = await creaOriginal();
        return { async write() { await w.write('x'); }, async close() { await w.close(); } };
      };
    }
    return h;
  };

  let error = null;
  try { await Carpetas.fusionarEn(abiertos, 'Tercer asunto', archivo, 'Tercer asunto'); }
  catch (e) { error = e; }

  comprobar('7. fusionarEn avisa de que la comprobación ha fallado', !!error, true);
  comprobar('7. el origen no se ha tocado', await nombresDentro(origen), ['papel.txt']);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
