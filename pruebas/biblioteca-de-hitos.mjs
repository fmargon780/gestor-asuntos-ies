/* Prueba de lógica (jsdom, sin navegador de verdad) de la biblioteca
   de hitos del centro (20-sep-2026, fila 79 de docs/COLA.md,
   docs/BIBLIOTECA-DE-HITOS.md).

   Mismo patrón que pruebas/lo-pide.mjs: se cargan los ficheros de
   verdad en una página jsdom (con DOMParser de verdad, que hace falta
   para Guias.limpiar) y se llama a sus funciones públicas, con un
   disco de mentira en memoria para _GESTOR.

   Comprueba:
   1. Crear un modelo desde un paso, y traerlo (HitosBiblioteca.modeloAPaso)
      a dos tipos: los dos pasos quedan iguales, con el mismo origenBiblioteca.
   2. Cambiar el paso de uno de los dos tipos: HitosBiblioteca.diferencias
      lo detecta, y las dos respuestas de la pregunta (Guardar en la
      biblioteca): "Solo en este tipo" no toca el modelo; "Subir también"
      sube la revisión.
   3. El otro tipo, con la revisión vieja, avisa (apartado 4.4); tras
      "Dejarlo como está" (revision al día sin traer el cambio), calla.
   4. Borrar un modelo no rompe los pasos ya insertados: siguen siendo
      pasos normales, sin lanzar ningún error.
   5. Un paso-pregunta no se puede guardar en la biblioteca.
   6. Apartado 4.6: un hito traído con responsable distinto de
      Administración nace marcado; uno de Administración, no.
   7. "soloInformativo" no cuenta como cambio del modelo.
   8. El enlace de una referencia de normativa (apartado 4.7): con
      bloque y clave, con solo url, sin nada, y con la dirección base
      vacía.
   9. Un espacio en la clave se guarda como guion. */
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
win.App = { E: { usuario: 'Francisco' } };

