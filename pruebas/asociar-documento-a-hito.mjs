/* Prueba en navegador de verdad de "Asociar a un hito" desde la lista
   de documentos (18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md,
   6): hasta ahora solo se podía desde el hito, con "Apuntar un
   documento" (fila 31, docs/APUNTAR-DOCUMENTO-A-HITO.md); Francisco no
   lo encontraba.

   Lo que tiene que pasar:
     - cada documento de la ficha lleva un botón "Asociar a un hito",
       con el menú pequeño de js/ficha-menus.js (los hitos del asunto,
       y "Ninguno" para soltarlo);
     - elegir un hito lo deja apuntado ahí, con el MISMO dato que ya
       guarda "Apuntar un documento" (js/hitos.js, `h.documentos`): se
       ve tanto en el propio documento (el nombre del hito, en
       pequeño, debajo del suyo) como en el panel de hitos, debajo del
       hito elegido;
     - cambiar de hito lo mueve (se quita del primero, se pone en el
       segundo);
     - "Ninguno" lo suelta del todo.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
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
/* Fila 107 (docs/FICHA-EN-TARJETAS.md): la ficha va en tarjetas. Esta
   prueba trabaja dentro de una: se entra con ella ya abierta en grande
   (`window.__tarjeta`; se cambia con FichaTarjetas.abrir). */
await pagina.addInitScript(() => {
  window.__tarjeta = 'hitos';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
      return alEntrar();
    };
  });
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

const NOMBRE_ASUNTO = '260918 COMPRA Proveedor de Prueba SL 12345678A';
const DOC_A = '260918 SOLICITUD Presupuesto.pdf';
const DOC_B = '260918 FACTURA Referencia.pdf';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

await pagina.evaluate(async ({ asunto, docA, docB }) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
  carpeta._hijos.set(docA, window.__disco.fich(docA, 'el presupuesto'));
  carpeta._hijos.set(docB, window.__disco.fich(docB, 'la factura'));
  await window.Hitos.anadirHito(asunto, 'Pedir presupuesto');
  await window.Hitos.anadirHito(asunto, 'Comprobar la factura');
}, { asunto: NOMBRE_ASUNTO, docA: DOC_A, docB: DOC_B });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForSelector('#ficha-guia .hito');
await pagina.evaluate(() => FichaTarjetas.abrir('documentos'));
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');

function filaDe(nombreDoc) {
  return pagina.locator('.ficha-documento-fila', { has: pagina.locator('.ficha-documento', { hasText: nombreDoc }) });
}

console.log('--- 1. el botón sale en los dos documentos, sin ningún hito todavía ---');
await comprobar('1. "Asociar a un hito" sale en los dos documentos',
  pagina.locator('.ficha-documento-asociar').count(), 2);
await comprobar('1. de partida, ningún documento enseña un hito debajo de su nombre',
  pagina.locator('.ficha-documento-hito').count(), 0);

console.log('--- 2. asociar el documento A al primer hito ---');
await filaDe(DOC_A).locator('.ficha-documento-asociar').click();
await pagina.waitForTimeout(100);
await comprobar('2. el menú ofrece "Ninguno" y los dos hitos, en orden',
  pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').allTextContents(),
  ['✓ Ninguno', 'Pedir presupuesto', 'Comprobar la factura']);
await pagina.getByRole('button', { name: 'Pedir presupuesto', exact: true }).click();
await pagina.waitForFunction(() => {
  const hito = document.querySelector('#ficha-guia .hito');
  return document.querySelector('.ficha-documento-hito') && hito && hito.querySelector('.hito-documento');
});

await comprobar('2. el documento A enseña el hito debajo de su nombre',
  filaDe(DOC_A).locator('.ficha-documento-hito').textContent(), 'Pedir presupuesto');
await comprobar('2. el documento B sigue sin ninguno',
  filaDe(DOC_B).locator('.ficha-documento-hito').count(), 0);
await comprobar('2. el hito "Pedir presupuesto" enseña el documento debajo',
  pagina.locator('#ficha-guia .hito', { hasText: 'Pedir presupuesto' }).locator('.hito-documento').textContent()
    .then((t) => t.trim().indexOf(DOC_A) !== -1), true);

console.log('--- 3. cambiar de hito: se quita del primero, se pone en el segundo ---');
await filaDe(DOC_A).locator('.ficha-documento-asociar').click();
await pagina.waitForTimeout(100);
await comprobar('3. el menú ahora marca el hito elegido',
  pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').allTextContents(),
  ['Ninguno', '✓ Pedir presupuesto', 'Comprobar la factura']);
await pagina.getByRole('button', { name: 'Comprobar la factura', exact: true }).click();
/* El documento se actualiza al momento (lo repinta el propio
   pintar()), pero el panel de hitos vigila por su cuenta y repinta
   con 30 ms de retardo (js/hitos-panel.js, programarRepintado): hay
   que esperar a que las dos cosas hayan terminado de verdad, no solo
   la primera. */
await pagina.waitForFunction((doc) => {
  const fila = Array.from(document.querySelectorAll('.ficha-documento-fila'))
    .find((f) => f.textContent.indexOf(doc) !== -1);
  const et = fila && fila.querySelector('.ficha-documento-hito');
  if (!et || et.textContent.trim() !== 'Comprobar la factura') return false;
  const hitos = Array.from(document.querySelectorAll('#ficha-guia .hito'));
  const antes = hitos.find((h) => h.textContent.indexOf('Pedir presupuesto') !== -1);
  const ahora = hitos.find((h) => h.textContent.indexOf('Comprobar la factura') !== -1);
  return !!antes && !antes.querySelector('.hito-documento') &&
         !!ahora && ahora.querySelector('.hito-documento') &&
         ahora.querySelector('.hito-documento').textContent.indexOf(doc) !== -1;
}, DOC_A);

await comprobarQue('3. "Pedir presupuesto" ya no lo enseña',
  await pagina.locator('#ficha-guia .hito', { hasText: 'Pedir presupuesto' }).locator('.hito-documento').count() === 0);
await comprobar('3. "Comprobar la factura" lo enseña ahora',
  pagina.locator('#ficha-guia .hito', { hasText: 'Comprobar la factura' }).locator('.hito-documento').textContent()
    .then((t) => t.trim().indexOf(DOC_A) !== -1), true);

console.log('--- 4. "Ninguno" lo suelta del todo ---');
await filaDe(DOC_A).locator('.ficha-documento-asociar').click();
await pagina.waitForTimeout(100);
await pagina.getByRole('button', { name: 'Ninguno', exact: true }).click();
await pagina.waitForFunction((doc) => {
  const fila = Array.from(document.querySelectorAll('.ficha-documento-fila'))
    .find((f) => f.textContent.indexOf(doc) !== -1);
  if (!fila || fila.querySelector('.ficha-documento-hito')) return false;
  return !document.querySelector('#ficha-guia .hito .hito-documento');
}, DOC_A);
await comprobar('4. ningún hito enseña ya el documento',
  pagina.locator('#ficha-guia .hito .hito-documento').count(), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
