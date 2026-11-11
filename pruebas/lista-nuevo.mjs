/* Prueba en navegador de verdad de la fila 615 (docs/615-LISTAS-EDITABLES.md, tema 582): «+ Nuevo…» en los
   desplegables de hitos y tareas.

   1. Responsable: la última opción, «Cancelar» no cambia nada, «Crear» lo deja elegido y sale en «Esperamos a…»,
      en otro hito, en Ajustes › Hitos y en «+ Añadir un hito» del asunto; «direccion» ya está; el parecido avisa
      con «Usar» y pulsar otra vez «Crear» lo crea.
   2. «Sus profesores»: papel fijo en Responsable y en «Esperamos a…»; cuenta como pendiente de terceros.
   3. Tipo de documento: «PROPUESTA» se crea, queda elegido y sale en la lista de tipos de documento.
   4. Cuándo se hace: «+ Nuevo campo de lista…», el parecido con el de otro tipo (con «Usar»), al menos dos
      opciones, y lo creado sale en los demás «Cuándo se hace» de la guía.
   5. Plantilla: «+ Nueva plantilla…» abre el editor de plantillas y vuelve a la tarea con la plantilla elegida.
   6. En solo consulta no sale ningún «+ Nuevo…».
   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import { abrirHito } from './apoyo/hito.mjs';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const ASUNTO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1234';
const PASOS = () => [
  { id: 'g1', titulo: 'Pedir informe', cuerpo: '', opciones: [], responsable: 'administracion',
    guion: [{ id: 't1', texto: 'Avisar a la familia', accion: 'comunicar', receta: { via: 'correo', plantilla: '' } },
            { id: 't2', texto: 'Generar el escrito', accion: 'generar', receta: { plantilla: '' } }] },
  { id: 'g2', titulo: 'Archivar el expediente', cuerpo: '', opciones: [], responsable: 'administracion' }
];

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([asunto]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify({ MATRICULA: [{ id: 'm1', titulo: 'Pedir informe', cuerpo: '', opciones: [] }, { id: 'm2', titulo: 'Archivar', cuerpo: '', opciones: [] }] }));
  await w.close();
  await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
}, [ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Un tipo de asunto con un campo de lista «¿Quién lo pide?» en SANCION, y algún tipo de documento. */
await pagina.evaluate(async (asunto) => {
  App.E.tipos.push({ tipo: 'SANCION', categoria: 'ALUMNADO' });
  await Campos.guardarPropios(App.E.gestor, (l) => { l.push({ id: 'p-qlp', nombre: '¿Quién lo pide?', clase: 'lista', valores: ['Familia', 'Tutoría', 'Jefatura'] }); return l; });
  await Campos.guardarConfigDeTipo(App.E.gestor, 'SANCION', [{ origen: 'propio', id: 'p-qlp', obligatorio: false, enNombre: false }]);
  App.E.campos = await Campos.leer(App.E.gestor);
  App.E.tiposDocumento = ['SOLICITUD', 'INFORME'];
  await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: 'Pérez Ruiz, Ana 1234', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);

async function abrirEditor() {
  await pagina.evaluate(async (pasos) => {
    const d = await Hitos.leer();
    const resp = HitosAdministracion.paraGuia(d.ajustes).concat(Hitos.PAPELES);
    window.__edicion = Guias.editar('MATRICULA', pasos, resp, [], {});
  }, PASOS());
  await pagina.waitForSelector('#guia-pasos .paso-editor', { state: 'attached' });
}
async function cerrarEditor() {
  await pagina.evaluate(() => { document.getElementById('cuadro-cancelar').click(); });
  await pagina.waitForTimeout(100);
}
const E = (id) => '#guia-pasos > .paso-editor[data-paso-id="' + id + '"]';
const opciones = (sel) => pagina.evaluate((s) => Array.from(document.querySelector(s).options).map((o) => o.textContent), sel);
async function elegirHito(id) { await pagina.click('#guia-lista .guia-lista-item[data-paso-id="' + id + '"]'); await pagina.waitForTimeout(80); }
const cuadro = (s) => '.ln-capa ' + s;

console.log('--- 1. responsable ---');
await abrirEditor();
await elegirHito('g1');
const RESP = E('g1') + ' > .paso-extra .paso-responsable';
const TOCA = E('g1') + ' > .paso-extra .paso-toca';
const TOCA_A = E('g1') + ' > .paso-extra .paso-toca-a';
await comprobar('Responsable termina en «+ Nuevo responsable…»', opciones(RESP).then((o) => o[o.length - 1]), '+ Nuevo responsable…');
await comprobar('«Esperamos a…» también', pagina.selectOption(TOCA, 'espera').then(() => opciones(TOCA_A)).then((o) => o[o.length - 1]), '+ Nuevo responsable…');
await pagina.selectOption(RESP, '__nuevo__');
await pagina.waitForSelector(cuadro('#ln-nombre'));
await comprobar('se abre el cuadro «Nuevo responsable»', pagina.locator(cuadro('h3')).textContent(), 'Nuevo responsable');
await comprobar('y el desplegable se queda con lo que tenía', pagina.locator(RESP).inputValue(), 'administracion');
await pagina.click(cuadro('#ln-cancelar'));
const antesResp = await pagina.evaluate(async () => (await Hitos.leer()).ajustes.responsables.map((r) => r.nombre));
await comprobar('«Cancelar» cierra el cuadro y no cambia nada', Promise.all([pagina.locator('.ln-capa').count(), pagina.locator(RESP).inputValue(),
  pagina.evaluate(async () => (await Hitos.leer()).ajustes.responsables.length)]).then((r) => [r[0], r[1], r[2] === antesResp.length]), [0, 'administracion', true]);

/* «direccion»: ya está */
await pagina.selectOption(RESP, '__nuevo__');
await pagina.fill(cuadro('#ln-nombre'), 'direccion');
await pagina.click(cuadro('#ln-crear'));
await comprobar('«direccion» ya está en la lista: lo dice y no crea nada', Promise.all([pagina.locator(cuadro('#ln-error')).textContent(), pagina.locator('.ln-capa').count(),
  pagina.evaluate(async () => (await Hitos.leer()).ajustes.responsables.length)]).then((r) => [r[0], r[1], r[2] === antesResp.length]),
  ['«direccion» ya está en esta lista.', 1, true]);
/* «Jefatura de estudios»: se parece a «Jefatura» */
await pagina.fill(cuadro('#ln-nombre'), 'Jefatura de estudios');
await comprobar('escribir quita el error', pagina.locator(cuadro('#ln-error')).isHidden(), true);
await pagina.click(cuadro('#ln-crear'));
await comprobar('el parecido avisa con «Usar “Jefatura”»', pagina.evaluate(() => ({
  t: (document.querySelector('.ln-aviso b') || {}).textContent, usar: Array.from(document.querySelectorAll('.ln-usar')).map((b) => b.textContent),
  fin: (document.querySelector('.ln-aviso > span') || {}).textContent })),
  { t: 'Ya hay algo parecido en esta lista:', usar: ['Usar «Jefatura»'], fin: 'Si es otra cosa distinta, pulsa otra vez el botón de crear.' });
await comprobar('sin crear nada todavía', pagina.evaluate(async () => (await Hitos.leer()).ajustes.responsables.length), antesResp.length);
await pagina.click(cuadro('#ln-crear'));
await pagina.waitForSelector('.ln-capa', { state: 'detached' });
await comprobar('pulsar otra vez «Crear» lo crea y queda elegido en el desplegable', pagina.locator(RESP).evaluate((s) => s.options[s.selectedIndex].textContent), 'Jefatura de estudios');
await comprobar('sale en Ajustes › Hitos (en el fichero de hitos)', pagina.evaluate(async () => (await Hitos.leer()).ajustes.responsables.map((r) => r.nombre)), antesResp.concat(['Jefatura de estudios']));
await comprobar('sin la marca de Administración y con la clase de siempre', pagina.evaluate(async () => {
  const r = (await Hitos.leer()).ajustes.responsables.filter((x) => x.nombre === 'Jefatura de estudios')[0]; return [r.clase, !!r.administracion]; }), ['centro', false]);
await comprobar('sale en «Esperamos a…»', opciones(TOCA_A).then((o) => o.indexOf('Jefatura de estudios') !== -1), true);
await comprobar('y en el responsable del otro hito', pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos > .paso-editor .paso-responsable'))
  .map((s) => Array.from(s.options).some((o) => o.textContent === 'Jefatura de estudios'))), [true, true]);
