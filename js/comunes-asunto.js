/* ============================================================
   comunes-asunto.js — lo que queda de la lista común dentro de un asunto: «Cambiar el hito» de un hito que viene de
   la lista de hitos (fila 531, docs/531-TAREAS-E-HITOS-COMUNES.md). Fila 660: «+ Añadir tarea» y «+ Añadir hito» ya
   no abren la ventana de la lista común: son js/anadir-tarea.js y js/anadir-hito.js, y a dónde va lo que se añade lo
   dice la marca de la guía (js/marca-guia.js).
   ============================================================ */
var ComunesAsunto = (function () {

  /* El hito común del que viene este hito del asunto (por el paso de la guía), o ''. */
  function hitoComunDe(a, h) {
    var p = (window.Hitos && Hitos.pasoDeGuia && h && h.origenGuia) ? Hitos.pasoDeGuia(a, h) : null;
    return (p && p.comun) || '';
  }

  function enganchar(caja, a, h) {
    var cambiar = caja.querySelector('.comunes-cambiar-hito');
    if (cambiar) cambiar.onclick = async function () {
      try {
        var listas = await ComunesGuardado.leer(), hc = Comunes.buscar(listas.hitos, hitoComunDe(a, h));
        if (!hc) { U.aviso('Este hito ya no está en la lista de hitos.', 'ambar'); return; }
        ComunesCambiar.hito(hc, { claveActual: a.nombre, asunto: a.nombre, hitoDelAsunto: h.id });
      } catch (e) { U.fallo('No he podido leer la lista', e); }
    };
  }

  return { hitoComunDe: hitoComunDe, enganchar: enganchar };
})();
window.ComunesAsunto = ComunesAsunto;
