/* Prueba en navegador de verdad de la fila 154 de docs/COLA.md
   (docs/HITOS-ACCIONES-EN-EL-HITO.md, puntos 1, 2 y 5):

   1. Las acciones, solo en el hito: los pasos del guion no llevan botón
      de acción; la cabecera de la mesa lleva «Generar documento ▾»,
      «Comunicar ▾» y «Registrar»; con hitos, la barra de arriba de la
      ficha ya no enseña «Comunicar». (Un asunto abierto sin guía recibe la
      guía mínima, así que siempre tiene hitos: el caso «sin hitos» no se
      da en la práctica.)
   2. Un paso hecho dice al lado quién lo hizo; uno «No aplica», tachado.
   5. Los números cuadran: con un hito «solo informativo» delante del
      actual, la marca de la cabecera («Hito N de M»), la pestaña «Hitos
      N/M» y el «Hito N de M» de la mesa dicen lo mismo; y la barra del
      guion no cuenta los «No aplica» (4 pasos, uno no aplica y uno
      hecho: «1 de 3»).
   Y «Registrar» de la cabecera registra el único documento sin registro. */
import { chromium } from 'playwright';
import { abrirHito, verLaLista } from './apoyo/hito.mjs';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const CON_HITOS = '260910 CONVALIDACION 26-27 Inventada Uno, Eva 9990001';
const GUIAS = {
  CONVALIDACION: [
    { id: 'p1', titulo: 'Recibir', cuerpo: '', opciones: [] },
    { id: 'p2', titulo: 'Informar', cuerpo: '', opciones: [] },
    { id: 'p3', titulo: 'Revisar', cuerpo: '', opciones: [] },
    { id: 'p4', titulo: 'Comunicar', cuerpo: '', opciones: [],
      guion: [
        { id: 'g1', texto: 'Mirar el expediente', explicacion: '', accion: '' },
        { id: 'g2', texto: 'Avisar a la familia', explicacion: '', accion: 'comunicar' },
        { id: 'g3', texto: 'Registrar la salida', explicacion: '', accion: 'registrar' },
        { id: 'g4', texto: 'Generar el oficio', explicacion: '', accion: 'generar' }
      ] },
    { id: 'p5', titulo: 'Archivar', cuerpo: '', opciones: [] }
  ]
};

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([guias, a1]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
  const d1 = await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
  await d1.getFileHandle('260910 OFICIO.pdf', { create: true });
}, [GUIAS, CON_HITOS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1]) => {
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Inventada Uno, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, [CON_HITOS]);

/* Abrir la ficha crea los hitos desde la guía. */
await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Uno' }).first().click();
await pagina.waitForSelector('#ficha-guia .hito[data-id="p4"]', { state: 'attached' });
await pagina.evaluate(async (a1) => {
  await Hitos.marcar(a1, 'p1', 'hecho', '');
  await Hitos.guardarCampos(a1, 'p2', { soloInformativo: true });
  await Hitos.marcar(a1, 'p3', 'hecho', '');
  await Hitos.marcarGuion(a1, 'p4', 'g1', { hecho: true });
  await Hitos.marcarGuion(a1, 'p4', 'g3', { noaplica: true });
  await Hitos.anadirDocumento(a1, 'p4', '260910 OFICIO.pdf');
  HitosPanel.programarRepintado();
}, CON_HITOS);
await pagina.waitForTimeout(900);

console.log('--- 5. los números cuadran ---');
await comprobar('la marca de la cabecera dice «Hito 3 de 4» (sin el informativo)',
  pagina.evaluate(() => (document.querySelector('#ficha-estado-hito .marca-hito') || {}).textContent), 'Hito 3 de 4 · Comunicar');
/* Fila 425: «Trabajo» no lleva número; la cuenta de hitos solo está en «Hito N de M». */

await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(300);
await abrirHito(pagina, 'p4');
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="p4"]');
await pagina.waitForTimeout(300);
await comprobar('la mesa dice «Hito 3 de 4» y la tira numera igual (el informativo, sin número)',
  pagina.evaluate(() => [document.querySelector('.hito-en-mesa .mesa-titulo').title,
    document.querySelector('.hito-en-mesa .mesa-tira-hito.actual').textContent.trim(),
    document.querySelector('.hito-en-mesa .mesa-tira-hito[data-id="p2"]').textContent.trim()]), ['Hito 3 de 4', '3. Comunicar', 'i · Informar']);
await comprobar('la barra del guion no cuenta el «No aplica»: «1 de 3»',
  pagina.evaluate(() => document.querySelector('.hito-en-mesa .mesa-guion-cuenta').textContent), '1 de 3');

console.log('--- 1. las acciones, solo en el hito ---');
await comprobar('ningún paso del guion lleva el botón de acción de antes',
  pagina.evaluate(() => document.querySelectorAll('.hito-en-mesa .mesa-guion button.guion-accion-boton').length), 0);
/* Fila 410: solo las tareas pendientes de comunicar y de generar llevan su botón; registrar y las sin acción, no. */
await comprobar('solo comunicar y generar llevan botón dentro de la tarea',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-guion .guion-paso .guion-accion-tarea'))
    .map(b => b.closest('.guion-paso').dataset.id + ':' + b.textContent.trim())), ['g2:Enviar correo', 'g4:Generar documento']);
await comprobar('la cabecera lleva Generar, Comunicar, Marcar y ··· (sin «Registrar», fila 434)',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-acciones button.boton'))
    .filter(b => b.offsetParent).map(b => b.textContent.trim())),
  ['Hacer este hito', 'Generar documento ▾', 'Comunicar ▾', 'Marcar como hecho', 'Hito ▾']);   /* fila 285 */
await comprobar('con hitos, la barra de arriba no enseña «Comunicar»',
  pagina.evaluate(() => { const b = document.querySelector('#ficha-acciones .boton-comunicar'); return !!(b && b.offsetParent); }), false);

console.log('--- 2. los pasos, lista para marcar ---');
await comprobar('un paso hecho dice quién al lado, y no va tachado',
  pagina.evaluate(() => { const p = document.querySelector('.hito-en-mesa .guion-paso[data-id="g1"]');
    return [/Francisco/.test((p.querySelector('.guion-paso-quien') || {}).textContent || ''),
      getComputedStyle(p.querySelector('.guion-paso-texto')).textDecorationLine]; }), [true, 'none']);
await comprobar('un paso «No aplica» va tachado',
  pagina.evaluate(() => getComputedStyle(document.querySelector('.hito-en-mesa .guion-paso[data-id="g3"] .guion-paso-texto')).textDecorationLine), 'line-through');

console.log('--- ya no hay «Registrar» en la cabecera (fila 434) ---');
await comprobar('la cabecera no lleva «Registrar»', pagina.evaluate(() => document.querySelectorAll('.hito-en-mesa .mesa-registrar').length), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