/* desde «Esperamos a…» */
await pagina.selectOption(TOCA_A, '__nuevo__');
await pagina.fill(cuadro('#ln-nombre'), 'Equipo educativo');
await pagina.click(cuadro('#ln-crear'));
await pagina.waitForSelector('.ln-capa', { state: 'detached' });
await comprobar('desde «Esperamos a…» el nuevo queda elegido ahí', pagina.locator(TOCA_A).evaluate((s) => s.options[s.selectedIndex].textContent), 'Equipo educativo');
await comprobar('y sale también en Responsable', opciones(RESP).then((o) => o.indexOf('Equipo educativo') !== -1), true);
await comprobar('la fila del hito dice «Espera: Equipo educativo»', pagina.evaluate(() =>
  /Espera: Equipo educativo/.test((document.querySelector('#guia-lista .guia-lista-item[data-paso-id="g1"]') || {}).innerText || '')), true);
/* «Usar» */
await pagina.selectOption(RESP, '__nuevo__');
await pagina.fill(cuadro('#ln-nombre'), 'Secretaría general');
await pagina.click(cuadro('#ln-crear'));
await pagina.locator(cuadro('.ln-usar'), { hasText: 'Usar «Secretaría»' }).click();
await pagina.waitForSelector('.ln-capa', { state: 'detached' });
await comprobar('«Usar “Secretaría”» elige el que ya existe', pagina.locator(RESP).inputValue(), 'secretaria');
await comprobar('y no crea nada nuevo', pagina.evaluate(async () => (await Hitos.leer()).ajustes.responsables.length), antesResp.length + 2);

