/* ============================================================
   inicio-plegados.js — si el cuadro de avisos y el tablón de Inicio se
   dejaron plegados o abiertos (fila 353, docs/INICIO-MAS-COMPACTO.md).

   Se recuerda en cada ordenador: localStorage, clave
   `gestor.inicio.plegados`, nunca en _GESTOR. Vale { avisos: bool,
   tablon: bool } (true = plegado). La primera vez, los dos salen
   plegados. Sin localStorage (navegación privada, bloqueado) no se
   recuerda nada y se sigue pudiendo plegar y desplegar.

   También avisa a quien lo necesite de que hay que volver a medir la
   cabecera (CabeceraFija.remedir) y de las dos ocasiones en que se
   aplica la regla de apertura del tablón: al arrancar la app y al
   pulsar «Inicio» en el menú (`alEntrarEnInicio`).
   ============================================================ */
(function () {
  'use strict';

  var CLAVE = 'gestor.inicio.plegados';

  function leerTodo() {
    var v = { avisos: true, tablon: true };
    try {
      var g = JSON.parse(window.localStorage.getItem(CLAVE));
      if (g && typeof g.avisos === 'boolean') v.avisos = g.avisos;
      if (g && typeof g.tablon === 'boolean') v.tablon = g.tablon;
    } catch (e) { /* sin lo guardado, salen plegados */ }
    return v;
  }

  var enMemoria = leerTodo();   /* por si no hay localStorage: se recuerda hasta recargar */

  function estaPlegado(que) { return enMemoria[que] !== false; }

  function poner(que, plegado) {
    enMemoria = leerTodo();
    enMemoria[que] = !!plegado;
    try { window.localStorage.setItem(CLAVE, JSON.stringify(enMemoria)); } catch (e) { /* se queda en memoria */ }
  }

  /* Después de plegar o desplegar algo de la cabecera, su alto ya no es
     el que se midió: se tira la medida guardada y se vuelve a calcular. */
  function remedir() {
    if (window.CabeceraFija && CabeceraFija.remedir) CabeceraFija.remedir();
  }

  function alEntrarEnInicio() {
    if (window.TablonVista && TablonVista.reglaApertura) TablonVista.reglaApertura();
  }

  window.InicioPlegados = {
    estaPlegado: estaPlegado,
    poner: poner,
    remedir: remedir,
    alEntrarEnInicio: alEntrarEnInicio,
    _clave: CLAVE
  };
})();
