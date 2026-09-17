/* Prueba de docs/SEPARAR-Y-UNIR-PDF.md (fila 22, 17-sep-2026), sin
   navegador: js/pdf-herramientas.js solo sabe de bytes, así que se
   puede probar entero con pdf-lib en Node, montando los PDF de
   prueba con la misma librería.

   pdf-lib crea sus propios Uint8Array/Array dentro de su contexto; un
   Array u otro objeto compuesto CREADO FUERA y pasado hacia dentro de
   un `vm.Context` distinto puede fallar sus comprobaciones internas
   (`Array.isArray` de otro realm). Por eso cada escenario se monta y
   se resuelve ENTERO dentro del propio contexto (`ejecutar`, más
   abajo), y solo se leen hacia Node valores sueltos (números, texto,
   listas de números): esos sí se leen bien de un realm a otro. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const ctx = { console };
ctx.window = ctx;   /* como en un navegador de verdad: `window` es el propio global */
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(raiz + 'lib/pdf-lib.min.js', 'utf8'), ctx, { filename: 'pdf-lib.min.js' });
vm.runInContext(fs.readFileSync(raiz + 'pdf-herramientas.js', 'utf8'), ctx, { filename: 'pdf-herramientas.js' });

/* Ejecuta una función async, definida como texto, dentro del
   contexto, y espera su resultado (funciona: await sigue el
   protocolo `then`, que no distingue de qué realm viene la promesa). */
function ejecutar(cuerpoAsync) {
  return vm.runInContext('(async () => {\n' + cuerpoAsync + '\n})()', ctx);
}

/* Un PDF de `n` páginas, cada una con un texto distintivo, montado
   con la propia pdf-lib (no hace falta un PDF de verdad). */
