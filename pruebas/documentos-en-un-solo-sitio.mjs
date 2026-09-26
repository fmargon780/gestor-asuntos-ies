/* Prueba en navegador de docs/DOCUMENTOS-EN-UN-SOLO-SITIO.md (fila 168):
   las opciones de cada documento de la ficha, en su propia fila.

   - Una fila sin registro enseña ⧉, «Registrar», «Poner nombre»,
     «Asociar a un hito» (si hay hitos) y ⋮ con solo dos entradas.
   - ⧉ copia el nombre sin la extensión.
   - «Poner nombre» renombra el fichero y repinta la lista.
   - «+ Añadir documento» está en el título y abre el cuadro de añadir.
   - No queda «Documentos ▾» en la ficha.
   - Un PDF abierto en el visor trae la barra de herramientas; un no-PDF, no. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const textoNavegador = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const inicioMarca = 'const preparacion = `';
const finMarca = '`;\n\nconst DIRECCION';
const preparacion = textoNavegador.slice(
  textoNavegador.indexOf(inicioMarca) + inicioMarca.length, textoNavegador.indexOf(finMarca));

const DIRECCION = process.env.DIRECCION || 'http://localhost:8123/index.html';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({
  viewport: { width: 1600, height: 950 },
  permissions: ['clipboard-read', 'clipboard-write']
});
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.addInitScript(() => {
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      FichaTarjetas.abrirAlEntrar('documentos');
      return alEntrar();
    };
  });
});
await pagina.goto(DIRECCION);

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

const NOMBRE_ASUNTO = '260917 SOLICITUD 26-27 Prueba de documentos 12345678A';
const PDF = 'escaneo suelto.pdf';
const FOTO = '260917 SOLICITUD Foto.png';
await pagina.evaluate(async (datos) => {
  await window.PdfHerramientas.cargarPdfLib();
  var doc = await window.PDFLib.PDFDocument.create();
  doc.addPage([200, 200]);
  var bytes = await doc.save();
  var carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto, { create: true });
  carpeta._hijos.set(datos.pdf, window.__disco.fich(datos.pdf, bytes, 'application/pdf'));
  carpeta._hijos.set(datos.foto, window.__disco.fich(datos.foto, 'no es una foto', 'image/png'));
}, { asunto: NOMBRE_ASUNTO, pdf: PDF, foto: FOTO });

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');

function filaDe(nombre) {
  return pagina.locator('#ficha-documentos .ficha-documento-fila').filter({ hasText: nombre });
}

console.log('--- la fila de un documento sin registro ---');
await comprobar('lleva ⧉ justo detrás del nombre',
  filaDe(PDF).evaluate(f => {
    var b = f.querySelector('.ficha-documento');
    return !!(b && b.nextElementSibling && b.nextElementSibling.classList.contains('ficha-documento-copiar'));
  }), true);
await comprobar('lleva «Registrar» y «Poner nombre» a la vista',
  filaDe(PDF).locator(':scope > button').allTextContents().then(ts => ts.map(t => t.trim())
    .filter(t => t === 'Registrar' || t === 'Poner nombre')), ['Registrar', 'Poner nombre']);
await filaDe(PDF).locator('.fila-menu-btn').click();
await comprobar('el menú ⋮ trae solo «Pasar a versiones previas» y «Borrar»',
  filaDe(PDF).locator('.fila-menu button').allTextContents().then(ts => ts.map(t => t.trim())),
  ['Pasar a versiones previas', 'Borrar']);
await filaDe(PDF).locator('.fila-menu-btn').click();

console.log('--- el título del bloque ---');
await comprobar('no queda «Documentos ▾» en la ficha',
  pagina.locator('#pantalla-asunto').getByRole('button', { name: 'Documentos ▾' }).count(), 0);
await comprobar('«+ Añadir documento» está en el título, una sola vez',
  pagina.locator('.ficha-titulo .ficha-documentos-anadir').count(), 1);

console.log('--- ⧉ copia el nombre sin la extensión ---');
await filaDe(PDF).locator('.ficha-documento-copiar').click();
await pagina.waitForTimeout(150);
await comprobar('en el portapapeles, el nombre sin «.pdf»',
  pagina.evaluate(() => navigator.clipboard.readText()), 'escaneo suelto');

console.log('--- el visor: barra de PDF solo para un PDF ---');
await filaDe(PDF).locator('.ficha-documento').click();
await pagina.waitForSelector('#visor-lateral:not(.oculto)');
await comprobar('un PDF trae la barra con sus herramientas',
  pagina.locator('#visor-acciones:not(.oculto) .visor-barra-pdf button').allTextContents()
    .then(ts => ts.map(t => t.trim()).filter(t => ['Separar', 'Unir', 'Sacar páginas', 'Ajustar tamaño'].includes(t))),
  ['Separar', 'Unir', 'Sacar páginas', 'Ajustar tamaño']);
await filaDe(FOTO).locator('.ficha-documento').click();
await pagina.waitForTimeout(300);
await comprobar('una imagen, no',
  pagina.locator('#visor-acciones .visor-barra-pdf').count(), 0);
await pagina.click('#visor-cerrar');

console.log('--- «Poner nombre» renombra y repinta ---');
await filaDe(PDF).getByRole('button', { name: 'Poner nombre', exact: true }).click();
await pagina.waitForSelector('#doc-vista');
await pagina.fill('#doc-fecha', '2026-09-11');
await pagina.selectOption('#doc-tipo', 'SOLICITUD');
await pagina.fill('#doc-curso', 'Renombrado');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(400);
if (await pagina.locator('#capa:not(.oculto)').count()) {
  await pagina.click('#cuadro-aceptar');
}
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForTimeout(400);
await comprobar('la lista trae el nombre nuevo',
  pagina.locator('#ficha-documentos .ficha-documento').allTextContents()
    .then(ts => ts.some(t => t.indexOf('260911 SOLICITUD Renombrado.pdf') !== -1)), true);
await comprobar('y ya no el viejo',
  pagina.locator('#ficha-documentos .ficha-documento').allTextContents()
    .then(ts => ts.some(t => t.indexOf(PDF) !== -1)), false);

console.log('--- «+ Añadir documento» abre el cuadro de añadir ---');
await pagina.click('.ficha-documentos-anadir');
await pagina.waitForSelector('#doc-vista');
await comprobar('el cuadro es el del asunto',
  pagina.locator('#cuadro-titulo').textContent(), NOMBRE_ASUNTO);
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
