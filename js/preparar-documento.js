/* ============================================================
   preparar-documento.js — el cuadro de "Preparar el documento"
   (18-sep-2026, fila 57, docs/HUECO-PARA-SELLO-Y-FIRMA.md).

   Dos huecos: el sello de registro de Séneca (arriba) y la firma
   digital del director (abajo). La cuenta y el PDF nuevo los hace
   js/pdf-margenes.js, con pdf-lib; aquí solo se pinta el cuadro (con
   pdf.js, mismo patrón que js/pdf-separar-unir.js), se decide si hace
   falta de verdad, y se guarda con papelera.

   Mismo `contexto` que PdfSepararUnir.separar/unir/sacarPaginas (ver
   js/pdf-separar-unir.js): { modo: 'asunto' | 'suelto', dir, nombre,
   handle, asunto (solo en modo 'asunto'), alTerminar }. Así el botón
   se cuelga igual en la ficha de un asunto (js/ficha-documentos.js) y
   en Por clasificar (js/documentos-sueltos.js).
   ============================================================ */
var PrepararDocumento = (function () {

  function $(id) { return document.getElementById(id); }

  /* ---------- pdf.js, para la vista previa y la comprobación de bandas ----------
     Carga compartida con js/registro-lector.js y
     js/pdf-separar-unir.js: `App.cargarPdfJs()`, en
     js/cargar-fichero.js (fila 89 de docs/COLA.md), que en `http(s)`
     usa `import()` y en `file://` (la copia sin internet) dos
     `<script>` clásicos. */
  function cargarPdfJs() {
    return App.cargarPdfJs();
  }

  async function abrirConPdfJs(bytes) {
    var pdfjsLib = await cargarPdfJs();
    try { return await pdfjsLib.getDocument({ data: bytes.slice() }).promise; }
    catch (e) {
      var error = new Error('Este PDF no se puede abrir: puede que venga protegido o roto.');
      error.name = 'PdfIlegible';
      throw error;
    }
  }

  /* Pinta una página en `canvas`, a `anchoDeseado` píxeles de ancho
     (ya con el giro de la página aplicado: pdf.js lo hace solo).
     Devuelve la escala usada (píxeles por punto PDF). */
  async function renderizarEnCanvas(pagina, canvas, anchoDeseado) {
    var base = pagina.getViewport({ scale: 1 });
    var escala = anchoDeseado / base.width;
    var viewport = pagina.getViewport({ scale: escala });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
    return escala;
  }

  /* ---------- mirar si una banda tiene algo pintado ----------

     Un píxel cuenta como "hay algo" si su luminosidad está por debajo
     de 200 (sobre 255); una banda está ocupada si más del 0,3% de sus
     píxeles cuentan. */
  function bandaOcupada(datos, ancho, alto, y0, y1) {
    y0 = Math.max(0, Math.round(y0));
    y1 = Math.min(alto, Math.round(y1));
    if (y1 <= y0) return false;
    var total = 0, oscuros = 0;
    for (var y = y0; y < y1; y++) {
      for (var x = 0; x < ancho; x++) {
        var i = (y * ancho + x) * 4;
        var lum = 0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2];
        total++;
        if (lum < 200) oscuros++;
      }
    }
    return total > 0 && (oscuros / total) > 0.003;
  }

  /* true si las dos bandas están libres en TODAS las páginas, con los
     huecos que se piden. Se pinta en un lienzo aparte, sin engancharlo
     a la pantalla: solo hace falta para contar píxeles. */
  async function todoLibre(pdfDoc, huecoArribaCm, huecoAbajoCm) {
    var lienzo = document.createElement('canvas');
    for (var n = 1; n <= pdfDoc.numPages; n++) {
      var pagina = await pdfDoc.getPage(n);
      var escala = await renderizarEnCanvas(pagina, lienzo, 700);
      var datos = lienzo.getContext('2d').getImageData(0, 0, lienzo.width, lienzo.height).data;
      var pxArriba = huecoArribaCm * PdfMargenes.CM_EN_PT * escala;
      var pxAbajo = huecoAbajoCm * PdfMargenes.CM_EN_PT * escala;
      if (bandaOcupada(datos, lienzo.width, lienzo.height, 0, pxArriba)) return false;
      if (bandaOcupada(datos, lienzo.width, lienzo.height, lienzo.height - pxAbajo, lienzo.height)) return false;
    }
    return true;
  }

  /* ---------- qué lleva el tipo del asunto (o los valores de partida, sin tipo) ---------- */

  function tipoDelAsunto(contexto) {
    if (contexto.modo !== 'asunto' || !contexto.asunto || !window.App || !App.E.tipos) return null;
    return App.E.tipos.filter(function (t) { return t.tipo === contexto.asunto.tipo; })[0] || null;
  }

  function llevaSelloDePartida(contexto) {
    var tipo = tipoDelAsunto(contexto);
    return !tipo || tipo.llevaSello !== false;   /* por defecto, sí */
  }
  function llevaFirmaDePartida(contexto) {
    var tipo = tipoDelAsunto(contexto);
    return !!(tipo && tipo.llevaFirma);   /* por defecto, no */
  }

  /* ---------- la línea de texto llano del cuadro ---------- */

  function textoResumen(encaje, huecoArribaCm, huecoAbajoCm, paginas) {
    if (!encaje.cabe) {
      return 'El hueco que pides no cabe en esta hoja. Baja las medidas en Ajustes.';
    }
    var porc = Math.round(encaje.escala * 100);
    var partes = [];
    if (huecoArribaCm > 0) partes.push(huecoArribaCm + ' cm arriba');
    if (huecoAbajoCm > 0) partes.push(huecoAbajoCm + ' cm abajo');
    var bandas = partes.length
      ? 'quedará libre una banda de ' + partes.join(' y otra de ')
      : 'no se deja ninguna banda libre';
    return 'Se encogerá al ' + porc + ' % y ' + bandas + ', en ' + paginas +
      (paginas === 1 ? ' página' : ' páginas') + '.';
  }

  /* ---------- el cuadro entero ---------- */

  async function abrir(contexto) {
    var fichero;
    try { fichero = await contexto.handle.getFile(); }
    catch (e) { U.aviso('No he podido abrir el documento: ' + e.message, 'malo'); return; }
    var bytes = new Uint8Array(await fichero.arrayBuffer());

    if (PdfMargenes.pareceFirmado(bytes)) {
      var sigue = await U.preguntar('Ajustar tamaño: "' + contexto.nombre + '"',
        '<p class="explica">Este PDF ya está firmado digitalmente. Si le hago hueco ahora, la ' +
        'firma dejará de valer. Lo suyo es hacer el hueco antes de firmar. ¿Sigo de todas ' +
        'formas?</p>', 'Seguir de todas formas');
      if (!sigue) return;
    }

    var pdfDoc;
    try { pdfDoc = await abrirConPdfJs(bytes); }
    catch (e) { U.aviso(e.message, 'malo'); return; }

    var medidas = await App.margenesPdfLeer();
    var estado = {
      llevaSello: llevaSelloDePartida(contexto),
      llevaFirma: llevaFirmaDePartida(contexto)
    };
    function huecoArribaCm() { return estado.llevaSello ? medidas.arribaCm : 0; }
    function huecoAbajoCm() { return estado.llevaFirma ? medidas.abajoCm : 0; }

    var libre;
    try { libre = await todoLibre(pdfDoc, huecoArribaCm(), huecoAbajoCm()); }
    catch (e) { U.aviso('No he podido mirar el documento: ' + e.message, 'malo'); return; }
    if (libre) {
      U.aviso('Este documento ya tiene sitio para el sello y para la firma. No he tocado nada.', 'bueno');
      return;
    }

    var primera = await pdfDoc.getPage(1);
    var visibleBase = primera.getViewport({ scale: 1 });   /* ya con el giro aplicado */

    var cuerpo =
      '<div class="preparar-vista">' +
        '<canvas id="preparar-canvas"></canvas>' +
        '<div id="preparar-banda-arriba" class="preparar-banda preparar-banda-arriba oculto">sello de registro</div>' +
        '<div id="preparar-banda-abajo" class="preparar-banda preparar-banda-abajo oculto">firma</div>' +
      '</div>' +
      '<p class="explica" id="preparar-resumen"></p>' +
      '<label class="interruptor interruptor-fila">' +
        '<input type="checkbox" id="preparar-check-sello"' + (estado.llevaSello ? ' checked' : '') + '>' +
        '<span>Hueco para el sello de registro</span>' +
      '</label>' +
      '<label class="interruptor interruptor-fila">' +
        '<input type="checkbox" id="preparar-check-firma"' + (estado.llevaFirma ? ' checked' : '') + '>' +
        '<span>Hueco para la firma</span>' +
      '</label>';

    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-ancho');
    var promesa = U.preguntar('Ajustar tamaño: "' + contexto.nombre + '"', cuerpo, 'Preparar');

    var escalaPrevia = await renderizarEnCanvas(primera, $('preparar-canvas'), 500);

    function refrescar() {
      var encaje = PdfMargenes.calcularEncaje(visibleBase.width, visibleBase.height,
        huecoArribaCm() * PdfMargenes.CM_EN_PT, huecoAbajoCm() * PdfMargenes.CM_EN_PT);
      $('preparar-resumen').textContent = textoResumen(encaje, huecoArribaCm(), huecoAbajoCm(), pdfDoc.numPages);

      var pxArriba = huecoArribaCm() * PdfMargenes.CM_EN_PT * escalaPrevia;
      var pxAbajo = huecoAbajoCm() * PdfMargenes.CM_EN_PT * escalaPrevia;
      var bArriba = $('preparar-banda-arriba');
      var bAbajo = $('preparar-banda-abajo');
      bArriba.classList.toggle('oculto', pxArriba <= 0);
      bArriba.style.height = pxArriba + 'px';
      bAbajo.classList.toggle('oculto', pxAbajo <= 0);
      bAbajo.style.height = pxAbajo + 'px';
    }
    refrescar();

    $('preparar-check-sello').onchange = function () { estado.llevaSello = this.checked; refrescar(); };
    $('preparar-check-firma').onchange = function () { estado.llevaFirma = this.checked; refrescar(); };

    var ok = await promesa;
    cuadro.classList.remove('cuadro-ancho');
    if (!ok) return;

    var nuevoBytes;
    try { nuevoBytes = await PdfMargenes.conHueco(bytes, huecoArribaCm(), huecoAbajoCm()); }
    catch (e) { U.aviso(e.message, 'malo'); return; }

    await guardar(contexto, nuevoBytes);
  }

  /* ---------- guardar: primero a la papelera, luego el nuevo con el mismo nombre ---------- */

  async function guardar(contexto, bytes) {
    try {
      if (window.Papelera) {
        if (contexto.modo === 'asunto') await Papelera.mandarDocumentoDeAsunto(contexto.asunto, contexto.nombre);
        else await Papelera.mandarSuelto({ nombre: contexto.nombre });
      }
      await Carpetas.escribirBytes(contexto.dir, contexto.nombre, bytes, 'application/pdf');
      U.aviso('Documento preparado.', 'bueno');
      if (contexto.alTerminar) contexto.alTerminar();
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + e.message, 'malo');
    }
  }

  return { abrir: abrir };
})();
window.PrepararDocumento = PrepararDocumento;
