/* ============================================================
   almacen.js — lo que recuerda el navegador de ESTE ordenador.

   Guarda el permiso sobre las dos carpetas y el nombre del usuario.
   No guarda ningún dato de asuntos ni de personas: eso vive en las
   carpetas del centro.
   ============================================================ */
var Almacen = (function () {

  var BASE = 'gestor-asuntos';
  var TIENDA = 'ajustes';

  function abrir() {
    return new Promise(function (resolver, fallar) {
      var p = indexedDB.open(BASE, 1);
      p.onupgradeneeded = function () {
        if (!p.result.objectStoreNames.contains(TIENDA)) p.result.createObjectStore(TIENDA);
      };
      p.onsuccess = function () { resolver(p.result); };
      p.onerror = function () { fallar(p.error); };
    });
  }

  function guardar(clave, valor) {
    return abrir().then(function (bd) {
      return new Promise(function (resolver, fallar) {
        var t = bd.transaction(TIENDA, 'readwrite');
        t.objectStore(TIENDA).put(valor, clave);
        t.oncomplete = function () { resolver(true); };
        t.onerror = function () { fallar(t.error); };
      });
    });
  }

  function leer(clave) {
    return abrir().then(function (bd) {
      return new Promise(function (resolver, fallar) {
        var t = bd.transaction(TIENDA, 'readonly');
        var p = t.objectStore(TIENDA).get(clave);
        p.onsuccess = function () { resolver(p.result); };
        p.onerror = function () { fallar(p.error); };
      });
    });
  }

  function borrar(clave) {
    return abrir().then(function (bd) {
      return new Promise(function (resolver) {
        var t = bd.transaction(TIENDA, 'readwrite');
        t.objectStore(TIENDA).delete(clave);
        t.oncomplete = function () { resolver(true); };
      });
    });
  }

  return { guardar: guardar, leer: leer, borrar: borrar };
})();
