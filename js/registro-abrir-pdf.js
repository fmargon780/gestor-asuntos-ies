/* ============================================================
   registro-abrir-pdf.js — «Abrir el correo» y «Abrir el hilo» en la línea del Registro de un correo (14-nov-2026, fila 661,
   docs/661-BANDEJA-CON-HITO-Y-TAREA.md).

   La línea «Correo recibido de <quien>: «<asunto>»» lleva en su nota `abrir`: [{ texto, fichero }] (el PDF del correo, por el nombre
   con que entró) y [{ texto, hilo }] (el PDF del hilo: se busca el que haya en ese momento, porque cada respuesta lo sustituye).
   Lo pinta js/registro-asunto.js (`html`) y lo atiende un solo oyente de clics (`alPulsar`).
   ============================================================ */
window.RegistroAbrirPdf = (function () {

  /* Los botones de una línea del Registro (cadena vacía si no lleva ninguno). */
  function html(l) {
    var lista = (l && l.abrir) || [];
    if (!Array.isArray(lista) || !lista.length) return '';
    return '<div class="nota-botones">' + lista.map(function (b, i) {
      return '<button type="button" class="boton nota-boton" data-abrir-pdf="' + i + '">' + U.escapar(b.texto || 'Abrir') + '</button>';
    }).join('') + '</div>';
  }

  /* El PDF del hilo que hay ahora: el más reciente (la fecha va delante, AAMMDD). */
  function elDelHilo(nombres, trozo) {
    var cola = trozo ? ' ' + trozo + '.pdf' : '.pdf';
    return nombres.filter(function (n) { return /^\d{6} HILO/.test(n) && n.slice(6 + 5) === cola; }).sort().pop() || '';
  }

  async function abrir(asunto, accion) {
    var dir = await window.ElegirAsunto.carpetaDelAsunto(asunto, (window.App && App.E.registro.asuntos || {})[asunto] || {});
    var nombre = accion.fichero || '';
    if (accion.hilo !== undefined) {
      var lista = await Carpetas.ficheros(dir);
      nombre = elDelHilo(lista.map(function (f) { return f.nombre; }), accion.hilo);
    }
    if (!nombre) { U.aviso('Ese PDF ya no está en la carpeta del asunto.', 'ambar'); return; }
    var fichero = await (await dir.getFileHandle(nombre)).getFile();
    var url = URL.createObjectURL(fichero);
    window.open(url, '_blank');
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  document.addEventListener('click', async function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('[data-abrir-pdf]') : null;
    if (!b) return;
    var fila = b.closest('.registro-linea');
    var caja = b.closest('[data-clave]');
    var clave = caja && caja.dataset.clave;
    var a = window.FichaNucleo && FichaNucleo.actual;
    var asunto = clave || (a && a.nombre) || '';
    var nota = fila && window.RegistroAbrirPdf.lineas && window.RegistroAbrirPdf.lineas[fila.dataset.f];
    if (!asunto || !nota) return;
    try { await abrir(asunto, nota[Number(b.dataset.abrirPdf)] || {}); }
    catch (e) { U.aviso('No he podido abrir el PDF: ' + U.mensajeDeError(e), 'malo'); }
  });

  /* Por línea del Registro (su `data-f`), lo que abre cada botón: lo rellena `html`. */
  var lineas = {};
  function html2(l, clave) {
    var h = html(l);
    if (h) lineas[clave] = l.abrir;
    return h;
  }

  return { html: html2, lineas: lineas, elDelHilo: elDelHilo };
})();
