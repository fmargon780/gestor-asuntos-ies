/* Prueba en navegador de verdad de la fila 34 (17-sep-2026,
   docs/NOTAS-DEL-ASUNTO-NO-SE-BORRAN.md): las notas de dentro de un
   asunto no se borran mientras se escriben, aunque la ficha se
   repinte sola por detrás (App.mirarLaCarpeta cada 20 segundos, la
   vigilancia de presencia cada 10, fila 24).

   El fallo: la ficha del asunto (js/ficha-asunto.js) y el panel de
   hitos (js/hitos-panel.js) rehacían con innerHTML el <textarea> de
   la nota del asunto y el de la nota de un hito en cada repintado
   automático, sin guardar lo que hubiera a medio escribir. La misma
   familia de fallo que la fila 33 (docs/TABLON-NO-SE-BORRA.md), en
   otro sitio, con la misma ayuda: U.conservandoLoEscrito.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, y la guía de
   mentira del patrón de pruebas/hitos.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* Una guía de un solo paso, colgada del tipo COMPRA (EMPRESAS: no hace
   falta ningún RegAlum de mentira para que el asunto se pueda crear).
   guias-enganche.js solo lee guias.json una vez, al arrancar: por eso
   se escribe ANTES del primer #btn-entrar, igual que en
   pruebas/hitos.mjs. */
const GUIA = [{ id: 'p1', titulo: 'Revisar el presupuesto', cuerpo: '', opciones: [] }];
const NOMBRE_ASUNTO = '260917 COMPRA Proveedor de Prueba SL 12345678A';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.evaluate(async (guia) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const guiaH = await g.getFileHandle('guias.json', { create: true });
  const w = await guiaH.createWritable();
  await w.write(JSON.stringify({ COMPRA: guia }));
  await w.close();
  await window.__disco.abiertos.getDirectoryHandle(
    '260917 COMPRA Proveedor de Prueba SL 12345678A', { create: true });
}, GUIA);

await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-notas #ficha-nota-texto');
await pagina.waitForSelector('#ficha-guia .hito[data-id="p1"]');

console.log('--- 1) escribir en la nota del asunto y dejarle el foco ---');
await pagina.click('#ficha-nota-texto');
await pagina.keyboard.type('Falta el presupuesto firmado', { delay: 10 });
await pagina.evaluate(() => document.getElementById('ficha-nota-texto').setSelectionRange(5, 5));

console.log('--- 2) un repintado de verdad: llega un documento nuevo dentro del asunto ---');
/* App.mirarLaCarpeta (cada App.SEGUNDOS_ENTRE_MIRADAS) solo mira el
   nivel de "Asuntos abiertos" (sueltos y nombres de carpeta); un
   documento nuevo DENTRO de un asunto ya abierto lo recoge
   App.verAbiertos, al que llama por su cuenta cada vez que sí ve algo
   distinto ahí arriba. Se llama aquí directo, como en
   pruebas/quedarse-en-el-asunto.mjs, para no depender de ese primer
   escalón y probar solo lo de esta fila: que reengancharFicha (que
   verAbiertos dispara siempre) no tire la nota a medias. */
const DOC_NUEVO = '260917 PRESUPUESTO Referencia.pdf';
await pagina.evaluate(async (datos) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto);
  carpeta._hijos.set(datos.doc, window.__disco.fich(datos.doc, 'el presupuesto'));
  await window.App.verAbiertos();
}, { asunto: NOMBRE_ASUNTO, doc: DOC_NUEVO });
await pagina.waitForTimeout(50);

await comprobar('el documento nuevo ha entrado en la ficha (ha habido un repintado de verdad)',
  pagina.evaluate((n) => Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento'))
    .some((b) => b.textContent.indexOf(n) !== -1), DOC_NUEVO), true);
await comprobar('3) la nota del asunto sigue escrita', pagina.inputValue('#ficha-nota-texto'),
  'Falta el presupuesto firmado');
await comprobar('3) el campo sigue teniendo el foco',
  pagina.evaluate(() => document.activeElement === document.getElementById('ficha-nota-texto')), true);
await comprobar('3) el cursor sigue en el mismo sitio',
  pagina.evaluate(() => {
    var c = document.getElementById('ficha-nota-texto');
    return [c.selectionStart, c.selectionEnd];
  }), [5, 5]);

console.log('--- 5) sin ningún cambio, App.reengancharFicha() deja la pantalla quieta ---');
await pagina.evaluate(() => {
  window.__marcaNota = document.getElementById('ficha-nota-texto');
});
await pagina.evaluate(async () => { await window.App.reengancharFicha(); });
await comprobar('el campo de la nota sigue siendo el mismo elemento (no se ha rehecho la ficha)',
  pagina.evaluate(() => document.getElementById('ficha-nota-texto') === window.__marcaNota), true);

console.log('--- 4) lo mismo con la nota de un hito ---');
await pagina.locator('#ficha-guia .hito[data-id="p1"] .hito-titulo').click();
await pagina.waitForSelector('#ficha-guia .hito[data-id="p1"] .hito-nota-texto');
await pagina.click('#ficha-guia .hito[data-id="p1"] .hito-nota-texto');
await pagina.keyboard.type('Llamar antes de aprobarlo', { delay: 10 });
await pagina.evaluate(() => {
  document.querySelector('#ficha-guia .hito[data-id="p1"] .hito-nota-texto').setSelectionRange(6, 6);
});

console.log('--- un repintado del panel de hitos, sin tocar la carpeta ---');
await pagina.evaluate(async () => { window.HitosPanel.programarRepintado(); });
await pagina.waitForTimeout(80);

await comprobar('la nota del hito sigue escrita',
  pagina.evaluate(() => document.querySelector('#ficha-guia .hito[data-id="p1"] .hito-nota-texto').value),
  'Llamar antes de aprobarlo');
await comprobar('el campo de la nota del hito sigue teniendo el foco',
  pagina.evaluate(() =>
    document.activeElement === document.querySelector('#ficha-guia .hito[data-id="p1"] .hito-nota-texto')),
  true);
await comprobar('el cursor de la nota del hito sigue en el mismo sitio',
  pagina.evaluate(() => {
    var c = document.querySelector('#ficha-guia .hito[data-id="p1"] .hito-nota-texto');
    return [c.selectionStart, c.selectionEnd];
  }), [6, 6]);
await comprobar('el hito sigue desplegado (si no, el foco habría ido a un campo escondido)',
  pagina.locator('#ficha-guia .hito[data-id="p1"] .hito-cuerpo').evaluate((el) => !el.classList.contains('oculto')),
  true);

console.log(errores.length ? '\nErrores de consola:\n' + errores.join('\n') : '');
await navegador.close();
if (fallos || errores.length) { console.log('\n' + (fallos + errores.length) + ' fallo(s).'); process.exit(1); }
console.log('\nTodas las pruebas de notas-no-se-borran pasan.');
