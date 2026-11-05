/* ============================================================
   guias-editor-abrir.js — trozo de js/guias-editor.js (fila 531: ese fichero
   pasaba de 400 líneas; mismo código, solo cambia de fichero): lo que se
   engancha al abrir el editor de la guía, ya pintado: el mapa, «ir a un hito» y
   «abrir una tarea» (desde «Abrir en la guía»). Aquí cuelgan también las
   listas comunes de tareas y de hitos (js/comunes-guia.js).

   `ctx`: { plegado, niveles, pintar, recoger, pasos, opciones, nivel() }.
   Se carga antes de js/guias-editor.js.
   ============================================================ */
window.GuiasEditorAbrir = (function () {
  function $(id) { return document.getElementById(id); }

  function enganchar(ctx) {
    var plegado = ctx.plegado, niveles = ctx.niveles, pintar = ctx.pintar, recoger = ctx.recoger, pasos = ctx.pasos, opciones = ctx.opciones;
    if (window.ComunesGuia) ComunesGuia.alAbrir(ctx);   /* fila 531: las listas comunes de tareas y de hitos */
    /* El mapa (fila 113): panel dentro del mismo cuadro, dibujado con lo
     que hay en pantalla; pulsar un hito lleva a él. */
  if (window.GuiasMapa && $('guia-ver-mapa')) {
    $('guia-ver-mapa').onclick = function () {
      recoger();
      GuiasMapa.pintarEnPanel($('guia-mapa-panel'), pasos, irAPaso);
    };
  }
  /* Desde el mapa, el hito al que se va sale abierto (fila 122). */
  function irAPaso(id) {
    plegado.abrirAlLlegar(id);
    var ok = niveles.irAPaso(id);
    plegado.abrirAlLlegar(null);
    return ok;
  }
  if (opciones && opciones.irA) irAPaso(opciones.irA);
  /* Fila 464, B6: la tarea que se pide sale abierta, resaltada y a la vista. */
  if (opciones && opciones.tarea && window.GuiasGuion) {
    GuiasGuion.abrirTarea(opciones.tarea);
    pintar();
    var fTarea = document.querySelector('#guia-pasos .guion-fila[data-id="' + opciones.tarea + '"]');
    if (fTarea) {
      fTarea.classList.add('guion-fila-resaltada');
      if (fTarea.scrollIntoView) fTarea.scrollIntoView({ block: 'center' });
    }
  }

  }

  return { enganchar: enganchar };
})();
