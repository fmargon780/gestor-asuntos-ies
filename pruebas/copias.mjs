/* Prueba de las copias de seguridad y del fichero roto (bloque 1 del
   plan de robustez), con un disco de mentira en memoria.

   Comprueba:
   - Carpetas.leerJson distingue "no existe" (null) de "está roto"
     (lanza FicheroRoto).
   - Copias.guardar guarda una copia del contenido de ANTES, una vez
     al día, antes de escribir encima.
   - Se conservan como mucho 30 copias de cada fichero.
   - Las copias de más de 90 días (por defecto, fila 72) se borran aunque
     no se hayan llegado a las 30.
   - Copias.comprobarTodos encuentra los ficheros rotos.
   - Copias.restaurar aparta el roto y trae la última copia. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, TextDecoder, Blob, window: {}, indexedDB: null };
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { U, Carpetas, Copias } = contexto;

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

/* AAMMDD de hace `n` días, con el mismo formato que llevan los nombres
   de las copias. */
function aammddHaceNDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const dos = (x) => String(x).padStart(2, '0');
  return String(d.getFullYear()).slice(2) + dos(d.getMonth() + 1) + dos(d.getDate());
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

/* ---------- no existe, frente a roto ---------- */
comprobar('un fichero que no existe da null',
  await Carpetas.leerJson(gestor, 'estados.json'), null);

await Carpetas.escribirTexto(gestor, 'guias.json', '{"MATRICULA": [roto');
let fueRoto = false;
try { await Carpetas.leerJson(gestor, 'guias.json'); }
catch (e) { fueRoto = (e.name === 'FicheroRoto' && e.fichero === 'guias.json'); }
comprobar('un fichero que existe pero no se interpreta lanza FicheroRoto', fueRoto, true);

/* ---------- una copia por fichero y día ---------- */
await Copias.guardar(gestor, 'asuntos.json', { asuntos: { uno: 1 } });
comprobar('la primera vez no hay nada que copiar, porque el fichero no existía',
  (await Copias.listar(gestor, 'asuntos.json')).length, 0);

await Copias.guardar(gestor, 'asuntos.json', { asuntos: { uno: 1, dos: 2 } });
const copiasTrasSegunda = await Copias.listar(gestor, 'asuntos.json');
comprobar('la segunda vez sí se copia lo que había', copiasTrasSegunda.length, 1);
const carpetaCopiasAsuntos = await gestor.getDirectoryHandle('copias');
comprobar('la copia guarda el contenido de ANTES del cambio',
  JSON.parse(await Carpetas.leerTexto(carpetaCopiasAsuntos, copiasTrasSegunda[0].nombre)),
  { asuntos: { uno: 1 }, _esquema: Copias.ESQUEMA });

await Copias.guardar(gestor, 'asuntos.json', { asuntos: { uno: 1, dos: 2, tres: 3 } });
comprobar('un segundo guardado el mismo día no hace una segunda copia',
  (await Copias.listar(gestor, 'asuntos.json')).length, 1);
comprobar('pero el fichero sí lleva el contenido nuevo',
  await Carpetas.leerJson(gestor, 'asuntos.json'), { asuntos: { uno: 1, dos: 2, tres: 3 }, _esquema: Copias.ESQUEMA });

/* ---------- como mucho 30 copias ---------- */
const copiasCarpeta = await gestor.getDirectoryHandle('copias');
for (let i = 1; i <= 35; i++) {
  /* De hace i días (no fechas fijas de enero): así ninguna de las 35 le
     coge la caducidad, que la prueba siguiente comprueba por su cuenta,
     y esta se queda solo con lo que probaba de partida: el número. */
  await Carpetas.escribirTexto(copiasCarpeta, 'estados-' + aammddHaceNDias(i) + '.json', '[]');
}
comprobar('de partida hay 35 copias de mentira', (await Copias.listar(gestor, 'estados.json')).length, 35);
await Carpetas.guardarJson(gestor, 'estados.json', ['PENDIENTE']);
await Copias.guardar(gestor, 'estados.json', ['PENDIENTE', 'RESUELTO']);
comprobar('se podan hasta quedar 30', (await Copias.listar(gestor, 'estados.json')).length, 30);

