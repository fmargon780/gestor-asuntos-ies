/* Prueba de lógica (jsdom, sin navegador de verdad) de los cargos del
   centro (20-sep-2026, fila 81, docs/FIRMANTES-Y-MEMBRETE.md).

   Nada de fechas escritas a mano: todas se cuentan desde hoy, para que
   la prueba no se ponga en rojo ella sola con el calendario.

   Comprueba:
   1. Un ocupante único sin cese: vigente hoy y en cualquier fecha
      posterior a su alta.
   2. Dos ocupantes en cadena (el primero cesa, el segundo entra el día
      siguiente): cada fecha da el ocupante que tocaba.
   3. Una fecha anterior a todos los ocupantes: no hay nadie (null).
   4. Una fecha entre el cese de uno y el alta del siguiente (un hueco):
      no hay nadie (null).
   5. Un solape entre dos ocupantes: Cargos.solapes lo detecta.
   6. Un cargo sin ocupantes: vigente da null, y sin solapes. */
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

/* ---------- fechas relativas a hoy, en AAAA-MM-DD ---------- */
function iso(delta) {
  const d = new Date();
  d.setDate(d.getDate() + delta);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* ---------- montar la página ---------- */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
win.TextDecoder = TextDecoder;
win.Blob = Blob;
win.App = { E: {} };

for (const f of ['util.js', 'carpetas.js', 'copias.js', 'cargos.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { Cargos } = win;

/* ---------- disco de mentira, igual que en pruebas/biblioteca-de-hitos.mjs ---------- */
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

const gestorFalso = dirFalso('_GESTOR');
win.Gestor = { carpetaGestor: () => gestorFalso };

async function run() {

  /* ================= 1 · ocupante único sin cese ================= */
  console.log('--- 1. ocupante único sin cese ---');
  await Cargos.guardar(function (d) {
    var c = Cargos.buscar(d, 'direccion');
    c.ocupantes.push({ id: 'o1', persona: 'Ana Ana', desde: iso(-100), hasta: '' });
    return d;
  });
  comprobar('vigente hoy', (await Cargos.vigente('direccion')).persona, 'Ana Ana');
  comprobar('vigente mucho más adelante', (await Cargos.enFecha('direccion', iso(3650))).persona, 'Ana Ana');

  /* ================= 2 · dos ocupantes en cadena ================= */
  console.log('--- 2. dos ocupantes en cadena ---');
  await Cargos.guardar(function (d) {
    var c = Cargos.buscar(d, 'secretaria');
    c.ocupantes.push({ id: 's1', persona: 'Beatriz Beatriz', desde: iso(-200), hasta: iso(-101) });
    c.ocupantes.push({ id: 's2', persona: 'Carlos Carlos', desde: iso(-100), hasta: '' });
    return d;
  });
  comprobar('en el tramo del primero', (await Cargos.enFecha('secretaria', iso(-150))).persona, 'Beatriz Beatriz');
  comprobar('en el tramo del segundo', (await Cargos.enFecha('secretaria', iso(-50))).persona, 'Carlos Carlos');
  comprobar('vigente hoy es el segundo', (await Cargos.vigente('secretaria')).persona, 'Carlos Carlos');

  /* ================= 3 · fecha anterior a todos ================= */
  console.log('--- 3. fecha anterior a todos ---');
  comprobar('nadie antes de que empezara el primero', await Cargos.enFecha('secretaria', iso(-500)), null);

  /* ================= 4 · hueco entre el cese de uno y el alta del siguiente ================= */
  console.log('--- 4. hueco entre dos ocupantes ---');
  await Cargos.guardar(function (d) {
    var c = Cargos.buscar(d, 'orientacion');
    c.ocupantes.push({ id: 'r1', persona: 'Diego Diego', desde: iso(-200), hasta: iso(-101) });
    c.ocupantes.push({ id: 'r2', persona: 'Elena Elena', desde: iso(-50), hasta: '' });
    return d;
  });
  comprobar('nadie en el hueco', await Cargos.enFecha('orientacion', iso(-75)), null);

  /* ================= 5 · un solape ================= */
  console.log('--- 5. un solape entre dos ocupantes ---');
  const datosSolape = await Cargos.leer();
  const jefatura = Cargos.buscar(datosSolape, 'jefatura-estudios');
  jefatura.ocupantes.push({ id: 'j1', persona: 'Fran Fran', desde: iso(-200), hasta: iso(-10) });
  jefatura.ocupantes.push({ id: 'j2', persona: 'Gema Gema', desde: iso(-30), hasta: '' });
  comprobar('un solape detectado', Cargos.solapes(jefatura).length, 1);

  /* ================= 6 · cargo sin ocupantes ================= */
  console.log('--- 6. cargo sin ocupantes ---');
  comprobar('vicedirección sin ocupante', await Cargos.vigente('vicedireccion'), null);
  const datosFinal = await Cargos.leer();
  comprobar('sin solapes en un cargo vacío', Cargos.solapes(Cargos.buscar(datosFinal, 'vicedireccion')).length, 0);

  console.log(fallos ? '\n' + fallos + ' fallo(s) en cargos.mjs' : '\nTodo bien en cargos.mjs');
  if (fallos) process.exit(1);
}

run();
