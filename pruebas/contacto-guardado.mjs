/* Prueba de la fila 66 (docs/CONTACTO-GUARDADO-EN-LA-FICHA.md): la
   foto del contacto de un tercero, guardada en `ficha.contacto` al
   crear el asunto, para cuando esa persona ya no esté en el CSV.

   Sin navegador, con el disco de mentira en memoria (el mismo patrón
   que pruebas/ficha-del-archivo.mjs), cargando en un contexto vm:
   util.js, carpetas.js, copias.js, nucleo.js, datos.js, ficha-
   tercero.js y contacto-migracion.js. `FichaTercero._buscarPersona` y
   `ContactoMigracion._rellenarTodos` se exponen solo para estas
   pruebas: la cascada de verdad (CSV -> ficha.contacto -> nada) es la
   misma que usa la aplicación. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function elementoFalso() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {}, addEventListener() {}, querySelector() { return null; },
    style: {}
  };
}
const contexto = {
  console, TextDecoder, Blob, indexedDB: null,
  navigator: { clipboard: null },
  document: {
    getElementById: elementoFalso,
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: elementoFalso,
    addEventListener: function () {},
    readyState: 'complete'
  }
};
contexto.window = contexto;
contexto.addEventListener = function () {};
vm.createContext(contexto);
for (const f of ['util.js', 'carpetas.js', 'copias.js', 'nucleo.js', 'datos.js',
                  'ficha-tercero.js', 'contacto-migracion.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { App, Carpetas, Datos, FichaTercero, ContactoMigracion } = contexto;

contexto.U.preguntar = async function () { return true; };
contexto.U.aviso = function () {};
contexto.U.mientrasGuarda = async function (el, hacer) { return hacer(); };

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
      return hijos.get(n);
    },
    async removeEntry(n) {
      if (!hijos.has(n)) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
      hijos.delete(n);
    },
    async *entries() { for (const par of hijos) yield par; }
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

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarVerdad(titulo, real) { comprobar(titulo, !!real, true); }

/* ---------- el disco: abiertos, archivo, datos, _GESTOR ---------- */
const abiertos = dirFalso('abiertos');
const archivo = dirFalso('archivo');
const datos = dirFalso('datos');
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
App.E.abiertos = abiertos;
App.E.archivo = archivo;
App.E.datos = datos;
App.E.gestor = gestor;
App.E.usuario = 'Francisco';
App.E.tipos = [];

async function escribirAsuntos(objeto) {
  const h = await gestor.getFileHandle('asuntos.json', { create: true });
  await (await h.createWritable()).write(JSON.stringify(objeto));
}

const CABECERA_REGALUM = [
  'Alumno/a', 'Nº Id. Escolar', 'Curso', 'Unidad', 'Año de la matrícula',
  'Estado Matrícula', 'Fecha de nacimiento', 'Tutor 1 Nombre', 'Tutor 1 Teléfono',
  'Tutor 1 Correo', 'Teléfono móvil', 'Correo electrónico'
];

function filaAna(telefonoTutor) {
  return ['García López, Ana', '1234', '1º ESO A', '1ESOA', '2026', '',
          '2012-03-05', 'García Pérez, Juan', telefonoTutor, 'juan@ejemplo.es', '', ''];
}

async function escribirRegAlum(filas) {
  const texto = Datos.aCsv(CABECERA_REGALUM, filas);
  await Carpetas.escribirTexto(datos, 'RegAlum-260901.csv', texto);
  Datos.olvidar('ALUMNADO');
}

/* ================================================================
   1. Crear un asunto con un alumno que está en el CSV: la ficha
   guarda su bloque de contacto.
   ================================================================ */
console.log('--- 1. crear el asunto guarda la foto del contacto ---');

await escribirRegAlum([filaAna('600222222')]);

const fuenteInicial = await Datos.cargar(App.E.datos, 'ALUMNADO');
const anaInicial = Datos.buscar(fuenteInicial.lista, 'García López Ana 1234', 1)[0];
comprobarVerdad('encuentra a Ana en el CSV', anaInicial);

