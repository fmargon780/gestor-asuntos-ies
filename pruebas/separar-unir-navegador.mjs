/* Prueba en navegador de verdad de docs/SEPARAR-Y-UNIR-PDF.md (fila
   22, 17-sep-2026): la parte que necesita el navegador de verdad
   (miniaturas con pdf.js, tijeras, casillas, el cuadro de poner
   nombre). La lógica pura de partir/unir/sacar páginas con pdf-lib
   se prueba sin navegador en pruebas/separar-unir.mjs.

   Los PDF de prueba se montan con la propia pdf-lib YA CARGADA POR LA
   APLICACIÓN (PdfHerramientas.cargarPdfLib()), para no duplicar aquí
   un escritor de PDF a mano: es la misma técnica que ya usa
   pruebas/registro.mjs con un PDF mínimo, pero con varias páginas. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const textoNavegador = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const inicioMarca = 'const preparacion = `';
const finMarca = '`;\n\nconst DIRECCION';
const preparacion = textoNavegador.slice(
  textoNavegador.indexOf(inicioMarca) + inicioMarca.length, textoNavegador.indexOf(finMarca));

const DIRECCION = process.env.DIRECCION || 'http://localhost:8123/index.html';

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
  window.__tarjeta = 'documentos';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
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

/* Desde la fila 36 (docs/FILAS-QUE-NO-SE-ESTRUJAN.md, 17-sep-2026),
   Separar/Unir/Sacar páginas viven detrás del menú de tres puntos
   (U.menuDeAcciones): hay que abrirlo antes de poder pulsarlos. */
/* Desde la fila 168 (docs/DOCUMENTOS-EN-UN-SOLO-SITIO.md), en la ficha
   del asunto las herramientas de PDF están en la barra del visor: se
   abre el documento y se pulsa ahí. */
async function pulsarDeLaBarra(locatorFila, texto) {
  await locatorFila.locator('.ficha-documento').click();
  await pagina.waitForSelector('#visor-acciones .visor-barra-pdf');
  await pagina.locator('#visor-acciones .visor-barra-pdf').getByRole('button', { name: texto, exact: true }).click();
}
async function pulsarDelMenu(locatorFila, texto) {
  await locatorFila.locator('.fila-menu-btn').click();
  await locatorFila.locator('.fila-menu').getByRole('button', { name: texto, exact: true }).click();
}

/* Un PDF de `n` páginas, montado en el propio navegador con la
   pdf-lib ya vendida en el repositorio. Devuelve un array normal de
   números (se serializa bien entre Node y la página). */
async function pdfDePrueba(n) {
  return pagina.evaluate(async (n) => {
    await window.PdfHerramientas.cargarPdfLib();
    var doc = await window.PDFLib.PDFDocument.create();
    for (var i = 0; i < n; i++) {
      var p = doc.addPage([200, 200]);
      p.drawText('pagina ' + (i + 1));
    }
    return Array.from(await doc.save());
  }, n);
}

async function dejarPdfEnAsunto(nombreAsunto, nombreFichero, numeros) {
  await pagina.evaluate(async (datos) => {
    var carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto);
    carpeta._hijos.set(datos.fichero, window.__disco.fich(datos.fichero, new Uint8Array(datos.numeros), 'application/pdf'));
  }, { asunto: nombreAsunto, fichero: nombreFichero, numeros: numeros });
}

async function dejarPdfSuelto(nombreFichero, numeros) {
  await pagina.evaluate(async (datos) => {
    window.__disco.abiertos._hijos.set(datos.fichero,
      window.__disco.fich(datos.fichero, new Uint8Array(datos.numeros), 'application/pdf'));
  }, { fichero: nombreFichero, numeros: numeros });
}

async function paginasDe(dir, nombreFichero) {
  return pagina.evaluate(async (datos) => {
    var carpeta = datos.esRaiz ? window.__disco.abiertos : await window.__disco.abiertos.getDirectoryHandle(datos.dir);
    var h = await carpeta.getFileHandle(datos.fichero);
    var f = await h.getFile();
    return await window.PdfHerramientas.contarPaginas(new Uint8Array(await f.arrayBuffer()));
  }, { dir: dir, fichero: nombreFichero, esRaiz: dir === null });
}

async function nombresDe(dir) {
  return pagina.evaluate(async (d) => {
    var carpeta = d === null ? window.__disco.abiertos : await window.__disco.abiertos.getDirectoryHandle(d);
    var nombres = [];
    for await (var p of carpeta.entries()) { if (p[0][0] !== '_') nombres.push(p[0]); }
    return nombres.sort();
  }, dir);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

const NOMBRE_ASUNTO = '260917 SOLICITUD 26-27 Prueba de PDF 12345678A';
await pagina.evaluate(async (datos) => {
  var carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto, { create: true });
}, { asunto: NOMBRE_ASUNTO });

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const PDF_6 = await pdfDePrueba(6);
const ESCANEO = '260917 SOLICITUD Escaneo.pdf';
await dejarPdfEnAsunto(NOMBRE_ASUNTO, ESCANEO, PDF_6);

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');

