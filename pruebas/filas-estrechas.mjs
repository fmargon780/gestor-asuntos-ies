/* Prueba en navegador de verdad de la fila 36 (docs/FILAS-QUE-NO-SE-ESTRUJAN.md):
   ninguna fila con texto y botones se aplasta, y la barra se pliega
   sola al abrir el visor.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, como
   pruebas/quedarse-en-el-asunto.mjs. Una sola navegación de principio
   a fin (el disco de mentira no sobrevive a un reload): los cambios de
   ancho de ventana o de la barra se hacen todos en vivo. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 480, height: 900 } });
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

const NOMBRE_ASUNTO = '260911 COMPRA Proveedor de Prueba SL 12345678A';
/* Sin código de registro a propósito: así sale también el botón
   "Registrar" (js/ficha-documentos.js lo pone siempre que el
   documento no lo tenga ya), y la fila llega a tener nombre + Registrar
   + el menú de tres puntos, que es cuando de verdad hacía falta el
   ancho mínimo del CSS: con solo el nombre y el menú, la fila ya
   quedaba bien por su cuenta, sin necesitarlo. */
const DOCUMENTO = '260911 SOLICITUD Un expediente con un nombre bastante largo para comprobar que la fila no se aplasta.pdf';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.evaluate(async (datos) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto, { create: true });
  carpeta._hijos.set(datos.documento, window.__disco.fich(datos.documento, '%PDF-1.4 lo que sea'));
}, { asunto: NOMBRE_ASUNTO, documento: DOCUMENTO });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');

console.log('--- 1. la fila de un documento con nombre largo envuelve, sin aplastar el nombre ---');
const medidas = await pagina.evaluate(() => {
  const fila = document.querySelector('#ficha-documentos .ficha-documento-fila');
  const boton = fila.querySelector('.ficha-documento');
  return {
    flexWrap: getComputedStyle(fila).flexWrap,
    minWidth: getComputedStyle(boton).minWidth,
    anchoNombre: boton.getBoundingClientRect().width,
    altoFila: fila.getBoundingClientRect().height
  };
});
/* Las dos reglas de css/filas.css en sí: sin ellas (flex-wrap: nowrap
   por defecto, min-width: 0 de css/registro.css), el nombre se aplasta
   estrujado en vez de bajar los botones a otra línea. */
await comprobar('1. la fila envuelve en vez de estrujar (flex-wrap)', medidas.flexWrap, 'wrap');
await comprobar('1. el nombre no baja de 240px de ancho mínimo', medidas.minWidth, '240px');
await comprobar('1. el botón del nombre mide más de 200px de ancho', medidas.anchoNombre > 200, true);
await comprobar('1. la fila no se dispara de alto (no pasa de dos líneas)', medidas.altoFila < 160, true);

console.log('--- 2. el menú de tres puntos: abre, ofrece Borrar, y borra como antes ---');
await pagina.click('#ficha-documentos .fila-menu-btn');
await pagina.waitForSelector('#ficha-documentos .fila-menu:not(.oculto)');
const opciones = await pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#ficha-documentos .fila-menu button')).map(b => b.textContent.trim()));
await comprobar('2. el menú ofrece Borrar', opciones.indexOf('Borrar') !== -1, true);

await pagina.locator('#ficha-documentos').getByRole('button', { name: 'Borrar', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('2. pulsar Borrar en el menú abre el mismo cuadro de siempre',
  pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent.indexOf('papelera') !== -1), true);
/* Se cierra sin borrar de verdad (Escape cancela: no hace falta
   repetir aquí pruebas/papelera.mjs), y el menú queda cerrado. */
await pagina.keyboard.press('Escape');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await comprobar('2. el menú se ha cerrado solo al elegir la opción',
  pagina.evaluate(() => document.querySelector('#ficha-documentos .fila-menu').classList.contains('oculto')), true);

console.log('--- 3. la barra se pliega sola al abrir el visor, y vuelve al cerrarlo ---');
await comprobar('3. la barra empieza plegada', pagina.evaluate(() => document.getElementById('aplicacion').classList.contains('barra-plegada')), true);
await pagina.click('#btn-barra');
await comprobar('3. se abre a mano', pagina.evaluate(() => document.getElementById('aplicacion').classList.contains('barra-plegada')), false);

await pagina.click('#ficha-documentos .ficha-documento');
await pagina.waitForSelector('body.con-visor');
await comprobar('3. al abrir el visor, la barra se pliega sola', pagina.evaluate(() => document.getElementById('aplicacion').classList.contains('barra-plegada')), true);

await pagina.click('#visor-cerrar');
await pagina.waitForSelector('body:not(.con-visor)');
await comprobar('3. al cerrar el visor, la barra vuelve a como estaba (abierta)', pagina.evaluate(() => document.getElementById('aplicacion').classList.contains('barra-plegada')), false);

console.log('--- 4. sin tope de ancho con la barra plegada ---');
await pagina.click('#btn-barra');
await comprobar('4. la barra vuelve a estar plegada', pagina.evaluate(() => document.getElementById('aplicacion').classList.contains('barra-plegada')), true);
await pagina.setViewportSize({ width: 1900, height: 950 });
await comprobar('4. .contenido no tiene max-width con la barra plegada',
  pagina.evaluate(() => getComputedStyle(document.querySelector('.contenido')).maxWidth), 'none');

await comprobar('sin errores de consola', errores, []);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
