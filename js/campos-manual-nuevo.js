/* ============================================================
   campos-manual-nuevo.js — el formulario de «Campo manual nuevo»
   (fila 528, docs/528-LISTA-DE-CAMPOS.md, punto 6 y 9).

   Lo usan la pantalla «Campos» de Ajustes y la ventana de elegir un
   campo de una plantilla. Se crea con nombre, grupo y clase de dato
   (texto, lista, fecha, importe, número); si es lista, sus opciones.
   «Cuándo se pide» NO se decide aquí: lo decide cada tipo de asunto.

   CamposManualNuevo.pintar(caja, { textoCrear, alCrear(propio), alCancelar() })
   guarda el campo en `campos.json` (Campos.guardarPropios) y avisa.
   ============================================================ */
var CamposManualNuevo = (function () {

  function opcionesHtml(valores, elegido) {
    return valores.map(function (v) {
      return '<option value="' + U.escapar(v.id) + '"' + (v.id === elegido ? ' selected' : '') + '>' + U.escapar(v.nombre) + '</option>';
    }).join('');
  }

  function validar(nombre, existentes) {
    var n = String(nombre || '').trim();
    if (!n) return 'Ponle un nombre.';
    if (/[{}:|]/.test(n)) return 'El nombre no puede llevar llaves, dos puntos ni barras.';
    var q = U.normalizar(n);
    if ((existentes || []).some(function (c) { return U.normalizar(c.nombre) === q; })) return 'Ya hay un campo con ese nombre.';
    return '';
  }

  function pintar(caja, ctx) {
    var grupos = CamposLista.GRUPOS.map(function (g) { return { id: g, nombre: g }; });
    var clases = CamposClases.CLASES.map(function (c) { return { id: c.id, nombre: c.nombre }; });
    caja.innerHTML =
      '<div class="campo-manual-nuevo">' +
      '<h3 class="campo-manual-titulo">Campo manual nuevo</h3>' +
      '<label class="etiqueta" for="cmn-nombre">Nombre</label>' +
      '<input id="cmn-nombre" class="campo" autocomplete="off">' +
      '<label class="etiqueta" for="cmn-grupo">Grupo</label>' +
      '<select id="cmn-grupo" class="campo">' + opcionesHtml(grupos, 'Asunto') + '</select>' +
      '<label class="etiqueta" for="cmn-clase">Clase de dato</label>' +
      '<select id="cmn-clase" class="campo">' + opcionesHtml(clases, 'texto') + '</select>' +
      '<div id="cmn-opciones-caja" class="oculto"><label class="etiqueta" for="cmn-opciones">Opciones, separadas por comas</label>' +
      '<input id="cmn-opciones" class="campo" autocomplete="off"></div>' +
      '<p class="suave pequeno">Cuándo se pide este dato no se decide aquí: se decide en cada tipo de asunto.</p>' +
      '<div id="cmn-error" class="aviso-ambar oculto" role="alert"></div>' +
      '<div class="fila-botones"><button type="button" class="boton principal" id="cmn-crear">' + U.escapar(ctx.textoCrear || 'Crear el campo') + '</button>' +
      '<button type="button" class="boton" id="cmn-cancelar">Cancelar</button></div></div>';

    function $(id) { return caja.querySelector('#' + id); }
    function error(t) { var e = $('cmn-error'); e.textContent = t || ''; e.classList.toggle('oculto', !t); }
    $('cmn-clase').onchange = function () { $('cmn-opciones-caja').classList.toggle('oculto', $('cmn-clase').value !== 'lista'); };
    $('cmn-cancelar').onclick = function () { caja.innerHTML = ''; if (ctx.alCancelar) ctx.alCancelar(); };
    $('cmn-crear').onclick = async function () {
      var existentes = ctx.existentes ? ctx.existentes() : [];
      var nombre = $('cmn-nombre').value.trim(), clase = $('cmn-clase').value;
      var valores = clase === 'lista' ? $('cmn-opciones').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
      var fallo = validar(nombre, existentes) || (clase === 'lista' && !valores.length ? 'Escribe al menos una opción para la lista.' : '');
      if (fallo) { error(fallo); return; }
      var nuevo = { id: 'p' + Date.now() + Math.floor(Math.random() * 1000), nombre: nombre, clase: clase, valores: valores, grupo: $('cmn-grupo').value };
      try {
        App.E.campos = await Campos.guardarPropios(App.E.gestor, function (propios) { return propios.concat([nuevo]); });
      } catch (e) { error('No he podido guardarlo: ' + U.mensajeDeError(e)); return; }
      U.aviso('Campo «' + nombre + '» creado.', 'bueno');
      caja.innerHTML = '';
      if (ctx.alCrear) ctx.alCrear(nuevo);
    };
    $('cmn-nombre').focus();
  }

  return { pintar: pintar, validar: validar };
})();
window.CamposManualNuevo = CamposManualNuevo;
