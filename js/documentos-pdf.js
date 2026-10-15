/* ============================================================
   documentos-pdf.js — lo que el cuadro de ponerle nombre hace con un PDF
   (15-oct-2026, fila 349, docs/PDF-COMPRIMIR-Y-PASAR-A-A4.md): si sus
   hojas son más grandes que un A4, una casilla marcada «Pasarlas a A4»;
   y al guardarlo, si pesa más de 5 MB, comprimirlo.

   Solo cuando el documento entra en la carpeta (añadido desde el
   ordenador, soltado en un hito, traído de «Por clasificar» o de la
   bandeja de Gmail): cambiarle el nombre a uno ya guardado no lo toca,
   para eso está «Ajustar tamaño» del visor. Un PDF con firma electrónica
   no se toca nunca: solo se avisa. La cuenta y el PDF nuevo los hace
   js/pdf-comprimir.js. Se carga justo detrás de js/documentos-guardar.js.
   ============================================================ */
(function () {
  if (typeof Documentos === 'undefined' || !Documentos._interno) return;
  var N = Documentos._interno;

  function $(id) { return document.getElementById(id); }

  function aplica(opciones, fichero) {
    return !!fichero && !!window.PdfComprimir && !!window.PdfMargenes && (opciones.modo === 'anadir' || !!opciones.ponerNombre) &&
      PdfHerramientas.esPdf(opciones.nombreActual, fichero.type);
  }

  function marcador() { return '<div id="doc-pdf"></div>'; }

  function opcionesDeTamano() {
    return PdfComprimir.NOMBRES.map(function (n) { return '<option value="' + n + '">' + n + '</option>'; }).join('');
  }

  async function analizar(opciones, fichero) {
    var info = { bytes: null, firmado: false, grandes: false, pesado: false };
    info.bytes = new Uint8Array(await fichero.arrayBuffer());
    info.firmado = PdfMargenes.pareceFirmado(info.bytes);
    info.pesado = info.bytes.length > PdfComprimir.LIMITE_BYTES;
    try { info.grandes = await PdfComprimir.hayHojasGrandes(info.bytes); }
    catch (e) { info.grandes = false; }   /* si no se puede medir, el cuadro sale como siempre */
    var caja = $('doc-pdf');
    if (caja) {
      if (info.grandes && info.firmado) {
        caja.innerHTML = '<p class="campo-aviso-ambar" id="doc-pdf-firmado-hojas">Las hojas son más grandes que un A4, ' +
          'pero lleva firma electrónica y no se pueden cambiar.</p>';
      } else if (info.grandes) {
        caja.innerHTML = '<label class="interruptor"><input type="checkbox" id="doc-pdf-a4" checked>' +
          '<span>Las hojas son más grandes que un A4. Pasarlas a ' +
          '<select id="doc-pdf-tamano" class="campo" style="width:auto;display:inline-block">' + opcionesDeTamano() + '</select></span></label>';
      }
      if (info.pesado && info.firmado) {
        caja.innerHTML += '<p class="campo-aviso-ambar" id="doc-pdf-firmado-peso">Lleva firma electrónica: no se comprime para no romperla.</p>';
      }
    }
    return info;
  }

  function enganchar(opciones, fichero) {
    opciones.pdf = null;
    opciones.pdfListo = null;
    if (!aplica(opciones, fichero)) return;
    opciones.pdfListo = analizar(opciones, fichero).then(function (i) { opciones.pdf = i; return i; },
      function () { return null; });
  }

  /* Lo que hay que escribir al guardar: { bytes, aviso, clase } con
     `bytes` nulo si no hay nada que cambiar. Nunca falla: si algo no
     sale, se guarda el original y se dice en ámbar. */
  async function preparar(opciones) {
    var vacio = { bytes: null, aviso: '', clase: '' };
    if (!opciones.pdfListo) return vacio;
    var info = await opciones.pdfListo;
    if (!info) return vacio;
    var bytes = info.bytes, hecho = [], ambar = [], cambiado = false;
    if (info.firmado) {
      if (info.pesado) return { bytes: null, aviso: 'Lleva firma electrónica: no se comprime para no romperla.', clase: 'ambar' };
      return vacio;
    }
    var marca = $('doc-pdf-a4');
    if (info.grandes && marca && marca.checked) {
      var clave = $('doc-pdf-tamano').value;
      try {
        var r = await PdfComprimir.pasarATamano(bytes, clave);
        if (r.hojasCambiadas) { bytes = r.bytes; cambiado = true; hecho.push('Hojas pasadas a ' + clave + '.'); }
      } catch (e) { ambar.push('No he podido pasar las hojas a ' + clave + ': ' + U.mensajeDeError(e)); }
    }
    if (bytes.length > PdfComprimir.LIMITE_BYTES) {
      var boton = $('doc-guardar');
      if (boton) boton.textContent = 'Comprimiendo…';
      try {
        var c = await PdfComprimir.comprimir(bytes);
        if (c.logrado && c.cambiado) {
          hecho.push('Comprimido de ' + PdfComprimir.megas(c.antes) + ' a ' + PdfComprimir.megas(c.despues) + '.');
          bytes = c.bytes; cambiado = true;
        } else if (!c.logrado) {
          ambar.push('No se ha podido bajar de 5 MB sin que se lea mal; se guarda como está (' + PdfComprimir.megas(c.antes) + ').');
        }
      } catch (e2) { ambar.push('No he podido comprimirlo: ' + U.mensajeDeError(e2)); }
    }
    var texto = hecho.concat(ambar).join(' ');
    return { bytes: cambiado ? bytes : null, aviso: texto, clase: ambar.length ? 'ambar' : 'bueno' };
  }

  N.pdfMarcador = marcador;
  N.pdfEnganchar = enganchar;
  N.pdfPreparar = preparar;
  window.DocumentosPdf = { aplica: aplica, preparar: preparar };
})();
