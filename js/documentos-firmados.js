/* ============================================================
   documentos-firmados.js — reconocer los PDF con firma digital
   (5-nov-2026, fila 515, tema 392, docs/515-DETECTAR-DOCUMENTOS-FIRMADOS.md).

   Aquí vive lo que es común a todos los caminos por los que llega un PDF
   firmado: contar las firmas de un fichero, apuntarlas en los datos del
   documento (`ficha.documentos[<número>].firmas`, que es lo que pinta la
   marca «Firmado» en la línea gris, js/documentos-datos.js), escribir la
   nota del asunto y poner el aviso verde.

   (Fila 523: `alLlegar` también marca la tarea de firmar de ese documento, js/tarea-firmar.js.)

   Solo cuenta firmas: no comprueba que sean válidas ni quién firma.

   Quién lo usa:
     - js/ruta-copia.js (el firmado guardado encima tras pulsar «Ruta»),
     - js/ficha-firmas.js (el firmado que llega con otro nombre, y la
       pregunta cuando llega algo sin firma encima de un firmado),
     - js/ficha-sellos.js (un PDF con sello Y firma: entra por el sello y
       además se anota la firma).
   ============================================================ */
window.DocumentosFirmados = (function () {

  function esPdf(nombre) { return /\.pdf$/i.test(String(nombre || '')); }

  /* Cuántas firmas trae un fichero (un File). 0 si no es un PDF o no se puede leer. */
  async function contar(fichero) {
    try {
      if (!fichero || !window.PdfMargenes) return 0;
      if (fichero.name && !esPdf(fichero.name)) return 0;
      return PdfMargenes.contarFirmas(new Uint8Array(await fichero.arrayBuffer()));
    } catch (e) { return 0; }
  }

  async function contarEn(dir, nombre) {
    try { return await contar(await (await dir.getFileHandle(nombre)).getFile()); } catch (e) { return 0; }
  }

  /* El sufijo del nombre del anterior en previas: « SIN FIRMAR», « CON 1 FIRMA», « CON 2 FIRMAS». */
  function sufijoDelAnterior(caso, previas) {
    if (caso === 'firmado') return ' SIN FIRMAR';
    return ' CON ' + previas + (previas === 1 ? ' FIRMA' : ' FIRMAS');
  }

  function fechaDeHoy() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  function numeroDe(nombre) { return window.Numeros ? Numeros.delNombreDeDocumento(nombre) : ''; }

  /* Apunta las firmas en los datos del documento (solo los que tienen número de documento;
     los antiguos reciben la nota, no la marca). `minimo`: nunca baja el número. */
  async function anotarFirmas(a, doc, firmas, minimo) {
    var numero = numeroDe(doc);
    if (!numero || !window.DocumentosDatos) return;
    await DocumentosDatos.anotar(a.nombre, numero, minimo ? { firmasMinimo: firmas } : { firmas: firmas });
  }

  /* Un documento con sello Y firma: entra por el sello y además se anota la firma. */
  async function anotarJuntoAlSello(a, doc, firmas) {
    if (!(firmas > 0)) return;
    try { await anotarFirmas(a, doc, firmas, true); } catch (e) { /* accesorio: el registro ya está hecho */ }
  }

  async function nota(a, doc, texto) {
    if (!window.Notas) return;
    await Notas.sustituir(a, texto, 'firmaDeDocumento', doc, { auto: true });
  }

  function textoDeLaNota(caso, firmas, doc) {
    var f = fechaDeHoy();
    return (caso === 'masFirmas' ? 'Firmado (' + firmas + ' firmas) el ' : 'Firmado el ') + f + ' · ' + doc;
  }

  /* Llega un firmado (o con más firmas). `carpetaPrevias`: dónde queda el anterior ('' si no hay
     anterior que conservar, como el firmado que llega con otro nombre y se guarda como nuevo). */
  async function alLlegar(a, doc, caso, firmas, carpetaPrevias) {
    var principal = false;
    try { await anotarFirmas(a, doc, firmas, false); principal = true; }
    catch (e) { U.fallo('No he podido anotar la firma del documento', e); }
    if (!principal) return;
    try { await nota(a, doc, textoDeLaNota(caso, firmas, doc)); }
    catch (e2) { U.accesorio('Documento firmado, pero no he podido apuntarlo en las notas', e2); }
    /* Fila 523: la tarea de firmar de ese documento se marca sola (js/tarea-firmar.js) y el aviso lo dice. */
    var tarea = window.TareaFirmar ? await TareaFirmar.alLlegar(a, doc, firmas) : '';
    if (!carpetaPrevias) { if (tarea) U.aviso(tarea.trim(), 'bueno'); return; }
    U.aviso((caso === 'masFirmas'
      ? 'Documento con ' + firmas + ' firmas. El anterior se conserva en «' + carpetaPrevias + '».'
      : 'Documento firmado. El original sin firmar se conserva en «' + carpetaPrevias + '».') + tarea, 'bueno');
  }

  /* Se contesta «Usar el nuevo» a la pregunta: la nota dice qué pasó. */
  function notaDeSustituido(a, doc) {
    return nota(a, doc, 'Sustituido el firmado por una versión sin firma el ' + fechaDeHoy() + ' · ' + doc);
  }

  return {
    contar: contar, contarEn: contarEn, sufijoDelAnterior: sufijoDelAnterior, anotarFirmas: anotarFirmas,
    anotarJuntoAlSello: anotarJuntoAlSello, alLlegar: alLlegar, notaDeSustituido: notaDeSustituido, fechaDeHoy: fechaDeHoy
  };
})();
