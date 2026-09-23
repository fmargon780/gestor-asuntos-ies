/* ============================================================
   cola-guardado.js — los guardados de _GESTOR, de uno en uno
   (23-sep-2026, fila 99, docs/GUARDAR-EN-FILA.md).

   Un guardado es "leer el fichero, cambiarlo, escribirlo". Si dos se
   lanzan a la vez sobre el mismo fichero (escribir una nota y pulsar
   enseguida el desplegable de estado), los dos leen antes de que
   escriba el otro, y gana el último: se pierde una nota o un estado.

   `ColaGuardado.poner(fichero, fn)` pone `fn` detrás del último
   guardado de ese mismo fichero (una cadena de promesas por fichero);
   ficheros distintos no se esperan entre sí. Lo usan
   App.guardarRegistroFresco (asuntos.json), Hitos.cambiar (hitos.json)
   y la fusión de copias en conflicto (js/conflictos.js).

   OJO: nunca se llama a `poner` del mismo fichero desde DENTRO de un
   `fn` que ya está en esa cola: esperaría a que termine él mismo.

   `ColaGuardado.ocupado(fn)` no pone en fila, solo cuenta: para los
   traslados de carpeta (archivar, reabrir, renombrar).

   `ColaGuardado.hayGuardado()` dice si hay algo de lo anterior en
   marcha. Mientras sea así, las tareas de segundo plano (presencia,
   vistazo a la carpeta, buscar conflictos) se saltan su pasada.

   Se carga antes que todo lo que escribe en disco.
   ============================================================ */
var ColaGuardado = (function () {

  var colas = {};
  var enMarcha = 0;

  function poner(fichero, fn) {
    enMarcha++;
    var previa = colas[fichero] || Promise.resolve();
    var esta = previa.then(function () { return fn(); });
    var fin = esta.then(function () {}, function () {}).then(function () {
      enMarcha--;
      if (colas[fichero] === fin) delete colas[fichero];
    });
    colas[fichero] = fin;
    return esta;
  }

  function ocupado(fn) {
    enMarcha++;
    var esta;
    try { esta = Promise.resolve(fn()); }
    catch (e) { esta = Promise.reject(e); }
    esta.then(function () {}, function () {}).then(function () { enMarcha--; });
    return esta;
  }

  function hayGuardado() { return enMarcha > 0; }

  return { poner: poner, ocupado: ocupado, hayGuardado: hayGuardado };
})();
window.ColaGuardado = ColaGuardado;
