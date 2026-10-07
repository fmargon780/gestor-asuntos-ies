/* Prueba sin navegador de la fila 259 (docs/CONTROL-DEL-REGISTRO.md): leer los dos
   listados de Séneca (Latin-1, con eñes y acentos), guardar los apuntes y las decisiones en
   _GESTOR, y emparejar cada apunte con un asunto. Disco de mentira en memoria y los ficheros de
   verdad cargados en un contexto `vm`. Los dos CSV de `pruebas/` son inventados. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const carpetaPruebas = new URL('./', import.meta.url).pathname;

function elementoFalso() {
  return { classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, addEventListener() {},
    querySelector() { return null; }, querySelectorAll() { return []; }, remove() {}, style: {} };
}
const contexto = {
  console, TextDecoder, TextEncoder, Blob, indexedDB: null, setTimeout, clearTimeout, localStorage: null,
  document: { getElementById: elementoFalso, querySelector() { return null; }, querySelectorAll() { return []; },
    createElement: elementoFalso, addEventListener() {}, readyState: 'complete' }
};
contexto.window = contexto;
contexto.addEventListener = function () {};
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'reintentar-escritura.js', 'carpetas.js', 'cola-guardado.js',
                 'nombres.js', 'datos.js', 'control-registro.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Carpetas, ControlRegistro } = contexto;

function dirFalso(nombre) {
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
      return { async arrayBuffer() { return new TextEncoder().encode(self._texto).buffer; }, size: self._texto.length, _texto: self._texto };
    },
    async createWritable() {
      const self = this;
      return {
        async write(cosa) {
          if (typeof cosa === 'string') self._texto = cosa;
          else if (cosa && typeof cosa.text === 'function') self._texto = await cosa.text();
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

const gestor = dirFalso('_GESTOR');
contexto.Gestor = { carpetaGestor: () => gestor, alRefrescar: [] };
contexto.App = { E: { usuario: 'Prueba', gestor, registro: { asuntos: {} } } };

const latin1 = (f) => new TextDecoder('windows-1252').decode(fs.readFileSync(carpetaPruebas + f));
const ENTRADA = latin1('control-registro-entrada.csv');
const SALIDA = latin1('control-registro-salida.csv');

/* ---------- 1. leer los listados ---------- */
console.log('--- 1. leer los listados ---');
const e = ControlRegistro.leerCsv(ENTRADA);
const s = ControlRegistro.leerCsv(SALIDA);
comprobar('la entrada se reconoce como entrada, por sus columnas', [e.ok, e.libro, e.apuntes.length], [true, 'E', 6]);
comprobar('la salida se reconoce como salida (título «Nº .Registro»)', [s.ok, s.libro, s.apuntes.length], [true, 'S', 4]);
comprobar('el código sale como el de los documentos (26EM0430, 26EA0447)', [e.apuntes[0].codigo, e.apuntes[1].codigo], ['26EM0430', '26EA0447']);
comprobar('la cola « - » y « - 1» del número de salida se tira', [s.apuntes[0].codigo, s.apuntes[2].codigo], ['26SM0674', '26SM0670']);
comprobar('las eñes y los acentos se leen bien', e.apuntes[0].parte, 'Núñez Peña, Begoña');
comprobar('la fecha de registro sale en formato ISO y el estado se normaliza', [e.apuntes[0].fecha, e.apuntes[2].estado, e.apuntes[4].estado], ['2026-10-02', 'incompleto', 'anulado']);
comprobar('un fichero que no es de Séneca se rechaza', ControlRegistro.leerCsv('a;b\n1;2\n').ok, false);
comprobar('un fichero con las dos columnas se rechaza', ControlRegistro.leerCsv('"Nº.Registro","Remitente","Destinatario"\n"2026/1/M1","a","b"\n').ok, false);

/* ---------- 2. sin fecha no se sube ---------- */
console.log('--- 2. subir ---');
const sinFecha = await ControlRegistro.subir([{ nombre: 'a.csv', texto: ENTRADA }]);
comprobar('sin «Revisar desde» no sube nada', sinFecha.ok, false);
comprobar('y no guarda nada', (await ControlRegistro.cargar()).apuntes, {});

