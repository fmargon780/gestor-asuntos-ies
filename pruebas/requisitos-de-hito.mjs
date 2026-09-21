/* Prueba de "lo que hay que reunir" en cada hito (18-sep-2026, fila 59
   de docs/COLA.md, docs/REQUISITOS-DE-HITO.md, sección 9), con un disco
   de mentira en memoria: sin navegador, como pide el encargo.

   Comprueba:
   1. Un paso de guía con dos requisitos (uno obligatorio de clase
      documento, uno de clase dato) se convierte en un hito con las dos
      casillas sin marcar.
   2. Apuntar un documento a ese hito marca sola la única casilla de
      clase documento, con el nombre del fichero guardado.
   3. Hitos.faltanObligatorios devuelve la casilla obligatoria mientras
      esté sin marcar, y nada cuando ya está.
   4. El texto de "Pedir lo que falta" lista solo las casillas sin
      marcar, con la cabecera "Falta por aportar:".
   5. Un hito sin requisitos se comporta exactamente como antes. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
/* guias.js engancha escuchadores sobre `document` nada más cargarse
   (engancharLaGuia, que aquí no se usa), y U.aviso (js/util.js) pinta
   un mensaje flotante en cada guardado con éxito: ninguno de los dos
   hace falta de verdad en esta prueba, así que basta con un nodo de
   mentira que trague appendChild/setAttribute sin quejarse. */
function nodoFalso() {
  return {
    appendChild: function () {}, setAttribute: function () {}, remove: function () {},
    classList: { add: function () {}, remove: function () {}, toggle: function () {} }
  };
}
const contexto = {
  console, TextDecoder, Blob, window: {}, indexedDB: null, setTimeout, clearTimeout,
  document: {
    addEventListener: function () {},
    getElementById: function () { return nodoFalso(); },
    createElement: function () { return nodoFalso(); }
  }
};
vm.createContext(contexto);
for (const f of ['util.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'guias.js', 'hitos.js', 'hitos-archivo.js', 'hitos-requisitos.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { U, Hitos } = contexto;
/* En el navegador `window` ES el objeto global, así que `window.App` y
   `App` a secas son la misma cosa; aquí `window` es un objeto aparte,
   así que hace falta poner las dos (varios sitios del modelo escriben
   `App.E.usuario` a secas, no `window.App.E.usuario`). */
contexto.App = contexto.window.App = { E: { usuario: 'Francisco' } };
/* HitosRequisitos, a diferencia de Hitos, solo se cuelga de `window`
   (no hay una `var HitosRequisitos` de por medio en el fichero): se
   lee de ahí. */
const HitosRequisitos = contexto.window.HitosRequisitos;

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

const gestorFalso = dirFalso('_GESTOR');
contexto.window.Gestor = { carpetaGestor: () => gestorFalso };

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const PASO = {
  id: 'p1', titulo: 'Registrar la solicitud', cuerpo: '', opciones: [],
  requisitos: [
    { id: 'r1', texto: 'Fotocopia del libro de familia', clase: 'documento', obligatorio: true },
    { id: 'r2', texto: 'Teléfono de contacto del tutor', clase: 'dato', obligatorio: false }
  ]
};

/* ================= 1 · el paso se convierte en hito ================= */
console.log('--- 1. un paso con requisitos se convierte en un hito con las casillas sin marcar ---');
const hito1 = Hitos.pasoAHito(PASO);
comprobar('las dos casillas llegan, sin marcar',
  hito1.requisitos.map((r) => [r.texto, r.clase, r.obligatorio, r.hecho]),
  [
    ['Fotocopia del libro de familia', 'documento', true, false],
    ['Teléfono de contacto del tutor', 'dato', false, false]
  ]);

/* ========= 2 · apuntar un documento marca sola la casilla ========= */
console.log('--- 2. apuntar un documento marca sola la única casilla de clase documento ---');
const CLAVE = 'AsuntoDePrueba';
await Hitos.cambiar((d) => { d.porAsunto[CLAVE] = { creados: U.hoyIso(), hitos: [hito1] }; return d; });
await HitosRequisitos.marcarPorDocumento(CLAVE, hito1.id, 'Libro de familia.pdf');
let hitos = await Hitos.hitosDe(CLAVE);
let h = Hitos.buscar(hitos, hito1.id);
comprobar('la casilla de clase documento queda marcada, con el nombre del fichero',
  [h.requisitos[0].hecho, h.requisitos[0].documento],
  [true, 'Libro de familia.pdf']);
comprobar('la casilla de clase dato sigue sin marcar',
  h.requisitos[1].hecho, false);

/* ================= 3 · Hitos.faltanObligatorios ================= */
console.log('--- 3. Hitos.faltanObligatorios ---');
const hito3 = Hitos.pasoAHito(PASO);
comprobar('con la obligatoria sin marcar, la devuelve',
  Hitos.faltanObligatorios(hito3).map((r) => r.texto),
  ['Fotocopia del libro de familia']);
hito3.requisitos[0].hecho = true;
comprobar('marcada, ya no aparece nada',
  Hitos.faltanObligatorios(hito3), []);

/* ============ 4 · el texto de "Pedir lo que falta" ============ */
console.log('--- 4. el texto de "Pedir lo que falta" ---');
const hito4 = Hitos.pasoAHito(PASO);
comprobar('lista las dos, con la cabecera acordada',
  HitosRequisitos.textoLoQueFalta(hito4),
  'Falta por aportar:\n- Fotocopia del libro de familia\n- Teléfono de contacto del tutor');
hito4.requisitos[0].hecho = true;
comprobar('con una ya marcada, solo lista la que falta',
  HitosRequisitos.textoLoQueFalta(hito4),
  'Falta por aportar:\n- Teléfono de contacto del tutor');
hito4.requisitos[1].hecho = true;
comprobar('con todo marcado, no hay nada que pedir',
  HitosRequisitos.textoLoQueFalta(hito4), '');

/* ======== 5 · un hito sin requisitos, exactamente como antes ======== */
console.log('--- 5. un hito sin requisitos, como antes ---');
const hito5 = Hitos.pasoAHito({ id: 'p2', titulo: 'Notificación', cuerpo: '', opciones: [] });
comprobar('nace sin requisitos', hito5.requisitos, []);
comprobar('faltanObligatorios no encuentra nada', Hitos.faltanObligatorios(hito5), []);
comprobar('"Pedir lo que falta" no tiene nada que decir', HitosRequisitos.textoLoQueFalta(hito5), '');

/* ---------- final ---------- */
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