console.log('--- 2. «Sus profesores» ---');
await comprobar('es un papel fijo en Responsable', opciones(RESP).then((o) => o.indexOf('Sus profesores') !== -1), true);
await comprobar('y en «Esperamos a…»', opciones(TOCA_A).then((o) => o.indexOf('Sus profesores') !== -1), true);
await comprobar('un hito suyo cuenta como pendiente de terceros', pagina.evaluate(async () => {
  const d = await Hitos.leer();
  const q = Hitos.aQuienLeToca([{ id: 'x', titulo: 'Reunión', estado: 'pendiente', clase: 'paso', responsable: 'profesores' }], d.ajustes, {});
  return [Hitos.esDeAdministracion('profesores', d.ajustes), q.lado, Hitos.nombreDeEspera('profesores', d.ajustes)];
}), [false, 'terceros', 'Sus profesores']);

console.log('--- 3. tipo de documento ---');
await elegirHito('g2');
await pagina.evaluate(() => { const c = document.querySelector('#guia-pasos > .paso-editor[data-paso-id="g2"] .paso-tipo-documento'); if (!c) throw new Error('sin tipo de documento'); c.closest('.paso-editor').classList.add('abre-documentos'); });
const TIPO = E('g2') + ' .paso-tipo-documento';
await comprobar('la lista de tipos termina en «+ Nuevo tipo de documento…»', opciones(TIPO), ['(sin elegir)', 'SOLICITUD', 'INFORME', '+ Nuevo tipo de documento…']);
await pagina.selectOption(TIPO, '__nuevo__');
await pagina.fill(cuadro('#ln-nombre'), 'solicitud');
await pagina.click(cuadro('#ln-crear'));
await comprobar('uno que ya está («solicitud»): lo dice', pagina.locator(cuadro('#ln-error')).textContent(), '«solicitud» ya está en esta lista.');
await pagina.fill(cuadro('#ln-nombre'), 'PROPUESTA');
await pagina.click(cuadro('#ln-crear'));
await pagina.waitForSelector('.ln-capa', { state: 'detached' });
await comprobar('«PROPUESTA» queda elegido', pagina.locator(TIPO).inputValue(), 'PROPUESTA');
await comprobar('y está en la lista de tipos de documento de la app', pagina.evaluate(() => App.E.tiposDocumento.indexOf('PROPUESTA') !== -1), true);