/* ---------- caducidad: se borran aunque no lleguen a 30 (fila 72,
   docs/DETALLES-DE-MANTENIMIENTO.md, punto 4) ---------- */
await Carpetas.escribirTexto(copiasCarpeta, 'recurrentes-' + aammddHaceNDias(100) + '.json', '[]');
await Carpetas.escribirTexto(copiasCarpeta, 'recurrentes-' + aammddHaceNDias(10) + '.json', '[]');
comprobar('de partida hay dos copias de mentira, ninguna cerca de las 30',
  (await Copias.listar(gestor, 'recurrentes.json')).length, 2);
await Carpetas.guardarJson(gestor, 'recurrentes.json', []);
await Copias.guardar(gestor, 'recurrentes.json', [{ tipo: 'MATRICULA' }]);
const trasCaducidad = await Copias.listar(gestor, 'recurrentes.json');
comprobar('la de hace 100 días (más de los 90 por defecto) se ha borrado',
  trasCaducidad.some((c) => c.fecha === aammddHaceNDias(100)), false);
comprobar('la de hace 10 días, dentro de los 90, sigue ahí',
  trasCaducidad.some((c) => c.fecha === aammddHaceNDias(10)), true);

/* ---------- comprobarTodos ---------- */
comprobar('comprobarTodos encuentra el guias.json roto',
  await Copias.comprobarTodos(gestor), ['guias.json']);

/* ---------- restaurar ---------- */
await Copias.guardar(gestor, 'tipos.json', [{ tipo: 'MATRICULA', categoria: 'ALUMNADO' }]);
await Copias.guardar(gestor, 'tipos.json',
  [{ tipo: 'MATRICULA', categoria: 'ALUMNADO' }, { tipo: 'COMPRA', categoria: 'OTROS' }]);
await Carpetas.escribirTexto(gestor, 'tipos.json', '{esto no es json ni parecido');

const restaurado = await Copias.restaurar(gestor, 'tipos.json');
comprobar('restaurar dice que sí había una copia', restaurado, true);
comprobar('el fichero vuelve a leerse, con el contenido de antes de romperse',
  await Carpetas.leerJson(gestor, 'tipos.json'), [{ tipo: 'MATRICULA', categoria: 'ALUMNADO' }]);

const trasRestaurar = await Carpetas.ficheros(copiasCarpeta);
comprobar('el fichero roto se aparta con fecha y hora, y no se pierde',
  trasRestaurar.some(f => /^tipos-roto-\d{6}-\d{4}\.json$/.test(f.nombre)), true);

comprobar('restaurar sin ninguna copia dice que no hay nada que hacer',
  await Copias.restaurar(gestor, 'frescura.json'), false);

/* ============================================================
   Fila 178 (docs/CORREO-VERSIONES-Y-LIMPIEZA.md): _esquema y la
   copia del día verificada.
   ============================================================ */

console.log('--- _esquema (punto 3) ---');

/* Un fichero sin _esquema todavía (de antes de esta fila) escribe
   bien y se lo añade. */
await Carpetas.guardarJson(gestor, 'usuarios.json', { nombres: ['Ana'] });
await Copias.guardar(gestor, 'usuarios.json', { nombres: ['Ana', 'Luis'] });
comprobar('sin _esquema previo, escribe y lo añade',
  (await Carpetas.leerJson(gestor, 'usuarios.json'))._esquema, Copias.ESQUEMA);

/* El primer guardado de un fichero nuevo también lo añade. */
await Copias.guardar(gestor, 'grupos.json', { grupos: [{ id: 'g1' }] });
comprobar('un fichero recién creado también lleva _esquema',
  (await Carpetas.leerJson(gestor, 'grupos.json'))._esquema, Copias.ESQUEMA);

/* Si en disco hay un _esquema MAYOR (el otro ordenador tiene una
   versión más nueva), no se escribe: EsquemaMasNuevo, y lo que había
   no se toca. */
