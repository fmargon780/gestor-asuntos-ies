/* ============================================================
   hito-mesa-comunicar.js — el bloque "Comunicar" de la mesa del hito
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md, 5).

   Fila 555: ya no lleva casillas de destinatarios; a quién va lo dice la
   plantilla y se cambia en el propio correo. "Preparar correo" y
   "Mensaje de Séneca" abren los cuadros de siempre
   (`HitosComunicar.comunicar`) con los documentos del hito premarcados. "Pedir lo que falta", solo si falta algo.

   Desde la fila 145, todo esto va dentro del desplegable «Comunicar ▾» de
   la cabecera (js/hito-mesa.js). Lo llama js/hito-mesa-documentos.js con
   la mesa abierta.
   ============================================================ */
var HitoMesaComunicar = (function () {

  var turno = 0;

  async function pintar(fila, a, h) {
    var caja = fila.querySelector('.mesa-destinatarios');
    if (!caja || !h || h.clase === 'decision') return;
    var mio = ++turno;
    if (mio !== turno || !caja.isConnected) return;

    var falta = window.HitosRequisitos && HitosRequisitos.textoLoQueFalta ? HitosRequisitos.textoLoQueFalta(h, a) : '';
    /* Fila 164: arriba, los pasos pendientes con receta de comunicar. Fila 555: ya no hay casillas de destinatarios;
       a quién va lo dice la plantilla y se cambia en el propio correo. */
    caja.innerHTML = (window.HitoMesaRecetas ? HitoMesaRecetas.bloqueHTML(a, h, 'comunicar') : '') +
      '<div class="mesa-comunicar-botones">' +
        '<button type="button" class="boton boton-chico mesa-preparar-correo">Preparar correo</button>' +
        '<button type="button" class="boton boton-chico mesa-mensaje-seneca">Mensaje de Séneca</button>' +
      '</div>' +
      (falta ? '<button type="button" class="enlace mesa-pedir-falta">Pedir lo que falta</button>' : '');

    function adjuntos() {
      var marcadosDocs = window.HitoMesaDocumentos ? HitoMesaDocumentos.marcados(fila) : [];
      return marcadosDocs.length ? marcadosDocs : null;
    }

    caja.querySelector('.mesa-preparar-correo').onclick = function () {
      var op = {};
      var adj = adjuntos();
      if (adj) op.adjuntos = adj;
      HitosComunicar.comunicar(a, h, 'correo', op);
    };
    caja.querySelector('.mesa-mensaje-seneca').onclick = function () {
      HitosComunicar.comunicar(a, h, 'seneca', {});
    };
    if (window.HitoMesaRecetas) HitoMesaRecetas.enganchar(caja, a, h, 'comunicar', { lista: [] });
    var pedir = caja.querySelector('.mesa-pedir-falta');
    if (pedir && window.CorreoNucleo && CorreoNucleo.montarBotonComunicar) {
      CorreoNucleo.montarBotonComunicar(pedir, a, { loQueFalta: falta });
    }
  }

  return { pintar: pintar };
})();
window.HitoMesaComunicar = HitoMesaComunicar;
