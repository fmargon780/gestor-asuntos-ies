/* ============================================================
   guias-plantilla.js — «Ver y cambiar el texto» de una plantilla de correo
   desde el editor de la guía (26-oct-2026, fila 465,
   docs/EDITOR-DE-LA-GUIA-CLARO.md, parte C, puntos C1 a C3).

   El botón sale junto a «Plantilla de correo» de una tarea «Comunicar» y junto
   a «Con la plantilla:» de «Al terminar este hito», solo con una plantilla
   elegida. Al pulsarlo, la columna derecha enseña el editor de plantillas de
   siempre (el de Ajustes → «Cambiar»: `PlantillasAjustes.cuerpoDelCuadroHTML`,
   `engancharCuadro` y `guardarCuadro`, un solo editor para los dos sitios), con
   «← Volver a la guía». La guía no se toca mientras tanto: su DOM sigue ahí,
   escondido, así que lo escrito no se pierde. «Guardar la plantilla» guarda en
   ese momento (aunque luego se cancele la guía) y vuelve a la guía repintada, en
   el mismo hito y con la misma tarea abierta.

   - `panelHTML()`: el hueco de la columna derecha, que se pone en el editor.
   - `enganchar({ col, pasos, alGuardar })`: engancha los botones del editor.
     `col` es la columna derecha, `pasos` el contenedor de los hitos y
     `alGuardar()` repinta la guía con lo que haya escrito.
   - `actualizarBoton(select)`: enseña o esconde el botón según haya plantilla
     elegida; lo llaman el propio `change` y el desplegable del aviso al cargar.
   ============================================================ */
var GuiasPlantilla = (function () {

  var BOTON = '<button type="button" class="boton guia-plantilla-ver' + '">Ver y cambiar el texto</button>';

  function botonHTML(oculto) {
    return oculto ? BOTON.replace('guia-plantilla-ver', 'guia-plantilla-ver oculto') : BOTON;
  }

  function panelHTML() {
    return '<div id="guia-plantilla-panel" class="guia-plantilla-panel oculto"></div>';
  }

  var SELECTS = 'select.guion-receta-plantilla, select.paso-avisar-lopide-select';

  function actualizarBoton(select) {
    var b = select && select.parentNode && select.closest('.guion-receta, .paso-avisar-lopide-plantilla')
      ? select.closest('.guion-receta, .paso-avisar-lopide-plantilla').querySelector('.guia-plantilla-ver') : null;
    if (b) b.classList.toggle('oculto', !select.value);
  }

  function enganchar(o) {
    var col = o.col;
    var panel = col && col.querySelector('#guia-plantilla-panel');
    if (!panel || !o.pasos) return;
    var scroll = 0;

    function cerrar() {
      panel.classList.add('oculto');
      panel.innerHTML = '';
      col.classList.remove('con-plantilla');
    }

    async function abrir(id) {
      try { await PlantillasAjustes.cargar(); } catch (e) { /* se sigue con lo que haya en memoria */ }
      var datos = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
      var existente = ((datos && datos.lista) || []).filter(function (p) { return p.id === id; })[0];
      if (!existente) { U.aviso('No encuentro esa plantilla.', 'malo'); return; }
      scroll = col.scrollTop;
      panel.innerHTML =
        '<div class="guia-plantilla-cab"><button type="button" class="boton" id="guia-plantilla-volver">← Volver a la guía</button>' +
        '<strong>Plantilla de correo</strong></div>' +
        PlantillasAjustes.cuerpoDelCuadroHTML(existente, null) +
        '<div class="correo-botones guia-plantilla-pie"><button type="button" class="boton boton-principal" id="guia-plantilla-guardar">Guardar la plantilla</button></div>';
      col.classList.add('con-plantilla');
      panel.classList.remove('oculto');
      col.scrollTop = 0;
      PlantillasAjustes.engancharCuadro(existente, null);
      function volver() { cerrar(); col.scrollTop = scroll; }
      document.getElementById('guia-plantilla-volver').onclick = volver;
      document.getElementById('guia-plantilla-guardar').onclick = async function () {
        if (!(await PlantillasAjustes.guardarCuadro(existente, null))) return;
        cerrar();
        PlantillasAjustes.refrescarSeccion();   /* la tarjeta de la ficha del tipo, con el texto nuevo */
        if (typeof o.alGuardar === 'function') o.alGuardar();
        col.scrollTop = scroll;
      };
    }

    o.pasos.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('.guia-plantilla-ver');
      if (!b) return;
      var sel = b.closest('.guion-receta, .paso-avisar-lopide-plantilla').querySelector(SELECTS);
      if (sel && sel.value) abrir(sel.value);
    });
    o.pasos.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t && t.matches && t.matches(SELECTS)) actualizarBoton(t);
    });
  }

  return { panelHTML: panelHTML, enganchar: enganchar, botonHTML: botonHTML, actualizarBoton: actualizarBoton };
})();
window.GuiasPlantilla = GuiasPlantilla;
