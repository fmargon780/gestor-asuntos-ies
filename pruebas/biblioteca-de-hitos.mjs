/* Prueba de lógica (jsdom, sin navegador de verdad) de la biblioteca
   de hitos del centro (20-sep-2026, fila 79 de docs/COLA.md,
   docs/BIBLIOTECA-DE-HITOS.md).

   Mismo patrón que pruebas/lo-pide.mjs: se cargan los ficheros de
   verdad en una página jsdom (con DOMParser de verdad, que hace falta
   para Guias.limpiar) y se llama a sus funciones públicas, con un
   disco de mentira en memoria para _GESTOR.

   Comprueba:
   1. Crear un modelo desde un paso y traerlo a un tipo (modeloAPaso).
   2. Fila 417 (docs/HITOS-UN-SOLO-SITIO.md, parte B): «Traer un hito de otro
      tipo». El buscador lista los hitos de arriba de las guías de los demás
      tipos (sin preguntas, sin los de dentro de una rama), agrupados por tipo,
      y los modelos que ninguna guía usa quedan en «Sin tipo». Traer uno es una
      copia suelta: id nuevo, sin origenBiblioteca, y cambiarla no toca el
      original.
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

for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'guias.js', 'guias-requisitos.js',
                  'hitos-biblioteca.js']) {
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

/* ============ 2 · traer un hito de otro tipo (fila 417) ============ */
console.log('--- 2. el buscador de hitos de otros tipos y la copia suelta ---');
const GUIAS = {
  'Elecc. Consejo Escolar': [
    { id: 'e1', titulo: 'Registrar de salida en Séneca', cuerpo: 'Sellar y anotar.', opciones: [], responsable: 'administracion',
      plazo: { dias: 5, desde: 'e0', cuenta: 'habiles' }, guion: [{ id: 'g1', texto: 'Anotar el número' }] },
    { id: 'e2', titulo: '¿Cómo ha llegado?', opciones: [{ id: 'o1', titulo: 'En mano', pasos: [{ id: 'e3', titulo: 'Dentro de la rama', opciones: [] }] }] },
    { id: 'e4', titulo: '', opciones: [] }
  ],
  'Certificado': [{ id: 'c1', titulo: 'Entregar el certificado', opciones: [] }],
  'Matrícula': [{ id: 'm1', titulo: 'Abrir el expediente', opciones: [] }]
};
const grupos = HitosBiblioteca.hitosDeOtrosTipos(GUIAS, 'Certificado');
comprobar('agrupa por tipo (en orden), sin el tipo que se escribe', grupos.map((g) => g.tipo), ['Elecc. Consejo Escolar', 'Matrícula']);
comprobar('solo los hitos de arriba, sin preguntas, sin los de una rama y sin título vacío',
  grupos[0].hitos.map((h) => h.titulo), ['Registrar de salida en Séneca']);

const copia = HitosBiblioteca.copiaSuelta(GUIAS['Elecc. Consejo Escolar'][0], 'c1');
comprobar('la copia tiene id nuevo', copia.id !== 'e1' && !!copia.id, true);
comprobar('la copia no lleva origenBiblioteca', 'origenBiblioteca' in copia, false);
comprobar('la copia trae el título, la explicación y las tareas con sus ids',
  [copia.titulo, copia.cuerpo, copia.guion], ['Registrar de salida en Séneca', 'Sellar y anotar.', [{ id: 'g1', texto: 'Anotar el número' }]]);
comprobar('el plazo, que contaba desde un hito de la otra guía, cuenta desde el de arriba y se avisa',
  [copia.plazo, copia.avisoPlazoAjeno], [{ dias: 5, desde: 'c1', cuenta: 'habiles' }, true]);
comprobar('sin hito de arriba, la copia llega sin plazo (y avisa)',
  (({ plazo, avisoPlazoAjeno }) => [plazo, avisoPlazoAjeno])(HitosBiblioteca.copiaSuelta(GUIAS['Elecc. Consejo Escolar'][0], '')), [null, true]);
