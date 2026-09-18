/* Prueba de "Comunicar desde el hito" (18-sep-2026, fila 60 de
   docs/COLA.md, docs/COMUNICAR-DESDE-EL-HITO.md, sección 7), con un
   disco de mentira en memoria: sin navegador, como pide el encargo.

   No se abre ningún cuadro de verdad (js/correo.js `abrirCuadro` monta
   un `U.preguntar` con el DOM entero, que no tiene sentido simular
   aquí): se sustituye `window.CorreoNucleo.abrirCuadro` por uno que
   solo apunta con qué le han llamado, y se comprueba eso.

   Comprueba:
   1. Un paso con `comunicacion.correo.cuerpo` escrito hace que su hito
      tenga botón Comunicar; un paso sin nada, no.
   2. Con texto solo de Séneca, "Comunicar" abre Séneca sin pasar por
      el menú (un solo canal → un solo destino, sin FichaMenus).
   3. El destinatario propuesto es el tutor cuando el responsable del
      hito es `tutor`, y el tercero del asunto cuando el responsable es
      una persona del centro.
   4. Los huecos del cuerpo salen resueltos con los datos del asunto.
   5. El texto de la constancia (`CorreoNucleo.textoDeComunicarHito`,
      lo que se apunta en el historial del hito y en las notas del
      asunto al preparar el mensaje) nombra a quien se ha escrito y por
      qué canal. El "una sola vez" es el cerrojo `yaApuntado`, ya
      existente en js/correo.js (`apuntarElRastro`) desde antes de esta
      fila: no se repite aquí, se prueba con el navegador de verdad en
      las pruebas que ya ejercitan ese camino (por ejemplo
      pruebas/seneca-destinatarios-navegador.mjs). */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function nodoFalso() {
  return {
    appendChild: function () {}, setAttribute: function () {}, remove: function () {},
    classList: { add: function () {}, remove: function () {}, toggle: function () {} },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; }
  };
}
const contexto = {
  console, TextDecoder, Blob, window: {}, indexedDB: null, setTimeout, clearTimeout,
  document: {
    addEventListener: function () {},
    getElementById: function () { return nodoFalso(); },
    createElement: function () { return nodoFalso(); },
    querySelector: function () { return null; }
  }
};
vm.createContext(contexto);
/* En el navegador `window` ES el global, así que `window.App` y `App`
   a secas son la misma cosa; aquí hace falta poner las dos ANTES de
   cargar nada (varias piezas del modelo escriben `App.E.usuario`/
   `App.abrirFicha` a secas, incluso al cargarse el propio fichero, como
   js/correo.js). Un `App` sin `abrirFicha` basta: js/correo.js
   comprueba `typeof comoEra !== 'function'` antes de usarlo. */
contexto.App = contexto.window.App = { E: { usuario: 'Francisco', datos: {} } };
for (const f of [
  'util.js', 'carpetas.js', 'copias.js', 'nombres.js', 'datos.js', 'dni.js', 'lo-pide.js',
  'plantillas.js', 'guias.js', 'hitos.js', 'hitos-archivo.js', 'correo.js', 'hitos-comunicar.js'
]) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
/* En el navegador `window` ES el global: un `var LoPide = ...` de
   arriba de todo (sin `window.LoPide = LoPide` aparte, como en
   js/lo-pide.js) ya cuelga solo de `window`, y al revés, un fichero que
   solo hace `window.Dni = {...}` (js/dni.js) también se lee como `Dni`
   a secas. Aquí `window` es un objeto aparte, así que hace falta
   copiar en los dos sentidos, una vez, después de cargar todo. */
Object.keys(contexto.window).forEach(function (k) { if (!(k in contexto)) contexto[k] = contexto.window[k]; });
['U', 'Carpetas', 'Copias', 'Nombres', 'Datos', 'Dni', 'LoPide', 'Plantillas', 'Guias', 'Hitos']
  .forEach(function (k) { if (contexto[k] !== undefined && contexto.window[k] === undefined) contexto.window[k] = contexto[k]; });
