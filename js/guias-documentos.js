/* ============================================================
   guias-documentos.js — el catálogo de plantillas de documento
   (plantillas.json → documentos) para los hitos de la guía. 23-sep-2026,
   fila 102, docs/DOCUMENTOS-DESDE-EL-HITO.md.

   Hasta la fila 199 tenía también el bloque «Documentos de este hito»
   del editor (bloqueHTML/enganchar/leer): esa sección desapareció
   (docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md, apartado 4) — cada
   plantilla marcada se convierte, al abrir el editor, en una tarea del
   guion (`accion:'generar'`, js/guias-editor.js). Lo que queda aquí:
   `lineaHTML`, para la vista de solo lectura de la guía, y
   `catalogo`/`precargar` (el catálogo se lee UNA vez antes de abrir el
   cuadro, `precargar`, lo llaman js/guias-enganche.js y
   js/guias-biblioteca.js, nunca en cada tecla).
   ============================================================ */
window.GuiasDocumentos = (function () {

  function catalogo() {
    var datos = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
    return datos ? (datos.documentos || []) : null;
  }

  function precargar() {
    if (!window.Plantillas || !window.App || !App.E || !App.E.gestor) return Promise.resolve();
    return Plantillas.cargar(App.E.gestor).catch(function () {});
  }

  /* Para la vista de solo lectura de la guía: «Documentos: …». */
  function lineaHTML(ids) {
    var lista = catalogo();
    if (!ids || !ids.length || !lista) return '';
    var nombres = ids.map(function (id) {
      var d = lista.filter(function (x) { return x.id === id; })[0];
      return d ? (d.nombre || d.fichero) : '';
    }).filter(Boolean);
    if (!nombres.length) return '';
    return '<div class="paso-documentos-linea suave">Documentos: ' + U.escapar(nombres.join(', ')) + '</div>';
  }

  return { precargar: precargar, lineaHTML: lineaHTML };
})();