const conEsquemaFuturo = { grupos: [{ id: 'del-futuro' }], _esquema: Copias.ESQUEMA + 1 };
await Carpetas.guardarJson(gestor, 'grupos.json', conEsquemaFuturo);
let lanzoEsquemaMasNuevo = false;
try { await Copias.guardar(gestor, 'grupos.json', { grupos: [{ id: 'g2' }] }); }
catch (e) { lanzoEsquemaMasNuevo = (e.name === 'EsquemaMasNuevo'); }
comprobar('un _esquema mayor en disco no se escribe: EsquemaMasNuevo', lanzoEsquemaMasNuevo, true);
comprobar('lo que había (del "futuro") no se ha pisado',
  await Carpetas.leerJson(gestor, 'grupos.json'), conEsquemaFuturo);

/* Sobre un _esquema igual, escribe sin problema. */
await Copias.guardar(gestor, 'tablon.json', { notas: [], _esquema: Copias.ESQUEMA });
comprobar('con el mismo _esquema, escribe normal',
  (await Carpetas.leerJson(gestor, 'tablon.json')).notas, []);

/* tipos.json es una lista: _esquema no le cabe (JSON.stringify lo
   ignoraría sin avisar), así que no se le añade. */
await Copias.guardar(gestor, 'estados.json', ['PENDIENTE', 'RESUELTO', 'DE_NUEVO']);
comprobar('una lista no lleva _esquema (no cabría)',
  Array.isArray(await Carpetas.leerJson(gestor, 'estados.json')), true);

/* guias.json tampoco: su primer nivel es un diccionario dinámico por
   tipo (js/cargar-biblioteca.js y otros lo recorren con for...in
   esperando que cada clave sea un tipo con su lista de pasos; una
   clave más, _esquema, lo rompería igual que en una lista).
   Se deja primero en buen estado: más arriba se dejó a propósito roto
   para la prueba de FicheroRoto, y una copia fiel de ese roto tampoco
   se podría releer como JSON (otro motivo más para no tocarlo aquí). */
await Carpetas.escribirTexto(gestor, 'guias.json', '{}');
await Copias.guardar(gestor, 'guias.json', { MATRICULA: [{ id: 'p1' }] });
comprobar('guias.json tampoco lleva _esquema (diccionario dinámico por tipo)',
  (await Carpetas.leerJson(gestor, 'guias.json'))._esquema, undefined);

console.log('--- copia del día verificada (punto 5) ---');

/* Se prepara un fichero con copia todavía sin hacer hoy. */
await Copias.guardar(gestor, 'campos.json', { propios: [], porTipo: {} });

/* Se intercepta la copia del día para que, tras escribirla, no se
   pueda releer como JSON (simulando una escritura que llega mal al
   disco): la escritura de verdad ocurre (el fichero "existe"), pero
   su contenido queda corrupto justo después. */
const nombreCopiaHoy = 'campos-' + aammddHaceNDias(0) + '.json';
const getFileDeVerdadCopias = copiasCarpeta.getFileHandle.bind(copiasCarpeta);
copiasCarpeta.getFileHandle = async function (n, o) {
  const h = await getFileDeVerdadCopias(n, o);
  if (n === nombreCopiaHoy && !h.__interceptado) {
    h.__interceptado = true;
    const createWritableDeVerdad = h.createWritable.bind(h);
    h.createWritable = async function () {
      const w = await createWritableDeVerdad();
      return {
        async write(cosa) { await w.write(cosa); h._texto = 'ESTO NO ES JSON, A PROPÓSITO'; },
        async close() { await w.close(); }
      };
    };
  }
  return h;
};

let lanzoCopiaNoVerificada = false;
try { await Copias.guardar(gestor, 'campos.json', { propios: ['algo'], porTipo: {} }); }
catch (e) { lanzoCopiaNoVerificada = (e.name === 'CopiaNoVerificada'); }
comprobar('la copia que no se puede releer no deja escribir el original: CopiaNoVerificada',
  lanzoCopiaNoVerificada, true);
comprobar('el original no se ha tocado',
  (await Carpetas.leerJson(gestor, 'campos.json')).propios, []);

console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas pasan.');
process.exit(fallos ? 1 : 0);