const { U, Hitos } = contexto;
const CorreoNucleoReal = contexto.window.CorreoNucleo;
const HitosComunicar = contexto.window.HitosComunicar;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- la guía de mentira: un asunto con dos pasos ---------- */
const PASO_CON_CORREO = {
  id: 'p1', titulo: 'Registrar la solicitud', cuerpo: '', opciones: [],
  comunicacion: {
    correo: { asunto: 'Sobre {tipo}', cuerpo: 'Hola {nombre}: necesitamos que aportes un documento.' },
    seneca: { asunto: '', cuerpo: '' }
  }
};
const PASO_SIN_NADA = { id: 'p2', titulo: 'Notificación', cuerpo: '', opciones: [] };
const PASO_SOLO_SENECA = {
  id: 'p3', titulo: 'Aviso', cuerpo: '', opciones: [],
  comunicacion: { correo: { asunto: '', cuerpo: '' }, seneca: { asunto: '', cuerpo: 'Aviso por Séneca.' } }
};

contexto.window.GuiasDelCentro = {
  pasosDe: function (tipo) {
    if (tipo === 'MATRICULA') return [PASO_CON_CORREO, PASO_SIN_NADA, PASO_SOLO_SENECA];
    return [];
  }
};

/* Datos de un alumno de mentira, para el tutor y para los huecos. */
contexto.window.App.E.datos = { alumnado: true };
const alumno = {
  categoria: 'ALUMNADO', nombre: 'Pérez García, Ana 1234567', id: '1234567',
  campos: {
    'Apellidos': 'Pérez García', 'Nombre': 'Ana',
    'Tutor 1 Apellidos': 'Pérez Ruiz', 'Tutor 1 Nombre': 'Luis', 'Tutor 1 Correo': 'luis@ejemplo.es'
  }
};
/* js/hitos-comunicar.js llama a `Datos` a secas (no `window.Datos`: en
   el navegador son la misma cosa, ver la nota de más arriba sobre
   `App`), así que el sustituto va en los dos sitios. */
contexto.Datos = contexto.window.Datos = {
  cargar: async function () { return { lista: [alumno] }; },
  buscar: function (lista) { return lista; }
};

const asunto1 = {
  nombre: '260918 MATRICULA Pérez García, Ana 1234567',
  ficha: { categoria: 'ALUMNADO', tercero: 'Pérez García, Ana 1234567', tipo: 'MATRICULA' },
  leido: { tipo: 'MATRICULA', resto: '' }
};

/* ================= 1 · hay botón, o no ================= */
console.log('--- 1. botón "Comunicar" solo si el paso tiene texto ---');
const hitoConCorreo = Hitos.pasoAHito(PASO_CON_CORREO);
const hitoSinNada = Hitos.pasoAHito(PASO_SIN_NADA);
comprobar('un paso con comunicacion.correo.cuerpo trae el canal "correo"',
  HitosComunicar.canalesDe(asunto1, hitoConCorreo), ['correo']);
comprobar('un paso sin nada no trae ningún canal',
  HitosComunicar.canalesDe(asunto1, hitoSinNada), []);
comprobar('sin canales, no hay botón',
  HitosComunicar.botonHTML(asunto1, hitoSinNada), '');
comprobar('con un canal, sí hay botón',
  HitosComunicar.botonHTML(asunto1, hitoConCorreo).indexOf('Comunicar') !== -1, true);

/* ========= 2 · un solo canal abre directo, sin menú ========= */
console.log('--- 2. con un solo canal, abre directo (sin FichaMenus) ---');
let capturado = null;
contexto.window.CorreoNucleo = { abrirCuadro: function (a, deSeneca, extra) { capturado = { a, deSeneca, extra }; } };
contexto.window.FichaMenus = { montar: function () { throw new Error('no debía llamarse: un solo canal no usa el menú'); } };

const hitoSoloSeneca = Hitos.pasoAHito(PASO_SOLO_SENECA);
await HitosComunicar.comunicar(asunto1, hitoSoloSeneca, 'seneca');
comprobar('abre el cuadro de Séneca (deSeneca = true)', capturado && capturado.deSeneca, true);

/* ================= 3 · el destinatario ================= */
console.log('--- 3. a quién se propone ---');
capturado = null;
const hitoParaTutor = Object.assign({}, hitoConCorreo, { responsable: 'tutor' });
await HitosComunicar.comunicar(asunto1, hitoParaTutor, 'correo');
comprobar('responsable "tutor": propone al tutor legal 1, con su correo',
  [capturado.extra.comunicarHito.nombreDestinatario, capturado.extra.correoPreferente],
  ['Pérez Ruiz, Luis', 'luis@ejemplo.es']);

