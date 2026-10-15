/* Prueba de la fila 349 (15-oct-2026, docs/PDF-COMPRIMIR-Y-PASAR-A-A4.md), con navegador de verdad:
   - Un PDF con hojas A2 que entra: el cuadro de ponerle nombre trae marcada «Pasarlas a A4»; al guardar, A4.
   - Desmarcada, se guarda con sus hojas; con A3 en el desplegable, A3.
   - Un A4 normal: sin casilla y mismos bytes.
   - Un A2 con firma electrónica: sin casilla, dos líneas ámbar de «lleva firma», mismos bytes.
   - Un PDF de más de 5 MB (escaneo de imágenes): se guarda en 5 MB o menos, con el aviso «Comprimido de … a …».
   - «Ajustar tamaño» del visor: «Pasar las hojas a A4» sobre un PDF ya guardado; apagada con uno firmado. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.addInitScript(() => { window.__avisos = []; document.addEventListener('DOMContentLoaded', () => { new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList && n.classList.contains('mensaje')) window.__avisos.push(n.className + '|' + n.textContent); }))).observe(document.getElementById('mensajes'), { childList: true }); }); });
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
const T0 = Date.now();
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo + '  [' + Math.round((Date.now() - T0) / 1000) + ' s]');
}
function comprobarCierto(titulo, cond, detalle) {
  if (!cond) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); } else console.log('bien   ' + titulo);
}
async function esperar(fn, arg, veces) {
  for (let i = 0; i < (veces || 150); i++) { if (await pagina.evaluate(fn, arg)) return true; await pagina.waitForTimeout(100); }
  return false;
}

const ASUNTO = '260915 PRUEBA PDF Colegio San José';
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Los PDF de prueba, dentro de la carpeta del asunto. */
await pagina.evaluate(async (asunto) => {
  await App.crearTipo({ nombre: 'PRUEBA PDF', categoria: 'OTROS' });
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  async function escribir(nombre, bytes) {
    const h = await c.getFileHandle(nombre, { create: true });
    const w = await h.createWritable(); await w.write(new Blob([bytes])); await w.close();
  }
  async function texto(nombre, hojas, extra) {
    const d = await PDFLib.PDFDocument.create();
    const f = await d.embedFont(PDFLib.StandardFonts.Helvetica);
    hojas.forEach(([w, h]) => { const p = d.addPage([w, h]); p.drawText('Documento ' + nombre, { x: 30, y: 60, size: 30, font: f }); });
    let bytes = await d.save();
    if (extra) { const m = new TextEncoder().encode(extra); const n = new Uint8Array(bytes.length + m.length); n.set(bytes); n.set(m, bytes.length); bytes = n; }
    await escribir(nombre, bytes);
  }
  await texto('GRANDE UNO.pdf', [[1190.6, 1683.8], [1683.8, 1190.6]]);
  await texto('GRANDE DOS.pdf', [[1190.6, 1683.8]]);
  await texto('GRANDE TRES.pdf', [[1190.6, 1683.8]]);
  await texto('GRANDE CUATRO.pdf', [[1190.6, 1683.8]]);
  await texto('NORMAL UNO.pdf', [[595.3, 841.9]]);
  await texto('FIRMADO UNO.pdf', [[1190.6, 1683.8]], '\n% /ByteRange [0 10 20 30]\n');
  await texto('FIRMADO DOS.pdf', [[1190.6, 1683.8]], '\n% /ByteRange [0 10 20 30]\n');
  /* Un escaneo pesado: tres hojas A4 con una imagen de ruido cada una (más de 5 MB). */
  const d = await PDFLib.PDFDocument.create();
  for (let i = 0; i < 3; i++) {
    const lienzo = document.createElement('canvas'); lienzo.width = 2000; lienzo.height = 2800;
    const g = lienzo.getContext('2d'); const im = g.createImageData(2000, 2800);
    for (let k = 0; k < im.data.length; k += 4) { const v = (Math.random() * 255) | 0; im.data[k] = v; im.data[k + 1] = (v * 7) & 255; im.data[k + 2] = (v * 13) & 255; im.data[k + 3] = 255; }
    g.putImageData(im, 0, 0);
    const blob = await new Promise(r => lienzo.toBlob(r, 'image/jpeg', 0.95));
    const jpg = await d.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    const p = d.addPage([595.3, 841.9]); p.drawImage(jpg, { x: 0, y: 0, width: 595.3, height: 841.9 });
  }
  await escribir('ESCANEO PESADO.pdf', await d.save());
  /* El visor de PDF del navegador tarda minutos en pintar un escaneo de ruido y aquí no se prueba: se cambia por un texto. */
  Documentos._interno.visorDe = function () { return '<p class="explica">visor</p>'; };
  await App.anotar(asunto, { estado: 'abierto', tipo: 'PRUEBA PDF', categoria: 'OTROS', tercero: 'Colegio San José' });
  await App.verAbiertos();
}, ASUNTO);

