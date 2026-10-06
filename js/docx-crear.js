/* ============================================================
   docx-crear.js — un .docx nuevo a partir de párrafos de texto (fila 281,
   docs/CONVERTIR-EN-PLANTILLA-DESDE-PDF.md, apartado 3.b).

   Con el aspecto de las plantillas del centro (`scripts/hacer-plantillas.mjs`
   y `plantillas/*.docx`): Calibri a 11 puntos; el título, centrado, en
   negrita y a 16; los demás párrafos, justificados (o centrados si lo eran
   en el PDF). Un poco de aire detrás de cada párrafo, para que no salgan
   pegados. Puro: sin disco ni pantalla. Las piezas del ZIP son las de
   `Docx.interno` (js/docx.js), con las entradas sin comprimir.

   `DocxCrear.crear([{ texto, centrado, titulo }])` -> Uint8Array.
   ============================================================ */
var DocxCrear = (function () {

  var W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  var CABECERA = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

  function escaparXml(t) { return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function parrafoXml(p) {
    var jc = (p.titulo || p.centrado) ? 'center' : 'both';
    var rPr = p.titulo ? '<w:rPr><w:b/><w:sz w:val="32"/></w:rPr>' : '';
    return '<w:p><w:pPr><w:spacing w:after="200"/><w:jc w:val="' + jc + '"/></w:pPr><w:r>' + rPr +
      '<w:t xml:space="preserve">' + escaparXml(p.texto) + '</w:t></w:r></w:p>';
  }

  /* Un ZIP sin comprimir con las entradas dadas: [{ nombre, texto }]. */
  function zip(entradas) {
    var I = window.Docx.interno, partes = [], centrales = [], offset = 0;
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

  function crear(parrafos) {
    return zip([
      { nombre: '[Content_Types].xml', texto: CABECERA + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>' },
      { nombre: '_rels/.rels', texto: CABECERA + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { nombre: 'word/document.xml', texto: CABECERA + '<w:document ' + W + '><w:body>' + (parrafos || []).map(parrafoXml).join('') + '<w:sectPr/></w:body></w:document>' },
      { nombre: 'word/_rels/document.xml.rels', texto: CABECERA + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>' },
      { nombre: 'word/styles.xml', texto: CABECERA + '<w:styles ' + W + '><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>' }
    ]);
  }

  return { crear: crear, zip: zip };
})();
window.DocxCrear = DocxCrear;