const contacto = Datos.fotoDeContacto(anaInicial, 'ALUMNADO');
comprobar('la foto guarda el nombre', contacto.nombre, 'García López, Ana');
comprobar('la foto guarda de qué fichero sale', contacto.fichero, 'RegAlum.csv');
comprobar('la foto trae el teléfono del tutor', contacto.campos['Tutor 1 Teléfono'], '600222222');
comprobarVerdad('la foto trae la fecha de guardado', contacto.fecha);

const NOMBRE = '260901 MATRICULA 26-27 García López, Ana 1234';
await abiertos.getDirectoryHandle(NOMBRE, { create: true });
await App.cargarRegistro();
await App.anotar(NOMBRE, {
  estado: 'abierto', tipo: 'MATRICULA', categoria: 'ALUMNADO',
  tercero: 'García López, Ana 1234', contacto: contacto
});
comprobarVerdad('el asunto se ha guardado con su foto de contacto',
  App.E.registro.asuntos[NOMBRE] && App.E.registro.asuntos[NOMBRE].contacto);

/* ================================================================
   2. Con el alumno todavía en el CSV, la ficha enseña los datos del
   CSV, no los guardados: si cambia el teléfono en el CSV, se ve el
   nuevo.
   ================================================================ */
console.log('--- 2. con el alumno en el CSV, manda el CSV ---');

const ficha1 = App.E.registro.asuntos[NOMBRE];
const r1 = await FichaTercero._buscarPersona({ ficha: ficha1 });
comprobar('encuentra a la persona', !!r1.persona, true);
comprobar('no es una foto: viene del CSV', !!r1.persona.foto, false);
comprobar('el teléfono del tutor es el de hoy en el CSV',
  Datos.tutoresDe(r1.persona)[0].telefonos[0], '600222222');

await escribirRegAlum([filaAna('600999999')]);
const r2 = await FichaTercero._buscarPersona({ ficha: ficha1 });
comprobar('cambia el teléfono en el CSV y se ve el nuevo',
  Datos.tutoresDe(r2.persona)[0].telefonos[0], '600999999');

/* ================================================================
   3. Se quita al alumno del CSV: la ficha sigue enseñando teléfono,
   correo y tutores, con el aviso de que son datos guardados.
   ================================================================ */
console.log('--- 3. sin el alumno en el CSV, manda la foto guardada ---');

await escribirRegAlum([]);
const r3 = await FichaTercero._buscarPersona({ ficha: ficha1 });
comprobar('ya no está en el CSV: usa la foto', !!r3.persona.foto, true);
comprobar('la foto trae el teléfono del tutor guardado',
  Datos.tutoresDe(r3.persona)[0].telefonos[0], '600222222');
comprobar('la foto trae el correo del tutor guardado',
  Datos.tutoresDe(r3.persona)[0].correos[0], 'juan@ejemplo.es');
comprobar('la foto dice de qué fecha es', r3.persona.fotoFecha, contacto.fecha);
comprobar('la foto dice de qué fichero salió', r3.persona.fotoFichero, 'RegAlum.csv');

/* ================================================================
   4. Un asunto sin bloque de contacto y con el tercero fuera del CSV
   se comporta como hoy: sin datos, sin romperse.
   ================================================================ */
console.log('--- 4. sin CSV y sin foto: sin datos, sin romperse ---');

const r4 = await FichaTercero._buscarPersona({
  ficha: { categoria: 'ALUMNADO', tercero: 'Nadie De Verdad, Zzz 0000' }
});
comprobar('no encuentra a nadie', r4.persona, null);
comprobarVerdad('avisa en vez de romperse', r4.aviso);

/* ================================================================
   5. El botón de rellenar los abiertos hace lo que dice y cuenta
   bien: rellena el que puede, cuenta el que no encuentra, y no toca
   el que ya tenía foto.
   ================================================================ */
console.log('--- 5. rellenar el contacto de los asuntos abiertos ---');