console.log('--- los tres botones salen para un PDF ---');
function filaDe(nombre) {
  return pagina.locator('.ficha-documento-fila').filter({ hasText: nombre });
}
await comprobar('Separar, Unir y Sacar páginas ya no están en la fila del documento (fila 168)',
  filaDe(ESCANEO).locator('button').allTextContents().then(ts => ts.filter(t =>
    ['Separar', 'Unir', 'Sacar páginas'].includes(t.trim()))),
  []);
await filaDe(ESCANEO).locator('.ficha-documento').click();
await pagina.waitForSelector('#visor-acciones .visor-barra-pdf');
await comprobar('salen en la barra del visor al abrir el PDF',
  pagina.locator('#visor-acciones .visor-barra-pdf button').allTextContents().then(ts => ts.filter(t =>
    ['Separar', 'Unir', 'Sacar páginas'].includes(t.trim()))),
  ['Separar', 'Unir', 'Sacar páginas']);

console.log('--- Separar: dos cortes dan tres trozos, con nombre y a la papelera ---');
await pulsarDeLaBarra(filaDe(ESCANEO), 'Separar');
await pagina.waitForSelector('.pdf-rejilla .pdf-pagina');
await comprobar('salen las 6 miniaturas', pagina.locator('.pdf-rejilla .pdf-pagina').count(), 6);
await comprobar('sin cortes, el resumen pide marcar una tijera',
  pagina.locator('#pdf-resumen').textContent(),
  'Marca una tijera entre dos páginas para partir el documento.');

await pagina.click('.pdf-tijera[data-despues-de="2"]');
await pagina.click('.pdf-tijera[data-despues-de="5"]');
await comprobar('el resumen dice los tres trozos',
  pagina.locator('#pdf-resumen').textContent(),
  'Van a salir 3 documentos: páginas 1-2, 3-5 y 6.');

await pagina.click('#cuadro-aceptar');   /* "Separar" */
await pagina.waitForSelector('#cuadro-titulo:has-text("Nombrar el trozo 1 de 3")');
await pagina.fill('#pdf-nombre-curso', 'Escaneo trozo 1');
await pagina.click('#cuadro-aceptar');   /* "Guardar y seguir" */

await pagina.waitForSelector('#cuadro-titulo:has-text("Nombrar el trozo 2 de 3")');
await pagina.fill('#pdf-nombre-curso', 'Escaneo trozo 2');
await pagina.click('#cuadro-aceptar');

await pagina.waitForSelector('#cuadro-titulo:has-text("Nombrar el trozo 3 de 3")');
await pagina.fill('#pdf-nombre-curso', 'Escaneo trozo 3');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

const NOMBRES_TRAS_SEPARAR = await nombresDe(NOMBRE_ASUNTO);
comprobar('el original ya no está, y hay tres trozos nuevos',
  Promise.resolve(NOMBRES_TRAS_SEPARAR.indexOf(ESCANEO) === -1 &&
    NOMBRES_TRAS_SEPARAR.some(n => n.indexOf('Escaneo trozo 1') !== -1) &&
    NOMBRES_TRAS_SEPARAR.some(n => n.indexOf('Escaneo trozo 2') !== -1) &&
    NOMBRES_TRAS_SEPARAR.some(n => n.indexOf('Escaneo trozo 3') !== -1)),
  true);

const TROZO_1 = NOMBRES_TRAS_SEPARAR.find(n => n.indexOf('Escaneo trozo 1') !== -1);
const TROZO_2 = NOMBRES_TRAS_SEPARAR.find(n => n.indexOf('Escaneo trozo 2') !== -1);
const TROZO_3 = NOMBRES_TRAS_SEPARAR.find(n => n.indexOf('Escaneo trozo 3') !== -1);
await comprobar('el trozo 1 tiene 2 páginas', paginasDe(NOMBRE_ASUNTO, TROZO_1), 2);
await comprobar('el trozo 2 tiene 3 páginas', paginasDe(NOMBRE_ASUNTO, TROZO_2), 3);
await comprobar('el trozo 3 tiene 1 página', paginasDe(NOMBRE_ASUNTO, TROZO_3), 1);

