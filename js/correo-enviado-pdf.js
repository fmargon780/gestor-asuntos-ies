/* ============================================================
   correo-enviado-pdf.js — el correo enviado desde la app, como PDF en
   el asunto (1-oct-2026, fila 236, docs/CORREO-ENVIADO-EN-PDF.md).

   Hasta ahora, al enviar («Confirmar y enviar», js/correo-cuadro.js) no
   se guardaba ningún documento: solo la nota «Correo enviado a…» y el
   hilo enganchado. Ahora, al enviar bien, se guarda en la carpeta del
   asunto un PDF `AAMMDD CORREO <trozo del asunto>.pdf` (el mismo nombre
   que la bandeja da a un correo suelto, así la ficha lo reconoce como
   «Llegado por correo») con la cabecera (De si se sabe, Para, Copia
   oculta, fecha y hora, Asunto), el texto tal como salió y, al final,
   «Adjuntos:» con sus nombres (no se vuelven a guardar). Cuando llegue
   la respuesta por la bandeja, el HILO se crea como siempre.

   Si el PDF falla, el correo ya ha salido: aviso ámbar, nunca rojo.
   Con `yaEnviado` (salió en un intento anterior) solo se guarda si no
   está ya. Lo llama js/correo-cuadro.js tras el envío; pdf-lib viene de
   js/pdf-herramientas.js, como en js/indice-expediente.js.
   ============================================================ */
