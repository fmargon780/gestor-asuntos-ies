/* ============================================================
   ajustes-tipo-palabras-clave.js — la casilla de palabras clave de un
   tipo de asunto (17-sep-2026, fila 41, docs/LEER-DOCUMENTOS-POR-
   CLASIFICAR.md), en su pantalla propia (js/ajustes-tipo.js, fila 39).

   Una sola casilla de texto, palabras separadas por comas, con su
   propio botón "Guardar": mismo patrón que las demás secciones de esa
   pantalla (js/plantillas-ajustes.js, js/plantillas-documento.js,
   js/recurrentes.js), sacada aparte para no seguir engordando
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
      'Sin tildes ni mayúsculas, da igual.</p>' +
      '<button type="button" class="boton boton-principal" id="tipo-palabras-clave-guardar" ' +
      'style="margin-top:8px">Guardar palabras clave</button>';

    cuerpo.querySelector('#tipo-palabras-clave-guardar').onclick = async function () {
      var boton = cuerpo.querySelector('#tipo-palabras-clave-guardar');
      var lista = cuerpo.querySelector('#tipo-palabras-clave').value
        .split(',').map(function (p) { return p.trim(); }).filter(Boolean);
      await U.mientrasGuarda(boton, async function () {
        tipo.palabrasClave = lista;
        try {
          await App.guardarTipos();
          U.aviso('Palabras clave de ' + tipo.tipo + ' guardadas.', 'bueno');
        } catch (e) {
          U.aviso('No he podido guardarlas: ' + e.message, 'malo');
        }
      });
    };
  }

  return { pintarDeTipo: pintarDeTipo };
})();
