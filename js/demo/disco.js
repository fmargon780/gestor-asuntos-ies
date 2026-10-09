/* ============================================================
   demo/disco.js — el disco y el almacén de mentira de la copia de
   pruebas (fila 222, docs/COPIA-DE-PRUEBAS.md).

   Misma idea que `pruebas/navegador.mjs` (que la usa para probar la
   aplicación entera con Playwright), pero aquí vive DENTRO de la
   aplicación publicada, para que `pruebas.fmargon.com` funcione sin
   señalar ninguna carpeta de verdad: todo lo que `js/carpetas.js` y
   `js/almacen.js` esperan del navegador (showDirectoryPicker,
   showOpenFilePicker, indexedDB) se sustituye por algo en memoria.
   Nada se copia de `pruebas/navegador.mjs`: la interfaz es la misma
   porque las dos imitan la misma API del navegador, no porque una
   dependa de la otra.

   Solo se carga cuando `js/demo/arrancar.js` decide que esta visita es
   de pruebas: nunca en producción (`asuntos.fmargon.com`) ni en la
   copia sin internet.

   window.Demo:
     activar()   — crea el disco vacío (ASUNTOS ABIERTOS, ARCHIVO y la
                   bandeja de correos) y engancha las tres API del
                   navegador. Idempotente: si ya está activo, no hace
                   nada y devuelve lo que ya había.
     activo()    — true una vez llamado activar().
     disco()     — { abiertos, archivo, bandeja }, los tres manejadores
                   de carpeta de mentira (para que js/demo/datos.js
                   escriba el juego de datos directamente).
     ficheroDeMentira(nombre, texto, tipo) — un FileSystemFileHandle de
                   mentira suelto, para el "elegir desde el ordenador".
     reiniciar() — recarga la página con ?demo=1&auto=1: disco nuevo,
                   sin ningún rastro de lo que se hubiera hecho.
   ============================================================ */