window.CorreoEnviadoPdf = (function () {

  /* Helvetica de pdf-lib solo sabe escribir WinAnsi: lo que no cabe se
     cambia por «?» en vez de romper (como en js/indice-expediente.js). */
  var EXTRA_WINANSI = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  function limpio(t) {
    return String(t || '').normalize('NFC').split('').map(function (c) {
      var n = c.charCodeAt(0);
      if (n === 9) return ' ';
      if ((n >= 32 && n <= 126) || (n >= 160 && n <= 255) || EXTRA_WINANSI.indexOf(c) !== -1) return c;
      return '?';
    }).join('');
  }

  /* PURA. El trozo del asunto del correo para el nombre: sin «Re:», recortado
     a 40 letras por una palabra entera, sin signos al final (como la bandeja). */
  function trozoDelAsunto(asunto) {
    var sinRe = (window.BandejaNucleo && BandejaNucleo.sinElRe) ? BandejaNucleo.sinElRe(asunto || '') : String(asunto || '');
    var t = U.limpiarNombre(sinRe);
    if (t.length > 40) {
      t = t.slice(0, 40);
      var espacio = t.lastIndexOf(' ');
      if (espacio > 20) t = t.slice(0, espacio);
    }
    return t.replace(/[,;:.\-\s]+$/, '').trim();
  }

  /* PURA. `AAMMDD CORREO <trozo>.pdf` con la fecha del envío (AAAA-MM-DD). */
  function nombreDelPdf(asunto, fechaIso) {
    var trozo = trozoDelAsunto(asunto);
    return U.aAaMmDd(fechaIso) + ' CORREO' + (trozo ? ' ' + trozo : '') + '.pdf';
  }

  function fechaHoraLegible(d) {
    function dos(n) { return (n < 10 ? '0' : '') + n; }
    return dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + dos(d.getHours()) + ':' + dos(d.getMinutes());
  }

  /* Parte un texto en líneas que quepan en `ancho`, respetando los saltos de
     línea del original (los párrafos en blanco quedan como renglón vacío). */
  function lineasDe(texto, fuente, tam, ancho) {
    var salida = [];
    String(texto || '').replace(/\r\n?/g, '\n').split('\n').forEach(function (parrafo) {
      var palabras = limpio(parrafo).split(' ');
      var actual = '';
      palabras.forEach(function (p) {
        var prueba = actual ? actual + ' ' + p : p;
        if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) { actual = prueba; return; }
        if (actual) salida.push(actual);
        actual = p;
        while (fuente.widthOfTextAtSize(actual, tam) > ancho && actual.length > 1) {
          var corte = actual.length - 1;
          while (corte > 1 && fuente.widthOfTextAtSize(actual.slice(0, corte), tam) > ancho) corte--;
          salida.push(actual.slice(0, corte));
          actual = actual.slice(corte);
        }
      });
      salida.push(actual);
    });
    return salida;
  }

  /* d = { de, para, cco, fecha (texto), asunto, cuerpo, adjuntos: [nombres] }. Devuelve los bytes. */
  async function pdfDe(d) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var normal = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var negrita = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    var gris = PDFLib.rgb(0.35, 0.35, 0.35), negro = PDFLib.rgb(0, 0, 0), raya = PDFLib.rgb(0.75, 0.75, 0.75);
    var ANCHO = 595.28, ALTO = 841.89, M = 50, SALTO = 13.5;
    var pagina, y;

    function texto(t, x, yy, tam, f, color) { pagina.drawText(limpio(t), { x: x, y: yy, size: tam, font: f || normal, color: color || negro }); }
    function nuevaPagina() { pagina = doc.addPage([ANCHO, ALTO]); y = ALTO - M; }
    function sitio(alto) { if (y - alto < M + 20) nuevaPagina(); }
    function linea(t, tam, f, color) { sitio(SALTO); texto(t, M, y, tam, f, color); y -= SALTO; }

    nuevaPagina();
    linea('Correo enviado', 17, negrita);
    y -= 6;
    var cabecera = [];
    if (d.de) cabecera.push(['De', d.de]);
    cabecera.push(['Para', d.para || '(nadie en Para; va en copia oculta)']);
    if (d.cco) cabecera.push(['Copia oculta', d.cco]);
    cabecera.push(['Fecha', d.fecha]);
    cabecera.push(['Asunto', d.asunto]);
    cabecera.forEach(function (par) {
      var etiqueta = par[0] + ': ';
      var ancho = negrita.widthOfTextAtSize(limpio(etiqueta), 10);
      var partes = lineasDe(par[1], normal, 10, ANCHO - 2 * M - ancho);
      partes.forEach(function (l, i) {
        sitio(SALTO);
        if (i === 0) texto(etiqueta, M, y, 10, negrita);
        texto(l, M + ancho, y, 10, normal);
        y -= SALTO;
      });
    });
    y -= 4;
    pagina.drawLine({ start: { x: M, y: y }, end: { x: ANCHO - M, y: y }, thickness: 0.6, color: raya });
    y -= 16;
    lineasDe(d.cuerpo, normal, 10.5, ANCHO - 2 * M).forEach(function (l) { linea(l, 10.5, normal); });
    if (d.adjuntos && d.adjuntos.length) {
      y -= 10;
      linea('Adjuntos:', 10.5, negrita);
      d.adjuntos.forEach(function (nombre) {
        lineasDe('· ' + nombre, normal, 10, ANCHO - 2 * M).forEach(function (l) { linea(l, 10, normal); });
      });
    }
    var paginas = doc.getPages();
    paginas.forEach(function (p, i) {
      pagina = p;
      var num = 'Página ' + (i + 1) + ' de ' + paginas.length;
      texto(num, ANCHO - M - normal.widthOfTextAtSize(num, 8), 28, 8, normal, gris);
    });
    doc.setTitle(limpio('Correo enviado · ' + d.asunto));
    return doc.save();
  }

  /* Guarda el PDF en la carpeta del asunto `a` (con `.handle`). `datos`: lo
     que salió ({ para, cco, asunto, cuerpo, adjuntos }); `respuesta`: lo que
     contestó el script (`de`, `yaEnviado`). Devuelve el nombre guardado, o ''
     si no hacía falta (ya estaba). Si falla, lanza (quien llama avisa en ámbar). */
  async function guardar(a, datos, respuesta) {
    if (!a || !a.handle) throw new Error('No encuentro la carpeta del asunto.');
    var ahora = new Date();
    var base = nombreDelPdf(datos.asunto, U.hoyIso());
    if (respuesta && respuesta.yaEnviado && await Carpetas.existeFichero(a.handle, base)) return '';
    var nombre = base;
    var punto = base.lastIndexOf('.');
    for (var n = 2; n < 50 && await Carpetas.existeFichero(a.handle, nombre); n++) {
      nombre = base.slice(0, punto) + ' (' + n + ')' + base.slice(punto);
    }
    var bytes = await pdfDe({
      de: (respuesta && respuesta.de) || '', para: datos.para || '', cco: datos.cco || '',
      fecha: fechaHoraLegible(ahora), asunto: datos.asunto || '', cuerpo: datos.cuerpo || '',
      adjuntos: datos.adjuntos || []
    });
    await Carpetas.escribirBytes(a.handle, nombre, bytes, 'application/pdf');
    return nombre;
  }

  /* Repinta lo que esté a la vista, para que el CORREO salga sin recargar. */
  function repintar(a) {
    var N = window.FichaNucleo;
    try {
      if (N && N.actual && N.actual.nombre === a.nombre && N.pintarDocumentos) N.pintarDocumentos(a);
    } catch (e) { /* solo pintar */ }
    try { if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado(); } catch (e) { /* solo pintar */ }
  }

  /* Lo que llama el cuadro de Correo tras un envío bien hecho. Nunca lanza. */
  async function alEnviar(a, datos, respuesta) {
    try {
      var nombre = await guardar(a, datos, respuesta);
      if (nombre) repintar(a);
      return nombre;
    } catch (e) {
      U.accesorio('El correo ha salido, pero no he podido guardar su PDF en el asunto', e);
      return '';
    }
  }

  return { trozoDelAsunto: trozoDelAsunto, nombreDelPdf: nombreDelPdf, pdfDe: pdfDe, guardar: guardar, alEnviar: alEnviar };
})();
