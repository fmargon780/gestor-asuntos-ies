/* Prueba de js/usuarios.js (19-sep-2026, fila 72,
   docs/DETALLES-DE-MANTENIMIENTO.md, punto 2), sin navegador, con un
   disco de mentira en memoria: mismo estilo que pruebas/logica.mjs.

   Lo que hace falta el navegador de verdad (el desplegable de la
   pantalla de entrada, con "Otro…") se comprueba a mano, como pide el
   propio encargo (punto 6: "los puntos 2 y 5, a mano"). */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, TextDecoder, Blob, window: {}, indexedDB: null };
vm.createContext(contexto);
for (const f of ['util.js', 'carpetas.js', 'copias.js', 'usuarios.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Usuarios, Carpetas } = contexto;

/* ---------- disco de mentira, igual que en pruebas/logica.mjs ---------- */
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
    }
  };
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const raizFalsa = dirFalso('Dropbox');
const abiertos = await raizFalsa.getDirectoryHandle('ASUNTOS ABIERTOS', { create: true });
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });

comprobar('la primera vez (fichero que no existe) la lista está vacía',
  await Usuarios.cargar(gestor), []);

await Usuarios.anadirSiHaceFalta(gestor, 'Francisco');
comprobar('el primer nombre entra en la lista', await Usuarios.cargar(gestor), ['Francisco']);

await Usuarios.anadirSiHaceFalta(gestor, 'Ana');
comprobar('un segundo nombre se añade al final', await Usuarios.cargar(gestor), ['Francisco', 'Ana']);

await Usuarios.anadirSiHaceFalta(gestor, 'Francisco');
comprobar('el mismo nombre otra vez no se repite', await Usuarios.cargar(gestor), ['Francisco', 'Ana']);

await Usuarios.anadirSiHaceFalta(gestor, 'francisco');
comprobar('"francisco" en minúscula es un nombre distinto a propósito (no se unifican solos)',
  await Usuarios.cargar(gestor), ['Francisco', 'Ana', 'francisco']);

await Usuarios.anadirSiHaceFalta(gestor, '   ');
comprobar('un nombre en blanco no se añade', await Usuarios.cargar(gestor), ['Francisco', 'Ana', 'francisco']);

await Usuarios.anadirSiHaceFalta(gestor, '');
comprobar('una cadena vacía no se añade', await Usuarios.cargar(gestor), ['Francisco', 'Ana', 'francisco']);

/* Un fichero roto no impide entrar: cargar() lo trata como lista vacía. */
await Carpetas.escribirTexto(gestor, 'usuarios.json', '{esto no es json');
comprobar('un usuarios.json roto se trata como lista vacía, sin reventar',
  await Usuarios.cargar(gestor), []);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
