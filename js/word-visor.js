/* ============================================================
   word-visor.js — el Word, en grande dentro de la aplicación
   (25-sep-2026, fila 155, docs/WORD-DENTRO-DE-LA-APP.md, parte B).

   Antes, pulsar un .docx lo mandaba a Descargas con un nombre de
   letras y números (un `blob:` abierto fuera). Ahora se abre aquí, en
   una capa a pantalla completa, con tres botones:

     - «Guardar PDF»: un PDF con el mismo nombre en la carpeta del
       asunto (pregunta antes de sustituir uno que ya esté); si el Word
       viene de un hito, el PDF queda apuntado en ese hito, con su nota.
     - «Imprimir»: el cuadro de imprimir del navegador, solo con las
       páginas del documento.
     - «Cerrar» (y Escape).

   Se ve, no se edita: corregir el Word dentro de la aplicación («Guardar
   cambios») quedó BLOQUEADO (fila 165 de docs/COLA.md).

   Todo en el navegador, sin internet: las librerías van en `js/lib/`
   (docx-preview, Apache-2.0; JSZip, MIT; html2canvas, MIT; pdf-lib, la
   que ya estaba) y se cargan al abrir el primer Word, igual que
   js/pdf-herramientas.js carga pdf-lib. El PDF es una imagen de cada
   página a 200 ppp (sin texto seleccionable), que AutoFirma firma igual.

   `WordVisor.abrir({ blob | handle, nombre, carpeta, asunto, hito })`.
   Lo llaman js/visor.js (un .docx) y js/plantillas-documento.js (el
   Word recién generado).
   ============================================================ */