copia.titulo = 'Cambiado en Certificado';
comprobar('cambiar la copia no toca el original', GUIAS['Elecc. Consejo Escolar'][0].titulo, 'Registrar de salida en Séneca');
comprobar('un hito sin plazo no lleva aviso de plazo',
  HitosBiblioteca.copiaSuelta(GUIAS['Matrícula'][0], 'c1').avisoPlazoAjeno, undefined);

const suelto = await HitosBiblioteca.leer();
comprobar('un modelo que ninguna guía usa sale en «Sin tipo»', HitosBiblioteca.modelosSinTipo(suelto, GUIAS).map((m) => m.id), [modelo1.id]);
const guiasConUso = Object.assign({}, GUIAS, { 'Certificado': [pasoTipoA] });
comprobar('y deja de salir si una guía lo usa', HitosBiblioteca.modelosSinTipo(suelto, guiasConUso), []);
const dsModelo = HitosBiblioteca.copiaSueltaDeModelo(modelo1, 'c1');
comprobar('traer uno de «Sin tipo» es una copia suelta: título, id nuevo y sin vínculo',
  [dsModelo.titulo, dsModelo.id !== pasoTipoA.id, 'origenBiblioteca' in dsModelo], ['Registrar de salida en Séneca', true, false]);

/* ================= 4 · borrar un modelo no rompe los pasos ================= */
console.log('--- 4. borrar un modelo no rompe los pasos ya insertados ---');
await HitosBiblioteca.borrar(modelo1.id);
const bibliotecaSinModelo = await HitosBiblioteca.leer();
comprobar('el modelo ya no está', HitosBiblioteca.buscar(bibliotecaSinModelo, modelo1.id), null);
comprobar('sin su modelo, comparar no rompe nada (lista vacía, no un error)',
  HitosBiblioteca.diferencias(pasoTipoA, null), []);
comprobar('y su copia suelta sigue siendo un paso normal', (await HitosBiblioteca.leer()).modelos.length, 0);

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

/* Fila 232 (docs/ENLACE-A-NORMATIVA-CORRECTO.md): una url guardada del propio
   sistema de normativa se convierte; solo la base, no hay enlace; /oposicion, nunca. */
comprobar('una url vieja de vercel.app con #r= se convierte a /norma#r=',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: '', clave: '', url: 'https://normativa-escolarizacion.vercel.app/convivencia#r=ROC-40.1' }, BASE),
  'https://normativa.fmargon.com/norma#r=ROC-40.1');
comprobar('una url de normativa.fmargon.com con #r= se monta con la base de Ajustes',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: '', clave: '', url: 'https://normativa.fmargon.com/convivencia#r=ROC-40' }, BASE + '/norma'),
  'https://normativa.fmargon.com/norma#r=ROC-40');
comprobar('una url que es solo la base del sistema de normativa: sin enlace',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: '', clave: '', url: 'https://normativa-escolarizacion.vercel.app' }, BASE), '');
comprobar('una url de /oposicion nunca se enlaza',
  HitosBiblioteca.enlaceDeNormativa({ cita: 'x', bloque: '', clave: '', url: 'https://normativa.fmargon.com/oposicion#r=T1' }, BASE), '');

/* ================= 9 · un espacio en la clave se guarda como guion ================= */
console.log('--- 9. un espacio en la clave se guarda como guion ---');
const normativaConEspacio = Guias.normalizarNormativa([{ cita: 'ROC, art. 40', bloque: 'convivencia', clave: 'ROC 40.1', url: '' }]);
comprobar('el espacio se convierte en guion, sin avisar', normativaConEspacio[0].clave, 'ROC-40.1');
comprobar('una referencia sin cita no sobrevive',
  Guias.normalizarNormativa([{ cita: '', bloque: '', clave: '', url: '' }]), []);

/* ---------- final ---------- */
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