const tamanosDe = (nombre) => pagina.evaluate(async ([asunto, nombre]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
  const f = await (await c.getFileHandle(nombre)).getFile();
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  const d = await PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()));
  return { paginas: d.getPages().map(p => { const s = p.getSize(); return [Math.round(s.width), Math.round(s.height)]; }), peso: f.size };
}, [ASUNTO, nombre]);
const ficheros = () => pagina.evaluate(async (asunto) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
  const n = []; for await (const [nombre] of c.entries()) n.push(nombre); return n.sort();
}, ASUNTO);

async function abrirCuadro(nombre) {
  await pagina.evaluate(async ([asunto, nombre]) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === asunto)[0];
    App.verDocumentos(a, { ponerNombre: nombre });
  }, [ASUNTO, nombre]);
  await pagina.waitForSelector('#doc-guardar');
  await pagina.waitForTimeout(600);   /* el análisis del PDF corre aparte */
}
const textoAvisos = () => pagina.evaluate(() => window.__avisos.slice());
/* Guarda con un nombre fijo y devuelve el nombre nuevo (el único fichero que no estaba). */
async function guardarComo(nombreViejo, texto) {
  const antes = await ficheros();
  await pagina.fill('#doc-curso', texto);
  await pagina.dispatchEvent('#doc-curso', 'input');
  try { await pagina.click('#doc-guardar', { timeout: 8000 }); }
  catch (e) { console.log('   (no se pudo pulsar Guardar) ' + await pagina.evaluate(() => JSON.stringify({ dis: document.getElementById('doc-guardar').disabled, txt: document.getElementById('doc-guardar').textContent, vista: (document.getElementById('doc-vista') || {}).textContent })) ); throw e; }
  await esperar(() => document.getElementById('capa').classList.contains('oculto'), null, 600);
  const despues = await ficheros();
  return despues.filter(n => antes.indexOf(n) === -1)[0];
}
const A4 = [595, 842];

console.log('--- hojas grandes ---');
await abrirCuadro('GRANDE UNO.pdf');
comprobar('1. el cuadro trae la casilla marcada', await pagina.evaluate(() => { const c = document.getElementById('doc-pdf-a4'); return !!c && c.checked; }), true);
comprobar('1. con A4 elegido', await pagina.evaluate(() => document.getElementById('doc-pdf-tamano').value), 'A4');
comprobar('1. y el texto dice que son más grandes que un A4', (await pagina.locator('#doc-pdf-ajuste').textContent()).indexOf('Las hojas son más grandes que un A4. Pasarlas a') !== -1, true);
let nuevo = await guardarComo('GRANDE UNO.pdf', 'UNO');
comprobarCierto('2. se guarda con otro nombre', !!nuevo, JSON.stringify(await ficheros()));
const uno = await tamanosDe(nuevo);
comprobar('2. las dos hojas (vertical y apaisada) quedan en A4 vertical y A4 apaisado', uno.paginas, [A4, [842, 595]]);
comprobarCierto('2. sale el aviso «Hojas pasadas a A4»', (await textoAvisos()).some(t => /bueno\|Hojas pasadas a A4\./.test(t)), JSON.stringify(await textoAvisos()));

console.log('--- casilla desmarcada y otro tamaño ---');
await abrirCuadro('GRANDE DOS.pdf');
await pagina.uncheck('#doc-pdf-a4');
nuevo = await guardarComo('GRANDE DOS.pdf', 'DOS');
comprobar('3. desmarcada, la hoja se queda como era', (await tamanosDe(nuevo)).paginas, [[1191, 1684]]);
await abrirCuadro('GRANDE TRES.pdf');
await pagina.selectOption('#doc-pdf-tamano', 'A3');
nuevo = await guardarComo('GRANDE TRES.pdf', 'TRES');
comprobar('4. con A3 elegido, la hoja queda en A3', (await tamanosDe(nuevo)).paginas, [[842, 1191]]);

