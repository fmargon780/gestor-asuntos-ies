/* Fila 299 (7-oct-2026, docs/CORREO-AL-TUTOR-DEL-GRUPO.md, apartado 1.6), sin navegador: la pasada de
   js/informar-al-tutor.js con un disco de mentira en memoria y el contenido REAL de la biblioteca del centro.

   13. Cambia el título del paso y el de los hitos de los asuntos abiertos, crea la plantilla y deja la tarea con sus tres
       detalles; si el hito no tiene tarea de comunicar, la añade.
   14. Segunda vez: no cambia nada (ni duplica la plantilla ni la tarea).
   15. Sin el tipo o sin el hito: no falla y hace el punto 6.
   16. Punto 6: «Avisar a la tutoría» recibe el detalle; «Avisar a las dos tutorías», «Enviarla a la familia» y una tarea
       que ya tenía «a quién» no cambian; ninguna `revision` sube; el contenido de la biblioteca lleva lo mismo.
   17. Con «solo consultar» puesto (o con un guardado en marcha), la pasada no escribe nada. */
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const raiz = new URL('../js/', import.meta.url).pathname;
const contenido = JSON.parse(fs.readFileSync(new URL('../datos-biblioteca/biblioteca-centro.json', import.meta.url), 'utf8'));
const dom = new JSDOM('');

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const copia = (x) => JSON.parse(JSON.stringify(x));

/* ---------- el entorno ---------- */
const disco = {};
let soloConsulta = false, guardando = false, escrituras = 0, idPlantilla = 0;
const propagados = [];
const contexto = { console, window: {}, document: dom.window.document, DOMParser: dom.window.DOMParser, setTimeout, clearTimeout };
vm.createContext(contexto);
contexto.App = contexto.window.App = { E: { usuario: 'Francisco', gestor: { nombre: 'gestor' }, tipos: [], tiposDocumento: ['SOLICITUD', 'NOTIFICACIÓN'] }, ir() {} };
contexto.window.Gestor = contexto.Gestor = { carpetaGestor: () => contexto.App.E.gestor, alRefrescar: [] };
contexto.window.SoloConsulta = contexto.SoloConsulta = { activo: () => soloConsulta };
contexto.window.ColaGuardado = contexto.ColaGuardado = { hayGuardado: () => guardando };
contexto.window.Carpetas = contexto.Carpetas = { leerJson: async (g, n) => (disco[n] === undefined ? null : copia(disco[n])) };
contexto.window.Copias = contexto.Copias = { guardar: async (g, n, d) => { escrituras++; disco[n] = copia(d); } };
contexto.window.GuiasDelCentro = contexto.GuiasDelCentro = {
  guardarPasos: async (tipo, pasos) => { const g = copia(disco['guias.json'] || {}); g[tipo] = pasos; escrituras++; disco['guias.json'] = g; }
};
contexto.window.Plantillas = contexto.Plantillas = {
  enMemoria: () => copia(disco['plantillas.json'] || { lista: [] }),
  idNuevo: () => 'pl-' + (++idPlantilla),
  guardar: async (g, mutar) => {
    const actual = copia(disco['plantillas.json'] || { lista: [], documentos: [] });
    const nuevo = mutar(actual) || actual; escrituras++; disco['plantillas.json'] = copia(nuevo); return nuevo;
  }
};
contexto.window.HitosDesdeElAsunto = contexto.HitosDesdeElAsunto = {
  propagarCambio: async (tipo, idOrigen, campos, ancla, clave) => { propagados.push([tipo, idOrigen, campos, ancla, clave]); return { tocados: 2, saltados: 0 }; }
};
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'plazos.js', 'guias.js', 'guias-guion.js', 'hitos-biblioteca.js', 'informar-al-tutor.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
  Object.keys(contexto.window).forEach((k) => { if (!(k in contexto) || contexto[k] === undefined) contexto[k] = contexto.window[k]; });
}
const { InformarAlTutor, HitosBiblioteca } = contexto.window;

const guiaSancion = () => ([
  { id: 's1', titulo: 'Abrir el expediente', guion: [] },
  { id: 's2', titulo: 'Notificar al tutor/a', cuerpo: '<p>x</p>', responsable: 'yo', guion: [
    { id: 'g1', texto: 'Avisar al tutor/a', accion: 'comunicar' },
    { id: 'g2', texto: 'Comunicarlo por correo', accion: 'comunicar', receta: { a: 'tercero', via: '', plantilla: '' } }] },
  { id: 's3', titulo: 'Entregar la notificación', guion: [] }]);
