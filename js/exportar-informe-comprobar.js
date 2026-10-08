/* ============================================================
   exportar-informe-comprobar.js — la cuenta del informe en PDF antes de
   guardarlo o imprimirlo (fila 307, docs/INFORME-EN-PDF-QUE-PIERDE-ASUNTOS.md,
   sección 4). Función pura sobre las páginas ya montadas: mide lo que se ve
   y lo compara con lo que debería verse. Con el informe bien hecho, nunca
   avisa; es una red por si el reparto de páginas falla otra vez.
   ============================================================ */
var ExportarComprobar = (function () {

  /* `paginas`: las `section.exportar-pagina` ya pintadas (y a la vista).
     Devuelve { esperados, visibles, paginasQueDesbordan, completo }. */
  function comprobar(paginas, esperados) {
    var visibles = 0, desbordan = 0;
    paginas.forEach(function (p) {
      var estilo = getComputedStyle(p), caja = p.getBoundingClientRect();
      var limite = caja.bottom - parseFloat(estilo.paddingBottom) + 0.5;
      var cont = p.querySelector('.exportar-contenido');
      if (cont && cont.getBoundingClientRect().bottom > limite) desbordan++;
      Array.prototype.forEach.call(p.querySelectorAll('tr.exportar-fila'), function (f) {
        if (f.getBoundingClientRect().bottom <= limite) visibles++;
      });
    });
    return { esperados: esperados, visibles: visibles, paginasQueDesbordan: desbordan,
             completo: visibles === esperados && desbordan === 0 };
  }

  function textoDeAviso(r) {
    return 'Este listado no está completo: se ven ' + r.visibles + ' de ' + r.esperados +
      ' asuntos. No lo guardes ni lo imprimas; avisa con el botón «Soporte».';
  }

  return { comprobar: comprobar, textoDeAviso: textoDeAviso };
})();
window.ExportarComprobar = ExportarComprobar;
