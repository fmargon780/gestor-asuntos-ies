/* Fila 299 (7-oct-2026, docs/CORREO-AL-TUTOR-DEL-GRUPO.md), sin navegador: la regla de quién es el tutor o tutora del
   grupo de un alumno (`TutorDelGrupo.decidir`, pura), y las otras dos reglas puras de la fila:
   qué dirección escrita a mano se recuerda (`CorreoTutor.aRecordar`) y qué documento marca sola una plantilla
   (`CorreoAdjuntoPlantilla.elegirDocumento`).

   1. Una unidad con un tutor en vigor: ese, con su correo de PERSONAL.
   2. «1º ESO A», «1ºESO-A» y «1 E.S.O. A» son la misma unidad; «A» y «B», no.
   3. Uno que cesó ayer no sale; uno que empieza mañana, tampoco; sin `hasta`, sale.
   4. Dos en vigor: salen los dos.
   5. Filas de otro curso o del bloque de Pedagogía Terapéutica: no cuentan.
   6. Tercero que no es de ALUMNADO, asunto de grupo, alumno sin unidad, sin tabla, sin tutor: lista vacía y su motivo.
   7. Tutor sin correo en PERSONAL y con uno recordado: sale el recordado, marcado como escrito a mano.
   8. Qué dirección se recuerda: con un tutor sin correo y una dirección nueva, esa; con dos y dos, ninguna; con «Cambiar», la nueva.
   9. El documento que marca sola la plantilla: el más reciente del tipo, con el PDF antes que el Word. */
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const raiz = new URL('../js/', import.meta.url).pathname;
const dom = new JSDOM('');
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const contexto = { console, window: {}, document: dom.window.document };
vm.createContext(contexto);
contexto.window.Destinatarios = contexto.Destinatarios = { RE_CORREO: /[^\s,;<>()"]+@[^\s,;<>()"]+\.[A-Za-z]{2,}/g };
for (const f of ['util.js', 'tutor-del-grupo.js', 'correo-tutor.js', 'correo-adjunto-plantilla.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
  Object.keys(contexto.window).forEach((k) => { if (!(k in contexto) || contexto[k] === undefined) contexto[k] = contexto.window[k]; });
}
const { TutorDelGrupo, CorreoTutor, CorreoAdjuntoPlantilla } = contexto.window;

const HOY = '2026-10-07';
const PT = 'Pedagogía Terapéutica, Audición y Lenguaje o Diversificación';
const fila = (grupo, nombre, clave, desde, hasta, curso) => ({ curso: curso || '2026/2027', grupo, nombre, dni: clave + 'X', clave, desde, hasta });
const base = (extra) => Object.assign({ esAlumnado: true, unidad: '1º ESO A', hayTabla: true, hoy: HOY, grupoAtencion: PT,
  filas: [fila('1º ESO A', 'Pérez Gómez, Juana', '111', '2026-09-01', '2027-08-31')],
  correosPorClave: { '111': ['juana@correo.es'] }, recordados: {} }, extra || {});
const nombres = (r) => r.tutores.map((t) => t.nombre);

/* 1 */
console.log('--- 1. un tutor en vigor ---');
const r1 = TutorDelGrupo.decidir(base());
comprobar('1. sale ese tutor, con su correo de PERSONAL', r1.tutores, [{ nombre: 'Pérez Gómez, Juana', clave: '111', correos: ['juana@correo.es'], aMano: false, cuando: '' }]);
comprobar('1. sin motivo, y con su unidad', [r1.motivo, r1.unidad], ['', '1º ESO A']);

/* 2 */
console.log('--- 2. las tres maneras de escribir la unidad ---');
for (const u of ['1ºESO-A', '1 E.S.O. A', '1º eso a', '1° ESO A']) {
  comprobar('2. «' + u + '» es la de la tabla', nombres(TutorDelGrupo.decidir(base({ unidad: u }))), ['Pérez Gómez, Juana']);
}
comprobar('2. «1º ESO B» no es «1º ESO A»', nombres(TutorDelGrupo.decidir(base({ unidad: '1º ESO B' }))), []);
comprobar('2. la clave de unidad', [TutorDelGrupo.claveDeUnidad('1º ESO A'), TutorDelGrupo.claveDeUnidad('1ºESO-A'), TutorDelGrupo.claveDeUnidad('1 E.S.O. A')], ['1esoa', '1esoa', '1esoa']);

/* 3 */
console.log('--- 3. en vigor hoy ---');
const f3 = (desde, hasta) => base({ filas: [fila('1º ESO A', 'Pérez Gómez, Juana', '111', desde, hasta)] });
comprobar('3. cesó ayer: no sale', nombres(TutorDelGrupo.decidir(f3('2026-09-01', '2026-10-06'))), []);
comprobar('3. cesa hoy: sale', nombres(TutorDelGrupo.decidir(f3('2026-09-01', '2026-10-07'))), ['Pérez Gómez, Juana']);
comprobar('3. empieza mañana: no sale', nombres(TutorDelGrupo.decidir(f3('2026-10-08', '2027-08-31'))), []);
comprobar('3. sin «hasta»: sale', nombres(TutorDelGrupo.decidir(f3('2026-09-01', ''))), ['Pérez Gómez, Juana']);
comprobar('3. la sustitución de hoy sale y la anterior no',
  nombres(TutorDelGrupo.decidir(base({ filas: [fila('1º ESO A', 'Titular, Ana', '1', '2026-09-01', '2026-10-01'), fila('1º ESO A', 'Sustituta, Eva', '2', '2026-10-02', '2027-08-31')], correosPorClave: {} }))), ['Sustituta, Eva']);

/* 4 */
console.log('--- 4. dos en vigor ---');
const r4 = TutorDelGrupo.decidir(base({ filas: [fila('1º ESO A', 'Uno, Ana', '1', '2026-09-01', '2027-08-31'), fila('1º ESO A', 'Dos, Eva', '2', '2026-09-01', '2027-08-31'), fila('1º ESO A', 'Uno, Ana', '1', '2026-09-01', '2027-08-31')], correosPorClave: { '1': ['a@x.es'], '2': ['e@x.es'] } }));
comprobar('4. salen los dos (y la misma persona una vez)', nombres(r4), ['Uno, Ana', 'Dos, Eva']);

/* 5 */
console.log('--- 5. otro curso y Pedagogía Terapéutica ---');
comprobar('5. una fila de otro curso no cuenta', nombres(TutorDelGrupo.decidir(base({ filas: [fila('1º ESO A', 'Vieja, Ana', '9', '2025-09-01', '2026-08-31', '2025/2026')] }))), []);
comprobar('5. el bloque de atención a la diversidad no cuenta', nombres(TutorDelGrupo.decidir(base({ filas: [fila(PT, 'Terapeuta, Eva', '8', '2026-09-01', '2027-08-31')] }))), []);
comprobar('5. en junio, el curso es el que empezó el septiembre anterior',
  nombres(TutorDelGrupo.decidir(base({ hoy: '2027-06-15', filas: [fila('1º ESO A', 'Pérez Gómez, Juana', '111', '2026-09-01', '2027-08-31')] }))), ['Pérez Gómez, Juana']);

/* 6 */
console.log('--- 6. no se sabe quién es ---');
const motivo = (d) => { const r = TutorDelGrupo.decidir(d); return [r.tutores.length, r.motivo]; };
comprobar('6. el tercero no es de ALUMNADO', motivo(base({ esAlumnado: false })), [0, 'no-alumnado']);
comprobar('6. asunto de grupo', motivo(base({ esGrupo: true })), [0, 'grupo']);
comprobar('6. alumno sin unidad', motivo(base({ unidad: '' })), [0, 'sin-unidad']);
comprobar('6. sin tabla de tutorías', motivo(base({ hayTabla: false, filas: [] })), [0, 'sin-tabla']);
comprobar('6. ninguna fila en vigor para su unidad', motivo(base({ unidad: '3º ESO C' })), [0, 'sin-tutor']);
comprobar('6. la línea ámbar, con unidad', TutorDelGrupo.textoDelMotivo('sin-tutor', '3º ESO C'),
  'No sé quién es el tutor o tutora de 3º ESO C. Sube la relación de tutorías de Séneca en Herramientas → Tablas de datos.');
comprobar('6. la línea ámbar, sin tabla', TutorDelGrupo.textoDelMotivo('sin-tabla', '1º ESO A'),
  'No sé quién es el tutor o tutora de 1º ESO A. Sube la relación de tutorías de Séneca en Herramientas → Tablas de datos.');
comprobar('6. la línea ámbar, sin unidad', TutorDelGrupo.textoDelMotivo('sin-unidad', ''), 'Este alumno no tiene unidad este curso.');
comprobar('6. para un tercero que no es alumno, ninguna línea', [TutorDelGrupo.textoDelMotivo('no-alumnado', ''), TutorDelGrupo.textoDelMotivo('grupo', ''), TutorDelGrupo.textoDelMotivo('', '')], ['', '', '']);

/* 7 */
console.log('--- 7. el correo recordado ---');
const r7 = TutorDelGrupo.decidir(base({ correosPorClave: {}, recordados: { '111': { correo: 'juana.casa@correo.es', nombre: 'Pérez Gómez, Juana', quien: 'Francisco', cuando: '2026-10-01' } } }));
comprobar('7. sin correo en PERSONAL, el recordado, marcado como escrito a mano', r7.tutores, [{ nombre: 'Pérez Gómez, Juana', clave: '111', correos: ['juana.casa@correo.es'], aMano: true, cuando: '2026-10-01' }]);
comprobar('7. el de PERSONAL gana al recordado',
  TutorDelGrupo.decidir(base({ recordados: { '111': { correo: 'otro@x.es' } } })).tutores[0].correos, ['juana@correo.es']);
comprobar('7. sin ninguno de los dos, sin correo y sin marca',
  [TutorDelGrupo.decidir(base({ correosPorClave: {} })).tutores[0].correos, TutorDelGrupo.decidir(base({ correosPorClave: {} })).tutores[0].aMano], [[], false]);

/* 8 */
console.log('--- 8. qué dirección se recuerda ---');
const sinCorreo = (n, c) => ({ nombre: n, clave: c, correos: [], tieneCorreo: false, aMano: null });
const conCorreo = (n, c, d) => ({ nombre: n, clave: c, correos: [d], tieneCorreo: true, aMano: null });
const aMano = (n, c, d) => ({ nombre: n, clave: c, correos: [], tieneCorreo: false, aMano: { correo: d, cuando: '2026-10-01' } });
comprobar('8. un tutor sin correo y una dirección: esa', CorreoTutor.aRecordar([sinCorreo('Ana', '1')], 'ana@x.es'), { clave: '1', correo: 'ana@x.es', nombre: 'Ana' });
comprobar('8. dos tutores sin correo y dos direcciones: no se adivina', CorreoTutor.aRecordar([sinCorreo('Ana', '1'), sinCorreo('Eva', '2')], 'a@x.es, e@x.es'), null);
comprobar('8. dos sin correo y una dirección: tampoco', CorreoTutor.aRecordar([sinCorreo('Ana', '1'), sinCorreo('Eva', '2')], 'a@x.es'), null);
comprobar('8. uno con correo en su ficha y otro sin: la dirección nueva es del segundo',
  CorreoTutor.aRecordar([conCorreo('Ana', '1', 'ana@x.es'), sinCorreo('Eva', '2')], 'ana@x.es, eva@x.es'), { clave: '2', correo: 'eva@x.es', nombre: 'Eva' });
comprobar('8. con el correo ya recordado y sin cambiar nada: nada', CorreoTutor.aRecordar([aMano('Ana', '1', 'ana@x.es')], 'ana@x.es'), null);
comprobar('8. «Cambiar» y otra dirección: la nueva sustituye', CorreoTutor.aRecordar([aMano('Ana', '1', 'ana@x.es')], 'nueva@x.es', { '1': true }), { clave: '1', correo: 'nueva@x.es', nombre: 'Ana' });
comprobar('8. «Otro correo» vacío: nada', CorreoTutor.aRecordar([sinCorreo('Ana', '1')], ''), null);
comprobar('8. la misma dirección dos veces cuenta una', CorreoTutor.aRecordar([sinCorreo('Ana', '1')], 'a@x.es; A@x.es'), { clave: '1', correo: 'a@x.es', nombre: 'Ana' });

/* 9 */
console.log('--- 9. el documento de la plantilla ---');
const leer = (n) => {
  const m = n.match(/^(\d{2})(\d{2})(\d{2}) (?:(?:\d{2}[ES][MA]\d+ )?)([A-ZÁÉÍÓÚ]+)(?: (D\d{2}-\d+))?/);
  return m ? { fecha: '20' + m[1] + '-' + m[2] + '-' + m[3], tipo: m[4], numero: m[5] || '' } : {};
};
const ficheros = ['261001 NOTIFICACION D26-00003.pdf', '261003 NOTIFICACION D26-00007.docx', '261003 NOTIFICACION D26-00007.pdf', '261003 NOTIFICACION D26-00005.pdf', '261005 INFORME D26-00009.pdf', 'foto.jpg'];
comprobar('9. el más reciente del tipo, y a igualdad el número mayor, y el PDF antes que el Word',
  CorreoAdjuntoPlantilla.elegirDocumento(ficheros, 'NOTIFICACION', leer), '261003 NOTIFICACION D26-00007.pdf');
comprobar('9. sin tildes ni mayúsculas', CorreoAdjuntoPlantilla.elegirDocumento(ficheros, 'notificación', (n) => { const l = leer(n); if (l.tipo) l.tipo = l.tipo.replace('NOTIFICACION', 'NOTIFICACIÓN'); return l; }), '261003 NOTIFICACION D26-00007.pdf');
comprobar('9. sin ninguno de ese tipo: nada', CorreoAdjuntoPlantilla.elegirDocumento(ficheros, 'RESOLUCION', leer), '');
comprobar('9. un nombre de los de antes (con el registro) también vale',
  CorreoAdjuntoPlantilla.elegirDocumento(['260901 26SA0012 NOTIFICACION.pdf', '261001 NOTIFICACION D26-00001.pdf'], 'NOTIFICACION', leer), '261001 NOTIFICACION D26-00001.pdf');
comprobar('9. de los de antes, solo uno', CorreoAdjuntoPlantilla.elegirDocumento(['260901 26SA0012 NOTIFICACION.pdf'], 'NOTIFICACION', leer), '260901 26SA0012 NOTIFICACION.pdf');
comprobar('9. sin tipo, nada', CorreoAdjuntoPlantilla.elegirDocumento(ficheros, '', leer), '');

if (fallos) { console.log('\n' + fallos + ' fallos'); process.exit(1); }
console.log('\nTodo bien');
