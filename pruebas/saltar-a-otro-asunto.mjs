/* Prueba en navegador de verdad de la fila 40 (docs/SALTAR-A-OTRO-ASUNTO.md):
   el bloque "Otros asuntos de este tercero" se pulsa y abre la ficha
   de ese asunto (abierto, o del ARCHIVO montado a mano), y en la
   ficha a la que se salta sale "← Volver a [asunto de partida]", que
   sigue apuntando al mismo asunto aunque se salte varias veces.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, con el
   mismo montaje que pruebas/quedarse-en-el-asunto.mjs. */
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
  window.__tarjeta = 'otros';
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

const TERCERO = 'Proveedor de Prueba SL 12345678A';
const OTRO_TERCERO = 'Otro Proveedor SL 22222222Z';
const A = '260901 COMPRA ' + TERCERO;   /* abierto, el asunto de partida */
const B = '260902 COMPRA ' + TERCERO;   /* abierto, el primer salto */
const C = '260903 COMPRA ' + TERCERO;   /* archivado, el segundo salto */
const D = '260904 COMPRA ' + OTRO_TERCERO;   /* abierto, de otro tercero: para el escenario 5 */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

/* A, B y D quedan como carpetas abiertas; C se coloca directamente en
   el ARCHIVO de mentira (EMPRESAS / tercero / carpeta del asunto),
   sin pasar nunca por App.verArchivo: es justo lo que comprueba el
   escenario 6. De paso, un contador espía cuenta cuántas veces se
   llama a App.verArchivo durante toda la prueba. */
await pagina.evaluate(async (datos) => {
  await window.__disco.abiertos.getDirectoryHandle(datos.a, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(datos.b, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(datos.d, { create: true });

  const cat = await window.__disco.archivo.getDirectoryHandle('EMPRESAS', { create: true });
  const ter = await cat.getDirectoryHandle(datos.tercero, { create: true });
  await ter.getDirectoryHandle(datos.c, { create: true });

  window.__verArchivoLlamadas = 0;
  const original = window.App.verArchivo;
  window.App.verArchivo = function () {
    window.__verArchivoLlamadas++;
    return original.apply(this, arguments);
  };
}, { a: A, b: B, c: C, d: D, tercero: TERCERO });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');

async function abrirDesdeLaLista(nombre) {
  await pagina.locator('#lista-abiertos .nombre-pulsable', { hasText: nombre }).click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
}

async function fichaAbierta() {
  return pagina.evaluate(() => window.App.fichaAbierta());
}

function otrosBoton(nombre) {
  return pagina.locator('#ficha-otros .otros-asunto', { hasText: nombre });
}

function botonVuelta() {
  return pagina.locator('#ficha-volver-al-origen');
}

/* "Otros asuntos de este tercero" es una tarjeta (fila 107): hay que
   abrirla en grande antes de poder pulsar nada de dentro. */
async function abrirOtrosAsuntos() {
  await pagina.evaluate(() => FichaTarjetas.abrir('otros'));
  await pagina.waitForTimeout(100);
}

console.log('--- 1. el bloque pinta las líneas como pulsables ---');
await abrirDesdeLaLista(A);
await abrirOtrosAsuntos();
await pagina.waitForSelector('#ficha-otros .otros-asunto');
await comprobar('1. hay líneas pulsables (elementos <button>) en el bloque',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-otros .otros-asunto'))
    .every((b) => b.tagName === 'BUTTON' && !b.disabled)), true);
await comprobar('1. se ven pulsables (cursor de mano)',
  pagina.evaluate(() => getComputedStyle(document.querySelector('#ficha-otros .otros-asunto')).cursor), 'pointer');
await comprobar('1. salen los dos grupos, abierto y archivado',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-otros .otros-rotulo')).map((r) => r.textContent)),
  ['Abiertos', 'En el archivo']);
await comprobar('1. sin botón de vuelta todavía (es el asunto de partida)', botonVuelta().count(), 0);

console.log('--- 2. pulsar un asunto abierto abre su ficha ---');
await otrosBoton(B).click();
await pagina.waitForSelector('#ficha-volver-al-origen');
await comprobar('2. se ha abierto la ficha de B', fichaAbierta(), B);

console.log('--- 3. el botón de vuelta, con el nombre de partida, y que devuelve a él ---');
await comprobar('3. el botón dice "Volver a" el asunto de partida (A)',
  botonVuelta().textContent(), '← Volver a ' + A);
await botonVuelta().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('3. un solo clic devuelve al asunto de partida', fichaAbierta(), A);
await comprobar('3. en A ya no sale el botón de vuelta (se ha olvidado el origen)', botonVuelta().count(), 0);

console.log('--- 4. saltando A → B → C, en C el botón sigue diciendo "Volver a A" ---');
await otrosBoton(B).click();
await pagina.waitForSelector('#ficha-volver-al-origen');
await comprobar('4. (de paso) en B, tras el segundo salto, sigue diciendo A', botonVuelta().textContent(), '← Volver a ' + A);
await abrirOtrosAsuntos();
await otrosBoton(C).click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('4. se ha saltado a C', fichaAbierta(), C);
await comprobar('4. en C el botón sigue diciendo "Volver a A", no "Volver a B"',
  botonVuelta().textContent(), '← Volver a ' + A);

console.log('--- 6. un asunto del ARCHIVO se abre en modo solo lectura, sin llamar a App.verArchivo ---');
await comprobar('6. C se abre en modo solo lectura (sin el desplegable de estado)',
  pagina.locator('#ficha-acciones .campo-estado').count(), 0);
await comprobar('6. App.verArchivo no se ha llamado en ningún momento',
  pagina.evaluate(() => window.__verArchivoLlamadas), 0);

console.log('--- 5. al salir por "Volver a la lista" y entrar en otro asunto desde la lista, el botón ya no está ---');
await pagina.click('#ficha-volver');
/* Fila 119: vuelve a la pantalla de la que se vino (la lista de abiertos, de donde se abrió A). */
await pagina.waitForSelector('#pantalla-asunto.oculto', { state: 'attached' });
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await abrirDesdeLaLista(D);
await comprobar('5. se ha abierto la ficha de D', fichaAbierta(), D);
await comprobar('5. en D no sale ningún botón de vuelta', botonVuelta().count(), 0);
await comprobar('6. (de paso) tampoco al final se ha llamado nunca a App.verArchivo',
  pagina.evaluate(() => window.__verArchivoLlamadas), 0);

await comprobar('sin errores de consola', errores, []);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
