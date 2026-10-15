/* ============================================================
   etiquetas-pdf.js — el PDF de las etiquetas, a tamaño real (fila 344, docs/ETIQUETAS.md).

   Con pdf-lib (la misma de js/pdf-herramientas.js), con la hoja del modelo (A4 si no dice otra), sin escalar: lo que se ve en la vista previa es lo
   que sale. La letra es Helvetica (normal y negrita), la que también mide la vista previa.
   - medidor() → Promise de `medir(texto, pt, negrita)` (ancho en puntos) para EtiquetasDisenos.ajustar.
   - generar(paginas, modelo, preparadas) → Promise de los bytes del PDF.
   - nombreDeFichero(diseno, hoy) → «AAMMDD ETIQUETAS <diseño>.pdf».
   ============================================================ */
var EtiquetasPdf = (function () {

  var MM = 72 / 25.4;

  /* Helvetica solo escribe lo que cabe en WinAnsi: lo que no, se cambia por «?» para que el PDF salga. */
  function segura(font, texto) {
    var salida = '';
    Array.from(String(texto)).forEach(function (c) {
      try { font.encodeText(c); salida += c; } catch (e) { salida += '?'; }
    });
    return salida;
  }

  async function fuentes() {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    return { PDFLib: PDFLib, doc: doc,
      normal: await doc.embedFont(PDFLib.StandardFonts.Helvetica), negrita: await doc.embedFont(PDFLib.StandardFonts.HelveticaBold) };
  }

  async function medidor() {
    var f = await fuentes();
    return function (texto, pt, negrita) { var fu = negrita ? f.negrita : f.normal; return fu.widthOfTextAtSize(segura(fu, texto), pt); };
  }

  async function generar(paginas, modelo, preparadas) {
    var f = await fuentes(), doc = f.doc, rgb = f.PDFLib.rgb;
    var g = EtiquetasModelos.geometria(modelo);
    var W = g.hojaAncho * MM, H = g.hojaAlto * MM, relleno = EtiquetasDisenos.RELLENO_MM * MM;
    paginas.hojas.forEach(function (hoja) {
      var pagina = doc.addPage([W, H]);
      hoja.forEach(function (c) {
        var p = c.item ? preparadas.get(c.item) : null;
        if (!p) return;
        var col = c.i % modelo.columnas, fila = Math.floor(c.i / modelo.columnas);
        var x0 = (g.x0 + col * g.px) * MM, yArriba = (g.y0 + fila * g.py) * MM, ancho = g.ancho * MM, alto = g.alto * MM;
        var total = p.lineas.reduce(function (s, l) { return s + l.pt * 1.2; }, 0);
        var y = yArriba + Math.max(0, (alto - total) / 2);
        p.lineas.forEach(function (l) {
          var fu = l.negrita ? f.negrita : f.normal, t = segura(fu, l.texto);
          var w = fu.widthOfTextAtSize(t, l.pt);
          var x = l.alinea === 'centro' ? x0 + (ancho - w) / 2 : (l.alinea === 'der' ? x0 + ancho - relleno - w : x0 + relleno);
          pagina.drawText(t, { x: x, y: H - (y + l.pt * 0.95), size: l.pt, font: fu, color: rgb(0, 0, 0) });
          y += l.pt * 1.2;
        });
      });
    });
    return doc.save();
  }

  function nombreDeFichero(diseno, hoy) {
    var d = hoy || new Date();
    var aammdd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var n = String(diseno && diseno.nombre || '').replace(/[\\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
    return aammdd + ' ETIQUETAS' + (n ? ' ' + n : '') + '.pdf';
  }

  return { medidor: medidor, generar: generar, nombreDeFichero: nombreDeFichero };
})();
window.EtiquetasPdf = EtiquetasPdf;