await escribirRegAlum([
  filaAna('600222222'),
  ['Otro Alumno, Inés', '5555', '2º ESO B', '2ESOB', '2026', '', '2011-04-01',
   '', '', '', '611000000', 'ines@ejemplo.es']
]);

const NOMBRE_SIN_CONTACTO = '260902 MATRICULA 26-27 Otro Alumno, Inés 5555';
const NOMBRE_SIN_ENCONTRAR = '260903 MATRICULA 26-27 Nadie De Verdad, Zzz 0000';
const NOMBRE_CERRADO = '260801 MATRICULA 25-26 García López, Ana 1234';
await App.guardarRegistroFresco(function (registro) {
  registro.asuntos[NOMBRE_SIN_CONTACTO] = {
    estado: 'abierto', categoria: 'ALUMNADO', tercero: 'Otro Alumno, Inés 5555'
  };
  registro.asuntos[NOMBRE_SIN_ENCONTRAR] = {
    estado: 'abierto', categoria: 'ALUMNADO', tercero: 'Nadie De Verdad, Zzz 0000'
  };
  registro.asuntos[NOMBRE_CERRADO] = {
    estado: 'cerrado', categoria: 'ALUMNADO', tercero: 'García López, Ana 1234'
  };
});

const pendientesAntes = ContactoMigracion._abiertosSinContacto();
comprobar('antes de rellenar: dos abiertos sin foto (el cerrado no cuenta, ni el que ya tiene)',
  pendientesAntes.sort(), [NOMBRE_SIN_CONTACTO, NOMBRE_SIN_ENCONTRAR].sort());

const resultado = await ContactoMigracion._rellenarTodos();
comprobar('rellena uno', resultado.rellenados, 1);
comprobar('uno sin encontrar', resultado.sinEncontrar, [NOMBRE_SIN_ENCONTRAR]);

const fichaRellenada = App.E.registro.asuntos[NOMBRE_SIN_CONTACTO];
comprobarVerdad('el asunto rellenado ya tiene su foto', fichaRellenada.contacto);
comprobar('la foto rellenada es de la persona correcta', fichaRellenada.contacto.nombre, 'Otro Alumno, Inés');

comprobar('el que ya tenía foto no se ha tocado',
  App.E.registro.asuntos[NOMBRE].contacto.fecha, contacto.fecha);
comprobar('el cerrado sigue sin foto (no se toca)',
  !!App.E.registro.asuntos[NOMBRE_CERRADO].contacto, false);

/* ================================================================
   6. Los solicitantes de un curso que no es el de hoy se apartan a
   solicitantes-anteriores.csv sin borrarse (2.4 del encargo).
   ================================================================ */
console.log('--- 6. apartar solicitantes de cursos anteriores ---');

const cursoDeHoy = contexto.U.cursoActual();
await Datos.anadirALista(datos, 'ALUMNADO', {
  Nombre: 'Solicitante Nuevo, Uno', 'Curso de alta': cursoDeHoy
});
await Datos.anadirALista(datos, 'ALUMNADO', {
  Nombre: 'Solicitante Viejo, Dos', 'Curso de alta': '20-21'
});

comprobar('cuenta uno de curso anterior', await Datos.contarSolicitantesAnteriores(datos), 1);

const apartados = await Datos.apartarSolicitantesAnteriores(datos);
comprobar('aparta uno', apartados, 1);
comprobar('ya no quedan de cursos anteriores', await Datos.contarSolicitantesAnteriores(datos), 0);

const textoSolicitantes = await Carpetas.leerTexto(datos, 'solicitantes.csv');
comprobar('el de hoy se queda en solicitantes.csv',
  textoSolicitantes.indexOf('Solicitante Nuevo, Uno') !== -1, true);
comprobar('el viejo ya no está en solicitantes.csv',
  textoSolicitantes.indexOf('Solicitante Viejo, Dos') !== -1, false);

const textoAnteriores = await Carpetas.leerTexto(datos, 'solicitantes-anteriores.csv');
comprobar('el viejo se ha apartado, no borrado',
  textoAnteriores.indexOf('Solicitante Viejo, Dos') !== -1, true);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
