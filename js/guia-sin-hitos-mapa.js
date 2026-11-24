/* ============================================================
   guia-sin-hitos-mapa.js — lo que el editor de la guía de un tipo «sin hitos» enseña además de la lista
   (fila 737, docs/737-GUIA-A-TODA-LA-PANTALLA.md):
     - el recorrido del papel de la tarea («Así saldrá en la tarea: Generado › Firmado…» y su resumen);
     - «Ver la guía para:», un desplegable por cada dato que usan los «Solo si», para mirar qué tareas
       saldrían en un asunto así (las demás, en gris y tachadas). Elegir un caso no se guarda.
   Lo escrito en las tareas (`g.soloSi`) lo pone el editor (js/guia-sin-hitos.js); aquí solo se lee.
   ============================================================ */
var GuiaSinHitosMapa = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  /* Debajo de «Papel»: los pasos y el resumen del recorrido del tipo de documento, o el aviso de que no lo tiene. '' sin papel. */
  function recorridoHTML(papel) {
    if (!papel || !window.RecorridoTipo) return '';
    if (!RecorridoTipo.tiene(papel)) {
      return '<div class="gsh-recorrido"><div class="gsh-rec-pasos">Este tipo de documento todavía no tiene recorrido.</div>' +
        '<div class="gsh-rec-resumen">Se pone en Ajustes › El centro › Tipos de documento › «Recorrido».</div></div>';
    }
    return '<div class="gsh-recorrido"><div>Así saldrá en la tarea: <span class="gsh-rec-pasos">' +
      RecorridoTipo.pasos(papel).map(function (p) { return esc(p.t); }).join(' › ') + '</span></div>' +
      '<div class="gsh-rec-resumen">' + esc(RecorridoTipo.resumen(papel)) + '</div></div>';
  }

  /* Las condiciones de una tarea con valores, la principal y las «además»: [{ campo, valores }]. */
  function condiciones(g) {
    var c = window.SoloSi && g && !g.rotulo ? SoloSi.normalizar(g.soloSi) : null;
    return c ? [{ campo: c.campo, valores: c.valores }].concat(c.ademas || []) : [];
  }

  /* Los datos que usan los «Solo si» de la guía, sin repetir y en el orden en que salen. */
  function datosUsados(tareas) {
    var usados = [];
    tareas.forEach(function (g) {
      condiciones(g).forEach(function (c) {
        if (!usados.some(function (u) { return U.normalizar(u) === U.normalizar(c.campo); })) usados.push(c.campo);
      });
    });
    return usados;
  }

  function valoresDe(campo) {
    var c = (window.GuiasCuando ? GuiasCuando.campos() : []).filter(function (x) { return U.normalizar(x.nombre) === U.normalizar(campo); })[0];
    var valores = c ? c.valores.slice() : [];
    return valores;
  }

  /* El valor elegido para un dato, buscado sin mirar mayúsculas ni tildes. */
  function elegidoDe(elegidos, campo) {
    var k = Object.keys(elegidos).filter(function (x) { return U.normalizar(x) === U.normalizar(campo); })[0];
    return k === undefined ? '' : elegidos[k];
  }

  /* La línea «Ver la guía para:». '' si ninguna tarea tiene «Solo si». Quita de `elegidos` los datos que ya no se usan. */
  function barraHTML(tareas, elegidos) {
    var usados = datosUsados(tareas);
    Object.keys(elegidos).forEach(function (k) {
      if (!usados.some(function (u) { return U.normalizar(u) === U.normalizar(k); })) delete elegidos[k];
    });
    if (!usados.length) return '';
    return '<span class="etiqueta">Ver la guía para:</span>' + usados.map(function (campo) {
      var actual = elegidoDe(elegidos, campo);
      var valores = valoresDe(campo);
      if (actual && valores.indexOf(actual) === -1) valores.push(actual);
      return '<label>' + esc(campo) + ' <select class="gsh-ver-dato" data-campo="' + esc(campo) + '"><option value="">Todos los casos</option>' +
        valores.map(function (v) { return '<option value="' + esc(v) + '"' + (v === actual ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('') +
        '</select></label>';
    }).join('');
  }

  /* ¿Sale esta tarea en un asunto con esos datos? Con un dato en «Todos los casos» (falta), esa condición no la quita. */
  function sale(g, elegidos) {
    if (!window.SoloSi || !g || g.rotulo) return true;
    var c = SoloSi.normalizar(g.soloSi);
    if (!c) return true;
    return SoloSi.estado(c, { campos: elegidos || {} }) !== 'quita';
  }

  return { recorridoHTML: recorridoHTML, barraHTML: barraHTML, sale: sale, datosUsados: datosUsados };
})();
window.GuiaSinHitosMapa = GuiaSinHitosMapa;
