/* Fila 434 (23-oct-2026, docs/ARREGLOS-DEL-HITO-EN-TRABAJO.md), puntos 2, 3 y 4, con Chromium real y los datos de la copia de
   pruebas (?demo=1&auto=1):
   2. SANCION de Fuentes Calvo (1º Bach A, tutora sin correo): el aviso ámbar trae una casilla y «Guardar»; sin el enlace a
      las tablas de datos; al guardar, el correo queda en _GESTOR/correos-a-mano.json al momento, va a «Otro correo», el aviso
      desaparece y el cuadro sigue abierto.
   3. MATRICULA de Pablo Aguilar Ponce: «Preparar correo» en el hito 2 no propone «Confirmación de matrícula» (la final).
   4. «Generar documento» en un hito sin plantilla propia ofrece las plantillas de documento del tipo, a la vista. */
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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 900 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.InformarAlTutor, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

console.log('--- 2. el correo del tutor, sin salir del cuadro ---');
await pagina.evaluate(() => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0];
  window.__cuadro = CorreoNucleo.abrirCuadro(a, false, {});
});
await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario', { timeout: 15000 });
await pagina.waitForTimeout(800);
await comprobar('2. el aviso trae la casilla y «Guardar», y no el enlace a las tablas', pagina.evaluate(() => ({
  texto: document.querySelector('.correo-tutor-falta').childNodes[0].textContent,
  casilla: document.querySelectorAll('.correo-tutor-escribir').length, guardar: document.querySelectorAll('.correo-tutor-guardar').length,
  enlace: document.querySelectorAll('.correo-tutor-completar').length })),
  { texto: 'Falta el correo de Cabello Ruiz, Esperanza (tutor/a de 1º Bach A)', casilla: 1, guardar: 1, enlace: 0 });
await pagina.fill('.correo-tutor-escribir', 'esto no es un correo');
await pagina.click('.correo-tutor-guardar');
await pagina.waitForTimeout(400);
await comprobar('2. un correo mal escrito no se guarda', pagina.evaluate(async () => [Object.keys(await CorreosAMano.leerTodos()).length, document.querySelectorAll('.correo-tutor-escribir').length]), [0, 1]);
await pagina.fill('.correo-tutor-escribir', 'esperanza@correo-demo.es');
await pagina.click('.correo-tutor-guardar');
await pagina.waitForFunction(() => !document.querySelector('.correo-tutor-escribir'), null, { timeout: 8000 });
await comprobar('2. se guarda al momento, sin enviar', pagina.evaluate(async () => {
  const t = await CorreosAMano.leerTodos();
  return Object.keys(t).map((k) => [k, t[k].correo, t[k].nombre]);
}), [['77889900', 'esperanza@correo-demo.es', 'Cabello Ruiz, Esperanza']]);
await comprobar('2. el tutor queda como destinatario, el aviso desaparece y el cuadro sigue abierto', pagina.evaluate(() => ({
  para: document.getElementById('correo-otro').value, avisos: document.querySelectorAll('.correo-tutor-falta').length,
  abierto: !document.getElementById('capa').classList.contains('oculto') && !!document.getElementById('correo-formulario') })),
  { para: 'esperanza@correo-demo.es', avisos: 0, abierto: true });
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

console.log('--- 3 y 4. matrícula: plantilla de correo y «Generar documento» ---');
await pagina.click('button.pestana[data-pantalla="abiertos"]');
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="MATRICULA Aguilar Ponce, Pablo"] .tarjeta-nombre').first().click();
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForSelector('#ficha-guia.con-mesa', { timeout: 10000 });
await pagina.locator('.hito-en-mesa .mesa-tira-hito', { hasText: 'Comprobar la documentación' }).click();
await pagina.waitForFunction(() => document.querySelector('.hito-en-mesa .mesa-titulo').textContent === 'Comprobar la documentación');
await pagina.waitForTimeout(600);
await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="generar"]');
await pagina.waitForTimeout(300);
await comprobar('4. «Generar documento» ofrece, a la vista, la plantilla de documento del tipo', pagina.evaluate(() => ({
  filas: [...document.querySelectorAll('.hito-en-mesa .mesa-plantillas .mesa-plantilla-nombre')].map((x) => x.textContent),
  visible: [...document.querySelectorAll('.hito-en-mesa .mesa-plantillas .mesa-plantilla-generar')].every((b) => b.offsetParent !== null) })),
  { filas: ['Resguardo de matrícula'], visible: true });
await pagina.keyboard.press('Escape');
await pagina.evaluate(() => HitoMesa.cerrarPanelSiAbierto && HitoMesa.cerrarPanelSiAbierto());
await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="comunicar"]');
await pagina.waitForSelector('.hito-en-mesa .mesa-preparar-correo');
await pagina.click('.hito-en-mesa .mesa-preparar-correo');
await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario', { timeout: 15000 });
await pagina.waitForTimeout(800);
await comprobar('3. el hito 2 no propone «Confirmación de matrícula», y esa plantilla sigue en la lista', pagina.evaluate(() => {
  const s = document.getElementById('correo-plantilla');
  return [s.selectedOptions[0].textContent, [...s.options].map((o) => o.textContent).indexOf('Confirmación de matrícula') !== -1];
}), ['Documentación pendiente de matrícula', true]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