console.log('--- 4. cuándo se hace ---');
const CUANDO = E('g2') + ' > .cuando-bloque .cuando-campo';
await comprobar('«Cuándo se hace» termina en «+ Nuevo campo de lista…»', opciones(CUANDO), ['Siempre', '+ Nuevo campo de lista…']);
await pagina.selectOption(CUANDO, '__nuevo__');
await pagina.fill(cuadro('#ln-nombre'), 'Quién lo pide');
await pagina.fill(cuadro('#ln-opciones'), 'Familia\nAlumno');
await pagina.click(cuadro('#ln-crear'));
await comprobar('se parece a un campo de otro tipo: avisa con de dónde sale', pagina.evaluate(() =>
  /la lista de campos \(lo usa SANCION\)/.test((document.querySelector('.ln-aviso') || {}).innerText || '')), true);
await pagina.locator(cuadro('.ln-usar')).click();
await pagina.waitForSelector('.ln-capa', { state: 'detached' });
await pagina.waitForFunction((s) => document.querySelector(s).value === '¿Quién lo pide?', CUANDO);
await comprobar('«Usar» lo deja elegido con sus opciones como casillas, sin marcar', pagina.evaluate((s) => [
  document.querySelector(s).value,
  Array.from(document.querySelectorAll(s.replace('.cuando-campo', '.cuando-valor'))).map((c) => [c.value, c.checked])], CUANDO),
  ['¿Quién lo pide?', [['Familia', false], ['Tutoría', false], ['Jefatura', false]]]);
await comprobar('y el campo está ya en el tipo de la guía', pagina.evaluate(() => (App.E.campos.porTipo.MATRICULA || []).map((x) => x.id)), ['p-qlp']);
/* uno nuevo */
await elegirHito('g1');
const CUANDO1 = E('g1') + ' > .cuando-bloque .cuando-campo';
await comprobar('sale ya también en el «Cuándo se hace» de otro hito', opciones(CUANDO1), ['Siempre', 'Solo si el campo «¿Quién lo pide?» vale…', '+ Nuevo campo de lista…']);
await pagina.selectOption(CUANDO1, '__nuevo__');
await pagina.fill(cuadro('#ln-nombre'), 'Curso de origen');
await pagina.fill(cuadro('#ln-opciones'), '1º ESO');
await pagina.click(cuadro('#ln-crear'));
await comprobar('con una sola opción pide al menos dos', pagina.locator(cuadro('#ln-error')).textContent(), 'Escribe al menos dos opciones, una por línea.');
await pagina.fill(cuadro('#ln-opciones'), '1º ESO\n2º ESO');
await pagina.click(cuadro('#ln-crear'));
await pagina.waitForSelector('.ln-capa', { state: 'detached' });
await comprobar('con dos queda elegido, con sus opciones como casillas, sin marcar', pagina.evaluate((s) => [
  document.querySelector(s).value,
  Array.from(document.querySelectorAll(s.replace('.cuando-campo', '.cuando-valor'))).map((c) => [c.value, c.checked])], CUANDO1),
  ['Curso de origen', [['1º ESO', false], ['2º ESO', false]]]);
