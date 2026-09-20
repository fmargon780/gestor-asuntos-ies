/* ============================================================
   membrete-ajustes.js — el bloque "Membrete" de Ajustes → El centro
   (20-sep-2026, fila 81, docs/FIRMANTES-Y-MEMBRETE.md, parte 3).

   Sube la imagen (se guarda tal cual en _GESTOR/PLANTILLAS/membrete.png,
   la única vez que la aplicación escribe ahí), el nombre de la
   Consejería y la caja donde va escrito, y pinta una vista previa en
   vivo que se rehace al cambiar cualquiera de los seis valores.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  var CARPETA_PLANTILLAS = 'PLANTILLAS';
  var datos = null;
  var bitmapActual = null;

  function carpetaDePlantillas() {
    return Carpetas.crear(App.E.gestor, CARPETA_PLANTILLAS);
  }

  function cajaDeLosCampos() {
    return {
      x: parseFloat($('membrete-caja-x').value) || 0,
      y: parseFloat($('membrete-caja-y').value) || 0,
      ancho: parseFloat($('membrete-caja-ancho').value) || 0,
      alto: parseFloat($('membrete-caja-alto').value) || 0
    };
  }

  function pintarCamposDesdeAjustes() {
    if (!datos) return;
    $('plantillas-consejeria').value = datos.consejeria || '';
    var caja = datos.membreteCaja || Plantillas.CAJA_MEMBRETE_POR_DEFECTO;
    $('membrete-caja-x').value = caja.x;
    $('membrete-caja-y').value = caja.y;
    $('membrete-caja-ancho').value = caja.ancho;
    $('membrete-caja-alto').value = caja.alto;
  }

  /* ---------- la vista previa: la misma cuenta que Membrete.medir,
     dibujada en un <canvas> a tamaño de pantalla ---------- */

  async function cargarBitmapActual() {
    try {
      var carpeta = await carpetaDePlantillas();
      var handle = await carpeta.getFileHandle(Membrete.FICHERO_IMAGEN);
      var fichero = await handle.getFile();
      bitmapActual = await createImageBitmap(fichero);
      return true;
    } catch (e) {
      bitmapActual = null;
      return false;
    }
  }

  function pintarEstadoImagen(hayImagen) {
    $('membrete-estado-imagen').textContent = hayImagen
      ? 'Ya hay una imagen guardada. Sube otra para cambiarla.'
      : 'Todavía no hay ninguna imagen guardada.';
  }

  function pintarVistaPrevia() {
    var caja = $('membrete-vista-previa');
    if (!caja) return;
    caja.innerHTML = '';
    if (!bitmapActual) {
      caja.innerHTML = '<div class="vacio">Sube una imagen para ver la vista previa.</div>';
      return;
    }
    var canvas = document.createElement('canvas');
    var maximoAncho = 700;
    var escala = Math.min(1, maximoAncho / bitmapActual.width);
    canvas.width = bitmapActual.width;
    canvas.height = bitmapActual.height;
    canvas.style.width = Math.round(bitmapActual.width * escala) + 'px';
    canvas.style.border = '1px solid var(--borde, #ccc)';
    var ctx = canvas.getContext('2d');
    ctx.drawImage(bitmapActual, 0, 0);

    var consejeria = $('plantillas-consejeria').value;
    if (consejeria) {
      var cajaCampos = cajaDeLosCampos();
      var resultado = Membrete.medir(consejeria, cajaCampos, bitmapActual.width, bitmapActual.height);
      ctx.fillStyle = '#1E1A1E';
      ctx.textBaseline = 'alphabetic';
      ctx.font = Math.round(resultado.tamano) + 'px Arial, Helvetica, sans-serif';
      var xPx = bitmapActual.width * (cajaCampos.x / 100);
      var yBasePx = bitmapActual.height * (cajaCampos.y / 100);
      if (resultado.lineas.length === 1) {
        ctx.fillText(resultado.lineas[0], xPx, yBasePx);
      } else {
        ctx.fillText(resultado.lineas[0], xPx, yBasePx - resultado.tamano * 0.6);
        ctx.fillText(resultado.lineas[1], xPx, yBasePx + resultado.tamano * 0.6);
      }
    }
    caja.appendChild(canvas);
  }

  async function refrescarVistaPrevia() {
    var hayImagen = await cargarBitmapActual();
    pintarEstadoImagen(hayImagen);
    pintarVistaPrevia();
  }

  /* ---------- subir la imagen ---------- */

  $('membrete-elegir-imagen').onchange = async function (ev) {
    var fichero = ev.target.files && ev.target.files[0];
    if (!fichero) return;
    try {
      var bytes = new Uint8Array(await fichero.arrayBuffer());
      var carpeta = await carpetaDePlantillas();
      await Carpetas.escribirBytes(carpeta, Membrete.FICHERO_IMAGEN, bytes, fichero.type || 'image/png');
      U.aviso('Imagen del membrete guardada.', 'bueno');
      await refrescarVistaPrevia();
    } catch (e) {
      U.aviso('No he podido guardar la imagen: ' + e.message, 'malo');
    }
    ev.target.value = '';
  };

  /* ---------- guardar el nombre de la Consejería y la caja ---------- */

  $('membrete-guardar').onclick = async function () {
    var consejeria = $('plantillas-consejeria').value.trim();
    var caja = cajaDeLosCampos();
    try {
      datos = await Plantillas.guardar(App.E.gestor, function (actual) {
        actual.consejeria = consejeria;
        actual.membreteCaja = caja;
        return actual;
      });
      U.aviso('Membrete guardado.', 'bueno');
      pintarVistaPrevia();
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + e.message, 'malo');
    }
  };

  ['membrete-caja-x', 'membrete-caja-y', 'membrete-caja-ancho', 'membrete-caja-alto'].forEach(function (id) {
    $(id).oninput = pintarVistaPrevia;
  });
  $('plantillas-consejeria').oninput = pintarVistaPrevia;

  async function pintar() {
    if (!App.E.gestor) return;
    datos = await Plantillas.cargar(App.E.gestor);
    pintarCamposDesdeAjustes();
    await refrescarVistaPrevia();
  }

  window.MembreteAjustes = { pintar: pintar };

})();
