/* ============================================================
   reintentar-escritura.js — reintentar una escritura en disco que
   tropieza con Dropbox sincronizando (fila 90,
   docs/ARCHIVAR-SIN-AVISOS-FALSOS.md).

   Un InvalidStateError o un NoModificationAllowedError al escribir un
   fichero casi siempre es Dropbox sincronizando esa misma carpeta en
   ese instante, no un fallo de verdad: un intento un momento después
   casi siempre sale bien. Un solo sitio para esto, que usan
   Carpetas.escribirTexto y Carpetas.escribirBytes (así se arregla de
   una vez toda escritura de la aplicación: Copias.guardar, guardarJson
   y _ficha.json pasan todas por ahí). Cualquier otro error se lanza a
   la primera, sin esperar ni reintentar.

   Se carga antes que js/carpetas.js en index.html.
   ============================================================ */
var Reintentar = (function () {

  /* Un intento normal, más tres reintentos si hace falta, con estas
     esperas por delante de cada uno. Si el tercer reintento también
     falla, se lanza el error tal cual. */
  var ESPERAS_MS = [500, 1000, 2000];

  function esperar(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function esErrorDeSincronizacion(e) {
    var nombre = e && e.name;
    return nombre === 'InvalidStateError' || nombre === 'NoModificationAllowedError';
  }

  /* `intento` es una función que hace la escritura ENTERA, desde pedir
     el manejador del fichero: así cada reintento pide uno nuevo, en
     vez de reutilizar uno que ya ha dejado de servir. */
  async function escritura(intento) {
    for (var i = 0; i <= ESPERAS_MS.length; i++) {
      try {
        return await intento();
      } catch (e) {
        if (!esErrorDeSincronizacion(e) || i === ESPERAS_MS.length) throw e;
        await esperar(ESPERAS_MS[i]);
      }
    }
  }

  return { escritura: escritura, esErrorDeSincronizacion: esErrorDeSincronizacion };
})();
window.Reintentar = Reintentar;
