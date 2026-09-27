/* ============================================================
   ajustes-tipo-palabras-clave.js — la casilla de palabras clave de un
   tipo de asunto (17-sep-2026, fila 41, docs/LEER-DOCUMENTOS-POR-
   CLASIFICAR.md), en su pantalla propia (js/ajustes-tipo.js, fila 39).

   Una sola casilla de texto, palabras separadas por comas. Fila 198,
   apartado 2: se guarda sola al cambiar (como "Datos del tipo" y
   "Plazo"), sin botón; sacada aparte para no seguir engordando
   js/ajustes-tipo.js.

   Se guarda como `palabrasClave` (lista de textos) dentro del propio
   tipo, en tipos.json: lo lee y lo pesa `js/lector-documentos.js` al
   proponer el tipo de un documento suelto. Los tipos que ya existen se
   quedan con la lista vacía; nadie tiene que rellenar nada para que
   siga funcionando (el nombre del tipo ya se busca solo).
   ============================================================ */
var PalabrasClaveTipo = (function () {

  function pintarDeTipo(cuerpo, tipo) {
    cuerpo.innerHTML =
      '<textarea id="tipo-palabras-clave" class="campo" rows="3" ' +
      'placeholder="Por ejemplo: matricula, escolarizacion, traslado">' +
      U.escapar((tipo.palabrasClave || []).join(', ')) + '</textarea>' +
      '<p class="nota">Palabras que aparecen en los documentos de este tipo. ' +
      'Sin tildes ni mayúsculas, da igual.</p>';

    cuerpo.querySelector('#tipo-palabras-clave').onchange = async function (ev) {
      var lista = ev.target.value.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
      tipo.palabrasClave = lista;
      try {
        await App.guardarTipos();
        U.aviso('Palabras clave de ' + tipo.tipo + ' guardadas.', 'bueno');
        if (window.AjustesPlegado) AjustesPlegado.resumirTipo();
      } catch (e) {
        U.aviso('No he podido guardarlas: ' + U.mensajeDeError(e), 'malo');
      }
    };
  }

  return { pintarDeTipo: pintarDeTipo };
})();
