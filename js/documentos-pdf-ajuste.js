/* ============================================================
   documentos-pdf-ajuste.js — lo que hace el cuadro de ponerle nombre a
   un PDF que entra (15-oct-2026, fila 349,
   docs/PDF-COMPRIMIR-Y-PASAR-A-A4.md):

   - Si sus hojas son claramente más grandes que un A4, una casilla ya
     marcada: «Pasarlas a A4» (con otros tamaños en el desplegable).
   - Si pesa más de 5 MB, lo comprime al guardar, sin preguntar.
   - Si lleva firma electrónica no se toca nada (se rompería la firma):
     solo las líneas en ámbar que lo dicen.

   Las cuentas están en js/pdf-margenes.js (tamaño) y js/pdf-comprimir.js
   (peso); aquí solo se pinta la casilla y se decide qué hacer al
   guardar. Solo para lo que entra (añadir un fichero, adjuntos de la
   bandeja, «Ver todo»): `Cambiar el nombre` de un documento de siempre
   no lo toca. Se carga justo detrás de js/documentos-guardar.js.
   ============================================================ */
var DocumentosPdf = (function () {

  function $(id) { return document.getElementById(id); }

  var TEXTO_FIRMA_PESO = 'Lleva firma electrónica: no se comprime para no romperla.';
  var TEXTO_FIRMA_HOJAS = 'Las hojas son más grandes que un A4, pero lleva firma electrónica y no se pueden cambiar.';

  function esPdf(fichero, nombre) {
    return !!window.PdfHerramientas && PdfHerramientas.esPdf(nombre, fichero && fichero.type);
  }

  /* Solo lo que entra: un fichero que se añade, o uno que llega a la carpeta para ponerle nombre. */
  function aplica(opciones, fichero) {
    if (!fichero || !window.PdfMargenes || !window.PdfComprimir) return false;
    if (opciones.modo !== 'anadir' && !opciones.ponerNombre) return false;
    return esPdf(fichero, opciones.nombreActual);
  }

  /* Mira el PDF: firma, peso y hojas. Si no se puede abrir, no se toca nada. */
  async function analizar(fichero) {
    var estado = { fichero: fichero, firmado: false, pesa: false, grandes: false, ilegible: false };
    try {
      var bytes = new Uint8Array(await fichero.arrayBuffer());
      estado.firmado = PdfMargenes.pareceFirmado(bytes);
      estado.pesa = bytes.length > PdfComprimir.UMBRAL;
      estado.grandes = (await PdfMargenes.hojasGrandes(bytes)).grandes;
    } catch (e) {
      estado.ilegible = true;
    }
    return estado;
  }

  function opcionesDeTamano() {
    return PdfMargenes.ORDEN_TAMANOS.map(function (clave) {
      return '<option value="' + clave + '">' + PdfMargenes.TAMANOS[clave].nombre + '</option>';
    }).join('');
  }

  function pintarEstado(estado) {
    var lugar = $('doc-pdf-ajuste');
    if (!lugar) return;
    var html = '';
    if (estado.firmado) {
      if (estado.pesa) html += '<p class="campo-aviso-ambar" id="doc-pdf-firma-peso">' + TEXTO_FIRMA_PESO + '</p>';
      if (estado.grandes) html += '<p class="campo-aviso-ambar" id="doc-pdf-firma-hojas">' + TEXTO_FIRMA_HOJAS + '</p>';
    } else if (estado.grandes) {
      html += '<div class="doc-pdf-a4">' +
        '<label class="interruptor interruptor-fila">' +
          '<input type="checkbox" id="doc-pdf-a4" checked>' +
          '<span>Las hojas son más grandes que un A4. Pasarlas a</span>' +
        '</label> ' +
        '<select id="doc-pdf-tamano" class="campo" style="width:auto;display:inline-block">' + opcionesDeTamano() + '</select>' +
      '</div>';
    }
    lugar.innerHTML = html;
  }

  /* Se llama al pintar el cuadro. El análisis corre aparte: el cuadro sale al momento y
     «Guardar» espera a que termine si hace falta. */
  function pintar(opciones, fichero) {
    opciones.pdfEstado = null;
    if (!aplica(opciones, fichero)) return;
    var marca = {};
    opciones.pdfEstado = marca;
    marca.listo = analizar(fichero).then(function (estado) {
      Object.assign(marca, estado);
      if (opciones.pdfEstado === marca) pintarEstado(marca);
      return marca;
    });
  }

  /* Al guardar. Devuelve { bytes, avisos }: `bytes` es el PDF ya tratado (o null si no hay
     nada que cambiar) y `avisos`, lo que hay que decir al terminar: [{ texto, clase }]. */
  async function tratar(opciones, boton) {
    var vacio = { bytes: null, avisos: [] };
    var estado = opciones.pdfEstado;
    if (!estado) return vacio;
    await estado.listo;
    if (estado.ilegible || estado.firmado) return vacio;
    var hacerA4 = estado.grandes && $('doc-pdf-a4') && $('doc-pdf-a4').checked;
    if (!hacerA4 && !estado.pesa) return vacio;

    var textoBoton = boton ? boton.textContent : '';
    var avisos = [];
    try {
      var bytes = new Uint8Array(await estado.fichero.arrayBuffer());
      var cambiado = false;
      var textos = [];
      if (hacerA4) {
        var tamano = $('doc-pdf-tamano') ? $('doc-pdf-tamano').value : 'A4';
        if (boton) boton.textContent = 'Preparando las hojas…';
        bytes = await PdfMargenes.pasarATamano(bytes, tamano);
        cambiado = true;
        textos.push('Hojas pasadas a ' + tamano);
      }
      if (bytes.length > PdfComprimir.UMBRAL) {
        if (boton) boton.textContent = 'Comprimiendo…';
        var r = await PdfComprimir.comprimir(bytes);
        if (r.comprimido) {
          bytes = r.bytes;
          cambiado = true;
          textos.push('Comprimido de ' + PdfComprimir.pesoLegible(r.antes) + ' a ' + PdfComprimir.pesoLegible(r.despues));
        } else {
          avisos.push({ clase: 'ambar', texto: 'No se ha podido bajar de 5 MB sin que se lea mal; se guarda como está (' +
            PdfComprimir.pesoLegible(r.antes) + ').' });
        }
      }
      if (textos.length) avisos.unshift({ clase: 'bueno', texto: textos.join('. ') + '.' });
      return { bytes: cambiado ? bytes : null, avisos: avisos };
    } catch (e) {
      return { bytes: null, avisos: [{ clase: 'ambar', texto: 'No he podido preparar el PDF (hojas o peso); se guarda como está.' }] };
    } finally {
      if (boton) boton.textContent = textoBoton;
    }
  }

  function avisar(tratado) {
    ((tratado && tratado.avisos) || []).forEach(function (a) { U.aviso(a.texto, a.clase); });
  }

  return { pintar: pintar, tratar: tratar, avisar: avisar, aplica: aplica, _pintarEstado: pintarEstado,
           TEXTO_FIRMA_PESO: TEXTO_FIRMA_PESO, TEXTO_FIRMA_HOJAS: TEXTO_FIRMA_HOJAS };
})();
window.DocumentosPdf = DocumentosPdf;
