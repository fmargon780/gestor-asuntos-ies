/* ============================================================
   hitos-desde-el-asunto.js — crear, cambiar y borrar hitos desde la
   mesa de un asunto, sin salir a Ajustes (28-sep-2026, fila 206,
   docs/HITOS-DESDE-EL-ASUNTO.md).

   Dos cuadros, en el menú «Hito ▾» de la cabecera de la mesa
   (js/hito-mesa.js): «Cambiar» y «Borrar» (fila 660: «+ Añadir hito» es ahora
   js/anadir-hito.js, paso a paso). Desde la fila 660 a dónde va el cambio lo dice
   la marca «Los cambios en hitos y tareas van también a la guía» (js/marca-guia.js):
   encendida, el hito de la guía de su tipo cambia o se borra y llega a los asuntos
   abiertos donde el hito no está empezado (`estaVacio`, más abajo;
   js/hitos-sincronizar.js); en el propio asunto el cambio se aplica siempre; apagada,
   solo en este asunto. Sin tipo, o dentro de una pregunta, se guarda solo aquí. Ya no
   existen «Solo para este asunto» ni «Pasar a la guía». El aviso verde de después lleva
   «Deshacer» (js/hitos-desde-el-asunto-guia.js).

   Simplificación a propósito, como ya hace `Hitos.mover`
   ("complicaría las bifurcaciones sin que Francisco lo haya pedido"):
   «Colocar después de» solo ofrece los hitos de NIVEL SUPERIOR del
   asunto (nunca los de dentro de una rama de un hito-pregunta), y lo
   mismo para los pasos de la guía. Borrar un hito de dentro de una
   rama sigue funcionando (con `Hitos.quitarHito`, que ya sabe buscar a
   cualquier profundidad), pero solo «en este asunto»: la casilla de la
   guía no sale si el paso de origen está dentro de una opción.

   El plazo del cuadro es el mismo que el de la guía (días + cómo se
   cuentan + «desde» qué hito, js/guias-plazo.js): al guardar sin
   guía, se escribe igual en el propio hito (`Hitos.guardarCampos`,
   que gana el campo `plazo`), porque `Hitos.aplicarPlazosDependientes`
   ya sabe recalcular la fecha de cualquier hito, tenga guía o no.

   Se engancha como módulo aparte (`window.HitosDesdeElAsunto`), sin
   añadir nada a `window.Hitos`: no lo necesita ningún otro fichero.
   Carga después de js/hito-mesa.js, js/guias-enganche.js, js/guias.js,
   js/guias-plazo.js y js/responsable-organismo.js (los tres últimos,
   si existen).
   ============================================================ */
window.HitosDesdeElAsunto = (function () {
  var I = window.HitosDesdeElAsuntoNucleo;
  function $() { return I.$.apply(this, arguments); }
  function nivelSuperior() { return I.nivelSuperior.apply(this, arguments); }
  function sinTrabajo() { return I.sinTrabajo.apply(this, arguments); }
  function estaVacio() { return I.estaVacio.apply(this, arguments); }
  function colocarTrasAncla() { return I.colocarTrasAncla.apply(this, arguments); }
  function pasoAnclaDeHito() { return I.pasoAnclaDeHito.apply(this, arguments); }
  var SOLO_AQUI = I.SOLO_AQUI;
  function esSoloAqui() { return I.esSoloAqui.apply(this, arguments); }
  function marcaSoloAquiHTML() { return I.marcaSoloAquiHTML.apply(this, arguments); }
  function clavesAbiertasDelTipo() { return I.clavesAbiertasDelTipo.apply(this, arguments); }
  function propagarCambio() { return I.propagarCambio.apply(this, arguments); }
  function abrirCambiar() { return I.abrirCambiar.apply(this, arguments); }
  function abrirBorrar() { return I.abrirBorrar.apply(this, arguments); }

  return {
    estaVacio: estaVacio,
    sinTrabajo: sinTrabajo,
    clavesAbiertasDelTipo: clavesAbiertasDelTipo,
    nivelSuperior: nivelSuperior,
    colocarTrasAncla: colocarTrasAncla,
    propagarCambio: propagarCambio,   /* fila 299: lo usa js/informar-al-tutor.js */
    pasoAnclaDeHito: pasoAnclaDeHito,
    abrirCambiar: abrirCambiar,
    abrirBorrar: abrirBorrar,
    esSoloAqui: esSoloAqui,   /* fila 416 */
    marcaSoloAquiHTML: marcaSoloAquiHTML
  };
})();
