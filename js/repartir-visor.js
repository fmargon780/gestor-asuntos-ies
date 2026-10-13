/* ============================================================
   repartir-visor.js — el visor grande de los cuadros de repartir
   (fila 337, 13-oct-2026, docs/REPARTIR-VARIOS-FICHEROS.md).

   Se pinta en un contenedor a la derecha del cuadro, a todo el alto,
   con las páginas una debajo de otra: un PDF (o solo unas páginas de
   él) con pdf.js, una imagen tal cual y un Word con el visor de Word de
   la aplicación. Cada llamada nueva cancela el pintado de la anterior.

     RepartirVisor.pdf(contenedor, pdfDoc, desde, hasta)
     RepartirVisor.fichero(contenedor, nombre, handle)
   ============================================================ */
var RepartirVisor = (function () {

  var pintado = 0;   /* para cancelar el pintado de una llamada anterior */

  function aviso(c, texto) {
    c.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'suave repartir-visor-vacio';
    p.textContent = texto;
    c.appendChild(p);
  }

  async function pdf(c, pdfDoc, desde, hasta) {
    var mio = ++pintado;
    c.innerHTML = '';
    c.scrollTop = 0;
    var ancho = Math.max(240, (c.clientWidth || 600) - 24);
    for (var n = desde; n <= hasta; n++) {
      if (mio !== pintado) return;
      var lienzo = document.createElement('canvas');
      lienzo.className = 'repartir-visor-pagina';
      lienzo.dataset.pagina = n;
      c.appendChild(lienzo);
      try {
        var pag = await pdfDoc.getPage(n);
        var base = pag.getViewport({ scale: 1 });
        var vp = pag.getViewport({ scale: ancho / base.width });
        lienzo.width = vp.width; lienzo.height = vp.height;
        await pag.render({ canvasContext: lienzo.getContext('2d'), viewport: vp }).promise;
      } catch (e) { /* una página que no se pinta no tumba las demás */ }
    }
  }

  async function fichero(c, nombre, handle) {
    var mio = ++pintado;
    aviso(c, 'Abriendo…');
    var ext = (String(nombre).match(/\.([A-Za-z0-9]{1,8})$/) || [])[1];
    ext = (ext || '').toLowerCase();
    try {
      var archivo = await handle.getFile();
      if (mio !== pintado) return;
      if (ext === 'pdf') {
        var lib = await App.cargarPdfJs();
        var doc = await lib.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise;
        if (mio !== pintado) return;
        await pdf(c, doc, 1, doc.numPages);
      } else if (/^(png|jpe?g|gif|webp|bmp)$/.test(ext)) {
        c.innerHTML = '';
        var img = document.createElement('img');
        img.className = 'repartir-visor-imagen';
        img.alt = nombre;
        img.src = URL.createObjectURL(archivo);
        c.appendChild(img);
      } else if (ext === 'docx' && window.WordVisor && WordVisor.pintarEn) {
        var cont = document.createElement('div');
        cont.className = 'repartir-visor-word';
        c.innerHTML = '';
        c.appendChild(cont);
        await WordVisor.pintarEn(cont, archivo);
      } else {
        aviso(c, 'Este fichero no se puede ver aquí.');
      }
    } catch (e) {
      if (mio === pintado) aviso(c, 'No he podido abrir este fichero.');
    }
  }

  return { pdf: pdf, fichero: fichero, aviso: aviso };
})();
window.RepartirVisor = RepartirVisor;
