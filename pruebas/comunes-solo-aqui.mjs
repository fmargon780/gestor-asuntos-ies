/* Fila 531 (docs/531-TAREAS-E-HITOS-COMUNES.md): las listas comunes de tareas y de hitos en la pantalla: «+ Añadir tarea» y
   «+ Añadir hito» con su ventana, crear ahí mismo, «Para», «Cambiar», la propuesta de Mantenimiento y el editor de la guía.
   Copia de pruebas (demo), Chromium real: el disco es falso, nunca se tocan datos reales. */
import { chromium } from 'playwright';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const p = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);

const esperar = (ms) => p.waitForTimeout(ms);
const hay = (sel) => p.evaluate((s) => !!document.querySelector(s), sel);

/* Dos asuntos abiertos de tipos distintos, cada uno con un hito que viene de su guía. */
await p.evaluate(async () => {
  const sitio = {};
  for (const x of App.E.listaAbiertos) {
    const tipo = (x.leido && x.leido.tipo) || (x.ficha && x.ficha.tipo);
    const hs = (await Hitos.hitosDe(x.nombre)).filter((h) => h.origenGuia && h.clase !== 'decision');
    const paso = hs[0] && Hitos.pasoDeGuia(x, hs[0]);
    if (tipo && paso && !(paso.opciones && paso.opciones.length) && !sitio[tipo]) sitio[tipo] = { nombre: x.nombre, hito: hs[0].id };
  }
  const tipos = Object.keys(sitio);
  window.__a = { nombre: sitio[tipos[0]].nombre, hito: sitio[tipos[0]].hito, tipo: tipos[0] };
  window.__b = { nombre: sitio[tipos[1]].nombre, hito: sitio[tipos[1]].hito, tipo: tipos[1] };
  window.__asunto = (k) => App.E.listaAbiertos.filter((x) => x.nombre === window[k].nombre)[0];
  window.__hito = async (k) => (await Hitos.hitosDe(window[k].nombre)).filter((h) => h.id === window[k].hito)[0];
  window.__guiaDe = (tipo) => JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
  window.__lineas = async (k) => Hitos.guionDe(window.__asunto(k), await window.__hito(k)).map((g) => [g.texto, g.comun || '', !!g.propio]);
  window.__preguntas = () => JSON.stringify(Object.entries(GuiasDelCentro.todas()).map(([t, ps]) => [t, ps.filter((x) => x.opciones && x.opciones.length)]));
  window.__antesPreguntas = window.__preguntas();
});
const dosTipos = await p.evaluate(() => [window.__a.tipo, window.__b.tipo]);
console.log('(prueba con los tipos ' + dosTipos.join(' y ') + ')');

const lista = () => p.evaluate(async () => { const l = await ComunesGuardado.leer(); return [l.tareas.map((x) => x.nombre), l.hitos.map((x) => x.nombre)]; });
const guiaAntes = await p.evaluate(() => JSON.stringify(window.__guiaDe(window.__a.tipo)));

console.log('--- tarea nueva «Solo este asunto» ---');
await p.evaluate(async () => ComunesAsunto.anadirTarea(window.__asunto('__a'), await window.__hito('__a')));
await p.waitForSelector('.capa-campos #cv-crear');
await p.selectOption('#cv-para', 'aqui');
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Tarea suelta de prueba');
await p.selectOption('#cn-hace', 'firmar');
await p.click('#cn-crear');
await esperar(900);
await comprobar('1a. sale en el asunto, como propia', p.evaluate(async () => (await window.__lineas('__a')).filter((x) => x[0] === 'Tarea suelta de prueba').map((x) => [x[1], x[2]])), [['', true]]);
await comprobar('1b. no entra en la lista común', lista(), [[], []]);
await comprobar('1c. la guía no cambia', p.evaluate(() => JSON.stringify(window.__guiaDe(window.__a.tipo))), guiaAntes);
await p.evaluate(async () => ComunesAsunto.anadirTarea(window.__asunto('__a'), await window.__hito('__a')));
await p.waitForSelector('.capa-campos #cv-crear');
await comprobar('1d. al abrir otra vez la ventana no está', p.evaluate(() => document.querySelectorAll('.comunes-fila').length), 0);
await p.selectOption('#cv-para', 'aqui');
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Tarea suelta de prueba');
await p.click('#cn-crear');
await esperar(900);
await comprobar('1e. el nombre puede repetirse con «Solo este asunto»', p.evaluate(async () => (await window.__lineas('__a')).filter((x) => x[0] === 'Tarea suelta de prueba').length), 2);

console.log('--- hito nuevo «Solo este asunto» ---');
await p.evaluate(async () => ComunesAsunto.anadirHito(window.__asunto('__a'), await window.__hito('__a')));
await p.waitForSelector('.capa-campos #cv-crear');
await p.selectOption('#cv-para', 'aqui');
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Hito suelto de prueba');
await p.click('#cn-crear');
await esperar(900);
await comprobar('2a. el hito sale en el asunto', p.evaluate(async () => (await Hitos.hitosDe(window.__a.nombre)).filter((h) => h.titulo === 'Hito suelto de prueba').length), 1);
await comprobar('2b. no entra en la lista común', lista(), [[], []]);
await comprobar('2c. la guía no cambia', p.evaluate(() => JSON.stringify(window.__guiaDe(window.__a.tipo))), guiaAntes);

console.log('--- «Este asunto y los siguientes» sigue igual ---');
await p.evaluate(async () => ComunesAsunto.anadirTarea(window.__asunto('__a'), await window.__hito('__a')));
await p.waitForSelector('.capa-campos #cv-crear');
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Tarea de la guía de prueba');
await p.click('#cn-crear');
await esperar(900);
await comprobar('3a. entra en la lista común y en la guía', p.evaluate(async () => {
  const l = await ComunesGuardado.leer();
  const t = l.tareas[0];
  return [l.tareas.map((x) => x.nombre), !!t && window.__guiaDe(window.__a.tipo).some((x) => (x.guion || []).some((g) => g.comun === t.id))];
}), [['Tarea de la guía de prueba'], true]);
await p.evaluate(async () => ComunesAsunto.anadirTarea(window.__asunto('__a'), await window.__hito('__a')));
await p.waitForSelector('.capa-campos #cv-crear');
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Tarea de la guía de prueba');
await p.click('#cn-crear');
await comprobar('3b. con ese «Para», repetir el nombre sigue sin dejarse', p.evaluate(() => document.querySelector('#cn-err').textContent), 'Ya existe con ese nombre.');
await p.keyboard.press('Escape');

await comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
