/* ============================================================
   material-cuadros.js — lo común de los cuadros de «Material» (fila 750):
   un cuadro que no se cierra si lo que se escribió no vale, y los
   desplegables de valores en lista con «+ Nuevo valor…».
   Sobre `U.preguntar` (un solo cuadro a la vez, regla común .capa > .cuadro).
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }
  var esc = function (s) { return U.escapar(s); };

  /* Abre un cuadro. `alAbrir(cuerpo)` engancha lo suyo; `alAceptar()` (puede ser async) devuelve '' si todo
     vale (el cuadro se cierra con true) o el texto de lo que falta (el cuadro sigue abierto y lo dice en ámbar).
     Devuelve la promesa de `U.preguntar` (true al aceptar, false al cancelar o al abrir otro cuadro). */
  Material.cuadro = function (titulo, cuerpoHtml, textoAceptar, alAbrir, alAceptar) {
    var p = U.preguntar(titulo, cuerpoHtml, textoAceptar || 'Guardar');
    var boton = $('cuadro-aceptar');
    var cerrarDeVerdad = boton.onclick;
    var ocupado = false;
    boton.onclick = async function () {
      if (ocupado) return;
      ocupado = true;
      try {
        var falta = alAceptar ? await alAceptar() : '';
        if (falta) U.aviso(falta, 'ambar');
        else cerrarDeVerdad();
      } catch (e) {
        U.fallo('No he podido guardar', e);
      } finally { ocupado = false; }
    };
    if (alAbrir) alAbrir($('cuadro-cuerpo'));
    return p;
  };

  /* Cierra el cuadro como si se hubiera pulsado «Cancelar» (para volver a abrirlo con otra cosa). */
  Material.cancelarCuadro = function () { var c = $('cuadro-cancelar'); if (c && c.onclick) c.onclick(); };

  /* Un desplegable con «—», los valores y «+ Nuevo valor…», que abre al lado una casilla para escribirlo. */
  Material.listaHtml = function (atributos, valores, elegido) {
    var opciones = ['<option value="">—</option>'].concat((valores || []).map(function (v) {
      return '<option value="' + esc(v) + '"' + (v === elegido ? ' selected' : '') + '>' + esc(v) + '</option>';
    }), ['<option value="__nuevo">+ Nuevo valor…</option>']).join('');
    return '<span class="material-lista"><select class="campo" ' + atributos + '>' + opciones + '</select>' +
      '<input type="text" class="campo material-valor-nuevo oculto" placeholder="Escribe el valor nuevo" autocomplete="off"></span>';
  };

  Material.valorDeLista = function (sel) {
    return sel.value === '__nuevo' ? sel.nextElementSibling.value.trim() : sel.value;
  };

  Material.engancharLista = function (sel, alCambiar) {
    var nuevo = sel.nextElementSibling;
    sel.onchange = function () {
      nuevo.classList.toggle('oculto', sel.value !== '__nuevo');
      if (sel.value === '__nuevo') nuevo.focus();
      if (alCambiar) alCambiar();
    };
    nuevo.onchange = function () {
      var existentes = Array.prototype.map.call(sel.options, function (o) { return o.value; })
        .filter(function (v) { return v !== '' && v !== '__nuevo'; });
      var r = Material.resolverValor(existentes, nuevo.value);
      if (r.yaEstaba) {
        sel.value = r.valor;
        nuevo.value = '';
        nuevo.classList.add('oculto');
        U.aviso('Ya estaba en la lista: ' + r.valor + '. Elegido.');
      }
      if (alCambiar) alCambiar();
    };
    nuevo.oninput = function () { if (alCambiar) alCambiar(); };
  };
})();
