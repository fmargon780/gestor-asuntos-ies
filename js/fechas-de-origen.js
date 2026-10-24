/* ============================================================
   fechas-de-origen.js — la fecha de modificación de antes del traslado
   a Google Drive (fila 458, docs/PASAR-A-DRIVE.md, paso 2).

   El navegador no puede conservar la fecha de modificación al copiar un
   fichero: cada fichero que «Pasar a Drive» copia queda con la hora de la
   copia. Para que no cambien fechas ni orden en la aplicación, el traslado
   guarda en `_GESTOR/fechas-de-dropbox.json` (en el destino) una entrada por
   fichero: la ruta (desde la raíz de «asuntos vivos» o del ARCHIVO), la fecha
   original (`f`), el tamaño (`t`) y la fecha que le puso la copia (`c`).

   Aquí se envuelve cada carpeta y fichero que sale de las carpetas señaladas
   para que `getFile()` devuelva el fichero con su fecha original, SOLO si
   está en la lista, su tamaño no ha cambiado y su fecha sigue siendo la de la
   copia (si alguien lo ha guardado después, vale la fecha real). Sin lista
   (la inmensa mayoría de las veces) no se envuelve nada.

   Claves de la lista: 'abiertos/<ruta>' y 'archivo/<ruta>' (dentro de
   'abiertos/' está '_GESTOR/…', porque `_GESTOR` cuelga de «asuntos vivos»).
   ============================================================ */
var FechasOrigen = (function () {
  'use strict';

  var FICHERO = 'fechas-de-dropbox.json';
  var HOLGURA_MS = 2000;   /* lo que puede moverse la fecha de la copia sin que cuente como cambio */
  var RAW = typeof Symbol === 'function' ? Symbol('fechas-crudo') : '__fechasCrudo';

  var lista = null;   /* { clave: { f, t, c } } o null si no hay traslado */

  function activa() { return !!lista && Object.keys(lista).length > 0; }

  async function cargar(gestor) {
    lista = null;
    try {
      var d = await Carpetas.leerJson(gestor, FICHERO);
      if (d && typeof d === 'object' && d.ficheros && typeof d.ficheros === 'object') lista = d.ficheros;
    } catch (e) { lista = null; }
    return activa();
  }

  function fijar(nueva) { lista = nueva || null; }

  function crudo(h) {
    var x = h && h[RAW];
    return x || h;
  }

  /* Si 'clave' tiene fecha original que aplicar al fichero 'f', la devuelve; si no, 0. */
  function fechaOriginal(clave, f) {
    var e = lista && lista[clave];
    if (!e || !f || e.t !== f.size) return 0;
    if (typeof e.c !== 'number' || typeof f.lastModified !== 'number') return 0;
    if (f.lastModified > e.c + HOLGURA_MS || f.lastModified < e.c - HOLGURA_MS) return 0;   /* tocado después de la copia */
    return e.f || 0;
  }

  function conFecha(f, clave) {
    var orig = fechaOriginal(clave, f);
    if (!orig) return f;
    try { return new File([f], f.name, { type: f.type, lastModified: orig }); } catch (e) { return f; }
  }

  /* h: manejador de carpeta (o fichero). prefijo: su ruta desde la raíz de la lista ('abiertos/', 'archivo/'). */
  function envolver(h, prefijo) {
    if (!activa() || !h || typeof h !== 'object' || h[RAW]) return h;
    var tipo = h.kind;
    if (tipo !== 'directory' && tipo !== 'file') return h;
    var base = prefijo || '';
    return new Proxy(h, {
      get: function (t, p) {
        if (p === RAW) return t;
        var v = t[p];
        if (typeof v !== 'function') return v;
        if (tipo === 'file' && p === 'getFile') {
          return function () { return t.getFile().then(function (f) { return conFecha(f, base.replace(/\/$/, '')); }); };
        }
        if (tipo === 'directory') {
          if (p === 'getDirectoryHandle') {
            return function (n, o) { return t.getDirectoryHandle(n, o).then(function (x) { return envolver(x, base + n + '/'); }); };
          }
          if (p === 'getFileHandle') {
            return function (n, o) { return t.getFileHandle(n, o).then(function (x) { return envolver(x, base + n); }); };
          }
          if (p === 'entries' || p === 'values') {
            return function () {
              var it = t.entries();
              var salida = {};
              salida[Symbol.asyncIterator] = function () { return salida; };
              salida.next = function () {
                return Promise.resolve(it.next()).then(function (r) {
                  if (r.done) return r;
                  var nombre = r.value[0], x = r.value[1];
                  var e = envolver(x, base + nombre + (x.kind === 'directory' ? '/' : ''));
                  return { done: false, value: p === 'entries' ? [nombre, e] : e };
                });
              };
              return salida;
            };
          }
        }
        return function () {
          var args = Array.prototype.map.call(arguments, crudo);
          return v.apply(t, args);
        };
      }
    });
  }

  return { FICHERO: FICHERO, cargar: cargar, fijar: fijar, activa: activa, envolver: envolver, crudo: crudo, fechaOriginal: fechaOriginal };
})();
window.FechasOrigen = FechasOrigen;
