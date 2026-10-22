/* ============================================================
   ficha-tarjetas-resumen.js — los números de las pestañas de la ficha
   (Registro, Otros asuntos, Personas), sacados de js/ficha-tarjetas.js
   (24-sep-2026, fila 114). Desde la fila 425 (22-oct-2026,
   docs/FICHA-VISTA-DE-TRABAJO.md) ya no hay tarjetas cerradas con
   resumen: solo queda la cuenta que acompaña a cada pestaña.

   `FichaTarjetasResumen.crear(c)` con c = { raiz, asunto } devuelve
   { todas }: rehace los números (solo si cambian). Se carga justo antes
   de js/ficha-tarjetas.js.
   ============================================================ */
var FichaTarjetasResumen = (function () {
  function $(id) { return document.getElementById(id); }

  function crear(c) {
    var raiz = c.raiz;

    function ponerCuenta(id, texto) {
      var r = raiz();
      var el = r && r.querySelector('.ficha-cuenta[data-cuenta-tarjeta="' + id + '"]');
      if (el && el.textContent !== texto) el.textContent = texto;
    }

    function cuentaNotas() {
      var a = c.asunto();
      var ficha = a && ((App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha);
      /* Fila 229: el registro del asunto (notas y lo automático de los hitos). */
      var notas = window.RegistroAsunto
        ? RegistroAsunto.lineas({ nombre: a && a.nombre, ficha: ficha }) : ((ficha && ficha.notas) || []).slice().reverse();
      ponerCuenta('notas', notas.length ? String(notas.length) : '');
    }

    function cuentaLista(id, cajaId, selector) {
      var caja = $(cajaId);
      if (!caja) return;
      var filas = caja.querySelectorAll(selector).length;
      var total = caja.dataset.cuenta ? parseInt(caja.dataset.cuenta, 10) : filas;
      ponerCuenta(id, total ? String(total) : '');
    }

    function todas() {
      if (!raiz()) return;
      cuentaNotas();
      cuentaLista('otros', 'ficha-otros', '.otros-asunto');
      var tabla = $('ficha-relacionados');
      if (tabla && tabla.dataset.resumen) {   /* fila 293: la tabla «Personas del grupo» no lleva número */
        ponerCuenta('relacionados', '');
        return;
      }
      cuentaLista('relacionados', 'ficha-relacionados', '.relacionado-fila');
    }

    return { todas: todas };
  }

  return { crear: crear };
})();
window.FichaTarjetasResumen = FichaTarjetasResumen;