console.log('--- un A4 normal ---');
const pesoNormal = (await tamanosDe('NORMAL UNO.pdf')).peso;
await abrirCuadro('NORMAL UNO.pdf');
comprobar('5. no sale casilla ni líneas ámbar', await pagina.evaluate(() => document.getElementById('doc-pdf-ajuste').children.length), 0);
nuevo = await guardarComo('NORMAL UNO.pdf', 'NORMAL');
comprobar('5. se guarda con los mismos bytes (mismo peso)', (await tamanosDe(nuevo)).peso, pesoNormal);

console.log('--- con firma electrónica ---');
const pesoFirmado = (await tamanosDe('FIRMADO UNO.pdf')).peso;
await abrirCuadro('FIRMADO UNO.pdf');
comprobar('6. sin casilla', await pagina.evaluate(() => !!document.getElementById('doc-pdf-a4')), false);
comprobar('6. la línea ámbar de las hojas', (await pagina.locator('#doc-pdf-firma-hojas').textContent()), 'Las hojas son más grandes que un A4, pero lleva firma electrónica y no se pueden cambiar.');
nuevo = await guardarComo('FIRMADO UNO.pdf', 'FIRMADO');
const firmado = await tamanosDe(nuevo);
comprobar('6. ni un byte cambia ni las hojas', [firmado.peso, firmado.paginas], [pesoFirmado, [[1191, 1684]]]);

console.log('--- más de 5 MB ---');
const pesoPesado = (await tamanosDe('ESCANEO PESADO.pdf')).peso;
comprobarCierto('7. el de prueba pesa más de 5 MB', pesoPesado > 5 * 1024 * 1024, String(pesoPesado));
await abrirCuadro('ESCANEO PESADO.pdf');
nuevo = await guardarComo('ESCANEO PESADO.pdf', 'ESCANEO');
const pesado = await tamanosDe(nuevo);
comprobarCierto('7. se guarda en 5 MB o menos', pesado.peso <= 5 * 1024 * 1024 && pesado.peso < pesoPesado, String(pesado.peso));
comprobar('7. con sus tres hojas A4', pesado.paginas, [A4, A4, A4]);
comprobarCierto('7. aviso verde «Comprimido de … a …»', (await textoAvisos()).some(t => /^mensaje bueno\|Comprimido de \d+,\d MB a \d+,\d MB\.$/.test(t)), JSON.stringify(await textoAvisos()));

console.log('--- «Ajustar tamaño» del visor ---');
await pagina.evaluate(async ([asunto]) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === asunto)[0];
  const h = await a.handle.getFileHandle('GRANDE CUATRO.pdf');
  PrepararDocumento.abrir({ modo: 'asunto', asunto: a, dir: a.handle, nombre: 'GRANDE CUATRO.pdf', handle: h, alTerminar() {} });
}, [ASUNTO]);
await pagina.waitForSelector('#preparar-check-tamano');
comprobar('8. «Pasar las hojas a» sale marcada con A4', await pagina.evaluate(() => [document.getElementById('preparar-check-tamano').checked, document.getElementById('preparar-tamano').value, document.getElementById('preparar-check-tamano').disabled]), [true, 'A4', false]);
await pagina.evaluate(() => { document.getElementById('preparar-check-sello').checked = false; document.getElementById('preparar-check-sello').dispatchEvent(new Event('change')); });
comprobarCierto('8. el resumen dice que pasarán a A4', (await pagina.locator('#preparar-resumen').textContent()).indexOf('Las hojas pasarán a A4') === 0, await pagina.locator('#preparar-resumen').textContent());
await pagina.click('#cuadro-aceptar');
await esperar(() => (document.getElementById('mensajes').textContent || '').indexOf('Documento preparado') !== -1, null, 200);
comprobar('8. el PDF ya guardado queda en A4', (await tamanosDe('GRANDE CUATRO.pdf')).paginas, [A4]);

await pagina.evaluate(async ([asunto]) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === asunto)[0];
  const h = await a.handle.getFileHandle('FIRMADO DOS.pdf');
  PrepararDocumento.abrir({ modo: 'asunto', asunto: a, dir: a.handle, nombre: 'FIRMADO DOS.pdf', handle: h, alTerminar() {} });
}, [ASUNTO]);
await pagina.waitForSelector('#cuadro-aceptar');
await pagina.click('#cuadro-aceptar');   /* «Seguir de todas formas» */
await pagina.waitForSelector('#preparar-check-tamano');
comprobar('9. con firma, la opción está apagada y dice por qué', await pagina.evaluate(() => [document.getElementById('preparar-check-tamano').checked, document.getElementById('preparar-check-tamano').disabled, document.getElementById('preparar-tamano-firma').textContent]),
  [false, true, 'Lleva firma electrónica: no se pueden cambiar las hojas para no romperla.']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
