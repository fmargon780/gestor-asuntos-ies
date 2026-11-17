/* ============================================================
   recorrido-tipo-ventana.js — la ventana «Recorrido» de un tipo de
   documento (17-nov-2026, fila 698, docs/698-RECORRIDO-DEL-TIPO-DE-DOCUMENTO.md,
   pantalla de prueba docs/pantallas/692.html).

   Se abre desde el ⋮ de cada tipo en Ajustes → El centro → Tipos de
   documento. Pregunta si el papel «Lo hacemos nosotros» o «Nos llega» y, según
   eso, quién lo firma, si se registra y si se envía (a quién y por dónde).
   Debajo, «Así saldrá en la tarea», que cambia al momento. Solo guarda el
   recorrido (js/recorrido-tipo.js); no cambia nada más de la app.
   ============================================================ */
var RecorridoTipoVentana = (function () {

  var esc = function (t) { return U.escapar(String(t)); };

  function opciones(lista, valor) {
    return lista.map(function (x) { return '<option' + (x === valor ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
  }

  function cuerpoHTML(tipo, r) {
    var vias = RecorridoTipo.vias();
    if (r.via && vias.indexOf(r.via) === -1) vias = [r.via].concat(vias);
    var campos = r.entra
      ? '<label class="etiqueta">Registro en Séneca</label>' +
        '<label class="rt-opcion"><input type="checkbox" id="rt-registro"' + (r.registro ? ' checked' : '') + '> Se registra de entrada</label>'
      : '<label class="etiqueta" for="rt-firma">Quién lo firma</label>' +
        '<select id="rt-firma" class="campo">' + opciones(RecorridoTipo.FIRMAS, r.firma) + '</select>' +
        '<label class="etiqueta">Registro en Séneca</label>' +
        '<label class="rt-opcion"><input type="checkbox" id="rt-registro"' + (r.registro ? ' checked' : '') + '> Se registra de salida</label>' +
        '<label class="etiqueta">Envío</label>' +
        '<label class="rt-opcion"><input type="checkbox" id="rt-envia"' + (r.envia ? ' checked' : '') + '> Se envía</label>' +
        (r.envia
          ? '<label class="etiqueta" for="rt-aquien">A quién</label>' +
            '<select id="rt-aquien" class="campo">' + opciones(RecorridoTipo.AQUIEN, r.aquien) + '</select>' +
            '<label class="etiqueta" for="rt-via">Por dónde</label>' +
            '<select id="rt-via" class="campo">' + opciones(vias, r.via) + '</select>'
          : '');
    return '<p class="explica">Se escribe una vez y vale para todos los documentos de este tipo, en todos los trámites.</p>' +
      '<label class="etiqueta">Este papel</label>' +
      '<label class="rt-opcion"><input type="radio" name="rt-entra" value="no"' + (r.entra ? '' : ' checked') + '> Lo hacemos nosotros</label> ' +
      '<label class="rt-opcion"><input type="radio" name="rt-entra" value="si"' + (r.entra ? ' checked' : '') + '> Nos llega</label>' +
      campos +
      '<div class="nota rt-vista" id="rt-vista"><b>Así saldrá en la tarea</b><br>' +
        '<span id="rt-pasos">' + RecorridoTipo.pasosDe(r).map(function (p) { return esc(p.t); }).join(' › ') + '</span><br>' +
        '<span id="rt-resumen">' + esc(RecorridoTipo.resumenDe(r)) + '.</span></div>';
  }

  /* Abre la ventana. Devuelve true si se ha guardado. */
  async function editar(tipo) {
    var r = RecorridoTipo.de(tipo);
    var vias = RecorridoTipo.vias();
    var promesa = U.preguntar('Recorrido: ' + tipo, '<div id="rt-cuerpo"></div>', 'Guardar');
    var cuerpo = document.getElementById('rt-cuerpo');

    function pintar() {
      cuerpo.innerHTML = cuerpoHTML(tipo, r);
      Array.prototype.forEach.call(document.getElementsByName('rt-entra'), function (x) {
        x.onchange = function () {
          r.entra = x.value === 'si';
          if (!r.entra) { r.firma = r.firma || 'Nadie'; r.aquien = r.aquien || RecorridoTipo.AQUIEN[0]; r.via = r.via || vias[0]; }
          pintar();
        };
      });
      function cambia(id, fn) { var x = document.getElementById(id); if (x) x.onchange = function () { fn(x); pintar(); }; }
      cambia('rt-registro', function (x) { r.registro = x.checked; });
      cambia('rt-firma', function (x) { r.firma = x.value; });
      cambia('rt-envia', function (x) { r.envia = x.checked; r.aquien = r.aquien || RecorridoTipo.AQUIEN[0]; r.via = r.via || vias[0]; });
      cambia('rt-aquien', function (x) { r.aquien = x.value; });
      cambia('rt-via', function (x) { r.via = x.value; });
    }
    pintar();

    if (!await promesa) return false;
    try { await RecorridoTipo.poner(tipo, r); }
    catch (e) { U.fallo('No he podido guardar el recorrido', e); return false; }
    U.aviso('Recorrido guardado.', 'bueno');
    if (App.pintarTiposDeDocumento) App.pintarTiposDeDocumento();
    return true;
  }

  return { editar: editar };
})();
window.RecorridoTipoVentana = RecorridoTipoVentana;