for (const f of ['util.js', 'carpetas.js', 'copias.js', 'guias.js', 'guias-requisitos.js',
                  'guias-comunicacion.js', 'hitos-biblioteca.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { U, Guias, HitosBiblioteca } = win;

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

const gestorFalso = dirFalso('_GESTOR');
win.Gestor = { carpetaGestor: () => gestorFalso };

/* La misma condición de aviso que usa GuiasBiblioteca.pasosDesactualizados
   (apartado 4.4): por revisión, no por diferencia de contenido, así que
   "Solo en este tipo" y "Dejarlo como está" pueden callar el aviso para
   siempre aunque el contenido siga siendo distinto del modelo. */
function necesitaAviso(paso, modelo) {
  return !!(paso.origenBiblioteca && !paso.origenBiblioteca.divergido &&
    modelo && paso.origenBiblioteca.revision < modelo.revision);
}

/* ================= 1 · crear un modelo y traerlo a dos tipos ================= */
console.log('--- 1. crear un modelo y traerlo a dos tipos ---');
const pasoOriginal = {
  id: 'p1', titulo: 'Registrar de salida en Séneca', cuerpo: 'Sellar y anotar el registro.',
  opciones: [], responsable: 'administracion', requisitos: [], comunicacion: null
};
const modelo1 = await HitosBiblioteca.crearDesdePaso(pasoOriginal, 'Registrar de salida en Séneca', 'Francisco');
comprobar('el modelo nace con revision 1', modelo1.revision, 1);

const pasoTipoA = HitosBiblioteca.modeloAPaso(modelo1);
const pasoTipoB = HitosBiblioteca.modeloAPaso(modelo1);
comprobar('los dos pasos traídos llevan el mismo origenBiblioteca (menos el id del paso)',
  [pasoTipoA.origenBiblioteca, pasoTipoB.origenBiblioteca],
  [{ id: modelo1.id, revision: 1, divergido: false }, { id: modelo1.id, revision: 1, divergido: false }]);
comprobar('los dos pasos traídos tienen el mismo título que el modelo', [pasoTipoA.titulo, pasoTipoB.titulo],
  ['Registrar de salida en Séneca', 'Registrar de salida en Séneca']);

/* ============ 2 · cambiar el paso de un tipo: las dos respuestas ============ */
console.log('--- 2. cambiar el paso de un tipo: "solo aquí" y "subir también" ---');
const pasoTipoACambiado = Object.assign({}, pasoTipoA, { titulo: 'Registrar de salida (con el sello nuevo)' });

let biblioteca = await HitosBiblioteca.leer();
let modeloDeA = HitosBiblioteca.buscar(biblioteca, pasoTipoA.origenBiblioteca.id);
comprobar('el cambio se detecta', HitosBiblioteca.diferencias(pasoTipoACambiado, modeloDeA).length > 0, true);

/* "Solo en este tipo": no toca el modelo, y el paso queda "divergido". */
const pasoSoloAqui = Object.assign({}, pasoTipoACambiado,
  { origenBiblioteca: { id: pasoTipoA.origenBiblioteca.id, revision: pasoTipoA.origenBiblioteca.revision, divergido: true } });
biblioteca = await HitosBiblioteca.leer();
comprobar('"Solo en este tipo" no cambia la revision del modelo',
  HitosBiblioteca.buscar(biblioteca, modelo1.id).revision, 1);
comprobar('"Solo en este tipo" ya no cuenta como cambio (no vuelve a avisar)',
  necesitaAviso(pasoSoloAqui, HitosBiblioteca.buscar(biblioteca, modelo1.id)), false);

/* "Subir también a la biblioteca": sube la revision. */
const modeloActualizado = await HitosBiblioteca.actualizarDesdePaso(modelo1.id, pasoTipoACambiado, 'Francisco');
comprobar('"Subir también" sube la revision', modeloActualizado.revision, 2);
comprobar('"Subir también" copia el título nuevo', modeloActualizado.titulo, 'Registrar de salida (con el sello nuevo)');

/* ============ 3 · el aviso en el otro tipo, y "Dejarlo como está" ============ */
console.log('--- 3. el aviso en el otro tipo (apartado 4.4) ---');
comprobar('el tipo B, con la revision vieja, sigue sin estar al día',
  necesitaAviso(pasoTipoB, modeloActualizado), true);
const diffsDeB = HitosBiblioteca.diferencias(pasoTipoB, modeloActualizado);
comprobar('y el aviso trae al menos el título como diferencia',
  diffsDeB.some((d) => d.campo === 'titulo'), true);

/* "Dejarlo como está": no trae el cambio, pero apunta la revision al
   día para que el aviso no vuelva a salir por lo mismo. */
const pasoBDejadoComoEsta = Object.assign({}, pasoTipoB,
  { origenBiblioteca: { id: modelo1.id, revision: modeloActualizado.revision, divergido: false } });
comprobar('tras "Dejarlo como está", el aviso calla',
  necesitaAviso(pasoBDejadoComoEsta, modeloActualizado), false);
comprobar('pero el paso conserva su propio título (no se ha traído el cambio)',
  pasoBDejadoComoEsta.titulo, 'Registrar de salida en Séneca');

/* ================= 4 · borrar un modelo no rompe los pasos ================= */
console.log('--- 4. borrar un modelo no rompe los pasos ya insertados ---');
await HitosBiblioteca.borrar(modelo1.id);
const bibliotecaSinModelo = await HitosBiblioteca.leer();
comprobar('el modelo ya no está', HitosBiblioteca.buscar(bibliotecaSinModelo, modelo1.id), null);
comprobar('sin su modelo, comparar no rompe nada (lista vacía, no un error)',
  HitosBiblioteca.diferencias(pasoTipoA, null), []);

/* ================= 5 · un paso-pregunta no se puede guardar ================= */
console.log('--- 5. un paso-pregunta no se puede guardar en la biblioteca ---');
const pasoNormal = { id: 'p2', titulo: 'Un paso cualquiera', cuerpo: '', opciones: [] };
const pasoPregunta = {
  id: 'p3', titulo: '¿Cómo ha llegado?', cuerpo: '',
  opciones: [{ id: 'o1', titulo: 'En mano', pasos: [] }, { id: 'o2', titulo: 'Por correo', pasos: [] }]
};
comprobar('un paso normal sí se puede guardar', HitosBiblioteca.esPasoValido(pasoNormal), true);
comprobar('un paso-pregunta no se puede guardar', HitosBiblioteca.esPasoValido(pasoPregunta), false);

/* ========== 6 · apartado 4.6: si nace marcado "solo informativo" ========== */
console.log('--- 6. si un hito traído nace marcado "solo informativo" ---');
comprobar('responsable distinto de Administración: nace marcado',
  HitosBiblioteca.naceSoloInformativo('jefatura', 'administracion'), true);
comprobar('el propio responsable de Administración: nace sin marcar',
  HitosBiblioteca.naceSoloInformativo('administracion', 'administracion'), false);
comprobar('sin poder determinarlo (sin id de Administración configurado): nace sin marcar',
  HitosBiblioteca.naceSoloInformativo('jefatura', ''), false);
comprobar('sin responsable en el hito: nace sin marcar',
  HitosBiblioteca.naceSoloInformativo('', 'administracion'), false);

/* ===== 7 · "soloInformativo" no cuenta como cambio del modelo ===== */
console.log('--- 7. "soloInformativo" no cuenta como cambio del modelo ---');
const modeloParaInf = await HitosBiblioteca.crearDesdePaso(pasoNormal, 'Un paso cualquiera', 'Francisco');
const pasoConLaMarca = Object.assign({}, HitosBiblioteca.modeloAPaso(modeloParaInf), { soloInformativo: true });
comprobar('cambiar solo la marca no cuenta como diferencia',
  HitosBiblioteca.diferencias(pasoConLaMarca, modeloParaInf).length, 0);

/* ================= 8 · el enlace de una referencia ================= */
console.log('--- 8. el enlace de una referencia de normativa ---');
const BASE = 'https://normativa.fmargon.com';
comprobar('con clave y dirección base, abre la vista de un solo artículo',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: '', clave: 'ROC-40', url: '' }, BASE),
  'https://normativa.fmargon.com/norma#r=ROC-40');