(function () {
  'use strict';

  if (window.Demo) return; /* ya activado por esta misma carga de página */

  /* ---------- el disco: carpetas y ficheros en memoria ----------
     Misma forma que exige la File System Access API de verdad: basta
     con que `js/carpetas.js` no note la diferencia. */

  /* Fila 260: cuántas veces se ha escrito, borrado o creado algo en el disco de mentira
     (la prueba de «solo consultar» comprueba que sigue en 0). */
  var escrituras = 0;

  function dir(nombre) {
    var hijos = new Map();
    return {
      kind: 'directory',
      name: nombre,
      _hijos: hijos,
      queryPermission: function () { return Promise.resolve('granted'); },
      requestPermission: function () { return Promise.resolve('granted'); },
      getDirectoryHandle: function (n, o) {
        if (!hijos.has(n)) {
          if (!o || !o.create) { var e = new Error('no existe: ' + n); e.name = 'NotFoundError'; return Promise.reject(e); }
          escrituras++;
          hijos.set(n, dir(n));
        }
        var h = hijos.get(n);
        if (h.kind !== 'directory') { var e2 = new Error(n + ' no es una carpeta'); e2.name = 'TypeMismatchError'; return Promise.reject(e2); }
        return Promise.resolve(h);
      },
      getFileHandle: function (n, o) {
        if (!hijos.has(n)) {
          if (!o || !o.create) { var e = new Error('no existe: ' + n); e.name = 'NotFoundError'; return Promise.reject(e); }
          escrituras++;
          hijos.set(n, fich(n, ''));
        }
        var h = hijos.get(n);
        if (h.kind !== 'file') { var e2 = new Error(n + ' no es un fichero'); e2.name = 'TypeMismatchError'; return Promise.reject(e2); }
        return Promise.resolve(h);
      },
      removeEntry: function (n) { escrituras++; hijos.delete(n); return Promise.resolve(); },
      entries: function () {
        var it = hijos.entries();
        var iter = {};
        iter[Symbol.asyncIterator] = function () { return iter; };
        iter.next = function () {
          var r = it.next();
          return Promise.resolve(r.done ? { done: true, value: undefined } : { done: false, value: r.value });
        };
        return iter;
      }
    };
  }

  function fich(nombre, contenido, tipo) {
    var f = { kind: 'file', name: nombre, _texto: contenido || '' };
    f.getFile = function () {
      var bytes = f._texto;
      return Promise.resolve(new File([bytes], nombre, { type: tipo || 'text/plain', lastModified: f._modificado || Date.now() }));
    };
    f.createWritable = function () {
      escrituras++;
      f._modificado = null;   /* fila 291: escribir un fichero lo deja con la fecha de hoy («Traer el alumnado» rejuvenece el RegAlum de la demostración) */
      return Promise.resolve({
        write: function (c) {
          if (typeof c === 'string') { f._texto = c; return Promise.resolve(); }
          if (c && typeof c.arrayBuffer === 'function') {
            return c.arrayBuffer().then(function (b) { f._texto = new Uint8Array(b); });
          }
          f._texto = c;
          return Promise.resolve();
        },
        close: function () { return Promise.resolve(); }
      });
    };
    return f;
  }

  /* ---------- el almacén de mentira (Almacen usa `indexedDB` a pelo) --------- */

  function indexedDBDeMentira() {
    var guardado = new Map();
    return {
      open: function () {
        var p = {};
        setTimeout(function () {
          p.result = {
            objectStoreNames: { contains: function () { return true; } },
            createObjectStore: function () {},
            transaction: function () {
              var t = {};
              t.objectStore = function () {
                return {
                  put: function (v, k) { guardado.set(k, v); },
                  get: function (k) {
                    var r = {};
                    setTimeout(function () { r.result = guardado.get(k); if (r.onsuccess) r.onsuccess(); }, 0);
                    return r;
                  },
                  delete: function (k) { guardado.delete(k); }
                };
              };
              setTimeout(function () { if (t.oncomplete) t.oncomplete(); }, 0);
              return t;
            }
          };
          if (p.onsuccess) p.onsuccess();
        }, 0);
        return p;
      }
    };
  }

  /* ---------- activar ---------- */

  var activo = false;
  var raiz = null;

  function activar() {
    if (activo) return raiz;
    raiz = {
      abiertos: dir('ASUNTOS ABIERTOS'),
      archivo: dir('ARCHIVO'),
      bandeja: dir('GESTOR-BANDEJA'),
      centro: dir('CENTRO DE DATOS')   /* fila 312: la carpeta del Centro de datos, con su índice, que se llena al señalarla */
    };

    Object.defineProperty(window, 'indexedDB', { configurable: true, value: indexedDBDeMentira() });

    window.showDirectoryPicker = function (opciones) {
      var id = opciones && opciones.id;
      var h = id === 'gestor-archivo' ? raiz.archivo : (id === 'gestor-bandeja' ? raiz.bandeja : (id === 'gestor-centro-de-datos' ? raiz.centro : raiz.abiertos));
      if (id === 'gestor-centro-de-datos' && window.Demo && Demo.llenarCentro) return Demo.llenarCentro(h).then(function () { return h; });
      return Promise.resolve(h);
    };

    var externo = fich('descarga sin nombre.pdf', UN_PDF_PEQUENO(), 'application/pdf');
    window.showOpenFilePicker = function () { return Promise.resolve([externo]); };

    activo = true;
    return raiz;
  }

  /* Un PDF de una sola página, válido de verdad (no un PDF "a mano" a
     medias, que algún visor podría rechazar). */
  function UN_PDF_PEQUENO() {
    var l = [
      '%PDF-1.4',
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<<>>>>endobj',
      'trailer<</Size 4/Root 1 0 R>>',
      '%%EOF'
    ];
    return l.join('\n');
  }

  function reiniciar() {
    var base = location.origin + location.pathname;
    location.href = base + '?demo=1&auto=1';
  }

  window.Demo = {
    activar: activar,
    activo: function () { return activo; },
    disco: function () { return raiz; },
    ficheroDeMentira: fich,
    carpetaDeMentira: dir,   /* fila 318: una carpeta suelta, para js/demo/permisos.js */
    reiniciar: reiniciar,
    escrituras: function () { return escrituras; },
    reiniciarEscrituras: function () { escrituras = 0; }
  };
})();