await comprobar('está en la lista de campos y en el tipo', pagina.evaluate(() => [
  App.E.campos.propios.filter((p) => p.nombre === 'Curso de origen').map((p) => [p.clase, p.valores]),
  (App.E.campos.porTipo.MATRICULA || []).length]), [[['lista', ['1º ESO', '2º ESO']]], 2]);
await comprobar('y sale en el «Cuándo se hace» de otro hito', opciones(CUANDO).then((o) => o.indexOf('Solo si el campo «Curso de origen» vale…') !== -1), true);
await pagina.selectOption(CUANDO1, '__nuevo__');
await pagina.fill(cuadro('#ln-nombre'), 'curso de origen');
await pagina.click(cuadro('#ln-crear'));
await comprobar('un nombre que el tipo ya tiene: lo dice', pagina.locator(cuadro('#ln-error')).textContent(), 'Ya hay un campo «curso de origen» en este tipo.');
await pagina.click(cuadro('#ln-cancelar'));

console.log('--- 5. plantilla ---');
await elegirHito('g1');
await pagina.click(E('g1') + ' .guion-fila[data-id="t1"] > .guion-resumen');
const PLA = E('g1') + ' .guion-fila[data-id="t1"] .guion-receta-plantilla';
await comprobar('«Plantilla de correo» termina en «+ Nueva plantilla…»', opciones(PLA).then((o) => o[o.length - 1]), '+ Nueva plantilla…');
await pagina.selectOption(PLA, '__nuevo__');
await pagina.waitForSelector('#guia-plantilla-panel:not(.oculto) #pl-nombre');
await comprobar('abre el editor de plantillas, con el tipo de la guía', pagina.evaluate(() => [document.getElementById('pl-tipo').value, document.getElementById('pl-nombre').value]), ['MATRICULA', '']);
await pagina.fill('#pl-nombre', 'Aviso de nueva matrícula');
await pagina.fill('#pl-texto', 'Hola, le informamos de su matrícula.');
await pagina.click('#guia-plantilla-guardar');
await pagina.waitForSelector('#guia-plantilla-panel.oculto', { state: 'attached' });
await pagina.waitForTimeout(300);
await comprobar('al guardar se vuelve a la tarea con la plantilla elegida («Nombre (TIPO)»)', pagina.evaluate(() => {
  const s = document.querySelector('#guia-pasos > .paso-editor[data-paso-id="g1"] .guion-fila[data-id="t1"] .guion-receta-plantilla');
  return s && s.options[s.selectedIndex].textContent; }), 'Aviso de nueva matrícula (MATRICULA)');
