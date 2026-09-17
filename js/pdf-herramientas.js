/* ============================================================
   pdf-herramientas.js — partir, unir y sacar páginas de un PDF, con
   pdf-lib (17-sep-2026, fila 22, docs/SEPARAR-Y-UNIR-PDF.md).

   La estructura interna de un PDF (tabla de objetos, referencias
   cruzadas) no se puede tocar a mano como se hizo con el `.docx` de
   la fila 17. Se usa **pdf-lib**, copiada en `js/lib/pdf-lib.min.js`
   (versión 1.17.1, del `dist/` de npm, build UMD) y cargada solo la
   primera vez que hace falta, con el mismo truco de
   `js/registro-lector.js` con pdf.js. No se trae de internet en
   caliente.

   Las páginas se copian tal cual (`copyPages`): no se pierde calidad,
   ni el texto, ni el sello de registro que lleven dentro.

   Este fichero solo sabe de bytes (`Uint8Array` dentro y fuera): no
   toca el disco ni el DOM. Quien lo llama (`js/pdf-separar-unir.js`)
   es quien lee y escribe ficheros, y pinta las miniaturas con pdf.js.
   Así esto se puede probar entero sin navegador
   (pruebas/separar-unir.mjs).
   ============================================================ */
var PdfHerramientas = (function () {

  var cargando = null;

  function cargarPdfLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (cargando) return cargando;
    cargando = new Promise(function (resolver, rechazar) {
      var script = document.createElement('script');
      script.src = 'js/lib/pdf-lib.min.js';
      script.onload = function () { resolver(window.PDFLib); };
      script.onerror = function () { rechazar(new Error('No se ha podido cargar pdf-lib.')); };
      document.head.appendChild(script);
    });
    return cargando;
  }

  /* Un mensaje en palabras llanas, no la excepción técnica de pdf-lib
     (que suele hablar de "trailer" o de "xref"). */
  function errorDeLectura() {
    var error = new Error('Este PDF no se puede abrir: puede que venga protegido o roto.');
    error.name = 'PdfIlegible';
    return error;
  }

  async function abrir(PDFLib, bytes) {
    try { return await PDFLib.PDFDocument.load(bytes); }
    catch (e) { throw errorDeLectura(); }
  }

  async function contarPaginas(bytes) {
    var PDFLib = await cargarPdfLib();
    var doc = await abrir(PDFLib, bytes);
    return doc.getPageCount();
  }

  /* `cortes`: por cada tijera pulsada, el número de página (1 = la
     primera) DESPUÉS de la cual se corta. Un PDF de 6 páginas con
     `cortes: [2, 5]` da "1-2, 3-5, 6". Sin efectos: se puede probar
     sola, sin pdf-lib de por medio. */
  function cortesATrozos(cortes, totalPaginas) {
    var ordenados = (cortes || []).slice().sort(function (a, b) { return a - b; });
    var trozos = [];
    var desde = 0;
    ordenados.forEach(function (corte) {
      if (corte <= desde || corte >= totalPaginas) return;   /* fuera de rango: se ignora */
      var indices = [];
      for (var i = desde; i < corte; i++) indices.push(i);
      trozos.push(indices);
      desde = corte;
    });
    var ultimo = [];
    for (var j = desde; j < totalPaginas; j++) ultimo.push(j);
    trozos.push(ultimo);
    return trozos;
  }

  /* Devuelve una lista de `Uint8Array`, una por trozo, en el mismo
     orden que `cortesATrozos`. Si no hay ningún corte, devuelve un
     solo trozo con el PDF entero (quien llama decide que eso es "no
     hacer nada": no tiene sentido escribir una copia igual). */
  async function separar(bytes, cortes) {
    var PDFLib = await cargarPdfLib();
    var origen = await abrir(PDFLib, bytes);
    var trozos = cortesATrozos(cortes, origen.getPageCount());
    var salida = [];
    for (var i = 0; i < trozos.length; i++) {
      var nuevo = await PDFLib.PDFDocument.create();
      var paginas = await nuevo.copyPages(origen, trozos[i]);
      paginas.forEach(function (p) { nuevo.addPage(p); });
      salida.push(await nuevo.save());
    }
    return salida;
  }

  /* Junta varios PDF, en el orden de la lista, en uno solo. */
  async function unir(listaDeBytes) {
    var PDFLib = await cargarPdfLib();
    var nuevo = await PDFLib.PDFDocument.create();
    for (var i = 0; i < listaDeBytes.length; i++) {
      var origen = await abrir(PDFLib, listaDeBytes[i]);
      var paginas = await nuevo.copyPages(origen, origen.getPageIndices());
      paginas.forEach(function (p) { nuevo.addPage(p); });
    }
    return nuevo.save();
  }

  /* `indices`: 0 la primera página. El original no se toca: esto solo
     devuelve los bytes de la copia nueva. */
  async function sacarPaginas(bytes, indices) {
    var PDFLib = await cargarPdfLib();
    var origen = await abrir(PDFLib, bytes);
    var nuevo = await PDFLib.PDFDocument.create();
    var paginas = await nuevo.copyPages(origen, indices);
    paginas.forEach(function (p) { nuevo.addPage(p); });
    return nuevo.save();
  }

  function esPdf(nombre, tipo) {
    return (tipo === 'application/pdf') || /\.pdf$/i.test(String(nombre || ''));
  }

  function hayColision(nombresExistentes, nombreNuevo) {
    return nombresExistentes.indexOf(nombreNuevo) !== -1;
  }

  return {
    cargarPdfLib: cargarPdfLib,
    contarPaginas: contarPaginas,
    cortesATrozos: cortesATrozos,
    separar: separar,
    unir: unir,
    sacarPaginas: sacarPaginas,
    esPdf: esPdf,
    hayColision: hayColision
  };
})();
window.PdfHerramientas = PdfHerramientas;
