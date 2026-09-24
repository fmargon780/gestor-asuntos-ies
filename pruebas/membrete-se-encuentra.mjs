/* Prueba (sin navegador) de la fila 127 (docs/MEMBRETE-NO-SE-ENCUENTRA.md):
   `membrete.png` es un FICHERO dentro de _GESTOR/PLANTILLAS, y
   `Membrete.hayImagen` / `imagenGuardada` tienen que encontrarlo (antes
   se preguntaba con `Carpetas.existe`, que busca una carpeta, y nunca lo
   veían). Con el js/carpetas.js de verdad y un disco de mentira mínimo. */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* Un disco de mentira: carpetas y ficheros en mapas separados, como el de verdad. */
function carpeta() {
  const carpetas = new Map(), ficheros = new Map();
  return {
    kind: 'directory', carpetas, ficheros,
    async getDirectoryHandle(n, o) {
      if (!carpetas.has(n)) { if (o && o.create) carpetas.set(n, carpeta()); else throw new DOMException('no', 'NotFoundError'); }
      return carpetas.get(n);
    },
    async getFileHandle(n) {
      if (!ficheros.has(n)) throw new DOMException('no', 'NotFoundError');
      const datos = ficheros.get(n);
      return { kind: 'file', name: n, async getFile() { return new Blob([datos], { type: 'image/png' }); } };
    }
  };
}

const gestor = carpeta();
const contexto = { console, Blob, DOMException, setTimeout, clearTimeout, TextEncoder, TextDecoder, window: {}, document: { addEventListener() {} } };
contexto.window.Gestor = { carpetaGestor: () => gestor };
vm.createContext(contexto);
for (const f of ['util.js', 'reintentar-escritura.js', 'carpetas.js', 'membrete.js']) {
  vm.runInContext(fs.readFileSync(RAIZ + f, 'utf8'), contexto, { filename: f });
}
const { Carpetas, Membrete } = vm.runInContext('({ Carpetas: Carpetas, Membrete: Membrete })', contexto);
contexto.window.Carpetas = Carpetas;

comprobar('sin membrete.png, no hay imagen', await Membrete.hayImagen(), false);
comprobar('sin membrete.png, imagenGuardada da null', await Membrete.imagenGuardada(), null);

(await gestor.getDirectoryHandle('PLANTILLAS', { create: true })).ficheros.set('membrete.png', 'PNG');
comprobar('con el fichero membrete.png, hayImagen lo encuentra', await Membrete.hayImagen(), true);
const imagen = await Membrete.imagenGuardada();
comprobar('e imagenGuardada lo devuelve', imagen ? await imagen.text() : null, 'PNG');

/* Y una carpeta que se llame así no cuenta como imagen. */
const otro = carpeta();
contexto.window.Gestor.carpetaGestor = () => otro;
(await otro.getDirectoryHandle('PLANTILLAS', { create: true })).carpetas.set('membrete.png', carpeta());
comprobar('una carpeta llamada membrete.png no es la imagen', await Membrete.hayImagen(), false);

console.log(fallos ? '\n' + fallos + ' fallo(s) en membrete-se-encuentra.mjs' : '\nTodo bien en membrete-se-encuentra.mjs');
if (fallos) process.exit(1);
