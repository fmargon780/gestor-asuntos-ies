/* ============================================================
   demo/entrega.js — la entrega de las empresas al Centro de datos, en la
   copia de pruebas (fila 328, docs/ENTREGAR-EMPRESAS-AL-CENTRO-DE-DATOS.md,
   apartado 6).

     ?demo=1&auto=1&entregar=1     la carpeta del Centro de datos de
                                   mentira queda señalada, con permiso de
                                   leer y de escribir; su índice dice que
                                   recibe las empresas
     ...&recibe=0                  como `entregar=1`, pero el índice no
                                   trae `recibe` (lo pone js/demo/datos-centro-de-datos.js)
     ...&recibe=empresas           (fila 329) solo recibe las empresas
     ...&sinescribir=1             como `entregar=1`, pero sin permiso de
                                   escribir hasta que se pide («Dar
                                   permiso» / «Arreglarlo»)

   Cualquiera de los tres deja la carpeta señalada antes de entrar. Sin
   ellos este fichero no hace nada: la carpeta se señala a mano.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Demo) return;
  function hay(n) { return new RegExp('(?:^|[?&])' + n + '=([^&]*)').exec(location.search); }
  var entregar = !!hay('entregar'), recibe0 = !!hay('recibe'), sinEscribir = (hay('sinescribir') || [])[1] === '1';
  if (!entregar && !recibe0 && !sinEscribir) return;

  /* Con `sinescribir=1`, la «Comprobación al entrar» saca su panel sola (como con carpetas sin permiso). */
  var previa = window.Demo.permisosSimulados;
  window.Demo.permisosSimulados = function () { return (previa ? previa() : false) || sinEscribir; };

  /* Antes de entrar: deja recordada la carpeta de mentira, con o sin permiso de escribir. */
  window.Demo.prepararEntrega = async function (disco) {
    window.Demo.montando = true;   /* hasta que acabe de montarse (js/demo/datos.js) */
    var escribible = !sinEscribir;
    disco.centro.queryPermission = function (op) { return Promise.resolve(op && op.mode === 'readwrite' && !escribible ? 'prompt' : 'granted'); };
    disco.centro.requestPermission = function (op) { if (op && op.mode === 'readwrite') escribible = true; return Promise.resolve('granted'); };
    if (window.Demo.llenarCentro) await window.Demo.llenarCentro(disco.centro);
    await Almacen.guardar('centro-de-datos-carpeta', disco.centro);
  };
})();
