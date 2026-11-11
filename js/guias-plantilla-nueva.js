/* ============================================================
   guias-plantilla-nueva.js — «+ Nueva plantilla…» en «Plantilla de correo» y
   «Plantilla de documento» de una tarea del editor de la guía (fila 615,
   docs/615-LISTAS-EDITABLES.md).

   Como «Ver y cambiar el texto» (js/guias-plantilla.js), no abre un cuadro nuevo
   (cerraría la guía): la columna derecha enseña el editor de plantillas de
   siempre —el de correo (`PlantillasAjustes`) o el de Word (`PlantillasDocumento`)—,
   ya con el tipo de la guía, con «← Volver a la guía». «Guardar la plantilla» la
   guarda y vuelve a la tarea, repintada, con la plantilla nueva elegida. Si el
   nombre se parece a una plantilla de esa misma lista, sale antes el aviso de
   js/lista-nuevo.js con «Usar».

   `enganchar({ col, pasos, tipo, alGuardar })`: lo llama GuiasPlantilla.enganchar.
   ============================================================ */
var GuiasPlantillaNueva = (function () {
  var LN = window.ListaNuevo;
  var abrirLaNueva = null;

  function $(id) { return document.getElementById(id); }

  function tipoDe(nombre) {
    return ((window.App && App.E && App.E.tipos) || []).filter(function (t) { return t.tipo === nombre; })[0] || null;
  }

  function lista(clase) {
    var d = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
    return (d && d[clase]) || [];
  }

  function textoDe(p) { return p.nombre + (p.tipo ? ' (' + p.tipo + ')' : ''); }

  /* Deja la plantilla `p` en el desplegable y elegida (la guía se repinta después con lo escrito). */
  function elegirEn(select, p) {
    var op = LN.ponerOpcion(select, p.id, textoDe(p));
    select.value = op.value;
  }

  function enganchar(o) {
    var col = o.col;
    var panel = col && col.querySelector('#guia-plantilla-panel');
    if (!panel || !o.pasos) return;

    async function abrir(select) {
      var clase = select.dataset.clase === 'documentos' ? 'documentos' : 'lista';
      var esDoc = clase === 'documentos';
      try { await PlantillasAjustes.cargar(); } catch (e) { /* se sigue con lo que haya en memoria */ }
      var preset = tipoDe(o.tipo);
      var doc = esDoc ? await PlantillasDocumento.prepararCuadroDoc(null, preset) : null;
      var scroll = col.scrollTop;
      var avisado = false;
      panel.innerHTML =
        '<div class="guia-plantilla-cab"><button type="button" class="boton" id="guia-plantilla-volver">← Volver a la guía</button>' +
        '<strong>' + (esDoc ? 'Nueva plantilla de documento' : 'Nueva plantilla de correo') + '</strong></div>' +
        (esDoc ? doc.cuerpo : PlantillasAjustes.cuerpoDelCuadroHTML(null, preset)) +
        '<div id="guia-plantilla-parecidos" class="ln-parecidos"></div>' +
        '<div class="correo-botones guia-plantilla-pie"><button type="button" class="boton boton-principal" id="guia-plantilla-guardar">Guardar la plantilla</button></div>';
      col.classList.add('con-plantilla');
      panel.classList.remove('oculto');
      col.scrollTop = 0;
      if (esDoc) doc.enganchar(); else PlantillasAjustes.engancharCuadro(null, preset);

      function cerrar() {
        panel.classList.add('oculto');
        panel.innerHTML = '';
        col.classList.remove('con-plantilla');
        col.scrollTop = scroll;
      }
      function terminar(p) {
        elegirEn(select, p);
        cerrar();
        if (typeof o.alGuardar === 'function') o.alGuardar();
      }
      var campoNombre = $(esDoc ? 'pd-nombre' : 'pl-nombre');
      if (campoNombre) campoNombre.addEventListener('input', function () { avisado = false; LN.quitarAviso($('guia-plantilla-parecidos')); });
      $('guia-plantilla-volver').onclick = cerrar;
      $('guia-plantilla-guardar').onclick = async function () {
        var nombre = campoNombre ? campoNombre.value.trim() : '';
        if (nombre && !avisado) {
          var existentes = lista(clase).filter(function (p) { return Plantillas.enUso(p); }).map(function (p) {
            return { valor: p.id, nombre: p.nombre, donde: 'las plantillas', usable: true, plantilla: p };
          });
          var cerca = LN.buscarParecidos(nombre, existentes);
          if (LN.mostrarAviso($('guia-plantilla-parecidos'), cerca, function (k) { terminar(k.plantilla); })) { avisado = true; return; }
        }
        var antes = lista(clase).map(function (p) { return p.id; });
        var ok = esDoc ? await doc.guardar() : await PlantillasAjustes.guardarCuadro(null);
        if (!ok) return;
        if (esDoc) { try { await PlantillasAjustes.cargar(); } catch (e) { /* se mira lo que haya */ } }
        var nueva = lista(clase).filter(function (p) { return antes.indexOf(p.id) === -1; })[0];
        if (!nueva) { cerrar(); return; }
        PlantillasAjustes.refrescarSeccion();   /* la tarjeta de la ficha del tipo, con la plantilla nueva */
        terminar(nueva);
      };
    }
    abrirLaNueva = abrir;
  }

  /* El desplegable del que se ha elegido «+ Nueva plantilla…». */
  function nueva(select) { return abrirLaNueva ? abrirLaNueva(select) : null; }

  if (window.ListaNuevo) LN.registrar('select.guion-receta-plantilla', nueva);

  return { enganchar: enganchar, nueva: nueva };
})();
window.GuiasPlantillaNueva = GuiasPlantillaNueva;
