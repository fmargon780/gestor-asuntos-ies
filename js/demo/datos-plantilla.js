/* ============================================================
   demo/datos-plantilla.js — lo que necesita «Convertir en plantilla»
   (fila 280, docs/CONVERTIR-EN-PLANTILLA.md) en la copia de pruebas:
     1. en el asunto de Espejo Montes, Carla (CERTIFICADO), un Word nuevo,
        de hace 3 días, asociado al hito «Preparar el certificado»;
     2. en el de Otero Campos, Marta (BAJA MEDICA), un PDF y, en su
        carpeta de versiones previas, el Word gemelo; y un «notas
        antiguas.doc»;
     3. el sexo de Carla (mujer) y de Diego (hombre), para el grupo «Para
        que sirva con hombre y con mujer».
   Fila 281 (docs/CONVERTIR-EN-PLANTILLA-DESDE-PDF.md), en el asunto de
   Aguilar Ponce, Pablo: un PDF con texto de dos páginas (`JUSTIFICANTE`) y
   uno con una tabla (`LISTADO`); los PDF de mentira de siempre, sin texto,
   sirven de PDF escaneado.

   Todo inventado. `Demo.plantilla.construir({ carlaClave, martaClave, hace })`
   y `Demo.plantilla.construirPdf({ pabloClave, hace })` los llama
   js/demo/datos.js al crear esos asuntos.
   ============================================================ */