await ControlRegistro.ponerDesde('2026-09-01');
const r = await ControlRegistro.subir([{ nombre: 'RegLibEntCen.csv', texto: ENTRADA }, { nombre: 'RegLibSalCen.csv', texto: SALIDA }]);
comprobar('sube los dos a la vez: cuentas y fuera de fecha', r.porLibro, { E: { total: 6, nuevos: 5, fuera: 1 }, S: { total: 4, nuevos: 4, fuera: 0 } });
let estado = await ControlRegistro.cargar();
comprobar('un apunte anterior a la fecha no se guarda', !!estado.apuntes['26EM0420'], false);
comprobar('se guardan 9 apuntes en el fichero del año 2026', Object.keys(estado.apuntes).length, 9);
comprobar('«hasta» de cada libro', [estado.control.subidas.E.hasta, estado.control.subidas.S.hasta], ['2026-10-02', '2026-10-02']);
const r2 = await ControlRegistro.subir([{ nombre: 'RegLibEntCen.csv', texto: ENTRADA }]);
comprobar('volver a subir no duplica nada', [r2.porLibro.E.nuevos, Object.keys((await ControlRegistro.cargar()).apuntes).length], [0, 9]);
comprobar('un fichero ajeno se rechaza sin guardar', (await ControlRegistro.subir([{ nombre: 'x.csv', texto: 'a;b\n' }])).rechazados.length, 1);

/* ---------- 3. emparejar ---------- */
console.log('--- 3. emparejar con los asuntos ---');
const asuntos = [
  { nombre: '261001 A26-0014 CERT. MATRICULA López Gil, Luis 7654321', numero: 'A26-0014', abierto: true, tercero: 'López Gil, Luis', registros: ['26SM0674'] },
  { nombre: '261002 A26-0024 INSTANCIA Pérez Ruiz, Ana 1234567', numero: 'A26-0024', abierto: true, tercero: 'Pérez Ruiz, Ana', registros: [] },
  { nombre: 'SOLICITUD de beca Núñez Peña, Begoña 7654321', numero: '', abierto: false, tercero: 'Núñez Peña, Begoña', registros: [] },
  { nombre: '250101 ARCHIVADO', numero: 'A25-0001', abierto: false, tercero: 'X', registros: ['26EM0427', '26EM0500'] }
];
let c = ControlRegistro.clasificar(estado, asuntos);
const codigos = (l) => l.map((x) => x.apunte.codigo);
comprobar('por el registro de un documento (abierto) -> con asunto', c.S.con.map((x) => [x.apunte.codigo, x.nota]).filter((x) => x[0] === '26SM0674'), [['26SM0674', false]]);
comprobar('por el registro de un asunto archivado -> con asunto', c.E.con.filter((x) => x.apunte.codigo === '26EM0427').length, 1);
comprobar('por el número A26-0024 del extracto, con la nota gris', c.E.con.filter((x) => x.apunte.codigo === '26EM0428').map((x) => x.nota), [true]);
comprobar('por el nombre de la carpeta, con la nota gris', c.E.con.filter((x) => x.apunte.codigo === '26EM0430').map((x) => x.nota), [true]);
comprobar('un apunte anulado solo sale en Anulados', [codigos(c.E.anulados), codigos(c.S.anulados), codigos(c.E.sin).includes('26EM0426')], [['26EM0426'], ['26SM0669'], false]);
comprobar('sin asunto, lo más nuevo arriba', [codigos(c.E.sin), codigos(c.S.sin)], [['26EA0447'], ['26SM0670', '26SM0666']]);

/* ---------- 4. decisiones ---------- */
console.log('--- 4. decisiones ---');
await ControlRegistro.decidir('26EA0447', { que: 'no-necesita' });
estado = await ControlRegistro.cargar();
c = ControlRegistro.clasificar(estado, asuntos);
comprobar('«No necesita asunto» lo saca de «Sin asunto»', [codigos(c.E.sin), codigos(c.E.no)], [[], ['26EA0447']]);
await ControlRegistro.quitarDecision('26EA0447');
c = ControlRegistro.clasificar(await ControlRegistro.cargar(), asuntos);
comprobar('«Sí necesita asunto» lo devuelve', codigos(c.E.sin), ['26EA0447']);

comprobar('la clase afecta a 2 apuntes sin asunto', ControlRegistro.cuantosDeUnaClase(c, 'S', 'Oficios'), 2);
await ControlRegistro.ponerClaseSinAsunto('S', 'Oficios');
c = ControlRegistro.clasificar(await ControlRegistro.cargar(), asuntos);
comprobar('«Esta clase nunca lleva asunto» los pasa todos', [codigos(c.S.sin), codigos(c.S.no)], [[], ['26SM0670', '26SM0666']]);
await ControlRegistro.subir([{ nombre: 'n.csv', texto: SALIDA.replace('"2026/29700692/M000000000666 - "', '"2026/29700692/M000000000700 - "') }]);
c = ControlRegistro.clasificar(await ControlRegistro.cargar(), asuntos);
comprobar('un apunte nuevo de esa clase entra directo en «No necesitan asunto»', codigos(c.S.no).includes('26SM0700'), true);
await ControlRegistro.quitarClaseSinAsunto('S', 'Oficios');
c = ControlRegistro.clasificar(await ControlRegistro.cargar(), asuntos);
comprobar('«✕ Quitar» la clase los devuelve a «Sin asunto»', codigos(c.S.sin).includes('26SM0670'), true);

