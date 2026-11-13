/* Fila 639 (13-nov-2026, docs/639-LLAMAR-POR-TELEFONO.md): llamar por teléfono, con Chromium real y los datos de la copia de
   pruebas (?demo=1&auto=1), en SANCION de Fuentes Calvo (1º Bach A):
   - «Llamar por teléfono» es la última opción de «Qué se hace»; la tarea lleva su etiqueta, el icono y «Sin llamadas todavía».
   - La ventana desde la tarea: «He llamado yo», el nombre de la tarea en el título, sin «¿Es de una tarea?»; no apunta sin lo que falta.
   - «No contesta»: cuenta bajo la tarea, la tarea sigue pendiente, línea en el Registro con su hito y su tarea.
   - «He hablado»: la tarea se marca sola; el botón sigue; la llamada se coloca por su hora.
   - Desde la cabecera: «Me han llamado», «¿Es de una tarea?» con los hitos (el actual primero) y sus tareas; con tarea de otra
     clase queda bajo ella sin marcarla; sin tarea, solo en el Registro.
   - Corregir: «Corregir llamada», marca «corregida», línea nueva «Antes: …»; sin «Borrar»; de «No contesta» a «He hablado»
     marca la tarea de llamar pendiente. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 950 } });
const pagina = await contexto.newPage();
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.Llamadas, null, { timeout: 60000 });
await pagina.waitForTimeout(2500);
await pagina.click('button.pestana[data-pantalla="abiertos"]');
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="SANCION Fuentes Calvo"] .tarjeta-nombre').first().click();
await pagina.waitForSelector('.tcd-abrir-form', { timeout: 15000 });

const NOMBRE_TAREA = 'Llamar a la familia';
const tarea = (nombre) => pagina.locator('.guion-paso', { has: pagina.locator('.guion-paso-texto', { hasText: nombre }) });
async function anadirTarea(nombre) {
  await pagina.click('.tcd-abrir-form');
  await pagina.fill('#guion-nueva-tarea', nombre);
  await pagina.selectOption('.tcd-accion', 'llamar');
  await pagina.click('.tcd-anadir');
  await pagina.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("' + nombre + '"))');
}
async function ventanaAbierta() { await pagina.waitForSelector('.ll-capa .ll-cuadro', { timeout: 8000 }); await pagina.waitForSelector('.ll-per', { timeout: 8000 }); }
async function esperarVentanaCerrada() { await pagina.waitForSelector('.ll-capa', { state: 'detached', timeout: 8000 }); await pagina.waitForTimeout(500); }
async function esperarCuenta(nombre, texto) {
  await pagina.waitForFunction(([n, t]) => [...document.querySelectorAll('.guion-paso')].some((x) => x.querySelector('.guion-paso-texto').textContent === n &&
    x.querySelector('.ll-lista summary') && x.querySelector('.ll-lista summary').textContent === t), [nombre, texto], { timeout: 10000 });
}
async function lineasDelRegistro() {
  return pagina.evaluate(() => RegistroAsunto.lineas(FichaNucleo.actual).map((l) => ({ texto: l.texto, hito: l.hitoTitulo, auto: l.auto, llamada: !!l.llamada })));
}

console.log('--- la tarea «Llamar por teléfono» ---');
await pagina.click('.tcd-abrir-form');
await comprobar('«Llamar por teléfono» es la última opción de «Qué se hace» al añadir una tarea', pagina.evaluate(() => {
  const o = [...document.querySelectorAll('.tcd-accion option')].map((x) => x.textContent);
  return o[o.length - 1];
}), 'Llamar por teléfono');
await pagina.click('.tcd-cancelar-form');
await comprobar('«Llamar por teléfono» es la última de GuiasGuion.ACCIONES y sale en las listas comunes', pagina.evaluate(() => [
  GuiasGuion.ACCIONES[GuiasGuion.ACCIONES.length - 1].texto, Comunes.textoDeHace('llamar')]), ['Llamar por teléfono', 'Llamar por teléfono']);
await anadirTarea(NOMBRE_TAREA);
await comprobar('la tarea nueva: etiqueta, botón con el icono (sin texto) y «Sin llamadas todavía»', pagina.evaluate((n) => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === n)[0];
  const b = t.querySelector('.ll-boton');
  return { etiqueta: t.querySelector('.guion-tarea-accion').textContent, icono: !!b.querySelector('svg'), texto: b.textContent.trim(), titulo: b.title, vacia: t.querySelector('.ll-lista').textContent.trim() };
}, NOMBRE_TAREA), { etiqueta: 'Llamar por teléfono', icono: true, texto: '', titulo: 'Apuntar llamada', vacia: 'Sin llamadas todavía' });

console.log('--- desde el botón de la tarea ---');
await tarea(NOMBRE_TAREA).locator('.ll-boton').click();
await ventanaAbierta();
await comprobar('la ventana sale con «He llamado yo», el nombre de la tarea en el título y sin «¿Es de una tarea?»', pagina.evaluate(() => ({
  titulo: document.getElementById('ll-titulo').textContent, sentido: document.querySelector('input[name="ll-sentido"]:checked').value,
  pregunta: !document.getElementById('ll-bloque-tarea').hidden, rotulo: document.getElementById('ll-rot-quien').textContent,
  res: !document.getElementById('ll-bloque-res').hidden })),
  { titulo: 'Apuntar llamada · ' + NOMBRE_TAREA, sentido: 'emitida', pregunta: false, rotulo: 'A quién', res: true });
await comprobar('salen las personas con teléfono, con su papel y el botón de copiar', pagina.evaluate(() => [...document.querySelectorAll('.ll-per')].map((p) => ({
  tel: p.querySelector('.ll-tel').textContent, copiar: !!p.querySelector('.ll-cop'), nombre: p.querySelector('.ll-q').textContent.trim() }))),
  [{ tel: '600 777 888', copiar: true, nombre: 'La familia tutores legales' }]);
await pagina.click('#ll-ok');
await comprobar('«Apuntar» sin persona dice qué falta y no apunta', pagina.evaluate(() => document.getElementById('ll-falta').textContent), 'Di a quién has llamado.');
await pagina.click('.ll-per');
await pagina.click('#ll-ok');
await comprobar('«Apuntar» sin «Qué ha pasado» dice qué falta', pagina.evaluate(() => document.getElementById('ll-falta').textContent), 'Di si has hablado o no contesta.');
await pagina.fill('#ll-otra', '952 000 000');
await comprobar('escribir en «Otra persona o número» suelta a la persona elegida', pagina.evaluate(() => document.querySelectorAll('.ll-per.el').length), 0);
await pagina.click('.ll-per');
await comprobar('elegir una persona vacía la casilla «Otra persona o número»', pagina.evaluate(() => document.getElementById('ll-otra').value), '');
await pagina.fill('#ll-dia', '');
await pagina.click('#ll-ok');
await comprobar('«Apuntar» sin día dice qué falta', pagina.evaluate(() => document.getElementById('ll-falta').textContent), 'Pon el día y la hora de la llamada.');
await pagina.fill('#ll-dia', '2026-11-13');
await pagina.fill('#ll-hora', '10:30');
await pagina.check('input[name="ll-res"][value="no"]');
await pagina.fill('#ll-com', 'Salta el buzón.');
await pagina.click('#ll-ok');
await esperarVentanaCerrada();
await esperarCuenta(NOMBRE_TAREA, '1 llamada · 0 con respuesta');
await comprobar('«No contesta»: la cuenta sube, 0 con respuesta, la tarea sigue pendiente y el botón sigue', pagina.evaluate((n) => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === n)[0];
  return { cuenta: t.querySelector('.ll-lista summary').textContent, plegada: !t.querySelector('details.ll-lista').open,
    hecha: t.querySelector('.guion-casilla').checked, boton: !!t.querySelector('.ll-boton') };
}, NOMBRE_TAREA), { cuenta: '1 llamada · 0 con respuesta', plegada: true, hecha: false, boton: true });
await comprobar('la línea sale en el Registro, con su hito y su tarea', (async () => {
  const l = (await lineasDelRegistro()).filter((x) => x.llamada)[0];
  return l && { texto: l.texto, hito: l.hito, auto: l.auto };
})(), { texto: 'Llamada a La familia (tutores legales) · 600 777 888: no contesta. Salta el buzón. Tarea: ' + NOMBRE_TAREA, hito: 'Informar al tutor/a', auto: true });

console.log('--- «He hablado» marca la tarea; la hora de la llamada manda ---');
await tarea(NOMBRE_TAREA).locator('.ll-boton').click();
await ventanaAbierta();
await pagina.click('.ll-per');
await pagina.check('input[name="ll-res"][value="si"]');
await pagina.fill('#ll-dia', '2026-11-12');
await pagina.fill('#ll-hora', '09:00');
await pagina.fill('#ll-com', 'Hablo con la madre.');
await pagina.click('#ll-ok');
await esperarVentanaCerrada();
await esperarCuenta(NOMBRE_TAREA, '2 llamadas · 1 con respuesta');
await comprobar('«He hablado»: la tarea se marca sola, el botón sigue y la cuenta dice 1 con respuesta', pagina.evaluate((n) => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === n)[0];
  return { cuenta: t.querySelector('.ll-lista summary').textContent, hecha: t.querySelector('.guion-casilla').checked, boton: !!t.querySelector('.ll-boton') };
}, NOMBRE_TAREA), { cuenta: '2 llamadas · 1 con respuesta', hecha: true, boton: true });
await comprobar('al pulsar la línea se abren las llamadas, la de la hora más reciente arriba (aunque se apuntara después la de ayer)', (async () => {
  await tarea(NOMBRE_TAREA).locator('.ll-lista summary').click();
  return pagina.evaluate((n) => {
    const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === n)[0];
    return [...t.querySelectorAll('.ll-linea')].map((l) => (l.textContent.indexOf('Hablado') !== -1 ? 'Hablado' : 'No contesta'));
  }, NOMBRE_TAREA);
})(), ['No contesta', 'Hablado']);
await comprobar('en el Registro hay una línea «Tarea hecha»', (async () => (await lineasDelRegistro()).some((x) => x.texto === 'Tarea hecha: ' + NOMBRE_TAREA))(), true);

console.log('--- desde la cabecera del asunto ---');
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
await pagina.click('.ll-boton-cabecera');
await ventanaAbierta();
await comprobar('la ventana sale con «Me han llamado», «Quién ha llamado», sin «Qué ha pasado» y con «¿Es de una tarea?» en «No, de ninguna»', pagina.evaluate(() => ({
  titulo: document.getElementById('ll-titulo').textContent, sentido: document.querySelector('input[name="ll-sentido"]:checked').value,
  rotulo: document.getElementById('ll-rot-quien').textContent, res: !document.getElementById('ll-bloque-res').hidden,
  pregunta: !document.getElementById('ll-bloque-tarea').hidden, elegida: document.getElementById('ll-tarea').textContent.replace(/[▾▴]/g, '').trim() })),
  { titulo: 'Apuntar llamada', sentido: 'recibida', rotulo: 'Quién ha llamado', res: false, pregunta: true, elegida: 'No, de ninguna' });
await pagina.click('#ll-tarea');
await comprobar('al desplegar: «No, de ninguna» y los hitos (el actual primero), sin sus tareas', pagina.evaluate(() => ({
  opciones: [...document.querySelectorAll('#ll-tarea-lista button')].map((b) => b.textContent.trim()),
  negrita: [...document.querySelectorAll('#ll-tarea-lista .ll-hito')].every((b) => getComputedStyle(b).fontWeight >= 600), tareas: document.querySelectorAll('#ll-tarea-lista .ll-ta').length })),
  { opciones: ['No, de ninguna', '▸ Informar al tutor/a (el actual)', '▸ Entregar la notificación a la familia'], negrita: true, tareas: 0 });
await pagina.click('#ll-tarea-lista .ll-hito');
await comprobar('al pulsar un hito salen sus tareas (todas, no solo las de llamar)', pagina.evaluate(() => [...document.querySelectorAll('#ll-tarea-lista .ll-ta')].map((b) => b.textContent.trim())),
  ['Avisar al tutor/a', NOMBRE_TAREA + ' (hecha)']);
await pagina.click('#ll-tarea-lista .ll-ta >> nth=0');
await comprobar('al elegir una tarea la lista se cierra y se lee «Hito › Tarea»', pagina.evaluate(() => ({
  abierta: !document.getElementById('ll-tarea-lista').hidden, texto: document.getElementById('ll-tarea').textContent.replace(/[▾▴]/g, '').trim() })),
  { abierta: false, texto: 'Informar al tutor/a › Avisar al tutor/a' });
await pagina.click('.ll-per');
await pagina.fill('#ll-com', 'Pregunta por la sanción.');
await pagina.click('#ll-ok');
await esperarVentanaCerrada();
await esperarCuenta('Avisar al tutor/a', '1 llamada · 1 con respuesta');
await comprobar('con una tarea que no es de llamar: queda bajo esa tarea, plegada, y la tarea no se marca', pagina.evaluate(() => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === 'Avisar al tutor/a')[0];
  return { cuenta: t.querySelector('.ll-lista summary').textContent, plegada: !t.querySelector('details.ll-lista').open, hecha: t.querySelector('.guion-casilla').checked };
}), { cuenta: '1 llamada · 1 con respuesta', plegada: true, hecha: false });
await pagina.click('.ll-boton-cabecera');
await ventanaAbierta();
await pagina.click('.ll-per');
await pagina.fill('#ll-com', 'Llama otra vez, sin tarea.');
await pagina.click('#ll-ok');
await esperarVentanaCerrada();
await comprobar('sin tarea: la llamada sale solo en el Registro, sin hito', (async () => {
  const l = (await lineasDelRegistro()).filter((x) => x.llamada && x.texto.indexOf('sin tarea') !== -1)[0];
  return l && { texto: l.texto, hito: l.hito };
})(), { texto: 'Llamada recibida de La familia (tutores legales) · 600 777 888. Llama otra vez, sin tarea.', hito: '' });
await comprobar('en el Registro de la ficha salen las llamadas, y solo las dos de la tarea de llamar por su hito', pagina.evaluate(() =>
  [...document.querySelectorAll('#ficha-notas-lista .registro-linea')].filter((l) => l.textContent.indexOf('Llamada') === 0 || l.querySelector('.llamada-corregir')).length), 4);

console.log('--- corregir una llamada ---');
const LINEA_SIN_TAREA = '#ficha-notas-lista .registro-linea:has(.llamada-corregir):has-text("sin tarea")';
await pagina.locator(LINEA_SIN_TAREA).locator('.registro-mas').click();
await comprobar('cada llamada del Registro lleva «⋮» con «Corregir» y no con «Borrar»', pagina.evaluate(() => {
  const l = [...document.querySelectorAll('#ficha-notas-lista .registro-linea')].filter((x) => x.textContent.indexOf('sin tarea') !== -1)[0];
  return { corregir: !!l.querySelector('.llamada-corregir'), borrar: !!l.querySelector('.registro-borrar'), cambiar: !!l.querySelector('.registro-cambiar') };
}), { corregir: true, borrar: false, cambiar: false });
await pagina.locator(LINEA_SIN_TAREA).locator('.llamada-corregir').click();
await ventanaAbierta();
await comprobar('«Corregir llamada» abre la misma ventana con todo relleno, el botón «Guardar» y sin preguntar la tarea', pagina.evaluate(() => ({
  titulo: document.getElementById('ll-titulo').textContent, boton: document.getElementById('ll-ok').textContent,
  comentario: document.getElementById('ll-com').value, pregunta: !document.getElementById('ll-bloque-tarea').hidden, persona: document.querySelectorAll('.ll-per.el').length })),
  { titulo: 'Corregir llamada', boton: 'Guardar', comentario: 'Llama otra vez, sin tarea.', pregunta: false, persona: 1 });
await pagina.fill('#ll-com', 'Llama otra vez, sin tarea. Corregido.');
await pagina.click('#ll-ok');
await esperarVentanaCerrada();
await comprobar('al guardar: la llamada sale con lo nuevo y «corregida»; el Registro guarda lo de antes', (async () => {
  const ls = await lineasDelRegistro();
  return { nueva: ls.filter((x) => x.texto === 'Llamada recibida de La familia (tutores legales) · 600 777 888. Llama otra vez, sin tarea. Corregido.').length,
    antes: ls.filter((x) => x.texto.indexOf('corregida. Antes: Llamada recibida de La familia (tutores legales) · 600 777 888. Llama otra vez, sin tarea.') !== -1).length,
    marca: await pagina.evaluate(() => document.querySelectorAll('#ficha-notas-lista .ll-corregida').length) };
})(), { nueva: 1, antes: 1, marca: 1 });

console.log('--- corregir «No contesta» a «He hablado» marca la tarea de llamar pendiente ---');
await anadirTarea('Llamar al tutor');
await tarea('Llamar al tutor').locator('.ll-boton').click();
await ventanaAbierta();
await pagina.click('.ll-per');
await pagina.check('input[name="ll-res"][value="no"]');
await pagina.click('#ll-ok');
await esperarVentanaCerrada();
await esperarCuenta('Llamar al tutor', '1 llamada · 0 con respuesta');
await comprobar('«No contesta» deja la tarea pendiente', pagina.evaluate(() => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === 'Llamar al tutor')[0];
  return t.querySelector('.guion-casilla').checked;
}), false);
await tarea('Llamar al tutor').locator('.ll-lista summary').click();
await tarea('Llamar al tutor').locator('.registro-mas').click();
await tarea('Llamar al tutor').locator('.llamada-corregir').click();
await ventanaAbierta();
await pagina.check('input[name="ll-res"][value="si"]');
await pagina.click('#ll-ok');
await esperarVentanaCerrada();
await esperarCuenta('Llamar al tutor', '1 llamada · 1 con respuesta');
await comprobar('corregida a «He hablado»: la tarea se marca sola y la llamada sale «corregida»', pagina.evaluate(() => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === 'Llamar al tutor')[0];
  return { hecha: t.querySelector('.guion-casilla').checked, corregida: !!t.querySelector('.ll-corregida'), cuenta: t.querySelector('.ll-lista summary').textContent };
}), { hecha: true, corregida: true, cuenta: '1 llamada · 1 con respuesta' });

console.log('--- lo general ---');
await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallos'); process.exit(1); }
console.log('\nTodo bien');