capturado = null;
const hitoParaCentro = Object.assign({}, hitoConCorreo, { responsable: 'yo' });
await HitosComunicar.comunicar(asunto1, hitoParaCentro, 'correo');
comprobar('responsable de la casa: propone al tercero del asunto, sin dirección preferente',
  [capturado.extra.comunicarHito.nombreDestinatario, capturado.extra.correoPreferente],
  ['Pérez García, Ana', '']);

/* ============ 4 · los huecos del cuerpo, resueltos ============ */
console.log('--- 4. los huecos salen resueltos ---');
comprobar('el {nombre} del cuerpo se ha sustituido por el del tercero',
  capturado.extra.medioListo, 'Hola Pérez García, Ana: necesitamos que aportes un documento.');
comprobar('el {tipo} del asunto (email) se ha sustituido por el tipo del asunto',
  capturado.extra.asuntoListo, 'Sobre MATRICULA');

/* ============ 5 · el texto de la constancia ============ */
console.log('--- 5. el texto que se apunta en el historial y en las notas ---');
const hoy = U.fechaLegible(U.aAaMmDd(U.hoyIso()));
comprobar('nombra a quien se ha escrito y el canal, por correo',
  CorreoNucleoReal.textoDeComunicarHito('Pérez García, Ana', false),
  'Comunicado a Pérez García, Ana por correo · ' + hoy);
comprobar('y por Séneca',
  CorreoNucleoReal.textoDeComunicarHito('Pérez García, Ana', true),
  'Comunicado a Pérez García, Ana por Séneca · ' + hoy);
comprobar('sin destinatario, se cae en "el tercero"',
  CorreoNucleoReal.textoDeComunicarHito('', false),
  'Comunicado a el tercero por correo · ' + hoy);

/* Esa misma línea, apuntada de verdad en el historial del hito (el
   modelo: Hitos.anadirNota, ya probado en pruebas/requisitos-de-hito.mjs
   con otro texto). */
const gestorFalso = (function dirFalso(nombre) {
  const hijos = new Map();
  return {
    kind: 'directory', name: nombre, _hijos: hijos,
    async getDirectoryHandle(n, o) {
      if (!hijos.has(n)) {
        if (!o || !o.create) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
        hijos.set(n, dirFalso(n));
      }
      return hijos.get(n);
    },
    async getFileHandle(n, o) {
      if (!hijos.has(n)) {
        if (!o || !o.create) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
        hijos.set(n, {
          kind: 'file', name: n, _texto: '',
          async getFile() {
            const self = this;
            return { async arrayBuffer() { return new TextEncoder().encode(self._texto).buffer; },
                     size: new TextEncoder().encode(self._texto).length, _texto: self._texto };
          },
          async createWritable() {
            const self = this;
            return {
              async write(c) {
                if (typeof c === 'string') self._texto = c;
                else if (c && typeof c.text === 'function') self._texto = await c.text();
                else if (c && c._texto !== undefined) self._texto = c._texto;
              },
              async close() {}
            };
          }
        });
      }
      return hijos.get(n);
    },
    async removeEntry(n) { hijos.delete(n); },
    async *entries() { for (const [k, v] of hijos) yield [k, v]; }
  };
})('_GESTOR');
contexto.window.Gestor = { carpetaGestor: () => gestorFalso };

const CLAVE = 'AsuntoDePrueba';
await Hitos.cambiar((d) => { d.porAsunto[CLAVE] = { creados: U.hoyIso(), hitos: [hitoConCorreo] }; return d; });
const textoConstancia = CorreoNucleoReal.textoDeComunicarHito('Pérez García, Ana', false);
await Hitos.anadirNota(CLAVE, hitoConCorreo.id, textoConstancia);
const hitosGuardados = await Hitos.hitosDe(CLAVE);
const hitoGuardado = Hitos.buscar(hitosGuardados, hitoConCorreo.id);
comprobar('la nota queda en el historial del hito, con el texto de la constancia',
  hitoGuardado.notas.map((n) => n.texto),
  [textoConstancia]);

/* ---------- final ---------- */
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