await comprobar('el original ha quedado apuntado en la papelera', pagina.evaluate(async (asunto) => {
  var g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  var h = await g.getFileHandle('papelera.json');
  var j = JSON.parse(await (await h.getFile()).text());
  return (j.fichas || []).some(x => x.clase === 'documento' && x.nombre === '260917 SOLICITUD Escaneo.pdf' &&
    x.origen && x.origen.asunto === asunto);
}, NOMBRE_ASUNTO), true);

console.log('--- Sacar páginas: el original no se toca ---');
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#lista-abiertos .nombre-pulsable');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');

await pulsarDeLaBarra(filaDe(TROZO_2), 'Sacar páginas');
await pagina.waitForSelector('.pdf-rejilla .pdf-pagina');
await pagina.check('.pdf-rejilla .pdf-pagina:nth-child(1) input[type="checkbox"]');
await pagina.click('#cuadro-aceptar');   /* "Sacar páginas" */
await pagina.waitForSelector('#cuadro-titulo:has-text("Nombrar el documento con las páginas sacadas")');
await pagina.fill('#pdf-nombre-curso', 'Pagina suelta');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

const NOMBRES_TRAS_SACAR = await nombresDe(NOMBRE_ASUNTO);
await comprobar('el original de "sacar páginas" sigue en la carpeta', Promise.resolve(
  NOMBRES_TRAS_SACAR.indexOf(TROZO_2) !== -1), true);
const SACADO = NOMBRES_TRAS_SACAR.find(n => n.indexOf('Pagina suelta') !== -1);
await comprobar('la copia sacada tiene 1 página', paginasDe(NOMBRE_ASUNTO, SACADO), 1);

console.log('--- Unir, en Por clasificar ---');
const PDF_A = await pdfDePrueba(2);
const PDF_B = await pdfDePrueba(3);
await dejarPdfSuelto('primero.pdf', PDF_A);
await dejarPdfSuelto('segundo.pdf', PDF_B);

await pagina.click('#ficha-volver');
await pagina.waitForSelector('#lista-abiertos .nombre-pulsable');
await pagina.click('#btn-recargar');
await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');

function tarjetaSueltaDe(nombre) {
  return pagina.locator('#lista-sueltos .tarjeta-suelto').filter({ hasText: nombre });
}
await pulsarDelMenu(tarjetaSueltaDe('primero.pdf'), 'Unir');
await pagina.waitForSelector('#unir-lista .unir-fila');
await comprobar('se ofrece el otro PDF suelto, con su cuenta de páginas',
  pagina.locator('#unir-lista .unir-fila').filter({ hasText: 'segundo.pdf' })
    .locator('.suave').textContent().then(t => t.trim()),
  '· 3 páginas');

await pagina.locator('#unir-lista .unir-fila').filter({ hasText: 'segundo.pdf' })
  .locator('.unir-marca').check();
await pagina.click('#cuadro-aceptar');   /* "Unir" */
await pagina.waitForTimeout(400);

const NOMBRES_SUELTOS = await nombresDe(null);
await comprobar('los dos originales sueltos ya no están, y hay un unido',
  Promise.resolve(NOMBRES_SUELTOS.indexOf('primero.pdf') === -1 &&
    NOMBRES_SUELTOS.indexOf('segundo.pdf') === -1 &&
    NOMBRES_SUELTOS.indexOf('primero (unido).pdf') !== -1), true);
await comprobar('el unido tiene 5 páginas (2 + 3)', paginasDe(null, 'primero (unido).pdf'), 5);

console.log('--- si el nombre de salida ya existe, no se toca nada ---');
const PDF_D = await pdfDePrueba(2);
await dejarPdfSuelto('choque.pdf', PDF_D);
await dejarPdfSuelto('choque (unido).pdf', await pdfDePrueba(1));   /* ya ocupa el nombre que le tocaría */
const PDF_E = await pdfDePrueba(1);
await dejarPdfSuelto('otro-mas.pdf', PDF_E);

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');
await pulsarDelMenu(tarjetaSueltaDe('choque.pdf'), 'Unir');
await pagina.waitForSelector('#unir-lista .unir-fila');
await pagina.locator('#unir-lista .unir-fila').filter({ hasText: 'otro-mas.pdf' })
  .locator('.unir-marca').check();
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
await comprobar('avisa de la colisión, sin escribir nada nuevo',
  pagina.locator('.mensaje.malo').last().textContent()
    .then(t => t.indexOf('ya hay un fichero llamado') !== -1 || t.toLowerCase().indexOf('ya hay un fichero llamado') !== -1),
  true);
const NOMBRES_TRAS_CHOQUE = await nombresDe(null);
await comprobar('choque.pdf sigue existiendo (no se ha movido a la papelera)',
  Promise.resolve(NOMBRES_TRAS_CHOQUE.indexOf('choque.pdf') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
