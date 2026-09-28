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

  /* ---------- 1. los filtros ---------- */

  /* Los cinco que cuenta "Filtros (N)" (fila 212, docs/INICIO-A-TODO-
     EL-ANCHO.md, apartado 4; Responsable sumado en la fila 216,
     docs/FILTROS-EN-TODAS-LAS-PESTANAS.md): los mismos que avisan con el
     punto azul (#btn-filtros.tiene-filtros, css/vista.css), y valen
     igual en las cuatro pestañas. */
  function filtrosPuestos() {
    var e = $('filtro-estado'), p = $('filtro-plazo'), o = $('filtro-organo'), t = $('filtro-tipo-asunto');
    var r = $('inicio-me-toca-responsable');
    return [e, p, o, t, r].filter(function (campo) { return campo && campo.value; }).length;
  }

  function pintarBotonFiltros() {
    var b = $('btn-filtros'), caja = $('filtros-abiertos');
    if (!b || !caja) return;
    var abierto = !caja.classList.contains('oculto');
    var n = filtrosPuestos();
    b.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    b.classList.toggle('tiene-filtros', n > 0);
    b.textContent = n ? 'Filtros (' + n + ')' : 'Filtros';
    b.title = abierto ? 'Esconder los filtros' : 'Filtrar y ordenar la lista';
  }

  /* Fila 212, apartado 4: el panel de "Filtros" empieza SIEMPRE cerrado
     al entrar en Inicio (antes se recordaba abierto de una vez para la
     siguiente, en `localStorage`: eso desaparece). */
  function engancharFiltros() {
    var b = $('btn-filtros'), caja = $('filtros-abiertos');
    if (!b || !caja) return;

    caja.classList.add('oculto');

    b.onclick = function () {
      var abierto = caja.classList.toggle('oculto') === false;
      pintarBotonFiltros();
    };

    ['filtro-estado', 'filtro-plazo', 'filtro-organo', 'filtro-tipo-asunto', 'inicio-me-toca-responsable'].forEach(function (id) {
      if ($(id)) $(id).addEventListener('change', pintarBotonFiltros);
    });

    pintarBotonFiltros();
  }

  /* Cierra el panel de "Filtros" (fila 212, apartado 4): lo llama
     js/nucleo.js (App.ir) cada vez que se entra en Inicio, no solo al
     cargar la página, para que empiece cerrado siempre que se entra,
     aunque se hubiera dejado abierto la vez anterior. */
  function cerrarFiltros() {
    var caja = $('filtros-abiertos');
    if (!caja) return;
    caja.classList.add('oculto');
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

  window.Vista = { cerrarFiltros: cerrarFiltros };

})();