const guiaOtra = () => ([
  { id: 'o1', titulo: 'Avisar', guion: [
    { id: 'a1', texto: 'Avisar a la tutoría', accion: 'comunicar' },
    { id: 'a2', texto: 'Avisar a las dos tutorías', accion: 'comunicar' },
    { id: 'a3', texto: 'Enviarla a la familia', accion: 'comunicar' },
    { id: 'a4', texto: 'Comunicar a la familia y a la tutoría', accion: 'comunicar' },
    { id: 'a5', texto: 'Avisar al tutor o tutora', accion: 'comunicar', receta: { a: 'tercero', via: 'correo', plantilla: '' } },
    { id: 'a6', texto: 'Avisar al tutor o tutora (sin detalles)', accion: 'comunicar', receta: { a: '', via: 'seneca', plantilla: '' } },
    { id: 'a7', texto: 'Avisar a la tutoría', accion: '' },
    { id: 'a8', texto: 'Generar el parte de la tutoría', accion: 'generar' }], origenBiblioteca: { id: 'b1', revision: 3, divergido: false } }]);

function montar() {
  for (const k of Object.keys(disco)) delete disco[k];
  propagados.length = 0; escrituras = 0; idPlantilla = 0; soloConsulta = false; guardando = false;
  contexto.App.E.tipos = [{ tipo: 'SANCION', nombreCorto: '', categoria: 'ALUMNADO' }, { tipo: 'Otro tipo', categoria: 'ALUMNADO' }];
  disco['guias.json'] = { SANCION: guiaSancion(), 'Otro tipo': guiaOtra() };
  disco['hitos-biblioteca.json'] = { version: 1, plazosDelCentro: 2, modelos: copia(contenido.modelos).map((m, i) => Object.assign(m, { revision: 1 + (i % 4) })) };   /* revisiones distintas, para ver que ninguna sube */
  disco['plantillas.json'] = { lista: [], documentos: [] };
}
const tarea = (tipo, idPaso, idTarea) => {
  const p = disco['guias.json'][tipo].filter((x) => x.id === idPaso)[0];
  return p.guion.filter((g) => g.id === idTarea)[0];
};

/* 13 */
console.log('--- 13. la primera pasada ---');
montar();
const antesModelos = copia(disco['hitos-biblioteca.json'].modelos);
const r1 = await InformarAlTutor.pasada();
comprobar('13. corre y lo cuenta', [r1.tipos, r1.titulos, r1.plantillas, r1.tareas], [1, 1, 1, 1]);
comprobar('13. el paso pasa a llamarse «Informar al tutor/a»', disco['guias.json'].SANCION.map((p) => p.titulo), ['Abrir el expediente', 'Informar al tutor/a', 'Entregar la notificación']);
const pl = disco['plantillas.json'].lista;
comprobar('13. la plantilla: nombre, tipo, categoría y documento que adjunta',
  pl.map((p) => [p.nombre, p.tipo, p.categoria, p.adjuntar]), [['Informar al tutor/a de la sanción', 'SANCION', 'ALUMNADO', 'NOTIFICACIÓN']]);
comprobar('13. el texto, con «al/a la alumno/a» (sin saludo ni firma)', pl[0].texto,
  'Jefatura de Estudios entregará al/a la alumno/a la notificación escrita para la familia.\n\nEsta comunicación es solo a efectos informativos para el tutor o la tutora.');
comprobar('13. la primera tarea de comunicar: «Tutor/a del grupo», correo y esa plantilla', tarea('SANCION', 's2', 'g1').receta, { a: 'tutoria', via: 'correo', plantilla: pl[0].id });
comprobar('13. la segunda tarea no se toca', tarea('SANCION', 's2', 'g2').receta, { a: 'tercero', via: '', plantilla: '' });
comprobar('13. los asuntos abiertos, por la puerta de «Cambiar»: un solo paso, solo el título, en todos',
  propagados.map((p) => [p[0], p[1], p[2], p[4]]), [['SANCION', 's2', { titulo: 'Informar al tutor/a', soloTitulo: true }, '']]);
comprobar('13. la marca de la pasada', disco['hitos-biblioteca.json'].informarAlTutor, 1);