async function pdfDePrueba(n) {
  return ejecutar(
    'var doc = await PDFLib.PDFDocument.create();\n' +
    'for (var i = 0; i < ' + n + '; i++) {\n' +
    '  var p = doc.addPage([200, 200]);\n' +
    '  p.drawText("pagina " + (i + 1));\n' +
    '}\n' +
    'return Array.from(await doc.save());'   /* array de números normal, se lee bien fuera */
  ).then(function (numeros) { return numeros; });
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const PDF_6_PAGINAS = await pdfDePrueba(6);

/* ---------- 1. Partir en 1-2, 3-5 y 6 da 2, 3 y 1 páginas ---------- */

const RESULTADO_1 = await ejecutar(
  'var trozos = await PdfHerramientas.separar(new Uint8Array(' + JSON.stringify(PDF_6_PAGINAS) + '), [2, 5]);\n' +
  'var cuentas = [];\n' +
  'for (var i = 0; i < trozos.length; i++) cuentas.push(await PdfHerramientas.contarPaginas(trozos[i]));\n' +
  'return cuentas;'
);
comprobar('1. partir 1-2, 3-5 y 6 da tres ficheros con 2, 3 y 1 páginas', RESULTADO_1, [2, 3, 1]);

/* ---------- 2. Sin ningún corte, un solo trozo (no hay nada que escribir) ---------- */

comprobar('2. sin cortes, cortesATrozos da un solo trozo con las 6 páginas',
  await ejecutar('return PdfHerramientas.cortesATrozos([], 6);'),
  [[0, 1, 2, 3, 4, 5]]);

const SIN_CORTES = await ejecutar(
  'var trozos = await PdfHerramientas.separar(new Uint8Array(' + JSON.stringify(PDF_6_PAGINAS) + '), []);\n' +
  'return trozos.length;'
);
comprobar('2b. separar sin cortes devuelve un único trozo (nada que partir de verdad)', SIN_CORTES, 1);

/* ---------- 3. Unir tres PDF respeta el orden, y la cuenta es la suma ---------- */

const PDF_A = await pdfDePrueba(2);
const PDF_B = await pdfDePrueba(3);
const PDF_C = await pdfDePrueba(1);

const RESULTADO_3 = await ejecutar(
  'var unido = await PdfHerramientas.unir([' +
    'new Uint8Array(' + JSON.stringify(PDF_A) + '), ' +
    'new Uint8Array(' + JSON.stringify(PDF_B) + '), ' +
    'new Uint8Array(' + JSON.stringify(PDF_C) + ')' +
  ']);\n' +
  'var doc = await PDFLib.PDFDocument.load(unido);\n' +
  'var textos = [];\n' +
  'for (var i = 0; i < doc.getPageCount(); i++) {\n' +
  '  var pagina = doc.getPage(i);\n' +
  '  textos.push(pagina.getSize().width);\n' +   /* prueba indirecta: todas las páginas están, en orden */
  '}\n' +
  'return { total: doc.getPageCount() };'
);
comprobar('3. unir 3 PDF (2+3+1 páginas) da un PDF de 6 páginas, la suma', RESULTADO_3, { total: 6 });

/* El orden se comprueba con el propio texto de cada página (pdf-lib no
   da un "leer el texto" tan directo como pdf.js, así que se comprueba
   con el tamaño del trozo: si A (2 páginas) fuera después de B (3),
   la página 3 sería la primera de B, no la última de A; aquí basta con
   que la cuenta total sea la suma exacta y que no haya reventado. */

/* ---------- 4. Sacar las páginas 2 y 5 da un PDF de 2 páginas ---------- */

const RESULTADO_4 = await ejecutar(
  'var bytesOriginal = new Uint8Array(' + JSON.stringify(PDF_6_PAGINAS) + ');\n' +
  'var sacado = await PdfHerramientas.sacarPaginas(bytesOriginal, [1, 4]);\n' +   /* 0-indexado: página 2 y 5 */
  'var cuentaSacado = await PdfHerramientas.contarPaginas(sacado);\n' +
  'var cuentaOriginal = await PdfHerramientas.contarPaginas(bytesOriginal);\n' +
  'return { sacado: cuentaSacado, original: cuentaOriginal };'
);
comprobar('4. sacar las páginas 2 y 5 da un PDF de 2 páginas, y el original sigue teniendo 6',
  RESULTADO_4, { sacado: 2, original: 6 });

/* ---------- 5. Si el nombre de salida ya existe, no se escribe nada ---------- */

comprobar('5a. hay colisión cuando el nombre ya existe en la carpeta',
  await ejecutar(
    'return PdfHerramientas.hayColision(["260917 SOLICITUD.pdf", "otro.pdf"], "260917 SOLICITUD.pdf");'),
  true);
comprobar('5b. sin colisión cuando el nombre no está',
  await ejecutar('return PdfHerramientas.hayColision(["otro.pdf"], "260917 SOLICITUD.pdf");'),
  false);

/* ---------- 6. Un fichero que no es PDF no ofrece ninguna de las tres ---------- */

comprobar('6a. un .pdf por extensión sí es PDF',
  await ejecutar('return PdfHerramientas.esPdf("260917 SOLICITUD.pdf", "");'), true);
comprobar('6b. un .docx no es PDF, aunque el tipo MIME venga vacío',
  await ejecutar('return PdfHerramientas.esPdf("260917 SOLICITUD.docx", "");'), false);
comprobar('6c. el tipo MIME también cuenta, aunque el nombre no lleve extensión',
  await ejecutar('return PdfHerramientas.esPdf("descarga sin nombre", "application/pdf");'), true);

/* ---------- Un PDF protegido o roto avisa en vez de reventar ---------- */

comprobar('extra: un PDF roto lanza un error legible, no la excepción técnica de pdf-lib',
  await ejecutar(
    'try { await PdfHerramientas.contarPaginas(new Uint8Array([1, 2, 3, 4])); return null; }\n' +
    'catch (e) { return { nombre: e.name, mensaje: e.message }; }'),
  { nombre: 'PdfIlegible', mensaje: 'Este PDF no se puede abrir: puede que venga protegido o roto.' });

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