(function () {
  'use strict';

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  var CABECERA_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function r(texto, negrita) { return '<w:r>' + (negrita ? '<w:rPr><w:b/></w:rPr>' : '') + '<w:t xml:space="preserve">' + esc(texto) + '</w:t></w:r>'; }
  function p(runs, centrado) { return '<w:p>' + (centrado ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : '') + runs.join('') + '</w:p>'; }

  /* Un .docx mínimo, sin comprimir, con las piezas de js/docx.js. */
  function zip(entradas) {
    var I = Docx.interno, partes = [], centrales = [], offset = 0;
    entradas.forEach(function (e) {
      var datos = new TextEncoder().encode(e.texto), nombre = new TextEncoder().encode(e.nombre), crc = I.crc32(datos);
      var local = I.cabeceraLocal({ crc: crc, tam: datos.length, nombreBytes: nombre, tiempoDos: 0, fechaDos: 0x21 });
      partes.push(local, datos);
      centrales.push(I.entradaCentral({ crc: crc, tam: datos.length, nombreBytes: nombre, tiempoDos: 0, fechaDos: 0x21, atributosExternos: 0, offset: offset }));
      offset += local.length + datos.length;
    });
    var directorio = I.concatenar(centrales);
    return I.concatenar(partes.concat([directorio, I.finDeDirectorio(entradas.length, directorio.length, offset)]));
  }

  function docx(parrafos) {
    return zip([
      { nombre: '[Content_Types].xml', texto: CABECERA_XML + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>' },
      { nombre: '_rels/.rels', texto: CABECERA_XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { nombre: 'word/document.xml', texto: CABECERA_XML + '<w:document ' + W + '><w:body>' + parrafos.join('') + '<w:sectPr/></w:body></w:document>' },
      { nombre: 'word/_rels/document.xml.rels', texto: CABECERA_XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>' },
      { nombre: 'word/styles.xml', texto: CABECERA_XML + '<w:styles ' + W + '><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>' }
    ]);
  }

  function fechaEnLetra(iso) {
    return +iso.slice(8, 10) + ' de ' + MESES[+iso.slice(5, 7) - 1] + ' de ' + iso.slice(0, 4);
  }

  var WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  async function conNumero(asuntoNombre, carpeta, fecha, tipo, extension, bytes, mime) {
    var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
    var nombre = Nombres.montarDocumento({ fecha: fecha, tipo: tipo, extension: extension, numeroDoc: numeroDoc });
    await Carpetas.escribirBytes(carpeta, nombre, bytes, mime);
    await DocumentosDatos.anotar(asuntoNombre, numeroDoc, { tipo: tipo, fecha: fecha, texto: '', campos: [], valores: {}, registros: [] });
    return nombre;
  }

  async function construir(o) {
    var hace = o.hace;
    /* 1. El certificado de Carla, con el nombre de «Carla» partido en dos trozos de formato distinto. */
    var fecha = hace(3);
    var carpetaCarla = await App.E.abiertos.getDirectoryHandle(o.carlaClave);
    var bytesCarla = docx([
      p([r('JUNTA DE ANDALUCÍA - Consejería de Educación')]),
      p([r('CERTIFICADO DE MATRÍCULA', true)], true),
      p([r('D. Fernando Reyes Palma, Secretario del centro,')]),
      p([r('CERTIFICA: Que la alumna '), r('Carla', true), r(' Espejo Montes, con número de identificación escolar 2100006, está matriculada en este centro en el curso actual.')]),
      p([r('Y para que conste, y para presentarlo en la solicitud de beca, firmo el presente certificado.')]),
      p([r('En Localidad de pruebas, a ' + fechaEnLetra(fecha))]),
      p([r('Fdo.: Fernando Reyes Palma')])
    ]);
    var nombreCarla = await conNumero(o.carlaClave, carpetaCarla, fecha, 'CERTIFICADO', 'docx', bytesCarla, WORD);
    try {
      var hitos = await Hitos.hitosDe(o.carlaClave);
      var preparar = hitos.filter(function (h) { return /Preparar el certificado/i.test(h.titulo || ''); })[0];
      if (preparar) await Hitos.anadirDocumento(o.carlaClave, preparar.id, nombreCarla);
    } catch (e) { /* el documento queda en la carpeta aunque no se asocie */ }

    /* 2. El PDF de Marta, con su Word en «_Previas», y un .doc viejo. */
    var carpetaMarta = await App.E.abiertos.getDirectoryHandle(o.martaClave);
    var f2 = hace(5);
    var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
    var nombrePdf = Nombres.montarDocumento({ fecha: f2, tipo: 'COMUNICACION', extension: 'pdf', numeroDoc: numeroDoc });
    await Carpetas.escribirBytes(carpetaMarta, nombrePdf, o.pdf, 'application/pdf');
    await DocumentosDatos.anotar(o.martaClave, numeroDoc, { tipo: 'COMUNICACION', fecha: f2, texto: '', campos: [], valores: {}, registros: [] });
    var previas = await carpetaMarta.getDirectoryHandle('_Previas', { create: true });
    await Carpetas.escribirBytes(previas, nombrePdf.replace(/\.pdf$/i, '.docx'), docx([
      p([r('COMUNICACIÓN', true)], true),
      p([r('Se comunica a Marta Otero Campos que su parte de baja ha sido recibido en el centro.')]),
      p([r('En Localidad de pruebas, a ' + fechaEnLetra(f2))])
    ]), WORD);
    await Carpetas.escribirBytes(carpetaMarta, 'notas antiguas.doc', new TextEncoder().encode('notas viejas, inventadas'), 'application/msword');

    /* 3. El sexo de Carla y de Diego (su RegAlum no trae la columna «Sexo»). */
    try {
      await Genero.guardar({ id: '2100006', nombre: 'Espejo Montes, Carla' }, 'ALUMNADO', 'M');
      await Genero.guardar({ id: '2100009', nombre: 'Herrera Lozano, Diego' }, 'ALUMNADO', 'H');
    } catch (e) { /* sin el dato, las formas dobles se quedan con su barra */ }
  }

  /* Fila 281: PDF con texto de verdad, hechos con pdf-lib. */
  async function construirPdf(o) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var carpeta = await App.E.abiertos.getDirectoryHandle(o.pabloClave);

    /* El justificante: dos páginas, con el mismo renglón de cabecera arriba en las dos. */
    var fecha = o.hace(2);
    var doc = await PDFLib.PDFDocument.create();
    var letra = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var negrita = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    function texto(pagina, t, x, y, tam, fuente) { pagina.drawText(t, { x: x, y: y, size: tam, font: fuente || letra }); }
    var cabecera = 'IES Fuente Lucena (copia de pruebas) - Secretaría';
    var p1 = doc.addPage([595, 842]);
    texto(p1, cabecera, 50, 800, 9);
    var titulo = 'JUSTIFICANTE DE MATRÍCULA';
    texto(p1, titulo, (595 - negrita.widthOfTextAtSize(titulo, 16)) / 2, 740, 16, negrita);
    texto(p1, 'Se hace constar que Pablo Aguilar Ponce, con número de identificación escolar 2100002,', 50, 690, 11);
    texto(p1, 'ha formalizado su matrícula en este centro.', 50, 675, 11);
    texto(p1, 'En Localidad de pruebas, a ' + fechaEnLetra(fecha), 50, 620, 11);
    var p2 = doc.addPage([595, 842]);
    texto(p2, cabecera, 50, 800, 9);
    texto(p2, 'Este justificante no tiene validez sin el sello del centro.', 50, 740, 11);
    texto(p2, 'Firmado digitalmente por Fernando Reyes Palma', 50, 100, 9);
    await conNumero(o.pabloClave, carpeta, fecha, 'JUSTIFICANTE', 'pdf', await doc.save(), 'application/pdf');

    /* El listado: tres renglones seguidos con tres columnas bien separadas. */
    var tabla = await PDFLib.PDFDocument.create();
    var letraT = await tabla.embedFont(PDFLib.StandardFonts.Helvetica);
    var pt = tabla.addPage([595, 842]);
    [['Alumna Marina Aguilar', 'Curso 1 de la ESO', 'Grupo 1 A'], ['Alumno Pablo Aguilar', 'Curso 3 de la ESO', 'Grupo 3 A'],
     ['Alumna Noa Castro', 'Curso 2 de la ESO', 'Grupo 2 B']].forEach(function (fila, i) {
      fila.forEach(function (celda, k) { pt.drawText(celda, { x: [50, 230, 420][k], y: 700 - i * 16, size: 11, font: letraT }); });
    });
    await conNumero(o.pabloClave, carpeta, o.hace(1), 'LISTADO', 'pdf', await tabla.save(), 'application/pdf');
  }

  window.Demo = window.Demo || {};
  window.Demo.plantilla = { construir: construir, construirPdf: construirPdf, docx: docx, p: p, r: r, WORD: WORD };
})();
