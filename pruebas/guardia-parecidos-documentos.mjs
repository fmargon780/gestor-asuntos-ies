/* Prueba de lógica (jsdom, sin navegador de verdad) de la guardia de
   parecidos del texto de los documentos (28-sep-2026, fila 201,
   docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md, apartado 3, punto 4):
   GuiasBiblioteca.textoDocumentosParecido.

   Mismo patrón que pruebas/biblioteca-de-hitos.mjs: se cargan los
   ficheros de verdad en una página jsdom, con un disco de mentira en
   memoria para _GESTOR.

   Comprueba:
   1. Un texto igual, salvo tildes, mayúsculas y espacios de sobra, en
      otro hito de OTRO tipo de asunto (guias.json): se detecta, y se
      dice de qué hito y de qué tipo es.
   2. El propio hito (mismo `pasoId` en `evitar`) no cuenta como
      "otro": no avisa de que se parece a sí mismo.
   3. Un texto igual en un modelo de la biblioteca: se detecta, con el
      nombre del modelo; y tampoco avisa de sí mismo (`evitar.modeloId`).
   4. Un texto igual en el «Texto por defecto» de otro tipo de
      documento (campos.json): se detecta; y tampoco de sí mismo
      (`evitar.tipoDocumento`).
   5. Un texto que no se parece a nada: no hay aviso (null).
   6. Vacío: no hay aviso, sin tocar el disco. */
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

/* ---------- montar la página ---------- */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
win.TextDecoder = TextDecoder;
win.Blob = Blob;

for (const f of ['util.js', 'util-parecidos.js', 'carpetas.js', 'copias.js', 'guias.js', 'guias-requisitos.js',
                  'hitos-biblioteca.js', 'campos.js', 'guias-biblioteca.js', 'guias-biblioteca-guardias.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { U, HitosBiblioteca, GuiasBiblioteca } = win;

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

/* guias.json de mentira, con un hito de CERTIFICADO ya con su texto. */
const guiasDeMentira = {
  CERTIFICADO: [
    { id: 'p1', titulo: 'Firma de Secretaría', opciones: [], textoDocumentos: 'Certificado de notas 2º ESO' },
    { id: 'p2', titulo: 'Otro hito', opciones: [], textoDocumentos: '' }
  ]
};
gestorFalso._hijos.set('guias.json', ficheroFalso('guias.json', JSON.stringify(guiasDeMentira)));

win.App = {
  E: {
    usuario: 'Francisco', gestor: gestorFalso,
    tiposDocumento: ['FACTURA', 'DILIGENCIA'],
    campos: { textoPorTipoDocumento: { FACTURA: 'Proveedor habitual' } }
  }
};

/* ================= 1 y 2 · un hito de otro tipo ================= */
console.log('--- 1 y 2. un texto igual (salvo tildes, mayúsculas, espacios) en otro hito ---');
const par1 = await GuiasBiblioteca.textoDocumentosParecido('  certificado   DE Notas 2º esó  ', {});
comprobar('se detecta, y dice de qué hito y de qué tipo', par1,
  { texto: 'Certificado de notas 2º ESO', origen: 'el hito «Firma de Secretaría» de CERTIFICADO' });

const par2 = await GuiasBiblioteca.textoDocumentosParecido('Certificado de notas 2º ESO', { pasoId: 'p1' });
comprobar('el propio hito (evitar.pasoId) no cuenta como "otro"', par2, null);

/* ================= 3 · un modelo de la biblioteca ================= */
console.log('--- 3. un texto igual en un modelo de la biblioteca ---');
const modelo = await HitosBiblioteca.crearDesdePaso(
  { id: 'm1', titulo: 'Sellar la solicitud', opciones: [], textoDocumentos: 'Solicitud de beca de comedor' },
  'Sellar la solicitud', 'Francisco');
const par3 = await GuiasBiblioteca.textoDocumentosParecido('SOLICITUD DE BECA DE COMEDOR', {});
comprobar('se detecta, con el nombre del modelo', par3,
  { texto: 'Solicitud de beca de comedor', origen: 'el hito «Sellar la solicitud» de la biblioteca' });
const par3b = await GuiasBiblioteca.textoDocumentosParecido('Solicitud de beca de comedor', { modeloId: modelo.id });
comprobar('el propio modelo (evitar.modeloId) no cuenta como "otro"', par3b, null);

/* ============ 4 · el texto por defecto de otro tipo de documento ============ */
console.log('--- 4. un texto igual en el "Texto por defecto" de otro tipo de documento ---');
const par4 = await GuiasBiblioteca.textoDocumentosParecido('proveedor   HABITUAL', {});
comprobar('se detecta, con el nombre del tipo de documento', par4,
  { texto: 'Proveedor habitual', origen: 'el tipo de documento «FACTURA»' });
const par4b = await GuiasBiblioteca.textoDocumentosParecido('Proveedor habitual', { tipoDocumento: 'FACTURA' });
comprobar('el propio tipo de documento (evitar.tipoDocumento) no cuenta como "otro"', par4b, null);

/* ================= 5 y 6 · sin nada que avisar ================= */
console.log('--- 5 y 6. sin nada parecido, y con el campo vacío ---');
const par5 = await GuiasBiblioteca.textoDocumentosParecido('Un texto que no se parece a ningún otro', {});
comprobar('sin nada parecido, no hay aviso', par5, null);
const par6 = await GuiasBiblioteca.textoDocumentosParecido('   ', {});
comprobar('vacío, no hay aviso', par6, null);

/* ---------- final ---------- */
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
