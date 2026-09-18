/* Prueba de docs/HUECO-PARA-SELLO-Y-FIRMA.md (fila 57, 18-sep-2026),
   sin navegador: js/pdf-margenes.js solo sabe de bytes, así que se
   puede probar entero con pdf-lib en Node, con el mismo montaje que
   pruebas/separar-unir.mjs (mismo motivo: cada escenario se monta y
   se resuelve ENTERO dentro del propio contexto `vm`). */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(raiz + 'lib/pdf-lib.min.js', 'utf8'), ctx, { filename: 'pdf-lib.min.js' });
vm.runInContext(fs.readFileSync(raiz + 'pdf-herramientas.js', 'utf8'), ctx, { filename: 'pdf-herramientas.js' });
vm.runInContext(fs.readFileSync(raiz + 'pdf-margenes.js', 'utf8'), ctx, { filename: 'pdf-margenes.js' });

function ejecutar(cuerpoAsync) {
  return vm.runInContext('(async () => {\n' + cuerpoAsync + '\n})()', ctx);
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarCierto(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

const CM_EN_PT = 28.3465;

/* ---------- 1. A4 con huecos de 1,5 y 2,5 cm ---------- */

const E1 = await ejecutar(
  'return PdfMargenes.calcularEncaje(595, 842, ' + (1.5 * CM_EN_PT) + ', ' + (2.5 * CM_EN_PT) + ');'
);
comprobarCierto('1a. A4 con huecos: escala menor que 1', E1.escala < 1 && E1.escala > 0,
  'escala: ' + E1.escala);
comprobarCierto('1b. A4 con huecos: contenido centrado de lado a lado',
  Math.abs(E1.x - (595 - 595 * E1.escala) / 2) < 1e-6, 'x: ' + E1.x);
comprobarCierto('1c. A4 con huecos: el borde de abajo del contenido justo en el hueco de abajo',
  Math.abs(E1.y - 2.5 * CM_EN_PT) < 1e-6, 'y: ' + E1.y);
comprobarCierto('1d. A4 con huecos: cabe', E1.cabe === true, 'cabe: ' + E1.cabe);

/* ---------- 2. Huecos de 0 y 0 ---------- */

const E2 = await ejecutar('return PdfMargenes.calcularEncaje(595, 842, 0, 0);');
comprobar('2. sin huecos, escala exactamente 1 y ningún desplazamiento',
  { escala: E2.escala, x: E2.x, y: E2.y }, { escala: 1, x: 0, y: 0 });

/* ---------- 3. Hueco absurdo (10 y 10 cm en un A4) ---------- */

const E3 = await ejecutar(
  'return PdfMargenes.calcularEncaje(595, 842, ' + (10 * CM_EN_PT) + ', ' + (10 * CM_EN_PT) + ');'
);
comprobarCierto('3a. hueco absurdo: no cabe', E3.cabe === false, 'cabe: ' + E3.cabe);
comprobarCierto('3b. hueco absurdo: sin escala negativa', E3.escala >= 0, 'escala: ' + E3.escala);

/* ---------- 4. Nunca agranda ---------- */

const E4 = await ejecutar('return PdfMargenes.calcularEncaje(200, 200, 10, 10);');
comprobarCierto('4. página pequeña con huecos pequeños: escala nunca pasa de 1',
  E4.escala <= 1, 'escala: ' + E4.escala);

/* ---------- 5. conHueco conserva páginas y tamaños, con tamaños distintos y una girada ---------- */

const RESULTADO_5 = await ejecutar(
  'var doc = await PDFLib.PDFDocument.create();\n' +
  'var p1 = doc.addPage([595, 842]);\n' +
  'p1.drawText("pagina 1");\n' +
  'var p2 = doc.addPage([400, 300]);\n' +
  'p2.drawText("pagina 2");\n' +
  'var p3 = doc.addPage([595, 842]);\n' +
  'p3.setRotation(PDFLib.degrees(90));\n' +
  'p3.drawText("pagina 3, girada");\n' +
  'var bytesOriginal = await doc.save();\n' +
  'var conHueco = await PdfMargenes.conHueco(new Uint8Array(bytesOriginal), 0.5, 0.5);\n' +
  'var salida = await PDFLib.PDFDocument.load(conHueco);\n' +
  'var paginas = salida.getPages();\n' +
  'return {\n' +
  '  total: paginas.length,\n' +
  '  tam1: paginas[0].getSize(),\n' +
  '  tam2: paginas[1].getSize(),\n' +
  '  tam3: paginas[2].getSize(),\n' +
  '  giro3: paginas[2].getRotation().angle\n' +
  '};'
);
comprobar('5a. conHueco conserva el número de páginas', RESULTADO_5.total, 3);
comprobar('5b. conHueco conserva el tamaño de la primera hoja (A4)', RESULTADO_5.tam1, { width: 595, height: 842 });
comprobar('5c. conHueco conserva el tamaño de la segunda hoja, distinto de la primera', RESULTADO_5.tam2, { width: 400, height: 300 });
comprobar('5d. conHueco conserva el tamaño crudo de la tercera hoja, girada', RESULTADO_5.tam3, { width: 595, height: 842 });
comprobar('5e. conHueco conserva el giro de la tercera hoja', RESULTADO_5.giro3, 90);

/* ---------- 5f. Si una página no tiene sitio, no se escribe nada ---------- */

const RESULTADO_5F = await ejecutar(
  'var doc = await PDFLib.PDFDocument.create();\n' +
  'doc.addPage([595, 842]);\n' +
  'doc.addPage([100, 60]);\n' +   /* demasiado pequeña para el hueco pedido */
  'var bytesOriginal = await doc.save();\n' +
  'try {\n' +
  '  await PdfMargenes.conHueco(new Uint8Array(bytesOriginal), 1.5, 2.5);\n' +
  '  return null;\n' +
  '} catch (e) { return { nombre: e.name, mensaje: e.message }; }'
);
comprobar('5f. si una página no tiene sitio, no se escribe nada y se avisa',
  RESULTADO_5F, { nombre: 'HuecoNoCabe', mensaje: 'El hueco que pides no cabe en esta hoja. Baja las medidas en Ajustes.' });

/* ---------- 6. pareceFirmado ---------- */

const RECIEN_CREADO = await ejecutar(
  'var doc = await PDFLib.PDFDocument.create();\n' +
  'doc.addPage([595, 842]);\n' +
  'return Array.from(await doc.save());'
);
comprobar('6a. pareceFirmado da falso en un PDF recién creado',
  await ejecutar('return PdfMargenes.pareceFirmado(new Uint8Array(' + JSON.stringify(RECIEN_CREADO) + '));'),
  false);

comprobar('6b. pareceFirmado da verdadero en unos bytes que contengan /ByteRange',
  await ejecutar(
    'var texto = "%PDF-1.4\\n<< /Type /Sig /ByteRange [0 1 2 3] >>";\n' +
    'var bytes = new Uint8Array(texto.length);\n' +
    'for (var i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i);\n' +
    'return PdfMargenes.pareceFirmado(bytes);'),
  true);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