/* Un hito sin tarea de comunicar: se le añade «Enviar el correo al tutor/a». */
montar();
disco['guias.json'].SANCION[1].guion = [{ id: 'g9', texto: 'Mirar el parte', accion: '' }];
disco['guias.json'].SANCION[1].titulo = 'Notificar al tutor';
await InformarAlTutor.pasada();
const g13 = disco['guias.json'].SANCION[1];
comprobar('13. sin tarea de comunicar: se añade al final, con los tres detalles',
  g13.guion.map((g) => [g.texto, g.accion, g.receta && g.receta.a, g.receta && g.receta.via, !!(g.receta && g.receta.plantilla)]),
  [['Mirar el parte', '', undefined, undefined, false], ['Enviar el correo al tutor/a', 'comunicar', 'tutoria', 'correo', true]]);
comprobar('13. «Notificar al tutor» también vale', g13.titulo, 'Informar al tutor/a');
for (const t of ['Notificar al tutor o tutora', 'NOTIFICAR AL TUTOR/A', 'notificar al tutor/a.']) {
  montar(); disco['guias.json'].SANCION[1].titulo = t; await InformarAlTutor.pasada();
  comprobar('13. «' + t + '» también', disco['guias.json'].SANCION[1].titulo, 'Informar al tutor/a');
}
montar(); disco['guias.json'].SANCION[1].titulo = 'Notificar a la familia'; await InformarAlTutor.pasada();
comprobar('13. otro título no se toca', disco['guias.json'].SANCION[1].titulo, 'Notificar a la familia');

/* el tipo por su nombre largo, y el hito dentro de una respuesta */
montar();
contexto.App.E.tipos = [{ tipo: 'Medida disciplinaria por conducta gravemente perjudicial', nombreCorto: '', categoria: 'ALUMNADO' }];
disco['guias.json'] = { 'Medida disciplinaria por conducta gravemente perjudicial': [{ id: 'd1', titulo: '¿Hay que notificarlo?', opciones: [
  { id: 'op1', texto: 'Sí', pasos: [{ id: 'dd1', titulo: 'Notificar al tutor/a', guion: [] }] }] }] };
await InformarAlTutor.pasada();
comprobar('13. el tipo por su nombre largo, y el hito a cualquier profundidad',
  disco['guias.json']['Medida disciplinaria por conducta gravemente perjudicial'][0].opciones[0].pasos[0].titulo, 'Informar al tutor/a');
montar();
contexto.App.E.tipos = [{ tipo: 'Otra cosa', nombreCorto: 'SANCION', categoria: 'ALUMNADO' }];
disco['guias.json'] = { 'Otra cosa': guiaSancion() };
await InformarAlTutor.pasada();
comprobar('13. el tipo por su nombre corto', disco['guias.json']['Otra cosa'][1].titulo, 'Informar al tutor/a');

/* 14 */
console.log('--- 14. la segunda vez ---');
montar();
await InformarAlTutor.pasada();
const tras1 = JSON.stringify([disco['guias.json'], disco['plantillas.json'], disco['hitos-biblioteca.json']]);
propagados.length = 0; escrituras = 0;
comprobar('14. con la marca puesta no corre sola ni escribe', [await InformarAlTutor.pasada(), escrituras], [null, 0]);
const r2 = await InformarAlTutor.pasada({ forzar: true });
comprobar('14. a la fuerza, no cambia nada: ni título, ni plantilla, ni tarea', [r2.titulos, r2.plantillas, r2.tareas, r2.tutoria, r2.modelos], [0, 0, 0, 0, 0]);
comprobar('14. los ficheros quedan igual (la plantilla no se duplica)', JSON.stringify([disco['guias.json'], disco['plantillas.json'], disco['hitos-biblioteca.json']]), tras1);
comprobar('14. y los asuntos abiertos, sin tocar otra vez', propagados.length, 0);

/* 15 */
console.log('--- 15. sin el tipo o sin el hito ---');
montar();
contexto.App.E.tipos = [{ tipo: 'Otro tipo', categoria: 'ALUMNADO' }];
const r3 = await InformarAlTutor.pasada();
comprobar('15. sin el tipo: no falla, no crea plantilla y hace el punto 6', [r3.tipos, disco['plantillas.json'].lista.length, tarea('Otro tipo', 'o1', 'a1').receta.a], [0, 0, 'tutoria']);
montar();
disco['guias.json'].SANCION = [{ id: 's1', titulo: 'Abrir el expediente', guion: [] }];
const r4 = await InformarAlTutor.pasada();
comprobar('15. sin el hito: no falla, no crea plantilla y hace el punto 6', [r4.tipos, disco['plantillas.json'].lista.length, tarea('Otro tipo', 'o1', 'a1').receta.a], [0, 0, 'tutoria']);
montar();
delete disco['guias.json'].SANCION;
comprobar('15. sin guía del tipo: tampoco falla', (await InformarAlTutor.pasada()).tipos, 0);

