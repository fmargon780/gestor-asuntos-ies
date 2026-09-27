/* ============================================================
   vista.js — la pantalla de Inicio, ordenada.

   Los tres desplegables (estado, plazo y orden) viven plegados detrás
   del botón "Filtros". Sueltos en la barra se salían de línea y cada
   etiqueta acababa lejos de su campo.

   El tablón de notas ya no se esconde nunca (fila 191, decisión 4): el
   reflujo de "3 columnas + tablón abajo" cuando hay un panel a la
   derecha abierto (visor o lector) lo resuelve el CSS de css/inicio.css
   sobre las clases `con-visor`/`con-lector` que ya ponen js/visor.js y
   js/lector.js en <body>, sin código aquí.

   El ancho lo lleva css/vista.css, que mide la zona de trabajo y no la
   ventana: por eso vale igual con el panel de lectura abierto.
   ============================================================ */
(function () {

  var enganchado = false;

  function $(id) { return document.getElementById(id); }

  function recordar(clave, valor) {
    try { window.localStorage.setItem(clave, valor); } catch (e) {}
  }
  function recordado(clave) {
    try { return window.localStorage.getItem(clave); } catch (e) { return null; }
  }

  /* ---------- 1. los filtros ---------- */

  function hayFiltroPuesto() {
    var e = $('filtro-estado'), p = $('filtro-plazo'), o = $('filtro-organo'), t = $('filtro-tipo-asunto');
    return !!((e && e.value) || (p && p.value) || (o && o.value) || (t && t.value));
  }

  function pintarBotonFiltros() {
    var b = $('btn-filtros'), caja = $('filtros-abiertos');
    if (!b || !caja) return;
    var abierto = !caja.classList.contains('oculto');
    b.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    b.classList.toggle('tiene-filtros', hayFiltroPuesto());
    b.title = abierto ? 'Esconder los filtros' : 'Filtrar y ordenar la lista';
  }

  function engancharFiltros() {
    var b = $('btn-filtros'), caja = $('filtros-abiertos');
    if (!b || !caja) return;

    if (recordado('gestor-filtros') === 'abiertos') caja.classList.remove('oculto');

    b.onclick = function () {
      var abierto = caja.classList.toggle('oculto') === false;
      recordar('gestor-filtros', abierto ? 'abiertos' : 'plegados');
      pintarBotonFiltros();
    };

    ['filtro-estado', 'filtro-plazo', 'filtro-organo', 'filtro-tipo-asunto'].forEach(function (id) {
      if ($(id)) $(id).addEventListener('change', pintarBotonFiltros);
    });

    pintarBotonFiltros();
  }

  /* ---------- arranque ---------- */

  function enganchar() {
    if (enganchado) return;
    if (!$('pantalla-abiertos')) return;
    enganchado = true;
    engancharFiltros();
  }

  enganchar();
  if (!enganchado) document.addEventListener('DOMContentLoaded', enganchar);

})();
