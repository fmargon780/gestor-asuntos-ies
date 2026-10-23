/* Fila 434 (23-oct-2026, docs/ARREGLOS-DEL-HITO-EN-TRABAJO.md), puntos 1 y 5, con Chromium real y el disco de mentira:
   1. Al marcar la última tarea de un hito no sale ninguna ventana; «Marcar como hecho» queda resaltado y el hito solo se
      cierra al pulsarlo.
   2. Al unir un PDF sellado a un documento del hito (RegistroSellado.asociar), la primera tarea de registrar pendiente de
      ese hito se marca sola; con { noMarcar: true } (el registro por personas) no.
   3. La cabecera del hito ya no lleva «Registrar». */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260910 CONVALIDACION 26-27 Inventada Uno, Eva 9990001';
const GUIAS = {
  CONVALIDACION: [
    { id: 'p1', titulo: 'Recibir', cuerpo: '', opciones: [],
      guion: [
        { id: 'g1', texto: 'Mirar el expediente', explicacion: '', accion: '' },
        { id: 'g2', texto: 'Registrar la entrada', explicacion: '', accion: 'registrar' }
      ] },
    { id: 'p2', titulo: 'Archivar', cuerpo: '', opciones: [] }
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
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
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
  for (const n of ['260911 INFORME.pdf', '260910 INFORME.pdf', 'escaneado.pdf', 'escaneado2.pdf']) await d1.getFileHandle(n, { create: true });
}, [GUIAS, ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (a1) => {
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Inventada Uno, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);
await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Uno' }).first().click();
await pagina.waitForSelector('#ficha-guia .hito[data-id="p1"]', { state: 'attached' });
await pagina.evaluate(async (a1) => {
  await Hitos.anadirDocumento(a1, 'p1', '260911 INFORME.pdf');
  await Hitos.anadirDocumento(a1, 'p1', '260910 INFORME.pdf');
  HitosPanel.programarRepintado();
}, ASUNTO);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="p1"]', { timeout: 15000 });
await pagina.waitForTimeout(800);

const marcadas = () => pagina.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .guion-paso')].map((p) => p.dataset.id + ':' + (p.querySelector('.guion-casilla').checked ? 'si' : 'no')));
const hayVentana = () => pagina.evaluate(() => !document.getElementById('capa').classList.contains('oculto'));
const SELLO = { anio: '26', serie: 'M', tipo: 'E', numero: '0368', fecha: '10/09/2026' };
const asociar = (pdf, original, opciones) => pagina.evaluate(async ([a1, pdf, original, sello, opciones]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === a1)[0];
  const r = await RegistroSellado.asociar(a, pdf, original, sello, opciones); return !!r;
}, [ASUNTO, pdf, original, SELLO, opciones]);

console.log('--- 3. sin «Registrar» en la cabecera ---');
await comprobar('3. la cabecera no lleva «Registrar»', pagina.evaluate(() => document.querySelectorAll('.hito-en-mesa .mesa-registrar').length), 0);

console.log('--- 2. el PDF sellado marca solo la tarea de registrar ---');
await comprobar('2. al empezar, ninguna tarea marcada', marcadas(), ['g1:no', 'g2:no']);
await comprobar('2. con { noMarcar: true } (registro por personas) la tarea no se marca', Promise.all([asociar('escaneado.pdf', '260910 INFORME.pdf', { noMarcar: true }), marcadas()]), [true, ['g1:no', 'g2:no']]);
await comprobar('2. al unir el sellado a un documento del hito, se marca la tarea de registrar', Promise.all([asociar('escaneado2.pdf', '260911 INFORME.pdf'), (async () => { await pagina.waitForTimeout(1200); return marcadas(); })()]), [true, ['g1:no', 'g2:si']]);

console.log('--- 1. sin ventana al completar el hito ---');
await pagina.locator('.hito-en-mesa .guion-paso[data-id="g1"] .guion-casilla').click();
await pagina.waitForTimeout(1500);
await comprobar('1. al marcar la última tarea no sale ninguna ventana', hayVentana(), false);
await comprobar('1. «Marcar como hecho» queda resaltado y el hito sigue sin cerrar', pagina.evaluate(() => {
  const b = document.querySelector('.hito-en-mesa .mesa-marcar-hecho');
  return [b.classList.contains('mesa-hecho-resaltado'), b.textContent.trim(), !!document.querySelector('.hito-en-mesa .mesa-etq-hecho')];
}), [true, 'Marcar como hecho', false]);
await pagina.click('.hito-en-mesa .mesa-marcar-hecho');
await pagina.waitForTimeout(1500);
await comprobar('1. al pulsarlo, el hito queda hecho', pagina.evaluate((a1) => Hitos.hitosDe(a1).then((hs) => hs[0].estado), ASUNTO), 'hecho');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
