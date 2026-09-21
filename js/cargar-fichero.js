/* ============================================================
   cargar-fichero.js — leer un fichero estático de la propia
   aplicación, tanto si se sirve por http(s) (Vercel) como si se abre
   directamente desde el disco (`file://`, la copia sin internet:
   docs/COPIA-SIN-INTERNET.md, fila 89).

   En `file://` Chrome no deja hacer `fetch()` de ficheros ni
   `import()` de módulos, pero sí cargar `<script src>` clásicos
   (comprobado el 21-sep-2026). Así que en `file:` cada dato estático
   (un JSON, un PDF, un .docx) viaja como un `.js` en `copia-datos/`,
   generado por `scripts/copia-local.mjs`, que al cargarse hace
   `window.__COPIA__['<ruta>'] = <dato>` y nada más.

   CONTRATO de `App.leerFicheroDeLaApp(ruta, tipo)` (`tipo`: 'json' o
   'binario'), pensado para que cambiar un `fetch()` de toda la vida
   por esta función sea una sola línea, sin tocar el código de
   alrededor:
     - 'json'    -> devuelve el objeto ya interpretado (como
                    `await (await fetch(ruta)).json()`).
     - 'binario' -> devuelve un `Uint8Array` (como
                    `new Uint8Array(await (await fetch(ruta)).arrayBuffer())`,
                    que es como ya lo usaban los cinco sitios de la
                    tabla del diseño).
   Si el fichero no existe o falla la carga, lanza un `Error` con un
   mensaje legible, igual que antes hacía cada llamador a mano con
   `if (!resp.ok) throw ...`.

   NOMBRE DEL FICHERO EN `copia-datos/`: la propia `ruta` (p. ej.
   `datos/formularios.json`, `formularios/26mod0031.pdf`) con cada `/`
   cambiado por `~` y `.js` al final (`datos~formularios.json.js`).
   Sin colisiones: ninguna ruta de la aplicación trae `~`, y dos rutas
   distintas nunca dan el mismo nombre cambiado.

   CARGA PEREZOSA Y SIN DUPLICAR: cada `<script>` se inyecta una sola
   vez (un mapa de promesas, `promesasScript`, indexado por su `src`);
   una segunda petición de la misma ruta reutiliza la promesa en
   marcha, o el dato ya puesto en `window.__COPIA__` si ya terminó.

   Este fichero también trae `App.cargarPdfJs()`, compartida por los
   tres módulos que antes repetían casi el mismo código
   (`js/registro-lector.js`, `js/preparar-documento.js`,
   `js/pdf-separar-unir.js`): en `http(s)` sigue siendo `import()`
   (pdf.js 4.x solo se distribuye como módulo); en `file:` no se puede
   hacer `import()`, así que se cargan dos `<script>` clásicos con las
   versiones IIFE que genera `scripts/copia-local.mjs` con esbuild:
   primero `js/lib/pdf.worker.iife.js` (dentro se autoasigna
   `globalThis.pdfjsWorker = {...}`, con `WorkerMessageHandler`), y
   luego `js/lib/pdf.iife.js`, que deja `globalThis.pdfjsLib` puesto
   por el propio código de pdf.js (no por esbuild: sin `globalName`,
   a propósito, ver `scripts/copia-local.mjs`) — y ese valor puede
   llegar como una promesa sin resolver todavía (pdf.js trae, de
   fábrica, un `await` de nivel superior justo ahí, que
   `scripts/copia-local.mjs` tiene que quitar del origen para que
   esbuild pueda envolverlo en un `<script>` clásico), así que aquí se
   espera esa promesa si hace falta antes de dar la librería por
   cargada. pdf.js mira primero si `globalThis.pdfjsWorker` ya existe
   y, si es así, monta el "fake worker" en el hilo principal
   sin crear ningún `Worker` de verdad ni pedir `workerSrc` (visto en
   el propio `js/lib/pdf.min.mjs`, método privado `#J` de `PDFWorker`).

   Debe cargarse ANTES que `js/registro-lector.js`, `js/preparar-documento.js`
   y `js/pdf-separar-unir.js` (los tres llaman a `App.cargarPdfJs()`),
   y antes que `js/cargar-biblioteca.js`, `js/formularios.js`,
   `js/formularios-rellenar.js` y `js/plantillas-documento.js` (los
   cuatro llaman a `App.leerFicheroDeLaApp`). Le basta con que `App`
   exista (`js/nucleo.js`, ya cargado antes).
   ============================================================ */
