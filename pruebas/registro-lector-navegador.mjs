/* Prueba en navegador de verdad de RegistroLector, tras la fila 72
   (docs/DETALLES-DE-MANTENIMIENTO.md, punto 5: pdf.js pasa de la
   3.11.174 a la 4.2.67, que arregla el CVE-2024-4367). Sin esto, un
   cambio de versión de pdf.js podría dejar de leer el sello sin que
   ningún otro test lo note: los demás prueban solo el reconocimiento
   de texto ya extraído (pruebas/registro-sin-duplicar.mjs,
   pruebas/lector-documentos.mjs, "sin pdf.js y sin navegador") o el
   resto de la aplicación con PDF de mentira. Este es el único que
   pasa un PDF de verdad por pdf.js de verdad, en un navegador de
   verdad.

   El PDF se monta con pdf-lib (que no cambia en esta fila) en un
   contexto de Node, con el mismo texto de ejemplo que trae la
   cabecera de js/registro-lector.js. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(raiz + 'lib/pdf-lib.min.js', 'utf8'), ctx, { filename: 'pdf-lib.min.js' });

const LINEA1 = '29700692 - Fuente Lucena';
const LINEA2 = '2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02';

const bytesArray = await vm.runInContext(
  '(async () => {\n' +
  'var doc = await PDFLib.PDFDocument.create();\n' +
  'var p = doc.addPage([595, 842]);\n' +
  'p.drawText(' + JSON.stringify(LINEA1) + ', { x: 50, y: 750, size: 10 });\n' +
  'p.drawText(' + JSON.stringify(LINEA2) + ', { x: 50, y: 700, size: 10 });\n' +
  'var bytes = await doc.save();\n' +
  'return Array.from(bytes);\n' +
  '})()',
  ctx
);
const base64 = Buffer.from(bytesArray).toString('base64');

/* Un segundo PDF, de una sola página, sin ningún sello: leerSello debe
   devolver null sin reventar (mismo camino que un documento cualquiera
   sin registrar). */
const bytesArraySinSello = await vm.runInContext(
  '(async () => {\n' +
  'var doc = await PDFLib.PDFDocument.create();\n' +
  'var p = doc.addPage([595, 842]);\n' +
  'p.drawText("Un documento cualquiera, sin sello de registro.", { x: 50, y: 750, size: 10 });\n' +
  'var bytes = await doc.save();\n' +
  'return Array.from(bytes);\n' +
  '})()',
  ctx
);
const base64SinSello = Buffer.from(bytesArraySinSello).toString('base64');

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function leerSelloDe(base64Pdf) {
  return pagina.evaluate(async (b64) => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const fichero = new File([bytes], 'documento.pdf', { type: 'application/pdf' });
    return window.RegistroLector.leerSello(fichero);
  }, base64Pdf);
}

console.log('--- pdf.js (4.2.67) lee el sello de un PDF de verdad ---');
const r1 = await leerSelloDe(base64);
comprobar('el sello se reconoce entero, con año, serie, número y fecha',
  r1, { anio: '26', serie: 'M', tipo: 'E', numero: '0368', numeroLargo: false, fecha: '10/09/2026' });

console.log('--- un PDF de verdad sin sello no revienta ---');
const r2 = await leerSelloDe(base64SinSello);
comprobar('sin sello, devuelve null', r2, null);

console.log('--- pdf.js se ha cargado como módulo, con window.pdfjsLib puesto ---');
const tienePdfjsLib = await pagina.evaluate(() => typeof window.pdfjsLib === 'object' && typeof window.pdfjsLib.getDocument === 'function');
comprobar('window.pdfjsLib queda puesto tras la primera lectura', tienePdfjsLib, true);

if (errores.length) { fallos++; console.log('\nERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