await comprobar('y la plantilla existe', pagina.evaluate(() => Plantillas.enMemoria().lista.filter((p) => p.nombre === 'Aviso de nueva matrícula').length), 1);
/* el parecido */
await pagina.selectOption(PLA, '__nuevo__');
await pagina.waitForSelector('#guia-plantilla-panel:not(.oculto) #pl-nombre');
await pagina.fill('#pl-nombre', 'Aviso de nueva matrícula 2');
await pagina.fill('#pl-texto', 'Otro texto.');
await pagina.click('#guia-plantilla-guardar');
await comprobar('un nombre parecido avisa con «Usar»', pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-plantilla-parecidos .ln-usar')).map((b) => b.textContent)), ['Usar «Aviso de nueva matrícula»']);
await pagina.locator('#guia-plantilla-parecidos .ln-usar').click();
await pagina.waitForTimeout(300);
await comprobar('«Usar» vuelve a la tarea con la que ya había', pagina.evaluate(() => {
  const s = document.querySelector('#guia-pasos > .paso-editor[data-paso-id="g1"] .guion-fila[data-id="t1"] .guion-receta-plantilla');
  return [s && s.options[s.selectedIndex].textContent, Plantillas.enMemoria().lista.filter((p) => /Aviso de nueva/.test(p.nombre)).length]; }), ['Aviso de nueva matrícula (MATRICULA)', 1]);

/* plantilla de documento (Word): hace falta algún .docx en _GESTOR/PLANTILLAS */
await pagina.evaluate(async () => {
  const c = await PlantillasDocumento._interno.carpetaDePlantillas();
  const h = await c.getFileHandle('Escrito de matrícula.docx', { create: true });
  const w = await h.createWritable(); await w.write('x'); await w.close();
});
await pagina.click(E('g1') + ' .guion-fila[data-id="t2"] > .guion-resumen');
const PLD = E('g1') + ' .guion-fila[data-id="t2"] .guion-receta-plantilla';
await comprobar('«Plantilla de documento» termina en «+ Nueva plantilla…»', opciones(PLD).then((o) => o[o.length - 1]), '+ Nueva plantilla…');
await pagina.selectOption(PLD, '__nuevo__');
await pagina.waitForSelector('#guia-plantilla-panel:not(.oculto) #pd-nombre');
await comprobar('abre el editor de plantillas de documento, con el tipo de la guía', pagina.evaluate(() => [document.getElementById('pd-tipo').value, document.getElementById('pd-fichero').value]), ['MATRICULA', 'Escrito de matrícula.docx']);
await pagina.fill('#pd-nombre', 'Escrito de matrícula');
await pagina.fill('#pd-tipo-doc', 'INFORME');
await pagina.click('#guia-plantilla-guardar');
await pagina.waitForSelector('#guia-plantilla-panel.oculto', { state: 'attached' });
await pagina.waitForTimeout(300);
await comprobar('al guardar vuelve a la tarea con la plantilla de documento elegida', pagina.evaluate(() => {
  const s = document.querySelector('#guia-pasos > .paso-editor[data-paso-id="g1"] .guion-fila[data-id="t2"] .guion-receta-plantilla');
  return s && s.options[s.selectedIndex].textContent; }), 'Escrito de matrícula (MATRICULA)');

console.log('--- 6. «+ Añadir un hito» del asunto y solo consulta ---');
await cerrarEditor();
await pagina.evaluate(() => { window.__solo = true; });
const abierto = await pagina.evaluate(() => typeof HitosDesdeElAsunto !== 'undefined' && typeof HitosDesdeElAsunto.abrirCrear === 'function');
await comprobar('hay «+ Añadir un hito» en el asunto', Promise.resolve(abierto), true);
await pagina.evaluate(async (asunto) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === asunto)[0] || { nombre: asunto, ficha: { tipo: 'MATRICULA' } };
  window.__crear = HitosDesdeElAsunto.abrirCrear(a);
}, ASUNTO);
await pagina.waitForSelector('#hda-responsable');
await comprobar('Responsable del hito nuevo: lo creado arriba sale aquí y la última opción es «+ Nuevo responsable…»', opciones('#hda-responsable').then((o) =>
  [o.indexOf('Jefatura de estudios') !== -1, o.indexOf('Equipo educativo') !== -1, o[o.length - 1]]), [true, true, '+ Nuevo responsable…']);
await pagina.selectOption('#hda-responsable', '__nuevo__');
await pagina.fill(cuadro('#ln-nombre'), 'Claustro');
await pagina.click(cuadro('#ln-crear'));
await pagina.waitForSelector('.ln-capa', { state: 'detached' });
await comprobar('desde el asunto: el nuevo queda elegido y se guarda', Promise.all([
  pagina.locator('#hda-responsable').evaluate((s) => s.options[s.selectedIndex].textContent),
  pagina.evaluate(async () => (await Hitos.leer()).ajustes.responsables.some((r) => r.nombre === 'Claustro'))]), ['Claustro', true]);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(100);