(function () {

  var promesasScript = {};

  /* Inyecta un <script src> una sola vez; una segunda llamada con el
     mismo `src` reutiliza la promesa en marcha (o ya resuelta). */
  function cargarScriptUnaVez(src) {
    if (promesasScript[src]) return promesasScript[src];
    promesasScript[src] = new Promise(function (resolver, rechazar) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolver(); };
      s.onerror = function () { rechazar(new Error('No se ha podido cargar ' + src + '.')); };
      document.head.appendChild(s);
    });
    return promesasScript[src];
  }

  function nombreDeCopiaDatos(ruta) {
    return 'copia-datos/' + ruta.replace(/\//g, '~') + '.js';
  }

  /* El base64 que deja `copia-datos/*.js` para un binario, a bytes. */
  function base64ABytes(b64) {
    var binario = atob(b64);
    var bytes = new Uint8Array(binario.length);
    for (var i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return bytes;
  }

  App.leerFicheroDeLaApp = async function (ruta, tipo) {
    if (location.protocol !== 'file:') {
      var resp = await fetch(ruta);
      if (!resp.ok) throw new Error('no encuentro ' + ruta + ' (' + resp.status + ')');
      return tipo === 'binario' ? new Uint8Array(await resp.arrayBuffer()) : await resp.json();
    }

    window.__COPIA__ = window.__COPIA__ || {};
    if (!(ruta in window.__COPIA__)) {
      await cargarScriptUnaVez(nombreDeCopiaDatos(ruta));
      if (!(ruta in window.__COPIA__)) throw new Error('no encuentro ' + ruta + ' en la copia local.');
    }
    var valor = window.__COPIA__[ruta];
    return tipo === 'binario' ? base64ABytes(valor) : valor;
  };

  var cargandoPdfJs = null;

  App.cargarPdfJs = function () {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (cargandoPdfJs) return cargandoPdfJs;

    if (location.protocol === 'file:') {
      /* `js/lib/pdf.iife.js` (generado por scripts/copia-local.mjs)
         deja `globalThis.pdfjsLib` puesto por el propio código de
         pdf.js, no por nosotros — y ese código, de verdad, lo asigna
         a partir de una promesa (por eso `scripts/copia-local.mjs`
         tuvo que quitarle un `await` de nivel superior para que
         esbuild pudiera envolverlo en un `<script>` clásico). Aquí se
         espera esa promesa si hace falta, antes de dar la librería
         por cargada. */
      cargandoPdfJs = cargarScriptUnaVez('js/lib/pdf.worker.iife.js')
        .then(function () { return cargarScriptUnaVez('js/lib/pdf.iife.js'); })
        .then(async function () {
          var lib = window.pdfjsLib;
          if (lib && typeof lib.then === 'function') lib = await lib;
          if (!lib || typeof lib.getDocument !== 'function') throw new Error();
          window.pdfjsLib = lib;
          return lib;
        }, function () { throw new Error('No se ha podido cargar pdf.js.'); });
    } else {
      /* Ruta relativa a ESTE fichero (js/cargar-fichero.js), como ya
         hacía cada uno de los tres módulos por su cuenta. */
      cargandoPdfJs = import('./lib/pdf.min.mjs').then(function (modulo) {
        window.pdfjsLib = modulo;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/lib/pdf.worker.min.mjs';
        return window.pdfjsLib;
      }, function () {
        throw new Error('No se ha podido cargar pdf.js.');
      });
    }
    return cargandoPdfJs;
  };
})();
