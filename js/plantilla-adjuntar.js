/* ============================================================
   plantilla-adjuntar.js — el desplegable «Adjuntar solo» del editor de
   una plantilla de correo (7-oct-2026, fila 299,
   docs/CORREO-AL-TUTOR-DEL-GRUPO.md, apartado 1.5).

   «Nada» y los tipos de documento del centro. Se guarda en la plantilla
   como `adjuntar` (el nombre del tipo de documento); lo usa
   js/correo-adjunto-plantilla.js al abrir el cuadro de Correo. Lo
   llaman los dos editores de js/plantillas-ajustes.js.
   ============================================================ */
var PlantillaAdjuntar = (function () {

  function tipos(actual) {
    var lista = ((window.App && App.E && App.E.tiposDocumento) || []).slice();
    /* El que ya tenga la plantilla sale aunque el centro ya no lo tenga, para no perderlo al guardar. */
    if (actual && !lista.some(function (t) { return U.normalizar(t) === U.normalizar(actual); })) lista.push(actual);
    return lista;
  }

  function selectHTML(id, actual) {
    return '<label class="etiqueta">Adjuntar solo</label>' +
      '<select id="' + id + '" class="campo"><option value="">Nada</option>' +
      tipos(actual).map(function (t) {
        return '<option value="' + U.escapar(t) + '"' + (t === actual ? ' selected' : '') + '>' + U.escapar(t) + '</option>';
      }).join('') + '</select>' +
      '<p class="nota">Al preparar el correo con esta plantilla, se marca solo el documento más reciente de ese tipo.</p>';
  }

  function leer(id) {
    var s = document.getElementById(id);
    return s ? s.value : '';
  }

  return { selectHTML: selectHTML, leer: leer };
})();
window.PlantillaAdjuntar = PlantillaAdjuntar;