comprobar('con clave, dirección base y bloque, el bloque no cambia nada',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: 'convivencia', clave: 'ROC-40', url: '' }, BASE),
  'https://normativa.fmargon.com/norma#r=ROC-40');
comprobar('con una dirección base que ya termina en /norma, sin /norma/norma',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: '', clave: 'ROC-40', url: '' }, BASE + '/norma'),
  'https://normativa.fmargon.com/norma#r=ROC-40');
comprobar('sin clave y con url, usa la url tal cual',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: '', clave: '', url: 'https://boe.es/algo' }, BASE),
  'https://boe.es/algo');
comprobar('sin clave y sin url, no hay enlace',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: '', clave: '', url: '' }, BASE), '');
comprobar('con clave pero con la dirección base vacía, tampoco hay enlace',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: '', clave: 'ROC-40', url: '' }, ''), '');

/* ================= 9 · un espacio en la clave se guarda como guion ================= */
console.log('--- 9. un espacio en la clave se guarda como guion ---');
const normativaConEspacio = Guias.normalizarNormativa([{ cita: 'ROC, art. 40', bloque: 'convivencia', clave: 'ROC 40.1', url: '' }]);
comprobar('el espacio se convierte en guion, sin avisar', normativaConEspacio[0].clave, 'ROC-40.1');
comprobar('una referencia sin cita no sobrevive',
  Guias.normalizarNormativa([{ cita: '', bloque: '', clave: '', url: '' }]), []);

/* ---------- final ---------- */
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