/* la mesa del hito: el menú «Responsable» termina en «+ Nuevo responsable…» */
console.log('--- 7. la mesa del hito ---');
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ASUNTO + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
await abrirHito(pagina, 'm1');
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="m1"]');
await pagina.waitForTimeout(300);
await pagina.locator('.hito-en-mesa .mesa-etq-resp').click();
await comprobar('el menú del responsable termina en «+ Nuevo responsable…»', pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').allTextContents().then((t) => t.slice(-2)), ['Una Administración…', '+ Nuevo responsable…']);
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: '+ Nuevo responsable…' }).click();
await pagina.fill(cuadro('#ln-nombre'), 'Ponencia');
await pagina.click(cuadro('#ln-crear'));
await pagina.waitForSelector('.ln-capa', { state: 'detached' });
await pagina.waitForTimeout(600);
await comprobar('desde la mesa: el hito queda con el responsable nuevo', pagina.evaluate(async ([asunto]) => {
  const d = await Hitos.leer();
  const r = d.ajustes.responsables.filter((x) => x.nombre === 'Ponencia')[0];
  return !!r && Hitos.buscar(d.porAsunto[asunto].hitos, 'm1').responsable === r.id; }, [ASUNTO]), true);

/* «+ Añadir hito» del asunto (la ventana de la lista común): «+ Crear un hito nuevo» lleva Responsable */
console.log('--- 8. «+ Añadir hito» del asunto ---');
await pagina.evaluate(async (asunto) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === asunto)[0];
  window.__anadir = ComunesAsunto.anadirHito(a);
}, ASUNTO);
await pagina.waitForSelector('#cv-crear');
await pagina.click('#cv-crear');
await pagina.waitForSelector('#cn-resp');
await pagina.waitForFunction(() => document.querySelectorAll('#cn-resp option').length > 3);
await comprobar('«Crear un hito nuevo» lleva Responsable, con lo ya creado y «+ Nuevo responsable…» al final', opciones('#cn-resp').then((o) =>
  [o[0], o.indexOf('Ponencia') !== -1, o[o.length - 1]]), ['(sin responsable)', true, '+ Nuevo responsable…']);
await pagina.selectOption('#cn-resp', '__nuevo__');
await pagina.fill(cuadro('#ln-nombre'), 'Departamento de Orientación');
await pagina.click(cuadro('#ln-crear'));
await pagina.waitForSelector('.ln-capa', { state: 'detached' });
await comprobar('lo creado queda elegido', pagina.locator('#cn-resp').evaluate((s) => s.options[s.selectedIndex].textContent), 'Departamento de Orientación');
await pagina.fill('#cn-nombre', 'Reunión con orientación');
await pagina.selectOption('#cv-para', 'aqui');
await pagina.click('#cn-crear');
await pagina.waitForTimeout(800);
await comprobar('el hito añadido al asunto lleva ese responsable', pagina.evaluate(async ([asunto]) => {
  const d = await Hitos.leer();
  const r = d.ajustes.responsables.filter((x) => x.nombre === 'Departamento de Orientación')[0];
  const h = d.porAsunto[asunto].hitos.filter((x) => x.titulo === 'Reunión con orientación')[0];
  return !!r && !!h && h.responsable === r.id; }, [ASUNTO]), true);

/* solo consulta: ninguna opción «+ Nuevo…» */
await pagina.evaluate(() => { window.__soloAntes = window.SoloConsulta; window.SoloConsulta = Object.assign({}, window.SoloConsulta, { activo: () => true }); });
await abrirEditor();
await elegirHito('g1');
await comprobar('en solo consulta no sale ningún «+ Nuevo…» en el editor', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#guia-pasos option')).filter((o) => /^\+ Nuev/.test(o.textContent)).length), 0);
await cerrarEditor();
await pagina.evaluate(() => { window.SoloConsulta = window.__soloAntes; });

console.log('');
console.log('errores de consola: ' + JSON.stringify(errores));
await comprobar('sin errores de consola', Promise.resolve(errores.length), 0);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
