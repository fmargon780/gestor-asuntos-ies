/* ============================================================
   nuevo-siguiente-hueco.js — «Nuevo asunto»: el cursor salta solo al
   siguiente hueco que falta (fila 489, docs/NUEVO-ASUNTO-MAS-COMODO.md).

   Se llama a mano, al final de los manejadores de una pulsación de la
   usuaria (elegir tipo, elegir persona, terminar un alta…), nunca desde
   App.elegirTipo / App.fijarTercero, que también los usan los caminos
   que rellenan el formulario solos (App.nuevoAsuntoCon).

   Orden: buscador de persona · «Buscar tipo» · primera casilla vacía de
   «Datos del asunto» · botón «Crear el asunto». El destino se ilumina
   un instante (clase `salto-cursor`, css/nuevo-siguiente-hueco.css).
   ============================================================ */
(function () {
  function visible(el) { return !!el && el.offsetParent !== null; }

  function llevarA(el) {
    if (!visible(el)) return false;
    el.focus();
    el.classList.remove('salto-cursor');
    void el.offsetWidth;   /* reinicia la animación si ya la llevaba */
    el.classList.add('salto-cursor');
    setTimeout(function () { el.classList.remove('salto-cursor'); }, 1000);
    return true;
  }

  function cajaDeTipo() {
    var enLinea = document.getElementById('nuevo-tipo-buscar');
    if (visible(enLinea)) return enLinea;
    return document.getElementById('buscar-tipo');
  }

  App.irAlSiguienteHueco = function () {
    var pantalla = document.getElementById('pantalla-nuevo');
    if (!pantalla || pantalla.classList.contains('oculto')) return;
    var nuevo = App.E.nuevo;

    if (!nuevo.tercero) { llevarA(document.getElementById('buscar-tercero')); return; }
    if (!nuevo.tipo) { llevarA(cajaDeTipo()); return; }

    var vacio = (nuevo.configCampos || []).filter(function (item) {
      return item.entradaEl && !String(item.entradaEl.value || '').trim() && visible(item.entradaEl);
    })[0];
    if (vacio) { llevarA(vacio.entradaEl); return; }

    /* «Crear el asunto» está apagado mientras llega el número del asunto: se espera a que se encienda. */
    var intentos = 0;
    (function esperar() {
      var b = document.getElementById('btn-crear');
      if (b && !b.disabled) { llevarA(b); return; }
      if (++intentos < 25) setTimeout(esperar, 200);
    })();
  };
})();