var WordVisor = (function () {

  var PPP = 200;
  var capa = null;
  var actual = null;   /* { blob, nombre, carpeta, asunto, hito } */
  var cargas = {};

  function cargarScript(ruta, global) {
    if (window[global]) return Promise.resolve(window[global]);
    if (cargas[ruta]) return cargas[ruta];
    cargas[ruta] = new Promise(function (resolver, rechazar) {
      var s = document.createElement('script');
      s.src = ruta;
      s.onload = function () { resolver(window[global]); };
      s.onerror = function () { delete cargas[ruta]; rechazar(new Error('No se ha podido cargar ' + ruta + '.')); };
      document.head.appendChild(s);
    });
    return cargas[ruta];
  }

  async function librerias() {
    await cargarScript('js/lib/jszip.min.js', 'JSZip');
    return cargarScript('js/lib/docx-preview.min.js', 'docx');
  }

  function construir() {
    if (capa) return;
    capa = document.createElement('div');
    capa.id = 'word-visor';
    capa.className = 'word-visor oculto';
    capa.innerHTML =
      '<div class="word-visor-barra">' +
        '<span class="word-visor-nombre"></span>' +
        '<span class="word-visor-botones">' +
          '<button type="button" class="boton boton-principal word-visor-pdf">Guardar PDF</button>' +
          '<button type="button" class="boton word-visor-imprimir">Imprimir</button>' +
          '<button type="button" class="boton word-visor-cerrar">Cerrar</button>' +
        '</span>' +
      '</div>' +
      '<div class="word-visor-hoja"><p class="explica">Abriendo…</p></div>';
    document.body.appendChild(capa);
    capa.querySelector('.word-visor-cerrar').onclick = cerrar;
    capa.querySelector('.word-visor-imprimir').onclick = imprimir;
    capa.querySelector('.word-visor-pdf').onclick = function (ev) { guardarPdf(ev.currentTarget); };
  }

  async function abrir(op) {
    construir();
    var blob = op.blob;
    try { if (!blob && op.handle) blob = await op.handle.getFile(); }
    catch (e) { U.fallo('No he podido abrir el documento', e); return; }
    actual = { blob: blob, nombre: op.nombre || (blob && blob.name) || 'documento.docx', carpeta: op.carpeta || null,
               asunto: op.asunto || null, hito: op.hito || null };
    capa.querySelector('.word-visor-nombre').textContent = actual.nombre;
    capa.querySelector('.word-visor-pdf').disabled = !actual.carpeta;
    capa.querySelector('.word-visor-pdf').title = actual.carpeta ? '' : 'Ábrelo desde la ficha del asunto para guardar el PDF en su carpeta';
    var hoja = capa.querySelector('.word-visor-hoja');
    hoja.innerHTML = '<p class="explica">Abriendo…</p>';
    capa.classList.remove('oculto');
    document.body.classList.add('con-word-visor');
    try {
      var docx = await librerias();
      hoja.innerHTML = '';
      await docx.renderAsync(blob, hoja, null, {
        className: 'docx', inWrapper: true, ignoreWidth: false, ignoreHeight: false, breakPages: true,
        ignoreLastRenderedPageBreak: true, renderHeaders: true, renderFooters: true, useBase64URL: true
      });
    } catch (e) {
      hoja.innerHTML = '<p class="explica">No he podido enseñar este Word: ' + U.escapar(U.mensajeDeError(e)) + '</p>';
    }
  }

  function abierto() { return !!(capa && !capa.classList.contains('oculto')); }

  function cerrar() {
    if (!capa) return;
    capa.classList.add('oculto');
    document.body.classList.remove('con-word-visor');
    capa.querySelector('.word-visor-hoja').innerHTML = '';
    actual = null;
  }

  function cerrarSiAbierto() {
    if (!abierto()) return false;
    cerrar();
    return true;
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && abierto() && !document.querySelector('#capa:not(.oculto)')) { ev.stopPropagation(); cerrar(); }
  }, true);

  function imprimir() { window.print(); }

  function paginas() {
    var hoja = capa && capa.querySelector('.word-visor-hoja');
    return hoja ? Array.prototype.slice.call(hoja.querySelectorAll('section.docx')) : [];
  }

  function nombrePdf(nombre) { return String(nombre).replace(/\.docx?$/i, '') + '.pdf'; }

  /* Cada página, como imagen a 200 ppp, en un PDF con su tamaño en puntos. */
  async function hacerPdf() {
    var html2canvas = await cargarScript('js/lib/html2canvas.min.js', 'html2canvas');
    var PDFLib = await cargarScript('js/lib/pdf-lib.min.js', 'PDFLib');
    var pdf = await PDFLib.PDFDocument.create();
    var lista = paginas();
    if (!lista.length) throw new Error('El documento no tiene páginas que guardar.');
    for (var i = 0; i < lista.length; i++) {
      var el = lista[i];
      var lienzo = await html2canvas(el, { scale: PPP / 96, backgroundColor: '#ffffff', useCORS: true, logging: false });
      var bytes = await new Promise(function (r) { lienzo.toBlob(function (b) { r(b.arrayBuffer()); }, 'image/jpeg', 0.92); });
      var img = await pdf.embedJpg(await bytes);
      var ancho = el.offsetWidth * 0.75, alto = el.offsetHeight * 0.75;
      var pagina = pdf.addPage([ancho, alto]);
      pagina.drawImage(img, { x: 0, y: 0, width: ancho, height: alto });
    }
    return new Blob([await pdf.save()], { type: 'application/pdf' });
  }

  async function yaExiste(carpeta, nombre) {
    try { await carpeta.getFileHandle(nombre); return true; } catch (e) { return false; }
  }

  async function guardarPdf(boton) {
    if (!actual || !actual.carpeta) return;
    var nombre = nombrePdf(actual.nombre);
    var mismo = actual;
    if (await yaExiste(mismo.carpeta, nombre)) {
      var ok = await U.preguntar('Ya hay un PDF con ese nombre',
        '<p>En la carpeta ya está «' + U.escapar(nombre) + '». ¿Lo sustituyo por este?</p>', 'Sustituirlo');
      if (!ok) return;
    }
    try {
      await U.mientrasGuarda(boton, async function () {
        var blob = await hacerPdf();
        var h = await mismo.carpeta.getFileHandle(nombre, { create: true });
        var w = await h.createWritable();
        await w.write(blob);
        await w.close();
      });
    } catch (e) { U.fallo('No he podido guardar el PDF', e); return; }
    U.aviso('PDF guardado en la carpeta del asunto: ' + nombre, 'bueno');
    /* Fila 160: con su PDF, el Word pasa a «Versiones previas». */
    if (window.VersionesPrevias) await VersionesPrevias.ordenarTrasCambio(mismo.carpeta);
    if (mismo.asunto && window.FichaDocumentos && App.fichaAbierta && App.fichaAbierta() === mismo.asunto.nombre) {
      try { FichaDocumentos.pintar(mismo.asunto); } catch (e) { /* solo pintar */ }
    }
    try {
      if (mismo.asunto && window.Notas) await Notas.anadir(mismo.asunto, 'PDF guardado ' + nombre);
      if (mismo.asunto && mismo.hito && window.Hitos) {
        await Hitos.anadirDocumento(mismo.asunto.nombre, mismo.hito.id, nombre);
        await Hitos.anadirNota(mismo.asunto.nombre, mismo.hito.id, 'PDF guardado «' + nombre + '»');
        if (window.HitosPanel) HitosPanel.programarRepintado();
      }
    } catch (e) { U.accesorio('PDF guardado, pero no he podido apuntarlo', e); }
    /* Fila 173, punto 7: guardado ya el PDF, se vuelve a la mesa del
       hito sin tener que pulsar "Cerrar". Si algo principal ha fallado
       arriba, ya se ha salido antes con `return` y el visor sigue abierto. */
    cerrar();
  }

  return { abrir: abrir, cerrar: cerrar, cerrarSiAbierto: cerrarSiAbierto, abierto: abierto,
           nombrePdf: nombrePdf, hacerPdf: hacerPdf };
})();
window.WordVisor = WordVisor;