/* 16 */
console.log('--- 16. «Tutor/a del grupo» en todo el centro ---');
montar();
const modelosAntes = copia(disco['hitos-biblioteca.json'].modelos);
const revisionesAntes = disco['hitos-biblioteca.json'].modelos.map((m) => m.revision).join(',');
const r5 = await InformarAlTutor.pasada();
const t = (id) => tarea('Otro tipo', 'o1', id).receta;
comprobar('16. «Avisar a la tutoría»: recibe el detalle (y solo eso)', t('a1'), { a: 'tutoria', via: '', plantilla: '' });
comprobar('16. «Avisar a las dos tutorías»: no cambia', tarea('Otro tipo', 'o1', 'a2').receta, undefined);
comprobar('16. «Enviarla a la familia»: no cambia', tarea('Otro tipo', 'o1', 'a3').receta, undefined);
comprobar('16. «Comunicar a la familia y a la tutoría»: no cambia (dice «familia»)', tarea('Otro tipo', 'o1', 'a4').receta, undefined);
comprobar('16. una tarea que ya tenía «a quién»: no cambia', t('a5'), { a: 'tercero', via: 'correo', plantilla: '' });
comprobar('16. con receta pero sin «a quién»: recibe el detalle y conserva la vía', t('a6'), { a: 'tutoria', via: 'seneca', plantilla: '' });
comprobar('16. una tarea que no es de comunicar: no cambia', [tarea('Otro tipo', 'o1', 'a7').receta, tarea('Otro tipo', 'o1', 'a8').receta], [undefined, undefined]);
comprobar('16. la revisión del paso que viene de la biblioteca no cambia', disco['guias.json']['Otro tipo'][0].origenBiblioteca, { id: 'b1', revision: 3, divergido: false });
comprobar('16. ninguna revisión de modelo sube', disco['hitos-biblioteca.json'].modelos.map((m) => m.revision).join(','), revisionesAntes);
comprobar('16. el contenido de la biblioteca ya dice lo mismo: nada que cambiar en los modelos del fichero', r5.modelos, 0);
const enContenido = [];
(function rec(x) { if (Array.isArray(x)) x.forEach(rec); else if (x && typeof x === 'object') { if (x.accion === 'comunicar' && /tutor[ií]a/i.test(x.texto || '') && !/familia|dos tutor/i.test(x.texto)) enContenido.push(x.receta && x.receta.a); Object.values(x).forEach(rec); } })(contenido.modelos);
comprobar('16. en datos-biblioteca/biblioteca-centro.json, toda tarea de comunicar a la tutoría lleva «Tutor/a del grupo»', [enContenido.length > 0, enContenido.every((a) => a === 'tutoria')], [true, true]);
/* Una biblioteca cargada del centro de antes (sin el cambio): la pasada se lo pone, sin tocar la revisión. */
montar();
const viejos = disco['hitos-biblioteca.json'].modelos;
viejos.forEach((m) => (m.guion || []).forEach((g) => { if (g.accion === 'comunicar' && g.receta && g.receta.a === 'tutoria') g.receta = null; }));
const revs = viejos.map((m) => m.revision).join(',');
const r6 = await InformarAlTutor.pasada();
comprobar('16. en un centro con la biblioteca de antes, los modelos reciben el detalle y su revisión no sube',
  [r6.modelos > 0, disco['hitos-biblioteca.json'].modelos.map((m) => m.revision).join(',')], [true, revs]);

/* 17 */
console.log('--- 17. solo consulta y guardado en marcha ---');
montar();
soloConsulta = true;
comprobar('17. con solo consultar no corre ni escribe', [await InformarAlTutor.pasada(), escrituras], [null, 0]);
soloConsulta = false; guardando = true;
comprobar('17. con un guardado en marcha tampoco', [await InformarAlTutor.pasada(), escrituras], [null, 0]);
guardando = false;
comprobar('17. y sin eso, corre', (await InformarAlTutor.pasada()).tipos, 1);

if (fallos) { console.log('\n' + fallos + ' fallos'); process.exit(1); }
console.log('\nTodo bien');
