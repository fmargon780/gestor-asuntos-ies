/* ============================================================
   asunto-extracto-campo.js — un texto con campos variables y su «Así sale» (fila 627, docs/627-ASUNTO-Y-EXTRACTO.md).

   Lo usan los cuatro sitios donde se escribe un modelo de asunto o de extracto: la tarjeta «Asunto y extracto» de Ajustes
   (js/asunto-extracto-ajustes.js), el campo «Asunto» de una plantilla de correo o de Séneca (js/plantillas-ajustes.js y su
   editor en línea) y «Extracto de este tipo» de un tipo de documento.

       AsuntoExtractoCampo.html(id, { etiqueta, valor, varias, filas, placeholder })
       AsuntoExtractoCampo.enganchar(id, { unaLinea, ocultar, tipo, general, valores, deQuien, alCambiar })

   `html` devuelve el cuadro de texto (una línea, o varias con `varias`), su botón «+ Campo variable» y «Así sale».
   `enganchar` lo pone en marcha: `general()` es el modelo que sale si el campo está vacío (y `deQuien` lo dice en
   «Así sale»); `valores()` (opcional) da los valores de un asunto de verdad en vez del de muestra. `ocultar`: los campos
   que no se ofrecen (el asunto no lleva los del documento). `extra`: valores de muestra que cambian (el tipo de documento).
   ============================================================ */
var AsuntoExtractoCampo = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function $(id) { return document.getElementById(id); }

  function html(id, op) {
    op = op || {};
    var campo = op.varias
      ? '<textarea id="' + id + '" class="campo ae-modelo" rows="' + (op.filas || 3) + '" placeholder="' + esc(op.placeholder || '') + '">' + esc(op.valor) + '</textarea>'
      : '<input id="' + id + '" class="campo ae-modelo" type="text" placeholder="' + esc(op.placeholder || '') + '" value="' + esc(op.valor) + '">';
    return (op.etiqueta ? '<label class="etiqueta" for="' + id + '">' + esc(op.etiqueta) + '</label>' : '') +
      '<div class="ae-fila">' + campo +
        '<button type="button" class="boton boton-hueco ae-boton-campo" id="' + id + '-campo">+ Campo variable</button></div>' +
      '<div class="ae-sale nota" id="' + id + '-sale">Así sale: <b class="ae-resultado' + (op.varias ? ' ae-lineas' : '') + '"></b> <span class="ae-de"></span></div>';
  }

  function enganchar(id, op) {
    op = op || {};
    var campo = $(id);
    if (!campo) return null;
    var sale = $(id + '-sale');

    function pintar() {
      if (!sale || !sale.isConnected) return;
      var propio = campo.value.trim();
      var modelo = propio || (op.general ? op.general() : '');
      var vv = op.valores ? op.valores() : null;
      var texto = '';
      try { texto = AsuntoExtracto.asiSale(modelo, { unaLinea: !!op.unaLinea, valores: vv || null, extra: op.extra }); } catch (e) { texto = ''; }
      sale.querySelector('.ae-resultado').textContent = texto;
      sale.querySelector('.ae-de').textContent = op.deQuien ? (propio ? op.deQuien.propio : op.deQuien.general) : '';
      if (op.alCambiar) op.alCambiar(campo.value);
    }

    var boton = $(id + '-campo');
    if (boton && window.HuecosBuscador) {
      HuecosBuscador.montar({ boton: boton, campos: [campo], tipo: op.tipo, ocultar: op.ocultar });
    }
    campo.addEventListener('input', pintar);
    pintar();
    return { pintar: pintar, leer: function () { return campo.value; } };
  }

  return { html: html, enganchar: enganchar };
})();
window.AsuntoExtractoCampo = AsuntoExtractoCampo;