await ControlRegistro.decidir('26EA0447', { que: 'asunto', numero: 'A26-0014', carpeta: 'x' });
c = ControlRegistro.clasificar(await ControlRegistro.cargar(), asuntos);
comprobar('«Es de este asunto…» -> con asunto, con nota gris', c.E.con.filter((x) => x.apunte.codigo === '26EA0447').map((x) => x.nota), [true]);
comprobar('si el asunto ya no se encuentra, el apunte reaparece en «Sin asunto»',
  codigos(ControlRegistro.clasificar(await ControlRegistro.cargar(), []).E.sin).includes('26EA0447'), true);

/* ---------- 5. huecos y sobrantes ---------- */
console.log('--- 5. huecos y registros que no están en Séneca ---');
estado = await ControlRegistro.cargar();
const h = ControlRegistro.huecos(estado.apuntes);
comprobar('salto de numeración en la entrada manual (0426..0430, falta el 0429)', h.filter((x) => x.libro === 'E' && x.serie === 'M').map((x) => [x.faltan, x.desde, x.hasta]), [[1, 426, 430]]);
comprobar('texto de la línea ámbar', ControlRegistro.textoHueco(h.filter((x) => x.libro === 'E')[0]), 'Faltan 1 número de entrada (serie manual) entre el 0426 y el 0430: ¿el listado está completo?');
const conSobrante = asuntos.concat([{ nombre: 'otro', numero: '', abierto: true, tercero: '', registros: ['26EM0429', '26EM0440', '26SM0001'] }]);
comprobar('en la aplicación y no en Séneca: solo dentro del rango', ControlRegistro.sobrantes(estado.apuntes, conSobrante).map((x) => x.codigo), ['26EM0429']);

/* ---------- 6. adelantar y atrasar la fecha ---------- */
console.log('--- 6. «Revisar desde» ---');
const adelanto = await ControlRegistro.ponerDesde('2026-10-01');
estado = await ControlRegistro.cargar();
comprobar('adelantarla quita lo anterior', [adelanto.atrasa, Object.values(estado.apuntes).every((a) => a.fecha >= '2026-10-01')], [false, true]);
comprobar('atrasarla avisa de que hay que volver a subir', (await ControlRegistro.ponerDesde('2026-09-01')).atrasa, true);

/* ---------- 7. avisos ---------- */
console.log('--- 7. avisos de Inicio ---');
const vacio = { control: { desde: '', subidas: {}, decisiones: {}, clasesSinAsunto: { E: [], S: [] } }, apuntes: {} };
comprobar('sin fecha «Revisar desde», ningún aviso', ControlRegistro.resumenParaAvisos(vacio, ControlRegistro.clasificar(vacio, []), 7, '2026-10-02').activo, false);
estado = await ControlRegistro.cargar();
c = ControlRegistro.clasificar(estado, asuntos);
/* Las subidas de arriba se guardan con la hora de verdad; las fechas «de hoy» y «dentro de 10 días» se
   calculan desde el día real (7-oct-2026, fila 302: con fechas fijas la prueba caducaba sola). */
function enDias(n) { const d = new Date(ControlRegistro.hoyIso() + 'T12:00:00'); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const fresco = ControlRegistro.resumenParaAvisos(estado, c, 7, enDias(0));
comprobar('subido hoy: ninguno atrasado', fresco.atrasados, []);
const tarde = ControlRegistro.resumenParaAvisos(estado, c, 7, enDias(10));
comprobar('subido hace 10 días: atrasados los dos libros', tarde.atrasados.map((x) => x.libro), ['E', 'S']);
const unSolo = JSON.parse(JSON.stringify(estado));
unSolo.control.subidas.E.el = enDias(8) + 'T10:00:00.000Z';
comprobar('solo uno atrasado: solo ese', ControlRegistro.resumenParaAvisos(unSolo, c, 7, enDias(10)).atrasados.map((x) => x.libro), ['S']);

if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
